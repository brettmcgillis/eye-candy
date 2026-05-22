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
  buildVolumetricFireGuideGeometry,
  resolveVolumetricFireControlPoints,
} from './volumetricFireGPUShared';

const LUMINANCE = vec3(0.2126, 0.7152, 0.0722);

function createOuterMaterial(uniforms) {
  const arcT = attribute('arcT', 'float');
  const animatedOffset = vec3(
    uniforms.time.mul(uniforms.animSpeed).mul(0.28),
    arcT.mul(2.4),
    uniforms.time.mul(uniforms.animSpeed).mul(0.18)
  );
  const turbulence = mxFractalNoise(
    normalLocal.mul(float(0.7)).add(animatedOffset),
    int(5),
    uniforms.lacunarity,
    uniforms.gain
  )
    .mul(float(0.5))
    .add(float(0.5))
    .clamp(0.0, 1.0);
  const billow = mxFractalNoise(
    positionLocal.sub(
      vec3(0.0, uniforms.time.mul(uniforms.animSpeed).mul(0.5), 0.0)
    ),
    int(4),
    uniforms.lacunarity,
    uniforms.gain
  )
    .mul(float(2.0))
    .sub(float(1.0));
  const envelope = float(1.0).sub(arcT.mul(0.78)).clamp(0.12, 1.0);
  const displacement = turbulence
    .mul(uniforms.magnitude)
    .mul(float(0.07))
    .add(billow.mul(uniforms.magnitude).mul(float(0.028)))
    .mul(envelope);
  const heat = turbulence
    .mul(float(0.45))
    .add(float(1.0).sub(arcT).mul(float(0.7)))
    .clamp(0.0, 1.0);
  const outerColor = mix(
    vec3(0.42, 0.08, 0.02),
    vec3(1.0, 0.38, 0.06),
    heat
  );
  const hotColor = mix(outerColor, uniforms.tintColor, heat.mul(float(0.7)));
  const luminance = dot(hotColor, LUMINANCE);
  const saturated = mix(
    vec3(luminance, luminance, luminance),
    hotColor,
    uniforms.saturation
  ).mul(uniforms.brightness);
  const opacity = envelope.mul(turbulence.mul(0.55).add(0.25));

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
  const animatedOffset = vec3(
    uniforms.time.mul(uniforms.animSpeed).mul(0.34),
    arcT.mul(3.0),
    uniforms.time.mul(uniforms.animSpeed).mul(0.2)
  );
  const turbulence = mxFractalNoise(
    normalLocal.mul(float(0.45)).add(animatedOffset),
    int(4),
    uniforms.lacunarity,
    uniforms.gain
  )
    .mul(float(0.5))
    .add(float(0.5))
    .clamp(0.0, 1.0);
  const coreHeat = turbulence
    .mul(float(0.35))
    .add(float(1.0).sub(arcT).mul(float(0.95)))
    .clamp(0.0, 1.0);
  const coreColor = mix(vec3(1.0, 0.45, 0.08), uniforms.tintColor, coreHeat);
  const opacity = float(1.0)
    .sub(arcT.mul(0.82))
    .clamp(0.1, 1.0)
    .mul(turbulence.mul(0.4).add(0.45));

  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  material.positionNode = positionLocal;
  material.colorNode = coreColor.mul(uniforms.brightness.mul(1.05));
  material.opacityNode = opacity;
  material.uniforms = uniforms;

  return material;
}

export default function VolumetricFireGPU({
  position = [0, 0, 0],
  inverted = false,
  width = 0.35,
  height = 1.0,
  depth = 0.35,
  sliceSpacing = 0.05,
  segments = 24,
  bendX = 0,
  bendZ = 0,
  animated = true,
  animSpeed = 0.5,
  showSpline = false,
  showVolume = false,
  magnitude = 1.3,
  lacunarity = 2.0,
  gain = 0.5,
  tintColor = '#ffffff',
  saturation = 1.0,
  brightness = 1.5,
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
      tintColor: uniform(new THREE.Color(tintColor)),
      saturation: uniform(saturation),
      brightness: uniform(brightness),
      animSpeed: uniform(Math.max(animSpeed, 0.0001)),
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
    () =>
      Math.min(
        180,
        Math.max(
          48,
          segments * 6,
          Math.round(height / Math.max(sliceSpacing, 0.03)) * 4
        )
      ),
    [height, segments, sliceSpacing]
  );
  const geometry = useMemo(
    () =>
      buildVolumetricFireGeometry(curve, plumeControlPoints, {
        tubularSegments,
        radialSegments: 28,
        capSegments: 10,
      }),
    [curve, plumeControlPoints, tubularSegments]
  );
  const guideGeometry = useMemo(
    () => buildVolumetricFireGuideGeometry(curve),
    [curve]
  );
  const outerMaterial = useMemo(() => createOuterMaterial(uniforms), [uniforms]);
  const coreMaterial = useMemo(() => createCoreMaterial(uniforms), [uniforms]);
  const volumeMaterial = useMemo(() => {
    const material = new THREE.MeshBasicNodeMaterial({
      wireframe: true,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });

    material.colorNode = vec3(0.27, 0.67, 1.0);
    material.opacityNode = float(0.18);

    return material;
  }, []);

  useEffect(() => {
    uniforms.magnitude.value = magnitude;
    uniforms.lacunarity.value = lacunarity;
    uniforms.gain.value = gain;
    uniforms.tintColor.value.set(tintColor);
    uniforms.saturation.value = saturation;
    uniforms.brightness.value = brightness;
    uniforms.animSpeed.value = Math.max(animSpeed, 0.0001);
  }, [animSpeed, brightness, gain, lacunarity, magnitude, saturation, tintColor, uniforms]);

  useEffect(
    () => () => {
      geometry.dispose();
      guideGeometry.dispose();
      outerMaterial.dispose();
      coreMaterial.dispose();
      volumeMaterial.dispose();
    },
    [coreMaterial, geometry, guideGeometry, outerMaterial, volumeMaterial]
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
    groupRef.current.rotation.x += Math.sin(t * 0.8) * 0.12;
    groupRef.current.rotation.z =
      Math.cos(t * 0.65 + 1.2) * 0.07 + Math.cos(t * 1.7) * 0.03;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={geometry} material={outerMaterial} />
      <mesh geometry={geometry} material={coreMaterial} scale={[0.72, 1, 0.72]} />
      {showVolume && <mesh geometry={geometry} material={volumeMaterial} />}
      {showSpline && (
        <line geometry={guideGeometry}>
          <lineBasicMaterial color={0x44aaff} transparent opacity={0.7} />
        </line>
      )}
    </group>
  );
}
