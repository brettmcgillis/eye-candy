import { folder } from 'leva';

import { MAX_PHYSICAL_ATTRACTORS } from '../utils/physicalAttractors';

// Physical-attractors mode controls. Keys match presets/presets.js 1:1
// (docs/scene-conventions.md §9). Only meaningful when Swarm.mode is
// "Physical Attractors"; harmless (unused) otherwise. Attractor
// position/axis/type live outside this schema, on the attractorsRef array
// PhysicalAttractorMarkers owns and the reused elements/attractors
// component drags — see that file's header comment for why. containmentRadius
// is where the soft inward spring (utils/physicalAttractors.js) kicks in —
// without it, damped particles settle into a stable orbit near whichever
// attractor caught them and the swarm reads as "stuck" instead of swinging
// out and curving back through the field. It's a soft spring rather than the
// reference/ParticleLab's hard box-wrap — a position teleport is invisible
// on their tiny additive point sprites but pops obviously on an oriented
// leaf/petal mesh.
export default function getPhysicalAttractorControls(p = {}) {
  return folder(
    {
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
        value: p.damping ?? 0.1,
        min: 0,
        max: 0.5,
        step: 0.005,
      },
      containmentRadius: {
        label: 'Containment Radius',
        value: p.containmentRadius ?? 6,
        min: 2,
        max: 20,
        step: 0.5,
      },
      boundaryTwist: {
        label: 'Boundary Twist',
        value: p.boundaryTwist ?? 1.25,
        min: 0,
        max: 5,
        step: 0.05,
      },
      turbulenceStrength: {
        label: 'Curl Turbulence',
        value: p.turbulenceStrength ?? 0.25,
        min: 0,
        max: 2,
        step: 0.01,
      },
      energyFloor: {
        label: 'Energy Floor',
        value: p.energyFloor ?? 0.35,
        min: 0,
        max: 3,
        step: 0.01,
      },
      animateAttractors: {
        label: 'Animate Attractors',
        value: p.animateAttractors ?? true,
      },
      animateSpeed: {
        label: 'Animate Speed',
        value: p.animateSpeed ?? 0.15,
        min: 0,
        max: 5,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
