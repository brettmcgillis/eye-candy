/* eslint-disable no-param-reassign */
import { part } from './parts';
import {
  PLUG_PARTS_PER_END,
  createPlugs,
  plugDirection,
  posePlug,
} from './plugs';
import { riseAt } from './pose';

export function patchPlugParts(patch) {
  if (
    !patch.plugs ||
    patch.plugs.length !== patch.cables.length * PLUG_PARTS_PER_END * 2
  ) {
    patch.plugs = createPlugs(patch.cables);
    patch.plugDirection = new Float64Array(3);
  }
  const { positions } = patch.world;
  for (let id = 0; id < patch.cables.length; id += 1) {
    const rope = patch.world.ropes[id];
    for (let end = 0; end < 2; end += 1) {
      const node = rope.start + (end === 0 ? 0 : rope.count - 1);
      plugDirection(patch, id, end, patch.plugDirection);
      posePlug(
        patch.plugs,
        (id * 2 + end) * PLUG_PARTS_PER_END,
        positions[node * 3],
        positions[node * 3 + 1],
        positions[node * 3 + 2],
        patch.plugDirection,
        patch.cables[id].scales[end]
      );
    }
  }
  if (patch.highlight) {
    const socket = patch.highlight;
    return [
      ...patch.plugs,
      part(
        'torus',
        [socket.p[0], socket.p[1], socket.p[2] + 0.012],
        [0.16 * socket.scale, 0.16 * socket.scale, 0.018],
        { c: [0.2, 1, 0.5], e: [0.1, 0.5, 0.2], r: 0.5, m: 0 }
      ),
    ];
  }
  return patch.plugs;
}

function socketSink(panel, patch, id, config, build) {
  const socket = patch.sockets.get(id);
  return socket && build != null
    ? (1 -
        riseAt(
          panel.modules[socket.module]?.order ?? 1,
          build,
          config.buildSeconds
        )) *
        0.9
    : 0;
}

export function patchBuildOffsets(panel, patch, config, build) {
  const offsets =
    patch.buildOffsets ?? new Float64Array(patch.world.positions.length / 3);
  patch.buildOffsets = offsets;
  for (let id = 0; id < patch.cables.length; id += 1) {
    const cable = patch.cables[id];
    const rope = patch.world.ropes[id];
    const a = socketSink(panel, patch, cable.ends[0], config, build);
    const b =
      cable.ends[1] == null
        ? a
        : socketSink(panel, patch, cable.ends[1], config, build);
    for (let i = 0; i < rope.count; i += 1)
      offsets[rope.start + i] = -(a + ((b - a) * i) / (rope.count - 1));
  }
  return offsets;
}

export function patchBounds(panel, patch) {
  const min = [...panel.bounds.min];
  const max = [...panel.bounds.max];
  panel.looseBounds?.forEach((box) => {
    for (let a = 0; a < 3; a += 1) {
      min[a] = Math.min(min[a], box.min[a]);
      max[a] = Math.max(max[a], box.max[a]);
    }
  });
  const { positions } = patch.world;
  for (let i = 0; i < positions.length; i += 3) {
    for (let a = 0; a < 3; a += 1) {
      min[a] = Math.min(min[a], positions[i + a] - 0.4);
      max[a] = Math.max(max[a], positions[i + a] + 0.4);
    }
  }
  return { min, max };
}
