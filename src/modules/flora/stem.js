import { KIND } from './graph';
import { GOLDEN, directionAt, outward, polyline } from './polyline';
import { cross, normalize, perpendicular } from './vec';

function neckShare(posture) {
  if (posture === 'nodding') {
    return 0.78;
  }

  return posture === 'weeping' ? 0.7 : 1;
}

export function growMainStem(graph, p, rng, habit) {
  const height =
    p.stemHeight * (habit.branching === 'fork' ? rng.range(0.45, 0.7) : 1);
  const shaft = neckShare(habit.posture);
  const phaseX = rng() * Math.PI * 2;
  const phaseZ = rng() * Math.PI * 2;
  const leanAngle = rng() * Math.PI * 2;
  const leanAmount =
    habit.posture === 'leaning' ? rng.range(0.25, 0.5) : rng.signed() * 0.12;
  const offsetAt = (t, phase, amp) =>
    amp *
    (Math.sin(t * p.stemWaves * Math.PI * 2 + phase) - Math.sin(phase)) *
    t;
  const count = Math.max(4, Math.round(p.stemSegments * shaft));
  const nodes = [graph.add(0, 0, 0, -1, KIND.stem)];

  for (let i = 1; i <= count; i += 1) {
    const t = i / count;
    const lean = leanAmount * t * t * height * shaft;

    nodes.push(
      graph.add(
        offsetAt(t, phaseX, p.stemCurve) + Math.cos(leanAngle) * lean,
        t * height * shaft,
        offsetAt(t, phaseZ, p.stemCurve * 0.4) + Math.sin(leanAngle) * lean,
        nodes[i - 1],
        KIND.stem
      )
    );
  }

  if (shaft < 1) {
    const out = outward(leanAngle);
    const droop = habit.posture === 'nodding' ? 0.11 : 0.07;
    const neck = height * (1 - shaft) * 1.7;
    const segments = 14;
    let node = nodes[nodes.length - 1];
    let dir = directionAt(graph, node);

    for (let i = 0; i < segments; i += 1) {
      const step = polyline(
        graph,
        node,
        dir,
        neck / segments,
        1,
        [out[0] * droop, -droop * 0.8, out[2] * droop],
        KIND.stem
      );

      node = step.node;
      dir = step.direction;
      nodes.push(node);
    }
  }

  return nodes;
}

function arm(graph, from, dir, length, curl) {
  return polyline(
    graph,
    from,
    dir,
    length,
    16,
    [-dir[0] * curl * 0.3, curl, -dir[2] * curl * 0.3],
    KIND.stem
  );
}

// How far, and which way, the trunk has leaned by the time it reaches its
// top. Branches are placed around the stem by azimuth alone, so without this
// a leaning stem grows heads back over its own base — `fork` and `umbellate`
// already blend the stem's heading in, `candelabra`, `alternate` and the side
// shoots did not.
export function stemDrift(graph, nodes) {
  const base = graph.position(nodes[0]);
  const top = graph.position(nodes[nodes.length - 1]);
  const dx = top[0] - base[0];
  const dz = top[2] - base[2];
  const span = Math.hypot(dx, dz);

  if (span < 1e-3) {
    return [0, 0, 0];
  }

  const rise = Math.max(top[1] - base[1], 1e-3);
  // Full bias by the time the stem leans ~27°, which is where a branch
  // growing back over the base starts to read as wrong.
  const strength = Math.min(1, (span / rise) * 2);

  return [(dx / span) * strength, 0, (dz / span) * strength];
}

export function growHeads(graph, p, rng, habit, mainNodes) {
  const top = mainNodes[mainNodes.length - 1];
  const topDir = directionAt(graph, top);
  const main = { direction: topDir, node: top, size: 1 };
  const nodeAtHeight = (fraction) =>
    mainNodes[Math.round(fraction * (mainNodes.length - 1))];
  const base = rng() * Math.PI * 2;
  const drift = stemDrift(graph, mainNodes);
  const heads = [];

  if (habit.branching === 'fork') {
    const arms = Math.floor(rng.range(2, 4));

    for (let i = 0; i < arms; i += 1) {
      const out = outward(base + (i * Math.PI * 2) / arms + rng.signed() * 0.4);
      const dir = normalize([
        topDir[0] + out[0] * rng.range(0.5, 1.1),
        topDir[1],
        topDir[2] + out[2] * rng.range(0.5, 1.1),
      ]);
      const end = arm(
        graph,
        top,
        dir,
        p.stemHeight * rng.range(0.3, 0.55),
        0.02
      );

      heads.push({
        ...end,
        size: rng.range(0.65, 0.9),
      });
    }

    return heads;
  }

  if (habit.branching === 'umbellate') {
    const rays = Math.floor(rng.range(5, 10));
    const cone = rng.range(0.35, 1);
    const u = perpendicular(topDir);
    const v = cross(topDir, u);

    for (let i = 0; i < rays; i += 1) {
      const a = base + i * GOLDEN * 2.4;
      const tilt = cone * rng.range(0.6, 1);
      const dir = normalize(
        [0, 1, 2].map(
          (k) =>
            topDir[k] * Math.cos(tilt) +
            (u[k] * Math.cos(a) + v[k] * Math.sin(a)) * Math.sin(tilt)
        )
      );
      const end = polyline(
        graph,
        top,
        dir,
        p.crownRadius * rng.range(0.9, 1.5),
        10,
        [0, 0.012, 0],
        KIND.stem
      );

      heads.push({
        ...end,
        size: rng.range(0.28, 0.42),
      });
    }

    return heads;
  }

  heads.push(main);

  if (habit.branching === 'candelabra') {
    const arms = Math.floor(rng.range(2, 5));

    for (let i = 0; i < arms; i += 1) {
      const out = outward(base + i * GOLDEN);
      const from = nodeAtHeight(rng.range(0.35, 0.8));
      const dir = normalize([
        out[0] * 0.95 + drift[0] * 1.2,
        0.35,
        out[2] * 0.95 + drift[2] * 1.2,
      ]);
      const end = arm(
        graph,
        from,
        dir,
        p.stemHeight * rng.range(0.3, 0.5),
        0.035
      );

      heads.push({
        ...end,
        size: rng.range(0.45, 0.7),
      });
    }
  }

  if (habit.branching === 'alternate') {
    const count = Math.floor(rng.range(3, 7));

    for (let i = 0; i < count; i += 1) {
      const h = 0.3 + (0.55 * (i + rng())) / count;
      const out = outward(base + i * GOLDEN);
      const dir = normalize([
        out[0] + drift[0] * 1.2,
        0.8,
        out[2] + drift[2] * 1.2,
      ]);
      const end = arm(graph, nodeAtHeight(h), dir, rng.range(0.5, 1.3), 0.02);

      heads.push({
        ...end,
        size: 0.45 - 0.23 * ((h - 0.3) / 0.55),
      });
    }
  }

  return heads;
}
