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
      openTime: '17:00',
      closeTime: '23:00',
      rating: 4.7,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Locally Sourced', 'Zero Food Waste'],
      allergenCautions: ['Nuts', 'Gluten'],
      dietaryBadges: [],
      tableLayout: createTableLayout([2, 2, 4, 4, 6, 8]),
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
      photoUrl: 'https://picsum.photos/seed/salt-tide/900/600',
      title: 'Salt & Tide',
      cuisine: 'Seafood',
      openTime: '16:30',
      closeTime: '22:30',
      rating: 4.5,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Sustainable Seafood', 'Compostable Packaging'],
      allergenCautions: ['Shellfish', 'Fish'],
      dietaryBadges: ['Gluten-Free-Friendly'],
      tableLayout: createTableLayout([2, 2, 2, 4, 4, 6]),
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
      photoUrl: 'https://picsum.photos/seed/lumen-table/900/600',
      title: 'Lumen Table',
      cuisine: 'French',
      openTime: '17:30',
      closeTime: '23:30',
      rating: 4.8,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Farm-to-Table', 'Locally Sourced'],
      allergenCautions: ['Dairy', 'Gluten'],
      dietaryBadges: ['Vegetarian-Friendly'],
      tableLayout: createTableLayout([2, 2, 4, 4, 6]),
      pricing: {
        basePrice: 35,
      },
      menuItems: [
        { id: crypto.randomUUID(), category: 'Starters', name: 'Duck Liver Parfait', description: 'Brioche, fig compote, port reduction.', price: 22 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Coq au Vin', description: 'Braised chicken, pearl onion, red wine jus.', price: 46 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Seared Duck Breast', description: 'Cherry gastrique, root vegetable purée.', price: 54 },
        { id: crypto.randomUUID(), category: 'Desserts', name: 'Chocolate Soufflé', description: 'Warm dark chocolate, crème anglaise.', price: 16 },
      ],
    },
    {
      id: crypto.randomUUID(),
      photoUrl: 'https://picsum.photos/seed/trattoria-rosa/900/600',
      title: 'Trattoria Rosa',
      cuisine: 'Italian',
      openTime: '12:00',
      closeTime: '22:00',
      rating: 4.3,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Locally Sourced'],
      allergenCautions: ['Gluten', 'Dairy', 'Eggs'],
      dietaryBadges: ['Vegetarian-Friendly', 'Vegan-Friendly'],
      tableLayout: createTableLayout([2, 2, 2, 4, 6]),
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
      photoUrl: 'https://picsum.photos/seed/koan/900/600',
      title: 'Kōan',
      cuisine: 'Japanese',
      openTime: '18:00',
      closeTime: '21:30',
      rating: 4.9,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Sustainable Seafood', 'Zero Food Waste'],
      allergenCautions: ['Shellfish', 'Soy', 'Fish'],
      dietaryBadges: ['Gluten-Free-Friendly'],
      tableLayout: createTableLayout([2, 2, 4]),
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
    {
      id: crypto.randomUUID(),
      photoUrl: 'https://picsum.photos/seed/verdant-table/900/600',
      title: 'Verdant Table',
      cuisine: 'Mediterranean',
      openTime: '11:00',
      closeTime: '21:00',
      rating: 4.4,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Farm-to-Table', 'Zero Food Waste', 'Compostable Packaging'],
      allergenCautions: ['Nuts', 'Sesame'],
      dietaryBadges: ['Vegetarian-Friendly', 'Vegan-Friendly', 'Gluten-Free-Friendly'],
      tableLayout: createTableLayout([2, 2, 4, 4]),
      pricing: {
        basePrice: 15,
      },
      menuItems: [
        { id: crypto.randomUUID(), category: 'Starters', name: 'Whipped Hummus Trio', description: 'Beet, roasted garlic, harissa; warm pita.', price: 14 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Charred Cauliflower Steak', description: 'Tahini, pomegranate, toasted pistachio.', price: 24 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Grilled Halloumi Bowl', description: 'Farro, roasted vegetables, sumac vinaigrette.', price: 22 },
        { id: crypto.randomUUID(), category: 'Desserts', name: 'Orange Blossom Semolina Cake', description: 'Citrus syrup, candied pistachio.', price: 11 },
      ],
    },
    {
      id: crypto.randomUUID(),
      photoUrl: 'https://picsum.photos/seed/saffron-house/900/600',
      title: 'Saffron House',
      cuisine: 'Indian',
      openTime: '17:00',
      closeTime: '22:30',
      rating: 4.2,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Locally Sourced'],
      allergenCautions: ['Dairy', 'Nuts', 'Gluten'],
      dietaryBadges: ['Vegetarian-Friendly', 'Vegan-Friendly', 'Halal-Friendly'],
      tableLayout: createTableLayout([2, 4, 4, 6, 8]),
      pricing: {
        basePrice: 16,
      },
      menuItems: [
        { id: crypto.randomUUID(), category: 'Starters', name: 'Tandoori Vegetable Skewers', description: 'Charred peppers, paneer, mint chutney.', price: 15 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Lamb Rogan Josh', description: 'Kashmiri chili, yogurt, basmati rice.', price: 32 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Chana Masala', description: 'Slow-simmered chickpeas, tomato, ginger.', price: 21 },
        { id: crypto.randomUUID(), category: 'Desserts', name: 'Saffron Kulfi', description: 'Pistachio, cardamom, rosewater.', price: 10 },
      ],
    },
    {
      id: crypto.randomUUID(),
      photoUrl: 'https://picsum.photos/seed/casa-marisol/900/600',
      title: 'Casa Marisol',
      cuisine: 'Mexican',
      openTime: '12:00',
      closeTime: '23:00',
      rating: 4.6,
      distanceMiles: randomDistance(0.4, 6),
      sustainabilityBadges: ['Locally Sourced', 'Compostable Packaging'],
      allergenCautions: ['Dairy', 'Corn'],
      dietaryBadges: ['Vegetarian-Friendly', 'Gluten-Free-Friendly'],
      tableLayout: createTableLayout([2, 2, 4, 4, 6]),
      pricing: {
        basePrice: 18,
      },
      menuItems: [
        { id: crypto.randomUUID(), category: 'Starters', name: 'Esquites', description: 'Charred corn, cotija, chili-lime crema.', price: 12 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Al Pastor Tacos', description: 'Achiote-marinated pork, pineapple, cilantro.', price: 24 },
        { id: crypto.randomUUID(), category: 'Mains', name: 'Mole Poblano Enchiladas', description: 'Slow-simmered mole, queso fresco.', price: 27 },
        { id: crypto.randomUUID(), category: 'Desserts', name: 'Churros con Chocolate', description: 'Cinnamon sugar, dark chocolate dip.', price: 9 },
      ],
    },
  ];
}
