import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Copy, VideoIcon, ExternalLink, CalendarDays,
  Globe, Timer, BadgeCheck, AlertTriangle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function TranscriptionDetails({ transcription, onClose }) {
  if (!transcription) return null;

  const formatDuration = (seconds) => {
    if (!seconds) return "לא זמין";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const statusBadge = {
    completed: {
      text: "הושלם",
      color: "bg-green-100 text-green-800 border-green-200",
      icon: <BadgeCheck className="w-4 h-4 mr-1" />
    },
    processing: {
      text: "בתהליך",
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: <Loader2 className="w-4 h-4 animate-spin mr-1" />
    },
    failed: {
      text: "נכשל",
      color: "bg-red-100 text-red-800 border-red-200",
      icon: <AlertTriangle className="w-4 h-4 mr-1" />
    }
  }[transcription.status || "processing"];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcription.transcript_text || "");
  };

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
      <Card className="shadow-xl border border-gray-200 rounded-xl">
        <CardHeader className="pb-3 border-b bg-gray-50 rounded-t-xl">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              פרטי התמלול
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>סגור</Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-6 text-sm text-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem icon={<FileText />} label="שם קובץ" value={transcription.original_filename} />
            <InfoItem icon={<CalendarDays />} label="תאריך העלאה" value={
              transcription.created_date ? format(new Date(transcription.created_date), "dd/MM/yyyy HH:mm") : "לא זמין"
            } />
            <InfoItem icon={<Globe />} label="שפה" value={
              transcription.language === "he" ? "עברית" :
              transcription.language === "en" ? "אנגלית" :
              transcription.language || "לא זמין"
            } />
            <InfoItem icon={<Timer />} label="אורך" value={formatDuration(transcription.duration)} />
            <div className="flex items-center gap-2">
              <span className="text-gray-500">סטטוס:</span>
              <Badge className={`flex items-center ${statusBadge.color}`}>
                {statusBadge.icon}
                {statusBadge.text}
              </Badge>
            </div>
            {transcription.translated_to && (
              <InfoItem icon={<Globe />} label="שפת תרגום" value={
                transcription.translated_to === "he" ? "עברית" :
                transcription.translated_to === "en" ? "אנגלית" :
                transcription.translated_to
              } />
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-800">תמלול טקסט</h3>
              <Button variant="ghost" size="icon" onClick={copyToClipboard} title="העתק">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="bg-gray-50 p-4 border rounded-lg h-[180px] overflow-y-auto whitespace-pre-wrap text-right font-mono text-sm">
              {transcription.transcript_text || "אין טקסט זמין."}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 mb-2">הורדות</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2">
                <FileText className="w-4 h-4" /> הורד SRT
              </Button>
              <Button variant="outline" className="gap-2">
                <VideoIcon className="w-4 h-4" /> הורד וידאו עם כתוביות
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> הורד טקסט
              </Button>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" /> צפה בוידאו
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-gray-500">{label}:</span>
      <span className="text-gray-800">{value || "לא זמין"}</span>
    </div>
  );
}
