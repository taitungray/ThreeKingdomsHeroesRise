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

## Player Blind Test

功能 QA 通過後仍要安排 15–30 分鐘真人盲測：不提供操作說明，記錄 10 秒下一步、第一分鐘決策、第一次停頓／誤點／跳字／無聊的時間碼，以及能否獨立完成養成→戰鬥→Boss→勝敗→再戰。

至少覆蓋空帳號、中期帳號、零資源與含鎖定角色狀態。AI 或同一製作者的角色推演只能標記「角色模擬審查」，不可冒充真人盲測。

## Evidence Rule

自動化、瀏覽器視覺、真人盲測、企劃、美術／UI 與 Android 實機是不同證據，不互相代替。任一 P0／P1、核心流程看不懂／不好玩或必要證據缺失，Ship Gate 為 FAIL。

## Live Event QA

活動至少測試開始前一秒、開始時、結束前一秒、結束時、補領期、不同時區、背景／前景、重整、斷線／重試、快速連點、回呼重送、領取後重載與活動結束後入口處理。

逐一驗證 preview、open、locked、insufficient、completed、claimed、sold out、ended、loading、error、offline 與 retry（適用者），並檢查獎勵只發一次、進度與文案一致、倒數來源可靠。

任何重複發獎、錯誤時間、結束後仍能操作、假狀態、缺少 fallback 或只在單一尺寸通過，活動判定為 FAIL。
