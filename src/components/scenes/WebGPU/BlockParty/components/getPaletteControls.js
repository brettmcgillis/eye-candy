import { folder } from 'leva';

function color(label, value) {
  return { label, value };
}

function scalar(label, value, min, max, step) {
  return { label, max, min, step, value };
}

export default function getPaletteControls(preset = {}) {
  const p = (key, fallback) => preset[key] ?? fallback;

  return folder(
    {
      Paper: folder({
        backgroundColor: color('Background', p('backgroundColor', '#fcfcfc')),
        groundColor: color('Ground', p('groundColor', '#fcfcfc')),
        cardColor: color('Floating Card', p('cardColor', '#fcfcfc')),
        cardEdgeColor: color('Card Edge', p('cardEdgeColor', '#fcfcfc')),
        pedestalColor: color('Pedestal', p('pedestalColor', '#fcfcfc')),
      }),
      'Ground Pattern': folder({
        groundPattern: {
          label: 'Pattern',
          options: {
            Crosshatch: 'crosshatch',
            Dots: 'dots',
            Grid: 'grid',
            None: 'none',
          },
          value: p('groundPattern', 'none'),
        },
        patternColor: color('Colour', p('patternColor', '#d8d8d8')),
        patternScale: scalar('Scale', p('patternScale', 16), 2, 120, 0.5),
        patternWidth: scalar(
          'Width',
          p('patternWidth', 0.12),
          0.01,
          0.5,
          0.005
        ),
        patternStrength: scalar(
          'Strength',
          p('patternStrength', 0.6),
          0,
          1,
          0.01
        ),
      }),
      Towers: folder({
        towerBlend: {
          label: 'Blend',
          options: { Glow: 'glow', Ink: 'ink' },
          value: p('towerBlend', 'ink'),
        },
        towerColor: color('Tower Top', p('towerColor', '#000000')),
        towerBaseColor: color('Tower Base', p('towerBaseColor', '#000000')),
        towerBanding: scalar('Banding', p('towerBanding', 0), 0, 60, 1),
        towerBandStrength: scalar(
          'Band Strength',
          p('towerBandStrength', 0.25),
          0,
          1,
          0.01
        ),
        towerInk: scalar('Opacity', p('towerInk', 1), 0, 3, 0.01),
        towerShadows: { label: 'Shadows', value: p('towerShadows', true) },
      }),
      Pits: folder({
        pitRimColor: color('Rim', p('pitRimColor', '#bfbfbf')),
        pitColor: color('Wall', p('pitColor', '#050505')),
        pitStrataColor: color('Strata', p('pitStrataColor', '#3a3a3a')),
        pitStrataStrength: scalar(
          'Strata Strength',
          p('pitStrataStrength', 0.5),
          0,
          1,
          0.01
        ),
        pitFloorColor: color('Floor', p('pitFloorColor', '#000000')),
        pitLineWidth: scalar(
          'Line Width',
          p('pitLineWidth', 0.12),
          0.01,
          0.5,
          0.01
        ),
      }),
      'Glow Pits': folder({
        ringColor: color('Rings', p('ringColor', '#00aaff')),
        ringIntensity: scalar(
          'Ring Intensity',
          p('ringIntensity', 1.8),
          0,
          12,
          0.05
        ),
        glowFloorColor: color('Floor', p('glowFloorColor', '#3c3c44')),
      }),
      Stairs: folder({
        wellWallColor: color('Well Wall', p('wellWallColor', '#d6d6d6')),
        wellFloorColor: color('Well Floor', p('wellFloorColor', '#050505')),
        wellFalloff: scalar('Wall Falloff', p('wellFalloff', 0.7), 0, 1, 0.01),
        stairHighColor: color('Top Step', p('stairHighColor', '#c8c8c8')),
        stairLowColor: color('Deep Step', p('stairLowColor', '#050505')),
        stairAlphaStep: scalar(
          'Step Darken',
          p('stairAlphaStep', 0.15),
          0.01,
          0.5,
          0.01
        ),
        riserShade: scalar('Riser Shade', p('riserShade', 0.8), 0, 1, 0.01),
      }),
      Neon: folder({
        neonMagentaColor: color(
          'Magenta Slot',
          p('neonMagentaColor', '#ff0066')
        ),
        neonCyanColor: color('Cyan Slot', p('neonCyanColor', '#00ffcc')),
        neonAmberColor: color('Amber Slot', p('neonAmberColor', '#ffcc00')),
        neonIntensity: scalar(
          'Intensity',
          p('neonIntensity', 1.15),
          0,
          8,
          0.05
        ),
      }),
    },
    { collapsed: true }
  );
}
