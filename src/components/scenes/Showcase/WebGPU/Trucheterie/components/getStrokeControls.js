import { STROKE_PATH } from './controlPaths';

const isSolidFill = (get) => get(`${STROKE_PATH}.fillMode`) === 'solid';

// The "engraved contour" multi-stroke rendering knobs — shared by every
// grid mode. Keys must match presets/presets.js 1:1.
export default function getStrokeControls(snapshot = {}) {
  return {
    strokePitch: {
      label: 'Stroke Pitch',
      max: 0.2,
      min: 0.005,
      step: 0.001,
      value: snapshot.strokePitch ?? 0.035,
    },
    strokeWidth: {
      label: 'Stroke Width',
      max: 0.1,
      min: 0.001,
      step: 0.001,
      value: snapshot.strokeWidth ?? 0.012,
    },
    fillMode: {
      label: 'Fill Mode',
      options: ['line', 'solid'],
      value: snapshot.fillMode ?? 'line',
    },
    fillWidth: {
      label: 'Fill Width',
      max: 0.45,
      min: 0.02,
      render: isSolidFill,
      step: 0.01,
      value: snapshot.fillWidth ?? 0.16,
    },
  };
}
