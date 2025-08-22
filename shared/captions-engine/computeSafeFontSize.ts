// computeSafeFontSize.ts
export function computeSafeFontSize(raw: number | undefined, videoW: number, videoH: number) {
  const baseH = 1080;                          // בסיס עיצוב
  const desired = raw ?? 56;                   // ברירת מחדל אם לא הוגדר
  const scaled = desired * (videoH / baseH);   // סקייל לפי גובה הווידאו
  const cap = Math.min(videoW, videoH) * 0.09; // תקרה יחסית לצלע הקצרה
  return Math.max(14, Math.min(Math.round(scaled), Math.round(cap)));
}
