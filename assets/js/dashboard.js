/* ─────────────────────────────────────────
   dashboard.js — Dashboard quản lý AI Use Case
   Phụ thuộc: config/env.js, config/routes.js, assets/js/api.js
   RBAC: UI-level only. Backend GAS có validation riêng.
   ───────────────────────────────────────── */
(function () {

  // ── State ────────────────────────────────────────────────────────
  var _adminEmail  = null;
  var _dashData    = null;
  var _pendingList = [];
  var _allList     = [];

  // ── Status display config ────────────────────────────────────────
  var STATUS_CFG = {
    'Draft':        { label: 'Nháp',         color: '#5f6368' },
    'Submitted':    { label: 'Đã nộp',       color: '#1a73e8' },
    'Under Review': { label: 'Đang review',  color: '#f29900' },
    'Approved':     { label: 'Đã duyệt',     color: '#0f9d58' },
    'Rejected':     { label: 'Từ chối',      color: '#d93025' },
    'Archived':     { label: 'Lưu trữ',      color: '#80868b' }
  };

  // ── Admin Gate ───────────────────────────────────────────────────
  function checkAdminAccess() {
    var saved = sessionStorage.getItem(APP_CONFIG.ADMIN_SESSION_KEY);
    if (saved && isAdminEmail(saved)) {
      _adminEmail = saved;
      showDashboard();
    } else {
      showGate();
    }
  }

  function isAdminEmail(email) {
    if (!email) return false;
    var lower = email.toLowerCase().trim();
    return (APP_CONFIG.ADMIN_EMAILS || []).some(function (a) {
      return a.toLowerCase().trim() === lower;
    });
  }

  function showGate() {
    document.getElementById('adminGate').classList.remove('hidden');
    document.getElementById('dashboardContent').classList.add('hidden');
    document.getElementById('headerAdminActions').classList.add('hidden');
  }

  function showDashboard() {
    document.getElementById('adminGate').classList.add('hidden');
    document.getElementById('dashboardContent').classList.remove('hidden');
    document.getElementById('headerAdminActions').classList.remove('hidden');
    var emailEl = document.getElementById('adminEmailDisplay');
    if (emailEl) emailEl.textContent = _adminEmail;
    loadDashboardData();
  }

  function bindGate() {
    var form       = document.getElementById('adminGateForm');
    var emailInput = document.getElementById('adminEmailInput');
    var errEl      = document.getElementById('adminGateError');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (emailInput.value || '').trim();
      if (!isAdminEmail(email)) {
        errEl.textContent = 'Email này không có quyền truy cập dashboard quản lý.';
        errEl.classList.remove('hidden');
        return;
      }
      _adminEmail = email;
      sessionStorage.setItem(APP_CONFIG.ADMIN_SESSION_KEY, email);
      errEl.classList.add('hidden');
      showDashboard();
    });

    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        sessionStorage.removeItem(APP_CONFIG.ADMIN_SESSION_KEY);
        _adminEmail = null;
        _dashData   = null;
        _pendingList = [];
        _allList     = [];
        showGate();
      });
    }
  }

  // ── Data Loading ─────────────────────────────────────────────────
  async function loadDashboardData() {
    showLoading(true);
    try {
      // Load overview + pending concurrently
      const [dashData, pendingList] = await Promise.all([
        Api.getDashboard(),
        Api.listUseCases({ filter: 'pending' })
      ]);
      _dashData    = dashData;
      _pendingList = pendingList || [];

      renderKPI(_dashData);
      renderStatusChart(_dashData.status_breakdown   || {});
      renderBreakdownChart('teamChart',     _dashData.team_breakdown     || {});
      renderBreakdownChart('categoryChart', _dashData.category_breakdown || {});
      renderRecentTable(_dashData.recent_submissions || []);
      renderPendingTable(_pendingList);
      updatePendingBadge(_pendingList.length);
      updateRefreshedAt(_dashData.refreshed_at);

    } catch (err) {
      showToast('Lỗi tải dữ liệu: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async function loadAllUseCases() {
    showLoading(true);
    try {
      _allList = (await Api.listUseCases({ limit: 200 })) || [];
      renderAllTable(_allList);
    } catch (err) {
      showToast('Lỗi tải danh sách: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  // ── KPI ──────────────────────────────────────────────────────────
  function renderKPI(data) {
    var st      = data.status_breakdown || {};
    var pending = (st['Submitted'] || 0) + (st['Under Review'] || 0);
    var hours   = data.total_hours_saved_month || 0;

    setKPI('kpiTotal',    data.total_use_cases || 0);
    setKPI('kpiApproved', data.approved_count  || 0);
    setKPI('kpiPending',  pending);
    setKPI('kpiHours',    hours >= 1000 ? (hours / 1000).toFixed(1) + 'k' : String(Math.round(hours)));
  }

  function setKPI(id, value) {
    var card = document.getElementById(id);
    if (!card) return;
    var el = card.querySelector('.kpi-value');
    if (el) el.textContent = value;
  }

  // ── Status Chart ─────────────────────────────────────────────────
  function renderStatusChart(breakdown) {
    var container = document.getElementById('statusChart');
    if (!container) return;
    var total = objSum(breakdown);
    if (total === 0) { container.innerHTML = emptyChart(); return; }

    var order = ['Approved', 'Submitted', 'Under Review', 'Draft', 'Rejected', 'Archived'];
    container.innerHTML = order.map(function (status) {
      var count = breakdown[status] || 0;
      if (count === 0) return '';
      var cfg = STATUS_CFG[status] || { label: status, color: '#dadce0' };
      var pct = ((count / total) * 100).toFixed(1);
      return chartRow(cfg.label, pct + '%', cfg.color, count + ' (' + pct + '%)');
    }).join('');
  }

  // ── Generic Breakdown Chart ───────────────────────────────────────
  function renderBreakdownChart(containerId, breakdown) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var entries = Object.keys(breakdown)
      .map(function (k) { return [k, breakdown[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; });

    if (entries.length === 0) { container.innerHTML = emptyChart(); return; }
    var maxVal = entries[0][1];

    container.innerHTML = entries.slice(0, 8).map(function (e) {
      var pct = ((e[1] / maxVal) * 100).toFixed(0);
      return chartRow(e[0], pct + '%',
        'var(--color-primary)', String(e[1]),
        'var(--color-primary-light)', true);
    }).join('');
  }

  function chartRow(label, widthPct, barColor, countText, bgColor, bordered) {
    var barStyle = 'width:' + widthPct + ';background:' + (bgColor || barColor);
    if (bordered) barStyle += ';border-left:3px solid ' + barColor;
    return '<div class="chart-row">' +
      '<span class="chart-row-label" title="' + esc(label) + '">' + esc(label) + '</span>' +
      '<div class="chart-bar-wrap"><div class="chart-bar" style="' + barStyle + '"></div></div>' +
      '<span class="chart-row-count">' + esc(countText) + '</span>' +
    '</div>';
  }

  function emptyChart() {
    return '<p class="empty-state-text">Chưa có dữ liệu</p>';
  }

  // ── Recent Submissions Table ─────────────────────────────────────
  function renderRecentTable(items) {
    var tbody = document.querySelector('#recentTable tbody');
    if (!tbody) return;
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">Chưa có use case nào được nộp gần đây</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(function (uc) {
      return '<tr>' +
        '<td><span class="id-badge">' + esc(uc.usecase_id || '--') + '</span></td>' +
        '<td>' + esc(uc.name || '') + '</td>' +
        '<td>' + esc(uc.team || '--') + '</td>' +
        '<td>' + fmtDate(uc.submitted_at) + '</td>' +
      '</tr>';
    }).join('');
  }

  // ── Pending Approval Cards ────────────────────────────────────────
  function renderPendingTable(items) {
    var container = document.getElementById('pendingList');
    if (!container) return;
    if (!items.length) {
      container.innerHTML = '<div class="empty-state"><p class="empty-state-text">Không có use case nào đang chờ duyệt ✓</p></div>';
      return;
    }
    container.innerHTML = items.map(function (uc) {
      var cfg = STATUS_CFG[uc.status] || { label: uc.status, color: '#5f6368' };
      var excerpt = uc.pain_point
        ? '<div class="pending-card-excerpt">' + esc(uc.pain_point.substring(0, 150)) +
          (uc.pain_point.length > 150 ? '…' : '') + '</div>'
        : '';
      return '<div class="pending-card" data-record-id="' + esc(uc.record_id) + '">' +
        '<div class="pending-card-header">' +
          '<span class="id-badge">' + esc(uc.usecase_id || '--') + '</span>' +
          '<span class="status-badge" style="background:' + cfg.color + '20;color:' + cfg.color + ';border:1px solid ' + cfg.color + '40">' + cfg.label + '</span>' +
        '</div>' +
        '<div class="pending-card-title">' + esc(uc.name || 'Không có tên') + '</div>' +
        '<div class="pending-card-meta">' +
          '<span>👤 ' + esc(uc.owner_name || '--') + '</span>' +
          '<span>🏷️ ' + esc(uc.team || '--') + '</span>' +
          '<span>📁 ' + esc(uc.category || '--') + '</span>' +
          '<span>📅 ' + fmtDate(uc.submit_date) + '</span>' +
        '</div>' +
        excerpt +
        '<div class="pending-card-actions">' +
          '<button class="btn btn-sm btn-success" onclick="Dashboard._approve(\'' + esc(uc.record_id) + '\',\'' + escAttr(uc.name || '') + '\')">✓ Duyệt</button>' +
          '<button class="btn btn-sm btn-danger"  onclick="Dashboard._reject(\''  + esc(uc.record_id) + '\',\'' + escAttr(uc.name || '') + '\')">✕ Từ chối</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ── All Use Cases Table ───────────────────────────────────────────
  function renderAllTable(items) {
    var tbody = document.querySelector('#allTable tbody');
    if (!tbody) return;
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Chưa có use case nào</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(function (uc) {
      var cfg = STATUS_CFG[uc.status] || { label: uc.status, color: '#5f6368' };
      return '<tr>' +
        '<td><span class="id-badge">' + esc(uc.usecase_id || '--') + '</span></td>' +
        '<td>' + esc(uc.name || '') + '</td>' +
        '<td>' + esc(uc.owner_name || '--') + '</td>' +
        '<td>' + esc(uc.team || '--') + '</td>' +
        '<td><span class="status-badge" style="background:' + cfg.color + '20;color:' + cfg.color + '">' + cfg.label + '</span></td>' +
      '</tr>';
    }).join('');
  }

  // ── Modal: Approve / Reject ───────────────────────────────────────
  var _modal = { action: null, recordId: null };

  function openApprove(recordId, name) {
    _modal = { action: 'approve', recordId: recordId };
    var confirmBtn = document.getElementById('modalConfirmBtn');
    confirmBtn.className = 'btn btn-success';
    confirmBtn.textContent = 'Xác nhận duyệt';
    document.getElementById('modalTitle').textContent = 'Xác nhận duyệt use case';
    document.getElementById('modalBody').innerHTML =
      'Duyệt use case: <strong>' + esc(name) + '</strong>';
    document.getElementById('modalComment').value = '';
    document.getElementById('rejectNote').classList.add('hidden');
    document.getElementById('approvalModal').classList.remove('hidden');
  }

  function openReject(recordId, name) {
    _modal = { action: 'reject', recordId: recordId };
    var confirmBtn = document.getElementById('modalConfirmBtn');
    confirmBtn.className = 'btn btn-danger';
    confirmBtn.textContent = 'Xác nhận từ chối';
    document.getElementById('modalTitle').textContent = 'Từ chối use case';
    document.getElementById('modalBody').innerHTML =
      'Từ chối use case: <strong>' + esc(name) + '</strong>';
    document.getElementById('modalComment').value = '';
    document.getElementById('rejectNote').classList.remove('hidden');
    document.getElementById('approvalModal').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('approvalModal').classList.add('hidden');
    _modal = { action: null, recordId: null };
  }

  async function confirmApproval() {
    if (!_modal.action || !_modal.recordId) return;
    var comment    = (document.getElementById('modalComment').value || '').trim();
    var confirmBtn = document.getElementById('modalConfirmBtn');

    if (_modal.action === 'reject' && !comment) {
      showToast('Vui lòng nhập lý do từ chối', 'error');
      return;
    }

    confirmBtn.disabled    = true;
    confirmBtn.textContent = 'Đang xử lý...';

    try {
      var payload = {
        record_id:      _modal.recordId,
        reviewer_email: _adminEmail,
        comment:        comment
      };

      if (_modal.action === 'approve') {
        await Api.approveUseCase(payload);
        showToast('Đã duyệt use case thành công', 'success');
      } else {
        await Api.rejectUseCase(payload);
        showToast('Đã từ chối use case', 'info');
      }

      closeModal();

      // Reload pending + cập nhật KPI
      showLoading(true);
      const [pending, dashData] = await Promise.all([
        Api.listUseCases({ filter: 'pending' }),
        Api.getDashboard()
      ]);
      _pendingList = pending || [];
      _dashData    = dashData;
      renderPendingTable(_pendingList);
      updatePendingBadge(_pendingList.length);
      renderKPI(_dashData);
      renderStatusChart(_dashData.status_breakdown || {});
      updateRefreshedAt(_dashData.refreshed_at);

    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
      confirmBtn.disabled    = false;
      confirmBtn.textContent = _modal.action === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối';
    } finally {
      showLoading(false);
    }
  }

  // ── Tab Navigation ───────────────────────────────────────────────
  function bindTabs() {
    document.querySelectorAll('.dash-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.dataset.tab;
        document.querySelectorAll('.dash-tab').forEach(function (t) {
          t.classList.toggle('active', t === tab);
        });
        document.querySelectorAll('.tab-panel').forEach(function (panel) {
          panel.classList.toggle('hidden', panel.id !== 'tab-' + target);
        });
        if (target === 'all' && _allList.length === 0) {
          loadAllUseCases();
        }
      });
    });
  }

  // ── Search ───────────────────────────────────────────────────────
  function bindSearch() {
    var input = document.getElementById('searchInput');
    if (!input) return;
    input.addEventListener('input', debounce(function () {
      var q = input.value.trim().toLowerCase();
      if (!q) { renderAllTable(_allList); return; }
      renderAllTable(_allList.filter(function (uc) {
        return (uc.name        || '').toLowerCase().includes(q)
            || (uc.owner_name  || '').toLowerCase().includes(q)
            || (uc.team        || '').toLowerCase().includes(q)
            || (uc.usecase_id  || '').toLowerCase().includes(q);
      }));
    }, 300));
  }

  // ── Refresh Button ───────────────────────────────────────────────
  function bindRefresh() {
    var btn = document.getElementById('refreshBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      _allList = []; // Force reload all list on next tab switch
      loadDashboardData();
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────
  function updatePendingBadge(count) {
    var el = document.getElementById('pendingBadge');
    if (el) el.textContent = count > 0 ? String(count) : '';
  }

  function updateRefreshedAt(ts) {
    var el = document.getElementById('refreshedAt');
    if (el && ts) el.textContent = 'Cập nhật: ' + fmtDate(ts);
  }

  function fmtDate(isoStr) {
    if (!isoStr) return '--';
    try {
      var d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return String(isoStr).substring(0, 10); }
  }

  // XSS-safe: dùng textContent escaping cho nội dung bên trong thẻ
  function esc(str) {
    var d = document.createElement('span');
    d.textContent = String(str == null ? '' : str);
    return d.innerHTML;
  }
  // XSS-safe: cho giá trị attribute (loại bỏ dấu nháy đơn)
  function escAttr(str) {
    return String(str == null ? '' : str).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  }

  function objSum(obj) {
    return Object.keys(obj).reduce(function (s, k) { return s + (obj[k] || 0); }, 0);
  }

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  function showLoading(show) {
    var el = document.getElementById('loadingOverlay');
    if (el) el.classList.toggle('hidden', !show);
  }

  function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    var toast  = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.setAttribute('role', 'alert');
    toast.innerHTML =
      '<span class="toast-icon" aria-hidden="true">' + (icons[type] || 'ℹ') + '</span>' +
      '<span class="toast-message" style="white-space:pre-line">' + esc(message) + '</span>' +
      '<button class="toast-close" aria-label="Đóng" onclick="this.parentElement.remove()">×</button>';
    container.appendChild(toast);
    setTimeout(function () { if (toast.parentNode) toast.remove(); }, 5000);
  }

  // ── Init ─────────────────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', function () {
    bindGate();
    bindTabs();
    bindSearch();
    bindRefresh();

    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalConfirmBtn').addEventListener('click', confirmApproval);

    // Close modal on backdrop click
    document.getElementById('approvalModal').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });

    checkAdminAccess();
  });

  // ── Public API (gọi từ inline onclick trên pending cards) ─────────
  window.Dashboard = {
    _approve: openApprove,
    _reject:  openReject
  };

})();
