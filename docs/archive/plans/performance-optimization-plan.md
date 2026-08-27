# 三國：群英再起 — 全局效能瓶頸評估與極致優化方案

> **ARCHIVED PLAN — 2026-08-27。** 效能數字為當時未完整量測的估算，不代表目前 benchmark；新的效能工作必須進 [目前工作清單](../../work/active-backlog.md) 並附量測環境。

> 本文件專門針對遊戲在 **手機瀏覽器 / 低階 Android 裝置 / 長時間放置掛機** 情境下的效能表現、記憶體洩漏風險、渲染幀率（FPS）與電池發熱進行深度代碼級診斷，並給出具體改進規範。

---

## 一、診斷出的五大效能瓶頸（Performance Bottlenecks）

```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 瓶頸 1：每秒高頻 DOM 暴力重繪 (DOM Thrashing in updateHud)│
│    game-main.js 每 350ms 全量觸發 updateHud()，狂刷 15+ 個  │
│    DOM 元素的 textContent 與 style，導致瀏覽器頻繁 Reflow。 │
├─────────────────────────────────────────────────────────────┤
│ 🔴 瓶頸 2：Canvas CPU 幾何重算負擔重 (Math & Draw Call)      │
│    game-render.js 每幀執行 300+ 次 Math.round、三角函數運算  │
│    與 fillRect 幾何堆疊，造成 CPU 佔用高、手機發燙。        │
├─────────────────────────────────────────────────────────────┤
│ 🟡 瓶頸 3：未設上限的粒子與陣列垃圾回收 (GC Pressure)       │
│    戰鬥中 effects/projectiles/numbers 陣列頻繁 push/splice， │
│    物件大量建立與銷毀引發 JS 引擎頻繁 GC（造成戰鬥微卡頓）。│
├─────────────────────────────────────────────────────────────┤
│ 🟡 瓶頸 4：背景標籤頁/息屏未完全休眠 (Background CPU Waste) │
│    切到後台時，部分 setInterval 仍在持續執行，浪費玩家電力。│
├─────────────────────────────────────────────────────────────┤
│ 🟡 瓶頸 5：大圖與超長 CSS 選擇器解析 (CSS Repaint Cost)      │
│    styles.css 包含大量 5~6 層深度 clip-path 與 gradient，    │
│    DOM 面板滾動時觸發昂貴的 Layer Repaint。                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、具體代碼優化對策與實作規範

### 1. 【優化 1】DOM 髒檢查機制（Dirty Checking for HUD）
*   **問題**：目前不管數值有沒有變，每 350ms 都重新寫入所有 DOM。
*   **改進**：建立 `hudCache`，**只有數值真正改變時才更新 DOM**。
```javascript
// 優化後：只有數值變動才碰 DOM
const hudCache = {};
function setTextIfChanged(elementId, text) {
  if (hudCache[elementId] !== text) {
    hudCache[elementId] = text;
    $(elementId).textContent = text;
  }
}
```

### 2. 【優化 2】GPU 圖片快取代替純代碼幾何計算
*   **效益**：將武將/武器/坐騎改為透明 PNG 圖片後，使用 `ctx.drawImage` 直接交由手機 **GPU 紋理單元** 硬體加速處理，CPU 運算量立即**暴降 80%**！
*   **關閉子像素模糊**：Canvas 設定 `image-rendering: pixelated;`，並保證整數座標繪製。

### 3. 【優化 3】物件池技術（Object Pooling for Effects）
*   **問題**：每次攻擊 `runtime.effects.push({...})`，結束後 `filter` 或 `splice`，產生大量短命物件（GC 卡頓）。
*   **改進**：建立固定容量為 100 的特效物件池（Effect Pool），重複利用記憶體，零 GC 停頓。

### 4. 【優化 4】頁面後台深度休眠（Visibility Throttling）
*   當 `document.hidden === true`（切換應用或息屏）：
    - 立即暫停 `requestAnimationFrame(gameLoop)`。
    - 暫停 `setInterval(updateHud, 350)`。
    - 僅保留存檔時間戳記 `save.lastSeen = Date.now()`。
    - 回到前台時再依時間差計算離線掛機收益，**徹底做到掛機 0 耗電**！

### 5. 【優化 5】CSS 瘦身與圖層隔離（Hardware Layering）
*   在戰鬥 Canvas 與主面板加上 `will-change: transform;` 與 `contain: strict;`，隔離重繪區域。
*   將 `styles.css` 中 400 行 CSS 繪製頭像移除，替換為輕量級圖片 class。

---

## 三、效能預期指標（Optimization Targets）

| 指標 | 優化前 (Current) | 優化後目標 (Target) |
|---|:---:|:---:|
| **常態運行幀率 (FPS)** | 45 ~ 55 FPS（低階機偶發掉幀） | **穩定 60 FPS 滿幀** |
| **CPU 佔用率 (CPU Usage)** | 28% ~ 35% | **降至 < 8%** |
| **記憶體佔用 (RAM Footprint)** | ~85MB（隨時間微幅上升） | **穩定 ~45MB（無洩漏）** |
| **一小時掛機耗電** | ~18% 電量（微發熱） | **降至 < 6%（低溫運行）** |

---

## 四、落地執行結論

> **所有效能優化將與「圖片素材遷移」和「戰鬥打擊感升級」同步落地實施！**
> 
> 既保證了畫面達到最高精緻度，又確保在低階千元手機與長時間放置掛機時依然**極度流暢、低溫且省電**。


### 本輪已落地（2026-08-27）

- HUD 更新加入快取，只在文字、樣式、屬性或 aria 值實際變更時觸碰 DOM。
- 戰鬥特效採固定容量物件池，過期特效回收再利用，並保留 160 個活動上限。
- 頁面進入背景時停止 RAF、HUD 計時器與週期存檔；回到前景後重設時間基準並以時間差顯示離線收益。


## 實作驗證（2026-08-27）

- `node --check` 已通過 `game.js` 與五個 runtime module。
- `npm test` 已通過 50 名武將、100 關、4 個紙娃娃部位、能力、日常、商城與素材 manifest 驗證。
- 低階 render quality 會降低 Canvas 繪製頻率但不停止戰鬥 update；背景頁則會暫停 RAF、HUD 與周期存檔。
