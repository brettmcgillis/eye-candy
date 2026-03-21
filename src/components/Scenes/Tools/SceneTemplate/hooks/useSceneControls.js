import { useControls } from 'leva';

import useComponentControls from '../components/useComponentControls';

// useSceneControls is a companion hook to SceneTemplate provides
// all of the scene configuration that will be used in SceneTemplate.
// This hook should leverage the presets in scenePresets.js and provide
// an example of how to switch between different scene presets. This hook
// should also provide an example of how we reset controls from the current
// preset.This hook should also provide an example of how we offer a
// copy preset button in dev for bringing presets back to the IDE.
export default function useSceneControls() {
  const [sceneControls, setSceneControls] = useControls(
    'Scene Template',
    {},
    { collapsed: true }
  );
  const [controls, setControls] = useComponentControls('My Component');

  return sceneControls;
}
