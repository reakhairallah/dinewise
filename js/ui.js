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

const hasProfileSignal = (guest) => Boolean(
  guest?.favoriteCuisines?.length || guest?.dietaryPreferences?.length || guest?.allergyTags?.length,
);

const hasAllergyConflict = (restaurant, guest) => countTagOverlap(guest.allergyTags, restaurant.allergenCautions) > 0;

// Higher score = better match. Favorite cuisine matching is worth more than a
// dietary-preference match. Allergy cautions are handled separately in
// compareByRecommendation, not folded into this score.
const matchScore = (restaurant, guest) => {
  let score = 0;

  if (guest.favoriteCuisines?.some((cuisine) => cuisine.toLowerCase() === restaurant.cuisine.toLowerCase())) {
    score += CUISINE_MATCH_SCORE;
  }

  score += countTagOverlap(guest.dietaryPreferences, restaurant.dietaryBadges) * DIETARY_MATCH_SCORE;

  return score;
};

// Allergy-conflict status is the primary sort key — a conflict-free restaurant
// always outranks a conflicting one, no matter the score. Only when both
// restaurants share the same conflict status does match score break the tie.
const compareByRecommendation = (a, b, guest) => {
  const aConflict = hasAllergyConflict(a, guest);
  const bConflict = hasAllergyConflict(b, guest);
  if (aConflict !== bConflict) return aConflict ? 1 : -1;

  return matchScore(b, guest) - matchScore(a, guest);
};

// Local (not UTC) 'YYYY-MM-DD', matching what a <input type="date"> reads/writes.
const toDateInputValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// A table is bookable for a given slot if it can seat the party and isn't
// already locked for that exact dateTime — table availability itself was
// randomized once at seed time (see seed-data.js), this just reads it.
const isTableAvailable = (table, partySize, dateTime) => table.capacity >= partySize && !table.locks[dateTime];

const getAvailableTables = (restaurant, partySize, dateTime) => restaurant.tableLayout
  .filter((table) => isTableAvailable(table, partySize, dateTime));

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
   Guest profile persistence — the one save path for the whole app. Signup
   (initial creation + full edit), Explore's quick-add panel, and Dashboard's
   later Edit Profile all funnel through Guest.save() so a partial update
   (e.g. just tags) never clobbers fields it didn't touch.
   ========================================================= */
const Guest = {
  get() {
    return Storage.get('dinewise_guest_v1');
  },

  save(updates) {
    const existing = this.get();
    const guest = {
      id: existing?.id ?? crypto.randomUUID(),
      name: existing?.name ?? '',
      email: existing?.email ?? '',
      phone: existing?.phone ?? '',
      favoriteCuisines: existing?.favoriteCuisines ?? [],
      dietaryPreferences: existing?.dietaryPreferences ?? [],
      allergyTags: existing?.allergyTags ?? [],
      ...updates,
    };
    Storage.set('dinewise_guest_v1', guest);
    return guest;
  },
};

/* =========================================================
   UI — one namespace object per CLAUDE.md's file convention.
   Internally split into independent sub-modules, one per concern:
   Signup (the sign-up form), Nav (top nav chrome), Filters (Explore's
   filter chips), Router (screen visibility/navigation), Explore
   (restaurant card rendering), RestaurantView (the overlay a card opens),
   BookNow (the screen Restaurant View's Book Now button leads to).
   Each wires itself up in its own init().
   ========================================================= */
const UI = {
  init() {
    this.Signup.init();
    this.Nav.init();
    this.Filters.init();
    this.Explore.init();
    this.RestaurantView.init();
    this.BookNow.init();
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
      const guest = Guest.get();
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

    handleSubmit(event) {
      event.preventDefault();

      const role = this.validateRole();
      if (!role) return;

      Guest.save({
        name: this.fields.name.value.trim(),
        email: this.fields.email.value.trim(),
        phone: this.fields.phone.value.trim(),
        favoriteCuisines: getCheckedValues(this.form, 'favoriteCuisines'),
        dietaryPreferences: getCheckedValues(this.form, 'dietaryPreferences'),
        allergyTags: getCheckedValues(this.form, 'allergyTags'),
      });
      Storage.set('dinewise_session_v1', { role });

      UI.Nav.renderProfile();
      UI.Router.goToRole(role);
    },

    // Blanks the role picker and hides guest-only fields; profile fields are
    // never cleared/duplicated by Log Out, but re-pulled from storage here —
    // prefill() only ran once at page load, so anything saved since then
    // (e.g. Explore's quick-add panel) hasn't reached this form's DOM yet.
    reset() {
      this.prefill();
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

      const name = Guest.get()?.name?.trim();
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
        UI.Explore.reset();
        this.showScreen('screen-explore');
        return;
      }

      // Admin Dashboard doesn't exist yet — this is the hook it will replace.
      console.log(`Signed in as ${role}.`, Guest.get());
    },

    routeInitial() {
      const guest = Guest.get();
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
      this.quickAddChip = document.getElementById('smart-pick-chip');
      this.quickAddPanel = document.getElementById('smart-pick-quickadd');
      this.recommendedId = null;

      this.render();
      this.bindCardOpen();

      // #smart-pick-chip is a plain .filter-chip <details>, so Filters.init()
      // already gives it the same open/close-on-outside-click/mutual-exclusion
      // behavior as the Smart Match chip — nothing extra to wire up for that.
      document.getElementById('smart-pick-action')?.addEventListener('click', (event) => this.handleActionClick(event));
      document.getElementById('smart-pick-quickadd-submit')?.addEventListener('click', () => this.handleQuickAddSubmit());
    },

    render(restaurants = Restaurants.list()) {
      const grid = document.getElementById('restaurant-grid');
      if (!grid) return;

      grid.innerHTML = restaurants.map((restaurant) => this.renderCard(restaurant)).join('');
    },

    // "Find my pick, wisely" is a per-visit action, not persisted state — a
    // fresh arrival at Explore (login, or switching back from Admin) should
    // always start from the unsorted list, not whatever was last ranked.
    reset() {
      this.recommendedId = null;
      this.quickAddChip?.removeAttribute('open');
      this.render();
    },

    // The summary's native click behavior toggles the <details> panel open —
    // exactly what we want when there's nothing saved yet to sort by. But if
    // the guest already has profile signal, there's no reason to show the
    // quick-add panel at all: block the native toggle and just sort.
    handleActionClick(event) {
      const guest = Guest.get();
      if (!hasProfileSignal(guest)) return;

      event.preventDefault();
      this.quickAddChip.removeAttribute('open');
      this.rank(guest);
    },

    rank(guest) {
      const ranked = [...Restaurants.list()].sort((a, b) => compareByRecommendation(a, b, guest));
      this.recommendedId = ranked[0]?.id ?? null;
      this.render(ranked);
    },

    // Same tags-only shape Guest.save() expects elsewhere (Signup, and later
    // Dashboard's Edit Profile) — just scoped to this panel's own inputs.
    // Requires at least one tag to do anything; with none set, this is a
    // no-op — dismissing without saving is just the <details> toggle/outside
    // click, handled natively, never by this method.
    handleQuickAddSubmit() {
      const tags = {
        favoriteCuisines: getCheckedValues(this.quickAddPanel, 'favoriteCuisines'),
        dietaryPreferences: getCheckedValues(this.quickAddPanel, 'dietaryPreferences'),
        allergyTags: getCheckedValues(this.quickAddPanel, 'allergyTags'),
      };
      if (!tags.favoriteCuisines.length && !tags.dietaryPreferences.length && !tags.allergyTags.length) return;

      const guest = Guest.save(tags);
      this.quickAddChip.removeAttribute('open');
      this.rank(guest);
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
              <span>${Restaurants.formatHours(restaurant)}</span>
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
      document.getElementById('restaurant-view-book')?.addEventListener('click', () => {
        if (!this.currentRestaurant) return;
        this.close();
        UI.BookNow.open(this.currentRestaurant);
      });
    },

    open(restaurant) {
      this.currentRestaurant = restaurant;

      this.photo.src = restaurant.photoUrl;
      this.photo.alt = restaurant.title;
      this.title.textContent = restaurant.title;
      this.cuisine.textContent = restaurant.cuisine;
      this.hours.textContent = Restaurants.formatHours(restaurant);
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

  /* ----- Book Now screen (reached from Restaurant View's Book Now button,
     not an overlay). Only Table & Time has real logic so far — every other
     section below is still a layout placeholder. ----- */
  BookNow: {
    init() {
      this.photo = document.getElementById('book-now-photo');
      this.title = document.getElementById('book-now-title');
      this.partySizeInput = document.getElementById('book-now-party-size');
      this.dateInput = document.getElementById('book-now-date');
      this.timePicker = document.getElementById('book-now-time-picker');
      this.timeSummary = document.getElementById('book-now-time-summary');
      this.timeSlotsList = document.getElementById('book-now-time-slots');
      this.tableList = document.getElementById('book-now-tables');
      this.couponInput = document.getElementById('book-now-coupon');
      this.pricingBreakdown = document.getElementById('book-now-pricing-breakdown');
      this.waitlistStatus = document.getElementById('book-now-waitlist-status');
      this.preOrderMenu = document.getElementById('book-now-preorder-menu');
      this.inviteSummary = document.getElementById('book-now-invite-summary');
      this.inviteNameInput = document.getElementById('book-now-invite-name');
      this.inviteError = document.getElementById('book-now-invite-error');
      this.inviteList = document.getElementById('book-now-invite-list');

      document.getElementById('book-now-back')?.addEventListener('click', () => UI.Router.showScreen('screen-explore'));

      [this.partySizeInput, this.dateInput].forEach((input) => {
        input.addEventListener('input', () => {
          this.renderTimeSlots();
          this.renderAvailableTables();
          this.renderPricing();
          this.renderInvitees();
        });
      });

      this.couponInput.addEventListener('input', () => this.renderPricing());

      // Event-delegated so it keeps working after renderTimeSlots()/
      // renderAvailableTables() replace their list's innerHTML.
      this.timeSlotsList.addEventListener('click', (event) => {
        const option = event.target.closest('[data-time]');
        if (option) this.selectTime(option.dataset.time);

        const waitlistLink = event.target.closest('[data-waitlist-time]');
        if (waitlistLink) this.joinWaitlist(waitlistLink.dataset.waitlistTime);
      });

      this.tableList.addEventListener('click', (event) => {
        const option = event.target.closest('[data-table-id]');
        if (option) this.selectTable(option.dataset.tableId);
      });

      // Targeted DOM update on the clicked control, not a full re-render —
      // a full renderMenuSections() re-run on every +/- click would work,
      // it'd just be pointlessly wasteful for something this small.
      this.preOrderMenu.addEventListener('click', (event) => {
        const button = event.target.closest('[data-qty-action]');
        if (!button) return;

        const control = button.closest('[data-item-id]');
        const itemId = control.dataset.itemId;
        const delta = button.dataset.qtyAction === 'increment' ? 1 : -1;
        const next = Math.max(0, (this.preOrderQuantities[itemId] ?? 0) + delta);

        this.preOrderQuantities[itemId] = next;
        control.querySelector('.preorder-qty-value').textContent = next;
        this.renderPricing();
      });

      this.inviteNameInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        this.addInvitee();
      });

      document.getElementById('book-now-invite-add')?.addEventListener('click', () => this.addInvitee());

      // Event-delegated so it keeps working after renderInvitees() replaces
      // the list's innerHTML.
      this.inviteList.addEventListener('click', (event) => {
        const statusPill = event.target.closest('[data-action="cycle-status"]');
        if (statusPill) this.cycleInviteeStatus(Number(statusPill.dataset.inviteeIndex));

        const removeButton = event.target.closest('[data-action="remove"]');
        if (removeButton) this.removeInvitee(Number(removeButton.dataset.inviteeIndex));
      });
    },

    open(restaurant) {
      this.restaurant = restaurant;
      this.selectedTime = null;

      this.photo.src = restaurant.photoUrl;
      this.photo.alt = restaurant.title;
      this.title.textContent = restaurant.title;

      this.partySizeInput.value = 2;
      this.dateInput.value = '';
      this.dateInput.min = toDateInputValue(new Date());
      this.timeSummary.textContent = 'Select a time';
      this.timePicker.removeAttribute('open');
      this.renderTimeSlots();
      this.couponInput.value = '';
      this.renderAvailableTables();
      this.renderPreOrderMenu();
      this.renderPricing();
      this.waitlistStatus.innerHTML = '<p class="text-body-md book-now-placeholder">Pick a fully booked time above and join the waitlist for it.</p>';

      this.invitees = [];
      this.inviteNameInput.value = '';
      this.inviteError.hidden = true;
      this.renderInvitees();

      UI.Router.showScreen('screen-book-now');
    },

    // Fixed slots for this restaurant (see Restaurants.getTimeSlots) — every
    // button just picks one, there's nothing to validate against open/close
    // hours or slot spacing since the list itself is already constrained to
    // both. Once a party size and date are in, a slot with zero tables that
    // fit is disabled/grayed out instead of being clickable and then
    // failing — the button itself is the "this time is booked" signal.
    renderTimeSlots() {
      const slots = Restaurants.getTimeSlots(this.restaurant);

      if (!slots.length) {
        this.timeSlotsList.innerHTML = '<p class="text-body-md book-now-placeholder">No reservation times available.</p>';
        return;
      }

      const partySize = Number(this.partySizeInput.value);
      const canCheckAvailability = partySize && this.dateInput.value >= this.dateInput.min;

      this.timeSlotsList.innerHTML = slots.map((time) => {
        const isFull = canCheckAvailability
          && getAvailableTables(this.restaurant, partySize, `${this.dateInput.value}T${time}`).length === 0;

        // The waitlist link sits next to the disabled button, not behind it —
        // a disabled element can't receive clicks, so it needs its own
        // separately clickable affordance.
        return `
          <div class="book-now-time-slot">
            <button type="button" class="btn btn-secondary book-now-table-option" data-time="${time}" ${isFull ? 'disabled' : ''}>
              ${formatTime12h(time)}
            </button>
            ${isFull ? `<button type="button" class="book-now-waitlist-link" data-waitlist-time="${time}">Fully booked — Join Waitlist</button>` : ''}
          </div>
        `;
      }).join('');
    },

    // Joining the waitlist is a dead end for this attempt, not an
    // alternative path to a reservation — no time ends up selected, so
    // Pricing/Pre-Order/Invites/Bill Split/Summary all stay in their empty,
    // nothing-selected state instead of acting like a table was booked.
    joinWaitlist(time) {
      const guest = Guest.get();

      Waitlist.join({
        restaurantId: this.restaurant.id,
        dateTime: `${this.dateInput.value}T${time}`,
        guestId: guest.id,
        partySize: Number(this.partySizeInput.value),
      });

      this.selectedTime = null;
      this.timeSummary.textContent = 'Select a time';
      this.timePicker.removeAttribute('open');
      this.renderAvailableTables();
      this.renderPricing();

      this.waitlistStatus.innerHTML = `<p class="text-body-md book-now-waitlist-confirmation">You're on the waitlist for ${formatTime12h(time)}.</p>`;
      document.getElementById('book-now-waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    selectTime(time) {
      this.selectedTime = time;
      this.timeSummary.textContent = formatTime12h(time);
      this.timePicker.removeAttribute('open');

      this.renderAvailableTables();
      this.renderPricing();
    },

    // 'YYYY-MM-DD' + 'HH:MM' joined with 'T' — the exact shape a table's
    // locks object keys its slots by (see seed-data.js's SEED_SLOT_POOL).
    getSelectedDateTime() {
      if (!this.dateInput.value || !this.selectedTime) return null;
      return `${this.dateInput.value}T${this.selectedTime}`;
    },

    renderAvailableTables() {
      const partySize = Number(this.partySizeInput.value);
      const dateTime = this.getSelectedDateTime();

      if (!partySize || !dateTime) {
        this.tableList.innerHTML = '<p class="text-body-md book-now-placeholder">Enter a party size, date, and time to see available tables.</p>';
        return;
      }

      // min on the date input steers the native picker, but typed input can
      // still slip through — re-check here so a bad value never reaches
      // getAvailableTables. Time doesn't need the same treatment anymore:
      // it only ever comes from renderTimeSlots()'s buttons, which are
      // already constrained to this restaurant's hours.
      if (this.dateInput.value < this.dateInput.min) {
        this.tableList.innerHTML = '<p class="text-body-md book-now-placeholder">Pick a date that hasn\'t already passed.</p>';
        return;
      }

      const available = getAvailableTables(this.restaurant, partySize, dateTime);

      if (!available.length) {
        this.tableList.innerHTML = '<p class="text-body-md book-now-placeholder">No tables available for that party size and time.</p>';
        return;
      }

      this.tableList.innerHTML = available.map((table) => `
        <button type="button" class="btn btn-secondary book-now-table-option" data-table-id="${table.id}">
          Table ${table.id.slice(0, 8)} — Seats ${table.capacity}
        </button>
      `).join('');
    },

    // The function a future visual table map will call when a table is
    // clicked. The lock is written to the restaurant's own tableLayout (via
    // Restaurants.set), not just kept on this screen — per CLAUDE.md, that's
    // what stops the same table/slot from being double-booked, since the
    // dataset is shared across every guest browsing the same restaurant.
    selectTable(tableId) {
      const dateTime = this.getSelectedDateTime();
      if (!dateTime) return;

      const table = this.restaurant.tableLayout.find((candidate) => candidate.id === tableId);
      if (!table) return;

      table.locks[dateTime] = true;
      Restaurants.set(this.restaurant);

      this.renderTimeSlots();
      this.renderAvailableTables();
      this.renderPricing();
    },

    // Live pricing breakdown — Pricing.calculate() does the actual pipeline
    // math (base -> peak/off-peak multiplier -> coupon/membership discount
    // -> total); this just re-reads the current selections and renders the
    // result.
    renderPricing() {
      const partySize = Number(this.partySizeInput.value);
      const dateTime = this.getSelectedDateTime();

      if (!partySize || !dateTime) {
        this.pricingBreakdown.innerHTML = '<p class="text-body-md book-now-placeholder">Select a party size and date/time to see pricing.</p>';
        return;
      }

      const guest = Guest.get();
      const isMember = Boolean(guest && Pricing.qualifiesForMembership(guest.id));

      const { basePrice, isPeak, peakAdjustment, couponDiscount, membershipDiscount, finalTotal } = Pricing.calculate({
        restaurant: this.restaurant,
        partySize,
        dateTime,
        couponCode: this.couponInput.value,
        isMember,
      });

      const rows = [
        `<li><span>Base price (${partySize} × $${this.restaurant.pricing.basePrice.toFixed(2)})</span><span>$${basePrice.toFixed(2)}</span></li>`,
        `<li><span>${isPeak ? 'Peak' : 'Off-Peak'} adjustment</span><span>${peakAdjustment >= 0 ? '+' : '−'}$${Math.abs(peakAdjustment).toFixed(2)}</span></li>`,
      ];
      if (couponDiscount > 0) {
        rows.push(`<li><span>Coupon discount</span><span>−$${couponDiscount.toFixed(2)}</span></li>`);
      }
      if (membershipDiscount > 0) {
        rows.push(`<li><span>Membership discount</span><span>−$${membershipDiscount.toFixed(2)}</span></li>`);
      }

      // Pre-order isn't part of Pricing.calculate()'s pipeline (it's not
      // subject to the peak multiplier or coupon/membership discounts) —
      // it's summed in separately here and folded into the displayed total.
      const preOrderItems = this.getPreOrderItems();
      const preOrderTotal = preOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const combinedTotal = finalTotal + preOrderTotal;

      const preOrderSection = preOrderItems.length ? `
        <div class="book-now-preorder-summary">
          <p class="field-label">Pre-order Items</p>
          <ul class="book-now-price-rows">
            ${preOrderItems.map((item) => `<li><span>${item.name} ×${item.quantity}</span><span>$${(item.price * item.quantity).toFixed(2)}</span></li>`).join('')}
          </ul>
          <p class="book-now-preorder-total"><span>Pre-order total</span><span>$${preOrderTotal.toFixed(2)}</span></p>
        </div>
      ` : '';

      this.pricingBreakdown.innerHTML = `
        <ul class="book-now-price-rows">${rows.join('')}</ul>
        ${preOrderSection}
        <p class="book-now-price-total"><span>Total</span><span>$${combinedTotal.toFixed(2)}</span></p>
      `;
    },

    // Reuses renderMenuSections (Restaurant View's read-only "View Menu"
    // menu renderer) via its renderItemExtra hook to add a quantity stepper
    // per item, instead of writing a second menu-rendering function.
    renderPreOrderMenu() {
      this.preOrderQuantities = {}; // menuItemId -> quantity, reset per restaurant

      this.preOrderMenu.innerHTML = renderMenuSections(this.restaurant.menuItems, {
        renderItemExtra: (item) => `
          <div class="preorder-qty-control" data-item-id="${item.id}">
            <button type="button" class="preorder-qty-btn" data-qty-action="decrement" aria-label="Decrease ${item.name} quantity">−</button>
            <span class="preorder-qty-value">0</span>
            <button type="button" class="preorder-qty-btn" data-qty-action="increment" aria-label="Increase ${item.name} quantity">+</button>
          </div>
        `,
      });
    },

    // preOrderItems[] shape per CLAUDE.md's reservation data model — a
    // self-contained snapshot (name/price captured now, not looked up again
    // later) of every item with a quantity above zero. No pricing impact
    // yet: nothing calls this into Pricing.calculate().
    getPreOrderItems() {
      return this.restaurant.menuItems
        .filter((item) => (this.preOrderQuantities[item.id] ?? 0) > 0)
        .map((item) => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: this.preOrderQuantities[item.id],
        }));
    },

    // this.invitees is already exactly the invitees[] shape CLAUDE.md's
    // reservation data model calls for — {name, rsvpStatus} — so Bill Split
    // can later do this.invitees.filter(i => i.rsvpStatus === 'accepted')
    // directly, no transforming first.
    renderInvitees() {
      const partySize = Number(this.partySizeInput.value) || 0;
      this.inviteSummary.textContent = `Party of ${partySize} · ${this.invitees.length} invited`;

      this.inviteList.innerHTML = this.invitees.map((invitee, index) => `
        <li class="book-now-invite-item">
          <span class="book-now-invite-name">${invitee.name}</span>
          <button type="button" class="book-now-status-pill is-${invitee.rsvpStatus}" data-action="cycle-status" data-invitee-index="${index}">
            ${invitee.rsvpStatus}
          </button>
          <button type="button" class="book-now-invite-remove" data-action="remove" data-invitee-index="${index}" aria-label="Remove ${invitee.name}">×</button>
        </li>
      `).join('');
    },

    // Blocks blank names and duplicates (case-insensitive, trimmed) — every
    // new entry starts 'pending', never randomized.
    addInvitee() {
      const name = this.inviteNameInput.value.trim();
      this.inviteError.hidden = true;

      if (!name) {
        this.inviteError.textContent = 'Enter a name to add.';
        this.inviteError.hidden = false;
        return;
      }

      const isDuplicate = this.invitees.some((invitee) => invitee.name.toLowerCase() === name.toLowerCase());
      if (isDuplicate) {
        this.inviteError.textContent = `${name} is already invited.`;
        this.inviteError.hidden = false;
        return;
      }

      this.invitees.push({ name, rsvpStatus: 'pending' });
      this.inviteNameInput.value = '';
      this.renderInvitees();
    },

    removeInvitee(index) {
      this.invitees.splice(index, 1);
      this.renderInvitees();
    },

    // The host clicks through this one control — pending -> accepted ->
    // declined -> pending — there's no real second guest to actually RSVP.
    cycleInviteeStatus(index) {
      const invitee = this.invitees[index];
      if (!invitee) return;

      const cycle = ['pending', 'accepted', 'declined'];
      invitee.rsvpStatus = cycle[(cycle.indexOf(invitee.rsvpStatus) + 1) % cycle.length];
      this.renderInvitees();
    },
  },
};
