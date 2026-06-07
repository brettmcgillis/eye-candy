// CPU-side SDF evaluation for MarchingCubes.
// Ports the same drip logic as createRaymarchNode.js — sphere or skull base shape.

const TAU = Math.PI * 2;

function fract(x) {
  return x - Math.floor(x);
}

function smin(d1, d2, k) {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (d2 - d1)) / k));
  return d2 * (1 - h) + d1 * h - k * h * (1 - h);
}

function sdSegment(px, py, pz, h, r) {
  const cy = Math.max(0, Math.min(h, py));
  return Math.sqrt(px * px + (py - cy) * (py - cy) + pz * pz) - r;
}

function hash31(p) {
  let ax = fract(p * 0.1031);
  let ay = fract(p * 0.103);
  let az = fract(p * 0.0973);
  const d = ax * (ay + 33.33) + ay * (az + 33.33) + az * (ax + 33.33);
  ax += d;
  ay += d;
  az += d;
  return [fract((ax + ay) * az), fract((ax + az) * ay), fract((ay + az) * ax)];
}

function pModPolar(px, pz, n) {
  const angle = TAU / n;
  const r = Math.sqrt(px * px + pz * pz);
  let a = Math.atan2(pz, px) + angle * 0.5;
  let c = Math.floor(a / angle);
  a = (((a % angle) + angle) % angle) - angle * 0.5;
  if (Math.abs(c) >= n * 0.5) c = Math.abs(c);
  return [Math.cos(a) * r, Math.sin(a) * r, c];
}

function sphereBase(px, py, pz) {
  return Math.sqrt(px * px + py * py + pz * pz) - 1.0;
}

function skullBase(px, py, pz) {
  // Cranium — dominant sphere
  const cranium = Math.sqrt(px * px + (py - 0.1) * (py - 0.1) + pz * pz) - 1.0;
  // Jaw — narrower, offset down and slightly forward
  const jx = px * 1.05;
  const jy = py + 0.88;
  const jz = pz - 0.08;
  const jaw = Math.sqrt(jx * jx + jy * jy + jz * jz) - 0.62;
  return smin(cranium, jaw, 0.28);
}

function mapSDF(
  px,
  py,
  pz,
  t,
  shape,
  dripSpeed,
  dripCount,
  dripDropletFall,
  dripBlend
) {
  let x = px;
  let y = py;
  let z = pz;

  const base = shape === 'skull' ? skullBase(x, y, z) : sphereBase(x, y, z);
  let dist = base;

  // Polar repeat — N evenly spaced drip channels around the equator
  const [nx, nz, cell] = pModPolar(x, z, dripCount);
  x = nx;
  z = nz;

  const rng = hash31(cell);
  x -= 0.5;
  rng[0] += Math.sign(x) * 0.5;
  x = Math.abs(x) - 0.2;
  y = -y; // flip so drips hang down

  const localTime = t * dripSpeed * 0.2 + rng[0];
  const anim = fract(localTime);
  const wave = Math.sin(anim * Math.PI);
  const height = 0.7 + 0.3 * wave ** 4;
  const size = Math.max(0, 0.03 - 0.03 * (1 - wave));

  dist = smin(dist, sdSegment(x, y, z, height, size), dripBlend);

  // Detaching drip head
  const headY = anim ** 10 * dripDropletFall + height;
  const head = Math.sqrt(x * x + (y - headY) * (y - headY) + z * z) - 0.05;
  dist = smin(dist, head, 0.3 * anim ** 0.5 * dripBlend);

  return dist * 0.5;
}

// World-space volume the MC object covers.
// SDF origin (sphere center) resolves to scene origin — these offsets just
// widen the window to capture drips falling below.
// x,z: ±SCALE_XZ,  y: [POS_Y - SCALE_Y, POS_Y + SCALE_Y]
export const MC_SCALE = [2.0, 3.0, 2.0];
export const MC_POS = [0, -0.9, 0];

export function evaluateField(field, size, size2, halfsize, t, shape, config) {
  const { dripSpeed, dripCount, dripDropletFall, viscosity } = config;
  const dripBlend = 0.34 - 0.22 * viscosity;

  const [sx, sy, sz] = MC_SCALE;
  const [px, py, pz] = MC_POS;
  const iso = 80; // matches mc.isolation default

  /* eslint-disable no-param-reassign */
  for (let iz = 0; iz < size; iz += 1) {
    const lz = (iz - halfsize) / halfsize;
    const wz = lz * sz + pz;
    const zBase = iz * size2;

    for (let iy = 0; iy < size; iy += 1) {
      const ly = (iy - halfsize) / halfsize;
      const wy = ly * sy + py;
      const yzBase = zBase + iy * size;

      for (let ix = 0; ix < size; ix += 1) {
        const lx = (ix - halfsize) / halfsize;
        const wx = lx * sx + px;

        const d = mapSDF(
          wx,
          wy,
          wz,
          t,
          shape,
          dripSpeed,
          dripCount,
          dripDropletFall,
          dripBlend
        );

        // field > iso = inside surface  (surface at d = 0)
        field[yzBase + ix] = Math.min(160, Math.max(0, iso - d * iso * 2));
      }
    }
  }
  /* eslint-enable no-param-reassign */
}
