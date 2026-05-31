# 小游戏一码多端平台统一规格

日期：2026-05-30  
适用项目：Arrow Again、球球大作战、坦克大战、Traffic Jam 以及后续同类 H5/Instant/Native 包装小游戏。

## 目标

所有游戏只调用一套 `PlatformBridge`，不在玩法代码里判断 Google / Meta / Web：

```ts
const platform = createPlatformBridge();

await platform.ready();
platform.progress(100);
await platform.showRewardedAd('hint');
await platform.share({ text: '我通关了 Arrow Again!' });
platform.haptic(18);
platform.track('level_complete', { level: 12, stars: 3 });
```

平台差异留在 `src/platform/*`：

| 文件 | 职责 |
| --- | --- |
| `src/platform/spec.ts` | 游戏可调用的稳定接口、能力声明、广告位枚举 |
| `src/platform/web.ts` | 浏览器/H5，本地验证用 mock rewarded ad |
| `src/platform/meta.ts` | Meta Instant Games，接 FBInstant 生命周期、分享、日志、激励视频 |
| `src/platform/google.ts` | Google Play Android/Capacitor 壳，接原生 host bridge、AdMob/analytics 等 |
| `src/platform/index.ts` | 自动识别当前运行环境并返回对应 adapter |

## 运行时能力矩阵

| 能力 | Web/H5 | Meta Instant | Google Play Android |
| --- | --- | --- | --- |
| 初始化 | no-op | `FBInstant.initializeAsync/startGameAsync` | Capacitor WebView no-op，原生插件可扩展 |
| 加载进度 | no-op | `FBInstant.setLoadingProgress` | no-op 或原生 loading bridge |
| 激励广告 | 本地 mock | `FBInstant.getRewardedVideoAsync` + placement id | `window.NativeGameHost.showRewardedAd` |
| 分享 | Web Share API | `FBInstant.shareAsync` | Web Share API 或原生 Share 插件 |
| 震动 | `navigator.vibrate` | `navigator.vibrate` | `navigator.vibrate` 或原生 haptics |
| 埋点 | no-op | `FBInstant.logEvent` | `window.NativeGameHost.track` |
| 玩家信息 | 无 | `FBInstant.player.getName` | 后续接 Play Games Services 或自有账号 |

## 游戏侧调用约束

- 游戏逻辑只依赖 `PlatformBridge`，不能直接调用 `FBInstant`、Capacitor、AdMob 或 Google Play SDK。
- 广告点位必须使用统一枚举：`hint`、`revive`、`double-reward`。
- `platform.capabilities.rewardedAd === false` 时，UI 仍可显示按钮，但要给出“广告暂不可用”的失败路径。
- 只有 Web adapter 默认 mock rewarded ad；Meta/Google 生产环境必须配置真实广告位或原生 host bridge。
- 分享、埋点、震动都允许失败，不得阻断主玩法。

## 发布 Profile

| Profile | 产物 | 当前项目入口 | 上架前必备 |
| --- | --- | --- | --- |
| `meta-instant` | zip，包含 `index.html`、构建产物、`fbapp-config.json`、FBInstant SDK script | `npm run meta:zip` | Meta app id、Instant Games 配置、广告 placement、隐私政策、素材、审核账号 |
| `google-play-android` | Android App Bundle `.aab` | `npm run google:aab` | 包名、签名、versionCode、AAB、target SDK、Data safety、隐私政策、截图、商店文案 |
| `web-h5` | 静态 Web build | `npm run build` | 域名、HTTPS、PWA manifest、隐私政策、统计与广告合规 |

## 当前 Arrow Again 状态

已经具备：

- 单份 TypeScript 游戏运行时。
- Meta Instant Games zip 打包脚本。
- Capacitor Android/iOS native shell。
- 100 关数据、可解性和平衡性校验。
- rewarded hint / revive 的 E2E 验证路径。
- 统一 `PlatformBridge` 接口雏形。

仍需补齐：

- Meta 后台真实 rewarded placement id，并注入 `window.__GAME_PLATFORM_CONFIG__.rewardedPlacements`。
- Google Play Android 的原生 `NativeGameHost.showRewardedAd`，建议用 AdMob rewarded ad 封装。
- Google Play release signing、AAB 上传、Data safety、隐私政策、素材截图。
- 每个游戏一份 `platform-manifest`，声明 app id、商店名、广告位、埋点命名和目标端。

## 推荐平台 Manifest

每个小游戏增加一份同结构配置，便于自动化上架检查：

```json
{
  "gameId": "arrow-again",
  "displayName": "Arrow Again",
  "orientation": "portrait",
  "platforms": {
    "metaInstant": {
      "appId": "META_APP_ID",
      "rewardedPlacements": {
        "hint": "META_HINT_PLACEMENT",
        "revive": "META_REVIVE_PLACEMENT",
        "double-reward": "META_DOUBLE_REWARD_PLACEMENT"
      }
    },
    "googlePlayAndroid": {
      "applicationId": "com.arrowagain.game",
      "versionCode": 1,
      "versionName": "1.0",
      "rewardedPlacements": {
        "hint": "ADMOB_HINT_UNIT",
        "revive": "ADMOB_REVIVE_UNIT",
        "double-reward": "ADMOB_DOUBLE_REWARD_UNIT"
      }
    }
  }
}
```

## 下一步落地顺序

1. 做 Google Android `NativeGameHost` 原生桥，先接 rewarded ad 和 analytics。
2. 替换 `platform-manifest.json` 中的 Meta app id、广告位、AdMob unit、隐私政策 URL 和支持邮箱，并跑 `npm run verify:platform:release`。
3. 把这套 `src/platform` 抽成小游戏模板模块，复制到坦克大战、Traffic Jam 后只改 manifest。

## 参考

- Google Android App Bundle：<https://developer.android.com/guide/app-bundle>
- Google Play target API level requirements：<https://developer.android.com/google/play/requirements/target-sdk>
- Capacitor Android：<https://capacitorjs.com/docs/android>
- Meta Instant Games 文档入口：<https://developers.facebook.com/docs/games/instant-games/>
