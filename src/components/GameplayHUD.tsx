import React, { useRef, useEffect } from 'react';
import { Pause, Zap, Magnet, Rocket, Sparkles, Shield, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { PowerUpState } from '../types/game';
import { soundManager } from '../audio/SoundManager';

interface GameplayHUDProps {
  score: number;
  multiplier: number;
  coins: number;
  powerups: PowerUpState[];
  hoverboardsCount: number;
  isHoverboardActive: boolean;
  onPause: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
  onActivateHoverboard: () => void;
}

export const GameplayHUD: React.FC<GameplayHUDProps> = ({
  score,
  multiplier,
  coins,
  powerups,
  hoverboardsCount,
  isHoverboardActive,
  onPause,
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
  onActivateHoverboard,
}) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  // Keyboard navigation listener (A/D/W/S/Arrow keys, Space, Q/E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          onMoveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          onMoveRight();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          onJump();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          onSlide();
          break;
        case 'q':
        case 'Q':
        case 'e':
        case 'E':
        case 'h':
        case 'H':
          onActivateHoverboard();
          break;
        case 'Escape':
        case 'p':
        case 'P':
          onPause();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMoveLeft, onMoveRight, onJump, onSlide, onActivateHoverboard, onPause]);

  // Touch Swipe & Double Tap Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();

    // Check double tap for hoverboard
    if (now - lastTapTimeRef.current < 280) {
      onActivateHoverboard();
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = now;
    }

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const swipeThreshold = 22; // px

    if (Math.max(absX, absY) > swipeThreshold) {
      if (absX > absY) {
        // Horizontal swipe
        if (dx > 0) {
          onMoveRight();
        } else {
          onMoveLeft();
        }
      } else {
        // Vertical swipe
        if (dy > 0) {
          onSlide();
        } else {
          onJump();
        }
      }
    }
    touchStartRef.current = null;
  };

  const getPowerUpIcon = (type: string) => {
    switch (type) {
      case 'jetpack':
        return <Rocket className="w-3.5 h-3.5 text-orange-400" />;
      case 'magnet':
        return <Magnet className="w-3.5 h-3.5 text-rose-400" />;
      case 'multiplier':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'sneakers':
        return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
      case 'hoverboard':
        return <Shield className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div
      className="absolute inset-0 z-30 pointer-events-auto flex flex-col justify-between p-3 select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top HUD Bar */}
      <div className="flex items-start justify-between w-full pointer-events-none">
        {/* Left: Score & Multiplier */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-2xl border border-white/10 shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Score</span>
            <span className="font-game text-xl font-bold tracking-tight text-white drop-shadow-sm">
              {score.toLocaleString()}
            </span>
            {multiplier > 1 && (
              <span className="ml-1 text-[11px] font-black text-amber-300 animate-pulse bg-amber-500/30 px-1.5 py-0.2 rounded-md border border-amber-400/40">
                x{multiplier}
              </span>
            )}
          </div>

          {/* Coins Counter */}
          <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-amber-400/30 shadow-md w-fit">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-xs border border-amber-200">
              <span className="text-[9px] font-black text-amber-950">¢</span>
            </div>
            <span className="font-game text-sm font-bold text-amber-300 drop-shadow-xs">
              {coins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Right: Pause Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            soundManager.playClick();
            onPause();
          }}
          className="pointer-events-auto w-10 h-10 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform cursor-pointer hover:bg-slate-800"
          title="Pause Game"
        >
          <Pause className="w-5 h-5 fill-white" />
        </button>
      </div>

      {/* Left Center: Active Power-up Timers */}
      <div className="flex flex-col gap-1.5 w-32 pointer-events-none">
        {powerups.map((p) => {
          const pct = Math.max(0, Math.min(100, (p.remaining / p.duration) * 100));
          return (
            <div
              key={p.type}
              className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded-xl border border-white/10 shadow-lg text-[10px] text-white"
            >
              {getPowerUpIcon(p.type)}
              <div className="flex-1 flex flex-col gap-0.5">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-slate-300">
                  <span>{p.type}</span>
                  <span>{Math.ceil(p.remaining)}s</span>
                </div>
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-100"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Area: Hoverboard Summon Button & Mobile Assist Controls */}
      <div className="w-full flex items-end justify-between pointer-events-none">
        {/* Hoverboard Quick Action Pill */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onActivateHoverboard();
          }}
          disabled={isHoverboardActive || hoverboardsCount <= 0}
          className={`pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-2xl backdrop-blur-md border shadow-xl transition-all cursor-pointer active:scale-95 ${
            isHoverboardActive
              ? 'bg-cyan-500/40 border-cyan-300 text-cyan-200 ring-2 ring-cyan-400/50'
              : hoverboardsCount > 0
              ? 'bg-gradient-to-r from-blue-600/90 to-cyan-600/90 hover:from-blue-500 hover:to-cyan-500 border-cyan-400/50 text-white'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 opacity-60 cursor-not-allowed'
          }`}
          title="Double tap or click to activate Hoverboard"
        >
          <div className="w-7 h-7 rounded-lg bg-black/40 flex items-center justify-center">
            <Shield className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black uppercase tracking-wider">
              {isHoverboardActive ? 'ACTIVE' : 'HOVERBOARD'}
            </span>
            <span className="text-[9px] text-cyan-200 font-medium">
              {hoverboardsCount > 0 ? `${hoverboardsCount} Left (2x Tap)` : '0 Left (Shop)'}
            </span>
          </div>
        </button>

        {/* On-screen Directional Touch Controls for mobile/mouse playability */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveLeft();
            }}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Move Left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJump();
              }}
              className="w-9 h-8 rounded-xl bg-amber-500/40 hover:bg-amber-500/60 active:scale-90 text-amber-200 flex items-center justify-center transition-all cursor-pointer"
              title="Jump"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSlide();
              }}
              className="w-9 h-8 rounded-xl bg-cyan-500/40 hover:bg-cyan-500/60 active:scale-90 text-cyan-200 flex items-center justify-center transition-all cursor-pointer"
              title="Slide / Roll"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveRight();
            }}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Move Right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
