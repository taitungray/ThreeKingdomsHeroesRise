# Runtime architecture

`game.js` is kept as a small compatibility marker. The playable runtime is loaded by `index.html` in this order:

1. `data/game-data.js` — data tables only: heroes, paper-doll equipment, tactics, chapters and stages.
2. `js/game/game-core.js` — DOM handles, save migration, shared state, data helpers and terrain setup.
3. `js/game/game-combat.js` — units, waves, skills, damage, rewards and stage progression.
4. `js/game/game-render.js` — Canvas drawing, pixel character details, effects and the frame loop.
5. `js/game/game-ui.js` — HUD, panels, roster, formation, campaign and panel actions.
6. `js/game/game-main.js` — input listeners, visibility/offline income and boot.

The files intentionally use ordered classic scripts for the current WebView/Cordova target. That keeps the existing global runtime stable while making each subsystem independently searchable and replaceable. New systems should follow the same boundaries:

- New content belongs in `data/`.
- New persistent fields belong in `game-core.js` save migration.
- New battle rules belong in `game-combat.js`.
- New visual effects belong in `game-render.js`.
- New panels and buttons belong in `game-ui.js`.
- New global listeners belong in `game-main.js`, with cleanup if a listener is scoped to a scene.

`npm test` verifies that all runtime modules exist, load after the data file in dependency order, preserve the core-loop markers, and keep the legacy `game.js` marker small.