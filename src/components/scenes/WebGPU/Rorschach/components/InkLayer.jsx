import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { createInkPaper, mapPatternSettings } from '@modules/rorschach';

// The scene's half of the ink layer. Everything that decides what the paint
// does lives in the kernel; this only owns the React lifecycle and the
// per-frame call. The headless capture drives the same object with the same
// arguments, which is why a still and the live scene agree.
//
// Rendered as a sibling of Test.jsx's stroke group, never inside it: that group
// carries the test's fit scale and its flatten squash, and the ink is laid out
// in its own paper UV. Nesting it would apply the scale twice.
function InkLayer({
  backdropColor,
  bloom,
  bloomEmissiveOnly,
  bloomSource,
  bloomStrength,
  bloomThreshold,
  cellAmount,
  cellFlatten,
  cellReveal,
  cellRevealScale,
  cellScale,
  cellSymmetry,
  desaturate,
  offset,
  orientation,
  paletteMix,
  paletteScale,
  paletteSymmetry,
  paperGrain,
  paperSize,
  patternDensity,
  patternDetails,
  patternFade,
  patternFlow,
  patternScale,
  patternSharpness,
  patternSoftness,
  patternSpeed,
  patternSymmetry,
  patternWash,
  recede,
  resolution,
  seed,
  steps,
  styles,
  tonalGap,
}) {
  const renderer = useThree((state) => state.gl);
  const paperRef = useRef(null);

  // Only the resolution is baked into the render targets, so only the
  // resolution rebuilds the sim. Everything else is a uniform, a CPU-side
  // setting, or — for the paper grain — a texture that can be rewritten where
  // it stands.
  const paper = useMemo(
    () =>
      createInkPaper({
        orientation,
        paperGrain,
        paperOffset: offset,
        paperSize,
        renderer,
        resolution,
        seed,
      }),
    // Deliberately not exhaustive: the remaining props are pushed through the
    // effects below rather than rebuilding the sim and losing the wet blot.
    [renderer, resolution]
  );
  paperRef.current = paper;

  useEffect(() => () => paper.dispose(), [paper]);

  // A new seed is a new blot and a new sheet of fibres, so the fields are
  // cleared and settled again — but the sim behind them survives it. Rebuilding
  // instead cost a fresh set of render targets, a fresh pipeline compile, and
  // two seconds of CPU value noise at 2048, every time a Roll button was
  // pressed.
  useEffect(() => {
    paper.setPaper({ grain: paperGrain, seed });
    paper.reset();
  }, [paper, paperGrain, seed]);

  useEffect(() => {
    paper.setState({ paperSize, tonalGap });
  }, [paper, paperSize, tonalGap]);

  useEffect(() => {
    paper.setOrientation(orientation, offset);
  }, [offset, orientation, paper]);

  // The scene's background is what the ink is optically layered over — there is
  // no sheet of paper, so this is the substrate Kubelka-Munk composites onto.
  useEffect(() => {
    paper.setBackdropColor(backdropColor);
  }, [backdropColor, paper]);

  // The friendly 0-1 knobs are mapped onto the field's own uniforms by the
  // kernel, using the same function the dev page background and the CLI use, so
  // a given Density and Sharpness mean the same thing in all three.
  useEffect(() => {
    paper.setState({
      simParams: {
        ...mapPatternSettings({
          cellAmount,
          cellFlatten,
          cellReveal,
          cellRevealScale,
          cellScale,
          cellSymmetry,
          density: patternDensity,
          paletteMix,
          paletteScale,
          paletteSymmetry,
          details: patternDetails,
          scale: patternScale,
          // The blot's own seed offsets the field, so two tests with different
          // seeds are different blots. Matched to the headless capture's
          // formula or the same seed would produce two different stills.
          seed: (seed % 1000) / 100,
          sharpness: patternSharpness,
          softness: patternSoftness,
          symmetry: patternSymmetry,
        }),
        // The scene's threshold, so the ink can be lifted a known distance past
        // it rather than by a hue-dependent multiply.
        bloomEmissiveOnly: bloomEmissiveOnly ? 1 : 0,
        bloomEnabled: bloom ? 1 : 0,
        inkDesaturate: desaturate,
        inkRecede: recede,
        bloomSource: bloomSource === 'wetness' ? 1 : 0,
        bloomStrength,
        bloomThreshold,
        patternDeposit: patternWash,
        patternFade,
        patternFlow,
      },
    });
  }, [
    bloom,
    bloomEmissiveOnly,
    bloomSource,
    bloomStrength,
    bloomThreshold,
    cellAmount,
    cellFlatten,
    cellReveal,
    cellRevealScale,
    cellScale,
    cellSymmetry,
    desaturate,
    paletteMix,
    paletteScale,
    paletteSymmetry,
    paper,
    patternDensity,
    patternDetails,
    patternFade,
    patternFlow,
    patternScale,
    patternSharpness,
    patternSoftness,
    patternSymmetry,
    patternWash,
    recede,
    seed,
  ]);

  useEffect(() => {
    paper.setPatternSpeed(patternSpeed);
  }, [paper, patternSpeed]);

  useFrame((_, delta) => {
    paper.advance({
      // Real elapsed seconds drive the pattern's own clock, so the field
      // breathes at the same rate regardless of framerate.
      delta,
      steps,
      styles,
    });
  });

  return <primitive object={paper.mesh} />;
}

export default memo(InkLayer);
