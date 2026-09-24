import { buildSurfaceGraph, geodesicField } from '@modules/gpuTubes';
import voxelizeSolid from '@utils/voxelizeSolid';

// The skull as a walkable surface: welded graph, reach (distance along the
// surface from its lowest band, where growth starts) and which vertices face
// outward rather than into the cranial cavity.
export default function buildSkullSurface({
  baseBand = 0.06,
  bridgeRadius,
  index,
  position,
}) {
  const graph = buildSurfaceGraph({ bridgeRadius, index, position });
  const { count, normals, positions } = graph;

  let minY = Infinity;
  let maxY = -Infinity;
  for (let v = 0; v < count; v += 1) {
    minY = Math.min(minY, positions[v * 3 + 1]);
    maxY = Math.max(maxY, positions[v * 3 + 1]);
  }
  const cutoff = minY + (maxY - minY) * baseBand;
  const sources = [];
  for (let v = 0; v < count; v += 1) {
    if (positions[v * 3 + 1] <= cutoff) sources.push(v);
  }
  const reach = geodesicField(graph, sources);

  const voxelSize = (maxY - minY) / 110;
  const { cavity, dims, origin } = voxelizeSolid({
    cavityClosing: 8,
    closing: 2,
    index,
    position,
    voxelSize,
  });
  const [nx, ny, nz] = dims;
  const inCavity = (x, y, z) => {
    const i = Math.floor((x - origin[0]) / voxelSize);
    const j = Math.floor((y - origin[1]) / voxelSize);
    const k = Math.floor((z - origin[2]) / voxelSize);
    if (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) return false;
    return cavity[i + j * nx + k * nx * ny] === 1;
  };
  const outer = new Uint8Array(count);
  for (let v = 0; v < count; v += 1) {
    let inside = !Number.isFinite(reach[v]);
    [1.5, 3].forEach((s) => {
      inside =
        inside ||
        inCavity(
          positions[v * 3] + normals[v * 3] * s * voxelSize,
          positions[v * 3 + 1] + normals[v * 3 + 1] * s * voxelSize,
          positions[v * 3 + 2] + normals[v * 3 + 2] * s * voxelSize
        );
    });
    outer[v] = inside ? 0 : 1;
  }

  return { graph, maxY, minY, outer, reach };
}
