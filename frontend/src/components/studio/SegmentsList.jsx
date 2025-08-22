import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Play,
  Clock,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SegmentsList({
  segments,
  currentTime,
  selectedSegmentId,
  searchTerm,
  sortBy,
  showOnlyVisible,
  onSegmentClick,
  onSearchChange,
  onSortChange,
  onVisibilityFilterChange
}) {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredAndSortedSegments = useMemo(() => {
    let filtered = segments;

    // סינון לפי חיפוש
    if (searchTerm) {
      filtered = filtered.filter(segment =>
        segment.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // סינון לפי כתוביות נוכחיות
    if (showOnlyVisible) {
      filtered = filtered.filter(segment =>
        currentTime >= segment.start && currentTime < segment.end
      );
    }

    // מיון
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return a.start - b.start;
        case 'duration':
          return (b.end - b.start) - (a.end - a.start);
        case 'text':
          return a.text.localeCompare(b.text);
        default:
          return a.start - b.start;
      }
    });

    return filtered;
  }, [segments, searchTerm, sortBy, showOnlyVisible, currentTime]);

  const isSegmentActive = (segment) => {
    return currentTime >= segment.start && currentTime < segment.end;
  };

  return (
    <div className="h-full bg-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            קטעי טקסט ({filteredAndSortedSegments.length})
          </h2>
          <Badge variant="secondary" className="bg-blue-600 text-white">
            {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="חיפוש בטקסט..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-slate-700 border-slate-600 text-white"
          />
        </div>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time">לפי זמן</SelectItem>
              <SelectItem value="duration">לפי משך</SelectItem>
              <SelectItem value="text">לפי טקסט</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showOnlyVisible ? "default" : "outline"}
            size="sm"
            onClick={() => onVisibilityFilterChange(!showOnlyVisible)}
            className="flex items-center gap-1"
          >
            {showOnlyVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            נוכחי
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {filteredAndSortedSegments.map((segment) => (
            <Card
              key={segment.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedSegmentId === segment.id
                  ? 'ring-2 ring-blue-400 bg-blue-500/10'
                  : isSegmentActive(segment)
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'hover:bg-slate-700/50 bg-slate-700/20'
              } border-slate-600`}
              onClick={() => onSegmentClick(segment)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isSegmentActive(segment) ? "default" : "secondary"}
                      className={`text-xs ${
                        isSegmentActive(segment)
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-600 text-gray-300'
                      }`}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTime(segment.start)}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {((segment.end - segment.start)).toFixed(1)}s
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSegmentClick(segment);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-sm text-white leading-relaxed">
                  {segment.text}
                </p>

                {segment.style && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {segment.style.fontFamily}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {segment.style.fontSize}px
                    </Badge>
                    <div
                      className="w-4 h-4 rounded-full border border-slate-400"
                      style={{ backgroundColor: segment.style.color }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}