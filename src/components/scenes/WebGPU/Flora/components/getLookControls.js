import { folder } from 'leva';

import { PALETTE_NAMES, PALETTE_NONE } from '@utils/gradientPalette';

import { presetReader, range } from './controlHelpers';

function color(label, value) {
  return { label, value };
}

export default function getLookControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      Palette: folder(
        {
          paletteName: {
            label: 'Palette',
            options: [PALETTE_NONE, ...PALETTE_NAMES],
            value: p('paletteName'),
          },
          paletteShuffle: {
            label: 'New Palette Each Generation',
            value: p('paletteShuffle'),
          },
          paletteExact: { label: 'Exact Colors', value: p('paletteExact') },
          backgroundColor: color('Background', p('backgroundColor')),
          stemColor: color('Stem', p('stemColor')),
          budColor: color('Bud', p('budColor')),
          crownColor: color('Crown', p('crownColor')),
          accentColor: color('Accent', p('accentColor')),
          tipColor: color('Tips', p('tipColor')),
          ornamentColor: color('Ornaments', p('ornamentColor')),
          greenReach: range('Green Reach', p('greenReach'), 0.001, 1, 0.005),
          tipAmount: range('Tip Amount', p('tipAmount'), 0, 1, 0.01),
          tipPower: range('Tip Falloff', p('tipPower'), 0.2, 8, 0.05),
          tintVariance: range('Lobe Variance', p('tintVariance'), 0, 1, 0.01),
        },
        { collapsed: true }
      ),
      Strands: folder(
        {
          stemWidth: range('Stem Width', p('stemWidth'), 0.002, 0.2, 0.001),
          tipWidth: range('Tip Width', p('tipWidth'), 0.0005, 0.05, 0.0005),
          thicknessCurve: range('Taper', p('thicknessCurve'), 0.2, 8, 0.05),
          leafWidth: range('Leaf Width', p('leafWidth'), 0, 0.3, 0.005),
          leafFlatness: range(
            'Leaf Flatness',
            p('leafFlatness'),
            0.05,
            1,
            0.01
          ),
          minPixels: range('Min Pixels', p('minPixels'), 0.25, 4, 0.05),
          ornamentScale: range(
            'Ornament Scale',
            p('ornamentScale'),
            0,
            4,
            0.05
          ),
          ornamentMinPixels: range(
            'Ornament Min Px',
            p('ornamentMinPixels'),
            0,
            10,
            0.1
          ),
        },
        { collapsed: true }
      ),
      Surface: folder(
        {
          roughness: range('Roughness', p('roughness'), 0.05, 1, 0.01),
          occlusion: range('Occlusion', p('occlusion'), 0, 1, 0.01),
          cardCup: range('Petal Cup', p('cardCup'), -0.6, 0.6, 0.01),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
