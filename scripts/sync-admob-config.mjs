import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const cwd = process.cwd();
const testMode = process.argv.includes('--test');
const manifestPath = path.join(cwd, 'platform-manifest.json');
const androidStringsPath = path.join(cwd, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const iosInfoPlistPath = path.join(cwd, 'ios', 'App', 'App', 'Info.plist');
const appIdPattern = /^ca-app-pub-\d{16}~\d{10}$/;
const placeholderPattern = /^(TODO|TBD|REPLACE|PLACEHOLDER|ADMOB_)/i;
const sampleAppIds = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511'
};

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

function get(pathExpression) {
  return pathExpression.split('.').reduce((value, key) => (value && typeof value === 'object' ? value[key] : undefined), manifest);
}

function isConfiguredAppId(value) {
  return typeof value === 'string' && appIdPattern.test(value) && !placeholderPattern.test(value);
}

function resolveAppId(pathExpression, platform) {
  const value = get(pathExpression);
  if (isConfiguredAppId(value)) {
    return value;
  }

  if (testMode) {
    return sampleAppIds[platform];
  }

  throw new Error(`${pathExpression} must be filled with a real AdMob app id before syncing. Use npm run admob:sync:test for local SDK smoke tests.`);
}

function replaceAndroidAdMobAppId(contents, appId) {
  const entry = `    <string name="admob_app_id">${appId}</string>`;
  if (/<string\s+name="admob_app_id">[^<]*<\/string>/.test(contents)) {
    return contents.replace(/<string\s+name="admob_app_id">[^<]*<\/string>/, entry.trim());
  }

  return contents.replace('</resources>', `${entry}\n</resources>`);
}

function replaceIosAdMobAppId(contents, appId) {
  const keyValuePattern = /(<key>GADApplicationIdentifier<\/key>\s*<string>)[^<]*(<\/string>)/;
  if (keyValuePattern.test(contents)) {
    return contents.replace(keyValuePattern, `$1${appId}$2`);
  }

  return contents.replace('</dict>', `\t<key>GADApplicationIdentifier</key>\n\t<string>${appId}</string>\n</dict>`);
}

const androidAppId = resolveAppId('platforms.googlePlayAndroid.adMobAppId', 'android');
const iosAppId = resolveAppId('platforms.iosAppStore.adMobAppId', 'ios');

const androidStrings = await readFile(androidStringsPath, 'utf8');
const iosInfoPlist = await readFile(iosInfoPlistPath, 'utf8');

await writeFile(androidStringsPath, replaceAndroidAdMobAppId(androidStrings, androidAppId));
await writeFile(iosInfoPlistPath, replaceIosAdMobAppId(iosInfoPlist, iosAppId));

console.log(`Synced Android AdMob app id to ${androidStringsPath}`);
console.log(`Synced iOS AdMob app id to ${iosInfoPlistPath}`);
if (testMode) {
  console.log('Test mode used Google sample AdMob app ids. Replace platform-manifest.json with real ids before release.');
}
