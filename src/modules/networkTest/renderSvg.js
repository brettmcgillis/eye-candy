import { rgbToHex } from '@utils/paletteStops';

import { CLASSES, SEGMENT_FLOATS, SPRITE_FLOATS } from './instances';

export const NODE_CORE = 0.45;
const CIRCLE_STEPS = 18;
const MIN_NODE_PX = 0.4;
const JOIN_PX = 0.05;
const CLASS_NAMES = ['edge', 'bridge'];

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (v) => {
  const length = Math.hypot(...v) || 1;
  return v.map((c) => c / length);
};
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const toSrgb = (v) => {
  const c = Math.min(Math.max(v, 0), 1);
  return (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055) * 255;
};
const smooth = (x) => {
  const t = Math.min(Math.max(x, 0), 1);
  return t * t * (3 - 2 * t);
};

export function cameraBasis({ eye, target, up }) {
  const z = normalize(sub(eye, target));
  const x = normalize(cross(up, z));
  return { x, y: cross(z, x), z };
}

// three's cameras; `scale` is output px per world unit at that depth.
export function createProjector({ camera, height, width }) {
  const { x, y, z } = cameraBasis(camera);
  const { eye } = camera;
  if (camera.projection === 'orthographic') {
    const scale = height / 2 / camera.halfHeight;
    return (point) => {
      const d = sub(point, eye);
      return {
        depth: -dot(d, z),
        scale,
        x: width / 2 + (dot(d, x) / camera.halfWidth) * (width / 2),
        y: height / 2 - (dot(d, y) / camera.halfHeight) * (height / 2),
      };
    };
  }
  const focal = 1 / Math.tan((camera.fov * Math.PI) / 360);
  const aspect = width / height;
  return (point) => {
    const d = sub(point, eye);
    const depth = -dot(d, z);
    return {
      depth,
      scale: (focal * height) / 2 / depth,
      x: width / 2 + ((dot(d, x) / depth) * focal * width) / (2 * aspect),
      y: height / 2 - ((dot(d, y) / depth) * focal * height) / 2,
    };
  };
}

// Liang–Barsky against the frame; null when the segment misses it.
function clip(a, b, width, height) {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const edges = [
    [-dx, a.x],
    [dx, width - a.x],
    [-dy, a.y],
    [dy, height - a.y],
  ];
  for (let i = 0; i < edges.length; i += 1) {
    const [p, q] = edges[i];
    if (p === 0) {
      if (q < 0) return null;
    } else {
      const r = q / p;
      if (p < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
      if (t0 > t1) return null;
    }
  }
  return [
    { x: a.x + dx * t0, y: a.y + dy * t0 },
    { x: a.x + dx * t1, y: a.y + dy * t1 },
  ];
}

// Joins segments that meet end to end into polylines, so the plotter lifts
// the pen once per stroke rather than once per link.
export function chainSegments(segments) {
  const keyOf = (p) =>
    `${Math.round(p.x / JOIN_PX)},${Math.round(p.y / JOIN_PX)}`;
  const at = new Map();
  segments.forEach((segment, index) => {
    segment.forEach((p) => {
      const key = keyOf(p);
      if (!at.has(key)) at.set(key, []);
      at.get(key).push(index);
    });
  });
  const used = new Uint8Array(segments.length);
  const walk = (start, index) => {
    const line = [start];
    let tip = start;
    let next = index;
    while (next != null) {
      used[next] = 1;
      const [p, q] = segments[next];
      const far = keyOf(p) === keyOf(tip) ? q : p;
      line.push(far);
      tip = far;
      next = (at.get(keyOf(tip)) ?? []).find((i) => !used[i]);
    }
    return line;
  };
  const lines = [];
  at.forEach((list, key) => {
    if (list.length === 2) return;
    list.forEach((index) => {
      if (used[index]) return;
      const [p, q] = segments[index];
      lines.push(walk(keyOf(p) === key ? p : q, index));
    });
  });
  segments.forEach((segment, index) => {
    if (!used[index]) lines.push(walk(segment[0], index));
  });
  return lines;
}

// A plottable twin of a still: every link through the same camera, clipped
// to the frame, chained into strokes, one Inkscape layer per class and depth
// band in that layer's mean colour. Wires do not hide each other, so there
// is no hidden-line pass; nodes are small circles.
export default function renderNetworkTestSvg({
  camera,
  config,
  depthPens = 2,
  height,
  instances,
  minAlpha = 0.15,
  nodes = 'circles',
  stroke = 0.6,
  width,
}) {
  const project = createProjector({ camera, height, width });
  const near = camera.depthNear ?? 0;
  const far = camera.depthFar ?? near + 1;
  const bandOf = (depth) => {
    const t = (depth - near) / Math.max(far - near, 1e-6);
    return Math.min(Math.max(Math.floor(t * depthPens), 0), depthPens - 1);
  };
  const fadeOf = (depth) =>
    1 - config.depthFade * smooth((depth - near) / Math.max(far - near, 1e-6));
  const pens = new Map();
  const penOf = (name, band, rgb) => {
    const key = `${name}|${band}`;
    if (!pens.has(key)) {
      pens.set(key, {
        band,
        circles: [],
        count: 0,
        name,
        segments: [],
        sum: [0, 0, 0],
      });
    }
    const pen = pens.get(key);
    const peak = Math.max(...rgb, 1e-6);
    pen.count += 1;
    rgb.forEach((c, i) => {
      pen.sum[i] += peak > 1 ? c / peak : c;
    });
    return pen;
  };

  const { classes, count, data } = instances.segments;
  for (let i = 0; i < count; i += 1) {
    const o = i * SEGMENT_FLOATS;
    if (classes[i] !== CLASSES.trail) {
      const a = project([data[o], data[o + 1], data[o + 2]]);
      const b = project([data[o + 4], data[o + 5], data[o + 6]]);
      const depth = (a.depth + b.depth) / 2;
      const alpha = ((data[o + 11] + data[o + 15]) / 2) * fadeOf(depth);
      if (a.depth > 0 && b.depth > 0 && alpha >= minAlpha) {
        const clipped = clip(a, b, width, height);
        if (clipped) {
          const rgb = [0, 1, 2].map(
            (c) => (data[o + 8 + c] + data[o + 12 + c]) / 2
          );
          penOf(CLASS_NAMES[classes[i]], bandOf(depth), rgb).segments.push(
            clipped
          );
        }
      }
    }
  }

  if (nodes === 'circles') {
    const { sprites } = instances;
    for (let i = 0; i < sprites.count; i += 1) {
      const o = i * SPRITE_FLOATS;
      if (sprites.classes[i] === CLASSES.node) {
        const p = project([
          sprites.data[o],
          sprites.data[o + 1],
          sprites.data[o + 2],
        ]);
        const r = sprites.data[o + 3] * NODE_CORE * p.scale;
        const inside = p.x >= 0 && p.y >= 0 && p.x <= width && p.y <= height;
        if (p.depth > 0 && inside && r >= MIN_NODE_PX) {
          const rgb = [0, 1, 2].map((c) => sprites.data[o + 4 + c]);
          penOf('node', bandOf(p.depth), rgb).circles.push([p.x, p.y, r]);
        }
      }
    }
  }

  const fmt = (v) => v.toFixed(2);
  const circlePath = ([cx, cy, r]) => {
    const points = Array.from({ length: CIRCLE_STEPS + 1 }, (_, s) => {
      const a = (s / CIRCLE_STEPS) * Math.PI * 2;
      return `${fmt(cx + Math.cos(a) * r)} ${fmt(cy + Math.sin(a) * r)}`;
    });
    return `M${points.join('L')}Z`;
  };

  const layersSvg = [...pens.values()]
    .filter((pen) => pen.segments.length > 0 || pen.circles.length > 0)
    .sort((a, b) => a.band - b.band || a.name.localeCompare(b.name))
    .map((pen, index) => {
      const hex = rgbToHex(pen.sum.map((c) => toSrgb(c / pen.count)));
      const strokes = chainSegments(pen.segments).map(
        (line) =>
          `M${fmt(line[0].x)} ${fmt(line[0].y)}${line
            .slice(1)
            .map((p) => `L${fmt(p.x)} ${fmt(p.y)}`)
            .join('')}`
      );
      const d = [...strokes, ...pen.circles.map(circlePath)].join('');
      const label = `pen-${index} ${pen.name} depth-${pen.band + 1} ${hex}`;
      return (
        `<g inkscape:groupmode="layer" inkscape:label="${label}" id="pen-${index}" ` +
        `fill="none" stroke="${hex}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="${d}"/></g>`
      );
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${layersSvg}</svg>`
  );
}
