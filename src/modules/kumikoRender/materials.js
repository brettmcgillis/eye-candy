import {
  Discard,
  Fn,
  attribute,
  cos,
  float,
  fract,
  hash,
  mix,
  or,
  positionLocal,
  positionWorld,
  select,
  sin,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createPaintState } from '@modules/paintedRender';
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
  const painting = createPaintState();
  const u = {
    backlight: uniform(1),
    paperLayout: uniform(0),
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
    const pencil = painting.field(
      uv().mul(vec2(7, 1)),
      cell.y.mul(151).add(own.y.mul(79))
    ).g;
    const sketch = mix(
      vec3(u.paperColor),
      painting.inkFor(paint()),
      pencil.mul(1.6).add(0.45).clamp(0, 0.95)
    );
    return select(
      u.paperLayout.greaterThan(0.5).and(painting.u.style.greaterThan(1.5)),
      sketch,
      base.mul(grainShade(u.grain, u.slab))
    );
  })();
  wood.positionNode = positionLocal.sub(
    vec3(0, 0, float(1).sub(cell.z).mul(u.sink))
  );

  const paper = new THREE.MeshStandardNodeMaterial({ roughness: 0.95 });
  const paperTint = () =>
    select(u.paintOpenings.greaterThan(0.5), paint(), vec3(u.paperColor));
  const fillIdentity = attribute('paintIdentity', 'float')
    .toUint()
    .shiftLeft(16)
    .bitOr(attribute('paintOpening', 'vec4').x.toUint());
  const washedPaper = painting.treat(paperTint(), uv().mul(0.8).add(0.1), {
    seed: fillIdentity,
    stamp: true,
    boundary: attribute('paintOpening', 'vec4')
      .x.fract()
      .greaterThan(0.125)
      .and(attribute('paintOpening', 'vec4').x.fract().lessThan(0.625))
      .select(float(1), attribute('paintOpening', 'vec4').y),
    washUV: attribute('paintOpening', 'vec4').zw,
    triangle: attribute('paintOpening', 'vec4')
      .x.fract()
      .greaterThan(0.125)
      .and(attribute('paintOpening', 'vec4').x.fract().lessThan(0.375))
      .select(float(1), float(0)),
  });
  const hatchSeed = hash(fillIdentity);
  const angle = hatchSeed.mul(0.25).add(0.55);
  const position = attribute('position', 'vec3');
  const projection = position.x
    .mul(cos(angle))
    .add(position.y.mul(sin(angle)))
    .mul(22)
    .add(hatchSeed);
  const hatch = painting.hatch(projection, position.y.mul(22), fillIdentity);
  const margin = uv().min(float(1).sub(uv()));
  const inset = smoothstep(0.01, 0.06, margin.x.min(margin.y));
  const drawing = mix(
    vec3(u.paperColor),
    painting.inkFor(paperTint()),
    hatch.mul(inset).mul(hatchSeed.mul(0.2).add(0.45))
  );
  const paperWash = select(
    painting.u.style.greaterThan(1.5),
    drawing,
    washedPaper
  );
  paper.colorNode = Fn(() => {
    clip();
    return select(u.paperLayout.greaterThan(0.5), vec3(0), paperWash);
  })();
  paper.emissiveNode = paperWash.mul(
    select(u.paperLayout.greaterThan(0.5), 1, u.backlight)
  );
  paper.positionNode = positionLocal.sub(
    vec3(0, 0, float(1).sub(cell.z).mul(u.paperSink))
  );

  const frame = new THREE.MeshStandardNodeMaterial({ roughness: 0.55 });
  frame.colorNode = vec3(u.woodColor).mul(0.82).mul(grainShade(u.grain));

  const basePaper = new THREE.MeshStandardNodeMaterial({ roughness: 0.95 });
  basePaper.colorNode = vec3(u.paperColor).mul(u.paperLayout.oneMinus());
  basePaper.emissiveNode = vec3(u.paperColor).mul(
    select(u.paperLayout.greaterThan(0.5), 1, u.backlight)
  );

  return {
    painting,
    basePaper,
    frame,
    lut,
    paper,
    uniforms: u,
    wood,
    dispose() {
      [wood, paper, frame, basePaper].forEach((m) => m.dispose());
      lut.value.dispose();
      painting.dispose();
    },
  };
}
