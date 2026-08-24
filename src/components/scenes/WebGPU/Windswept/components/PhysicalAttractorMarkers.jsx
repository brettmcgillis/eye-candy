import React, { memo, useEffect, useState } from 'react';

import * as THREE from 'three/webgpu';

import Attractors from '@elements/Attractors/Attractors';

import { PHYSICAL_ATTRACTORS_MODE } from '../utils/modes';
import { MAX_PHYSICAL_ATTRACTORS } from '../utils/physicalAttractors';

const DEFAULT_SLOTS = [
  { direction: [0, 1, 0], position: [-2, 0, 0], type: 'attractor' },
  { direction: [0, 1, 0], position: [2, 0, -1], type: 'attractor' },
  { direction: [1, 0, -0.5], position: [0, 1, 2], type: 'attractor' },
];

// Visible, draggable markers for physical-attractors mode, reusing the
// generic elements/attractors overlay (icosahedron + direction cone,
// TransformControls translate+rotate, per-marker Type/Strength/Radius Leva
// panel) rather than a bespoke gizmo — see docs/scene-conventions.md §6/§7.
// `attractorsRef` (owned by Windswept.jsx, shared with LeafSwarm) is this
// component's only output: LeafSwarm's physics reads attractorsRef.current
// directly each frame, so dragging a marker here immediately repositions
// its force in the swarm. Only position/direction/type feed the physics —
// the per-marker Strength/Radius sub-controls are decorative for this
// slice (see getPhysicalAttractorControls.js's header for why). Wrapped in
// a worldScale group so marker positions read/write in the same raw,
// pre-worldScale space the swarm's compute buffers use.
function PhysicalAttractorMarkers({ config, attractorsRef }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const count = THREE.MathUtils.clamp(
      Math.round(config.attractorCount),
      1,
      MAX_PHYSICAL_ATTRACTORS
    );
    const { current } = attractorsRef;
    if (current.length === count) return;

    attractorsRef.current =
      count > current.length
        ? [...current, ...DEFAULT_SLOTS.slice(current.length, count)]
        : current.slice(0, count);
    setVersion((v) => v + 1);
  }, [attractorsRef, config.attractorCount]);

  const active = config.mode === PHYSICAL_ATTRACTORS_MODE;

  return (
    <group scale={config.worldScale}>
      <Attractors
        attractorsRef={attractorsRef}
        controlsSize={0.6}
        levaPrefix="Windswept"
        markerSize={0.2}
        mode="both"
        radius={2}
        strength={300}
        version={version}
        visible={active && config.showAttractorMarkers}
      />
    </group>
  );
}

export default memo(PhysicalAttractorMarkers);
