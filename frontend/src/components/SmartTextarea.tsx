// src/components/SmartTextarea.tsx
import React, {useMemo, useRef, useEffect, useLayoutEffect} from 'react';
import { Textarea } from '@/components/ui/textarea';

type Props = React.ComponentProps<typeof Textarea> & {
  forceDir?: 'rtl' | 'ltr' | 'auto';
  fallbackDir?: 'rtl' | 'ltr';
  caretOnFocus?: 'logical-end' | 'visual-end';
};

const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF]/; // עברית/ערבית
const LTR_RE = /[A-Za-z]/;

function stripBidiMarks(s: string) {
  return s.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
}

function detectDir(text: string, fallback: 'rtl'|'ltr'): 'rtl'|'ltr' {
  const clean = stripBidiMarks(text || '');
  for (const ch of clean) {
    if (RTL_RE.test(ch)) return 'rtl';
    if (LTR_RE.test(ch)) return 'ltr';
  }
  return fallback;
}

export function SmartTextarea({
  forceDir = 'auto',
  fallbackDir = 'rtl',
  caretOnFocus = 'visual-end',
  value,
  defaultValue,
  style,
  onChange,
  ...rest
}: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const textForDir =
    typeof value === 'string' ? value :
    typeof defaultValue === 'string' ? defaultValue : '';

  const computedDir: 'rtl' | 'ltr' = useMemo(() => {
    if (forceDir === 'rtl' || forceDir === 'ltr') return forceDir;
    return detectDir(textForDir, fallbackDir);
  }, [forceDir, textForDir, fallbackDir]);

  // פונקציה שממקמת את הסמן בקצה ויזואלי
  const placeCaretVisualEnd = () => {
    const el = ref.current;
    if (!el) return;
    try {
      const len = el.value?.length ?? 0;
      if (caretOnFocus === 'logical-end') {
        el.setSelectionRange(len, len);
      } else {
        // visual-end: RTL -> תחילת המחרוזת (שמאל), LTR -> סוף (ימין)
        if (computedDir === 'rtl') el.setSelectionRange(0, 0);
        else el.setSelectionRange(len, len);
      }
    } catch {}
  };

  // אם האוטופוקוס קרה לפני שנרשמנו -> נטפל מיד אחרי מונט
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el === document.activeElement) {
      // אחרי ציור ראשון
      requestAnimationFrame(placeCaretVisualEnd);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // בכל פוקוס – למקם סמן
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onFocus = () => requestAnimationFrame(placeCaretVisualEnd);
    el.addEventListener('focus', onFocus);
    return () => el.removeEventListener('focus', onFocus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedDir, caretOnFocus]);

  // אם הערך משתנה בזמן שהשדה בפוקוס – לשמור קצה ויזואלי
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el === document.activeElement) {
      requestAnimationFrame(placeCaretVisualEnd);
    }
  }, [value, computedDir]); // ← זה הפיקסר העיקרי

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!onChange) return;
    const cleaned = stripBidiMarks(e.target.value);
    if (cleaned !== e.target.value) {
      const pos = cleaned.length;
      e.target.value = cleaned;
      try { e.target.setSelectionRange(pos, pos); } catch {}
    }
    onChange(e);
  };

  return (
    <Textarea
      {...rest}
      ref={ref}
      dir={computedDir}
      style={{
        direction: computedDir,
        textAlign: computedDir === 'rtl' ? 'right' : 'left',
        unicodeBidi: 'isolate', // <— במקום plaintext
        ...(style || {}),
      }}
      value={value as any}
      defaultValue={defaultValue as any}
      onChange={handleChange}
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
    />
  );
}
