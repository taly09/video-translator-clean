export type Word = { word: string; start: number; end: number };

export type WordMode =
  | 'none'
  | 'segmentHighlight'
  | 'progressive'
  | 'progressive-word-only'
  | 'word-only'
  | 'karaoke'
  | 'karaoke-fill'
  | 'youtube'
  | 'word-by-word'
  | 'word-by-word-cumulative'
  | 'sparkle'
  | 'wave'
  | 'neon'
  | 'matrix'
  | 'typewriter'
  | 'papercut'
  | 'barcode-print';

export type SegmentStyle = {
  color?: string;
  highlightColor?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  textShadow?: string;
  backgroundColor?: string;
  x?: number; y?: number;
  wordMode?: WordMode;

  // Box mode
  boxType?: 'rect';
  boxX?: number; boxY?: number;
  boxW?: number; boxH?: number;
  boxPadding?: number;
  boxAlign?: 'center'|'start'|'end';
  boxVAlign?: 'middle'|'top'|'bottom';
  frameCorners?: boolean;
  frameColor?: string;
  frameThickness?: number;
  frameLength?: number;

  // הדגשת מילה ספציפית
  highlightWord?: string;
  highlightedWord?: string;

  // להבטיח חישוב גודל אחיד בצריבה
  videoW?: number;
  videoH?: number;
};

export const clamp01 = (v:number)=>Math.max(0,Math.min(1,v));
export const easeOutCubic = (t:number)=>1-Math.pow(1-t,3);
