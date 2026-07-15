import React, { memo, useMemo } from 'react';

import AngularFlowField from '../../../../elements/AngularFlowField/AngularFlowField';
import { mapAngularFlowFieldProps } from '../../../../elements/AngularFlowField/getAngularFlowFieldControls';
import CameraRig from '../../../../rigging/CameraRig';
import LightRig from './components/LightRig';
import PhotoStudioSet from './components/PhotoStudioSet';
import VoxelCloud from './components/VoxelCloud';
import useSceneControls from './hooks/useSceneControls';

// VoxelCloud (a port of ~/dev/examples/clouds's voxel-cloud approach —
// Perlin-inflated voxel field -> marching cubes -> toon shading) is the
// cloud (the earlier raymarched CloudVolume/VoxelCutout attempt has been
// removed — see todo.md). Angular flow-field rain falls from VoxelCloud's
// base, shot against a photo-backdrop sweep and/or the PhotoStudio model.
function DigitalRain() {
  const config = useSceneControls();

  const rainPosition = useMemo(
    () => [
      config.voxelCloudPosition.x,
      config.voxelCloudPosition.y - config.voxelCloudHeight / 2,
      config.voxelCloudPosition.z,
    ],
    [config.voxelCloudPosition, config.voxelCloudHeight]
  );

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={[config.backgroundColor]} />
      <LightRig config={config} />
      <PhotoStudioSet config={config} />
      {config.voxelCloudVisible && <VoxelCloud config={config} />}
      {config.rainVisible && (
        <AngularFlowField
          {...mapAngularFlowFieldProps(config, 'rain')}
          position={rainPosition}
        />
      )}
    </>
  );
}

export default memo(DigitalRain);
