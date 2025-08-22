import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wand2, Sparkles, Eye, Palette } from 'lucide-react';

const STYLE_PRESETS = [
  {
    id: 'minimal',
    name: 'מינימלי',
    description: 'נקי ופשוט',
    category: 'basic',
    preview: 'טקסט נקי וברור',
    styles: {
      fontFamily: 'Heebo, Assistant, Rubik',
      fontWeight: 700,
      fontSize: 54,
      color: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.6)',
      backgroundColor: 'transparent',
      y: 88,
      wordMode: 'none',
    },
  },
  {
    id: 'youtube-highlight',
    name: 'יוטיוב מודרני',
    description: 'הדגשת מילה מודגשת',
    category: 'highlight',
    preview: 'מילה מודגשת חכמה',
    styles: {
      fontFamily: 'Rubik, Heebo, Arial',
      fontWeight: 900,
      fontSize: 58,
      color: '#FFFFFF',
      textShadow: '0 0 0 rgba(0,0,0,0)',
      backgroundColor: 'transparent',
      y: 88,
      wordMode: 'youtube',
      highlightColor: '#F8FF1C',
    },
  },
  {
    id: 'progressive-elegant',
    name: 'הופעה אלגנטית',
    description: 'מילים נבנות בהדרגה',
    category: 'animated',
    preview: 'בנייה מילה אחרי מילה',
    styles: {
      fontFamily: 'Assistant, Rubik, Heebo',
      fontWeight: 800,
      fontSize: 56,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      y: 88,
      wordMode: 'progressive-word-only',
      highlightColor: '#3B82F6',
    },
  },
  {
    id: 'karaoke-modern',
    name: 'קריוקי מודרני',
    description: 'מילוי צבע חלק',
    category: 'animated',
    preview: 'מילוי צבע דינמי',
    styles: {
      fontFamily: 'Rubik, Heebo, Arial',
      fontWeight: 900,
      fontSize: 56,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      y: 88,
      wordMode: 'karaoke-fill',
      highlightColor: '#F8FF1C',
    },
  },
  {
    id: 'sparkle-magic',
    name: 'נצנוץ קסום',
    description: 'אפקט נצנוץ מיוחד',
    category: 'effects',
    preview: 'נצנוץ וזוהר',
    styles: {
      fontFamily: 'Rubik, Heebo, Arial',
      fontWeight: 900,
      fontSize: 56,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      y: 88,
      wordMode: 'sparkle',
      highlightColor: '#F8FF1C',
    },
  },
  {
    id: 'wave-dynamic',
    name: 'גל דינמי',
    description: 'תנועת גל חלקה',
    category: 'effects',
    preview: 'תנועה גלית',
    styles: {
      fontFamily: 'Rubik, Heebo, Arial',
      fontWeight: 900,
      fontSize: 56,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      y: 88,
      wordMode: 'wave',
      highlightColor: '#3B82F6',
    },
  }
];

const WORD_MODES = new Set([
  'karaoke',
  'word-by-word',
  'word-by-word-cumulative',
  'typewriter',
  'progressive',
  'progressive-word-only',
  'sparkle',
  'youtube',
  'wave',
  'karaoke-fill',
  'word-only',
]);

const StylePreviewCard = ({ preset, onApply, isSelected, currentHighlightColor }) => {
  const words = useMemo(() => ['ככה', 'עושים', 'את', 'זה'], []);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const isWordMode = WORD_MODES.has(preset.styles.wordMode);

  useEffect(() => {
    if (!isWordMode || !isHovered) return;

    const interval = setInterval(() => {
      setActiveIdx((i) => (i + 1) % words.length);
    }, 600);

    return () => clearInterval(interval);
  }, [isWordMode, words.length, isHovered]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'basic': return <Eye className="w-4 h-4" />;
      case 'highlight': return <Palette className="w-4 h-4" />;
      case 'animated': return <Wand2 className="w-4 h-4" />;
      case 'effects': return <Sparkles className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'basic': return 'bg-slate-100 text-slate-700';
      case 'highlight': return 'bg-blue-100 text-blue-700';
      case 'animated': return 'bg-purple-100 text-purple-700';
      case 'effects': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const previewStyle = {
    fontFamily: preset.styles.fontFamily,
    fontWeight: preset.styles.fontWeight,
    color: preset.styles.color,
    backgroundColor: 'transparent',
    textShadow: preset.styles.textShadow,
    fontSize: '18px',
    '--hl': currentHighlightColor || preset.styles.highlightColor || '#F8FF1C',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
          isSelected
            ? 'ring-2 ring-blue-500 bg-blue-50/50'
            : 'hover:shadow-lg bg-white'
        }`}
        onClick={onApply}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">{preset.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{preset.description}</p>
              <Badge variant="secondary" className={`text-xs ${getCategoryColor(preset.category)}`}>
                {getCategoryIcon(preset.category)}
                <span className="mr-1">{preset.category}</span>
              </Badge>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 aspect-video flex items-center justify-center relative overflow-hidden">
            <div className="preset-demo text-center" style={previewStyle} dir="rtl">
              <AnimatePresence mode="wait">
                {isWordMode ? (
                  <div className="flex gap-1 items-center">
                    {words.map((w, i) => (
                      <motion.span
                        key={`${i}-${activeIdx}`}
                        className={`subtitle-word ${preset.styles.wordMode}-word ${
                          i === activeIdx ? 'active' : ''
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                      >
                        {w}
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key="static-text"
                  >
                    {preset.preview}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Hover overlay */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-blue-600/10 backdrop-blur-[1px] flex items-center justify-center"
                >
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Wand2 className="w-4 h-4 mr-1" />
                    החל סגנון
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const StyleGallery = ({
  onApplyPreset,
  selectedPreset,
  currentHighlightColor,
  className = ""
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'הכל', icon: Eye },
    { id: 'basic', name: 'בסיסי', icon: Eye },
    { id: 'highlight', name: 'הדגשה', icon: Palette },
    { id: 'animated', name: 'מונפש', icon: Wand2 },
    { id: 'effects', name: 'אפקטים', icon: Sparkles },
  ];

  const filteredPresets = selectedCategory === 'all'
    ? STYLE_PRESETS
    : STYLE_PRESETS.filter(p => p.category === selectedCategory);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(({ id, name, icon: Icon }) => (
          <Button
            key={id}
            variant={selectedCategory === id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(id)}
            className={`shrink-0 ${
              selectedCategory === id
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4 mr-1" />
            {name}
          </Button>
        ))}
      </div>

      {/* Presets Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        layout
      >
        <AnimatePresence mode="popLayout">
          {filteredPresets.map(preset => (
            <motion.div
              key={preset.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <StylePreviewCard
                preset={preset}
                onApply={() => onApplyPreset(preset)}
                isSelected={selectedPreset === preset.id}
                currentHighlightColor={currentHighlightColor}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default StyleGallery;