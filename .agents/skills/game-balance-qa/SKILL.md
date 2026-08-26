---
name: game-balance-qa
description: Balance, test and validate Web/H5 games. Use for combat values, economy, difficulty curves, progression pacing, gameplay QA, functional QA, test cases, regression plans, browser/device testing, exploit checks, acceptance criteria, or deciding whether a build is actually shippable.
---

# Game Balance / QA

## Separate Two Things

### Functional QA
功能有沒有壞。

### Gameplay QA
功能沒壞但是否：
- 無聊
- 看不懂
- 太慢
- 無決策
- 失衡

兩者分開。

## Balance

列出關鍵變數：

- player power
- enemy HP
- enemy damage
- spawn
- reward
- upgrade cost
- cooldown
- duration

## Experience First

先說：
某一關要讓玩家感受什麼。

再調數字。

不要先做 Excel 再找理由。

## Dominant Strategy

檢查：

- 一種 build 永遠最好？
- 某資源沒意義？
- 某升級必買？
- 能無限套利？
- 能 AFK 過關？

## Difficulty

每階段：

- new concept
- pressure
- expected behavior
- recovery

不要只加 HP。

## QA Matrix

### Gameplay
- start
- win
- lose
- restart
- pause
- resume
- fast repeat

### Input
- rapid tap
- drag
- multitouch
- disabled
- focus

### Lifecycle
- refresh
- background
- foreground
- scene reload

### Layout
- normal
- ultra-wide
- tall
- resize
- orientation
- safe area

### Network
如果有：
- slow
- timeout
- disconnect
- duplicate
- retry

### Storage
如果有：
- first run
- empty
- corrupt
- migration
- write fail

## Test Case

用：

Given
When
Then

## Ship Gate

只允許：

- PASS
- PASS WITH ISSUES
- FAIL

附理由。

## Final Gate

- full win flow tested
- full lose flow tested
- restart repeatedly
- extreme input
- multiple ratios
- no obvious dominant strategy
- player knows next action
- no feature that works technically but feels broken
