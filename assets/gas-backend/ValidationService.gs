// ValidationService.gs
function validateCreate_(data) {
  const errors = [];
  REQUIRED_FIELDS_CREATE.forEach(field => {
    if (!data[field] || String(data[field]).trim() === '') {
      errors.push(`Thiếu trường bắt buộc: ${field}`);
    }
  });
  if (data.Owner_Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.Owner_Email)) {
    errors.push('Email không hợp lệ');
  }
  return errors;
}

function validateUpdate_(data) {
  const errors = [];
  if (!data.Record_ID) errors.push('Thiếu Record_ID');
  return errors.concat(validateCreate_(data));
}
