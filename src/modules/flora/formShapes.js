const TAU = Math.PI * 2;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// Every form can place its tips two ways: `sample` draws an independent random
// point inside the form's volume — a cloud — and `unit` returns the centre of
// the u-th of U units arranged the way the form would really grow: a
// phyllotactic spiral, a ring of rays, a stack of whorls. `crownStructure`
// blends between them. The cloud is what made every crown read alike; the
// lattice is what gives one an identity.
function ellipsoidUnit(u, U, radii) {
  const y = U > 1 ? 1 - (2 * (u + 0.5)) / U : 0;
  const ring = Math.sqrt(Math.max(0, 1 - y * y));
  const a = u * GOLDEN;

  return [
    Math.cos(a) * ring * radii[0],
    y * radii[1],
    Math.sin(a) * ring * radii[2],
  ];
}

function shellRadius(rng, shellBias) {
  return rng() ** (1 / 3 + (0.07 - 1 / 3) * shellBias);
}

function onSphere(rng) {
  const y = rng.signed();
  const t = rng() * TAU;
  const s = Math.sqrt(1 - y * y);

  return [s * Math.cos(t), y, s * Math.sin(t)];
}

const FORMS = {
  blob: {
    density: 1,
    lift: 1,
    make(rng, size, p) {
      const radii = [
        size * rng.range(0.55, 1.1),
        size * rng.range(0.5, 1.1) * p.crownStretch,
        size * rng.range(0.55, 1.1),
      ];

      return {
        radii,
        sample: () => {
          const d = onSphere(rng);
          const r = shellRadius(rng, p.shellBias);

          return [
            d[0] * r * radii[0],
            d[1] * r * radii[1],
            d[2] * r * radii[2],
          ];
        },
        unit: (u, U) => ellipsoidUnit(u, U, radii),
      };
    },
  },
  bowl: {
    density: 0.4,
    lift: 0.2,
    make(rng, size) {
      const cap = rng.range(0.9, 1.75);
      const depth = rng.range(0.5, 1.1);

      return {
        offset: [0, size * depth, 0],
        radii: [size, size * depth, size],
        sample: () => {
          const phi = rng() * cap;
          const t = rng() * TAU;
          const r = size * rng.range(0.82, 1.05);

          return [
            Math.sin(phi) * Math.cos(t) * r,
            -Math.cos(phi) * r * depth,
            Math.sin(phi) * Math.sin(t) * r,
          ];
        },
        // A Vogel spiral across the cap: the arrangement of a daisy's disc.
        unit: (u, U) => {
          const phi = Math.sqrt((u + 0.5) / U) * cap;
          const a = u * GOLDEN;

          return [
            Math.sin(phi) * Math.cos(a) * size,
            -Math.cos(phi) * size * depth,
            Math.sin(phi) * Math.sin(a) * size,
          ];
        },
      };
    },
  },
  capitulum: {
    density: 0.35,
    lift: 0.35,
    make(rng, size) {
      const radius = size * rng.range(0.9, 1.45);
      const crown = size * rng.range(0.08, 0.24);
      const rimLift = rng.range(0.03, 0.18);

      return {
        radii: [radius, crown * 1.6, radius],
        sample: () => {
          const r = radius * Math.sqrt(rng());
          const a = rng() * TAU;
          const edge = r / radius;

          return [
            Math.cos(a) * r,
            crown * (1 - edge * edge) + rimLift * size * edge,
            Math.sin(a) * r,
          ];
        },
        unit: (u, U) => {
          const r = radius * Math.sqrt((u + 0.5) / U);
          const a = u * GOLDEN;
          const edge = r / radius;

          return [
            Math.cos(a) * r,
            crown * (1 - edge * edge) + rimLift * size * edge,
            Math.sin(a) * r,
          ];
        },
      };
    },
  },
  corymb: {
    density: 0.5,
    lift: 0.45,
    make(rng, size) {
      const radius = size * rng.range(0.9, 1.55);
      const depth = size * rng.range(0.2, 0.55);
      const tiers = Math.round(rng.range(3, 6));
      const twist = rng.signed() * 0.35;

      return {
        radii: [radius, depth, radius],
        sample: () => {
          const tier = Math.floor(rng() * tiers);
          const level = tiers > 1 ? tier / (tiers - 1) : 0;
          const tierRadius = radius * (1 - level * rng.range(0.15, 0.5));
          const r = tierRadius * Math.sqrt(rng());
          const a = rng() * TAU + level * twist;

          return [
            Math.cos(a) * r,
            -depth * level + rng.signed() * depth * 0.08,
            Math.sin(a) * r,
          ];
        },
        unit: (u, U) => {
          const per = Math.max(1, Math.ceil(U / tiers));
          const tier = Math.min(tiers - 1, Math.floor(u / per));
          const level = tiers > 1 ? tier / (tiers - 1) : 0;
          const local = (u % per) + 0.5;
          const tierCount = Math.min(per, U - tier * per);
          const tierRadius = radius * (1 - level * 0.38);
          const r = tierRadius * Math.sqrt(local / Math.max(1, tierCount));
          const a = u * GOLDEN + level * twist;

          return [Math.cos(a) * r, -depth * level, Math.sin(a) * r];
        },
      };
    },
  },
  raceme: {
    density: 0.45,
    lift: 0.8,
    make(rng, size) {
      const height = size * rng.range(1.3, 2.4);
      const radius = size * rng.range(0.25, 0.55);
      const lean = rng.signed() * 0.25;

      return {
        radii: [radius * 1.35, height * 0.5, radius * 1.35],
        sample: () => {
          const s = rng();
          const a = rng() * TAU;
          const flare = radius * (1 - s * rng.range(0.1, 0.45));
          const r = flare * rng.range(0.55, 1.1);
          const y = s * height - height * 0.5;

          return [Math.cos(a) * r + y * lean, y, Math.sin(a) * r];
        },
        unit: (u, U) => {
          const s = (u + 0.5) / U;
          const a = u * GOLDEN;
          const r = radius * (1 - s * 0.35);
          const y = s * height - height * 0.5;

          return [Math.cos(a) * r + y * lean, y, Math.sin(a) * r];
        },
      };
    },
  },
  spadix: {
    density: 0.75,
    lift: 0.85,
    make(rng, size) {
      const height = size * rng.range(1.1, 2.1);
      const radius = size * rng.range(0.16, 0.34);
      const taper = rng.range(0.15, 0.45);

      return {
        radii: [radius, height * 0.5, radius],
        sample: () => {
          const s = rng();
          const a = rng() * TAU;
          const core = radius * (1 - taper * Math.abs(s - 0.5) * 2);
          const r = core * Math.sqrt(rng());

          return [Math.cos(a) * r, s * height - height * 0.5, Math.sin(a) * r];
        },
        unit: (u, U) => {
          const rings = Math.max(3, Math.round(Math.sqrt(U)));
          const per = Math.max(1, Math.ceil(U / rings));
          const ring = Math.min(rings - 1, Math.floor(u / per));
          const s = (ring + 0.5) / rings;
          const a = ((u % per) / per) * TAU + ring * GOLDEN;
          const r = radius * (1 - taper * Math.abs(s - 0.5) * 2);

          return [Math.cos(a) * r, s * height - height * 0.5, Math.sin(a) * r];
        },
      };
    },
  },
  panicle: {
    density: 0.65,
    lift: 0.6,
    make(rng, size) {
      const height = size * rng.range(1.1, 2.2);
      const radius = size * rng.range(0.65, 1.2);
      const looseness = rng.range(0.45, 0.9);

      return {
        radii: [radius, height * 0.5, radius],
        sample: () => {
          const s = rng();
          const a = rng() * TAU;
          const spread = radius * (1 - s * 0.55);
          const r = spread * rng.range(0.2, 1) ** looseness;

          return [Math.cos(a) * r, s * height - height * 0.5, Math.sin(a) * r];
        },
        unit: (u, U) => {
          const arms = Math.max(5, Math.round(Math.sqrt(U * 1.4)));
          const steps = Math.max(1, Math.ceil(U / arms));
          const arm = u % arms;
          const step = Math.floor(u / arms) % steps;
          const s = (step + 0.5) / steps;
          const a = (arm / arms) * TAU + step * GOLDEN * 0.35;
          const branch =
            0.25 +
            0.75 * ((Math.sin((arm + 1) * 12.9898 + step * 78.233) + 1) * 0.5);
          const r = radius * (1 - s * 0.55) * branch;

          return [Math.cos(a) * r, s * height - height * 0.5, Math.sin(a) * r];
        },
      };
    },
  },
  thistle: {
    density: 0.85,
    lift: 0.85,
    make(rng, size, p) {
      const radii = [
        size * rng.range(0.65, 1.05),
        size * rng.range(0.55, 0.95) * p.crownStretch,
        size * rng.range(0.65, 1.05),
      ];
      const bristle = rng.range(0.08, 0.2);

      return {
        radii: [
          radii[0] * (1 + bristle),
          radii[1] * (1 + bristle),
          radii[2] * (1 + bristle),
        ],
        sample: () => {
          const d = onSphere(rng);
          const r = shellRadius(rng, Math.max(0.75, p.shellBias));
          const spike = 1 + bristle * rng();

          return [
            d[0] * r * radii[0] * spike,
            d[1] * r * radii[1] * spike,
            d[2] * r * radii[2] * spike,
          ];
        },
        unit: (u, U) => {
          const point = ellipsoidUnit(u, U, radii);
          const spike = 1 + bristle * (0.5 + 0.5 * Math.sin(u * GOLDEN * 5));

          return [point[0] * spike, point[1] * spike, point[2] * spike];
        },
      };
    },
  },
  protea: {
    density: 0.42,
    lift: 0.45,
    make(rng, size) {
      const rings = Math.round(rng.range(4, 7));
      const radius = size * rng.range(0.75, 1.25);
      const cup = size * rng.range(0.35, 0.75);
      const twist = rng.signed() * 0.45;

      return {
        offset: [0, cup * 0.25, 0],
        radii: [radius, cup, radius],
        sample: () => {
          const s = rng();
          const ring = Math.floor(s * rings);
          const level = rings > 1 ? ring / (rings - 1) : 0;
          const a = rng() * TAU + level * twist;
          const r = radius * (1 - level * 0.65) * rng.range(0.85, 1.08);

          return [
            Math.cos(a) * r,
            cup * (level - 0.5) + Math.cos(level * Math.PI) * cup * 0.18,
            Math.sin(a) * r,
          ];
        },
        unit: (u, U) => {
          const per = Math.max(1, Math.ceil(U / rings));
          const ring = Math.min(rings - 1, Math.floor(u / per));
          const level = rings > 1 ? ring / (rings - 1) : 0;
          const a = ((u % per) / per) * TAU + ring * GOLDEN + level * twist;
          const r = radius * (1 - level * 0.65);

          return [
            Math.cos(a) * r,
            cup * (level - 0.5) + Math.cos(level * Math.PI) * cup * 0.18,
            Math.sin(a) * r,
          ];
        },
      };
    },
  },
  bottlebrush: {
    density: 0.8,
    lift: 0.7,
    make(rng, size) {
      const height = size * rng.range(1, 2.1);
      const radius = size * rng.range(0.45, 0.85);
      const core = size * rng.range(0.08, 0.18);

      return {
        radii: [radius + core, height * 0.5, radius + core],
        sample: () => {
          const s = rng();
          const a = rng() * TAU;
          const r = core + radius * rng.range(0.55, 1.05);

          return [Math.cos(a) * r, s * height - height * 0.5, Math.sin(a) * r];
        },
        unit: (u, U) => {
          const rings = Math.max(3, Math.round(Math.sqrt(U)));
          const per = Math.max(1, Math.ceil(U / rings));
          const ring = Math.min(rings - 1, Math.floor(u / per));
          const s = (ring + 0.5) / rings;
          const a = ((u % per) / per) * TAU + ring * GOLDEN;
          const r = core + radius;

          return [Math.cos(a) * r, s * height - height * 0.5, Math.sin(a) * r];
        },
      };
    },
  },
  fan: {
    density: 0.5,
    lift: 0,
    make(rng, size, p) {
      const spread = rng.range(0.5, 1.45);
      const yaw = rng() * TAU;
      const thickness = rng.range(0.08, 0.4);
      const reach = size * rng.range(1.2, 1.9);

      return {
        offset: [0, reach * 0.5, 0],
        radii: [reach * Math.sin(spread), reach * 0.5, reach * thickness],
        sample: () => {
          const a = rng.signed() * spread;
          const r = reach * shellRadius(rng, p.shellBias);
          const x = Math.sin(a) * r;
          const z = rng.signed() * thickness * r;

          return [
            x * Math.cos(yaw) - z * Math.sin(yaw),
            Math.cos(a) * r - reach * 0.5,
            x * Math.sin(yaw) + z * Math.cos(yaw),
          ];
        },
        // Ribs across the arc, each carrying a run of units outward.
        unit: (u, U) => {
          const rays = Math.max(3, Math.round(Math.sqrt(U * 2)));
          const steps = Math.max(1, Math.ceil(U / rays));
          const ray = u % rays;
          const step = Math.floor(u / rays) % steps;
          const a = ((2 * (ray + 0.5)) / rays - 1) * spread;
          const r = reach * (0.4 + 0.6 * ((step + 0.5) / steps));
          const x = Math.sin(a) * r;

          return [
            x * Math.cos(yaw),
            Math.cos(a) * r - reach * 0.5,
            x * Math.sin(yaw),
          ];
        },
      };
    },
  },
  umbel: {
    density: 0.55,
    lift: 0.6,
    make(rng, size) {
      const cap = rng.range(0.35, 0.95);
      const dome = size * rng.range(1.1, 1.9);

      return {
        radii: [dome * Math.sin(cap), size * 0.35, dome * Math.sin(cap)],
        sample: () => {
          const phi = Math.sqrt(rng()) * cap;
          const t = rng() * TAU;
          const r = dome * rng.range(0.92, 1.02);

          return [
            Math.sin(phi) * Math.cos(t) * r,
            (Math.cos(phi) - 1) * r * 0.8,
            Math.sin(phi) * Math.sin(t) * r,
          ];
        },
        // Rays from one point over a dome — an umbel's actual construction.
        unit: (u, U) => {
          const phi = Math.sqrt((u + 0.5) / U) * cap;
          const a = u * GOLDEN;

          return [
            Math.sin(phi) * Math.cos(a) * dome,
            (Math.cos(phi) - 1) * dome * 0.8,
            Math.sin(phi) * Math.sin(a) * dome,
          ];
        },
      };
    },
  },
  cone: {
    density: 0.5,
    lift: 0,
    make(rng, size) {
      const height = size * rng.range(1.3, 2.3);
      const flare = rng.range(0.35, 0.9);

      return {
        offset: [0, height * 0.5, 0],
        radii: [height * flare * 0.7, height * 0.5, height * flare * 0.7],
        sample: () => {
          const h = rng() ** 0.6;
          const t = rng() * TAU;
          const r = Math.sqrt(rng()) * h * height * flare;

          return [Math.cos(t) * r, h * height - height * 0.5, Math.sin(t) * r];
        },
        // Whorls up the spike, each turned from the last by the golden angle.
        unit: (u, U) => {
          const levels = Math.max(2, Math.round(Math.sqrt(U / 2)));
          const per = Math.max(1, Math.ceil(U / levels));
          const level = Math.min(levels - 1, Math.floor(u / per));
          const h = ((level + 0.5) / levels) ** 0.6;
          const a = ((u % per) / per) * TAU + level * GOLDEN;
          const r = h * height * flare;

          return [Math.cos(a) * r, h * height - height * 0.5, Math.sin(a) * r];
        },
      };
    },
  },
  plume: {
    density: 0.9,
    lift: 1.2,
    make(rng, size, p) {
      const radii = [
        size * rng.range(0.25, 0.5),
        size * rng.range(1.2, 2),
        size * rng.range(0.25, 0.5),
      ];

      return {
        radii,
        sample: () => {
          const d = onSphere(rng);
          const r = shellRadius(rng, p.shellBias);

          return [
            d[0] * r * radii[0],
            d[1] * r * radii[1],
            d[2] * r * radii[2],
          ];
        },
        unit: (u, U) => ellipsoidUnit(u, U, radii),
      };
    },
  },
  weep: {
    density: 0.4,
    lift: 0.3,
    make(rng, size) {
      const reach = size * rng.range(1.1, 1.8);
      const droop = rng.range(0.6, 1.4);

      return {
        radii: [reach, reach * 0.5, reach],
        sample: () => {
          const t = rng() * TAU;
          const s = rng();
          const r = reach * s;
          const y =
            reach * (0.45 * Math.sin(Math.PI * s * 0.8) - droop * s * s * 0.7);

          return [
            Math.cos(t) * r,
            y + rng.signed() * size * 0.08,
            Math.sin(t) * r,
          ];
        },
        // Discrete pendulous strands rather than a shower of points.
        unit: (u, U) => {
          const strands = Math.max(4, Math.round(Math.sqrt(U * 1.5)));
          const steps = Math.max(1, Math.ceil(U / strands));
          const strand = u % strands;
          const s = (Math.floor(u / strands) % steps) / steps + 0.5 / steps;
          const t = (strand / strands) * TAU + s * 0.35;
          const r = reach * s;

          return [
            Math.cos(t) * r,
            reach * (0.45 * Math.sin(Math.PI * s * 0.8) - droop * s * s * 0.7),
            Math.sin(t) * r,
          ];
        },
      };
    },
  },
  ring: {
    density: 0.3,
    lift: 0.8,
    make(rng, size) {
      const major = size * rng.range(0.8, 1.3);
      const minor = size * rng.range(0.15, 0.4);
      const tilt = rng.signed() * 0.6;

      return {
        radii: [major + minor, minor + Math.abs(tilt) * major, major + minor],
        sample: () => {
          const u = rng() * TAU;
          const v = rng() * TAU;
          const rr = major + Math.cos(v) * minor * Math.sqrt(rng());
          const x = Math.cos(u) * rr;
          const z = Math.sin(u) * rr;

          return [x, Math.sin(v) * minor + z * tilt, z];
        },
        // Beads evenly spaced around the ring.
        unit: (u, U) => {
          const a = ((u + 0.5) / U) * TAU;
          const v = u * GOLDEN;
          const rr = major + Math.cos(v) * minor * 0.75;
          const x = Math.cos(a) * rr;
          const z = Math.sin(a) * rr;

          return [x, Math.sin(v) * minor + z * tilt, z];
        },
      };
    },
  },
  helix: {
    density: 0.35,
    lift: 1,
    make(rng, size) {
      const turns = rng.range(0.8, 2.2);
      const height = size * rng.range(1.2, 2.2);
      const band = size * rng.range(0.15, 0.35);

      return {
        radii: [size, height * 0.5, size],
        sample: () => {
          const s = rng();
          const a = s * turns * TAU;
          const r = size * (0.4 + 0.6 * (1 - s)) + rng.signed() * band;

          return [
            Math.cos(a) * r,
            s * height - height * 0.5 + rng.signed() * band,
            Math.sin(a) * r,
          ];
        },
        // The helix itself, walked at an even pace.
        unit: (u, U) => {
          const s = (u + 0.5) / U;
          const a = s * turns * TAU;
          const r = size * (0.4 + 0.6 * (1 - s));

          return [Math.cos(a) * r, s * height - height * 0.5, Math.sin(a) * r];
        },
      };
    },
  },
  trihelix: {
    density: 0.35,
    lift: 1,
    make(rng, size) {
      const turns = rng.range(0.9, 2.6);
      const height = size * rng.range(1.2, 2.3);
      const band = size * rng.range(0.08, 0.22);
      const taper = rng.range(0.25, 0.55);
      const yaw = rng.range(0.5, 0.66);
      const trianglePoint = (phase, radius) => {
        const side = ((phase % 1) + 1) % 1;
        const edge = Math.floor(side * 3);
        const t = side * 3 - edge;
        const a0 = yaw + (edge * TAU) / 3;
        const a1 = yaw + (((edge + 1) % 3) * TAU) / 3;
        const x0 = Math.cos(a0) * radius;
        const z0 = Math.sin(a0) * radius;
        const x1 = Math.cos(a1) * radius;
        const z1 = Math.sin(a1) * radius;

        return [x0 + (x1 - x0) * t, z0 + (z1 - z0) * t];
      };

      return {
        radii: [size + band, height * 0.5, size + band],
        sample: () => {
          const s = rng();
          const r = size * (1 - taper * s) + rng.signed() * band;
          const [x, z] = trianglePoint(s * turns, r);

          return [x, s * height - height * 0.5 + rng.signed() * band, z];
        },
        unit: (u, U) => {
          const s = (u + 0.5) / U;
          const r = size * (1 - taper * s);
          const [x, z] = trianglePoint(s * turns, r);

          return [x, s * height - height * 0.5, z];
        },
      };
    },
  },
  doubleHelix: {
    density: 0.32,
    lift: 1,
    make(rng, size) {
      const turns = rng.range(1.1, 3);
      const height = size * rng.range(1.25, 2.4);
      const band = size * rng.range(0.08, 0.2);
      const pulse = rng.range(0.08, 0.22);

      return {
        radii: [size + band, height * 0.5, size + band],
        sample: () => {
          const s = rng();
          const strand = rng() < 0.5 ? 0 : Math.PI;
          const a = s * turns * TAU + strand;
          const r = size * (0.82 + pulse * Math.sin(s * Math.PI * 2));

          return [
            Math.cos(a) * (r + rng.signed() * band),
            s * height - height * 0.5 + rng.signed() * band,
            Math.sin(a) * (r + rng.signed() * band),
          ];
        },
        unit: (u, U) => {
          const steps = Math.max(1, Math.ceil(U / 2));
          const strand = u % 2 === 0 ? 0 : Math.PI;
          const s = (Math.floor(u / 2) + 0.5) / steps;
          const a = s * turns * TAU + strand;
          const r = size * (0.82 + pulse * Math.sin(s * Math.PI * 2));

          return [Math.cos(a) * r, s * height - height * 0.5, Math.sin(a) * r];
        },
      };
    },
  },
  spray: {
    density: 0.9,
    lift: 0,
    side: true,
    make(rng, size, p) {
      const radii = [size * 0.5, size * 0.45 * p.crownStretch, size * 0.5];

      return {
        radii,
        sample: () => {
          const d = onSphere(rng);
          const r = shellRadius(rng, p.shellBias);

          return [
            d[0] * r * radii[0],
            d[1] * r * radii[1],
            d[2] * r * radii[2],
          ];
        },
        unit: (u, U) => ellipsoidUnit(u, U, radii),
      };
    },
  },
};

export default FORMS;
