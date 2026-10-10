import React, { useState, useEffect } from 'react';
import { Smartphone, Maximize2, Minimize2, Wifi, Battery, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface MobileFrameProps {
  children: React.ReactNode;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children, soundEnabled, onToggleSound }) => {
  const [isImmersive, setIsImmersive] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-[#070a12] flex items-center justify-center overflow-hidden p-0 sm:p-4 select-none">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-radial from-blue-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Top Floating Desktop Utility Bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 shadow-xl text-xs text-slate-200">
        <span className="font-semibold text-amber-400 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" />
          Android 3D
        </span>
        <span className="text-slate-600">|</span>
        <button
          onClick={onToggleSound}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer px-1.5 py-0.5 rounded"
          title="Toggle Audio"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
          <span>{soundEnabled ? 'SFX On' : 'SFX Muted'}</span>
        </button>
        <span className="text-slate-600">|</span>
        <button
          onClick={() => {
            soundManager.playClick();
            setIsImmersive(!isImmersive);
          }}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer px-1.5 py-0.5 rounded text-cyan-300"
          title="Toggle Fullscreen Viewport"
        >
          {isImmersive ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span>{isImmersive ? 'Phone Frame' : 'Full Screen'}</span>
        </button>
      </div>

      {/* Mobile Device Container */}
      <div
        className={`relative transition-all duration-300 overflow-hidden ${
          isImmersive
            ? 'w-full h-full max-w-none rounded-none border-0 shadow-none'
            : 'w-full max-w-[425px] h-[92vh] max-h-[890px] rounded-[42px] border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_50px_rgba(56,189,248,0.15)] ring-1 ring-slate-700/80'
        } bg-black flex flex-col`}
      >
        {/* Android Punch Hole & Status Bar */}
        <div className="relative z-40 h-8 px-6 flex items-center justify-between text-[11px] font-medium text-white/90 bg-black/40 backdrop-blur-xs select-none shrink-0 pointer-events-none">
          {/* Status Bar Left: Clock */}
          <span>{currentTime}</span>

          {/* Center Punch-hole Camera */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900/90" />
          </div>

          {/* Status Bar Right: Wifi, 5G, Battery */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold tracking-tighter">5G</span>
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Main Screen Content Area */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Android Home Navigation Bar Pill */}
        <div className="relative z-40 h-4 w-full flex items-center justify-center bg-black/30 pointer-events-none shrink-0">
          <div className="w-32 h-1 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
};
