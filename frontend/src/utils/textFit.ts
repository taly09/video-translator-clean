// C:\CaPlay1\frontend\src\utils/textFit.ts
export function measure(ctx: CanvasRenderingContext2D, text: string) {
  return ctx.measureText(text).width;
}

export function wrapWordsToLines(ctx: CanvasRenderingContext2D, words: string[], maxWidth: number) {
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (measure(ctx, test) <= maxWidth) {
      cur = test;
    } else {
      if (cur) lines.push(cur);
      // אם מילה אחת עצמה גדולה מדי — דוחפים אותה לבד
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** חיפוש בינארי על גודל הפונט שייכנס לגבולות הקופסה */
export function autoFitFontSize(
  text: string,
  fontFamily: string,
  fontWeight: string|number,
  minPx: number,
  maxPx: number,
  boxWpx: number,
  boxHpx: number,
  lineHeight = 1.15
) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const words = text.trim().split(/\s+/);

  let lo = minPx, hi = maxPx, best = minPx, bestLines: string[] = [];

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    ctx.font = `${fontWeight || 400} ${mid}px ${fontFamily || 'Rubik'}`;
    const lines = wrapWordsToLines(ctx, words, boxWpx);
    const totalH = lines.length * mid * lineHeight;
    if (totalH <= boxHpx) { best = mid; bestLines = lines; lo = mid + 1; }
    else hi = mid - 1;
  }
  return { fontSize: best, lines: bestLines };
}
