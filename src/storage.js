
const safeLocalStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }
};

export const storage = {
  async get(key) {
    const value = safeLocalStorage.getItem(key);
    return value ? { value } : null;
  },
  async set(key, value) {
    safeLocalStorage.setItem(key, value);
  }
};