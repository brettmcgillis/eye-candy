import buildEnvelope from './envelope';
import growFibers from './fibers';
import {
  growBracts,
  growLeaves,
  growSideShoots,
  growStemLeaves,
  growTendrils,
} from './foliage';
import { createGraph } from './graph';
import rollHabit from './habit';
import pack from './pack';
import rollPalette from './palette';
import { resolveParams } from './params';
import { createRng } from './rng';
import { growHeads, growMainStem } from './stem';
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

// The dense core of the crown, not its outermost wisps: a bouquet spaces
// flowers by this, so the thin edges interleave the way cut stems really do.
function crownRadius(envelope) {
  const [cx, cy, cz] = envelope.centroid;
  const reach = envelope.points
    .map((pt) => Math.hypot(pt.x - cx, pt.y - cy, pt.z - cz))
    .sort((a, b) => a - b);

  return reach.length ? reach[Math.floor(reach.length * 0.75)] : 1;
}

export default function buildSpecimen(input) {
  const base = resolveParams(input);
  const rng = createRng(base.seed);
  const { habit, p } = rollHabit(
    varyParams(base, rng.fork('variation')),
    rng.fork('habit')
  );
  const started = Date.now();
  const graph = createGraph(1 << 18); // eslint-disable-line no-bitwise
  const stemRng = rng.fork('stem');
  const mainNodes = growMainStem(graph, p, stemRng, habit);
  const heads = growHeads(graph, p, stemRng, habit, mainNodes);
  const stem = stemSampler(graph, mainNodes);

  growLeaves(graph, p, rng.fork('leaves'), mainNodes);
  growStemLeaves(graph, p, rng.fork('stemLeaves'), mainNodes, habit.stemLeaves);
  growTendrils(graph, p, rng.fork('tendrils'), mainNodes, habit.tendrils);

  if (habit.bracts) {
    const bractRng = rng.fork('bracts');

    heads.forEach((head) => growBracts(graph, p, bractRng, head));
  }

  const shootTips = growSideShoots(graph, p, rng.fork('shoots'), mainNodes);
  const envelope = buildEnvelope(p, rng.fork('envelope'), {
    graph,
    habit,
    heads,
    stem,
  });
  const fiberRng = rng.fork('fibers');
  const terminals = [];
  const budget = { truncated: false };

  envelope.lobes.forEach((lobe, index) => {
    const points = envelope.points.filter((pt) => pt.lobe === index);

    if (points.length) {
      growFibers(graph, p, fiberRng, points, lobe, index, terminals, budget);
    }
  });

  shootTips.forEach((tip) => {
    growFibers(
      graph,
      p,
      fiberRng,
      umbelPoints(graph, p, fiberRng, tip),
      { root: tip, style: 'straight', tip: null },
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

  return {
    cards,
    center: envelope.centroid,
    crownRadius: crownRadius(envelope),
    height: envelope.height,
    palette: rollPalette(p, rng.fork('palette')),
    segments,
    solids,
    stats: {
      cards: cards.count,
      forms: envelope.lobes
        .map((l) => `${l.name}/${l.style}${l.tip ? `+${l.tip}` : ''}`)
        .join(' '),
      habit: `${habit.branching} ${habit.posture} ${habit.stature} ${habit.vigor}${habit.bracts ? ' bracts' : ''}${habit.stemLeaves ? ` leaves${habit.stemLeaves}` : ''}${habit.tendrils ? ` tendrils${habit.tendrils}` : ''}`,
      heads: heads.length,
      millis: Date.now() - started,
      segments: segments.count,
      solids: Object.values(solids).reduce((sum, g) => sum + g.count, 0),
      terminals: terminals.length,
      truncated: budget.truncated,
    },
  };
}
