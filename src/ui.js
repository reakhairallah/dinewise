const UI = {
  init() {
    this.form = document.getElementById('signup-form');
    this.fields = {
      name: document.getElementById('field-name'),
      email: document.getElementById('field-email'),
      phone: document.getElementById('field-phone'),
    };
    this.guestOnlyFields = document.getElementById('guest-only-fields');

    this.prefillFromProfile();
    this.updateGuestFieldsVisibility();
    this.form.addEventListener('submit', (event) => this.handleSignupSubmit(event));
    this.form.querySelectorAll('input[name="role"]').forEach((input) => {
      input.addEventListener('change', () => this.updateGuestFieldsVisibility());
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
    if (!role) return;

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
