# IncenseAshes 與本專案文件整合稽核

稽核日期：2026-08-28。

## 1. 閱讀範圍

`已確認`：完整讀取本專案 29 份 Markdown（根目錄與 `docs/`）以及參考專案 64 份 Markdown，共 93 份。

AGENTS 原先記載的 `D:/Rayon/IncenseAshes/` 在本機不存在；實際可讀參考位於 `C:/IncenseAshes/`。這次只讀取 Markdown 並比較流程，沒有搬移參考案程式或生產識別資料。

## 2. 直接採用

| 方法 | 落地位置 |
|---|---|
| 權威現況、計畫、歷史分層 | `docs/README.md`、`AGENTS.md` |
| `已確認／推論／缺少證據／不一致` 證據標籤 | `production-rules.md`、`current-game-spec.md` |
| 依風險決定快速或完整驗證 | `production-rules.md`、`qa-test-matrix.md` |
| 功能 QA 與視覺／玩法 QA 分開 | `qa-test-matrix.md`、`visual-qa.md` |
| Given／When／Then、背景恢復、重啟與 storage 邊界 | `qa-test-matrix.md` |
| 完成宣告需附命令、環境、結果與未測範圍 | `production-rules.md` |
| 反覆問題要寫防止再犯，不只補單點 | `issues-and-prevention.md` |
| selector／變數／識別字使用 ASCII | `production-rules.md` |

## 3. 調整後採用

| 參考原則 | 本專案調整 |
|---|---|
| image-first／material-first | 保留，但材質改為三國軍帳、鐵木、紙卷、朱砂與像素戰場 |
| 熟悉的行動遊戲資訊架構 | 套用到頂部指揮條、右側四快捷＋更多、底部五頁籤，不複製參考畫面 |
| 動畫／角色狀態契約 | 改為我方、普通敵人、Boss 與兵器的 idle／move／attack／hit／death |
| 視覺 QA 與尺寸矩陣 | 改為 390×720 主基準，加 430×932、320×568、短高橫向 |
| 資產完整性檢查 | 加入 WebP、alpha、Sprite cell、foot／hand anchor 與 runtime 消費檢查 |
| 無障礙與 reduced motion | 套用於 Canvas 戰鬥、modal、快捷抽屜、動態戰報與全畫面 shake |

## 4. 明確禁止採用

- 參考案的神明／香火題材、角色、美術、顏色、文案、頁面骨架與商店素材。
- Firebase project、API key、AdMob ID、application ID、keystore、簽名、上傳憑證、後端 URL、帳號與生產設定。
- 參考案損壞、亂碼、過時連結或彼此衝突的 Markdown 內容。
- 只因參考案 checklist 已勾選，就在本專案宣稱相同項目完成。
- 與本專案三國戰鬥核心無關的系統、資料欄位或營運假設。

## 5. 發現的共通風險

1. 文件數量多不代表有單一真相；若現況、計畫與歷史混寫，勾選會掩蓋實際缺陷。
2. source marker 與檔案存在測試很快，但無法證明角色圖正確、動畫連續、獎勵不重複或瀏覽器能完整遊玩。
3. UI 重做若先堆 CSS、沒有 Screen Goal、state contract 與 layout anchor，會產生多層 override 與 z-index 問題。
4. 戰鬥視覺是生命週期，不是單張圖；必須測攻擊、受擊、死亡、移除、下一波與重開。
5. 參考專案本身也有破損行與過時假設，因此這次採用的是方法，不是整份複製。

## 6. 本次整合判定

文件治理、證據分級、QA 矩陣、視覺硬門檻、無障礙檢查與問題預防可直接提升本專案，已納入權威文件。遊戲美術與實際戰鬥資產仍需依本專案風格重新製作和逐狀態驗收；參考案不能代替這項工作。
