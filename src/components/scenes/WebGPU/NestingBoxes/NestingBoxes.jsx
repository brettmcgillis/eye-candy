import React, { useCallback, useMemo, useState } from 'react';

import * as THREE from 'three/webgpu';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { PostRig } from '@modules/postRig';

import BoxTree from './components/BoxTree';
import FogRig from './components/FogRig';
import useSceneControls from './hooks/useSceneControls';
import CAMERA from './utils/camera';

const FOCUS_TARGET = new THREE.Vector3(...CAMERA.orbit.desktop.target);

export default function NestingBoxes() {
  const config = useSceneControls();

  // State, not a ref: godrays can only build once the light exists, and the
  // map's identity must stay stable or PostRig rebuilds on every edit.
  const [keyLight, setKeyLight] = useState(null);
  const handleLightChange = useCallback((slotId, light) => {
    if (slotId === 'key') setKeyLight(light);
  }, []);
  const lights = useMemo(() => ({ key: keyLight }), [keyLight]);

  return (
    <>
      <color attach="background" args={[config.background]} />
      <CameraRig camera={config.camera} />
      <LightingRig
        lighting={config.lighting}
        onLightChange={handleLightChange}
      />
      <FogRig config={config} />
      <BoxTree config={config} />
      <PostRig
        focusTarget={FOCUS_TARGET}
        lights={lights}
        post={config.post}
        values={config}
      />
    </>
  );
}
