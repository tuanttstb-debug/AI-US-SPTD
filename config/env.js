var APP_CONFIG = {
  // URL GAS Web App — KHÔNG có trailing slash
  // Cập nhật mỗi khi deploy lại GAS (mỗi lần "New Deployment" sẽ ra URL mới)
  API_BASE_URL: 'https://script.google.com/macros/s/AKfycbyjgxxVhMQHTebSzF_icBPaj3SmdvvOCYXCJO1oe_vR8_OubL3HXMb8rWw2SErAtch9Kg/exec',
  VERSION: '1.0.0',
  AUTO_SAVE_KEY:    'ai_usecase_draft',
  DUPLICATE_THRESHOLD: 0.8,

  // Dashboard admin — danh sách email được phép truy cập dashboard quản lý + approve
  // Thêm/xóa email ở đây để cấp/thu hồi quyền (không cần sửa logic)
  // Lưu ý: đây là kiểm tra phía frontend (UI-level). Backend GAS có validation riêng.
  ADMIN_EMAILS: ['tuantt.stb@gmail.com', 'tuantt4@tpb.com.vn'],

  // sessionStorage key — lưu email admin trong phiên làm việc (legacy, kept for backward compat)
  ADMIN_SESSION_KEY: 'ai_admin_email',

  // sessionStorage key — lưu full user object {email, displayName, role, loginAt}
  USER_SESSION_KEY: 'ai_user_session'
};
