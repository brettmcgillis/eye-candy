import { KIND } from './graph';
import { GOLDEN, outward, polyline } from './polyline';
import { cross, normalize, perpendicular, rotateAround } from './vec';

export function growLeaves(graph, p, rng, mainNodes) {
  for (let i = 0; i < p.leafBlades; i += 1) {
    const t = rng.range(0.04, Math.max(0.05, p.leafHeight));
    const from = mainNodes[Math.round(t * (mainNodes.length - 1))];
    const out = outward(rng() * Math.PI * 2);
    const dir = normalize([out[0] * 0.2, 1, out[2] * 0.1]);
    const bend = [out[0] * 0.025, -0.004, out[2] * 0.0125];

    polyline(
      graph,
      from,
      dir,
      p.leafLength * rng.range(0.7, 1.15),
      14,
      bend,
      KIND.leaf
    );
  }
}

export function growStemLeaves(graph, p, rng, mainNodes, count) {
  const base = rng() * Math.PI * 2;

  for (let i = 0; i < count; i += 1) {
    const from =
      mainNodes[Math.round(rng.range(0.2, 0.8) * (mainNodes.length - 1))];
    const out = outward(base + i * GOLDEN);

    polyline(
      graph,
      from,
      normalize([out[0], 0.6, out[2]]),
      p.leafLength * rng.range(0.35, 0.7),
      10,
      [out[0] * 0.02, -0.03, out[2] * 0.02],
      KIND.leaf
    );
  }
}

export function growBracts(graph, p, rng, head) {
  const count = Math.floor(rng.range(5, 13));
  const back = head.direction.map((v) => -v);
  const u = perpendicular(head.direction);
  const v = cross(head.direction, u);
  const reach = p.crownRadius * head.size * rng.range(0.25, 0.55);
  const lean = rng.range(0.1, 0.5);

  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 + rng.signed() * 0.2;
    const radial = [0, 1, 2].map(
      (k) => u[k] * Math.cos(a) + v[k] * Math.sin(a)
    );
    const dir = normalize(radial.map((r, k) => r + back[k] * lean));

    polyline(
      graph,
      head.node,
      dir,
      reach * rng.range(0.8, 1.2),
      6,
      back.map((b) => b * 0.04),
      KIND.leaf
    );
  }
}

export function growTendrils(graph, p, rng, mainNodes, count) {
  for (let i = 0; i < count; i += 1) {
    let node =
      mainNodes[Math.round(rng.range(0.25, 0.7) * (mainNodes.length - 1))];
    let dir = normalize(
      [...outward(rng() * Math.PI * 2)].map((c, k) => (k === 1 ? 0.3 : c))
    );
    const axis = normalize([rng.signed(), 0.4, rng.signed()]);
    const length = rng.range(0.6, 1.4);
    const turn = rng.range(0.6, 1.1) * (rng() < 0.5 ? -1 : 1);

    for (let s = 0; s < 18; s += 1) {
      const step = (length / 18) * (1 - s / 26);

      dir = rotateAround(dir, axis, turn * (0.3 + s / 18));
      node = graph.add(
        graph.x[node] + dir[0] * step,
        graph.y[node] + dir[1] * step,
        graph.z[node] + dir[2] * step,
        node,
        KIND.shoot
      );
    }
  }
}

export function growSideShoots(graph, p, rng, mainNodes) {
  const tips = [];

  for (let i = 0; i < p.sideShoots; i += 1) {
    const t = rng.range(0.35, 0.75);
    const from = mainNodes[Math.round(t * (mainNodes.length - 1))];
    const out = outward(rng() * Math.PI * 2);
    const dir = normalize([out[0] * 0.9, 0.7, out[2] * 0.36]);
    const bend = [-out[0] * 0.012, 0.018, -out[2] * 0.0048];

    tips.push(
      polyline(
        graph,
        from,
        dir,
        p.sideShootLength * rng.range(0.6, 1.1),
        24,
        bend,
        KIND.shoot
      ).node
    );
  }

  return tips;
}
