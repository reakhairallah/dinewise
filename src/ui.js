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
    if (role === 'customer') {
      this.showScreen('screen-explore');
      return;
    }

    // Admin Dashboard doesn't exist yet — this is the hook it will replace.
    console.log(`Signed in as ${role}.`, Storage.get('dinewise_guest_v1'));
  },

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach((screen) => {
      screen.hidden = screen.id !== screenId;
    });
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
