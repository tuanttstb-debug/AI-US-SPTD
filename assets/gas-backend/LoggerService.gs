// ─────────────────────────────────────────────────────────────────
// LoggerService.gs — Ghi audit log cho mọi thao tác
// ─────────────────────────────────────────────────────────────────

/**
 * Ghi một hoạt động vào ACTIVITY_LOG sheet.
 * @param {string} useCaseId      - UseCase_ID (business ID, VD: AIUS-0001)
 * @param {string} recordId       - Record_ID (UUID)
 * @param {string} action         - Loại hành động: CREATED, UPDATED, STATUS_CHANGED, DUPLICATE_CHECK, v.v.
 * @param {string} details        - Mô tả chi tiết
 * @param {string} [userEmail]    - Email người thực hiện
 * @param {string} [prevStatus]   - Trạng thái trước (cho status change)
 * @param {string} [newStatus]    - Trạng thái mới (cho status change)
 */
function logActivity_(useCaseId, recordId, action, details, userEmail, prevStatus, newStatus) {
  try {
    var obj = {
      Log_ID:          Utilities.getUuid(),
      UseCase_ID:      useCaseId   || '',
      Record_ID:       recordId    || '',
      Timestamp:       new Date().toISOString(),
      Action:          action      || '',
      Details:         details     || '',
      User_Email:      userEmail   || '',
      Previous_Status: prevStatus  || '',
      New_Status:      newStatus   || ''
    };
    appendRowFromObject_(SHEETS.ACTIVITY, obj);
  } catch (e) {
    // Lỗi log không được làm crash main request
    console.error('LoggerService: không thể ghi log - ' + e.message);
  }
}

/**
 * Ghi lỗi hệ thống vào ACTIVITY_LOG để debug.
 * @param {string} context  - Nơi xảy ra lỗi (tên function)
 * @param {Error}  error    - Error object
 * @param {Object} [extra]  - Thông tin bổ sung (ví dụ request body)
 */
function logError_(context, error, extra) {
  try {
    var details = '[ERROR] ' + context + ': ' + error.message;
    if (extra) {
      try { details += ' | Context: ' + JSON.stringify(extra).substring(0, 500); }
      catch (e) { /* ignore stringify error */ }
    }
    var obj = {
      Log_ID:          Utilities.getUuid(),
      UseCase_ID:      '',
      Record_ID:       '',
      Timestamp:       new Date().toISOString(),
      Action:          'SYSTEM_ERROR',
      Details:         details,
      User_Email:      '',
      Previous_Status: '',
      New_Status:      ''
    };
    appendRowFromObject_(SHEETS.ACTIVITY, obj);
  } catch (e) {
    console.error('LoggerService: không thể ghi error log - ' + e.message);
  }
}
