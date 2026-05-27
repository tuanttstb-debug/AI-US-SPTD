const Storage = {
  save: (data) => {
    localStorage.setItem(APP_CONFIG.AUTO_SAVE_KEY, JSON.stringify(data));
  },
  load: () => {
    const raw = localStorage.getItem(APP_CONFIG.AUTO_SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  clear: () => {
    localStorage.removeItem(APP_CONFIG.AUTO_SAVE_KEY);
  }
};
