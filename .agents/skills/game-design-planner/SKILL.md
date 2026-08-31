---
name: game-design-planner
description: Design or improve web-game mechanics, core loops, combat rules, progression, levels, economy, quests, rewards, retention, rewarded ads, difficulty curves and MVP scope. Use when creating gameplay systems or diagnosing why a game feels boring, repetitive, unclear or unbalanced.
---

# Game Design Planner

## Goal

每一個系統都要回答：

**玩家會因此做出什麼有趣決策？**

如果沒有決策，只增加按鈕、數值或等待，
就不是優先玩法。

## Core Model

定義：

- Player Verb
- Objective
- Constraint
- Decision
- Feedback
- Reward
- Failure
- Mastery

## Core Loop

必須短到可以一行表達。

範例：

`選單位 → 放置 → 戰鬥 → 得資源 → 升級/合成 → 面對下一波`

## Decision Density

檢查每 30 秒：

- 有幾次真正選擇？
- 選錯有沒有代價？
- 是否只有唯一最佳解？
- 是否需要觀察局勢？
- 是否大量時間只是等待？

若等待過多：
優先縮短節奏，而非增加更多 UI。

## Progression

分離：

- In-session
- Run
- Permanent

先證明 session 好玩，再做大量永久養成。

## Level Design

增加難度優先使用：

- 新敵人行為
- 新組合
- 時間壓力
- 空間限制
- 資源壓力
- 策略要求

避免只靠 HP / Damage 倍率。

## Economy

每種資源都定義：

- Source
- Sink
- Purpose
- Scarcity
- Inflation Risk

沒有用途的貨幣刪除。

## Rewarded Ads

廣告必須是可選增益。

每一個廣告點說明：

- 玩家為什麼想看
- 不看是否仍可正常玩
- 頻率上限
- 是否破壞節奏

禁止用刻意做壞遊戲體驗逼玩家看廣告。

## Output

### Gameplay Pillars
最多 3 個。

### Core Loop

### Mechanics
每個：
- Rule
- Decision
- Feedback
- Tradeoff

### Progression

### Difficulty

### Economy

### MVP

### Gameplay Risks

## Gate

- 一句話可以說懂嗎？
- 有反覆出現的有趣決策嗎？
- 有清楚成功 / 失敗嗎？
- 有立即 feedback 嗎？
- 有沒有純數值假成長？
- 新系統真的增加玩法嗎？

## Senior Planning Review

逐畫面與系統獨立輸出 Keep／Remove／Simplify／Fix，檢查唯一主要任務、下一步、重複入口、無決策資訊、等待時間、唯一最佳解、無意義資源與純數值假成長。

審查必須連回實際玩家證據：10 秒內是否知道下一步、第一分鐘是否有真正決策、失敗後是否理解原因。若沒有真人盲測，標記缺少證據，不以企劃推論補成 PASS。

優先驗收第一章垂直切片；範圍外功能做 Hide／Lock 決策，不用更多 UI 掩蓋核心循環問題。

## Live Event Planning Gate

活動頁開始設計前，先定義玩家目標、核心操作、參與理由、起訖／補領時間與時區、任務條件、進度算法、獎勵表、領取上限、資源來源／消耗，以及不參加活動的正常路徑。

活動必須增加可理解的玩法或選擇，不能只是換皮登入、假倒數、假排行或更多領取按鈕。後端、時間來源、獎勵與防重複機制未成立時，入口必須 Hide 或誠實 Lock。

企劃輸出需涵蓋 preview／open／locked／completed／claimed／ended／catch-up、首次／中期／錯過玩家與活動結束後資料處理，並交給 UI 與 QA 建立對應狀態和案例。
