import { createSign } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'platform-manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const args = parseArgs(process.argv.slice(2));
const config = await resolveConfig();

if (args.status) {
  printResult({
    status: config.bucket && config.auth ? 'ready' : 'setup_required',
    packageName: config.packageName,
    bucketConfigured: Boolean(config.bucket),
    authConfigured: Boolean(config.auth),
    authPrincipal: config.auth?.principal ?? null,
    authSource: config.auth?.source ?? null,
    configSource: config.configSource,
    outputDir: path.relative(root, config.outputDir) || '.',
    missingActions: missingActions(config)
  });
  process.exit(0);
}

if (!config.bucket || !config.auth) {
  printResult({
    status: 'setup_required',
    packageName: config.packageName,
    bucketConfigured: Boolean(config.bucket),
    authConfigured: Boolean(config.auth),
    authPrincipal: config.auth?.principal ?? null,
    authSource: config.auth?.source ?? null,
    missingActions: missingActions(config)
  });
  process.exitCode = 2;
} else {
  const result = await fetchReports(config, args.lookbackMonths);
  printResult(result);
}

async function fetchReports(resolved, lookbackMonths) {
  const token = await getAccessToken(resolved.auth);
  const months = recentMonths(lookbackMonths);
  const prefixes = reportPrefixes(resolved.packageName, months);
  const priorStatePath = path.join(resolved.outputDir, 'latest-fetch.json');
  const priorState = await readJsonIfExists(priorStatePath);
  const priorByName = new Map((priorState?.objects ?? []).map((item) => [item.name, item]));

  await mkdir(resolved.outputDir, { recursive: true });

  const listed = [];
  for (const prefix of prefixes) {
    listed.push(...await listObjects(resolved.bucket, prefix, token));
  }

  const uniqueObjects = [...new Map(listed.map((item) => [item.name, item])).values()]
    .filter((item) => item.name.includes(resolved.packageName))
    .sort((a, b) => a.name.localeCompare(b.name));
  const objects = [];
  let downloaded = 0;
  let unchanged = 0;
  let dataCapturedThrough = null;

  for (const object of uniqueObjects) {
    const fileName = safeFileName(path.posix.basename(object.name));
    const localPath = path.join(resolved.outputDir, fileName);
    const previous = priorByName.get(object.name);
    let latestDate = previous?.latestDate ?? null;

    if (previous?.generation === object.generation && existsSync(localPath)) {
      unchanged += 1;
    } else {
      const bytes = downloadObject(resolved.bucket, object.name, token);
      const text = decodeReport(bytes);
      latestDate = latestReportDate(text);
      await writeFile(localPath, text, 'utf8');
      downloaded += 1;
    }

    if (latestDate && (!dataCapturedThrough || latestDate > dataCapturedThrough)) {
      dataCapturedThrough = latestDate;
    }

    objects.push({
      name: object.name,
      generation: object.generation ?? null,
      updated: object.updated ?? null,
      size: Number(object.size ?? 0),
      localPath: path.relative(root, localPath),
      latestDate
    });
  }

  const state = {
    status: 'ok',
    fetchedAt: new Date().toISOString(),
    packageName: resolved.packageName,
    bucket: resolved.bucket,
    authPrincipal: resolved.auth.principal,
    authSource: resolved.auth.source,
    months,
    dataCapturedThrough,
    reportCount: objects.length,
    downloaded,
    unchanged,
    objects,
    caveats: [
      'Google Play bulk reports are updated asynchronously and can lag source activity by 3 to 7 days.',
      'Store listing visitors are cohort metrics; do not sum daily visitors to reproduce weekly or monthly unique cohorts.'
    ]
  };
  await writeFile(priorStatePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  return state;
}

async function resolveConfig() {
  const play = manifest.platforms?.googlePlayAndroid ?? {};
  const reporting = play.reporting ?? {};
  const configPath = expandHome(
    env('GOOGLE_PLAY_REPORT_CONFIG')
      ?? reporting.configPath
      ?? '$HOME/.config/google-play/arrow-again-reports.json'
  );
  const fileConfig = await readJsonIfExists(configPath) ?? {};
  const bucket = normalizeBucket(
    env(reporting.bucketEnv ?? 'GOOGLE_PLAY_REPORT_BUCKET')
      ?? fileConfig.bucket
      ?? fileConfig.bucketUri
  );
  const credentialsPath = expandHome(
    env(reporting.credentialsEnv ?? 'GOOGLE_PLAY_REPORT_CREDENTIALS')
      ?? fileConfig.credentialsPath
      ?? env('GOOGLE_APPLICATION_CREDENTIALS')
  );
  const explicitCredentials = credentialsPath && existsSync(credentialsPath)
    ? JSON.parse(await readFile(credentialsPath, 'utf8'))
    : undefined;
  const gcloudAccount = activeGcloudAccount();
  const auth = explicitCredentials
    ? {
        kind: 'service-account',
        credentials: explicitCredentials,
        principal: explicitCredentials.client_email,
        source: credentialsPath.replace(os.homedir(), '$HOME')
      }
    : gcloudAdcAvailable()
      ? {
          kind: 'gcloud-adc',
          principal: gcloudAccount ?? 'gcloud ADC user',
          source: 'gcloud application-default credentials'
        }
      : await fallbackServiceAccountAuth();
  const configuredOutput = fileConfig.outputDir ?? reporting.outputDir ?? 'reports/play-console';
  const outputDir = path.isAbsolute(configuredOutput)
    ? configuredOutput
    : path.join(root, configuredOutput);

  return {
    packageName: play.applicationId,
    bucket,
    auth,
    outputDir,
    configPath,
    configSource: existsSync(configPath) ? configPath.replace(os.homedir(), '$HOME') : null
  };
}

async function getAccessToken(auth) {
  if (auth.kind === 'service-account') {
    return createServiceAccountAccessToken(auth.credentials);
  }
  const result = spawnSync('gcloud', ['auth', 'application-default', 'print-access-token'], {
    encoding: 'utf8',
    timeout: 30_000
  });
  if (result.status !== 0 || !result.stdout.trim()) {
    throw new Error(`Unable to refresh gcloud application-default credentials: ${(result.stderr || result.stdout).trim()}`);
  }
  return result.stdout.trim();
}

async function fallbackServiceAccountAuth() {
  const fallbackPath = firstExisting(defaultCredentialPaths());
  if (!fallbackPath) return undefined;
  const credentials = JSON.parse(await readFile(fallbackPath, 'utf8'));
  return {
    kind: 'service-account',
    credentials,
    principal: credentials.client_email,
    source: fallbackPath.replace(os.homedir(), '$HOME')
  };
}

function gcloudAdcAvailable() {
  const result = spawnSync('gcloud', ['auth', 'application-default', 'print-access-token'], {
    encoding: 'utf8',
    timeout: 30_000
  });
  return result.status === 0 && Boolean(result.stdout.trim());
}

function activeGcloudAccount() {
  const result = spawnSync('gcloud', ['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'], {
    encoding: 'utf8',
    timeout: 10_000
  });
  return result.status === 0 ? result.stdout.trim() || undefined : undefined;
}

function reportPrefixes(packageName, months) {
  const prefixes = [];
  for (const month of months) {
    prefixes.push(
      `stats/store_performance/store_performance_${packageName}_${month}_`,
      `stats/installs/installs_${packageName}_${month}`,
      `stats/crashes/crashes_${packageName}_${month}`,
      `stats/ratings/ratings_${packageName}_${month}`,
      `reviews/reviews_${packageName}_${month}`
    );
  }
  return prefixes;
}

async function listObjects(bucket, prefix, token) {
  const items = [];
  let pageToken;
  do {
    const query = new URLSearchParams({ prefix });
    if (pageToken) query.set('pageToken', pageToken);
    const response = requestBuffer(
      `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o?${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    assertSuccess(response, `List Google Play reports for ${prefix}`);
    const payload = JSON.parse(response.body.toString('utf8'));
    items.push(...(payload.items ?? []));
    pageToken = payload.nextPageToken;
  } while (pageToken);
  return items;
}

function downloadObject(bucket, objectName, token) {
  const response = requestBuffer(
    `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName)}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` }, maxBuffer: 100 * 1024 * 1024 }
  );
  assertSuccess(response, `Download ${objectName}`);
  return response.body;
}

async function createServiceAccountAccessToken(serviceAccount) {
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Google Play report credentials require client_email and private_key.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: 'RS256', typ: 'JWT' });
  const claim = base64UrlJson({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/devstorage.read_only',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  });
  const unsigned = `${header}.${claim}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${signer.sign(serviceAccount.private_key, 'base64url')}`;
  const response = requestBuffer('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    }).toString()
  });
  assertSuccess(response, 'Request Google Play report access token');
  const payload = JSON.parse(response.body.toString('utf8'));
  if (!payload.access_token) throw new Error('OAuth response did not include access_token.');
  return payload.access_token;
}

function requestBuffer(url, options = {}) {
  const args = ['-sS', '--max-time', '60', '-X', options.method ?? 'GET'];
  for (const [name, value] of Object.entries(options.headers ?? {})) {
    args.push('-H', `${name}: ${value}`);
  }
  if (options.body !== undefined) args.push('--data', String(options.body));
  args.push('-w', '\n%{http_code}', url);
  const result = spawnSync('curl', args, {
    encoding: null,
    timeout: 65_000,
    maxBuffer: options.maxBuffer ?? 20 * 1024 * 1024
  });
  if (result.error) throw result.error;
  const output = result.stdout ?? Buffer.alloc(0);
  const separator = output.lastIndexOf(10);
  const body = separator === -1 ? output : output.subarray(0, separator);
  const status = Number((separator === -1 ? Buffer.alloc(0) : output.subarray(separator + 1)).toString('ascii'));
  if (!Number.isFinite(status)) {
    throw new Error(`HTTP request failed: ${(result.stderr ?? output).toString('utf8').slice(0, 500)}`);
  }
  return { status, body };
}

function assertSuccess(response, action) {
  if (response.status >= 200 && response.status < 300) return;
  const detail = response.body.toString('utf8').slice(0, 1000);
  if (response.status === 403) {
    throw new Error(`${action} failed with HTTP 403. Invite the service account in Play Console and grant the global read-only permission to view app information and download bulk reports. ${detail}`);
  }
  throw new Error(`${action} failed with HTTP ${response.status}: ${detail}`);
}

function decodeReport(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(buffer.subarray(2)).replace(/^\uFEFF/, '');
  }
  if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.alloc(Math.max(0, buffer.length - 2));
    for (let index = 2; index + 1 < buffer.length; index += 2) {
      swapped[index - 2] = buffer[index + 1];
      swapped[index - 1] = buffer[index];
    }
    return new TextDecoder('utf-16le').decode(swapped).replace(/^\uFEFF/, '');
  }
  return new TextDecoder('utf-8').decode(buffer).replace(/^\uFEFF/, '');
}

function latestReportDate(text) {
  let latest = null;
  for (const match of text.matchAll(/(?:^|\n)(\d{4}-\d{2}-\d{2})(?=,|\t)/g)) {
    if (!latest || match[1] > latest) latest = match[1];
  }
  return latest;
}

function recentMonths(count) {
  const now = new Date();
  const months = [];
  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    months.push(`${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function parseArgs(values) {
  const parsed = { json: false, status: false, lookbackMonths: 2 };
  for (const value of values) {
    if (value === '--json') parsed.json = true;
    else if (value === '--status') parsed.status = true;
    else if (value.startsWith('--lookback-months=')) {
      parsed.lookbackMonths = Number(value.slice('--lookback-months='.length));
    }
  }
  if (!Number.isInteger(parsed.lookbackMonths) || parsed.lookbackMonths < 1 || parsed.lookbackMonths > 24) {
    throw new Error('--lookback-months must be an integer between 1 and 24.');
  }
  return parsed;
}

function missingActions(resolved) {
  const actions = [];
  if (!resolved.bucket) actions.push('Copy the Cloud Storage URI from Play Console Download reports and save it as GOOGLE_PLAY_REPORT_BUCKET or config.bucketUri.');
  if (!resolved.auth) actions.push('Run gcloud auth application-default login with a Google account that has global Play Console bulk-report access, or configure a service-account JSON path.');
  if (resolved.auth?.kind === 'service-account') actions.push(`Invite ${resolved.auth.principal} in Play Console with the global read-only bulk-report permission.`);
  return actions;
}

function defaultCredentialPaths() {
  return [
    path.join(os.homedir(), '.config/google-play/arrow-again-report-reader.json'),
    path.join(os.homedir(), '.config/ordinal-trace/ga-service-account.json'),
    path.join(os.homedir(), '.config/ga/ga-daily-reader.json')
  ];
}

function firstExisting(paths) {
  return paths.find((candidate) => existsSync(candidate));
}

function normalizeBucket(value) {
  if (!value) return undefined;
  const normalized = String(value).trim().replace(/^gs:\/\//, '').replace(/\/+$/, '');
  if (!/^[a-z0-9._-]+$/.test(normalized)) throw new Error('Google Play report bucket has an invalid format.');
  return normalized;
}

function safeFileName(value) {
  if (!/^[A-Za-z0-9._-]+$/.test(value)) throw new Error(`Unsafe report file name: ${value}`);
  return value;
}

async function readJsonIfExists(filePath) {
  if (!filePath || !existsSync(filePath)) return undefined;
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function expandHome(value) {
  if (!value) return undefined;
  return String(value).replace(/^\$HOME(?=\/|$)/, os.homedir()).replace(/^~(?=\/|$)/, os.homedir());
}

function env(name) {
  const value = process.env[name];
  return value?.trim() || undefined;
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function printResult(value) {
  if (args.json) {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
    return;
  }
  console.log(`# Google Play report fetch\nStatus: ${value.status}`);
  console.log(`Package: ${value.packageName}`);
  if (value.dataCapturedThrough) console.log(`Data captured through: ${value.dataCapturedThrough}`);
  if (Number.isInteger(value.reportCount)) console.log(`Reports: ${value.reportCount} (${value.downloaded} downloaded, ${value.unchanged} unchanged)`);
  for (const action of value.missingActions ?? []) console.log(`- ${action}`);
}
