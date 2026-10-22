import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none pointer-events-auto">
      <div className="w-full max-w-sm bg-stone-900 border-2 border-amber-600/60 rounded-2xl p-6 text-center shadow-[0_20px_40px_rgba(0,0,0,0.85)]">
        <h2 className="text-2xl font-black text-amber-400 mb-1 tracking-wider">
          GAME PAUSED
        </h2>
        <p className="text-neutral-400 text-xs mb-6">
          Catch your breath before the ancient traps catch you!
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 font-bold text-base text-amber-950 bg-gradient-to-b from-amber-300 to-amber-500 hover:brightness-110 active:scale-[0.98] rounded-xl shadow-md transition cursor-pointer"
          >
            <Play className="w-5 h-5 fill-amber-950" />
            <span>RESUME RUN</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 font-semibold text-sm text-amber-200 bg-amber-950/60 hover:bg-amber-900/80 active:scale-[0.98] rounded-xl border border-amber-700/40 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 font-semibold text-sm text-neutral-300 bg-stone-800 hover:bg-stone-700 active:scale-[0.98] rounded-xl border border-stone-600/40 transition cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>UNMUTE AUDIO</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>MUTE AUDIO</span>
              </>
            )}
          </button>

          <button
            onClick={onHome}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 font-semibold text-sm text-neutral-400 hover:text-white bg-transparent hover:bg-stone-800 rounded-xl transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>TITLE SCREEN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
