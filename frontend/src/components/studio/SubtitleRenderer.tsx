import React, { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

function getVideoBox(
  containerRect,
  videoWidth,
  videoHeight
) {
  const videoAspect = videoWidth / videoHeight;
  const containerAspect = containerRect.width / containerRect.height;

  let width, height, left, top;

  if (videoAspect > containerAspect) {
    width = containerRect.width;
    height = width / videoAspect;
    left = 0;
    top = (containerRect.height - height) / 2;
  } else {
    height = containerRect.height;
    width = height * videoAspect;
    top = 0;
    left = (containerRect.width - width) / 2;
  }

  return { width, height, left, top };
}

export const SubtitleRenderer = ({
  segment,
  currentTime,
  videoContainerRef,
  videoResolution,
  isRTL = false,
  isSelected = false,
  editingMode = false,
  editingText = '',
  onEditChange,
  onEditFinish,
  onEditCancel,
  onMouseDown,
  onTouchStart,
  onClick,
  onDoubleClick,
  scaleFactor = 1,
  globalScale = 1,
  liveEditMode = false,
}) => {
  const subtitleRef = useRef(null);

  const containerRect = videoContainerRef.current?.getBoundingClientRect() ?? {
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  };

  const videoBox = getVideoBox(
    containerRect,
    videoResolution.width,
    videoResolution.height
  );

  const leftPx = videoBox.left + (segment.style.x / 100) * videoBox.width;
  const topPx = videoBox.top + (segment.style.y / 100) * videoBox.height;

  const wordProgress = (t, w) =>
    Math.min(1, Math.max(0, (t - w.start) / Math.max(0.0001, w.end - w.start)));

  // Enhanced font size calculation with global scaling
  const scaledFontSize = useMemo(() => {
    if (!videoBox.width || !videoBox.height || !videoResolution.width) {
      return (segment.style.fontSize ?? 48) * scaleFactor * globalScale;
    }
    const scaleX = videoBox.width / videoResolution.width;
    const scaleY = videoBox.height / videoResolution.height;
    const scale = Math.min(scaleX, scaleY);
    const baseFontSize = (segment.style.fontSize ?? 48) * scaleFactor * globalScale;
    return Math.max(
      12,
      Math.min(baseFontSize * scale, videoBox.width * 0.12)
    );
  }, [segment.style.fontSize, videoBox, videoResolution, scaleFactor, globalScale]);

  const renderText = () => {
    const modeClass = segment.style.wordMode || 'none';

    // Static text mode
    if (modeClass === 'none') {
      return (
        <span
          className="subtitle-text-static"
          style={{
            whiteSpace: 'nowrap',
            textAlign: 'center',
            display: 'block'
          }}
        >
          {segment.text}
        </span>
      );
    }

    // Generate words array if not provided
    const words = (segment.words && segment.words.length
      ? segment.words
      : segment.text.split(/\s+/).filter(Boolean).map((word, i, arr) => ({
          word,
          start: segment.start + (i * (segment.end - segment.start)) / Math.max(1, arr.length),
          end: segment.start + ((i + 1) * (segment.end - segment.start)) / Math.max(1, arr.length),
        }))) ?? [];

    // Karaoke fill effect with smooth progress
    if (modeClass === 'karaoke-fill') {
      return (
        <span
          className="karaoke-container"
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            direction: isRTL ? 'rtl' : 'ltr',
            unicodeBidi: 'embed',
            position: 'relative',
          }}
        >
          {words.map((w, i) => {
            const progress = wordProgress(currentTime, w);
            return (
              <span
                key={i}
                className="karaoke-word"
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  margin: isRTL ? '0 0 0 0.3em' : '0 0.3em 0 0',
                  overflow: 'hidden',
                }}
              >
                <span
                  className="karaoke-base"
                  style={{
                    color: segment.style.color,
                    textShadow: segment.style.textShadow,
                    fontFamily: segment.style.fontFamily,
                    fontWeight: segment.style.fontWeight,
                  }}
                >
                  {w.word}
                </span>
                <span
                  className="karaoke-fill"
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: isRTL ? 'auto' : 0,
                    right: isRTL ? 0 : 'auto',
                    width: `${progress * 100}%`,
                    transition: 'width 0.15s ease-out',
                    color: segment.style.highlightColor || '#F8FF1C',
                    textShadow: `0 0 8px ${segment.style.highlightColor || '#F8FF1C'}`,
                    fontFamily: segment.style.fontFamily,
                    fontWeight: segment.style.fontWeight || 900,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                  }}
                >
                  {w.word}
                </span>
              </span>
            );
          })}
        </span>
      );
    }

    // Progressive word reveal
    if (modeClass === 'progressive-word-only') {
      const activeIndex = words.findIndex(
        (w) => currentTime >= w.start && currentTime < w.end
      );

      if (activeIndex === -1) return null;

      return (
        <motion.div
          className="progressive-container"
          style={{
            display: 'inline-flex',
            gap: '0.4em',
            whiteSpace: 'nowrap',
            alignItems: 'baseline',
            justifyContent: 'center'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {words.slice(0, activeIndex + 1).map((w, i) => {
            const isActive = i === activeIndex;
            return (
              <motion.span
                key={i}
                className={`progressive-word ${isActive ? 'active' : 'past'}`}
                initial={i === activeIndex ? { scale: 0.8, opacity: 0, y: 20 } : undefined}
                animate={i === activeIndex ? { scale: 1.05, opacity: 1, y: 0 } : undefined}
                transition={{
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
                style={{
                  color: isActive
                    ? segment.style.highlightColor || '#F8FF1C'
                    : segment.style.color,
                  textShadow: isActive
                    ? `0 0 12px ${segment.style.highlightColor || '#F8FF1C'}, 0 2px 8px rgba(0,0,0,0.4)`
                    : segment.style.textShadow,
                  fontWeight: isActive ? 900 : segment.style.fontWeight,
                }}
              >
                {w.word}
              </motion.span>
            );
          })}
        </motion.div>
      );
    }

    // YouTube style highlight
    if (modeClass === 'youtube') {
      return (
        <span
          className="youtube-container"
          style={{
            display: 'inline-flex',
            gap: '0.3em',
            whiteSpace: 'nowrap',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {words.map((w, i) => {
            const isActive = currentTime >= w.start && currentTime < w.end;
            return (
              <motion.span
                key={i}
                className={`youtube-word ${isActive ? 'active' : ''}`}
                animate={isActive ? {
                  scale: 1.05,
                  backgroundColor: segment.style.highlightColor || '#F8FF1C'
                } : {
                  scale: 1,
                  backgroundColor: 'transparent'
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{
                  color: isActive ? '#000' : segment.style.color,
                  padding: isActive ? '0.2em 0.4em' : '0.2em 0.1em',
                  borderRadius: '0.3em',
                  textShadow: isActive ? 'none' : segment.style.textShadow,
                  fontWeight: segment.style.fontWeight,
                }}
              >
                {w.word}
              </motion.span>
            );
          })}
        </span>
      );
    }

    // Default word-by-word with effects
    return (
      <span
        className="default-word-container"
        style={{
          display: 'inline-flex',
          gap: '0.25em',
          whiteSpace: 'nowrap',
          alignItems: 'center',
        }}
      >
        {words.map((w, i) => {
          const isActive = currentTime >= w.start && currentTime < w.end;
          return (
            <motion.span
              key={i}
              className={`default-word ${isActive ? 'active' : ''}`}
              animate={isActive ? {
                scale: 1.08,
                color: segment.style.highlightColor || '#F8FF1C'
              } : {
                scale: 1,
                color: segment.style.color
              }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                textShadow: isActive
                  ? `0 0 10px ${segment.style.highlightColor || '#F8FF1C'}`
                  : segment.style.textShadow,
              }}
            >
              {w.word}
            </motion.span>
          );
        })}
      </span>
    );
  };

  return (
    <motion.div
      ref={subtitleRef}
      data-subtitle-id={segment.id}
      className={`absolute select-none cursor-grab transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-blue-400 ring-opacity-80 shadow-xl shadow-blue-400/30'
          : liveEditMode
          ? 'hover:ring-1 hover:ring-slate-400 hover:ring-opacity-60'
          : ''
      } group subtitle-container`}
      style={{
        left: `${leftPx}px`,
        top: `${topPx}px`,
        transform: `translate(-50%, -50%) scale(${isSelected ? 1.02 : 1})`,
        maxWidth: '90%',
        fontSize: `${scaledFontSize}px`,
        fontFamily: segment.style.fontFamily,
        color: segment.style.color,
        backgroundColor: segment.style.wordMode === 'none'
          ? (segment.style.backgroundColor || 'transparent')
          : 'transparent',
        textShadow: segment.style.textShadow,
        fontWeight: segment.style.fontWeight,
        padding: segment.style.wordMode === 'none' ? '0.3em 0.6em' : '0.4em 0.8em',
        borderRadius: '0.5em',
        lineHeight: 1.2,
        textAlign: 'center',
        direction: isRTL ? 'rtl' : 'ltr',
        whiteSpace: 'nowrap',
        overflow: 'visible',
        zIndex: isSelected ? 30 : 20,
        '--hl': segment.style.highlightColor || '#F8FF1C',
        backdropFilter: isSelected ? 'blur(1px)' : 'none',
        willChange: 'transform, opacity',
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isSelected ? 1.02 : 1,
      }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      whileHover={{
        scale: isSelected ? 1.03 : 1.01,
        transition: { duration: 0.15 }
      }}
    >
      {editingMode ? (
        <textarea
          value={editingText}
          onChange={(e) => onEditChange?.(e.target.value)}
          onBlur={onEditFinish}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onEditFinish?.();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              onEditCancel?.();
            }
          }}
          autoFocus
          className="bg-slate-800/90 border-2 border-blue-400 outline-none resize-none text-center w-full rounded-lg backdrop-blur-sm"
          style={{
            fontSize: 'inherit',
            fontFamily: 'inherit',
            color: 'inherit',
            direction: isRTL ? 'rtl' : 'ltr',
            minHeight: '2em',
          }}
        />
      ) : (
        renderText()
      )}

      {/* Enhanced selection indicator */}
      {isSelected && (
        <motion.div
          className="absolute -inset-3 border-2 border-blue-400 rounded-xl pointer-events-none bg-blue-400/5 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Live edit mode indicator */}
      {liveEditMode && !isSelected && (
        <motion.div
          className="absolute -top-2 -right-2 w-3 h-3 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
};