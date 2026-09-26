import { button, folder } from 'leva';

import { presetReader, range } from './controlHelpers';

export default function getWorldControls(preset = {}, { onResetWorld } = {}) {
  const p = presetReader(preset);

  return folder(
    {
      paused: { label: 'Paused', value: p('paused') },
      timeScale: range('Time Scale', p('timeScale'), 0, 32, 0.25),
      resetWorld: button(() => onResetWorld?.()),
      Population: folder(
        {
          populationCap: range('Cap', p('populationCap'), 20, 500, 1),
          founderCopies: range(
            'Copies per Founder',
            p('founderCopies'),
            1,
            12,
            1
          ),
          worldSize: range('World Size', p('worldSize'), 24, 96, 1),
        },
        { collapsed: true }
      ),
      Ecology: folder(
        {
          foodStart: range('Moss Start', p('foodStart'), 0, 1, 0.01),
          foodGrowth: range('Moss Growth', p('foodGrowth'), 0, 0.4, 0.005),
          foodSpread: range('Moss Spread', p('foodSpread'), 0, 1, 0.01),
          meatDecay: range('Carrion Decay', p('meatDecay'), 0, 0.3, 0.005),
          metabolismScale: range(
            'Metabolism',
            p('metabolismScale'),
            0.25,
            3,
            0.05
          ),
          lifespanScale: range('Lifespan', p('lifespanScale'), 0.25, 4, 0.05),
        },
        { collapsed: true }
      ),
      Genetics: folder(
        {
          mutationScale: range('Mutation', p('mutationScale'), 0, 5, 0.05),
          compatibility: range(
            'Compatibility',
            p('compatibility'),
            0.05,
            1,
            0.01
          ),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
