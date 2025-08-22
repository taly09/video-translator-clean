import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Highlighter,
  Wand2,
  Target,
  Sparkles,
  Zap,
  Eye,
  Brain,
  Shuffle
} from 'lucide-react';

const HIGHLIGHT_COLORS = [
  '#FFFF00', '#FF69B4', '#00FF00', '#FF4500', '#00BFFF',
  '#FFD700', '#FF1493', '#32CD32', '#FF6347', '#1E90FF'
];

const SMART_HIGHLIGHT_MODES = {
  longest: 'המילה הארוכה ביותר',
  keywords: 'מילות מפתח',
  emotions: 'מילים רגשיות',
  actions: 'פעלים',
  random: 'אקראי'
};

export default function SmartHighlighter({
  selectedSubtitle,
  highlightedWords,
  onHighlightChange,
  onHighlightColorChange,
  isGlobalEditMode,
  allSubtitles
}) {
  const [smartMode, setSmartMode] = useState('longest');
  const [autoHighlight, setAutoHighlight] = useState(false);
  const [customWord, setCustomWord] = useState('');

  useEffect(() => {
    if (selectedSubtitle && autoHighlight) {
      applySmartHighlight();
    }
  }, [selectedSubtitle, smartMode, autoHighlight]);

  const getSmartHighlight = (text, mode) => {
    const words = text.split(/\s+/).filter(Boolean);

    switch (mode) {
      case 'longest':
        return words.reduce((longest, word) =>
          word.length > longest.length ? word : longest, ''
        );

      case 'keywords':
        const keywords = ['איך', 'מה', 'למה', 'כיצד', 'רגע', 'חשוב', 'מיוחד', 'חדש'];
        const foundKeyword = words.find(word =>
          keywords.some(keyword => word.includes(keyword))
        );
        return foundKeyword || words[0];

      case 'emotions':
        const emotions = ['אהבה', 'שמחה', 'עצב', 'כעס', 'פחד', 'הפתעה', 'נהדר', 'מדהים'];
        const foundEmotion = words.find(word =>
          emotions.some(emotion => word.includes(emotion))
        );
        return foundEmotion || words[Math.floor(words.length / 2)];

      case 'actions':
        const actions = ['לך', 'בוא', 'עשה', 'קח', 'תן', 'ראה', 'שמע', 'דבר'];
        const foundAction = words.find(word =>
          actions.some(action => word.includes(action))
        );
        return foundAction || words[0];

      case 'random':
        return words[Math.floor(Math.random() * words.length)];

      default:
        return words[0];
    }
  };

  const applySmartHighlight = () => {
    if (!selectedSubtitle) return;

    if (isGlobalEditMode) {
      const newHighlights = {};
      allSubtitles.forEach(subtitle => {
        const smartWord = getSmartHighlight(subtitle.text, smartMode);
        newHighlights[subtitle.id] = smartWord;
      });
      onHighlightChange(newHighlights);
    } else {
      const smartWord = getSmartHighlight(selectedSubtitle.text, smartMode);
      onHighlightChange({
        ...highlightedWords,
        [selectedSubtitle.id]: smartWord
      });
    }
  };

  const handleCustomWordSubmit = () => {
    if (!customWord.trim() || !selectedSubtitle) return;

    if (isGlobalEditMode) {
      const newHighlights = {};
      allSubtitles.forEach(subtitle => {
        newHighlights[subtitle.id] = customWord.trim();
      });
      onHighlightChange(newHighlights);
    } else {
      onHighlightChange({
        ...highlightedWords,
        [selectedSubtitle.id]: customWord.trim()
      });
    }
    setCustomWord('');
  };

  const clearHighlight = () => {
    if (!selectedSubtitle) return;

    if (isGlobalEditMode) {
      const newHighlights = {};
      allSubtitles.forEach(subtitle => {
        newHighlights[subtitle.id] = '';
      });
      onHighlightChange(newHighlights);
    } else {
      onHighlightChange({
        ...highlightedWords,
        [selectedSubtitle.id]: ''
      });
    }
  };

  if (!selectedSubtitle) return null;

  const currentHighlight = highlightedWords[selectedSubtitle.id] || '';
  const highlightColor = selectedSubtitle.style.highlightColor || '#FFFF00';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Highlighter className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-bold text-yellow-200">הדגשה חכמה</h3>
        {isGlobalEditMode && (
          <Badge variant="secondary" className="text-xs bg-yellow-600/30 text-yellow-200">
            החל על הכל
          </Badge>
        )}
      </div>

      {/* Auto Highlight Toggle */}
      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-yellow-400" />
          <Label htmlFor="auto-highlight" className="text-xs font-medium text-slate-200">
            הדגשה אוטומטית
          </Label>
        </div>
        <Switch
          id="auto-highlight"
          checked={autoHighlight}
          onCheckedChange={setAutoHighlight}
        />
      </div>

      {/* Smart Mode Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-yellow-200">מצב הדגשה חכם</Label>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(SMART_HIGHLIGHT_MODES).map(([mode, label]) => (
            <Button
              key={mode}
              onClick={() => setSmartMode(mode)}
              variant={smartMode === mode ? "default" : "outline"}
              className={`text-xs p-2 h-auto ${
                smartMode === mode
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-black'
                  : 'bg-slate-700 border-slate-600 hover:border-yellow-500/50 text-slate-300'
              }`}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Apply Smart Highlight */}
      <Button
        onClick={applySmartHighlight}
        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold text-xs"
      >
        <Wand2 className="w-3 h-3 mr-1" />
        החל הדגשה חכמה
      </Button>

      {/* Custom Word Input */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-yellow-200">מילה מותאמת</Label>
        <div className="flex gap-2">
          <Input
            value={customWord}
            onChange={(e) => setCustomWord(e.target.value)}
            placeholder="הקלד מילה להדגשה..."
            className="bg-slate-700 border-yellow-500/30 text-white text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCustomWordSubmit();
              }
            }}
          />
          <Button
            onClick={handleCustomWordSubmit}
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700 text-black"
          >
            <Target className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Current Highlight Display */}
      {currentHighlight && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-slate-700/50 rounded-lg border border-yellow-500/30"
        >
          <Label className="text-xs font-medium text-yellow-200 mb-2 block">
            מילה מודגשת כרגע:
          </Label>
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded font-bold text-black"
              style={{ backgroundColor: highlightColor }}
            >
              {currentHighlight}
            </span>
            <Button
              onClick={clearHighlight}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </motion.div>
      )}

      {/* Highlight Color Picker */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-yellow-200">צבע הדגשה</Label>
        <div className="grid grid-cols-5 gap-1">
          {HIGHLIGHT_COLORS.map(color => (
            <motion.button
              key={color}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onHighlightColorChange(selectedSubtitle.id, color)}
              className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                highlightColor === color
                  ? 'border-yellow-400 ring-2 ring-yellow-400/50'
                  : 'border-slate-500 hover:border-slate-400'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      {selectedSubtitle && (
        <div className="p-3 bg-black/50 rounded-lg border border-slate-600">
          <Label className="text-xs font-medium text-slate-400 mb-2 block flex items-center gap-1">
            <Eye className="w-3 h-3" />
            תצוגה מקדימה
          </Label>
          <div
            className="text-center"
            style={{
              fontSize: '14px',
              fontFamily: selectedSubtitle.style.fontFamily,
              color: selectedSubtitle.style.color,
              textShadow: selectedSubtitle.style.textShadow
            }}
          >
            {selectedSubtitle.text.split(/\s+/).map((word, index) => {
              const isHighlighted = word.replace(/[.,!?؛،.]/g, '') === currentHighlight;
              return (
                <span
                  key={index}
                  style={{
                    backgroundColor: isHighlighted ? highlightColor : 'transparent',
                    color: isHighlighted ? '#000000' : selectedSubtitle.style.color,
                    padding: isHighlighted ? '2px 4px' : '0',
                    borderRadius: isHighlighted ? '4px' : '0',
                    fontWeight: isHighlighted ? 'bold' : 'normal',
                    marginRight: '4px'
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}