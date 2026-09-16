import { button, folder } from 'leva';

import { presetReader, range } from './controlHelpers';

export default function getFormControls(preset = {}, { onReseed } = {}) {
  const p = presetReader(preset);

  return folder(
    {
      seed: { label: 'Seed', value: p('seed') },
      reseed: button(() => onReseed?.()),
      Stem: folder(
        {
          stemHeight: range('Height', p('stemHeight'), 1, 12, 0.1),
          stemCurve: range('Curve', p('stemCurve'), 0, 2, 0.01),
          stemWaves: range('Waves', p('stemWaves'), 0, 4, 0.05),
          leafBlades: range('Leaf Blades', p('leafBlades'), 0, 6, 1),
          leafLength: range('Leaf Length', p('leafLength'), 0.2, 6, 0.1),
          leafHeight: range('Leaf Height', p('leafHeight'), 0.05, 0.8, 0.01),
          sideShoots: range('Side Shoots', p('sideShoots'), 0, 5, 1),
          sideShootLength: range(
            'Shoot Length',
            p('sideShootLength'),
            0.5,
            8,
            0.1
          ),
        },
        { collapsed: true }
      ),
      Crown: folder(
        {
          crownRadius: range('Radius', p('crownRadius'), 0.5, 6, 0.05),
          crownStretch: range('Stretch', p('crownStretch'), 0.3, 2, 0.01),
          crownLift: range('Lift', p('crownLift'), 0, 2, 0.01),
          crownOpen: range('Open Base', p('crownOpen'), 0, 1, 0.01),
          crownBase: range('Attach From', p('crownBase'), 0.2, 1, 0.01),
          lobeCount: range('Lobes', p('lobeCount'), 1, 12, 1),
          lobeRise: range('Lobe Rise', p('lobeRise'), 0, 2, 0.01),
          lobeFalloff: range('Lobe Falloff', p('lobeFalloff'), 0.2, 1, 0.01),
          lobeSpread: range('Lobe Spread', p('lobeSpread'), 0, 1.5, 0.01),
          lobeJitter: range('Lobe Jitter', p('lobeJitter'), 0, 1, 0.01),
          accentAmount: range('Accent Lobes', p('accentAmount'), 0, 1, 0.01),
          shellBias: range('Shell Bias', p('shellBias'), 0, 1, 0.01),
        },
        { collapsed: true }
      ),
      Fibers: folder(
        {
          tips: range('Tips', p('tips'), 1000, 120000, 500),
          umbelSize: range('Umbel Size', p('umbelSize'), 1, 12, 1),
          splitRatio: range('Split Reach', p('splitRatio'), 0.05, 1, 0.01),
          sheaf: range('Sheaf', p('sheaf'), 0, 1, 0.01),
          splitBalance: range('Imbalance', p('splitBalance'), 0, 1, 0.01),
          fiberStep: range('Segment Length', p('fiberStep'), 0.04, 1, 0.01),
          fiberBend: range('Bend', p('fiberBend'), 0, 0.4, 0.005),
          fiberSag: range('Sag', p('fiberSag'), 0, 0.3, 0.005),
          wispChance: range('Wisps', p('wispChance'), 0, 0.2, 0.001),
          wispReach: range('Wisp Reach', p('wispReach'), 0, 3, 0.05),
        },
        { collapsed: true }
      ),
      Ornaments: folder(
        {
          ornamentDensity: range('Density', p('ornamentDensity'), 0, 1, 0.01),
          ornamentSize: range('Size', p('ornamentSize'), 0.005, 0.3, 0.005),
          Mix: folder(
            {
              sphereAmount: range('Spheres', p('sphereAmount'), 0, 1, 0.01),
              d4Amount: range('d4 Tetra', p('d4Amount'), 0, 1, 0.01),
              d6Amount: range('d6 Cube', p('d6Amount'), 0, 1, 0.01),
              d8Amount: range('d8 Octa', p('d8Amount'), 0, 1, 0.01),
              d10Amount: range('d10 Trapezo', p('d10Amount'), 0, 1, 0.01),
              d12Amount: range('d12 Dodeca', p('d12Amount'), 0, 1, 0.01),
              d20Amount: range('d20 Icosa', p('d20Amount'), 0, 1, 0.01),
              heartAmount: range('Hearts', p('heartAmount'), 0, 1, 0.01),
              petalAmount: range('Petals', p('petalAmount'), 0, 1, 0.01),
            },
            { collapsed: true }
          ),
          'Wireframe Ratio': folder(
            {
              sphereWire: range('Spheres', p('sphereWire'), 0, 1, 0.01),
              d4Wire: range('d4 Tetra', p('d4Wire'), 0, 1, 0.01),
              d6Wire: range('d6 Cube', p('d6Wire'), 0, 1, 0.01),
              d8Wire: range('d8 Octa', p('d8Wire'), 0, 1, 0.01),
              d10Wire: range('d10 Trapezo', p('d10Wire'), 0, 1, 0.01),
              d12Wire: range('d12 Dodeca', p('d12Wire'), 0, 1, 0.01),
              d20Wire: range('d20 Icosa', p('d20Wire'), 0, 1, 0.01),
              heartWire: range('Hearts', p('heartWire'), 0, 1, 0.01),
              petalWire: range('Petals', p('petalWire'), 0, 1, 0.01),
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),
      Variation: folder(
        {
          variation: range('Form', p('variation'), 0, 1, 0.01),
          paletteVariation: range('Palette', p('paletteVariation'), 0, 1, 0.01),
        },
        { collapsed: true }
      ),
      Growth: folder(
        {
          stemPhase: range('Stem Phase', p('stemPhase'), 0, 0.8, 0.01),
          burst: range('Burst', p('burst'), 0.2, 2, 0.01),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
