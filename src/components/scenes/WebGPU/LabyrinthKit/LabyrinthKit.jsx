import React, { useLayoutEffect, useRef, useState } from 'react';

import * as THREE from 'three/webgpu';

import { GridMaterial } from '@materials/WebGPU/gridMaterial';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import AssembledPreview from './components/AssembledPreview';
import AssetStage from './components/AssetStage';
import ConnectionStage from './components/ConnectionStage';
import CorridorStage from './components/CorridorStage';
import MotionPreview from './components/MotionPreview';
import ToolboxFog from './components/ToolboxFog';
import useSceneControls from './hooks/useSceneControls';

// Toolbox for the House of Leaves constellation: every architectural piece on
// its own, at a fixed camera under neutral light, so a piece can be judged
// before it is composed into a moving scene.
export default function LabyrinthKit() {
  const config = useSceneControls();
  const contentRef = useRef(null);
  const [floorY, setFloorY] = useState(0);

  // Pieces are authored from their top edge downwards, so a stair flight sits
  // entirely below zero. A grid at y=0 would be a plane through the middle of
  // whatever is being inspected — drop it under the asset instead.
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const box = new THREE.Box3().setFromObject(content);
    if (box.isEmpty()) return;
    const next = box.min.y - 0.1;
    setFloorY((current) => (Math.abs(current - next) < 1e-4 ? current : next));
  });

  return (
    <>
      <CameraRig camera={config.camera} />
      <color args={[config.backgroundColor]} attach="background" />
      <LightingRig lighting={config.lighting} />
      <ToolboxFog config={config} />
      {config.showGrid && (
        <mesh position={[0, floorY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[400, 400]} />
          <GridMaterial
            bgColor={config.backgroundColor}
            gridSize={1}
            lineColor="#4a5563"
            lineWidth={0.015}
          />
        </mesh>
      )}
      <group ref={contentRef}>
        {config.kit === 'Connections' && <ConnectionStage config={config} />}
        {config.kit === 'Corridor' && <CorridorStage config={config} />}
        {config.kit === 'Staircase' && (
          <>
            {config.asset === 'Assembled Preview' && (
              <AssembledPreview config={config} />
            )}
            {config.asset === 'Motion Preview' && (
              <MotionPreview config={config} />
            )}
            {config.asset !== 'Assembled Preview' &&
              config.asset !== 'Motion Preview' && (
                <AssetStage config={config} />
              )}
          </>
        )}
      </group>
    </>
  );
}
