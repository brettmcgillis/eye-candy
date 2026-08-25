import React, { forwardRef, memo, useEffect, useMemo, useRef } from 'react';

import { attribute, float, mix, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { buildStrokeGeometry } from '@modules/rorschach';

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
  { hsl, strandCount, steps, emissive, emissiveIntensity, visible = true },
  ref
) {
  const colorUniformRef = useRef(null);
  const intensityUniformRef = useRef(null);
  const materialRef = useRef(null);

  const lineSegments = useMemo(() => {
    const geometry = buildStrokeGeometry(strandCount, steps);
    const material = new THREE.LineBasicNodeMaterial({
      alphaTest: 0.005,
      transparent: true,
      depthWrite: true,
      depthTest: true,
    });
    materialRef.current = material;
    const colorUniform = uniform(new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l));
    colorUniformRef.current = colorUniform;
    // emissiveIntensity multiplies the base color rather than adding a
    // separate emissive channel — this material is unlit (no lighting to
    // add on top of), so pushing RGB past 1.0 is the equivalent effect.
    // Needs `material.toneMapped = false` (set in the effect below) to
    // actually read as brighter instead of being clamped back down by the
    // renderer's tonemapping curve.
    const intensityUniform = uniform(1);
    intensityUniformRef.current = intensityUniform;
    material.colorNode = colorUniform.mul(intensityUniform);

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

  // `lineSegments` is in both dep arrays alongside the actual props it
  // applies: strandCount/steps changing rebuilds a brand new material with
  // fresh (default) uniforms, and that rebuild must re-sync color/emissive
  // from current props even when hsl/emissive/emissiveIntensity's own
  // *values* happen to be unchanged from before — otherwise a freshly built
  // material silently keeps its just-constructed defaults forever.
  useEffect(() => {
    colorUniformRef.current?.value.setHSL(hsl.h, hsl.s, hsl.l);
  }, [lineSegments, hsl.h, hsl.s, hsl.l]);

  useEffect(() => {
    if (intensityUniformRef.current) {
      intensityUniformRef.current.value = emissive ? emissiveIntensity : 1;
    }
    const material = materialRef.current;
    if (material && material.toneMapped !== !emissive) {
      material.toneMapped = !emissive;
      material.needsUpdate = true;
    }
  }, [lineSegments, emissive, emissiveIntensity]);

  return <primitive object={lineSegments} ref={ref} visible={visible} />;
});

export default memo(TestStrokes);
