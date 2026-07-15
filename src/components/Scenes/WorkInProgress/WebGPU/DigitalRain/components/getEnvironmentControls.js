import { folder } from 'leva';

// Leva schema for scene-wide environment settings not owned by any single
// component (camera/cloud/rain/lighting/photo-studio each have their own
// folder) — currently just the background color behind everything.
export default function getEnvironmentControls(p = {}) {
  return folder(
    {
      backgroundColor: {
        label: 'Background',
        value: p.backgroundColor ?? '#020203',
      },
    },
    { collapsed: true }
  );
}
