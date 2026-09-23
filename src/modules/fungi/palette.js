// A specimen's colour is one gradient read along its structure: 0 is the foot
// of the stem, 1 the outermost tip. Every plan maps its parts onto that axis,
// so a palette is five stops rather than a colour per part.
const FIELD_GUIDE = [
  ['#efece2', '#f4f1e8', '#f3ead4', '#c9241a', '#ee6a2c'],
  ['#c4cbc3', '#dde2da', '#e6d6bb', '#b27b45', '#e0b98a'],
  ['#d6d6d0', '#eeeeea', '#4a4543', '#8f9096', '#ebe8e2'],
  ['#e39a2f', '#f0b347', '#f4c05a', '#f0a134', '#f7d27a'],
  ['#f2efe9', '#f7f5f0', '#f1ece2', '#ece6db', '#fbfaf6'],
  ['#8a6aa8', '#a07cc0', '#b08ad0', '#7d4f9e', '#c7a6e0'],
  ['#e6c7c2', '#eed6d0', '#f1d9d2', '#d9807a', '#f2b7ae'],
  ['#d2b27a', '#e0c58f', '#ead7ad', '#9b6a35', '#caa06a'],
  ['#5b3a2a', '#7d5436', '#e9dcc2', '#6a3b24', '#a2714a'],
  ['#2e4f8f', '#3f65ab', '#6f8fc8', '#23407d', '#8fb0e6'],
  ['#d8d2c2', '#e8e2d2', '#c65f4e', '#b24a3c', '#e8a08c'],
  ['#f1f0ea', '#f3f1ea', '#f09a3a', '#f28c2c', '#ffc36a'],
  ['#e7e2d6', '#ece8de', '#e9e2d4', '#7a8a9a', '#cfd8e0'],
  ['#9ab14a', '#b7c95c', '#d8df8a', '#c8a53a', '#f0d472'],
];

function hue2rgb(p, q, t) {
  let h = t;

  if (h < 0) h += 1;
  if (h > 1) h -= 1;
  if (h < 1 / 6) return p + (q - p) * 6 * h;
  if (h < 1 / 2) return q;
  if (h < 2 / 3) return p + (q - p) * (2 / 3 - h) * 6;

  return p;
}

export function hslToHex(h, s, l) {
  const hh = ((h % 1) + 1) % 1;
  let r = l;
  let g = l;
  let b = l;

  if (s > 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, hh + 1 / 3);
    g = hue2rgb(p, q, hh);
    b = hue2rgb(p, q, hh - 1 / 3);
  }

  const hex = (v) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255; // eslint-disable-line no-bitwise
  const g = ((n >> 8) & 255) / 255; // eslint-disable-line no-bitwise
  const b = (n & 255) / 255; // eslint-disable-line no-bitwise
  const hi = Math.max(r, g, b);
  const lo = Math.min(r, g, b);
  const l = (hi + lo) / 2;

  if (hi === lo) return [0, 0, l];
  const d = hi - lo;
  const s = l > 0.5 ? d / (2 - hi - lo) : d / (hi + lo);
  let h;

  if (hi === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (hi === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;

  return [h / 6, s, l];
}

function shift(hex, dh, ds = 1, dl = 0) {
  const [h, s, l] = hexToHsl(hex);

  return hslToHex(h + dh, Math.min(1, s * ds), Math.min(0.97, l + dl));
}

// Alien gradients: a hue walk with big steps and a pale or complementary tip,
// the way the extruded-RD and lattice references run green→magenta→white.
function alienStops(rng) {
  const h0 = rng();
  const walk = rng.range(0.12, 0.45) * (rng.chance(0.5) ? 1 : -1);
  const sat = rng.range(0.65, 1);
  const tip = rng();
  const stops = [0, 1, 2, 3].map((k) =>
    hslToHex(
      h0 + walk * (k / 3),
      sat * rng.range(0.85, 1),
      [0.32, 0.45, 0.55, 0.52][k] + rng.range(-0.06, 0.08)
    )
  );
  let last;

  if (tip < 0.45) last = hslToHex(h0 + walk, sat * 0.25, 0.9);
  else if (tip < 0.75) last = hslToHex(h0 + walk + 0.5, sat, 0.6);
  else last = hslToHex(h0 + walk * 1.3, sat, 0.68);

  return [...stops, last];
}

export default function rollPalette(
  rng,
  { hint, mycology, paletteShift = 0, glow, plan }
) {
  const earthy = plan === 'reaction' ? 0.6 : 1;
  const guide = rng.chance((0.15 + mycology * 0.8) * earthy);
  const guides = hint ?? FIELD_GUIDE;
  let stops = guide
    ? guides[Math.floor(rng() * guides.length)]
    : alienStops(rng);
  const drift = (1 - mycology) * rng.signed() * 0.25 + paletteShift;

  stops = stops.map((hex) => shift(hex, drift, 1 + (1 - mycology) * 0.3));

  const [, , capL] = hexToHsl(stops[3]);

  return {
    glow,
    rot: shift(stops[3], 0.02, 0.35, -Math.min(0.3, capL * 0.6)),
    spore: rng.chance(0.5) ? shift(stops[2], 0, 0.6, 0.1) : stops[4],
    stops,
  };
}
