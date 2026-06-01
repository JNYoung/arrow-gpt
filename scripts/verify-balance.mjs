import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { analyzeLevel, analyzeSpatialDistribution, expectedDifficulty, spatialDistributionFailures } from './level-tools.mjs';

const levelsPath = path.join(process.cwd(), 'src', 'game', 'levels.json');
const levels = JSON.parse(await readFile(levelsPath, 'utf8'));
const analyses = levels.map(analyzeLevel);
const failures = [];

function fail(message) {
  failures.push(message);
}

if (levels.length !== 100) {
  fail(`Expected exactly 100 levels, found ${levels.length}`);
}

for (const [index, level] of levels.entries()) {
  const analysis = analyses[index];
  const expectedId = index + 1;

  if (level.id !== expectedId) {
    fail(`Level index ${index} should have id ${expectedId}, found ${level.id}`);
  }

  if (analysis.errors.length > 0) {
    fail(`Level ${level.id} "${level.name}" failed structural/completion checks: ${analysis.errors.join('; ')}`);
  }

  if (analysis.solutionLength !== analysis.pieceCount) {
    fail(`Level ${level.id} solution length ${analysis.solutionLength} does not match piece count ${analysis.pieceCount}`);
  }

  if (level.targetMoves < analysis.pieceCount || level.targetMoves > analysis.pieceCount + 2) {
    fail(`Level ${level.id} targetMoves ${level.targetMoves} is not balanced against ${analysis.pieceCount} pieces`);
  }

  const expected = expectedDifficulty(analysis.score, level.id);
  if (level.id === 1 && level.difficulty !== 'tutorial') {
    fail('Level 1 must be tutorial');
  } else if (level.id % 10 === 0 && level.difficulty !== 'boss') {
    fail(`Level ${level.id} should be a boss checkpoint`);
  } else if (level.id !== 1 && level.id % 10 !== 0 && expected !== level.difficulty) {
    fail(`Level ${level.id} difficulty "${level.difficulty}" does not match score ${analysis.score} expected "${expected}"`);
  }

  if (level.difficulty === 'hard' || level.difficulty === 'boss') {
    if (!level.hardWarning) {
      fail(`Level ${level.id} ${level.difficulty} is missing a warning`);
    }
    if (!level.achievement) {
      fail(`Level ${level.id} ${level.difficulty} is missing an achievement`);
    }
  }

  if (analysis.startAvailable < 1) {
    fail(`Level ${level.id} starts with no available moves`);
  }

  const availableRatio = analysis.startAvailable / analysis.pieceCount;
  if (level.difficulty === 'easy' && availableRatio > 0.88) {
    fail(`Level ${level.id} easy start is too open (${analysis.startAvailable}/${analysis.pieceCount})`);
  }
  if ((level.difficulty === 'hard' || level.difficulty === 'boss') && availableRatio > 0.64) {
    fail(`Level ${level.id} ${level.difficulty} start is too open (${analysis.startAvailable}/${analysis.pieceCount})`);
  }

  const spatialFailures = spatialDistributionFailures(level);
  for (const spatialFailure of spatialFailures) {
    fail(`Level ${level.id} distribution is uneven: ${spatialFailure}`);
  }
}

for (let index = 1; index < analyses.length; index += 1) {
  const previous = analyses[index - 1];
  const current = analyses[index];
  if (previous.difficulty === 'tutorial') {
    continue;
  }
  const isBufferAfterBoss = current.id % 10 === 1;
  const allowedDrop = isBufferAfterBoss ? 28 : 16;
  const allowedSpike = current.difficulty === 'boss' ? 32 : current.difficulty === 'hard' ? 24 : 18;

  if (current.score < previous.score - allowedDrop) {
    fail(`Level ${current.id} score drops too sharply: ${previous.score} -> ${current.score}`);
  }

  if (current.score > previous.score + allowedSpike) {
    fail(`Level ${current.id} score spikes too sharply: ${previous.score} -> ${current.score}`);
  }
}

for (let start = 0; start < analyses.length; start += 10) {
  const chapter = analyses.slice(start, start + 10);
  const previous = analyses.slice(Math.max(0, start - 10), start);
  if (previous.length === 0 || chapter.length < 10) {
    continue;
  }

  const chapterAverage = chapter.reduce((sum, level) => sum + level.score, 0) / chapter.length;
  const previousAverage = previous.reduce((sum, level) => sum + level.score, 0) / previous.length;
  if (chapterAverage < previousAverage - 4) {
    fail(
      `Chapter ${start / 10 + 1} average score ${chapterAverage.toFixed(1)} regresses from previous ${previousAverage.toFixed(1)}`
    );
  }
}

const summary = analyses.map((analysis) => ({
  distribution: analyzeSpatialDistribution(levels[analysis.id - 1]),
  id: analysis.id,
  difficulty: analysis.difficulty,
  pieces: analysis.pieceCount,
  start: analysis.startAvailable,
  avg: Number(analysis.avgAvailable.toFixed(1)),
  score: analysis.score
}));

if (failures.length > 0) {
  console.table(
    summary.map(({ distribution, ...level }) => ({
      ...level,
      max3: distribution.maxWindow3,
      quadrant: Number(distribution.quadrantShare.toFixed(2))
    }))
  );
  throw new Error(`Balance verification failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

console.table(
  summary
    .filter((level) => level.id <= 5 || level.id % 10 === 0 || level.id > 95)
    .map(({ distribution, ...level }) => ({
      ...level,
      max3: distribution.maxWindow3,
      quadrant: Number(distribution.quadrantShare.toFixed(2))
    }))
);
console.log(
  'Balance verified: 100 levels are completable, score progression is bounded, spatial distribution is checked in order, and difficulty labels match the computed curve.'
);
