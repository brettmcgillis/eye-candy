import{_ as Br}from"./extends-CF3RwP-h.js";import{r as o,m as Ze,n as Je,p,W as Q,bt as Ur,ba as Zt,K as pt,bu as Wt,ai as gt,q as ae,V as yt,H as Ar,c9 as Er,N as ht,y as Gt,x as pe,bh as Lr,ao as _r,aw as kr,b5 as Ir,a$ as Vr,j as Me,cl as Nr,d4 as jr,cm as Or}from"./index-B5HrS951.js";import{u as qr}from"./Fbo-Ch4Gqna9.js";import{u as Xr,a as Yr,b as Wr,c as Gr}from"./useMediaPipeHands-oPV_C20p.js";const Hr=e=>typeof e=="function",ka=o.forwardRef(({envMap:e,resolution:a=256,frames:r=1/0,children:s,makeDefault:n,...l},u)=>{const t=Ze(({set:f})=>f),d=Ze(({camera:f})=>f),i=Ze(({size:f})=>f),v=o.useRef(null);o.useImperativeHandle(u,()=>v.current,[]);const m=o.useRef(null),x=qr(a);o.useLayoutEffect(()=>{l.manual||v.current.updateProjectionMatrix()},[i,l]),o.useLayoutEffect(()=>{v.current.updateProjectionMatrix()}),o.useLayoutEffect(()=>{if(n){const f=d;return t(()=>({camera:v.current})),()=>t(()=>({camera:f}))}},[v,n,t]);let S=0,b=null;const w=Hr(s);return Je(f=>{w&&(r===1/0||S<r)&&(m.current.visible=!1,f.gl.setRenderTarget(x),b=f.scene.background,e&&(f.scene.background=e),f.gl.render(f.scene,v.current),f.scene.background=b,f.gl.setRenderTarget(null),m.current.visible=!0,S++)}),o.createElement(o.Fragment,null,o.createElement("orthographicCamera",Br({left:i.width/-2,right:i.width/2,top:i.height/2,bottom:i.height/-2,ref:v},l),!w&&s),o.createElement("group",{ref:m},w&&s(x.texture)))}),$r=350;function Ia({onPointerChange:e,onGestureBurst:a,size:r,mediaPipeConfig:s,handControlConfig:n,invertX:l,invertY:u,gesturesEnabled:t}){const d=o.useRef(new Map),i=o.useRef(0),v=Xr(s),m=Yr(v,n);return Wr(m,{onGestureStart:x=>{if(!t||x==="IDLE"||!a)return;const S=Date.now();S-i.current<$r||(i.current=S,a(x))}}),o.useEffect(()=>{const x=m?.hands||[];if(x.length===0){d.current.clear(),e(null);return}const S=Math.max(1,Math.floor(n.maxHands||1)),b=x.slice(0,S),w=new Map,f=[];for(let A=0;A<b.length;A+=1){const g=b[A];if(g?.position){const c=Gr(g.position,{xScale:n.xScale||4,yScale:n.yScale||3,mirrorX:!1,mirrorY:!0}),E=l?1-c.x:c.x,B=u?1-c.y:c.y,R=d.current.get(g.index),k=R?p.lerp(R.x,E,.35):E,G=R?p.lerp(R.y,B,.35):B;let J=R?k-R.x:0,N=R?G-R.y:0;r.width>r.height?J*=r.width/Math.max(1,r.height):N*=r.height/Math.max(1,r.width),f.push({x:k,y:G,vx:J,vy:N,down:!0}),w.set(g.index,{x:k,y:G})}}d.current=w,e(f.length>0?f:null)},[n.maxHands,n.xScale,n.yScale,m,l,u,e,r.height,r.width]),o.useEffect(()=>()=>{d.current.clear(),e(null)},[e]),null}function Ge(e,a,r){const s=new Q(e,a,r),n=new Q(e,a,r);return{read:s,write:n,swap(){const l=this.read;this.read=this.write,this.write=l}}}function Kr(e,a,r,s){const n=[],l=Math.max(1,Math.floor(r));let u=e,t=a;for(let d=0;d<l;d+=1)u=Math.max(2,Math.floor(u/2)),t=Math.max(2,Math.floor(t/2)),n.push(new Q(u,t,s));return n}function Zr(){const e=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],a=4,r=new Uint8Array(a*a*4);for(let n=0;n<e.length;n+=1){const l=Math.floor(e[n]/15*255),u=n*4;r[u]=l,r[u+1]=l,r[u+2]=l,r[u+3]=255}const s=new Ur(r,a,a,Zt);return s.minFilter=pt,s.magFilter=pt,s.wrapS=Wt,s.wrapT=Wt,s.needsUpdate=!0,s}function Qr(e,a){e.setRenderTarget(a),e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT)}function He(e,a){for(let r=0;r<a.length;r+=1)Qr(e,a[r]);e.setRenderTarget(null)}function Jr({gl:e,simWidth:a,simHeight:r,bloomWidth:s,bloomHeight:n,sunraysWidth:l,sunraysHeight:u,rtOptions:t,maxBloomChain:d}){const i=o.useMemo(()=>Ge(a,r,t),[r,a,t]),v=o.useMemo(()=>Ge(a,r,t),[r,a,t]),m=o.useMemo(()=>Ge(a,r,t),[r,a,t]),x=o.useMemo(()=>new Q(a,r,t),[r,a,t]),S=o.useMemo(()=>new Q(a,r,t),[r,a,t]),b=o.useMemo(()=>Ge(s,n,t),[n,s,t]),w=o.useMemo(()=>Kr(s,n,d,t),[n,s,d,t]),f=o.useMemo(()=>new Q(l,u,t),[t,u,l]),A=o.useMemo(()=>new Q(l,u,t),[t,u,l]),g=o.useMemo(()=>new Q(l,u,t),[t,u,l]),c=o.useCallback(()=>{He(e,[i.read,i.write,v.read,v.write,m.read,m.write,x,S])},[x,S,v.read,v.write,e,m.read,m.write,i.read,i.write]),E=o.useCallback(()=>{He(e,[b.read,b.write,...w,f,A,g])},[w,b.read,b.write,e,f,g,A]),B=o.useCallback(()=>{c(),E()},[E,c]);return o.useEffect(()=>(He(e,[i.read,i.write,v.read,v.write,m.read,m.write,x,S]),()=>{i.read.dispose(),i.write.dispose(),v.read.dispose(),v.write.dispose(),m.read.dispose(),m.write.dispose(),x.dispose(),S.dispose()}),[x,S,v,e,m,r,a,i]),o.useEffect(()=>(He(e,[b.read,b.write,...w,f,A,g]),()=>{b.read.dispose(),b.write.dispose(),w.forEach(R=>R.dispose()),f.dispose(),A.dispose(),g.dispose()}),[w,b,n,s,e,u,f,g,l,A]),{velocity:i,dye:v,pressureTex:m,curl:x,divergence:S,bloomComposite:b,bloomChain:w,sunraysMask:f,sunraysTex:A,sunraysTemp:g,clearAllTargets:B}}const zr=`
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 uTexel;

void main() {
  vUv = uv;
  vL = vUv - vec2(uTexel.x, 0.0);
  vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y);
  vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,ea=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,ta=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,ra=`
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;
uniform bool uManualFiltering;

vec4 bilerp(sampler2D sam, vec2 coord) {
  vec2 st = coord / uTexel - 0.5;
  vec2 iuv = floor(st);
  vec2 fuv = fract(st);

  vec2 aUv = (iuv + vec2(0.5, 0.5)) * uTexel;
  vec2 bUv = (iuv + vec2(1.5, 0.5)) * uTexel;
  vec2 cUv = (iuv + vec2(0.5, 1.5)) * uTexel;
  vec2 dUv = (iuv + vec2(1.5, 1.5)) * uTexel;

  vec4 a = texture2D(sam, aUv);
  vec4 b = texture2D(sam, bUv);
  vec4 c = texture2D(sam, cUv);
  vec4 d = texture2D(sam, dUv);

  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main() {
  vec2 coord;
  vec4 result;

  if (uManualFiltering) {
    coord = vUv - uDt * bilerp(uVelocity, vUv).xy * uTexel;
    result = bilerp(uSource, coord);
  } else {
    coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexel;
    result = texture2D(uSource, coord);
  }

  float decay = 1.0 + uDissipation * uDt;
  gl_FragColor = result / decay;
}
`,aa=`
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;

void main() {
  vec2 C = texture2D(uVelocity, vUv).xy;

  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float B = texture2D(uVelocity, vB).y;
  float T = texture2D(uVelocity, vT).y;

  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vB.y < 0.0) B = -C.y;
  if (vT.y > 1.0) T = -C.y;

  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`,oa=`
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uValue;

void main() {
  gl_FragColor = uValue * texture2D(uTexture, vUv);
}
`,na=`
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;

void main() {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float B = texture2D(uPressure, vB).x;
  float T = texture2D(uPressure, vT).x;
  float div = texture2D(uDivergence, vUv).x;

  float p = (L + R + B + T - div) * 0.25;
  gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
}
`,ua=`
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;

void main() {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float B = texture2D(uPressure, vB).x;
  float T = texture2D(uPressure, vT).x;

  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity -= vec2(R - L, T - B);

  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`,sa=`
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;

void main() {
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float B = texture2D(uVelocity, vB).x;
  float T = texture2D(uVelocity, vT).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
`,la=`
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurlTex;
uniform float uDt;
uniform float uCurl;

void main() {
  float L = texture2D(uCurlTex, vL).x;
  float R = texture2D(uCurlTex, vR).x;
  float B = texture2D(uCurlTex, vB).x;
  float T = texture2D(uCurlTex, vT).x;
  float C = texture2D(uCurlTex, vUv).x;

  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= uCurl * C;
  force.y *= -1.0;

  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity += force * uDt;
  velocity = clamp(velocity, vec2(-1000.0), vec2(1000.0));

  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`,ia=`
varying vec2 vUv;
uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform vec3 uColor;
uniform float uRadius;
uniform float uAspect;

void main() {
  vec3 base = texture2D(uTarget, vUv).xyz;
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 splat = exp(-dot(p, p) / max(uRadius, 0.00001)) * uColor;
  gl_FragColor = vec4(base + splat, 1.0);
}
`,ca=`
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec3 uCurve;
uniform float uThreshold;

void main() {
  vec3 c = texture2D(uTexture, vUv).rgb;
  float br = max(c.r, max(c.g, c.b));
  float rq = clamp(br - uCurve.x, 0.0, uCurve.y);
  rq = uCurve.z * rq * rq;
  c *= max(rq, br - uThreshold) / max(br, 0.0001);
  gl_FragColor = vec4(c, 1.0);
}
`,va=`
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uTexel;

void main() {
  vec4 sum = vec4(0.0);
  sum += texture2D(uTexture, vUv + vec2(uTexel.x, 0.0));
  sum += texture2D(uTexture, vUv - vec2(uTexel.x, 0.0));
  sum += texture2D(uTexture, vUv + vec2(0.0, uTexel.y));
  sum += texture2D(uTexture, vUv - vec2(0.0, uTexel.y));
  gl_FragColor = sum * 0.25;
}
`,da=`
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uTexel;
uniform float uIntensity;

void main() {
  vec4 sum = vec4(0.0);
  sum += texture2D(uTexture, vUv + vec2(uTexel.x, 0.0));
  sum += texture2D(uTexture, vUv - vec2(uTexel.x, 0.0));
  sum += texture2D(uTexture, vUv + vec2(0.0, uTexel.y));
  sum += texture2D(uTexture, vUv - vec2(0.0, uTexel.y));
  gl_FragColor = sum * 0.25 * uIntensity;
}
`,ma=`
varying vec2 vUv;
uniform sampler2D uBase;
uniform sampler2D uAdd;
uniform float uAddFactor;

void main() {
  vec3 base = texture2D(uBase, vUv).rgb;
  vec3 add = texture2D(uAdd, vUv).rgb;
  gl_FragColor = vec4(base + add * uAddFactor, 1.0);
}
`,fa=`
varying vec2 vUv;
uniform sampler2D uTexture;

void main() {
  vec4 c = texture2D(uTexture, vUv);
  float br = max(c.r, max(c.g, c.b));
  c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);
  gl_FragColor = c;
}
`,xa=`
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uWeight;

#define ITERATIONS 16

void main() {
  float Density = 0.3;
  float Decay = 0.95;
  float Exposure = 0.7;

  vec2 coord = vUv;
  vec2 dir = (vUv - 0.5) * (1.0 / float(ITERATIONS) * Density);

  float illuminationDecay = 1.0;
  float color = texture2D(uTexture, vUv).a;

  for (int i = 0; i < ITERATIONS; i++) {
    coord -= dir;
    float col = texture2D(uTexture, coord).a;
    color += col * illuminationDecay * uWeight;
    illuminationDecay *= Decay;
  }

  gl_FragColor = vec4(color * Exposure, 0.0, 0.0, 1.0);
}
`,ya=`
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uTexel;

void main() {
  float offset = 1.3333333;
  vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
  sum += texture2D(uTexture, vUv - uTexel * offset) * 0.35294117;
  sum += texture2D(uTexture, vUv + uTexel * offset) * 0.35294117;
  gl_FragColor = sum;
}
`,ha=`
varying vec2 vUv;
uniform sampler2D uDye;
uniform sampler2D uBloom;
uniform sampler2D uSunrays;
uniform sampler2D uDithering;
uniform vec2 uDyeTexel;
uniform vec2 uDitherScale;
uniform bool uDitheringEnabled;
uniform float uDitherStrength;
uniform vec3 uBgA;
uniform vec3 uBgB;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform bool uShading;
uniform bool uBloomEnabled;
uniform bool uSunraysEnabled;
uniform float uBlendMode;

vec3 linearToGamma(vec3 color) {
  color = max(color, vec3(0.0));
  return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0.0));
}

vec3 saturateColor(vec3 col, float amount) {
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(l), col, amount);
}

void main() {
  vec3 c = texture2D(uDye, vUv).rgb;

  if (uShading) {
    vec3 lc = texture2D(uDye, vUv - vec2(uDyeTexel.x, 0.0)).rgb;
    vec3 rc = texture2D(uDye, vUv + vec2(uDyeTexel.x, 0.0)).rgb;
    vec3 tc = texture2D(uDye, vUv + vec2(0.0, uDyeTexel.y)).rgb;
    vec3 bc = texture2D(uDye, vUv - vec2(0.0, uDyeTexel.y)).rgb;

    float dx = length(rc) - length(lc);
    float dy = length(tc) - length(bc);

    vec3 n = normalize(vec3(dx, dy, length(uDyeTexel)));
    vec3 l = vec3(0.0, 0.0, 1.0);
    float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
    c *= diffuse;
  }

  if (uSunraysEnabled) {
    float rays = texture2D(uSunrays, vUv).r;
    c *= rays;
  }

  if (uBloomEnabled) {
    vec3 bloom = texture2D(uBloom, vUv).rgb;
    float noise = texture2D(uDithering, vUv * uDitherScale).r * 2.0 - 1.0;
    bloom += noise * uDitherStrength / 255.0 * (uDitheringEnabled ? 1.0 : 0.0);
    bloom = linearToGamma(bloom);

    if (uSunraysEnabled) {
      bloom *= texture2D(uSunrays, vUv).r;
    }

    c += bloom;
  }

  vec3 bg = mix(uBgA, uBgB, smoothstep(0.0, 1.0, vUv.y));
  vec3 color;
  
  if (uBlendMode > 1.5) {
    color = max(bg - c, vec3(0.0));
  } else if (uBlendMode > 0.5) {
    vec3 ink = vec3(1.0) - c;
    color = bg * ink;
  } else {
    color = bg + c;
  }

  color = saturateColor(color, uSaturation);
  color = (color - 0.5) * uContrast + 0.5;
  color *= uBrightness;

  gl_FragColor = vec4(color, 1.0);
}
`;function ge(e,a){return new gt({vertexShader:zr,fragmentShader:e,uniforms:a,depthTest:!1,depthWrite:!1})}function W(e,a){return new gt({vertexShader:ea,fragmentShader:e,uniforms:a,depthTest:!1,depthWrite:!1})}const Va=0,pa=1,Na=2,ja=.28,Oa=8,ga=12,Qt=10,be=10,Sa=ga;function Ma(e,a,r,s,n,l){const u=s;u.material=n,e.setRenderTarget(l),e.render(a,r)}const ba=.15,Ta=16,$e=900,Se=32,Da={paused:!1,simResolution:1,pressureRelax:1,pressureIterations:40,vorticity:90,velocityDissipation:2,densityDissipation:2,splatRadius:.003,autoSplatRadius:.003,stationarySplatRadius:.003,randomSplatRadius:.003,splatForce:2200,dyeStrength:.92,autoSplat:!0,autoSplatStrength:.6,autoSplatDyeStrength:.92,autoSplatForce:2200,autoSplatRate:100,autoSplatBurst:2,autoSplatCount:2,stationarySplatsEnabled:!0,stationarySplatStrength:.35,stationarySplatDyeStrength:.92,stationarySplatForce:2200,randomSplatDyeStrength:.92,stationarySplatDirectionStrength:0,stationarySplatDirectionAngle:180,stationarySplatCount:8,stationaryDebugMarkersEnabled:!0,stationaryDebugMarkerCount:8,shading:!0,bloom:!0,bloomResolution:.25,bloomIterations:8,bloomIntensity:.65,bloomThreshold:.6,bloomSoftKnee:.7,sunrays:!0,sunraysResolution:.18,sunraysWeight:.85,colorA:"#ff6d6d",colorB:"#ff0000",colorC:"#7b0000",colorful:!0,colorUpdateSpeed:20,colorCycleSpeed:.55,dithering:!0,ditherStrength:1,ditherScale:1,bgA:"#4b4b4b",bgB:"#797979",brightness:1.37,contrast:1.2,saturation:1.33,blendMode:0,debugCursor:!0,debugAutoSplat:!0,debugStationarySplat:!0,debugRandomBurst:!0,debugPointerColor:"#ffffff",debugAutoColor:"#000000",debugStationaryColor:"#ffd166",debugRandomColor:"#7c3aed",debugPointerWidth:.03,debugPointerHeight:.03,debugAutoWidth:.03,debugAutoHeight:.03,debugStationaryWidth:.03,debugStationaryHeight:.03,debugRandomWidth:.03,debugRandomHeight:.03,debugPointerLineWeight:2,debugAutoLineWeight:2,debugStationaryLineWeight:2,debugRandomLineWeight:2,debugPointerFill:!1,debugAutoFill:!1,debugStationaryFill:!1,debugRandomFill:!1,debugPointerRotation:0,debugAutoRotation:0,debugStationaryRotation:0,debugStationarySplatColor:"#ffd166",debugStationarySplatWidth:.03,debugStationarySplatHeight:.03,debugStationarySplatLineWeight:2,debugStationarySplatFill:!1,debugStationarySplatRotation:0,debugStationaryMarkerColor:"#ffd166",debugStationaryMarkerWidth:.03,debugStationaryMarkerHeight:.03,debugStationaryMarkerLineWeight:2,debugStationaryMarkerFill:!1,debugStationaryMarkerRotation:0,debugRandomRotation:0,debugContactFadeDuration:.28},qa=o.forwardRef(({autoPointersRef:e,config:a,pointerRef:r,randomSplatsRef:s,stationaryPointersRef:n},l)=>{const{gl:u,size:t}=Ze(),d=o.useRef(null),i=r||d,v=o.useRef(!1),m=o.useRef([]),x=o.useRef([{x:.5,y:.5,ttl:0,phase:0}]),S=o.useRef([]),b=e||x,w=n||S,f=s||m,A=o.useRef(!1),g=o.useRef(null);!g.current&&t.width>1&&t.height>1&&(g.current={width:t.width,height:t.height});const c=o.useRef(new ae),E=o.useRef(new ae),B=o.useRef(new ae),R=o.useRef(new yt),k=o.useRef(new ae),G=o.useMemo(()=>({...Da,...a||{}}),[a]),{paused:J,simResolution:N,pressureRelax:Te,pressureIterations:oe,vorticity:z,velocityDissipation:ze,densityDissipation:De,splatRadius:ne,autoSplatRadius:ue,stationarySplatRadius:Re,randomSplatRadius:Ce,splatForce:se,dyeStrength:ke,autoSplat:Ie,autoSplatStrength:ee,autoSplatDyeStrength:Mt,autoSplatForce:et,autoSplatRate:nr,autoSplatBurst:ur,autoSplatCount:sr,stationarySplatsEnabled:lr,stationarySplatStrength:ir,stationarySplatDyeStrength:cr,stationarySplatForce:bt,randomSplatDyeStrength:vr,stationarySplatDirectionStrength:dr,stationarySplatDirectionAngle:mr,stationarySplatCount:fr,shading:Tt,bloom:tt,bloomResolution:Dt,bloomIterations:xr,bloomIntensity:Rt,bloomThreshold:Ve,bloomSoftKnee:yr,sunrays:rt,sunraysResolution:Ct,sunraysWeight:wt,colorA:Pt,colorB:hr,colorC:pr,colorful:Ft,colorUpdateSpeed:gr,colorCycleSpeed:Bt,dithering:Sr,ditherStrength:Mr,ditherScale:Ut,bgA:At,bgB:Et,brightness:Lt,contrast:_t,saturation:kt,blendMode:It}=G,at=Math.max(1,g.current?.width||t.width),ot=Math.max(1,g.current?.height||t.height),le=Math.max(64,Math.max(Se,Math.floor(at*N/Se)*Se)),ie=Math.max(64,Math.max(Se,Math.floor(ot*N/Se)*Se)),nt=Math.max(32,Math.floor(at*Dt)),ut=Math.max(32,Math.floor(ot*Dt)),st=Math.max(32,Math.floor(at*Ct)),lt=Math.max(32,Math.floor(ot*Ct)),Vt=u.capabilities.isWebGL2?Ar:Er,ce=u.capabilities.isWebGL2?pt:ht,br=o.useMemo(()=>({type:Vt,format:Zt,minFilter:ce,magFilter:ce,depthBuffer:!1,stencilBuffer:!1,wrapS:Gt,wrapT:Gt}),[ce,Vt]),C=o.useMemo(()=>new pe(1/le,1/ie),[le,ie]),Y=o.useMemo(()=>new pe(1/nt,1/ut),[nt,ut]),we=o.useMemo(()=>new pe(1/st,1/lt),[st,lt]),Ne=o.useMemo(()=>new Lr,[]),Tr=o.useMemo(()=>new _r(-1,1,1,-1,0,1),[]),ve=o.useMemo(()=>new kr(new Ir(2,2),new Vr({color:0})),[]),{velocity:L,dye:O,pressureTex:te,curl:Nt,divergence:jt,bloomComposite:H,bloomChain:Pe,sunraysMask:Ot,sunraysTex:je,sunraysTemp:qt,clearAllTargets:Dr}=Jr({gl:u,simWidth:le,simHeight:ie,bloomWidth:nt,bloomHeight:ut,sunraysWidth:st,sunraysHeight:lt,rtOptions:br,maxBloomChain:Ta}),I=o.useMemo(()=>ge(ra,{uVelocity:{value:null},uSource:{value:null},uTexel:{value:C.clone()},uDt:{value:.016},uDissipation:{value:De},uManualFiltering:{value:ce===ht}}),[ce,C]),Fe=o.useMemo(()=>ge(aa,{uVelocity:{value:null},uTexel:{value:C.clone()}}),[C]),Be=o.useMemo(()=>W(oa,{uTexture:{value:null},uValue:{value:Te}}),[C]),de=o.useMemo(()=>ge(na,{uPressure:{value:null},uDivergence:{value:null},uTexel:{value:C.clone()}}),[C]),Ue=o.useMemo(()=>ge(sa,{uVelocity:{value:null},uTexel:{value:C.clone()}}),[C]),Ae=o.useMemo(()=>ge(ua,{uPressure:{value:null},uVelocity:{value:null},uTexel:{value:C.clone()}}),[C]),$=o.useMemo(()=>ge(la,{uVelocity:{value:null},uCurlTex:{value:null},uTexel:{value:C.clone()},uDt:{value:.016},uCurl:{value:z}}),[C]),q=o.useMemo(()=>W(ia,{uTarget:{value:null},uPoint:{value:new pe(.5,.5)},uColor:{value:new yt(0,0,0)},uRadius:{value:ne},uAspect:{value:le/ie}}),[ie,le]),me=o.useMemo(()=>W(ca,{uTexture:{value:null},uCurve:{value:new yt(0,0,0)},uThreshold:{value:Ve}}),[Y]),fe=o.useMemo(()=>W(va,{uTexture:{value:null},uTexel:{value:Y.clone()}}),[Y]),re=o.useMemo(()=>W(da,{uTexture:{value:null},uTexel:{value:Y.clone()},uIntensity:{value:Rt}}),[Y]),xe=o.useMemo(()=>W(ma,{uBase:{value:null},uAdd:{value:null},uAddFactor:{value:1}}),[Y]),Oe=o.useMemo(()=>W(fa,{uTexture:{value:null}}),[we]),Ee=o.useMemo(()=>W(xa,{uTexture:{value:null},uWeight:{value:wt}}),[we]),K=o.useMemo(()=>W(ya,{uTexture:{value:null},uTexel:{value:new pe(1,0)}}),[we]),T=o.useMemo(()=>new gt({vertexShader:ta,fragmentShader:ha,uniforms:{uDye:{value:null},uBloom:{value:null},uSunrays:{value:null},uDithering:{value:null},uDyeTexel:{value:C.clone()},uDitherScale:{value:new pe(1,1)},uDitheringEnabled:{value:!0},uDitherStrength:{value:1},uBgA:{value:new ae(At)},uBgB:{value:new ae(Et)},uBrightness:{value:Lt},uContrast:{value:_t},uSaturation:{value:kt},uShading:{value:Tt},uBloomEnabled:{value:tt},uSunraysEnabled:{value:rt},uBlendMode:{value:0}},depthTest:!1,depthWrite:!1}),[C]),Le=o.useMemo(()=>Zr(),[]);return o.useEffect(()=>(Ne.add(ve),()=>{Ne.remove(ve)}),[ve,Ne]),o.useEffect(()=>()=>{ve.geometry.dispose(),Le.dispose(),I.dispose(),Be.dispose(),Ue.dispose(),Fe.dispose(),de.dispose(),Ae.dispose(),$.dispose(),q.dispose(),me.dispose(),fe.dispose(),re.dispose(),xe.dispose(),Oe.dispose(),Ee.dispose(),K.dispose(),T.dispose()},[I,fe,xe,re,me,K,Be,Ue,Fe,T,Le,Ae,de,ve.geometry,q,Oe,Ee,$]),o.useImperativeHandle(l,()=>({reset(){A.current=!0}})),Je((Rr,Cr)=>{const Xt=Math.min(.033,Cr),it=Rr.clock.elapsedTime;A.current&&(Dr(),A.current=!1);const U=(h,y)=>{Ma(u,Ne,Tr,ve,h,y)};c.current.set(Pt),E.current.set(hr),B.current.set(pr),I.uniforms.uTexel.value.copy(C),I.uniforms.uDt.value=Xt,I.uniforms.uManualFiltering.value=ce===ht,Fe.uniforms.uTexel.value.copy(C),Ue.uniforms.uTexel.value.copy(C),$.uniforms.uTexel.value.copy(C),$.uniforms.uDt.value=Xt,$.uniforms.uCurl.value=z,de.uniforms.uTexel.value.copy(C),Be.uniforms.uValue.value=Te,q.uniforms.uAspect.value=le/ie,me.uniforms.uThreshold.value=Ve,fe.uniforms.uTexel.value.copy(Y),re.uniforms.uTexel.value.copy(Y),re.uniforms.uIntensity.value=Rt,Ee.uniforms.uWeight.value=wt,T.uniforms.uDyeTexel.value.copy(C),T.uniforms.uDithering.value=Le,T.uniforms.uDitherScale.value.set(t.width/Le.image.width*(Ut||1),t.height/Le.image.height*(Ut||1)),T.uniforms.uDitherStrength.value=Mr||0,T.uniforms.uDitheringEnabled.value=!!Sr,T.uniforms.uBgA.value.set(At),T.uniforms.uBgB.value.set(Et),T.uniforms.uBrightness.value=Lt,T.uniforms.uContrast.value=_t,T.uniforms.uSaturation.value=kt,T.uniforms.uBlendMode.value=It,T.uniforms.uShading.value=Tt,T.uniforms.uBloomEnabled.value=tt,T.uniforms.uSunraysEnabled.value=rt;const _e=It===pa,qe=i.current;let ye=[];Array.isArray(qe)?ye=qe.filter(h=>h?.down):qe?.down&&(ye=[qe]);const wr=Math.max(0,Math.floor(fr||0)),ct=(w.current||[]).slice(0,wr),he=(h,y,F,M,D,V=1,j=ne,X={})=>{const{applyVelocity:Z=!0,applyDye:_=!0,dyeStrengthOverride:Ye=ke}=X,We=p.clamp(h,0,1),vt=p.clamp(y,0,1),dt=p.clamp(V,0,3),mt=p.clamp(j,1e-5,.1),ft=p.clamp(Ye,0,3);q.uniforms.uPoint.value.set(We,vt),q.uniforms.uRadius.value=mt,Z&&(q.uniforms.uTarget.value=L.read.texture,R.current.set(p.clamp(F,-$e,$e),p.clamp(M,-$e,$e),0),q.uniforms.uColor.value.copy(R.current),U(q,L.write),L.swap()),_&&(q.uniforms.uTarget.value=O.read.texture,R.current.set(p.clamp(D.r,0,1),p.clamp(D.g,0,1),p.clamp(D.b,0,1)).multiplyScalar(ft*dt*ba),q.uniforms.uColor.value.copy(R.current),U(q,O.write),O.swap())};if(ye.length>0){const h=Bt*Math.max(.001,gr),y=.5+.5*Math.sin(it*h),F=.5+.5*Math.sin(it*h*1.37+1.7);Ft&&(c.current.lerp(E.current,y),c.current.lerp(B.current,F*.45));let M=c.current;_e&&(M=c.current.clone().multiplyScalar(-1).addScalar(1)),!Ft&&_e&&(M=new ae(Pt).multiplyScalar(-1).addScalar(1));for(let D=0;D<ye.length;D+=1){const V=ye[D],j=Math.min(1,Math.hypot(V.vx||0,V.vy||0)*80),X=(V.vx||0)*se,Z=(V.vy||0)*se;he(V.x,V.y,X,Z,M,.65+j*.75,ne,{applyVelocity:!J,applyDye:!0})}}if(!J){if(I.uniforms.uVelocity.value=L.read.texture,I.uniforms.uSource.value=L.read.texture,I.uniforms.uDissipation.value=ze,U(I,L.write),L.swap(),Ue.uniforms.uVelocity.value=L.read.texture,U(Ue,Nt),$.uniforms.uVelocity.value=L.read.texture,$.uniforms.uCurlTex.value=Nt.texture,U($,L.write),L.swap(),ye.length===0&&!v.current&&(v.current=!0,he(.5,.5,0,0,c.current.set(.2,.4,.7),.35)),Ie){const h=Math.max(1,Math.floor(ur)),y=Math.max(1,Math.floor(sr||1));for(let F=0;F<y;F++){const M=b.current[F]||{},D=M.phase||0,V=Math.min(1,Math.hypot(M.vx||0,M.vy||0)*140);let j=(M.vx||0)*et*ee*1.4,X=(M.vy||0)*et*ee*1.4;if(nr>0){const _=et*ee*.0018;Math.hypot(j,X)<_&&(j+=Math.cos(D*1.9)*_,X+=Math.sin(D*1.9)*_)}k.current.set(Math.min(1,p.lerp(c.current.r,E.current.r,.5+.5*Math.sin(D*.61+F*.13))+.01),Math.min(1,p.lerp(E.current.g,B.current.g,.5+.5*Math.sin(D*.73+.7+F*.11))+.01),Math.min(1,p.lerp(B.current.b,c.current.b,.5+.5*Math.sin(D*.67+1.4+F*.09))+.01)).multiplyScalar(.75),_e&&k.current.multiplyScalar(-1).addScalar(1);const Z=(.12+V*.2)*ee*.75;he(M.x??.5,M.y??.5,j,X,k.current,Z,ue,{dyeStrengthOverride:Mt});for(let _=1;_<h;_++){const Ye=D+_*1.73,We=_/h,vt=(M.x||.5)-(M.vx||0),dt=(M.y||.5)-(M.vy||0),mt=p.lerp(vt,M.x||.5,We),ft=p.lerp(dt,M.y||.5,We),Yt=.006*(_/Math.max(1,h-1)),Pr=Math.sin(Ye*1.19)*Yt,Fr=Math.cos(Ye*1.47)*Yt,xt=Math.max(.12,1-_*.28);he(mt+Pr,ft+Fr,j*xt,X*xt,k.current,Z*xt*.55,ue,{dyeStrengthOverride:Mt})}}}if(lr&&ct.length>0){const h=p.clamp(dr,0,1),y=mr*Math.PI/180,F=Math.cos(y)*bt*h,M=Math.sin(y)*bt*h;for(let D=0;D<ct.length;D+=1){const V=ct[D]||{},j=it*(.7+Math.max(0,Bt||0)*.5);k.current.set(Math.min(1,p.lerp(c.current.r,E.current.r,.5+.5*Math.sin(j*.61+D*.13))+.01),Math.min(1,p.lerp(E.current.g,B.current.g,.5+.5*Math.sin(j*.73+.7+D*.11))+.01),Math.min(1,p.lerp(B.current.b,c.current.b,.5+.5*Math.sin(j*.67+1.4+D*.09))+.01)).multiplyScalar(.75),_e&&k.current.multiplyScalar(-1).addScalar(1);const X=V.x??.5,Z=V.y??.5,_=.12*ir*.75;he(X,Z,F,M,k.current,_,Re,{dyeStrengthOverride:cr})}}if(f.current.length>0){for(let h=0;h<f.current.length;h+=1){const y=f.current[h],F=c.current.clone().lerp(E.current,y.hueMix).lerp(B.current,y.colorMix);_e&&F.multiplyScalar(-1).addScalar(1),he(y.x,y.y,y.vx,y.vy,F,y.strength,Ce,{dyeStrengthOverride:vr})}f.current=[]}Fe.uniforms.uVelocity.value=L.read.texture,U(Fe,jt),Be.uniforms.uTexture.value=te.read.texture,U(Be,te.write),te.swap(),de.uniforms.uDivergence.value=jt.texture;for(let h=0;h<oe;h++)de.uniforms.uPressure.value=te.read.texture,U(de,te.write),te.swap();Ae.uniforms.uPressure.value=te.read.texture,Ae.uniforms.uVelocity.value=L.read.texture,U(Ae,L.write),L.swap(),I.uniforms.uVelocity.value=L.read.texture,I.uniforms.uSource.value=O.read.texture,I.uniforms.uDissipation.value=De,U(I,O.write),O.swap()}const Xe=Math.min(Pe.length,Math.max(1,Math.floor(xr)));if(tt&&Xe>0){const h=Ve*yr+1e-4;me.uniforms.uCurve.value.set(Ve-h,h*2,.25/h),me.uniforms.uTexture.value=O.read.texture,U(me,Pe[0]);for(let y=1;y<Xe;y++){const F=Pe[y-1],M=Pe[y];fe.uniforms.uTexel.value.set(1/F.width,1/F.height),fe.uniforms.uTexture.value=F.texture,U(fe,M)}u.setRenderTarget(H.read),u.clearColor(0,0,0,1),u.clear(u.COLOR_BUFFER_BIT);for(let y=Xe-1;y>=0;y--)xe.uniforms.uBase.value=H.read.texture,xe.uniforms.uAdd.value=Pe[y].texture,xe.uniforms.uAddFactor.value=.82**(Xe-1-y),U(xe,H.write),H.swap();re.uniforms.uTexel.value.copy(Y),re.uniforms.uTexture.value=H.read.texture,U(re,H.write),H.swap(),T.uniforms.uBloom.value=H.read.texture}else T.uniforms.uBloom.value=O.read.texture;rt?(Oe.uniforms.uTexture.value=O.read.texture,U(Oe,Ot),Ee.uniforms.uTexture.value=Ot.texture,U(Ee,je),K.uniforms.uTexture.value=je.texture,K.uniforms.uTexel.value.set(we.x,0),U(K,qt),K.uniforms.uTexture.value=qt.texture,K.uniforms.uTexel.value.set(0,we.y),U(K,je),T.uniforms.uSunrays.value=je.texture):T.uniforms.uSunrays.value=O.read.texture,T.uniforms.uDye.value=O.read.texture,u.setRenderTarget(null)}),Me.jsx("primitive",{object:T,attach:"material"})});function Ht(){return{initialized:!1,x:.5,y:.5,vx:0,vy:0,phase:Math.random()*Math.PI*4,seed:Math.random()*Math.PI*2,ttl:0,jitterOffset:{x:(Math.random()-.5)*.12,y:(Math.random()-.5)*.12},freqMul:{a:.85+Math.random()*.5,b:.7+Math.random()*.6,c:.8+Math.random()*.6},ampMul:1+(Math.random()-.5)*.6,pathSpeedMul:.6+Math.random()*1.4}}function Qe(e,a=.5){return Number.isFinite(e)?Math.max(0,Math.min(1,e)):a}function Ra(e,a,r={},s={x:.5,y:.5}){const n=r.freqMul&&r.freqMul.a||.97,l=r.freqMul&&r.freqMul.b||.41,u=r.freqMul&&r.freqMul.c||1.81,t=(r.ampMul||1)*Math.max(0,a||1),d=Qe(s?.x),i=Qe(s?.y),v=d+Math.sin(e*n)*.26*t+Math.sin(e*l+1.4)*.13*t+Math.sin(e*u+.3)*.05*t,m=i+Math.cos(e*(1.13*n))*.24*t+Math.cos(e*(.53*l)+2)*.12*t+Math.cos(e*(1.47*u)+.9)*.05*t,x=r.jitterOffset&&r.jitterOffset.x||0,S=r.jitterOffset&&r.jitterOffset.y||0;return{x:p.clamp(v+x,.05,.95),y:p.clamp(m+S,.05,.95)}}function Xa({config:e,size:a}){const r=o.useRef([Ht()]),s=o.useMemo(()=>.01,[]);return Je((n,l)=>{const u=Math.min(.033,l),{paused:t,autoSplat:d,autoSplatRate:i,autoSplatRange:v,autoSplatCount:m,autoSplatStarts:x,colorCycleSpeed:S,debugContactFadeDuration:b}=e,w=Math.max(1,Math.floor(m||1));for(;r.current.length<w;)r.current.push(Ht());const f=.95*(.7+Math.max(0,S)*.5),A=Math.max(0,i)/100;for(let g=0;g<r.current.length;g+=1){const c=r.current[g];if(c){const E=x?.[g]||{x:.5,y:.5},B=Qe(E?.x),R=Qe(E?.y),k=c.startX!==B||c.startY!==R;let G=!1;if(k&&(c.startX=B,c.startY=R,c.initialized=!0,c.x=B,c.y=R,c.vx=0,c.vy=0,d&&g<w&&(c.ttl=Math.max(0,b)),G=!0),!G)if(t)c.vx=0,c.vy=0,d&&g<w&&(c.ttl=Math.max(0,b));else{c.ttl=Math.max(0,(c.ttl||0)-u),typeof c.phase!="number"&&(c.phase=Math.random()*Math.PI*4),c.phase+=u*f*(c.pathSpeedMul||1)*A;const J=c.phase+(c.seed||0),N=Ra(J,v,c,{x:B,y:R});c.initialized||(c.initialized=!0,c.x=B,c.y=R);const Te=i,oe=c.x,z=c.y;if(Te<=0||oe===N.x&&z===N.y)c.vx=0,c.vy=0;else{const ze=Te*s,De=N.x-oe,ne=N.y-z,ue=Math.hypot(De,ne);if(ue<1e-6)c.vx=0,c.vy=0;else{const Re=ze*u;let Ce=N.x,se=N.y;if(ue>Re){const ee=1/ue;Ce=oe+De*ee*Re,se=z+ne*ee*Re}let ke=Ce-oe,Ie=se-z;a.width>a.height?ke*=a.width/Math.max(1,a.height):Ie*=a.height/Math.max(1,a.width),c.x=Ce,c.y=se,c.vx=ke,c.vy=Ie}}d&&g<w&&(c.ttl=Math.max(0,b))}}}}),r}function Ya(e){const a=o.useMemo(()=>({maxHands:e.handsMaxHands||1,modelComplexity:e.handsModelComplexity||1,minDetectionConfidence:e.handsMinDetectionConfidence||.6,minTrackingConfidence:e.handsMinTrackingConfidence||.6,showVideo:!!e.handsShowVideo,showDebugSkeleton:!!e.handsShowDebugSkeleton,landmarkStyle:{color:e.handsLandmarkColor||"#ff0000",radius:e.handsLandmarkRadius||4},connectorStyle:{color:e.handsConnectorColor||"#000000",lineWidth:e.handsConnectorLineWidth||3}}),[e.handsConnectorColor,e.handsConnectorLineWidth,e.handsLandmarkColor,e.handsLandmarkRadius,e.handsMaxHands,e.handsMinDetectionConfidence,e.handsMinTrackingConfidence,e.handsModelComplexity,e.handsShowDebugSkeleton,e.handsShowVideo]),r=o.useMemo(()=>({maxHands:e.handsMaxHands||1,xScale:e.handsXScale||4,yScale:e.handsYScale||3,zScale:e.handsZScale||5}),[e.handsMaxHands,e.handsXScale,e.handsYScale,e.handsZScale]);return{mediaPipeConfig:a,handControlConfig:r}}function Wa({size:e}){const a=o.useRef(null),r=o.useRef(null),s=o.useRef(!1),n=o.useCallback(t=>{if(!t.uv||!s.current)return;const{x:d,y:i}=t.uv,v=r.current;let m=v?d-v.x:0,x=v?i-v.y:0;e.width>e.height?m*=e.width/Math.max(1,e.height):x*=e.height/Math.max(1,e.width);const S={x:d,y:i,vx:m,vy:x,down:!0};r.current=S,a.current=S},[e.height,e.width]),l=o.useCallback(()=>{s.current=!1,r.current=null,a.current=null},[]),u=o.useMemo(()=>({onPointerDown:t=>{t.stopPropagation(),s.current=!0,t.target.setPointerCapture(t.pointerId),n(t)},onPointerMove:t=>{t.stopPropagation(),n(t)},onPointerUp:t=>{t.stopPropagation(),t.target.releasePointerCapture&&t.target.releasePointerCapture(t.pointerId),l()},onPointerCancel:t=>{t.stopPropagation(),t.target.releasePointerCapture&&t.target.releasePointerCapture(t.pointerId),l()},onPointerLeave:t=>{t.stopPropagation(),t.pointerType==="mouse"&&l()}}),[l,n]);return{pointerRef:a,pointerEvents:u}}function Ga({config:e,randomSplatQueueRef:a}){const r=o.useRef([]),s=a;return Je(()=>{if(r.current=[],!s||s.current<=0)return;const n=Math.min(s.current,Sa);s.current-=n;const l=Math.max(0,e?.randomSplatStrength??1),u=Math.max(0,e?.randomSplatForce??e?.splatForce??2200);for(let t=0;t<n;t+=1)r.current.push({x:Math.random(),y:Math.random(),vx:(Math.random()*2-1)*u*.08*l,vy:(Math.random()*2-1)*u*.08*l,hueMix:Math.random(),colorMix:Math.random()*.5,strength:(.5+Math.random()*.8)*l})}),r}function $t(e,a=.5){return Number.isFinite(e)?p.clamp(e,0,1):a}function Ke(e,a){return{id:a,x:$t(e?.x),y:$t(e?.y)}}function Kt(){return{x:.1+Math.random()*.8,y:.1+Math.random()*.8}}function Jt(e){return Array.isArray(e?.stationarySplats)?e.stationarySplats:[]}function Ca(e){return Array.isArray(e?.stationaryDebugMarkers)?e.stationaryDebugMarkers:Jt(e)}function Ha({config:e,pointerEvents:a}){const r=o.useRef([]),s=o.useRef([]),n=o.useRef(0),l=o.useRef(0);return o.useEffect(()=>{const u=p.clamp(Math.max(0,Math.floor(e?.stationarySplatCount||0)),0,be),t=Jt(e),d=r.current.slice(0,u);for(;d.length<u;){const i=`stationary-${n.current}`;n.current+=1;const m=t[d.length]||Kt();d.push(Ke(m,i))}for(let i=0;i<d.length;i+=1)t[i]&&(d[i]=Ke(t[i],d[i].id));r.current=d},[e?.stationarySplatCount,e?.stationarySplats]),o.useEffect(()=>{const u=Ca(e),t=Math.max(0,Math.floor(e?.stationarySplatCount||0)),d=p.clamp(Math.max(0,Math.floor(e?.stationaryDebugMarkerCount??t)),0,be),i=s.current.slice(0,d);for(;i.length<d;){const v=`stationary-debug-${l.current}`;l.current+=1;const x=u[i.length]||Kt();i.push(Ke(x,v))}for(let v=0;v<i.length;v+=1)u[v]&&(i[v]=Ke(u[v],i[v].id));s.current=i},[e?.stationaryDebugMarkerCount,e?.stationaryDebugMarkers,e?.stationarySplatCount,e?.stationarySplats]),{stationaryPointersRef:r,stationaryDebugMarkersRef:s,pointerEvents:a||{}}}function wa(e,a,r){const s=e*.5,n=a*.5,l=Math.max(0,s-r),u=Math.max(0,n-r),t=new Nr;if(t.moveTo(-s,-n),t.lineTo(s,-n),t.lineTo(s,n),t.lineTo(-s,n),t.closePath(),l>0&&u>0){const d=new jr;d.moveTo(-l,-u),d.lineTo(l,-u),d.lineTo(l,u),d.lineTo(-l,u),d.closePath(),t.holes.push(d)}return new Or(t)}const $a=o.forwardRef(function({position:a,size:r,width:s,height:n,color:l,extraRotation:u=0},t){const d=s??r,i=n??r;return Me.jsxs("mesh",{ref:t,position:a,"rotation-z":u,children:[Me.jsx("planeGeometry",{args:[d,i]}),Me.jsx("meshBasicMaterial",{color:l})]})}),Ka=o.forwardRef(function({position:a,size:r,width:s,height:n,color:l,lineThickness:u,extraRotation:t=0},d){const i=s??r,v=n??r,m=u??Math.min(i,v)*.15,x=o.useMemo(()=>wa(i,v,m),[i,v,m]);return o.useEffect(()=>()=>x.dispose(),[x]),Me.jsx("mesh",{ref:d,position:a,"rotation-z":t,geometry:x,children:Me.jsx("meshBasicMaterial",{color:l})})});function P(e,a=.5){return Number.isFinite(e)?Math.max(0,Math.min(1,e)):a}function zt(e){return Number.isFinite(e)?Math.max(0,Math.min(be,Math.floor(e))):0}function er(e){return Number.isFinite(e)?Math.max(0,Math.min(be,Math.floor(e))):0}function tr(e){return Number.isFinite(e)?Math.max(1,Math.min(Qt,Math.floor(e))):1}function Pa(){return{x:.1+Math.random()*.8,y:.1+Math.random()*.8}}function St(e,a,r=Pa){const s=[];for(let n=0;n<a;n+=1){const l=e?.[n];s.push(l?{x:P(l.x),y:P(l.y)}:r())}return s}function Fa(e){const a=tr(e?.autoSplatCount??e?.autoSplatStarts?.length);return St(e?.autoSplatStarts,a)}function Ba(e){const a=zt(e?.stationarySplatCount??e?.stationarySplats?.length);return St(e?.stationarySplats,a)}function Ua(e){const a=er(e?.stationaryDebugMarkerCount??e?.stationaryDebugMarkers?.length??e?.stationarySplatCount??e?.stationarySplats?.length),r=e?.stationaryDebugMarkers??e?.stationarySplats;return St(r,a)}function rr(e){return`autoSplat${e+1}StartPos`}function ar(e){return`stationarySplat${e+1}Pos`}function or(e){return`stationaryDebugMarker${e+1}Pos`}function Za(e,a,r){const s={};for(let n=0;n<Qt;n+=1){const l=e[n]||{x:.5,y:.5};s[rr(n)]={label:`A${n+1} Pos`,value:{x:P(l.x),y:P(l.y)},min:0,max:1,step:.001,render:u=>{const t=tr(u(`${r}.Interaction.AutoSplats.autoSplatCount`));return n<t},onChange:u=>{a(t=>{if(!t[n])return t;const d=P(u?.x),i=P(u?.y);if(t[n].x===d&&t[n].y===i)return t;const v=[...t];return v[n]={x:d,y:i},v})}}}return s}function Qa(e,a,r){const s={};for(let n=0;n<be;n+=1){const l=e[n]||{x:.5,y:.5};s[ar(n)]={label:`S${n+1} Pos`,value:{x:P(l.x),y:P(l.y)},min:0,max:1,step:.001,render:u=>{const t=zt(u(`${r}.Interaction.StationarySplats.stationarySplatCount`));return n<t},onChange:u=>{a(t=>{if(!t[n])return t;const d=P(u?.x),i=P(u?.y);if(t[n].x===d&&t[n].y===i)return t;const v=[...t];return v[n]={x:d,y:i},v})}}}return s}function Ja(e,a,r){const s={};for(let n=0;n<be;n+=1){const l=e[n]||{x:.5,y:.5};s[or(n)]={label:`M${n+1} Pos`,value:{x:P(l.x),y:P(l.y)},min:0,max:1,step:.001,render:u=>{const t=er(u(`${r}.Interaction.StationaryMarkers.stationaryDebugMarkerCount`));return n<t},onChange:u=>{a(t=>{if(!t[n])return t;const d=P(u?.x),i=P(u?.y);if(t[n].x===d&&t[n].y===i)return t;const v=[...t];return v[n]={x:d,y:i},v})}}}return s}function za(e,a,r,s){e(Fa(s)),a(Ba(s)),r(Ua(s))}function eo(e){return e.reduce((a,r,s)=>(a[rr(s)]={x:P(r?.x),y:P(r?.y)},a),{})}function to(e){return e.reduce((a,r,s)=>(a[ar(s)]={x:P(r?.x),y:P(r?.y)},a),{})}function ro(e){return e.reduce((a,r,s)=>(a[or(s)]={x:P(r?.x),y:P(r?.y)},a),{})}export{$a as A,Va as B,Ka as C,Oa as D,Ia as F,Sa as M,ka as O,Ba as a,Ua as b,tr as c,zt as d,er as e,eo as f,Fa as g,to as h,ro as i,Na as j,pa as k,Ja as l,Qa as m,za as n,Za as o,ga as p,Ga as q,Pa as r,Wa as s,Ha as t,Xa as u,Ya as v,ja as w,P as x,qa as y,wa as z};
