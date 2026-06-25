# Arrow Again Growth 指标框架

Updated: 2026-06-25

本方案把 `generic-growth-metrics-integration-template.md` 套到 Arrow Again。当前目标不是从低样本封测里挖“神奇结论”，而是建立一条能稳定判断增长断点的数据链：

```text
商店/素材承诺 -> 打开游戏 -> 开始关卡 -> 完成/失败/退出 -> 奖励广告/分享/反馈 -> 次日或多日回访
```

## 1. 当前增长命题

```text
哪一种商店截图 / 广告素材 / 入口承诺，能带来完成首个有效关卡、继续挑战，并在广告不伤体验的情况下产生回访或变现信号？
```

当前阶段：

- 业务名称：Arrow Again
- 业务类型：休闲益智关卡游戏，Web / Meta / Google Play / iOS 容器
- 当前阶段：封测 / 新版本发布 / 数据链路搭建
- 主要渠道：Google Play、自然访问、未来小预算广告、分享入口
- 本阶段最重要决策：首屏承诺是否清楚、早期关卡是否卡人、奖励广告是否可用且不伤害留存

## 2. 模板补充

通用模板已经覆盖来源、激活、转化、留存和 Go / Hold / Stop，但用于休闲关卡游戏还需要补三块：

| 缺口 | Arrow 补充 |
| --- | --- |
| 游戏核心循环不只是一次 conversion | 用 `level_start -> level_end -> level_complete/level_fail -> next session` 表示核心循环 |
| 关卡难度本身是增长变量 | 按 `level_id`、`difficulty`、`moves`、`lives`、`blocked_move` 拆分，避免把设计问题误判成渠道问题 |
| 广告是护栏也是收入路径 | 当前以 `rewarded_request/complete/fail` 判断可用性；收入优化等 `ad_impression` / ILRD 接入后再做 |

## 3. 北极星与 KPI

北极星指标：

| 指标 | 口径 | 原因 |
| --- | --- | --- |
| 有价值关卡活跃用户 | 7 天内至少完成 1 个关卡，并出现继续挑战、分享、反馈或奖励广告意图的用户 | 同时代表核心玩法、留存意愿和业务价值 |

本阶段主 KPI：

| KPI | 分子 | 分母 | 窗口 | 数据源 | 修改目标 |
| --- | --- | --- | --- | --- | --- |
| 开始关卡率 | `level_start` 用户数 | `game_start` 用户数 | 日 / 72 小时 | GA4 | 首页 CTA、默认关卡、商店承诺 |
| 关卡结束率 | `level_end` 用户数 | `level_start` 用户数 | 日 / 72 小时 | GA4 | 关卡时长、退出路径、性能 |
| 通关率 | `level_complete` 用户数 | `level_end` 用户数 | 日 / 72 小时 | GA4 | 难度、箭头可读性、目标步数 |
| 奖励广告完成率 | `rewarded_complete` | `rewarded_request` | 日 / 7 天 | GA4 / AdMob | 广告可用性、奖励价值、失败提示 |
| 早期回访 | D1 cohort；未接 cohort 前看次日 `session_start` by cohort | cohort | GA4 / 平台 | 回访理由、进度反馈、关卡节奏 |

护栏指标：

| 护栏 | 口径 | 触发动作 |
| --- | --- | --- |
| 关卡挫败 | `level_fail / level_start`、`level_quit / level_start`、`level_blocked_move / level_start` | 先改早期关卡可读性，不急着改渠道 |
| 广告过载 | `rewarded_fail / rewarded_request`、广告后 `level_end` / 回访下降 | 修广告可用性和奖励说明，不加广告频次 |
| 反馈风险 | `feedback_open / game_start` | 读真实反馈，再判断是不是 bug、难度或广告问题 |
| 数据质量 | GA local checks、Data API 权限、事件字典一致性 | 数据不可信时 Hold，不放量 |

## 4. 最小事件闭环

| 增长问题 | Arrow 事件 | 必备参数 |
| --- | --- | --- |
| 用户从哪里来 | 所有事件公共参数 | `traffic_source`、`traffic_campaign`、`traffic_content`、`creative_id` |
| 是否进入核心体验 | `game_start`、`level_start` | `source`、`level_id`、`difficulty` |
| 是否完成关键行为 | `level_end`、`level_complete`、`level_fail` | `success`、`moves`、`lives`、`elapsed_ms`、`target_moves` |
| 是否重复使用 | `session_start`、cohort 留存 | `session_index`、`days_since_install`、`streak_days` |
| 是否产生业务价值 | `rewarded_request`、`rewarded_complete`、未来 `ad_impression` | `placement`、`reason`、未来 revenue 字段 |
| 是否有传播/反馈 | `share_result_*`、`feedback_open` | `won`、`stars`、`moves`、`feedback_count` |

## 5. 归因规范

所有外部入口都应带：

```text
utm_source=<channel>
utm_medium=<organic|paid|shorts|store>
utm_campaign=<batch>
utm_content=<asset_or_message>
creative_id=<channel>_<yyyymmdd>_<angle>_<variant>
```

示例：

```text
?utm_source=youtube&utm_medium=shorts&utm_campaign=launch_learning_202606&utm_content=level_clear_hook_a&creative_id=yt_20260625_clear_path_a
?utm_source=google_play&utm_medium=store&utm_campaign=listing_exp_01&utm_content=screenshot_easy_controls&creative_id=gp_20260625_screenshot_easy_a
```

实现要求：

- UTM / `creative_id` 本地保存 30 天。
- 所有 GA gameplay events 自动携带归因字段。
- GA4 里注册 `creative_id`、`traffic_source`、`traffic_campaign`、`traffic_content` 为 event-scoped custom dimensions。
- 点击率、安装量不能单独判胜，必须看 `level_start`、`level_end`、留存和护栏。

## 6. Go / Hold / Stop

Go：只在以下条件基本满足后扩大测试流量。

- GA/Firebase 本地链路和 Data API 读取都通过。
- `creative_id` 能在 GA4 中按事件拆分。
- `level_start / game_start >= 60%`。
- `level_end / level_start >= 70%`。
- 早期关卡 `level_complete / level_end` 没有明显低于预期，且 `level_quit` 不异常。
- `rewarded_complete / rewarded_request >= 60%`，或明确暂不以广告变现为主。
- 至少一个来源或素材连续 2-3 个观察窗口带来更好的下游行为。

Hold：保持小样本学习。

- 本地链路完整，但 GA API 权限或网络暂不可读。
- 有开局/关卡数据，但 cohort、Play Console acquisition 或 custom dimensions 缺失。
- 样本低于 30 个新用户 cohort，只看方向不放量。

Stop：暂停素材、入口或广告改动。

- 只提升点击/打开，不提升 `level_start` 或 `level_end`。
- 通关率改善但 `feedback_open`、退出或广告失败明显变差。
- 两轮实验后核心断点没有改善。
- 数据口径不可信，例如事件缺失、归因字段丢失、GA 读取长期失败。

## 7. 72 小时实验队列

### 实验 A：商店首图 / 素材承诺

假设：如果首图和素材从“抽象箭头益智”改成“点击无遮挡箭头飞出棋盘”的具体动作承诺，则 `level_start / game_start` 会提升。

主指标：`level_start / game_start` by `creative_id`

护栏：`level_end / level_start` 不下降；`feedback_open / game_start` 不上升。

### 实验 B：早期关卡可读性

假设：如果前 3 关降低视觉歧义、强化可点击箭头，则 `level_blocked_move / level_start` 和 `level_fail / level_start` 会下降。

主指标：`level_complete / level_end`

护栏：过关太快但 D1 不升时，不继续降难度。

### 实验 C：奖励广告价值

假设：如果 hint / revive 的奖励说明更清楚，则 `rewarded_complete / rewarded_request` 会提升，并且不会拉低关卡完成率。

主指标：`rewarded_complete / rewarded_request`

护栏：`level_end / level_start`、D1 cohort、`feedback_open / game_start`。

## 8. 每日监控命令

```bash
npm run ga:daily
npm run growth:verify
```

`ga:daily` 负责 GA/Firebase 链路和数据读取；`growth:verify` 负责检查本框架、归因字段、核心漏斗事件和监控命令是否仍然对齐。

日报只输出 5 件事：

1. 当前最大断点。
2. 证据来自本地链路、GA API 还是只能算假设。
3. 本轮改哪个触点：素材、首页、关卡、广告或反馈。
4. 用哪个指标判断继续/停止。
5. 下一个 72 小时只跑哪个实验。
