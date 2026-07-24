// Impact sound groups. Files live under public/audio/windowBreaker/ and are
// sourced separately — until then Howl's onloaderror no-op keeps playback a
// silent no-op rather than a crash.
export const IMPACT_AUDIO_DEFAULTS = {
  cooldownMs: 70,
  minImpactSpeed: 2.5,
  volumeRange: [0.55, 0.9],
  rateRange: [0.92, 1.08],
};

export const IMPACT_AUDIO_GROUPS = {
  glass: {
    sources: [
      'windowBreaker/glass-break-1.mp3',
      'windowBreaker/glass-break-2.mp3',
      'windowBreaker/glass-break-3.mp3',
    ],
    minImpactSpeed: 1.5,
    volumeRange: [0.7, 1],
  },
  concrete: {
    sources: [
      'windowBreaker/rock-concrete-1.mp3',
      'windowBreaker/rock-concrete-2.mp3',
    ],
    minImpactSpeed: 3,
  },
  thump: {
    sources: ['windowBreaker/rock-grass-thump-1.mp3'],
    minImpactSpeed: 1.5,
    volumeRange: [0.4, 0.7],
  },
};
