# CHANGELOG — TPBank BIZ UI Refactor

**Date:** 2026-05-29  
**Scope:** Full UI/UX system redesign — purple-first enterprise banking aesthetic

---

## Summary

Replaced Google Blue (`#1a73e8`) primary palette with TPBank BIZ purple system. Migrated from flat top-header layout to full enterprise sidebar + topbar architecture on the admin dashboard. Standardized all design tokens, border radii, shadows, and spacing to match the TPBank BIZ design concept shown in reference screenshots.

---

## Files Changed

### CSS — Complete Rewrites

#### `assets/css/variables.css`
- **Why:** Was Google Blue-primary (#1a73e8). Replaced with full TPBank BIZ token set.
- **Changes:**
  - `--color-primary` → `#7B2CBF` (purple)
  - Added `--sidebar-gradient: linear-gradient(180deg, #7B2CBF 0%, #6622B4 100%)`
  - Semantic colors: success `#4CAF50`, warning `#F6B100`, error `#F44336`
  - Background tokens: `--color-bg: #F5F5F7`, `--color-bg-alt: #FAFAFC`
  - Border token: `--color-border: #E9E9EF` (was `#dadce0`)
  - Text tokens: `--color-text: #1F1F2C`, `--color-text-secondary: #6D6D7A`, `--color-text-muted: #A4A4B2`
  - Border radius: `--radius-md: 12px` (inputs/buttons), `--radius-xl: 20px` (cards)
  - Shadow: `--shadow-card: 0 2px 10px rgba(0,0,0,.03)` (minimal)
  - Layout: Added `--sidebar-width: 252px`, `--topbar-height: 64px`, `--content-max-width: 1280px`
  - Kept `--color-purple-*` aliases for backward compat

#### `assets/css/layout.css`
- **Why:** Only had `.app-header` + `.app-container`. No sidebar system existed.
- **Changes:**
  - Added `.app-layout` (flex container for sidebar + main)
  - Added `.app-sidebar` (fixed, 252px, purple gradient, full sidebar component CSS)
  - Added `.app-main` (margin-left: sidebar-width, flex column)
  - Added `.app-topbar` (64px, white, sticky, enterprise topbar)
  - Added `.app-content` (scrollable content area, max 1280px)
  - Added all sidebar sub-components: `.sidebar-brand`, `.sidebar-nav`, `.sidebar-nav-item`, `.sidebar-footer`, `.sidebar-user`
  - Added `.sidebar-overlay` (mobile backdrop)
  - Added `.topbar-sidebar-toggle` (mobile hamburger)
  - Updated `.app-header` to use `--sidebar-gradient` (was `--color-primary` blue)

#### `assets/css/components.css`
- **Why:** `.btn-primary` was Google Blue. Radio/checkbox pills hovered blue. Toasts were colored backgrounds (noisy).
- **Changes:**
  - `.btn-primary` → purple background, purple hover shadow
  - `.btn-outline:hover` → purple border + purple surface bg
  - Added `.btn-ghost-white` for dark backgrounds (sidebar/header)
  - `.btn-lg` → new large size variant (48px height)
  - Toasts → border-left accent style (not solid color BG) for readability
  - Added `.stat-card` component with accent top bar
  - Added `.alert` banner component
  - Added `.card` base component with `.card-header`, `.card-title`
  - Updated `.data-table` with `--color-bg` header rows
  - Updated `.modal-card` — `border-radius: var(--radius-xl)`, purple focus rings
  - Added `.page-header`, `.page-title`, `.page-subtitle`
  - Updated `.tab-btn` / `.tab-nav` to use purple active state
  - Added `.search-box` with icon positioning

#### `assets/css/forms.css`
- **Why:** Focus rings were blue. Radio pills hovered blue. Input radius was 8px.
- **Changes:**
  - All `:focus` states → purple border + purple light ring
  - Radio/checkbox pills border-radius → `var(--radius-md)` (12px, was `radius-full`)
  - Selected pill BG → `--color-primary-light` (purple tint)
  - Select arrow → purple color
  - Added `.form-section` and `.form-section-title` with purple left bar accent
  - Input padding → `space-3 space-4` (slightly more spacious)

#### `assets/css/wizard.css`
- **Why:** Active step dot used blue. Done step checkmark misaligned. Success screen duplicated in states.css.
- **Changes:**
  - Active step dot → green ring border (matches TPBank BIZ screenshot exactly)
  - Done step → green fill + ✓ checkmark
  - Pending step → gray border, gray text
  - Added `.wizard-section-header` with purple text + expand chevron
  - Draft banner → amber left border style
  - Success screen moved entirely here (removed from states.css)

#### `assets/css/dashboard.css`
- **Why:** KPI cards had left-border accent only. Table headers had no background. Admin gate was fragmented.
- **Changes:**
  - KPI cards → top-border accent (3px, matches TPBank BIZ card style)
  - KPI icon containers → colored bg squares (not emoji-only)
  - `dash-tab.active` → purple underline + purple text (was blue)
  - `search-input:focus` → purple ring
  - Pending cards → `border-color: primary-light` on hover
  - Table headers → `background: var(--color-bg)`
  - Removed legacy `.btn-full` (now in components.css)
  - Added `.admin-gate-icon` as styled box (not raw emoji)

#### `assets/css/login.css`
- **Why:** Minor — already had purple gradient, but used older token names.
- **Changes:**
  - Replaced `var(--color-purple-darker/dark)` with `var(--sidebar-gradient)`
  - Login button → flat purple (not gradient), cleaner hover
  - Login input focus → purple (was `--color-purple`)

#### `assets/css/portal.css`
- **Why:** Brand sub text styling, service item padding, footer styling.
- **Changes:**
  - Header uses `var(--sidebar-gradient)` token
  - Service icon boxes use `var(--color-primary-surface)` (not `--color-purple-light`)
  - Service item padding → `space-5 space-6` (more spacious)
  - Service section title → uppercase, muted color (changed hierarchy)
  - Footer → white bg with top border

#### `assets/css/responsive.css`
- **Why:** No sidebar collapse logic existed.
- **Changes:**
  - Added 1280px breakpoint (sidebar 240px)
  - Added 1024px breakpoint: sidebar off-canvas, `.topbar-sidebar-toggle` shown
  - `.app-sidebar.is-open` shows on mobile via transform
  - `.app-main { margin-left: 0 }` below 1024px

#### `assets/css/states.css`
- **Why:** Contained `success-screen` styles (duplicated with wizard.css) and blue `edit-mode-banner`.
- **Changes:**
  - Removed success screen (now lives in wizard.css)
  - Removed edit-mode-banner (now lives in forms.css)
  - Kept skeleton shimmer

#### `assets/css/base.css`
- **Why:** `:focus-visible` used `--color-primary` (was blue). Minor only.
- **Changes:** Token references now resolve to purple via updated variables.css

---

### HTML Changes

#### `dashboard.html`
- **Why:** Had flat `<header class="app-header">` with all nav crammed in one row. No sidebar.
- **Changes:**
  - Full enterprise sidebar layout: `.app-layout > .app-sidebar + .app-main`
  - Sidebar: brand, nav items (Dashboard, Đăng ký, Trang chủ), user footer + logout
  - TopBar: sidebar toggle (mobile), page title, refresh button, user chip
  - Removed `id="headerAdminActions"` — replaced by sidebar user footer
  - Added mobile sidebar toggle script (open/close/overlay)
  - Improved ARIA: `role="navigation"`, `aria-current="page"`, `aria-expanded`

---

### JS Changes

#### `assets/js/dashboard.js`
- **Why:** Referenced `headerAdminActions` element (removed from HTML). No sidebar user population.
- **Changes:**
  - Added `populateSidebarUser()` — fills `#sidebarAvatar`, `#sidebarUserName`, `#topbarAvatar`, `#topbarUserName`
  - `showGate()` / `showDashboard()` — removed `headerAdminActions` toggle
  - `bindGate()` — added `sidebarLogoutBtn` listener alongside `logoutBtn`

---

### Documentation Created

| File | Content |
|---|---|
| `DESIGN_TOKENS.md` | Complete token reference (colors, type, spacing, radius, shadow, layout) |
| `DESIGN_SYSTEM.md` | Component HTML patterns, CSS architecture, naming conventions |
| `UIUX_SYSTEM.md` | Design philosophy, layout diagram, anti-patterns |
| `CHANGELOG_UI_REFACTOR.md` | This file |

---

## Technical Debt Fixed

1. **Blue primary color** — eliminated everywhere, purple is now the single primary
2. **No sidebar** — enterprise dashboard now has proper sidebar navigation
3. **Inconsistent radius** — standardized: `12px` buttons/inputs, `20px` cards
4. **Heavy toasts** — replaced solid-color backgrounds with border-left accent style
5. **Duplicated success-screen CSS** — merged into wizard.css
6. **Duplicated edit-mode-banner CSS** — merged into forms.css
7. **Missing responsive sidebar** — added collapse/overlay system

---

## Remaining Issues

1. **No icon library** — sidebar nav items use emoji. Should migrate to SVG icons (Heroicons, Phosphor).
2. **Chart library** — currently CSS bars only. Consider Chart.js for donut/line charts per design brief.
3. **Wizard section expand chevron** — `.wizard-section-header` styled but JS expand behavior needs wiring.
4. **Portal (index.html) sidebar** — portal home still uses top-header layout. If future requirement adds persistent nav to portal, sidebar component is ready to reuse.
5. **register.html header** — still uses emoji `🚀` as logo. Replace with proper SVG logotype.
6. **typography.css** — not audited in this refactor. Check for any leftover blue color references.

---

## Migration Notes for Future Sessions

- **Token changes**: Always edit `variables.css` first. All other files reference tokens.
- **New purple variant**: Use `--color-primary-*` family, not the legacy `--color-purple-*` aliases.
- **Sidebar on new pages**: Copy the `.app-sidebar` + `.app-main` + `.app-layout` structure from `dashboard.html`.
- **Purple focus rings**: Already in `forms.css`. New inputs just need `.form-control` class or live inside `.form-group`.
- **Admin gate**: Pattern is reusable — copy `.admin-gate-card` structure for any gated admin pages.

---

## Recommended Next Tasks

1. Add SVG icon set (Heroicons or Phosphor) — replace emoji in sidebar nav
2. Integrate Chart.js for donut chart (status breakdown) + line chart (submission trend)
3. Audit `typography.css` for any remaining blue color values
4. Add `SYSTEM_ARCHITECTURE.md` update with sidebar layout architecture
5. Create `register.html` sidebar variant (same sidebar, wizard content as main)
6. Add `COMPONENT_GUIDELINES.md` with copy-paste HTML patterns for each component
