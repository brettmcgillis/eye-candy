import buildEnvelope from './envelope';
import growFibers from './fibers';
import { createGraph } from './graph';
import pack from './pack';
import { resolveParams } from './params';
import { createRng } from './rng';
import { growLeaves, growSideShoots, growStem } from './stem';
import measure from './timing';
import varyParams from './variation';

function stemSampler(graph, stemNodes) {
  const last = stemNodes.length - 1;
  const nodeAt = (fraction) =>
    stemNodes[Math.round(Math.min(1, Math.max(0, fraction)) * last)];

  return { nodeAt, positionAt: (fraction) => graph.position(nodeAt(fraction)) };
}

function umbelPoints(graph, p, rng, tip) {
  const [x, y, z] = graph.position(tip);
  const radius = p.crownRadius * 0.12;

  return Array.from({ length: Math.round(p.umbelSize * 8) }, () => {
    const t = rng() * Math.PI * 2;
    const h = rng.range(0.2, 1);

    return {
      wisp: false,
      x: x + Math.cos(t) * radius * h,
      y: y + radius * (1.2 - h * 0.6),
      z: z + Math.sin(t) * radius * h,
    };
  });
}

export default function buildSpecimen(input) {
  const base = resolveParams(input);
  const rng = createRng(base.seed);
  const p = varyParams(base, rng.fork('variation'));
  const started = Date.now();
  const graph = createGraph(1 << 18); // eslint-disable-line no-bitwise

  const stemNodes = growStem(graph, p, rng.fork('stem'));

  growLeaves(graph, p, rng.fork('leaves'), stemNodes);

  const shootTips = growSideShoots(graph, p, rng.fork('shoots'), stemNodes);
  const stem = stemSampler(graph, stemNodes);
  const envelope = buildEnvelope(p, rng.fork('envelope'), stem.positionAt);
  const fiberRng = rng.fork('fibers');
  const terminals = [];
  const budget = { truncated: false };

  envelope.lobes.forEach((lobe, index) => {
    const points = envelope.points.filter((pt) => pt.lobe === index);

    if (points.length) {
      growFibers(
        graph,
        p,
        fiberRng,
        points,
        stem.nodeAt(lobe.anchor),
        index,
        terminals,
        budget
      );
    }
  });

  shootTips.forEach((tip) => {
    growFibers(
      graph,
      p,
      fiberRng,
      umbelPoints(graph, p, fiberRng, tip),
      tip,
      0,
      terminals,
      budget
    );
  });

  const measures = measure(graph, p);
  const { cards, segments, solids } = pack(
    graph,
    p,
    rng.fork('ornaments'),
    envelope,
    measures,
    terminals,
    budget
  );

  const paletteRng = rng.fork('palette');
  const shift = (spread) => paletteRng.signed() * spread * p.paletteVariation;

  return {
    center: envelope.centroid,
    palette: {
      hue: shift(0.12),
      light: 1 + shift(0.22),
      saturation: 1 + shift(0.35),
    },
    height: envelope.height,
    cards,
    segments,
    solids,
    stats: {
      millis: Date.now() - started,
      cards: cards.count,
      solids: Object.values(solids).reduce((sum, g) => sum + g.count, 0),
      segments: segments.count,
      forms: envelope.lobes.map((l) => l.name).join(' + '),
      terminals: terminals.length,
      truncated: budget.truncated,
    },
  };
}
