const Validator = {
  step1(data) {
    const err = [];
    if (!data[FIELDS.USE_CASE_NAME]) err.push('Tên Use Case không được để trống');
    if (!data[FIELDS.OWNER_NAME]) err.push('Tên chủ sở hữu không được để trống');
    if (!data[FIELDS.OWNER_EMAIL] || !/^\S+@\S+\.\S+$/.test(data[FIELDS.OWNER_EMAIL])) err.push('Email không hợp lệ');
    if (!data[FIELDS.TEAM]) err.push('Chọn Team');
    if (!data[FIELDS.BUSINESS_CATEGORY]) err.push('Chọn Business Category');
    if (!data[FIELDS.PAIN_POINT]) err.push('Mô tả Pain Point');
    return err;
  },
  step2(data) {
    const err = [];
    if (!data[FIELDS.FLOW_DESC]) err.push('Mô tả luồng xử lý');
    return err;
  },
  // step3 & step4 optional; no required fields besides maybe link format
  all(data) {
    return [...Validator.step1(data), ...Validator.step2(data)];
  }
};
