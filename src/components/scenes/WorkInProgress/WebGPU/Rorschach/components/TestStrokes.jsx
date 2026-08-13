import { attribute, float, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { forwardRef, memo, useMemo } from 'react';

import { buildStrokeGeometry } from '../utils/buildStrokeGeometry';

// One bundle's line strokes. Geometry/material are built once per bundle
// identity (a fresh test never reuses a bundle object) and mutated in place
// afterwards — Test.jsx writes positions and drawRange directly onto the
// forwarded THREE.LineSegments instance every frame during growth/evolution.
// `strandCount`/`steps` come from the generated test (Leva-tunable), not a
// fixed constant.
//
// Opacity fades toward the tail (stepIndex 0) based on how close a vertex is
// to the tail relative to the current window size (grownStepsUniform, kept
// in sync by Test.jsx every frame). Without this, evolution's window-rebase
// (utils/evolution.js's REBASE_FRACTION) would drop a whole chunk of
// trailing points at once — a visible pop.
//
// For the fade to actually finish (not just start) before a point is
// dropped, FADE_FRACTION must be well above REBASE_FRACTION: a point at the
// drop boundary still has roughly (REBASE_FRACTION/FADE_FRACTION) residual
// opacity when it's removed, since fade is 0 only exactly at stepIndex 0.
// At 0.5 vs evolution.js's 0.03 that residual is ~6% linearly — squaring the
// ramp below (ease-in curve, not linear) pushes it down further still,
// under 1%.
const FADE_FRACTION = 0.5;

const TestStrokes = forwardRef(function TestStrokes(
  { hsl, strandCount, steps },
  ref
) {
  const lineSegments = useMemo(() => {
    const geometry = buildStrokeGeometry(strandCount, steps);
    const material = new THREE.LineBasicNodeMaterial({
      transparent: true,
      depthWrite: true,
      depthTest: true,
    });
    material.colorNode = uniform(new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l));

    const grownStepsUniform = uniform(1);
    const fadeWindow = grownStepsUniform.mul(FADE_FRACTION).max(1);
    const fadeLinear = attribute('stepIndex', 'float')
      .div(fadeWindow)
      .clamp(0, 1);
    // segHidden force-zeroes a respawned strand's one connecting segment —
    // see utils/evolution.js's respawnHiddenStep and buildStrokeGeometry.js.
    const segVisible = float(1).sub(attribute('segHidden', 'float'));
    material.opacityNode = fadeLinear.mul(fadeLinear).mul(segVisible);

    const mesh = new THREE.LineSegments(geometry, material);
    mesh.frustumCulled = false;
    mesh.userData.grownStepsUniform = grownStepsUniform;
    return mesh;
  }, [hsl, strandCount, steps]);

  return <primitive object={lineSegments} ref={ref} />;
});

export default memo(TestStrokes);
