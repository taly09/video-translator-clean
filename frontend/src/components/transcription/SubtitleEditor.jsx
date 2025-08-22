import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Edit3,
  Plus,
  Trash2,
  Copy,
  Scissors,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Type,
  Palette,
  Clock,
  Save,
  RotateCcw
} from 'lucide-react';

const SubtitleSegment = ({
  segment,
  index,
  isActive,
  onEdit,
  onDelete,
  onTimeChange,
  onSelect
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(segment.text);
  const [editStart, setEditStart] = useState(segment.start);
  const [editEnd, setEditEnd] = useState(segment.end);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onEdit(index, {
      ...segment,
      text: editText,
      start: editStart,
      end: editEnd
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(segment.text);
    setEditStart(segment.start);
    setEditEnd(segment.end);
    setIsEditing(false);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
        isActive
          ? 'border-blue-500 bg-blue-50 shadow-lg'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={() => onSelect(index)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {index + 1}
        </div>

        <div className="flex-1 space-y-3">
          {/* Time Display */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-3 h-3" />
            <span>{formatTime(segment.start)}</span>
            <span>→</span>
            <span>{formatTime(segment.end)}</span>
            <Badge variant="outline" className="text-xs">
              {(segment.end - segment.start).toFixed(1)}s
            </Badge>
          </div>

          {/* Text Content */}
          {isEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">זמן התחלה</Label>
                  <Input
                    type="number"
                    value={editStart}
                    onChange={(e) => setEditStart(parseFloat(e.target.value))}
                    step="0.1"
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">זמן סיום</Label>
                  <Input
                    type="number"
                    value={editEnd}
                    onChange={(e) => setEditEnd(parseFloat(e.target.value))}
                    step="0.1"
                    className="text-xs"
                  />
                </div>
              </div>
              <Input
                ref={inputRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="text-base"
                placeholder="הכניסו טקסט..."
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-3 h-3 mr-1" />
                  שמור
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <RotateCcw className="w-3 h-3 mr-1" />
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-base text-gray-900 leading-relaxed">
                {segment.text}
              </p>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(segment.text);
                  }}
                  className="text-gray-600 hover:text-gray-700"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(index);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SubtitleEditor = ({
  segments = [],
  onSegmentsChange,
  currentTime,
  onTimeSeek,
  activeSegmentIndex,
  onActiveSegmentChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegments, setSelectedSegments] = useState([]);

  const filteredSegments = segments.filter(segment =>
    segment.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSegmentEdit = (index, updatedSegment) => {
    const newSegments = [...segments];
    newSegments[index] = updatedSegment;
    onSegmentsChange(newSegments);
  };

  const handleSegmentDelete = (index) => {
    const newSegments = segments.filter((_, i) => i !== index);
    onSegmentsChange(newSegments);
  };

  const handleAddSegment = () => {
    const newSegment = {
      start: currentTime || 0,
      end: (currentTime || 0) + 3,
      text: 'טקסט חדש',
      style: {
        fontFamily: 'Inter',
        fontSize: 32,
        color: '#FFFFFF',
        backgroundColor: '#000000AA',
        position: { x: 50, y: 85 }
      }
    };
    onSegmentsChange([...segments, newSegment]);
  };

  const handleSegmentSelect = (index) => {
    const segment = segments[index];
    onActiveSegmentChange(index);
    onTimeSeek(segment.start);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">עורך כתוביות</h2>
          <Badge variant="outline">{segments.length} קטעים</Badge>
        </div>
        <Button onClick={handleAddSegment} className="bg-gradient-to-r from-blue-500 to-purple-500">
          <Plus className="w-4 h-4 mr-2" />
          הוסף קטע
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder="חפש בכתוביות..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </div>
      </div>

      {/* Segments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredSegments.map((segment, index) => (
            <SubtitleSegment
              key={index}
              segment={segment}
              index={index}
              isActive={activeSegmentIndex === index}
              onEdit={handleSegmentEdit}
              onDelete={handleSegmentDelete}
              onSelect={handleSegmentSelect}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredSegments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Type className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'לא נמצאו תוצאות' : 'אין כתוביות עדיין'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'נסו מילות חיפוש אחרות' : 'התחילו בהוספת קטע כתוביות'}
          </p>
          {!searchTerm && (
            <Button onClick={handleAddSegment} className="bg-gradient-to-r from-blue-500 to-purple-500">
              <Plus className="w-4 h-4 mr-2" />
              הוסף קטע ראשון
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default SubtitleEditor;