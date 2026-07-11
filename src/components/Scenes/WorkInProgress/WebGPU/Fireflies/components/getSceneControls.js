import { folder } from 'leva';

export default function getSceneControls(p) {
  return folder(
    {
      backgroundColor: { label: 'Background', value: p.backgroundColor },
      toneMappingExposure: {
        label: 'Exposure',
        max: 5,
        min: 0.1,
        step: 0.1,
        value: p.toneMappingExposure,
      },
    },
    { collapsed: true }
  );
}
