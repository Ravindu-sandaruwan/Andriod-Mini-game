export type Lane = -1 | 0 | 1;

export type PowerUpType = 'jetpack' | 'magnet' | 'multiplier' | 'sneakers' | 'hoverboard';

export interface PowerUpState {
  type: PowerUpType;
  duration: number; // Max duration in seconds
  remaining: number; // Remaining seconds
  active: boolean;
}

export interface CharacterConfig {
  id: string;
  name: string;
  title: string;
  price: number;
  unlocked: boolean;
  colors: {
    skin: string;
    shirt: string;
    pants: string;
    shoes: string;
    accent: string;
    hair: string;
  };
  style: 'urban' | 'cyber' | 'robot' | 'ninja';
  stats: {
    speedBoost: string;
    jumpBonus: string;
    specialTrait: string;
  };
}

export interface UpgradeLevels {
  jetpack: number; // 1 to 5
  magnet: number;
  multiplier: number;
  sneakers: number;
}

export interface PlayerSaveData {
  coins: number;
  highScore: number;
  selectedCharacterId: string;
  unlockedCharacters: string[];
  upgrades: UpgradeLevels;
  hoverboardsCount: number;
  lastDailyRewardDate: string | null;
  dailyStreak: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  screenShakeEnabled: boolean;
}

export type GameScreen = 
  | 'splash'
  | 'mainMenu'
  | 'playing'
  | 'paused'
  | 'gameOver'
  | 'characterSelect'
  | 'shop'
  | 'dailyRewards'
  | 'settings';

export interface ObstacleData {
  id: number;
  lane: Lane;
  z: number;
  type: 'barrier_low' | 'barrier_high' | 'train_static' | 'train_moving' | 'ramp' | 'traffic_cones';
  speed?: number; // for moving trains
  width?: number;
  height?: number;
  length?: number;
  meshIndex?: number;
}

export interface CoinData {
  id: number;
  lane: Lane;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export interface PowerUpPickupData {
  id: number;
  lane: Lane;
  type: PowerUpType;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export interface DailyRewardItem {
  day: number;
  type: 'coins' | 'hoverboard' | 'mystery';
  amount: number;
  label: string;
}
