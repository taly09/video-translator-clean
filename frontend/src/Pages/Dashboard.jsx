import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils/createPageUrl";
import {
  FileText, Upload, Search, Filter, ChevronRight,
  Loader2, TrendingUp, Clock, MessageSquare,
  BarChart3, Users, Zap, Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Transcription } from "@/entities/Transcription";
import { User } from "@/entities/User";
import { useTranslation } from "react-i18next"; // הוספה אם אין
import { useNavigate } from "react-router-dom"; // מוסיפים בתחילת הקובץ
import TranscriptionTimeline from "@/components/dashboard/TranscriptionTimeline";



export default function Dashboard() {
  const { t, i18n } = useTranslation(); // ✅ הוספת i18n
    const navigate = useNavigate(); // חדש 👈


  const [transcriptions, setTranscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(0);
const PAGE_SIZE = 5;
const [hasMore, setHasMore] = useState(true);


  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    totalDuration: 0,
    averageAccuracy: 98
  });


// ✅ פונקציית fetchData מחוץ ל־useEffect
const fetchData = async (pageNumber = 0) => {
  if (pageNumber === 0) setIsLoading(true);
  try {
    const userData = await User.me();
    setUser(userData);

    const { results, total } = await Transcription.list({
      limit: PAGE_SIZE,
      skip: pageNumber * PAGE_SIZE,
    });

    const valid = results
      .filter((t) => t.id)
      .map((t) => ({
        ...t,
        status: t.status === "done" ? "completed" : t.status || "completed",
      }));

    setTranscriptions((prev) =>
      pageNumber === 0 ? valid : [...prev, ...valid]
    );
    setHasMore((pageNumber + 1) * PAGE_SIZE < total);
    setPage(pageNumber);

    if (pageNumber === 0) {
      const now = new Date();
      const thisMonth = results.filter((t) => {
        const created = new Date(t.created_date);
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      });

      setStats({
        total,
        thisMonth: thisMonth.length,
        totalDuration: results.reduce((sum, t) => sum + (t.duration || 0), 0),
        averageAccuracy: 98,
      });
    }
  } catch (err) {
    console.error("❌ שגיאה ב־fetchData:", err);
  } finally {
    setIsLoading(false);
  }
};

// ✅ והנה ה־useEffect
useEffect(() => {
  fetchData(0); // קריאה ראשונית לדאטה
}, []);

  const filteredTranscriptions = transcriptions.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase()) ||
                         t.content?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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



  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "processing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSourceIcon = (sourceType) => {
    switch (sourceType) {
      case "whatsapp": return <MessageSquare className="w-4 h-4" />;
      case "live": return <Zap className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            שלום {user?.full_name || "משתמש"}! 👋
          </h1>
          <p className="text-slate-600">הנה סקירה של התמלולים שלך</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl("WhatsAppUpload")}>
            <Button variant="outline" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </Button>
          </Link>
          <Link to={createPageUrl("Upload")}>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Upload className="w-4 h-4" />
              תמלול חדש
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="סך התמלולים"
          value={stats.total}
          icon={<FileText className="w-6 h-6" />}
          color="blue"
          change="+12% מהחודש שעבר"
        />
        <StatsCard
          title="החודש"
          value={stats.thisMonth}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
          change="תמלולים חדשים"
        />
        <StatsCard
          title="זמן כולל"
          value={formatDuration(stats.totalDuration)}
          icon={<Clock className="w-6 h-6" />}
          color="purple"
          change="שעות נחסכו"
        />
        <StatsCard
          title="דיוק ממוצע"
          value={`${stats.averageAccuracy}%`}
          icon={<Brain className="w-6 h-6" />}
          color="orange"
          change="מעולה!"
        />
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex justify-between items-center">
  <CardTitle>התמלולים שלי</CardTitle>
  <div className="flex gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        if (!window.confirm("האם לנקות כפולים מקובץ התמלולים?")) return;
        try {
          const res = await fetch("/api/transcriptions/clean_duplicates", {
            method: "POST"
          });
          const json = await res.json();
          if (json.message) {
            alert("✅ " + json.message);
            window.location.reload(); // טען מחדש
          } else {
            alert("⚠️ לא התקבלה תגובה תקינה");
          }
        } catch (err) {
          alert("❌ שגיאה בניקוי: " + err.message);
        }
      }}
    >
      🧹 ניקוי כפולים
    </Button>
    <Link to={createPageUrl("Transcriptions")}>
      <Button variant="ghost" size="sm">
        צפה בכל
        <ChevronRight className="w-4 h-4 mr-1" />
      </Button>
    </Link>
  </div>
</CardHeader>

           <CardContent>
  <div className="space-y-4">
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="חפש תמלולים..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[160px]">
          <Filter className="w-4 h-4 ml-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">כל הסטטוסים</SelectItem>
          <SelectItem value="completed">הושלם</SelectItem>
          <SelectItem value="processing">בתהליך</SelectItem>
          <SelectItem value="failed">נכשל</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {isLoading ? (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-lg"></div>
        ))}
      </div>
    ) : filteredTranscriptions.length > 0 ? (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredTranscriptions.map((transcription) => (
          <motion.div
            key={transcription.id}
            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => {
              if (transcription.id) {
                navigate(createPageUrl(`TranscriptionView?id=${transcription.id}`));
              } else {
                console.warn("⚠️ ניסיון ניווט ללא ID תקף:", transcription);
              }
            }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  {getSourceIcon(transcription.source_type)}
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 line-clamp-1">
                    {transcription.title}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {transcription.created_date &&
                      new Date(transcription.created_date).toLocaleString("he-IL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(transcription.status)}>
                  {t(`status.${transcription.status}`) || t("status.unknown")}
                </Badge>
                {transcription.duration && (
                  <span className="text-xs text-slate-500">
                    {formatDuration(transcription.duration)}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {hasMore && (
          <div className="text-center pt-4">
            <Button
              onClick={() => fetchData(page + 1)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              טען עוד
            </Button>
          </div>
        )}
      </div>
    ) : (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">אין תמלולים התואמים לחיפוש</p>
      </div>
    )}
  </div>
</CardContent>

          </Card>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>פעולות מהירות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to={createPageUrl("Upload")}>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Upload className="w-4 h-4" />
                  העלה וידאו
                </Button>
              </Link>
              <Link to={createPageUrl("WhatsAppUpload")}>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <MessageSquare className="w-4 h-4" />
                  תמלל WhatsApp
                </Button>
              </Link>
              <Link to={createPageUrl("LiveTranscription")}>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Zap className="w-4 h-4" />
                  תמלול חי
                  <Badge className="mr-auto">Pro</Badge>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
  <CardHeader>
    <CardTitle>📅 יומן התמלולים שלי</CardTitle>
  </CardHeader>
  <CardContent>
    <TranscriptionTimeline transcriptions={transcriptions} />
  </CardContent>
</Card>


          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>טיפ היום</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold">השתמש ב-AI Summary</h3>
                <p className="text-sm text-slate-600">
                  קבל סיכום אוטומטי של התמלולים הארוכים שלך עם הנקודות החשובות ביותר
                </p>
                <Button size="sm" className="w-full">למד עוד</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, color, change }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              {change && (
                <p className="text-xs text-slate-500 mt-1">{change}</p>
              )}
            </div>
            <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-xl flex items-center justify-center text-white shadow-lg`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}