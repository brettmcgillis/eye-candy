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
  resolution,
  seed,
  steps,
  styles,
}) {
  const renderer = useThree((state) => state.gl);
  const paperRef = useRef(null);

  // Resolution and paper tooth are baked into the render targets and the paper
  // texture, so changing either rebuilds the sim. Everything else is a uniform
  // or a CPU-side setting and is pushed through without a rebuild.
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
    [paperGrain, renderer, resolution, seed]
  );
  paperRef.current = paper;

  useEffect(() => () => paper.dispose(), [paper]);

  useEffect(() => {
    paper.setState({ paperSize });
  }, [paper, paperSize]);

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
