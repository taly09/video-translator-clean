import React from 'react';

// מאזן טקסט לשתי שורות ע"י \n בנקודה הכי קרובה לאמצע
export const balanceTwoLines = (txt: string): string => {
  const clean = (txt || '').trim().replace(/\s+/g, ' ');
  const words = clean.split(' ');
  if (words.length < 4) return clean;
  const total = clean.length;
  const target = total / 2;
  let acc = 0, bestIdx = 1, bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 0; i < words.length - 1; i++) {
    acc += words[i].length + 1;
    const d = Math.abs(acc - target);
    if (d < bestDiff) { bestDiff = d; bestIdx = i + 1; }
  }
  return words.slice(0, bestIdx).join(' ') + '\n' + words.slice(bestIdx).join(' ');
};

// סטייל קונטיינר אחיד למצב inline (none) – גם לפרונט וגם לרינדור
export const inlineWrapperStyle = ({
  w, rtl, isNoneMode,
}: { w: number; rtl: boolean; isNoneMode: boolean }): React.CSSProperties => {
  return {
    transform: 'translate(-50%,-50%)',
    maxWidth: `${Math.floor(w * 0.8)}px`,
    textAlign: 'center',
    direction: rtl ? 'rtl' : 'ltr',

    // מצב none = שתי שורות “קשיחות”; highlight = שבירה חופשית וטבעית
    whiteSpace: isNoneMode ? 'pre-wrap' : 'normal',
    wordBreak:  isNoneMode ? 'keep-all' : 'normal',
    overflowWrap: isNoneMode ? 'normal' : 'anywhere',
    hyphens: 'none',

    // נתמך בכרום/ספארי; בסדר להשאיר. בדפדפנים אחרים מאזן השורות שלנו עושה את העבודה.
    // @ts-ignore
    textWrap: 'balance',

    lineHeight: 1.15,
    padding: '0.28em 0.6em',
    borderRadius: '0.6em',
    background: isNoneMode ? 'rgba(0,0,0,.28)' : 'transparent',
    backdropFilter: isNoneMode ? 'blur(1.5px)' : undefined,
    border: isNoneMode ? '1px solid rgba(255,255,255,.22)' : undefined,
  };
};

