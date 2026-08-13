import React, { memo } from 'react';

import { CameraRig } from '../../../../../modules/cameraRig';
import { LightingRig } from '../../../../../modules/lightingRig';
import ButtonOverlay from './components/ButtonOverlay';
import Forest from './components/Forest';
import useSceneControls from './hooks/useSceneControls';

// Recursive fractal tree generator ported from hex-trees.js (a Turtletoy
// sketch, root of this repo) — forks at hexagonal angles (120° spread, 60°
// initial turn by default), with generation-based thickness tapering,
// probabilistic branching, and decorative circle nodes. Toggle between a
// flat, source-faithful 2D pattern and a volumetric 3D tree via the
// Structure folder's 3D Mode control. See components/Forest.jsx for the
// generation pipeline and components/BranchField.jsx for why 2D/3D share one
// renderer.
function HexTrees() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={['#0b0f0c']} />
      <LightingRig lighting={config.lighting} />
      <Forest config={config} />
      <ButtonOverlay onRegenerate={config.regenerate} />
    </>
  );
}

export default memo(HexTrees);
