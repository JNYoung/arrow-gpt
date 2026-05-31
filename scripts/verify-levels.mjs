import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { analyzeLevel } from './level-tools.mjs';

const levelsPath = path.join(process.cwd(), 'src', 'game', 'levels.json');
const levels = JSON.parse(await readFile(levelsPath, 'utf8'));

if (levels.length !== 100) {
  throw new Error(`Expected exactly 100 levels, found ${levels.length}`);
}

for (const [index, level] of levels.entries()) {
  if (level.id !== index + 1) {
    throw new Error(`Expected level id ${index + 1}, found ${level.id}`);
  }

  if (level.targetMoves < level.pieces.length) {
    throw new Error(`Level ${level.id} targetMoves must be at least its piece count`);
  }

  const analysis = analyzeLevel(level);
  if (analysis.errors.length > 0) {
    throw new Error(`Level ${level.id} "${level.name}" failed verification: ${analysis.errors.join('; ')}`);
  }
}

console.log(`Verified ${levels.length} levels: sequential, in bounds, unique, and solvable.`);
