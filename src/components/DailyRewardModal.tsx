import React from 'react';
import { X, Gift, Check, Shield, Sparkles } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';
import confetti from 'canvas-confetti';

interface DailyRewardModalProps {
  streak: number;
  canClaimToday: boolean;
  onClaim: () => void;
  onClose: () => void;
}

const DAILY_REWARDS = [
  { day: 1, type: 'coins', amount: 250, label: '250 Coins' },
  { day: 2, type: 'hoverboard', amount: 1, label: '1x Board' },
  { day: 3, type: 'coins', amount: 500, label: '500 Coins' },
  { day: 4, type: 'hoverboard', amount: 2, label: '2x Boards' },
  { day: 5, type: 'coins', amount: 1000, label: '1,000 Coins' },
  { day: 6, type: 'hoverboard', amount: 3, label: '3x Boards' },
  { day: 7, type: 'mega', amount: 2500, label: '2,500 Coins + 5 Boards' },
];

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  streak,
  canClaimToday,
  onClaim,
  onClose,
}) => {
  const currentDayIndex = streak % 7;

  const handleClaim = () => {
    soundManager.playVictory();
    confetti({ particleCount: 70, spread: 60 });
    onClaim();
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col p-4 select-none animate-in fade-in duration-150 pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="font-game text-2xl font-black italic tracking-wide text-white flex items-center gap-2">
            DAILY REWARDS
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-[11px] text-slate-400">Log in daily to claim epic prizes</p>
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Rewards Grid */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
          {DAILY_REWARDS.slice(0, 6).map((item, idx) => {
            const isCompleted = idx < currentDayIndex || (idx === currentDayIndex && !canClaimToday);
            const isCurrent = idx === currentDayIndex && canClaimToday;

            return (
              <div
                key={item.day}
                className={`p-3 rounded-2xl border flex flex-col items-center text-center transition-all ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                    : isCompleted
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Day {item.day}</span>
                  {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>

                <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center mb-2">
                  {item.type === 'coins' ? (
                    <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-xs font-black text-amber-950">
                      ¢
                    </div>
                  ) : (
                    <Shield className="w-5 h-5 text-cyan-400" />
                  )}
                </div>

                <span className="font-game text-xs font-bold text-white mb-0.5">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Day 7 Mega Reward Banner */}
        {(() => {
          const item = DAILY_REWARDS[6];
          const isCompleted = currentDayIndex === 0 && !canClaimToday && streak >= 7;
          const isCurrent = currentDayIndex === 6 && canClaimToday;

          return (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                isCurrent
                  ? 'bg-gradient-to-r from-amber-500/30 to-rose-500/30 border-amber-400 ring-2 ring-amber-400/50 shadow-xl'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-amber-300 uppercase">Day 7 Grand Jackpot</span>
                    {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <h4 className="font-game text-sm font-bold text-white">{item.label}</h4>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Claim Button */}
      <div className="pt-3 border-t border-slate-800">
        <button
          onClick={handleClaim}
          disabled={!canClaimToday}
          className={`w-full py-3.5 rounded-2xl font-game text-base font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            canClaimToday
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-amber-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          <Gift className="w-5 h-5" />
          <span>{canClaimToday ? 'CLAIM TODAY’S REWARD' : 'ALREADY CLAIMED (COME BACK TOMORROW)'}</span>
        </button>
      </div>
    </div>
  );
};
