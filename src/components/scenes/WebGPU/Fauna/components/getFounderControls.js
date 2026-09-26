import { button, folder } from 'leva';

import { presetReader, range } from './controlHelpers';

export default function getFounderControls(preset = {}, { onReroll } = {}) {
  const p = presetReader(preset);

  return folder(
    {
      founderSeed: { label: 'Seed', value: p('founderSeed') },
      rerollFounders: button(() => onReroll?.()),
      founderCount: range('Founders', p('founderCount'), 1, 12, 1),
      planInvader: range('Invader Weight', p('planInvader'), 0, 1, 0.05),
      planBlob: range('Blob Weight', p('planBlob'), 0, 1, 0.05),
      planSwimmer: range('Swimmer Weight', p('planSwimmer'), 0, 1, 0.05),
      bitDensity: range('Bitmap Density', p('bitDensity'), 0.2, 0.85, 0.01),
      tentacleChance: range('Tentacle Chance', p('tentacleChance'), 0, 1, 0.01),
      carnivoreChance: range(
        'Carnivore Chance',
        p('carnivoreChance'),
        0,
        1,
        0.01
      ),
    },
    { collapsed: true }
  );
}
