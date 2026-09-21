import { polygonOutside } from '@utils/regularPolygon';

// What the container has to contain: the lowest ground inside the outline and
// the highest of ground or still surface, so a tray clears a stream's banks
// and a coast's rock alike.
export default function bedLevels(field, shape, { resolution, worldSize }) {
  const n = resolution;
  let low = Infinity;
  let high = -Infinity;

  for (let j = 0; j < n; j += 1) {
    const worldZ = (0.5 - j / (n - 1)) * worldSize;
    for (let i = 0; i < n; i += 1) {
      const worldX = (i / (n - 1) - 0.5) * worldSize;
      if (!polygonOutside(shape, worldX, worldZ)) {
        const slot = (j * n + i) * 4;
        low = Math.min(low, field[slot]);
        high = Math.max(high, field[slot], field[slot + 3]);
      }
    }
  }

  return Number.isFinite(low) ? { high, low } : { high: 0, low: 0 };
}
