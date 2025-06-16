import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Upload, Video, X, Loader2 } from "lucide-react";

export default function DropZone({ onFileSelected, isUploading }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const allowedExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mp3', '.wav', '.ogg', '.opus'];

  const formatFileSize = (size) => {
    if (size < 1024) return size + ' B';
    if (size < 1048576) return (size / 1024).toFixed(1) + ' KB';
    return (size / 1048576).toFixed(1) + ' MB';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const validateFile = (file) => {
    const isAudioOrVideo = file.type.startsWith('video/') || file.type.startsWith('audio/');
    const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    return isAudioOrVideo && hasValidExtension;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      onFileSelected(file);
    } else {
      alert('בבקשה בחר קובץ וידאו או אודיו נתמך');
    }
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      onFileSelected(file);
    } else {
      alert('סוג הקובץ לא נתמך');
    }
  };

  const handleButtonClick = () => inputRef.current?.click();

  const removeFile = () => {
    setSelectedFile(null);
    inputRef.current.value = null;
  };

  return (
    <div className="w-full max-w-xl mx-auto relative">
      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*"
        onChange={handleChange}
        className="hidden"
        disabled={isUploading}
      />

      {dragActive && (
        <div className="absolute inset-0 z-10 bg-blue-100/40 backdrop-blur-sm flex items-center justify-center rounded-xl pointer-events-none">
          <p className="text-blue-800 font-bold text-lg">⬇️ שחרר כאן</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragEnter={handleDrag}
            className={`border-2 border-dashed rounded-xl transition-colors duration-200
              ${dragActive ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300"}
              ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <div
              className="p-8 flex flex-col items-center justify-center min-h-[240px]"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={!isUploading ? handleButtonClick : undefined}
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                ) : (
                  <Video className="w-7 h-7 text-blue-500" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isUploading ? "מעלה קובץ..." : "גרור או בחר קובץ וידאו/אודיו"}
              </h3>
              <p className="text-gray-500 mb-4 text-center max-w-sm">
                {isUploading
                  ? "הקובץ שלך מועלה. נא להמתין לסיום"
                  : "גרור קובץ לכאן או לחץ לבחירה מהמחשב שלך"}
              </p>
              <Button
                variant="outline"
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleButtonClick();
                }}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4" />
                בחר קובץ
              </Button>
              <p className="text-xs text-gray-400 mt-4 text-center">
                תומך: MP4, MOV, AVI, WEBM, MP3, WAV, OGG, OPUS | עד 500MB
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="fileSelected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="border rounded-xl p-6 bg-white flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{selectedFile.name}</h3>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              {!isUploading && (
                <Button variant="ghost" size="icon" onClick={removeFile}>
                  <X className="w-5 h-5 text-gray-400" />
                </Button>
              )}
            </div>

            {selectedFile.type.startsWith("video/") && (
              <video
                src={URL.createObjectURL(selectedFile)}
                controls
                className="rounded-lg w-full max-h-[320px] object-contain border"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
