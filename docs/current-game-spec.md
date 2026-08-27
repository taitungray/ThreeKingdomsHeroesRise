# 三國：群英再起目前遊戲規格

更新日期：2026-08-28。這份文件只描述可由目前程式、資料、manifest 或測試直接核對的現況；計畫與願望不寫成已完成功能。

## 1. 產品與核心循環

`已確認`：直式 Web/H5 三國放置 RPG，主要流程為登入／訪客進入、配置武將與裝備、進入自動戰鬥、通過三個普通波次、挑戰 Boss、取得資源與推進關卡，再使用資源成長。

`已確認`：`data/game-data.js` 目前提供至少 50 名武將、20 章／100 關資料、普通敵人池、每波敵將與 Boss 敵將。每關資料契約為三個普通波次後進入 Boss。

`已確認`：主畫面包含頂部主公／自動／速度／關卡資訊、右側四個快捷與「更多」、Canvas 戰場、資源列、首領按鈕及五個底部頁籤。

## 2. Runtime 與戰鬥

`已確認`：載入順序為資料、core、combat、render、UI、main；`game.js` 只保留小型相容性標記。

`已確認`：戰鬥單位有移動、攻擊 action、受擊、死亡、技能、狀態、波次與結算資料。普通波、Boss、勝利與失敗都有程式路徑。

`已確認`：attack manifest 宣告我方、普通敵人與 Boss 都有 8 方向 × 5 階段攻擊圖集；因目前圖集未通過 body coverage gate，renderer 已以 `ATTACK_SPRITES_APPROVED = false` 將整批隔離，暫時只使用透明 body、action transform 與戰鬥兵器資產。圖集修復並通過自動化與逐狀態視覺驗收後才可重新啟用。

`已確認`：抽查 `attack-guanyu-v1.webp` 與 `attack-boss-zhangjiao-v1.webp` 時，每格主要只剩程序手臂／軌跡，原本 body 圖層沒有正確進入產物；檔案存在測試未能發現這件事。這些圖集目前不具發布品質。

`不一致`：UI 規範禁止全畫面震動，但 `runtime.shake` 與 Canvas translate 仍存在；應改成局部 hit feedback 或明確納入 reduced-effects 控制。

`已確認`：專案目前沒有 `navigator.vibrate` 呼叫；瀏覽器震動 console 噪音不應再出現。

`已確認`：瀏覽器 QA 曾發現 `drawUnit()` 最外層 Canvas transform 未 restore，導致角色逐人被推到畫布外；目前已補回 restore。source 與同步後的 `www` 都已在 Chrome 記錄完整 body／weapon draw transform，超出 390×720 合理邊界即失敗；角色飛出畫布問題已關閉。兵器握點、攻擊、死亡與 Boss 等美術問題仍分別維持 OPEN／VERIFY。

## 3. 成長、內容與面板

`已確認`：資料與 UI 路徑包含武將、編隊、戰法、戰役、每日／每週、簽到、商城、圖鑑、演武、塔、副本、成就、活動、戰報、裝備、精煉、升星、突破、頭框、稱號與寶物。

`缺少證據`：上述系統多數有資料、函式或面板 marker，但尚未有一份逐項執行、重載、失敗路徑與獎勵防重的完整瀏覽器／實機報告。因此不能因 smoke test 找到函式名稱就宣稱所有系統完成。

## 4. 存檔、離線與雲端

`已確認`：本地存檔 key 為 `taoyuan-qunying-v2`，目前 schema version 為 3；載入支援 2／3 並遷移至 3。狀態包含資源、關卡、武將成長、編隊、裝備、任務、活動、商店、離線等欄位。

`已確認`：`persist()` 先寫入 localStorage，再排入雲端同步；visibility 與離線收益有程式路徑。

`缺少證據`：雲端登入衝突、跨裝置最後寫入、離線後重連、原生 Google bridge 與正式 Firestore 規則仍需真實環境驗證。

## 5. 資產與視覺現況

`已確認`：角色 body、portrait、attack、mount、Boss、VFX、terrain 與 combat weapon 皆有 WebP／manifest 管理，Canvas 使用 nearest-neighbor。

`不一致`：既有計畫文件多處標示視覺或角色遷移已完成，但實際截圖曾出現敵將卡遮擋、角色黑框、錯誤敵人圖、攻擊／死亡錯亂、兵器握點與輪廓不合格。視覺狀態應以逐狀態 QA 為準。

`缺少證據`：所有武將、敵人、Boss 與兵器尚未有 idle／move／attack／hit／death 的完整視覺證據矩陣。

## 6. 目前發布判定

目前判定：`FAIL／不可發布`。

阻擋項目：

1. 戰鬥攻擊圖集未通過 body coverage gate，目前被 runtime 隔離；仍需重新製作與逐狀態驗收。
2. 普通敵人、Boss、兵器與死亡狀態尚未通過完整逐狀態視覺矩陣。
3. 歷史完成清單與實際畫面衝突，需以新的 QA gate 重新驗證。
4. 正式商店、帳號、政策、廣告、簽名與實機條件仍依平台文件補齊。

解除條件：`qa-test-matrix.md` 的 P0 全部 PASS、`visual-qa.md` 無硬錯誤、console 無錯誤、存檔／獎勵／重啟流程通過，並留下可追溯證據。

## 7. 維護方式

修改玩法、存檔、主資訊架構或渲染契約時更新本檔。計畫文件的勾選不得反向覆蓋本檔；若本檔與程式不同，先標記「不一致」並在 `issues-and-prevention.md` 建立項目。
