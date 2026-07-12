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
    this.navAvatarInitials = document.getElementById('nav-avatar-initials');

    this.prefillFromProfile();
    this.updateGuestFieldsVisibility();
    this.renderNavProfile();
    this.form.addEventListener('submit', (event) => this.handleSignupSubmit(event));
    this.form.querySelectorAll('input[name="role"]').forEach((input) => {
      input.addEventListener('change', () => {
        this.updateGuestFieldsVisibility();
        this.roleError.hidden = true;
        if (input.value === 'customer' && input.checked) {
          this.guestOnlyFields.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
    document.getElementById('nav-logout')?.addEventListener('click', () => this.handleLogout());
    this.bindNavDropdowns();
    this.bindFilterChips();
  },

  bindNavDropdowns() {
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    document.addEventListener('click', (event) => {
      dropdowns.forEach((dropdown) => {
        if (!dropdown.contains(event.target)) dropdown.removeAttribute('open');
      });
    });
  },

  bindFilterChips() {
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach((chip) => {
      chip.addEventListener('toggle', () => {
        if (!chip.open) return;
        filterChips.forEach((other) => {
          if (other !== chip) other.removeAttribute('open');
        });
      });
    });

    document.addEventListener('click', (event) => {
      filterChips.forEach((chip) => {
        if (chip.open && !chip.contains(event.target)) chip.removeAttribute('open');
      });
    });

    document.getElementById('preferences-chip')?.addEventListener('click', (event) => {
      event.currentTarget.classList.toggle('is-active');
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

    this.renderNavProfile();
    this.goToRoleScreen(role);
  },

  renderNavProfile() {
    if (!this.navAvatarInitials) return;

    const name = Storage.get('dinewise_guest_v1')?.name?.trim();
    const initials = name
      ? name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join('')
      : 'G';

    this.navAvatarInitials.textContent = initials;
  },

  handleLogout() {
    Storage.set('dinewise_session_v1', null);
    this.form.querySelectorAll('input[name="role"]').forEach((input) => { input.checked = false; });
    this.updateGuestFieldsVisibility();
    this.roleError.hidden = true;
    document.querySelectorAll('.nav-dropdown').forEach((dropdown) => dropdown.removeAttribute('open'));
    this.showScreen('screen-signup');
  },

  goToRoleScreen(role) {
    if (role === 'customer') {
      this.showScreen('screen-explore');
      return;
    }

    // Admin Dashboard doesn't exist yet — this is the hook it will replace.
    console.log(`Signed in as ${role}.`, Storage.get('dinewise_guest_v1'));
  },

  routeInitialScreen() {
    const guest = Storage.get('dinewise_guest_v1');
    const session = Storage.get('dinewise_session_v1');
    if (!guest || !session?.role) return;

    this.goToRoleScreen(session.role);
  },

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach((screen) => {
      screen.hidden = screen.id !== screenId;
    });
    window.scrollTo(0, 0);
  },

  renderExplore() {
    const grid = document.getElementById('restaurant-grid');
    if (!grid) return;

    grid.innerHTML = Restaurants.list().map((restaurant) => this.renderRestaurantCard(restaurant)).join('');
  },

  renderRestaurantCard(restaurant) {
    const badges = (values, chipClass = '') => values
      .map((value) => `<span class="chip ${chipClass}">${value}</span>`)
      .join('');

    return `
      <article class="card">
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
            ${badges(restaurant.sustainabilityBadges)}
            ${badges(restaurant.allergenBadges, 'chip-allergen')}
          </div>
        </div>
      </article>
    `;
  },
};
