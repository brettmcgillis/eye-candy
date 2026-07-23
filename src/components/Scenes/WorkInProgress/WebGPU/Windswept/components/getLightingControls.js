import { folder } from 'leva';

export default function getLightingControls(p = {}) {
  return folder(
    {
      ambientIntensity: {
        label: 'Ambient Intensity',
        value: p.ambientIntensity ?? 0.1,
        min: 0,
        max: 2,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
