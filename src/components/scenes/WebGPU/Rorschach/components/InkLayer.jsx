import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { createInkPaper } from '@modules/rorschach';

// The scene's half of the ink layer. Everything that decides what the paint
// does lives in the kernel; this only owns the React lifecycle and the
// per-frame call. The headless capture drives the same object with the same
// arguments, which is why a still and the live scene agree.
//
// Rendered as a sibling of Test.jsx's stroke group, never inside it: that group
// carries the test's fit scale and its flatten squash, and the deposition code
// has already applied the former while projecting to paper UV. Nesting the
// sheet inside would apply the scale twice.
function InkLayer({
  brushSize,
  depositionMode,
  offset,
  orientation,
  paperColor,
  paperGrain,
  paperSize,
  resolution,
  seed,
  showPaper,
  steps,
  strength,
  structure,
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
        brushSize,
        depositionMode,
        orientation,
        paperColor,
        paperGrain,
        paperOffset: offset,
        paperSize,
        renderer,
        resolution,
        seed,
        showPaper,
        strength,
      }),
    // Deliberately not exhaustive: the remaining props are pushed through the
    // effects below rather than rebuilding the sim and losing the wet blot.
    [paperGrain, renderer, resolution, seed]
  );
  paperRef.current = paper;

  useEffect(() => () => paper.dispose(), [paper]);

  useEffect(() => {
    paper.setState({ brushSize, depositionMode, paperSize, strength });
  }, [brushSize, depositionMode, paper, paperSize, strength]);

  useEffect(() => {
    paper.setOrientation(orientation, offset);
  }, [offset, orientation, paper]);

  useEffect(() => {
    paper.setPaperColor(paperColor);
  }, [paper, paperColor]);

  useEffect(() => {
    paper.setShowPaper(showPaper);
  }, [paper, showPaper]);

  // Runs after Test.jsx's own useFrame — registration order — so the paint laid
  // down this frame is whatever grew this frame.
  useFrame(() => {
    paper.advance({
      bundles: structure.bundles,
      scale: structure.scale,
      steps,
      styles,
    });
  });

  return <primitive object={paper.mesh} />;
}

export default memo(InkLayer);
