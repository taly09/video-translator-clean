
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

export default function EditableSegment({ segment, onTextChange, isActive, onClick }) {
  const [text, setText] = useState(segment.text);

  useEffect(() => {
    setText(segment.text);
  }, [segment.text]);

  const handleBlur = () => {
    if (text !== segment.text) {
      onTextChange(segment.id, text);
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
  };
  
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div
      id={`segment-${segment.id}`}
      className={`p-3 rounded-lg transition-all duration-300 cursor-pointer ${
        isActive
          ? 'bg-purple-600/20 border-purple-500 border'
          : 'bg-white/5 hover:bg-white/10'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-mono text-purple-300">
          {formatTime(segment.start)} - {formatTime(segment.end)}
        </p>
      </div>
      <Textarea
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white p-0 text-base leading-relaxed w-full resize-none"
        rows={Math.max(2, Math.ceil(text.length / 40))}
      />
    </div>
  );
}
