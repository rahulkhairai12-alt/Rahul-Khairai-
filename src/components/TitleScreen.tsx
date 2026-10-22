import React from 'react';
import { Volume2, VolumeX, Trophy, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  highScore: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  highScore,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 sm:p-10 select-none bg-radial from-transparent via-black/30 to-black/75 pointer-events-auto">
      {/* Top Header info */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/80 border border-amber-600/50 rounded-lg text-amber-300 text-xs sm:text-sm font-semibold tracking-wider shadow-lg">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>BEST RUN:</span>
          <span className="font-mono text-amber-200 tabular-nums">
            {highScore.toLocaleString()}
          </span>
        </div>

        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="flex items-center gap-2 px-3 py-1.5 bg-black/60 hover:bg-black/80 border border-emerald-600/40 text-emerald-300 hover:text-emerald-100 rounded-lg text-xs transition cursor-pointer"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-rose-400" />
              <span>MUTED</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>SOUND ON</span>
            </>
          )}
        </button>
      </div>

      {/* Hero Title Lockup & Emblem */}
      <div className="flex flex-col items-center justify-center my-auto text-center px-4">
        {/* Bespoke Ancient Aztec/Mayan Stone Title Lockup */}
        <div className="relative mb-3">
          <svg
            className="w-72 sm:w-96 md:w-[480px] h-auto filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
            viewBox="0 0 500 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer carved plaque */}
            <path
              d="M30 20 L250 8 L470 20 L490 65 L470 110 L250 122 L30 110 L10 65 Z"
              fill="#241b10"
              stroke="#8a6128"
              strokeWidth="4"
            />
            {/* Inner gold border */}
            <path
              d="M45 28 L250 18 L455 28 L472 65 L455 102 L250 112 L45 102 L28 65 Z"
              fill="#18130a"
              stroke="#d49b25"
              strokeWidth="2"
              strokeDasharray="8 4"
            />
            {/* Ancient corner notches */}
            <rect x="55" y="36" width="12" height="12" fill="#e5a93b" />
            <rect x="433" y="36" width="12" height="12" fill="#e5a93b" />
            <rect x="55" y="82" width="12" height="12" fill="#e5a93b" />
            <rect x="433" y="82" width="12" height="12" fill="#e5a93b" />

            {/* Stylized Carved Title Text */}
            <text
              x="250"
              y="60"
              textAnchor="middle"
              fill="#ffd700"
              fontSize="34"
              fontWeight="900"
              fontFamily="Impact, sans-serif"
              letterSpacing="4"
              stroke="#54370d"
              strokeWidth="2"
            >
              TEMPLE ESCAPE
            </text>
            <text
              x="250"
              y="92"
              textAnchor="middle"
              fill="#a3e635"
              fontSize="16"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="6"
            >
              JUNGLE RUNNER 3D
            </text>
          </svg>
        </div>

        <p className="text-emerald-200/90 text-sm sm:text-base max-w-md mx-auto mb-6 text-shadow">
          Dash through ancient ruins, dodge deadly traps, gather golden coins, and beware of crying face plants!
        </p>

        {/* Start Game CTA */}
        <button
          data-start="true"
          onClick={onStart}
          className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-lg sm:text-xl text-amber-950 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 rounded-xl shadow-[0_6px_0_#78350f,0_15px_30px_rgba(0,0,0,0.7)] hover:brightness-110 active:translate-y-1 active:shadow-[0_2px_0_#78350f] transition-all cursor-pointer border border-amber-200"
        >
          <Sparkles className="w-6 h-6 mr-3 text-amber-950 animate-bounce" />
          <span>RUN FOR YOUR LIFE!</span>
        </button>

        <p className="text-amber-400/80 text-xs font-semibold mt-3">
          Press <kbd className="px-2 py-0.5 bg-black/60 rounded border border-amber-500/40 text-amber-200">SPACE</kbd> or <kbd className="px-2 py-0.5 bg-black/60 rounded border border-amber-500/40 text-amber-200">ENTER</kbd> to start
        </p>
      </div>

      {/* Flat Control Hints */}
      <div className="w-full text-center">
        <p className="text-neutral-400 text-xs sm:text-sm font-medium tracking-wide">
          <span className="text-amber-400">A / D or ← / →</span> Change Lane ·{' '}
          <span className="text-amber-400">W / ↑ / Space</span> Jump ·{' '}
          <span className="text-amber-400">S / ↓</span> Slide ·{' '}
          <span className="text-amber-400">Esc / P</span> Pause
        </p>
      </div>
    </div>
  );
};
