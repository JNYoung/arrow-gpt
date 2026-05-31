import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const manifestPath = path.join(process.cwd(), 'platform-manifest.json');
const releaseMode = process.argv.includes('--release');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const failures = [];
const releaseBlockers = [];

function fail(message) {
  failures.push(message);
}

function blockRelease(message) {
  releaseBlockers.push(message);
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function get(pathExpression) {
  return pathExpression.split('.').reduce((value, key) => (isObject(value) ? value[key] : undefined), manifest);
}

function requireString(pathExpression) {
  const value = get(pathExpression);
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(`${pathExpression} must be a non-empty string`);
    return undefined;
  }
  return value;
}

function requireBoolean(pathExpression) {
  const value = get(pathExpression);
  if (typeof value !== 'boolean') {
    fail(`${pathExpression} must be a boolean`);
  }
}

function requirePositiveInteger(pathExpression) {
  const value = get(pathExpression);
  if (!Number.isInteger(value) || value <= 0) {
    fail(`${pathExpression} must be a positive integer`);
  }
}

function requireOneOf(pathExpression, allowedValues) {
  const value = get(pathExpression);
  if (!allowedValues.includes(value)) {
    fail(`${pathExpression} must be one of ${allowedValues.join(', ')}`);
  }
}

function looksLikePlaceholder(value) {
  return /^(TODO|TBD|REPLACE|PLACEHOLDER|META_|ADMOB_)/i.test(value) || value.includes('_TODO_');
}

function requireReleaseValue(pathExpression) {
  const value = requireString(pathExpression);
  if (value && looksLikePlaceholder(value)) {
    blockRelease(`${pathExpression} is still a placeholder`);
  }
  return value;
}

function requireUrl(pathExpression) {
  const value = requireReleaseValue(pathExpression);
  if (!value || looksLikePlaceholder(value)) {
    return;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') {
      blockRelease(`${pathExpression} should use https`);
    }
  } catch {
    blockRelease(`${pathExpression} must be a valid URL`);
  }
}

function requireAndroidApplicationId(pathExpression) {
  const value = requireReleaseValue(pathExpression);
  if (value && !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(value)) {
    fail(`${pathExpression} must be a valid Android application id`);
  }
}

async function requireFile(pathExpression) {
  const value = requireString(pathExpression);
  if (!value) {
    return;
  }

  try {
    await access(path.join(process.cwd(), value));
  } catch {
    fail(`${pathExpression} points to missing file ${value}`);
  }
}

const requiredPlacements = ['hint', 'revive', 'double-reward'];

function requirePlacements(prefix) {
  for (const placement of requiredPlacements) {
    requireReleaseValue(`${prefix}.rewardedPlacements.${placement}`);
  }
}

if (!isObject(manifest)) {
  fail('platform-manifest.json must contain a JSON object');
}

requireReleaseValue('gameId');
requireReleaseValue('displayName');
requireOneOf('orientation', ['portrait', 'landscape']);
requireOneOf('releaseStatus', ['draft', 'ready']);
requireUrl('privacyPolicyUrl');
requireReleaseValue('supportEmail');

if (get('releaseStatus') !== 'ready') {
  blockRelease('releaseStatus must be "ready" before store submission');
}

if (!isObject(get('platforms'))) {
  fail('platforms must be an object');
}

requireBoolean('platforms.webH5.enabled');
requireReleaseValue('platforms.webH5.buildCommand');

requireBoolean('platforms.metaInstant.enabled');
requireReleaseValue('platforms.metaInstant.appId');
requireReleaseValue('platforms.metaInstant.packageCommand');
await requireFile('platforms.metaInstant.fbappConfigPath');
requirePlacements('platforms.metaInstant');

requireBoolean('platforms.googlePlayAndroid.enabled');
requireAndroidApplicationId('platforms.googlePlayAndroid.applicationId');
requirePositiveInteger('platforms.googlePlayAndroid.versionCode');
requireReleaseValue('platforms.googlePlayAndroid.versionName');
requireReleaseValue('platforms.googlePlayAndroid.bundleCommand');
requireReleaseValue('platforms.googlePlayAndroid.nativeBridge');
requirePlacements('platforms.googlePlayAndroid');

if (releaseMode && releaseBlockers.length > 0) {
  failures.push(...releaseBlockers);
}

if (failures.length > 0) {
  throw new Error(`Platform manifest verification failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

console.log('Platform manifest verified: required structure and files are present.');

if (releaseBlockers.length > 0) {
  console.log('Release blockers remaining:');
  for (const blocker of releaseBlockers) {
    console.log(`- ${blocker}`);
  }
  console.log('Run with --release to fail on these blockers before store submission.');
} else {
  console.log('Release readiness verified: no placeholder platform values remain.');
}
