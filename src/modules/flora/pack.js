import buildFrames, { octEncode } from './frames';
import { KIND } from './graph';
import { cross, normalize, randomUnit } from './vec';

const CUBE_EDGES = [
  [0, 1],
  [1, 3],
  [3, 2],
  [2, 0],
  [4, 5],
  [5, 7],
  [7, 6],
  [6, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

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

function pickOrnament(p, rng) {
  const weights = [p.dotAmount, p.heartAmount, p.petalAmount, p.cubeAmount];
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;

  if (total <= 0) {
    return -1;
  }

  for (let t = 0; t < weights.length; t += 1) {
    roll -= weights[t];

    if (roll < 0) {
      return t;
    }
  }

  return 0;
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

export default function pack(graph, p, rng, envelope, measures, terminals) {
  const { birth, crownT, flex, leafT, thickness, tips } = measures;
  const frames = buildFrames(graph, tips);
  const lobeValue = envelope.lobes.map((l) => l.accent + l.tint * 0.999);
  const picks = terminals
    .filter(() => rng() < p.ornamentDensity)
    .map((node) => ({ node, type: pickOrnament(p, rng) }))
    .filter((pick) => pick.type >= 0);
  const cubes = picks.filter((pick) => pick.type === 3);
  const segments = createSegments(graph.count - 1 + cubes.length * 12);
  const tangentOf = (i) => frames.tangent.subarray(i * 3, i * 3 + 3);
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

  cubes.forEach(({ node }) => {
    const size = p.ornamentSize * rng.range(0.9, 1.8);
    const u = randomUnit(rng);
    const v = normalize(cross(u, [0.3, 1, 0.2]));
    const w = cross(u, v);
    const c = graph.position(node);
    const axes = [u, v, w];
    const corner = (bits) =>
      [0, 1, 2].map((a) =>
        axes.reduce(
          (sum, axis, bit) =>
            sum + axis[a] * (Math.floor(bits / 2 ** bit) % 2 ? size : -size),
          c[a]
        )
      );
    const tone = toneOf(node);

    tone[1] = 2;

    CUBE_EDGES.forEach(([a, b], e) => {
      const o = k * 4;
      const t0 = Math.min(0.97, birth[node] + 0.01 + e * 0.002);
      const from = corner(a);
      const to = corner(b);
      const bit = Math.log2(Math.abs(b - a));
      const side = axes[(bit + 1) % 3];

      segments.start.set([...from, 0], o);
      segments.end.set([...to, 0], o);
      writeFrame(segments.frameStart, o, axes[bit], side);
      writeFrame(segments.frameEnd, o, axes[bit], side);
      segments.time.set([t0, t0 + 0.02, flex[node], flex[node]], o);
      segments.tone.set(tone, o);
      k += 1;
    });
  });

  const beadPicks = picks.filter((pick) => pick.type === 0);
  const cardPicks = picks.filter((pick) => pick.type === 1 || pick.type === 2);
  const beads = {
    count: beadPicks.length,
    info: new Float32Array(beadPicks.length * 4),
    position: new Float32Array(beadPicks.length * 4),
  };
  const cards = {
    count: cardPicks.length,
    dir: new Float32Array(cardPicks.length * 4),
    info: new Float32Array(cardPicks.length * 4),
    position: new Float32Array(cardPicks.length * 4),
  };

  beadPicks.forEach(({ node }, b) => {
    beads.position.set(
      [...graph.position(node), p.ornamentSize * rng.range(0.6, 1.3)],
      b * 4
    );
    beads.info.set([birth[node], lobeOf(node), rng(), flex[node]], b * 4);
  });

  cardPicks.forEach(({ node, type }, c) => {
    const t = tangentOf(node);

    cards.position.set(
      [...graph.position(node), p.ornamentSize * rng.range(0.7, 1.4)],
      c * 4
    );
    cards.dir.set([t[0], t[1], t[2], birth[node]], c * 4);
    cards.info.set([type - 1, lobeOf(node), rng(), flex[node]], c * 4);
  });

  return { beads, cards, segments };
}
