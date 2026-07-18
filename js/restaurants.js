const RESTAURANTS_KEY = 'dinewise_restaurants_v1';

// '17:30' -> '5:30 PM'. Single source of truth for hours display — restaurant
// records only store openTime/closeTime, never a hand-written hours string
// that could drift out of sync with them.
const formatTime12h = (time24) => {
  const [hourStr, minute] = time24.split(':');
  const hour = Number(hourStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = ((hour + 11) % 12) + 1;
  return `${hour12}:${minute} ${period}`;
};

// Shared by anything that needs to do arithmetic on 'HH:MM' strings
// (reservation time-slot generation here, Pricing's peak-window math).
const timeToMinutes = (time) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

const minutesToTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

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
