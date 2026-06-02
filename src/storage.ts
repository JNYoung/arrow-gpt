import type { SaveData } from './game/types';

const STORAGE_KEY = 'arrow-again-save-v1';

function getLocalDateKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createDefaultSave(now = new Date()): SaveData {
  return {
    unlockedLevel: 1,
    starsByLevel: {},
    soundEnabled: true,
    firstPlayedAt: now.toISOString(),
    lastPlayedDate: getLocalDateKey(now),
    streakDays: 0,
    totalSessions: 0,
    feedbackCount: 0
  };
}

export function loadSave(): SaveData {
  const defaults = createDefaultSave();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      unlockedLevel: Math.max(1, parsed.unlockedLevel ?? defaults.unlockedLevel),
      starsByLevel: parsed.starsByLevel ?? {},
      soundEnabled: parsed.soundEnabled ?? true,
      firstPlayedAt: parsed.firstPlayedAt ?? defaults.firstPlayedAt,
      lastPlayedDate: parsed.lastPlayedDate ?? defaults.lastPlayedDate,
      streakDays: Math.max(0, parsed.streakDays ?? defaults.streakDays),
      totalSessions: Math.max(0, parsed.totalSessions ?? defaults.totalSessions),
      feedbackCount: Math.max(0, parsed.feedbackCount ?? defaults.feedbackCount),
      lastFeedbackAt: parsed.lastFeedbackAt
    };
  } catch {
    return defaults;
  }
}

export function saveGame(data: SaveData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
