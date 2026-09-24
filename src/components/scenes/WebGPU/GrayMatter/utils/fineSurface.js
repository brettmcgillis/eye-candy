import { buildSurfaceGraph } from '@modules/gpuTubes';

import subdivide from './subdivide';

// The skull graph subdivided to an even vertex spacing under `maxEdge`, so the
// maze can be traced along its crest everywhere, not just where the mesh was
// already dense. Reach for each new
// vertex is the mean of its edge's ends; it faces outward only if both do.
export default function buildFineSurface({ graph, outer, reach }, maxEdge) {
  const fine = subdivide(graph, maxEdge);
  const fineGraph = buildSurfaceGraph({
    index: fine.index,
    position: fine.position,
    weldTolerance: null,
  });
  const fineReach = new Float64Array(fineGraph.count);
  const fineOuter = new Uint8Array(fineGraph.count);
  for (let v = 0; v < fineGraph.count; v += 1) {
    if (v < graph.count) {
      fineReach[v] = reach[v];
      fineOuter[v] = outer[v];
    } else {
      const k = (v - graph.count) * 2;
      const a = fine.parents[k];
      const b = fine.parents[k + 1];
      fineReach[v] = (fineReach[a] + fineReach[b]) / 2;
      fineOuter[v] = fineOuter[a] && fineOuter[b] ? 1 : 0;
    }
  }
  return { graph: fineGraph, outer: fineOuter, reach: fineReach };
}
