// Deterministic visual QR pattern generated from a reservation's id — per
// CLAUDE.md's Assumed Defaults, this is never required to be scannable,
// only stable: the same reservation id always renders the same pattern,
// re-derived on demand rather than stored on the reservation record.
const QR = {
  // xmur3-style string hash seeding a mulberry32 PRNG — deterministic and
  // seedable, so a reservation id always produces the same bit sequence.
  _createRng(seed) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i += 1) {
      h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }

    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  },

  // 3x3 solid blocks in the top-left/top-right/bottom-left corners, same as
  // a real QR code's finder patterns — purely cosmetic here, just enough for
  // the shape to read as "a QR code" at a glance.
  _isFinderCell(row, col, gridSize) {
    const inCorner = (r, c) => r < 3 && c < 3;
    return inCorner(row, col)
      || inCorner(row, gridSize - 1 - col)
      || inCorner(gridSize - 1 - row, col);
  },

  // Renders the pattern as an inline SVG sized by `pixelSize` per cell —
  // fill is left to `currentColor` so it inherits from CSS, not baked in here.
  renderSVG(seed, { gridSize = 11, pixelSize = 8 } = {}) {
    const rng = this._createRng(String(seed));
    const dimension = gridSize * pixelSize;

    let cells = '';
    for (let row = 0; row < gridSize; row += 1) {
      for (let col = 0; col < gridSize; col += 1) {
        const on = this._isFinderCell(row, col, gridSize) || rng() < 0.5;
        if (!on) continue;
        cells += `<rect x="${col * pixelSize}" y="${row * pixelSize}" width="${pixelSize}" height="${pixelSize}" />`;
      }
    }

    return `
      <svg class="qr-pattern" viewBox="0 0 ${dimension} ${dimension}" width="${dimension}" height="${dimension}" role="img" aria-label="Reservation QR code">
        ${cells}
      </svg>
    `;
  },
};
