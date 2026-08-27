# 已知問題與防止再犯

這份文件記錄已實際出現、可從程式確認或由使用者截圖指出的問題。狀態只有 `OPEN`、`VERIFY`、`RESOLVED`；沒有證據不可關閉。

## 問題總表

| ID | 問題 | 根因／證據 | 狀態 | 關閉條件 |
|---|---|---|---|---|
| COMBAT-001 | 敵將提示遮住戰鬥 | Boss 生成原本同時觸發敵將預告、Boss 橫幅與角色對話；程式已改為先清除對話並由橫幅獨占中央敘事層 | VERIFY | 390×720 實際 Boss 出場截圖／影片確認無角色被遮、無兩個中央覆蓋層 |
| COMBAT-002 | 角色周圍出現黑框／方框 | 曾把整格圖、卡片底或不透明 fallback 帶入戰場；舊測試只檢查檔案存在 | OPEN | alpha 自動檢查＋逐狀態截圖皆無框 |
| COMBAT-003 | 敵人圖與身分不符 | 普通敵將大量依型別／英雄 alias 映射，manifest 與實際消費沒有逐一稽核 | OPEN | 每敵人類型與 Boss 身分表完成，抽樣關卡截圖一致 |
| COMBAT-004 | 攻擊時身體、手臂與圖層錯亂 | 攻擊圖集產生器的 WebP body 嵌入未正確渲染；hero／Boss 圖集主要只剩程序線條，但舊 smoke test 仍通過。現已由 `ATTACK_SPRITES_APPROVED = false` 隔離 | OPEN | 圖集每格有效 body、自動 gate PASS、重新啟用單一路徑、五階段截圖 PASS |
| COMBAT-005 | 兵器像亂畫、漂浮或穿模 | 戰鬥兵器由程序 SVG 批次產生，只有共同 anchor，未完成逐兵器握法與八方向美術驗收 | OPEN | 九類兵器逐一通過握點、比例、方向、攻擊與死亡檢查 |
| COMBAT-006 | 攻擊與死亡整體圖亂掉 | action、body transform、攻擊 overlay、weapon、death transform 可疊加；缺少狀態轉移影格測試 | OPEN | ally／enemy／Boss 的 attack→hit→death→removed 連續證據 PASS |
| COMBAT-007 | runtime 有單位但畫面沒有角色／角色飛出畫布 | `drawUnit()` 最外層 Canvas `save()` 漏掉 `restore()`，transform 逐單位逐幀累積；Chrome 記錄到 draw 座標超過 `(1059,-221)`。修正後 source／`www` 各記錄超過 8,000 次 body／weapon draw，邊界未逸出，390×720 截圖可見雙方單位與血條 | RESOLVED | 已由 source／`www` 真實 Chrome transform gate 與截圖關閉；後續由自動化防回歸 |
| UI-001 | 結算畫面出現對角線／X | 曾由裝飾漸層或 pseudo-element 穿透；目前有 source guard，但缺視覺回歸 | VERIFY | 勝／敗結算於所有基準尺寸無對角線，console 乾淨 |
| INPUT-001 | 瀏覽器反覆報震動錯誤 | 未經手勢呼叫 `navigator.vibrate` | RESOLVED | 全專案掃描無呼叫，戰鬥 console 無相關訊息 |
| PROCESS-001 | 文件說完成但遊戲仍錯 | 歷史 roadmap／completion 的 `[x]` 被當成現況；marker test 沒執行行為或視覺 | OPEN | 文件分層生效，完成宣告附 QA 證據，發布 gate 無硬錯誤 |
| PROCESS-002 | 改了 source，瀏覽器卻仍顯示舊畫面 | 開發伺服器原本優先提供未同步 `www/`，程式檢查與瀏覽器 QA 測到不同版本。現已拆成 `npm run dev`（source）與 `npm run dev:www`（build），瀏覽器測試輸出會標示 target | RESOLVED | `node build.js` 後 source／`www` 瀏覽器測試均通過；後續不可混用入口 |
| MOTION-001 | 規範禁止全畫面震動但程式仍有 shake | `runtime.shake` 與 Canvas translate 尚在 | OPEN | 改局部回饋或在 reduced-effects 下完全停用並驗證 |

## 根因模式與預防

### 1. 檔案存在不等於資產正確

manifest、檔名、尺寸只能證明交付格式。自動化還要檢查 alpha、每格有效像素、裁切與 anchor；人工要檢查輪廓、握點、材質、角色辨識與動作連續性。

### 2. 宣告存在不等於 runtime 使用

每個 manifest 資產要能追到載入、選擇與 draw call。若 renderer 仍走另一條 procedural／fallback 路徑，項目標為「不一致」，不可關閉遷移任務。

### 3. 多套狀態來源會互相打架

攻擊、受擊、死亡、音效、VFX、兵器與覆蓋層都由 combat action／battle event 派生。禁止 CSS timer、Canvas timer 與 DOM timer各自推測目前狀態。

### 4. 修單張截圖不足以修生命週期

任何戰鬥視覺問題都要回歸開始、移動、攻擊五階段、受擊、死亡、移除、下一波、Boss、勝敗與重開。只看 idle 或單一 frame 不得關閉。

### 5. Fallback 只能誠實降級

核心角色、敵人、Boss、兵器缺圖時應在測試與開發環境報錯。允許的 alias 必須事先列在資料或 manifest，且使用透明、同風格資產；不可臨時畫方塊把錯誤藏起來。

## 新問題紀錄格式

每個新問題記錄：版本／工作樹、尺寸與 DPR、關卡與編隊、重現步驟、預期、實際、console、截圖／影片、可能根因、影響層、修正、測試、回歸範圍。沒有重現資料時標記 `缺少證據`，不要猜成已修好。
