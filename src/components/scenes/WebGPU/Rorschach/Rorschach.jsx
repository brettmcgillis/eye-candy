import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { CameraRig } from '@modules/cameraRig';

import ButtonOverlay from './components/ButtonOverlay';
import CinematicMode from './components/CinematicMode';
import PostEffects from './components/PostEffects';
import Test from './components/Test';
import ViewHotkey from './components/ViewHotkey';
import useSceneControls from './hooks/useSceneControls';

// Phase 1 (Lines mode): a seeded formula-builder assembles a 3D system of
// trig-based ODEs per bundle, Clifford/de Jong-attractor style
// (@modules/rorschach/formulaBuilder.js, @modules/rorschach/odeIntegrator.js mirrored across X=0 for the
// classic bilateral ink-blot symmetry, self-drawing in on generate and
// drifting slowly afterward (@modules/rorschach/evolution.js). Points and Ink (full
// Curtis-97 watercolor sim) modes are later phases — see todo.md.
function Rorschach() {
  const config = useSceneControls();
  const { scene } = useThree();

  // Grouped so Test's memo doesn't see a dozen separate ink props change; the
  // object is only rebuilt when one of them actually does.
  const inkSettings = useMemo(
    () => ({
      backdropColor: config.backgroundColor,
      bloom: config.inkBloom,
      desaturate: config.inkDesaturate,
      recede: config.inkRecede,
      tonalGap: config.inkTonalGap,
      bloomEmissiveOnly: config.inkBloomEmissiveOnly,
      bloomSource: config.inkBloomSource,
      bloomStrength: config.inkBloomStrength,
      // The scene's bloom threshold, not an ink one — the ink is lifted past
      // the same threshold every other layer is measured against.
      bloomThreshold: config.bloomThreshold,
      cellAmount: config.inkCellAmount,
      cellFlatten: config.inkCellFlatten,
      cellReveal: config.inkCellReveal,
      cellRevealScale: config.inkCellRevealScale,
      cellScale: config.inkCellScale,
      cellSymmetry: config.inkCellSymmetry,
      paletteMix: config.inkPaletteMix,
      paletteScale: config.inkPaletteScale,
      paletteSymmetry: config.inkPaletteSymmetry,
      offset: config.inkOffset,
      orientation: config.inkOrientation,
      paperGrain: config.inkPaperGrain,
      paperSize: config.inkPaperSize,
      patternDensity: config.inkPatternDensity,
      patternDetails: config.inkPatternDetails,
      patternFade: config.inkPatternFade,
      patternFlow: config.inkPatternFlow,
      patternScale: config.inkPatternScale,
      patternSharpness: config.inkPatternSharpness,
      patternSoftness: config.inkPatternSoftness,
      patternSpeed: config.inkPatternSpeed,
      patternSymmetry: config.inkPatternSymmetry,
      patternWash: config.inkPatternWash,
      resolution: config.inkResolution,
      stepsPerFrame: config.inkStepsPerFrame,
    }),
    [
      config.backgroundColor,
      config.inkBloom,
      config.inkDesaturate,
      config.inkRecede,
      config.inkTonalGap,
      config.inkBloomEmissiveOnly,
      config.inkBloomSource,
      config.inkBloomStrength,
      config.bloomThreshold,
      config.inkCellAmount,
      config.inkCellFlatten,
      config.inkCellReveal,
      config.inkCellRevealScale,
      config.inkCellScale,
      config.inkCellSymmetry,
      config.inkPaletteMix,
      config.inkPaletteScale,
      config.inkPaletteSymmetry,
      config.inkOffset,
      config.inkOrientation,
      config.inkPaperGrain,
      config.inkPaperSize,
      config.inkPatternDensity,
      config.inkPatternDetails,
      config.inkPatternFade,
      config.inkPatternFlow,
      config.inkPatternScale,
      config.inkPatternSharpness,
      config.inkPatternSoftness,
      config.inkPatternSpeed,
      config.inkPatternSymmetry,
      config.inkPatternWash,
      config.inkResolution,
      config.inkStepsPerFrame,
    ]
  );
  // Written every frame by CinematicMode, read every frame by Test — never
  // through React, so the sweep doesn't re-render the scene 60 times a second.
  const flattenRef = useRef(null);

  // Set imperatively, not via <color attach="background" args={[...]}> —
  // that form left the background one edit behind (see todo.md).
  useEffect(() => {
    scene.background = new THREE.Color(config.backgroundColor);
  }, [scene, config.backgroundColor]);

  return (
    <>
      <CameraRig camera={config.camera} />
      <ViewHotkey />
      <CinematicMode
        enabled={config.cinematicEnabled}
        flattenRef={flattenRef}
        onSystemChange={config.regenerate}
        secondsPerSystem={config.cinematicSecondsPerSystem}
      />
      <Test
        seed={config.seed}
        bundleCount={config.bundleCount}
        strandsPerBundle={config.strandsPerBundle}
        steps={config.steps}
        startSpread={config.startSpread}
        strandSeeding={config.strandSeeding}
        membraneSpan={config.membraneSpan}
        coeffRange={config.coeffRange}
        freq={config.freq}
        framingShape={config.framingShape}
        boundRadius={config.boundRadius}
        boundWidth={config.boundWidth}
        boundHeight={config.boundHeight}
        minSpread={config.minSpread}
        palette={config.palette}
        paletteExact={config.paletteExact}
        paletteShuffleSeed={config.paletteShuffleSeed}
        flatten={config.flattenEnabled ? config.flatten : 0}
        flattenAxis={config.flattenAxis}
        growthSpeed={config.growthSpeed}
        growthStyle={config.growthStyle}
        continuousMode={config.continuousMode}
        continuousModeDelay={config.continuousModeDelay}
        onGrowthComplete={config.reseed}
        evolutionEnabled={config.evolutionEnabled}
        evolutionSpeed={config.evolutionSpeed}
        curlLimit={config.curlLimit}
        smoothRespawns={config.smoothRespawns}
        trailFade={config.trailFade}
        monochrome={config.monochrome}
        inkColor={config.inkColor}
        overrides={config.overrides}
        flattenRef={flattenRef}
        lines={config.lines}
        ink={config.ink}
        membrane={config.membrane}
        membraneOpacity={config.membraneOpacity}
        membraneTear={config.membraneTear}
        membraneStepStride={config.membraneStepStride}
        membraneStrandStride={config.membraneStrandStride}
        membraneWeave={config.membraneWeave}
        membraneTearSoftness={config.membraneTearSoftness}
        membraneEdgeFeather={config.membraneEdgeFeather}
        membraneTaper={config.membraneTaper}
        membraneRim={config.membraneRim}
        membraneTint={config.membraneTint}
        inkSettings={inkSettings}
      />
      <PostEffects
        bloomEnabled={config.bloomEnabled}
        bloomThreshold={config.bloomThreshold}
        bloomStrength={config.bloomStrength}
        bloomRadius={config.bloomRadius}
      />
      {config.showOverlay && (
        <ButtonOverlay
          onRegenerate={config.regenerate}
          onReseed={config.reseed}
        />
      )}
    </>
  );
}

export default memo(Rorschach);
