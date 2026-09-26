import { folder } from 'leva';

import { choice, presetReader, range } from './controlHelpers';

export default function getLookControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      backgroundColor: { label: 'Background', value: p('backgroundColor') },
      soilColor: { label: 'Soil', value: p('soilColor') },
      mossColor: { label: 'Moss', value: p('mossColor') },
      meatColor: { label: 'Carrion', value: p('meatColor') },
      gridStrength: range('Grid', p('gridStrength'), 0, 1, 0.01),
      invaderSkin: choice('Invader Skin', p('invaderSkin'), [
        'auto',
        'voxel',
        'smooth',
      ]),
      voxelFill: range('Voxel Fill', p('voxelFill'), 0.5, 1, 0.01),
      creatureRoughness: range(
        'Roughness',
        p('creatureRoughness'),
        0.2,
        2,
        0.01
      ),
      heroScale: range('Hero Scale', p('heroScale'), 1, 10, 0.1),
    },
    { collapsed: true }
  );
}
