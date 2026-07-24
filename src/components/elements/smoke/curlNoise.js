// Divergence-free 3D flow field via curl of a vec3 noise potential,
// evaluated with central differences (6 taps) — same construction as
// Weightless's TSL curl noise (curl of mx_noise_vec3), ported to plain JS
// for the CPU-side particle loops here. Callers pre-scale/offset the sample
// point (frequency, time * evolveSpeed) before calling, same convention as
// Weightless's curlNoise(p).
//
// The three potentials are cheap phase-shifted sine sums rather than true
// Perlin/simplex noise — plenty convincing at particle-sim scale, and each
// curlNoise() call is already 6 potential evaluations, so keeping each
// potential to a single octave (no fbm) is what keeps this affordable inside
// a per-particle, per-frame CPU loop.

function potential(x, y, z) {
  return (
    (Math.sin(x * 0.83 + Math.cos(z * 0.57)) +
      Math.sin(y * 1.17 + Math.sin(x * 0.41)) +
      Math.sin(z * 0.91 + Math.cos(y * 0.73))) /
    3
  );
}

function psi1(x, y, z) {
  return potential(x + 17.3, y - 9.2, z + 4.1);
}
function psi2(x, y, z) {
  return potential(x - 31.8, y + 8.5, z - 14.7);
}
function psi3(x, y, z) {
  return potential(x + 11.1, y + 27.6, z + 19.4);
}

const EPSILON = 0.06;
const INV_2E = 1 / (2 * EPSILON);

/** Writes the curl of the noise potential at (x, y, z) into `out` and returns it. */
export default function curlNoise(x, y, z, out) {
  const e = EPSILON;

  const dPsi3dy = (psi3(x, y + e, z) - psi3(x, y - e, z)) * INV_2E;
  const dPsi2dz = (psi2(x, y, z + e) - psi2(x, y, z - e)) * INV_2E;
  const dPsi1dz = (psi1(x, y, z + e) - psi1(x, y, z - e)) * INV_2E;
  const dPsi3dx = (psi3(x + e, y, z) - psi3(x - e, y, z)) * INV_2E;
  const dPsi2dx = (psi2(x + e, y, z) - psi2(x - e, y, z)) * INV_2E;
  const dPsi1dy = (psi1(x, y + e, z) - psi1(x, y - e, z)) * INV_2E;

  // eslint-disable-next-line no-param-reassign
  out.x = dPsi3dy - dPsi2dz;
  // eslint-disable-next-line no-param-reassign
  out.y = dPsi1dz - dPsi3dx;
  // eslint-disable-next-line no-param-reassign
  out.z = dPsi2dx - dPsi1dy;
  return out;
}
