// ─────────────────────────────────────────────────────────────────
// auth.js — AuthService
//
// Lightweight session-based auth. Email-only for now.
// Designed to be migrated to OAuth/SAML: swap _providers['local'] only.
//
// Depends on: config/env.js (APP_CONFIG) — must load first.
// Session key: APP_CONFIG.USER_SESSION_KEY || 'ai_user_session'
// Role resolution: email in APP_CONFIG.ADMIN_EMAILS → 'admin', else 'user'
// ─────────────────────────────────────────────────────────────────

var AuthService = (function () {

  var SESSION_KEY = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.USER_SESSION_KEY)
    ? APP_CONFIG.USER_SESSION_KEY
    : 'ai_user_session';

  // ── Role resolution ──────────────────────────────────────────────
  function _resolveRole(email) {
    var adminList = ((typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ADMIN_EMAILS) || [])
      .map(function (e) { return String(e).toLowerCase().trim(); });
    return adminList.indexOf(email.toLowerCase().trim()) !== -1 ? 'admin' : 'user';
  }

  // Build display name from email local-part
  function _buildDisplayName(email) {
    return email.split('@')[0]
      .split(/[._-]/)
      .map(function (s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; })
      .join(' ')
      .trim() || email;
  }

  // ── Storage helpers ──────────────────────────────────────────────
  function _save(user) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      // Backward compat: keep legacy ADMIN_SESSION_KEY for dashboard.js fallback
      if (user.role === 'admin'
          && typeof APP_CONFIG !== 'undefined'
          && APP_CONFIG.ADMIN_SESSION_KEY) {
        sessionStorage.setItem(APP_CONFIG.ADMIN_SESSION_KEY, user.email);
      }
    } catch (e) { /* storage unavailable — session won't persist */ }
  }

  function _clear() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    try {
      if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ADMIN_SESSION_KEY) {
        sessionStorage.removeItem(APP_CONFIG.ADMIN_SESSION_KEY);
      }
    } catch (e) {}
  }

  // ── Public API ───────────────────────────────────────────────────
  return {

    /**
     * Login with email.
     * Returns { success: true, user } or { success: false, error: string }
     * To extend: add real provider call here, keep return contract identical.
     */
    login: function (email) {
      var emailTrimmed = String(email || '').trim();
      if (!emailTrimmed) {
        return { success: false, error: 'Vui lòng nhập email công việc' };
      }
      if (!/^\S+@\S+\.\S+$/.test(emailTrimmed)) {
        return { success: false, error: 'Email không đúng định dạng (VD: ten.ho@company.com)' };
      }
      var user = {
        email:       emailTrimmed,
        displayName: _buildDisplayName(emailTrimmed),
        role:        _resolveRole(emailTrimmed),
        loginAt:     new Date().toISOString()
      };
      _save(user);
      return { success: true, user: user };
    },

    logout: function () { _clear(); },

    getUser: function () {
      try {
        var raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },

    isLoggedIn: function () { return !!this.getUser(); },

    isAdmin: function () {
      var u = this.getUser();
      return !!(u && u.role === 'admin');
    },

    /**
     * Redirect to login if not authenticated.
     * Call at page init — returns false if redirect was issued.
     */
    requireAuth: function () {
      if (!this.isLoggedIn()) {
        var ret = encodeURIComponent(window.location.pathname.replace(/^\//, '') + window.location.search);
        window.location.replace('login.html?return=' + ret);
        return false;
      }
      return true;
    },

    /**
     * Redirect to portal if not admin (also covers not-logged-in → login).
     */
    requireAdmin: function () {
      if (!this.requireAuth()) return false;
      if (!this.isAdmin()) {
        window.location.replace('index.html');
        return false;
      }
      return true;
    }
  };
})();
