import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/createPageUrl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Download,
  Copy,
  Edit,
  Save,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Video,
  Languages,
  Calendar,
  Play,
  User,
  Timer
} from "lucide-react";
import { format } from "date-fns";

export default function TranscriptionView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [transcription, setTranscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const taskId = new URLSearchParams(location.search).get("id");

  useEffect(() => {
    if (taskId) {
      loadTranscription();
    } else {
      setError("לא סופק מזהה תמלול");
      setIsLoading(false);
    }
  }, [taskId]);

  const loadTranscription = async () => {
    try {
      setIsLoading(true);
      setError("");

      console.log("📌 Loading transcription for task_id:", taskId);

      // קבלת נתוני התמלול מהבקאנד
      const response = await fetch(`/api/transcriptions/${taskId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`שגיאה בקבלת התמלול: ${response.status}`);
      }

      const result = await response.json();
      console.log("📌 API Response:", result);

      if (result.status !== 'success' || !result.data) {
        throw new Error("תגובה לא תקינה מהשרת");
      }

      const data = result.data;

      // הכנת אובייקט התמלול המלא
      const transcriptionData = {
        id: data._id,
        task_id: data.task_id,
        title: data.title || data.file_name || 'תמלול ללא שם',
        file_name: data.file_name,
        status: data.status,
        language: data.language,
        duration: data.duration,
        content: data.content || (data.result && data.result.content) || "",
        r2_urls: data.r2_urls || {},
        r2_files: data.r2_files || {},
        created_at: data.created_at,
        completed_at: data.completed_at,
        user_id: data.user_id
      };

      console.log("📌 Final transcription data:", transcriptionData);

      setTranscription(transcriptionData);
      setEditedContent(transcriptionData.content);
    } catch (error) {
      console.error('Error loading transcription:', error);
      setError(error.message || "שגיאה בטעינת התמלול");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!transcription) return;

    try {
      setIsSaving(true);
      // כאן תצטרך להוסיף API endpoint לעדכון תוכן התמלול
      // לעת עתה נשמור רק במצב המקומי
      setTranscription(prev => ({ ...prev, content: editedContent }));
      setIsEditing(false);
      setSuccessMessage("התמלול נשמר בהצלחה!");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving transcription:', error);
      setError("שגיאה בשמירת התמלול");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription.content || "");
    setSuccessMessage("הטקסט הועתק!");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const downloadFile = async (fileType) => {
    if (!transcription || !transcription.task_id) {
      setError("מזהה תמלול לא זמין להורדה.");
      return;
    }

    try {
      console.log(`📥 Downloading ${fileType} for task ${transcription.task_id}`);

      // שימוש בפרוקסי של הבקאנד להורדת הקובץ
      const url = `/api/proxy/results/${transcription.task_id}/${fileType}`;
      console.log("📥 Download URL:", url);

      // פתיחת הקישור בחלון חדש להורדה
      window.open(url, '_blank');

      setSuccessMessage(`הורדת ${fileType} החלה!`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

    } catch (err) {
      console.error("Error downloading file:", err);
      setError(`שגיאה בהורדת הקובץ: ${err.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'הושלם';
      case 'processing': return 'מעובד';
      case 'pending': return 'בהמתנה';
      case 'failed': return 'נכשל';
      default: return 'לא ידוע';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'לא ידוע';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return 'תאריך לא תקין';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-8 h-8" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Skeleton className="h-96 w-full" />
              </div>
              <div>
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
            <ArrowRight className="w-4 h-4 mr-2" />
            חזור לדשבורד
          </Button>
        </div>
      </div>
    );
  }

  if (!transcription) return null;

  // קבלת הקבצים הזמינים להורדה
  const availableFiles = [];
  if (transcription.r2_files) {
    Object.keys(transcription.r2_files).forEach(fileType => {
      if (transcription.r2_files[fileType] &&
          !transcription.r2_files[fileType].toString().includes("Local file not found")) {
        availableFiles.push(fileType);
      }
    });
  }
  if (transcription.r2_urls) {
    Object.keys(transcription.r2_urls).forEach(fileType => {
      if (transcription.r2_urls[fileType] && !availableFiles.includes(fileType)) {
        availableFiles.push(fileType);
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    {successMessage}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="mb-4 hover:bg-white/50"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              חזור לדשבורד
            </Button>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {transcription.title}
                  </h1>
                  <div className="flex items-center gap-4 mb-3">
                    <Badge className={`flex items-center gap-1 ${getStatusColor(transcription.status)}`}>
                      {getStatusIcon(transcription.status)}
                      {getStatusText(transcription.status)}
                    </Badge>
                    {transcription.language && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Languages className="w-3 h-3" />
                        {transcription.language}
                      </Badge>
                    )}
                    {transcription.duration && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {formatDuration(transcription.duration)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600">
                    נוצר ב-{formatDate(transcription.created_at)}
                    {transcription.completed_at && transcription.completed_at !== transcription.created_at &&
                      ` • הושלם ב-${formatDate(transcription.completed_at)}`
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Transcription Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        תוכן התמלול
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {!isEditing && transcription.content && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopy}
                              className="hover:bg-blue-50"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              העתק
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsEditing(true)}
                              className="hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              ערוך
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="min-h-[400px] text-lg leading-relaxed resize-none"
                          placeholder="הזן את תוכן התמלול כאן..."
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            {isSaving ? 'שומר...' : 'שמור'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              setEditedContent(transcription.content || "");
                            }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            ביטול
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {transcription.content ? (
                          <div className="prose prose-lg max-w-none">
                            <div className="bg-gray-50 rounded-lg p-6 text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {transcription.content}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">אין תוכן זמין עדיין</p>
                            {transcription.status === 'processing' && (
                              <p className="text-blue-600 mt-2">התמלול עדיין מעובד...</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Download Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      הורדת קבצים
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {availableFiles.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {availableFiles.map((fileType) => (
                          <Button
                            key={fileType}
                            variant="outline"
                            className="w-full justify-start hover:bg-blue-50"
                            onClick={() => downloadFile(fileType)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {fileType.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Download className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>אין קבצים זמינים להורדה</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle>פרטי התמלול</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          תאריך יצירה
                        </span>
                        <span className="font-medium">{formatDate(transcription.created_at)}</span>
                      </div>

                      {transcription.completed_at && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            הושלם ב
                          </span>
                          <span className="font-medium">{formatDate(transcription.completed_at)}</span>
                        </div>
                      )}

                      {transcription.duration && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500 flex items-center gap-2">
                            <Timer className="w-4 h-4" />
                            משך
                          </span>
                          <span className="font-medium">{formatDuration(transcription.duration)}</span>
                        </div>
                      )}

                      {transcription.language && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500 flex items-center gap-2">
                            <Languages className="w-4 h-4" />
                            שפה
                          </span>
                          <span className="font-medium">{transcription.language}</span>
                        </div>
                      )}

                      {transcription.user_id && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            משתמש
                          </span>
                          <span className="font-medium text-xs">{transcription.user_id}</span>
                        </div>
                      )}

                      {transcription.task_id && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-gray-500">מזהה משימה</span>
                          <span className="font-medium text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {transcription.task_id}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}