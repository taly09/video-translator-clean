import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Palette,
  Share2,
  MousePointer,
  Wand2,
  Download,
  Loader2,
  Play,
  Eye
} from 'lucide-react';

const TIKTOK_FONTS = ['Rubik Bold', 'Impact', 'Bebas Neue', 'Assistant', 'Arial Black', 'Oswald', 'Heebo'];
const POPULAR_COLORS = ['#FFFFFF', '#000000', '#FFFF00', '#FF0000', '#00BFFF', '#FF6B35', '#7B68EE'];

const WORD_MODES = [
  { value: 'none', label: 'רגיל', description: 'טקסט רגיל ללא אפקטים' },
  { value: 'highlight', label: 'הדגשת מילה', description: 'הדגשה של מילה נבחרת' },
  { value: 'progressive', label: 'הופעה מילה-מילה', description: 'מילים מופיעות אחת אחרי השנייה' },
  { value: 'karaoke', label: 'קריוקי', description: 'כמו במכונות קריוקי' },
  { value: 'word-by-word', label: 'מילה בודדת', description: 'רק המילה הנוכחית מוצגת' },
  { value: 'typewriter', label: 'מכונת כתיבה', description: 'אפקט הדפסה' },
  { value: 'bounce', label: 'קפיצה', description: 'מילים קופצות' },
  { value: 'glow', label: 'זוהר', description: 'אפקט זוהר למילים' }
];

export const MobileSubtitleEditor = ({
  subtitles,
  selectedSubtitleId,
  currentTime,
  activeMobileTab,
  setActiveMobileTab,
  isRTL,
  isGlobalEditMode,
  setIsGlobalEditMode,
  highlightedWords,
  setHighlightedWords,
  onSegmentClick,
  onTextChange,
  onStyleUpdate,
  onApplyTikTokStyle,
  onExportSRT,
  onExportTXT,
  onBurnSubtitles,
  burning = false,
  formatTime
}) => {
  const selectedSubtitle = subtitles.find(sub => sub.id === selectedSubtitleId);
  const currentSubtitle = subtitles.find(sub => currentTime >= sub.start && currentTime < sub.end);

  const SegmentsList = () => (
    <div className="h-full overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">קטעי התמלול</h3>
        <Badge variant="secondary" className="bg-purple-600 text-white">
          {subtitles.length} קטעים
        </Badge>
      </div>

      {subtitles.map((segment, index) => {
        const isSelected = selectedSubtitleId === segment.id;
        const isCurrent = currentTime >= segment.start && currentTime < segment.end;

        return (
          <motion.div
            key={segment.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSegmentClick(segment)}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
              isSelected
                ? 'bg-purple-600/80 ring-2 ring-purple-300 shadow-lg'
                : isCurrent
                ? 'bg-blue-600/60 shadow-md'
                : 'bg-slate-700/80 hover:bg-slate-600/80'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Badge
                variant="outline"
                className={`text-xs ${isCurrent ? 'bg-green-500 text-white border-green-500' : ''}`}
              >
                {formatTime(segment.start)}
              </Badge>
              {isCurrent && (
                <div className="flex items-center gap-1">
                  <Play className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400 font-semibold">פועל</span>
                </div>
              )}
            </div>
            <p
              className="text-base leading-relaxed text-white/90"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {segment.text}
            </p>
            {segment.style?.wordMode && segment.style.wordMode !== 'none' && (
              <Badge className="mt-2 bg-pink-500/20 text-pink-300 text-xs">
                {WORD_MODES.find(m => m.value === segment.style.wordMode)?.label}
              </Badge>
            )}
          </motion.div>
        );
      })}
    </div>
  );

  const StyleEditor = () => {
    if (!selectedSubtitle) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <MousePointer className="w-16 h-16 mb-4 text-purple-400 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">בחר קטע לעריכה</h3>
          <p className="text-gray-400">גע על קטע מהרשימה כדי להתחיל לעצב אותו</p>
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="bg-slate-700/50 rounded-xl p-4">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            עיצוב כתובית
          </h3>

          {/* Global Edit Toggle */}
          <div className="flex items-center justify-between bg-slate-600/50 rounded-lg p-3 mb-4">
            <Label htmlFor="global-edit" className="text-white font-medium">
              החל על כל הכתוביות
            </Label>
            <Switch
              id="global-edit"
              checked={isGlobalEditMode}
              onCheckedChange={setIsGlobalEditMode}
            />
          </div>
        </div>

        {/* Text Editor */}
        <div className="bg-slate-700/50 rounded-xl p-4">
          <Label className="text-white font-medium mb-3 block">ערוך טקסט</Label>
          <Textarea
            value={selectedSubtitle.text}
            onChange={(e) => onTextChange(selectedSubtitleId, e.target.value)}
            className="bg-slate-600 border-slate-500 text-white text-base min-h-[100px] resize-none"
            dir={isRTL ? 'rtl' : 'ltr'}
            placeholder="הקלד את הטקסט כאן..."
          />
        </div>

        {/* Word Mode */}
        <div className="bg-slate-700/50 rounded-xl p-4">
          <Label className="text-white font-medium mb-3 block">סגנון הופעה</Label>
          <Select
            value={selectedSubtitle.style?.wordMode || 'none'}
            onValueChange={(value) => onStyleUpdate(selectedSubtitleId, { wordMode: value })}
          >
            <SelectTrigger className="bg-slate-600 border-slate-500 text-white h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {WORD_MODES.map(mode => (
                <SelectItem key={mode.value} value={mode.value} className="text-white hover:bg-slate-600">
                  <div>
                    <div className="font-medium">{mode.label}</div>
                    <div className="text-xs text-gray-400">{mode.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Highlight Word (only for highlight mode) */}
        {selectedSubtitle.style?.wordMode === 'highlight' && (
          <div className="bg-slate-700/50 rounded-xl p-4">
            <Label className="text-white font-medium mb-3 block">מילה להדגשה</Label>
            <Input
              value={highlightedWords[selectedSubtitleId] || ''}
              onChange={(e) => setHighlightedWords(prev => ({
                ...prev,
                [selectedSubtitleId]: e.target.value
              }))}
              className="bg-slate-600 border-slate-500 text-white"
              placeholder="הקלד מילה להדגשה..."
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
        )}

        {/* Font */}
        <div className="bg-slate-700/50 rounded-xl p-4">
          <Label className="text-white font-medium mb-3 block">גופן</Label>
          <Select
            value={selectedSubtitle.style?.fontFamily || 'Rubik Bold'}
            onValueChange={(value) => onStyleUpdate(selectedSubtitleId, { fontFamily: value })}
          >
            <SelectTrigger className="bg-slate-600 border-slate-500 text-white h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {TIKTOK_FONTS.map(font => (
                <SelectItem
                  key={font}
                  value={font}
                  className="text-white hover:bg-slate-600"
                  style={{ fontFamily: font }}
                >
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="bg-slate-700/50 rounded-xl p-4">
          <Label className="text-white font-medium mb-3 block">
            גודל: {selectedSubtitle.style?.fontSize || 48}px
          </Label>
          <Slider
            value={[selectedSubtitle.style?.fontSize || 48]}
            onValueChange={([value]) => onStyleUpdate(selectedSubtitleId, { fontSize: value })}
            min={20}
            max={120}
            step={2}
            className="w-full"
          />
        </div>

        {/* Color Picker */}
        <div className="bg-slate-700/50 rounded-xl p-4">
          <Label className="text-white font-medium mb-3 block">צבע טקסט</Label>
          <div className="grid grid-cols-4 gap-3">
            {POPULAR_COLORS.map(color => (
              <button
                key={color}
                onClick={() => onStyleUpdate(selectedSubtitleId, { color })}
                className={`w-12 h-12 rounded-full border-4 transition-all duration-200 ${
                  selectedSubtitle.style?.color === color
                    ? 'border-blue-400 scale-110 shadow-lg'
                    : 'border-slate-400 hover:border-slate-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ActionsPanel = () => (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-800 to-slate-900">
      <h3 className="text-xl font-bold text-white text-center mb-6">פעולות ושמירה</h3>

      {/* TikTok Style */}
      <Button
        onClick={onApplyTikTokStyle}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-4 text-lg font-bold shadow-xl rounded-xl transition-all duration-300"
      >
        <Wand2 className="w-6 h-6 ml-2" />
        החל סגנון טיקטוק
      </Button>

      {/* Preview Current */}
      {currentSubtitle && (
        <div className="bg-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">מוצג כעת</span>
          </div>
          <p className="text-white text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
            {currentSubtitle.text}
          </p>
          <Badge className="mt-2 bg-blue-500/20 text-blue-300 text-xs">
            {formatTime(currentSubtitle.start)} - {formatTime(currentSubtitle.end)}
          </Badge>
        </div>
      )}

      {/* Export Options */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-white">ייצוא קבצים</h4>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onExportSRT}
            variant="outline"
            className="py-4 text-base border-slate-500 text-white hover:bg-slate-700"
          >
            <FileText className="w-5 h-5 ml-2" />
            SRT
          </Button>
          <Button
            onClick={onExportTXT}
            variant="outline"
            className="py-4 text-base border-slate-500 text-white hover:bg-slate-700"
          >
            <FileText className="w-5 h-5 ml-2" />
            טקסט
          </Button>
        </div>
      </div>

      {/* Burn Video */}
      <Button
        onClick={onBurnSubtitles}
        disabled={burning}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 py-6 text-lg font-bold shadow-xl rounded-xl transition-all duration-300"
      >
        {burning ? (
          <>
            <Loader2 className="w-6 h-6 ml-2 animate-spin" />
            צורב וידאו...
          </>
        ) : (
          <>
            <Download className="w-6 h-6 ml-2" />
            צרוב והורד וידאו
          </>
        )}
      </Button>

      {burning && (
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
          <p className="text-purple-200 text-sm text-center">
            מעבד את הוידאו עם הכתוביות... זה יכול לקחת כמה דקות
          </p>
        </div>
      )}
    </div>
  );

  const TabButton = ({ icon: Icon, label, tabKey, isActive, onClick }) => (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`flex flex-col h-auto p-3 transition-all duration-200 ${
        isActive
          ? 'text-blue-400 bg-blue-400/10'
          : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
      }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-xs font-semibold">{label}</span>
    </Button>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMobileTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {activeMobileTab === 'script' && <SegmentsList />}
            {activeMobileTab === 'style' && <StyleEditor />}
            {activeMobileTab === 'actions' && <ActionsPanel />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-around items-center p-2 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 shrink-0">
        <TabButton
          icon={FileText}
          label="קטעים"
          tabKey="script"
          isActive={activeMobileTab === 'script'}
          onClick={() => setActiveMobileTab('script')}
        />
        <TabButton
          icon={Palette}
          label="עיצוב"
          tabKey="style"
          isActive={activeMobileTab === 'style'}
          onClick={() => setActiveMobileTab('style')}
        />
        <TabButton
          icon={Share2}
          label="פעולות"
          tabKey="actions"
          isActive={activeMobileTab === 'actions'}
          onClick={() => setActiveMobileTab('actions')}
        />
      </div>
    </div>
  );
};