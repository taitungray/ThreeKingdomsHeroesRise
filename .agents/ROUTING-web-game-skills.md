# Skill Routing

## 一句話判斷

| 使用者需求 | 優先 Skill |
|---|---|
| 做一款完整遊戲 | web-game-director |
| 想玩法、系統、數值 | game-design-planner |
| UI 不好看、要改畫面、HUD、UX | game-ui-designer-pro |
| 角色/背景/Icon/整體美術 | game-art-director |
| 寫程式、修 Bug、效能、RWD | web-game-engineer |
| Idle/Attack/Hit/VFX/動畫 | game-motion-vfx |
| 測試、平衡、難度、驗收 | game-balance-qa |

## 常見組合

### 截圖不好看
`game-ui-designer-pro`

若問題來自角色/背景素材：
`game-ui-designer-pro + game-art-director`

### 做一個戰鬥頁
`game-design-planner`
→ `game-ui-designer-pro`
→ `web-game-engineer`
→ `game-motion-vfx`

### 做遊戲大廳
`game-ui-designer-pro`
→ `game-art-director`
→ `web-game-engineer`

### 效能很差
`web-game-engineer`
→ 必要時 `game-motion-vfx`
→ `game-balance-qa`

### 做完整 MVP
讓 `web-game-director` 協調，不要人工硬跑全部 Skill。
