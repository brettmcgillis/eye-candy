import { folder } from 'leva';

export default function getCloudControls(p) {
  return folder(
    {
      spread: {
        label: 'Cloud Size (px)',
        max: 500,
        min: 60,
        step: 10,
        value: p.spread,
      },
      hueShift: {
        label: 'Hue Shift',
        max: 180,
        min: -180,
        step: 1,
        value: p.hueShift,
      },
      bobAmount: {
        label: 'Bob Amount (px)',
        max: 60,
        min: 0,
        step: 1,
        value: p.bobAmount,
      },
      bobSpeed: {
        label: 'Bob Speed',
        max: 2,
        min: 0,
        step: 0.05,
        value: p.bobSpeed,
      },
    },
    { collapsed: true }
  );
}
