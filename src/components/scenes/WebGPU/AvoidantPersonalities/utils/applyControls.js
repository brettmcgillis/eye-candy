/* eslint-disable no-param-reassign */
import { applySolverConfig } from '@modules/reactionDiffusion';
import { PALETTE_NONE } from '@utils/gradientPalette';

import { SHAPE_OPTIONS } from './spawnShapes';
import { BORDER_OPTIONS, indexOf } from './uniforms';

const DEG = Math.PI / 180;

// The Leva schema and the uniform bag share their key names on purpose, so most
// of this is a straight copy and only the enums, the angles authored in degrees
// and the palette gate need saying out loud.
export default function applyControls({
  config,
  inkUniforms,
  reactionField,
  uniforms,
}) {
  Object.entries(config).forEach(([key, value]) => {
    const target = uniforms[key] || inkUniforms[key];
    if (!target) return;
    if (typeof value === 'number') target.value = value;
    else if (typeof value === 'string' && target.value?.isColor) {
      target.value.set(value);
    }
  });

  uniforms.border.value = indexOf(BORDER_OPTIONS, config.border);
  uniforms.shape.value = indexOf(SHAPE_OPTIONS, config.shape);
  uniforms.shapeRotation.value = config.shapeRotation * DEG;
  uniforms.axisAngle.value = config.axisAngle * DEG;

  inkUniforms.paletteMix.value =
    config.palette === PALETTE_NONE ? 0 : config.paletteMix;

  applySolverConfig(reactionField.uniforms, {
    feedRate: config.feedRate,
    fieldContrast: config.fieldContrast,
    killRate: config.killRate,
    stepScale: config.stepScale,
  });
}
