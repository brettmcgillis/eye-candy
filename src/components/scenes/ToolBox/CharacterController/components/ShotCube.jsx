import * as THREE from 'three';

import React, { useEffect, useRef, useState } from 'react';

import { useThree } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';

function ShotCubeInstance({ position, velocity }) {
  return (
    <RigidBody
      position={position}
      linearVelocity={velocity}
      mass={0.6}
      colliders="cuboid"
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </RigidBody>
  );
}

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
      const velocity = [dir.x * 20, dir.y * 20 + 2, dir.z * 20];
      setCubes((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), position, velocity },
      ]);
      onFireRef.current?.(position, [dir.x, dir.y, dir.z]);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      {cubes.map((cube) => (
        <ShotCubeInstance
          key={`local-${cube.id}`}
          position={cube.position}
          velocity={cube.velocity}
        />
      ))}
      {remoteShots.map((shot) => (
        <ShotCubeInstance
          key={`remote-${shot.id}`}
          position={shot.position}
          velocity={[
            shot.direction[0] * 20,
            shot.direction[1] * 20 + 2,
            shot.direction[2] * 20,
          ]}
        />
      ))}
    </>
  );
}
