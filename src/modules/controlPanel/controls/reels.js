import { choose } from '../hits';
import { STAMP_NONE } from '../interaction';
import { INK } from '../kit';
import { TAU, part, quatZ } from '../parts';
import { textParts } from './glyphs';

const TAPE = { c: [0.09, 0.05, 0.03], m: 0.1, r: 0.35 };
const PACK = { c: [0.11, 0.065, 0.04], m: 0.05, r: 0.45 };
const FLANGE_BACK = { c: [0.03, 0.03, 0.035], m: 0.3, r: 0.4 };
const CHROME = { c: [0.75, 0.76, 0.78], m: 1, r: 0.15 };
const ALLOY = { c: [0.66, 0.67, 0.7], m: 0.8, r: 0.34 };
const DARK = { c: [0.015, 0.015, 0.017], m: 0, r: 0.6 };
const WHITE = { c: [0.85, 0.85, 0.82], m: 0, r: 0.6 };

// Keys in order on the deck; a mode's value is its index over KEYS.length,
// 0 being the deck running itself.
const KEYS = ['rew', 'stop', 'play', 'ff'];
const SPEED = { ff: 1 / 6, play: 1 / 90, rew: -1 / 6, stop: 0 };
const PLAY_TIME = 90;
const REWIND_TIME = 7;
const TAPE_LENGTH = 170;
const TAPE_Z = [0.06, 0.12];

const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
const modeOf = (v) => (v > 0 ? KEYS[Math.round(v * KEYS.length) - 1] : null);

// The two common tangent points of circles a and b on `side`, for a tape
// running from one to the other on the outside.
function tangent([ax, ay], ra, [bx, by], rb, side) {
  const base = Math.atan2(by - ay, bx - ax);
  const span = Math.hypot(bx - ax, by - ay);
  const angle = base + side * Math.acos(clamp01((ra - rb) / span));
  const [c, s] = [Math.cos(angle), Math.sin(angle)];
  return [
    [ax + ra * c, ay + ra * s],
    [bx + rb * c, by + rb * s],
  ];
}

// A reel-to-reel deck: two reels whose tape packs grow and shrink as the
// tape moves, each turning at tape speed over its own radius, the tape
// threaded round guides past the head block and capstan. It plays and
// rewinds by itself; the transport keys take over, each press stamping
// when and where the tape was so it carries on from there.
export default function buildReels(kit, { h, w }) {
  const { disc, rng, slab, style } = kit;
  const hw = w / 2 - 0.1;
  const hh = h / 2 - 0.1;
  const offset = rng();
  const keyY = -hh + 0.16;
  const tapeY = keyY + 0.34;
  const reelTop = hh - 0.08;
  const flange = Math.min(hw / 2 - 0.08, (reelTop - tapeY - 0.12) / 2);
  const reelY = reelTop - flange;
  const reelX = hw / 2;
  const full = flange * 0.92;
  const hub = flange * 0.3;
  const spread = (full * full - hub * hub) / TAPE_LENGTH;
  const guideR = 0.055;
  const guideX = Math.min(reelX, hw - guideR - 0.1);
  const guides = [-1, 1].map((side) => [side * guideX, tapeY + guideR]);
  const capstanX = guideX * 0.6;
  const headW = Math.min(0.26, capstanX - 0.12);
  const keyW = Math.min(0.13, (hw - 0.6) / 4.6);
  const keyX = (i) => -hw + 0.18 + keyW + i * (2 * keyW + 0.06);

  // Tape fraction on the take-up reel when the deck runs itself.
  const auto = (t) => {
    const u =
      (((t + offset * (PLAY_TIME + REWIND_TIME)) % (PLAY_TIME + REWIND_TIME)) +
        PLAY_TIME +
        REWIND_TIME) %
      (PLAY_TIME + REWIND_TIME);
    return u < PLAY_TIME ? u / PLAY_TIME : 1 - (u - PLAY_TIME) / REWIND_TIME;
  };
  const resolve = (mode, stamp, from, t) => {
    const key = modeOf(mode);
    if (!key || stamp <= STAMP_NONE / 2 || t < stamp) return auto(t);
    return clamp01(from + SPEED[key] * (t - stamp));
  };
  const motion = (mode, stamp, from, t) => {
    const key = modeOf(mode);
    if (key && stamp > STAMP_NONE / 2 && t >= stamp) {
      const p = resolve(mode, stamp, from, t);
      return (p > 0 && p < 1) || key === 'stop' ? key : 'stop';
    }
    const u = auto(t);
    return u < auto(t + 0.01) ? 'play' : 'rew';
  };

  // The radius and turn of each reel with fraction `p` of the tape taken
  // up: the supply pack shrinks as sqrt(full² − k·l), the take-up grows as
  // sqrt(hub² + k·l), and each has turned ∫ dl / r of tape.
  const reels = (p) => {
    const l = p * TAPE_LENGTH;
    const supply = Math.sqrt(full * full - spread * l);
    const takeUp = Math.sqrt(hub * hub + spread * l);
    return [
      { angle: (2 / spread) * (full - supply), r: supply },
      { angle: (2 / spread) * (takeUp - hub), r: takeUp },
    ];
  };

  const tapeLine = ([x0, y0], [x1, y1]) =>
    slab(
      (x0 + x1) / 2,
      (y0 + y1) / 2,
      Math.hypot(x1 - x0, y1 - y0) / 2,
      0.004,
      TAPE_Z[0],
      TAPE_Z[1],
      TAPE,
      Math.atan2(y1 - y0, x1 - x0)
    );

  const reelParts = (x, { angle, r }) => [
    disc(x, reelY, r, 0.035, 0.115, PACK),
    disc(x, reelY, hub, 0.035, 0.118, style.brushed),
    ...[0, 1, 2].flatMap((k) => {
      const a = -angle + (k * TAU) / 3;
      const mid = (hub + flange) / 2;
      return [
        part(
          'box',
          [x + Math.cos(a) * mid, reelY + Math.sin(a) * mid, 0.124],
          [(flange - hub) / 2, flange * 0.09, 0.004],
          ALLOY,
          quatZ(a)
        ),
        part(
          'box',
          [
            x + Math.cos(a) * hub * 0.55,
            reelY + Math.sin(a) * hub * 0.55,
            0.12,
          ],
          [hub * 0.22, 0.012, 0.002],
          DARK,
          quatZ(a)
        ),
      ];
    }),
  ];

  const glyphs = {
    ff: [0.012, 0.036],
    play: [0.024],
    rew: [-0.012, -0.036],
  };
  const keyMark = (key, x, z) => {
    if (key === 'stop') return [slab(x, keyY, 0.02, 0.02, z, z + INK, DARK)];
    return glyphs[key].flatMap((dx) => {
      const dir = key === 'rew' ? -1 : 1;
      return [-1, 1].map((sy) =>
        slab(
          x + dx - dir * 0.008,
          keyY + sy * 0.01,
          0.016,
          0.0045,
          z,
          z + INK,
          DARK,
          dir * sy * -0.6
        )
      );
    });
  };

  const statics = [
    slab(0, 0, hw, hh, 0, 0.035, style.brushed, 0, 'rbox'),
    ...[-1, 1].flatMap((side) => [
      disc(side * reelX, reelY, flange, 0.035, 0.045, FLANGE_BACK),
      disc(side * reelX, reelY, 0.02, 0.118, 0.14, CHROME),
      part(
        'torus',
        [side * reelX, reelY, 0.124],
        [flange - 0.012, flange - 0.012, 0.012],
        ALLOY
      ),
    ]),
    ...guides.map(([x, y]) => disc(x, y, guideR, 0.035, 0.13, ALLOY)),
    slab(0, tapeY - 0.11, headW, 0.1, 0.035, 0.11, ALLOY, 0, 'rbox'),
    ...[-1, 0, 1].flatMap((k) => [
      slab(
        k * headW * 0.6,
        tapeY - 0.03,
        0.04,
        0.03,
        0.035,
        0.125,
        CHROME,
        0,
        'rbox'
      ),
      slab(k * headW * 0.6, tapeY - 0.012, 0.003, 0.012, 0.125, 0.127, DARK),
    ]),
    disc(capstanX, tapeY - 0.05, 0.045, 0.035, 0.125, {
      c: [0.03, 0.03, 0.03],
      m: 0,
      r: 0.8,
    }),
    slab(hw - 0.3, keyY, 0.2, 0.075, 0.035, 0.05, DARK, 0, 'rbox'),
  ];

  return {
    hits: KEYS.map((key, i) =>
      choose(0, keyX(i), keyY, { hh: 0.075, hw: keyW }, (i + 1) / KEYS.length, {
        at: (get, now) => resolve(get(0), get(1), get(2), now),
        from: 2,
        time: 1,
      })
    ),
    live: true,
    pose: ([mode, stamp, from], { t }) => {
      const p = resolve(mode, stamp, from, t);
      const running = motion(mode, stamp, from, t);
      const [supply, takeUp] = reels(p);
      const left = [-reelX, reelY];
      const right = [reelX, reelY];
      const [outA, inA] = tangent(left, supply.r, guides[0], guideR, -1);
      const [outB, inB] = tangent(right, takeUp.r, guides[1], guideR, 1);
      const spin = (TAU * t * 9) % TAU;
      const count = String(Math.floor(p * 999)).padStart(3, '0');
      return [
        ...reelParts(-reelX, supply),
        ...reelParts(reelX, takeUp),
        tapeLine(outA, inA),
        tapeLine(inA, [-guideX, tapeY]),
        tapeLine([-guideX, tapeY], [guideX, tapeY]),
        tapeLine([guideX, tapeY], inB),
        tapeLine(inB, outB),
        disc(
          capstanX,
          tapeY + 0.022,
          0.018,
          0.035,
          0.135,
          CHROME,
          'knurl',
          running === 'stop' ? 0 : spin
        ),
        ...KEYS.map((key, i) => {
          const down = key === running;
          const z = down ? 0.07 : 0.09;
          return [
            slab(keyX(i), keyY, keyW, 0.075, 0.035, z, WHITE, 0, 'rbox'),
            ...keyMark(key, keyX(i), z),
          ];
        }).flat(),
        ...kit.led(hw - 0.62, keyY, 0.03, 0, modeOf(mode) ? 0 : 1, {
          z0: 0.035,
        }),
        ...textParts(
          kit,
          count,
          hw - 0.3 - 0.075,
          keyY + 0.042,
          0.017,
          0.05,
          WHITE
        ),
      ];
    },
    signals: [
      { base: 0, fixed: true, kind: 'step', steps: KEYS.length + 1 },
      { base: STAMP_NONE, fixed: true, kind: 'smooth' },
      { base: 0, fixed: true, kind: 'smooth' },
    ],
    statics,
  };
}
