import type { AppLanguage, SaveData } from './game/types';

const STORAGE_KEY = 'arrow-again-save-v1';

function getLocalDateKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeLanguage(value: unknown): AppLanguage {
  return value === 'en' ? 'en' : 'zh';
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function createDefaultSave(now = new Date()): SaveData {
  return {
    unlockedLevel: 1,
    starsByLevel: {},
    language: 'zh',
    musicEnabled: true,
    effectsEnabled: true,
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
    const legacySoundEnabled = normalizeBoolean(parsed.soundEnabled, true);
    return {
      unlockedLevel: Math.max(1, parsed.unlockedLevel ?? defaults.unlockedLevel),
      starsByLevel: parsed.starsByLevel ?? {},
      language: normalizeLanguage(parsed.language ?? defaults.language),
      musicEnabled: normalizeBoolean(parsed.musicEnabled, legacySoundEnabled),
      effectsEnabled: normalizeBoolean(parsed.effectsEnabled, legacySoundEnabled),
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
