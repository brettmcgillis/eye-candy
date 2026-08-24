import { memo, useEffect } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three';

function SceneBackground({ backgroundColor }) {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const previousBackground = scene.background;
    scene.background = new THREE.Color(backgroundColor);

    return () => {
      scene.background = previousBackground;
    };
  }, [scene, backgroundColor]);

  return null;
}

export default memo(SceneBackground);
