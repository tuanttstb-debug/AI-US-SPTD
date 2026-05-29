# UI/UX REVIEW — AI Use Case Platform

> **Reviewer role:** Principal Frontend Architect + Staff UX Engineer  
> **Date:** 2026-05-28  
> **Scope:** Full inspection of all frontend files (HTML, CSS, JS) + architecture docs  
> **Phase:** 1 of 3 — Analysis only. No code changes in this document.

---

## EXECUTIVE SUMMARY

The current implementation delivers the correct business logic but suffers from significant UX friction, visual inconsistency, and structural debt that collectively make the form feel like a compliance checklist rather than a guided workflow. The estimated user completion time is likely **12–20 minutes** instead of the target **3–7 minutes**.

**Critical count:**
- 5 broken UI behaviors (functional bugs in UI layer)
- 9 accessibility violations (WCAG 2.1 AA gaps)
- 15+ fields with wrong input type
- 28 of 33 fields missing proper Vietnamese labels
- 0 inline validation messages (all errors go to toast)
- 1 broken progress bar (CSS/JS mismatch)
- 0 success screen after submission

---

## SECTION 1 — CURRENT ISSUES BY CATEGORY

### 1.1 Broken UI Behaviors

These are issues that cause the UI to behave incorrectly — separate from pure design concerns.

#### [UI-BUG-01] Progress bar never moves
**File:** `assets/css/wizard.css:5–8` + `assets/js/wizard.js:64`

CSS animates the `width` of `.progress-bar::after` (a pseudo-element).  
JS sets `style.width` on `#progressBar` (the parent `div`).  
These are **two different DOM targets**. The bar never updates visually.

```
CSS target:  .progress-bar::after { width: 0%; }
JS target:   document.getElementById('progressBar').style.width = percent + '%';
             ↑ This sets the outer container width, not the fill bar.
```

**UX impact:** User has no visual feedback about progress. Core navigation affordance is broken.

---

#### [UI-BUG-02] Edit mode form always loads empty
**File:** `assets/js/app.js:14–18`

Execution order in edit mode:
```
1. FormMapper.populateData(data)   ← form DOM does not exist yet
2. Wizard.init()                   ← form DOM created here
```

`populateData()` runs `form.querySelector('[name="..."]')` — all return `null` because the form hasn't been rendered. Every populated value silently fails. Edit mode renders a completely blank form.

**UX impact:** Edit feature is non-functional.

---

#### [UI-BUG-03] Validation errors display as literal `<br>` text
**File:** `assets/js/app.js:50–51` + `assets/js/toast.js:6`

```javascript
Toast.show(errors.join('<br>'), 'error');  // app.js
toast.textContent = message;               // toast.js — textContent escapes HTML
```

Result: User sees `"Tên Use Case không được để trống<br>Email không hợp lệ"` as one long string with literal `<br>` tag visible.

**UX impact:** Multi-error messages are unreadable.

---

#### [UI-BUG-04] Google Sans font never loads
**File:** `index.html` (no @import), `assets/css/variables.css:7`

```css
--font-family: 'Google Sans', Roboto, Arial, sans-serif;
```

`Google Sans` is not a standard system font. There is no `<link>` to Google Fonts and no `@import` in any CSS file. The browser silently falls back to `Roboto` (also not system font) → `Arial`. The intended brand typeface is never applied.

**UX impact:** Typography is not what was designed. Fallback is inconsistent across OS.

---

#### [UI-BUG-05] Draft restore uses browser `confirm()` dialog
**File:** `assets/js/app.js:23`

```javascript
if (confirm('Bạn có bản nháp lưu trước đó. Bạn muốn tiếp tục?'))
```

`confirm()` is a blocking native browser dialog: 
- Visually jarring (OS-native modal, not brand-consistent)
- Blocks JavaScript execution
- Cannot be styled
- Mobile browsers show it differently (some suppress it)
- Looks unprofessional in an enterprise tool

**UX impact:** First interaction users have with the app is an ugly browser dialog.

---

### 1.2 Form Input Type Mismatches

**Root cause:** `FieldBuilder.createField()` in `wizard.js:109–164` uses `<input type="text">` as the fallback for all unrecognized fields. Most fields fall into this default.

#### Fields that should be `<textarea>` (min 3 rows)

| Field | Current | Should be | Reason |
|---|---|---|---|
| `Pain_Point` | text input | textarea | Multi-sentence description |
| `Current_Process` | text input | textarea | Step-by-step process description |
| `Current_Problem` | text input | textarea | Problem elaboration |
| `Flow_Description` | text input | textarea | AI workflow description |
| `Prompt_Role` | text input | textarea | Persona definition |
| `Prompt_Task` | text input | textarea | Task instructions |
| `Prompt_Goal` | text input | textarea | Goal description |
| `Prompt_Context` | text input | textarea | Context block |
| `Prompt_Input` | text input | textarea | Input specification |
| `Prompt_Steps` | text input | textarea | Step-by-step instructions |
| `Prompt_Output_Format` | text input | textarea | Output format spec |
| `Prompt_Evaluation` | text input | textarea | Evaluation criteria |
| `Improvement_Note` | text input | textarea | Qualitative notes |
| `Reuse_Adjustment` | text input | textarea | Adaptation instructions |
| `When_To_Use` | text input | textarea | Usage conditions |
| `Usage_Steps` | text input | textarea | Step-by-step guide |
| `Usage_Notes` | text input | textarea | Warnings and tips |

**17 of 33 fields** are rendering as inadequate single-line inputs.

#### Fields that should be `<select>` from lookup data

| Field | Current | Should be | Impact |
|---|---|---|---|
| `Team` | text input | select (from lookup) | Data inconsistency, required field |
| `Business_Category` | text input | select (from lookup) | Data inconsistency, required field |

These are **required** fields with predefined values from the LOOKUP sheet. Rendering them as free-text allows invalid data entry and defeats the purpose of the lookup system.

---

### 1.3 Label & Information Hierarchy Issues

#### [LABEL-01] 28 of 33 fields have no proper Vietnamese label
**File:** `assets/js/wizard.js:112–120`

Only 5 fields have explicit labels in `labelMap`:
```javascript
const labelMap = {
  [FIELDS.USE_CASE_NAME]: 'Tên Use Case *',
  [FIELDS.OWNER_NAME]: 'Chủ sở hữu *',
  [FIELDS.OWNER_EMAIL]: 'Email *',
  [FIELDS.TEAM]: 'Team *',
  [FIELDS.BUSINESS_CATEGORY]: 'Business Category *',
  // ... extend as needed  ← this comment has been here since inception
};
```

The remaining 28 fields fall back to `name.replace(/_/g, ' ')` which produces:
- `"Pain Point"` instead of `"Mô tả điểm đau nghiệp vụ"`
- `"Prompt Role"` instead of `"Vai trò AI trong prompt"`
- `"Flow Description"` instead of `"Mô tả luồng xử lý AI"`
- `"Reuse Adjustment"` instead of `"Điều chỉnh khi tái sử dụng"`
- etc.

**UX impact:** Users unfamiliar with technical terminology are confused. Form feels like a database schema, not a user form.

#### [LABEL-02] No helper text / field descriptions
No field has any sub-label, description, or example text. Users filling in `Prompt_Role` for the first time have no idea what format is expected.

#### [LABEL-03] No visual distinction between required and optional fields
Required fields have `*` in the label text but no visual treatment (color, icon, grouping) to differentiate them at a glance.

#### [LABEL-04] Labels not programmatically linked to inputs
**File:** `assets/js/wizard.js:122–123`

```javascript
const label = document.createElement('label');
label.textContent = labelText;
wrapper.appendChild(label);
// No label.htmlFor = inputId set anywhere
```

HTML `<label>` elements are never linked to their inputs via `for`/`id`. Clicking a label does not focus the associated input. Screen readers cannot associate labels with fields.

---

### 1.4 Information Architecture Problems

#### [IA-01] Step 1 has 11 fields — first impression is overwhelming

Step 1 ("Thông tin nghiệp vụ") presents all 11 fields in a flat, undifferentiated list with no visual grouping:

```
UseCase_Name    ← identity
Owner_Name      ← identity
Owner_Email     ← identity
Team            ← identity
Business_Category ← context
Pain_Point      ← problem
Current_Process ← problem
Current_Time_Min ← problem
Current_Problem ← problem
User_Type       ← audience
Expected_Goals  ← outcome
```

There are at least 4 natural groups here. Without grouping, users scan all 11 fields simultaneously — high cognitive load on first impression.

#### [IA-02] Step 2 has 10 fields including 8 Prompt sub-fields — "BRD feeling"

The 8 Prompt fields (Role, Task, Goal, Context, Input, Steps, Output Format, Evaluation) are displayed as 8 separate form fields with no grouping, no collapsing, no progressive disclosure.

For a user filling a prompt for the first time, seeing 8 required-looking fields about "Prompt" feels like writing a formal specification document.

**Recommendation:** Collapsible "Prompt Builder" section with sane defaults and inline examples.

#### [IA-03] Demo_Link always visible regardless of Demo_Status

`Demo_Link` field is always shown. If `Demo_Status = "Chưa có"`, the Demo_Link field has no relevance and adds visual noise. No conditional rendering exists.

#### [IA-04] No completion progress visible to user

The progress bar is broken (BUG-01). Even if it worked, the bar only shows a thin line. There is no text indicator like "Bước 1 / 4" or "25% hoàn thành" visible during navigation.

#### [IA-05] No estimated time indication

Users do not know if they're committing to a 3-minute or 20-minute task. No "~5 phút" estimate is shown.

---

### 1.5 Navigation & Wizard UX Issues

#### [NAV-01] Step indicators show numbers only — no context
Step dots display 1, 2, 3, 4. The step title (e.g., "Thông tin nghiệp vụ") is only shown as an `<h2>` inside the step content, not next to the indicator. Users navigating from other steps cannot see what step 3 is about without clicking to it.

#### [NAV-02] No per-field inline validation
All validation fires only when clicking "Tiếp →". Users must complete a full step before discovering which fields are invalid. Inline validation on blur would catch errors immediately and reduce frustration.

#### [NAV-03] No autosave indicator
Autosave is implemented (via `localStorage`) but completely invisible. Users have no confidence that their input is being preserved. A subtle "Đã lưu nháp" indicator would reduce anxiety significantly.

#### [NAV-04] No success screen after submission
After a successful submission:
```javascript
Toast.show(`Đăng ký thành công! ID: ${result.usecase_id}`, 'success');
Storage.clear();
// Redirect or reset?  ← the comment says it all
```

The toast appears for 4 seconds then disappears. The form remains on screen (still filled). The user is left wondering "did it work? what now?". No success state, no next actions, no use case ID prominently displayed.

#### [NAV-05] Validation errors shown in toast instead of inline
When validation fails, a toast appears top-right with all errors concatenated (with broken `<br>`). This is:
- Easy to miss (small area, auto-dismisses)
- Not linked to the offending field
- Disappears after 4 seconds — user may not read all errors in time
- Doesn't indicate which field is wrong

---

### 1.6 Visual Design Issues

#### [VIS-01] Typography: No scale, no hierarchy

Current typography is essentially flat:
- No defined heading sizes (h1, h2, h3 → browser defaults)
- No body text size variations
- No display/hero text
- Only one font weight variation used (500 on labels)
- Step title `<h2>` has browser default styling (no custom treatment)

#### [VIS-02] Spacing: No system

Spacing values are scattered and hardcoded:
- `margin-bottom: 18px` (form-group)
- `margin-bottom: 24px` (progress-bar)
- `margin-bottom: 28px` (step-indicators)
- `margin-top: 24px` (wizard-nav)
- `padding: 8px 20px` (button)
- `padding: 10px 18px` (toast)
- `padding: 8px 12px` (form inputs)

No spacing scale (e.g., 4/8/12/16/24/32/48px). Distances feel arbitrary.

#### [VIS-03] Form inputs have no interactive states

```css
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: 8px 12px; border: 1px solid #dadce0; border-radius: var(--border-radius);
}
```

Missing:
- `:focus` state (no custom focus ring, relies on browser default)
- `:hover` state (no border color change)
- `:invalid` state (no error styling)
- `:disabled` state (no visual treatment)
- Filled/active state distinction

The form inputs look the same whether they are empty, focused, or filled.

#### [VIS-04] Checkbox group has no visual container

Checkboxes are rendered inline in a flex-wrap container but there is no:
- Card/pill styling on individual options
- Visual selection state beyond browser checkbox
- Hover treatment

Modern enterprise UIs use pill-style toggles or card selections for multi-choice options.

#### [VIS-05] Header is visually disconnected from content

The header (`🚀 Bình dân hóa AI` | `Đăng ký AI Use Case`) is a blue bar that stops abruptly. The wizard form below has no visual relationship to it. No breadcrumb, no subtitle, no context about what the user is about to do.

#### [VIS-06] `btn-success` has no hover state

```css
.btn-success { background: var(--color-success); color: white; }
/* No .btn-success:hover rule */
```

The "Gửi đăng ký" button has no hover feedback.

#### [VIS-07] Loading overlay lacks skeleton loading

The loading overlay is a white screen + spinner. During initial load (API call to get lookup data), the user sees a blank spinner for 2–4 seconds before any content appears. A skeleton form would feel much faster.

---

### 1.7 Accessibility Violations (WCAG 2.1 AA)

| ID | Issue | WCAG Criterion | Severity |
|---|---|---|---|
| A11Y-01 | `<label>` not linked to input via `for`/`id` | 1.3.1 Info and Relationships | Critical |
| A11Y-02 | No ARIA roles on wizard (`role="progressbar"`, `aria-valuenow`, etc.) | 4.1.2 Name, Role, Value | High |
| A11Y-03 | No `aria-current="step"` on active step indicator | 4.1.2 | High |
| A11Y-04 | No `aria-invalid="true"` on fields with validation errors | 1.3.1 | High |
| A11Y-05 | No focus management when navigating steps | 2.4.3 Focus Order | High |
| A11Y-06 | Custom loading overlay blocks keyboard but has no focus trap | 2.1.2 No Keyboard Trap | High |
| A11Y-07 | iOS font-size zoom: inputs don't declare `font-size: 16px` | 1.4.4 Resize Text | Medium |
| A11Y-08 | `confirm()` dialog is not accessible on all platforms | 1.3.1 | Medium |
| A11Y-09 | No visible focus ring beyond browser default (varies by browser/OS) | 2.4.7 Focus Visible | Medium |

---

### 1.8 Responsive Design Gaps

**File:** `assets/css/responsive.css`

```css
@media (max-width: 600px) {
  .app-container { margin-top: 16px; }
  .wizard-nav { flex-direction: column; gap: 8px; }
}
```

Only 2 rules exist. Missing:
- Tablet layout (600px–1024px)
- Checkbox group wrapping on narrow screens
- Font size adjustments for mobile readability
- Header layout collapse on very small screens
- Scroll behavior for long steps on mobile
- Step indicators on mobile (may be too small at 30x30px to tap)
- `<input>` font-size 16px minimum to prevent iOS zoom

---

### 1.9 CSS Architecture Issues

**File structure:**

| File | Lines | Problem |
|---|---|---|
| `variables.css` | 16 | Good, but incomplete — no spacing scale, no z-index scale |
| `base.css` | 4 | Minimal reset, acceptable |
| `layout.css` | 15 | Only 2 components — should cover more layout primitives |
| `components.css` | 37 | **Concern:** mixes buttons, loading overlay, toasts, forms (5 unrelated concerns) |
| `wizard.css` | 22 | Broken progress bar, minimal step styling |
| `responsive.css` | 4 | Essentially empty |

**Total:** ~98 lines of CSS for a 33-field multi-step form. This is severely under-styled.

Missing CSS modules:
- `typography.css` — heading scale, body text, helper text
- `forms.css` — input states, textarea, select, validation states
- `states.css` — success screen, empty state, skeleton loading

---

### 1.10 JavaScript Architecture Issues (UI Layer)

#### [JS-01] FieldBuilder and Wizard are tightly coupled in one file
`wizard.js` contains two distinct concerns: the `Wizard` navigation controller and `FieldBuilder` form renderer. These should be separate modules.

#### [JS-02] `createField()` is a 50-line nested conditional monster
```javascript
createField(name) {
  // if (checkbox group)
  //   else if (EXPECTED_GOALS) ← dead code
  //   else if (time min)
  //   else if (demo status)
  //   else → text input  ← catches 17 fields that should be textarea
}
```
Adding a new field type requires editing a long if-else chain. No field registry/config pattern.

#### [JS-03] Field metadata is split across 3 locations
To understand a field, you must check:
1. `constants.js` — field key constant
2. `wizard.js:labelMap` — Vietnamese label (only 5 present)
3. `wizard.js:createField` — input type logic

Field definition should be centralized in one config object per field.

#### [JS-04] No field-level grouping data
`STEPS` array has `fields: [...]` but no concept of sub-groups within a step. The Prompt section (8 fields) is architecturally indistinguishable from the other fields in Step 2.

---

## SECTION 2 — UX FRICTION MAP

Ordered by user journey sequence and friction severity:

```
PAGE LOAD
├── [F1] ❌ Spinner blocks entire viewport for 2-4s (no skeleton)
├── [F2] ❌ Browser confirm() dialog appears immediately if draft exists
│
STEP 1 — Thông tin nghiệp vụ (11 fields)
├── [F3] ❌ 11 fields visible simultaneously — no grouping
├── [F4] ❌ Team field: free text instead of dropdown → user types wrong values
├── [F5] ❌ Business_Category: same issue as Team
├── [F6] ❌ Pain_Point: single-line text for multi-sentence content
├── [F7] ❌ Current_Process: single-line text for process description
├── [F8] ❌ No placeholder, no example, no helper text on any field
├── [F9] ⚠️ Duplicate check toast (top-right) easy to miss during form editing
│
STEP 2 — Luồng AI & Prompt (10 fields)
├── [F10] ❌ Flow_Description: single-line text for workflow description
├── [F11] ❌ 8 Prompt fields all expanded, no progressive disclosure
├── [F12] ❌ No label meaning (Prompt_Role renders as "Prompt Role")
├── [F13] ❌ No example prompts shown for guidance
│
STEP 3 — Demo & Tái sử dụng (8 fields)
├── [F14] ⚠️ Demo_Link always visible even when Demo_Status = "Chưa có"
├── [F15] ❌ Number inputs have no unit indicator ("phút")
├── [F16] ❌ Improvement_Note: single-line for qualitative notes
│
STEP 4 — Submit
├── [F17] ❌ Success: only a 4-second toast, then form remains unchanged
├── [F18] ❌ No Use Case ID prominently shown after success
├── [F19] ❌ No "what to do next" guidance
│
THROUGHOUT
├── [F20] ❌ Progress bar broken — never moves
├── [F21] ❌ No autosave indicator visible
├── [F22] ❌ Validation errors in toast, not inline (requires user to find the field)
├── [F23] ❌ Error message contains literal "<br>" text
```

**Friction score: 23 friction points identified.**

---

## SECTION 3 — ACCESSIBILITY AUDIT SUMMARY

**WCAG 2.1 AA Compliance Assessment:** ❌ Fail

Primary gaps:
1. Form controls not programmatically associated with labels
2. Wizard navigation state not exposed to assistive technology
3. Focus management absent when navigating steps
4. No ARIA live regions for toast notifications (screen readers won't announce them)
5. Loading state blocks keyboard with no focus trap management
6. Inline validation errors not exposed via `aria-describedby`

---

## SECTION 4 — REFACTOR RECOMMENDATIONS

Listed by impact/effort ratio (highest impact first):

### Priority 1 — Fix broken behaviors (HIGH impact, LOW effort)
1. Fix progress bar (CSS element vs pseudo-element)
2. Fix edit mode execution order (Wizard.init before populateData)
3. Fix Toast multi-error rendering (switch to `<ul>` or separate toasts)
4. Add Google Fonts import or switch to system font stack
5. Replace `confirm()` with inline draft restore UI

### Priority 2 — Fix input types (HIGH impact, MEDIUM effort)
6. Convert 17 fields from `<input type="text">` to `<textarea>`
7. Convert Team and Business_Category to `<select>` from lookup data
8. Add placeholder text to all fields
9. Add helper text to complex fields (especially Prompt section)

### Priority 3 — Add missing labels & field config (HIGH impact, MEDIUM effort)
10. Complete labelMap with Vietnamese labels for all 33 fields
11. Link `<label>` to inputs via `for`/`id`
12. Centralize field config (label, type, placeholder, helper, required) in one object

### Priority 4 — Improve information architecture (HIGH impact, MEDIUM effort)
13. Group Step 1 fields into sub-sections (Identity / Problem / Audience)
14. Make Prompt section (8 fields) collapsible in Step 2
15. Add conditional Demo_Link visibility based on Demo_Status
16. Add autosave indicator ("Đã lưu" badge)
17. Build proper success screen after submission

### Priority 5 — Improve visual design (MEDIUM impact, MEDIUM effort)
18. Add typography scale (display, heading, body, caption sizes)
19. Add spacing system via CSS variables
20. Add input focus/hover/error states
21. Improve checkbox group to pill-tag style
22. Add step title to step indicators
23. Fix wizard nav: add "Bước N/4" counter

### Priority 6 — Accessibility (HIGH impact, HIGH effort)
24. Link all labels via `for`/`id`
25. Add ARIA attributes to wizard (progressbar, aria-current, aria-live)
26. Implement focus management on step navigation
27. Add `aria-invalid` on validation error fields
28. Add `font-size: 16px` on inputs for iOS zoom prevention

### Priority 7 — CSS architecture (MEDIUM impact, HIGH effort)
29. Add `typography.css`
30. Split `components.css` into focused files
31. Add `states.css` for loading/empty/success states
32. Add tablet breakpoint (768px) to responsive.css
33. Add skeleton loading for initial page load

---

## SECTION 5 — RISK ASSESSMENT

### Low risk changes (safe to do anytime)
- CSS visual changes (colors, spacing, typography)
- Adding labels and placeholders
- Converting text inputs to textarea (same `name` attribute, same data contract)
- Adding helper text
- CSS-only responsive improvements
- Adding font import

### Medium risk changes (test after each change)
- Converting Team/Business_Category to `<select>` → must verify `FormMapper.collectData()` still works correctly
- Changing checkbox rendering → must verify `FormMapper.populateData()` handles new markup
- Adding `id` attributes to inputs → must not conflict with any existing querySelector selectors
- Changing draft restore from `confirm()` to custom UI → must verify same data flow

### Higher risk changes (validate API integration after)
- Changing `createField()` structure → directly affects data collection in `FormMapper`
- Restructuring STEPS with sub-groups → if FieldBuilder iterates over fields, nesting changes the iteration
- Adding conditional field visibility → must verify hidden fields still get included/excluded from form data correctly

### Breaking risk (do NOT do without explicit plan)
- Renaming any form field `name` attribute → breaks backend contract (Google Sheets column mapping)
- Changing FormMapper.collectData() output structure → breaks API call in app.js
- Modifying STEPS array structure without updating FieldBuilder → breaks field rendering

---

## SECTION 6 — SUGGESTED COMPONENTIZATION

After refactor, the frontend should have these clearly separated concerns:

```
/assets/js/
├── config/
│   └── field-config.js      ← NEW: centralized field definitions (label, type, placeholder, helper, required)
├── components/
│   ├── FieldBuilder.js      ← extracted from wizard.js
│   ├── Toast.js             ← already exists, minor improvements
│   ├── DraftBanner.js       ← NEW: replaces confirm() for draft restore
│   └── SuccessScreen.js     ← NEW: post-submission success state
├── wizard/
│   ├── Wizard.js            ← cleaned navigation controller
│   └── StepValidator.js     ← extracted from validation.js + wizard.js
├── core/
│   ├── api.js               ← unchanged
│   ├── storage.js           ← unchanged
│   ├── form-mapper.js       ← minor updates for textarea/select
│   └── helpers.js           ← unchanged
└── app.js                   ← entry point (order fixed)

/assets/css/
├── variables.css            ← extended: spacing scale, type scale, z-index
├── base.css                 ← unchanged
├── typography.css           ← NEW: heading scale, body, helpers
├── layout.css               ← extended: card, container variants
├── forms.css                ← NEW: input states, select, textarea, checkboxes
├── components.css           ← trimmed: buttons, badges only
├── wizard.css               ← fixed: progress bar, step nav, states
├── states.css               ← NEW: loading skeleton, success screen, empty state
└── responsive.css           ← extended: 3 breakpoints
```

---

## SECTION 7 — BEFORE vs AFTER COMPARISON

| Dimension | Current State | Target State |
|---|---|---|
| Est. completion time | 12–20 min | 3–7 min |
| Fields with correct input type | 16/33 (48%) | 33/33 (100%) |
| Fields with Vietnamese label | 5/33 (15%) | 33/33 (100%) |
| Fields with helper text | 0/33 (0%) | 20/33 (60%) |
| Inline validation | None | On blur, per field |
| Success state | Toast only (4s) | Dedicated success screen |
| Autosave indicator | None | "Đã lưu nháp" badge |
| Progress bar | Broken | Functional with % text |
| Draft restore UI | Browser `confirm()` | Inline banner |
| Accessibility (approx.) | ~30% WCAG AA | ~85% WCAG AA |
| Mobile usability | Basic (1 breakpoint) | Full responsive (3 breakpoints) |
| Prompt section | 8 flat fields | Collapsible section |
| CSS lines | ~98 | ~400–500 (more features, cleaner) |
| CSS files | 6 | 9 (better separated) |

---

## SECTION 8 — PHASE 2 PREVIEW (not a plan — preview only)

Phase 2 will produce `UI_REFACTOR_PLAN.md` covering:
1. Exact file-by-file change sequence
2. Which changes are CSS-only vs JS-required
3. Which changes can be done independently vs. in sequence
4. Test checklist after each major change
5. Rollback points

**Recommended implementation order:**
1. Fix 5 UI bugs (no design change)
2. Add typography + spacing CSS foundation
3. Centralize field config (enables all label/type fixes at once)
4. Rebuild FieldBuilder with new config
5. Fix form input types
6. Improve step navigation UX
7. Add success screen
8. Add inline validation
9. Accessibility pass
10. Mobile responsive pass

---

*End of UI_UX_REVIEW.md — Phase 1 complete. Awaiting approval to proceed to Phase 2.*
