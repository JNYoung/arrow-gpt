import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const manifestPath = path.join(process.cwd(), 'platform-manifest.json');
const releaseMode = process.argv.includes('--release');
const releaseTarget = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] ?? 'full';
const releaseTargets = ['full', 'android', 'ios', 'meta', 'web'];
const allReleaseTargets = [...releaseTargets];
const androidReleaseTargets = ['full', 'android'];
const iosReleaseTargets = ['full', 'ios'];
const metaReleaseTargets = ['full', 'meta'];
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const failures = [];
const releaseBlockers = [];

function fail(message) {
  failures.push(message);
}

function blockRelease(message, targets = allReleaseTargets) {
  releaseBlockers.push({ message, targets });
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
  return (
    /^(TODO|TBD|REPLACE|PLACEHOLDER|META_|ADMOB_)/i.test(value) ||
    value.includes('_TODO_') ||
    value.includes('REPLACE_WITH_') ||
    value.includes('0000000000000000')
  );
}

function looksLikeGoogleSampleAdMob(value) {
  return typeof value === 'string' && value.includes('ca-app-pub-3940256099942544');
}

function requireReleaseValue(pathExpression, targets = allReleaseTargets) {
  const value = requireString(pathExpression);
  if (value && looksLikePlaceholder(value)) {
    blockRelease(`${pathExpression} is still a placeholder`, targets);
  }
  return value;
}

function requireUrl(pathExpression, targets = allReleaseTargets) {
  const value = requireReleaseValue(pathExpression, targets);
  if (!value || looksLikePlaceholder(value)) {
    return;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') {
      blockRelease(`${pathExpression} should use https`, targets);
    }
  } catch {
    blockRelease(`${pathExpression} must be a valid URL`, targets);
  }

  return value;
}

function requireAndroidApplicationId(pathExpression, targets = allReleaseTargets) {
  const value = requireReleaseValue(pathExpression, targets);
  if (value && !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(value)) {
    fail(`${pathExpression} must be a valid Android application id`);
  }
}

function requireEmail(pathExpression, targets = allReleaseTargets) {
  const value = requireReleaseValue(pathExpression, targets);
  if (value && !looksLikePlaceholder(value) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    blockRelease(`${pathExpression} must be a valid support email`, targets);
  }
}

function requireAdMobAppId(pathExpression, targets = allReleaseTargets) {
  const value = requireReleaseValue(pathExpression, targets);
  if (value && !looksLikePlaceholder(value) && !/^ca-app-pub-\d{16}~\d{10}$/.test(value)) {
    blockRelease(`${pathExpression} should look like ca-app-pub-0000000000000000~0000000000`, targets);
  }
  if (value && looksLikeGoogleSampleAdMob(value)) {
    blockRelease(`${pathExpression} is still a Google sample AdMob app id`, targets);
  }
}

function requireStringArray(pathExpression) {
  const value = get(pathExpression);
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || entry.trim().length === 0)) {
    fail(`${pathExpression} must be an array of non-empty strings`);
  }
}

async function requireFile(pathExpression) {
  const value = requireString(pathExpression);
  if (!value) {
    return undefined;
  }

  try {
    await access(path.join(process.cwd(), value));
  } catch {
    fail(`${pathExpression} points to missing file ${value}`);
    return undefined;
  }

  return value;
}

async function requireReleasePage(pathExpression, label, targets = allReleaseTargets) {
  const value = await requireFile(pathExpression);
  if (!value) {
    return;
  }

  const contents = await readFile(path.join(process.cwd(), value), 'utf8');
  if (
    /TODO_|REPLACE_WITH_|TODO\b|REPLACE\b|Privacy Policy Draft|release readiness|before store submission/i.test(contents)
  ) {
    blockRelease(`${label} page still contains draft or placeholder copy (${value})`, targets);
  }
}

function requireAppAdsTxtUrl(pathExpression) {
  const value = requireUrl(pathExpression, androidReleaseTargets);
  if (!value || looksLikePlaceholder(value)) {
    return;
  }

  try {
    const url = new URL(value);
    if (!url.pathname.endsWith('/app-ads.txt')) {
      blockRelease(`${pathExpression} should point to an app-ads.txt file at the developer website root`, androidReleaseTargets);
    }
  } catch {
    // requireUrl already recorded the malformed URL.
  }
}

async function requireAppAdsTxt(pathExpression) {
  const value = await requireFile(pathExpression);
  if (!value) {
    return;
  }

  const contents = await readFile(path.join(process.cwd(), value), 'utf8');
  if (/pub-0{8,}/.test(contents) || contents.includes('REPLACE')) {
    blockRelease(`${pathExpression} still contains placeholder app-ads.txt publisher data`, androidReleaseTargets);
  }
}

const requiredPlacements = ['hint', 'revive', 'double-reward'];

function requirePlacements(prefix, targets = allReleaseTargets) {
  for (const placement of requiredPlacements) {
    requireReleaseValue(`${prefix}.rewardedPlacements.${placement}`, targets);
  }
}

function requireAdMobAdUnit(pathExpression, targets = allReleaseTargets) {
  const value = requireReleaseValue(pathExpression, targets);
  if (value && !looksLikePlaceholder(value) && !/^ca-app-pub-\d{16}\/\d{10}$/.test(value)) {
    blockRelease(`${pathExpression} should look like ca-app-pub-0000000000000000/0000000000`, targets);
  }
  if (value && looksLikeGoogleSampleAdMob(value)) {
    blockRelease(`${pathExpression} is still a Google sample AdMob ad unit`, targets);
  }
}

function requireAdMobPlacements(prefix, targets = allReleaseTargets) {
  for (const placement of requiredPlacements) {
    requireAdMobAdUnit(`${prefix}.rewardedPlacements.${placement}`, targets);
  }
}

async function readAndroidAdMobAppId() {
  try {
    const contents = await readFile(path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml'), 'utf8');
    return contents.match(/<string\s+name="admob_app_id">([^<]+)<\/string>/)?.[1];
  } catch {
    fail('Android strings.xml is missing for AdMob app id verification');
    return undefined;
  }
}

async function readIosAdMobAppId() {
  try {
    const contents = await readFile(path.join(process.cwd(), 'ios', 'App', 'App', 'Info.plist'), 'utf8');
    return contents.match(/<key>GADApplicationIdentifier<\/key>\s*<string>([^<]+)<\/string>/)?.[1];
  } catch {
    fail('iOS Info.plist is missing for AdMob app id verification');
    return undefined;
  }
}

function verifyNativeAdMobAppId(pathExpression, nativeLabel, nativeValue, targets = allReleaseTargets) {
  const manifestValue = get(pathExpression);
  if (!nativeValue) {
    fail(`${nativeLabel} is missing AdMob app id`);
    return;
  }
  if (!/^ca-app-pub-\d{16}~\d{10}$/.test(nativeValue)) {
    fail(`${nativeLabel} should look like ca-app-pub-0000000000000000~0000000000`);
    return;
  }
  if (looksLikePlaceholder(nativeValue) || looksLikeGoogleSampleAdMob(nativeValue)) {
    blockRelease(`${nativeLabel} is not a production AdMob app id`, targets);
  }
  if (
    typeof manifestValue === 'string' &&
    !looksLikePlaceholder(manifestValue) &&
    !looksLikeGoogleSampleAdMob(manifestValue) &&
    nativeValue !== manifestValue
  ) {
    blockRelease(`${nativeLabel} does not match ${pathExpression}; run npm run admob:sync`, targets);
  }
}

if (!isObject(manifest)) {
  fail('platform-manifest.json must contain a JSON object');
}

if (!releaseTargets.includes(releaseTarget)) {
  fail(`--target must be one of ${releaseTargets.join(', ')}`);
}

requireReleaseValue('gameId');
requireReleaseValue('displayName');
requireOneOf('orientation', ['portrait', 'landscape']);
requireOneOf('releaseStatus', ['draft', 'ready']);
requireUrl('privacyPolicyUrl');
requireUrl('dataDeletionUrl');
requireEmail('supportEmail');

if (get('releaseStatus') !== 'ready') {
  blockRelease('releaseStatus must be "ready" before full multi-platform store submission', ['full']);
}

if (!isObject(get('releaseAssets'))) {
  fail('releaseAssets must be an object');
}

requireUrl('releaseAssets.appHomeUrl');
requireUrl('releaseAssets.supportUrl');
requireAppAdsTxtUrl('releaseAssets.appAdsTxtUrl');
await requireReleasePage('releaseAssets.landingPagePath', 'App home');
await requireReleasePage('releaseAssets.privacyPagePath', 'Privacy policy');
await requireReleasePage('releaseAssets.dataDeletionPagePath', 'Data deletion');
await requireAppAdsTxt('releaseAssets.appAdsTxtPath');
await requireFile('releaseAssets.iconSvgPath');
await requireFile('releaseAssets.iconPng1024Path');
await requireFile('releaseAssets.splashPngPath');
await requireFile('releaseAssets.shareImagePath');

if (!isObject(get('platforms'))) {
  fail('platforms must be an object');
}

requireBoolean('platforms.webH5.enabled');
requireReleaseValue('platforms.webH5.buildCommand');

requireBoolean('platforms.metaInstant.enabled');
requireReleaseValue('platforms.metaInstant.appId', metaReleaseTargets);
requireReleaseValue('platforms.metaInstant.packageCommand', metaReleaseTargets);
await requireFile('platforms.metaInstant.fbappConfigPath');
await requireFile('platforms.metaInstant.shareImagePath');
requireStringArray('platforms.metaInstant.loginPermissions');
requirePlacements('platforms.metaInstant', metaReleaseTargets);

requireBoolean('platforms.googlePlayAndroid.enabled');
requireAndroidApplicationId('platforms.googlePlayAndroid.applicationId', androidReleaseTargets);
requirePositiveInteger('platforms.googlePlayAndroid.versionCode');
requireReleaseValue('platforms.googlePlayAndroid.versionName', androidReleaseTargets);
requireReleaseValue('platforms.googlePlayAndroid.bundleCommand', androidReleaseTargets);
requireReleaseValue('platforms.googlePlayAndroid.nativeBridge', androidReleaseTargets);
requireAdMobAppId('platforms.googlePlayAndroid.adMobAppId', androidReleaseTargets);
requireAdMobPlacements('platforms.googlePlayAndroid', androidReleaseTargets);

requireBoolean('platforms.iosAppStore.enabled');
requireAndroidApplicationId('platforms.iosAppStore.bundleId', iosReleaseTargets);
requirePositiveInteger('platforms.iosAppStore.versionCode');
requireReleaseValue('platforms.iosAppStore.versionName', iosReleaseTargets);
requireReleaseValue('platforms.iosAppStore.prepareCommand', iosReleaseTargets);
await requireFile('platforms.iosAppStore.workspacePath');
requireReleaseValue('platforms.iosAppStore.scheme', iosReleaseTargets);
requireAdMobAppId('platforms.iosAppStore.adMobAppId', iosReleaseTargets);
requireAdMobPlacements('platforms.iosAppStore', iosReleaseTargets);

verifyNativeAdMobAppId(
  'platforms.googlePlayAndroid.adMobAppId',
  'android/app/src/main/res/values/strings.xml admob_app_id',
  await readAndroidAdMobAppId(),
  androidReleaseTargets
);
verifyNativeAdMobAppId(
  'platforms.iosAppStore.adMobAppId',
  'ios/App/App/Info.plist GADApplicationIdentifier',
  await readIosAdMobAppId(),
  iosReleaseTargets
);

const activeReleaseBlockers = releaseBlockers.filter((blocker) => blocker.targets.includes(releaseTarget));
const activeReleaseBlockerMessages = activeReleaseBlockers.map((blocker) => blocker.message);

if (releaseMode && activeReleaseBlockerMessages.length > 0) {
  failures.push(...activeReleaseBlockerMessages);
}

if (failures.length > 0) {
  throw new Error(`Platform manifest verification failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

console.log('Platform manifest verified: required structure and files are present.');

if (activeReleaseBlockerMessages.length > 0) {
  console.log(`Release blockers remaining for ${releaseTarget}:`);
  for (const blocker of activeReleaseBlockerMessages) {
    console.log(`- ${blocker}`);
  }
  console.log(`Run with --release --target=${releaseTarget} to fail on these blockers before store submission.`);
} else {
  console.log(`Release readiness verified for ${releaseTarget}: no blocking placeholder platform values remain.`);
}
