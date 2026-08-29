# 戰鬥角色渲染契約

狀態：MANDATORY STANDARD。適用於我方、普通敵人、敵將、Boss、坐騎、兵器與相關 VFX；頭像、背包卡片與裝備圖示不屬於戰場資產。

## 硬性規則

- body、Boss、坐騎與兵器使用透明圖像資產；不得帶卡片背景、黑框或整格 Sprite 底色。
- 戰鬥層不得用矩形、線段或 debug hitbox 繪製正式身體、手臂、腿與兵器。
- 載入失敗時，開發／測試環境應明確報錯；正式 fallback 只能使用事先核准的透明 alias，不能臨時畫方塊。
- 同一單位同一影格最多一個 body、一個 combat weapon 與一個 mount；攻擊圖若已包含兵器，不得再疊外部兵器。
- inventory 的 `equipment-weapon-*` 不得當戰鬥兵器；戰場使用獨立 `combat-weapon-*` 資產。
- 攻擊圖集只有通過資產 gate、完整方向與生命週期驗收後才能啟用。當前核准狀態以 [目前遊戲規格](../specs/current-game-spec.md) 為準。

## 資產契約

| 層 | 基準規格 | 錨點 | 備註 |
|---|---|---|---|
| combat body | 64×76 WebP source，renderer 依單位比例縮放 | 腳底中心 | idle、move、hit、death 共用身分；核准角色可由 action sheet recovery 提供 idle／move 身分 |
| combat weapon | 64×64 WebP | manifest hand anchor | 握點與尖端方向必須資料化 |
| mount | 48×32 WebP | 腳底／鞍座契約 | 騎乘時 body 與 mount 不互相穿透 |
| Boss body | 64×76 WebP source 或核准 96px action cell | 腳底中心 | 不得只是普通敵人等比放大 |
| attack sheet | 8 方向 × 5 階段；96px `v3` 基線或 128px `v4` 試製 WebP | 腳底中心 | 每格需有完整 body coverage、透明邊、可辨識臉／甲／武器與階段差異；64px 舊圖及灰綠／褐色矩形底塊不得進入核准路徑 |
| move strip | 4 階段 × 1 列；96px `v3` 基線或 128px `v4` 試製 WebP | 腳底中心 | 左右腳交替、重心通過、首尾可循環；不得用整體跳動冒充跨步 |

實際 manifest 若改變尺寸或錨點，必須同步 renderer、產生器、測試與本契約，不能只改單一消費端。

ImageGen 提示、master sheet row／column、後處理、命名、alias 與重建命令由 [戰鬥人物圖片製作方式與規格](combat-character-asset-production.md) 統一定義，本文件不維護第二份製作流程。

## 圖層順序

建議順序：地面影子 → mount → body → armor／角色細節 → combat weapon → action VFX → hit flash／狀態 → 血條與文字。不同技能可調整局部 VFX，但不可讓兵器與 body 重複繪製。

每個 `ctx.save()` 必須在同一責任範圍內配對 `ctx.restore()`；單位 local transform 結束後才繪製 world-space 血條與 HUD。測試需監控 transform 不得逐單位／逐幀累積。

## 生命週期

| 狀態 | 功能要求 | 視覺要求 |
|---|---|---|
| idle | action 為空、座標穩定 | 兵器握點、腳底與影子穩定，無常駐亂晃 |
| move／entry | 到達 lane 前不攻擊，實際位移才推進 move frame | 朝向正確、左右腳交替、腳底接地，無滑行、整體彈跳或 body 拉伸 |
| attack | 單一 action 驅動五階段 | body 與 weapon 各畫一次，接觸點與方向一致 |
| hit | 傷害只 resolve 一次 | 短促可讀，不變成實心白塊或改變 anchor |
| death | 停止選目標與攻擊 | body、weapon、mount 依同一時間軸倒下／淡出 |
| removed | 從 runtime 移除 | 不殘留屍體、影子、血條、VFX 或兵器 |

攻擊五階段固定為 anticipation、windup、contact、follow-through、recovery；Canvas、CSS 與 timer 不得各自建立平行狀態。

## 敵人與 Boss 身分

- 每個普通敵人類型與 Boss 都要能從關卡資料追到實際 body、weapon、mount 與技能 VFX。
- 核准 alias 必須在資料或 manifest 明列，並維持身分、陣營與兵種可理解性。
- 戰場正常路徑不得載入 portrait、卡片或半身 bust；尚未有唯一全身資產的武將只能映射到 manifest 核准的全身 archetype，並在規格中標記為未完成唯一外觀。
- Boss 要有可辨識剪影或服裝／兵器特徵，不能只把普通敵人放大。

## 驗收

1. `npm run test:combat-assets` 通過尺寸、格式、alpha、cell coverage、cell 外緣髒色帶、manifest、攻擊階段／四幀步態差異指紋與 anchor 檢查。
2. source 與同步 `www` 的瀏覽器測試確認資產載入、draw call 與 transform 邊界。
3. 依 [視覺驗收規範](../qa/visual-qa.md) 完成我方、普通敵人、Boss 的逐狀態矩陣。
4. 任一錯圖、黑框、方塊、雙身體、漂浮兵器、穿模或死亡殘留即判 FAIL。
