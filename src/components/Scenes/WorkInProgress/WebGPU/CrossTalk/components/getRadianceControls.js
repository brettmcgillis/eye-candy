import { folder } from 'leva';

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
        options: { Box: 1, Circle: 0, Triangle: 2 },
        value: p.occluderShape,
      },
      occluderSize: {
        label: 'Occluder Size (px)',
        max: 160,
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
        label: 'Decorative Scene',
        value: p.sceneDetail,
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
