import React from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import PostEffects from './components/PostEffects';
import SevenElevenStage from './components/SevenElevenStage';
import useSceneControls from './hooks/useSceneControls';

export default function Aisle9() {
  const config = useSceneControls();
  const isStoreWarp = config.presentationMode === 'storeWarp';

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={config.cameraFov}
        near={config.cameraNear}
        far={config.cameraFar}
        position={[config.cameraX, config.cameraY, config.cameraZ]}
      />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={config.cameraDampingFactor}
        rotateSpeed={config.cameraRotateSpeed}
        minDistance={config.cameraMinDistance}
        maxDistance={config.cameraMaxDistance}
        target={[
          config.cameraTargetX,
          config.cameraTargetY,
          config.cameraTargetZ,
        ]}
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
