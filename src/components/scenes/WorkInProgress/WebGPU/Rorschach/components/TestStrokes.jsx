import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { forwardRef, memo, useMemo } from 'react';

import { buildStrokeGeometry } from '../utils/buildStrokeGeometry';

// One bundle's line strokes. Geometry/material are built once per bundle
// identity (a fresh test never reuses a bundle object) and mutated in place
// afterwards — Test.jsx writes positions and drawRange directly onto the
// forwarded THREE.LineSegments instance every frame during growth/evolution.
// `strandCount`/`steps` come from the generated test (Leva-tunable), not a
// fixed constant.
const TestStrokes = forwardRef(function TestStrokes(
  { hsl, strandCount, steps },
  ref
) {
  const lineSegments = useMemo(() => {
    const geometry = buildStrokeGeometry(strandCount, steps);
    const material = new THREE.LineBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
    });
    material.colorNode = uniform(new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l));

    const mesh = new THREE.LineSegments(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
  }, [hsl, strandCount, steps]);

  return <primitive object={lineSegments} ref={ref} />;
});

export default memo(TestStrokes);
