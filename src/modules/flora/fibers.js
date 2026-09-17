/* eslint-disable no-param-reassign */
import { KIND } from './graph';
import addTip from './tips';
import { cross, normalize, perpendicular, randomUnit } from './vec';

function centroidOf(points, ids) {
  let x = 0;
  let y = 0;
  let z = 0;

  ids.forEach((id) => {
    x += points[id].x;
    y += points[id].y;
    z += points[id].z;
  });

  return [x / ids.length, y / ids.length, z / ids.length];
}

function partition(points, ids, rng, balance) {
  let best = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const axis = randomUnit(rng);
    const projected = ids
      .map((id) => ({
        id,
        t:
          points[id].x * axis[0] +
          points[id].y * axis[1] +
          points[id].z * axis[2],
      }))
      .sort((a, b) => a.t - b.t);
    const spread = projected[projected.length - 1].t - projected[0].t;

    if (!best || spread > best.spread) {
      best = { projected, spread };
    }
  }

  const cut = Math.round(ids.length * (0.5 + rng.signed() * balance * 0.5));
  const at = Math.min(ids.length - 1, Math.max(1, cut));

  return [
    best.projected.slice(0, at).map((e) => e.id),
    best.projected.slice(at).map((e) => e.id),
  ];
}

const STYLES = {
  curly: { bend: 0.6, coil: 0.09 },
  drooping: { sag: 6 },
  fuzzy: { bend: 2.5, splitRatio: 0.8, umbel: 3 },
  kinked: { bend: 0.4, kink: 0.07 },
  straight: {},
  wiry: { bend: 0.5, sheaf: 0.4, splitRatio: 1.3, umbel: -99 },
};

function styled(p, style) {
  const s = STYLES[style] ?? STYLES.straight;

  return {
    ...p,
    fiberBend: p.fiberBend * (s.bend ?? 1),
    fiberSag: p.fiberSag * (s.sag ?? 1),
    sheaf: p.sheaf * (s.sheaf ?? 1),
    splitRatio: Math.min(1, p.splitRatio * (s.splitRatio ?? 1)),
    umbelSize: Math.max(1, p.umbelSize + (s.umbel ?? 0)),
  };
}

export function fiber(graph, p, rng, from, target, kind, cluster, gen, style) {
  const shape = STYLES[style] ?? STYLES.straight;
  const a = graph.position(from);
  const d = [target[0] - a[0], target[1] - a[1], target[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]);
  const wiggly = shape.coil || shape.kink;
  const steps = Math.max(
    wiggly ? 8 : 1,
    Math.min(wiggly ? 24 : 16, Math.round(len / p.fiberStep))
  );
  const unit = normalize(d);
  const side = perpendicular(unit);
  const lift = cross(unit, side);
  const twist = randomUnit(rng);
  const bend = len * p.fiberBend * rng.gauss();
  const sag = len * p.fiberSag * rng();
  const offset = [
    side[0] * bend + twist[0] * bend * 0.4,
    side[1] * bend + twist[1] * bend * 0.4 - sag,
    side[2] * bend + twist[2] * bend * 0.4,
  ];
  const turns = rng.range(1.5, 3.2);
  const phase = rng() * Math.PI * 2;
  let node = from;

  for (let s = 1; s <= steps; s += 1) {
    const t = s / steps;
    const arc = Math.sin(Math.PI * t);
    const spin = Math.PI * 2 * turns * t + phase;
    const coil = (shape.coil ?? 0) * len * arc;
    const kink = (shape.kink ?? 0) * len * arc * (s % 2 ? 1 : -1);
    const extra = [0, 1, 2].map(
      (k) =>
        (side[k] * Math.cos(spin) + lift[k] * Math.sin(spin)) * coil +
        lift[k] * kink
    );

    node = graph.add(
      a[0] + d[0] * t + offset[0] * arc + extra[0],
      a[1] + d[1] * t + offset[1] * arc + extra[1],
      a[2] + d[2] * t + offset[2] * arc + extra[2],
      node,
      kind,
      cluster,
      gen
    );
  }

  return node;
}

export default function growFibers(
  graph,
  base,
  rng,
  points,
  lobe,
  cluster,
  terminals,
  budget
) {
  const p = styled(base, lobe.style);
  const stack = [{ from: lobe.root, gen: 0, ids: points.map((_, i) => i) }];
  const logTotal = Math.log(Math.max(points.length, 2));

  while (stack.length) {
    const { from, gen, ids } = stack.pop();
    const origin = graph.position(from);

    if (graph.count >= p.maxSegments) {
      budget.truncated = true;
    } else if (ids.length <= p.umbelSize) {
      ids.forEach((id) => {
        const pt = points[id];
        const kind = pt.wisp ? KIND.wisp : KIND.spray;
        const end = fiber(
          graph,
          p,
          rng,
          from,
          [pt.x, pt.y, pt.z],
          kind,
          cluster,
          gen + 1,
          lobe.style
        );

        terminals.push(end);

        if (lobe.tip && rng() < 0.45 && graph.count < p.maxSegments) {
          addTip(graph, p, rng, end, lobe.tip, cluster, gen + 2);
        }
      });
    } else {
      const c = centroidOf(points, ids);
      const size = Math.log(ids.length) / logTotal;
      const reach = p.splitRatio * (1 - size * p.sheaf) * rng.range(0.7, 1.3);
      const target = [
        origin[0] + (c[0] - origin[0]) * reach,
        origin[1] + (c[1] - origin[1]) * reach,
        origin[2] + (c[2] - origin[2]) * reach,
      ];
      const kind = gen < 2 ? KIND.scaffold : KIND.spray;
      const split = fiber(
        graph,
        p,
        rng,
        from,
        target,
        kind,
        cluster,
        gen,
        lobe.style
      );

      partition(points, ids, rng, p.splitBalance).forEach((half) => {
        stack.push({ from: split, gen: gen + 1, ids: half });
      });
    }
  }
}
