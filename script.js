/* =====================================================
   AI USE CASE MANAGER - STATIC WEB VERSION
===================================================== */

let currentStep = 1;
let totalSteps = 5;

let lookupData = {};
let isAdminUser = true;

let currentEditId = null;

/* =====================================================
   MOCK API LAYER
===================================================== */

const API = {

  async getLookupData() {

    return {

      TEAM: [
        'BA',
        'CA',
        'PM',
        'Product',
        'IT',
        'Risk'
      ],

      GOAL: [
        'Giảm thời gian xử lý',
        'Chuẩn hóa output',
        'Giảm lỗi nghiệp vụ',
        'Tăng năng suất',
        'Tăng tốc review'
      ],

      INPUT_TYPE: [
        'Email',
        'Excel',
        'BRD',
        'FRD',
        'User Story',
        'Policy',
        'PDF'
      ],

      REUSE: [
        'Cá nhân',
        'Trong team',
        'Toàn trung tâm'
      ],

      STATUS: [
        'Draft',
        'Submitted',
        'Reviewing',
        'Approved'
      ],

      STAGE: [
        'S1 - Idea',
        'S2 - Pilot',
        'S3 - Standardized'
      ]
    };
  },

  async getUserEmail() {
    return 'demo.user@company.com';
  },

  async isAdmin() {
    return true;
  },

  async checkDuplicate(name, excludeId = '') {

    const data =
      JSON.parse(
        localStorage.getItem('usecases') || '[]'
      );

    return data.filter(
      x =>
        x.UseCaseName &&
        x.UseCaseName.toLowerCase() === name.toLowerCase() &&
        x.UseCase_ID !== excludeId
    );
  },

  async submitUseCase(data, mode = 'create') {

    let usecases =
      JSON.parse(
        localStorage.getItem('usecases') || '[]'
      );

    if (!data.UseCase_ID) {

      data.UseCase_ID =
        'AIUS-' +
        String(usecases.length + 1)
          .padStart(4, '0');
    }

    data.updatedAt =
      new Date().toISOString();

    if (mode === 'edit') {

      usecases =
        usecases.map(x =>
          x.UseCase_ID === data.UseCase_ID
            ? data
            : x
        );

    } else {

      usecases.push(data);
    }

    localStorage.setItem(
      'usecases',
      JSON.stringify(usecases)
    );

    return {
      success: true,
      id: data.UseCase_ID
    };
  },

  async getAllUseCases() {

    return JSON.parse(
      localStorage.getItem('usecases') || '[]'
    );
  },

  async getDashboardMetrics() {

    const data =
      JSON.parse(
        localStorage.getItem('usecases') || '[]'
      );

    return {

      total: data.length,

      approvedCount:
        data.filter(
          x => x.Status === 'Approved'
        ).length,

      totalHoursSaved: 120,

      reuseRate: 68,

      aiDayCount: 12,

      byTeam: {},

      stageCount: {}
    };
  }
};

/* =====================================================
   INIT
===================================================== */

document.addEventListener(
  'DOMContentLoaded',
  async function () {

    try {

      showLoading(true);

      lookupData =
        await API.getLookupData();

      populateDropdowns();

      renderProgressSteps();

      updateStepVisibility();

      renderDashboard();

      loadAdminTable();

      checkAutosave();

      showToast(
        'Static web initialized',
        'success'
      );

    } catch (err) {

      console.error(err);

      showToast(
        'Init failed',
        'error'
      );
    }

    showLoading(false);
});

/* =====================================================
   NAVIGATION
===================================================== */

function navigate(viewName) {

  document
    .querySelectorAll('.view')
    .forEach(v =>
      v.classList.remove('active')
    );

  const target =
    document.getElementById(
      `${viewName}-view`
    );

  if (target) {
    target.classList.add('active');
  }

  document
    .querySelectorAll('.btn-nav')
    .forEach(btn =>
      btn.classList.remove('active')
    );
}

function toggleSidebar() {

  const sidebar =
    document.querySelector('.sidebar');

  sidebar.classList.toggle('open');
}

/* =====================================================
   STEP WIZARD
===================================================== */

function nextStep() {

  if (currentStep < totalSteps) {

    currentStep++;

    renderProgressSteps();

    updateStepVisibility();
  }
}

function prevStep() {

  if (currentStep > 1) {

    currentStep--;

    renderProgressSteps();

    updateStepVisibility();
  }
}

function updateStepVisibility() {

  document
    .querySelectorAll('.step-content')
    .forEach(el =>
      el.style.display = 'none'
    );

  const current =
    document.getElementById(
      `step-${currentStep}`
    );

  if (current) {
    current.style.display = 'block';
  }
}

function renderProgressSteps() {

  const fill =
    document.querySelector('.progress-fill');

  if (fill) {

    fill.style.width =
      ((currentStep - 1) / (totalSteps - 1)) * 100 + '%';
  }
}

/* =====================================================
   FORM
===================================================== */

function getFormData() {

  const form =
    document.querySelector('form');

  if (!form) return {};

  const formData =
    new FormData(form);

  const data = {};

  formData.forEach((v, k) => {
    data[k] = v;
  });

  return data;
}

async function submitForm(mode = 'create') {

  try {

    showLoading(true);

    const data =
      getFormData();

    const result =
      await API.submitUseCase(
        data,
        mode
      );

    showToast(
      `Saved ${result.id}`,
      'success'
    );

    renderDashboard();

    loadAdminTable();

  } catch (err) {

    console.error(err);

    showToast(
      'Save failed',
      'error'
    );
  }

  showLoading(false);
}

/* =====================================================
   DASHBOARD
===================================================== */

async function renderDashboard() {

  const metrics =
    await API.getDashboardMetrics();

  setMetric(
    'metric-total',
    metrics.total
  );

  setMetric(
    'metric-approved',
    metrics.approvedCount
  );

  setMetric(
    'metric-hours',
    metrics.totalHoursSaved
  );
}

function setMetric(id, value) {

  const el =
    document.getElementById(id);

  if (el) {
    el.innerText = value;
  }
}

/* =====================================================
   ADMIN TABLE
===================================================== */

async function loadAdminTable() {

  const data =
    await API.getAllUseCases();

  const tbody =
    document.getElementById(
      'admin-table-body'
    );

  if (!tbody) return;

  tbody.innerHTML = '';

  data.forEach(item => {

    const tr =
      document.createElement('tr');

    tr.innerHTML = `
      <td>${item.UseCase_ID || ''}</td>
      <td>${item.UseCaseName || ''}</td>
      <td>${item.Status || 'Draft'}</td>
      <td>
        <button
          class="btn btn-sm btn-primary"
          onclick="editUseCase('${item.UseCase_ID}')"
        >
          Edit
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function editUseCase(id) {

  const data =
    await API.getAllUseCases();

  const found =
    data.find(
      x => x.UseCase_ID === id
    );

  if (!found) return;

  currentEditId = id;

  Object.keys(found)
    .forEach(key => {

      const field =
        document.querySelector(
          `[name="${key}"]`
        );

      if (field) {
        field.value = found[key];
      }
    });

  navigate('new');

  showToast(
    `Editing ${id}`,
    'warning'
  );
}

/* =====================================================
   AUTOSAVE
===================================================== */

function autosave() {

  const data =
    getFormData();

  localStorage.setItem(
    'autosave',
    JSON.stringify(data)
  );
}

function checkAutosave() {

  const saved =
    localStorage.getItem('autosave');

  if (!saved) return;

  const data =
    JSON.parse(saved);

  Object.keys(data)
    .forEach(key => {

      const field =
        document.querySelector(
          `[name="${key}"]`
        );

      if (field) {
        field.value = data[key];
      }
    });
}

setInterval(
  autosave,
  5000
);

/* =====================================================
   DROPDOWNS
===================================================== */

function populateDropdowns() {

  document
    .querySelectorAll(
      '[data-options]'
    )
    .forEach(select => {

      const key =
        select.dataset.options;

      const values =
        lookupData[key] || [];

      select.innerHTML =
        '<option value="">Select</option>';

      values.forEach(v => {

        const option =
          document.createElement('option');

        option.value = v;
        option.textContent = v;

        select.appendChild(option);
      });
    });
}

/* =====================================================
   UI HELPERS
===================================================== */

function showToast(
  message,
  type = 'success'
) {

  const toast =
    document.createElement('div');

  toast.className =
    `toast ${type}`;

  toast.innerHTML = `
    <div class="toast-icon">✓</div>
    <div>${message}</div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 50);

  setTimeout(() => {

    toast.classList.remove('show');

    setTimeout(() => {
      toast.remove();
    }, 300);

  }, 3000);
}

function showLoading(show) {

  let overlay =
    document.querySelector(
      '.loading-overlay'
    );

  if (show) {

    if (!overlay) {

      overlay =
        document.createElement('div');

      overlay.className =
        'loading-overlay';

      overlay.innerHTML = `
        <div class="spinner"></div>
        <div class="loading-text">
          Loading...
        </div>
      `;

      document.body.appendChild(
        overlay
      );
    }

  } else {

    if (overlay) {
      overlay.remove();
    }
  }
}
