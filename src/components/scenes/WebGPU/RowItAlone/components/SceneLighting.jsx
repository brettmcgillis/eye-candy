import React, { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const SUN_DISTANCE = 60;

export default function SceneLighting({ lighting, runtimeRef }) {
  const sunRef = useRef();

  useFrame(() => {
    const sun = runtimeRef?.current?.oceanManager?.sun;

    if (!sun || !sunRef.current) {
      return;
    }

    sunRef.current.position.copy(sun).multiplyScalar(SUN_DISTANCE);
  });

  return (
    <>
      <hemisphereLight
        args={[lighting.skyColor, lighting.groundColor, lighting.hemisphere]}
      />
      <directionalLight
        castShadow
        color={lighting.sunColor}
        intensity={lighting.sun}
        ref={sunRef}
        shadow-camera-bottom={-10}
        shadow-camera-far={200}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
    </>
  );
}
