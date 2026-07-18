const RESERVATIONS_KEY = 'dinewise_reservations_v1';

const Reservations = {
  list() {
    return Storage.list(RESERVATIONS_KEY);
  },

  listForGuest(guestId) {
    return this.list().filter((reservation) => reservation.guestId === guestId);
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
