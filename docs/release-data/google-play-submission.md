# Arrow Again Google Play submission kit

Date: 2026-06-10

## Current status

Local Google Play preparation is ready for a closed-test submission with the current signed AAB.

- Package name: `com.arrowagain.game`
- App name: `Arrow Again`
- Version name: `1.0.0`
- Version code: `1`
- Current local release AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- Current local AAB SHA-256: `025ada338d618700bd17ea9e8e3cf37a7a868fc58dd009e072756f16c0c6d861`
- Current local AAB signing status: signed with the local Android upload key.
- App icon: `releases/google-play/assets/icon-512.png`
- Feature graphic: `releases/google-play/assets/feature-graphic-1024x500.png`
- Phone screenshots:
  - `releases/google-play/screenshots/phone-01-home.png`
  - `releases/google-play/screenshots/phone-02-level-1.png`
  - `releases/google-play/screenshots/phone-03-level-36.png`

## Store listing

App name:

```text
Arrow Again
```

Short description:

```text
Tap free arrows, clear every route, and solve satisfying maze puzzles.
```

Full description:

```text
Arrow Again is a tactile arrow-maze puzzle for quick mobile sessions.

Tap arrows that have a clear route out of the board, watch the maze open up, and solve increasingly dense layouts. Each level is short, readable, and satisfying, but later boards ask you to plan the order carefully.

Features:
- 100 levels with a smooth difficulty curve
- Clean arrow-maze visuals designed for portrait play
- Optional rewarded hints and revive flow
- Local progress, lives, stars, and undo support
- Lightweight rendering mode for dense boards and lower-end devices
```

Category:

```text
Game > Puzzle
```

Suggested tags:

```text
Puzzle, Logic, Casual
```

Support email:

```text
j.n.young0209@gmail.com
```

Website:

```text
https://arrow-again.top/app-home.html
```

Privacy policy:

```text
https://arrow-again.top/privacy.html
```

Data deletion:

```text
https://arrow-again.top/data-deletion.html
```

## App content checklist

App access:

```text
All functionality is available without signing in or special credentials.
```

Ads:

```text
Yes, the app contains ads.
```

Ad format notes:

```text
The game uses optional rewarded ads for hint, revive, and double-reward flows.
```

Content rating starting answers:

```text
No graphic violence, no sexual content, no gambling, no user-generated content, no user-to-user communication, no location sharing, no in-app purchases.
```

Target audience recommendation:

```text
13+ unless the final release intentionally targets children.
```

News app:

```text
No.
```

Government app:

```text
No.
```

Financial features:

```text
No.
```

Health features:

```text
No.
```

Permissions:

```text
INTERNET only.
```

## Data safety draft

These answers must be reviewed against the final AdMob configuration and Google Play Console wording before submission.

Data collected or shared by SDKs:

```text
Device or other IDs: advertising ID / device identifiers, used for advertising, fraud prevention, analytics, and diagnostics.
App activity: app interactions and ad interactions, used for advertising, analytics, fraud prevention, and app functionality.
App info and performance: crash logs, diagnostics, and performance data, used for analytics, diagnostics, and app improvement.
Approximate location: may be processed by advertising partners for advertising, fraud prevention, and compliance.
```

Data handled locally by the app:

```text
Game progress, settings, lives, stars, level state, and similar gameplay data are stored locally on the device or browser storage.
```

Account creation:

```text
No account required.
```

Data deletion:

```text
Users can delete local gameplay data by clearing app storage or uninstalling. Platform-linked or support-request data deletion can be requested at https://arrow-again.top/data-deletion.html.
```

Encryption in transit:

```text
Yes for network communication with Google Play, Google AdMob, hosted support/privacy pages, and other HTTPS services.
```

Data sharing disclosure:

```text
Disclose Google AdMob as an advertising partner. Optional support email is user-initiated.
```

## Closed testing

Recommended tester group:

```text
Arrow Again Alpha Testers
```

Recommended Google Group slug:

```text
arrow-again-testers
```

Group email:

```text
arrow-again-testers@googlegroups.com
```

Tester links:

```text
Group: https://groups.google.com/g/arrow-again-testers
Web opt-in: https://play.google.com/apps/testing/com.arrowagain.game
Store listing: https://play.google.com/store/apps/details?id=com.arrowagain.game
Leave testing: https://play.google.com/apps/testing/com.arrowagain.game/leave
```

Do not send the leave-testing link as the join link.

Release notes:

```text
Initial closed test for Arrow Again.

- 100 arrow-maze puzzle levels
- Optional rewarded hint and revive flows
- Local progress, stars, lives, undo, and restart support
- Feedback entry for closed-test reports
```

Tester invitation:

```text
✅ 邀请加入 Arrow Again 封闭测试！

Arrow Again 是一款适合碎片时间游玩的箭头迷宫解谜游戏：点击路径无遮挡的箭头，让它飞出棋盘，逐步清空所有路线。

1️⃣ 第一步（加入群组）：https://groups.google.com/g/arrow-again-testers

2️⃣ 第二步（下载应用）：
网页测试：https://play.google.com/apps/testing/com.arrowagain.game

Google Play 下载：https://play.google.com/store/apps/details?id=com.arrowagain.game

感谢支持！如果你也有应用需要回测，请随时告诉我。

备注：如果暂时无法下载，说明 Google Play 封闭测试版本还在审核中；请先加入群组，审核通过后再打开链接安装。
```

New personal developer accounts should plan for at least 12 opted-in testers for 14 continuous days before requesting production access.

## Play Console submission steps

1. Create or open the Play Console app record for `Arrow Again`.
2. Fill Store settings and Main store listing with the copy and assets above.
3. Complete App content: privacy policy, ads, app access, content rating, target audience, Data safety, and any policy declarations Play Console requests.
4. Create the Google Group `arrow-again-testers` and set joining/search visibility according to the desired recruitment model.
5. In Closed testing, create or open the Alpha track.
6. Add `arrow-again-testers@googlegroups.com` as the tester group.
7. Create a release and upload `android/app/build/outputs/bundle/release/app-release.aab`.
8. Use the release notes above.
9. Review warnings. Missing native debug symbols can be accepted for the first closed test unless crash-symbol upload is required now.
10. Submit all pending changes from Publishing overview.

## Remaining external checks

- Create or reuse the GA4 web stream, set `VITE_GA_MEASUREMENT_ID`, and validate DebugView with `npm run verify:analytics`.
- Confirm `https://arrow-again.top/app-ads.txt` is live and verified in AdMob.
- Confirm the hosted privacy/support/data-deletion pages are publicly reachable after the latest deployment.
- Final-review the privacy policy and Data safety answers.
- Complete any CAPTCHA, payment profile, identity, or developer account checks directly in Google.
- After Play review approves the closed test, ask testers to join the group, opt in, install from Google Play, and open the app once per day during the 14-day window.

Current DNS check:

```text
arrow-again.top uses Aliyun nameservers but currently has no authoritative A
record for the apex domain and no www CNAME from this machine as of 2026-06-21.
```

For the Vercel production launch, add these DNS records in Aliyun DNS:

```text
Type   Host  Value
A      @     76.76.21.21
CNAME  www   cname.vercel-dns-0.com
```

Then verify:

```text
dig +short A arrow-again.top
dig +short CNAME www.arrow-again.top
curl -I https://arrow-again.top/app-ads.txt
curl -I https://arrow-again.top/privacy.html
```

## Official references

- Closed testing for new personal accounts: https://support.google.com/googleplay/android-developer/answer/14151465
- Data safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Main store listing: https://support.google.com/googleplay/android-developer/answer/9859152
- Graphic assets, screenshots, and video: https://support.google.com/googleplay/android-developer/answer/9866151
- App content declarations: https://support.google.com/googleplay/android-developer/answer/9859455
- Vercel domains: https://vercel.com/docs/domains
