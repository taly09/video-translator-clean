import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import {
  Type,
  Palette,
  Circle,
  Square,
  Zap,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react';

const FONT_FAMILIES = [
  'Rubik Bold',
  'Assistant',
  'Heebo',
  'Impact',
  'Bebas Neue',
  'Arial Black',
  'Oswald',
  'Times New Roman',
  'Courier New',
  'Georgia'
];

const COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#00CED1'
];

const TEXT_TRANSFORMS = [
  { value: 'none', label: 'רגיל' },
  { value: 'uppercase', label: 'אותיות גדולות' },
  { value: 'lowercase', label: 'אותיות קטנות' },
  { value: 'capitalize', label: 'אות ראשונה גדולה' }
];

export default function AdvancedTextStyler({
  selectedSubtitle,
  onStyleUpdate,
  isGlobalEditMode
}) {
  if (!selectedSubtitle) return null;

  const style = selectedSubtitle.style;

  const handleStyleChange = (property, value) => {
    onStyleUpdate(selectedSubtitle.id, { [property]: value });
  };

  const ColorPicker = ({ currentColor, onChange, label }) => (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-purple-200">{label}</Label>
      <div className="grid grid-cols-5 gap-1">
        {COLORS.map(color => (
          <motion.button
            key={color}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(color)}
            className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
              currentColor?.toLowerCase() === color.toLowerCase()
                ? 'border-purple-400 ring-2 ring-purple-400/50'
                : 'border-slate-500 hover:border-slate-400'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Type className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-bold text-purple-200">עיצוב מתקדם</h3>
        {isGlobalEditMode && (
          <span className="text-xs bg-purple-600/30 text-purple-200 px-2 py-1 rounded">
            החל על הכל
          </span>
        )}
      </div>

      {/* Font Family */}
      <div>
        <Label className="text-xs font-medium text-purple-200 mb-2 block">גופן</Label>
        <Select value={style.fontFamily} onValueChange={(v) => handleStyleChange('fontFamily', v)}>
          <SelectTrigger className="bg-slate-700 border-purple-500/30 text-white text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map(font => (
              <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div>
        <Label className="text-xs font-medium text-purple-200 mb-2 block">
          גודל גופן: {style.fontSize}px
        </Label>
        <Slider
          value={[style.fontSize]}
          onValueChange={([v]) => handleStyleChange('fontSize', v)}
          min={16}
          max={120}
          step={2}
          className="w-full"
        />
      </div>

      {/* Font Weight */}
      <div>
        <Label className="text-xs font-medium text-purple-200 mb-2 block">
          עובי גופן: {style.fontWeight}
        </Label>
        <Slider
          value={[parseInt(style.fontWeight)]}
          onValueChange={([v]) => handleStyleChange('fontWeight', v.toString())}
          min={100}
          max={900}
          step={100}
          className="w-full"
        />
      </div>

      <Separator className="bg-slate-600" />

      {/* Colors */}
      <ColorPicker
        currentColor={style.color}
        onChange={(color) => handleStyleChange('color', color)}
        label="צבע טקסט"
      />

      <ColorPicker
        currentColor={style.backgroundColor?.replace('rgba(', '').replace(')', '').split(',')[0] +
                     style.backgroundColor?.replace('rgba(', '').replace(')', '').split(',')[1] +
                     style.backgroundColor?.replace('rgba(', '').replace(')', '').split(',')[2] || '#000000'}
        onChange={(color) => handleStyleChange('backgroundColor', `${color}CC`)}
        label="צבע רקע"
      />

      <Separator className="bg-slate-600" />

      {/* Letter Spacing */}
      <div>
        <Label className="text-xs font-medium text-purple-200 mb-2 block">
          ריווח בין אותיות: {style.letterSpacing || 0}px
        </Label>
        <Slider
          value={[style.letterSpacing || 0]}
          onValueChange={([v]) => handleStyleChange('letterSpacing', v)}
          min={-2}
          max={10}
          step={0.5}
          className="w-full"
        />
      </div>

      {/* Line Height */}
      <div>
        <Label className="text-xs font-medium text-purple-200 mb-2 block">
          גובה שורה: {style.lineHeight || 1.2}
        </Label>
        <Slider
          value={[style.lineHeight || 1.2]}
          onValueChange={([v]) => handleStyleChange('lineHeight', v)}
          min={0.8}
          max={2.5}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Text Transform */}
      <div>
        <Label className="text-xs font-medium text-purple-200 mb-2 block">טרנספורמציה</Label>
        <Select value={style.textTransform || 'none'} onValueChange={(v) => handleStyleChange('textTransform', v)}>
          <SelectTrigger className="bg-slate-700 border-purple-500/30 text-white text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEXT_TRANSFORMS.map(transform => (
              <SelectItem key={transform.value} value={transform.value}>
                {transform.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="bg-slate-600" />

      {/* Border Radius */}
      <div>
        <Label className="text-xs font-medium text-purple-200 mb-2 block">
          עיגול פינות: {style.borderRadius || 0}px
        </Label>
        <Slider
          value={[style.borderRadius || 0]}
          onValueChange={([v]) => handleStyleChange('borderRadius', v)}
          min={0}
          max={50}
          step={2}
          className="w-full"
        />
      </div>

      {/* Stroke */}
      <div className="space-y-3">
        <Label className="text-xs font-medium text-purple-200">קו מתאר</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-slate-300">עובי: {style.strokeWidth || 0}px</Label>
            <Slider
              value={[style.strokeWidth || 0]}
              onValueChange={([v]) => handleStyleChange('strokeWidth', v)}
              min={0}
              max={8}
              step={1}
              className="w-full"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-300">צבע</Label>
            <div className="flex gap-1 mt-1">
              {['#000000', '#FFFFFF', '#FF0000', '#0000FF'].map(color => (
                <button
                  key={color}
                  onClick={() => handleStyleChange('strokeColor', color)}
                  className={`w-6 h-6 rounded border-2 ${
                    style.strokeColor === color ? 'border-purple-400' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <Button
        onClick={() => {
          const resetStyle = {
            fontFamily: 'Rubik Bold',
            fontSize: 48,
            color: '#FFFFFF',
            backgroundColor: 'rgba(0,0,0,0)',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            fontWeight: '700',
            letterSpacing: 0,
            lineHeight: 1.2,
            textTransform: 'none',
            borderRadius: 0,
            strokeWidth: 0,
            strokeColor: '#000000'
          };
          Object.entries(resetStyle).forEach(([key, value]) => {
            handleStyleChange(key, value);
          });
        }}
        variant="outline"
        className="w-full bg-slate-700/30 border-slate-600 hover:border-purple-500/50 text-slate-300 hover:text-white text-xs"
      >
        <Zap className="w-3 h-3 mr-1" />
        איפוס סגנון
      </Button>
    </div>
  );
}