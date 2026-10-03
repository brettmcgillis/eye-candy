import { TAU } from './math';

// Classical parametric surfaces, y-up. Each returns its parameter domain,
// which parameter edges are open (rimmed when thickened) and its base mesh
// resolution; a closed or self-glued edge takes no rim.
const { SQRT2 } = Math;

const SURFACES = {
  // Apéry's family: α = 1 is Boy's surface, α = 0 the Roman surface.
  boy: (c) => ({
    fn: (u, v) => {
      const cv2 = Math.cos(v) ** 2;
      const d = 2 - c.boyAlpha * SQRT2 * Math.sin(3 * u) * Math.sin(2 * v);
      return [
        (SQRT2 * cv2 * Math.cos(2 * u) + Math.cos(u) * Math.sin(2 * v)) / d,
        (3 * cv2) / d,
        (SQRT2 * cv2 * Math.sin(2 * u) - Math.sin(u) * Math.sin(2 * v)) / d,
      ];
    },
    rimU: [false, false],
    rimV: [false, false],
    segU: 160,
    segV: 160,
    u: [0, Math.PI],
    v: [0, Math.PI],
  }),

  breather: (c) => {
    const b = c.breatherB;
    const r = 1 - b * b;
    const w = Math.sqrt(r);
    const span = 13.2 * (0.4 / b) ** 0.5;
    return {
      fn: (u, v) => {
        const ch = Math.cosh(b * u);
        const denom = b * ((w * ch) ** 2 + (b * Math.sin(w * v)) ** 2);
        return [
          -u + (2 * r * ch * Math.sinh(b * u)) / denom,
          (2 *
            w *
            ch *
            (-(w * Math.sin(v) * Math.cos(w * v)) +
              Math.cos(v) * Math.sin(w * v))) /
            denom,
          (2 *
            w *
            ch *
            (-(w * Math.cos(v) * Math.cos(w * v)) -
              Math.sin(v) * Math.sin(w * v))) /
            denom,
        ];
      },
      segU: 180,
      segV: 360,
      u: [-span, span],
      v: [-37.4, 37.4],
    };
  },

  dini: (c) => ({
    fn: (u, v) => [
      Math.cos(u) * Math.sin(v),
      Math.cos(v) + Math.log(Math.tan(v / 2)) + c.diniTwist * u,
      Math.sin(u) * Math.sin(v),
    ],
    segU: Math.round(90 * c.diniTurns),
    segV: 90,
    u: [0, TAU * c.diniTurns],
    v: [0.06, 2.2],
  }),

  enneper: (c) => {
    const k = c.enneperOrder;
    const n = 2 * k + 1;
    return {
      fn: (r, t) => {
        const rn = r ** n;
        const rk = r ** (k + 1);
        return [
          r * Math.cos(t) - (rn * Math.cos(n * t)) / n,
          (2 * rk * Math.cos((k + 1) * t)) / (k + 1),
          -(r * Math.sin(t) + (rn * Math.sin(n * t)) / n),
        ];
      },
      rimU: [false, true],
      rimV: [false, false],
      segU: 70,
      segV: 120 * k,
      u: [0, c.enneperRadius],
      v: [0, TAU],
    };
  },

  // Robert Israel's bottle; the figure-8 immersion as an alternative.
  klein: (c) =>
    c.kleinForm === 'figure8'
      ? {
          fn: (u, v) => {
            const ring =
              c.kleinRadius +
              Math.cos(u / 2) * Math.sin(v) -
              Math.sin(u / 2) * Math.sin(2 * v);
            return [
              ring * Math.cos(u),
              Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v),
              ring * Math.sin(u),
            ];
          },
          rimU: [false, false],
          rimV: [false, false],
          segU: 220,
          segV: 64,
          u: [0, TAU],
          v: [0, TAU],
        }
      : {
          fn: (u, v) => {
            const cu = Math.cos(u);
            const su = Math.sin(u);
            const cv = Math.cos(v);
            return [
              (-2 / 15) *
                cu *
                (3 * cv -
                  30 * su +
                  90 * cu ** 4 * su -
                  60 * cu ** 6 * su +
                  5 * cu * cv * su),
              (-1 / 15) *
                su *
                (3 * cv -
                  3 * cu ** 2 * cv -
                  48 * cu ** 4 * cv +
                  48 * cu ** 6 * cv -
                  60 * su +
                  5 * cu * cv * su -
                  5 * cu ** 3 * cv * su -
                  80 * cu ** 5 * cv * su +
                  80 * cu ** 7 * cv * su),
              (2 / 15) * (3 + 5 * cu * su) * Math.sin(v),
            ];
          },
          rimU: [false, false],
          rimV: [false, false],
          segU: 200,
          segV: 64,
          u: [0, Math.PI],
          v: [0, TAU],
        },

  kuen: (c) => ({
    fn: (s, t) => {
      const k = 1 + s * s * Math.sin(t) ** 2;
      return [
        (2 * (Math.cos(s) + s * Math.sin(s)) * Math.sin(t)) / k,
        Math.log(Math.tan(t / 2)) + (2 * Math.cos(t)) / k,
        (2 * (Math.sin(s) - s * Math.cos(s)) * Math.sin(t)) / k,
      ];
    },
    segU: 160,
    segV: 120,
    u: [-c.kuenRange, c.kuenRange],
    v: [0.08, Math.PI - 0.08],
  }),

  seashell: (c) => {
    const span = TAU * c.shellTurns;
    const g = c.shellFlare / span;
    return {
      fn: (u, v) => {
        const e = Math.exp(g * u);
        const c2 = Math.cos(v / 2) ** 2;
        return [
          2 * (1 - e) * Math.cos(u) * c2,
          1 - e * e - Math.sin(v) + e * Math.sin(v),
          2 * (-1 + e) * Math.sin(u) * c2,
        ];
      },
      rimU: [true, true],
      rimV: [false, false],
      segU: Math.round(70 * c.shellTurns),
      segV: 64,
      u: [0, span],
      v: [0, TAU],
    };
  },
};

export default SURFACES;
