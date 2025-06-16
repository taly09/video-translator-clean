import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/createPageUrl";
import {
  FileText,
  Upload,
  Search,
  Filter,
  ChevronRight,
  TrendingUp,
  Clock,
  MessageSquare,
  Zap,
  Brain,
  Plus,
  Sparkles,
  BarChart3,
  Calendar,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Transcription } from "@/entities/Transcription";
import { User } from "@/entities/User";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { TranscriptionCard } from "@/components/dashboard/TranscriptionCard";

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 6;
  const [hasMore, setHasMore] = useState(true);
  const [displayName, setDisplayName] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    totalDuration: 0,
    averageAccuracy: 98
  });

  useEffect(() => {
    if (user?.full_name) {
      const first = user.full_name.split(" ")[0];
      const isHebrew = /^[\u0590-\u05FF]/.test(first);
      setDisplayName(isHebrew ? first : "משתמש");
    }
  }, [user]);

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

  const fetchData = async (pageNumber = 0) => {
    if (pageNumber === 0) setIsLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      const { results, total } = await Transcription.list({
        limit: PAGE_SIZE,
        skip: pageNumber * PAGE_SIZE
      });

      const valid = results
        .filter((t) => t.id)
        .map((t) => ({
          ...t,
          status: t.status === "done" ? "completed" : t.status || "completed"
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
          averageAccuracy: 98
        });
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(0);
  }, []);

  const filteredTranscriptions = transcriptions.filter((t) => {
    const matchesSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.content?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
        >
          <div className="space-y-2">
            <motion.h1
              className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              שלום <span className="gradient-text">{displayName}</span>!
              <motion.span
                animate={{ rotate: [0, 20, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="inline-block ml-2"
              >
                👋
              </motion.span>
            </motion.h1>
            <motion.p
              className="text-xl text-slate-600 dark:text-slate-300"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              הנה סקירה של התמלולים שלך
            </motion.p>
          </div>

          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <ThemeToggle />

            <Link to={createPageUrl("WhatsAppUpload")}>
              <Button
                variant="outline"
                className="glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </Link>

            <Link to={createPageUrl("Upload")}>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-gradient">
                <Upload className="w-4 h-4 mr-2" />
                תמלול חדש
                <Sparkles className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="סך התמלולים"
            value={stats.total}
            icon={FileText}
            color="blue"
            change="+12% מהחודש שעבר"
            delay={0.1}
          />
          <StatsCard
            title="החודש"
            value={stats.thisMonth}
            icon={TrendingUp}
            color="green"
            change="תמלולים חדשים"
            delay={0.2}
          />
          <StatsCard
            title="זמן כולל"
            value={formatDuration(stats.totalDuration)}
            icon={Clock}
            color="purple"
            change="שעות נחסכו"
            delay={0.3}
          />
          <StatsCard
            title="דיוק ממוצע"
            value={`${stats.averageAccuracy}%`}
            icon={Brain}
            color="orange"
            change="מעולה!"
            delay={0.4}
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Transcriptions List */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="glass-effect border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="w-6 h-6" />
                      התמלולים שלי
                    </CardTitle>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="glass-effect border-0 hover:scale-105 transition-all duration-300"
                        onClick={async () => {
                          if (!window.confirm("האם לנקות כפולים מקובץ התמלולים?")) return;
                          try {
                            const res = await fetch("/api/transcriptions/clean_duplicates", { method: "POST" });
                            const json = await res.json();
                            alert(json.message ? `✅ ${json.message}` : "⚠️ לא התקבלה תגובה תקינה");
                            window.location.reload();
                          } catch (err) {
                            alert(`❌ שגיאה: ${err.message}`);
                          }
                        }}
                      >
                        🧹 ניקוי כפולים
                      </Button>

                      <Link to={createPageUrl("Transcriptions")}>
                        <Button variant="ghost" size="sm" className="hover:scale-105 transition-all duration-300">
                          צפה בכל
                          <ChevronRight className="w-4 h-4 mr-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Search and Filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="חפש תמלולים..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pr-10 glass-effect border-0 shadow-sm focus:shadow-md transition-all duration-300"
                      />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[160px] glass-effect border-0 shadow-sm">
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

                  {/* Transcriptions Grid */}
                  {isLoading ? (
                    <div className="grid gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-slate-200/50 dark:bg-slate-700/50 animate-pulse rounded-xl" />
                      ))}
                    </div>
                  ) : filteredTranscriptions.length ? (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {filteredTranscriptions.map((item, index) => (
                          <TranscriptionCard
                            key={item.id}
                            item={item}
                            index={index}
                            onClick={() => navigate(createPageUrl(`TranscriptionView?id=${item.id}`))}
                          />
                        ))}
                      </AnimatePresence>

                      {hasMore && (
                        <motion.div
                          className="text-center pt-6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <Button
                            onClick={() => fetchData(page + 1)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          >
                            טען עוד
                            <Plus className="w-4 h-4 mr-2" />
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      className="text-center py-12"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center">
                        <FileText className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-lg">אין תמלולים תואמים לחיפוש</p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="glass-effect border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    פעולות מהירות
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to={createPageUrl("Upload")}>
                    <Button variant="outline" className="w-full justify-start gap-3 glass-effect border-0 hover:scale-105 transition-all duration-300">
                      <Upload className="w-4 h-4" />
                      העלה וידאו
                    </Button>
                  </Link>
                  <Link to={createPageUrl("WhatsAppUpload")}>
                    <Button variant="outline" className="w-full justify-start gap-3 glass-effect border-0 hover:scale-105 transition-all duration-300">
                      <MessageSquare className="w-4 h-4" />
                      תמלל WhatsApp
                    </Button>
                  </Link>
                  <Link to={createPageUrl("LiveTranscription")}>
                    <Button variant="outline" className="w-full justify-start gap-3 glass-effect border-0 hover:scale-105 transition-all duration-300">
                      <Zap className="w-4 h-4" />
                      תמלול חי
                      <Badge className="mr-auto bg-gradient-to-r from-amber-400 to-orange-500 text-white">Pro</Badge>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Analytics Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card className="glass-effect border-0 shadow-xl floating-animation">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    ניתוח שימוש
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">השבוע</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">5 תמלולים</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-3/4"></div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      75% מהמכסה השבועית
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tip Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card className="glass-effect border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    טיפ היום
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg floating-animation">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      השתמש ב-AI Summary
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      קבל סיכום אוטומטי של התמלולים הארוכים שלך וחסוך זמן יקר
                    </p>
                    <Button size="sm" className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      למד עוד
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}