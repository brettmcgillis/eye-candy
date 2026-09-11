import { folder } from 'leva';

export default function getMotionControls(preset = {}) {
  return folder(
    {
      buildIn: { label: 'Build In', value: preset.buildIn ?? true },
      buildSeconds: {
        label: 'Build Seconds',
        max: 30,
        min: 0.5,
        step: 0.5,
        value: preset.buildSeconds ?? 8,
      },
      rollingRebuild: {
        label: 'Rolling Rebuild',
        value: preset.rollingRebuild ?? true,
      },
      rebuildSeconds: {
        label: 'Rebuild Every',
        max: 60,
        min: 1,
        step: 0.5,
        value: preset.rebuildSeconds ?? 6,
      },
      pulseRate: {
        label: 'Pulse Rate',
        max: 6,
        min: 0,
        step: 0.05,
        value: preset.pulseRate ?? 1.2,
      },
      pulseDepth: {
        label: 'Pulse Depth',
        max: 1,
        min: 0,
        step: 0.01,
        value: preset.pulseDepth ?? 0.45,
      },
      revealBand: {
        label: 'Reveal Band',
        max: 1,
        min: 0.02,
        step: 0.01,
        value: preset.revealBand ?? 0.3,
      },
    },
    { collapsed: true }
  );
}
