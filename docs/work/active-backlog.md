# 目前工作清單

狀態：ACTIVE。這是唯一的進行中待辦清單，只放「尚未完成、需要採取行動」的工作。已發生缺陷的細節與證據在 [已知問題](../issues/known-issues.md)，測法在 [QA 測試矩陣](../qa/qa-test-matrix.md)。

## 狀態與優先級

- `READY`：可在本專案直接開始。
- `IN PROGRESS`：已有實作正在進行；同時只能有少量項目。
- `BLOCKED`：缺外部帳號、正式資產、法務資料或必要決策。
- `P0`：阻擋核心品質或發布；`P1`：重要但不先於 P0；`P2`：核心穩定後再做。

完成的工作不長期留在本檔。通過驗收後更新目前規格或關閉問題，再從此清單移除；歷史由 Git 保存。

## 下一個可玩版本目標

目標：完成「戰鬥角色與兵器可信版本」。在此目標達成前，不進行裝飾性大改或新增更多 meta 系統。

完成定義：戰鬥資產 gate 通過；我方、普通敵人、Boss 的 idle／move／attack／hit／death 全矩陣通過；敵將、兵器與角色身分一致；source 與 `www` 真實瀏覽器流程無硬錯誤。

## P0 — 目前必做

| ID | 工作 | 對應問題 | 狀態 | 完成條件 |
|---|---|---|---|---|
| WORK-001 | 重製攻擊圖集，確保每格都有完整 body | COMBAT-004 | READY | `npm run test:combat-assets` 通過；五階段、八方向人工驗收通過 |
| WORK-002 | 重製九類戰鬥兵器與逐角色握點 | COMBAT-005 | READY | 比例、手部 anchor、方向、攻擊、死亡均無漂浮或穿模 |
| WORK-003 | 建立普通敵人、敵將與 Boss 的身分／資產映射 | COMBAT-003 | READY | 每類敵人與 Boss 可追到唯一或核准 alias，抽樣關卡畫面一致 |
| WORK-004 | 修正攻擊、受擊、死亡與移除的單一渲染生命週期 | COMBAT-002、COMBAT-006 | READY | 我方／敵人／Boss 全狀態矩陣無黑框、雙身體、殘影或殘留兵器 |
| WORK-005 | 驗證 Boss、敵將、對話與結算覆蓋層 | COMBAT-001、UI-001 | READY | 390×720 勝敗與 Boss 流程截圖無遮擋、疊層或對角線 |
| WORK-006 | 移除全畫面 shake，建立 reduced-effects 行為 | MOTION-001 | READY | reduced motion 下無全畫面位移；結果與戰鬥時間不變 |
| WORK-007 | 跑完 P0 核心流程回歸 | — | READY | boot、三波、Boss、勝、敗、重試、存檔、背景恢復與 console 全通過 |

## P1 — P0 完成後

| ID | 工作 | 狀態 | 完成條件 |
|---|---|---|---|
| WORK-101 | 主要系統逐項功能稽核 | READY | 武將、編隊、戰法、任務、簽到、商城、副本、塔、活動皆有成功／失敗／重載證據 |
| WORK-102 | 響應式與無障礙驗收 | READY | 基準尺寸、鍵盤、焦點、對比、reduced motion、TalkBack 可行範圍完成 |
| WORK-103 | 正式音樂、環境音與戰鬥音效規格及資產 | BLOCKED | 取得可授權音檔，完成音量、循環、背景與關閉行為驗收 |
| WORK-104 | 深化裝備掉落、詞綴與經濟曲線 | READY | 先有數值表、模擬與防溢出測試，再接 UI 與存檔 |

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
