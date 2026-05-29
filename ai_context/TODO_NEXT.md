# TODO NEXT

Thứ tự ưu tiên cho session tiếp theo.

---

## P0 — [BLOCKING] Fix GAS data loading (BUG-GAS-01)

`?action=health` OK nhưng `?action=lookup` / `?action=list` lỗi. Root cause chưa xác định.

**Diagnostic cần làm ngay:**
- [ ] Mở trực tiếp trên browser: `GAS_URL?action=lookup` → paste response
- [ ] Mở: `GAS_URL?action=list&limit=3` → paste response
- [ ] GAS Editor → **Executions** → copy 2-3 dòng lỗi gần nhất
- [ ] Paste **chính xác nội dung toast** (phần trong dấu ngoặc đơn) khi app báo lỗi

**Nguyên nhân khả dĩ:**
1. GAS script chưa được authorize để truy cập Google Sheet (chạy thủ công 1 lần để grant OAuth)
2. Conflict hàm/biến trong GAS project thực tế (khác với local files)
3. `Utils.gs` addHeader fix chưa được deploy

**Fix nếu là authorization:**
→ Trong GAS Editor: chạy thủ công hàm `getLookupData_()` → GAS sẽ hỏi cấp quyền → Approve

---

## P0 — [PENDING] Push auth.js lên GitHub (BUG-FE-01)

Fix URL duplicate (`ai-usecase-platform/ai-usecase-platform/register.html`) đã đúng trong local.

```bash
git add assets/js/auth.js
git commit -m "fix: requireAuth uses basename to prevent URL duplication on subdirectory deploy"
git push
```

---

## P0 — Deploy Utils.gs lên GAS

Xóa `addHeader` calls trong `sendJson_()`. File đã sửa tại local, chưa deploy.

---

## P0 — Test toàn bộ flow sau session 2026-05-29 (Part 3)

Serve qua HTTP local: `python -m http.server 8080` hoặc `npx serve .`

Checklist:
- [ ] Login với username "tuantt4" → redirect về index.html (portal)
- [ ] Login với username "admin" → portal + hiển thị Dashboard nav trong sidebar
- [ ] index.html: sidebar đúng — Home active, Dashboard chỉ hiện với admin
- [ ] register.html: sidebar đúng — Đăng ký active; Owner_Name/Owner_Email auto-fill + readonly
- [ ] dashboard.html (admin): thấy 4 tabs, KPI row, refresh button
- [ ] dashboard.html (user thường): chỉ thấy "Use Case của tôi" tab
- [ ] dashboard.html?tab=my: auto-select tab My US
- [ ] "Use Case của tôi" tab: load danh sách đúng user
- [ ] Click row → US detail popup hiện ra đúng thông tin
- [ ] Admin click Duyệt/Từ chối trong popup → confirmation area hiện, submit → toast success
- [ ] Logout từ bất kỳ page nào → về login.html

---

## P0 (cũ) — Verify login + portal flow

Cần serve qua HTTP local server (vì sessionStorage không hoạt động đúng với `file://`):
```bash
# Python:
python -m http.server 8080
# Node:
npx serve .
```

Checklist:
- [ ] `login.html`: nhập email ngẫu nhiên → redirect về `index.html`
- [ ] `login.html`: nhập email admin (`admin@sptd.vn`) → redirect về `index.html` với card Dashboard hiển thị
- [ ] `index.html` (portal): user chip hiển thị đúng tên
- [ ] `index.html` (portal): section "Báo cáo & Phân tích" chỉ hiện khi admin
- [ ] `register.html` không có session → redirect về `login.html`
- [ ] `register.html` có session → form load bình thường
- [ ] `dashboard.html` không có session → redirect về `login.html`
- [ ] `dashboard.html` có session non-admin → redirect về `index.html`
- [ ] Logout ở portal → về `login.html`, session bị xoá
- [ ] Backward compat: truy cập `index.html?edit=AIUS-0001` → redirect về `register.html?edit=AIUS-0001`

---

## P1 — Deploy GAS (bắt buộc để dashboard live)

- [ ] Copy `assets/gas-backend/AdminService.gs` vào GAS project
- [ ] Trong `Config.gs`: cập nhật `ADMIN_EMAILS` với email thật
- [ ] Deploy lại GAS Web App (update existing deployment, không phải New)
- [ ] Cập nhật `config/env.js::APP_CONFIG.ADMIN_EMAILS` với email thật
- [ ] Test approve/reject flow từ dashboard

---

## P2 — Nâng cấp auth (security)

**Hiện tại (v3.1):** Username tự nhập, không verify, không có password. SEC-01 vẫn tồn tại.

**Recommended next:**

Option A — Thêm whitelist username:
- `AuthService.login()`: check username có trong whitelist (không phải chỉ admin)
- Nếu username không trong whitelist → không cho đăng nhập

Option B — Google Sign-In:
- `google.accounts.oauth2.initTokenClient()` (GSI v2)
- Verify token via GAS

**Clarify với PO:**
- [ ] BUG-03: Status="Draft" khi tạo mới là design intent hay bug?
- [ ] Có cần whitelist user (không phải chỉ admin) không?
- [ ] Có cần nhiều roles hơn không? (approver, viewer, submitter)

---

## P3 — Feature backlog

- [ ] "Use case của tôi" — list submissions của logged-in user (filter by Owner_Email)
- [ ] Pagination cho dashboard "Tất cả use case" (hiện giới hạn 200 records)
- [ ] "Under Review" status transition cho dashboard workflow
- [ ] Export to CSV từ dashboard

---

## P4 — Tech debt follow-up

- [ ] Migrate JS từ global var sang ES Modules (MAINT-01)
- [ ] Add script load order check vào dev docs (MAINT-02)
- [ ] Fill `assets/docs/` với deployment guide thực tế (MAINT-07)
- [ ] Add `Content-Security-Policy` header để giảm XSS risk (SEC-02 follow-up)

---

## P5 — UI Polish (sau v3.0 refactor)

- [x] **SVG icon library** — Heroicons 2.0 inline, thay toàn bộ emoji trong dashboard.html (done 2026-05-29)
- [x] **Chart.js integration** — doughnut (status) + horizontal bar (team, category) — done 2026-05-29
- [ ] **Line chart (submission trend)** — cần thêm `trend_data` field từ GAS API trước khi implement
- [ ] **Sidebar cho register.html** — nếu PO muốn consistent enterprise layout toàn bộ app
- [ ] **Dark mode** — tokens đã sẵn sàng, chỉ cần thêm `@media (prefers-color-scheme: dark)` block trong `variables.css`
- [ ] **Logo SVG** — thay thế Heroicons sparkles trong sidebar brand bằng logo TPBank BIZ proper
