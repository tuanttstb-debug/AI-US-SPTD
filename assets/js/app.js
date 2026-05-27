(function() {
  let currentRecordId = null; // for edit mode

  async function init() {
    showLoading(true);
    try {
      // Load lookup data
      const lookup = await Api.getLookup();
      window.__LOOKUP = lookup;
      // Determine if edit mode
      const params = new URLSearchParams(window.location.search);
      if (params.has('edit')) {
        currentRecordId = params.get('edit');
        const data = await Api.getUseCase(currentRecordId);
        Wizard.isEditMode = true;
        // Override some fields not in form? The form covers visible fields.
        FormMapper.populateData(data);
        // Set Status appropriately
      } else {
        // Try loading draft from storage
        const draft = Storage.load();
        if (draft) {
          if (confirm('Bạn có bản nháp lưu trước đó. Bạn muốn tiếp tục?')) {
            FormMapper.populateData(draft);
          } else {
            Storage.clear();
          }
        }
      }
      Wizard.init();
      // Autosave on field change
      document.getElementById('useCaseForm').addEventListener('change', () => {
        const data = FormMapper.collectData();
        Storage.save(data);
      });
      // Submit button
      document.getElementById('submitBtn').addEventListener('click', submitForm);
      // Duplicate check already bound in wizard
    } catch (err) {
      Toast.show('Lỗi khởi tạo: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async function submitForm() {
    const data = FormMapper.collectData();
    // Final validation
    const errors = Validator.all(data);
    if (errors.length) {
      Toast.show(errors.join('<br>'), 'error');
      return;
    }
    showLoading(true);
    try {
      if (currentRecordId) {
        data.Record_ID = currentRecordId;
        data.Status = data.Status || 'Submitted';
        await Api.updateUseCase(data);
        Toast.show('Cập nhật thành công', 'success');
      } else {
        data.Status = 'Submitted'; // Set status for new submission
        const result = await Api.createUseCase(data);
        Toast.show(`Đăng ký thành công! ID: ${result.usecase_id}`, 'success');
        Storage.clear();
        // Optionally reset form
      }
      // Redirect or reset?
    } catch (err) {
      Toast.show('Lỗi: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
