import { createRng } from '@modules/flora';

import {
  bindLoose,
  buildContent,
  createControlRegister,
  mountContent,
} from './content';
import { INVENTORY, layoutInventory } from './controls';
import { PALETTES, createDistricts } from './palettes';
import { chassisBox } from './panel';
import createPatches, { SETTLE_TICKS } from './patches';
import { buildSink, poseFrame, poseModule } from './pose';
import createRoute from './route';
import { createShell, settle, sweepOrder } from './show';
import { hash01 } from './signals';
import { collectSockets } from './sockets';
import createStyle from './style';

// Scroll: an endless panel sliding past a fixed view. The field is cut into
// chunks; untiled, each chunk packs its own shuffled draw of the Inventory
// (every control and variant, loose paper aside) with chunk rows offset
// like brickwork, so it never repeats; tiled, one chunk holds the whole
// Inventory and repeats both ways, so a straight run loops after one tile.
// The route (route.js) and everything posed are pure in `t`.
const CHUNK = [12, 8];
// Only what the view (plus MARGIN cells) can reach is mounted; that box is
// snapped out to GRID cells so the static layers rebuild only when the view
// crosses a grid line. Built content runs PREFETCH cells ahead of it.
const MARGIN = 1.5;
const GRID = 4;
const PREFETCH = 4;
// Mounted positions stay valid until the view has wandered this far from
// where they were mounted.
const REBASE = 64;
// Share of a chunk the shuffled draw fills before the gaps get single units.
const FILL = 0.8;
// A chunk's dangling leads hang this far before any floor. Chunks within
// BAKE_AHEAD cells of the mounted box have their cables settled ahead of
// time, BAKE_TICKS at a go for up to BAKE_BUDGET ms a frame, those nearest
// where the view will be in LOOK_AHEAD seconds first.
const DROP = 30;
const BAKE_AHEAD = 12;
const BAKE_TICKS = 1;
const BAKE_BUDGET = 4;
const LOOK_AHEAD = 6;
// The first mount also bakes every chunk the route reaches in WARM seconds,
// so the backlog is paid while the scene loads rather than mid-run.
const WARM = 12;
// Bakes settle with at most this many solver passes a tick: half the cost,
// the same drape; the live patch a hand drags keeps the configured count.
const BAKE_ITERATIONS = 4;

const FIELD = INVENTORY;
const FILLERS = FIELD.filter((entry) => entry.kind === 'unit');

function shuffle(rng, items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// A shuffled draw of the field's entries packed into w × h cells, biggest
// first, each where it touches the most walls and neighbours (ties by the
// dice, so no corner of a chunk always gets the big ones); the cells left
// over are single units.
function packChunk(rng, w, h) {
  const taken = new Uint8Array(w * h);
  const free = (x, y, ew, eh) => {
    if (x + ew > w || y + eh > h) return false;
    for (let dy = 0; dy < eh; dy += 1)
      for (let dx = 0; dx < ew; dx += 1)
        if (taken[(y + dy) * w + x + dx]) return false;
    return true;
  };
  const solid = (x, y) =>
    x < 0 || y < 0 || x >= w || y >= h || taken[y * w + x] === 1;
  const contact = (x, y, ew, eh) => {
    let n = 0;
    for (let dx = 0; dx < ew; dx += 1)
      n += solid(x + dx, y - 1) + solid(x + dx, y + eh);
    for (let dy = 0; dy < eh; dy += 1)
      n += solid(x - 1, y + dy) + solid(x + ew, y + dy);
    return n;
  };
  const draw = [];
  let area = 0;
  shuffle(
    rng,
    FIELD.filter((entry) => entry.w <= w && entry.h <= h)
  ).forEach((entry) => {
    if (area + entry.w * entry.h > w * h * FILL) return;
    draw.push(entry);
    area += entry.w * entry.h;
  });
  draw.sort((a, b) => b.w * b.h - a.w * a.h);
  const leaves = [];
  const place = (entry, x, y) => {
    for (let dy = 0; dy < entry.h; dy += 1)
      for (let dx = 0; dx < entry.w; dx += 1) taken[(y + dy) * w + x + dx] = 1;
    leaves.push({ entry, h: entry.h, w: entry.w, x, y });
  };
  draw.forEach((entry) => {
    let best = [];
    let score = -1;
    for (let y = 0; y + entry.h <= h; y += 1) {
      for (let x = 0; x + entry.w <= w; x += 1) {
        if (free(x, y, entry.w, entry.h)) {
          const n = contact(x, y, entry.w, entry.h);
          if (n > score) [best, score] = [[[x, y]], n];
          else if (n === score) best.push([x, y]);
        }
      }
    }
    if (best.length) place(entry, ...best[Math.floor(rng() * best.length)]);
  });
  for (let y = 0; y < h; y += 1)
    for (let x = 0; x < w; x += 1)
      if (!taken[y * w + x])
        place(FILLERS[Math.floor(rng() * FILLERS.length)], x, y);
  return leaves;
}

// The whole field Inventory as one rectangle: first fit at its best width,
// the gaps it leaves filled with single units.
function packTile(rng) {
  const fit = layoutInventory(FIELD);
  const taken = new Uint8Array(fit.cols * fit.rows);
  const leaves = fit.leaves.map(({ entry, h, w, x, y }) => {
    for (let dy = 0; dy < h; dy += 1)
      for (let dx = 0; dx < w; dx += 1) taken[(y + dy) * fit.cols + x + dx] = 1;
    return { entry, h, w, x, y };
  });
  for (let i = 0; i < taken.length; i += 1) {
    if (!taken[i]) {
      const entry = FILLERS[Math.floor(rng() * FILLERS.length)];
      leaves.push({
        entry,
        h: 1,
        w: 1,
        x: i % fit.cols,
        y: Math.floor(i / fit.cols),
      });
    }
  }
  return { leaves, size: [fit.cols, fit.rows] };
}

// A printer's leaf and the paper below it.

const overlaps = (a, b) =>
  a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
// How far apart two boxes are (0 when they touch).
const distance = (a, b) =>
  Math.hypot(
    Math.max(a.x0 - b.x1, b.x0 - a.x1, 0),
    Math.max(a.y0 - b.y1, b.y0 - a.y1, 0)
  );

export default function createScrollShow(config, { eager = false } = {}) {
  const style = createStyle(config);
  const salt = Math.imul(config.seed + 3, 3266489917);
  const register = createControlRegister();
  const route = createRoute(config);
  const tile = config.scrollTiled
    ? packTile(createRng(`${config.seed}:scroll:tile`))
    : null;
  const [cw, ch] = tile?.size ?? CHUNK;
  // Untiled chunk rows are offset like brickwork, so their seams don't line
  // up into a grid.
  const shiftOf = (j) => (tile ? 0 : Math.floor(hash01(salt, j) * cw));
  // With Palettes, each leaf (and each chunk's cables) wears its district's
  // colours (palettes.js).
  const districts = config.scrollPalettes ? createDistricts(config) : null;
  const styles = new Map();
  const styleOf = (name) => {
    if (!name) return style;
    if (!styles.has(name))
      styles.set(name, createStyle({ ...config, ...PALETTES[name] }));
    return styles.get(name);
  };

  const chunks = new Map();
  function chunk(i, j) {
    const id = `${i},${j}`;
    let found = chunks.get(id);
    if (found) return found;
    const x0 = i * cw + shiftOf(j);
    const y0 = j * ch;
    const packed =
      tile?.leaves ??
      packChunk(createRng(`${config.seed}:scroll:${i}:${j}`), cw, ch);
    found = {
      box: { x0, x1: x0 + cw, y0: -(y0 + ch), y1: -y0 },
      id,
      palette: districts?.([x0 + cw / 2, -(y0 + ch / 2)], id) ?? null,
      leaves: packed.map((leaf, n) => {
        const x = x0 + leaf.x;
        const y = y0 + leaf.y;
        const center = [x + leaf.w / 2, -(y + leaf.h / 2)];
        return {
          ...leaf,
          box: { x0: x, x1: x + leaf.w, y0: -(y + leaf.h), y1: -y },
          center,
          key: `${id}:${n}`,
          palette: districts?.(center, `${id}:${n}`) ?? null,
          seed: tile
            ? `${config.seed}:scroll:tile:${n}`
            : `${config.seed}:scroll:${id}:${n}`,
        };
      }),
    };
    chunks.set(id, found);
    return found;
  }
  // The chunks a box (cells, x right, y up) touches.
  function chunksIn(box) {
    const out = [];
    const j0 = Math.floor(-box.y1 / ch);
    const j1 = Math.floor(-box.y0 / ch);
    for (let j = j0; j <= j1; j += 1) {
      const shift = shiftOf(j);
      const i0 = Math.floor((box.x0 - shift) / cw);
      const i1 = Math.floor((box.x1 - shift) / cw);
      for (let i = i0; i <= i1; i += 1) out.push(chunk(i, j));
    }
    return out;
  }
  const leavesIn = (box) =>
    chunksIn(box).flatMap((found) =>
      found.leaves.filter((leaf) => overlaps(leaf.box, box))
    );

  const contents = new Map();
  const contentFor = (leaf) => {
    let content = contents.get(leaf.key);
    if (!content) {
      content = buildContent(config, leaf, leaf.seed, {
        style: styleOf(leaf.palette),
      });
      content.modules.forEach((module) => Object.assign(module, { order: 1 }));
      register.add(content);
      contents.set(leaf.key, content);
    }
    return content;
  };

  const shell = createShell({
    bounds: { max: [1, 1, 0.6], min: [-1, -1, -0.5] },
    chassis: [],
    controls: register.controls,
  });
  let origin = null;
  let stamp = 0;
  let regionKey = null;
  let mounted = [];
  let visible = [];
  let position = [0, 0];
  const offset = [0, 0];
  let view = { x0: -9, x1: 9, y0: -5, y1: 5 };

  // A leaf's content, mounted about the current origin (a printer tears its
  // paper off and drops it out of frame).
  function place(leaf) {
    const content = contentFor(leaf);
    if (content.stamp !== stamp) {
      mountContent(content, [
        leaf.center[0] - origin[0],
        leaf.center[1] - origin[1],
      ]);
      bindLoose(content);
      content.stamp = stamp;
    }
    return content;
  }

  // ----- cables: each chunk patches its own sockets, settled once -----
  // A bake is kept about its chunk's top-left corner with cable ends as
  // indices into the chunk's sockets, so one bake serves every copy of a
  // tile. Untiled, every chunk bakes its own.

  const patternOf = (found) => (tile ? 'tile' : found.id);
  const cornerOf = (found) => [found.box.x0, found.box.y1];
  const shift = (values, d) =>
    values.map((v, i) => v + (i % 3 < 2 ? d[i % 3] : 0));
  const shiftBox = (box, d) => ({
    max: [box.max[0] + d[0], box.max[1] + d[1], box.max[2]],
    min: [box.min[0] + d[0], box.min[1] + d[1], box.min[2]],
  });
  const heldIn = (found) => found.leaves.map(place);
  const socketsIn = (held) =>
    collectSockets(held.flatMap((content) => content.modules));

  const bakes = new Map();
  let patchConfig = config;
  function startBake(found) {
    const held = heldIn(found);
    const sockets = socketsIn(held);
    const corner = cornerOf(found);
    // Mounted coordinates (about `origin`) → about the chunk's corner.
    const local = [origin[0] - corner[0], origin[1] - corner[1]];
    const bake = { boxes: [], cables: [], done: true, local };
    bakes.set(patternOf(found), bake);
    if (sockets.length === 0) return bake;
    const { box } = found;
    const panel = {
      bounds: {
        max: [box.x1 - origin[0], box.y1 - origin[1], 0.6],
        min: [box.x0 - origin[0], box.y0 - origin[1] - DROP, -0.5],
      },
      chassis: [],
      controls: held.flatMap((content) => content.controls),
      looseBounds: [],
      modules: held.flatMap((content) => content.modules),
      sockets,
    };
    Object.assign(bake, {
      done: false,
      patch: createPatches(
        panel,
        {
          ...patchConfig,
          ...(found.palette && PALETTES[found.palette]),
          patchIterations: Math.min(
            patchConfig.patchIterations,
            BAKE_ITERATIONS
          ),
          patchSeed: tile
            ? patchConfig.patchSeed
            : `${patchConfig.patchSeed}:${found.id}`,
          patchState: '',
        },
        { settle: false }
      ),
      slots: new Map(sockets.map((socket, n) => [socket.id, n])),
      ticks: 0,
    });
    return bake;
  }
  // Settles a bake until `budget` ms have gone (all of it when Infinity).
  function stepBake(bake, budget) {
    if (bake.done) return;
    const until = performance.now() + budget;
    while (bake.ticks < SETTLE_TICKS && performance.now() < until) {
      const n = Math.min(BAKE_TICKS, SETTLE_TICKS - bake.ticks);
      bake.patch.world.settle(n);
      Object.assign(bake, { ticks: bake.ticks + n });
    }
    if (bake.ticks < SETTLE_TICKS) return;
    const { local, patch: baked, slots } = bake;
    const { positions, previous } = baked.world.snapshot();
    Object.assign(bake, {
      boxes: baked.boxes.map((box) => shiftBox(box, local)),
      cables: baked.cables.map((cable, n) => {
        const rope = baked.world.ropes[n];
        const range = [rope.start * 3, (rope.start + rope.count) * 3];
        return {
          desc: cable,
          ends: cable.ends.map((end) => (end == null ? null : slots.get(end))),
          positions: shift(positions.slice(...range), local),
          previous: shift(previous.slice(...range), local),
        };
      }),
      done: true,
      patch: null,
      slots: null,
    });
  }
  const baked = (found) => {
    const bake = bakes.get(patternOf(found)) ?? startBake(found);
    stepBake(bake, Infinity);
    return bake;
  };
  // A chunk mounted before its bake was done joins without cables; these are
  // the patterns to compose again for once their bakes land.
  const pending = new Set();

  // One patch over the mounted chunks: every chunk's cables, those already
  // on show carried over as they are now (a hand's edits included).
  let patch = null;
  let patchAt = null;
  let live = () => patch;
  let composed = [];
  let patchModules = null;
  // Chunks to compose a patch over on the next frame (a remount's statics
  // and its patch never land in the same frame).
  let due = null;
  function compose(found, { wait = false } = {}) {
    composed = found;
    pending.clear();
    const carried = new Map();
    const current = live();
    if (current && patchAt) {
      const { positions, previous } = current.world.snapshot();
      const back = [patchAt[0] - origin[0], patchAt[1] - origin[1]];
      current.cables.forEach((cable, n) => {
        if (!cable.key) return;
        const rope = current.world.ropes[n];
        const range = [rope.start * 3, (rope.start + rope.count) * 3];
        carried.set(cable.key, {
          desc: cable,
          positions: shift(positions.slice(...range), back),
          previous: shift(previous.slice(...range), back),
        });
      });
    }
    const cables = [];
    const boxes = [];
    const modules = [];
    const controls = [];
    found.forEach((each) => {
      const bake = wait ? baked(each) : bakes.get(patternOf(each));
      const held = heldIn(each);
      const sockets = socketsIn(held);
      held.forEach((content) => {
        modules.push(...content.modules);
        controls.push(...content.controls);
      });
      if (!bake?.done) {
        pending.add(patternOf(each));
        return;
      }
      const corner = cornerOf(each);
      const toMounted = [corner[0] - origin[0], corner[1] - origin[1]];
      bake.boxes.forEach((box) => boxes.push(shiftBox(box, toMounted)));
      bake.cables.forEach((cable, n) => {
        const key = `${each.id}:${n}`;
        cables.push(
          carried.get(key) ?? {
            desc: {
              ...cable.desc,
              ends: cable.ends.map((slot) =>
                slot == null ? null : sockets[slot].id
              ),
              key,
            },
            positions: shift(cable.positions, toMounted),
            previous: shift(cable.previous, toMounted),
          }
        );
      });
    });
    const sockets = collectSockets(modules);
    const restore = {
      cables: cables.map((cable) => ({
        ...cable.desc,
        ends: [...cable.desc.ends],
      })),
      rope: {
        positions: cables.flatMap((cable) => cable.positions),
        previous: cables.flatMap((cable) => cable.previous),
        version: 1,
      },
    };
    Object.assign(shell, { modules, sockets });
    patchModules = modules;
    patch = createPatches(
      {
        bounds: {
          max: [...shell.bounds.max],
          min: [shell.bounds.min[0], shell.bounds.min[1] - DROP, -0.5],
        },
        chassis: [],
        controls,
        looseBounds: [],
        modules,
        sockets,
      },
      patchConfig,
      { boxes, restore }
    );
    patch.world.rest();
    patchAt = [...origin];
  }

  const grow = (box, d) => ({
    x0: box.x0 - d,
    x1: box.x1 + d,
    y0: box.y0 - d,
    y1: box.y1 + d,
  });
  // A box of whole cells about the grid point nearest `box`'s centre, big
  // enough to hold it from there: it changes once per GRID cells travelled.
  const snap = (box) => {
    const cover = (lo, hi) => {
      const mid = Math.round((lo + hi) / 2 / GRID) * GRID;
      const reach = Math.ceil((hi - lo) / 2 + GRID / 2);
      return [mid - reach, mid + reach];
    };
    const [x0, x1] = cover(box.x0, box.x1);
    const [y0, y1] = cover(box.y0, box.y1);
    return { x0, x1, y0, y1 };
  };

  // The chunks the view's mounted box will touch over the next `seconds`.
  function along(t, seconds) {
    const found = new Map();
    for (let s = 0; s <= seconds; s += 1) {
      const [x, y] = route(t + s);
      chunksIn(
        snap(
          grow(
            {
              x0: x + view.x0,
              x1: x + view.x1,
              y0: y + view.y0,
              y1: y + view.y1,
            },
            MARGIN
          )
        )
      ).forEach((each) => found.set(each.id, each));
    }
    return [...found.values()];
  }

  function remount(region, t) {
    const rebase =
      !origin ||
      Math.hypot(position[0] - origin[0], position[1] - origin[1]) > REBASE;
    if (rebase) {
      origin = [...position];
      stamp += 1;
    }
    mounted = leavesIn(region).map((leaf) => ({ content: place(leaf), leaf }));
    const first = !patchAt;
    const half = [
      (region.x1 - region.x0) / 2 + 1,
      (region.y1 - region.y0) / 2 + 1,
    ];
    const middle = [
      (region.x0 + region.x1) / 2 - origin[0],
      (region.y0 + region.y1) / 2 - origin[1],
    ];
    shell.chassis = [chassisBox(style, half[0], half[1], ...middle)];
    shell.bounds = {
      max: [middle[0] + half[0], middle[1] + half[1], 0.6],
      min: [middle[0] - half[0], middle[1] - half[1], -0.5],
    };
    const held = mounted.map((m) => m.content);
    settle(shell, held);
    // The patch's sockets index the modules it was composed over.
    if (patchModules) shell.modules = patchModules;
    if (first)
      sweepOrder(
        held.flatMap((content) => content.modules),
        half,
        hash01(salt, 1) * Math.PI * 2,
        salt
      );
    const keep = new Set(chunksIn(grow(region, BAKE_AHEAD)).map((c) => c.id));
    chunks.forEach((found, id) => {
      if (keep.has(id)) return;
      found.leaves.forEach((leaf) => {
        const content = contents.get(leaf.key);
        if (!content) return;
        register.retire(content);
        contents.delete(leaf.key);
      });
      if (!tile) bakes.delete(id);
      chunks.delete(id);
    });
    if (first) {
      along(t, WARM).forEach(baked);
      compose(chunksIn(region), { wait: true });
    } else due = chunksIn(region);
  }

  // Work for what is coming, a little a frame: the content just ahead
  // first, then the cables of chunks further out, settled for BAKE_BUDGET
  // ms a frame, so a chunk's bake is done before it is mounted.
  function prefetch(region, t) {
    const leaf = leavesIn(grow(region, PREFETCH)).find(
      (v) => !contents.has(v.key)
    );
    if (leaf) {
      contentFor(leaf);
      return;
    }
    // Nearest first to where the view will be in LOOK_AHEAD seconds.
    const [x0, y0] = route(t);
    const [x1, y1] = route(t + LOOK_AHEAD);
    const soon = {
      x0: region.x0 + x1 - x0,
      x1: region.x1 + x1 - x0,
      y0: region.y0 + y1 - y0,
      y1: region.y1 + y1 - y0,
    };
    const ahead = chunksIn(grow(region, BAKE_AHEAD)).sort(
      (a, b) => distance(a.box, soon) - distance(b.box, soon)
    );
    const waiting = ahead.find((found) => !bakes.has(patternOf(found)));
    if (waiting) {
      const missing = waiting.leaves.find((v) => !contents.has(v.key));
      if (missing) contentFor(missing);
      else startBake(waiting);
      return;
    }
    const settling =
      [...pending]
        .map((key) => bakes.get(key))
        .find((bake) => bake && !bake.done) ??
      ahead
        .map((found) => bakes.get(patternOf(found)))
        .find((bake) => !bake.done);
    if (settling) stepBake(settling, BAKE_BUDGET);
    if ([...pending].some((key) => bakes.get(key)?.done)) compose(composed);
  }

  return {
    panel: shell,
    get chassis() {
      return shell.chassis;
    },
    get statics() {
      return shell.statics;
    },
    // Where the mounted panel sits under the view now: the renderer moves
    // the panel by it and the pointer takes it off.
    offset,
    route,
    // Every field leaf in a box (cells, x right, y up).
    leavesIn,
    // Mounted chunks still showing without their cables.
    get waiting() {
      return pending.size;
    },
    // The cables over what is mounted now: a new patch at every remount.
    get patch() {
      return patch;
    },
    // Where to read the cables as they are now (the session's patch, which
    // a hand may have edited) when the next patch carries them over.
    attach(session) {
      live = () => session.patch;
    },
    // New patch settings: every chunk patches again from scratch.
    repatch(next) {
      patchConfig = next;
      bakes.clear();
      patch = null;
      patchAt = null;
      regionKey = null;
    },
    update(t, nextView = view) {
      view = nextView;
      position = route(t);
      const seen = {
        x0: position[0] + view.x0,
        x1: position[0] + view.x1,
        y0: position[1] + view.y0,
        y1: position[1] + view.y1,
      };
      const region = snap(grow(seen, MARGIN));
      const key = `${region.x0},${region.x1},${region.y0},${region.y1}`;
      let changed = false;
      const far =
        origin &&
        Math.hypot(position[0] - origin[0], position[1] - origin[1]) > REBASE;
      if (key !== regionKey || far) {
        regionKey = key;
        remount(region, t);
        if (eager && due) {
          compose(due, { wait: true });
          due = null;
        }
        changed = true;
      } else if (eager) {
        due = null;
      } else if (due) {
        compose(due);
        due = null;
      } else prefetch(region, t);
      offset[0] = origin[0] - position[0];
      offset[1] = origin[1] - position[1];
      const look = grow(seen, 0.5);
      visible = mounted.filter(({ leaf }) => overlaps(leaf.box, look));
      return changed;
    },
    pose({ audio = null, build = null, overrides = null, t }) {
      const frame = poseFrame(register.controls, config, { audio, t });
      const out = [];
      visible.forEach(({ content }) =>
        content.modules.forEach((module) => {
          const sink =
            build == null
              ? 0
              : buildSink(module.order ?? 1, build, config.buildSeconds);
          poseModule(module, frame, out, {
            move: sink ? { offset: [0, 0, -sink] } : null,
            overrides,
            statics: build != null,
          });
        })
      );
      return out;
    },
  };
}
