import './styles.css';
import { GameAudio } from './audio';
import { LEVELS } from './game/levels';
import { DIRECTION_ANGLE, DIRECTION_DELTA, getAvailablePieces, isPathClear } from './game/rules';
import type { ArrowPiece, BoardMetrics, LevelData, SaveData } from './game/types';
import { createPlatformBridge, type PlatformBridge } from './platform/meta';
import { loadSave, saveGame } from './storage';

type Screen = 'home' | 'levels' | 'playing' | 'result';
type ResultState = {
  won: boolean;
  level: LevelData;
  stars: number;
  lives: number;
  moves: number;
};

const appRoot = document.querySelector<HTMLDivElement>('#app');

if (!appRoot) {
  throw new Error('Missing #app root');
}

class ArrowAgainApp {
  private save: SaveData = loadSave();
  private screen: Screen = 'home';
  private currentLevel = LEVELS[0];
  private pieces: ArrowPiece[] = [];
  private lives = 3;
  private moves = 0;
  private message = '';
  private errorPieceId?: string;
  private hintIds = new Set<string>();
  private animating = false;
  private result?: ResultState;
  private pendingHardLevel?: LevelData;
  private canvas?: HTMLCanvasElement;
  private svg?: SVGSVGElement;
  private boardWrap?: HTMLDivElement;
  private resizeObserver?: ResizeObserver;
  private audio: GameAudio;
  private platform: PlatformBridge;

  constructor(private root: HTMLDivElement) {
    this.audio = new GameAudio(this.save.soundEnabled);
    this.platform = createPlatformBridge();
    window.addEventListener('resize', () => this.drawBoard());
  }

  async start(): Promise<void> {
    await this.platform.ready();
    this.platform.progress(100);
    this.render();
  }

  private render(): void {
    this.resizeObserver?.disconnect();
    this.root.innerHTML = `<main class="app-shell">${this.renderScreen()}</main>`;
    this.bindScreen();
  }

  private renderScreen(): string {
    if (this.screen === 'levels') {
      return this.renderLevels();
    }

    if (this.screen === 'playing') {
      return this.renderPlaying();
    }

    if (this.screen === 'result' && this.result) {
      return this.renderResult(this.result);
    }

    return this.renderHome();
  }

  private renderHome(): string {
    const nextLevel = LEVELS[Math.min(this.save.unlockedLevel - 1, LEVELS.length - 1)];
    const soundLabel = this.save.soundEnabled ? 'Sound on' : 'Sound off';
    return `
      <section class="screen home-screen">
        <header class="top-row">
          <div class="brand">
            <div class="brand-mark" aria-hidden="true">→</div>
            <div>
              <h1>Arrow Again 箭了又箭</h1>
              <p>点击无遮挡箭头，让它们飞出棋盘。</p>
            </div>
          </div>
          <button class="icon-button" type="button" data-action="toggle-sound" aria-label="${soundLabel}" aria-pressed="${this.save.soundEnabled}">
            ${this.save.soundEnabled ? '♪' : '×'}
          </button>
        </header>
        <div class="home-board">
          <div class="hero-board" aria-hidden="true">
            ${this.renderHeroCells()}
          </div>
          <div class="home-actions">
            <button class="primary-button" type="button" data-action="start">开始第 ${nextLevel.id} 关</button>
            <button class="secondary-button" type="button" data-action="levels">关卡选择</button>
            <button class="secondary-button" type="button" disabled>每日挑战 · Coming soon</button>
          </div>
        </div>
        <p class="board-message">MVP 已包含 10 关、本地进度、生命值和三星评级。</p>
      </section>
    `;
  }

  private renderHeroCells(): string {
    const arrows = ['→', '', '↑', '', '→', '', '↓', '', '←', '', '→', '', '↑', '', '←'];
    return arrows.map((symbol) => `<div class="hero-cell${symbol ? ' hot' : ''}">${symbol || '&nbsp;'}</div>`).join('');
  }

  private renderLevels(): string {
    return `
      <section class="screen level-screen">
        <header class="top-row">
          <button class="icon-button" type="button" data-action="home" aria-label="返回首页">‹</button>
          <div class="level-title">
            <h1>关卡选择</h1>
            <p>Hard 后面有缓冲关，节奏按产品方案排布。</p>
          </div>
          <button class="icon-button" type="button" data-action="toggle-sound" aria-label="切换音效" aria-pressed="${this.save.soundEnabled}">
            ${this.save.soundEnabled ? '♪' : '×'}
          </button>
        </header>
        <div class="level-grid">
          ${LEVELS.map((level) => this.renderLevelButton(level)).join('')}
        </div>
      </section>
    `;
  }

  private renderLevelButton(level: LevelData): string {
    const locked = level.id > this.save.unlockedLevel;
    const stars = this.save.starsByLevel[String(level.id)] ?? 0;
    const difficultyLabel = this.getDifficultyLabel(level);
    return `
      <button class="level-button" type="button" data-action="play-level" data-level="${level.id}" ${locked ? 'disabled' : ''}>
        <span class="level-number">第 ${level.id} 关</span>
        <span class="level-name">${level.name}</span>
        <span class="level-meta">
          <span class="difficulty-${level.difficulty}">${difficultyLabel}</span>
          <span>${locked ? 'LOCK' : this.renderStars(stars)}</span>
        </span>
      </button>
    `;
  }

  private renderPlaying(): string {
    const available = getAvailablePieces(this.pieces, this.currentLevel).length;
    return `
      <section class="screen game-screen">
        <header class="top-row">
          <button class="icon-button" type="button" data-action="levels" aria-label="返回关卡">‹</button>
          <div class="level-title">
            <h1>第 ${this.currentLevel.id} 关 · ${this.currentLevel.name}</h1>
            <p>${this.currentLevel.subtitle}</p>
          </div>
          <button class="icon-button" type="button" data-action="restart" aria-label="重开">↺</button>
        </header>
        <div class="hud-row">
          <span class="hud-stat"><span class="lives">${'♥'.repeat(this.lives)}${'♡'.repeat(Math.max(0, this.currentLevel.lives - this.lives))}</span></span>
          <span class="hud-stat">步数 ${this.moves}/${this.currentLevel.targetMoves}</span>
          <span class="hud-stat">可射 ${available}</span>
        </div>
        <div class="board-wrap" style="aspect-ratio: ${this.currentLevel.cols} / ${this.currentLevel.rows}">
          <canvas class="board-canvas" aria-hidden="true"></canvas>
          <svg class="arrow-layer" role="group" aria-label="箭头棋盘"></svg>
          ${this.currentLevel.tutorial && this.moves === 0 ? '<div class="tutorial-bubble">tap to move</div><div class="tutorial-hand" aria-hidden="true"></div>' : ''}
        </div>
        <div>
          <p class="board-message">${this.message || '从边缘可飞出的箭头开始清除。'}</p>
          <div class="game-actions">
            <button class="secondary-button" type="button" data-action="hint">提示</button>
            <button class="secondary-button" type="button" data-action="restart">重开</button>
          </div>
        </div>
      </section>
      ${this.pendingHardLevel ? this.renderHardModal(this.pendingHardLevel) : ''}
    `;
  }

  private renderHardModal(level: LevelData): string {
    return `
      <div class="modal-scrim" role="dialog" aria-modal="true" aria-labelledby="hard-title">
        <div class="modal">
          <h2 id="hard-title">${level.difficulty === 'boss' ? 'Boss 关' : '困难关'}</h2>
          <p>${level.hardWarning}</p>
          <div class="modal-actions">
            <button class="secondary-button" type="button" data-action="levels">先看关卡</button>
            <button class="primary-button" type="button" data-action="confirm-hard">进入</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderResult(result: ResultState): string {
    const next = LEVELS.find((level) => level.id === result.level.id + 1);
    const title = result.won ? '关卡完成！' : '再试一次？';
    const comment = result.won ? this.getResultComment(result.lives) : `生命值已耗尽，还剩 ${this.pieces.length} 枚箭头。`;
    return `
      <section class="screen result-screen">
        <div class="result-panel">
          <div class="brand-mark" style="margin:0 auto 18px" aria-hidden="true">${result.won ? '→' : '↺'}</div>
          <h1>${title}</h1>
          <p>第 ${result.level.id} 关 · ${result.level.name}</p>
          <div class="stars" aria-label="${result.stars} 星">${this.renderStars(result.stars)}</div>
          <p class="result-stat-line">${comment}</p>
          <p class="result-stat-line">剩余生命：${'♥'.repeat(result.lives)}${'♡'.repeat(Math.max(0, result.level.lives - result.lives))} · 步数：${result.moves}</p>
          ${result.won && result.level.achievement ? `<p class="result-stat-line">成就解锁：${result.level.achievement}</p>` : ''}
          <div class="result-actions">
            <button class="secondary-button" type="button" data-action="retry-result">再试一次</button>
            ${
              result.won && next
                ? '<button class="primary-button" type="button" data-action="next-level">下一关 →</button>'
                : '<button class="primary-button" type="button" data-action="levels">关卡选择</button>'
            }
          </div>
          <button class="secondary-button" style="width:100%; margin-top:10px" type="button" data-action="share">分享成绩</button>
        </div>
      </section>
    `;
  }

  private bindScreen(): void {
    this.root.querySelectorAll<HTMLElement>('[data-action]').forEach((element) => {
      element.addEventListener('click', (event) => {
        const target = event.currentTarget as HTMLElement;
        this.handleAction(target.dataset.action ?? '', target.dataset);
      });
    });

    if (this.screen === 'playing') {
      this.canvas = this.root.querySelector<HTMLCanvasElement>('.board-canvas') ?? undefined;
      this.svg = this.root.querySelector<SVGSVGElement>('.arrow-layer') ?? undefined;
      this.boardWrap = this.root.querySelector<HTMLDivElement>('.board-wrap') ?? undefined;
      this.resizeObserver = new ResizeObserver(() => this.paintPlayingBoard());
      if (this.boardWrap) {
        this.resizeObserver.observe(this.boardWrap);
      }
      this.paintPlayingBoard();
    }
  }

  private handleAction(action: string, dataset: DOMStringMap): void {
    this.audio.play('tap');

    if (action === 'home') {
      this.screen = 'home';
      this.render();
      return;
    }

    if (action === 'levels') {
      this.pendingHardLevel = undefined;
      this.screen = 'levels';
      this.render();
      return;
    }

    if (action === 'start') {
      this.startLevel(LEVELS[Math.min(this.save.unlockedLevel - 1, LEVELS.length - 1)]);
      return;
    }

    if (action === 'play-level') {
      const level = LEVELS.find((candidate) => candidate.id === Number(dataset.level));
      if (level) {
        this.startLevel(level);
      }
      return;
    }

    if (action === 'toggle-sound') {
      this.save.soundEnabled = !this.save.soundEnabled;
      this.audio.setEnabled(this.save.soundEnabled);
      saveGame(this.save);
      this.render();
      return;
    }

    if (action === 'restart' || action === 'retry-result') {
      this.startLevel(this.currentLevel, true);
      return;
    }

    if (action === 'hint') {
      this.showHint();
      return;
    }

    if (action === 'confirm-hard' && this.pendingHardLevel) {
      const level = this.pendingHardLevel;
      this.pendingHardLevel = undefined;
      this.prepareLevel(level);
      return;
    }

    if (action === 'next-level' && this.result) {
      const resultLevelId = this.result.level.id;
      const next = LEVELS.find((level) => level.id === resultLevelId + 1);
      if (next) {
        this.startLevel(next);
      }
      return;
    }

    if (action === 'share' && this.result) {
      void this.platform.share(`我在 Arrow Again 第 ${this.result.level.id} 关拿到 ${this.result.stars} 星！`);
    }
  }

  private startLevel(level: LevelData, skipWarning = false): void {
    this.currentLevel = level;
    if (!skipWarning && level.hardWarning) {
      this.pendingHardLevel = level;
      this.screen = 'playing';
      this.prepareLevel(level, false);
      return;
    }

    this.prepareLevel(level);
  }

  private prepareLevel(level: LevelData, clearModal = true): void {
    this.currentLevel = level;
    this.pieces = level.pieces.map((piece) => ({ ...piece }));
    this.lives = level.lives;
    this.moves = 0;
    this.message = level.tutorial ? '点击高亮箭头，观察它飞出棋盘。' : '';
    this.errorPieceId = undefined;
    this.hintIds.clear();
    this.animating = false;
    this.result = undefined;
    if (clearModal) {
      this.pendingHardLevel = undefined;
    }
    this.screen = 'playing';
    this.render();
  }

  private paintPlayingBoard(): void {
    this.drawBoard();
    this.drawArrows();
    this.positionTutorialHand();
  }

  private getMetrics(): BoardMetrics | undefined {
    if (!this.boardWrap) {
      return undefined;
    }

    const rect = this.boardWrap.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return undefined;
    }

    return {
      width: rect.width,
      height: rect.height,
      cellWidth: rect.width / this.currentLevel.cols,
      cellHeight: rect.height / this.currentLevel.rows,
      centerX: (col: number) => (col + 0.5) * (rect.width / this.currentLevel.cols),
      centerY: (row: number) => (row + 0.5) * (rect.height / this.currentLevel.rows)
    };
  }

  private drawBoard(): void {
    if (!this.canvas) {
      return;
    }

    const metrics = this.getMetrics();
    if (!metrics) {
      return;
    }

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(metrics.width * dpr);
    this.canvas.height = Math.round(metrics.height * dpr);
    this.canvas.style.width = `${metrics.width}px`;
    this.canvas.style.height = `${metrics.height}px`;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, metrics.width, metrics.height);
    ctx.fillStyle = '#f8fff9';
    this.roundRect(ctx, 0, 0, metrics.width, metrics.height, 8);
    ctx.fill();

    const availableIds = new Set(getAvailablePieces(this.pieces, this.currentLevel).map((piece) => piece.id));
    for (let row = 0; row < this.currentLevel.rows; row += 1) {
      for (let col = 0; col < this.currentLevel.cols; col += 1) {
        const x = col * metrics.cellWidth;
        const y = row * metrics.cellHeight;
        const piece = this.pieces.find((candidate) => candidate.row === row && candidate.col === col);
        ctx.fillStyle = piece && availableIds.has(piece.id) ? 'rgba(247, 201, 95, 0.16)' : 'rgba(18, 63, 70, 0.035)';
        this.roundRect(ctx, x + 3, y + 3, metrics.cellWidth - 6, metrics.cellHeight - 6, 8);
        ctx.fill();
      }
    }

    ctx.strokeStyle = 'rgba(18, 63, 70, 0.08)';
    ctx.lineWidth = 1;
    for (let col = 1; col < this.currentLevel.cols; col += 1) {
      const x = col * metrics.cellWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, metrics.height);
      ctx.stroke();
    }
    for (let row = 1; row < this.currentLevel.rows; row += 1) {
      const y = row * metrics.cellHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(metrics.width, y);
      ctx.stroke();
    }
  }

  private drawArrows(): void {
    if (!this.svg) {
      return;
    }

    const metrics = this.getMetrics();
    if (!metrics) {
      return;
    }

    this.svg.setAttribute('viewBox', `0 0 ${metrics.width} ${metrics.height}`);
    this.svg.innerHTML = '';
    const availableIds = new Set(getAvailablePieces(this.pieces, this.currentLevel).map((piece) => piece.id));
    const tutorialTarget = this.currentLevel.tutorial && this.moves === 0 ? getAvailablePieces(this.pieces, this.currentLevel)[0]?.id : undefined;

    for (const piece of this.pieces) {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const size = Math.min(metrics.cellWidth, metrics.cellHeight) * 0.66;
      const radius = size * 0.44;
      const x = metrics.centerX(piece.col);
      const y = metrics.centerY(piece.row);
      const classes = ['arrow-piece'];
      if (availableIds.has(piece.id)) {
        classes.push('available');
      }
      if (piece.id === this.errorPieceId) {
        classes.push('error');
      }
      if (piece.id === tutorialTarget) {
        classes.push('tutorial-target');
      }
      if (this.hintIds.has(piece.id)) {
        classes.push('hinted');
      }

      group.setAttribute('class', classes.join(' '));
      group.setAttribute('data-piece', piece.id);
      group.setAttribute('role', 'button');
      group.setAttribute('tabindex', '0');
      group.setAttribute('aria-label', `第 ${piece.row + 1} 行第 ${piece.col + 1} 列，方向 ${piece.dir}`);
      group.setAttribute('transform', `translate(${x}, ${y}) rotate(${DIRECTION_ANGLE[piece.dir]})`);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', `${radius}`);

      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const shaft = size * 0.2;
      const tail = size * 0.37;
      const head = size * 0.43;
      arrow.setAttribute(
        'd',
        `M ${-tail} ${-shaft} L ${head * 0.12} ${-shaft} L ${head * 0.12} ${-size * 0.34} L ${head} 0 L ${head * 0.12} ${size * 0.34} L ${head * 0.12} ${shaft} L ${-tail} ${shaft} Z`
      );

      group.append(circle, arrow);
      group.addEventListener('click', () => this.tryShoot(piece.id, group, metrics));
      group.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.tryShoot(piece.id, group, metrics);
        }
      });
      this.svg.append(group);
    }
  }

  private positionTutorialHand(): void {
    const hand = this.root.querySelector<HTMLDivElement>('.tutorial-hand');
    const metrics = this.getMetrics();
    if (!hand || !metrics || !this.boardWrap) {
      return;
    }

    const target = getAvailablePieces(this.pieces, this.currentLevel)[0];
    if (!target) {
      hand.remove();
      return;
    }

    hand.style.left = `${metrics.centerX(target.col)}px`;
    hand.style.top = `${metrics.centerY(target.row)}px`;
  }

  private tryShoot(pieceId: string, element: SVGGElement, metrics: BoardMetrics): void {
    if (this.animating || this.pendingHardLevel) {
      return;
    }

    const piece = this.pieces.find((candidate) => candidate.id === pieceId);
    if (!piece) {
      return;
    }

    this.hintIds.clear();
    this.moves += 1;

    if (!isPathClear(piece, this.pieces, this.currentLevel)) {
      this.lives -= 1;
      this.errorPieceId = piece.id;
      this.message = '这枚箭头前方被挡住了。';
      this.audio.play('blocked');
      this.platform.haptic([30, 40, 30]);
      if (this.lives <= 0) {
        window.setTimeout(() => this.finishLevel(false), 260);
      } else {
        window.setTimeout(() => {
          this.errorPieceId = undefined;
          this.render();
        }, 260);
        this.render();
      }
      return;
    }

    this.animating = true;
    this.message = '漂亮，箭头飞出去了。';
    this.audio.play('move');
    this.platform.haptic(18);
    void this.animateExit(piece, element, metrics).then(() => {
      this.pieces = this.pieces.filter((candidate) => candidate.id !== piece.id);
      this.animating = false;
      this.errorPieceId = undefined;
      if (this.pieces.length === 0) {
        this.finishLevel(true);
      } else {
        this.render();
      }
    });
  }

  private async animateExit(piece: ArrowPiece, element: SVGGElement, metrics: BoardMetrics): Promise<void> {
    const startX = metrics.centerX(piece.col);
    const startY = metrics.centerY(piece.row);
    const delta = DIRECTION_DELTA[piece.dir];
    const exitX = delta.col < 0 ? -metrics.cellWidth : delta.col > 0 ? metrics.width + metrics.cellWidth : startX;
    const exitY = delta.row < 0 ? -metrics.cellHeight : delta.row > 0 ? metrics.height + metrics.cellHeight : startY;
    const angle = DIRECTION_ANGLE[piece.dir];
    const duration = 360;
    const startedAt = performance.now();
    element.style.pointerEvents = 'none';

    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const linear = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - linear, 3);
        const x = startX + (exitX - startX) * eased;
        const y = startY + (exitY - startY) * eased;
        const scale = 1 - 0.12 * eased;
        element.setAttribute('transform', `translate(${x}, ${y}) rotate(${angle}) scale(${scale})`);
        element.style.opacity = `${1 - 0.8 * eased}`;

        if (linear < 1) {
          window.requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };

      window.requestAnimationFrame(tick);
    });
  }

  private showHint(): void {
    const available = getAvailablePieces(this.pieces, this.currentLevel).slice(0, 3);
    this.hintIds = new Set(available.map((piece) => piece.id));
    this.message = available.length > 0 ? '高亮的是当前可以飞出的箭头。' : '当前没有可飞出的箭头，可以重开。';
    this.render();
  }

  private finishLevel(won: boolean): void {
    const stars = won ? this.calculateStars() : 0;
    this.result = {
      won,
      level: this.currentLevel,
      stars,
      lives: Math.max(0, this.lives),
      moves: this.moves
    };

    if (won) {
      const levelKey = String(this.currentLevel.id);
      this.save.unlockedLevel = Math.min(LEVELS.length, Math.max(this.save.unlockedLevel, this.currentLevel.id + 1));
      this.save.starsByLevel[levelKey] = Math.max(this.save.starsByLevel[levelKey] ?? 0, stars);
      saveGame(this.save);
      this.audio.play('win');
      this.platform.haptic([20, 30, 20]);
    } else {
      this.audio.play('lose');
      this.platform.haptic([60, 30, 60]);
    }

    this.screen = 'result';
    this.render();
  }

  private calculateStars(): number {
    if (this.lives >= 2) {
      return 3;
    }
    if (this.lives >= 1) {
      return 2;
    }
    return 1;
  }

  private getResultComment(lives: number): string {
    if (lives >= 3) {
      return '完美通关！';
    }
    if (lives >= 2) {
      return '太棒了！';
    }
    return '险过关！';
  }

  private renderStars(count: number): string {
    return `${'★'.repeat(count)}${'☆'.repeat(Math.max(0, 3 - count))}`;
  }

  private getDifficultyLabel(level: LevelData): string {
    const labels: Record<LevelData['difficulty'], string> = {
      tutorial: '引导',
      easy: '简单',
      medium: '中等',
      hard: 'Hard',
      boss: 'Boss'
    };
    return labels[level.difficulty];
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + safeRadius, y);
    ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
    ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
    ctx.arcTo(x, y + height, x, y, safeRadius);
    ctx.arcTo(x, y, x + width, y, safeRadius);
    ctx.closePath();
  }
}

void new ArrowAgainApp(appRoot).start();
