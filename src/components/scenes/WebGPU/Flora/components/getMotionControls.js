import { button, folder } from 'leva';

import { presetReader, range } from './controlHelpers';

export default function getMotionControls(
  preset = {},
  { onRegrow, onRestart } = {}
) {
  const p = presetReader(preset);

  return folder(
    {
      Lifecycle: folder(
        {
          regrow: { label: 'Regrow Loop', value: p('regrow') },
          timeScale: range('Time Scale', p('timeScale'), 0, 4, 0.05),
          growSeconds: range('Grow', p('growSeconds'), 1, 60, 0.5),
          bloomStart: range('Bloom Starts', p('bloomStart'), 0, 1, 0.01),
          bloomSeconds: range('Bloom', p('bloomSeconds'), 0.1, 40, 0.5),
          holdSeconds: range('Hold', p('holdSeconds'), 0, 60, 0.5),
          exitSeconds: range('Unravel', p('exitSeconds'), 0.5, 30, 0.5),
          restSeconds: range('Rest', p('restSeconds'), 0, 10, 0.1),
          restartCycle: button(() => onRestart?.()),
          unravelNow: button(() => onRegrow?.()),
        },
        { collapsed: true }
      ),
      Wind: folder(
        {
          windStrength: range('Strength', p('windStrength'), 0, 2, 0.01),
          windSpeed: range('Speed', p('windSpeed'), 0, 4, 0.01),
        },
        { collapsed: true }
      ),
      Seeds: folder(
        {
          scatterDistance: range('Distance', p('scatterDistance'), 0, 30, 0.1),
          scatterDrift: range('Wind Carry', p('scatterDrift'), 0, 1, 0.01),
          scatterAngle: range('Wind Angle', p('scatterAngle'), -180, 180, 1),
          scatterLift: range('Lift', p('scatterLift'), -1, 2, 0.01),
          scatterGravity: range('Gravity', p('scatterGravity'), 0, 8, 0.05),
          scatterFlutter: range('Flutter', p('scatterFlutter'), 0, 3, 0.01),
          scatterTurbulence: range(
            'Turbulence',
            p('scatterTurbulence'),
            0,
            3,
            0.01
          ),
          scatterSpin: range('Tumble', p('scatterSpin'), 0, 6, 0.05),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
