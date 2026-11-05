import { mulberry32 } from '@utils/noise2d';

export const CLOUD_PUFFS = 32;

// A cumulus one unit wide as [x, y, z, radius] puffs: tallest and fattest
// mid-span, thinning to the ends, over a roughly flat base at y = 0.
export default function cloudPuffs(seed) {
  const rand = mulberry32(seed * 9973 + 1);
  return Array.from({ length: CLOUD_PUFFS }, () => {
    const x = (rand() - 0.5) * 0.95;
    const middle = 1 - Math.abs(x) / 0.5;
    const radius = (0.07 + 0.08 * rand()) * (0.45 + 0.55 * middle);
    const y = radius * 0.5 + rand() * 0.14 * middle;
    return [x, y, (rand() - 0.5) * 0.12, radius];
  });
}
