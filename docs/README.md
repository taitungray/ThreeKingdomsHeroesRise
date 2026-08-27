# 三國：群英再起文件入口

狀態：文件治理的單一入口。這裡只說明文件放哪裡、誰有權威，以及內容如何流轉。

## 先看這四份

| 想知道什麼 | 文件 | 內容邊界 |
|---|---|---|
| 必須遵守什麼 | [製作與工程規範](standards/production-rules.md) | 強制規則，不放進度與完成聲明 |
| 現在遊戲實際是什麼 | [目前遊戲規格](specs/current-game-spec.md) | 可由程式、資料或證據核對的現況 |
| 接下來要做什麼 | [目前工作清單](work/active-backlog.md) | 尚未完成的工作、優先級與完成條件 |
| 現在有哪些錯誤 | [已知問題](issues/known-issues.md) | 已重現缺陷、證據、狀態與關閉條件 |

「要做的」與「問題」刻意分開：問題描述實際偏差；工作清單描述要採取的行動。一個工作可以處理多個問題，但不得在兩邊複製整段內容。

## 目錄結構

```text
docs/
├─ standards/   強制規範：工程、UI、無障礙、美術、戰鬥資產
├─ specs/       目前規格：遊戲現況與 runtime 架構
├─ work/        目前要做：唯一 active backlog
├─ issues/      已知問題：可重現缺陷與關閉證據
├─ qa/          測試方法：矩陣、視覺驗收與判定門檻
├─ release/     發布程序：平台、帳號、廣告、資料安全
├─ reference/   參考資料：外部研究與整合稽核
└─ archive/     歷史資料：舊計畫與舊評估，不代表現況
```

### 強制規範 `standards/`

- [製作與工程規範](standards/production-rules.md)
- [UI、文字與互動規範](standards/ui-display-rules.md)
- [無障礙與行動裝置規範](standards/accessibility-wcag.md)
- [遊戲美術規範](standards/game-art-bible.md)
- [戰鬥角色渲染契約](standards/combat-character-render-contract.md)

### 目前規格 `specs/`

- [目前遊戲規格](specs/current-game-spec.md)
- [Runtime 架構](specs/architecture.md)

### 工作、問題與 QA

- [目前工作清單](work/active-backlog.md)
- [已知問題](issues/known-issues.md)
- [QA 測試矩陣](qa/qa-test-matrix.md)
- [視覺驗收規範](qa/visual-qa.md)

### 發布、參考與歷史

- [發布文件入口](release/README.md)
- [平台與發布規範](release/platform-and-release.md)
- [參考分析](reference/reference-analysis.md)
- [IncenseAshes 整合稽核](reference/reference-integration-audit.md)
- [歷史文件入口](archive/README.md)

## 權威順序

1. 根目錄 `AGENTS.md` 與 `standards/` 的強制規範。
2. `specs/` 的可驗證現況；若與程式不同，先標記不一致。
3. `issues/`、`work/` 與 `qa/` 的問題、行動與驗收。
4. `release/` 的平台程序與外部條件。
5. `reference/` 與 `archive/` 只提供決策脈絡，不能覆蓋目前現況。

程式、執行結果、截圖或實機證據與文件衝突時，不得引用舊計畫自稱完成；應更新目前規格、建立問題並安排工作。

## 內容流轉規則

1. 新需求先進 `work/active-backlog.md`，寫清楚目標、完成條件與依賴。
2. 已發生且可重現的錯誤進 `issues/known-issues.md`；尚未重現的疑慮標記為缺少證據，不直接當成缺陷。
3. 實作完成後依 `qa/` 驗證；測法留在 QA，測試結果與證據寫回問題或交付紀錄。
4. 驗證通過後更新 `specs/current-game-spec.md`；關閉問題，從 active backlog 移除已完成工作。
5. 被取代的長篇計畫或評估移到 `archive/`，不在原文繼續追加「本輪已完成」。

## 維護要求

- 每份非歷史文件開頭要標明用途或狀態。
- 規範不用 `[x]`；工作清單不用主觀完成百分比；問題不用願望式功能清單。
- 同一規則只保留一個權威位置，其他文件用連結引用。
- 文件改動後執行 `npm run test:docs`。
