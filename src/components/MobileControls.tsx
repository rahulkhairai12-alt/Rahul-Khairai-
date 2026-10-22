import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface MobileControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onJump: () => void;
  onSlide: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onLeft,
  onRight,
  onJump,
  onSlide,
}) => {
  return (
    <div className="absolute inset-x-0 bottom-4 z-20 pointer-events-none flex justify-between px-4 sm:hidden select-none">
      {/* Left / Right Steering Buttons */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          onClick={onLeft}
          aria-label="Move Left"
          className="w-14 h-14 bg-black/60 active:bg-amber-600/60 border border-amber-500/50 rounded-2xl flex items-center justify-center text-amber-300 active:scale-95 transition-all shadow-lg"
        >
          <ArrowLeft className="w-7 h-7" />
        </button>
        <button
          onClick={onRight}
          aria-label="Move Right"
          className="w-14 h-14 bg-black/60 active:bg-amber-600/60 border border-amber-500/50 rounded-2xl flex items-center justify-center text-amber-300 active:scale-95 transition-all shadow-lg"
        >
          <ArrowRight className="w-7 h-7" />
        </button>
      </div>

      {/* Jump / Slide Buttons */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          onClick={onSlide}
          aria-label="Slide"
          className="w-14 h-14 bg-black/60 active:bg-amber-600/60 border border-amber-500/50 rounded-2xl flex items-center justify-center text-amber-300 active:scale-95 transition-all shadow-lg"
        >
          <ArrowDown className="w-7 h-7" />
        </button>
        <button
          onClick={onJump}
          aria-label="Jump"
          className="w-14 h-14 bg-amber-500/80 active:bg-amber-400 border border-amber-300 rounded-2xl flex items-center justify-center text-amber-950 font-black active:scale-95 transition-all shadow-lg"
        >
          <ArrowUp className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};
