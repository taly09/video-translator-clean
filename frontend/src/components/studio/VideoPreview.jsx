import React, { forwardRef, useImperativeHandle, useRef, useCallback, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Move, Edit3, MousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VideoPreview = forwardRef(({
  videoUrl,
  currentTime,
  duration,
  isPlaying,
  currentSubtitle,
  selectedSubtitleId,
  editingSubtitleId,
  editingText,
  isRTL,
  isMobile,
  highlightedWords,
  onTimeUpdate,
  onLoadedMetadata,
  onPlay,
  onPause,
  onSubtitleClick,
  onSubtitleDrag,
  onEditModeEnter,
  onEditingTextChange,
  onEditingFinish,
  onSeek
}, ref) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [videoResolution, setVideoResolution] = useState({ width: 1920, height: 1080 });

  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    seek: (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    getCurrentTime: () => videoRef.current?.currentTime || 0,
    getDuration: () => videoRef.current?.duration || 0
  }));

  const handleVideoMetadata = useCallback(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      setVideoResolution({
        width: video.videoWidth || 1920,
        height: video.videoHeight || 1080
      });
      onLoadedMetadata();
    }
  }, [onLoadedMetadata]);

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  const handleMouseDown = useCallback((e, subtitle) => {
    if (editingSubtitleId) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    setDragOffset({
      x: currentX - subtitle.style.x,
      y: currentY - subtitle.style.y
    });

    setIsDragging(true);
    onSubtitleClick(subtitle);
  }, [editingSubtitleId, onSubtitleClick]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !selectedSubtitleId) return;

    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newX = Math.max(5, Math.min(95, x - dragOffset.x));
    const newY = Math.max(5, Math.min(95, y - dragOffset.y));

    onSubtitleDrag(selectedSubtitleId, { x: newX, y: newY });
  }, [isDragging, selectedSubtitleId, dragOffset, onSubtitleDrag]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const renderHighlightedText = useCallback((text, style, segmentId) => {
    const wordToHighlight = highlightedWords[segmentId];
    if (!wordToHighlight) return text;

    try {
      const regex = new RegExp(`(\\b${wordToHighlight}\\b)`, 'gi');
      return text.split(regex).map((part, i) =>
        part.toLowerCase() === wordToHighlight.toLowerCase() ? (
          <span
            key={i}
            style={{
              backgroundColor: style.highlightColor || '#FFFF00',
              color: '#000000',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            {part}
          </span>
        ) : part
      );
    } catch (e) {
      return text;
    }
  }, [highlightedWords]);

  const getScaledFontSize = useCallback((fontSize) => {
    if (!containerRef.current) return fontSize;

    const containerRect = containerRef.current.getBoundingClientRect();
    const scaleX = containerRect.width / videoResolution.width;
    const scaleY = containerRect.height / videoResolution.height;
    const scale = Math.min(scaleX, scaleY);

    return Math.max(12, fontSize * scale);
  }, [videoResolution]);

  const handleEditKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEditingFinish();
    }
    if (e.key === 'Escape') {
      onEditingFinish();
    }
  }, [onEditingFinish]);

  return (
    <div className="flex-1 bg-black flex flex-col relative overflow-hidden">
      <div
        ref={containerRef}
        className="flex-1 relative w-full h-full group"
        onClick={togglePlayPause}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={handleVideoMetadata}
          onPlay={onPlay}
          onPause={onPause}
          className="w-full h-full object-contain bg-black"
          playsInline
          preload="metadata"
        />

        {/* רשת כיול (מוצגת כשלא משחקים) */}
        {!isPlaying && (
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="w-full h-full grid grid-cols-20 grid-rows-20 border border-blue-500/30">
              {Array.from({ length: 400 }).map((_, i) => (
                <div key={i} className="border border-blue-500/10" />
              ))}
            </div>
          </div>
        )}

        {/* שכבת הכתוביות */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {currentSubtitle && (
            <div
              key={currentSubtitle.id}
              onMouseDown={(e) => handleMouseDown(e, currentSubtitle)}
              onClick={(e) => {
                e.stopPropagation();
                onSubtitleClick(currentSubtitle);
              }}
              className={`
                group/subtitle absolute pointer-events-auto select-none
                transition-all duration-200 ease-out
                ${selectedSubtitleId === currentSubtitle.id
                  ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-black/50'
                  : 'hover:ring-1 hover:ring-blue-300/50'
                }
                ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
              `}
              style={{
                left: `${currentSubtitle.style.x}%`,
                top: `${currentSubtitle.style.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${getScaledFontSize(currentSubtitle.style.fontSize)}px`,
                fontFamily: currentSubtitle.style.fontFamily,
                color: currentSubtitle.style.color,
                backgroundColor: currentSubtitle.style.backgroundColor,
                textShadow: currentSubtitle.style.textShadow,
                fontWeight: currentSubtitle.style.fontWeight,
                padding: '8px 12px',
                borderRadius: '6px',
                lineHeight: 1.2,
                direction: 'auto',
                textAlign: 'center',
                maxWidth: '80%',
                minWidth: '100px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {/* כפתור עריכה */}
              {selectedSubtitleId === currentSubtitle.id && !editingSubtitleId && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex gap-2 opacity-0 group-hover/subtitle:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditModeEnter(currentSubtitle);
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    ערוך
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Move className="w-4 h-4 mr-1" />
                    גרור
                  </Button>
                </div>
              )}

              {/* מצב עריכה */}
              {editingSubtitleId === currentSubtitle.id ? (
                <textarea
                  value={editingText}
                  onChange={(e) => onEditingTextChange(e.target.value)}
                  onBlur={onEditingFinish}
                  onKeyDown={handleEditKeyDown}
                  autoFocus
                  className="bg-transparent border-2 border-blue-400 outline-none resize-none rounded-md p-2"
                  style={{
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    color: 'inherit',
                    textAlign: 'center',
                    width: '100%',
                    minHeight: '2em',
                    direction: isRTL ? 'rtl' : 'ltr'
                  }}
                />
              ) : (
                renderHighlightedText(currentSubtitle.text, currentSubtitle.style, currentSubtitle.id)
              )}
            </div>
          )}
        </div>

        {/* מחוון השהייה */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <div className="bg-black/60 rounded-full p-4 backdrop-blur-sm">
              <Play className="w-12 h-12 text-white" />
            </div>
          </div>
        )}

        {/* מידע על הוידאו */}
        <div className="absolute top-4 left-4 bg-black/60 rounded-lg p-2 text-white text-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <div>רזולוציה: {videoResolution.width}×{videoResolution.height}</div>
          <div>זמן: {Math.floor(currentTime)}s / {Math.floor(duration)}s</div>
        </div>
      </div>
    </div>
  );
});

VideoPreview.displayName = 'VideoPreview';

export default VideoPreview;