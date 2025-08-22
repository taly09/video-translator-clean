import { measureTextWidth } from './textMeasure';

export type FitResult = { fontSize: number; lines: string[] };

/**
 * התאמת גודל פונט + שבירת שורות לפי מדידה אמיתית, בתוך תיבת boxW x boxH.
 */
export function autoFitFontSize(
  text: string,
  fontFamily: string,
  fontWeight: string | number,
  minPx: number,
  maxPx: number,
  boxW: number,
  boxH: number,
  lineHeight: number
): FitResult {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return { fontSize: minPx, lines: [] };
  const words = clean.split(' ');

  const buildFont = (px: number) => `${fontWeight} ${px}px ${fontFamily}`;

  const buildLines = (px: number): string[] => {
    const font = buildFont(px);
    const out: string[] = [];
    let cur = '';
    for (const w of words) {
      const tryS = cur ? cur + ' ' + w : w;
      const width = measureTextWidth(tryS, font);
      if (width <= boxW) cur = tryS;
      else {
        if (cur) out.push(cur);
        cur = w;
      }
    }
    if (cur) out.push(cur);
    return out;
  };

  const fits = (px: number) => {
    const lines = buildLines(px);
    const h = lines.length * (px * lineHeight);
    const widest = Math.max(0, ...lines.map((ln) => measureTextWidth(ln, buildFont(px))));
    return h <= boxH && widest <= boxW;
  };

  let lo = Math.max(8, Math.floor(minPx));
  let hi = Math.max(lo, Math.floor(maxPx));
  let best = lo;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid)) { best = mid; lo = mid + 1; }
    else { hi = mid - 1; }
  }
  return { fontSize: best, lines: buildLines(best) };
}
