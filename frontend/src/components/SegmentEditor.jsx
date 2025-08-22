import React, { useState } from "react";
import { toast } from "react-toastify";

export default function SegmentEditor({ taskId, segments: initialSegments }) {
  const [segments, setSegments] = useState(initialSegments);
  const [saving, setSaving] = useState(false);

  const handleChange = (i, newText) => {
    const updated = [...segments];
    updated[i].text = newText;
    setSegments(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/transcriptions/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          segments
        })
      });

      const json = await res.json();
      if (json.status === "success") {
        toast.success("✅ נשמר בהצלחה");
      } else {
        toast.error("שגיאה בשמירה");
      }
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בחיבור");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>📝 עריכת כתוביות</h3>
      <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid #ccc", padding: 10 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: "0.9rem", color: "#666" }}>
              {formatTime(seg.start)} - {formatTime(seg.end)}
            </div>
            <textarea
              value={seg.text}
              onChange={(e) => handleChange(i, e.target.value)}
              rows={2}
              style={{ width: "100%", fontSize: "1rem", padding: "6px" }}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          marginTop: 10,
          background: "#00c896",
          color: "white",
          padding: "10px 16px",
          border: "none",
          borderRadius: 6,
          cursor: "pointer"
        }}
      >
        💾 {saving ? "שומר..." : "שמור שינויים"}
      </button>
    </div>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
