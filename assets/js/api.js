// ─────────────────────────────────────────────────────────────────
// api.js — HTTP client cho Google Apps Script Web App
//
// Tại sao không dùng fetch() thông thường với GAS?
//
// Vấn đề: GAS Web App luôn 302 redirect từ script.google.com
//         → script.googleusercontent.com. Chrome kiểm tra CORS
//         trên response 302 (script.google.com không có header đó)
//         → ERR_FAILED trước khi tới GAS code.
//
// Giải pháp:
//   GET  → JSONP: inject <script> tag, bypass CORS hoàn toàn
//   POST → fetch() với body là text/plain (không phải application/json)
//          → không trigger OPTIONS preflight → GAS nhận được request
//
// GAS backend đọc body bằng e.postData.contents (string) rồi JSON.parse()
// → không phụ thuộc vào Content-Type header.
// ─────────────────────────────────────────────────────────────────

var Api = {

  // ── GET via JSONP ───────────────────────────────────────────────
  // JSONP inject <script src="url?callback=fn"> vào DOM.
  // script.google.com redirect → script.googleusercontent.com,
  // nhưng vì là <script> (không phải fetch) → CORS không áp dụng.
  // GAS trả về: callback({success:true, data:{...}})
  _jsonp(url, timeoutMs) {
    timeoutMs = timeoutMs || 15000;
    return new Promise(function(resolve, reject) {
      var cbName  = '__gasCb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      var script  = document.createElement('script');
      var timer   = null;
      var settled = false;

      function cleanup() {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (script.parentNode) script.parentNode.removeChild(script);
        delete window[cbName];
      }

      window[cbName] = function(data) {
        cleanup();
        if (!data || !data.success) {
          reject(new Error(data && data.message ? data.message : 'GAS trả về lỗi'));
        } else {
          resolve(data.data);
        }
      };

      timer = setTimeout(function() {
        cleanup();
        reject(new Error('Timeout kết nối GAS (' + (timeoutMs / 1000) + 's). Kiểm tra mạng hoặc GAS URL.'));
      }, timeoutMs);

      script.onerror = function() {
        cleanup();
        reject(new Error('Không load được GAS script. Kiểm tra URL và deployment.'));
      };

      // Append callback param
      script.src = url + (url.indexOf('?') === -1 ? '?' : '&') + 'callback=' + cbName;
      (document.head || document.body).appendChild(script);
    });
  },

  // ── POST via fetch (text/plain body — no preflight) ─────────────
  // Content-Type: text/plain là "simple" CORS request → không cần preflight.
  // Body là JSON string — GAS parse bằng JSON.parse(e.postData.contents).
  async _post(url, data) {
    let response;
    try {
      response = await fetch(url, {
        method:   'POST',
        body:     JSON.stringify(data),
        redirect: 'follow'
        // Không set Content-Type header → browser mặc định text/plain;charset=UTF-8
        // → không trigger OPTIONS preflight
      });
    } catch (networkErr) {
      throw new Error(
        'Lỗi mạng khi gửi POST:\n' + networkErr.message + '\n' +
        'Kiểm tra GAS URL và cài đặt deploy.'
      );
    }

    // Parse response
    let text = '';
    try {
      text = await response.text();
    } catch (e) {
      throw new Error('Không đọc được response từ server.');
    }

    // Nếu response là HTML → GAS chưa set "Anyone" hoặc URL sai
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error(
        'GAS trả về trang HTML thay vì JSON.\n' +
        'Nguyên nhân: GAS yêu cầu đăng nhập.\n' +
        'Cách sửa: Apps Script → Deploy → Edit → "Who has access: Anyone" → Save.'
      );
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error('Response không phải JSON hợp lệ: ' + text.substring(0, 200));
    }

    if (!json.success) throw new Error(json.message || 'Lỗi không xác định từ server');
    return json.data;
  },

  // ── Public API Methods ──────────────────────────────────────────

  getLookup() {
    return Api._jsonp(API.lookup());
  },

  getUseCase(id) {
    return Api._jsonp(API.getUseCase(id));
  },

  getDashboard() {
    return Api._jsonp(API.dashboard());
  },

  health() {
    return Api._jsonp(API.health());
  },

  createUseCase(data) {
    return Api._post(API.create(), data);
  },

  updateUseCase(data) {
    return Api._post(API.update(), data);
  },

  duplicateCheck(name, pain) {
    return Api._post(API.duplicateCheck(), { UseCase_Name: name, Pain_Point: pain });
  }
};
