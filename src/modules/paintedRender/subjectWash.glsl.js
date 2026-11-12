import { Color } from 'three';

const cool = new Color('#7c8eaa').toArray().join(', ');
const warm = new Color('#b8a183').toArray().join(', ');

export default `
vec3 paintedSubjectColor(vec3 base, vec2 coordinates, vec3 surfaceNormal) {
  vec2 point = coordinates * paintScale;
  float deposit = pigmentField(point, paintIdentity).r;
  float second = pigmentField(point * 0.73 + vec2(0.31, 0.47), paintIdentity + 19.0).r;
  float light = dot(surfaceNormal, normalize(vec3(-0.8, 0.55, 0.2))) * 0.5 + 0.5;
  float broken = light + (deposit - 0.25) * 0.2;
  float shadow = 1.0 - smoothstep(0.4, 0.68, broken);
  float midtone = 1.0 - smoothstep(0.66, 0.9, broken);
  float coverage = shadow * 0.75 + midtone * 0.25;
  vec3 pigment = mix(vec3(${cool}), vec3(${warm}), clamp(second * 1.5, 0.0, 1.0));
  pigment = mix(pigment,mix(paintColorFor(base*0.65,0.0),paintColorFor(base,2.0),clamp(second*1.5,0.0,1.0)),paintFollowPalette);
  float grain = (pigmentField(point * 19.3, paintIdentity + 71.0).r - 0.3) * paintGrain;
  float density = clamp(coverage * (deposit * 0.8 + 0.55 + grain) * paintOpacity * mix(1.0, 0.2, paintPencil), 0.0, 1.0);
  vec3 paper = mix(paintPaper, base, 0.12);
  if (paintBleed > 0.001) {
    vec3 native=paintWashField(point,paintIdentity);
    float wetDensity=clamp(density*clamp(native.r*2.0,0.0,1.0)+native.b*paintPooling*0.4,0.0,1.0);
    density=mix(density,wetDensity,paintBleed);
  }
  vec3 wash = mix(paper, pigment, density);
  float pencil = pigmentField(vec2(point.x + point.y * 0.35, point.y * 2.0), paintIdentity).g;
  pencil=mix(pencil,paintHatch((point.x+point.y*0.35)*24.0,point.y*8.0,paintIdentity),paintHatchRoughness);
  float edge = 1.0 - smoothstep(0.04, 0.22, abs(surfaceNormal.z));
  float ink = clamp(shadow * pencil * mix(0.32, 1.6, paintPencil) + edge * (pencil * 0.8 + 0.3), 0.0, 0.75);
  return mix(wash, paintInkFor(pigment), ink);
}
`;
