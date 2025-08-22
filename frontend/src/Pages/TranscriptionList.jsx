import React, { useState, useEffect } from "react";
import { TranscriptionCard } from "@/components/dashboard/TranscriptionCard";
import { Transcription } from "@/entities/Transcription";
import { Input } from "@/components/ui/input";
import { Filter, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TranscriptionList() {
  const [transcriptions, setTranscriptions] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTranscriptions();
  }, []);

  const fetchTranscriptions = async () => {
    try {
      const { results } = await Transcription.list({ limit: 1000 }); // או pagination בעתיד
      setTranscriptions(results);
    } catch (err) {
      console.error("Error loading transcriptions", err);
    }
  };

  const filtered = transcriptions.filter((t) => {
    const matchTitle = (t.title || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchTitle && matchStatus;
  });

  return (
    <div className="container mx-auto px-6 py-10 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          כל התמלולים שלך
        </h1>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          חזור
        </Button>
      </div>

      {/* חיפוש וסינון */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="חפש תמלול..."
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

      {/* הרשימה */}
      <div className="space-y-4">
        {filtered.length ? (
          filtered.map((item, index) => (
            <TranscriptionCard
              key={item.id}
              item={item}
              index={index}
              onClick={() => navigate(`/Studio?id=${item.id}`)}
            />
          ))
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 mt-10">אין תמלולים תואמים</p>
        )}
      </div>
    </div>
  );
}
