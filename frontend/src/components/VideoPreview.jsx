import React, { useRef, useState, useEffect } from "react";

export const RENDER_WIDTH = 1920;
export const RENDER_HEIGHT = 1080;

// קח את הפונט שלך אם שונה
const DEFAULT_FONT = "Rubik Bold, Arial, sans-serif";

export function VideoPreview({
  videoUrl,
  subtitles,
  currentTime,
  selectedSubtitleId,
  isRTL,
  onSubtitleClick,
  onSubtitleDoubleClick,
  onSubtitleDragStart,
  onSubtitleDrag,
  onSubtitleDragEnd,
  editingSubtitleId,
  editingText,
  setEditingText,
  handleFinishEditing,
  videoContainerRef // 👈 קבל אותו כאן מהפרופס!
}) {
// אל תיצור פה ref, תקבל אותו מהפרופס!
  const [containerWidth, setContainerWidth] = useState(RENDER_WIDTH);

  useEffect(() => {
    const updateWidth = () => {
      if (videoContainerRef.current) {
        setContainerWidth(videoContainerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // מתחשב בגודל המסך כדי לשמר פרופורציה
  const scale = containerWidth / RENDER_WIDTH;
  const getScaledFontSize = (fontSize) => Math.max(10, fontSize * scale);

  // הצג רק את הכתובית הנכונה לזמן הזה
  const currentSubtitle = subtitles.find(
    (sub) => currentTime >= sub.start && currentTime < sub.end
  );

  return (
    <div
      ref={videoContainerRef}
      style={{
        width: "100%",
        maxWidth: 540,
        aspectRatio: `${RENDER_WIDTH} / ${RENDER_HEIGHT}`,
        position: "relative",
        background: "#000",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 0 24px #0008"
      }}
    >
      <video
        src={videoUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block"
        }}
        controls
      />
      {/* כתובית פעילה */}
      {currentSubtitle && (
        <div
          key={currentSubtitle.id}
          onMouseDown={(e) => onSubtitleDragStart && onSubtitleDragStart(e, currentSubtitle)}
onTouchStart={(e) => onSubtitleDragStart && onSubtitleDragStart(e, currentSubtitle)}


          onClick={(e) => onSubtitleClick && onSubtitleClick(currentSubtitle, e)}
          onDoubleClick={(e) => onSubtitleDoubleClick && onSubtitleDoubleClick(currentSubtitle, e)}
          className={`group absolute pointer-events-auto cursor-grab select-none whitespace-pre-wrap ${selectedSubtitleId === currentSubtitle.id ? 'ring-2 ring-pink-500' : ''}`}
          style={{
            left: `${currentSubtitle.style.x}%`,
            top: `${currentSubtitle.style.y}%`,
            transform: "translate(-50%, -50%)",
            fontSize: `${getScaledFontSize(currentSubtitle.style.fontSize)}px`,
            fontFamily: currentSubtitle.style.fontFamily || DEFAULT_FONT,
            color: currentSubtitle.style.color,
            backgroundColor: currentSubtitle.style.backgroundColor,
            textShadow: currentSubtitle.style.textShadow,
            fontWeight: currentSubtitle.style.fontWeight,
            borderRadius: 10,
            padding: "10px 18px",
            textAlign: "center",
            maxWidth: "90%",
            lineHeight: 1.2,
            direction: isRTL ? "rtl" : "ltr",
            zIndex: 2,
          }}
        >
          {/* עריכת טקסט */}
          {editingSubtitleId === currentSubtitle.id ? (
            <textarea
              value={editingText}
              onChange={e => setEditingText(e.target.value)}
              onBlur={handleFinishEditing}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) handleFinishEditing();
                if (e.key === "Escape") setEditingText("");
              }}
              autoFocus
              className="bg-transparent border-2 border-pink-400 outline-none resize-none"
              style={{ fontSize: "inherit", fontFamily: "inherit", color: "inherit", textAlign: "center", width: "100%", minHeight: "1.5em" }}
              dir={isRTL ? "rtl" : "ltr"}
            />
          ) : (
            currentSubtitle.text
          )}
        </div>
      )}
    </div>
  );
}
