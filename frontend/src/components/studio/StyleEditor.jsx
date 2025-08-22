import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Type, Palette, AlignCenter, AlignLeft, AlignRight
} from 'lucide-react';

const FONTS = [
  'Assistant', 'Rubik', 'Impact', 'Arial', 'Montserrat', 'Oswald'
];

const PRESET_STYLES = [
  {
    name: 'TikTok קלאסי',
    style: {
      fontSize: 52,
      fontFamily: 'Impact',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.8)',
      border: '3px solid #FFFFFF',
      borderRadius: 8,
      padding: 16,
      fontWeight: 'bold'
    }
  },
  {
    name: 'פודקאסט זהב',
    style: {
      fontSize: 48,
      fontFamily: 'Montserrat',
      color: '#FFD700',
      backgroundColor: 'rgba(0,0,0,0.7)',
      border: '2px solid #FFD700',
      borderRadius: 12,
      padding: 18,
      fontWeight: 'bold'
    }
  },
  {
    name: 'מינימליסטי',
    style: {
      fontSize: 44,
      fontFamily: 'Assistant',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.6)',
      border: 'none',
      borderRadius: 16,
      padding: 14,
      fontWeight: 'normal'
    }
  }
];

export default function StyleEditor({ selectedSubtitle, onStyleUpdate, onTextUpdate }) {
  if (!selectedSubtitle) {
    return (
      <div className="p-6 text-center text-gray-400">
        <Type className="w-12 h-12 mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">בחר כתובית לעריכה</p>
        <p className="text-sm">לחץ על כתובית בווידאו כדי להתחיל לערוך</p>
      </div>
    );
  }

  const style = selectedSubtitle.style || {};

  const updateStyle = (updates) => {
    onStyleUpdate(selectedSubtitle.id, updates);
  };

  const updateText = (newText) => {
    onTextUpdate(selectedSubtitle.id, { text: newText });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="border-b border-gray-700 pb-4">
        <h3 className="text-lg font-semibold text-white mb-2">עריכת כתובית</h3>
        <p className="text-sm text-gray-400">בחרת כתובית: {selectedSubtitle.start.toFixed(1)}s - {selectedSubtitle.end.toFixed(1)}s</p>
      </div>

      {/* עריכת טקסט */}
      <div>
        <Label className="text-white mb-2 block">טקסט הכתובית</Label>
        <Textarea
          value={selectedSubtitle.text}
          onChange={(e) => updateText(e.target.value)}
          className="bg-gray-800 border-gray-600 text-white"
          rows={3}
        />
      </div>

      {/* סגנונות מהירים */}
      <div>
        <Label className="text-white mb-3 block">סגנונות מהירים</Label>
        <div className="grid gap-2">
          {PRESET_STYLES.map((preset, index) => (
            <Button
              key={index}
              onClick={() => updateStyle(preset.style)}
              variant="outline"
              className="justify-start text-right h-auto p-3 bg-gray-800 border-gray-600 hover:bg-gray-700"
            >
              <div>
                <div className="font-medium text-white">{preset.name}</div>
                <div
                  className="text-xs mt-1 px-2 py-1 rounded"
                  style={{
                    fontFamily: preset.style.fontFamily,
                    color: preset.style.color,
                    backgroundColor: preset.style.backgroundColor,
                    fontSize: '10px'
                  }}
                >
                  דוגמה
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* פונט */}
      <div>
        <Label className="text-white mb-2 block">פונט</Label>
        <select
          value={style.fontFamily || 'Assistant'}
          onChange={(e) => updateStyle({ fontFamily: e.target.value })}
          className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
        >
          {FONTS.map(font => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      {/* גודל */}
      <div>
        <Label className="text-white mb-2 block">גודל: {style.fontSize || 48}</Label>
        <Slider
          value={[style.fontSize || 48]}
          onValueChange={([value]) => updateStyle({ fontSize: value })}
          min={20}
          max={100}
          step={2}
        />
      </div>

      {/* צבע */}
      <div>
        <Label className="text-white mb-2 block">צבע טקסט</Label>
        <Input
          type="color"
          value={style.color || '#FFFFFF'}
          onChange={(e) => updateStyle({ color: e.target.value })}
          className="w-full h-10"
        />
      </div>

      {/* צבע רקע */}
      <div>
        <Label className="text-white mb-2 block">צבע רקע</Label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {[
            'rgba(0,0,0,0.8)',
            'rgba(255,255,255,0.8)',
            'rgba(255,0,0,0.8)',
            'rgba(0,0,255,0.8)'
          ].map((bg, i) => (
            <button
              key={i}
              onClick={() => updateStyle({ backgroundColor: bg })}
              className="h-8 rounded border-2 border-gray-600 hover:border-white"
              style={{ backgroundColor: bg }}
            />
          ))}
        </div>
      </div>

      {/* יישור */}
      <div>
        <Label className="text-white mb-2 block">יישור</Label>
        <div className="flex gap-1">
          {[
            { value: 'right', icon: AlignRight },
            { value: 'center', icon: AlignCenter },
            { value: 'left', icon: AlignLeft }
          ].map(({ value, icon: Icon }) => (
            <Button
              key={value}
              onClick={() => updateStyle({ textAlign: value })}
              variant={style.textAlign === value ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}