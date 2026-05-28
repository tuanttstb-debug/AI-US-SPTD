// routes.js — URL builder cho GAS API
// GET dùng ?action= (JSONP bypass CORS redirect)
// POST dùng ?action= trong query + body là JSON string

var API = {
  lookup:         () => `${APP_CONFIG.API_BASE_URL}?action=lookup`,
  getUseCase:     (id) => `${APP_CONFIG.API_BASE_URL}?action=usecase&id=${encodeURIComponent(id)}`,
  create:         () => `${APP_CONFIG.API_BASE_URL}?action=create`,
  update:         () => `${APP_CONFIG.API_BASE_URL}?action=update`,
  duplicateCheck: () => `${APP_CONFIG.API_BASE_URL}?action=duplicate-check`,
  dashboard:      () => `${APP_CONFIG.API_BASE_URL}?action=dashboard`,
  health:         () => `${APP_CONFIG.API_BASE_URL}?action=health`
};
