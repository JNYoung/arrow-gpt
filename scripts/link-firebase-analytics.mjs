import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';

const root = process.cwd();
const firebaseApiBase = 'https://firebase.googleapis.com/v1beta1';
const measurementIdPattern = /^G-[A-Z0-9]+$/i;
const execFile = promisify(execFileCallback);

process.on('uncaughtException', reportFatalError);
process.on('unhandledRejection', reportFatalError);

const args = parseArgs(process.argv.slice(2));
const manifestPath = path.join(root, 'platform-manifest.json');
const manifest = await readJson(manifestPath);
const projectId =
  args.get('project-id') ??
  process.env.FIREBASE_PROJECT_ID ??
  manifest.analytics?.googleAnalytics?.firebase?.projectId ??
  (await readDefaultFirebaseProject());

if (!projectId) {
  throw new Error('Firebase project id is missing. Add .firebaserc or pass --project-id arrow-again-game.');
}

const analyticsAccountId = args.get('analytics-account-id') ?? process.env.GA_ANALYTICS_ACCOUNT_ID;
const analyticsPropertyId = args.get('analytics-property-id') ?? process.env.GA_ANALYTICS_PROPERTY_ID;
const shouldOnlyCheckStatus = args.has('status');
const shouldWriteManifest = args.has('write-manifest');

if (analyticsAccountId && analyticsPropertyId) {
  throw new Error('Pass only one of --analytics-account-id or --analytics-property-id.');
}

const token = await getFirebaseAccessToken();
const existingDetails = await getAnalyticsDetails(token, projectId);

if (existingDetails) {
  await reportAndPersist(existingDetails, 'Firebase project is already linked to Google Analytics.');
  process.exit(0);
}

if (shouldOnlyCheckStatus) {
  throw new Error(
    `Firebase project ${projectId} is not linked to Google Analytics yet. ` +
      'Run npm run firebase:analytics:link -- --analytics-account-id=<account-id> or --analytics-property-id=<property-id>.'
  );
}

const requestBody = {};
if (analyticsAccountId) {
  requestBody.analyticsAccountId = analyticsAccountId;
} else if (analyticsPropertyId) {
  requestBody.analyticsPropertyId = normalizeAnalyticsPropertyId(analyticsPropertyId);
} else {
  throw new Error(
    'Google Analytics account/property id is required to link Firebase. ' +
      'Pass --analytics-account-id=<account-id> to create a new GA4 property, or --analytics-property-id=<property-id> to link an existing one.'
  );
}

const operation = await requestJson(token, 'POST', `/projects/${projectId}:addGoogleAnalytics`, requestBody);
console.log(`Started Firebase Analytics link operation: ${operation.name ?? '(operation name unavailable)'}`);

if (operation.name) {
  await waitForOperation(token, operation.name);
}

const linkedDetails = await waitForAnalyticsDetails(token, projectId);
await reportAndPersist(linkedDetails, 'Firebase project is linked to Google Analytics.');

async function reportAndPersist(details, message) {
  const measurementIds = collectMeasurementIds(details);
  const measurementId = measurementIds[0];

  console.log(message);
  console.log(JSON.stringify({
    projectId,
    analyticsPropertyId: extractAnalyticsPropertyId(details),
    measurementIds
  }, null, 2));

  if (shouldWriteManifest) {
    if (!measurementId) {
      throw new Error('Analytics link exists, but no GA4 web Measurement ID was found in Firebase analyticsDetails.');
    }

    manifest.analytics ??= {};
    manifest.analytics.googleAnalytics ??= {};
    manifest.analytics.googleAnalytics.measurementId = measurementId;

    const propertyId = extractAnalyticsPropertyId(details);
    if (propertyId) {
      manifest.analytics.googleAnalytics.analyticsPropertyId = propertyId;
    }

    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`platform-manifest.json updated with GA4 Measurement ID ${measurementId}.`);
  }
}

async function getAnalyticsDetails(tokenValue, firebaseProjectId) {
  try {
    return await requestJson(tokenValue, 'GET', `/projects/${firebaseProjectId}/analyticsDetails`);
  } catch (error) {
    if (error.status === 404) {
      return undefined;
    }
    throw error;
  }
}

async function waitForAnalyticsDetails(tokenValue, firebaseProjectId) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const details = await getAnalyticsDetails(tokenValue, firebaseProjectId);
    if (details) {
      return details;
    }
    await sleep(2000);
  }

  throw new Error('Timed out waiting for Firebase analyticsDetails after linking operation completed.');
}

async function waitForOperation(tokenValue, operationName) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const operation = await requestJson(tokenValue, 'GET', operationPath(operationName));
    if (operation.done) {
      if (operation.error) {
        throw new Error(`Firebase operation failed: ${JSON.stringify(operation.error)}`);
      }
      return operation;
    }
    await sleep(2000);
  }

  throw new Error(`Timed out waiting for Firebase operation ${operationName}.`);
}

function operationPath(operationName) {
  if (operationName.startsWith('http')) {
    return operationName;
  }
  return operationName.startsWith('/') ? operationName : `/${operationName}`;
}

async function requestJson(tokenValue, method, apiPathOrUrl, body) {
  const url = apiPathOrUrl.startsWith('http') ? apiPathOrUrl : `${firebaseApiBase}${apiPathOrUrl}`;

  const curlArgs = [
    '-sS',
    '-m',
    '60',
    '-w',
    '\n%{http_code}',
    '-X',
    method,
    '-H',
    `Authorization: Bearer ${tokenValue}`,
    '-H',
    'Content-Type: application/json'
  ];

  if (body) {
    curlArgs.push('--data-binary', JSON.stringify(body));
  }

  curlArgs.push(url);

  let stdout;
  try {
    ({ stdout } = await execFile('curl', curlArgs, { maxBuffer: 10 * 1024 * 1024 }));
  } catch (error) {
    throw new Error(`curl failed while calling Firebase API: ${error.stderr || error.message}`);
  }

  const statusBreak = stdout.lastIndexOf('\n');
  const text = statusBreak >= 0 ? stdout.slice(0, statusBreak) : stdout;
  const status = statusBreak >= 0 ? Number(stdout.slice(statusBreak + 1)) : 0;
  const payload = text ? JSON.parse(text) : {};

  if (status < 200 || status >= 300) {
    const error = new Error(payload.error?.message ?? `Firebase API request failed with ${status}`);
    error.status = status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function getFirebaseAccessToken() {
  const firebaseToolsDir = await findFirebaseToolsDir();
  const requireFromScript = createRequire(import.meta.url);
  const auth = requireFromScript(path.join(firebaseToolsDir, 'lib', 'auth.js'));
  const scopes = requireFromScript(path.join(firebaseToolsDir, 'lib', 'scopes.js'));
  const account = auth.getGlobalDefaultAccount();

  if (!account?.tokens?.refresh_token) {
    throw new Error('Firebase CLI is not logged in. Run firebase login first.');
  }

  const token = await auth.getAccessToken(account.tokens.refresh_token, [
    scopes.EMAIL,
    scopes.OPENID,
    scopes.CLOUD_PROJECTS_READONLY,
    scopes.FIREBASE_PLATFORM,
    scopes.CLOUD_PLATFORM
  ]);
  return typeof token === 'string' ? token : token.access_token;
}

async function findFirebaseToolsDir() {
  const candidates = [
    process.env.FIREBASE_TOOLS_DIR,
    path.join(homedir(), '.local', 'lib', 'node_modules', 'firebase-tools'),
    '/opt/homebrew/lib/node_modules/firebase-tools',
    '/usr/local/lib/node_modules/firebase-tools'
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await fileExists(path.join(candidate, 'lib', 'auth.js'))) {
      return candidate;
    }
  }

  throw new Error('firebase-tools was not found. Install it with npm install -g firebase-tools --prefix "$HOME/.local".');
}

async function readDefaultFirebaseProject() {
  try {
    const firebaseRc = await readJson(path.join(root, '.firebaserc'));
    return firebaseRc.projects?.default;
  } catch {
    return undefined;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function collectMeasurementIds(value, ids = new Set()) {
  if (typeof value === 'string') {
    if (measurementIdPattern.test(value)) {
      ids.add(value);
    }
  } else if (Array.isArray(value)) {
    value.forEach((entry) => collectMeasurementIds(entry, ids));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectMeasurementIds(entry, ids));
  }

  return [...ids];
}

function extractAnalyticsPropertyId(details) {
  const values = collectStrings(details);
  const propertyName = values.find((value) => /^properties\/\d+$/.test(value));
  if (propertyName) {
    return propertyName.replace('properties/', '');
  }
  return values.find((value) => /^\d{6,}$/.test(value));
}

function collectStrings(value, values = []) {
  if (typeof value === 'string') {
    values.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((entry) => collectStrings(entry, values));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectStrings(entry, values));
  }
  return values;
}

function normalizeAnalyticsPropertyId(propertyId) {
  return propertyId.startsWith('properties/') ? propertyId.replace('properties/', '') : propertyId;
}

function parseArgs(rawArgs) {
  const parsed = new Map();

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (!arg.startsWith('--')) {
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split('=', 2);
    if (inlineValue !== undefined) {
      parsed.set(rawKey, inlineValue);
      continue;
    }

    const next = rawArgs[index + 1];
    if (next && !next.startsWith('--')) {
      parsed.set(rawKey, next);
      index += 1;
    } else {
      parsed.set(rawKey, true);
    }
  }

  return parsed;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function reportFatalError(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
}
