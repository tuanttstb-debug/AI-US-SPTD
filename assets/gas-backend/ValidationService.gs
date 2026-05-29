// ─────────────────────────────────────────────────────────────────
// ValidationService.gs
// ─────────────────────────────────────────────────────────────────

function validateCreate_(data) {
  var errors = [];

  // 1. Required fields
  REQUIRED_FIELDS_CREATE.forEach(function(field) {
    var val = data[field];
    if (val === undefined || val === null || String(val).trim() === '') {
      errors.push('Thiếu trường bắt buộc: ' + field);
    }
  });

  // 2. Number fields
  ['Current_Time_Min', 'Before_Time_Min', 'After_Time_Min'].forEach(function(field) {
    if (data[field] !== undefined && data[field] !== null && String(data[field]).trim() !== '') {
      var n = parseFloat(String(data[field]));
      if (isNaN(n) || n < 0) {
        errors.push(field + ' phải là số không âm (nhận được: ' + data[field] + ')');
      }
    }
  });

  // 4. Demo_Link — chỉ validate URL khi Demo_Status != "Chưa có"
  //    FIX: trước đây validate Demo_Link bất kể Demo_Status là gì
  var demoStatus = String(data.Demo_Status || '').trim();
  var demoRequired = demoStatus !== '' && demoStatus !== 'Chưa có';
  if (demoRequired && data.Demo_Link && String(data.Demo_Link).trim() !== '') {
    if (!isValidUrl_(data.Demo_Link)) {
      errors.push('Demo_Link phải là URL hợp lệ (bắt đầu bằng https://)');
    }
  }

  // 5. Before >= After
  if (data.Before_Time_Min && data.After_Time_Min) {
    var before = parseFloat(data.Before_Time_Min);
    var after  = parseFloat(data.After_Time_Min);
    if (!isNaN(before) && !isNaN(after) && after > before) {
      errors.push('Thời gian sau (' + after + ' phút) không thể lớn hơn thời gian trước (' + before + ' phút)');
    }
  }

  return errors;
}

function validateUpdate_(data) {
  var errors = [];

  if (!data.Record_ID || String(data.Record_ID).trim() === '') {
    errors.push('Record_ID là bắt buộc khi update');
  }

  ['Current_Time_Min', 'Before_Time_Min', 'After_Time_Min'].forEach(function(field) {
    if (data[field] !== undefined && data[field] !== null && String(data[field]).trim() !== '') {
      var n = parseFloat(String(data[field]));
      if (isNaN(n) || n < 0) {
        errors.push(field + ' phải là số không âm');
      }
    }
  });

  // Demo_Link — chỉ validate khi Demo_Status != "Chưa có"
  var demoStatus = String(data.Demo_Status || '').trim();
  var demoRequired = demoStatus !== '' && demoStatus !== 'Chưa có';
  if (demoRequired && data.Demo_Link !== undefined && String(data.Demo_Link).trim() !== '') {
    if (!isValidUrl_(data.Demo_Link)) {
      errors.push('Demo_Link phải là URL hợp lệ (bắt đầu bằng https://)');
    }
  }

  if (data.Before_Time_Min && data.After_Time_Min) {
    var before = parseFloat(data.Before_Time_Min);
    var after  = parseFloat(data.After_Time_Min);
    if (!isNaN(before) && !isNaN(after) && after > before) {
      errors.push('After_Time_Min không thể lớn hơn Before_Time_Min');
    }
  }

  return errors;
}

function validateDuplicateCheck_(data) {
  var errors = [];
  if (!data.UseCase_Name || String(data.UseCase_Name).trim() === '') {
    errors.push('UseCase_Name là bắt buộc để kiểm tra duplicate');
  }
  return errors;
}
