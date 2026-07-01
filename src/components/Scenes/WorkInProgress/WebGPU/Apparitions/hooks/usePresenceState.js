import { useRef } from 'react';

// Presence dramaturgy (WS3). A hysteresis state machine driven by a smoothed
// people-count gives the wall a life cycle for passers-by, not just a reaction:
//
//   Dormant   → nobody: ghosts drift, viewer/motion muted, dim + low particle count.
//   Sensed    → someone enters: a one-shot ripple "notices" them, gains ramp up.
//   Forming   → engaged: viewer field + motion mappings at full gain.
//   Dissolving→ they leave: viewer gain eases to 0 so the apparition lingers,
//               then disperses back to Dormant.
//
// The conductor is purely an envelope layer: it lerps the GAINS that scale the
// existing sources/modulators, so no new sim plumbing is required. Disable it
// (presenceEnabled = false) and every layer runs at full — the as-is piece needs
// no presence machinery.
//
// Ref-based and updated inside useFrame: no per-frame React setState.

const TARGETS = {
  dormant: {
    ghostGain: 1,
    viewerGain: 0,
    motionGain: 0,
    audioGain: 0.35,
    bloomScale: 0.7,
    particleScale: 0.55,
  },
  sensed: {
    ghostGain: 0.5,
    viewerGain: 0.35,
    motionGain: 0.4,
    audioGain: 0.6,
    bloomScale: 1,
    particleScale: 1,
  },
  forming: {
    ghostGain: 0.15,
    viewerGain: 1,
    motionGain: 1,
    audioGain: 1,
    bloomScale: 1,
    particleScale: 1,
  },
  dissolving: {
    ghostGain: 0.5,
    viewerGain: 0,
    motionGain: 0.2,
    audioGain: 0.5,
    bloomScale: 0.9,
    particleScale: 0.85,
  },
};

const GAIN_KEYS = [
  'ghostGain',
  'viewerGain',
  'motionGain',
  'audioGain',
  'bloomScale',
  'particleScale',
];

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function createController() {
  const gains = {
    state: 'dormant',
    ghostGain: 1,
    viewerGain: 0,
    motionGain: 0,
    audioGain: 0.35,
    bloomScale: 0.7,
    particleScale: 0.55,
    sensedPulse: 0,
  };

  let state = 'dormant';
  let smoothedCount = 0;
  let timer = 0;
  let dissolveTimer = 0;

  function update(dt, peopleCount, controls) {
    if (!controls.presenceEnabled) {
      // Bypass: every layer at full, presence machinery out of the loop.
      gains.state = 'off';
      gains.ghostGain = 1;
      gains.viewerGain = 1;
      gains.motionGain = 1;
      gains.audioGain = 1;
      gains.bloomScale = 1;
      gains.particleScale = 1;
      gains.sensedPulse = 0;
      return gains;
    }

    smoothedCount += (peopleCount - smoothedCount) * clamp01(dt * 4);
    const present = smoothedCount >= controls.enterThreshold;
    const absent = smoothedCount < controls.exitThreshold;

    switch (state) {
      case 'dormant':
        if (present) {
          timer += dt;
          if (timer >= controls.enterDwell) {
            state = 'sensed';
            timer = 0;
            gains.sensedPulse = 1;
          }
        } else {
          timer = 0;
        }
        break;
      case 'sensed':
        if (absent) {
          state = 'dissolving';
          timer = 0;
          dissolveTimer = 0;
        } else {
          timer += dt;
          if (timer >= controls.engageDwell) {
            state = 'forming';
            timer = 0;
          }
        }
        break;
      case 'forming':
        if (absent) {
          timer += dt;
          if (timer >= controls.exitDwell) {
            state = 'dissolving';
            timer = 0;
            dissolveTimer = 0;
          }
        } else {
          timer = 0;
        }
        break;
      case 'dissolving':
        dissolveTimer += dt;
        if (present) {
          state = 'forming';
          timer = 0;
        } else if (dissolveTimer >= controls.dissolveTime) {
          state = 'dormant';
          timer = 0;
        }
        break;
      default:
        state = 'dormant';
    }

    // Dormant look is tunable from controls without disturbing other states.
    const target = TARGETS[state];
    const rate = clamp01(controls.presenceRamp * dt);
    GAIN_KEYS.forEach((key) => {
      let goal = target[key];
      if (state === 'dormant' && key === 'particleScale') {
        goal = controls.dormantParticleScale;
      }
      if (state === 'dormant' && key === 'bloomScale') {
        goal = controls.dormantBloomScale;
      }
      gains[key] += (goal - gains[key]) * rate;
    });

    gains.sensedPulse = Math.max(
      0,
      gains.sensedPulse - dt * controls.sensedPulseDecay
    );
    gains.state = state;

    return gains;
  }

  return { update, gains };
}

export default function usePresenceState() {
  const ref = useRef(null);
  if (!ref.current) ref.current = createController();
  return ref.current;
}
