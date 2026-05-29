# QUICK START — Hướng dẫn tiếp quản & phát triển

## Yêu cầu môi trường
- Trình duyệt hiện đại (Chrome/Edge/Firefox)
- Tài khoản Google có quyền truy cập Google Sheets và Google Apps Script
- Không cần Node.js, không cần build tools

## Cấu trúc thư mục
```
ai-usecase-platform-main/
├── index.html                  ← Entry point duy nhất
├── config/
│   ├── env.js                  ← ⚠️ Sửa API_BASE_URL ở đây
│   └── routes.js               ← Route builder (không cần sửa thường xuyên)
├── assets/
│   ├── css/                    ← Styling (variables → base → layout → components → wizard → responsive)
│   ├── js/                     ← Frontend logic
│   │   ├── constants.js        ← ⭐ Định nghĩa FIELDS và STEPS (form structure)
│   │   ├── app.js              ← ⭐ Entry point JS
│   │   ├── wizard.js           ← ⭐ Form wizard + FieldBuilder
│   │   └── ...
│   ├── gas-backend/            ← Code GAS (copy-paste vào Apps Script)
│   │   ├── Code.gs             ← ⭐ Router chính
│   │   ├── Config.gs           ← ⭐ SPREADSHEET_ID và HEADERS
│   │   └── ...
│   └── docs/                   ← Tài liệu cũ (hầu hết trống)
```

## Chạy ứng dụng local

### Cách 1: Python HTTP server (đơn giản nhất)
```bash
cd ai-usecase-platform-main
python -m http.server 8080
# Mở: http://localhost:8080
```

### Cách 2: VS Code Live Server
- Cài extension "Live Server" → Right click `index.html` → "Open with Live Server"

### Cách 3: Mở file trực tiếp
> **[WARNING]** Không mở `index.html` bằng `file://` protocol — CORS sẽ block các API calls.

## Setup Google Apps Script (Backend)

### Bước 1: Tạo Google Apps Script Project
1. Vào [script.google.com](https://script.google.com)
2. Tạo project mới
3. Copy từng file trong `assets/gas-backend/` vào project:
   - `Code.gs` → đặt tên là `Code`
   - `Config.gs` → đặt tên là `Config`
   - `UseCaseService.gs`, `LookupService.gs`, `DashboardService.gs`
   - `LoggerService.gs`, `ValidationService.gs`, `Utils.gs`

### Bước 2: Cấu hình Spreadsheet
1. Tạo Google Sheet mới
2. Copy Spreadsheet ID từ URL: `https://docs.google.com/spreadsheets/d/**[ID HERE]**/edit`
3. Mở `Config.gs`, thay `SPREADSHEET_ID` bằng ID thật:
   ```javascript
   const SPREADSHEET_ID = 'your-actual-spreadsheet-id';
   ```

### Bước 3: Deploy Web App
1. GAS Editor → Deploy → New deployment
2. Type: Web app
3. Execute as: **Me** (tài khoản Google của bạn)
4. Who has access: **Anyone** (hoặc "Anyone within [organization]" nếu muốn internal only)
5. Click Deploy → Copy Web App URL

### Bước 4: Cấu hình Frontend
Mở `config/env.js`, thay URL:
```javascript
const APP_CONFIG = {
  API_BASE_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec/',
  // ...
};
```
> **[QUAN TRỌNG]** URL phải kết thúc bằng `/exec/` (có trailing slash).

### Bước 5: Khởi tạo Sheets
Gọi API một lần để GAS tự tạo các sheets:
```
GET https://your-gas-url/exec/health
```
GAS sẽ tự động tạo sheets MASTER_DATA, LOOKUP, ACTIVITY_LOG, CONFIG nếu chưa có.

### Bước 6: Populate LOOKUP sheet (tùy chọn)
Nếu muốn custom dropdown options, thêm data vào sheet LOOKUP:
| Field | Value |
|---|---|
| Business_Category | Tín dụng |
| Business_Category | Thanh toán |
| Team | CNTT |
| ... | ... |

## Thêm trường form mới

### 1. Thêm constant (constants.js)
```javascript
const FIELDS = {
  // ... existing
  MY_NEW_FIELD: 'My_New_Field',  // ← thêm đây
};
```

### 2. Thêm vào STEPS (constants.js)
```javascript
{ id: 1, title: 'Thông tin nghiệp vụ', fields: [
  // ...
  FIELDS.MY_NEW_FIELD,  // ← thêm đây
]},
```

### 3. Thêm label (wizard.js, trong createField)
```javascript
const labelMap = {
  // ...
  [FIELDS.MY_NEW_FIELD]: 'Label tiếng Việt',
};
```

### 4. Thêm HEADERS (Config.gs)
```javascript
const HEADERS = [
  // ...
  'My_New_Field',  // ← thêm đúng vị trí trong cột của sheet
];
```
> **[QUAN TRỌNG]** Sau khi thêm HEADERS, phải thêm cột tương ứng vào Google Sheet thủ công, hoặc xóa sheet MASTER_DATA để GAS tạo lại với headers mới.

## Thay đổi thường gặp

| Task | File cần sửa |
|---|---|
| Đổi API URL | `config/env.js` |
| Thêm step mới | `constants.js` (STEPS array) |
| Thêm required field | `validation.js` + `Config.gs` (REQUIRED_FIELDS_CREATE) |
| Đổi màu sắc | `assets/css/variables.css` |
| Đổi ngưỡng duplicate | `Config.gs` (DUPLICATE_THRESHOLD) |
| Thêm dropdown option | LOOKUP sheet trong Google Sheets |
| Xem logs | ACTIVITY_LOG sheet trong Google Sheets |
