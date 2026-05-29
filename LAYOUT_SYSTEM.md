# Layout System — TPBank BIZ

## Enterprise App Shell (dashboard.html)

```
.app-layout
├── .app-sidebar (fixed, 252px, purple gradient)
│   ├── .sidebar-brand
│   ├── .sidebar-nav
│   │   ├── .sidebar-section-label
│   │   └── .sidebar-nav-item (.is-active)
│   └── .sidebar-footer (.sidebar-user)
├── .sidebar-overlay (mobile backdrop)
└── .app-main (margin-left: 252px)
    ├── .app-topbar (sticky, 64px)
    └── .app-content (scrollable, max 1280px)
```

## Portal Shell (index.html)

```
.portal-header (sticky, purple gradient)
.portal-body-bg
└── .portal-main (max 800px, centered)
    └── .service-sections
        └── .service-list > .service-item
```

## Wizard Shell (register.html)

```
.app-header (purple gradient, sticky)
.app-container (max 760px, centered)
└── .wizard
    ├── .progress-track > .progress-fill
    ├── .draft-banner
    ├── .edit-mode-banner
    ├── .step-indicators
    ├── .wizard-meta
    ├── .wizard-body > form
    ├── .success-screen
    └── .wizard-nav-wrapper
```

## Auth Shell (login.html)

```
.login-page (flex column)
├── .login-header
└── .login-main (flex center)
    └── .login-card
        ├── .login-card-top (purple gradient)
        └── .login-card-body
```

---

## Sidebar Collapse Behavior

- **≥ 1024px**: Sidebar is always visible (fixed position, no toggle needed)
- **< 1024px**: Sidebar hides off-screen (`transform: translateX(-100%)`)
  - Toggle button (`.topbar-sidebar-toggle`) becomes visible
  - Clicking toggle → adds `.is-open` to `.app-sidebar`
  - `.sidebar-overlay` covers the rest of the page
  - Clicking overlay or pressing `Escape` closes sidebar
- **`.app-main`**: `margin-left: 0` below 1024px (sidebar is overlay, not inline)

---

## Grid System

No CSS grid framework. Use explicit grid classes:

```css
.kpi-row    { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.dash-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
```

Responsive overrides in `responsive.css` collapse to 2-col → 1-col.

---

## Spacing Rules

| Context | Padding | Gap |
|---|---|---|
| App content area | 32px | — |
| Card (default) | 24px | — |
| Card (compact) | 20px 20px | — |
| Card (auth gate) | 48px 40px | — |
| KPI row | — | 20px |
| Chart rows | — | 12px |
| Section gap (card to card) | — | 20px |
| Topbar | 0 32px | — |
| Sidebar nav items | 12px 24px | — |
