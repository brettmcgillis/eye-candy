import { button, folder } from 'leva';

export default function getFeatherControls(p, onScatter, render) {
  return folder(
    {
      attractorStrength: {
        label: "This Window's Pull (px/s²)",
        max: 3000,
        min: 0,
        step: 50,
        value: p.attractorStrength,
      },
      mouseStrength: {
        label: 'Cursor Pull (px/s²)',
        max: 3000,
        min: 0,
        step: 50,
        value: p.mouseStrength,
      },
      spinStrength: {
        label: 'Orbit Spin',
        max: 2,
        min: -2,
        step: 0.05,
        value: p.spinStrength,
      },
      particleCount: {
        label: 'Feather Count',
        max: 600,
        min: 20,
        step: 10,
        value: p.particleCount,
      },
      featherScale: {
        label: 'Feather Size (px)',
        max: 200,
        min: 20,
        step: 5,
        value: p.featherScale,
      },
      damping: {
        label: 'Air Drag',
        max: 0.999,
        min: 0.9,
        step: 0.001,
        value: p.damping,
      },
      maxSpeed: {
        label: 'Max Speed (px/s)',
        max: 1600,
        min: 100,
        step: 25,
        value: p.maxSpeed,
      },
      scatterFeathers: button(() => onScatter()),
    },
    { collapsed: true, render }
  );
}
