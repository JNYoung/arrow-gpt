import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const levelsPath = path.join(process.cwd(), 'src', 'game', 'levels.ts');
const source = await readFile(levelsPath, 'utf8');
const match = source.match(/\/\* LEVELS_JSON_START \*\/\n([\s\S]*?)\n\/\* LEVELS_JSON_END \*\//);

if (!match) {
  throw new Error('Could not find embedded level JSON block in src/game/levels.ts');
}

const levels = JSON.parse(match[1]);

const delta = {
  up: [-1, 0],
  right: [0, 1],
  down: [1, 0],
  left: [0, -1]
};

function isClear(piece, pieces, rows, cols) {
  const [dr, dc] = delta[piece.dir];
  let row = piece.row + dr;
  let col = piece.col + dc;
  while (row >= 0 && row < rows && col >= 0 && col < cols) {
    if (pieces.some((candidate) => candidate.row === row && candidate.col === col)) {
      return false;
    }
    row += dr;
    col += dc;
  }
  return true;
}

for (const level of levels) {
  const seen = new Set();
  for (const piece of level.pieces) {
    const key = `${piece.row}:${piece.col}`;
    if (seen.has(key)) {
      throw new Error(`Level ${level.id} has a duplicate piece at ${key}`);
    }
    seen.add(key);
    if (piece.row < 0 || piece.row >= level.rows || piece.col < 0 || piece.col >= level.cols) {
      throw new Error(`Level ${level.id} has an out-of-bounds piece at ${key}`);
    }
  }

  const remaining = level.pieces.map((piece) => ({ ...piece }));
  let guard = 0;
  while (remaining.length > 0 && guard < 500) {
    const nextIndex = remaining.findIndex((piece) => isClear(piece, remaining, level.rows, level.cols));
    if (nextIndex === -1) {
      throw new Error(`Level ${level.id} "${level.name}" has no available move with ${remaining.length} pieces left`);
    }
    remaining.splice(nextIndex, 1);
    guard += 1;
  }
}

console.log(`Verified ${levels.length} levels: all pieces are in bounds and solvable.`);
