import React from "react";
import { Button } from "./ui/button";
import { Save } from "lucide-react";
import { Textarea } from "./ui/textarea";

export const SRTEditor = ({ srtBlocks, onUpdateBlock, onSave, isSaving }) => {
  return (
    <div>
      {srtBlocks.map((block, i) => (
        <div key={i} className="mb-4">
          <div className="text-xs text-gray-500 mb-1">
            {block.start} → {block.end}
          </div>
          <Textarea
            rows={2}
            value={block.text}
            onChange={(e) => onUpdateBlock(i, e.target.value)}
          />
        </div>
      ))}

      <div className="text-end mt-2">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? "שומר..." : <><Save className="w-4 h-4 ml-1" /> שמור</>}
        </Button>
      </div>
    </div>
  );
};
