import { float, int, ivec3, uint, vec3 } from 'three/tsl';

// Marker values. SOLID is this port's addition: the reference handles walls in
// enforceBoundary only and has no interior obstacles, but a pour over geometry
// needs the pressure solve to know which cells it may not push into. It is also
// what lets the sparse-grid visualisation read obstacle cells straight off the
// solver rather than re-deriving them.
export const AIR = 0;
export const FLUID = 1;
export const SOLID = 2;

// Two grids, as in any MAC scheme: velocity components live on cell FACES, so
// that grid is one node bigger per axis than the cell-centred scalar grid that
// carries marker, pressure and divergence.
export default function createGridIndex(n) {
  const velDim = n + 1;

  return {
    cellCount: n * n * n,
    velCount: velDim * velDim * velDim,
    velDim,

    // x varies fastest, matching the reference's layout.
    cellCoord: (index) => {
      const i = int(index);
      return ivec3(i.mod(n), i.div(n).mod(n), i.div(n * n));
    },
    velCoord: (index) => {
      const i = int(index);
      return ivec3(
        i.mod(velDim),
        i.div(velDim).mod(velDim),
        i.div(velDim * velDim)
      );
    },

    cellIndex: (c) => {
      const cc = ivec3(
        c.x.clamp(0, n - 1),
        c.y.clamp(0, n - 1),
        c.z.clamp(0, n - 1)
      );
      return cc.x.add(cc.y.mul(n)).add(cc.z.mul(n * n));
    },
    velIndex: (c) => {
      const cc = ivec3(
        c.x.clamp(0, velDim - 1),
        c.y.clamp(0, velDim - 1),
        c.z.clamp(0, velDim - 1)
      );
      return cc.x.add(cc.y.mul(velDim)).add(cc.z.mul(velDim * velDim));
    },

    inCells: (c) =>
      c.x
        .greaterThanEqual(0)
        .and(c.x.lessThan(n))
        .and(c.y.greaterThanEqual(0))
        .and(c.y.lessThan(n))
        .and(c.z.greaterThanEqual(0))
        .and(c.z.lessThan(n)),
  };
}

// Separable tent kernel: the standard FLIP/PIC weight, giving trilinear
// interpolation in both directions of transfer.
export const tent = (v) =>
  v.x
    .abs()
    .oneMinus()
    .max(0)
    .mul(v.y.abs().oneMinus().max(0))
    .mul(v.z.abs().oneMinus().max(0));

export { float, uint, vec3 };
