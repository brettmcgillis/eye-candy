import { folder } from 'leva';

export default function getSkyControls(p) {
  return folder(
    {
      skyTint: { value: p.skyTint },
      nightMode: { value: p.nightMode },
      nightLightIntensity: {
        max: 1,
        min: 0.05,
        step: 0.01,
        value: p.nightLightIntensity,
      },
      transitionRate: {
        max: 3,
        min: 0.1,
        step: 0.05,
        value: p.transitionRate,
      },
      transitionHold: { label: 'Hold Transition', value: p.transitionHold },
      transitionProgress: {
        label: 'Hold At',
        max: 1,
        min: 0,
        step: 0.01,
        value: p.transitionProgress,
      },
      transitionAngle: {
        label: 'Hold Seam Angle',
        max: 180,
        min: -180,
        step: 1,
        value: p.transitionAngle,
      },
      waveLength: { max: 30, min: 1, step: 0.5, value: p.waveLength },
      waveHeight: { max: 24, min: 0, step: 0.5, value: p.waveHeight },
      cloudCount: { max: 24, min: 0, step: 1, value: p.cloudCount },
      cloudOpacity: { max: 1, min: 0, step: 0.01, value: p.cloudOpacity },
      cloudDrift: { max: 0.4, min: 0, step: 0.001, value: p.cloudDrift },
      cloudSeed: { max: 999, min: 0, step: 1, value: p.cloudSeed },
    },
    { collapsed: true }
  );
}
