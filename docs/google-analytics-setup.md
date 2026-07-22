# Arrow Again Google Analytics 4 Setup

Date: 2026-06-21

## Runtime choice

Arrow Again uses the shared web runtime across Web, Android Capacitor, iOS Capacitor, and Meta Instant Games. GA4 is therefore wired through the Web gtag runtime by default.

Native Android/iOS analytics can still override this later through `window.NativeGameHost.track`. If no native host is present, Android/iOS WebView events fall back to the GA4 web stream.

## Required GA4 stream

Arrow Again is linked to a GA4 **Web data stream** for the shared app/runtime.

Current IDs:

```text
GA4 property id: 542507123
Measurement ID:  G-NYTJ43WDD5
```

Set it for local builds:

```bash
export VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
export VITE_GA_DEBUG=true
npm run dev
```

Release builds write the linked Measurement ID into `dist/platform-runtime-config.js` automatically:

```bash
npm run build
```

Override it only when testing another stream:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX npm run build
```

The generated runtime config is `dist/platform-runtime-config.js`. The checked-in `public/platform-runtime-config.js` intentionally stays ID-free; release builds receive the confirmed Measurement ID from `platform-manifest.json` or an environment override.

## Firebase project

Firebase CLI is installed at the user-level path:

```bash
firebase --version
```

Current project/app slot:

```text
Firebase project: arrow-again-game
Project number:   365113945933
Web app:          Arrow Again Web
Web app id:       1:365113945933:web:ac305eeac306487bd11104
Android app:      Arrow Again Android
Android app id:   1:365113945933:android:b6b3395480c22a87d11104
Android package:  com.arrowagain.game
iOS app:          Arrow Again iOS
iOS app id:       1:365113945933:ios:3eb5bed3f8dbed1dd11104
iOS bundle:       com.arrowagain.game
GA4 property id:  542507123
Measurement ID:   G-NYTJ43WDD5
```

The repo default Firebase alias is recorded in `.firebaserc`.

Verify CLI and apps:

```bash
npm run firebase:version
npm run firebase:apps
npm run firebase:config:web
npm run firebase:config:android
npm run firebase:config:ios
```

Android/iOS Firebase app slots are registered for project hygiene and future native SDK use. Current gameplay analytics still uses the shared Web gtag runtime, so native Android/iOS Firebase Analytics events should not be treated as live until a native Firebase Analytics SDK bridge is intentionally added.

Check whether the Firebase project is linked to Google Analytics:

```bash
npm run firebase:analytics:status
```

The project is linked through Analytics account `243846062`. Re-linking or creating a replacement property can be done with:

```bash
npm run firebase:analytics:link -- --analytics-account-id=123456789
# or
npm run firebase:analytics:link -- --analytics-property-id=987654321
```

`--analytics-account-id` provisions a new GA4 property under that GA account and links the Firebase project. `--analytics-property-id` links an existing GA4 property. When linking succeeds, the script writes the discovered `G-...` Measurement ID back to `platform-manifest.json`.

## Debug validation

Run with debug mode:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX VITE_GA_DEBUG=true npm run dev
```

Then open the game and check GA4 DebugView for these events:

- `session_start`
- `game_start`
- `level_start`
- `tutorial_begin`
- `tutorial_step`
- `level_end`
- `level_complete`
- `level_fail`
- `level_quit`
- `level_restart`
- `rewarded_request`
- `rewarded_complete`
- `rewarded_fail`
- `share_result_request`
- `share_result_complete`
- `share_result_fail`
- `feedback_open`

Google's DebugView requires debug mode to be enabled for the device/session.

## Verification

Use this gate:

```bash
npm run verify:analytics
```

The Measurement ID is stored in `platform-manifest.json`; `VITE_GA_MEASUREMENT_ID` or `GA_MEASUREMENT_ID` can still override it for local testing.

## Release notes

- Google Analytics receives only gameplay, session, platform, and app interaction events.
- The generated `install_id`, `session_id`, and `attempt_id` are anonymous local identifiers and must not contain personal information.
- Feedback email is user-initiated; do not pass email addresses, names, or free-text feedback bodies into GA4.
- Data safety and App Privacy answers must continue to disclose analytics, ad interactions, diagnostics, device/advertising identifiers, and app activity according to the final SDK/account setup.

## Official references

- GA4 config and `send_page_view`: https://developers.google.com/analytics/devguides/collection/ga4/reference/config
- GA4 recommended events: https://support.google.com/analytics/answer/9267735
- GA/Firebase DebugView: https://firebase.google.com/docs/analytics/debugview
- Firebase Management API `addGoogleAnalytics`: https://firebase.google.com/docs/reference/firebase-management/rest/v1beta1/projects/addGoogleAnalytics
- Firebase project setup API workflow: https://firebase.google.com/docs/projects/api/workflow_set-up-and-manage-project
- Connect Firebase to Google Analytics: https://support.google.com/analytics/answer/9289234
