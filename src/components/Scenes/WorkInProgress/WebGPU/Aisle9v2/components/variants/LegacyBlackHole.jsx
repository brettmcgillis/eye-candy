import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { ENVIRONMENT_SPACE } from '../../presets/presets';
import createLegacyBlackHoleVolumeShader from '../../utils/createLegacyBlackHoleVolumeShader';

const LEGACY_DEFAULTS = {
  gravityStrength: 1,
  stepCount: 100,
  diskBrightness: 0.9,
  diskTemperature: 3900,
  dopplerStrength: 1,
  accretionMinRadius: 1.5,
  accretionWidth: 5,
  maxRevolutions: 2,
  starBrightness: 1,
  galaxyBrightness: 0.4,
};

const LEGACY_DISK_TEXTURE_PATH =
  '/textures/blackhole/legacy-accretion-disk.png';
const LEGACY_GALAXY_TEXTURE_PATH = '/textures/blackhole/legacy-milkyway.jpg';
const LEGACY_STAR_TEXTURE_PATH = '/textures/blackhole/legacy-stars.png';

function createUniforms(config) {
  return {
    time: uniform(0),
    cameraInside: uniform(0),
    coreRadius: uniform(0.18),
    simBoundary: uniform(5),
    innerRadius: uniform(1.6),
    outerRadius: uniform(3.4),
    gravityStrength: uniform(
      config.legacyGravityStrength ?? LEGACY_DEFAULTS.gravityStrength
    ),
    stepCount: uniform(
      Math.max(
        48,
        Math.round(config.legacyStepCount ?? LEGACY_DEFAULTS.stepCount)
      ),
      'int'
    ),
    diskBrightness: uniform(
      config.legacyDiskBrightness ?? LEGACY_DEFAULTS.diskBrightness
    ),
    diskTemperature: uniform(
      config.legacyDiskTemperature ?? LEGACY_DEFAULTS.diskTemperature
    ),
    dopplerStrength: uniform(
      config.legacyDopplerStrength ?? LEGACY_DEFAULTS.dopplerStrength
    ),
    accretionMinRadius: uniform(
      config.legacyAccretionMinRadius ?? LEGACY_DEFAULTS.accretionMinRadius
    ),
    accretionWidth: uniform(
      config.legacyAccretionWidth ?? LEGACY_DEFAULTS.accretionWidth
    ),
    maxRevolutions: uniform(
      config.legacyMaxRevolutions ?? LEGACY_DEFAULTS.maxRevolutions
    ),
    useBackground: uniform(0),
    starBackgroundColor: uniform(
      new THREE.Color(config.starBackgroundColor ?? '#03040a')
    ),
    starBrightness: uniform(
      config.legacyStarBrightness ?? LEGACY_DEFAULTS.starBrightness
    ),
    galaxyBrightness: uniform(
      config.legacyGalaxyBrightness ?? LEGACY_DEFAULTS.galaxyBrightness
    ),
  };
}

const LegacyBlackHole = memo(function LegacyBlackHole({ config }) {
  const [diskTexture, galaxyTexture, starTexture] = useTexture([
    LEGACY_DISK_TEXTURE_PATH,
    LEGACY_GALAXY_TEXTURE_PATH,
    LEGACY_STAR_TEXTURE_PATH,
  ]);
  const uniforms = useMemo(() => createUniforms(config), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 72, 48), []);
  const diskTextureNode = useMemo(
    () => new THREE.TextureNode(diskTexture),
    [diskTexture]
  );
  const galaxyTextureNode = useMemo(
    () => new THREE.TextureNode(galaxyTexture),
    [galaxyTexture]
  );
  const starTextureNode = useMemo(
    () => new THREE.TextureNode(starTexture),
    [starTexture]
  );

  useEffect(() => {
    diskTexture.wrapT = THREE.RepeatWrapping;
    diskTexture.needsUpdate = true;
    galaxyTexture.colorSpace = THREE.SRGBColorSpace;
    galaxyTexture.magFilter = THREE.NearestFilter;
    galaxyTexture.minFilter = THREE.NearestFilter;
    galaxyTexture.needsUpdate = true;
    starTexture.colorSpace = THREE.SRGBColorSpace;
    starTexture.needsUpdate = true;
  }, [diskTexture, galaxyTexture, starTexture]);

  const material = useMemo(() => {
    const shaderNode = createLegacyBlackHoleVolumeShader(uniforms, {
      diskTextureNode,
      galaxyTextureNode,
      starTextureNode,
    });
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
  }, [diskTextureNode, galaxyTextureNode, starTextureNode, uniforms]);

  const position = config.blackHolePosition ?? { x: 0, y: 0, z: 0 };
  const metricWorldScale = config.metricWorldScale ?? 1;
  const lensRadius = config.lensDiameter * metricWorldScale * 0.5;

  useEffect(() => {
    const coreRadius =
      config.blackHoleDiameter / Math.max(config.lensDiameter, 0.0001);
    const derivedOuterRadius =
      config.diskDiameter / Math.max(config.blackHoleDiameter, 0.0001);
    const accretionMinRadius =
      config.legacyAccretionMinRadius ?? LEGACY_DEFAULTS.accretionMinRadius;
    const accretionWidth =
      config.legacyAccretionWidth ?? LEGACY_DEFAULTS.accretionWidth;
    const sourceOuterRadius = accretionMinRadius + accretionWidth;
    const radiusScale =
      derivedOuterRadius / Math.max(sourceOuterRadius, 0.0001);

    uniforms.coreRadius.value = Math.min(0.8, Math.max(0.02, coreRadius));
    uniforms.simBoundary.value =
      1 / Math.max(uniforms.coreRadius.value, 0.0001);
    uniforms.accretionMinRadius.value = accretionMinRadius;
    uniforms.accretionWidth.value = accretionWidth;
    uniforms.outerRadius.value = Math.max(2.4, derivedOuterRadius);
    uniforms.innerRadius.value = Math.max(
      1.05,
      accretionMinRadius * radiusScale
    );
    uniforms.gravityStrength.value =
      config.legacyGravityStrength ?? LEGACY_DEFAULTS.gravityStrength;
    uniforms.stepCount.value = Math.max(
      48,
      Math.round(config.legacyStepCount ?? LEGACY_DEFAULTS.stepCount)
    );
    uniforms.diskBrightness.value =
      config.legacyDiskBrightness ?? LEGACY_DEFAULTS.diskBrightness;
    uniforms.diskTemperature.value =
      config.legacyDiskTemperature ?? LEGACY_DEFAULTS.diskTemperature;
    uniforms.dopplerStrength.value =
      config.legacyDopplerStrength ?? LEGACY_DEFAULTS.dopplerStrength;
    uniforms.maxRevolutions.value =
      config.legacyMaxRevolutions ?? LEGACY_DEFAULTS.maxRevolutions;
    uniforms.starBrightness.value =
      config.legacyStarBrightness ?? LEGACY_DEFAULTS.starBrightness;
    uniforms.galaxyBrightness.value =
      config.legacyGalaxyBrightness ?? LEGACY_DEFAULTS.galaxyBrightness;
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
