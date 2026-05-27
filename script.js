// ============================================================
//  AI Use Case Package Manager — script.html
//  Fixes: step sync, dropdown-then-populate order, demo radio,
//         debounced autosave, admin edit via hash, toast icons,
//         dashboard refresh, Pain_Point validation, admin count
// ============================================================

/* ── Global state ── */
var currentStep = 1;
var editMode    = false;
var editId      = null;
var isAdminUser = false;
var lookupData  = {};
var autosaveTimer = null;
var totalSteps  = 4; // updated after admin check

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
  showLoading(true, 'Đang khởi tạo...');

  // Cascade: lookup → email → admin → mode
  google.script.run
    .withSuccessHandler(function (data) {
      lookupData = data || {};

      google.script.run
        .withSuccessHandler(function (email) {
          var displayEmail = email || 'Guest';
          document.getElementById('userDisplay').textContent = displayEmail;
          // Avatar initials
          var initials = displayEmail.split('@')[0].slice(0, 2).toUpperCase();
          document.getElementById('userAvatar').textContent = initials;

          google.script.run
            .withSuccessHandler(function (adminResult) {
              isAdminUser = !!adminResult;
              if (isAdminUser) {
                totalSteps = 5;
                document.querySelectorAll('.admin-only, .admin-step').forEach(function (el) {
                  el.style.display = '';
                });
              }

              // Populate dropdowns FIRST, then check mode
              populateDropdowns();

              // Read edit target from hash (e.g. #edit=AIUS-0001)
              var hash      = window.location.hash; // e.g. "#edit=AIUS-0001"
              var editParam = null;
              if (hash && hash.indexOf('edit=') > -1) {
                editParam = hash.split('edit=')[1];
              }
              // Also support query string for Apps Script web app
              try {
                var qs = new URLSearchParams(window.location.search);
                if (!editParam && qs.get('edit')) editParam = qs.get('edit');
              } catch (e) {}

              if (editParam) {
                showLoading(true, 'Đang tải use case...');
                google.script.run
                  .withSuccessHandler(function (record) {
                    if (record) {
                      editMode = true;
                      editId   = editParam;
                      populateForm(record);
                      updateEditBanner();
                    } else {
                      showToast('Không tìm thấy use case: ' + editParam, 'error');
                    }
                    currentStep = 1;
                    renderProgressSteps();
                    updateStepVisibility();
                    showLoading(false);
                  })
                  .withFailureHandler(function (err) {
                    showToast('Lỗi tải use case: ' + (err.message || err), 'error');
                    currentStep = 1;
                    renderProgressSteps();
                    updateStepVisibility();
                    showLoading(false);
                  })
                  .loadUseCase(editParam);
              } else {
                // New mode
                checkAutosave();
                currentStep = 1;
                renderProgressSteps();
                updateStepVisibility();
                showLoading(false);
              }
            })
            .withFailureHandler(handleInitError('admin check'))
            .isAdmin(email);
        })
        .withFailureHandler(handleInitError('get email'))
        .getUserEmail();
    })
    .withFailureHandler(handleInitError('load lookup'))
    .getLookupData();
});

function handleInitError(stage) {
  return function (err) {
    showToast('Lỗi ' + stage + ': ' + (err.message || err), 'error');
    showLoading(false);
  };
}

// ============================================================
//  POPULATE DROPDOWNS
// ============================================================
function populateDropdowns() {
  populateSelect('f_Team', lookupData['TEAM'] || ['BA','CA','PM','Product']);

  populateCheckboxGroup('f_User_Type', ['Cá nhân','Team','TT SPTD']);
  populateCheckboxGroup('f_Expected_Goals',
    lookupData['GOAL'] || ['Giảm thời gian','Chuẩn hóa output','Giảm lỗi','Tăng tốc review','Tăng năng suất']);
  populateCheckboxGroup('f_Input_Types',
    lookupData['INPUT_TYPE'] || ['Email','TLPT/BRD/FRD','Excel','Policy','Nội dung họp','Khác']);
  populateCheckboxGroup('f_Reuse_Level',
    lookupData['REUSE'] || ['Cá nhân','Team khác','Toàn TT SPTD']);

  if (isAdminUser) {
    populateSelect('f_Status',
      lookupData['STATUS'] || ['Draft','Submitted','Reviewing','Approved','Rework','Archived']);
    populateSelect('f_Current_Stage',
      lookupData['STAGE'] || ['S1 - Idea','S2 - Pilot','S3 - Standardized','S4 - Scale']);
  }
}

function populateSelect(id, options) {
  var sel = document.getElementById(id);
  if (!sel) return;
  var current = sel.value;
  sel.innerHTML = '<option value="">-- Chọn --</option>';
  options.forEach(function (o) {
    var opt     = document.createElement('option');
    opt.value   = o;
    opt.textContent = o;
    sel.appendChild(opt);
  });
  if (current) sel.value = current;
}

function populateCheckboxGroup(id, options) {
  var container = document.getElementById(id);
  if (!container) return;
  // Preserve currently checked values
  var checked = Array.from(container.querySelectorAll('input[type="checkbox"]:checked'))
                     .map(function (cb) { return cb.value; });
  container.innerHTML = '';
  options.forEach(function (o) {
    var label  = document.createElement('label');
    var cb     = document.createElement('input');
    cb.type    = 'checkbox';
    cb.value   = o;
    if (checked.indexOf(o) > -1) cb.checked = true;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + o));
    container.appendChild(label);
  });
}

// ============================================================
//  WIZARD NAVIGATION
// ============================================================
var STEP_CONFIG = [
  { step: 1, label: '1. Business',    adminOnly: false },
  { step: 2, label: '2. AI Flow',     adminOnly: false },
  { step: 3, label: '3. Demo',        adminOnly: false },
  { step: 4, label: '4. Quick Guide', adminOnly: false },
  { step: 5, label: '5. Review',      adminOnly: true  }
];

function getVisibleSteps() {
  return STEP_CONFIG.filter(function (s) { return !s.adminOnly || isAdminUser; });
}

function renderProgressSteps() {
  var steps   = getVisibleSteps();
  var container = document.getElementById('progressSteps');
  if (!container) return;
  container.innerHTML = '';

  steps.forEach(function (s, idx) {
    var item = document.createElement('div');
    item.className = 'step-item';
    if (s.step < currentStep)  item.classList.add('done');
    if (s.step === currentStep) item.classList.add('active');

    var dot    = document.createElement('div');
    dot.className = 'step-dot';
    dot.textContent = s.step < currentStep ? '✓' : s.step;
    item.appendChild(dot);

    var lbl    = document.createElement('div');
    lbl.className = 'step-label';
    lbl.textContent = s.label;
    item.appendChild(lbl);

    container.appendChild(item);

    // Line between items
    if (idx < steps.length - 1) {
      var line = document.createElement('div');
      line.className = 'step-line';
      if (s.step < currentStep) line.style.background = 'var(--green)';
      item.appendChild(line);
    }
  });
}

function updateStepVisibility() {
  var steps      = getVisibleSteps();
  var maxStep    = steps[steps.length - 1].step;
  var pct        = ((currentStep - 1) / Math.max(maxStep - 1, 1)) * 100;

  // Form steps
  document.querySelectorAll('.form-step').forEach(function (el) {
    var s = parseInt(el.dataset.step);
    el.style.display = (s === currentStep) ? '' : 'none';
  });

  // Progress bar
  document.getElementById('progressFill').style.width = pct + '%';

  // Prev / Next buttons
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  if (prevBtn) prevBtn.disabled = (currentStep === 1);
  if (nextBtn) nextBtn.style.display = (currentStep < maxStep) ? '' : 'none';

  // Step info text
  var infoEl = document.getElementById('stepNavInfo');
  if (infoEl) infoEl.textContent = 'Bước ' + currentStep + ' / ' + maxStep;

  // Render dots
  renderProgressSteps();

  // Update page header subtitle
  var subtitles = {
    1: 'Mô tả vấn đề kinh doanh',
    2: 'Luồng xử lý AI',
    3: 'Demo & hiệu quả',
    4: 'Hướng dẫn nhanh',
    5: 'Admin review'
  };
  var subtitleEl = document.getElementById('pageSubtitle');
  if (subtitleEl) subtitleEl.textContent = subtitles[currentStep] || '';
}

function nextStep() {
  if (!validateStep(currentStep)) return;
  var steps   = getVisibleSteps();
  var maxStep = steps[steps.length - 1].step;
  if (currentStep < maxStep) {
    currentStep++;
    updateStepVisibility();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepVisibility();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function validateStep(step) {
  if (step === 1) {
    var name = document.getElementById('f_UseCase_Name').value.trim();
    if (!name) { showToast('Vui lòng nhập Tên Use Case.', 'error'); focusField('f_UseCase_Name'); return false; }
    var owner = document.getElementById('f_Owner_Name').value.trim();
    if (!owner) { showToast('Vui lòng nhập tên Owner.', 'error'); focusField('f_Owner_Name'); return false; }
    var email = document.getElementById('f_Owner_Email').value.trim();
    if (!email || email.indexOf('@') < 0) { showToast('Email không hợp lệ.', 'error'); focusField('f_Owner_Email'); return false; }
    var team  = document.getElementById('f_Team').value;
    if (!team) { showToast('Vui lòng chọn Team.', 'error'); focusField('f_Team'); return false; }
    var pain  = document.getElementById('f_Pain_Point').value.trim();
    if (!pain) { showToast('Vui lòng mô tả Pain Point.', 'error'); focusField('f_Pain_Point'); return false; }
    // Expected goals
    var goals = Array.from(document.querySelectorAll('#f_Expected_Goals input:checked'));
    if (goals.length === 0) { showToast('Vui lòng chọn ít nhất 1 mục tiêu kỳ vọng.', 'error'); return false; }
  }
  if (step === 2) {
    var flow = document.getElementById('f_Flow_Description').value.trim();
    if (!flow) { showToast('Vui lòng mô tả luồng AI.', 'error'); focusField('f_Flow_Description'); return false; }
  }
  return true;
}

function focusField(id) {
  var el = document.getElementById(id);
  if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}

// ============================================================
//  AUTOSAVE (debounced, 1.5s)
// ============================================================
document.addEventListener('input', function (e) {
  if (e.target.closest('#useCaseForm') && !editMode) scheduleAutosave();
});
document.addEventListener('change', function (e) {
  if (e.target.closest('#useCaseForm') && !editMode) scheduleAutosave();
});

function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(autosave, 1500);
}

function autosave() {
  if (editMode) return; // don't autosave edits to localStorage
  try {
    var data = collectFormData();
    localStorage.setItem('aiusecase_draft', JSON.stringify(data));
  } catch (e) { /* quota exceeded etc */ }
}

function checkAutosave() {
  if (editMode) return;
  try {
    var saved = localStorage.getItem('aiusecase_draft');
    if (!saved) return;
    var data = JSON.parse(saved);
    if (data.UseCase_Name || data.Owner_Name) {
      if (confirm('Có dữ liệu nháp chưa lưu. Bạn có muốn khôi phục?')) {
        populateForm(data);
        showToast('Đã khôi phục dữ liệu nháp.', 'success');
      } else {
        localStorage.removeItem('aiusecase_draft');
      }
    }
  } catch (e) { localStorage.removeItem('aiusecase_draft'); }
}

// ============================================================
//  FORM DATA HELPERS
// ============================================================
var CHECKBOX_FIELDS = ['User_Type', 'Expected_Goals', 'Input_Types', 'Reuse_Level'];

function collectFormData() {
  var data = {};
  // Text/number/url/date inputs and textareas
  document.querySelectorAll('#useCaseForm input[type="text"], #useCaseForm input[type="email"], #useCaseForm input[type="number"], #useCaseForm input[type="url"], #useCaseForm input[type="date"], #useCaseForm textarea, #useCaseForm select').forEach(function (el) {
    if (el.id && el.id.startsWith('f_')) {
      data[el.id.substring(2)] = el.value;
    }
  });
  // Checkbox groups → arrays
  CHECKBOX_FIELDS.forEach(function (suffix) {
    var group = document.getElementById('f_' + suffix);
    if (group) {
      data[suffix] = Array.from(group.querySelectorAll('input[type="checkbox"]:checked'))
                          .map(function (cb) { return cb.value; });
    }
  });
  if (editMode && editId) data.UseCase_ID = editId;
  return data;
}

function populateForm(data) {
  // Standard fields
  Object.keys(data).forEach(function (key) {
    var el = document.getElementById('f_' + key);
    if (!el) return;
    if (el.type === 'checkbox' || el.type === 'radio') return;
    el.value = data[key] != null ? data[key] : '';
  });

  // Checkbox groups (values may come as comma-separated string or array)
  CHECKBOX_FIELDS.forEach(function (suffix) {
    var group = document.getElementById('f_' + suffix);
    if (!group || !data[suffix]) return;
    var vals = Array.isArray(data[suffix])
      ? data[suffix]
      : String(data[suffix]).split(',').map(function (s) { return s.trim(); });
    group.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.checked = vals.indexOf(cb.value) > -1;
    });
  });

  // Demo status radio
  var demoVal = data.Demo_Status || 'Chưa';
  document.getElementsByName('demoStatus').forEach(function (r) {
    r.checked = (r.value === demoVal);
  });
  var demoHidden = document.getElementById('f_Demo_Status');
  if (demoHidden) demoHidden.value = demoVal;
}

// Sync hidden Demo_Status from radio clicks
document.addEventListener('change', function (e) {
  if (e.target.name === 'demoStatus') {
    var hidden = document.getElementById('f_Demo_Status');
    if (hidden) hidden.value = e.target.value;
  }
});

// ============================================================
//  DUPLICATE CHECK (triggered on blur of name field)
// ============================================================
function checkDuplicates() {
  var name = document.getElementById('f_UseCase_Name').value.trim();
  var warningDiv = document.getElementById('duplicate-warning');
  var dupList    = document.getElementById('dup-list');
  if (!name || name.length < 3) {
    if (warningDiv) warningDiv.style.display = 'none';
    return;
  }
  google.script.run
    .withSuccessHandler(function (dups) {
      if (dups && dups.length > 0) {
        dupList.innerHTML = '';
        dups.forEach(function (d) {
          var li   = document.createElement('li');
          li.textContent = d.name + ' (' + Math.round(d.similarity * 100) + '% tương đồng — ' + d.id + ')';
          dupList.appendChild(li);
        });
        warningDiv.style.display = 'block';
      } else {
        warningDiv.style.display = 'none';
      }
    })
    .withFailureHandler(function () { /* silent */ })
    .checkDuplicate(name, editId || '');
}

// ============================================================
//  SUBMIT / SAVE DRAFT
// ============================================================
function submitForm(statusAction) {
  var data = collectFormData();
  var mode = editMode ? 'edit' : 'create';

  if (statusAction === 'Submitted') {
    // Validate all required steps first
    for (var s = 1; s <= 2; s++) {
      if (!validateStep(s)) { currentStep = s; updateStepVisibility(); return; }
    }
    data.Status      = 'Submitted';
    data.Submit_Date = new Date().toISOString();
  } else if (statusAction === 'adminUpdate') {
    // Admin can update without full validation
  } else {
    // Draft
    data.Status = 'Draft';
  }

  showLoading(true, statusAction === 'Submitted' ? 'Đang gửi...' : 'Đang lưu...');

  google.script.run
    .withSuccessHandler(function (result) {
      showLoading(false);
      if (result && result.success) {
        if (statusAction === 'Submitted') {
          showToast('🎉 Đã gửi thành công! ID: ' + result.id, 'success');
          localStorage.removeItem('aiusecase_draft');
          setTimeout(function () { resetForm(); navigate('new'); }, 1200);
        } else if (statusAction === 'Draft') {
          showToast('💾 Đã lưu nháp!', 'success');
          localStorage.removeItem('aiusecase_draft');
          if (!editMode) {
            editMode = true;
            editId   = result.id;
            updateEditBanner();
          }
        } else {
          showToast('✅ Đã cập nhật!', 'success');
        }
      } else {
        showToast('Lỗi: ' + (result && result.error ? result.error : 'Không xác định'), 'error');
      }
    })
    .withFailureHandler(function (err) {
      showLoading(false);
      showToast('Lỗi kết nối: ' + (err.message || err), 'error');
    })
    .submitUseCase(data, mode);
}

function saveDraft() {
  submitForm('Draft');
}

// ============================================================
//  EDIT MODE
// ============================================================
function updateEditBanner() {
  var banner = document.getElementById('edit-banner');
  var idDisp = document.getElementById('edit-id-display');
  if (banner) banner.style.display = 'flex';
  if (idDisp) idDisp.textContent   = editId || '—';
  // Update page title
  var titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = 'Chỉnh sửa Use Case';
}

function resetForm() {
  document.getElementById('useCaseForm').reset();
  editMode    = false;
  editId      = null;
  currentStep = 1;
  var banner  = document.getElementById('edit-banner');
  if (banner) banner.style.display = 'none';
  // Reset page title
  var titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = 'Đăng ký Use Case mới';
  // Hide admin steps for non-admin
  document.querySelectorAll('.admin-step').forEach(function (el) {
    el.style.display = isAdminUser ? '' : 'none';
  });
  updateStepVisibility();
}

// ============================================================
//  VIEW NAVIGATION
// ============================================================
var VIEW_CONFIG = {
  'new':       { viewId: 'view-wizard',    navId: 'nav-new',       title: 'Đăng ký mới' },
  'dashboard': { viewId: 'view-dashboard', navId: 'nav-dashboard', title: 'Dashboard' },
  'admin':     { viewId: 'view-admin',     navId: 'nav-admin',     title: 'Quản lý Use Cases' }
};

function navigate(view) {
  var cfg = VIEW_CONFIG[view];
  if (!cfg) return;
  if (view === 'admin' && !isAdminUser) return;

  // Hide all views and deactivate nav buttons
  document.querySelectorAll('.view').forEach(function (v) {
    v.style.display = 'none';
    v.classList.remove('active');
  });
  document.querySelectorAll('.btn-nav').forEach(function (b) { b.classList.remove('active'); });

  // Show target view
  var viewEl = document.getElementById(cfg.viewId);
  if (viewEl) { viewEl.style.display = ''; viewEl.classList.add('active'); }
  var navEl  = document.getElementById(cfg.navId);
  if (navEl)  navEl.classList.add('active');

  // Page title
  var titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = cfg.title;

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');

  // View-specific actions
  if (view === 'new' && !editMode) {
    resetForm();
  }
  if (view === 'dashboard') {
    loadDashboard();
  }
  if (view === 'admin') {
    renderAdminList();
  }
}

// ============================================================
//  DASHBOARD
// ============================================================
function loadDashboard() {
  document.getElementById('dashboard-metrics').innerHTML =
    '<div style="grid-column:1/-1;display:flex;justify-content:center;padding:32px"><div class="spinner"></div></div>';

  google.script.run
    .withSuccessHandler(function (m) {
      if (!m) { document.getElementById('dashboard-metrics').innerHTML = '<p>Không có dữ liệu.</p>'; return; }
      var cards = [
        { icon: '📋', value: m.total,                label: 'Tổng Use Cases' },
        { icon: '⏱',  value: m.totalHoursSaved,      label: 'Giờ tiết kiệm / tháng' },
        { icon: '✅',  value: m.approvedCount,         label: 'Đã duyệt' },
        { icon: '♻️', value: m.reuseRate + '%',        label: 'Tỉ lệ tái sử dụng' },
        { icon: '🎤',  value: m.aiDayCount,            label: 'AI Day tham gia' }
      ];
      var html = '';
      cards.forEach(function (c) {
        html += '<div class="metric-card">'
              + '<span class="metric-icon">' + c.icon + '</span>'
              + '<div class="metric-value">' + (c.value != null ? c.value : '—') + '</div>'
              + '<div class="metric-label">' + c.label + '</div>'
              + '</div>';
      });

      // Team breakdown
      if (m.byTeam && Object.keys(m.byTeam).length > 0) {
        html += '<div class="metric-card" style="grid-column:1/-1">'
              + '<div class="metric-label" style="margin-bottom:12px">📊 Phân bố theo Team</div>'
              + '<div style="display:flex;flex-wrap:wrap;gap:8px">';
        Object.keys(m.byTeam).sort().forEach(function (team) {
          html += '<span style="background:var(--blue-soft);color:var(--blue);padding:4px 12px;border-radius:20px;font-size:.8rem;font-weight:600">'
                + team + ' (' + m.byTeam[team] + ')</span>';
        });
        html += '</div></div>';
      }
      // Stage breakdown
      if (m.stageCount && Object.keys(m.stageCount).length > 0) {
        html += '<div class="metric-card" style="grid-column:1/-1">'
              + '<div class="metric-label" style="margin-bottom:12px">🔄 Phân bố theo Stage</div>'
              + '<div style="display:flex;flex-wrap:wrap;gap:8px">';
        Object.keys(m.stageCount).sort().forEach(function (stage) {
          html += '<span style="background:var(--surface-3);color:var(--ink-2);padding:4px 12px;border-radius:20px;font-size:.8rem;font-weight:600">'
                + stage + ' (' + m.stageCount[stage] + ')</span>';
        });
        html += '</div></div>';
      }

      document.getElementById('dashboard-metrics').innerHTML = html;
    })
    .withFailureHandler(function (err) {
      document.getElementById('dashboard-metrics').innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Lỗi tải dashboard</div><div class="empty-state-desc">' + (err.message || err) + '</div></div>';
    })
    .getDashboardMetrics();
}

// ============================================================
//  ADMIN LIST
// ============================================================
var _cachedCases = null;

function renderAdminList() {
  var search = (document.getElementById('adminSearch') ? document.getElementById('adminSearch').value : '').toLowerCase().trim();

  function render(cases) {
    _cachedCases = cases;
    document.getElementById('admin-count').textContent = cases.length;
    var filtered = cases.filter(function (c) {
      if (!search) return true;
      return (c.UseCase_Name || '').toLowerCase().indexOf(search) > -1
          || (c.UseCase_ID   || '').toLowerCase().indexOf(search) > -1
          || (c.Team         || '').toLowerCase().indexOf(search) > -1;
    });
    if (!filtered.length) {
      document.getElementById('admin-list').innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">🔍</div>'
        + '<div class="empty-state-title">Không tìm thấy kết quả</div>'
        + '<div class="empty-state-desc">Thử từ khóa khác</div></div>';
      return;
    }
    var html = '<table class="data-table"><thead><tr>'
             + '<th>ID</th><th>Tên Use Case</th><th>Team</th><th>Status</th><th style="width:80px"></th>'
             + '</tr></thead><tbody>';
    filtered.forEach(function (c) {
      var statusCls = 'status-' + (c.Status || 'draft').toLowerCase();
      // Build edit URL that works both with query param and hash
      var editHref = '?edit=' + encodeURIComponent(c.UseCase_ID);
      html += '<tr>'
            + '<td><span class="id-cell">' + (c.UseCase_ID || '') + '</span></td>'
            + '<td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (c.UseCase_Name || '') + '</td>'
            + '<td>' + (c.Team || '') + '</td>'
            + '<td><span class="status-badge ' + statusCls + '">' + (c.Status || '—') + '</span></td>'
            + '<td><a href="' + editHref + '" class="btn btn-outline btn-sm">Sửa</a></td>'
            + '</tr>';
    });
    html += '</tbody></table>';
    document.getElementById('admin-list').innerHTML = html;
  }

  // Use cache for search filtering (no extra server call)
  if (_cachedCases && search) { render(_cachedCases); return; }

  showLoading(true, 'Đang tải danh sách...');
  google.script.run
    .withSuccessHandler(function (cases) {
      showLoading(false);
      render(cases || []);
    })
    .withFailureHandler(function (err) {
      showLoading(false);
      showToast('Lỗi tải danh sách: ' + (err.message || err), 'error');
    })
    .getAllUseCases();
}

// ============================================================
//  UTILITIES
// ============================================================
var toastTimer = null;

function showToast(msg, type) {
  var toast    = document.getElementById('toast');
  var msgEl    = document.getElementById('toastMsg');
  var iconEl   = document.getElementById('toastIcon');
  var icons    = { success: '✓', error: '✕', warning: '⚠' };
  if (msgEl)  msgEl.textContent  = msg;
  if (iconEl) iconEl.textContent = icons[type] || 'ℹ';
  toast.className = 'toast ' + (type || '') + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 3500);
}

function showLoading(show, text) {
  var overlay = document.getElementById('loading');
  var textEl  = document.getElementById('loadingText');
  if (!overlay) return;
  overlay.style.display = show ? 'flex' : 'none';
  if (text && textEl) textEl.textContent = text;
}

function toggleCollapse(header) {
  header.parentElement.classList.toggle('open');
}

function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

// Close sidebar on outside click (mobile)
document.addEventListener('click', function (e) {
  var sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  var mobileBtn = document.querySelector('.mobile-menu-btn');
  if (sidebar.classList.contains('open')
      && !sidebar.contains(e.target)
      && (!mobileBtn || !mobileBtn.contains(e.target))) {
    sidebar.classList.remove('open');
  }
});
