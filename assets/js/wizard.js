const Wizard = {
  currentStep: 1,
  totalSteps: STEPS.length,
  isEditMode: false,

  init() {
    this.renderIndicators();
    this.renderSteps();
    this.updateNav();
    this.bindEvents();
  },

  renderIndicators() {
    const container = document.getElementById('stepIndicators');
    container.innerHTML = STEPS.map(s => 
      `<span class="step-dot" data-step="${s.id}">${s.id}</span>`
    ).join('');
  },

  renderSteps() {
    const form = document.getElementById('useCaseForm');
    const html = STEPS.map((step, idx) => {
      return `<div class="step" data-step="${step.id}" style="display:${idx===0?'block':'none'}">
        <h2>${step.title}</h2>
        <div class="form-fields" id="fields-${step.id}"></div>
      </div>`;
    }).join('');
    form.innerHTML = html;
    // Inject fields (will be done by FieldBuilder)
    FieldBuilder.buildAll();
  },

  goTo(step) {
    if (step < 1 || step > this.totalSteps) return;
    document.querySelectorAll('.step').forEach(el => el.style.display = 'none');
    document.querySelector(`.step[data-step="${step}"]`).style.display = 'block';
    this.currentStep = step;
    this.updateNav();
    this.updateProgress();
  },

  next() {
    if (this.currentStep < this.totalSteps) this.goTo(this.currentStep + 1);
  },
  prev() {
    if (this.currentStep > 1) this.goTo(this.currentStep - 1);
  },

  updateNav() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    prevBtn.disabled = this.currentStep === 1;
    if (this.currentStep === this.totalSteps) {
      nextBtn.style.display = 'none';
      submitBtn.style.display = 'inline-block';
    } else {
      nextBtn.style.display = 'inline-block';
      submitBtn.style.display = 'none';
    }
  },

  updateProgress() {
    const percent = (this.currentStep / this.totalSteps) * 100;
    document.getElementById('progressBar').style.width = percent + '%';
    document.querySelectorAll('.step-dot').forEach(d => {
      d.classList.toggle('active', parseInt(d.dataset.step) === this.currentStep);
      d.classList.toggle('done', parseInt(d.dataset.step) < this.currentStep);
    });
  },

  bindEvents() {
    document.getElementById('prevBtn').addEventListener('click', () => this.prev());
    document.getElementById('nextBtn').addEventListener('click', () => {
      // Validate current step before proceeding
      const data = FormMapper.collectData();
      let errors = [];
      if (this.currentStep === 1) errors = Validator.step1(data);
      else if (this.currentStep === 2) errors = Validator.step2(data);
      if (errors.length) {
        Toast.show(errors.join('<br>'), 'error');
        return;
      }
      this.next();
    });
    // Submit is handled by app.js
  }
};

const FieldBuilder = {
  buildAll() {
    STEPS.forEach(step => {
      const container = document.getElementById(`fields-${step.id}`);
      if (!container) return;
      step.fields.forEach(field => {
        container.appendChild(this.createField(field));
      });
    });
    // Special: add duplicate check listener on UseCase_Name
    const nameInput = document.querySelector(`[name="${FIELDS.USE_CASE_NAME}"]`);
    if (nameInput) {
      nameInput.addEventListener('blur', debounce(() => {
        const pain = document.querySelector(`[name="${FIELDS.PAIN_POINT}"]`)?.value || '';
        DuplicateChecker.check(nameInput.value, pain);
      }, 600));
    }
  },

  createField(name) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';
    const labelMap = {
      [FIELDS.USE_CASE_NAME]: 'Tên Use Case *',
      [FIELDS.OWNER_NAME]: 'Chủ sở hữu *',
      [FIELDS.OWNER_EMAIL]: 'Email *',
      [FIELDS.TEAM]: 'Team *',
      [FIELDS.BUSINESS_CATEGORY]: 'Business Category *',
      // ... extend as needed
    };
    const labelText = labelMap[name] || name.replace(/_/g, ' ');
    const label = document.createElement('label');
    label.textContent = labelText;
    wrapper.appendChild(label);

    // Determine input type based on field name
    if (name === FIELDS.USER_TYPE || name === FIELDS.INPUT_TYPES || name === FIELDS.EXPECTED_GOALS || name === FIELDS.REUSE_LEVEL) {
      // Multi checkbox
      const options = this.getOptions(name);
      const checkboxGroup = document.createElement('div');
      checkboxGroup.className = 'checkbox-group';
      options.forEach(opt => {
        const cbLabel = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.name = name;
        cb.value = opt;
        cbLabel.appendChild(cb);
        cbLabel.appendChild(document.createTextNode(' ' + opt));
        checkboxGroup.appendChild(cbLabel);
      });
      wrapper.appendChild(checkboxGroup);
    } else if (name === FIELDS.EXPECTED_GOALS) {
      // also multi-select, we already handled as checkbox group for simplicity
    } else if (name.includes('Time_Min') || name === FIELDS.CURRENT_TIME_MIN || name === FIELDS.BEFORE_TIME_MIN || name === FIELDS.AFTER_TIME_MIN) {
      const input = document.createElement('input');
      input.type = 'number';
      input.name = name;
      input.placeholder = 'Nhập số phút';
      wrapper.appendChild(input);
    } else if (name === FIELDS.DEMO_STATUS) {
      const select = document.createElement('select');
      select.name = name;
      ['Chưa có', 'Đã có demo', 'Đã triển khai'].forEach(v => {
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = v;
        select.appendChild(opt);
      });
      wrapper.appendChild(select);
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = name;
      wrapper.appendChild(input);
    }
    return wrapper;
  },

  getOptions(field) {
    // Return options based on lookup data stored in window.__LOOKUP after loading
    const lookup = window.__LOOKUP || {};
    if (field === FIELDS.USER_TYPE) return lookup.User_Type || ['Cá nhân', 'Team', 'TT SPTD'];
    if (field === FIELDS.INPUT_TYPES) return lookup.Input_Types || ['Email', 'TLPT/BRD/FRD', 'Excel', 'Policy', 'Nội dung họp', 'Khác'];
    if (field === FIELDS.EXPECTED_GOALS) return lookup.Expected_Goals || ['Giảm thời gian', 'Chuẩn hóa output', 'Giảm lỗi', 'Tăng tốc review', 'Tăng năng suất'];
    if (field === FIELDS.REUSE_LEVEL) return lookup.Reuse_Level || ['Cá nhân', 'Team khác', 'Toàn TT SPTD'];
    return [];
  }
};
