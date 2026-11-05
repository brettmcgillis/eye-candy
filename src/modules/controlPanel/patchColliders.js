import { partBounds, placePart } from './parts';

export default function patchColliders(panel) {
  const boxes = [
    {
      min: [...panel.bounds.min],
      max: [panel.bounds.max[0], panel.bounds.max[1], 0.015],
    },
  ];
  const panelParts = [
    ...panel.chassis,
    ...panel.modules.flatMap((module) => module.statics),
  ];
  panelParts.forEach((p) => {
    if (p.s[2] > 0.025 && p.p[2] + p.s[2] > 0.02)
      boxes.push({
        min: p.p.map((v, i) => v - p.s[i]),
        max: p.p.map((v, i) => v + p.s[i]),
      });
  });
  panel.controls.forEach((control) => {
    if (!control) return;
    const pieces = [
      ...control.statics,
      ...(control.pose && !control.loose
        ? control.pose(
            control.signals.map((s) => s.base ?? 0.5),
            { t: 0, audio: [], step: 0 }
          )
        : []),
    ];
    // Moving control collision is a conservative cap-height envelope.
    if (control.sockets.length) return;
    const { offset, scale } = control.transform;
    const cap = pieces.filter((p) => p.s[2] > 0.025 && p.p[2] + p.s[2] > 0.08);
    const bounds = {
      min: [Infinity, Infinity, Infinity],
      max: [-Infinity, -Infinity, -Infinity],
    };
    cap.forEach((p) => {
      const local = control.statics.includes(p) ? null : control.transform;
      if (control.transform.q) {
        const box = partBounds(local ? placePart(p, local) : p);
        for (let axis = 0; axis < 3; axis += 1) {
          bounds.min[axis] = Math.min(bounds.min[axis], box.min[axis]);
          bounds.max[axis] = Math.max(bounds.max[axis], box.max[axis]);
        }
        return;
      }
      const center = local
        ? p.p.map((v, axis) => v * scale + offset[axis])
        : p.p;
      const size = local ? p.s.map((v) => v * scale) : p.s;
      for (let axis = 0; axis < 3; axis += 1) {
        bounds.min[axis] = Math.min(
          bounds.min[axis],
          center[axis] - size[axis]
        );
        bounds.max[axis] = Math.max(
          bounds.max[axis],
          center[axis] + size[axis]
        );
      }
    });
    if (cap.length) boxes.push(bounds);
  });
  return boxes;
}
