import './styles.css';
import { GameAudio } from './audio';
import { LEVELS } from './game/levels';
import { DIRECTION_ANGLE, getAvailablePieces, isPathClear } from './game/rules';
import type { AppLanguage, ArrowPiece, BoardMetrics, LevelData, SaveData } from './game/types';
import {
  createPlatformBridge,
  normalizeRenderQuality,
  type PlatformBridge,
  type PlatformEventPayload,
  type RenderQuality,
  type SharePayload
} from './platform';
import { loadSave, saveGame } from './storage';
import platformManifest from '../platform-manifest.json';

type Screen = 'home' | 'levels' | 'playing' | 'result';
type ResultState = {
  won: boolean;
  level: LevelData;
  stars: number;
  lives: number;
  moves: number;
};

type PlaySnapshot = {
  pieces: ArrowPiece[];
  lives: number;
  moves: number;
};

type MotionKeyframe = {
  distance: number;
  time: number;
};

type MotionTimeline = {
  duration: number;
  keyframes: MotionKeyframe[];
  totalLength: number;
};

type MotionPoint = {
  x: number;
  y: number;
  angle: number;
};

type Point = {
  x: number;
  y: number;
};

const appRoot = document.querySelector<HTMLDivElement>('#app');
const debugAllLevels = new URLSearchParams(window.location.search).get('debug');
const supportEmail = platformManifest.supportEmail;
const supportUrl = platformManifest.releaseAssets.supportUrl;
const freeTrajectoryHintLevelLimit = 5;

const COPY = {
  zh: {
    brandSubtitle: '点击无遮挡箭头，让它们飞出棋盘。',
    settingsAria: '打开设置',
    settingsTitle: '设置',
    language: '语言',
    music: '背景音乐',
    effects: '音效',
    on: '开',
    off: '关',
    startLevel: (id: number) => `开始第 ${id} 关`,
    levelSelect: '关卡选择',
    feedbackSupport: '反馈与支持',
    retentionFirst: '从边缘可飞出的箭头开始，先找最顺的一步。',
    retentionStreak: () => '保持手感，先看出口再清场。',
    retentionResume: () => '继续清场，观察方向和阻挡关系。',
    backHome: '返回首页',
    levelSelectTitle: '关卡选择',
    debugLevelsCopy: 'Debug：已显示全部 100 关，不写入存档。',
    levelPrefix: (id: number) => `第 ${id} 关`,
    locked: 'LOCK',
    livesAria: (lives: number, total: number) => `生命 ${lives}/${total}`,
    moves: '步数',
    available: '可用',
    tutorialBubble: '点这里',
    defaultBoardMessage: '从边缘可飞出的箭头开始清除。',
    hint: '提示',
    hintUnavailable: '提示暂不可用',
    adPlaying: '广告中',
    undo: '撤销',
    restart: '重开',
    hardTitle: (difficulty: LevelData['difficulty']) => (difficulty === 'boss' ? 'Boss 关' : '困难关'),
    hardWarning: (level: LevelData) => level.hardWarning ?? '',
    viewLevels: '先看关卡',
    enter: '进入',
    resultWon: '关卡完成！',
    resultLost: '再试一次？',
    resultLevel: (level: LevelData) => `第 ${level.id} 关 · ${level.name}`,
    resultStarsAria: (stars: number) => `${stars} 星`,
    resultStats: (lives: number, maxLives: number, moves: number) =>
      `剩余生命：${'♥'.repeat(lives)}${'♡'.repeat(Math.max(0, maxLives - lives))} · 步数：${moves}`,
    achievement: (achievement: string) => `成就解锁：${achievement}`,
    retry: '再试一次',
    nextLevel: '下一关 →',
    share: '分享成绩',
    report: '反馈问题',
    reviveLoading: '广告加载中',
    revive: '看广告复活',
    reviveUnavailable: '复活暂不可用',
    perfect: '完美通关！',
    great: '太棒了！',
    closeWin: '险过关！',
    lostComment: (remaining: number) => `生命值已耗尽，还剩 ${remaining} 枚箭头。`,
    tutorialMessage: '点击高亮箭头，观察它飞出棋盘。',
    blockedMessage: '这枚箭头前方被挡住了。',
    moveMessage: '漂亮，箭头飞出去了。',
    undoMessage: '已撤销上一步。',
    hintUnavailableMessage: '当前平台暂未接入提示广告，先用重开或继续观察可飞出的边缘箭头。',
    adPlayingMessage: '正在播放提示广告...',
    hintFailMessage: '广告未完成，暂时无法获得提示。',
    hintCompleteMessage: '广告完成，已高亮当前可以飞出的箭头。',
    noHintMessage: '当前没有可飞出的箭头，可以重开。',
    reviveUnavailableMessage: '当前平台暂未接入复活广告，请先重开这一关。',
    reviveSuccessMessage: '复活成功，保留当前棋盘继续挑战。',
    shareTitle: 'Arrow Again 箭了又箭',
    shareWon: (levelId: number, stars: number, moves: number) =>
      `我在 Arrow Again 第 ${levelId} 关拿到 ${stars} 星，用 ${moves} 步清场！`,
    shareLost: (levelId: number) => `我在 Arrow Again 第 ${levelId} 关差一点通关，来试试你的路线判断。`
  },
  en: {
    brandSubtitle: 'Tap clear arrows and send them off the board.',
    settingsAria: 'Open settings',
    settingsTitle: 'Settings',
    language: 'Language',
    music: 'Music',
    effects: 'SFX',
    on: 'On',
    off: 'Off',
    startLevel: (id: number) => `Start Level ${id}`,
    levelSelect: 'Level Select',
    feedbackSupport: 'Feedback & Support',
    retentionFirst: 'Start with an arrow that can leave from the edge.',
    retentionStreak: () => 'Keep the rhythm: check exits before tapping.',
    retentionResume: () => 'Keep clearing by reading direction and blockers.',
    backHome: 'Back home',
    levelSelectTitle: 'Level Select',
    debugLevelsCopy: 'Debug: all 100 levels are visible and progress is not changed.',
    levelPrefix: (id: number) => `Level ${id}`,
    locked: 'LOCK',
    livesAria: (lives: number, total: number) => `Lives ${lives}/${total}`,
    moves: 'Moves',
    available: 'Open',
    tutorialBubble: 'Tap',
    defaultBoardMessage: 'Start with arrows that can leave from the edge.',
    hint: 'Hint',
    hintUnavailable: 'No hint',
    adPlaying: 'Ad',
    undo: 'Undo',
    restart: 'Restart',
    hardTitle: (difficulty: LevelData['difficulty']) => (difficulty === 'boss' ? 'Boss Level' : 'Hard Level'),
    hardWarning: () => 'Routes are denser. Watch arrow direction and blockers before tapping.',
    viewLevels: 'View levels',
    enter: 'Enter',
    resultWon: 'Level Complete!',
    resultLost: 'Try Again?',
    resultLevel: (level: LevelData) => `Level ${level.id} · ${level.name}`,
    resultStarsAria: (stars: number) => `${stars} stars`,
    resultStats: (lives: number, maxLives: number, moves: number) =>
      `Lives left: ${'♥'.repeat(lives)}${'♡'.repeat(Math.max(0, maxLives - lives))} · Moves: ${moves}`,
    achievement: (achievement: string) => `Achievement unlocked: ${achievement}`,
    retry: 'Try Again',
    nextLevel: 'Next Level →',
    share: 'Share Result',
    report: 'Report Issue',
    reviveLoading: 'Loading ad',
    revive: 'Revive with ad',
    reviveUnavailable: 'No revive',
    perfect: 'Perfect clear!',
    great: 'Nice work!',
    closeWin: 'Close one!',
    lostComment: (remaining: number) => `No lives left. ${remaining} arrows remain.`,
    tutorialMessage: 'Tap the highlighted arrow and watch it leave the board.',
    blockedMessage: 'That arrow is blocked.',
    moveMessage: 'Nice, the arrow flew out.',
    undoMessage: 'Last move undone.',
    hintUnavailableMessage: 'Rewarded hints are not available on this platform. Restart or keep scanning edge arrows.',
    adPlayingMessage: 'Playing hint ad...',
    hintFailMessage: 'The ad was not completed, so no hint is available.',
    hintCompleteMessage: 'Ad complete. Current open arrows are highlighted.',
    noHintMessage: 'No arrows can leave right now. Try restarting.',
    reviveUnavailableMessage: 'Revive ads are not available on this platform. Restart this level.',
    reviveSuccessMessage: 'Revived. Keep the current board and continue.',
    shareTitle: 'Arrow Again',
    shareWon: (levelId: number, stars: number, moves: number) =>
      `I cleared Level ${levelId} in Arrow Again with ${stars} stars and ${moves} moves!`,
    shareLost: (levelId: number) => `I almost cleared Level ${levelId} in Arrow Again. Try your route sense.`
  }
} as const;

type Copy = (typeof COPY)[AppLanguage];

declare global {
  interface Window {
    ArrowAgainRuntime?: {
      getRenderQuality: () => RenderQuality;
      setRenderQuality: (quality: RenderQuality) => RenderQuality;
    };
  }
}

if (!appRoot) {
  throw new Error('Missing #app root');
}

function isAllLevelsDebugEnabled(): boolean {
  return debugAllLevels === 'levels' || debugAllLevels === 'all' || debugAllLevels === '1' || debugAllLevels === 'true';
}

class ArrowAgainApp {
  private save: SaveData = loadSave();
  private readonly debugAllLevels = isAllLevelsDebugEnabled();
  private screen: Screen = 'home';
  private currentLevel = LEVELS[0];
  private pieces: ArrowPiece[] = [];
  private lives = 3;
  private moves = 0;
  private message = '';
  private errorPieceId?: string;
  private hintIds = new Set<string>();
  private exitingPieceIds = new Set<string>();
  private history: PlaySnapshot[] = [];
  private rewardBusy = false;
  private settingsOpen = false;
  private hintsUsed = 0;
  private revivesUsed = 0;
  private result?: ResultState;
  private pendingHardLevel?: LevelData;
  private canvas?: HTMLCanvasElement;
  private mazeSvg?: SVGSVGElement;
  private svg?: SVGSVGElement;
  private boardWrap?: HTMLDivElement;
  private resizeObserver?: ResizeObserver;
  private audio: GameAudio;
  private platform: PlatformBridge;
  private renderQuality: RenderQuality;

  constructor(private root: HTMLDivElement) {
    this.audio = new GameAudio(this.save.musicEnabled, this.save.effectsEnabled);
    this.platform = createPlatformBridge();
    this.renderQuality = this.platform.renderQuality;
    this.applyLanguage();
    this.applyRenderQuality();
    this.installRuntimeBridge();
    window.addEventListener('resize', () => this.paintPlayingBoard());
  }

  async start(): Promise<void> {
    await this.platform.ready();
    this.recordSessionStart();
    this.platform.progress(100);
    this.track('game_start', {
      total_sessions: this.save.totalSessions,
      streak_days: this.save.streakDays,
      unlocked_level: this.save.unlockedLevel,
      total_stars: this.getTotalStars()
    });
    this.render();
  }

  private recordSessionStart(): void {
    const today = this.getLocalDateKey();
    const dayDelta = this.getDateDeltaDays(this.save.lastPlayedDate, today);

    if (this.save.streakDays === 0) {
      this.save.streakDays = 1;
    } else if (dayDelta === 1) {
      this.save.streakDays += 1;
    } else if (dayDelta > 1) {
      this.save.streakDays = 1;
    }

    this.save.lastPlayedDate = today;
    this.save.totalSessions += 1;
    saveGame(this.save);
  }

  private getLocalDateKey(now = new Date()): string {
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getDateDeltaDays(previousDate: string, nextDate: string): number {
    const previous = new Date(`${previousDate}T00:00:00`);
    const next = new Date(`${nextDate}T00:00:00`);
    const diff = next.getTime() - previous.getTime();
    return Number.isFinite(diff) ? Math.round(diff / 86_400_000) : 0;
  }

  private track(event: string, payload: PlatformEventPayload = {}): void {
    try {
      this.platform.track(event, {
        platform: this.platform.name,
        screen: this.screen,
        level: this.currentLevel.id,
        difficulty: this.currentLevel.difficulty,
        ...payload
      });
    } catch {
      // Analytics must never interrupt gameplay.
    }
  }

  private copy(): Copy {
    return COPY[this.save.language];
  }

  private applyLanguage(): void {
    document.documentElement.lang = this.save.language === 'en' ? 'en' : 'zh-CN';
  }

  private render(): void {
    this.resizeObserver?.disconnect();
    this.root.innerHTML = `<main class="app-shell" data-testid="app-shell">${this.renderScreen()}</main>`;
    this.bindScreen();
  }

  private renderScreen(): string {
    if (this.screen === 'levels') {
      return this.debugAllLevels ? this.renderLevels() : this.renderHome();
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
    const c = this.copy();
    const nextLevel = LEVELS[Math.min(this.save.unlockedLevel - 1, LEVELS.length - 1)];
    return `
      <section class="screen home-screen" data-testid="home-screen">
        <header class="top-row">
          <div class="brand">
            <div class="brand-mark" aria-hidden="true">→</div>
            <div>
              <h1>Arrow Again 箭了又箭</h1>
              <p>${c.brandSubtitle}</p>
            </div>
          </div>
          <button class="icon-button" type="button" data-action="toggle-settings" data-testid="settings-button" aria-label="${c.settingsAria}" aria-expanded="${this.settingsOpen}">
            ⚙
          </button>
        </header>
        <div class="home-board">
          <div class="hero-board" aria-hidden="true">
            ${this.renderHeroCells()}
          </div>
          ${this.settingsOpen ? this.renderSettingsPanel() : ''}
          <div class="home-actions">
            <button class="primary-button" type="button" data-action="start" data-testid="start-button">${c.startLevel(nextLevel.id)}</button>
            ${this.debugAllLevels ? `<button class="secondary-button" type="button" data-action="levels" data-testid="levels-button">${c.levelSelect}</button>` : ''}
            <button class="secondary-button" type="button" data-action="feedback" data-testid="home-feedback-button">${c.feedbackSupport}</button>
          </div>
          <p class="retention-line">${this.getHomeRetentionCopy()}</p>
        </div>
      </section>
    `;
  }

  private renderSettingsPanel(): string {
    const c = this.copy();
    return `
      <div class="settings-panel" data-testid="settings-panel">
        <div class="settings-row">
          <span>${c.language}</span>
          <div class="segmented-control" role="group" aria-label="${c.language}">
            ${this.renderLanguageButton('zh', '中文')}
            ${this.renderLanguageButton('en', 'English')}
          </div>
        </div>
        <div class="settings-row">
          <span>${c.music}</span>
          ${this.renderToggleButton('toggle-music', 'music-toggle', this.save.musicEnabled)}
        </div>
        <div class="settings-row">
          <span>${c.effects}</span>
          ${this.renderToggleButton('toggle-effects', 'effects-toggle', this.save.effectsEnabled)}
        </div>
      </div>
    `;
  }

  private renderLanguageButton(language: AppLanguage, label: string): string {
    const active = this.save.language === language;
    return `<button class="segment-button" type="button" data-action="set-language" data-language="${language}" data-testid="language-${language}" aria-pressed="${active}">${label}</button>`;
  }

  private renderToggleButton(action: string, testId: string, enabled: boolean): string {
    const c = this.copy();
    return `
      <button class="toggle-button" type="button" data-action="${action}" data-testid="${testId}" aria-pressed="${enabled}">
        <span class="toggle-track" aria-hidden="true"><span></span></span>
        <strong>${enabled ? c.on : c.off}</strong>
      </button>
    `;
  }

  private getHomeRetentionCopy(): string {
    const c = this.copy();
    if (this.save.totalSessions <= 1) {
      return c.retentionFirst;
    }

    if (this.save.streakDays >= 2) {
      return c.retentionStreak();
    }

    return c.retentionResume();
  }

  private getCompletedLevelCount(): number {
    return Object.values(this.save.starsByLevel).filter((stars) => stars > 0).length;
  }

  private getTotalStars(): number {
    return Object.values(this.save.starsByLevel).reduce((total, stars) => total + stars, 0);
  }

  private renderHeroCells(): string {
    const arrows = ['→', '', '↑', '', '→', '', '↓', '', '←', '', '→', '', '↑', '', '←'];
    return arrows.map((symbol) => `<div class="hero-cell${symbol ? ' hot' : ''}"><span>${symbol || '&nbsp;'}</span></div>`).join('');
  }

  private renderLevels(): string {
    const c = this.copy();
    return `
      <section class="screen level-screen" data-testid="level-screen">
        <header class="top-row">
          <button class="icon-button" type="button" data-action="home" aria-label="${c.backHome}">‹</button>
          <div class="level-title">
            <h1>${c.levelSelectTitle}</h1>
            <p>${c.debugLevelsCopy}</p>
          </div>
          <span class="header-spacer" aria-hidden="true"></span>
        </header>
        <div class="level-grid">
          ${LEVELS.map((level) => this.renderLevelButton(level)).join('')}
        </div>
      </section>
    `;
  }

  private renderLevelButton(level: LevelData): string {
    const c = this.copy();
    const locked = this.isLevelLocked(level);
    const stars = this.save.starsByLevel[String(level.id)] ?? 0;
    const difficultyLabel = this.getDifficultyLabel(level);
    return `
      <button class="level-button" type="button" data-action="play-level" data-level="${level.id}" data-testid="level-${level.id}" ${locked ? 'disabled' : ''}>
        <span class="level-number">${c.levelPrefix(level.id)}</span>
        <span class="level-name">${level.name}</span>
        <span class="level-meta">
          <span class="difficulty-${level.difficulty}">${difficultyLabel}</span>
          <span>${locked ? c.locked : this.renderStars(stars)}</span>
        </span>
      </button>
    `;
  }

  private isLevelLocked(level: LevelData): boolean {
    return !this.debugAllLevels && level.id > this.save.unlockedLevel;
  }

  private getBoardClassName(): string {
    const classes = ['board-wrap'];

    if (this.renderQuality === 'low') {
      classes.push('low-fx-board');
    }

    if (this.renderQuality !== 'high' && this.currentLevel.pieces.length >= 30) {
      classes.push('dense-board');
    }

    return classes.join(' ');
  }

  private applyRenderQuality(): void {
    document.documentElement.dataset.renderQuality = this.renderQuality;
  }

  private installRuntimeBridge(): void {
    window.ArrowAgainRuntime = {
      getRenderQuality: () => this.renderQuality,
      setRenderQuality: (quality) => this.setRenderQuality(quality)
    };
  }

  private setRenderQuality(quality: RenderQuality): RenderQuality {
    const next = normalizeRenderQuality(quality, this.renderQuality);
    if (next === this.renderQuality) {
      return this.renderQuality;
    }

    this.renderQuality = next;
    this.applyRenderQuality();
    this.render();
    return this.renderQuality;
  }

  private getHintActionLabel(): string {
    const c = this.copy();
    if (this.rewardBusy) {
      return c.adPlaying;
    }

    return this.platform.capabilities.rewardedAd ? c.hint : c.hintUnavailable;
  }

  private getReviveActionLabel(): string {
    const c = this.copy();
    if (this.rewardBusy) {
      return c.reviveLoading;
    }

    return this.platform.capabilities.rewardedAd ? c.revive : c.reviveUnavailable;
  }

  private renderPlaying(): string {
    const c = this.copy();
    const available = this.getAvailableActivePieces().length;
    const backAction = this.debugAllLevels ? 'levels' : 'home';
    const backLabel = this.debugAllLevels ? c.levelSelect : c.backHome;
    return `
      <section class="screen game-screen" data-testid="game-screen">
        <header class="game-hud" aria-label="关卡状态">
          <button class="nav-back" type="button" data-action="${backAction}" aria-label="${backLabel}">‹</button>
          <div class="level-stack">
            <h1>${c.levelPrefix(this.currentLevel.id)}</h1>
            <div class="level-dots" aria-hidden="true">
              <span class="active"></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <button class="restart-orb" type="button" data-action="restart" aria-label="${c.restart}">
            <img src="/assets/action-restart.png" alt="" aria-hidden="true" />
          </button>
          <div class="life-pill" data-testid="lives" aria-label="${c.livesAria(this.lives, this.currentLevel.lives)}">
            <img src="/assets/hud-heart.png" alt="" aria-hidden="true" />
            <strong>${this.lives}/${this.currentLevel.lives}</strong>
          </div>
          <div class="move-card" data-testid="moves">
            <span>${c.moves}</span>
            <strong>${this.moves}/${this.currentLevel.targetMoves}</strong>
          </div>
          <div class="available-pill" data-testid="available-count">
            <span>${c.available}</span>
            <strong>${available}</strong>
          </div>
        </header>
        <div class="${this.getBoardClassName()}" data-testid="board">
          <canvas class="board-canvas" aria-hidden="true"></canvas>
          <svg class="maze-layer" aria-hidden="true"></svg>
          <svg class="arrow-layer" role="group" aria-label="箭头棋盘"></svg>
          ${this.currentLevel.tutorial && this.moves === 0 ? `<div class="tutorial-bubble">${c.tutorialBubble}</div><div class="tutorial-hand" aria-hidden="true"></div>` : ''}
        </div>
        <div class="play-footer">
          <p class="board-message" data-testid="board-message">${this.message || c.defaultBoardMessage}</p>
          <div class="game-actions">
            <button class="action-button" type="button" data-action="hint" data-testid="hint-button" ${this.rewardBusy ? 'disabled' : ''}>
              <span class="action-icon"><img src="/assets/action-hint.png" alt="" aria-hidden="true" /></span>
              <span>${this.getHintActionLabel()}</span>
              <span class="hint-badge">3</span>
            </button>
            <button class="action-button" type="button" data-action="undo" data-testid="undo-button" ${this.history.length === 0 || this.rewardBusy ? 'disabled' : ''}>
              <span class="action-icon undo-icon"><img src="/assets/action-restart.png" alt="" aria-hidden="true" /></span>
              <span>${c.undo}</span>
              <span class="tool-badge" data-testid="undo-count" ${this.history.length === 0 ? 'hidden' : ''}>${Math.min(this.history.length, 9)}</span>
            </button>
            <button class="action-button" type="button" data-action="restart" data-testid="restart-button">
              <span class="action-icon"><img src="/assets/action-restart.png" alt="" aria-hidden="true" /></span>
              <span>${c.restart}</span>
            </button>
          </div>
        </div>
      </section>
      ${this.pendingHardLevel ? this.renderHardModal(this.pendingHardLevel) : ''}
    `;
  }

  private renderHardModal(level: LevelData): string {
    const c = this.copy();
    const secondaryAction = this.debugAllLevels ? 'levels' : 'home';
    const secondaryLabel = this.debugAllLevels ? c.viewLevels : c.backHome;
    return `
      <div class="modal-scrim" role="dialog" aria-modal="true" aria-labelledby="hard-title" data-testid="hard-modal">
        <div class="modal">
          <h2 id="hard-title">${c.hardTitle(level.difficulty)}</h2>
          <p>${c.hardWarning(level)}</p>
          <div class="modal-actions">
            <button class="secondary-button" type="button" data-action="${secondaryAction}">${secondaryLabel}</button>
            <button class="primary-button" type="button" data-action="confirm-hard" data-testid="confirm-hard-button">${c.enter}</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderResult(result: ResultState): string {
    const c = this.copy();
    const next = LEVELS.find((level) => level.id === result.level.id + 1);
    const title = result.won ? c.resultWon : c.resultLost;
    const comment = result.won ? this.getResultComment(result.lives) : this.message || c.lostComment(this.pieces.length);
    const finalWonAction = this.debugAllLevels
      ? `<button class="primary-button" type="button" data-action="levels" data-testid="result-levels-button">${c.levelSelect}</button>`
      : `<button class="primary-button" type="button" data-action="home" data-testid="result-home-button">${c.backHome}</button>`;
    return `
      <section class="screen result-screen">
        <div class="result-panel" data-testid="result-screen">
          <div class="brand-mark" style="margin:0 auto 18px" aria-hidden="true">${result.won ? '→' : '↺'}</div>
          <h1>${title}</h1>
          <p>${c.resultLevel(result.level)}</p>
          <div class="stars" aria-label="${c.resultStarsAria(result.stars)}">${this.renderStars(result.stars)}</div>
          <p class="result-stat-line">${comment}</p>
          <p class="result-stat-line">${c.resultStats(result.lives, result.level.lives, result.moves)}</p>
          ${result.won && result.level.achievement ? `<p class="result-stat-line">${c.achievement(result.level.achievement)}</p>` : ''}
          <div class="result-actions">
            <button class="secondary-button" type="button" data-action="retry-result" data-testid="retry-button">${c.retry}</button>
            ${
              result.won && next
                ? `<button class="primary-button" type="button" data-action="next-level" data-testid="next-level-button">${c.nextLevel}</button>`
                : result.won
                  ? finalWonAction
                  : `<button class="primary-button" type="button" data-action="revive-result" data-testid="revive-button" ${this.rewardBusy ? 'disabled' : ''}>${this.getReviveActionLabel()}</button>`
            }
          </div>
          <div class="result-secondary-actions">
            <button class="secondary-button" type="button" data-action="share" data-testid="share-button">${c.share}</button>
            <button class="secondary-button" type="button" data-action="feedback" data-testid="result-feedback-button">${c.report}</button>
          </div>
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
      this.mazeSvg = this.root.querySelector<SVGSVGElement>('.maze-layer') ?? undefined;
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
    this.audio.startMusic();
    this.audio.play('tap');

    if (action === 'home') {
      this.track('screen_home_open', { from_screen: this.screen, screen: 'home' });
      this.screen = 'home';
      this.render();
      return;
    }

    if (action === 'levels') {
      if (!this.debugAllLevels) {
        this.track('screen_levels_blocked', { from_screen: this.screen, screen: 'home' });
        this.pendingHardLevel = undefined;
        this.screen = 'home';
        this.render();
        return;
      }

      this.track('screen_levels_open', { from_screen: this.screen, screen: 'levels' });
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

    if (action === 'toggle-settings') {
      this.settingsOpen = !this.settingsOpen;
      this.track('settings_panel_toggle', { open: this.settingsOpen });
      this.render();
      return;
    }

    if (action === 'set-language') {
      const language = dataset.language === 'en' ? 'en' : 'zh';
      this.save.language = language;
      this.applyLanguage();
      saveGame(this.save);
      this.track('settings_language_change', { language });
      this.render();
      return;
    }

    if (action === 'toggle-music') {
      this.save.musicEnabled = !this.save.musicEnabled;
      this.audio.setMusicEnabled(this.save.musicEnabled);
      if (this.save.musicEnabled) {
        this.audio.startMusic();
      }
      saveGame(this.save);
      this.track('settings_music_toggle', { enabled: this.save.musicEnabled });
      this.render();
      return;
    }

    if (action === 'toggle-effects') {
      this.save.effectsEnabled = !this.save.effectsEnabled;
      this.audio.setEffectsEnabled(this.save.effectsEnabled);
      saveGame(this.save);
      this.track('settings_effects_toggle', { enabled: this.save.effectsEnabled });
      this.render();
      return;
    }

    if (action === 'restart' || action === 'retry-result') {
      this.startLevel(this.currentLevel, true, action === 'retry-result' ? 'retry' : 'restart');
      return;
    }

    if (action === 'undo') {
      this.undoLastMove();
      return;
    }

    if (action === 'hint') {
      void this.showRewardedHint();
      return;
    }

    if (action === 'revive-result') {
      void this.reviveFromReward();
      return;
    }

    if (action === 'feedback') {
      this.openFeedback();
      return;
    }

    if (action === 'confirm-hard' && this.pendingHardLevel) {
      const level = this.pendingHardLevel;
      this.pendingHardLevel = undefined;
      this.prepareLevel(level, true, 'hard_confirm');
      return;
    }

    if (action === 'next-level' && this.result) {
      const resultLevelId = this.result.level.id;
      const next = LEVELS.find((level) => level.id === resultLevelId + 1);
      if (next) {
        this.startLevel(next, false, 'next');
      }
      return;
    }

    if (action === 'share' && this.result) {
      void this.shareResult(this.result);
    }
  }

  private createResultSharePayload(result: ResultState): SharePayload {
    const c = this.copy();
    const title = c.shareTitle;
    const url = window.location.origin && window.location.origin !== 'null' ? window.location.origin : undefined;
    const assetBase = url ?? window.location.href.replace(/\/[^/]*$/, '');
    const text = result.won ? c.shareWon(result.level.id, result.stars, result.moves) : c.shareLost(result.level.id);

    return {
      title,
      text,
      url,
      image: `${assetBase.replace(/\/$/, '')}/social-share.png`,
      data: {
        level: result.level.id,
        stars: result.stars,
        moves: result.moves,
        won: result.won
      }
    };
  }

  private async shareResult(result: ResultState): Promise<void> {
    this.track('share_result_request', {
      won: result.won,
      stars: result.stars,
      moves: result.moves
    });

    try {
      await this.platform.share(this.createResultSharePayload(result));
      this.track('share_result_complete', {
        won: result.won,
        stars: result.stars,
        moves: result.moves
      });
    } catch {
      this.track('share_result_fail', {
        won: result.won,
        stars: result.stars,
        moves: result.moves
      });
    }
  }

  private openFeedback(): void {
    const feedbackAt = new Date().toISOString();
    this.save.feedbackCount += 1;
    this.save.lastFeedbackAt = feedbackAt;
    saveGame(this.save);
    this.track('feedback_open', {
      feedback_count: this.save.feedbackCount,
      result_won: this.result?.won ?? false,
      moves: this.moves,
      lives: this.lives,
      total_sessions: this.save.totalSessions
    });

    const subject = encodeURIComponent(`Arrow Again feedback - level ${this.currentLevel.id}`);
    const body = encodeURIComponent(this.createFeedbackBody(feedbackAt));
    const mailto = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
    const opened = window.open(mailto, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = mailto;
    }
  }

  private createFeedbackBody(feedbackAt: string): string {
    const resultLine = this.result
      ? `${this.result.won ? 'won' : 'lost'}, stars ${this.result.stars}, moves ${this.result.moves}`
      : 'not on result screen';

    return [
      'Thanks for helping improve Arrow Again.',
      '',
      'What happened?',
      '',
      '',
      'Context',
      `Time: ${feedbackAt}`,
      `Platform: ${this.platform.name}`,
      `Screen: ${this.screen}`,
      `Level: ${this.currentLevel.id} (${this.currentLevel.difficulty})`,
      `Result: ${resultLine}`,
      `Lives: ${this.lives}/${this.currentLevel.lives}`,
      `Moves: ${this.moves}/${this.currentLevel.targetMoves}`,
      `Unlocked level: ${this.save.unlockedLevel}`,
      `Total stars: ${this.getTotalStars()}`,
      `Sessions: ${this.save.totalSessions}`,
      `Streak days: ${this.save.streakDays}`,
      `Support page: ${supportUrl}`,
      `User agent: ${navigator.userAgent}`
    ].join('\n');
  }

  private startLevel(level: LevelData, skipWarning = false, source = 'start'): void {
    this.currentLevel = level;
    if (!skipWarning && level.hardWarning) {
      this.pendingHardLevel = level;
      this.screen = 'playing';
      this.track('hard_level_prompt', {
        source,
        target_level: level.id,
        target_difficulty: level.difficulty
      });
      this.prepareLevel(level, false);
      return;
    }

    this.prepareLevel(level, true, source);
  }

  private prepareLevel(level: LevelData, clearModal = true, source = 'start'): void {
    this.currentLevel = level;
    this.pieces = level.pieces.map((piece) => ({ ...piece }));
    this.lives = level.lives;
    this.moves = 0;
    this.message = level.tutorial ? this.copy().tutorialMessage : '';
    this.errorPieceId = undefined;
    this.hintIds.clear();
    this.exitingPieceIds.clear();
    this.history = [];
    this.rewardBusy = false;
    this.hintsUsed = 0;
    this.revivesUsed = 0;
    this.result = undefined;
    if (clearModal) {
      this.pendingHardLevel = undefined;
      this.track('level_start', {
        source,
        target_moves: level.targetMoves,
        pieces: level.pieces.length,
        lives: level.lives
      });
    }
    this.screen = 'playing';
    this.render();
  }

  private paintPlayingBoard(): void {
    const metrics = this.getMetrics();
    if (!metrics) {
      return;
    }

    this.applyBoardVisualScale(metrics);
    this.drawBoard(metrics);
    this.drawMazeRoutes(metrics);
    this.drawArrows(metrics);
    this.positionTutorialHand(metrics);
  }

  private getMetrics(): BoardMetrics | undefined {
    if (!this.boardWrap) {
      return undefined;
    }

    const rect = this.boardWrap.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return undefined;
    }

    const cellBase = Math.min(rect.width / this.currentLevel.cols, rect.height / this.currentLevel.rows);
    const horizontalInset = Math.max(34, Math.min(48, cellBase * 0.76, rect.width * 0.13));
    const verticalInset = Math.max(30, Math.min(48, cellBase * 0.7, rect.height * 0.09));
    const playableWidth = Math.max(1, rect.width - horizontalInset * 2);
    const playableHeight = Math.max(1, rect.height - verticalInset * 2);
    const cellWidth = playableWidth / this.currentLevel.cols;
    const cellHeight = playableHeight / this.currentLevel.rows;

    return {
      width: rect.width,
      height: rect.height,
      cellWidth,
      cellHeight,
      centerX: (col: number) => horizontalInset + (col + 0.5) * cellWidth,
      centerY: (row: number) => verticalInset + (row + 0.5) * cellHeight
    };
  }

  private applyBoardVisualScale(metrics: BoardMetrics): void {
    if (!this.boardWrap) {
      return;
    }

    const cell = Math.min(metrics.cellWidth, metrics.cellHeight);
    const density = this.currentLevel.pieces.length / Math.max(1, this.currentLevel.rows * this.currentLevel.cols);
    const denseScale = this.currentLevel.pieces.length >= 30 || cell < 34 || density > 0.34 ? 0.78 : 1;
    const stroke = (value: number) => `${Math.round(value * 10) / 10}px`;

    this.boardWrap.style.setProperty('--maze-ambient-width', stroke(this.clamp(cell * 0.62 * denseScale, 13, 31)));
    this.boardWrap.style.setProperty('--maze-rail-width', stroke(this.clamp(cell * 0.74 * denseScale, 15, 33)));
    this.boardWrap.style.setProperty('--maze-highlight-width', stroke(this.clamp(cell * 0.18 * denseScale, 3.5, 9)));
    this.boardWrap.style.setProperty('--maze-core-width', stroke(this.clamp(cell * 0.34 * denseScale, 6, 16)));
    this.boardWrap.style.setProperty('--maze-flow-width', stroke(this.clamp(cell * 0.18 * denseScale, 3.8, 8)));
  }

  private drawBoard(metrics = this.getMetrics()): void {
    if (!this.canvas) {
      return;
    }

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

    const width = metrics.width;
    const height = metrics.height;
    const radius = Math.min(36, Math.max(24, width * 0.075));
    const inset = Math.max(11, Math.min(width, height) * 0.036);
    const innerRadius = Math.max(18, radius - inset * 0.48);

    const trayGradient = ctx.createLinearGradient(0, 0, 0, height);
    trayGradient.addColorStop(0, '#fbfdff');
    trayGradient.addColorStop(0.46, '#edf7fb');
    trayGradient.addColorStop(1, '#b4ccdc');
    ctx.fillStyle = trayGradient;
    this.roundRect(ctx, 0.5, 0.5, width - 1, height - 1, radius);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    this.roundRect(ctx, 2.5, 2.5, width - 5, height - 5, radius - 2);
    ctx.stroke();

    ctx.lineWidth = Math.max(8, inset * 0.68);
    ctx.strokeStyle = 'rgba(70, 103, 128, 0.16)';
    this.roundRect(ctx, inset * 0.42, inset * 0.7, width - inset * 0.84, height - inset * 0.9, radius - 2);
    ctx.stroke();

    const fieldX = inset;
    const fieldY = inset;
    const fieldWidth = width - inset * 2;
    const fieldHeight = height - inset * 2;

    ctx.save();
    ctx.shadowColor = 'rgba(55, 78, 96, 0.16)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = 'rgba(199, 217, 229, 0.42)';
    this.roundRect(ctx, fieldX, fieldY + 2, fieldWidth, fieldHeight - 1, innerRadius);
    ctx.fill();
    ctx.restore();

    const fieldGradient = ctx.createLinearGradient(0, fieldY, 0, fieldY + fieldHeight);
    fieldGradient.addColorStop(0, 'rgba(252, 254, 255, 0.98)');
    fieldGradient.addColorStop(0.52, 'rgba(230, 242, 249, 0.96)');
    fieldGradient.addColorStop(1, 'rgba(207, 224, 235, 0.94)');
    ctx.fillStyle = fieldGradient;
    this.roundRect(ctx, fieldX, fieldY, fieldWidth, fieldHeight, innerRadius);
    ctx.fill();

    ctx.save();
    this.roundRect(ctx, fieldX + 1, fieldY + 1, fieldWidth - 2, fieldHeight - 2, innerRadius - 1);
    ctx.clip();
    const socketSize = Math.min(metrics.cellWidth * 0.5, metrics.cellHeight * 0.34, 48);
    const socketRadius = Math.max(10, socketSize * 0.24);

    for (let row = 0; row < this.currentLevel.rows; row += 1) {
      for (let col = 0; col < this.currentLevel.cols; col += 1) {
        const x = metrics.centerX(col) - socketSize / 2;
        const y = metrics.centerY(row) - socketSize / 2;
        ctx.save();
        ctx.shadowColor = 'rgba(61, 86, 105, 0.08)';
        ctx.shadowBlur = 7;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = 'rgba(230, 240, 247, 0.3)';
        this.roundRect(ctx, x, y, socketSize, socketSize, socketRadius);
        ctx.fill();
        ctx.restore();

        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.46)';
        this.roundRect(ctx, x + 0.5, y + 0.5, socketSize - 1, socketSize - 1, socketRadius);
        ctx.stroke();
      }
    }
    ctx.restore();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
    this.roundRect(ctx, fieldX + 1, fieldY + 1, fieldWidth - 2, fieldHeight - 2, innerRadius - 1);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(74, 102, 123, 0.1)';
    this.roundRect(ctx, fieldX, fieldY, fieldWidth, fieldHeight, innerRadius);
    ctx.stroke();
  }

  private drawMazeRoutes(metrics = this.getMetrics()): void {
    if (!this.mazeSvg) {
      return;
    }

    if (!metrics) {
      return;
    }

    this.mazeSvg.setAttribute('viewBox', `0 0 ${metrics.width} ${metrics.height}`);
    this.mazeSvg.innerHTML = '';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <filter id="route-shadow" x="-24%" y="-24%" width="148%" height="148%">
        <feDropShadow dx="0" dy="8" stdDeviation="4.5" flood-color="#2c4a60" flood-opacity="0.18" />
        <feDropShadow dx="0" dy="-4" stdDeviation="2.4" flood-color="#ffffff" flood-opacity="0.92" />
      </filter>
      <filter id="route-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4.8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    `;
    this.mazeSvg.append(defs);

    const activePieces = this.getActivePieces();
    const availableIds = new Set(getAvailablePieces(activePieces, this.currentLevel).map((piece) => piece.id));
    const ambientGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const railGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const highlightGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const coreGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const flowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const gateGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    ambientGroup.setAttribute('class', 'maze-ambient-group');
    railGroup.setAttribute('class', 'maze-rail-group');
    flowGroup.setAttribute('class', 'maze-flow-group');
    this.mazeSvg.append(ambientGroup, railGroup, highlightGroup, coreGroup, flowGroup, gateGroup);
    this.appendAmbientMaze(ambientGroup, metrics);
    const showFreeTrajectoryHints = this.shouldShowFreeTrajectoryHints();

    for (const piece of activePieces) {
      const path = this.createMazePath(piece, metrics);
      const color = this.getRouteColor(piece);
      const isAvailable = availableIds.has(piece.id);
      const isRouteHighlighted = (showFreeTrajectoryHints && isAvailable) || this.hintIds.has(piece.id);

      this.appendMazePath(railGroup, path, 'maze-rail', color, isRouteHighlighted);
      this.appendMazePath(highlightGroup, path, 'maze-highlight', color, isRouteHighlighted);
      this.appendMazePath(coreGroup, path, 'maze-core', color, isRouteHighlighted);

      if (isRouteHighlighted) {
        this.appendMazePath(flowGroup, path, 'maze-flow', color, true, this.getFlowStyle(piece));
      }

      if (isRouteHighlighted) {
        this.appendExitGate(gateGroup, piece, metrics, color);
      }
    }
  }

  private shouldShowFreeTrajectoryHints(): boolean {
    return this.currentLevel.id <= freeTrajectoryHintLevelLimit;
  }

  private appendAmbientMaze(group: SVGGElement, metrics: BoardMetrics): void {
    const w = metrics.width;
    const h = metrics.height;
    const paths = [
      `M ${w * 0.08} ${h * 0.16} L ${w * 0.36} ${h * 0.16} Q ${w * 0.44} ${h * 0.16} ${w * 0.44} ${h * 0.25} L ${w * 0.44} ${h * 0.44} Q ${w * 0.44} ${h * 0.52} ${w * 0.52} ${h * 0.52} L ${w * 0.84} ${h * 0.52}`,
      `M ${w * 0.16} ${h * 0.30} L ${w * 0.30} ${h * 0.30} Q ${w * 0.38} ${h * 0.30} ${w * 0.38} ${h * 0.38} L ${w * 0.38} ${h * 0.70} Q ${w * 0.38} ${h * 0.78} ${w * 0.30} ${h * 0.78} L ${w * 0.12} ${h * 0.78}`,
      `M ${w * 0.68} ${h * 0.14} L ${w * 0.82} ${h * 0.14} Q ${w * 0.92} ${h * 0.14} ${w * 0.92} ${h * 0.24} L ${w * 0.92} ${h * 0.72} Q ${w * 0.92} ${h * 0.84} ${w * 0.80} ${h * 0.84} L ${w * 0.58} ${h * 0.84}`,
      `M ${w * 0.10} ${h * 0.48} L ${w * 0.28} ${h * 0.48} Q ${w * 0.36} ${h * 0.48} ${w * 0.36} ${h * 0.56} L ${w * 0.36} ${h * 0.60} Q ${w * 0.36} ${h * 0.68} ${w * 0.44} ${h * 0.68} L ${w * 0.66} ${h * 0.68}`,
      `M ${w * 0.18} ${h * 0.92} L ${w * 0.18} ${h * 0.68} Q ${w * 0.18} ${h * 0.58} ${w * 0.28} ${h * 0.58} L ${w * 0.52} ${h * 0.58} Q ${w * 0.62} ${h * 0.58} ${w * 0.62} ${h * 0.48} L ${w * 0.62} ${h * 0.24}`,
      `M ${w * 0.74} ${h * 0.92} L ${w * 0.74} ${h * 0.62} Q ${w * 0.74} ${h * 0.54} ${w * 0.66} ${h * 0.54} L ${w * 0.54} ${h * 0.54} Q ${w * 0.46} ${h * 0.54} ${w * 0.46} ${h * 0.62} L ${w * 0.46} ${h * 0.92}`
    ];

    paths.forEach((path, index) => {
      const route = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      route.setAttribute('class', 'maze-ambient');
      route.setAttribute('d', path);
      route.setAttribute('style', `--ambient-delay: ${index * 120}ms`);
      group.append(route);
    });
  }

  private drawArrows(metrics = this.getMetrics()): void {
    if (!this.svg) {
      return;
    }

    if (!metrics) {
      return;
    }

    this.svg.setAttribute('viewBox', `0 0 ${metrics.width} ${metrics.height}`);
    this.svg.innerHTML = '';
    const activePieces = this.getActivePieces();
    const availableIds = new Set(getAvailablePieces(activePieces, this.currentLevel).map((piece) => piece.id));
    const tutorialTarget = this.currentLevel.tutorial && this.moves === 0 ? getAvailablePieces(activePieces, this.currentLevel)[0]?.id : undefined;

    for (const piece of activePieces) {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const size = Math.min(metrics.cellWidth * 0.98, metrics.cellHeight * 0.68);
      const radius = Math.max(11, size * 0.2);
      const x = metrics.centerX(piece.col);
      const y = metrics.centerY(piece.row);
      const classes = ['arrow-piece', `dir-${piece.dir}`];
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
      group.setAttribute('data-testid', `piece-${piece.id}`);
      group.setAttribute('data-row', String(piece.row));
      group.setAttribute('data-col', String(piece.col));
      group.setAttribute('data-dir', piece.dir);
      group.setAttribute('role', 'button');
      group.setAttribute('tabindex', '0');
      group.setAttribute('aria-label', `第 ${piece.row + 1} 行第 ${piece.col + 1} 列，方向 ${piece.dir}`);
      group.setAttribute('transform', `translate(${x}, ${y})`);

      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      ring.setAttribute('class', 'piece-ring');
      ring.setAttribute('x', `${-size / 2 - 2}`);
      ring.setAttribute('y', `${-size / 2 - 2}`);
      ring.setAttribute('width', `${size + 4}`);
      ring.setAttribute('height', `${size + 4}`);
      ring.setAttribute('rx', `${radius}`);

      const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      hitbox.setAttribute('class', 'piece-hitbox');
      hitbox.setAttribute('x', `${-size / 2 - 4}`);
      hitbox.setAttribute('y', `${-size / 2 - 4}`);
      hitbox.setAttribute('width', `${size + 8}`);
      hitbox.setAttribute('height', `${size + 8}`);
      hitbox.setAttribute('rx', `${radius}`);

      const fallbackPiece = this.createFallbackPiece(piece, size, radius);
      const tileImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      const assetPath = this.getPieceAsset(piece.dir);
      tileImage.setAttribute('class', 'piece-image');
      tileImage.addEventListener('load', () => {
        fallbackPiece.style.display = 'none';
      });
      tileImage.addEventListener('error', () => {
        tileImage.style.display = 'none';
        fallbackPiece.style.display = '';
      });
      tileImage.setAttribute('x', `${-size / 2}`);
      tileImage.setAttribute('y', `${-size / 2}`);
      tileImage.setAttribute('width', `${size}`);
      tileImage.setAttribute('height', `${size}`);
      tileImage.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      tileImage.setAttribute('href', assetPath);
      tileImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', assetPath);

      const body = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      body.setAttribute('class', 'piece-body');
      body.append(hitbox, fallbackPiece, ring, tileImage);
      group.append(body);
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

  private appendMazePath(group: SVGGElement, path: string, className: string, color: string, isHighlighted: boolean, extraStyle = ''): void {
    const route = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    route.setAttribute('class', `${className}${isHighlighted ? ' available' : ''}`);
    route.setAttribute('d', path);
    route.setAttribute('style', `--route-color: ${color}; ${extraStyle}`);
    group.append(route);
  }

  private getPieceAsset(direction: ArrowPiece['dir']): string {
    return `/assets/arrow-${direction}.png`;
  }

  private createFallbackPiece(piece: ArrowPiece, size: number, radius: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const color = this.getRouteColor(piece);
    group.setAttribute('class', 'piece-fallback');
    group.setAttribute('aria-hidden', 'true');

    const base = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    base.setAttribute('x', `${-size / 2}`);
    base.setAttribute('y', `${-size / 2}`);
    base.setAttribute('width', `${size}`);
    base.setAttribute('height', `${size}`);
    base.setAttribute('rx', `${radius}`);
    base.setAttribute('fill', color);
    base.setAttribute('stroke', 'rgba(255, 255, 255, 0.72)');
    base.setAttribute('stroke-width', `${Math.max(2, size * 0.045)}`);

    const shine = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    shine.setAttribute('x', `${-size * 0.32}`);
    shine.setAttribute('y', `${-size * 0.34}`);
    shine.setAttribute('width', `${size * 0.42}`);
    shine.setAttribute('height', `${size * 0.16}`);
    shine.setAttribute('rx', `${size * 0.08}`);
    shine.setAttribute('fill', 'rgba(255, 255, 255, 0.32)');

    const arrowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    arrowGroup.setAttribute('transform', `rotate(${DIRECTION_ANGLE[piece.dir]})`);

    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute(
      'd',
      `M ${-size * 0.22} 0 H ${size * 0.18} M ${size * 0.04} ${-size * 0.14} L ${size * 0.2} 0 L ${size * 0.04} ${size * 0.14}`
    );
    arrow.setAttribute('fill', 'none');
    arrow.setAttribute('stroke', '#ffffff');
    arrow.setAttribute('stroke-width', `${Math.max(4, size * 0.13)}`);
    arrow.setAttribute('stroke-linecap', 'round');
    arrow.setAttribute('stroke-linejoin', 'round');

    arrowGroup.append(arrow);
    group.append(base, shine, arrowGroup);
    return group;
  }

  private getFlowStyle(piece: ArrowPiece): string {
    const seed = (piece.row * 17 + piece.col * 29 + this.currentLevel.id * 11) % 100;
    const duration = 1620 + (seed % 5) * 90;
    const delay = -((seed * 37) % duration);
    return `--flow-duration: ${duration}ms; --flow-delay: ${delay}ms;`;
  }

  private appendExitGate(group: SVGGElement, piece: ArrowPiece, metrics: BoardMetrics, color: string): void {
    const gate = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const size = Math.min(metrics.cellWidth, metrics.cellHeight);
    const gateWidth = size * 0.66;
    const gateHeight = size * 0.24;
    const post = gateHeight * 0.74;
    const badgeOffset = size * 0.12;
    const badgeRadius = size * 0.16;
    const x = metrics.centerX(piece.col);
    const y = metrics.centerY(piece.row);
    let plateX = x - gateWidth / 2;
    let plateY = y - gateHeight / 2;
    let badgeX = x;
    let badgeY = y;
    let rotation = 0;
    let symbol = '→';

    if (piece.dir === 'up') {
      plateY = 2;
      badgeY = -badgeOffset;
      symbol = '↑';
    } else if (piece.dir === 'down') {
      plateY = metrics.height - gateHeight - 2;
      badgeY = metrics.height + badgeOffset;
      symbol = '↓';
    } else if (piece.dir === 'left') {
      plateX = 2;
      plateY = y - gateWidth / 2;
      badgeX = -badgeOffset;
      rotation = 90;
      symbol = '←';
    } else {
      plateX = metrics.width - gateHeight - 2;
      plateY = y - gateWidth / 2;
      badgeX = metrics.width + badgeOffset;
      rotation = 90;
      symbol = '→';
    }

    gate.setAttribute('class', 'exit-gate');
    gate.setAttribute('style', `--route-color: ${color}`);
    gate.setAttribute('aria-hidden', 'true');

    const plate = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    plate.setAttribute('class', 'exit-gate-plate');
    plate.setAttribute('x', `${plateX}`);
    plate.setAttribute('y', `${plateY}`);
    plate.setAttribute('width', `${rotation === 0 ? gateWidth : gateHeight}`);
    plate.setAttribute('height', `${rotation === 0 ? gateHeight : gateWidth}`);
    plate.setAttribute('rx', `${gateHeight / 2}`);

    const lip = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    lip.setAttribute('class', 'exit-gate-lip');
    lip.setAttribute('x', `${plateX + (rotation === 0 ? gateWidth * 0.12 : gateHeight * 0.2)}`);
    lip.setAttribute('y', `${plateY + (rotation === 0 ? gateHeight * 0.18 : gateWidth * 0.12)}`);
    lip.setAttribute('width', `${rotation === 0 ? gateWidth * 0.76 : gateHeight * 0.6}`);
    lip.setAttribute('height', `${rotation === 0 ? gateHeight * 0.22 : gateWidth * 0.76}`);
    lip.setAttribute('rx', `${gateHeight * 0.14}`);

    const firstPost = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const secondPost = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    firstPost.setAttribute('class', 'exit-gate-post');
    secondPost.setAttribute('class', 'exit-gate-post');
    if (rotation === 0) {
      firstPost.setAttribute('x', `${plateX - post * 0.45}`);
      firstPost.setAttribute('y', `${plateY - gateHeight * 0.34}`);
      firstPost.setAttribute('width', `${post}`);
      firstPost.setAttribute('height', `${gateHeight * 1.68}`);
      secondPost.setAttribute('x', `${plateX + gateWidth - post * 0.55}`);
      secondPost.setAttribute('y', `${plateY - gateHeight * 0.34}`);
      secondPost.setAttribute('width', `${post}`);
      secondPost.setAttribute('height', `${gateHeight * 1.68}`);
    } else {
      firstPost.setAttribute('x', `${plateX - gateHeight * 0.34}`);
      firstPost.setAttribute('y', `${plateY - post * 0.45}`);
      firstPost.setAttribute('width', `${gateHeight * 1.68}`);
      firstPost.setAttribute('height', `${post}`);
      secondPost.setAttribute('x', `${plateX - gateHeight * 0.34}`);
      secondPost.setAttribute('y', `${plateY + gateWidth - post * 0.55}`);
      secondPost.setAttribute('width', `${gateHeight * 1.68}`);
      secondPost.setAttribute('height', `${post}`);
    }
    firstPost.setAttribute('rx', `${post * 0.22}`);
    secondPost.setAttribute('rx', `${post * 0.22}`);

    const badge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    badge.setAttribute('class', 'exit-arrow-badge');
    badge.setAttribute('cx', `${badgeX}`);
    badge.setAttribute('cy', `${badgeY}`);
    badge.setAttribute('r', `${badgeRadius}`);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('class', 'exit-arrow-symbol');
    label.setAttribute('x', `${badgeX}`);
    label.setAttribute('y', `${badgeY}`);
    label.textContent = symbol;

    gate.append(firstPost, secondPost, plate, lip, badge, label);
    group.append(gate);
  }

  private createMazePath(piece: ArrowPiece, metrics: BoardMetrics): string {
    const x = metrics.centerX(piece.col);
    const y = metrics.centerY(piece.row);
    const cell = Math.min(metrics.cellWidth, metrics.cellHeight);
    const rawLane = this.getLaneOffset(piece);
    const lane = rawLane === 0 ? ((piece.row + piece.col + this.currentLevel.id) % 2 === 0 ? -0.75 : 0.75) : rawLane;
    const lateral = lane * cell * 0.28;
    const outerPad = cell * 0.22;
    const innerPad = outerPad * 2.2;
    const minTurnSpace = cell * 1.45;
    const minLaneShift = cell * 0.32;
    const radius = cell * 0.42;

    if (piece.dir === 'up') {
      const laneX = this.clamp(x + lateral, innerPad, metrics.width - innerPad);
      const edgeY = outerPad * 1.16;
      const forwardSpace = y - edgeY;
      if (forwardSpace < minTurnSpace || Math.abs(laneX - x) < minLaneShift) {
        return this.roundedPolylinePath(
          [
            { x, y },
            { x, y: -outerPad }
          ],
          radius
        );
      }

      const lead = this.clamp(forwardSpace * 0.3, cell * 0.7, cell * 1.05);
      const exitApproachY = this.clamp(edgeY + lead, edgeY + cell * 0.34, y - lead);
      return this.roundedPolylinePath(
        [
          { x, y },
          { x, y: y - lead },
          { x: laneX, y: y - lead },
          { x: laneX, y: exitApproachY },
          { x, y: exitApproachY },
          { x, y: -outerPad }
        ],
        radius
      );
    }

    if (piece.dir === 'down') {
      const laneX = this.clamp(x + lateral, innerPad, metrics.width - innerPad);
      const edgeY = metrics.height - outerPad * 1.16;
      const forwardSpace = edgeY - y;
      if (forwardSpace < minTurnSpace || Math.abs(laneX - x) < minLaneShift) {
        return this.roundedPolylinePath(
          [
            { x, y },
            { x, y: metrics.height + outerPad }
          ],
          radius
        );
      }

      const lead = this.clamp(forwardSpace * 0.3, cell * 0.7, cell * 1.05);
      const exitApproachY = this.clamp(edgeY - lead, y + lead, edgeY - cell * 0.34);
      return this.roundedPolylinePath(
        [
          { x, y },
          { x, y: y + lead },
          { x: laneX, y: y + lead },
          { x: laneX, y: exitApproachY },
          { x, y: exitApproachY },
          { x, y: metrics.height + outerPad }
        ],
        radius
      );
    }

    if (piece.dir === 'left') {
      const laneY = this.clamp(y + lateral, innerPad, metrics.height - innerPad);
      const edgeX = outerPad * 1.16;
      const forwardSpace = x - edgeX;
      if (forwardSpace < minTurnSpace || Math.abs(laneY - y) < minLaneShift) {
        return this.roundedPolylinePath(
          [
            { x, y },
            { x: -outerPad, y }
          ],
          radius
        );
      }

      const lead = this.clamp(forwardSpace * 0.3, cell * 0.7, cell * 1.05);
      const exitApproachX = this.clamp(edgeX + lead, edgeX + cell * 0.34, x - lead);
      return this.roundedPolylinePath(
        [
          { x, y },
          { x: x - lead, y },
          { x: x - lead, y: laneY },
          { x: exitApproachX, y: laneY },
          { x: exitApproachX, y },
          { x: -outerPad, y }
        ],
        radius
      );
    }

    const laneY = this.clamp(y + lateral, innerPad, metrics.height - innerPad);
    const edgeX = metrics.width - outerPad * 1.16;
    const forwardSpace = edgeX - x;
    if (forwardSpace < minTurnSpace || Math.abs(laneY - y) < minLaneShift) {
      return this.roundedPolylinePath(
        [
          { x, y },
          { x: metrics.width + outerPad, y }
        ],
        radius
      );
    }

    const lead = this.clamp(forwardSpace * 0.3, cell * 0.7, cell * 1.05);
    const exitApproachX = this.clamp(edgeX - lead, x + lead, edgeX - cell * 0.34);
    return this.roundedPolylinePath(
      [
        { x, y },
        { x: x + lead, y },
        { x: x + lead, y: laneY },
        { x: exitApproachX, y: laneY },
        { x: exitApproachX, y },
        { x: metrics.width + outerPad, y }
      ],
      radius
    );
  }

  private roundedPolylinePath(points: Point[], radius: number): string {
    const filtered = points.filter((point, index) => {
      const previous = points[index - 1];
      return !previous || Math.hypot(point.x - previous.x, point.y - previous.y) > 0.5;
    });

    if (filtered.length === 0) {
      return '';
    }

    if (filtered.length === 1) {
      return `M ${filtered[0].x} ${filtered[0].y}`;
    }

    const commands = [`M ${filtered[0].x} ${filtered[0].y}`];
    for (let index = 1; index < filtered.length - 1; index += 1) {
      const previous = filtered[index - 1];
      const current = filtered[index];
      const next = filtered[index + 1];
      const previousLength = Math.hypot(current.x - previous.x, current.y - previous.y);
      const nextLength = Math.hypot(next.x - current.x, next.y - current.y);
      const cornerRadius = Math.min(radius, previousLength * 0.42, nextLength * 0.42);

      if (cornerRadius < 1) {
        commands.push(`L ${current.x} ${current.y}`);
        continue;
      }

      const entry = {
        x: current.x - ((current.x - previous.x) / previousLength) * cornerRadius,
        y: current.y - ((current.y - previous.y) / previousLength) * cornerRadius
      };
      const exit = {
        x: current.x + ((next.x - current.x) / nextLength) * cornerRadius,
        y: current.y + ((next.y - current.y) / nextLength) * cornerRadius
      };
      commands.push(`L ${entry.x} ${entry.y}`);
      commands.push(`Q ${current.x} ${current.y} ${exit.x} ${exit.y}`);
    }

    const last = filtered[filtered.length - 1];
    commands.push(`L ${last.x} ${last.y}`);
    return commands.join(' ');
  }

  private getLaneOffset(piece: ArrowPiece): number {
    return ((piece.row * 3 + piece.col * 5 + this.currentLevel.id) % 5) - 2;
  }

  private getRouteColor(piece: ArrowPiece): string {
    const colors: Record<ArrowPiece['dir'], string> = {
      up: '#2d9cdb',
      right: '#27ae60',
      down: '#f2c94c',
      left: '#eb5757'
    };
    return colors[piece.dir];
  }

  private positionTutorialHand(metrics = this.getMetrics()): void {
    const hand = this.root.querySelector<HTMLDivElement>('.tutorial-hand');
    const bubble = this.root.querySelector<HTMLDivElement>('.tutorial-bubble');
    if (!hand || !metrics || !this.boardWrap) {
      return;
    }

    const target = this.getAvailableActivePieces()[0];
    if (!target) {
      hand.remove();
      return;
    }

    hand.style.left = `${metrics.centerX(target.col)}px`;
    hand.style.top = `${metrics.centerY(target.row)}px`;

    if (bubble) {
      const bubbleX = this.clamp(metrics.centerX(target.col), metrics.cellWidth * 0.8, metrics.width - metrics.cellWidth * 0.8);
      const targetY = metrics.centerY(target.row);
      const placeBelow = targetY < metrics.cellHeight * 1.25;
      const bubbleY = placeBelow ? targetY + metrics.cellHeight * 0.42 : targetY - metrics.cellHeight * 0.58;
      bubble.style.left = `${bubbleX}px`;
      bubble.style.top = `${this.clamp(bubbleY, 12, metrics.height - 44)}px`;
      bubble.style.transform = placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)';
    }
  }

  private tryShoot(pieceId: string, element: SVGGElement, metrics: BoardMetrics): void {
    if (this.pendingHardLevel || this.rewardBusy || this.exitingPieceIds.has(pieceId)) {
      return;
    }

    const piece = this.pieces.find((candidate) => candidate.id === pieceId);
    if (!piece) {
      return;
    }

    this.hintIds.clear();
    this.pushHistory();
    this.moves += 1;

    if (!isPathClear(piece, this.getActivePieces(), this.currentLevel)) {
      this.lives -= 1;
      this.errorPieceId = piece.id;
      this.message = this.copy().blockedMessage;
      this.audio.play('blocked');
      this.platform.haptic([30, 40, 30]);
      this.track('level_blocked_move', {
        moves: this.moves,
        lives: Math.max(0, this.lives),
        remaining_pieces: this.pieces.length,
        piece_dir: piece.dir
      });
      this.refreshPlayingUi();
      if (this.lives <= 0) {
        window.setTimeout(() => this.finishLevel(false), 260);
      } else {
        window.setTimeout(() => {
          this.errorPieceId = undefined;
          this.refreshPlayingUi();
        }, 260);
      }
      return;
    }

    this.exitingPieceIds.add(piece.id);
    this.message = this.copy().moveMessage;
    this.audio.play('move');
    this.platform.haptic(18);
    this.refreshPlayingUi();
    void this.animateExit(piece, element, metrics).then(() => {
      this.pieces = this.pieces.filter((candidate) => candidate.id !== piece.id);
      this.exitingPieceIds.delete(piece.id);
      element.remove();
      this.errorPieceId = undefined;
      if (this.pieces.length === 0 && this.exitingPieceIds.size === 0) {
        this.finishLevel(true);
      } else {
        this.refreshPlayingUi();
      }
    });
  }

  private getActivePieces(): ArrowPiece[] {
    return this.pieces.filter((piece) => !this.exitingPieceIds.has(piece.id));
  }

  private pushHistory(): void {
    this.history.push({
      pieces: this.pieces.map((piece) => ({ ...piece })),
      lives: this.lives,
      moves: this.moves
    });

    if (this.history.length > 9) {
      this.history.shift();
    }
  }

  private undoLastMove(): void {
    if (this.rewardBusy || this.exitingPieceIds.size > 0 || this.screen !== 'playing') {
      return;
    }

    const snapshot = this.history.pop();
    if (!snapshot) {
      return;
    }

    this.pieces = snapshot.pieces.map((piece) => ({ ...piece }));
    this.lives = snapshot.lives;
    this.moves = snapshot.moves;
    this.message = this.copy().undoMessage;
    this.errorPieceId = undefined;
    this.hintIds.clear();
    this.track('level_undo', {
      moves: this.moves,
      lives: this.lives,
      remaining_pieces: this.pieces.length
    });
    this.render();
  }

  private getAvailableActivePieces(): ArrowPiece[] {
    return getAvailablePieces(this.getActivePieces(), this.currentLevel);
  }

  private refreshPlayingUi(): void {
    if (this.screen !== 'playing') {
      return;
    }

    const lives = this.root.querySelector<HTMLElement>('[data-testid="lives"]');
    if (lives) {
      lives.setAttribute('aria-label', this.copy().livesAria(this.lives, this.currentLevel.lives));
      const count = lives.querySelector('strong');
      if (count) {
        count.textContent = `${this.lives}/${this.currentLevel.lives}`;
      }
    }

    const moves = this.root.querySelector<HTMLElement>('[data-testid="moves"]');
    if (moves) {
      const value = moves.querySelector('strong');
      if (value) {
        value.textContent = `${this.moves}/${this.currentLevel.targetMoves}`;
      }
    }

    const availableCount = this.root.querySelector<HTMLElement>('[data-testid="available-count"]');
    if (availableCount) {
      const value = availableCount.querySelector('strong');
      if (value) {
        value.textContent = `${this.getAvailableActivePieces().length}`;
      }
    }

    const message = this.root.querySelector<HTMLElement>('[data-testid="board-message"]');
    if (message) {
      message.textContent = this.message || this.copy().defaultBoardMessage;
    }

    const undoButton = this.root.querySelector<HTMLButtonElement>('[data-testid="undo-button"]');
    if (undoButton) {
      undoButton.disabled = this.history.length === 0 || this.rewardBusy || this.exitingPieceIds.size > 0;
    }

    const undoCount = this.root.querySelector<HTMLElement>('[data-testid="undo-count"]');
    if (undoCount) {
      undoCount.hidden = this.history.length === 0;
      undoCount.textContent = `${Math.min(this.history.length, 9)}`;
    }

    if (!this.currentLevel.tutorial || this.moves > 0) {
      this.root.querySelector('.tutorial-bubble')?.remove();
      this.root.querySelector('.tutorial-hand')?.remove();
    }

    const metrics = this.getMetrics();
    if (metrics) {
      this.applyBoardVisualScale(metrics);
      this.drawMazeRoutes(metrics);
    }
    this.refreshArrowStates();
    this.positionTutorialHand(metrics);
  }

  private refreshArrowStates(): void {
    const availableIds = new Set(this.getAvailableActivePieces().map((piece) => piece.id));
    const tutorialTarget = this.currentLevel.tutorial && this.moves === 0 ? this.getAvailableActivePieces()[0]?.id : undefined;

    this.root.querySelectorAll<SVGGElement>('.arrow-piece').forEach((element) => {
      const pieceId = element.dataset.piece;
      const isExiting = pieceId ? this.exitingPieceIds.has(pieceId) : false;
      element.classList.toggle('available', Boolean(pieceId && availableIds.has(pieceId) && !isExiting));
      element.classList.toggle('error', pieceId === this.errorPieceId);
      element.classList.toggle('tutorial-target', Boolean(pieceId && pieceId === tutorialTarget && !isExiting));
      element.classList.toggle('hinted', Boolean(pieceId && this.hintIds.has(pieceId) && !isExiting));
    });
  }

  private async animateExit(piece: ArrowPiece, element: SVGGElement, metrics: BoardMetrics): Promise<void> {
    const hostSvg = element.ownerSVGElement;
    if (!hostSvg) {
      return;
    }

    const motionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    motionPath.setAttribute('d', this.createMazePath(piece, metrics));
    motionPath.setAttribute('class', 'motion-probe');
    hostSvg.append(motionPath);

    const timeline = this.createMotionTimeline(motionPath);
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 90 : timeline.duration;
    const startedAt = performance.now();
    element.classList.add('leaving');
    element.style.pointerEvents = 'none';

    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const linear = Math.min(1, (now - startedAt) / duration);
        const motionTime = this.easeInOutCubic(linear);
        const distance = this.getMotionDistance(timeline, motionTime);
        const point = this.getMotionPoint(motionPath, distance, timeline.totalLength);
        const exitFade = this.smoothstep(0.86, 1, linear);
        const lift = Math.sin(linear * Math.PI) * 0.025;
        const scale = 1 + lift - 0.06 * exitFade;
        const relativeAngle = point.angle - DIRECTION_ANGLE[piece.dir];
        element.setAttribute('transform', `translate(${point.x}, ${point.y}) rotate(${relativeAngle}) scale(${scale})`);
        element.style.opacity = `${1 - 0.58 * exitFade}`;

        if (linear < 1) {
          window.requestAnimationFrame(tick);
        } else {
          this.createExitBurst(hostSvg, point, this.getRouteColor(piece));
          element.classList.remove('leaving');
          motionPath.remove();
          resolve();
        }
      };

      window.requestAnimationFrame(tick);
    });
  }

  private createExitBurst(hostSvg: SVGSVGElement, point: MotionPoint, color: string): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'exit-burst');
    group.setAttribute('style', `--burst-color: ${color}`);
    group.setAttribute('transform', `translate(${point.x}, ${point.y})`);

    for (let index = 0; index < 10; index += 1) {
      const angle = (Math.PI * 2 * index) / 10;
      const spark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      spark.setAttribute('class', 'exit-spark');
      spark.setAttribute('cx', '0');
      spark.setAttribute('cy', '0');
      spark.setAttribute('r', `${index % 3 === 0 ? 4.2 : 3}`);
      spark.setAttribute('style', `--tx: ${Math.cos(angle) * 34}px; --ty: ${Math.sin(angle) * 34}px; --delay: ${index * 18}ms`);
      group.append(spark);
    }

    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('class', 'exit-pop-ring');
    ring.setAttribute('cx', '0');
    ring.setAttribute('cy', '0');
    ring.setAttribute('r', '8');
    group.append(ring);
    hostSvg.append(group);
    window.setTimeout(() => group.remove(), 760);
  }

  private createMotionTimeline(path: SVGGeometryElement): MotionTimeline {
    const totalLength = Math.max(1, path.getTotalLength());
    const steps = Math.min(150, Math.max(72, Math.ceil(totalLength / 4)));
    const keyframes: MotionKeyframe[] = [];
    const speeds: number[] = [];
    const costs: number[] = [0];
    let totalCost = 0;
    let turnPressure = 0;

    for (let index = 0; index <= steps; index += 1) {
      const distance = (totalLength * index) / steps;
      const before = this.getTangentAngle(path, Math.max(0, distance - totalLength * 0.028), totalLength);
      const after = this.getTangentAngle(path, Math.min(totalLength, distance + totalLength * 0.028), totalLength);
      const turn = Math.min(1, Math.abs(this.shortestAngleDelta(before, after)) / 72);
      const edgeWeight = index < 3 || index > steps - 3 ? 0.86 : 1;
      const speed = Math.max(0.5, (1 - turn * 0.44) * edgeWeight);
      keyframes.push({ distance, time: 0 });
      speeds.push(speed);
      turnPressure += turn;
    }

    for (let index = 1; index <= steps; index += 1) {
      const segmentLength = keyframes[index].distance - keyframes[index - 1].distance;
      const speed = (speeds[index] + speeds[index - 1]) / 2;
      totalCost += segmentLength / speed;
      costs[index] = totalCost;
    }

    for (let index = 1; index <= steps; index += 1) {
      keyframes[index].time = costs[index] / totalCost;
    }

    const averageTurn = turnPressure / keyframes.length;
    const duration = Math.round(this.clamp(430 + totalLength * 0.28 + averageTurn * 220, 560, 760));
    return { duration, keyframes, totalLength };
  }

  private getMotionDistance(timeline: MotionTimeline, time: number): number {
    if (time <= 0) {
      return 0;
    }
    if (time >= 1) {
      return timeline.totalLength;
    }

    let low = 0;
    let high = timeline.keyframes.length - 1;
    while (low < high - 1) {
      const mid = Math.floor((low + high) / 2);
      if (timeline.keyframes[mid].time < time) {
        low = mid;
      } else {
        high = mid;
      }
    }

    const start = timeline.keyframes[low];
    const end = timeline.keyframes[high];
    const span = Math.max(0.0001, end.time - start.time);
    const local = (time - start.time) / span;
    return start.distance + (end.distance - start.distance) * local;
  }

  private getMotionPoint(path: SVGGeometryElement, distance: number, totalLength: number): MotionPoint {
    const safeDistance = this.clamp(distance, 0, totalLength);
    const point = path.getPointAtLength(safeDistance);
    const angle = this.getTangentAngle(path, safeDistance, totalLength);
    return { x: point.x, y: point.y, angle };
  }

  private getTangentAngle(path: SVGGeometryElement, distance: number, totalLength: number): number {
    const probe = Math.max(2, totalLength * 0.006);
    const previous = path.getPointAtLength(this.clamp(distance - probe, 0, totalLength));
    const next = path.getPointAtLength(this.clamp(distance + probe, 0, totalLength));
    return (Math.atan2(next.y - previous.y, next.x - previous.x) * 180) / Math.PI;
  }

  private shortestAngleDelta(from: number, to: number): number {
    return ((to - from + 540) % 360) - 180;
  }

  private easeInOutCubic(value: number): number {
    return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  private smoothstep(edge0: number, edge1: number, value: number): number {
    const progress = this.clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return progress * progress * (3 - 2 * progress);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private async showRewardedHint(): Promise<void> {
    if (this.rewardBusy || this.screen !== 'playing') {
      return;
    }

    if (!this.platform.capabilities.rewardedAd) {
      this.message = this.copy().hintUnavailableMessage;
      this.track('rewarded_fail', { placement: 'hint', reason: 'unavailable' });
      this.render();
      return;
    }

    this.rewardBusy = true;
    this.message = this.copy().adPlayingMessage;
    this.render();
    this.track('rewarded_request', {
      placement: 'hint',
      moves: this.moves,
      lives: this.lives
    });
    const rewarded = await this.platform.showRewardedAd('hint');
    this.rewardBusy = false;

    if (!rewarded || this.screen !== 'playing') {
      this.message = this.copy().hintFailMessage;
      this.track('rewarded_fail', {
        placement: 'hint',
        reason: this.screen === 'playing' ? 'not_completed' : 'screen_changed'
      });
      this.render();
      return;
    }

    this.hintsUsed += 1;
    this.track('rewarded_complete', {
      placement: 'hint',
      moves: this.moves,
      lives: this.lives
    });
    this.showHint();
  }

  private showHint(): void {
    const available = this.getAvailableActivePieces().slice(0, 3);
    this.hintIds = new Set(available.map((piece) => piece.id));
    this.message = available.length > 0 ? this.copy().hintCompleteMessage : this.copy().noHintMessage;
    this.render();
  }

  private async reviveFromReward(): Promise<void> {
    const result = this.result;
    if (!result || result.won || this.rewardBusy) {
      return;
    }

    if (!this.platform.capabilities.rewardedAd) {
      this.message = this.copy().reviveUnavailableMessage;
      this.track('rewarded_fail', { placement: 'revive', reason: 'unavailable' });
      this.render();
      return;
    }

    this.rewardBusy = true;
    this.render();
    this.track('rewarded_request', {
      placement: 'revive',
      moves: result.moves,
      lives: result.lives
    });
    const rewarded = await this.platform.showRewardedAd('revive');
    this.rewardBusy = false;

    if (!rewarded) {
      this.track('rewarded_fail', { placement: 'revive', reason: 'not_completed' });
      this.render();
      return;
    }

    this.revivesUsed += 1;
    this.track('rewarded_complete', {
      placement: 'revive',
      moves: result.moves,
      lives: result.lives
    });
    this.lives = 1;
    this.message = this.copy().reviveSuccessMessage;
    this.errorPieceId = undefined;
    this.hintIds.clear();
    this.exitingPieceIds.clear();
    this.result = undefined;
    this.screen = 'playing';
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

    this.track(won ? 'level_complete' : 'level_fail', {
      stars,
      moves: this.moves,
      lives: Math.max(0, this.lives),
      target_moves: this.currentLevel.targetMoves,
      remaining_pieces: Math.max(0, this.pieces.length - this.exitingPieceIds.size),
      hints_used: this.hintsUsed,
      revives_used: this.revivesUsed,
      unlocked_level: this.save.unlockedLevel,
      completed_levels: this.getCompletedLevelCount(),
      total_stars: this.getTotalStars()
    });

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
      return this.copy().perfect;
    }
    if (lives >= 2) {
      return this.copy().great;
    }
    return this.copy().closeWin;
  }

  private renderStars(count: number): string {
    return `${'★'.repeat(count)}${'☆'.repeat(Math.max(0, 3 - count))}`;
  }

  private getDifficultyLabel(level: LevelData): string {
    const labels: Record<LevelData['difficulty'], string> =
      this.save.language === 'en'
        ? {
            tutorial: 'Guide',
            easy: 'Easy',
            medium: 'Medium',
            hard: 'Hard',
            boss: 'Boss'
          }
        : {
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
