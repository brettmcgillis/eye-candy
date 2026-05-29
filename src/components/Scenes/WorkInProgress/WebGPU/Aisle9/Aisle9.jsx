import React from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import PostEffects from './components/PostEffects';
import SevenElevenStage from './components/SevenElevenStage';
import useSceneControls from './hooks/useSceneControls';

export default function Aisle9() {
  const config = useSceneControls();
  const isStoreWarp = config.presentationMode === 'storeWarp';
  const { cameraPosition, cameraTarget } = config;

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={config.cameraFov}
        near={config.cameraNear}
        far={config.cameraFar}
        position={[cameraPosition.x, cameraPosition.y, cameraPosition.z]}
      />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={config.cameraDampingFactor}
        rotateSpeed={config.cameraRotateSpeed}
        minDistance={config.cameraMinDistance}
        maxDistance={config.cameraMaxDistance}
        target={[cameraTarget.x, cameraTarget.y, cameraTarget.z]}
      />

      <color attach="background" args={[config.starBackgroundColor]} />

      <ambientLight intensity={0.85} color="#f5f0e8" />
      <pointLight
        color="#ffd089"
        intensity={260}
        distance={40}
        decay={1.6}
        position={[0, 0, 0]}
      />
      <directionalLight
        color="#e7f2ff"
        intensity={1.75}
        position={[18, 12, 10]}
      />

      {isStoreWarp ? (
        <SevenElevenStage
          storeScale={config.storeScale}
          storePosition={config.storePosition}
          storeRotation={config.storeRotation}
        />
      ) : null}

      <PostEffects config={config} />
    </>
  );
}
