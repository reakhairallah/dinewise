# Smart Restaurant Reservation Platform — Project Spec

> Reference doc for implementation decisions already made. Follow these rules exactly;
> flag it if a request conflicts with something below instead of silently overriding it.
> Anything not covered here is open — use good judgment and standard practices.

## Editing this file

Claude Code may propose changes to this file when a rule genuinely needs to change, but must
never write to CLAUDE.md without first stating the proposed change and getting explicit
confirmation.

## Stack & constraints

- HTML, CSS, vanilla JavaScript (ES6+) only. No frameworks, no backend, no database.
- All persistence is `localStorage`, scoped to the browser origin — **not** to role or user.
- No real authentication, no real multi-device communication, no server-side timers.
- Prefer arrow functions, destructuring, template literals, spread/rest, array methods.
  Use classes/modules only where they genuinely improve the design.

## Suggested build order (start here)

1. **`storage.js`** — generic `get(key)` / `set(key, value)` / `list(key)` wrappers around
   `localStorage`, using the key convention below. Nothing else can be tested without this, so
   write and manually verify it before touching any UI.
2. **Screen 1 (Sign Up / Role Picker)** — build this end-to-end next. It only depends on
   `storage.js`, exercises the full profile-create / profile-edit / role-select / logout logic,
   and every other screen assumes a profile + role already exist by the time they load.
3. **`restaurants.js`** + 2–3 hardcoded seed restaurants (so Explore/Restaurant View have
   something to render before Add/Edit Restaurant exists).
4. **Explore → Restaurant View → Book Now** — the core customer path; build in this order since
   each screen depends on the previous one existing.
5. **Dashboard** — needs a real reservation to display, so it's easiest once Book Now can
   actually create one.
6. **Admin Dashboard + Add/Edit Restaurant** — functionally independent of the customer path;
   build any time after `restaurants.js` exists, including in parallel with step 4–5.

**Today:** `storage.js` + Screen 1 is a complete, testable slice on its own — profile persists
across refresh, role picker works, logout round-trips correctly. Good stopping point for one
session.

## Code organization

- Develop in separate files under `src/`, each exposing one namespace object (except
  `seed-data.js`, which just provides fixture-generation globals for `restaurants.js`'s
  `seed()`), in this dependency order: `storage.js` (`Storage`) → `seed-data.js` →
  `restaurants.js` (`Restaurants`) → `reservations.js` (`Reservations`) → `pricing.js`
  (`Pricing`) → `recommendation.js` (`Recommendation`) → `waitlist.js` (`Waitlist`) →
  `qr.js` (`QR`) → `ui.js` (`UI`) → `init.js` (app start, inside a `DOMContentLoaded`
  listener).
- Each `src/` file is loaded directly via its own `<script>` tag in `index.html`, in dependency
  order: storage.js → seed-data.js → restaurants.js → reservations.js → pricing.js →
  recommendation.js → waitlist.js → qr.js → ui.js → init.js. No concatenation step, no bundler.
- Final deliverable: `index.html` + split files under `src/` and `styles/`. No single
  `app.js` or single `style.css` — multiple files confirmed acceptable.
- Single `index.html` — this is an SPA, not multiple pages. Each screen is a `<section>`/`<div>`
  with a stable `id` (e.g. `#screen-signup`), shown/hidden via JS. Never navigate to a second
  `.html` file.

## UI design source

- Google Stitch was used to explore visual style, not to produce final markup — the generated
  screens don't map one-to-one onto this project's actual features. Treat Stitch output as a
  **design reference** (colors, typography, spacing, component look-and-feel), not a structural
  blueprint to paste in directly.
- If a `DESIGN.md` was exported from Stitch, pull design tokens from there (palette, type scale,
  spacing, radii, shadows) into `styles/base.css` as custom properties/reusable classes. Build
  each screen's actual HTML structure from the Screens section above; style it with those tokens.

## Storage keys & IDs

- localStorage keys: `dinewise_<entity>_v1` (e.g. `dinewise_guest_v1`, `dinewise_session_v1`,
  `dinewise_restaurants_v1`, `dinewise_reservations_v1`, `dinewise_waitlist_v1`). The `_v1`
  suffix exists so a future shape change can migrate or discard old data without guessing
  which keys are stale.
- All generated IDs use `crypto.randomUUID()` — no manual counters.

## Data model (conceptual — implement exact shape as needed)

- **Guest profile** — one per browser, created once: name, email, phone, favoriteCuisines[],
  dietaryPreferences[] (e.g. Vegetarian, Vegan, Halal, Kosher), allergyTags[] (e.g. Nut Allergy,
  Gluten-Free) — mirrors the restaurant's dietaryBadges[]/allergenCautions[] split one-to-one.
  Membership is not yet decided (see Deferred) — don't add an `isMember` field until that's
  settled.
- **Session role** — `'customer' | 'admin'`. Separate from the profile. Stored in `localStorage`
  (survives refresh); cleared only by the explicit Log Out control, never auto-cleared. Profile
  itself is never cleared or duplicated by logout.
- **Restaurant** — photoUrl (hosted image link — see Assumed defaults), title, cuisine, hours,
  rating, distanceMiles (static, randomized once at creation), sustainabilityBadges[],
  allergenCautions[] (kitchen-level warning phrasing, e.g. `'Nuts'` not `'Contains Nuts'` —
  not a per-dish claim), dietaryBadges[] (e.g. `'Vegetarian-Friendly'`, `'Vegan-Friendly'`,
  separate from allergen cautions), tableLayout, peak/off-peak base pricing, menuItems[].
- **Table** — id, capacity, lock status per date+time slot. Availability is randomized **once**
  at restaurant-creation time and persisted — never re-randomize on load/render.
- **Reservation** — guestId, restaurantId, tableId, dateTime, partySize, invitees[]
  (`{ name, rsvpStatus: 'pending' | 'accepted' | 'declined' }`), preOrderItems[], couponCode?,
  pricingBreakdown (basePrice, peakAdjustment, discount, finalTotal). QR code is derived from
  this record on demand, not stored separately.
- **Waitlist entry** — restaurantId, tableId, dateTime, guestId, status: `'waiting' | 'ready'`.

## Screens (7 total — do not add standalone pages beyond these)

| # | Screen | Role | Responsibilities |
|---|--------|------|-------------------|
| 1 | Sign Up / Role Picker | both | Profile creation (blank) on first visit; on return from Log Out, same screen pre-fills existing profile fields from `localStorage` (editable) and re-prompts for role |
| 2 | Dashboard | customer | Edit profile (incl. Log Out control); notification center (RSVP + waitlist status); reservations list with QR codes |
| 3 | Explore | customer | Restaurant listing; AI-styled concierge filter using profile tags; optional smart-match form (mood/budget/distance) |
| 4 | Restaurant View | customer | Focused overlay with full restaurant detail; entry point to Book Now |
| 5 | Book Now | customer | Single scrolling flow: table map + lock, live pricing, waitlist join, pre-order, invites + RSVP, bill split, ticket-style summary |
| 6 | Admin Dashboard | admin | Grid of all restaurants in the store (single implicit admin — no ownership field); add / edit / delete; small Log Out control |
| 7 | Add / Edit Restaurant | admin | One reusable form: details, table layout, pricing, menu |

**No standalone booking-confirmation screen.** Book Now ends with a loading transition +
confirmation message, then redirects to Dashboard, where the new reservation (and its QR
code) appears.

## Flows

- **Guest:** Sign up → role picker → Explore → Restaurant View (overlay) → Book Now →
  loading/confirm → Dashboard.
- **Admin:** role picker → Admin Dashboard → Add/Edit Restaurant → back to Admin Dashboard.
- **Logout (either role):** Log Out control → clear session-role key only → Screen 1, profile
  fields pre-filled from `localStorage` → pick role → Explore or Admin Dashboard.
- Profile persists independently of role — logout/role-switching never re-creates or duplicates
  the profile, only re-prompts for role.

## Feature rules (decided — implement as-is)

**Pricing pipeline — strict order, do not reorder:**
`base price (admin-set)` → `peak/off-peak multiplier (auto, by reservation hour)` →
`coupon/membership discount (only if a valid code is entered)` → `final total` →
`split across host + invitees with rsvpStatus === 'accepted'`.

**Party size vs. bill split:** party size (entered upfront) determines table capacity needed;
bill split later uses only accepted invitees, which may be fewer than the party size.

**RSVP tracking:** no real second user exists, so the host manually toggles each invitee's
status (pending/accepted/declined) in Book Now. Status must be **written to the reservation
record in localStorage**, not held only in component state — that persistence is what
satisfies "tracking," not the fact that a real person responded.

**Table locking:** availability is randomized once at restaurant creation and persisted. A
lock is written to the restaurant's own data (not only the guest's reservation), so the same
table/slot can't be double-booked.

**Waitlist:** joined from within Book Now when a slot is full. Tracked in the Dashboard
notification center (no separate screen). Status is evaluated lazily — checked when the
Dashboard is viewed, never pushed. Promotion from `waiting` to `ready` happens only via an
explicit admin action — no timers, no countdown, no auto-detection.

**Booking cap:** a max active-reservations limit per guest. Blocks new bookings with a message
when reached — no extra screen. Exact number: TBD.

**Role & data sharing:** one profile per browser. `localStorage` is not scoped by role — admin
and customer read/write the same dataset, so changes made in one role are visible instantly
in the other.

## Assumed defaults (reasonable placeholders, not confirmed requirements)

Treat these as decided so implementation isn't blocked — they're the first things to revisit
if the product direction changes, not things to silently work around.

- **Restaurant photos:** `photoUrl` is a plain hosted image URL string, never a file upload or
  base64 blob — keeps `localStorage` small and avoids needing a file input.
- **Distance (smart-match):** `distanceMiles` is a static number set like table availability —
  randomized once at restaurant-creation time, not real geolocation.
- **QR code:** rendered as a deterministic visual pattern generated from the reservation ID —
  not required to be actually scannable. Swap in a real QR library later only if "scannable"
  turns out to matter for grading.

## Explicitly out of scope

- Real authentication or multi-device accounts
- Real-time or push notifications
- Timer-based waitlist claim windows
- Separate data stores per role
- A standalone booking-confirmation page
- Real payment processing (bill split is informational only — no payment collection)
- Real geolocation (distance is a static mocked field)
- Photo uploads / file storage (photos are hosted URLs only)

## Deferred (decide during implementation, not structural — none of these block starting)

- Whether/how membership works at all — don't build pricing logic around it until this is
  confirmed; the pricing pipeline already treats it as an optional, independent discount step
  so adding it later won't require reordering anything.
- Coupon validation approach — the user enters a code string (`couponCode` on the reservation
  is already fixed); how it's checked and which codes exist are both open.
- Exact booking cap number (e.g. 3–5 active reservations)
- Exact menu item field structure
- Exact badge field structure
- Visual/branding direction (colors, typography) — Screen 1 can be built with placeholder
  styling and restyled later without touching logic
