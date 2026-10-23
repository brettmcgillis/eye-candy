import { foldClose, nearestInk, samplePalette } from './palette.mjs';

// Any bench's plot SVG regrouped into `k` inks: every shape's own colour
// (its stroke, or its fill when it has no stroke) weighted by how much of it
// there is, merged down to `k` by samplePalette's Ward cost, then one
// Plotterizer layer per ink (`pen-${firstPen + i} ink ${i + 1} #rrggbb`),
// darkest first, each shape recoloured to its ink. Dependency-free and
// string-based, so the CLIs' plain-Node plot writer runs it on every SVG.

const TAG =
  /<(\/?)([\w:-]+)((?:\s+[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/gu;
const ATTRIBUTE = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu;
const SHAPES = new Set([
  'circle',
  'ellipse',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
]);
const CONTAINERS = new Set(['g', 'a', 'switch']);
// What a moved shape must still carry from the groups it left.
const INHERITED = [
  'fill',
  'fill-opacity',
  'fill-rule',
  'opacity',
  'shape-rendering',
  'stroke',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width',
  'vector-effect',
];

const parseAttributes = (text) => {
  const attrs = Object.fromEntries(
    [...text.matchAll(ATTRIBUTE)].map(([, name, double, single]) => [
      name,
      double ?? single,
    ])
  );
  String(attrs.style ?? '')
    .split(';')
    .map((rule) => rule.split(':').map((part) => part.trim()))
    .filter(([name, value]) => name && value)
    .forEach(([name, value]) => {
      attrs[name] = value;
    });
  delete attrs.style;
  return attrs;
};

function rgbOf(value) {
  const text = String(value ?? '').trim();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/iu.exec(text);
  if (short) return short.slice(1).map((c) => parseInt(c + c, 16));
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/iu.exec(text);
  if (long) return long.slice(1).map((c) => parseInt(c, 16));
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/iu.exec(text);
  if (rgb) return rgb.slice(1).map(Number);
  if (/^(black)$/iu.test(text)) return [0, 0, 0];
  if (/^(white)$/iu.test(text)) return [255, 255, 255];
  return null;
}

const attributeText = (attrs) =>
  Object.entries(attrs)
    .filter(([, value]) => value != null)
    .map(([name, value]) => ` ${name}="${value}"`)
    .join('');

// The paper: a fill-only rect laid first, under everything else.
const isPaper = (shape) => shape.tag === 'rect' && !rgbOf(shape.attrs.stroke);

function readShapes(body) {
  const shapes = [];
  const stack = [{ attrs: {}, tag: 'svg', transforms: [] }];
  [...body.matchAll(TAG)].forEach(([, closing, tag, attrText, selfClosing]) => {
    if (closing) {
      if (stack.length > 1) stack.pop();
      return;
    }
    const parent = stack.at(-1);
    const own = parseAttributes(attrText);
    const inherited = Object.fromEntries(
      INHERITED.filter((name) => parent.attrs[name] != null).map((name) => [
        name,
        parent.attrs[name],
      ])
    );
    const attrs = { ...inherited, ...own };
    const transforms = own.transform
      ? [...parent.transforms, own.transform]
      : parent.transforms;
    if (SHAPES.has(tag) && !parent.skip) {
      delete attrs.transform;
      delete attrs.id;
      shapes.push({ attrs, tag, transform: transforms.join(' ') });
    }
    if (!selfClosing) {
      stack.push({
        attrs,
        skip: parent.skip || !(CONTAINERS.has(tag) || SHAPES.has(tag)),
        tag,
        transforms,
      });
    }
  });
  return shapes;
}

// How much of a colour a shape puts down: its path data length, a cheap
// stand-in for drawn length that keeps one long stroke from being outvoted
// by many specks.
const weightOf = (shape) =>
  Math.max(
    1,
    String(shape.attrs.d ?? shape.attrs.points ?? '').length / 8 || 4
  );

export default function inkLayers(svg, k, { firstPen = 20 } = {}) {
  const root = /<svg\b[^>]*>/iu.exec(svg);
  const end = svg.lastIndexOf('</svg>');
  if (!root || end < 0 || k < 1) return svg;
  const shapes = readShapes(svg.slice(root.index + root[0].length, end));
  const paper = shapes[0] && isPaper(shapes[0]) ? shapes.shift() : null;
  const inked = shapes
    .map((shape) => {
      const stroke = rgbOf(shape.attrs.stroke);
      const fill = rgbOf(shape.attrs.fill);
      return { ...shape, fill, rgb: stroke ?? fill, stroke };
    })
    .filter((shape) => shape.rgb);
  if (inked.length === 0) return svg;

  const totals = new Map();
  inked.forEach((shape) => {
    const key = shape.rgb.join();
    const entry = totals.get(key) ?? { rgb: shape.rgb, weight: 0 };
    entry.weight += weightOf(shape);
    totals.set(key, entry);
  });
  const palette = samplePalette(foldClose(totals.values()), k);
  const nearest = nearestInk(palette);
  const layers = palette.map(() => []);
  inked.forEach((shape) => {
    const ink = nearest(shape.rgb);
    const attrs = { ...shape.attrs };
    if (shape.stroke) attrs.stroke = palette[nearest(shape.stroke)].color;
    if (shape.fill) attrs.fill = palette[nearest(shape.fill)].color;
    if (shape.transform) attrs.transform = shape.transform;
    layers[ink].push(`<${shape.tag}${attributeText(attrs)}/>`);
  });

  const open = /xmlns:inkscape=/u.test(root[0])
    ? root[0]
    : root[0].replace(
        /<svg\b/iu,
        '<svg xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"'
      );
  const groups = palette.map((entry, i) =>
    layers[i].length
      ? `<g inkscape:groupmode="layer" inkscape:label="pen-${firstPen + i} ink ${i + 1} ${entry.color}" id="pen-${firstPen + i}">${layers[i].join('')}</g>`
      : ''
  );
  const prolog = svg.slice(0, root.index);
  const paperTag = paper
    ? `<${paper.tag}${attributeText({ ...paper.attrs, transform: paper.transform || undefined })}/>`
    : '';
  return `${prolog}${open}${paperTag}${groups.join('')}</svg>\n`;
}
