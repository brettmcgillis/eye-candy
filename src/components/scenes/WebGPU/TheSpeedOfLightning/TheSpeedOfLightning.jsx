import React, { memo, useCallback, useMemo, useRef, useState } from 'react';

import * as THREE from 'three/webgpu';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { PostRig } from '@modules/postRig';

import GrainField from './components/GrainField';
import Studio from './components/Studio';
import useSceneControls from './hooks/useSceneControls';
import createFocusPicker from './utils/focusPicker';

// One pool of sand grains is the whole scene: some rest as the bed, some
// accrete grain-by-grain into a stepped leader, and the ones the shock ring
// passes get thrown. Roles are state in a single storage buffer drawn by a
// single material, so bolt, bed and ejecta cannot drift apart in look or speed.
//
// Post-processing goes through PostRig rather than the standalone Bloom/Godrays
// components: those each own a RenderPipeline at useFrame priority 1, so only
// one of them can ever render.
function TheSpeedOfLightning() {
  const config = useSceneControls();
  const [spotLight, setSpotLight] = useState(null);
  const boltTipRef = useRef(new THREE.Vector3(0, 0, 0));
  const trunkRef = useRef(null);

  const handleLightChange = useCallback((slotId, light) => {
    if (slotId === 'spot') {
      setSpotLight(light);
    }
  }, []);

  const lights = useMemo(() => ({ spot: spotLight }), [spotLight]);

  const resolveFocusPoint = useMemo(
    () =>
      createFocusPicker({
        groundY: config.bedBaseY,
        trunkRef,
      }),
    [config.bedBaseY]
  );

  return (
    <>
      <CameraRig
        camera={config.camera}
        followDamping={config.followBoltDamping}
        followEnabled={config.followBoltTip}
        followTarget={boltTipRef}
      />
      <color attach="background" args={[config.backgroundColor]} />
      <fog
        attach="fog"
        args={[config.backgroundColor, config.fogNear, config.fogFar]}
      />
      <LightingRig
        lighting={config.lighting}
        onLightChange={handleLightChange}
      />
      <Studio config={config} />
      <GrainField config={config} focusRef={boltTipRef} trunkRef={trunkRef} />
      <PostRig
        focusTarget={boltTipRef}
        lights={lights}
        post={config.post}
        resolveFocusPoint={resolveFocusPoint}
        values={config}
      />
    </>
  );
}

export default memo(TheSpeedOfLightning);
