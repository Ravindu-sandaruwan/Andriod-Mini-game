import { useState, useEffect, useRef } from 'react';
import { GameScreen, PlayerSaveData, PowerUpState, CharacterConfig, UpgradeLevels } from './types/game';
import { loadSaveData, saveSaveData, INITIAL_SAVE_DATA } from './game/storage';
import { GameEngine } from './game/GameEngine';
import { CHARACTERS_DATA } from './game/CharacterMesh';
import { soundManager } from './audio/SoundManager';
import { MobileFrame } from './components/MobileFrame';
import { MainMenu } from './components/MainMenu';
import { GameplayHUD } from './components/GameplayHUD';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { ShopModal } from './components/ShopModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [saveData, setSaveData] = useState<PlayerSaveData>(() => loadSaveData());
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('mainMenu');

  // Active run state
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [scoreMultiplier, setScoreMultiplier] = useState<number>(1);
  const [runCoins, setRunCoins] = useState<number>(0);
  const [activePowerUps, setActivePowerUps] = useState<PowerUpState[]>([]);
  const [isHoverboardActive, setIsHoverboardActive] = useState<boolean>(false);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // References
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  // Sync initial sound preferences to soundManager
  useEffect(() => {
    soundManager.setSoundEnabled(saveData.soundEnabled);
    soundManager.setMusicEnabled(saveData.musicEnabled);
  }, []);

  // Save changes to localStorage whenever saveData updates
  useEffect(() => {
    saveSaveData(saveData);
  }, [saveData]);

  // Initialize Three.js Game Engine once DOM container is mounted
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const engine = new GameEngine(canvasContainerRef.current, {
      onScoreUpdate: (score, mult) => {
        setCurrentScore(score);
        setScoreMultiplier(mult);
      },
      onCoinCollect: (coinsCollected) => {
        setRunCoins(coinsCollected);
      },
      onPowerUpStateUpdate: (powerups) => {
        setActivePowerUps([...powerups]);
      },
      onHoverboardUpdate: (active, count) => {
        setIsHoverboardActive(active);
        setSaveData((prev) => ({ ...prev, hoverboardsCount: count }));
      },
      onGameOver: (finalScore, finalRunCoins) => {
        setSaveData((prev) => {
          const isNewRecord = finalScore > prev.highScore;
          setIsNewHighScore(isNewRecord);
          return {
            ...prev,
            coins: prev.coins + finalRunCoins,
            highScore: Math.max(prev.highScore, finalScore),
          };
        });
        setCurrentScreen('gameOver');
      },
    });

    engine.setCharacter(saveData.selectedCharacterId);
    engine.setUpgrades(saveData.upgrades);
    engine.setHoverboardsCount(saveData.hoverboardsCount);
    engine.setScreenShakeEnabled(saveData.screenShakeEnabled);

    gameEngineRef.current = engine;

    return () => {
      engine.destroy();
      gameEngineRef.current = null;
    };
  }, []);

  // Sync engine settings when character or upgrades change
  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setCharacter(saveData.selectedCharacterId);
      gameEngineRef.current.setUpgrades(saveData.upgrades);
      gameEngineRef.current.setHoverboardsCount(saveData.hoverboardsCount);
      gameEngineRef.current.setScreenShakeEnabled(saveData.screenShakeEnabled);
    }
  }, [saveData.selectedCharacterId, saveData.upgrades, saveData.hoverboardsCount, saveData.screenShakeEnabled]);

  const selectedCharacter =
    CHARACTERS_DATA.find((c) => c.id === saveData.selectedCharacterId) || CHARACTERS_DATA[0];

  // --- Handlers ---

  const handleStartRun = () => {
    setCurrentScore(0);
    setRunCoins(0);
    setScoreMultiplier(1);
    setIsNewHighScore(false);
    setCurrentScreen('playing');
    gameEngineRef.current?.startRun();
  };

  const handlePause = () => {
    gameEngineRef.current?.pause();
    setCurrentScreen('paused');
  };

  const handleResume = () => {
    gameEngineRef.current?.resume();
    setCurrentScreen('playing');
  };

  const handleRestart = () => {
    handleStartRun();
  };

  const handleQuitToMenu = () => {
    soundManager.stopMusic();
    setCurrentScreen('mainMenu');
  };

  const handleReviveWithHoverboard = () => {
    if (saveData.hoverboardsCount > 0) {
      setSaveData((prev) => ({ ...prev, hoverboardsCount: prev.hoverboardsCount - 1 }));
      setCurrentScreen('playing');
      gameEngineRef.current?.startRun();
      gameEngineRef.current?.activateHoverboard();
    }
  };

  const handleSelectCharacter = (charId: string) => {
    setSaveData((prev) => ({ ...prev, selectedCharacterId: charId }));
    gameEngineRef.current?.setCharacter(charId);
  };

  const handleUnlockCharacter = (char: CharacterConfig) => {
    if (saveData.coins >= char.price) {
      setSaveData((prev) => ({
        ...prev,
        coins: prev.coins - char.price,
        unlockedCharacters: [...prev.unlockedCharacters, char.id],
        selectedCharacterId: char.id,
      }));
      soundManager.playVictory();
    }
  };

  const handleUpgrade = (type: keyof UpgradeLevels, cost: number) => {
    if (saveData.coins >= cost) {
      setSaveData((prev) => ({
        ...prev,
        coins: prev.coins - cost,
        upgrades: {
          ...prev.upgrades,
          [type]: Math.min(5, prev.upgrades[type] + 1),
        },
      }));
      soundManager.playPowerup();
    }
  };

  const handleBuyHoverboards = (amount: number, cost: number) => {
    if (saveData.coins >= cost) {
      setSaveData((prev) => ({
        ...prev,
        coins: prev.coins - cost,
        hoverboardsCount: prev.hoverboardsCount + amount,
      }));
      soundManager.playHoverboard();
    }
  };

  const handleOpenMysteryBox = (cost: number) => {
    // Deduct cost and roll prize
    const isCoinsPrize = Math.random() > 0.35;
    let rewardType = 'coins';
    let amount = 500;

    if (isCoinsPrize) {
      const rolls = [750, 1000, 1500, 2500];
      amount = rolls[Math.floor(Math.random() * rolls.length)];
      setSaveData((prev) => ({
        ...prev,
        coins: prev.coins - cost + amount,
      }));
    } else {
      rewardType = 'hoverboard';
      amount = Math.random() > 0.5 ? 2 : 4;
      setSaveData((prev) => ({
        ...prev,
        coins: prev.coins - cost,
        hoverboardsCount: prev.hoverboardsCount + amount,
      }));
    }

    return { rewardType, amount };
  };

  // Daily Rewards Claim Checking
  const todayStr = new Date().toISOString().slice(0, 10);
  const canClaimDailyToday = saveData.lastDailyRewardDate !== todayStr;

  const handleClaimDailyReward = () => {
    if (!canClaimDailyToday) return;

    const streakIdx = saveData.dailyStreak % 7;
    let coinsBonus = 0;
    let boardsBonus = 0;

    switch (streakIdx) {
      case 0:
        coinsBonus = 250;
        break;
      case 1:
        boardsBonus = 1;
        break;
      case 2:
        coinsBonus = 500;
        break;
      case 3:
        boardsBonus = 2;
        break;
      case 4:
        coinsBonus = 1000;
        break;
      case 5:
        boardsBonus = 3;
        break;
      case 6:
        coinsBonus = 2500;
        boardsBonus = 5;
        break;
    }

    setSaveData((prev) => ({
      ...prev,
      coins: prev.coins + coinsBonus,
      hoverboardsCount: prev.hoverboardsCount + boardsBonus,
      dailyStreak: prev.dailyStreak + 1,
      lastDailyRewardDate: todayStr,
    }));
  };

  // Audio Toggles
  const handleToggleSound = () => {
    const nextVal = !saveData.soundEnabled;
    soundManager.setSoundEnabled(nextVal);
    setSaveData((prev) => ({ ...prev, soundEnabled: nextVal }));
  };

  const handleToggleMusic = () => {
    const nextVal = !saveData.musicEnabled;
    soundManager.setMusicEnabled(nextVal);
    setSaveData((prev) => ({ ...prev, musicEnabled: nextVal }));
  };

  const handleToggleScreenShake = () => {
    const nextVal = !saveData.screenShakeEnabled;
    gameEngineRef.current?.setScreenShakeEnabled(nextVal);
    setSaveData((prev) => ({ ...prev, screenShakeEnabled: nextVal }));
  };

  const handleResetData = () => {
    setSaveData(INITIAL_SAVE_DATA);
    saveSaveData(INITIAL_SAVE_DATA);
    soundManager.playClick();
  };

  return (
    <MobileFrame soundEnabled={saveData.soundEnabled} onToggleSound={handleToggleSound}>
      {/* 3D WebGL Canvas Layer */}
      <div ref={canvasContainerRef} className="absolute inset-0 z-10 w-full h-full overflow-hidden bg-sky-400" />

      {/* Screen: Main Menu */}
      {currentScreen === 'mainMenu' && (
        <MainMenu
          highScore={saveData.highScore}
          coins={saveData.coins}
          hoverboardsCount={saveData.hoverboardsCount}
          selectedCharacter={selectedCharacter}
          onPlay={handleStartRun}
          onOpenCharacters={() => setCurrentScreen('characterSelect')}
          onOpenShop={() => setCurrentScreen('shop')}
          onOpenDailyRewards={() => setCurrentScreen('dailyRewards')}
          onOpenSettings={() => setCurrentScreen('settings')}
        />
      )}

      {/* Screen: Gameplay HUD */}
      {currentScreen === 'playing' && (
        <GameplayHUD
          score={currentScore}
          multiplier={scoreMultiplier}
          coins={runCoins}
          powerups={activePowerUps}
          hoverboardsCount={saveData.hoverboardsCount}
          isHoverboardActive={isHoverboardActive}
          onPause={handlePause}
          onMoveLeft={() => gameEngineRef.current?.moveLeft()}
          onMoveRight={() => gameEngineRef.current?.moveRight()}
          onJump={() => gameEngineRef.current?.jump()}
          onSlide={() => gameEngineRef.current?.slide()}
          onActivateHoverboard={() => gameEngineRef.current?.activateHoverboard()}
        />
      )}

      {/* Screen: Pause Modal Overlay */}
      {currentScreen === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onHome={handleQuitToMenu}
          soundEnabled={saveData.soundEnabled}
          musicEnabled={saveData.musicEnabled}
          onToggleSound={handleToggleSound}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {/* Screen: Game Over Modal */}
      {currentScreen === 'gameOver' && (
        <GameOverModal
          score={currentScore}
          runCoins={runCoins}
          totalCoins={saveData.coins}
          highScore={saveData.highScore}
          isNewHighScore={isNewHighScore}
          hoverboardsCount={saveData.hoverboardsCount}
          onRetry={handleRestart}
          onHome={handleQuitToMenu}
          onReviveWithHoverboard={handleReviveWithHoverboard}
        />
      )}

      {/* Screen: Character Selection Modal */}
      {currentScreen === 'characterSelect' && (
        <CharacterSelectModal
          unlockedCharacterIds={saveData.unlockedCharacters}
          selectedCharacterId={saveData.selectedCharacterId}
          coins={saveData.coins}
          onSelectCharacter={handleSelectCharacter}
          onUnlockCharacter={handleUnlockCharacter}
          onClose={() => setCurrentScreen('mainMenu')}
        />
      )}

      {/* Screen: Pro Shop Modal */}
      {currentScreen === 'shop' && (
        <ShopModal
          coins={saveData.coins}
          upgrades={saveData.upgrades}
          hoverboardsCount={saveData.hoverboardsCount}
          onUpgrade={handleUpgrade}
          onBuyHoverboards={handleBuyHoverboards}
          onOpenMysteryBox={handleOpenMysteryBox}
          onClose={() => setCurrentScreen('mainMenu')}
        />
      )}

      {/* Screen: Daily Rewards Modal */}
      {currentScreen === 'dailyRewards' && (
        <DailyRewardModal
          streak={saveData.dailyStreak}
          canClaimToday={canClaimDailyToday}
          onClaim={handleClaimDailyReward}
          onClose={() => setCurrentScreen('mainMenu')}
        />
      )}

      {/* Screen: Settings Modal */}
      {currentScreen === 'settings' && (
        <SettingsModal
          soundEnabled={saveData.soundEnabled}
          musicEnabled={saveData.musicEnabled}
          screenShakeEnabled={saveData.screenShakeEnabled}
          onToggleSound={handleToggleSound}
          onToggleMusic={handleToggleMusic}
          onToggleScreenShake={handleToggleScreenShake}
          onResetData={handleResetData}
          onClose={() => setCurrentScreen('mainMenu')}
        />
      )}
    </MobileFrame>
  );
}
