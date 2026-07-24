import { folder } from 'leva';

export default function getLightingControls(p = {}) {
  return folder(
    {
      lightAmbientIntensity: {
        label: 'Ambient',
        value: p.lightAmbientIntensity ?? 0.5,
        min: 0,
        max: 2,
        step: 0.05,
      },
      lightKeyColor: {
        label: 'Key Color',
        value: p.lightKeyColor ?? '#fff4e0',
      },
      lightKeyIntensity: {
        label: 'Key Intensity',
        value: p.lightKeyIntensity ?? 1.6,
        min: 0,
        max: 5,
        step: 0.05,
      },
      lightKeyPosition: {
        label: 'Key Position',
        value: p.lightKeyPosition ?? { x: 10, y: 20, z: 8 },
      },
    },
    { collapsed: true }
  );
}
