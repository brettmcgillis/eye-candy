import { Matrix4, Vector3 } from 'three';

const BINS = 64;

function principalAxes(positions) {
  const count = positions.length / 3;
  const mean = [0, 0, 0];
  for (let i = 0; i < count; i += 1)
    for (let k = 0; k < 3; k += 1) mean[k] += positions[i * 3 + k] / count;

  const a = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < count; i += 1) {
    const d = [0, 1, 2].map((k) => positions[i * 3 + k] - mean[k]);
    for (let r = 0; r < 3; r += 1)
      for (let c = 0; c < 3; c += 1) a[r][c] += d[r] * d[c];
  }

  const v = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  for (let sweep = 0; sweep < 32; sweep += 1) {
    for (let p = 0; p < 2; p += 1) {
      for (let q = p + 1; q < 3; q += 1) {
        if (Math.abs(a[p][q]) > 1e-12) {
          const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
          const t =
            Math.sign(theta || 1) /
            (Math.abs(theta) + Math.sqrt(theta * theta + 1));
          const c = 1 / Math.sqrt(t * t + 1);
          const s = t * c;
          for (let k = 0; k < 3; k += 1) {
            const akp = a[k][p];
            const akq = a[k][q];
            a[k][p] = c * akp - s * akq;
            a[k][q] = s * akp + c * akq;
          }
          for (let k = 0; k < 3; k += 1) {
            const apk = a[p][k];
            const aqk = a[q][k];
            a[p][k] = c * apk - s * aqk;
            a[q][k] = s * apk + c * aqk;
          }
          for (let k = 0; k < 3; k += 1) {
            const vkp = v[k][p];
            const vkq = v[k][q];
            v[k][p] = c * vkp - s * vkq;
            v[k][q] = s * vkp + c * vkq;
          }
        }
      }
    }
  }

  return [0, 1, 2]
    .map((i) => ({
      value: a[i][i],
      axis: new Vector3(v[0][i], v[1][i], v[2][i]).normalize(),
    }))
    .sort((x, y) => y.value - x.value)
    .map((e) => e.axis);
}

// Re-frames a sword mesh (already in its final world scale) so the crossguard
// centre sits at the origin, +Y runs to the tip and +X runs along the guard.
export default function canonicalizeSword(source) {
  const geometry = source.clone();
  const positions = geometry.attributes.position.array;
  const count = positions.length / 3;
  const [long, wide] = principalAxes(positions);

  let minL = Infinity;
  let maxL = -Infinity;
  const p = new Vector3();
  for (let i = 0; i < count; i += 1) {
    const l = p.fromArray(positions, i * 3).dot(long);
    minL = Math.min(minL, l);
    maxL = Math.max(maxL, l);
  }

  const span = maxL - minL;
  const widthLo = new Float32Array(BINS).fill(Infinity);
  const widthHi = new Float32Array(BINS).fill(-Infinity);
  for (let i = 0; i < count; i += 1) {
    p.fromArray(positions, i * 3);
    const bin = Math.min(
      BINS - 1,
      Math.floor(((p.dot(long) - minL) / span) * BINS)
    );
    const w = p.dot(wide);
    widthLo[bin] = Math.min(widthLo[bin], w);
    widthHi[bin] = Math.max(widthHi[bin], w);
  }

  let guardBin = 0;
  let guardWidth = -Infinity;
  for (let b = 0; b < BINS; b += 1) {
    const width = widthHi[b] - widthLo[b];
    if (width > guardWidth) {
      guardWidth = width;
      guardBin = b;
    }
  }

  const guardL = minL + ((guardBin + 0.5) / BINS) * span;
  const tipIsMax = maxL - guardL > guardL - minL;
  const up = long.clone().multiplyScalar(tipIsMax ? 1 : -1);
  const side = wide
    .clone()
    .sub(up.clone().multiplyScalar(wide.dot(up)))
    .normalize();
  const depth = new Vector3().crossVectors(side, up).normalize();

  const centre = new Vector3();
  let inGuard = 0;
  for (let i = 0; i < count; i += 1) {
    p.fromArray(positions, i * 3);
    if (Math.abs(p.dot(long) - guardL) <= span / BINS) {
      centre.add(p);
      inGuard += 1;
    }
  }
  centre.divideScalar(Math.max(1, inGuard));
  centre.sub(long.clone().multiplyScalar(centre.dot(long) - guardL));

  const frame = new Matrix4().makeBasis(side, up, depth).setPosition(centre);
  geometry.applyMatrix4(frame.clone().invert());
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const { min, max } = geometry.boundingBox;
  return {
    geometry,
    bladeLength: max.y,
    gripLength: -min.y,
    guardHalfWidth: guardWidth / 2,
  };
}
