import { detent, pad } from '../hits';
import { INK } from '../kit';
import { TAU, faceHeight, faceRadius, part, placeAll, rot2 } from '../parts';
import { hash01 } from '../signals';
import screenModes, { EXTRA_MODES } from './screenModes';
import terminalPose from './terminal';

const SCREEN_MODES = [
  'scope',
  'spectrum',
  'plasma',
  'radar',
  'terminal',
  'lissajous',
  ...EXTRA_MODES,
];

// Bare glass kept round the trace, clear of the glass's rounded corners.
const INSET = 0.08;
const CURSOR_GRAB = 0.1;
// The tube face bulges by BULGE of its half size, built as nested domes
// ([size, rise, phosphor glow]) so it glows brighter toward the centre.
const BULGE = 0.06;
const TUBE = [
  [1, 1, 0.0015],
  [0.72, 1.03, 0.003],
  [0.45, 1.06, 0.0045],
];
const TUBE_TOP = 1.08;
// Modes that mark a touch their own way rather than with the cursor.
const NO_CURSOR = new Set(['terminal', 'radar']);
const Z = 0.026;
// Measuring screens get a graticule; games and wireframes stay bare.
const GRATICULE = new Set([
  'scope',
  'spectrum',
  'plasma',
  'lissajous',
  'waterfall',
  'ecg',
]);
// The glass sits this far up its bezel, leaving a strip below for the mode
// button.
const LIFT = 0.08;

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// A phosphor screen: rounded glass in a bezel, a mode button in the
// bezel's corner, and the glass a touch pad each mode reads its own way.
// Signals: 0 mode, 1 / 2 the pad's x / y, 3 whether it is touched.
export default function buildScreen(kit, { h, variant, w }) {
  const { disc, rng, slab, style } = kit;
  const square = Math.abs(w - h) < 0.01;
  const modes = square
    ? SCREEN_MODES
    : SCREEN_MODES.filter((m) => m !== 'radar');
  const rolledMode = Math.floor(rng() * modes.length);
  const start = variant ? modes.indexOf(variant) : rolledMode;
  const gw = w / 2 - 0.14;
  const gh = h / 2 - 0.14 - LIFT;
  const hw = gw - INSET;
  const hh = gh - INSET;
  const dim = style.screen(0.06);
  const bright = style.screen(1);
  const seg = (x0, y0, x1, y1, width, look) =>
    slab(
      (x0 + x1) / 2,
      (y0 + y1) / 2,
      Math.hypot(x1 - x0, y1 - y0) / 2 + width / 2,
      width / 2,
      Z,
      Z + INK,
      look,
      Math.atan2(y1 - y0, x1 - x0)
    );
  const button = [w / 2 - 0.2, -(h / 2 - 0.06) + (0.08 + 2 * LIFT) / 2];
  const [fw, fh] = [gw - 0.06, gh - 0.06];
  const bulge = Math.min(fw, fh) * BULGE;
  // Traces sit on the face of the tube, lifted onto its bulge.
  const onTube = (items) =>
    items.map((item) => {
      const rho = faceRadius(item.p[0] / fw, item.p[1] / fh);
      const rise = bulge * TUBE_TOP * faceHeight(Math.min(rho, 1));
      return { ...item, p: [item.p[0], item.p[1], item.p[2] + rise] };
    });
  const statics = [
    slab(0, 0, w / 2 - 0.06, h / 2 - 0.06, 0, 0.02, style.knob, 0, 'rbox'),
    slab(0, LIFT, gw, gh, 0.02, Z, style.glass, 0, 'rbox'),
    disc(...button, 0.045, 0.02, 0.045, style.cap(0), 'cap'),
    ...TUBE.map(([size, rise, glow]) =>
      part(
        'face',
        [0, LIFT, Z + (bulge * rise) / 2],
        [fw * size, fh * size, (bulge * rise) / 2],
        {
          ...style.screen(glow),
          c: style.glass.c,
          r: 0.06,
        }
      )
    ),
  ];
  const graticule = [];
  for (let x = -hw + 0.2; x < hw - 1e-6; x += 0.2)
    graticule.push(slab(x, 0, 0.003, hh, Z, Z + INK * 0.5, dim));
  for (let y = -hh + 0.2; y < hh - 1e-6; y += 0.2)
    graticule.push(slab(0, y, hw, 0.003, Z, Z + INK * 0.5, dim));
  const freq = 1 + Math.floor(rng() * 4);
  const band = Math.floor(rng() * 8);
  const blips = Array.from({ length: 7 }, () => [
    rng() * TAU,
    0.2 + rng() * 0.75,
  ]);
  const terminal = terminalPose(kit, hw, hh, Z);
  const ratio = [1 + Math.floor(rng() * 3), 2 + Math.floor(rng() * 3)];
  const reach = Math.min(hw, hh);
  const rings = [
    ...[0.33, 0.66, 1].map((r) =>
      part('torus', [0, 0, Z], [reach * r, reach * r, 0.002], dim)
    ),
    seg(-reach, 0, reach, 0, 0.004, dim),
    seg(0, -reach, 0, reach, 0.004, dim),
  ];

  // A contact crosses the scope on a straight track, wrapping back to where
  // the track enters; `since` is how long ago the sweep painted it.
  const track = ([x, y], heading, speed, t0) => {
    const dir = [Math.cos(heading), Math.sin(heading)];
    const offset = x * -dir[1] + y * dir[0];
    const chord = Math.sqrt(Math.max(reach ** 2 - offset ** 2, 1e-4));
    const s0 = x * dir[0] + y * dir[1];
    return {
      at: (t) => {
        const s =
          ((((s0 + chord + speed * (t - t0)) % (2 * chord)) + 2 * chord) %
            (2 * chord)) -
          chord;
        return [-dir[1] * offset + dir[0] * s, dir[0] * offset + dir[1] * s];
      },
      t0,
    };
  };
  const contacts = blips.map(([a, r], i) =>
    track(
      rot2(0, reach * r, -a),
      hash01(i, 11) * TAU,
      reach * (0.03 + 0.06 * hash01(i, 12)),
      0
    )
  );
  const placed = [];
  let lastPlaced = null;

  const cursor = ({ at: [x, y] }) => [
    seg(x - 0.06, y, x + 0.06, y, 0.006, bright),
    seg(x, y - 0.06, x, y + 0.06, 0.006, bright),
    part('torus', [x, y, Z], [0.08, 0.08, 0.004], bright),
  ];

  const poses = {
    ...screenModes({ disc, hh, hw, rng, seg, slab, style }),
    // Pad x stretches the timebase, y the gain.
    scope: ({ audio, t }, touch) => {
      const steps = Math.min(90, Math.floor(hw / 0.02));
      const f = freq * 2 ** ((touch.x - 0.5) * 3);
      const amp = hh * (0.25 + 0.6 * audio[band]) * (0.2 + 1.6 * touch.y);
      const at = (i) => {
        const u = i / steps;
        const y =
          Math.sin(TAU * (f * u - t * 0.7)) +
          0.35 * Math.sin(TAU * (f * 3 * u + t * 1.3));
        return [-hw + u * 2 * hw, clamp((y / 1.35) * amp, -hh, hh)];
      };
      return Array.from({ length: steps }, (_, i) =>
        seg(...at(i), ...at(i + 1), 0.012, bright)
      );
    },
    // A touch pushes the bars under it up to the pad's height.
    spectrum: ({ audio }, touch) => {
      const bars = Math.min(audio.length, Math.floor(hw / 0.05));
      const pitch = (2 * hw) / bars;
      return Array.from({ length: bars }, (_, i) => {
        const u = (i + 0.5) / bars;
        const pushed = touch.on
          ? touch.y * Math.exp(-((u - touch.x) ** 2) / 0.012)
          : 0;
        const level = Math.max(
          audio[Math.floor((i / bars) * audio.length)],
          pushed,
          0.02
        );
        return slab(
          -hw + pitch * (i + 0.5),
          -hh + level * hh,
          pitch * 0.38,
          level * hh,
          Z,
          Z + INK,
          style.screen(0.9)
        );
      });
    },
    // A kaoss pad: the ripples spread from the finger and glow round it.
    plasma: ({ t }, touch) => {
      const pitch = Math.max(0.1, Math.sqrt((4 * hw * hh) / 300));
      const [cx, cy] = touch.on ? touch.at : [0, 0];
      const out = [];
      for (let x = -hw + pitch / 2; x < hw; x += pitch) {
        for (let y = -hh + pitch / 2; y < hh; y += pitch) {
          const d = Math.hypot(x - cx, y - cy);
          const p = Math.sin(d * 10 - 10 * t) + Math.sin(y * 10 - 7 * t);
          const glow = touch.on ? 0.8 * Math.exp(-(d * d) / 0.08) : 0;
          out.push(
            disc(
              x,
              y,
              pitch * 0.22,
              Z,
              Z + INK,
              style.screen(Math.min(0.5 + 0.5 * Math.sin(p) + glow, 1.6))
            )
          );
        }
      }
      return out;
    },
    // Contacts drift across the scope, painted where the sweep last
    // passed them; a touch drops a new contact there.
    radar: ({ t }, touch) => {
      const key = touch.on ? touch.at.join() : null;
      if (key && key !== lastPlaced) {
        const n = placed.length;
        placed.push(track(touch.at, hash01(n, 21) * TAU, reach * 0.05, t));
        if (placed.length > 8) placed.shift();
      }
      lastPlaced = key;
      while (placed.length && placed[placed.length - 1].t0 > t) placed.pop();
      const sweep = (t * 1.6) % TAU;
      const [ex, ey] = rot2(0, reach, -sweep);
      const out = [...rings, seg(0, 0, ex, ey, 0.012, bright)];
      const paint = (contact, marked) => {
        const [x, y] = contact.at(t);
        const a = Math.atan2(x, y);
        const since = (((sweep - a) % TAU) + TAU) % TAU;
        const [px, py] = contact.at(Math.max(contact.t0, t - since / 1.6));
        const glow = style.screen(
          Math.max(Math.exp(-2.5 * since), marked ? 0.3 : 0)
        );
        out.push(disc(px, py, 0.03, Z, Z + INK, glow));
        if (marked)
          out.push(part('torus', [px, py, Z], [0.055, 0.055, 0.003], glow));
      };
      contacts.forEach((contact) => paint(contact, false));
      placed.forEach((contact) => paint(contact, true));
      return out;
    },
    terminal,
    // Pad x shifts the phase, y bends the vertical ratio.
    lissajous: ({ t }, touch) => {
      const count = 70;
      const ry = ratio[1] * (0.5 + touch.y);
      return Array.from({ length: count }, (_, i) => {
        const u = (i / count) * TAU;
        return disc(
          hw * 0.9 * Math.sin(ratio[0] * u + t + touch.x * TAU),
          hh * 0.9 * Math.sin(ry * u),
          0.018,
          Z,
          Z + INK,
          style.screen(0.4 + 0.6 * hash01(i, 3))
        );
      });
    },
  };

  return {
    hits: [
      detent(0, ...button, 0.08, modes.length),
      pad([1, 2, 3], 0, LIFT, hw, hh, CURSOR_GRAB),
    ],
    live: true,
    statics,
    signals: [
      {
        base: start / Math.max(modes.length - 1, 1),
        fixed: true,
        kind: 'step',
        steps: modes.length,
      },
      { base: 0.5, fixed: true, kind: 'smooth' },
      { base: 0.5, fixed: true, kind: 'smooth' },
      { base: 0, fixed: true, kind: 'switch' },
    ],
    pose: ([v, x, y, on], state) => {
      const mode = modes[Math.round(v * (modes.length - 1))];
      const touch = {
        at: [-hw + 2 * hw * x, -hh + 2 * hh * y],
        on: on > 0.5,
        x,
        y,
      };
      const out = [
        ...(GRATICULE.has(mode) ? graticule : []),
        ...poses[mode](state, touch),
      ];
      if (touch.on && !NO_CURSOR.has(mode)) out.push(...cursor(touch));
      return placeAll(onTube(out), { offset: [0, LIFT, 0] });
    },
  };
}
