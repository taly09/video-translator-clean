import React from 'react';

export default function SubtitleOverlay({
  subtitles,
  currentTime,
  selectedSubtitleId,
  onSubtitleClick,
  onSubtitleDrag
}) {
  const activeSubtitles = subtitles.filter(sub =>
    currentTime >= sub.start && currentTime <= sub.end
  );

  const handleSubtitleMouseDown = (subtitle, e) => {
    e.preventDefault();
    onSubtitleClick(subtitle.id);

    const startY = e.clientY;
    const startX = e.clientX;
    const startPosY = subtitle.style?.y || 900;
    const startPosX = subtitle.style?.x || 960;

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaX = moveEvent.clientX - startX;

      onSubtitleDrag(subtitle.id, {
        x: Math.max(0, Math.min(1920, startPosX + deltaX)),
        y: Math.max(0, Math.min(1080, startPosY + deltaY))
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {activeSubtitles.map((subtitle) => {
        const style = subtitle.style || {};
        const isSelected = subtitle.id === selectedSubtitleId;

        return (
          <div
            key={subtitle.id}
            className={`absolute pointer-events-auto cursor-move transition-all duration-200 ${
              isSelected ? 'ring-2 ring-blue-400 ring-opacity-75' : ''
            }`}
            style={{
              left: `${((style.x || 960) / 1920) * 100}%`,
              top: `${((style.y || 900) / 1080) * 100}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: `${(style.fontSize || 48) * 0.8}px`,
              fontFamily: style.fontFamily || 'Assistant',
              color: style.color || '#FFFFFF',
              backgroundColor: style.backgroundColor || 'rgba(0,0,0,0.8)',
              padding: `${style.padding || 12}px`,
              borderRadius: `${style.borderRadius || 8}px`,
              fontWeight: style.fontWeight || 'bold',
              textAlign: style.textAlign || 'center',
              textShadow: style.textShadow || '2px 2px 4px rgba(0,0,0,0.8)',
              border: style.border || '2px solid rgba(255,255,255,0.2)',
              maxWidth: '80%',
              wordWrap: 'break-word',
              zIndex: isSelected ? 20 : 10
            }}
            onMouseDown={(e) => handleSubtitleMouseDown(subtitle, e)}
            onClick={() => onSubtitleClick(subtitle.id)}
          >
            {subtitle.text}

            {isSelected && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full border-2 border-white shadow-lg"></div>
            )}
          </div>
        );
      })}
    </div>
  );
}