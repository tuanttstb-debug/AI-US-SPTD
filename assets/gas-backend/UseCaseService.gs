// ─────────────────────────────────────────────────────────────────
// UseCaseService.gs — CRUD operations cho AI Use Case
// ─────────────────────────────────────────────────────────────────

// ── ID Generation ─────────────────────────────────────────────────

/**
 * Sinh UseCase_ID dạng AIUS-NNNN với atomic increment.
 * FIX: Acquire lock TRƯỚC khi đọc sheet (tránh race condition).
 * @returns {string} VD: 'AIUS-0001'
 */
function generateUseCaseId_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS); // Lock trước — FIX race condition
  try {
    var sheet  = getOrCreateSheet_(SHEETS.CONFIG);
    var data   = sheet.getDataRange().getValues();
    var nextId = CONFIG_DEFAULTS.NEXT_ID;

    if (data.length >= 2) {
      var keyCol = data[0].map(String).indexOf('Key');
      var valCol = data[0].map(String).indexOf('Value');
      if (keyCol !== -1 && valCol !== -1) {
        for (var i = 1; i < data.length; i++) {
          if (String(data[i][keyCol]).trim() === 'NEXT_ID') {
            nextId = parseInt(data[i][valCol], 10) || CONFIG_DEFAULTS.NEXT_ID;
            break;
          }
        }
      }
    }

    var idStr  = ID_PREFIX + ('0000' + nextId).slice(-ID_PADDING);
    var newVal = nextId + 1;

    // Update counter trong sheet
    var updated = false;
    var keyColIdx = data[0] ? data[0].map(String).indexOf('Key') : -1;
    for (var j = 1; j < data.length; j++) {
      if (String(data[j][0]).trim() === 'NEXT_ID') {
        sheet.getRange(j + 1, 2).setValue(newVal);
        updated = true;
        break;
      }
    }
    if (!updated) {
      sheet.appendRow(['NEXT_ID', newVal, 'Auto-increment ID counter']);
    }

    return idStr;
  } finally {
    lock.releaseLock();
  }
}

// ── Create ────────────────────────────────────────────────────────

/**
 * Tạo use case mới.
 * - Validate required fields
 * - Sinh Record_ID (UUID) và UseCase_ID (AIUS-NNNN)
 * - Tự động tính Estimated_Time_Saving và Estimated_Hours_Saved_Month
 * - Lưu JSON_Backup
 * @param {Object} data - Request body
 * @returns {{ record_id: string, usecase_id: string }}
 */
function createUseCase_(data) {
  // ── 1. Validation ─────────────────────────────────────────────
  var errors = validateCreate_(data);
  if (errors.length) throw new Error(errors.join(' | '));

  // ── 2. Sinh IDs ───────────────────────────────────────────────
  var now       = new Date().toISOString();
  var recordId  = Utilities.getUuid();
  var useCaseId = generateUseCaseId_();

  // ── 3. Build record object ─────────────────────────────────────
  var obj = {};
  HEADERS.forEach(function(h) { obj[h] = ''; });

  // Copy dữ liệu từ request (chỉ các field trong HEADERS)
  Object.keys(data).forEach(function(k) {
    if (HEADERS.indexOf(k) !== -1) {
      obj[k] = sanitizeStr_(data[k], 5000);
    }
  });

  // ── 4. Set system fields ──────────────────────────────────────
  obj.Record_ID    = recordId;
  obj.UseCase_ID   = useCaseId;
  obj.Created_At   = now;
  obj.Updated_At   = now;
  obj.Edit_Version = 1;

  // Status: accept 'Submitted' từ frontend; default là 'Draft'
  // (Không ép thành Draft như code cũ — cho phép submit trực tiếp)
  var requestedStatus = sanitizeStr_(data.Status);
  obj.Status = (requestedStatus && STATUS[requestedStatus.toUpperCase()] === requestedStatus)
               ? requestedStatus
               : STATUS.DRAFT;
  // Current_Stage giữ nguyên giá trị S1-S4 từ form (không overwrite bằng Status)

  // Submit_Date chỉ set khi status = Submitted
  if (obj.Status === STATUS.SUBMITTED) {
    obj.Submit_Date = now;
  }

  // ── 5. Auto-compute time saving ───────────────────────────────
  if (data.Before_Time_Min && data.After_Time_Min) {
    obj.Estimated_Time_Saving      = computeTimeSaving_(data.Before_Time_Min, data.After_Time_Min);
    obj.Estimated_Hours_Saved_Month = computeHoursSavedMonth_(data.Before_Time_Min, data.After_Time_Min);
  }

  // ── 6. JSON_Backup (snapshot không bao gồm chính nó) ─────────
  var backupData = {};
  HEADERS.forEach(function(h) { if (h !== 'JSON_Backup') backupData[h] = obj[h]; });
  obj.JSON_Backup = JSON.stringify(backupData);

  // ── 7. Ghi vào sheet ──────────────────────────────────────────
  appendRowFromObject_(SHEETS.MASTER, obj);
  logActivity_(useCaseId, recordId, 'CREATED', 'Use case tạo mới qua API', data.Owner_Email,
               '', obj.Status);

  return { record_id: recordId, usecase_id: useCaseId };
}

// ── Update ────────────────────────────────────────────────────────

/**
 * Cập nhật use case theo Record_ID.
 * FIX: Gọi validateUpdate_ (trước đây không được gọi).
 * - Không cho phép ghi đè PROTECTED_FIELDS
 * - Tự động tính lại time saving nếu thay đổi Before/After
 * - Cập nhật Submit_Date khi chuyển sang Submitted lần đầu
 * - Cập nhật JSON_Backup
 * @param {string} recordId
 * @param {Object} data
 * @returns {Object} Record sau khi merge
 */
function updateUseCase_(recordId, data) {
  if (!recordId) throw new Error('Record_ID là bắt buộc');

  // ── 1. Validation ─────────────────────────────────────────────
  data.Record_ID = recordId; // Đảm bảo Record_ID có trong data để validate
  var errors = validateUpdate_(data); // FIX: thực sự gọi validateUpdate_
  if (errors.length) throw new Error(errors.join(' | '));

  // ── 2. Lấy record hiện tại ────────────────────────────────────
  var existing = findObjectByField_(SHEETS.MASTER, 'Record_ID', recordId);
  if (!existing) throw new Error('Không tìm thấy use case với Record_ID: ' + recordId);

  var now    = new Date().toISOString();
  var merged = {};
  Object.keys(existing).forEach(function(k) { merged[k] = existing[k]; });

  // ── 3. Merge new data (bảo vệ protected fields) ───────────────
  Object.keys(data).forEach(function(k) {
    if (HEADERS.indexOf(k) === -1)          return; // Bỏ field không trong schema
    if (PROTECTED_FIELDS.indexOf(k) !== -1) return; // Không ghi đè protected fields
    merged[k] = sanitizeStr_(data[k], 5000);
  });

  // ── 4. Update metadata ────────────────────────────────────────
  merged.Updated_At   = now;
  merged.Edit_Version = (parseInt(merged.Edit_Version, 10) || 0) + 1;

  // ── 5. Status transition ──────────────────────────────────────
  var prevStatus = String(existing.Status || STATUS.DRAFT);
  var newStatus  = String(merged.Status   || STATUS.DRAFT);

  // Kiểm tra transition hợp lệ
  var allowedTransitions = STATUS_TRANSITIONS[prevStatus] || [];
  if (allowedTransitions.indexOf(newStatus) === -1) {
    throw new Error(
      'Không thể chuyển status từ "' + prevStatus + '" sang "' + newStatus + '". ' +
      'Được phép: ' + allowedTransitions.join(', ')
    );
  }

  // Set Submit_Date khi lần đầu chuyển sang Submitted
  if (newStatus === STATUS.SUBMITTED && prevStatus !== STATUS.SUBMITTED) {
    merged.Submit_Date = now;
  }
  // Current_Stage giữ nguyên giá trị S1-S4 từ form (không sync với Status)

  // ── 6. Tính lại time saving nếu Before/After thay đổi ─────────
  var before = merged.Before_Time_Min || existing.Before_Time_Min;
  var after  = merged.After_Time_Min  || existing.After_Time_Min;
  if (before && after) {
    merged.Estimated_Time_Saving       = computeTimeSaving_(before, after);
    merged.Estimated_Hours_Saved_Month = computeHoursSavedMonth_(before, after);
  }

  // ── 7. Cập nhật JSON_Backup ───────────────────────────────────
  var backupData = {};
  HEADERS.forEach(function(h) { if (h !== 'JSON_Backup') backupData[h] = merged[h]; });
  merged.JSON_Backup = JSON.stringify(backupData);

  // ── 8. Ghi vào sheet ──────────────────────────────────────────
  updateRowByRecordId_(SHEETS.MASTER, recordId, merged);
  logActivity_(merged.UseCase_ID, recordId, 'UPDATED', 'Cập nhật qua API',
               merged.Owner_Email, prevStatus, newStatus);

  // Trả về merged object nhưng không bao gồm JSON_Backup (quá lớn)
  var returnObj = {};
  Object.keys(merged).forEach(function(k) {
    if (k !== 'JSON_Backup') returnObj[k] = merged[k];
  });
  return returnObj;
}

// ── Read ──────────────────────────────────────────────────────────

/**
 * Lấy chi tiết một use case theo Record_ID.
 * @param {string} recordId
 * @returns {Object} Use case object (không bao gồm JSON_Backup)
 */
function getUseCaseById_(recordId) {
  if (!recordId || String(recordId).trim() === '') {
    throw new Error('Record_ID không được để trống');
  }
  var obj = findObjectByField_(SHEETS.MASTER, 'Record_ID', recordId);
  if (!obj) throw new Error('Không tìm thấy use case với Record_ID: ' + recordId);

  // Ẩn JSON_Backup trong response (quá lớn, không cần thiết cho edit mode)
  var result = {};
  Object.keys(obj).forEach(function(k) {
    if (k !== 'JSON_Backup') result[k] = obj[k];
  });
  return result;
}

// ── Duplicate Check ───────────────────────────────────────────────

/**
 * Kiểm tra trùng lặp tên use case bằng Dice Coefficient.
 * FIX: Bỏ qua record hiện tại khi check (dùng trong edit mode).
 * FIX: Sử dụng multiset bigrams (accurate hơn Set-based cũ).
 * @param {string} name           - Tên use case cần kiểm tra
 * @param {string} [painPoint]    - Pain point (tăng độ chính xác)
 * @param {string} [excludeId]    - Record_ID cần loại trừ (edit mode)
 * @returns {Object} { similarity_score, duplicate_flag, match_usecase_id, match_usecase_name }
 */
function checkDuplicate_(name, painPoint, excludeId) {
  var errors = validateDuplicateCheck_({ UseCase_Name: name });
  if (errors.length) throw new Error(errors.join(' | '));

  var all = readSheetAsObjects_(SHEETS.MASTER);

  var bestScore = 0;
  var bestMatch = null;

  all.forEach(function(uc) {
    // Bỏ qua record hiện tại (edit mode)
    if (excludeId && String(uc.Record_ID) === String(excludeId)) return;
    // Chỉ check các record đang active (không Rejected)
    if (uc.Status === STATUS.REJECTED) return;
    // Bỏ qua record rỗng
    if (!uc.UseCase_Name) return;

    var scoreName  = diceSimilarity_(name, uc.UseCase_Name);
    var scorePain  = painPoint ? diceSimilarity_(painPoint, uc.Pain_Point) : 0;
    var combined   = scoreName * DUPLICATE_WEIGHT_NAME + scorePain * DUPLICATE_WEIGHT_PAIN;

    if (combined > bestScore) {
      bestScore = combined;
      bestMatch = uc;
    }
  });

  var isDuplicate = bestScore >= DUPLICATE_THRESHOLD;
  return {
    similarity_score:    Math.round(bestScore * 1000) / 1000, // 3 decimal places
    duplicate_flag:      isDuplicate,
    match_usecase_id:    isDuplicate ? (bestMatch.UseCase_ID  || '') : null,
    match_usecase_name:  isDuplicate ? (bestMatch.UseCase_Name || '') : null,
    match_record_id:     isDuplicate ? (bestMatch.Record_ID   || '') : null
  };
}
