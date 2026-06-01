export const directions = ['up', 'right', 'down', 'left'];

export const delta = {
  up: [-1, 0],
  right: [0, 1],
  down: [1, 0],
  left: [0, -1]
};

export function isClear(piece, pieces, rows, cols) {
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

export function blockerCount(piece, pieces, rows, cols) {
  const [dr, dc] = delta[piece.dir];
  let row = piece.row + dr;
  let col = piece.col + dc;
  let count = 0;

  while (row >= 0 && row < rows && col >= 0 && col < cols) {
    if (pieces.some((candidate) => candidate.row === row && candidate.col === col)) {
      count += 1;
    }
    row += dr;
    col += dc;
  }

  return count;
}

export function blocksAnyPiece(blocker, pieces, rows, cols) {
  return pieces.reduce((total, piece) => {
    if (piece.row === blocker.row && piece.col === blocker.col) {
      return total;
    }

    const [dr, dc] = delta[piece.dir];
    let row = piece.row + dr;
    let col = piece.col + dc;

    while (row >= 0 && row < rows && col >= 0 && col < cols) {
      if (row === blocker.row && col === blocker.col) {
        return total + 1;
      }
      row += dr;
      col += dc;
    }

    return total;
  }, 0);
}

export function solveLevel(level) {
  const remaining = level.pieces.map((piece, index) => ({ ...piece, originalIndex: index }));
  const branchCounts = [];
  const solution = [];
  let guard = 0;

  while (remaining.length > 0 && guard < 1000) {
    const available = remaining.filter((piece) => isClear(piece, remaining, level.rows, level.cols));
    if (available.length === 0) {
      return {
        solvable: false,
        branchCounts,
        solution,
        stuckPieces: remaining.map((piece) => piece.originalIndex)
      };
    }

    branchCounts.push(available.length);
    available.sort((a, b) => {
      const unlockDiff = blocksAnyPiece(b, remaining, level.rows, level.cols) - blocksAnyPiece(a, remaining, level.rows, level.cols);
      if (unlockDiff !== 0) {
        return unlockDiff;
      }
      return a.originalIndex - b.originalIndex;
    });

    const next = available[0];
    solution.push(next.originalIndex);
    remaining.splice(
      remaining.findIndex((piece) => piece.originalIndex === next.originalIndex),
      1
    );
    guard += 1;
  }

  return { solvable: remaining.length === 0, branchCounts, solution, stuckPieces: [] };
}

export function analyzeLevel(level) {
  const seen = new Set();
  const errors = [];

  for (const piece of level.pieces) {
    const key = `${piece.row}:${piece.col}`;
    if (seen.has(key)) {
      errors.push(`duplicate piece at ${key}`);
    }
    seen.add(key);
    if (piece.row < 0 || piece.row >= level.rows || piece.col < 0 || piece.col >= level.cols) {
      errors.push(`out-of-bounds piece at ${key}`);
    }
    if (!directions.includes(piece.dir)) {
      errors.push(`invalid direction ${piece.dir} at ${key}`);
    }
  }

  const solution = solveLevel(level);
  const pieceCount = level.pieces.length;
  const cells = level.rows * level.cols;
  const startAvailable = level.pieces.filter((piece) => isClear(piece, level.pieces, level.rows, level.cols)).length;
  const initialBlockers = level.pieces.map((piece) => blockerCount(piece, level.pieces, level.rows, level.cols));
  const blockedPieces = initialBlockers.filter((count) => count > 0).length;
  const avgBlockers = initialBlockers.reduce((sum, count) => sum + count, 0) / Math.max(1, pieceCount);
  const avgAvailable =
    solution.branchCounts.reduce((sum, count) => sum + count, 0) / Math.max(1, solution.branchCounts.length);
  const lowBranchSteps = solution.branchCounts.filter((count) => count <= Math.max(2, Math.ceil(pieceCount * 0.16))).length;
  const density = pieceCount / cells;
  const blockedRatio = blockedPieces / Math.max(1, pieceCount);
  const availableRatio = startAvailable / Math.max(1, pieceCount);
  const branchRatio = avgAvailable / Math.max(1, pieceCount);
  const computedScore = Math.round(
    pieceCount * 1.05 +
      density * 26 +
      blockedRatio * 22 +
      avgBlockers * 4 +
      Math.max(0, 0.34 - availableRatio) * 36 +
      Math.max(0, 0.30 - branchRatio) * 44 +
      (lowBranchSteps / Math.max(1, pieceCount)) * 16
  );
  const score = level.difficulty === 'tutorial' ? Math.min(14, computedScore) : computedScore;

  if (!solution.solvable) {
    errors.push(`unsolvable, stuck with pieces ${solution.stuckPieces.join(', ')}`);
  }

  return {
    id: level.id,
    name: level.name,
    difficulty: level.difficulty,
    rows: level.rows,
    cols: level.cols,
    pieceCount,
    density,
    startAvailable,
    avgAvailable,
    minAvailable: Math.min(...solution.branchCounts),
    maxAvailable: Math.max(...solution.branchCounts),
    blockedRatio,
    avgBlockers,
    lowBranchSteps,
    score,
    solutionLength: solution.solution.length,
    solution: solution.solution,
    errors
  };
}

export function analyzeSpatialDistribution(level) {
  const pieceCount = level.pieces.length;
  let maxWindow2 = 0;
  let maxWindow3 = 0;

  for (let row = 0; row <= level.rows - 2; row += 1) {
    for (let col = 0; col <= level.cols - 2; col += 1) {
      maxWindow2 = Math.max(maxWindow2, countPiecesInWindow(level, row, col, 2));
    }
  }

  for (let row = 0; row <= level.rows - 3; row += 1) {
    for (let col = 0; col <= level.cols - 3; col += 1) {
      maxWindow3 = Math.max(maxWindow3, countPiecesInWindow(level, row, col, 3));
    }
  }

  const quadrants = [0, 0, 0, 0];
  for (const piece of level.pieces) {
    const top = piece.row + 0.5 < level.rows / 2;
    const left = piece.col + 0.5 < level.cols / 2;
    quadrants[(top ? 0 : 2) + (left ? 0 : 1)] += 1;
  }

  const occupied = new Set(level.pieces.map((piece) => `${piece.row}:${piece.col}`));
  const adjacentPairs = level.pieces.reduce((total, piece) => {
    const down = occupied.has(`${piece.row + 1}:${piece.col}`) ? 1 : 0;
    const right = occupied.has(`${piece.row}:${piece.col + 1}`) ? 1 : 0;
    return total + down + right;
  }, 0);

  return {
    maxWindow2,
    maxWindow3,
    quadrants,
    quadrantShare: Math.max(...quadrants) / Math.max(1, pieceCount),
    rowCoverage: new Set(level.pieces.map((piece) => piece.row)).size / level.rows,
    colCoverage: new Set(level.pieces.map((piece) => piece.col)).size / level.cols,
    adjacentRatio: adjacentPairs / Math.max(1, pieceCount)
  };
}

export function spatialDistributionLimits(level) {
  const pieceCount = level.pieces.length;
  const compactLevel = pieceCount < 10;

  return {
    maxWindow2:
      level.difficulty === 'boss'
        ? Math.max(5, Math.ceil(pieceCount * 0.28))
        : level.difficulty === 'hard'
          ? Math.max(4, Math.ceil(pieceCount * 0.32))
          : level.difficulty === 'medium'
            ? Math.max(4, Math.ceil(pieceCount * 0.34))
            : Math.max(3, Math.ceil(pieceCount * 0.38)),
    maxWindow3:
      level.difficulty === 'boss'
        ? Math.max(8, Math.ceil(pieceCount * 0.42))
        : level.difficulty === 'hard'
          ? Math.max(6, Math.ceil(pieceCount * 0.5))
          : level.difficulty === 'medium'
            ? Math.max(5, Math.ceil(pieceCount * 0.48))
            : Math.max(4, Math.ceil(pieceCount * 0.55)),
    maxQuadrantShare:
      level.difficulty === 'boss' ? 0.72 : level.difficulty === 'hard' ? 0.68 : level.difficulty === 'medium' ? 0.66 : 0.7,
    minRowCoverage: compactLevel ? 0.4 : 0.5,
    minColCoverage: compactLevel ? 0.4 : 0.5
  };
}

export function spatialDistributionFailures(level) {
  const distribution = analyzeSpatialDistribution(level);
  const limits = spatialDistributionLimits(level);
  const failures = [];

  if (distribution.maxWindow2 > limits.maxWindow2) {
    failures.push(`2x2 cluster ${distribution.maxWindow2} exceeds ${limits.maxWindow2}`);
  }
  if (distribution.maxWindow3 > limits.maxWindow3) {
    failures.push(`3x3 cluster ${distribution.maxWindow3} exceeds ${limits.maxWindow3}`);
  }
  if (distribution.quadrantShare > limits.maxQuadrantShare) {
    failures.push(`quadrant share ${distribution.quadrantShare.toFixed(2)} exceeds ${limits.maxQuadrantShare.toFixed(2)}`);
  }
  if (distribution.rowCoverage < limits.minRowCoverage) {
    failures.push(`row coverage ${distribution.rowCoverage.toFixed(2)} below ${limits.minRowCoverage.toFixed(2)}`);
  }
  if (distribution.colCoverage < limits.minColCoverage) {
    failures.push(`column coverage ${distribution.colCoverage.toFixed(2)} below ${limits.minColCoverage.toFixed(2)}`);
  }

  return failures;
}

function countPiecesInWindow(level, startRow, startCol, size) {
  return level.pieces.filter(
    (piece) =>
      piece.row >= startRow && piece.row < startRow + size && piece.col >= startCol && piece.col < startCol + size
  ).length;
}

export function expectedDifficulty(score, id) {
  if (id === 1) {
    return 'tutorial';
  }
  if (id % 10 === 0) {
    return 'boss';
  }
  if (score >= 68 || id % 5 === 0) {
    return 'hard';
  }
  if (score >= 42) {
    return 'medium';
  }
  return 'easy';
}
