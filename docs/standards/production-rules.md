# 三國：群英再起製作與工程規範

狀態：強制的製作底線。目標不是增加文件數，而是讓設計、實作、驗證與完成宣告使用同一份證據。

## 1. Source of truth 與證據

- Web 原始碼：`index.html`、`styles.css`、`data/`、`js/`、`assets/`；`game.js` 只保留相容性標記。
- `www/` 是 `build.js` 產物，不直接修改。
- 平台設定：`capacitor.config.json`、`manifest.json`、`sw.js`、`package.json`。
- UI、發布、目前遊戲規格與測試分別以 `ui-display-rules.md`、`../release/platform-and-release.md`、`../specs/current-game-spec.md`、`../qa/qa-test-matrix.md` 為準。
- plan、roadmap、evaluation 與 completion 文件是歷史或提案；其中 `[x]` 不是測試證據。

所有稽核結論使用四種標籤：

- `已確認`：能由程式、資料、執行結果、截圖或實機證據重現。
- `推論`：由現況合理推斷，但尚未直接執行或量測。
- `缺少證據`：文件聲稱存在，但沒有足夠程式或測試證明。
- `不一致`：文件、程式、畫面或測試彼此衝突，必須先列為問題。

## 2. 新功能與改版流程

1. 寫清楚 Screen Goal、玩家下一步、成功／失敗條件與不做事項。
2. 定義資料來源、狀態機、layout anchor、資產契約、存檔欄位與遷移。
3. 定義 normal、pressed、selected、disabled、loading、error、completed／claimed。
4. 先完成功能閉環與錯誤路徑，再做視覺 polish；不可用假按鈕或假成功狀態冒充。
5. 只修改必要邊界，保留使用者現有改動；數值、名稱與文案要同步所有消費端。
6. 依風險執行驗證，附上指令、結果、尺寸、截圖或實機資訊。
7. 更新目前規格與問題紀錄；未完成行動只放入 `../work/active-backlog.md`，有證據後才可標記完成。

CSS selector、custom property、檔名、ID 與程式識別字使用 ASCII；繁體中文只放內容與註解，避免工具鏈解析差異。

## 3. 模組與生命週期邊界

- 資料表放 `data/`；共用狀態、存檔與 migration 放 `game-core.js`。
- 戰鬥規則、波次、傷害、獎勵放 `game-combat.js`。
- Canvas、角色、兵器、VFX 與 frame loop 放 `game-render.js`。
- HUD、面板與操作放 `game-ui.js`；全域輸入、背景恢復與 boot 放 `game-main.js`。
- 動畫時間軸、角色 action、音效與 UI 提示必須由同一戰鬥事件衍生，不各自建立平行旗標。
- `setInterval`、`setTimeout`、RAF、音訊與原生 listener 都要有擁有者、取消點與背景／重啟行為。
- `innerHTML` 只使用本地常數或已編碼資料；未驗證輸入不得直接插入 DOM。

## 4. 存檔、獎勵與商業化不變量

- schema 版本必須明確；新欄位提供預設值、舊版 migration、無效資料保護與回滾策略。
- 正常獎勵與廣告加碼分開發放；廣告失敗不能回滾正常獎勵。
- 只有 rewarded completion event 後發廣告獎勵；雙擊、刷新與回呼重送不可重複發放。
- 領取鍵、每日上限、活動時間與交易結果寫入存檔；記憶體、persist、HUD 的順序固定且失敗可理解。
- 離線收益、重置、裝備、關卡、活動與背景恢復都要做重新載入驗證。
- 測試 ID、`REPLACE_WITH` 與模擬購買不得在正式發布中冒充生產設定。

## 5. 資產與戰鬥狀態契約

- 資產依用途放入 `assets/ui`、`assets/nav`、`assets/currency`、`assets/characters`、`assets/backgrounds`、`assets/vfx`。
- 角色、敵人、Boss、兵器必須是透明背景的正式資產或核准 alias；缺少核心資產應使測試失敗，不得顯示黑框、卡片底、幾何方塊或 debug hitbox。
- 角色狀態最少覆蓋 idle／move／attack／hit／death；每個狀態都使用同一 foot anchor、手部 anchor、裁切框與朝向規則。
- 兵器需檢查尺寸、握點、尖端方向、左右手、八方向、攻擊五階段、死亡隱藏與不穿過頭部／UI。
- 像素圖使用 nearest-neighbor，不拉伸比例；透明邊、alpha、尺寸與 manifest 必須由自動化檢查。
- Canvas 更新只在遊戲 loop 內做；DOM 面板不得新增無限 timer 或重複 listener。

## 6. 風險式驗證

### 快速路徑

適用於純文件、文案、無狀態的小型樣式：檢查 UTF-8、連結、語法、直接受影響畫面與 regression marker。

### 高風險路徑

以下任一項必須走 `../qa/qa-test-matrix.md` 對應流程：戰鬥狀態、波次、敵人生成、角色渲染、兵器、死亡、輸入、存檔、獎勵、背景恢復、廣告、原生橋接、build 或發布。

最低自動化命令：

```text
node --check game.js
node --check js/game/game-core.js
node --check js/game/game-combat.js
node --check js/game/game-render.js
node --check js/game/game-ui.js
node --check js/game/game-main.js
npm run test:docs
npm test
```

戰鬥資產異動再執行：

```text
npm run test:combat-assets
```

需要同步 `www/` 時執行 `node build.js`。只有使用者要求畫面測試時才啟動瀏覽器並依 `../qa/visual-qa.md` 截圖；正式發布另依 `../release/` 文件走實機與商店流程。

## 7. 完成與發布宣告

完成報告必須列出：改動範圍、已執行測試、結果、未執行項目、已知問題與證據位置。測試失敗要區分程式缺陷、資產缺陷、環境缺少或預期 guard，不得吞掉錯誤。

以下任一成立時只能標示「進行中」或「阻擋」，不得寫「完成／可發布」：

- 核心流程仍有錯誤、卡死、重複獎勵或存檔遺失。
- 角色／敵人／Boss 任一狀態有錯圖、黑框、方塊、兵器漂浮或死亡殘留。
- 必要尺寸未驗證，或視覺硬錯誤尚未關閉。
- 只驗證檔案存在、字串 marker 或 checklist，沒有執行行為證據。
- 正式帳號、祕密、政策或實機條件尚缺卻被寫成已發布。

涉及 UI、存檔、廣告、Android、版本號、資料安全或反覆發生的錯誤時，更新對應文件；不要只留在聊天或暫時註解。
