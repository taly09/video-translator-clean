// מדידת טקסט דטרמיניסטית (דפדפן / Node), עם fallback מקורב.
type Measure = (s: string, font: string) => number;

let cachedCtx: CanvasRenderingContext2D | null = null;

// דפדפן
const browserMeasure: Measure | null = (() => {
  try {
    const can = (globalThis as any).OffscreenCanvas
      ? new (globalThis as any).OffscreenCanvas(1, 1)
      : (typeof document !== 'undefined' ? document.createElement('canvas') : null);
    const ctx = (can as any)?.getContext?.('2d');
    if (!ctx) return null;
    cachedCtx = ctx as CanvasRenderingContext2D;
    return (s, font) => {
      cachedCtx!.font = font;
      return cachedCtx!.measureText(s).width;
    };
  } catch {
    return null;
  }
})();

// Node (node-canvas או skia-canvas אם קיימים)
const nodeMeasure: Measure | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createCanvas } = require('canvas');
    const can = createCanvas(1, 1);
    const ctx = can.getContext('2d');
    return (s: string, font: string) => {
      ctx.font = font;
      return ctx.measureText(s).width;
    };
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Canvas } = require('skia-canvas');
      const can = new Canvas(1, 1);
      const ctx = can.getContext('2d');
      return (s: string, font: string) => {
        ctx.font = font;
        return ctx.measureText(s).width;
      };
    } catch {
      return null;
    }
  }
})();

// Fallback מקורב
const approx: Measure = (s, font) => {
  const m = /(\d+(?:\.\d+)?)px/i.exec(font);
  const px = m ? parseFloat(m[1]) : 16;
  return s.length * (px * 0.55);
};

export const measureTextWidth: Measure =
  browserMeasure || nodeMeasure || approx;
