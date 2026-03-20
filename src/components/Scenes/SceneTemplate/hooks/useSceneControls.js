import { useControls } from 'leva';

import useComponentControls from '../components/useComponentControls';

export default function useSceneControls() {
  const [sceneControls, setSceneControls] = useControls(
    'Scene Template',
    {},
    { collapsed: true }
  );
  const [controls, setControls] = useComponentControls('My Component');

  return sceneControls;
}
