import { svgProjection } from '@modules/flora';

import { BEAD_KIND } from './emit';

// A plottable vector render of a specimen: one stroke per fibre centreline,
// both edges of every plate (gills, ridges, walls), a circle per bead. The
// lifecycle is replayed on the CPU exactly as @modules/fungiRender's shaders
// play it, so a still at any grow / rot / spore level plots what it renders,
// and hidden line work is dropped against the render's own depth pass.
//
// Pens are the five gradient stops plus the spore colour.

const { applyMatrix, circlePath, createProjector, formatPath, matrixScale } =
  svgProjection;

const STOPS = 5;
const PLATE = 2;
const PENS = [...Array.from({ length: STOPS }, (_, k) => `stop-${k}`), 'spore'];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function decodeOct(u, v) {
  const z = 1 - Math.abs(u) - Math.abs(v);
  const t = Math.max(-z, 0);
  const x = u + (u >= 0 ? -t : t);
  const y = v + (v >= 0 ? -t : t);
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

const penOf = (colorT) => `stop-${Math.round(clamp01(colorT) * (STOPS - 1))}`;

function memberLevels(levels, delay) {
  const { exit = 0, grow = 1, rot = 0, stagger = 0 } = levels;
  return {
    effective: Math.min(clamp01(grow - delay * stagger), 1 - exit),
    rot: clamp01(rot - delay * stagger * 0.5),
  };
}

export default function renderFungiSvg({
  background = '#050505',
  camera,
  height,
  levels = {},
  matrix = null,
  minStroke = 0.3,
  simplify = 0.35,
  specimen,
  sporeAmount = 1,
  stroke = 1,
  visible = null,
  width,
}) {
  const project = createProjector({ camera, height, width });
  const scale = matrixScale(matrix);
  const { palette, segments, beads } = specimen;
  const colors = {
    ...Object.fromEntries(palette.stops.map((hex, k) => [`stop-${k}`, hex])),
    spore: palette.spore,
  };
  const paths = Object.fromEntries(PENS.map((pen) => [pen, []]));
  const margin = Math.max(width, height) * 0.1;
  const spore = levels.spore ?? 0;
  const sporeFall = (specimen.bounds.max[1] - specimen.bounds.min[1]) * 0.6;

  const onScreen = (p) =>
    p &&
    p.x > -margin &&
    p.y > -margin &&
    p.x < width + margin &&
    p.y < height + margin;

  // A centreline sits one radius behind the surface the depth pass recorded.
  const shows = (p, radius) =>
    !visible || visible(p.x, p.y, p.depth - radius * 1.4 - p.depth * 0.004);

  const runs = [null, null, null];

  const flush = (lane) => {
    const run = runs[lane];
    if (run && run.points.length > 1) {
      paths[run.pen].push({ d: formatPath(run.points), width: run.width });
    }
    runs[lane] = null;
  };
  const flushAll = () => runs.forEach((_, lane) => flush(lane));

  const extend = (lane, from, to, radius, pen) => {
    const a = project(applyMatrix(matrix, from));
    const b = project(applyMatrix(matrix, to));
    const r = radius * scale;

    if (!onScreen(a) || !onScreen(b) || !shows(b, r)) {
      flush(lane);
      return;
    }
    const px = Math.max(minStroke, r * 2 * stroke * b.scale);
    let run = runs[lane];
    const chained =
      run &&
      run.pen === pen &&
      Math.abs(run.width - px) < 0.35 &&
      Math.hypot(run.last.x - a.x, run.last.y - a.y) < 0.75;

    if (!chained) {
      flush(lane);
      run = { last: a, pen, points: [a], width: px };
      runs[lane] = run;
    }
    if (Math.hypot(b.x - run.last.x, b.y - run.last.y) < simplify) return;
    run.points.push(b);
    run.last = b;
    run.width = px;
  };

  const { end, frameEnd, frameStart, meta, start, time, tone } = segments;

  for (let k = 0; k < segments.count; k += 1) {
    const o = k * 4;
    const { effective, rot } = memberLevels(levels, meta[o]);
    const born = time[o];

    if (effective <= born) {
      flushAll();
      // eslint-disable-next-line no-continue
      continue;
    }
    const g = clamp01((effective - born) / Math.max(time[o + 1] - born, 1e-4));
    const droop = rot ** 1.6;
    const shrink = 1 - rot * 0.35;
    const s0 = [start[o], start[o + 1] - tone[o + 2] * droop, start[o + 2]];
    const e1 = [end[o], end[o + 1] - tone[o + 3] * droop, end[o + 2]];
    const tip = s0.map((v, a) => v + (e1[a] - v) * g);
    const r0 = start[o + 3] * shrink;
    const rTip = r0 + (end[o + 3] * shrink - r0) * g || r0;
    const pen = penOf((tone[o] + tone[o + 1]) / 2);
    const aspect0 = time[o + 2];
    const aspectTip = aspect0 + (time[o + 3] - aspect0) * g;

    if (Math.max(aspect0, aspectTip) < PLATE) {
      extend(0, s0, tip, rTip, pen);
      // eslint-disable-next-line no-continue
      continue;
    }
    const n0 = decodeOct(frameStart[o + 2], frameStart[o + 3]);
    const n1 = decodeOct(frameEnd[o + 2], frameEnd[o + 3]);
    const nTip = n0.map((v, a) => v + (n1[a] - v) * g);
    const w0 = r0 * aspect0;
    const wTip = rTip * aspectTip;

    [1, -1].forEach((side, index) => {
      extend(
        1 + index,
        s0.map((v, a) => v + n0[a] * w0 * side),
        tip.map((v, a) => v + nTip[a] * wTip * side),
        rTip,
        pen
      );
    });
  }
  flushAll();

  const dots = Object.fromEntries(PENS.map((pen) => [pen, []]));
  const { extra, info, position } = beads;

  for (let i = 0; i < beads.count; i += 1) {
    const o = i * 4;
    const kind = extra[o];
    const rand = info[o + 3];
    const { effective, rot } = memberLevels(levels, info[o + 2]);
    const grown = smoothstep(info[o], info[o] + 0.04, effective);
    const isSpore = kind > BEAD_KIND.bead + 0.5;
    const held = kind > BEAD_KIND.held - 0.5;
    const local = clamp01(spore * 1.5 - rand * 0.5);
    const falling = 1 - smoothstep(0.75, 1, local);
    const drifting = local > 0 && rand < sporeAmount / 3 ? falling : 0;
    const alive = held ? grown * falling : drifting;
    const size = (isSpore ? alive : grown * (1 - rot * 0.3)) * position[o + 3];

    if (size <= 1e-6) {
      // eslint-disable-next-line no-continue
      continue;
    }
    const center = [
      position[o],
      position[o + 1] - extra[o + 1] * rot ** 1.6,
      position[o + 2],
    ];

    if (isSpore) {
      const spread = local * sporeFall * 0.18;
      center[0] += Math.sin(rand * 53 + local * 5) * spread;
      center[1] -= local * local * sporeFall;
      center[2] += Math.cos(rand * 31 + local * 4) * spread;
    }
    const p = project(applyMatrix(matrix, center));
    const r = size * scale;

    if (!onScreen(p) || !shows(p, r)) {
      // eslint-disable-next-line no-continue
      continue;
    }
    const pen = isSpore && !held ? 'spore' : penOf(info[o + 1]);
    const rPx = r * p.scale;

    dots[pen].push({
      d: circlePath(p.x, p.y, Math.max(minStroke / 2, rPx)),
      width: Math.max(minStroke, Math.min(1, rPx * 0.4) * stroke),
    });
  }

  const group = (id, pen, entries) => {
    if (entries.length === 0) return '';
    const body = entries
      .map(
        (entry) =>
          `<path d="${entry.d}" stroke-width="${entry.width.toFixed(2)}"/>`
      )
      .join('');
    return `<g id="${id}" fill="none" stroke="${colors[pen]}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
  };
  const groups = [
    ...PENS.map((pen) => group(pen, pen, paths[pen])),
    ...PENS.map((pen) => group(`${pen}-beads`, pen, dots[pen])),
  ].join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="${background}"/>${groups}</svg>`
  );
}
