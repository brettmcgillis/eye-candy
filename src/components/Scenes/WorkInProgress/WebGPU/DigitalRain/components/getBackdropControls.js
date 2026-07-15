import { folder } from 'leva';

export default function getBackdropControls(p = {}) {
  return folder(
    {
      backdropPosition: {
        label: 'Position',
        value: p.backdropPosition ?? { x: 0, y: -0.01, z: -10 },
      },
      // Wide/tall relative to the cloud+camera framing on purpose — a
      // cyclorama wall reads as an enveloping infinity cove, not a small
      // ramp, so the wall's left/right/top edges sit outside the camera's
      // view (only the floor-to-wall curve stays visible, per todo.md).
      backdropScale: {
        label: 'Scale',
        value: p.backdropScale ?? { x: 70, y: 36, z: 28 },
      },
      backdropFloor: {
        label: 'Floor Curve',
        value: p.backdropFloor ?? 0.35,
        min: 0,
        max: 1,
        step: 0.01,
      },
      backdropSegments: {
        label: 'Segments',
        value: p.backdropSegments ?? 32,
        min: 4,
        max: 60,
        step: 1,
      },
      backdropColor: { label: 'Color', value: p.backdropColor ?? '#ffffff' },
      backdropRoughness: {
        label: 'Roughness',
        value: p.backdropRoughness ?? 0.85,
        min: 0,
        max: 1,
        step: 0.01,
      },
      backgroundColor: {
        label: 'Background',
        value: p.backgroundColor ?? '#020203',
      },
    },
    { collapsed: true }
  );
}
