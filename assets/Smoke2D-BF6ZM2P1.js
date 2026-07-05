import{aT as B,j as d,ag as k,q as w,x as C,o as I,r as v,b5 as D,n as P,bg as N,m as W}from"./index-DUAUQe-S.js";import{s as $}from"./shaderMaterial-DUK87QCW.js";import{B as T}from"./Billboard-BVGbhIoX.js";import{u as m,k as K,v as a,$ as U,a8 as Z,s as S,f as F,d as H,a as J,F as b,W as Q,g as R,m as ee,T as te,a7 as oe}from"./three.tsl-kCgjn367.js";const V=`
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
`,_=`
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
`,re=`
  uniform float uTime;
  uniform float uRiseSpeed;
  uniform float uSpreadStrength;
  uniform float uScrollDir;

  varying vec2 vUv;

  ${V}
  ${_}

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
`,ae=`
  uniform float uTime;
  uniform float uTimeFrequency;
  uniform vec2  uUvFrequency;
  uniform vec3  uColor;
  uniform float uOpacity;
  uniform float uScrollDir;

  varying vec2 vUv;

  ${V}
  ${_}

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
`,se=$({uTime:0,uTimeFrequency:.45,uUvFrequency:new C(3,5),uColor:new w("#b8b8b8"),uOpacity:.6,uRiseSpeed:.35,uSpreadStrength:.18,uScrollDir:1},re,ae);I({SmokeMaterialImpl:se});const ne=B.forwardRef(function({side:o=k},r){return d.jsx("smokeMaterialImpl",{ref:r,transparent:!0,side:o,depthWrite:!1,toneMapped:!1})}),ce={timeFrequency:.45,uvFrequencyX:1,uvFrequencyY:1.5,riseSpeed:.35,spreadStrength:.18,opacity:.6,color:"#b8b8b8",width:.25,height:3};function ie({position:s=[0,0,0],inverted:o=!1,smoke:r,visible:i=!0}){const e={...ce,...r},l=v.useRef(),p=v.useMemo(()=>new w(e.color),[e.color]),t=v.useMemo(()=>new D(e.width,e.height,2,32),[e.width,e.height]),u=1;if(P(({clock:n})=>{const c=l.current;c&&(c.uTime=n.getElapsedTime(),c.uTimeFrequency=e.timeFrequency,c.uUvFrequency.set(e.uvFrequencyX,e.uvFrequencyY),c.uColor.copy(p),c.uOpacity=e.opacity,c.uRiseSpeed=e.riseSpeed,c.uSpreadStrength=e.spreadStrength,c.uScrollDir=u)}),!i)return null;const x=o?-(e.height/2):e.height/2,h=o?[1,-1,1]:[1,1,1];return d.jsx(T,{position:s,follow:!0,lockX:!1,lockY:!1,lockZ:!1,children:d.jsx("mesh",{position:[0,x,0],scale:h,geometry:t,children:d.jsx(ne,{ref:l})})})}const ue={timeFrequency:.45,uvFrequencyX:1,uvFrequencyY:1.5,riseSpeed:.35,spreadStrength:.18,opacity:.6,color:"#b8b8b8",width:.25,height:3},g=b(([s])=>{const o=a(s).toVar();return R(te(oe(o,a(12.9898,78.233))).mul(43758.5453123))}).setLayout({name:"smokeRandom2",type:"float",inputs:[{name:"stInput",type:"vec2"}]}),f=b(([s])=>{const o=a(s).toVar(),r=Q(o).toVar(),i=R(o).toVar(),e=g(r).toVar(),l=g(r.add(a(1,0))).toVar(),p=g(r.add(a(0,1))).toVar(),t=g(r.add(a(1,1))).toVar(),u=i.mul(i).mul(a(3,3).sub(i.mul(2))).toVar();return ee(e,l,u.x).add(p.sub(e).mul(u.y).mul(F(1).sub(u.x))).add(t.sub(l).mul(u.x).mul(u.y))}).setLayout({name:"smokeNoise2",type:"float",inputs:[{name:"stInput",type:"vec2"}]}),M=b(([s])=>{const o=a(s).toVar(),r=o.mul(2.08).add(a(5.2,1.3)).toVar(),i=r.mul(2.08).add(a(1.7,9.2)).toVar(),e=i.mul(2.08).add(a(8.3,2.8)).toVar();return f(o).mul(.55).add(f(r).mul(.264)).add(f(i).mul(.127)).add(f(e).mul(.061))}).setLayout({name:"smokeFbm2",type:"float",inputs:[{name:"pInput",type:"vec2"}]});function le({position:s=[0,0,0],inverted:o=!1,smoke:r,visible:i=!0}){const e={...ue,...r},l=v.useMemo(()=>new D(e.width,e.height,2,32),[e.width,e.height]),p=1,t=v.useMemo(()=>({time:m(0),timeFrequency:m(e.timeFrequency),uvFrequencyX:m(e.uvFrequencyX),uvFrequencyY:m(e.uvFrequencyY),color:m(new w(e.color)),opacity:m(e.opacity),riseSpeed:m(e.riseSpeed),spreadStrength:m(e.spreadStrength),scrollDir:m(p)}),[]);v.useEffect(()=>{t.timeFrequency.value=e.timeFrequency,t.uvFrequencyX.value=e.uvFrequencyX,t.uvFrequencyY.value=e.uvFrequencyY,t.color.value.set(e.color),t.opacity.value=e.opacity,t.riseSpeed.value=e.riseSpeed,t.spreadStrength.value=e.spreadStrength,t.scrollDir.value=p},[e,p,t]);const u=v.useMemo(()=>{const n=K(),c=Z,q=a(n.x.mul(4),n.y.mul(4).sub(t.time.mul(t.riseSpeed).mul(t.scrollDir))),j=U(n.y.mul(2.8),2),E=M(q),z=f(q.mul(2.1).add(a(4.7,0))),Y=c.x.add(E.add(z.mul(.3)).mul(j).mul(t.spreadStrength)),X=a(n.x.mul(t.uvFrequencyX),n.y.mul(t.uvFrequencyY).sub(t.time.mul(t.timeFrequency).mul(t.scrollDir))),O=S(0,.22,n.x).mul(F(1).sub(S(.78,1,n.x))),G=U(F(1).sub(n.y),.65),L=S(0,.1,n.y),A=H(M(X).mul(O).mul(G).mul(L).mul(t.opacity),0,1),y=new N({transparent:!0,depthWrite:!1,toneMapped:!1,side:k});return y.positionNode=J(Y,c.y,c.z),y.colorNode=t.color,y.opacityNode=A,y},[t]);if(v.useEffect(()=>()=>{l.dispose(),u.dispose()},[l,u]),P(({clock:n})=>{t.time.value=n.getElapsedTime()}),!i)return null;const x=o?-(e.height/2):e.height/2,h=o?[1,-1,1]:[1,1,1];return d.jsx(T,{position:s,follow:!0,lockX:!1,lockY:!1,lockZ:!1,children:d.jsx("mesh",{position:[0,x,0],scale:h,geometry:l,children:d.jsx("primitive",{object:u,attach:"material"})})})}function fe(s){return W(i=>i.gl)?.isWebGPURenderer===!0?d.jsx(le,{...s}):d.jsx(ie,{...s})}export{fe as S};
