import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import { ENVIRONMENT_SPACE } from '../../presets/presets';
import createWebGPUBlackHoleVolumeShader from '../../utils/createWebGPUBlackHoleVolumeShader';

function createUniforms(config) {
  return {
    time: uniform(0),
    cameraInside: uniform(0),
    coreRadius: uniform(0.12),
    innerRadius: uniform(0.28),
    outerRadius: uniform(0.68),
    mass: uniform(config.webgpuMass ?? 0.48),
    lensingStrength: uniform(config.webgpuLensingStrength ?? 1.45),
    stepCount: uniform(
      Math.max(24, Math.round(config.webgpuStepCount ?? 96)),
      'int'
    ),
    stepSize: uniform(config.webgpuStepSize ?? 0.036),
    diskBrightness: uniform(config.webgpuDiskBrightness ?? 1.4),
    diskTemperature: uniform(config.webgpuTemperature ?? 11),
    temperatureFalloff: uniform(0.75),
    dopplerStrength: uniform(1),
    rotationSpeed: uniform(-8.4),
    rotationDirection: uniform(-1),
    turbulenceScale: uniform(4.5),
    turbulenceStretch: uniform(4),
    turbulenceSharpness: uniform(1.45),
    turbulenceCycleTime: uniform(7),
    turbulenceLacunarity: uniform(2),
    turbulencePersistence: uniform(0.55),
    diskEdgeSoftnessInner: uniform(0.12),
    diskEdgeSoftnessOuter: uniform(0.28),
    innerColor: uniform(new THREE.Color(config.diskInnerColor ?? '#ffffff')),
    outerColor: uniform(new THREE.Color(config.diskOuterColor ?? '#ffffff')),
    lensColor: uniform(new THREE.Color(config.lensColor ?? '#8fb9ff')),
    useBackground: uniform(0),
    starBackgroundColor: uniform(
      new THREE.Color(config.starBackgroundColor ?? '#03040a')
    ),
    starDensity: uniform(0.007),
    starSize: uniform(1.4),
    starBrightness: uniform(0.85),
    nebula1Scale: uniform(2.1),
    nebula1Density: uniform(0.42),
    nebula1Brightness: uniform(0.09),
    nebula1Color: uniform(new THREE.Color('#10204a')),
    nebula2Scale: uniform(5.8),
    nebula2Density: uniform(0.12),
    nebula2Brightness: uniform(0.14),
    nebula2Color: uniform(new THREE.Color('#180814')),
  };
}

const WebGPUBlackHole = memo(function WebGPUBlackHole({ config }) {
  const uniforms = useMemo(() => createUniforms(config), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 72, 48), []);
  const material = useMemo(() => {
    const shaderNode = createWebGPUBlackHoleVolumeShader(uniforms);
    const nodeMaterial = new THREE.MeshBasicNodeMaterial({
      depthTest: true,
      depthWrite: false,
      transparent: true,
      side: THREE.FrontSide,
      toneMapped: false,
    });
    const color = shaderNode.get('color');
    nodeMaterial.colorNode = color.rgb;
    nodeMaterial.opacityNode = color.a;
    nodeMaterial.depthNode = shaderNode.get('depth');
    return nodeMaterial;
  }, [uniforms]);

  const position = config.blackHolePosition ?? { x: 0, y: 0, z: 0 };
  const metricWorldScale = config.metricWorldScale ?? 1;
  const lensRadius = config.lensDiameter * metricWorldScale * 0.5;

  useEffect(() => {
    const coreRadius =
      config.blackHoleDiameter / Math.max(config.lensDiameter, 0.0001);
    const outerRadius =
      config.diskDiameter / Math.max(config.lensDiameter, 0.0001);
    uniforms.coreRadius.value = Math.min(0.9, Math.max(0.02, coreRadius));
    uniforms.outerRadius.value = Math.min(
      0.92,
      Math.max(uniforms.coreRadius.value * 1.1, outerRadius)
    );
    uniforms.innerRadius.value = Math.max(
      uniforms.coreRadius.value * 1.12,
      uniforms.outerRadius.value *
        Math.min(0.92, Math.max(0.05, config.webgpuInnerRatio ?? 0.34))
    );
    uniforms.mass.value = config.webgpuMass ?? uniforms.mass.value;
    uniforms.lensingStrength.value =
      config.webgpuLensingStrength ?? uniforms.lensingStrength.value;
    uniforms.stepCount.value = Math.max(
      24,
      Math.round(config.webgpuStepCount ?? uniforms.stepCount.value)
    );
    uniforms.stepSize.value = config.webgpuStepSize ?? uniforms.stepSize.value;
    uniforms.diskBrightness.value =
      config.webgpuDiskBrightness ?? uniforms.diskBrightness.value;
    uniforms.diskTemperature.value =
      config.webgpuTemperature ?? uniforms.diskTemperature.value;
    uniforms.innerColor.value.set(config.diskInnerColor ?? '#ffffff');
    uniforms.outerColor.value.set(config.diskOuterColor ?? '#ffffff');
    uniforms.lensColor.value.set(config.lensColor ?? '#8fb9ff');
    uniforms.starBackgroundColor.value.set(
      config.starBackgroundColor ?? '#03040a'
    );
    uniforms.useBackground.value =
      config.environment === ENVIRONMENT_SPACE && config.webgpuUseBackground
        ? 1
        : 0;
  }, [config, uniforms]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state, delta) => {
    uniforms.time.value += delta;
    const dx = state.camera.position.x - (position.x ?? 0);
    const dy = state.camera.position.y - (position.y ?? 0);
    const dz = state.camera.position.z - (position.z ?? 0);
    const isInside = dx * dx + dy * dy + dz * dz < lensRadius * lensRadius;
    uniforms.cameraInside.value = isInside ? 1 : 0;
    material.side = isInside ? THREE.BackSide : THREE.FrontSide;
  });

  return (
    <group
      position={[position.x ?? 0, position.y ?? 0, position.z ?? 0]}
      scale={[lensRadius, lensRadius, lensRadius]}
    >
      <mesh
        frustumCulled={false}
        geometry={geometry}
        material={material}
        renderOrder={3}
      />
      <mesh renderOrder={2}>
        <sphereGeometry args={[1, 36, 24]} />
        <meshBasicMaterial
          color={config.lensColor}
          depthTest
          depthWrite={false}
          opacity={0.1}
          transparent
        />
      </mesh>
    </group>
  );
});

export default WebGPUBlackHole;
