import { folder } from 'leva';

import { SHAPE_SIDES } from '@utils/regularPolygon';

// Rotation turns the outline, not the terrain: the flow keeps running down -z
// and the shape swings round it, so 30 degrees on a hexagon is the difference
// between entering through a flat edge and entering at a vertex.
export default function getBedControls(p) {
  return folder(
    {
      bedShape: {
        label: 'Shape',
        value: p.bedShape,
        options: Object.keys(SHAPE_SIDES),
      },
      bedSize: {
        label: 'Size',
        value: p.bedSize,
        min: 0.25,
        max: 1,
        step: 0.01,
      },
      bedRotation: {
        label: 'Rotation',
        value: p.bedRotation,
        min: -90,
        max: 90,
        step: 1,
      },
    },
    { collapsed: true }
  );
}
