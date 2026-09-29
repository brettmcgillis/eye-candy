import * as THREE from 'three/webgpu';

import { createPaletteTexture } from '@utils/gradientPalette';

import createCellLayer from './cells';
import { buildBasePaper, buildFrames } from './frames';
import createPanelMaterials, { COLOR_MODES } from './materials';
import { MM } from './prism';

// Keys that change a baked cell's geometry rather than its look.
const GEOMETRY_KEYS = [
  'construction',
  'infillDepth',
  'infillRecess',
  'jigumiDepth',
  'jointGap',
];

const modeFor = (colorBy) => COLOR_MODES[colorBy] ?? COLOR_MODES.cell;

// The one object the scene and the CLI both draw a panel with: every leaf
// an instance of its baked cell, plus the frames and the paper behind.
export default function createPanelRig() {
  const group = new THREE.Group();
  const materials = createPanelMaterials();
  const cells = createCellLayer(group, materials);
  const frames = new THREE.Mesh(new THREE.BufferGeometry(), materials.frame);
  const paper = new THREE.Mesh(new THREE.BufferGeometry(), materials.basePaper);
  Object.assign(frames, {
    castShadow: true,
    receiveShadow: true,
    visible: false,
  });
  Object.assign(paper, { receiveShadow: true, visible: false });
  group.add(frames, paper);

  let box = { center: [0, 0, 0], radius: 1, size: [1, 1, 0.1] };
  let outline = '';
  let palette = '';
  let exact = null;

  const swap = (mesh, geometry) => {
    mesh.geometry.dispose();
    Object.assign(mesh, { geometry, visible: true });
  };

  return {
    group,

    // A buildLeaves result. Frames only rebuild when the outline changes.
    setPanel(result, config, { immediate = false } = {}) {
      const shape = JSON.stringify([
        result.width,
        result.height,
        result.inner,
        result.frames,
        config.borderWidth,
        config.borderDepth,
        config.jigumiDepth,
        config.paperColor,
      ]);
      if (shape !== outline) {
        outline = shape;
        swap(frames, buildFrames(result, config));
        swap(paper, buildBasePaper(result, config));
      }
      cells.setLeaves(result, config, {
        geometry: GEOMETRY_KEYS.map((key) => config[key]).join(':'),
        immediate,
      });
      const w = result.width * MM;
      const h = result.height * MM;
      const d = (config.jigumiDepth + 3) * MM;
      box = {
        center: [0, 0, d / 2],
        radius: Math.hypot(w, h) / 2,
        size: [w, h, d],
      };
      this.setConfig(config, result);
      if (immediate) cells.tick(0, 0);
      return box;
    },

    setConfig(config, result = null) {
      const u = materials.uniforms;
      u.woodColor.value.set(config.woodColor);
      u.paperColor.value.set(config.paperColor);
      u.backlight.value = config.backlight;
      u.grain.value = config.woodGrain;
      u.slab.value = config.construction === 'slab' ? 1 : 0;
      u.mode.value = modeFor(config.colorBy);
      u.paintOpenings.value = ['openings', 'both'].includes(config.colorTarget)
        ? 1
        : 0;
      u.paintStrips.value = ['strips', 'both'].includes(config.colorTarget)
        ? 1
        : 0;
      u.shift.value = config.paletteShift;
      u.repeat.value = config.paletteRepeat;
      u.sink.value = (config.jigumiDepth + 1) * MM;
      if (result) {
        u.halfW.value = (result.width / 2) * MM;
        u.halfH.value = (result.height / 2) * MM;
      }
      if (config.palette !== palette || config.paletteExact !== exact) {
        palette = config.palette;
        exact = config.paletteExact;
        const old = materials.lut.value;
        materials.lut.value = createPaletteTexture(config.palette, {
          exact: config.paletteExact,
        });
        old.dispose();
      }
      [materials.wood, materials.frame].forEach((m) => {
        Object.assign(m, { roughness: config.roughness });
      });
      paper.visible =
        config.showPaper && paper.geometry.attributes.position?.count > 0;
      materials.paper.visible = config.showPaper;
    },

    tick: (dt, ease) => cells.tick(dt, ease),

    bounds: () => box,

    dispose() {
      cells.dispose();
      frames.geometry.dispose();
      paper.geometry.dispose();
      materials.dispose();
    },
  };
}
