// Near-term dinner slots used to pre-lock a random subset of tables at seed
// time, built relative to whenever the app actually runs (1-4 days out) so
// they read as plausible "already booked" slots instead of a fixed past
// date. This only ever runs once (see Restaurants.seed), after which the
// resulting lock state is persisted and never regenerated.
const pad2 = (n) => String(n).padStart(2, '0');

const dateTimeSlot = (daysFromNow, hour) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const isoDate = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  return `${isoDate}T${pad2(hour)}:00`;
};

const SEED_SLOT_POOL = [1, 2, 3, 4].flatMap((daysFromNow) => [18, 19, 20].map((hour) => dateTimeSlot(daysFromNow, hour)));

// `number` is purely a per-restaurant display label ("Table 3") — 1-indexed
// by creation order, distinct from `id`, which stays the only thing locks/
// selection logic ever key or match on.
const createTable = (capacity, number) => {
  const locks = {};
  const lockCount = Math.floor(Math.random() * 3); // 0-2 pre-locked slots

  for (let i = 0; i < lockCount; i += 1) {
    const slot = SEED_SLOT_POOL[Math.floor(Math.random() * SEED_SLOT_POOL.length)];
    locks[slot] = true;
  }

  return { id: crypto.randomUUID(), number, capacity, locks };
};

const createTableLayout = (capacities) => capacities.map((capacity, i) => createTable(capacity, i + 1));

const randomDistance = (min, max) => Math.round((Math.random() * (max - min) + min) * 10) / 10;

// Seat counts and hotspot coordinates lifted from reference/ember-oak-table-map.html's
// TABLES array (t1-t10, in that order) — the demo's own ids/status field are throwaway,
// but its seats/xPct/yPct are the real calibrated data for this photo. tableLayout below
// is built from EMBER_OAK_TABLE_SEATS in this same order, so index i in either array
// refers to the same physical table (see buildSeedRestaurants' emberOakTableHotspots).
const EMBER_OAK_TABLE_SEATS = [5, 5, 4, 4, 4, 4, 4, 4, 5, 4];
const EMBER_OAK_HOTSPOT_COORDS = [
  { xPct: 72.6, yPct: 59.1 },
  { xPct: 50.6, yPct: 79.4 },
  { xPct: 30.1, yPct: 71.2 },
  { xPct: 49.8, yPct: 52.6 },
  { xPct: 59.7, yPct: 44.8 },
  { xPct: 47.7, yPct: 40.3 },
  { xPct: 38.7, yPct: 44.4 },
  { xPct: 21.9, yPct: 53.3 },
  { xPct: 33.2, yPct: 38.6 },
  { xPct: 40.9, yPct: 36.2 },
];

// Same approach, from reference/salt-tide-table-map.html's TABLES array
// (t1-t8, in that order).
const SALT_TIDE_TABLE_SEATS = [6, 6, 4, 4, 5, 4, 2, 2];
const SALT_TIDE_HOTSPOT_COORDS = [
  { xPct: 70.6, yPct: 66.0 },
  { xPct: 80.9, yPct: 41.4 },
  { xPct: 18.2, yPct: 47.4 },
  { xPct: 42.3, yPct: 36.6 },
  { xPct: 55.6, yPct: 23.9 },
  { xPct: 66.2, yPct: 20.4 },
  { xPct: 72.2, yPct: 17.4 },
  { xPct: 87.2, yPct: 22.7 },
];

// Same approach, from reference/koan-table-map.html's TABLES array (t1-t9,
// in that order).
const KOAN_TABLE_SEATS = [4, 4, 4, 2, 4, 2, 4, 2, 2];
const KOAN_HOTSPOT_COORDS = [
  { xPct: 26.1, yPct: 75.2 },
  { xPct: 63.9, yPct: 74.3 },
  { xPct: 60.5, yPct: 49.4 },
  { xPct: 46.6, yPct: 49.2 },
  { xPct: 31.5, yPct: 49.2 },
  { xPct: 37.5, yPct: 32.6 },
  { xPct: 51.8, yPct: 32.7 },
  { xPct: 53.7, yPct: 24.7 },
  { xPct: 40.4, yPct: 24.7 },
];

// Same approach, from reference/trattoria-rosa-table-map.html's TABLES array
// (t1-t10, in that order).
const TRATTORIA_ROSA_TABLE_SEATS = [2, 4, 4, 4, 4, 4, 4, 4, 4, 8];
const TRATTORIA_ROSA_HOTSPOT_COORDS = [
  { xPct: 94.7, yPct: 71.1 },
  { xPct: 58.6, yPct: 76.9 },
  { xPct: 10.4, yPct: 78.3 },
  { xPct: 8.3,  yPct: 60.4 },
  { xPct: 8.8,  yPct: 52.6 },
  { xPct: 28.0, yPct: 50.1 },
  { xPct: 42.3, yPct: 46.5 },
  { xPct: 51.9, yPct: 50.5 },
  { xPct: 65.3, yPct: 57.4 },
  { xPct: 37.2, yPct: 58.1 },
];

function buildSeedRestaurants() {
  const emberOakTableLayout = createTableLayout(EMBER_OAK_TABLE_SEATS);
  const emberOakTableHotspots = Object.fromEntries(
    emberOakTableLayout.map((table, i) => [table.id, EMBER_OAK_HOTSPOT_COORDS[i]]),
  );

  const saltTideTableLayout = createTableLayout(SALT_TIDE_TABLE_SEATS);
  const saltTideTableHotspots = Object.fromEntries(
    saltTideTableLayout.map((table, i) => [table.id, SALT_TIDE_HOTSPOT_COORDS[i]]),
  );

  const koanTableLayout = createTableLayout(KOAN_TABLE_SEATS);
  const koanTableHotspots = Object.fromEntries(
    koanTableLayout.map((table, i) => [table.id, KOAN_HOTSPOT_COORDS[i]]),
  );

  const trattoriaRosaTableLayout = createTableLayout(TRATTORIA_ROSA_TABLE_SEATS);
  const trattoriaRosaTableHotspots = Object.fromEntries(
    trattoriaRosaTableLayout.map((table, i) => [table.id, TRATTORIA_ROSA_HOTSPOT_COORDS[i]]),
  );

  return [
    {
      id: crypto.randomUUID(),
      photoUrl: 'assets/restaurants/ember-oak.png',
      title: 'Ember & Oak',
      cuisine: 'Steakhouse',
      openTime: '17:00',
      closeTime: '23:00',
      rating: 4.7,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Locally Sourced', 'Zero Food Waste'],
      allergenCautions: ['Nuts', 'Gluten'],
      dietaryBadges: [],
      tableLayout: emberOakTableLayout,
      tableMapImage: 'assets/restaurants/ember-oak-map.png',
      tableHotspots: emberOakTableHotspots,
      pricing: {
        basePrice: 30,
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
      photoUrl: 'assets/restaurants/salt-tide.png',
      title: 'Salt & Tide',
      cuisine: 'Seafood',
      openTime: '16:30',
      closeTime: '22:30',
      rating: 4.5,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Sustainable Seafood', 'Compostable Packaging'],
      allergenCautions: ['Shellfish', 'Fish'],
      dietaryBadges: ['Gluten-Free-Friendly'],
      tableLayout: saltTideTableLayout,
      tableMapImage: 'assets/restaurants/salt-tide-map.png',
      tableHotspots: saltTideTableHotspots,
      pricing: {
        basePrice: 22,
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
      photoUrl: 'assets/restaurants/trattoria-rosa.png',
      title: 'Trattoria Rosa',
      cuisine: 'Italian',
      openTime: '12:00',
      closeTime: '22:00',
      rating: 4.3,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Locally Sourced'],
      allergenCautions: ['Gluten', 'Dairy', 'Eggs'],
      dietaryBadges: ['Vegetarian-Friendly', 'Vegan-Friendly'],
      tableLayout: trattoriaRosaTableLayout,
      tableMapImage: 'assets/restaurants/trattoria-rosa-map.png',
      tableHotspots: trattoriaRosaTableHotspots,
      pricing: {
        basePrice: 18,
      },
      menuItems: [
        { id: crypto.randomUUID(), category: 'Starters', name: 'Burrata & Heirloom Tomato', description: 'Basil oil, aged balsamic, sea salt.', price: 16 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Tagliatelle al Tartufo', description: 'Fresh egg pasta, black truffle, parmesan.', price: 34 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Eggplant Parmigiana', description: 'Layered eggplant, San Marzano tomato, fior di latte.', price: 26 },
        { id: crypto.randomUUID(), category: 'Desserts', name: 'Classic Tiramisu', description: 'Espresso-soaked ladyfingers, mascarpone.', price: 12 },
      ],
    },
    {
      id: crypto.randomUUID(),
      photoUrl: 'assets/restaurants/koan.png',
      title: 'Kōan',
      cuisine: 'Japanese',
      openTime: '18:00',
      closeTime: '21:30',
      rating: 4.9,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Sustainable Seafood', 'Zero Food Waste'],
      allergenCautions: ['Shellfish', 'Soy', 'Fish'],
      dietaryBadges: ['Gluten-Free-Friendly'],
      tableLayout: koanTableLayout,
      tableMapImage: 'assets/restaurants/koan-map.png',
      tableHotspots: koanTableHotspots,
      pricing: {
        basePrice: 45,
      },
      menuItems: [
        { id: crypto.randomUUID(), category: 'Starters', name: 'Hokkaido Uni', description: 'Sea urchin, shiso, ponzu gelée.', price: 28 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Omakase Nigiri (10pc)', description: 'Chef\'s selection, seasonal catch.', price: 95 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Wagyu Tataki', description: 'A5 wagyu, ponzu, crisped garlic.', price: 62 },
        { id: crypto.randomUUID(), category: 'Desserts', name: 'Matcha Pot de Crème', description: 'Ceremonial matcha, black sesame tuile.', price: 15 },
      ],
    },
  ];
}
