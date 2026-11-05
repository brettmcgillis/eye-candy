import { rot2 } from './parts';

// Hit regions a control declares in its own coordinates, each bound to the
// signal (or signals) a gesture on it sets. A region is a circle (`r`) or a
// rectangle (`hw`, `hh`) round (`x`, `y`).
export const dial = (signal, x, y, r) => ({ kind: 'rotary', r, signal, x, y });

// A click on a detent with `roll` ({ time, from, at }) also stamps its
// moment into signal `time` and where it was drawn (`at(get, now)`, reading
// the control's signals through `get`) into `from`.
export const detent = (signal, x, y, r, steps, roll = null) => ({
  kind: 'step',
  r,
  signal,
  steps,
  x,
  y,
  ...(roll && { roll }),
});

// A key that always sets its signal to `value` (a station preset): a
// second click leaves it there. With `roll` it stamps like a detent.
export const choose = (signal, x, y, size, value, roll = null) => ({
  kind: 'set',
  signal,
  value,
  x,
  y,
  ...size,
  ...(roll && { roll }),
});

export const press = (signal, x, y, size) => ({
  kind: 'toggle',
  signal,
  x,
  y,
  ...size,
});

// A key that latches: a click sets `value`, a click on it again lets it up.
export const latch = (signal, x, y, size, value = 1) => ({
  kind: 'latch',
  signal,
  value,
  x,
  y,
  ...size,
});

// A button that stamps the moment it was pressed into the next free slot
// of `slots` (each a [time, carry] pair of signals), so a pose can animate
// an event from `t - stamp`. `signal` is the pull the stamp carries away
// and resets.
export const stamp = (signal, slots, x, y, size) => ({
  kind: 'stamp',
  signal,
  slots,
  x,
  y,
  ...size,
});

// A sheet that is pulled out by dragging it down, `span` for the whole
// travel of `signal`; pulling it all the way out and letting go tears it
// off into a stamp slot.
export const pull = (signal, slots, x, y, hw, hh, span) => ({
  hh,
  hw,
  kind: 'pull',
  signal,
  slots,
  span,
  x,
  y,
});

export const slide = (signal, from, to, width) => ({
  from,
  hh: Math.abs(to[1] - from[1]) / 2 + width,
  hw: Math.abs(to[0] - from[0]) / 2 + width,
  kind: 'linear',
  signal,
  to,
  x: (from[0] + to[0]) / 2,
  y: (from[1] + to[1]) / 2,
});

// A touch surface: signals [x, y, touched], x / y in [0, 1] across it.
export const pad = (signals, x, y, hw, hh, grab = null) => ({
  grab,
  hh,
  hw,
  kind: 'pad',
  signals,
  x,
  y,
});

export const stick = (signals, x, y, r) => ({
  kind: 'xy',
  r,
  signals,
  x,
  y,
});

const at = (point, { offset, scale }) => [
  point[0] * scale + offset[0],
  point[1] * scale + offset[1],
];

// A hit moved into panel space with its control's transform.
function unrotatedHit(hit, transform) {
  const { scale } = transform;
  const [x, y] = at([hit.x, hit.y], transform);
  return {
    ...hit,
    ...(hit.r != null && { r: hit.r * scale }),
    ...(hit.hw != null && { hh: hit.hh * scale, hw: hit.hw * scale }),
    ...(hit.grab != null && { grab: hit.grab * scale }),
    ...(hit.span != null && { span: hit.span * scale }),
    ...(hit.from && {
      from: at(hit.from, transform),
      to: at(hit.to, transform),
    }),
    ...(hit.targets && {
      frame: [
        ...at(hit.frame, transform),
        hit.frame[2] * scale,
        hit.frame[3] * scale,
      ],
      targets: hit.targets.map((point) => at(point, transform)),
    }),
    x,
    y,
  };
}

export function unrotateHitPoint(point, { angle, origin }) {
  const [x, y] = rot2(point[0] - origin[0], point[1] - origin[1], -angle);
  return [x + origin[0], y + origin[1]];
}

export function placeHit(hit, transform) {
  const placed = unrotatedHit(hit, transform);
  if (!transform.rotation) return placed;
  const angle = (-transform.rotation * Math.PI) / 180;
  const origin = transform.offset;
  const turn = (point) => {
    const [x, y] = rot2(point[0] - origin[0], point[1] - origin[1], angle);
    return [x + origin[0], y + origin[1]];
  };
  const [x, y] = turn([placed.x, placed.y]);
  return {
    ...placed,
    ...(placed.hw != null &&
      transform.rotation % 180 && { hw: placed.hh, hh: placed.hw }),
    ...(placed.from && { from: turn(placed.from), to: turn(placed.to) }),
    x,
    y,
    unrotated: placed,
    rotation: { angle, origin },
  };
}
