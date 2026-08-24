import {
  Fn,
  cameraProjectionMatrix,
  cameraViewMatrix,
  mix,
  positionGeometry,
  select,
  smoothstep,
  uniform,
  uv,
  varying,
  vec2,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export default function createRainMaterial({ lightCone, simulation }) {
  const uniforms = {
    streakLength: uniform(0.9),
    streakWidth: uniform(0.045),
    opacity: uniform(0.5),
    stretchSpeed: uniform(6),
    tint: uniform(new THREE.Color('#d5e7f0')),
    edgeFade: uniform(0.55),
  };

  const slot = simulation.positionBuffer.toAttribute();
  const motion = simulation.motionBuffer.toAttribute();
  const anchor = simulation.anchorBuffer.toAttribute();

  const worldPosition = slot.xyz;
  const seed = anchor.z;

  const sizeJitter = mix(0.6, 1.4, seed);
  const width = uniforms.streakWidth.mul(sizeJitter);

  // Nothing here reads the particle's state. A streak is oriented by its own
  // velocity and stretched by its own speed, so falling, clinging and falling
  // off are the same drop under different motion — which is the only thing the
  // reveal is allowed to depend on.
  const stretch = motion.xyz
    .length()
    .div(uniforms.stretchSpeed.max(0.001))
    .saturate();
  const length = uniforms.streakLength.mul(sizeJitter).mul(stretch).max(width);

  const streakVertex = Fn(() => {
    const viewVelocity = cameraViewMatrix.mul(vec4(motion.xyz, 0)).xy.toVar();
    const alongDirection = select(
      viewVelocity.length().lessThan(1e-4),
      vec2(0, 1),
      viewVelocity.normalize()
    ).toVar();
    const acrossDirection = vec2(alongDirection.y, alongDirection.x.negate());

    const viewPosition = cameraViewMatrix.mul(vec4(worldPosition, 1)).toVar();
    const screenOffset = acrossDirection
      .mul(positionGeometry.x.mul(width))
      .add(alongDirection.mul(positionGeometry.y.mul(length)));

    return cameraProjectionMatrix.mul(
      vec4(viewPosition.xy.add(screenOffset), viewPosition.z, viewPosition.w)
    );
  });

  const depthFade = worldPosition.y
    .div(simulation.uniforms.sinkDepth.negate())
    .oneMinus()
    .saturate()
    .pow(1.5);

  // smoothstep is undefined when edge0 > edge1, so ramp up and invert rather
  // than passing the edges reversed.
  const boundsFade = smoothstep(
    uniforms.edgeFade.min(0.999),
    1,
    worldPosition.xz.length().div(simulation.uniforms.bounds.mul(0.5))
  ).oneMinus();

  const brightness = varying(
    lightCone.evaluate(worldPosition).mul(depthFade).mul(boundsFade)
  );

  const gradient = uv();
  const shape = gradient.x
    .sub(0.5)
    .abs()
    .mul(2)
    .oneMinus()
    .pow(1.5)
    .mul(gradient.y.sub(0.5).abs().mul(2).oneMinus().pow(0.5))
    .mul(mix(0.5, 1.4, gradient.y))
    .saturate();

  const material = new THREE.MeshBasicNodeMaterial();
  material.vertexNode = streakVertex();
  material.colorNode = uniforms.tint
    .mul(shape)
    .mul(brightness)
    .mul(uniforms.opacity);
  material.blending = THREE.AdditiveBlending;
  material.depthWrite = false;
  material.forceSinglePass = true;
  material.side = THREE.DoubleSide;
  material.transparent = true;

  const applyConfig = (rain) => {
    uniforms.streakLength.value = rain.streakLength;
    uniforms.streakWidth.value = rain.streakWidth;
    uniforms.opacity.value = rain.opacity;
    uniforms.stretchSpeed.value = rain.stretchSpeed;
    uniforms.edgeFade.value = rain.edgeFade;
    uniforms.tint.value.set(rain.tint);
  };

  return { applyConfig, material, uniforms };
}
