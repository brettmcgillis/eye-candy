import { folder } from 'leva';

import COLOR_MODES from '../../utils/colorModes';

export default function getColorControls(snapshot) {
  return folder(
    {
      colorMode: {
        label: 'Color Mode',
        value: snapshot.colorMode,
        options: COLOR_MODES,
      },
      colorScale: {
        label: 'Color Scale',
        value: snapshot.colorScale,
        min: 0.1,
        max: 10,
        step: 0.1,
      },
      colorA: { label: 'Color A', value: snapshot.colorA },
      colorB: { label: 'Color B', value: snapshot.colorB },
    },
    { collapsed: true }
  );
}
