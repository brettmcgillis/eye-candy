import { folder } from 'leva';

export const DEFAULTS = {
  emitter1Color: '#ff3b30',
  emitter2Color: '#34ff6a',
  emitter3Color: '#3b6bff',
  emitter4Color: '#ffffff',
  emitterCount: 3,
  lightRadius: 16,
  lightIntensity: 1.1,
  occluderCount: 3,
  occluderSize: 7,
  occluderSpin: 0.25,
  regionOctaves: 3,
  sensitivity: 2.4,
  showRegions: true,
};

export default function getLightplayControls(p, render) {
  return folder(
    {
      lightplayHint: {
        editable: false,
        label: 'Play',
        value: 'drag lights + shapes / red green blue = 3 voices',
      },
      emitterCount: {
        label: 'Lights',
        max: 4,
        min: 1,
        step: 1,
        value: p.emitterCount,
      },
      emitter1Color: { label: 'Light 1 Color', value: p.emitter1Color },
      emitter2Color: { label: 'Light 2 Color', value: p.emitter2Color },
      emitter3Color: { label: 'Light 3 Color', value: p.emitter3Color },
      emitter4Color: { label: 'Light 4 Color', value: p.emitter4Color },
      lightIntensity: {
        label: 'Light Intensity',
        max: 3,
        min: 0.2,
        step: 0.05,
        value: p.lightIntensity,
      },
      lightRadius: {
        label: 'Light Reach',
        max: 40,
        min: 5,
        step: 0.5,
        value: p.lightRadius,
      },
      occluderCount: {
        label: 'Shapes',
        max: 6,
        min: 0,
        step: 1,
        value: p.occluderCount,
      },
      occluderSize: {
        label: 'Shape Size',
        max: 20,
        min: 2,
        step: 0.5,
        value: p.occluderSize,
      },
      occluderSpin: {
        label: 'Shape Spin (rad/s)',
        max: 2,
        min: -2,
        step: 0.05,
        value: p.occluderSpin,
      },
      regionOctaves: {
        label: 'Octave Rows',
        max: 4,
        min: 1,
        step: 1,
        value: p.regionOctaves,
      },
      sensitivity: {
        label: 'Volume Sensitivity',
        max: 6,
        min: 0.5,
        step: 0.1,
        value: p.sensitivity,
      },
      showRegions: { label: 'Show Pitch Grid', value: p.showRegions },
    },
    { collapsed: true, render }
  );
}
