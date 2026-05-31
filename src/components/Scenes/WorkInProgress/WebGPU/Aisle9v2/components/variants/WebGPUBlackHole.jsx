import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import { ENVIRONMENT_SPACE } from '../../presets/presets';
import createWebGPUBlackHoleVolumeShader from '../../utils/createWebGPUBlackHoleVolumeShader';

const WEBGPU_SOURCE_DEFAULTS = {
  mass: 0.4,
  diskInnerRadius: 4.1,
  diskOuterRadius: 14.5,
  diskBrightness: 5,
  diskTemperature: 49.78,
  temperatureFalloff: 5.22,
  lensingStrength: 2.4,
  dopplerStrength: 1,
  rotationSpeed: -8.7,
  stepCount: 64,
  stepSize: 1,
  turbulenceScale: 1.81,
  turbulenceStretch: 0.75,
  turbulenceSharpness: 7.4,
  turbulenceCycleTime: 5,
  turbulenceLacunarity: 3,
  turbulencePersistence: 0.8,
  diskEdgeSoftnessInner: 0.18,
  diskEdgeSoftnessOuter: 0.5,
  starsEnabled: true,
  starDensity: 0.1,
  starSize: 1.2,
  starBrightness: 0.1,
  nebulaEnabled: true,
  nebula1Scale: 2,
  nebula1Density: 0.5,
  nebula1Brightness: 0.01,
  nebula1Color: '#071f44',
  nebula2Scale: 5.5,
  nebula2Density: 0.05,
  nebula2Brightness: 0.21,
  nebula2Color: '#010615',
};

function getSourceInnerRadius(config, sourceOuterRadius) {
  if (config.webgpuDiskInnerRadius != null) {
    return config.webgpuDiskInnerRadius;
  }

  if (config.webgpuInnerRatio != null) {
    return config.webgpuInnerRatio * sourceOuterRadius;
  }

  return WEBGPU_SOURCE_DEFAULTS.diskInnerRadius;
}

function createUniforms(config) {
  return {
    time: uniform(0),
    cameraInside: uniform(0),
    coreRadius: uniform(0.12),
    innerRadius: uniform(0.28),
    outerRadius: uniform(0.68),
    mass: uniform(config.webgpuMass ?? WEBGPU_SOURCE_DEFAULTS.mass),
    lensingStrength: uniform(
      config.webgpuLensingStrength ?? WEBGPU_SOURCE_DEFAULTS.lensingStrength
    ),
    stepCount: uniform(
      Math.max(
        24,
        Math.round(config.webgpuStepCount ?? WEBGPU_SOURCE_DEFAULTS.stepCount)
      ),
      'int'
    ),
    stepSize: uniform(config.webgpuStepSize ?? WEBGPU_SOURCE_DEFAULTS.stepSize),
    diskBrightness: uniform(
      config.webgpuDiskBrightness ?? WEBGPU_SOURCE_DEFAULTS.diskBrightness
    ),
    diskTemperature: uniform(
      config.webgpuTemperature ?? WEBGPU_SOURCE_DEFAULTS.diskTemperature
    ),
    temperatureFalloff: uniform(
      config.webgpuTemperatureFalloff ??
        WEBGPU_SOURCE_DEFAULTS.temperatureFalloff
    ),
    dopplerStrength: uniform(
      config.webgpuDopplerStrength ?? WEBGPU_SOURCE_DEFAULTS.dopplerStrength
    ),
    rotationSpeed: uniform(
      config.webgpuRotationSpeed ?? WEBGPU_SOURCE_DEFAULTS.rotationSpeed
    ),
    rotationDirection: uniform(-1),
    turbulenceScale: uniform(
      config.webgpuTurbulenceScale ?? WEBGPU_SOURCE_DEFAULTS.turbulenceScale
    ),
    turbulenceStretch: uniform(
      config.webgpuTurbulenceStretch ?? WEBGPU_SOURCE_DEFAULTS.turbulenceStretch
    ),
    turbulenceSharpness: uniform(
      config.webgpuTurbulenceSharpness ??
        WEBGPU_SOURCE_DEFAULTS.turbulenceSharpness
    ),
    turbulenceCycleTime: uniform(
      config.webgpuTurbulenceCycleTime ??
        WEBGPU_SOURCE_DEFAULTS.turbulenceCycleTime
    ),
    turbulenceLacunarity: uniform(
      config.webgpuTurbulenceLacunarity ??
        WEBGPU_SOURCE_DEFAULTS.turbulenceLacunarity
    ),
    turbulencePersistence: uniform(
      config.webgpuTurbulencePersistence ??
        WEBGPU_SOURCE_DEFAULTS.turbulencePersistence
    ),
    diskEdgeSoftnessInner: uniform(
      config.webgpuDiskEdgeSoftnessInner ??
        WEBGPU_SOURCE_DEFAULTS.diskEdgeSoftnessInner
    ),
    diskEdgeSoftnessOuter: uniform(
      config.webgpuDiskEdgeSoftnessOuter ??
        WEBGPU_SOURCE_DEFAULTS.diskEdgeSoftnessOuter
    ),
    useBackground: uniform(0),
    starsEnabled: uniform(
      (config.webgpuStarsEnabled ?? WEBGPU_SOURCE_DEFAULTS.starsEnabled) ? 1 : 0
    ),
    nebulaEnabled: uniform(
      (config.webgpuNebulaEnabled ?? WEBGPU_SOURCE_DEFAULTS.nebulaEnabled)
        ? 1
        : 0
    ),
    starBackgroundColor: uniform(
      new THREE.Color(config.starBackgroundColor ?? '#03040a')
    ),
    starDensity: uniform(
      config.webgpuStarDensity ?? WEBGPU_SOURCE_DEFAULTS.starDensity
    ),
    starSize: uniform(config.webgpuStarSize ?? WEBGPU_SOURCE_DEFAULTS.starSize),
    starBrightness: uniform(
      config.webgpuStarBrightness ?? WEBGPU_SOURCE_DEFAULTS.starBrightness
    ),
    nebula1Scale: uniform(
      config.webgpuNebula1Scale ?? WEBGPU_SOURCE_DEFAULTS.nebula1Scale
    ),
    nebula1Density: uniform(
      config.webgpuNebula1Density ?? WEBGPU_SOURCE_DEFAULTS.nebula1Density
    ),
    nebula1Brightness: uniform(
      config.webgpuNebula1Brightness ?? WEBGPU_SOURCE_DEFAULTS.nebula1Brightness
    ),
    nebula1Color: uniform(
      new THREE.Color(
        config.webgpuNebula1Color ?? WEBGPU_SOURCE_DEFAULTS.nebula1Color
      )
    ),
    nebula2Scale: uniform(
      config.webgpuNebula2Scale ?? WEBGPU_SOURCE_DEFAULTS.nebula2Scale
    ),
    nebula2Density: uniform(
      config.webgpuNebula2Density ?? WEBGPU_SOURCE_DEFAULTS.nebula2Density
    ),
    nebula2Brightness: uniform(
      config.webgpuNebula2Brightness ?? WEBGPU_SOURCE_DEFAULTS.nebula2Brightness
    ),
    nebula2Color: uniform(
      new THREE.Color(
        config.webgpuNebula2Color ?? WEBGPU_SOURCE_DEFAULTS.nebula2Color
      )
    ),
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
    const sourceOuterRadius = Math.max(
      0.0001,
      config.webgpuDiskOuterRadius ?? WEBGPU_SOURCE_DEFAULTS.diskOuterRadius
    );
    const sourceInnerRadius = Math.min(
      sourceOuterRadius * 0.98,
      Math.max(0.0001, getSourceInnerRadius(config, sourceOuterRadius))
    );
    const localScale = outerRadius / sourceOuterRadius;
    const massRatio =
      (config.webgpuMass ?? WEBGPU_SOURCE_DEFAULTS.mass) /
      WEBGPU_SOURCE_DEFAULTS.mass;

    uniforms.coreRadius.value = Math.min(0.9, Math.max(0.02, coreRadius));
    uniforms.outerRadius.value = Math.min(
      0.92,
      Math.max(uniforms.coreRadius.value * 1.1, outerRadius)
    );
    uniforms.innerRadius.value = Math.max(
      uniforms.coreRadius.value * 1.12,
      uniforms.outerRadius.value * (sourceInnerRadius / sourceOuterRadius)
    );
    uniforms.mass.value = uniforms.coreRadius.value * 0.5 * massRatio;
    uniforms.lensingStrength.value =
      config.webgpuLensingStrength ?? WEBGPU_SOURCE_DEFAULTS.lensingStrength;
    uniforms.stepCount.value = Math.max(
      24,
      Math.round(config.webgpuStepCount ?? WEBGPU_SOURCE_DEFAULTS.stepCount)
    );
    uniforms.stepSize.value = Math.max(
      0.0005,
      (config.webgpuStepSize ?? WEBGPU_SOURCE_DEFAULTS.stepSize) * localScale
    );
    uniforms.diskBrightness.value =
      config.webgpuDiskBrightness ?? WEBGPU_SOURCE_DEFAULTS.diskBrightness;
    uniforms.diskTemperature.value =
      config.webgpuTemperature ?? WEBGPU_SOURCE_DEFAULTS.diskTemperature;
    uniforms.temperatureFalloff.value =
      config.webgpuTemperatureFalloff ??
      WEBGPU_SOURCE_DEFAULTS.temperatureFalloff;
    uniforms.dopplerStrength.value =
      config.webgpuDopplerStrength ?? WEBGPU_SOURCE_DEFAULTS.dopplerStrength;
    uniforms.rotationSpeed.value =
      (config.webgpuRotationSpeed ?? WEBGPU_SOURCE_DEFAULTS.rotationSpeed) *
      localScale ** 1.5;
    uniforms.rotationDirection.value =
      uniforms.rotationSpeed.value < 0 ? -1 : 1;
    uniforms.turbulenceScale.value =
      (config.webgpuTurbulenceScale ?? WEBGPU_SOURCE_DEFAULTS.turbulenceScale) /
      Math.max(localScale, 0.0001);
    uniforms.turbulenceStretch.value =
      config.webgpuTurbulenceStretch ??
      WEBGPU_SOURCE_DEFAULTS.turbulenceStretch;
    uniforms.turbulenceSharpness.value =
      config.webgpuTurbulenceSharpness ??
      WEBGPU_SOURCE_DEFAULTS.turbulenceSharpness;
    uniforms.turbulenceCycleTime.value =
      config.webgpuTurbulenceCycleTime ??
      WEBGPU_SOURCE_DEFAULTS.turbulenceCycleTime;
    uniforms.turbulenceLacunarity.value =
      config.webgpuTurbulenceLacunarity ??
      WEBGPU_SOURCE_DEFAULTS.turbulenceLacunarity;
    uniforms.turbulencePersistence.value =
      config.webgpuTurbulencePersistence ??
      WEBGPU_SOURCE_DEFAULTS.turbulencePersistence;
    uniforms.diskEdgeSoftnessInner.value =
      config.webgpuDiskEdgeSoftnessInner ??
      WEBGPU_SOURCE_DEFAULTS.diskEdgeSoftnessInner;
    uniforms.diskEdgeSoftnessOuter.value =
      config.webgpuDiskEdgeSoftnessOuter ??
      WEBGPU_SOURCE_DEFAULTS.diskEdgeSoftnessOuter;
    uniforms.starsEnabled.value =
      (config.webgpuStarsEnabled ?? WEBGPU_SOURCE_DEFAULTS.starsEnabled)
        ? 1
        : 0;
    uniforms.nebulaEnabled.value =
      (config.webgpuNebulaEnabled ?? WEBGPU_SOURCE_DEFAULTS.nebulaEnabled)
        ? 1
        : 0;
    uniforms.starBackgroundColor.value.set(
      config.starBackgroundColor ?? '#03040a'
    );
    uniforms.starDensity.value =
      config.webgpuStarDensity ?? WEBGPU_SOURCE_DEFAULTS.starDensity;
    uniforms.starSize.value =
      config.webgpuStarSize ?? WEBGPU_SOURCE_DEFAULTS.starSize;
    uniforms.starBrightness.value =
      config.webgpuStarBrightness ?? WEBGPU_SOURCE_DEFAULTS.starBrightness;
    uniforms.nebula1Scale.value =
      config.webgpuNebula1Scale ?? WEBGPU_SOURCE_DEFAULTS.nebula1Scale;
    uniforms.nebula1Density.value =
      config.webgpuNebula1Density ?? WEBGPU_SOURCE_DEFAULTS.nebula1Density;
    uniforms.nebula1Brightness.value =
      config.webgpuNebula1Brightness ??
      WEBGPU_SOURCE_DEFAULTS.nebula1Brightness;
    uniforms.nebula1Color.value.set(
      config.webgpuNebula1Color ?? WEBGPU_SOURCE_DEFAULTS.nebula1Color
    );
    uniforms.nebula2Scale.value =
      config.webgpuNebula2Scale ?? WEBGPU_SOURCE_DEFAULTS.nebula2Scale;
    uniforms.nebula2Density.value =
      config.webgpuNebula2Density ?? WEBGPU_SOURCE_DEFAULTS.nebula2Density;
    uniforms.nebula2Brightness.value =
      config.webgpuNebula2Brightness ??
      WEBGPU_SOURCE_DEFAULTS.nebula2Brightness;
    uniforms.nebula2Color.value.set(
      config.webgpuNebula2Color ?? WEBGPU_SOURCE_DEFAULTS.nebula2Color
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
