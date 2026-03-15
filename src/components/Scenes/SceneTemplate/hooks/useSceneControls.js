import { useControls } from 'leva';

export default function useSceneControls() {
  const config = useControls('Scene Template', {}, { collapsed: true });
  return config;
}
