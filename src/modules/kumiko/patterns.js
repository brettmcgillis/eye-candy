import {
  add,
  centroid,
  dot,
  lerp,
  lineIntersect,
  normalize,
  scale,
  sub,
} from './geometry';
import iceRay from './iceRay';

export const TIER = { border: 0, jigumi: 1, infill: 2, detail: 3 };

const at = (poly, i) => poly[((i % poly.length) + poly.length) % poly.length];
const mid = (poly, i) => lerp(at(poly, i), at(poly, i + 1), 0.5);
const each = (poly, fn) => poly.flatMap((_, i) => fn(i));
const seg = (a, b, tier = TIER.infill) => ({ a, b, tier });

function inner(poly, k, turn = 0) {
  const c = centroid(poly);
  return poly.map((p) => {
    const d = scale(sub(p, c), k);
    const cos = Math.cos(turn);
    const sin = Math.sin(turn);
    return add(c, [d[0] * cos - d[1] * sin, d[0] * sin + d[1] * cos]);
  });
}

const ring = (poly, tier) =>
  each(poly, (i) => [seg(at(poly, i), at(poly, i + 1), tier)]);

const spokes = (poly, targets, tier) => {
  const c = centroid(poly);
  return targets.map((p) => seg(c, p, tier));
};

// Where a ray from `from` along `dir` leaves the convex cell.
function exitPoint(poly, from, dir) {
  let best = null;
  poly.forEach((a, i) => {
    const edge = sub(at(poly, i + 1), a);
    const hit = lineIntersect(from, dir, a, edge);
    if (!hit) return;
    const s = dot(sub(hit, a), edge) / dot(edge, edge);
    const t = dot(sub(hit, from), dir);
    if (s > -1e-9 && s < 1 + 1e-9 && t > 1e-9 && (!best || t < best.t)) {
      best = { point: hit, t };
    }
  });
  return best?.point ?? from;
}

function sakura(poly, k) {
  const petals = inner(poly, k);
  return [
    ...each(poly, (i) => [seg(at(poly, i), petals[i])]),
    ...ring(petals, TIER.detail),
  ];
}

// Traditional names are for the triangle grid unless a shape says otherwise.
export const PATTERNS = {
  plain: { label: 'Plain jigumi', build: () => [] },
  asanoha: {
    label: 'Asanoha',
    names: { 4: 'Yotsu-bishi', 6: 'Hex asanoha' },
    build: (poly) => spokes(poly, poly),
  },
  tsunoAsanoha: {
    label: 'Tsuno-asanoha',
    build: (poly) => {
      const c = centroid(poly);
      return [
        ...spokes(poly, poly),
        ...each(poly, (i) =>
          spokes(
            [at(poly, i), at(poly, i + 1), c],
            [at(poly, i), at(poly, i + 1), c],
            TIER.detail
          )
        ),
      ];
    },
  },
  kikko: {
    label: 'Kikkō',
    names: { 4: 'Jūji', 6: 'Hex rays' },
    build: (poly) =>
      spokes(
        poly,
        poly.map((_, i) => mid(poly, i))
      ),
  },
  sixfold: {
    label: 'Kasane-asanoha',
    build: (poly) => [
      ...spokes(poly, poly),
      ...spokes(
        poly,
        poly.map((_, i) => mid(poly, i)),
        TIER.detail
      ),
    ],
  },
  uroko: {
    label: 'Uroko',
    names: { 4: 'Hishi', 6: 'Mutsu-bishi' },
    build: (poly) =>
      ring(
        poly.map((_, i) => mid(poly, i)),
        TIER.infill
      ),
  },
  masu: {
    label: 'Masu',
    // A floating box can't be built, so it is tied to the jigumi at the
    // middle of every side.
    build: (poly, { inner: k }) => {
      const box = inner(poly, k);
      return [
        ...ring(box, TIER.infill),
        ...each(poly, (i) => [seg(mid(box, i), mid(poly, i), TIER.detail)]),
      ];
    },
  },
  sakura: {
    label: 'Sakura',
    names: { 4: 'Masu-tsunagi', 6: 'Hex sakura' },
    build: (poly, { inner: k }) => sakura(poly, k),
  },
  yaeZakura: {
    label: 'Yae-zakura',
    build: (poly, { inner: k }) => {
      const petals = inner(poly, k);
      const heart = inner(poly, k * 0.45, Math.PI / poly.length);
      return [
        ...sakura(poly, k),
        ...each(petals, (i) => [
          seg(mid(petals, i), at(heart, i), TIER.detail),
        ]),
        ...ring(heart, TIER.detail),
      ];
    },
  },
  mitsukude: {
    label: 'Mitsukude',
    names: { 4: 'Yotsu-kude', 6: 'Mutsu-kude' },
    // A turned inner polygon whose sides run on out to the jigumi: a pinwheel.
    build: (poly, { inner: k, twist }) => {
      const hub = inner(poly, k, (twist * 2 * Math.PI) / poly.length);
      return each(hub, (i) => {
        const a = at(hub, i);
        const b = at(hub, i + 1);
        const back = exitPoint(poly, a, normalize(sub(a, b)));
        return [seg(back, b)];
      });
    },
  },
  izutsu: {
    label: 'Izutsu',
    names: { 3: 'Kagome' },
    // A line parallel to every side, run right across the cell.
    build: (poly, { inset }) => {
      const c = centroid(poly);
      return each(poly, (i) => {
        const a = at(poly, i);
        const b = at(poly, i + 1);
        const toward = sub(c, lerp(a, b, 0.5));
        const shift = scale(toward, inset);
        const dir = normalize(sub(b, a));
        const start = add(lerp(a, b, 0.5), shift);
        return [
          seg(
            exitPoint(poly, start, scale(dir, -1)),
            exitPoint(poly, start, dir)
          ),
        ];
      });
    },
  },
  shokko: {
    label: 'Kaku-kikkō',
    names: { 4: 'Shokkō', 6: 'Hana-kikkō' },
    // Every corner cut off: a triangle becomes a hexagon, a square an octagon.
    build: (poly, { inset }) => {
      const t = Math.min(0.49, 0.18 + inset * 0.5);
      const cuts = each(poly, (i) => [
        seg(
          lerp(at(poly, i), at(poly, i - 1), t),
          lerp(at(poly, i), at(poly, i + 1), t)
        ),
      ]);
      if (poly.length !== 4) return cuts;
      // The shokkō diamond, tied to the middle of each side it points at.
      const diamond = inner(poly, 0.3, Math.PI / 4);
      return [
        ...cuts,
        ...ring(diamond, TIER.detail),
        ...each(diamond, (i) => [
          seg(at(diamond, i), mid(poly, i), TIER.detail),
        ]),
      ];
    },
  },
  star: {
    label: 'Hoshi',
    fits: (n) => n >= 5,
    build: (poly) => each(poly, (i) => [seg(at(poly, i), at(poly, i + 2))]),
  },
  iceRay: {
    label: 'Ice-ray',
    build: (poly, params, rng) => iceRay(poly, params.iceCuts, rng),
  },
};

export const PATTERN_IDS = Object.keys(PATTERNS);

export const fitsShape = (id, sides) => PATTERNS[id].fits?.(sides) ?? true;

export const patternLabel = (id, sides) =>
  PATTERNS[id].names?.[sides] ?? PATTERNS[id].label;
