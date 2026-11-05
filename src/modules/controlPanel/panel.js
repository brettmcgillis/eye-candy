import { createRng } from '@modules/flora';

import {
  AREAS,
  UNITS,
  buildBadge,
  buildBlank,
  layoutInventory,
  pickWeighted,
} from './controls';
import { decodeDesign } from './design';
import fillDesign from './designBuild';
import { placeHit } from './hits';
import createKit, { INK } from './kit';
import { blockGrid, packCircles, subdivide } from './layout';
import { part, placeAll, placeBounds } from './parts';
import { rollSignal } from './signals';
import { collectSockets } from './sockets';
import createStyle from './style';

export const PLATE_DEPTH = 0.15;
export const CHASSIS_TOP = -0.06;
const CHASSIS_BACK = -0.5;
const RIM = 0.32;
const NEST_SCALE = 0.5;
const NEST_SINK = 0.05;
// Packed circles keep this far inside their plate, clear of the seam.
const PACK_INSET = 0.1;
// Every module's contents are drawn at a scale that leaves this much bare
// plate (in grid cells) inside its seams on the tighter axis.
const MODULE_PAD = 0.1;
// Larger modules always get a control; a blank or nameplate that big
// reads as a hole in the panel.
const BLANK_MAX_CELLS = 3;
const SCREW_R = 0.026;
const SCREW_INSET = 0.08;
const isPlate = (item) => item?.g === 'box' || item?.g === 'rbox';

const padOf = ({ h, w }) =>
  Math.min((w - 2 * MODULE_PAD) / w, (h - 2 * MODULE_PAD) / h);

export function createBuildContext(
  config,
  { exclude = null, seed = config.seed, style = createStyle(config) } = {}
) {
  const rng = createRng(`${seed}:layout`);
  let kits = 0;
  const kitFor = () => {
    kits += 1;
    return createKit(style, createRng(`${seed}:kit:${kits}`), {
      labelled: rng() < config.labelChance,
    });
  };
  return {
    config,
    exclude,
    kitFor,
    rng,
    screws: createKit(style, createRng(`${seed}:screws`)),
    style,
  };
}

const UNIT_ENTRIES = Object.entries(UNITS);

// The catalogue a build may roll from: everything, or all but `exclude`.
const allowed = (entries, exclude) =>
  exclude ? entries.filter(([id]) => !exclude.has(id)) : entries;
const unitsOf = (context) => allowed(UNIT_ENTRIES, context.exclude);

// Silkscreen that would spill past its module (a legend wider than a small
// bank tile) is left off rather than printed over the seam.
// `clip` is a module's half extents, or a packed circle `{ r, x, y }`.
const inside = (item, clip) => {
  if (item.g !== 'box' || item.s[2] > INK) return true;
  if (clip.r != null) {
    const reach = Math.hypot(item.p[0] - clip.x, item.p[1] - clip.y);
    return reach + Math.max(item.s[0], item.s[1]) <= clip.r;
  }
  return (
    Math.abs(item.p[0]) + item.s[0] <= clip[0] &&
    Math.abs(item.p[1]) + item.s[1] <= clip[1]
  );
};

function makeControl(id, built, transform, rng, clip) {
  return {
    hits: built.hits ?? [],
    sockets: built.sockets ?? [],
    id,
    bind: built.bind,
    live: Boolean(built.live),
    loose: Boolean(built.loose),
    pose: built.pose,
    signals: built.signals.map((want) => rollSignal(rng, want)),
    statics: placeAll(
      built.statics.filter((item) => inside(item, clip)),
      transform
    ),
    transform,
  };
}

// Circles packed in a w × h box, each a round control scaled to fill it.
function packRound(context, { h, w }, transform, packing) {
  const { config, kitFor, rng } = context;
  const roundEntries = unitsOf(context).filter(([, entry]) => entry.round);
  const circles = packCircles(rng, {
    hh: h / 2 - PACK_INSET,
    hw: w / 2 - PACK_INSET,
    ...packing,
  });
  return circles.map(({ r, x, y }) => {
    const choices = roundEntries.filter(
      ([id]) => (id !== 'jack' || r < 0.4) && (id !== 'eStop' || r > 0.3)
    );
    const id = pickWeighted(rng, choices, config.domain, config.domainBias);
    const k = r / UNITS[id].round;
    const control = makeControl(
      id,
      UNITS[id].build(kitFor(), { domain: config.domain, k, x, y }),
      transform,
      rng,
      { r, x, y }
    );
    return { ...control, at: [x, y] };
  });
}

const SPECIALS = { badge: buildBadge, blank: buildBlank };

// One unit control tiled across a module, a cell each.
function bankOf(context, leaf, transform, id, variant = undefined) {
  const { config, kitFor, rng } = context;
  const clip = [leaf.w / 2, leaf.h / 2];
  const controls = [];
  for (let cy = 0; cy < leaf.h; cy += 1) {
    for (let cx = 0; cx < leaf.w; cx += 1) {
      const x = cx + 0.5 - leaf.w / 2;
      const y = leaf.h / 2 - cy - 0.5;
      controls.push(
        makeControl(
          id,
          UNITS[id].build(kitFor(), { domain: config.domain, variant, x, y }),
          transform,
          rng,
          clip
        )
      );
    }
  }
  return controls;
}

// An Inventory module: exactly the control and variant its entry names (a
// unit entry on a bigger module tiles it into a bank).
function fillEntry(context, leaf, transform, build) {
  const { config, kitFor } = context;
  const { id, kind, variant } = leaf.entry;
  const size = { h: leaf.h, variant, w: leaf.w };
  if (id === 'cluster') {
    return packRound(context, size, transform, {
      maxR: Math.min(leaf.w, leaf.h) * 0.45,
      minR: 0.2,
      tries: 900,
    });
  }
  if (kind === 'unit' && (leaf.w > 1 || leaf.h > 1))
    return bankOf(context, leaf, transform, id, variant);
  if (kind === 'unit') {
    return build(
      id,
      UNITS[id].build(kitFor(), { domain: config.domain, variant })
    );
  }
  return build(id, (SPECIALS[id] ?? AREAS[id].build)(kitFor(), size));
}

function fillLeaf(context, leaf, transform) {
  if (leaf.design) return fillDesign(context, leaf, transform, makeControl);
  const { config, kitFor, rng } = context;
  const size = { h: leaf.h, w: leaf.w };
  const clip = [leaf.w / 2, leaf.h / 2];
  const build = (id, built) => [makeControl(id, built, transform, rng, clip)];
  if (leaf.entry) return fillEntry(context, leaf, transform, build);
  const kit = kitFor();

  if (rng() < config.blankChance && leaf.w * leaf.h <= BLANK_MAX_CELLS) {
    const badge = rng() < 0.4;
    return build(
      badge ? 'badge' : 'blank',
      (badge ? buildBadge : buildBlank)(kit, size)
    );
  }
  const unitEntries = unitsOf(context);
  if (leaf.w === 1 && leaf.h === 1) {
    const id = pickWeighted(rng, unitEntries, config.domain, config.domainBias);
    return build(id, UNITS[id].build(kit, { domain: config.domain }));
  }
  if (leaf.w >= 2 && leaf.h >= 2 && rng() < config.clusterChance) {
    return packRound(context, size, transform, {
      maxR: Math.min(leaf.w, leaf.h) * 0.45,
      minR: 0.2,
      tries: 900,
    });
  }
  const areas = allowed(Object.entries(AREAS), context.exclude).filter(
    ([, entry]) => entry.fits(size)
  );
  if (areas.length === 0 || rng() < config.arrayChance) {
    const id = pickWeighted(rng, unitEntries, config.domain, config.domainBias);
    return bankOf(context, leaf, transform, id);
  }
  const id = pickWeighted(rng, areas, config.domain, config.domainBias);
  return build(id, AREAS[id].build(kit, size));
}

// The leaves of `region` (grid cells of `scale` world units, top-left at
// `origin`) dressed as modules: a plate each and the controls on it.
// A module plate is held on by a screw in each corner, inside the plate's
// margin and clear of its contents' padding.
function plateScrews(kit, { p: [x, y, z], s: [hw, hh, d] }) {
  return [-1, 1].flatMap((sx) =>
    [-1, 1].flatMap((sy) =>
      kit.screw(
        x + sx * (hw - SCREW_INSET),
        y + sy * (hh - SCREW_INSET),
        SCREW_R,
        z + d
      )
    )
  );
}

export function buildModules(context, region, { depth, origin, scale }) {
  const { config, rng, style } = context;
  let layout = region.layout ?? null;
  if (!layout) {
    layout =
      config.layoutMode === 'grid' && depth === 0
        ? blockGrid(config, rng, region)
        : subdivide(config, rng, region);
  }
  const { leaves, zones } = layout;
  const modules = [];
  leaves.forEach((leaf) => {
    const leafContext = leaf.design
      ? createBuildContext(config, {
          seed: `design:${leaf.design.id}:${leaf.design.seed}`,
          style,
        })
      : context;
    const cx = origin[0] + (leaf.x + leaf.w / 2) * scale;
    const cy = origin[1] - (leaf.y + leaf.h / 2) * scale;
    const dice = leaf.design ? leafContext.rng : rng;
    const dz = depth === 0 ? (dice() * 2 - 1) * config.relief : 0;
    const hw = (leaf.w * scale - config.seam * scale) / 2;
    const hh = (leaf.h * scale - config.seam * scale) / 2;
    const shade = 1 + (dice() * 2 - 1) * config.plateJitter;
    const plate = part(
      'rbox',
      [cx, cy, dz - PLATE_DEPTH / 2],
      [hw, hh, PLATE_DEPTH / 2],
      style.plate(shade, leaf.zone)
    );
    const transform = { offset: [cx, cy, dz], scale: scale * padOf(leaf) };
    if (
      !leaf.entry &&
      !leaf.design &&
      depth < 1 &&
      leaf.w >= 3 &&
      leaf.h >= 2 &&
      rng() < config.nestChance
    ) {
      const cells = {
        h: Math.round(leaf.h / NEST_SCALE) - 1,
        w: Math.round(leaf.w / NEST_SCALE) - 1,
      };
      const inner = scale * NEST_SCALE;
      const nested = buildModules(context, cells, {
        depth: depth + 1,
        origin: [cx - (cells.w * inner) / 2, cy + (cells.h * inner) / 2],
        scale: inner,
      });
      const sunk = part(
        'rbox',
        [cx, cy, dz - NEST_SINK - PLATE_DEPTH / 2],
        [hw, hh, PLATE_DEPTH / 2],
        style.plate(shade * 0.55)
      );
      modules.push({
        controls: [],
        order: rng(),
        statics: [sunk],
        x: cx,
        y: cy,
      });
      nested.forEach((module) => modules.push({ ...module, x: cx, y: cy }));
      return;
    }
    modules.push({
      controls: fillLeaf(leafContext, leaf, transform),
      order: rng(),
      statics: [
        plate,
        ...(depth === 0 ? plateScrews(leafContext.screws, plate) : []),
      ],
      x: cx,
      y: cy,
    });
  });
  zones.forEach((zone) => {
    const zx = origin[0] + (zone.x + zone.w / 2) * scale;
    const zy = origin[1] - (zone.y + zone.h / 2) * scale;
    const kit = context.kitFor();
    modules.push({
      controls: [],
      order: rng(),
      statics: kit.legend(
        zx - (zone.w * scale) / 2 + 0.12,
        zy + (zone.h * scale) / 2 - 0.05,
        zone.w * scale * 0.3,
        0.035,
        { align: 'left', z0: CHASSIS_TOP }
      ),
      x: zx,
      y: zy,
    });
  });
  return modules;
}

// The chassis body every module sits in, `hw` × `hh` about (x, y).
export function chassisBox(style, hw, hh, x = 0, y = 0) {
  return part(
    'box',
    [x, y, (CHASSIS_TOP + CHASSIS_BACK) / 2],
    [hw, hh, (CHASSIS_TOP - CHASSIS_BACK) / 2],
    style.chassis
  );
}

function rim(style, kit, hw, hh) {
  const z0 = CHASSIS_BACK;
  const z1 = 0.08;
  const bar = (x, y, bw, bh) =>
    part('rbox', [x, y, (z0 + z1) / 2], [bw, bh, (z1 - z0) / 2], style.chassis);
  const statics = [
    bar(0, hh + RIM / 2, hw + RIM, RIM / 2),
    bar(0, -hh - RIM / 2, hw + RIM, RIM / 2),
    bar(hw + RIM / 2, 0, RIM / 2, hh),
    bar(-hw - RIM / 2, 0, RIM / 2, hh),
  ];
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sy) =>
      statics.push(
        ...kit.screw(sx * (hw + RIM / 2), sy * (hh + RIM / 2), 0.06, z1)
      )
    )
  );
  return statics;
}

// The whole panel for a config: modules (each a plate, its controls and a
// build order) plus the chassis. Pure in the config's scene keys.
// The dice and kits one build draws from, all streams of `seed`. `exclude`
// holds catalogue ids the build may not roll.

export default function buildPanel(input) {
  const design = input.panelDesign ? decodeDesign(input.panelDesign) : null;
  const config = design ? { ...input, ...design.look } : input;
  const context = createBuildContext(config);
  const { rng, style } = context;
  let inventory = config.layoutMode === 'inventory' ? layoutInventory() : null;
  if (design)
    inventory = {
      cols: design.cols,
      rows: design.rows,
      zones: [],
      leaves: design.modules.map((module) => ({ ...module, design: module })),
    };
  const hw = (inventory?.cols ?? config.panelCols) / 2;
  const hh = (inventory?.rows ?? config.panelRows) / 2;
  const frameKit = createKit(style, createRng(`${config.seed}:frame`));
  const chassis = [chassisBox(style, hw, hh)];
  if (config.enclosure) chassis.push(...rim(style, frameKit, hw, hh));

  let modules;
  if (!design && config.layoutMode === 'pack') {
    const plate = part(
      'rbox',
      [0, 0, -PLATE_DEPTH / 2],
      [hw - config.seam / 2, hh - config.seam / 2, PLATE_DEPTH / 2],
      style.plate(1)
    );
    const controls = packRound(
      context,
      { h: config.panelRows, w: config.panelCols },
      { offset: [0, 0, 0], scale: 1 },
      {
        maxR: config.packMax,
        minR: config.packMin,
        tries: config.packTries,
      }
    );
    chassis.push(plate);
    modules = controls.map((control) => ({
      controls: [control],
      order: rng(),
      statics: [],
      x: control.at[0],
      y: control.at[1],
    }));
  } else {
    modules = buildModules(
      context,
      { h: hh * 2, layout: inventory, w: hw * 2 },
      { depth: 0, origin: [-hw, hh], scale: 1 }
    );
  }

  const sweep = rng() * Math.PI * 2;
  modules.forEach((module) => {
    const along =
      (module.x * Math.cos(sweep) + module.y * Math.sin(sweep)) /
      Math.hypot(hw, hh);
    Object.assign(module, { order: 0.5 + 0.4 * along + 0.1 * module.order });
  });

  const controls = modules.flatMap((module) => module.controls);
  const hits = controls.flatMap((control, key) => {
    Object.assign(control, { key });
    return control.hits.map((hit) => ({
      ...placeHit(hit, control.transform),
      control: key,
    }));
  });

  const statics = [
    ...chassis,
    ...modules.flatMap((module) => [
      ...module.statics,
      ...module.controls.flatMap((control) => control.statics),
    ]),
  ];
  const largest = modules.reduce(
    (best, module) => {
      const plate = module.statics[0];
      const span = isPlate(plate) ? plate.s[0] * plate.s[1] : 0;
      return span > best.span && span < hw * hh * 0.5 ? { module, span } : best;
    },
    { module: null, span: 0 }
  ).module;
  const reach = config.enclosure ? RIM : 0;
  const bounds = {
    max: [hw + reach, hh + reach, 0.6],
    min: [-hw - reach, -hh - reach, CHASSIS_BACK],
  };
  // A loose control (the printer's paper) is told the panel once it is laid
  // out and reports the local box its parts can reach beyond the panel.
  const looseBounds = controls.flatMap((control) => {
    const box = control.bind?.({
      bounds,
      controls,
      transform: control.transform,
    });
    if (!box) return [];
    if (control.transform.q) return [placeBounds(box, control.transform)];
    const { offset, scale } = control.transform;
    return [
      {
        max: box.max.map((v, i) => v * scale + offset[i]),
        min: box.min.map((v, i) => v * scale + offset[i]),
      },
    ];
  });

  return {
    bounds,
    looseBounds,
    chassis,
    controls,
    detail: largest
      ? { s: largest.statics[0].s, x: largest.x, y: largest.y }
      : null,
    hits,
    modules,
    statics,
    sockets: collectSockets(modules),
  };
}
