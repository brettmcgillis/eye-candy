import { folder } from 'leva';

export default function getSwellControls(p) {
  return folder(
    {
      swellAmplitude: {
        label: 'Amplitude',
        value: p.swellAmplitude,
        min: 0.1,
        max: 3.5,
        step: 0.05,
      },
      // Down to 2, not 3: the presets are authored at 2.6 and a floor of 3
      // silently clamped every one of them, so the swell you selected was
      // never the swell you got.
      swellPeriod: {
        label: 'Period',
        value: p.swellPeriod,
        min: 2,
        max: 14,
        step: 0.1,
      },
      swellAngle: {
        label: 'Approach',
        value: p.swellAngle,
        min: -60,
        max: 60,
        step: 1,
      },
      swellGroupRate: {
        label: 'Set Rate',
        value: p.swellGroupRate,
        min: 0,
        max: 0.6,
        step: 0.005,
      },
      swellDrive: {
        label: 'Drive',
        value: p.swellDrive,
        min: 0,
        max: 1,
        step: 0.01,
      },
      // Sea level itself, moving. The wave maker drives to it, so the water
      // floods in and drains out for real instead of the waterline being
      // redrawn where it stands.
      tideAmplitude: {
        label: 'Tide Range',
        value: p.tideAmplitude,
        min: 0,
        max: 2.5,
        step: 0.01,
      },
      tidePeriod: {
        label: 'Tide Period',
        value: p.tidePeriod,
        min: 6,
        max: 240,
        step: 1,
      },
    },
    { collapsed: true }
  );
}
