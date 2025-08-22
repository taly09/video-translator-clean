
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Upload as UploadIcon,
  Video,
  Sparkles,
  Mic,
  Globe,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Camera,
  Smartphone,
  Brain,
  Wand2 // Added Wand2 icon for the new studio button
} from 'lucide-react';
import { UploadFile, ExtractDataFromUploadedFile } from '@/integrations/Core';
import { Transcription } from '@/entities/Transcription';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils/createPageUrl";
function guestHeaders() {
  const gid = localStorage.getItem("guest_id");
  const headers = {};
  if (gid) headers["X-Guest-Id"] = gid;
  return { headers, credentials: "include" };
}


export default function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploadStep, setUploadStep] = useState('select'); // select, uploading, processing, complete
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState('he');
  const [quality, setQuality] = useState('high');
  const [error, setError] = useState(null);
  const [transcriptionId, setTranscriptionId] = useState(null);
  const pollTaskStatus = async (celeryId, customId) => {
  let attempts = 0;
  const maxAttempts = 60;

  const interval = setInterval(async () => {
    try {
      // שלב א: סטטוס לפי Celery (לא דורש זהות)
      const r = await fetch(`/api/transcriptions/status/${celeryId}`);
      const j = await r.json();
      const status = j?.data?.status;

      if (status === "SUCCESS" || status === "COMPLETED") {
        clearInterval(interval);

        // שלב ב: שליפת פרטי התמלול לפי customId — עם זהות אורח
        const { headers, credentials } = guestHeaders();
        const det = await fetch(`/api/transcriptions/${customId}`, { headers, credentials });
        if (!det.ok) {
          setError("הסטטוס הצליח, אבל לא הצלחתי להביא פרטי תמלול.");
          setUploadStep("select");
          return;
        }

        setUploadProgress(100);
        setUploadStep("complete");
      } else if (status === "FAILURE") {
        clearInterval(interval);
        setError("העיבוד נכשל. נסה שוב.");
        setUploadStep("select");
      } else {
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError("העיבוד מתעכב מהרגיל. נסה לרענן או לנסות שוב.");
          setUploadStep("select");
        }
      }
    } catch (err) {
      clearInterval(interval);
      setError("שגיאה בבדיקת סטטוס");
      setUploadStep("select");
    }
  }, 1500);
};



  const languages = [
    { code: 'he', name: 'עברית', flag: '🇮🇱' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  const handleFileSelect = (files) => {
    const file = files[0];
    if (!file) return;

    const validTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'audio/mp3', 'audio/wav', 'audio/m4a'];
    if (!validTypes.includes(file.type)) {
      setError('נא בחר קובץ וידאו או אודיו תקין');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setError('גודל הקובץ לא יכול לעלות על 500MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploadStep('ready');
  };

  const handleUpload = async () => {
  if (!selectedFile) return;

  try {
    setUploadStep('uploading');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('language', language);

    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) { clearInterval(uploadInterval); return 90; }
        return prev + 10;
      });
    }, 200);

    // ⬅️ מכאן להחליף
    const { headers } = guestHeaders();

    const response = await fetch('/api/transcribe/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',   // מאפשר קוקי guest_id
      headers,                  // שולח X-Guest-Id אם קיים
    });

    clearInterval(uploadInterval);

    if (!response.ok) throw new Error('Upload failed');

    const data = await response.json();

    // שמירת guest_id חדש אם השרת יצר אחד
    const newGuest = data?.data?.guest_id;
    if (newGuest && !localStorage.getItem("guest_id")) {
      localStorage.setItem("guest_id", newGuest);
    }

    const celeryId = data.data.task_id;        // Celery Task ID
    const customId = data.data.custom_task_id; // המזהה שלך
    setTranscriptionId(customId);

    setUploadProgress(100);
    setUploadStep('processing');

    setTimeout(() => {
      pollTaskStatus(celeryId, customId); // פולינג עם שני מזהים
    }, 1500);
    // ⬅️ עד כאן הבלוק החדש

  } catch (err) {
    console.error('Upload error:', err);
    setError('שגיאה בהעלאת הקובץ. נסה שוב.');
    setUploadStep('select');
  }
};


  // Renamed from openPreviewPage to openStudioPage and updated navigation target
  const openStudioPage = () => {
    if (transcriptionId) {
const url = createPageUrl(`Studio?id=${transcriptionId}`);
      navigate(url);
    } else {
      console.error("אין transcriptionId!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <style>{`
        .glass-effect {
          backdrop-filter: blur(20px);
          background: linear-gradient(145deg,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(255, 255, 255, 0.7) 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .dark .glass-effect {
          background: linear-gradient(145deg,
            rgba(30, 41, 59, 0.9) 0%,
            rgba(30, 41, 59, 0.7) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .upload-zone {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .upload-zone:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.1);
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            העלה וצור כתוביות מדהימות
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            טכנולוגיית AI מתקדמת לתמלול וכתוביות ויזואליות ברמה מקצועית
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {uploadStep === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glass-effect border-0 shadow-2xl upload-zone">
                <CardContent className="p-12">
                  <div
                    className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFileSelect(e.dataTransfer.files);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                          <UploadIcon className="w-12 h-12 text-white" />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                          גרור קבצים או לחץ להעלאה
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 text-lg">
                          תומך בוידאו ואודיו: MP4, MOV, AVI, MP3, WAV
                        </p>
                      </div>

                      <div className="flex justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Video className="w-5 h-5" />
                          <span>עד 500MB</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          <span>איכות HD</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Brain className="w-5 h-5" />
                          <span>AI מתקדם</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,audio/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />

                  {error && (
                    <Alert variant="destructive" className="mt-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>שגיאה</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {uploadStep === 'ready' && selectedFile && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="glass-effect border-0 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Video className="w-6 h-6 text-blue-600" />
                    קובץ נבחר
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                          {selectedFile.name}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        מוכן לעיבוד
                      </Badge>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        שפת התמלול
                      </label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="glass-effect border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              <div className="flex items-center gap-2">
                                <span>{lang.flag}</span>
                                <span>{lang.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        איכות עיבוד
                      </label>
                      <Select value={quality} onValueChange={setQuality}>
                        <SelectTrigger className="glass-effect border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">איכות גבוהה (מומלץ)</SelectItem>
                          <SelectItem value="medium">איכות בינונית</SelectItem>
                          <SelectItem value="fast">מהיר</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadStep('select');
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      בטל
                    </Button>
                    <Button
                      onClick={handleUpload}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      התחל עיבוד
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {(uploadStep === 'uploading' || uploadStep === 'processing') && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="glass-effect border-0 shadow-2xl">
                <CardContent className="p-12 text-center">
                  <div className="space-y-6">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                      {uploadStep === 'uploading' ? (
                        <UploadIcon className="w-12 h-12 text-white" />
                      ) : (
                        <Brain className="w-12 h-12 text-white" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        {uploadStep === 'uploading' ? 'מעלה קובץ...' : 'מעבד באמצעות AI...'}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        {uploadStep === 'uploading' 
                          ? 'העלאה מהירה ומאובטחת לשרתים שלנו'
                          : 'מנתח אודיו ויוצר כתוביות מדויקות'
                        }
                      </p>
                    </div>

                    <div className="max-w-md mx-auto">
                      <Progress value={uploadProgress} className="h-3 mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {uploadProgress}% הושלם
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {uploadStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="glass-effect border-0 shadow-2xl">
                <CardContent className="p-12 text-center">
                  <div className="space-y-6">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-white" />
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        התמלול הושלם בהצלחה!
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        כעת תוכל לערוך ולעצב את הכתוביות בסטודיו
                      </p>
                    </div>

                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={() => {
                          setUploadStep('select');
                          setSelectedFile(null);
                          setTranscriptionId(null);
                        }}
                        variant="outline"
                      >
                        העלה קובץ נוסף
                      </Button>
                      <Button
                        onClick={openStudioPage} // ✅ קורא לפונקציה החדשה
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        עבור לסטודיו
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
