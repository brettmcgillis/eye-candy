import createMinHeap from './minHeap';

// Dijkstra over the surface graph from every source at once. The result is a
// distance along the surface, so its gradient points "away from the sources"
// around every bend a world-space direction cannot follow.
export default function geodesicField(graph, sources) {
  const { count, neighbors, offsets, positions } = graph;
  const distance = new Float64Array(count).fill(Infinity);
  const heap = createMinHeap(count);
  const top = [0, 0];

  sources.forEach((v) => {
    distance[v] = 0;
    heap.push(0, v);
  });

  while (heap.size) {
    const [d, v] = heap.pop(top);
    if (d <= distance[v]) {
      for (let k = offsets[v]; k < offsets[v + 1]; k += 1) {
        const n = neighbors[k];
        const nd =
          d +
          Math.hypot(
            positions[v * 3] - positions[n * 3],
            positions[v * 3 + 1] - positions[n * 3 + 1],
            positions[v * 3 + 2] - positions[n * 3 + 2]
          );
        if (nd < distance[n]) {
          distance[n] = nd;
          heap.push(nd, n);
        }
      }
    }
  }

  return distance;
}

// Local maxima of a field over the graph — for a field grown from a base,
// these are the extremities (fingertips, the crown), found without markers.
export function fieldMaxima(graph, field) {
  const { count, neighbors, offsets } = graph;
  const maxima = [];
  for (let v = 0; v < count; v += 1) {
    if (Number.isFinite(field[v])) {
      let top = true;
      for (let k = offsets[v]; k < offsets[v + 1] && top; k += 1) {
        if (field[neighbors[k]] > field[v]) top = false;
      }
      if (top) maxima.push(v);
    }
  }
  return maxima;
}
