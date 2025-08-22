import React, { useRef, useEffect, useState, isValidElement } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause } from 'lucide-react';

export const ResponsiveVideoPlayer = ({
  videoUrl,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onLoadedMetadata,
  onPlay,
  onPause,
  onSeekChange,
  children,
  className = ""
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col bg-black ${className}`}>
      {/* Video Container */}
      <div
        ref={containerRef}
        className="flex-1 relative w-full bg-black flex items-center justify-center overflow-hidden"
        onClick={togglePlayPause}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          onTimeUpdate={(e) => onTimeUpdate?.(e.target.currentTime)}
          onLoadedMetadata={(e) => {
            onLoadedMetadata?.(e.target);
            setContainerSize({
              width: containerRef.current?.getBoundingClientRect().width || 0,
              height: containerRef.current?.getBoundingClientRect().height || 0
            });
          }}
          onPlay={() => onPlay?.(true)}
          onPause={() => onPause?.(false)}
          className="max-w-full max-h-full object-contain"
          playsInline
          preload="metadata"
        />

        {/* Overlay for subtitles */}
        <div className="absolute inset-0 pointer-events-none">
          {isValidElement(children)
            ? React.cloneElement(children, {
                videoRef,
                videoContainerRef: containerRef,
                containerSize
              })
            : children}
        </div>

        {/* Play button overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <Play className="w-16 h-16 text-white/70" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-slate-800/90 backdrop-blur-sm p-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
          className="w-10 h-10 shrink-0"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>

        <span className="text-sm font-mono min-w-[100px] text-white">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <Slider
          value={[currentTime]}
          onValueChange={(values) => {
            const newTime = values[0];
            if (videoRef.current) {
              videoRef.current.currentTime = newTime;
            }
            onSeekChange?.(newTime);
          }}
          max={duration || 100}
          step={0.1}
          className="flex-1"
        />
      </div>
    </div>
  );
};
