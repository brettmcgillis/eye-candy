/* eslint-disable no-bitwise */
import { createProjector } from '@modules/plotKit';
import { rgbToHex } from '@utils/paletteStops';

import {
  BULLET_PROFILE,
  CAP_TOP,
  DISH_INNER,
  TAU,
  faceRim,
  rotate,
} from './parts';

const SAMPLE_PX = 1.5;
const MIN_PX = 0.75;
const FLAT = 0.004;
const EXACT_BIAS = 0.0004;
const FACETED_BIAS = 0.003;
const EXACT = new Set(['box', 'rbox']);
const BOX_EDGES = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  [0, 2],
  [1, 3],
  [4, 6],
  [5, 7],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];
const TOP_EDGES = [
  [4, 5],
  [6, 7],
  [4, 6],
  [5, 7],
];

const toSrgb = (v) => {
  const c = Math.min(Math.max(v, 0), 1);
  return (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055) * 255;
};
const quantize = (v) => Math.round(v / 17) * 17;
const inverse = (q) => [-q[0], -q[1], -q[2], q[3]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

// The colour a part plots in: its albedo, or for a lit part its emission
// brought back into range.
function inkOf(item) {
  const e = item.e && Math.max(...item.e) > 0.2 ? item.e : null;
  const rgb = e ? e.map((v) => v / Math.max(...e)) : item.c;
  return rgbToHex(rgb.map((v) => quantize(toSrgb(v))));
}

const at = (item, local) => {
  const r = rotate(item.q, local);
  return [item.p[0] + r[0], item.p[1] + r[1], item.p[2] + r[2]];
};

function boxSegments(item) {
  const corners = Array.from({ length: 8 }, (_, i) =>
    at(item, [
      i & 1 ? item.s[0] : -item.s[0],
      i & 2 ? item.s[1] : -item.s[1],
      i & 4 ? item.s[2] : -item.s[2],
    ])
  );
  const edges = item.s[2] <= FLAT ? TOP_EDGES : BOX_EDGES;
  return edges.map(([a, b]) => [corners[a], corners[b]]);
}

function ring(item, radius, z, steps) {
  const point = (i) => {
    const a = (i / steps) * TAU;
    return at(item, [Math.cos(a) * radius[0], Math.sin(a) * radius[1], z]);
  };
  return Array.from({ length: steps }, (_, i) => [point(i), point(i + 1)]);
}

function frustumSegments(item, top, steps, eye) {
  const [rx, ry, hz] = item.s;
  const out = ring(item, [rx * top, ry * top], hz, steps);
  if (hz <= FLAT) return out;
  out.push(...ring(item, [rx, ry], -hz, steps));
  const d = rotate(inverse(item.q), sub(eye, item.p));
  if (Math.hypot(d[0], d[1]) > 1e-3) {
    const base = Math.atan2(d[1], d[0]);
    [base + Math.PI / 2, base - Math.PI / 2].forEach((a) => {
      const c = Math.cos(a);
      const s = Math.sin(a);
      out.push([
        at(item, [c * rx, s * ry, -hz]),
        at(item, [c * rx * top, s * ry * top, hz]),
      ]);
    });
  }
  return out;
}

function sphereSegments(item, camera, steps) {
  const forward = sub(camera.target, camera.eye);
  const length = Math.hypot(...forward);
  const z = forward.map((v) => v / length);
  const right = [z[2], 0, -z[0]];
  const rl = Math.hypot(...right) || 1;
  const x = right.map((v) => v / rl);
  const y = [
    z[1] * x[2] - z[2] * x[1],
    z[2] * x[0] - z[0] * x[2],
    z[0] * x[1] - z[1] * x[0],
  ];
  const r = Math.max(item.s[0], item.s[1]);
  const point = (i) => {
    const a = (i / steps) * TAU;
    return item.p.map(
      (c, k) => c + (x[k] * Math.cos(a) + y[k] * Math.sin(a)) * r
    );
  };
  return Array.from({ length: steps }, (_, i) => [point(i), point(i + 1)]);
}

function segmentsOf(item, camera, steps) {
  switch (item.g) {
    case 'lens':
    case 'glow':
      return [];
    case 'box':
    case 'rbox':
      return boxSegments(item);
    case 'bullet': {
      const d = rotate(inverse(item.q), sub(camera.eye, item.p));
      const angle = Math.atan2(d[1], d[0]);
      const lines = ring(item, [item.s[0], item.s[1]], -item.s[2], steps);
      [angle + Math.PI / 2, angle - Math.PI / 2].forEach((a) => {
        const points = BULLET_PROFILE.map(([r, z]) =>
          at(item, [
            Math.cos(a) * r * item.s[0],
            Math.sin(a) * r * item.s[1],
            z * item.s[2],
          ])
        );
        for (let i = 1; i < points.length; i += 1)
          lines.push([points[i - 1], points[i]]);
      });
      return lines;
    }
    case 'cap':
      return frustumSegments(item, CAP_TOP, steps, camera.eye);
    case 'sphere':
      return sphereSegments(item, camera, steps);
    case 'dish':
      return [
        ...ring(item, [item.s[0], item.s[1]], item.s[2], steps),
        ...ring(
          item,
          [item.s[0] * DISH_INNER, item.s[1] * DISH_INNER],
          -item.s[2],
          steps
        ),
      ];
    case 'face': {
      const point = (i) => {
        const [x, y] = faceRim((i / steps) * TAU);
        return at(item, [x * item.s[0], y * item.s[1], -item.s[2]]);
      };
      return Array.from({ length: steps }, (_, i) => [point(i), point(i + 1)]);
    }
    case 'torus': {
      const [r, , tube] = item.s;
      return [
        ...ring(item, [r + tube, r + tube], 0, steps),
        ...ring(item, [r - tube, r - tube], 0, steps),
      ];
    }
    default:
      return frustumSegments(item, 1, steps, camera.eye);
  }
}

// A plottable twin of a still: every part's outline through the same
// camera, with what the render hides removed by `visible` (a depth probe
// from the real renderer). One Inkscape layer per ink, darkest drawn by its
// own colour so `svgColors` can regroup them.
export default function renderPanelSvg({
  camera,
  height,
  parts,
  cables = [],
  stroke = 0.6,
  visible = null,
  width,
}) {
  const project = createProjector(camera, width, height);
  const pens = new Map();
  const inFrame = (p) => p.x >= 0 && p.y >= 0 && p.x <= width && p.y <= height;
  const shows = (p, cable, bias) =>
    p.depth > 0 &&
    inFrame(p) &&
    (!visible ||
      (cable && visible.cable ? visible.cable : visible)(
        p.x,
        p.y,
        p.depth - (cable ? cable.radius * 1.3 : p.depth * bias + 1e-4)
      ));

  function trace(points, paths, cable = null, bias = FACETED_BIAS) {
    let run = [];
    const flush = () => {
      if (run.length > 1) paths.push(run);
      run = [];
    };
    for (let j = 1; j < points.length; j += 1) {
      const a = points[j - 1];
      const b = points[j];
      const pa = project(...a);
      const pb = project(...b);
      const count = Math.max(
        1,
        Math.ceil(Math.hypot(pb.x - pa.x, pb.y - pa.y) / SAMPLE_PX)
      );
      for (let i = j === 1 ? 0 : 1; i <= count; i += 1) {
        const t = i / count;
        const p = project(...a.map((v, k) => v + (b[k] - v) * t));
        if (shows(p, cable, bias)) run.push(p);
        else flush();
      }
    }
    flush();
  }
  parts.forEach((item) => {
    const center = project(...item.p);
    if (center.depth <= 0) return;
    const edge = project(...at(item, [Math.max(...item.s), 0, 0]));
    const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
    if (radius < MIN_PX) return;
    const steps = Math.min(64, Math.max(10, Math.ceil(radius * 0.8)));
    const hex = inkOf(item);
    if (!pens.has(hex)) pens.set(hex, []);
    const paths = pens.get(hex);
    const bias = EXACT.has(item.g) ? EXACT_BIAS : FACETED_BIAS;
    segmentsOf(item, camera, steps).forEach(([a, b]) => {
      trace([a, b], paths, null, bias);
    });
  });

  cables.forEach((cable) => {
    const hex = inkOf(cable);
    if (!pens.has(hex)) pens.set(hex, []);
    const paths = pens.get(hex);
    cable.edges.forEach((edge) => {
      trace(edge, paths, cable);
    });
  });

  const fmt = (v) => v.toFixed(1);
  const layers = [...pens.entries()]
    .filter(([, paths]) => paths.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([hex, paths], index) => {
      const d = paths
        .map(
          (run) =>
            `M${fmt(run[0].x)} ${fmt(run[0].y)}${run
              .slice(1)
              .map((p) => `L${fmt(p.x)} ${fmt(p.y)}`)
              .join('')}`
        )
        .join('');
      return (
        `<g inkscape:groupmode="layer" inkscape:label="pen-${index} ${hex}" id="pen-${index}" ` +
        `fill="none" stroke="${hex}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="${d}"/></g>`
      );
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${layers}</svg>`
  );
}
