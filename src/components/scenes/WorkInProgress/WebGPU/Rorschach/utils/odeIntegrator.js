/* eslint-disable no-param-reassign */
// Writes into caller-owned `out` buffers throughout (integrate, derivative)
// so evolution ticks never reallocate — see utils/testGenerator.js.
//
// A constant plus 9 sine/cosine terms in x,y,z, extended to 3D from the
// Clifford/de Jong attractor family (x' = sin(a·y) + c·cos(a·x), ...) — the
// classic formula shape for "curls everywhere" generative attractors. This
// replaced an earlier polynomial basis (1,x,y,z,xy,yz,xz,x²,y²,z²): every
// polynomial term's contribution *grows* with distance from the origin, so
// however curly a trajectory looked near its start, those terms inevitably
// dominated and it went ballistic/straight further out — visually "curly at
// the center, straight at the edges." Trig terms are bounded by construction
// (|sin|,|cos| ≤ 1 everywhere), so curl strength stays roughly constant at
// every radius instead of fading out. This is the 3D extension of
// nullHashPixel's 2D dx/dt,dy/dt formula builder (see docs/scene-conventions.md
// context in this scene's todo.md).
export const TERM_COUNT = 10;
export const BOUND_THRESHOLD = 40;
export const MIN_SPREAD = 1.5;

// Flat inline sum rather than looping over an array of per-term closures —
// this runs on the order of tens of millions of times per test generation at
// large Curl Length / Strands Per Bundle / Bundle Count settings, and
// closure-call dispatch overhead was the dominant cost there for the earlier
// (cheap) polynomial basis. Trig is not cheap the same way: Math.sin/cos are
// genuinely expensive transcendental calls, ~9 of them per evalAxis call, so
// each nonzero coefficient's term is only computed when its coefficient is
// actually nonzero (~55% of terms are, per formulaBuilder's TERM_INCLUDE_CHANCE)
// rather than always evaluating all 9 and multiplying half of them by zero.
// `freq` scales every trig argument (shared "curl tightness" knob, the Leva
// "Curl Frequency" control) — separate from each term's own coefficient
// (amplitude).
function evalAxis(c, x, y, z, freq) {
  let sum = c[0];
  if (c[1] !== 0) sum += c[1] * Math.sin(freq * x);
  if (c[2] !== 0) sum += c[2] * Math.cos(freq * x);
  if (c[3] !== 0) sum += c[3] * Math.sin(freq * y);
  if (c[4] !== 0) sum += c[4] * Math.cos(freq * y);
  if (c[5] !== 0) sum += c[5] * Math.sin(freq * z);
  if (c[6] !== 0) sum += c[6] * Math.cos(freq * z);
  if (c[7] !== 0) sum += c[7] * Math.sin(freq * (x + y));
  if (c[8] !== 0) sum += c[8] * Math.sin(freq * (y + z));
  if (c[9] !== 0) sum += c[9] * Math.sin(freq * (x + z));
  return sum;
}

const k1 = [0, 0, 0];
const k2 = [0, 0, 0];
const k3 = [0, 0, 0];
const k4 = [0, 0, 0];

function derivative(coeffs, x, y, z, freq, out) {
  out[0] = evalAxis(coeffs.dx, x, y, z, freq);
  out[1] = evalAxis(coeffs.dy, x, y, z, freq);
  out[2] = evalAxis(coeffs.dz, x, y, z, freq);
  return out;
}

// One RK4 step from (x,y,z). Writes the new position into `out` (a 3-element
// array/Float32Array, caller-owned). Freezes at the input position — rather
// than trust that never happens — the moment the step would leave the same
// BOUND_THRESHOLD cube isBounded() rejects candidates against: `out` may be
// a Float32Array, so the guard can't be plain Number.isFinite() — quadratic
// ODEs (and this trig basis, mid-evolution-drift) can still blow up in
// finite time, and a value can be a perfectly finite float64 (e.g. 1e40)
// that still overflows to Infinity the instant it's written into a float32
// slot, silently NaN-ing the GPU buffer even though the finiteness check
// upstream passed. Freezing at BOUND_THRESHOLD itself (rather than some far
// looser safety limit) also keeps an escaped strand from dragging the whole
// test's display scale toward zero (testGenerator.js sizes the test off the
// single farthest point across every strand).
export function stepRK4(coeffs, x, y, z, dt, freq, out) {
  derivative(coeffs, x, y, z, freq, k1);
  derivative(
    coeffs,
    x + (k1[0] * dt) / 2,
    y + (k1[1] * dt) / 2,
    z + (k1[2] * dt) / 2,
    freq,
    k2
  );
  derivative(
    coeffs,
    x + (k2[0] * dt) / 2,
    y + (k2[1] * dt) / 2,
    z + (k2[2] * dt) / 2,
    freq,
    k3
  );
  derivative(coeffs, x + k3[0] * dt, y + k3[1] * dt, z + k3[2] * dt, freq, k4);

  const nx = x + ((k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) * dt) / 6;
  const ny = y + ((k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) * dt) / 6;
  const nz = z + ((k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]) * dt) / 6;

  if (
    Number.isFinite(nx) &&
    Number.isFinite(ny) &&
    Number.isFinite(nz) &&
    Math.abs(nx) < BOUND_THRESHOLD &&
    Math.abs(ny) < BOUND_THRESHOLD &&
    Math.abs(nz) < BOUND_THRESHOLD
  ) {
    out[0] = nx;
    out[1] = ny;
    out[2] = nz;
  } else {
    out[0] = x;
    out[1] = y;
    out[2] = z;
  }

  return out;
}

const stepScratch = [0, 0, 0];

// One-shot integrator built from stepRK4: writes `steps` points (including
// the start point) into `out`, a flat Float32Array of length steps*3.
// `out`/the module-level scratch are reused across calls (evolution
// re-integrates the same bundle every tick) so this never allocates.
// testGenerator.js's incremental grower calls stepRK4 directly instead —
// this one-shot form stays in use for evolution, which still wants a full
// from-scratch recompute each tick after coefficients drift.
export function integrate(coeffs, start, steps, dt, freq, out) {
  let x = start[0];
  let y = start[1];
  let z = start[2];
  out[0] = x;
  out[1] = y;
  out[2] = z;

  for (let i = 1; i < steps; i += 1) {
    stepRK4(coeffs, x, y, z, dt, freq, stepScratch);
    [x, y, z] = stepScratch;

    const o = i * 3;
    out[o] = x;
    out[o + 1] = y;
    out[o + 2] = z;
  }

  return out;
}

// Rejects a candidate field if it diverges (NaN/Infinity or leaves a cube of
// side 2*boundThreshold) or collapses to a near-fixed point (bounding-box
// diagonal below minSpread) — both are the overwhelmingly common outcome of
// purely random coefficients.
export function isBounded(points, boundThreshold, minSpread) {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < points.length; i += 3) {
    const x = points[i];
    const y = points[i + 1];
    const z = points[i + 2];
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      return false;
    }
    if (
      Math.abs(x) > boundThreshold ||
      Math.abs(y) > boundThreshold ||
      Math.abs(z) > boundThreshold
    ) {
      return false;
    }
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  const spread = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ);
  return spread >= minSpread;
}
