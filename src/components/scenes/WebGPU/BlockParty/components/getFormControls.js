import { folder } from 'leva';

import { choice, presetReader, range } from './controlHelpers';

// Lengths are reference pixels; heights go through the sketch's own
// (-1, -1) nudge, so 1 here is the drawing's depth.
export default function getFormControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      Towers: folder({
        towerHeightScale: range(
          'Height Scale',
          p('towerHeightScale', 1),
          0,
          4,
          0.05
        ),
        towerMinHeight: range('Min Height', p('towerMinHeight', 20), 0, 200, 1),
        towerHeightRange: range(
          'Height Range',
          p('towerHeightRange', 300),
          0,
          1000,
          5
        ),
        towerHeightCurve: range(
          'Height Curve',
          p('towerHeightCurve', 1),
          0.1,
          6,
          0.05
        ),
        towerCenterBias: range(
          'Centre Bias',
          p('towerCenterBias', 0),
          -1,
          1,
          0.01
        ),
        minTowerFootprint: range(
          'Min Width',
          p('minTowerFootprint', 6),
          1,
          24,
          0.5
        ),
      }),
      Cards: folder({
        plazaLift: range('Float', p('plazaLift', 1), 0, 6, 0.05),
        cardFloatJitter: range(
          'Float Jitter',
          p('cardFloatJitter', 0),
          0,
          1,
          0.01
        ),
        cardThickness: range(
          'Thickness',
          p('cardThickness', 0.6),
          0.1,
          12,
          0.1
        ),
        cardStack: range('Stack', p('cardStack', 1), 1, 3, 1),
        cardStackGap: range('Stack Gap', p('cardStackGap', 8), 1, 60, 0.5),
        neonThickness: range(
          'Pad Thickness',
          p('neonThickness', 0.5),
          0.1,
          12,
          0.1
        ),
      }),
      Pits: folder({
        pitStyle: choice('Style', p('pitStyle', 'shaft'), [
          'shaft',
          'terraced',
        ]),
        pitLayers: range('Layers', p('pitLayers', 10), 1, 30, 1),
        pitLayerDepth: range('Layer Depth', p('pitLayerDepth', 10), 1, 40, 0.5),
        pitTerraceInset: range(
          'Terrace Inset',
          p('pitTerraceInset', 3),
          0.5,
          20,
          0.5
        ),
      }),
      Stairs: folder({
        stairDirection: choice('Direction', p('stairDirection', 'random'), [
          'random',
          'forward',
          'backward',
          'alternate',
        ]),
        stairDrop: range('Drop', p('stairDrop', 4), 0.25, 20, 0.25),
        stairTaperScale: range('Taper', p('stairTaperScale', 0), 0, 4, 0.05),
        stairTaperWall: {
          label: 'Taper Wall',
          value: p('stairTaperWall', false),
        },
      }),
      pedestalShape: choice('Pedestal Shape', p('pedestalShape', 'square'), [
        'square',
        'circle',
      ]),
      pedestalDepth: range(
        'Pedestal Depth',
        p('pedestalDepth', 160),
        0,
        1200,
        5
      ),
    },
    { collapsed: true }
  );
}
