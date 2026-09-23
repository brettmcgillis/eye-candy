/* eslint-disable no-param-reassign */
import { BEAD_KIND } from './emit';
import solveLayout, { bodyCurve } from './layout';

const TAU = Math.PI * 2;

// Radius along a sporangium, 0 at its foot and 1 at its tip: a capsule
// (Stemonitis) or an egg (Arcyria).
function profile(shape, u) {
  if (shape === 'egg') return Math.sin(Math.PI * u ** 0.8) ** 0.8;

  return Math.min(1, u / 0.1) ** 0.5 * Math.min(1, (1 - u) / 0.14) ** 0.6;
}

// A capillitium is an even mesh over the sporangium, so it is sampled in the
// unrolled (length × circumference) metric — with θ wrapping — rather than
// through the radial network, whose cells are tied to a polar radius.
function wrapNet(e, rng, o) {
  const { length, place, radius, spacing, thickness } = o;
  const circumference = TAU * radius;
  const cols = Math.max(4, Math.round(circumference / spacing));
  const rows = Math.max(3, Math.round(length / spacing));
  const nodes = [];

  for (let j = 0; j <= rows; j += 1) {
    const u = j / rows;
    const around = Math.max(3, Math.round(cols * o.profile(u)));

    for (let i = 0; i < around; i += 1) {
      nodes.push([
        Math.min(1, Math.max(0, u + (rng.signed() * 0.35) / rows)),
        (TAU * (i + (j % 2) * 0.5 + rng.signed() * 0.3)) / around,
        around,
      ]);
    }
  }

  const dist = (a, b) => {
    let dt = Math.abs(a[1] - b[1]);

    if (dt > Math.PI) dt = TAU - dt;

    return Math.hypot((a[0] - b[0]) * length, dt * radius * o.profile(a[0]));
  };
  const seen = new Set();
  const p = [0, 0, 0];
  const q = [0, 0, 0];

  nodes.forEach((a, i) => {
    const near = nodes
      .map((b, j) => [j, dist(a, b)])
      .filter(([j, d]) => j !== i && d < spacing * 2.2)
      .sort((x, y) => x[1] - y[1])
      .slice(0, 7);

    near.forEach(([j, dab]) => {
      const key = i < j ? `${i}:${j}` : `${j}:${i}`;

      if (seen.has(key)) return;
      const blocked = near.some(
        ([k, dak]) => k !== j && dak < dab && dist(nodes[j], nodes[k]) < dab
      );

      if (blocked) return;
      seen.add(key);
      const b = nodes[j];
      let dt = b[1] - a[1];

      if (dt > Math.PI) dt -= TAU;
      if (dt < -Math.PI) dt += TAU;
      const pts = [];

      for (let k = 0; k <= 2; k += 1) {
        const t = k / 2;

        place(a[0] + (b[0] - a[0]) * t, a[1] + dt * t, k === 1 ? q : p);
        pts.push(...(k === 1 ? q : p));
      }
      e.fiber(pts, {
        born: (k, t) => o.born(a[0] + (b[0] - a[0]) * t),
        color: (k, t) => o.color(a[0] + (b[0] - a[0]) * t),
        glow: 0.4,
        occlusion: 0.85,
        rand: rng(),
        radius: thickness,
        sag: o.sag,
        shade: 0.85 + rng() * 0.3,
      });
    });
  });
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// Where each stalk's foot and tip sit before the layout pulls them apart: one
// tight foot, and tips thrown unevenly — clumped, some leaning far out, some
// short — rather than a planted grid.
function colonyBodies(spor, rng, noise) {
  const stalks = Math.max(4, Math.round(spor.stalks));
  const common = [rng.signed() * spor.lean, rng.signed() * spor.lean];
  const footR = spor.radius * 0.22 * Math.sqrt(stalks) * 0.9;
  const bodies = [];

  for (let i = 0; i < stalks; i += 1) {
    const a = i * GOLDEN + rng.signed() * 0.9;
    const f = Math.sqrt((i + 0.5) / stalks);
    const clump = 0.55 + 0.9 * Math.abs(noise.noise1(a * 0.8, 5));
    const reach = spor.colony * f * clump * rng.range(0.6, 1.25);
    const height =
      spor.height *
      (rng.chance(0.18) ? rng.range(0.55, 0.8) : rng.range(0.82, 1.12));
    const R = spor.radius * rng.range(0.85, 1.15);
    const foot = [
      Math.cos(a) * footR * f * rng(),
      0,
      Math.sin(a) * footR * f * rng(),
    ];
    const top = [
      Math.cos(a) * reach + common[0] * height,
      height,
      Math.sin(a) * reach + common[1] * height,
    ];
    const footFrac = 1 - spor.sporangium * rng.range(0.9, 1.1);

    bodies.push({
      R,
      curve: {
        lane: rng(),
        sway: rng.range(0, 0.05),
        swayPhase: rng() * TAU,
        swayShift: rng() * TAU,
        wobble: rng.range(0.01, 0.04),
      },
      foot,
      footFrac,
      footLean: 0.9,
      freeFrom: footFrac * 0.85,
      head: [],
      home: [...top],
      lift: 0.25,
      maxLean: 1.1,
      rise: [height * 0.8, height * 1.05],
      top,
      topLean: 0.55,
      tube: (v) =>
        v < footFrac
          ? R * 0.22
          : R *
            Math.max(0.2, profile(spor.shape, (v - footFrac) / (1 - footFrac))),
    });
  }

  solveLayout(bodies, { gap: spor.radius * 0.12, iterations: 110 });

  return bodies;
}

// A slime-mould colony: a tuft of hair-thin stalks from one foot, each
// carrying a sporangium whose capillitium is a reticulate net around a
// columella, packed with spores that the spore phase lets fall.
export default function buildSporangia(e, g, rng, noise, detail = 1) {
  const { spor } = g;
  const bodies = colonyBodies(spor, rng, noise);
  let tallest = 0;

  bodies.forEach((body, index) => {
    const curve = bodyCurve(body);
    const { R, footFrac: foot } = body;
    const height = body.top[1];
    const out =
      Math.hypot(body.top[0], body.top[2]) / Math.max(1e-3, spor.colony);
    const own = (index / bodies.length) * 0.12;
    const p = [0, 0, 0];

    tallest = Math.max(tallest, height);

    const stalk = [];

    for (let k = 0; k <= 24; k += 1) {
      curve.point((k / 24) * 0.97, p);
      stalk.push(p[0], p[1], p[2]);
    }
    e.fiber(stalk, {
      born0: own,
      born1: own + 0.4,
      color: (i, t) => (t < foot ? 0.25 : 0.32),
      rand: rng(),
      radius: (i, t) => R * (t < foot ? 0.2 - 0.06 * t : 0.1),
      sag: (i, t) => height * t * 0.25 * out,
      shade: 0.8 + rng() * 0.3,
    });

    const span = 1 - foot;
    const length = curve.length * span;
    const place = (u, theta, target) => {
      const r =
        R *
        profile(spor.shape, u) *
        (1 + noise.noise2(theta * 2, u * 5 + index) * 0.12);

      return curve.surface(foot + u * span * 0.97, theta, r, target);
    };

    wrapNet(e, rng, {
      born: (u) => own + 0.4 + 0.45 * u,
      color: (u) => 0.72 + 0.26 * u,
      length,
      place,
      profile: (u) => Math.max(0.12, profile(spor.shape, u)),
      radius: R,
      sag: height * 0.25 * out,
      spacing: Math.sqrt(
        (TAU * R * length) / (spor.netDensity * Math.sqrt(detail))
      ),
      thickness: R * 0.03,
    });

    const spores = Math.round(300 * detail * (length / (R * 20)));
    const axis = [0, 0, 0];

    for (let k = 0; k < spores; k += 1) {
      const u = rng();

      place(u, rng() * TAU, p);
      curve.point(foot + u * span * 0.97, axis);
      const depth = Math.sqrt(rng()) * 0.9;

      e.bead(
        axis[0] + (p[0] - axis[0]) * depth,
        axis[1] + (p[1] - axis[1]) * depth,
        axis[2] + (p[2] - axis[2]) * depth,
        R * rng.range(0.18, 0.32),
        {
          born: own + 0.4 + 0.45 * u,
          color: 0.62,
          kind: BEAD_KIND.held,
          rand: rng(),
          sag: height * 0.25 * out,
        }
      );
    }
  });

  return { height: tallest };
}
