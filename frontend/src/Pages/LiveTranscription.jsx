import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mic, MicOff, Square, Play, Pause,
  Download, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

export default function LiveTranscription() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [currentSentence, setCurrentSentence] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [language, setLanguage] = useState("he");
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // 1. בדיקת משתמש
useEffect(() => {
  async function checkUser() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/me`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!data.user) {
window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`;
      } else {
        setUser(data.user);
      }
    } catch {
      navigate("/login");
    }
  }

  checkUser();
}, []); // ← שים לב שאין פה תלות ב־language

  useEffect(() => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language === 'he' ? 'he-IL' : 'en-US';

    recognitionRef.current.onresult = (event) => {
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript + ' ';
        else interim += transcript;
      }

      if (finalText) {
        setTranscription(prev => prev + finalText);
        setCurrentSentence('');
      } else {
        setCurrentSentence(interim);
      }
    };

    recognitionRef.current.onerror = (event) => {
      setError(`שגיאה בזיהוי קול: ${event.error}`);
    };
  } else {
    setError("הדפדפן שלך לא תומך בזיהוי קול");
  }

  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
}, [language]); // ← רץ כל פעם שהשפה משתנה



  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      if (recognitionRef.current) {
        recognitionRef.current.lang = language === 'he' ? 'he-IL' : 'en-US';
        recognitionRef.current.start();
      }

      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch {
      setError("לא ניתן לגשת למיקרופון");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);

    setIsRecording(false);
    setIsPaused(false);
    setCurrentSentence('');
  };

  const pauseRecording = () => {
    if (recognitionRef.current) {
      if (isPaused) {
        recognitionRef.current.start();
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        recognitionRef.current.stop();
        clearInterval(timerRef.current);
      }
    }
    setIsPaused(!isPaused);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const copyToClipboard = () => navigator.clipboard.writeText(transcription);

  const downloadTranscription = () => {
    const file = new Blob([transcription], { type: 'text/plain' });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(file);
    element.download = `תמלול-חי-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
if (user === null) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">יש להתחבר כדי להשתמש בתמלול חי</h2>
        <a href={`${import.meta.env.VITE_API_BASE_URL}/api/auth/google`}>
          <Button size="lg">התחבר עם Google</Button>
        </a>
      </div>
    </div>
  );
}

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
            <Mic className="w-7 h-7 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">תמלול חי</h1>
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pro</Badge>
        </motion.div>
        <p className="text-lg text-slate-600">תמלול בזמן אמת למפגשים, הרצאות ושיחות</p>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <Card className="mb-6">
        <CardHeader><CardTitle>בקרות הקלטה</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <Select value={language} onValueChange={setLanguage} disabled={isRecording}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="he">עברית</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4">
              <div className="text-2xl font-mono font-bold text-slate-800">
                {formatTime(recordingTime)}
              </div>
              {isRecording && (
                <motion.div
                  className="w-4 h-4 bg-red-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>

            <div className="flex gap-2">
              {!isRecording ? (
                <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700" size="lg">
                  <Mic className="w-5 h-5 mr-2" />
                  התחל הקלטה
                </Button>
              ) : (
                <>
                  <Button onClick={pauseRecording} variant="outline" size="lg">
                    {isPaused ? (
                      <>
                        <Play className="w-5 h-5 mr-2" /> המשך
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5 mr-2" /> השהה
                      </>
                    )}
                  </Button>
                  <Button onClick={stopRecording} variant="destructive" size="lg">
                    <Square className="w-5 h-5 mr-2" />
                    עצור
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcription */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>תמלול חי</CardTitle>
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" size="sm" disabled={!transcription}>
                <Copy className="w-4 h-4 mr-2" /> העתק
              </Button>
              <Button onClick={downloadTranscription} variant="outline" size="sm" disabled={!transcription}>
                <Download className="w-4 h-4 mr-2" /> הורד
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
<div className="min-h-64 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto p-4 bg-slate-50 rounded-lg">
            {transcription || currentSentence ? (
              <div className="space-y-2 text-right" dir="rtl">
                {transcription && <p className="text-slate-800 whitespace-pre-wrap">{transcription}</p>}
                {currentSentence && <p className="text-blue-600 opacity-75 italic">{currentSentence}</p>}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-12">
                {isRecording ? (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Mic className="w-8 h-8 text-red-600" />
                    </div>
                    <p>מאזין לקול שלך...</p>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    <MicOff className="w-16 h-16 text-slate-400 mx-auto" />
                    <p>לחץ על "התחל הקלטה" כדי להתחיל</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader><CardTitle>טיפים לתמלול מיטבי</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">איכות השמע</h3>
              <ul className="space-y-1 text-sm text-slate-600 list-disc list-inside">
                <li>דבר בבירור ובקצב מתון</li>
                <li>הקפד על סביבה שקטה</li>
                <li>השתמש במיקרופון איכותי אם אפשר</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">שימוש מיטבי</h3>
              <ul className="space-y-1 text-sm text-slate-600 list-disc list-inside">
                <li>בחר את השפה הנכונה מראש</li>
                <li>השהה בין משפטים</li>
                <li>בדוק את התמלול תוך כדי</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
