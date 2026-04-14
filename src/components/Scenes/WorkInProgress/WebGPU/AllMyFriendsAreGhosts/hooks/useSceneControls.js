import { folder, useControls } from 'leva';

export default function useSceneControls() {
  return useControls({
    Scene: folder({
      bgColor: { value: '#0a0a1a', label: 'Background' },
    }),
  });
}
