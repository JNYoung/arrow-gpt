# Google Play production release — 2026-08-02

## Release status

- Package: `com.arrowagain.game`
- Track: `production`
- Release: `1.0.6 (8)`
- Status: `completed`
- Android Publisher edit: `06478366726142408459`
- Local AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- Local / Google Play SHA-256: `a089dae5b9e2e036c929a56e96200408ec2df912ec18e1c51ff383d13206a826`
- Release notes: `新增每天本地时间 20:00 的游戏提醒，并完善提醒授权、调度与打开埋点。`

The Android Publisher API upload, track update, validation, commit, track readback, bundle readback, and SHA-256 comparison all succeeded.

## Included changes

- Schedules an Android local notification for 20:00:00 in the device's local time zone.
- Requests Android notification permission through the system dialog when required.
- Restores the pending reminder after reboot through the Capacitor Local Notifications receiver.
- Reschedules when the saved language, copy, time zone, or schedule shape changes.
- Adds `daily_reminder_permission`, `daily_reminder_scheduled`, `daily_reminder_open`, and `daily_reminder_error` events.

Android may defer delivery under battery-saving restrictions when the user has not granted exact-alarm special access. The app intentionally does not request exact-alarm permission for this casual retention reminder.

## Analytics configuration

- Firebase project: `arrow-again-game`
- Firebase Android app: `1:365113945933:android:b6b3395480c22a87d11104`
- Android package: `com.arrowagain.game`
- GA4 property: `542507123`
- GA4 web measurement ID: `G-NYTJ43WDD5`
- Runtime: shared Capacitor WebView `gtag` path

The existing Firebase Android app was reused; no duplicate Firebase app or GA4 property was created.

## Validation

- `npm run typecheck`
- `npm run verify:analytics`
- `E2E_PORT=4281 npm run e2e`
- `npm run verify:android:release`
- Signed AAB build with `npm run google:aab`
- `jarsigner -verify` succeeded
- Packaged Web asset contains the reminder copy and all four reminder events
- Release manifest contains version `1.0.6 (8)`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, and the local-notification restore receiver
- Android 16 physical-device smoke test confirmed the permission flow and a pending local alarm targeting `2026-08-02 20:00:00 Asia/Shanghai`
