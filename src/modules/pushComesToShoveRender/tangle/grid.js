import { floor, ivec3, uint } from 'three/tsl';

export const FORCE_SCALE = 4096;

export function cellCoordOf(p, u, layout) {
  const [dx, dy, dz] = layout.gridDims;
  const c = ivec3(floor(p.sub(u.gridOrigin).div(u.cellSize)));
  return ivec3(
    c.x.clamp(0, dx - 1),
    c.y.clamp(0, dy - 1),
    c.z.clamp(0, dz - 1)
  );
}

export function cellIdFromCoord(c, layout) {
  const [dx, dy] = layout.gridDims;
  return uint(c.x.add(c.y.mul(dx)).add(c.z.mul(dx * dy)));
}

export function cellIdOf(p, u, layout) {
  return cellIdFromCoord(cellCoordOf(p, u, layout), layout);
}
