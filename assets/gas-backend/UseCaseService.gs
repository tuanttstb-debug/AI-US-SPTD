// UseCaseService.gs
function generateUseCaseId_() {
  const sheet = getOrCreateSheet_(SHEETS.CONFIG);
  const data = sheet.getDataRange().getValues();
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    let nextId = CONFIG_DEFAULTS.NEXT_ID;
    if (data.length >= 2) {
      const keyCol = data[0].indexOf('Key');
      const valCol = data[0].indexOf('Value');
      for (let i = 1; i < data.length; i++) {
        if (data[i][keyCol] === 'NEXT_ID') {
          nextId = parseInt(data[i][valCol]) || CONFIG_DEFAULTS.NEXT_ID;
          break;
        }
      }
    }
    const idStr = 'AIUS-' + ('0000' + nextId).slice(-4);
    // Update counter
    const newVal = nextId + 1;
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'NEXT_ID') {
        sheet.getRange(i + 1, 2).setValue(newVal);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow(['NEXT_ID', newVal]);
    }
    return idStr;
  } finally {
    lock.releaseLock();
  }
}

function createUseCase_(data) {
  const errors = validateCreate_(data);
  if (errors.length) throw new Error(errors.join(', '));
  const now = new Date().toISOString();
  const recordId = Utilities.getUuid();
  const useCaseId = generateUseCaseId_();
  const obj = {};
  HEADERS.forEach(h => { obj[h] = ''; });
  // Fill provided fields
  Object.keys(data).forEach(k => {
    if (HEADERS.indexOf(k) !== -1) obj[k] = data[k];
  });
  obj.Record_ID = recordId;
  obj.UseCase_ID = useCaseId;
  obj.Created_At = now;
  obj.Updated_At = now;
  obj.Status = 'Draft';
  obj.Current_Stage = 'Draft';
  obj.Edit_Version = 1;
  // set submit date if status is submitted later; not now
  appendRowFromObject_(SHEETS.MASTER, obj);
  logActivity_(useCaseId, 'CREATED', 'Use case created via API', data.Owner_Email);
  return { record_id: recordId, usecase_id: useCaseId };
}

function updateUseCase_(recordId, data) {
  if (!recordId) throw new Error('Record_ID is required');
  const existing = findObjectByField_(SHEETS.MASTER, 'Record_ID', recordId);
  if (!existing) throw new Error('Use case not found');
  const now = new Date().toISOString();
  const merged = { ...existing };
  Object.keys(data).forEach(k => {
    if (HEADERS.indexOf(k) !== -1 && !['Record_ID', 'UseCase_ID', 'Created_At'].includes(k)) {
      merged[k] = data[k];
    }
  });
  merged.Updated_At = now;
  merged.Edit_Version = parseInt(merged.Edit_Version || 0) + 1;
  // If status changes, set submit date accordingly
  if (merged.Status === 'Submitted' && existing.Status !== 'Submitted') {
    merged.Submit_Date = now;
  }
  updateRowByRecordId_(SHEETS.MASTER, recordId, merged);
  logActivity_(merged.UseCase_ID, 'UPDATED', 'Updated via API', merged.Owner_Email);
  return merged;
}

function getUseCaseById_(recordId) {
  const obj = findObjectByField_(SHEETS.MASTER, 'Record_ID', recordId);
  if (!obj) throw new Error('Not found');
  return obj;
}

function checkDuplicate_(name, painPoint) {
  const all = readSheetAsObjects_(SHEETS.MASTER);
  let bestScore = 0;
  let bestMatch = null;
  all.forEach(uc => {
    const scoreName = diceSimilarity_(name, uc.UseCase_Name);
    const scorePain = diceSimilarity_(painPoint, uc.Pain_Point);
    const combined = (scoreName * 0.6 + scorePain * 0.4);
    if (combined > bestScore) {
      bestScore = combined;
      bestMatch = uc;
    }
  });
  const isDuplicate = bestScore >= DUPLICATE_THRESHOLD;
  return {
    similarity_score: bestScore,
    duplicate_flag: isDuplicate,
    match_use_case_id: isDuplicate ? bestMatch.UseCase_ID : null,
    match_use_case_name: isDuplicate ? bestMatch.UseCase_Name : null
  };
}
