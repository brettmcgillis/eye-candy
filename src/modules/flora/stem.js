import { KIND } from './graph';
import { normalize } from './vec';

function polyline(graph, from, dir, lengthTotal, segments, bend, kind, gen) {
  let [x, y, z] = graph.position(from);
  let d = dir;
  let parent = from;
  const step = lengthTotal / segments;

  for (let i = 0; i < segments; i += 1) {
    d = normalize([d[0] + bend[0], d[1] + bend[1], d[2] + bend[2]]);
    x += d[0] * step;
    y += d[1] * step;
    z += d[2] * step;
    parent = graph.add(x, y, z, parent, kind, 0, gen);
  }

  return parent;
}

export function growStem(graph, p, rng) {
  const phaseX = rng() * Math.PI * 2;
  const phaseZ = rng() * Math.PI * 2;
  const lean = rng.signed() * 0.12;
  const offsetAt = (t, phase, amp) =>
    amp *
    (Math.sin(t * p.stemWaves * Math.PI * 2 + phase) - Math.sin(phase)) *
    t;

  const nodes = [graph.add(0, 0, 0, -1, KIND.stem)];

  for (let i = 1; i <= p.stemSegments; i += 1) {
    const t = i / p.stemSegments;

    nodes.push(
      graph.add(
        offsetAt(t, phaseX, p.stemCurve) + lean * t * t * p.stemHeight * 0.3,
        t * p.stemHeight,
        offsetAt(t, phaseZ, p.stemCurve * 0.4),
        nodes[i - 1],
        KIND.stem
      )
    );
  }

  return nodes;
}

export function growLeaves(graph, p, rng, stemNodes) {
  for (let i = 0; i < p.leafBlades; i += 1) {
    const t = rng.range(0.04, Math.max(0.05, p.leafHeight));
    const from = stemNodes[Math.round(t * (stemNodes.length - 1))];
    const angle = rng() * Math.PI * 2;
    const out = [Math.cos(angle), 0, Math.sin(angle) * 0.5];
    const dir = normalize([out[0] * 0.2, 1, out[2] * 0.2]);
    const bend = [out[0] * 0.025, -0.004, out[2] * 0.025];
    const length = p.leafLength * rng.range(0.7, 1.15);

    polyline(graph, from, dir, length, 14, bend, KIND.leaf, 0);
  }
}

export function growSideShoots(graph, p, rng, stemNodes) {
  const tips = [];

  for (let i = 0; i < p.sideShoots; i += 1) {
    const t = rng.range(0.35, 0.75);
    const from = stemNodes[Math.round(t * (stemNodes.length - 1))];
    const angle = rng() * Math.PI * 2;
    const out = [Math.cos(angle), 0, Math.sin(angle) * 0.4];
    const dir = normalize([out[0] * 0.9, 0.7, out[2] * 0.9]);
    const bend = [-out[0] * 0.012, 0.018, -out[2] * 0.012];
    const length = p.sideShootLength * rng.range(0.6, 1.1);

    tips.push(polyline(graph, from, dir, length, 24, bend, KIND.shoot, 0));
  }

  return tips;
}
