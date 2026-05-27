const FormMapper = {
  // Collect all form fields into object
  collectData() {
    const form = document.getElementById('useCaseForm');
    const elements = form.querySelectorAll('input, select, textarea');
    const data = {};
    elements.forEach(el => {
      if (el.name) {
        if (el.type === 'checkbox') {
          // handle multi checkbox: name ends with []
          if (el.checked) {
            if (!data[el.name]) data[el.name] = [];
            data[el.name].push(el.value);
          }
        } else {
          data[el.name] = el.value;
        }
      }
    });
    // Convert arrays to comma-separated string for backend
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) data[key] = data[key].join(', ');
    });
    return data;
  },

  // Populate form from object (edit mode)
  populateData(data) {
    const form = document.getElementById('useCaseForm');
    Object.keys(data).forEach(key => {
      const el = form.querySelector(`[name="${key}"]`);
      if (!el) return;
      if (el.type === 'checkbox') {
        // handle multi checkbox
        const values = String(data[key] || '').split(',').map(v => v.trim());
        const checkboxes = form.querySelectorAll(`input[name="${key}"][type="checkbox"]`);
        checkboxes.forEach(cb => { cb.checked = values.includes(cb.value); });
      } else {
        el.value = data[key] || '';
      }
    });
  }
};
