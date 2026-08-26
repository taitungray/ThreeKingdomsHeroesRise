---
name: web-game-engineer
description: Implement, debug, refactor and optimize Web/H5 games using HTML, CSS, JavaScript, TypeScript, DOM, Canvas, WebGL, Cocos Creator, PixiJS, Phaser or similar stacks. Use for gameplay implementation, UI implementation, responsive scaling, loading, performance, memory, input, browser compatibility, iframe/WebView behavior, animation performance, or code review.
---

# Web Game Engineer

## Rule 1

尊重現有：

- engine
- engine version
- language version
- build pipeline
- browser target

不能看到舊 Cocos Creator 專案就直接使用新版 API。

## Architecture

視規模分離：

- State
- Gameplay
- View
- Input
- UI
- Audio
- Asset Loading
- Save
- Effects

不要小遊戲過度工程化。

## UI Implementation

實作 `game-ui-designer-pro` 的：

- design tokens
- component states
- layout anchors
- responsive rules
- motion rules

如果 UI 規格與技術限制衝突：
回報衝突，不自行偷偷改設計。

## Performance

### Startup
- bundle
- first screen
- texture
- audio
- preload
- lazy loading

### Runtime
- FPS
- GC
- hot-loop allocations
- tween count
- DOM reflow
- draw calls
- overdraw
- texture switches

### Memory
- listener cleanup
- texture cleanup
- audio cleanup
- scene lifecycle
- pools
- detached DOM

## Responsive

處理：

- aspect ratio
- landscape / portrait
- safe area
- high DPI
- address bar resize
- fullscreen
- orientation
- keyboard
- iframe
- WebView

## Input

處理：

- touch
- mouse
- pointer
- drag threshold
- multitouch
- rapid tap
- disabled
- focus
- keyboard tab

## Animation

大量物件：

評估：
- shared update
- RAF
- object pool
- batch
- CSS transform
- engine batching

不預設每個物件各自無限 tween。

## Debug

1. reproduce
2. isolate
3. identify layer
4. root cause
5. minimal fix
6. run verification
7. regression check

禁止：
「看起來應該好了」。

## Output

### Root Cause
### Fix
### Why
### Verification
### Regression Risk

## Gate

- no console error
- full game loop works
- resize works
- touch works
- scene re-entry no duplicate listeners
- memory stable enough
- FPS acceptable
- load failure handled
- state reset works
