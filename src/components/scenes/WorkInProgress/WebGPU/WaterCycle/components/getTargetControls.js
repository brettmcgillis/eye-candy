import { TARGET_MODES } from '../utils/targetGeometry';
import { isMeshTarget } from './controlPaths';

// What the rain lands on. Everything below the mode picker only applies to the
// baked-geometry targets; the ocean drives its own extents from the wave patch.
export default function getTargetControls(snapshot = {}) {
  return {
    targetMode: {
      label: 'Surface',
      options: TARGET_MODES,
      value: snapshot.targetMode ?? TARGET_MODES[0],
    },
    targetReveal: {
      label: 'Reveal Target',
      render: isMeshTarget,
      value: snapshot.targetReveal ?? false,
    },
    targetProbeArea: {
      label: 'Probe Area',
      max: 300,
      min: 8,
      render: isMeshTarget,
      step: 1,
      value: snapshot.targetProbeArea ?? 60,
    },
    targetScale: {
      label: 'Scale',
      max: 6,
      min: 0.1,
      render: isMeshTarget,
      step: 0.05,
      value: snapshot.targetScale ?? 1,
    },
    targetHeight: {
      label: 'Height',
      max: 40,
      min: -40,
      render: isMeshTarget,
      step: 0.5,
      value: snapshot.targetHeight ?? 0,
    },
    targetTilt: {
      label: 'Tilt',
      max: Math.PI,
      min: -Math.PI,
      render: isMeshTarget,
      step: 0.01,
      value: snapshot.targetTilt ?? -1.2,
    },
    targetSpinSpeed: {
      label: 'Spin Speed',
      max: 2,
      min: -2,
      render: isMeshTarget,
      step: 0.01,
      value: snapshot.targetSpinSpeed ?? 0.16,
    },
  };
}
