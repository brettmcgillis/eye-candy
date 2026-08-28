import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { MAX_FLARES } from '../utils/landings';

const LIGHT_POOL = 6;

function Flares({ config, shaft }) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicNodeMaterial({
        color: new THREE.Color(config.flareColor),
        toneMapped: false,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    material.color.set(config.flareColor).multiplyScalar(config.flareGlow);
  }, [config.flareColor, config.flareGlow, material]);

  const scratch = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      scale: new THREE.Vector3(),
      order: [],
    }),
    []
  );

  useFrame((state) => {
    const mesh = meshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    const { flareData } = shaft.arrays;
    const elapsed = state.clock.elapsedTime;
    const { matrix, position, quaternion, scale, order } = scratch;
    order.length = 0;

    let visible = 0;
    for (let i = 0; i < MAX_FLARES; i += 1) {
      const o = i * 4;
      const intensity = flareData[o + 3];
      if (intensity > 0) {
        const flicker =
          1 -
          config.flareFlicker *
            0.5 *
            (1 +
              Math.sin(elapsed * 17 + i * 2.7) * Math.sin(elapsed * 6.3 + i));
        position.set(flareData[o], flareData[o + 1], flareData[o + 2]);
        scale.setScalar(config.flareSize * (0.85 + 0.3 * flicker));
        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(visible, matrix);
        order.push({
          index: i,
          distance: position.lengthSq(),
          intensity: intensity * flicker,
        });
        visible += 1;
      }
    }

    mesh.count = visible;
    mesh.instanceMatrix.needsUpdate = true;

    order.sort((a, b) => a.distance - b.distance);
    for (let slot = 0; slot < LIGHT_POOL; slot += 1) {
      const light = group.children[slot];
      const entry = order[slot];
      if (entry) {
        const o = entry.index * 4;
        light.position.set(flareData[o], flareData[o + 1], flareData[o + 2]);
        light.intensity = entry.intensity * config.flareLightGain;
        light.distance = config.flareLightRange;
        light.color.set(config.flareColor);
      } else {
        light.intensity = 0;
      }
    }
  });

  return (
    <>
      <instancedMesh
        args={[geometry, material, MAX_FLARES]}
        frustumCulled={false}
        ref={meshRef}
      />
      <group ref={groupRef}>
        {Array.from({ length: LIGHT_POOL }, (_, slot) => (
          <pointLight decay={2} intensity={0} key={slot} />
        ))}
      </group>
    </>
  );
}

export default memo(Flares);
