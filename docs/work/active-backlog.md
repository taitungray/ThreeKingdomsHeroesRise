# 目前工作清單

狀態：ACTIVE。這是唯一的進行中待辦清單，只放「尚未完成、需要採取行動」的工作。產品方向與階段依 [全遊戲調整計畫](game-adjustment-plan.md)，UI 逐畫面修正與產圖契約依 [UI 全面修正與資產產圖規格](ui-remediation-and-asset-plan.md)，已發生缺陷的細節與證據在 [已知問題](../issues/known-issues.md)，測法在 [QA 測試矩陣](../qa/qa-test-matrix.md)。

## 狀態與優先級

- `READY`：可在本專案直接開始。
- `IN PROGRESS`：已有實作正在進行；同時只能有少量項目。
- `BLOCKED`：缺外部帳號、正式資產、法務資料或必要決策。
- `P0`：阻擋核心品質或發布；`P1`：重要但不先於 P0；`P2`：核心穩定後再做。

完成的工作不長期留在本檔。通過驗收後更新目前規格或關閉問題，再從此清單移除；歷史由 Git 保存。

## 下一個可玩版本目標

目標：完成「第一章垂直切片」。在此目標達成前，不擴充第 9 名以上武將、後續章節、第二個副模式或新的營運入口。

完成定義：空帳號可完成 10 關；8 名英雄、3 種普通敵人、1 精英與 2 Boss 的完整生命週期通過；編隊位置、戰法與裝備提供真實選擇；基準尺寸無視覺硬錯誤；source、`www` 與 Android 核心流程有可重現證據。

## P0-A — 先鎖範圍與戰鬥可信度

| ID | 工作 | 對應問題 | 狀態 | 完成條件 |
|---|---|---|---|---|
| WORK-000 | 鎖定垂直切片角色、敵人、武器、關卡與可見入口 | — | READY | 切片資產表、owner、依賴與驗收案例完整；範圍外入口隱藏或明確未開放 |
| WORK-001 | 重製攻擊圖集，確保每格都有完整 body、可辨識細節、乾淨 alpha 與不同階段 | COMBAT-002、COMBAT-004、COMBAT-009 | IN PROGRESS | 59 張 96px `v3` 為基線（覆蓋全 50 名名將、5 類敵軍、4 名 Boss）；劉備／關羽／張飛／趙雲已建立 128px `v4` 試製並通過外緣髒色帶 gate；仍需固定尺寸五階段、八方向人工驗收與其餘武將唯一外觀 |
| WORK-002 | 重製切片戰鬥兵器與逐角色／方向 socket | COMBAT-005 | IN PROGRESS | 比例、握點、尖端、方向、攻擊與死亡均無漂浮、斷裂或穿模 |
| WORK-003 | 建立普通敵人、敵將與 Boss 的單一身分／資產映射 | COMBAT-003、COMBAT-009、DATA-001 | IN PROGRESS | 全 59 個戰鬥單位（名將、敵軍、Boss）正常路徑已改全身 96px v3 並將身分 alias 持久化於 manifests，預覽與實戰一致 |
| WORK-004 | 修正移動、攻擊、受擊、死亡與移除的單一渲染生命週期 | COMBAT-002、COMBAT-006、COMBAT-008、COMBAT-009 | IN PROGRESS | runtime 依身份抽取 96px v3 或首四將 128px v4 的四幀 move／五階段 attack，死亡清 action 並支援死亡淡出繪製（useDeadSprite），正常路徑禁用肖像 bust；仍需我方／敵人／Boss 全狀態矩陣 |
| WORK-005 | 重整戰鬥 HUD、技能喊話與 Boss／結算覆蓋層 | COMBAT-001、UI-004 | IN PROGRESS | 三秒內辨識敵我與波次；中央最多一層；資源、對話與 VFX 不遮戰鬥 |
| WORK-006 | 移除全畫面 shake，建立 reduced-effects 行為 | MOTION-001 | IN PROGRESS | reduced motion 下無全畫面位移；結果與戰鬥時間不變 |
| WORK-007 | 跑完完整戰鬥生命週期回歸 | QA-001 | IN PROGRESS | boot、三波、Boss、勝、敗、重試、存檔、背景恢復、death／removed 與 console 全通過 |

## P0-B — 建立真實選擇與可用介面

| ID | 工作 | 對應問題 | 狀態 | 完成條件 |
|---|---|---|---|---|
| WORK-008 | 解耦面板與自動推關並重整命令面板表面 | UI-001、UI-002、UI-003、UI-005 | IN PROGRESS | 開啟面板不被 stage transition 關閉；無對角線、`undefined`、截斷或內部英文標籤 |
| WORK-009 | 實作可編輯 3×3 編隊位置與站位說明 | GAMEPLAY-001 | IN PROGRESS | 可點選／拖曳換位；保存／重載正確；至少兩種站位有可重現戰果差異 |
| WORK-010 | 將戰法改為每場攜帶一個並加入關卡情報 | — | READY | 三個戰法不可同時常駐；選擇會改變戰鬥且有清楚預覽／回饋 |
| WORK-011 | 建立裝備擁有、掉落、比較與戰場武器關係 | ECON-001、COMBAT-005 | IN PROGRESS | 不再免費輪換全部裝備；取得、換裝、保存、重載與戰場外觀一致 |
| WORK-012 | 重製第一章 10 關的命名、敵陣、節奏與獎勵 | CONTENT-001 | IN PROGRESS | 章名、關名、敵人與 Boss 一致；每關目的、首勝／重複獎勵與失敗提示可核對 |
| WORK-013 | 建立垂直切片自動、視覺與實機驗收包 | QA-001 | IN PROGRESS | Boss draw、勝敗、death／removed、settlement、panel persistence 與固定尺寸證據齊全 |
| WORK-015 | 建立共用 modal／dialog manager，修正焦點、背景 inert 與原生對話 | UI-014、UI-016 | IN PROGRESS | 開啟聚焦、Tab trap、Escape、回焦與巢狀保護通過；`prompt`／`confirm` 不再出現在玩家路徑 |
| WORK-016 | 收斂 UI token 與 CSS cascade，恢復 44px／14px 底線 | UI-015 | IN PROGRESS | 移除互相覆寫的壓縮規則；三個直式基準尺寸無必要文字小於 14px、可用控制小於 44×44px；另以 `npm run test:ui` 逐一檢查 50 名武將詳情的 stat ledger 與 disabled 對比，人工 Android／WebView／TalkBack 仍待補 |
| WORK-019 | 依品質重置流程執行第一章四層驗收並限制完成宣告 | QA-003 | READY | 先完成 baseline，再由真人玩家、資深企劃、資深美術、資深 UI、工程 QA 各自判定；每輪只修 3–5 項並以同條件 before／after 重測，同 commit 證據齊全且 P0／P1 為零 |

## P1 — 垂直切片穩定後

| ID | 工作 | 對應問題 | 狀態 | 完成條件 |
|---|---|---|---|---|
| WORK-101 | 主要系統逐項功能稽核與去留判定 | GAMEPLAY-002 | IN PROGRESS | 演武場、副本、問天樓、商城、每日等每個可見入口均有真實玩法與結算 |
| WORK-102 | 響應式與無障礙驗收 | UI-004 | IN PROGRESS | 基準尺寸、鍵盤、焦點、對比、reduced motion、TalkBack 可行範圍完成 |
| WORK-103 | 正式音樂、環境音與戰鬥音效規格及資產 | — | IN PROGRESS | 已生成 assets/audio/ 實體音訊資產與解碼播放，待各端音量、循環與關閉行為實機驗收 |
| WORK-104 | 重整貨幣來源／消耗、商店與成長曲線 | ECON-001 | IN PROGRESS | 已建立 scripts/simulate-economy.js 模擬 1~100 關與 30 天產銷平衡通過 |
| WORK-105 | 副模式全面重用正式戰鬥生命週期 | GAMEPLAY-002 | IN PROGRESS | 問天樓、演武場 5v5、日常副本三大特訓均使用正式戰鬥與專屬結算 |
| WORK-106 | 50 名武將與 100 關推進解鎖及戰令系統 | — | IN PROGRESS | 50 名將隨關卡推進結識加入，實裝 30 階征戰敕令獎勵領取 |
| WORK-107 | 全遊戲繁中、名詞與歷史內容校對 | CONTENT-002 | IN PROGRESS | 無錯字、繁簡混用、內部英文與章／關／敵人語意衝突 |
| WORK-108 | 製作 UI 系統圖示、狀態徽章與空狀態像素資產 | UI-016 | READY | 先完成 9 個 64px 設定圖示與 5 個 32px 狀態徽章；功能穩定後再做 3 張 160×96 空狀態圖；命名、透明邊、縮放與對比通過規格 |

## 暫緩項目

排行榜、多人、正式 IAP、戰令、第二個活動、副本擴張、塔擴張與 50 名武將全量開放，在垂直切片通過前不排入製作。現有程式與資料可以保留，但入口不得讓玩家誤認為已完成。

## 外部發布工作

| ID | 工作 | 狀態 | 依賴／完成條件 |
|---|---|---|---|
| EXT-001 | Firebase／Google 登入正式設定與跨裝置驗證 | BLOCKED | 專案持有人 Firebase、OAuth、SHA、規則與實機 |
| EXT-002 | Android application ID、簽名與 Play 測試軌 | BLOCKED | 正式 application ID、keystore、Play Console |
| EXT-003 | 正式 AdMob、`app-ads.txt` 與同意流程 | BLOCKED | 發布方 AdMob 帳號、publisher line、政策確認 |
| EXT-004 | 正式 IAP、SKU、收據驗證與退款處理 | BLOCKED | 商店帳號、商品、驗證後端或核准服務 |
| EXT-005 | 隱私政策、Data safety、商店素材與客服資料 | BLOCKED | 法務確認、公開 URL、截圖、feature graphic、支援信箱 |

外部步驟與安全要求見 [發布文件入口](../release/README.md)。不得使用參考專案或測試資料假裝完成。

## 新增工作格式

新增項目至少包含：唯一 ID、玩家／產品目標、優先級、狀態、依賴、完成條件、對應問題（若有）。只有一句「優化一下」或沒有驗收條件的項目不得進入製作。
