const RESTAURANTS_KEY = 'dinewise_restaurants_v1';

// Spacing between bookable slots, and how long before closing the last one
// can start — both exist so two reservations can never be seated too close
// together to turn the table over, and nobody's seated right at closing.
const TIME_SLOT_INTERVAL_MINUTES = 90;
const LAST_SEATING_BUFFER_MINUTES = 90;

const Restaurants = {
  list() {
    return Storage.list(RESTAURANTS_KEY);
  },

  formatHours(restaurant) {
    return `${formatTime12h(restaurant.openTime)} – ${formatTime12h(restaurant.closeTime)}`;
  },

  // Fixed, evenly-spaced slots derived from this restaurant's own hours —
  // e.g. a short dinner-only window yields fewer slots than a
  // lunch-through-dinner one, rather than every restaurant sharing one
  // identical hardcoded list.
  getTimeSlots(restaurant) {
    const openMinutes = timeToMinutes(restaurant.openTime);
    const lastSlotMinutes = timeToMinutes(restaurant.closeTime) - LAST_SEATING_BUFFER_MINUTES;

    const slots = [];
    for (let minutes = openMinutes; minutes <= lastSlotMinutes; minutes += TIME_SLOT_INTERVAL_MINUTES) {
      slots.push(minutesToTime(minutes));
    }
    return slots;
  },

  // A table is bookable for a given slot if it can seat the party and isn't
  // already locked for that exact dateTime — table availability itself was
  // randomized once at seed time (see seed-data.js), this just reads it.
  isTableAvailable(table, partySize, dateTime) {
    return table.capacity >= partySize && !table.locks[dateTime];
  },

  getAvailableTables(restaurant, partySize, dateTime) {
    return restaurant.tableLayout.filter((table) => this.isTableAvailable(table, partySize, dateTime));
  },

  get(id) {
    return this.list().find((restaurant) => restaurant.id === id) ?? null;
  },

  set(restaurant) {
    const restaurants = this.list();
    const index = restaurants.findIndex((existing) => existing.id === restaurant.id);

    if (index === -1) {
      restaurants.push(restaurant);
    } else {
      restaurants[index] = restaurant;
    }

    Storage.set(RESTAURANTS_KEY, restaurants);
  },

  seed() {
    if (this.list().length > 0) return;
    Storage.set(RESTAURANTS_KEY, buildSeedRestaurants());
  },
};
