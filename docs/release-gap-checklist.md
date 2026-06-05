# Arrow Again 上线缺口清单

日期：2026-06-05

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

2026-06-05 已推进：

- `scripts/verify-platform-manifest.mjs` 已新增公开审核页面内容扫描，`--release` 会阻止 Draft/TODO/REPLACE 文案进入提审状态。
- `public/privacy.html` 已从草稿页改成可公开访问的隐私政策版本。
- 新增 `.github/workflows/ci.yml`，PR / main push / 手动触发会安装 Playwright Chromium 并运行 `npm run verify:all`。
- 本地已确认 `typecheck`、关卡结构、关卡平衡、普通平台 manifest 校验通过。
- `npm run google:aab` 已成功产出 `android/app/build/outputs/bundle/release/app-release.aab`；提交 Google Play 前仍需配置正式 upload key / signing config。
- Android 上架优先级已提升：新增 `npm run verify:android:release`，Android release 校验不再被 Meta placeholder 阻断。
- `platform-manifest.json` 已补 `releaseAssets.appAdsTxtUrl = https://arrow-again.top/app-ads.txt`，配合 `public/CNAME` 部署到开发者网站根目录。
- Android Gradle 已支持通过环境变量读取正式 upload key，避免把 keystore 或密码提交进仓库。
- 当前本机 `curl https://arrow-again.top/app-ads.txt` 仍显示 DNS 未解析；AdMob 验证前需要先完成域名 DNS 到 GitHub Pages 的配置。

距离真正上线，仍差 4 类工作：

1. Android 签名、Google Play 后台和 app-ads.txt 验证。
2. Android 真机 smoke test 与 AdMob rewarded 真机验证。
3. Google Play 商店与审核物料补齐。
4. Meta / iOS 后续平台配置与 smoke test。

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
- manifest 仍是 `draft`，应在对应平台后台 ID、物料和 smoke test 完成后改为 `ready`。
- Meta app id、Meta rewarded placement 仍是占位值；AdMob Android / iOS app id 与 rewarded ad unit 已回填为当前生产值。
- 隐私政策 URL、数据删除 URL、支持邮箱已有当前值，但提审前仍需最终法律文本确认。
- `npm run verify:platform` 会通过并列出 release blockers。
- `npm run verify:platform:release` 会在占位值未替换前失败，适合提审前使用。
- `npm run verify:platform:release` 也会检查公开审核页面是否残留 Draft/TODO/REPLACE 文案。
- `npm run verify:android:release` 是 Android 专用提审门禁；Meta App ID / placement 缺失不会阻断 Android AAB。

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
- `public/app-ads.txt` 已替换 Google publisher id，并将随 `public/CNAME` 部署到 `https://arrow-again.top/app-ads.txt`。
- Meta 包已注入 FBInstant SDK 和 runtime placement 配置；真实 Meta 广告展示仍需要后台 App ID / placement ID，但已降为 Android 首发后的后置项。
- `npm run verify:android:release` 会阻断 Android AdMob、app-ads.txt 和公开页面的 Android 提审问题。
- `npm run verify:platform:release` 仍会阻断全平台提审，包含 Meta placeholder。

#### 3. 上架物料与合规

当前 repo 已明确缺这些：

- 隐私政策最终法律文本确认（页面已不再是 Draft，但仍建议提交前由开发者/法务确认）
- Android 正式 upload key / signing env
- 最终包名 / 版本号
- `app-ads.txt` 公开域名根目录上线后的 AdMob 验证与隐私/同意消息配置
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

当前状态：

- Android AAB 已可产出。
- Android signed AAB 需要提供 `ANDROID_RELEASE_STORE_FILE`、`ANDROID_RELEASE_STORE_PASSWORD`、`ANDROID_RELEASE_KEY_ALIAS`、`ANDROID_RELEASE_KEY_PASSWORD` 后重新运行 `npm run google:aab`。
- Meta debug zip 已可产出；正式 Meta zip 降为 Android 首发后事项，仍等待真实 Meta App ID / placement IDs。

### P1：建议在提交审核前完成

#### 4. Android 目标平台 smoke test

当前 E2E 只证明 Web 路径可跑，还不等于目标发布环境可跑。

至少补：

- Android WebView / Capacitor smoke test
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

1. 配置 Android upload key 环境变量并运行 `npm run google:aab`，产出 signed AAB。
2. 合并并部署 Pages，配置 `arrow-again.top` DNS，确认 `https://arrow-again.top/app-ads.txt` 可访问，再到 AdMob 完成 app-ads.txt 验证和隐私/同意消息配置。
3. Android 真机 smoke test，覆盖首屏、第 1 关、hint、revive、Hard 弹窗、分享、返回前台。
4. Google Play 商店文案 / 截图 / Data safety / 隐私政策最终确认。
5. 上传 AAB 到 closed testing 或 production draft。
6. Meta app id / rewarded placement id 放到 Android 首发后推进。

## 需要你本人推进或提供

- Android upload key / keystore 或对应环境变量
- Google Play 后台权限、Data safety 选择、商店截图和主视觉取舍
- `arrow-again.top` DNS / GitHub Pages 自定义域名解析
- AdMob app-ads.txt 验证、隐私/同意消息配置确认
- 最终包名、展示名、版本策略
- Apple / Meta 开发者后台权限（Android 首发后）

## 一句话判断

如果只按“Android 首发可上架”算，当前最缺的是正式 upload key、Google Play 后台物料 / Data safety、AdMob app-ads.txt 验证和 Android 真机 smoke test；Meta 已降为后续平台。
