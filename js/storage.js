const Storage = {
  get(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  list(key) {
    return this.get(key) ?? [];
  },
};
