# Arrow Again 发布资料包

日期：2026-07-22

## 可直接填写到后台的基础资料

| 字段 | 建议值 |
| --- | --- |
| Google Play app name | Arrow Again: Tap Away Puzzle |
| In-app brand name | Arrow Again |
| 中文名 | 箭了又箭 |
| Bundle / package ID | `com.arrowagain.game` |
| Version | `1.0.4` |
| Version code / build | `6` |
| Category | Games / Puzzle / Casual |
| Orientation | Portrait |
| Short description | Clear 100 arrow mazes at your pace—plan every tap and protect your hearts. |
| Long description | Arrow Again: Tap Away Puzzle turns every board into a quick route-planning challenge. Find an arrow with a clear path, tap it away, and open the route for the next move. Clear the entire arrow maze in the right order while protecting your hearts. |
| Support email | `j.n.young0209@gmail.com` |
| App home URL | `https://arrow-again.top/app-home.html` |
| Privacy policy URL | `https://arrow-again.top/privacy.html` |
| Data deletion URL | `https://arrow-again.top/data-deletion.html` |
| app-ads.txt URL | `https://arrow-again.top/app-ads.txt` |

## 已准备的网页和素材

| 用途 | 仓库路径 | 上线后 URL |
| --- | --- | --- |
| AdMob / 平台主页 | `public/app-home.html` | `https://arrow-again.top/app-home.html` |
| 隐私政策 | `public/privacy.html` | `https://arrow-again.top/privacy.html` |
| 数据删除说明 | `public/data-deletion.html` | `https://arrow-again.top/data-deletion.html` |
| 支持页 | `public/support.html` | `https://arrow-again.top/support.html` |
| app-ads.txt | `public/app-ads.txt` | `https://arrow-again.top/app-ads.txt` |
| App icon SVG | `public/icon.svg` | `https://arrow-again.top/icon.svg` |
| App icon 512 | `public/icon-512.png` | `https://arrow-again.top/icon-512.png` |
| Share image | `public/social-share.png` | `https://arrow-again.top/social-share.png` |

## AdMob 数据

| 字段 | 当前值 | 上线前动作 |
| --- | --- | --- |
| Android AdMob app ID | `ca-app-pub-2481288993515154~1565848203` | 已同步 `android/app/src/main/res/values/strings.xml` 与 `platform-manifest.json` |
| iOS AdMob app ID | `ca-app-pub-2481288993515154~1506138451` | 已同步 `ios/App/App/Info.plist` 与 `platform-manifest.json` |
| Android hint rewarded unit | `ca-app-pub-2481288993515154/7636736455` | 已回填 |
| Android revive rewarded unit | `ca-app-pub-2481288993515154/9949250626` | 已回填 |
| Android double reward unit | `ca-app-pub-2481288993515154/4633344766` | 已回填 |
| iOS hint rewarded unit | `ca-app-pub-2481288993515154/5936338057` | 已回填 |
| iOS revive rewarded unit | `ca-app-pub-2481288993515154/2769598752` | 已回填 |
| iOS double reward unit | `ca-app-pub-2481288993515154/4326223000` | 已回填 |
| app-ads.txt | `google.com, pub-2481288993515154, DIRECT, f08c47fec0942fa0` | 已替换 publisher ID，合并部署后应在 `https://arrow-again.top/app-ads.txt` 验证 |

同步命令：

```bash
npm run admob:sync
```

本地 SDK 冒烟测试可临时写入 Google sample app id：

```bash
npm run admob:sync:test
```

Android 首发提审前运行：

```bash
npm run verify:android:release
```

全平台提审前运行：

```bash
npm run verify:platform:release
```

全平台巡检仍会阻止 Meta placeholder；Android 专用巡检不会被 Meta 待办阻断。

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
| Privacy policy | `https://arrow-again.top/privacy.html` |
| Data deletion instructions | `https://arrow-again.top/data-deletion.html` |

## App Store / Google Play 商店文案

短描述：

```text
Clear 100 arrow mazes at your pace—plan every tap and protect your hearts.
```

长描述：

```text
Arrow Again: Tap Away Puzzle turns every board into a quick route-planning challenge.

Find an arrow with a clear path, tap it away, and open the route for the next move. Clear the entire arrow maze in the right order while protecting your hearts. There is no timer, so you can study each board and solve at your own pace.

HOW TO PLAY
- Find an arrow whose route is open
- Tap to send it off the board
- Avoid blocked moves that cost a heart
- Clear every arrow to complete the level

WHY PLAY
- 100 portrait levels for short breaks
- Simple one-tap controls with clear path feedback
- Gradual challenge with denser routes and boss boards
- Hints, undo, restart, and revive options
- Three-star results and local progress
- Clean, readable boards designed for phone screens

Whether you enjoy arrow puzzles, tap away games, maze puzzles, unblock challenges, or calm logic games, Arrow Again offers focused board-clearing puzzles without countdown pressure.
```

关键词：

```text
arrow puzzle, tap puzzle, tap away, puzzle escape, maze puzzle, logic puzzle, brain puzzle, unblock puzzle
```

## 仍需用户本人提供

- Google Play 生产访问申请中的真实测试者与反馈细节。
- Google Play / AdMob 后台中的 app-ads.txt 验证、隐私/同意消息与 Data safety 配置。
- 隐私政策最终法律文本确认。
- 已有商店截图的最终主视觉确认。
- Meta App ID 与 rewarded placement IDs（Android 首发后）。
- Apple Developer Team（iOS 后续）。

## 官方参考

- AdMob app-ads.txt: https://support.google.com/admob/answer/9363762
- Google Mobile Ads Android quick start: https://developers.google.com/admob/android/quick-start
- Google Mobile Ads iOS quick start: https://developers.google.com/admob/ios/quick-start
- Meta Instant Games: https://developers.facebook.com/docs/games/instant-games/
- Facebook Login: https://developers.facebook.com/docs/facebook-login/
