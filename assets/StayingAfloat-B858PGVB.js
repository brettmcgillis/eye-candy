import{r as l,be as k,j as a,dh as ge,di as xe,aI as be,aK as Se,bt as ye,a6 as Ce,a8 as Y,aD as me,c5 as Te,aS as we,ae as ie,ag as Re,aB as je,bp as ke,a9 as L,ac as $,aF as Ee,an as Me,aq as p,bo as Oe,ao as ne}from"./index-B8ahIfg7.js";import{S as Be}from"./stayingAfloatSplines-D36pFl1U.js";import{u as E}from"./Gltf-jojXY6t_.js";import{u as he}from"./useAnimations-D1EXI6yl.js";import{c as Pe}from"./SkeletonUtils-BCVmgslc.js";import{s as _e,b as Ie,a as Le}from"./NurbsWaterColumn-CUKYkYcT.js";import{u as pe}from"./Texture-BWqg1HGJ.js";import{u as A}from"./Fbo-CsOrFTxF.js";import{S as Ae}from"./SplineLine-BcGCwhut.js";import{P as De}from"./PerspectiveCamera-DxeN9zQn.js";import{O as Ve}from"./OrbitControls-C8yG8xqa.js";import"./constants-BP0QNkg_.js";import"./Line2-DZ7oMUNN.js";import"./extends-CF3RwP-h.js";function Ue(e){const i=l.useRef(),{nodes:n,materials:s,animations:o}=E(k("/hammerHead.glb")),{actions:u}=he(o,i);return l.useEffect(()=>(Object.values(u??{}).forEach(c=>{c.reset(),c.fadeIn(.35),c.play()}),()=>{Object.values(u??{}).forEach(c=>{c.fadeOut(.2),c.stop()})}),[u]),a.jsx("group",{ref:i,...e,dispose:null,children:a.jsx("group",{name:"Sketchfab_Scene",children:a.jsx("group",{name:"Sketchfab_model",rotation:[-Math.PI/2,0,0],children:a.jsx("group",{name:"bac65c2aa79a4a3a9500cef32dd8cf74fbx",rotation:[Math.PI/2,0,0],scale:.01,children:a.jsx("group",{name:"Object_2",children:a.jsxs("group",{name:"RootNode",children:[a.jsx("group",{name:"Cube",position:[0,.712,9.972],rotation:[-Math.PI/2,0,0],scale:24.02}),a.jsx("group",{name:"Armature",position:[-.434,1.731,100.544],rotation:[-Math.PI,0,0],scale:100,children:a.jsxs("group",{name:"Object_6",children:[a.jsx("primitive",{object:n._rootJoint}),a.jsx("skinnedMesh",{name:"Object_9",geometry:n.Object_9.geometry,material:s.Material,skeleton:n.Object_9.skeleton}),a.jsx("group",{name:"Object_8",position:[0,.712,9.972],rotation:[-Math.PI/2,0,0],scale:24.02})]})})]})})})})})})}E.preload(k("/hammerHead.glb"));function se({excludeAnimations:e=[],...i}){const n=l.useRef(),{scene:s,materials:o,animations:u}=E(k("/tigerShark.glb")),c=l.useMemo(()=>Pe(s),[s]),{nodes:d}=ge(c),C=l.useMemo(()=>u.map(g=>g.clone()),[u]),{actions:v}=he(C,n);return l.useEffect(()=>{const g=e.map(f=>f.toLowerCase());return Object.entries(v??{}).forEach(([f,h])=>{g.some(y=>f.toLowerCase().includes(y))||(h.reset(),h.setLoop(xe,1/0),Object.assign(h,{clampWhenFinished:!1}),h.fadeIn(.35),h.play())}),()=>{Object.values(v??{}).forEach(f=>{f.fadeOut(.2),f.stop()})}},[v,e]),a.jsx("group",{ref:n,...i,dispose:null,children:a.jsx("group",{name:"Sketchfab_Scene",children:a.jsx("group",{name:"Sketchfab_model",rotation:[-Math.PI/2,0,0],children:a.jsx("group",{name:"Tiger_Shark_2fbx",rotation:[Math.PI/2,0,0],children:a.jsx("group",{name:"Object_2",children:a.jsxs("group",{name:"RootNode",children:[a.jsx("group",{name:"Hemi",position:[0,-124.661,0],rotation:[0,0,Math.PI],scale:100,children:a.jsx("group",{name:"Object_5",rotation:[Math.PI/2,0,0],children:a.jsx("group",{name:"Object_6"})})}),a.jsx("group",{name:"Sun",position:[209.518,114.514,0],rotation:[0,-.58,-.95],scale:100,children:a.jsx("group",{name:"Object_8",rotation:[Math.PI/2,0,0],children:a.jsx("group",{name:"Object_9"})})}),a.jsx("group",{name:"Armature",rotation:[-Math.PI/2,0,0],scale:100,children:a.jsxs("group",{name:"Object_11",children:[a.jsx("primitive",{object:d._rootJoint}),a.jsx("skinnedMesh",{name:"Object_83",geometry:d.Object_83.geometry,material:o.Tiger_shark,skeleton:d.Object_83.skeleton}),a.jsx("group",{name:"Object_82",rotation:[-Math.PI/2,0,0],scale:100})]})}),a.jsx("group",{name:"TIGER_SHARK_lowpoly",rotation:[-Math.PI/2,0,0],scale:100}),a.jsx("group",{name:"Cube",rotation:[-Math.PI/2,0,0],scale:100,children:a.jsx("mesh",{name:"Cube__0",castShadow:!0,receiveShadow:!0,geometry:d.Cube__0.geometry,material:o.Cube__0})}),a.jsx("group",{name:"Empty_SPHERE",rotation:[-Math.PI/2,0,0],scale:100})]})})})})})})}E.preload(k("/tigerShark.glb"));const ue=`
uniform sampler2D inputBuffer;
uniform vec2 direction;
uniform vec2 resolution;
varying vec2 vUv;

void main() {
  vec2 texelSize = 1.0 / resolution;
  vec3 result = vec3(0.0);

  // 9-tap Gaussian kernel (sigma ~2.5)
  result += texture2D(inputBuffer, vUv + -4.0 * direction * texelSize).rgb * 0.0162;
  result += texture2D(inputBuffer, vUv + -3.0 * direction * texelSize).rgb * 0.0540;
  result += texture2D(inputBuffer, vUv + -2.0 * direction * texelSize).rgb * 0.1218;
  result += texture2D(inputBuffer, vUv + -1.0 * direction * texelSize).rgb * 0.1944;
  result += texture2D(inputBuffer, vUv).rgb * 0.2270;
  result += texture2D(inputBuffer, vUv +  1.0 * direction * texelSize).rgb * 0.1944;
  result += texture2D(inputBuffer, vUv +  2.0 * direction * texelSize).rgb * 0.1218;
  result += texture2D(inputBuffer, vUv +  3.0 * direction * texelSize).rgb * 0.0540;
  result += texture2D(inputBuffer, vUv +  4.0 * direction * texelSize).rgb * 0.0162;

  gl_FragColor = vec4(result, 1.0);
}
`,ze=`
uniform sampler2D inputBuffer;
uniform sampler2D bloomBuffer;
uniform float bloomIntensity;
varying vec2 vUv;

void main() {
  vec3 base = texture2D(inputBuffer, vUv).rgb;
  vec3 bloom = texture2D(bloomBuffer, vUv).rgb * bloomIntensity;
  gl_FragColor = vec4(base + bloom, 1.0);
}
`,Ge=`
uniform sampler2D inputBuffer;
uniform sampler2D watercolorTexture;
uniform sampler2D tensorTexture;
uniform int quantizeLevels;
uniform float saturation;
uniform float paperStrength;
uniform bool outlineEnabled;
uniform float outlineStrength;
uniform float outlineThreshold;
uniform float outlineSoftness;
uniform bool hatchingEnabled;
uniform float hatchScale;
uniform float hatchIntensity;
uniform float hatchThickness;
uniform float hatchRotation;
varying vec2 vUv;

vec3 ACESFilm(vec3 x) {
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

vec3 sat(vec3 rgb, float adjustment) {
  vec3 W = vec3(0.2125, 0.7154, 0.0721);
  vec3 intensity = vec3(dot(rgb, W));
  return mix(intensity, rgb, adjustment);
}

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

// Single-sample edge from the precomputed structure tensor (Jxx + Jyy = total gradient energy).
// ~8x cheaper than a full Sobel pass; scale by 0.577 (1/sqrt(3)) so RGB energy is
// comparable in range to a luma-only Sobel, keeping existing threshold values usable.
float tensorEdge(vec2 uv) {
  vec4 t = texture2D(tensorTexture, uv);
  return sqrt((t.r + t.g) * 0.333);
}

// Hatching stripe using a precomputed unit direction to avoid per-call sin/cos.
float hatchStripe(vec2 fragCoord, vec2 dir, float spacing, float thickness) {
  float p = dot(fragCoord, dir) / max(1.0, spacing);
  float phase = abs(fract(p) - 0.5);
  float width = clamp(thickness, 0.1, 1.5) * 0.5;
  return 1.0 - smoothstep(width, width + 0.06, phase);
}

void main() {
  vec3 color = texture2D(inputBuffer, vUv).rgb;
  vec4 watercolorColor = texture2D(watercolorTexture, vUv);
  vec3 grayscale = vec3(luma(color));

  // Color quantization
  int n = quantizeLevels;
  float x = grayscale.r;
  float qn = floor(x * float(n - 1) + 0.5) / float(n - 1);
  qn = clamp(qn, 0.2, 0.7);

  // Two-point color interpolation
  if (qn < 0.5) {
    color = mix(vec3(0.1), color.rgb, qn * 2.0);
  } else {
    color = mix(color.rgb, vec3(1.0), (qn - 0.5) * 2.0);
  }

  color = sat(color, saturation);
  color = ACESFilm(color);

  if (hatchingEnabled) {
    float value = luma(color);
    vec2 frag = gl_FragCoord.xy;
    float s = hatchScale;
    float t = hatchThickness;

    // Precompute sin/cos once (2 trig ops) then derive all three directions.
    float cosR = cos(hatchRotation);
    float sinR = sin(hatchRotation);
    // dir at +45° + rotation, -45° + rotation, 0° + rotation
    vec2 dir1 = vec2(0.70711 * (cosR - sinR), 0.70711 * (cosR + sinR));
    vec2 dir2 = vec2(0.70711 * (cosR + sinR), 0.70711 * (sinR - cosR));
    vec2 dir3 = vec2(cosR, sinR);

    float h1 = hatchStripe(frag, dir1, s, t);
    float h2 = hatchStripe(frag, dir2, s * 1.05, t);
    float h3 = hatchStripe(frag, dir3, s * 0.85, t * 0.85);

    float hatchMask = 0.0;
    hatchMask += step(value, 0.75) * h1;
    hatchMask += step(value, 0.55) * h2;
    hatchMask += step(value, 0.35) * h3;
    hatchMask = clamp(hatchMask / 3.0, 0.0, 1.0);

    color *= 1.0 - (hatchMask * hatchIntensity);
  }

  if (outlineEnabled) {
    float edge = tensorEdge(vUv);
    float ink = smoothstep(
      outlineThreshold,
      outlineThreshold + max(0.001, outlineSoftness),
      edge
    );
    color = mix(color, vec3(0.03, 0.03, 0.04), ink * outlineStrength);
  }

  vec4 outputColor = vec4(color, 1.0);
  outputColor = mix(outputColor, outputColor * watercolorColor, paperStrength);

  gl_FragColor = outputColor;
}
`,He=`
#define SECTOR_COUNT 8

uniform int radius;
uniform float alpha;
uniform sampler2D inputBuffer;
// sourceSize = full-resolution (w, h) of the original scene texture.
// Used to convert pixel-space offsets to UVs regardless of render-target resolution.
uniform vec2 sourceSize;
uniform sampler2D originalTexture;

varying vec2 vUv;

vec4 fromLinear(vec4 linearRGB) {
  bvec3 cutoff = lessThan(linearRGB.rgb, vec3(0.0031308));
  vec3 higher = vec3(1.055) * pow(linearRGB.rgb, vec3(1.0 / 2.4)) - vec3(0.055);
  vec3 lower = linearRGB.rgb * vec3(12.92);
  return vec4(mix(higher, lower, cutoff), linearRGB.a);
}

// Offset is in source-pixel units; dividing by sourceSize converts to UV delta.
vec3 sampleColor(vec2 baseUv, vec2 offset) {
  return texture2D(originalTexture, baseUv + offset / sourceSize).rgb;
}

vec4 getDominantOrientation(vec4 tensor) {
  float Jxx = tensor.r;
  float Jyy = tensor.g;
  float Jxy = tensor.b;

  float trace = Jxx + Jyy;
  float det = Jxx * Jyy - Jxy * Jxy;

  float lambda1 = trace * 0.5 + sqrt(trace * trace * 0.25 - det);
  float lambda2 = trace * 0.5 - sqrt(trace * trace * 0.25 - det);

  float jxyStrength = abs(Jxy) / (abs(Jxx) + abs(Jyy) + abs(Jxy) + 1e-6);

  vec2 v;
  if (jxyStrength > 0.0) {
    v = normalize(vec2(-Jxy, Jxx - lambda1));
  } else {
    v = vec2(0.0, 1.0);
  }

  return vec4(normalize(v), lambda1, lambda2);
}

float polynomialWeight(float x, float y, float eta, float lambda) {
  float polyValue = (x + eta) - lambda * (y * y);
  return max(0.0, polyValue * polyValue);
}

void getSectorVarianceAndAverageColor(
  mat2 anisotropyMat, float angle, float rad, vec2 baseUv,
  out vec3 avgColor, out float variance
) {
  vec3 weightedColorSum = vec3(0.0);
  vec3 weightedSquaredColorSum = vec3(0.0);
  float totalWeight = 0.0;

  float eta = 0.1;
  float lambda = 0.5;

  // Hoist cos/sin and the anisotropy matrix multiply outside the radius loop.
  // Each angular offset has a fixed direction regardless of r, so computing it
  // once per angle reduces trig from (radius × angles) to just angles per sector.
  for (float a = -0.392699; a <= 0.392699; a += 0.196349) {
    vec2 baseDir = anisotropyMat * vec2(cos(angle + a), sin(angle + a));
    for (float r = 1.0; r <= rad; r += 1.0) {
      vec2 sampleOffset = r * baseDir;

      vec3 color = sampleColor(baseUv, sampleOffset);
      float weight = polynomialWeight(sampleOffset.x, sampleOffset.y, eta, lambda);

      weightedColorSum += color * weight;
      weightedSquaredColorSum += color * color * weight;
      totalWeight += weight;
    }
  }

  avgColor = weightedColorSum / totalWeight;
  vec3 varianceRes = (weightedSquaredColorSum / totalWeight) - (avgColor * avgColor);
  variance = dot(varianceRes, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec4 structureTensor = texture2D(inputBuffer, vUv);

  vec3 sectorAvgColors[SECTOR_COUNT];
  float sectorVariances[SECTOR_COUNT];

  vec4 oaResult = getDominantOrientation(structureTensor);
  vec2 orientation = oaResult.xy;

  float anisotropy = (oaResult.z - oaResult.w) / (oaResult.z + oaResult.w + 1e-6);

  float scaleX = alpha / (anisotropy + alpha);
  float scaleY = (anisotropy + alpha) / alpha;

  mat2 anisotropyMat = mat2(
    orientation.x, -orientation.y,
    orientation.y,  orientation.x
  ) * mat2(scaleX, 0.0, 0.0, scaleY);

  for (int i = 0; i < SECTOR_COUNT; i++) {
    float angle = float(i) * 6.28318 / float(SECTOR_COUNT);
    getSectorVarianceAndAverageColor(
      anisotropyMat, angle, float(radius), vUv,
      sectorAvgColors[i], sectorVariances[i]
    );
  }

  float minVariance = sectorVariances[0];
  vec3 finalColor = sectorAvgColors[0];

  for (int i = 1; i < SECTOR_COUNT; i++) {
    if (sectorVariances[i] < minVariance) {
      minVariance = sectorVariances[i];
      finalColor = sectorAvgColors[i];
    }
  }

  gl_FragColor = fromLinear(vec4(finalColor, 1.0));
}
`,Fe=`
varying vec2 vUv;
uniform sampler2D inputBuffer;
uniform vec4 resolution;

const mat3 Gx = mat3(-1, -2, -1, 0, 0, 0, 1, 2, 1);
const mat3 Gy = mat3(-1, 0, 1, -2, 0, 2, -1, 0, 1);

vec4 computeStructureTensor(sampler2D tex, vec2 uv) {
  vec3 tx0y0 = texture2D(tex, uv + vec2(-1, -1) / resolution.xy).rgb;
  vec3 tx0y1 = texture2D(tex, uv + vec2(-1,  0) / resolution.xy).rgb;
  vec3 tx0y2 = texture2D(tex, uv + vec2(-1,  1) / resolution.xy).rgb;
  vec3 tx1y0 = texture2D(tex, uv + vec2( 0, -1) / resolution.xy).rgb;
  vec3 tx1y1 = texture2D(tex, uv + vec2( 0,  0) / resolution.xy).rgb;
  vec3 tx1y2 = texture2D(tex, uv + vec2( 0,  1) / resolution.xy).rgb;
  vec3 tx2y0 = texture2D(tex, uv + vec2( 1, -1) / resolution.xy).rgb;
  vec3 tx2y1 = texture2D(tex, uv + vec2( 1,  0) / resolution.xy).rgb;
  vec3 tx2y2 = texture2D(tex, uv + vec2( 1,  1) / resolution.xy).rgb;

  vec3 Sx = Gx[0][0] * tx0y0 + Gx[1][0] * tx1y0 + Gx[2][0] * tx2y0 +
            Gx[0][1] * tx0y1 + Gx[1][1] * tx1y1 + Gx[2][1] * tx2y1 +
            Gx[0][2] * tx0y2 + Gx[1][2] * tx1y2 + Gx[2][2] * tx2y2;

  vec3 Sy = Gy[0][0] * tx0y0 + Gy[1][0] * tx1y0 + Gy[2][0] * tx2y0 +
            Gy[0][1] * tx0y1 + Gy[1][1] * tx1y1 + Gy[2][1] * tx2y1 +
            Gy[0][2] * tx0y2 + Gy[1][2] * tx1y2 + Gy[2][2] * tx2y2;

  return vec4(dot(Sx, Sx), dot(Sy, Sy), dot(Sx, Sy), 1.0);
}

void main() {
  gl_FragColor = computeStructureTensor(inputBuffer, vUv);
}
`,We=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;function j(e,i,n){const s=new be({uniforms:n,vertexShader:We,fragmentShader:i,depthTest:!1,depthWrite:!1}),o=new Se(e,s);o.frustumCulled=!1;const u=new ye;return u.add(o),{scene:u,material:s}}pe.preload(me("watercolor.png"));const Ne=1;function qe({radius:e=6,alpha:i=25,qualityScale:n=.5,quantizeLevels:s=16,saturation:o=1.5,paperStrength:u=1,bloomEnabled:c=!0,bloomIntensity:d=1.2,outlineEnabled:C=!0,outlineStrength:v=.75,outlineThreshold:g=.22,outlineSoftness:f=.14,hatchingEnabled:h=!0,hatchScale:y=6,hatchIntensity:M=.25,hatchThickness:D=.9,hatchRotation:b=.35}){const{size:O}=Ce(),V=l.useRef(new Y),U=l.useRef(new Y),T=pe(me("watercolor.png"));T.minFilter=Te,T.magFilter=we,T.generateMipmaps=!0;const N=A({depthBuffer:!0}),S=l.useMemo(()=>new ie(1,1,{depthBuffer:!1,type:Re}),[]),B=l.useMemo(()=>new ie(1,1,{depthBuffer:!1}),[]);l.useEffect(()=>()=>{S.dispose(),B.dispose()},[S,B]);const ee=A({depthBuffer:!0}),te=A({depthBuffer:!1}),ae=A({depthBuffer:!1}),re=A({depthBuffer:!1}),w=l.useMemo(()=>new je(-1,1,1,-1,0,1),[]),x=l.useMemo(()=>new ke(2,2),[]),q=l.useMemo(()=>j(x,Fe,{inputBuffer:{value:null},resolution:{value:new Y}}),[x]),R=l.useMemo(()=>j(x,He,{inputBuffer:{value:null},originalTexture:{value:null},sourceSize:{value:new L},radius:{value:e},alpha:{value:i}}),[x]),m=l.useMemo(()=>j(x,Ge,{inputBuffer:{value:null},watercolorTexture:{value:null},tensorTexture:{value:null},quantizeLevels:{value:s},saturation:{value:o},paperStrength:{value:u},outlineEnabled:{value:C},outlineStrength:{value:v},outlineThreshold:{value:g},outlineSoftness:{value:f},hatchingEnabled:{value:h},hatchScale:{value:y},hatchIntensity:{value:M},hatchThickness:{value:D},hatchRotation:{value:b}}),[x]),J=l.useMemo(()=>j(x,ue,{inputBuffer:{value:null},direction:{value:new L(1,0)},resolution:{value:new L}}),[x]),Q=l.useMemo(()=>j(x,ue,{inputBuffer:{value:null},direction:{value:new L(0,1)},resolution:{value:new L}}),[x]),z=l.useMemo(()=>j(x,ze,{inputBuffer:{value:null},bloomBuffer:{value:null},bloomIntensity:{value:d}}),[x]);return $(fe=>{const{gl:r,scene:P,camera:G}=fe,oe=r.getPixelRatio(),H=O.width*oe,F=O.height*oe;V.current.set(H,F,1/H,1/F);const _=Math.max(1,Math.round(H*n)),I=Math.max(1,Math.round(F*n));(S.width!==_||S.height!==I)&&(S.setSize(_,I),B.setSize(_,I)),U.current.set(_,I,1/_,1/I);const de=r.autoClear;r.autoClear=!1,r.setRenderTarget(N),r.clear(),r.render(P,G);const le=c?(()=>{const W=V.current,ve=P.background;return P.background=null,G.layers.set(Ne),r.setRenderTarget(ee),r.setClearColor(0,1),r.clear(),r.render(P,G),G.layers.set(0),P.background=ve,J.material.uniforms.inputBuffer.value=ee.texture,J.material.uniforms.resolution.value.set(W.x,W.y),r.setRenderTarget(te),r.clear(),r.render(J.scene,w),Q.material.uniforms.inputBuffer.value=te.texture,Q.material.uniforms.resolution.value.set(W.x,W.y),r.setRenderTarget(ae),r.clear(),r.render(Q.scene,w),z.material.uniforms.inputBuffer.value=N.texture,z.material.uniforms.bloomBuffer.value=ae.texture,z.material.uniforms.bloomIntensity.value=d,r.setRenderTarget(re),r.clear(),r.render(z.scene,w),re.texture})():N.texture;q.material.uniforms.inputBuffer.value=le,q.material.uniforms.resolution.value=U.current,r.setRenderTarget(S),r.clear(),r.render(q.scene,w),R.material.uniforms.inputBuffer.value=S.texture,R.material.uniforms.originalTexture.value=le,R.material.uniforms.sourceSize.value.set(H,F),R.material.uniforms.radius.value=e,R.material.uniforms.alpha.value=i,r.setRenderTarget(B),r.clear(),r.render(R.scene,w),m.material.uniforms.inputBuffer.value=B.texture,m.material.uniforms.watercolorTexture.value=T,m.material.uniforms.tensorTexture.value=S.texture,m.material.uniforms.quantizeLevels.value=s,m.material.uniforms.saturation.value=o,m.material.uniforms.paperStrength.value=u,m.material.uniforms.outlineEnabled.value=C,m.material.uniforms.outlineStrength.value=v,m.material.uniforms.outlineThreshold.value=g,m.material.uniforms.outlineSoftness.value=f,m.material.uniforms.hatchingEnabled.value=h,m.material.uniforms.hatchScale.value=y,m.material.uniforms.hatchIntensity.value=M,m.material.uniforms.hatchThickness.value=D,m.material.uniforms.hatchRotation.value=b,r.setRenderTarget(null),r.clear(),r.render(m.scene,w),r.autoClear=de},1),null}function Je(e){const{nodes:i,materials:n}=E(k("/lifePreserver.glb"));return a.jsx("group",{...e,dispose:null,children:a.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:i.Object_4.geometry,material:n["Material.001"],scale:[1,.698,1]})})}E.preload(k("/lifePreserver.glb"));const X=.1,K=.15,ce=3;function Qe({waveHeight:e,waveChoppiness:i,waveSpeed:n}){const s=l.useRef();return $(o=>{if(!s.current)return;const u=o.clock.elapsedTime,c=_e(X,K,e,i,n);s.current.position.y=ce+c;const d=Ie(X,K,e,i,n);s.current.rotation.x=Math.asin(-d.z),s.current.rotation.z=Math.asin(d.x),s.current.rotation.y=u*.2}),a.jsx("group",{ref:s,position:[X,ce,K],scale:.22,children:a.jsx(Je,{})})}function Z({Shark:e,points:i,speed:n,scale:s,headingOffset:o=0,clockwise:u=!0,visible:c=!0,showSpline:d=!1,sharkProps:C={}}){const v=l.useRef(),g=l.useMemo(()=>i?.length?i.map(h=>h.clone().multiplyScalar(.01)):[],[i]),f=l.useMemo(()=>g.length?new Ee(g,!0,"centripetal",.5):null,[g]);return $(h=>{if(!v.current||!f)return;const y=h.clock.elapsedTime*n%1,M=u?(1-y+1)%1:y,D=(M+.01)%1,b=f.getPointAt(M),O=f.getPointAt(D),V=O.x-b.x,U=O.z-b.z,T=Math.atan2(V,U);v.current.position.set(b.x,b.y+Math.sin(h.clock.elapsedTime*1.7)*.05,b.z),v.current.rotation.y=T+o,v.current.rotation.z=Math.sin(h.clock.elapsedTime*2)*.08}),a.jsxs(a.Fragment,{children:[c&&a.jsx("group",{ref:v,scale:s,children:a.jsx(e,{...C})}),d&&g.length>=2&&a.jsx(Ae,{points:g,tension:.5,closed:!0,curveType:"catmullrom",color:"#ff6600",visible:!0,arcSegments:64})]})}const t={cameraMode:"Fixed",backgroundColor:"#ffffff",ambientIntensity:.85,ambientColor:"#f7fbff",mainLightIntensity:1.15,mainLightColor:"#fff8ea",fillLightIntensity:.35,fillLightColor:"#d9f2ff",columnWidth:3.6,columnDepth:3.6,columnHeight:6,segments:24,topColor:"#9edff0",bottomColor:"#246f98",opacity:1,transmission:.31,roughness:0,ior:2,thickness:.24,waveHeight:.15,waveChoppiness:.5,waveSpeed:.6,edgeColor:"#333333",edgeOpacity:1,edgeLineWidth:3.5,showEdges:!0,hammerheadVisible:!0,hammerheadScale:.38,hammerheadSpeed:.1,hammerheadSplineVisible:!1,tiger1Visible:!0,tiger1Scale:.003,tiger1Speed:.075,tiger1SplineVisible:!1,tiger2Visible:!0,tiger2Scale:.003,tiger2Speed:.06,tiger2SplineVisible:!1,painterlyEnabled:!0,painterlyRadius:2,painterlyAlpha:25,painterlyQuantize:16,painterlySaturation:1.5,painterlyPaper:1,outlineEnabled:!0,outlineStrength:.75,outlineThreshold:.22,outlineSoftness:.14,hatchingEnabled:!0,hatchScale:6,hatchIntensity:.25,hatchThickness:.9,hatchRotation:.35,bloomEnabled:!0,bloomIntensity:1.2};function Ye(){const e=l.useRef({...t}),[i,n]=Me("Staying Afloat",()=>({Presets:p({reset:ne(()=>n({...t})),...Oe()?{copy:ne(()=>{const o=JSON.stringify(e.current,null,2).replace(/"([A-Za-z_$][A-Za-z0-9_$]*)":/g,"$1:");navigator.clipboard.writeText(o)})}:{}},{collapsed:!0}),Scene:p({cameraMode:{label:"Camera",value:t.cameraMode,options:["Fixed","Orbit"]},backgroundColor:{label:"Background",value:t.backgroundColor},Lighting:p({ambientIntensity:{label:"Ambient",value:t.ambientIntensity,min:0,max:2,step:.05},ambientColor:{label:"Ambient Color",value:t.ambientColor},mainLightIntensity:{label:"Main Light",value:t.mainLightIntensity,min:0,max:3,step:.05},mainLightColor:{label:"Main Color",value:t.mainLightColor},fillLightIntensity:{label:"Fill Light",value:t.fillLightIntensity,min:0,max:2,step:.05},fillLightColor:{label:"Fill Color",value:t.fillLightColor}},{collapsed:!0})},{collapsed:!0}),Water:p({columnWidth:{label:"Width",value:t.columnWidth,min:.5,max:10,step:.1},columnDepth:{label:"Depth",value:t.columnDepth,min:.5,max:10,step:.1},columnHeight:{label:"Height",value:t.columnHeight,min:.5,max:12,step:.1},segments:{value:t.segments,min:4,max:64,step:1},topColor:{label:"Top Color",value:t.topColor},bottomColor:{label:"Bottom Color",value:t.bottomColor},opacity:{value:t.opacity,min:0,max:1,step:.01},transmission:{value:t.transmission,min:0,max:1,step:.01},roughness:{value:t.roughness,min:0,max:1,step:.01},ior:{label:"IOR",value:t.ior,min:1,max:2.5,step:.01},thickness:{value:t.thickness,min:0,max:2,step:.01},waveHeight:{label:"Wave Height",value:t.waveHeight,min:0,max:1,step:.01},waveChoppiness:{label:"Choppiness",value:t.waveChoppiness,min:0,max:2,step:.01},waveSpeed:{label:"Wave Speed",value:t.waveSpeed,min:0,max:2,step:.01},Edges:p({showEdges:{label:"Show Edges",value:t.showEdges},edgeColor:{label:"Edge Color",value:t.edgeColor},edgeOpacity:{label:"Edge Opacity",value:t.edgeOpacity,min:0,max:1,step:.01},edgeLineWidth:{label:"Line Width",value:t.edgeLineWidth,min:.1,max:5,step:.1}},{collapsed:!0})},{collapsed:!0}),Sharks:p({HammerHead:p({hammerheadVisible:{label:"Visible",value:t.hammerheadVisible},hammerheadScale:{label:"Scale",value:t.hammerheadScale,min:.01,max:2,step:.01},hammerheadSpeed:{label:"Speed",value:t.hammerheadSpeed,min:0,max:.5,step:.005},"HammerHead Path":p({hammerheadSplineVisible:{label:"Show Spline",value:t.hammerheadSplineVisible}},{collapsed:!0})},{collapsed:!0}),"Tiger Shark 1":p({tiger1Visible:{label:"Visible",value:t.tiger1Visible},tiger1Scale:{label:"Scale",value:t.tiger1Scale,min:.001,max:.01,step:5e-4},tiger1Speed:{label:"Speed",value:t.tiger1Speed,min:0,max:.5,step:.005},"Tiger 1 Path":p({tiger1SplineVisible:{label:"Show Spline",value:t.tiger1SplineVisible}},{collapsed:!0})},{collapsed:!0}),"Tiger Shark 2":p({tiger2Visible:{label:"Visible",value:t.tiger2Visible},tiger2Scale:{label:"Scale",value:t.tiger2Scale,min:.001,max:.01,step:5e-4},tiger2Speed:{label:"Speed",value:t.tiger2Speed,min:0,max:.5,step:.005},"Tiger 2 Path":p({tiger2SplineVisible:{label:"Show Spline",value:t.tiger2SplineVisible}},{collapsed:!0})},{collapsed:!0})},{collapsed:!0}),"Post Processing":p({painterlyEnabled:{label:"Painterly",value:t.painterlyEnabled},painterlyRadius:{label:"Painterly Radius",value:t.painterlyRadius,min:1,max:10,step:1},painterlyAlpha:{label:"Stroke Direction",value:t.painterlyAlpha,min:1,max:100,step:1},painterlyQuantize:{label:"Quantize Levels",value:t.painterlyQuantize,min:2,max:32,step:1},painterlySaturation:{label:"Saturation",value:t.painterlySaturation,min:0,max:3,step:.05},painterlyPaper:{label:"Paper Strength",value:t.painterlyPaper,min:0,max:1,step:.05},"Ink + Hatch":p({outlineEnabled:{label:"Outline",value:t.outlineEnabled},outlineStrength:{label:"Outline Strength",value:t.outlineStrength,min:0,max:2,step:.01},outlineThreshold:{label:"Outline Threshold",value:t.outlineThreshold,min:0,max:1,step:.01},outlineSoftness:{label:"Outline Softness",value:t.outlineSoftness,min:.001,max:1,step:.005},hatchingEnabled:{label:"Hatching",value:t.hatchingEnabled},hatchScale:{label:"Hatch Scale",value:t.hatchScale,min:1,max:24,step:.1},hatchIntensity:{label:"Hatch Intensity",value:t.hatchIntensity,min:0,max:1,step:.01},hatchThickness:{label:"Hatch Thickness",value:t.hatchThickness,min:.1,max:2,step:.01},hatchRotation:{label:"Hatch Rotation",value:t.hatchRotation,min:-3.14159,max:3.14159,step:.01}},{collapsed:!0}),bloomEnabled:{label:"Bloom",value:t.bloomEnabled},bloomIntensity:{label:"Bloom Intensity",value:t.bloomIntensity,min:0,max:6,step:.01}},{collapsed:!0})}),{collapsed:!0});return e.current={...i},i}function ct(){const e=Ye(),{hammerheadPath:i,tigerSharkPath:n,tigerSharkPath2:s}=l.useMemo(()=>{const u=Be["Staying Afloat"]?.splines??[];return{hammerheadPath:u.find(c=>c.name==="Hammerhead Path"),tigerSharkPath:u.find(c=>c.name==="Tiger Shark Path"),tigerSharkPath2:u.find(c=>c.name==="Tiger Shark Path 2")}},[]);return a.jsxs(a.Fragment,{children:[a.jsx("color",{attach:"background",args:[e.backgroundColor]}),a.jsx(De,{makeDefault:!0,position:[8.4,7.4,8.2],fov:30,near:.1,far:100,onUpdate:o=>o.lookAt(0,.4,0)}),e.cameraMode==="Orbit"&&a.jsx(Ve,{target:[0,.4,0]}),a.jsx("ambientLight",{intensity:e.ambientIntensity,color:e.ambientColor}),a.jsx("directionalLight",{position:[4,10,5],intensity:e.mainLightIntensity,color:e.mainLightColor,castShadow:!0,"shadow-bias":-5e-4,"shadow-normalBias":.04}),a.jsx("directionalLight",{position:[-5,2,-6],intensity:e.fillLightIntensity,color:e.fillLightColor}),a.jsx(Le,{width:e.columnWidth,depth:e.columnDepth,height:e.columnHeight,segments:e.segments,topColor:e.topColor,bottomColor:e.bottomColor,opacity:e.opacity,transmission:e.transmission,roughness:e.roughness,ior:e.ior,thickness:e.thickness,waveHeight:e.waveHeight,waveChoppiness:e.waveChoppiness,waveSpeed:e.waveSpeed,edgeColor:e.edgeColor,edgeOpacity:e.edgeOpacity,edgeLineWidth:e.edgeLineWidth,showEdges:e.showEdges}),a.jsx(Qe,{waveHeight:e.waveHeight,waveChoppiness:e.waveChoppiness,waveSpeed:e.waveSpeed}),a.jsx(Z,{Shark:Ue,points:i?.points?.map(o=>o.position)??[],speed:e.hammerheadSpeed,scale:e.hammerheadScale,headingOffset:Math.PI,visible:e.hammerheadVisible,showSpline:e.hammerheadSplineVisible}),a.jsx(Z,{Shark:se,points:n?.points?.map(o=>o.position)??[],speed:e.tiger1Speed,scale:e.tiger1Scale,headingOffset:Math.PI,visible:e.tiger1Visible,showSpline:e.tiger1SplineVisible,sharkProps:{excludeAnimations:["attack"]}}),a.jsx(Z,{Shark:se,points:s?.points?.map(o=>o.position)??[],speed:e.tiger2Speed,scale:e.tiger2Scale,headingOffset:0,clockwise:!1,visible:e.tiger2Visible,showSpline:e.tiger2SplineVisible,sharkProps:{excludeAnimations:["attack"]}}),e.painterlyEnabled&&a.jsx(qe,{radius:e.painterlyRadius,alpha:e.painterlyAlpha,quantizeLevels:e.painterlyQuantize,saturation:e.painterlySaturation,paperStrength:e.painterlyPaper,outlineEnabled:e.outlineEnabled,outlineStrength:e.outlineStrength,outlineThreshold:e.outlineThreshold,outlineSoftness:e.outlineSoftness,hatchingEnabled:e.hatchingEnabled,hatchScale:e.hatchScale,hatchIntensity:e.hatchIntensity,hatchThickness:e.hatchThickness,hatchRotation:e.hatchRotation,bloomEnabled:e.bloomEnabled,bloomIntensity:e.bloomIntensity})]})}export{ct as default};
