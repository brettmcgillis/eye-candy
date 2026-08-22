import { folder } from 'leva';

import { OCCLUDER_SHAPES } from '../utils/radianceConstants';

const OCCLUDER_SHAPE_OPTIONS = Object.fromEntries(
  OCCLUDER_SHAPES.map((name, id) => [name, id])
);

export default function getRadianceControls(p, render) {
  return folder(
    {
      lightColor: { label: 'This Window’s Light Color', value: p.lightColor },
      lightIntensity: {
        label: 'Light Intensity',
        max: 4,
        min: 0.2,
        step: 0.1,
        value: p.lightIntensity,
      },
      lightRadius: {
        label: 'Light Radius (px)',
        max: 40,
        min: 4,
        step: 1,
        value: p.lightRadius,
      },
      occluderShape: {
        label: 'Occluder Shape',
        options: OCCLUDER_SHAPE_OPTIONS,
        value: p.occluderShape,
      },
      occluderColor: { label: 'Occluder Color', value: p.occluderColor },
      occluderSize: {
        label: 'Occluder Size (px)',
        max: 300,
        min: 10,
        step: 2,
        value: p.occluderSize,
      },
      occluderRotation: {
        label: 'Occluder Rotation (deg)',
        max: 360,
        min: 0,
        step: 1,
        value: p.occluderRotation,
      },
      sceneDetail: {
        label: 'Decorative Scene (host tab)',
        value: p.sceneDetail,
      },
      decorColor: {
        label: 'Decor Color (host tab)',
        value: p.decorColor,
      },
      decorScale: {
        label: 'Decor Scale (px)',
        max: 3000,
        min: 200,
        step: 20,
        value: p.decorScale,
      },
      decorSpin: {
        label: 'Decor Spin',
        max: 3,
        min: 0,
        step: 0.05,
        value: p.decorSpin,
      },
      shadowSoftness: {
        label: 'Shadow Softness',
        max: 0.12,
        min: 0.002,
        step: 0.002,
        value: p.shadowSoftness,
      },
      ambient: {
        label: 'Ambient Floor',
        max: 0.4,
        min: 0,
        step: 0.01,
        value: p.ambient,
      },
      exposure: {
        label: 'Exposure',
        max: 4,
        min: 0.4,
        step: 0.1,
        value: p.exposure,
      },
    },
    { collapsed: true, render }
  );
}
