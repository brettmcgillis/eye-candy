import { Color, SRGBColorSpace } from 'three';

const CODES = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  0: '-----',
  1: '.----',
  2: '..---',
  3: '...--',
  4: '....-',
  5: '.....',
  6: '-....',
  7: '--...',
  8: '---..',
  9: '----.',
};
function segmentsOf(text) {
  const words = text.toUpperCase().trim().split(/\s+/).filter(Boolean);
  const segments = [];
  words.forEach((word, wi) => {
    [...word].forEach((letter, li) => {
      const code = CODES[letter] ?? '';
      [...code].forEach((symbol, si) => {
        segments.push({ on: true, units: symbol === '-' ? 3 : 1 });
        if (si < code.length - 1) segments.push({ on: false, units: 1 });
      });
      if (li < word.length - 1) segments.push({ on: false, units: 3 });
    });
    if (wi < words.length - 1) segments.push({ on: false, units: 7 });
  });
  return segments;
}
const channels = (hex) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
function palette(target, stops, t) {
  const a = t < 0.5 ? stops[0] : stops[1];
  const b = t < 0.5 ? stops[1] : stops[2];
  const f = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  target.setRGB(
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
    SRGBColorSpace
  );
}

export default function createAnimation(config, meshes) {
  const segments = segmentsOf(config.morseText ?? 'SOS');
  const duration = segments.reduce((sum, s) => sum + s.units, 0);
  const pulseCount = segments.filter((s) => s.on).length;
  const targets = meshes.flatMap((mesh) =>
    Array.from({ length: mesh.count }, (_, index) => ({ mesh, index }))
  );
  const seed = Math.max(1, Math.floor(config.morseSeed ?? 1));
  for (let i = targets.length - 1; i > 0; i -= 1) {
    const j = (seed * (i + 31) * 1103515245 + 12345) % (i + 1);
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }
  const start = new Color(config.colorRangeStart);
  const end = new Color(config.colorRangeEnd);
  const startRgb = { r: 0, g: 0, b: 0 };
  const endRgb = { r: 0, g: 0, b: 0 };
  const highlight = new Color(config.morseColor ?? '#ff2020');
  const black = new Color(0);
  const white = new Color(1, 1, 1);
  const fadeStart = ['A', 'B', 'C'].map((key) =>
    channels(config[`layerFadeStart${key}`] ?? '#ffffff')
  );
  const fadeEnd = ['A', 'B', 'C'].map((key) =>
    channels(config[`layerFadeEnd${key}`] ?? '#000000')
  );
  let previous = null;
  const previousBase = new Color();
  meshes.forEach((mesh) => {
    for (let i = 0; i < mesh.count; i += 1) mesh.setColorAt(i, white);
  });

  return (seconds) => {
    if (config.animationMode === 'layerFade') {
      const loop = Math.max(0.2, config.layerFadeLoopSeconds ?? 10);
      const cycle = (seconds % (loop * 2)) / loop;
      const phase = cycle <= 1 ? cycle : 2 - cycle;
      palette(start, fadeStart, phase);
      palette(end, fadeEnd, phase);
      start.getRGB(startRgb, SRGBColorSpace);
      end.getRGB(endRgb, SRGBColorSpace);
      for (let i = 0; i < meshes.length; i += 1) {
        const mesh = meshes[i];
        const t =
          mesh.userData.layer /
          Math.max(1, meshes[meshes.length - 1].userData.layer);
        mesh.material.color.setRGB(
          Math.round((startRgb.r + (endRgb.r - startRgb.r) * t) * 255) / 255,
          Math.round((startRgb.g + (endRgb.g - startRgb.g) * t) * 255) / 255,
          Math.round((startRgb.b + (endRgb.b - startRgb.b) * t) * 255) / 255,
          SRGBColorSpace
        );
      }
    }
    if (config.animationMode !== 'morseCode') return;
    if (previous) {
      previous.mesh.setColorAt(previous.index, white);
      previous.mesh.instanceColor.needsUpdate = true;
      previous.mesh.material.color.copy(previousBase);
      previous.mesh.material.emissive.copy(black);
      previous.mesh.material.emissiveIntensity = 0;
      previous = null;
    }
    const elapsed = seconds / Math.max(0.05, config.morseUnitSeconds ?? 0.2);
    const total = duration + Math.max(0, config.morsePauseUnits ?? 7);
    const cycle = elapsed % total;
    let cursor = 0;
    let onIndex = -1;
    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      if (segment.on) onIndex += 1;
      if (
        cycle >= cursor &&
        cycle < cursor + segment.units &&
        segment.on &&
        targets.length
      ) {
        const target =
          targets[
            (Math.floor(elapsed / total) * Math.max(1, pulseCount) +
              onIndex +
              (seed % targets.length)) %
              targets.length
          ];
        const phase = (cycle - cursor) / segment.units;
        const attack = segment.units <= 1 ? 0.2 : 0.12;
        const release = segment.units <= 1 ? 0.3 : 0.2;
        const strength = Math.min(1, phase / attack, (1 - phase) / release);
        previous = target;
        previousBase.copy(target.mesh.material.color);
        target.mesh.material.color.copy(white);
        target.mesh.setColorAt(target.index, highlight);
        target.mesh.instanceColor.needsUpdate = true;
        target.mesh.material.emissive.copy(highlight);
        target.mesh.material.emissiveIntensity =
          (config.morseEmissiveIntensity ?? 1.5) * strength;
        break;
      }
      cursor += segment.units;
    }
  };
}
