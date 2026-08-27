# 三國：群英再起 UI、文字與互動規範

狀態：強制的產品底線。這份文件是本專案的 UI source of truth；新增畫面、面板、按鈕或動畫前先套用與本次改動直接相關的條目。

## 1. 視覺方向

一句話：**古戰場像素軍帳，使用朱砂、鐵灰、木褐與米金打造有重量的三國放置 RPG。**

三個視覺支柱：

1. 戰場先於介面：玩家第一眼看到敵軍、武將與危險狀態。
2. 材質先於卡片：木、鐵、紙卷、金線可被感覺到，不做 SaaS dashboard。
3. 角色先於換色：武將要靠頭冠、鬍鬚、甲冑、兵器、待機與技能特效辨識。

禁止把所有內容做成同一種圓角卡片、玻璃透明、藍紫漸層或 emoji 圖示列。若使用 CSS 暫代材質，必須列入後續素材替換清單。

## 2. 表面家族

同一個列表或面板只能選一個主要表面家族，不可黑白混成網頁表格。

| 家族 | 用途 | 底材 | 文字 |
|---|---|---|---|
| 戰場鐵木 | 戰鬥 HUD、波次、資源列、底欄 | 深綠灰、鐵黑、木褐 | 米金、暖白、朱砂 |
| 軍帳紙卷 | 武將詳情、紙娃娃、說明、設定 | 米紙、灰褐、內框金線 | 深棕、墨黑 |
| 朱砂戰令 | 主要 CTA、首領、危險、確認 | 朱紅、深褐、金邊 | 米金、暖白 |
| 深色金線 | 戰報、排行、成就、獎勵狀態 | 深褐至黑褐漸層 | 淡金、暖白、成功綠 |

必要資訊不能只靠顏色；selected、disabled、claimed、locked 都要有文字、圖形或位置差異。

## 3. 視覺層級與三秒測試

每一個畫面必須讓玩家在三秒內回答：

- 我現在在戰鬥、武將、編隊還是設定？
- 下一個最重要的操作是什麼？
- 哪個敵人或獎勵最值得注意？
- 目前是可操作、危險、載入中、已完成還是已領取？

戰鬥畫面層級固定為：

1. 戰場與武將動作
2. 敵軍、首領與危險
3. 主要操作（自動、速度、首領挑戰）
4. 波次與關卡狀態
5. 資源與底部導覽
6. 排行、設定等 meta 功能

HUD 不得遮住敵軍生成區、主要戰鬥單位或底部操作。

## 4. 字體與文案

- 介面固定使用繁體中文；專有名詞維持三國語氣，避免突然出現 SaaS 用語。
- 正文與必要說明至少 14px；主要按鈕與重要數值至少 16px。
- 小於 12px 只能用於非必要角標，不得承載費用、解鎖條件、錯誤原因或獎勵。
- 重要按鈕使用單行文案；費用放在同一個按鈕內，例如「升級（70 銅錢）」。
- 不重複顯示同一資訊；獎勵圖示與可見幣種名稱二擇一，完整名稱保留在 aria-label 或 title。
- 數字使用等寬數字或固定寬度欄位，避免資源列與戰鬥飄字跳動。

## 5. 行動觸控與響應式

- 所有可點擊的主要按鈕、圖示按鈕、導覽項最小 44×44 CSS px。
- 不依賴 hover；pressed、selected、disabled 必須在觸控上也可辨識。
- 互動區不能貼到劉海、手勢列或螢幕邊緣；使用 safe-top、safe-bottom。
- 直式基準尺寸是 390×720，容器可擴展到 430px；超窄、高螢幕、橫向都要有降級策略。
- 戰場 canvas 使用像素化渲染與固定內部座標，不用 CSS 拉伸角色比例。
- 不用負 margin、絕對定位或 z-index 硬蓋來解決不確定的溢位；先修 layout anchor。
- 短螢幕優先縮減裝飾與次要資訊，不縮小主要按鈕到不可按。

## 6. 元件狀態

每個互動元件至少定義：

- normal
- hover（桌面才需要）
- pressed
- selected
- disabled
- loading
- error
- completed 或 claimed（若有領取流程）

disabled 不能只用 opacity；要有實色、文字原因與不可操作的語意。若原因不明顯，aria-label 必須說明原因。

## 7. 動畫與回饋

- pressed 使用短促的位移或 scale 0.97～0.99，不做長時間浮動。
- 面板進出、toast、獎勵揭示使用短轉場；不要讓所有卡片同時 stagger。
- 成功、拒絕、載入中、首領出現要有不同的視覺語彙與音效。
- 攻擊、受擊與角色待機不可互相重啟造成抖動；動作狀態由單一時間軸驅動。
- 不使用常駐呼吸、全畫面震動或過度發光搶走戰場焦點。
- prefers-reduced-motion 時停用裝飾動畫，保留必要狀態變化與可操作性。

## 8. 紙娃娃與角色識別

- 紙娃娃固定維持角色底圖、頭部細節、戰甲、兵器、坐騎標記、信物層的清楚層級。
- 點擊裝備槽後，戰場、武將卡、詳情畫面要同步更新外觀與數值。
- 裝備槽要顯示目前名稱、加成與可點擊提示；不能只靠圖示猜用途。
- 不用顏色作為武將唯一識別；每名武將至少有一個輪廓、裝備、動作或技能差異。
- 高階坐騎至少具備獨立物種輪廓、馬鎧／鬃毛、裝飾或像素 VFX；不能只靠換色區分。
- 角色立繪或像素圖不可拉伸、裁掉武器、露出透明髒邊或穿透 UI。

## 9. 無障礙最低線

- html lang 使用 zh-Hant；彈窗使用 role dialog、aria-modal、aria-labelledby。
- 動態對話、戰報、toast 使用 aria-live；面板重繪後維持可讀標題。
- 所有按鈕可鍵盤操作，focus-visible 外框不可移除；Escape 關閉面板。
- selected、expanded、pressed、disabled 同步 aria 狀態。
- 裝飾圖使用 aria-hidden；資訊圖示由父容器或 aria-label 提供完整語意。
- 對比度、文字大小與觸控規範以 accessibility-wcag.md 為準。

## 10. 禁止廉價網頁遊戲感

驗收一句話：**玩家要覺得在玩三國手遊，不能一眼看出這是網頁。** 通過 Web 技術實作，但表面必須是原生直式手遊。

不合格（任一即退回）：

- 工具列／書籤列：兩排以上同造型小圓鈕、8–11px 標籤、漢堡選單再疊一排 icon
- 網頁卡片：每區都是同一種圓角 card、細 1px 邊、玻璃透明、dashboard 留白
- 網頁字級：關卡名被截成半行、資源數字小於 14px、底欄小於 14px
- CSS 佔位感：clip-path 隨便切一塊當按鈕、英文 eyebrow、Times New Roman、VS／LOCAL／DAILY 當裝飾
- 介面搶戰場：HUD 四面夾擊，武將比按鈕還小

合格底線：

- HUD 是軍帳物件：鐵條、木牌、朱砂印、金線內框，有厚度與投影，不像 HTML 按鈕列
- 右側常駐最多 4 個快捷＋「更多」；更多必須是軍務清單（15px 列高 44px），禁止第二排迷你 icon
- 頂欄通寬指揮條，關卡與波次完整可讀，不截成 48px
- 底欄是指揮甲板：資源槽＋朱砂首領印＋五個雕刻頁籤
- 面板是紙卷軍帳，不是白底表單

## 11. 不可直接套用的做法

- 不直接複製 IncenseAshes 的畫面、神明素材、顏色或頁面骨架。
- 不因「看起來像遊戲」而新增 emoji chrome、重複 icon＋文字、無意義的紅點或常駐 toast。
- 不把未完成功能偽裝成可領獎、已同步或已儲存。
- 不在未定義 UI Contract 前大量堆 CSS。

## 12. UI 驗收

- 390×720 直式：主 CTA、底欄、資源與紙娃娃均可操作且不裁切。
- 430×932 高螢幕：上方 safe area 與底部手勢區不遮內容。
- 320px 以下：文字不重疊，非必要裝飾可隱藏。
- 橫向短高：顯示旋轉提示，不讓戰鬥 UI 半截露出。
- 檢查 normal、pressed、selected、disabled、claimed、loading、error。
- 檢查無障礙名稱、焦點、對比與 reduced-motion。

## 13. 戰鬥角色、敵人與兵器硬契約

角色畫面以「剪影可辨識、透明背景、腳底定位、兵器握在手上」為最小單位。以下任一情況直接判定不合格：

- 角色、敵人、Boss、手臂或兵器外圍出現黑框、不透明卡片底、方形遮罩、debug hitbox 或整格 Sprite 背景。
- 用矩形、色塊、線段拼成的暫代身體或兵器被當成正式畫面；受擊特效也不得用角色大小的實心方塊。
- 攻擊時只剩兵器／手臂而身體消失，或同時疊出兩具身體、兩把兵器。
- 兵器沒有落在手部 anchor、方向反轉、比例超過角色、穿過頭臉、浮在空中或死亡後殘留。
- 我方使用正式圖，普通敵人或 Boss 卻退回幾何人偶；核心戰鬥單位不得有品質分級落差。

資產要求：

- 靜態身體與動作格均使用透明 WebP；每格外圍 alpha 必須透明，foot anchor 與裁切框一致。
- 核心武將、普通敵人類型與 Boss 缺圖時讓測試失敗；普通敵將可使用事先核准、風格一致的透明 alias，但不能臨時畫方塊。
- 兵器 manifest 必須定義畫布、握點、尖端方向與用途；inventory icon 不可直接放大當戰鬥兵器。
- 資產產生器只是製作工具，不是美術驗收。尺寸與檔案存在通過後，仍需檢查輪廓、握法、材質與八方向畫面。

## 14. 戰鬥狀態與生命週期

我方、普通敵人與 Boss 都必須逐一驗收：

| 狀態 | 最低要求 |
|---|---|
| idle | 身體、坐騎與兵器穩定；無黑框、重影或不必要常駐晃動。 |
| move | 朝向正確、腳底不漂移、步態不重置攻擊；進場到達 lane 後才可交戰。 |
| attack | anticipation／windup／contact／follow-through／recovery 由同一 action 時間軸驅動；身體與兵器只畫一次。 |
| hit | 短促可讀，不把角色洗成白色橢圓或方塊；不改變角色 anchor。 |
| death | 立即停止移動與攻擊，兵器跟隨或隱藏，淡出後完整移除；不可復活一格或留下殘影。 |

狀態切換不能由 CSS、Canvas 與 timer 各自猜測。戰鬥 action 是唯一來源；動畫完成、單位移除、波次推進與結算必須有固定順序。角色渲染或資產改動後，依 `qa-test-matrix.md` 與 `visual-qa.md` 逐狀態回歸。

## 15. 敘事覆蓋層預算

- 同一時刻最多一個中央覆蓋層：波次標題、首領橫幅、角色對話、全畫面教學、結算只能依序出現。
- 敵將預告固定在頂部資訊 lane，顯示不超過 2 秒、不可攔截觸控、不得覆蓋生成區或角色頭頂。
- 首領出場使用短橫幅；橫幅期間不再疊角色對話。需要台詞時，等橫幅完全退場後再顯示於底部安全區。
- 戰鬥進行中不可用寬幅深色卡片長駐中央；重要訊息優先縮成 HUD chip 或戰報。
- 結算開啟前清除敵將預告、對話、首領橫幅與教學焦點，避免 z-index 穿透。

## Small-sprite readability

Battlefield heroes keep their chunky pixel silhouette, then receive a compact detail pass: 1-2px shoulder studs, collar/belt landmarks, face highlights, hero-specific hair or crest pixels, and one marker for each paper-doll slot. Units rendered below 1x are snapped to half-pixel coordinates for crisp edges while the health bar and movement interpolation remain smooth. This keeps small characters detailed and recognizable without increasing hitboxes or adding bitmap dependencies.
Allied health bars are anchored below the feet, with an equal-length ultimate-energy bar directly underneath; enemy minions have no health bars, while the BOSS bar stays above the crown. The energy fill reflects attack charges, dims during cooldown, and pulses gold when the skill is ready.

Battlefield sprite scale uses 0.88x for allies, 0.82-0.90x for regular enemies, and 1.30x for bosses; the hierarchy remains clear while all characters occupy less space. Shadows follow the same scale.

Combat damage numbers use a readable 16px base / 24px critical scale on the 390px battle canvas. Normal hits remain compact enough for stacked attacks; critical hits use heavier weight and a 3px dark outline so the value is legible over sprites and effects. Both use the existing restrained pop curve and upward drift.

## Stage identity and enemy preview

Every stage exposes a data-driven display name in the battle header and canvas watermark, so the HUD never falls back to a generic “wave 1” identity. The battle HUD permanently shows one named enemy general for the active wave; it switches when the next wave spawns and changes to the boss general during the boss wave. Each card uses the same compact pixel portrait vocabulary as the roster, while every enemy in a normal wave shares that wave general id for future general-specific skills, drops and paper-doll variants.
## Character portrait identity

Portraits use a fixed three-anchor contract: silhouette (headgear or hair shape), face mark (beard, eyepatch, eye color or cheek mark), and costume block (robe, armor or scarf). Each anchor is rendered as a crisp pixel layer and is preserved by the large detail portrait, roster thumbnail, dialogue portrait and enemy preview. Equipment layers remain above the portrait anchors so the paper-doll system can change weapons and armor without erasing a hero's identity. Extra roster entries also receive a small accent rune from their data palette, making shared visual families distinct at thumbnail size.
