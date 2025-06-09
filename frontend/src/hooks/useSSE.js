import { useEffect } from "react";

export default function useSSE(taskId, onSuccess, onFailure, onProgress) {
  useEffect(() => {
    if (!taskId) return;

    const source = new EventSource(`${import.meta.env.VITE_API_BASE_URL}/api/events/${taskId}`);

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.status === "SUCCESS" || data.status === "completed") {
          onSuccess?.(data);
          source.close();
        } else if (data.status === "failed" || data.status === "FAILURE") {
          onFailure?.(data);
          source.close();
        } else {
          // ✅ כאן נעדכן את פס ההתקדמות
          if (typeof data.progress === "number") {
            onProgress?.(data.progress);
          }
        }
      } catch (err) {
        console.error("שגיאה בניתוח SSE:", err);
        onFailure?.({ error: "שגיאת SSE" });
        source.close();
      }
    };

    source.onerror = (err) => {
      console.error("SSE Error", err);
      source.close();
    };

    return () => {
      source.close();
    };
  }, [taskId, onSuccess, onFailure, onProgress]);
}
