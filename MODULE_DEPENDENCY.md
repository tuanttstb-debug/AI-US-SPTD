# MODULE DEPENDENCY GRAPH

## Frontend — Dependency Graph

```
app.js
 ├── requires: Api           (api.js)
 ├── requires: Wizard        (wizard.js)
 ├── requires: FormMapper    (form-mapper.js)
 ├── requires: Validator     (validation.js)
 ├── requires: Toast         (toast.js)
 └── requires: Storage       (storage.js)

wizard.js
 ├── requires: STEPS, FIELDS (constants.js)
 ├── requires: FormMapper    (form-mapper.js)
 ├── requires: Validator     (validation.js)
 ├── requires: Toast         (toast.js)
 └── requires: FieldBuilder  (defined IN wizard.js)
       ├── requires: FIELDS, STEPS  (constants.js)
       ├── requires: debounce       (helpers.js)
       └── requires: DuplicateChecker (duplicate-check.js)
              └── requires: Api    (api.js)

api.js
 └── requires: API (routes.js)
        └── requires: APP_CONFIG (env.js)

validation.js
 └── requires: FIELDS (constants.js)

storage.js
 └── requires: APP_CONFIG.AUTO_SAVE_KEY (env.js)

form-mapper.js
 └── (no explicit deps — reads DOM directly)

toast.js
 └── (no explicit deps — reads DOM directly)

helpers.js
 └── (pure functions — no deps)
```

## Backend (GAS) — Dependency Graph

```
Code.gs (Router)
 ├── calls: getLookupData_()       → LookupService.gs
 ├── calls: getUseCaseById_()      → UseCaseService.gs
 ├── calls: createUseCase_()       → UseCaseService.gs
 ├── calls: updateUseCase_()       → UseCaseService.gs
 ├── calls: checkDuplicate_()      → UseCaseService.gs
 ├── calls: getDashboardSummary_() → DashboardService.gs
 └── calls: sendJson_()            → Utils.gs

UseCaseService.gs
 ├── calls: validateCreate_()      → ValidationService.gs
 ├── calls: generateUseCaseId_()   → (self, uses Config.gs constants)
 ├── calls: appendRowFromObject_() → Utils.gs
 ├── calls: readSheetAsObjects_()  → Utils.gs
 ├── calls: findObjectByField_()   → Utils.gs
 ├── calls: updateRowByRecordId_() → Utils.gs
 ├── calls: logActivity_()         → LoggerService.gs
 └── calls: diceSimilarity_()      → Utils.gs

DashboardService.gs
 └── calls: readSheetAsObjects_()  → Utils.gs

LoggerService.gs
 └── calls: appendRowFromObject_() → Utils.gs

LookupService.gs
 └── calls: getOrCreateSheet_()    → Utils.gs

ValidationService.gs
 └── (no external deps — uses Config.gs constants implicitly)

Utils.gs
 └── (uses SpreadsheetApp, ContentService, LockService — GAS built-ins)

Config.gs
 └── (pure constants — no deps, imported by all)
```

## Coupling Matrix (Frontend ↔ Backend)

| Frontend constant | Backend constant | Risk nếu không đồng bộ |
|---|---|---|
| `FIELDS.*` (constants.js) | `HEADERS` array (Config.gs) | Form gửi field name sai → backend bỏ qua |
| `REQUIRED_FIELDS_CREATE` (implied) | `REQUIRED_FIELDS_CREATE` (Config.gs) | Validation mismatch |
| `APP_CONFIG.DUPLICATE_THRESHOLD` (env.js) | `DUPLICATE_THRESHOLD` (Config.gs) | Khác nhau ngưỡng duplicate |
| Dropdown values (wizard.js hardcoded) | LOOKUP sheet / LookupService fallback | UI khác backend |

> **[BUG - HIDDEN COUPLING]** `APP_CONFIG.DUPLICATE_THRESHOLD = 0.8` (env.js) và `DUPLICATE_THRESHOLD = 0.8` (Config.gs) **duplicate** nhau. Frontend dùng ngưỡng của mình để... không làm gì (DuplicateChecker dùng giá trị trả về từ backend `result.duplicate_flag`). Backend dùng ngưỡng của mình. Hai giá trị này có thể lệch nhau mà không ai biết.

## Dead Code / Unused Modules

| Item | Location | Lý do unused |
|---|---|---|
| `validateUpdate_()` | ValidationService.gs:15 | Defined nhưng `updateUseCase_()` không gọi |
| `doOptions()` | Code.gs:16 | GAS không route OPTIONS method, hàm không bao giờ trigger |
| `doPut()` | Code.gs:10 | GAS không hỗ trợ PUT natively; frontend dùng POST cho cả create/update |
| `SHEETS.DASHBOARD_READY` | Config.gs:8 | Sheet được tạo nhưng không bao giờ được ghi vào |
| `Api.getDashboard()` | api.js:24 | Defined nhưng không có UI nào gọi |
| `Api.health()` | api.js:25 | Defined nhưng không có UI nào gọi |
