import React, { useState, useEffect } from "react";
import { createPageUrl } from "@/utils/createPageUrl";
import { Transcription } from "@/entities/Transcription";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight, Clock, Calendar, Pencil, Save, FileText, AlertCircle
} from "lucide-react";
import { format } from "date-fns";

export default function TranscriptionView() {
  const [transcription, setTranscription] = useState(null);
  const [srtContent, setSrtContent] = useState("");
  const [srtBlocks, setSrtBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const parseSRTToBlocks = (srtText) => {
    const blocks = [];
    const entries = srtText.split("\n\n");
    for (const entry of entries) {
      const lines = entry.split("\n");
      if (lines.length >= 3) {
        const times = lines[1].split(" --> ");
        blocks.push({
          start: times[0].trim(),
          end: times[1].trim(),
          text: lines.slice(2).join(" ").trim(),
        });
      }
    }
    return blocks;
  };

  useEffect(() => {
  const load = async () => {
    setIsLoading(true);
    try {
      const id = new URLSearchParams(location.search).get("id");
      if (!id) throw new Error("Missing transcription ID");

      const data = await Transcription.get(id);
if (!data) throw new Error("Transcription not found");

// --- מוסיף קריאה ל־status כדי לקבל את base_name והקישורים
const statusRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transcribe/status/${id}`);
const statusData = await statusRes.json();

// מאחד בין מה ששמור במסד לבין מה שנוצר ע"י Celery
const fullData = { ...data, ...statusData };

setTranscription(fullData);
setEditedContent(fullData.content || "");

console.log("🧾 transcription data (merged):", fullData);



      // שמירה אוטומטית של תמלול אם עוד לא נשמר
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transcriptions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // כדי session יעבוד
          body: JSON.stringify({
  id: data.id,
  title: data.title || "ללא כותרת",
  created_date: data.created_date || new Date().toISOString(),
  content: data.content || "",
  transcript_text: data.transcript_text || "",
  srt_url: data.srt_url,
  txt_url: data.txt_url,
  pdf_url: data.pdf_url,
  docx_url: data.docx_url,
  video_with_subs_url: data.video_with_subs_url,
  detected_language: data.detected_language,
  duration: data.duration,
  status: "done" // ← הוספה קריטית
}),
        });
      } catch (err) {
        console.error("❌ שמירת תמלול נכשלה:", err);
      }

// טוען קובץ SRT אם קיים
if (data.srt_url) {
  // כאן פשוט משתמשים בכתובת מלאה כפי שמגיעה מהשרת, בלי להוסיף בסיס URL או נתיב מקומי
// מחלץ את שם הקובץ מה-url
const urlParts = data.srt_url.split('/');
const filename = urlParts[urlParts.length - 1];

// יוצר URL חדש שמצביע ל־proxy שלך ב־backend
const srtUrl = `${import.meta.env.VITE_API_BASE_URL}/api/proxy/results/${data.id}/${filename}`;

  const srtRes = await fetch(srtUrl);
  if (!srtRes.ok) throw new Error("לא ניתן לטעון קובץ כתוביות");

  const srt = await srtRes.text();
  setSrtContent(srt);
  setSrtBlocks(parseSRTToBlocks(srt));
}



    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  load();
}, []);


  useEffect(() => {
  const fallbackToActiveTask = async () => {
    const urlId = new URLSearchParams(location.search).get("id");
    const activeTaskId = localStorage.getItem("active_task_id");

    // אם אין ID ב-URL אבל כן יש תהליך שרץ
    if (!urlId && activeTaskId) {
      console.log("⏳ מזהה תהליך פעיל מ-localStorage:", activeTaskId);

      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transcribe/status/${activeTaskId}`, {
            credentials: "include"
          });
          const data = await res.json();

          if (data.status === "done" && data.transcript_text) {
            console.log("✅ התמלול הסתיים! ננווט לעמוד עם ID");

            // מסיר את הזיכרון כי המשימה הושלמה
            localStorage.removeItem("active_task_id");

            // שומר את התמלול כדי שתוכל לגשת אליו גם בטעינה
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transcriptions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
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

            // עובר לעמוד התמלול עם ID
            navigate(createPageUrl(`TranscriptionView?id=${activeTaskId}`));
          }
        } catch (err) {
          console.warn("🔴 בעיה בבדיקת סטטוס:", err);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  };

  fallbackToActiveTask();
}, []);

  const handleBack = () => navigate(createPageUrl("Transcriptions"));
  const toggleEdit = () => setIsEditing(prev => !prev);

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      await Transcription.update(transcription.id, {
        content: editedContent,
        status: "done"
      });
      setTranscription({ ...transcription, content: editedContent });
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      setError("נכשל בשמירת התמלול");
    } finally {
      setIsSaving(false);
    }
  };
const downloadFile = async (type) => {
  console.log("⬇️ מנסה להוריד קובץ מסוג:", type);

  const fileMap = {
    srt: transcription?.srt_url,
    txt: transcription?.txt_url,
    pdf: transcription?.pdf_url,
    docx: transcription?.docx_url
  };

  const fileUrl = fileMap[type];
  if (!fileUrl) {
    console.warn("⚠️ קובץ לא קיים:", type);
    alert("⚠️ הקובץ לא קיים להורדה");
    return;
  }

  const regex = new RegExp(`/([^/]+\\.${type})$`, "i");
  const filenameMatch = fileUrl.match(regex);
  if (!filenameMatch) {
    console.error("❌ לא הצלחנו לחלץ שם קובץ מה־URL:", fileUrl);
    alert("⚠️ שם קובץ שגוי");
    return;
  }

  const filename = filenameMatch[1];

  try {
    const proxyUrl = `${import.meta.env.VITE_API_BASE_URL}/api/proxy/results/${transcription.id}/${filename}`;

    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error("שגיאה בהורדת הקובץ");

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    console.log("✅ הקובץ ירד בהצלחה");
  } catch (error) {
    console.error("❌ שגיאה בהורדה:", error);
    alert("❌ לא ניתן להוריד את הקובץ");
  }
};

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="w-4 h-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleBack}>
          <ArrowRight className="ml-2 w-4 h-4" /> חזור
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {showSuccess && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>✅ נשמר בהצלחה</AlertDescription>
          </Alert>
        )}

        <Button variant="ghost" className="mb-6" onClick={handleBack}>
          <ArrowRight className="ml-2 h-4 w-4" /> חזור לתמלולים
        </Button>

        <h1 className="text-3xl font-bold mb-2">
          {isLoading ? <Skeleton className="h-8 w-1/2" /> : transcription.title}
        </h1>

        {!isLoading && (
  <div className="mb-6 border border-blue-100 bg-blue-50 p-4 rounded-lg">
    <h2 className="text-lg font-semibold mb-2">🎉 התמלול שלך מוכן!</h2>
    <p className="text-sm text-gray-700 mb-2">
      תוכל להוריד את הקובץ, לערוך אותו, או לשתף סרטון עם כתוביות.
    </p>
    <p className="text-sm text-gray-700">
      🪙 השתמשת באחד מתוך <strong>3 תמלולים חינמיים</strong>.<br />
      רוצה עוד תמלולים?{" "}
      <a href="/pricing" className="text-blue-600 underline font-medium">
        לחץ כאן לרכישת קרדיטים
      </a>.
    </p>
  </div>
)}

        <div className="flex flex-wrap gap-3 mb-6">
          {transcription?.status === "completed" && (
            <Badge className="bg-green-100 text-green-800 border border-green-300">✅ הושלם</Badge>
          )}
          {transcription?.status === "failed" && (
            <Badge className="bg-red-100 text-red-800 border border-red-300">❌ נכשל</Badge>
          )}
          {transcription?.status !== "completed" && transcription?.status !== "failed" && (
            <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300">⏳ בתהליך</Badge>
          )}

          <Badge variant="outline">{transcription?.language || "auto"}</Badge>

          {transcription?.duration !== undefined && (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-3 w-3 ml-1" />
              משך הסרטון: {`${Math.floor(transcription.duration / 60).toString().padStart(2, "0")}:${(transcription.duration % 60).toString().padStart(2, "0")}`}
            </div>
          )}

          {transcription?.created_date && (
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-3 w-3 ml-1" />
              {format(new Date(transcription.created_date), "dd/MM/yyyy")}
            </div>
          )}
        </div>

        {/* קישורים להורדה או צפייה */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(transcription?.content || "")}>📋 העתק</Button>
          <Button variant="outline" size="sm" onClick={() => downloadFile("txt")}>📄 הורד טקסט</Button>
          <Button variant="outline" size="sm" onClick={() => downloadFile("srt")}>🎬 הורד SRT</Button>
          <Button variant="outline" size="sm" onClick={() => downloadFile("pdf")}>📑 הורד PDF</Button>
          <Button variant="outline" size="sm" onClick={() => downloadFile("docx")}>📝 הורד Word</Button>
          {transcription?.video_with_subs_url && (
            <Button variant="default" size="sm" asChild>
              <a href={`${import.meta.env.VITE_API_BASE_URL}${transcription.video_with_subs_url}`} target="_blank" rel="noopener noreferrer">
                🎥 צפה בסרטון עם כתוביות
              </a>
            </Button>
          )}
          <Button variant="default" size="sm" onClick={toggleEdit}>
            {isEditing ? "ביטול" : <><Pencil className="w-4 h-4 ml-1" /> ערוך</>}
          </Button>
        </div>

        <div className="bg-white border rounded-lg p-4">
          {isLoading ? (
            <Skeleton className="h-60 w-full" />
          ) : isEditing ? (
            <div>
              <Textarea
                rows={16}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
              <div className="text-end mt-2">
                <Button onClick={saveChanges} disabled={isSaving}>
                  {isSaving ? "שומר..." : <><Save className="w-4 h-4 ml-1" /> שמור</>}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {srtBlocks.length > 0 ? (
                srtBlocks.map((block, i) => (
                  <div key={i} className="bg-gray-50 border p-3 rounded-md">
                    <div className="text-xs text-gray-500 mb-1">
                      {block.start} → {block.end}
                    </div>
                    <div className="text-gray-800 whitespace-pre-wrap">{block.text}</div>
                  </div>
                ))
              ) : (
                <pre className="whitespace-pre-wrap leading-relaxed text-gray-700">
                  {transcription?.content || "לא נמצא תוכן לתמלול זה"}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
