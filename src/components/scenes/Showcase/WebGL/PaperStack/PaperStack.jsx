import * as THREE from 'three';

import React, { useCallback, useMemo } from 'react';

import {
  AccumulativeShadows,
  OrbitControls,
  PerspectiveCamera,
  RandomizedLight,
} from '@react-three/drei';

import Chips from './components/Chips';
import Stack from './components/Stack';
import useCameraLayout from './hooks/useCameraLayout';
import useSceneAnimation from './hooks/useSceneAnimation';
import useSceneControls from './hooks/useSceneControls';

export default function PaperStack() {
  const config = useSceneControls();
  const { cameraPos, orbitTarget } = useCameraLayout(config);

  const makeMaterials = useCallback(
    () =>
      config.colors.map(
        (c) =>
          new THREE.MeshStandardMaterial({
            color: c,
            side: THREE.DoubleSide,
            roughness: 0.92,
            metalness: 0,
            envMapIntensity: 0.2,
          })
      ),
    [config.colors]
  );

  const stackMaterials = useMemo(makeMaterials, [makeMaterials]);
  const chipsMaterials = useMemo(makeMaterials, [makeMaterials]);

  useSceneAnimation({
    ...config.animation,
    stackMaterials,
    chipsMaterials,
    colors: config.colors,
  });

  return (
    <>
      <color attach="background" args={[config.scene.backgroundColor]} />
      <ambientLight intensity={config.scene.ambientIntensity} />
      <PerspectiveCamera makeDefault position={cameraPos} fov={45} />
      <OrbitControls
        makeDefault
        target={orbitTarget}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
      />

      <AccumulativeShadows
        temporal
        frames={config.shadows.accumFrames}
        color={config.shadows.accumColor}
        colorBlend={config.shadows.accumColorBlend}
        opacity={config.shadows.accumOpacity}
        scale={config.shadows.accumScale}
        alphaTest={config.shadows.accumAlphaTest}
        position={config.shadows.accumPosition}
      >
        <RandomizedLight
          amount={config.shadows.lightAmount}
          radius={config.shadows.lightRadius}
          ambient={config.shadows.lightAmbient}
          position={config.shadows.lightPosition}
          bias={config.shadows.lightBias}
        />
      </AccumulativeShadows>
      {config.shadows.lightDebug && (
        <mesh position={config.shadows.lightPosition}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ff0000" wireframe />
        </mesh>
      )}

      <Stack config={config} materials={stackMaterials} />
      <Chips config={config} materials={chipsMaterials} />
    </>
  );
}
