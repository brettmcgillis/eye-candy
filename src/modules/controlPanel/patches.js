import { createRopeWorld } from '@modules/ropePhysics';

import patchColliders from './patchColliders';
import generatePatches from './patchGeneration';
import { distance, socketTop as top } from './patchUtils';
import { plugDirection } from './plugs';

export { default as generatePatches } from './patchGeneration';

export const SETTLE_TICKS = 240;

// `settle: false` leaves fresh ropes where they were generated, for a caller
// that settles them a slice at a time (`world.settle(ticks)`); `boxes` are
// colliders already worked out for this panel; `restore` ({ cables, rope })
// is a saved arrangement already known to fit these sockets.
export default function createPatches(
  panel,
  config,
  { boxes: given = null, restore = null, settle = true } = {}
) {
  const sockets = new Map(panel.sockets.map((s) => [s.id, s]));
  let saved =
    restore ?? (config.patchState ? JSON.parse(config.patchState) : null);
  if (!restore && saved && saved.version !== 1)
    throw new Error('Unsupported saved patch version');
  if (!restore && saved?.panel !== JSON.stringify(panel.sockets)) saved = null;
  const cables = saved?.cables ?? generatePatches(panel, config);
  const floor = panel.bounds.min[1] - 1.8;
  const boxes = given ?? patchColliders(panel);
  const world = createRopeWorld(cables, {
    floor,
    boxes,
    iterations: config.patchIterations,
  });
  let grabbed = null;
  let edited = false;
  let highlight = null;
  function pin(cable, end) {
    const rope = world.ropes[cable];
    const node = end === 0 ? rope.start : rope.start + rope.count - 1;
    const adjacent = node + (end === 0 ? 1 : -1);
    const socket = sockets.get(cables[cable].ends[end]);
    const radius = Math.max(rope.radius, 0.08 * cables[cable].scales[end]);
    world.radii[node] = radius;
    world.radii[adjacent] = radius;
    if (socket) {
      const p = top(socket);
      world.anchor(node, p);
      world.anchor(adjacent, [
        p[0],
        p[1],
        p[2] + rope.length / (rope.count - 1),
      ]);
    } else {
      world.anchor(node, null);
      world.anchor(adjacent, null);
    }
  }
  cables.forEach((cable, i) => {
    pin(i, 0);
    pin(i, 1);
  });
  if (saved) world.restore(saved.rope);
  else if (cables.length && settle) world.settle(SETTLE_TICKS);
  function occupant(id) {
    for (let i = 0; i < cables.length; i += 1) {
      const end = cables[i].ends.indexOf(id);
      if (end >= 0) return { cable: i, end };
    }
    return null;
  }
  function targetAt(point, socketId) {
    if (!grabbed || grabbed.end == null) return null;
    if (socketId !== undefined)
      return sockets.has(socketId) && !occupant(socketId)
        ? sockets.get(socketId)
        : null;
    let best = null;
    let nearest = Infinity;
    sockets.forEach((socket) => {
      const d = Math.hypot(socket.p[0] - point[0], socket.p[1] - point[1]);
      if (
        !occupant(socket.id) &&
        d < Math.max(0.24, 0.22 * socket.scale) &&
        d < nearest
      ) {
        best = socket;
        nearest = d;
      }
    });
    return best;
  }

  function extendTo(point) {
    const cable = cables[grabbed.cable];
    const rope = world.ropes[grabbed.cable];
    const fraction = (grabbed.node - rope.start) / (rope.count - 1);
    let required = rope.length;
    cable.ends.forEach((end, index) => {
      const socket = sockets.get(end);
      const share = index === 0 ? fraction : 1 - fraction;
      if (socket && share > 0)
        required = Math.max(
          required,
          (distance(top(socket), point) / share) * 1.08
        );
    });
    if (required <= rope.length) return;
    cable.length = required;
    world.setLength(grabbed.cable, required);
    if (cable.ends[0]) pin(grabbed.cable, 0);
    if (cable.ends[1]) pin(grabbed.cable, 1);
  }
  return {
    world,
    cables,
    sockets,
    floor,
    boxes,
    get grabbed() {
      return grabbed;
    },
    get highlight() {
      return highlight;
    },
    get edited() {
      return edited;
    },
    occupant,
    begin(pick, point) {
      let hit = pick;
      if (hit.socket) {
        hit = occupant(hit.socket);
        if (!hit) return false;
      }
      const rope = world.ropes[hit.cable];
      const node =
        hit.end == null
          ? hit.node
          : rope.start + (hit.end === 0 ? 0 : rope.count - 1);
      const direction = new Float64Array(3);
      if (hit.end != null)
        plugDirection({ world, cables }, hit.cable, hit.end, direction);
      grabbed = {
        ...hit,
        direction,
        node,
        start: [...point],
        detached: hit.end == null || !cables[hit.cable].ends[hit.end],
      };
      if (grabbed.detached) world.grab(node, point);
      return true;
    },
    move(point, socketId, dragRay = null) {
      if (!grabbed) return;
      if (
        !grabbed.detached &&
        Math.hypot(point[0] - grabbed.start[0], point[1] - grabbed.start[1]) >
          0.09
      ) {
        cables[grabbed.cable].ends[grabbed.end] = null;
        pin(grabbed.cable, grabbed.end);
        grabbed.detached = true;
        world.grab(grabbed.node, point);
        edited = true;
      }
      if (!grabbed.detached) return;
      const lifted = [...point];
      lifted[1] = Math.max(floor + 0.12, lifted[1]);
      lifted[2] = Math.max(lifted[2], 0.28);
      boxes.forEach((box) => {
        if (
          lifted[0] > box.min[0] - 0.1 &&
          lifted[0] < box.max[0] + 0.1 &&
          lifted[1] > box.min[1] - 0.1 &&
          lifted[1] < box.max[1] + 0.1
        )
          lifted[2] = Math.max(lifted[2], box.max[2] + 0.16);
      });
      if (dragRay && Math.abs(dragRay.direction[2]) > 1e-6) {
        const t =
          (lifted[2] - dragRay.offset[2] - dragRay.origin[2]) /
          dragRay.direction[2];
        lifted[0] =
          dragRay.origin[0] + dragRay.direction[0] * t + dragRay.offset[0];
        lifted[1] =
          dragRay.origin[1] + dragRay.direction[1] * t + dragRay.offset[1];
      }
      highlight = targetAt(point, socketId);
      if (highlight) lifted.splice(0, 3, ...top(highlight));
      extendTo(lifted);
      world.move(lifted);
      edited = true;
    },
    release(cancel = false) {
      if (grabbed?.detached && grabbed.end != null && highlight && !cancel) {
        cables[grabbed.cable].ends[grabbed.end] = highlight.id;
        cables[grabbed.cable].scales[grabbed.end] = highlight.scale;
        cables[grabbed.cable].endRadii ??= [0, 0];
        cables[grabbed.cable].endRadii[grabbed.end] = highlight.scale * 0.08;
        pin(grabbed.cable, grabbed.end);
      }
      grabbed = null;
      highlight = null;
      world.release();
    },
    // Pops a plug out of its socket, flicked by `kick` (a displacement over
    // one tick), to hang from its other end.
    unplug(cable, end, kick = [0, 0, 0]) {
      if (!cables[cable]?.ends[end]) return;
      cables[cable].ends[end] = null;
      pin(cable, end);
      const rope = world.ropes[cable];
      const node = end === 0 ? rope.start : rope.start + rope.count - 1;
      for (let a = 0; a < 3; a += 1) world.positions[node * 3 + a] += kick[a];
      edited = true;
    },
    // The sockets there are now (a panel whose modules come and go); a plug
    // left in one that has gone falls out. Returns those [cable, end]s.
    setSockets(list) {
      sockets.clear();
      list.forEach((socket) => sockets.set(socket.id, socket));
      const dropped = [];
      cables.forEach((cable, i) =>
        cable.ends.forEach((end, e) => {
          if (end && !sockets.has(end)) {
            cables[i].ends[e] = null;
            pin(i, e);
            dropped.push([i, e]);
          }
        })
      );
      return dropped;
    },
    // The solids under the cables now.
    setColliders(next) {
      boxes.splice(0, boxes.length, ...next);
      world.setBoxes(boxes);
    },
    step: (delta) => world.step(delta),
    serialize() {
      return JSON.stringify({
        version: 1,
        panel: JSON.stringify(panel.sockets),
        cables,
        rope: world.snapshot(),
      });
    },
  };
}
