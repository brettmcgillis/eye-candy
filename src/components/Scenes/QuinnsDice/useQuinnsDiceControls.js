import { useControls } from 'leva';

export default function useQuinnsDiceControls() {
  return useControls({
    debug: {
      label: 'Debug',
      value: true,
    },
    backgroundColor: {
      label: 'Background',
      value: '#141622',
    },
    returnStrength: {
      label: 'Return Strength',
      value: 0.2,
      min: 0,
      max: 2,
      step: 0.01,
    },
    maxImpulse: {
      label: 'Max Impulse',
      value: 0.5,
      min: 0.01,
      max: 5,
      step: 0.01,
    },
    linearDamping: {
      label: 'Linear Damping',
      value: 4,
      min: 0,
      max: 12,
      step: 0.1,
    },
    angularDamping: {
      label: 'Angular Damping',
      value: 1,
      min: 0,
      max: 12,
      step: 0.1,
    },
    friction: {
      label: 'Friction',
      value: 0.1,
      min: 0,
      max: 2,
      step: 0.01,
    },
    targetX: {
      label: 'Target X',
      value: 0,
      min: -10,
      max: 10,
      step: 0.1,
    },
    targetY: {
      label: 'Target Y',
      value: 0,
      min: -10,
      max: 10,
      step: 0.1,
    },
    targetZ: {
      label: 'Target Z',
      value: 0,
      min: -10,
      max: 10,
      step: 0.1,
    },
    pointerRadius: {
      label: 'Pointer Radius',
      value: 1.3,
      min: 0.1,
      max: 5,
      step: 0.1,
    },
  });
}
