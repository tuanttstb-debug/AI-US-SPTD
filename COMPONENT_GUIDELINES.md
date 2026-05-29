# Component Guidelines — TPBank BIZ

## General Rules

1. All components must use CSS custom property tokens — no hardcoded hex values
2. All interactive elements must have hover, active, focus, and disabled states
3. All form controls must have visible focus rings (purple, 3px ring)
4. Components must be usable at all 5 breakpoints
5. ARIA roles and labels are required on all interactive components

---

## Sidebar Nav Item

**When active:** Add `is-active` class + `aria-current="page"`  
**When disabled:** Add `is-disabled` class + `aria-disabled="true"` + `pointer-events: none`

```html
<a href="dashboard.html" class="sidebar-nav-item is-active"
   role="menuitem" aria-current="page">
  <i class="sidebar-nav-icon" aria-hidden="true">📊</i>
  <span class="sidebar-nav-label">Dashboard</span>
  <span class="sidebar-nav-badge">3</span>  <!-- optional -->
</a>
```

Badge hides automatically when empty (`:empty { display: none }`).

---

## Button States

Always check all 4 states when adding a new button:

| State | CSS |
|---|---|
| Default | base class |
| Hover | `:hover:not(:disabled)` |
| Active | `:active` → `opacity: 0.88` |
| Disabled | `disabled` attribute or `.btn:disabled` |
| Loading | Add spinner child + hide label (pattern from login-btn) |

---

## Form Validation Pattern

```javascript
// Show error on a form-group
function showFieldError(inputEl, message) {
  var group = inputEl.closest('.form-group');
  group.classList.add('has-error');
  var err = group.querySelector('.field-error');
  if (err) err.textContent = message;
}

// Clear error
function clearFieldError(inputEl) {
  var group = inputEl.closest('.form-group');
  group.classList.remove('has-error');
  var err = group.querySelector('.field-error');
  if (err) err.textContent = '';
}
```

---

## Toast Notification Pattern

```javascript
function showToast(message, type) {
  // type: 'success' | 'error' | 'warning' | 'info'
  var icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.setAttribute('role', 'alert');
  toast.innerHTML =
    '<span class="toast-icon">' + icons[type] + '</span>' +
    '<span class="toast-message">' + escapeHtml(message) + '</span>' +
    '<button class="toast-close" onclick="this.parentElement.remove()">×</button>';
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(function() { toast.remove(); }, 5000);
}
```

---

## KPI Card Color Variants

```html
<!-- Default (purple accent top) -->
<div class="kpi-card">...</div>

<!-- Success (green accent top) -->
<div class="kpi-card kpi-success">...</div>

<!-- Warning (amber accent top) -->
<div class="kpi-card kpi-warning">...</div>

<!-- Info (blue accent top) -->
<div class="kpi-card kpi-info">...</div>
```

---

## Status Badge Inline Style Pattern

When rendering dynamic status badges in JS (no pre-known class), use inline color style:

```javascript
var cfg = STATUS_CFG[status] || { label: status, color: '#A4A4B2' };
var badge = '<span class="status-badge" style="' +
  'background:' + cfg.color + '20;' +  // 12% opacity background
  'color:' + cfg.color + ';' +
  'border:1px solid ' + cfg.color + '40' +  // 25% opacity border
  '">' + cfg.label + '</span>';
```

---

## Tab Panel Pattern

Tabs must use `role="tablist"` + `role="tab"` + `aria-selected` + `role="tabpanel"` + `aria-labelledby`.

```javascript
function bindTabs() {
  document.querySelectorAll('[role="tab"]').forEach(function(tab) {
    tab.addEventListener('click', function() {
      // Deactivate all
      document.querySelectorAll('[role="tab"]').forEach(function(t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.tab-panel').forEach(function(p) {
        p.classList.add('hidden');
      });
      // Activate clicked
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      var target = document.getElementById('tab-' + tab.dataset.tab);
      if (target) target.classList.remove('hidden');
    });
  });
}
```

---

## Modal Pattern

```javascript
function openModal() {
  document.getElementById('myModal').classList.remove('hidden');
  document.getElementById('myModal').querySelector('[data-focus]').focus();
}
function closeModal() {
  document.getElementById('myModal').classList.add('hidden');
}
// Close on overlay click
document.getElementById('myModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
// Close on Escape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});
```

---

## Collapsible Section (Wizard)

The `<details>` + `<summary>` pattern is used for expandable form sections:

```html
<details class="collapsible-section">
  <summary>
    <span class="collapsible-title">Section Title</span>
    <span class="collapsible-hint">Optional</span>
    <span class="collapsible-chevron">▼</span>
  </summary>
  <div class="collapsible-body">
    <!-- form fields -->
  </div>
</details>
```

The CSS auto-rotates the chevron when `[open]` is present.
