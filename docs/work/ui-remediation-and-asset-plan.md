# UI 全面修正與資產產圖規格

狀態：ACTIVE IMPLEMENTATION SPEC。建立日期：2026-08-31。基準版本：`68b4c79`、source 根目錄、無頭 Chrome、DPR 1。

本文件把 2026-08-31 UI 實測轉成可執行規格，涵蓋入口去留、畫面責任、互動狀態、程式修改、響應式、無障礙、需要產圖的資產與驗收順序。問題狀態仍以 [已知問題](../issues/known-issues.md) 為準，工作優先級仍以 [目前工作清單](active-backlog.md) 為準。

## 1. 產品目標與本輪範圍

- Product pitch：玩家率領第一章可用名將，配置陣容與戰法後觀看兩軍自動交鋒，從清晰戰報取得資源並做下一輪養成決策。
- 平台：直式 Web/H5／Android WebView，390×720 為 authored viewport；430×932、320×568 與短高橫向必須有可理解降級。
- 核心循環：配置 → 自動戰鬥 → 波次／Boss → 勝敗與獎勵 → 養成／再戰。
- 本輪 Must：所有可見入口可用、面板不搶／漏焦點、必要文字與觸控合格、入口數量符合第一章垂直切片。
- 本輪 Should：重整設定、圖鑑、日務與主線提示；建立一致的系統圖示與空狀態圖。
- Later：完整 IAP、排行榜／多人、第二活動、塔與副本擴張、全 50 名將的全部營運入口。
- Remove／Hide：無資料、會拋例外、只有假回饋或外部服務未配置的入口。

## 2. 基準實測與判定

| 範圍 | 證據 | 判定 |
|---|---|---|
| 390×720 戰鬥 HUD | `artifacts/ui-redesign-battle-390.png` | 幾何穩定；字級與首領鈕過小 |
| 430×932 高螢幕 | `artifacts/ui-audit-tall-430x932.png` | 無水平捲動；戰場留白增加但可用 |
| 320×568 | `artifacts/ui-redesign-settings-320.png` | 面板未逃逸；10–13px 必要字仍過小 |
| 720×390 橫向 | `artifacts/ui-audit-landscape-720x390.png` | 旋轉提示完整覆蓋 |
| 登入／教學 | `artifacts/ui-audit-auth-390.png`、`ui-audit-tutorial-390.png` | 流程可跳過；初始焦點與背景 inert 失敗 |
| 16 個命令面板 | `npm run test:ui` | FAIL；多個入口引用不存在的資料／helper |
| 語法／文件 | `npm run check:syntax`、`npm run test:docs` | PASS；語法檢查無法發現執行期未定義全域 |
| 一般 smoke | `npm test` | FAIL；CSS 字串 gate 與目前樣式實作不一致 |

整體 gate：`FAIL／不可發布`。為繼續檢查幾何而注入的 QA 假值只能證明排版，不是功能通過證據。

## 3. 目標資訊架構

### 3.1 戰鬥畫面層級

1. 戰場、敵我單位與 Boss。
2. 當前威脅、波次與首領是否可挑戰。
3. 速度與首領主要操作。
4. 當前主線目標。
5. 四種資源與五個核心頁籤。
6. 日務、文書、設定等 meta 功能。

右側不恢復長串常駐圖示。第一章建議只常駐「日務」與「更多」兩個 44px 入口；郵件紅點可彙總到「更多」。若實測日務仍遮戰場，退回只留「更多」並使用聚合紅點。

### 3.2 第一章可見入口

| 入口 | 第一章狀態 | 調整 |
|---|---|---|
| 征戰 | Keep | 回戰場的唯一底欄入口 |
| 武將 | Keep | 只展開出戰、已結識與第一章可結識名將；其餘 37 名收進摺疊摘要 |
| 編隊 | Keep | 3×3 換位、dirty state、保存／還原 |
| 戰法 | Keep | 每場一個；強化與出戰狀態分開 |
| 戰役 | Keep | 第一章 10 關；後續章節只顯示單一鎖定摘要 |
| 日常軍務 | Keep | 日常／每週／簽到三分頁，避免九列與簽到串成單一長頁 |
| 軍中文書 | Keep | 有信、已領、空狀態三種 |
| 行商 | Keep | 只顯示本地兌換；原生商品無 SKU 時整區隱藏 |
| 系統設定 | Keep／Simplify | 只留帳號、音效、音樂、特效、畫質、通知、支援、重置 |
| 主公軍府 | Fix first | 主公牌唯一入口；名稱、稱號、頭像框與摘要集中於此 |
| 成就 | Hide until fixed | 補資料、領取防重與空狀態後再顯示 |
| 圖鑑 | Hide until fixed | 補關卡 helper 後改為勢力／緣分／寶物三分頁 |
| 活動／敕令 | Hide | 第一章垂直切片通過前不作常駐營運入口 |
| 名將列傳 | Hide until fixed | 完整戰鬥、勝敗與獎勵回歸通過後再開 |
| 演武場 | Hide until fixed | 同上；不可只靠戰力數字立即判定 |
| 問天樓 | Hide until fixed | 同上 |
| 日常副本 | Hide until fixed | 同上 |

## 4. 全域 UI Contract

### 4.1 視覺方向

- Aesthetic direction：**鐵木軍帳・朱砂軍令・米紙戰報**。
- Art pillars：威嚴、可讀、戰場優先。
- 戰鬥 chrome 使用鐵木；內容面板使用米紙；主要 CTA／危險使用朱砂；獎勵使用米金；成功使用暗玉。
- 同一畫面最多一個高亮 CTA；不可讓所有按鈕同時紅色、發光或呼吸。

### 4.2 尺寸與文字

- 主要控制、圖示按鈕、底欄與所有可能變為 enabled 的按鈕：最小 44×44 CSS px。
- 正文、資源、底欄、必要說明：至少 14px；主要按鈕與重要數字至少 16px。
- 320px 不准把必要文字降至 10–11px；應隱藏次要裝飾、縮短文案或改兩列。
- `#bossButton` 高度由 30px 恢復至少 44px；資源列最小 52px，底欄最小 72px。
- 關卡標題只顯示一次位置編號，例如「徐州烽火 4-5｜下邳古道」，禁止再接「· 5」。

### 4.3 Modal 與鍵盤

- `openPanel()`、登入、教學、離線獎勵與結算共用 dialog manager。
- 開啟時記錄觸發元素；背景 `battleScreen` 設 `inert`／`aria-hidden`；焦點移至標題或第一個有效控制。
- Tab／Shift+Tab 只能在最上層 modal 內循環；Escape 關閉最上層可關閉介面；關閉後焦點回到原觸發元素。
- 隱藏面板不得留在 tab order；切換面板後焦點回標題、scrollTop 歸零。
- `prompt()`／`confirm()` 全部改成遊戲內表單／確認 modal，包含改名、問題回報與重置存檔。

### 4.4 狀態與回饋

- 所有互動元件定義 normal、pressed、selected、disabled、loading、error、completed／claimed。
- disabled 必須同時提供文案原因與 aria-label，不只灰掉。
- 非同步動作按下後立即進 loading 並禁止重複提交；成功、錯誤、取消各有不同 toast／音效。
- 紅點只能代表實際未讀／可領；不可作無意義常駐裝飾。

### 4.5 響應式與動態

- 390×720：完整 authored layout。
- 430×932：外殼仍為 390px 寬；增加戰場垂直留白，不拉高角色比例。
- 320×568：隱藏次要副標與首領鈕小標，保留 14px 核心文案與 44px 操作。
- landscape／max-height 540：旋轉提示覆蓋並使背景控制不可聚焦。
- reduced motion：關閉脈動、裝飾浮動、全畫面 shake；不改戰鬥結果。

## 5. 逐畫面修正規格

### 5.1 首次登入

- 保留 App icon、遊戲名、Google 登入與訪客試玩。
- 合併兩段雲端同步說明；移除 Firebase Authentication、Firestore UID 等工程字眼，改成一行「登入後可跨裝置保存進度」。
- Google 未配置或不可用時停用按鈕並顯示明確原因；不要留一個看似可按但必定失敗的 CTA。
- 初始焦點放第一個可用登入方法；訪客與 Google 都至少 44px；錯誤訊息使用 live region。

### 5.2 教學

- 修正「众將」為「眾將」，全量繁中校對。
- 第一分鐘只教三件事：戰鬥自動進行、何時挑戰首領、去哪裡培養／編隊。
- 不在教學中介紹商城、活動、成就或未開放模式。
- 教學 modal 啟用 focus trap；跳過必須二次確認只在玩家已進入第二步後出現，避免誤觸。

### 5.3 戰鬥 HUD

- 保留主公牌、關卡／波次、速度、資源、首領、五底欄。
- 恢復精簡主線 chip：只顯示目標，不可點擊，不重複「戰役」入口。
- 首領未解鎖顯示「完成 3 波」；可挑戰時才使用朱砂與短脈動；Boss 進行中顯示「交戰中」。
- 右欄只留日務＋更多，或在 320px 退化為只有更多；抽屜只列目前可用入口。
- 大型對話維持底部安全 lane，技能連發時改成佇列或冷卻，不得長駐遮住下排武將。

### 5.4 共用命令面板

- Header 固定 64px：返回／標題／關閉；返回只在詳情層顯示。
- Content 為唯一滾動 owner；底部 dock 固定但不得超過可視高度 24%。
- 對話框開啟時背景 inert；面板切換後聚焦標題。
- Close／Back 皆 44px，且具有可見 focus ring、pressed 回饋與 aria-label。

### 5.5 主公軍府

- 先補 `currentArmyPower()`、`titleUnlocked()`，再開放入口。
- 主公名稱編輯移入軍府，取代設定頁「主公稱號／更改名稱」的混淆項。
- 只放身份、等級／經驗、軍勢摘要、稱號、頭像框；不重複武將／編隊／戰役導航。
- 裝備中、可裝備、未解鎖三態要有文字與形狀差異。

### 5.6 武將與武將詳情

- 名冊預設：出戰 → 已結識 → 第一章可結識；其餘角色合併為「後續章節尚有 37 名」摺疊摘要。
- 排序與篩選使用 selected／aria-pressed；切換後保留合理 scroll position。
- 詳情保留身份、四維、戰法、裝備、緣分與列傳摺疊。
- 底部 dock 只保留一個主 CTA「升級」；升星／戰法／出戰為次操作；精煉／突破收在進階。
- 不以灰到不可讀的文字顯示鎖定原因；成本不足必須說明缺哪種資源。

### 5.7 編隊

- 3×3 槽位可點選互換；選中第一格後明確顯示「請選擇交換位置」。
- 變更後顯示 dirty state；保存後 toast 並回復 disabled；提供「還原未保存變更」。
- 站位加成以簡短 tooltip／說明列呈現，不在每格重複長文。

### 5.8 戰法

- 卡片只保留名稱、用途、目前等級、強化成本與出戰狀態。
- 已出戰使用 selected，不使用 disabled 偽裝；強化不足顯示缺少糧草。
- 頂部加入當前關卡敵情摘要，讓選擇有理由。

### 5.9 戰役

- 第一章只顯示 10 關；章名、關名、敵將與 Boss 使用同一資料來源。
- 已通關／當前／鎖定三態明確；掃蕩按鈕保持單行，費用放同列 chip。
- 後續 19 章用一張鎖定摘要取代 90 張不可操作卡。

### 5.10 日常軍務

- 改為「日常／每週／簽到」三分頁，保留 badge → main → action 結構。
- 每頁頂部可加入「全部領取」，但只在至少一項可領時顯示；必須使用同一防重獎勵契約。
- 進行中、可領取、已領取均有文字、圖形與顏色差異。

### 5.11 行商

- 本地資源交易用「兌換」，不要使用「領取」。
- 不存在正式 SKU／IAP 插件時隱藏原生商品與恢復購買，不以停用卡片長期佔位。
- 兌換後立即更新資源、按鈕狀態與 toast；快速雙擊只能扣款／發獎一次。

### 5.12 文書

- 有信時顯示寄件者、摘要、附件與已領狀態；已領後按鈕變成狀態標籤。
- 全部已讀時顯示空狀態，不保留一張永久補給信冒充持續內容。

### 5.13 成就

- 在 `GAME_DATA` 建立第一章最小成就資料，再顯示入口；禁止引用不存在的 `ACHIEVEMENTS`。
- 第一版只需征戰、養成、編隊、Boss 四類共 6–8 項；不做大量空白成就。
- 進度、可領、已領與防重保存必須通過刷新／雙擊回歸。

### 5.14 圖鑑

- 先補 `campaignClears()` 或改用單一可驗證的 `save.maxStage` helper。
- 改為勢力／緣分／寶物三分頁；稱號與頭像框仍只在主公軍府。
- 里程碑領取後顯示已啟動，不再保留可按樣式。

### 5.15 演武、問天樓、日常副本、列傳、活動

- 在 `currentArmyPower()` 與正式戰鬥生命週期未通過前全部從玩家入口隱藏。
- 重新開放條件：能進戰鬥、能勝／敗、能重試、獎勵只發一次、返回原面板、console 無錯。
- 同一版本最多開放一個副模式做完整驗證，其餘維持 Later，避免第一章被 meta 系統淹沒。

### 5.16 系統設定

- 帳號：登入狀態、切換帳號、登出。
- 音訊與顯示：音效、音樂、戰場特效、畫質、通知。
- 支援：隱私政策／客服連結、版本文字；只有真正能檢查更新時才顯示按鈕。
- 危險操作：重置存檔，使用遊戲內二次確認並要求輸入主公名或長按確認。
- 移除／搬移：系統公告移到文書；主公改名移到軍府；手動儲存移除；未配置 IAP 時恢復購買隱藏；問題回報必須接上真實傳送端點才顯示。

### 5.17 結算與離線獎勵

- 保留勝敗、獎勵、MVP／傷害與兩個後續操作。
- 開啟前清除其他中央 overlay；主按鈕點擊後 loading 並鎖定兩個操作，避免重送。
- 敗北要顯示可理解的成長建議，不只「再戰」。
- 離線雙倍只有獎勵廣告可用時才顯示；不可用時只留正常領取，不放一個必定失敗的 CTA。

## 6. 工程修改地圖

| 檔案 | 修改責任 |
|---|---|
| `data/game-data.js` | 加入第一章成就資料；統一章／關名稱來源 |
| `js/game/game-core.js` | 實作並匯出 `currentArmyPower()`、`titleUnlocked()`、關卡完成 helper；避免 UI 自行重算 |
| `js/game/game-ui-base.js` | dialog manager、focus trap、inert、焦點返回、遊戲內 confirm／prompt；入口 gate |
| `js/game/game-ui-panels.js` | 設定減量、日務分頁、成就／圖鑑資料來源、軍府改名、空狀態 |
| `js/game/game-ui-heroes.js` | 名冊範圍摺疊、selected state、dock 次序、編隊 dirty state |
| `js/game/game-ui-modes.js` | 隱藏未驗收副模式；戰役只列第一章；統一 power helper |
| `js/game/game-main.js` | modal 鍵盤事件、背景 inert、非同步防連點、入口綁定 |
| `index.html` | 精簡右欄與登入技術文案；主線 chip 決定顯示；補 dialog 語意容器 |
| `css/ui-overhaul.css` | 移除 10–13px 與 30px CTA 的末端覆寫；只留真正新契約 |
| `css/hud.css`／`panels.css` | 成為尺寸與元件狀態的唯一來源，減少同 selector 多檔互蓋 |
| `scripts/ui-function-smoke.js` | 未定義全域 hard fail、所有可見 route、44px、14px、focus trap、焦點返回、入口誠實 |
| `scripts/smoke-test.js` | 以 runtime geometry／DOM contract 取代脆弱 CSS 字串存在斷言 |

## 7. 資產產圖規格

功能與入口完成前不先產大批裝飾。所有新資產先交付無文字透明圖，文字與狀態由 DOM 控制。

### 7.1 AI STYLE LOCK

- Rendering：正統 32-bit 精緻點陣像素，硬邊、清楚像素階梯，不使用柔焦、照片筆刷或向量扁平 icon。
- Shape：厚重、方正、略帶切角；輪廓先於內部紋樣；同組視角與光向一致。
- Palette：鐵灰／深木褐為主，米金高光，朱砂只作危險／主要 CTA，暗玉只作成功。
- Material：青銅、黑鐵、漆木、米紙；禁止玻璃、塑膠、霓虹、藍紫科技漸層。
- Lighting：左上暖金主光，右下短硬陰影；禁止四周均勻外發光。
- Alpha：透明背景、邊緣無黑框／白邊／棋盤底；圖形與畫布至少保留 6px 安全距離。
- Text：資產內不得生成中文字、英文字、數字或假字；標籤一律由 DOM 排版。
- Delivery：WebP lossless；保留無損 PNG master；顯示時使用 `image-rendering: pixelated`。

### 7.2 既有資產判定

| 類型 | 判定 | 說明 |
|---|---|---|
| 五底欄 `nav-*` | Keep | 身分清楚，先修字級與 selected state，不重畫 |
| 四資源 `res-*` | Keep | 可讀且同組；不要新增貨幣 |
| 右欄 `icon-daily/mail/settings/menu/shop/...` | Keep／Adjust | 目前可用；未開放入口的 icon 不應促使入口提前顯示 |
| `seal-taoyuan`、`seal-victory` | Keep | 登入、教學、勝利識別已成立 |
| 設定列小圖示 | Replace as a set | 現況混用既有功能 icon，語意與色階不一致 |
| 面板紙卷／鐵木背景 | Keep first | 當前截圖已有一致材質，先清 CSS cascade；不急著產大圖 |

### 7.3 必須產圖：系統設定／支援圖示組

共同規格：每張 64×64、透明背景、主體 44–48px、同一左上光、WebP lossless；UI 顯示 24–28px。

| 檔名 | Subject | 色彩重點 | 用途 |
|---|---|---|---|
| `ui-setting-account-v1.webp` | 青銅虎符與小型人形印記 | 青銅＋米金 | 帳號／登入 |
| `ui-setting-sound-v1.webp` | 古戰鼓與單道聲波 | 木褐＋米金 | 操作音效 |
| `ui-setting-music-v1.webp` | 編鐘或古琴弦徽 | 青銅＋暗玉 | 背景音樂 |
| `ui-setting-vfx-v1.webp` | 交叉刀光與一點火星 | 鐵灰＋朱砂 | 戰場特效 |
| `ui-setting-quality-v1.webp` | 銅框山河畫卷與清晰菱紋 | 青銅＋米紙 | 畫面品質 |
| `ui-setting-notification-v1.webp` | 軍營銅鈴與小紅繩 | 青銅＋朱砂 | 推播通知 |
| `ui-setting-support-v1.webp` | 軍報卷軸與羽筆 | 米紙＋暗玉 | 客服／問題回報 |
| `ui-setting-purchase-v1.webp` | 封緘錢袋與回轉箭頭 | 米金＋暗玉 | 恢復購買；僅 IAP 開放後使用 |
| `ui-setting-reset-v1.webp` | 破裂軍令牌與警示缺口 | 鐵灰＋朱砂 | 重置存檔 |

提示詞主幹：

> refined 32-bit pixel art game UI icon, Three Kingdoms military camp, single centered object, heavy bronze and lacquered wood material, warm gold key light from upper left, short hard shadow to lower right, crisp stepped pixel edges, limited iron-gray wood-brown rice-gold palette, transparent background, no text, no letters, no numbers, no glow halo, no card frame, no photorealism

每張把 Subject 接在主幹後方，保持完全相同的鏡位、縮放與光向。

### 7.4 必須產圖：狀態徽記組

共同規格：32×32 transparent WebP，主體 22–26px，不承載文字。

| 檔名 | Subject | 狀態 |
|---|---|---|
| `ui-state-locked-v1.webp` | 鐵鎖扣住小軍牌 | 未解鎖 |
| `ui-state-coming-soon-v1.webp` | 封蠟覆住卷軸 | 尚未開放 |
| `ui-state-claimed-v1.webp` | 暗玉勾印 | 已領取／完成 |
| `ui-state-sync-v1.webp` | 兩片相扣雲紋軍符 | 同步中／已同步 |
| `ui-state-error-v1.webp` | 朱砂裂紋警示印 | 錯誤／同步失敗 |

這組只輔助文字狀態，禁止以 icon 單獨傳達必要資訊。

### 7.5 Should：空狀態插圖

共同規格：160×96 transparent WebP，主體位於中間 120×72 安全區，低對比，不搶標題與 CTA。

| 檔名 | 畫面 | Composition |
|---|---|---|
| `ui-empty-mail-v1.webp` | 無文書 | 空木案、合起卷軸、熄滅小燈 |
| `ui-empty-achievement-v1.webp` | 無成就資料／全數完成 | 收起的勳章匣與一枚暗玉勾印 |
| `ui-empty-collection-v1.webp` | 圖鑑尚未解鎖 | 合起兵書、鐵鎖與淡化勢力印 |

空狀態插圖只有在對應功能本身可用後才產；不可用空圖掩蓋資料錯誤。

### 7.6 Conditional P2：九宮格 UI 皮膚

只有在 CSS 去重、字級與層級修正後的固定尺寸截圖仍顯得像網頁 card，才製作下列 9-slice 資產：

- `ui-frame-paper-9slice-v1.webp`：96×96，24px corner，米紙＋青銅內線。
- `ui-frame-ironwood-9slice-v1.webp`：96×96，24px corner，漆木＋黑鐵。
- `ui-button-cinnabar-9slice-v1.webp`：96×48，16px corner，主要 CTA normal。
- `ui-button-cinnabar-pressed-9slice-v1.webp`：96×48，同輪廓下壓 2px。
- `ui-button-iron-9slice-v1.webp`：96×48，次操作 normal。
- `ui-button-disabled-9slice-v1.webp`：96×48，實色暗灰且仍保留邊界。

AI 產出後必須人工修正四角對稱、可平鋪邊線與 slice seam；未通過 320／390px 拉伸檢查不得接入。

### 7.7 不應產圖

- 不把中文字、按鈕文案、價格、關卡名烘焙進圖片。
- 不為被隱藏的演武／問天／副本／活動先畫大型 banner。
- 不重畫目前可用的底欄、資源與勝利印，只因想「更華麗」。
- 不用 AI 產圖替代 focus ring、toggle、progress、loading、disabled 等應由 DOM／CSS 驅動的狀態。
- 不在本輪增加新的貨幣 icon、紅點、稀有度框或無實際功能的裝飾章。

## 8. 生產順序

### Phase 0 — 入口誠實（P0）

1. 隱藏成就、圖鑑、演武、問天、列傳、活動等會拋例外或未驗收入口。
2. UI smoke 加入所有可見 route 的 exception hard fail。
3. 更新目前規格與問題狀態，不再宣稱 `test:ui` 通過。

### Phase 1 — 功能依賴（P0）

1. 實作 `currentArmyPower()`、`titleUnlocked()`、關卡完成 helper。
2. 建立成就資料來源；修正圖鑑／稱號／寶物操作。
3. 跑每個面板開啟、操作、關閉與刷新保存。

### Phase 2 — Modal／輸入（P0）

1. dialog manager、focus trap、背景 inert、焦點返回。
2. 原生 prompt／confirm 改遊戲內 modal。
3. 非同步與領獎防雙擊。

### Phase 3 — 尺寸與 CSS 單一來源（P1）

1. 刪除 `ui-overhaul.css` 中覆蓋 14px／44px 的 compact 規則。
2. HUD／panel selectors 各自只保留一個權威檔案。
3. 390、430、320、landscape、200% zoom 幾何驗收。

### Phase 4 — 資訊架構減量（P1）

1. 抽屜只留可用入口；設定刪除假功能與重複責任。
2. 日務／圖鑑分頁、名冊範圍摺疊、主線 chip 恢復。
3. 關卡標題與繁中校對。

### Phase 5 — 產圖與視覺接入（P1／P2）

1. 先產設定圖示與狀態徽記；逐張 alpha／尺寸／同風格驗收。
2. 功能可用後才產空狀態插圖。
3. 固定尺寸 screenshot review 後決定是否需要 9-slice 皮膚。

### Phase 6 — 完整 QA

1. source／`www` 各跑 `npm test`、`npm run test:ui`、`npm run test:docs`。
2. 390×720 完整登入→教學→戰鬥→Boss→結算→養成→再戰。
3. 430×932、320×568、landscape、reduced motion、200% zoom。
4. 鍵盤 Tab／Shift+Tab／Enter／Space／Escape；Android TalkBack 與背景／前景。

## 9. 完成定義

- 所有可見入口不使用 QA 假值即可開啟、操作、關閉，console 無 error。
- 第一章看不到未完成模式；鎖定項只在玩家需要理解未來內容時出現一次。
- 所有 modal 有初始焦點、focus trap、Escape、焦點返回與背景 inert。
- 所有主要控制至少 44×44；必要文字至少 14px；320px 不降至 10–11px。
- 主線、關卡、波次、首領與下一個操作在三秒內可理解，且沒有重複關卡編號。
- 設定沒有假更新、假回報、未配置 IAP 或重複手動存檔入口。
- 新圖符合 STYLE LOCK、透明 alpha、無文字、無黑白邊與統一光向。
- `npm test`、`npm run test:ui`、`npm run test:docs` 全部通過；文件與程式現況同步。
- Android 實機完成觸控、字體、TalkBack、背景恢復與外部服務 fallback 後，才可把 UI gate 判為 PASS。

## 本輪實作與測試結果（2026-08-31）

已完成 P0 UI runtime 依賴、共用 modal focus trap／背景 inert／Escape 回焦、44px／14px UI contract、主線目標可見、關卡名稱去重、軍務抽屜入口 gate、設定頁去除假功能與遊戲內輸入／確認 modal。

自動化證據：npm run check:syntax、npm test、npm run test:ui、npm run test:docs 均須在提交前同版本通過；UI smoke 涵蓋 16 個面板、390／430／320px、抽屜滾動、主公軍府、成就／圖鑑／模式入口、modal focus trap 與固定尺寸截圖。

仍需產圖／人工驗收：設定圖示 9 張（64px）、狀態徽記 5 張（32px）、空狀態圖 3 張（160×96）依本文件第 7 節製作；另需 Android／WebView 字型、TalkBack、長按與完整戰鬥生命週期畫面。
