import { DEG, TAU } from './math';

// String models after the nineteenth-century originals: a frame (rails and
// posts) with threads strung straight between its rails. Every thread is a
// ruling of the surface; `second` threads are the other ruling, drawn in the
// second colour. Everything fits the unit ball.
const lerp3 = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const circle = (radius, y, samples, phase = 0) =>
  Array.from({ length: samples }, (_, i) => {
    const a = (i / samples) * TAU + phase;
    return [radius * Math.cos(a), y, radius * Math.sin(a)];
  });

const STRING_MODELS = {
  conoid: (c) => {
    const radius = 0.78;
    const height = 0.42;
    const rim = Array.from({ length: 256 }, (_, i) => {
      const a = (i / 256) * TAU;
      return [
        radius * Math.cos(a),
        height * Math.sin(c.conoidWaves * a),
        radius * Math.sin(a),
      ];
    });
    const threads = Array.from({ length: c.stringsCount }, (_, i) => {
      const a = (i / c.stringsCount) * Math.PI;
      const y = height * Math.sin(c.conoidWaves * a);
      const dir = [Math.cos(a), 0, Math.sin(a)];
      return {
        from: [-dir[0] * radius, y, -dir[2] * radius],
        second: c.stringsDouble && i % 2 === 1,
        to: [dir[0] * radius, y, dir[2] * radius],
      };
    });
    return {
      frame: [
        { closed: true, points: rim },
        {
          closed: false,
          points: [
            [0, -height - 0.12, 0],
            [0, height + 0.12, 0],
          ],
        },
      ],
      threads,
    };
  },

  helicoid: (c) => {
    const radius = 0.62;
    const height = 0.72;
    const turns = c.helicoidTurns;
    const samples = Math.round(160 * turns) + 2;
    const helix = (phase) =>
      Array.from({ length: samples }, (_, i) => {
        const t = i / (samples - 1);
        const a = t * TAU * turns + phase;
        return [
          radius * Math.cos(a),
          -height + 2 * height * t,
          radius * Math.sin(a),
        ];
      });
    const threads = Array.from({ length: c.stringsCount }, (_, i) => {
      const t = (i + 0.5) / c.stringsCount;
      const a = t * TAU * turns;
      const y = -height + 2 * height * t;
      return {
        from: [-radius * Math.cos(a), y, -radius * Math.sin(a)],
        second: c.stringsDouble && i % 2 === 1,
        to: [radius * Math.cos(a), y, radius * Math.sin(a)],
      };
    });
    return {
      frame: [
        { closed: false, points: helix(0) },
        { closed: false, points: helix(Math.PI) },
        {
          closed: false,
          points: [
            [0, -height - 0.06, 0],
            [0, height + 0.06, 0],
          ],
        },
      ],
      threads,
    };
  },

  // Two rings, the top one turned by `twist` against the bottom: the threads
  // between them rule a hyperboloid of one sheet.
  hyperboloid: (c) => {
    const radius = 0.7;
    const height = 0.62;
    const twist = c.stringsTwist * DEG;
    const threads = [];
    for (let i = 0; i < c.stringsCount; i += 1) {
      const a = (i / c.stringsCount) * TAU;
      const point = (angle, y) => [
        radius * Math.cos(angle),
        y,
        radius * Math.sin(angle),
      ];
      threads.push({
        from: point(a, -height),
        second: false,
        to: point(a + twist, height),
      });
      if (c.stringsDouble) {
        threads.push({
          from: point(a, -height),
          second: true,
          to: point(a - twist, height),
        });
      }
    }
    const posts = [0, 1, 2].map((k) => {
      const a = (k / 3) * TAU + Math.PI / 6;
      const r = radius + 0.06;
      return {
        closed: false,
        points: [
          [r * Math.cos(a), -height, r * Math.sin(a)],
          [r * Math.cos(a), height, r * Math.sin(a)],
        ],
      };
    });
    return {
      frame: [
        { closed: true, points: circle(radius, -height, 192) },
        { closed: true, points: circle(radius, height, 192) },
        ...posts,
      ],
      threads,
    };
  },

  // A skew quadrilateral; threads between opposite sides rule a hyperbolic
  // paraboloid, both families when doubled.
  paraboloid: (c) => {
    const s = 0.62;
    const w = c.stringsWarp * s;
    const a = [-s, -w, -s];
    const b = [s, w, -s];
    const cc = [s, -w, s];
    const d = [-s, w, s];
    const threads = [];
    for (let i = 0; i < c.stringsCount; i += 1) {
      const t = (i + 0.5) / c.stringsCount;
      threads.push({
        from: lerp3(a, b, t),
        second: false,
        to: lerp3(d, cc, t),
      });
      if (c.stringsDouble) {
        threads.push({
          from: lerp3(a, d, t),
          second: true,
          to: lerp3(b, cc, t),
        });
      }
    }
    return {
      frame: [{ closed: true, points: [a, b, cc, d] }],
      threads,
    };
  },
};

export default STRING_MODELS;
