import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Type, Minus, Plus, RotateCcw } from 'lucide-react';

export const FontSizeController = ({
  fontSize = 54,
  onChange,
  min = 20,
  max = 120,
  step = 2,
  showPresets = true,
  className = ""
}) => {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [inputValue, setInputValue] = useState(String(fontSize));

  const presetSizes = [24, 32, 40, 48, 56, 64, 72, 80, 96];

  const handleSliderChange = useCallback((value) => {
    const newSize = value[0];
    onChange(newSize);
    setInputValue(String(newSize));
  }, [onChange]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setInputValue(value);

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  }, [onChange, min, max]);

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < min || numValue > max) {
      setInputValue(String(fontSize));
    }
  }, [inputValue, fontSize, min, max]);

  const adjustFontSize = useCallback((delta) => {
    const newSize = Math.max(min, Math.min(max, fontSize + delta));
    onChange(newSize);
    setInputValue(String(newSize));
  }, [fontSize, onChange, min, max]);

  const resetToDefault = useCallback(() => {
    onChange(54);
    setInputValue('54');
  }, [onChange]);

  React.useEffect(() => {
    if (!isInputFocused) {
      setInputValue(String(fontSize));
    }
  }, [fontSize, isInputFocused]);

  return (
    <motion.div
      className={`space-y-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Type className="w-4 h-4" />
          גודל הכתב
        </Label>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => adjustFontSize(-step)}
            className="h-8 w-8"
            disabled={fontSize <= min}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsInputFocused(true)}
            onBlur={handleInputBlur}
            className="w-16 h-8 text-center text-sm"
            dir="ltr"
          />
          <span className="text-xs text-gray-500">px</span>
          <Button
            size="icon"
            variant="outline"
            onClick={() => adjustFontSize(step)}
            className="h-8 w-8"
            disabled={fontSize >= max}
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={resetToDefault}
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
            title="אפס לברירת מחדל"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Main Slider */}
      <div className="space-y-2">
        <Slider
          value={[fontSize]}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          className="relative"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{min}px</span>
          <span className="font-medium text-gray-600">{fontSize}px</span>
          <span>{max}px</span>
        </div>
      </div>

      {/* Size Presets */}
      {showPresets && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-500">גדלים מומלצים</Label>
          <div className="flex flex-wrap gap-2">
            {presetSizes.map(size => (
              <motion.button
                key={size}
                onClick={() => {
                  onChange(size);
                  setInputValue(String(size));
                }}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  fontSize === size
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                {size}px
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Visual Size Indicator */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <motion.div
          style={{ fontSize: `${Math.min(fontSize * 0.3, 24)}px` }}
          className="font-bold text-gray-800"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.5 }}
          key={fontSize}
        >
          דוגמה לטקסט
        </motion.div>
        <div className="text-xs text-gray-500 mt-2">
          {fontSize}px - גודל בפועל בווידאו יהיה יחסי לרזולוציה
        </div>
      </div>
    </motion.div>
  );
};

export default FontSizeController;