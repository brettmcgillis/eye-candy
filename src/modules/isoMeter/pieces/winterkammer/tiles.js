/* eslint-disable no-param-reassign */
import { lerpColor } from '../../color';
import { createLattice } from '../../lattice';
import createNoise from '../../noise';
import createFlatPack from './flatPack';
import createPerlinGrid, { NUMLAYERS } from './perlinGrid';
import { createTileRng } from './rng';
import addSlab from './slab';
import createTraceCube from './traceCube';

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

export const BUILDING_KINDS = ['tile', 'naked', 'flatpack'];

function rollMaterials(tile, { background, palettes }, { tint }) {
  const { rng } = tile;
  const materials = [];
  for (let t = 0; t < NUMLAYERS + 1; t += 1) {
    const pal = palettes[rng.randomIntExcl(palettes.length)];
    if (t === 0 && !tint) {
      tile.bkg = lerpColor(background, pal[rng.randomIntExcl(4)], 0.08);
    }
    materials[t] = tint ? pal.map((c) => lerpColor(background, c, 0.65)) : pal;
  }
  return materials;
}

function prepareBuilding(tile, env, buildStep) {
  const { dims, rng } = tile;
  tile.lifespan = rng.randomIntRangeIncl(4e3, 12e3);
  tile.flipIJK = rng.randomIntExcl(5);
  tile.heightMap = new Array(dims.I * dims.K).fill(-1);
  tile.bright = rng.randomFloatRange(0.4, 0.8);
  tile.dark = rng.randomFloatRange(0.2, 0.5);
  tile.drawOrder = rng.randomIntExcl(3);
  const args = { ...dims, noise: tile.noise, rng };
  if (tile.kind === 'flatpack' && rng.roll() >= 0.5) {
    tile.field = createFlatPack(args);
  } else {
    tile.field = createPerlinGrid(args);
  }
  tile.lattice = createLattice({ record: true });
  tile.materials = rollMaterials(tile, env, { tint: false });
  tile.built = false;
  tile.rendered = false;
  tile.buildStep = buildStep ?? tile.delay;
}

function prepareSigil(tile, env) {
  const { dims, rng, size } = tile;
  tile.lifespan = rng.randomIntRangeIncl(4e3, 12e3);
  tile.flipIJK = rng.randomIntRangeIncl(3, 4);
  tile.heightMap = new Array(dims.I * dims.K).fill(-1);
  tile.bright = rng.randomFloatRange(0.4, 0.8);
  tile.dark = rng.randomFloatRange(0.2, 0.5);
  tile.field = createTraceCube(
    size.sizeI,
    size.sizeJ,
    size.sizeK,
    size.padding,
    rng
  );
  tile.lattice = createLattice({ record: true });
  tile.materials = rollMaterials(tile, env, { tint: false });
  tile.active = true;
}

function prepareBackground(tile, env) {
  const { dims, rng } = tile;
  tile.flipIJK = rng.randomIntExcl(5);
  tile.heightMap = new Array(dims.I * dims.K).fill(-1);
  tile.bright = rng.randomFloatRange(0.4, 0.8);
  tile.dark = rng.randomFloatRange(0.2, 0.5);
  tile.drawOrder = rng.randomIntExcl(3);
  tile.field = createPerlinGrid({ ...dims, noise: tile.noise, rng });
  tile.lattice = createLattice({ record: true });
  for (let level = 0; level < dims.J; level += 1) addSlab(tile, 1, level);
  tile.materials = rollMaterials(tile, env, { tint: true });
}

export function levelsFor(tile) {
  const { I, J, K } = tile.dims;
  if (tile.drawOrder === 0) return I;
  if (tile.drawOrder === 1) return J;
  return tile.kind === 'naked' ? J : K;
}

export function buildTile(tile) {
  const levels = levelsFor(tile);
  for (let level = 0; level < levels; level += 1) {
    addSlab(tile, tile.drawOrder, level);
  }
}

export function shadeTile(tile, tri) {
  const { dims, heightMap, materials } = tile;
  const pal = materials[tri.material];
  let col;
  if (!pal) {
    col = new Array(3).fill(Math.round(((tri.orientation + 1) % 3) * 127.5));
  } else {
    const limit = dims.I + dims.J + dims.K;
    const t = ((tri.i + tri.j + tri.k) % limit) / limit;
    if (tri.orientation === 0) {
      col = lerpColor(pal[0], lerpColor(pal[2], pal[1], 0.5), t);
    } else if (tri.orientation === 2) {
      col = lerpColor(pal[2], lerpColor(pal[3], pal[0], 0.5), t);
    } else {
      col = lerpColor(pal[1], pal[3], t);
    }
  }
  if (tile.recolor) col = tile.recolor(tri, col, dims.J);
  if (tri.orientation !== 1) return col;
  const depth = Math.max(
    Math.min(heightMap[tri.k + dims.K * tri.i] - tri.j, dims.J),
    0
  );
  const h = (depth / dims.J) * -1 + 1;
  if (h > 0.5) {
    return lerpColor(
      col,
      WHITE,
      Math.max(Math.min(2 * (h - 0.5), tile.bright), 0)
    );
  }
  return lerpColor(col, BLACK, Math.max(Math.min(1 - 2 * h, tile.dark), 0));
}

export function createTile(spec, env) {
  const { baseZoom } = env;
  const tile = {
    aspectMax: spec.aspectRange?.max ?? 100,
    aspectMin: spec.aspectRange?.min ?? 0,
    center: spec.center,
    recolor: env.recolor ?? null,
    dims: spec.dims,
    first: true,
    kind: spec.kind,
    noise: createNoise(spec.seed),
    offsets: spec.offsets ?? { i: 0, j: 0, k: 0 },
    rng: createTileRng(spec.seed),
    seed: spec.seed,
    size: spec.size,
    zoom: (spec.zoom ?? 1) * baseZoom,
  };
  tile.prepare = (buildStep) => {
    if (BUILDING_KINDS.includes(tile.kind)) {
      prepareBuilding(tile, env, buildStep);
    } else if (tile.kind === 'sigil') {
      prepareSigil(tile, env);
    } else if (tile.kind === 'background') {
      prepareBackground(tile, env);
    }
  };
  tile.shade = (tri) => shadeTile(tile, tri);
  tile.visibleAt = (aspect) =>
    !(aspect > tile.aspectMax || aspect < tile.aspectMin);
  tile.prepare();
  return tile;
}
