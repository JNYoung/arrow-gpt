import type { Direction, LevelData } from './types';

type RawPiece = Omit<LevelData['pieces'][number], 'id'>;
type RawLevel = Omit<LevelData, 'pieces'> & { pieces: RawPiece[] };

const p = (row: number, col: number, dir: Direction): RawPiece => ({ row, col, dir });

const rawLevels: RawLevel[] = [
  {
    id: 1,
    name: '第一步',
    subtitle: '跟着高亮箭头开始',
    difficulty: 'tutorial',
    rows: 5,
    cols: 6,
    lives: 3,
    targetMoves: 5,
    tutorial: true,
    pieces: [p(0, 2, 'up'), p(1, 2, 'up'), p(2, 2, 'up'), p(4, 4, 'right'), p(4, 1, 'right')]
  },
  {
    id: 2,
    name: '两条路',
    subtitle: '分开剥离两组箭头',
    difficulty: 'easy',
    rows: 6,
    cols: 6,
    lives: 3,
    targetMoves: 8,
    pieces: [
      p(1, 1, 'right'),
      p(1, 2, 'right'),
      p(1, 4, 'right'),
      p(3, 4, 'left'),
      p(3, 3, 'left'),
      p(3, 1, 'left'),
      p(0, 5, 'up'),
      p(5, 0, 'down')
    ]
  },
  {
    id: 3,
    name: '回旋镖',
    subtitle: '外层先行，内层跟进',
    difficulty: 'easy',
    rows: 6,
    cols: 7,
    lives: 3,
    targetMoves: 10,
    pieces: [
      p(0, 1, 'up'),
      p(0, 5, 'right'),
      p(1, 5, 'right'),
      p(2, 5, 'up'),
      p(4, 5, 'down'),
      p(5, 4, 'down'),
      p(5, 1, 'left'),
      p(3, 1, 'left'),
      p(2, 2, 'up'),
      p(2, 3, 'right')
    ]
  },
  {
    id: 4,
    name: '十字路口',
    subtitle: '先清出口，再处理交叉',
    difficulty: 'easy',
    rows: 7,
    cols: 7,
    lives: 3,
    targetMoves: 12,
    pieces: [
      p(3, 0, 'left'),
      p(3, 6, 'right'),
      p(0, 3, 'up'),
      p(6, 3, 'down'),
      p(3, 1, 'left'),
      p(3, 5, 'right'),
      p(1, 3, 'up'),
      p(5, 3, 'down'),
      p(2, 1, 'left'),
      p(2, 5, 'right'),
      p(4, 1, 'left'),
      p(4, 5, 'right')
    ]
  },
  {
    id: 5,
    name: '迷你迷宫',
    subtitle: '中等密度路径追踪',
    difficulty: 'medium',
    rows: 8,
    cols: 8,
    lives: 3,
    targetMoves: 16,
    pieces: [
      p(0, 0, 'up'),
      p(0, 7, 'right'),
      p(7, 0, 'left'),
      p(7, 7, 'down'),
      p(1, 2, 'up'),
      p(1, 5, 'right'),
      p(2, 1, 'left'),
      p(2, 6, 'right'),
      p(3, 3, 'up'),
      p(3, 4, 'down'),
      p(4, 3, 'left'),
      p(4, 4, 'right'),
      p(5, 1, 'left'),
      p(5, 6, 'right'),
      p(6, 2, 'down'),
      p(6, 5, 'down')
    ]
  },
  {
    id: 6,
    name: '蛛网',
    subtitle: '高密度 Hard 关',
    difficulty: 'hard',
    rows: 10,
    cols: 10,
    lives: 3,
    targetMoves: 32,
    hardWarning: '困难关预计需要 5-10 分钟。可以先试一次，不满意随时重开。',
    achievement: '蛛网拆解者',
    pieces: [
      p(0, 0, 'up'),
      p(0, 2, 'up'),
      p(0, 5, 'up'),
      p(0, 7, 'up'),
      p(0, 9, 'right'),
      p(1, 1, 'left'),
      p(1, 3, 'up'),
      p(1, 6, 'right'),
      p(1, 8, 'right'),
      p(2, 0, 'left'),
      p(2, 4, 'up'),
      p(2, 5, 'down'),
      p(2, 9, 'right'),
      p(3, 2, 'left'),
      p(3, 3, 'up'),
      p(3, 6, 'right'),
      p(3, 7, 'down'),
      p(4, 1, 'left'),
      p(4, 4, 'left'),
      p(4, 5, 'right'),
      p(4, 8, 'right'),
      p(5, 1, 'left'),
      p(5, 4, 'down'),
      p(5, 5, 'up'),
      p(5, 8, 'right'),
      p(6, 2, 'left'),
      p(6, 3, 'down'),
      p(6, 6, 'right'),
      p(6, 7, 'down'),
      p(8, 1, 'left'),
      p(8, 5, 'down'),
      p(9, 9, 'down')
    ]
  },
  {
    id: 7,
    name: '小方块',
    subtitle: 'Hard 之后的轻松缓冲',
    difficulty: 'easy',
    rows: 5,
    cols: 5,
    lives: 3,
    targetMoves: 6,
    pieces: [p(0, 0, 'up'), p(0, 4, 'right'), p(2, 0, 'left'), p(2, 4, 'right'), p(4, 0, 'left'), p(4, 4, 'down')]
  },
  {
    id: 8,
    name: '阶梯',
    subtitle: '找到右下延伸的规律',
    difficulty: 'easy',
    rows: 7,
    cols: 7,
    lives: 3,
    targetMoves: 11,
    pieces: [
      p(0, 0, 'up'),
      p(0, 1, 'right'),
      p(1, 1, 'right'),
      p(1, 3, 'right'),
      p(2, 3, 'down'),
      p(3, 3, 'left'),
      p(3, 1, 'left'),
      p(4, 1, 'down'),
      p(5, 1, 'right'),
      p(5, 5, 'right'),
      p(6, 5, 'down')
    ]
  },
  {
    id: 9,
    name: '字母 T',
    subtitle: '对称形状里的分支判断',
    difficulty: 'medium',
    rows: 8,
    cols: 7,
    lives: 3,
    targetMoves: 14,
    pieces: [
      p(0, 0, 'left'),
      p(0, 1, 'left'),
      p(0, 2, 'up'),
      p(0, 3, 'up'),
      p(0, 4, 'up'),
      p(0, 5, 'right'),
      p(0, 6, 'right'),
      p(1, 3, 'up'),
      p(2, 3, 'up'),
      p(3, 3, 'up'),
      p(4, 3, 'down'),
      p(5, 3, 'down'),
      p(6, 3, 'down'),
      p(7, 3, 'down')
    ]
  },
  {
    id: 10,
    name: '心形',
    subtitle: 'Boss 关：箭心箭意',
    difficulty: 'boss',
    rows: 10,
    cols: 10,
    lives: 3,
    targetMoves: 30,
    hardWarning: 'Boss 关密度更高，首次通关会解锁「箭心箭意」。',
    achievement: '箭心箭意',
    pieces: [
      p(0, 2, 'up'),
      p(0, 3, 'up'),
      p(0, 6, 'up'),
      p(0, 7, 'up'),
      p(1, 1, 'left'),
      p(1, 4, 'up'),
      p(1, 5, 'up'),
      p(1, 8, 'right'),
      p(2, 0, 'left'),
      p(2, 3, 'up'),
      p(2, 6, 'up'),
      p(2, 9, 'right'),
      p(3, 0, 'left'),
      p(3, 2, 'left'),
      p(3, 7, 'right'),
      p(3, 9, 'right'),
      p(4, 1, 'left'),
      p(4, 3, 'left'),
      p(4, 6, 'right'),
      p(4, 8, 'right'),
      p(5, 2, 'left'),
      p(5, 4, 'down'),
      p(5, 5, 'down'),
      p(5, 7, 'right'),
      p(6, 3, 'left'),
      p(6, 6, 'right'),
      p(7, 4, 'down'),
      p(7, 5, 'down'),
      p(8, 4, 'down'),
      p(9, 5, 'down')
    ]
  }
];

/* LEVELS_JSON_START */
[
  {"id":1,"name":"第一步","subtitle":"跟着高亮箭头开始","difficulty":"tutorial","rows":5,"cols":6,"lives":3,"targetMoves":5,"tutorial":true,"pieces":[{"row":0,"col":2,"dir":"up"},{"row":1,"col":2,"dir":"up"},{"row":2,"col":2,"dir":"up"},{"row":4,"col":4,"dir":"right"},{"row":4,"col":1,"dir":"right"}]},
  {"id":2,"name":"两条路","subtitle":"分开剥离两组箭头","difficulty":"easy","rows":6,"cols":6,"lives":3,"targetMoves":8,"pieces":[{"row":1,"col":1,"dir":"right"},{"row":1,"col":2,"dir":"right"},{"row":1,"col":4,"dir":"right"},{"row":3,"col":4,"dir":"left"},{"row":3,"col":3,"dir":"left"},{"row":3,"col":1,"dir":"left"},{"row":0,"col":5,"dir":"up"},{"row":5,"col":0,"dir":"down"}]},
  {"id":3,"name":"回旋镖","subtitle":"外层先行，内层跟进","difficulty":"easy","rows":6,"cols":7,"lives":3,"targetMoves":10,"pieces":[{"row":0,"col":1,"dir":"up"},{"row":0,"col":5,"dir":"right"},{"row":1,"col":5,"dir":"right"},{"row":2,"col":5,"dir":"down"},{"row":4,"col":5,"dir":"down"},{"row":5,"col":4,"dir":"down"},{"row":5,"col":1,"dir":"left"},{"row":3,"col":1,"dir":"left"},{"row":2,"col":2,"dir":"up"},{"row":2,"col":3,"dir":"right"}]},
  {"id":4,"name":"十字路口","subtitle":"先清出口，再处理交叉","difficulty":"easy","rows":7,"cols":7,"lives":3,"targetMoves":12,"pieces":[{"row":3,"col":0,"dir":"left"},{"row":3,"col":6,"dir":"right"},{"row":0,"col":3,"dir":"up"},{"row":6,"col":3,"dir":"down"},{"row":3,"col":1,"dir":"left"},{"row":3,"col":5,"dir":"right"},{"row":1,"col":3,"dir":"up"},{"row":5,"col":3,"dir":"down"},{"row":2,"col":1,"dir":"left"},{"row":2,"col":5,"dir":"right"},{"row":4,"col":1,"dir":"left"},{"row":4,"col":5,"dir":"right"}]},
  {"id":5,"name":"迷你迷宫","subtitle":"中等密度路径追踪","difficulty":"medium","rows":8,"cols":8,"lives":3,"targetMoves":16,"pieces":[{"row":0,"col":0,"dir":"up"},{"row":0,"col":7,"dir":"right"},{"row":7,"col":0,"dir":"left"},{"row":7,"col":7,"dir":"down"},{"row":1,"col":2,"dir":"up"},{"row":1,"col":5,"dir":"right"},{"row":2,"col":1,"dir":"left"},{"row":2,"col":6,"dir":"right"},{"row":3,"col":3,"dir":"up"},{"row":3,"col":4,"dir":"down"},{"row":4,"col":3,"dir":"left"},{"row":4,"col":4,"dir":"right"},{"row":5,"col":1,"dir":"left"},{"row":5,"col":6,"dir":"right"},{"row":6,"col":2,"dir":"down"},{"row":6,"col":5,"dir":"down"}]},
  {"id":6,"name":"蛛网","subtitle":"高密度 Hard 关","difficulty":"hard","rows":10,"cols":10,"lives":3,"targetMoves":32,"hardWarning":"困难关预计需要 5-10 分钟。可以先试一次，不满意随时重开。","achievement":"蛛网拆解者","pieces":[{"row":0,"col":0,"dir":"up"},{"row":0,"col":2,"dir":"up"},{"row":0,"col":5,"dir":"up"},{"row":0,"col":7,"dir":"up"},{"row":0,"col":9,"dir":"right"},{"row":1,"col":1,"dir":"left"},{"row":1,"col":3,"dir":"up"},{"row":1,"col":6,"dir":"right"},{"row":1,"col":8,"dir":"right"},{"row":2,"col":0,"dir":"left"},{"row":2,"col":4,"dir":"up"},{"row":2,"col":5,"dir":"up"},{"row":2,"col":9,"dir":"right"},{"row":3,"col":2,"dir":"left"},{"row":3,"col":3,"dir":"up"},{"row":3,"col":6,"dir":"right"},{"row":3,"col":7,"dir":"down"},{"row":4,"col":1,"dir":"left"},{"row":4,"col":4,"dir":"left"},{"row":4,"col":5,"dir":"right"},{"row":4,"col":8,"dir":"right"},{"row":5,"col":1,"dir":"left"},{"row":5,"col":4,"dir":"down"},{"row":5,"col":5,"dir":"up"},{"row":5,"col":8,"dir":"right"},{"row":6,"col":2,"dir":"left"},{"row":6,"col":3,"dir":"down"},{"row":6,"col":6,"dir":"right"},{"row":6,"col":7,"dir":"down"},{"row":8,"col":1,"dir":"left"},{"row":8,"col":5,"dir":"down"},{"row":9,"col":9,"dir":"down"}]},
  {"id":7,"name":"小方块","subtitle":"Hard 之后的轻松缓冲","difficulty":"easy","rows":5,"cols":5,"lives":3,"targetMoves":6,"pieces":[{"row":0,"col":0,"dir":"up"},{"row":0,"col":4,"dir":"right"},{"row":2,"col":0,"dir":"left"},{"row":2,"col":4,"dir":"right"},{"row":4,"col":0,"dir":"left"},{"row":4,"col":4,"dir":"down"}]},
  {"id":8,"name":"阶梯","subtitle":"找到右下延伸的规律","difficulty":"easy","rows":7,"cols":7,"lives":3,"targetMoves":11,"pieces":[{"row":0,"col":0,"dir":"up"},{"row":0,"col":1,"dir":"right"},{"row":1,"col":1,"dir":"right"},{"row":1,"col":3,"dir":"right"},{"row":2,"col":3,"dir":"down"},{"row":3,"col":3,"dir":"left"},{"row":3,"col":1,"dir":"left"},{"row":4,"col":1,"dir":"down"},{"row":5,"col":1,"dir":"right"},{"row":5,"col":5,"dir":"right"},{"row":6,"col":5,"dir":"down"}]},
  {"id":9,"name":"字母 T","subtitle":"对称形状里的分支判断","difficulty":"medium","rows":8,"cols":7,"lives":3,"targetMoves":14,"pieces":[{"row":0,"col":0,"dir":"left"},{"row":0,"col":1,"dir":"left"},{"row":0,"col":2,"dir":"up"},{"row":0,"col":3,"dir":"up"},{"row":0,"col":4,"dir":"up"},{"row":0,"col":5,"dir":"right"},{"row":0,"col":6,"dir":"right"},{"row":1,"col":3,"dir":"up"},{"row":2,"col":3,"dir":"up"},{"row":3,"col":3,"dir":"up"},{"row":4,"col":3,"dir":"down"},{"row":5,"col":3,"dir":"down"},{"row":6,"col":3,"dir":"down"},{"row":7,"col":3,"dir":"down"}]},
  {"id":10,"name":"心形","subtitle":"Boss 关：箭心箭意","difficulty":"boss","rows":10,"cols":10,"lives":3,"targetMoves":30,"hardWarning":"Boss 关密度更高，首次通关会解锁「箭心箭意」。","achievement":"箭心箭意","pieces":[{"row":0,"col":2,"dir":"up"},{"row":0,"col":3,"dir":"up"},{"row":0,"col":6,"dir":"up"},{"row":0,"col":7,"dir":"up"},{"row":1,"col":1,"dir":"left"},{"row":1,"col":4,"dir":"up"},{"row":1,"col":5,"dir":"up"},{"row":1,"col":8,"dir":"right"},{"row":2,"col":0,"dir":"left"},{"row":2,"col":3,"dir":"up"},{"row":2,"col":6,"dir":"up"},{"row":2,"col":9,"dir":"right"},{"row":3,"col":0,"dir":"left"},{"row":3,"col":2,"dir":"left"},{"row":3,"col":7,"dir":"right"},{"row":3,"col":9,"dir":"right"},{"row":4,"col":1,"dir":"left"},{"row":4,"col":3,"dir":"left"},{"row":4,"col":6,"dir":"right"},{"row":4,"col":8,"dir":"right"},{"row":5,"col":2,"dir":"left"},{"row":5,"col":4,"dir":"down"},{"row":5,"col":5,"dir":"down"},{"row":5,"col":7,"dir":"right"},{"row":6,"col":3,"dir":"left"},{"row":6,"col":6,"dir":"right"},{"row":7,"col":4,"dir":"down"},{"row":7,"col":5,"dir":"down"},{"row":8,"col":4,"dir":"down"},{"row":9,"col":5,"dir":"down"}]}
]
/* LEVELS_JSON_END */

export const LEVELS: LevelData[] = rawLevels.map((level) => ({
  ...level,
  pieces: level.pieces.map((piece, index) => ({
    ...piece,
    id: `l${level.id}-p${index + 1}`
  }))
}));
