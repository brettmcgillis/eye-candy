/* eslint-disable no-bitwise, no-param-reassign */
import cubesTables from './cubesTables';

// Port of ~/dev/examples/clouds's src/cubes.worker.ts (itself adapted from
// three.js's own MarchingCubes.js) — extracts a smooth triangle mesh from a
// packed voxel density field. Runs on the main thread rather than a Web
// Worker (kept simple for a first pass; revisit if generation causes jank at
// higher resolutions). colors/uvs are dropped: the reference generates them
// too but ships with enableColors/enableUvs both false, so they never reach
// its own renderer either.
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// One box-blur pass (6-neighbor averaging) — softens the sphere-splat
// inflation's hard edges into the puffy, rounded look before meshing.
function blurField(field, size, intensity) {
  const size2 = size * size;
  const snapshot = field.slice();

  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let z = 0; z < size; z += 1) {
        const index = size2 * z + size * y + x;
        let value = snapshot[index];
        let contributors = 1;

        for (let dx = -1; dx <= 1; dx += 2) {
          const nx = dx + x;
          if (nx < 0 || nx >= size) {
            // eslint-disable-next-line no-continue
            continue;
          }
          for (let dy = -1; dy <= 1; dy += 2) {
            const ny = dy + y;
            if (ny < 0 || ny >= size) {
              // eslint-disable-next-line no-continue
              continue;
            }
            for (let dz = -1; dz <= 1; dz += 2) {
              const nz = dz + z;
              if (nz < 0 || nz >= size) {
                // eslint-disable-next-line no-continue
                continue;
              }
              const neighborValue = snapshot[size2 * nz + size * ny + nx];
              contributors += 1;
              value += (intensity * (neighborValue - value)) / contributors;
            }
          }
        }

        field[index] = value;
      }
    }
  }
}

export default function extractCloudMesh({
  field,
  size,
  isolation,
  blurIntensity,
}) {
  const size2 = size * size;
  const halfSize = size / 2;
  const delta = 2 / size;
  const yDelta = size;
  const zDelta = size2;

  blurField(field, size, blurIntensity);

  const normalCache = new Float32Array(size * size * size * 3);
  const vertexList = new Float32Array(12 * 3);
  const normalList = new Float32Array(12 * 3);

  const maxCount = size * size * size * 3;
  const positionArray = new Float32Array(maxCount * 3);
  const normalArray = new Float32Array(maxCount * 3);
  let count = 0;

  function computeNormal(q) {
    const q3 = q * 3;
    if (normalCache[q3] === 0) {
      normalCache[q3 + 0] = field[q - 1] - field[q + 1];
      normalCache[q3 + 1] = field[q - yDelta] - field[q + yDelta];
      normalCache[q3 + 2] = field[q - zDelta] - field[q + zDelta];
    }
  }

  function vertexInterpolateX(q, offset, x, y, z, valp1, valp2) {
    const mu = (isolation - valp1) / (valp2 - valp1);
    vertexList[offset + 0] = x + mu * delta;
    vertexList[offset + 1] = y;
    vertexList[offset + 2] = z;
    normalList[offset + 0] = lerp(normalCache[q + 0], normalCache[q + 3], mu);
    normalList[offset + 1] = lerp(normalCache[q + 1], normalCache[q + 4], mu);
    normalList[offset + 2] = lerp(normalCache[q + 2], normalCache[q + 5], mu);
  }

  function vertexInterpolateY(q, offset, x, y, z, valp1, valp2) {
    const mu = (isolation - valp1) / (valp2 - valp1);
    vertexList[offset + 0] = x;
    vertexList[offset + 1] = y + mu * delta;
    vertexList[offset + 2] = z;
    const q2 = q + yDelta * 3;
    normalList[offset + 0] = lerp(normalCache[q + 0], normalCache[q2 + 0], mu);
    normalList[offset + 1] = lerp(normalCache[q + 1], normalCache[q2 + 1], mu);
    normalList[offset + 2] = lerp(normalCache[q + 2], normalCache[q2 + 2], mu);
  }

  function vertexInterpolateZ(q, offset, x, y, z, valp1, valp2) {
    const mu = (isolation - valp1) / (valp2 - valp1);
    vertexList[offset + 0] = x;
    vertexList[offset + 1] = y;
    vertexList[offset + 2] = z + mu * delta;
    const q2 = q + zDelta * 3;
    normalList[offset + 0] = lerp(normalCache[q + 0], normalCache[q2 + 0], mu);
    normalList[offset + 1] = lerp(normalCache[q + 1], normalCache[q2 + 1], mu);
    normalList[offset + 2] = lerp(normalCache[q + 2], normalCache[q2 + 2], mu);
  }

  function posnormtriv(o1, o2, o3) {
    const c = count * 3;
    for (let i = 0; i < 3; i += 1) {
      positionArray[c + i] = vertexList[o1 + i];
      positionArray[c + 3 + i] = vertexList[o2 + i];
      positionArray[c + 6 + i] = vertexList[o3 + i];
      normalArray[c + i] = normalList[o1 + i];
      normalArray[c + 3 + i] = normalList[o2 + i];
      normalArray[c + 6 + i] = normalList[o3 + i];
    }
    count += 3;
  }

  function polygonize(fx, fy, fz, q) {
    const q1 = q + 1;
    const qy = q + yDelta;
    const qz = q + zDelta;
    const q1y = q1 + yDelta;
    const q1z = q1 + zDelta;
    const qyz = q + yDelta + zDelta;
    const q1yz = q1 + yDelta + zDelta;

    const field0 = field[q];
    const field1 = field[q1];
    const field2 = field[qy];
    const field3 = field[q1y];
    const field4 = field[qz];
    const field5 = field[q1z];
    const field6 = field[qyz];
    const field7 = field[q1yz];

    let cubeIndex = 0;
    if (field0 < isolation) cubeIndex |= 1;
    if (field1 < isolation) cubeIndex |= 2;
    if (field2 < isolation) cubeIndex |= 8;
    if (field3 < isolation) cubeIndex |= 4;
    if (field4 < isolation) cubeIndex |= 16;
    if (field5 < isolation) cubeIndex |= 32;
    if (field6 < isolation) cubeIndex |= 128;
    if (field7 < isolation) cubeIndex |= 64;

    const bits = cubesTables.edgeTable[cubeIndex];
    if (bits === 0) {
      return;
    }

    const fx2 = fx + delta;
    const fy2 = fy + delta;
    const fz2 = fz + delta;

    if (bits & 1) {
      computeNormal(q);
      computeNormal(q1);
      vertexInterpolateX(q * 3, 0, fx, fy, fz, field0, field1);
    }
    if (bits & 2) {
      computeNormal(q1);
      computeNormal(q1y);
      vertexInterpolateY(q1 * 3, 3, fx2, fy, fz, field1, field3);
    }
    if (bits & 4) {
      computeNormal(qy);
      computeNormal(q1y);
      vertexInterpolateX(qy * 3, 6, fx, fy2, fz, field2, field3);
    }
    if (bits & 8) {
      computeNormal(q);
      computeNormal(qy);
      vertexInterpolateY(q * 3, 9, fx, fy, fz, field0, field2);
    }
    if (bits & 16) {
      computeNormal(qz);
      computeNormal(q1z);
      vertexInterpolateX(qz * 3, 12, fx, fy, fz2, field4, field5);
    }
    if (bits & 32) {
      computeNormal(q1z);
      computeNormal(q1yz);
      vertexInterpolateY(q1z * 3, 15, fx2, fy, fz2, field5, field7);
    }
    if (bits & 64) {
      computeNormal(qyz);
      computeNormal(q1yz);
      vertexInterpolateX(qyz * 3, 18, fx, fy2, fz2, field6, field7);
    }
    if (bits & 128) {
      computeNormal(qz);
      computeNormal(qyz);
      vertexInterpolateY(qz * 3, 21, fx, fy, fz2, field4, field6);
    }
    if (bits & 256) {
      computeNormal(q);
      computeNormal(qz);
      vertexInterpolateZ(q * 3, 24, fx, fy, fz, field0, field4);
    }
    if (bits & 512) {
      computeNormal(q1);
      computeNormal(q1z);
      vertexInterpolateZ(q1 * 3, 27, fx2, fy, fz, field1, field5);
    }
    if (bits & 1024) {
      computeNormal(q1y);
      computeNormal(q1yz);
      vertexInterpolateZ(q1y * 3, 30, fx2, fy2, fz, field3, field7);
    }
    if (bits & 2048) {
      computeNormal(qy);
      computeNormal(qyz);
      vertexInterpolateZ(qy * 3, 33, fx, fy2, fz, field2, field6);
    }

    const triOffset = cubeIndex << 4;
    let i = 0;
    while (cubesTables.triTable[triOffset + i] !== -1) {
      posnormtriv(
        3 * cubesTables.triTable[triOffset + i],
        3 * cubesTables.triTable[triOffset + i + 1],
        3 * cubesTables.triTable[triOffset + i + 2]
      );
      i += 3;
    }
  }

  // Starting at -1 (instead of 0) closes up the bottom of the mesh — the
  // reference's own trick for a watertight base.
  for (let z = -1; z < size - 1; z += 1) {
    const zOffset = size2 * z;
    const fz = (z - halfSize) / halfSize;
    for (let y = -1; y < size - 1; y += 1) {
      const yOffset = zOffset + size * y;
      const fy = (y - halfSize) / halfSize;
      for (let x = -1; x < size - 1; x += 1) {
        const fx = (x - halfSize) / halfSize;
        polygonize(fx, fy, fz, yOffset + x);
      }
    }
  }

  return {
    positions: positionArray.slice(0, count * 3),
    normals: normalArray.slice(0, count * 3),
    count,
  };
}
