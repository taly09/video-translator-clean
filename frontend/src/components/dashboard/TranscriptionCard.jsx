import React from "react";
import {
  MoreVertical,
  Globe,
  CalendarDays,
  Timer,
  BadgeCheck,
  AlertTriangle,
  Loader2,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

const statusMap = {
  completed: {
    text: "הושלם",
    icon: <BadgeCheck className="w-4 h-4 text-green-600" />,
    color: "bg-green-100 text-green-700",
  },
  processing: {
    text: "בתהליך",
    icon: <Loader2 className="w-4 h-4 animate-spin text-blue-600" />,
    color: "bg-blue-100 text-blue-700",
  },
  failed: {
    text: "נכשל",
    icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
    color: "bg-red-100 text-red-700",
  },
};

export default function TranscriptionCard({ transcription, onClick }) {
  const {
    original_filename,
    status = "processing",
    language = "auto",
    detected_language,
    created_at,
    duration,
  } = transcription;

  const statusInfo = statusMap[status] || statusMap.processing;

  return (
    <div
      className="border rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer bg-white flex flex-col justify-between h-full"
      onClick={onClick}
    >
      {/* קובץ + תפריט */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium truncate max-w-[180px]">
            {original_filename || "שם קובץ לא ידוע"}
          </span>
        </div>
        <button className="p-1 text-gray-500 hover:text-gray-700">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* תגית סטטוס */}
      <div className={`flex items-center gap-2 py-1 px-2 rounded-md text-sm font-medium w-fit mb-3 ${statusInfo.color}`}>
        {statusInfo.icon}
        {statusInfo.text}
      </div>

      {/* פרטים נוספים */}
      <div className="text-xs text-gray-600 space-y-1 mt-auto">
        <div className="flex items-center gap-1">
          <CalendarDays className="w-4 h-4 text-gray-400" />
          {created_at
            ? formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: he })
            : "תאריך לא ידוע"}
        </div>
        <div className="flex items-center gap-1">
          <Globe className="w-4 h-4 text-gray-400" />
          {language === "auto"
            ? detected_language || "זיהוי אוטומטי"
            : language}
        </div>
        <div className="flex items-center gap-1">
          <Timer className="w-4 h-4 text-gray-400" />
          {duration
            ? `${Math.round(duration)} שניות`
            : "אורך לא ידוע"}
        </div>
      </div>
    </div>
  );
}
