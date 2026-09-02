import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js';
import { uniform } from 'three/tsl';

import { DOF_FOCUS_MODES } from '../scenePostUtils';

export const defaults = {
  bokehScale: 4,
  focalLength: 2.5,
  focusDistance: 8,
  focusMode: 'manual',
  focusSmoothing: 6,
};

export function controls(slot) {
  return {
    [`${slot.prefix}FocusMode`]: {
      label: 'Focus Mode',
      options: DOF_FOCUS_MODES,
      value: slot.focusMode,
    },
    [`${slot.prefix}FocusDistance`]: {
      label: 'Focus Distance',
      max: 60,
      min: 0.1,
      step: 0.1,
      value: slot.focusDistance,
    },
    [`${slot.prefix}FocalLength`]: {
      label: 'Focal Length',
      max: 40,
      min: 0.1,
      step: 0.1,
      value: slot.focalLength,
    },
    [`${slot.prefix}BokehScale`]: {
      label: 'Bokeh Scale',
      max: 20,
      min: 1,
      step: 0.5,
      value: slot.bokehScale,
    },
    [`${slot.prefix}FocusSmoothing`]: {
      label: 'Focus Smoothing',
      max: 20,
      min: 0,
      step: 0.5,
      value: slot.focusSmoothing,
    },
  };
}

// focusDistance is a distance along the camera's look direction, so a world
// focus point (orbit target, or a click) has to be re-measured every frame as
// the camera moves — it is not a fixed number once the camera is orbiting.
export function create({ ctx, input, slot }) {
  const uFocusDistance = uniform(slot.focusDistance);
  const uFocalLength = uniform(slot.focalLength);
  const uBokehScale = uniform(slot.bokehScale);

  return {
    node: dof(input, ctx.viewZNode, uFocusDistance, uFocalLength, uBokehScale),
    update: (values, frame) => {
      uFocalLength.value =
        values[`${slot.prefix}FocalLength`] ?? slot.focalLength;
      uBokehScale.value = values[`${slot.prefix}BokehScale`] ?? slot.bokehScale;

      const mode = values[`${slot.prefix}FocusMode`] ?? slot.focusMode;
      const manual =
        values[`${slot.prefix}FocusDistance`] ?? slot.focusDistance;
      // `target` never reads the pointer and `pointer` never falls back to the
      // target — otherwise the two modes are indistinguishable in practice.
      const point =
        (mode === 'target' && frame.targetPoint) ||
        (mode === 'pointer' && frame.pointerPoint) ||
        null;
      const target = point ? -frame.toViewSpace(point).z : manual;

      const smoothing = values[`${slot.prefix}FocusSmoothing`] ?? 0;
      const blend = smoothing > 0 ? Math.min(1, smoothing * frame.delta) : 1;

      uFocusDistance.value += (target - uFocusDistance.value) * blend;
    },
  };
}
