import * as THREE from 'three';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useThree } from '@react-three/fiber';
import { InstancedRigidBodies } from '@react-three/rapier';

export default function ShotCube({ onFire, remoteShots = [] }) {
  const { camera } = useThree();
  const [cubes, setCubes] = useState([]);

  const cameraRef = useRef(camera);
  const onFireRef = useRef(onFire);
  useEffect(() => {
    cameraRef.current = camera;
  });
  useEffect(() => {
    onFireRef.current = onFire;
  });

  useEffect(() => {
    const dir = new THREE.Vector3();

    const handleClick = () => {
      const cam = cameraRef.current;
      cam.getWorldDirection(dir);
      const position = [cam.position.x, cam.position.y - 0.5, cam.position.z];
      const direction = [dir.x, dir.y, dir.z];
      setCubes((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), position, direction },
      ]);
      onFireRef.current?.(position, direction);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const shotInstances = useMemo(
    () => [
      ...cubes.map((cube) => ({
        key: `local-${cube.id}`,
        position: cube.position,
        linearVelocity: {
          x: cube.direction[0] * 20,
          y: cube.direction[1] * 20 + 2,
          z: cube.direction[2] * 20,
        },
      })),
      ...remoteShots.map((shot) => ({
        key: `remote-${shot.id}`,
        position: shot.position,
        linearVelocity: {
          x: shot.direction[0] * 20,
          y: shot.direction[1] * 20 + 2,
          z: shot.direction[2] * 20,
        },
      })),
    ],
    [cubes, remoteShots]
  );

  return (
    <InstancedRigidBodies
      instances={shotInstances}
      mass={0.6}
      colliders="cuboid"
    >
      <instancedMesh
        castShadow
        receiveShadow
        args={[null, null, shotInstances.length]}
      >
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="orange" />
      </instancedMesh>
    </InstancedRigidBodies>
  );
}
