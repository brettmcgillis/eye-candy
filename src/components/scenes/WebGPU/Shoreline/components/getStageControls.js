import { folder } from 'leva';

export default function getStageControls(p) {
  return folder(
    {
      backgroundColor: { label: 'Background', value: p.backgroundColor },
      fogNear: {
        label: 'Fog Near',
        value: p.fogNear,
        min: 0,
        max: 300,
        step: 1,
      },
      fogFar: { label: 'Fog Far', value: p.fogFar, min: 10, max: 600, step: 1 },
    },
    { collapsed: true }
  );
}
