# 小游戏机会雷达、买量优化与工程协作闭环

日期：2026-06-22  
项目：Arrow Again / `com.arrowagain.game`  
报告类型：OpportunityRadar + ProductThesis + PaidAcquisitionPlan + EngineeringHandoff

## 结论先行

本期最值得推进的 Top 1 是 **“Color Exit / Door Jam 版 Arrow Again”**：把现有“箭头出逃”核心扩成“颜色门 + 阻挡路径 + 有限托盘/钥匙”的混合休闲谜题。原因是：Color Block Jam、Screw/Sort/Block Jam 仍在美国 Google Play Puzzle 榜中有强曝光；Arrow Again 已经有路径判定、100 关、hint/revive rewarded ads、GA4 与 Android/Google Play 基础设施，MVP 可以在 3-5 天内做出买量素材验证，不需要重开项目。

本期不建议立刻做完整 AI 游戏生成器。AI 游戏生成和动态关卡是明显趋势，但对小团队更适合作为 **“AI daily challenge / AI-generated levels”** 的可营销功能，而不是先做平台型社区产品。

## 输入与限制

- 本次未在仓库中找到显式 `skill-hub` 目录或 `radar-runbook/data-capture/paid-acquisition/project-registry/store-launch/play-compliance/templates` 文件。已用现有项目文档替代：`docs/platform-unified-spec.md`、`docs/release-data/google-play-submission.md`、`platform-manifest.json`、`README.md`、已保存买量文章 `../Codex/2026-06-13/https-mp-weixin-qq-com-s/work/wechat_paid_acquisition_article.txt`。
- 未执行外部账号操作：未上传 Play Console、未发布、未发 Slack/GitHub、未创建外部账号。
- Google Trends 页面可作为后续人工复核入口，但本次可追溯事实主要来自 AppBrain、Google Play、Google Blog、Trend Hunter、Exploding Topics、BCG、GameDev Reports、FoxData。

## Sources

| 日期 | 来源 | 本次使用点 |
| --- | --- | --- |
| 2026-06-21 | AppBrain: Top Free Puzzle Games US, refreshed daily from Google Play: https://www.appbrain.com/stats/google-play-rankings/top_free/puzzle/us | Color Block Jam、Dreamy Room、Screw Out 3D、Arrow Away 等仍在 Top 100 puzzle 内 |
| 2026-06-21 | AppBrain: Top Free Word Games US: https://www.appbrain.com/stats/google-play-rankings/top_free/word/us | Daily word/brain puzzle 仍是可低成本 H5 分享壳 |
| 2026-06-08 | Trend Hunter June 2026 Games: https://www.trendhunter.com/slideshow/june-2026-games | 6 月趋势包含 word puzzle、sorting puzzle、casual game platforms、AI sandbox simulations、community sharing |
| 2026-06 | Exploding Topics Gaming Topics: https://explodingtopics.com/gaming-topics | 游戏类趋势池大，搜索增长波动快，适合做小预算素材测试而不是重押 |
| 2026-03-06 | Google Blog I/O 2026 AI puzzle: https://blog.google/innovation-and-ai/technology/developers-tools/io-save-the-date-2026-gemini/ | AI 可用于 code generation、tips、dynamic logic puzzle levels |
| 2026-06 | Aippy Google Play: https://play.google.com/store/apps/details?id=com.nadaai.aippy&hl=zh | AI game maker + swipeable interactive feed + public link sharing 是竞品形态 |
| 2026-05 | FoxData UA benchmarks: https://foxdata.com/en/blogs/2026-mobile-game-user-acquisition-cost-benchmarks-how-much-should-you-spend/ | Android hyper-casual CPI 约 $0.40；hybrid-casual Android CPI 约 $0.95；puzzle Android 约 $2.00 |
| 2025/2026 | BCG Video Gaming Report 2026: https://www.bcg.com/publications/2025/video-gaming-report-2026-next-era-of-growth | GenAI 会带来游戏供给泛滥，发现与质量差异化更重要 |
| 2025 | GameDev Reports / AppMagic hybridcasual Q1'25: https://gamedevreports.substack.com/p/appmagic-top-10-hybridcasual-games | Top hybrid-casual puzzle 包括 Block/Screw/Sort；Color Block Jam Q1'25 收入跃迁来自难度曲线与 UA |
| 2026-06-10 | Google Play review prep: https://support.google.com/googleplay/android-developer/answer/9859455?hl=en | Target audience、app access、权限声明、review 门禁 |
| 2026 | Google Play Policy Center: https://play.google/developer-content-policy/ | Play policy 总入口 |

## Opportunity Radar

评分：100 = 趋势强、可复用 Arrow Again、素材好拍、买量可验证、合规/工程风险低。

| # | 机会 | 分数 | 风险 | 适合壳子 | SEO/ASO 关键词 | MVP 时间 | 买量角度 | 素材成本 | 广告/分享点位 |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Color Exit / Door Jam Arrow | 87 | Color Block Jam/Screw Jam 竞品密集；美术同质化 | 现有 Arrow Again：箭头出逃 + 彩色出口门 + blocker | color block jam, arrow puzzle, door jam, escape puzzle, brain puzzle | 3-5 天 | “只有红色箭头能从红门逃出”；失败前 1 步强钩子 | 低：录屏 + 2D 覆盖文字 + 2-3 个色彩皮肤 | rewarded hint、revive、daily challenge 分享、失败截图分享 |
| 2 | Screw/Pin Lite Path Jam | 82 | Zynga/Rollic 类似案说明复制风险高，必须避开外观/UI | Arrow 规则换成螺丝/插销主题，但保留路径逻辑 | screw puzzle, pin jam, nut sort, unscrew puzzle | 5-7 天 | “先拔哪颗 pin 才不会卡死” | 中：需新 tile/board 资产 | hint、extra slot、undo、level fail revive |
| 3 | Cozy Tidy Arrow Rooms | 78 | 解谜规则和情绪叙事结合难度较高 | Arrow 关卡包装成整理房间、物品归位 | tidy puzzle, cozy puzzle, organize game, dreamy room | 6-9 天 | “把乱糟糟房间一箭清空” + ASMR 清理 | 中：需房间/物品素材 | daily tidy、before/after 分享、rewarded hint |
| 4 | AI Daily Arrow Challenge | 77 | AI 生成质量与审核解释；成本控制 | 现有关卡生成器 + 每日种子 + AI 命名/提示 | ai puzzle, daily brain game, ai generated levels, logic puzzle | 4-6 天（先不用在线 LLM） | “每天一关，AI 出题，你能几步过？” | 低：录屏 + 生成过程 UI | daily share、streak、hint rewarded |
| 5 | One-Hand Metro/Commuter Puzzle | 73 | 品类不是新机制，需靠体验和 SEO | Arrow Again portrait + 30 秒关卡 + 离线 | one hand game, offline puzzle, commute game, tap puzzle | 2-3 天 | “地铁一站通一关” | 低 | rewarded continue、share streak |
| 6 | Word + Arrow Hybrid Daily | 69 | 当前代码需新增字母/词库；本地化工作量 | 箭头路径清字母，组成每日单词 | word puzzle, daily word game, word arrow, brain training | 7-10 天 | “箭头顺序决定今天的词” | 中 | daily share grid、hint、extra try |
| 7 | Traffic / Crowd Exit Reskin | 68 | Traffic Jam 竞品多，3D 预期高 | 箭头换成车辆/小人，方向出逃 | traffic jam, parking puzzle, escape car, crowd puzzle | 5-8 天 | “这辆车一动全盘活了” | 中 | revive、undo、level fail share |
| 8 | Aippy-style Shareable Micro Puzzle Feed | 62 | 平台/UGC/审核/社区成本高，不适合先做 | Web H5 多玩法 feed，Arrow 为首个模板 | ai game maker, mini game creator, play link | 14-21 天 | “像刷短视频一样刷小游戏” | 高 | creator share、模板 remix、无广告冷启动 |

## Top 1 ProductThesis

### 产品假设

**Color Exit / Door Jam Arrow** 面向 18-45 岁休闲解谜用户，尤其是已经被 Color Block Jam、parking jam、screw puzzle 教育过的玩家。他们接受“看一眼就懂、卡住就想看广告/买一步”的玩法，但需要更轻、更快、更适合 H5/Instant 分享的版本。

### 核心循环

1. 玩家看到一个多色箭头棋盘。
2. 只能点击路径无遮挡且出口颜色匹配的箭头。
3. 清除箭头后打开新的路径或颜色门。
4. 卡住时使用 hint/revive/undo。
5. 通关获得星级、streak、daily score。
6. 分享“我第 X 关 N 步清空”或进入下一关。

### 差异化设计

- 不直接复制 Color Block Jam 的“滑块进门”，而是使用 Arrow Again 的“方向路径 + 出口判定”。
- 新增“颜色门”只是约束层，不改变底层路径解法，工程可控。
- 关卡视觉从“箭头棋盘”升级为“机场/地铁/门禁出口”的直觉隐喻，素材里能一眼看懂。
- 每日挑战用 deterministic seed，先离线生成，不依赖在线 LLM；文案可包装成 “AI daily challenge”。

### 混合休闲层

- Early game：前 10 关几乎无强广告，快速建立理解。
- Mid game：rewarded hint、revive、undo；失败后给“差一步”的强提示。
- Long game：daily streak、章节地图、限时皮肤、no-ads/skip rewarded 后续再评估。
- LiveOps 最小形态：每日 1 关 + 每周 7 关挑战包。

### 留存/变现逻辑

- D0/D1：低挫败、新鲜视觉、关卡短。
- D3/D7：daily challenge + streak + hard level warning。
- IAA：hint/revive/double-reward 点位已经存在，可复用 `hint`、`revive`、`double-reward`。
- IAP：MVP 不先做；若 D7/LTV 过线，再加 no-ads、extra undo pack、season pass。

### 为什么现在做

- AppBrain 2026-06-21 美国 Puzzle Top 100 仍能看到 Color Block Jam、Dreamy Room、Screw Out 3D、Arrow Away 等类似用户需求。
- Google I/O 2026 把 AI puzzle/dynamic levels 放到开发者营销入口，AI 关卡/提示可以作为“现在感”卖点。
- Arrow Again 已经具备 Google Play/Meta/Web 多端壳、rewarded ads、GA4、100 关和验证脚本，最短路径是“玩法约束 + 素材验证”，不是重写。

## Top 1 PaidAcquisitionPlan

### Geo / Channel

- Phase 0 organic smoke：Web/H5、closed test 群、Meta Instant debug share。
- Phase 1 paid learning：Android only；US + CA + AU 小预算，另开 PH/ID/BR 低 CPI 对照。
- Channel：Google App Campaigns、Meta Advantage+ app campaigns、TikTok/Spark Ads 小预算创意学习。没有素材胜率前不进大预算。

### 预算上限

- 第 1 轮：总 $300-$500，3 个 geo bucket x 4-6 条素材，每条素材至少 $20-$30 学习。
- 第 2 轮：只保留达到门槛的 2-3 条素材，总 $500-$1,000。
- 不在 D1/D3 cohort 读数前放量。

### 受众分层

- Puzzle intent：Color Block Jam、Screw Jam、parking puzzle、brain puzzle 兴趣。
- Quick-relief casual：commute game、offline puzzle、one hand game。
- Challenge seeker：hard puzzle、IQ/brain teaser、fail bait。
- AI novelty：AI generated puzzle、daily AI challenge，只作为素材 tag，不把产品承诺做过头。

### 创意矩阵

| 模块 | 变体 A | 变体 B | 变体 C |
| --- | --- | --- | --- |
| Intro 0-2s | “Only 1 arrow can escape” | “99% fail this color door” | “AI made this level today” |
| Gameplay 2-12s | 红箭头被红门放行，错点失败 | 连续清 6 步产生爽感 | 最后一步卡住，hint 显示正确箭头 |
| CTA 12-15s | “Can you clear it in 12 moves?” | “Try Level 36” | “Play today’s challenge” |
| Endcard | App icon + 3 screenshots | Before/after clear board | Daily streak result card |

素材制作成本：第一轮可用真实录屏 + CapCut/After Effects 字幕，约 0.5-1 人天产出 12 条 9:16；若要 Cozy/Tidy 主题再加 1-2 人天 2D 资产。

### 事件埋点

已有事件可复用：`session_start`、`level_start`、`level_complete`、`level_fail`、`level_end`、`rewarded_request`、`rewarded_complete`、`rewarded_fail`、`share_result_request/complete/fail`。

建议新增/细化：

- `daily_challenge_start/complete/share`
- `color_gate_blocked`
- `hint_shown_available_count`
- `ad_cohort_source` 或通过 UTM / install referrer 归因到 campaign/adset/creative
- `first_fail_level_id`
- `d1_return_open`

### 指标门槛

| 阶段 | 看什么 | Kill | Iterate | Scale |
| --- | --- | --- | --- | --- |
| Creative learning | CTR, IPM, CVR | CTR < 0.8% 且 CVR < 15% | CTR 高但 CVR 低：商店页/首屏不一致 | CTR > 1.5%，CVR > 25% |
| Cohort D1 | D1, tutorial completion, level 5 reach | D1 < 20% 或 L5 < 35% | D1 20-28%，调前 10 关节奏 | D1 > 30% |
| Monetization | rewarded opt-in, ARPDAU, fail-to-ad rate | rewarded opt-in < 8% 且 ARPDAU 低 | 调 hint/revive 出现时机 | rewarded opt-in > 15% 且留存不降 |
| Unit economics | CPI, D7, LTV, ROAS | Android puzzle CPI > $2.50 且 D7 < 8% | CPI 可控但 D7 弱：改 meta/daily | D7 > 10-12%，pLTV/CPI 有放量空间 |

闭环必须是：小预算学习 -> cohort readout -> 产品/商店/素材迭代 -> scale or kill。不能只看 CTR 或安装量。

## EngineeringHandoff

### Repo / Project

- Repo：`/Users/zhengjinyang/Documents/arrow`
- Project：Arrow Again TypeScript + Canvas/SVG + Capacitor
- 建议分支：`feature/color-exit-daily-challenge`
- 建议 issue：`Prototype Color Exit rules and UA instrumentation`

### 要改的文件/模块

- `src/game/types.ts`：给 level/piece 增加可选 `color`、`exitColor` 或 `gateColor` 字段。
- `src/game/rules.ts`：在 `isPathClear` 外增加 `canExitGate(piece, level)`，保持旧关卡兼容。
- `src/game/levels.json`：新增 10-20 个 color gate 测试关，先不要替换全部 100 关。
- `scripts/generate-levels.mjs` / `scripts/level-tools.mjs`：生成器与 solver 增加颜色门约束。
- `scripts/verify-levels.mjs` / `scripts/verify-balance.mjs`：验证 color gate 关卡可解与难度曲线。
- `src/main.ts`：渲染颜色门/出口、失败提示、`color_gate_blocked`、daily challenge 入口。
- `src/styles.css`：颜色门、daily card、结果分享状态。
- `src/storage.ts`：daily streak / played date / best moves。
- `docs/analytics-event-spec.md`：补事件字典。
- `scripts/run-e2e.mjs`：补 color gate 通关、blocked click、daily challenge、share smoke。

### 实现步骤

1. 数据模型先向后兼容：旧关卡无颜色字段时行为不变。
2. 添加颜色门判定：路径 clear 且 piece.color 与出口/门颜色匹配才可移除。
3. 做 10 个手工关卡：3 tutorial、5 medium、2 hard，用于素材录屏和 closed test。
4. UI 只做最小可读：棋盘边缘显示颜色门，blocked 时短提示“wrong gate”。
5. 事件埋点接入现有 `track` 方法，带 `level_id`、`piece_color`、`gate_color`、`available_count`。
6. Daily challenge 使用本地日期 seed 从候选关卡中选择，先不接在线 AI。
7. 跑本地 QA，通过后录制 12 条素材。

### QA 命令

```bash
npm run typecheck
npm run verify:levels
npm run verify:balance
npm run verify:platform
npm run verify:analytics
npm run e2e
npm run build
```

Android/Google Play release gate：

```bash
npm run verify:android:release
npm run google:aab
```

### Done Definition

- 旧 100 关仍可运行，新增 color gate 关卡可解。
- E2E 覆盖：进入 daily、点击错误颜色门、hint、revive、通关分享。
- GA4 debug 能看到新增事件。
- 能录制至少 12 条 9:16 素材。
- Android release gate 不因 manifest、AdMob 或 policy URL 失败。

## Google Play / Android 上架门禁

当前仓库已有：

- `privacy_url`：`https://arrow-again.top/privacy.html`
- `support_url`：`https://arrow-again.top/support.html`
- `data_deletion_url`：`https://arrow-again.top/data-deletion.html`
- `support_email`：`j.n.young0209@gmail.com`
- AdMob Android app/unit IDs：已在 `platform-manifest.json` 和 `android/app/src/main/res/values/strings.xml`
- Ads disclosure：Google Play submission kit 已声明 optional rewarded ads

仍需用户本人/Play Console 完成：

- `in_app_delete_path`：在 Play Console Data safety 中说明“无账号；本地数据可清除 app storage/卸载；平台/支持数据通过 data deletion URL 请求”。如后续加账号，必须提供应用内删除入口。
- `reviewer_access`：声明无需登录；若 Play Console 要求，提供测试说明而非账号。
- Data safety：按最终 AdMob/GA4 SDK 实际收集共享复核 Device IDs、App activity、Diagnostics、Approximate location。
- Ads：声明含广告，格式为 optional rewarded ads。
- Content rating：按无暴力/无性/无赌博/无 UGC/无通讯/无 IAP 起始答案完成 IARC。
- Target audience：建议 13+，避免儿童定向触发 Families SDK/广告限制；商店素材不要面向儿童。

## 事项分工

### Codex 可直接代办

- 建 `feature/color-exit-daily-challenge` 分支并实现原型。
- 增加事件字典、E2E、关卡验证。
- 生成素材录屏脚本和素材文案矩阵。
- 更新 `docs/release-data/google-play-submission.md` 的 Data safety 草案。

### 需要用户本人处理

- Play Console app content、Data safety、content rating、target audience、closed test 提交。
- AdMob/Google Ads/Meta Ads 账户预算与付款方式。
- 最终确认隐私政策、数据删除声明、面向年龄。
- 决定是否把 “AI daily challenge” 写进商店文案，避免功能尚未真实上线时过度承诺。

### 需要工程协作/PR

- Color gate 数据模型和 solver 改动。
- Daily challenge/streak 持久化。
- Install referrer / campaign attribution 接入。
- GA4/AdMob cohort readout 仪表盘或导出脚本。

## 下一步建议

1. 本周先开 PR 做 Top 1 原型，不动 Play Console。
2. 原型完成后录制 12 条素材，先跑 $300-$500 Android 小预算学习。
3. 48-72 小时后按 CPI/CTR/CVR/D1/level 5 reach/rewarded opt-in 做 readout。
4. 达不到 D1 或 CVR 门槛就先改前 10 关与商店首屏，不加新系统。
