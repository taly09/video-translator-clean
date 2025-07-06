import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  MessageSquare,
  Mic,
  Clock,
  ExternalLink,
  Play
} from 'lucide-react';
import { format } from 'date-fns';

export function TranscriptionCard({ item, index, onClick }) {
  const getSourceIcon = (sourceType) => {
    switch (sourceType) {
      case "whatsapp":
        return <MessageSquare className="w-5 h-5" />;
      case "live":
        return <Mic className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600";
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0m";
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(seconds / 3600);
    if (hours > 0) {
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -2, scale: 1.01 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-lg shadow-slate-200/30 dark:shadow-slate-900/30 hover:shadow-xl hover:shadow-slate-300/40 dark:hover:shadow-slate-900/40 transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />

        <CardContent className="relative p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300">
                {getSourceIcon(item.source_type)}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
{item.created_date && !isNaN(new Date(item.created_date))
  ? format(new Date(item.created_date), "dd/MM/yyyy • HH:mm")
  : "תאריך לא זמין"}
                </p>
              </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(item.status)} font-medium`}>
                {item.status === "completed" ? "הושלם" :
                 item.status === "processing" ? "בתהליך" :
                 item.status === "failed" ? "נכשל" : item.status}
              </Badge>

              {item.duration && (
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                  <Clock className="w-3 h-3" />
                  {formatDuration(item.duration)}
                </div>
              )}
            </div>

            {item.status === "completed" && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
              >
                <Play className="w-4 h-4 text-green-600 dark:text-green-400" />
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}