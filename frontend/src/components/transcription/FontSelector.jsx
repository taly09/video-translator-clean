
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Type,
  Palette,
  AlignCenter,
  AlignRight,
  AlignLeft,
  Bold,
  Italic,
  Underline,
  Circle
} from 'lucide-react';

const FontSelector = ({
  currentStyle = {},
  onStyleChange,
  previewText = "טקסט לדוגמה"
}) => {
  const [activeTab, setActiveTab] = useState('font');

  const fonts = [
    { name: 'Inter', label: 'Inter', weight: 'modern' },
    { name: 'Rubik', label: 'רוביק', weight: 'hebrew' },
    { name: 'Assistant', label: 'אסיסטנט', weight: 'hebrew' },
    { name: 'Frank Ruhl Libre', label: 'פרנק רוחל', weight: 'hebrew' },
    { name: 'Heebo', label: 'היבו', weight: 'hebrew' },
    { name: 'Alef', label: 'אלף', weight: 'hebrew' },
    { name: 'Open Sans', label: 'Open Sans', weight: 'universal' },
    { name: 'Roboto', label: 'רובוטו', weight: 'universal' },
    { name: 'Montserrat', label: 'מונסרט', weight: 'elegant' },
    { name: 'Playfair Display', label: 'פלייפייר', weight: 'elegant' }
  ];

  const colors = [
    { name: 'לבן', value: '#FFFFFF' },
    { name: 'שחור', value: '#000000' },
    { name: 'כחול', value: '#3B82F6' },
    { name: 'אדום', value: '#EF4444' },
    { name: 'ירוק', value: '#10B981' },
    { name: 'סגול', value: '#8B5CF6' },
    { name: 'כתום', value: '#F97316' },
    { name: 'צהוב', value: '#EAB308' },
    { name: 'ורוד', value: '#EC4899' },
    { name: 'טורקיז', value: '#06B6D4' }
  ];

  const backgroundColors = [
    { name: 'שקוף', value: 'transparent' },
    { name: 'שחור שקוף', value: '#000000AA' },
    { name: 'לבן שקוף', value: '#FFFFFFAA' },
    { name: 'כחול שקוף', value: '#3B82F6AA' },
    { name: 'אדום שקוף', value: '#EF4444AA' },
    { name: 'ירוק שקוף', value: '#10B981AA' },
    { name: 'סגול שקוף', value: '#8B5CF6AA' }
  ];

  const handleStyleUpdate = (updates) => {
    onStyleChange({ ...currentStyle, ...updates });
  };

  const tabs = [
    { id: 'font', label: 'פונט', icon: Type },
    { id: 'color', label: 'צבעים', icon: Palette },
    { id: 'position', label: 'מיקום', icon: AlignCenter }
  ];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="w-5 h-5" />
          עיצוב כתוביות
        </CardTitle>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1"
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Preview */}
        <div className="relative bg-gray-900 rounded-lg p-4 aspect-video flex items-center justify-center">
          <div
            className="text-center px-4 py-2 rounded-lg"
            style={{
              fontFamily: currentStyle.fontFamily || 'Inter',
              fontSize: `${(currentStyle.fontSize || 32) * 0.8}px`,
              color: currentStyle.color || '#FFFFFF',
              backgroundColor: currentStyle.backgroundColor || '#000000AA',
              fontWeight: currentStyle.fontWeight || 'normal',
              textAlign: currentStyle.textAlign || 'center'
            }}
          >
            {previewText}
          </div>
        </div>

        {/* Font Tab */}
        {activeTab === 'font' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                בחר פונט
              </label>
              <div className="grid grid-cols-2 gap-2">
                {fonts.map((font) => (
                  <Button
                    key={font.name}
                    variant={currentStyle.fontFamily === font.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStyleUpdate({ fontFamily: font.name })}
                    className="justify-start"
                    style={{ fontFamily: font.name }}
                  >
                    {font.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                גודל פונט: {currentStyle.fontSize || 32}px
              </label>
              <Slider
                value={[currentStyle.fontSize || 32]}
                onValueChange={(value) => handleStyleUpdate({ fontSize: value[0] })}
                max={72}
                min={12}
                step={2}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                עיצוב טקסט
              </label>
              <div className="flex gap-2">
                <Button
                  variant={currentStyle.fontWeight === 'bold' ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStyleUpdate({
                    fontWeight: currentStyle.fontWeight === 'bold' ? 'normal' : 'bold'
                  })}
                >
                  <Bold className="w-3 h-3" />
                </Button>
                <Button
                  variant={currentStyle.fontStyle === 'italic' ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStyleUpdate({
                    fontStyle: currentStyle.fontStyle === 'italic' ? 'normal' : 'italic'
                  })}
                >
                  <Italic className="w-3 h-3" />
                </Button>
                <Button
                  variant={currentStyle.textDecoration === 'underline' ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStyleUpdate({
                    textDecoration: currentStyle.textDecoration === 'underline' ? 'none' : 'underline'
                  })}
                >
                  <Underline className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Color Tab */}
        {activeTab === 'color' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                צבע טקסט
              </label>
              <div className="grid grid-cols-5 gap-2">
                {colors.map((color) => (
                  <Button
                    key={color.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleStyleUpdate({ color: color.value })}
                    className={`w-full h-8 p-0 ${
                      currentStyle.color === color.value ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                  >
                    <span className="sr-only">{color.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                צבע רקע
              </label>
              <div className="grid grid-cols-4 gap-2">
                {backgroundColors.map((color) => (
                  <Button
                    key={color.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleStyleUpdate({ backgroundColor: color.value })}
                    className={`w-full h-8 p-0 relative ${
                      currentStyle.backgroundColor === color.value ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                  >
                    {color.value === 'transparent' && (
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-blue-500 opacity-20" />
                    )}
                    <span className="sr-only">{color.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Position Tab */}
        {activeTab === 'position' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                יישור טקסט
              </label>
              <div className="flex gap-2">
                <Button
                  variant={currentStyle.textAlign === 'left' ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStyleUpdate({ textAlign: 'left' })}
                >
                  <AlignLeft className="w-3 h-3" />
                </Button>
                <Button
                  variant={currentStyle.textAlign === 'center' ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStyleUpdate({ textAlign: 'center' })}
                >
                  <AlignCenter className="w-3 h-3" />
                </Button>
                <Button
                  variant={currentStyle.textAlign === 'right' ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStyleUpdate({ textAlign: 'right' })}
                >
                  <AlignRight className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                מיקום אופקי: {currentStyle.position?.x || 50}%
              </label>
              <Slider
                value={[currentStyle.position?.x || 50]}
                onValueChange={(value) => handleStyleUpdate({
                  position: { ...currentStyle.position, x: value[0] }
                })}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                מיקום אנכי: {currentStyle.position?.y || 85}%
              </label>
              <Slider
                value={[currentStyle.position?.y || 85]}
                onValueChange={(value) => handleStyleUpdate({
                  position: { ...currentStyle.position, y: value[0] }
                })}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default FontSelector;
