const TAU = Math.PI * 2;

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
      };
    },
  },
};

const HEADS = [
  'blob',
  'bowl',
  'fan',
  'umbel',
  'cone',
  'plume',
  'weep',
  'ring',
  'helix',
];
const EXTRAS = [...HEADS, 'spray', 'spray', 'spray'];

export default function composeForms(p, rng) {
  const count = Math.max(1, Math.round(p.formCount * rng.range(0.5, 1.6)));
  const R = p.crownRadius;

  return Array.from({ length: count }, (_, i) => {
    const name =
      i === 0
        ? HEADS[Math.floor(rng() * HEADS.length)]
        : EXTRAS[Math.floor(rng() * EXTRAS.length)];
    const form = FORMS[name];
    const size = i === 0 ? R * rng.range(0.75, 1.15) : R * rng.range(0.3, 0.75);
    const shape = form.make(rng, size, p);
    const theta = rng() * TAU;
    const reach =
      i === 0 || form.side ? 0 : R * p.formSpread * rng.range(0.4, 1.2);
    const offset = shape.offset ?? [0, 0, 0];

    return {
      accent: i > 0 && rng() < p.accentAmount ? 1 : 0,
      anchor: form.side ? rng.range(p.crownBase, 0.92) : 1,
      density: form.density,
      lift: form.lift,
      mass: (size / R) ** 2 * (i === 0 ? 1.4 : 1),
      name,
      offset: [
        offset[0] + Math.cos(theta) * reach,
        offset[1] + (i === 0 ? 0 : rng.range(-0.3, 0.9) * reach),
        offset[2] + Math.sin(theta) * reach * 0.8,
      ],
      radii: shape.radii,
      sample: shape.sample,
      side: !!form.side,
      sideDirection: theta,
      size,
      tint: rng(),
    };
  });
}
