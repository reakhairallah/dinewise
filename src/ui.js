/* =========================================================
   Shared DOM helpers — used by more than one UI sub-module below.
   ========================================================= */
const renderBadges = (values, chipClass = '') => values
  .map((value) => `<span class="chip ${chipClass}">${value}</span>`)
  .join('');

const setCheckedValues = (root, name, values = []) => {
  root.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = values.includes(input.value);
  });
};

const getCheckedValues = (root, name) => [...root.querySelectorAll(`input[name="${name}"]:checked`)]
  .map((input) => input.value);

const getCheckedValue = (root, name) => {
  const checked = root.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : null;
};

const groupMenuItemsByCategory = (menuItems) => menuItems.reduce((groups, item) => {
  (groups[item.category] ??= []).push(item);
  return groups;
}, {});

// Renders a restaurant's menu grouped by category. Read-only by default
// (Restaurant View's "View Menu" toggle); Book Now's pre-order section can
// later reuse this and pass `renderItemExtra` to inject selection controls
// (checkbox, quantity stepper, etc.) per item without duplicating the markup.
const renderMenuSections = (menuItems, { renderItemExtra } = {}) => Object.entries(groupMenuItemsByCategory(menuItems))
  .map(([category, items]) => `
    <div class="menu-category">
      <p class="menu-category-title text-label-caps">${category}</p>
      <ul class="menu-list">
        ${items.map((item) => `
          <li class="menu-item">
            <span class="menu-item-name">${item.name}</span>
            ${renderItemExtra ? renderItemExtra(item) : ''}
            <span class="menu-item-price">$${item.price}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');

// Strips the suffixes guest tags/restaurant badges use around the same
// underlying concept (e.g. 'vegan' vs 'Vegan-Friendly', 'gluten-free' vs
// 'Gluten') so the two vocabularies can be compared directly.
const normalizeTag = (value) => value
  .toLowerCase()
  .replace(/-friendly$/, '')
  .replace(/-allergy$/, '')
  .replace(/-free$/, '');

// Counts how many of the guest's tags refer to the same thing as one of the
// restaurant's badges. Used for both dietary preferences and allergy cautions —
// it's a plain overlap check either way; which array is passed in is what
// decides whether an overlap is a good sign or a bad one, not this function.
const countTagOverlap = (guestTags = [], restaurantTags = []) => {
  const normalizedRestaurantTags = restaurantTags.map(normalizeTag);
  return guestTags
    .map(normalizeTag)
    .filter((tag) => normalizedRestaurantTags.some((other) => tag === other || tag.includes(other) || other.includes(tag)))
    .length;
};

const CUISINE_MATCH_SCORE = 2;
const DIETARY_MATCH_SCORE = 1;
const ALLERGY_CAUTION_PENALTY = 1;

const hasProfileSignal = (guest) => Boolean(
  guest?.favoriteCuisines?.length || guest?.dietaryPreferences?.length || guest?.allergyTags?.length,
);

// Higher score = better match. Favorite cuisine matching is worth more than a
// dietary-preference match; an allergy caution overlap pulls the score down
// rather than excluding the restaurant, since we're sorting, not filtering.
const matchScore = (restaurant, guest) => {
  let score = 0;

  if (guest.favoriteCuisines?.some((cuisine) => cuisine.toLowerCase() === restaurant.cuisine.toLowerCase())) {
    score += CUISINE_MATCH_SCORE;
  }

  score += countTagOverlap(guest.dietaryPreferences, restaurant.dietaryBadges) * DIETARY_MATCH_SCORE;
  score -= countTagOverlap(guest.allergyTags, restaurant.allergenCautions) * ALLERGY_CAUTION_PENALTY;

  return score;
};

// Closes any open element matching `selector` (a <details>) when a click lands
// outside it. Returns the matched elements so callers can reuse the NodeList.
const closeOnOutsideClick = (selector) => {
  const elements = document.querySelectorAll(selector);
  document.addEventListener('click', (event) => {
    elements.forEach((element) => {
      if (element.open && !element.contains(event.target)) element.removeAttribute('open');
    });
  });
  return elements;
};

/* =========================================================
   UI — one namespace object per CLAUDE.md's file convention.
   Internally split into independent sub-modules, one per concern:
   Signup (the sign-up form), Nav (top nav chrome), Filters (Explore's
   filter chips), Router (screen visibility/navigation), Explore
   (restaurant card rendering), RestaurantView (the overlay a card opens).
   Each wires itself up in its own init().
   ========================================================= */
const UI = {
  init() {
    this.Signup.init();
    this.Nav.init();
    this.Filters.init();
    this.Explore.init();
    this.RestaurantView.init();
    this.Router.routeInitial();
  },

  /* ----- Sign Up / Role Picker form ----- */
  Signup: {
    init() {
      this.form = document.getElementById('signup-form');
      this.fields = {
        name: document.getElementById('field-name'),
        email: document.getElementById('field-email'),
        phone: document.getElementById('field-phone'),
      };
      this.guestOnlyFields = document.getElementById('guest-only-fields');
      this.roleError = document.getElementById('role-error');

      this.prefill();
      this.updateGuestFieldsVisibility();
      this.form.addEventListener('submit', (event) => this.handleSubmit(event));
      this.form.querySelectorAll('input[name="role"]').forEach((input) => {
        input.addEventListener('change', () => this.handleRoleChange(input));
      });
    },

    handleRoleChange(input) {
      this.updateGuestFieldsVisibility();
      this.roleError.hidden = true;
      if (input.value === 'customer' && input.checked) {
        this.guestOnlyFields.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },

    updateGuestFieldsVisibility() {
      const role = getCheckedValue(this.form, 'role');
      this.guestOnlyFields.hidden = role !== 'customer';
    },

    prefill() {
      const guest = Storage.get('dinewise_guest_v1');
      if (!guest) return;

      this.fields.name.value = guest.name ?? '';
      this.fields.email.value = guest.email ?? '';
      this.fields.phone.value = guest.phone ?? '';
      setCheckedValues(this.form, 'favoriteCuisines', guest.favoriteCuisines);
      setCheckedValues(this.form, 'dietaryPreferences', guest.dietaryPreferences);
      setCheckedValues(this.form, 'allergyTags', guest.allergyTags);
    },

    // Returns the selected role, or null (and surfaces the inline error) if none picked.
    validateRole() {
      const role = getCheckedValue(this.form, 'role');
      if (!role) {
        this.roleError.hidden = false;
        this.roleError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return role;
    },

    buildGuestFromForm() {
      const existingGuest = Storage.get('dinewise_guest_v1');
      return {
        id: existingGuest?.id ?? crypto.randomUUID(),
        name: this.fields.name.value.trim(),
        email: this.fields.email.value.trim(),
        phone: this.fields.phone.value.trim(),
        favoriteCuisines: getCheckedValues(this.form, 'favoriteCuisines'),
        dietaryPreferences: getCheckedValues(this.form, 'dietaryPreferences'),
        allergyTags: getCheckedValues(this.form, 'allergyTags'),
      };
    },

    persist(guest, role) {
      Storage.set('dinewise_guest_v1', guest);
      Storage.set('dinewise_session_v1', { role });
    },

    handleSubmit(event) {
      event.preventDefault();

      const role = this.validateRole();
      if (!role) return;

      const guest = this.buildGuestFromForm();
      this.persist(guest, role);

      UI.Nav.renderProfile();
      UI.Router.goToRole(role);
    },

    // Blanks the role picker and hides guest-only fields; profile fields are
    // left as-is since Log Out never clears/duplicates the underlying profile.
    reset() {
      this.form.querySelectorAll('input[name="role"]').forEach((input) => { input.checked = false; });
      this.updateGuestFieldsVisibility();
      this.roleError.hidden = true;
    },
  },

  /* ----- Top nav bar chrome ----- */
  Nav: {
    init() {
      this.avatarInitials = document.getElementById('nav-avatar-initials');
      this.renderProfile();
      document.getElementById('nav-logout')?.addEventListener('click', () => UI.Router.logout());
      closeOnOutsideClick('.nav-dropdown');
    },

    renderProfile() {
      if (!this.avatarInitials) return;

      const name = Storage.get('dinewise_guest_v1')?.name?.trim();
      const initials = name
        ? name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join('')
        : 'G';

      this.avatarInitials.textContent = initials;
    },

    closeDropdowns() {
      document.querySelectorAll('.nav-dropdown').forEach((dropdown) => dropdown.removeAttribute('open'));
    },
  },

  /* ----- Explore screen's filter chips ----- */
  Filters: {
    init() {
      const filterChips = closeOnOutsideClick('.filter-chip');
      filterChips.forEach((chip) => {
        chip.addEventListener('toggle', () => {
          if (!chip.open) return;
          filterChips.forEach((other) => {
            if (other !== chip) other.removeAttribute('open');
          });
        });
      });

    },
  },

  /* ----- Screen visibility / navigation ----- */
  Router: {
    showScreen(screenId) {
      document.querySelectorAll('.screen').forEach((screen) => {
        screen.hidden = screen.id !== screenId;
      });
      window.scrollTo(0, 0);
    },

    goToRole(role) {
      if (role === 'customer') {
        this.showScreen('screen-explore');
        return;
      }

      // Admin Dashboard doesn't exist yet — this is the hook it will replace.
      console.log(`Signed in as ${role}.`, Storage.get('dinewise_guest_v1'));
    },

    routeInitial() {
      const guest = Storage.get('dinewise_guest_v1');
      const session = Storage.get('dinewise_session_v1');
      if (!guest || !session?.role) return;

      this.goToRole(session.role);
    },

    logout() {
      Storage.set('dinewise_session_v1', null);
      UI.Signup.reset();
      UI.Nav.closeDropdowns();
      this.showScreen('screen-signup');
    },
  },

  /* ----- Explore screen's restaurant grid ----- */
  Explore: {
    init() {
      this.message = document.getElementById('smart-pick-message');
      this.recommendedId = null;

      this.render();
      this.bindCardOpen();
      document.getElementById('smart-pick-action')?.addEventListener('click', () => this.recommend());
    },

    render(restaurants = Restaurants.list()) {
      const grid = document.getElementById('restaurant-grid');
      if (!grid) return;

      grid.innerHTML = restaurants.map((restaurant) => this.renderCard(restaurant)).join('');
    },

    // Sorts (never hides) the list by match score against the guest's profile.
    // If the guest hasn't set any favorite cuisines, dietary preferences, or
    // allergy tags, there's nothing to score against — prompt instead of
    // sorting on nothing.
    recommend() {
      const guest = Storage.get('dinewise_guest_v1');

      if (!hasProfileSignal(guest)) {
        this.message.hidden = false;
        this.message.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      this.message.hidden = true;

      const ranked = [...Restaurants.list()].sort((a, b) => matchScore(b, guest) - matchScore(a, guest));
      this.recommendedId = ranked[0]?.id ?? null;
      this.render(ranked);
    },

    // Event-delegated so it keeps working after render() replaces the grid's innerHTML.
    bindCardOpen() {
      const grid = document.getElementById('restaurant-grid');
      if (!grid) return;

      const openCardFromEvent = (event) => {
        const card = event.target.closest('[data-restaurant-id]');
        if (!card) return;

        const restaurant = Restaurants.get(card.dataset.restaurantId);
        if (restaurant) UI.RestaurantView.open(restaurant);
      };

      grid.addEventListener('click', openCardFromEvent);
      grid.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openCardFromEvent(event);
      });
    },

    renderCard(restaurant) {
      const isRecommended = restaurant.id === this.recommendedId;

      return `
        <article class="card${isRecommended ? ' is-recommended' : ''}" data-restaurant-id="${restaurant.id}" tabindex="0" role="button" aria-label="View ${restaurant.title}">
          ${isRecommended ? '<span class="card-recommended-badge">Recommended For You</span>' : ''}
          <img class="card-image" src="${restaurant.photoUrl}" alt="${restaurant.title}" />
          <div class="card-body">
            <h3 class="card-title">${restaurant.title}</h3>
            <p class="text-body-md card-meta">
              <span>${restaurant.cuisine}</span>
              <span aria-hidden="true">·</span>
              <span>${restaurant.hours}</span>
            </p>
            <p class="text-body-md card-meta">
              <span class="card-rating">★ ${restaurant.rating}</span>
              <span aria-hidden="true">·</span>
              <span>${restaurant.distanceMiles} mi</span>
            </p>
            <div class="card-badges">
              ${renderBadges(restaurant.sustainabilityBadges)}
              ${renderBadges(restaurant.dietaryBadges, 'chip-dietary')}
              ${renderBadges(restaurant.allergenCautions, 'chip-allergen')}
            </div>
          </div>
        </article>
      `;
    },
  },

  /* ----- Restaurant View overlay (sits on top of Explore, doesn't replace it) ----- */
  RestaurantView: {
    init() {
      this.overlay = document.getElementById('restaurant-view-overlay');
      this.photo = document.getElementById('restaurant-view-photo');
      this.title = document.getElementById('restaurant-view-title');
      this.cuisine = document.getElementById('restaurant-view-cuisine');
      this.hours = document.getElementById('restaurant-view-hours');
      this.rating = document.getElementById('restaurant-view-rating');
      this.badges = document.getElementById('restaurant-view-badges');
      this.menu = document.getElementById('restaurant-view-menu');

      document.getElementById('restaurant-view-close')?.addEventListener('click', () => this.close());
    },

    open(restaurant) {
      this.photo.src = restaurant.photoUrl;
      this.photo.alt = restaurant.title;
      this.title.textContent = restaurant.title;
      this.cuisine.textContent = restaurant.cuisine;
      this.hours.textContent = restaurant.hours;
      this.rating.textContent = `★ ${restaurant.rating}`;
      this.badges.innerHTML = renderBadges(restaurant.sustainabilityBadges)
        + renderBadges(restaurant.dietaryBadges, 'chip-dietary')
        + renderBadges(restaurant.allergenCautions, 'chip-allergen');
      this.menu.innerHTML = renderMenuSections(restaurant.menuItems);

      // Explore stays mounted/unhidden underneath — no screen swap, so its
      // scroll position is preserved for free; nothing to save or restore.
      // (Deliberately not locking body scroll here: toggling overflow removes
      // the scrollbar and reflows the page, which drifts the scroll position
      // by the scrollbar's width — exactly what this needs to avoid.)
      this.overlay.hidden = false;
    },

    close() {
      this.overlay.hidden = true;
    },
  },
};
