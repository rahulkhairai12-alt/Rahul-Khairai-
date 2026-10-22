import React from 'react';
import {
  Coins,
  Shield,
  Zap,
  Magnet,
  Flame,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ActivePowerUps, PlayerStats } from '../game/types';

interface GameHUDProps {
  stats: PlayerStats;
  activePowerUps: ActivePowerUps;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  activePowerUps,
  isMuted,
  onToggleMute,
  onPause,
}) => {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none p-4 sm:p-6 flex flex-col justify-between select-none">
      {/* Top Bar: Stats Clusters & Quick Actions */}
      <div className="flex items-start justify-between w-full">
        {/* Left Cluster: Score, Coins, Distance */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          {/* Main Score & Multiplier */}
          <div className="flex items-baseline gap-2 bg-black/70 border border-amber-500/40 px-3.5 py-1.5 rounded-lg shadow-md">
            <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
              Score
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-200 tabular-nums font-mono">
              {stats.score.toLocaleString()}
            </span>
            {stats.multiplier > 1 && (
              <span className="text-xs font-black px-1.5 py-0.5 bg-red-600 text-white rounded font-mono">
                {stats.multiplier}X
              </span>
            )}
          </div>

          {/* Sub Row: Coins & Distance */}
          <div className="flex items-center gap-2">
            {/* Coins */}
            <div className="flex items-center gap-1.5 bg-black/70 border border-yellow-500/30 px-2.5 py-1 rounded-md">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-300 tabular-nums font-mono">
                {stats.coins}
              </span>
            </div>

            {/* Distance */}
            <div className="flex items-center gap-1.5 bg-black/70 border border-emerald-500/30 px-2.5 py-1 rounded-md">
              <span className="text-[10px] font-bold text-emerald-400">DIST</span>
              <span className="text-sm font-bold text-emerald-200 tabular-nums font-mono">
                {stats.distance}m
              </span>
            </div>
          </div>
        </div>

        {/* Right Cluster: Control Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 bg-black/70 hover:bg-black/90 border border-amber-600/40 text-amber-300 hover:text-amber-100 rounded-lg transition cursor-pointer shadow-md"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="p-2 bg-black/70 hover:bg-black/90 border border-amber-600/40 text-amber-300 hover:text-amber-100 rounded-lg transition cursor-pointer shadow-md"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Area: Active Power-Up Timers Bar (Compact, Centered) */}
      <div className="flex items-center justify-center gap-2 pointer-events-auto mb-2">
        {/* Mystic Shield Active */}
        {activePowerUps.shield && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/80 border border-cyan-400/80 rounded-lg text-cyan-200 text-xs font-bold shadow-lg">
            <Shield className="w-4 h-4 text-cyan-300 fill-cyan-400/30 animate-pulse" />
            <span>SHIELD ACTIVE</span>
          </div>
        )}

        {/* Speed Boost Active */}
        {activePowerUps.boostTimeLeft > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-950/80 border border-orange-400/80 rounded-lg text-orange-200 text-xs font-bold shadow-lg">
            <Zap className="w-4 h-4 text-orange-400 fill-orange-400 animate-bounce" />
            <span>SPEED BOOST: {activePowerUps.boostTimeLeft.toFixed(1)}s</span>
          </div>
        )}

        {/* Coin Magnet Active */}
        {activePowerUps.magnetTimeLeft > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/80 border border-red-400/80 rounded-lg text-red-200 text-xs font-bold shadow-lg">
            <Magnet className="w-4 h-4 text-red-400 fill-red-400" />
            <span>COIN MAGNET: {activePowerUps.magnetTimeLeft.toFixed(1)}s</span>
          </div>
        )}

        {/* Multiplier Active */}
        {activePowerUps.multiplierTimeLeft > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/80 border border-amber-400/80 rounded-lg text-amber-200 text-xs font-bold shadow-lg">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>2X MULTIPLIER: {activePowerUps.multiplierTimeLeft.toFixed(1)}s</span>
          </div>
        )}
      </div>
    </div>
  );
};
