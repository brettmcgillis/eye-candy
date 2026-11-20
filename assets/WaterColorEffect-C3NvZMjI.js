import{a5 as oe,L as le,$ as ne,b as ie,r,aa as G,bX as Q,bH as ue,a3 as se,W as K,H as ce,O as fe,_ as ve,h as g,a as me}from"./index-DQZ6GwWS.js";import{u as Z}from"./Texture-B4g0qqp1.js";import{u as h}from"./Fbo-C5hQEOLB.js";const $=`
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
`,xe=`
uniform sampler2D inputBuffer;
uniform sampler2D bloomBuffer;
uniform float bloomIntensity;
varying vec2 vUv;

void main() {
  vec3 base = texture2D(inputBuffer, vUv).rgb;
  vec3 bloom = texture2D(bloomBuffer, vUv).rgb * bloomIntensity;
  gl_FragColor = vec4(base + bloom, 1.0);
}
`,ge=`
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
`,he=`
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
`,pe=`
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
`,de=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;function i(p,d,y){const u=new oe({uniforms:y,vertexShader:de,fragmentShader:d,depthTest:!1,depthWrite:!1}),s=new le(p,u);s.frustumCulled=!1;const c=new ne;return c.add(s),{scene:c,material:u}}Z.preload(Q("watercolor.png"));const ye=1;function Ce({radius:p=6,alpha:d=25,qualityScale:y=.5,quantizeLevels:u=16,saturation:s=1.5,paperStrength:c=1,bloomEnabled:ee=!0,bloomIntensity:E=1.2,outlineEnabled:O=!0,outlineStrength:z=.75,outlineThreshold:F=.22,outlineSoftness:_=.14,hatchingEnabled:k=!0,hatchScale:A=6,hatchIntensity:V=.25,hatchThickness:L=.9,hatchRotation:q=.35}){const{size:J}=ie(),N=r.useRef(new G),W=r.useRef(new G),b=Z(Q("watercolor.png"));b.minFilter=ue,b.magFilter=se,b.generateMipmaps=!0;const w=h({depthBuffer:!0}),o=r.useMemo(()=>new K(1,1,{depthBuffer:!1,type:ce}),[]),f=r.useMemo(()=>new K(1,1,{depthBuffer:!1}),[]);r.useEffect(()=>()=>{o.dispose(),f.dispose()},[o,f]);const P=h({depthBuffer:!0}),H=h({depthBuffer:!1}),I=h({depthBuffer:!1}),j=h({depthBuffer:!1}),l=r.useMemo(()=>new fe(-1,1,1,-1,0,1),[]),a=r.useMemo(()=>new ve(2,2),[]),M=r.useMemo(()=>i(a,pe,{inputBuffer:{value:null},resolution:{value:new G}}),[a]),n=r.useMemo(()=>i(a,he,{inputBuffer:{value:null},originalTexture:{value:null},sourceSize:{value:new g},radius:{value:p},alpha:{value:d}}),[a]),t=r.useMemo(()=>i(a,ge,{inputBuffer:{value:null},watercolorTexture:{value:null},tensorTexture:{value:null},quantizeLevels:{value:u},saturation:{value:s},paperStrength:{value:c},outlineEnabled:{value:O},outlineStrength:{value:z},outlineThreshold:{value:F},outlineSoftness:{value:_},hatchingEnabled:{value:k},hatchScale:{value:A},hatchIntensity:{value:V},hatchThickness:{value:L},hatchRotation:{value:q}}),[a]),U=r.useMemo(()=>i(a,$,{inputBuffer:{value:null},direction:{value:new g(1,0)},resolution:{value:new g}}),[a]),D=r.useMemo(()=>i(a,$,{inputBuffer:{value:null},direction:{value:new g(0,1)},resolution:{value:new g}}),[a]),S=r.useMemo(()=>i(a,xe,{inputBuffer:{value:null},bloomBuffer:{value:null},bloomIntensity:{value:E}}),[a]);return me(te=>{const{gl:e,scene:v,camera:T}=te,X=e.getPixelRatio(),C=J.width*X,R=J.height*X;N.current.set(C,R,1/C,1/R);const m=Math.max(1,Math.round(C*y)),x=Math.max(1,Math.round(R*y));(o.width!==m||o.height!==x)&&(o.setSize(m,x),f.setSize(m,x)),W.current.set(m,x,1/m,1/x);const re=e.autoClear;e.autoClear=!1,e.setRenderTarget(w),e.clear(),e.render(v,T);const Y=ee?(()=>{const B=N.current,ae=v.background;return v.background=null,T.layers.set(ye),e.setRenderTarget(P),e.setClearColor(0,1),e.clear(),e.render(v,T),T.layers.set(0),v.background=ae,U.material.uniforms.inputBuffer.value=P.texture,U.material.uniforms.resolution.value.set(B.x,B.y),e.setRenderTarget(H),e.clear(),e.render(U.scene,l),D.material.uniforms.inputBuffer.value=H.texture,D.material.uniforms.resolution.value.set(B.x,B.y),e.setRenderTarget(I),e.clear(),e.render(D.scene,l),S.material.uniforms.inputBuffer.value=w.texture,S.material.uniforms.bloomBuffer.value=I.texture,S.material.uniforms.bloomIntensity.value=E,e.setRenderTarget(j),e.clear(),e.render(S.scene,l),j.texture})():w.texture;M.material.uniforms.inputBuffer.value=Y,M.material.uniforms.resolution.value=W.current,e.setRenderTarget(o),e.clear(),e.render(M.scene,l),n.material.uniforms.inputBuffer.value=o.texture,n.material.uniforms.originalTexture.value=Y,n.material.uniforms.sourceSize.value.set(C,R),n.material.uniforms.radius.value=p,n.material.uniforms.alpha.value=d,e.setRenderTarget(f),e.clear(),e.render(n.scene,l),t.material.uniforms.inputBuffer.value=f.texture,t.material.uniforms.watercolorTexture.value=b,t.material.uniforms.tensorTexture.value=o.texture,t.material.uniforms.quantizeLevels.value=u,t.material.uniforms.saturation.value=s,t.material.uniforms.paperStrength.value=c,t.material.uniforms.outlineEnabled.value=O,t.material.uniforms.outlineStrength.value=z,t.material.uniforms.outlineThreshold.value=F,t.material.uniforms.outlineSoftness.value=_,t.material.uniforms.hatchingEnabled.value=k,t.material.uniforms.hatchScale.value=A,t.material.uniforms.hatchIntensity.value=V,t.material.uniforms.hatchThickness.value=L,t.material.uniforms.hatchRotation.value=q,e.setRenderTarget(null),e.clear(),e.render(t.scene,l),e.autoClear=re},1),null}export{Ce as default};
