const n = (label, value, min, max, step = 0.01) => ({
  label,
  value,
  min,
  max,
  step,
});
const c = (label, value, options) => ({ label, value, options });

export const ANIMATION_IDS = [
  'washReveal',
  'washMorph',
  'pigmentFlow',
  'paintSequence',
];
export const ANIMATION_SPECS = {
  'Animation timeline': {
    animationPlaying: { label: 'Play animation', value: true },
    animationPhase: n('Scrub position', 0.2, 0, 1),
    animationDuration: n('Cycle seconds', 10, 2, 30, 0.5),
    animationPlayback: c('Playback', 'loop', ['loop', 'ping-pong', 'once']),
    animationEasing: c('Easing', 'smooth', ['linear', 'smooth', 'sine']),
    animationSurface: c('Paint target', 'paper', ['paper', 'sphere']),
    animationPetals: n('Painted petals', 5, 3, 9, 1),
    animationFps: n('Texture updates / sec', 12, 1, 24, 1),
  },
  'Wash reveal': {
    revealPattern: c('Reveal pattern', 'radial', ['radial', 'sweep', 'spots']),
    revealSoftness: n('Wet edge softness', 0.06, 0.005, 0.2),
    revealNoise: n('Edge irregularity', 0.2, 0, 0.5),
    revealCenterX: n('Origin X', 0.5, 0, 1),
    revealCenterY: n('Origin Y', 0.5, 0, 1),
  },
  'Morphing washes': {
    morphAmount: n('Shape movement', 0.65, 0, 1.5),
    morphSeed: c('Pigment seed', 'locked', ['locked', 'boiling']),
  },
  'Pigment movement': {
    flowPattern: c('Pigment motion', 'swirl', ['swirl', 'drift', 'ripples']),
    flowAmount: n('Texture movement', 0.1, 0, 0.25),
    flowFrequency: n('Flow frequency', 2, 0.5, 6, 0.5),
    flowPaper: n('Stationary paper grain', 0.25, 0, 1),
  },
  'Painting sequence': {
    sequenceOrder: c('Painting order', 'ink then wash', [
      'ink then wash',
      'wash then ink',
      'together',
    ]),
    sequenceInkShare: n('Time spent drawing', 0.35, 0.1, 0.9),
    sequenceFade: n('Wash arrival softness', 0.65, 0.05, 1),
  },
};

export const ANIMATION_GROUPS = {
  'Animation timeline': ANIMATION_IDS,
  'Wash reveal': ['washReveal'],
  'Morphing washes': ['washMorph'],
  'Pigment movement': ['pigmentFlow'],
  'Painting sequence': ['paintSequence'],
};

export function showAnimationControl(key, get, selected) {
  if (!ANIMATION_IDS.includes(selected)) return undefined;
  if (['studyMotion', 'studySpeed', 'studyShape', 'washCount'].includes(key))
    return false;
  if (key === 'flowFrequency')
    return get('Three5.JS.Pigment movement.flowPattern') !== 'swirl';
  if (key === 'animationFps') return selected !== 'pigmentFlow';
  if (key === 'dryLayers') return selected !== 'paintSequence';
  if (key === 'sequenceInkShare')
    return get('Three5.JS.Painting sequence.sequenceOrder') !== 'together';
  if (key.startsWith('revealCenter'))
    return get('Three5.JS.Wash reveal.revealPattern') === 'radial';
  if (['field', 'wiggle'].includes(key)) return false;
  if (key.startsWith('pressure')) return false;
  return undefined;
}
