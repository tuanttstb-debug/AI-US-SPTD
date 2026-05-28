(function () {
  let currentRecordId = null; // set in edit mode

  /* ── Entry Point ── */
  async function init() {
    showLoading(true, 'Đang tải dữ liệu...');
    try {
      // 1. Load lookup data (dropdowns, options)
      const lookup = await Api.getLookup();
      window.__LOOKUP = lookup;

      // 2. Render wizard (form DOM must exist before populating)
      Wizard.init();

      // 3. Determine mode: edit vs new
      const params = new URLSearchParams(window.location.search);

      if (params.has('edit')) {
        // EDIT MODE — FIX BUG-02: init before populate
        currentRecordId = params.get('edit');
        showLoading(true, 'Đang tải use case...');
        const data = await Api.getUseCase(currentRecordId);
        Wizard.isEditMode = true;
        FormMapper.populateData(data);     // form exists now ✓
        FieldBuilder.refreshConditionals(); // re-evaluate conditional fields
        showEditModeBanner(currentRecordId);

      } else {
        // NEW MODE — show draft banner instead of browser confirm()
        const draft = Storage.load();
        if (draft) {
          showDraftBanner(draft);
        }
      }

      // 4. Autosave on any field change
      document.getElementById('useCaseForm').addEventListener('change', () => {
        const data = FormMapper.collectData();
        Storage.save(data);
        showAutosaveBadge();
      });

      // 5. Submit button
      document.getElementById('submitBtn').addEventListener('click', submitForm);

    } catch (err) {
      Toast.show('Lỗi khởi tạo: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  /* ── Form Submission ── */
  async function submitForm() {
    const data = FormMapper.collectData();

    // Final validation (checks step 1 + step 2 required fields)
    const errors = Validator.all(data);
    if (errors.length) {
      Toast.show(errors.join('\n'), 'error'); // FIX BUG-03: '\n' not '<br>'
      return;
    }

    showLoading(true, 'Đang gửi...');
    try {
      if (currentRecordId) {
        // EDIT MODE
        data.Record_ID = currentRecordId;
        data.Status = data.Status || 'Submitted';
        await Api.updateUseCase(data);
        Storage.clear(); // FIX: clear draft after successful edit
        Toast.show('Cập nhật thành công!', 'success');
        showSuccessScreen('Đã cập nhật');

      } else {
        // CREATE MODE
        data.Status = 'Submitted';
        const result = await Api.createUseCase(data);
        Storage.clear();
        showSuccessScreen(result.usecase_id || 'AIUS-????');
      }
    } catch (err) {
      Toast.show('Lỗi gửi: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  /* ── Success Screen ── */
  function showSuccessScreen(useCaseId) {
    // Hide wizard form content
    document.getElementById('useCaseForm').style.display = 'none';
    document.getElementById('wizardNavWrapper').style.display = 'none';
    document.getElementById('stepIndicators').style.display = 'none';
    document.getElementById('stepCounter').style.display = 'none';

    // Show success screen
    const screen = document.getElementById('successScreen');
    const badge  = document.getElementById('successIdBadge');
    if (badge) badge.textContent = useCaseId;
    if (screen) screen.classList.remove('hidden');

    // Scroll into view
    if (screen) screen.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ── Draft Banner (replaces browser confirm()) — FIX BUG-05 ── */
  function showDraftBanner(draft) {
    const banner     = document.getElementById('draftBanner');
    const restoreBtn = document.getElementById('draftRestoreBtn');
    const discardBtn = document.getElementById('draftDiscardBtn');
    if (!banner) return;

    banner.classList.remove('hidden');

    restoreBtn.addEventListener('click', () => {
      FormMapper.populateData(draft);
      FieldBuilder.refreshConditionals();
      banner.classList.add('hidden');
      Toast.show('Đã khôi phục bản nháp', 'success');
    }, { once: true });

    discardBtn.addEventListener('click', () => {
      Storage.clear();
      banner.classList.add('hidden');
    }, { once: true });
  }

  /* ── Edit Mode Banner ── */
  function showEditModeBanner(recordId) {
    const banner = document.getElementById('editModeBanner');
    const idEl   = document.getElementById('editModeId');
    if (!banner) return;
    if (idEl) idEl.textContent = recordId.substring(0, 8) + '...';
    banner.classList.remove('hidden');
  }

  /* ── Autosave Indicator ── */
  let autosaveTimer = null;
  function showAutosaveBadge() {
    const badge = document.getElementById('autosaveBadge');
    if (!badge) return;
    badge.textContent = '✓ Đã lưu nháp';
    badge.classList.add('visible', 'saved');
    badge.classList.remove('saving');
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      badge.classList.remove('visible');
    }, 3000);
  }

  /* ── Loading Overlay ── */
  function showLoading(show, label) {
    const overlay = document.getElementById('loadingOverlay');
    const labelEl = document.getElementById('loadingLabel');
    overlay.classList.toggle('hidden', !show);
    if (labelEl && label) labelEl.textContent = label;
  }

  window.addEventListener('DOMContentLoaded', init);
})();
