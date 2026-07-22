# Google Play production access application

Date: 2026-07-14

Status: submitted manually in Google Play Console on 2026-07-14 and subsequently granted. Android Publisher API confirmed a completed production release on 2026-07-22. The final wording saved by Play Console is the source of truth.

## Evidence boundary

- Closed testing is complete.
- Testers were recruited voluntarily through the Arrow Again Google Group and developer mutual-testing communities.
- No paid testing service was used.
- Confirmed feedback themes: game difficulty, interface design, and a visual direction better suited to the US market.
- Do not cite Google Analytics user counts in this application. The inspected property contains events from other apps and is not reliable evidence for Arrow Again tester activity.
- Do not invent daily-active, retention, session-count, or completion-rate figures.

## Part 1 — About the closed test

### How did you recruit users for your closed test?

```text
We recruited voluntary testers through the Arrow Again Google Group and developer mutual-testing communities. No paid testing service was used. Testers joined the group, opted in through Google Play, installed the closed-test build, and tested on their own Android devices.
```

### Describe the engagement you received from testers during your closed test

```text
Testers exercised the main game loop on Android: starting and clearing levels, handling blocked moves and limited hearts, using hints, undo, restart and revive, changing language, and resuming saved progress. Discussion focused on difficulty, interface clarity, and visual fit for US puzzle players.
```

### Summarize the feedback you received from testers and how you collected it

```text
We collected feedback through the tester group and mutual-testing communities, then followed up on reported issues. Testers wanted a smoother difficulty curve, clearer interface and blocked-path guidance, and a visual presentation better suited to the US puzzle market.
```

## Part 2 — About the game

### Who is the intended audience?

```text
Casual puzzle players aged 13+ who enjoy short portrait-mode logic games, tap-away puzzles, maze puzzles, and route-planning challenges. The game is designed for English-speaking and Chinese-speaking phone users who prefer calm play without a countdown timer.
```

### What makes the game stand out?

```text
Arrow Again combines clear one-tap rules with order-based arrow mazes, limited hearts, undo, hints, revive options, boss boards, and 100 portrait levels. There is no countdown timer, so players can study each board and solve at their own pace while still planning every move carefully.
```

### How many installs do you expect in the first year?

Recommended selection:

```text
0–10,000
```

Rationale: this is an independent launch without paid user acquisition. If the Play Console presents different ranges, select the lowest range that includes 10,000 installs.

## Part 3 — Production readiness

### What changes did you make based on what you learned during the closed test?

```text
Based on feedback, we reviewed the difficulty curve, clarified blocked-move and heart-loss guidance, simplified the home and game screens, improved board depth and contrast, and refined English branding, store copy and screenshots for US puzzle players. We retained calm, no-timer play.
```

### How did you decide that the game is ready for production?

```text
The signed AAB passed our Android release gate, signing checks and real-device smoke tests. We tested level completion, blocked moves, hints, undo, restart, revive, language, save/resume and return-to-app flows. Privacy, support, data-deletion and app-ads.txt URLs are live over HTTPS.
```

## Console submission notes

- The developer confirmed that the application was submitted manually on 2026-07-14.
- Answer in English because the primary listing and launch market are en-US.
- Every free-text answer above is 300 characters or fewer.
- Keep the statements above factual if the Console wording changes.
- Production access is granted. The rebuilt and re-verified API 36 AAB `1.0.4 (6)` is the completed production release as of 2026-07-22.
