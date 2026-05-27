const API = {
  lookup:       () => `${APP_CONFIG.API_BASE_URL}?path=lookup`, // we'll use URL param for simplicity? Actually using pathInfo: we'll call base + 'lookup' (path appended)
  // For proper pathInfo we need to append after /exec. We'll configure the base URL without trailing path, then add '/lookup' etc.
  // Adjust: the web app URL is like https://script.google.com/macros/s/.../exec
  // So we'll call base + 'lookup', base + 'usecase/123', etc.
  getUseCase:   (id) => `${APP_CONFIG.API_BASE_URL}usecase/${id}`,
  create:       () => `${APP_CONFIG.API_BASE_URL}usecase/create`,
  update:       () => `${APP_CONFIG.API_BASE_URL}usecase/update`,
  duplicateCheck: () => `${APP_CONFIG.API_BASE_URL}duplicate-check`,
  dashboard:    () => `${APP_CONFIG.API_BASE_URL}dashboard-summary`,
  health:       () => `${APP_CONFIG.API_BASE_URL}health`
};
// The API_BASE_URL must already end with /exec/ (with trailing slash) so concatenation works.
