import * as THREE from 'three';

import React, { useMemo } from 'react';

import {
  MeshReflectorMaterial,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';

import Candle from './components/Candle';
import useSceneControls from './hooks/useSceneControls';

export default function BurningAtBothEnds() {
  const config = useSceneControls();
  const { backgroundColor, ambientLightIntensity } = config;
  const floorAlphaMap = useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.72, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  return (
    <>
      <color attach="background" args={[backgroundColor]} />
      <PerspectiveCamera
        makeDefault
        position={[0, 7, 14]}
        fov={42}
        onUpdate={(self) => self.lookAt(0, 1.5, 0)}
      />
      <OrbitControls
        makeDefault
        target={[0, 1.5, 0]}
        minDistance={6}
        maxDistance={28}
      />
      <ambientLight intensity={ambientLightIntensity} />

      <mesh renderOrder={-10} rotation-x={-Math.PI / 2} position={[0, -5, 0]}>
        <circleGeometry args={[25, 128]} />
        <MeshReflectorMaterial
          blur={[200, 80]}
          resolution={1024}
          mixBlur={0.8}
          mixStrength={45}
          roughness={0.2}
          depthScale={1}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.6}
          color="#111111"
          metalness={0.8}
          transparent
          alphaTest={0.02}
          depthWrite={false}
          alphaMap={floorAlphaMap}
        />
      </mesh>

      <Candle config={config} position={[0, 1.5, 0]} />
    </>
  );
}
