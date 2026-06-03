# Arrow Again 上线缺口清单

日期：2026-06-02

## 结论先行

当前项目已经具备：

- 100 关单一数据源。
- 关卡结构校验与平衡校验。
- Web 构建。
- rewarded hint / revive 的 E2E 验证路径。
- Web / Meta / Google 的统一 `src/platform` 接口雏形。
- Android / iOS Capacitor 壳。
- 可重复生成的图标、开屏图、PWA 图标和分享图。
- AdMob / Meta / App Store / Google Play 的发布资料模板。
- 留存首页模块、反馈入口和最小上线埋点闭环。

距离真正上线，仍差 4 类工作：

1. 平台配置落库并可校验。
2. 真实 AdMob 后台 ID 创建、同步和真机验证。
3. 商店与审核物料补齐。
4. 真机和目标平台 smoke test。

## 按优先级拆分

### P0：上线前必须完成

#### 1. 平台 manifest 落库

目标：把 Meta / Google 的上架必填配置从“口头约定”变成仓库内可校验文件。

已新增：

- `platform-manifest.json`
- `scripts/verify-platform-manifest.mjs`
- `npm run verify:platform`
- `npm run verify:platform:release`

manifest 至少要包含：

- `gameId`
- `displayName`
- `orientation`
- `metaInstant.appId`
- `metaInstant.rewardedPlacements`
- `googlePlayAndroid.applicationId`
- `googlePlayAndroid.versionCode`
- `googlePlayAndroid.versionName`
- `googlePlayAndroid.rewardedPlacements`
- `privacyPolicyUrl`

验收标准：

- 本地能跑 `node scripts/verify-platform-manifest.mjs`
- 缺字段时直接 fail
- README 补一条 manifest 校验入口

当前状态：

- 结构校验已落地。
- manifest 仍是 `draft`。
- Meta app id、Meta rewarded placement、AdMob app id / ad unit 仍是占位值。
- 隐私政策 URL、数据删除 URL、支持邮箱已有当前值，但提审前仍需最终法律文本确认。
- `npm run verify:platform` 会通过并列出 release blockers。
- `npm run verify:platform:release` 会在占位值未替换前失败，适合提审前使用。

#### 2. AdMob rewarded / 原生分享接入

目标：让 `src/platform/google.ts` 不再只停留在接口层，真正接到 Capacitor Share 与 AdMob rewarded。

已新增：

- `@capacitor/share`
- `@capacitor-community/admob`
- `npm run admob:sync`
- `npm run admob:sync:test`
- `npm run android:debug:ads`
- Android / iOS AdMob app id 一致性巡检

验收标准：

- Android 真机或模拟器上能走一次提示广告
- Android 真机或模拟器上能走一次复活广告
- iOS 真机或模拟器上可初始化 AdMob SDK
- 游戏 UI 文案和返回结果一致

当前状态：

- 代码桥已接入。
- Android debug 包已用 Google sample rewarded ad unit 验证提示广告：广告展示、reward granted、返回游戏高亮提示均通过。
- AdMob Android / iOS app id 与 3 个 rewarded ad unit 已创建并回填；`npm run admob:sync` 已同步原生配置。
- `public/app-ads.txt` 已替换 Google publisher id，仍需部署到公开域名根目录。
- Meta 包已注入 FBInstant SDK 和 runtime placement 配置；真实 Meta 广告展示仍需要后台 App ID / placement ID。
- `npm run verify:platform` 会列出这些 release blockers；`npm run verify:platform:release` 会阻断提审。

#### 3. 上架物料与合规

当前 repo 已明确缺这些：

- 隐私政策最终法律文本确认
- Android 签名
- 最终包名 / 版本号
- `app-ads.txt` 公开域名根目录部署与 AdMob 隐私/同意消息配置
- Meta App ID / placement IDs
- 商店截图
- 商店最终文案审核
- Google Play Data safety
- Apple 侧签名与隐私元数据

已落库：

- `docs/release-data/platform-data.md`
- `docs/release-data/aso-retention-feedback-plan.md`
- `public/app-home.html`
- `public/privacy.html`
- `public/data-deletion.html`
- `public/support.html`
- `public/app-ads.txt`
- `scripts/generate-release-assets.mjs`
- `npm run assets:release`

验收标准：

- Android AAB 可产出
- Meta zip 可产出
- 每个平台都有可提交的文案和截图

### P1：建议在提交审核前完成

#### 4. 目标平台 smoke test

当前 E2E 只证明 Web 路径可跑，还不等于目标发布环境可跑。

至少补：

- Android WebView / Capacitor smoke test
- Meta Instant Games smoke test
- 低端机触控与首屏加载体验验证

建议覆盖：

- 首屏进入
- 第 1 关完整通关
- hint
- revive
- Hard 弹窗
- 分享不崩溃
- 返回前台后继续游戏

#### 5. 埋点最小闭环

当前 `track` 接口已抽象，游戏运行时已接入最小上线事件集。

已落库这些事件：

- `game_start`
- `level_start`
- `level_complete`
- `level_fail`
- `rewarded_request`
- `rewarded_complete`
- `rewarded_fail`
- `feedback_open`
- `share_result_request`
- `share_result_complete`
- `share_result_fail`

验收标准：

- 事件名固定
- 参数字段固定
- Web mock / Meta / Google 行为差异有文档

当前状态：

- 游戏代码已调用上述事件。
- `docs/release-data/aso-retention-feedback-plan.md` 已记录事件、反馈闭环和 closed test 建议。
- 真实后台 analytics 仍依赖 Meta / 原生 host bridge / 后续接入。

### P2：可在首发后继续迭代

#### 6. 内容与体验增强

- 插屏节奏接入
- boss 失败保盘复活
- 分享素材优化
- 更完整的新手引导
- 低端机性能优化
- 真实广告数据后的插屏节奏优化

这些不阻塞首发，但会影响留存和变现。

## 建议的执行顺序

1. `platform-manifest.json` + `verify-platform-manifest`
2. Android/iOS 真机 smoke test
3. Meta app / placement 配置 + Meta smoke test
4. `app-ads.txt` 公开部署与 AdMob 隐私/同意消息配置
5. 商店文案 / 截图 / 隐私政策 / Data safety
6. 出 Android AAB 和 Meta zip 作为首批上线包

## 需要你本人推进或提供

- 最终包名、展示名、版本策略
- Meta app id 和广告位 id
- 隐私政策 URL
- 可部署 `app-home.html` / `privacy.html` / `data-deletion.html` / `app-ads.txt` 的公开域名
- Google Play / Apple / Meta 开发者后台权限
- 商店截图和主视觉取舍

## 一句话判断

如果只按“能提第一版 Android/Meta 包”算，当前最缺的不是玩法，而是平台后台 ID、上架物料和真机 smoke test。
