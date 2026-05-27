// LookupService.gs
function getLookupData_() {
  const sheet = getOrCreateSheet_(SHEETS.LOOKUP);
  const data = sheet.getDataRange().getValues();
  const result = {};
  if (data.length < 2) {
    // Default values if sheet is empty
    result['Business_Category'] = ['Tín dụng', 'Thanh toán', 'Vận hành', 'Nhân sự', 'Khác'];
    result['Team'] = ['CNTT', 'Nghiệp vụ', 'SPTD', 'Khác'];
    result['Department'] = ['TT SPTD', 'Khối CNTT', 'Khối NV', 'Khác'];
    result['User_Type'] = ['Cá nhân', 'Team', 'TT SPTD'];
    result['Expected_Goals'] = ['Giảm thời gian', 'Chuẩn hóa output', 'Giảm lỗi', 'Tăng tốc review', 'Tăng năng suất'];
    result['Input_Types'] = ['Email', 'TLPT/BRD/FRD', 'Excel', 'Policy', 'Nội dung họp', 'Khác'];
    result['Reuse_Level'] = ['Cá nhân', 'Team khác', 'Toàn TT SPTD'];
    return result;
  }
  const headers = data[0];
  const fieldIdx = headers.indexOf('Field');
  const valueIdx = headers.indexOf('Value');
  if (fieldIdx === -1 || valueIdx === -1) return result;
  for (let i = 1; i < data.length; i++) {
    const field = data[i][fieldIdx];
    const value = data[i][valueIdx];
    if (!result[field]) result[field] = [];
    result[field].push(value);
  }
  return result;
}
