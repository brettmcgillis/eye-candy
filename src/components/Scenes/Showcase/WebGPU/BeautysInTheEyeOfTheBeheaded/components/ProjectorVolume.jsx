import { bayer16 } from 'three/addons/tsl/math/Bayer.js';
import {
  Fn,
  float,
  int,
  mx_fractal_noise_float as mxFractalNoise,
  screenCoordinate,
  time,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useRef } from 'react';

const UP_AXIS = new THREE.Vector3(0, 1, 0);

const ProjectorVolume = memo(function ProjectorVolume({
  density = 1,
  distance = 12,
  layer = 10,
  noiseSpeed = 0.08,
  onMaterialChange,
  position,
  steps = 12,
  target,
  angle,
}) {
  const meshRef = useRef(null);
  const uniforms = useMemo(
    () => ({
      density: uniform(density),
      noiseSpeed: uniform(noiseSpeed),
    }),
    []
  );
  const material = useMemo(() => {
    const volumeMaterial = new THREE.VolumeNodeMaterial();

    volumeMaterial.steps = steps;
    volumeMaterial.offsetNode = bayer16(screenCoordinate);
    volumeMaterial.scatteringNode = Fn(({ positionRay }) => {
      const animatedOffset = vec3(
        time.mul(uniforms.noiseSpeed).mul(float(0.11)),
        time.mul(uniforms.noiseSpeed).mul(float(-0.06)),
        time.mul(uniforms.noiseSpeed).mul(float(0.08))
      );
      const baseNoise = mxFractalNoise(
        positionRay.mul(float(0.18)).add(animatedOffset),
        int(3),
        float(2.0),
        float(0.5)
      )
        .mul(float(0.5))
        .add(float(0.5));
      const detailNoise = mxFractalNoise(
        positionRay
          .mul(float(0.42))
          .add(vec3(3.1, 1.7, 2.3))
          .add(animatedOffset),
        int(2),
        float(2.0),
        float(0.5)
      )
        .mul(float(0.5))
        .add(float(0.5));
      const densityPattern = baseNoise
        .mul(float(0.72))
        .add(detailNoise.mul(float(0.28)));

      return uniforms.density.mix(float(1), densityPattern);
    });

    return volumeMaterial;
  }, [steps, uniforms]);
  const beamTransform = useMemo(() => {
    const start = new THREE.Vector3(position.x, position.y, position.z);
    const endTarget = new THREE.Vector3(target.x, target.y, target.z);
    const direction = endTarget.clone().sub(start);
    const targetDistance = Math.max(direction.length(), 0.001);

    direction.normalize();

    const beamLength = Math.max(
      distance || targetDistance * 1.8,
      targetDistance
    );
    const beamCenter = start
      .clone()
      .add(direction.clone().multiplyScalar(beamLength * 0.5));
    const endRadius = Math.max(
      Math.tan((angle * Math.PI) / 180) * beamLength,
      0.05
    );
    const startRadius = Math.max(endRadius * 0.035, 0.015);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      UP_AXIS,
      direction
    );

    return {
      beamCenter: beamCenter.toArray(),
      beamLength,
      endRadius,
      quaternion,
      startRadius,
    };
  }, [
    angle,
    distance,
    position.x,
    position.y,
    position.z,
    target.x,
    target.y,
    target.z,
  ]);

  useEffect(() => {
    uniforms.density.value = density;
    uniforms.noiseSpeed.value = noiseSpeed;
    material.steps = steps;
    material.needsUpdate = true;
  }, [density, material, noiseSpeed, steps, uniforms]);

  useEffect(() => {
    onMaterialChange?.(material);

    return () => {
      onMaterialChange?.(null);
    };
  }, [material, onMaterialChange]);

  useEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    mesh.layers.disableAll();
    mesh.layers.enable(layer);
  }, [layer]);

  return (
    <mesh
      ref={meshRef}
      material={material}
      position={beamTransform.beamCenter}
      quaternion={beamTransform.quaternion}
      receiveShadow
    >
      <cylinderGeometry
        args={[
          beamTransform.endRadius,
          beamTransform.startRadius,
          beamTransform.beamLength,
          32,
          1,
          false,
        ]}
      />
    </mesh>
  );
});

export default ProjectorVolume;
