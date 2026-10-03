import { localOutline, placePoint } from './parts';

const SAMPLE_PX = 1.5;
const MIN_SPAN_PX = 0.75;

const PENS = {
  mass: { color: '#1b1b1b', roles: ['mass', 'core', 'plinth', 'blade'] },
  detail: {
    color: '#5a5a5a',
    roles: ['fin', 'slab', 'parapet', 'column', 'step', 'spout'],
  },
  openings: { color: '#2b4a7a', roles: [] },
};

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

export function cameraBasis({ eye, target, up }) {
  const z = normalize(sub(eye, target));
  const x = normalize(cross(up, z));
  return { x, y: cross(z, x), z };
}

// three's perspective camera: `depth` is distance along the view axis, the
// quantity the capturer's linear depth pass stores.
export function createProjector({ camera, height, width }) {
  const { x, y, z } = cameraBasis(camera);
  const focal = 1 / Math.tan((camera.fov * Math.PI) / 360);
  const aspect = width / height;
  return (point) => {
    const d = sub(point, camera.eye);
    const depth = -dot(d, z);
    return {
      depth,
      x: width / 2 + ((dot(d, x) / depth) * focal * width) / (2 * aspect),
      y: height / 2 - ((dot(d, y) / depth) * focal * height) / 2,
    };
  };
}

function segmentsOf(solid, { lift, scale }) {
  const { edges, points } = localOutline(solid);
  const world = points.map((p) =>
    placePoint(solid, p).map((v, a) => v * scale + (a === 1 ? lift : 0))
  );
  return edges.map(([a, b]) => [world[a], world[b]]);
}

// A plottable twin of a still: every part and opening edge through the same
// camera, with what the render hides removed by `visible` (a depth probe
// from the real renderer). One Inkscape layer per pen.
export default function renderBrutalistSvg({
  camera,
  height,
  stroke = 0.6,
  structure,
  transform,
  visible = null,
  width,
}) {
  const project = createProjector({ camera, height, width });
  const paths = { detail: [], mass: [], openings: [] };
  const penOf = (role) =>
    Object.keys(PENS).find((pen) => PENS[pen].roles.includes(role)) ?? 'mass';

  const inFrame = (p) => p.x >= 0 && p.y >= 0 && p.x <= width && p.y <= height;
  const shows = (p) =>
    p.depth > 0 &&
    inFrame(p) &&
    (!visible || visible(p.x, p.y, p.depth - (p.depth * 0.004 + 1e-3)));

  const trace = (pen, segments) => {
    const projected = segments.flat().map(project);
    const xs = projected.map((q) => q.x);
    const ys = projected.map((q) => q.y);
    const span = Math.hypot(
      Math.max(...xs) - Math.min(...xs),
      Math.max(...ys) - Math.min(...ys)
    );
    if (span < MIN_SPAN_PX) return;
    segments.forEach(([a, b]) => {
      const pa = project(a);
      const pb = project(b);
      const steps = Math.min(
        4000,
        Math.max(1, Math.ceil(Math.hypot(pb.x - pa.x, pb.y - pa.y) / SAMPLE_PX))
      );
      let run = [];
      const flush = () => {
        if (run.length > 1) paths[pen].push(run);
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

  structure.parts.forEach((part) =>
    trace(penOf(part.role), segmentsOf(part, transform))
  );
  structure.cutters.forEach((cutter) =>
    trace('openings', segmentsOf(cutter, transform))
  );

  const fmt = (v) => v.toFixed(1);
  const layers = Object.entries(paths)
    .filter(([, runs]) => runs.length > 0)
    .map(([pen, runs], index) => {
      const d = runs
        .map(
          (run) =>
            `M${fmt(run[0].x)} ${fmt(run[0].y)}${run
              .slice(1)
              .map((p) => `L${fmt(p.x)} ${fmt(p.y)}`)
              .join('')}`
        )
        .join('');
      const { color } = PENS[pen];
      return (
        `<g inkscape:groupmode="layer" inkscape:label="pen-${index} ${pen} ${color}" id="pen-${index}" ` +
        `fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="${d}"/></g>`
      );
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${layers}</svg>`
  );
}
