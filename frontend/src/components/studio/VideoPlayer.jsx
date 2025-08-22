import React, { useRef, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react';
import { SubtitleRenderer } from './SubtitleRenderer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoPlayer = forwardRef(({
  videoUrl,
  subtitles,
  currentTime,
  duration,
  isPlaying,
  isMuted,
  playbackRate,
  videoResolution,
  selectedSubtitleId,
  isRTL,
  onTimeUpdate,
  onLoadedMetadata,
  onPlay,
  onPause,
  onSeekChange,
  onSubtitleClick,
  onSubtitleDrag,
  onPlaybackRateChange,
  showControls = true,
  className = ""
}, ref) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    getCurrentTime: () => videoRef.current?.currentTime || 0,
    setCurrentTime: (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    getDuration: () => videoRef.current?.duration || 0,
    getVideoElement: () => videoRef.current,
    getContainerElement: () => containerRef.current
  }));

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  }, []);

  const seekBy = useCallback((seconds) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
    }
  }, [duration]);

  const formatTime = useCallback((time = 0) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    return [hours, minutes, seconds]
      .map(v => String(v).padStart(2, '0'))
      .join(':');
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekBy(e.shiftKey ? 1 : 0.5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekBy(e.shiftKey ? -1 : -0.5);
          break;
        case 'KeyJ':
          e.preventDefault();
          seekBy(-10);
          break;
        case 'KeyK':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'KeyL':
          e.preventDefault();
          seekBy(10);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, seekBy, toggleMute]);

  // Update playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const currentSubtitles = subtitles.filter(
    sub => currentTime >= sub.start && currentTime < sub.end
  );

  return (
    <div className={`relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      {/* Video Container */}
      <div
        ref={containerRef}
        className="relative aspect-video w-full bg-black overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            togglePlayPause();
          }
        }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-contain"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onPlay={onPlay}
          onPause={onPause}
          playsInline
          muted={isMuted}
        />

        {/* Subtitles Overlay */}
        <AnimatePresence>
          {currentSubtitles.map(subtitle => (
            <SubtitleRenderer
              key={subtitle.id}
              segment={subtitle}
              currentTime={currentTime}
              videoContainerRef={containerRef}
              videoResolution={videoResolution}
              isRTL={isRTL}
              isSelected={subtitle.id === selectedSubtitleId}
              onMouseDown={(e) => onSubtitleDrag?.(e, subtitle)}
              onTouchStart={(e) => onSubtitleDrag?.(e, subtitle)}
              onClick={(e) => onSubtitleClick?.(subtitle, e)}
            />
          ))}
        </AnimatePresence>

        {/* Play Button Overlay */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress Bar */}
            <div className="px-6 pt-8 pb-2">
              <Slider
                value={[currentTime]}
                min={0}
                max={Math.max(duration, 0.01)}
                step={0.1}
                onValueChange={onSeekChange}
                className="h-2 [&_[role='slider']]:h-5 [&_[role='slider']]:w-5 [&_[role='slider']]:shadow-xl"
              />
            </div>

            {/* Control Buttons */}
            <div className="px-6 pb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => seekBy(-10)}
                  className="h-10 w-10 text-white hover:bg-white/20 rounded-full"
                  title="חזור 10 שניות"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>

                <Button
                  size="icon"
                  onClick={togglePlayPause}
                  className="h-12 w-12 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-600/30"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => seekBy(10)}
                  className="h-10 w-10 text-white hover:bg-white/20 rounded-full"
                  title="קדם 10 שניות"
                >
                  <RotateCw className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center gap-4 text-white">
                <span className="text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <Select
                  value={String(playbackRate)}
                  onValueChange={(v) => onPlaybackRateChange(Number(v))}
                >
                  <SelectTrigger className="h-8 w-20 text-white border-white/20 bg-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                      <SelectItem key={rate} value={String(rate)}>
                        {rate}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleMute}
                  className="h-10 w-10 text-white hover:bg-white/20 rounded-full"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;