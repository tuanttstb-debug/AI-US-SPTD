/* ==========================================
   AI USE CASE MANAGER — STATIC VERSION
   Apps Script → Static Web Migration
========================================== */

let currentView = 'new';
let currentStep = 1;
let isAdminUser = true;
let lookupData = {};

const STORAGE_KEY = 'ai_usecases';
const DRAFT_KEY = 'ai_usecase_draft';

/* ==========================================
   MOCK API
========================================== */

const API = {

  async getLookupData() {
    return {
      TEAM: [
        'BA',
        'CA',
        'PM',
        'Product',
        'Data',
        'Operation'
      ],

      STATUS: [
        'Draft',
        'Submitted',
        'Reviewing',
        'Approved',
        'Rework',
        'Archived'
      ]
    };
  },

  async getUserEmail() {
    return 'guest@company.com';
  },

  async isAdmin() {
    return true;
  },

  async getAllUseCases() {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );
  },

  async submitUseCase(data) {

    const list =
      await this.getAllUseCases();

    const index = list.length + 1;

    data.UseCase_ID =
      'AIUS-' +
      String(index).padStart(4, '0');

    data.createdAt =
      new Date().toISOString();

    list.push(data);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(list)
    );

    localStorage.removeItem(
      DRAFT_KEY
    );

    return {
      success: true,
      id: data.UseCase_ID
    };
  },

  async getDashboardMetrics() {

    const list =
      await this.getAllUseCases();

    return {
      total: list.length,

      approvedCount:
        list.filter(
          x => x.status === 'Approved'
        ).length,

      draftCount:
        list.filter(
          x => x.status === 'Draft'
        ).length,

      reviewingCount:
        list.filter(
          x => x.status === 'Reviewing'
        ).length
    };
  }
};

/* ==========================================
   INIT
========================================== */

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    showLoading(true);

    lookupData =
      await API.getLookupData();

    const email =
      await API.getUserEmail();

    isAdminUser =
      await API.isAdmin();

    document.getElementById(
      'user-email'
    ).textContent = email;

    populateDropdowns();

    loadDraft();

    renderDashboard();

    renderAdminTable();

    showLoading(false);
  }
);

/* ==========================================
   NAVIGATION
========================================== */

function navigate(view) {

  currentView = view;

  document
    .querySelectorAll('.view')
    .forEach(el => {
      el.classList.remove('active');
    });

  const target =
    document.getElementById(
      `view-${view}`
    );

  if (target) {
    target.classList.add('active');
  }

  document
    .querySelectorAll('.btn-nav')
    .forEach(btn => {

      btn.classList.remove('active');

      if (
        btn.dataset.view === view
      ) {
        btn.classList.add(
          'active'
        );
      }
    });

  if (view === 'dashboard') {
    renderDashboard();
  }

  if (view === 'admin') {
    renderAdminTable();
  }
}

/* ==========================================
   SIDEBAR
========================================== */

function toggleSidebar() {

  document
    .getElementById('sidebar')
    .classList.toggle('open');
}

/* ==========================================
   FORM
========================================== */

function populateDropdowns() {

  const team =
    document.getElementById(
      'team'
    );

  const status =
    document.getElementById(
      'status'
    );

  lookupData.TEAM.forEach(x => {

    const option =
      document.createElement(
        'option'
      );

    option.value = x;
    option.textContent = x;

    team.appendChild(option);
  });

  lookupData.STATUS.forEach(x => {

    const option =
      document.createElement(
        'option'
      );

    option.value = x;
    option.textContent = x;

    status.appendChild(option);
  });
}

function getFormData() {

  return {
    usecaseName:
      document.getElementById(
        'usecaseName'
      ).value,

    team:
      document.getElementById(
        'team'
      ).value,

    status:
      document.getElementById(
        'status'
      ).value,

    businessProblem:
      document.getElementById(
        'businessProblem'
      ).value,

    prompt:
      document.getElementById(
        'prompt'
      ).value
  };
}

function fillForm(data) {

  if (!data) return;

  document.getElementById(
    'usecaseName'
  ).value =
    data.usecaseName || '';

  document.getElementById(
    'team'
  ).value =
    data.team || '';

  document.getElementById(
    'status'
  ).value =
    data.status || '';

  document.getElementById(
    'businessProblem'
  ).value =
    data.businessProblem || '';

  document.getElementById(
    'prompt'
  ).value =
    data.prompt || '';
}

/* ==========================================
   DRAFT
========================================== */

function saveDraft() {

  const data =
    getFormData();

  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify(data)
  );

  showToast(
    'Draft saved',
    'success'
  );
}

function loadDraft() {

  const draft =
    localStorage.getItem(
      DRAFT_KEY
    );

  if (!draft) return;

  fillForm(
    JSON.parse(draft)
  );
}

/* ==========================================
   SUBMIT
========================================== */

async function submitUseCase() {

  const data =
    getFormData();

  if (
    !data.usecaseName
  ) {
    showToast(
      'Use case name is required',
      'error'
    );

    return;
  }

  showLoading(true);

  const result =
    await API.submitUseCase(
      data
    );

  showLoading(false);

  if (result.success) {

    document
      .getElementById(
        'usecase-form'
      )
      .reset();

    renderDashboard();
    renderAdminTable();

    showToast(
      `Submitted ${result.id}`,
      'success'
    );
  }
}

/* ==========================================
   DASHBOARD
========================================== */

async function renderDashboard() {

  const metrics =
    await API
      .getDashboardMetrics();

  const grid =
    document.getElementById(
      'metrics-grid'
    );

  if (!grid) return;

  grid.innerHTML = `
    <div class="metric-card">
      <div class="metric-value">
        ${metrics.total}
      </div>
      <div class="metric-label">
        Total
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-value">
        ${metrics.approvedCount}
      </div>
      <div class="metric-label">
        Approved
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-value">
        ${metrics.reviewingCount}
      </div>
      <div class="metric-label">
        Reviewing
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-value">
        ${metrics.draftCount}
      </div>
      <div class="metric-label">
        Draft
      </div>
    </div>
  `;
}

/* ==========================================
   ADMIN TABLE
========================================== */

async function renderAdminTable() {

  const list =
    await API.getAllUseCases();

  const tbody =
    document.getElementById(
      'admin-table-body'
    );

  if (!tbody) return;

  tbody.innerHTML = '';

  list.forEach(item => {

    tbody.innerHTML += `
      <tr>
        <td>
          ${item.UseCase_ID}
        </td>

        <td>
          ${item.usecaseName}
        </td>

        <td>
          ${item.team}
        </td>

        <td>
          ${item.status}
        </td>

        <td>
          <button
            class="btn btn-sm btn-danger"
            onclick="deleteUseCase('${item.UseCase_ID}')"
          >
            Delete
          </button>
        </td>
      </tr>
    `;
  });
}

async function deleteUseCase(id) {

  const list =
    await API.getAllUseCases();

  const filtered =
    list.filter(
      x => x.UseCase_ID !== id
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(filtered)
  );

  renderDashboard();
  renderAdminTable();

  showToast(
    'Deleted',
    'warning'
  );
}

function searchUseCases(keyword) {

  keyword =
    keyword.toLowerCase();

  const rows =
    document.querySelectorAll(
      '#admin-table-body tr'
    );

  rows.forEach(row => {

    row.style.display =
      row.innerText
        .toLowerCase()
        .includes(keyword)
      ? ''
      : 'none';
  });
}

/* ==========================================
   STEP
========================================== */

function nextStep() {

  currentStep++;

  if (currentStep > 4) {
    currentStep = 4;
  }

  updateProgress();
}

function prevStep() {

  currentStep--;

  if (currentStep < 1) {
    currentStep = 1;
  }

  updateProgress();
}

function updateProgress() {

  const width =
    currentStep * 25;

  const el =
    document.getElementById(
      'progress-fill'
    );

  if (el) {
    el.style.width =
      `${width}%`;
  }
}

/* ==========================================
   UI
========================================== */

function showLoading(show) {

  const el =
    document.getElementById(
      'loading'
    );

  if (!el) return;

  el.style.display =
    show
      ? 'flex'
      : 'none';
}

function showToast(
  message,
  type = 'success'
) {

  const toast =
    document.getElementById(
      'toast'
    );

  const text =
    document.getElementById(
      'toast-message'
    );

  toast.className =
    `toast ${type}`;

  text.textContent =
    message;

  toast.classList.add(
    'show'
  );

  setTimeout(() => {

    toast.classList.remove(
      'show'
    );

  }, 2500);
}
