---
name: game-motion-vfx
description: Design or implement game animation, UI motion and VFX for Web/H5 games. Use for idle, attack, hit, death, skill, sprite-sheet animation, DOM/CSS motion, Canvas/WebGL effects, button feedback, reward reveals, transitions, hit feel, timing, anticipation, impact and loop quality.
---

# Game Motion / VFX

## Mission

動畫要傳達：

- life
- feedback
- force
- state
- importance

不是因為「畫面要動」。

## Priority

1. gameplay feedback
2. state change
3. UI response
4. character personality
5. decoration

效能不夠：
從 5 往上刪。

## Action

Attack / Skill：

- Anticipation
- Action
- Impact
- Recovery

最低至少：
Action + Impact。

## Hit Feel

可組合：

- hit stop
- flash
- shake
- squash/stretch
- particle
- damage number
- sound

不全部開滿。

## UI Motion

至少：

- pressed
- state change
- panel enter/exit

重要 CTA 才能做 attention cue。

禁止所有按鈕都呼吸閃爍。

## Loop

Idle：
首尾必須一致。

檢查：

- position
- rotation
- scale
- opacity
- secondary motion

## Layered Character

先定義 layer manifest，
再動畫。

不要依檔名猜前後手、前後腳。

## Web

DOM 優先：

- transform
- opacity

避免高頻改：
- left
- top
- width
- height

除非有理由。

## Output

### Motion Goal
### Timeline
### Key Poses
### Layers
### VFX
### Loop / End
### Implementation
### Performance Risk
