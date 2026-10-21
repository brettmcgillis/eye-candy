// CPU mirror of createClothSimulation's two compute passes, over the same
// buildClothTopology output, so a pose can be settled headlessly (PrintShop)
// and come out as the cloth the GPU would have drawn. Storage is Float32 like
// the GPU buffers; the step order and every clamp follow the TSL exactly.

const CONTACT_SLOP = 1.0001;

const fract = (x) => x - Math.floor(x);
const tri = (x) => Math.abs(fract(x) - 0.5);

// three/src/nodes/math/TriNoise3D.js
export function triNoise3D(x, y, z, speed, time) {
  let px = x;
  let py = y;
  let pz = z;
  let bx = x;
  let by = y;
  let bz = z;
  let zz = 1.4;
  let rz = 0;
  const drift = time * 0.1 * speed;
  for (let i = 0; i <= 3; i += 1) {
    const dx = tri(bz * 2 + tri(by * 2));
    const dy = tri(bz * 2 + tri(bx * 2));
    const dz = tri(by * 2 + tri(bx * 2));
    px += dx + drift;
    py += dy + drift;
    pz += dz + drift;
    bx *= 1.8;
    by *= 1.8;
    bz *= 1.8;
    zz *= 1.5;
    px *= 1.2;
    py *= 1.2;
    pz *= 1.2;
    rz += tri(pz + tri(px + tri(py))) / zz;
    bx += 0.14;
    by += 0.14;
    bz += 0.14;
  }
  return rz;
}

export default function createClothCpu(topology, { alpha } = {}) {
  const {
    anchorOffsetArr,
    paramsArr,
    posArr,
    sCount,
    springList,
    springRestLen,
    springVtxIds,
    vCount,
  } = topology;
  const pos = new Float32Array(posArr);
  const vel = new Float32Array(vCount * 3);
  const springForce = new Float32Array(sCount * 3);
  const vertexAlpha = alpha ?? new Float32Array(vCount).fill(1);

  function step({
    anchors = [],
    collisionMargin = 0.02,
    colliders = [],
    dampening = 0.99,
    gravity = 0.00005,
    gravityDir = [0, -1, 0],
    maxVelocity = 0.01,
    stiffness = 0.2,
    time = 0,
    wind = 1,
    windAmplitude = 0.0001,
    windDir = [1, 0, 0],
    windFrequency = 1,
  }) {
    for (let s = 0; s < sCount; s += 1) {
      const a = springVtxIds[s * 2] * 3;
      const b = springVtxIds[s * 2 + 1] * 3;
      const dx = pos[b] - pos[a];
      const dy = pos[b + 1] - pos[a + 1];
      const dz = pos[b + 2] - pos[a + 2];
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 0.000001);
      const k = ((dist - springRestLen[s]) * stiffness * 0.5) / dist;
      springForce[s * 3] = dx * k;
      springForce[s * 3 + 1] = dy * k;
      springForce[s * 3 + 2] = dz * k;
    }

    for (let i = 0; i < vCount; i += 1) {
      const fixed = paramsArr[i * 3];
      const o = i * 3;
      if (fixed === 1) {
        // static pin
      } else if (fixed >= 2) {
        const target = anchors[fixed - 2] ?? [0, 0, 0];
        pos[o] = target[0] + anchorOffsetArr[o];
        pos[o + 1] = target[1] + anchorOffsetArr[o + 1];
        pos[o + 2] = target[2] + anchorOffsetArr[o + 2];
        vel[o] = 0;
        vel[o + 1] = 0;
        vel[o + 2] = 0;
      } else {
        let fx = vel[o] * dampening;
        let fy = vel[o + 1] * dampening;
        let fz = vel[o + 2] * dampening;
        const start = paramsArr[o + 2];
        const end = start + paramsArr[o + 1];
        for (let p = start; p < end; p += 1) {
          const sid = springList[p];
          const sign = springVtxIds[sid * 2] === i ? 1 : -1;
          fx += springForce[sid * 3] * sign;
          fy += springForce[sid * 3 + 1] * sign;
          fz += springForce[sid * 3 + 2] * sign;
        }
        fx += gravityDir[0] * gravity;
        fy += gravityDir[1] * gravity;
        fz += gravityDir[2] * gravity;

        const noise =
          (triNoise3D(pos[o], pos[o + 1], pos[o + 2], windFrequency, time) -
            0.2) *
          windAmplitude *
          wind;
        fx += windDir[0] * noise;
        fy += windDir[1] * noise;
        fz += windDir[2] * noise;

        const speed = Math.sqrt(fx * fx + fy * fy + fz * fz);
        if (speed > maxVelocity) {
          const scale = maxVelocity / speed;
          fx *= scale;
          fy *= scale;
          fz *= scale;
        }
        vel[o] = fx;
        vel[o + 1] = fy;
        vel[o + 2] = fz;

        let nx = pos[o] + fx;
        let ny = pos[o + 1] + fy;
        let nz = pos[o + 2] + fz;
        if (vertexAlpha[i] > 0.01) {
          colliders.forEach((collider) => {
            const tx = nx - collider.x;
            const ty = ny - collider.y;
            const tz = nz - collider.z;
            const dist = Math.max(
              Math.sqrt(tx * tx + ty * ty + tz * tz),
              0.000001
            );
            const radius = collider.radius + collisionMargin;
            if (radius - dist <= 0) return;
            const px = pos[o] - collider.x;
            const py = pos[o + 1] - collider.y;
            const pz = pos[o + 2] - collider.z;
            const restDist = Math.max(
              Math.sqrt(px * px + py * py + pz * pz),
              0.000001
            );
            const resting =
              restDist <= radius * CONTACT_SLOP && dist < radius * dampening;
            const ux = resting ? px / restDist : tx / dist;
            const uy = resting ? py / restDist : ty / dist;
            const uz = resting ? pz / restDist : tz / dist;
            if (resting) {
              const tn = tx * ux + ty * uy + tz * uz;
              const push =
                Math.sqrt(
                  Math.max(tn * tn - dist * dist + radius * radius, 0)
                ) - tn;
              nx += ux * push;
              ny += uy * push;
              nz += uz * push;
            } else {
              nx = collider.x + ux * radius;
              ny = collider.y + uy * radius;
              nz = collider.z + uz * radius;
            }
            // The TSL reads its pre-collision `force` copy here but subtracts
            // from the stored velocity, so stacked colliders accumulate.
            const vDotN = fx * ux + fy * uy + fz * uz;
            if (vDotN < 0) {
              vel[o] -= ux * vDotN;
              vel[o + 1] -= uy * vDotN;
              vel[o + 2] -= uz * vDotN;
            }
          });
        }
        pos[o] = nx;
        pos[o + 1] = ny;
        pos[o + 2] = nz;
      }
    }
  }

  return { pos, step, vel };
}
