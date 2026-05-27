const API = {
  lookup:       () => `${APP_CONFIG.API_BASE_URL}lookup`,
  getUseCase:   (id) => `${APP_CONFIG.API_BASE_URL}usecase/${id}`,
  create:       () => `${APP_CONFIG.API_BASE_URL}usecase/create`,
  update:       () => `${APP_CONFIG.API_BASE_URL}usecase/update`,
  duplicateCheck: () => `${APP_CONFIG.API_BASE_URL}duplicate-check`,
  dashboard:    () => `${APP_CONFIG.API_BASE_URL}dashboard-summary`,
  health:       () => `${APP_CONFIG.API_BASE_URL}health`
};
