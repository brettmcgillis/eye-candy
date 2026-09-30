import {
  add,
  centroid,
  dist,
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

// A line parallel to every side, `inset` of the way in toward the centre,
// run right across the cell.
function parallels(poly, inset) {
  const c = centroid(poly);
  return each(poly, (i) => {
    const a = at(poly, i);
    const b = at(poly, i + 1);
    const start = add(lerp(a, b, 0.5), scale(sub(c, lerp(a, b, 0.5)), inset));
    const dir = normalize(sub(b, a));
    return [
      seg(exitPoint(poly, start, scale(dir, -1)), exitPoint(poly, start, dir)),
    ];
  });
}

// Where a triangle's corner bisectors meet.
function incentre(tri) {
  const w = tri.map((_, i) => dist(at(tri, i + 1), at(tri, i + 2)));
  const total = w[0] + w[1] + w[2];
  return tri.reduce((sum, p, i) => add(sum, scale(p, w[i] / total)), [0, 0]);
}

function sakura(poly, k) {
  const petals = inner(poly, k);
  return [
    ...each(poly, (i) => [seg(at(poly, i), petals[i])]),
    ...ring(petals, TIER.detail),
  ];
}

// Traditional names are for the triangle grid unless a shape says otherwise.
// A `phased` pattern is only 2-fold on its shape: it is built with poly[0]
// and poly[2] on the grid's even corners, so neighbours meet in 2×2 motifs.
export const PATTERNS = {
  plain: { label: 'Plain jigumi', names: { 3: 'Mitsukude' }, build: () => [] },
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
    // Every spoke doubled: two pieces from each corner to the two corners of
    // a small central 2n-gon that flank it.
    build: (poly, { inner: k }) => {
      const c = centroid(poly);
      const r = dist(c, poly[0]) * k * 0.35;
      const half = Math.PI / (2 * poly.length);
      const tips = poly.map((p) => {
        const d = sub(p, c);
        const angle = Math.atan2(d[1], d[0]);
        return [angle - half, angle + half].map((t) =>
          add(c, [r * Math.cos(t), r * Math.sin(t)])
        );
      });
      const heart = tips.flat().sort((p, q) => {
        const u = sub(p, c);
        const v = sub(q, c);
        return Math.atan2(u[1], u[0]) - Math.atan2(v[1], v[0]);
      });
      return [
        ...poly.flatMap((p, i) => tips[i].map((tip) => seg(p, tip))),
        ...ring(heart, TIER.detail),
      ];
    },
  },
  pinwheel: {
    label: 'Pinwheel',
    // A turned inner polygon whose sides run on out to the jigumi.
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
  goma: {
    label: 'Goma',
    // Three pieces lapped over each other, each parallel to a side and a
    // third of the way in.
    build: (poly) => parallels(poly, 0.3),
  },
  kakuAsanoha: {
    label: 'Kaku-asanoha',
    fits: (n) => n === 4,
    phased: (n) => n === 4,
    // One diagonal between the even corners, each half an asanoha to its
    // incentre: sixteen rays meet at every other corner.
    build: (poly) => {
      const halves = [
        [at(poly, 0), at(poly, 1), at(poly, 2)],
        [at(poly, 2), at(poly, 3), at(poly, 0)],
      ];
      return [
        seg(at(poly, 0), at(poly, 2)),
        ...halves.flatMap((tri) => {
          const hub = incentre(tri);
          return tri.map((p) => seg(p, hub, TIER.detail));
        }),
      ];
    },
  },
  izutsu: {
    label: 'Izutsu',
    build: (poly, { inset }) => parallels(poly, inset),
  },
  shokko: {
    label: 'Kaku-kikkō',
    names: { 4: 'Shokkō', 6: 'Hana-kikkō' },
    phased: (n) => n === 4,
    build: (poly, { inset }) => {
      if (poly.length !== 4) {
        // Every corner cut off: a triangle becomes a hexagon.
        const t = Math.min(0.49, 0.18 + inset * 0.5);
        return each(poly, (i) => [
          seg(
            lerp(at(poly, i), at(poly, i - 1), t),
            lerp(at(poly, i), at(poly, i + 1), t)
          ),
        ]);
      }
      // A small square in each even corner (four make the lattice's little
      // windows) and a diagonal joining their inner corners: four diagonals
      // round an odd corner are the octagon.
      const t = Math.min(0.45, 0.12 + inset * 0.5);
      const boxes = [0, 2].map((i) => {
        const p = at(poly, i);
        const next = lerp(p, at(poly, i + 1), t);
        const prev = lerp(p, at(poly, i - 1), t);
        const inside = add(next, sub(prev, p));
        return {
          inside,
          sides: [
            seg(next, inside, TIER.detail),
            seg(prev, inside, TIER.detail),
          ],
        };
      });
      return [
        ...boxes.flatMap((box) => box.sides),
        seg(boxes[0].inside, boxes[1].inside),
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

export const isPhased = (id, sides) => PATTERNS[id].phased?.(sides) ?? false;

export const patternLabel = (id, sides) =>
  PATTERNS[id].names?.[sides] ?? PATTERNS[id].label;
