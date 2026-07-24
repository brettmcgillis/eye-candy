import { folder } from 'leva';

// Leva schema for PhotoStudioSet — the reusable studio-set model
// (elements/PhotoStudio) standing in for/alongside PhotoBackdrop's
// procedural cyclorama sweep. Off by default so it doesn't collide with
// PhotoBackdrop until its transform is dialed in; see todo.md.
export default function getPhotoStudioControls(p = {}) {
  return folder(
    {
      photoStudioVisible: {
        label: 'Visible',
        value: p.photoStudioVisible ?? true,
      },
      photoStudioPosition: {
        label: 'Position',
        value: p.photoStudioPosition ?? { x: 0, y: 0, z: 0 },
      },
      photoStudioScale: {
        label: 'Scale',
        value: p.photoStudioScale ?? 12,
        min: 0.5,
        max: 20,
        step: 0.1,
      },
      photoStudioRotationY: {
        label: 'Rotation Y',
        value: p.photoStudioRotationY ?? 0,
        min: -Math.PI,
        max: Math.PI,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
