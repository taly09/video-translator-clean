import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function TranscriptionResult() {
  const { taskId } = useParams();
  const [transcription, setTranscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/transcriptions/${taskId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTranscription(data.data);
        } else {
          setError("לא נמצא תמלול");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("שגיאה בטעינת התמלול");
        setLoading(false);
      });
  }, [taskId]);

  if (loading) return <p>טוען...</p>;
  if (error) return <p>{error}</p>;

  const files = transcription.r2_urls || {};

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      <h1>תוצאות תמלול</h1>
      <ul>
        {files.srt && (
          <li>
            <a href={files.srt} target="_blank" rel="noopener noreferrer">
              הורדת קובץ SRT
            </a>
          </li>
        )}
        {files.txt && (
          <li>
            <a href={files.txt} target="_blank" rel="noopener noreferrer">
              הורדת קובץ TXT
            </a>
          </li>
        )}
        {files.pdf && (
          <li>
            <a href={files.pdf} target="_blank" rel="noopener noreferrer">
              הורדת קובץ PDF
            </a>
          </li>
        )}
        {files.docx && (
          <li>
            <a href={files.docx} target="_blank" rel="noopener noreferrer">
              הורדת קובץ DOCX
            </a>
          </li>
        )}
      </ul>
      {files.mp4 && (
        <video
          controls
          style={{ maxWidth: "100%", marginTop: 20 }}
          preload="metadata"
        >
          <source src={files.mp4} type="video/mp4" />
          הדפדפן שלך לא תומך בנגן וידאו.
        </video>
      )}
    </div>
  );
}
