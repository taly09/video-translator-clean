import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stage, Layer, Text, Rect, Group } from 'react-konva';
import { createPageUrl } from "@/utils/createPageUrl";
import { Transcription } from '@/entities/Transcription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Play,
  Pause,
  Save,
  Download,
  Share2,
  Settings,
  Palette,
  Type,
  Move,
  RotateCcw,
  Zap,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import KonvaCanvas from '../components/studio/KonvaCanvas';
import VideoPlayerAdvanced from '../components/studio/VideoPlayerAdvanced';
import TimelineEditor from '../components/studio/TimelineEditor';
import AdvancedFontSelector from '../components/studio/AdvancedFontSelector';
import EffectsPanel from '../components/studio/EffectsPanel';

export default function TranscriptionView() {
  const [transcription, setTranscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Get transcription ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const transcriptionId = urlParams.get('id');

  useEffect(() => {
    if (transcriptionId) {
      loadTranscription();
    }
  }, [transcriptionId]);

  const loadTranscription = async () => {
    try {
        setLoading(true);
        const data = await Transcription.get(transcriptionId);

        setTranscription(data);
        // Initialize with sample data if empty
        if (!data.segments || data.segments.length === 0) {
          const sampleSegments = [
            {
              id: 1,
              start: 0,
              end: 3,
              text: 'שלום וברוכים הבאים לסטודיו התמלול המתקדם',
              style: {
                fontFamily: 'Rubik',
                fontSize: 48,
                color: '#FFFFFF',
                backgroundColor: '#000000CC',
                stroke: '#000000',
                strokeWidth: 2,
                shadowColor: '#000000',
                shadowBlur: 10,
                shadowOffset: { x: 2, y: 2 },
                position: { x: 960, y: 900 },
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                opacity: 1,
                textAlign: 'center',
                width: 800,
                height: 100,
                padding: 20,
                cornerRadius: 10
              }
            },
            {
              id: 2,
              start: 3.5,
              end: 7,
              text: 'עכשיו תוכלו לערוך כתוביות בצורה ויזואלית מלאה',
              style: {
                fontFamily: 'Assistant',
                fontSize: 44,
                color: '#FFD700',
                backgroundColor: '#1A1A1ACC',
                stroke: '#000000',
                strokeWidth: 1,
                shadowColor: '#FFD700',
                shadowBlur: 15,
                shadowOffset: { x: 0, y: 0 },
                position: { x: 960, y: 850 },
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                opacity: 1,
                textAlign: 'center',
                width: 900,
                height: 120,
                padding: 25,
                cornerRadius: 15
              }
            },
            {
              id: 3,
              start: 7.5,
              end: 11,
              text: 'גררו, סובבו, שנו צבעים ותוכלו ליצור כתוביות מדהימות',
              style: {
                fontFamily: 'Heebo',
                fontSize: 40,
                color: '#FF6B6B',
                backgroundColor: '#FFFFFF22',
                stroke: '#FFFFFF',
                strokeWidth: 3,
                shadowColor: '#FF6B6B',
                shadowBlur: 20,
                shadowOffset: { x: 3, y: 3 },
                position: { x: 960, y: 800 },
                rotation: -2,
                scaleX: 1.1,
                scaleY: 1.1,
                opacity: 0.95,
                textAlign: 'center',
                width: 950,
                height: 140,
                padding: 30,
                cornerRadius: 20
              }
            }
          ];
          setTranscription(prev => ({ ...prev, segments: sampleSegments }));
        }
    } catch (error) {
      console.error('Error loading transcription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentUpdate = (segmentId, updates) => {
    setTranscription(prev => ({
      ...prev,
      segments: prev.segments.map(segment =>
        segment.id === segmentId
          ? { ...segment, ...updates }
          : segment
      )
    }));
  };

    const handleSegmentStyleUpdate = (segmentId, styleUpdates) => {
        setTranscription(prev => ({
            ...prev,
            segments: prev.segments.map(segment =>
                segment.id === segmentId
                ? { ...segment, style: { ...segment.style, ...styleUpdates } }
                : segment
            )
        }));
    };

  const handleSave = async () => {
    if (!transcription) return;

    setSaving(true);
    try {
      await Transcription.update(transcription.id, {
        segments: transcription.segments,
        settings: transcription.settings
      });
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const getCurrentSegment = () => {
    if (!transcription?.segments) return null;
    return transcription.segments.find(segment =>
      currentTime >= segment.start && currentTime <= segment.end
    );
  };

  const handleExport = () => {
    // TODO: Implement advanced export options
    console.log('Export with effects:', transcription);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">טוען סטודיו...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white" dir="rtl">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-full mx-auto flex items-center justify-between px-6">
            <Button variant="ghost" className="text-white" onClick={() => navigate(createPageUrl('Dashboard'))}>
                <ArrowRight className="w-4 h-4 ml-2" />
                חזרה לדשבורד
            </Button>
          <div className="flex items-center gap-4">
            <motion.div
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {transcription?.title || 'סטודיו תמלול'}
              </h1>
              <p className="text-gray-400 text-sm">עריכה ויזואלית מתקדמת</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEffects(!showEffects)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Zap className="w-4 h-4 mr-2" />
              אפקטים
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-2" />
              ייצא
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
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
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Tools */}
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className="w-80 bg-black/30 backdrop-blur-xl border-r border-white/10 p-4 overflow-y-auto"
        >
          <AdvancedFontSelector
            selectedSegment={selectedSegment}
            onStyleChange={(style) => {
              if (selectedSegment) {
                handleSegmentStyleUpdate(selectedSegment.id, style);
              }
            }}
          />

          {showEffects && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <EffectsPanel
                selectedSegment={selectedSegment}
                onEffectChange={(effect) => {
                  if (selectedSegment) {
                    handleSegmentStyleUpdate(selectedSegment.id, effect);
                  }
                }}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="h-2/3 relative bg-black">
            <VideoPlayerAdvanced
              videoUrl={transcription?.video_url}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
              segments={transcription?.segments || []}
            />

            {/* Canvas Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <KonvaCanvas
                width={canvasSize.width}
                height={canvasSize.height}
                segments={transcription?.segments || []}
                currentTime={currentTime}
                selectedSegment={selectedSegment}
                onSegmentSelect={setSelectedSegment}
                onSegmentUpdate={handleSegmentUpdate}
                zoom={zoom}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="h-1/3 bg-gray-900/50 backdrop-blur-xl border-t border-white/10">
            <TimelineEditor
              segments={transcription?.segments || []}
              currentTime={currentTime}
              duration={transcription?.duration || 60}
              onTimeChange={setCurrentTime}
              onSegmentUpdate={handleSegmentUpdate}
              selectedSegment={selectedSegment}
              onSegmentSelect={setSelectedSegment}
            />
          </div>
        </div>

        {/* Right Panel - Properties */}
        <motion.div
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          className="w-80 bg-black/30 backdrop-blur-xl border-l border-white/10 p-4 overflow-y-auto"
        >
          {selectedSegment ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  מאפיני הכתובית
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">טקסט</label>
                    <textarea
                      value={selectedSegment.text}
                      onChange={(e) => handleSegmentUpdate(selectedSegment.id, { text: e.target.value })}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white resize-none"
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">זמן התחלה</label>
                      <input
                        type="number"
                        value={selectedSegment.start}
                        onChange={(e) => handleSegmentUpdate(selectedSegment.id, { start: parseFloat(e.target.value) })}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">זמן סיום</label>
                      <input
                        type="number"
                        value={selectedSegment.end}
                        onChange={(e) => handleSegmentUpdate(selectedSegment.id, { end: parseFloat(e.target.value) })}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">שקיפות</label>
                    <Slider
                      value={[selectedSegment.style?.opacity || 1]}
                      onValueChange={(value) => handleSegmentStyleUpdate(selectedSegment.id, { opacity: value[0] })}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">סיבוב</label>
                    <Slider
                      value={[selectedSegment.style?.rotation || 0]}
                      onValueChange={(value) => handleSegmentStyleUpdate(selectedSegment.id, { rotation: value[0] })}
                      max={360}
                      min={-360}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Move className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">בחר כתובית</h3>
              <p className="text-gray-400">לחץ על כתובית כדי לערוך אותה</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}