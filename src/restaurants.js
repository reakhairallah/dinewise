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

const Restaurants = {
  list() {
    return Storage.list(RESTAURANTS_KEY);
  },

  formatHours(restaurant) {
    return `${formatTime12h(restaurant.openTime)} – ${formatTime12h(restaurant.closeTime)}`;
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
