import { PlayerSaveData } from '../types/game';

const STORAGE_KEY = 'metro_dash_player_save_v1';

export const INITIAL_SAVE_DATA: PlayerSaveData = {
  coins: 500, // starting bonus so player can try upgrades/boards!
  highScore: 0,
  selectedCharacterId: 'dash',
  unlockedCharacters: ['dash'],
  upgrades: {
    jetpack: 1,
    magnet: 1,
    multiplier: 1,
    sneakers: 1,
  },
  hoverboardsCount: 3,
  lastDailyRewardDate: null,
  dailyStreak: 0,
  soundEnabled: true,
  musicEnabled: true,
  screenShakeEnabled: true,
};

export function loadSaveData(): PlayerSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_SAVE_DATA;
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_SAVE_DATA,
      ...parsed,
      upgrades: {
        ...INITIAL_SAVE_DATA.upgrades,
        ...(parsed.upgrades || {}),
      },
      unlockedCharacters: Array.isArray(parsed.unlockedCharacters)
        ? parsed.unlockedCharacters
        : INITIAL_SAVE_DATA.unlockedCharacters,
    };
  } catch {
    return INITIAL_SAVE_DATA;
  }
}

export function saveSaveData(data: PlayerSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save game data to localStorage', e);
  }
}
