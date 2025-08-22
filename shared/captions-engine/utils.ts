// צבע: מנקה/מאמת ומחזיר fallback אם צריך
export const cleanColor = (c?: string, fallback: string = '#3b82f6') => {
  if (!c) return fallback;
  const s = String(c).trim();
  return s.length ? s : fallback;
};

/**
 * DEPRECATED: השתמשו ב- computeSafeFontSize מהקובץ הייעודי.
 * נשמר כאן כ-re-export כדי לא לשבור ייבוא קיים.
 */
export { computeSafeFontSize } from './computeSafeFontSize';
