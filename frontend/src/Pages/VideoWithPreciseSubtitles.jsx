import React, { useRef, useState, useEffect } from "react";

export function VideoWithPreciseSubtitles({
  videoUrl,
  subtitles,
  videoResolution,
  onTimeUpdate,
  currentTime,
  onPositionChange,
  onLoadedMetadata,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [draggingId, setDraggingId] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateVideoSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setVideoSize({ width: rect.width, height: rect.height });
    };
    updateVideoSize();
    window.addEventListener("resize", updateVideoSize);
    return () => window.removeEventListener("resize", updateVideoSize);
  }, [videoUrl]);

  // שימוש ב-pointer events לגרירה במקום עכבר/טאץ' נפרדים
  useEffect(() => {
    const onPointerMove = (e) => {
      if (!draggingId) return;

      e.preventDefault();

      const containerRect = containerRef.current.getBoundingClientRect();
      let clientX = e.clientX;
      let clientY = e.clientY;

      let newX = ((clientX - containerRect.left - dragOffset.current.x) / containerRect.width) * 100;
      let newY = ((clientY - containerRect.top - dragOffset.current.y) / containerRect.height) * 100;

      newX = Math.min(98, Math.max(2, newX));
      newY = Math.min(98, Math.max(2, newY));

      if (typeof onPositionChange === "function") {
        onPositionChange(draggingId, { x: newX, y: newY });
      }
    };

    const onPointerUp = () => {
      setDraggingId(null);
      document.body.style.cursor = 'default';
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [draggingId, onPositionChange]);

  const onPointerDown = (e, sub) => {
    e.preventDefault();
    setDraggingId(sub.id);
    document.body.style.cursor = 'grabbing';

    const rect = e.currentTarget.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;

    dragOffset.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const getFontSizeScaled = (fontSize) => {
    if (!videoResolution.width || !videoResolution.height) return fontSize;
    const scaleX = videoSize.width / videoResolution.width;
    const scaleY = videoSize.height / videoResolution.height;
    const scale = Math.min(scaleX, scaleY);
    return Math.max(12, fontSize * scale);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: videoResolution.width,
        margin: "0 auto",
        backgroundColor: "black",
        userSelect: draggingId ? "none" : "text",
        cursor: draggingId ? "grabbing" : "default",
        touchAction: draggingId ? "none" : "auto",  // חשוב למנוע גלילה בזמן גרירה בטאץ'
      }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        style={{
          width: "100%",
          height: "auto",
          objectFit: "contain",
          display: "block",
          backgroundColor: "black",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: videoSize.width,
          height: videoSize.height,
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        {subtitles.map((sub) => {
          if (currentTime < sub.start || currentTime > sub.end) return null;
          return (
            <div
              key={sub.id}
              onPointerDown={(e) => onPointerDown(e, sub)}
              style={{
                position: "absolute",
                left: `${sub.style.x}%`,
                top: `${sub.style.y}%`,
                transform: "translate(-50%, -50%)",
                fontSize: `${getFontSizeScaled(sub.style.fontSize)}px`,
                fontFamily: sub.style.fontFamily,
                fontWeight: sub.style.fontWeight,
                color: sub.style.color,
                backgroundColor: sub.style.backgroundColor,
                textShadow: sub.style.textShadow,
                padding: "0.2em 0.5em",
                maxWidth: "90%",
                whiteSpace: "pre-wrap",
                textAlign: "center",
                pointerEvents: "auto",
                userSelect: draggingId === sub.id ? "none" : "text",
                cursor: draggingId === sub.id ? "grabbing" : "grab",
                opacity: draggingId === sub.id ? 0.7 : 1,
                borderRadius: 4,
                touchAction: "none", // מונע גלילה בטאץ' בזמן גרירה
              }}
            >
              {sub.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
