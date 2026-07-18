const WAITLIST_KEY = 'dinewise_waitlist_v1';

const Waitlist = {
  list() {
    return Storage.list(WAITLIST_KEY);
  },

  // Always created with status 'waiting' — no randomization, no starting out
  // 'ready'. Promotion to 'ready' only ever happens later via an explicit
  // admin action (see CLAUDE.md), never as part of joining.
  join({ restaurantId, dateTime, guestId, partySize }) {
    const entries = this.list();
    const entry = {
      id: crypto.randomUUID(),
      restaurantId,
      dateTime,
      guestId,
      partySize,
      status: 'waiting',
    };

    entries.push(entry);
    Storage.set(WAITLIST_KEY, entries);
    return entry;
  },
};
