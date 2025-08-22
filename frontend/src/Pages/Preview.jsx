import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transcription } from '@/entities/Transcription';
import { createPageUrl } from '@/utils/createPageUrl';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Wand2, Save } from 'lucide-react';
import EditableSegment from '../components/preview/EditableSegment';
import { useDebounce } from '../components/hooks/useDebounce';

export default function PreviewPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const transcriptionId = urlParams.get('id');

  const [transcription, setTranscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState(null);

  const videoRef = useRef(null);
  const segmentsContainerRef = useRef(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!transcriptionId) {
        setError("לא סופק מזהה תמלול.");
        setLoading(false);
        return;
      }
      try {
        const data = await Transcription.get(transcriptionId);
        setTranscription(data);
      } catch (err) {
        setError("שגיאה בטעינת התמלול.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [transcriptionId]);

  // Handle segment text changes with debounce
  const debouncedTranscription = useDebounce(transcription, 1000);

  useEffect(() => {
    if (debouncedTranscription && !loading) {
      handleSave();
    }
  }, [debouncedTranscription]);

  const handleTextChange = useCallback((segmentId, newText) => {
    setTranscription(prev => {
      if (!prev) return null;
      const newSegments = prev.segments.map(seg =>
        seg.id === segmentId ? { ...seg, text: newText } : seg
      );
      return { ...prev, segments: newSegments };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!transcription) return;
    setSaving(true);
    try {
      await Transcription.update(transcription.id, { segments: transcription.segments });
    } catch (error) {
      console.error("שגיאה בשמירת התמלול:", error);
      setError("שגיאה בשמירת השינויים. נסה שוב.");
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  }, [transcription]);

  // Video and segment synchronization
  const handleTimeUpdate = () => {
    if (!transcription || !videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    const activeSeg = transcription.segments.find(seg => time >= seg.start && time <= seg.end);
    if (activeSeg) {
      if (activeSegmentId !== activeSeg.id) {
        setActiveSegmentId(activeSeg.id);
        // Scroll to active segment
        const segmentElement = document.getElementById(`segment-${activeSeg.id}`);
        if (segmentElement && segmentsContainerRef.current) {
          segmentsContainerRef.current.scrollTo({
            top: segmentElement.offsetTop - segmentsContainerRef.current.offsetTop - 50,
            behavior: 'smooth'
          });
        }
      }
    } else {
      setActiveSegmentId(null);
    }
  };

  const handleSegmentClick = (segment) => {
    if (videoRef.current) {
      videoRef.current.currentTime = segment.start;
      videoRef.current.play();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p>טוען תצוגה מקדימה...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 p-4">
        <Alert variant="destructive">
          <AlertTitle>שגיאה</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white" dir="rtl">
      <header className="bg-black/50 backdrop-blur-lg border-b border-white/10 p-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(createPageUrl('Dashboard'))} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            חזרה
          </Button>
          <h1 className="text-xl font-bold truncate">{transcription?.title || 'תיקון תמלול'}</h1>
        </div>
        <div className="flex items-center gap-3">
          {saving && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
          <Button onClick={() => navigate(createPageUrl(`Studio?id=${transcriptionId}`))} className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            המשך לעיצוב
          </Button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 p-4 md:p-8 overflow-hidden">
        {/* Video Player Section */}
        <div className="flex flex-col bg-black rounded-xl overflow-hidden shadow-2xl">
          <div className="flex-1 flex items-center justify-center">
            <video
              ref={videoRef}
              src={transcription?.video_url}
              controls
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
        </div>

        {/* Segments Editor Section */}
        <div className="flex flex-col bg-gray-900/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold">ערוך את הטקסט</h2>
            <p className="text-sm text-gray-400">תקן שגיאות בתמלול לפני המעבר לעיצוב.</p>
          </div>
          <div ref={segmentsContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {transcription?.segments.map(segment => (
              <EditableSegment
                key={segment.id}
                segment={segment}
                onTextChange={handleTextChange}
                isActive={activeSegmentId === segment.id}
                onClick={() => handleSegmentClick(segment)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}