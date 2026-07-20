// Peak multiplier applied on top of a restaurant's base price during its
// peak window — one defined rate for the whole app, not a per-restaurant
// setting (restaurants only store a single basePrice now).
const PEAK_MULTIPLIER = 1.12; // 12% above the base price

// Fixed set of valid codes, common across every restaurant (not
// per-restaurant). Anything else is rejected/ignored, same as no code at
// all — real coupon rules (issuance, membership tie-in) are still deferred
// per CLAUDE.md; this is just enough to make "only if a valid code is
// entered" mean something.
const VALID_COUPON_CODES = new Set(['DINEWISE10', 'FIRSTCOURSE', 'NIGHTOWL', 'CONCIERGE']);
const COUPON_DISCOUNT_RATE = 0.1;

// A guest qualifies once the reservation being created would be their 3rd
// (or later) overall — i.e. 2 or more already exist. Recalculated fresh
// from Reservations every time; never stored as a profile flag, so earlier
// reservations keep whatever price they were confirmed at.
const MEMBERSHIP_QUALIFYING_PRIOR_COUNT = 2;
const MEMBERSHIP_DISCOUNT_RATE = 0.15;

// Peak window is derived from each restaurant's own hours rather than a
// fixed clock range: the 2 hours centered on the midpoint between openTime
// and closeTime (clamped to stay within those hours), so a restaurant with a
// short dinner-only service and one with lunch-through-dinner hours each get
// a peak window sized and placed relative to when *they're* actually open.
const getPeakWindow = (restaurant) => {
  const openMinutes = timeToMinutes(restaurant.openTime);
  const closeMinutes = timeToMinutes(restaurant.closeTime);
  const midpoint = (openMinutes + closeMinutes) / 2;

  return {
    peakStart: Math.max(openMinutes, midpoint - 60),
    peakEnd: Math.min(closeMinutes, midpoint + 60),
  };
};

const Pricing = {
  isPeakHour(restaurant, dateTime) {
    const minutes = timeToMinutes(dateTime.split('T')[1]);
    const { peakStart, peakEnd } = getPeakWindow(restaurant);
    return minutes >= peakStart && minutes < peakEnd;
  },

  isValidCoupon(couponCode) {
    return Boolean(couponCode && VALID_COUPON_CODES.has(couponCode.trim().toUpperCase()));
  },

  qualifiesForMembership(guestId) {
    return Reservations.countForGuest(guestId) >= MEMBERSHIP_QUALIFYING_PRIOR_COUNT;
  },

  // How many more reservations this guest needs before qualifiesForMembership
  // turns true — 0 once already qualified. Exposed so callers (Dashboard's
  // status badge) never have to know or duplicate the threshold themselves.
  remainingForMembership(guestId) {
    return Math.max(0, MEMBERSHIP_QUALIFYING_PRIOR_COUNT - Reservations.countForGuest(guestId));
  },

  // Strict pipeline order per CLAUDE.md: base price -> peak/off-peak
  // multiplier -> coupon/membership discount (only if a valid code is
  // entered) -> final total. Bill-split-across-accepted-invitees is the
  // pipeline's last step but lands with the Bill Split section, not here.
  // Coupon and membership discounts stack additively (summed rates applied
  // once to the peak-adjusted price), not as two sequential, compounding
  // discounts.
  calculate({ restaurant, partySize, dateTime, couponCode, isMember }) {
    const basePrice = restaurant.pricing.basePrice * partySize;

    const isPeak = this.isPeakHour(restaurant, dateTime);
    const afterMultiplier = isPeak ? basePrice * PEAK_MULTIPLIER : basePrice;
    const peakAdjustment = afterMultiplier - basePrice;

    const couponDiscount = this.isValidCoupon(couponCode) ? afterMultiplier * COUPON_DISCOUNT_RATE : 0;
    const membershipDiscount = isMember ? afterMultiplier * MEMBERSHIP_DISCOUNT_RATE : 0;
    const discount = couponDiscount + membershipDiscount;
    const finalTotal = afterMultiplier - discount;

    return { basePrice, isPeak, peakAdjustment, couponDiscount, membershipDiscount, discount, finalTotal };
  },
};
