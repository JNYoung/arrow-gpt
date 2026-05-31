import rawLevelsJson from './levels.json';
import type { Direction, LevelData } from './types';

type RawPiece = Omit<LevelData['pieces'][number], 'id'>;
type RawLevel = Omit<LevelData, 'pieces'> & { pieces: RawPiece[] };

const rawLevels = rawLevelsJson as RawLevel[];

export const LEVELS: LevelData[] = rawLevels.map((level) => ({
  ...level,
  pieces: level.pieces.map((piece, index) => ({
    ...piece,
    dir: piece.dir as Direction,
    id: `l${level.id}-p${index + 1}`
  }))
}));
