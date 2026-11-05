import { unrotateHitPoint } from './hits';

const DRAG_TURNS = 3;
const CLICK_SLOP = 0.04;

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const keyOf = (hit, signal) => `${hit.control}:${signal}`;

// The value of a stamp slot nothing has written to. A stamp holds the clock
// reading of a moment (a tear), so a pose can animate from `t - stamp`.
export const STAMP_NONE = -1e9;

// What a stamp writes: the clock into the next slot (an empty one, else the
// oldest), the sheet's pull into that slot's second signal so the piece
// that came off keeps its shape, and the pull back to nothing.
function stampSet(hit, read, now) {
  const times = hit.slots.map(([time]) => read(keyOf(hit, time)));
  const empty = times.findIndex((v) => v <= STAMP_NONE / 2);
  const [time, carry] =
    hit.slots[empty >= 0 ? empty : times.indexOf(Math.min(...times))];
  return {
    [keyOf(hit, time)]: now,
    [keyOf(hit, carry)]: read(keyOf(hit, hit.signal)),
    [keyOf(hit, hit.signal)]: 0,
  };
}

// A rolling hit also stamps when it happened and where the control was
// drawn, so a pose can carry it on from there.
function rolled(hit, read, now) {
  if (!hit.roll) return {};
  const get = (signal) => read(keyOf(hit, signal));
  return {
    [keyOf(hit, hit.roll.from)]: hit.roll.at(get, now),
    [keyOf(hit, hit.roll.time)]: now,
  };
}

const contains = (hit, x, y) =>
  hit.r != null
    ? Math.hypot(x - hit.x, y - hit.y) <= hit.r
    : Math.abs(x - hit.x) <= hit.hw && Math.abs(y - hit.y) <= hit.hh;

const areaOf = (hit) =>
  hit.r != null ? Math.PI * hit.r ** 2 : 4 * hit.hw * hit.hh;

// The control under a panel-space point: the smallest region holding it, so
// a black key wins over the white key it sits on.
// A hit that `requires` another of its control's signals above a level
// (a guarded switch needs its lid up) is only there when `read` says so.
const reachable = (hit, read) =>
  !hit.requires ||
  !read ||
  read(keyOf(hit, hit.requires.signal)) > hit.requires.above;

export function pickHit(panel, x, y, read = null) {
  let best = null;
  panel.hits.forEach((hit) => {
    if (
      contains(hit, x, y) &&
      reachable(hit, read) &&
      (!best || areaOf(hit) < areaOf(best))
    ) {
      best = hit;
    }
  });
  return best;
}

function along(hit, [x, y]) {
  const dx = hit.to[0] - hit.from[0];
  const dy = hit.to[1] - hit.from[1];
  const length2 = dx * dx + dy * dy || 1;
  return clamp01(((x - hit.from[0]) * dx + (y - hit.from[1]) * dy) / length2);
}

// A drag of a dial: up or right turns it up, DRAG_TURNS radii for the sweep.
const turned = (gesture, [x, y]) =>
  clamp01(
    gesture.from +
      (x - gesture.start[0] + (y - gesture.start[1])) /
        ((gesture.hit.r ?? gesture.hit.hh) * DRAG_TURNS)
  );

// Where a point sits on a pad, each axis in [0, 1].
const onPad = (hit, [x, y]) => [
  clamp01((x - hit.x + hit.hw) / (2 * hit.hw)),
  clamp01((y - hit.y + hit.hh) / (2 * hit.hh)),
];

function touched(hit, point, on) {
  const [px, py, touch] = hit.signals.map((s) => keyOf(hit, s));
  const [u, v] = onPad(hit, point);
  return { [px]: u, [py]: v, ...(on !== undefined && { [touch]: on }) };
}

// A pad's touch point in panel space, where its cursor is drawn.
const cursorOf = (hit, read) => {
  const [px, py] = hit.signals.map((s) => read(keyOf(hit, s)));
  return [hit.x - hit.hw + px * 2 * hit.hw, hit.y - hit.hh + py * 2 * hit.hh];
};

const quantize = (v, steps) => Math.round(v * (steps - 1)) / (steps - 1);

// What pressing `hit` at `point` sets (signal key → value, null hands the
// signal back to its automation), and the gesture a drag continues.
// `read(key)` is the signal's value right now.
function pressUnrotatedHit(hit, point, read, now = 0) {
  const key = keyOf(hit, hit.signal);
  const gesture = { hit, moved: false, read, start: point };
  switch (hit.kind) {
    case 'stamp':
      return { gesture: null, set: stampSet(hit, read, now) };
    case 'set':
      return {
        gesture: null,
        set: { [key]: hit.value, ...rolled(hit, read, now) },
      };
    case 'toggle':
      return { gesture: null, set: { [key]: read(key) > 0.5 ? 0 : 1 } };
    case 'latch':
      return {
        gesture: null,
        set: { [key]: Math.abs(read(key) - hit.value) < 1e-6 ? 0 : hit.value },
      };
    case 'linear':
      return { gesture, set: { [key]: along(hit, point) } };
    case 'pad': {
      const [cx, cy] = cursorOf(hit, read);
      const on = read(keyOf(hit, hit.signals[2])) > 0.5;
      if (
        on &&
        hit.grab &&
        Math.hypot(point[0] - cx, point[1] - cy) <= hit.grab
      )
        return {
          gesture: null,
          set: Object.fromEntries(
            hit.signals.map((s) => [keyOf(hit, s), null])
          ),
        };
      return { gesture, set: touched(hit, point, 1) };
    }
    case 'ball':
    case 'xy':
      return {
        gesture: {
          ...gesture,
          from: hit.signals.map((s) => read(keyOf(hit, s))),
        },
        set: {},
      };
    default:
      return { gesture: { ...gesture, from: read(key) }, set: {} };
  }
}

export function pressHit(hit, point, read, now = 0) {
  if (!hit.rotation) return pressUnrotatedHit(hit, point, read, now);
  const result = pressUnrotatedHit(
    { ...hit.unrotated, control: hit.control },
    unrotateHitPoint(point, hit.rotation),
    read,
    now
  );
  if (result.gesture) result.gesture.rotation = hit.rotation;
  return result;
}

export function dragHit(gesture, position, delta = 1 / 60) {
  const point = gesture.rotation
    ? unrotateHitPoint(position, gesture.rotation)
    : position;
  const { hit } = gesture;
  const key = keyOf(hit, hit.signal);
  const travel = Math.hypot(
    point[0] - gesture.start[0],
    point[1] - gesture.start[1]
  );
  // eslint-disable-next-line no-param-reassign
  if (travel > CLICK_SLOP * (hit.r ?? 1)) gesture.moved = true;
  switch (hit.kind) {
    case 'rotary':
      return { [key]: turned(gesture, point) };
    case 'step':
      return gesture.moved
        ? { [key]: quantize(turned(gesture, point), hit.steps) }
        : {};
    case 'linear':
      return { [key]: along(hit, point) };
    case 'pull': {
      // eslint-disable-next-line no-param-reassign
      gesture.pulled = clamp01(
        gesture.from + (gesture.start[1] - point[1]) / hit.span
      );
      return { [key]: gesture.pulled };
    }
    case 'pad':
      return touched(hit, point);
    case 'ball': {
      const values = hit.signals.map(
        (signal, i) =>
          gesture.from[i] + (point[i] - gesture.start[i]) / (hit.r * 3)
      );
      const previous = gesture.previous ?? gesture.from;
      // eslint-disable-next-line no-param-reassign
      gesture.velocity = values.map((v, i) =>
        Math.max(-8, Math.min(8, (v - previous[i]) / Math.max(delta, 0.008)))
      );
      // eslint-disable-next-line no-param-reassign
      gesture.previous = values;
      return Object.fromEntries(
        hit.signals.map((signal, i) => [keyOf(hit, signal), values[i]])
      );
    }
    case 'xy': {
      const [a, b] = hit.signals.map((s) => keyOf(hit, s));
      return {
        [a]: clamp01(gesture.from[0] + (point[0] - gesture.start[0]) / hit.r),
        [b]: clamp01(gesture.from[1] + (point[1] - gesture.start[1]) / hit.r),
      };
    }
    default:
      return {};
  }
}

// A click on a detent steps it on (wrapping). Everything else a hand sets
// stays set until Release Controls.
export function releaseHit(gesture, now = 0) {
  const { hit } = gesture;
  const key = keyOf(hit, hit.signal);
  if (hit.kind === 'pull' && gesture.pulled >= 1)
    return stampSet(hit, gesture.read, now);
  if (hit.kind === 'step' && !gesture.moved) {
    const index = Math.round(gesture.from * (hit.steps - 1)) + 1;
    const set = { [key]: (index % hit.steps) / (hit.steps - 1) };
    return { ...set, ...rolled(hit, gesture.read, now) };
  }
  return {};
}
