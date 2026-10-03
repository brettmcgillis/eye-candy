import { createRng } from '@modules/flora';

import {
  BORDERS,
  GUARDS,
  TRADITIONAL_BORDERS,
  TRADITIONAL_GUARDS,
  bandMotif,
  paintBand,
} from './borders';
import createCanvas, { createInk } from './canvas';
import { DESIGNS, paintSignature } from './designs';
import finish, { kilimEnds, weaveFlaws } from './finish';
import { rosette } from './motifs';
import { R, resolvePalette } from './palettes';
import { MINE, mineYarns } from './personal';

const MINE_BORDER = {
  argyle: ['argyleChain', 'argyleLattice'],
  reversal: ['reversalChain'],
  turboflex: ['turboflexChain'],
};

function createMine(config, rng) {
  const weights = MINE.map((name) => [
    name,
    config[`weight${name[0].toUpperCase()}${name.slice(1)}`] ?? 0,
  ]).filter(([, w]) => w > 0);
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  const active = total > 0;
  return {
    active,
    field: active ? config.mineField : 0,
    medallion: active && rng() < config.mineMedallion,
    pick() {
      let roll = rng() * total;
      for (let i = 0; i < weights.length; i += 1) {
        roll -= weights[i][1];
        if (roll <= 0) return weights[i][0];
      }
      return weights[weights.length - 1]?.[0] ?? 'argyle';
    },
  };
}

const pickFrom = (rng, list) => list[Math.floor(rng() * list.length)];

// The bands from the selvedge in: guards, the main border, guards, with a
// one-knot line between each.
function planBands(config, { design, grounds, ink, mine, rng }) {
  const cols = Math.round(config.knotsAcross);
  const main = Math.max(4, Math.round(cols * config.borderWidth));
  const guard = Math.max(2, Math.round(config.guardWidth));
  const { border } = grounds;
  const bands = [];
  const line = (ground) => ({
    kind: 'line',
    role: ink.lineOn(ground),
    width: 1,
  });
  const guardBand = () => {
    const house = mine.active && rng() < config.mineGuard;
    let id = config.guardMotif;
    if (house) id = 'argyleRow';
    else if (id === 'auto' || !GUARDS[id])
      id = pickFrom(rng, TRADITIONAL_GUARDS);
    const ground = ink.accent(border, [R.dark]);
    const yarns = house
      ? { ...ink.set(ground), a: ground === R.red ? R.ivory : R.red, b: R.dark }
      : { ...ink.set(ground), b: ink.accent(ground, [border]) };
    return {
      ground,
      id,
      kind: 'guard',
      width: guard,
      ...bandMotif(GUARDS, id, yarns),
    };
  };

  let mainId = config.borderMotif;
  const houseBorder = mine.active && rng() < config.mineBorder;
  if (houseBorder) mainId = pickFrom(rng, MINE_BORDER[mine.pick()]);
  else if (mainId === 'auto' || !BORDERS[mainId]) {
    mainId = rng.chance(0.8)
      ? pickFrom(rng, design.border)
      : pickFrom(rng, TRADITIONAL_BORDERS);
  }
  const mainYarns = houseBorder ? mineYarns(ink, border) : ink.set(border);
  const mainBand = {
    ground: border,
    id: mainId,
    kind: 'main',
    width: main,
    ...bandMotif(BORDERS, mainId, mainYarns),
  };
  if (config.cornerRosettes) {
    mainBand.corner = rosette({
      c: ink.set(border),
      petals: 8,
      pointed: rng.chance(0.4),
    });
  }

  for (let i = 0; i < config.guardCount; i += 1)
    bands.push(line(border), guardBand());
  bands.push(line(border), mainBand, line(border));
  for (let i = 0; i < config.guardCount; i += 1)
    bands.push(guardBand(), line(grounds.ground));
  return bands;
}

// Weaves one rug: the cartoon (a palette role per knot) and the finished
// RGBA the renderers draw. Rows run head (0) to foot; the kilim ends are
// part of the grid, the fringe is not.
export default function buildRug(config) {
  const design = DESIGNS[config.design] ?? DESIGNS.city;
  const rng = createRng(`${config.rugSeed}:${config.design}`);
  const cols = Math.max(24, Math.round(config.knotsAcross));
  const kilimRows = Math.max(0, Math.round(config.kilimRows));
  const pileRows = Math.max(24, Math.round(cols * config.rugAspect));
  const rows = pileRows + kilimRows * 2;
  const palette = resolvePalette(config);
  const { colors, grounds, lum } = palette;
  const ink = createInk(lum, rng.fork('ink'));
  const mine = createMine(config, rng.fork('mine'));
  const canvas = createCanvas(cols, rows, grounds.ground);

  const selvedge = 1;
  const rect = {
    x0: selvedge,
    x1: cols - selvedge,
    y0: kilimRows,
    y1: rows - kilimRows,
  };
  const bands = planBands(config, {
    design,
    grounds,
    ink,
    mine,
    rng: rng.fork('bands'),
  });
  const span = Math.min(rect.x1 - rect.x0, rect.y1 - rect.y0);
  const budget = span * 0.36;
  const total = bands.reduce((sum, band) => sum + band.width, 0);
  const squeeze = total > budget ? budget / total : 1;
  let depth = 0;
  bands.forEach((band) => {
    const width =
      band.kind === 'line' ? 1 : Math.max(2, Math.round(band.width * squeeze));
    const spec = { ...band, d0: depth, d1: depth + width };
    if (band.kind === 'line') {
      paintBand(canvas, rect, {
        ...spec,
        ground: band.role,
        motif: () => -1,
        ratio: 1,
      });
    } else {
      paintBand(canvas, rect, spec);
    }
    depth += width;
  });

  const fx0 = rect.x0 + depth;
  const fy0 = rect.y0 + depth;
  const fx1 = rect.x1 - depth;
  const fy1 = rect.y1 - depth;
  const field = {
    cx: (fx0 + fx1) / 2,
    cy: (fy0 + fy1) / 2,
    hh: (fy1 - fy0) / 2,
    hw: (fx1 - fx0) / 2,
    x0: fx0,
    x1: fx1,
    y0: fy0,
    y1: fy1,
  };

  const ctx = {
    asymmetry: config.asymmetry,
    canvas,
    coarse: Boolean(design.coarse),
    field,
    grounds,
    infillScale: config.infillScale,
    ink,
    medallionScale: config.medallionScale,
    mine,
    pendants: config.pendants,
    rng: rng.fork('field'),
    seed: Math.floor(rng() * 1e6),
    spandrels: config.spandrels,
  };
  design.paint(ctx);
  if (mine.active && rng() < config.mineSignature) paintSignature(ctx);
  weaveFlaws(canvas, field, Math.round(config.flaws), rng.fork('flaws'));

  const selvedgeRole = R[config.selvedge] ?? R.dark;
  for (let y = kilimRows; y < rows - kilimRows; y += 1) {
    canvas.set(0, y, selvedgeRole);
    canvas.set(cols - 1, y, selvedgeRole);
  }
  kilimEnds(canvas, kilimRows, rng.fork('kilim'));

  const rgba = finish(canvas, {
    colors,
    config,
    kilimRows,
    rng: rng.fork('finish'),
  });

  return {
    bands: bands.filter((band) => band.kind !== 'line').map((band) => band.id),
    colors,
    cols,
    design: config.design,
    field,
    kilimRows,
    mine: mine.active ? { field: mine.field, medallion: mine.medallion } : null,
    pileRows,
    rgba,
    roles: canvas.roles,
    rows,
  };
}
