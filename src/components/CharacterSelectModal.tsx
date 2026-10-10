import React from 'react';
import { X, Check, Lock, Zap, ArrowUp, Sparkles } from 'lucide-react';
import { CharacterConfig } from '../types/game';
import { CHARACTERS_DATA } from '../game/CharacterMesh';
import { soundManager } from '../audio/SoundManager';

interface CharacterSelectModalProps {
  unlockedCharacterIds: string[];
  selectedCharacterId: string;
  coins: number;
  onSelectCharacter: (charId: string) => void;
  onUnlockCharacter: (char: CharacterConfig) => void;
  onClose: () => void;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  unlockedCharacterIds,
  selectedCharacterId,
  coins,
  onSelectCharacter,
  onUnlockCharacter,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col p-4 select-none animate-in fade-in duration-150 pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="font-game text-2xl font-black italic tracking-wide text-white">
            CHARACTERS
          </h2>
          <p className="text-[11px] text-slate-400">Choose your stylish track runner</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Coins Badge */}
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

      {/* Character Grid */}
      <div className="flex-1 overflow-y-auto py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CHARACTERS_DATA.map((char) => {
          const isUnlocked = unlockedCharacterIds.includes(char.id);
          const isSelected = selectedCharacterId === char.id;
          const canAfford = coins >= char.price;

          return (
            <div
              key={char.id}
              className={`rounded-2xl p-3.5 border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Character Header Info */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner font-game font-bold text-lg text-white"
                    style={{ backgroundColor: char.colors.shirt }}
                  >
                    {char.name[0]}
                  </div>
                  <div>
                    <h3 className="font-game text-base font-bold text-white flex items-center gap-1.5">
                      {char.name}
                      {isSelected && (
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-sans font-semibold">
                          Equipped
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400">{char.title}</p>
                  </div>
                </div>

                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                  style={{ backgroundColor: char.colors.accent }}
                  title="Accent Color"
                />
              </div>

              {/* Character Stats & Traits */}
              <div className="bg-black/40 rounded-xl p-2.5 mb-3 flex flex-col gap-1.5 text-[10px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Zap className="w-3 h-3 text-amber-400" /> Agility
                  </span>
                  <span className="font-semibold text-white">{char.stats.speedBoost}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-slate-400">
                    <ArrowUp className="w-3 h-3 text-emerald-400" /> Jump
                  </span>
                  <span className="font-semibold text-white">{char.stats.jumpBonus}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Sparkles className="w-3 h-3 text-purple-400" /> Trait
                  </span>
                  <span className="font-semibold text-cyan-300">{char.stats.specialTrait}</span>
                </div>
              </div>

              {/* Action Button */}
              {isUnlocked ? (
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onSelectCharacter(char.id);
                  }}
                  disabled={isSelected}
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'EQUIPPED' : 'EQUIP'}</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onUnlockCharacter(char);
                  }}
                  disabled={!canAfford}
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    canAfford
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-amber-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>UNLOCK ({char.price.toLocaleString()} ¢)</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
