import React, { memo, useMemo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Cells from './components/Cells';
import Plate from './components/Plate';
import useCellGeometry from './hooks/useCellGeometry';
import useGrowClock from './hooks/useGrowClock';
import useMotionUniforms from './hooks/useMotionUniforms';
import usePiece from './hooks/usePiece';
import useSceneControls from './hooks/useSceneControls';

function SubdivisionRelief() {
  const config = useSceneControls();
  const canvas = useMemo(
    () => ({ height: config.height, width: config.width }),
    [config.height, config.width]
  );
  const piece = usePiece(config, canvas);
  const geometry = useCellGeometry(piece, config);
  const grow = useGrowClock(config, piece.maxDepth);
  const motion = useMotionUniforms(config, piece);
  useSceneBackdrop({ color: config.bgColor });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <Plate
        canvas={canvas}
        color={config.plateColor}
        roughness={config.roughness}
      />
      <Cells geometry={geometry} grow={grow} motion={motion} />
    </>
  );
}

export default memo(SubdivisionRelief);
