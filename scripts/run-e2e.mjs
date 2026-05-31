import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const port = Number(process.env.E2E_PORT ?? 4180);
const baseUrl = `http://127.0.0.1:${port}`;
const moveAnimationMs = 820;

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

async function assertVisible(locator, message) {
  if (!(await locator.isVisible())) {
    throw new Error(message);
  }
}

async function clickAndWait(page, testId) {
  await page.getByTestId(testId).click();
  await page.waitForTimeout(moveAnimationMs);
}

async function run() {
  await waitForServer();

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const consoleProblems = [];
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) {
        consoleProblems.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => consoleProblems.push(`pageerror: ${error.message}`));

    await page.goto(baseUrl);
    await assertVisible(page.getByTestId('home-screen'), 'Home screen should render');
    await assertVisible(page.getByTestId('start-button'), 'Start button should render');

    await page.getByTestId('start-button').click();
    await assertVisible(page.getByTestId('game-screen'), 'Game screen should render after start');
    await assertVisible(page.getByTestId('board'), 'Board should render after start');

    const blockedPiece = page.getByTestId('piece-l1-p2');
    const blockedBoxBefore = await blockedPiece.boundingBox();
    await blockedPiece.click();
    const blockedBoxDuring = await page.getByTestId('piece-l1-p2').boundingBox();
    if (!blockedBoxBefore || !blockedBoxDuring) {
      throw new Error('Blocked arrow should expose a measurable SVG box during error feedback');
    }
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

    await page.evaluate(() => {
      localStorage.setItem(
        'arrow-again-save-v1',
        JSON.stringify({ unlockedLevel: 100, starsByLevel: {}, soundEnabled: false })
      );
    });
    await page.reload();
    await page.getByTestId('levels-button').click();
    await page.getByTestId('level-100').scrollIntoViewIfNeeded();
    await assertVisible(page.getByTestId('level-100'), 'Level selection should expose the full 100-level pack');
    await page.getByTestId('level-15').scrollIntoViewIfNeeded();
    await page.getByTestId('level-15').click();
    await assertVisible(page.getByTestId('hard-modal'), 'Hard levels should show a warning modal before play');
    await page.getByRole('button', { name: '进入' }).click();
    await assertVisible(page.getByTestId('game-screen'), 'Confirming hard modal should enter the level');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(baseUrl);
    await assertVisible(page.getByTestId('home-screen'), 'Desktop viewport should render home screen');

    if (consoleProblems.length > 0) {
      throw new Error(`Console problems detected:\n${consoleProblems.join('\n')}`);
    }
  } finally {
    await browser?.close();
  }
}

try {
  await run();
  console.log('E2E passed: home, gameplay, rewarded hint, rewarded revive, 100-level pack, hard modal, and desktop smoke flow.');
} finally {
  server.kill('SIGTERM');
}
