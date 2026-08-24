import React from 'react';

import { CameraRig } from '../../../../../modules/cameraRig';
import { LightingRig } from '../../../../../modules/lightingRig';
import Floor from './components/Floor';
import PostEffects from './components/PostEffects';
import SceneBackground from './components/SceneBackground';
import WreckedCar from './components/WreckedCar';
import useSceneControls from './hooks/useSceneControls';

// A tribute to Mark Klink's 2014 "3D Glitch Notes" (srcxor.org/blog/3d-glitching)
// — his raw-.obj text corruption techniques (cut/paste vertex blocks,
// find-and-replace digit substitution, cursor-distance sort "hopscotch"
// patterns, vt-line texture scrambling) translated to a live TSL vertex/UV
// shader on a wrecked car, instead of one-off hand text-editing.
export default function GetWrecked() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <SceneBackground backgroundColor={config.backgroundColor} />
      <WreckedCar config={config} />
      {config.floorEnabled && (
        <Floor
          color={config.floorColor}
          opacity={config.floorOpacity}
          size={config.floorSize}
        />
      )}
      <PostEffects
        chromaticAberrationEnabled={config.postChromaticAberrationEnabled}
        chromaticAberrationScale={config.postChromaticAberrationScale}
        chromaticAberrationStrength={config.postChromaticAberrationStrength}
        pixelSortDirection={config.postPixelSortDirection}
        pixelSortEnabled={config.postPixelSortEnabled}
        pixelSortStepSize={config.postPixelSortStepSize}
        pixelSortSteps={config.postPixelSortSteps}
        pixelSortThreshold={config.postPixelSortThreshold}
      />
    </>
  );
}
