import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Music, Music2 } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-[320px] bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="font-game text-3xl font-black italic tracking-wider text-amber-400 drop-shadow-md mb-1">
          PAUSED
        </h2>
        <p className="text-xs text-slate-400 mb-6 font-medium">Catch your breath, runner!</p>

        {/* Audio Quick Toggles */}
        <div className="w-full grid grid-cols-2 gap-2 mb-5">
          <button
            onClick={onToggleSound}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
              soundEnabled
                ? 'bg-slate-800 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>SFX {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onToggleMusic}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
              musicEnabled
                ? 'bg-slate-800 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            {musicEnabled ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
            <span>Music {musicEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-game text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
          >
            <Play className="w-5 h-5 fill-white text-white" />
            <span>RESUME</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onRestart();
            }}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onHome();
            }}
            className="w-full py-2.5 rounded-2xl bg-transparent hover:bg-slate-800/60 active:scale-95 text-slate-400 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Home className="w-4 h-4" />
            <span>QUIT TO MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
