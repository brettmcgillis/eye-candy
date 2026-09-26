import { folder } from 'leva';

import { choice, presetReader, range } from './controlHelpers';

// The wave is the scene: threads at rest are a flat comb, and every lock,
// gap and flyaway comes from what the wave does as it passes through.
export default function getWaveControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      waveMode: choice('Design', p('waveMode'), {
        'Travelling Wave': 'wave',
        'Sine Threads (shader)': 'sine',
        'Noise Rings (shader)': 'rings',
      }),
      waveAmplitude: range('Lift', p('waveAmplitude'), 0, 1, 0.005),
      waveFrequency: range('Frequency', p('waveFrequency'), 0.1, 30, 0.1),
      waveSpeed: range('Speed', p('waveSpeed'), 0, 6, 0.01),
      clump: range('Clumping', p('clump'), 0, 1, 0.005),
      clumpSpacing: range(
        'Clump Spacing',
        p('clumpSpacing'),
        0.002,
        0.4,
        0.002
      ),
      phaseSpread: range('Phase Spread', p('phaseSpread'), 0, 4, 0.01),
      crestThreshold: range('Crest Width', p('crestThreshold'), -1, 0.9, 0.01),
      Crests: folder(
        {
          frizz: range('Frizz', p('frizz'), 0, 0.2, 0.001),
          frizzScale: range('Frizz Scale', p('frizzScale'), 0.1, 20, 0.1),
          flyawayShare: range('Flyaways', p('flyawayShare'), 0, 0.4, 0.005),
          waveMeander: range('Meander', p('waveMeander'), 0, 6, 0.02),
          waveMeanderScale: range(
            'Meander Scale',
            p('waveMeanderScale'),
            0.05,
            6,
            0.05
          ),
        },
        { collapsed: true }
      ),
      'Shader Designs': folder(
        {
          waveLens: range('Sine Lens', p('waveLens'), 0.1, 12, 0.05),
          lensX: range('Lens X', p('lensX'), -6, 6, 0.05),
          lensZ: range('Lens Z', p('lensZ'), -6, 6, 0.05),
          ringSpacing: range('Ring Spacing', p('ringSpacing'), 0.05, 3, 0.01),
          ringLobes: range('Ring Lobes', p('ringLobes'), 0, 12, 0.5),
          ringDamp: range('Ring Damping', p('ringDamp'), 0, 4, 0.01),
          loopSpeed: range('Loop Speed', p('loopSpeed'), 0, 2, 0.01),
        },
        { collapsed: true }
      ),
      Simulation: folder(
        {
          wavePull: range('Wave Pull', p('wavePull'), 0, 0.5, 0.001),
          substeps: range('Substeps', p('substeps'), 1, 6, 1),
          constraintIterations: range(
            'Iterations',
            p('constraintIterations'),
            1,
            16,
            1
          ),
          gravity: range('Gravity', p('gravity'), 0, 20, 0.05),
          damping: range('Damping', p('damping'), 0.8, 1, 0.001),
          stiffness: range('Stretch Stiffness', p('stiffness'), 0, 1, 0.01),
          shapeRetention: range(
            'Shape Memory',
            p('shapeRetention'),
            0,
            1,
            0.005
          ),
          windStrength: range('Wind', p('windStrength'), 0, 30, 0.1),
          windScale: range('Wind Scale', p('windScale'), 0.01, 4, 0.01),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
