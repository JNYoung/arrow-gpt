import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifestPath = path.join(root, 'platform-manifest.json');
const defaultOutPath = path.join(root, 'dist', 'platform-runtime-config.js');
const placeholderPattern = /^(TODO|TBD|REPLACE|PLACEHOLDER|ADMOB_)/i;
const sampleRewardedAdUnits = {
  android: {
    hint: 'ca-app-pub-3940256099942544/5224354917',
    revive: 'ca-app-pub-3940256099942544/5224354917',
    'double-reward': 'ca-app-pub-3940256099942544/5224354917'
  },
  ios: {
    hint: 'ca-app-pub-3940256099942544/1712485313',
    revive: 'ca-app-pub-3940256099942544/1712485313',
    'double-reward': 'ca-app-pub-3940256099942544/1712485313'
  }
};

const args = parseArgs(process.argv.slice(2));
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const config = {};

if (args.has('mock-rewarded')) {
  config.mockRewardedAds = true;
}

if (args.has('admob-test')) {
  const nativePlatform = args.get('native-platform') ?? 'android';
  if (nativePlatform !== 'android' && nativePlatform !== 'ios') {
    throw new Error('--native-platform must be android or ios');
  }

  config.adMobTestMode = true;
  config.rewardedPlacements = sampleRewardedAdUnits[nativePlatform];
}

if (args.has('meta-placements')) {
  const placements = stripPlaceholderValues(manifest.platforms?.metaInstant?.rewardedPlacements ?? {});
  if (Object.keys(placements).length > 0) {
    config.rewardedPlacements = {
      ...(config.rewardedPlacements ?? {}),
      ...placements
    };
  }
}

if (args.has('render-quality')) {
  config.renderQuality = args.get('render-quality');
}

if (args.has('share-url')) {
  config.shareUrl = args.get('share-url');
} else if (typeof manifest.releaseAssets?.appHomeUrl === 'string' && !isPlaceholder(manifest.releaseAssets.appHomeUrl)) {
  config.shareUrl = manifest.releaseAssets.appHomeUrl;
}

const appVersion = resolveAppVersion();
if (appVersion) {
  config.appVersion = appVersion;
}

if (args.has('ga-disabled')) {
  config.gaDisabled = true;
} else {
  const gaMeasurementId =
    args.get('ga-measurement-id') ??
    process.env.VITE_GA_MEASUREMENT_ID ??
    process.env.GA_MEASUREMENT_ID ??
    manifest.analytics?.googleAnalytics?.measurementId;

  if (gaMeasurementId) {
    if (!/^G-[A-Z0-9]+$/i.test(gaMeasurementId)) {
      throw new Error('GA measurement id must look like G-XXXXXXXXXX');
    }
    config.gaMeasurementId = gaMeasurementId;
  }
}

if (args.has('ga-debug') || process.env.VITE_GA_DEBUG === 'true' || process.env.GA_DEBUG === 'true') {
  config.gaDebug = true;
}

const outPath = path.resolve(root, args.get('out') ?? defaultOutPath);
await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, renderRuntimeConfig(config));

console.log(`Platform runtime config written to ${outPath}`);
console.log(JSON.stringify(config, null, 2));

function parseArgs(rawArgs) {
  const parsed = new Map();

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (!arg.startsWith('--')) {
      continue;
    }

    const key = arg.slice(2);
    const next = rawArgs[index + 1];
    if (next && !next.startsWith('--')) {
      parsed.set(key, next);
      index += 1;
    } else {
      parsed.set(key, true);
    }
  }

  return parsed;
}

function stripPlaceholderValues(values) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => typeof value === 'string' && !isPlaceholder(value)));
}

function isPlaceholder(value) {
  return placeholderPattern.test(value);
}

function resolveAppVersion() {
  return (
    manifest.platforms?.googlePlayAndroid?.versionName ??
    manifest.platforms?.iosAppStore?.versionName ??
    undefined
  );
}

function renderRuntimeConfig(configValue) {
  return `window.__GAME_PLATFORM_CONFIG__ = {
  ...(window.__GAME_PLATFORM_CONFIG__ || {}),
  ...${JSON.stringify(configValue, null, 2)}
};
`;
}
