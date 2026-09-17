import { normalize } from './vec';

export const GOLDEN = Math.PI * (3 - Math.sqrt(5));
export const UP = [0, 1, 0];

export function polyline(graph, from, dir, length, segments, bend, kind) {
  let [x, y, z] = graph.position(from);
  let d = dir;
  let node = from;
  const step = length / segments;

  for (let i = 0; i < segments; i += 1) {
    d = normalize([d[0] + bend[0], d[1] + bend[1], d[2] + bend[2]]);
    x += d[0] * step;
    y += d[1] * step;
    z += d[2] * step;
    node = graph.add(x, y, z, node, kind);
  }

  return { direction: d, node };
}

export function outward(angle) {
  return [Math.cos(angle), 0, Math.sin(angle)];
}

export function directionAt(graph, node) {
  const parent = graph.parent[node];

  if (parent < 0) {
    return UP;
  }

  return normalize([
    graph.x[node] - graph.x[parent],
    graph.y[node] - graph.y[parent],
    graph.z[node] - graph.z[parent],
  ]);
}
