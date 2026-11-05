import { contentHits, mountContent } from './content';
import { hash01 } from './signals';

// A panel whose contents come and go (Swap, Scroll) still looks like a
// built panel to the session, the patcher and the pointer: `controls` is
// the register (retired slots are empty), `modules` and `hits` are what is
// settled now.
export function createShell({ bounds, chassis, controls }) {
  return {
    bounds,
    chassis,
    controls,
    detail: null,
    hits: [],
    looseBounds: [],
    modules: [],
    sockets: [],
    statics: [...chassis],
  };
}

// Mounts content at `at` unless it is already there.
export function mountAt(content, at) {
  if (content.at?.[0] !== at[0] || content.at?.[1] !== at[1])
    mountContent(content, at);
  return content;
}

// What settled contents give the static layers and the pointer.
export function settle(shell, contents, { first = [] } = {}) {
  const lead = new Set(first);
  const settled = [...first, ...contents.filter((c) => !lead.has(c))];
  const hits = [];
  const modules = [];
  const statics = [...shell.chassis];
  const add = (into, items) => {
    for (let i = 0; i < items.length; i += 1) into.push(items[i]);
  };
  settled.forEach((content) => {
    add(hits, contentHits(content));
    content.modules.forEach((module) => {
      modules.push(module);
      add(statics, module.statics);
      module.controls.forEach((control) => add(statics, control.statics));
    });
  });
  Object.assign(shell, { hits, modules, statics });
}

// A build-in order for modules newly on screen: a sweep across `extent`
// (half width, half height) at `angle`, jittered per module.
export function sweepOrder(modules, extent, angle, salt) {
  const reach = Math.hypot(extent[0], extent[1]) || 1;
  modules.forEach((module, i) =>
    Object.assign(module, {
      order:
        0.5 +
        (0.4 * (module.x * Math.cos(angle) + module.y * Math.sin(angle))) /
          reach +
        0.1 * hash01(salt, i),
    })
  );
}

// The most common control in a content: what a swap must not roll again.
export function dominantId(ids) {
  const counts = new Map();
  ids.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  let best = null;
  counts.forEach((n, id) => {
    if (!best || n > counts.get(best)) best = id;
  });
  return best;
}
