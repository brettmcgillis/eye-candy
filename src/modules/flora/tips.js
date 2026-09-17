import { KIND } from './graph';
import { normalize, perpendicular, randomUnit, rotateAround } from './vec';

function tipDirection(graph, node) {
  const parent = graph.parent[node];

  return normalize([
    graph.x[node] - graph.x[parent],
    graph.y[node] - graph.y[parent],
    graph.z[node] - graph.z[parent],
  ]);
}

function strand(graph, from, directions, lengths, cluster, gen) {
  let node = from;

  directions.forEach((dir, i) => {
    node = graph.add(
      graph.x[node] + dir[0] * lengths[i],
      graph.y[node] + dir[1] * lengths[i],
      graph.z[node] + dir[2] * lengths[i],
      node,
      KIND.spray,
      cluster,
      gen
    );
  });
}

export default function addTip(graph, p, rng, node, tip, cluster, gen) {
  const dir = tipDirection(graph, node);
  const size = p.crownRadius * 0.045 * rng.range(0.7, 1.4);

  if (tip === 'starburst') {
    const spokes = Math.floor(rng.range(4, 8));

    for (let i = 0; i < spokes; i += 1) {
      const r = randomUnit(rng);

      strand(
        graph,
        node,
        [normalize(dir.map((v, k) => v * 0.6 + r[k]))],
        [size],
        cluster,
        gen
      );
    }
  } else if (tip === 'hook') {
    const axis = perpendicular(dir);
    const directions = [];
    let d = dir;

    for (let i = 0; i < 6; i += 1) {
      d = rotateAround(d, axis, 0.9);
      directions.push(d);
    }

    strand(
      graph,
      node,
      directions,
      directions.map((_, i) => size * 0.45 * (1 - i * 0.12)),
      cluster,
      gen
    );
  } else {
    const strands = Math.floor(rng.range(3, 6));

    for (let i = 0; i < strands; i += 1) {
      const hang = normalize([
        dir[0] * 0.2 + rng.signed() * 0.35,
        -1,
        dir[2] * 0.2 + rng.signed() * 0.35,
      ]);

      strand(
        graph,
        node,
        [hang, hang, hang],
        [size * 0.5, size * 0.5, size * 0.5],
        cluster,
        gen
      );
    }
  }
}
