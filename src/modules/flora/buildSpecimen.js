import buildEnvelope from './envelope';
import growFibers from './fibers';
import { createGraph } from './graph';
import pack from './pack';
import { resolveParams } from './params';
import { createRng } from './rng';
import { growLeaves, growSideShoots, growStem } from './stem';
import measure from './timing';
import varyParams from './variation';

function rootFor(graph, p, stemNodes, lobe) {
  const lowest = Math.floor(p.crownBase * (stemNodes.length - 1));
  const floor = lobe.center[1] - lobe.radii[1] * 0.95;

  for (let s = stemNodes.length - 1; s > lowest; s -= 1) {
    if (graph.y[stemNodes[s]] <= floor) {
      return stemNodes[s];
    }
  }

  return stemNodes[Math.max(lowest, 0)];
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
  const stemTop = graph.position(stemNodes[stemNodes.length - 1]);
  const envelope = buildEnvelope(p, rng.fork('envelope'), stemTop);
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
        rootFor(graph, p, stemNodes, lobe),
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
    height: Math.max(...envelope.lobes.map((l) => l.center[1] + l.radii[1])),
    cards,
    segments,
    solids,
    stats: {
      millis: Date.now() - started,
      cards: cards.count,
      solids: Object.values(solids).reduce((sum, g) => sum + g.count, 0),
      segments: segments.count,
      terminals: terminals.length,
      truncated: budget.truncated,
    },
  };
}
