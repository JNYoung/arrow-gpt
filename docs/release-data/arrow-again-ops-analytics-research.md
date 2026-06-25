# Arrow Again 迭代 / 运营 / 数据分析深度任务拆解

日期：2026-06-21

## 结论摘要

Arrow Again 当前已经具备适合首发验证的基础：100 关关卡池、3 生命、星级、撤销、提示、复活、分享、反馈入口、AdMob rewarded 广告位和平台桥接。下一步最重要的不是继续扩功能，而是把“玩家是否理解、在哪里卡住、广告是否帮忙而不是打扰、哪些关卡导致流失”变成可持续分析的运营系统。

首轮建议以 4 个北极星问题组织数据工作：

1. 新玩家是否在 1 分钟内理解玩法，并完成前 5 关？
2. 第 5 / 6 / 10 / 15 关这些早期 hard/boss 节点是否造成异常流失？
3. rewarded hint / revive 是否提升通关、留存和收入，还是只暴露难度问题？
4. Android closed test 的 12 名测试者连续 14 天数据，能否证明游戏稳定、可理解、可回访？

## 当前项目画像

来源：`README.md`、`docs/design-roadmap.md`、`docs/release-data/aso-retention-feedback-plan.md`、`src/main.ts`、`src/game/levels.json`、`scripts/level-tools.mjs`、`scripts/verify-balance.mjs`、`src/platform/*`。

| 模块 | 当前状态 | 分析含义 |
| --- | --- | --- |
| 核心玩法 | 点击前方无遮挡的箭头，使其飞出棋盘；错误点击消耗生命，清空即通关 | 可做“关卡尝试 / 错点 / 可行动箭头 / 解题效率”分析 |
| 内容规模 | 100 关，平均 23.7 个箭头，目标步数基本等于棋子数，生命固定 3 | 关卡漏斗和难度校准是核心分析对象 |
| 难度分布 | tutorial 1、easy 22、medium 22、hard 45、boss 10 | 后半段 hard 密度高，早期 hard/boss 必须监控 |
| 平台 | Web / Meta Instant Games / Android / iOS Capacitor | 需要按平台拆留存、广告、分享、性能 |
| 变现 | hint / revive / double-reward rewarded placements 已设计，AdMob Android/iOS ID 已回填 | 需要 ad request、completion、impression-level revenue、post-ad progression |
| 当前事件 | 已有 `game_start`、`level_start`、`level_complete`、`level_fail`、`level_blocked_move`、`level_undo`、`rewarded_*`、`share_result_*`、`feedback_open` | 事件骨架可用，但需要统一参数、用户/会话、收入和数据落库 |
| 当前缺口 | GA4 Web runtime、session/attempt 标识和事件字典已补齐；仍缺真实 GA4 Measurement ID、DebugView 账号侧验收和 AdMob impression-level revenue 回传 | 先填入真实 GA4 stream，再做真实数据 QA |

关卡曲线抽样：

| 关卡段 | 平均难度分 | 平均箭头数 | 初始可行动比例 | 结构判断 |
| --- | ---: | ---: | ---: | --- |
| 1-10 | 27.2 | 7.9 | 67.0% | 新手段，但第 5 关 hard、第 10 关 boss 是早期风险点 |
| 11-20 | 35.1 | 10.4 | 57.0% | 继续学习期，第 15 / 20 关继续验证难度门槛 |
| 31-50 | 56.8 | 19.9 | 43.4% | 中段开始形成真实解题压力 |
| 61-100 | 86.9 | 34.9 | 32.1% | 高难长线内容，适合核心玩家和素材展示 |

## KPI 框架

### 北极星指标

**有效回访解题用户数**：安装后完成前 5 关，并在 D1 回访至少开始 1 个关卡的用户数。

这个指标比单纯 DAU 更适合当前阶段，因为它同时要求“理解玩法、完成早期价值体验、愿意回来”。如果只看启动次数，可能会被 closed test 打开任务或广告调试污染。

### 一级指标

| 方向 | 主指标 | 驱动指标 | 护栏指标 |
| --- | --- | --- | --- |
| 新手理解 | 前 1 分钟完成率、前 5 关完成率 | tutorial 完成率、错误点击率、hint 首次使用关卡、首次失败关卡 | 第 1 关失败率、首局退出率 |
| 关卡进度 | L1-L20 逐关进入率 / 完成率 / 流失率 | level fail、retry、undo、blocked move、平均尝试次数 | hard/boss 关异常断崖 |
| 留存 | D1 / D3 / D7 / D30 留存 | 首日最高关卡、首日完成关卡数、session 数、streak 天数 | 短期广告用户留存不低于非广告用户太多 |
| 广告变现 | rewarded completion rate、ARPDAU、D1 LTV | hint request、revive offer、revive completion、ad impression revenue | 广告后退出率、广告失败率、同局重复广告次数 |
| 运营反馈 | closed test 每日活跃测试者、反馈率、问题复现率 | feedback_open、邮件上下文、设备/平台分布 | 数据安全、隐私声明、测试广告使用合规 |
| 商店增长 | store listing conversion、关键词排名、截图点击后安装 | 搜索词、国家/地区、素材版本 | 评分、卸载、崩溃和政策风险 |

## 深度分析任务分类拆解

### P0 数据基础与质量

| 任务 | 分析问题 | 需要补齐的数据 | 输出物 |
| --- | --- | --- | --- |
| 事件字典冻结 | 每个事件名、触发时机、参数是否稳定？ | event name、platform、app_version、user_id、session_id、level_id、difficulty、source | `analytics-event-spec.md` |
| 用户/会话模型 | 如何计算留存、session、关卡尝试？ | anonymous_user_id、install_at、session_start_at、session_index、last_seen_at | `dim_user`、`fact_session` |
| 关卡尝试表 | level_start 到 complete/fail/restart/revive 如何闭环？ | attempt_id、level_id、started_at、ended_at、result、moves、lives_left、hints_used、revives_used | `fact_level_attempt` |
| 广告收入闭环 | rewarded 是否产生收入，是否影响后续通关？ | ad_request、ad_loaded、ad_show、ad_reward、ad_fail、ad_impression、revenue_micros、currency、precision | `fact_ad_impression` |
| QA 看板 | 数据有没有漏、重、时序错、参数缺失？ | event count by version/platform、null rate、duplicate rate、event sequence | 每日数据健康检查 |

首发前验收线：

- `level_start` 必须能关联到后续 `level_complete` / `level_fail` / `restart` / `quit`。
- `rewarded_request` 必须能关联到 `rewarded_complete` / `rewarded_fail`，并记录 placement。
- 每个事件包含 app version、platform、language、level、difficulty、session_id。
- 不采集邮箱、姓名、通讯录等非必要个人信息；反馈邮件只由用户主动发送。

### P1 新手漏斗与早期流失

核心问题：玩家是否在第一次会话里理解“无遮挡箭头可以飞出”？

| 分析任务 | 细分切法 | 决策动作 |
| --- | --- | --- |
| 首局路径分析 | start -> L1 start -> first valid move -> L1 complete -> L2 start -> L5 complete | 判断教程是否需要更强视觉引导 |
| 错点热区 | level_id、piece direction、row/col、blocked_count、move_index | 找出误导性箭头布局或视觉不清楚位置 |
| 前 5 关完成率 | 新用户、平台、语言、设备性能、广告可用性 | 是否调整 1-5 关、提示文案、免费提示 |
| 第 5/6 关门槛 | L4 complete -> L5 start/complete -> L6 start/complete | 判断第 5 关 hard 是否过早 |
| 首次失败归因 | level_id、moves_before_fail、blocked_move_count、available_count_at_fail | 区分“没看懂”与“难度合理” |

建议首发目标：

- 新手 1 分钟完成率：80% 以上。
- 前 5 关完成率：60% 以上。
- 第 6 关进入率：35% 以上。
- 第 1 关失败率：低于 5%；否则优先修教程和可读性。

### P1 关卡难度与内容迭代

核心问题：计算难度分是否符合真实玩家表现？

| 分析任务 | 方法 | 输出 |
| --- | --- | --- |
| 难度分校准 | 把 `scripts/level-tools.mjs` 的 score、startAvailable、avgAvailable 与真实 fail rate / retry rate / time_to_complete 回归对比 | 找出“算法判 easy 但玩家失败高”的关卡 |
| 逐关漏斗 | level_start_users、complete_users、fail_users、quit_users、retry_users | 关卡问题清单 |
| hard/boss 断崖监控 | 重点看 5、10、15、20、30、40、50、60、70、80、90、100 | 决定是否加缓冲关或降低初始阻塞 |
| 三星压力分析 | moves / targetMoves、lives_left、stars | 判断 targetMoves 是否太紧或太宽 |
| 内容分层 | 新手、普通、核心玩家分别最高到达关卡和留存 | 决定 100 关是否需要章节、每日挑战或跳关机制 |

关卡优先巡检名单：

- 早期：1-10 全量，尤其 5、6、10。
- 中期：15、20、25、30、35、40、45、50。
- 后期：70 以后按章节平均表现看，不先逐关微调。

### P1 Rewarded 广告与经济系统

核心问题：广告是否是在“帮玩家继续玩”，而不是在消耗体验？

| 分析任务 | 指标 | 决策 |
| --- | --- | --- |
| hint 需求分析 | hint request rate、completion rate、hint 后完成率、hint 后退出率 | 判断提示奖励是否有效 |
| revive 价值分析 | revive offer view、request、completion、revive 后完成率 | 判断复活是否应该只在 hard/boss 或失败后出现 |
| placement 质量 | hint / revive / double-reward 分别的 eCPM、ARPDAU、completion、fail reason | 保留高价值低伤害点位 |
| 广告对留存影响 | 看过广告 vs 没看广告用户的 D1/D3，按失败次数匹配 | 避免把“高粘性玩家更常看广告”误判为广告导致留存 |
| 收入回传 | impression-level ad revenue、currency、precision、ad unit、platform | 计算 LTV、ROAS、广告频控 |

分析注意：

- 不要只看广告完成率。要看广告后的关卡完成、继续游玩、次日回访。
- Web mock rewarded 只能验证流程，不能作为收入或真实广告体验数据。
- 开发和测试必须使用 test ad unit；真实广告不要在 debug 阶段反复点击。

### P1 留存、回访与运营节奏

核心问题：玩家回来是因为内容推进、日目标、挑战感，还是只是测试任务？

| 分析任务 | 切法 | 动作 |
| --- | --- | --- |
| cohort 留存 | install_date、platform、language、first_session_level_reached | 判断首日体验质量 |
| 首日深度 | first_day_completed_levels、first_day_max_level、first_day_sessions | 预测 D1/D7 |
| streak 有效性 | streak_days、home retention copy exposure、return interval | 判断首页回访文案是否有效 |
| 流失前行为 | last_level、last_result、last_fail_count、last_ad_fail、last_feedback | 形成版本迭代优先级 |
| closed test 运营 | 12 名测试者每日打开、前 10 关完成、失败后反馈 | 满足测试要求并收集真实问题 |

### P2 ASO、商店转化与素材

| 分析任务 | 数据来源 | 决策 |
| --- | --- | --- |
| 商店素材 A/B | Google Play Experiments、截图版本、短描述版本 | 选择首图是否突出“箭头逃脱 / 迷宫路径 / 三星通关” |
| 关键词表现 | Search terms、store listing visitors、installers | 调整 `arrow puzzle, maze puzzle, unblock, logic puzzle` |
| closed test 反馈归类 | 反馈邮件、事件上下文、设备型号 | 首发前只修高频且低风险问题 |
| 评分风险监控 | crash、ad_fail、level_1_fail、feedback complaint | 避免首发评分被理解成本或广告失败拖垮 |

### P2 实验设计

| 实验 | 假设 | 主指标 | 护栏 |
| --- | --- | --- | --- |
| 教程高亮强度 | 更强高亮能降低第 1 关错点 | L1 complete、first valid move time | 不增加首局退出 |
| 第 5 关难度平滑 | 第 5 关 hard 过早会造成流失 | L5 complete、L6 start、D1 | 不降低核心玩家完成后的继续率 |
| hint 免费上限 | 前 5 关免费提示能提高理解 | first 5 complete、hint usage | rewarded request 不过早下降 |
| revive 出现时机 | 只在 hard/boss 展示复活更不打扰 | revive completion、post-revive complete | fail 后退出率不升 |
| 首页回访文案 | 进度/星数/连续天数能提高回访 | D1、next_session_start | 不制造虚假任务感 |
| 视觉路径提示 | SVG 路径更清晰能降低错点 | blocked_move_rate、time_to_first_move | 低端机帧率和加载时间 |

实验样本不足时，先用 closed test 定性 + 事件方向信号，不做过度显著性解释。

### P2 性能与稳定性

| 分析任务 | 事件/数据 | 动作 |
| --- | --- | --- |
| 首屏性能 | app_start、first_render、first_interaction、device_memory、render_quality | 低端机默认 balanced/low |
| 棋盘性能 | level_id、piece_count、render_quality、frame_drop、input_latency | 找出后期密集关卡渲染瓶颈 |
| 广告失败 | placement、platform、sdk state、fail reason | 区分无广告、未加载、用户关闭、SDK 错误 |
| 崩溃和卡死 | crash、unhandled_error、last_event | 首发稳定性回归 |

## 推荐事件与数据模型

### 事件补充建议

现有事件保留，并补充这些事件：

| 事件 | 触发 | 关键参数 |
| --- | --- | --- |
| `session_start` | 每次有效会话开始 | session_id、session_index、days_since_install、streak_days |
| `tutorial_step` | 教程曝光、首步点击、完成 | step、level_id、time_since_level_start |
| `level_quit` | 玩到一半回首页、退出、切后台超时 | level_id、attempt_id、moves、remaining_pieces |
| `level_restart` | 点击重开 | level_id、attempt_id、moves、lives_left、source |
| `piece_tap` | 采样或仅错误点击全量 | piece_row、piece_col、dir、is_clear、move_index、available_count |
| `ad_impression` | 广告曝光收入回传 | placement、ad_unit、revenue_micros、currency、precision、network |
| `performance_sample` | 首屏和密集关卡 | render_quality、piece_count、fps_bucket、input_latency_ms |
| `privacy_consent_status` | 广告/分析同意状态变化 | consent_required、can_request_ads、region |

### 事实表

| 表 | 粒度 | 用途 |
| --- | --- | --- |
| `fact_event` | 每个事件 | 原始审计、回放漏斗 |
| `fact_session` | user + session | 留存、时长、回访 |
| `fact_level_attempt` | user + level + attempt | 关卡完成率、失败、重试、hint/revive 效果 |
| `fact_ad_impression` | 每次广告曝光 | eCPM、ARPDAU、LTV、placement 质量 |
| `dim_level` | 每个关卡 | 关联计算难度分、棋子数、初始可行动比例 |
| `user_day` | user + date | DAU、D1/D7、每日关卡推进 |
| `fact_feedback` | 每次反馈 | 反馈问题分类、事件上下文关联 |

## 外部调研要点

| 来源 | 与 Arrow Again 相关的结论 | 应用方式 |
| --- | --- | --- |
| Google Analytics recommended events | 游戏推荐事件包含 `level_start`、`level_end`、`tutorial_begin`、`tutorial_complete`、`unlock_achievement`；通用推荐事件包含 `ad_impression` | 当前事件应对齐 GA4 命名或做映射，方便进入游戏报告 |
| GameAnalytics 2026 Mobile & PC Gaming Benchmarks | 行业基准主要围绕 D1/D7/D30 retention、playtime、session behavior、区域表现 | 用它作为留存/会话对标框架，不直接照搬未验证的数值目标 |
| AdMob rewarded ads docs | rewarded ads 是用户为了获得应用内奖励而主动观看的广告；开发阶段应使用测试广告 ID | hint / revive 符合 rewarded 场景，但要监控广告后退出和通关提升 |
| AdMob impression-level ad revenue | SDK 可在广告曝光时回传 revenue，用于 LTV 和下游分析；Android/iOS 需要在 AdMob UI 开启并满足 SDK 版本要求 | 首发后要尽快接入，否则无法评估 LTV/ROAS |
| Google Play testing requirements | 新个人开发者账号生产发布前需要至少 12 名测试者连续 14 天 opt-in closed test | closed test 运营任务应被当作数据采样项目，而不是纯提审流程 |
| Google Play Data safety | closed/open/production testing 轨道也需要完成 Data safety 表单；即使不收集用户数据也要提供表单和隐私政策 | 接入 analytics / ads 后必须同步复核隐私政策和 Data safety |
| Apple App Privacy | 使用会跨 app 组合数据用于广告定向或广告效果衡量的第三方 SDK，需要按 Apple 隐私要求披露 | iOS 接 AdMob/Meta/analytics 前要先做数据项清单 |

参考链接：

- Google Analytics recommended events: https://support.google.com/analytics/answer/9267735
- GameAnalytics 2026 Mobile & PC Gaming Benchmarks: https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks
- AdMob rewarded ads Android: https://developers.google.com/admob/android/rewarded
- AdMob rewarded ads iOS: https://developers.google.com/admob/ios/rewarded
- AdMob impression-level ad revenue Android: https://developers.google.com/admob/android/impression-level-ad-revenue
- Google Play testing requirements: https://support.google.com/googleplay/android-developer/answer/14151465
- Google Play Data safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/

## 14 天 closed test 数据计划

| 阶段 | 目标 | 每日检查 | 产出 |
| --- | --- | --- | --- |
| Day 0 | 事件 QA 和测试包验证 | 事件是否触发、参数是否全、广告测试流是否可跑 | 数据 QA checklist |
| Day 1-3 | 新手理解 | L1-L5 完成、首次错点、首次失败、反馈问题 | 教程和早期关卡修复单 |
| Day 4-7 | 难度门槛 | 第 5/6/10/15 关完成和流失、hint/revive 使用 | 关卡调整建议 |
| Day 8-10 | 广告与体验 | rewarded request/complete/fail、广告后退出、广告后通关 | 广告点位策略 |
| Day 11-14 | 留存与稳定 | D1/D3、每日回访、崩溃/卡顿、反馈闭环 | 发布前 go/no-go 报告 |

## 优先级路线图

### 首发前

1. 在 GA4 创建或复用 Web stream，并设置 `VITE_GA_MEASUREMENT_ID`。
2. 用 `VITE_GA_DEBUG=true` 在 DebugView 验证 session、level attempt、rewarded flow。
3. 做 closed test 看板：新手漏斗、关卡漏斗、广告漏斗、反馈列表。
4. 校验 Data safety / 隐私政策 / Apple privacy 数据项。

### 首发后 1-2 周

1. 用真实用户数据校准 1-20 关。
2. 判断第 5 关 hard 和第 10 关 boss 是否需要顺滑。
3. 评估 hint / revive 的真实完成、收入、留存影响。
4. 基于反馈和事件决定第一轮版本更新。

### 首发后 1-2 月

1. 做 ASO 素材和关键词实验。
2. 引入章节目标、每日挑战或轻量任务，提升 D7。
3. 接入 impression-level ad revenue，建立 LTV 和 ROAS。
4. 按核心/普通/新手玩家分层设计后续关卡和广告频控。

## 需要避免的误判

- closed test 用户有任务驱动，不能直接代表自然用户留存。
- 看广告用户往往本身更投入，需要用失败次数、到达关卡、session 深度做匹配后再比较。
- 关卡 fail rate 高不一定是关卡坏，可能是视觉可读性、触控、广告失败或教程问题。
- 收入数据没有 impression-level revenue 时，只能做广告流程分析，不能做可靠 LTV。
- 接入广告和 analytics 后，隐私政策、Data safety、Apple privacy 必须随真实数据流更新。

## 建议下一步

把真实 GA4 Measurement ID 写入 `VITE_GA_MEASUREMENT_ID` 后运行 `npm run verify:analytics`，再用 `VITE_GA_DEBUG=true` 做 DebugView 验收；随后开始 14 天 closed test 数据采集。
