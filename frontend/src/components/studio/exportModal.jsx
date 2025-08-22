import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Video, FileText } from 'lucide-react';

export default function ExportModal({ transcriptionId, onClose, onBurnSubtitles }) {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState(null);

  const exportOptions = [
    {
      type: 'video_with_subtitles',
      label: 'סרטון עם כתוביות צרובות',
      description: 'צור סרטון חדש עם הכתוביות המעוצבות',
      icon: Video,
      action: onBurnSubtitles
    },
    {
      type: 'srt',
      label: 'קובץ כתוביות SRT',
      description: 'הורד את הכתוביות כקובץ SRT',
      icon: FileText,
      action: () => downloadFile('srt')
    },
    {
      type: 'txt',
      label: 'קובץ טקסט',
      description: 'הורד את הטקסט כקובץ TXT',
      icon: FileText,
      action: () => downloadFile('txt')
    },
    {
      type: 'pdf',
      label: 'מסמך PDF',
      description: 'הורד את התמלול כ-PDF מעוצב',
      icon: FileText,
      action: () => downloadFile('pdf')
    }
  ];

  const downloadFile = async (fileType) => {
    setExporting(true);
    setExportType(fileType);

    try {
      const response = await fetch(`/api/transcriptions/${transcriptionId}/signed-url?file=${fileType}`);
      const data = await response.json();

      if (data.status === 'success') {
        window.open(data.data.url, '_blank');
        setTimeout(onClose, 1000);
      } else {
        alert('שגיאה בהורדת הקובץ');
      }
    } catch (error) {
      console.error('שגיאה בהורדה:', error);
      alert('שגיאה בהורדת הקובץ');
    } finally {
      setExporting(false);
      setExportType(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">ייצוא פרויקט</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          {exportOptions.map(({ type, label, description, icon: Icon, action }) => (
            <button
              key={type}
              onClick={action}
              disabled={exporting}
              className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-purple-400 transition-all text-right disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">{label}</h3>
                  <p className="text-gray-400 text-sm">{description}</p>
                </div>
                {exporting && exportType === type && (
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-white/10">
          <p className="text-gray-400 text-sm text-center">
            הקבצים יישמרו עם העיצובים והשינויים שביצעת
          </p>
        </div>
      </div>
    </div>
  );
}