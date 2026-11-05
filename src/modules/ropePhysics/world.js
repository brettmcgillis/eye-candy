/* eslint-disable no-continue */
import { collideRopes } from './contact';
import createRopeHand from './hand';
import createSolidContacts from './solids';

export const ROPE_TICK = 1 / 120;
const MAX_MOVE = 0.018;

export default function createRopeWorld(
  descriptions,
  {
    floor = -6,
    boxes = [],
    iterations = 8,
    gravity = [0, -9.81, 0],
    damping = 0.985,
    bending = 0.12,
    minCellSize = 0.1,
  } = {}
) {
  let count = 0;
  const ropes = descriptions.map((description) => {
    const nodes = description.points.length / 3;
    const rope = {
      start: count,
      count: nodes,
      radius: description.radius,
      length: description.length,
    };
    count += nodes;
    return rope;
  });
  const positions = new Float64Array(count * 3);
  const previous = new Float64Array(count * 3);
  const mass = new Float64Array(count).fill(1);
  const radii = new Float64Array(count);
  const owners = new Int32Array(count);
  const segments = new Int32Array(Math.max(0, count - ropes.length) * 2);
  const rests = new Float64Array(segments.length / 2);
  let segment = 0;
  let longest = minCellSize;
  ropes.forEach((rope, id) => {
    positions.set(descriptions[id].points, rope.start * 3);
    for (let i = 0; i < rope.count; i += 1) {
      const k = rope.start + i;
      owners[k] = id;
      radii[k] =
        i < 2 || i >= rope.count - 2
          ? Math.max(
              rope.radius,
              descriptions[id].endRadii?.[i < 2 ? 0 : 1] ?? rope.radius
            )
          : rope.radius;
      if (i < 2 || i >= rope.count - 2) mass[k] = 0.3;
      if (i + 1 < rope.count) {
        segments[segment * 2] = k;
        segments[segment * 2 + 1] = k + 1;
        rests[segment] = rope.length / (rope.count - 1);
        longest = Math.max(longest, rests[segment] + rope.radius * 2);
        segment += 1;
      }
    }
  });
  previous.set(positions);
  const anchors = new Map();
  const world = {
    positions,
    previous,
    mass,
    radii,
    owners,
    ropes,
    segments,
    cellSize: longest * 2,
    heads: new Int32Array(16384),
    next: new Int32Array(segment),
    cells: new Int32Array(segment * 3),
    contact: new Float64Array(5),
    oldContact: new Float64Array(5),
  };
  const hand = createRopeHand(world, anchors);
  let accumulator = 0;
  let sleeping = count === 0;
  let quiet = 0;

  function constrain(a, b, rest, stiffness) {
    const w = mass[a] + mass[b];
    if (!w) return;
    const x = positions[b * 3] - positions[a * 3];
    const y = positions[b * 3 + 1] - positions[a * 3 + 1];
    const z = positions[b * 3 + 2] - positions[a * 3 + 2];
    const distance = Math.hypot(x, y, z) || 1e-9;
    const change = (((distance - rest) / distance) * stiffness) / w;
    for (let axis = 0; axis < 3; axis += 1) {
      const d = positions[b * 3 + axis] - positions[a * 3 + axis];
      positions[a * 3 + axis] += d * change * mass[a];
      positions[b * 3 + axis] -= d * change * mass[b];
    }
  }

  let collideSolids = createSolidContacts(world, boxes, floor);

  function tick() {
    if (sleeping) return;
    let movement = 0;
    for (let k = 0; k < count; k += 1) {
      if (!mass[k]) continue;
      const o = k * 3;
      for (let a = 0; a < 3; a += 1) {
        const p = positions[o + a];
        const v = (p - previous[o + a]) * damping + gravity[a] * ROPE_TICK ** 2;
        positions[o + a] += Math.max(-MAX_MOVE, Math.min(MAX_MOVE, v));
        previous[o + a] = p;
      }
    }
    for (let it = 0; it < iterations; it += 1) {
      for (let i = 0; i < segment; i += 1)
        constrain(segments[i * 2], segments[i * 2 + 1], rests[i], 1);
      for (let i = 0; i < ropes.length; i += 1) {
        const rope = ropes[i];
        for (let j = 0; j + 2 < rope.count; j += 1)
          constrain(
            rope.start + j,
            rope.start + j + 2,
            (rope.length / (rope.count - 1)) * 2,
            bending
          );
      }
      anchors.forEach((point, k) => {
        positions.set(point, k * 3);
        previous.set(point, k * 3);
      });
      hand.pin();
      if (it % 2 === 1) collideRopes(world);
      collideSolids();
    }
    for (let i = 0; i < positions.length; i += 1)
      movement = Math.max(movement, Math.abs(positions[i] - previous[i]));
    quiet = movement < 0.00012 && !hand.active ? quiet + 1 : 0;
    sleeping = quiet > 120;
  }

  return {
    ...world,
    get sleeping() {
      return sleeping;
    },
    wake() {
      sleeping = count === 0;
      quiet = 0;
    },
    // New solid boxes, for a scene whose solids change under its ropes.
    setBoxes(next) {
      collideSolids = createSolidContacts(world, next, floor);
      this.wake();
    },
    // Puts ropes known to be at rest (restored from a settled snapshot) to
    // sleep now rather than after a quiet second; any touch wakes them.
    rest() {
      sleeping = true;
      quiet = 0;
    },
    anchor(k, point) {
      if (point) {
        anchors.set(k, point);
        mass[k] = 0;
        positions.set(point, k * 3);
        previous.set(point, k * 3);
      } else {
        anchors.delete(k);
        mass[k] = 0.3;
      }
      this.wake();
    },
    grab(k, point) {
      hand.grab(k, point);
      this.wake();
    },
    move(point) {
      hand.move(point);
      this.wake();
    },
    release() {
      hand.release();
      this.wake();
    },
    setLength(id, length) {
      const rope = ropes[id];
      if (!Number.isFinite(length) || length <= 0)
        throw new Error('Rope length must be positive');
      rope.length = length;
      const rest = length / (rope.count - 1);
      const offset = rope.start - id;
      rests.fill(rest, offset, offset + rope.count - 1);
      world.cellSize = Math.max(world.cellSize, (rest + rope.radius * 2) * 2);
      this.wake();
    },
    step(delta) {
      accumulator += Math.max(0, Math.min(delta, 1 / 15));
      while (accumulator >= ROPE_TICK) {
        tick();
        accumulator -= ROPE_TICK;
      }
    },
    settle(ticks = 240) {
      for (let i = 0; i < ticks; i += 1) tick();
    },
    snapshot() {
      return {
        version: 1,
        positions: Array.from(positions),
        previous: Array.from(previous),
      };
    },
    restore(state) {
      if (
        state?.version !== 1 ||
        state.positions?.length !== positions.length ||
        state.previous?.length !== positions.length ||
        !state.positions.every(Number.isFinite) ||
        !state.previous.every(Number.isFinite)
      )
        throw new Error('Invalid rope snapshot');
      positions.set(state.positions);
      previous.set(state.previous);
      accumulator = 0;
      this.wake();
    },
  };
}
