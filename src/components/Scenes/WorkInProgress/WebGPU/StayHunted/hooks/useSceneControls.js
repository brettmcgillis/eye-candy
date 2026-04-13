import { folder, useControls } from 'leva';

export default function useSceneControls() {
  return useControls({
    Ribbon: folder({
      wind: { value: 1.5, min: 0, max: 5, step: 0.1, label: 'Wind' },
      stiffness: {
        value: 0.25,
        min: 0.05,
        max: 0.5,
        step: 0.01,
        label: 'Stiffness',
      },
      dampening: {
        value: 0.98,
        min: 0.9,
        max: 1.0,
        step: 0.001,
        label: 'Dampening',
      },
    }),
  });
}
