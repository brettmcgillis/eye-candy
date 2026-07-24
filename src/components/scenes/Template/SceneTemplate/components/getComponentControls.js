import { folder } from 'leva';

// getComponentControls is a companion fn to Component and allows users
// to easily add leva controls for Component to any scene.
// The control schema should match the props of the Component
// The name prop should allow users to do multiple Components in a scene with discrete naming.
// The fn should accept default values too.
// The fn should set an example schema for the controls as well as apply defaults to the schema.
export default function getComponentControls(controlName, defaultValues = {}) {
  return folder(controlName ?? 'Component Controls', {}, { collapsed: true });
}
