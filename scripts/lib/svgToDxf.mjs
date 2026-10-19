const PX_MM = 25.4 / 96;
const TOLERANCE_MM = 0.05;
const IDENTITY = [1, 0, 0, 1, 0, 0];

const ACI = [
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

const multiply = ([a, b, c, d, e, f], [g, h, i, j, k, l]) => [
  a * g + c * h,
  b * g + d * h,
  a * i + c * j,
  b * i + d * j,
  a * k + c * l + e,
  b * k + d * l + f,
];

const apply = ([a, b, c, d, e, f], [x, y]) => [
  a * x + c * y + e,
  b * x + d * y + f,
];

const numbers = (text) =>
  (String(text).match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/giu) ?? []).map(
    Number
  );

function transformStep(name, n) {
  const rad = ((n[0] ?? 0) * Math.PI) / 180;
  if (name === 'matrix') return n;
  if (name === 'translate') return [1, 0, 0, 1, n[0], n[1] ?? 0];
  if (name === 'scale') return [n[0], 0, 0, n[1] ?? n[0], 0, 0];
  if (name === 'skewX') return [1, 0, Math.tan(rad), 1, 0, 0];
  if (name === 'skewY') return [1, Math.tan(rad), 0, 1, 0, 0];
  if (name !== 'rotate') return IDENTITY;
  const [cx = 0, cy = 0] = n.slice(1);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return multiply(multiply([1, 0, 0, 1, cx, cy], [cos, sin, -sin, cos, 0, 0]), [
    1,
    0,
    0,
    1,
    -cx,
    -cy,
  ]);
}

const parseTransform = (text) =>
  [...String(text ?? '').matchAll(/(\w+)\s*\(([^)]*)\)/gu)].reduce(
    (matrix, [, name, args]) =>
      multiply(matrix, transformStep(name, numbers(args))),
    IDENTITY
  );

const parseAttributes = (text) =>
  Object.fromEntries(
    [...text.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu)].map(
      ([, name, double, single]) => [name, double ?? single]
    )
  );

function parseLength(value) {
  const match =
    /^\s*([-+]?[\d.]+(?:e[-+]?\d+)?)\s*(mm|cm|in|pt|px)?\s*$/iu.exec(
      String(value ?? '')
    );
  if (!match) return null;
  const scale = { cm: 10, in: 25.4, mm: 1, pt: 25.4 / 72, px: PX_MM };
  return {
    mm: Number(match[1]) * scale[(match[2] ?? 'px').toLowerCase()],
    physical: Boolean(match[2]) && match[2].toLowerCase() !== 'px',
    value: Number(match[1]),
  };
}

const segmentsFor = (lengthMm) =>
  Math.min(256, Math.max(2, Math.ceil(Math.sqrt(lengthMm / TOLERANCE_MM))));

function arcPoints(from, [rxIn, ryIn, angle, large, sweep, x, y], unitMm) {
  const [x1, y1] = from;
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (x1 === x && y1 === y) return [];
  if (rx === 0 || ry === 0) return [[x, y]];
  const phi = (angle * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x) / 2;
  const dy = (y1 - y) / 2;
  const xp = cos * dx + sin * dy;
  const yp = -sin * dx + cos * dy;
  const lambda = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
  const den = rx * rx * yp * yp + ry * ry * xp * xp;
  const coef = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * rx * yp) / ry;
  const cyp = (-coef * ry * xp) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y) / 2;
  const angleOf = (ux, uy) => Math.atan2(uy, ux);
  const start = angleOf((xp - cxp) / rx, (yp - cyp) / ry);
  let delta = angleOf((-xp - cxp) / rx, (-yp - cyp) / ry) - start;
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  const steps = segmentsFor(Math.abs(delta) * Math.max(rx, ry) * unitMm);
  return Array.from({ length: steps }, (_, i) => {
    if (i === steps - 1) return [x, y];
    const t = start + (delta * (i + 1)) / steps;
    const ex = rx * Math.cos(t);
    const ey = ry * Math.sin(t);
    return [cos * ex - sin * ey + cx, sin * ex + cos * ey + cy];
  });
}

const deCasteljau = (points, t) =>
  points.length === 1
    ? points[0]
    : deCasteljau(
        points
          .slice(1)
          .map((p, j) => [
            points[j][0] + (p[0] - points[j][0]) * t,
            points[j][1] + (p[1] - points[j][1]) * t,
          ]),
        t
      );

function bezierPoints(controls, unitMm) {
  let length = 0;
  for (let i = 1; i < controls.length; i += 1) {
    length += Math.hypot(
      controls[i][0] - controls[i - 1][0],
      controls[i][1] - controls[i - 1][1]
    );
  }
  const steps = segmentsFor(length * unitMm);
  return Array.from({ length: steps }, (_, i) =>
    deCasteljau(controls, (i + 1) / steps)
  );
}

const ARITY = { a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0 };

const reflected = (state, family) =>
  state.lastControl && family.test(state.lastCommand)
    ? [
        2 * state.point[0] - state.lastControl[0],
        2 * state.point[1] - state.lastControl[1],
      ]
    : state.point;

function drawTo(state, lower, args, abs, unitMm) {
  const { point } = state;
  if (lower === 'l') return { added: [abs(args[0], args[1])] };
  if (lower === 'h') return { added: [[abs(args[0], 0)[0], point[1]]] };
  if (lower === 'v') return { added: [[point[0], abs(0, args[0])[1]]] };
  if (lower === 'c' || lower === 's') {
    const c1 =
      lower === 'c' ? abs(args[0], args[1]) : reflected(state, /[cs]/iu);
    const rest = lower === 'c' ? args.slice(2) : args;
    const c2 = abs(rest[0], rest[1]);
    const end = abs(rest[2], rest[3]);
    return { added: bezierPoints([point, c1, c2, end], unitMm), control: c2 };
  }
  if (lower === 'q') {
    const c1 = abs(args[0], args[1]);
    const end = abs(args[2], args[3]);
    return { added: bezierPoints([point, c1, end], unitMm), control: c1 };
  }
  if (lower === 't') {
    const c1 = reflected(state, /[qt]/iu);
    const end = abs(args[0], args[1]);
    return { added: bezierPoints([point, c1, end], unitMm), control: c1 };
  }
  return {
    added: arcPoints(
      point,
      [...args.slice(0, 5), ...abs(args[5], args[6])],
      unitMm
    ),
  };
}

export function pathSubpaths(d, unitMm = 1) {
  const tokens =
    String(d).match(/[a-df-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/giu) ?? [];
  const state = {
    command: '',
    current: null,
    index: 0,
    lastCommand: '',
    lastControl: null,
    point: [0, 0],
    start: [0, 0],
    subpaths: [],
  };
  while (state.index < tokens.length) {
    if (/[a-z]/iu.test(tokens[state.index])) {
      state.command = tokens[state.index];
      state.index += 1;
    } else if (state.command === 'M') state.command = 'L';
    else if (state.command === 'm') state.command = 'l';
    const { command } = state;
    const lower = command.toLowerCase();
    const relative = command !== command.toUpperCase();
    const arity = ARITY[lower];
    if (arity === undefined || state.index + arity > tokens.length) break;
    const args = tokens.slice(state.index, state.index + arity).map(Number);
    state.index += arity;
    const origin = state.point;
    const abs = (x, y) => (relative ? [origin[0] + x, origin[1] + y] : [x, y]);
    let control = null;
    if (lower === 'm') {
      state.point = abs(args[0], args[1]);
      state.start = state.point;
      state.current = { closed: false, points: [state.point] };
      state.subpaths.push(state.current);
    } else if (lower === 'z') {
      if (state.current) state.current.closed = true;
      state.point = state.start;
      state.current = null;
    } else {
      if (!state.current) {
        state.current = { closed: false, points: [state.point] };
        state.subpaths.push(state.current);
      }
      const drawn = drawTo(state, lower, args, abs, unitMm);
      state.current.points.push(...drawn.added);
      state.point = drawn.added.at(-1) ?? state.point;
      control = drawn.control ?? null;
    }
    state.lastControl = control;
    state.lastCommand = command;
  }
  return state.subpaths;
}

function ellipse(cx, cy, rx, ry, unitMm) {
  const steps = Math.max(
    8,
    segmentsFor(2 * Math.PI * Math.max(rx, ry) * unitMm)
  );
  return Array.from({ length: steps }, (_, i) => {
    const t = (2 * Math.PI * i) / steps;
    return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
  });
}

function shapeSubpaths(tag, attrs, unitMm) {
  const n = (name) => Number(attrs[name] ?? 0);
  if (tag === 'path') return pathSubpaths(attrs.d ?? '', unitMm);
  if (tag === 'polyline' || tag === 'polygon') {
    const values = numbers(attrs.points ?? '');
    const points = [];
    for (let i = 0; i + 1 < values.length; i += 2)
      points.push([values[i], values[i + 1]]);
    return [{ closed: tag === 'polygon', points }];
  }
  if (tag === 'line') {
    return [
      {
        closed: false,
        points: [
          [n('x1'), n('y1')],
          [n('x2'), n('y2')],
        ],
      },
    ];
  }
  if (tag === 'circle') {
    return [
      {
        closed: true,
        points: ellipse(n('cx'), n('cy'), n('r'), n('r'), unitMm),
      },
    ];
  }
  if (tag === 'ellipse') {
    return [
      {
        closed: true,
        points: ellipse(n('cx'), n('cy'), n('rx'), n('ry'), unitMm),
      },
    ];
  }
  if (tag === 'rect') {
    const [x, y, w, h] = [n('x'), n('y'), n('width'), n('height')];
    if (!(w > 0 && h > 0)) return [];
    return [
      {
        closed: true,
        points: [
          [x, y],
          [x + w, y],
          [x + w, y + h],
          [x, y + h],
        ],
      },
    ];
  }
  return [];
}

const SHAPES = new Set([
  'circle',
  'ellipse',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
]);
const SKIPPED = new Set([
  'clipPath',
  'defs',
  'filter',
  'image',
  'marker',
  'mask',
  'pattern',
  'symbol',
  'text',
]);

const painted = (value) =>
  value != null && value !== 'none' && value !== 'transparent';

const plotted = ({ fill, stroke }) =>
  painted(stroke) && !(painted(fill) && fill === stroke);

function layerName(raw) {
  const name = String(raw)
    .trim()
    .replace(/[^A-Za-z0-9_-]+/gu, '_');
  return name.replace(/^_+|_+$/gu, '') || '0';
}

function hexRgb(value) {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/iu.exec(
    String(value ?? '').trim()
  );
  if (!match) return null;
  const hex =
    match[1].length === 3 ? [...match[1]].map((c) => c + c).join('') : match[1];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function aciFor(stroke) {
  const rgb = hexRgb(stroke);
  if (!rgb) return 7;
  const distance = ([, [r, g, b]]) =>
    (rgb[0] - r) ** 2 + (rgb[1] - g) ** 2 + (rgb[2] - b) ** 2;
  return ACI.reduce((best, entry) =>
    distance(entry) < distance(best) ? entry : best
  )[0];
}

const inside = ([x, y], [w, h]) => x >= 0 && x <= w && y >= 0 && y <= h;

function clipSegment([x0, y0], [x1, y1], [w, h]) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  let t0 = 0;
  let t1 = 1;
  const visible = [
    [-dx, x0],
    [dx, w - x0],
    [-dy, y0],
    [dy, h - y0],
  ].every(([p, q]) => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) t0 = Math.max(t0, r);
    else t1 = Math.min(t1, r);
    return t0 <= t1;
  });
  if (!visible) return null;
  return {
    cut: t1 < 1,
    points: [
      [x0 + t0 * dx, y0 + t0 * dy],
      [x0 + t1 * dx, y0 + t1 * dy],
    ],
  };
}

function clipToPage({ closed, points }, page) {
  if (points.every((p) => inside(p, page))) return [{ closed, points }];
  const path = closed ? [...points, points[0]] : points;
  const pieces = [];
  let current = null;
  path.slice(1).forEach((end, i) => {
    const clipped = clipSegment(path[i], end, page);
    if (!clipped) {
      current = null;
      return;
    }
    if (!current) {
      current = { closed: false, points: [clipped.points[0]] };
      pieces.push(current);
    }
    current.points.push(clipped.points[1]);
    if (clipped.cut) current = null;
  });
  return pieces;
}

export function plotGeometry(svg) {
  const rootMatch = /<svg\b([^>]*)>/u.exec(svg);
  if (!rootMatch) throw new Error('svgToDxf: no <svg> root element');
  const root = parseAttributes(rootMatch[1]);
  const width = parseLength(root.width);
  const height = parseLength(root.height);
  const box = root.viewBox
    ? numbers(root.viewBox)
    : [0, 0, width?.value ?? 0, height?.value ?? 0];
  const [minX, minY, boxW, boxH] = box;
  if (!(boxW > 0 && boxH > 0)) throw new Error('svgToDxf: the SVG has no size');
  const widthMm = width?.mm ?? boxW * PX_MM;
  const unitMm = widthMm / boxW;
  const heightMm = height?.mm ?? boxH * unitMm;
  const toPage = [
    unitMm,
    0,
    0,
    -unitMm,
    -minX * unitMm,
    (minY + boxH) * unitMm,
  ];
  const page = [boxW * unitMm, boxH * unitMm];

  const layers = new Map();
  const stack = [{ attrs: {}, layer: null, matrix: toPage, skip: false }];
  const body = svg
    .slice(rootMatch.index + rootMatch[0].length)
    .replace(/<!--[\s\S]*?-->/gu, '');
  const tags = body.matchAll(
    /<(\/?)([\w:-]+)((?:\s+[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/gu
  );
  [...tags].forEach(([, closing, tag, attrText, selfClosing]) => {
    if (closing) {
      if (stack.length > 1) stack.pop();
      return;
    }
    const parent = stack.at(-1);
    const own = parseAttributes(attrText);
    const style = Object.fromEntries(
      String(own.style ?? '')
        .split(';')
        .map((rule) => rule.split(':').map((part) => part.trim()))
        .filter(([name, value]) => name && value)
    );
    const attrs = {
      fill: style.fill ?? own.fill ?? parent.attrs.fill,
      stroke: style.stroke ?? own.stroke ?? parent.attrs.stroke,
    };
    const matrix = own.transform
      ? multiply(parent.matrix, parseTransform(own.transform))
      : parent.matrix;
    const skip =
      parent.skip ||
      SKIPPED.has(tag) ||
      own.filter != null ||
      own.display === 'none' ||
      style.display === 'none' ||
      own.visibility === 'hidden';
    const layer =
      tag === 'g' && (own['inkscape:label'] ?? own.id)
        ? (own['inkscape:label'] ?? own.id)
        : parent.layer;
    const node = { attrs, layer, matrix, skip };

    if (SHAPES.has(tag) && !skip && plotted(attrs)) {
      const name = layerName(layer ?? attrs.stroke ?? '0');
      if (!layers.has(name)) {
        layers.set(name, { color: aciFor(attrs.stroke), name, polylines: [] });
      }
      const target = layers.get(name);
      const scale = Math.sqrt(
        Math.abs(matrix[0] * matrix[3] - matrix[1] * matrix[2])
      );
      shapeSubpaths(tag, own, scale).forEach(({ closed, points }) => {
        const placed = points.map((p) => apply(matrix, p));
        const last = placed.at(-1);
        const loops =
          placed.length > 2 &&
          Math.hypot(placed[0][0] - last[0], placed[0][1] - last[1]) < 1e-6;
        if (loops) placed.pop();
        clipToPage({ closed: closed || loops, points: placed }, page)
          .filter((piece) => piece.points.length >= 2)
          .forEach((piece) => target.polylines.push(piece));
      });
    }
    if (!selfClosing) stack.push(node);
  });
  return { heightMm, layers: [...layers.values()], widthMm };
}

const fmt = (value) => {
  const rounded = Math.round(value * 10000) / 10000;
  return Object.is(rounded, -0) ? '0' : String(rounded);
};

export function svgToDxf(svg) {
  const { heightMm, layers, widthMm } = plotGeometry(svg);
  const out = [];
  const pair = (code, value) => out.push(String(code), String(value));
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
  [{ color: 7, name: '0' }, ...layers.filter((l) => l.name !== '0')].forEach(
    (layer) => {
      pair(0, 'LAYER');
      pair(2, layer.name);
      pair(70, 0);
      pair(62, layer.color);
      pair(6, 'CONTINUOUS');
    }
  );
  pair(0, 'ENDTAB');
  pair(0, 'ENDSEC');
  pair(0, 'SECTION');
  pair(2, 'ENTITIES');
  layers.forEach((layer) => {
    layer.polylines.forEach(({ closed, points }) => {
      pair(0, 'POLYLINE');
      pair(8, layer.name);
      pair(66, 1);
      pair(10, 0);
      pair(20, 0);
      pair(30, 0);
      pair(70, closed ? 1 : 0);
      points.forEach(([x, y]) => {
        pair(0, 'VERTEX');
        pair(8, layer.name);
        pair(10, fmt(x));
        pair(20, fmt(y));
        pair(30, 0);
      });
      pair(0, 'SEQEND');
      pair(8, layer.name);
    });
  });
  pair(0, 'ENDSEC');
  pair(0, 'EOF');
  return `${out.join('\n')}\n`;
}

export function sizePlot(svg, widthMm) {
  if (!widthMm) return svg;
  return svg.replace(/<svg\b([^>]*)>/u, (tag, attrText) => {
    const attrs = parseAttributes(attrText);
    const width = parseLength(attrs.width);
    if (width?.physical) return tag;
    const height = parseLength(attrs.height);
    const box = attrs.viewBox
      ? numbers(attrs.viewBox)
      : [0, 0, width?.value ?? 0, height?.value ?? 0];
    if (!(box[2] > 0 && box[3] > 0)) return tag;
    const heightMm = fmt((widthMm * box[3]) / box[2]);
    const kept = attrText
      .replace(/\s(?:width|height|viewBox)\s*=\s*(?:"[^"]*"|'[^']*')/gu, '')
      .trimEnd();
    return `<svg${kept} width="${fmt(widthMm)}mm" height="${heightMm}mm" viewBox="${box.join(' ')}">`;
  });
}
