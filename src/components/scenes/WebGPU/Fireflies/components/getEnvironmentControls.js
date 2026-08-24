import { folder } from 'leva';

// Scene-wide environment settings not owned by any single component —
// currently just the background color behind everything.
export default function getEnvironmentControls(p) {
  return folder(
    {
      backgroundColor: { value: p.backgroundColor, label: 'Background' },
    },
    { collapsed: true }
  );
}
