import{C as u}from"./index-BMaCTZDK.js";import{a as x,p as v,c as b,h as P,s as k}from"./subjectWash.glsl-B33jP5Q7.js";function w(a,t=null){const n=t?null:x(),l=t??n.map,o=v(a);return{uniforms:{paintNativeMap:{value:l},paintBleed:{value:a.paintBleed??0},paintPooling:{value:a.paintPooling??0},paintHatchRoughness:{value:a.paintHatchRoughness??0},paintStrokeRoughness:{value:a.paintStrokeRoughness??0},paintFollowPalette:{value:a.paintFollowPalette?1:0},paintPaletteOn:{value:o?1:0},...Object.fromEntries([0,1,2].map(i=>[`paintPalette${i}`,{value:new u(o?.[i]??"#514a45")}]))},dispose(){n?.dispose()}}}const S=`
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
`,C=`
float pigmentHash(uint seed) {
  uint state = seed * 747796405u + 2891336453u;
  uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return float((word >> 22u) ^ word) * (1.0 / 4294967296.0);
}
float pigmentRandom(vec2 cell, uint identity, uint salt) {
  uint key = (uint(int(cell.x)) * 374761393u) ^ (uint(int(cell.y)) * 668265263u) ^ identity;
  return pigmentHash(key + salt);
}
float pigmentNoise(vec2 coord, float seed) {
  uint identity = uint(seed) ^ paintRootSeed;
  vec2 cell = floor(coord);
  vec2 f = fract(coord);
  vec2 b = f*f*(3.0-2.0*f);
  return mix(mix(pigmentRandom(cell,identity,0u),pigmentRandom(cell+vec2(1.0,0.0),identity,0u),b.x),
    mix(pigmentRandom(cell+vec2(0.0,1.0),identity,0u),pigmentRandom(cell+vec2(1.0),identity,0u),b.x),b.y);
}
vec4 pigmentCorner(vec2 p, vec2 cell, uint identity) {
  float angle = pigmentRandom(cell, identity, 0u) * 6.283185;
  vec2 q = p - cell;
  vec2 turned = vec2(q.x * cos(angle) - q.y * sin(angle), q.x * sin(angle) + q.y * cos(angle));
  vec2 offset = (vec2(pigmentRandom(cell,identity,19u), pigmentRandom(cell,identity,73u)) - 0.5) * 0.35;
  return texture2D(paintMap, turned * 0.14 + offset + 0.5);
}
vec4 pigmentField(vec2 coord, float seed) {
  uint identity = uint(seed) ^ paintRootSeed;
  vec2 p = coord + vec2(pigmentHash(identity + 17u), pigmentHash(identity + 71u)) * 11.0;
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 b = f * f * (3.0 - 2.0 * f);
  return mix(mix(pigmentCorner(p, cell, identity), pigmentCorner(p, cell + vec2(1.0, 0.0), identity), b.x),
    mix(pigmentCorner(p, cell + vec2(0.0, 1.0), identity), pigmentCorner(p, cell + vec2(1.0), identity), b.x), b.y);
}
`;function I(a,t,{color:n=null,uvMapping:l=!1,shading:o="surface",bounded:i=!1,paletteRole:y=!1,seed:r}={}){if(r===void 0)throw new Error("A painted material requires a fill identity");const e=a.clone(),s=o==="specimen",m=b();n&&e.color.set(n);const c=v(t);c&&(n||y)&&e.color.set(c[Math.floor(r)%c.length]);const f=w(t);"metalness"in e&&(e.metalness=0),"roughness"in e&&(e.roughness=1),e.emissive&&e.emissive.set(0),e.map=null,e.normalMap=null,s&&(e.toneMapped=!1),e.roughnessMap=null;const g={...f.uniforms,paintMap:{value:m},paintSeed:{value:r},paintRootSeed:{value:P(t.seed??t.generationSeed??t.haloSeed??"painted")},paintOpacity:{value:t.paintOpacity??.75},paintScale:{value:t.paintScale??1},paintGrain:{value:t.paintGrain??.18},paintPaper:{value:new u(t.paintPaper??"#f6f2e9")},paintInk:{value:new u(t.paintInk??"#514a45")},paintPencil:{value:t.paintStyle==="pencil"?1:0}};return e.onBeforeCompile=p=>{Object.assign(p.uniforms,g);const h=`varying vec3 paintPosition;
varying vec2 paintCoordinates;
varying float paintIdentity;
uniform float paintSeed;
${p.vertexShader}`.replace("#include <begin_vertex>",`#include <begin_vertex>
paintPosition = position;
paintCoordinates = uv;
paintIdentity = paintSeed;
#ifdef USE_INSTANCING
paintIdentity += float(gl_InstanceID);
#endif
${i?"paintIdentity = paintIdentity * 16.0 + dot(normal, vec3(1.0, 3.0, 5.0)) + 5.0;":""}`);let d=`varying vec3 paintPosition;
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
${C}
${S}
${s?k:""}
${p.fragmentShader}`.replace("#include <map_fragment>",`#include <map_fragment>
vec2 paintUV = ${l?"paintCoordinates":"(paintPosition.xy * 0.35 + paintPosition.z * vec2(0.17, 0.23))"} * paintScale;
vec4 paintMark = pigmentField(paintUV, paintIdentity);
float deposit = paintMark.r;
float paperTooth = pigmentNoise(paintUV * 113.0, paintIdentity + 641.0) - 0.5;
float amount = clamp(0.32 + deposit * 1.6 + paperTooth * paintGrain, 0.0, 1.0) * paintOpacity;
${i?`
float inside = min(min(paintCoordinates.x, 1.0 - paintCoordinates.x), min(paintCoordinates.y, 1.0 - paintCoordinates.y));
float margin = paintMark.r * 0.1 + 0.025;
float wet = clamp((inside - margin) / 0.035, 0.0, 1.0);
float rim = 1.0 - clamp(abs(inside - margin) / 0.04, 0.0, 1.0);
amount = clamp(amount + rim * 0.2 * paintOpacity, 0.0, 1.0) * wet * wet * (3.0 - 2.0 * wet);
`:""}
if (paintBleed + paintPooling > 0.001) {
  vec3 native = ${i?"paintWashMark(paintCoordinates,paintIdentity).rgb":"paintWashField(paintUV,paintIdentity)"};
  float wet = clamp(native.r*1.8+native.b*paintPooling*1.5+paperTooth*paintGrain*native.r,0.0,1.0)*paintOpacity;
  amount=clamp(mix(amount,wet,paintBleed)+native.b*paintPooling*0.2,0.0,1.0);
}
vec3 wash = mix(paintPaper, diffuseColor.rgb, amount);
float hatch = paintHatch((paintUV.x+paintUV.y*0.5)*24.0,paintUV.y*8.0,paintIdentity);
vec3 drawing = mix(mix(paintPaper, diffuseColor.rgb, amount * 0.3), paintInkFor(diffuseColor.rgb), clamp(hatch * 0.7, 0.0, 1.0));
diffuseColor.rgb = mix(wash, drawing, paintPencil);`);s&&(d=d.replace("#include <opaque_fragment>",`outgoingLight = paintedSubjectColor(diffuseColor.rgb, paintCoordinates * 0.9 + paintPosition.xy * 0.025, normal);
#include <opaque_fragment>`)),Object.assign(p,{vertexShader:h,fragmentShader:d})},e.customProgramCacheKey=()=>`native-brush-v7:${o}:${l}:${i}`,e.addEventListener("dispose",()=>{m.dispose(),f.dispose()}),e}export{w as a,S as b,I as c,C as p};
