import { useControls } from 'leva';

export default function useSceneControls() {
  const config = useControls('Generative Geometry', {}, { collapsed: true });
  return config;
}
