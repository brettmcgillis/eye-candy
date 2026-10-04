import { rgbToHex, samplePalette } from '@utils/paletteStops';

import { DEG } from './math';
import { paletteCoordinate } from './palette';

const fmt = (v) => Number(v.toFixed(2));
const CIRCLE_SEGMENTS = 128;

function bilinear(values, { aspect, nx, ny }, x, y) {
  const fx = ((x + aspect) / (2 * aspect)) * nx;
  const fy = ((y + 1) / 2) * ny;
  if (fx < 0 || fy < 0 || fx > nx || fy > ny) return null;
  const i = Math.min(Math.floor(fx), nx - 1);
  const j = Math.min(Math.floor(fy), ny - 1);
  const tx = fx - i;
  const ty = fy - j;
  const row = nx + 1;
  const a = values[j * row + i];
  const b = values[j * row + i + 1];
  const c = values[(j + 1) * row + i];
  const d = values[(j + 1) * row + i + 1];
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}

// Each stacked plane is drawn displaced along the stack direction, so the
// front plane hides what is behind its solid: the classic stacked-section
// plot, an oblique view with no camera.
function layerShifts(slice, config) {
  const count = slice.layers.length;
  const step = config.sliceMode === 'stack' ? config.stackShift * 2 : 0;
  const dx = Math.cos(config.stackAngle * DEG) * step;
  const dy = Math.sin(config.stackAngle * DEG) * step;
  return slice.layers.map((_, i) => {
    const k = i - (count - 1) / 2;
    return [k * dx, k * dy];
  });
}

function createVisibility(slice, shifts, config) {
  if (config.sliceMode !== 'stack' || !config.svgOcclusion) {
    return () => true;
  }
  return (index, x, y) => {
    for (let j = index + 1; j < slice.layers.length; j += 1) {
      const s = bilinear(
        slice.layers[j].s,
        slice.grid,
        x + shifts[index][0] - shifts[j][0],
        y + shifts[index][1] - shifts[j][1]
      );
      if (s != null && s < 0) return false;
    }
    return true;
  };
}

// Densify, then cut wherever a point is hidden or leaves the frame.
function splitVisible(points, closed, visible, step) {
  const pts = [];
  const n = points.length / 2;
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i += 1) {
    const ax = points[i * 2];
    const ay = points[i * 2 + 1];
    const b = ((i + 1) % n) * 2;
    const bx = points[b];
    const by = points[b + 1];
    const parts = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let p = 0; p < parts; p += 1) {
      pts.push([ax + ((bx - ax) * p) / parts, ay + ((by - ay) * p) / parts]);
    }
  }
  if (closed) pts.push([points[0], points[1]]);
  else pts.push([points[(n - 1) * 2], points[(n - 1) * 2 + 1]]);

  const runs = [];
  let run = [];
  pts.forEach(([x, y]) => {
    if (visible(x, y)) run.push([x, y]);
    else {
      if (run.length > 1) runs.push(run);
      run = [];
    }
  });
  if (run.length > 1) runs.push(run);
  if (closed && runs.length > 1 && visible(pts[0][0], pts[0][1])) {
    const last = runs.pop();
    runs[0] = [...last, ...runs[0].slice(1)];
  }
  const whole = closed && runs.length === 1 && runs[0].length === pts.length;
  return { closed: whole, runs };
}

function penOf(coordinate, pens) {
  return Math.min(pens - 1, Math.max(0, Math.floor(coordinate * pens)));
}

// The region a hatch fills and the pen it takes: the solid (by colour or
// stack plane) or, for bands, the ring between two kept levels.
function regionPen(slice, layer, config, pens) {
  const count = slice.layers.length;
  if (config.sliceMode === 'bands') {
    const sign = config.bandSide === 'inside' ? -1 : 1;
    const lo = config.bandSide === 'both' ? -(config.bandCount - 1) : 0;
    const rings = config.bandCount - 1 - lo;
    return (x, y) => {
      const s = bilinear(layer.s, slice.grid, x, y);
      if (s == null) return -1;
      const k = Math.floor((sign * s) / config.bandStep);
      if (k < lo || k >= config.bandCount - 1) return -1;
      const t = rings > 0 ? (k - lo) / rings : 0;
      return penOf(paletteCoordinate(t, config), pens);
    };
  }
  const layerT = count > 1 ? layer.index / (count - 1) : 0;
  return (x, y) => {
    const s = bilinear(layer.s, slice.grid, x, y);
    if (s == null || s >= 0) return -1;
    const t =
      config.sliceMode === 'stack'
        ? layerT
        : bilinear(layer.t, slice.grid, x, y);
    return penOf(paletteCoordinate(t, config), pens);
  };
}

function hatchLayer(slice, layer, config, { pens, spacing, visible }) {
  const { aspect, nx, ny } = slice.grid;
  const step = Math.min((2 * aspect) / nx, 2 / ny) * 0.5;
  const penAt = regionPen(slice, layer, config, pens);
  const out = Array.from({ length: pens }, () => []);
  const reach = Math.hypot(aspect, 1);

  for (let pen = 0; pen < pens; pen += 1) {
    const angle = (config.hatchAngle + pen * config.hatchAngleStep) * DEG;
    const d = [Math.cos(angle), Math.sin(angle)];
    const nrm = [-d[1], d[0]];
    const lines = Math.ceil(reach / spacing);
    for (let l = -lines; l <= lines; l += 1) {
      const o = l * spacing;
      let start = null;
      let last = null;
      for (let t = -reach; t <= reach; t += step) {
        const x = nrm[0] * o + d[0] * t;
        const y = nrm[1] * o + d[1] * t;
        const inFrame = Math.abs(x) <= aspect && Math.abs(y) <= 1;
        const filled =
          inFrame && penAt(x, y) === pen && visible(layer.index, x, y);
        if (filled && !start) start = [x, y];
        if (!filled && start) {
          out[pen].push([start, last]);
          start = null;
        }
        if (filled) last = [x, y];
      }
      if (start) out[pen].push([start, last]);
    }
  }
  return out;
}

function lineCoordinate(slice, layer, line, config) {
  const count = slice.layers.length;
  if (config.sliceMode === 'stack') {
    return count > 1 ? layer.index / (count - 1) : 0;
  }
  if (config.sliceMode === 'bands') {
    const lo = config.bandSide === 'both' ? -(config.bandCount - 1) : 0;
    const span = config.bandCount - 1 - lo;
    return span > 0 ? (line.level - lo) / span : 0;
  }
  let sum = 0;
  let n = 0;
  for (let i = 0; i < line.points.length; i += 2) {
    const t = bilinear(layer.t, slice.grid, line.points[i], line.points[i + 1]);
    if (t != null) {
      sum += t;
      n += 1;
    }
  }
  return n > 0 ? sum / n : 0;
}

function circlePoints({ r, x, y }) {
  const pts = new Float32Array(CIRCLE_SEGMENTS * 2);
  for (let i = 0; i < CIRCLE_SEGMENTS; i += 1) {
    const a = (i / CIRCLE_SEGMENTS) * Math.PI * 2;
    pts[i * 2] = x + Math.cos(a) * r;
    pts[i * 2 + 1] = y + Math.sin(a) * r;
  }
  return pts;
}

// The plot of a slice: outlines in one ink, contours one Inkscape layer per
// pen, or the solid hatched one pen (and one angle) per tone. Packing slices
// keep their exact <circle>s wherever nothing hides them. No background — a
// plotter would trace it.
export default function renderApollianSvg({
  config,
  height,
  slice,
  stops,
  stroke = 0.6,
  width,
}) {
  const { aspect } = slice.grid;
  const style = config.svgStyle;
  const pens = style === 'outline' ? 1 : config.svgPens;
  const shifts = layerShifts(slice, config);
  const isVisible = createVisibility(slice, shifts, config);
  const sx = width / (2 * aspect);
  const sy = height / 2;
  const px = ([x, y]) => [(x + aspect) * sx, (1 - y) * sy];
  const step = (2 / height) * 2;
  const groups = Array.from({ length: pens }, () => []);

  slice.layers.forEach((layer) => {
    const [ox, oy] = shifts[layer.index];
    const visible = (x, y) =>
      Math.abs(x + ox) <= aspect &&
      Math.abs(y + oy) <= 1 &&
      isVisible(layer.index, x, y);
    const toPx = ([x, y]) => px([x + ox, y + oy]);

    if (style === 'hatch') {
      const hatched = hatchLayer(slice, layer, config, {
        pens,
        spacing: (config.hatchSpacing * 2) / height,
        visible: isVisible,
      });
      hatched.forEach((segments, pen) =>
        segments.forEach(([a, b]) => {
          const [ax, ay] = toPx(a);
          const [bx, by] = toPx(b);
          groups[pen].push(
            `<path d="M${fmt(ax)} ${fmt(ay)}L${fmt(bx)} ${fmt(by)}"/>`
          );
        })
      );
      return;
    }

    const emit = (points, closed, pen) => {
      const { closed: whole, runs } = splitVisible(
        points,
        closed,
        visible,
        step
      );
      runs.forEach((run) => {
        const d = run
          .map((p, i) => {
            const [x, y] = toPx(p);
            return `${i === 0 ? 'M' : 'L'}${fmt(x)} ${fmt(y)}`;
          })
          .join('');
        groups[pen].push(`<path d="${d}${whole ? 'Z' : ''}"/>`);
      });
    };

    layer.lines.forEach((line) => {
      const pen =
        style === 'outline'
          ? 0
          : penOf(
              paletteCoordinate(
                lineCoordinate(slice, layer, line, config),
                config
              ),
              pens
            );
      emit(line.points, line.closed, pen);
    });

    layer.circles.forEach((circle) => {
      let { t } = circle;
      if (config.sliceMode === 'stack')
        t = lineCoordinate(slice, layer, {}, config);
      if (config.sliceMode === 'bands') {
        t = config.bandCount > 1 ? circle.level / (config.bandCount - 1) : 0;
      }
      const pen =
        style === 'outline' ? 0 : penOf(paletteCoordinate(t, config), pens);
      const points = circlePoints(circle);
      const { closed, runs } = splitVisible(points, true, visible, step);
      if (closed && runs.length === 1) {
        const [cx, cy] = toPx([circle.x, circle.y]);
        groups[pen].push(
          `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(circle.r * sy)}"/>`
        );
      } else {
        emit(points, true, pen);
      }
    });
  });

  const colourOf = (pen) => {
    if (style === 'outline' || !stops) return config.inkColor;
    return rgbToHex(
      samplePalette(stops, (pen + 0.5) / pens, config.paletteExact)
    );
  };
  const strokeWidth = stroke || 0.1;
  const layers = groups
    .map((paths, pen) =>
      paths.length === 0
        ? ''
        : `<g inkscape:groupmode="layer" inkscape:label="pen-${pen + 1}" id="pen-${pen + 1}" fill="none" stroke="${colourOf(pen)}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${stroke ? '' : ' vector-effect="non-scaling-stroke"'}>${paths.join('')}</g>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${layers}</svg>
`;
}
