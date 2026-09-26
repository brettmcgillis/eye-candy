import { folder } from 'leva';

import { color, presetReader, range } from './controlHelpers';

export default function getSphereControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      sphereCount: range('Count', p('sphereCount'), 1, 32, 1),
      sphereRadiusMin: range('Min Radius', p('sphereRadiusMin'), 0.1, 2, 0.01),
      sphereRadiusMax: range('Max Radius', p('sphereRadiusMax'), 0.1, 2, 0.01),
      sphereColor: color('Color', p('sphereColor')),
      sphereRoughness: range('Roughness', p('sphereRoughness'), 0, 1, 0.01),
      sphereSpeed: range('Speed', p('sphereSpeed'), 0, 4, 0.05),
      sphereDrive: range('Drive', p('sphereDrive'), 0, 10, 0.1),
      sphereResistance: range('Resistance', p('sphereResistance'), 0, 1, 0.01),
      laneStiffness: range('Lane Pull', p('laneStiffness'), 0, 4, 0.05),
      growTime: range('Grow In', p('growTime'), 0, 10, 0.1),
    },
    { collapsed: true }
  );
}
