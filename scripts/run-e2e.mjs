import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const port = Number(process.env.E2E_PORT ?? 4180);
const baseUrl = `http://127.0.0.1:${port}`;
const moveAnimationMs = 820;
const e2eTimeoutMs = Number(process.env.E2E_TIMEOUT_MS ?? 90000);

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe']
});

const serverOutput = [];
server.stdout.on('data', (chunk) => serverOutput.push(chunk.toString()));
server.stderr.on('data', (chunk) => serverOutput.push(chunk.toString()));

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15000) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch {
      await delay(250);
    }
  }

  throw new Error(`Vite preview did not start at ${baseUrl}\n${serverOutput.join('')}`);
}

async function stopServer() {
  if (server.exitCode !== null || server.signalCode !== null) {
    return;
  }

  const stopped = new Promise((resolve) => {
    server.once('exit', resolve);
  });
  server.kill('SIGTERM');
  await Promise.race([
    stopped,
    delay(3000).then(() => {
      if (server.exitCode === null && server.signalCode === null) {
        server.kill('SIGKILL');
      }
    })
  ]);
  await stopped;
}

async function assertVisible(locator, message) {
  if (!(await locator.isVisible())) {
    throw new Error(message);
  }
}

async function clickAndWait(page, testId) {
  await page.getByTestId(testId).click();
  await page.waitForTimeout(moveAnimationMs);
}

async function gotoApp(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}

async function measureVisibleBox(locator, message) {
  await locator.waitFor({ state: 'visible' });
  const box = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    };
  });
  if (box.width <= 0 || box.height <= 0) {
    throw new Error(message);
  }
  return box;
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    if (!String(error?.message ?? error).includes("Executable doesn't exist")) {
      throw error;
    }

    const executablePath = process.env.E2E_CHROME_EXECUTABLE ?? resolveLocalChrome();
    if (!executablePath) {
      throw error;
    }

    console.warn(`Playwright Chromium is not installed; using local Chrome at ${executablePath}.`);
    return chromium.launch({ headless: true, executablePath });
  }
}

function resolveLocalChrome() {
  const candidates = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
    ],
    linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'],
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ]
  }[process.platform] ?? [];

  return candidates.find((candidate) => existsSync(candidate));
}

async function run() {
  await waitForServer();

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(10000);
    const consoleProblems = [];
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) {
        if (message.type() === 'error' && message.text().startsWith('Failed to load resource:')) {
          return;
        }
        consoleProblems.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => consoleProblems.push(`pageerror: ${error.message}`));
    await page.addInitScript(() => window.localStorage.clear());

    await gotoApp(page, baseUrl);
    await assertVisible(page.getByTestId('home-screen'), 'Home screen should render');
    await assertVisible(page.getByTestId('start-button'), 'Start button should render');
    await assertVisible(page.getByTestId('settings-button'), 'Settings button should render');
    await assertVisible(page.getByTestId('home-progress'), 'Home retention progress should render');
    await assertVisible(page.getByTestId('home-feedback-button'), 'Home feedback entry should render');
    if ((await page.getByTestId('levels-button').count()) > 0) {
      throw new Error('Store-ready home screen should not expose level selection');
    }
    if ((await page.getByText('设计中').count()) > 0) {
      throw new Error('Store-ready home screen should not expose unfinished-feature copy');
    }

    await page.getByTestId('settings-button').click();
    await assertVisible(page.getByTestId('settings-panel'), 'Settings panel should render from home');
    const musicToggle = page.getByTestId('music-toggle');
    const effectsToggle = page.getByTestId('effects-toggle');
    if ((await musicToggle.getAttribute('aria-pressed')) !== 'true') {
      throw new Error('Music should default to enabled');
    }
    if ((await effectsToggle.getAttribute('aria-pressed')) !== 'true') {
      throw new Error('Effects should default to enabled');
    }
    await musicToggle.click();
    if ((await musicToggle.getAttribute('aria-pressed')) !== 'false') {
      throw new Error('Music toggle should switch off');
    }
    await effectsToggle.click();
    if ((await effectsToggle.getAttribute('aria-pressed')) !== 'false') {
      throw new Error('Effects toggle should switch off');
    }
    await page.getByTestId('language-en').click();
    const englishStartCopy = await page.getByTestId('start-button').innerText();
    if (!englishStartCopy.includes('Start Level')) {
      throw new Error(`English language setting should update home copy, got: ${englishStartCopy}`);
    }
    await page.getByTestId('language-zh').click();
    const chineseStartCopy = await page.getByTestId('start-button').innerText();
    if (!chineseStartCopy.includes('开始第')) {
      throw new Error(`Chinese language setting should update home copy, got: ${chineseStartCopy}`);
    }
    await musicToggle.click();
    await effectsToggle.click();

    await page.getByTestId('start-button').click();
    await assertVisible(page.getByTestId('game-screen'), 'Game screen should render after start');
    await assertVisible(page.getByTestId('board'), 'Board should render after start');
    await page.waitForFunction(() => document.querySelectorAll('.maze-flow').length > 0);

    const blockedPiece = page.getByTestId('piece-l1-p2');
    const blockedBoxBefore = await measureVisibleBox(
      blockedPiece,
      'Blocked arrow should expose a measurable SVG box before error feedback'
    );
    await blockedPiece.click();
    const blockedBoxDuring = await measureVisibleBox(
      page.getByTestId('piece-l1-p2'),
      'Blocked arrow should expose a measurable SVG box during error feedback'
    );
    if (Math.abs(blockedBoxBefore.x - blockedBoxDuring.x) > 20 || Math.abs(blockedBoxBefore.y - blockedBoxDuring.y) > 20) {
      throw new Error('Blocked arrow should shake in place instead of jumping to the board origin');
    }
    await page.waitForTimeout(320);
    const blockedMessage = await page.getByTestId('board-message').innerText();
    if (!blockedMessage.includes('被挡住')) {
      throw new Error(`Expected blocked feedback, got: ${blockedMessage}`);
    }

    await page.getByTestId('hint-button').click();
    await page.waitForTimeout(260);
    const hintedCount = await page.locator('.arrow-piece.hinted').count();
    if (hintedCount === 0) {
      throw new Error('Hint should highlight at least one available arrow');
    }

    await page.getByTestId('piece-l1-p2').click();
    await page.waitForTimeout(320);
    await page.getByTestId('piece-l1-p2').click();
    await page.waitForTimeout(360);
    await assertVisible(page.getByTestId('result-screen'), 'Three blocked moves should show the failed result screen');
    await assertVisible(page.getByTestId('revive-button'), 'Failed result should offer a rewarded revive');

    await page.getByTestId('revive-button').click();
    await page.waitForTimeout(260);
    await assertVisible(page.getByTestId('game-screen'), 'Rewarded revive should return to the game screen');
    const reviveMessage = await page.getByTestId('board-message').innerText();
    if (!reviveMessage.includes('复活成功')) {
      throw new Error(`Expected revive feedback, got: ${reviveMessage}`);
    }

    await page.getByTestId('restart-button').click();
    await assertVisible(page.getByTestId('piece-l1-p1'), 'Restart should restore the first level');

    await page.getByTestId('piece-l1-p1').click();
    await page.waitForTimeout(120);
    await page.getByTestId('piece-l1-p4').click();
    await page.waitForTimeout(moveAnimationMs);
    if ((await page.getByTestId('piece-l1-p4').count()) !== 0) {
      throw new Error('A second available arrow should be clickable while the first arrow is still exiting');
    }
    const concurrentMoves = await page.getByTestId('moves').innerText();
    if (!concurrentMoves.includes('2/5')) {
      throw new Error(`Expected two accepted moves after overlapping exits, got: ${concurrentMoves}`);
    }

    await page.getByTestId('restart-button').click();
    await assertVisible(page.getByTestId('piece-l1-p1'), 'Restart should restore the first level after overlapping exits');

    for (const pieceId of ['piece-l1-p1', 'piece-l1-p2', 'piece-l1-p3', 'piece-l1-p4', 'piece-l1-p5']) {
      await clickAndWait(page, pieceId);
    }

    await assertVisible(page.getByTestId('result-screen'), 'Winning level 1 should show the result screen');
    await assertVisible(page.getByTestId('next-level-button'), 'Winning level 1 should expose the next level action');
    await assertVisible(page.getByTestId('result-feedback-button'), 'Result screen should expose feedback entry');

    await gotoApp(page, `${baseUrl}?debug=levels`);
    await page.getByTestId('levels-button').click();
    await page.getByTestId('level-100').scrollIntoViewIfNeeded();
    await assertVisible(page.getByTestId('level-100'), 'Debug level selection should expose the full 100-level pack');
    if (await page.getByTestId('level-100').isDisabled()) {
      throw new Error('Debug level selection should make level 100 playable without mutating saved progress');
    }
    await page.getByTestId('level-15').scrollIntoViewIfNeeded();
    await page.getByTestId('level-15').click();
    await assertVisible(page.getByTestId('hard-modal'), 'Hard levels should show a warning modal before play');
    await page.getByTestId('confirm-hard-button').click();
    await assertVisible(page.getByTestId('game-screen'), 'Confirming hard modal should enter the level');
    await page.waitForFunction(() => document.querySelectorAll('.maze-core').length > 0);
    const freeRouteState = await page.getByTestId('board').evaluate(() => ({
      flowCount: document.querySelectorAll('.maze-flow').length,
      gateCount: document.querySelectorAll('.exit-gate').length
    }));
    if (freeRouteState.flowCount !== 0 || freeRouteState.gateCount !== 0) {
      throw new Error(`Level 15 should hide free trajectory hints, got: ${JSON.stringify(freeRouteState)}`);
    }
    await page.getByTestId('hint-button').click();
    await page.waitForTimeout(260);
    const rewardedRouteState = await page.getByTestId('board').evaluate(() => ({
      flowCount: document.querySelectorAll('.maze-flow').length,
      gateCount: document.querySelectorAll('.exit-gate').length,
      hintedCount: document.querySelectorAll('.arrow-piece.hinted').length
    }));
    if (rewardedRouteState.flowCount === 0 || rewardedRouteState.gateCount === 0 || rewardedRouteState.hintedCount === 0) {
      throw new Error(`Rewarded hint should restore trajectory cues, got: ${JSON.stringify(rewardedRouteState)}`);
    }

    const lowFxPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    lowFxPage.setDefaultTimeout(10000);
    lowFxPage.setDefaultNavigationTimeout(10000);
    await lowFxPage.addInitScript(() => {
      window.localStorage.clear();
      window.__GAME_PLATFORM_CONFIG__ = { renderQuality: 'low', mockRewardedAds: true };
    });
    await gotoApp(lowFxPage, `${baseUrl}?debug=levels`);
    await lowFxPage.getByTestId('levels-button').click();
    await lowFxPage.getByTestId('level-80').scrollIntoViewIfNeeded();
    await lowFxPage.getByTestId('level-80').click();
    await lowFxPage.getByTestId('confirm-hard-button').click();
    await assertVisible(lowFxPage.getByTestId('game-screen'), 'Low-FX runtime config should still enter level 80');
    await lowFxPage.getByTestId('hint-button').click();
    await lowFxPage.waitForTimeout(260);
    const lowFxState = await lowFxPage.getByTestId('board').evaluate((board) => ({
      lowFx: board.classList.contains('low-fx-board'),
      dense: board.classList.contains('dense-board'),
      flowAnimation: getComputedStyle(board.querySelector('.maze-flow')).animationName,
      gateAnimation: getComputedStyle(board.querySelector('.exit-gate')).animationName,
      runtimeQuality: window.ArrowAgainRuntime?.getRenderQuality()
    }));
    if (!lowFxState.lowFx || !lowFxState.dense || lowFxState.flowAnimation !== 'none' || lowFxState.gateAnimation !== 'none') {
      throw new Error(`Low-FX level 80 should disable heavy route animations, got: ${JSON.stringify(lowFxState)}`);
    }
    const upgradedQuality = await lowFxPage.evaluate(() => window.ArrowAgainRuntime?.setRenderQuality('high'));
    if (upgradedQuality !== 'high') {
      throw new Error(`Runtime quality JSB should switch to high, got: ${upgradedQuality}`);
    }
    await lowFxPage.close();

    await page.setViewportSize({ width: 1280, height: 720 });
    await gotoApp(page, baseUrl);
    await assertVisible(page.getByTestId('home-screen'), 'Desktop viewport should render home screen');

    if (consoleProblems.length > 0) {
      throw new Error(`Console problems detected:\n${consoleProblems.join('\n')}`);
    }
  } finally {
    await browser?.close();
  }
}

let exitCode = 0;
try {
  await Promise.race([
    run(),
    delay(e2eTimeoutMs).then(() => {
      throw new Error(`E2E timed out after ${e2eTimeoutMs}ms`);
    })
  ]);
  console.log('E2E passed: home, gameplay, rewarded hint, rewarded revive, 100-level pack, hard modal, and desktop smoke flow.');
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  await Promise.race([stopServer(), delay(5000)]);
}

process.exit(exitCode);
