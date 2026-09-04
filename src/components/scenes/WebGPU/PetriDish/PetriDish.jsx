import React, { memo, useMemo, useRef } from 'react';

import * as THREE from 'three/webgpu';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { PostRig } from '@modules/postRig';

import SandField from './components/SandField';
import Studio from './components/Studio';
import useSceneControls from './hooks/useSceneControls';
import createFocusPicker from './utils/focusPicker';

// PostRig keeps `lights` in the dependency array of the effect that builds its
// RenderPipeline, and its own default for that prop is a fresh `{}` each
// render — which rebuilds the whole pipeline on every Leva edit and flashes the
// frame. This scene has no godrays and so needs no lights, but it still has to
// hand over one stable object.
const NO_LIGHTS = {};

function PetriDish() {
  const config = useSceneControls();

  // Where the most recent seed drop landed. SandField writes it, the camera
  // follows it and depth of field focuses it, so `target` mode on both rigs
  // tracks the same event.
  const dropTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  // Stable identity: PostRig re-attaches its pointerdown listener whenever
  // this changes.
  const resolveFocusPoint = useMemo(
    () => createFocusPicker({ groundY: config.bedBaseY }),
    [config.bedBaseY]
  );

  return (
    <>
      <CameraRig
        camera={config.camera}
        followDamping={config.followDropDamping}
        followEnabled={config.followDrop}
        followTarget={dropTargetRef}
      />
      <color attach="background" args={[config.backgroundColor]} />
      <fog
        attach="fog"
        args={[config.backgroundColor, config.fogNear, config.fogFar]}
      />
      <LightingRig lighting={config.lighting} />
      <Studio config={config} />
      <SandField config={config} dropTargetRef={dropTargetRef} />
      <PostRig
        focusTarget={dropTargetRef}
        lights={NO_LIGHTS}
        post={config.post}
        resolveFocusPoint={resolveFocusPoint}
        values={config}
      />
    </>
  );
}

export default memo(PetriDish);
