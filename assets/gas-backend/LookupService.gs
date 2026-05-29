// ─────────────────────────────────────────────────────────────────
// LookupService.gs — Cung cấp dữ liệu dropdown cho frontend
// ─────────────────────────────────────────────────────────────────

// ── Defaults khi sheet LOOKUP rỗng hoặc thiếu field ──────────────
// Chỉ giữ các field có lookupKey trong constants.js (frontend dùng)
var LOOKUP_DEFAULTS = {
  Business_Category: ['Tín dụng', 'Vận hành', 'Khách hàng', 'Tuân thủ', 'Khác'],
  Team:              ['CNTT', 'Nghiệp vụ', 'SPTD', 'Vận hành', 'Kiểm soát', 'Khác'],
  Current_Stage:     ['S1 - Idea', 'S2 - Pilot', 'S3 - Standardized', 'S4 - Scale'],
  User_Type:         ['Cá nhân', 'Team', 'TT SPTD'],
  Expected_Goals:    ['Giảm thời gian xử lý', 'Chuẩn hóa output', 'Giảm tỉ lệ sai sót', 'Tăng tốc review', 'Tăng năng suất', 'Cải thiện trải nghiệm KH', 'Tiết kiệm chi phí'],
  Input_Types:       ['Email', 'TLPT/BRD/FRD', 'Excel/CSV', 'Policy/Quy định', 'Nội dung họp', 'Văn bản pháp lý', 'Khác'],
  Reuse_Level:       ['Cá nhân', 'Team khác', 'Toàn Trung tâm']
};

// ── Map CATEGORY → field name ─────────────────────────────────────
// Key: giá trị cột Field trong LOOKUP sheet (lowercase)
// Value: lookupKey trong constants.js
var LOOKUP_CATEGORY_MAP = {
  'team':      'Team',
  'goal':      'Expected_Goals',
  'reuse':     'Reuse_Level',
  'stage':     'Current_Stage',
  'category':  'Business_Category',
  'input':     'Input_Types',
  'user':      'User_Type',
  'user_type': 'User_Type'
};

/**
 * Lấy toàn bộ lookup data cho frontend.
 * LOOKUP sheet cấu trúc cố định: Field | Value | Sort_Order | Active
 * (tạo bởi getOrCreateSheet_ trong Utils.gs)
 *
 * @returns {Object} { fieldName: [option1, option2, ...], ... }
 */
function getLookupData_() {
  var sheet = getOrCreateSheet_(SHEETS.LOOKUP);
  var data  = sheet.getDataRange().getValues();

  if (data.length < 2) {
    return LOOKUP_DEFAULTS;
  }

  var result = {};

  for (var i = 1; i < data.length; i++) {
    var category = String(data[i][0] || '').trim(); // col 0: Field/Category
    var value    = String(data[i][1] || '').trim(); // col 1: Value
    var active   = data[i][3];                      // col 3: Active

    if (!category || !value) continue;

    // Bỏ qua row bị đánh dấu inactive
    if (active === false || String(active).trim().toUpperCase() === 'FALSE') continue;

    var fieldName = LOOKUP_CATEGORY_MAP[category.toLowerCase()] || category;
    if (!result[fieldName]) result[fieldName] = [];
    result[fieldName].push(value);
  }

  // Fallback defaults cho field chưa có trong sheet
  Object.keys(LOOKUP_DEFAULTS).forEach(function(key) {
    if (!result[key] || result[key].length === 0) {
      result[key] = LOOKUP_DEFAULTS[key];
    }
  });

  return result;
}
