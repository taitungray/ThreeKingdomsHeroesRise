# 三國：群英再起文件入口

這個目錄不再用「有勾選就算完成」管理。文件依權威性分層；程式與測試證據優先於歷史計畫文字。

## 第一層：強制規範

- [製作與工程規範](production-rules.md)：來源、流程、風險分級、存檔、獎勵、資產與完成證據。
- [UI、文字與互動規範](ui-display-rules.md)：視覺、觸控、角色、兵器、覆蓋層與動畫底線。
- [平台與發布](platform-and-release.md)：PWA、Capacitor、Android、廣告與正式發布。
- [無障礙與行動裝置](accessibility-wcag.md)：WCAG 2.1 AA 目標、鍵盤、焦點、語意、動態內容與 reduced motion。

## 第二層：目前可驗證現況

- [目前遊戲規格](current-game-spec.md)：由程式與資料核對的現況、已確認項目與發布阻擋。
- [Runtime 架構](architecture.md)：模組邊界、載入順序、資產與生命週期責任。
- [戰鬥角色渲染契約](combat-character-render-contract.md)：角色、敵人、Boss、兵器與 fallback 的硬契約。
- [遊戲美術聖經](game-art-bible.md)：三國像素風格、比例、輪廓、色盤與素材一致性。

## 第三層：問題、檢查與驗收

- [已知問題與防止再犯](issues-and-prevention.md)：從實際錯誤整理的原因、預防規則與回歸條件。
- [QA 測試矩陣](qa-test-matrix.md)：功能、戰鬥狀態、存檔、背景恢復、瀏覽器與實機門檻。
- [視覺驗收規範](visual-qa.md)：尺寸、戰鬥逐狀態截圖、硬錯誤與證據格式。
- [參考整合稽核](reference-integration-audit.md)：本專案與 IncenseAshes 全部 Markdown 的採用、調整與禁止項目。

## 第四層：平台、營運與外部依賴

- [廣告整合](ads-integration.md)
- [雲端登入設定](cloud-auth-setup.md)
- [Google Play 提交](google-play-submission.md)
- [Data safety 草稿](data-safety-draft.md)
- [付款與 IAP 計畫](payment-and-iap-plan.md)
- [延後清單](deferred-backlog.md)

## 第五層：計畫與歷史評估

下列文件用於保留決策脈絡，不是目前完成證明。其 `[x]` 只有在目前規格與 QA 證據同步成立時才有效。

- [參考分析](reference-analysis.md)
- [遊戲完成計畫](game-completion-plan.md)
- [專案評估](project-evaluation.md)
- [總體優化路線圖](master-optimization-roadmap.md)
- [戰鬥畫面優化計畫](battle-screen-optimization-plan.md)
- [戰鬥美術風格評估](combat-art-style-evaluation.md)
- [戰鬥角色 Sprite 遷移](combat-character-sprite-migration.md)
- [戰鬥角色視覺評估](combat-character-visual-evaluation.md)
- [戰鬥視覺強化計畫](combat-visual-enhancement-plan.md)
- [全局 UI 與圖示評估](global-ui-and-icon-art-evaluation.md)
- [圖片資產遷移評估](image-assets-migration-evaluation.md)
- [效能優化計畫](performance-optimization-plan.md)

## 維護規則

- 不硬寫文件總數；新增或移除文件時更新本入口與相關連結。
- 現況只寫進 `current-game-spec.md`；反覆發生的錯誤寫進 `issues-and-prevention.md`；測法寫進 QA 文件。
- 計畫文件保留原始日期與歷史，不回頭把未驗證項目改成「已完成」。
- 文件改動後執行 `npm run test:docs`。
