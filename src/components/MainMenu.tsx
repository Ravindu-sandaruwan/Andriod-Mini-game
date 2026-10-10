import React from 'react';
import { Play, Users, ShoppingBag, Gift, Settings, Trophy, Shield } from 'lucide-react';
import { CharacterConfig } from '../types/game';
import { soundManager } from '../audio/SoundManager';

interface MainMenuProps {
  highScore: number;
  coins: number;
  hoverboardsCount: number;
  selectedCharacter: CharacterConfig;
  onPlay: () => void;
  onOpenCharacters: () => void;
  onOpenShop: () => void;
  onOpenDailyRewards: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  highScore,
  coins,
  hoverboardsCount,
  selectedCharacter,
  onPlay,
  onOpenCharacters,
  onOpenShop,
  onOpenDailyRewards,
  onOpenSettings,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 bg-gradient-to-b from-black/50 via-transparent to-black/80 select-none pointer-events-auto">
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full">
        {/* High Score Trophy */}
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-500/30 shadow-lg">
          <Trophy className="w-4 h-4 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">High Score</span>
            <span className="font-game text-sm font-bold text-white">
              {highScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Currency & Hoverboards */}
        <div className="flex items-center gap-2">
          {/* Coins */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-400/40 shadow-lg">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center border border-amber-200">
              <span className="text-[9px] font-black text-amber-950">¢</span>
            </div>
            <span className="font-game text-sm font-bold text-amber-300">
              {coins.toLocaleString()}
            </span>
          </div>

          {/* Hoverboard count */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-cyan-400/40 shadow-lg">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-game text-sm font-bold text-cyan-300">{hoverboardsCount}</span>
          </div>
        </div>
      </div>

      {/* Center Branding & Character Showcase Tag */}
      <div className="flex flex-col items-center justify-center text-center my-auto pointer-events-none">
        {/* Game Title Logo */}
        <div className="relative mb-2">
          <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-rose-500 rounded-3xl blur-lg opacity-40 animate-pulse" />
          <div className="relative">
            <h1 className="font-game text-5xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] stroke-black">
              METRO DASH
            </h1>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-300 drop-shadow-md -mt-1">
              3D Endless Runner
            </p>
          </div>
        </div>

        {/* Selected Runner Tag */}
        <div className="mt-8 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 flex items-center gap-2 shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedCharacter.colors.accent }} />
          <span className="text-xs font-bold text-white">{selectedCharacter.name}</span>
          <span className="text-[10px] text-slate-400">({selectedCharacter.title})</span>
        </div>
      </div>

      {/* Bottom Area: Big PLAY Button & Navigation Bar */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Big Animated Play Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onPlay();
          }}
          className="group relative w-full max-w-[280px] py-4 rounded-3xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition-all duration-150 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.6)] border-t border-emerald-300 flex items-center justify-center gap-3 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-white text-white translate-x-0.5" />
          </div>
          <span className="font-game text-2xl font-black tracking-wider text-white drop-shadow-md">
            TAP TO RUN
          </span>
        </button>

        {/* Quick Gesture Guide */}
        <p className="text-[10px] text-slate-300/80 font-medium tracking-wide">
          Swipe or Arrow Keys: Move • Jump • Slide • Double Tap: Board
        </p>

        {/* Bottom Menu Navigation Bar */}
        <div className="w-full grid grid-cols-4 gap-2 bg-slate-900/90 backdrop-blur-xl p-2 rounded-3xl border border-slate-700/60 shadow-2xl">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenCharacters();
            }}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            <Users className="w-5 h-5 text-indigo-400 mb-1" />
            <span className="text-[10px] font-bold">Characters</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onOpenShop();
            }}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-[10px] font-bold">Shop</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onOpenDailyRewards();
            }}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 relative"
          >
            <Gift className="w-5 h-5 text-rose-400 mb-1" />
            <span className="text-[10px] font-bold">Rewards</span>
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onOpenSettings();
            }}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            <Settings className="w-5 h-5 text-slate-400 mb-1" />
            <span className="text-[10px] font-bold">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
