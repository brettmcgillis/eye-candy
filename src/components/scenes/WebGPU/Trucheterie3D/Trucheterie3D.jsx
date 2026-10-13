import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { BlobDesignEditor } from '@modules/trucheterieDesigner';

import Tubes from './components/Tubes';
import useSceneControls from './hooks/useSceneControls';

function Trucheterie3D() {
  const config = useSceneControls();

  useSceneBackdrop({ color: config.sceneBgColor });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <Tubes config={config} />
      {config.designApi.design && (
        <group rotation={[0, (config.planeRotation * Math.PI) / 180, 0]}>
          <group rotation={[-Math.PI / 2, 0, 0]}>
            <BlobDesignEditor
              autoConnect={config.designAutoConnect}
              brush={config.designBrush}
              canvasSize={config.blobCanvasSize}
              design={config.designApi.design}
              onChange={config.designApi.onChange}
              onStrokeStart={config.designApi.onStrokeStart}
              tool={config.designTool}
            />
          </group>
        </group>
      )}
    </>
  );
}

export default memo(Trucheterie3D);
