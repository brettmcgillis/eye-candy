import { press } from '../hits';
import { INK } from '../kit';
import { part, quatMul, quatY, quatZ } from '../parts';
import { hash01 } from '../signals';

const PLATE = { c: [0.78, 0.79, 0.8], m: 0.15, r: 0.45 };
const LINE = { c: [0.012, 0.012, 0.014], m: 0, r: 0.6 };
const GREEN = [0.3, 1, 0.38];
const UNLIT = { c: [0.06, 0.075, 0.065], m: 0, r: 0.3 };
const PLATE_TOP = 0.06;
const TRACK = 0.016;
const LANE = 0.26;
const SLOPE = Math.tan(Math.PI / 3);
const STATION = 0.3;
const LAMP_GAP = 0.36;
const MAX_LAMPS = 40;
const MAX_RUNS = 18;
// HexTrees' fork rule: a fork happens while a die beats a threshold that
// climbs with generation and with how far along its run the turtle is.
const FORK_PER_GEN = 0.22;
const FORK_PER_ITER = 0.035;
const FORK_CHANCE = 0.42;

// A railway mimic panel: track grown from one or two through lines by
// HexTrees-style forking, each branch leaving its parent at 60°, running
// level, and ending at the plate's edge, a buffer stop, or back on its
// parent. Lamps along the runs light as trains pass; a click flips one.
export default function buildMimic(kit, { h, w }) {
  const { disc, rng, slab, style } = kit;
  const hw = w / 2 - 0.16;
  const hh = h / 2 - 0.16;
  const edge = hw - 0.22;
  const top = hh - 0.24;
  const bottom = -hh + 0.36;
  const lanes = Math.max(3, Math.floor((top - bottom) / LANE) + 1);
  const laneY = (lane) => bottom + lane * ((top - bottom) / (lanes - 1));
  const rise = (top - bottom) / (lanes - 1) / SLOPE;
  const used = Array.from({ length: lanes }, () => []);
  const free = (lane, a, b) =>
    lane >= 0 &&
    lane < lanes &&
    used[lane].every(([u, v]) => b + 0.12 < u || a - 0.12 > v);
  const runs = [];
  const segments = [];
  const ends = [];

  const addRun = (lane, a, b, entry) => {
    used[lane].push([a, b]);
    const run = { a, b, entry, lane, y: laneY(lane) };
    runs.push(run);
    segments.push([a, run.y, b, run.y], ...(entry ? [entry] : []));
    return run;
  };

  const grow = (run, generation) => {
    let iteration = 0;
    for (let x = run.a + STATION; x < run.b - STATION; x += STATION) {
      iteration += 1;
      const threshold = FORK_PER_GEN * generation + FORK_PER_ITER * iteration;
      if (runs.length < MAX_RUNS && rng() > threshold && rng() < FORK_CHANCE) {
        const jump = rng() < 0.3 ? 2 : 1;
        const dy = rng() < 0.5 ? jump : -jump;
        const dx = rng() < 0.6 ? 1 : -1;
        const lane = run.lane + dy;
        const from = x + dx * rise * jump;
        const roll = rng();
        const toEdge = dx * edge;
        let to = from + dx * (0.6 + rng() * (w * 0.45));
        let end = 'buffer';
        if (roll < 0.35 || Math.abs(to) >= edge) {
          to = toEdge;
          end = 'arrow';
        } else if (roll < 0.7) end = 'rejoin';
        const back = end === 'rejoin' ? to + dx * rise * jump : to;
        const [a, b] = dx > 0 ? [from, to] : [to, from];
        const fits =
          free(lane, a, b) &&
          (end !== 'rejoin' || (back < run.b && back > run.a));
        if (fits) {
          const branch = addRun(lane, a, b, [x, run.y, from, laneY(lane)]);
          if (end === 'rejoin') segments.push([to, branch.y, back, run.y]);
          ends.push({ dir: dx, end, x: to, y: branch.y });
          grow(branch, generation + 1);
          x = Math.max(x, from) + STATION;
        }
      }
    }
  };

  const trunks = lanes >= 5 && rng() < 0.8 ? 2 : 1;
  Array.from({ length: trunks }, (_, i) =>
    Math.floor((lanes * (i + 1)) / (trunks + 1))
  ).forEach((lane) => {
    const trunk = addRun(lane, -edge, edge, null);
    ends.push(
      { dir: -1, end: 'arrow', x: -edge, y: trunk.y },
      { dir: 1, end: 'arrow', x: edge, y: trunk.y }
    );
    grow(trunk, 0);
  });

  // Crossovers between neighbouring parallel runs, sometimes a scissors.
  runs.forEach((lower) => {
    runs
      .filter((upper) => upper.lane === lower.lane + 1)
      .forEach((upper) => {
        const a = Math.max(lower.a, upper.a) + 0.15;
        const b = Math.min(lower.b, upper.b) - 0.15 - rise;
        if (b <= a || rng() > 0.55) return;
        const x = a + rng() * (b - a);
        const lean = rng() < 0.5;
        const [y0, y1] = lean ? [lower.y, upper.y] : [upper.y, lower.y];
        segments.push([x, y0, x + rise, y1]);
        if (rng() < 0.3) segments.push([x, y1, x + rise, y0]);
      });
  });

  const line = ([x0, y0, x1, y1]) => [
    slab(
      (x0 + x1) / 2,
      (y0 + y1) / 2,
      Math.hypot(x1 - x0, y1 - y0) / 2,
      TRACK,
      PLATE_TOP,
      PLATE_TOP + INK,
      LINE,
      Math.atan2(y1 - y0, x1 - x0)
    ),
    disc(x0, y0, TRACK, PLATE_TOP, PLATE_TOP + INK, LINE),
    disc(x1, y1, TRACK, PLATE_TOP, PLATE_TOP + INK, LINE),
  ];
  const arrow = ({ dir, x, y }) =>
    part(
      'bullet',
      [x + dir * 0.04, y, PLATE_TOP + INK / 2],
      [INK / 2, 0.055, 0.07],
      LINE,
      quatMul(quatZ(dir > 0 ? 0 : Math.PI), quatY(Math.PI / 2))
    );
  const buffer = ({ x, y }) =>
    slab(x, y, TRACK, 0.06, PLATE_TOP, PLATE_TOP + INK, LINE);

  const lamps = [];
  runs.forEach((run, index) => {
    const span = run.b - run.a;
    const count = Math.floor(span / LAMP_GAP);
    for (let k = 0; k < count && lamps.length < MAX_LAMPS; k += 1) {
      const x = run.a + (span * (k + 0.5)) / count;
      lamps.push({ run: index, u: (x - run.a) / span, x, y: run.y });
    }
  });
  const ink = { look: LINE, z0: PLATE_TOP };
  const labels = runs
    .filter((run) => run.b - run.a > 1 && rng() < 0.6)
    .flatMap((run) =>
      kit.legend((run.a + run.b) / 2, run.y + 0.07, 0.28, 0.022, ink)
    );

  return {
    live: true,
    statics: [
      slab(0, 0, w / 2 - 0.06, h / 2 - 0.06, 0, 0.04, style.rubber, 0, 'rbox'),
      slab(0, 0, hw, hh, 0.04, PLATE_TOP, PLATE, 0, 'rbox'),
      ...segments.flatMap(line),
      ...ends.filter((e) => e.end === 'arrow').map(arrow),
      ...ends.filter((e) => e.end === 'buffer').map(buffer),
      ...lamps.map(({ x, y }) =>
        disc(x, y, 0.045, PLATE_TOP, PLATE_TOP + 0.01, style.metal)
      ),
      ...labels,
      ...kit.legend(0, -hh + 0.14, w * 0.25, 0.045, ink),
      ...[-1, 1].flatMap((sx) =>
        [-1, 1].flatMap((sy) =>
          kit.screw(sx * (hw - 0.14), sy * (hh - 0.14), 0.025, PLATE_TOP)
        )
      ),
    ],
    hits: lamps.map(({ x, y }, i) => press(i, x, y, { r: 0.06 })),
    signals: lamps.map(() => ({ base: 0, fixed: true, kind: 'switch' })),
    pose: (flips, { t }) =>
      lamps.map(({ run, u, x, y }, i) => {
        const span = runs[run].b - runs[run].a;
        const train = Math.min(0.9, 1.2 / span);
        const head = ((hash01(run, 3) + (t * 0.35) / span) % 1) * (1 + train);
        let on = u <= head && u >= head - train;
        if (hash01(i, 5) < 0.12) on = !on;
        if (flips[i] > 0.5) on = !on;
        return disc(
          x,
          y,
          0.03,
          PLATE_TOP + 0.01,
          PLATE_TOP + 0.022,
          on ? style.lit(GREEN, 0.55) : UNLIT
        );
      }),
  };
}
