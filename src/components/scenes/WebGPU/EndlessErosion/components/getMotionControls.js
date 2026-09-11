import { isPainting } from './controlPaths';

const notPainting = (get) => !isPainting(get);

// The terrain never regenerates: it slides under a fixed frame on a slow ellipse
// while the filter's own parameters tour their range, which is what reads as
// erosion still happening rather than having happened.
export default function getMotionControls(snapshot = {}) {
  return {
    scrollPeriod: {
      label: 'Scroll Period',
      max: 240,
      min: 10,
      render: notPainting,
      step: 1,
      value: snapshot.scrollPeriod ?? 60,
    },
    scrollRadius: {
      label: 'Scroll Distance',
      max: 8,
      min: 0,
      render: notPainting,
      step: 0.05,
      value: snapshot.scrollRadius ?? 2,
    },
    scrollDrift: {
      label: 'Scroll Drift',
      max: 2,
      min: 0,
      render: notPainting,
      step: 0.01,
      value: snapshot.scrollDrift ?? 0.1,
    },
    animateErosion: {
      label: 'Animate Erosion',
      render: notPainting,
      value: snapshot.animateErosion ?? true,
    },
    animateWater: {
      label: 'Animate Water Level',
      render: notPainting,
      value: snapshot.animateWater ?? true,
    },
  };
}
