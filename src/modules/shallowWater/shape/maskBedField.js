/* eslint-disable no-param-reassign */
import { bedOutside } from './bedShape';

// High enough to clear any tide, swell or reach gradient. The wall is never
// drawn -- grains outside the shape are dropped and the bed is not a mesh --
// so its only job is to keep the flood and the flux out.
const RIM_RISE = 12;

// Confining the water is the same mechanism the square domain already uses: a
// bed the water cannot climb. The grid edge clamps flux to zero, and so does a
// cell standing well above the rest surface.
export default function maskBedField(field, shape, { resolution, worldSize }) {
  const n = resolution;

  for (let j = 0; j < n; j += 1) {
    const worldZ = (0.5 - j / (n - 1)) * worldSize;
    for (let i = 0; i < n; i += 1) {
      const worldX = (i / (n - 1) - 0.5) * worldSize;
      if (bedOutside(shape, worldX, worldZ)) {
        const slot = (j * n + i) * 4;
        field[slot] = Math.max(field[slot], field[slot + 3] + RIM_RISE);
      }
    }
  }

  return field;
}
