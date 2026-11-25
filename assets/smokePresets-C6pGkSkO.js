import{an as P,j as i,D as w,C as v,h as k,e as U,r as f,_ as F,a as _,b as d,V as g,E as G}from"./index-BMaCTZDK.js";import{s as T}from"./shaderMaterial-DVL4KER5.js";import{B as M}from"./Billboard-Cithkdv6.js";import{S as R}from"./Smoke2DGPU-Bv1Cqezz.js";import{P as D,a as E,b as q,c as j}from"./PerlinNoiseSplineGPU-QI_ReRVw.js";import{b as L,c as B}from"./FireAndSmoke-DhZPEopN.js";import{m as p}from"./splineAuthoring-DnLmC0CO.js";import{S as O}from"./stillPullingForYouSmoke-RiiBArRq.js";import{T as A}from"./thatsAllFolksSmoke-BTQ1oIbd.js";const y=`
  vec2 fade(vec2 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float perlin2d(vec2 P) {
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0);
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x, gy.x);
    vec2 g10 = vec2(gx.y, gy.y);
    vec2 g01 = vec2(gx.z, gy.z);
    vec2 g11 = vec2(gx.w, gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 *
      vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
  }
`,S=`
  // Rotate helper to de-correlate successive octaves
  mat2 fbmRot = mat2(0.8660, 0.5, -0.5, 0.8660); // ~30° rotation

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.55;
    for (int i = 0; i < 4; i++) {
      v += a * perlin2d(p);
      p = fbmRot * p * 2.08;
      a *= 0.48;
    }
    return v;
  }
`,C=`
  uniform float uTime;
  uniform float uRiseSpeed;
  uniform float uSpreadStrength;
  uniform float uScrollDir;

  varying vec2 vUv;

  ${y}
  ${S}

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Scrolling displacement UV (moves in rise direction; flipped for inverted smoke)
    vec2 displacementUv = uv * 4.0;
    displacementUv.y -= uTime * uRiseSpeed * uScrollDir;

    // Displacement builds up away from the wick
    float displacementStrength = pow(uv.y * 2.8, 2.0);

    // Two-octave FBM gives more organic horizontal waver
    float waver = fbm(displacementUv);
    float waver2 = perlin2d(displacementUv * 2.1 + vec2(4.7, 0.0));

    pos.x += (waver + waver2 * 0.3) * displacementStrength * uSpreadStrength;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`,z=`
  uniform float uTime;
  uniform float uTimeFrequency;
  uniform vec2  uUvFrequency;
  uniform vec3  uColor;
  uniform float uOpacity;
  uniform float uScrollDir;

  varying vec2 vUv;

  ${y}
  ${S}

  void main() {
    vec2 uv = vUv * uUvFrequency;
    uv.y -= uTime * uTimeFrequency * uScrollDir;

    // Smooth S-curve fade at horizontal edges
    float borderAlpha = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
    // Gentle power-curve fade toward the far tip (smoke disperses)
    borderAlpha *= pow(1.0 - vUv.y, 0.65);
    // Short fade-in at the wick so there is no hard edge at the source
    borderAlpha *= smoothstep(0.0, 0.1, vUv.y);

    // FBM for multi-octave wispy density
    float density = fbm(uv);
    density *= borderAlpha;
    density *= uOpacity;
    density = clamp(density, 0.0, 1.0);

    gl_FragColor = vec4(uColor, density);
  }
`,W=T({uTime:0,uTimeFrequency:.45,uUvFrequency:new k(3,5),uColor:new v("#b8b8b8"),uOpacity:.6,uRiseSpeed:.35,uSpreadStrength:.18,uScrollDir:1},C,z);U({SmokeMaterialImpl:W});const V=P.forwardRef(function({side:o=w},t){return i.jsx("smokeMaterialImpl",{ref:t,transparent:!0,side:o,depthWrite:!1,toneMapped:!1})}),K={timeFrequency:.45,uvFrequencyX:1,uvFrequencyY:1.5,riseSpeed:.35,spreadStrength:.18,opacity:.6,color:"#b8b8b8",width:.25,height:3};function N({position:e=[0,0,0],inverted:o=!1,smoke:t,visible:n=!0}){const r={...K,...t},c=f.useRef(),l=f.useMemo(()=>new v(r.color),[r.color]),u=f.useMemo(()=>new F(r.width,r.height,2,32),[r.width,r.height]),m=1;if(_(({clock:b})=>{const s=c.current;s&&(s.uTime=b.getElapsedTime(),s.uTimeFrequency=r.timeFrequency,s.uUvFrequency.set(r.uvFrequencyX,r.uvFrequencyY),s.uColor.copy(l),s.uOpacity=r.opacity,s.uRiseSpeed=r.riseSpeed,s.uSpreadStrength=r.spreadStrength,s.uScrollDir=m)}),!n)return null;const x=o?-(r.height/2):r.height/2,h=o?[1,-1,1]:[1,1,1];return i.jsx(M,{position:e,follow:!0,lockX:!1,lockY:!1,lockZ:!1,children:i.jsx("mesh",{position:[0,x,0],scale:h,geometry:u,children:i.jsx(V,{ref:c})})})}function le(e){return d(n=>n.gl)?.isWebGPURenderer===!0?i.jsx(R,{...e}):i.jsx(N,{...e})}function Y({smokeLightColor:e="#bcbcbc",smokeDarkColor:o="#262626",...t}){return i.jsx(D,{...t,greyscale:!0,smokeLightColor:e,smokeDarkColor:o})}function I({smokeLightColor:e="#bcbcbc",smokeDarkColor:o="#262626",...t}){return i.jsx(E,{...t,greyscale:!0,smokeLightColor:e,smokeDarkColor:o})}function ue(e){return d(n=>n.gl)?.isWebGPURenderer===!0?i.jsx(I,{...e}):i.jsx(Y,{...e})}function X({smokeLightColor:e="#bcbcbc",smokeDarkColor:o="#262626",...t}){return i.jsx(q,{...t,greyscale:!0,smokeLightColor:e,smokeDarkColor:o})}function $({smokeLightColor:e="#bcbcbc",smokeDarkColor:o="#262626",...t}){return i.jsx(j,{...t,greyscale:!0,smokeLightColor:e,smokeDarkColor:o})}function me(e){return d(n=>n.gl)?.isWebGPURenderer===!0?i.jsx($,{...e}):i.jsx(X,{...e})}const H=(e,o,t)=>new g(e,o,t),Z=(e,o,t)=>new G(e,o,t),J=(e,o,t)=>new g(e,o,t),a=(e,o,t,n,r,c,l=0,u=0,m=0)=>({position:H(e,o,t),rotation:Z(l,u,m),scale:J(n,r,c)}),Q={Default:{splines:[p({name:"Default Smoke",type:"Smoke",smokeType:"Particle",closed:!1,tension:.7,pos:[0,-1,0],points:[[0,0,0],[1.1,2,.7],[-.4,5,1.4],[-1.3,8.2,-.3],[.6,11,-1.1]]}),p({name:"Particle Smoke",type:"Particle",tension:.5,closed:!0,pos:[7,1.5,0],points:[[0,0,0],[-2,2,2],[-4,0,0],[-2,-2,-2]]}),p({name:"Volumetric Smoke",type:"Volumetric",tension:.5,closed:!0,pos:[5,1.5,-2],points:[[0,0,0],[0,2,2],[0,0,4],[0,-2,2]]})],elements:{smokeBall:[{pos:[-5,1,0],rot:[0,0,0],scale:[1,1,1],config:{radius:.6,detail:5,speed:1,weight:.3,noiseFreq:2,noiseAmp:.15,animated:!0,smokeLightColor:"#bcbcbc",smokeDarkColor:"#262626"}}],smokeBallSpline:[{pos:[0,0,0],rot:[0,0,0],scale:[1,1,1],showHandles:!0,pointMode:"translate",controlPoints:[a(-7,0,0,1,1,1),a(-7,.9,0,.9,.9,.9),a(-6.85,1.8,0,1,1,1),a(-6.75,2.7,.1,1.3,1.3,1.3),a(-6.65,3.6,.15,1.6,1.6,1.6),a(-6.55,4.5,.2,2,2,2)],config:{baseRadius:.6,tubularSegments:64,radialSegments:32,capSegments:8,speed:1,weight:.3,noiseFreq:2,noiseAmp:.15,animated:!0,smokeLightColor:"#bcbcbc",smokeDarkColor:"#262626"}}],billboardSmoke:[{pos:[-3,0,0],config:{inverted:!1,width:1.5,height:6,color:"#b8b8b8",opacity:1,timeFrequency:.45,uvFrequencyX:1,uvFrequencyY:1.5,riseSpeed:.35,spreadStrength:.18}}],fireAndSmoke:[{pos:[-.5,0,-4.25],rot:[0,0,0],scale:[1,1,1],showHandles:!0,showSpline:!0,pointMode:"translate",controlPoints:B(),config:L()}]},attractors:[{position:[7,3.5,2],direction:[0,1,0],rotation:[0,0,0]},{position:[3,3.5,-2],direction:[0,1,0],rotation:[0,0,0]},{position:[6,-.5,0],direction:[0,1,0],rotation:[0,0,0]},{position:[4,2,1.5],direction:[0,1,0],rotation:[0,0,0]}]}},fe={...Q,...O,...A};export{fe as S,ue as a,me as b,le as c};
