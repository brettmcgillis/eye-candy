export default /* glsl */ `
uniform sampler2D paintNativeMap;
uniform float paintBleed;
uniform float paintPooling;
uniform float paintHatchRoughness;
uniform float paintStrokeRoughness;
uniform float paintFollowPalette;
uniform float paintPaletteOn;
uniform vec3 paintPalette0;
uniform vec3 paintPalette1;
uniform vec3 paintPalette2;
vec3 paintColorFor(vec3 base, float role) {
  vec3 pigment = role < 0.5 ? paintPalette0 : (role < 1.5 ? paintPalette1 : paintPalette2);
  return mix(base, pigment, paintPaletteOn * paintFollowPalette);
}
vec3 paintInkFor(vec3 base) {
  return mix(paintInk, base * 0.38, paintFollowPalette);
}
float paintMarkNoise(vec2 coord,uint seed) {
  uint identity=seed^paintRootSeed;vec2 cell=floor(coord);vec2 f=fract(coord);vec2 b=f*f*(3.0-2.0*f);
  return mix(mix(pigmentRandom(cell,identity,0u),pigmentRandom(cell+vec2(1.0,0.0),identity,0u),b.x),mix(pigmentRandom(cell+vec2(0.0,1.0),identity,0u),pigmentRandom(cell+vec2(1.0),identity,0u),b.x),b.y);
}
vec4 paintWashMarkSeed(vec2 coord, uint seed) {
  uint identity = seed ^ paintRootSeed;
  float variant = floor(pigmentHash(identity + 317u) * 16.0);
  float angle = floor(pigmentHash(identity + 41u) * 4.0) * 1.5707963;
  vec2 q = coord - 0.5;
  vec2 turned = vec2(q.x*cos(angle)-q.y*sin(angle),q.x*sin(angle)+q.y*cos(angle));
  vec2 warp = (vec2(paintMarkNoise(coord*4.0,seed+71u),paintMarkNoise(coord*4.0,seed+137u))-0.5)*0.045;
  vec2 at = turned*(pigmentHash(identity+53u)*0.1+0.7)+0.5+warp;
  vec2 tile = vec2(mod(variant,4.0),floor(variant/4.0));
  float inside = float(all(greaterThan(at,vec2(0.0))) && all(lessThan(at,vec2(1.0))));
  return texture2D(paintNativeMap,(clamp(at,0.005,0.995)+tile)/vec2(4.0,8.0))*inside;
}
vec4 paintWashMark(vec2 coord,float seed) { return paintWashMarkSeed(coord,uint(seed)); }
vec3 paintWashField(vec2 coord, float seed) {
  vec2 point=coord+(vec2(paintMarkNoise(coord*0.61,uint(seed)+419u),paintMarkNoise(coord*0.61,uint(seed)+653u))-0.5)*0.55;
  vec2 cell=floor(point);float dry=1.0;float pool=0.0;
  for(int y=0;y<2;y++)for(int x=0;x<2;x++){
    vec2 key=cell+vec2(float(x),float(y));
    uint identity=(uint(int(key.x))*374761393u)^(uint(int(key.y))*668265263u)^uint(seed);
    vec2 delta=point-key;
    float support=1.0-smoothstep(0.8,1.0,max(abs(delta.x),abs(delta.y)));
    vec4 depositMark=paintWashMarkSeed(delta*0.55+0.5,identity)*support;
    dry *= 1.0-depositMark.r*0.45;pool+=depositMark.b;
  }
  return vec3(1.0-dry,0.0,pool*0.35);
}
float paintHatch(float projection,float along,float seed) {
  float line=floor(projection+0.5);
  uint identity=uint(seed)^paintRootSeed^(uint(int(line))*747796405u);
  float phase=pigmentHash(identity+17u);
  float wobble=sin(along*2.7+phase*21.0)*0.12+sin(along*8.1+phase*37.0)*0.035;
  float displacement=((phase-0.5)*0.35+wobble)*paintHatchRoughness;
  float pressure=sin(along*1.3+phase*19.0)*0.45+1.0;
  float width=max(fwidth(projection),0.001)*0.6*mix(1.0,pressure,paintHatchRoughness);
  float distance=abs(fract(projection+displacement+0.5)-0.5);
  float primary=1.0-smoothstep(width*0.2,width,distance);
  float echo=abs(fract(projection+displacement*0.6+phase*0.15+0.62)-0.5);
  return max(primary,(1.0-smoothstep(width*0.15,width*0.7,echo))*paintHatchRoughness*0.3);
}
`;
