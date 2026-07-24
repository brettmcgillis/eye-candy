// Pure math for the Gravity Rooms preset: one shared ball, confined to the
// union of every alive window's rect, whose gravity direction switches to
// whichever window's rect currently contains it. Deliberately point-based
// (not a grid, unlike utils/fluidWorld.js's FLIP solver) — a single rigid
// body doesn't need a pressure field, just per-axis collision against the
// window rects it's currently inside.

export function gravityVector(angleDeg, strength) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(rad) * strength, y: Math.sin(rad) * strength };
}

// Screen-space rect containment, shrunk by `inset` on every side — passing
// the ball radius as inset means the ball's edge collides with a room's
// walls, not its center.
function containsPoint(rect, x, y, inset) {
  return (
    x >= rect.x + inset &&
    x <= rect.x + rect.w - inset &&
    y >= rect.y + inset &&
    y <= rect.y + rect.h - inset
  );
}

// min > max happens when a room is narrower/shorter than 2×radius (a tiny
// or heavily-resized window) — split the difference instead of producing a
// clamp with no valid range.
function clamp(value, min, max) {
  if (min > max) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

// Which alive window currently "owns" the ball for gravity purposes: the
// one whose rect contains its center. Sticks with the previous room when
// the ball isn't inside any rect for a frame (e.g. a window resize shrinks
// the room out from under it) rather than dropping to some default.
export function findRoom(windows, x, y, prevRoomId) {
  const hit = windows.find((win) => containsPoint(win, x, y, 0));
  if (hit) return hit;
  return windows.find((win) => win.id === prevRoomId) ?? windows[0] ?? null;
}

// Integrates one axis at a time so a bounce off one wall doesn't also kill
// the other axis's motion in the same step — same trick as fluidWorld's
// confineToMask, applied to a single point instead of a particle field.
// `room` is the ball's last-known-good room (from findRoom) — windows are
// user-draggable, so a room's walls can shift out from under the ball
// between frames with no in-bounds move for the per-axis tests to accept;
// without a fallback the ball would freeze wherever that left it, outside
// every current rect and invisible in every window ("dropped into
// nowhere"). The final inAnyRoom check below catches that (plus the
// documented diagonal-corner-tunneling case on non-rectangular unions) and
// snaps back into `room` instead.
export function stepBall(
  ball,
  room,
  windows,
  dt,
  { gravity, radius, restitution }
) {
  let { x, y } = ball;
  let vx = ball.vx + gravity.x * dt;
  let vy = ball.vy + gravity.y * dt;

  const inAnyRoom = (px, py) =>
    windows.some((win) => containsPoint(win, px, py, radius));

  const nextX = x + vx * dt;
  if (inAnyRoom(nextX, y)) {
    x = nextX;
  } else {
    vx *= -restitution;
  }

  const nextY = y + vy * dt;
  if (inAnyRoom(x, nextY)) {
    y = nextY;
  } else {
    vy *= -restitution;
  }

  if (!inAnyRoom(x, y) && room) {
    x = clamp(x, room.x + radius, room.x + room.w - radius);
    y = clamp(y, room.y + radius, room.y + room.h - radius);
    vx = 0;
    vy = 0;
  }

  return { vx, vy, x, y };
}
