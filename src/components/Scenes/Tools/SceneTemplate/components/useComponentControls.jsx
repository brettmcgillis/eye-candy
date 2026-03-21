import { useControls } from 'leva';

// useComponentControls is a companion hook to Component and allows users
// to easily add leva controls for Component to any scene.
// The name prop should allow users to do multiple Components in a scene with discrete naming.
// The hook should accept default values too.
// The hook should set an example schema for the controls as well as apply defaults to the schema.
export default function useComponentControls(controlName, defaultValues = {}) {
  const [controls, setControls] = useControls(
    controlName ?? 'Component Controls',
    {},
    { collapsed: true }
  );

  return [controls, setControls];
}
