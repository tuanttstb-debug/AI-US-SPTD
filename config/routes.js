// routes.js — URL builder cho GAS API
// Tự động strip trailing slash để tránh /exec/?action= (404)
var _gasBase = (APP_CONFIG.API_BASE_URL || '').replace(/\/+$/, '');

var API = {
  lookup:         () => `${_gasBase}?action=lookup`,
  getUseCase:     (id) => `${_gasBase}?action=usecase&id=${encodeURIComponent(id)}`,
  create:         () => `${_gasBase}?action=create`,
  update:         () => `${_gasBase}?action=update`,
  duplicateCheck: () => `${_gasBase}?action=duplicate-check`,
  dashboard:      () => `${_gasBase}?action=dashboard`,
  health:         () => `${_gasBase}?action=health`
};
