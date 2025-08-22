import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Type, Palette, Eye, Zap, RotateCcw,
  AlignCenter, AlignLeft, AlignRight
} from 'lucide-react';

const FONT_FAMILIES = [
  { name: 'Assistant', label: 'Assistant (עברית)', preview: 'כתובית מעוצבת' },
  { name: 'Rubik', label: 'Rubik (עברית)', preview: 'כתובית מעוצבת' },
  { name: 'Impact', label: 'Impact (דרמטי)', preview: 'DRAMATIC TEXT' },
  { name: 'Bebas Neue', label: 'Bebas (מודרני)', preview: 'MODERN STYLE' },
  { name: 'Montserrat', label: 'Montserrat (נקי)', preview: 'Clean Design' },
  { name: 'Oswald', label: 'Oswald (חזק)', preview: 'BOLD IMPACT' }
];

const PRESET_STYLES = [
  {
    name: 'TikTok קלאסי',
    style: {
      fontFamily: 'Impact',
      fontSize: 64,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderRadius: 12,
      padding: 16,
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
      border: '2px solid #FFFFFF'
    }
  },
  {
    name: 'פודקאסט מודרני',
    style: {
      fontFamily: 'Montserrat',
      fontSize: 48,
      color: '#FFD700',
      backgroundColor: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.2))',
      borderRadius: 20,
      padding: 20,
      textShadow: '0 0 10px rgba(255,215,0,0.5)',
      border: '1px solid rgba(255,215,0,0.3)'
    }
  },
  {
    name: 'נאון זוהר',
    style: {
      fontFamily: 'Bebas Neue',
      fontSize: 56,
      color: '#00FFFF',
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: 8,
      padding: 12,
      textShadow: '0 0 20px #00FFFF, 0 0 40px #00FFFF',
      border: '2px solid #00FFFF'
    }
  },
  {
    name: 'מינימליסטי',
    style: {
      fontFamily: 'Assistant',
      fontSize: 44,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 16,
      padding: 18,
      textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
    }
  }
];

const COLOR_PRESETS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFD700', '#FF69B4', '#00FF7F', '#DC143C', '#4B0082'
];

export default function AdvancedFontSelector({ selectedSegment, onStyleChange }) {
  const [activeSection, setActiveSection] = useState('presets');

  if (!selectedSegment) return null;

  const currentStyle = selectedSegment.style || {};

  const handleStyleUpdate = (updates) => {
    onStyleChange(updates);
  };

  const applyPreset = (presetStyle) => {
    handleStyleUpdate(presetStyle);
  };

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-white/10 rounded-lg p-1">
        {[
          { id: 'presets', icon: Zap, label: 'סגנונות' },
          { id: 'font', icon: Type, label: 'פונט' },
          { id: 'colors', icon: Palette, label: 'צבעים' },
          { id: 'effects', icon: Eye, label: 'אפקטים' }
        ].map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            onClick={() => setActiveSection(id)}
            variant={activeSection === id ? 'default' : 'ghost'}
            size="sm"
            className="flex flex-col h-auto py-2 text-xs"
          >
            <Icon className="w-4 h-4 mb-1" />
            {label}
          </Button>
        ))}
      </div>

      {/* Presets Section */}
      {activeSection === 'presets' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">סגנונות מוכנים</h3>
          <div className="grid grid-cols-1 gap-3">
            {PRESET_STYLES.map((preset, index) => (
              <div
                key={index}
                className="p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => applyPreset(preset.style)}
              >
                <div className="text-sm font-medium mb-1">{preset.name}</div>
                <div
                  className="text-xs p-2 rounded text-center"
                  style={{
                    fontFamily: preset.style.fontFamily,
                    color: preset.style.color,
                    backgroundColor: preset.style.backgroundColor?.includes('gradient')
                      ? undefined
                      : preset.style.backgroundColor,
                    background: preset.style.backgroundColor?.includes('gradient')
                      ? preset.style.backgroundColor
                      : undefined,
                    textShadow: preset.style.textShadow,
                    border: preset.style.border,
                    borderRadius: '4px'
                  }}
                >
                  דוגמה
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Font Section */}
      {activeSection === 'font' && (
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-gray-300">פונט</Label>
            <div className="grid gap-2 mt-2">
              {FONT_FAMILIES.map((font) => (
                <div
                  key={font.name}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentStyle.fontFamily === font.name
                      ? 'border-purple-400 bg-purple-400/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => handleStyleUpdate({ fontFamily: font.name })}
                >
                  <div className="text-sm font-medium">{font.label}</div>
                  <div
                    className="text-xs text-gray-400 mt-1"
                    style={{ fontFamily: font.name }}
                  >
                    {font.preview}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm text-gray-300">גודל פונט: {currentStyle.fontSize || 48}</Label>
            <Slider
              value={[currentStyle.fontSize || 48]}
              onValueChange={([value]) => handleStyleUpdate({ fontSize: value })}
              min={20}
              max={120}
              step={2}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm text-gray-300">יישור טקסט</Label>
            <div className="flex gap-1 mt-2">
              {[
                { value: 'right', icon: AlignRight },
                { value: 'center', icon: AlignCenter },
                { value: 'left', icon: AlignLeft }
              ].map(({ value, icon: Icon }) => (
                <Button
                  key={value}
                  variant={currentStyle.textAlign === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStyleUpdate({ textAlign: value })}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Colors Section */}
      {activeSection === 'colors' && (
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-gray-300">צבע טקסט</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {COLOR_PRESETS.map((color) => (
                <div
                  key={color}
                  className="w-8 h-8 rounded border-2 border-white/30 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleStyleUpdate({ color })}
                />
              ))}
            </div>
            <Input
              type="color"
              value={currentStyle.color || '#FFFFFF'}
              onChange={(e) => handleStyleUpdate({ color: e.target.value })}
              className="mt-2 h-8"
            />
          </div>

          <div>
            <Label className="text-sm text-gray-300">צבע רקע</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[
                'rgba(0,0,0,0.8)',
                'rgba(255,255,255,0.8)',
                'rgba(255,0,0,0.8)',
                'rgba(0,0,255,0.8)'
              ].map((bg, index) => (
                <div
                  key={index}
                  className="h-8 rounded border-2 border-white/30 cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: bg }}
                  onClick={() => handleStyleUpdate({ backgroundColor: bg })}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm text-gray-300">שקיפות רקע: {Math.round(((currentStyle.backgroundColor?.match(/[\d\.]+\)$/)?.[0]?.slice(0,-1)) || 0.8) * 100)}%</Label>
            <Slider
              value={[((currentStyle.backgroundColor?.match(/[\d\.]+\)$/)?.[0]?.slice(0,-1)) || 0.8) * 100]}
              onValueChange={([value]) => {
                const currentBg = currentStyle.backgroundColor || 'rgba(0,0,0,0.8)';
                const newBg = currentBg.replace(/[\d\.]+\)$/, `${value/100})`);
                handleStyleUpdate({ backgroundColor: newBg });
              }}
              min={0}
              max={100}
              step={5}
              className="mt-2"
            />
          </div>
        </div>
      )}

      {/* Effects Section */}
      {activeSection === 'effects' && (
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-gray-300">צל טקסט</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { label: 'ללא', value: 'none' },
                { label: 'רגיל', value: '2px 2px 4px rgba(0,0,0,0.8)' },
                { label: 'חזק', value: '3px 3px 6px rgba(0,0,0,0.9)' },
                { label: 'זוהר', value: '0 0 10px currentColor' }
              ].map(({ label, value }) => (
                <Button
                  key={label}
                  variant={currentStyle.textShadow === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStyleUpdate({ textShadow: value })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm text-gray-300">עגלת פינות: {currentStyle.borderRadius || 8}</Label>
            <Slider
              value={[currentStyle.borderRadius || 8]}
              onValueChange={([value]) => handleStyleUpdate({ borderRadius: value })}
              min={0}
              max={50}
              step={2}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm text-gray-300">ריווח פנימי: {currentStyle.padding || 12}</Label>
            <Slider
              value={[currentStyle.padding || 12]}
              onValueChange={([value]) => handleStyleUpdate({ padding: value })}
              min={0}
              max={50}
              step={2}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm text-gray-300">מסגרת</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { label: 'ללא', value: 'none' },
                { label: 'לבן', value: '2px solid #FFFFFF' },
                { label: 'שחור', value: '2px solid #000000' },
                { label: 'זוהר', value: '2px solid #00FFFF' }
              ].map(({ label, value }) => (
                <Button
                  key={label}
                  variant={currentStyle.border === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStyleUpdate({ border: value })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleStyleUpdate({
              fontFamily: 'Assistant',
              fontSize: 48,
              color: '#FFFFFF',
              backgroundColor: 'rgba(0,0,0,0.7)',
              borderRadius: 8,
              padding: 12,
              textAlign: 'center',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              border: 'none'
            })}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            איפוס לברירת מחדל
          </Button>
        </div>
      )}

      {/* Live Preview */}
      <div className="p-4 bg-black/50 rounded-lg border border-white/10">
        <Label className="text-sm text-gray-300 mb-2 block">תצוגה מקדימה</Label>
        <div className="text-center">
          <span
            style={{
              fontFamily: currentStyle.fontFamily || 'Assistant',
              fontSize: Math.min((currentStyle.fontSize || 48) * 0.6, 24),
              color: currentStyle.color || '#FFFFFF',
              backgroundColor: currentStyle.backgroundColor || 'rgba(0,0,0,0.7)',
              borderRadius: currentStyle.borderRadius || 8,
              padding: (currentStyle.padding || 12) * 0.5,
              textAlign: currentStyle.textAlign || 'center',
              textShadow: currentStyle.textShadow || 'none',
              border: currentStyle.border || 'none',
              display: 'inline-block'
            }}
          >
            {selectedSegment.text || 'דוגמת טקסט'}
          </span>
        </div>
      </div>
    </div>
  );
}