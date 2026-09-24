import { folder } from 'leva';

import { FRAME_MODES } from '@modules/gpuTubes';

export default function getStrandControls(p) {
  return folder(
    {
      strandSeed: {
        label: 'Seed',
        value: p.strandSeed,
        min: 1,
        max: 9999,
        step: 1,
      },
      flowCount: {
        label: 'Flow Strands',
        value: p.flowCount,
        min: 0,
        max: 2000,
        step: 10,
      },
      wanderCount: {
        label: 'Wander Strands',
        value: p.wanderCount,
        min: 0,
        max: 4000,
        step: 10,
      },
      wanderSteps: {
        label: 'Wander Steps',
        value: p.wanderSteps,
        min: 50,
        max: 1500,
        step: 10,
      },
      skullHeight: {
        label: 'Skull Height',
        value: p.skullHeight,
        min: 1,
        max: 4,
        step: 0.05,
      },
      skullBaseY: {
        label: 'Skull Lift',
        value: p.skullBaseY,
        min: 0,
        max: 2,
        step: 0.01,
      },
      hyphaRadius: {
        label: 'Hypha Radius',
        value: p.hyphaRadius,
        min: 0,
        max: 0.02,
        step: 0.0001,
      },
      crowdThinning: {
        label: 'Crowd Thinning',
        value: p.crowdThinning,
        min: 0,
        max: 1,
        step: 0.01,
      },
      tubularSegments: {
        label: 'Segments',
        value: p.tubularSegments,
        min: 16,
        max: 320,
        step: 1,
      },
      radialSegments: {
        label: 'Sides',
        value: p.radialSegments,
        min: 3,
        max: 12,
        step: 1,
      },
      frameMode: { label: 'Frame', value: p.frameMode, options: FRAME_MODES },
    },
    { collapsed: true }
  );
}
