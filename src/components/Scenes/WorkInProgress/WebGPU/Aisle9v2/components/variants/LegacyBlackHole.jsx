import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import { ENVIRONMENT_SPACE } from '../../presets/presets';
import createLegacyBlackHoleVolumeShader from '../../utils/createLegacyBlackHoleVolumeShader';

function createUniforms(config) {
  return {
    time: uniform(0),
    cameraInside: uniform(0),
    coreRadius: uniform(0.18),
    simBoundary: uniform(5),
    innerRadius: uniform(1.6),
    outerRadius: uniform(3.4),
    gravityStrength: uniform(config.legacyGravityStrength ?? 1.15),
    stepCount: uniform(
      Math.max(48, Math.round(config.legacyStepCount ?? 144)),
      'int'
    ),
    diskBrightness: uniform(config.legacyDiskBrightness ?? 1.2),
    diskTemperature: uniform(config.legacyDiskTemperature ?? 3900),
    dopplerStrength: uniform(config.legacyDopplerStrength ?? 0.85),
    maxRevolutions: uniform(2),
    innerColor: uniform(new THREE.Color(config.diskInnerColor ?? '#ffffff')),
    outerColor: uniform(new THREE.Color(config.diskOuterColor ?? '#ffffff')),
    useBackground: uniform(0),
    starBackgroundColor: uniform(
      new THREE.Color(config.starBackgroundColor ?? '#03040a')
    ),
    starDensity: uniform(0.006),
    starSize: uniform(1.35),
    starBrightness: uniform(0.82),
    nebula1Scale: uniform(2),
    nebula1Density: uniform(0.35),
    nebula1Brightness: uniform(0.08),
    nebula1Color: uniform(new THREE.Color('#08122a')),
    nebula2Scale: uniform(5.8),
    nebula2Density: uniform(0.14),
    nebula2Brightness: uniform(0.12),
    nebula2Color: uniform(new THREE.Color('#19080d')),
  };
}

const LegacyBlackHole = memo(function LegacyBlackHole({ config }) {
  const uniforms = useMemo(() => createUniforms(config), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 72, 48), []);
  const material = useMemo(() => {
    const shaderNode = createLegacyBlackHoleVolumeShader(uniforms);
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
      config.diskDiameter / Math.max(config.blackHoleDiameter, 0.0001);
    uniforms.coreRadius.value = Math.min(0.8, Math.max(0.02, coreRadius));
    uniforms.simBoundary.value =
      1 / Math.max(uniforms.coreRadius.value, 0.0001);
    uniforms.outerRadius.value = Math.max(2.4, outerRadius);
    uniforms.innerRadius.value = Math.max(
      1.55,
      uniforms.outerRadius.value * 0.46
    );
    uniforms.gravityStrength.value =
      config.legacyGravityStrength ?? uniforms.gravityStrength.value;
    uniforms.stepCount.value = Math.max(
      48,
      Math.round(config.legacyStepCount ?? uniforms.stepCount.value)
    );
    uniforms.diskBrightness.value =
      config.legacyDiskBrightness ?? uniforms.diskBrightness.value;
    uniforms.diskTemperature.value =
      config.legacyDiskTemperature ?? uniforms.diskTemperature.value;
    uniforms.dopplerStrength.value =
      config.legacyDopplerStrength ?? uniforms.dopplerStrength.value;
    uniforms.innerColor.value.set(config.diskInnerColor ?? '#ffffff');
    uniforms.outerColor.value.set(config.diskOuterColor ?? '#ffffff');
    uniforms.starBackgroundColor.value.set(
      config.starBackgroundColor ?? '#03040a'
    );
    uniforms.useBackground.value =
      config.environment === ENVIRONMENT_SPACE && config.legacyUseBackground
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

export default LegacyBlackHole;
