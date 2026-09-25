import { folder } from 'leva';

export default function getHandSwordControls(p) {
  return folder(
    {
      handSwordDrop: { label: 'Can Drop', value: p.handSwordDrop ?? true },
      handSwordDropThreshold: {
        label: 'Drop Jolt (m/s)',
        value: p.handSwordDropThreshold ?? 4,
        min: 0,
        max: 20,
        step: 0.1,
      },
      gripPalmOffset: {
        label: 'Grip Palm Offset',
        value: p.gripPalmOffset ?? 0.035,
        min: -0.05,
        max: 0.1,
        step: 0.001,
      },
      gripGuardOffset: {
        label: 'Grip Guard Offset',
        value: p.gripGuardOffset ?? 0.06,
        min: -0.05,
        max: 0.15,
        step: 0.001,
      },
    },
    { collapsed: true }
  );
}
