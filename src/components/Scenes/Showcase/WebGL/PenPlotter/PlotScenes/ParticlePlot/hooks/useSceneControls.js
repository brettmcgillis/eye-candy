import { useControls } from 'leva';

export default function useSceneControls() {
  const config = useControls('Particle Plot', {}, { collapsed: true });
  return config;
}
