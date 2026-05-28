var Api = {
  async request(url, method = 'GET', body = null) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';

    const options = {
      method,
      headers,
      mode: 'cors',
      redirect: 'follow'
    };
    if (body) options.body = JSON.stringify(body);

    let response;
    try {
      response = await fetch(url, options);
    } catch (networkErr) {
      // CORS / network failure — provide actionable message
      const isCors = networkErr.message && (
        networkErr.message.includes('Failed to fetch') ||
        networkErr.message.includes('NetworkError') ||
        networkErr.message.includes('CORS')
      );
      if (isCors) {
        throw new Error(
          'Không thể kết nối đến server (CORS).\n' +
          'Kiểm tra: GAS Web App → Deploy → "Who has access" phải là "Anyone".\n' +
          'Chi tiết: ' + networkErr.message
        );
      }
      throw networkErr;
    }

    // Handle non-JSON responses (e.g., Google auth redirect page)
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (response.status === 302 || response.redirected) {
        throw new Error(
          'Server trả về redirect (302). GAS Web App cần được deploy với "Who has access: Anyone".\n' +
          'Vào Apps Script → Deploy → Manage deployments → Edit → Anyone → Save.'
        );
      }
      throw new Error(`Server trả về lỗi HTTP ${response.status}. Kiểm tra GAS deployment.`);
    }

    const json = await response.json();
    if (!json.success) throw new Error(json.message || 'Lỗi không xác định từ server');
    return json.data;
  },

  getLookup:     ()           => Api.request(API.lookup()),
  getUseCase:    (id)         => Api.request(API.getUseCase(id)),
  createUseCase: (data)       => Api.request(API.create(),          'POST', data),
  updateUseCase: (data)       => Api.request(API.update(),          'POST', data),
  duplicateCheck:(name, pain) => Api.request(API.duplicateCheck(),  'POST', { UseCase_Name: name, Pain_Point: pain }),
  getDashboard:  ()           => Api.request(API.dashboard()),
  health:        ()           => Api.request(API.health())
};
