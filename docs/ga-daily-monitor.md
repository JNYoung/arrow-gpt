# Arrow Again GA4 Daily Monitor

Date: 2026-06-22

## Purpose

Closed-test data is small and partly untrustworthy, so the daily GA check is a data-chain health monitor first and an optimization readout second.

Use it to answer:

- Can the app still resolve the GA4 Measurement ID and property ID?
- Are required gameplay events still present in the code and event dictionary?
- Can the daily job read GA4 Data API reports for the linked property?
- Are yesterday and the last 7 days showing enough signal to inspect product or ad-flow issues?

## Run

```bash
npm run ga:daily
```

Useful variants:

```bash
npm run ga:daily -- --date=2026-06-21
npm run ga:daily -- --lookback-days=14
npm run ga:daily -- --json --out=docs/release-data/ga-daily-latest.json
npm run ga:daily -- --no-live
```

`--no-live` keeps the local instrumentation checks but skips GA4 API reads.

## GA4 Read Access

The script reads the GA4 property from `platform-manifest.json` unless overridden:

```bash
export GA4_PROPERTY_ID=542265186
```

For live GA4 reads, provide one of:

```bash
export GOOGLE_ANALYTICS_ACCESS_TOKEN=...
export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
export GA_SERVICE_ACCOUNT_JSON=/absolute/path/to/service-account.json
```

`gcloud auth application-default print-access-token` is also attempted when available.
On this workstation, the monitor also auto-detects the already authorized local
service account at `$HOME/.config/ordinal-trace/ga-service-account.json` and the
macOS HTTPS proxy when present.

The service account or user token must have GA4 property read access and the Analytics Data API scope. Do not commit credential files or tokens.

## Daily Interpretation

Primary health checks:

- `measurement_id`, `property_id`, and `verify_analytics` must pass.
- `event_coverage` must pass before trusting any event-level dashboard.
- `ga_data_api_auth` and `ga_data_api_query` must pass before treating the run as a real dashboard read.

Core events to watch every day:

- Startup: `session_start`, `game_start`
- Gameplay: `level_start`, `level_end`, `level_complete`, `level_fail`, `level_quit`
- Friction: `level_blocked_move`, `level_undo`, `level_restart`
- Ads: `rewarded_request`, `rewarded_complete`, `rewarded_fail`
- Feedback/share: `feedback_open`, `share_result_request`, `share_result_complete`, `share_result_fail`

Closed-test caveats:

- Low active users means DAU, retention, pass rate, and ad completion rate are directional only.
- A zero-event day may mean no tester activity, delayed GA processing, or a broken chain; confirm in DebugView before changing gameplay.
- Revenue/LTV optimization is blocked until `ad_impression` or impression-level revenue data is wired from AdMob.
- Android/iOS Firebase app slots are registered, but current gameplay analytics uses the shared Web gtag runtime unless a native host bridge overrides tracking.

## Optimization Triage

Only act on product changes when the chain is healthy and the sample is large enough.

Start with these daily questions:

- If `game_start` exists but `level_start` is missing, inspect the start button and level launch path.
- If `level_start` exists but `level_end` is missing, inspect win/loss/quit/restart tracking.
- If `rewarded_request` exists but `rewarded_complete / rewarded_request` is low, inspect ad availability and reward grant behavior.
- If `level_blocked_move / level_start` is high, inspect early-level readability before changing difficulty.
- If `feedback_open / game_start` is high, inspect recent tester feedback before changing monetization or levels.

## References

- Google Analytics Data API `runReport`: https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport
- Google Analytics Data API dimensions and metrics: https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema
- Existing GA4 setup: `docs/google-analytics-setup.md`
- Event dictionary: `docs/analytics-event-spec.md`
