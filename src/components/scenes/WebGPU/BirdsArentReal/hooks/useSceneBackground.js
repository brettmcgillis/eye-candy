import { useEffect, useRef } from 'react';

import { useEnvironment } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import * as THREE from 'three';

/**
 * Owns `scene.background` in ONE place. Letting drei's <Environment background> manage
 * it AND a conditional <color attach="background"> fight over scene.background races on
 * toggle (black flash) and leaves the city skybox stuck visible after a few preset
 * switches. So <Environment> does IBL only and this hook sets the background outright:
 * the city env map when `envBackground`, otherwise a flat `skyColor`.
 */
export default function useSceneBackground(envBackground, skyColor) {
  const scene = useThree((s) => s.scene);
  const cityEnv = useEnvironment({ preset: 'city' });
  const bgColorRef = useRef(new THREE.Color());

  useEffect(() => {
    scene.background = envBackground
      ? cityEnv
      : bgColorRef.current.set(skyColor);
  }, [scene, cityEnv, envBackground, skyColor]);
}
