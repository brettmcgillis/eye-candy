import { folder } from 'leva';

// WS3 — presence dramaturgy. Disable to run every layer at full with no
// enter/dissolve machinery (the as-is piece needs none of this).
export default function getPresenceControls(snapshot) {
  return folder(
    {
      presenceEnabled: { label: 'Conductor', value: snapshot.presenceEnabled },
      enterThreshold: {
        label: 'Enter Count',
        value: snapshot.enterThreshold,
        min: 0.1,
        max: 4,
        step: 0.1,
      },
      exitThreshold: {
        label: 'Exit Count',
        value: snapshot.exitThreshold,
        min: 0.1,
        max: 4,
        step: 0.1,
      },
      enterDwell: {
        label: 'Enter Dwell',
        value: snapshot.enterDwell,
        min: 0,
        max: 3,
        step: 0.1,
      },
      engageDwell: {
        label: 'Engage Dwell',
        value: snapshot.engageDwell,
        min: 0,
        max: 4,
        step: 0.1,
      },
      exitDwell: {
        label: 'Exit Dwell',
        value: snapshot.exitDwell,
        min: 0,
        max: 5,
        step: 0.1,
      },
      dissolveTime: {
        label: 'Dissolve Time',
        value: snapshot.dissolveTime,
        min: 0.5,
        max: 8,
        step: 0.1,
      },
      presenceRamp: {
        label: 'Gain Ramp',
        value: snapshot.presenceRamp,
        min: 0.2,
        max: 8,
        step: 0.1,
      },
      sensedPulseStrength: {
        label: 'Sensed Pulse',
        value: snapshot.sensedPulseStrength,
        min: 0,
        max: 4,
        step: 0.1,
      },
      sensedPulseDecay: {
        label: 'Pulse Decay',
        value: snapshot.sensedPulseDecay,
        min: 0.2,
        max: 6,
        step: 0.1,
      },
      dormantParticleScale: {
        label: 'Dormant Particles',
        value: snapshot.dormantParticleScale,
        min: 0.1,
        max: 1,
        step: 0.05,
      },
      dormantBloomScale: {
        label: 'Dormant Bloom',
        value: snapshot.dormantBloomScale,
        min: 0.1,
        max: 1,
        step: 0.05,
      },
    },
    { collapsed: true }
  );
}
