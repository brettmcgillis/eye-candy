/* eslint-disable no-param-reassign */
import { distance, offsetPolygon, polygonBounds } from './geom';
import createPrng from './prng';
import buildQuadTree, { createQuad, splitQuad, subdivide } from './quadTree';

const CENTER = { x: 0, y: 0 };
const STREET_INSET = 4;
const NEON_CHANCE = 0.1;
const NEON_MAX_INSET = 20;
const TOWER_MIN_HEIGHT = 20;
const TOWER_HEIGHT_RANGE = 300;
const STAIR_BAND = 10;
const STAIR_NARROWING = 3;
const MAX_STAIR_NARROWING = 0.6;
const REBUILD_LEAD = 0.04;

function insetCell(quad, source, glow) {
  const points = offsetPolygon(quad.points, STREET_INSET);

  return {
    area: quad.area,
    district: source.district,
    districtGlow: source.glow,
    glow,
    footprint: { h: quad.h, w: quad.w, x: quad.x, y: quad.y },
    h: quad.h,
    rect: polygonBounds(points),
    // A quad narrower than two street insets offsets into an inverted
    // polygon. The reference strokes those anyway; a solid cannot.
    valid: quad.w > STREET_INSET * 2 && quad.h > STREET_INSET * 2,
    w: quad.w,
  };
}

function classify({ quads, random, referenceHeight }) {
  const radius = referenceHeight / 1.5;
  const towerArea = (referenceHeight / 30) ** 2;
  const landArea = (referenceHeight / 9) ** 2;
  const stairArea = (referenceHeight / 8) ** 2;
  const towers = [];
  const landuse = [];
  const stairs = [];

  quads.forEach((quad) => {
    const centre = { x: quad.x + quad.w / 2, y: quad.y + quad.h / 2 };
    const radialDistance = distance(centre, CENTER);

    if (radialDistance >= radius) {
      return;
    }

    if (random() > (1 - radialDistance / radius) * 2) {
      return;
    }

    const collect = (target) => {
      splitQuad(quad, random).forEach((sub) => {
        // Sub-quads are fresh quads, so the subtree's flag does not reach
        // them — in the reference only the unsplit branch below stays flagged.
        target.push(insetCell(sub, quad, false));
      });
    };

    if (quad.area < towerArea) {
      collect(towers);
      return;
    }

    if (quad.area < landArea) {
      collect(landuse);
      return;
    }

    if (quad.area < stairArea) {
      collect(stairs);
      return;
    }

    landuse.push(insetCell(quad, quad, quad.glow));
  });

  return { landuse, stairs, towers };
}

function dressStairs(stairs, random) {
  stairs.forEach((cell) => {
    cell.role = 'stair';
    cell.steps = Math.max(2, Math.ceil(cell.h / STAIR_BAND));
    cell.rise = cell.h;
    cell.narrowing = Math.min(
      MAX_STAIR_NARROWING,
      (STAIR_NARROWING * cell.steps) / cell.w
    );
    cell.descending = random() > 0.5;
  });
}

function neonSlot(cell, magenta, largeArea) {
  if (cell.area > largeArea) {
    return 'amber';
  }

  return magenta ? 'magenta' : 'cyan';
}

function dressLanduse(landuse, random, referenceHeight, idOffset) {
  const neonLargeArea = (referenceHeight / 20) ** 2;

  landuse.forEach((cell, index) => {
    const id = index + idOffset;

    // The reference clips its ten-deep shadow stack inside the cell, so what
    // it actually draws here is a near-black card, not a hole.
    if (id % 3 === 0) {
      cell.role = 'dark';
      return;
    }

    cell.role = 'plaza';
    cell.rise = 2 + Math.sqrt(Math.sqrt(cell.area));

    if (random() < NEON_CHANCE) {
      const inset = Math.min(NEON_MAX_INSET, Math.min(cell.w, cell.h) / 2);
      const magenta = random() < 0.5;

      cell.neon = { inset, slot: neonSlot(cell, magenta, neonLargeArea) };
    }
  });
}

function dressTowers(towers, random) {
  towers.forEach((cell, index) => {
    cell.role = 'tower';
    cell.height = TOWER_MIN_HEIGHT + random() * TOWER_HEIGHT_RANGE;
    cell.variant = index;
  });
}

// The reference's draw pass runs stair direction, then plaza dressing, then
// tower heights, off one stream — so the order here is load-bearing.
function dress({ landuse, random, referenceHeight, stairs, towers }, idOffset) {
  dressStairs(stairs, random);
  dressLanduse(landuse, random, referenceHeight, idOffset);
  dressTowers(towers, random);

  return [...towers, ...landuse, ...stairs].filter((cell) => cell.valid);
}

function cellHash(cell) {
  const value =
    Math.sin(cell.rect.x * 12.9898 + cell.rect.y * 78.233) * 43758.5453;

  return value - Math.floor(value);
}

// Cells carry the build-clock value they appear at, so one unbounded clock
// drives both the opening sweep (births spread outward from the middle) and
// every later rolling rebuild (births land just ahead of the current clock).
function assignBirths(cells, { base, jitter, radius, spread }) {
  cells.forEach((cell) => {
    const cx = cell.footprint.x + cell.footprint.w / 2;
    const cy = cell.footprint.y + cell.footprint.h / 2;
    const radial = Math.min(Math.hypot(cx, cy) / radius, 1);

    cell.birth = base + radial * spread + cellHash(cell) * jitter;
  });
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

export default function buildCityModel({ referenceHeight, seed }) {
  const random = createPrng(seed);
  const radius = referenceHeight / 1.5;
  const root = createQuad(-radius, -radius, radius * 2, radius * 2);
  const { districts, quads } = buildQuadTree(root, random);
  const viewScale = 1 + random() * 2;
  const collected = classify({ quads, random, referenceHeight });
  const offsets = landuseOffsets(collected.landuse, districts.length);
  const cells = dress({ ...collected, random, referenceHeight }, 0);

  assignBirths(cells, { base: 0, jitter: 0.15, radius, spread: 0.85 });

  return {
    cells,
    districts: districts.map((district) => ({
      ...district,
      generation: 0,
      landuseOffset: offsets[district.index],
    })),
    radius,
    referenceHeight,
    rootSize: radius * 2,
    seed,
    viewScale,
  };
}

// A rolling rebuild replaces one district's subtree, which needs its own
// stream — the city-wide order cannot be resumed mid-sequence. The landuse id
// offset is carried over so the pit rhythm stays continuous across a rebuild.
export function rebuildDistrictCells({
  birthBase,
  district,
  generation,
  radius,
  referenceHeight,
  seed,
}) {
  const random = createPrng(seed + district.index * 7919 + generation * 104729);
  const quads = subdivide(district.bounds, random).map((quad) => ({
    ...quad,
    district: district.index,
    glow: district.glow,
  }));
  const collected = classify({ quads, random, referenceHeight });
  const cells = dress(
    { ...collected, random, referenceHeight },
    district.landuseOffset
  );

  assignBirths(cells, {
    base: birthBase + REBUILD_LEAD,
    jitter: 0.05,
    radius,
    spread: 0.2,
  });

  return cells;
}
