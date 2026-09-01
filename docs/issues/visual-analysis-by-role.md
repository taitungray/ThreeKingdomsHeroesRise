# 角色畫面視覺分析與優化方案

> **狀態：過時參考（2026-08-28）。** 現行契約以 `docs/standards/combat-character-asset-production.md`、`attack-manifest.json` v6、`ATTACK_SPRITES_APPROVED = true` 與 `docs/issues/known-issues.md` 為準。下文「無幀動畫／32px body 主路徑」等結論已失效，勿當完成證明。

> 分析範圍：所有角色相關的戰場渲染、資產品質、動畫表現、UI 頭像與肖像
> 分析日期：2026-08-28
> 證據等級：`已確認`（所有結論基於直接檢查的程式碼和影像檔案）——**僅反映當時工作樹**

---

## 總體判定

**整體視覺一致性：嚴重不足。** 遊戲中同時存在至少 **4 種完全不同的美術風格**，從畫質精細度到渲染手法都互相衝突。

### 風格衝突矩陣

| 資產類型 | 風格 | 像素密度 | 渲染方式 | 衝突等級 |
|---|---|---|---|---|
| Avatar（大頭像） | 高細節半寫實像素畫 | 1024×1024 | AI 繪圖 + 後製 | — |
| Portrait（64px 小頭像） | 手繪像素風 | 64×64 | AI 生成 pixel art | ⚠️ 與 avatar 不像同一遊戲 |
| Combat Body（戰場身體） | 低解析像素風 | 32×38 | AI 生成 pixel art | 🔴 與 avatar/portrait 嚴重脫節 |
| Boss Sprite | 中高細節像素畫 | ~64×72 | AI 生成 | ⚠️ 與普通角色兩種品質 |
| Procedural Body（程序生成） | 純 `fillRect` 方塊拼裝 | N/A | Canvas drawPixelRect | 🔴 品質底線 |
| Mount（坐騎） | 低像素資產 / 程序方塊 | ~48×32 或方塊 | 混合 | 🔴 品質不一致 |
| Weapon（戰場兵器） | 極低解析 icon | ~16×32 | 像素 icon | 🔴 跟角色不搭 |
| Equipment Icon（裝備 icon） | 手繪風格 icon | ~64×64 | 像素繪製 | ⚠️ 尚可但跟戰場不同語言 |
| VFX | 手繪 / 程序混合 | 64×64 | 混合 | ⚠️ |
| Terrain Tile | 繪本風 | ~96×96 | AI 生成 | ⚠️ 與像素戰場不搭 |

---

## 一、我方武將（Ally Heroes）

### 1.1 Combat Body（戰場身體）— 核心問題

**現狀**：50 名武將有 50 張 `combat-body-{id}-v1.webp`（32×38px），繪製時以 `unit.scale`（我方 1.22x）放大。

**問題**：
- 身體只有 32px 寬，放大後每個像素變成約 2-3px 的方塊
- 角色之間的差異主要靠顏色而非造型
- 非 12 核心武將的 body sprite 更加模糊
- 32×38 解析度即便對像素風格也太低；參考像素遊戲通常至少 48×48

**優化方案**：

| 方案 | 說明 | 難度 | 效果 |
|---|---|---|---|
| A. 升級 body 解析度 | 重新生成 48×56 或 64×72 的 combat body | 高 | ⭐⭐⭐⭐⭐ |
| B. 增加程序細節層 | 在 body 上疊加更多差異化圖案 | 中 | ⭐⭐⭐ |
| C. 統一渲染尺寸契約 | 確保所有 body 在畫面上呈現合理高度 | 低 | ⭐⭐ |

### 1.2 Procedural Fallback — 品質底線

**現狀**：sprite 載入失敗時用 `drawPixelRect()` 方塊堆砌。12 名核心武將有獨立邏輯，其餘走通用 fallback。

**問題**：全部由方塊組成，違反 AGENTS.md「方塊不得冒充完成資產」規範。

### 1.3 Detail Overlay — 有意圖但不夠

- 1-3px 的細節在手機上幾乎看不見
- 裝備標記只有 2×2 色塊，無法傳達「穿了什麼」
- 技能 aura 用 `screen` 模式黃色大圓，太粗暴

---

## 二、敵方角色（Enemies）

### 2.1 普通敵人 — 嚴重缺乏身份感

5 種普通敵人映射到武將 body：bandit→caoren、brute→dianwei、cavalry→xiahoudun、archer→huangzhong、strategist→simayi。

**問題**：
- 敵人用我方武將的身體，只靠 overlay 差異化
- 普通敵人沒有 HP bar
- 敵將也 alias 武將 body，敵我難分

**優化方案**：敵人加紅色 tint / 紅色地面標記 / 專屬 sprite

### 2.2 Boss — 品質跳躍但只有 4 張

4 張 Boss sprite 映射 7 個 Boss。Boss 與普通單位畫質差距太大，且共用造成身份混淆。

---

## 三、坐騎（Mounts）

14 種坐騎有 WebP sprite（~48×32）+ 程序 fallback。坐騎與 rider 的描邊粗細、色調、透視不統一。程序坐騎方塊造型非常醜陋。步行 foot sprite 只有 534 bytes。

**優化**：解析度至少 64×48；改善騎手接合陰影。

---

## 四、兵器（Weapons）

9 種戰場兵器每張只有 **152-260 bytes**（~16×32 像素）。劍只有 152 bytes。放大後鋸齒嚴重，武器看起來漂浮在角色上方。裝備面板的 64px icon 遠精美於戰場兵器。

**優化**：升級到 32×48；改善手部 anchor。

---

## 五、視覺特效（VFX）

16 張 VFX sprite 品質尚可，但大量共用。程序 fallback 的 impact 只有放射線條。combo 文字無裝飾。大招和普攻視覺差異太小。

---

## 六、肖像系統 — 三層品質割裂

| 層級 | 解析度 | 品質 | 問題 |
|---|---|---|---|
| Avatar | 1024×1024 | 極高（半寫實像素畫） | 只有 11 張 |
| Portrait | 64×64 | 中偏好（像素半身像） | 50 張，風格與 avatar 不同 |
| CSS pixel-avatar | N/A | 極低（CSS 色帶拼圖） | **應廢除**，改用 portrait 縮圖 |

趙雲 avatar 有精美盔甲和銳利眼神 → portrait 變像素風 → HUD 變色帶拼圖。三者無法統一角色形象。

---

## 七、戰場背景

Terrain tile 是繪本風（~96×96，alpha 0.28），與像素戰場角色風格不統一。程序裝飾（樹/石頭/旗幟）是純方塊。天氣（雨雪夜晚）粒子也是方塊。

---

## 八、動畫品質

**最大問題**：所有動畫都是對同一張靜態圖施加 transform。沒有幀動畫。attack sprite sheets 被 `ATTACK_SPRITES_APPROVED = false` 隔離。

| 狀態 | 表現 | 品質 |
|---|---|---|
| idle | body 呼吸縮放 | ⚠️ 太微弱 |
| walk | 垂直彈跳 | ⚠️ 無步伐 |
| attack | body 前傾 + 手臂 | ⚠️ 僵硬 |
| hit | 後仰 + 白色 flash | ⚠️ 太粗 |
| death | 旋轉淡出 | ✅ 尚可 |

受擊只有白色橢圓 flash，沒有擊退或頓幀。

---

## 九、優化優先順序

### P0（必須修復）
1. 廢除 CSS 方塊頭像，全面使用 WebP portrait
2. 提升 combat body 解析度至 48×56
3. 敵我視覺區分（紅色 tint / 地面標記）
4. 兵器 sprite 升級至 32×48

### P1（應該修復）
5. 通過 attack sprite gate，啟用幀動畫
6. Boss 各自專屬 sprite
7. 普通敵人專屬 sprite
8. 增強打擊感（頓幀 + 擊退）
9. 坐騎品質統一

### P2（應該改善）
10. 地形風格統一
11. 天氣效果升級
12. VFX 差異化
13. Portrait 與 Avatar 風格呼應

### P3（錦上添花）
14. 角色 name tag
15. 裝備視覺反映
16. 技能特寫鏡頭

---

## 十、Art Direction 建議

### 建議 Art Pillars
1. **像素武俠**：所有戰場渲染統一在 48-64px 級別的像素風
2. **暗金莊嚴**：色調以暗底 + 金色裝飾為主
3. **手繪書卷**：UI 面板走書卷紋理

### 風格統一路線圖
```
Phase 1 → 升級 combat body 到 48×56
Phase 2 → 重做戰場兵器 sprite（32×48）
Phase 3 → 敵人專屬 sprite + Boss 各自專屬
Phase 4 → 通過 attack sprite gate，啟用幀動畫
Phase 5 → 地形 / VFX / 環境統一到像素風
```

---

## 附錄：資產品質速查

**Keep**：Avatar 1024px、Portrait 64px、Equipment icon、VFX sprite、Terrain tile

**Adjust**：Combat body（解析度不足）、Mount sprite（需增加細節）、Boss sprite（品質好但不足）

**Replace**：CSS pixel-avatar、Combat weapon sprite（太小）、Procedural fallback、Attack sprite sheets
