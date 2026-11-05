/* eslint-disable no-param-reassign */
import createTileAutomaton, { hollowOf, inkOf } from './automaton';
import { clamp, colorCoordinate, linear, paletteFor, smooth } from './color';
import buildTiles from './layout';
import createNoise from './noise';
import { isHollow } from './tileMesh';

export const STRIDE = 12;
const TAU = Math.PI * 2;
const TOWER_CAP = 12;
function fbm(noise, x, y, z, octaves) {
  let sum = 0;
  let weight = 0.5;
  let total = 0;
  for (let k = 0; k < octaves; k += 1) {
    sum += noise(x, y, z) * weight;
    total += weight;
    weight *= 0.5;
    x *= 2;
    y *= 2;
    z *= 2;
  }
  return 0.5 + (sum / total) * 0.65;
}
export function createField(config) {
  const c = config;
  const tiles = buildTiles(c).map((tile) => ({
    ...tile,
    hollow: isHollow(c, tile.layer),
  }));
  const auto = c.source === 'automaton' ? createTileAutomaton(c, tiles) : null;
  const data = new Float32Array(tiles.length * STRIDE);
  const noise = createNoise(c.seed);
  const colors = paletteFor(c);
  const angle = (c.rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = Math.cos((c.direction * Math.PI) / 180);
  const dy = Math.sin((c.direction * Math.PI) / 180);
  const halfX = c.columns * 0.75;
  const halfY = c.rows * 0.75;
  const flat = c.dimension === 'flat';
  const depth = flat ? 0.006 : c.depth * (c.dimension === 'relief' ? 0.35 : 1);
  const half = tiles.reduce(
    (box, tile) => {
      const x = tile.x * cos - tile.y * sin;
      const y = tile.x * sin + tile.y * cos;
      const reach = c.tileSize * Math.max(1, c.topScale) * 0.72;
      box[0] = Math.max(box[0], Math.abs(x) + reach);
      box[1] = Math.max(box[1], Math.abs(y) + reach);
      return box;
    },
    [0, 0]
  );
  const bleedHeight = Math.max(0.5, Math.min(halfX, halfY) - 1.5);
  const bounds = {
    cameraFrame: c.cameraFrame,
    bleed:
      c.pattern === 'lattice'
        ? {
            halfX: Math.max(0.5, halfX - 1.5),
            halfY: Math.max(0.5, halfY - 1.5),
            cos: Math.abs(cos),
            sin: Math.abs(sin),
            fallback: bleedHeight,
          }
        : null,
    min: [-half[0], -half[1], -0.1],
    max: [
      half[0],
      half[1],
      flat
        ? 0.02
        : c.layerGap +
          c.lift +
          depth * (2 + (auto ? c.towers * TOWER_CAP : 0)) +
          1,
    ],
  };
  const sources = new Float64Array(tiles.length * 6);
  const palette = new Float32Array(1024 * 3);
  for (let i = 0; i < 1024; i += 1) {
    const t = (i / 1024) * colors.length;
    const a = colors[Math.floor(t) % colors.length];
    const b = colors[(Math.floor(t) + 1) % colors.length];
    const blend = c.colorMode === 'checker' ? 0 : smooth(t % 1);
    for (let k = 0; k < 3; k += 1)
      palette[i * 3 + k] = linear(clamp(a[k] + (b[k] - a[k]) * blend));
  }
  tiles.forEach((tile, i) => {
    const { x, y } = tile;
    const warp =
      noise(x * c.frequency * 0.5 + 17, y * c.frequency * 0.5, 3) * c.warp;
    const at = i * 6;
    sources[at] = x * c.frequency + warp;
    sources[at + 1] = y * c.frequency + warp;
    sources[at + 2] = ((x * dx + y * dy) / c.wavelength) * TAU;
    sources[at + 3] = (Math.hypot(x, y) / c.wavelength) * TAU;
    sources[at + 4] =
      ((tile.col + tile.row + tile.layer * 0.5) / c.wavelength) * TAU;
    sources[at + 5] = colorCoordinate(c, tile, noise, 0);
    data[i * STRIDE] = x * cos - y * sin;
    data[i * STRIDE + 1] = x * sin + y * cos;
  });
  const stateInks = [colors[0], colors[1]].map((ink) =>
    ink.map((v) => linear(clamp(v)))
  );
  function update(seconds) {
    const running = auto ? c.generation + seconds * c.stepsPerSecond : 0;
    const base = Math.floor(running);
    const blend = smooth(running - base);
    const from = auto?.at(base);
    const to = auto && running > base ? auto.at(base + 1) : from;
    const turn = TAU * ((seconds / c.loopSeconds + c.phase) % 1);
    const tx = Math.cos(turn) * c.travel;
    const ty = Math.sin(turn) * c.travel;
    const colorDelta =
      Math.sin(turn) * c.colorMotion * (c.colorMode === 'layers' ? 0.06 : 0.25);
    for (let i = 0; i < tiles.length; i += 1) {
      const tile = tiles[i];
      const { x, y, layer } = tile;
      const before = auto ? from.state[i] : 0;
      const after = auto ? to.state[i] : 0;
      const level = (before ? 1 - blend : 0) + (after ? blend : 0);
      const field = auto
        ? level
        : fbm(
            noise,
            sources[i * 6] + tx,
            sources[i * 6 + 1] + ty,
            2.37 + layer * (1 - c.layerCorrelation) * 3.7,
            c.octaves
          );
      const along = sources[i * 6 + 2];
      let wave = Math.sin(along - turn);
      if (c.motion === 'ripple') wave = Math.sin(sources[i * 6 + 3] - turn);
      if (c.motion === 'cascade') wave = Math.sin(sources[i * 6 + 4] - turn);
      if (c.motion === 'breathe') wave = Math.sin(turn);
      if (c.motion === 'tide') wave = (field - 0.5) * 2;
      const threshold = 1 - c.coverage;
      const animated =
        field + (c.motion === 'tide' ? 0 : wave * c.amplitude * 0.3);
      let fade = auto
        ? level
        : smooth((animated - threshold + c.softness / 2) / c.softness);
      if (!auto && c.coverage >= 1) fade = 1;
      if (!auto && c.coverage <= 0) fade = 0;
      if (c.pattern !== 'logo' && c.edgeFade > 0) {
        let edge = Math.max(Math.abs(x) / halfX, Math.abs(y) / halfY);
        if (c.pattern === 'column')
          edge = Math.max(
            Math.abs(x * cos - y * sin) / half[0],
            Math.abs(x * sin + y * cos) / half[1]
          );
        fade *= smooth((1.05 - edge) / c.edgeFade);
      }
      const pulse =
        c.motion === 'tide' ? 1 : 1 - c.amplitude * 0.12 * (1 - wave);
      const scale =
        pulse *
        c.tileSize *
        (layer ? c.topScale : 1) *
        (c.fadeStyle === 'opacity' ? 1 : Math.sqrt(fade));
      const at = i * STRIDE;
      const tileDepth =
        flat || !auto
          ? depth
          : depth * (1 + c.towers * Math.min(from.age[i], TOWER_CAP));
      data[at + 2] =
        layer * (flat ? 0.008 : depth + c.layerGap) +
        tileDepth / 2 +
        (flat ? 0 : (wave * 0.5 + 0.5) * c.lift * c.amplitude);
      data[at + 3] = scale;
      data[at + 4] = tileDepth;
      data[at + 5] = flat ? 0 : wave * c.tilt * c.amplitude;
      if (!flat && c.motion === 'hinge')
        data[at + 5] =
          Math.sin(along - turn) *
          c.tilt *
          smooth((Math.sin(along - turn) + 1) / 2);
      let hingeY = 0;
      let hingeZ = 0;
      if (c.motion === 'hinge') {
        hingeY = ((1 - Math.cos(data[at + 5])) * scale) / 2;
        hingeZ = (Math.sin(data[at + 5]) * scale) / 2;
      }
      data[at] = x * cos - y * sin - hingeY * sin;
      data[at + 1] = x * sin + y * cos + hingeY * cos;
      data[at + 2] += hingeZ;
      data[at + 6] = (c.rotation * Math.PI) / 180;
      let opacity = fade;
      if (c.fadeStyle === 'shrink') opacity = fade > 0.001 ? 1 : 0;
      data[at + 7] = opacity;
      const colorT = (((sources[i * 6 + 5] + colorDelta) % 1) + 1) % 1;
      const ink = Math.min(1023, Math.floor(colorT * 1024)) * 3;
      data[at + 8] = palette[ink];
      data[at + 9] = palette[ink + 1];
      data[at + 10] = palette[ink + 2];
      if (auto) {
        const first = stateInks[inkOf(before || after)];
        const last = stateInks[inkOf(after || before)];
        for (let k = 0; k < 3; k += 1)
          data[at + 8 + k] = first[k] + (last[k] - first[k]) * blend;
        tile.hollow = hollowOf(blend < 0.5 ? before || after : after || before);
      }
      data[at + 11] = fade;
    }
    return data;
  }
  update(0);
  return { bounds, config: c, data, tiles, update };
}
