import React, { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Text, Rect, Group } from 'react-konva';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';

const VideoCanvas = forwardRef(({
  videoUrl,
  subtitles,
  currentTime,
  selectedSubtitle,
  onSubtitleSelect,
  onSubtitleUpdate,
  onSubtitleStyleUpdate,
  onTimeUpdate
}, ref) => {

  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);


  // חישוב גודל הקנבס
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
        const aspectRatio = 16 / 9;

        let newWidth, newHeight;
        if (containerWidth / containerHeight > aspectRatio) {
          newHeight = containerHeight - 80; // מקום לכפתורי השליטה
          newWidth = newHeight * aspectRatio;
        } else {
          newWidth = containerWidth - 40;
          newHeight = newWidth / aspectRatio;
        }

        setCanvasSize({ width: newWidth, height: newHeight });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // פילטור כתוביות נראות
  const visibleSubtitles = subtitles.filter(sub =>
    currentTime >= sub.start && currentTime <= sub.end
  );

  // רינדור כתובית
  const renderSubtitle = useCallback((subtitle) => {
    const isSelected = selectedSubtitle?.id === subtitle.id;
    const style = subtitle.style;

    // חישוב מיקום יחסי
    const scaleX = canvasSize.width / 1920;
    const scaleY = canvasSize.height / 1080;

    const x = (style.x || 960) * scaleX;
    const y = (style.y || 900) * scaleY;
    const fontSize = (style.fontSize || 48) * Math.min(scaleX, scaleY);

    // חישוב גודל הרקע
    const textWidth = subtitle.text.length * fontSize * 0.6;
    const textHeight = fontSize * style.lineHeight;
    const padding = (style.padding || 16) * Math.min(scaleX, scaleY);

    return (
      <Group
        key={subtitle.id}
        x={x}
        y={y}
        draggable={isSelected}
        onClick={() => onSubtitleSelect(subtitle)}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(e) => {
          setIsDragging(false);
          const newX = e.target.x() / scaleX;
          const newY = e.target.y() / scaleY;
          onSubtitleStyleUpdate(subtitle.id, { x: newX, y: newY });
        }}
      >
        {/* רקע הכתובית */}
        <Rect
          x={-textWidth / 2 - padding}
          y={-textHeight / 2 - padding}
          width={textWidth + padding * 2}
          height={textHeight + padding * 2}
          fill={style.backgroundColor || 'rgba(0,0,0,0.8)'}
          cornerRadius={style.borderRadius || 12}
          stroke={isSelected ? '#9333EA' : (style.border ? style.border.split(' ')[2] : 'transparent')}
          strokeWidth={isSelected ? 4 : (style.border ? 2 : 0)}
          shadowColor="rgba(0,0,0,0.3)"
          shadowBlur={10}
          shadowOffset={{ x: 0, y: 4 }}
        />

        {/* הטקסט */}
        <Text
          text={subtitle.text}
          fontSize={fontSize}
          fontFamily={style.fontFamily || 'Assistant'}
          fontStyle={style.fontWeight || 'bold'}
          fill={style.color || '#FFFFFF'}
          align={style.textAlign || 'center'}
          verticalAlign="middle"
          x={-textWidth / 2}
          y={-fontSize / 2}
          width={textWidth}
          letterSpacing={style.letterSpacing || 0.5}
          lineHeight={style.lineHeight || 1.2}
          shadowColor="rgba(0,0,0,0.8)"
          shadowBlur={4}
          shadowOffset={{ x: 2, y: 2 }}
          stroke={style.outline ? '#000000' : undefined}
          strokeWidth={style.outline ? 2 : 0}
        />

        {/* אינדיקטור בחירה */}
        {isSelected && (
          <>
            <Rect
              x={-textWidth / 2 - padding - 5}
              y={-textHeight / 2 - padding - 5}
              width={textWidth + padding * 2 + 10}
              height={textHeight + padding * 2 + 10}
              stroke="#9333EA"
              strokeWidth={2}
              dash={[5, 5]}
              cornerRadius={style.borderRadius + 5}
            />
            {/* נקודות גרירה */}
            <Rect
              x={-5}
              y={-5}
              width={10}
              height={10}
              fill="#9333EA"
              cornerRadius={2}
            />
          </>
        )}
      </Group>
    );
  }, [selectedSubtitle, canvasSize, onSubtitleSelect, onSubtitleStyleUpdate]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col items-center justify-center bg-black">
      {/* נגן ווידאו */}
      <video
  ref={ref}
  src={videoUrl}
  className="absolute inset-0 w-full h-full object-contain"
  onTimeUpdate={onTimeUpdate}
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}
  style={{ zIndex: 1 }}
/>


      {/* שכבת הכתוביות */}
      <Stage
        ref={stageRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="absolute"
        style={{ zIndex: 2 }}
      >
        <Layer>
          {visibleSubtitles.map(renderSubtitle)}
        </Layer>
      </Stage>

      {/* בקרות נגן */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/70 backdrop-blur-sm rounded-full px-6 py-3 z-10">
        <Button
  variant="ghost"
  size="sm"
  onClick={() => {
    if (ref?.current) {
      if (isPlaying) {
        ref.current.pause();
      } else {
        ref.current.play();
      }
    }
  }}
  className="text-white hover:bg-white/20 rounded-full w-12 h-12"
>
  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
</Button>


        <div className="text-white text-sm font-mono">
          {Math.floor(currentTime / 60).toString().padStart(2, '0')}:
          {Math.floor(currentTime % 60).toString().padStart(2, '0')}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 rounded-full w-10 h-10"
        >
          <Volume2 className="w-5 h-5" />
        </Button>
      </div>

      {/* הודעת גרירה */}
      {isDragging && (
        <div className="absolute top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-20">
          גרור לשינוי מיקום
        </div>
      )}

      {/* הוראות */}
      {!selectedSubtitle && visibleSubtitles.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm z-20">
          לחץ על כתובית לעריכה
        </div>
      )}
    </div>
  );
});

VideoCanvas.displayName = 'VideoCanvas';

export default VideoCanvas;