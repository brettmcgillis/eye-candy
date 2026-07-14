// Shared linear-index <-> (x,y,z) grid math, TSL node form — used by
// growthCompute.js, paletteNode.js, and VoxelField.jsx so all three agree on
// the same cell layout without triplicating the arithmetic.

export function cellIndexNode(x, y, z, k) {
  return x.add(k.mul(y.add(k.mul(z))));
}

export function decomposeIndexNode(index, k) {
  return {
    x: index.mod(k),
    y: index.div(k).mod(k),
    z: index.div(k.mul(k)),
  };
}
