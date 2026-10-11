import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import createLegacyBlackHoleVolumeShader from '../shaders/createLegacyBlackHoleVolumeShader';
import { createLegacyUniforms, syncLegacyUniforms } from './legacyUniforms';

const LEGACY_DISK_TEXTURE_PATH =
  '/textures/blackhole/legacy-accretion-disk.png';
const LEGACY_GALAXY_TEXTURE_PATH = '/textures/blackhole/legacy-milkyway.jpg';
const LEGACY_STAR_TEXTURE_PATH = '/textures/blackhole/legacy-stars.png';

const LegacyBlackHole = memo(function LegacyBlackHole({ config }) {
  const [diskTexture, galaxyTexture, starTexture] = useTexture([
    LEGACY_DISK_TEXTURE_PATH,
    LEGACY_GALAXY_TEXTURE_PATH,
    LEGACY_STAR_TEXTURE_PATH,
  ]);
  const uniforms = useMemo(() => createLegacyUniforms(config), []);
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
    syncLegacyUniforms(uniforms, config);
  }, [config, uniforms]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Shared clock: BlackHoleLight mounts before this suspends on textures.
  useFrame((state) => {
    uniforms.time.value = state.clock.elapsedTime;
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
