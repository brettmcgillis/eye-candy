import React, { useCallback, useState } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Floor from './components/Floor';
import FogRig from './components/FogRig';
import Ground from './components/Ground';
import PostEffects from './components/PostEffects';
import SceneBackground from './components/SceneBackground';
import TheatreDriver from './components/TheatreDriver';
import Vehicles from './components/Vehicles';
import useSceneControls from './hooks/useSceneControls';

// A tribute to Mark Klink's 2014 "3D Glitch Notes" (srcxor.org/blog/3d-glitching)
// — his raw-.obj text corruption techniques (cut/paste vertex blocks,
// find-and-replace digit substitution, cursor-distance sort "hopscotch"
// patterns, vt-line texture scrambling) translated to a live TSL vertex/UV
// shader on a lot full of wrecked vehicles, instead of one-off hand
// text-editing.
export default function GetWrecked() {
  const config = useSceneControls();

  // Godrays raymarch this light's shadow map, so the pass needs the live
  // THREE.PointLight. State, not a ref: toggling the slot unmounts and remounts
  // the light, and the post pipeline has to rebuild when that instance changes.
  const [godrayLight, setGodrayLight] = useState(null);

  const handleLightChange = useCallback((slotId, light) => {
    if (slotId === 'godray') setGodrayLight(light);
  }, []);

  return (
    <>
      {config.theatreEnabled ? (
        <TheatreDriver config={config} />
      ) : (
        <CameraRig camera={config.camera} />
      )}
      <LightingRig
        lighting={config.lighting}
        onLightChange={handleLightChange}
      />
      <SceneBackground backgroundColor={config.backgroundColor} />
      <FogRig config={config} />
      <Vehicles config={config} />
      {config.groundEnabled && <Ground config={config} />}
      {config.floorEnabled && (
        <Floor
          color={config.floorColor}
          opacity={config.floorOpacity}
          size={config.floorSize}
        />
      )}
      <PostEffects config={config} godrayLight={godrayLight} />
    </>
  );
}
