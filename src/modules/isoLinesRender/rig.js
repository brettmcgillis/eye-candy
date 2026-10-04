/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import { createPaletteTexture } from '@utils/gradientPalette';

import createFlatMaterial from './materials';
import { COLOR_MODE_IDS, createShading } from './shading';

// Every uniform the field's colour reads, from a flat config; shared with
// IsoLinesRelief's rig.
export function applyShading(s, config) {
  const { u } = s;
  u.levels.value = config.levels;
  u.levelOffset.value = config.levelOffset;
  u.colorMode.value = COLOR_MODE_IDS[config.colorMode] ?? 0;
  u.cosineFreq.value = config.cosineFreq;
  u.cosinePhase.value = config.cosinePhase;
  u.cosineSpread.value = config.cosineSpread;
  u.rampLow.value.set(config.rampLow);
  u.rampHigh.value.set(config.rampHigh);
  u.background.value.set(config.background);
  u.lineColor.value.set(config.lineColor);
  u.lineTint.value = config.lineTint;
  u.lineWidth.value = config.lineWidth ?? 2;
  u.outlineColor.value.set(config.outlineColor);
  u.outlineWidth.value = config.outlineWidth;
  u.imageColor.value = config.imageColor;
  const name = config.colorMode === 'palette' ? config.paletteName : null;
  const exact = Boolean(config.paletteExact);
  if (name !== s.paletteName || exact !== s.paletteExact) {
    s.paletteName = name;
    s.paletteExact = exact;
    s.palette?.dispose();
    s.palette = name ? createPaletteTexture(name, { exact }) : null;
    s.setTexture('palette', s.palette);
  }
}

// The field grid (and the source's colours) from a build.
export function uploadBuild(s, build) {
  s.u.nx.value = build.nx;
  s.u.ny.value = build.ny;
  s.upload('field', build.values, build.nx + 1, build.ny + 1, THREE.RedFormat);
  if (build.colors) {
    s.upload(
      'color',
      build.colors,
      build.nx + 1,
      build.ny + 1,
      THREE.RGBAFormat
    );
  }
  s.u.hasImage.value = build.colors ? 1 : 0;
}

// The flat piece as one imperative object, drawn by the scene, the headless
// CLIs and Darkroom alike: one plane facing +z, two units tall and as wide
// as the field's aspect. `apply(config)` sets the look, `setBuild(build)`
// takes what @modules/isoLines' builder made.
export default function createIsoRig() {
  const s = createShading();
  const group = new THREE.Group();
  const materials = {
    lines: createFlatMaterial(s, 'lines'),
    terraced: createFlatMaterial(s, 'terraced'),
  };
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2, 1, 1),
    materials.terraced
  );
  mesh.frustumCulled = false;
  group.add(mesh);

  return {
    group,

    apply(config) {
      applyShading(s, config);
      mesh.material = materials[config.style] ?? materials.terraced;
    },

    setBuild(build) {
      s.u.aspect.value = build.aspect;
      mesh.scale.x = build.aspect;
      uploadBuild(s, build);
    },

    setPixelRatio(ratio) {
      s.u.pixelRatio.value = ratio;
    },

    dispose() {
      mesh.geometry.dispose();
      Object.values(materials).forEach((m) => m.dispose());
      s.dispose();
    },
  };
}
