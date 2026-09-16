import { CHARSET } from './charset';
import runes from './techniques/runes';
import script from './techniques/script';
import sigil from './techniques/sigil';

export const TECHNIQUES = { runes, script, sigil };

export function getTechnique(id) {
  const technique = TECHNIQUES[id];
  if (!technique) throw new Error(`Unknown glyph technique "${id}".`);
  return technique;
}

export function regenerateFont(font) {
  const technique = getTechnique(font.technique);
  const { glyphs, params } = technique.generateGlyphs(CHARSET, {
    ...technique.defaults,
    ...font.params,
  });
  return { ...font, glyphs, params };
}

export function createFont(techniqueId, { name = techniqueId, params } = {}) {
  const technique = getTechnique(techniqueId);
  return regenerateFont({
    glyphs: {},
    name,
    params: { ...technique.defaults, ...params },
    technique: techniqueId,
  });
}

export function setGlyph(font, key, glyph) {
  return { ...font, glyphs: { ...font.glyphs, [key]: glyph } };
}

export function rerollGlyph(font, key, reroll) {
  const technique = getTechnique(font.technique);
  return setGlyph(font, key, technique.generateGlyph(key, font.params, reroll));
}

// Fonts saved before a parameter existed still load with its default.
export function normalizeFont(font) {
  const technique = getTechnique(font.technique);
  return { ...font, params: { ...technique.defaults, ...font.params } };
}

export function fontCellAspect(font) {
  return getTechnique(font.technique).cellAspect(font.params);
}
