# TODO & RECOMMENDATIONS

Được phân loại theo độ ưu tiên và effort. Đọc kèm `TECH_DEBT.md` để hiểu bối cảnh từng item.

---

## SPRINT 1 — Bugfix Critical (1-2 ngày)

### TODO-01: Fix progress bar
**File:** `assets/css/wizard.css` + `assets/js/wizard.js`  
Đổi CSS dùng element thật thay vì `::after` pseudo-element:
```css
/* wizard.css — thay ::after bằng inner div */
.progress-bar { height: 4px; background: #e0e0e0; border-radius: 2px; }
.progress-fill { height: 100%; background: var(--color-primary); transition: width 0.3s; width: 0%; }
```
```html
<!-- index.html -->
<div class="progress-bar"><div class="progress-fill" id="progressBar"></div></div>
```

---

### TODO-02: Fix edit mode — gọi Wizard.init() trước populateData()
**File:** `assets/js/app.js`
```javascript
// Đổi thứ tự trong edit mode branch:
Wizard.init();                           // render form trước
FormMapper.populateData(data);           // rồi mới populate
```

---

### TODO-03: Fix Toast với multi-line errors
**File:** `assets/js/toast.js`
```javascript
// Dùng innerHTML thay textContent (sau khi sanitize):
toast.innerHTML = message;  // message đã được join('<br>')
```
Hoặc đổi join separator:
```javascript
// app.js:
Toast.show(errors.join('\n'), 'error');
// toast.js:
toast.style.whiteSpace = 'pre-line';
toast.textContent = message;
```

---

### TODO-04: Fix draft không xóa sau edit thành công
**File:** `assets/js/app.js`
```javascript
// Trong submitForm(), sau await Api.updateUseCase(data):
Storage.clear();  // thêm dòng này
```

---

### TODO-05: Gọi validateUpdate_ trong backend
**File:** `assets/gas-backend/UseCaseService.gs`
```javascript
function updateUseCase_(recordId, data) {
  const errors = validateUpdate_(data);  // ← thêm dòng này
  if (errors.length) throw new Error(errors.join(', '));
  // ...rest of function
}
```

---

## SPRINT 2 — UX & Form Completeness (3-5 ngày)

### TODO-06: Đổi text inputs dài thành textarea
**File:** `assets/js/wizard.js::createField()`

Fields cần đổi thành `<textarea>`:
- `Pain_Point`, `Current_Process`, `Current_Problem`, `Expected_Goals` (nếu là free text)
- `Flow_Description`, `Prompt_Role`, `Prompt_Task`, `Prompt_Goal`, `Prompt_Context`
- `Prompt_Input`, `Prompt_Steps`, `When_To_Use`, `Usage_Steps`, `Usage_Notes`

```javascript
const TEXTAREA_FIELDS = new Set([
  FIELDS.PAIN_POINT, FIELDS.CURRENT_PROCESS, FIELDS.FLOW_DESC, // ...
]);
if (TEXTAREA_FIELDS.has(name)) {
  const ta = document.createElement('textarea');
  ta.name = name; ta.rows = 4;
  wrapper.appendChild(ta);
}
```

---

### TODO-07: Đổi Team và Business_Category thành `<select>` từ lookup
**File:** `assets/js/wizard.js::createField()`

```javascript
const SELECT_FROM_LOOKUP = [FIELDS.TEAM, FIELDS.BUSINESS_CATEGORY];
if (SELECT_FROM_LOOKUP.includes(name)) {
  const select = document.createElement('select');
  select.name = name;
  const options = window.__LOOKUP?.[name] || [];
  [{ value: '', text: '-- Chọn --' }, ...options.map(o => ({ value: o, text: o }))]
    .forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.value; opt.textContent = o.text;
      select.appendChild(opt);
    });
  wrapper.appendChild(select);
}
```

---

### TODO-08: Hoàn thiện labelMap
**File:** `assets/js/wizard.js`  
Thêm label tiếng Việt cho tất cả 33 fields thay vì chỉ 5 fields hiện tại.

---

### TODO-09: Validate step 3 (Demo Link format)
**File:** `assets/js/validation.js`
```javascript
step3(data) {
  const err = [];
  if (data[FIELDS.DEMO_STATUS] === 'Đã có demo' && !data[FIELDS.DEMO_LINK]) {
    err.push('Vui lòng cung cấp link demo');
  }
  if (data[FIELDS.DEMO_LINK] && !/^https?:\/\/.+/.test(data[FIELDS.DEMO_LINK])) {
    err.push('Demo link phải là URL hợp lệ (https://...)');
  }
  return err;
}
```

---

## SPRINT 3 — Architecture & Security (1 tuần)

### TODO-10: Thêm xác thực người dùng
**Option A (Đơn giản — nội bộ Google Workspace):**
Trong GAS, check `Session.getActiveUser().getEmail()` đối chiếu với whitelist domain.

**Option B (Mạnh hơn):**
Sử dụng Google Identity Services (OAuth 2.0) ở frontend, gửi token trong header, GAS verify.

---

### TODO-11: Convert JS sang ES Modules
**File:** Tất cả `assets/js/*.js`

Thay thế global namespace bằng ES modules:
```javascript
// constants.js
export const FIELDS = { ... };
export const STEPS = [ ... ];

// api.js
import { APP_CONFIG } from '../config/env.js';
export const Api = { ... };
```
```html
<!-- index.html -->
<script type="module" src="assets/js/app.js"></script>
```
Loại bỏ dependency vào load order và `window.*` globals.

---

### TODO-12: Cache lookup data ở frontend
**File:** `assets/js/storage.js` + `assets/js/app.js`

```javascript
// storage.js
const LOOKUP_CACHE_KEY = 'ai_lookup_cache';
const LOOKUP_CACHE_TTL = 3600000; // 1 giờ

saveLookup: (data) => {
  localStorage.setItem(LOOKUP_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
},
loadLookup: () => {
  const raw = localStorage.getItem(LOOKUP_CACHE_KEY);
  if (!raw) return null;
  const { data, ts } = JSON.parse(raw);
  return Date.now() - ts < LOOKUP_CACHE_TTL ? data : null;
}
```

---

### TODO-13: Fix ID generation race condition
**File:** `assets/gas-backend/UseCaseService.gs`
```javascript
function generateUseCaseId_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);          // ← lock TRƯỚC
  try {
    const sheet = getOrCreateSheet_(SHEETS.CONFIG);
    const data = sheet.getDataRange().getValues();  // ← đọc SAU khi đã lock
    // ...rest
  } finally {
    lock.releaseLock();
  }
}
```

---

## SPRINT 4 — Missing Features (2-3 tuần)

### TODO-14: Xây dựng Dashboard UI
Dashboard API đã có (`GET /dashboard-summary`). Cần tạo trang `/dashboard.html` với:
- Biểu đồ status breakdown (Chart.js hoặc Google Charts)
- Biểu đồ team/category breakdown
- Số liệu tổng: tổng use case, tổng giờ tiết kiệm
- Danh sách use cases dạng table với filter/search

---

### TODO-15: Approval workflow UI
Data model đã có `Reviewer`, `Review_Date`, `Review_Comment`, `Status` transitions. Cần:
- Trang reviewer riêng với danh sách Submitted use cases
- Nút Approve / Reject với comment
- Email notification khi status thay đổi (GAS có MailApp)

---

### TODO-16: Pagination cho duplicate check
**File:** `assets/gas-backend/UseCaseService.gs`  
Khi data lớn, thay vì full scan:
- Index UseCase_Name vào một sheet riêng
- Hoặc dùng pre-computed Bloom filter cho dedup
- Hoặc limit check chỉ với records Active/Submitted

---

### TODO-17: DASHBOARD_READY sheet — batch aggregation
**File:** `assets/gas-backend/DashboardService.gs`  
Tạo trigger GAS (time-based, mỗi giờ) để aggregate MASTER_DATA → DASHBOARD_READY. Dashboard đọc từ DASHBOARD_READY thay vì scan toàn bộ MASTER.

---

### TODO-18: Responsive form cho mobile
**File:** `assets/css/responsive.css`  
Hiện tại chỉ có 1 breakpoint (600px) và 2 rules đơn giản. Wizard 4 bước với nhiều field cần layout tốt hơn cho màn hình nhỏ.

---

## ASSUMPTIONS cần xác nhận với team

| # | Assumption | Cần xác nhận với |
|---|---|---|
| A1 | Status "Draft" khi tạo là design intent (không phải bug) | Product Owner |
| A2 | URL GAS trong env.js là URL production thật | Tech Lead |
| A3 | Spreadsheet ID trong Config.gs là production | Tech Lead |
| A4 | doOptions/CORS preflight có hoạt động không | QA/Testing |
| A5 | Ai có quyền review và approve use cases | Product Owner |
| A6 | Có cần auth nội bộ hay app chỉ dùng trong mạng nội bộ | Security |
| A7 | Dashboard page có trong roadmap không | Product Owner |
| A8 | Co_Owner và Department fields có trong form không | Product Owner |
