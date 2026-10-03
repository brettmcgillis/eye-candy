import { rgbToHex } from '@utils/paletteStops';

import { createPainter, randomTone } from './palette';

const SAMPLE_PX = 1.5;
const CIRCLE_STEPS = 96;
const FILLET = 0.12;

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
// quantity the capturer's linear depth pass stores.
export function createProjector({ camera, height, width }) {
  const z = normalize(sub(camera.eye, camera.target));
  const x = normalize(cross(camera.up, z));
  const y = cross(z, x);
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

// Pens are the palette's own stops (a smooth gradient snaps to its nearest)
// or a target's own colour, one Inkscape layer each. Line work is sampled in
// world space and dropped wherever the depth pass says something is nearer.
export default function renderShoveSvg({
  bodies,
  camera,
  config,
  height,
  layout,
  outlines,
  stops,
  stroke = 0.6,
  visible = null,
  width,
  wires,
}) {
  const project = createProjector({ camera, height, width });
  const paint = createPainter({ ...config, paletteExact: true }, stops);
  const pens = new Map();

  const penFor = (role, rgb) => {
    const hex = rgbToHex(rgb);
    const key = `${role} ${hex}`;
    if (!pens.has(key)) pens.set(key, { hex, paths: [], role });
    return pens.get(key);
  };

  // `lift` pulls a centreline toward the camera to the surface it bounds, so
  // the depth test compares like with like.
  function trace(points, { lift = 0, penAt }) {
    let run = [];
    let pen = null;
    const flush = () => {
      if (run.length > 1) pen.paths.push(run);
      run = [];
    };
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const pa = project(a);
      const pb = project(b);
      const steps = Math.max(
        1,
        Math.ceil(Math.hypot(pb.x - pa.x, pb.y - pa.y) / SAMPLE_PX)
      );
      for (let s = i === 0 ? 0 : 1; s <= steps; s += 1) {
        const t = s / steps;
        const world = a.map((v, k) => v + (b[k] - v) * t);
        const p = project(world);
        const next = penAt(i + t, world);
        if (next !== pen) {
          if (run.length > 0) run.push(p);
          flush();
          pen = next;
        }
        if (p.depth > 0 && (!visible || visible(p.x, p.y, p.depth - lift))) {
          run.push(p);
        } else {
          flush();
        }
      }
    }
    flush();
  }

  const rimZ = -Math.min(config.panelBevel, config.panelThickness * 0.5);
  const rimPen = penFor(
    'rim',
    paint(config.paintPanelRim, config.panelColor, config.rimTone)
  );
  outlines.forEach((line) => {
    trace(
      line.map(([x, y]) => [x, y, rimZ]),
      { penAt: () => rimPen }
    );
  });

  const { pointsPerWire, wireCount } = layout;
  for (let w = 0; w < wireCount; w += 1) {
    const points = Array.from({ length: pointsPerWire }, (_, t) => {
      const i = (w * pointsPerWire + t) * 4;
      return [wires[i], wires[i + 1], wires[i + 2]];
    });
    const pen = penFor(
      'wires',
      paint(
        config.paintWires,
        config.wireColor,
        randomTone(w, config.paletteSeed)
      )
    );
    trace(points, { lift: layout.collideRadius * 1.05, penAt: () => pen });
  }

  const cylinderPen = penFor(
    'cylinders',
    paint(config.paintCylinders, config.cylinderColor, config.cylinderTone)
  );
  for (let c = 0; c < bodies.length / 4; c += 1) {
    const [cx, cy, , radius] = bodies.slice(c * 4, c * 4 + 4);
    if (radius > 0) {
      const z = layout.zFront - radius * FILLET;
      const ring = Array.from({ length: CIRCLE_STEPS + 1 }, (_, s) => {
        const a = (s / CIRCLE_STEPS) * Math.PI * 2;
        return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, z];
      });
      trace(ring, { penAt: () => cylinderPen });
    }
  }

  const fmt = (v) => v.toFixed(1);
  const layersSvg = [...pens.values()]
    .filter((pen) => pen.paths.length > 0)
    .sort((a, b) => b.paths.length - a.paths.length)
    .map((pen, index) => {
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
        `<g inkscape:groupmode="layer" inkscape:label="pen-${index} ${pen.role} ${pen.hex}" id="pen-${index}" ` +
        `fill="none" stroke="${pen.hex}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="${d}"/></g>`
      );
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${layersSvg}</svg>`
  );
}
