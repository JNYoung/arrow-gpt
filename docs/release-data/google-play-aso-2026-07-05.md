# Arrow Again ASO Pack

Date: 2026-07-05

## Scope

This pack optimizes the current Google Play listing for `com.arrowagain.game`, with App Store metadata prepared for a later iOS release.

Primary goals:

- Improve search relevance for arrow puzzle, tap puzzle, maze puzzle, and logic puzzle intent.
- Keep the listing policy-safe: no competitor names, rankings, price claims, or keyword blocks.
- Make the first screenshot sequence explain the core loop in under 5 seconds.
- Prepare en-US as the default listing and zh-CN as the first localized listing.

Applied to Google Play Console on 2026-07-05:

- en-US listing text updated and verified.
- zh-CN listing text added and verified.
- en-US phone screenshots replaced with the four ASO screenshots listed below.
- Android Publisher edit `15827034863620817858` validated and committed successfully.

## Official Constraints

Google Play:

- App name: 30 characters or less.
- Short description: 80 characters or less.
- Full description: 4000 characters or less.
- Avoid excessive keyword repetition, misleading claims, price/ranking claims, and irrelevant references to other apps.
- Screenshots should show real in-app experiences; if screenshots contain text, provide localized screenshots for each supported language.

App Store:

- App name and subtitle should stay within App Store Connect limits.
- Keywords are limited to 100 characters total, separated by commas without spaces.
- Do not repeat words already present in the app name, subtitle, or category.

Sources:

- Google Play store listing setup: https://support.google.com/googleplay/android-developer/answer/9859152
- Google Play store listing best practices: https://support.google.com/googleplay/android-developer/answer/13393723
- Google Play preview assets: https://support.google.com/googleplay/android-developer/answer/9866151
- Apple product page keywords: https://developer.apple.com/app-store/product-page/

## Keyword Strategy

Observed market language on 2026-07-05:

- Common high-intent phrases: `arrow puzzle`, `tap puzzle`, `tap away`, `puzzle escape`, `maze puzzle`, `logic puzzle`, `brain puzzle`, `unblock puzzle`.
- Common conversion themes: clear the board, tap in the right order, open path, no timer, relaxing brain challenge, spatial thinking.
- Avoid: competitor app names, `#1`, `best`, `free`, download-count claims, and dense keyword lists.

Priority mapping:

| Priority | Keywords | Placement |
| --- | --- | --- |
| P0 | `tap puzzle`, `arrow`, `maze`, `logic puzzles` | Title, short description, first paragraph |
| P1 | `arrow puzzle`, `tap away`, `puzzle escape`, `brain puzzle` | Full description and screenshot captions |
| P2 | `unblock`, `route`, `grid`, `spatial thinking`, `relaxing` | Full description, App Store keywords |

## Google Play en-US

App name:

```text
Arrow Again: Tap Puzzle
```

Character count: 23 / 30

Short description:

```text
Tap arrows in order, clear the maze, and solve quick logic puzzles.
```

Character count: 67 / 80

Full description:

```text
Arrow Again: Tap Puzzle is a quick logic game about clearing arrows from a maze-like board.

Look for arrows with an open route, tap them out, and create space for the next move. Later levels add tighter paths, limited hearts, undo, hints, and boss boards that reward careful order planning.

Why play:
- Simple one-tap controls with clear path feedback
- 100 portrait levels for short breaks
- No timer; solve each board at your pace
- Hearts, stars, undo, hints, and revive options
- Readable arrow routes designed for phone screens
- Local progress you can continue anytime

If you enjoy arrow puzzle games, tap away puzzles, maze escape games, unblock puzzles, and calm brain teasers, Arrow Again gives you a clean board-clearing challenge one level at a time.
```

Suggested tags:

```text
Puzzle, Logic, Casual
```

## Google Play zh-CN

App name:

```text
箭了又箭：箭头解谜
```

Short description:

```text
按顺序点击箭头，避开遮挡路线，解开轻松又烧脑的迷宫谜题。
```

Full description:

```text
箭了又箭是一款竖屏箭头迷宫解谜游戏，适合碎片时间来一局。

观察棋盘上的箭头路线，找到没有被遮挡的出口，按正确顺序点击箭头，让它们一步步飞出棋盘。后面的关卡会出现更密集的路线、有限生命、撤销、提示和 Boss 关，需要你提前规划每一步。

游戏特色：
- 单手点击操作，上手简单
- 100 个竖屏关卡，节奏短而清晰
- 无倒计时压力，按自己的节奏思考
- 生命、星级、撤销、提示和复活机制
- 箭头路径清楚，适合手机屏幕游玩
- 本地保存进度，随时继续挑战

如果你喜欢箭头解谜、迷宫逃脱、Tap Away、逻辑谜题、休闲益智和烧脑小游戏，箭了又箭会给你一套轻松但需要规划的清场挑战。
```

## App Store Draft

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

Character count: 82 / 100

## Screenshot Set

New en-US ASO screenshots:

| Order | File | Job |
| --- | --- | --- |
| 1 | `docs/assets/aso/en-us/phone-01-home.png` | Brand + one-screen promise. |
| 2 | `docs/assets/aso/en-us/phone-02-tutorial.png` | Explain tap-to-clear in one glance. |
| 3 | `docs/assets/aso/en-us/phone-03-level-36.png` | Show later puzzle density and strategy. |
| 4 | `docs/assets/aso/en-us/phone-04-result.png` | Show completion, stars, and next-level loop. |

Recommended next screenshot work:

1. Add a fifth screenshot from a failed/blocked move state after the next asset pass: `Think before you tap`.
2. Generate zh-CN localized screenshots from the same four states.
3. Keep the old `releases/google-play/screenshots/phone-01-home.png` out of the active listing because it contains the older bilingual title.

## First Experiment Backlog

Run only after the app has enough listing traffic for readable results.

| Experiment | Variant A | Variant B | Success metric |
| --- | --- | --- | --- |
| Short description | Tap arrows in order, clear the maze, and solve quick logic puzzles. | Plan each tap, clear every arrow, and solve relaxing maze puzzles. | Store listing conversion rate |
| First screenshot | Home promise | Tutorial board | Store listing conversion rate |
| Screenshot order | Home, tutorial, dense, result | Tutorial, dense, result, home | Store listing conversion rate |

## Measurement

Track weekly:

- Google Play search terms and store listing visitors.
- Store listing acquisitions and conversion rate.
- Country/language split for en-US vs zh-CN.
- First-session funnel: `game_start`, `level_start`, `level_complete`, `level_fail`.
- Store-to-game quality: installs that reach level 3 and level 10.

Update ASO only after at least one meaningful signal changes: keyword impressions, conversion rate, first-level completion, or review language.
