/* eslint-disable no-param-reassign */
import { texture, uniform, uniformArray } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  COOL_ANCHORS,
  MISC_COUNT,
  RECTS,
  WARM_ANCHORS,
  ZONE_COUNT,
  paintingData,
} from '@modules/imperfection';
import { getPaletteStops } from '@utils/gradientPalette';

const NUMBERS = [
  'paintSeed',
  'srcFrac',
  'dragMin',
  'lumSpread',
  'darkLines',
  'texGain',
  'seamDither',
  'threadRed',
  'lineGrain',
  'threadSpread',
  'taper',
  'strandMin',
  'strandMax',
  'hatchWidth',
  'ragged',
  'lineDrag',
  'softLines',
  'mottle',
  'skip',
  'grit',
  'dripOn',
  'dripLum',
  'seamBreath',
  'coolThreads',
  'coolThreadCut',
  'warmHueVar',
  'warmLitVar',
  'driftHue',
  'driftLit',
  'fieldRects',
  'linePx',
  'frayPx',
  'bleedPx',
  'bleedP',
  'dryEnd',
  'liveFrac',
  'glaze',
  'blockScale',
  'blockDepth',
  'blockSplit',
  'blockFocus',
  'blockCut',
  'blockFill',
  'blockAmount',
  'blockLayers',
  'glazeA',
  'wet',
  'wetLenMin',
  'wetLenMax',
  'wetBreath',
  'wetCross',
  'aaJitter',
  'crisp',
  'redDripSlots',
  'fleckDensity',
  'glow',
  'gradeWarm',
  'gradeCool',
  'flicker',
  'shimmer',
  'exposure',
  'anim',
  'loopSeconds',
  'impasto',
  'impastoRelief',
  'impastoAzimuth',
  'impastoElevation',
  'impastoGloss',
  'motifScale',
  'motifX',
  'motifY',
  'motifRotation',
  'motifLine',
  'motifErode',
  'motifErodeScale',
  'motifFade',
  'motifEdge',
  'motifEdgeScale',
  'motifBuild',
  'motifBleed',
  'motifGrain',
];

const FLAGS = [
  'blocksEnabled',
  'aaEdge',
  'wedge',
  'soot',
  'scratches',
  'mirror',
  'clipSquare',
  'motifShowB',
  'motifShowT',
];

const ACCENTS = [
  'wedgeInkDark',
  'wedgeInkLight',
  'soot',
  'scratchCool',
  'scratchWarm',
  'dripDark',
  'dripBright',
  'dripDry',
  'fleckDark',
  'fleckBright',
  'glowLight',
  'umber',
];

const LOOK_KEYS = [
  'paletteName',
  'paletteMix',
  'composition',
  'compSeed',
  'compFocusX',
  'compFocusY',
  'compScale',
  'compWedge',
  'columnLeft',
  'columnRight',
  'seamRight',
  'bandLow',
  'bandHigh',
  'coreTop',
  'warmHue',
  'warmChroma',
  'warmLight',
  'coolHue',
  'coolChroma',
  'coolLight',
];

const vectors = (count, Type) =>
  Array.from({ length: count }, () => new Type());
const toLinear = (rgb) => rgb.map((c) => c ** 2.2);
const hexToRgb = (hex) =>
  [1, 3, 5].map((i) => parseInt(String(hex).slice(i, i + 2), 16) / 255);

const N_WARM = WARM_ANCHORS.length;
const N_COOL = COOL_ANCHORS.length;
const N_RECT = RECTS.length;

// WebGPU allows twelve uniform buffers per stage and every uniformArray is
// one, so anchors, rectangles and zones each pack into a single vec4 array;
// a view reads one stretch of it as if it were its own array.
const packed = (count) => uniformArray(vectors(count, THREE.Vector4), 'vec4');

function view(array, base, swizzle = null) {
  return {
    at: (i) => array.array[base + i],
    element(i) {
      const e = array.element(typeof i === 'number' ? base + i : i.add(base));
      return swizzle ? e[swizzle] : e;
    },
  };
}

function packedViews() {
  const anchors = packed(2 * (N_WARM + N_COOL));
  const rects = packed(3 * N_RECT);
  const zones = packed(3 * ZONE_COUNT + MISC_COUNT);
  return {
    coolCol: view(anchors, 2 * N_WARM + N_COOL, 'xyz'),
    coolPos: view(anchors, 2 * N_WARM, 'xyz'),
    rectBox: view(rects, 0),
    rectCol: view(rects, N_RECT, 'xyz'),
    rectInfo: view(rects, 2 * N_RECT),
    warmCol: view(anchors, N_WARM, 'xyz'),
    warmPos: view(anchors, 0, 'xyz'),
    zoneAux: view(zones, 2 * ZONE_COUNT),
    zoneBox: view(zones, 0),
    zoneMisc: view(zones, 3 * ZONE_COUNT),
    zoneParam: view(zones, ZONE_COUNT),
  };
}

function placeholderSource() {
  const map = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
  map.colorSpace = THREE.NoColorSpace;
  map.needsUpdate = true;
  return map;
}

// The texture source keeps sRGB bytes (NoColorSpace), as the anchors do: the
// field converts to linear itself.
export function setSourceFrame(u, frame) {
  if (!frame) {
    u.sourceMap.value = u.sourcePlaceholder;
    u.sourceAspect.value = 1;
    return;
  }
  const current = u.sourceMap.value;
  const reuse =
    current !== u.sourcePlaceholder &&
    current.image.width === frame.width &&
    current.image.height === frame.height;
  const map = reuse
    ? current
    : new THREE.DataTexture(
        new Uint8Array(frame.width * frame.height * 4),
        frame.width,
        frame.height
      );
  map.image.data.set(frame.data);
  if (!reuse) {
    map.colorSpace = THREE.NoColorSpace;
    map.magFilter = THREE.LinearFilter;
    map.minFilter = THREE.LinearFilter;
    if (current !== u.sourcePlaceholder) current.dispose();
    u.sourceMap.value = map;
  }
  map.needsUpdate = true;
  u.sourceAspect.value = frame.width / frame.height;
}

export function createUniforms() {
  const sourcePlaceholder = placeholderSource();
  const u = {
    sourcePlaceholder,
    sourceMap: texture(sourcePlaceholder),
    sourceAspect: uniform(1),
    ...packedViews(),
    time: uniform(0),
    warpOn: uniform(0),
    warpU: uniform(new THREE.Vector3()),
    warpV: uniform(new THREE.Vector3()),
    redDrips: uniform(1),
    redFlecks: uniform(1),
    motifMode: uniform(0),
    motifOutline: uniform(0),
    motifField: uniform(0),
    motifBlocks: uniform(1),
    motifColorB: uniform(new THREE.Vector3()),
    motifColorT: uniform(new THREE.Vector3()),
    accent: Object.fromEntries(
      ACCENTS.map((key) => [key, uniform(new THREE.Vector3())])
    ),
  };
  NUMBERS.forEach((key) => {
    u[key] = uniform(0);
  });
  FLAGS.forEach((key) => {
    u[key] = uniform(0);
  });
  u.lookKey = null;
  return u;
}

function uploadPainting(u, data) {
  const fill = (positions, colors, anchors) =>
    anchors.forEach((anchor, i) => {
      positions.at(i).set(...anchor.position, 0);
      colors.at(i).set(...anchor.color, 0);
    });
  fill(u.warmPos, u.warmCol, data.warm);
  fill(u.coolPos, u.coolCol, data.cool);
  data.rects.forEach((rect, i) => {
    u.rectBox.at(i).set(...rect.box);
    u.rectCol.at(i).set(...rect.color, 0);
    u.rectInfo
      .at(i)
      .set(rect.warm, rect.grain, rect.quarter, rect.bgSkip ? 1 : 0);
  });
  ACCENTS.forEach((key) => {
    u.accent[key].value.set(...toLinear(data.accents[key]));
  });
  if (data.zones) {
    const { aux, box, misc, param } = data.zones;
    [
      [u.zoneBox, box],
      [u.zoneParam, param],
      [u.zoneAux, aux],
      [u.zoneMisc, misc],
    ].forEach(([node, values]) => {
      for (let i = 0; i < values.length / 4; i += 1) {
        node.at(i).fromArray(values, i * 4);
      }
    });
  }
  u.warpOn.value = data.canonical ? 0 : 1;
  u.warpU.value.set(...data.knots.u);
  u.warpV.value.set(...data.knots.v);
}

// `time` is the painting's clock in seconds; the loop phase is added here so
// a still can be taken anywhere in the loop.
export function applyConfig(u, config, { time = 0 } = {}) {
  NUMBERS.forEach((key) => {
    u[key].value = config[key];
  });
  FLAGS.forEach((key) => {
    u[key].value = config[key] ? 1 : 0;
  });
  u.redDrips.value = ['drips', 'both'].includes(config.redAccent) ? 1 : 0;
  u.redFlecks.value = ['flecks', 'both'].includes(config.redAccent) ? 1 : 0;
  u.time.value = time + config.phase * config.loopSeconds;
  u.motifMode.value = ['none', 'logo', 'tiled'].indexOf(config.motif);
  u.motifOutline.value = config.motifStyle === 'outline' ? 1 : 0;
  u.motifField.value = config.motifPlacement === 'blocks' ? 0 : 1;
  u.motifBlocks.value = config.motifPlacement === 'field' ? 0 : 1;
  u.motifColorB.value.set(...hexToRgb(config.motifColorB));
  u.motifColorT.value.set(...hexToRgb(config.motifColorT));

  const lookKey = LOOK_KEYS.map((key) => config[key]).join('|');
  if (lookKey !== u.lookKey) {
    u.lookKey = lookKey;
    uploadPainting(
      u,
      paintingData(config, { stops: getPaletteStops(config.paletteName) })
    );
  }
}
