import * as THREE from 'three/webgpu';

import React, { memo, useEffect } from 'react';

import { useThree } from '@react-three/fiber';

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
  const { scene } = useThree();

  // Set imperatively, not via <color attach="background" args={[...]}> —
  // that form left the background one edit behind (see todo.md).
  useEffect(() => {
    scene.background = new THREE.Color(config.backgroundColor);
  }, [scene, config.backgroundColor]);

  return (
    <>
      <CameraRig camera={config.camera} />
      <Test
        seed={config.seed}
        bundleCount={config.bundleCount}
        strandsPerBundle={config.strandsPerBundle}
        steps={config.steps}
        startSpread={config.startSpread}
        coeffRange={config.coeffRange}
        freq={config.freq}
        framingShape={config.framingShape}
        boundRadius={config.boundRadius}
        boundWidth={config.boundWidth}
        boundHeight={config.boundHeight}
        palette={config.palette}
        flatten={config.flatten}
        growthDuration={config.growthDuration}
        evolutionEnabled={config.evolutionEnabled}
        evolutionSpeed={config.evolutionSpeed}
        smoothRespawns={config.smoothRespawns}
        trailFade={config.trailFade}
        monochrome={config.monochrome}
        inkColor={config.inkColor}
        overrides={config.overrides}
      />
      {config.showOverlay && <ButtonOverlay onRegenerate={config.regenerate} />}
    </>
  );
}

export default memo(Rorschach);
