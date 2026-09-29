import { lerp, signedArea, sub } from './geometry';

// Chinese cracked-ice lattice: repeatedly cut the largest piece by a chord
// between two of its sides. Cutting a convex piece leaves convex pieces.
function split(poly, [i, ti], [j, tj]) {
  const p = lerp(poly[i], poly[(i + 1) % poly.length], ti);
  const q = lerp(poly[j], poly[(j + 1) % poly.length], tj);
  const left = [p];
  for (let k = i + 1; k <= j; k += 1) left.push(poly[k]);
  left.push(q);
  const right = [q];
  for (let k = j + 1; k <= i + poly.length; k += 1) {
    right.push(poly[k % poly.length]);
  }
  right.push(p);
  return { chord: [p, q], pieces: [left, right] };
}

function longSide(poly, rng, skip = -1) {
  const weights = poly.map((p, i) =>
    i === skip ? 0 : Math.hypot(...sub(poly[(i + 1) % poly.length], p))
  );
  const total = weights.reduce((a, b) => a + b, 0);
  let pick = rng() * total;
  for (let i = 0; i < weights.length; i += 1) {
    pick -= weights[i];
    if (pick <= 0) return i;
  }
  return weights.length - 1;
}

export default function iceRay(poly, cuts, rng) {
  const pieces = [poly];
  const segments = [];
  for (let n = 0; n < cuts; n += 1) {
    pieces.sort((a, b) => Math.abs(signedArea(b)) - Math.abs(signedArea(a)));
    const target = pieces.shift();
    const i = longSide(target, rng);
    const j = longSide(target, rng, i);
    const [a, b] = i < j ? [i, j] : [j, i];
    const { chord, pieces: halves } = split(
      target,
      [a, rng.range(0.3, 0.7)],
      [b, rng.range(0.3, 0.7)]
    );
    const degenerate = halves.some(
      (half) => Math.abs(signedArea(half)) < Math.abs(signedArea(target)) * 0.12
    );
    if (degenerate) {
      pieces.push(target);
    } else {
      pieces.push(...halves);
      segments.push({ a: chord[0], b: chord[1], tier: n < 2 ? 2 : 3 });
    }
  }
  return segments;
}
