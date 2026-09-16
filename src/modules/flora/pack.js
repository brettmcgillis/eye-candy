/* eslint-disable no-param-reassign */
import buildFrames, { octEncode } from './frames';
import { KIND } from './graph';
import { SOLID_SHAPES, WIRE_MODELS } from './polyhedra';
import { cross, normalize, perpendicular, randomUnit } from './vec';

export const CARD_SHAPES = ['heart', 'petal'];

const STEM_CODE = { [KIND.stem]: 2, [KIND.leaf]: 2, [KIND.shoot]: 1 };

function tipness(kind, leafProgress, thickness) {
  if (kind === KIND.leaf) {
    return Math.min(1, leafProgress);
  }

  return kind >= KIND.scaffold ? 1 - thickness : 0;
}

function occlusionAt(lobes, x, y, z) {
  let inside = 0;

  lobes.forEach((l) => {
    const dx = (x - l.center[0]) / l.radii[0];
    const dy = (y - l.center[1]) / l.radii[1];
    const dz = (z - l.center[2]) / l.radii[2];
    const depth = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy + dz * dz));

    inside = Math.max(inside, depth);
  });

  return 1 - inside ** 1.2 * 0.8;
}

function pickShape(p, rng) {
  const weights = [...SOLID_SHAPES, ...CARD_SHAPES].map((shape) => [
    shape,
    Math.max(p[`${shape}Amount`] ?? 0, 0),
  ]);
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;

  if (total <= 0) {
    return null;
  }

  return (weights.find(([, weight]) => {
    roll -= weight;

    return roll < 0;
  }) ?? weights[0])[0];
}

function randomBasis(rng) {
  const u = randomUnit(rng);
  const v = perpendicular(u);

  return [u, v, cross(u, v)];
}

function createSegments(count) {
  return {
    count,
    end: new Float32Array(count * 4),
    frameEnd: new Float32Array(count * 4),
    frameStart: new Float32Array(count * 4),
    start: new Float32Array(count * 4),
    time: new Float32Array(count * 4),
    tone: new Float32Array(count * 4),
  };
}

function writeFrame(out, offset, t, n) {
  octEncode(t[0], t[1], t[2], out, offset);
  octEncode(n[0], n[1], n[2], out, offset + 2);
}

function wirePlacement(pick, rng) {
  const model = WIRE_MODELS[pick.shape];

  if (!model.planar) {
    const axes = randomBasis(rng);

    return (v) =>
      [0, 1, 2].map((a) =>
        axes.reduce(
          (sum, axis, i) => sum + axis[a] * v[i] * pick.size,
          pick.center[a]
        )
      );
  }

  const up = pick.tangent;
  const side = perpendicular(up);

  return (v) =>
    [0, 1, 2].map(
      (a) =>
        pick.center[a] +
        side[a] * v[0] * pick.size +
        up[a] * (v[1] + 1) * pick.size
    );
}

function writeWireframe(segments, k, pick, tone, birth, flex) {
  const { edges, vertices } = WIRE_MODELS[pick.shape];

  edges.forEach(([a, b], e) => {
    const o = (k + e) * 4;
    const from = pick.place(vertices[a]);
    const to = pick.place(vertices[b]);
    const dir = normalize([to[0] - from[0], to[1] - from[1], to[2] - from[2]]);
    const t0 = Math.min(0.97, birth + 0.01 + e * 0.002);

    segments.start.set([...from, 0], o);
    segments.end.set([...to, 0], o);
    writeFrame(segments.frameStart, o, dir, perpendicular(dir));
    writeFrame(segments.frameEnd, o, dir, perpendicular(dir));
    segments.time.set([t0, t0 + 0.02, flex, flex], o);
    segments.tone.set(tone, o);
  });

  return k + edges.length;
}

export default function pack(
  graph,
  p,
  rng,
  envelope,
  measures,
  terminals,
  budget
) {
  const { birth, crownT, flex, leafT, thickness, tips } = measures;
  const frames = buildFrames(graph, tips);
  const lobeValue = envelope.lobes.map((l) => l.accent + l.tint * 0.999);
  const picks = terminals
    .filter(() => rng() < p.ornamentDensity)
    .map((node) => ({ node, shape: pickShape(p, rng) }))
    .filter((pick) => pick.shape)
    .map((pick) => ({
      ...pick,
      wire: rng() < (p[`${pick.shape}Wire`] ?? 0),
    }));
  const tangentOf = (i) => frames.tangent.subarray(i * 3, i * 3 + 3);
  let wireEdges = 0;
  const affordable = (shape) => {
    const edges = WIRE_MODELS[shape].edges.length;

    if (graph.count + wireEdges + edges > p.maxSegments) {
      budget.truncated = true;

      return false;
    }

    wireEdges += edges;

    return true;
  };

  picks.forEach((pick) => {
    if (pick.wire && !affordable(pick.shape)) {
      pick.wire = false;
    }
  });

  const wires = picks
    .filter((pick) => pick.wire)
    .map((pick) => {
      const { planar } = WIRE_MODELS[pick.shape];
      const placed = {
        ...pick,
        center: graph.position(pick.node),
        size:
          p.ornamentSize * (planar ? rng.range(0.7, 1.4) : rng.range(1.1, 2.2)),
        tangent: tangentOf(pick.node),
      };

      return { ...placed, place: wirePlacement(placed, rng) };
    });
  const segments = createSegments(graph.count - 1 + wireEdges);
  const normalOf = (i) => frames.normal.subarray(i * 3, i * 3 + 3);
  const lobeOf = (i) =>
    graph.kind[i] <= KIND.leaf ? 0 : (lobeValue[graph.cluster[i]] ?? 0);
  const toneOf = (i) => [
    crownT[i],
    tipness(graph.kind[i], leafT[i], thickness[i]),
    (STEM_CODE[graph.kind[i]] ?? 0) +
      occlusionAt(envelope.lobes, graph.x[i], graph.y[i], graph.z[i]) * 0.999,
    lobeOf(i),
  ];
  let k = 0;

  for (let i = 1; i < graph.count; i += 1) {
    const parent = graph.parent[i];
    const o = k * 4;

    segments.start.set(
      [graph.x[parent], graph.y[parent], graph.z[parent], thickness[parent]],
      o
    );
    segments.end.set([graph.x[i], graph.y[i], graph.z[i], thickness[i]], o);
    writeFrame(segments.frameStart, o, tangentOf(parent), normalOf(parent));
    writeFrame(segments.frameEnd, o, tangentOf(i), normalOf(i));
    segments.time.set([birth[parent], birth[i], flex[parent], flex[i]], o);
    segments.tone.set(toneOf(i), o);
    k += 1;
  }

  wires.forEach((pick) => {
    const tone = toneOf(pick.node);

    tone[1] = 2;
    k = writeWireframe(
      segments,
      k,
      pick,
      tone,
      birth[pick.node],
      flex[pick.node]
    );
  });

  const solids = Object.fromEntries(
    SOLID_SHAPES.map((shape) => {
      const group = picks.filter((pick) => !pick.wire && pick.shape === shape);

      return [
        shape,
        {
          count: group.length,
          info: new Float32Array(group.length * 4),
          position: new Float32Array(group.length * 4),
          shape,
        },
      ];
    })
  );

  SOLID_SHAPES.forEach((shape) => {
    const group = solids[shape];

    picks
      .filter((pick) => !pick.wire && pick.shape === shape)
      .forEach(({ node }, index) => {
        group.position.set(
          [...graph.position(node), p.ornamentSize * rng.range(0.7, 1.5)],
          index * 4
        );
        group.info.set(
          [birth[node], lobeOf(node), rng(), flex[node]],
          index * 4
        );
      });
  });

  const cardPicks = picks.filter(
    (pick) => !pick.wire && CARD_SHAPES.includes(pick.shape)
  );
  const cards = {
    count: cardPicks.length,
    dir: new Float32Array(cardPicks.length * 4),
    info: new Float32Array(cardPicks.length * 4),
    position: new Float32Array(cardPicks.length * 4),
  };

  cardPicks.forEach(({ node, shape }, c) => {
    const t = tangentOf(node);

    cards.position.set(
      [...graph.position(node), p.ornamentSize * rng.range(0.7, 1.4)],
      c * 4
    );
    cards.dir.set([t[0], t[1], t[2], birth[node]], c * 4);
    cards.info.set(
      [CARD_SHAPES.indexOf(shape), lobeOf(node), rng(), flex[node]],
      c * 4
    );
  });

  return { cards, segments, solids };
}
