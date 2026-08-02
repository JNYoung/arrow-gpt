# Arrow Again Analytics Event Spec

Date: 2026-06-21

## Common parameters

Every event emitted through `ArrowAgainApp.track` includes:

| Parameter | Type | Meaning |
| --- | --- | --- |
| `app_version` | string | App version from `platform-manifest.json` |
| `install_id` | string | Anonymous local install identifier |
| `session_id` | string | Anonymous session identifier generated at startup |
| `session_index` | number | Local session count for this install |
| `days_since_install` | number | Whole days since first local analytics identity |
| `language` | string | `zh` or `en` |
| `render_quality` | string | `high`, `balanced`, or `low` |
| `platform` | string | `web`, `meta-instant`, `google-play`, or `ios-app-store` |
| `screen` | string | Current app screen |
| `level` | number | Current level id |
| `level_id` | number | Current level id, GA-friendly duplicate |
| `level_name` | string | Current level name |
| `difficulty` | string | `tutorial`, `easy`, `medium`, `hard`, or `boss` |
| `attempt_id` | string | Present after a playable level attempt starts |
| `traffic_source` | string | Stored 30-day attribution source from UTM/source/referrer |
| `traffic_medium` | string | Stored 30-day attribution medium from UTM/medium |
| `traffic_campaign` | string | Stored 30-day campaign name |
| `traffic_content` | string | Stored 30-day content/variant label |
| `traffic_term` | string | Stored 30-day keyword/term when available |
| `campaign_id` | string | Stored 30-day campaign or experiment id |
| `creative_id` | string | Stored 30-day creative, screenshot, video, or landing variant id |
| `referrer_host` | string | External referrer hostname when UTM source is absent |

Do not send personal information, support email bodies, names, or arbitrary user text to GA4.

## Core session events

| Event | Trigger | Required extra parameters | GA4 status |
| --- | --- | --- | --- |
| `session_start` | Platform is ready and local session has been recorded | `total_sessions`, `streak_days`, `unlocked_level`, `completed_levels`, `total_stars` | Custom |
| `game_start` | App startup after platform ready | `total_sessions`, `streak_days`, `unlocked_level`, `total_stars` | Custom |

## Level and tutorial events

| Event | Trigger | Required extra parameters | GA4 status |
| --- | --- | --- | --- |
| `level_start` | A real playable level attempt starts | `source`, `target_moves`, `pieces`, `lives` | Recommended |
| `tutorial_begin` | Tutorial level attempt starts | `source` | Recommended |
| `tutorial_step` | Tutorial first valid move is made | `step`, `moves`, `lives` | Custom |
| `level_blocked_move` | Player taps a blocked arrow | `moves`, `lives`, `remaining_pieces`, `available_count`, `piece_dir` | Custom |
| `level_undo` | Player undoes a move | `moves`, `lives`, `remaining_pieces` | Custom |
| `level_restart` | Player restarts or retries an attempt | `source`, `moves`, `lives`, `target_moves`, `remaining_pieces`, `hints_used`, `revives_used`, `elapsed_ms` | Custom |
| `level_quit` | Player leaves an unfinished active attempt | `source`, `moves`, `lives`, `target_moves`, `remaining_pieces`, `hints_used`, `revives_used`, `elapsed_ms` | Custom |
| `level_complete` | Attempt ends in a win | `stars`, `moves`, `lives`, `target_moves`, `remaining_pieces`, `hints_used`, `revives_used`, `elapsed_ms`, `unlocked_level`, `completed_levels`, `total_stars` | Custom |
| `level_fail` | Attempt ends in a loss | Same as `level_complete` | Custom |
| `level_end` | Any attempt ends | `success`, `stars`, `moves`, `lives`, `target_moves`, `remaining_pieces`, `hints_used`, `revives_used`, `elapsed_ms` | Recommended |
| `tutorial_complete` | Tutorial level is won | `moves`, `elapsed_ms` | Recommended |

## Rewarded ad events

| Event | Trigger | Required extra parameters | GA4 status |
| --- | --- | --- | --- |
| `rewarded_request` | Player asks for hint or revive ad | `placement`, `moves`, `lives` | Custom |
| `rewarded_complete` | Rewarded ad completes and grants reward | `placement`, `moves`, `lives` | Custom |
| `rewarded_fail` | Rewarded ad is unavailable, closed, or interrupted | `placement`, `reason` | Custom |

Future revenue event:

| Event | Trigger | Required extra parameters | GA4 status |
| --- | --- | --- | --- |
| `ad_impression` | Ad SDK returns impression-level revenue | `placement`, `ad_unit`, `revenue_micros`, `currency`, `precision`, `network` | Recommended/common |

`ad_impression` is not complete until the AdMob paid event / impression-level revenue callback is wired. The current Capacitor plugin path grants rewards but does not expose revenue to the web runtime.

## Sharing, feedback, and settings

| Event | Trigger | Required extra parameters | GA4 status |
| --- | --- | --- | --- |
| `share_result_request` | Player taps share on result screen | `won`, `stars`, `moves` | Custom |
| `share_result_complete` | Platform share completes | `won`, `stars`, `moves` | Custom |
| `share_result_fail` | Platform share fails | `won`, `stars`, `moves` | Custom |
| `feedback_open` | Player opens feedback mail flow | `feedback_count`, `result_won`, `moves`, `lives`, `total_sessions` | Custom |
| `screen_home_open` | Player navigates home | `from_screen` | Custom |
| `screen_levels_open` | Debug level picker opens | `from_screen` | Custom |
| `screen_levels_blocked` | Non-debug level picker request is blocked | `from_screen` | Custom |
| `settings_panel_toggle` | Settings panel opens/closes | `open` | Custom |
| `settings_language_change` | Language changes | `language` | Custom |
| `settings_music_toggle` | Music setting changes | `enabled` | Custom |
| `settings_effects_toggle` | Effects setting changes | `enabled` | Custom |
| `hard_level_prompt` | Hard/boss warning is shown | `source`, `target_level`, `target_difficulty` | Custom |

## Daily reminder events

These events are emitted only by the Android native app. Notification copy and scheduling use the device's current language and local time zone.

| Event | Trigger | Required extra parameters | GA4 status |
| --- | --- | --- | --- |
| `daily_reminder_permission` | Android notification permission is checked or requested | `permission`, `source` | Custom |
| `daily_reminder_scheduled` | The 20:00 local reminder is created, updated, or already pending | `notification_id`, `schedule_hour`, `schedule_minute`, `schedule_second`, `time_basis`, `time_zone`, `status` | Custom |
| `daily_reminder_open` | The player opens the app from the reminder | `action_id`, `notification_id`, `schedule_hour`, `time_basis` | Custom |
| `daily_reminder_error` | Permission or scheduling setup fails | `stage`, `error_name` | Custom |

## GA4 implementation notes

- Event names are sanitized to GA4-compatible names before sending.
- String parameter values are capped to 100 characters before sending.
- The gtag config uses `send_page_view: false`; gameplay navigation is event-based, not pageview-based.
- `VITE_GA_DEBUG=true` or runtime `gaDebug: true` enables DebugView validation.
- UTM / `creative_id` attribution is stored locally for 30 days and attached to all gameplay events. Register `creative_id`, `traffic_source`, `traffic_campaign`, and `traffic_content` as event-scoped custom dimensions in GA4 before expecting them in Data API breakdowns.
