import React, {useState, useEffect} from "react";
import {createPageUrl} from "@/utils/createPageUrl";
import {Transcription} from "@/entities/Transcription";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Textarea} from "@/components/ui/textarea";
import {useLocation, useNavigate} from "react-router-dom";
import {motion, AnimatePresence} from "framer-motion";
import {
    ArrowRight, Clock, Calendar, Pencil, Save, FileText, AlertCircle, Download, Copy, Share2, Video, Film
} from "lucide-react";
import {format} from "date-fns";

const SRTEditor = ({srtBlocks, onUpdateBlock}) => {
    return (
        <div className="space-y-4">
            {srtBlocks.map((block, i) => (
                <motion.div
                    key={i}
                    className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
                    initial={{opacity: 0, y: 10}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: i * 0.05}}
                >
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">
                        {block.start} --&gt; {block.end}
                    </div>
                    <Textarea
                        rows={2}
                        className="w-full bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-blue-500"
                        value={block.text}
                        onChange={(e) => onUpdateBlock(i, e.target.value)}
                    />
                </motion.div>
            ))}
        </div>
    );
};

export default function TranscriptionView() {
    const [transcription, setTranscription] = useState(null);
    const [srtBlocks, setSrtBlocks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [isBurning, setIsBurning] = useState(false);
const [hasBurned, setHasBurned] = useState(false); // שים לב: התחל מ-false תמיד

    const extractFilename = (url) => {
        if (!url) return "";
        try {
            return new URL(url).pathname.split('/').pop();
        } catch {
            return url.split('/').pop();
        }
    };

    const parseSRTToBlocks = (srtText) => {
        if (!srtText) return [];
        const blocks = [];
        const entries = srtText.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
        for (const entry of entries) {
            const lines = entry.trim().split("\n");
            if (lines.length < 2) continue;
            const timeMatch = lines[1].match(/^(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})$/);
            if (!timeMatch) continue;
            blocks.push({start: timeMatch[1], end: timeMatch[2], text: lines.slice(2).join("\n").trim()});
        }
        return blocks;
    };


    function blocksToSRT(blocks) {
        return blocks.map((b, i) => `${i + 1}\n${b.start} --> ${b.end}\n${b.text.trim()}\n`).join("\n");
    }

    useEffect(() => {
        const loadTranscription = async () => {
            setIsLoading(true);
            setError("");
            try {
                const id = new URLSearchParams(location.search).get("id");
                if (!id) {
                    setError("לא סופק מזהה תמלול.");
                    setIsLoading(false);
                    return;
                }

                const data = await Transcription.get(id);
                if (!data) {
                    setError("התמלול לא נמצא.");
                    setIsLoading(false);
                    return;
                }

                const statusRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transcribe/status/${id}`);
                const statusData = await statusRes.json();
                const fullData = {...data, ...statusData};
                setTranscription(fullData);


                if (fullData.srt_url) {
                    const filename = fullData.srt_url.split('/').pop();
                    const srtUrl = `${import.meta.env.VITE_API_BASE_URL}/api/proxy/results/${fullData.id}/${filename}?t=${Date.now()}`;

                    try {
                        const srtRes = await fetch(srtUrl, {credentials: "include"});
                        if (srtRes.ok) {
                            const srtText = await srtRes.text();
                            setSrtBlocks(parseSRTToBlocks(srtText));
                        } else {
                            // fallback to .content
                            if (fullData.content) {
                                setSrtBlocks(parseSRTToBlocks(fullData.content));
                            }
                        }
                    } catch (err) {
                        console.warn("⚠️ CORS או שגיאה אחרת:", err);
                        if (fullData.content) {
                            setSrtBlocks(parseSRTToBlocks(fullData.content));
                        }
                    }
                } else if (fullData.content) {
                    setSrtBlocks(parseSRTToBlocks(fullData.content));
                }


            } catch (e) {
                setError(e.message || "שגיאה בטעינת התמלול.");
            } finally {
                setIsLoading(false);
            }
        };
        loadTranscription();
    }, [location.search]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const newSrtContent = blocksToSRT(srtBlocks);

            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transcriptions/update-srt/${transcription.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({srt_content: newSrtContent}),
            });

            setTranscription(prev => ({...prev, content: newSrtContent}));
            setIsEditing(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (e) {
            console.error("שגיאה בשמירה:", e);
            setError("שגיאה בשמירת השינויים.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleBurnSubtitles = async () => {
        if (isEditing) {
            alert("שינית כתוביות שעדיין לא נשמרו. שמור לפני הטמעה.");
            return;
        }

        try {
            setIsBurning(true);
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transcriptions/burn/${transcription.id}`, {
                method: "POST",
                credentials: "include"
            });

            const data = await res.json();
          if (data.video_with_subs_url) {
  setTranscription(prev => ({ ...prev, video_with_subs_url: data.video_with_subs_url }));
  setHasBurned(true); // ✅ הפעל סטייט אחרי הצלחה
} else {
                alert("שגיאה בהטמעת כתוביות.");
            }

        } catch (e) {
            console.error("❌ שגיאה בהטמעה:", e);
            alert("שגיאה בלתי צפויה בהטמעת כתוביות.");
        } finally {
            setIsBurning(false);
        }
    };

    const downloadFile = (fileUrl, defaultName) => {
        if (!fileUrl) {
            alert("קובץ לא זמין להורדה.");
            return;
        }
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = extractFilename(fileUrl) || defaultName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadProxiedFile = async (type) => {
        if (!transcription || !transcription.id) {
            alert("מזהה תמלול לא זמין.");
            return;
        }

        const fileMap = {
            srt: transcription.srt_url,
            txt: transcription.txt_url,
            pdf: transcription.pdf_url,
            docx: transcription.docx_url,
            burned: transcription.video_with_subs_url  // ✅ הוסף את זה

        };

        const url = fileMap[type];
        if (!url) {
            alert("⚠️ קובץ לא זמין להורדה.");
            return;
        }

        const filename = extractFilename(url);

            const defaultName = type === "burned" ? "video_with_subs.mp4" : filename;

        const proxyUrl = `${import.meta.env.VITE_API_BASE_URL}/api/proxy/results/${transcription.id}/${filename}?t=${Date.now()}`;

        try {
            const res = await fetch(proxyUrl, {
                credentials: "include" // ✅ זה מה שהיה חסר!
            });
            if (!res.ok) throw new Error(`שגיאה בהורדת הקובץ: ${res.statusText}`);

            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("❌ שגיאה בהורדה דרך פרוקסי:", error);
            alert(`❌ שגיאה בהורדת הקובץ: ${error.message}`);
        }
    };


    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Skeleton className="h-10 w-1/4"/>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-4">
                            <Skeleton className="h-48 w-full"/>
                            <Skeleton className="h-64 w-full"/>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-32 w-full"/>
                            <Skeleton className="h-48 w-full"/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8 text-center">
                <Alert variant="destructive" className="max-w-lg mx-auto">
                    <AlertCircle className="w-4 h-4"/>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={() => navigate(createPageUrl("Dashboard"))} className="mt-4">
                    <ArrowRight className="ml-2 w-4 h-4"/> חזור
                </Button>
            </div>
        );
    }

    if (!transcription) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <AnimatePresence>
                    {showSuccess && (
                        <motion.div initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}}
                                    exit={{opacity: 0, y: -20}}>
                            <Alert
                                className="mb-6 bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
                                <AlertDescription>✅ נשמר בהצלחה!</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mb-6">
                    <Button variant="ghost" onClick={() => navigate(createPageUrl("Dashboard"))}>
                        <ArrowRight className="ml-2 h-4 w-4"/> חזור לדשבורד
                    </Button>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <main className="lg:col-span-2 space-y-6">
                        {transcription.video_with_subs_url && (
                            <Card className="glass-effect border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle
                                        className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                        <Video className="w-5 h-5"/>
                                        וידאו עם כתוביות
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <video controls className="w-full rounded-lg shadow-md aspect-video bg-black">
                                        <source
                                            src={`${import.meta.env.VITE_API_BASE_URL}/api/proxy/results/${transcription.id}/${extractFilename(transcription.video_with_subs_url)}`}
                                            type="video/mp4"/>
                                        הדפדפן שלך לא תומך בווידאו.
                                    </video>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="glass-effect border-0 shadow-xl">
                            <CardHeader>
                                <CardTitle
                                    className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                    <FileText className="w-6 h-6"/>
                                    {transcription.title || "פרטי תמלול"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isEditing ? (
                                    <SRTEditor srtBlocks={srtBlocks} onUpdateBlock={(index, text) => {
                                        const newBlocks = [...srtBlocks];
                                        newBlocks[index].text = text;
                                        setSrtBlocks(newBlocks);
                                    }}/>
                                ) : (
                                    <div className="space-y-3 max-h-[60vh] overflow-y-auto p-2">
                                        {srtBlocks.length > 0 ? (
                                            srtBlocks.map((block, i) => (
                                                <div key={i}
                                                     className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-blue-500 p-3 rounded-r-md">
                                                    <div
                                                        className="text-xs text-slate-400 dark:text-slate-500 mb-1 font-mono">{block.start}</div>
                                                    <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{block.text}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-500 dark:text-slate-400">לא נמצאו כתוביות או תוכן
                                                להצגה.</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </main>

                    <aside className="space-y-6">
                        <Card className="glass-effect border-0 shadow-xl">
                            <CardHeader>
                                <CardTitle
                                    className="text-xl font-bold text-slate-900 dark:text-slate-100">פעולות</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {isEditing ? (
                                    <Button onClick={handleSave} disabled={isSaving}
                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                                        <Save className="w-4 h-4 ml-2"/> {isSaving ? 'שומר...' : 'שמור שינויים'}
                                    </Button>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)}
                                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                        <Pencil className="w-4 h-4 ml-2"/> ערוך כתוביות
                                    </Button>
                                )}
                                {isEditing && (
                                    <Button variant="ghost" onClick={() => setIsEditing(false)} className="w-full">
                                        ביטול
                                    </Button>
                                )}
                                <Button variant="outline" className="w-full"
                                        onClick={() => navigator.clipboard.writeText(srtBlocks.map(b => b.text).join('\n'))}>
                                    <Copy className="w-4 h-4 ml-2"/> העתק טקסט
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => downloadProxiedFile('txt')}>
                                    <Download className="w-4 h-4 ml-2"/> הורד .txt
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => downloadProxiedFile('srt')}>
                                    <Download className="w-4 h-4 ml-2"/> הורד .srt
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => downloadProxiedFile('pdf')}>
                                    <Download className="w-4 h-4 ml-2"/> הורד .pdf
                                </Button>
                                <Button variant="outline" className="w-full"
                                        onClick={() => downloadProxiedFile('docx')}>
                                    <Download className="w-4 h-4 ml-2"/> הורד .docx
                                </Button>
                                <Button
                                    onClick={handleBurnSubtitles}
                                    disabled={isBurning}
                                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white"
                                >
                                    <Film className="w-4 h-4 ml-2"/>
                                    {isBurning ? "מטמיע כתוביות..." : "הטמע כתוביות בסרטון"}
                                </Button>
         {hasBurned && transcription.video_with_subs_url?.endsWith('.mp4') && (
  <Button
    variant="outline"
    className="w-full"
    onClick={() => downloadProxiedFile('burned')}
  >
    <Download className="w-4 h-4 ml-2" />
    הורד וידאו עם כתוביות
  </Button>
)}




                            </CardContent>
                        </Card>

                        <Card className="glass-effect border-0 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">פרטי
                                    התמלול</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400">סטטוס</span>
                                    <Badge
                                        className={`${transcription.status === "completed" ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} dark:bg-opacity-30`}>
                                        {transcription.status === "completed" ? 'הושלם' : 'בתהליך'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400">תאריך</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                        {format(new Date(transcription.created_date), "dd/MM/yyyy")}
                      </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400">שפה מזוהה</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                        {transcription.language || "לא זוהה"}
                      </span>
                                </div>
                                {transcription.duration && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 dark:text-slate-400">משך</span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                         {`${Math.floor(transcription.duration / 60)}:${String(Math.round(transcription.duration % 60)).padStart(2, '0')}`}
                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </div>
    );
}