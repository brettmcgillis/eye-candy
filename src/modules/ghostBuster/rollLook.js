import { LOOK_OPTIONS } from './lookOptions.mjs';

const WINDOWS = {
  burnAmount: [0.2, 0.42],
  burnSpeed: [0.05, 0.15],
  burnNoiseScale: [2, 5],
  burnEdgeWidth: [0.03, 0.09],
  burnCharWidth: [0.12, 0.25],
  burnGlowIntensity: [3, 7],
  emberRate: [20, 70],
  emberSize: [0.008, 0.02],
  emberRise: [0.3, 0.7],
  emberDrift: [0.05, 0.25],
  emberIntensity: [2, 5],
  clothWidth: [0.85, 1.4],
  clothHeight: [0.85, 1.4],
  stiffness: [0.1, 0.25],
  dampening: [0.98, 0.995],
  gravity: [0.0001, 0.0002],
  maxVelocity: [0.008, 0.014],
  handSize: [0.03, 0.08],
  handHeight: [0.15, 0.35],
  handSpacing: [0.2, 0.38],
  earLiftY: [0, 0.2],
  earSpread: [0, 0.15],
  earPushBack: [0, 0.1],
  earColliderRadius: [0, 0.035],
  holeAmount: [0, 0.35],
  tatterEdge: [0, 0.4],
  edgeFade: [0.04, 0.18],
  alphaScale: [2, 9],
  alphaSeed: [0, 200],
  opacity: [0.85, 1],
  roughness: [0.15, 1],
  metalness: [0, 0.85],
  innerRoughness: [0.2, 1],
  innerMetalness: [0, 0.7],
  sheen: [0, 0.8],
  clearcoat: [0, 0.7],
  envMapIntensity: [0.5, 1.5],
  fabricAmount: [0, 1],
  fabricThreads: [40, 180],
  fabricDepth: [0.15, 0.5],
  fabricShade: [0.1, 0.4],
  fabricWear: [0.1, 0.7],
  cutoutRimWidth: [0, 0.006],
  cutoutRimOffset: [0, 0.004],
  eyeIntensity: [0.1, 1],
  holeRimWidth: [0, 0.025],
  holeRimGlow: [0, 0.5],
  bloodAmount: [0, 0.5],
  dripAmount: [0, 0.14],
  dripCount: [8, 30],
  dripGlow: [0, 0.8],
  dripTint: [0, 0.8],
  dripSpeed: [0.2, 1],
  cutoutBrow: [0, 0.65],
  cutoutBrowSlant: [0, 1.2],
  outerEmissiveIntensity: [0, 0.5],
  innerEmissiveIntensity: [0, 1.5],
  outlineStrength: [1, 4],
  outlineThickness: [1, 18],
  outlineGlow: [0.1, 0.5],
  outlinePatternOctaves: [1, 4],
  outlinePatternScale: [3, 20],
  outlineRingStride: [3, 12],
  cloudSize: [0.5, 0.9],
  cloudHeight: [0.25, 0.6],
  rainCount: [100, 500],
  rainSpeed: [1, 4],
  rainOpacity: [0.3, 0.7],
  lightningBranches: [0, 4],
  bobAmplitude: [0.01, 0.04],
  bobSpeed: [0.3, 0.8],
  swayAmplitude: [0.005, 0.03],
  tiltIntensity: [0.1, 0.4],
  baseWind: [0.1, 0.35],
  windAmplitude: [0.0002, 0.0005],
  windBoostMul: [1, 2.5],
  squashIntensity: [0.1, 0.35],
  ambientIntensity: [0.3, 0.8],
  spotIntensity: [3, 6],
  sceneEnvIntensity: [0, 0.8],
  orbitLightIntensity: [5, 15],
};

const CHANCES = {
  burnEnabled: 0.12,
  burnLoop: 0,
  outlineEnabled: 0.3,
  outlineInside: 0.3,
  smoothEdges: 0.5,
  smoothOutline: 0.5,
  cloudVisible: 0.15,
  rainVisible: 0.12,
  lightningVisible: 0.08,
  orbitLightEnabled: 0.2,
};
const SPARSE = new Set([
  'holeAmount',
  'tatterEdge',
  'fabricAmount',
  'holeRimWidth',
  'bloodAmount',
  'dripAmount',
  'cutoutBrow',
  'outerEmissiveIntensity',
  'innerEmissiveIntensity',
]);
const FIXED = new Set([
  'clothSegments',
  'outlineDownSampleRatio',
  'outlineHiddenStrength',
  'collisionMargin',
  'cursorRadius',
  'clothThickness',
  'clothDetail',
]);
const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function paletteColor(hue, lightness) {
  const saturation = 0.5;
  const a = saturation * Math.min(lightness, 1 - lightness);
  const channel = (offset) => {
    const k = (offset + hue / 30) % 12;
    return Math.round(
      255 * (lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))
    );
  };
  return `#${[0, 8, 4].map((offset) => channel(offset).toString(16).padStart(2, '0')).join('')}`;
}

export default function rollLook(config, facet, rng, { mode, textures }) {
  const result = { ...config };
  const hue = rng() * 360;
  const storm = rng.chance(0.15);
  Object.entries(LOOK_OPTIONS)
    .filter(([, item]) => item.facet === facet)
    .forEach(([key, item]) => {
      const current = config[key];
      if (FIXED.has(key)) return;
      if (mode === 'variations' && !rng.chance(0.45)) return;
      if (item.type === 'number') {
        const window = WINDOWS[key] ?? [
          Math.max(item.min, Number(current) * 0.8),
          Math.min(
            item.max,
            Math.max(Number(current) * 1.2, item.min + item.step)
          ),
        ];
        let [min, max] = window;
        if (mode === 'variations') {
          const radius = (max - min) * 0.2;
          min = Number(current) - radius;
          max = Number(current) + radius;
        }
        let value = min + (max - min) * rng();
        if (mode === 'new' && SPARSE.has(key) && rng.chance(0.65)) value = 0;
        result[key] = Number(
          clamp(
            Math.round(value / item.step) * item.step,
            item.min,
            item.max
          ).toFixed(6)
        );
      } else if (item.type === 'color') {
        const lightness =
          key === 'color' ? 0.65 + rng() * 0.3 : 0.2 + rng() * 0.6;
        const target = paletteColor(hue, lightness);
        if (mode === 'variations' && /^#[0-9a-f]{6}$/iu.test(current)) {
          const channels = [1, 3, 5].map((start) => {
            const from = parseInt(current.slice(start, start + 2), 16);
            const to = parseInt(target.slice(start, start + 2), 16);
            return Math.round(from * 0.8 + to * 0.2)
              .toString(16)
              .padStart(2, '0');
          });
          result[key] = `#${channels.join('')}`;
        } else {
          result[key] = target;
        }
      } else if (item.type === 'enum') {
        result[key] = pick(rng, item.choices);
      } else if (item.type === 'boolean') {
        result[key] = rng.chance(CHANCES[key] ?? 0.7);
        if (['cloudVisible', 'rainVisible', 'lightningVisible'].includes(key)) {
          result[key] = storm && (key === 'cloudVisible' || rng.chance(0.65));
        }
      } else if (key.endsWith('TextureUrl')) {
        result[key] =
          rng.chance(0.2) && textures.length ? pick(rng, textures) : 'none';
      }
    });
  return result;
}
