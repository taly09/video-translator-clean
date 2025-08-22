// C:\CaPlay1\frontend\src\shared\captions.tsx
import React from 'react';

export type Word = { word: string; start: number; end: number };

export type CaptionEngine = 'static' | 'single' | 'cumulative' | 'fill';

export type CaptionParams = {
  engine: CaptionEngine;

  // התנהגות מילים
  progressive?: boolean;              // מצטבר (בונה עד המילה הנוכחית)
  showFuture?: 'all' | 'none';        // להציג מילים עתידיות (ב-single בלבד רלוונטי)
  pastOpacity?: number;               // שקיפות למילים עברו (0..1)

  // הדגשה
  activeEmphasis?: 'color' | 'bg';    // צביעת טקסט או “שבב”
  highlightColor?: string;
  inactiveStroke?: boolean;           // outline למילים לא פעילות
  outlineWidth?: number;
  outlineColor?: string;

  // “שבב”
  chipPaddingX?: number;              // px
  chipPaddingY?: number;
  chipRadius?: number;

  // טיפוגרפיה
  fontFamily?: string;
  fontWeight?: string | number;
  fontSize?: number;
  color?: string;
  textShadow?: string;

  // מיקום (%)
  x?: number;
  y?: number;

  // RTL
  rtl?: boolean;

  // תוספות קטנות
  youtubeFadeSec?: number;            // פייד־אין למילה הפעילה (שניות, למשל 0.06)
  pastBgColor?: string;               // רקע למילים שנאמרו (כשactiveEmphasis='bg')
};

export const defaultParams: Required<
  Pick<
    CaptionParams,
    | 'engine'|'progressive'|'showFuture'|'pastOpacity'
    | 'activeEmphasis'|'highlightColor'|'inactiveStroke'|'outlineWidth'|'outlineColor'
    | 'chipPaddingX'|'chipPaddingY'|'chipRadius'
    | 'fontFamily'|'fontWeight'|'fontSize'|'color'|'textShadow'
    | 'x'|'y'|'rtl'
    | 'youtubeFadeSec'|'pastBgColor'
  >
> = {
  engine: 'single',
  progressive: false,
  showFuture: 'all',
  pastOpacity: 0.85,
  activeEmphasis: 'color',
  highlightColor: '#F8FF1C',
  inactiveStroke: true,
  outlineWidth: 0.5,
  outlineColor: 'rgba(0,0,0,.55)',
  chipPaddingX: 10,
  chipPaddingY: 6,
  chipRadius: 8,
  fontFamily: 'Rubik, Heebo, Arial, sans-serif',
  fontWeight: 900,
  fontSize: 56,
  color: '#FFFFFF',
  textShadow: '0 2px 6px rgba(0,0,0,.4)',
  x: 50,
  y: 85,
  rtl: false,
  youtubeFadeSec: 0,
  pastBgColor: 'transparent',
};

export function normalizeWords(
  text: string,
  segStart: number,
  segEnd: number,
  words?: Word[]
): Word[] {
  if (words && words.length) return words;
  const arr = text.trim().split(/\s+/).filter(Boolean);
  const dur = Math.max(0.0001, segEnd - segStart);
  return arr.map((w, i) => ({
    word: w,
    start: segStart + (i * dur) / arr.length,
    end: segStart + ((i + 1) * dur) / arr.length,
  }));
}

export function clampPct(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function renderCaption({
  words,
  params,
  currentTime,
}: {
  words: Word[];
  params: CaptionParams;
  currentTime: number;
}) {
  const p = { ...defaultParams, ...params };

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${clampPct(p.x!, 5, 95)}%`,
    top: `${clampPct(p.y!, 10, 86)}%`,
    transform: 'translate(-50%, -50%)',
    width: 'min(96%, 92%)',            // מעט יותר מרווח
    textAlign: 'center',
    direction: p.rtl ? 'rtl' : 'ltr',

    // הכי חשוב: לאפשר שורות מרובות ולבטל חיתוך
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    hyphens: 'auto',
  };

  const baseWordStyle: React.CSSProperties = {
    fontFamily: p.fontFamily,
    fontWeight: p.fontWeight as any,
    fontSize: p.fontSize,
    lineHeight: 1.2,
    textRendering: 'geometricPrecision',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    paintOrder: 'stroke fill',
    display: 'inline',
    padding: p.activeEmphasis === 'bg' ? `${p.chipPaddingY}px ${p.chipPaddingX}px` : '0 0.25em',
    margin: p.rtl ? '0 0 0 .35em' : '0 .35em 0 0',
    borderRadius: p.activeEmphasis === 'bg' ? p.chipRadius : 0,
  };

  const renderSingle = () => {
    const activeIdx = words.findIndex(w => currentTime >= w.start && currentTime < w.end);
    const capAt = (activeIdx === -1 ? -1 : activeIdx);
    const hideFuture = p.progressive || p.showFuture === 'none';

    return (
      <div style={posStyle}>
        {words.map((w, i) => {
          if (hideFuture && i > capAt) return null;

          const isActive = currentTime >= w.start && currentTime < w.end;

          const fadeDur = Math.max(0, p.youtubeFadeSec || 0);
          const activeOpacityBoost =
            fadeDur > 0 && isActive
              ? Math.min(1, Math.max(0, (currentTime - w.start) / fadeDur))
              : 1;

          const color = isActive
            ? (p.activeEmphasis === 'bg' ? p.color : p.highlightColor)
            : p.color;

          const bg = p.activeEmphasis === 'bg'
            ? (isActive ? p.highlightColor : p.pastBgColor || 'transparent')
            : 'transparent';

          return (
            <span
              key={i}
              style={{
                ...baseWordStyle,
                backgroundColor: bg,
                color,
                opacity: isActive ? activeOpacityBoost : p.pastOpacity,
                WebkitTextStroke: isActive
                  ? '0 transparent'
                  : (p.inactiveStroke ? `${p.outlineWidth}px ${p.outlineColor}` : '0 transparent'),
                textShadow: isActive ? 'none' : p.textShadow,
                transform: isActive ? 'scale(1.06)' : 'scale(1)',
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    );
  };

  const renderCumulative = () => {
    const activeIdx = words.findIndex(w => currentTime >= w.start && currentTime < w.end);
    if (activeIdx === -1) return null;
    return (
      <div style={posStyle}>
        {words.slice(0, activeIdx + 1).map((w, i) => {
          const isActive = i === activeIdx;
          const color = isActive && p.activeEmphasis === 'color' ? p.highlightColor : p.color;
          const bg = isActive && p.activeEmphasis === 'bg' ? p.highlightColor : 'transparent';
          return (
            <span
              key={i}
              style={{
                ...baseWordStyle,
                backgroundColor: bg,
                color,
                WebkitTextStroke: isActive ? '0 transparent' : (p.inactiveStroke ? `${p.outlineWidth}px ${p.outlineColor}` : '0 transparent'),
                textShadow: isActive ? 'none' : p.textShadow,
                transform: isActive ? 'scale(1.06)' : 'scale(1)',
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    );
  };

  const renderStatic = () => (
    <div style={posStyle}>
      <span
        style={{
          ...baseWordStyle,
          backgroundColor: 'transparent',
          color: p.color,
          WebkitTextStroke: p.inactiveStroke ? `${p.outlineWidth}px ${p.outlineColor}` : '0 transparent',
          textShadow: p.textShadow,
          padding: '0.15em 0.35em',
          borderRadius: '.3em',
        }}
      >
        {words.map(w => w.word).join(' ')}
      </span>
    </div>
  );

  const renderFill = () => {
    const isRTL = p.rtl;
    const wordProgress = (t: number, w: Word) =>
      Math.min(1, Math.max(0, (t - w.start) / Math.max(0.0001, w.end - w.start)));

    return (
      <div style={posStyle}>
        {words.map((w, i) => {
          const prog = wordProgress(currentTime, w);
          return (
            <span
              key={i}
              style={{
                position: 'relative',
                display: 'inline',
                padding: '0 0.25em',
                margin: isRTL ? '0 0 0 .5em' : '0 .5em 0 0'
              }}
            >
              <span style={{ ...baseWordStyle, background: 'transparent', color: p.color }}>{w.word}</span>
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${prog * 100}%`,
                  left: isRTL ? 'auto' : 0,
                  right: isRTL ? 0 : 'auto',
                  overflow: 'hidden',
                  color: p.highlightColor,
                  WebkitTextStroke: '0 transparent',
                  pointerEvents: 'none',
                }}
              >
                {w.word}
              </span>
            </span>
          );
        })}
      </div>
    );
  };

  switch (p.engine) {
    case 'single':     return renderSingle();
    case 'cumulative': return renderCumulative();
    case 'fill':       return renderFill();
    case 'static':
    default:           return renderStatic();
  }
}
