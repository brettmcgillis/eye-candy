import { folder } from 'leva';

import { MAX_PHYSICAL_ATTRACTORS } from '../utils/physicalAttractors';

// Physical-attractors mode controls. Keys match presets/presets.js 1:1
// (docs/scene-conventions.md §9). Only meaningful when Swarm.mode is
// "Physical Attractors"; harmless (unused) otherwise. Attractor
// position/axis/type live outside this schema, on the attractorsRef array
// PhysicalAttractorMarkers owns and the reused elements/attractors
// component drags — see that file's header comment for why.
export default function getPhysicalAttractorControls(p = {}) {
  return folder({
    attractorCount: {
      label: 'Attractor Count',
      value: p.attractorCount ?? MAX_PHYSICAL_ATTRACTORS,
      min: 1,
      max: MAX_PHYSICAL_ATTRACTORS,
      step: 1,
    },
    showAttractorMarkers: {
      label: 'Show Markers',
      value: p.showAttractorMarkers ?? true,
    },
    attractorStrength: {
      label: 'Attractor Strength',
      value: p.attractorStrength ?? 0.9,
      min: 0.05,
      max: 4,
      step: 0.01,
    },
    spinStrength: {
      label: 'Spin Strength',
      value: p.spinStrength ?? 1.5,
      min: 0,
      max: 6,
      step: 0.05,
    },
    maxSpeed: {
      label: 'Max Speed',
      value: p.maxSpeed ?? 4,
      min: 0.5,
      max: 12,
      step: 0.1,
    },
    damping: {
      label: 'Damping',
      value: p.damping ?? 0.08,
      min: 0,
      max: 0.5,
      step: 0.005,
    },
    animateAttractors: {
      label: 'Animate Attractors',
      value: p.animateAttractors ?? true,
    },
    animateSpeed: {
      label: 'Animate Speed',
      value: p.animateSpeed ?? 0.15,
      min: 0,
      max: 1,
      step: 0.01,
    },
  });
}
