# Arrow Again 发布资料包

日期：2026-05-31

## 可直接填写到后台的基础资料

| 字段 | 建议值 |
| --- | --- |
| App name | Arrow Again |
| 中文名 | 箭了又箭 |
| Bundle / package ID | `com.arrowagain.game` |
| Version | `1.0.0` |
| Version code / build | `1` |
| Category | Games / Puzzle / Casual |
| Orientation | Portrait |
| Short description | Tap the free arrows, clear every route, and solve satisfying maze puzzles. |
| Long description | Arrow Again is a tactile arrow-maze puzzle built for quick mobile sessions. Choose the arrows with a clear path, watch them fly out, and clear denser boards as new route patterns appear. |
| Support email | `TODO_SUPPORT_EMAIL` |
| App home URL | `TODO_APP_HOME_URL` |
| Privacy policy URL | `TODO_PRIVACY_POLICY_URL` |
| Data deletion URL | `TODO_DATA_DELETION_URL` |

## 已准备的网页和素材

| 用途 | 仓库路径 | 上线后 URL |
| --- | --- | --- |
| AdMob / 平台主页 | `public/app-home.html` | `https://YOUR_DOMAIN/app-home.html` |
| 隐私政策草稿 | `public/privacy.html` | `https://YOUR_DOMAIN/privacy.html` |
| 数据删除说明 | `public/data-deletion.html` | `https://YOUR_DOMAIN/data-deletion.html` |
| 支持页 | `public/support.html` | `https://YOUR_DOMAIN/support.html` |
| app-ads.txt 模板 | `public/app-ads.txt` | `https://YOUR_DOMAIN/app-ads.txt` |
| App icon SVG | `public/icon.svg` | `https://YOUR_DOMAIN/icon.svg` |
| App icon 512 | `public/icon-512.png` | `https://YOUR_DOMAIN/icon-512.png` |
| Share image | `public/social-share.png` | `https://YOUR_DOMAIN/social-share.png` |

## AdMob 数据

| 字段 | 当前值 | 上线前动作 |
| --- | --- | --- |
| Android AdMob app ID | `ca-app-pub-0000000000000000~0000000000` | 替换为 AdMob 后台真实 Android app ID，并同步 `android/app/src/main/res/values/strings.xml` 与 `platform-manifest.json` |
| iOS AdMob app ID | `ca-app-pub-0000000000000000~0000000000` | 替换为真实 iOS app ID，并同步 `ios/App/App/Info.plist` 与 `platform-manifest.json` |
| hint rewarded unit | `TODO_ADMOB_HINT_UNIT` | 替换为真实 rewarded ad unit ID |
| revive rewarded unit | `TODO_ADMOB_REVIVE_UNIT` | 替换为真实 rewarded ad unit ID |
| double reward unit | `TODO_ADMOB_DOUBLE_REWARD_UNIT` | 可暂不在 UI 开放，但后台 ID 先占位 |
| app-ads.txt | `google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0` | 将 `pub-000...` 替换为你的 publisher ID，并部署在开发者网站根目录 |

## Meta / Facebook 数据

| 字段 | 当前值 | 上线前动作 |
| --- | --- | --- |
| Meta App ID | `TODO_META_APP_ID` | 替换为 Meta App Dashboard 的真实 App ID |
| Platform | Instant Games |
| Bundle config | `public/fbapp-config.json` |
| Platform version | `RICH_GAMEPLAY` |
| Orientation | `PORTRAIT` |
| Navigation menu | `NAV_FLOATING` |
| Login permissions | `public_profile` |
| Player data used | player display name, app-scoped player ID if exposed by platform |
| Share text | `我在 Arrow Again 第 X 关拿到 Y 星！` |
| Share image | `public/social-share.png` |
| Rewarded placements | `TODO_META_HINT_PLACEMENT`, `TODO_META_REVIVE_PLACEMENT`, `TODO_META_DOUBLE_REWARD_PLACEMENT` |
| Privacy policy | `TODO_PRIVACY_POLICY_URL` |
| Data deletion instructions | `TODO_DATA_DELETION_URL` |

## App Store / Google Play 商店文案

短描述：

```text
Tap free arrows, clear every route, and solve satisfying maze puzzles.
```

长描述：

```text
Arrow Again is a tactile arrow-maze puzzle for quick mobile sessions.

Tap arrows that have a clear route out of the board, watch the maze open up, and solve increasingly dense layouts. Each level is short, readable, and satisfying, but later boards ask you to plan the order carefully.

Features:
- 100 handcrafted/generated levels with a smooth difficulty curve
- Clean arrow-maze visuals designed for portrait play
- Optional rewarded hints and revive flow
- Local progress, lives, stars, and undo support
- Lightweight rendering mode for dense boards and lower-end devices
```

关键词：

```text
arrow puzzle, maze puzzle, unblock, casual puzzle, brain game, logic puzzle
```

## 仍需用户本人提供

- 真实支持邮箱。
- 可公开访问的域名，用于部署 `app-home.html`、`privacy.html`、`data-deletion.html`、`support.html`、`app-ads.txt`。
- Google Play / AdMob 后台中的 Android app ID、iOS app ID、rewarded ad unit IDs。
- Meta App ID 与 rewarded placement IDs。
- 隐私政策最终法律文本确认。
- Android release signing keystore 与 Apple Developer Team。

## 官方参考

- AdMob app-ads.txt: https://support.google.com/admob/answer/9363762
- Google Mobile Ads Android quick start: https://developers.google.com/admob/android/quick-start
- Google Mobile Ads iOS quick start: https://developers.google.com/admob/ios/quick-start
- Meta Instant Games: https://developers.facebook.com/docs/games/instant-games/
- Facebook Login: https://developers.facebook.com/docs/facebook-login/
