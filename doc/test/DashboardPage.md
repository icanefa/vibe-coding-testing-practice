# DashboardPage 測試案例清單

> 狀態：初始為 [ ]、完成為 [x]
> 注意：狀態只能在測試通過後由流程更新。

---

## [x] 【前端元素】初始畫面渲染
**範例輸入**：載入 DashboardPage 頁面 (假設為一般用戶)  
**期待輸出**：應正確渲染「儀表板」標題、歡迎使用者區塊與打招呼文字，以及登出按鈕

---

## [x] 【前端元素】管理員權限顯示
**範例輸入**：AuthContext 提供 `user: { role: 'admin', username: 'AdminUser' }`  
**期待輸出**：Header 導覽列應顯示「🛠️ 管理後台」連結，且 Welcome 區塊的 badge 應顯示「管理員」

---

## [x] 【前端元素】一般用戶權限顯示
**範例輸入**：AuthContext 提供 `user: { role: 'user', username: 'NormalUser' }`  
**期待輸出**：Header 導覽列「不應顯示」管理後台連結，且 Welcome 區塊的 badge 應顯示「一般用戶」

---

## [x] 【邏輯流程】點擊登出按鈕時呼叫 logout 並導航至 Login
**範例輸入**：點擊「登出」按鈕  
**期待輸出**：應呼叫 AuthContext 提供的 `logout()` 函式，並使用 `navigate` 導航至 `/login`，帶有 `{ replace: true, state: null }` 參數

---

## [x] 【狀態處理】初始載入時顯示 Loading 狀態
**範例輸入**：API 尚未回覆商品列表前  
**期待輸出**：畫面上顯示「載入商品中...」與 spinner 圖示

---

## [x] 【Mock API】成功取得商品列表
**範例輸入**：`productApi.getProducts()` 成功回傳商品陣列  
**期待輸出**：Loading 結束後，畫面正確渲染出所有的商品卡片 (包含名稱、價格、描述)

---

## [x] 【Mock API】取得商品列表失敗時顯示錯誤訊息
**範例輸入**：`productApi.getProducts()` 拋出錯誤，Axios status code 回傳 500，且帶有 `{ message: '伺服器嚴重錯誤' }` 的資料  
**期待輸出**：Loading 結束後，畫面上顯示錯誤區塊並包含「伺服器嚴重錯誤」文字

---

## [ ] 【Mock API】取得商品列表發生 401 錯誤時不顯示頁面錯誤
**範例輸入**：`productApi.getProducts()` 拋出 HTTP 401 錯誤  
**期待輸出**：因 401 將由 axios interceptor 處理，頁面上不會渲染錯誤訊息區塊
