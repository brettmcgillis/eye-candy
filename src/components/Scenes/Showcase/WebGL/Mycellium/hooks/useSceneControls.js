import { useControls } from 'leva';

export default function useSceneControls() {
  return useControls(
    'Scene',
    {
      background: { label: 'Background', value: '#000000' },
      autoRotate: { label: 'Auto Rotate', value: true },
      autoRotateSpeed: {
        label: 'Rotate Speed',
        value: 0.4,
        min: -5,
        max: 5,
        step: 0.1,
      },
    },
    { collapsed: true }
  );
}
