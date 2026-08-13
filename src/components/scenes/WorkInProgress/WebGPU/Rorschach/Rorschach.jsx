import React, { memo } from 'react';

import { CameraRig } from '../../../../../modules/cameraRig';
import ButtonOverlay from './components/ButtonOverlay';
import Test from './components/Test';
import useSceneControls from './hooks/useSceneControls';

// Phase 1 (Lines mode): a seeded formula-builder assembles a 3D system of
// trig-based ODEs per bundle, Clifford/de Jong-attractor style
// (utils/formulaBuilder.js, utils/odeIntegrator.js mirrored across X=0 for the
// classic bilateral ink-blot symmetry, self-drawing in on generate and
// drifting slowly afterward (utils/evolution.js). Points and Ink (full
// Curtis-97 watercolor sim) modes are later phases — see todo.md.
function Rorschach() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={[config.backgroundColor]} />
      <Test
        seed={config.seed}
        bundleCount={config.bundleCount}
        strandsPerBundle={config.strandsPerBundle}
        steps={config.steps}
        startSpread={config.startSpread}
        coeffRange={config.coeffRange}
        freq={config.freq}
        palette={config.palette}
        flatten={config.flatten}
        growthDuration={config.growthDuration}
        evolutionEnabled={config.evolutionEnabled}
        evolutionSpeed={config.evolutionSpeed}
        monochrome={config.monochrome}
        inkColor={config.inkColor}
        overrides={config.overrides}
      />
      <ButtonOverlay onRegenerate={config.regenerate} />
    </>
  );
}

export default memo(Rorschach);
