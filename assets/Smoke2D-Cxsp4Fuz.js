import{bf as g,j as r,az as h,aa as s,a9 as S,ab as w,r as i,bp as b,ac as F}from"./index-B8ahIfg7.js";import{s as U}from"./shaderMaterial-CKxwg-iH.js";import{B as M}from"./Billboard-D78JtdGk.js";const l=`
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
`,u=`
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
`,P=`
  uniform float uTime;
  uniform float uRiseSpeed;
  uniform float uSpreadStrength;
  uniform float uScrollDir;

  varying vec2 vUv;

  ${l}
  ${u}

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
`,R=`
  uniform float uTime;
  uniform float uTimeFrequency;
  uniform vec2  uUvFrequency;
  uniform vec3  uColor;
  uniform float uOpacity;
  uniform float uScrollDir;

  varying vec2 vUv;

  ${l}
  ${u}

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
`,_=U({uTime:0,uTimeFrequency:.45,uUvFrequency:new S(3,5),uColor:new s("#b8b8b8"),uOpacity:.6,uRiseSpeed:.35,uSpreadStrength:.18,uScrollDir:1},P,R);w({SmokeMaterialImpl:_});const q=g.forwardRef(function({side:o=h},a){return r.jsx("smokeMaterialImpl",{ref:a,transparent:!0,side:o,depthWrite:!1,toneMapped:!1})}),T={timeFrequency:.45,uvFrequencyX:1,uvFrequencyY:1.5,riseSpeed:.35,spreadStrength:.18,opacity:.6,color:"#b8b8b8",width:.25,height:3};function E({position:c=[0,0,0],inverted:o=!1,smoke:a,visible:v=!0}){const e={...T,...a},n=i.useRef(),f=i.useMemo(()=>new s(e.color),[e.color]),m=i.useMemo(()=>new b(e.width,e.height,2,32),[e.width,e.height]),d=1;if(F(({clock:x})=>{const t=n.current;t&&(t.uTime=x.getElapsedTime(),t.uTimeFrequency=e.timeFrequency,t.uUvFrequency.set(e.uvFrequencyX,e.uvFrequencyY),t.uColor.copy(f),t.uOpacity=e.opacity,t.uRiseSpeed=e.riseSpeed,t.uSpreadStrength=e.spreadStrength,t.uScrollDir=d)}),!v)return null;const p=o?-(e.height/2):e.height/2,y=o?[1,-1,1]:[1,1,1];return r.jsx(M,{position:c,follow:!0,lockX:!1,lockY:!1,lockZ:!1,children:r.jsx("mesh",{position:[0,p,0],scale:y,geometry:m,children:r.jsx(q,{ref:n})})})}export{E as S};
