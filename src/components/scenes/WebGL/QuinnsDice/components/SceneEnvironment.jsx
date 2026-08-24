/* eslint-disable react/no-array-index-key */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { Environment, Lightformer } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import * as THREE from 'three';

import { LIGHTFORMER_CONFIGS } from '../presets/QuinnsDice.sceneSettings';

export const SceneBackground = React.memo(function SceneBackground({
  topColor,
  bottomColor,
}) {
  const { gl, scene } = useThree();
  const textureRef = useRef();

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const nextTexture = new THREE.CanvasTexture(canvas);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    nextTexture.minFilter = THREE.LinearFilter;
    nextTexture.magFilter = THREE.LinearFilter;

    const prevTexture = textureRef.current;
    textureRef.current = nextTexture;
    scene.background = nextTexture;
    gl.setClearColor(bottomColor);

    if (prevTexture) prevTexture.dispose();
  }, [topColor, bottomColor, gl, scene]);

  useLayoutEffect(
    () => () => {
      if (textureRef.current) textureRef.current.dispose();
      textureRef.current = null;
      scene.background = null;
      gl.setClearColor(0x000000, 0);
      gl.clear(true, true, true);
    },
    [gl, scene]
  );

  return null;
});

export const SceneLighting = React.memo(function SceneLighting() {
  return (
    <Environment preset="city" resolution={256}>
      <group rotation={[-Math.PI / 3, 0, 1]}>
        {LIGHTFORMER_CONFIGS.map((config, index) => (
          <Lightformer
            key={`lf-${index}`}
            form="circle"
            intensity={config.intensity}
            position={config.position}
            rotation={config.rotation}
            scale={config.scale}
          />
        ))}
      </group>
    </Environment>
  );
});

export function LightDebugPyramid({ position, target }) {
  const quaternion = useMemo(() => {
    const source = new THREE.Vector3(0, -1, 0);
    const direction = new THREE.Vector3()
      .subVectors(new THREE.Vector3(...target), new THREE.Vector3(...position))
      .normalize();
    return new THREE.Quaternion().setFromUnitVectors(source, direction);
  }, [position, target]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <coneGeometry args={[0.35, 0.8, 4, 1]} />
      <meshBasicMaterial color="#ff0000" wireframe />
    </mesh>
  );
}

export function LightformerDebugPyramid({ position, rotation }) {
  return (
    <mesh position={position} rotation={rotation}>
      <coneGeometry args={[0.25, 0.6, 4, 1]} />
      <meshBasicMaterial color="#00ff00" wireframe />
    </mesh>
  );
}
