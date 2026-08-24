import { folder } from 'leva';

export default function getLightingControls(p) {
  return folder(
    {
      lightColor: { label: 'Point Light Color', value: p.lightColor },
      lightIntensity: {
        label: 'Point Light Intensity',
        max: 150,
        min: 0,
        step: 1,
        value: p.lightIntensity,
      },
    },
    { collapsed: true }
  );
}
