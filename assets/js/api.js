const Api = {
  async request(url, method = 'GET', body = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors'
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    const json = await response.json();
    if (!json.success) throw new Error(json.message || 'Lỗi không xác định');
    return json.data;
  },

  getLookup: () => Api.request(API.lookup()),
  getUseCase: (id) => Api.request(API.getUseCase(id)),
  createUseCase: (data) => Api.request(API.create(), 'POST', data),
  updateUseCase: (data) => Api.request(API.update(), 'POST', data),
  duplicateCheck: (name, painPoint) => Api.request(API.duplicateCheck(), 'POST', { UseCase_Name: name, Pain_Point: painPoint }),
  getDashboard: () => Api.request(API.dashboard()),
  health: () => Api.request(API.health())
};
