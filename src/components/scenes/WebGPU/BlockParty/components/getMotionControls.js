import { folder } from 'leva';

import { choice, presetReader, range } from './controlHelpers';

export default function getMotionControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      Build: folder({
        buildIn: { label: 'Build In', value: p('buildIn', true) },
        buildSeconds: range(
          'Build Seconds',
          p('buildSeconds', 8),
          0.5,
          30,
          0.5
        ),
        revealBand: range('Reveal Band', p('revealBand', 0.3), 0.02, 1, 0.01),
        easing: choice('Easing', p('easing', 'smooth'), [
          'smooth',
          'linear',
          'expo',
          'back',
        ]),
        overshoot: range('Overshoot', p('overshoot', 1.7), 0, 4, 0.05),
        emergeStyle: choice('Emerge Style', p('emergeStyle', 'rise'), [
          'rise',
          'unfold',
        ]),
      }),
      Rebuild: folder({
        rollingRebuild: {
          label: 'Rolling Rebuild',
          value: p('rollingRebuild', true),
        },
        rebuildSeconds: range('Every', p('rebuildSeconds', 6), 1, 60, 0.5),
        rebuildOrder: choice('Order', p('rebuildOrder', 'sequential'), [
          'sequential',
          'random',
          'spiral',
        ]),
      }),
      Idle: folder({
        cardBob: range('Card Bob', p('cardBob', 0), 0, 20, 0.1),
        cardBobRate: range('Bob Rate', p('cardBobRate', 0.6), 0, 4, 0.05),
        towerBreathe: range(
          'Tower Breathe',
          p('towerBreathe', 0),
          0,
          0.5,
          0.005
        ),
        towerBreatheRate: range(
          'Breathe Rate',
          p('towerBreatheRate', 0.5),
          0,
          4,
          0.05
        ),
        neonFlicker: range('Neon Flicker', p('neonFlicker', 0), 0, 1, 0.01),
        neonFlickerRate: range(
          'Flicker Rate',
          p('neonFlickerRate', 8),
          0.5,
          30,
          0.5
        ),
        pulseRate: range('Pulse Rate', p('pulseRate', 1.1), 0, 6, 0.05),
        pulseDepth: range('Pulse Depth', p('pulseDepth', 0.35), 0, 1, 0.01),
      }),
    },
    { collapsed: true }
  );
}
