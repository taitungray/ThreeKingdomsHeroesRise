# 已知問題

狀態：ACTIVE ISSUE LOG。這裡只記錄已發生、可由程式、截圖或測試重現的偏差；功能願望與未來工作放在 [目前工作清單](../work/active-backlog.md)。

問題狀態只有：

- `OPEN`：已確認，尚未修正。
- `VERIFY`：已修改，但關閉證據不足。
- `RESOLVED`：關閉條件已有可重現證據。

## 開放與待驗證問題

| ID | 等級 | 問題與證據 | 狀態 | 關閉條件 | 工作 |
|---|---:|---|---|---|---|
| COMBAT-001 | P0 | Boss 生成曾同時顯示敵將預告、Boss 橫幅與角色對話，遮住戰鬥 | VERIFY | Boss 出場實際截圖／影片確認最多一個中央覆蓋層 | WORK-005 |
| COMBAT-002 | P0 | 角色周圍曾出現黑框、方形 Sprite cell 或不透明 fallback | OPEN | alpha 自動檢查及全狀態畫面均無框 | WORK-004 |
| COMBAT-003 | P0 | 普通敵人、敵將與 Boss 身分曾映射到錯誤或通用圖 | OPEN | 完成身分／資產表，抽樣關卡與資料一致 | WORK-003 |
| COMBAT-004 | P0 | 攻擊圖集 body 嵌入失敗；資產 gate 找出 1,787 個過度稀疏影格，runtime 已暫時隔離攻擊圖集 | OPEN | 重製後 asset gate 與五階段視覺驗收通過 | WORK-001 |
| COMBAT-005 | P0 | 程序產生兵器只有共用 anchor，實際畫面有漂浮、比例錯誤與穿模 | OPEN | 九類兵器逐一通過握點、方向、攻擊與死亡檢查 | WORK-002 |
| COMBAT-006 | P0 | action、body transform、weapon、VFX 與 death transform 曾疊加，攻擊及死亡畫面錯亂 | OPEN | attack→hit→death→removed 連續證據通過 | WORK-004 |
| UI-001 | P0 | 結算畫面曾出現對角線／X 裝飾穿透 | VERIFY | 勝／敗結算於基準尺寸無對角線且 console 乾淨 | WORK-005 |
| MOTION-001 | P1 | 規範禁止全畫面震動，但 `runtime.shake` 與 Canvas translate 仍存在 | OPEN | 改成局部回饋，reduced motion 下完全停止 | WORK-006 |
| PROCESS-001 | P1 | 舊 roadmap／completion 的勾選曾被當成目前完成證明 | VERIFY | 文件分層、內部連結與維護規則通過檢查，後續完成宣告均附證據 | 本次文件整理 |

## 已解決問題

| ID | 問題 | 關閉證據 |
|---|---|---|
| COMBAT-007 | runtime 有單位但角色飛出畫布 | 補回 `drawUnit()` Canvas restore；source／`www` Chrome 各記錄超過 8,000 次 draw transform，均未逸出 |
| INPUT-001 | 未經手勢呼叫震動造成瀏覽器 intervention | 全專案無 `navigator.vibrate` 呼叫，戰鬥 console 無相關訊息 |
| PROCESS-002 | source 修改後瀏覽器仍測到舊 `www` | `npm run dev` 與 `npm run dev:www` 分離，兩種 target 均有瀏覽器測試 |

## 問題與工作如何連結

- 問題描述「實際錯在哪裡」及關閉證據，不展開解法規格。
- 工作描述「接下來採取什麼行動」，可以同時處理多個問題。
- 修正完成先改為 `VERIFY`；取得指定證據後才改為 `RESOLVED`。
- 已解決問題保留精簡紀錄，長篇除錯過程由 Git 或測試輸出保存。

## 新問題格式

記錄：ID、版本／工作樹、尺寸與 DPR、關卡與編隊、重現步驟、預期、實際、console、截圖／影片、根因（若已確認）、狀態、關閉條件與對應工作。沒有重現證據時標記「缺少證據」，不要猜成已修好或直接列入缺陷。
