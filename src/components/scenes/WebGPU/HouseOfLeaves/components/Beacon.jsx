import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

// The light at the end of the hallway: the lit doorway of the living room,
// seen from far down the return corridor long before the room itself is
// drawn. A warm plane standing in the doorway, a point light, and an entry in
// the volumetric so the air ahead glows before the shape resolves.
function Beacon({ config, flares, walker, zone }) {
  const groupRef = useRef(null);
  const entry = useMemo(
    () => ({
      position: new THREE.Vector3(),
      color: new THREE.Color(config.lampColor),
      intensity: 0,
      scatter: 0.6,
    }),
    []
  );
  useEffect(() => flares.add(entry), [entry, flares]);
  useEffect(() => {
    entry.color.set(config.lampColor);
  }, [config.lampColor, entry]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicNodeMaterial({
        color: new THREE.Color(config.lampColor).multiplyScalar(
          config.beaconGlow
        ),
      }),
    [config.beaconGlow, config.lampColor]
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const { anchor } = walker;
    const { frame } = zone;
    group.position.set(
      frame.x - anchor.x,
      frame.y - anchor.y,
      frame.z - anchor.z
    );
    group.rotation.y = frame.rotationY;
    group.getWorldPosition(entry.position);
    entry.position.y += config.startHeight * 0.5;
    entry.intensity = config.beaconIntensity;
  });

  const x = zone.length + config.wallThickness + 0.3;
  return (
    <group ref={groupRef}>
      <group position={[x, 0, 0]}>
        <mesh
          material={material}
          position={[0, config.startHeight * 0.5, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <planeGeometry args={[config.startWidth, config.startHeight]} />
        </mesh>
        <pointLight
          color={config.lampColor}
          decay={2}
          distance={60}
          intensity={config.beaconIntensity}
          position={[-0.5, config.startHeight * 0.6, 0]}
        />
      </group>
    </group>
  );
}

export default memo(Beacon);
