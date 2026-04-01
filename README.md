# TestRail Dashboard

一個開源的 TestRail 唯讀 Dashboard，輸入自己的 TestRail 憑證即可瀏覽 Projects、Test Runs、匯出 HTML 報告。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/duckgua/testrail-html-export)

---

## 功能

- 瀏覽所有 Projects、Milestones、Test Runs
- 查看 Test Case 詳細步驟與結果
- 跨 Project 搜尋 Test Cases
- 匯出 HTML 報告（含圖片嵌入）
- 憑證儲存於瀏覽器 session，關閉分頁即清除

---

## 使用方式

### 方式 A：一鍵部署到 Vercel（推薦，免費）

1. 點上方 **Deploy with Vercel** 按鈕
2. 登入 / 註冊 Vercel 帳號
3. 點 Deploy，等待約 1 分鐘
4. 開啟產生的網址，輸入 TestRail 憑證即可使用

> 不需要設定任何環境變數。

### 方式 B：本機執行

```bash
git clone https://github.com/duckgua/testrail-html-export
cd testrail-dashboard
npm install
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000)，輸入 TestRail 憑證即可使用。

---

## 需要準備的憑證

| 欄位 | 說明 | 範例 |
|------|------|------|
| TestRail URL | 你的 TestRail 網址 | `https://yourcompany.testrail.io` |
| Email | TestRail 登入 Email | `you@example.com` |
| API Key | TestRail → My Settings → API Keys | `xxxxxxxxxxxxxxxx` |

---

## Tech Stack

- [Next.js 16](https://nextjs.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

---

## 安全說明

- **憑證不落地**：你的 TestRail URL、Email 與 API Key 僅存於瀏覽器的 sessionStorage 與 HttpOnly Cookie，關閉分頁即自動清除，**不會儲存於任何伺服器或資料庫**。
- **資料不留存**：匯出的 HTML 報告以串流方式直接下載到你的電腦，**伺服器端不保留任何 TestRail 資料**。
- **XSS 防護**：所有來自 TestRail 的 HTML 內容在渲染前均經過 [DOMPurify](https://github.com/cure53/DOMPurify) 過濾。
- **API 限流保護**：遇到 TestRail 回傳 `429 Too Many Requests` 時，會自動等待並重試，不會對 TestRail 伺服器造成過度請求。
- **建議內部使用**：憑證（API Key）存於瀏覽器記憶體，並在每次 API 請求的 HTTP headers 中傳送。雖然傳輸走 HTTPS 已加密，但開啟 DevTools Network tab 的人仍可看到這些值。**建議僅部署於受信任的內部網路或個人使用，不建議對外公開部署給不特定人員使用**。
- 本工具為非官方社群工具，與 TestRail / Gurock Software 無任何關聯。

---

## 免責聲明

本軟體依 [MIT License](./LICENSE) 授權，**按「現狀（AS IS）」提供，不附帶任何明示或暗示的保證**。作者對於因使用本工具而造成的任何資料遺失、服務中斷或其他損害，**不承擔任何法律責任**。使用前請確認符合貴組織的資訊安全政策及 TestRail 服務條款。
