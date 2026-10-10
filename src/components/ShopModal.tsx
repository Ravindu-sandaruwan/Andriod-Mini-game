import React, { useState } from 'react';
import { X, Rocket, Magnet, Sparkles, Zap, Shield, Box, Check } from 'lucide-react';
import { UpgradeLevels, PowerUpType } from '../types/game';
import { soundManager } from '../audio/SoundManager';
import confetti from 'canvas-confetti';

interface ShopModalProps {
  coins: number;
  upgrades: UpgradeLevels;
  hoverboardsCount: number;
  onUpgrade: (type: keyof UpgradeLevels, cost: number) => void;
  onBuyHoverboards: (amount: number, cost: number) => void;
  onOpenMysteryBox: (cost: number) => { rewardType: string; amount: number };
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  coins,
  upgrades,
  hoverboardsCount,
  onUpgrade,
  onBuyHoverboards,
  onOpenMysteryBox,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'upgrades' | 'boards' | 'mystery'>('upgrades');
  const [mysteryResult, setMysteryResult] = useState<{ rewardType: string; amount: number } | null>(null);

  const UPGRADE_COSTS: Record<number, number> = {
    1: 500,
    2: 1000,
    3: 2000,
    4: 4000,
  };

  const powerUpItems: {
    key: keyof UpgradeLevels;
    type: PowerUpType;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'jetpack',
      type: 'jetpack',
      title: 'Jetpack Boost',
      desc: 'Extend high altitude flight time and rocket coin heaven duration',
      icon: <Rocket className="w-5 h-5 text-orange-400" />,
    },
    {
      key: 'magnet',
      type: 'magnet',
      title: 'Coin Magnet',
      desc: 'Attract all golden coins across all lanes automatically for longer',
      icon: <Magnet className="w-5 h-5 text-rose-400" />,
    },
    {
      key: 'multiplier',
      type: 'multiplier',
      title: 'Score Multiplier',
      desc: 'Double your score accumulation speed for extended durations',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    },
    {
      key: 'sneakers',
      type: 'sneakers',
      title: 'Super Sneakers',
      desc: 'Bounce over trains and obstacles with high-spring jump boots',
      icon: <Zap className="w-5 h-5 text-emerald-400" />,
    },
  ];

  const handleMystery = () => {
    if (coins < 500) return;
    soundManager.playPowerup();
    const result = onOpenMysteryBox(500);
    setMysteryResult(result);
    confetti({ particleCount: 50, spread: 50 });
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col p-4 select-none animate-in fade-in duration-150 pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="font-game text-2xl font-black italic tracking-wide text-white">
            PRO SHOP
          </h2>
          <p className="text-[11px] text-slate-400">Power-ups & gear supplies</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Coins badge */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-amber-400/30">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center text-[8px] font-black text-amber-950">
              ¢
            </div>
            <span className="font-game text-xs font-bold text-amber-300">
              {coins.toLocaleString()}
            </span>
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
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl my-3 border border-slate-800">
        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab('upgrades');
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'upgrades' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Upgrades
        </button>
        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab('boards');
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'boards' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Hoverboards ({hoverboardsCount})
        </button>
        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab('mystery');
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'mystery' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Mystery Box
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {activeTab === 'upgrades' && (
          <>
            {powerUpItems.map((item) => {
              const currentLvl = upgrades[item.key];
              const isMax = currentLvl >= 5;
              const cost = UPGRADE_COSTS[currentLvl] || 5000;
              const canAfford = coins >= cost;

              return (
                <div
                  key={item.key}
                  className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-tight mb-1.5">{item.desc}</p>
                      {/* Level Indicator pips */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`w-3.5 h-1.5 rounded-sm ${
                              lvl <= currentLvl ? 'bg-cyan-400 shadow-xs' : 'bg-slate-800'
                            }`}
                          />
                        ))}
                        <span className="text-[9px] text-slate-400 ml-1 font-semibold">
                          Lv.{currentLvl}/5
                        </span>
                      </div>
                    </div>
                  </div>

                  {isMax ? (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> MAX
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onUpgrade(item.key, cost);
                      }}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 active:scale-95 shadow-md shadow-amber-500/10'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {cost.toLocaleString()} ¢
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}

        {activeTab === 'boards' && (
          <div className="space-y-3">
            <div className="bg-slate-900/60 rounded-2xl p-3 border border-cyan-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white">Crash Shield Protection</h4>
                <p className="text-[10px] text-slate-400">
                  Double tap anywhere during a run to surf on your hoverboard. Absorbs one fatal crash!
                </p>
              </div>
            </div>

            {/* Board Packs */}
            {[
              { amount: 1, cost: 300, label: 'Single Board' },
              { amount: 3, cost: 800, label: '3x Board Trio', popular: true },
              { amount: 10, cost: 2400, label: '10x Mega Crate' },
            ].map((pack) => {
              const canAfford = coins >= pack.cost;
              return (
                <div
                  key={pack.amount}
                  className={`bg-slate-900/80 rounded-2xl p-3.5 border flex items-center justify-between ${
                    pack.popular ? 'border-cyan-400/60 ring-1 ring-cyan-400/20' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 font-game font-bold text-sm">
                      {pack.amount}x
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white">{pack.label}</h4>
                        {pack.popular && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-semibold">
                            Best Value
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Adds {pack.amount} {pack.amount === 1 ? 'board' : 'boards'} to inventory
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onBuyHoverboards(pack.amount, pack.cost);
                    }}
                    disabled={!canAfford}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 active:scale-95 shadow-md shadow-amber-500/10'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {pack.cost.toLocaleString()} ¢
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'mystery' && (
          <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-900/80 rounded-2xl border border-slate-800">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-3 animate-pulse">
              <Box className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-game text-lg font-bold text-white mb-1">Lucky Mystery Crate</h3>
            <p className="text-xs text-slate-400 max-w-xs mb-4">
              Open to reveal surprise coin jackpots (up to 2,500 coins) or free hoverboards!
            </p>

            {mysteryResult && (
              <div className="mb-4 p-3 bg-purple-500/20 border border-purple-400/40 rounded-xl text-xs text-purple-200 font-bold animate-in zoom-in-95">
                🎉 Won: {mysteryResult.amount}{' '}
                {mysteryResult.rewardType === 'coins' ? 'Golden Coins' : 'Hoverboards'}!
              </div>
            )}

            <button
              onClick={handleMystery}
              disabled={coins < 500}
              className={`px-6 py-2.5 rounded-xl font-game text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
                coins >= 500
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white active:scale-95 shadow-lg shadow-purple-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>OPEN CRATE (500 ¢)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
