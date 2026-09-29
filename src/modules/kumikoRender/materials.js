import {
  Discard,
  Fn,
  attribute,
  float,
  fract,
  or,
  positionLocal,
  positionWorld,
  select,
  texture,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createNeutralPaletteTexture } from '@utils/gradientPalette';

import grainShade from './grain';

export const COLOR_MODES = { cell: 0, random: 2, size: 1, source: 3 };

// 0..1 folded back and forth rather than wrapped, so a shifted palette runs
// back through its stops instead of jumping from the last to the first.
const mirror = (t) => float(1).sub(fract(t.mul(0.5)).mul(2).sub(1).abs());

// The wood and paper every baked cell is drawn with. Everything the look
// depends on is a uniform or a per-cell attribute, so palette, colour and
// grain edits never touch geometry: `cellData` is (tone, random, fade,
// luma) and `cellSource` the image's colour under the cell.
export default function createPanelMaterials() {
  const u = {
    backlight: uniform(1),
    grain: uniform(0.6),
    halfH: uniform(4.5),
    halfW: uniform(3),
    mode: uniform(0),
    paintOpenings: uniform(1),
    paintStrips: uniform(0),
    paperColor: uniform(new THREE.Color()),
    paperSink: uniform(0.004),
    repeat: uniform(1),
    shift: uniform(0),
    sink: uniform(0.2),
    slab: uniform(1),
    woodColor: uniform(new THREE.Color()),
  };
  const lut = texture(createNeutralPaletteTexture());
  const cell = attribute('cellData', 'vec4');
  const source = attribute('cellSource', 'vec3');
  const own = attribute('tone', 'vec3');

  const tone = () => {
    const byMode = select(
      u.mode.equal(COLOR_MODES.size),
      own.z,
      select(
        u.mode.equal(COLOR_MODES.random),
        fract(own.y.add(cell.y.mul(7.13))),
        cell.x
      )
    );
    return mirror(byMode.mul(u.repeat).add(u.shift));
  };
  const paint = () =>
    select(
      u.mode.equal(COLOR_MODES.source),
      source,
      lut.sample(vec2(tone(), 0.5)).rgb
    );
  // Cells run on past the panel's edge under the border; nothing shows
  // beyond it.
  const clip = () =>
    Discard(
      or(
        positionWorld.x.abs().greaterThan(u.halfW),
        positionWorld.y.abs().greaterThan(u.halfH)
      )
    );

  const wood = new THREE.MeshStandardNodeMaterial({ roughness: 0.6 });
  wood.colorNode = Fn(() => {
    clip();
    const base = select(
      u.paintStrips.greaterThan(0.5),
      paint(),
      vec3(u.woodColor)
    );
    return base.mul(grainShade(u.grain, u.slab));
  })();
  wood.positionNode = positionLocal.sub(
    vec3(0, 0, float(1).sub(cell.z).mul(u.sink))
  );

  const paper = new THREE.MeshStandardNodeMaterial({ roughness: 0.95 });
  const paperTint = () =>
    select(u.paintOpenings.greaterThan(0.5), paint(), vec3(u.paperColor));
  paper.colorNode = Fn(() => {
    clip();
    return paperTint();
  })();
  paper.emissiveNode = paperTint().mul(u.backlight);
  paper.positionNode = positionLocal.sub(
    vec3(0, 0, float(1).sub(cell.z).mul(u.paperSink))
  );

  const frame = new THREE.MeshStandardNodeMaterial({ roughness: 0.55 });
  frame.colorNode = vec3(u.woodColor).mul(0.82).mul(grainShade(u.grain));

  const basePaper = new THREE.MeshStandardNodeMaterial({ roughness: 0.95 });
  basePaper.colorNode = vec3(u.paperColor);
  basePaper.emissiveNode = vec3(u.paperColor).mul(u.backlight);

  return {
    basePaper,
    frame,
    lut,
    paper,
    uniforms: u,
    wood,
    dispose() {
      [wood, paper, frame, basePaper].forEach((m) => m.dispose());
      lut.value.dispose();
    },
  };
}
