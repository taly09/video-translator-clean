import React, { useState, useEffect, useRef } from 'react';

function SubtitleWithDynamicFont({ segment, videoRef, videoResolution, isRTL }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const baseFontSize = segment.style.fontSize || 40;

  const [fontSize, setFontSize] = useState(baseFontSize);

  const getScaledFontSize = () => {
    if (!videoRef.current || !videoResolution.width || !videoResolution.height) {
      return baseFontSize;
    }
    const videoRect = videoRef.current.getBoundingClientRect();
    const scaleY = videoRect.height / videoResolution.height;
    const scaleX = videoRect.width / videoResolution.width;
    const scale = Math.min(scaleX, scaleY);
    return Math.max(12, baseFontSize * scale);
  };

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;

    const containerWidth = containerRef.current.offsetWidth * 0.9; // 90%
    let newFontSize = getScaledFontSize();

    setFontSize(newFontSize);

    const fitText = () => {
      while (textRef.current.scrollWidth > containerWidth && newFontSize > 12) {
        newFontSize -= 1;
        setFontSize(newFontSize);
      }
    };

    fitText();

    const handleResize = () => {
      newFontSize = getScaledFontSize();
      setFontSize(newFontSize);
      fitText();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, [segment.text, videoRef, videoResolution]);

  return (
    <div
      ref={containerRef}
      style={{
        maxWidth: '90%',
        boxSizing: 'border-box',
        padding: '0 5%',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div
        ref={textRef}
        style={{
          fontSize: fontSize + 'px',
          fontFamily: segment.style.fontFamily,
          color: segment.style.color,
          backgroundColor: segment.style.backgroundColor,
          textShadow: segment.style.textShadow,
          fontWeight: segment.style.fontWeight,
          padding: '0.2em 0.5em',
          lineHeight: 1.2,
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: 'center',
          whiteSpace: 'normal',
          overflowWrap: 'break-word',
          wordWrap: 'break-word',
          borderRadius: '4px',
          margin: 0,
        }}
      >
        {segment.text}
      </div>
    </div>
  );
}

export default SubtitleWithDynamicFont;
