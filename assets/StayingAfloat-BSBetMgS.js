import{r,az as D,j as a,aQ as xe,aR as ye,ac as Se,av as Ce,bh as Re,m as we,al as ae,bA as pe,bO as Te,K as je,W as le,H as Me,ai as ke,b5 as Ee,x as H,n as oe,V as C,B as Oe,aj as Be,p as Pe,a0 as _e,aX as f,bj as Le,a1 as se}from"./index-DUAUQe-S.js";import{S as Ie}from"./stayingAfloatSplines-B_t3b35W.js";import{u as V}from"./Gltf-Dh4t7ofw.js";import{u as de}from"./useAnimations-BMqHHZ6j.js";import{c as De}from"./SkeletonUtils-BCVmgslc.js";import{s as Ve,a as Ae,u as ze,b as Ue}from"./NurbsWaterColumn-CEH8YuP8.js";import{u as fe}from"./Texture-BWKRBnPn.js";import{u as F}from"./Fbo-pjM8nz7X.js";import{L as Ge}from"./Line-Sz3OWMbZ.js";import{P as He}from"./PerspectiveCamera-BeYUrw0H.js";import{O as Fe}from"./OrbitControls-B45q6IBS.js";import"./constants-BP0pTuTZ.js";import"./Line2-fhzQTwkB.js";import"./three.tsl-kCgjn367.js";import"./extends-CF3RwP-h.js";function We(e){const l=r.useRef(),{nodes:s,materials:c,animations:m}=V(D("/hammerHead.glb")),{actions:n}=de(m,l);return r.useEffect(()=>(Object.values(n??{}).forEach(u=>{u.reset(),u.fadeIn(.35),u.play()}),()=>{Object.values(n??{}).forEach(u=>{u.fadeOut(.2),u.stop()})}),[n]),a.jsx("group",{ref:l,...e,dispose:null,children:a.jsx("group",{name:"Sketchfab_Scene",children:a.jsx("group",{name:"Sketchfab_model",rotation:[-Math.PI/2,0,0],children:a.jsx("group",{name:"bac65c2aa79a4a3a9500cef32dd8cf74fbx",rotation:[Math.PI/2,0,0],scale:.01,children:a.jsx("group",{name:"Object_2",children:a.jsxs("group",{name:"RootNode",children:[a.jsx("group",{name:"Cube",position:[0,.712,9.972],rotation:[-Math.PI/2,0,0],scale:24.02}),a.jsx("group",{name:"Armature",position:[-.434,1.731,100.544],rotation:[-Math.PI,0,0],scale:100,children:a.jsxs("group",{name:"Object_6",children:[a.jsx("primitive",{object:s._rootJoint}),a.jsx("skinnedMesh",{name:"Object_9",geometry:s.Object_9.geometry,material:c.Material,skeleton:s.Object_9.skeleton}),a.jsx("group",{name:"Object_8",position:[0,.712,9.972],rotation:[-Math.PI/2,0,0],scale:24.02})]})})]})})})})})})}V.preload(D("/hammerHead.glb"));function ue({excludeAnimations:e=[],...l}){const s=r.useRef(),{scene:c,materials:m,animations:n}=V(D("/tigerShark.glb")),u=r.useMemo(()=>De(c),[c]),{nodes:d}=xe(u),g=r.useMemo(()=>n.map(w=>w.clone()),[n]),{actions:v}=de(g,s);return r.useEffect(()=>{const w=e.map(h=>h.toLowerCase());return Object.entries(v??{}).forEach(([h,x])=>{w.some(R=>h.toLowerCase().includes(R))||(x.reset(),x.setLoop(ye,1/0),Object.assign(x,{clampWhenFinished:!1}),x.fadeIn(.35),x.play())}),()=>{Object.values(v??{}).forEach(h=>{h.fadeOut(.2),h.stop()})}},[v,e]),a.jsx("group",{ref:s,...l,dispose:null,children:a.jsx("group",{name:"Sketchfab_Scene",children:a.jsx("group",{name:"Sketchfab_model",rotation:[-Math.PI/2,0,0],children:a.jsx("group",{name:"Tiger_Shark_2fbx",rotation:[Math.PI/2,0,0],children:a.jsx("group",{name:"Object_2",children:a.jsxs("group",{name:"RootNode",children:[a.jsx("group",{name:"Hemi",position:[0,-124.661,0],rotation:[0,0,Math.PI],scale:100,children:a.jsx("group",{name:"Object_5",rotation:[Math.PI/2,0,0],children:a.jsx("group",{name:"Object_6"})})}),a.jsx("group",{name:"Sun",position:[209.518,114.514,0],rotation:[0,-.58,-.95],scale:100,children:a.jsx("group",{name:"Object_8",rotation:[Math.PI/2,0,0],children:a.jsx("group",{name:"Object_9"})})}),a.jsx("group",{name:"Armature",rotation:[-Math.PI/2,0,0],scale:100,children:a.jsxs("group",{name:"Object_11",children:[a.jsx("primitive",{object:d._rootJoint}),a.jsx("skinnedMesh",{name:"Object_83",geometry:d.Object_83.geometry,material:m.Tiger_shark,skeleton:d.Object_83.skeleton}),a.jsx("group",{name:"Object_82",rotation:[-Math.PI/2,0,0],scale:100})]})}),a.jsx("group",{name:"TIGER_SHARK_lowpoly",rotation:[-Math.PI/2,0,0],scale:100}),a.jsx("group",{name:"Cube",rotation:[-Math.PI/2,0,0],scale:100,children:a.jsx("mesh",{name:"Cube__0",castShadow:!0,receiveShadow:!0,geometry:d.Cube__0.geometry,material:m.Cube__0})}),a.jsx("group",{name:"Empty_SPHERE",rotation:[-Math.PI/2,0,0],scale:100})]})})})})})})}V.preload(D("/tigerShark.glb"));const ce=`
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
`,Ne=`
uniform sampler2D inputBuffer;
uniform sampler2D bloomBuffer;
uniform float bloomIntensity;
varying vec2 vUv;

void main() {
  vec3 base = texture2D(inputBuffer, vUv).rgb;
  vec3 bloom = texture2D(bloomBuffer, vUv).rgb * bloomIntensity;
  gl_FragColor = vec4(base + bloom, 1.0);
}
`,Je=`
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
`,qe=`
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
`,Qe=`
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
`,Xe=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;function I(e,l,s){const c=new Se({uniforms:s,vertexShader:Xe,fragmentShader:l,depthTest:!1,depthWrite:!1}),m=new Ce(e,c);m.frustumCulled=!1;const n=new Re;return n.add(m),{scene:n,material:c}}fe.preload(pe("watercolor.png"));const Ye=1;function Ke({radius:e=6,alpha:l=25,qualityScale:s=.5,quantizeLevels:c=16,saturation:m=1.5,paperStrength:n=1,bloomEnabled:u=!0,bloomIntensity:d=1.2,outlineEnabled:g=!0,outlineStrength:v=.75,outlineThreshold:w=.22,outlineSoftness:h=.14,hatchingEnabled:x=!0,hatchScale:R=6,hatchIntensity:O=.25,hatchThickness:M=.9,hatchRotation:k=.35}){const{size:o}=we(),B=r.useRef(new ae),S=r.useRef(new ae),E=fe(pe("watercolor.png"));E.minFilter=Te,E.magFilter=je,E.generateMipmaps=!0;const P=F({depthBuffer:!0}),b=r.useMemo(()=>new le(1,1,{depthBuffer:!1,type:Me}),[]),T=r.useMemo(()=>new le(1,1,{depthBuffer:!1}),[]);r.useEffect(()=>()=>{b.dispose(),T.dispose()},[b,T]);const _=F({depthBuffer:!0}),J=F({depthBuffer:!1}),q=F({depthBuffer:!1}),A=F({depthBuffer:!1}),j=r.useMemo(()=>new ke(-1,1,1,-1,0,1),[]),y=r.useMemo(()=>new Ee(2,2),[]),$=r.useMemo(()=>I(y,Qe,{inputBuffer:{value:null},resolution:{value:new ae}}),[y]),L=r.useMemo(()=>I(y,qe,{inputBuffer:{value:null},originalTexture:{value:null},sourceSize:{value:new H},radius:{value:e},alpha:{value:l}}),[y]),p=r.useMemo(()=>I(y,Je,{inputBuffer:{value:null},watercolorTexture:{value:null},tensorTexture:{value:null},quantizeLevels:{value:c},saturation:{value:m},paperStrength:{value:n},outlineEnabled:{value:g},outlineStrength:{value:v},outlineThreshold:{value:w},outlineSoftness:{value:h},hatchingEnabled:{value:x},hatchScale:{value:R},hatchIntensity:{value:O},hatchThickness:{value:M},hatchRotation:{value:k}}),[y]),ee=r.useMemo(()=>I(y,ce,{inputBuffer:{value:null},direction:{value:new H(1,0)},resolution:{value:new H}}),[y]),te=r.useMemo(()=>I(y,ce,{inputBuffer:{value:null},direction:{value:new H(0,1)},resolution:{value:new H}}),[y]),Q=r.useMemo(()=>I(y,Ne,{inputBuffer:{value:null},bloomBuffer:{value:null},bloomIntensity:{value:d}}),[y]);return oe(ge=>{const{gl:i,scene:z,camera:X}=ge,ne=i.getPixelRatio(),Y=o.width*ne,K=o.height*ne;B.current.set(Y,K,1/Y,1/K);const U=Math.max(1,Math.round(Y*s)),G=Math.max(1,Math.round(K*s));(b.width!==U||b.height!==G)&&(b.setSize(U,G),T.setSize(U,G)),S.current.set(U,G,1/U,1/G);const ve=i.autoClear;i.autoClear=!1,i.setRenderTarget(P),i.clear(),i.render(z,X);const ie=u?(()=>{const Z=B.current,be=z.background;return z.background=null,X.layers.set(Ye),i.setRenderTarget(_),i.setClearColor(0,1),i.clear(),i.render(z,X),X.layers.set(0),z.background=be,ee.material.uniforms.inputBuffer.value=_.texture,ee.material.uniforms.resolution.value.set(Z.x,Z.y),i.setRenderTarget(J),i.clear(),i.render(ee.scene,j),te.material.uniforms.inputBuffer.value=J.texture,te.material.uniforms.resolution.value.set(Z.x,Z.y),i.setRenderTarget(q),i.clear(),i.render(te.scene,j),Q.material.uniforms.inputBuffer.value=P.texture,Q.material.uniforms.bloomBuffer.value=q.texture,Q.material.uniforms.bloomIntensity.value=d,i.setRenderTarget(A),i.clear(),i.render(Q.scene,j),A.texture})():P.texture;$.material.uniforms.inputBuffer.value=ie,$.material.uniforms.resolution.value=S.current,i.setRenderTarget(b),i.clear(),i.render($.scene,j),L.material.uniforms.inputBuffer.value=b.texture,L.material.uniforms.originalTexture.value=ie,L.material.uniforms.sourceSize.value.set(Y,K),L.material.uniforms.radius.value=e,L.material.uniforms.alpha.value=l,i.setRenderTarget(T),i.clear(),i.render(L.scene,j),p.material.uniforms.inputBuffer.value=T.texture,p.material.uniforms.watercolorTexture.value=E,p.material.uniforms.tensorTexture.value=b.texture,p.material.uniforms.quantizeLevels.value=c,p.material.uniforms.saturation.value=m,p.material.uniforms.paperStrength.value=n,p.material.uniforms.outlineEnabled.value=g,p.material.uniforms.outlineStrength.value=v,p.material.uniforms.outlineThreshold.value=w,p.material.uniforms.outlineSoftness.value=h,p.material.uniforms.hatchingEnabled.value=x,p.material.uniforms.hatchScale.value=R,p.material.uniforms.hatchIntensity.value=O,p.material.uniforms.hatchThickness.value=M,p.material.uniforms.hatchRotation.value=k,i.setRenderTarget(null),i.clear(),i.render(p.scene,j),i.autoClear=ve},1),null}function Ze(e){const{nodes:l,materials:s}=V(D("/lifePreserver.glb"));return a.jsx("group",{...e,dispose:null,children:a.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:l.Object_4.geometry,material:s["Material.001"],scale:[1,.698,1]})})}V.preload(D("/lifePreserver.glb"));const W=.1,N=.15;function $e({interactionRuntime:e,waterTop:l,waveHeight:s,waveChoppiness:c,waveSpeed:m}){const n=r.useRef();return oe(u=>{if(!n.current)return;const d=u.clock.elapsedTime,g=e?e.sampleHeight(W,N,s,c,m):Ve(W,N,s,c,m);if(n.current.position.y=l+g,e){const v=e.sampleNormal(W,N,s,c,m);n.current.rotation.x=Math.asin(-v.z),n.current.rotation.z=Math.asin(v.x)}else{const v=Ae(W,N,s,c,m);n.current.rotation.x=Math.asin(-v.z),n.current.rotation.z=Math.asin(v.x)}n.current.rotation.y=d*.2}),a.jsx("group",{ref:n,position:[W,l,N],scale:.22,children:a.jsx(Ze,{})})}const me=.01,et=.12;function he(e){return(e%1+1)%1}function re({Shark:e,points:l,speed:s,scale:c,headingOffset:m=0,clockwise:n=!0,visible:u=!0,showSpline:d=!1,bodySpanScale:g=.85,bodyCenterBlend:v=1,sharkProps:w={}}){const h=r.useRef(),x=r.useRef(),R=r.useRef(),O=r.useRef(!1),M=r.useRef(0),k=r.useRef(new C),o=r.useMemo(()=>({box:new Oe,worldCenter:new C,localCenter:new C,size:new C,front:new C,back:new C,curveCenter:new C,chordCenter:new C,bodyCenter:new C,axis:new C}),[]),B=r.useMemo(()=>l?.length?l.map(b=>b.clone().multiplyScalar(.01)):[],[l]),S=r.useMemo(()=>B.length?new Be(B,!0,"centripetal",.5):null,[B]),E=r.useMemo(()=>S?.getLength()??0,[S]),P=r.useMemo(()=>S?.getPoints(128)??[],[S]);return r.useEffect(()=>{O.current=!1,M.current=0,k.current.set(0,0,0)},[e,c]),oe(b=>{if(!h.current||!x.current||!R.current||!S)return;O.current?x.current.position.copy(k.current):(R.current.updateWorldMatrix(!0,!0),o.box.setFromObject(R.current),o.box.isEmpty()||(o.box.getCenter(o.worldCenter),o.localCenter.copy(o.worldCenter),h.current.worldToLocal(o.localCenter),k.current.set(-o.localCenter.x,0,-o.localCenter.z),x.current.position.copy(k.current),o.box.getSize(o.size),M.current=Math.max(o.size.x,o.size.y,o.size.z),O.current=M.current>0));const T=b.clock.elapsedTime*s%1,_=n?(1-T+1)%1:T,J=E*me*2,q=M.current||J,A=Pe.clamp(q*g/(E*2),me,et);S.getPointAt(he(_+A),o.front),S.getPointAt(he(_-A),o.back),S.getPointAt(_,o.curveCenter),o.chordCenter.copy(o.front).add(o.back).multiplyScalar(.5),o.bodyCenter.lerpVectors(o.curveCenter,o.chordCenter,v),o.axis.copy(o.front).sub(o.back);const j=Math.atan2(o.axis.x,o.axis.z);h.current.position.set(o.bodyCenter.x,o.curveCenter.y+Math.sin(b.clock.elapsedTime*1.7)*.05,o.bodyCenter.z),h.current.rotation.y=j+m,h.current.rotation.z=Math.sin(b.clock.elapsedTime*2)*.08}),a.jsxs(a.Fragment,{children:[u&&a.jsx("group",{ref:h,children:a.jsx("group",{ref:x,children:a.jsx("group",{ref:R,scale:c,children:a.jsx(e,{...w})})})}),P.length>=2&&a.jsx(Ge,{points:P,color:"#ff6600",lineWidth:3,visible:d,toneMapped:!1})]})}const t={cameraMode:"Fixed",backgroundColor:"#ffffff",ambientIntensity:.85,ambientColor:"#f7fbff",mainLightIntensity:1.15,mainLightColor:"#fff8ea",fillLightIntensity:.35,fillLightColor:"#d9f2ff",columnWidth:3.6,columnDepth:3.6,columnHeight:6,segments:24,topColor:"#9edff0",bottomColor:"#246f98",opacity:1,transmission:.31,roughness:0,ior:2,thickness:.24,waveHeight:.15,waveChoppiness:.5,waveSpeed:.6,interactionEnabled:!0,interactionRadius:.28,interactionDepth:.012,interactionResolution:96,interactionViscosity:.92,edgeColor:"#333333",edgeOpacity:1,edgeLineWidth:3.5,showEdges:!0,hammerheadVisible:!0,hammerheadScale:.38,hammerheadSpeed:.1,hammerheadSplineVisible:!1,tiger1Visible:!0,tiger1Scale:.003,tiger1Speed:.075,tiger1SplineVisible:!1,tiger2Visible:!0,tiger2Scale:.003,tiger2Speed:.06,tiger2SplineVisible:!1,painterlyEnabled:!0,painterlyRadius:2,painterlyAlpha:25,painterlyQuantize:16,painterlySaturation:1.5,painterlyPaper:1,outlineEnabled:!0,outlineStrength:.75,outlineThreshold:.22,outlineSoftness:.14,hatchingEnabled:!0,hatchScale:6,hatchIntensity:.25,hatchThickness:.9,hatchRotation:.35,bloomEnabled:!0,bloomIntensity:1.2};function tt(){const e=r.useRef({...t}),[l,s]=_e("Staying Afloat",()=>({Presets:f({reset:se(()=>s({...t})),...Le()?{copy:se(()=>{const m=JSON.stringify(e.current,null,2).replace(/"([A-Za-z_$][A-Za-z0-9_$]*)":/g,"$1:");navigator.clipboard.writeText(m)})}:{}},{collapsed:!0}),Scene:f({cameraMode:{label:"Camera",value:t.cameraMode,options:["Fixed","Orbit"]},backgroundColor:{label:"Background",value:t.backgroundColor},Lighting:f({ambientIntensity:{label:"Ambient",value:t.ambientIntensity,min:0,max:2,step:.05},ambientColor:{label:"Ambient Color",value:t.ambientColor},mainLightIntensity:{label:"Main Light",value:t.mainLightIntensity,min:0,max:3,step:.05},mainLightColor:{label:"Main Color",value:t.mainLightColor},fillLightIntensity:{label:"Fill Light",value:t.fillLightIntensity,min:0,max:2,step:.05},fillLightColor:{label:"Fill Color",value:t.fillLightColor}},{collapsed:!0})},{collapsed:!0}),Water:f({columnWidth:{label:"Width",value:t.columnWidth,min:.5,max:10,step:.1},columnDepth:{label:"Depth",value:t.columnDepth,min:.5,max:10,step:.1},columnHeight:{label:"Height",value:t.columnHeight,min:.5,max:12,step:.1},segments:{value:t.segments,min:4,max:64,step:1},topColor:{label:"Top Color",value:t.topColor},bottomColor:{label:"Bottom Color",value:t.bottomColor},opacity:{value:t.opacity,min:0,max:1,step:.01},transmission:{value:t.transmission,min:0,max:1,step:.01},roughness:{value:t.roughness,min:0,max:1,step:.01},ior:{label:"IOR",value:t.ior,min:1,max:2.5,step:.01},thickness:{value:t.thickness,min:0,max:2,step:.01},waveHeight:{label:"Wave Height",value:t.waveHeight,min:0,max:1,step:.01},waveChoppiness:{label:"Choppiness",value:t.waveChoppiness,min:0,max:2,step:.01},waveSpeed:{label:"Wave Speed",value:t.waveSpeed,min:0,max:2,step:.01},Interaction:f({interactionEnabled:{label:"Cursor Ripple",value:t.interactionEnabled},interactionRadius:{label:"Radius",value:t.interactionRadius,min:.05,max:1,step:.01},interactionDepth:{label:"Depth",value:t.interactionDepth,min:.001,max:.05,step:.001},interactionViscosity:{label:"Viscosity",value:t.interactionViscosity,min:.85,max:.99,step:.001},interactionResolution:{label:"Resolution",value:t.interactionResolution,min:32,max:192,step:32}},{collapsed:!0}),Edges:f({showEdges:{label:"Show Edges",value:t.showEdges},edgeColor:{label:"Edge Color",value:t.edgeColor},edgeOpacity:{label:"Edge Opacity",value:t.edgeOpacity,min:0,max:1,step:.01},edgeLineWidth:{label:"Line Width",value:t.edgeLineWidth,min:.1,max:5,step:.1}},{collapsed:!0})},{collapsed:!0}),Sharks:f({HammerHead:f({hammerheadVisible:{label:"Visible",value:t.hammerheadVisible},hammerheadScale:{label:"Scale",value:t.hammerheadScale,min:.01,max:2,step:.01},hammerheadSpeed:{label:"Speed",value:t.hammerheadSpeed,min:0,max:.5,step:.005},"HammerHead Path":f({hammerheadSplineVisible:{label:"Show Spline",value:t.hammerheadSplineVisible}},{collapsed:!0})},{collapsed:!0}),"Tiger Shark 1":f({tiger1Visible:{label:"Visible",value:t.tiger1Visible},tiger1Scale:{label:"Scale",value:t.tiger1Scale,min:.001,max:.01,step:5e-4},tiger1Speed:{label:"Speed",value:t.tiger1Speed,min:0,max:.5,step:.005},"Tiger 1 Path":f({tiger1SplineVisible:{label:"Show Spline",value:t.tiger1SplineVisible}},{collapsed:!0})},{collapsed:!0}),"Tiger Shark 2":f({tiger2Visible:{label:"Visible",value:t.tiger2Visible},tiger2Scale:{label:"Scale",value:t.tiger2Scale,min:.001,max:.01,step:5e-4},tiger2Speed:{label:"Speed",value:t.tiger2Speed,min:0,max:.5,step:.005},"Tiger 2 Path":f({tiger2SplineVisible:{label:"Show Spline",value:t.tiger2SplineVisible}},{collapsed:!0})},{collapsed:!0})},{collapsed:!0}),"Post Processing":f({painterlyEnabled:{label:"Painterly",value:t.painterlyEnabled},painterlyRadius:{label:"Painterly Radius",value:t.painterlyRadius,min:1,max:10,step:1},painterlyAlpha:{label:"Stroke Direction",value:t.painterlyAlpha,min:1,max:100,step:1},painterlyQuantize:{label:"Quantize Levels",value:t.painterlyQuantize,min:2,max:32,step:1},painterlySaturation:{label:"Saturation",value:t.painterlySaturation,min:0,max:3,step:.05},painterlyPaper:{label:"Paper Strength",value:t.painterlyPaper,min:0,max:1,step:.05},"Ink + Hatch":f({outlineEnabled:{label:"Outline",value:t.outlineEnabled},outlineStrength:{label:"Outline Strength",value:t.outlineStrength,min:0,max:2,step:.01},outlineThreshold:{label:"Outline Threshold",value:t.outlineThreshold,min:0,max:1,step:.01},outlineSoftness:{label:"Outline Softness",value:t.outlineSoftness,min:.001,max:1,step:.005},hatchingEnabled:{label:"Hatching",value:t.hatchingEnabled},hatchScale:{label:"Hatch Scale",value:t.hatchScale,min:1,max:24,step:.1},hatchIntensity:{label:"Hatch Intensity",value:t.hatchIntensity,min:0,max:1,step:.01},hatchThickness:{label:"Hatch Thickness",value:t.hatchThickness,min:.1,max:2,step:.01},hatchRotation:{label:"Hatch Rotation",value:t.hatchRotation,min:-3.14159,max:3.14159,step:.01}},{collapsed:!0}),bloomEnabled:{label:"Bloom",value:t.bloomEnabled},bloomIntensity:{label:"Bloom Intensity",value:t.bloomIntensity,min:0,max:6,step:.01}},{collapsed:!0})}),{collapsed:!0});return e.current={...l},l}function vt(){const e=tt(),l=ze({depth:e.columnDepth,enabled:e.interactionEnabled,radius:e.interactionRadius,resolution:e.interactionResolution,rippleDepth:e.interactionDepth,viscosity:e.interactionViscosity,width:e.columnWidth}),{hammerheadPath:s,tigerSharkPath:c,tigerSharkPath2:m}=r.useMemo(()=>{const d=Ie["Staying Afloat"]?.splines??[];return{hammerheadPath:d.find(g=>g.name==="Hammerhead Path"),tigerSharkPath:d.find(g=>g.name==="Tiger Shark Path"),tigerSharkPath2:d.find(g=>g.name==="Tiger Shark Path 2")}},[]),n=r.useMemo(()=>({hammerhead:{bodySpanScale:.9,bodyCenterBlend:1},tiger1:{bodySpanScale:.85,bodyCenterBlend:1},tiger2:{bodySpanScale:.85,bodyCenterBlend:1}}),[]);return a.jsxs(a.Fragment,{children:[a.jsx("color",{attach:"background",args:[e.backgroundColor]}),a.jsx(He,{makeDefault:!0,position:[8.4,7.4,8.2],fov:30,near:.1,far:100,onUpdate:u=>u.lookAt(0,.4,0)}),e.cameraMode==="Orbit"&&a.jsx(Fe,{target:[0,.4,0]}),a.jsx("ambientLight",{intensity:e.ambientIntensity,color:e.ambientColor}),a.jsx("directionalLight",{position:[4,10,5],intensity:e.mainLightIntensity,color:e.mainLightColor,castShadow:!0,"shadow-bias":-5e-4,"shadow-normalBias":.04}),a.jsx("directionalLight",{position:[-5,2,-6],intensity:e.fillLightIntensity,color:e.fillLightColor}),a.jsx(Ue,{width:e.columnWidth,depth:e.columnDepth,height:e.columnHeight,segments:e.segments,topColor:e.topColor,bottomColor:e.bottomColor,opacity:e.opacity,transmission:e.transmission,roughness:e.roughness,ior:e.ior,thickness:e.thickness,waveHeight:e.waveHeight,waveChoppiness:e.waveChoppiness,waveSpeed:e.waveSpeed,interactionRuntime:l,edgeColor:e.edgeColor,edgeOpacity:e.edgeOpacity,edgeLineWidth:e.edgeLineWidth,showEdges:e.showEdges}),a.jsx($e,{interactionRuntime:l,waterTop:e.columnHeight/2,waveHeight:e.waveHeight,waveChoppiness:e.waveChoppiness,waveSpeed:e.waveSpeed}),a.jsx(re,{Shark:We,points:s?.points?.map(u=>u.position)??[],speed:e.hammerheadSpeed,scale:e.hammerheadScale,headingOffset:Math.PI,visible:e.hammerheadVisible,showSpline:e.hammerheadSplineVisible,bodySpanScale:n.hammerhead.bodySpanScale,bodyCenterBlend:n.hammerhead.bodyCenterBlend}),a.jsx(re,{Shark:ue,points:c?.points?.map(u=>u.position)??[],speed:e.tiger1Speed,scale:e.tiger1Scale,headingOffset:Math.PI,visible:e.tiger1Visible,showSpline:e.tiger1SplineVisible,bodySpanScale:n.tiger1.bodySpanScale,bodyCenterBlend:n.tiger1.bodyCenterBlend,sharkProps:{excludeAnimations:["attack"]}}),a.jsx(re,{Shark:ue,points:m?.points?.map(u=>u.position)??[],speed:e.tiger2Speed,scale:e.tiger2Scale,headingOffset:0,clockwise:!1,visible:e.tiger2Visible,showSpline:e.tiger2SplineVisible,bodySpanScale:n.tiger2.bodySpanScale,bodyCenterBlend:n.tiger2.bodyCenterBlend,sharkProps:{excludeAnimations:["attack"]}}),e.painterlyEnabled&&a.jsx(Ke,{radius:e.painterlyRadius,alpha:e.painterlyAlpha,quantizeLevels:e.painterlyQuantize,saturation:e.painterlySaturation,paperStrength:e.painterlyPaper,outlineEnabled:e.outlineEnabled,outlineStrength:e.outlineStrength,outlineThreshold:e.outlineThreshold,outlineSoftness:e.outlineSoftness,hatchingEnabled:e.hatchingEnabled,hatchScale:e.hatchScale,hatchIntensity:e.hatchIntensity,hatchThickness:e.hatchThickness,hatchRotation:e.hatchRotation,bloomEnabled:e.bloomEnabled,bloomIntensity:e.bloomIntensity})]})}export{vt as default};
