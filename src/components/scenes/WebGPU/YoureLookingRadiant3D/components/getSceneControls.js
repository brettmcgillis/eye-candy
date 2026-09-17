import { folder } from 'leva';

import {
  glassControls,
  lightControls,
  lookControls,
  motionControls,
  particleControls,
  roleControls,
} from '@modules/radiantSwarm';

// The flat scene's folders in its order, with what only a volume has beside
// the shared controls it belongs with.
export default function getSceneControls(p) {
  return {
    Particles: folder(
      {
        ...particleControls(p),
        volumeDepth: {
          label: 'Volume Depth',
          max: 1.6,
          min: 0.1,
          step: 0.05,
          value: p.volumeDepth,
        },
      },
      { collapsed: true }
    ),
    Roles: folder(roleControls(p), { collapsed: true }),
    Glass: folder(glassControls(p), { collapsed: true }),
    Motion: folder(
      motionControls(p, {
        ringExtras: {
          ringTilt: {
            label: 'Ring Tilt (deg)',
            max: 90,
            min: 0,
            step: 0.5,
            value: p.ringTilt,
          },
        },
      }),
      { collapsed: true }
    ),
    Light: folder(
      {
        ...lightControls(p),
        volumeDensity: {
          label: 'Air Density',
          max: 10,
          min: 0,
          step: 0.05,
          value: p.volumeDensity,
        },
        shaftSamples: {
          label: 'Shaft Samples',
          max: 16,
          min: 1,
          step: 1,
          value: p.shaftSamples,
        },
        renderScale: {
          label: 'Render Scale',
          max: 1,
          min: 0.25,
          step: 0.05,
          value: p.renderScale,
        },
      },
      { collapsed: true }
    ),
    Look: folder(lookControls(p), { collapsed: true }),
  };
}
