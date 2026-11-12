import { restState } from './drawFrame';
import { FRAME, INK, clamp01, ease, phase } from './primitives';

const BUILD_ORDER = [1, 2, 4, 3, 5, 6, 0, 7, 8, 9, 10];
const FIGURE8_ORDER = [6, 0, 5, 1, 4, 0, 3, 2];
const INNER = [7, 8, 9, 10];

const states = (squares, fn = () => ({})) =>
  restState(squares).map((s, idx) => ({ ...s, ...fn(s, idx) }));

const ink = (squares, extra) => ({ look: 'ink', squares, ...extra });
const sketch = (squares, extra) => ({ look: 'sketch', squares, ...extra });

const innerSpin = {
  id: 'innerSpin',
  label: 'Inner Spin',
  cycleDuration: 1.6,
  frame: (squares, t) => [
    ink(
      states(squares, (s) =>
        s.layer === 't'
          ? { rot: ease.inOut(phase(t, 1.6, INNER.indexOf(s.i) * 0.05)) * 360 }
          : {}
      )
    ),
  ],
};

const build = {
  id: 'build',
  label: 'Build',
  cycleDuration: 3.2,
  frame(squares, t) {
    const p = phase(t, 3.2);
    return [
      ink(
        states(squares, (s) => {
          const order = BUILD_ORDER.indexOf(s.i) / BUILD_ORDER.length;
          const local = clamp01((p - order * 0.85) / 0.12);
          const fall = (1 - ease.out(local)) * 4;
          return { sx: s.sx - fall, sy: s.sy - fall, opacity: local };
        })
      ),
    ];
  },
};

const stamp = {
  id: 'stamp',
  label: 'Stamp',
  cycleDuration: 2.6,
  frame(squares, t) {
    const N = squares.length;
    const stampP = phase(t, 2.6) * (N + 1);
    const stampIdx = Math.min(Math.floor(stampP), N - 1);
    const local = Math.min(stampP - stampIdx, 1);
    return [
      ink(
        states(squares, (s, idx) => {
          if (idx < stampIdx) return {};
          if (idx > stampIdx) return { opacity: 0 };
          return {
            sy: s.sy - 2.5 * (1 - ease.in(local)),
            scale: 1 + (1 - local) * 0.3,
            opacity: local,
          };
        })
      ),
    ];
  },
};

const innerOrbit = {
  id: 'innerOrbit',
  label: 'Inner Orbit',
  cycleDuration: 2.6,
  frame(squares, t) {
    const angle = ease.inOut(phase(t, 2.6)) * Math.PI * 2;
    return [
      ink(
        states(squares, (s) => {
          if (s.layer !== 't') return {};
          const r = Math.hypot(s.sx, s.sy);
          const a = Math.atan2(s.sy, s.sx) + angle;
          return {
            sx: Math.cos(a) * r,
            sy: Math.sin(a) * r,
            rot: (angle * 180) / Math.PI,
          };
        })
      ),
    ];
  },
};

const invert = {
  id: 'invert',
  label: 'Color Invert',
  cycleDuration: 2.2,
  frame(squares, t) {
    const k = ease.inOut(Math.sin(phase(t, 2.2) * Math.PI) ** 2);
    const swapped = states(squares, (s) => ({
      color: s.layer === 'b' ? INK.black : INK.red,
    }));
    return [ink(states(squares), { alpha: 1 - k }), ink(swapped, { alpha: k })];
  },
};

const misregister = {
  id: 'misregister',
  label: 'Misregister',
  cycleDuration: 2.1,
  frame(squares, t) {
    const off = Math.sin(t * 3) * 4;
    const blue = states(squares, (s) => ({
      color: s.layer === 'b' ? INK.blue : INK.black,
    }));
    return [
      ink(states(squares), { alpha: 0.55, offset: [off, off * 0.6] }),
      ink(blue, { alpha: 0.55, offset: [-off, -off * 0.6] }),
      ink(states(squares), { alpha: 0.85 }),
    ];
  },
};

const dripFill = {
  id: 'dripFill',
  label: 'Drip Fill',
  cycleDuration: 3.0,
  frame(squares, t) {
    const h = ease.inOut(phase(t, 3.0)) * FRAME;
    return [
      sketch(states(squares)),
      ink(states(squares), { clip: (ctx) => ctx.rect(0, 0, FRAME, h) }),
    ];
  },
};

const radialFill = {
  id: 'radialFill',
  label: 'Radial Fill',
  cycleDuration: 2.4,
  frame: (squares, t) => [
    ink(
      states(squares, (s) => ({
        opacity:
          Math.sin(phase(t, 2.4, -Math.hypot(s.sx, s.sy) * 0.15) * Math.PI) **
          2,
      }))
    ),
    sketch(states(squares)),
  ],
};

const figureEight = {
  id: 'figureEight',
  label: 'Figure Eight',
  cycleDuration: 2.4,
  frame(squares, t) {
    const N = FIGURE8_ORDER.length;
    const head = phase(t, 2.4) * N;
    return [
      ink(
        states(squares, (s) => {
          if (s.layer !== 'b') return {};
          const dist = FIGURE8_ORDER.reduce(
            (min, id, slot) =>
              id === s.i ? Math.min(min, (head - slot + N) % N) : min,
            N
          );
          return { opacity: Math.max(0.08, 1 - dist / 4) };
        })
      ),
    ];
  },
};

const paintIn = {
  id: 'paintIn',
  label: 'Paint In',
  cycleDuration: 3.4,
  frame(squares, t) {
    const p = phase(t, 3.4);
    const alpha = 1 - clamp01((p - 0.9) / 0.1);
    const order = (s) => BUILD_ORDER.indexOf(s.i);
    return [
      sketch(
        states(squares, (s) => ({
          reveal: clamp01((p - order(s) * 0.02) / 0.18),
        })),
        { alpha }
      ),
      ink(
        states(squares, (s) => ({
          reveal: ease.inOut(clamp01((p - 0.15 - order(s) * 0.045) / 0.18)),
        })),
        { alpha }
      ),
    ];
  },
};

export default [
  innerSpin,
  build,
  stamp,
  innerOrbit,
  invert,
  misregister,
  dripFill,
  radialFill,
  figureEight,
  paintIn,
];
