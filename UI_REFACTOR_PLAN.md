# UI REFACTOR PLAN

> **Phase:** 2 of 3 — Plan  
> **Follows:** UI_UX_REVIEW.md  
> **Strategy:** Incremental, safe, behavior-preserving refactor

---

## 1. FILES IMPACTED

### Modified (not replaced)
| File | Change Type | Risk |
|---|---|---|
| `index.html` | Structural additions (new elements, font link, fix progress bar) | Low |
| `assets/css/variables.css` | Extend tokens (spacing, typography scale) | None |
| `assets/css/base.css` | Add font import | None |
| `assets/css/layout.css` | Add card primitives | None |
| `assets/css/components.css` | Focus on buttons only (split concerns out) | None |
| `assets/css/wizard.css` | Fix progress bar CSS, improve step indicators | Low |
| `assets/css/responsive.css` | Extend to 3 breakpoints | None |
| `assets/js/constants.js` | ADD FIELD_CONFIG + GROUP_CONFIG (additive only) | None |
| `assets/js/wizard.js` | Rebuild FieldBuilder, fix progress bar JS, add step labels | Medium |
| `assets/js/app.js` | Fix execution order, replace confirm(), add success screen | Medium |
| `assets/js/toast.js` | Fix multi-line rendering, add icon support | Low |
| `assets/js/validation.js` | Add inline validation helpers | Low |
| `assets/js/form-mapper.js` | Minor: expose refreshConditionals hook | Low |

### Created (new files)
| File | Purpose |
|---|---|
| `assets/css/typography.css` | Heading scale, body text, helper text |
| `assets/css/forms.css` | Input states, textarea, select, checkbox pills, validation states |
| `assets/css/states.css` | Success screen, skeleton, autosave badge, draft banner |
| `CHANGELOG_UI.md` | Full changelog of all changes |

### Unchanged (zero touch)
| File | Reason |
|---|---|
| `assets/js/api.js` | API contract must not change |
| `assets/js/storage.js` | localStorage behavior preserved |
| `assets/js/helpers.js` | Utility functions fine as-is |
| `assets/js/duplicate-check.js` | Logic preserved, warning will be a toast upgrade |
| `config/env.js` | Config unchanged |
| `config/routes.js` | Routes unchanged |
| `assets/gas-backend/*.gs` | Backend untouched |

---

## 2. CSS ARCHITECTURE (target)

```
assets/css/
├── variables.css     ← Extended: spacing scale, type scale, z-index, radius tokens
├── base.css          ← Font import + minimal reset (unchanged otherwise)
├── typography.css    ← NEW: h1–h4, body, caption, helper text styles
├── layout.css        ← Extended: card, section-header, container variants
├── components.css    ← Trimmed: ONLY buttons + badges
├── forms.css         ← NEW: inputs, textarea, select, checkbox-pill, validation states
├── wizard.css        ← Fixed: progress bar, step indicator, sticky nav
├── states.css        ← NEW: success screen, skeleton, autosave, draft banner
└── responsive.css    ← Extended: 3 breakpoints (480px, 768px, 1024px)
```

Load order in `index.html`:
```html
variables → base → typography → layout → components → forms → wizard → states → responsive
```

---

## 3. JS MODULARIZATION

### New data structure in `constants.js`

```
FIELDS         ← unchanged
STEPS          ← extended: add shortTitle per step
FIELD_CONFIG   ← NEW: map fieldName → { label, type, placeholder, helper, required, rows, suffix, group, lookupKey, conditional }
GROUP_CONFIG   ← NEW: map groupId → { label, collapsible, collapsed }
```

### FieldBuilder rebuild (wizard.js)

New rendering pipeline:
```
FieldBuilder.buildAll()
  → for each STEP
    → groupFields(step.fields)       ← group by FIELD_CONFIG[f].group
    → for each group:
        renderGroup(groupConfig, fields)
          → if group.collapsible → wrap in <details>
          → if group.label → render section header
          → for each field:
              createField(fieldName, fieldConfig)
                → createLabel(config)    ← with id linkage
                → createInput(config)    ← correct type
                → createHelper(config)   ← helper text
                → addInlineValidation(el, config)
  → bindConditionals()              ← Demo_Link ↔ Demo_Status
  → bindDuplicateCheck()            ← existing behavior
```

### app.js execution order fix (BUG-02)

```
BEFORE:                         AFTER:
  lookup → populateData()         lookup
  → Wizard.init()                 → Wizard.init()       ← form rendered first
                                  → populateData()      ← then populated
                                  → showDraftBanner()   ← replaces confirm()
```

---

## 4. UX IMPROVEMENTS CHECKLIST

| # | Improvement | Method | File |
|---|---|---|---|
| 1 | Fix progress bar | Inner div + CSS | index.html + wizard.css + wizard.js |
| 2 | Fix edit mode | Swap execution order | app.js |
| 3 | Fix toast errors | `\n` join + pre-line | app.js + toast.js |
| 4 | Load Google Fonts (Inter) | `<link>` tag | index.html |
| 5 | Replace confirm() with banner | Draft banner component | index.html + states.css + app.js |
| 6 | 17 text→textarea conversions | FIELD_CONFIG + FieldBuilder | constants.js + wizard.js |
| 7 | Team/Category → select | FIELD_CONFIG + FieldBuilder | constants.js + wizard.js |
| 8 | Complete 28 missing labels | FIELD_CONFIG | constants.js |
| 9 | Add helper text to all fields | FIELD_CONFIG + createHelper() | constants.js + wizard.js |
| 10 | Step 1 field grouping | GROUP_CONFIG + renderGroup() | constants.js + wizard.js |
| 11 | Prompt section collapsible | `<details>` + GROUP_CONFIG | wizard.js + forms.css |
| 12 | Conditional Demo_Link | bindConditionals() | wizard.js |
| 13 | Autosave indicator | Autosave badge | index.html + states.css + app.js |
| 14 | Success screen | Success screen component | index.html + states.css + app.js |
| 15 | Step title in indicators | Updated renderIndicators() | wizard.js + wizard.css |
| 16 | Step counter (Bước N/4) | stepCounter element | index.html + wizard.js |
| 17 | Inline field validation | addInlineValidation() | wizard.js + forms.css |
| 18 | Input focus/hover states | CSS | forms.css |
| 19 | Checkbox → pill style | CSS + markup | forms.css + wizard.js |
| 20 | Number inputs with unit | suffix span | FIELD_CONFIG + wizard.js + forms.css |
| 21 | Toast icons + close button | Updated Toast.show() | toast.js |
| 22 | Label linked to input | for/id attributes | wizard.js |
| 23 | ARIA on wizard | role, aria-current, aria-live | wizard.js + toast.js |
| 24 | Focus management on steps | goTo() focus call | wizard.js |
| 25 | iOS input zoom fix | font-size: 16px on inputs | forms.css |
| 26 | Responsive: tablet breakpoint | @media 768px | responsive.css |
| 27 | Draft clear after edit success | Storage.clear() in update | app.js |

---

## 5. MIGRATION STRATEGY

### Phase A — Zero-risk CSS foundation (do first, validate visually)
1. Extend variables.css
2. Update base.css (font)
3. Create typography.css
4. Update layout.css
5. Update components.css
6. Create forms.css
7. Update wizard.css
8. Create states.css
9. Update responsive.css
10. Update index.html (structural additions only)

Validation: open in browser, verify layout is not broken.

### Phase B — FIELD_CONFIG (additive, no breaking change)
1. Update constants.js: add FIELD_CONFIG, GROUP_CONFIG, shortTitle to STEPS

Validation: page loads without JS error. Existing behavior unchanged.

### Phase C — FieldBuilder rebuild (highest risk, most impact)
1. Rebuild wizard.js FieldBuilder using FIELD_CONFIG
2. Test: all 32 fields render correctly
3. Test: FormMapper.collectData() returns same data structure
4. Test: FormMapper.populateData() correctly fills all field types

Validation checklist:
- Form renders all 32 fields
- Checkbox groups work (User_Type, Input_Types, Expected_Goals, Reuse_Level)
- Select fields work (Team, Business_Category, Demo_Status)
- Textarea fields collect correctly
- Number fields work
- FormMapper.collectData() output matches previous output format

### Phase D — app.js fixes (BUG-02 + success screen + draft banner)
1. Fix execution order
2. Replace confirm() with banner
3. Add success screen
4. Add autosave indicator

Validation:
- Edit mode populates form correctly
- New mode shows draft banner correctly
- Submit success shows success screen
- Autosave badge appears after form change

### Phase E — Toast + Validation fixes
1. Fix toast multi-line
2. Add inline field validation
3. Update wizard.js validation error display

---

## 6. REGRESSION RISK MAP

| Risk | Probability | Mitigation |
|---|---|---|
| FormMapper breaks on textarea/select | Low | `querySelectorAll('input, select, textarea')` already includes both |
| populateData breaks for new field types | Low | `el.value = data[key]` works for all types except checkbox (handled separately) |
| Checkbox group rendering change breaks data collection | Medium | Keep same `name` attribute, same checkbox structure |
| STEPS.fields order change | None | STEPS.fields unchanged |
| API payload field names change | None | `name` attributes on inputs preserved |
| localStorage key change | None | Using same `APP_CONFIG.AUTO_SAVE_KEY` |
| Collapsible prompt section hides required fields | Low | Required fields (none in prompt section) — validation still runs on submit |
| Conditional Demo_Link hides field with data | Low | Hidden inputs still present in DOM, FormMapper collects them |

---

## 7. ROLLBACK PLAN

Since all files are tracked, rollback is:
1. Restore original file from git (if git is configured)
2. Or restore from this document — all original code is in TECH_DEBT.md + MODULE_DEPENDENCY.md

**Rollback triggers:**
- FormMapper.collectData() returns different structure
- API payload changes (check Network tab)
- localStorage data loses fields
- Edit mode stops working

**Safe fallback:** Keep all old CSS classes. New classes are additions, not replacements. Old JS functions are not removed — they are rewritten in the same global objects.

---

*End of UI_REFACTOR_PLAN.md — proceeding to Phase 3: Implementation*
