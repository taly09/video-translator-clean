import { useState, useEffect, useRef } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:8765"
    : "https://video-translator-backend.onrender.com");

const TASK_KEY = "active_transcription_task";

export function useTranscriptionBackend() {
  const [status, setStatus] = useState({
    step: "idle",
    stepLabel: "",
    progress: 0,
  });
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const pollIntervalRef = useRef(null);
  const lastResultRef = useRef(null);

  const resetState = () => {
    setStatus({ step: "idle", stepLabel: "", progress: 0 });
    setIsPolling(false);
    setError(null);
    clearInterval(pollIntervalRef.current);
    lastResultRef.current = null;
    localStorage.removeItem(TASK_KEY);
  };

  const pollStatus = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/transcribe/status/${taskId}`);
      if (!res.ok) throw new Error("Failed to get status");
      const data = await res.json();

      if (data.status === "completed" || data.progress >= 100) {
        clearInterval(pollIntervalRef.current);
        setIsPolling(false);
        setStatus({
          step: "done",
          stepLabel: "הושלם",
          progress: 100,
        });
        localStorage.removeItem(TASK_KEY);
        lastResultRef.current = {
          taskId,
          text: data.text || "",
          srt_url: data.srt_url || null,
        };
      } else if (data.status === "failed") {
        clearInterval(pollIntervalRef.current);
        setError(data.message || "תהליך נכשל");
        setStatus({
          step: "failed",
          stepLabel: "נכשל",
          progress: 0,
        });
        localStorage.removeItem(TASK_KEY);
      } else {
        setStatus({
          step: "processing",
          stepLabel: data.step || "מעבד...",
          progress: data.progress || 0,
        });
      }
    } catch (err) {
      setError("בעיה בחיבור לשרת: " + err.message);
    }
  };

  const uploadAndProcess = async (file, { language, translate_to }) => {
    const formData = new FormData();
    formData.append("video", file);
    formData.append("language", language);
    formData.append("translate_to", translate_to || "");

    try {
      const res = await fetch(`${API_BASE_URL}/api/transcribe/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
      }

      const data = await res.json();

      if (data.task_id) {
        localStorage.setItem(TASK_KEY, data.task_id);
        setIsPolling(true);
        setStatus({
          step: "processing",
          stepLabel: "מעבד...",
          progress: 0,
        });

        pollIntervalRef.current = setInterval(() => {
          pollStatus(data.task_id);
        }, 3000);

        return await new Promise((resolve) => {
          const check = () => {
            if (
              lastResultRef.current &&
              lastResultRef.current.taskId === data.task_id
            ) {
              resolve(lastResultRef.current);
            } else {
              setTimeout(check, 500);
            }
          };
          check();
        });
      } else {
        throw new Error("No task_id returned from server");
      }
    } catch (err) {
      setError("שגיאה: " + err.message);
      setIsPolling(false);
      return null;
    }
  };

  const resumeLastTask = () => {
    const taskId = localStorage.getItem(TASK_KEY);
    if (taskId) {
      setIsPolling(true);
      pollStatus(taskId);
      pollIntervalRef.current = setInterval(() => {
        pollStatus(taskId);
      }, 3000);
    }
  };

  useEffect(() => {
    // אם רוצים שהפולינג יתחדש אוטומטית:
    // resumeLastTask();
    return () => clearInterval(pollIntervalRef.current);
  }, []);

  return {
    status,
    isPolling,
    error,
    uploadAndProcess,
    resumeLastTask,
    resetState,
  };
}
