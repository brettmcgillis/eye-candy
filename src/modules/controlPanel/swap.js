import { createRng } from '@modules/flora';

import {
  LOOSE_IDS,
  SOCKET_IDS,
  bindLoose,
  buildContent,
  createControlRegister,
} from './content';
import { AREAS, INVENTORY } from './controls';
import {
  clamp01,
  easeInCubic,
  easeInOutBack,
  easeOutBack,
  smooth,
} from './easing';
import { blockGrid, subdivide } from './layout';
import { CHASSIS_TOP, PLATE_DEPTH, chassisBox } from './panel';
import { quatX, quatY } from './parts';
import patchColliders from './patchColliders';
import { distance, socketTop } from './patchUtils';
import { STILL_TIME, buildSink, poseFrame, poseModule } from './pose';
import { createShell, mountAt, settle, sweepOrder } from './show';
import { hash01 } from './signals';
import { collectSockets } from './sockets';
import createStyle from './style';

// Swap: a panel the size of the view whose modules are replaced in waves.
// Every `period` an event plays out over `span`: a flip (plates turn over
// on their axis, the new control on the far side), a rise (the old module
// sinks into the chassis, the new one pops up and settles) or a slide (a
// band of the panel runs along like a conveyor, modules leaving off one edge
// of the view and new ones arriving at the other). Events replay in order
// from the first, so the panel at `t` is a pure function of the config.
export const SWAP_KINDS = ['flip', 'slide', 'rise'];
const KIND_KEYS = { flip: 'swapFlip', rise: 'swapRise', slide: 'swapSlide' };
const PATTERNS = ['ripple', 'sweep', 'scatter'];

const REST = 0.6;
const PIVOT_Z = -PLATE_DEPTH / 2;
const FLIP_BACK = 0.8;
// A plug pops this long before its module moves, flicked up and out by
// POP_KICK (cells per rope tick); a hand puts each loose end back over
// REPLUG_SECONDS, lifted REPLUG_ARC on the way.
const POP_LEAD = 0.35;
// Share of socket modules handed over to socket modules, so the leads they
// drop have somewhere to go.
const KEEP_SOCKETS = 0.7;

// Every module takes the next Inventory entry that fits it from a deck
// shuffled afresh each round, so every control and variant comes round.
const SOCKET_DECK = INVENTORY.filter((entry) => SOCKET_IDS.includes(entry.id));
// The whole Inventory, its socket entries SOCKET_COPIES times over so the
// panel has leads to show.
const SOCKET_COPIES = 2;
const DECK = [
  ...INVENTORY,
  ...Array.from({ length: SOCKET_COPIES - 1 }, () => SOCKET_DECK).flat(),
];
const isPrinter = (entry) => LOOSE_IDS.includes(entry?.id);
// Blanks and nameplates only on small modules (a big one reads as a hole);
// a unit entry tiles any module as a bank.
function fitsLeaf(entry, { h, w }) {
  if (entry.kind === 'unit') return true;
  if (entry.id === 'blank' || entry.id === 'badge') return w * h <= 3;
  if (entry.id === 'cluster') return w >= 2 && h >= 2;
  // Variants the builders only draw at some shapes.
  if (entry.id === 'screen' && entry.variant === 'radar' && w !== h)
    return false;
  if (entry.id === 'speaker' && entry.variant === 'cone' && Math.min(w, h) < 2)
    return false;
  return AREAS[entry.id].fits({ h, variant: entry.variant, w });
}
const POP_KICK = [0, 0.004, 0.012];
const REPLUG_SECONDS = 1.1;
const REPLUG_ARC = 0.55;
// How far past its length a hand may pull a lead to a socket.
const STRETCH = 1.2;
// A loose end with no free socket in reach tries again this much later.
const RETRY = 2;
// The flip's share of its time spent lifting out of (and setting back into)
// its seat, and how far its lowest corner keeps above the chassis top.
const SEAT = 0.16;
const FLIP_CLEARANCE = 0.05;

const BURY = 1.1;
const RISE_BACK = 1.6;
const WOBBLE = 0.05;
const SLIDE_BACK = 0.5;
const SLIDE_LIFT = 0.05;
// Slides travel about this share of their band's length, never less than
// MIN_TRAVEL cells.
const TRAVEL = 0.45;
const MIN_TRAVEL = 2;

export const swapKinds = (config) =>
  SWAP_KINDS.filter((kind) => config[KIND_KEYS[kind]]);

export function swapTiming(config) {
  const span = config.swapSeconds + config.swapStagger;
  return { period: Math.max(config.swapEvery, span + REST), span };
}

const eventTime = (k, period) => STILL_TIME + (k + 1) * period;

export default function createSwapShow(config, { cols, rows }) {
  const style = createStyle(config);
  const salt = Math.imul(config.seed + 1, 2654435761);
  // Event k's dice: `channel` keeps unrelated choices from sharing a stream.
  const die = (k, channel, n = 0) =>
    hash01(salt + Math.imul(k + 2, 7919) + Math.imul(channel, 104729), n);
  const kinds = swapKinds(config);
  const { period, span } = swapTiming(config);
  const register = createControlRegister();
  const hw = cols / 2;
  const hh = rows / 2;
  const chassis = [chassisBox(style, hw, hh)];
  const shell = createShell({
    bounds: { max: [hw, hh, 0.6], min: [-hw, -hh, -0.5] },
    chassis,
    controls: register.controls,
  });

  const center = (leaf) => [
    -hw + leaf.x + leaf.w / 2,
    hh - leaf.y - leaf.h / 2,
  ];

  const cache = new Map();
  // Which leaf (by content seed) owns each control key, so a socket id
  // ("key:local") names the module a plug sits in.
  const owners = new Map();
  const ownerOf = (socketId) => owners.get(Number(socketId.split(':')[0]));
  function contentFor(leaf) {
    let content = cache.get(leaf.seed);
    if (content) return content;
    content = buildContent(config, leaf, `${config.seed}:swap:${leaf.seed}`, {
      style,
    });
    register.add(content);
    content.controls.forEach((control) => owners.set(control.key, leaf.seed));
    content.modules.forEach((module, i) =>
      Object.assign(module, {
        order: 0.3 + 0.4 * hash01(salt, register.controls.length + i),
      })
    );
    cache.set(leaf.seed, content);
    return content;
  }
  // A leaf's content mounted at its seat (a printer tears its paper off and
  // drops it out of frame).
  function seat(leaf) {
    const content = contentFor(leaf);
    const at = center(leaf);
    const moved = content.at?.[0] !== at[0] || content.at?.[1] !== at[1];
    mountAt(content, at);
    if (moved) bindLoose(content);
    return content;
  }

  // The deck: `left` is what this round has still to deal, in its order.
  const roundOf = (round) => {
    const rng = createRng(`${config.seed}:swap:deck:${round}`);
    const order = DECK.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  };
  // The entry `leaf` takes and the deck after it. A big module looks for an
  // area control before a unit bank; a socket module's successor usually
  // gets sockets again (not taken from the deck); `avoid` rules some out.
  function deal(deck, leaf, { avoid = () => false, sockets = false, n = 0 }) {
    const ok = (entry) => fitsLeaf(entry, leaf) && !avoid(entry);
    if (sockets) {
      const options = SOCKET_DECK.filter(ok);
      if (options.length)
        return [options[Math.floor(hash01(salt, n) * options.length)], deck];
    }
    const find = (left, test) => left.findIndex((i) => test(DECK[i]));
    let at =
      leaf.w * leaf.h >= 4
        ? find(deck.left, (entry) => ok(entry) && entry.kind !== 'unit')
        : -1;
    if (at < 0) at = find(deck.left, ok);
    if (at < 0) {
      const ahead = roundOf(deck.round + 1);
      return [DECK[ahead[Math.max(find(ahead, ok), 0)]], deck];
    }
    const entry = DECK[deck.left[at]];
    const left = deck.left.filter((_, i) => i !== at);
    return [
      entry,
      left.length
        ? { left, round: deck.round }
        : { left: roundOf(deck.round + 1), round: deck.round + 1 },
    ];
  }
  const hadSockets = (leaf) => SOCKET_IDS.includes(leaf.entry?.id);

  const layoutRng = createRng(`${config.seed}:swap:layout`);
  const region = { h: rows, w: cols };
  const initial = (
    config.layoutMode === 'grid'
      ? blockGrid(config, layoutRng, region)
      : subdivide(config, layoutRng, region)
  ).leaves.map((leaf, id) => ({
    h: leaf.h,
    id,
    prev: null,
    seed: `0:${id}`,
    w: leaf.w,
    x: leaf.x,
    y: leaf.y,
  }));
  let opening = { left: roundOf(0), round: 0 };
  initial.forEach((leaf) => {
    const [entry, deck] = deal(opening, leaf, {});
    Object.assign(leaf, { entry });
    opening = deck;
  });

  initial.forEach(seat);
  sweepOrder(
    initial.flatMap((leaf) => contentFor(leaf).modules),
    [hw, hh],
    die(-1, 12) * Math.PI * 2,
    salt
  );
  settle(
    shell,
    initial.map((leaf) => contentFor(leaf))
  );
  shell.sockets = collectSockets(shell.modules);

  // ----- cables -----
  // The session's patch, once the scene attaches one. A cable lying over a
  // module that is not plugged into it blocks that module (nothing turns,
  // sinks or slides out from under it); a cable plugged into a module that
  // is about to move pops out first and is plugged back in afterwards.
  let live = () => null;
  function cableLay() {
    const patch = live();
    if (!patch) return [];
    const { positions } = patch.world;
    return patch.world.ropes.map((rope, c) => {
      const cells = new Set();
      for (let n = rope.start; n < rope.start + rope.count; n += 1) {
        const x = Math.floor(positions[n * 3] + hw);
        const y = Math.floor(hh - positions[n * 3 + 1]);
        if (x >= 0 && y >= 0 && x < cols && y < rows) cells.add(y * cols + x);
      }
      return {
        cells,
        owners: new Set(
          patch.cables[c].ends.filter(Boolean).map((end) => ownerOf(end))
        ),
      };
    });
  }
  // Whether a cable not plugged into any of `leaves` lies over one of them.
  function blocked(leaves, lay) {
    const seeds = new Set(leaves.map((leaf) => leaf.seed));
    return lay.some(
      (cable) =>
        ![...cable.owners].some((seed) => seeds.has(seed)) &&
        leaves.some((leaf) => {
          for (let dy = 0; dy < leaf.h; dy += 1)
            for (let dx = 0; dx < leaf.w; dx += 1)
              if (cable.cells.has((leaf.y + dy) * cols + leaf.x + dx))
                return true;
          return false;
        })
    );
  }

  // ----- the events, planned in order from the panel before each -----

  function waveDelays(k, leaves) {
    const pattern = PATTERNS[Math.floor(die(k, 2) * PATTERNS.length)];
    let f;
    if (pattern === 'scatter') {
      f = leaves.map((leaf) => die(k, 3, leaf.id));
    } else {
      const at = leaves.map(center);
      let d;
      if (pattern === 'ripple') {
        const o = [(die(k, 4) * 2 - 1) * hw, (die(k, 4, 1) * 2 - 1) * hh];
        d = at.map(([x, y]) => Math.hypot(x - o[0], y - o[1]));
      } else {
        const a = die(k, 4, 2) * Math.PI * 2;
        d = at.map(([x, y]) => x * Math.cos(a) + y * Math.sin(a));
      }
      const lo = Math.min(...d);
      const range = Math.max(...d) - lo || 1;
      f = d.map((v) => (v - lo) / range);
    }
    return f.map((v) => v * config.swapStagger);
  }

  function planReplace(kind, k, state) {
    const lay = cableLay();
    // Printers never flip: their paper, leaning out below the module, would
    // swing through the neighbours. They come and go by rising or sliding.
    const free = state.leaves.filter(
      (leaf) =>
        !blocked([leaf], lay) && !(kind === 'flip' && isPrinter(leaf.entry))
    );
    if (free.length === 0) return null;
    let chosen = free.filter((leaf) => die(k, 5, leaf.id) < config.swapShare);
    if (chosen.length === 0)
      chosen = [free[Math.floor(die(k, 1) * free.length)]];
    const delays = waveDelays(k, chosen);
    let { deck, nextId } = state;
    const axis = die(k, 6) < 0.5 ? 'x' : 'y';
    const sign = die(k, 6, 1) < 0.5 ? 1 : -1;
    const replaced = new Map();
    const items = chosen.map((from, i) => {
      const [entry, after] = deal(deck, from, {
        avoid: kind === 'flip' ? isPrinter : undefined,
        n: nextId,
        sockets: hadSockets(from) && die(k, 14, from.id) < KEEP_SOCKETS,
      });
      deck = after;
      const to = {
        ...from,
        entry,
        id: nextId,
        prev: from,
        seed: `${k + 1}:${from.id}`,
      };
      nextId += 1;
      replaced.set(from.id, to);
      return {
        axis,
        delay: delays[i],
        from,
        kind,
        sign,
        to,
        wobble: die(k, 7, from.id) * Math.PI * 2,
      };
    });
    return {
      deck,
      items,
      leaves: state.leaves.map((leaf) => replaced.get(leaf.id) ?? leaf),
      nextId,
    };
  }

  function planSlide(k, state) {
    const alongX = die(k, 8) < 0.5;
    const length = alongX ? cols : rows;
    const across = alongX ? rows : cols;
    const pos = (leaf) => (alongX ? leaf.x : leaf.y);
    const len = (leaf) => (alongX ? leaf.w : leaf.h);
    const crossPos = (leaf) => (alongX ? leaf.y : leaf.x);
    const crossLen = (leaf) => (alongX ? leaf.h : leaf.w);
    const cuts = [0];
    for (let c = 1; c < across; c += 1) {
      const straddled = state.leaves.some(
        (leaf) => crossPos(leaf) < c && crossPos(leaf) + crossLen(leaf) > c
      );
      if (!straddled) cuts.push(c);
    }
    cuts.push(across);
    const bands = [];
    const lay = cableLay();
    for (let i = 0; i + 1 < cuts.length; i += 1) {
      const [lo, hi] = [cuts[i], cuts[i + 1]];
      const leaves = state.leaves.filter(
        (leaf) => crossPos(leaf) >= lo && crossPos(leaf) < hi
      );
      if (!blocked(leaves, lay)) bands.push({ hi, index: i, leaves, lo });
    }
    if (bands.length === 0) return null;
    let chosen = bands.filter(
      (band) => die(k, 9, band.index) < config.swapShare
    );
    if (chosen.length === 0)
      chosen = [bands[Math.floor(die(k, 1) * bands.length)]];
    let { deck, nextId } = state;
    const involved = new Set();
    const next = [];
    const items = chosen.map((band, j) => {
      const dir = die(k, 10, band.index) < 0.5 ? -1 : 1;
      const travel = [];
      for (let c = 1; c < length; c += 1) {
        const straddled = band.leaves.some(
          (leaf) => pos(leaf) < c && pos(leaf) + len(leaf) > c
        );
        if (!straddled) travel.push(dir < 0 ? c : length - c);
      }
      travel.push(length);
      const target =
        MIN_TRAVEL +
        die(k, 11, band.index) * Math.max(length * TRAVEL - MIN_TRAVEL, 0);
      const d = travel.reduce((best, v) =>
        Math.abs(v - target) < Math.abs(best - target) ? v : best
      );
      const leaving = [];
      const staying = [];
      band.leaves.forEach((leaf) => {
        involved.add(leaf.id);
        const exits =
          dir < 0 ? pos(leaf) + len(leaf) <= d : pos(leaf) >= length - d;
        if (exits) {
          leaving.push(leaf);
          return;
        }
        const moved = alongX
          ? { ...leaf, x: leaf.x + dir * d }
          : { ...leaf, y: leaf.y + dir * d };
        staying.push({ from: leaf, to: moved });
        next.push(moved);
      });
      const start = dir < 0 ? length - d : 0;
      const gap = alongX
        ? { h: band.hi - band.lo, w: d, x: start, y: band.lo }
        : { h: d, w: band.hi - band.lo, x: band.lo, y: start };
      const fresh = subdivide(
        config,
        createRng(`${config.seed}:swap:${k}:${band.index}`),
        gap
      ).leaves.map((leaf, i) => {
        const [entry, after] = deal(deck, leaf, { n: nextId });
        deck = after;
        const entering = {
          entry,
          h: leaf.h,
          id: nextId,
          prev: null,
          seed: `${k + 1}:b${band.index}:${i}`,
          w: leaf.w,
          x: leaf.x,
          y: leaf.y,
        };
        nextId += 1;
        return entering;
      });
      next.push(...fresh);
      return {
        alongX,
        d,
        delay:
          chosen.length > 1
            ? (config.swapStagger * j) / (chosen.length - 1)
            : 0,
        dir,
        entering: fresh,
        kind: 'slide',
        leaving,
        staying,
      };
    });
    return {
      deck,
      items,
      leaves: [
        ...state.leaves.filter((leaf) => !involved.has(leaf.id)),
        ...next,
      ],
      nextId,
    };
  }

  const states = [
    { deck: opening, kind: null, leaves: initial, nextId: initial.length },
  ];
  const events = [];
  function plan(k) {
    while (events.length <= k) {
      const index = events.length;
      const state = states[index];
      const options = kinds.filter(
        (kind) => kinds.length < 2 || kind !== state.kind
      );
      let kind = options[Math.floor(die(index, 0) * options.length)];
      let planned = kind === 'slide' ? planSlide(index, state) : null;
      if (kind === 'slide' && !planned) kind = kinds.find((v) => v !== 'slide');
      if (kind && kind !== 'slide') planned = planReplace(kind, index, state);
      const event = {
        items: planned?.items ?? [],
        kind: planned ? kind : null,
        start: eventTime(index, period),
      };
      events.push(event);
      states.push(
        planned
          ? {
              deck: planned.deck,
              kind,
              leaves: planned.leaves,
              nextId: planned.nextId,
            }
          : { ...state, kind: null }
      );
    }
    return events[k];
  }

  const arrivals = (event) =>
    event.items.flatMap((item) =>
      item.kind === 'slide' ? item.entering : [item.to]
    );
  const departures = (event) =>
    event.items.flatMap((item) =>
      item.kind === 'slide'
        ? [...item.leaving, ...item.staying.map((s) => s.from)]
        : [item.from]
    );

  // ----- where the show is at `t` -----

  let phase = null;
  let current = initial;
  let active = null;
  let settled = [];
  const at = (t) => {
    if (kinds.length === 0 || t < eventTime(0, period)) return { k: -1 };
    const k = Math.floor((t - STILL_TIME) / period) - 1;
    return { k, playing: t < eventTime(k, period) + span };
  };

  function retireUnused(keep) {
    cache.forEach((content, seed) => {
      if (keep.has(seed)) return;
      register.retire(content);
      cache.delete(seed);
    });
  }

  // Each item's plugs pop out POP_LEAD before it moves; the loose ends wait
  // for the event to finish, then a hand plugs them back in one at a time.
  let tended = null;
  let popped = new Set();
  let waiting = [];
  let hand = null;

  // After the settled panel changes, the patch knows its sockets (a plug
  // left in one that went falls out) and its cables rest on what is there.
  // Modules on their way out keep their sockets until their plugs pop.
  function restock(t = -Infinity) {
    shell.sockets = collectSockets(shell.modules);
    const patch = live();
    if (!patch) return;
    const leaving = active
      ? departures(active).flatMap((leaf) => contentFor(leaf).modules)
      : [];
    patch
      .setSockets([...shell.sockets, ...collectSockets(leaving)])
      .forEach(([cable, end]) =>
        waiting.push({ cable, end, ready: t + RETRY })
      );
    patch.setColliders(
      patchColliders({
        bounds: shell.bounds,
        chassis,
        controls: settled.flatMap((content) => content.controls),
        modules: shell.modules,
      })
    );
  }

  const departing = (item) =>
    item.kind === 'slide'
      ? [...item.leaving, ...item.staying.map((s) => s.from)]
      : [item.from];

  function pop(patch, item, ready) {
    const seeds = new Set(departing(item).map((leaf) => leaf.seed));
    patch.cables.forEach((cable, c) =>
      cable.ends.forEach((end, e) => {
        if (!end || !seeds.has(ownerOf(end))) return;
        patch.unplug(c, e, POP_KICK);
        waiting.push({ cable: c, end: e, ready });
      })
    );
  }

  // A free socket for a loose end: within the cable's reach of its other
  // end, not right beside it, picked by the dice.
  function socketFor(patch, cable, end, k) {
    const rope = patch.world.ropes[cable];
    const { positions } = patch.world;
    const other = patch.cables[cable].ends[1 - end];
    const node = end === 0 ? rope.start + rope.count - 1 : rope.start;
    const from = other
      ? socketTop(patch.sockets.get(other))
      : [...positions.subarray(node * 3, node * 3 + 3)];
    const { length } = patch.cables[cable];
    const going = new Set(
      active ? departures(active).map((leaf) => leaf.seed) : []
    );
    const free = [...patch.sockets.values()].filter(
      (socket) =>
        socket.id !== other &&
        !patch.occupant(socket.id) &&
        !going.has(ownerOf(socket.id))
    );
    const near = (lo, hi) =>
      free.filter((socket) => {
        const d = distance(from, socketTop(socket));
        return d >= lo && d <= hi;
      });
    // Failing any comfortably in reach, any the lead can be stretched to
    // (a lead pulled much longer would widen every rope contact test).
    const options = near(length * 0.25, length * 0.85);
    const pool = options.length ? options : near(0, length * STRETCH);
    if (pool.length === 0) return null;
    return pool[Math.floor(die(k, 13, cable * 2 + end) * pool.length)];
  }

  function tend(t, k) {
    const patch = live();
    if (!patch) return;
    if (patch !== tended) {
      tended = patch;
      popped = new Set();
      waiting = [];
      hand = null;
      restock();
    }
    [k, k + 1].forEach((index) => {
      if (index < 0 || kinds.length === 0) return;
      const event = plan(index);
      event.items.forEach((item, i) => {
        const id = `${index}:${i}`;
        if (popped.has(id) || t < event.start + item.delay - POP_LEAD) return;
        popped.add(id);
        pop(patch, item, event.start + span);
      });
    });
    if (hand) {
      if (patch.grabbed !== hand.grab) {
        waiting.push({ cable: hand.cable, end: hand.end, ready: t + RETRY });
        hand = null;
        return;
      }
      const u = clamp01((t - hand.start) / REPLUG_SECONDS);
      const top = socketTop(hand.target);
      if (u >= 1) {
        patch.move(top, hand.target.id);
        patch.release();
        if (!patch.cables[hand.cable].ends[hand.end])
          waiting.push({ cable: hand.cable, end: hand.end, ready: t + RETRY });
        hand = null;
        return;
      }
      const e = smooth(u);
      patch.move(
        hand.from.map(
          (v, a) =>
            v +
            (top[a] - v) * e +
            (a === 2 ? REPLUG_ARC * Math.sin(Math.PI * u) : 0)
        ),
        null
      );
      return;
    }
    if (patch.grabbed) return;
    const next = waiting.findIndex((entry) => t >= entry.ready);
    if (next < 0) return;
    const [{ cable, end }] = waiting.splice(next, 1);
    if (patch.cables[cable]?.ends[end]) return;
    const target = socketFor(patch, cable, end, k);
    if (!target) {
      waiting.push({ cable, end, ready: t + RETRY });
      return;
    }
    const rope = patch.world.ropes[cable];
    const node = end === 0 ? rope.start : rope.start + rope.count - 1;
    const from = [...patch.world.positions.subarray(node * 3, node * 3 + 3)];
    if (!patch.begin({ cable, end }, from)) return;
    hand = { cable, end, from, grab: patch.grabbed, start: t, target };
  }

  function enter({ k, playing }) {
    const event = k >= 0 ? plan(k) : null;
    const before = states[k + (playing ? 0 : 1)] ?? states[0];
    const moving = new Set(
      playing ? departures(event).map((leaf) => leaf.id) : []
    );
    current = before.leaves;
    const resting = before.leaves.filter((leaf) => !moving.has(leaf.id));
    settled = resting.map((leaf) => seat(leaf));
    active = playing ? event : null;
    if (active) {
      active.items.forEach((item) => {
        if (item.kind === 'slide') {
          [...item.leaving, ...item.staying.map((s) => s.from)].forEach(
            (leaf) => seat(leaf)
          );
        } else seat(item.from);
      });
    }
    settle(shell, settled);
    restock();
    const keep = new Set(resting.map((leaf) => leaf.seed));
    if (active) {
      departures(active).forEach((leaf) => keep.add(leaf.seed));
      arrivals(active).forEach((leaf) => keep.add(leaf.seed));
    }
    arrivals(plan(k + 1)).forEach((leaf) => keep.add(leaf.seed));
    retireUnused(keep);
  }

  // Arrivals are built ahead, one a call, while the panel rests.
  function prefetch(k) {
    if (kinds.length === 0) return;
    const leaf = arrivals(plan(k + 1)).find((v) => !cache.has(v.seed));
    if (leaf) contentFor(leaf);
  }

  const leafMove = (leaf, offset, extra = {}) => {
    const c = center(leaf);
    return { offset, pivot: [c[0], c[1], PIVOT_Z], ...extra };
  };

  function poseContent(content, move, frame, out, overrides) {
    content.modules.forEach((module) =>
      poseModule(module, frame, out, { move, overrides, statics: true })
    );
  }

  function poseItem(item, t, frame, out, overrides) {
    const u = clamp01((t - active.start - item.delay) / config.swapSeconds);
    if (item.kind === 'flip') {
      // Out of its seat, over, and back in: the plate lifts clear first,
      // turns riding high enough that its lowest corner stays above the
      // chassis top at every angle, and sets down once it is face up.
      const raised =
        smooth(clamp01(u / SEAT)) * smooth(clamp01((1 - u) / SEAT));
      const turn =
        Math.PI *
        easeInOutBack(clamp01((u - SEAT) / (1 - 2 * SEAT)), FLIP_BACK);
      const late = turn > Math.PI / 2;
      const leaf = late ? item.to : item.from;
      const angle = item.sign * (late ? turn - Math.PI : turn);
      const q = item.axis === 'x' ? quatX(angle) : quatY(angle);
      const reach = (item.axis === 'x' ? leaf.h : leaf.w) / 2;
      const clear =
        CHASSIS_TOP +
        FLIP_CLEARANCE -
        PIVOT_Z +
        reach * Math.abs(Math.sin(angle)) +
        (PLATE_DEPTH / 2) * Math.abs(Math.cos(angle));
      const content = seat(leaf);
      poseContent(
        content,
        leafMove(leaf, [0, 0, raised * Math.max(clear, 0)], { q }),
        frame,
        out,
        overrides
      );
      return;
    }
    if (item.kind === 'rise') {
      if (u < 0.45) {
        const a = u / 0.45;
        const z =
          a < 0.25
            ? 0.05 * Math.sin((Math.PI * a) / 0.25)
            : -BURY * easeInCubic((a - 0.25) / 0.75);
        const content = seat(item.from);
        poseContent(content, { offset: [0, 0, z] }, frame, out, overrides);
      }
      if (u >= 0.4) {
        const b = (u - 0.4) / 0.6;
        const z = -BURY * (1 - easeOutBack(b, RISE_BACK));
        const tilt = WOBBLE * Math.sin(3 * Math.PI * b) * (1 - b);
        const q = [
          Math.cos(item.wobble) * Math.sin(tilt / 2),
          Math.sin(item.wobble) * Math.sin(tilt / 2),
          0,
          Math.cos(tilt / 2),
        ];
        const content = seat(item.to);
        poseContent(
          content,
          leafMove(item.to, [0, 0, z], { q }),
          frame,
          out,
          overrides
        );
      }
      return;
    }
    const travel = item.dir * item.d * easeInOutBack(u, SLIDE_BACK);
    const lift = SLIDE_LIFT * Math.sin(Math.PI * u);
    const shift = (s) => (item.alongX ? [s, 0, lift] : [0, -s, lift]);
    [...item.leaving, ...item.staying.map((s) => s.from)].forEach((leaf) =>
      poseContent(seat(leaf), { offset: shift(travel) }, frame, out, overrides)
    );
    item.entering.forEach((leaf) =>
      poseContent(
        seat(leaf),
        { offset: shift(travel - item.dir * item.d) },
        frame,
        out,
        overrides
      )
    );
  }

  return {
    panel: shell,
    get chassis() {
      return chassis;
    },
    get statics() {
      return shell.statics;
    },
    offset: [0, 0],
    // Reads the cables as they are now from the session's patch.
    attach(session) {
      live = () => session.patch;
    },
    // The leaves (cells, top-left origin) the panel holds before the event
    // under way, or after the last one, and that event's kind.
    get leaves() {
      return current;
    },
    get playing() {
      return active?.kind ?? null;
    },
    // Moves the show to `t`; true when what is settled (the static layers
    // and the hits) changed.
    update(t) {
      const now = at(t);
      const key = `${now.k}:${now.playing ? 1 : 0}`;
      let changed = false;
      if (key !== phase) {
        phase = key;
        enter(now);
        changed = true;
      } else if (!now.playing) prefetch(now.k);
      tend(t, now.k);
      return changed;
    },
    pose({ audio = null, build = null, overrides = null, t }) {
      const frame = poseFrame(register.controls, config, { audio, t });
      const out = [];
      settled.forEach((content) =>
        content.modules.forEach((module) => {
          const sink =
            build == null
              ? 0
              : buildSink(module.order, build, config.buildSeconds);
          poseModule(module, frame, out, {
            move: sink ? { offset: [0, 0, -sink] } : null,
            overrides,
            statics: build != null,
          });
        })
      );
      active?.items.forEach((item) => poseItem(item, t, frame, out, overrides));
      return out;
    },
  };
}
