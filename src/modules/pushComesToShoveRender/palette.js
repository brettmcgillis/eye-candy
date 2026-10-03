/* eslint-disable no-param-reassign */
import { float, hash, select, texture, uniform, vec2, vec3 } from 'three/tsl';

import {
  createNeutralPaletteTexture,
  createPaletteTexture,
} from '@utils/gradientPalette';

// One colour per target: face, rim and cylinders each sample one spot of the
// palette LUT, and each wire samples its own random one.
export function createPaletteLook() {
  const u = {
    cylinderTone: uniform(1),
    faceTone: uniform(0),
    paintCylinders: uniform(0),
    paintPanelFace: uniform(0),
    paintPanelRim: uniform(0),
    paintWires: uniform(0),
    rimTone: uniform(0.5),
    seed: uniform(0),
  };
  const lut = texture(createNeutralPaletteTexture());

  // Mirrored on the CPU by the kernel's randomTone, for the plot SVG's pens.
  const random = (id) => hash(float(id).mul(12.9898).add(u.seed));

  const paint = (enabled, base, t) =>
    select(
      enabled.greaterThan(0.5),
      lut.sample(vec2(t.clamp(0.001, 0.999), 0.5)).rgb,
      vec3(base)
    );

  return {
    current: null,
    lut,
    paint,
    random,
    uniforms: u,
    dispose: () => lut.value.dispose(),
  };
}

export function syncPaletteLook(look, config) {
  const u = look.uniforms;
  u.cylinderTone.value = config.cylinderTone;
  u.faceTone.value = config.faceTone;
  u.paintCylinders.value = config.paintCylinders ? 1 : 0;
  u.paintPanelFace.value = config.paintPanelFace ? 1 : 0;
  u.paintPanelRim.value = config.paintPanelRim ? 1 : 0;
  u.paintWires.value = config.paintWires ? 1 : 0;
  u.rimTone.value = config.rimTone;
  u.seed.value = config.paletteSeed;

  const key = `${config.palette}|${config.paletteExact}`;
  if (key === look.current) return;
  look.current = key;
  const old = look.lut.value;
  look.lut.value =
    createPaletteTexture(config.palette, { exact: config.paletteExact }) ??
    createNeutralPaletteTexture();
  old.dispose();
}
