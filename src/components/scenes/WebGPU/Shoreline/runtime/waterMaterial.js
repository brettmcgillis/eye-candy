/* eslint-disable camelcase */
import {
  Fn,
  cameraPosition,
  float,
  mix,
  mx_noise_float,
  positionLocal,
  positionWorld,
  smoothstep,
  texture,
  time,
  transformNormalToView,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { RESOLUTION, WORLD_SIZE } from './constants';

const TEXEL = 1 / RESOLUTION;
// uv.y runs the opposite way to world z on the rotated plane, so the z half of
// every gradient below carries the sign flip rather than the caller.
const GRADIENT_STEP = 2 * TEXEL * WORLD_SIZE;

export default function createWaterMaterial({
  bedTexture,
  foamTexture,
  heightTexture,
}) {
  const uniforms = {
    absorption: uniform(0.28),
    deepColor: uniform(new THREE.Color('#04141f')),
    foamColor: uniform(new THREE.Color('#eaf7ff')),
    foamDetail: uniform(26),
    foamSoftness: uniform(0.22),
    foamThreshold: uniform(0.16),
    opacityDepth: uniform(1.4),
    rippleAmplitude: uniform(0.14),
    rippleScale: uniform(0.9),
    shallowColor: uniform(new THREE.Color('#1e6f83')),
    shallowOpacity: uniform(0.12),
    skyColor: uniform(new THREE.Color('#9fc6d8')),
    waterRoughness: uniform(0.12),
  };

  const material = new THREE.MeshStandardNodeMaterial({
    depthWrite: false,
    metalness: 0,
    transparent: true,
  });

  const uvNode = uv();
  const depthAt = (coord) => texture(heightTexture, coord).x;
  const surfaceAt = (coord) => texture(bedTexture, coord).r.add(depthAt(coord));

  material.positionNode = positionLocal.add(vec3(0, surfaceAt(uvNode), 0));

  const shadingNormal = Fn(() => {
    const dx = surfaceAt(uvNode.add(vec2(TEXEL, 0)))
      .sub(surfaceAt(uvNode.sub(vec2(TEXEL, 0))))
      .div(GRADIENT_STEP);
    const dz = surfaceAt(uvNode.add(vec2(0, TEXEL)))
      .sub(surfaceAt(uvNode.sub(vec2(0, TEXEL))))
      .div(GRADIENT_STEP)
      .negate();

    // The solver's cells are metres across, so the surface it resolves is the
    // swell only. These are the capillary ripples riding on top of it.
    const phaseA = positionWorld.x
      .mul(uniforms.rippleScale)
      .add(positionWorld.z.mul(uniforms.rippleScale.mul(0.4)))
      .add(time.mul(1.3));
    const phaseB = positionWorld.x
      .mul(uniforms.rippleScale.mul(-0.45))
      .add(positionWorld.z.mul(uniforms.rippleScale.mul(0.85)))
      .add(time.mul(0.9));
    const rippleX = phaseA
      .cos()
      .add(phaseB.cos().mul(-0.45))
      .mul(uniforms.rippleAmplitude);
    const rippleZ = phaseA
      .cos()
      .mul(0.4)
      .add(phaseB.cos().mul(0.85))
      .mul(uniforms.rippleAmplitude);

    return vec3(
      dx.add(rippleX).negate(),
      1,
      dz.add(rippleZ).negate()
    ).normalize();
  })();

  material.normalNode = transformNormalToView(shadingNormal);

  const depth = depthAt(uvNode).toVar('depth');

  const foamBreakup = mx_noise_float(
    vec3(uvNode.mul(uniforms.foamDetail), time.mul(0.06))
  )
    .mul(0.5)
    .add(0.5);
  const foam = texture(foamTexture, uvNode)
    .x.mul(mix(float(0.55), float(1.45), foamBreakup))
    .toVar('foam');
  const foamMask = smoothstep(
    uniforms.foamThreshold,
    uniforms.foamThreshold.add(uniforms.foamSoftness),
    foam
  ).toVar('foamMask');

  const body = mix(
    uniforms.shallowColor,
    uniforms.deepColor,
    depth.mul(uniforms.absorption).negate().exp().oneMinus()
  );

  const viewDirection = cameraPosition.sub(positionWorld).normalize();
  const fresnel = float(1)
    .sub(viewDirection.dot(shadingNormal))
    .clamp(0, 1)
    .pow(4);

  material.colorNode = mix(
    mix(body, uniforms.skyColor, fresnel.mul(0.7)),
    uniforms.foamColor,
    foamMask
  );
  material.roughnessNode = mix(uniforms.waterRoughness, float(0.95), foamMask);
  material.opacityNode = mix(
    mix(
      uniforms.shallowOpacity,
      float(1),
      smoothstep(0, uniforms.opacityDepth, depth)
    ),
    float(1),
    foamMask
  );

  const update = (config) => {
    uniforms.absorption.value = config.absorption;
    uniforms.deepColor.value.set(config.deepColor);
    uniforms.foamColor.value.set(config.foamColor);
    uniforms.foamDetail.value = config.foamDetail;
    uniforms.foamSoftness.value = config.foamSoftness;
    uniforms.foamThreshold.value = config.foamThreshold;
    uniforms.opacityDepth.value = config.opacityDepth;
    uniforms.rippleAmplitude.value = config.rippleAmplitude;
    uniforms.rippleScale.value = config.rippleScale;
    uniforms.shallowColor.value.set(config.shallowColor);
    uniforms.shallowOpacity.value = config.shallowOpacity;
    uniforms.skyColor.value.set(config.skyColor);
    uniforms.waterRoughness.value = config.waterRoughness;
  };

  return { material, update };
}
