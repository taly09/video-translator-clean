import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  RotateCcw,
  RotateCw
} from 'lucide-react';

export default function VideoControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  playbackRate,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
  onSkipBackward,
  onSkipForward,
  onFullscreen
}) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showPlaybackControls, setShowPlaybackControls] = useState(false);

  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }, []);

  const handleSeekChange = useCallback((value) => {
    onSeek(value[0]);
  }, [onSeek]);

  const handleVolumeChange = useCallback((value) => {
    onVolumeChange(value[0]);
  }, [onVolumeChange]);

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 p-4">
      <div className="space-y-3">
        {/* סרגל זמן */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-gray-300 min-w-[80px]">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            onValueChange={handleSeekChange}
            max={duration || 100}
            step={0.1}
            className="flex-1"
          />
          <span className="text-sm font-mono text-gray-300 min-w-[80px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* פקדי נגינה */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkipBackward}
              className="text-white hover:text-blue-400"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={onPlayPause}
              className="text-white hover:text-blue-400"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onSkipForward}
              className="text-white hover:text-blue-400"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* בקרת עוצמת קול */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="text-white hover:text-blue-400"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>

              {showVolumeSlider && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-slate-900 border border-slate-700 rounded-lg">
                  <div className="h-20 w-6 flex items-center justify-center">
                    <Slider
                      value={[volume]}
                      onValueChange={handleVolumeChange}
                      max={1}
                      step={0.1}
                      orientation="vertical"
                      className="h-16"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* מהירות נגינה */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPlaybackControls(!showPlaybackControls)}
                className="text-white hover:text-blue-400 text-xs"
              >
                {playbackRate}x
              </Button>

              {showPlaybackControls && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-slate-900 border border-slate-700 rounded-lg">
                  <div className="grid grid-cols-2 gap-1">
                    {playbackRates.map((rate) => (
                      <Button
                        key={rate}
                        variant={playbackRate === rate ? "default" : "ghost"}
                        size="sm"
                        onClick={() => {
                          onPlaybackRateChange(rate);
                          setShowPlaybackControls(false);
                        }}
                        className="text-xs"
                      >
                        {rate}x
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onFullscreen}
              className="text-white hover:text-blue-400"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* מידע נוסף */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {Math.round((currentTime / duration) * 100)}% הושלם
          </span>
          <span>
            {duration ? `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')} דקות` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}