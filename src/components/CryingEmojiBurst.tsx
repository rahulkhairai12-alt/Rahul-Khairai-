import React, { useEffect, useState } from 'react';

interface CryingEmojiBurstProps {
  quote: string;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  rot: number;
}

export const CryingEmojiBurst: React.FC<CryingEmojiBurstProps> = ({ quote }) => {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);

  useEffect(() => {
    const list: FloatingEmoji[] = [];
    const pool = ['😭', '😢', '😿', '💧', '🌧️', '🥺', '😭'];

    for (let i = 0; i < 22; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 60 + Math.random() * 140;
      list.push({
        id: i,
        emoji: pool[Math.floor(Math.random() * pool.length)],
        x: 50 + (Math.random() - 0.5) * 16,
        y: 50 + (Math.random() - 0.5) * 16,
        size: 28 + Math.random() * 32,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60, // float upwards
        rot: (Math.random() - 0.5) * 60,
      });
    }

    setEmojis(list);

    const timer = setTimeout(() => {
      setShowSpeechBubble(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden select-none">
      {/* Floating Animated Crying Emojis */}
      {emojis.map((item) => (
        <div
          key={item.id}
          className="absolute animate-out fade-out fill-mode-forwards duration-1000 transition-transform"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            fontSize: `${item.size}px`,
            transform: `translate(${item.vx * 0.8}px, ${item.vy * 0.8}px) rotate(${item.rot}deg)`,
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
          }}
        >
          {item.emoji}
        </div>
      ))}

      {/* Comic Sobbing Banner */}
      {showSpeechBubble && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-amber-100 text-amber-950 font-black text-base sm:text-xl px-6 py-3 rounded-2xl border-4 border-amber-800 shadow-[0_12px_24px_rgba(0,0,0,0.8)] animate-bounce text-center max-w-sm sm:max-w-md">
            <div className="text-2xl sm:text-3xl mb-1">😭😭😭</div>
            "{quote}"
          </div>
          {/* Comic speech bubble tail */}
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[14px] border-t-amber-800 mt-[-2px]"></div>
        </div>
      )}
    </div>
  );
};
