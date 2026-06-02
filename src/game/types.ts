export type Direction = 'up' | 'right' | 'down' | 'left';

export type Difficulty = 'tutorial' | 'easy' | 'medium' | 'hard' | 'boss';

export interface ArrowPiece {
  id: string;
  row: number;
  col: number;
  dir: Direction;
}

export interface LevelData {
  id: number;
  name: string;
  subtitle: string;
  difficulty: Difficulty;
  rows: number;
  cols: number;
  lives: number;
  targetMoves: number;
  pieces: ArrowPiece[];
  tutorial?: boolean;
  hardWarning?: string;
  achievement?: string;
}

export interface SaveData {
  unlockedLevel: number;
  starsByLevel: Record<string, number>;
  soundEnabled: boolean;
  firstPlayedAt: string;
  lastPlayedDate: string;
  streakDays: number;
  totalSessions: number;
  feedbackCount: number;
  lastFeedbackAt?: string;
}

export interface BoardMetrics {
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  centerX: (col: number) => number;
  centerY: (row: number) => number;
}
