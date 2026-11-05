import { detent, press } from '../hits';
import { part, placeAll, quatX, quatY } from '../parts';
import { hash01 } from '../signals';
import { glyphBit } from './glyphs';
import { createDropPath, drift, dropped } from './paperDrop';

const PAPER = { c: [0.88, 0.87, 0.82], m: 0, r: 0.9 };
const GREENBAR = { c: [0.7, 0.82, 0.68], m: 0, r: 0.9 };
const RIBBON = { c: [0.05, 0.05, 0.08], m: 0, r: 0.75 };
const FAINT = { c: [0.55, 0.56, 0.52], m: 0, r: 0.8 };

const LINE = 0.055;
const BAND_LINES = 3;
const BAND = LINE * BAND_LINES;
const PAGE_LINES = 12;
const PAGE = LINE * PAGE_LINES;
const HALF = 0.003;
const INK_Z = HALF + 0.0015;
const STACK = 0.004;
const KEEP = 30;
const BAND_CACHE = 400;
const PRE_PAGES = KEEP + 2;
// With `drop`, the strip tears at the slit every TEAR_PAGES pages, once
// the perforation is TEAR_CLEAR out; a torn sheet has straightened by the
// time it has fallen STRAIGHTEN cells.
const TEAR_PAGES = 2;
const TEAR_CLEAR = 0.02;
const STRAIGHTEN = 1.2;
const RATE = 2.2;
const EASE = 0.3;
const DROOP = 0.18;
const BEND = 0.8;
const SLIT_Z = 0.3;
const STEP = 0.02;
const MODES = ['listing', 'plot', 'banner'];
const CHAR = 0.02;
const WORDS_PER_LINE = 4;
const LETTERS = 'ABCDEFGHJKLMNPRSTUVXYZ0123456789';

const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
const smooth = (x) => x * x * (3 - 2 * x);
const phiOf = (s) => (Math.PI / 2) * (1 - Math.exp(-Math.max(s, 0) / DROOP));

// How far down (y) and out (z) the strip is `s` along its droop from the
// slit, up to BEND, after which it hangs straight to its foot.
function createDroop() {
  const n = Math.ceil(BEND / STEP);
  const y = [0];
  const z = [0];
  for (let i = 1; i <= n; i += 1) {
    const phi = phiOf((i - 0.5) * STEP);
    y.push(y[i - 1] + Math.sin(phi) * STEP);
    z.push(z[i - 1] + Math.cos(phi) * STEP);
  }
  return (s) => {
    const x = clamp01(s / BEND) * n;
    const i = Math.min(Math.floor(x), n - 1);
    const k = x - i;
    return [y[i] + (y[i + 1] - y[i]) * k, z[i] + (z[i + 1] - z[i]) * k];
  };
}

// A dot-matrix printer on continuous fanfold paper: the strip leaves the
// slit, droops, hangs to the cable floor and folds there page by page into
// a pile capped at KEEP pages, the oldest culled from the bottom. Every
// position is a function of how many lines have fed, so it is pure in `t`.
// The platen knob picks what it prints; the button swaps green-bar paper
// for plain.
// The paper supply behind a window in the cabinet's lower front: a stack
// of blank fanfold, page edges in alternate shades, in a dark well.
function supplyWindow(kit, { bottom, hw, top }) {
  if (top - bottom < 0.2) return [];
  const { slab } = kit;
  const cy = (top + bottom) / 2;
  const hh = (top - bottom) / 2;
  const stack = (top - bottom) * 0.62;
  const sheets = Math.floor(stack / 0.016);
  return [
    slab(
      0,
      cy,
      hw + 0.02,
      hh + 0.02,
      SLIT_Z,
      SLIT_Z + 0.006,
      kit.style.metal,
      0,
      'rbox'
    ),
    slab(
      0,
      cy,
      hw,
      hh,
      SLIT_Z + 0.006,
      SLIT_Z + 0.008,
      kit.style.hole,
      0,
      'rbox'
    ),
    ...Array.from({ length: sheets }, (_, i) =>
      slab(
        0,
        bottom + 0.04 + (i + 0.5) * 0.016,
        hw - 0.06,
        0.0065,
        SLIT_Z + 0.008,
        SLIT_Z + 0.011,
        i % 2 ? FAINT : PAPER
      )
    ),
  ];
}

export default function buildFanfold(kit, { h, w }) {
  const { rng, slab, style } = kit;
  const seed = Math.floor(rng() * 2 ** 31);
  const ledIndex = Math.floor(rng() * 3);
  const startMode = Math.floor(rng() * MODES.length);
  const hw = w / 2 - 0.1;
  const hh = h / 2 - 0.1;
  const width = Math.min(1.3, (w - 0.24) * 0.9, 2 * (w / 2 - 0.1) - 0.16);
  const bodyH = 2 * hh;
  const slitY = hh - 0.42;
  const bandY = hh - 0.16;
  const droop = createDroop();
  const [bendDown, bendOut] = droop(BEND);
  const top = [slitY - bendDown, SLIT_Z + bendOut];
  const world = { drop: false, floor: -3, manifest: [], scale: 1 };
  const moduleFoot = -h / 2;
  let path = null;
  const memo = new Map();
  const cached = (name, make) => {
    if (!memo.has(name)) {
      if (memo.size > 800) memo.clear();
      memo.set(name, make());
    }
    return memo.get(name);
  };

  // A line of dot-matrix print: character cells struck one by one, the
  // head's jitter in each, the ribbon's ink drifting line to line.
  const words = (line) => {
    if (hash01(seed, line * 3) < 0.15) return [];
    const ribbon = {
      ...RIBBON,
      c: RIBBON.c.map((v) => v * (0.7 + 0.6 * hash01(seed, line * 5 + 2))),
    };
    const out = [];
    let cursor =
      -width / 2 + 0.1 + (hash01(seed, line * 3 + 1) < 0.3 ? 0.08 : 0);
    for (let i = 0; i < WORDS_PER_LINE; i += 1) {
      const chars = 2 + Math.floor(hash01(seed, line * 11 + i) * 6);
      if (cursor + chars * CHAR > width / 2 - 0.09) break;
      for (let c = 0; c < chars; c += 1) {
        const key = line * 97 + i * 13 + c;
        const tall = hash01(seed, key) < 0.25;
        const wide = 0.35 + 0.15 * hash01(seed, key + 5);
        out.push(
          slab(
            cursor + (c + 0.5) * CHAR,
            (hash01(seed, key + 9) - 0.5) * 0.003 + (tall ? 0.002 : 0),
            CHAR * wide,
            tall ? 0.0105 : 0.0075,
            HALF,
            INK_Z,
            ribbon
          )
        );
      }
      cursor += chars * CHAR + CHAR;
    }
    return out;
  };

  const plotPercent = (line, sample, lead) => {
    const { manifest } = world;
    const entry = manifest.length
      ? manifest[Math.floor(hash01(seed, 7) * manifest.length)]
      : null;
    const at = (line - lead) / RATE;
    const v = entry
      ? clamp01(sample(entry.key, 0, at))
      : 0.5 + 0.4 * Math.sin(line * 0.3);
    return Math.round(v * 40);
  };
  const plot = (line, percent) => {
    const span = width - 0.2;
    return cached(`p${percent}:${line % 4 === 0}`, () => [
      slab(-width / 2 + 0.1, 0, 0.003, LINE / 2, HALF, INK_Z, FAINT),
      ...(line % 4 === 0
        ? [slab(0, 0, span / 2, 0.002, HALF, INK_Z, FAINT)]
        : []),
      kit.disc(
        -span / 2 + (percent / 40) * span,
        0,
        0.012,
        HALF,
        INK_Z,
        RIBBON
      ),
    ]);
  };
  const banner = (line) => {
    const glyph = Math.floor(line / 4);
    const column = line % 4;
    if (column === 3) return [];
    const char = LETTERS[Math.floor(hash01(seed, glyph) * LETTERS.length)];
    const cell = (width - 0.2) / 5;
    return cached(`g${char}${column}`, () =>
      Array.from({ length: 5 }, (_, row) => row)
        .filter((row) => glyphBit(char, column, row))
        .map((row) =>
          slab(
            -width / 2 + 0.1 + (row + 0.5) * cell,
            0,
            cell * 0.46,
            LINE * 0.46,
            HALF,
            INK_Z,
            RIBBON
          )
        )
    );
  };
  const inkOf = (mode, line, percent) => {
    if (line < 0) return [];
    if (mode === 'plot') return plot(line, percent);
    if (mode === 'banner') return banner(line);
    return cached(`w${line}`, () => words(line));
  };

  // One band of BAND_LINES lines: paper, two tractor holes, and its ink. A
  // band looks the same wherever it hangs, so it is made once and re-placed;
  // only a plot's bands change with time, by the percents its lines read.
  const bands = new Map();
  const band = (index, look, mode, sample, lead) => {
    const percents =
      mode === 'plot'
        ? Array.from({ length: BAND_LINES }, (_, i) =>
            plotPercent(index * BAND_LINES + i, sample, lead)
          )
        : null;
    const key = `${index}:${look === GREENBAR}:${mode}:${percents ?? ''}`;
    if (!bands.has(key)) {
      if (bands.size > BAND_CACHE) bands.delete(bands.keys().next().value);
      bands.set(key, [
        part('box', [0, 0, 0], [width / 2, BAND / 2, HALF], look),
        ...[-1, 1].map((side) =>
          kit.disc(
            side * (width / 2 - 0.035),
            0,
            0.016,
            HALF,
            INK_Z,
            style.hole
          )
        ),
        ...Array.from({ length: BAND_LINES }, (_, i) =>
          placeAll(inkOf(mode, index * BAND_LINES + i, percents?.[i]), {
            offset: [0, (i + 0.5) * LINE - BAND / 2, 0],
          })
        ).flat(),
      ]);
    }
    return bands.get(key);
  };

  const housing = slab(
    0,
    hh - bodyH / 2,
    hw,
    bodyH / 2,
    0,
    SLIT_Z,
    style.knob,
    0,
    'rbox'
  );
  const knobX = hw - 0.16;
  const buttonX = -hw + 0.28;
  const statics = [
    housing,
    slab(
      0,
      slitY,
      Math.min(width / 2 + 0.05, hw - 0.1),
      0.022,
      SLIT_Z,
      SLIT_Z + 0.006,
      style.hole
    ),
    slab(0, slitY + 0.1, width / 2 + 0.02, 0.045, SLIT_Z, SLIT_Z + 0.004, {
      c: [0.02, 0.02, 0.025],
      m: 0,
      r: 0.15,
    }),
    ...kit.led(-hw + 0.14, bandY, 0.035, ledIndex, 1, { z0: SLIT_Z }),
    kit.disc(buttonX, bandY, 0.05, SLIT_Z, SLIT_Z + 0.004, style.hole),
    ...kit.legend(0.02, bandY, Math.min(0.36, 2 * hw - 0.8), 0.03, {
      z0: SLIT_Z,
    }),
    ...[-1, 1].flatMap((side) =>
      kit.screw(side * (hw - 0.12), hh - bodyH + 0.12, 0.035, SLIT_Z)
    ),
    ...supplyWindow(kit, {
      bottom: -hh + 0.26,
      hw: hw - 0.12,
      top: slitY - 0.36,
    }),
  ];

  // The print head and the two controls, posed.
  function head(step, frac, plain, modeValue) {
    const sweep = clamp01((frac - EASE) / (1 - EASE));
    const across = step % 2 ? 1 - sweep : sweep;
    return [
      slab(
        -width / 2 + 0.04 + across * (width - 0.08),
        slitY + 0.1,
        0.035,
        0.035,
        SLIT_Z + 0.004,
        SLIT_Z + 0.03,
        style.metal
      ),
      kit.disc(
        buttonX,
        bandY,
        0.04,
        SLIT_Z + 0.004,
        SLIT_Z + (plain > 0.5 ? 0.025 : 0.04),
        style.cap(1),
        'cap'
      ),
      kit.disc(
        knobX,
        bandY,
        0.075,
        SLIT_Z,
        SLIT_Z + 0.07,
        style.knob,
        'knurl',
        modeValue * 2.4
      ),
      slab(
        knobX + Math.sin(-modeValue * 2.4) * 0.045,
        bandY + Math.cos(-modeValue * 2.4) * 0.045,
        0.008,
        0.022,
        SLIT_Z + 0.07,
        SLIT_Z + 0.074,
        style.legend,
        modeValue * 2.4
      ),
    ];
  }

  const lookOf = (plain) => (index) =>
    plain < 0.5 && index % 2 ? GREENBAR : PAPER;

  // With `drop` (a panel that moves): the strip droops from the slit and
  // hangs straight down; as every TEAR_PAGES-th perforation clears the slit
  // it tears there, and the sheet below falls, straightening out of its
  // droop and leaning away below the module's foot, until it is culled.
  // Pure in `t`: a tear is the moment the feed reached it.
  function tearing({ lines, look, mode, sample, t }) {
    const sheet = TEAR_PAGES * PAGE;
    const perSheet = Math.round(sheet / BAND);
    const ahead = sheet / 2;
    const fedLength = ahead + lines * LINE;
    const lead = ahead / LINE;
    const tearFed = (j) => (j + 1) * sheet + TEAR_CLEAR;
    // When the feed reached `fed`: its line count inverted through the
    // eased step (smooth^-1 is 1/2 - sin(asin(1 - 2y) / 3)).
    const timeOf = (fed) => {
      const x = (fed - ahead) / LINE;
      const n = Math.floor(x);
      const g = x - n;
      if (g <= 0) return (n - 1 + EASE) / RATE;
      return (n + EASE * (0.5 - Math.sin(Math.asin(1 - 2 * g) / 3))) / RATE;
    };
    const hanging = (a, fed) => {
      const s = fed - a;
      if (s < -BAND) return null;
      if (s < 0) return { phi: 0, y: slitY, z: SLIT_Z + s };
      return {
        phi: path.phi(s),
        y: slitY - path.down(s),
        z: SLIT_Z + path.out(s),
      };
    };
    const place = (index, at) =>
      placeAll(band(index, look(index), mode, sample, lead), {
        offset: [0, at.y, at.z],
        q: quatX(at.phi - Math.PI / 2),
      });
    const parts = [];
    const newest = Math.floor(fedLength / BAND);
    for (let j = Math.floor(newest / perSheet); j >= 0; j -= 1) {
      const first = j * perSheet;
      const last = Math.min(first + perSheet - 1, newest);
      if (tearFed(j) > fedLength) {
        for (let index = last; index >= first; index -= 1) {
          const at = hanging((index + 0.5) * BAND, fedLength);
          if (at) parts.push(...place(index, at));
        }
      } else {
        const fall = dropped(t - timeOf(tearFed(j)), world.scale);
        if (fall == null) break;
        const away = drift(fall, world.scale);
        // The sheet as it hung when it tore, eased towards a straight line
        // up from its foot at the foot's angle.
        const k = smooth(clamp01((fall * world.scale) / STRAIGHTEN));
        const foot = hanging((first + 0.5) * BAND, tearFed(j));
        for (let index = first; index <= last; index += 1) {
          const hung = hanging((index + 0.5) * BAND, tearFed(j));
          const up = (index - first) * BAND;
          const at = {
            phi: hung.phi + (foot.phi - hung.phi) * k,
            y: hung.y + (foot.y + up * Math.sin(foot.phi) - hung.y) * k,
            z: hung.z + (foot.z - up * Math.cos(foot.phi) - hung.z) * k,
          };
          parts.push(
            ...place(index, { ...at, y: at.y - fall, z: at.z + away })
          );
        }
      }
    }
    return parts;
  }

  return {
    bind({ bounds, controls, drop = false, transform }) {
      world.drop = drop;
      world.scale = transform.scale;
      if (drop)
        path = createDropPath({
          foot: moduleFoot,
          length: TEAR_PAGES * PAGE + 0.5,
          phiOf,
          scale: transform.scale,
          slitY,
        });
      world.floor =
        (bounds.min[1] - 1.8 - transform.offset[1]) / transform.scale;
      world.manifest = controls
        .map((control, key) => ({
          id: control.id,
          key,
          signals: control.signals.length,
        }))
        .filter((entry) => entry.signals > 0 && entry.id !== 'printer');
      return {
        max: [width / 2 + 0.2, slitY + 0.1, top[1] + PAGE + 0.3],
        min: [-width / 2 - 0.2, world.floor - 0.1, 0],
      };
    },
    hits: [
      detent(0, knobX, bandY, 0.08, MODES.length),
      press(1, buttonX, bandY, { r: 0.07 }),
    ],
    live: true,
    loose: true,
    pose: ([modeValue, plain], { sample, t }) => {
      const mode = MODES[Math.round(modeValue * (MODES.length - 1))];
      const step = Math.floor(t * RATE);
      const frac = t * RATE - step;
      const lines = step + smooth(clamp01(frac / EASE));
      if (world.drop)
        return [
          ...tearing({ lines, look: lookOf(plain), mode, sample, t }),
          ...head(step, frac, plain, modeValue),
        ];
      const pileFloor = world.floor + HALF;
      const centre = top[1] + PAGE / 2 - 0.05;
      const estimate = BEND + Math.hypot(top[0] - pileFloor, centre - top[1]);
      const fedLength = estimate + PRE_PAGES * PAGE + lines * LINE;
      const lead = (estimate + PRE_PAGES * PAGE) / LINE;
      const laid = Math.max(fedLength - estimate, 0);
      const pages = Math.floor(laid / PAGE);
      const culled = Math.max(0, pages - KEEP);
      const rankOf = (page) => page - culled;
      const heightOf = (page) => pileFloor + rankOf(page) * STACK;
      const dirOf = (page) => (page % 2 ? -1 : 1);
      const edgeOf = (page) => centre - (dirOf(page) * PAGE) / 2;
      const jitter = (page) => (hash01(seed, page * 5 + 1) - 0.5) * 0.05;
      const footZ = edgeOf(pages) + dirOf(pages) * (laid - pages * PAGE);
      const foot = [heightOf(pages) + STACK, footZ];
      const hang = Math.hypot(foot[0] - top[0], foot[1] - top[1]);
      const hangPhi = Math.atan2(top[0] - foot[0], foot[1] - top[1]);
      const look = lookOf(plain);

      // Where the paper `a` along the job sits: drooping, hanging, or laid.
      const poseAt = (a) => {
        const s = fedLength - a;
        if (s < -BAND) return null;
        if (s < 0) return { phi: 0, x: 0, y: slitY, z: SLIT_Z + s };
        if (s <= BEND) {
          const [down, out] = droop(s);
          return { phi: phiOf(s), x: 0, y: slitY - down, z: SLIT_Z + out };
        }
        if (s <= BEND + hang) {
          const k = (s - BEND) / hang;
          return {
            phi: hangPhi,
            x: 0,
            y: top[0] + (foot[0] - top[0]) * k,
            z: top[1] + (foot[1] - top[1]) * k,
          };
        }
        const page = Math.floor(a / PAGE);
        if (page < pages - 1) return null;
        return {
          phi: dirOf(page) > 0 ? Math.PI : 0,
          x: jitter(page),
          y: heightOf(page) + STACK,
          z: edgeOf(page) + dirOf(page) * (a - page * PAGE),
        };
      };

      const parts = [];
      const newest = Math.floor(fedLength / BAND);
      const oldest = Math.max(0, (pages - 1) * PAGE_LINES) / BAND_LINES;
      for (let index = newest; index >= oldest; index -= 1) {
        const at = poseAt((index + 0.5) * BAND);
        if (at) {
          parts.push(
            ...placeAll(band(index, look(index), mode, sample, lead), {
              offset: [at.x, at.y, at.z],
              q: quatX(at.phi - Math.PI / 2),
            })
          );
        }
      }
      for (let page = culled; page < pages - 1; page += 1) {
        parts.push(
          part(
            'box',
            [jitter(page), heightOf(page), centre],
            [width / 2, HALF, PAGE / 2],
            PAPER,
            quatY((hash01(seed, page * 5 + 2) - 0.5) * 0.08)
          )
        );
      }
      parts.push(...head(step, frac, plain, modeValue));
      return parts;
    },
    signals: [
      {
        base: startMode / (MODES.length - 1),
        fixed: true,
        kind: 'step',
        steps: MODES.length,
      },
      { base: 0, fixed: true, kind: 'switch' },
    ],
    statics,
  };
}
