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
| COMBAT-002 | P0 | 角色周圍曾出現黑框、方形 Sprite cell、不透明 fallback；2026-08-29 實戰截圖再確認攻擊／idle 圖有灰綠與褐色矩形髒色塊 | VERIFY | alpha、cell 外緣色帶自動檢查及全狀態畫面均無框、棋盤島或矩形底塊 | WORK-001、WORK-004 |
| COMBAT-003 | P0 | 普通敵人、敵將與 Boss 身分曾映射到錯誤或通用圖；2026-08-29 實戰：選呂布卻畫出第二個趙雲（`attack-lubu-v3` 當時 `archetype=zhaoyun`）。已為呂布／諸葛亮／貂蟬建立專屬母圖，核心 11 將 asset gate 禁止互為像素複本 | VERIFY | 完成身分／資產表，抽樣關卡與資料一致；編隊含呂布＋趙雲時兩者剪影不同 | WORK-003 |
| COMBAT-004 | P0 | 舊攻擊圖集曾有 1,787 個過度稀疏影格，之後版本又以重複站姿填滿五列；`v2` 已重製並由 runtime 抽格 | VERIFY | asset gate 與五階段視覺驗收通過，確認非重複站姿 | WORK-001 |
| COMBAT-005 | P0 | 程序產生兵器只有共用 anchor，實際畫面有漂浮、比例錯誤與穿模 | VERIFY | 九類兵器逐一通過握點、方向、攻擊與死亡檢查 | WORK-002 |
| COMBAT-006 | P0 | action、body transform、weapon、VFX 與 death transform 曾疊加，攻擊及死亡畫面錯亂 | VERIFY | attack→hit→death→removed 連續證據通過 | WORK-004 |
| COMBAT-008 | P0 | move 曾只用整張 body 上下彈跳與速度線，腿部不換步；2026-08-29 產生器依皮膚啟發式把已朝右母圖 flop 成朝左，趙雲／黃忠／盜賊／力士／騎兵／董卓及全部 clone 倒退走 | VERIFY | 第一章我方、普通敵人與 Boss 的四幀步態朝位移方向前進、進入／停下銜接畫面通過 | WORK-004 |
| COMBAT-009 | P0 | 2026-08-29 實戰截圖顯示 64px 圖格細節流失，archer／strategist 與未精修武將會把舊肖像半身圖帶入戰場 | VERIFY | 96px 全身路徑通過 asset/browser gate，固定尺寸截圖無肖像 bust 且臉、甲、武器可辨識 | WORK-001、WORK-003、WORK-004 |
| UI-001 | P0 | 對角線／菱形裝飾不只出現在結算，也穿透每日、商城、活動與副本等命令面板 | VERIFY | 所有基準尺寸的主要面板與勝敗結算均無跨區裝飾線 | WORK-008 |
| UI-002 | P0 | 自動推關進入下一關時，`startStage()` 呼叫 `closePanel()`，會關閉玩家正在閱讀的武將、編隊、設定等面板 | VERIFY | stage transition 不關閉、不搶焦點、不重設使用者面板狀態 | WORK-008 |
| UI-003 | P1 | 訪客設定頁以 `activeUser.username` 顯示帳號，但訪客資料使用 `displayName`，畫面出現 `undefined` | VERIFY | 訪客與登入帳號均顯示正確名稱，缺值有核准 fallback | WORK-008 |
| UI-006 | P0 | 頂欄主公牌經驗數字在窄寬度換行疊字；點擊只加無樣式 `expanded` 且 `openPanel("profile")` 未呼叫 `renderLord()`，面板打不開 | VERIFY | 390×720 主公牌經驗為單行且不與 Lv／稱號重疊；點一次開啟主公軍府 | WORK-005、WORK-008 |
| UI-009 | P1 | 介面偏網頁表單／廉價卡片，未達直式手遊 App 材質品質 | VERIFY | 基準尺寸截圖確認鐵木指揮甲板＋紙卷軍帳＋朱砂印鈕一致，不像 SaaS | WORK-008 |
| UI-010 | P1 | 結算截圖曾可用滑鼠拖曳反白文字，右鍵會出現瀏覽器「另存圖片／複製圖片」選單，破壞遊戲 App 表面 | VERIFY | source／www UI smoke 皆確認遊戲根節點攔截 `selectstart`、`contextmenu`、`dragstart`；再補真機／WebView 人工走查 | WORK-008 |
| UI-011 | P1 | DOM 與 Canvas 曾混用系統楷體、微軟正黑及等寬英文字型；不同裝置字模不一致、標題老舊且細筆畫容易顯糊 | VERIFY | source／www 載入同一內建字型並通過 390／320px 排版 gate；再補 Android 實機字型與載入切換走查 | WORK-008 |
| UI-007 | P1 | 武將詳情長捲、神兵／共鳴／緣分重複；升級鈕在最底；緣分卡套用 44px 三欄 grid 變成直字 | VERIFY | 390×720 詳情頁升級列釘底可見；緣分 chip 橫排可讀；無重複神兵專區 | WORK-008 |
| UI-012 | P1 | 50 張頭像來源雖為 64×64，但不同 UI 槽位使用 4:5、方形與多套尺寸；張飛 portrait 曾錯用藍衣文士圖，與戰鬥身分不一致 | VERIFY | source／www 使用同一張正確張飛肖像；同類槽位維持正方形尺寸契約，390×720／320×568 與觸控橫向面板確認無裁切、拉伸或錯綁；手機名冊頭像統一 48×48 | WORK-008 |
| UI-013 | P0 | 2026-08-31 正式 UI smoke 會在可見入口拋出未定義全域：`currentArmyPower()`、`titleUnlocked()`、`ACHIEVEMENTS`、`campaignClears()`；主公軍府、成就、圖鑑、演武、問天樓與副本不可視為可玩 | VERIFY | 不注入 QA 假值即可逐一開啟所有可見入口、完成主要操作並關閉；console 無未捕捉例外 | WORK-014 |
| UI-014 | P1 | 命令面板開啟後焦點仍留在背景頁籤，Tab 可走到背景控制；Escape 關閉後不回原觸發器。登入／教學也讓背景戰鬥按鈕可被鍵盤聚焦 | VERIFY | 共用 modal manager 通過初始焦點、focus trap、背景 inert、Escape 與關閉回焦；鍵盤及 TalkBack 走查通過 | WORK-015 |
| UI-015 | P1 | 最末 UI 壓縮規則把 Boss 操作壓為 88×30px，資源、底欄及必要說明降為 10–13px | VERIFY | 390×720、430×932、320×568 所有可操作目標至少 44×44px，必要文字至少 14px，無重疊或裁切 | WORK-016 |
| UI-016 | P1 | 軍務抽屜一次暴露 11 個入口；設定頁混入公告、重複改名、手動存檔、無版本檢查的假回饋、未配置 IAP 的恢復購買，且改名／回報／重置仍用原生 `prompt`／`confirm` | VERIFY | 入口依首章矩陣 Keep／Lock／Hide；假功能與重複入口移除；所有確認與輸入使用遊戲內元件 | WORK-015、WORK-017 |
| UI-017 | P1 | 主線目標列 DOM 被 `css/ui-overhaul.css` 隱藏；關卡 HUD 另把同一關次重複成「4-5 · 關名 · 5」 | VERIFY | 主線目標在三秒測試內可理解且不遮戰場；關卡只保留章－關與名稱，不重複末碼 | WORK-014、WORK-017 |
| QA-002 | P0 | 2026-08-31 `npm test` 因 top HUD CSS gate 失敗，`npm run test:ui` 因 runtime 未定義全域中止；目前規格與舊證據曾仍宣稱兩者通過 | RESOLVED | 修正產品與測試後兩個 gate 均通過，文件只引用同次可重現輸出 | WORK-014、WORK-018 |

## 本輪 UI 全面稽核（2026-08-31）

| 項目 | 證據與判定 |
|---|---|
| 尺寸抽查 | `390×720`、`430×932`、`320×568` 未見主要幾何重疊；`720×390` 旋轉提示有效。這只證明代表畫面幾何，不代表全部入口可操作 |
| 正式功能 smoke | `npm run test:ui` 在缺少 runtime 全域時中止；以 QA 假值續查只能形成排版證據，禁止計為 PASS |
| 焦點操作 | 武將面板打開後焦點仍停在背景「武將」，Tab 移到背景「編隊」；關閉後未回觸發器。登入／教學初始焦點為 `BODY`，背景控制仍可聚焦 |
| 尺寸底線 | 首領鈕實測 88×30px；底欄、資源與設定頁多處必要文字 10–13px |
| 資訊架構 | 右欄只留「更多」方向正確，但抽屜 11 入口與設定混入公告、假版本檢查、未配置購買恢復及重複改名，首章負擔仍過大 |
| 完整規格 | 每畫面調整、入口去留、共用 modal contract、程式位置、產圖清單與驗收順序見 [UI 全面修正與資產產圖規格](../work/ui-remediation-and-asset-plan.md) |

## 本輪 UI 排版優化（2026-08-29）

| 項 | 已確認 |
|---|---|
| Design tokens／按鈕／Toast／登入 | `css/base.css` 重寫：鐵木＋朱砂金線、可讀字級、觸控 44px |
| 頂欄擠壓 | 改三段：主公牌｜關卡匾｜速度；移除死控件視野滑桿佔位 |
| 缺樣式面板 | 補 `mode-banner`／`tactic-card`／敵將預告／結算統計／設定列／圖鑑卡／征戰章節卡與關卡列 |
| 功能漏字 | 日務用 `task.name`；征戰章節不用不存在的 `icon`／`desc`；`TaoyuanBattle.setStage` 供 gate 測試 |
| 自動驗收 | `npm run test:ui`：16 面板開關＋主公牌點一次開軍府＋HUD 字級／速度鈕＋征戰卡＋slice gate＋解鎖後再開 |

## 本輪 UI 重整（2026-08-30）

| 項 | 已確認 | 仍缺 |
|---|---|---|
| 指揮條與底部甲板 | `css/ui-redesign.css` 改為兩列頂欄、獨立關卡／波次欄、48px 右欄、58px 資源列＋78px 五頁籤 | 390×720、430×932、320×568 截圖與實機人工檢查 |
| 日常任務列 | `taskCardHtml()` 改為 badge／main／action 語意結構，進度與獎勵不再靠裸 div／漂浮「日」 | 任務、簽到、disabled／claimed 狀態的固定尺寸截圖 |
| 面板殼 | 內容區改為單一滾動 owner，移除命令面板內部的相互覆蓋依賴 | 所有 16 面板截圖與 keyboard／TalkBack 走查 |
| 入口責任與去重 | 主公軍府移除編隊／名將／戰役／圖鑑捷徑；進度摘要改為靜態資訊；圖鑑移除稱號／頭像框管理；主線 chip 改為狀態提示 | 需補所有面板截圖與無障礙走查 |
| 主公牌頭像完整顯示 | 小尺寸頭像改用完整肖像 contain 縮放與深色底材，避免 cover 裁掉頭盔／鬍鬚／肩線 | 需補真機 390×720 截圖 |
| HUD／面板文字重疊與模糊 | 資料／按鈕改用清晰無襯線字、降低陰影、長字串設獨立欄位與省略；切換面板重設 scrollTop；UI smoke 抽查不同兵種武將 | 需補 390×720、320×568 真機字體與截圖走查 |
| 瀏覽器原生選字／拖圖／右鍵選單 | 依參考案規範加入 `user-select: none`、`selectstart`／`dragstart`／`contextmenu` 文件級攔截，輸入欄保留文字選取例外；UI smoke 已加入三項事件 gate | 仍需補真機／WebView 長按與右鍵人工走查 |
| 全遊戲字型 | 內建 `Huninn Game`；DOM／按鈕／HUD／結算／Canvas 共用字模，數字啟用等寬特性，OFL 授權隨檔保存 | 仍需補 Android 實機字型載入及戰鬥飄字人工走查 |
| UI-005 | P1 | 武將詳情有頭像／屬性重疊，戰法頁出現溢出的 `ACTIVE ARMY PASSIVE` 內部英文標籤 | VERIFY | 武將詳情與戰法頁於基準尺寸無重疊、溢出或內部英文標籤 | WORK-008、WORK-010 |
| GAMEPLAY-001 | P0 | 3×3 位置會影響實戰與 lane bonus，但編隊 UI 只能增減成員，沒有可用的換位操作 | VERIFY | 玩家可編輯、保存與還原位置，且站位差異有可重現戰果 | WORK-009 |
| GAMEPLAY-002 | P1 | 演武、塔與副本目前主要以總戰力門檻立即判定結果，沒有進入正式戰鬥 | VERIFY | 可見的戰鬥型副模式至少一個使用完整戰鬥、勝敗與獎勵流程；其餘隱藏 | WORK-101、WORK-105 |
| ECON-001 | P1 | 裝備可免費輪換全部資料，商城本地兌換多為一次性且按鈕仍寫「領取」，缺少真實取得與持續消耗 | VERIFY | 裝備有擁有／掉落／比較；商城行為與文案一致並有可測試消耗循環 | WORK-011、WORK-104 |
| DATA-001 | P0 | 敵將組合引用 `huangzhong`，但敵將資料沒有同 ID，預覽、篩選與實戰可能落入 fallback | VERIFY | 所有關卡敵將 ID 通過完整性檢查，預覽與實戰身份一致 | WORK-003 |
| CONTENT-001 | P1 | 章節卡片使用歷史章名，但首關名稱由循環前綴生成，出現桃園結義對應官渡烽煙等語意錯配 | VERIFY | 第一章 10 關及後續開放章節的章名、關名、敵人與 Boss 一致 | WORK-012 |
| CONTENT-002 | P1 | 成就與面板可見「桃園初陳」「玉璇」「連環妁殺」、繁簡混用等文字錯誤 | VERIFY | 全量繁中與名詞校對通過，無已知錯字、繁簡混用或內部英文 | WORK-107 |
| MOTION-001 | P1 | 規範禁止全畫面震動，但 `runtime.shake` 與 Canvas translate 仍存在 | VERIFY | 改成局部回饋，reduced motion 下完全停止 | WORK-006 |
| QA-001 | P0 | 現有 browser smoke 約數秒即可通過，實測 `drawStats.boss = 0` 仍為 PASS，未涵蓋完整攻擊、死亡、Boss、勝敗與結算畫面 | VERIFY | 自動流程對完整勝敗、Boss draw、death／removed、settlement 與 panel persistence 建立硬斷言及畫面證據 | WORK-007、WORK-013 |
| PROCESS-001 | P1 | 舊 roadmap／completion 的勾選曾被當成目前完成證明 | VERIFY | 文件分層、內部連結與維護規則通過檢查，後續完成宣告均附證據 | 本次文件整理 |

## 本輪修正與證據（2026-08-29 多角色閘門）

| 項 | 已確認 | 仍缺 |
|---|---|---|
| 隱形 Boss（yuanshao／zhurong／simayi） | `BOSS_ACTION_SPRITE_BY_GENERAL` 改走英雄 sheet；`AUTHORED` 只列磁碟存在之 4 Boss；asset gate 斷言 AUTHORED ⊆ 檔案 | 專屬 Boss 圖集（P1） |
| 入口誠實 | 右欄「排行」→「日務」；演武台→演武場；`sliceGate` 鎖活動／試煉／塔／副本／演武 | 實機點擊 toast 截圖 |
| 章關敘事 | 第一章敵將去河北猛將；第10關「渠帥末路」；HUD 顯示章名＋關名 | 全章列表人工對讀 |
| 裝備假深 | `createOwnedEquipment` 僅開局四將負載 | 掉落循環畫面 |
| 腳步塵 | 還原 move dust／坐騎揚塵 | — |

---

## 本輪修正與證據（2026-08-29）

程式與資料已改；關閉條件要的畫面／實機證據多數尚未取得。故全部仍為 `VERIFY`，不得當成可發布。

| ID | 已確認的自動／程式證據 | 仍缺 |
|---|---|---|
| COMBAT-001 | `spawnWave(true)` 先 `hideEnemyPreview()`、清對話、只留橫幅；browser QA 斷言中央 overlay ≤ 1 | Boss 出場截圖／影片 |
| COMBAT-002／004／009 | `attack-manifest` v6；59 張 96px `v3` 基線覆蓋全 50 名武將、5 類敵軍與 4 名 Boss，劉備／關羽／張飛／趙雲另有 128px `v4` 戰鬥試製。v3／v4 去背均清除封閉棋盤島與小型跨格碎片，unit 生成時固定 `combatSpriteId`，move／attack／idle 共用同一身份；asset gate 驗證全 59 個單位尺寸、alpha 與外緣色帶；source browser QA 載入四張 1024×640 v4 圖集與 96px v3 圖集，記錄 `body=0`、`action>0`、`move>0`、`boss>0`，且 [390×720 畫面](../../artifacts/combat-detail-v4-identity-lock.png) 無角色矩形髒底或跨角色衣武碎片 | 仍缺五階段、八方向與完整生命週期固定尺寸畫面包 |
| COMBAT-003／DATA-001 | `huangzhong` 入敵將表；`enemyIdentityMap`；smoke 查關卡 ID 與對應 body 檔 | 抽樣關卡預覽＝實戰畫面 |
| COMBAT-005 | 九類兵器各有 `anchor`；核准 `v3` action 內嵌手部相連兵器，renderer 不重複疊外部兵器 | 攻擊／死亡穿模畫面 |
| COMBAT-006 | 五階段由單一 `action` 驅動；死亡立即清除 action／attackFrame／weaponSwing；核准 action sheet 接續繪製死亡淡出（`useDeadSprite`），不再疊加 body／weapon transform 且消除死亡瞬間消失缺陷 | attack→hit→death→removed 影片 |
| COMBAT-008 | 全 59 個戰鬥單位使用 96px 四幀 `v3` move strip；runtime 僅在 `unit.moving` 推進 frame；移除整體上下彈跳與常駐速度線。2026-08-29：目視全部現行 move／attack 母圖朝右；皮膚啟發式曾把趙雲／黃忠／盜賊／力士／騎兵／董卓／張角誤判朝左並 flop，clone 全表倒退走。產生器 flop set 已清空，asset gate 斷言為空 | 移動→停下→攻擊銜接影片與腳底接地畫面 |
| UI-001 | `.header-ornament { display: none; }`；命令卡改 180deg | 各面板基準尺寸截圖 |
| UI-002 | `startStage(..., { keepPanel })`；自動推關帶 `keepPanel: true` | 開著設定面板推關的畫面 |
| UI-003 | `accountDisplayName()`；訪客補 `username` | 訪客設定頁畫面 |
| UI-004 | `.compact-hud` + `360px` media | 390×720／320×568 三秒測試 |
| UI-005 | 詳情改 grid；戰法文案改中文；無 `ACTIVE ARMY PASSIVE` | 詳情／戰法頁截圖 |
| UI-006 | `openPanel("profile")` → `renderLord()`；主公牌首擊開面板；經驗分數改疊在條上單行；`test:ui` 斷言不溢牌、不疊 Lv | 實機 390×720 點擊截圖 |
| UI-007 | 詳情改釘底 `hero-detail-dock`；緣分 `hero-bond-chip`；神兵合進裝備列；列傳 `hero-bio-fold`；`test:ui` 斷言升級列可見、無 collection-card 直字 | 390×720 張飛詳情截圖 |
| UI-008 | 歷史證據：當時右欄改設定／郵件／日務／更多並補抽屜；2026-08-31 已由 UI-013～017 與 QA-002 推翻「目前通過」解讀 | 依新 UI 規格重新驗收右欄／軍府／結算 |
| UI-009 | 歷史證據：當時完成鐵木紙卷朱砂材質與登入語氣；材質可沿用，但 2026-08-31 的功能、尺寸與焦點 gate 未通過 | 依新 UI 規格重跑固定尺寸與實機驗收 |
| GAMEPLAY-001 | `formation-slot-swap` + `swapFormationSlots()` | 換位保存／重載與戰果差 |
| GAMEPLAY-002 | 問天樓、演武場與日常副本全部對接正式戰鬥生命週期與專屬結算 | 各模式戰勝／戰敗畫面包 |
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
