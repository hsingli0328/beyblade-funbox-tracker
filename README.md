# Beyblade X｜Funbox LINE 抽選追蹤器

一個純前端、可直接部署到 GitHub Pages 的 Beyblade X / Funbox 小工具。

## V1 功能

- 北部／中部 Funbox 店家目錄
- 依區域、縣市與關鍵字篩選
- 一鍵開啟 LINE 官方帳號
- Facebook 粉專快捷連結
- 門市收藏
- 已開啟 LINE 的門市自動標記
- 商品追蹤清單（例如 UX-19、CX-18）
- 抽選資料獨立放在 `data/draws.json`
- 手機版 Responsive UI
- 狀態使用 `localStorage` 保存，不需要後端或資料庫

## 店家資料來源

V1 的店名、Facebook 粉專網址、LINE 官方帳號 ID，依：

`Funbox 戰鬥陀螺LINE抽選 各店資料表.xlsx`

整理。

目前先納入：

- 北部：台北市、新北市、桃園市、新竹市、新竹縣
- 中部：苗栗縣、台中市

宜蘭與南部／東部門市暫未加入 V1。

## 專案結構

```text
.
├── index.html
├── styles.css
├── app.js
└── data
    ├── stores.json
    └── draws.json
```

## 本機測試

因為頁面會用 `fetch()` 讀 JSON，請不要直接雙擊 `index.html`。

Python：

```bash
python -m http.server 8080
```

然後開啟：

```text
http://localhost:8080
```

## 新增抽選活動

`data/draws.json` 預設是空陣列：

```json
[]
```

加入活動時可使用：

```json
[
  {
    "store": "新竹巨城",
    "start": "2026-08-15T11:00:00+08:00",
    "items": [
      {
        "code": "UX-19",
        "name": "商品名稱",
        "url": "https://..."
      }
    ]
  }
]
```

`store` 建議與 `data/stores.json` 裡的店名完全相同，網站會自動補上區域與縣市。

## GitHub Pages

建立 public repository 後，把本專案所有檔案放到 `main` branch。

接著在 Repository：

`Settings → Pages → Build and deployment → Deploy from a branch`

選擇：

- Branch：`main`
- Folder：`/ (root)`

存檔後即可使用 GitHub Pages。

## 注意

本專案不是 Funbox 官方網站。抽選日期、商品與參加方式，請以各門市 LINE 官方帳號公告為準。
