import { hexRgb } from './dxf.mjs';
import { inkMask, knockOut } from './knockout.mjs';
import {
  optimiseRuns,
  orderRuns,
  simplifyRun,
  transformRuns,
} from './paths.mjs';
import { crowding, passStats } from './stats.mjs';

export const JOB_VERSION = 1;

const luminance = (color) => {
  const [r, g, b] = hexRgb(color) ?? [0, 0, 0];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export function placement(source, { marginMm, paper, plotWidthMm }) {
  const fit = Math.min(
    (paper.widthMm - 2 * marginMm) / source.widthMm,
    (paper.heightMm - 2 * marginMm) / source.heightMm
  );
  const scale = plotWidthMm ? plotWidthMm / source.widthMm : fit;
  const widthMm = source.widthMm * scale;
  const heightMm = source.heightMm * scale;
  return {
    heightMm,
    offset: [(paper.widthMm - widthMm) / 2, (paper.heightMm - heightMm) / 2],
    overflows:
      widthMm > paper.widthMm + 1e-6 || heightMm > paper.heightMm + 1e-6,
    scale,
    widthMm,
  };
}

// Pens that have a layer, light first so the darkest (outline) pen lands
// last; `order` pins passes the user moved by hand.
export function passOrder(pens, assign, order = []) {
  const used = pens.filter((pen) =>
    Object.values(assign).some((penId) => penId === pen.id)
  );
  const pinned = order
    .map((id) => used.find((pen) => pen.id === id))
    .filter(Boolean);
  const rest = used
    .filter((pen) => !pinned.includes(pen))
    .sort((a, b) => luminance(b.color) - luminance(a.color));
  return [...pinned, ...rest];
}

const registrationTick = (marginMm) => {
  const at = Math.max(1, marginMm / 2);
  const arm = Math.min(3, at);
  return {
    closed: false,
    points: [
      [at + arm, at],
      [at, at],
      [at, at + arm],
    ],
  };
};

function lab(color) {
  const linear = (hexRgb(color) ?? [0, 0, 0]).map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = linear;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.9505);
  const y = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.089);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

// Pens that would vanish into the paper (white gel on white) are never
// picked for it.
const PAPER_DELTA = 20;
const showsOn = (paper) => (pen) =>
  !paper ||
  Math.hypot(...lab(pen.color).map((v, i) => v - lab(paper)[i])) > PAPER_DELTA;

// The pen whose colour is nearest a layer's stroke (CIELAB distance);
// black, or no colour, takes the first pen.
export function nearestPen(color, allPens, paper = null) {
  const pens = allPens.filter(showsOn(paper));
  const rgb = hexRgb(color);
  if (!rgb || Math.max(...rgb) < 24) return pens[0]?.id ?? '';
  const target = lab(color);
  const distance = (pen) =>
    Math.hypot(...lab(pen.color).map((value, i) => value - target[i]));
  return [...pens].sort((a, b) => distance(a) - distance(b))[0]?.id ?? '';
}

const deltaE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));

const combinations = (items, n, start = 0, picked = [], out = []) => {
  if (picked.length === n) {
    out.push(picked);
    return out;
  }
  for (let i = start; i <= items.length - (n - picked.length); i += 1) {
    combinations(items, n, i + 1, [...picked, items[i]], out);
  }
  return out;
};

// The `n` pens that draw the layers closest to their own colours, weighing
// each layer by its ink, and every layer on the nearest of them.
export function fitPens(layers, allPens, n, paper = null) {
  const pens = allPens.filter(showsOn(paper));
  const count = Math.min(n, pens.length);
  if (count < 1) return {};
  const costOf = (set) =>
    layers.reduce(
      (sum, layer) =>
        sum +
        (layer.inkMm || 1) *
          Math.min(...set.map((pen) => deltaE(layer.stroke, pen.color))),
      0
    );
  const best = combinations(pens, count).reduce(
    (winner, set) => {
      const cost = costOf(set);
      return cost < winner.cost ? { cost, set } : winner;
    },
    { cost: Infinity, set: [] }
  );
  return Object.fromEntries(
    layers.map((layer) => [
      layer.id,
      [...best.set].sort(
        (a, b) => deltaE(layer.stroke, a.color) - deltaE(layer.stroke, b.color)
      )[0].id,
    ])
  );
}

// Which passes cut lighter ones back by default: the near-black pens, so
// fills stop short of the outline and eyeliner while shades of one colour
// still interleave.
export const defaultKnockout = (pens) =>
  pens.filter((pen) => luminance(pen.color) < 40).map((pen) => pen.id);

export function buildJob(source, settings) {
  const { assign, marginMm, minLengthMm, paper, pens, registration } = settings;
  const cutters = new Set(settings.knockout ?? defaultKnockout(pens));
  const place = placement(source, settings);
  const page = [paper.widthMm, paper.heightMm];
  const drafts = passOrder(pens, assign, settings.order).map((pen) => {
    const layers = source.layers.filter((layer) => assign[layer.id] === pen.id);
    const perLayer = layers.map((layer) =>
      transformRuns(layer.runs, place.scale, place.offset)
    );
    return {
      layers,
      pen,
      perLayer,
      runs: optimiseRuns(perLayer.flat(), page, {
        bridgeMm: pen.nibMm,
        minLengthMm,
        simplifyMm: Math.min(0.1, pen.nibMm / 4),
      }),
    };
  });
  // Light passes run first, so each is cut back from the cutting passes
  // after it.
  for (let i = drafts.length - 2; i >= 0; i -= 1) {
    const later = drafts.slice(i + 1).filter(({ pen }) => cutters.has(pen.id));
    if (later.length) {
      const gapMm = Math.max(...later.map(({ pen }) => pen.nibMm));
      const mask = inkMask(
        later.map((draft) => draft.runs),
        gapMm,
        page
      );
      drafts[i].runs = orderRuns(
        knockOut(drafts[i].runs, mask)
          .map((run) =>
            simplifyRun(run, Math.min(0.1, drafts[i].pen.nibMm / 4))
          )
          .filter((run) => run.points.length >= 2),
        page,
        { bridgeMm: drafts[i].pen.nibMm }
      );
    }
  }
  const passes = drafts.map(({ layers, pen, perLayer, runs }) => {
    if (registration) runs.unshift(registrationTick(marginMm));
    return {
      crowding: crowding(runs, pen.nibMm, page),
      layerCrowding: Object.fromEntries(
        layers.map((layer, i) => [
          layer.id,
          crowding(perLayer[i], pen.nibMm, page).fraction,
        ])
      ),
      layers: layers.map((layer) => layer.id),
      pen,
      runs,
      stats: passStats(runs),
    };
  });
  return { paper, passes, placement: place };
}

const round = (value) => Math.round(value * 100) / 100;

export const encodeRuns = (runs) =>
  runs.map(({ arcs, closed, points }) => ({
    ...(arcs ? { a: 1 } : {}),
    c: closed ? 1 : 0,
    p: points.flatMap(([x, y]) => [round(x), round(y)]),
  }));

export const decodeRuns = (encoded) =>
  encoded.map(({ a, c, p }) => {
    const points = [];
    for (let i = 0; i + 1 < p.length; i += 2) points.push([p[i], p[i + 1]]);
    return { ...(a ? { arcs: true } : {}), closed: Boolean(c), points };
  });

// The saved, self-contained plot: what exports and the plotter read.
export function serializeJob({ name, settings, source }, built) {
  return {
    createdAt: new Date().toISOString(),
    name,
    paper: built.paper,
    passes: built.passes.map(({ layers, pen, runs, stats }) => ({
      layers,
      pen,
      runs: encodeRuns(runs),
      stats,
    })),
    placement: built.placement,
    settings,
    source,
    version: JOB_VERSION,
  };
}

export const jobPasses = (job) =>
  job.passes.map((pass) => ({ ...pass, runs: decodeRuns(pass.runs) }));

// Flat arrays for the preview: one Float32Array of coordinates per pass,
// with where each run starts and whether it closes.
export function packRuns(runs) {
  const count = runs.reduce((sum, run) => sum + run.points.length, 0);
  const coords = new Float32Array(count * 2);
  const starts = new Uint32Array(runs.length + 1);
  const closed = new Uint8Array(runs.length);
  let at = 0;
  runs.forEach((run, i) => {
    starts[i] = at;
    closed[i] = run.closed ? 1 : 0;
    run.points.forEach(([x, y]) => {
      coords[at * 2] = x;
      coords[at * 2 + 1] = y;
      at += 1;
    });
  });
  starts[runs.length] = at;
  return { closed, coords, starts };
}
