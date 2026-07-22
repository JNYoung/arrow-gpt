#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createSign } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const today = new Date();
const reportDate = args.date ?? formatLocalDate(addDays(today, -1));
const lookbackDays = parsePositiveInteger(args['lookback-days'], 7);
const lookbackStart = formatLocalDate(addDays(parseLocalDate(reportDate), -(lookbackDays - 1)));
const jsonOnly = Boolean(args.json);

configureNetworkProxy();

const measurementIdPattern = /^G-[A-Z0-9]+$/i;
const propertyIdPattern = /^\d+$/;
const futureEvents = new Set(['ad_impression']);
const keyEvents = [
  'session_start',
  'game_start',
  'level_start',
  'level_end',
  'level_complete',
  'level_fail',
  'level_quit',
  'rewarded_request',
  'rewarded_complete',
  'rewarded_fail',
  'feedback_open'
];

const report = {
  generatedAt: new Date().toISOString(),
  project: 'Arrow Again',
  windows: {
    reportDate,
    lookbackStart,
    lookbackEnd: reportDate,
    lookbackDays
  },
  config: {},
  checks: [],
  localInventory: {},
  liveData: {
    status: 'not_run',
    authSource: undefined,
    property: undefined,
    yesterday: undefined,
    lookback: undefined,
    realtime: undefined,
    error: undefined
  },
  analysis: {
    status: 'pending',
    confidence: 'low',
    caveats: [],
    recommendations: []
  }
};

try {
  await run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  addCheck('fatal', 'Daily monitor execution', 'fail', message);
  report.analysis.status = 'blocked';
  report.analysis.recommendations.push('Fix the script/runtime error before using this monitor as a daily gate.');
}

if (args.out) {
  await writeReport(String(args.out), report);
}

if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printReport(report);
}

const hasCriticalFailure = report.checks.some((check) => check.status === 'fail');
process.exit(hasCriticalFailure ? 1 : 0);

async function run() {
  const manifest = await readJson('platform-manifest.json');
  const packageJson = await readJson('package.json');
  const eventSpec = await readText('docs/analytics-event-spec.md');
  const gaSetupDoc = await readText('docs/google-analytics-setup.md');
  const mainSource = await readText('src/main.ts');
  const analyticsSource = await readText('src/analytics.ts');

  const gaConfig = manifest.analytics?.googleAnalytics ?? {};
  const measurementId =
    getEnvString('VITE_GA_MEASUREMENT_ID') ?? getEnvString('GA_MEASUREMENT_ID') ?? gaConfig.measurementId;
  const propertyId =
    getEnvString('GA4_PROPERTY_ID') ?? getEnvString('GA_PROPERTY_ID') ?? gaConfig.analyticsPropertyId;

  report.config = {
    packageName: packageJson.name,
    appVersion: packageJson.version,
    firebaseProjectId: gaConfig.firebase?.projectId,
    measurementId: maskMeasurementId(measurementId),
    analyticsPropertyId: propertyId,
    runtime: gaConfig.runtime,
    provider: gaConfig.provider
  };

  if (measurementIdPattern.test(measurementId ?? '')) {
    addCheck('measurement_id', 'GA4 Measurement ID', 'pass', `Configured as ${maskMeasurementId(measurementId)}.`);
  } else {
    addCheck('measurement_id', 'GA4 Measurement ID', 'fail', 'Missing or invalid Measurement ID.');
  }

  if (propertyIdPattern.test(propertyId ?? '')) {
    addCheck('property_id', 'GA4 property ID', 'pass', `Configured as ${propertyId}.`);
  } else {
    addCheck('property_id', 'GA4 property ID', 'fail', 'Missing or invalid GA4 property ID.');
  }

  runLocalVerifyScript();
  checkSourceMarkers(gaSetupDoc, analyticsSource, mainSource);
  checkEventInventory(eventSpec, mainSource, analyticsSource);

  if (!propertyIdPattern.test(propertyId ?? '')) {
    report.liveData.status = 'skipped';
    report.liveData.error = 'GA4 property ID is unavailable.';
    finishAnalysis();
    return;
  }

  if (args['no-live']) {
    report.liveData.status = 'skipped';
    report.liveData.error = 'Skipped by --no-live.';
    finishAnalysis();
    return;
  }

  const tokenResult = await resolveAccessToken();
  if (!tokenResult.token) {
    report.liveData.status = 'blocked';
    report.liveData.error = tokenResult.error ?? 'No GA4 read credential found.';
    addCheck(
      'ga_data_api_auth',
      'GA Data API auth',
      'warn',
      'No live GA read credential found. Set GOOGLE_ANALYTICS_ACCESS_TOKEN, GOOGLE_APPLICATION_CREDENTIALS, or gcloud ADC.'
    );
    finishAnalysis();
    return;
  }

  report.liveData.authSource = tokenResult.source;
  report.liveData.property = normalizePropertyName(propertyId);
  addCheck('ga_data_api_auth', 'GA Data API auth', 'pass', `Using ${tokenResult.source}.`);

  try {
    const [yesterdayEvents, lookbackEvents, yesterdaySummary, lookbackSummary] = await Promise.all([
      runEventReport(tokenResult.token, propertyId, reportDate, reportDate),
      runEventReport(tokenResult.token, propertyId, lookbackStart, reportDate),
      runSummaryReport(tokenResult.token, propertyId, reportDate, reportDate),
      runSummaryReport(tokenResult.token, propertyId, lookbackStart, reportDate)
    ]);

    report.liveData.yesterday = {
      summary: parseSummary(yesterdaySummary),
      events: parseEventRows(yesterdayEvents)
    };
    report.liveData.lookback = {
      summary: parseSummary(lookbackSummary),
      events: parseEventRows(lookbackEvents)
    };

    try {
      const realtime = await runRealtimeReport(tokenResult.token, propertyId);
      report.liveData.realtime = {
        events: parseEventRows(realtime)
      };
    } catch (error) {
      report.liveData.realtime = {
        error: error instanceof Error ? error.message : String(error)
      };
    }

    report.liveData.status = 'ok';
    addCheck('ga_data_api_query', 'GA Data API query', 'pass', 'Daily and lookback event reports returned.');
  } catch (error) {
    report.liveData.status = 'blocked';
    report.liveData.error = error instanceof Error ? error.message : String(error);
    addCheck('ga_data_api_query', 'GA Data API query', 'warn', report.liveData.error);
  }

  finishAnalysis();
}

function runLocalVerifyScript() {
  const result = spawnSync(process.execPath, ['scripts/verify-analytics-config.mjs'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30_000
  });

  if (result.status === 0) {
    addCheck('verify_analytics', 'Existing analytics verification', 'pass', trimOutput(result.stdout));
    return;
  }

  addCheck(
    'verify_analytics',
    'Existing analytics verification',
    'fail',
    trimOutput(result.stderr || result.stdout || 'npm run verify:analytics failed.')
  );
}

function checkSourceMarkers(gaSetupDoc, analyticsSource, mainSource) {
  const markers = [
    ['gtag_runtime', analyticsSource.includes('trackGoogleAnalytics'), 'GA4 gtag runtime exists.'],
    ['debug_mode', analyticsSource.includes('debug_mode'), 'DebugView flag is wired.'],
    ['no_pageview', analyticsSource.includes('send_page_view: false'), 'Page views are intentionally disabled.'],
    ['payload_sanitizer', analyticsSource.includes('sanitizePayload'), 'Event payload sanitizer exists.'],
    ['anonymous_session', mainSource.includes('install_id') && mainSource.includes('session_id'), 'Anonymous local session identity exists.'],
    ['ga_setup_doc', gaSetupDoc.includes('DebugView') && gaSetupDoc.includes('Measurement ID'), 'GA setup doc covers DebugView and IDs.']
  ];

  for (const [id, passed, detail] of markers) {
    addCheck(id, detail, passed ? 'pass' : 'fail', passed ? detail : `Missing marker: ${id}.`);
  }
}

function checkEventInventory(eventSpec, mainSource, analyticsSource) {
  const specEvents = extractSpecEvents(eventSpec);
  const trackedEvents = extractTrackedEvents(mainSource);
  const requiredSpecEvents = specEvents.filter((event) => !futureEvents.has(event));
  const missingFromCode = requiredSpecEvents.filter((event) => !trackedEvents.includes(event));
  const undocumentedTracked = trackedEvents.filter((event) => !specEvents.includes(event));
  const commonParams = extractCommonParams(eventSpec);
  const runtimeSource = `${mainSource}\n${analyticsSource}`;
  const missingCommonParams = commonParams.filter((param) => !runtimeSource.includes(param));

  report.localInventory = {
    specEvents,
    trackedEvents,
    requiredSpecEvents,
    futureEvents: [...futureEvents],
    missingFromCode,
    undocumentedTracked,
    commonParams,
    missingCommonParams
  };

  if (missingFromCode.length === 0) {
    addCheck('event_coverage', 'Event spec coverage', 'pass', `${requiredSpecEvents.length} required events are present in code.`);
  } else {
    addCheck('event_coverage', 'Event spec coverage', 'fail', `Missing tracked events: ${missingFromCode.join(', ')}.`);
  }

  if (undocumentedTracked.length === 0) {
    addCheck('event_dictionary', 'Event dictionary coverage', 'pass', 'Tracked events are documented.');
  } else {
    addCheck('event_dictionary', 'Event dictionary coverage', 'warn', `Undocumented tracked events: ${undocumentedTracked.join(', ')}.`);
  }

  if (missingCommonParams.length === 0) {
    addCheck('common_params', 'Common parameter coverage', 'pass', `${commonParams.length} common parameters are present in app tracking.`);
  } else {
    addCheck('common_params', 'Common parameter coverage', 'fail', `Missing common parameters: ${missingCommonParams.join(', ')}.`);
  }
}

function finishAnalysis() {
  const failedChecks = report.checks.filter((check) => check.status === 'fail');
  const warningChecks = report.checks.filter((check) => check.status === 'warn');
  const lookbackCounts = countEvents(report.liveData.lookback?.events ?? []);
  const yesterdayCounts = countEvents(report.liveData.yesterday?.events ?? []);
  const totalLookbackEvents = report.liveData.lookback?.summary?.eventCount ?? sumValues(lookbackCounts);
  const totalYesterdayEvents = report.liveData.yesterday?.summary?.eventCount ?? sumValues(yesterdayCounts);
  const lookbackActiveUsers =
    report.liveData.lookback?.summary?.activeUsers ?? maxActiveUsers(report.liveData.lookback?.events ?? []);
  const yesterdayActiveUsers = report.liveData.yesterday?.summary?.activeUsers ?? maxActiveUsers(report.liveData.yesterday?.events ?? []);

  report.analysis.caveats.push('Closed-test sample sizes are directional only; treat optimization signals as hypotheses until traffic grows.');

  if (failedChecks.length > 0) {
    report.analysis.status = 'blocked';
    report.analysis.recommendations.push('Fix failing local analytics checks before relying on GA dashboard numbers.');
  } else if (report.liveData.status === 'blocked') {
    report.analysis.status = 'pipeline_ready_live_access_missing';
    report.analysis.recommendations.push('Grant GA4 Data API read access so the daily run can verify real dashboard data, not only local wiring.');
  } else if (report.liveData.status === 'skipped' || report.liveData.status === 'not_run') {
    report.analysis.status = 'pipeline_ready_live_skipped';
    report.analysis.recommendations.push('Run without --no-live or provide GA credentials when daily dashboard validation is needed.');
  } else if (totalLookbackEvents === 0) {
    report.analysis.status = 'no_recent_ga_events';
    report.analysis.recommendations.push('Open the game with GA debug enabled and confirm session_start/game_start in GA4 DebugView.');
  } else if (warningChecks.length > 0) {
    report.analysis.status = 'watch';
  } else {
    report.analysis.status = 'healthy';
  }

  if (lookbackActiveUsers < 20 || totalLookbackEvents < 200) {
    report.analysis.confidence = 'low';
  } else if (lookbackActiveUsers < 100 || totalLookbackEvents < 1000) {
    report.analysis.confidence = 'medium';
  } else {
    report.analysis.confidence = 'high';
  }

  if (report.localInventory.futureEvents?.includes('ad_impression')) {
    report.analysis.recommendations.push(
      'Ad revenue optimization is blocked until ad_impression or impression-level revenue callback data is wired.'
    );
  }

  if (totalLookbackEvents > 0) {
    addLiveRecommendations(lookbackCounts, yesterdayCounts, totalLookbackEvents, totalYesterdayEvents, yesterdayActiveUsers);
  }

  if (report.analysis.recommendations.length === 0) {
    report.analysis.recommendations.push('Keep the daily monitor running; no immediate analytics-chain issue was detected.');
  }
}

function addLiveRecommendations(lookbackCounts, yesterdayCounts, totalLookbackEvents, totalYesterdayEvents, yesterdayActiveUsers) {
  const missingKeyEvents = keyEvents.filter((event) => (lookbackCounts[event] ?? 0) === 0);
  report.analysis.keyEventCounts = Object.fromEntries(keyEvents.map((event) => [event, lookbackCounts[event] ?? 0]));
  report.analysis.yesterday = {
    totalEvents: totalYesterdayEvents,
    activeUsers: yesterdayActiveUsers,
    keyEventCounts: Object.fromEntries(keyEvents.map((event) => [event, yesterdayCounts[event] ?? 0]))
  };

  if ((lookbackCounts.session_start ?? 0) === 0 || (lookbackCounts.game_start ?? 0) === 0) {
    report.analysis.recommendations.push('GA has events but lacks session_start/game_start; verify startup tracking and Measurement ID routing.');
  }

  if ((lookbackCounts.game_start ?? 0) > 0 && (lookbackCounts.level_start ?? 0) === 0) {
    report.analysis.recommendations.push('Users are reaching startup but no level_start is recorded; inspect start-button flow and first-level launch.');
  }

  if ((lookbackCounts.level_start ?? 0) > 0 && (lookbackCounts.level_end ?? 0) === 0) {
    report.analysis.recommendations.push('Level attempts start but do not end in GA; inspect finish/quit/restart event paths.');
  }

  const levelStarts = lookbackCounts.level_start ?? 0;
  const levelEnds = lookbackCounts.level_end ?? 0;
  const rewardedRequests = lookbackCounts.rewarded_request ?? 0;
  const rewardedCompletes = lookbackCounts.rewarded_complete ?? 0;
  const blockedMoves = lookbackCounts.level_blocked_move ?? 0;

  report.analysis.rates = {
    levelEndPerStart: ratio(levelEnds, levelStarts),
    levelCompletePerEnd: ratio(lookbackCounts.level_complete ?? 0, levelEnds),
    rewardedCompletePerRequest: ratio(rewardedCompletes, rewardedRequests),
    blockedMovePerLevelStart: ratio(blockedMoves, levelStarts),
    feedbackOpenPerGameStart: ratio(lookbackCounts.feedback_open ?? 0, lookbackCounts.game_start ?? 0)
  };

  if (rewardedRequests >= 5 && ratio(rewardedCompletes, rewardedRequests) < 0.6) {
    report.analysis.recommendations.push('Rewarded completion rate is weak; check ad availability, close behavior, and reward grant reliability.');
  }

  if (levelStarts >= 10 && ratio(blockedMoves, levelStarts) > 5) {
    report.analysis.recommendations.push('Blocked moves per attempt are high; review early level clarity and arrow affordance before tuning difficulty.');
  }

  if (missingKeyEvents.length > 0) {
    report.analysis.caveats.push(`No lookback data for key events: ${missingKeyEvents.join(', ')}.`);
  }

  if (totalYesterdayEvents === 0) {
    report.analysis.caveats.push('Yesterday has no GA events; check whether testers played or whether GA processing/access lagged.');
  }
}

async function runSummaryReport(token, propertyId, startDate, endDate) {
  return requestAnalyticsData(token, propertyId, 'runReport', {
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'eventCount' },
      { name: 'activeUsers' },
      { name: 'newUsers' },
      { name: 'sessions' },
      { name: 'engagedSessions' }
    ]
  });
}

async function runEventReport(token, propertyId, startDate, endDate) {
  return requestAnalyticsData(token, propertyId, 'runReport', {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: '1000'
  });
}

async function runRealtimeReport(token, propertyId) {
  return requestAnalyticsData(token, propertyId, 'runRealtimeReport', {
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    limit: '100'
  });
}

async function requestAnalyticsData(token, propertyId, method, body) {
  const propertyName = normalizePropertyName(propertyId);
  const url = `https://analyticsdata.googleapis.com/v1beta/${propertyName}:${method}`;
  const response = requestJson(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`${method} failed with HTTP ${response.status}: ${response.text.slice(0, 600)}`);
  }

  return JSON.parse(response.text);
}

async function resolveAccessToken() {
  const directToken = getEnvString('GOOGLE_ANALYTICS_ACCESS_TOKEN') ?? getEnvString('GA4_ACCESS_TOKEN');
  if (directToken) {
    return { token: directToken, source: 'GOOGLE_ANALYTICS_ACCESS_TOKEN' };
  }

  const serviceAccount = await readServiceAccount();
  if (serviceAccount) {
    try {
      return {
        token: await createServiceAccountAccessToken(serviceAccount),
        source: serviceAccount.source
      };
    } catch (error) {
      return {
        token: undefined,
        source: serviceAccount.source,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  const gcloud = spawnSync('gcloud', ['auth', 'application-default', 'print-access-token'], {
    encoding: 'utf8',
    timeout: 15_000
  });

  if (gcloud.status === 0 && gcloud.stdout.trim()) {
    return { token: gcloud.stdout.trim(), source: 'gcloud application-default credentials' };
  }

  return {
    token: undefined,
    source: undefined,
    error: trimOutput(gcloud.stderr || gcloud.stdout || 'No token source was available.')
  };
}

async function readServiceAccount() {
  const inline = getEnvString('GA_SERVICE_ACCOUNT_JSON');
  if (inline) {
    const raw = existsSync(inline) ? await readFile(inline, 'utf8') : inline;
    return {
      ...JSON.parse(raw),
      source: existsSync(inline) ? 'GA_SERVICE_ACCOUNT_JSON file' : 'GA_SERVICE_ACCOUNT_JSON'
    };
  }

  const credentialsPath = getEnvString('GOOGLE_APPLICATION_CREDENTIALS');
  if (credentialsPath && existsSync(credentialsPath)) {
    return {
      ...JSON.parse(await readFile(credentialsPath, 'utf8')),
      source: 'GOOGLE_APPLICATION_CREDENTIALS'
    };
  }

  for (const fallbackPath of defaultServiceAccountPaths()) {
    if (existsSync(fallbackPath)) {
      return {
        ...JSON.parse(await readFile(fallbackPath, 'utf8')),
        source: path.relative(root, fallbackPath).startsWith('..')
          ? fallbackPath.replace(process.env.HOME ?? '', '$HOME')
          : path.relative(root, fallbackPath)
      };
    }
  }

  return undefined;
}

async function createServiceAccountAccessToken(serviceAccount) {
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Service account credentials require client_email and private_key.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: 'RS256', typ: 'JWT' });
  const claim = base64UrlJson({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  });
  const unsigned = `${header}.${claim}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${signer.sign(serviceAccount.private_key, 'base64url')}`;

  const response = requestJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`OAuth token request failed with HTTP ${response.status}: ${response.text.slice(0, 400)}`);
  }

  const payload = JSON.parse(response.text);
  if (!payload.access_token) {
    throw new Error('OAuth token response did not include access_token.');
  }

  return payload.access_token;
}

function extractSpecEvents(markdown) {
  const events = new Set();
  let inEventTable = false;

  for (const line of markdown.split('\n')) {
    if (/^\|\s*Event\s*\|/.test(line)) {
      inEventTable = true;
      continue;
    }
    if (inEventTable && /^##\s+/.test(line)) {
      inEventTable = false;
    }
    if (!inEventTable) {
      continue;
    }
    const match = line.match(/^\|\s*`([a-zA-Z0-9_]+)`\s*\|/);
    if (match) {
      events.add(match[1]);
    }
  }

  return [...events].sort();
}

function extractCommonParams(markdown) {
  const params = new Set();
  let inCommonTable = false;

  for (const line of markdown.split('\n')) {
    if (/^\|\s*Parameter\s*\|/.test(line)) {
      inCommonTable = true;
      continue;
    }
    if (inCommonTable && /^##\s+/.test(line)) {
      inCommonTable = false;
    }
    if (!inCommonTable) {
      continue;
    }
    const match = line.match(/^\|\s*`([a-zA-Z0-9_]+)`\s*\|/);
    if (match) {
      params.add(match[1]);
    }
  }

  return [...params].sort();
}

function extractTrackedEvents(source) {
  const events = new Set();
  let index = 0;

  while (index < source.length) {
    const start = source.indexOf('this.track(', index);
    if (start === -1) {
      break;
    }

    const firstArg = readFirstArgument(source, start + 'this.track('.length);
    const direct = firstArg.match(/^\s*'([a-zA-Z0-9_]+)'\s*$/);
    const conditional = firstArg.match(/^\s*[^?]+\?\s*'([a-zA-Z0-9_]+)'\s*:\s*'([a-zA-Z0-9_]+)'\s*$/);

    if (direct) {
      events.add(direct[1]);
    } else if (conditional) {
      events.add(conditional[1]);
      events.add(conditional[2]);
    }

    index = start + 'this.track('.length + Math.max(firstArg.length, 1);
  }

  return [...events].sort();
}

function readFirstArgument(source, start) {
  let quote;
  let escaped = false;
  let depth = 0;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      continue;
    }

    if (char === '(' || char === '[' || char === '{') {
      depth += 1;
      continue;
    }

    if (char === ')' || char === ']' || char === '}') {
      if (depth === 0) {
        return source.slice(start, index).trim();
      }
      depth -= 1;
      continue;
    }

    if (char === ',' && depth === 0) {
      return source.slice(start, index).trim();
    }
  }

  return source.slice(start).trim();
}

function parseEventRows(response) {
  return (response.rows ?? [])
    .map((row) => ({
      eventName: row.dimensionValues?.[0]?.value ?? '(not set)',
      eventCount: Number(row.metricValues?.[0]?.value ?? 0),
      activeUsers: Number(row.metricValues?.[1]?.value ?? 0)
    }))
    .sort((a, b) => b.eventCount - a.eventCount || a.eventName.localeCompare(b.eventName));
}

function parseSummary(response) {
  const row = response.rows?.[0];
  return {
    eventCount: Number(row?.metricValues?.[0]?.value ?? 0),
    activeUsers: Number(row?.metricValues?.[1]?.value ?? 0),
    newUsers: Number(row?.metricValues?.[2]?.value ?? 0),
    sessions: Number(row?.metricValues?.[3]?.value ?? 0),
    engagedSessions: Number(row?.metricValues?.[4]?.value ?? 0)
  };
}

function defaultServiceAccountPaths() {
  const home = process.env.HOME;
  if (!home) {
    return [];
  }

  return [
    path.join(home, '.config/ordinal-trace/ga-service-account.json'),
    path.join(home, '.config/ga/ga-daily-reader.json')
  ];
}

function configureNetworkProxy() {
  if (getEnvString('HTTPS_PROXY') || getEnvString('https_proxy') || process.platform !== 'darwin') {
    return;
  }

  const proxy = spawnSync('scutil', ['--proxy'], {
    encoding: 'utf8',
    timeout: 5_000
  });
  if (proxy.status !== 0 || !proxy.stdout) {
    return;
  }

  const httpsEnabled = proxy.stdout.match(/HTTPSEnable\s*:\s*1/);
  const host = proxy.stdout.match(/HTTPSProxy\s*:\s*(.+)/)?.[1]?.trim();
  const port = proxy.stdout.match(/HTTPSPort\s*:\s*(\d+)/)?.[1]?.trim();
  if (!httpsEnabled || !host || !port) {
    return;
  }

  const url = `http://${host}:${port}`;
  process.env.HTTPS_PROXY = url;
  process.env.HTTP_PROXY ??= url;
  process.env.NODE_USE_ENV_PROXY ??= '1';
}

function requestJson(url, options) {
  const args = ['-sS', '--max-time', '30', '-X', options.method ?? 'POST'];

  for (const [name, value] of Object.entries(options.headers ?? {})) {
    args.push('-H', `${name}: ${value}`);
  }

  if (options.body !== undefined) {
    args.push('--data', String(options.body));
  }

  args.push('-w', '\n%{http_code}', url);

  const result = spawnSync('curl', args, {
    encoding: 'utf8',
    timeout: 35_000
  });

  if (result.error) {
    throw result.error;
  }

  const output = result.stdout ?? '';
  const separator = output.lastIndexOf('\n');
  const text = separator === -1 ? output : output.slice(0, separator);
  const statusText = separator === -1 ? '' : output.slice(separator + 1).trim();
  const status = Number(statusText);

  if (!Number.isFinite(status)) {
    const detail = trimOutput(result.stderr || output || 'curl did not return an HTTP status.');
    throw new Error(`HTTP request failed: ${detail}`);
  }

  if (result.status !== 0 && status === 0) {
    throw new Error(`HTTP request failed: ${trimOutput(result.stderr || output)}`);
  }

  return { status, text };
}

function countEvents(rows) {
  return Object.fromEntries(rows.map((row) => [row.eventName, row.eventCount]));
}

function maxActiveUsers(rows) {
  return rows.reduce((max, row) => Math.max(max, row.activeUsers), 0);
}

function sumValues(record) {
  return Object.values(record).reduce((total, value) => total + Number(value ?? 0), 0);
}

function ratio(numerator, denominator) {
  if (!denominator) {
    return null;
  }
  return Math.round((numerator / denominator) * 1000) / 1000;
}

function addCheck(id, label, status, detail) {
  report.checks.push({ id, label, status, detail });
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

async function writeReport(outputPath, payload) {
  const resolved = path.resolve(root, outputPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, `${JSON.stringify(payload, null, 2)}\n`);
}

function printReport(payload) {
  console.log(`# ${payload.project} GA daily monitor`);
  console.log(`Generated: ${payload.generatedAt}`);
  console.log(`Window: ${payload.windows.reportDate}; lookback ${payload.windows.lookbackStart}..${payload.windows.lookbackEnd}`);
  console.log(`Status: ${payload.analysis.status}; confidence: ${payload.analysis.confidence}`);
  console.log('');
  console.log('Config');
  console.log(`- Measurement ID: ${payload.config.measurementId ?? 'missing'}`);
  console.log(`- GA4 property ID: ${payload.config.analyticsPropertyId ?? 'missing'}`);
  console.log(`- Firebase project: ${payload.config.firebaseProjectId ?? 'missing'}`);
  console.log('');
  console.log('Checks');
  for (const check of payload.checks) {
    console.log(`- [${check.status.toUpperCase()}] ${check.label}: ${check.detail}`);
  }

  if (payload.liveData.status === 'ok') {
    console.log('');
    console.log('GA data');
    console.log(
      `- Yesterday: ${formatSummary(payload.liveData.yesterday.summary)}`
    );
    console.log(`- Last ${payload.windows.lookbackDays} days: ${formatSummary(payload.liveData.lookback.summary)}`);
    console.log(`- Top lookback events: ${formatTopEvents(payload.liveData.lookback.events, 10)}`);
    if (payload.liveData.realtime?.events) {
      console.log(`- Realtime top events: ${formatTopEvents(payload.liveData.realtime.events, 5)}`);
    } else if (payload.liveData.realtime?.error) {
      console.log(`- Realtime: ${payload.liveData.realtime.error}`);
    }
  } else {
    console.log('');
    console.log(`GA data: ${payload.liveData.status}${payload.liveData.error ? ` - ${payload.liveData.error}` : ''}`);
  }

  console.log('');
  console.log('Recommendations');
  for (const recommendation of payload.analysis.recommendations) {
    console.log(`- ${recommendation}`);
  }

  if (payload.analysis.caveats.length > 0) {
    console.log('');
    console.log('Caveats');
    for (const caveat of payload.analysis.caveats) {
      console.log(`- ${caveat}`);
    }
  }
}

function formatSummary(summary) {
  return [
    `${summary.eventCount} events`,
    `${summary.activeUsers} active users`,
    `${summary.newUsers} new users`,
    `${summary.sessions} sessions`,
    `${summary.engagedSessions} engaged sessions`
  ].join(', ');
}

function formatTopEvents(rows, limit) {
  if (!rows || rows.length === 0) {
    return 'none';
  }
  return rows
    .slice(0, limit)
    .map((row) => `${row.eventName}=${row.eventCount}`)
    .join(', ');
}

function maskMeasurementId(value) {
  if (!value) {
    return undefined;
  }
  return value.replace(/^G-([A-Z0-9]{3}).*([A-Z0-9]{2})$/i, 'G-$1...$2');
}

function normalizePropertyName(propertyId) {
  const value = String(propertyId).trim();
  return value.startsWith('properties/') ? value : `properties/${value}`;
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function trimOutput(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, 500);
}

function getEnvString(key) {
  const value = process.env[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function parseArgs(argv) {
  const parsed = {};
  for (const token of argv) {
    if (!token.startsWith('--')) {
      continue;
    }
    const [rawKey, rawValue] = token.slice(2).split('=');
    parsed[rawKey] = rawValue ?? true;
  }
  return parsed;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseLocalDate(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid date "${value}". Use YYYY-MM-DD.`);
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
