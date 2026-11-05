import createKinetics from './kinetics';
import { patchBuildOffsets, patchPlugParts } from './patchPose';
import { socketTop } from './patchUtils';
import createPatches, { generatePatches } from './patches';
import { PLUG_PARTS_PER_END } from './plugs';
import { cableReveal, posePanel, readSignal } from './pose';

const NO_OFFSET = [0, 0];

// `show` (a Swap or Scroll show) poses a panel whose contents come and go;
// `panel` is then its shell.
export default function createPanelSession(
  panel,
  initialConfig,
  { show = null } = {}
) {
  let config = initialConfig;
  let patch = show?.patch ?? createPatches(panel, config);
  let audio = null;
  let time = 0;
  let build = null;
  const overrides = new Map();
  const kinetics = createKinetics(overrides);
  const disposal = new Set();
  return {
    panel,
    onDispose(callback) {
      disposal.add(callback);
      return () => disposal.delete(callback);
    },
    dispose() {
      disposal.forEach((callback) => callback());
      disposal.clear();
      patch.release(true);
    },
    get patch() {
      return patch;
    },
    get config() {
      return config;
    },
    get time() {
      return time;
    },
    // Where the panel's own frame sits in the world: a scrolling panel moves.
    get offset() {
      return show?.offset ?? NO_OFFSET;
    },
    get building() {
      return build != null && build < config.buildSeconds;
    },
    beginGesture(hit) {
      kinetics.stop(hit.control);
    },
    endGesture(gesture, cancel = false) {
      kinetics.release(gesture, cancel);
    },
    apply(set) {
      Object.entries(set).forEach(([key, value]) => {
        if (value == null) overrides.delete(key);
        else overrides.set(key, value);
      });
    },
    read: (key) =>
      readSignal(panel, config, key, { audio, overrides, t: time }),
    // New patch settings re-make the cables and nothing else. Saving writes
    // back the state already on screen, so it re-makes nothing.
    repatch(next) {
      config = next;
      if (next.patchState && next.patchState === patch.serialize()) return;
      patch.release(true);
      patch = createPatches(panel, next);
    },
    // A show's new cables (Scroll re-patches as the field moves on).
    adopt(next) {
      if (next === patch) return;
      patch.release(true);
      patch = next;
    },
    releaseControls() {
      overrides.clear();
      kinetics.clear();
    },
    spawn(socketId) {
      const socket = patch.sockets.get(socketId);
      if (!socket || patch.occupant(socketId)) return null;
      const [cable] = generatePatches(
        { ...panel, sockets: [socket] },
        { ...config, patchCableChance: 1, patchConnectChance: 0 }
      );
      cable.id = `cable-${patch.cables.length}`;
      const origin = socketTop(socket);
      const radius = cable.length / (2 * Math.PI);
      for (let i = 0; i < cable.points.length / 3; i += 1) {
        const angle = (i / (cable.points.length / 3 - 1)) * Math.PI * 2;
        cable.points[i * 3] = origin[0] + Math.sin(angle) * radius;
        cable.points[i * 3 + 1] = origin[1] + (Math.cos(angle) - 1) * radius;
        cable.points[i * 3 + 2] = origin[2] + 0.06 * Math.sin(angle / 2);
      }
      const state = patch.world.snapshot();
      state.positions.push(...cable.points);
      state.previous.push(...cable.points);
      patch = createPatches(panel, {
        ...config,
        patchState: JSON.stringify({
          version: 1,
          panel: JSON.stringify(panel.sockets),
          cables: [...patch.cables, cable],
          rope: state,
        }),
      });
      return { cable: patch.cables.length - 1, end: 1 };
    },
    step(delta, options = {}) {
      config = options.config ?? config;
      audio = options.audio ?? null;
      time = options.t ?? time;
      build = options.build ?? null;
      patch.step(delta);
      kinetics.step(delta);
    },
    moving() {
      const pose = { audio, build, overrides, t: time };
      const parts = show ? show.pose(pose) : posePanel(panel, config, pose);
      const plugs = patchPlugParts(patch);
      const offsets = patchBuildOffsets(panel, patch, config, build);
      if (build == null) return [...parts, ...plugs];
      const count = patch.world.ropes.length;
      return [
        ...parts,
        ...plugs.flatMap((plug, i) => {
          const id = Math.floor(i / (PLUG_PARTS_PER_END * 2));
          const rope = patch.world.ropes[id];
          if (!rope) return [plug];
          const first = i % (PLUG_PARTS_PER_END * 2) < PLUG_PARTS_PER_END;
          const reveal = cableReveal(id, count, build, config.buildSeconds);
          if (first ? reveal <= 0 : reveal < 1) return [];
          const node = first ? rope.start : rope.start + rope.count - 1;
          return [
            { ...plug, p: [plug.p[0], plug.p[1], plug.p[2] + offsets[node]] },
          ];
        }),
      ];
    },
    offsets: () => patchBuildOffsets(panel, patch, config, build),
    reveals: () =>
      build == null
        ? null
        : patch.world.ropes.map((_, id) =>
            cableReveal(
              id,
              patch.world.ropes.length,
              build,
              config.buildSeconds
            )
          ),
    exportConfig: () => ({ ...config, patchState: patch.serialize() }),
  };
}
