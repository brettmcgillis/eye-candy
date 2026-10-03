import {
  BLEED_QUALITY,
  PixelBleedNode,
  buildPixelBleedNode,
  createPixelBleedUniforms,
} from '@modules/tsl';

import createPost from '../shared/createPost';
import { FITS } from '../shared/createSourcePlane';
import { choice, color, flag, num } from '../shared/specs';

const UNIFORM_KEYS = [
  'reach',
  'strength',
  'angle',
  'offsetR',
  'offsetG',
  'offsetB',
  'highlights',
  'tintAmount',
];

const OPTIONS = {
  fit: choice('Fit', FITS, 'cover'),
  quality: choice('Quality', Object.keys(BLEED_QUALITY), 'full'),
  reach: num('Reach (px)', 0.9, 0, 12, 0.05),
  strength: num('Strength', 0.89, 0, 0.98, 0.01),
  angle: num('Angle', 90, 0, 360, 1),
  offsetR: num('Offset R', 6, 0, 8, 0.01),
  offsetG: num('Offset G', 1, 0, 8, 0.01),
  offsetB: num('Offset B', 0.17, 0, 8, 0.01),
  highlights: num('Highlights only', 0, 0, 1, 0.01),
  tint: color('Tint', '#ffffff'),
  tintAmount: num('Tint amount', 0, 0, 1, 0.01),
  motionSmear: flag('Motion smear', false),
  smear: num('Smear amount', 0.85, 0, 0.98, 0.01),
};

export default {
  animated: (options) => options.motionSmear,
  description:
    'Aged-emulsion colour bleed: each channel runs its own distance along one direction, with optional persistence that trails anything that moves.',
  engine: 'webgpu',
  id: 'pixelBleed',
  inputs: ['still', 'video', 'live'],
  label: 'Pixel Bleed',
  options: OPTIONS,
  order: 72,
  sections: [
    {
      keys: ['fit', 'quality', 'reach', 'strength', 'angle'],
      title: 'Bleed',
    },
    {
      keys: [
        'offsetR',
        'offsetG',
        'offsetB',
        'highlights',
        'tint',
        'tintAmount',
      ],
      title: 'Colour',
    },
    { keys: ['motionSmear', 'smear'], title: 'Motion' },
  ],

  create(stage) {
    return createPost(stage, {
      baked: ['quality', 'motionSmear'],
      build({ options, plane }) {
        const u = createPixelBleedUniforms();
        const source = plane.scenePass.getTextureNode();
        const quality = BLEED_QUALITY[options.quality];
        const smearNode = options.motionSmear
          ? new PixelBleedNode(source, u, quality)
          : null;
        return {
          colorNode: smearNode
            ? smearNode.getTextureNode()
            : buildPixelBleedNode(source, u, quality),
          dispose: () => smearNode?.dispose(),
          update(values) {
            UNIFORM_KEYS.forEach((key) => {
              u[key].value = values[key];
            });
            u.tintColor.value.set(values.tint);
            u.smear.value = values.motionSmear ? values.smear : 0;
          },
        };
      },
    });
  },
};
