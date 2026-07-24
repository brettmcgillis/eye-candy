/* eslint-disable no-param-reassign */
// Spatial-hash bucketing + alignment/divergence steering shared by
// angularFlowFieldEngine.js's per-step integration. Split out to keep the
// engine file readable in one pass (docs/scene-conventions.md #4).

export function buildSpatialBuckets(heads, emitterCount, cellSize) {
  const buckets = new Map();
  const invCell = 1 / Math.max(cellSize, 1e-6);
  for (let i = 0; i < emitterCount; i += 1) {
    const read = i * 3;
    const cx = Math.floor(heads[read] * invCell);
    const cy = Math.floor(heads[read + 1] * invCell);
    const cz = Math.floor(heads[read + 2] * invCell);
    const key = `${cx}|${cy}|${cz}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(i);
    } else {
      buckets.set(key, [i]);
    }
  }
  return buckets;
}

// Steers emitter `emitterIndex` toward (alignment) or away from (divergence —
// same math, negated by the caller's strength sign) the average heading of
// neighbors within `radius`. Writes the resulting unit force into `out`.
export function computeAlignmentForce(
  emitterIndex,
  heads,
  velocities,
  buckets,
  radius,
  out
) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;

  const radiusSq = radius * radius;
  const invCell = 1 / Math.max(radius, 1e-6);
  const read = emitterIndex * 3;
  const px = heads[read];
  const py = heads[read + 1];
  const pz = heads[read + 2];
  const cx = Math.floor(px * invCell);
  const cy = Math.floor(py * invCell);
  const cz = Math.floor(pz * invCell);

  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  let neighborCount = 0;

  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const key = `${cx + dx}|${cy + dy}|${cz + dz}`;
        const bucket = buckets.get(key);
        if (!bucket) {
          // eslint-disable-next-line no-continue
          continue;
        }
        for (let bi = 0; bi < bucket.length; bi += 1) {
          const neighborIndex = bucket[bi];
          if (neighborIndex === emitterIndex) {
            // eslint-disable-next-line no-continue
            continue;
          }
          const nRead = neighborIndex * 3;
          const dxp = heads[nRead] - px;
          const dyp = heads[nRead + 1] - py;
          const dzp = heads[nRead + 2] - pz;
          const distSq = dxp * dxp + dyp * dyp + dzp * dzp;
          if (distSq > radiusSq) {
            // eslint-disable-next-line no-continue
            continue;
          }

          const nvx = velocities[nRead];
          const nvy = velocities[nRead + 1];
          const nvz = velocities[nRead + 2];
          const nLenSq = nvx * nvx + nvy * nvy + nvz * nvz;
          if (nLenSq <= 1e-10) {
            // eslint-disable-next-line no-continue
            continue;
          }

          const nInv = 1 / Math.sqrt(nLenSq);
          sumX += nvx * nInv;
          sumY += nvy * nInv;
          sumZ += nvz * nInv;
          neighborCount += 1;
        }
      }
    }
  }

  if (neighborCount <= 0) {
    return;
  }

  const sumLenSq = sumX * sumX + sumY * sumY + sumZ * sumZ;
  if (sumLenSq <= 1e-10) {
    return;
  }
  const sumInv = 1 / Math.sqrt(sumLenSq);
  const avgX = sumX * sumInv;
  const avgY = sumY * sumInv;
  const avgZ = sumZ * sumInv;

  const svx = velocities[read];
  const svy = velocities[read + 1];
  const svz = velocities[read + 2];
  const selfLenSq = svx * svx + svy * svy + svz * svz;
  const selfInv = selfLenSq > 1e-10 ? 1 / Math.sqrt(selfLenSq) : 0;
  const selfX = svx * selfInv;
  const selfY = svy * selfInv;
  const selfZ = svz * selfInv;

  let fx = avgX - selfX;
  let fy = avgY - selfY;
  let fz = avgZ - selfZ;
  const forceLenSq = fx * fx + fy * fy + fz * fz;
  if (forceLenSq <= 1e-10) {
    return;
  }

  const forceInv = 1 / Math.sqrt(forceLenSq);
  fx *= forceInv;
  fy *= forceInv;
  fz *= forceInv;
  out[0] = fx;
  out[1] = fy;
  out[2] = fz;
}
