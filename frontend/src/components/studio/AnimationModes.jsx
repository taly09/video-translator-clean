import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Play,
  Zap,
  Target,
  Sparkles,
  Eye,
  Clock,
  Users,
  Camera
} from 'lucide-react';

const ANIMATION_MODES = {
  full: {
    name: 'משפט מלא',
    description: 'מציג את כל המשפט בבת אחת',
    icon: Eye,
    color: 'blue',
    platforms: ['YouTube', 'Facebook']
  },
  'word-by-word': {
    name: 'מילה מילה (בודדת)',
    description: 'מציג מילה אחת בכל פעם',
    icon: Target,
    color: 'purple',
    platforms: ['TikTok', 'Shorts']
  },
  'word-by-word-cumulative': {
    name: 'מילה מילה (מצטברת)',
    description: 'מוסיף מילים בהדרגה עם הדגשת המילה הנוכחית',
    icon: Sparkles,
    color: 'pink',
    platforms: ['TikTok', 'Instagram']
  },
  'dynamic-highlight': {
    name: 'משפט עם הדגשה דינמית',
    description: 'מציג את כל המשפט ומדגיש כל מילה בתורה',
    icon: Zap,
    color: 'yellow',
    platforms: ['Instagram', 'YouTube']
  },
  'typewriter': {
    name: 'מכונת כתיבה',
    description: 'אפקט מכונת כתיבה - אות אחרי אות',
    icon: Clock,
    color: 'green',
    platforms: ['Stories', 'Reels']
  }
};

export default function AnimationModes({ captionMode, onModeChange }) {
  const currentMode = ANIMATION_MODES[captionMode] || ANIMATION_MODES.full;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Play className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-bold text-blue-200">מצבי תצוגה</h3>
      </div>

      <Select value={captionMode} onValueChange={onModeChange}>
        <SelectTrigger className="bg-slate-700 border-blue-500/30 text-white text-xs h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ANIMATION_MODES).map(([key, mode]) => {
            const IconComponent = mode.icon;
            return (
              <SelectItem key={key} value={key} className="py-3">
                <div className="flex items-center gap-3 w-full">
                  <IconComponent className={`w-4 h-4 text-${mode.color}-500`} />
                  <div className="flex-1">
                    <div className="font-medium">{mode.name}</div>
                    <div className="text-xs text-slate-500">{mode.description}</div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Current Mode Info */}
      <Card className="bg-slate-700/30 border-slate-600">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-${currentMode.color}-500/20`}>
              <currentMode.icon className={`w-4 h-4 text-${currentMode.color}-400`} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white text-sm">{currentMode.name}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {currentMode.description}
              </p>
              <div className="flex gap-1 mt-2">
                {currentMode.platforms.map(platform => (
                  <Badge
                    key={platform}
                    variant="secondary"
                    className={`text-xs bg-${currentMode.color}-500/20 text-${currentMode.color}-300`}
                  >
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips for current mode */}
      <div className="p-3 bg-slate-700/20 rounded-lg border border-slate-600/50">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span className="text-xs font-medium text-blue-200">טיפ לשיפור</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {captionMode === 'full' && 'מצב זה מתאים לתוכן ארוך יותר ולקהל שמעדיף לקרוא במהירות.'}
          {captionMode === 'word-by-word' && 'מצב זה יוצר מתח ומושך תשומת לב. מתאים לתוכן דינמי וקצר.'}
          {captionMode === 'word-by-word-cumulative' && 'המצב הכי פופולרי ברשתות החברתיות! יוצר זרימה טבעית.'}
          {captionMode === 'dynamic-highlight' && 'מאפשר קריאה רציפה תוך הדגשת המילה הרלוונטית. אידיאלי לתוכן חינוכי.'}
          {captionMode === 'typewriter' && 'יוצר תחושה של כתיבה חיה. מתאים לסטוריז ותוכן אישי.'}
        </p>
      </div>
    </div>
  );
}