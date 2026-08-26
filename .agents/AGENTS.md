# 代理補充入口

產品／UI／驗收規範以根目錄 [`AGENTS.md`](../AGENTS.md) 與 [`docs/`](../docs/) 為準。

## Web Game Skills（換機靠 git）

**只維護** `.agents/skills/`（唯一實體、進 git）。

clone 後 Cursor／Codex／Gemini 皆直接讀 `.agents/skills/`，不必再複製三份。

| 工具 | 路徑 |
|---|---|
| Cursor | `.agents/skills/`（另有 `.cursor/skills` symlink 備援） |
| Codex | `.agents/skills/` |
| Gemini | `.agents/skills/` |

路由表：[`ROUTING-web-game-skills.md`](ROUTING-web-game-skills.md)

可選個人目錄連結：

```powershell
.\scripts\sync-web-game-skills.ps1 -UserHome
```
