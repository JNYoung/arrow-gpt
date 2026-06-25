#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const requiredFrameworkTerms = [
  '增长命题',
  '模板补充',
  '北极星',
  '本阶段主 KPI',
  '护栏指标',
  '最小事件闭环',
  '归因规范',
  'Go / Hold / Stop',
  '72 小时实验队列'
];
const requiredEvents = [
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
  'share_result_request',
  'feedback_open'
];
const attributionFields = [
  'traffic_source',
  'traffic_medium',
  'traffic_campaign',
  'traffic_content',
  'campaign_id',
  'creative_id'
];
const findings = [];

await run();

const failCount = findings.filter((finding) => finding.status === 'fail').length;
const warnCount = findings.filter((finding) => finding.status === 'warn').length;
const passCount = findings.filter((finding) => finding.status === 'pass').length;

console.log('# Arrow Again growth framework verification');
console.log(`Status: ${failCount > 0 ? 'FAIL' : warnCount > 0 ? 'ATTENTION' : 'PASS'}`);
console.log(`Checks: ${passCount} pass, ${warnCount} warn, ${failCount} fail`);
console.log('');

for (const finding of findings.filter((entry) => entry.status !== 'pass')) {
  console.log(`- [${finding.status.toUpperCase()}] ${finding.area}: ${finding.message}`);
}

if (findings.every((finding) => finding.status === 'pass')) {
  console.log('- All growth framework checks passed.');
}

process.exit(failCount > 0 ? 1 : 0);

async function run() {
  const [framework, eventSpec, analyticsSource, mainSource, packageJson] = await Promise.all([
    readText('docs/growth-metrics-framework.md'),
    readText('docs/analytics-event-spec.md'),
    readText('src/analytics.ts'),
    readText('src/main.ts'),
    readText('package.json')
  ]);

  for (const term of requiredFrameworkTerms) {
    add(framework.includes(term), 'framework', `Framework covers ${term}.`, `Framework missing ${term}.`);
  }

  for (const event of requiredEvents) {
    add(eventSpec.includes(`\`${event}\``), 'event_spec', `${event} documented.`, `${event} missing from docs/analytics-event-spec.md.`);
    add(mainSource.includes(`'${event}'`), 'event_code', `${event} tracked in src/main.ts.`, `${event} missing from src/main.ts.`);
  }

  for (const field of attributionFields) {
    add(eventSpec.includes(`\`${field}\``), 'attribution_spec', `${field} documented.`, `${field} missing from analytics event spec.`);
    add(analyticsSource.includes(field), 'attribution_runtime', `${field} captured in analytics runtime.`, `${field} missing from src/analytics.ts.`);
    add(mainSource.includes('campaignAttribution'), 'attribution_payload', 'Campaign attribution is merged into event payloads.', 'Campaign attribution is not merged into event payloads.');
  }

  add(packageJson.includes('"ga:daily"'), 'monitoring', 'GA daily monitor command exists.', 'Missing npm script ga:daily.');
  add(packageJson.includes('"growth:verify"'), 'monitoring', 'Growth verification command exists.', 'Missing npm script growth:verify.');
  add(
    framework.includes('GA4') && framework.includes('custom dimensions'),
    'template_gap',
    'Framework supplements template with GA4 custom-dimension requirement.',
    'Framework should state GA4 custom-dimension registration for attribution fields.',
    'warn'
  );
}

async function readText(relativePath) {
  try {
    return await readFile(path.join(root, relativePath), 'utf8');
  } catch {
    findings.push({
      status: 'fail',
      area: 'file',
      message: `${relativePath} is missing.`
    });
    return '';
  }
}

function add(condition, area, passMessage, failMessage, failStatus = 'fail') {
  findings.push({
    status: condition ? 'pass' : failStatus,
    area,
    message: condition ? passMessage : failMessage
  });
}
