import { useControls } from 'leva';

const DEFAULTS = {
  height: 6,
  radius: 0.4,
  tilt: 15,
};

export default function useCandleControls(controlName, defaultValues = {}) {
  const defaults = { ...DEFAULTS, ...defaultValues };

  const [controls, setControls] = useControls(
    controlName ?? 'Candle',
    () => ({
      height: {
        label: 'Height',
        value: defaults.height,
        min: 2,
        max: 12,
        step: 0.1,
      },
      radius: {
        label: 'Radius',
        value: defaults.radius,
        min: 0.1,
        max: 1.5,
        step: 0.05,
      },
      tilt: {
        label: 'Tilt (°)',
        value: defaults.tilt,
        min: -45,
        max: 45,
        step: 1,
      },
    }),
    { collapsed: true }
  );

  return [controls, setControls];
}
