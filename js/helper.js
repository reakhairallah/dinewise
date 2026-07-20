/* =========================================================
   Generic helpers — no DOM dependency beyond plain element/root args, no
   restaurant/guest-specific logic. Shared across restaurants.js, pricing.js,
   and ui.js, so this loads before all three.
   ========================================================= */

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

// Shared by anything that needs to do arithmetic on 'HH:MM' strings
// (reservation time-slot generation, Pricing's peak-window math).
const timeToMinutes = (time) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

const minutesToTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

// A reservation's 'YYYY-MM-DDTHH:MM' -> 'Wed, Jan 1 · 5:30 PM'. Splits the
// date from the time and formats the date part with timeZone: 'UTC' —
// passing the full local dateTime string to toLocaleDateString would parse
// correctly most of the time, but rolls back to the previous calendar day
// for any reader whose local offset is negative (e.g. UTC-5) once the date
// part alone is re-parsed at local midnight. Splitting off the date and
// pinning it to UTC sidesteps that entirely.
const formatReservationDateTime = (dateTime) => {
  const [datePart, time] = dateTime.split('T');
  const dateLabel = new Date(datePart).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  return `${dateLabel} · ${formatTime12h(time)}`;
};

// Local (not UTC) 'YYYY-MM-DD', matching what a <input type="date"> reads/writes.
const toDateInputValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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
