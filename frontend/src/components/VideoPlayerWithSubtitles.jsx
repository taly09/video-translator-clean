import { useEffect, useRef, useState } from "react";

export default function VideoPlayerWithSubtitles({
  videoUrl,
  segments,
  setSegments,
  taskId,
  subtitleStyle,
  setSubtitleStyle,
  subtitlePosition,          // קיבלנו מהמעלה
  setSubtitlePosition,       // קיבלנו מהמעלה
}) {
  const videoRef = useRef(null);
  const subtitleRef = useRef(null);

  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(null);
  const [saving, setSaving] = useState(false);

  const saveTimeoutRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const video = videoRef.current;

    const onTimeUpdate = () => {
      const time = video.currentTime;
      let foundSegmentIndex = null;
      let foundWordIndex = null;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (time >= segment.start && time <= segment.end) {
          foundSegmentIndex = i;
          const words = segment.words || [];
          foundWordIndex = words.findIndex(w => time >= w.start && time <= w.end);
          break;
        }
      }

      setCurrentSegmentIndex(foundSegmentIndex);
      setCurrentWordIndex(foundWordIndex);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [segments]);

  // 🟨 גרירה
  const handleMouseDown = (e) => {
    const videoBox = videoRef.current.getBoundingClientRect();
    const subtitleBox = subtitleRef.current.getBoundingClientRect();

    setDragOffset({
      x: e.clientX - subtitleBox.left,
      y: e.clientY - subtitleBox.top
    });

    setDragging(true);
  };

  const handleMouseMove = (e) => {
    if (dragging && videoRef.current) {
      const videoBox = videoRef.current.getBoundingClientRect();

      const newX = e.clientX - videoBox.left - dragOffset.x;
      const newY = e.clientY - videoBox.top - dragOffset.y;

      setSubtitlePosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  const saveSegments = async (segmentsToSave) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/transcriptions/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segments: segmentsToSave }),
      });

      const json = await res.json();
      if (json.status === "success") {
        console.log("✅ כתוביות נשמרו בהצלחה!");
      } else {
        console.warn("⚠️ שגיאה בשמירת הכתוביות");
      }
    } catch (e) {
      console.error("❌ שגיאה בשמירת הכתוביות:", e);
    } finally {
      setSaving(false);
    }
  };

  const scheduleSave = (updatedSegments) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveSegments(updatedSegments);
    }, 500);
  };

  const handleWordChange = (segmentIndex, wordIndex, newText) => {
    const updated = [...segments];
    const segment = { ...updated[segmentIndex] };
    const words = [...(segment.words || [])];
    words[wordIndex] = { ...words[wordIndex], word: newText };
    segment.words = words;
    segment.text = words.map(w => w.word).join(" ");
    updated[segmentIndex] = segment;

    setSegments(updated);
    scheduleSave(updated);
  };

  const styleSettings = {
    simple: { color: "white", fontWeight: "normal", animation: "none" },
    highlighted: { color: "#ffd700", fontWeight: "bold", animation: "none" },
    animated: { color: "#ffd700", fontWeight: "bold", animation: "pulse 1.5s infinite" },
  };

  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        style={{ width: "100%", borderRadius: 8 }}
      />

      <div style={{ marginTop: 10 }}>
        <label>בחר סגנון כתוביות: </label>
        <select
          value={subtitleStyle}
          onChange={e => setSubtitleStyle(e.target.value)}
          disabled={saving}
        >
          <option value="simple">פשוט</option>
          <option value="highlighted">מודגש מילה אחרי מילה</option>
          <option value="animated">מודגש עם אנימציה</option>
        </select>
      </div>

      {currentSegmentIndex !== null && segments[currentSegmentIndex] && (
        <div
          ref={subtitleRef}
          onMouseDown={handleMouseDown}
          style={{
            position: "absolute",
            left: subtitlePosition.x,
            top: subtitlePosition.y,
            transform: "translate(-50%, -50%)",
            fontSize: "2rem",
            textShadow: "2px 2px 10px black",
            userSelect: "text",
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "0.15rem",
            padding: "0 10px",
            cursor: dragging ? "grabbing" : "grab",
            zIndex: 3
          }}
        >
          {(segments[currentSegmentIndex].words || []).map((word, idx) => {
            const isActive = idx === currentWordIndex;
            const style = {
              color: isActive
                ? styleSettings[subtitleStyle].color
                : "white",
              fontWeight: isActive
                ? styleSettings[subtitleStyle].fontWeight
                : "normal",
              cursor: "text",
              animation: isActive
                ? styleSettings[subtitleStyle].animation
                : "none",
            };
            return (
              <span
                key={idx}
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                style={style}
                onBlur={e => {
                  const newText = e.target.textContent.trim();
                  if (newText && newText !== word.word) {
                    handleWordChange(currentSegmentIndex, idx, newText);
                  }
                }}
              >
                {word.word}
              </span>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { text-shadow: 0 0 5px #ffd700; }
          50% { text-shadow: 0 0 20px #fff700; }
          100% { text-shadow: 0 0 5px #ffd700; }
        }
      `}</style>
    </div>
  );
}
