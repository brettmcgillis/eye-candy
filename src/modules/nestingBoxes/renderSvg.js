/* eslint-disable no-bitwise */
import { boxColor, reducePens } from './colors';
import treeLevel from './tree';

const SAMPLE_PX = 1.5;
const MIN_BOX_PX = 0.75;
const PLOT_PENS = 6;
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

// three's perspective camera: `depth` is distance along the view axis, the
// quantity a linear depth buffer stores.
export function createPerspectiveProjector({ camera, height, width }) {
  const { eye, fov, target, up } = camera;
  const z = normalize(sub(eye, target));
  const x = normalize(cross(up, z));
  const y = cross(z, x);
  const focal = 1 / Math.tan((fov * Math.PI) / 360);
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

function corners(center, radius) {
  return Array.from({ length: 8 }, (_, i) => [
    center[0] + (i & 1 ? radius[0] : -radius[0]),
    center[1] + (i & 2 ? radius[1] : -radius[1]),
    center[2] + (i & 4 ? radius[2] : -radius[2]),
  ]);
}

// A plottable twin of a still: every settled leaf box's twelve edges through
// the same camera, with what the render hides removed by `visible` (a depth
// probe from the real renderer). One Inkscape layer per pen.
export default function renderNestingBoxesSvg({
  camera,
  config,
  height,
  stops,
  stroke = 0.6,
  visible = null,
  width,
}) {
  const project = createPerspectiveProjector({ camera, height, width });
  const level = treeLevel(config);
  const settledBox = (i) => {
    const center = [...level.centers.subarray(i * 3, i * 3 + 3)];
    const radius = [...level.radii.subarray(i * 3, i * 3 + 3)].map(Math.abs);
    const points = corners(center, radius).map((p) => ({
      ...project(p),
      world: p,
    }));
    if (points.some((p) => p.depth <= 0)) return null;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const span = Math.hypot(
      Math.max(...xs) - Math.min(...xs),
      Math.max(...ys) - Math.min(...ys)
    );
    const outside =
      Math.max(...xs) < 0 ||
      Math.min(...xs) > width ||
      Math.max(...ys) < 0 ||
      Math.min(...ys) > height;
    if (span < MIN_BOX_PX || outside) return null;
    return {
      color: boxColor(config, {
        center,
        level: level.level,
        node: level.first + i,
        radius,
        stops,
      }),
      points,
    };
  };
  const boxes = Array.from({ length: level.count }, (_, i) =>
    settledBox(i)
  ).filter(Boolean);

  const penFor =
    config.colorMode === 'palette' && stops
      ? (color) => color
      : reducePens(
          boxes.map((box) => box.color),
          PLOT_PENS
        );
  const pens = new Map();
  const inFrame = (p) => p.x >= 0 && p.y >= 0 && p.x <= width && p.y <= height;
  const shows = (p) =>
    inFrame(p) &&
    (!visible || visible(p.x, p.y, p.depth - (p.depth * 0.004 + 1e-4)));

  boxes.forEach(({ color, points }) => {
    const pen = penFor(color);
    if (!pens.has(pen)) pens.set(pen, []);
    const paths = pens.get(pen);

    EDGES.forEach(([ia, ib]) => {
      const a = points[ia];
      const b = points[ib];
      const steps = Math.max(
        1,
        Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / SAMPLE_PX)
      );
      let run = [];
      const flush = () => {
        if (run.length > 1) paths.push(run);
        run = [];
      };
      for (let s = 0; s <= steps; s += 1) {
        const t = s / steps;
        const p = project(
          a.world.map((v, axis) => v + (b.world[axis] - v) * t)
        );
        if (shows(p)) run.push(p);
        else flush();
      }
      flush();
    });
  });

  const fmt = (v) => v.toFixed(1);
  const layersSvg = [...pens.entries()]
    .filter(([, paths]) => paths.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([color, paths], index) => {
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
        `<g inkscape:groupmode="layer" inkscape:label="pen-${index} ${color}" id="pen-${index}" ` +
        `fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="${d}"/></g>`
      );
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${layersSvg}</svg>`
  );
}
