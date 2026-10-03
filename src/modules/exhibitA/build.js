import { attractorPath, hopfFibres, lissajousKnot, torusKnot } from './curves';
import { fieldRadius } from './fields';
import { len3, sub3 } from './math';
import {
  addShell,
  addSphere,
  addTube,
  createPart,
  fitToUnitBall,
  partBounds,
  resample,
} from './meshes';
import { edgeSamples, polytope, projector, rotate4 } from './polytopes';
import { FAMILY_KINDS, exhibitOf } from './renderOptions.mjs';
import STRING_MODELS from './strings';
import SURFACES from './surfaces';

const MAX_RINGS = 14000;

const ramp = (count, from = 0, to = 1) =>
  Array.from(
    { length: count },
    (_, i) => from + ((to - from) * i) / Math.max(count - 1, 1)
  );

function arcLength(points, closed) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += len3(sub3(points[i], points[i - 1]));
  }
  if (closed) total += len3(sub3(points[0], points[points.length - 1]));
  return total;
}

// Rings close enough that a bend never shows a facet, few enough to stay a
// cheap rebuild while evolving.
function ringsFor(points, closed, radius, cap = MAX_RINGS) {
  const wanted = Math.round(arcLength(points, closed) / (radius * 0.9));
  return Math.min(Math.max(wanted, 64), cap);
}

function attractorParts(config, id, budget) {
  const raw = attractorPath(config, id);
  const radius = config.attractorTube;
  const {
    lines: [path],
  } = fitToUnitBall([raw], 1 - radius);
  const points = resample(
    path,
    ringsFor(path, false, radius, Math.round(MAX_RINGS * budget))
  );
  const body = createPart();
  const t = ramp(points.length);
  addTube(body, points, {
    radius,
    radialSegments: budget < 1 ? 6 : 8,
    reveal: t,
    structure: t,
  });
  return { body: body.build() };
}

function knotParts(config, id) {
  const radius = config.knotTube;
  const body = createPart();
  if (id === 'hopf') {
    const fibres = hopfFibres(config, 128);
    const { lines } = fitToUnitBall(
      fibres.map((f) => f.points),
      1 - radius
    );
    lines.forEach((line, i) => {
      const count = lines.length;
      const reveal = ramp(line.length, i / count, (i + 1) / count);
      const structure = line.map(() => fibres[i].ring);
      addTube(body, line, {
        closed: true,
        radius,
        radialSegments: 8,
        reveal,
        structure,
      });
    });
    return { body: body.build() };
  }
  const raw =
    id === 'torusKnot' ? torusKnot(config, 1200) : lissajousKnot(config, 1600);
  const { lines } = fitToUnitBall(raw, 1 - radius);
  lines.forEach((line, i) => {
    const points = resample(line, ringsFor(line, true, radius, 4000), true);
    const count = lines.length;
    const reveal = ramp(points.length, i / count, (i + 1) / count);
    addTube(body, points, {
      closed: true,
      radius,
      radialSegments: 12,
      reveal,
      structure: ramp(points.length),
    });
  });
  return { body: body.build() };
}

function surfaceParts(config, id, budget) {
  const def = SURFACES[id](config);
  const [u0, u1] = def.u;
  const [v0, v1] = def.v;
  const probe = [];
  const n = 48;
  for (let i = 0; i <= n; i += 1) {
    for (let j = 0; j <= n; j += 1) {
      const p = def.fn(u0 + ((u1 - u0) * i) / n, v0 + ((v1 - v0) * j) / n);
      if (p.every(Number.isFinite)) probe.push(p);
    }
  }
  const wall = config.surfaceWall;
  const { centre, scale } = fitToUnitBall([probe], 1 - wall);
  const fn = (u, v) => {
    const p = def.fn(u, v);
    return [
      (p[0] - centre[0]) * scale,
      (p[1] - centre[1]) * scale,
      (p[2] - centre[2]) * scale,
    ];
  };
  const detail = config.surfaceDetail * Math.sqrt(budget);
  const body = createPart();
  addShell(body, fn, {
    rimU: def.rimU ?? [true, true],
    rimV: def.rimV ?? [true, true],
    segU: Math.max(8, Math.round(def.segU * detail)),
    segV: Math.max(8, Math.round(def.segV * detail)),
    u0,
    u1,
    v0,
    v1,
    wall,
  });
  return { body: body.build() };
}

// Short closed polygons (a skew quadrilateral) are straight bars with
// jointed corners, not one tube bent hard at each corner.
function addFrame(part, { closed, points }, radius) {
  const flat = ramp(points.length, 0, 0);
  if (closed && points.length < 8) {
    points.forEach((p, i) => {
      const q = points[(i + 1) % points.length];
      addTube(part, [p, q], {
        radius,
        radialSegments: 12,
        reveal: [0, 0],
        structure: [0, 0],
      });
      addSphere(part, p, radius * 1.15, { segments: 14 });
    });
    return;
  }
  addTube(part, points, {
    closed,
    radius,
    radialSegments: 12,
    reveal: flat,
    structure: flat,
  });
}

function stringsParts(config, id) {
  const model = STRING_MODELS[id](config);
  const frame = createPart();
  const thread = createPart();
  const thread2 = createPart();
  model.frame.forEach((rail) => addFrame(frame, rail, config.stringsFrame));
  const count = model.threads.length;
  model.threads.forEach(({ from, second, to }, i) => {
    const samples = 8;
    const points = Array.from({ length: samples }, (_, k) => {
      const t = k / (samples - 1);
      return [
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
        from[2] + (to[2] - from[2]) * t,
      ];
    });
    addTube(second ? thread2 : thread, points, {
      radius: config.stringsThread,
      radialSegments: 6,
      reveal: ramp(samples, i / count, (i + 1) / count),
      structure: ramp(samples, i / count, i / count),
    });
  });
  return {
    body: frame.build(),
    thread: thread.build(),
    thread2: thread2.build(),
  };
}

function polytopeParts(config, id, budget) {
  const { edges, vertices } = polytope(id);
  const turn = rotate4(config);
  const project = projector(config);
  const stereo = config.polyProjection === 'stereographic';
  const clip = stereo ? config.polyClip : Infinity;
  const fit = stereo ? 1 / config.polyClip : 1;
  const turned = vertices.map(turn);
  const body = createPart();
  const firstSeen = new Array(vertices.length).fill(Infinity);
  const count = edges.length;
  const jointed = config.polyNode >= config.polyEdge;
  edges.forEach(([a, b], i) => {
    const samples = edgeSamples(turned[a], turned[b], config).map(project);
    if (samples.some(({ point }) => len3(point) > clip)) return;
    const start = i / count;
    firstSeen[a] = Math.min(firstSeen[a], start);
    firstSeen[b] = Math.min(firstSeen[b], start);
    addTube(
      body,
      samples.map(({ point }) => point.map((v) => v * fit)),
      {
        caps: !jointed,
        radius: samples.map(({ scale }) => config.polyEdge * scale * fit),
        radialSegments: 8,
        reveal: ramp(samples.length, start, (i + 1) / count),
        structure: ramp(samples.length, start, start),
      }
    );
  });
  if (config.polyNode > 0) {
    turned.forEach((p, v) => {
      if (firstSeen[v] === Infinity) return;
      const { point, scale } = project(p);
      addSphere(
        body,
        point.map((x) => x * fit),
        config.polyNode * scale * fit,
        {
          reveal: firstSeen[v],
          segments: budget < 1 ? 8 : 12,
          structure: firstSeen[v],
        }
      );
    });
  }
  return { body: body.build() };
}

const MESH_BUILDERS = {
  attractor: attractorParts,
  knot: knotParts,
  polytope: polytopeParts,
  strings: stringsParts,
  surface: surfaceParts,
};

// Everything the renderer needs to draw the exhibit a config names: a field
// spec, or mesh parts by material role (`body`, `thread`, `thread2`) in
// object space within the unit ball. `budget` below 1 trades detail for a
// rebuild cheap enough to run every frame of an evolve.
export default function buildExhibit(config, { budget = 1 } = {}) {
  const id = exhibitOf(config);
  const kind = FAMILY_KINDS[config.family];
  if (kind === 'field') {
    return { id, kind: 'field', radius: fieldRadius(config) };
  }
  const parts = MESH_BUILDERS[config.family](config, id, budget);
  const bounds = partBounds(Object.values(parts));
  let radius = 0;
  Object.values(parts).forEach(({ positions }) => {
    for (let i = 0; i < positions.length; i += 3) {
      radius = Math.max(
        radius,
        Math.hypot(positions[i], positions[i + 1], positions[i + 2])
      );
    }
  });
  return { bounds, id, kind: 'mesh', parts, radius };
}
