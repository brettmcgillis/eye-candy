import * as THREE from 'three';

import React, { useMemo } from 'react';

import {
  MeshReflectorMaterial,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';

import Candle from './components/Candle';
import useSceneControls from './hooks/useSceneControls';

export default function BurningAtBothEnds() {
  const config = useSceneControls();
  const {
    backgroundColor,
    ambientLightIntensity,
    bloomEnabled,
    bloomIntensity,
    bloomLuminanceThreshold,
    bloomLuminanceSmoothing,
    bloomRadius,
  } = config;
  const candleY = 1.5;
  const candlePosition = [0, candleY, 0];
  const cameraFrame = useMemo(() => {
    const flameTipOffset = 2.35;
    const halfSceneHeight = config.height / 2 + flameTipOffset;
    const framedHeight = halfSceneHeight * 2 * 1.08;
    const fov = 42;
    const fovRadians = THREE.MathUtils.degToRad(fov);
    const distance = framedHeight / (2 * Math.tan(fovRadians / 2));
    const targetY = candleY;
    const cameraYOffset = Math.max(0.75, config.height * 0.12);

    return {
      fov,
      position: [0, targetY + cameraYOffset, distance + 3],
      target: [0, targetY, 0],
      minDistance: Math.max(8, distance * 0.72),
      maxDistance: Math.max(28, distance * 1.8),
    };
  }, [candleY, config.height]);
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
        position={cameraFrame.position}
        fov={cameraFrame.fov}
        onUpdate={(self) => self.lookAt(...cameraFrame.target)}
      />
      <OrbitControls
        makeDefault
        autoRotate={config.autoRotate}
        target={cameraFrame.target}
        minDistance={cameraFrame.minDistance}
        maxDistance={cameraFrame.maxDistance}
      />
      <ambientLight intensity={ambientLightIntensity} />
      <hemisphereLight
        skyColor="#8ea0b5"
        groundColor="#1a1410"
        intensity={0.15}
      />
      <directionalLight
        position={[3.5, 7, 5.5]}
        intensity={0.5}
        color="#fff2de"
      />

      <mesh renderOrder={-10} rotation-x={-Math.PI / 2} position={[0, -5, 0]}>
        <circleGeometry args={[25, 128]} />
        <MeshReflectorMaterial
          blur={[64, 24]}
          resolution={1024}
          mirror={0.52}
          mixBlur={0.35}
          mixStrength={72}
          roughness={0.08}
          depthScale={1}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.6}
          color={config.groundPlaneColor ?? '#111111'}
          metalness={0.8}
          transparent
          alphaTest={0.02}
          depthWrite={false}
          alphaMap={floorAlphaMap}
        />
      </mesh>

      <Candle config={config} position={candlePosition} />

      {bloomEnabled && (
        <EffectComposer disableNormalPass>
          <Bloom
            intensity={bloomIntensity}
            luminanceThreshold={bloomLuminanceThreshold}
            luminanceSmoothing={bloomLuminanceSmoothing}
            mipmapBlur
            radius={bloomRadius}
          />
        </EffectComposer>
      )}
    </>
  );
}
