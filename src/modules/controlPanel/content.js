import { placeHit } from './hits';
import { buildModules, createBuildContext } from './panel';
import { moveAll } from './parts';

// Controls a moving panel never rolls: loose paper needs a floor under a
// panel that stays put, and a socket only takes a cable on a fixed panel.
export const LOOSE_IDS = ['printer'];
export const SOCKET_IDS = ['jack', 'patchBay'];

// One leaf of `cell` cells dressed as its module(s) about its own centre,
// from its own `seed`, so it can be mounted anywhere and built again
// identically. `entry` forces an Inventory entry.
export function buildContent(
  config,
  { entry = null, h, w },
  seed,
  { exclude = null, style } = {}
) {
  const context = createBuildContext(config, { exclude, seed, style });
  const leaf = { depth: 0, entry, h, w, x: 0, y: 0, zone: false };
  const modules = buildModules(
    context,
    { h, layout: { leaves: [leaf], zones: [] }, w },
    { depth: 0, origin: [-w / 2, h / 2], scale: 1 }
  );
  const controls = modules.flatMap((module) => module.controls);
  modules.forEach((module) =>
    Object.assign(module, {
      local: { statics: module.statics, x: module.x, y: module.y },
    })
  );
  controls.forEach((control) =>
    Object.assign(control, {
      local: { statics: control.statics, transform: control.transform },
    })
  );
  return {
    controls,
    ids: controls.map((control) => control.id),
    modules,
    pinned: controls.some(
      (control) => control.loose || control.sockets.length > 0
    ),
  };
}

// Places built content with its centre at (x, y): every control's transform,
// statics and hits follow, and its pose memo is dropped.
export function mountContent(content, [x, y]) {
  const offset = [x, y, 0];
  content.modules.forEach((module) =>
    Object.assign(module, {
      statics: moveAll(module.local.statics, { offset }),
      x: module.local.x + x,
      y: module.local.y + y,
    })
  );
  content.controls.forEach((control) => {
    const { local } = control;
    const transform = {
      ...local.transform,
      offset: local.transform.offset.map((v, i) => v + offset[i]),
    };
    Object.assign(control, {
      memo: null,
      statics: moveAll(local.statics, { offset }),
      transform,
    });
  });
  Object.assign(content, { at: [x, y], hits: null });
  return content;
}

// A mounted content's loose controls (printers) on a panel that moves: no
// floor, so they tear their paper off and let it drop out of frame (see
// controls/paperDrop.js). A printer's journal reads only its own content's
// controls, which come and go with it. Call after every mount.
export function bindLoose(content) {
  const own = [];
  content.controls.forEach((control) => {
    own[control.key] = control;
  });
  content.controls.forEach((control) => {
    if (!control.loose || !control.bind) return;
    control.bind({
      bounds: { max: [0, 0, 0], min: [0, 0, 0] },
      controls: own,
      drop: true,
      transform: control.transform,
    });
  });
  return content;
}

// A content's hits in panel space, for the controls it holds now (kept
// until it is mounted again).
export function contentHits(content) {
  if (!content.hits)
    Object.assign(content, {
      hits: content.controls.flatMap((control) =>
        control.hits.map((hit) => ({
          ...placeHit(hit, control.transform),
          control: control.key,
        }))
      ),
    });
  return content.hits;
}

// A growing register of every control a moving panel has shown: keys are
// never reused, so a hand's overrides and the kinetics never land on a
// newcomer, and a retired control's slot is emptied.
export function createControlRegister() {
  const controls = [];
  return {
    controls,
    add(content) {
      content.controls.forEach((control) => {
        Object.assign(control, { key: controls.length });
        controls.push(control);
      });
    },
    retire(content) {
      content.controls.forEach((control) => {
        controls[control.key] = null;
      });
    },
  };
}
