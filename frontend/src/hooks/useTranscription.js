import { useState, useEffect } from "react";
import { Transcription } from "@/entities/Transcription";
import { parseSRTToBlocks, extractFilename } from "@/utils/srtUtils";

export function useTranscription(id) {
  const [transcription, setTranscription] = useState(null);
  const [srtBlocks, setSrtBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const extractFilename = (url) => {
    if (!url) return "";
    try {
      return new URL(url).pathname.split("/").pop();
    } catch {
      return url.split("/").pop();
    }
  };

  const parseSRTToBlocks = (srtText) => {
    if (!srtText) return [];
    const blocks = [];
    const entries = srtText.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
    for (const entry of entries) {
      const lines = entry.trim().split("\n");
      if (lines.length < 2) continue;
      const timeMatch = lines[1].match(/^(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})$/);
      if (!timeMatch) continue;
      blocks.push({
        start: timeMatch[1],
        end: timeMatch[2],
        text: lines.slice(2).join("\n").trim(),
      });
    }
    return blocks;
  };

  useEffect(() => {
    if (!id) {
      setError("לא סופק מזהה תמלול");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await Transcription.get(id);
        if (!data) throw new Error("התמלול לא נמצא");

        const statusRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/transcribe/status/${id}`
        );
        const statusData = await statusRes.json();

        const fullData = { ...data, ...statusData };
        if (!fullData.id) fullData.id = id;

        setTranscription(fullData);

        if (fullData.srt_url) {
          const filename = fullData.srt_url.split("/").pop();
          const srtUrl = `${import.meta.env.VITE_API_BASE_URL}/api/proxy/results/${fullData.id}/${filename}?t=${Date.now()}`;

          try {
            const srtRes = await fetch(srtUrl, { credentials: "include" });
            if (srtRes.ok) {
              const srtText = await srtRes.text();
              setSrtBlocks(parseSRTToBlocks(srtText));
            } else if (fullData.content) {
              setSrtBlocks(parseSRTToBlocks(fullData.content));
            }
          } catch {
            if (fullData.content) {
              setSrtBlocks(parseSRTToBlocks(fullData.content));
            }
          }
        } else if (fullData.content) {
          setSrtBlocks(parseSRTToBlocks(fullData.content));
        }
      } catch (e) {
        setError(e.message || "שגיאה בטעינה");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return {
    transcription,
    setTranscription,
    srtBlocks,
    setSrtBlocks,
    isLoading,
    error,
  };
}
