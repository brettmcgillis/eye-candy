import {
  createErosionField,
  createErosionProbe,
  createFieldUniforms,
  createShadingUniforms,
  setColor,
} from '@modules/terrainErosion';

export const MOUNTAIN_SHAPES = ['Range', 'Single Peak'];

// A range erodes fractal noise the way the animated reference does; a single peak
// erodes one brush stamp the way its mouse-painted variant does, and the painted
// variant carries its own onset and no height offset. Same two setups, no paint
// buffer needed to reach the second one.
const SHAPE_SETUP = {
  Range: { heightOffset: -0.65, mode: 'procedural', onsetInput: 1.25 },
  'Single Peak': { heightOffset: 0, mode: 'dome', onsetInput: 0.7 },
};

const FIELD_KEYS = [
  'shape',
  'erosionScale',
  'erosionStrength',
  'erosionGullyWeight',
  'erosionDetail',
  'erosionOctaves',
  'mountainFrequency',
  'mountainAmplitude',
  'mountainTreeline',
  'peakRadius',
  'peakAmplitude',
];

export function fieldSignature(mountain) {
  return FIELD_KEYS.map((key) => mountain[key]).join('|');
}

export default function createMountainField({ palette, resolution }) {
  const uniforms = { ...createFieldUniforms(), ...createShadingUniforms() };
  const field = createErosionField({ resolution, uniforms });
  const probe = createErosionProbe({ sampling: field });

  let mode = 'procedural';

  function applyConfig(mountain) {
    const setup = SHAPE_SETUP[mountain.shape] ?? SHAPE_SETUP.Range;
    mode = setup.mode;

    uniforms.scale.value = mountain.erosionScale;
    uniforms.strength.value = mountain.erosionStrength;
    uniforms.gullyWeight.value = mountain.erosionGullyWeight;
    uniforms.detail.value = mountain.erosionDetail;
    uniforms.octaves.value = mountain.erosionOctaves;
    uniforms.onset.value.setX(setup.onsetInput);
    uniforms.heightOffset.value.setX(setup.heightOffset);

    uniforms.heightFrequency.value = mountain.mountainFrequency;
    uniforms.heightAmplitude.value = mountain.mountainAmplitude;
    uniforms.domeRadius.value = mountain.peakRadius;
    uniforms.domeAmplitude.value = mountain.peakAmplitude;

    uniforms.grassHeight.value = mountain.mountainTreeline;
    uniforms.waterEnabled.value = 0;
    uniforms.drainageEnabled.value = 1;

    probe.uniforms.base.value = mountain.baseHeight;
    probe.uniforms.extent.value = mountain.extent;
    probe.uniforms.scale.value = mountain.relief;

    const colors = palette[mountain.palette] ?? palette.Monochrome;
    Object.entries(colors).forEach(([key, hex]) =>
      setColor(uniforms[key], hex)
    );
  }

  return {
    applyConfig,
    bake(renderer) {
      field.bakeDetail(renderer);
      field.bakeHeight(renderer, mode);
    },
    dispose: field.dispose,
    field,
    probe,
    uniforms,
  };
}
