import { folder } from 'leva';

import { ENVIRONMENTS } from '../../presets/presets';

export default function getStageControls(snapshot) {
  return folder(
    {
      environmentMode: {
        label: 'Environment',
        options: {
          Flow: ENVIRONMENTS.flow,
          'Outside Space and Time': ENVIRONMENTS.outsideSpaceTime,
        },
        value: snapshot.environmentMode,
      },
      flowEnvironmentIntensity: {
        label: 'Flow Env Intensity',
        value: snapshot.flowEnvironmentIntensity,
        min: 0,
        max: 2,
        step: 0.01,
      },
      outsideBackgroundColor: {
        label: 'Outside BG',
        value: snapshot.outsideBackgroundColor,
      },
      boundsLineColor: {
        label: 'Bounds Line Color',
        value: snapshot.boundsLineColor,
      },
      boundsLineWeight: {
        label: 'Bounds Line Weight',
        value: snapshot.boundsLineWeight,
        min: 0.5,
        max: 20,
        step: 0.1,
      },
      boundsSize: {
        label: 'Bounds Size',
        value: snapshot.boundsSize,
        min: 0.2,
        max: 1.8,
        step: 0.01,
      },
      boundsCenterY: {
        label: 'Bounds Y',
        value: snapshot.boundsCenterY,
        min: -1,
        max: 1,
        step: 0.01,
      },
      boundsCenterZ: {
        label: 'Bounds Z',
        value: snapshot.boundsCenterZ,
        min: -1,
        max: 1,
        step: 0.01,
      },
      boundsDepth: {
        label: 'Bounds Depth',
        value: snapshot.boundsDepth,
        min: 0.2,
        max: 1.8,
        step: 0.01,
      },
      particleDepthScale: {
        label: 'Particle Depth',
        value: snapshot.particleDepthScale,
        min: 0.25,
        max: 1.5,
        step: 0.01,
      },
      particleZOffset: {
        label: 'Particle Z Offset',
        value: snapshot.particleZOffset,
        min: -1,
        max: 1,
        step: 0.01,
      },
      autoOrbit: { label: 'Auto Orbit', value: snapshot.autoOrbit },
      autoOrbitSpeed: {
        label: 'Orbit Speed',
        value: snapshot.autoOrbitSpeed,
        min: 0.01,
        max: 1,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
