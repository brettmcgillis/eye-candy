import {
  packStrands,
  resamplePolyline,
  smoothPolyline,
  walkFlowStrands,
  walkWanderStrands,
} from '@modules/gpuTubes';
import { mulberry32 } from '@utils/noise2d';

export default function authorStrands({
  flowCount,
  lift,
  pointsPerStrand,
  seed,
  surface,
  wanderCount,
  wanderSteps,
}) {
  const random = mulberry32(seed);
  const { graph, maxY, minY, reach } = surface;
  const { normals, positions } = graph;

  const flow = walkFlowStrands(graph, reach, {
    count: flowCount,
    endDistance: graph.edgeLength * 2,
    random,
  });
  const wander = walkWanderStrands(graph, {
    cellSize: (maxY - minY) / 40,
    count: wanderCount,
    random,
    steps: wanderSteps,
  });

  const toPoints = (path) =>
    path
      .filter((v) => Number.isFinite(reach[v]))
      .map((v) => [
        positions[v * 3] + normals[v * 3] * lift,
        positions[v * 3 + 1] + normals[v * 3 + 1] * lift,
        positions[v * 3 + 2] + normals[v * 3 + 2] * lift,
        reach[v],
        wander.crowding(v),
      ]);

  const strands = [];
  const add = (points) => {
    if (points.length >= 4) {
      strands.push(resamplePolyline(points, pointsPerStrand).points);
    }
  };

  flow.forEach(({ path }) => add(smoothPolyline(toPoints(path), 4)));
  wander.strands.forEach(({ path }) => add(smoothPolyline(toPoints(path), 4)));

  let maxReach = 0;
  let minReach = 0;
  strands.forEach((strand) =>
    strand.forEach((p) => {
      maxReach = Math.max(maxReach, p[3]);
      minReach = Math.min(minReach, p[3]);
    })
  );

  return { ...packStrands(strands, pointsPerStrand), maxReach, minReach };
}
