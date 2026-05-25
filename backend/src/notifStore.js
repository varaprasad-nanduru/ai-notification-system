const store = new Map();
const order = [];

export const notifStore = {
  add(notification) {
    store.set(notification.id, notification);
    order.unshift(notification.id);
  },

  get(id) {
    return store.get(id) ?? null;
  },

  getAll() {
    return order.filter(id => store.has(id)).map(id => store.get(id));
  },

  markRead(id) {
    const notif = store.get(id);
    if (!notif) return null;
    notif.is_read = true;
    return notif;
  },

  markUnread(id) {
    const notif = store.get(id);
    if (!notif) return null;
    notif.is_read = false;
    return notif;
  },

  delete(id) {
    store.delete(id);
    const idx = order.indexOf(id);
    if (idx !== -1) order.splice(idx, 1);
  },

  get unreadCount() {
    return [...store.values()].filter(n => !n.is_read).length;
  },
};
