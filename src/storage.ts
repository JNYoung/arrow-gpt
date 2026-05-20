import type { SaveData } from './game/types';

const STORAGE_KEY = 'arrow-again-save-v1';

const DEFAULT_SAVE: SaveData = {
  unlockedLevel: 1,
  starsByLevel: {},
  soundEnabled: true
};

export function loadSave(): SaveData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SAVE };
    }

    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      unlockedLevel: Math.max(1, parsed.unlockedLevel ?? DEFAULT_SAVE.unlockedLevel),
      starsByLevel: parsed.starsByLevel ?? {},
      soundEnabled: parsed.soundEnabled ?? true
    };
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function saveGame(data: SaveData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
