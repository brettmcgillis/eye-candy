import React, { memo, useMemo } from 'react';

import * as THREE from 'three/webgpu';

import { CameraRig } from '@modules/cameraRig';
import { PostRig } from '@modules/postRig';

import Fibers from './components/Fibers';
import ShaderPlate from './components/ShaderPlate';
import useSceneControls from './hooks/useSceneControls';
import CAMERA from './utils/camera';

function Strings() {
  const config = useSceneControls();
  const isFibers = config.renderMode === 'fibers';
  const focusTarget = useMemo(
    () => new THREE.Vector3(...CAMERA.orbit.desktop.target),
    []
  );

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={[config.backgroundColor]} />
      {isFibers ? <Fibers config={config} /> : <ShaderPlate config={config} />}
      {isFibers && (
        <PostRig focusTarget={focusTarget} post={config.post} values={config} />
      )}
    </>
  );
}

export default memo(Strings);
