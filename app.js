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

// Fixed pool of near-term dinner slots used to pre-lock a random subset of
// tables at seed time. This only ever runs once (see Restaurants.seed above),
// after which the resulting lock state is persisted and never regenerated.
const SEED_SLOT_POOL = [
  '2026-07-12T18:00', '2026-07-12T19:00', '2026-07-12T20:00',
  '2026-07-13T18:00', '2026-07-13T19:00', '2026-07-13T20:00',
  '2026-07-14T18:00', '2026-07-14T19:00', '2026-07-14T20:00',
  '2026-07-15T18:00', '2026-07-15T19:00', '2026-07-15T20:00',
];

const createTable = (capacity) => {
  const locks = {};
  const lockCount = Math.floor(Math.random() * 3); // 0-2 pre-locked slots

  for (let i = 0; i < lockCount; i += 1) {
    const slot = SEED_SLOT_POOL[Math.floor(Math.random() * SEED_SLOT_POOL.length)];
    locks[slot] = true;
  }

  return { id: crypto.randomUUID(), capacity, locks };
};

const createTableLayout = (capacities) => capacities.map(createTable);

const randomDistance = (min, max) => Math.round((Math.random() * (max - min) + min) * 10) / 10;

function buildSeedRestaurants() {
  return [
    {
      id: crypto.randomUUID(),
      photoUrl: 'https://picsum.photos/seed/ember-oak/900/600',
      title: 'Ember & Oak',
      cuisine: 'Steakhouse',
      hours: '5:00 PM – 11:00 PM',
      rating: 4.7,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Locally Sourced', 'Zero Food Waste'],
      allergenBadges: ['Contains Nuts', 'Gluten Present'],
      tableLayout: createTableLayout([2, 2, 4, 4, 6, 8]),
      pricing: {
        basePrice: 85,
        peakMultiplier: 1.3,
        offPeakMultiplier: 0.9,
      },
      menuItems: [
        { id: crypto.randomUUID(), category: 'Starters', name: 'Charred Bone Marrow', description: 'Roasted marrow, herb gremolata, grilled sourdough.', price: 18 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Dry-Aged Ribeye', description: '28-day dry-aged ribeye, smoked salt, red wine jus.', price: 68 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Whole Roasted Branzino', description: 'Citrus, fennel, charred olive oil.', price: 42 },
        { id: crypto.randomUUID(), category: 'Desserts', name: 'Burnt Basque Cheesecake', description: 'Caramelized crust, vanilla bean, sea salt.', price: 14 },
      ],
    },
    {
      id: crypto.randomUUID(),
      photoUrl: 'https://picsum.photos/seed/salt-tide/900/600',
      title: 'Salt & Tide',
      cuisine: 'Seafood',
      hours: '4:30 PM – 10:30 PM',
      rating: 4.5,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Sustainable Seafood', 'Compostable Packaging'],
      allergenBadges: ['Contains Shellfish', 'Contains Fish'],
      tableLayout: createTableLayout([2, 2, 2, 4, 4, 6]),
      pricing: {
        basePrice: 65,
        peakMultiplier: 1.25,
        offPeakMultiplier: 0.85,
      },
      menuItems: [
        { id: crypto.randomUUID(), category: 'Starters', name: 'Chilled Oyster Trio', description: 'Mignonette, horseradish, citrus.', price: 21 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Miso-Glazed Black Cod', description: 'Charred bok choy, ginger scallion oil.', price: 48 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Lobster Linguine', description: 'Butter-poached lobster, chili, lemon.', price: 52 },
        { id: crypto.randomUUID(), category: 'Desserts', name: 'Yuzu Panna Cotta', description: 'Candied ginger, shortbread crumble.', price: 13 },
      ],
    },
    {
      id: crypto.randomUUID(),
      photoUrl: 'https://picsum.photos/seed/lumen-table/900/600',
      title: 'Lumen Table',
      cuisine: 'French',
      hours: '5:30 PM – 11:30 PM',
      rating: 4.8,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Farm-to-Table', 'Locally Sourced'],
      allergenBadges: ['Contains Dairy', 'Contains Gluten'],
      tableLayout: createTableLayout([2, 2, 4, 4, 6]),
      pricing: {
        basePrice: 95,
        peakMultiplier: 1.35,
        offPeakMultiplier: 0.9,
      },
      menuItems: [
        { id: crypto.randomUUID(), category: 'Starters', name: 'Duck Liver Parfait', description: 'Brioche, fig compote, port reduction.', price: 22 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Coq au Vin', description: 'Braised chicken, pearl onion, red wine jus.', price: 46 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Seared Duck Breast', description: 'Cherry gastrique, root vegetable purée.', price: 54 },
        { id: crypto.randomUUID(), category: 'Desserts', name: 'Chocolate Soufflé', description: 'Warm dark chocolate, crème anglaise.', price: 16 },
      ],
    },
  ];
}
const UI = {
  init() {
    this.form = document.getElementById('signup-form');
    this.fields = {
      name: document.getElementById('field-name'),
      email: document.getElementById('field-email'),
      phone: document.getElementById('field-phone'),
    };
    this.guestOnlyFields = document.getElementById('guest-only-fields');
    this.roleError = document.getElementById('role-error');

    this.prefillFromProfile();
    this.updateGuestFieldsVisibility();
    this.form.addEventListener('submit', (event) => this.handleSignupSubmit(event));
    this.form.querySelectorAll('input[name="role"]').forEach((input) => {
      input.addEventListener('change', () => {
        this.updateGuestFieldsVisibility();
        this.roleError.hidden = true;
      });
    });
  },

  updateGuestFieldsVisibility() {
    const role = this.getCheckedValue('role');
    this.guestOnlyFields.hidden = role !== 'customer';
  },

  prefillFromProfile() {
    const guest = Storage.get('dinewise_guest_v1');
    if (!guest) return;

    this.fields.name.value = guest.name ?? '';
    this.fields.email.value = guest.email ?? '';
    this.fields.phone.value = guest.phone ?? '';
    this.setCheckedValues('favoriteCuisines', guest.favoriteCuisines);
    this.setCheckedValues('dietaryTags', guest.dietaryTags);
  },

  setCheckedValues(name, values = []) {
    this.form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.checked = values.includes(input.value);
    });
  },

  setCheckedValue(name, value) {
    if (!value) return;
    const input = this.form.querySelector(`input[name="${name}"][value="${value}"]`);
    if (input) input.checked = true;
  },

  getCheckedValues(name) {
    return [...this.form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
  },

  getCheckedValue(name) {
    const checked = this.form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : null;
  },

  handleSignupSubmit(event) {
    event.preventDefault();

    const role = this.getCheckedValue('role');
    if (!role) {
      this.roleError.hidden = false;
      this.roleError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const existingGuest = Storage.get('dinewise_guest_v1');

    const guest = {
      id: existingGuest?.id ?? crypto.randomUUID(),
      name: this.fields.name.value.trim(),
      email: this.fields.email.value.trim(),
      phone: this.fields.phone.value.trim(),
      favoriteCuisines: this.getCheckedValues('favoriteCuisines'),
      dietaryTags: this.getCheckedValues('dietaryTags'),
    };

    Storage.set('dinewise_guest_v1', guest);
    Storage.set('dinewise_session_v1', { role });

    this.goToRoleScreen(role);
  },

  goToRoleScreen(role) {
    // Explore (customer) and Admin Dashboard (admin) screens don't exist yet —
    // this is the single hook later screens will replace.
    console.log(`Signed in as ${role}.`, Storage.get('dinewise_guest_v1'));
  },
};
document.addEventListener('DOMContentLoaded', () => {
  Restaurants.seed();
  UI.init();
});
