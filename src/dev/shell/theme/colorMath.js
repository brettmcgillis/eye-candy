function hexToRgb(hex) {
  const clean = String(hex).replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean;

  return {
    b: parseInt(full.slice(4, 6), 16),
    g: parseInt(full.slice(2, 4), 16),
    r: parseInt(full.slice(0, 2), 16),
  };
}

function rgbToHex({ b, g, r }) {
  const toHex = (value) =>
    Math.round(Math.min(255, Math.max(0, value)))
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl({ b, g, r }) {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, l, s: 0 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;

  if (max === rN) h = (gN - bN) / d + (gN < bN ? 6 : 0);
  else if (max === gN) h = (bN - rN) / d + 2;
  else h = (rN - gN) / d + 4;

  return { h: (h / 6) * 360, l, s };
}

export function mix(hexA, hexB, weight) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);

  return rgbToHex({
    b: a.b + (b.b - a.b) * weight,
    g: a.g + (b.g - a.g) * weight,
    r: a.r + (b.r - a.r) * weight,
  });
}

export function hexToRgba(hex, alpha) {
  const { b, g, r } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function describeColor(hex) {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  return { hex, hsl, rgb };
}
