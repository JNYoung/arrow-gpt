import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const measurementIdPattern = /^G-[A-Z0-9]+$/i;
const manifest = JSON.parse(await readFile(path.join(root, 'platform-manifest.json'), 'utf8'));
const failures = [];

process.on('uncaughtException', reportFatalError);
process.on('unhandledRejection', reportFatalError);

function fail(message) {
  failures.push(message);
}

const measurementId = await resolveMeasurementId();
if (!measurementId) {
  fail(
    'GA4 measurement id is missing. Set VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX, GA_MEASUREMENT_ID=G-XXXXXXXXXX, or analytics.googleAnalytics.measurementId in platform-manifest.json.'
  );
} else if (!measurementIdPattern.test(measurementId)) {
  fail(`GA4 measurement id "${measurementId}" should look like G-XXXXXXXXXX.`);
}

await requireSourceContains('src/analytics.ts', 'trackGoogleAnalytics');
await requireSourceContains('src/platform/web.ts', 'trackGoogleAnalytics');
await requireSourceContains('src/main.ts', "this.track('session_start'");
await requireSourceContains('src/main.ts', "this.track('level_end'");
await requireSourceContains('src/main.ts', "this.track('level_quit'");
await requireSourceContains('src/main.ts', "this.track('tutorial_begin'");
await requireSourceContains('docs/analytics-event-spec.md', 'GA4');
await requireSourceContains('docs/google-analytics-setup.md', 'VITE_GA_MEASUREMENT_ID');
await requireSourceContains('docs/google-analytics-setup.md', 'firebase:analytics:link');
await requireSourceContains('platform-manifest.json', 'arrow-again-game');
await requireSourceContains('platform-manifest.json', 'androidAppId');
await requireSourceContains('platform-manifest.json', 'iosAppId');
await requireSourceContains('.firebaserc', 'arrow-again-game');
await requireSourceContains('scripts/link-firebase-analytics.mjs', 'addGoogleAnalytics');

if (failures.length > 0) {
  throw new Error(`Analytics verification failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

console.log('Analytics verified: GA4 configuration and required instrumentation are present.');

async function resolveMeasurementId() {
  if (process.env.VITE_GA_MEASUREMENT_ID) {
    return process.env.VITE_GA_MEASUREMENT_ID;
  }
  if (process.env.GA_MEASUREMENT_ID) {
    return process.env.GA_MEASUREMENT_ID;
  }
  if (typeof manifest.analytics?.googleAnalytics?.measurementId === 'string') {
    return manifest.analytics.googleAnalytics.measurementId;
  }

  try {
    const runtimeConfig = await readFile(path.join(root, 'public', 'platform-runtime-config.js'), 'utf8');
    return runtimeConfig.match(/gaMeasurementId["']?\s*:\s*["']([^"']+)["']/)?.[1];
  } catch {
    return undefined;
  }
}

async function requireSourceContains(relativePath, expected) {
  try {
    const contents = await readFile(path.join(root, relativePath), 'utf8');
    if (!contents.includes(expected)) {
      fail(`${relativePath} does not include expected analytics marker: ${expected}`);
    }
  } catch {
    fail(`${relativePath} is missing.`);
  }
}

function reportFatalError(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
}
