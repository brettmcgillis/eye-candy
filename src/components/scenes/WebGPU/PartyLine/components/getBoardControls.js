import { folder } from 'leva';

export default function getBoardControls(p) {
  return folder(
    {
      backgroundColor: { label: 'Background', value: p.backgroundColor },
      paperColor: { label: 'Paper', value: p.paperColor },
      pencilScale: {
        label: 'Pencil Size',
        max: 2.5,
        min: 0.3,
        step: 0.05,
        value: p.pencilScale,
      },
    },
    { collapsed: true }
  );
}
