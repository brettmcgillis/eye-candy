// Named rather than a raw side count, because these three are what the bed
// controls offer and the names are what a preset stores.
export const SHAPE_SIDES = { Square: 4, Circle: 240, Hexagon: 6 };

const TAU = Math.PI * 2;

// One edge normal must point at +z: that is the deep / upstream edge every
// driver measures its boundary band from, and Square at rotation 0 has to come
// out as the domain itself so the existing presets are unchanged.
function normalOffset(step) {
  const quarter = Math.PI / 2;
  return quarter - Math.round(quarter / step) * step;
}

function vertexExtent(sides, base, step) {
  let extent = 0;
  for (let k = 0; k < sides; k += 1) {
    const angle = base + (k + 0.5) * step;
    extent = Math.max(
      extent,
      Math.abs(Math.cos(angle)),
      Math.abs(Math.sin(angle))
    );
  }
  return extent;
}

// Only for callers that rasterise the outline into a grid and wall the cells
// outside it. A bilinear read of that wall smears it inward by a cell or two,
// so anything sampling the grid is kept this far inside the outline. Callers
// with no grid (PetriDish) pass no resolution and get no clearance.
const RIM_CLEARANCE_CELLS = 2.5;

export function createBedPolygon({
  bedRotation,
  bedShape,
  bedSize,
  resolution,
  worldSize,
}) {
  const sides = SHAPE_SIDES[bedShape] || SHAPE_SIDES.Square;
  const step = TAU / sides;
  const offset = normalOffset(step);
  const rotation = ((bedRotation || 0) * Math.PI) / 180;
  const base = rotation + offset;
  const circumscribe = 1 / Math.cos(step * 0.5);
  const fitted =
    (worldSize * 0.5) / (circumscribe * vertexExtent(sides, base, step));

  const apothem = fitted * (bedSize === undefined ? 1 : bedSize);
  // A bed that fills the domain has no rim wall to keep clear of -- that is
  // the Square at size 1 both scenes ship, and insetting it would shrink the
  // default for nothing.
  const area = sides * apothem * apothem * Math.tan(Math.PI / sides);
  const walled = area < worldSize * worldSize - 1e-6;

  return {
    apothem,
    base,
    circumscribe,
    inset:
      walled && resolution ? (RIM_CLEARANCE_CELLS * worldSize) / resolution : 0,
    sides,
    step,
    worldSize,
  };
}

export function polygonDistance(shape, x, z) {
  const { apothem, base, step } = shape;
  const swept = Math.atan2(z, x) - base;
  const angle = base + Math.round(swept / step) * step;
  return x * Math.cos(angle) + z * Math.sin(angle) - apothem;
}

// A point exactly on the boundary computes to +7e-15 rather than 0, which
// walled the entire outer ring of cells on a Square at size 1 -- the default
// every preset is built on. Anything under a micron is on the edge, not
// outside it.
const EDGE_EPSILON = 1e-6;

export function polygonOutside(shape, x, z, inset = 0) {
  return polygonDistance(shape, x, z) > EDGE_EPSILON - inset;
}

// Regular polygon of apothem a: n * a^2 * tan(pi/n). Exact for the square and
// the hexagon, and within a part in 10^4 of pi*r^2 for the 240-gon circle.
export function polygonArea(shape, inset = 0) {
  const a = Math.max(0, shape.apothem - inset);
  return shape.sides * a * a * Math.tan(Math.PI / shape.sides);
}

export function polygonOutline(shape, inset = 0) {
  const { apothem, base, circumscribe, sides, step } = shape;
  const radius = (apothem + inset) * circumscribe;
  const points = [];

  for (let k = 0; k < sides; k += 1) {
    const angle = base + (k + 0.5) * step;
    points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }

  return points;
}
