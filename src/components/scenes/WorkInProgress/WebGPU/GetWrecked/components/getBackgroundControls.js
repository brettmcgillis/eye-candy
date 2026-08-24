import { folder } from 'leva';

export default function getBackgroundControls(preset) {
  return folder(
    {
      backgroundColor: {
        label: 'Color',
        value: preset.backgroundColor,
      },
    },
    { collapsed: true }
  );
}
