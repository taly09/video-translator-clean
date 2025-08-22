
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transcription } from '@/entities/Transcription';
import { createPageUrl } from '@/utils/createPageUrl';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft, Save, Download, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import pdfMake from "pdfmake/build/pdfmake";
// import customFonts from "@/fonts/custom-fonts";
// pdfMake.vfs = customFonts.vfs;
// pdfMake.fonts = customFonts.fonts;


import { saveAs } from 'file-saver';

export default function TranscriptionStudio() {
  const navigate = useNavigate();

  const [transcription, setTranscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState(null);
  const [subtitles, setSubtitles] = useState([]);

  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const transcriptionId = urlParams.get('id');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const getCurrentSubtitles = () => {
  const current = subtitles.length ? subtitles : transcription?.segments || [];
  console.log("📤 כתוביות לייצוא:", current);
  return current;
};



  useEffect(() => {
    const loadData = async () => {
  if (!transcriptionId) {
    setError("לא סופק מזהה תמלול.");
    setLoading(false);
    return;
  }

  try {
    const response = await Transcription.get(transcriptionId);
const data = response.data; // ✅ הגישה הנכונה לנתונים

console.log("🔍 מה ה־API מחזיר:", data);

if (!data.segments || !data.segments.length) {
  console.warn("⚠️ אין segments בתגובה מהשרת");
}

setTranscription(data); // ✅ שמור את הנתונים התקניים

const processedSubtitles = data.segments?.map((seg, index) => ({

      id: seg.id || `subtitle_${index}`,
      text: seg.text,
      start: seg.start,
      end: seg.end,
style: {
  x: seg.style?.x || 960,
  y: seg.style?.y || 900,
  fontSize: seg.style?.fontSize || 48,
  fontFamily: seg.style?.fontFamily || 'Assistant',
  color: seg.style?.color || '#FFFFFF',
  backgroundColor: seg.style?.backgroundColor || 'rgba(0,0,0,0.8)',
  borderRadius: seg.style?.borderRadius || 8,
  padding: seg.style?.padding || 16,
  textAlign: seg.style?.textAlign || 'center',
  fontWeight: seg.style?.fontWeight || 'bold',
  textShadow: seg.style?.textShadow || '2px 2px 4px rgba(0,0,0,0.8)',
  border: seg.style?.border || '2px solid rgba(255,255,255,0.2)',
}
    })) || [];

    console.log("🎬 כתוביות שעובדו:", processedSubtitles);

    setSubtitles(processedSubtitles);
  } catch (err) {
    setError("שגיאה בטעינת התמלול.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};


    loadData();
  }, [transcriptionId]);

  const updateSubtitle = useCallback((id, updates) => {
    setSubtitles(prev => prev.map(sub =>
      sub.id === id ? { ...sub, ...updates } : sub
    ));
  }, []);

  const updateSubtitleStyle = useCallback((id, styleUpdates) => {
    setSubtitles(prev => prev.map(sub =>
      sub.id === id ? { ...sub, style: { ...sub.style, ...styleUpdates } } : sub
    ));
  }, []);

  const handleSave = async () => {
    if (!transcription) return;
    setSaving(true);

    try {
      const segmentsToSave = subtitles.map(sub => ({
        id: sub.id,
        text: sub.text,
        start: sub.start,
        end: sub.end,
        style: sub.style
      }));



await Transcription.update(transcription.task_id || transcription.id, { segments: segmentsToSave });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError("שגיאה בשמירת השינויים.");
    } finally {
      setSaving(false);
    }
  };

  const selectedSubtitle = subtitles.find(sub => sub.id === selectedSubtitleId);

  const downloadFile = (content, filename, type = 'text/plain') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const exportSRT = () => {
  const currentSubs = getCurrentSubtitles();
  if (!currentSubs.length) {
    alert("אין כתוביות זמינות לייצוא.");
    return;
  }

  const formatTime = (time) => {
    const date = new Date(time * 1000).toISOString().substr(11, 12);
    return date.replace('.', ','); // פורמט תקני ל-SRT
  };

  const srtContent = currentSubs.map((sub, i) => {
    return `${i + 1}
${formatTime(sub.start)} --> ${formatTime(sub.end)}
${sub.text}`;
  }).join('\n\n'); // מפריד בין כתוביות לפי תקן SRT

  downloadFile(srtContent, `${transcription?.title || 'subtitles'}.srt`, 'text/srt');
};

const exportVTT = () => {
  const currentSubs = getCurrentSubtitles();
  if (!currentSubs.length) {
    alert("אין כתוביות זמינות לייצוא.");
    return;
  }

  const formatTime = (time) => {
    const date = new Date(time * 1000).toISOString().substr(11, 12);
    return date.replace(',', '.'); // תקני ל-VTT
  };

  const vttContent = 'WEBVTT\n\n' + currentSubs.map(sub => {
    return `${formatTime(sub.start)} --> ${formatTime(sub.end)}\n${sub.text}`;
  }).join('\n\n');

  downloadFile(vttContent, `${transcription?.title || 'subtitles'}.vtt`, 'text/vtt');
};



const exportJSON = () => {
  const currentSubs = getCurrentSubtitles();
  if (!currentSubs.length) {
    alert("אין כתוביות זמינות לייצוא.");
    return;
  }

  const jsonContent = JSON.stringify(currentSubs, null, 2);
  downloadFile(jsonContent, `${transcription?.title || 'subtitles'}.json`, 'application/json');
};


const exportPDF = () => {
  const currentSubs = getCurrentSubtitles();
  if (!currentSubs.length) {
    alert("אין כתוביות זמינות לייצוא.");
    return;
  }

  const content = currentSubs.map((sub, i) => ({
    text: `${i + 1}. ${sub.text}`,
    margin: [0, 5],
    alignment: 'right',
    fontSize: 14,
  }));

  const docDefinition = {
    content,
    defaultStyle: {
      font: 'NotoSansHebrew', // ← שם הפונט מתוך custom-fonts.js
      alignment: 'right',
    },
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
  };

  pdfMake.createPdf(docDefinition).download(`${transcription?.title || 'כתוביות'}.pdf`);
};



const exportDOCX = () => {
  const currentSubs = getCurrentSubtitles();
  if (!currentSubs.length) {
    alert("אין כתוביות זמינות לייצוא.");
    return;
  }

  const content = currentSubs.map((sub, i) => `${i + 1}. ${sub.text}`).join('\n\n');
  const blob = new Blob([content], { type: 'application/msword' });
  saveAs(blob, `${transcription?.title || 'subtitles'}.doc`);
};




  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p>טוען סטודיו עריכה...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white" dir="rtl">
      {/* הודעת הצלחה */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>השינויים נשמרו בהצלחה!</span>
          </div>
        </div>
      )}

      {/* כותרת */}
      <header className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl(`Preview?id=${transcriptionId}`))}
            className="text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            חזרה לתיקון
          </Button>
          <h1 className="text-xl font-bold">{transcription?.title || 'סטודיו עריכת כתוביות'}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                שמור
              </>
            )}
          </Button>

          <div className="relative">
  <Button
    variant="outline"
    className="border-gray-600 text-white hover:bg-gray-700"
    onClick={() => setShowExportMenu(prev => !prev)}
  >
    <Download className="w-4 h-4 mr-2" />
    ייצוא
  </Button>

  {showExportMenu && (
    <div
      className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-600 rounded shadow-lg flex flex-col z-50 min-w-[160px]"
      onMouseLeave={() => setShowExportMenu(false)}
    >
      <button onClick={() => { exportSRT(); setShowExportMenu(false); }} className="px-4 py-2 text-right hover:bg-gray-700 text-sm text-white">📄 ייצוא כ-SRT</button>
      <button onClick={() => { exportVTT(); setShowExportMenu(false); }} className="px-4 py-2 text-right hover:bg-gray-700 text-sm text-white">📄 ייצוא כ-VTT</button>
      <button onClick={() => { exportJSON(); setShowExportMenu(false); }} className="px-4 py-2 text-right hover:bg-gray-700 text-sm text-white">🧾 ייצוא כ-JSON</button>
      <button onClick={() => { exportPDF(); setShowExportMenu(false); }} className="px-4 py-2 text-right hover:bg-gray-700 text-sm text-white">📄 ייצוא כ-PDF</button>
      <button onClick={() => { exportDOCX(); setShowExportMenu(false); }} className="px-4 py-2 text-right hover:bg-gray-700 text-sm text-white">📝 ייצוא כ-Word</button>
    </div>
  )}
</div>



          <Button
  onClick={async () => {
    try {
      const res = await fetch(`/api/transcriptions/${transcriptionId}/burn`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok) {
        alert("🔥 כתוביות נצרבו בהצלחה!\nניתן לצפות או להוריד את הסרטון.");
        console.log("🎥 URL:", data?.data?.video_url);
      } else {
        alert(`❌ שגיאה בצריבת הכתוביות: ${data.message || 'נסה שוב.'}`);
      }
    } catch (err) {
      console.error("Burn error:", err);
      alert("❌ שגיאה בלתי צפויה בזמן צריבה");
    }
  }}
  className="bg-red-600 hover:bg-red-700"
>
  צרוב כתוביות
</Button>

        </div>
      </header>

      {/* תוכן ראשי */}
      <div className="flex-1 flex overflow-hidden">
        {/* אזור הווידאו */}
        <div className="flex-1 flex flex-col p-4">
          <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
            <video
              src={transcription?.video_url}
              controls
              className="w-full h-full object-contain"
              onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* כתוביות על הווידאו */}
            <div className="absolute inset-0 pointer-events-none">
              {subtitles
                .filter(sub => currentTime >= sub.start && currentTime <= sub.end)
                .map((subtitle) => {
                  const style = subtitle.style || {};
                  const isSelected = subtitle.id === selectedSubtitleId;

                  return (
                    <div
                      key={subtitle.id}
                      className={`absolute pointer-events-auto cursor-pointer transition-all duration-200 ${
                        isSelected ? 'ring-2 ring-purple-400' : 'hover:ring-1 hover:ring-white'
                      }`}
                      style={{
                        left: `${((style.x || 960) / 1920) * 100}%`,
                        top: `${((style.y || 900) / 1080) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${Math.max(16, (style.fontSize || 48) * 0.5)}px`,
                        fontFamily: style.fontFamily || 'Assistant',
                        color: style.color || '#FFFFFF',
                        backgroundColor: style.backgroundColor || 'rgba(0,0,0,0.8)',
                        padding: `${Math.max(8, (style.padding || 16) * 0.5)}px`,
                        borderRadius: `${style.borderRadius || 8}px`,
                        fontWeight: style.fontWeight || 'bold',
                        textAlign: style.textAlign || 'center',
                        textShadow: style.textShadow || '2px 2px 4px rgba(0,0,0,0.8)',
                        border: style.border || '2px solid rgba(255,255,255,0.2)',
                        maxWidth: '70%',
                        wordWrap: 'break-word',
                        zIndex: isSelected ? 20 : 10
                      }}
                      onClick={() => setSelectedSubtitleId(subtitle.id)}
                    >
                      {subtitle.text}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* הוראות */}
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-300 text-center">
              💡 לחץ על כתובית בווידאו כדי לבחור אותה ולערוך את הסגנון שלה
            </p>
          </div>
        </div>

        {/* פאנל עריכה */}
        <div className="w-80 bg-gray-900 border-l border-gray-700 overflow-y-auto">
          {selectedSubtitle ? (
            <div className="p-4 space-y-4">
              <div className="border-b border-gray-700 pb-3">
                <h3 className="text-lg font-semibold">עריכת כתובית</h3>
                <p className="text-sm text-gray-400">
                  {selectedSubtitle.start.toFixed(1)}s - {selectedSubtitle.end.toFixed(1)}s
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  טקסט
                </label>
                <textarea
                  value={selectedSubtitle.text}
                  onChange={(e) => updateSubtitle(selectedSubtitle.id, { text: e.target.value })}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  גודל פונט: {selectedSubtitle.style?.fontSize || 48}
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={selectedSubtitle.style?.fontSize || 48}
                  onChange={(e) => updateSubtitleStyle(selectedSubtitle.id, { fontSize: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  צבע טקסט
                </label>
                <input
                  type="color"
                  value={selectedSubtitle.style?.color || '#FFFFFF'}
                  onChange={(e) => updateSubtitleStyle(selectedSubtitle.id, { color: e.target.value })}
                  className="w-full h-10 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  פונט
                </label>
                <select
                  value={selectedSubtitle.style?.fontFamily || 'Assistant'}
                  onChange={(e) => updateSubtitleStyle(selectedSubtitle.id, { fontFamily: e.target.value })}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                >
                  <option value="Assistant">Assistant</option>
                  <option value="Arial">Arial</option>
                  <option value="Impact">Impact</option>
                  <option value="Montserrat">Montserrat</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400">
              <p className="text-lg mb-2">בחר כתובית</p>
              <p className="text-sm">לחץ על כתובית בווידאו כדי לערוך אותה</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
