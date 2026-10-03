import { FIELD_KEYS, motionState } from '@modules/isoLinesRelief';

const MAX_DELTA = 1 / 15;
const BUILD_KEYS = [
  ...FIELD_KEYS,
  'style',
  'levels',
  'levelOffset',
  'wallMode',
  'lineExtrude',
  'trailSlices',
  'trailSeconds',
];

const keyOf = (c) => BUILD_KEYS.map((key) => c[key]).join('|');

// The scene's clock over the kernel. Builds go to the worker and land when
// they land; until then the piece on screen keeps drawing. `flow` moves the
// field's time; `build` and `rise` loop their cycle over a held field.
export default function createDriver() {
  let client = null;
  let building = false;
  let pending = null;
  let landed = null;
  let requested = null;
  let time = 0;
  let cycle = 0;
  let epoch = 0;

  // One build in flight at a time; newer requests coalesce into the next
  // build instead of superseding the running one, which would starve the
  // screen whenever requests outpace builds (a flowing field always does).
  function dispatch() {
    const request = pending;
    pending = null;
    building = true;
    const from = client;
    from.build(request.config, request).then((build) => {
      if (client !== from) return;
      building = false;
      landed = build;
      if (pending) dispatch();
    });
  }

  return {
    attach(next) {
      client = next;
      building = false;
      pending = null;
      requested = null;
    },

    step(c, delta, { aspect, image = null, replay = 0 }) {
      const dt = Math.min(delta, MAX_DELTA);
      if (c.motionMode === 'flow') time += dt * c.timeScale;
      if (replay !== epoch) {
        epoch = replay;
        cycle = 0;
      }
      cycle += dt;

      const key = `${keyOf(c)}|${aspect}|${c.motionMode === 'flow' ? time : ''}`;
      if (client && (key !== requested?.key || image !== requested?.image)) {
        requested = { image, key };
        pending = { aspect, config: c, image, time };
        if (!building) dispatch();
      }

      const build = landed;
      landed = null;
      return { build, motion: motionState(c.motionMode, cycle, c) };
    },
  };
}
