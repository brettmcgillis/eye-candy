import {
  attribute,
  dot,
  float,
  int,
  mix,
  mx_fractal_noise_float as mxFractalNoise,
  normalLocal,
  positionLocal,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  buildVolumetricFireCurve,
  buildVolumetricFireGeometry,
  resolveVolumetricFireControlPoints,
} from './volumetricFireGPUShared';

const LUMINANCE = vec3(0.2126, 0.7152, 0.0722);

function createShellMaterial(uniforms) {
  const arcT = attribute('arcT', 'float');
  const animatedOffset = vec3(
    uniforms.time.mul(uniforms.speed).mul(0.22),
    arcT.mul(2.8),
    uniforms.time.mul(uniforms.speed).mul(0.16)
  );
  const turbulence = mxFractalNoise(
    normalLocal.mul(float(0.72)).add(animatedOffset),
    int(5),
    uniforms.lacunarity,
    uniforms.gain
  )
    .mul(float(0.5))
    .add(float(0.5))
    .clamp(0.0, 1.0);
  const billow = mxFractalNoise(
    positionLocal.add(vec3(0.0, uniforms.time.mul(uniforms.speed).negate(), 0.0)),
    int(4),
    uniforms.lacunarity,
    uniforms.gain
  )
    .mul(float(2.0))
    .sub(float(1.0));
  const envelope = float(1.0).sub(arcT.mul(0.82)).clamp(0.08, 1.0);
  const displacement = turbulence
    .mul(uniforms.magnitude)
    .mul(uniforms.stepSize.mul(0.06))
    .add(billow.mul(uniforms.magnitude).mul(uniforms.stepSize).mul(0.025))
    .mul(envelope);
  const reactionCoord = turbulence
    .mul(float(0.5))
    .add(float(1.0).sub(arcT).mul(float(0.75)))
    .clamp(0.0, 1.0);
  const borderMix = reactionCoord.mul(0.8).clamp(0.0, 1.0);
  const coreMix = reactionCoord.mul(reactionCoord).clamp(0.0, 1.0);
  const baseColor = mix(uniforms.smokeColor, uniforms.borderColor, borderMix);
  const fireColor = mix(baseColor, uniforms.coreColor, coreMix);
  const emberMix = uniforms.emberDensity
    .mul(reactionCoord)
    .mul(float(1.0).sub(arcT).mul(0.45).add(0.15))
    .clamp(0.0, 0.65);
  const emberColor = mix(fireColor, uniforms.emberColor, emberMix);
  const tinted = emberColor.mul(uniforms.tintColor);
  const luminance = dot(tinted, LUMINANCE);
  const saturated = mix(
    vec3(luminance, luminance, luminance),
    tinted,
    uniforms.saturation
  ).mul(uniforms.brightness);
  const opacity = envelope
    .mul(uniforms.density)
    .mul(turbulence.mul(0.42).add(0.24));

  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  material.positionNode = positionLocal.add(normalLocal.mul(displacement));
  material.colorNode = saturated;
  material.opacityNode = opacity;
  material.uniforms = uniforms;

  return material;
}

function createCoreMaterial(uniforms) {
  const arcT = attribute('arcT', 'float');
  const turbulence = mxFractalNoise(
    normalLocal
      .mul(float(0.45))
      .add(vec3(uniforms.time.mul(uniforms.speed).mul(0.3), arcT.mul(2.2), 0.0)),
    int(4),
    uniforms.lacunarity,
    uniforms.gain
  )
    .mul(float(0.5))
    .add(float(0.5))
    .clamp(0.0, 1.0);
  const coreMix = turbulence
    .mul(float(0.28))
    .add(float(1.0).sub(arcT).mul(float(0.95)))
    .clamp(0.0, 1.0);
  const hotCore = mix(uniforms.borderColor, uniforms.coreColor, coreMix).mul(
    uniforms.tintColor
  );
  const emberGlow = mix(hotCore, uniforms.emberColor, uniforms.emberDensity.mul(0.35));
  const opacity = float(1.0)
    .sub(arcT.mul(0.88))
    .clamp(0.06, 1.0)
    .mul(uniforms.density)
    .mul(turbulence.mul(0.45).add(0.4));

  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  material.positionNode = positionLocal;
  material.colorNode = emberGlow.mul(uniforms.brightness.mul(1.08));
  material.opacityNode = opacity;
  material.uniforms = uniforms;

  return material;
}

export default function CS184VolumetricFireGPU({
  position = [0, 0, 0],
  inverted = false,
  width = 0.5,
  height = 1.5,
  depth = 0.5,
  bendX = 0,
  bendZ = 0,
  animated = true,
  animSpeed = 0.5,
  magnitude = 1.3,
  lacunarity = 2.0,
  gain = 0.5,
  speed = 0.8,
  density = 1.2,
  brightness = 1.8,
  saturation = 1.0,
  tintColor = '#ffffff',
  coreColor = '#ffffcc',
  borderColor = '#ff6600',
  smokeColor = '#330000',
  emberDensity = 0.15,
  emberSize = 0.25,
  emberColor = '#ff4400',
  steps = 64,
  stepSize = 1.0,
  controlPoints = null,
}) {
  const groupRef = useRef();
  const swayTimeRef = useRef(0);
  const uniforms = useMemo(
    () => ({
      time: uniform(0),
      magnitude: uniform(magnitude),
      lacunarity: uniform(lacunarity),
      gain: uniform(gain),
      speed: uniform(speed),
      density: uniform(density),
      brightness: uniform(brightness),
      saturation: uniform(saturation),
      tintColor: uniform(new THREE.Color(tintColor)),
      coreColor: uniform(new THREE.Color(coreColor)),
      borderColor: uniform(new THREE.Color(borderColor)),
      smokeColor: uniform(new THREE.Color(smokeColor)),
      emberDensity: uniform(emberDensity),
      emberSize: uniform(emberSize),
      emberColor: uniform(new THREE.Color(emberColor)),
      stepSize: uniform(stepSize),
    }),
    []
  );

  const plumeControlPoints = useMemo(
    () =>
      resolveVolumetricFireControlPoints({
        controlPoints,
        width,
        height,
        depth,
        bendX,
        bendZ,
      }),
    [bendX, bendZ, controlPoints, depth, height, width]
  );
  const curve = useMemo(
    () => buildVolumetricFireCurve(plumeControlPoints),
    [plumeControlPoints]
  );
  const tubularSegments = useMemo(
    () => Math.min(180, Math.max(52, Math.round(steps * 1.25))),
    [steps]
  );
  const radialSegments = useMemo(
    () => Math.min(36, Math.max(18, Math.round(24 / Math.max(stepSize, 0.65)))),
    [stepSize]
  );
  const geometry = useMemo(
    () =>
      buildVolumetricFireGeometry(curve, plumeControlPoints, {
        tubularSegments,
        radialSegments,
        capSegments: 12,
      }),
    [curve, plumeControlPoints, radialSegments, tubularSegments]
  );
  const shellMaterial = useMemo(() => createShellMaterial(uniforms), [uniforms]);
  const coreMaterial = useMemo(() => createCoreMaterial(uniforms), [uniforms]);

  useEffect(() => {
    uniforms.magnitude.value = magnitude;
    uniforms.lacunarity.value = lacunarity;
    uniforms.gain.value = gain;
    uniforms.speed.value = speed;
    uniforms.density.value = density;
    uniforms.brightness.value = brightness;
    uniforms.saturation.value = saturation;
    uniforms.tintColor.value.set(tintColor);
    uniforms.coreColor.value.set(coreColor);
    uniforms.borderColor.value.set(borderColor);
    uniforms.smokeColor.value.set(smokeColor);
    uniforms.emberDensity.value = emberDensity;
    uniforms.emberSize.value = emberSize;
    uniforms.emberColor.value.set(emberColor);
    uniforms.stepSize.value = stepSize;
  }, [
    borderColor,
    brightness,
    coreColor,
    density,
    emberColor,
    emberDensity,
    emberSize,
    gain,
    lacunarity,
    magnitude,
    saturation,
    smokeColor,
    speed,
    stepSize,
    tintColor,
    uniforms,
  ]);

  useEffect(
    () => () => {
      geometry.dispose();
      shellMaterial.dispose();
      coreMaterial.dispose();
    },
    [coreMaterial, geometry, shellMaterial]
  );

  useFrame(({ clock }, delta) => {
    uniforms.time.value = clock.getElapsedTime();

    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.x = inverted ? Math.PI : 0;
    groupRef.current.rotation.z = 0;

    if (!animated || controlPoints?.length >= 2) {
      return;
    }

    swayTimeRef.current += delta * animSpeed;
    const t = swayTimeRef.current;
    groupRef.current.rotation.x += Math.sin(t * 0.8) * 0.1;
    groupRef.current.rotation.z =
      Math.cos(t * 0.65 + 1.2) * 0.07 + Math.cos(t * 1.7) * 0.03;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={geometry} material={shellMaterial} />
      <mesh geometry={geometry} material={coreMaterial} scale={[0.68, 1, 0.68]} />
    </group>
  );
}
