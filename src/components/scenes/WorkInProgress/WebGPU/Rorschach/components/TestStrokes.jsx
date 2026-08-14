import { attribute, float, mix, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { forwardRef, memo, useEffect, useMemo, useRef } from 'react';

import { buildStrokeGeometry } from '../utils/buildStrokeGeometry';

// Geometry/material built once per bundle identity; Test.jsx writes
// positions/drawRange onto this mesh directly every frame. `hsl` doesn't
// gate the useMemo — it used to, and every color-only control change
// rebuilt the mesh, resetting drawRange and losing all grown/evolved data.
// The color uniform is mutated in place via the effect below instead.
//
// FADE_FRACTION must stay well above evolution.js's REBASE_FRACTION so a
// point's tail-fade actually finishes before it's dropped, not just starts.
const FADE_FRACTION = 0.5;

const TestStrokes = forwardRef(function TestStrokes(
  { hsl, strandCount, steps },
  ref
) {
  const colorUniformRef = useRef(null);

  const lineSegments = useMemo(() => {
    const geometry = buildStrokeGeometry(strandCount, steps);
    const material = new THREE.LineBasicNodeMaterial({
      transparent: true,
      depthWrite: true,
      depthTest: true,
    });
    const colorUniform = uniform(new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l));
    colorUniformRef.current = colorUniform;
    material.colorNode = colorUniform;

    const grownStepsUniform = uniform(1);
    const fadeWindow = grownStepsUniform.mul(FADE_FRACTION).max(1);
    const fadeLinear = attribute('stepIndex', 'float')
      .div(fadeWindow)
      .clamp(0, 1);
    const segVisible = float(1).sub(attribute('segHidden', 'float'));
    // fadeEnabledUniform: 0 during growth (nothing's being dropped, so no
    // reason to fade) and during evolution when the Trail Fade toggle is
    // off; 1 when evolution's rolling window is actually active.
    const fadeEnabledUniform = uniform(0);
    material.opacityNode = mix(
      float(1),
      fadeLinear.mul(fadeLinear),
      fadeEnabledUniform
    ).mul(segVisible);

    const mesh = new THREE.LineSegments(geometry, material);
    mesh.frustumCulled = false;
    mesh.userData.grownStepsUniform = grownStepsUniform;
    mesh.userData.fadeEnabledUniform = fadeEnabledUniform;
    return mesh;
    // hsl intentionally omitted, see comment above.
  }, [strandCount, steps]);

  useEffect(() => {
    colorUniformRef.current?.value.setHSL(hsl.h, hsl.s, hsl.l);
  }, [hsl.h, hsl.s, hsl.l]);

  return <primitive object={lineSegments} ref={ref} />;
});

export default memo(TestStrokes);
