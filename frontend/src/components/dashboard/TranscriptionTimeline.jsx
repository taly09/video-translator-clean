import React from "react";
import { MessageSquare, Zap, FileText } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Card } from "@/components/ui/card";

export default function TranscriptionTimeline({ transcriptions }) {
  return (
    <div className="space-y-4">
      {transcriptions.map((t) => {
        const date = new Date(t.created_date);
        const formatted = format(date, "eeee, d MMMM yyyy | HH:mm", { locale: he });

        const icon = {
          whatsapp: <MessageSquare className="text-green-500 w-5 h-5" />,
          live: <Zap className="text-purple-500 w-5 h-5" />,
          default: <FileText className="text-blue-500 w-5 h-5" />
        }[t.source_type || "default"];

        const previewText = t.transcript_text
          ? t.transcript_text.split("\n").find(line => line.trim())?.slice(0, 80)
          : "אין תמלול זמין.";

        return (
          <Card key={t.id} className="p-4 bg-white shadow-sm border hover:bg-gray-50 transition">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              {icon}
              <span>{formatted}</span>
            </div>
            <h3 className="text-base font-semibold text-gray-800">
              {t.title || "📝 תמלול חדש"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {previewText}...
            </p>
          </Card>
        );
      })}
    </div>
  );
}
