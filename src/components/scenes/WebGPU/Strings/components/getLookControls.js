import { folder } from 'leva';

import { color, presetReader, range } from './controlHelpers';

export default function getLookControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      Palette: folder(
        {
          backgroundColor: color('Background', p('backgroundColor')),
          bandColorA: color('Band A', p('bandColorA')),
          bandColorB: color('Band B', p('bandColorB')),
          bandColorC: color('Band C', p('bandColorC')),
          bandColorD: color('Band D', p('bandColorD')),
          colorDrift: range('Band Drift', p('colorDrift'), 0.5, 60, 0.5),
        },
        { collapsed: true }
      ),
      Strands: folder(
        {
          fiberWidth: range('Width', p('fiberWidth'), 0.0005, 0.03, 0.0005),
          minPixels: range('Min Pixels', p('minPixels'), 0.25, 3, 0.05),
          edgeSoftness: range('Edge Softness', p('edgeSoftness'), 0, 1, 0.01),
          wander: range('Wander', p('wander'), 0, 0.05, 0.0005),
          wanderFrequency: range(
            'Wander Frequency',
            p('wanderFrequency'),
            0,
            40,
            0.5
          ),
          plyFrequency: range('Ply Twist', p('plyFrequency'), 0, 80, 0.5),
          plyDepth: range('Ply Depth', p('plyDepth'), 0, 1, 0.01),
          plyGloss: range('Ply Gloss', p('plyGloss'), 0, 2, 0.01),
          occlusion: range('Depth Occlusion', p('occlusion'), 0, 1, 0.01),
          occlusionReach: range(
            'Occlusion Reach',
            p('occlusionReach'),
            0,
            1,
            0.01
          ),
          crestShadow: range('Crest Shadow', p('crestShadow'), 0, 1, 0.01),
          shadowStrength: range('Self Shadow', p('shadowStrength'), 0, 40, 0.1),
          shadowStep: range('Shadow Reach', p('shadowStep'), 0.002, 0.5, 0.002),
          depthFade: range('Depth Fade', p('depthFade'), 0, 0.3, 0.001),
        },
        { collapsed: true }
      ),
      Shading: folder(
        {
          iridescence: range('Iridescence', p('iridescence'), 0, 1, 0.01),
          iridescenceFrequency: range(
            'Iridescence Freq',
            p('iridescenceFrequency'),
            0,
            8,
            0.05
          ),
          specular: range('Specular', p('specular'), 0, 4, 0.01),
          primaryShift: range(
            'Primary Shift',
            p('primaryShift'),
            -0.5,
            0.5,
            0.005
          ),
          secondaryShift: range(
            'Secondary Shift',
            p('secondaryShift'),
            -0.5,
            0.5,
            0.005
          ),
          transmission: range('Transmission', p('transmission'), 0, 4, 0.01),
          transmissionFocus: range(
            'Transmission Focus',
            p('transmissionFocus'),
            1,
            60,
            0.5
          ),
          glint: range('Glint', p('glint'), 0, 1, 0.01),
          glintScale: range('Glint Scale', p('glintScale'), 1, 400, 1),
          shininess: range('Shininess', p('shininess'), 1, 400, 1),
          secondarySpecular: range(
            'Secondary Spec',
            p('secondarySpecular'),
            0,
            2,
            0.01
          ),
          diffuse: range('Diffuse', p('diffuse'), 0, 2, 0.01),
          ambient: range('Ambient', p('ambient'), 0, 1, 0.005),
          backlight: range('Backlight', p('backlight'), 0, 4, 0.01),
        },
        { collapsed: true }
      ),
      Light: folder(
        {
          lightColor: color('Color', p('lightColor')),
          lightIntensity: range('Intensity', p('lightIntensity'), 0, 6, 0.01),
          lightAzimuth: range('Azimuth', p('lightAzimuth'), -180, 180, 1),
          lightElevation: range('Elevation', p('lightElevation'), -10, 90, 1),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
