import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, AlertCircle, HelpCircle, Sparkles, Settings, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UploadZone } from "@/upload/UploadZone";
import { ProcessingSteps } from "@/upload/ProcessingSteps";
import { useTranslation } from "react-i18next";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/createPageUrl";
import useSSE from "@/hooks/useSSE";

const API = `${import.meta.env.VITE_API_BASE_URL}/api/transcribe`;

export default function UploadPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("auto");
  const [translateTo, setTranslateTo] = useState("");
  const [embedSubs, setEmbedSubs] = useState(true);
  const [taskId, setTaskId] = useState(null);
  const [step, setStep] = useState("starting");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    User.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const savedId = localStorage.getItem("active_task_id");
    if (savedId) {
      setTaskId(savedId);
      setIsProcessing(true);
      setStep("processing");
    }
  }, []);

  useSSE(
    taskId,
    async (data) => {
      if (data.progress !== undefined) setProgress(data.progress);
      if (data.step) setStep(data.step);

      if (data.status === "completed" && data.transcript_text) {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transcriptions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id: taskId,
            title: "תמלול חדש",
            content: data.transcript_text,
            ...data,
            created_date: new Date().toISOString()
          }),
        });

        localStorage.removeItem("active_task_id");
        setIsProcessing(false);
        setTaskId(null);
        navigate(createPageUrl(`TranscriptionView?id=${taskId}`));
      }
    },
    (err) => {
      console.error("SSE Error:", err);
      setError("אירעה שגיאה במהלך העיבוד.");
      setIsProcessing(false);
    }
  );

  const handleUpload = async () => {
    if (!file) return setError("יש לבחור קובץ.");

    setIsProcessing(true);
    setError(null);
    setStep("starting");
    setProgress(0);

    const form = new FormData();
    form.append("video", file);
    form.append("language", language);
    form.append("translate_to", translateTo);
    form.append("embed_subtitles", embedSubs);

    try {
      const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: form,
        credentials: "include"
      });
      const data = await res.json();
      if (data.task_id) {
        setTaskId(data.task_id);
        localStorage.setItem("active_task_id", data.task_id);
      } else {
        throw new Error("לא התקבל מזהה משימה");
      }
    } catch (err) {
      console.error("Upload failed", err);
      setError(err.message || "שגיאה לא צפויה");
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .glass-effect {
          backdrop-filter: blur(20px);
          background: linear-gradient(145deg,
            rgba(255, 255, 255, 0.8) 0%,
            rgba(255, 255, 255, 0.6) 100%);
        }

        .dark .glass-effect {
          background: linear-gradient(145deg,
            rgba(30, 41, 59, 0.8) 0%,
            rgba(30, 41, 59, 0.6) 100%);
        }

        .gradient-text {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .floating-animation {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
      `}</style>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl floating-animation"
            >
              <Upload className="w-8 h-8 text-white" />
            </motion.div>
            <ThemeToggle />
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            <span className="gradient-text">העלאת קובץ לתמלול</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            תמלול אוטומטי מדויק עם AI מתקדם, כולל תרגום וכתוביות מוטמעות
          </p>
        </motion.div>

        {/* Info Banner */}
        {!isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="glass-effect border-0 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    תמלול מתקדם עם AI
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    תומך בקבצי MP4, MP3, WAV • עד 100MB • דיוק של 98%+
                  </p>
                </div>
                <Badge className="mr-auto bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  חדש
                </Badge>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Alert variant="destructive" className="glass-effect border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="glass-effect border-0 shadow-2xl">
                <CardContent className="p-8">
                  <ProcessingSteps currentStep={step} progress={progress} />
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="upload-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Upload Zone */}
              <Card className="glass-effect border-0 shadow-2xl overflow-hidden">
                <CardContent className="p-8">
                  <UploadZone onFileSelected={setFile} isUploading={isProcessing} />

                  {file && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-green-900 dark:text-green-100">
                            ✅ קובץ נבחר בהצלחה
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            {file.name} • {formatFileSize(file.size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFile(null)}
                          className="text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
                        >
                          שנה קובץ
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Settings */}
              <Card className="glass-effect border-0 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                    <Settings className="w-6 h-6" />
                    הגדרות תמלול
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Source Language */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        שפת מקור
                      </Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="glass-effect border-0 shadow-sm h-12">
                          <SelectValue placeholder="בחר שפה" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">🤖 זיהוי אוטומטי</SelectItem>
                          <SelectItem value="he">🇮🇱 עברית</SelectItem>
                          <SelectItem value="en">🇺🇸 אנגלית</SelectItem>
                          <SelectItem value="fr">🇫🇷 צרפתית</SelectItem>
                          <SelectItem value="ar">🇸🇦 ערבית</SelectItem>
                          <SelectItem value="ru">🇷🇺 רוסית</SelectItem>
                          <SelectItem value="es">🇪🇸 ספרדית</SelectItem>
                          <SelectItem value="de">🇩🇪 גרמנית</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Target Language */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        תרגום ל...
                      </Label>
                      <Select value={translateTo} onValueChange={setTranslateTo}>
                        <SelectTrigger className="glass-effect border-0 shadow-sm h-12">
                          <SelectValue placeholder="ללא תרגום" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>🚫 ללא תרגום</SelectItem>
                          <SelectItem value="he">🇮🇱 עברית</SelectItem>
                          <SelectItem value="en">🇺🇸 אנגלית</SelectItem>
                          <SelectItem value="fr">🇫🇷 צרפתית</SelectItem>
                          <SelectItem value="ar">🇸🇦 ערבית</SelectItem>
                          <SelectItem value="ru">🇷🇺 רוסית</SelectItem>
                          <SelectItem value="es">🇪🇸 ספרדית</SelectItem>
                          <SelectItem value="de">🇩🇪 גרמנית</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Embed Subtitles Toggle */}
                  <div className="flex items-center justify-between p-4 glass-effect rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        צור וידאו עם כתוביות מוטמעות
                      </Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        קבל וידאו עם כתוביות שרופות בתוכו, מוכן לשיתוף
                      </p>
                    </div>
                    <Switch
                      checked={embedSubs}
                      onCheckedChange={setEmbedSubs}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleUpload}
                  disabled={!file || isProcessing}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-12 py-4 text-lg font-bold rounded-2xl"
                >
                  <Sparkles className="w-6 h-6 mr-3" />
                  התחל תמלול מתקדם
                  <Upload className="w-6 h-6 mr-3" />
                </Button>
              </div>

              {/* Login Suggestion */}
              {!user && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="glass-effect rounded-2xl p-6 border border-amber-200 dark:border-amber-800 shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg floating-animation">
                      <HelpCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">
                        💾 שמור את התמלולים שלך
                      </h3>
                      <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
                        התחבר כדי לשמור היסטוריית תמלולים, לגשת מכל מכשיר ולקבל תכונות מתקדמות נוספות
                      </p>
                      <Button
                        variant="outline"
                        className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
                      >
                        התחבר עכשיו
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}