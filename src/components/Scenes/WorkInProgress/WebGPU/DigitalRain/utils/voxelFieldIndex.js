/* eslint-disable no-param-reassign */
// Port of ~/dev/examples/clouds's src/voxelField.ts — packed x+y*size+z*size²
// indexing into a flat Float32Array voxel field.
export function setValue(field, size, x, y, z, value) {
  if (x >= size || x < 0 || y >= size || y < 0 || z >= size || z < 0) {
    return;
  }
  field[x + y * size + z * size * size] = value;
}

export function getValue(field, size, x, y, z) {
  return field[x + y * size + z * size * size];
}
