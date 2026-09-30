/* eslint-disable no-bitwise */
import { rgbToHex } from '@utils/paletteStops';

const SAMPLE_PX = 1.5;
const MIN_BOX_PX = 0.75;
const CIRCLE_STEPS = 64;
const EDGES = [
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

export function cameraBasis({ eye, target, up }) {
  const z = normalize(sub(eye, target));
  const x = normalize(cross(up, z));
  return { x, y: cross(z, x), z };
}

// three's cameras: `depth` is distance along the view axis, the quantity the
// capturer's linear depth pass stores.
export function createProjector({ camera, height, width }) {
  const { x, y, z } = cameraBasis(camera);
  const { eye } = camera;
  if (camera.projection === 'orthographic') {
    return (point) => {
      const d = sub(point, eye);
      return {
        depth: -dot(d, z),
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
      x: width / 2 + ((dot(d, x) / depth) * focal * width) / (2 * aspect),
      y: height / 2 - ((dot(d, y) / depth) * focal * height) / 2,
    };
  };
}

const corners = (center, half) =>
  Array.from({ length: 8 }, (_, i) => [
    center[0] + (i & 1 ? half[0] : -half[0]),
    center[1] + (i & 2 ? half[1] : -half[1]),
    center[2] + (i & 4 ? half[2] : -half[2]),
  ]);

const boxSegments = (center, half) => {
  const points = corners(center, half);
  return EDGES.map(([a, b]) => [points[a], points[b]]);
};

function circleSegments(center, radius, basis) {
  const at = (i) => {
    const angle = (i / CIRCLE_STEPS) * Math.PI * 2;
    return center.map(
      (c, a) =>
        c +
        (basis.x[a] * Math.cos(angle) + basis.y[a] * Math.sin(angle)) * radius
    );
  };
  return Array.from({ length: CIRCLE_STEPS }, (_, i) => [at(i), at(i + 1)]);
}

// A plottable twin of a still: every solid, glass cell and frame edge through
// the same camera, with what the render hides removed by `visible` (a depth
// probe from the real renderer). One Inkscape layer per role, drawn in the
// mean colour of that role's cells.
export default function renderHyperCubesSvg({
  camera,
  config,
  height,
  instances,
  stroke = 0.6,
  visible = null,
  width,
}) {
  const project = createProjector({ camera, height, width });
  const basis = cameraBasis(camera);
  const pens = new Map();
  const penOf = (role, rgb) => {
    if (!pens.has(role))
      pens.set(role, { count: 0, paths: [], sum: [0, 0, 0] });
    const pen = pens.get(role);
    pen.count += 1;
    rgb.forEach((c, i) => {
      pen.sum[i] += c;
    });
    return pen;
  };

  const tooSmall = (segments) => {
    const xs = [];
    const ys = [];
    segments.flat().forEach((p) => {
      const q = project(p);
      xs.push(q.x);
      ys.push(q.y);
    });
    return (
      Math.hypot(
        Math.max(...xs) - Math.min(...xs),
        Math.max(...ys) - Math.min(...ys)
      ) < MIN_BOX_PX
    );
  };

  const inFrame = (p) => p.x >= 0 && p.y >= 0 && p.x <= width && p.y <= height;
  const shows = (p) =>
    p.depth > 0 &&
    inFrame(p) &&
    (!visible || visible(p.x, p.y, p.depth - (p.depth * 0.004 + 1e-4)));

  const trace = (pen, segments) => {
    if (tooSmall(segments)) return;
    segments.forEach(([a, b]) => {
      const pa = project(a);
      const pb = project(b);
      const steps = Math.max(
        1,
        Math.ceil(Math.hypot(pb.x - pa.x, pb.y - pa.y) / SAMPLE_PX)
      );
      let run = [];
      const flush = () => {
        if (run.length > 1) pen.paths.push(run);
        run = [];
      };
      for (let s = 0; s <= steps; s += 1) {
        const t = s / steps;
        const p = project(a.map((v, axis) => v + (b[axis] - v) * t));
        if (shows(p)) run.push(p);
        else flush();
      }
      flush();
    });
  };

  const shapeOf = ({ center, half, look }) =>
    look.shape === 'sphere'
      ? circleSegments(center, half[0], basis)
      : boxSegments(center, half);

  instances.solids
    .filter(({ look }) => look.role !== 'core')
    .forEach((item) => {
      const { look } = item;
      const rgb = look.role === 'emissive' ? look.emissive : look.color;
      const peak = Math.max(...rgb, 1e-6);
      trace(
        penOf(
          look.role,
          look.role === 'emissive' ? rgb.map((c) => c / peak) : rgb
        ),
        shapeOf(item)
      );
    });
  instances.glass.forEach((item) =>
    trace(penOf('glass', item.look.tint), shapeOf(item))
  );
  instances.frames.forEach((item) =>
    trace(penOf('frame', [0, 0, 0]), boxSegments(item.center, item.half))
  );

  const fmt = (v) => v.toFixed(1);
  const layersSvg = [...pens.entries()]
    .filter(([, pen]) => pen.paths.length > 0)
    .sort((a, b) => b[1].paths.length - a[1].paths.length)
    .map(([role, pen], index) => {
      const hex =
        role === 'frame'
          ? config.frameColor.toLowerCase()
          : rgbToHex(pen.sum.map((c) => toSrgb(c / pen.count)));
      const d = pen.paths
        .map(
          (run) =>
            `M${fmt(run[0].x)} ${fmt(run[0].y)}${run
              .slice(1)
              .map((p) => `L${fmt(p.x)} ${fmt(p.y)}`)
              .join('')}`
        )
        .join('');
      return (
        `<g inkscape:groupmode="layer" inkscape:label="pen-${index} ${role} ${hex}" id="pen-${index}" ` +
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
