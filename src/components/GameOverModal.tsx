import React, { useEffect } from 'react';
import { GameOverDetails } from '../game/types';
import { RotateCcw, Home, Trophy, Coins, Footprints } from 'lucide-react';

interface GameOverModalProps {
  details: GameOverDetails;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  details,
  onRestart,
  onHome,
}) => {
  // Bind Enter and Space to Restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-md bg-stone-900 border-2 border-amber-600/70 rounded-2xl p-6 sm:p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
        {/* Ancient corner accents */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

        {/* Crying Header */}
        <div className="flex flex-col items-center mb-4">
          <div className="text-5xl sm:text-6xl animate-bounce mb-2">😭</div>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-wider font-mono">
            WIPEOUT!
          </h2>
          <p className="text-amber-200/90 text-sm italic mt-1 px-4">
            "{details.quote}"
          </p>
        </div>

        {/* New Record Banner */}
        {details.isNewRecord && (
          <div className="flex items-center justify-center gap-2 py-1.5 px-3 mb-4 bg-amber-500/20 border border-amber-400 text-amber-300 font-bold text-xs rounded-lg animate-pulse">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>NEW BEST RECORD!</span>
          </div>
        )}

        {/* Run Statistics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          {/* Final Score */}
          <div className="col-span-2 bg-stone-950/80 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400">FINAL SCORE</span>
            <span className="text-2xl font-black text-amber-300 font-mono tabular-nums">
              {details.score.toLocaleString()}
            </span>
          </div>

          {/* Distance */}
          <div className="bg-stone-950/80 border border-emerald-500/30 p-2.5 rounded-xl flex items-center gap-2.5">
            <Footprints className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-neutral-400">DISTANCE</div>
              <div className="text-base font-bold text-emerald-200 font-mono tabular-nums">
                {details.distance}m
              </div>
            </div>
          </div>

          {/* Coins */}
          <div className="bg-stone-950/80 border border-yellow-500/30 p-2.5 rounded-xl flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-neutral-400">GOLD COINS</div>
              <div className="text-base font-bold text-yellow-300 font-mono tabular-nums">
                {details.coins}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 font-bold text-base text-amber-950 bg-gradient-to-b from-amber-300 to-amber-500 hover:brightness-110 active:scale-[0.98] rounded-xl shadow-[0_4px_0_#78350f] transition-all cursor-pointer border border-amber-200"
          >
            <RotateCcw className="w-5 h-5" />
            <span>DRY TEARS & RUN AGAIN!</span>
          </button>

          <button
            onClick={onHome}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 font-semibold text-sm text-neutral-300 hover:text-white bg-stone-800 hover:bg-stone-700 active:scale-[0.98] rounded-xl transition cursor-pointer border border-stone-600/50"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
