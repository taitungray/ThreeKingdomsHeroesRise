# 戰鬥人物圖片製作方式與規格

狀態：MANDATORY STANDARD。更新日期：2026-08-29。本文件是戰鬥人物圖片從 AI 母圖、切格、去背、正規化、manifest 到 Canvas 消費的單一製作規範；角色運行期圖層與生命週期仍以 [戰鬥角色渲染契約](combat-character-render-contract.md) 為準，整體視覺語言仍以 [遊戲美術規範](game-art-bible.md) 為準。

## 1. 適用範圍與目前管線

適用於我方武將、普通敵人、敵將與 Boss 的 attack／idle recovery／move 圖片。portrait、卡片立繪、裝備 icon、獨立 combat weapon、mount 與 VFX 不使用本流程。

目前正式流程：

```text
角色／兵種規格
→ 內建 ImageGen 高解析 master sheet
→ 儲存為 workspace 內 lossless WebP master
→ scripts/generate-combat-actions-v3.js（96px 基線）
→ scripts/generate-combat-actions-v4-pilot.js（128px 首四將試製）
→ 邊界連通去背／白邊清理／分格／trim／腳底對齊
→ 96px v3 基線或 128px v4 試製 attack sheet 與 move strip
→ attack-manifest.json／move-manifest.json
→ js/game/game-render.js 預載、抽格與鏡像
→ 資產 gate、smoke、無視窗 Chrome 與人工視覺 QA
```

母圖是可重建來源，不是 runtime 資產。禁止直接把 ImageGen 輸出或帶棋盤格／白底的 master 當戰鬥 sprite。

## 2. 美術 Style Lock

### 三個美術支柱

1. **全身可辨識**：頭、五官、肩甲、胸甲、戰裙、雙腿、戰靴與完整兵器都要在格內。
2. **精緻點陣層次**：臉、鬍鬚、甲片、衣褶與武器紋理在 390×720 戰場仍可辨識。
3. **動作有重量**：腳掌接地、重心轉移、手部握持與兵器發力方向一致。

### 造型與比例

- 正統 16-bit／32-bit 精緻點陣 RPG 風格，非 Q 版大頭比例。
- 頭部不可主導整個輪廓；禁止 portrait、半身 bust、卡片裁切或只有臉與胸甲。
- 主角、普通敵人與 Boss 都使用完整全身；Boss 靠剪影、體型、服裝與兵器區分，不只等比放大。
- 每個身份至少鎖定三個不可漂移的錨點：剪影、臉部特徵、服裝／兵器特徵。
- attack 與 move 必須維持相同臉型、髮鬚、服裝、配色、身形比例與武器。

### 色彩、材質與光線

- 光源固定為左上方偏暖主光，陰影偏冷且克制。
- 臉、手、甲片邊緣與兵器刃口使用較高局部對比；背景與 VFX 不得吞掉輪廓。
- 金屬至少可分亮面、固有色與暗面；布料、皮革、毛髮與木柄不得全部畫成同一種金色噪點。
- 使用選擇性深色外輪廓，內部細節以成組 pixel clusters 表現，不使用柔焦、照片式材質或連續漸層糊邊。
- 陣營色是輔助，不能靠整張換色假裝不同武將。

### 兵器

- 兵器必須由手部自然持握，柄、手、護手與刃口的前後關係一致。
- action sheet 已包含兵器時，renderer 不得再疊第二把外部 weapon。
- 長兵器、弓弦、刀光可接近格邊，但頭、腳、馬匹與主要兵器尖端不得裁切。
- 刀光、箭矢與法術必須有清楚發射源；大範圍 VFX 優先由 runtime 繪製，不永久烘焙成遮身色塊。

## 3. Master Sheet 契約

### 格位與角色順序

| Master | 固定格位 | Row 順序 | Column 順序 |
|---|---:|---|---|
| `core-heroes-action-master-v3.webp` | 4×5 | 劉備、關羽、張飛、趙雲 | anticipation、windup、contact、follow-through、recovery |
| `support-heroes-action-master-v3.webp` | 4×5 | 黃忠、孫尚香、曹操、夏侯惇 | 同上 |
| `chapter1-enemies-action-master-v3.webp` | 5×5 | bandit、brute、cavalry、張角、董卓 | 同上 |
| `core-heroes-move-master-v3.webp` | 4×4 | 劉備、關羽、張飛、趙雲 | left-contact、left-pass、right-contact、right-pass |
| `support-heroes-move-master-v3.webp` | 4×4 | 黃忠、孫尚香、曹操、夏侯惇 | 同上 |
| `chapter1-enemies-move-master-v3.webp` | 5×4 | bandit、brute、cavalry、張角、董卓 | 同上 |
| `core-heroes-action-master-v4.webp` | 4×5 | 劉備、關羽、張飛、趙雲 | v4 128px 試製；順序同 v3 attack |
| `core-heroes-move-master-v4.webp` | 4×4 | 劉備、關羽、張飛、趙雲 | v4 128px 試製；順序同 v3 move |
| `named-lubu-action-master-v3.webp` | 1×5 | 呂布 | 專屬攻擊五階段；金甲、雉尾、方天畫戟 |
| `named-zhugeliang-action-master-v3.webp` | 1×5 | 諸葛亮 | 專屬攻擊五階段；綠袍、綸巾、羽扇 |
| `named-diaochan-action-master-v3.webp` | 1×5 | 貂蟬 | 專屬攻擊五階段；紫粉袍、雙環 |
| `named-lubu-move-master-v3.webp` | 1×4 | 呂布 | 專屬四幀步態 |
| `named-zhugeliang-move-master-v3.webp` | 1×4 | 諸葛亮 | 專屬四幀步態 |
| `named-diaochan-move-master-v3.webp` | 1×4 | 貂蟬 | 專屬四幀步態 |

格數與順序是硬契約；master 實際像素尺寸可因 ImageGen 輸出略有差異。產生器目前要求寬至少 1200px、高至少 960px，再依總寬／總高等比例切格，禁止手寫不透明的任意裁切座標。

### 每格構圖

- 一格只能有一個完整角色或一名完整騎兵與坐騎。
- 全列使用相同腳底 baseline、身體尺度、視角與光源。
- 運行期資產剪影統一朝右（Facing RIGHT，以利運行期依 `unit.facing` 水平鏡像縮放）：
  - 現行全部 v3／v4 attack 與 move 母圖已朝右（含張角、董卓、趙雲、黃忠、盜賊、力士、騎兵）。產生器 flop set 必須為空。
  - 皮膚／質量啟發式會把長兵器、金刃、弓與馬體誤判朝左；禁止依該啟發式 flop，否則 clone 全表倒退走。runtime `MOVE_SHEET_FACE_LEFT` 應為空。
  - `check-combat-assets.js` 斷言產生器四個 flop set 皆空；像素啟發式只抽樣無長兵器的剪影。
- 同一列不可因動作改變臉、髮色、頭冠、甲型、衣色或武器種類。

### 五階段攻擊定義

| Frame | 動作目的 | 畫面要求 |
|---|---|---|
| anticipation | 告知即將出手 | 重心後收、武器預備、輪廓與 recovery 明顯不同 |
| windup | 儲力到最大 | 手臂、軀幹與兵器形成清楚發力線，不可只是站姿旋轉 |
| contact | 傷害 resolve | 武器尖端／刃口到達最大有效距離，命中方向可讀 |
| follow-through | 延續慣性 | 重心越過接觸點，披風、衣袖、鬍鬚與兵器有次級延遲 |
| recovery | 回到可循環姿勢 | 腳底與錨點穩定，可兼作核准 idle，但不可殘留刀光或第二把兵器 |

### 四階段移動定義

| Frame | 動作目的 | 畫面要求 |
|---|---|---|
| left-contact | 左腳接地 | 左腳承重，右腳準備通過，腳底與地面相接 |
| left-pass | 重心通過左腳 | 身體向前，後腳離地，衣甲有克制延遲 |
| right-contact | 右腳接地 | 與 left-contact 形成清楚反相，不得只是整張平移 |
| right-pass | 重心通過右腳 | 可無縫回到 left-contact，身高變化克制 |

禁止靜態雙腿配合整個 body 上下彈跳、滑行、縮放或速度線冒充走路。騎兵四格必須表現馬匹交替落蹄，騎手與鞍座關係保持穩定。

## 4. ImageGen 製作方式

### 使用模式

- 使用 Codex 內建 ImageGen；使用者未指定時不改走 CLI／API。
- 新版通常以最新核准 master 作為 edit target，角色身份與格位比自由創作更重要。
- ImageGen 產物先保存在 `$CODEX_HOME/generated_images/...`，確認後再轉存到 `assets/characters/*-master-vN.webp`；runtime 不得引用 `$CODEX_HOME` 路徑。
- 新版使用新版本號，禁止直接覆蓋已核准版本，除非任務明確要求替換。

### Attack 提示模板

```text
Use case: precise-object-edit
Asset type: production Web/H5 game combat action sprite-sheet master
Input images: Image 1 is the edit target and exact layout reference.
Primary request: Redraw the same characters and the same five action phases with substantially finer premium pixel-art craftsmanship while preserving the exact <ROW>x5 grid, row order, identities, costumes and weapons.
Style/medium: premium 32-bit-era Chinese historical RPG pixel art; crisp deliberate pixel clusters; readable face; layered armor plates; cloth folds; hair and beard strands; weapon engravings; disciplined limited palette; selective dark outlines; no painterly blur.
Composition/framing: one complete full-body figure per cell; consistent foot baseline and body scale; transparent gutter; weapons naturally gripped and contained inside each cell.
Lighting/mood: upper-left warm key light; cool restrained shadow; high local contrast on face, hands, armor edges and weapon.
Constraints: preserve grid, identity, row order and pose meaning; actual transparent background; no checkerboard; no labels, UI, text or watermark; no cropped head, feet, horse or weapon; no giant portrait head; no duplicated body parts.
Avoid: chibi proportions; muddy gold noise; random ornaments; identity drift; detached weapons; motion blur; colored background; soft antialiasing.
```

必須在 `Primary request` 內逐列寫明角色名、髮鬚／頭冠、主色、服裝與兵器，不可只寫「四名三國武將」。

### Move 提示差異

Move 提示沿用相同 Style Lock，將五階段改為四階段 grounded gait，並額外加入：

```text
The four columns are left contact, passing, right contact, passing.
Show genuine alternating planted feet and weight transfer, with restrained secondary motion in cloth, hair, beard and weapon.
For cavalry, show an alternating grounded hoof cycle while the rider remains anchored to the saddle.
Avoid whole-body bounce, skating pose, identical legs and inconsistent baseline.
```

### 產出人工檢查

ImageGen 完成後先檢查：

1. row／column 數量和順序正確。
2. 每格完整全身、腳底一致、沒有跨格或裁切。
3. 同一角色跨格身份一致。
4. 手部握持與兵器種類一致。
5. 攻擊五格有不同重心與發力線；移動四格左右腳確實反相。
6. 無文字、UI、水印、額外人物與背景場景。
7. 即使畫面看似透明，也不可假設已有 alpha；必須由後處理與資產 gate 驗證。

未通過就針對單一問題重新 edit，不把多個身份錯誤一起交給後處理猜測修復。

## 5. 後處理與輸出

96px 基線腳本是 `scripts/generate-combat-actions-v3.js`；128px 首四將試製腳本是 `scripts/generate-combat-actions-v4-pilot.js`。`npm run generate:combat-actions` 會先重建基線，再疊加 v4 試製；只重建單一層可分別使用 `generate:combat-actions:base` 或 `generate:combat-actions:pilot`。主要步驟：

1. 確認六張 master 存在且解析度符合下限。
2. 依 row／column 比例切出每格，不依固定 master 尺寸硬編座標。
3. `ensureAlpha()` 後，從四邊以 flood-fill 找出相連的近中性高亮背景。
4. 將相連背景 alpha 清為 0，再做兩輪淡色 antialias fringe 清理。
5. 清除左右各 10px 安全 gutter，避免相鄰長兵器或 VFX 擦入本格。
6. 透明 trim 後以 nearest kernel 等比縮入：v3 為 92×92、v4 為 124×124，位置靠 bottom。
7. 劉備目前有一段 identity palette correction，將錯誤金色衣甲校回 jade-green；新增例外必須資料化或註解原因。
8. 現行母圖已朝右，產生器不得 flop 任何列。
9. 放入 96×96 或 128×128 透明 cell，保留 2px 安全邊並維持 foot-center。
10. 以 lossless WebP 輸出並更新 manifest。

ImageGen master 目前可能是無 alpha 的白色／棋盤狀扁平背景；這是已知輸入特性。v4 試製會用較寬容的邊界連通中性色去背，再全域清除封閉的淺中性色棋盤島。只有最終 `attack-*-v3/v4.webp` 與 `move-*-v3/v4.webp` 必須具有真實 alpha；任何棋盤、白底、灰綠／褐色矩形色帶或 cell 邊緣不透明長條都屬失敗資產。

## 6. Runtime 資產規格

| 類型 | 命名 | 尺寸 | 格位 | 格尺寸 | 格式 |
|---|---|---:|---:|---:|---|
| attack | `attack-<id>-v3.webp` | 768×480 | 8×5 | 96×96 | lossless WebP + alpha |
| move | `move-<id>-v3.webp` | 384×96 | 4×1 | 96×96 | lossless WebP + alpha |
| v4 pilot attack | `attack-<id>-v4.webp` | 1024×640 | 8×5 | 128×128 | lossless WebP + alpha |
| v4 pilot move | `move-<id>-v4.webp` | 512×128 | 4×1 | 128×128 | lossless WebP + alpha |

- attack manifest：`assets/characters/attack-manifest.json`，目前 version 6；`detailCellSize = 96`、`ultraDetailCellSize = 128`，v3／v4 路徑分別寫在 `detailPath`／`ultraDetailPath`。
- move manifest：`assets/characters/move-manifest.json`，目前 version 3；`cellSize = 96`、`ultraDetailCellSize = 128`，試製項目另有 `ultraDetailPath`。
- attack 五個 row 是五階段；八個 column 目前複製同一 authored silhouette，以維持方向資料契約，實際只有 runtime 左右鏡像，不可宣稱已有八套獨立方向美術。
- move 四格是四個獨立步態，不可複製同一格或只平移像素。
- master、舊 `v1`／`v2`、portrait 與 combat-body 不得成為核准 runtime 的正常 draw path。

## 7. 目前身份映射

### 獨立 v3 武將 archetype

`liubei`、`guanyu`、`zhangfei`、`zhaoyun`、`huangzhong`、`sunshang`、`caocao`、`xiahoudun`、`lubu`、`zhugeliang`、`diaochan`。

### 128px v4 戰鬥試製

`liubei`、`guanyu`、`zhangfei`、`zhaoyun`。本輪只精修這四名實際上場的全身戰鬥角色，並同時提供 attack 與 move；不代表其他武將已升級到 v4。

尚未有唯一 v3 圖集的武將，runtime 先讀 hero `visual`；若仍無核准身份，再依兵種使用：

| 兵種 | 暫時全身 archetype |
|---|---|
| 步兵 | `guanyu` |
| 騎兵 | `zhaoyun` |
| 弓兵 | `huangzhong` |
| 謀士 | `caocao` |

這能阻止舊 portrait／半身 bust 進入戰場，但不代表 50 名武將已有唯一外觀。新增專屬角色時要以其 ID 新增 master row 或獨立 master，再移除 alias。

### 第一章敵人與 Boss

- 獨立：`bandit`、`brute`、`cavalry`、`boss-zhangjiao`、`boss-dongzhuo`。
- 暫時 alias：`archer` 使用 `huangzhong` 全身格；`strategist` 使用 `boss-zhangjiao` 全身格。
- 未核准 Boss 身份暫時映射 `boss-dongzhuo`，不得使用 portrait 或把普通 body 放大冒充完成資產。

alias 必須保留在 manifest／產生器／目前規格中，不能只藏在 renderer 條件式。

## 8. Canvas 消費規格

`js/game/game-render.js` 的目前契約：

- v3 source cell 為 96px，繪到 72×72 logical destination；v4 試製 source cell 為 128px，繪到 80×80 logical destination。兩者皆以腳底 `y=2` 為錨點，再乘單位 scale。
- 角色來源統一朝右，`unit.facing` 負責左右鏡像；不得為了轉向生成第二套身份漂移圖。
- `imageSmoothingEnabled = false`，維持像素邊緣。
- moving 且無 action 時抽 move strip；action 時抽 attack sheet；其餘使用 attack recovery row 作 idle。
- 15 個核准身份在開始戰鬥前預載；首四將選 v4，其餘選 v3。
- `ATTACK_SPRITES_APPROVED = true` 時，舊 combat-body、boss v1、程序 body、程序 weapon 與 portrait 不得進入正常 draw path。
- 核准圖若尚未載入，寧可暫時不畫角色，也不能顯示錯誤 bust、卡片或幾何替代品；載入失敗由 local request failure／console gate 判定。

如調整 cell、destination、anchor、scale、平滑模式或 facing，必須同時更新產生器、manifest、asset check、browser QA、本文件與 [戰鬥角色渲染契約](combat-character-render-contract.md)。

## 9. 自動化與人工驗收

### 必跑命令

```text
npm run generate:combat-actions
node --check game.js
npm run check:syntax
npm run test:combat-assets
npm test
npm run test:docs
npm run test:combat-browser
```

`npm run test:combat-assets` 至少驗證：

- 59 張高細節 attack 與 59 張 move 存在（涵蓋全 50 名武將、5 類敵軍與 4 名 Boss）。
- attack 為 768×480、move 為 384×96、cell 為 96px。
- 首四將 v4 attack 為 1024×640、move 為 512×128、cell 為 128px。
- 最終 WebP 有 alpha，coverage 不過疏也不是不透明矩形。
- v4 每格外緣不透明像素低於門檻，阻止灰綠／褐色底塊、棋盤島與長條色帶再次進入戰場。
- attack 至少有三個不同 phase fingerprint；move 四格 fingerprint 全部不同。
- manifest version、路徑、ID 與數量符合契約。

`npm run test:combat-browser` 至少驗證：

- 起始四將 v4 圖集已載入且為 1024×640。
- `drawStats.action > 0`、`drawStats.move > 0`、`drawStats.boss > 0`。
- `drawStats.body === 0`，證明舊 portrait／combat-body 沒進入核准畫布。
- 無 local asset failure、page error 或 transform 逃逸。

### 人工視覺 QA

在 390×720、430×932、320×568 至少檢查：

1. 我方近戰、遠程／謀士、普通近戰、普通遠程、騎兵與 Boss。
2. idle → move → anticipation → contact → recovery → hit → death → removed。
3. 臉、鬍鬚、甲片與兵器是否可辨識；沒有半身 bust、黑框、白邊、棋盤格或雙身體。
4. 腳底是否接地，移動是否交替換步，停止時是否無滑行。
5. 手、武器與命中方向是否相連，死亡時是否不殘留第二把兵器。
6. 敵我密集交戰時仍能辨識主要輪廓，VFX 不長時間洗白角色。

自動 fingerprint 只能證明像素不同，不能證明動作細膩、身份一致或握持正確；未完成人工矩陣不得宣稱全部人物美術完成。

## 10. 新增或改版角色的標準流程

1. 先寫身份卡：ID、陣營、兵種、剪影、臉部、頭冠／髮鬚、主色、甲型、武器與禁止漂移項。
2. 決定加入現有 master row 或建立新的版本化 master；不要破壞既有 row 順序。
3. 以最新核准身份圖作 edit reference，分別生成 attack 五階段與 move 四階段。
4. 人工檢查 grid、身份、完整全身、腳底、握持與透明背景。
5. 把最終 master 轉存為 workspace 內 lossless WebP，更新產生器 row map。
6. 執行 `npm run generate:combat-actions`，檢查 v3 基線、v4 試製輸出與 manifest。
7. 更新 runtime 核准 ID／alias；專屬圖完成後移除對應 archetype fallback。
8. 執行全部自動化與固定尺寸人工 QA。
9. 同步 `current-game-spec.md`、`known-issues.md`、`active-backlog.md` 與 QA 證據。
10. 需要發布同步產物時才執行 `node build.js`；不直接修改 `www/`。

## 11. 禁止事項

- 禁止把 portrait、卡片、半身 bust、黑框或不透明矩形當戰鬥人物。
- 禁止直接放大 44×52／64px 舊 body 冒充高細節 96px／128px 圖格。
- 禁止用相同站姿旋轉、平移或縮放假裝五階段攻擊／四幀步態。
- 禁止讓 ImageGen 自由改 row 順序、武器、服裝或角色身份。
- 禁止假設 ImageGen 的棋盤預覽等於真 alpha。
- 禁止保留去背失敗形成的灰綠、褐色、白色矩形底塊、棋盤島或沿 cell 邊緣延伸的色帶。
- 禁止用柔焦、全身 bloom、過量金色噪點或持續 VFX 遮蓋細節。
- 禁止已內嵌兵器的 action sprite 再疊外部 weapon。
- 禁止只更新圖片，不同步產生器、manifest、renderer、測試與文件。

## 12. 已知限制

- 目前只有劉備、關羽、張飛、趙雲使用 128px v4 試製；另有 11 名武將具獨立 96px v3 archetype（含呂布／諸葛亮／貂蟬專屬母圖），其餘武將仍共用 `visual`／兵種全身 alias。
- archer 與 strategist 暫時借用黃忠與張角的全身圖，尚未有獨立普通敵人身份。
- attack sheet 雖有八個方向欄，現階段是單一 authored 方向複製並由 runtime 左右鏡像，不是八方向獨立作畫。
- ImageGen master 仍可能輸出扁平白底／棋盤背景，必須依後處理去背，不能跳過 asset gate。
- 命令列與無視窗 browser gate 已存在，但完整角色逐狀態、全裝置人工畫面包仍依 QA 矩陣執行。

## 13. 本次問題的成因與防止重犯

本節是後續製作的固定檢查清單；新增角色、重做母圖或調整切格時不可省略。

### 已確認的問題

1. ImageGen 顯示的棋盤格不等於透明 alpha；本次 v4 母圖實際是無 alpha 的扁平背景。
2. 只從四邊 flood-fill 去背，在 WebP 壓縮造成中性色斷線時，會留下封閉的棋盤色島。
3. 殘留色島經 trim、nearest resize 與 Canvas 放大後，會變成角色周圍的灰綠／褐色矩形髒色塊；這不是可接受的 VFX。
4. 母圖 row／cell 邊界的衣料、鬍鬚、刀柄或兵器碎片若未隔離，動畫換 frame 時會看起來像切到另一名角色的服裝／武器。
5. 只看 master 或透明預覽不足以發現問題，必須檢查最終切格並在黑底／實戰畫面確認。

本次具體案例是 `move-zhangfei-v4.webp` 的第 2 格：左側出現獨立 231px 武器 component。修正後該四格均只剩一個角色／自身武器 component，並由 `test:combat-assets` 固定阻擋同類回歸。

### 固定修正方式

- 母圖永遠保留版本號並存於 `assets/characters/*-master-vN.webp`；不得直接覆蓋已核准版本，也不得讓 runtime 讀 `$CODEX_HOME/generated_images`。
- 去背必須包含「邊界連通中性色」與「封閉淺中性色島」兩層清理；不可只依賴單一 flood-fill。
- 切格後清除安全 gutter，再以透明 trim、nearest kernel、腳底 baseline 正規化；v3 用 96px cell，v4 試製用 128px cell。
- 每個 unit 生成時固定 `combatSpriteId`；同一個 ID 必須同時供 idle、move、attack、hit／death 的圖像路徑使用，不能在每個 frame 重新從 `visual` 猜身份。
- 每格在輸出前移除小型 alpha island 與跨格碎片；武器尖端可以接近格邊，但相鄰角色的衣料／兵器不得進入本格。
- 最終資產必須以 lossless WebP + 真 alpha 輸出；禁止把棋盤格、白底、灰綠／褐色矩形、沿 cell 邊緣的長條帶入 manifest。
- `scripts/check-combat-assets.js` 必須驗證尺寸、alpha、每格 coverage、phase／gait fingerprint，以及 cell 外緣不透明色帶；任何一項失敗都不能接入 runtime。
- 四格 move strip 另外必須通過每格「單一 alpha connected component」檢查；若出現第二個 component，視為相鄰角色衣服／武器碎片，直接退回切格處理。
- 接入前必須用黑底 flatten 預覽和 390×720 無視窗 browser QA；若畫面仍有矩形髒色，先回到去背／切格，不用 CSS 或 VFX 掩蓋。

### 後續角色製作標準順序

1. 先寫角色身份卡：臉、髮鬚／頭冠、甲片、材質、武器、腳底錨點與禁止漂移項。
2. 以已核准戰鬥角色作 edit reference，生成完整 attack 五階段與 move 四階段；不能只生成一張展示立繪。
3. 先檢查 master 的 row／column、全身、握持、動作重心與背景，再執行版本化切格腳本。
4. 產生後檢查每一格的透明度、邊緣色帶、腳底與武器是否跨格；必要時重新 edit，不用程式硬補人物缺件。
5. 更新 manifest、renderer、asset gate、browser QA、規格與問題紀錄；只改圖片而不更新這些來源視為未完成。
6. 最後才同步 `www/` 或發布產物；一般資產迭代不直接手改 `www/`。
