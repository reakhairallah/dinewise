const RESERVATIONS_KEY = 'dinewise_reservations_v1';

// CLAUDE.md's booking cap — max active reservations per guest. Same category
// as pricing.js's MEMBERSHIP_QUALIFYING_PRIOR_COUNT: a business rule, not a
// generic utility, so it lives beside the data it's a rule about.
const ACTIVE_BOOKINGS_CAP = 3;

const Reservations = {
  list() {
    return Storage.list(RESERVATIONS_KEY);
  },

  listForGuest(guestId) {
    return this.list().filter((reservation) => reservation.guestId === guestId);
  },

  get(id) {
    return this.list().find((reservation) => reservation.id === id) ?? null;
  },

  // Active or past, all of them — membership status is recalculated fresh
  // per booking from this count, never stored as a profile flag.
  countForGuest(guestId) {
    return this.listForGuest(guestId).length;
  },

  save(reservation) {
    const reservations = this.list();
    reservations.push(reservation);
    Storage.set(RESERVATIONS_KEY, reservations);
    return reservation;
  },
};

// Reservations dated in the future, for this guest — shared by Dashboard's
// active-bookings ring and Restaurant View's Book Now gate, so both read
// the same limit off the same count.
const getActiveReservationCount = (guestId) => {
  const now = new Date();
  return Reservations.listForGuest(guestId).filter((reservation) => new Date(reservation.dateTime) > now).length;
};
