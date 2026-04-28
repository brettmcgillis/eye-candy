import * as THREE from 'three';

import React, { useEffect, useRef, useState } from 'react';

import { useThree } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';

function Cube({ position, direction }) {
  const rb = useRef();

  useEffect(() => {
    if (!rb.current) return;
    rb.current.setLinvel(
      { x: direction[0] * 20, y: direction[1] * 20 + 2, z: direction[2] * 20 },
      true
    );
  }, []);

  return (
    <RigidBody ref={rb} mass={0.6} position={position}>
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
  useEffect(() => { cameraRef.current = camera; });
  useEffect(() => { onFireRef.current = onFire; });

  useEffect(() => {
    const dir = new THREE.Vector3();

    const handleClick = () => {
      const cam = cameraRef.current;
      cam.getWorldDirection(dir);
      const position = [cam.position.x, cam.position.y - 0.5, cam.position.z];
      const direction = [dir.x, dir.y, dir.z];
      setCubes((prev) => [...prev, { id: Date.now() + Math.random(), position, direction }]);
      onFireRef.current?.(position, direction);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      {cubes.map((cube) => (
        <Cube key={cube.id} position={cube.position} direction={cube.direction} />
      ))}
      {remoteShots.map((shot) => (
        <Cube key={shot.id} position={shot.position} direction={shot.direction} />
      ))}
    </>
  );
}
