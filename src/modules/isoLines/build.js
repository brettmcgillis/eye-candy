import traceContours, { bandHeight } from './contours';
import createField, { gridSize, sampleColors, sampleGrid } from './field';
import { FIELD, IMAGE } from './optionSpecs.mjs';

// One wall or line segment: ends, the miters at each end (unit-ish, scaled
// by the thickness in the rig), the heights it spans as shares of the
// relief, the level it colours by, and its alpha.
export const SEGMENT_FLOATS = 12;
const MITER_LIMIT = 0.3;

const TRAIL_KEYS = [
  ...Object.keys(FIELD),
  ...Object.keys(IMAGE),
  'levels',
  'levelOffset',
  'resolution',
  'trailSlices',
  'trailSeconds',
];

const keyOf = (config, keys) => keys.map((key) => config[key]).join('|');

function miters(points, closed) {
  const n = points.length / 2;
  const out = new Float32Array(points.length);
  const normalOf = (a, b) => {
    const dx = points[b * 2] - points[a * 2];
    const dy = points[b * 2 + 1] - points[a * 2 + 1];
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  };
  for (let i = 0; i < n; i += 1) {
    const hasPrev = closed || i > 0;
    const hasNext = closed || i < n - 1;
    const prev = hasPrev ? normalOf((i - 1 + n) % n, i) : null;
    const next = hasNext ? normalOf(i, (i + 1) % n) : null;
    let m = prev ?? next;
    if (prev && next) {
      const sx = prev[0] + next[0];
      const sy = prev[1] + next[1];
      const l = Math.hypot(sx, sy);
      if (l > 1e-6) {
        const unit = [sx / l, sy / l];
        const scale =
          1 / Math.max(unit[0] * next[0] + unit[1] * next[1], MITER_LIMIT);
        m = [unit[0] * scale, unit[1] * scale];
      }
    }
    [out[i * 2], out[i * 2 + 1]] = m;
  }
  return out;
}

function segmentCount(lines) {
  return lines.reduce(
    (sum, line) => sum + line.points.length / 2 - (line.closed ? 0 : 1),
    0
  );
}

// `slices` are [{ lines, z }]; z overrides the level heights (a trail's
// time).
function packSegments(slices, mode, config) {
  const count = slices.reduce((sum, s) => sum + segmentCount(s.lines), 0);
  const data = new Float32Array(Math.max(count, 1) * SEGMENT_FLOATS);
  let o = 0;
  slices.forEach(({ lines, z = null }) => {
    lines.forEach(({ closed, k, level, points }) => {
      const n = points.length / 2;
      const m = mode === 'walls' ? null : miters(points, closed);
      const zHigh = z ?? bandHeight(k, config);
      const zLow = mode === 'walls' ? bandHeight(k - 1, config) : zHigh;
      const last = closed ? n : n - 1;
      for (let i = 0; i < last; i += 1) {
        const a = i;
        const b = (i + 1) % n;
        data[o] = points[a * 2];
        data[o + 1] = points[a * 2 + 1];
        data[o + 2] = points[b * 2];
        data[o + 3] = points[b * 2 + 1];
        if (m) {
          data[o + 4] = m[a * 2];
          data[o + 5] = m[a * 2 + 1];
          data[o + 6] = m[b * 2];
          data[o + 7] = m[b * 2 + 1];
        }
        data[o + 8] = zLow;
        data[o + 9] = zHigh;
        data[o + 10] = level;
        data[o + 11] = 1;
        o += SEGMENT_FLOATS;
      }
    });
  });
  return { count, data };
}

// The field and everything drawn from it at one moment. `mode` asks for
// segment geometry: 'walls' (a terrace step per contour segment), 'lines'
// (a box per segment, mitred) or 'trail' (lines through time); null for
// none. Stateful only for
// the time extrude: each past slice is the field at its own tick, traced
// once and handed over once (`trail.slices`), while the field's settings
// hold — so a webcam's trail is the history of what the camera saw. A trail
// segment's heights hold the time it was traced at; the rig ages it.
export default function createIsoBuilder() {
  let trailKey = null;
  let sent = new Set();

  function trailOf(config, time, ctx) {
    const key = `${keyOf(config, TRAIL_KEYS)}|${ctx.grid.aspect}`;
    const reset = key !== trailKey;
    if (reset) {
      trailKey = key;
      sent = new Set();
    }
    const head = Math.floor(time / config.trailSeconds);
    const oldest = head - (config.trailSlices - 2);
    const slices = [];
    for (let tick = head; tick >= oldest; tick -= 1) {
      if (!sent.has(tick)) {
        sent.add(tick);
        const at = tick * config.trailSeconds;
        const values = sampleGrid(ctx.field, { ...ctx.grid, time: at });
        const lines = traceContours(values, ctx.grid, config);
        slices.push({
          segments: packSegments([{ lines, z: at }], 'trail', config),
          tick,
        });
      }
    }
    sent.forEach((tick) => {
      if (tick < oldest) sent.delete(tick);
    });
    return { oldest, reset, slices };
  }

  return {
    build(
      config,
      { aspect, image = null, mode = null, time = 0, withLines = false }
    ) {
      const { nx, ny } = gridSize(config, aspect);
      const grid = { aspect, nx, ny };
      const field = createField(config, { aspect, image });
      const values = sampleGrid(field, { ...grid, time });
      const colors = config.imageColor > 0 ? sampleColors(field, grid) : null;
      const lines =
        mode || withLines ? traceContours(values, grid, config) : null;
      const segments = mode
        ? packSegments(
            [{ lines, z: mode === 'trail' ? time : null }],
            mode,
            config
          )
        : null;
      const trail =
        mode === 'trail' ? trailOf(config, time, { field, grid }) : null;

      return {
        aspect,
        colors,
        lines,
        mode,
        nx,
        ny,
        segments,
        time,
        trail,
        values,
      };
    },
  };
}
