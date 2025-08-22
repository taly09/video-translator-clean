import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils/createPageUrl";
import { Transcription } from '@/entities/Transcription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Save,
  Download,
  Share2,
  Settings,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import VideoPlayer from '../components/transcription/VideoPlayer';
import SubtitleEditor from '../components/transcription/SubtitleEditor';
import FontSelector from '../components/transcription/FontSelector';

export default function TranscriptionEditor() {
  const [transcription, setTranscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const navigate = useNavigate();

  // Get transcription ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const transcriptionId = urlParams.get('id');

  useEffect(() => {
    if (transcriptionId) {
      loadTranscription();
    } else {
      setError('לא נמצא מזהה תמלול');
      setLoading(false);
    }
  }, [transcriptionId]);

  const loadTranscription = async () => {
    try {
      const data = await Transcription.list();
      const found = data.find(t => t.id === transcriptionId);

      if (found) {
        setTranscription(found);
        // Initialize with sample data if empty
        if (!found.segments || found.segments.length === 0) {
          const sampleSegments = [
            {
              start: 0,
              end: 3,
              text: 'שלום וברוכים הבאים לתמלול המתקדם שלנו',
              style: {
                fontFamily: 'Rubik',
                fontSize: 32,
                color: '#FFFFFF',
                backgroundColor: '#000000AA',
                position: { x: 50, y: 85 }
              }
            },
            {
              start: 3.5,
              end: 7,
              text: 'כאן תוכלו לערוך ולהתאים את הכתוביות בצורה דינמית',
              style: {
                fontFamily: 'Rubik',
                fontSize: 32,
                color: '#FFFFFF',
                backgroundColor: '#000000AA',
                position: { x: 50, y: 85 }
              }
            },
            {
              start: 7.5,
              end: 11,
              text: 'הצגת הטקסט והעיצוב מתבצעים בזמן אמת',
              style: {
                fontFamily: 'Rubik',
                fontSize: 32,
                color: '#FFFFFF',
                backgroundColor: '#000000AA',
                position: { x: 50, y: 85 }
              }
            }
          ];
          setTranscription(prev => ({ ...prev, segments: sampleSegments }));
        }
      } else {
        setError('תמלול לא נמצא');
      }
    } catch (err) {
      setError('שגיאה בטעינת התמלול');
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentsChange = (newSegments) => {
    setTranscription(prev => ({ ...prev, segments: newSegments }));
    setHasUnsavedChanges(true);
  };

  const handleStyleChange = (newStyle) => {
    if (transcription?.segments && activeSegmentIndex >= 0) {
      const newSegments = [...transcription.segments];
      newSegments[activeSegmentIndex] = {
        ...newSegments[activeSegmentIndex],
        style: { ...newSegments[activeSegmentIndex].style, ...newStyle }
      };
      handleSegmentsChange(newSegments);
    }
  };

  const handleSave = async () => {
    if (!transcription) return;

    setSaving(true);
    try {
      await Transcription.update(transcription.id, {
        segments: transcription.segments,
        settings: transcription.settings
      });
      setHasUnsavedChanges(false);
    } catch (err) {
      setError('שגיאה בשמירת התמלול');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export transcription:', transcription);
  };

  const handleTimeSeek = (time) => {
    setCurrentTime(time);
  };

  const handleSegmentClick = (index) => {
    setActiveSegmentIndex(index);
    if (transcription?.segments?.[index]) {
      setCurrentTime(transcription.segments[index].start);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-600">טוען תמלול...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!transcription) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">תמלול לא נמצא</h2>
          <p className="text-gray-600 mb-4">לא הצלחנו למצוא את התמלול המבוקש</p>
          <Button onClick={() => navigate(createPageUrl('Dashboard'))}>
            חזרה לדשבורד
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="hover:bg-white/50"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              חזרה
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{transcription.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {transcription.language === 'he' ? 'עברית' : 'אנגלית'}
                </Badge>
                <Badge
                  variant={transcription.status === 'completed' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {transcription.status === 'completed' ? 'הושלם' : 'בעריכה'}
                </Badge>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-xs text-orange-600">
                    שינויים לא נשמרו
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowStylePanel(!showStylePanel)}
              className="hidden md:flex"
            >
              <Settings className="w-4 h-4 mr-2" />
              עיצוב
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="hidden md:flex"
            >
              <Download className="w-4 h-4 mr-2" />
              ייצא
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  שמור
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Video Player */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8"
          >
            <VideoPlayer
              videoUrl={transcription.video_url}
              segments={transcription.segments}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
              onSegmentClick={handleSegmentClick}
              showSubtitles={true}
              subtitleStyle={transcription.segments?.[activeSegmentIndex]?.style}
            />
          </motion.div>

          {/* Side Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-4"
          >
            {/* Font Selector */}
            {showStylePanel && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FontSelector
                  currentStyle={transcription.segments?.[activeSegmentIndex]?.style || {}}
                  onStyleChange={handleStyleChange}
                  previewText={transcription.segments?.[activeSegmentIndex]?.text || 'טקסט לדוגמה'}
                />
              </motion.div>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">פעולות מהירות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowStylePanel(!showStylePanel)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {showStylePanel ? 'סגור עיצוב' : 'עיצוב כתוביות'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleExport}
                >
                  <Download className="w-4 h-4 mr-2" />
                  ייצא תמלול
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  שתף
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Subtitle Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <SubtitleEditor
                segments={transcription.segments || []}
                onSegmentsChange={handleSegmentsChange}
                currentTime={currentTime}
                onTimeSeek={handleTimeSeek}
                activeSegmentIndex={activeSegmentIndex}
                onActiveSegmentChange={setActiveSegmentIndex}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}