# QA 測試矩陣與發布門檻

狀態：MANDATORY QA STANDARD。這裡只定義測法、證據與判定，不追蹤工作進度；待辦見 [目前工作清單](../work/active-backlog.md)，缺陷見 [已知問題](../issues/known-issues.md)。

這份矩陣把「功能能跑」與「遊戲品質可接受」分開。跨角色的完整制度依 [遊戲品質審查與四層驗收規範](../standards/game-quality-review.md)。自動化、真人玩家盲測、企劃審查、美術／UI 審查、瀏覽器視覺、Android 實機與商店測試軌是不同證據，不互相代替。

## 1. 測試層級

| 層級 | 目的 | 最低證據 |
|---|---|---|
| 靜態檢查 | 語法、文件連結、manifest、資產格式 | 指令與完整輸出 |
| Runtime smoke | boot、loop、生成、狀態不卡死 | 可重現腳本與斷言 |
| 功能 QA | 規則、獎勵、存檔、錯誤路徑 | Given／When／Then 紀錄 |
| 玩家盲測 | 無說明情況下是否玩懂、想繼續且能完成核心循環 | 真人錄影、時間碼、原話與任務結果 |
| 企劃審查 | 核心循環、決策密度、節奏、回饋與多餘系統 | Keep／Remove／Simplify／Fix 與驗收案例 |
| 視覺 QA | UI、角色、兵器、動畫與覆蓋層 | 固定尺寸逐狀態截圖／影片 |
| 實機 QA | WebView、觸控、背景、音訊、登入、廣告 | 裝置／OS／build／log |

## 2. P0 核心流程

| ID | Given | When | Then |
|---|---|---|---|
| P0-BOOT | 空或有效本地存檔 | 啟動遊戲 | 無 exception／404；只建立一個 RAF；可進入戰鬥 |
| P0-STAGE | 已配置有效編隊 | 開始關卡 | 我方與敵人生成，單位會移動，波次／敵數正確 |
| P0-WAVES | 普通波存活 | 連續擊敗三波 | 每波只推進一次，不重複生成，不在中途結算 |
| P0-BOSS | 三波完成 | Boss 生成 | Boss 身分／圖正確；最多一個中央覆蓋層；戰鬥不中斷 |
| P0-WIN | 擊敗 Boss | 結算 | 正常獎勵只發一次，關卡進度正確，重載後保留 |
| P0-LOSE | 我方全滅 | 結算 | 不發勝利獎勵，可重試，舊單位／timer／overlay 清除 |
| P0-REPLAY | 已有一場結算 | 重試或下一關 | runtime 完整 reset；沒有屍體、兵器、VFX、timer 或雙 loop |
| P0-BG | 戰鬥進行中 | 背景 90 秒以上再回前景 | 不建立第二 loop；離線收益與戰鬥狀態依規則處理 |
| P0-SAVE | 成長／換裝／領獎後 | 重新載入 | schema v3 正確還原，未重複發獎，無資料遺失 |
| P0-PANEL | 武將／編隊／設定等面板已開啟 | 自動戰鬥跨波、結算或進入下一關 | 面板不被自動關閉、不搶焦點、不重設捲動或選取狀態 |
| P0-CONSOLE | 完整跑完勝／敗各一場 | 監看 console | 無 error、資產 404、vibrate intervention 或 frame failure |

瀏覽器測試必須記錄內容來源：`npm run dev` 測根目錄 source；完成 `node build.js` 後才用 `npm run dev:www` 測同步產物。禁止讓舊 `www/` 混入 source QA。

`npm run test:combat-browser` 若只執行數秒 smoke，只能證明 boot、draw 與移動，不能代替 P0 戰鬥驗收。完整 gate 必須明確斷言 Boss 至少實際繪製一次、我方與敵方各完成 death → removed、勝／敗結算可見且獎勵正確、面板跨關保持，並保存固定尺寸畫面證據。

## 3. 戰鬥渲染矩陣

我方近戰、我方遠程／謀士、普通近戰敵人、普通遠程敵人與 Boss 都要執行：

| 狀態 | 功能斷言 | 視覺斷言 |
|---|---|---|
| idle | action 為 null、座標穩定 | 完整全身；無 portrait／半身 bust、黑框、灰綠／褐色矩形底塊、棋盤島或雙身體；臉、甲片與兵器在 390×720 可辨識 |
| move／entry | 到達 target lane 前不攻擊；只有實際位移才推進 move frame | 左右腳交替、接地幀清楚、停下不滑行，朝向正確、無整體彈跳或拉伸 |
| anticipation | action 單一且 frame 合法 | 身體與兵器只畫一次，蓄力方向正確 |
| contact | 傷害只 resolve 一次 | 命中點、兵器尖端與目標關係合理 |
| recovery | action 按時結束 | 不殘留第二把兵器、手臂或 trail |
| hit | hp／stun／flash 按規則 | 不把整個角色洗成實心幾何形 |
| death | 停止攻擊與選目標 | 兵器跟隨／隱藏，無跳格或復活一 frame |
| removed | 從 runtime 移除 | 屍體、影子、血條、VFX、兵器完全消失 |

資產自動檢查至少涵蓋：96px v3 基線與 128px v4 試製尺寸、WebP、alpha、每個 cell 的有效像素範圍與外緣不透明色帶、move 每格單一 alpha component、manifest 路徑、重複 ID、五階段攻擊與四幀步態像素指紋差異、foot／hand anchor，以及正常 runtime 路徑不得引用 portrait／半身 combat body。指紋、component 與外緣門檻只能防止重複站姿、跨角色碎片及大面積髒底回歸，不能代替細節可讀性、動作品質、腳底接地與握點視覺證據。

## 4. UI、輸入與響應式

- 390×720 完整跑勝／敗；430×932、320×568、短高橫向檢查 HUD、面板、結算與旋轉提示。
- 觸控、滑鼠、鍵盤各走一次主要操作；Tab、Enter／Space、Escape、modal focus trap 與焦點返回。
- 所有可操作控制至少 44×44 CSS px；正文、資源、底欄與必要說明至少 14px。320px 不得用 10–11px 壓縮換取塞入。
- 自動、速度、首領、第一章核准右側入口、更多抽屜、五底欄、面板關閉都不遮擋且不重複觸發；不得以固定「四快捷」為通過條件。
- 敵將預告、波次、Boss 橫幅、對話與結算依序顯示，不同中央 overlay 不同時存在。
- `prefers-reduced-motion` 下關閉裝飾 motion 與全畫面 shake，戰鬥結果不變。

| ID | Given | When | Then |
|---|---|---|---|
| UI-ROUTES | 首章空帳號與解鎖測試帳號 | 逐一點擊所有可見入口 | 不注入 QA 假值；每個入口能開啟、完成主要操作、關閉，console 無 error；未完成入口為 Hide 或誠實 Lock |
| UI-FOCUS | 任一底欄、右欄或面板內觸發器已聚焦 | 開啟並關閉 modal | 初始焦點在標題／首要控制；Tab 不離開 modal；背景 inert；Escape 關閉；焦點回原觸發器 |
| UI-AUTH | 首次登入或教學可見 | 只用鍵盤／TalkBack 操作 | 初始焦點不在 `BODY`；背景戰鬥控制不可聚焦；主要與略過操作都有可讀名稱 |
| UI-SIZE | 390×720、430×932、320×568、200% zoom | 量測全部 enabled controls 與必要文字 | 觸控 ≥44×44px、必要文字 ≥14px；無水平捲動、遮擋、裁切或直排中文字 |
| UI-IA | 第一章尚未完成 | 打開右欄與軍務抽屜 | 只出現核准 Keep／Lock 入口；成就、圖鑑、副模式與營運入口未通過前不冒充可用 |
| UI-SETTINGS | 無 IAP SKU、無遠端版本檢查或支援服務 | 開啟設定 | 不顯示恢復購買、假版本檢查或假送出；改名、回報、重置不用原生 `prompt`／`confirm` |
| UI-EVENT | 活動有核准的真實時間、任務與獎勵資料 | 依序進入預告、開放、完成、領取、結束、補領、斷線與重試狀態 | 三秒內理解目標／進度／獎勵／CTA；倒數與時區正確；獎勵只發一次；無假排行、假可領取或結束後操作 |
| UI-HUD | 任一章關戰鬥進行中 | 三秒觀察 HUD | 能辨識章－關、關名、波次、Boss 狀態與下一目標；關卡末碼不重複，主線提示不遮戰場 |

## 5. 存檔、獎勵與營運

- 空存檔、v2→v3 migration、損壞 JSON、缺欄位、超界數值與無 localStorage 各測一次。
- 普通獎勵、廣告加倍、每日任務、簽到、活動、掃蕩、商店各做雙擊／刷新／回呼重送測試。
- 離線收益測 89 秒、90 秒、長時間上限、時鐘回撥與領取後重載。
- 雲端與原生功能在無插件／離線時誠實 fallback；正式環境另測登入取消、token 過期、衝突與重試。

## 6. 建議命令

```text
node --check game.js
node --check js/game/game-core.js
node --check js/game/game-combat.js
node --check js/game/game-render.js
node --check js/game/game-ui.js
node --check js/game/game-main.js
npm run test:docs
npm run test:combat-assets
npm test
npm run test:ui
node scripts/repro-combat-freeze.js
npm run test:combat-browser
node scripts/browser-lifecycle-smoke.js
node build.js
npm run test:combat-browser:www
node scripts/browser-lifecycle-smoke.js --www
```

需要同步產物時再執行 `node build.js`。瀏覽器命令使用固定 QA 訪客存檔，專測 UI、戰鬥與生命週期而不混入首次登入／教學流程；首次登入與教學需另列功能案例。瀏覽器視覺與實機測試只在任務要求或發布 gate 執行，並保留環境與畫面證據。

## 7. 判定

- `PASS`：四層品質審查與 P0 全過、無視覺硬錯誤、console 乾淨、證據完整。
- `PASS WITH ISSUES`：P0 全過，只有不影響可玩性與辨識的非阻擋 polish。
- `FAIL`：任一 P0／P1、任一專業角色重要項目失敗、角色／兵器錯圖、黑框／方塊、遮擋、重複獎勵、存檔遺失、卡死、console error、真人盲測／實機等必要證據缺失。

發布需另外通過平台文件的簽名、政策、廣告、Data safety、商店測試軌與實機條件。
