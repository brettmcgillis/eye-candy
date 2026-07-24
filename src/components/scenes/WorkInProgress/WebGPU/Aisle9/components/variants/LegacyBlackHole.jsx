import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import createLegacyBlackHoleVolumeShader from '../../utils/createLegacyBlackHoleVolumeShader';

const LEGACY_DEFAULTS = {
  gravityStrength: 1,
  stepCount: 100,
  diskBrightness: 0.9,
  diskTemperature: 8000,
  dopplerStrength: 1,
  accretionMinRadius: 1.5,
  accretionWidth: 5,
  maxRevolutions: 2,
  starBrightness: 1,
  galaxyBrightness: 0.4,
  useProceduralDisk: true,
  diskVariant: 'procedural',
  // Chromatic Rings variant defaults
  chromaticRingFreq: 1.0,
  chromaticAnimSpeed: 1.0,
  chromaticColorSpeed: 0.5,
  chromaticSaturation: 0.45,
  // Ribbon variant defaults
  ribbonRotationSpeed: 0.0,
  ribbonBandScale: 6.0,
  ribbonBiasStrength: 0.05,
};

const DISK_VARIANT_MAP = {
  texture: 0,
  procedural: 1,
  chromatic: 2,
  ribbon: 3,
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
    diskVariant: uniform(
      DISK_VARIANT_MAP[
        config.legacyDiskVariant ?? LEGACY_DEFAULTS.diskVariant
      ] ?? 1
    ),
    chromaticRingFreq: uniform(
      config.legacyChromaticRingFreq ?? LEGACY_DEFAULTS.chromaticRingFreq
    ),
    chromaticAnimSpeed: uniform(
      config.legacyChromaticAnimSpeed ?? LEGACY_DEFAULTS.chromaticAnimSpeed
    ),
    chromaticColorSpeed: uniform(
      config.legacyChromaticColorSpeed ?? LEGACY_DEFAULTS.chromaticColorSpeed
    ),
    chromaticSaturation: uniform(
      config.legacyChromaticSaturation ?? LEGACY_DEFAULTS.chromaticSaturation
    ),
    ribbonRotationSpeed: uniform(
      config.legacyRibbonRotationSpeed ?? LEGACY_DEFAULTS.ribbonRotationSpeed
    ),
    ribbonBandScale: uniform(
      config.legacyRibbonBandScale ?? LEGACY_DEFAULTS.ribbonBandScale
    ),
    ribbonBiasStrength: uniform(
      config.legacyRibbonBiasStrength ?? LEGACY_DEFAULTS.ribbonBiasStrength
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
    useProceduralDisk: uniform(
      (config.legacyUseProceduralDisk ?? LEGACY_DEFAULTS.useProceduralDisk)
        ? 1
        : 0
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
  const lensRadius = config.legacyLensDiameter * metricWorldScale * 0.5;
  const wasInsideRef = useRef(null);

  useEffect(() => {
    const coreRadius =
      config.legacyBlackHoleDiameter /
      Math.max(config.legacyLensDiameter, 0.0001);
    const derivedOuterRadius =
      config.legacyDiskDiameter /
      Math.max(config.legacyBlackHoleDiameter, 0.0001);
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
    const variantNum =
      DISK_VARIANT_MAP[
        config.legacyDiskVariant ?? LEGACY_DEFAULTS.diskVariant
      ] ?? 1;
    uniforms.diskVariant.value = variantNum;
    uniforms.chromaticRingFreq.value =
      config.legacyChromaticRingFreq ?? LEGACY_DEFAULTS.chromaticRingFreq;
    uniforms.chromaticAnimSpeed.value =
      config.legacyChromaticAnimSpeed ?? LEGACY_DEFAULTS.chromaticAnimSpeed;
    uniforms.chromaticColorSpeed.value =
      config.legacyChromaticColorSpeed ?? LEGACY_DEFAULTS.chromaticColorSpeed;
    uniforms.chromaticSaturation.value =
      config.legacyChromaticSaturation ?? LEGACY_DEFAULTS.chromaticSaturation;
    uniforms.ribbonRotationSpeed.value =
      config.legacyRibbonRotationSpeed ?? LEGACY_DEFAULTS.ribbonRotationSpeed;
    uniforms.ribbonBandScale.value =
      config.legacyRibbonBandScale ?? LEGACY_DEFAULTS.ribbonBandScale;
    uniforms.ribbonBiasStrength.value =
      config.legacyRibbonBiasStrength ?? LEGACY_DEFAULTS.ribbonBiasStrength;
    // useProceduralDisk drives the fallback tone-mapping path when diskVariant is absent from presets
    uniforms.useProceduralDisk.value =
      (config.legacyUseProceduralDisk ?? LEGACY_DEFAULTS.useProceduralDisk)
        ? 1
        : 0;
    uniforms.useBackground.value = 0;
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
    if (isInside !== wasInsideRef.current) {
      material.side = isInside ? THREE.BackSide : THREE.FrontSide;
      wasInsideRef.current = isInside;
    }
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
    </group>
  );
});

export default LegacyBlackHole;

useTexture.preload([
  LEGACY_DISK_TEXTURE_PATH,
  LEGACY_GALAXY_TEXTURE_PATH,
  LEGACY_STAR_TEXTURE_PATH,
]);
