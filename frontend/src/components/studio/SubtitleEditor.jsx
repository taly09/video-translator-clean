import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Type,
  Palette,
  Move,
  Eye,
  Settings,
  Wand2,
  Target,
  Grid,
  Crosshair,
  Ruler
} from 'lucide-react';

const FONTS = [
  'Rubik Bold',
  'Impact',
  'Bebas Neue',
  'Assistant',
  'Arial Black',
  'Oswald',
  'Heebo',
  'Alef',
  'Noto Sans Hebrew'
];

const COLORS = [
  '#FFFFFF', '#000000', '#FFFF00', '#FF0000', '#00BFFF',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'
];

const HIGHLIGHT_COLORS = [
  '#FFFF00', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'
];

export default function SubtitleEditor({
  selectedSubtitle,
  isGlobalEditMode,
  isRTL,
  highlightedWords,
  onTextChange,
  onStyleUpdate,
  onHighlightWordChange,
  onGlobalEditModeChange,
  onApplyTikTokStyle,
  onPrecisionMode
}) {
  const [activeTab, setActiveTab] = useState('text');
  const [precisionMode, setPrecisionMode] = useState(false);

  const handleStyleChange = useCallback((updates) => {
    if (!selectedSubtitle) return;
    onStyleUpdate(selectedSubtitle.id, updates);
  }, [selectedSubtitle, onStyleUpdate]);

  const handlePrecisionToggle = useCallback(() => {
    const newMode = !precisionMode;
    setPrecisionMode(newMode);
    onPrecisionMode(newMode);
  }, [precisionMode, onPrecisionMode]);

  const applyPresetStyle = useCallback((presetName) => {
    if (!selectedSubtitle) return;

    const presets = {
      tiktok: {
        fontFamily: 'Rubik Bold',
        fontSize: 58,
        color: '#FFFFFF',
        textShadow: '3px 3px 8px rgba(0,0,0,1)',
        backgroundColor: 'rgba(0,0,0,0)',
        fontWeight: '900',
        y: 85
      },
      instagram: {
        fontFamily: 'Impact',
        fontSize: 48,
        color: '#FFFFFF',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        backgroundColor: 'rgba(0,0,0,0.3)',
        fontWeight: '900',
        y: 80
      },
      youtube: {
        fontFamily: 'Arial Black',
        fontSize: 44,
        color: '#FFFFFF',
        textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
        backgroundColor: 'rgba(0,0,0,0.8)',
        fontWeight: '700',
        y: 90
      }
    };

    if (presets[presetName]) {
      handleStyleChange(presets[presetName]);
    }
  }, [selectedSubtitle, handleStyleChange]);

  if (!selectedSubtitle) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-300">בחר כתובית לעריכה</h3>
          <p className="text-sm text-gray-500">לחץ על כתובית בוידאו או ברשימת הקטעים</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-800">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            עריכת כתוביות
          </h2>
          <div className="flex items-center gap-2">
            <Switch
              id="precision-mode"
              checked={precisionMode}
              onCheckedChange={handlePrecisionToggle}
            />
            <Label htmlFor="precision-mode" className="text-sm text-gray-300">
              מצב דיוק
            </Label>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Switch
            id="global-edit"
            checked={isGlobalEditMode}
            onCheckedChange={onGlobalEditModeChange}
          />
          <Label htmlFor="global-edit" className="text-sm text-gray-300">
            ערוך את כל הכתוביות
          </Label>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPresetStyle('tiktok')}
            className="bg-pink-600 hover:bg-pink-700 text-white border-0"
          >
            <Wand2 className="w-4 h-4 mr-1" />
            TikTok
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPresetStyle('instagram')}
            className="bg-purple-600 hover:bg-purple-700 text-white border-0"
          >
            Instagram
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPresetStyle('youtube')}
            className="bg-red-600 hover:bg-red-700 text-white border-0"
          >
            YouTube
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
          <TabsTrigger value="text">
            <Type className="w-4 h-4 mr-1" />
            טקסט
          </TabsTrigger>
          <TabsTrigger value="style">
            <Palette className="w-4 h-4 mr-1" />
            עיצוב
          </TabsTrigger>
          <TabsTrigger value="position">
            <Move className="w-4 h-4 mr-1" />
            מיקום
          </TabsTrigger>
          <TabsTrigger value="highlight">
            <Eye className="w-4 h-4 mr-1" />
            הדגשה
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="text" className="p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">
                עריכת טקסט
              </Label>
              <Textarea
                value={selectedSubtitle.text}
                onChange={(e) => onTextChange(selectedSubtitle.id, e.target.value)}
                className="bg-slate-700 border-slate-600 text-white min-h-24"
                dir={isRTL ? 'rtl' : 'ltr'}
                placeholder="הכנס טקסט כתובית..."
              />
            </div>

            <Card className="bg-slate-700 border-slate-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-300">מידע על הקטע</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">זמן התחלה:</span>
                  <Badge variant="outline">{selectedSubtitle.start.toFixed(2)}s</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">זמן סיום:</span>
                  <Badge variant="outline">{selectedSubtitle.end.toFixed(2)}s</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">משך:</span>
                  <Badge variant="outline">{(selectedSubtitle.end - selectedSubtitle.start).toFixed(2)}s</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="style" className="p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">
                פונט
              </Label>
              <Select
                value={selectedSubtitle.style.fontFamily}
                onValueChange={(value) => handleStyleChange({ fontFamily: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map(font => (
                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">
                גודל פונט: {selectedSubtitle.style.fontSize}px
              </Label>
              <Slider
                value={[selectedSubtitle.style.fontSize]}
                onValueChange={([value]) => handleStyleChange({ fontSize: value })}
                min={20}
                max={120}
                step={2}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">
                צבע טקסט
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => handleStyleChange({ color })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      selectedSubtitle.style.color === color
                        ? 'border-blue-400 scale-110'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">
                צבע רקע
              </Label>
              <div className="grid grid-cols-5 gap-2">
                <button
                  onClick={() => handleStyleChange({ backgroundColor: 'rgba(0,0,0,0)' })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all bg-transparent ${
                    selectedSubtitle.style.backgroundColor === 'rgba(0,0,0,0)'
                      ? 'border-blue-400 scale-110'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  style={{
                    backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                    backgroundSize: '8px 8px'
                  }}
                />
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => handleStyleChange({ backgroundColor: color })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      selectedSubtitle.style.backgroundColor === color
                        ? 'border-blue-400 scale-110'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="position" className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2 block">
                  מיקום X: {selectedSubtitle.style.x.toFixed(1)}%
                </Label>
                <Slider
                  value={[selectedSubtitle.style.x]}
                  onValueChange={([value]) => handleStyleChange({ x: value })}
                  min={0}
                  max={100}
                  step={precisionMode ? 0.1 : 1}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2 block">
                  מיקום Y: {selectedSubtitle.style.y.toFixed(1)}%
                </Label>
                <Slider
                  value={[selectedSubtitle.style.y]}
                  onValueChange={([value]) => handleStyleChange({ y: value })}
                  min={0}
                  max={100}
                  step={precisionMode ? 0.1 : 1}
                  className="w-full"
                />
              </div>
            </div>

            <Card className="bg-slate-700 border-slate-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  מיקום מדויק
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={selectedSubtitle.style.x.toFixed(1)}
                    onChange={(e) => handleStyleChange({ x: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-600 text-white"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="X%"
                  />
                  <Input
                    type="number"
                    value={selectedSubtitle.style.y.toFixed(1)}
                    onChange={(e) => handleStyleChange({ y: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-600 text-white"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Y%"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStyleChange({ x: 50, y: 20 })}
                    className="text-xs"
                  >
                    למעלה
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStyleChange({ x: 50, y: 50 })}
                    className="text-xs"
                  >
                    באמצע
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStyleChange({ x: 50, y: 80 })}
                    className="text-xs"
                  >
                    למטה
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="highlight" className="p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">
                מילה להדגשה
              </Label>
              <Input
                value={highlightedWords[selectedSubtitle.id] || ''}
                onChange={(e) => onHighlightWordChange(selectedSubtitle.id, e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="הכנס מילה להדגשה..."
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">
                צבע הדגשה
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {HIGHLIGHT_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => handleStyleChange({ highlightColor: color })}
                    className={`w-full h-10 rounded-lg border-2 transition-all ${
                      selectedSubtitle.style.highlightColor === color
                        ? 'border-blue-400 scale-105'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <Card className="bg-slate-700 border-slate-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-300">הדגשה אוטומטית</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const words = selectedSubtitle.text.split(/\s+/).filter(Boolean);
                    const longestWord = words.sort((a, b) => b.length - a.length)[0] || '';
                    onHighlightWordChange(selectedSubtitle.id, longestWord);
                  }}
                  className="w-full"
                >
                  הדגש מילה הכי ארוכה
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const words = selectedSubtitle.text.split(/\s+/).filter(Boolean);
                    const firstWord = words[0] || '';
                    onHighlightWordChange(selectedSubtitle.id, firstWord);
                  }}
                  className="w-full"
                >
                  הדגש מילה ראשונה
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}