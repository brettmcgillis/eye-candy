/**
 * Ghost character action animations.
 *
 * Each clip: { loop, blendIn, blendOut, sample(elapsed, config) → overrides }
 *
 * `sample` returns per-frame hand target overrides that GhostCharacter blends
 * with the normal wind-trail targets. Works in both canned (GhostBuster) and
 * ecctrl (character controller) modes.
 */

const ANIMATIONS = {
  clap: {
    loop: true,
    blendIn: 0.2,
    blendOut: 0.2,
    sample(elapsed, config) {
      const { handSpacing = 0.18, handHeight = 0.12 } = config;

      // Both hands sweep inward to meet at center then spring back out
      const clapFreq = 3.5;
      const phase = elapsed * clapFreq * Math.PI * 2;
      // Use a half-rectified sine so the clap is a sharp snap in, slow out
      const raw = Math.sin(phase); // -1..1
      const snap = raw > 0 ? raw * raw : 0; // 0..1 only on the inward beat, quadratic sharpening
      const spread = (1 - snap) * handSpacing;
      const lift = snap * 0.04; // hands rise slightly on impact

      return {
        leftHandTarget: { x: -spread, y: -handHeight * 0.5 + lift, z: 0.06 },
        rightHandTarget: { x: spread, y: -handHeight * 0.5 + lift, z: 0.06 },
      };
    },
  },

  wave: {
    loop: true,
    blendIn: 0.3,
    blendOut: 0.3,
    sample(elapsed, config) {
      const { handSpacing = 0.18, handHeight = 0.12 } = config;

      // Left hand: raised and waving side-to-side
      const waveFreq = 2.5;
      const wavePhase = elapsed * waveFreq * Math.PI * 2;
      const waveX = Math.sin(wavePhase) * 0.1;
      const waveBob = Math.sin(wavePhase * 2) * 0.01;

      return {
        leftHandTarget: {
          x: -handSpacing * 0.3 + waveX,
          y: 0.08 + waveBob,
          z: 0.04,
        },
        rightHandTarget: {
          x: handSpacing * 1.1,
          y: -(handHeight + 0.06),
          z: 0,
        },
      };
    },
  },
};

export function getAnimation(name) {
  return ANIMATIONS[name] || null;
}

export function getAnimationNames() {
  return Object.keys(ANIMATIONS);
}
