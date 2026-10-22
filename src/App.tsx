import { useEffect, useRef, useState, useCallback } from 'react';
import { Engine3D } from './game/Engine3D';
import { ActivePowerUps, GameOverDetails, GameState, PlayerStats } from './game/types';
import { sounds } from './game/audio';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { CryingEmojiBurst } from './components/CryingEmojiBurst';
import { MobileControls } from './components/MobileControls';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine3D | null>(null);

  const [gameState, setGameState] = useState<GameState>('title');
  const [stats, setStats] = useState<PlayerStats>({
    score: 0,
    coins: 0,
    distance: 0,
    highScore: 0,
    multiplier: 1,
  });
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUps>({
    shield: false,
    boostTimeLeft: 0,
    magnetTimeLeft: 0,
    multiplierTimeLeft: 0,
  });
  const [gameOverDetails, setGameOverDetails] = useState<GameOverDetails | null>(null);
  const [cryingQuote, setCryingQuote] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.getMuted());

  // Initialize Three.js Engine
  useEffect(() => {
    if (!mountRef.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const autostart = urlParams.get('autostart') === '1';

    const engine = new Engine3D(mountRef.current, {
      onStatsUpdate: (newStats, newPowerUps) => {
        setStats(newStats);
        setActivePowerUps(newPowerUps);
      },
      onGameOver: (details) => {
        setGameOverDetails(details);
      },
      onStateChange: (state) => {
        setGameState(state);
      },
      onPowerUpCollected: () => {
        // powerup pickup feedback handled in engine
      },
      onCryingEmojiBurst: (quote) => {
        setCryingQuote(quote);
      },
    });

    engineRef.current = engine;
    engine.start();

    if (autostart) {
      engine.startGame();
    }

    // Touch Swipe handling on mobile
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) > 30) {
        if (absDx > absDy) {
          if (dx > 0) engine.moveRight();
          else engine.moveLeft();
        } else {
          if (dy < 0) engine.jump();
          else engine.slide();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = useCallback(() => {
    setCryingQuote(null);
    setGameOverDetails(null);
    engineRef.current?.startGame();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pauseGame();
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resumeGame();
  }, []);

  const handleHome = useCallback(() => {
    setCryingQuote(null);
    setGameOverDetails(null);
    engineRef.current?.returnToTitle();
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleLeft = useCallback(() => {
    engineRef.current?.moveLeft();
  }, []);

  const handleRight = useCallback(() => {
    engineRef.current?.moveRight();
  }, []);

  const handleJump = useCallback(() => {
    engineRef.current?.jump();
  }, []);

  const handleSlide = useCallback(() => {
    engineRef.current?.slide();
  }, []);

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none"
      data-state={gameState}
    >
      {/* Isolated WebGL Mount Point */}
      <div
        ref={mountRef}
        data-testid="threejs-canvas-container"
        className="absolute inset-0 w-full h-full z-0"
      />

      {/* Screen Views / Modals */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          highScore={stats.highScore}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {(gameState === 'playing' || gameState === 'paused') && (
        <>
          <GameHUD
            stats={stats}
            activePowerUps={activePowerUps}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={handlePause}
          />
          <MobileControls
            onLeft={handleLeft}
            onRight={handleRight}
            onJump={handleJump}
            onSlide={handleSlide}
          />
        </>
      )}

      {/* Crying Emoji Burst Overlay (Triggers on wipeout) */}
      {cryingQuote && <CryingEmojiBurst quote={cryingQuote} />}

      {/* Game Over Modal */}
      {gameState === 'gameover' && gameOverDetails && (
        <GameOverModal
          details={gameOverDetails}
          onRestart={handleStartGame}
          onHome={handleHome}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleStartGame}
          onHome={handleHome}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}
    </main>
  );
}
