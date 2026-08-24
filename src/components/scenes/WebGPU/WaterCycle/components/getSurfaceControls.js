// The contact phase: drops cling to whatever they land on, slide down its
// slope, and let go when the surface runs out from under them, tips past the
// release angle, or their cling time expires.
export default function getSurfaceControls(snapshot = {}) {
  return {
    catchDepth: {
      label: 'Catch Depth',
      max: 12,
      min: 0.1,
      step: 0.1,
      value: snapshot.catchDepth ?? 3,
    },
    slideGravity: {
      label: 'Slide Gravity',
      max: 120,
      min: 0,
      step: 0.5,
      value: snapshot.slideGravity ?? 18,
    },
    slideDrag: {
      label: 'Slide Drag',
      max: 12,
      min: 0,
      step: 0.05,
      value: snapshot.slideDrag ?? 2,
    },
    slopeRelease: {
      label: 'Release Slope',
      max: 6,
      min: 0.05,
      step: 0.05,
      value: snapshot.slopeRelease ?? 1.1,
    },
    surfaceLifeMin: {
      label: 'Cling Time Min',
      max: 6,
      min: 0.05,
      step: 0.05,
      value: snapshot.surfaceLifeMin ?? 0.6,
    },
    surfaceLifeMax: {
      label: 'Cling Time Max',
      max: 12,
      min: 0.1,
      step: 0.05,
      value: snapshot.surfaceLifeMax ?? 2.5,
    },
    stretchSpeed: {
      label: 'Streak Stretch Speed',
      max: 40,
      min: 0.1,
      step: 0.1,
      value: snapshot.stretchSpeed ?? 6,
    },
    gravity: {
      label: 'Fall-Off Gravity',
      max: 80,
      min: 0,
      step: 0.5,
      value: snapshot.gravity ?? 20,
    },
    airDrag: {
      label: 'Fall-Off Air Drag',
      max: 8,
      min: 0,
      step: 0.05,
      value: snapshot.airDrag ?? 1.1,
    },
    sinkDepth: {
      label: 'Descend Depth',
      max: 120,
      min: 1,
      step: 1,
      value: snapshot.sinkDepth ?? 26,
    },
  };
}
