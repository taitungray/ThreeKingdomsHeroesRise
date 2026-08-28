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
| COMBAT-002 | P0 | 角色周圍曾出現黑框、方形 Sprite cell 或不透明 fallback | VERIFY | alpha 自動檢查及全狀態畫面均無框 | WORK-004 |
| COMBAT-003 | P0 | 普通敵人、敵將與 Boss 身分曾映射到錯誤或通用圖 | VERIFY | 完成身分／資產表，抽樣關卡與資料一致 | WORK-003 |
| COMBAT-004 | P0 | 攻擊圖集 body 嵌入失敗；資產 gate 找出 1,787 個過度稀疏影格，runtime 已暫時隔離攻擊圖集 | VERIFY | 重製後 asset gate 與五階段視覺驗收通過 | WORK-001 |
| COMBAT-005 | P0 | 程序產生兵器只有共用 anchor，實際畫面有漂浮、比例錯誤與穿模 | VERIFY | 九類兵器逐一通過握點、方向、攻擊與死亡檢查 | WORK-002 |
| COMBAT-006 | P0 | action、body transform、weapon、VFX 與 death transform 曾疊加，攻擊及死亡畫面錯亂 | VERIFY | attack→hit→death→removed 連續證據通過 | WORK-004 |
| UI-001 | P0 | 對角線／菱形裝飾不只出現在結算，也穿透每日、商城、活動與副本等命令面板 | VERIFY | 所有基準尺寸的主要面板與勝敗結算均無跨區裝飾線 | WORK-008 |
| UI-002 | P0 | 自動推關進入下一關時，`startStage()` 呼叫 `closePanel()`，會關閉玩家正在閱讀的武將、編隊、設定等面板 | VERIFY | stage transition 不關閉、不搶焦點、不重設使用者面板狀態 | WORK-008 |
| UI-003 | P1 | 訪客設定頁以 `activeUser.username` 顯示帳號，但訪客資料使用 `displayName`，畫面出現 `undefined` | VERIFY | 訪客與登入帳號均顯示正確名稱，缺值有核准 fallback | WORK-008 |
| UI-004 | P0 | 390×720 與 320×568 實測中，技能大對話、右側列、底欄、資源列、血條與 VFX 同時壓縮戰場；資源數字被截斷 | VERIFY | 三個基準尺寸通過三秒測試，戰鬥資訊可辨識且無截斷／遮擋 | WORK-005、WORK-102 |
| UI-005 | P1 | 武將詳情有頭像／屬性重疊，戰法頁出現溢出的 `ACTIVE ARMY PASSIVE` 內部英文標籤 | VERIFY | 武將詳情與戰法頁於基準尺寸無重疊、溢出或內部標籤 | WORK-008、WORK-010 |
| GAMEPLAY-001 | P0 | 3×3 位置會影響實戰與 lane bonus，但編隊 UI 只能增減成員，沒有可用的換位操作 | VERIFY | 玩家可編輯、保存與還原位置，且站位差異有可重現戰果 | WORK-009 |
| GAMEPLAY-002 | P1 | 演武、塔與副本目前主要以總戰力門檻立即判定結果，沒有進入正式戰鬥 | VERIFY | 可見的戰鬥型副模式至少一個使用完整戰鬥、勝敗與獎勵流程；其餘隱藏 | WORK-101、WORK-105 |
| ECON-001 | P1 | 裝備可免費輪換全部資料，商城本地兌換多為一次性且按鈕仍寫「領取」，缺少真實取得與持續消耗 | VERIFY | 裝備有擁有／掉落／比較；商城行為與文案一致並有可測試消耗循環 | WORK-011、WORK-104 |
| DATA-001 | P0 | 敵將組合引用 `huangzhong`，但敵將資料沒有同 ID，預覽、篩選與實戰可能落入 fallback | VERIFY | 所有關卡敵將 ID 通過完整性檢查，預覽與實戰身份一致 | WORK-003 |
| CONTENT-001 | P1 | 章節卡片使用歷史章名，但首關名稱由循環前綴生成，出現桃園結義對應官渡烽煙等語意錯配 | VERIFY | 第一章 10 關及後續開放章節的章名、關名、敵人與 Boss 一致 | WORK-012 |
| CONTENT-002 | P1 | 成就與面板可見「桃園初陳」「玉璇」「連環妁殺」、繁簡混用等文字錯誤 | VERIFY | 全量繁中與名詞校對通過，無已知錯字、繁簡混用或內部英文 | WORK-107 |
| MOTION-001 | P1 | 規範禁止全畫面震動，但 `runtime.shake` 與 Canvas translate 仍存在 | VERIFY | 改成局部回饋，reduced motion 下完全停止 | WORK-006 |
| QA-001 | P0 | 現有 browser smoke 約數秒即可通過，實測 `drawStats.boss = 0` 仍為 PASS，未涵蓋完整攻擊、死亡、Boss、勝敗與結算畫面 | VERIFY | 自動流程對完整勝敗、Boss draw、death／removed、settlement 與 panel persistence 建立硬斷言及畫面證據 | WORK-007、WORK-013 |
| PROCESS-001 | P1 | 舊 roadmap／completion 的勾選曾被當成目前完成證明 | VERIFY | 文件分層、內部連結與維護規則通過檢查，後續完成宣告均附證據 | 本次文件整理 |

## 本輪修正與證據（2026-08-28）

程式與資料已改；關閉條件要的畫面／實機證據多數尚未取得。故全部仍為 `VERIFY`，不得當成可發布。

| ID | 已確認的自動／程式證據 | 仍缺 |
|---|---|---|
| COMBAT-001 | `spawnWave(true)` 先 `hideEnemyPreview()`、清對話、只留橫幅；browser QA 斷言中央 overlay ≤ 1 | Boss 出場截圖／影片 |
| COMBAT-002／004 | `npm run test:combat-assets`；攻擊圖集 `ATTACK_SPRITES_APPROVED = true` | 五階段、八方向、無黑框畫面 |
| COMBAT-003／DATA-001 | `huangzhong` 入敵將表；`enemyIdentityMap`；smoke 查關卡 ID 與對應 body 檔 | 抽樣關卡預覽＝實戰畫面 |
| COMBAT-005 | 九類兵器各有 `anchor`；runtime `WEAPON_ANCHORS` | 攻擊／死亡穿模畫面 |
| COMBAT-006 | `applyCombatBodyMotion(..., { outerDeath, outerAction })` | attack→hit→death→removed 影片 |
| UI-001 | `.header-ornament { display: none; }`；命令卡改 180deg | 各面板基準尺寸截圖 |
| UI-002 | `startStage(..., { keepPanel })`；自動推關帶 `keepPanel: true` | 開著設定面板推關的畫面 |
| UI-003 | `accountDisplayName()`；訪客補 `username` | 訪客設定頁畫面 |
| UI-004 | `.compact-hud` + `360px` media | 390×720／320×568 三秒測試 |
| UI-005 | 詳情改 grid；戰法文案改中文；無 `ACTIVE ARMY PASSIVE` | 詳情／戰法頁截圖 |
| GAMEPLAY-001 | `formation-slot-swap` + `swapFormationSlots()` | 換位保存／重載與戰果差 |
| GAMEPLAY-002 | 問天樓走正式戰鬥；演武／副本「尚未開放」 | 問天樓勝敗獎勵流程畫面 |
| ECON-001 | `ownedEquipment`；商城「兌換」＋可重複項＋玄鐵鎧 | 兌換消耗循環畫面 |
| CONTENT-001 | `CHAPTER1_STAGE_SPECS` 10 關專名 | 章卡與關卡列表對讀 |
| CONTENT-002 | 成就改「桃園初陣／赤壁火計／連環斬殺／百戰精兵」，直向螢幕提示，smoke-test 增加簡體字防護 | 全量繁中人工走查 |
| MOTION-001 | `applyLocalImpact` + `reducedMotionActive`；無全畫面 shake translate | reduced-motion 實測 |
| QA-001 | `npm run test:combat-browser` source 通過：`drawStats.boss = 273`、panel 保持設定、Boss overlay 僅橫幅 | 完整勝敗／settlement／death 畫面包 |
| PROCESS-001 | 文件分層與 `npm run test:docs` | 後續完成宣告持續附證據 |

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
