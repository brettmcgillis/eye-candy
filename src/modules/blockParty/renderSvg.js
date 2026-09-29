import { PIXEL_RISE } from './elevation';
import { cellColor } from './palette';

const TWO_PI = Math.PI * 2;
const TOWER_RAMP = 0.75;
const RING_COUNT = 10;
const RIM_SEGMENTS = 128;
const SAMPLE_PX = 1.5;
const NEON_SLOT_KEYS = ['neonMagentaColor', 'neonCyanColor', 'neonAmberColor'];

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize(v) {
  const length = Math.hypot(...v) || 1;
  return v.map((c) => c / length);
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

// three's orthographic camera: world units per output pixel are fixed, and
// depth is distance in front of the eye plane.
export function createOrthoProjector({ camera, height, width }) {
  const { eye, halfHeight, halfWidth, target, up } = camera;
  const z = normalize(sub(eye, target));
  const x = normalize(cross(up, z));
  const y = cross(z, x);

  return (point) => {
    const d = sub(point, eye);
    return {
      depth: -dot(d, z),
      x: width / 2 + (dot(d, x) / halfWidth) * (width / 2),
      y: height / 2 - (dot(d, y) / halfHeight) * (height / 2),
    };
  };
}

function wave(seed, time, rate) {
  return Math.sin(time * rate + seed * TWO_PI);
}

function boxCorners(box, hangs) {
  const [cx, anchor, cz, w, h, d] = box;
  const bottom = hangs ? anchor - h : anchor;
  const top = hangs ? anchor : anchor + h;
  return {
    bottom,
    maxX: cx + w / 2,
    maxZ: cz + d / 2,
    minX: cx - w / 2,
    minZ: cz - d / 2,
    top,
  };
}

function rectLoop({ maxX, maxZ, minX, minZ }, y) {
  return [
    [minX, y, minZ],
    [maxX, y, minZ],
    [maxX, y, maxZ],
    [minX, y, maxZ],
    [minX, y, minZ],
  ];
}

function boxEdges(corners) {
  const { bottom, maxX, maxZ, minX, minZ, top } = corners;
  const verticals = [
    [minX, minZ],
    [maxX, minZ],
    [maxX, maxZ],
    [minX, maxZ],
  ].map(([x, z]) => [
    [x, bottom, z],
    [x, top, z],
  ]);
  return [rectLoop(corners, bottom), rectLoop(corners, top), ...verticals];
}

// The reference strokes a tower once per pixel of height at alpha
// pow((i / tot) * 0.75, 2). A pen has no alpha, so a ring is laid each time
// that alpha accumulates to a whole stroke.
function towerRings(corners, height, ink) {
  const strokes = Math.max(1, Math.round(height / PIXEL_RISE));
  const rings = [];
  let carried = 0;

  for (let i = 0; i < strokes; i += 1) {
    carried += Math.min(1, ((i / strokes) * TOWER_RAMP) ** 2 * ink);
    if (carried >= 1) {
      carried -= 1;
      rings.push(rectLoop(corners, corners.bottom + (height * i) / strokes));
    }
  }
  return rings;
}

function strataLines(corners, layers, layerDepth) {
  const lines = [];
  for (let i = 1; i < layers; i += 1) {
    if (0.8 - (i - 1) / RING_COUNT <= 0) break;
    lines.push(rectLoop(corners, corners.top - i * layerDepth));
  }
  return lines;
}

function rimLoop(shape, radius, y) {
  if (shape !== 'circle') {
    return rectLoop(
      { maxX: radius, maxZ: radius, minX: -radius, minZ: -radius },
      y
    );
  }
  return Array.from({ length: RIM_SEGMENTS + 1 }, (_, i) => {
    const angle = (i / RIM_SEGMENTS) * TWO_PI;
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
  });
}

function pedestalLines({ depth, radius, shape, viewDirection }) {
  const lines = [rimLoop(shape, radius, 0), rimLoop(shape, radius, -depth)];
  if (shape === 'circle') {
    const side = normalize([viewDirection[2], 0, -viewDirection[0]]);
    [1, -1].forEach((sign) => {
      const x = side[0] * radius * sign;
      const z = side[2] * radius * sign;
      lines.push([
        [x, 0, z],
        [x, -depth, z],
      ]);
    });
    return lines;
  }
  [
    [-radius, -radius],
    [radius, -radius],
    [radius, radius],
    [-radius, radius],
  ].forEach(([x, z]) =>
    lines.push([
      [x, 0, z],
      [x, -depth, z],
    ])
  );
  return lines;
}

function createPens() {
  const pens = new Map();
  return {
    add(color, polyline) {
      if (!pens.has(color)) pens.set(color, []);
      pens.get(color).push(polyline);
    },
    entries: () => [...pens.entries()],
  };
}

// A plottable twin of a still: the settled city's edges projected through the
// same orthographic camera, with what the render hides removed by `visible`
// (a depth probe from the real renderer). One Inkscape layer per colour.
export default function renderBlockPartySvg({
  camera,
  colors,
  config,
  height,
  layers,
  pedestal,
  scale,
  stops,
  stroke = 0.6,
  time = 0,
  visible = null,
  width,
}) {
  const project = createOrthoProjector({ camera, height, width });
  const viewDirection = normalize(sub(camera.eye, camera.target));
  const depthTolerance = pedestal.radius * scale * 0.01;
  const pens = createPens();
  const cells = stops ? config.colorTarget : 'none';
  const tints = {
    accents: ['accents', 'all'].includes(cells),
    cards: ['cards', 'all'].includes(cells),
    towers: ['towers', 'all'].includes(cells),
  };
  const ink = config.postInkColor ?? '#000000';
  const tint = (item, target, fallback) =>
    tints[target] ? cellColor(stops, item.tone, config) : fallback;

  pedestalLines({ ...pedestal, viewDirection }).forEach((line) =>
    pens.add(ink, line)
  );

  const each = (key, fn) => (layers[key] ?? []).forEach(fn);

  each('plazas', (item) => {
    const lift = config.cardBob * wave(item.seed, time, config.cardBobRate);
    const box = [...item.box];
    box[1] += lift;
    boxEdges(boxCorners(box)).forEach((line) =>
      pens.add(tint(item, 'cards', ink), line)
    );
  });

  each('neon', (item) => {
    const box = [...item.box];
    box[1] += config.cardBob * wave(item.seed, time, config.cardBobRate);
    const corners = boxCorners(box);
    pens.add(
      tint(item, 'accents', colors[NEON_SLOT_KEYS[item.info[2]]]),
      rectLoop(corners, corners.top)
    );
  });

  each('towers', (item) => {
    const breathe =
      1 + config.towerBreathe * wave(item.seed, time, config.towerBreatheRate);
    const box = [...item.box];
    box[4] *= breathe;
    const corners = boxCorners(box);
    const pen = tint(item, 'towers', colors.towerColor);
    boxEdges(corners).forEach((line) => pens.add(pen, line));
    towerRings(corners, box[4], config.towerInk).forEach((line) =>
      pens.add(pen, line)
    );
  });

  const shaft = (item, glow) => {
    const corners = boxCorners(item.box, true);
    const layerDepth = item.box[4] / Math.max(item.info[0], 1);
    boxEdges(corners).forEach((line) => pens.add(ink, line));
    let strata = null;
    if (glow) strata = tint(item, 'accents', colors.ringColor);
    else if (config.pitStrataStrength > 0) strata = colors.pitStrataColor;
    if (strata) {
      strataLines(corners, item.info[0], layerDepth).forEach((line) =>
        pens.add(strata, line)
      );
    }
  };
  each('pits', (item) => shaft(item, false));
  each('glowPits', (item) => shaft(item, true));

  ['terraces', 'glowTerraces', 'steps', 'taperWalls'].forEach((key) =>
    each(key, (item) =>
      boxEdges(boxCorners(item.box)).forEach((line) => pens.add(ink, line))
    )
  );
  each('wells', (item) =>
    boxEdges(boxCorners(item.box, true)).forEach((line) => pens.add(ink, line))
  );

  const toWorld = (point) => point.map((v) => v * scale);
  const inFrame = (p) => p.x >= 0 && p.y >= 0 && p.x <= width && p.y <= height;
  const shows = (p) =>
    inFrame(p) && (!visible || visible(p.x, p.y, p.depth - depthTolerance));

  const layersSvg = pens
    .entries()
    .map(([color, polylines], index) => {
      const paths = [];
      polylines.forEach((polyline) => {
        let run = [];
        const flush = () => {
          if (run.length > 1) paths.push(run);
          run = [];
        };
        for (let i = 0; i < polyline.length - 1; i += 1) {
          const a = project(toWorld(polyline[i]));
          const b = project(toWorld(polyline[i + 1]));
          const steps = Math.max(
            1,
            Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / SAMPLE_PX)
          );
          for (let s = i === 0 ? 0 : 1; s <= steps; s += 1) {
            const t = s / steps;
            const p = {
              corner: s === steps,
              depth: a.depth + (b.depth - a.depth) * t,
              x: a.x + (b.x - a.x) * t,
              y: a.y + (b.y - a.y) * t,
            };
            if (shows(p)) run.push(p);
            else flush();
          }
        }
        flush();
      });
      if (paths.length === 0) return '';
      const d = paths
        .map((points) =>
          points
            .filter((p, k) => k === 0 || k === points.length - 1 || p.corner)
            .map(
              (p, k) =>
                `${k === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`
            )
            .join('')
        )
        .join('');
      return (
        `<g inkscape:groupmode="layer" inkscape:label="pen-${index} ${color}" id="pen-${index}" ` +
        `fill="none" stroke="${color}" stroke-width="${stroke > 0 ? stroke : 0.25}" ` +
        `stroke-linecap="round" stroke-linejoin="round"${stroke > 0 ? '' : ' vector-effect="non-scaling-stroke"'}>` +
        `<path d="${d}"/></g>`
      );
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${layersSvg}</svg>`
  );
}
