# 戰鬥手感打磨與極簡體驗（QoL）實作計畫

狀態：PLANNING。本計畫針對「二、戰鬥手感與純粹像素打磨」與「三、極簡體驗與操作流暢度（QoL）」進行深度打磨，不堆疊無關系統，專注提升最核心的戰鬥打擊反饋與武將養成操作體驗。

---

## 核心規劃與實作項目

### 一、 戰鬥手感與像素打擊感打磨 (Combat Feel & Pixel Polish)
1. **刀劍槍刃斬擊光弧殘影 (Weapon Trails & Slash Arcs)**
   - 在近戰武器（刀、劍、槍、戟）揮舞與突刺時，於 `game-render.js` 繪製動態流光斬擊弧線（Slash Trails），依陣營與武器屬性渲染不同光澤（金黃/烈紅/青藍）。
2. **精準暴擊頓挫與受擊重擊感 (Hit Stop & Impact Dynamics)**
   - 強化暴擊與重擊瞬間的微停頓（Hit Stop 0.045s~0.06s），結合角色局部受擊後仰震顫（Micro-impact displacement），營造拳拳到肉的硬派打擊感。
3. **兵刃交鋒火花與防禦格擋 (Metal Clashes & Spark Particles)**
   - 當單位觸發高防禦格擋或互相攻擊時，迸發像素金屬火星（Metal Sparks），伴隨清脆金屬交鳴音效。
4. **箭矢破空與法術飛行姿態 (Ranged Projectile Trajectories)**
   - 箭矢、連弩與法術彈道隨飛行向量精確旋轉朝向，並在飛行過程中留下微量破空風痕（Air Trails）。

---

### 二、 極簡體驗與養成流暢度 (Quality of Life - QoL)
1. **武將長按快速連點升級 (Hold-to-Rapid-Level-Up)**
   - 武將等級與技能升級按鈕支援「長按連續升級」（每 100ms 自動升 1 級並隨時間加速），不再需要狂點幾十次。
2. **一鍵最強神裝推薦與穿戴 (One-Click Auto-Equip)**
   - 在武將紙娃娃介面加入「一鍵穿戴」按鈕，自動比對背包中最高品質、最高數值與專屬神兵真名共鳴裝備，一秒配齊最強套裝。
3. **一鍵卸裝與快速整軍**
   - 支援一鍵卸除與快速轉移裝備，方便切換上陣主力。
4. **流暢升級與浮動戰力回饋**
   - 武將升級、升星或換裝後，數值卡片即時顯示戰力提升浮動綠字（如「戰力 +1,280 ↑」），養成成就感立竿見影。

---

## 變更檔案清單

### 戰鬥與渲染打磨
- `js/game/game-combat.js` [MODIFY] - 精修打擊判定、受擊後仰、Hit Stop 頓挫係數、金屬格擋火星與實體音效調度。
- `js/game/game-render.js` [MODIFY] - 實裝武器斬擊光弧（Weapon Slash Trails）、箭矢飛行動態旋轉與破空尾跡、防禦金屬火花渲染。

### 介面與操作流暢度
- `js/game/game-ui-heroes.js` [MODIFY] - 實裝「一鍵神裝」演算法與按鈕、長按連續升級計時器、戰力浮動提升反饋。
- `js/game/game-ui-base.js` [MODIFY] - 支援長按事件監聽（`pointerdown` / `pointerup` / `pointerleave`）通用連續觸發機制。
- `css/panels.css` [MODIFY] - 一鍵穿戴按鈕樣式、長按按鈕反饋動畫、戰力提升浮動動效。

### 文件與測試
- `docs/specs/current-game-spec.md` [MODIFY] - 同步打擊感與 QoL 最新規格。
- `docs/work/active-backlog.md` [MODIFY] - 記錄工作進度。

---

## 驗證計畫

### 1. 程式碼與語法驗證
- 執行 `node --check js/game/game-combat.js`
- 執行 `node --check js/game/game-render.js`
- 執行 `node --check js/game/game-ui-heroes.js`
- 執行 `node --check js/game/game-ui-base.js`
- 執行 `npm test` 確認所有測試通過。

### 2. 戰鬥與手感驗證
- 驗證刀劍槍揮舞時斬擊光弧是否平滑自然、不影響 60FPS 效能。
- 驗證暴擊與重擊時的 Hit Stop 是否乾脆俐落、無畫面撕裂。
- 驗證箭矢與法球朝向是否始終沿著飛行方向。

### 3. 操作與流暢度驗證
- 測試長按武將升級按鈕，能否流暢連續扣除銅錢並連升等級，放開立即停止。
- 測試點擊「一鍵穿戴」，能否正確換上背包內最強裝備並即時更新戰力與紙娃娃。
- 執行 `npm run test:docs` 確保文件無衝突。
