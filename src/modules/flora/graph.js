export const KIND = {
  stem: 0,
  leaf: 1,
  scaffold: 2,
  spray: 3,
  wisp: 4,
  shoot: 5,
  cube: 6,
};

const FIELDS = [
  ['x', Float32Array],
  ['y', Float32Array],
  ['z', Float32Array],
  ['parent', Int32Array],
  ['kind', Uint8Array],
  ['cluster', Float32Array],
  ['gen', Uint8Array],
  ['children', Uint16Array],
];

export function createGraph(initialCapacity = 4096) {
  const graph = { count: 0, capacity: 0 };

  const grow = (capacity) => {
    FIELDS.forEach(([name, Type]) => {
      const next = new Type(capacity);

      if (graph[name]) {
        next.set(graph[name].subarray(0, graph.count));
      }

      graph[name] = next;
    });
    graph.capacity = capacity;
  };

  grow(initialCapacity);

  graph.add = (x, y, z, parent, kind, cluster = 0, gen = 0) => {
    if (graph.count === graph.capacity) {
      grow(graph.capacity * 2);
    }

    const i = graph.count;

    graph.x[i] = x;
    graph.y[i] = y;
    graph.z[i] = z;
    graph.parent[i] = parent;
    graph.kind[i] = kind;
    graph.cluster[i] = cluster;
    graph.gen[i] = gen;
    graph.children[i] = 0;

    if (parent >= 0 && graph.children[parent] < 65535) {
      graph.children[parent] += 1;
    }

    graph.count += 1;

    return i;
  };

  graph.position = (i) => [graph.x[i], graph.y[i], graph.z[i]];

  return graph;
}
