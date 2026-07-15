import React, { memo, useMemo } from 'react';

import AngularFlowField from '../../../../elements/AngularFlowField/AngularFlowField';
import { mapAngularFlowFieldProps } from '../../../../elements/AngularFlowField/getAngularFlowFieldControls';
import CameraRig from '../../../../rigging/CameraRig';
import LightRig from './components/LightRig';
import PhotoStudioSet from './components/PhotoStudioSet';
import VoxelCloud from './components/VoxelCloud';
import VoxelCloudBlocks from './components/VoxelCloudBlocks';
import useSceneControls from './hooks/useSceneControls';

// VoxelCloud (a port of ~/dev/examples/clouds's voxel-cloud approach —
// Perlin-inflated voxel field -> marching cubes -> toon shading) and
// VoxelCloudBlocks (the same field rendered as one cube per occupied cell)
// are two views of the same cloud. In 'transition' mode both render
// together: VoxelCloud always stays fully intact (it never discards), and
// VoxelCloudBlocks progressively reveals cubes — sized to jut past the
// smooth surface — in cells whose hash <= voxelCloudTransitionAmount (see
// utils/cellReveal.js), so growing patches visibly poke through and break
// up the silhouette instead of cutting holes in the smooth cloud (the
// earlier raymarched CloudVolume/VoxelCutout attempt has been removed — see
// todo.md). Angular flow-field rain falls from the cloud's base, shot
// against a photo-backdrop sweep and/or the PhotoStudio model.
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

  // Blocks-only mode shows every qualifying cell (revealAmount 1, since the
  // per-cell hash is always < 1); transition mode reveals progressively more
  // as voxelCloudTransitionAmount rises. Smooth-only mode doesn't render
  // VoxelCloudBlocks at all, so revealAmount is irrelevant there.
  const revealAmount = useMemo(
    () =>
      config.voxelCloudDisplayMode === 'transition'
        ? config.voxelCloudTransitionAmount
        : 1,
    [config.voxelCloudDisplayMode, config.voxelCloudTransitionAmount]
  );

  const showSmooth = config.voxelCloudDisplayMode !== 'blocks';
  const showBlocks = config.voxelCloudDisplayMode !== 'smooth';

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={[config.backgroundColor]} />
      <LightRig config={config} />
      <PhotoStudioSet config={config} />
      {config.voxelCloudVisible && showSmooth && <VoxelCloud config={config} />}
      {config.voxelCloudVisible && showBlocks && (
        <VoxelCloudBlocks config={config} revealAmount={revealAmount} />
      )}
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
