const MIN_SPLIT_AREA = 100;
const MAX_SPLIT_RATIO = 5;
const GLOW_CHILD_INDEX = 1;
const RANDOM_GLOW_CHANCE = 0.25;

export function createQuad(x, y, w, h) {
  return {
    x,
    y,
    w,
    h,
    area: w * h,
    points: [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ],
  };
}

export function splitQuad(quad, random, jitter = 0.5) {
  if (quad.w * quad.h < MIN_SPLIT_AREA) {
    return [];
  }

  const ratio = Math.max(quad.w, quad.h) / Math.min(quad.w, quad.h);

  if (ratio > MAX_SPLIT_RATIO) {
    return [];
  }

  const t0 = 0.5 + (random() - 0.5) * jitter;
  const t1 = 0.5 + (random() - 0.5) * jitter;
  const w = quad.w * t0;
  const h = quad.h * t1;
  const w2 = quad.w * (1 - t0);
  const h2 = quad.h * (1 - t1);

  return [
    createQuad(quad.x, quad.y, w, h),
    createQuad(quad.x + w, quad.y, w2, h),
    createQuad(quad.x, quad.y + h, w, h2),
    createQuad(quad.x + w, quad.y + h, w2, h2),
  ];
}

export function subdivide(district, random, { splitJitter, subdivisionDepth }) {
  let level = [district];

  for (let i = 0; i < subdivisionDepth; i += 1) {
    level = level.flatMap((quad) => splitQuad(quad, random, splitJitter));
  }

  return level;
}

function districtHash(seed, index) {
  const value = Math.sin(seed * 91.7 + index * 37.3) * 43758.5453;

  return value - Math.floor(value);
}

function isGlowing(mode, { childIndex, index, seed }) {
  if (mode === 'all') return true;
  if (mode === 'none') return false;
  if (mode === 'random') return districtHash(seed, index) < RANDOM_GLOW_CHANCE;

  return childIndex === GLOW_CHILD_INDEX;
}

// Two jittered 4-way splits make the districts: the unit the glow flag is
// assigned to, and the unit a rolling rebuild replaces.
export default function buildQuadTree(root, random, composition, seed) {
  const districts = [];
  const quads = [];
  const { glowMode, splitJitter } = composition;

  splitQuad(root, random, splitJitter).forEach((first) => {
    splitQuad(first, random, splitJitter).forEach((second, childIndex) => {
      const index = districts.length;
      const glow = isGlowing(glowMode, { childIndex, index, seed });

      districts.push({ bounds: second, glow, index });

      subdivide(second, random, composition).forEach((quad) => {
        quads.push({ ...quad, district: index, glow });
      });
    });
  });

  return { districts, quads };
}
