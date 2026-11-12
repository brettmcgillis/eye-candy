import { Color } from 'three';

import { hashPaintSeed } from '@modules/painted';

import createMarkUniforms from './markUniforms';
import marksGlsl from './marks.glsl';
import paintPaletteColors from './palette';
import createPigmentTexture from './pigment';
import pigmentFieldGlsl from './pigmentField.glsl';
import subjectWashGlsl from './subjectWash.glsl';

export default function createPaintMaterial(
  original,
  config,
  {
    color = null,
    uvMapping = false,
    shading = 'surface',
    bounded = false,
    paletteRole = false,
    seed,
  } = {}
) {
  if (seed === undefined)
    throw new Error('A painted material requires a fill identity');
  const material = original.clone();
  const specimen = shading === 'specimen';
  const map = createPigmentTexture();
  if (color) material.color.set(color);
  const colors = paintPaletteColors(config);
  if (colors && (color || paletteRole))
    material.color.set(colors[Math.floor(seed) % colors.length]);
  const marks = createMarkUniforms(config);
  if ('metalness' in material) material.metalness = 0;
  if ('roughness' in material) material.roughness = 1;
  if (material.emissive) material.emissive.set(0);
  material.map = null;
  material.normalMap = null;
  if (specimen) material.toneMapped = false;
  material.roughnessMap = null;
  const uniforms = {
    ...marks.uniforms,
    paintMap: { value: map },
    paintSeed: { value: seed },
    paintRootSeed: {
      value: hashPaintSeed(
        config.seed ?? config.generationSeed ?? config.haloSeed ?? 'painted'
      ),
    },
    paintOpacity: { value: config.paintOpacity ?? 0.75 },
    paintScale: { value: config.paintScale ?? 1 },
    paintGrain: { value: config.paintGrain ?? 0.18 },
    paintPaper: { value: new Color(config.paintPaper ?? '#f6f2e9') },
    paintInk: { value: new Color(config.paintInk ?? '#514a45') },
    paintPencil: { value: config.paintStyle === 'pencil' ? 1 : 0 },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    const vertexShader =
      `varying vec3 paintPosition;\nvarying vec2 paintCoordinates;\nvarying float paintIdentity;\nuniform float paintSeed;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
paintPosition = position;
paintCoordinates = uv;
paintIdentity = paintSeed;
#ifdef USE_INSTANCING
paintIdentity += float(gl_InstanceID);
#endif
${bounded ? 'paintIdentity = paintIdentity * 16.0 + dot(normal, vec3(1.0, 3.0, 5.0)) + 5.0;' : ''}`
      );
    let fragmentShader = `varying vec3 paintPosition;
varying vec2 paintCoordinates;
varying float paintIdentity;
uniform sampler2D paintMap;
uniform uint paintRootSeed;
uniform float paintOpacity;
uniform float paintScale;
uniform float paintGrain;
uniform float paintPencil;
uniform vec3 paintPaper;
uniform vec3 paintInk;
${pigmentFieldGlsl}
${marksGlsl}
${specimen ? subjectWashGlsl : ''}
${shader.fragmentShader}`.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
vec2 paintUV = ${uvMapping ? 'paintCoordinates' : '(paintPosition.xy * 0.35 + paintPosition.z * vec2(0.17, 0.23))'} * paintScale;
vec4 paintMark = pigmentField(paintUV, paintIdentity);
float deposit = paintMark.r;
float paperTooth = pigmentNoise(paintUV * 113.0, paintIdentity + 641.0) - 0.5;
float amount = clamp(0.32 + deposit * 1.6 + paperTooth * paintGrain, 0.0, 1.0) * paintOpacity;
${
  bounded
    ? `
float inside = min(min(paintCoordinates.x, 1.0 - paintCoordinates.x), min(paintCoordinates.y, 1.0 - paintCoordinates.y));
float margin = paintMark.r * 0.1 + 0.025;
float wet = clamp((inside - margin) / 0.035, 0.0, 1.0);
float rim = 1.0 - clamp(abs(inside - margin) / 0.04, 0.0, 1.0);
amount = clamp(amount + rim * 0.2 * paintOpacity, 0.0, 1.0) * wet * wet * (3.0 - 2.0 * wet);
`
    : ''
}
if (paintBleed + paintPooling > 0.001) {
  vec3 native = ${bounded ? 'paintWashMark(paintCoordinates,paintIdentity).rgb' : 'paintWashField(paintUV,paintIdentity)'};
  float wet = clamp(native.r*1.8+native.b*paintPooling*1.5+paperTooth*paintGrain*native.r,0.0,1.0)*paintOpacity;
  amount=clamp(mix(amount,wet,paintBleed)+native.b*paintPooling*0.2,0.0,1.0);
}
vec3 wash = mix(paintPaper, diffuseColor.rgb, amount);
float hatch = paintHatch((paintUV.x+paintUV.y*0.5)*24.0,paintUV.y*8.0,paintIdentity);
vec3 drawing = mix(mix(paintPaper, diffuseColor.rgb, amount * 0.3), paintInkFor(diffuseColor.rgb), clamp(hatch * 0.7, 0.0, 1.0));
diffuseColor.rgb = mix(wash, drawing, paintPencil);`
    );
    if (specimen) {
      fragmentShader = fragmentShader.replace(
        '#include <opaque_fragment>',
        'outgoingLight = paintedSubjectColor(diffuseColor.rgb, paintCoordinates * 0.9 + paintPosition.xy * 0.025, normal);\n#include <opaque_fragment>'
      );
    }
    Object.assign(shader, { vertexShader, fragmentShader });
  };
  material.customProgramCacheKey = () =>
    `native-brush-v7:${shading}:${uvMapping}:${bounded}`;
  material.addEventListener('dispose', () => {
    map.dispose();
    marks.dispose();
  });
  return material;
}
