import composeForms from './forms';
import { alignFromUp, randomUnit } from './vec';

const HEAD_ALIGNMENT = 0.85;

function createWarp(p, rng) {
  const waves = Array.from({ length: 3 }, () => ({
    direction: randomUnit(rng),
    k: randomUnit(rng).map((v) => (v * rng.range(0.6, 1.6)) / p.crownRadius),
    phase: rng() * Math.PI * 2,
  }));
  const amplitude = (p.warp * p.crownRadius * 0.35) / waves.length;

  return (point) => {
    const out = [...point];

    waves.forEach(({ direction, k, phase }) => {
      const s =
        Math.sin(point[0] * k[0] + point[1] * k[1] + point[2] * k[2] + phase) *
        amplitude;

      out[0] += direction[0] * s;
      out[1] += direction[1] * s;
      out[2] += direction[2] * s;
    });

    return out;
  };
}

function createLean(p, rng, pivot) {
  const heading = rng() * Math.PI * 2;
  const axis = [Math.cos(heading), 0, Math.sin(heading)];
  const angle = p.asymmetry * rng.range(0.15, 0.7) * (rng() < 0.5 ? -1 : 1);
  const turn = (v) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const d = axis[0] * v[0] + axis[1] * v[1] + axis[2] * v[2];
    const crossed = [
      axis[1] * v[2] - axis[2] * v[1],
      axis[2] * v[0] - axis[0] * v[2],
      axis[0] * v[1] - axis[1] * v[0],
    ];

    return [0, 1, 2].map(
      (i) => v[i] * c + crossed[i] * s + axis[i] * d * (1 - c)
    );
  };

  return (point) => {
    const turned = turn([
      point[0] - pivot[0],
      point[1] - pivot[1],
      point[2] - pivot[2],
    ]);

    return [0, 1, 2].map((i) => pivot[i] + turned[i]);
  };
}

function placeComponent(component, p, stem, graph) {
  if (component.side) {
    const attach = stem.positionAt(component.anchor);
    const out = component.size * 0.85;

    return {
      center: [
        attach[0] + Math.cos(component.sideDirection) * out,
        attach[1] + component.size * 0.3,
        attach[2] + Math.sin(component.sideDirection) * out,
      ],
      orient: (v) => v,
      root: stem.nodeAt(component.anchor),
    };
  }

  const { head } = component;
  const orient = alignFromUp(head.direction, HEAD_ALIGNMENT);
  const local = orient([
    component.offset[0],
    p.crownRadius * head.size * p.crownLift * component.lift +
      component.offset[1],
    component.offset[2],
  ]);
  const origin = graph.position(head.node);

  return {
    center: [0, 1, 2].map((i) => origin[i] + local[i]),
    orient,
    root: head.node,
  };
}

// Crown against stem, measured rather than predicted. The width a crown ends
// up with is the product of form sizes, offsets, head count, branching and
// posture — every attempt to estimate it from the parameters left a tail of
// plants whose crown was as wide as the whole plant was tall. The envelope is
// already built here, so it can simply be measured and scaled about the stem
// top, which keeps the crown attached where it grows.
const MIN_RATIO = 0.12;

function reachOf(points, centroid) {
  const [cx, cy, cz] = centroid;
  const spread = points
    .map((pt) => Math.hypot(pt.x - cx, pt.y - cy, pt.z - cz))
    .sort((a, b) => a - b);

  return spread.length ? spread[Math.floor(spread.length * 0.75)] : 0;
}

// Each crown is judged on its own and scaled about the head it grows from.
// Scaling everything about the main stem top dragged the crowns of forked and
// umbel plants down under their own involucres, and judging the whole plant's
// spread counted the gaps between heads, which no crown size can fix.
function fitToStem(points, lobes, p, pivot, graph) {
  const stem = Math.max(pivot[1], 1e-3);
  const groups = new Map();

  points.forEach((pt) => {
    const { root } = lobes[pt.lobe];
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(pt);
  });

  const scales = new Map();
  groups.forEach((group, root) => {
    const centroid = group.reduce(
      (acc, pt) => [
        acc[0] + pt.x / group.length,
        acc[1] + pt.y / group.length,
        acc[2] + pt.z / group.length,
      ],
      [0, 0, 0]
    );
    const reach = reachOf(group, centroid);
    if (reach <= 1e-6) return;

    const ratio = reach / stem;
    const target = Math.min(Math.max(ratio, MIN_RATIO), p.crownRatio);
    if (Math.abs(target - ratio) < 1e-3) return;

    const scale = target / ratio;
    const origin = graph.position(root);
    scales.set(root, { origin, scale });
    group.forEach((pt) => {
      /* eslint-disable no-param-reassign */
      pt.x = origin[0] + (pt.x - origin[0]) * scale;
      pt.y = origin[1] + (pt.y - origin[1]) * scale;
      pt.z = origin[2] + (pt.z - origin[2]) * scale;
      /* eslint-enable no-param-reassign */
    });
  });

  lobes.forEach((lobe) => {
    const fit = scales.get(lobe.root);
    if (!fit) return;
    const { origin, scale } = fit;
    /* eslint-disable no-param-reassign */
    lobe.center = lobe.center.map(
      (v, i) => origin[i] + (v - origin[i]) * scale
    );
    lobe.radii = lobe.radii.map((v) => v * scale);
    /* eslint-enable no-param-reassign */
  });
}

export default function buildEnvelope(p, rng, { graph, habit, heads, stem }) {
  const pivot = stem.positionAt(1);
  const warp = createWarp(p, rng);
  const lean = createLean(p, rng, pivot);
  const components = heads.flatMap((head, index) =>
    composeForms(p, rng, {
      allowSpray: index === 0,
      posture: habit.posture,
      size: head.size,
    }).map((component) => ({ ...component, head }))
  );
  const totalMass = components.reduce((sum, c) => sum + c.mass, 0);
  const points = [];
  const structure = p.crownStructure ?? 0;
  const lobes = components.map((component, index) => {
    const { center, orient, root } = placeComponent(component, p, stem, graph);
    const count = Math.round((p.tips * component.mass) / totalMass);
    // Tips are dealt round-robin into the form's units, so each unit carries
    // the same share and the fiber clustering sees them as real sub-branches.
    const units = Math.max(
      1,
      Math.round((p.crownUnits * count) / Math.max(1, p.tips))
    );
    const spread = 0.5 / Math.cbrt(units);

    for (let i = 0; i < count; i += 1) {
      const wisp = rng() < p.wispChance;
      const stretch = wisp ? 1 + p.wispReach * rng.range(0.4, 1) : 1;
      const drawn = component.sample();
      const placedLocal =
        structure > 0 && component.unit
          ? (() => {
              const seat = component.unit(i % units, units);

              return drawn.map(
                (v, k) => v + (seat[k] + v * spread - v) * structure
              );
            })()
          : drawn;
      const local = orient(placedLocal.map((v) => v * stretch));
      const placed = lean(warp([0, 1, 2].map((k) => center[k] + local[k])));

      points.push({
        lobe: index,
        wisp,
        x: placed[0],
        y: placed[1],
        z: placed[2],
      });
    }

    return {
      accent: component.accent,
      center: lean(center),
      density: component.density,
      name: component.name,
      radii: component.radii,
      root,
      style: component.style,
      tint: component.tint,
      tip: component.tip,
    };
  });

  fitToStem(points, lobes, p, pivot, graph);

  const sum = points.reduce(
    (acc, pt) => [acc[0] + pt.x, acc[1] + pt.y, acc[2] + pt.z],
    [0, 0, 0]
  );
  const n = Math.max(points.length, 1);

  return {
    centroid: sum.map((v) => v / n),
    height: points.reduce((top, pt) => Math.max(top, pt.y), pivot[1]),
    lobes,
    points,
  };
}
