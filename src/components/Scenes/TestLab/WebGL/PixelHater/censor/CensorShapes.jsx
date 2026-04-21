import React from 'react';

import Censor from './Censor';
import VoxelCensor from './VoxelCensor';
import VoxelInstancedCensor from './VoxelInstancedCensor';
import VoxelInteriorCensor from './VoxelInteriorCensor';

export default function CensorShapes({
  effectShape,
  pixelSize,
  refraction,
  planeWidth,
  planeHeight,
  voxelMode,
  voxelSize,
  voxelSteps,
  cornerRadius,
  insideOnly,
}) {
  const isVoxelMode = voxelMode !== 'pixel';
  let CensorComponent = Censor;
  if (isVoxelMode) {
    if (voxelMode === 'voxelInstanced') {
      CensorComponent = VoxelInstancedCensor;
    } else if (voxelMode === 'voxelInterior') {
      CensorComponent = VoxelInteriorCensor;
    } else {
      CensorComponent = VoxelCensor;
    }
  }

  let variantProps = {};
  if (isVoxelMode) {
    if (voxelMode === 'voxelInstanced') {
      variantProps = { voxelSize };
    } else if (voxelMode === 'voxelInterior') {
      variantProps = { voxelSize, cornerRadius, insideOnly };
    } else {
      variantProps = {
        mode: voxelMode,
        voxelSize,
        voxelSteps,
      };
    }
  }
  const sharedCensorProps = isVoxelMode
    ? {
        pixelSize,
        ...variantProps,
      }
    : {
        pixelSize,
        refraction,
      };

  return (
    <>
      {effectShape === 'Plane' && (
        <CensorComponent {...sharedCensorProps}>
          <planeGeometry args={[planeWidth, planeHeight]} />
        </CensorComponent>
      )}
      {effectShape === 'TwoPanes' && (
        <>
          <CensorComponent {...sharedCensorProps} position={[0.5, 0.5, 0]}>
            <planeGeometry args={[1, 1]} />
          </CensorComponent>
          <CensorComponent {...sharedCensorProps} position={[-0.5, -0.5, 0]}>
            <planeGeometry args={[1, 1]} />
          </CensorComponent>
        </>
      )}
      {effectShape === 'Cube' && (
        <CensorComponent {...sharedCensorProps}>
          <boxGeometry args={[1, 1, 1]} />
        </CensorComponent>
      )}
      {effectShape === 'Cubes' && (
        <CensorComponent
          {...sharedCensorProps}
          clipOffset={0.5}
          position={[0, 0, 1]}
        >
          <boxGeometry args={[1, 1, 1]} />
        </CensorComponent>
      )}
      {effectShape === 'Torus' && (
        <CensorComponent {...sharedCensorProps}>
          <torusGeometry args={[0.5, 0.15, 16, 100]} />
        </CensorComponent>
      )}
      {effectShape === 'Sphere' && (
        <CensorComponent {...sharedCensorProps}>
          <sphereGeometry args={[0.4, 32, 32]} />
        </CensorComponent>
      )}
      {effectShape === 'Knot' && (
        <CensorComponent {...sharedCensorProps}>
          <torusKnotGeometry args={[0.5, 0.1, 100, 16]} />
        </CensorComponent>
      )}
    </>
  );
}
