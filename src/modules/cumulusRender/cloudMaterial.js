import { Color, SpriteMaterial } from 'three';

import { hashPaintSeed } from '@modules/painted';
import {
  createMarkUniforms,
  paintFieldGlsl,
  paintMarksGlsl,
  paintPaletteColors,
} from '@modules/paintedRender';

export default function createCloudMaterial(
  map,
  seed,
  config,
  nativeMap = null
) {
  const material = new SpriteMaterial({
    map,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const marks = createMarkUniforms(config, nativeMap);
  const colors = paintPaletteColors(config);
  const light = new Color('#dee8ed');
  const dark = new Color('#829dba');
  if (config.paintFollowPalette) {
    light
      .set(colors?.[2] ?? config.cloudColor)
      .lerp(new Color('#ffffff'), 0.45);
    dark.set(colors?.[0] ?? config.cloudColor).multiplyScalar(0.65);
  }
  material.addEventListener('dispose', () => marks.dispose());
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      ...marks.uniforms,
      paintInk: { value: new Color(config.paintInk) },
      paintMap: { value: map },
      paintRootSeed: { value: hashPaintSeed(config.cloudSeed) },
      cloudIdentity: { value: seed },
      cloudScale: { value: config.paintScale },
      cloudLight: { value: light },
      cloudDark: { value: dark },
    });
    Object.assign(shader, {
      fragmentShader: `
uniform vec3 paintInk;
uniform sampler2D paintMap;
uniform uint paintRootSeed;
uniform float cloudIdentity;
uniform float cloudScale;
uniform vec3 cloudLight;
uniform vec3 cloudDark;
${paintFieldGlsl}
${paintMarksGlsl}
${shader.fragmentShader}`.replace(
        '#include <map_fragment>',
        `
vec4 cloudMark = pigmentField(vMapUv * 3.0 * cloudScale, cloudIdentity);
vec2 shapeUV = vMapUv + (cloudMark.rg - 0.35) * 0.08;
float coverage = clamp(texture2D(paintMap, shapeUV).b * 2.83, 0.0, 1.0);
diffuseColor.rgb *= mix(cloudLight, cloudDark, clamp(cloudMark.r * 1.7, 0.0, 1.0));
float opacity = coverage * clamp(cloudMark.r * 1.6 + 0.25, 0.0, 0.8);
if (paintBleed > 0.001) {
  vec3 wet = paintWashField(vMapUv*3.0*cloudScale,cloudIdentity);
  opacity=mix(opacity,opacity*clamp(wet.r*2.0+wet.b*paintPooling,0.0,1.0),paintBleed);
}
diffuseColor.a *= opacity;
`
      ),
    });
  };
  material.customProgramCacheKey = () => 'seeded-cloud-v3';
  return material;
}
