# Arrow Again AdMob Setup

日期：2026-05-31

## 后台创建目标

在 AdMob 后台为 Arrow Again 创建两套 app：

| 平台 | App name | Package / Bundle ID |
| --- | --- | --- |
| Android | Arrow Again | `com.arrowagain.game` |
| iOS | Arrow Again | `com.arrowagain.game` |

每个平台创建 3 个 Rewarded ad unit：

| Placement | 建议后台名称 | 游戏内用途 |
| --- | --- | --- |
| `hint` | `arrow_again_hint_rewarded` | 看广告获得提示 |
| `revive` | `arrow_again_revive_rewarded` | 失败后看广告复活 |
| `double-reward` | `arrow_again_double_rewarded` | 预留双倍奖励 |

## 回填位置

把 AdMob 后台生成的值填入 `platform-manifest.json`：

- `platforms.googlePlayAndroid.adMobAppId`
- `platforms.googlePlayAndroid.rewardedPlacements.hint`
- `platforms.googlePlayAndroid.rewardedPlacements.revive`
- `platforms.googlePlayAndroid.rewardedPlacements.double-reward`
- `platforms.iosAppStore.adMobAppId`
- `platforms.iosAppStore.rewardedPlacements.hint`
- `platforms.iosAppStore.rewardedPlacements.revive`
- `platforms.iosAppStore.rewardedPlacements.double-reward`

然后同步原生 app id：

```bash
npm run admob:sync
```

## 本地测试

真实 ID 创建前，只做 SDK 冒烟测试时可以写入 Google sample app id：

```bash
npm run admob:sync:test
```

正式发布前必须重新填真实 ID，并执行：

```bash
npm run verify:platform:release
```

这个巡检会阻止 placeholder、Google sample ID、Android/iOS 原生 app id 与 manifest 不一致等问题进入发布包。

## 仍需账号侧完成

- AdMob app 创建。
- Rewarded ad unit 创建。
- app-ads.txt 中的 publisher id 替换并部署到公开域名根目录。
- AdMob 隐私与同意消息配置。
- 真机验证 `hint` / `revive` 两条 rewarded 流程。
