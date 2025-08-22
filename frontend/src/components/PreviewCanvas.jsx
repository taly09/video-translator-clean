import React, { useState, useEffect } from 'react';

function PreviewCanvas({ taskId }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startRender() {
      setLoading(true);
      await fetch(`/api/remotion/render/${taskId}`, {
        method: 'POST',
        credentials: 'include',
      });
      while (!cancelled) {
        const res = await fetch(`/api/transcriptions/${taskId}`, {
          credentials: 'include',
        });
        const json = await res.json();
        const url = json.data?.proxy_urls?.webm;
        if (url) {
          setPreviewUrl(url);
          break;
        }
        await new Promise(r => setTimeout(r, 2000));
      }
      setLoading(false);
    }

    startRender();
    return () => { cancelled = true; };
  }, [taskId]);

  if (loading) {
    return <div style={{ color: 'white' }}>טוען תצוגה מקדימה…</div>;
  }

  return previewUrl ? (
    <video
      src={previewUrl}
      muted
      loop
      style={{ width: 200, height: 'auto', border: '1px solid #444', margin: 8 }}
    />
  ) : null;
}

export default PreviewCanvas;
