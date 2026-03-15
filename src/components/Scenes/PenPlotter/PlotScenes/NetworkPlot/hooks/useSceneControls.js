import { useControls } from 'leva';

export default function useSceneControls() {
  const config = useControls('Network Plot', {}, { collapsed: true });
  return config;
}
