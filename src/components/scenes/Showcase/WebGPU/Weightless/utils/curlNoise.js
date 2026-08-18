// eslint-disable-next-line camelcase
import { Fn, float, mx_noise_vec3, vec3 } from 'three/tsl';

// Divergence-free 3D flow: curl of a vec3 noise potential via central
// differences (six mx_noise_vec3 taps). Same construction as the gpu-party
// reference, in TSL instead of glsl-curl-noise.
const curlNoise = Fn(([p]) => {
  const e = float(0.1);
  const dx = vec3(e, 0, 0);
  const dy = vec3(0, e, 0);
  const dz = vec3(0, 0, e);

  const px0 = mx_noise_vec3(p.sub(dx));
  const px1 = mx_noise_vec3(p.add(dx));
  const py0 = mx_noise_vec3(p.sub(dy));
  const py1 = mx_noise_vec3(p.add(dy));
  const pz0 = mx_noise_vec3(p.sub(dz));
  const pz1 = mx_noise_vec3(p.add(dz));

  const x = py1.z.sub(py0.z).sub(pz1.y).add(pz0.y);
  const y = pz1.x.sub(pz0.x).sub(px1.z).add(px0.z);
  const z = px1.y.sub(px0.y).sub(py1.x).add(py0.x);

  return vec3(x, y, z).div(e.mul(2));
});

export default curlNoise;
