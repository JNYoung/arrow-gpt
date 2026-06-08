import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  analyzeLevel,
  blocksAnyPiece,
  directions,
  expectedDifficulty,
  isClear,
  spatialDistributionFailures
} from './level-tools.mjs';

const outputPath = path.join(process.cwd(), 'src', 'game', 'levels.json');

const fixedFirstLevel = {
  id: 1,
  name: '第一步',
  subtitle: '跟着高亮箭头开始',
  difficulty: 'tutorial',
  rows: 5,
  cols: 6,
  lives: 3,
  targetMoves: 5,
  tutorial: true,
  pieces: [
    { row: 0, col: 2, dir: 'up' },
    { row: 1, col: 2, dir: 'up' },
    { row: 2, col: 2, dir: 'up' },
    { row: 4, col: 4, dir: 'right' },
    { row: 4, col: 1, dir: 'right' }
  ]
};

const easyNames = ['浅滩', '轻装', '边线', '小桥', '开口', '晨练', '短路', '顺风', '小弯', '白轨'];
const mediumNames = ['回廊', '货道', '双通道', '错位', '环岛', '长廊', '转角', '交汇', '折线', '中庭'];
const hardNames = ['锁链', '密室', '回声', '窄桥', '终盘', '暗门', '逆流', '缠绕', '断点', '重锁'];
const bossNames = ['风车 Boss', '箭阵 Boss', '环流 Boss', '迷城 Boss', '枢纽 Boss', '回环 Boss', '四门 Boss', '核心 Boss', '终局 Boss', '百关 Boss'];

function rng(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function targetScore(id) {
  const chapter = Math.floor((id - 1) / 10);
  let score = 18 + id * 0.68 + chapter * 2.4;
  if (id % 10 === 0) {
    score += 14;
  } else if (id % 5 === 0) {
    score += 8;
  } else if (id % 10 === 1) {
    score -= 7;
  }
  return clamp(Math.round(score), 18, 92);
}

function makeSpec(id) {
  const score = targetScore(id);
  const boss = id % 10 === 0;
  const hard = !boss && id % 5 === 0;
  const buffer = id > 1 && id % 10 === 1;
  const chapter = Math.floor((id - 1) / 10);
  const rows = clamp(5 + Math.floor((id + 9) / 18) + (boss ? 1 : 0), 5, 11);
  const cols = clamp(6 + Math.floor((id + 4) / 16) + (boss ? 1 : 0), 6, 11);
  const baseCount = 5 + Math.round(id * 0.28) + Math.floor(chapter * 0.9);
  const count = clamp(baseCount + (boss ? 8 : hard ? 5 : buffer ? -3 : 0), 5, 44);
  const difficulty = boss ? 'boss' : hard || score >= 68 ? 'hard' : score >= 42 ? 'medium' : 'easy';
  const startTarget = difficulty === 'easy' ? 0.42 : difficulty === 'medium' ? 0.34 : difficulty === 'hard' ? 0.27 : 0.24;
  const name =
    difficulty === 'boss'
      ? bossNames[Math.floor(id / 10) - 1] ?? `Boss ${id}`
      : difficulty === 'hard'
        ? hardNames[id % hardNames.length]
        : difficulty === 'medium'
          ? mediumNames[id % mediumNames.length]
          : easyNames[id % easyNames.length];

  return {
    id,
    score,
    rows,
    cols,
    count,
    difficulty,
    startMin: Math.max(2, Math.floor(count * (startTarget - 0.1))),
    startMax: Math.max(3, Math.ceil(count * (startTarget + 0.16))),
    name,
    subtitle: makeSubtitle(difficulty, id),
    seed: 4600 + id * 101
  };
}

function makeSubtitle(difficulty, id) {
  if (difficulty === 'boss') {
    return 'Boss：观察出口方向，再拆中心箭阵';
  }
  if (difficulty === 'hard') {
    return 'Hard：可走箭头更少，注意路径阻塞';
  }
  if (difficulty === 'medium') {
    return '观察交叉路线，分批打开通道';
  }
  if (id % 10 === 1 && id > 1) {
    return '困难关后的缓冲节奏，练习连点清场';
  }
  return '从边缘出口开始，建立清场节奏';
}

function createCandidate(spec, seedOffset) {
  const random = rng(spec.seed + seedOffset);
  const occupied = new Set();
  const pieces = [];
  const blockBias = spec.difficulty === 'easy' ? 0.25 : spec.difficulty === 'medium' ? 0.58 : spec.difficulty === 'hard' ? 0.86 : 0.96;

  for (let index = 0; index < spec.count; index += 1) {
    const candidates = [];

    for (let attempt = 0; attempt < 220; attempt += 1) {
      const row = Math.floor(random() * spec.rows);
      const col = Math.floor(random() * spec.cols);
      const key = `${row}:${col}`;
      if (occupied.has(key)) {
        continue;
      }

      for (const dir of directions) {
        const piece = { row, col, dir };
        if (!isClear(piece, pieces, spec.rows, spec.cols)) {
          continue;
        }

        const blocks = blocksAnyPiece(piece, pieces, spec.rows, spec.cols);
        const edge = row === 0 || col === 0 || row === spec.rows - 1 || col === spec.cols - 1 ? 0.35 : 0;
        const centerDistance = Math.abs(row - (spec.rows - 1) / 2) + Math.abs(col - (spec.cols - 1) / 2);
        const center = (1 - centerDistance / (spec.rows + spec.cols)) * 0.35;
        candidates.push({ piece, score: blocks * blockBias + edge * (1 - blockBias) + center + random() * 0.12 });
      }
    }

    if (candidates.length === 0) {
      return undefined;
    }

    candidates.sort((a, b) => b.score - a.score);
    const poolSize = clamp(Math.ceil(candidates.length * (spec.difficulty === 'easy' ? 0.45 : 0.22)), 3, 12);
    const picked = candidates[Math.floor(random() * poolSize)].piece;
    pieces.push(picked);
    occupied.add(`${picked.row}:${picked.col}`);
  }

  return {
    id: spec.id,
    name: `${spec.name} ${spec.id}`,
    subtitle: spec.subtitle,
    difficulty: spec.difficulty,
    rows: spec.rows,
    cols: spec.cols,
    lives: 3,
    targetMoves: spec.count,
    hardWarning:
      spec.difficulty === 'hard' || spec.difficulty === 'boss'
        ? `${spec.difficulty === 'boss' ? 'Boss' : 'Hard'} 关路线更密，先观察方向和阻挡关系。`
        : undefined,
    achievement:
      spec.difficulty === 'hard' || spec.difficulty === 'boss'
        ? `${spec.name.replace(' Boss', '')}拆解者`
        : undefined,
    pieces
  };
}

function cleanLevel(level) {
  return Object.fromEntries(Object.entries(level).filter(([, value]) => value !== undefined));
}

function generateLevel(spec, previousScore) {
  let bestLevel;
  let bestPenalty = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < 420; attempt += 1) {
    const level = createCandidate(spec, attempt * 7919);
    if (!level) {
      continue;
    }

    const analysis = analyzeLevel(level);
    if (analysis.errors.length > 0) {
      continue;
    }

    const expected = expectedDifficulty(analysis.score, level.id);
    const startPenalty =
      analysis.startAvailable < spec.startMin
        ? (spec.startMin - analysis.startAvailable) * 2.5
        : analysis.startAvailable > spec.startMax
          ? (analysis.startAvailable - spec.startMax) * 2.5
          : 0;
    const trendPenalty = analysis.score + 20 < previousScore && spec.id % 10 !== 1 ? previousScore - analysis.score : 0;
    const labelPenalty = expected !== spec.difficulty && spec.difficulty !== 'easy' ? 10 : 0;
    const distributionPenalty = spatialDistributionFailures(level).length * 9;
    const scorePenalty = Math.abs(analysis.score - spec.score) + startPenalty + trendPenalty + labelPenalty + distributionPenalty;

    if (scorePenalty < bestPenalty) {
      bestLevel = level;
      bestPenalty = scorePenalty;
    }

    if (scorePenalty <= 4) {
      break;
    }
  }

  if (!bestLevel) {
    throw new Error(`Could not generate level ${spec.id}`);
  }

  return cleanLevel(bestLevel);
}

const levels = [fixedFirstLevel];
let previousScore = analyzeLevel(fixedFirstLevel).score;

for (let id = 2; id <= 100; id += 1) {
  const spec = makeSpec(id);
  const level = generateLevel(spec, previousScore);
  levels.push(level);
  previousScore = analyzeLevel(level).score;
}

await writeFile(outputPath, `${JSON.stringify(levels, null, 2)}\n`);

const summary = levels.map((level) => {
  const analysis = analyzeLevel(level);
  return {
    id: level.id,
    difficulty: level.difficulty,
    pieces: analysis.pieceCount,
    start: analysis.startAvailable,
    score: analysis.score
  };
});

console.log(`Generated ${levels.length} levels at ${outputPath}`);
console.table(summary.filter((level) => level.id <= 5 || level.id % 10 === 0 || level.id > 95));
