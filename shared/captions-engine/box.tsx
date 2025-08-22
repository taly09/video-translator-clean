import React from 'react';
import { SegmentStyle } from './types';
import { cleanColor } from './utils';
import { computeSafeFontSize } from './computeSafeFontSize';
import { autoFitFontSize } from './textFit';

const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end' } as const;
const vAlignMap = { top: 'flex-start', middle: 'center', bottom: 'flex-end' } as const;
const pct = (v?: number, def: number) => (v ?? def) / 100;

export const CornerFrame: React.FC<{ color: string; thickness: number; len: number }> = ({color, thickness, len}) => (
  <div style={{position:'absolute', inset:0, pointerEvents:'none'}}>
    {(['tl','tr','bl','br'] as const).map(k => (
      <div key={k} style={{
        position:'absolute',
        ...(k==='tl'?{left:0,top:0}:{}),
        ...(k==='tr'?{right:0,top:0}:{}),
        ...(k==='bl'?{left:0,bottom:0}:{}),
        ...(k==='br'?{right:0,bottom:0}:{}),
      }}>
        <div style={{
          position:'absolute', width:len, height:thickness, background:color,
          ...(k.includes('t')?{top:0}:{bottom:0}),
          ...(k.includes('l')?{left:0}:{right:0})
        }}/>
        <div style={{
          position:'absolute', width:thickness, height:len, background:color,
          ...(k.includes('t')?{top:0}:{bottom:0}),
          ...(k.includes('l')?{left:0}:{right:0})
        }}/>
      </div>
    ))}
  </div>
);

export const computeBoxPx = (videoW: number, videoH: number, s: SegmentStyle) => {
  const cx = pct(s.boxX, 50) * videoW;
  const cy = pct(s.boxY, 85) * videoH;
  const bw = pct(s.boxW, 72) * videoW;
  const bh = pct(s.boxH, 28) * videoH;
  return { x: cx - bw/2, y: cy - bh/2, w: bw, h: bh };
};

export const renderBoxedText = (args: {
  text: string;
  style: SegmentStyle & {
    fontFamily: string; fontWeight: React.CSSProperties['fontWeight'];
    fontSize?: number; color: string; textShadow?: string; highlightColor?: string;
  };
  rtl: boolean;
  videoW: number;
  videoH: number;
}) => {
  const { text, style, rtl, videoW, videoH } = args;
  const box = computeBoxPx(videoW, videoH, style);
  const pad = style.boxPadding ?? 10;
  const hlWord = style.highlightWord || style.highlightedWord || '';

  // גודל פונט בטוח (אותו חישוב בפרונט ובצריבה)
  const safeFont = computeSafeFontSize(style.fontSize, videoW, videoH);

  // התאמת שורות לפי גודל הקופסה
  const innerW = Math.max(10, box.w - pad * 2);
  const innerH = Math.max(10, box.h - pad * 2);
  const fit = autoFitFontSize(
    text,
    style.fontFamily || 'Rubik',
    style.fontWeight || 900,
    14,
    safeFont,
    innerW,
    innerH,
    1.2 // אחיד עם הפרונט
  );

  const splitLines = fit.lines.length ? fit.lines : text.split(/\r?\n/);

  return (
    <div style={{position:'absolute', left:box.x, top:box.y, width:box.w, height:box.h}}>
      {style.frameCorners && (
        <CornerFrame
          color={style.frameColor || '#fff'}
          thickness={style.frameThickness ?? 4}
          len={style.frameLength ?? 30}
        />
      )}

      <div style={{
        position:'absolute', left:pad, right:pad, top:pad, bottom:pad,
        display:'flex',
        alignItems: vAlignMap[style.boxVAlign || 'middle'],
        justifyContent: alignMap[style.boxAlign || 'center'],
        textAlign:
          (style.boxAlign || 'center') === 'center'
            ? 'center'
            : (style.boxAlign === 'start' ? (rtl ? 'right':'left') : (rtl ? 'left':'right')),
        overflow:'hidden'
      }}>
        <div style={{ lineHeight: 1.2 }}>
          {splitLines.map((ln, i) => {
            if (!hlWord) {
              return (
                <div key={i} style={{
                  fontFamily: style.fontFamily,
                  fontWeight: style.fontWeight,
                  fontSize: fit.fontSize,
                  color: style.color,
                  textShadow: style.textShadow
                }}>{ln}</div>
              );
            }
            const re = new RegExp(`(${hlWord.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')})`, 'i');
            const parts = ln.split(re);
            return (
              <div key={i} style={{whiteSpace:'pre-wrap'}}>
                {parts.map((chunk, j) => {
                  const isHL = re.test(chunk) && chunk.toLowerCase() === hlWord.toLowerCase();
                  return (
                    <span key={j} style={{
                      fontFamily: style.fontFamily,
                      fontWeight: style.fontWeight,
                      fontSize: fit.fontSize,
                      color: isHL ? '#fff' : (style.color ?? '#fff'),
                      textShadow: isHL ? 'none' : (style.textShadow ?? '0 2px 8px rgba(0,0,0,.5)'),
                      background: isHL ? cleanColor(style.highlightColor) : 'transparent',
                      borderRadius: isHL ? '0.35em' as any : 0,
                      padding: isHL ? '0.06em 0.28em' : 0,
                      marginInline: '.05em'
                    }}>{chunk}</span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
