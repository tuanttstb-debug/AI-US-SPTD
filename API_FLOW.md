# API FLOW

## Base URL
```
https://script.google.com/macros/s/AKfycbyaM1dQcCZYHNam3zb6UrwP5Qf8BnsJr1XzjPUuGqla-k2WCAI5llLllIhadU7mfBfP/exec/
```
> **[ASSUMPTION]** URL này là URL thật đã deploy. Cần xác nhận với team để đảm bảo đây không phải URL dev/test còn sót lại.

## Response Format (chuẩn hóa toàn bộ API)
```json
{
  "success": true | false,
  "message": "string",
  "data": { ... } | null,
  "error": "string" | null
}
```
Frontend (`api.js:15`) throw Error nếu `success === false`.

---

## Endpoints

### GET /lookup
**Mục đích:** Lấy danh sách dropdown options (Business_Category, Team, User_Type, v.v.)

**Request:** Không có body

**Response.data:**
```json
{
  "Business_Category": ["Tín dụng", "Thanh toán", ...],
  "Team": ["CNTT", "Nghiệp vụ", ...],
  "User_Type": ["Cá nhân", "Team", "TT SPTD"],
  "Expected_Goals": ["Giảm thời gian", ...],
  "Input_Types": ["Email", "TLPT/BRD/FRD", ...],
  "Reuse_Level": ["Cá nhân", "Team khác", "Toàn TT SPTD"],
  "Department": ["TT SPTD", "Khối CNTT", ...]
}
```

**Backend:** `LookupService.gs::getLookupData_()` → đọc sheet LOOKUP.  
**Fallback:** Nếu sheet LOOKUP rỗng → trả hardcoded defaults.

---

### GET /usecase/{Record_ID}
**Mục đích:** Lấy chi tiết một use case (dùng trong edit mode)

**URL param:** `Record_ID` — UUID string

**Response.data:** Object chứa toàn bộ 63 fields của MASTER_DATA

**Backend:** `UseCaseService.gs::getUseCaseById_()` → `findObjectByField_('Record_ID', id)`

> **[NOTE]** ID ở đây là `Record_ID` (UUID), không phải `UseCase_ID` (`AIUS-0001`). URL có dạng `/usecase/UUID` không phải `/usecase/AIUS-0001`.

---

### POST /usecase/create
**Mục đích:** Tạo use case mới

**Request body:** Form data object (các field từ FIELDS constants)
```json
{
  "UseCase_Name": "...",
  "Owner_Name": "...",
  "Owner_Email": "...",
  "Team": "...",
  "Business_Category": "...",
  "Pain_Point": "...",
  "Flow_Description": "...",
  "Status": "Submitted"
}
```

**Response.data:**
```json
{
  "record_id": "uuid-v4",
  "usecase_id": "AIUS-0001"
}
```

**Backend flow:**
```
createUseCase_(body)
  → validateCreate_(data)     ← server-side validation
  → generateUseCaseId_()      ← AIUS-NNNN với LockService
  → appendRowFromObject_()    ← ghi vào MASTER_DATA
  → logActivity_()            ← ghi vào ACTIVITY_LOG
```

> **[BUG]** Frontend gửi `Status: "Submitted"` nhưng backend override thành `Status: "Draft"` (UseCaseService.gs:55). Use case tạo mới luôn ở trạng thái "Draft", không bao giờ "Submitted" ngay lúc tạo. Có thể là thiết kế có chủ đích (cần review), nhưng hiện tại mâu thuẫn với app.js:63.

---

### POST /usecase/update
**Mục đích:** Cập nhật use case đã tồn tại

**Request body:**
```json
{
  "Record_ID": "uuid-v4",
  "UseCase_Name": "...",
  "Status": "Submitted",
  "...": "other fields"
}
```

**Response.data:** Object đã merge (toàn bộ fields)

**Backend flow:**
```
updateUseCase_(recordId, body)
  → findObjectByField_()      ← tìm record cũ
  → merge existing + new data
  → updateRowByRecordId_()    ← overwrite row trong sheet
  → logActivity_()
```

> **[BUG]** `validateUpdate_()` được define trong ValidationService.gs nhưng `updateUseCase_()` không gọi nó. Update không có server-side validation.

---

### POST /duplicate-check
**Mục đích:** Kiểm tra tên use case có trùng với existing records không

**Request body:**
```json
{
  "UseCase_Name": "Tóm tắt email khách hàng",
  "Pain_Point": "Tốn nhiều thời gian đọc email dài"
}
```

**Response.data:**
```json
{
  "similarity_score": 0.87,
  "duplicate_flag": true,
  "match_use_case_id": "AIUS-0003",
  "match_use_case_name": "Tóm tắt nội dung email"
}
```

**Algorithm:** Dice coefficient similarity
- `combined = scoreName * 0.6 + scorePain * 0.4`
- Threshold: `>= 0.8` → duplicate

**Trigger:** `blur` event trên field `UseCase_Name`, debounce 600ms.

> **[PERFORMANCE RISK]** `checkDuplicate_()` đọc **toàn bộ** MASTER_DATA sheet mỗi lần check. Với N records → O(N) comparison. Khi dữ liệu lớn (1000+ rows) sẽ timeout (GAS limit: 6 phút/execution, nhưng Web App request thường 30s).

---

### GET /dashboard-summary
**Mục đích:** Lấy thống kê tổng hợp

**Response.data:**
```json
{
  "total_use_cases": 42,
  "status_breakdown": { "Draft": 10, "Submitted": 25, "Approved": 7 },
  "team_breakdown": { "CNTT": 20, "Nghiệp vụ": 22 },
  "category_breakdown": { "Tín dụng": 15, "Thanh toán": 12, ... },
  "total_time_saved_min": 3600,
  "total_estimated_hours_per_month": 480,
  "use_cases_with_measurement": 30
}
```

> **[NOTE]** API này tồn tại nhưng **không có UI nào hiển thị** dữ liệu này. Dashboard chưa được xây dựng.

---

### GET /health
**Response.data:** `{ "status": "healthy", "timestamp": "ISO8601" }`

> Không có UI gọi endpoint này. Chỉ dùng cho manual testing.

---

## API Error Handling
```
Frontend: api.js::request()
  → if (!response.ok) → không throw, tiếp tục parse JSON
  → if (!json.success) → throw new Error(json.message)

Backend: Code.gs::handleRequest_()
  → catch(error) → sendJson_(createResponse_(false, error.message, ...))
```

> **[GAP]** Frontend không check `response.ok` (HTTP status code). Nếu GAS trả về HTTP 5xx, frontend vẫn cố parse JSON và có thể crash với SyntaxError không rõ ràng.
