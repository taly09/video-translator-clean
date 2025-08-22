import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Text, Rect, Group } from 'react-konva';

export default function KonvaCanvas({
  width,
  height,
  segments,
  currentTime,
  selectedSegmentId,
  onSegmentSelect,
  onSegmentUpdate
}) {
  const stageRef = useRef();
  const [stageSize, setStageSize] = useState({ width: 1920, height: 1080 });

  // חישוב גודל הקנבס הנכון
  useEffect(() => {
    const updateSize = () => {
      const container = stageRef.current?.container();
      if (container) {
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        // יחס תמונה של 16:9
        const aspectRatio = 16 / 9;
        let newWidth, newHeight;

        if (containerWidth / containerHeight > aspectRatio) {
          newHeight = containerHeight;
          newWidth = newHeight * aspectRatio;
        } else {
          newWidth = containerWidth;
          newHeight = newWidth / aspectRatio;
        }

        setStageSize({ width: newWidth, height: newHeight });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // פילטור הקטעים הנראים
  const visibleSegments = segments.filter(segment =>
    currentTime >= segment.start && currentTime <= segment.end
  );

  // יצירת טקסט עם אפקטי TikTok
  const renderTextWithEffects = (segment) => {
    const style = segment.style || {};
    const isSelected = segment.id === selectedSegmentId;

    // חישוב מיקום יחסי
    const scaleX = stageSize.width / 1920;
    const scaleY = stageSize.height / 1080;

    const x = (style.position?.x || 960) * scaleX;
    const y = (style.position?.y || 900) * scaleY;
    const fontSize = (style.fontSize || 48) * Math.min(scaleX, scaleY);

    // אנימציית מילה אחר מילה (כמו ב-TikTok)
    let displayText = segment.text;
    if (style.wordAnimation === 'wordByWord') {
      const words = segment.text.split(' ');
      const timeFromStart = currentTime - segment.start;
      const wordSpeed = style.wordSpeed || 0.3;
      const wordsToShow = Math.floor(timeFromStart / wordSpeed) + 1;
      displayText = words.slice(0, wordsToShow).join(' ');
    }

    // אפקט הדגשת מילה נוכחית
    const highlightCurrentWord = style.wordAnimation === 'highlightWords';
    let textColor = style.color || '#FFFFFF';

    if (highlightCurrentWord) {
      const words = segment.text.split(' ');
      const timeFromStart = currentTime - segment.start;
      const wordSpeed = style.wordSpeed || 0.3;
      const currentWordIndex = Math.floor(timeFromStart / wordSpeed);

      // אם המילה הנוכחית, תצבע אחרת
      if (currentWordIndex < words.length) {
        textColor = '#FFD700'; // צהוב להדגשה
      }
    }

    return (
      <Group
        key={segment.id}
        x={x}
        y={y}
        draggable={isSelected}
        onClick={() => onSegmentSelect(segment.id)}
        onDragEnd={(e) => {
          const newX = e.target.x() / scaleX;
          const newY = e.target.y() / scaleY;
          onSegmentUpdate(segment.id, {
            style: {
              ...style,
              position: { x: newX, y: newY }
            }
          });
        }}
      >
        {/* רקע */}
        {style.backgroundColor && style.backgroundColor !== 'transparent' && (
          <Rect
            width={displayText.length * fontSize * 0.6}
            height={fontSize * 1.2}
            fill={style.backgroundColor}
            cornerRadius={style.borderRadius || 8}
            x={-displayText.length * fontSize * 0.3}
            y={-fontSize * 0.6}
            stroke={isSelected ? '#9333EA' : (style.border ? style.border.replace('2px solid ', '') : undefined)}
            strokeWidth={isSelected ? 3 : (style.border ? 2 : 0)}
          />
        )}

        {/* טקסט ראשי */}
        <Text
          text={displayText}
          fontSize={fontSize}
          fontFamily={style.fontFamily || 'Assistant'}
          fill={textColor}
          align={style.textAlign || 'center'}
          verticalAlign="middle"
          x={-displayText.length * fontSize * 0.3}
          y={-fontSize * 0.3}
          rotation={style.rotation || 0}
          scaleX={style.scale || 1}
          scaleY={style.scale || 1}
          opacity={style.opacity || 1}
          shadowColor={style.textShadow ? 'rgba(0,0,0,0.8)' : undefined}
          shadowBlur={style.textShadow ? 10 : 0}
          shadowOffset={style.textShadow ? { x: 2, y: 2 } : undefined}
        />

        {/* אפקט זוהר */}
        {style.glowEffect && (
          <Text
            text={displayText}
            fontSize={fontSize}
            fontFamily={style.fontFamily || 'Assistant'}
            fill={textColor}
            align={style.textAlign || 'center'}
            x={-displayText.length * fontSize * 0.3}
            y={-fontSize * 0.3}
            rotation={style.rotation || 0}
            scaleX={style.scale || 1}
            scaleY={style.scale || 1}
            opacity={0.5}
            shadowColor={textColor}
            shadowBlur={20}
            shadowOffset={{ x: 0, y: 0 }}
          />
        )}

        {/* מסגרת טקסט */}
        {style.strokeEffect && (
          <Text
            text={displayText}
            fontSize={fontSize}
            fontFamily={style.fontFamily || 'Assistant'}
            stroke="#000000"
            strokeWidth={2}
            fill="transparent"
            align={style.textAlign || 'center'}
            x={-displayText.length * fontSize * 0.3}
            y={-fontSize * 0.3}
            rotation={style.rotation || 0}
            scaleX={style.scale || 1}
            scaleY={style.scale || 1}
          />
        )}
      </Group>
    );
  };

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        border: '2px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        background: 'transparent'
      }}
    >
      <Layer>
        {visibleSegments.map(renderTextWithEffects)}
      </Layer>
    </Stage>
  );
}