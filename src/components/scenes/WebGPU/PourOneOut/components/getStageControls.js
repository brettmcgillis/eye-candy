import { folder } from 'leva';

export default function getStageControls(p) {
  return folder(
    {
      backgroundColor: { label: 'Background', value: p.backgroundColor },
      showBounds: { label: 'Show Bounds', value: p.showBounds },
      boundsColor: { label: 'Bounds Color', value: p.boundsColor },
    },
    { collapsed: true }
  );
}
