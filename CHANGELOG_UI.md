# CHANGELOG — UI/UX Refactor

> **Version:** 2.0.0-ui  
> **Date:** 2026-05-28  
> **Type:** UI/UX refactor — no backend changes, API contract preserved

---

## SUMMARY

Comprehensive UI/UX modernization of the AI Use Case registration wizard. Transforms from a BRD-style form to a guided enterprise productivity workflow (Google Workspace + Notion + Linear design language). Zero breaking changes to API, data structure, or business logic.

---

## BUG FIXES

### [FIX-01] Progress bar now works
- **Root cause:** CSS targeted `.progress-bar::after` (pseudo-element), JS set style on parent `div`
- **Fix:** Changed HTML structure — added `<div class="progress-fill" id="progressBar">` inside `.progress-track`. JS now correctly sets width on the fill element.
- **Files:** `index.html`, `assets/css/wizard.css`, `assets/js/wizard.js`

### [FIX-02] Edit mode now populates correctly
- **Root cause:** `FormMapper.populateData()` was called before `Wizard.init()` — form DOM didn't exist yet
- **Fix:** Reversed execution order in `app.js::init()`: `Wizard.init()` → `Api.getUseCase()` → `FormMapper.populateData()`
- **Files:** `assets/js/app.js`

### [FIX-03] Validation errors now display as separate lines
- **Root cause:** `errors.join('<br>')` + `toast.textContent = message` → literal `<br>` text visible
- **Fix:** Changed join to `errors.join('\n')` + toast message uses `white-space: pre-line` with `textContent`
- **Files:** `assets/js/app.js`, `assets/js/wizard.js`, `assets/js/toast.js`

### [FIX-04] Font now loads correctly
- **Root cause:** `'Google Sans'` referenced in CSS but no `@import` or `<link>` existed
- **Fix:** Added `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')` in `base.css`. Switched to Inter (same Google design language, widely available)
- **Files:** `assets/css/base.css`, `assets/css/variables.css`

### [FIX-05] Draft restore no longer uses browser `confirm()`
- **Root cause:** `confirm()` is blocking, unstyled, platform-inconsistent
- **Fix:** Replaced with inline draft banner (yellow notification bar with "Tiếp tục" / "Bỏ qua" buttons)
- **Files:** `index.html`, `assets/css/wizard.css`, `assets/js/app.js`

### [FIX-06] Draft now clears after successful edit update
- **Root cause:** `Storage.clear()` only called in create flow, not edit flow
- **Fix:** Added `Storage.clear()` in edit success path
- **Files:** `assets/js/app.js`

### [FIX-07] Dead code `else if (EXPECTED_GOALS)` removed
- **Root cause:** Second condition for `EXPECTED_GOALS` was unreachable (first condition already caught it)
- **Fix:** Removed in new FieldBuilder implementation
- **Files:** `assets/js/wizard.js`

---

## NEW FEATURES

### [NEW-01] FIELD_CONFIG — centralized field definitions
All 32 form fields now have a single source of truth for:
- Vietnamese label
- Input type (text / textarea / email / url / number / select / checkbox)
- Placeholder text
- Helper description
- Required flag
- Lookup key (for select/checkbox from API)
- Group assignment (for step sub-sections)
- Conditional display rules
- **Files:** `assets/js/constants.js`

### [NEW-02] GROUP_CONFIG — field grouping within steps
Step 1 now has 3 sub-sections (Thông tin cơ bản / Vấn đề nghiệp vụ / Đối tượng & Mục tiêu).
Step 2 has a collapsible Prompt Builder section (collapsed by default).
Step 3 has 3 sub-sections (Demo / Đánh giá tác động / Tái sử dụng).
- **Files:** `assets/js/constants.js`, `assets/js/wizard.js`

### [NEW-03] Collapsible Prompt Builder section
8 Prompt fields in Step 2 are wrapped in a `<details>` element, collapsed by default. Users who have already built their prompt can expand it; new users are not overwhelmed.
- **Files:** `assets/js/wizard.js`, `assets/css/forms.css`

### [NEW-04] Success screen after submission
After successful create/update, the wizard shows a dedicated success screen with:
- Animated checkmark
- Use Case ID prominently displayed
- Description of next steps
- "Đăng ký thêm" and "Đóng" actions
- **Files:** `index.html`, `assets/css/states.css`, `assets/js/app.js`

### [NEW-05] Autosave indicator
After any form field change triggers autosave, a "✓ Đã lưu nháp" badge appears in the wizard meta bar and fades after 3 seconds. Users have confidence their data is preserved.
- **Files:** `index.html`, `assets/css/wizard.css`, `assets/js/app.js`

### [NEW-06] Step counter ("Bước N / 4")
Added a text counter in the wizard meta bar that updates as user navigates.
- **Files:** `index.html`, `assets/js/wizard.js`

### [NEW-07] Step labels in indicators
Each step dot now has a short title label below it.
- **Files:** `assets/js/wizard.js` (renderIndicators), `assets/css/wizard.css`

### [NEW-08] Step subtitle
Each step now shows a subtitle describing its purpose.
- **Files:** `assets/js/constants.js` (STEPS.subtitle), `assets/js/wizard.js`

### [NEW-09] Inline field validation
Required fields now show error message below the field on `blur`, not just in a toast after clicking Next.
- **Files:** `assets/js/wizard.js` (_bindInlineValidation), `assets/css/forms.css`

### [NEW-10] Conditional field: Demo_Link
Demo_Link field is hidden when Demo_Status = "Chưa có". Revealed automatically when user selects "Đã có demo" or "Đã triển khai".
- **Files:** `assets/js/wizard.js` (_bindConditionals), `assets/js/constants.js`

### [NEW-11] Edit mode banner
When editing an existing use case, a blue banner shows at the top of the wizard with the record ID.
- **Files:** `index.html`, `assets/css/states.css`, `assets/js/app.js`

### [NEW-12] Toast improvements
- Icon per type (✓ / ✕ / ⚠ / ℹ)
- Close button (X)
- Multi-line message support (pre-line)
- ARIA role="alert"
- Warning toast uses bordered style (not colored background) — better contrast
- **Files:** `assets/js/toast.js`, `assets/css/components.css`

### [NEW-13] Checkbox pill styling
Multi-select fields (User_Type, Input_Types, Expected_Goals, Reuse_Level) now use pill-tag styling with hover/selected states.
- **Files:** `assets/css/forms.css`

---

## FORM FIELD IMPROVEMENTS

### Input type corrections
| Field | Before | After |
|---|---|---|
| Pain_Point | text | textarea (3 rows) |
| Current_Process | text | textarea (4 rows) |
| Current_Problem | text | textarea (3 rows) |
| Flow_Description | text | textarea (4 rows) |
| Prompt_Role | text | textarea (2 rows) |
| Prompt_Task | text | textarea (3 rows) |
| Prompt_Goal | text | textarea (2 rows) |
| Prompt_Context | text | textarea (2 rows) |
| Prompt_Input | text | textarea (2 rows) |
| Prompt_Steps | text | textarea (4 rows) |
| Prompt_Output_Format | text | textarea (3 rows) |
| Prompt_Evaluation | text | textarea (3 rows) |
| Quality_Improvement | text | textarea (2 rows) |
| Improvement_Note | text | textarea (3 rows) |
| Reuse_Adjustment | text | textarea (3 rows) |
| When_To_Use | text | textarea (3 rows) |
| Usage_Steps | text | textarea (5 rows) |
| Usage_Notes | text | textarea (3 rows) |
| Team | text | select (from lookup) |
| Business_Category | text | select (from lookup) |
| Demo_Link | text | url |

### Labels completed
All 32 fields now have Vietnamese labels (previously only 5/32 had labels).

### Helper text added
20 of 32 fields now have descriptive helper text below the label.

### Number fields with unit
`Current_Time_Min`, `Before_Time_Min`, `After_Time_Min` now show "phút" unit suffix.

---

## CSS ARCHITECTURE CHANGES

### New files created
| File | Purpose |
|---|---|
| `assets/css/typography.css` | Heading scale, body text, step titles |
| `assets/css/forms.css` | All form element styles, validation states, pill checkboxes, collapsible |
| `assets/css/states.css` | Success screen, skeleton, autosave badge, edit banner |

### Modified files
| File | Changes |
|---|---|
| `variables.css` | Extended: spacing scale, type scale, z-index, radius, transitions |
| `base.css` | Added font import, iOS zoom fix, focus-visible, sr-only |
| `layout.css` | Added wizard card, wizard body, nav wrapper, sticky header |
| `components.css` | Expanded: button states, badge, toast with icons, spinner |
| `wizard.css` | Fixed progress bar structure, step indicators with labels, connecting line |
| `responsive.css` | Extended: 3 breakpoints (480px / 768px / 1024px+) |

### Load order in index.html
```
variables → base → typography → layout → components → forms → wizard → states → responsive
```

---

## ACCESSIBILITY IMPROVEMENTS

| Issue | Fix |
|---|---|
| Labels not linked to inputs | All inputs have `id`, labels use `htmlFor` |
| No ARIA on wizard | Added `role="group"`, `aria-labelledby` on steps |
| No aria-current on step | Added `aria-current="step"` in `updateProgress()` |
| No aria-invalid on errors | Added in `_bindInlineValidation()` and `Validator.markErrors()` |
| Focus management on step nav | `goTo()` sets focus to step `<h2>` |
| iOS font-size zoom | All inputs set to `font-size: 16px` via base.css |
| Toast not announced | Toast container has `aria-live="polite"`, toast has `role="alert"` |
| confirm() not accessible | Replaced with visible inline banner |
| Loading overlay focus trap | Added `role="status"` |

---

## PRESERVED BEHAVIORS (VERIFIED)

| Behavior | Status |
|---|---|
| API payload field names | ✅ All `name` attributes unchanged |
| FormMapper.collectData() output | ✅ Same structure — strings + comma-separated arrays |
| FormMapper.populateData() | ✅ Compatible with textarea, select, checkbox, input |
| localStorage key | ✅ Uses `APP_CONFIG.AUTO_SAVE_KEY` ('ai_usecase_draft') |
| Autosave on form change | ✅ Triggers on `change` event |
| Duplicate check (blur + debounce 600ms) | ✅ Preserved in FieldBuilder._bindDuplicateCheck() |
| Edit mode (URL ?edit=ID) | ✅ Fixed (was broken), now works correctly |
| Step validation (step1, step2 on Next) | ✅ Preserved in Validator |
| Final validation on Submit | ✅ Validator.all() called before API |
| GAS Web App URL | ✅ Unchanged in config/env.js |

---

## MIGRATION NOTES

### For developers adding new fields
1. Add to `FIELDS` in `constants.js`
2. Add to the relevant step's `fields` array in `STEPS`
3. Add a `FIELD_CONFIG` entry with `label`, `type`, `group`, and optional `placeholder`, `helper`, `required`
4. Add to `HEADERS` in `Config.gs` (backend)
5. Add column to Google Sheet

### For developers changing validation
- Frontend: `validation.js` → `Validator.step1()` / `step2()`
- Backend: `ValidationService.gs` → `REQUIRED_FIELDS_CREATE`
- Both must be kept in sync manually (known tech debt)

---

## REMAINING TECH DEBT (not addressed in this refactor)

| Item | Reason not addressed |
|---|---|
| No authentication | Requires backend + org SSO integration — out of scope |
| validateUpdate_ never called in GAS | Backend-only — needs separate GAS fix |
| doOptions/doPut dead code in GAS | Backend-only — safe to leave |
| DASHBOARD_READY sheet unused | Dashboard feature not yet built |
| Full table scan in duplicate check | Performance tuning — acceptable for current scale |
| JS global namespace pollution | Needs ES Module refactor — future phase |

---

*End of CHANGELOG_UI.md*
