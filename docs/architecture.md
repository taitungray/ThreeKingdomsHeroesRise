# Runtime architecture

`game.js` is kept as a small compatibility marker. The playable runtime is loaded by `index.html` in this order:

1. `data/game-data.js` — data tables only: heroes, paper-doll equipment, tactics, chapters and stages.
2. `js/game/game-core.js` — DOM handles, save migration, shared state, data helpers and terrain setup.
3. `js/game/game-combat.js` — units, waves, skills, damage, rewards and stage progression.
4. `js/game/game-render.js` — Canvas drawing, pixel character details, effects and the frame loop.
5. `js/game/game-ui.js` — HUD, panels, roster, formation, campaign and panel actions.
6. `js/game/game-main.js` — input listeners, visibility/offline income and boot.

The files intentionally use ordered classic scripts for the current WebView/Cordova target. That keeps the existing global runtime stable while making each subsystem independently searchable and replaceable. New systems should follow the same boundaries:

- New content belongs in `data/`.
- New persistent fields belong in `game-core.js` save migration.
- New battle rules belong in `game-combat.js`.
- New visual effects belong in `game-render.js`.
- New panels and buttons belong in `game-ui.js`.
- New global listeners belong in `game-main.js`, with cleanup if a listener is scoped to a scene.

`npm test` verifies that all runtime modules exist, load after the data file in dependency order, preserve the core-loop markers, and keep the legacy `game.js` marker small.

`npm run dev` 必須直接提供根目錄 source，避免瀏覽器 QA 誤測未同步的 `www/`；只有要驗證 `node build.js` 產物時才使用 `npm run dev:www`。測試報告要明列測的是 source 或 built output。

Runtime notes:

- Effect records are pooled in js/game/game-core.js and recycled by js/game/game-combat.js; stage resets release active effects back to the pool.
- js/game/game-main.js owns RAF, HUD and persistence timer lifecycles, including background-page suspension and foreground recovery.
- Generated portrait samples are data-declared under `assets/characters/`. UI-only decorative portraits may use an explicitly approved CSS fallback, but combat bodies, attack states, Bosses and weapons may not fall back to rectangles, black cards or procedural block figures. Missing mandatory combat assets are test failures; a normal enemy general may only use an approved transparent body alias declared by the render contract.


## 本輪新增運行邊界

- `assets/characters/modular-manifest.json` 維護頭像家族、素材 anchor、角色部件與 Boss 變體契約。
- `assets/characters/equipment-manifest.json` 維護 48x48 武器、甲冑、飾品圖標；`TaoyuanAssets` 負責預載、快取與失敗降級。
- `platform.js` 與 `iap.js` 只做平台能力探測與誠實 fallback；原生商店插件只在實機存在時啟用。
- 日常、簽到、商城、演武、成就與結算都透過同一份 save 狀態進行發獎、重新繪制與遷移。

## 戰鬥渲染與覆蓋層責任

- `game-combat.js` 擁有 action、wave、death 與 settlement 的生命週期；`game-render.js` 只根據該狀態繪製，不再建立第二套動畫真相。
- 我方、普通敵人與 Boss 的 body、attack、weapon、mount 與 VFX 必須各自只畫一次。每個 manifest 要能追到實際消費端；只有檔案存在但 runtime 不使用，不算完成。
- 角色資產共用 foot-center；兵器共用 manifest hand anchor。裁切、比例、朝向與 alpha 規則見 `combat-character-render-contract.md`。
- 敵將預告由 `game-ui.js` 管理並固定在 top information lane；波次／Boss 狀態由 `game-combat.js` 觸發。Boss 橫幅與角色對話不可同時成為中央覆蓋層。
- `game-main.js` 負責 visibility、RAF 與全域 input；背景恢復不得重複建立 loop、timer 或 listener。

## 文件與程式不一致時

架構文件描述的是目前應成立的邊界，不是願望清單。若 source、manifest、runtime 消費或 QA 證據任一不符，將項目標成「不一致」並列入 `issues-and-prevention.md`；不得以歷史 roadmap 的勾選覆蓋現況。
