import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubtitlesList({ segments, selectedSegmentId, onSegmentSelect }) {
  return (
    <Card className="bg-transparent border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <span>📝</span>
          כל הכתוביות
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {segments.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-lg mb-2">🎬 אין כתוביות</p>
            <p className="text-sm">הוסף כתובית חדשה מציר הזמן</p>
          </div>
        ) : (
          segments.map((seg, index) => (
            <div
              key={seg.id || `fallback-${index}-${seg.start}-${seg.end}`}
              onClick={() => onSegmentSelect(seg.id, seg.start)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedSegmentId === seg.id
                  ? 'bg-purple-600/50 border border-purple-400 shadow-lg'
                  : 'hover:bg-white/10 border border-transparent hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-400 font-mono">
                  {seg.start.toFixed(1)}s - {seg.end.toFixed(1)}s
                </div>
                <div className="text-xs text-gray-500">
                  #{index + 1}
                </div>
              </div>

              <p className="text-sm text-white leading-relaxed">
                {seg.text}
              </p>

              {selectedSegmentId === seg.id && (
                <div className="mt-2 pt-2 border-t border-purple-400/30">
                  <p className="text-xs text-purple-300">
                    ✨ נבחר לעריכה
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}