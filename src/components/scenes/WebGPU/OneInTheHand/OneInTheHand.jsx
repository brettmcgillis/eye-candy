import React from 'react';

import { CameraRig } from '@modules/cameraRig';

import Bird from './components/Bird';
import Branch from './components/Branch';
import SceneEnvironment from './components/SceneEnvironment';
import SceneSkeleton from './components/Skeleton';
import useSceneControls from './hooks/useSceneControls';

const SceneContent = React.memo(function SceneContent({ config }) {
  return (
    <>
      <SceneEnvironment
        ambientColor={config.ambientColor}
        ambientIntensity={config.ambientIntensity}
        backgroundColor={config.backgroundColor}
        directionalColor={config.directionalColor}
        directionalIntensity={config.directionalIntensity}
        directionalPosition={config.directionalPosition}
        fogColor={config.fogColor}
        fogFar={config.fogFar}
        fogNear={config.fogNear}
      />
      <SceneSkeleton
        pose={config.skeletonPose}
        position={[
          config.skeletonPosition.x,
          config.skeletonPosition.y,
          config.skeletonPosition.z,
        ]}
        rotation={[
          config.skeletonRotation.x,
          config.skeletonRotation.y,
          config.skeletonRotation.z,
        ]}
        scale={config.skeletonScale}
      />
      <Branch
        position={[
          config.branchPosition.x,
          config.branchPosition.y,
          config.branchPosition.z,
        ]}
        rotation={[
          config.branchRotation.x,
          config.branchRotation.y,
          config.branchRotation.z,
        ]}
        scale={[
          config.branchScale.x,
          config.branchScale.y,
          config.branchScale.z,
        ]}
      />
      <Bird
        animationName={config.bird1Clip}
        color={config.bird1Color}
        model={config.bird1Model}
        position={[
          config.bird1Position.x,
          config.bird1Position.y,
          config.bird1Position.z,
        ]}
        rotation={[
          config.bird1Rotation.x,
          config.bird1Rotation.y,
          config.bird1Rotation.z,
        ]}
        scale={config.bird1Scale}
      />
      <Bird
        animationName={config.bird2Clip}
        color={config.bird2Color}
        model={config.bird2Model}
        position={[
          config.bird2Position.x,
          config.bird2Position.y,
          config.bird2Position.z,
        ]}
        rotation={[
          config.bird2Rotation.x,
          config.bird2Rotation.y,
          config.bird2Rotation.z,
        ]}
        scale={config.bird2Scale}
      />
    </>
  );
});

export default function OneInTheHand() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />
      <SceneContent config={config} />
    </>
  );
}
