import { classify, dress } from './dressing';
import createPrng from './prng';
import buildQuadTree, { createQuad, subdivide } from './quadTree';

const REBUILD_LEAD = 0.04;
const REBUILD_TIMING = { jitter: 0.05, spread: 0.2 };

function cellHash(cell) {
  const value =
    Math.sin(cell.rect.x * 12.9898 + cell.rect.y * 78.233) * 43758.5453;

  return value - Math.floor(value);
}

function stagger(cells, key, { base, jitter, radius, spread }) {
  return cells.map((cell) => {
    const cx = cell.footprint.x + cell.footprint.w / 2;
    const cy = cell.footprint.y + cell.footprint.h / 2;
    const radial = Math.min(Math.hypot(cx, cy) / radius, 1);

    return {
      ...cell,
      [key]: base + radial * spread + cellHash(cell) * jitter,
    };
  });
}

// A district recedes on the same outward stagger it emerges with. The latest
// death plus one reveal band is when its cells are all back at ground level.
export function retireDistrictCells({ cells, clock, radius }) {
  const base = clock + REBUILD_LEAD;

  return {
    cells: stagger(cells, 'death', { ...REBUILD_TIMING, base, radius }),
    settlesAt: base + REBUILD_TIMING.spread + REBUILD_TIMING.jitter,
  };
}

function landuseOffsets(landuse, districtCount) {
  const offsets = new Array(districtCount).fill(0);
  const counts = new Array(districtCount).fill(0);

  landuse.forEach((cell) => {
    counts[cell.district] += 1;
  });

  counts.reduce((running, count, index) => {
    offsets[index] = running;
    return running + count;
  }, 0);

  return offsets;
}

export default function buildCityModel({ composition, referenceHeight, seed }) {
  const random = createPrng(seed);
  const radius = referenceHeight / 1.5;
  const root = createQuad(-radius, -radius, radius * 2, radius * 2);
  const { districts, quads } = buildQuadTree(root, random, composition, seed);
  const viewScale = 1 + random() * 2;
  const groups = classify({ composition, quads, random, referenceHeight });
  const offsets = landuseOffsets(groups.landuse, districts.length);
  const cells = stagger(
    dress(groups, { composition, idOffset: 0, random, referenceHeight }),
    'birth',
    { base: 0, jitter: 0.15, radius, spread: 0.85 }
  );

  return {
    cells,
    districts: districts.map((district) => ({
      ...district,
      landuseOffset: offsets[district.index],
    })),
    radius,
    rootSize: radius * 2,
    viewScale,
  };
}

// A rebuild replaces one district's subtree off its own stream, since the
// city-wide order cannot be resumed mid-sequence.
export function rebuildDistrictCells({
  birthBase,
  composition,
  district,
  generation,
  radius,
  referenceHeight,
  seed,
}) {
  const random = createPrng(seed + district.index * 7919 + generation * 104729);
  const quads = subdivide(district.bounds, random, composition).map((quad) => ({
    ...quad,
    district: district.index,
    glow: district.glow,
  }));
  const groups = classify({ composition, quads, random, referenceHeight });
  const cells = dress(groups, {
    composition,
    idOffset: district.landuseOffset,
    random,
    referenceHeight,
  });

  return stagger(cells, 'birth', {
    ...REBUILD_TIMING,
    base: birthBase + REBUILD_LEAD,
    radius,
  });
}
