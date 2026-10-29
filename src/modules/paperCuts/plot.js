import { createProjector } from '@modules/plotKit';

import layerColor from './colors';

const EDGES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [4, 5],
  [4, 6],
  [5, 7],
  [6, 7],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

export function paperBoxes(frame, config, expansion = 0) {
  const scale = frame.settings.dataScaleMultiplier;
  return frame.layers.flatMap((layer, z) =>
    layer.map((s) => ({
      center: [
        ...s.position.map((v) => v * scale),
        -z * (config.paperDepth + config.layerGap + expansion) * scale,
      ],
      half: [
        (s.size * scale) / 2,
        (s.size * scale) / 2,
        (config.paperDepth * scale) / 2,
      ],
      layer: z,
    }))
  );
}

function obscures(box, point, origin) {
  let enter = 0;
  let exit = 1 - 1e-5;
  for (let axis = 0; axis < 3; axis += 1) {
    const direction = point[axis] - origin[axis];
    const low = box.center[axis] - box.half[axis];
    const high = box.center[axis] + box.half[axis];
    if (Math.abs(direction) < 1e-10) {
      if (origin[axis] < low || origin[axis] > high) return false;
    } else {
      const a = (low - origin[axis]) / direction;
      const b = (high - origin[axis]) / direction;
      enter = Math.max(enter, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
      if (exit <= enter) return false;
    }
  }
  return exit > enter;
}

export default function renderSvg({
  frame,
  config,
  camera,
  options,
  expansion = 0,
}) {
  const project = createProjector(camera, options.width, options.height);
  const angle = config.rotate ? -Math.PI / 4 : 0;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const world = ([x, y, z]) => [x * c - y * s, x * s + y * c, z];
  const local = ([x, y, z]) => [x * c + y * s, -x * s + y * c, z];
  const boxes = paperBoxes(frame, config, expansion);
  const eye = local(camera.eye);
  const direction = local(camera.eye.map((v, i) => v - camera.target[i]));
  const layers = Array.from({ length: frame.layers.length }, () => []);
  boxes.forEach((box) => {
    const corners = Array.from({ length: 8 }, (_, index) =>
      box.center.map(
        (v, axis) =>
          v + (Math.floor(index / 2 ** axis) % 2 ? 1 : -1) * box.half[axis]
      )
    );
    const edges = options.svgStyle === 'faces' ? EDGES.slice(4, 8) : EDGES;
    edges.forEach(([ai, bi]) => {
      const a = corners[ai];
      const b = corners[bi];
      const pa = project(...world(a));
      const pb = project(...world(b));
      if (Math.hypot(pa.x - pb.x, pa.y - pb.y) < 0.01) return;
      const samples = Math.max(
        1,
        Math.ceil(Math.hypot(pa.x - pb.x, pa.y - pb.y))
      );
      let run = [];
      const flush = () => {
        if (run.length > 1)
          layers[box.layer].push(
            `M${[run[0], run[run.length - 1]].map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('L')}`
          );
        run = [];
      };
      for (let i = 0; i <= samples; i += 1) {
        const point = a.map((v, axis) => v + ((b[axis] - v) * i) / samples);
        const origin =
          camera.projection === 'orthographic'
            ? point.map((v, axis) => v + direction[axis])
            : eye;
        if (
          options.svgOcclusion &&
          boxes.some((other) => obscures(other, point, origin))
        )
          flush();
        else run.push(project(...world(point)));
      }
      flush();
    });
  });
  const paths = layers
    .map(
      (runs, i) =>
        `<g inkscape:groupmode="layer" inkscape:label="pen-${i} paper ${i + 1} ${options.svgStyle ?? 'edges'}" id="paper-${i}" stroke="${options.svgColors > 0 ? layerColor(config, i, layers.length) : '#171717'}"><path d="${runs.join('')}"/></g>`
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}" fill="none" stroke-width="${options.svgStroke || 0.1}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}
