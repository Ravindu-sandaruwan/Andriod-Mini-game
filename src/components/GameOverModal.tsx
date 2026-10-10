import React, { useEffect } from 'react';
import { RotateCcw, Home, Trophy, Shield, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../audio/SoundManager';

interface GameOverModalProps {
  score: number;
  runCoins: number;
  totalCoins: number;
  highScore: number;
  isNewHighScore: boolean;
  hoverboardsCount: number;
  onRetry: () => void;
  onHome: () => void;
  onReviveWithHoverboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  runCoins,
  totalCoins,
  highScore,
  isNewHighScore,
  hoverboardsCount,
  onRetry,
  onHome,
  onReviveWithHoverboard,
}) => {
  useEffect(() => {
    if (isNewHighScore) {
      soundManager.playVictory();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [isNewHighScore]);

  return (
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-[340px] bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Title */}
        <h2 className="font-game text-3xl font-black italic tracking-wider text-rose-500 drop-shadow-md mb-1">
          GAME OVER
        </h2>
        <p className="text-xs text-slate-400 mb-4 font-medium">Awesome effort on the tracks!</p>

        {/* High Score Badge */}
        {isNewHighScore && (
          <div className="mb-4 flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/50 px-3 py-1 rounded-full text-amber-300 animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-xs font-black uppercase tracking-wider">NEW HIGH SCORE!</span>
          </div>
        )}

        {/* Score Display Card */}
        <div className="w-full bg-slate-950/60 rounded-2xl p-4 border border-slate-800 mb-4 flex flex-col gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Run Score</span>
            <div className="font-game text-3xl font-bold text-white tracking-tight">
              {score.toLocaleString()}
            </div>
          </div>

          <div className="h-px bg-slate-800 w-full" />

          <div className="grid grid-cols-2 gap-2 text-left">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Best Score</span>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                <Trophy className="w-3.5 h-3.5" />
                <span>{highScore.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Coins Gathered</span>
              <div className="flex items-center gap-1 text-yellow-300 font-bold text-sm">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center text-[8px] font-black text-amber-950">
                  ¢
                </div>
                <span>+{runCoins.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revive Option if Hoverboard available */}
        {hoverboardsCount > 0 && (
          <button
            onClick={() => {
              soundManager.playClick();
              onReviveWithHoverboard();
            }}
            className="w-full mb-3 py-3 rounded-2xl bg-cyan-600/30 hover:bg-cyan-600/40 border border-cyan-400/50 text-cyan-200 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 text-xs font-bold"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Revive with Hoverboard ({hoverboardsCount} left)</span>
          </button>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => {
              soundManager.playClick();
              onRetry();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-game text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 border-t border-emerald-300 cursor-pointer transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onHome();
            }}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
