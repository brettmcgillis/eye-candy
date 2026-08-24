import { folder } from 'leva';

export default function getRoomControls(p) {
  return folder(
    {
      wallColor: { label: 'Wall Color', value: p.wallColor },
      wallRoughness: {
        label: 'Wall Roughness',
        max: 1,
        min: 0,
        step: 0.01,
        value: p.wallRoughness,
      },
    },
    { collapsed: true }
  );
}
