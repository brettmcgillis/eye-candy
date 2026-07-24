/* eslint-disable no-param-reassign */
// Builds the fixed set of unit directions a flow strand's heading snaps to —
// this snapping is what gives the field its blocky/angular look instead of a
// smoothly curving trail. Directions are the surface samples of a cube
// subdivided by `resolution` (low resolution = few large facets, high
// resolution -> approaches a smooth sphere), not a true icosphere.
export function buildDiscreteDirections(resolution) {
  const subdivisions = Math.max(1, Math.round(resolution));
  const step = 2 / subdivisions;
  const directions = [];

  for (let z = 0; z <= subdivisions; z += 1) {
    for (let y = 0; y <= subdivisions; y += 1) {
      for (let x = 0; x <= subdivisions; x += 1) {
        const isSurface =
          x === 0 ||
          x === subdivisions ||
          y === 0 ||
          y === subdivisions ||
          z === 0 ||
          z === subdivisions;
        if (!isSurface) {
          // eslint-disable-next-line no-continue
          continue;
        }

        const vx = -1 + x * step;
        const vy = -1 + y * step;
        const vz = -1 + z * step;
        const length = Math.sqrt(vx * vx + vy * vy + vz * vz);
        if (length <= 1e-8) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const invLength = 1 / length;
        directions.push(vx * invLength, vy * invLength, vz * invLength);
      }
    }
  }

  return Float32Array.from(directions);
}

// Snaps a raw unit heading (nx, ny, nz) to whichever direction in `directions`
// has the highest dot product, writing the result into `out`. Falls back to
// the raw heading if `directions` is empty (resolution collapsed to nothing).
export function findNearestDiscreteDirection(directions, nx, ny, nz, out) {
  if (directions.length < 3) {
    out[0] = nx;
    out[1] = ny;
    out[2] = nz;
    return out;
  }

  let bestDot = -Infinity;
  let best = 0;
  for (let i = 0; i < directions.length; i += 3) {
    const dot =
      nx * directions[i] + ny * directions[i + 1] + nz * directions[i + 2];
    if (dot > bestDot) {
      bestDot = dot;
      best = i;
    }
  }

  out[0] = directions[best];
  out[1] = directions[best + 1];
  out[2] = directions[best + 2];
  return out;
}
