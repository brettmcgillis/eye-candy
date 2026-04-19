import * as THREE from 'three';

import { useEffect, useRef, useState } from 'react';

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

export default function ShotCube() {
  const { camera } = useThree();
  const [cubes, setCubes] = useState([]);

  // Keep a stable ref to camera so the click handler never goes stale
  const cameraRef = useRef(camera);
  useEffect(() => {
    cameraRef.current = camera;
  });

  useEffect(() => {
    const dir = new THREE.Vector3();

    const handleClick = () => {
      const cam = cameraRef.current;
      cam.getWorldDirection(dir);
      setCubes((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          position: [cam.position.x, cam.position.y - 0.5, cam.position.z],
          direction: [dir.x, dir.y, dir.z],
        },
      ]);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      {cubes.map((cube) => (
        <Cube key={cube.id} position={cube.position} direction={cube.direction} />
      ))}
    </>
  );
}
