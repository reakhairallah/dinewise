const RESTAURANTS_KEY = 'dinewise_restaurants_v1';

const Restaurants = {
  list() {
    return Storage.list(RESTAURANTS_KEY);
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
