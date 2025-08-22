


import React, {
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  type FC,
  type RefObject,
  type MouseEventHandler,
  type TouchEventHandler,
} from 'react';

import type { Word, WordMode, SegmentStyle } from 'C:/CaPlay1/shared/captions-engine';
import { renderCaptions } from 'C:/CaPlay1/shared/captions-engine/renderers';
import { renderBoxedText, computeBoxPx } from 'C:/CaPlay1/shared/captions-engine/box';
import { computeSafeFontSize, balanceTwoLines, inlineWrapperStyle } from 'C:/CaPlay1/shared/captions-engine';
import { cleanColor } from 'C:/CaPlay1/shared/captions-engine/utils';

interface SubtitleRendererProps {
  segment: {
    id: string;
    text: string;
    start: number;
    end: number;
    words?: Array<{ word: string; start: number; end: number }>;
    style: SegmentStyle & {
      x?: number; // 0-100%
      y?: number; // 0-100%
    };
  };
  currentTime: number;
  videoContainerRef: RefObject<HTMLElement>;
  videoResolution: { width: number; height: number };
  isRTL?: boolean;
  isSelected?: boolean;
  onMouseDown?: MouseEventHandler;
  onTouchStart?: TouchEventHandler;
  onClick?: MouseEventHandler;
  onDoubleClick?: MouseEventHandler;
  editingMode?: boolean;
  editingText?: string;
  onEditChange?: (text: string) => void;
  onEditFinish?: () => void;
  onEditCancel?: () => void;
}

function getVideoBox(
  containerRect: { width: number; height: number; left: number; top: number },
  videoWidth: number,
  videoHeight: number,
) {
  const videoAspect = videoWidth / videoHeight;
  const containerAspect = containerRect.width / containerRect.height;

  let width: number, height: number, left: number, top: number;
  if (videoAspect > containerAspect) {
    width = containerRect.width;
    height = width / videoAspect;
    left = 0;
    top = (containerRect.height - height) / 2;
  } else {
    height = containerRect.height;
    width = height * videoAspect;
    top = 0;
    left = (containerRect.width - width) / 2;
  }
  return { width, height, left, top };
}

export const SubtitleRenderer: FC<SubtitleRendererProps> = ({
  segment,
  currentTime,
  videoContainerRef,
  videoResolution,
  isRTL = false,
  isSelected = false,
  editingMode = false,
  editingText = '',
  onEditChange,
  onEditFinish,
  onEditCancel,
  onMouseDown,
  onTouchStart,
  onClick,
  onDoubleClick,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const containerRect =
    videoContainerRef.current?.getBoundingClientRect() ?? {
      width: 0,
      height: 0,
      left: 0,
      top: 0,
    };

  const videoBox = getVideoBox(
    containerRect,
    videoResolution.width,
    videoResolution.height,
  );

  // SAFE באחוזים (לשימור תחושה קיימת)
  const SAFE = { TOP: 10, BOTTOM: 14, SIDE: 5 };
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const leftPct = clamp(segment.style.x ?? 50, SAFE.SIDE, 100 - SAFE.SIDE);
  const topPct  = clamp(segment.style.y ?? 85, SAFE.TOP, 100 - SAFE.BOTTOM);

  // ===== מדידת גודל בזמן אמת =====
  const [measured, setMeasured] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const measure = () => {
      const child = el.firstElementChild as HTMLElement | null;
      const target = child ?? el;
      const r = target.getBoundingClientRect();
      setMeasured({ w: r.width, h: r.height });
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);

    const onWin = () => measure();
    window.addEventListener('resize', onWin);

    return () => {
      window.removeEventListener('resize', onWin);
      ro.disconnect();
    };
  }, [
    editingMode,
    editingText,
    segment.text,
    isRTL,
    segment.style.fontSize,
    segment.style.fontFamily,
    segment.style.fontWeight,
    videoBox.width,
    videoBox.height,
    currentTime,
    segment.style.wordMode,
  ]);

  // ===== Auto-scale + קלמפ מיקום לפי הגודל "אחרי סקייל" =====
  const SAFE_PAD_PX = Math.round(Math.min(videoBox.width, videoBox.height) * 0.02); // ~2%
  const availableW = Math.max(10, videoBox.width  - SAFE_PAD_PX * 2);
  const availableH = Math.max(10, videoBox.height - SAFE_PAD_PX * 2);

  // נעשה scale רק במצבי היילייט; ב-inline 'none' נשאר עם שתי שורות נעולות.
  const mode: WordMode = (segment.style.wordMode as WordMode) || 'none';
const wantsNoWrapAndScale = Boolean(segment.style && (segment.style as any).singleLine);
  const scaleForMode = wantsNoWrapAndScale
    ? Math.min(1,
        measured.w > 0 ? availableW / measured.w : 1,
        measured.h > 0 ? availableH / measured.h : 1
      )
    : 1;

  // מיקום רצוי באחוזים -> פיקסלים
  const desiredCx = videoBox.left + (leftPct / 100) * videoBox.width;
  const desiredCy = videoBox.top  + (topPct  / 100) * videoBox.height;

  // חצי מידות "אחרי סקייל"
  const halfW = (measured.w * scaleForMode) / 2;
  const halfH = (measured.h * scaleForMode) / 2;

  const clampedCx = clamp(
    desiredCx,
    videoBox.left + SAFE_PAD_PX + halfW,
    videoBox.left + videoBox.width - SAFE_PAD_PX - halfW
  );
  const clampedCy = clamp(
    desiredCy,
    videoBox.top + SAFE_PAD_PX + halfH,
    videoBox.top + videoBox.height - SAFE_PAD_PX - halfH
  );

  // מילים
  const words: Word[] = useMemo(() => {
    if (segment.words?.length) return segment.words;
    const raw = segment.text.split(/\s+/).filter(Boolean);
    const dur = Math.max(0.0001, segment.end - segment.start);
    return raw.map((w, i) => {
      const start = segment.start + (i * dur) / Math.max(1, raw.length);
      const end = segment.start + ((i + 1) * dur) / Math.max(1, raw.length);
      return { word: w, start, end };
    });
  }, [segment.words, segment.text, segment.start, segment.end]);

  // גודל פונט בטוח
  const safeFontSize = useMemo(
    () => computeSafeFontSize(segment.style.fontSize, videoBox.width, videoBox.height),
    [segment.style.fontSize, videoBox.width, videoBox.height]
  );

  const fps = 30;
  const frame = Math.max(0, Math.round(currentTime * fps));
  const isBoxMode = segment.style.boxType === 'rect';

  const renderInlineCaptions = () => {
    // מצבי highlight – מתנהגים כמו כתוביות רגילות: לא מכריחים שורה אחת
// מצבי highlight – עטיפה רגילה (לא מכריחים שורה אחת)
if (mode !== 'none') {
  return (
    <span style={{ display: 'inline', whiteSpace: 'normal' }}>
      {renderCaptions(mode, {
        words,
        now: currentTime,
        frame,
        fps,
        rtl: isRTL,
        style: {
          ...segment.style,
          fontFamily: segment.style.fontFamily ?? 'Rubik, Arial, sans-serif',
          fontWeight: segment.style.fontWeight ?? 900,
          color: segment.style.color ?? '#fff',
          backgroundColor: segment.style.backgroundColor ?? 'transparent',
          textShadow: segment.style.textShadow ?? '0 2px 12px #000',
          highlightColor: cleanColor(segment.style.highlightColor, '#3b82f6'),
          fontSize: segment.style.fontSize,
          videoW: videoBox.width,
          videoH: videoBox.height,
        },
      })}
    </span>
  );
}



    // מצב inline "קשיח": שתי שורות נעולות — אין זליגה ואין פירוק מילים
    const balanced = balanceTwoLines(segment.text || '');
    const lines = String(balanced).split('\n');

    return (
      <span
        style={{
          whiteSpace: 'normal',
          lineHeight: 1.15,
          fontFamily: segment.style.fontFamily ?? 'Rubik, Arial, sans-serif',
          fontWeight: segment.style.fontWeight ?? 900,
          fontSize: safeFontSize,
          color: segment.style.color ?? '#fff',
          textShadow: segment.style.textShadow ?? '0 2px 12px #000',
        }}
      >
        {lines.map((ln, i) => (
          <div key={i} style={{ whiteSpace: 'nowrap' }}>
            {ln.split(' ').join('\u00A0')}
          </div>
        ))}
      </span>
    );
  };

  // תוכן
  const content = editingMode ? (
    <textarea
      value={editingText}
      onChange={(e) => onEditChange?.(e.target.value)}
      onBlur={onEditFinish}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onEditFinish?.();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          onEditCancel?.();
        }
      }}
      autoFocus
      className="bg-transparent border-2 border-pink-400 outline-none resize-none text-center w-full"
      style={{
        fontSize: 'inherit',
        fontFamily: 'inherit',
        color: 'inherit',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    />
  ) : isBoxMode ? (
    // מצב Box – מציירים על כל שטח הוידאו (לוגיקת מיקום בתוך renderBoxedText)
    <div style={{ position: 'absolute', inset: 0 }}>
      {renderBoxedText({
        text: segment.text,
        rtl: isRTL,
        videoW: videoBox.width,
        videoH: videoBox.height,
        style: {
          ...segment.style,
          fontFamily: segment.style.fontFamily ?? 'Rubik, Arial, sans-serif',
          fontWeight: segment.style.fontWeight ?? 900,
          fontSize: segment.style.fontSize,
          color: segment.style.color ?? '#fff',
          textShadow: segment.style.textShadow ?? '0 2px 12px #000',
          highlightColor: cleanColor(segment.style.highlightColor, '#3b82f6'),
        },
      })}

      {/* ידיות רסייז/Move – ממוקמות לפי computeBoxPx כדי שייראו בדיוק על הקופסה */}
      {(() => {
        const rect = computeBoxPx(videoBox.width, videoBox.height, segment.style);
        const handles: Array<{ k: string; x: number; y: number; cursor: React.CSSProperties['cursor'] }> = [
          { k: 'nw', x: rect.x,           y: rect.y,           cursor: 'nwse-resize' },
          { k: 'n',  x: rect.x + rect.w/2,y: rect.y,           cursor: 'ns-resize'   },
          { k: 'ne', x: rect.x + rect.w,  y: rect.y,           cursor: 'nwse-resize' },
          { k: 'e',  x: rect.x + rect.w,  y: rect.y + rect.h/2,cursor: 'ew-resize'   },
          { k: 'se', x: rect.x + rect.w,  y: rect.y + rect.h,  cursor: 'nwse-resize' },
          { k: 's',  x: rect.x + rect.w/2,y: rect.y + rect.h,  cursor: 'ns-resize'   },
          { k: 'sw', x: rect.x,           y: rect.y + rect.h,  cursor: 'nwse-resize' },
          { k: 'w',  x: rect.x,           y: rect.y + rect.h/2,cursor: 'ew-resize'   },
        ];
        return (
          <>
            {/* אזור Move על כל הקופסה */}
            <div
              onMouseDown={(e)=> (onMouseDown as any)?.(e)}
              onTouchStart={(e)=> (onTouchStart as any)?.(e)}
              style={{
                position:'absolute',
                left: rect.x, top: rect.y, width: rect.w, height: rect.h,
                outline: isSelected ? '2px solid rgba(236,72,153,.8)' : 'none',
                cursor: 'move',
              }}
            />
            {/* ידיות */}
            {handles.map(h => (
              <div
                key={h.k}
                onMouseDown={(e)=> (onMouseDown as any)?.(e)}
                onTouchStart={(e)=> (onTouchStart as any)?.(e)}
                style={{
                  position:'absolute',
                  left: h.x, top: h.y,
                  width: (h.k==='n' || h.k==='s') ? 24 : 12,
                  height:(h.k==='e' || h.k==='w') ? 24 : 12,
                  background:'rgba(255,255,255,.9)',
                  borderRadius:4,
                  transform:'translate(-50%,-50%)',
                  cursor: h.cursor,
                  boxShadow: '0 1px 3px rgba(0,0,0,.35)',
                }}
              />
            ))}
          </>
        );
      })()}
    </div>
  ) : (
    // מצב Inline רגיל
    <div style={{ display: 'inline-block' }}>
      {renderInlineCaptions()}
    </div>
  );

  return (
    <div
      ref={rootRef}
      data-subtitle-id={segment.id}
      className={[
        'absolute select-none cursor-grab transition-all duration-200 group',
        isSelected ? 'ring-2 ring-pink-500 ring-opacity-70' : '',
      ].join(' ')}
      style={
        isBoxMode
          ? {
              left: `${videoBox.left}px`,
              top: `${videoBox.top}px`,
              width: `${videoBox.width}px`,
              height: `${videoBox.height}px`,
              transform: 'none',
              zIndex: isSelected ? 20 : 10,
              overflow: 'hidden',
            }
          : {
              position: 'absolute',
              left: `${clampedCx}px`,
              top: `${clampedCy}px`,
              // translate כדי למקם במרכז + scale כדי לדחוף הכל פנימה אם צריך
              transform: `translate(-50%,-50%) scale(${scaleForMode})`,
              transformOrigin: 'center',
              zIndex: isSelected ? 20 : 10,
              ['--hl' as any]: segment.style.highlightColor || '#3b82f6',
              ...inlineWrapperStyle({
                w: videoBox.width,
                rtl: isRTL,
                isNoneMode: mode === 'none',
              }),
            }
      }
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {content}
    </div>
  );
};
