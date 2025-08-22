import React from 'react';
import { Button } from '@/components/ui/button';
import { Palette, Zap, X } from 'lucide-react';
import AdvancedFontSelector from './AdvancedFontSelector';
import EffectsPanel from './EffectsPanel';

export default function EditorPanel({
  activeTab,
  setActiveTab,
  selectedSegment,
  updateSegmentStyle,
  onClose,
}) {
  return (
    <div className="bg-gray-900/80 backdrop-blur-xl h-full flex flex-col text-white">
      <div className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <h2 className="text-lg font-semibold">אפשרויות עריכה</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="xl:hidden text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
      <div className="flex-grow overflow-y-auto">
        {selectedSegment ? (
          <div className="p-4">
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1 mb-4">
              <Button
                onClick={() => setActiveTab('style')}
                variant={activeTab === 'style' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1 data-[state=active]:bg-purple-600"
              >
                <Palette className="w-4 h-4 mr-1" />
                סגנון
              </Button>
              <Button
                onClick={() => setActiveTab('effects')}
                variant={activeTab === 'effects' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1 data-[state=active]:bg-purple-600"
              >
                <Zap className="w-4 h-4 mr-1" />
                אפקטים
              </Button>
            </div>
            {activeTab === 'style' && (
              <AdvancedFontSelector
                selectedSegment={selectedSegment}
                onStyleChange={(style) => updateSegmentStyle(selectedSegment.id, style)}
              />
            )}
            {activeTab === 'effects' && (
              <EffectsPanel
                selectedSegment={selectedSegment}
                onEffectChange={(effect) => updateSegmentStyle(selectedSegment.id, effect)}
              />
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 p-10 flex flex-col items-center justify-center h-full">
            <Palette className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="font-semibold text-lg">בחר קטע לעריכה</h3>
            <p className="text-sm">לחץ על כתובית בציר הזמן או ברשימה כדי להתחיל.</p>
          </div>
        )}
      </div>
    </div>
  );
}