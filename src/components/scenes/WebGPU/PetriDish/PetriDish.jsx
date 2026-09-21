import React, { memo, useCallback, useMemo, useRef, useState } from 'react';

import * as THREE from 'three/webgpu';

import BedContainer from '@elements/BedContainer/BedContainer';
import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { PostRig } from '@modules/postRig';
import { createBedPolygon } from '@utils/regularPolygon';

import SandField from './components/SandField';
import Studio from './components/Studio';
import useSceneControls from './hooks/useSceneControls';
import createFocusPicker from './utils/focusPicker';

function PetriDish() {
  const config = useSceneControls();

  useSceneBackdrop({
    color: config.backgroundColor,
    fogFar: config.fogFar,
    fogNear: config.fogNear,
  });

  // World space, unlike the layout's unit outline: the container is real
  // geometry, so it has to follow bedRadius rather than be scaled by it.
  const containerShape = useMemo(
    () =>
      createBedPolygon({
        bedRotation: config.bedRotation,
        bedShape: config.bedShape,
        bedSize: 1,
        worldSize: config.bedRadius * 2,
      }),
    [config.bedRadius, config.bedRotation, config.bedShape]
  );

  // Godrays raymarch this light's shadow map, so PostRig needs the live
  // instance. A disabled slot unmounts rather than lingering at zero
  // intensity, so this has to be state rather than a ref — a ref would never
  // re-trigger the rebuild that picks the light up.
  //
  // The identity has to stay stable between light changes: PostRig keeps
  // `lights` in the dependency array of the effect that builds its
  // RenderPipeline, so a fresh object each render rebuilds the whole pipeline
  // on every Leva edit and flashes the frame.
  const [keyLight, setKeyLight] = useState(null);
  const handleLightChange = useCallback((slotId, light) => {
    if (slotId === 'key') setKeyLight(light);
  }, []);
  const lights = useMemo(() => ({ key: keyLight }), [keyLight]);

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
      <LightingRig
        lighting={config.lighting}
        onLightChange={handleLightChange}
      />
      <Studio config={config} />
      {config.containerEnabled ? (
        <BedContainer
          config={config}
          floor={config.bedBaseY - config.bedThickness - config.containerDrop}
          rim={config.bedBaseY + config.fieldHeightScale + config.containerRim}
          shadows
          shape={containerShape}
        />
      ) : null}
      <SandField config={config} dropTargetRef={dropTargetRef} />
      <PostRig
        focusTarget={dropTargetRef}
        lights={lights}
        post={config.post}
        resolveFocusPoint={resolveFocusPoint}
        values={config}
      />
    </>
  );
}

export default memo(PetriDish);
