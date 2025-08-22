import React from 'react';
import {Word, WordMode, SegmentStyle, clamp01, easeOutCubic} from './types';
import { cleanColor } from './utils';
import { computeSafeFontSize } from './computeSafeFontSize';
import { measureTextWidth } from './textMeasure';

export type RenderArgs = {
  words: Word[];
  now: number;     // seconds
  frame: number;   // current frame
  fps: number;     // fps
  style: Required<Pick<SegmentStyle,
    'fontFamily'|'fontSize'|'color'|'backgroundColor'|'fontWeight'|'textShadow'|'highlightColor'
  >> & SegmentStyle & { videoW?: number; videoH?: number };
  rtl: boolean;
};

// ===== helpers =====

// מכניס רווחים בין צמתים של מילים (כשלא מרנדרים לפי שורות)
const withSpaces = (nodes: Array<React.ReactNode | null | false | undefined>) =>
  nodes
    .filter(Boolean)
    .flatMap((n, i, arr) => (i < arr.length - 1 ? [n as React.ReactNode, ' '] : [n as React.ReactNode]));

// שבירת שורות דטרמיניסטית לפי רוחב מקסימלי בפיקסלים
function breakWordsToLines(
  words: Word[],
  fontFamily: string,
  fontWeight: string | number,
  fontPx: number,
  maxWidthPx: number
): Word[][] {
  const font = `${fontWeight} ${fontPx}px ${fontFamily}`;
  const lines: Word[][] = [];
  let cur: Word[] = [];
  let curWidth = 0;
  const spaceW = measureTextWidth(' ', font);

  for (const w of words) {
    const wWidth = measureTextWidth(w.word, font);
    const add = cur.length ? spaceW + wWidth : wWidth;
    if (curWidth + add <= maxWidthPx || cur.length === 0) {
      cur.push(w);
      curWidth += add;
    } else {
      lines.push(cur);
      cur = [w];
      curWidth = wWidth;
    }
  }
  if (cur.length) lines.push(cur);
  return lines;
}

// רנדר לפי שורות: <div> לכל שורה + רווחים אמיתיים בין מילים
function renderByLines(
  lines: Word[][],
  renderWord: (w: Word, idxInLine: number) => React.ReactNode,
  lineHeight = 1.15
) {
  return (
    <div style={{ lineHeight, whiteSpace: 'pre' }}>
      {lines.map((ln, i) => (
        <div key={i} style={{ display: 'block' }}>
          {ln.flatMap((w, j) => (j < ln.length - 1
            ? [renderWord(w, j), ' ']
            : [renderWord(w, j)]))}
        </div>
      ))}
    </div>
  );
}

const wordProgress = (now:number, w:Word) =>
  clamp01((now - w.start) / Math.max(0.0001, w.end - w.start));

const getActiveWordIndex = (words: Word[], t: number) =>
  words.findIndex((w) => t >= w.start && t < w.end);

const getLastCompletedIndex = (words: Word[], t: number) =>
  words.reduce((idx, w, i) => (t >= w.end ? i : idx), -1);

// ===== main =====

export function renderCaptions(mode: WordMode, args: RenderArgs) {
  const {words, now, frame, fps, style, rtl} = args;

  const safeFontSize =
    style.videoW && style.videoH
      ? computeSafeFontSize(style.fontSize, style.videoW, style.videoH)
      : (style.fontSize ?? 56);

  const activeIdx = getActiveWordIndex(words, now);
  const lastIdx = activeIdx === -1 ? getLastCompletedIndex(words, now) : activeIdx;

  // שמירה על line-height אחיד (זהה ל-wrapper שלך)
  const lineHeight = 1.15;

  // רוחב עטיפה כמו בפרונט/צריבה (0.8 מהווידאו)
  const maxW = Math.floor(((style.videoW ?? 1920) * 0.8));

  // שבירת שורות דטרמיניסטית לכל המצבים שאינם 'none'
  const lines = breakWordsToLines(
    words,
    style.fontFamily,
    style.fontWeight ?? 900,
    safeFontSize,
    maxW
  );

  const commonSpan = (extra: React.CSSProperties = {}) => ({
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontSize: safeFontSize,
    lineHeight,
    margin: rtl ? '0 0 0 .35em' : '0 .35em 0 0',
    ...extra,
  } as React.CSSProperties);

  // ===== 'none' — משאיר התנהגות קיימת (פסקה אחת, join עם רווחים) =====
  if (mode === 'none') {
    return (
      <span style={commonSpan({
        color: style.color, textShadow: style.textShadow,
        background: style.backgroundColor, borderRadius: 10, padding: '10px 18px'
      })}>
        {words.map(w=>w.word).join(' ')}
      </span>
    );
  }

  // ===== highlight modes — רנדר לפי שורות =====

  if (mode === 'segmentHighlight') {
    return renderByLines(lines, (w) => {
      const active = now >= w.start && now < w.end;
      return (
        <span style={commonSpan({
          color: active ? '#111' : (style.color ?? '#fff'),
          background: active ? (style.highlightColor ?? '#3b82f6') : 'transparent',
          borderRadius: active ? 8 : 0,
          padding: active ? '0 .25em' : '0 .12em',
          textShadow: style.textShadow
        })}>{w.word}</span>
      );
    }, lineHeight);
  }

  if (mode === 'progressive') {
    return renderByLines(lines, (w) => {
      const before = now >= w.end;
      const active = now >= w.start && now < w.end;
      if (!before && !active) return null; // מציג רק עד המילה הפעילה
      return (
        <span style={commonSpan({
          background: active ? (style.highlightColor ?? '#3b82f6') : 'transparent',
          color: active ? '#111' : (style.color ?? '#fff'),
          borderRadius: active ? 8 : 0,
          padding: active ? '0 .25em' : '0 .12em',
          textShadow: active ? 'none' : style.textShadow
        })}>{w.word}</span>
      );
    }, lineHeight);
  }

  if (mode === 'word-only') {
    return renderByLines(lines, (w) => {
      const active = now >= w.start && now < w.end;
      return (
        <span style={commonSpan({
          color: active ? (style.highlightColor ?? '#3b82f6') : (style.color ?? '#fff'),
          WebkitTextStroke: active ? '0 transparent' : '0.5px rgba(0,0,0,.55)',
          transform: active ? 'scale(1.06)' : 'scale(1)',
          opacity: active ? 1 : 0.8,
          padding: '0 .25em',
          textShadow: active ? 'none' : style.textShadow
        })}>{w.word}</span>
      );
    }, lineHeight);
  }

  if (mode === 'progressive-word-only') {
    return renderByLines(lines, (w) => {
      const before = now >= w.end;
      const active = now >= w.start && now < w.end;
      if (!before && !active) return null; // מצטבר
      return (
        <span style={commonSpan({
          color: active ? (style.highlightColor ?? '#F8FF1C') : (style.color ?? '#fff'),
          WebkitTextStroke: active ? '0 transparent' : '0.5px rgba(0,0,0,.55)',
          transform: active ? 'scale(1.06)' : 'scale(1)',
          opacity: active ? 1 : 0.9,
          padding: '0 .25em',
          textShadow: active ? 'none' : style.textShadow
        })}>{w.word}</span>
      );
    }, lineHeight);
  }

  if (mode === 'karaoke') {
    return renderByLines(lines, (w) => {
      const active = now >= w.start && now < w.end;
      const past = now >= w.end;
      return (
        <span style={commonSpan({
          background: active ? cleanColor(style.highlightColor, '#3b82f6')
                   : (past ? 'rgba(0,0,0,.38)' : 'rgba(0,0,0,.78)'),
          color: active ? '#222' : '#fff',
          borderRadius: 4,
          padding: '0 .25em'
        })}>{w.word}</span>
      );
    }, lineHeight);
  }

  if (mode === 'karaoke-fill') {
    const fade = 0.05;
    const fadeFrames = Math.round(fade * fps);
    return renderByLines(lines, (w) => {
      const startF = Math.floor(w.start * fps);
      const inFade = Math.max(0, Math.min(1, (frame - startF) / Math.max(1, fadeFrames)));
      const p = wordProgress(now, w);
      return (
        <span style={commonSpan({
          position:'relative', padding:'0 6px', opacity: inFade,
          color: style.color, textShadow: style.textShadow
        })}>
          {w.word}
          <span style={{
            position:'absolute', inset:0,
            [rtl ? 'right' : 'left'] : 0,
            width:`${p*100}%`,
            color: style.highlightColor ?? '#F8FF1C',
            overflow:'hidden', whiteSpace:'nowrap', pointerEvents:'none'
          }}>{w.word}</span>
        </span>
      );
    }, lineHeight);
  }

  if (mode === 'youtube') {
    return renderByLines(lines, (w) => {
      const active = now >= w.start && now < w.end;
      return (
        <span style={commonSpan({
          background: active ? cleanColor(style.highlightColor, '#F8FF1C') : 'transparent',
          color: '#fff',
          borderRadius: active ? 4 : 0,
          padding: active ? '0 .25em' : '0 .12em',
          textShadow: active ? 'none' : (style.textShadow ?? '0 0 0 transparent'),
          transform: active ? 'scale(1.05)' : 'none',
          transition: 'transform .15s ease'
        })}>{w.word}</span>
      );
    }, lineHeight);
  }

  if (mode === 'word-by-word') {
    return renderByLines(lines, (w) => {
      const active = now >= w.start && now < w.end;
      return (
        <span style={commonSpan({
          background: active ? cleanColor(style.highlightColor) : 'transparent',
          color: active ? '#181818' : (style.color ?? '#fff'),
          borderRadius: active ? 6 : 0,
          padding: active ? '0 .25em' : '0 .12em',
          transform: active ? 'scale(1.06)' : 'scale(1)',
          transition: 'transform .2s ease'
        })}>{w.word}</span>
      );
    }, lineHeight);
  }

  if (mode === 'word-by-word-cumulative') {
    return renderByLines(lines, (w) => {
      const before = now >= w.end;
      const active = now >= w.start && now < w.end;
      if (!before && !active) return null; // מצטבר
      return (
        <span style={commonSpan({
          background: active ? cleanColor(style.highlightColor) : 'transparent',
          color: active ? '#181818' : (style.color ?? '#fff'),
          borderRadius: active ? 6 : 0,
          padding: active ? '0 .25em' : '0 .12em',
          transform: active ? 'scale(1.06)' : 'scale(1)',
          transition: 'transform .2s ease'
        })}>{w.word}</span>
      );
    }, lineHeight);
  }

  if (mode === 'wave') {
    return renderByLines(lines, (w) => {
      const active = now >= w.start && now < w.end;
      const p = active ? wordProgress(now, w) : 0;
      const dy = active ? (-8 * (0.5 - Math.abs(p - 0.5)) * 2) : 0;
      return (
        <span style={commonSpan({
          display:'inline-block',
          transform:`translateY(${dy}px) ${active?'scale(1.12)':'scale(1)'}`,
          color: active ? cleanColor(style.highlightColor, '#3b82f6') : (style.color ?? '#fff'),
          padding:'0 .12em',
          transition:'transform .2s ease'
        })}>{w.word}</span>
      );
    }, lineHeight);
  }

  if (mode === 'sparkle') {
    return renderByLines(lines, (w) => {
      const active = now >= w.start && now < w.end;
      const c = cleanColor(style.highlightColor, '#F8FF1C');
      const period = Math.round(fps*0.8);
      const phase = (frame % period) / period;
      const a = active ? (0.6 + 0.4 * Math.sin(phase * Math.PI*2)) : 0.35;
      return (
        <span style={commonSpan({
          background:'transparent',
          color: style.color ?? '#fff',
          textShadow: `0 0 6px ${c}, 0 0 ${active?14:10}px ${c}, 0 0 ${active?24:16}px rgba(255,255,255,.25)`,
          transform: active ? 'scale(1.05)' : 'scale(1)',
          filter:`brightness(${1+a*0.3})`,
          padding:'0 .12em'
        })}>{w.word}</span>
      );
    }, lineHeight);
  }

  if (mode === 'neon') {
    const neonColor = style.highlightColor ?? '#0ff';
    const periodSec = 0.9;
    const periodFrames = periodSec * fps;
    return renderByLines(lines, (w) => {
      const startF = w.start * fps;
      const active = now >= w.start && now < w.end;
      const phase = ((frame - startF) / (active ? periodFrames : periodFrames*1.6)) % 1;
      const intensity = (Math.sin(phase * Math.PI * 2) + 1) / 2;
      const small = 4 + intensity * 6;
      const big   = 10 + intensity * 12;
      return (
        <span style={commonSpan({
          padding:'0 .25em',
          color: active ? neonColor : (style.color ?? '#fff'),
          textShadow: active ? `0 0 ${small}px ${neonColor}, 0 0 ${big}px ${neonColor}` : `0 0 2px rgba(0,0,0,.35)`,
          filter: active ? 'brightness(1.05)' : 'none'
        })}>{w.word}</span>
      );
    }, lineHeight);
  }

  if (mode === 'matrix') {
    const dropSec = 0.42;
    return renderByLines(lines, (w) => {
      const t = clamp01((now - w.start) / dropSec);
      if (t <= 0) return <span style={commonSpan()} />;
      const e = easeOutCubic(t);
      const translateY = (-60*(1-e)) + (8 * (e>0.85 ? (e-0.85)/0.15 : 0));
      const opacity = t<0.7 ? t/0.7 : 1;
      const blur = (1-e)*2;
      return (
        <span style={commonSpan({
          display:'inline-block',
          transform:`translateY(${translateY}%) scaleY(${1 + (1-e)*0.1})`,
          opacity, filter:`blur(${blur}px)`,
          color: style.color ?? '#a7f3d0'
        })}>{w.word}</span>
      );
    }, lineHeight);
  }

  if (mode === 'typewriter') {
    return renderByLines(lines, (w) => {
      const before = now >= w.end;
      const active = now >= w.start && now < w.end;
      if (!before && !active) return <span style={commonSpan()} />;
      const p = active ? wordProgress(now, w) : 1;
      const caretLeft = `${p*100}%`;
      return (
        <span style={commonSpan({position:'relative', color: style.color, opacity: before ? 1 : 0.35})}>
          {w.word}
          <span style={{
            position:'absolute', inset:0, [rtl ? 'right' : 'left']:0, width:'100%', overflow:'hidden',
            clipPath: rtl ? `inset(0 ${(1-p)*100}% 0 0)` : `inset(0 0 0 ${(1-p)*100}%)`,
            color: active ? (style.highlightColor ?? '#F8FF1C') : (style.color ?? '#fff')
          }}>{w.word}</span>
          {active && (
            <span style={{
              position:'absolute', top:0, bottom:0, [rtl ? 'right' : 'left']: caretLeft,
              width:2, background: style.highlightColor ?? '#F8FF1C',
              opacity: (Math.floor(frame / Math.round(fps/2)) % 2) ? 1 : 0
            }}/>
          )}
        </span>
      );
    }, lineHeight);
  }

  if (mode === 'papercut') {
    return renderByLines(lines, (w) => {
      const active = now >= w.start && now < w.end;
      const p = wordProgress(now, w);
      const lag = (active ? (1 - Math.pow(1 - p, 3)) : 0) * 6;
      const dx = rtl ? -lag : lag; const dy = lag * 0.6;
      const cardWidth = active ? `${Math.round(p*100)}%` : '0%';
      return (
        <span style={commonSpan({position:'relative', padding:'0 .16em', lineHeight, textShadow:'0 1px 0 rgba(0,0,0,.25)'})}>
          <span style={{
            position:'absolute', inset:'35% 0 15% 0',
            [rtl ? 'right' : 'left']: 0,
            width: cardWidth, background: (style.highlightColor ?? '#00C2A8'),
            borderRadius:6, filter:'blur(1.4px)', opacity: active ? .22 : 0,
            transition: 'width .25s linear', zIndex:-1
          }}/>
          <span aria-hidden style={{
            position:'absolute', inset:0, transform:`translate(${dx}px, ${dy}px)`,
            color:'rgba(0,0,0,.6)', filter:'blur(.6px)', mixBlendMode:'multiply', pointerEvents:'none'
          }}>{w.word}</span>
          <span style={{position:'relative'}}>{w.word}</span>
        </span>
      );
    }, lineHeight);
  }

  if (mode === 'barcode-print') {
    const stripePx = 8;
    return renderByLines(lines, (w) => {
      const active = now >= w.start && now < w.end;
      const before = now >= w.end;
      const p = active ? wordProgress(now, w) : (before ? 1 : 0);
      const bgPos = `${-Math.round((frame % (stripePx*2)))}px 0`;
      return (
        <span style={commonSpan({position:'relative', padding:'0 .12em', color: style.color ?? '#f7f7f7', opacity: before ? 1 : .85})}>
          {w.word}
          {!before && (
            <span style={{
              position:'absolute', inset:0, [rtl ? 'right' : 'left']:0, width:`${Math.round(p*100)}%`,
              overflow:'hidden', color: style.highlightColor ?? '#00C2A8'
            }}>
              <span style={{
                position:'absolute', inset:0,
                backgroundImage: `repeating-linear-gradient(90deg, ${style.highlightColor ?? '#00C2A8'} 0 ${stripePx/2}px, transparent ${stripePx/2}px ${stripePx}px)`,
                backgroundPosition: bgPos,
                WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent',
                filter:'contrast(1.15)'
              }}>{w.word}</span>
            </span>
          )}
        </span>
      );
    }, lineHeight);
  }

  // fallback
  {
    const nodes = words.map((w,i)=>(
      <span key={i} style={commonSpan({color:style.color,textShadow:style.textShadow})}>{w.word}</span>
    ));
    return withSpaces(nodes);
  }
}
