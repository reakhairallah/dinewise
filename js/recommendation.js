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

const hasAllergyConflict = (restaurant, guest) => countTagOverlap(guest.allergyTags, restaurant.allergenCautions) > 0;

// Higher score = better match. Favorite cuisine matching is worth more than a
// dietary-preference match. Allergy cautions are handled separately in
// Recommendation.compare, not folded into this score.
const matchScore = (restaurant, guest) => {
  let score = 0;

  if (guest.favoriteCuisines?.some((cuisine) => cuisine.toLowerCase() === restaurant.cuisine.toLowerCase())) {
    score += CUISINE_MATCH_SCORE;
  }

  score += countTagOverlap(guest.dietaryPreferences, restaurant.dietaryBadges) * DIETARY_MATCH_SCORE;

  return score;
};

const Recommendation = {
  // Allergy-conflict status is the primary sort key — a conflict-free restaurant
  // always outranks a conflicting one, no matter the score. Only when both
  // restaurants share the same conflict status does match score break the tie.
  compare(a, b, guest) {
    const aConflict = hasAllergyConflict(a, guest);
    const bConflict = hasAllergyConflict(b, guest);
    if (aConflict !== bConflict) return aConflict ? 1 : -1;

    return matchScore(b, guest) - matchScore(a, guest);
  },
};
