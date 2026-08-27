# 三國：群英再起文件入口

## 製作規範

- reference-analysis.md：參考遊戲的公開資訊、可借鑑結構與自主設計決策。
- game-completion-plan.md：目前專案盤點、Core Loop、里程碑與完成門檻。
- ui-display-rules.md：UI 視覺、觸控、響應式、文字、紙娃娃與動畫底線。
- production-rules.md：新增功能、存檔、獎勵、資產、效能與驗證流程。
- visual-qa.md：使用者要求畫面測試時的 12 項視覺驗收與硬錯誤。
- accessibility-wcag.md：WCAG 2.1 AA、ARIA、焦點、對比與 reduced-motion。

## 平台與營運

- platform-and-release.md：PWA、Capacitor、Android、AdMob 與發布。
- ads-integration.md：rewarded ad 入口、發獎、防重與每日上限。
- google-play-submission.md：商店素材、Data safety、簽名與測試軌清單。
- data-safety-draft.md：尚未上架前的資料安全草稿。

- architecture.md：runtime 模組邊界、載入順序與後續功能擴充規範。

- deferred-backlog.md：本地已完成項目與外部依賴待補清單。
## 美術、戰鬥與效能

- game-art-bible.md：角色、裝備、UI、色盤、像素比例與統一驗收標準。
- combat-art-style-evaluation.md：戰鬥角色像素風格評估與演進方向。
- combat-character-sprite-migration.md：戰鬥角色拆件式 Sprite 資產方案與規格。
- combat-character-visual-evaluation.md：戰鬥角色、Boss、受擊與技能表現評估。
- combat-visual-enhancement-plan.md：打擊感、技能特效、天候、HUD 與音效方案。
- global-ui-and-icon-art-evaluation.md：全局 UI、裝備圖示與操作反饋評估。
- image-assets-migration-evaluation.md：程式繪製與 PNG/Sprite 資產遷移評估。
- performance-optimization-plan.md：HUD、特效池、背景休眠與低階裝置效能方案。

## 專案狀態與發布

- project-evaluation.md：原始全面評估與本輪實作後的現況補充；前段缺口表保留為歷史基線。
- master-optimization-roadmap.md：總體優化里程碑與目前勾選狀態。
- payment-and-iap-plan.md：正式 IAP 架構設計與本地安全降級現況。

本目錄目前共 24 份 Markdown 文件。可離線完成的本地功能以 `deferred-backlog.md`、`game-completion-plan.md` 與 `master-optimization-roadmap.md` 的最新日期補充為準；正式商店、金鑰、廣告、法務、後端與真實音訊等外部條件仍保留在待補文件，不以測試配置冒充完成。
