import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function ExportDropdown({ transcriptionId }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const exportTypes = [
    { type: 'srt', label: 'תמלול SRT', icon: '📄' },
    { type: 'pdf', label: 'מסמך PDF', icon: '📋' },
    { type: 'docx', label: 'מסמך Word', icon: '📝' },
    { type: 'txt', label: 'קובץ טקסט', icon: '📄' },
    { type: 'mp4', label: 'סרטון MP4', icon: '🎬' }
  ];

  const handleExport = async (type) => {
    try {
      const res = await fetch(`/api/transcriptions/${transcriptionId}/signed-url?file=${type}`);
      const json = await res.json();

      if (json.status === 'success') {
        window.open(json.data.url, '_blank');
      } else {
        alert(`⚠️ לא נמצא קובץ מסוג ${type.toUpperCase()}`);
      }
    } catch (error) {
      alert("שגיאה בהורדת הקובץ");
    } finally {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        className="border-white/20 hover:bg-white/10 text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Download className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">ייצוא</span>
      </Button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-gray-800 border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            {exportTypes.map(({ type, label, icon }) => (
              <button
                key={type}
                className="w-full text-right px-3 py-2 text-sm text-white hover:bg-purple-600/50 transition-colors flex items-center justify-between"
                onClick={() => handleExport(type)}
              >
                <span className="flex items-center gap-2"><span>{icon}</span>{label}</span>
                <span className="text-xs text-gray-400 uppercase">{type}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}