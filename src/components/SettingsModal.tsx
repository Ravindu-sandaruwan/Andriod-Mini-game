import React from 'react';
import { X, Volume2, VolumeX, Music, Music2, Vibrate, Keyboard, Smartphone, RotateCcw } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface SettingsModalProps {
  soundEnabled: boolean;
  musicEnabled: boolean;
  screenShakeEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleScreenShake: () => void;
  onResetData: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  soundEnabled,
  musicEnabled,
  screenShakeEnabled,
  onToggleSound,
  onToggleMusic,
  onToggleScreenShake,
  onResetData,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col p-4 select-none animate-in fade-in duration-150 pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="font-game text-2xl font-black italic tracking-wide text-white">
            SETTINGS
          </h2>
          <p className="text-[11px] text-slate-400">Audio, controls & preferences</p>
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4">
        {/* Audio & Haptic Toggles */}
        <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Audio & Feedback</h3>

          {/* SFX */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Sound Effects (SFX)</div>
                <div className="text-[10px] text-slate-400">Jumping, coins, powerups, crashes</div>
              </div>
            </div>
            <button
              onClick={onToggleSound}
              className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                soundEnabled ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5.5 h-5.5 rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Music */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                {musicEnabled ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Arcade Background Music</div>
                <div className="text-[10px] text-slate-400">Upbeat electronic synth soundtrack</div>
              </div>
            </div>
            <button
              onClick={onToggleMusic}
              className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                musicEnabled ? 'bg-indigo-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5.5 h-5.5 rounded-full bg-white transition-transform ${
                  musicEnabled ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Screen Shake */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
                <Vibrate className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Screen Shake & Impact</div>
                <div className="text-[10px] text-slate-400">Dynamic collision camera feedback</div>
              </div>
            </div>
            <button
              onClick={onToggleScreenShake}
              className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                screenShakeEnabled ? 'bg-amber-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5.5 h-5.5 rounded-full bg-white transition-transform ${
                  screenShakeEnabled ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* How to Play / Controls Guide */}
        <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800 space-y-2.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">How to Play</h3>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-black/40 rounded-xl p-2.5 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center gap-1 font-bold text-cyan-300">
                <Smartphone className="w-3.5 h-3.5" /> Mobile Gestures
              </div>
              <p className="text-[10px] text-slate-300">
                • <b>Swipe Left/Right:</b> Switch Lanes<br />
                • <b>Swipe Up:</b> High Jump<br />
                • <b>Swipe Down:</b> Slide / Dive<br />
                • <b>Double Tap:</b> Deploy Board
              </p>
            </div>

            <div className="bg-black/40 rounded-xl p-2.5 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center gap-1 font-bold text-indigo-300">
                <Keyboard className="w-3.5 h-3.5" /> Keyboard Keys
              </div>
              <p className="text-[10px] text-slate-300">
                • <b>A / D / Arrows:</b> Left / Right<br />
                • <b>W / Space:</b> Jump<br />
                • <b>S / Down:</b> Slide Under<br />
                • <b>Q / E / Double Space:</b> Board
              </p>
            </div>
          </div>
        </div>

        {/* Reset Data */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (confirm('Reset all high scores and unlocked characters to default?')) {
                onResetData();
              }
            }}
            className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Saved Game Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
