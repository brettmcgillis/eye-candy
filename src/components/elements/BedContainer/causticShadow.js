/* eslint-disable camelcase */
import {
  Fn,
  float,
  mx_noise_float,
  normalView,
  positionViewDirection,
  refract,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// What a transmissive container writes into the shadow map instead of opaque
// black. `.rgb` is the light it lets through, `.a` how much it blocks; both
// need `renderer.shadowMap.transmitted`.
//
// Procedural rather than a sampled caustic photo: the stock trick reads a
// tileable caustic texture through the refraction vector, which works on a
// blobby refractor whose normals sweep in every direction. A container wall is
// a straight-sided ring whose normals vary only in azimuth, so a texture
// lookup sweeps one axis and smears. Warped ridged noise at least breaks along
// the wall instead of banding with it.
function causticAt(point, uniforms) {
  const warp = vec2(
    mx_noise_float(vec3(point, 0)),
    mx_noise_float(vec3(point.yx, 11.3))
  ).mul(uniforms.causticWarp);
  const warped = point.add(warp);

  // Ridged, not plain noise: the thin bright filaments are the whole read of a
  // caustic. Plain noise gives a soft blotch.
  const ridge = float(1).sub(mx_noise_float(vec3(warped, 4.7)).abs());
  return ridge.pow(uniforms.causticSharpness);
}

export function buildCausticUniforms() {
  return {
    causticGain: uniform(0),
    causticScale: uniform(6),
    causticSharpness: uniform(4),
    causticWarp: uniform(0.35),
    ior: uniform(1.5),
    shadowAlpha: uniform(0.35),
    shadowOcclusion: uniform(2),
    shadowTint: uniform(new THREE.Color('#ffffff')),
  };
}

export function applyCausticUniforms(uniforms, config) {
  const u = uniforms;
  u.causticGain.value = config.containerCaustics
    ? config.containerCausticStrength
    : 0;
  u.causticScale.value = config.containerCausticScale;
  u.causticSharpness.value = config.containerCausticSharpness;
  u.ior.value = config.containerIor;
  u.shadowAlpha.value = config.containerShadowAlpha;
  u.shadowOcclusion.value = config.containerShadowOcclusion;
  u.shadowTint.value.set(config.containerColor);
}

export default function createCausticShadowNode(uniforms) {
  return Fn(() => {
    // In the shadow pass "view" is the light's view, so normalView.z is how
    // square-on to the light this bit of wall is. The exponent has to stay LOW
    // for a container: a vertical wall is nearly edge-on to a raking key, so
    // at 55 degrees this is 0.57^n -- measured, n=12 (the value the stock duck
    // example uses on a blobby solid) moved 0.06% of the floor, n=2 moves 8.6%.
    const facing = normalView.z.abs().pow(uniforms.shadowOcclusion);
    const bend = refract(
      positionViewDirection.negate(),
      normalView,
      float(1).div(uniforms.ior)
    ).normalize();

    const caustic = causticAt(bend.xy.mul(uniforms.causticScale), uniforms);
    const light = caustic.mul(uniforms.causticGain).add(1).mul(facing);

    return vec4(uniforms.shadowTint.mul(light), uniforms.shadowAlpha);
  })();
}
