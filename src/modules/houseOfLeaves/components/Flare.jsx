import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

// A dropped road flare: a dull cylinder body with one burning end. The body is
// deliberately small — what reads in frame is the spill, never the object.
function Flare({
  bodyColor = '#2b2724',
  color = '#ff3a1e',
  flicker = 0.5,
  glow = 3,
  intensity = 12,
  length = 0.34,
  position = [0, 0, 0],
  radius = 0.035,
  range = 12,
  seed = 0,
  shadows = true,
  shadowMapSize = 512,
  tilt = 0,
}) {
  const lightRef = useRef(null);
  const capRef = useRef(null);

  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardNodeMaterial({
        color: new THREE.Color(bodyColor),
        metalness: 0,
        roughness: 0.9,
      }),
    []
  );
  const capMaterial = useMemo(
    () => new THREE.MeshBasicNodeMaterial({ toneMapped: false }),
    []
  );

  useEffect(
    () => () => {
      bodyMaterial.dispose();
      capMaterial.dispose();
    },
    [bodyMaterial, capMaterial]
  );

  useEffect(() => {
    bodyMaterial.color.set(bodyColor);
  }, [bodyColor, bodyMaterial]);

  useEffect(() => {
    capMaterial.color.set(color).multiplyScalar(glow);
  }, [capMaterial, color, glow]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const wobble =
      1 -
      flicker *
        0.5 *
        (1 + Math.sin(t * 17 + seed * 2.7) * Math.sin(t * 6.3 + seed));
    if (lightRef.current) lightRef.current.intensity = intensity * wobble;
    if (capRef.current) {
      const s = 0.85 + 0.3 * wobble;
      capRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={position} rotation={[0, seed, 0]}>
      {/* Dropped, not planted: the body lies on its side on the floor. */}
      <group position={[0, radius, 0]} rotation={[0, 0, Math.PI / 2 + tilt]}>
        <mesh castShadow material={bodyMaterial}>
          <cylinderGeometry args={[radius, radius, length, 10]} />
        </mesh>
        <mesh
          material={capMaterial}
          position={[0, length * 0.5, 0]}
          ref={capRef}
        >
          <sphereGeometry args={[radius * 1.25, 8, 6]} />
        </mesh>
      </group>
      {/* Without a shadow map the flare lights straight through landings and
          walls, which is what breaks the illusion of solid architecture. */}
      <pointLight
        castShadow={shadows}
        color={color}
        decay={2}
        distance={range}
        intensity={intensity}
        position={[length * 0.5, radius * 1.4, 0]}
        ref={lightRef}
        shadow-bias={-0.004}
        shadow-camera-far={Math.max(1, range)}
        shadow-camera-near={0.05}
        shadow-mapSize-height={shadowMapSize}
        shadow-mapSize-width={shadowMapSize}
      />
    </group>
  );
}

export default memo(Flare);
