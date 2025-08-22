import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export default function Timeline({
  subtitles,
  currentTime,
  duration,
  selectedSubtitle,
  onSeek,
  onSubtitleSelect,
  onSubtitleUpdate,
  onPlayPause,
  isPlaying
}) {
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragSubtitle, setDragSubtitle] = useState(null);
  const [dragType, setDragType] = useState(null); // 'start', 'end', 'move'

  // פורמט זמן
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // חישוב מיקום על ציר הזמן
  const timeToPixel = useCallback((time) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    return (time / duration) * rect.width;
  }, [duration]);

  const pixelToTime = useCallback((pixel) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    return (pixel / rect.width) * duration;
  }, [duration]);

  // טיפול בקליק על ציר הזמן
  const handleTimelineClick = (e) => {
    if (isDragging) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const time = pixelToTime(clickX);
    onSeek(time);
  };

  // התחלת גרירה
  const handleMouseDown = (e, subtitle, type) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragSubtitle(subtitle);
    setDragType(type);
    onSubtitleSelect(subtitle);
  };

  // גרירה
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragSubtitle) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const time = pixelToTime(Math.max(0, Math.min(mouseX, rect.width)));

    if (dragType === 'start') {
      const newStart = Math.max(0, Math.min(time, dragSubtitle.end - 0.1));
      onSubtitleUpdate(dragSubtitle.id, { start: newStart });
    } else if (dragType === 'end') {
      const newEnd = Math.min(duration, Math.max(time, dragSubtitle.start + 0.1));
      onSubtitleUpdate(dragSubtitle.id, { end: newEnd });
    } else if (dragType === 'move') {
      const subtitleDuration = dragSubtitle.end - dragSubtitle.start;
      const newStart = Math.max(0, Math.min(time - subtitleDuration / 2, duration - subtitleDuration));
      onSubtitleUpdate(dragSubtitle.id, {
        start: newStart,
        end: newStart + subtitleDuration
      });
    }
  }, [isDragging, dragSubtitle, dragType, duration, onSubtitleUpdate, pixelToTime]);

  // סיום גרירה
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragSubtitle(null);
    setDragType(null);
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

  return (
    <div className="h-full flex flex-col bg-gray-900/80 backdrop-blur-xl text-white">
      {/* כותרת וכפתורי בקרה */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold">ציר זמן</h3>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSeek(Math.max(0, currentTime - 10))}
            className="text-white hover:bg-white/10"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onPlayPause}
            className="text-white hover:bg-white/10"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSeek(Math.min(duration, currentTime + 10))}
            className="text-white hover:bg-white/10"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <div className="text-sm font-mono text-gray-300">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* ציר הזמן */}
      <div className="flex-1 p-4">
        <div
          ref={timelineRef}
          className="relative h-20 bg-gray-800 rounded-lg cursor-pointer overflow-hidden"
          onClick={handleTimelineClick}
        >
          {/* קו הזמן הנוכחי */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
          </div>

          {/* כתוביות על ציר הזמן */}
          {subtitles.map((subtitle) => {
            const left = (subtitle.start / duration) * 100;
            const width = ((subtitle.end - subtitle.start) / duration) * 100;
            const isSelected = selectedSubtitle?.id === subtitle.id;

            return (
              <div
                key={subtitle.id}
                className={`absolute top-2 h-16 rounded cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-purple-600 border-2 border-purple-400 shadow-lg'
                    : 'bg-blue-600 hover:bg-blue-500 border border-blue-400'
                }`}
                style={{ left: `${left}%`, width: `${width}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSubtitleSelect(subtitle);
                  onSeek(subtitle.start);
                }}
              >
                {/* כפתור התחלה */}
                <div
                  className="absolute top-0 right-0 w-2 h-full bg-white/30 cursor-ew-resize hover:bg-white/50"
                  onMouseDown={(e) => handleMouseDown(e, subtitle, 'start')}
                />

                {/* תוכן הכתובית */}
                <div
                  className="px-2 py-1 text-xs font-medium text-white truncate h-full flex items-center justify-center"
                  onMouseDown={(e) => handleMouseDown(e, subtitle, 'move')}
                >
                  {subtitle.text}
                </div>

                {/* כפתור סיום */}
                <div
                  className="absolute top-0 left-0 w-2 h-full bg-white/30 cursor-ew-resize hover:bg-white/50"
                  onMouseDown={(e) => handleMouseDown(e, subtitle, 'end')}
                />

                {/* זמנים */}
                <div className="absolute -bottom-5 right-0 text-xs text-gray-400 font-mono">
                  {formatTime(subtitle.start)}
                </div>
                <div className="absolute -bottom-5 left-0 text-xs text-gray-400 font-mono">
                  {formatTime(subtitle.end)}
                </div>
              </div>
            );
          })}

          {/* סרגל התקדמות */}
          <div
            className="absolute bottom-0 left-0 h-1 bg-red-500 z-20"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        {/* מידע על הכתובית הנבחרת */}
        {selectedSubtitle && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-300">כתובית נבחרת</span>
              <span className="text-xs text-gray-400 font-mono">
                {formatTime(selectedSubtitle.start)} - {formatTime(selectedSubtitle.end)}
              </span>
            </div>
            <p className="text-sm text-white">{selectedSubtitle.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}