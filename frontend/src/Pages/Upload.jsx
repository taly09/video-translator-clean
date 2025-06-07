// UploadPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileUp, HelpCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageHeader from "../components/ui/PageHeader";
import DropZone from "@/upload/DropZone";
import UploadProgress from "@/upload/UploadProgress";
import { useTranslation } from "react-i18next";
import { Transcription } from "@/entities/Transcription";
import { User } from "@/entities/User";
import { createPageUrl } from "../utils/createPageUrl";
import { useNavigate } from "react-router-dom";
import useSSE from "@/hooks/useSSE"; // ⬅ אם שמרת את ההוק במקום הזה



const PYTHON_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/transcribe`;

export default function UploadPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState("auto");
  const [translateTo, setTranslateTo] = useState("");
  const [embedSubtitles, setEmbedSubtitles] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [step, setStep] = useState("starting");
  const [progress, setProgress] = useState(0);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);


  useEffect(() => {
    async function checkUser() {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch {
        // לא מחובר, תקין
      }
    }
    checkUser();
  }, []);

  useEffect(() => {
  const savedTaskId = localStorage.getItem("active_task_id");
  if (savedTaskId) {
    setCurrentTaskId(savedTaskId);
    setIsProcessing(true);
    setStep("processing");
    setProgress(0);
  }
}, []);


  useSSE(currentTaskId, async (data) => {
  console.log("✅ SSE סיים בהצלחה:", data);

  const taskId = currentTaskId; // ← נשמר לפני האיפוס

  await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transcriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      id: taskId,
      title: "תמלול חדש",
      content: data.transcript_text,
      transcript_text: data.transcript_text,
      srt_url: data.srt_url,
      txt_url: data.txt_url,
      pdf_url: data.pdf_url,
      docx_url: data.docx_url,
      video_with_subs_url: data.video_with_subs_url,
      detected_language: data.detected_language,
      duration: data.duration,
      created_date: new Date().toISOString(),
    }),
  });

  localStorage.removeItem("active_task_id");
  setIsProcessing(false);
  setCurrentTaskId(null);
console.log("➡️ לפני ניווט לעמוד תמלול:", createPageUrl(`TranscriptionView?id=${taskId}`));
navigate(createPageUrl(`TranscriptionView?id=${taskId}`));
console.log("✅ ניווט בוצע");
}, (error) => {
  console.error("❌ SSE נכשל:", error);
  setIsProcessing(false);
  setError("אירעה שגיאה בעיבוד התמלול");
});





  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("אנא בחר קובץ וידאו.");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setStep("starting");
    setProgress(0);

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("language", language);
    formData.append("translate_to", translateTo);
    formData.append("embed_subtitles", embedSubtitles.toString());

    try {
      const res = await fetch(`${PYTHON_API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("העלאה נכשלה");

      const result = await res.json();
if (result.task_id) {
  localStorage.setItem("active_task_id", result.task_id); // 🧠 הוספה חשובה
  setCurrentTaskId(result.task_id);
} else {
  throw new Error("לא התקבל מזהה משימה");
}

    } catch (err) {
      setError(`שגיאה בהתחלת התמלול: ${err.message}`);
      setIsProcessing(false);
      setProgress(0);
      setStep("failed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <PageHeader
        title={t("upload.title") || "העלאת וידאו לתמלול"}
        subtitle={t("upload.subtitle") || "העלה קובץ וידאו לתמלול אוטומטי ומדויק"}
        icon={<Upload className="w-8 h-8 text-blue-600" />}
      />

      {/* טיפים לפני העלאה */}
      {!isProcessing && (
        <motion.div className="mb-4 text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
          🎯 מומלץ להעלות סרטונים עד 5 דקות. השירות חינמי ונמצא בהרצה ניסיונית.
        </motion.div>
      )}

      {/* הודעת שגיאה */}
      {error && (
        <Alert variant="destructive" className="mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isProcessing ? (
        <>
          <UploadProgress step={step} progress={progress} />
          <p className="text-center text-gray-500 mt-4 animate-pulse">⏳ התהליך בעיצומו, אנא המתן לסיום...</p>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="mb-6 shadow-lg rounded-xl">
            <CardContent className="space-y-8">
              <DropZone onFileSelected={setSelectedFile} isUploading={isProcessing} />

              {selectedFile && (
                <p className="text-sm text-gray-500 truncate">
                  ✅ קובץ שנבחר: <span className="font-medium">{selectedFile.name}</span>
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="language" className="mb-1">שפת הסרטון</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר שפה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">זיהוי אוטומטי</SelectItem>
                      <SelectItem value="he">עברית</SelectItem>
                      <SelectItem value="en">אנגלית</SelectItem>
                      <SelectItem value="ar">ערבית</SelectItem>
                      <SelectItem value="ru">רוסית</SelectItem>
                      <SelectItem value="fr">צרפתית</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="translateTo" className="mb-1">תרגם לשפה</Label>
                  <Select value={translateTo} onValueChange={setTranslateTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="ללא תרגום" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ללא תרגום</SelectItem>
                      <SelectItem value="he">עברית</SelectItem>
                      <SelectItem value="en">אנגלית</SelectItem>
                      <SelectItem value="ar">ערבית</SelectItem>
                      <SelectItem value="ru">רוסית</SelectItem>
                      <SelectItem value="fr">צרפתית</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="embedSubtitles" className="mb-1">הטמע כתוביות</Label>
                    <p className="text-sm text-gray-500">וידאו חדש עם כתוביות צרובות</p>
                  </div>
                  <Switch
                    id="embedSubtitles"
                    checked={embedSubtitles}
                    onCheckedChange={setEmbedSubtitles}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 transition-all duration-200"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin h-4 w-4 border-t-2 border-white rounded-full mr-2"></span>
                  {t("upload.processing") || "מעבד..."}
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 ml-2" />
                  {t("upload.startTranscription") || "התחל תמלול"}
                </>
              )}
            </Button>
          </div>

          {!user && !isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 border border-amber-300 bg-amber-50 rounded-lg text-amber-800 text-sm flex items-center gap-3"
            >
              <HelpCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1">כדאי להתחבר</p>
                <p>התחבר כדי לשמור את היסטוריית התמלולים שלך ולגשת אליהם מכל מכשיר.</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
