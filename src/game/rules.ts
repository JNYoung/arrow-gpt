import type { ArrowPiece, Direction, LevelData } from './types';

export const DIRECTION_DELTA: Record<Direction, { row: number; col: number }> = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 }
};

export const DIRECTION_ANGLE: Record<Direction, number> = {
  up: -90,
  right: 0,
  down: 90,
  left: 180
};

export function isPathClear(piece: ArrowPiece, pieces: ArrowPiece[], level: Pick<LevelData, 'rows' | 'cols'>): boolean {
  const delta = DIRECTION_DELTA[piece.dir];
  let row = piece.row + delta.row;
  let col = piece.col + delta.col;

  while (row >= 0 && row < level.rows && col >= 0 && col < level.cols) {
    if (pieces.some((candidate) => candidate.id !== piece.id && candidate.row === row && candidate.col === col)) {
      return false;
    }
    row += delta.row;
    col += delta.col;
  }

  return true;
}

export function getAvailablePieces(pieces: ArrowPiece[], level: Pick<LevelData, 'rows' | 'cols'>): ArrowPiece[] {
  return pieces.filter((piece) => isPathClear(piece, pieces, level));
}

export function clonePieces(pieces: ArrowPiece[]): ArrowPiece[] {
  return pieces.map((piece) => ({ ...piece }));
}
