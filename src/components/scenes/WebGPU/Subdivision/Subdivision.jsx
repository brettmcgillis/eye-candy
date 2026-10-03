import React, { useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';

import Cells from './components/Cells';
import useCellGeometry from './hooks/useCellGeometry';
import useGrowClock from './hooks/useGrowClock';
import usePiece from './hooks/usePiece';
import useSceneControls from './hooks/useSceneControls';
import { slidesIn } from './utils/cellBuffers';
import { WORLD_SCALE } from './utils/world';

const ORIGIN = new THREE.Vector3();

export default function Subdivision() {
  const config = useSceneControls();
  const width = useThree((state) => Math.round(state.size.width));
  const height = useThree((state) => Math.round(state.size.height));
  const canvas = useMemo(() => ({ height, width }), [height, width]);
  const piece = usePiece(config, canvas);
  const geometry = useCellGeometry(piece, config);
  const grow = useGrowClock(config, piece.maxDepth);
  const groupRef = useRef(null);
  const halfSize = useMemo(
    () =>
      new THREE.Vector2((width / 2) * WORLD_SCALE, (height / 2) * WORLD_SCALE),
    [height, width]
  );
  useSceneBackdrop({ color: config.bgColor });

  useFrame((state) => {
    const view = state.viewport.getCurrentViewport(state.camera, ORIGIN);
    groupRef.current?.scale.setScalar(view.height / (height * WORLD_SCALE));
  });

  return (
    <>
      <CameraRig camera={config.camera} />
      <group ref={groupRef}>
        <Cells
          geometry={geometry}
          grow={grow}
          halfSize={halfSize}
          slide={slidesIn(config)}
        />
      </group>
    </>
  );
}
