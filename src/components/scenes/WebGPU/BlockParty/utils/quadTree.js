const MIN_SPLIT_AREA = 100;
const MAX_SPLIT_RATIO = 5;
const GLOW_CHILD_INDEX = 1;
const LEVELS_BELOW_DISTRICT = 2;

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

export function splitQuad(quad, random) {
  if (quad.w * quad.h < MIN_SPLIT_AREA) {
    return [];
  }

  const ratio = Math.max(quad.w, quad.h) / Math.min(quad.w, quad.h);

  if (ratio > MAX_SPLIT_RATIO) {
    return [];
  }

  const t0 = 0.5 + (random() - 0.5) * 0.5;
  const t1 = 0.5 + (random() - 0.5) * 0.5;
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

// Two more jittered 4-way splits below a district, which is where the
// reference's draw pass picks the quads up.
export function subdivide(district, random) {
  let level = [district];

  for (let i = 0; i < LEVELS_BELOW_DISTRICT; i += 1) {
    level = level.flatMap((quad) => splitQuad(quad, random));
  }

  return level;
}

// Four jittered 4-way splits, with one second-level child per first-level
// quadrant flagged so the flag propagates to its whole subtree. That
// second level is the district: it is the unit the flag is assigned to, and
// the unit a rolling rebuild replaces.
export default function buildQuadTree(root, random) {
  const districts = [];
  const quads = [];

  splitQuad(root, random).forEach((first) => {
    const seconds = splitQuad(first, random);

    if (seconds[GLOW_CHILD_INDEX]) {
      seconds[GLOW_CHILD_INDEX].glow = true;
    }

    seconds.forEach((second) => {
      const glow = second.glow === true;
      const districtIndex = districts.length;

      districts.push({ bounds: second, glow, index: districtIndex });

      subdivide(second, random).forEach((quad) => {
        quads.push({ ...quad, district: districtIndex, glow });
      });
    });
  });

  return { districts, quads };
}
