/* eslint-disable no-continue */
import { SQUARES_H, SQUARES_V } from '@utils/argylePattern';

// The argyle logo, taken from the loader's own definition rather than inferred.
// `src/app/scaffold/loader/primitives.jsx` is the authority: eleven solid
// squares of one size on a grid, drawn in a space rotated 45 degrees so they
// read as diamonds.
//
//   layer 'b'  7 squares at multiples of 1.5, drawn INK.red   (#E5202A)
//   layer 't'  4 squares at (+-0.75, +-0.75), drawn INK.black (#0A0A0A)
//
// Red under, black over. That is already emit-and-occlude, so the two layers
// are the two families and nothing has to be invented.
//
// Geometry that matters: 'b' squares sit 1.5 apart and are 1 wide, so they
// never touch. The 't' squares land in the diagonal gaps and overlap their
// neighbours' corners by a quarter of a square — deliberate, and small.
//
// A square rotated 45 degrees is exactly what |x| + |y| - r draws, with
// r = halfSide * sqrt(2). So the body is a plain diamond and only the grid
// needs the rotation.
const HALF_DIAGONAL = Math.SQRT2 / 2;
const GRID_ROTATION = Math.PI / 4;

export const ARGYLE_MODE_OPTIONS = {
  'Outer Emissive': 'outer',
  'Inner Emissive': 'inner',
  'Opposed Cycle': 'opposed',
  'Travelling Wave': 'wave',
  'All Occluding': 'grille',
};

export const ARGYLE_ORIENTATIONS = { Landscape: 'h', Portrait: 'v' };

const WAVE_WIDTH = 0.9;

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const squaresFor = (orientation) =>
  orientation === 'v' ? SQUARES_V : SQUARES_H;

// Grid coordinates are pre-rotation, so the wave sweeps the pattern as drawn.
function alongAxis(square, angle) {
  const c = Math.cos(GRID_ROTATION);
  const s = Math.sin(GRID_ROTATION);
  const x = square.sx * c - square.sy * s;
  const y = square.sx * s + square.sy * c;

  return x * Math.cos(angle) + y * Math.sin(angle);
}

function latticeExtent(squares, angle) {
  return squares.reduce(
    (widest, square) => Math.max(widest, Math.abs(alongAxis(square, angle))),
    0
  );
}

// How lit a square is: 1 a pure emitter, 0 a pure occluder. The wave works on
// a fixed pattern where it did not on the swarm — a front crossing something
// that holds still has geometry to read against, so squares turn over in
// sequence instead of the whole set flipping at once.
function squareEmission(square, squares, params, time) {
  const outer = square.layer === 'b';

  switch (params.argyleMode) {
    case 'inner':
      return outer ? 0 : 1;

    case 'opposed': {
      const offset = outer ? 0 : (params.argylePhase * Math.PI) / 180;
      const turn = (time * Math.PI * 2) / params.argyleCyclePeriod;
      return smoothstep(-0.35, 0.35, Math.sin(turn + offset));
    }

    case 'wave': {
      const angle = (params.argyleWaveAngle * Math.PI) / 180;
      const along = alongAxis(square, angle);
      const half = latticeExtent(squares, angle) + WAVE_WIDTH;
      const pass = (time * params.argyleWaveSpeed) / (2 * half);
      const front = -half + (pass - Math.floor(pass)) * 2 * half;
      const passed = smoothstep(front - WAVE_WIDTH, front + WAVE_WIDTH, along);

      return Math.floor(pass) % 2 === 0 ? 1 - passed : passed;
    }

    case 'grille':
      return 0;

    default:
      return outer ? 1 : 0;
  }
}

// Appended to whatever the swarm already wrote, so the logo can sit in front of
// a moving swarm rather than replacing it.
export default function writeArgyle(
  out,
  counts,
  params,
  { aspect, maxBodies, maxLights, scale, time }
) {
  if (!params.argyleEnabled) return counts;

  const squares = squaresFor(params.argyleOrientation);
  const unit = params.argyleScale * scale;
  const spin = (params.argyleRotation * Math.PI) / 180;
  const gridAngle = GRID_ROTATION + spin;
  const gc = Math.cos(gridAngle);
  const gs = Math.sin(gridAngle);
  const centerX = aspect * 0.5 * scale;
  const centerY = 0.5 * scale;

  // Every square is the same size in the logo; this only scales them together.
  const radius = HALF_DIAGONAL * params.argyleSquareSize * unit;

  let { bodyCount, lightCount } = counts;

  for (let i = 0; i < squares.length; i += 1) {
    if (bodyCount >= maxBodies) break;

    const square = squares[i];
    const emission = squareEmission(square, squares, params, time);
    const gx = square.sx * unit;
    const gy = square.sy * unit;

    const body = out.bodies[bodyCount];
    body.angle = spin;
    body.aperture = 0;
    body.bodyRadius = radius;
    body.centerX = centerX + gx * gc - gy * gs;
    body.centerY = centerY + gx * gs + gy * gc;
    body.color =
      square.layer === 'b' ? params.argyleOuterColor : params.argyleInnerColor;
    body.emission = emission;
    body.occluderRadius = radius * (1 - emission);
    body.orbit = 0;
    body.owner = bodyCount;
    body.shape = 2;

    const bodyIndex = bodyCount;
    bodyCount += 1;

    if (emission <= 1e-3 || lightCount >= maxLights) continue;

    const light = out.lights[lightCount];
    light.color = body.color;
    light.intensity = emission * params.lightStrength;
    light.owner = bodyIndex;
    light.radius = radius;
    light.x = body.centerX;
    light.y = body.centerY;

    lightCount += 1;
  }

  return { bodyCount, lightCount };
}
