
import React, { useState, useEffect, useCallback, useRef,useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transcription } from '@/entities/Transcription';
import { createPageUrl } from '@/utils/createPageUrl';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from "react-toastify";
import { useDebounce } from '@/components/hooks/useDebounce';
import { motion, AnimatePresence } from "framer-motion";
import { SubtitleRenderer } from "@/components/SubtitleRenderer";
import { renderCaptions } from "@shared/captions-engine";


import "../style/video.css";
import {
  ArrowRight, Save, Download, CheckCircle, AlertCircle, Loader2, ChevronsLeft, ChevronsRight, Palette,
  Type, Move, RotateCcw, Eye, EyeOff, Layers, ArrowLeft, X, Play, Pause, Volume2, VolumeX, MousePointer,
  Settings, Sparkles, Menu, Wand2, FileText, Edit3, Film, Share2
} from 'lucide-react';
import { saveAs } from 'file-saver';

function guestHeaders() {
  const gid = localStorage.getItem("guest_id");
  const headers = {};
  if (gid) headers["X-Guest-Id"] = gid;
  return { headers, credentials: "include" };
}

export default function Studio() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const transcriptionId = urlParams.get('id');

  const [isRTL, setIsRTL] = useState(false);
  const [transcription, setTranscription] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [selectedSubtitleId, setSelectedSubtitleId] = useState(null);
  const [highlightedWords, setHighlightedWords] = useState({});
  const [editingSubtitleId, setEditingSubtitleId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // SAFE margins (in %)
  const SAFE = { TOP: 10, BOTTOM: 14, SIDE: 5 };
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // hover controls logic (desktop)
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef(null);
  const pokeControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 1600);
  }, []);
  const videoRef = useRef(null);
  /** @type {React.RefObject<HTMLDivElement>} */
  const videoContainerRef = useRef(null);
  const dragRef = useRef({ element: null, offsetX: 0, offsetY: 0, x: 0, y: 0 });

  useEffect(() => {
    if (isMobile) return; // desktop only
    const el = videoContainerRef.current;
    if (!el) return;
    const evts = ['mousemove', 'click', 'touchstart'];
    evts.forEach(ev => el.addEventListener(ev, pokeControls, { passive: true }));
    return () => {
      evts.forEach(ev => el.removeEventListener(ev, pokeControls));
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pokeControls, isMobile]);

  useEffect(() => { if (!isPlaying) setShowControls(true); }, [isPlaying]);

  const [isGlobalEditMode, setIsGlobalEditMode] = useState(() => {
    return localStorage.getItem('globalEdit') === 'false' ? false : true;
  });
  const [activeMobileTab, setActiveMobileTab] = useState('script');

  const [videoResolution, setVideoResolution] = useState({ width: 1920, height: 1080 });
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = playbackRate; }, [playbackRate]);

  const seekBy = useCallback((delta) => {
    if (!videoRef.current) return;
    const t = Math.max(0, Math.min((videoRef.current.currentTime || 0) + delta, duration || 0));
    videoRef.current.currentTime = t;
    setCurrentTime(t);
  }, [duration]);

  const fmtHMS = useCallback((t = 0) => {
    const hh = Math.floor(t / 3600);
    const mm = Math.floor((t % 3600) / 60);
    const ss = Math.floor(t % 60);
    return [hh, mm, ss].map(v => String(v).padStart(2, '0')).join(':');
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlayPause(); }
      else if (e.key === 'ArrowRight') seekBy(e.shiftKey ? 1 : 0.5);
      else if (e.key === 'ArrowLeft') seekBy(e.shiftKey ? -1 : -0.5);
      else if (e.key.toLowerCase() === 'j') seekBy(-5);
      else if (e.key.toLowerCase() === 'k') togglePlayPause();
      else if (e.key.toLowerCase() === 'l') seekBy(5);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [seekBy]);

  // Fonts + quick colors
  const TIKTOK_FONTS = ['Rubik', 'Impact', 'Bebas Neue', 'Assistant', 'Arial Black', 'Oswald', 'Heebo', 'Times New Roman'];
  const POPULAR_COLORS = ['#FFFFFF', '#000000', '#FFFF00', '#FF0000', '#3b82f6'];
  const POPULAR_HIGHLIGHT_COLORS = ['#F8FF1C', '#FFFF00', '#FF8C00', '#FF3B30', '#34D399', '#3b82f6', '#A78BFA', '#FFFFFF', '#000000'];

  // -------- NEW: Style Presets (gallery) --------
  const STYLE_PRESETS = [
  {
    id: 'plain',
    name: 'רגיל',
    mode: 'none',
    styles: {
      fontFamily: 'Heebo, Assistant, Rubik',
      fontWeight: 800,
      fontSize: 54,
      color: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,.6)',
      backgroundColor: 'transparent',
      y: 88,
      wordMode: 'none',
    },
  },
  {
    id: 'youtube',
    name: 'מילה מודגשת',
    mode: 'youtube',
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
    id: 'word-by-word',
    name: 'מילה אחרי מילה',
    mode: 'word-by-word',
    styles: {
      fontFamily: 'Rubik, Heebo, Arial',
      fontWeight: 900,
      fontSize: 56,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      y: 88,
      wordMode: 'word-by-word',
      highlightColor: '#F8FF1C',
    },
  },

  {
  id: 'word-only',
  name: 'מילה נוכחית בלבד',
  mode: 'word-only',
  styles: {
    fontFamily: 'Rubik, Heebo, Arial',
    fontWeight: 900,
    fontSize: 56,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    y: 88,
    wordMode: 'word-only',
    highlightColor: '#3b82f6'
  },
},

{
  id: 'papercut',
  name: 'PaperCut',
  mode: 'papercut',
  styles: {
    fontFamily: 'Rubik, Heebo, Arial',
    fontWeight: 900,
    fontSize: 56,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    y: 88,
    wordMode: 'papercut',
    highlightColor: '#00C2A8', // צבע המותג
  },
},
{
  id: 'barcode-print',
  name: 'Barcode Print',
  mode: 'barcode-print',
  styles: {
    fontFamily: 'Rubik, Heebo, Arial',
    fontWeight: 900,
    fontSize: 56,
    color: '#EDEDED',
    backgroundColor: 'transparent',
    y: 88,
    wordMode: 'barcode-print',
    highlightColor: '#00C2A8', // צבע המותג
  },
},


{
  id: 'neon',
  name: 'Neon Glow',
  mode: 'neon',
  styles: {
    fontFamily: 'Rubik, Heebo, Arial',
    fontWeight: 900,
    fontSize: 56,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    textShadow: '0 0 6px rgba(0,255,255,.4)',
    y: 88,
    wordMode: 'neon',
    highlightColor: '#0FF', // ישתמש גם ב־--hl
  },
},
{
  id: 'matrix',
  name: 'Matrix Rain',
  mode: 'matrix',
  styles: {
    fontFamily: 'Oswald, Rubik, Arial',
    fontWeight: 800,
    fontSize: 56,
    color: '#a7f3d0',           // ירקרק-מטריקס
    backgroundColor: 'transparent',
    textShadow: '0 0 2px rgba(34,197,94,.6)',
    y: 88,
    wordMode: 'matrix',
    highlightColor: '#22c55e',
  },
},
{
  id: 'typewriter',
  name: 'Typewriter',
  mode: 'typewriter',
  styles: {
    fontFamily: 'Bebas Neue, Rubik, Arial',
    fontWeight: 900,
    fontSize: 56,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    textShadow: '0 2px 8px rgba(0,0,0,.35)',
    y: 88,
    wordMode: 'typewriter',
    highlightColor: '#F8FF1C',
  },
},


  {
    id: 'cumulative',
    name: 'מצטבר',
    mode: 'word-by-word-cumulative',
    styles: {
      fontFamily: 'Rubik, Heebo, Arial',
      fontWeight: 900,
      fontSize: 56,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      y: 88,
      wordMode: 'word-by-word-cumulative',
      highlightColor: '#F8FF1C',
    },
  },
  {
    id: 'progressive',
    name: 'הופעה מילה־מילה',
    mode: 'progressive',
    styles: {
      fontFamily: 'Rubik, Heebo, Arial',
      fontWeight: 900,
      fontSize: 56,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      y: 88,
      wordMode: 'progressive',
      highlightColor: '#FFD400',
    },
  },
  {
  id: 'sparkle',
  name: 'נצנוץ',
  mode: 'sparkle',
  styles: {
    fontFamily: 'Rubik, Heebo, Arial',
    fontWeight: 900,
    fontSize: 56,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    y: 88,
    wordMode: 'sparkle',
    highlightColor: '#F8FF1C', // אפשר לשנות ב-UI
  },
},

  {
    id: 'progressive-word-only',
    name: 'הדגשת מילה נוכחית',
    mode: 'progressive-word-only',
    styles: {
      fontFamily: 'Rubik, Heebo, Arial',
      fontWeight: 900,
      fontSize: 56,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      y: 88,
      wordMode: 'progressive-word-only',
      highlightColor: '#A78BFA',
    },
  },
  {
    id: 'karaoke',
    name: 'קריוקי',
    mode: 'karaoke',
    styles: {
      fontFamily: 'Rubik, Heebo, Arial',
      fontWeight: 900,
      fontSize: 56,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      y: 88,
      wordMode: 'karaoke',
      highlightColor: '#F8FF1C',
    },
  },
  {
    id: 'karaoke-fill',
    name: 'קריוקי מילוי',
    mode: 'karaoke-fill',
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
    id: 'wave',
    name: 'גל',
    mode: 'wave',
    styles: {
      fontFamily: 'Rubik, Heebo, Arial',
      fontWeight: 900,
      fontSize: 56,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      y: 88,
      wordMode: 'wave',
      highlightColor: '#3b82f6',
    },
  },
];



  const [burning, setBurning] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => { localStorage.setItem('globalEdit', isGlobalEditMode.toString()); }, [isGlobalEditMode]);

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // ---------- Load transcription ----------
  useEffect(() => {
    const loadData = async () => {
      if (!transcriptionId) {
        setError("לא סופק מזהה תמלול.");
        setLoading(false);
        return;
      }
      try {
        const data = await Transcription.get(transcriptionId);
        setTranscription(data);
        const rtlLanguages = ['he', 'ar', 'fa', 'ur'];
        setIsRTL(rtlLanguages.includes(data.language));

        const newHighlightedWords = {};
        const processedSubtitles = (data.segments || []).map((seg, index) => {
          const segId = seg.id || `subtitle_${index}`;
          const wordsArray = seg.text.split(/\s+/).filter(Boolean);
          let highlightedWord = seg.style?.highlightedWord;
          if (!highlightedWord && wordsArray.length) {
            highlightedWord = wordsArray.sort((a, b) => b.length - a.length)[0];
          }
          newHighlightedWords[segId] = highlightedWord;
          const totalDuration = seg.end - seg.start;
          const generatedWords = (seg.words && seg.words.length > 0)
            ? seg.words
            : wordsArray.map((word, i) => {
              const wordStart = seg.start + (i * totalDuration) / wordsArray.length;
              const wordEnd = seg.start + ((i + 1) * totalDuration) / wordsArray.length;
              return { word, start: wordStart, end: wordEnd };
            });
          return {
            id: segId,
            text: seg.text,
            start: seg.start,
            end: seg.end,
            words: generatedWords,
            style: {
              x: seg.style?.x ?? 50,
              y: seg.style?.y ?? 85,
              fontSize: seg.style?.fontSize ?? 52,
              fontFamily: seg.style?.fontFamily ?? 'Rubik',
              color: seg.style?.color ?? '#FFFFFF',
              textShadow: seg.style?.textShadow ?? 'none',
              backgroundColor: seg.style?.backgroundColor ?? 'rgba(0,0,0,0)',
              fontWeight: seg.style?.fontWeight ?? '900',
              highlightColor: seg.style?.highlightColor || '#F8FF1C',
              wordMode: seg.style?.wordMode ?? 'none',
              ...seg.style
            }
          };
        });

        setHighlightedWords(newHighlightedWords);
        setSubtitles(processedSubtitles);
        if (processedSubtitles.length > 0) setSelectedSubtitleId(processedSubtitles[0].id);
        setIsInitialLoad(false);
      } catch (err) {
        console.error(err);
        setError("שגיאה בטעינת התמלול.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [transcriptionId]);

  // autosave
  const debouncedSubtitles = useDebounce(subtitles, 800);
  useEffect(() => {
    if (isInitialLoad) return;
    handleSave(true);
  }, [debouncedSubtitles]); // eslint-disable-line

  const handleSave = useCallback(async (silent = false) => {
    if (!transcription || !subtitles.length) return;
    if (!silent) toast.loading("שומר שינויים...");
    setSaving(true);
    try {
      const segmentsToSave = subtitles.map(({ id, text, start, end, style }) => ({
        id, text, start, end,
        style: { ...style, highlightedWord: highlightedWords[id] || '' },
      }));
      await Transcription.update(transcription.task_id || transcription.id, { segments: segmentsToSave });
      if (!silent) toast.success("השינויים נשמרו ✅");
    } catch (error) {
      console.error("שגיאה בשמירה:", error);
      if (!silent) toast.error("שגיאה בשמירת השינויים ❌");
    } finally {
      setSaving(false);
    }
  }, [transcription, subtitles, highlightedWords]);

  const updateSubtitleStyle = useCallback((id, styleUpdates) => {
    if (styleUpdates.wordMode === 'none') {
      setHighlightedWords(prev => ({ ...prev, [id]: '' }));
    }
    if (isGlobalEditMode) {
      setSubtitles(prev => prev.map(sub => ({ ...sub, style: { ...sub.style, ...styleUpdates } })));
    } else {
      setSubtitles(prev => prev.map(sub => sub.id === id ? { ...sub, style: { ...sub.style, ...styleUpdates } } : sub));
    }
  }, [isGlobalEditMode]);

  // --------- Apply Preset ---------
  // 💡 מחליף preset בלי לדרוס highlightColor מה־UI
const applyPreset = (presetId) => {
  const preset = STYLE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return;

  // מוציאים את highlightColor מה-preset כדי לא לדרוס את הבחירה של המשתמש
  const { highlightColor: _ignoreHighlightColor, ...restPresetStyles } = preset.styles || {};

  if (isGlobalEditMode) {
    // מחיל על כל הכתוביות – אבל בלי לשנות highlightColor
    setSubtitles((prev) =>
      prev.map((sub) => ({
        ...sub,
        style: { ...sub.style, ...restPresetStyles }, // שומר highlightColor קיים
      }))
    );

    // אופציונלי: קובע מילה להדגשה (למשל הארוכה ביותר) לכל סגמנט
    const nh = {};
    (subtitles || []).forEach((sub) => {
      const words = sub.text.split(/\s+/).filter(Boolean);
      const longest = words.sort((a, b) => b.length - a.length)[0] || '';
      nh[sub.id] = longest;
    });
    setHighlightedWords(nh);
  } else if (selectedSubtitleId) {
    // מחיל על סעיף אחד – גם כאן לא נוגעים ב-highlightColor
    updateSubtitleStyle(selectedSubtitleId, restPresetStyles);

    const s = subtitles.find((x) => x.id === selectedSubtitleId);
    if (s) {
      const words = s.text.split(/\s+/).filter(Boolean);
      const longest = words.sort((a, b) => b.length - a.length)[0] || '';
      setHighlightedWords((prev) => ({ ...prev, [selectedSubtitleId]: longest }));
    }
  }

  toast.success(`הסגנון “${preset.name}” הוחל!`);
};


  const cleanColor = (c) => {
  if (!c) return '#F8FF1C';
  const m = c.match(/var\([^,]+,\s*([^)]+)\)/i);
  return (m ? m[1] : c).trim();
};

const prepareBurnData = () => {
  if (!videoResolution.width || !videoResolution.height) {
    toast.error("רזולוציית הווידאו לא זמינה.");
    return null;
  }
  return subtitles.map(sub => ({
    text: sub.text,
    start: sub.start,
    end: sub.end,
    style: {
      ...sub.style,
      fontSize: Math.round(sub.style.fontSize),
      highlightColor: cleanColor(sub.style?.highlightColor || '#F8FF1C'),
      highlightedWord: highlightedWords[sub.id] || '',
      highlightWord:   highlightedWords[sub.id] || '',
    }
  }));
};



  const handleTextChange = useCallback((id, newText) => {
    setSubtitles(prev => prev.map(sub => {
      if (sub.id !== id) return sub;
      const wordsArray = newText.split(/\s+/).filter(Boolean);
      const totalDuration = sub.end - sub.start;
      const updatedWords = wordsArray.map((word, i) => ({
        word,
        start: sub.start + (i * totalDuration) / Math.max(1, wordsArray.length),
        end: sub.start + ((i + 1) * totalDuration) / Math.max(1, wordsArray.length),
      }));
      return { ...sub, text: newText, words: updatedWords };
    }));
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play();
      else videoRef.current.pause();
    }
  };

  const handleSeekChange = (newTime) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime[0];
      setCurrentTime(newTime[0]);
    }
  };
  const handleTimeUpdate = () => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); };
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoResolution({
        width: Math.max(videoRef.current.videoWidth, 1920),
        height: Math.max(videoRef.current.videoHeight, 1080),
      });
    }
  };
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleSegmentClick = (segment) => {
    if (videoRef.current) {
      videoRef.current.currentTime = segment.start;
      if (!videoRef.current.paused) videoRef.current.pause();
    }
    setSelectedSubtitleId(segment.id);
    if (isMobile) setActiveMobileTab('style');
  };

  const handleSubtitleClick = (subtitle, e) => {
    e.stopPropagation();
    setSelectedSubtitleId(subtitle.id);
    if (videoRef.current && !videoRef.current.paused) videoRef.current.pause();
  };

  const enterEditMode = (subtitle, e) => {
    e.stopPropagation();
    setEditingSubtitleId(subtitle.id);
    setEditingText(subtitle.text);
    setSelectedSubtitleId(subtitle.id);
  };
  const handleFinishEditing = () => {
    if (editingSubtitleId && editingText !== undefined) {
      handleTextChange(editingSubtitleId, editingText);
    }
    setEditingSubtitleId(null);
    setEditingText('');
  };

  // ---- drag n' drop positioning ----
  const startDragging = (clientX, clientY, subtitle) => {
    setIsDragging(true);
    setSelectedSubtitleId(subtitle.id);
    const rect = videoContainerRef.current.getBoundingClientRect();
    const startX = ((clientX - rect.left) / rect.width) * 100;
    const startY = ((clientY - rect.top) / rect.height) * 100;
    dragRef.current.offsetX = startX - subtitle.style.x;
    dragRef.current.offsetY = startY - subtitle.style.y;
    document.body.style.cursor = 'grabbing';
  };

  const performDrag = (clientX, clientY) => {
    requestAnimationFrame(() => {
      const rect = videoContainerRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      let newX = x - dragRef.current.offsetX;
      let newY = y - dragRef.current.offsetY;
      newX = clamp(newX, SAFE.SIDE, 100 - SAFE.SIDE);
      newY = clamp(newY, SAFE.TOP, 100 - SAFE.BOTTOM);
      updateSubtitleStyle(selectedSubtitleId, { x: newX, y: newY });
    });
  };

  const stopDragging = () => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  };

  const handleMouseDown = (e, subtitle) => {
    if (editingSubtitleId) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.cursor = 'grabbing';
    e.currentTarget.style.transition = 'none';
    startDragging(e.clientX, e.clientY, subtitle);
  };
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    performDrag(e.clientX, e.clientY);
  }, [isDragging, selectedSubtitleId]); // updateSubtitleStyle via closure

  const handleMouseUp = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    stopDragging();
  }, [isDragging]);

  const handleTouchStart = (e, subtitle) => {
    if (editingSubtitleId) return;
    e.stopPropagation();
    e.currentTarget.style.cursor = 'grabbing';
    e.currentTarget.style.transition = 'none';
    startDragging(e.touches[0].clientX, e.touches[0].clientY, subtitle);
  };
  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault(); // stop page scroll while dragging
    e.stopPropagation();
    performDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, [isDragging, selectedSubtitleId]);

  const handleTouchEnd = useCallback((e) => {
    if (!isDragging) return;
    e.stopPropagation();
    stopDragging();
  }, [isDragging]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // ---------- EXPORTS ----------
  const exportSRT = () => {
    const format = (t) => {
      const ms = Math.floor((t - Math.floor(t)) * 1000).toString().padStart(3, '0');
      const d = new Date(Math.floor(t) * 1000).toISOString().slice(11, 19);
      return `${d},${ms}`;
    };
    const srt = subtitles.map((sub, i) => {
      return `${i + 1}
${format(sub.start)} --> ${format(sub.end)}
${sub.text}`;
    }).join('\n\n');
    saveAs(new Blob([srt], { type: 'text/srt;charset=utf-8' }), `${transcription?.title || 'captions'}.srt`);
    toast.success("קובץ SRT יוצא בהצלחה!");
  };

  const exportTXT = () => {
    const txt = subtitles.map(sub => sub.text).join('\n');
    saveAs(new Blob([txt], { type: 'text/plain;charset=utf-8' }), `${transcription?.title || 'transcript'}.txt`);
    toast.success("קובץ טקסט יוצא בהצלחה!");
  };

  async function downloadByUrl(url, baseName = "video") {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
    const blob = await resp.blob();
    const u = url.split("?")[0].toLowerCase();
    const ext = u.endsWith(".webm") ? ".webm" : u.endsWith(".mp4") ? ".mp4" : ".mp4";
    saveAs(blob, `${baseName}-burned${ext}`);
  }

  const handleBurnSubtitles = async () => {
    if (!transcription?.task_id) return toast.error("מזהה משימה חסר");
    if (saving || burning) return toast.info("פעולה קודמת בעיצומה...");
    await handleSave(true);
    setBurning(true);
    const toastId = toast.loading("מכין צריבה...");
    try {
      const burnDataSegments = prepareBurnData();
      if (!burnDataSegments) throw new Error("Segments missing");
      const res = await fetch(`/api/remotion/render/${transcription.task_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segments: burnDataSegments, resolution: videoResolution }),
        credentials: "include",
      });
      const data = await res.json();

      // ready immediately
      if (data.status === "success" && data.data?.video_url) {
        toast.update(toastId, { render: "הצריבה הצליחה! מוריד וידאו...", type: "success", isLoading: false, autoClose: 3000 });
        await downloadByUrl(data.data.video_url, transcription.title || "video");
        return;
      }

      // queued/started -> poll
      if (data.status === "queued" || data.status === "started") {
        toast.update(toastId, { render: "הווידאו בתור…", type: "info", isLoading: true });
        const pollStatus = async (maxTries = 300, intervalMs = 2000) => {
          for (let i = 0; i < maxTries; i++) {
            await new Promise(r => setTimeout(r, intervalMs));
            const sRes = await fetch(`/api/transcriptions/${transcription.task_id}`, { credentials: "include" });
            const sData = await sRes.json();
            const doc = sData?.data || sData;
            const url = doc?.r2_urls?.mp4 || doc?.r2_urls?.webm || doc?.proxy_urls?.mp4 || doc?.proxy_urls?.webm;
            if (url) {
              toast.update(toastId, { render: "מוכן! מוריד וידאו…", type: "success", isLoading: false, autoClose: 3000 });
              await downloadByUrl(url, transcription.title || "video");
              return;
            }
            if (doc?.status === "failed") {
              throw new Error(doc?.error || "הרינדור נכשל");
            }
          }
          throw new Error("זמן ההמתנה לרינדור הסתיים");
        };
        await pollStatus();
        return;
      }

      throw new Error(data.message || "שגיאת API לא ידועה");
    } catch (err) {
      console.error("שגיאת צריבה:", err);
      toast.update(toastId, { render: `שגיאה בצריבה: ${err.message}`, type: "error", isLoading: false, autoClose: 5000 });
    } finally {
      setBurning(false);
    }
  };

  const selectedSubtitle = subtitles.find(sub => sub.id === selectedSubtitleId);
  const currentSubtitle = subtitles.find(sub => currentTime >= sub.start && currentTime < sub.end);
  const formatTime = (time) => new Date(time * 1000).toISOString().substr(14, 5);

  // ---------- UI blocks ----------

  // Live style gallery card

// רשימת מצבי "מילה-מילה" (אפשר להשאיר בתוך Studio)
const WORD_MODES = new Set([
  'karaoke',
  'word-by-word',
  'word-by-word-cumulative',
  'progressive',
  'progressive-word-only',
  'sparkle',
  'youtube',
  'wave',
  'karaoke-fill',
  'word-only',
  'neon',
  'matrix',
  'typewriter',
  'papercut',
  'barcode-print',
]);

    const StyleCard = ({ preset }) => {
  const words = useMemo(() => {
    const arr = ["ככה", "עושים", "את", "זה"];
    const per = 2;
    return arr.map((w, i) => ({
      word: w,
      start: i * per,
      end: (i + 1) * per,
    }));
  }, []);

  const fps = 30;
  const total = words[words.length - 1].end;
  const [now, setNow] = useState(0);
  const frame = Math.round(now * fps);

  useEffect(() => {
    const id = setInterval(() => {
      setNow((t) => {
        const nt = t + 0.2;
        return nt >= total ? 0 : nt;
      });
    }, 200);
    return () => clearInterval(id);
  }, [total]);

  const mode = preset.mode || "none";

  const hl =
    (selectedSubtitle && selectedSubtitle.style && selectedSubtitle.style.highlightColor) ||
    (preset.styles && preset.styles.highlightColor) ||
    "#F8FF1C";

  const demoStyle = {
    fontFamily: (preset.styles && preset.styles.fontFamily) || "Rubik",
    fontWeight: (preset.styles && preset.styles.fontWeight) || 900,
    fontSize: 24,
    color: (preset.styles && preset.styles.color) || "#fff",
    backgroundColor: "transparent",
    textShadow: preset.styles && preset.styles.textShadow,
    highlightColor: hl,
  };

  const rendered = renderCaptions(mode, {
    words,
    now,
    frame,
    fps,
    style: demoStyle,
    rtl: true,
  });

  return (
    <button
      onClick={() => applyPreset(preset.id)}
      className="group relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-colors"
      title={preset.name}
      type="button"
    >
      <div className="aspect-video w-full bg-slate-800/40 grid place-items-center">
        <div
          style={{
            direction: "rtl",
            maxWidth: "90%",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {rendered}
        </div>
      </div>
      <div className="p-2 text-xs text-left text-slate-300">{preset.name}</div>
    </button>
  );
};




  const editorPanelContent = (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
      <div className="p-4 border-b border-slate-800 shrink-0">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
          <Settings className="w-5 h-5 text-blue-400" /> עריכה
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">

        {/* חל על הכל */}
        <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700">
          <Label htmlFor="global-edit-mode" className="text-slate-300 text-sm font-medium">החל על הכל</Label>
          <Switch id="global-edit-mode" checked={isGlobalEditMode} onCheckedChange={setIsGlobalEditMode} />
        </div>

        {/* NEW: Preset gallery */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-400">סגנונות מוכנים</label>

          </div>
          <div className="grid grid-cols-2 gap-3">
            {STYLE_PRESETS.map(p => <StyleCard key={p.id} preset={p} />)}
          </div>
        </div>

        {selectedSubtitle ? (
          <>
            {/* text */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-sm font-medium text-slate-400 block mb-2">ערוך טקסט</label>
              <Textarea
                value={selectedSubtitle.text}
                onChange={(e) => handleTextChange(selectedSubtitleId, e.target.value)}
                className="bg-slate-800 border-slate-700 text-slate-100 text-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {/* font */}
            <div className="space-y-4 pt-3 border-t border-slate-800">
              <div>
                <label className="text-sm font-medium text-slate-400 mb-2 block">פונט</label>
                <Select
                  value={selectedSubtitle.style.fontFamily}
                  onValueChange={(v) => updateSubtitleStyle(selectedSubtitleId, { fontFamily: v })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100 text-sm h-10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 text-slate-100 shadow-2xl border border-slate-700">
                    {TIKTOK_FONTS.map(f => (
                      <SelectItem key={f} value={f} className="text-base py-2 text-slate-100 focus:bg-blue-500/50" style={{ fontFamily: f }}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* size */}
              <div>
                <label className="text-sm font-medium text-slate-400">גודל: {selectedSubtitle.style.fontSize}px</label>
                <Slider
                  value={[selectedSubtitle.style.fontSize]}
                  onValueChange={([v]) => updateSubtitleStyle(selectedSubtitleId, { fontSize: v })}
                  min={20} max={120} step={2}
                  className="mt-2"
                />
              </div>

              {/* color */}
              <div>
                <label className="text-sm font-medium text-slate-400">צבע</label>
                <div className="flex gap-2 flex-wrap pt-2">
                  {POPULAR_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => updateSubtitleStyle(selectedSubtitleId, { color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${selectedSubtitle.style.color?.toLowerCase() === c.toLowerCase() ? 'border-blue-400 ring-2 ring-blue-500/50' : 'border-slate-600'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* highlight word */}
              <div>
                <label className="text-sm font-medium text-slate-400 mb-2 block">הדגשה</label>
                <input
                  type="text"
                  value={highlightedWords[selectedSubtitleId] || ''}
                  onChange={(e) => setHighlightedWords(prev => ({ ...prev, [selectedSubtitleId]: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-blue-500"
                  placeholder="מילה להדגשה..."
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              {/* highlight color */}
              <div>
                <label className="text-sm font-medium text-slate-400 mb-2 block">צבע רקע/הדגשה</label>
                <div className="flex gap-2 flex-wrap pt-1 pb-2">
                  {POPULAR_HIGHLIGHT_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => updateSubtitleStyle(selectedSubtitleId, { highlightColor: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${ (selectedSubtitle?.style?.highlightColor || '#F8FF1C').toLowerCase() === c.toLowerCase() ? 'border-blue-400 ring-2 ring-blue-500/50' : 'border-slate-600' }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={selectedSubtitle?.style?.highlightColor || '#F8FF1C'}
                  onChange={(e) => updateSubtitleStyle(selectedSubtitleId, { highlightColor: e.target.value })}
                  className="w-16 h-10 rounded-md bg-slate-800 border border-slate-700 p-1"
                  aria-label="בחר צבע הדגשה"
                />
              </div>


            </div>
          </>
        ) : (
          <div className="text-center text-slate-500 pt-8">
            <MousePointer className="w-8 h-8 mx-auto mb-2" />
            <h3 className="font-semibold mb-1 text-sm text-slate-300">בחר כתובית</h3>
            <p className="text-xs">לחץ על כתובית בווידאו או ברשימה</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 space-y-3 shrink-0">
        <div className="mb-2">
          <label className="text-sm font-medium text-slate-400 block mb-2">רזולוציה לייצוא</label>
          <Select
            value={`${videoResolution.width}x${videoResolution.height}`}
            onValueChange={(val) => {
              const [w, h] = val.split('x').map(Number);
              setVideoResolution({ width: w, height: h });
            }}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100 text-sm h-10">
              רזולוציה: {videoResolution.width}x{videoResolution.height}
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-slate-100 border-slate-700">
              <SelectItem value="1920x1080" className="focus:bg-blue-500/50">1920x1080 (HD) <span className="text-green-400 ml-1">מומלץ</span></SelectItem>
              <SelectItem value="3840x2160" className="focus:bg-blue-500/50">3840x2160 (4K)</SelectItem>
              <SelectItem value="1080x1920" className="focus:bg-blue-500/50">1080x1920 (ורטיקלי)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={exportSRT} variant="outline" className="text-sm py-2 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"><FileText className="w-4 h-4 ml-1" /> SRT</Button>
          <Button onClick={exportTXT} variant="outline" className="text-sm py-2 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"><FileText className="w-4 h-4 ml-1" /> TXT</Button>
        </div>

        <Button onClick={handleBurnSubtitles} className="w-full bg-blue-600 hover:bg-blue-700 text-sm py-3 rounded-lg font-semibold text-white shadow-lg shadow-blue-600/20" disabled={burning}>
          {burning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 ml-2" />} צרוב והורד וידאו
        </Button>
      </div>
    </div>
  );

  const segmentsListContent = (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
      <div className="p-4 border-b border-slate-800 shrink-0">
        <h2 className="text-lg font-bold text-slate-100">קטעים ({subtitles.length})</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ scrollbarWidth: 'thin' }}>
        {subtitles.map(segment => (
          <div
            key={segment.id}
            onClick={() => handleSegmentClick(segment)}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-150 border-2 ${
              selectedSubtitleId === segment.id
                ? 'bg-blue-600/20 border-blue-500'
                : currentTime >= segment.start && currentTime < segment.end
                  ? 'bg-slate-700/50 border-slate-700'
                  : 'hover:bg-slate-800/50 border-transparent'
            }`}
          >
            <Badge variant="secondary" className="text-xs mb-2 bg-slate-700 text-slate-300">{formatTime(segment.start)}</Badge>
            <p className="text-sm leading-relaxed text-slate-200" dir={isRTL ? 'rtl' : 'ltr'}>{segment.text}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const videoPlayerContent = (
  <div
    className={`video-wrapper${isMobile && activeMobileTab !== 'script' ? ' disable-interaction' : ''}`}
    ref={videoContainerRef}
    onClick={togglePlayPause}
  >
    <video
      ref={videoRef}
      src={transcription?.signed_video_url}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onPlay={handlePlay}
      onPause={handlePause}
      playsInline
    />

    {subtitles
      .filter(sub => currentTime >= sub.start && currentTime < sub.end)
      .map(sub => (
        <SubtitleRenderer
          key={sub.id}
          segment={sub}
          currentTime={currentTime}
          videoContainerRef={videoContainerRef}
          videoResolution={videoResolution}
          isRTL={isRTL}
          highlightedWord={highlightedWords[sub.id]}
          isSelected={sub.id === selectedSubtitleId}

          // גרירה/בחירה
          onMouseDown={(e) => handleMouseDown(e, sub)}
          onTouchStart={(e) => handleTouchStart(e, sub)}
          onClick={(e) => handleSubtitleClick(sub, e)}

          // ✍️ עריכה על הווידאו (דאבל־קליק)
          onDoubleClick={(e) => enterEditMode(sub, e)}

          // ✍️ פרופסי עריכה (textarea בתוך SubtitleRenderer)
          editingMode={editingSubtitleId === sub.id}
          editingText={editingText}
          onEditChange={setEditingText}
          onEditFinish={handleFinishEditing}
          onEditCancel={() => {
            setEditingSubtitleId(null);
            setEditingText('');
          }}
        />
      ))}
  </div>
);


  const DesktopControls = () => (
    <div className="mt-3 select-none" onClick={(e) => e.stopPropagation()}>
      <div className="rounded-2xl bg-gradient-to-b from-slate-900/70 to-slate-900/40 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,.35)]">
        <div className="px-4 pt-3 pb-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-8 px-2 rounded-full" onClick={() => seekBy(-5)} title="חזרה 5ש׳">-5</Button>
            <Button size="sm" variant="ghost" className="h-8 px-2 rounded-full" onClick={() => seekBy(-0.5)} title="חזרה 0.5ש׳">-0.5</Button>
            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30"
              aria-label="Play/Pause"
              onClick={togglePlayPause}
              title="נגן / עצור (Space)"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 px-2 rounded-full" onClick={() => seekBy(0.5)} title="קדימה 0.5ש׳">+0.5</Button>
            <Button size="sm" variant="ghost" className="h-8 px-2 rounded-full" onClick={() => seekBy(5)} title="קדימה 5ש׳">+5</Button>
          </div>

          <div className="ml-2 text-xs tabular-nums text-slate-300">
            {fmtHMS(currentTime)} / {fmtHMS(duration)}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Select value={String(playbackRate)} onValueChange={(v) => setPlaybackRate(Number(v))}>
              <SelectTrigger className="h-8 w-[82px] text-xs rounded-full bg-white/5 border-white/10">
                x{playbackRate}
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-slate-100 border-slate-700">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (<SelectItem key={r} value={String(r)}>x{r}</SelectItem>))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-full"
              aria-label="Mute"
              onClick={() => {
                if (!videoRef.current) return;
                videoRef.current.muted = !videoRef.current.muted;
                setIsMuted(videoRef.current.muted);
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <Slider value={[currentTime]} min={0} max={Math.max(duration, 0.01)} step={0.05} onValueChange={handleSeekChange} className="h-3 [&_[role='slider']]:h-4 [&_[role='slider']]:w-4" />
      </div>
    </div>
  );

  const MobileSegmentsList = () => (
    <div
      className="h-full overflow-y-auto space-y-2 p-3 bg-slate-950"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}
    >
      {subtitles.map(segment => (
        <div
          key={segment.id}
          onClick={() => handleSegmentClick(segment)}
          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 text-sm border-2 ${
            selectedSubtitleId === segment.id
              ? 'bg-blue-600/10 border-blue-500'
              : currentTime >= segment.start && currentTime < segment.end
                ? 'bg-slate-700/50 border-slate-700'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800/70'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">{formatTime(segment.start)}</Badge>
            {currentTime >= segment.start && currentTime < segment.end && (<Badge className="bg-green-500 text-white text-xs">נוכחי</Badge>)}
          </div>
          <p className="text-base leading-relaxed text-slate-200" dir={isRTL ? 'rtl' : 'ltr'}>{segment.text}</p>
        </div>
      ))}
    </div>
  );

  const STYLE_TABS = [
  { key: 'preset', label: 'Preset' },
  { key: 'font', label: 'Font' },
  { key: 'size', label: 'Size' },
  { key: 'color', label: 'Color' },
];


  function MobileStyleEditor() {
    const sub = subtitles.find(s => s.id === selectedSubtitleId);
    if (!sub) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4 bg-slate-950">
          <MousePointer className="w-10 h-10 mb-3" />
          <h3 className="text-lg font-semibold text-slate-200">בחר קטע לעריכה</h3>
          <p className="text-sm">גע בקטע טקסט מהרשימה כדי להתחיל לעצב.</p>
        </div>
      );
    }
    const [styleTab, setStyleTab] = useState('preset');
    return (
      <div
        className="h-full overflow-y-auto p-4 space-y-4 bg-slate-950"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <span className="text-sm text-slate-300">החל על כל הווידאו</span>
          <Switch checked={isGlobalEditMode} onCheckedChange={setIsGlobalEditMode} />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {STYLE_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setStyleTab(t.key)}
              className={`shrink-0 px-3 py-2 rounded-full text-sm border ${styleTab === t.key ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'}`}
              aria-pressed={styleTab === t.key}
            >
              {t.label}
            </button>
          ))}
        </div>

        {styleTab === 'preset' && (
          <div className="grid grid-cols-2 gap-3">
            {STYLE_PRESETS.map(p => <StyleCard key={p.id} preset={p} />)}
          </div>
        )}

        {styleTab === 'font' && (
          <div className="space-y-3">
            <Label className="text-sm text-slate-400">פונט</Label>
            <Select value={sub.style.fontFamily} onValueChange={(v) => updateSubtitleStyle(selectedSubtitleId, { fontFamily: v })}>
              <SelectTrigger className="h-12 bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-slate-100 border-slate-700">
                {TIKTOK_FONTS.map(f => (<SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        )}

        {styleTab === 'size' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-400">גודל טקסט</Label>
              <span className="text-xs text-slate-400">{sub.style.fontSize}px</span>
            </div>
            <Slider value={[sub.style.fontSize]} min={20} max={120} step={2} onValueChange={([v]) => updateSubtitleStyle(selectedSubtitleId, { fontSize: v })} />
          </div>
        )}

        {styleTab === 'color' && (
          <div className="space-y-3">
            <Label className="text-sm text-slate-400">צבע</Label>
            <div className="flex gap-3 flex-wrap">
              {POPULAR_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => updateSubtitleStyle(selectedSubtitleId, { color: c })}
                  className={`w-10 h-10 rounded-full border-2 ${sub.style.color?.toLowerCase() === c.toLowerCase() ? 'border-blue-400' : 'border-slate-700'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}



        <div className="space-y-2 pt-2">
          <Label className="text-sm text-slate-400">ערוך טקסט</Label>
          <Textarea
            value={sub.text}
            onChange={(e) => handleTextChange(selectedSubtitleId, e.target.value)}
            className="bg-slate-800 border-slate-700 text-slate-100 text-base min-h-[100px] rounded-lg"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
      </div>
    );
  }

  const MobileActionsPanel = () => (
    <div
      className="h-full overflow-y-auto p-4 space-y-4 bg-slate-950"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}
    >
      <h3 className="text-xl font-bold text-center text-slate-100 mb-4">ייצוא ושמירה</h3>

      <div className="mb-2">
        <label className="text-base font-medium text-slate-400 block mb-1">רזולוציית וידאו</label>
        <Select
          value={`${videoResolution.width}x${videoResolution.height}`}
          onValueChange={(val) => {
            const [w, h] = val.split('x').map(Number);
            setVideoResolution({ width: w, height: h });
          }}
        >
          <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100 text-base h-12 rounded-lg">
            רזולוציה: {videoResolution.width}x{videoResolution.height}
          </SelectTrigger>
          <SelectContent className="bg-slate-900 text-slate-100 border-slate-700">
            <SelectItem value="1920x1080" className="focus:bg-blue-500/50">
              1920x1080 (HD) <span className="text-green-400 ml-1">מומלץ</span>
            </SelectItem>
            <SelectItem value="3840x2160" className="focus:bg-blue-500/50">3840x2160 (4K)</SelectItem>
            <SelectItem value="1080x1920" className="focus:bg-blue-500/50">1080x1920 (ורטיקלי)</SelectItem>
          </SelectContent>
        </Select>
      </div>



      <div className="grid grid-cols-2 gap-3">
        <Button onClick={exportSRT} variant="outline" className="py-4 text-base rounded-xl border-slate-700 bg-slate-900 hover:bg-slate-800">
          <FileText className="w-4 h-4 ml-2" /> ייצא SRT
        </Button>
        <Button onClick={exportTXT} variant="outline" className="py-4 text-base rounded-xl border-slate-700 bg-slate-900 hover:bg-slate-800">
          <FileText className="w-4 h-4 ml-2" /> ייצא TXT
        </Button>
      </div>

      <Button
        onClick={handleBurnSubtitles}
        className="w-full bg-blue-600 hover:bg-blue-700 py-5 text-lg font-bold rounded-xl text-white shadow-lg shadow-blue-600/20"
        disabled={burning}
      >
        {burning ? <Loader2 className="w-6 h-6 ml-2 animate-spin" /> : <Download className="w-6 h-6 ml-2" />} צרוב והורד וידאו
      </Button>
    </div>
  );

  // ---------- return ----------
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        <Alert variant="destructive">
          <AlertTitle>שגיאה</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );

  return (
    <div className="flex flex-col bg-slate-950 text-slate-100 h-screen overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-2 flex items-center justify-between shrink-0 z-20" style={{ height: '3.5rem' }}>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('Dashboard'))} className="w-8 h-8 hover:bg-slate-800 rounded-md">
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </Button>
          <h1 className="text-sm sm:text-lg font-bold truncate text-slate-200">
            {transcription?.title || 'סטודיו עריכה'}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button onClick={() => handleSave()} disabled={saving} size="sm" className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            <span className="ml-1 hidden sm:inline">שמור</span>
          </Button>
        </div>
      </header>

      {/* Body */}
      {isMobile ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 1) aspect-ratio container */}
          <div
            style={{
              width: '100vw',
              position: 'relative',
              paddingBottom: `${(100 * videoResolution.height) / videoResolution.width}%`,
              background: '#020617',
            }}
          >
            <div style={{ position: 'absolute', inset: 0 }}>
              {videoPlayerContent}
            </div>
          </div>

          {/* Controls */}
          <div className="px-3 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] bg-slate-950">
            <div className="mb-1.5">
              <Slider value={[currentTime]} min={0} max={Math.max(duration, 0.01)} step={0.05} onValueChange={handleSeekChange} className="h-1.5 bg-white/10 rounded-full" aria-label="Seek" />
            </div>

            <div className="flex items-center justify-center gap-4 py-1">
              <Button size="icon" className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10" onClick={() => seekBy(-5)} aria-label="Back 5 seconds">
                <ChevronsLeft className="w-5 h-5" />
              </Button>
              <Button size="icon" className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30" onClick={togglePlayPause} aria-label="Play/Pause">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button size="icon" className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10" onClick={() => seekBy(5)} aria-label="Forward 5 seconds">
                <ChevronsRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="mt-1.5 flex items-center justify-between">
              <div className="text-[11px] tabular-nums text-slate-300">
                {fmtHMS(currentTime)} / {fmtHMS(duration)}
              </div>
              <div className="flex items-center gap-1.5">
                <Select value={String(playbackRate)} onValueChange={(v) => setPlaybackRate(Number(v))}>
                  <SelectTrigger className="h-7 w-[66px] text-[11px] rounded-full bg-white/5 border border-white/10">
                    x{playbackRate}
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-slate-100 border-slate-700">
                    {[0.75, 1, 1.25, 1.5].map((r) => (<SelectItem key={r} value={String(r)}>x{r}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full text-slate-200"
                  onClick={() => {
                    if (!videoRef.current) return;
                    videoRef.current.muted = !videoRef.current.muted;
                    setIsMuted(videoRef.current.muted);
                  }}
                  aria-label={isMuted ? 'בטל השתקה' : 'השתק'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs body */}
          <div className="flex-1 bg-slate-950 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMobileTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                {activeMobileTab === 'script' && <MobileSegmentsList />}
                {activeMobileTab === 'style' && <MobileStyleEditor />}
                {activeMobileTab === 'actions' && <MobileActionsPanel />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom nav */}
          <div className="flex justify-around items-center p-2 bg-slate-900 border-t border-slate-800 shrink-0 rounded-full">
            <Button variant="ghost" onClick={() => setActiveMobileTab('script')} className={`flex flex-col items-center p-1 ${activeMobileTab === 'script' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>
              <FileText className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">קטעים</span>
            </Button>
            <Button variant="ghost" onClick={() => setActiveMobileTab('style')} className={`flex flex-col items-center p-1 ${activeMobileTab === 'style' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>
              <Palette className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">עיצוב</span>
            </Button>
            <Button variant="ghost" onClick={() => setActiveMobileTab('actions')} className={`flex flex-col items-center p-1 ${activeMobileTab === 'actions' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>
              <Share2 className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">פעולות</span>
            </Button>
          </div>
        </div>
      ) : (
<div className="mx-auto w-full" style={{ paddingInline: 16 }}>
  <main
    className="studio-grid grid gap-4 overflow-hidden"
    style={{
      // 👈 פאנלים יחסיים למסך, המרכז תמיד מקבל מרחב
      gridTemplateColumns:
        'clamp(260px,22vw,340px) minmax(560px,1fr) clamp(280px,24vw,360px)',
      height: 'calc(100vh - 3.5rem)',
    }}
  >
    <div className="panel-left flex flex-col overflow-y-auto">{segmentsListContent}</div>
    <div className="flex-1 flex flex-col min-w-0">
      <div className="relative flex-1 min-h-0">{videoPlayerContent}</div>
      <DesktopControls />
    </div>
    <div className="panel-right flex-shrink-0 flex flex-col overflow-y-auto">{editorPanelContent}</div>
  </main>
</div>


      )}
    </div>
  );
}