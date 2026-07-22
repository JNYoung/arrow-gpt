# Arrow Again ASO / 留存 / 反馈推进单

日期：2026-07-22

## 今日已落地

- 首页移除了“设计中 / 验证版”文案，改为可提交审核的首屏状态。
- 首页新增连续游玩天数、已通关数、总星数和今日目标，形成轻量回访动机。
- 首页和结果页新增“反馈与支持”入口，邮件自动带上平台、屏幕、关卡、步数、生命、存档和 user agent。
- 游戏运行时新增最小埋点闭环：`game_start`、`level_start`、`level_complete`、`level_fail`、`level_blocked_move`、`level_undo`、`rewarded_request`、`rewarded_complete`、`rewarded_fail`、`share_result_*`、`feedback_open`。
- E2E 增加首页留存模块、反馈入口和“无未完成功能文案”的检查。

## 官方调研结论

| 方向 | 结论 | 对 Arrow Again 的动作 |
| --- | --- | --- |
| Google Play target API | 2026-08-31 起，手机/平板新应用和更新需要 target Android 16 / API 36 或更高。 | `android/variables.gradle` 已升至 `targetSdkVersion = 36`；`1.0.4 (6)` 已于 2026-07-22 发布到 production。 |
| Google 新个人开发者账号 | 2023-11-13 后创建的个人账号，生产发布前需要至少 12 名测试者连续 14 天 closed test。 | 开发者账号准备期先发 closed test，用新增反馈入口收集问题。 |
| Google Data safety | 需要准确披露收集、共享和安全实践；隐私政策与 Data safety 不能互相矛盾。 | 隐私政策已声明本地进度、广告、分享、埋点；上线前需按真实 AdMob/Meta 数据流复核。 |
| Google Store Listing | App name 限制 30 字符，短描述限制 80 字符，完整描述限制 4000 字符。 | 当前 ASO 版标题 `Arrow Again: Tap Away Puzzle` 为 28 字符，短描述为 74 字符；2026-07-14 已通过 Android Publisher API 提交并回读。 |
| Apple App 信息 | App name 和 subtitle 都限制 30 字符；Privacy Policy URL 对 iOS 必填。 | `Arrow Again`、`Tap Free Arrows` 都在限制内；隐私政策 URL 已入 manifest。 |
| Apple 审核完整性 | 提审版本需要完整元数据、可用 URL，不能留下 placeholder、空网页或临时内容。 | 首屏已去掉“设计中”；`verify:platform:release` 继续阻断 placeholder ID。 |
| Apple App Privacy | 需要在 App Store Connect 提供隐私实践，包括第三方伙伴代码的数据处理。 | 需要把 AdMob/Meta 广告与 analytics 的数据项映射到 App Privacy。 |
| Meta Instant Games | 继续使用 `fbapp-config.json`、`FBInstant.shareAsync`、`FBInstant.logEvent` 和 rewarded placements；上线前需要真实 App ID、placement ID、隐私和删除入口。 | 代码桥已具备；账号侧 ID 未就绪前保持 mock/Web 验证。 |

## ASO 当前文案

完整 ASO 包：`docs/release-data/google-play-aso-2026-07-14.md`

### Google Play

App name:

```text
Arrow Again: Tap Away Puzzle
```

Short description:

```text
Clear 100 arrow mazes at your pace—plan every tap and protect your hearts.
```

Full description:

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

### App Store

Name:

```text
Arrow Again: Tap Puzzle
```

Subtitle:

```text
Arrow Maze Logic Puzzle
```

Promotional text:

```text
Plan each tap, protect your hearts, and chase three-star clears across quick arrow maze levels.
```

Keywords:

```text
away,escape,brain,unblock,casual,route,grid,blocks,relax,spatial,clear,level,order
```

### Meta Instant Games

Name:

```text
Arrow Again
```

Tagline:

```text
Clear every arrow route.
```

Share text pattern:

```text
I cleared level {level} in Arrow Again with {stars} stars.
```

## 截图脚本建议

| 截图 | 画面 | 目的 |
| --- | --- | --- |
| 1 | `docs/assets/aso/en-us/phone-01-home.png` | 展示品牌和一屏玩法承诺。 |
| 2 | `docs/assets/aso/en-us/phone-02-tutorial.png` | 解释点击可通行箭头的核心玩法。 |
| 3 | `docs/assets/aso/en-us/phone-03-level-36.png` | 展示中后期路线规划深度。 |
| 4 | `docs/assets/aso/en-us/phone-04-result.png` | 展示三星通关和下一关循环。 |

下一轮素材补充：

1. 重截 zh-CN 本地化四张截图。
2. 增加失败/遮挡状态图，标题方向为 `Think before you tap`。
3. 若做广告投放，再做带短标题叠字版本，商店默认图继续保持低文字密度。

## Closed Test 反馈闭环

1. 每位测试者每天至少打开一次，连续 14 天，优先覆盖 Android 真机。
2. 测试者完成第 1-10 关，并在任意一次失败后点“反馈问题”。
3. 每天收集这些字段：卡住关卡、是否理解可点击箭头、广告是否完成、复活是否保留棋盘、低端机是否卡顿。
4. 用事件核对：`game_start` 数量、`level_fail` 分布、`rewarded_fail` 原因、`feedback_open` 是否能对应邮件。
5. 14 天内只改低风险问题；涉及广告 ID、包名、隐私声明的改动单独复核。

## 账号侧仍阻塞

- Google Play / AdMob 真实 Android app ID、iOS app ID、rewarded ad unit IDs。
- Meta App ID、Instant Games 配置和 rewarded placement IDs。
- Apple Developer Team、签名、App Store Connect app record。
- Android release signing keystore。
- 公开域名根目录部署 `app-ads.txt`。

## 参考来源

- Google Play target API level requirements: https://developer.android.com/google/play/requirements/target-sdk
- Google Play closed testing for new personal accounts: https://support.google.com/googleplay/android-developer/answer/14151465
- Google Play Data safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play store listing setup: https://support.google.com/googleplay/android-developer/answer/9859152
- Apple App information reference: https://developer.apple.com/help/app-store-connect/reference/app-information
- Apple App privacy reference: https://developer.apple.com/help/app-store-connect/reference/app-information/app-privacy
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Meta Instant Games docs: https://developers.facebook.com/docs/games/instant-games/
