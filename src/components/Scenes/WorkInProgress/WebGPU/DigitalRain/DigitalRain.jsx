import React, { memo, useMemo } from 'react';

import AngularFlowField from '../../../../elements/AngularFlowField/AngularFlowField';
import { mapAngularFlowFieldProps } from '../../../../elements/AngularFlowField/getAngularFlowFieldControls';
import CameraRig from '../../../../rigging/CameraRig';
import CloudVolume from './components/CloudVolume';
import LightRig from './components/LightRig';
import PhotoBackdrop from './components/PhotoBackdrop';
import VoxelCloud from './components/VoxelCloud';
import VoxelCutout from './components/VoxelCutout';
import useCloudField from './hooks/useCloudField';
import useSceneControls from './hooks/useSceneControls';

// VoxelCloud (a port of ~/dev/examples/clouds's voxel-cloud approach —
// Perlin-inflated voxel field -> marching cubes -> toon shading) is the
// active cloud. CloudVolume/VoxelCutout (the earlier raymarched attempt +
// its cutout) are kept wired in but hidden by default (cloudVisible/
// voxelVisible off) for comparison rather than deleted. Angular flow-field
// rain falls from VoxelCloud's base, shot against a photo-backdrop sweep.
// See todo.md.
function DigitalRain() {
  const config = useSceneControls();
  const field = useCloudField(config);

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
      <PhotoBackdrop config={config} />
      {config.cloudVisible && <CloudVolume field={field} config={config} />}
      {config.voxelVisible && <VoxelCutout field={field} config={config} />}
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
