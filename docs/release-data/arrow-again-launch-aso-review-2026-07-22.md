# Arrow Again 上线后数据与 ASO 复盘

日期：2026-07-22
应用：Arrow Again: Tap Away Puzzle
数据窗口：2026-06-22 至 2026-07-21（请求窗口；实时数据未获授权）

## Executive Summary

当前决策是 **Hold（先补数据读取，再做增长判断）**。Arrow Again 的 Firebase/GA4 配置指向正确项目和属性，本地埋点合同也完整；但 GA4 Data API 对正确属性 `542507123` 返回 403，Play Console 的商店访问、安装转化、国家/语言分布也没有可用导出。因此，当前不能可信地汇报用户分布、D1/D7 留存或 ASO 转化，更不能用其他应用的数据代替。

ASO 素材审查发现三项可立即处理的问题：首图信息密度低、英文第 4 张截图混入中文、目前只有 4 张英文截图且没有中文本地化套图。标题和短描述已接近字符上限，在获得商店访问与转化数据之前，不建议同时改标题、描述和素材。

## 本次实际跑数结果

执行：

- `npm run firebase:analytics:status`
- `npm run ga:daily -- --lookback-days=30 --json`
- `npm run growth:verify`

结果：

| 检查项 | 结果 | 判断 |
| --- | ---: | --- |
| Firebase 项目 | `arrow-again-game` | 正确 |
| GA4 属性 | `542507123` | 正确 |
| Measurement ID | `G-NYTJ43WDD5` | 正确 |
| 必需事件代码覆盖 | 28 / 28 | 通过 |
| 公共参数代码覆盖 | 22 / 22 | 通过 |
| GA4 实时数据 | 403 | 阻塞，不能输出 DAU/留存/分布 |
| Play Console acquisition 数据 | 未取得 | 阻塞，不能输出商店转化 |
| AdMob 展示级收入 | `ad_impression` 未接入 | 暂不能算 ARPDAU/LTV |

数据质量状态：`pipeline_ready_live_access_missing`。此前其他 GA4 属性中的数据与 Arrow Again 无关，禁止用于本项目判断。

## ASO 可优化项

### P0：先修截图，不先动文案

1. **重做首图排序与构图。** 当前首页截图留白过大，核心棋盘和操作价值不够突出。建议把“手指/箭头操作 + 棋盘局势”作为首图，首页只保留在后位或删除。
2. **修复英文第 4 张截图的混合语言。** 结果页出现 `Level 1 · 第一步`，会削弱英文商店页的完成度和可信度。
3. **给截图加商店语境下可读的短标题。** 每张只表达一个利益点，例如 `Plan Every Tap`、`Clear the Maze`、`Protect Your Hearts`、`100 Handcrafted Levels`；避免把应用内按钮当作卖点。
4. **补齐 zh-CN 本地化截图。** 中国用户看到全英文素材时，商店转化与新手理解会被语言因素混在一起，无法判断是玩法问题还是本地化问题。

### P1：作为单变量实验

- **图标实验：** 当前图标浅色背景、路径元素较多，小尺寸下辨识度可能不足。测试一个高对比、单一主箭头、更少路径细节的版本；不要直接覆盖现版。
- **首图实验：** A 版强调“Tap Away”，B 版强调“Think Before You Tap”。一次只测试一个变量，避免同时改图标、标题和截图。
- **文案暂缓：** 标题 `Arrow Again: Tap Away Puzzle` 为 28/30 字符，短描述为 74/80 字符。没有按国家/语言拆分的访问与安装转化前，继续堆关键词很难归因。

## 用户分布、留存与埋点框架

### 用户分布

每周固定查看：

- Play Console：商店访问者、商店获取用户、商店转化率，按国家、语言、流量来源拆分。
- GA4：`country`、`language`、`platformDeviceCategory`、`appVersion`，并同时展示 active users 与 new users。
- 判断规则：某国家/语言有访问但转化低，先改商店本地化；安装后首局启动低，再改新手体验。不要把两类问题混为一个“留存差”。

### 留存

- 主指标：D1、D7 用户留存；样本少于 30 个新用户时只作为方向，不下强结论。
- 领先指标：`game_start → level_start → level_end → level_complete`。
- 诊断指标：`level_fail`、`level_quit`、失败后重试、奖励广告请求/完成、按关卡号的流失。
- 建议补充：将 `first_open` 与首次 `level_start` 形成首局启动率；用 GA4 cohort 报告计算 D1/D7，而不是把 `app_open` 次数当留存用户数。

### 埋点

现有 28 个必需事件和 22 个公共参数已通过代码检查。下一步不是继续加事件名，而是确认线上流量能看到以下字段并可按版本/关卡拆分：

- `level_id`、`level_number`、`result`、`fail_reason`、`duration_ms`
- `session_id`、`app_version`、`platform`、`locale`
- 奖励广告：request、complete、fail；接入展示级收入后补 `ad_impression`

## 稳定闭环

| 节奏 | 输入 | 输出 | 决策门槛 |
| --- | --- | --- | --- |
| 每日 17:00 | GA4 正确属性、Google Play Cloud Storage 报表、埋点验证 | 昨日/7 日活跃、新增、会话、商店转化、核心漏斗、数据缺口 | 分母小于 10 不做优化结论；权限异常立即 Hold |
| 每周一 18:00 | 自动同步的 Play Store Performance + GA4 分布/留存 | 国家/语言/来源分布、商店转化、D1/D7、关卡流失、单一实验建议 | 少于 30 个新用户只看方向；缺来源时不改 ASO |
| 实验结束 | 同一时间窗的 A/B 或前后对照 | Keep / Iterate / Roll back | 一次只改变一个主变量，记录版本、日期和样本 |

闭环路径：`商店曝光 → 商店访问 → 获取用户 → first_open → game_start → level_start → level_complete → D1/D7 → ASO/产品单变量实验`。

## 下一步

1. 在 GA4 属性 `542507123` 给日报服务账号 Viewer 权限；权限恢复后重新跑 30 日分布和 cohort 留存。
2. 一次性给 Google Play 报表服务账号授予全局只读批量报表权限，并配置 `pubsite_prod_rev_...` Cloud Storage URI；之后由 `npm run play:reports` 每日自动同步，不再手工导出。
3. 先修英文第 4 张图的中文残留，并产出一个高信息密度的首图候选。
4. 数据源齐全前保持 Hold，不花预算、不大改商店文案、不用其他项目数据替代。

## Further Questions

- 当前正式上架日期与首次自然流量日期是否一致？
- 商店页实际启用了哪些语言和自定义商店页？
- 是否准备在下一版本接入 AdMob `ad_impression`，用于 ARPDAU/LTV？

## Caveats and Assumptions

- 本报告的 ASO 建议来自现有 4 张 en-US 商店截图与图标的视觉审查，不是转化率因果结论。
- 用户分布和留存数据因权限缺失未读取；任何数值填补都会造成错误决策，因此本次明确留空。
- Google Play 与 GA4 的用户/安装口径不同，应各自用于商店转化与应用内行为，不直接混算。

参考：

- [GA4 Data API dimensions and metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- [Play Console: Understand and grow your app's user base](https://support.google.com/googleplay/android-developer/answer/9859173?hl=en)
- [Play Console: Download and export monthly reports](https://support.google.com/googleplay/android-developer/answer/6135870?hl=en)
