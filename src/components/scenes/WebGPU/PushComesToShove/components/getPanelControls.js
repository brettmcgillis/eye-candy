import { folder } from 'leva';

import { color, presetReader, range } from './controlHelpers';

export default function getPanelControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      panelColor: color('Color', p('panelColor')),
      panelRoughness: range('Roughness', p('panelRoughness'), 0, 1, 0.01),
      panelThickness: range('Thickness', p('panelThickness'), 0.05, 1.5, 0.01),
      panelBevel: range('Bevel', p('panelBevel'), 0, 0.4, 0.01),
      panelResolution: range(
        'Mesh Cell',
        p('panelResolution'),
        0.025,
        0.15,
        0.005
      ),
      holeScale: range('Hole Scale', p('holeScale'), 0.05, 1.5, 0.01),
      holeThreshold: range(
        'Hole Threshold',
        p('holeThreshold'),
        0.3,
        0.8,
        0.005
      ),
      holeWarp: range('Hole Warp', p('holeWarp'), 0, 6, 0.05),
      holeMargin: range('Edge Margin', p('holeMargin'), 0, 4, 0.05),
      holeSeed: range('Hole Seed', p('holeSeed'), 1, 999, 1),
    },
    { collapsed: true }
  );
}
