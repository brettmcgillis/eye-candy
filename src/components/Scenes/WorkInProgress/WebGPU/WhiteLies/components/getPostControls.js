import { folder } from 'leva';

export default function getPostControls(p) {
  return folder(
    {
      ssgiEnabled: { label: 'SSGI Enabled', value: p.ssgiEnabled },
      sliceCount: {
        label: 'Slice Count',
        max: 4,
        min: 1,
        render: (get) => get('White Lies.Post.ssgiEnabled'),
        step: 1,
        value: p.sliceCount,
      },
      stepCount: {
        label: 'Step Count',
        max: 24,
        min: 4,
        render: (get) => get('White Lies.Post.ssgiEnabled'),
        step: 1,
        value: p.stepCount,
      },
      aoIntensity: {
        label: 'AO Intensity',
        max: 4,
        min: 0,
        render: (get) => get('White Lies.Post.ssgiEnabled'),
        step: 0.1,
        value: p.aoIntensity,
      },
      giIntensity: {
        label: 'GI Intensity',
        max: 30,
        min: 0,
        render: (get) => get('White Lies.Post.ssgiEnabled'),
        step: 0.5,
        value: p.giIntensity,
      },
      radius: {
        label: 'Sample Radius',
        max: 25,
        min: 1,
        render: (get) => get('White Lies.Post.ssgiEnabled'),
        step: 0.5,
        value: p.radius,
      },
      traaEnabled: {
        label: 'TRAA Denoise',
        render: (get) => get('White Lies.Post.ssgiEnabled'),
        value: p.traaEnabled,
      },
      exposure: {
        label: 'Exposure',
        max: 2,
        min: 0.1,
        step: 0.05,
        value: p.exposure,
      },
    },
    { collapsed: true }
  );
}
