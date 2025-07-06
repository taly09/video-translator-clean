import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, Video, Music, Camera, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UploadZone({ onFileSelected, isUploading }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragActive(false);

  const files = Array.from(e.dataTransfer.files);
  console.log("📂 handleDrop - קבצים שנגררו:", files); // הוספת דיבוג
  if (files.length > 0) {
    console.log("✅ שולח ל-onFileSelected:", files[0]); // הוספת דיבוג
    onFileSelected(files[0]);
  }
};


  const handleFileInput = (e) => {
  const files = Array.from(e.target.files);
  console.log("📂 handleFileInput - קבצים שנבחרו:", files); // הוספת דיבוג
  if (files.length > 0) {
    console.log("✅ שולח ל-onFileSelected:", files[0]); // הוספת דיבוג
    onFileSelected(files[0]);
  }
};


  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('video/')) return Video;
    if (fileType?.startsWith('audio/')) return Music;
    return File;
  };

  return (
    <motion.div
      className="relative"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,.mp4,.mp3,.wav,.m4a"
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />

   <div
  className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 overflow-hidden cursor-pointer ${
    isDragActive
      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
      : 'border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
  }`}
  onClick={() => !isUploading && fileInputRef.current?.click()}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
  }}
>

        <AnimatePresence mode="wait">
          {isDragActive ? (
            <motion.div
              key="drag-active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl"
              >
                <Upload className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                שחרר לכאן!
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                הקובץ יועלה מיד לתמלול
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-24 h-24 mx-auto bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-3xl flex items-center justify-center shadow-lg"
              >
                <Upload className="w-12 h-12 text-slate-600 dark:text-slate-300" />
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  העלה קובץ לתמלול
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  גרור וזרוק קובץ וידאו או אודיו כאן, או לחץ לבחירת קובץ
                </p>
              </div>

              <Button
  onClick={(e) => {
    e.stopPropagation(); // ✅ מונע את פתיחה כפולה
    fileInputRef.current?.click();
  }}
  disabled={isUploading}
  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-8 py-3 text-lg font-semibold rounded-xl"
>
  <Sparkles className="w-5 h-5 mr-2" />
  בחר קובץ
</Button>


              <div className="flex items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400 pt-4">
                <div className="flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  MP4
                </div>
                <div className="flex items-center gap-1">
                  <Music className="w-4 h-4" />
                  MP3
                </div>
                <div className="flex items-center gap-1">
                  <File className="w-4 h-4" />
                  WAV
                </div>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500">
                גודל מקסימלי: 100MB • משך מקסימלי: 60 דקות
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}