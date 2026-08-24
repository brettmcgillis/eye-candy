import { memo, useEffect } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three';

function SceneEnvironment({ environment }) {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const previousBackground = scene.background;
    const previousFog = scene.fog;

    scene.background = new THREE.Color(environment.backgroundColor);
    scene.fog = new THREE.FogExp2(environment.fogColor, environment.fogDensity);

    return () => {
      scene.background = previousBackground;
      scene.fog = previousFog;
    };
  }, [
    scene,
    environment.backgroundColor,
    environment.fogColor,
    environment.fogDensity,
  ]);

  return null;
}

export default memo(SceneEnvironment);
