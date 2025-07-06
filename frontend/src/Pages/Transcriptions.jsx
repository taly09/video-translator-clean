import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils/createPageUrl";
import { Transcription } from "@/entities/Transcription";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Search, Clock, Calendar, FileText, Mic } from "lucide-react";

export default function Transcriptions() {
  const [transcriptions, setTranscriptions] = useState([]);
  const [filteredTranscriptions, setFilteredTranscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    loadTranscriptions();
  }, []);

  useEffect(() => {
    filterTranscriptions();
  }, [transcriptions, searchQuery, activeFilter]);

 const loadTranscriptions = async () => {
  setIsLoading(true);
  try {
    const response = await Transcription.list({ limit: 50, skip: 0 });
    setTranscriptions(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error("Error loading transcriptions:", error);
    setTranscriptions([]);
  } finally {
    setIsLoading(false);
  }
};



  const filterTranscriptions = () => {
  if (!Array.isArray(transcriptions)) {
    setFilteredTranscriptions([]);
    return;
  }

  let filtered = [...transcriptions];

  if (searchQuery) {
    filtered = filtered.filter(item =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (activeFilter !== "all") {
    filtered = filtered.filter(item => item.status === activeFilter);
  }

  setFilteredTranscriptions(filtered);
};


  const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">התמלולים שלי</h1>
        <p className="text-gray-600">צפייה וניהול של כל התמלולים שלך</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative w-full md:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="חיפוש תמלולים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-3 pr-10"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">הכל</TabsTrigger>
              <TabsTrigger value="processing">בתהליך</TabsTrigger>
              <TabsTrigger value="done">הושלם</TabsTrigger>
              <TabsTrigger value="error">שגיאה</TabsTrigger>
            </TabsList>
          </Tabs>

          <Link to={createPageUrl("Upload")}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Mic className="h-4 w-4 ml-2" />
              תמלול חדש
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <div className="flex gap-4 mb-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTranscriptions.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          {searchQuery || activeFilter !== "all" ? (
            <>
              <h2 className="text-xl font-medium text-gray-700 mb-2">לא נמצאו תמלולים</h2>
              <p className="text-gray-500 mb-6">נסה לשנות את פרמטרי החיפוש או הסינון</p>
              <Button variant="outline" onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}>
                נקה סינון
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-medium text-gray-700 mb-2">אין לך תמלולים עדיין</h2>
              <p className="text-gray-500 mb-6">התחל ליצור תמלולים עכשיו</p>
              <Link to={createPageUrl("Upload")}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Mic className="h-4 w-4 ml-2" />
                  צור תמלול חדש
                </Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTranscriptions
            .filter(t => !!t.id) // ✅ דלג על תמלולים בלי ID
            .map((transcription) => (
              <Link key={transcription.id} to={createPageUrl("TranscriptionView") + `?id=${transcription.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-all h-full flex flex-col">
                  <CardContent className="p-6 flex-grow">
                    <h3 className="font-bold text-xl mb-3 line-clamp-1">{transcription.title}</h3>

                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 ml-1" />
                        {formatDuration(transcription.duration)}
                      </div>

                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 ml-1" />
                        {transcription.created_date && !isNaN(Date.parse(transcription.created_date)) ? (
                          format(new Date(transcription.created_date), "dd/MM/yyyy")
                        ) : "—"}
                      </div>
                    </div>

                    <div className="mb-3">
                      <Badge className={
                        transcription.status === "processing" ? "bg-amber-100 text-amber-800 border-amber-200" :
                        transcription.status === "done" ? "bg-green-100 text-green-800 border-green-200" :
                        "bg-red-100 text-red-800 border-red-200"
                      }>
                        {transcription.status === "processing" ? "בתהליך" :
                         transcription.status === "done" ? "הושלם" : "שגיאה"}
                      </Badge>{" "}
                      <Badge variant="outline">
                        {transcription.language === "he" ? "עברית" :
                         transcription.language === "en" ? "אנגלית" :
                         transcription.language === "ar" ? "ערבית" :
                         transcription.language === "ru" ? "רוסית" :
                         transcription.language === "fr" ? "צרפתית" :
                         transcription.language === "es" ? "ספרדית" :
                         transcription.language}
                      </Badge>
                    </div>

                    {transcription.content ? (
                      <p className="text-gray-600 line-clamp-3">{transcription.content.substring(0, 150)}...</p>
                    ) : (
                      <div className="flex items-center text-amber-600">
                        <div className="animate-spin h-3 w-3 border-2 border-amber-600 border-r-transparent rounded-full ml-2"></div>
                        מעבד את התמלול...
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-0 px-6 pb-6 border-t mt-auto">
                    <Button variant="ghost" className="w-full bg-gray-50 hover:bg-gray-100">
                      צפה בתמלול
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
