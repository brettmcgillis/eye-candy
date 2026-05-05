import{s as he,V as J,t as te,z as D,r as C,C as le,g as ge,F as ye,b as ve,j as W,e as be,v as Se,X as Ce,aJ as Te,a as ze,ba as Be,a6 as Re,W as ie,c as Me,aK as Ee,ay as we,G as H}from"./index-BjAk923F.js";import{b as Ae,d as oe,a as Ge}from"./Line2-Bw_oRXYr.js";import{u as De}from"./Texture-Dok899JZ.js";import{u as I}from"./Fbo-2WB1Ko_c.js";class k extends he{constructor(e=(o,s,n)=>n.set(o,s,Math.cos(o)*Math.sin(s)),a=8,r=8){super(),this.type="ParametricGeometry",this.parameters={func:e,slices:a,stacks:r};const o=[],s=[],n=[],u=[],i=1e-5,l=new J,c=new J,f=new J,m=new J,x=new J,d=a+1;for(let g=0;g<=r;g++){const p=g/r;for(let b=0;b<=a;b++){const y=b/a;e(y,p,c),s.push(c.x,c.y,c.z),y-i>=0?(e(y-i,p,f),m.subVectors(c,f)):(e(y+i,p,f),m.subVectors(f,c)),p-i>=0?(e(y,p-i,f),x.subVectors(c,f)):(e(y,p+i,f),x.subVectors(f,c)),l.crossVectors(m,x).normalize(),n.push(l.x,l.y,l.z),u.push(y,p)}}for(let g=0;g<r;g++)for(let p=0;p<a;p++){const b=g*d+p,y=g*d+p+1,E=(g+1)*d+p+1,w=(g+1)*d+p;o.push(b,y,w),o.push(y,E,w)}this.setIndex(o),this.setAttribute("position",new te(s,3)),this.setAttribute("normal",new te(n,3)),this.setAttribute("uv",new te(u,2))}}function ue(t,e,a){const r=a.length-t-1;if(e>=a[r])return r-1;if(e<=a[t])return t;let o=t,s=r,n=Math.floor((o+s)/2);for(;e<a[n]||e>=a[n+1];)e<a[n]?s=n:o=n,n=Math.floor((o+s)/2);return n}function ce(t,e,a,r){const o=[],s=[],n=[];o[0]=1;for(let u=1;u<=a;++u){s[u]=e-r[t+1-u],n[u]=r[t+u]-e;let i=0;for(let l=0;l<u;++l){const c=n[l+1],f=s[u-l],m=o[l]/(c+f);o[l]=i+c*m,i=f*m}o[u]=i}return o}function _e(t,e,a,r,o,s,n,u){const i=ue(t,s,a),l=ue(e,n,r),c=ce(i,s,t,a),f=ce(l,n,e,r),m=[];for(let d=0;d<=e;++d){m[d]=new D(0,0,0,0);for(let g=0;g<=t;++g){const p=o[i-t+g][l-e+d].clone(),b=p.w;p.x*=b,p.y*=b,p.z*=b,m[d].add(p.multiplyScalar(c[g]))}}const x=new D(0,0,0,0);for(let d=0;d<=e;++d)x.add(m[d].multiplyScalar(f[d]));x.divideScalar(x.w),u.set(x.x,x.y,x.z)}class re{constructor(e,a,r,o,s){this.degree1=e,this.degree2=a,this.knots1=r,this.knots2=o,this.controlPoints=[];const n=r.length-e-1,u=o.length-a-1;for(let i=0;i<n;++i){this.controlPoints[i]=[];for(let l=0;l<u;++l){const c=s[i][l];this.controlPoints[i][l]=new D(c.x,c.y,c.z,c.w)}}}getPoint(e,a,r){const o=this.knots1[0]+e*(this.knots1[this.knots1.length-1]-this.knots1[0]),s=this.knots2[0]+a*(this.knots2[this.knots2.length-1]-this.knots2[0]);_e(this.degree1,this.degree2,this.knots1,this.knots2,this.controlPoints,o,s,r)}}be({Line2:Ge});const We=[{dx:.6,dz:.8,freq:1.2,amp:1},{dx:-.4,dz:.9,freq:2.5,amp:.4},{dx:.9,dz:-.3,freq:3.8,amp:.2},{dx:-.7,dz:-.6,freq:5,amp:.1}],Y=We.map(t=>{const e=Math.sqrt(t.dx*t.dx+t.dz*t.dz);return{dx:t.dx/e,dz:t.dz/e,freq:t.freq,amp:t.amp}});let ae=0;function fe(t,e,a,r,o){let s=0;for(let n=0;n<Y.length;n+=1){const{dx:u,dz:i,freq:l,amp:c}=Y[n],f=c*a,m=o*l,x=(u*t+i*e)*l+ae*m;s+=f*Math.cos(x)}return s}function ot(t,e,a,r,o){let s=0,n=1,u=0;for(let l=0;l<Y.length;l+=1){const{dx:c,dz:f,freq:m,amp:x}=Y[l],d=x*a,g=r/(m*d*Y.length),p=o*m,b=(c*t+f*e)*m+ae*p,y=Math.sin(b),E=Math.cos(b),w=m*d;s-=c*w*y,u-=f*w*y,n-=g*w*E}const i=Math.sqrt(s*s+n*n+u*u);return{x:s/i,y:n/i,z:u/i}}const qe=`
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveChoppiness;
  uniform float uWaveSpeed;
  uniform float uColumnTop;
  uniform float uColumnBottom;

  varying float vNormHeight;

  // Y-only wave displacement — walls stay vertical, only top undulates
  vec3 nurbsWaveDisplace(vec3 pos) {
    float normY = clamp(
      (pos.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
    );
    // Only vertices near the top move (sides lerp from 0 at bottom to full at top)
    float blend = smoothstep(0.5, 1.0, normY);

    vec2 dirs[4];
    dirs[0] = normalize(vec2( 0.6,  0.8));
    dirs[1] = normalize(vec2(-0.4,  0.9));
    dirs[2] = normalize(vec2( 0.9, -0.3));
    dirs[3] = normalize(vec2(-0.7, -0.6));

    float freqs[4];
    freqs[0] = 1.2; freqs[1] = 2.5; freqs[2] = 3.8; freqs[3] = 5.0;

    float baseAmps[4];
    baseAmps[0] = 1.0; baseAmps[1] = 0.4; baseAmps[2] = 0.2; baseAmps[3] = 0.1;

    float heightDisp = 0.0;
    for (int i = 0; i < 4; i++) {
      float amp = baseAmps[i] * uWaveHeight;
      float phase = uWaveSpeed * freqs[i];
      float theta = dot(dirs[i], pos.xz) * freqs[i] + uTime * phase;
      heightDisp += amp * cos(theta);
    }

    // Only displace in Y — no horizontal shift keeps walls flush
    return vec3(0.0, heightDisp * blend, 0.0);
  }

  vec3 nurbsWaveNormal(vec3 pos) {
    vec2 dirs[4];
    dirs[0] = normalize(vec2( 0.6,  0.8));
    dirs[1] = normalize(vec2(-0.4,  0.9));
    dirs[2] = normalize(vec2( 0.9, -0.3));
    dirs[3] = normalize(vec2(-0.7, -0.6));

    float freqs[4];
    freqs[0] = 1.2; freqs[1] = 2.5; freqs[2] = 3.8; freqs[3] = 5.0;

    float baseAmps[4];
    baseAmps[0] = 1.0; baseAmps[1] = 0.4; baseAmps[2] = 0.2; baseAmps[3] = 0.1;

    vec3 n = vec3(0.0, 1.0, 0.0);
    for (int i = 0; i < 4; i++) {
      float amp = baseAmps[i] * uWaveHeight;
      float Q = uWaveChoppiness / (freqs[i] * amp * 4.0);
      float phase = uWaveSpeed * freqs[i];
      float theta = dot(dirs[i], pos.xz) * freqs[i] + uTime * phase;
      float s = sin(theta);
      float c = cos(theta);
      float WA = freqs[i] * amp;
      n.x -= dirs[i].x * WA * s;
      n.z -= dirs[i].y * WA * s;
      n.y -= Q * WA * c;
    }
    return normalize(n);
  }
`,Ne=`
  #include <common>
  ${qe}
`,Oe=`
  // Blend wave normals in for top-facing surfaces only
  float _isTopFacing = step(0.5, normal.y);
  float _normY = clamp(
    (position.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
  );
  float _normalBlend = _isTopFacing * smoothstep(0.8, 1.0, _normY);
  vec3 _waveNorm = nurbsWaveNormal(position);
  vec3 objectNormal = mix(vec3(normal), _waveNorm, _normalBlend);
  #ifdef USE_TANGENT
    vec3 objectTangent = vec3(tangent.xyz);
  #endif
`,Ue=`
  vec3 waveD = nurbsWaveDisplace(position);
  vec3 transformed = position + waveD;
  vNormHeight = clamp(
    (transformed.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
  );
  #ifdef USE_ALPHAHASH
    vPosition = vec3(position);
  #endif
`,ke=`
  uniform vec3 uTopColor;
  uniform vec3 uBottomColor;
  varying float vNormHeight;
`,Pe=`
  #include <color_fragment>
  diffuseColor.rgb = mix(uBottomColor, uTopColor, vNormHeight);
`;function Fe(t,e,a){const r=[0,0,0,0,1,1,1,1],o=[t,t/3,-t/3,-t],s=[-e,-e/3,e/3,e],n=o.map(u=>s.map(i=>new D(u,a,i,1)));return new re(3,3,r,r,n)}function Ve(t,e,a){const r=[0,0,0,0,1,1,1,1],o=[-t,-t/3,t/3,t],s=[-e,-e/3,e/3,e],n=o.map(u=>s.map(i=>new D(u,a,i,1)));return new re(3,3,r,r,n)}function Z(t,e,a,r){const o=[0,0,0,0,1,1,1,1],s=[0,0,0,1,1,1],n=(a+r)/2,u=t.map(i=>{const l=e(i,a),c=e(i,r);return[new D(l.x,l.y,l.z,1),new D((l.x+c.x)/2,n,(l.z+c.z)/2,1),new D(c.x,c.y,c.z,1)]});return new re(3,2,o,s,u)}function Le({width:t,depth:e,height:a}){const r=t/2,o=e/2,s=a/2,n=-a/2;return{top:Fe(r,o,s),bottom:Ve(r,o,n),front:Z([-r,-r/3,r/3,r],(u,i)=>({x:u,y:i,z:o}),n,s),back:Z([r,r/3,-r/3,-r],(u,i)=>({x:u,y:i,z:-o}),n,s),right:Z([o,o/3,-o/3,-o],(u,i)=>({x:r,y:i,z:u}),n,s),left:Z([-o,-o/3,o/3,o],(u,i)=>({x:-r,y:i,z:u}),n,s)}}function je(t,e,a,r){const o=Math.max(8,Math.round(e*(a/r))),s=Math.max(4,Math.round(e/4)),n=u=>(i,l,c)=>u.getPoint(i,l,c);return[new k(n(t.top),e,e),new k(n(t.bottom),s,s),new k(n(t.front),e,o),new k(n(t.back),e,o),new k(n(t.right),e,o),new k(n(t.left),e,o)]}const ee=32;function Je(t,e,a,r){const o=new oe;o.setPositions([-t,r,-e,t,r,-e,t,r,e,-t,r,e,-t,r,-e]);const n=[[-t,-e],[t,-e],[t,e],[-t,e]].map(([l,c])=>{const f=new oe;return f.setPositions([l,r,c,l,a,c]),{geo:f,cx:l,cz:c}}),i=[{x0:-t,z0:-e,x1:t,z1:-e},{x0:t,z0:-e,x1:t,z1:e},{x0:t,z0:e,x1:-t,z1:e},{x0:-t,z0:e,x1:-t,z1:-e}].map(l=>{const c=[];for(let m=0;m<=ee;m+=1){const x=m/ee;c.push(l.x0+(l.x1-l.x0)*x,a,l.z0+(l.z1-l.z0)*x)}const f=new oe;return f.setPositions(c),{geo:f,edge:l}});return{bottomGeo:o,vertGeos:n,topGeos:i}}function rt({width:t=3.6,depth:e=3.6,height:a=6,segments:r=24,topColor:o="#9edff0",bottomColor:s="#246f98",opacity:n=.34,transmission:u=.5,roughness:i=.3,ior:l=1.12,thickness:c=.35,waveHeight:f=.15,waveChoppiness:m=.5,waveSpeed:x=.6,edgeColor:d="#1f4455",edgeOpacity:g=.65,edgeLineWidth:p=1,showEdges:b=!0}){const y=C.useRef(0),E=C.useMemo(()=>({uTime:{value:y.current},uWaveHeight:{value:f},uWaveChoppiness:{value:m},uWaveSpeed:{value:x},uColumnTop:{value:a/2},uColumnBottom:{value:-a/2},uTopColor:{value:new le(o)},uBottomColor:{value:new le(s)}}),[o,s,a]),w=C.useMemo(()=>{const T=Le({width:t,depth:e,height:a});return je(T,r,a,Math.max(t,e))},[t,e,a,r]),F=C.useMemo(()=>{const T=new ge({transparent:!0,opacity:n,transmission:u,roughness:i,metalness:0,ior:l,thickness:c,side:ye,depthWrite:!0});return T.onBeforeCompile=M=>{const z=M;Object.entries(E).forEach(([q,A])=>{z.uniforms[q]=A}),z.vertexShader=z.vertexShader.replace("#include <common>",Ne),z.vertexShader=z.vertexShader.replace("#include <beginnormal_vertex>",Oe),z.vertexShader=z.vertexShader.replace("#include <begin_vertex>",Ue),z.fragmentShader=z.fragmentShader.replace("#include <common>",`#include <common>
${ke}`),z.fragmentShader=z.fragmentShader.replace("#include <color_fragment>",Pe)},T},[E,n,u,i,l,c]),B=C.useMemo(()=>{if(!b)return null;const T=t/2,M=e/2;return Je(T,M,a/2,-a/2)},[b,t,a,e]),R=C.useMemo(()=>new Ae({transparent:!0,depthTest:!0,depthWrite:!1,toneMapped:!1}),[]);return ve((T,M)=>{if(y.current+=M,E.uTime.value=y.current,E.uWaveHeight.value=f,E.uWaveChoppiness.value=m,E.uWaveSpeed.value=x,ae=y.current,b&&R&&(R.color.set(d),R.opacity=g,R.linewidth=p,R.resolution.set(T.size.width,T.size.height)),B){const z=a/2,q=-a/2;B.topGeos.forEach(({geo:A,edge:h})=>{const _=[];for(let G=0;G<=ee;G+=1){const S=G/ee,N=h.x0+(h.x1-h.x0)*S,O=h.z0+(h.z1-h.z0)*S,U=fe(N,O,f,m,x);_.push(N,z+U,O)}A.setPositions(_)}),B.vertGeos.forEach(({geo:A,cx:h,cz:_})=>{const G=fe(h,_,f,m,x);A.setPositions([h,q,_,h,z+G,_])})}}),W.jsxs("group",{children:[w.map((T,M)=>W.jsx("mesh",{geometry:T,material:F},M)),b&&B&&W.jsxs(W.Fragment,{children:[W.jsx("line2",{geometry:B.bottomGeo,material:R}),B.vertGeos.map(({geo:T},M)=>W.jsx("line2",{geometry:T,material:R},`v${M}`)),B.topGeos.map(({geo:T},M)=>W.jsx("line2",{geometry:T,material:R},`t${M}`))]})]})}const me=`
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
`,He=`
uniform sampler2D inputBuffer;
uniform sampler2D bloomBuffer;
uniform float bloomIntensity;
varying vec2 vUv;

void main() {
  vec3 base = texture2D(inputBuffer, vUv).rgb;
  vec3 bloom = texture2D(bloomBuffer, vUv).rgb * bloomIntensity;
  gl_FragColor = vec4(base + bloom, 1.0);
}
`,Ie=`
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
`,Ye=`
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
`,Xe=`
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
`,$e=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;function P(t,e,a){const r=new Se({uniforms:a,vertexShader:$e,fragmentShader:e,depthTest:!1,depthWrite:!1}),o=new Ce(t,r);o.frustumCulled=!1;const s=new Te;return s.add(o),{scene:s,material:r}}const Qe=1;function at({radius:t=6,alpha:e=25,qualityScale:a=.5,quantizeLevels:r=16,saturation:o=1.5,paperStrength:s=1,bloomEnabled:n=!0,bloomIntensity:u=1.2,outlineEnabled:i=!0,outlineStrength:l=.75,outlineThreshold:c=.22,outlineSoftness:f=.14,hatchingEnabled:m=!0,hatchScale:x=6,hatchIntensity:d=.25,hatchThickness:g=.9,hatchRotation:p=.35}){const{size:b}=ze(),y=C.useRef(new D),E=C.useRef(new D),w=De("/images/watercolor.png");w.minFilter=Be,w.magFilter=Re,w.generateMipmaps=!0;const F=I({depthBuffer:!0}),B=C.useMemo(()=>new ie(1,1,{depthBuffer:!1,type:Me}),[]),R=C.useMemo(()=>new ie(1,1,{depthBuffer:!1}),[]);C.useEffect(()=>()=>{B.dispose(),R.dispose()},[B,R]);const T=I({depthBuffer:!0}),M=I({depthBuffer:!1}),z=I({depthBuffer:!1}),q=I({depthBuffer:!1}),A=C.useMemo(()=>new Ee(-1,1,1,-1,0,1),[]),h=C.useMemo(()=>new we(2,2),[]),_=C.useMemo(()=>P(h,Xe,{inputBuffer:{value:null},resolution:{value:new D}}),[h]),G=C.useMemo(()=>P(h,Ye,{inputBuffer:{value:null},originalTexture:{value:null},sourceSize:{value:new H},radius:{value:t},alpha:{value:e}}),[h]),S=C.useMemo(()=>P(h,Ie,{inputBuffer:{value:null},watercolorTexture:{value:null},tensorTexture:{value:null},quantizeLevels:{value:r},saturation:{value:o},paperStrength:{value:s},outlineEnabled:{value:i},outlineStrength:{value:l},outlineThreshold:{value:c},outlineSoftness:{value:f},hatchingEnabled:{value:m},hatchScale:{value:x},hatchIntensity:{value:d},hatchThickness:{value:g},hatchRotation:{value:p}}),[h]),N=C.useMemo(()=>P(h,me,{inputBuffer:{value:null},direction:{value:new H(1,0)},resolution:{value:new H}}),[h]),O=C.useMemo(()=>P(h,me,{inputBuffer:{value:null},direction:{value:new H(0,1)},resolution:{value:new H}}),[h]),U=C.useMemo(()=>P(h,He,{inputBuffer:{value:null},bloomBuffer:{value:null},bloomIntensity:{value:u}}),[h]);return ve(pe=>{const{gl:v,scene:V,camera:X}=pe,ne=v.getPixelRatio(),$=b.width*ne,Q=b.height*ne;y.current.set($,Q,1/$,1/Q);const L=Math.max(1,Math.round($*a)),j=Math.max(1,Math.round(Q*a));(B.width!==L||B.height!==j)&&(B.setSize(L,j),R.setSize(L,j)),E.current.set(L,j,1/L,1/j);const xe=v.autoClear;v.autoClear=!1,v.setRenderTarget(F),v.clear(),v.render(V,X);const se=n?(()=>{const K=y.current,de=V.background;return V.background=null,X.layers.set(Qe),v.setRenderTarget(T),v.setClearColor(0,1),v.clear(),v.render(V,X),X.layers.set(0),V.background=de,N.material.uniforms.inputBuffer.value=T.texture,N.material.uniforms.resolution.value.set(K.x,K.y),v.setRenderTarget(M),v.clear(),v.render(N.scene,A),O.material.uniforms.inputBuffer.value=M.texture,O.material.uniforms.resolution.value.set(K.x,K.y),v.setRenderTarget(z),v.clear(),v.render(O.scene,A),U.material.uniforms.inputBuffer.value=F.texture,U.material.uniforms.bloomBuffer.value=z.texture,U.material.uniforms.bloomIntensity.value=u,v.setRenderTarget(q),v.clear(),v.render(U.scene,A),q.texture})():F.texture;_.material.uniforms.inputBuffer.value=se,_.material.uniforms.resolution.value=E.current,v.setRenderTarget(B),v.clear(),v.render(_.scene,A),G.material.uniforms.inputBuffer.value=B.texture,G.material.uniforms.originalTexture.value=se,G.material.uniforms.sourceSize.value.set($,Q),G.material.uniforms.radius.value=t,G.material.uniforms.alpha.value=e,v.setRenderTarget(R),v.clear(),v.render(G.scene,A),S.material.uniforms.inputBuffer.value=R.texture,S.material.uniforms.watercolorTexture.value=w,S.material.uniforms.tensorTexture.value=B.texture,S.material.uniforms.quantizeLevels.value=r,S.material.uniforms.saturation.value=o,S.material.uniforms.paperStrength.value=s,S.material.uniforms.outlineEnabled.value=i,S.material.uniforms.outlineStrength.value=l,S.material.uniforms.outlineThreshold.value=c,S.material.uniforms.outlineSoftness.value=f,S.material.uniforms.hatchingEnabled.value=m,S.material.uniforms.hatchScale.value=x,S.material.uniforms.hatchIntensity.value=d,S.material.uniforms.hatchThickness.value=g,S.material.uniforms.hatchRotation.value=p,v.setRenderTarget(null),v.clear(),v.render(S.scene,A),v.autoClear=xe},1),null}export{rt as N,k as P,at as W,ot as a,re as b,fe as s};
