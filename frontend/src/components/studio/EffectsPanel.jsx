import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Zap, RotateCcw, Move, RotateCw,
  ZoomIn, Eye, Sparkles
} from 'lucide-react';

const ANIMATION_PRESETS = [
  { name: 'הופעה פשוטה', value: 'fadeIn' },
  { name: 'החלקה מימין', value: 'slideInRight' },
  { name: 'החלקה מלמעלה', value: 'slideInTop' },
  { name: 'זום פנימה', value: 'zoomIn' },
  { name: 'הקפצה', value: 'bounceIn' },
  { name: 'סיבוב', value: 'rotateIn' },
  { name: 'הבהוב', value: 'pulse' },
  { name: 'רטט', value: 'shake' }
];

const WORD_ANIMATIONS = [
  { name: 'מילה אחר מילה', value: 'wordByWord' },
  { name: 'אות אחר אות', value: 'letterByLetter' },
  { name: 'הדגשת מילים', value: 'highlightWords' },
  { name: 'מילים צבעוניות', value: 'colorfulWords' }
];

export default function EffectsPanel({ selectedSegment, onEffectChange }) {
  if (!selectedSegment) return null;

  const currentStyle = selectedSegment.style || {};

  const handleEffectUpdate = (updates) => {
    onEffectChange(updates);
  };

  return (
    <div className="space-y-6">
      {/* Position & Transform */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Move className="w-4 h-4" />
          מיקום וטרנספורמציה
        </h3>

        <div>
          <Label className="text-sm text-gray-300">סיבוב: {currentStyle.rotation || 0}°</Label>
          <Slider
            value={[currentStyle.rotation || 0]}
            onValueChange={([value]) => handleEffectUpdate({ rotation: value })}
            min={-45}
            max={45}
            step={1}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-sm text-gray-300">קנה מידה: {Math.round((currentStyle.scale || 1) * 100)}%</Label>
          <Slider
            value={[(currentStyle.scale || 1) * 100]}
            onValueChange={([value]) => handleEffectUpdate({ scale: value / 100 })}
            min={50}
            max={200}
            step={5}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-sm text-gray-300">שקיפות: {Math.round((currentStyle.opacity || 1) * 100)}%</Label>
          <Slider
            value={[(currentStyle.opacity || 1) * 100]}
            onValueChange={([value]) => handleEffectUpdate({ opacity: value / 100 })}
            min={10}
            max={100}
            step={5}
            className="mt-2"
          />
        </div>
      </div>

      {/* Entry Animations */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          אנימציות כניסה
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {ANIMATION_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant={currentStyle.animation === preset.value ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => handleEffectUpdate({ animation: preset.value })}
            >
              {preset.name}
            </Button>
          ))}
        </div>

        <div>
          <Label className="text-sm text-gray-300">משך אנימציה: {(currentStyle.animationDuration || 0.5).toFixed(1)}s</Label>
          <Slider
            value={[(currentStyle.animationDuration || 0.5) * 10]}
            onValueChange={([value]) => handleEffectUpdate({ animationDuration: value / 10 })}
            min={1}
            max={30}
            step={1}
            className="mt-2"
          />
        </div>
      </div>

      {/* Word-by-Word Effects */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          אפקטי מילים (כמו TikTok)
        </h3>

        <div className="grid grid-cols-1 gap-2">
          {WORD_ANIMATIONS.map((preset) => (
            <Button
              key={preset.value}
              variant={currentStyle.wordAnimation === preset.value ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => handleEffectUpdate({ wordAnimation: preset.value })}
            >
              {preset.name}
            </Button>
          ))}
        </div>

        <div>
          <Label className="text-sm text-gray-300">מהירות מילים: {(currentStyle.wordSpeed || 0.3).toFixed(1)}s למילה</Label>
          <Slider
            value={[(currentStyle.wordSpeed || 0.3) * 10]}
            onValueChange={([value]) => handleEffectUpdate({ wordSpeed: value / 10 })}
            min={1}
            max={10}
            step={1}
            className="mt-2"
          />
        </div>
      </div>

      {/* Advanced Effects */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          אפקטים מתקדמים
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={currentStyle.glowEffect ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleEffectUpdate({ glowEffect: !currentStyle.glowEffect })}
          >
            זוהר
          </Button>

          <Button
            variant={currentStyle.pulseEffect ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleEffectUpdate({ pulseEffect: !currentStyle.pulseEffect })}
          >
            פעימה
          </Button>

          <Button
            variant={currentStyle.gradientText ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleEffectUpdate({ gradientText: !currentStyle.gradientText })}
          >
            גרדיאנט
          </Button>

          <Button
            variant={currentStyle.strokeEffect ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleEffectUpdate({ strokeEffect: !currentStyle.strokeEffect })}
          >
            מסגרת טקסט
          </Button>
        </div>
      </div>

      {/* Positioning Presets */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-300">מיקומים מוכנים</h3>

        <div className="grid grid-cols-3 gap-2">
          {[
            { name: 'למעלה', pos: { x: 960, y: 200 } },
            { name: 'מרכז', pos: { x: 960, y: 540 } },
            { name: 'למטה', pos: { x: 960, y: 900 } },
            { name: 'שמאל', pos: { x: 300, y: 540 } },
            { name: 'ימין', pos: { x: 1620, y: 540 } },
            { name: 'פינה', pos: { x: 1600, y: 200 } }
          ].map(({ name, pos }) => (
            <Button
              key={name}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleEffectUpdate({ position: pos })}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleEffectUpdate({
          rotation: 0,
          scale: 1,
          opacity: 1,
          animation: null,
          wordAnimation: null,
          glowEffect: false,
          pulseEffect: false,
          gradientText: false,
          strokeEffect: false
        })}
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        איפוס אפקטים
      </Button>

      {/* Live Preview */}
      <div className="p-4 bg-black/50 rounded-lg border border-white/10">
        <Label className="text-sm text-gray-300 mb-2 block">תצוגה מקדימה של אפקטים</Label>
        <div className="text-center">
          <span
            className={`inline-block transition-all duration-300 ${
              currentStyle.glowEffect ? 'animate-pulse' : ''
            } ${currentStyle.pulseEffect ? 'animate-bounce' : ''}`}
            style={{
              fontFamily: currentStyle.fontFamily || 'Assistant',
              fontSize: Math.min((currentStyle.fontSize || 48) * 0.5, 20),
              color: currentStyle.gradientText
                ? undefined
                : currentStyle.color || '#FFFFFF',
              background: currentStyle.gradientText
                ? 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1)'
                : undefined,
              WebkitBackgroundClip: currentStyle.gradientText ? 'text' : undefined,
              WebkitTextFillColor: currentStyle.gradientText ? 'transparent' : undefined,
              backgroundColor: currentStyle.backgroundColor || 'rgba(0,0,0,0.7)',
              borderRadius: currentStyle.borderRadius || 8,
              padding: (currentStyle.padding || 12) * 0.5,
              textShadow: currentStyle.glowEffect
                ? `0 0 20px ${currentStyle.color || '#FFFFFF'}`
                : currentStyle.textShadow || 'none',
              WebkitTextStroke: currentStyle.strokeEffect ? '1px #000000' : undefined,
              border: currentStyle.border || 'none',
              transform: `rotate(${currentStyle.rotation || 0}deg) scale(${currentStyle.scale || 1})`,
              opacity: currentStyle.opacity || 1
            }}
          >
            {selectedSegment.text || 'דוגמת טקסט מעוצב'}
          </span>
        </div>
      </div>
    </div>
  );
}