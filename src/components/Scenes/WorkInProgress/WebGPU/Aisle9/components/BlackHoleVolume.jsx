import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  BLACK_HOLE_BODY_COUNT,
  BlackHoleSimulation,
} from '../utils/blackHoleSimulation';
import { BLACK_HOLE_VOLUME_BOUND } from '../utils/blackHoleVolumeShader';

const DEG_TO_RAD = Math.PI / 180;
const DEFAULT_POSITION = Object.freeze({ x: 0, y: 0, z: 0 });
const DEFAULT_ROTATION = Object.freeze({ x: 0, y: 0, z: 0 });
const DEFAULT_SCALE = Object.freeze({ x: 1, y: 1, z: 1 });

function readBodyConfig(config, index) {
  const n = index + 1;
  return {
    enabled: config[`body${n}Enabled`] ? 1 : 0,
    color: config[`body${n}Color`] ?? '#ffffff',
    radius: config[`body${n}Size`] ?? 1,
    orbitRadius: config[`body${n}OrbitRadius`] ?? 9,
    orbitSpeed: config[`body${n}OrbitSpeed`] ?? 0.5,
    orbitPhase: (config[`body${n}OrbitPhase`] ?? 0) * DEG_TO_RAD,
    height: config[`body${n}Height`] ?? 0,
  };
}

/**
 * Tier 1 black hole: a bounding-sphere mesh whose material raymarches the core,
 * disk, lensing and orbiting bodies in object space. Because it is a real mesh
 * rasterized by the real camera, the full system renders correctly from every
 * camera and scale — fixing the Surveillance / Guided Tour visibility bugs.
 */
const BlackHoleVolume = memo(function BlackHoleVolume({ config }) {
  const { size } = useThree();
  const groupRef = useRef(null);
  const simulation = useMemo(() => new BlackHoleSimulation(config, size), []);
  const geometry = useMemo(
    () => new THREE.SphereGeometry(BLACK_HOLE_VOLUME_BOUND, 48, 48),
    []
  );
  const material = useMemo(
    () => simulation.createVolumeMaterial(),
    [simulation]
  );

  const position = config.blackHolePosition ?? DEFAULT_POSITION;
  const rotation = config.blackHoleRotation ?? DEFAULT_ROTATION;
  const scale = config.blackHoleScale ?? DEFAULT_SCALE;

  // In store mode the hole must be transparent where rays escape so the store
  // shows through; in space mode escaped rays paint the lensed star/nebula
  // background. Mirrors the legacy compositor's config massaging.
  const blackHoleConfig = useMemo(
    () =>
      config.presentationMode === 'storeWarp'
        ? {
            ...config,
            starsEnabled: false,
            nebulaEnabled: false,
            backgroundOpacity: 0,
            starBackgroundColor: '#000000',
          }
        : { ...config, backgroundOpacity: 1 },
    [config]
  );

  useEffect(() => {
    simulation.updateUniforms(blackHoleConfig);
  }, [blackHoleConfig, simulation]);

  useEffect(() => {
    simulation.onResize(size.width, size.height);
  }, [simulation, size.height, size.width]);

  useEffect(() => {
    return () => {
      material.dispose();
      geometry.dispose();
    };
  }, [geometry, material]);

  useFrame((state, deltaTime) => {
    const uniforms = simulation.uniforms;
    uniforms.time.value += deltaTime;

    // Is the camera inside the bounding volume? Drives ray seeding + face side.
    const maxScale = Math.max(scale.x ?? 1, scale.y ?? 1, scale.z ?? 1);
    const worldBound = BLACK_HOLE_VOLUME_BOUND * maxScale;
    const dx = state.camera.position.x - (position.x ?? 0);
    const dy = state.camera.position.y - (position.y ?? 0);
    const dz = state.camera.position.z - (position.z ?? 0);
    const inside = dx * dx + dy * dy + dz * dz < worldBound * worldBound;
    uniforms.cameraInside.value = inside ? 1 : 0;
    material.side = inside ? THREE.BackSide : THREE.FrontSide;

    const time = uniforms.time.value;
    for (let index = 0; index < BLACK_HOLE_BODY_COUNT; index += 1) {
      const body = readBodyConfig(config, index);
      const target = uniforms.bodies[index];
      target.enabled.value = body.enabled;
      target.radius.value = body.radius;
      target.color.value.set(body.color);

      const angle = time * body.orbitSpeed + body.orbitPhase;
      target.position.value.set(
        Math.cos(angle) * body.orbitRadius,
        body.height,
        Math.sin(angle) * body.orbitRadius
      );
    }
  });

  return (
    <group
      ref={groupRef}
      position={[position.x ?? 0, position.y ?? 0, position.z ?? 0]}
      rotation={[
        (rotation.x ?? 0) * DEG_TO_RAD,
        (rotation.y ?? 0) * DEG_TO_RAD,
        (rotation.z ?? 0) * DEG_TO_RAD,
      ]}
      scale={[scale.x ?? 1, scale.y ?? 1, scale.z ?? 1]}
    >
      <mesh geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
});

export default BlackHoleVolume;
