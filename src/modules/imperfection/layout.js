// The reference composition's structural lines: the warm column's edges and
// the cool seam across u, the band and the core's top up v. A layout moves
// them; everything between follows piecewise linearly.
export const CANONICAL_U = [0.2, 0.49, 0.72];
export const CANONICAL_V = [0.33, 0.6, 0.86];

const MIN_GAP = 0.04;

function ordered(knots) {
  const out = [...knots];
  for (let i = 0; i < out.length; i += 1) {
    const low = (i === 0 ? 0 : out[i - 1]) + MIN_GAP;
    out[i] = Math.max(out[i], low);
  }
  for (let i = out.length - 1; i >= 0; i -= 1) {
    const high = (i === out.length - 1 ? 1 : out[i + 1]) - MIN_GAP;
    out[i] = Math.min(out[i], high);
  }
  return out;
}

export function layoutKnots(config) {
  return {
    u: ordered([config.columnLeft, config.columnRight, config.seamRight]),
    v: ordered([config.bandLow, config.bandHigh, config.coreTop]),
  };
}

export const isCanonical = ({ u, v }) =>
  u.every((k, i) => k === CANONICAL_U[i]) &&
  v.every((k, i) => k === CANONICAL_V[i]);

// Maps x through knots `from` → `to` (both with 0 and 1 implied as the ends);
// beyond [0, 1] the end segments extend.
export function mapAxis(x, from, to) {
  const a = [0, ...from, 1];
  const b = [0, ...to, 1];
  let i = 0;
  while (i < a.length - 2 && x > a[i + 1]) i += 1;
  return b[i] + ((x - a[i]) * (b[i + 1] - b[i])) / (a[i + 1] - a[i]);
}

export const warpPoint = ([x, y], knots) => [
  mapAxis(x, CANONICAL_U, knots.u),
  mapAxis(y, CANONICAL_V, knots.v),
];
