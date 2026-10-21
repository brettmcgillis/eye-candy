import { TOLERANCE_MM } from './svg.mjs';

export const ACI = [
  [1, [255, 0, 0]],
  [2, [255, 255, 0]],
  [3, [0, 255, 0]],
  [4, [0, 255, 255]],
  [5, [0, 0, 255]],
  [6, [255, 0, 255]],
  [7, [0, 0, 0]],
  [8, [128, 128, 128]],
  [9, [192, 192, 192]],
];

export const aciColor = (aci) =>
  `#${(ACI.find(([n]) => n === aci)?.[1] ?? [0, 0, 0])
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;

export function hexRgb(value) {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/iu.exec(
    String(value ?? '').trim()
  );
  if (!match) return null;
  const hex =
    match[1].length === 3 ? [...match[1]].map((c) => c + c).join('') : match[1];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

const CHROMATIC = [
  [1, 0],
  [2, 60],
  [3, 120],
  [4, 180],
  [5, 240],
  [6, 300],
];
const ACHROMATIC = [
  [7, 0],
  [8, 128],
  [9, 192],
];

function hsl([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const chroma = max - min;
  if (!chroma) return { hue: 0, lightness, saturation: 0 };
  let hue = (r - g) / chroma + 4;
  if (max === r) hue = ((g - b) / chroma + 6) % 6;
  else if (max === g) hue = (b - r) / chroma + 2;
  return {
    hue: hue * 60,
    lightness,
    saturation: chroma / (255 - Math.abs(2 * lightness - 255) || 1),
  };
}

// ACI colours a pen could show as in Studio, best first: by hue for a
// coloured pen (RGB distance calls a mid green gray), by lightness for a
// black, gray or white one.
const aciRanked = (color) => {
  const { hue, lightness, saturation } = hsl(hexRgb(color) ?? [0, 0, 0]);
  const byHue = [...CHROMATIC]
    .sort((a, b) => {
      const da = Math.min(Math.abs(a[1] - hue), 360 - Math.abs(a[1] - hue));
      const db = Math.min(Math.abs(b[1] - hue), 360 - Math.abs(b[1] - hue));
      return da - db;
    })
    .map(([n]) => n);
  const byLightness = [...ACHROMATIC]
    .sort((a, b) => Math.abs(a[1] - lightness) - Math.abs(b[1] - lightness))
    .map(([n]) => n);
  return saturation < 0.2 || lightness < 40
    ? [...byLightness, ...byHue]
    : [...byHue, ...byLightness];
};

// Studio groups a DXF's lines by entity colour, so every pass needs its own:
// each takes the nearest ACI colour no earlier pass has claimed.
export function passColors(colors) {
  const taken = new Set();
  return colors.map((color) => {
    const aci =
      aciRanked(color).find((n) => !taken.has(n)) ?? 10 + taken.size * 10;
    taken.add(aci);
    return aci;
  });
}

export function layerName(raw) {
  const name = String(raw)
    .trim()
    .replace(/[^A-Za-z0-9_-]+/gu, '_');
  return name.replace(/^_+|_+$/gu, '') || '0';
}

function circleThrough(points) {
  if (points.length < 3) return null;
  const cx = points.reduce((sum, [x]) => sum + x, 0) / points.length;
  const cy = points.reduce((sum, [, y]) => sum + y, 0) / points.length;
  const radii = points.map(([x, y]) => Math.hypot(x - cx, y - cy));
  const radius = radii.reduce((sum, r) => sum + r, 0) / radii.length;
  const round = radii.every((r) => Math.abs(r - radius) <= TOLERANCE_MM);
  return round && radius > 0 ? { center: [cx, cy], radius } : null;
}

const fmt = (value) => {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? '0' : String(rounded);
};

// DXF R12 in mm, y up. Each pass is a layer and every entity carries the
// pass's colour itself: Studio ignores layer-table colour.
export function writeDxf({ heightMm, passes, widthMm }) {
  const layers = passes.map((pass) => ({
    ...pass,
    name: layerName(pass.name),
  }));
  const out = [];
  const pair = (code, value) => out.push(String(code), String(value));
  const flip = ([x, y]) => [x, heightMm - y];
  pair(0, 'SECTION');
  pair(2, 'HEADER');
  pair(9, '$ACADVER');
  pair(1, 'AC1009');
  pair(9, '$INSUNITS');
  pair(70, 4);
  pair(9, '$MEASUREMENT');
  pair(70, 1);
  pair(9, '$EXTMIN');
  pair(10, 0);
  pair(20, 0);
  pair(30, 0);
  pair(9, '$EXTMAX');
  pair(10, fmt(widthMm));
  pair(20, fmt(heightMm));
  pair(30, 0);
  pair(0, 'ENDSEC');
  pair(0, 'SECTION');
  pair(2, 'TABLES');
  pair(0, 'TABLE');
  pair(2, 'LTYPE');
  pair(70, 1);
  pair(0, 'LTYPE');
  pair(2, 'CONTINUOUS');
  pair(70, 0);
  pair(3, 'Solid line');
  pair(72, 65);
  pair(73, 0);
  pair(40, 0);
  pair(0, 'ENDTAB');
  pair(0, 'TABLE');
  pair(2, 'LAYER');
  pair(70, layers.length + 1);
  [{ aci: 7, name: '0' }, ...layers.filter((l) => l.name !== '0')].forEach(
    (layer) => {
      pair(0, 'LAYER');
      pair(2, layer.name);
      pair(70, 0);
      pair(62, layer.aci);
      pair(6, 'CONTINUOUS');
    }
  );
  pair(0, 'ENDTAB');
  pair(0, 'ENDSEC');
  pair(0, 'SECTION');
  pair(2, 'ENTITIES');
  layers.forEach(({ aci, name, runs }) => {
    runs.forEach(({ arcs, closed, points }) => {
      const circle = arcs && closed ? circleThrough(points) : null;
      if (circle) {
        const [cx, cy] = flip(circle.center);
        pair(0, 'CIRCLE');
        pair(8, name);
        pair(62, aci);
        pair(10, fmt(cx));
        pair(20, fmt(cy));
        pair(30, 0);
        pair(40, fmt(circle.radius));
        return;
      }
      pair(0, 'POLYLINE');
      pair(8, name);
      pair(62, aci);
      pair(66, 1);
      pair(10, 0);
      pair(20, 0);
      pair(30, 0);
      pair(70, closed ? 1 : 0);
      points.forEach((point) => {
        const [x, y] = flip(point);
        pair(0, 'VERTEX');
        pair(10, fmt(x));
        pair(20, fmt(y));
      });
      pair(0, 'SEQEND');
      pair(8, name);
      pair(62, aci);
    });
  });
  pair(0, 'ENDSEC');
  pair(0, 'EOF');
  return `${out.join('\n')}\n`;
}
