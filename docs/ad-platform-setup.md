# Arrow Again Ad Platform Setup

日期：2026-06-02

## 结论

代码侧已经接入两条广告链路：

- Android / iOS 客户端：`@capacitor-community/admob` + AdMob rewarded video。
- Meta / Facebook Instant Games：`FBInstant.getRewardedVideoAsync` + Meta rewarded placements。

AdMob Android / iOS app 和 rewarded ad unit 已在后台创建并回填到 `platform-manifest.json`；`public/app-ads.txt` 也已替换为真实 Google publisher ID。Meta app / rewarded placement 仍需要完成最终创建、业务验证和应用审核相关流程。不要在 debug 阶段点击真实广告；本仓库的 debug 演示使用 Google sample ad IDs 或 mock rewarded flow。

## AdMob 后台配置

申请入口：

- AdMob: https://admob.google.com/home/
- Google Play Console: https://play.google.com/console/

已在 AdMob 创建 2 个 app：

| 平台 | App name | Package / Bundle ID |
| --- | --- | --- |
| Android | Arrow Again | `com.arrowagain.game` |
| iOS | Arrow Again | `com.arrowagain.game` |

每个平台已创建 3 个 Rewarded ad unit：

| Placement | 建议后台名称 | 游戏内用途 |
| --- | --- | --- |
| `hint` | `arrow_again_hint_rewarded` / `arrow_again_ios_hint_rewarded` | 看广告获得提示 |
| `revive` | `arrow_again_revive_rewarded` / `arrow_again_ios_revive_rewarded` | 失败后看广告复活 |
| `double-reward` | `arrow_again_double_rewarded` / `arrow_again_ios_double_rewarded` | 预留双倍奖励 |

真实值已回填到 `platform-manifest.json`：

- `platforms.googlePlayAndroid.adMobAppId`
- `platforms.googlePlayAndroid.rewardedPlacements.hint`
- `platforms.googlePlayAndroid.rewardedPlacements.revive`
- `platforms.googlePlayAndroid.rewardedPlacements.double-reward`
- `platforms.iosAppStore.adMobAppId`
- `platforms.iosAppStore.rewardedPlacements.hint`
- `platforms.iosAppStore.rewardedPlacements.revive`
- `platforms.iosAppStore.rewardedPlacements.double-reward`

修改 AdMob app ID 后同步 native app ID：

```bash
npm run admob:sync
```

## Android Debug 广告演示

Android debug 包使用 Google 官方 sample app ID 和 sample rewarded ad unit，不污染 release 配置：

- Debug app ID override: `android/app/src/debug/res/values/strings.xml`
- Runtime config: `dist/platform-runtime-config.js`
- Google Mobile Ads SDK: `android/variables.gradle` 中的 `playServicesAdsVersion = '24.9.0'`
- Android rewarded sample ad unit: `ca-app-pub-3940256099942544/5224354917`

构建 debug 广告演示包：

```bash
npm run android:debug:ads
```

产物路径：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

真机 / 模拟器验证流程：

1. 安装 `app-debug.apk`。
2. 进入第 1 关，点击“提示”。
3. 看到 Google rewarded test ad。
4. 完成广告后，棋盘出现提示高亮。
5. 故意点错耗尽生命，在结果页点击“看广告复活”。
6. 完成广告后，回到当前棋盘并保留 1 条生命。

发布包不能使用 sample IDs。Android 首发提审前跑：

```bash
npm run verify:android:release
```

## Meta / Facebook 申请清单

申请入口：

- Meta Developers: https://developers.facebook.com/apps/
- Meta Audience Network / Monetization Manager: https://www.facebook.com/audiencenetwork/

需要创建 / 配置：

| 项目 | 回填位置 |
| --- | --- |
| Meta App ID | `platforms.metaInstant.appId` |
| Instant Games product | Meta App Dashboard |
| Rewarded placement `hint` | `platforms.metaInstant.rewardedPlacements.hint` |
| Rewarded placement `revive` | `platforms.metaInstant.rewardedPlacements.revive` |
| Rewarded placement `double-reward` | `platforms.metaInstant.rewardedPlacements.double-reward` |
| Privacy policy URL | `privacyPolicyUrl` |
| Data deletion URL | `dataDeletionUrl` |

Meta 包构建：

```bash
npm run meta:zip
```

构建脚本会注入：

- `https://connect.facebook.net/en_US/fbinstant.6.3.js`
- `platform-runtime-config.js`
- `platform-manifest.json` 中已配置的 Meta rewarded placements

在没有真实 Meta placement ID 前，只能做流程 mock：

```bash
npm run meta:zip:debug
```

`meta:zip:debug` 只用于本地 / 上传前流程检查，不能作为正式审核包提交。

## SDK 版本记录

- `play-services-ads` 最新 Maven release 在 2026-06-02 查询为 `25.3.0`。
- 当前 Android Gradle / Kotlin 组合无法直接编译 `25.3.0`，报 Kotlin metadata `2.3.0` 与当前编译器期望 `2.1.0` 不兼容。
- 本轮采用 `24.9.0`，已通过 `assembleDebug`，并在 emulator 上验证 rewarded test ad loaded / showed / reward / complete。
- 后续如升级到 `25.x`，需要同步升级 Kotlin / Android Gradle plugin 或等待 `@capacitor-community/admob` 给出兼容路径。

## 发布前广告检查

- Android 首发前 `npm run verify:android:release` 必须通过；全平台提审前 `npm run verify:platform:release` 必须通过。
- `platform-manifest.json` 不能包含 `TODO_*`、Google sample ID 或 mock 广告配置。
- Android `android/app/src/main/res/values/strings.xml` 必须同步真实 AdMob app ID。
- iOS `ios/App/App/Info.plist` 必须同步真实 AdMob app ID。
- `public/app-ads.txt` 已替换真实 publisher ID，发布前必须在 `https://arrow-again.top/app-ads.txt` 验证。
- Google Play Data safety、App Store App Privacy、Meta 隐私声明必须与广告 SDK 实际数据流一致。

## 参考

- Google Mobile Ads Android quick start: https://developers.google.com/admob/android/quick-start
- Google Mobile Ads iOS quick start: https://developers.google.com/admob/ios/quick-start
- Google Mobile Ads Android test ads: https://developers.google.com/admob/android/test-ads
- Google Mobile Ads Android rewarded ads: https://developers.google.com/admob/android/rewarded
- Meta Audience Network rewarded video: https://en-gb.facebook.com/audiencenetwork/monetize/ad-formats/rewarded-video-ads
- Meta Instant Games docs: https://developers.facebook.com/docs/games/instant-games/
