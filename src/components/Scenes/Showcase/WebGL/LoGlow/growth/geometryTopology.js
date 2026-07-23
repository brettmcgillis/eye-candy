/* eslint-disable no-use-before-define, import/prefer-default-export */
// Faithful port of ~/dev/examples/260308_DifferentialGrowth/src/core/geometryTopology.ts
// Builds per-vertex adjacency + the unique edge list the growth engine's
// relax/repulse/split passes iterate over.
export function buildTopology(geometry) {
  const position = geometry.getAttribute('position');
  const vertexCount = position.count;
  const adjacencySets = Array.from({ length: vertexCount }, () => new Set());
  const edgeSet = new Set();

  const { index } = geometry;
  if (index) {
    const indices = index.array;
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i];
      const b = indices[i + 1];
      const c = indices[i + 2];
      connect(a, b, adjacencySets, edgeSet);
      connect(b, c, adjacencySets, edgeSet);
      connect(c, a, adjacencySets, edgeSet);
    }
  } else {
    for (let i = 0; i < vertexCount; i += 3) {
      const a = i;
      const b = i + 1;
      const c = i + 2;
      if (c >= vertexCount) {
        break;
      }
      connect(a, b, adjacencySets, edgeSet);
      connect(b, c, adjacencySets, edgeSet);
      connect(c, a, adjacencySets, edgeSet);
    }
  }

  const edges = Array.from(edgeSet, (key) => {
    const [a, b] = key.split('_').map((v) => Number.parseInt(v, 10));
    return [a, b];
  });
  const adjacency = adjacencySets.map((set) => Array.from(set));
  return { adjacency, edges };
}

function connect(a, b, adjacencySets, edgeSet) {
  adjacencySets[a].add(b);
  adjacencySets[b].add(a);
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  edgeSet.add(`${low}_${high}`);
}
