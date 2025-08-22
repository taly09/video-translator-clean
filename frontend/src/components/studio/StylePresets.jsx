import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Flame,
  Crown,
  Star,
  Heart,
  Play,
  Users,
  Camera,
  Wand2
} from 'lucide-react';

const PRESET_STYLES = {
  tiktok_bold: {
    name: 'טיקטוק בולד',
    icon: Play,
    gradient: 'from-pink-500 to-purple-600',
    style: {
      fontFamily: 'Rubik Bold',
      fontSize: 58,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0)',
      textShadow: '3px 3px 8px rgba(0,0,0,1)',
      fontWeight: '900',
      strokeColor: '#000000',
      strokeWidth: 2,
      letterSpacing: 1,
      textTransform: 'uppercase',
      y: 85
    }
  },
  instagram_trendy: {
    name: 'אינסטגרם חדשני',
    icon: Camera,
    gradient: 'from-purple-400 to-pink-400',
    style: {
      fontFamily: 'Assistant',
      fontSize: 48,
      color: '#FFFFFF',
      backgroundColor: 'rgba(255,20,147,0.9)',
      textShadow: '2px 2px 6px rgba(0,0,0,0.8)',
      fontWeight: '700',
      borderRadius: 12,
      padding: '8px 16px',
      letterSpacing: 0.5,
      y: 80
    }
  },
  youtube_clean: {
    name: 'יוטיוב נקי',
    icon: Users,
    gradient: 'from-red-500 to-red-600',
    style: {
      fontFamily: 'Heebo',
      fontSize: 42,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.85)',
      textShadow: '1px 1px 4px rgba(0,0,0,0.9)',
      fontWeight: '600',
      borderRadius: 8,
      padding: '6px 12px',
      letterSpacing: 0,
      y: 88
    }
  },
  neon_glow: {
    name: 'זוהר ניאון',
    icon: Zap,
    gradient: 'from-cyan-400 to-blue-500',
    style: {
      fontFamily: 'Bebas Neue',
      fontSize: 52,
      color: '#00FFFF',
      backgroundColor: 'rgba(0,0,0,0.3)',
      textShadow: '0 0 20px #00FFFF, 0 0 40px #00FFFF, 2px 2px 4px rgba(0,0,0,0.8)',
      fontWeight: '400',
      letterSpacing: 2,
      textTransform: 'uppercase',
      y: 82
    }
  },
  retro_vintage: {
    name: 'רטרו וינטג׳',
    icon: Crown,
    gradient: 'from-yellow-400 to-orange-500',
    style: {
      fontFamily: 'Times New Roman',
      fontSize: 46,
      color: '#FFF8DC',
      backgroundColor: 'rgba(139,69,19,0.9)',
      textShadow: '3px 3px 0px #8B4513, 2px 2px 8px rgba(0,0,0,0.8)',
      fontWeight: '700',
      borderRadius: 15,
      padding: '10px 20px',
      letterSpacing: 1,
      y: 85
    }
  },
  fire_energy: {
    name: 'אנרגיה בוערת',
    icon: Flame,
    gradient: 'from-orange-500 to-red-600',
    style: {
      fontFamily: 'Impact',
      fontSize: 56,
      color: '#FFD700',
      backgroundColor: 'rgba(255,69,0,0.2)',
      textShadow: '0 0 10px #FF4500, 0 0 20px #FF4500, 3px 3px 8px rgba(0,0,0,1)',
      fontWeight: '900',
      strokeColor: '#FF4500',
      strokeWidth: 1,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      y: 83
    }
  },
  elegant_minimal: {
    name: 'אלגנטי מינימלי',
    icon: Star,
    gradient: 'from-gray-600 to-gray-800',
    style: {
      fontFamily: 'Heebo',
      fontSize: 40,
      color: '#F8F8FF',
      backgroundColor: 'rgba(47,79,79,0.9)',
      textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
      fontWeight: '300',
      borderRadius: 20,
      padding: '12px 24px',
      letterSpacing: 0.8,
      lineHeight: 1.4,
      y: 86
    }
  },
  love_romantic: {
    name: 'רומנטי אהבה',
    icon: Heart,
    gradient: 'from-pink-400 to-rose-500',
    style: {
      fontFamily: 'Assistant',
      fontSize: 44,
      color: '#FFB6C1',
      backgroundColor: 'rgba(255,20,147,0.3)',
      textShadow: '0 0 15px #FF69B4, 2px 2px 6px rgba(0,0,0,0.8)',
      fontWeight: '500',
      borderRadius: 25,
      padding: '8px 16px',
      letterSpacing: 0.5,
      y: 84
    }
  }
};

export default function StylePresets({ onApplyPreset, selectedSubtitleId, isGlobalEditMode }) {
  const handlePresetClick = (presetKey, preset) => {
    onApplyPreset(presetKey, preset.style);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-bold text-purple-200">סגנונות מוכנים</h3>
        {isGlobalEditMode && (
          <Badge variant="secondary" className="text-xs bg-purple-600/30 text-purple-200">
            החל על הכל
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(PRESET_STYLES).map(([key, preset]) => {
          const IconComponent = preset.icon;
          return (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => handlePresetClick(key, preset)}
                variant="outline"
                className={`w-full h-auto p-3 border-slate-600 hover:border-purple-500/50 bg-gradient-to-br ${preset.gradient} bg-opacity-10 hover:bg-opacity-20 transition-all duration-300 flex flex-col items-center gap-2`}
              >
                <IconComponent className="w-5 h-5 text-white" />
                <span className="text-xs font-medium text-center leading-tight text-white">
                  {preset.name}
                </span>
              </Button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-purple-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Wand2 className="w-3 h-3 text-purple-400" />
          <span className="text-xs font-medium text-purple-200">טיפ מקצועי</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          כל סגנון מותאם לפלטפורמה שלו. בחר את הסגנון שמתאים לקהל היעד שלך ולסגנון התוכן.
        </p>
      </div>
    </div>
  );
}