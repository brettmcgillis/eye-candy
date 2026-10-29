import { createRng } from '@modules/flora';
import { framePoints, frameSphere } from '@modules/plotKit';
import {
  PALETTE_NAMES,
  getPaletteStops,
  rgbToHex,
  samplePaletteColors,
} from '@utils/gradientPalette';

import { PRESETS } from './presets';
import {
  HALOS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  allowedHalos,
  facets,
  keysInFacet,
  optionsFromConfig,
  sceneDefaults,
} from './renderOptions.mjs';

const PRESET_NAMES = [
  'Default Rings',
  'Gradient Rings',
  'Atomic',
  'Network',
  'Record',
  'Plate',
  'Static',
  'Universal',
];
const PREFIX = {
  rings: 'rings',
  atomic: 'atom',
  network: 'network',
  record: 'record',
  plate: 'plate',
  crtStaticRing: 'crtStaticRing',
  solarSystem: 'solarSystem',
};
export const PALETTES = PALETTE_NAMES.filter(
  (name) => (getPaletteStops(name)?.length ?? 0) >= 2
);
const BENCH = { floatSpeed: 0, femurVisible: true, skullVisible: true };
const pick = (rng, values) => values[Math.floor(rng() * values.length)];
export const seedFor = (seed, index) =>
  index ? `${seed}-${index}` : String(seed);
export const randomSeed = () => Math.random().toString(36).slice(2, 10);

export function rollConfig(
  seed,
  {
    base = {},
    keep = [],
    pinned = {},
    halos = HALOS.join(','),
    palettes = PALETTES,
  } = {}
) {
  const config = { ...sceneDefaults(), ...base, haloSeed: String(seed) };
  const rng = createRng(`${seed}:type`);
  const type = pinned.haloType ?? pick(rng, allowedHalos(halos));
  if (!keep.includes('halo'))
    Object.assign(config, PRESETS[PRESET_NAMES[HALOS.indexOf(type)]]);
  Object.assign(config, BENCH);
  facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const stream = createRng(`${seed}:${facet}`);
      keysInFacet(facet).forEach((key) => {
        const item = RENDER_OPTIONS[key];
        if (item.roll) {
          const { min, max, step = 0.01 } = item.roll;
          const places = Math.max(0, -Math.floor(Math.log10(step)));
          config[key] = Number(
            Math.min(
              max,
              Math.max(
                min,
                Math.round((min + stream() * (max - min)) / step) * step
              )
            ).toFixed(places)
          );
        }
      });
      if (facet === 'halo') {
        config.recordSideA = stream() < 0.5;
        config.solarSystemShowOrbits = stream() < 0.85;
        config.solarSystemAsteroidBeltsVisible = stream() < 0.7;
      }
      if (facet === 'color') {
        config.paletteName = pick(
          stream,
          palettes?.length ? palettes : PALETTES
        );
        config.paletteExact = stream() < 0.5;
        const stops = getPaletteStops(config.paletteName);
        const colors = samplePaletteColors(stops, 7, config.paletteExact).map(
          rgbToHex
        );
        [, , , , , config.networkPointColor, config.networkLineColor] = colors;
        // The rings' five bands span the whole palette, dealt out in a
        // shuffled order: in palette order neighbours were near twins, and
        // exact sampling of a two-stop palette gave three bands one colour.
        const bands = samplePaletteColors(stops, 5, false).map(rgbToHex);
        for (let i = bands.length - 1; i > 0; i -= 1) {
          const j = Math.floor(stream() * (i + 1));
          [bands[i], bands[j]] = [bands[j], bands[i]];
        }
        [
          'ringsSilver',
          'ringsWhite',
          'ringsBlack',
          'ringsBlue',
          'ringsLightblue',
        ].forEach((key, i) => {
          config[key] = bands[i];
        });
      }
      if (facet === 'motion') {
        config.animate = stream() < 0.5;
        config.wobble = stream() < 0.35;
        config.speed = 10 + stream() * 30;
        config.wobbleAngle = 2 + stream() * 6;
        config.wobbleSpeed = 0.3 + stream();
      }
    });
  Object.assign(config, pinned);
  config.ringsPalette = pinned.ringsPalette ?? config.paletteName;
  config.ringsPaletteExact = pinned.ringsPaletteExact ?? config.paletteExact;
  if (!pinned.haloType && !keep.includes('halo')) {
    config.haloType = type === 'gradient' ? 'rings' : type;
    config.ringsStyle =
      pinned.ringsStyle ?? (type === 'gradient' ? 'gradient' : 'default');
  }
  config.haloSeed = pinned.haloSeed ?? String(seed);
  return config;
}

export function controlsFor(config, bench = true) {
  const controls = {
    ...sceneDefaults(),
    ...config,
    ...(bench ? { haloScrollEnabled: false } : {}),
  };
  const prefix = PREFIX[controls.haloType];
  const position = controls[`${prefix}Position`];
  const rotation = controls[`${prefix}Rotation`];
  controls[`${prefix}Position`] = {
    ...position,
    y: position.y + controls.haloHeight,
  };
  controls[`${prefix}Rotation`] = {
    ...rotation,
    x: rotation.x + controls.haloTilt,
  };
  controls[`${prefix}Scale`] *= controls.haloSize;
  controls.ringsPalette = config.ringsPalette ?? controls.paletteName;
  return controls;
}

// Every pin that makes a roll reproduce a halo preset, for starting a new
// variation from it: placement, motion and camera are held at their defaults so only
// the preset's own values and the seed vary.
export function presetPins(name) {
  return {
    ...Object.fromEntries(
      ['placement', 'motion', 'camera']
        .flatMap(keysInFacet)
        .map((key) => [key, RENDER_OPTIONS[key].default])
    ),
    ...optionsFromConfig(PRESETS[name]),
  };
}

export function rollArgs({ options, typed }) {
  return {
    base: options.base?.config ?? options.base?.preset ?? options.base ?? {},
    halos: options.halos,
    keep: String(options.keep ?? '')
      .split(',')
      .filter(Boolean),
    palettes:
      typeof options.palettes === 'string'
        ? options.palettes.split(',').filter(Boolean)
        : options.palettes,
    pinned: Object.fromEntries(
      SCENE_KEYS.filter(
        (key) =>
          options[key] != null && (typed.has(key) || !RENDER_OPTIONS[key].facet)
      ).map((key) => [key, options[key]])
    ),
  };
}
export function thoughtAt({ batch, index, roll }) {
  const name = seedFor(batch, index);
  return { config: rollConfig(name, roll), name };
}
export function frameThought({
  bounds,
  config,
  options,
  view = 'hero',
  azimuthOffset = 0,
}) {
  const angles = { front: 0, profile: 90, back: 180 };
  const hero = !(view in angles);
  const frame = bounds.points ? framePoints : frameSphere;
  const viewConfig = frame({
    points: bounds.points,
    azimuth: (angles[view] ?? config.cameraAzimuth) + azimuthOffset,
    bounds,
    elevation: config.cameraElevation,
    fov: options.fov,
    height: options.height,
    margin: options.margin,
    roll: hero ? (config.cameraRoll ?? 0) : 0,
    shift: hero ? (config.cameraShiftY ?? 0) : 0,
    width: options.width,
    zoom: config.cameraZoom,
  });
  const pan = [
    config.cameraPanX ?? 0,
    config.cameraPanY ?? 0,
    config.cameraPanZ ?? 0,
  ];
  viewConfig.eye = viewConfig.eye.map((v, i) => v + pan[i]);
  viewConfig.target = viewConfig.target.map((v, i) => v + pan[i]);
  return viewConfig;
}
