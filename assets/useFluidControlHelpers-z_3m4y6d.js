import{r as n,p as h,W as Q,bx as Fr,ba as Kt,K as yt,by as Yt,ac as ht,m as Br,q as ae,V as ft,H as Ur,bF as Ar,N as xt,y as Wt,x as pe,bi as Lr,ai as Er,av as _r,b4 as kr,a_ as Vr,n as pt,j as Me,cm as Ir,d7 as Nr,cn as jr}from"./index-CRhP28aw.js";import{u as Or,a as qr,b as Xr,c as Yr}from"./useMediaPipeHands-BI2IQ3Ml.js";const Wr=350;function Ua({onPointerChange:e,onGestureBurst:a,size:r,mediaPipeConfig:s,handControlConfig:o,invertX:l,invertY:u,gesturesEnabled:t}){const v=n.useRef(new Map),c=n.useRef(0),d=Or(s),m=qr(d,o);return Xr(m,{onGestureStart:x=>{if(!t||x==="IDLE"||!a)return;const D=Date.now();D-c.current<Wr||(c.current=D,a(x))}}),n.useEffect(()=>{const x=m?.hands||[];if(x.length===0){v.current.clear(),e(null);return}const D=Math.max(1,Math.floor(o.maxHands||1)),C=x.slice(0,D),U=new Map,B=[];for(let A=0;A<C.length;A+=1){const p=C[A];if(p?.position){const i=Yr(p.position,{xScale:o.xScale||4,yScale:o.yScale||3,mirrorX:!1,mirrorY:!0}),L=l?1-i.x:i.x,P=u?1-i.y:i.y,T=v.current.get(p.index),k=T?h.lerp(T.x,L,.35):L,G=T?h.lerp(T.y,P,.35):P;let J=T?k-T.x:0,N=T?G-T.y:0;r.width>r.height?J*=r.width/Math.max(1,r.height):N*=r.height/Math.max(1,r.width),B.push({x:k,y:G,vx:J,vy:N,down:!0}),U.set(p.index,{x:k,y:G})}}v.current=U,e(B.length>0?B:null)},[o.maxHands,o.xScale,o.yScale,m,l,u,e,r.height,r.width]),n.useEffect(()=>()=>{v.current.clear(),e(null)},[e]),null}function Ge(e,a,r){const s=new Q(e,a,r),o=new Q(e,a,r);return{read:s,write:o,swap(){const l=this.read;this.read=this.write,this.write=l}}}function Gr(e,a,r,s){const o=[],l=Math.max(1,Math.floor(r));let u=e,t=a;for(let v=0;v<l;v+=1)u=Math.max(2,Math.floor(u/2)),t=Math.max(2,Math.floor(t/2)),o.push(new Q(u,t,s));return o}function Hr(){const e=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],a=4,r=new Uint8Array(a*a*4);for(let o=0;o<e.length;o+=1){const l=Math.floor(e[o]/15*255),u=o*4;r[u]=l,r[u+1]=l,r[u+2]=l,r[u+3]=255}const s=new Fr(r,a,a,Kt);return s.minFilter=yt,s.magFilter=yt,s.wrapS=Yt,s.wrapT=Yt,s.needsUpdate=!0,s}function $r(e,a){e.setRenderTarget(a),e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT)}function He(e,a){for(let r=0;r<a.length;r+=1)$r(e,a[r]);e.setRenderTarget(null)}function Kr({gl:e,simWidth:a,simHeight:r,bloomWidth:s,bloomHeight:o,sunraysWidth:l,sunraysHeight:u,rtOptions:t,maxBloomChain:v}){const c=n.useMemo(()=>Ge(a,r,t),[r,a,t]),d=n.useMemo(()=>Ge(a,r,t),[r,a,t]),m=n.useMemo(()=>Ge(a,r,t),[r,a,t]),x=n.useMemo(()=>new Q(a,r,t),[r,a,t]),D=n.useMemo(()=>new Q(a,r,t),[r,a,t]),C=n.useMemo(()=>Ge(s,o,t),[o,s,t]),U=n.useMemo(()=>Gr(s,o,v,t),[o,s,v,t]),B=n.useMemo(()=>new Q(l,u,t),[t,u,l]),A=n.useMemo(()=>new Q(l,u,t),[t,u,l]),p=n.useMemo(()=>new Q(l,u,t),[t,u,l]),i=n.useCallback(()=>{He(e,[c.read,c.write,d.read,d.write,m.read,m.write,x,D])},[x,D,d.read,d.write,e,m.read,m.write,c.read,c.write]),L=n.useCallback(()=>{He(e,[C.read,C.write,...U,B,A,p])},[U,C.read,C.write,e,B,p,A]),P=n.useCallback(()=>{i(),L()},[L,i]);return n.useEffect(()=>(He(e,[c.read,c.write,d.read,d.write,m.read,m.write,x,D]),()=>{c.read.dispose(),c.write.dispose(),d.read.dispose(),d.write.dispose(),m.read.dispose(),m.write.dispose(),x.dispose(),D.dispose()}),[x,D,d,e,m,r,a,c]),n.useEffect(()=>(He(e,[C.read,C.write,...U,B,A,p]),()=>{C.read.dispose(),C.write.dispose(),U.forEach(T=>T.dispose()),B.dispose(),A.dispose(),p.dispose()}),[U,C,o,s,e,u,B,p,l,A]),{velocity:c,dye:d,pressureTex:m,curl:x,divergence:D,bloomComposite:C,bloomChain:U,sunraysMask:B,sunraysTex:A,sunraysTemp:p,clearAllTargets:P}}const Zr=`
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
`,Qr=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,Jr=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,zr=`
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
`,ea=`
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
`,ta=`
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uValue;

void main() {
  gl_FragColor = uValue * texture2D(uTexture, vUv);
}
`,ra=`
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
`,aa=`
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
`,oa=`
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
`,na=`
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
`,ua=`
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
`,sa=`
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
`,la=`
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
`,ia=`
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
`,ca=`
varying vec2 vUv;
uniform sampler2D uBase;
uniform sampler2D uAdd;
uniform float uAddFactor;

void main() {
  vec3 base = texture2D(uBase, vUv).rgb;
  vec3 add = texture2D(uAdd, vUv).rgb;
  gl_FragColor = vec4(base + add * uAddFactor, 1.0);
}
`,va=`
varying vec2 vUv;
uniform sampler2D uTexture;

void main() {
  vec4 c = texture2D(uTexture, vUv);
  float br = max(c.r, max(c.g, c.b));
  c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);
  gl_FragColor = c;
}
`,da=`
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
`,ma=`
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
`,fa=`
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
`;function ge(e,a){return new ht({vertexShader:Zr,fragmentShader:e,uniforms:a,depthTest:!1,depthWrite:!1})}function W(e,a){return new ht({vertexShader:Qr,fragmentShader:e,uniforms:a,depthTest:!1,depthWrite:!1})}const Aa=0,xa=1,La=2,Ea=.28,_a=8,ya=12,Zt=10,Te=10,ha=ya;function pa(e,a,r,s,o,l){const u=s;u.material=o,e.setRenderTarget(l),e.render(a,r)}const ga=.15,Sa=16,$e=900,Se=32,Ma={paused:!1,simResolution:1,pressureRelax:1,pressureIterations:40,vorticity:90,velocityDissipation:2,densityDissipation:2,splatRadius:.003,autoSplatRadius:.003,stationarySplatRadius:.003,randomSplatRadius:.003,splatForce:2200,dyeStrength:.92,autoSplat:!0,autoSplatStrength:.6,autoSplatDyeStrength:.92,autoSplatForce:2200,autoSplatRate:100,autoSplatBurst:2,autoSplatCount:2,stationarySplatsEnabled:!0,stationarySplatStrength:.35,stationarySplatDyeStrength:.92,stationarySplatForce:2200,randomSplatDyeStrength:.92,stationarySplatDirectionStrength:0,stationarySplatDirectionAngle:180,stationarySplatCount:8,stationaryDebugMarkersEnabled:!0,stationaryDebugMarkerCount:8,shading:!0,bloom:!0,bloomResolution:.25,bloomIterations:8,bloomIntensity:.65,bloomThreshold:.6,bloomSoftKnee:.7,sunrays:!0,sunraysResolution:.18,sunraysWeight:.85,colorA:"#ff6d6d",colorB:"#ff0000",colorC:"#7b0000",colorful:!0,colorUpdateSpeed:20,colorCycleSpeed:.55,dithering:!0,ditherStrength:1,ditherScale:1,bgA:"#4b4b4b",bgB:"#797979",brightness:1.37,contrast:1.2,saturation:1.33,blendMode:0,debugCursor:!0,debugAutoSplat:!0,debugStationarySplat:!0,debugRandomBurst:!0,debugPointerColor:"#ffffff",debugAutoColor:"#000000",debugStationaryColor:"#ffd166",debugRandomColor:"#7c3aed",debugPointerWidth:.03,debugPointerHeight:.03,debugAutoWidth:.03,debugAutoHeight:.03,debugStationaryWidth:.03,debugStationaryHeight:.03,debugRandomWidth:.03,debugRandomHeight:.03,debugPointerLineWeight:2,debugAutoLineWeight:2,debugStationaryLineWeight:2,debugRandomLineWeight:2,debugPointerFill:!1,debugAutoFill:!1,debugStationaryFill:!1,debugRandomFill:!1,debugPointerRotation:0,debugAutoRotation:0,debugStationaryRotation:0,debugStationarySplatColor:"#ffd166",debugStationarySplatWidth:.03,debugStationarySplatHeight:.03,debugStationarySplatLineWeight:2,debugStationarySplatFill:!1,debugStationarySplatRotation:0,debugStationaryMarkerColor:"#ffd166",debugStationaryMarkerWidth:.03,debugStationaryMarkerHeight:.03,debugStationaryMarkerLineWeight:2,debugStationaryMarkerFill:!1,debugStationaryMarkerRotation:0,debugRandomRotation:0,debugContactFadeDuration:.28},ka=n.forwardRef(({autoPointersRef:e,config:a,pointerRef:r,randomSplatsRef:s,stationaryPointersRef:o},l)=>{const{gl:u,size:t}=Br(),v=n.useRef(null),c=r||v,d=n.useRef(!1),m=n.useRef([]),x=n.useRef([{x:.5,y:.5,ttl:0,phase:0}]),D=n.useRef([]),C=e||x,U=o||D,B=s||m,A=n.useRef(!1),p=n.useRef(null);!p.current&&t.width>1&&t.height>1&&(p.current={width:t.width,height:t.height});const i=n.useRef(new ae),L=n.useRef(new ae),P=n.useRef(new ae),T=n.useRef(new ft),k=n.useRef(new ae),G=n.useMemo(()=>({...Ma,...a||{}}),[a]),{paused:J,simResolution:N,pressureRelax:be,pressureIterations:oe,vorticity:z,velocityDissipation:Qe,densityDissipation:De,splatRadius:ne,autoSplatRadius:ue,stationarySplatRadius:Re,randomSplatRadius:Ce,splatForce:se,dyeStrength:ke,autoSplat:Ve,autoSplatStrength:ee,autoSplatDyeStrength:St,autoSplatForce:Je,autoSplatRate:or,autoSplatBurst:nr,autoSplatCount:ur,stationarySplatsEnabled:sr,stationarySplatStrength:lr,stationarySplatDyeStrength:ir,stationarySplatForce:Mt,randomSplatDyeStrength:cr,stationarySplatDirectionStrength:vr,stationarySplatDirectionAngle:dr,stationarySplatCount:mr,shading:Tt,bloom:ze,bloomResolution:bt,bloomIterations:fr,bloomIntensity:Dt,bloomThreshold:Ie,bloomSoftKnee:xr,sunrays:et,sunraysResolution:Rt,sunraysWeight:Ct,colorA:wt,colorB:yr,colorC:hr,colorful:Pt,colorUpdateSpeed:pr,colorCycleSpeed:Ft,dithering:gr,ditherStrength:Sr,ditherScale:Bt,bgA:Ut,bgB:At,brightness:Lt,contrast:Et,saturation:_t,blendMode:kt}=G,tt=Math.max(1,p.current?.width||t.width),rt=Math.max(1,p.current?.height||t.height),le=Math.max(64,Math.max(Se,Math.floor(tt*N/Se)*Se)),ie=Math.max(64,Math.max(Se,Math.floor(rt*N/Se)*Se)),at=Math.max(32,Math.floor(tt*bt)),ot=Math.max(32,Math.floor(rt*bt)),nt=Math.max(32,Math.floor(tt*Rt)),ut=Math.max(32,Math.floor(rt*Rt)),Vt=u.capabilities.isWebGL2?Ur:Ar,ce=u.capabilities.isWebGL2?yt:xt,Mr=n.useMemo(()=>({type:Vt,format:Kt,minFilter:ce,magFilter:ce,depthBuffer:!1,stencilBuffer:!1,wrapS:Wt,wrapT:Wt}),[ce,Vt]),b=n.useMemo(()=>new pe(1/le,1/ie),[le,ie]),Y=n.useMemo(()=>new pe(1/at,1/ot),[at,ot]),we=n.useMemo(()=>new pe(1/nt,1/ut),[nt,ut]),Ne=n.useMemo(()=>new Lr,[]),Tr=n.useMemo(()=>new Er(-1,1,1,-1,0,1),[]),ve=n.useMemo(()=>new _r(new kr(2,2),new Vr({color:0})),[]),{velocity:E,dye:O,pressureTex:te,curl:It,divergence:Nt,bloomComposite:H,bloomChain:Pe,sunraysMask:jt,sunraysTex:je,sunraysTemp:Ot,clearAllTargets:br}=Kr({gl:u,simWidth:le,simHeight:ie,bloomWidth:at,bloomHeight:ot,sunraysWidth:nt,sunraysHeight:ut,rtOptions:Mr,maxBloomChain:Sa}),V=n.useMemo(()=>ge(zr,{uVelocity:{value:null},uSource:{value:null},uTexel:{value:b.clone()},uDt:{value:.016},uDissipation:{value:De},uManualFiltering:{value:ce===xt}}),[ce,b]),Fe=n.useMemo(()=>ge(ea,{uVelocity:{value:null},uTexel:{value:b.clone()}}),[b]),Be=n.useMemo(()=>W(ta,{uTexture:{value:null},uValue:{value:be}}),[b]),de=n.useMemo(()=>ge(ra,{uPressure:{value:null},uDivergence:{value:null},uTexel:{value:b.clone()}}),[b]),Ue=n.useMemo(()=>ge(oa,{uVelocity:{value:null},uTexel:{value:b.clone()}}),[b]),Ae=n.useMemo(()=>ge(aa,{uPressure:{value:null},uVelocity:{value:null},uTexel:{value:b.clone()}}),[b]),$=n.useMemo(()=>ge(na,{uVelocity:{value:null},uCurlTex:{value:null},uTexel:{value:b.clone()},uDt:{value:.016},uCurl:{value:z}}),[b]),q=n.useMemo(()=>W(ua,{uTarget:{value:null},uPoint:{value:new pe(.5,.5)},uColor:{value:new ft(0,0,0)},uRadius:{value:ne},uAspect:{value:le/ie}}),[ie,le]),me=n.useMemo(()=>W(sa,{uTexture:{value:null},uCurve:{value:new ft(0,0,0)},uThreshold:{value:Ie}}),[Y]),fe=n.useMemo(()=>W(la,{uTexture:{value:null},uTexel:{value:Y.clone()}}),[Y]),re=n.useMemo(()=>W(ia,{uTexture:{value:null},uTexel:{value:Y.clone()},uIntensity:{value:Dt}}),[Y]),xe=n.useMemo(()=>W(ca,{uBase:{value:null},uAdd:{value:null},uAddFactor:{value:1}}),[Y]),Oe=n.useMemo(()=>W(va,{uTexture:{value:null}}),[we]),Le=n.useMemo(()=>W(da,{uTexture:{value:null},uWeight:{value:Ct}}),[we]),K=n.useMemo(()=>W(ma,{uTexture:{value:null},uTexel:{value:new pe(1,0)}}),[we]),S=n.useMemo(()=>new ht({vertexShader:Jr,fragmentShader:fa,uniforms:{uDye:{value:null},uBloom:{value:null},uSunrays:{value:null},uDithering:{value:null},uDyeTexel:{value:b.clone()},uDitherScale:{value:new pe(1,1)},uDitheringEnabled:{value:!0},uDitherStrength:{value:1},uBgA:{value:new ae(Ut)},uBgB:{value:new ae(At)},uBrightness:{value:Lt},uContrast:{value:Et},uSaturation:{value:_t},uShading:{value:Tt},uBloomEnabled:{value:ze},uSunraysEnabled:{value:et},uBlendMode:{value:0}},depthTest:!1,depthWrite:!1}),[b]),Ee=n.useMemo(()=>Hr(),[]);return n.useEffect(()=>(Ne.add(ve),()=>{Ne.remove(ve)}),[ve,Ne]),n.useEffect(()=>()=>{ve.geometry.dispose(),Ee.dispose(),V.dispose(),Be.dispose(),Ue.dispose(),Fe.dispose(),de.dispose(),Ae.dispose(),$.dispose(),q.dispose(),me.dispose(),fe.dispose(),re.dispose(),xe.dispose(),Oe.dispose(),Le.dispose(),K.dispose(),S.dispose()},[V,fe,xe,re,me,K,Be,Ue,Fe,S,Ee,Ae,de,ve.geometry,q,Oe,Le,$]),n.useImperativeHandle(l,()=>({reset(){A.current=!0}})),pt((Dr,Rr)=>{const qt=Math.min(.033,Rr),st=Dr.clock.elapsedTime;A.current&&(br(),A.current=!1);const F=(y,f)=>{pa(u,Ne,Tr,ve,y,f)};i.current.set(wt),L.current.set(yr),P.current.set(hr),V.uniforms.uTexel.value.copy(b),V.uniforms.uDt.value=qt,V.uniforms.uManualFiltering.value=ce===xt,Fe.uniforms.uTexel.value.copy(b),Ue.uniforms.uTexel.value.copy(b),$.uniforms.uTexel.value.copy(b),$.uniforms.uDt.value=qt,$.uniforms.uCurl.value=z,de.uniforms.uTexel.value.copy(b),Be.uniforms.uValue.value=be,q.uniforms.uAspect.value=le/ie,me.uniforms.uThreshold.value=Ie,fe.uniforms.uTexel.value.copy(Y),re.uniforms.uTexel.value.copy(Y),re.uniforms.uIntensity.value=Dt,Le.uniforms.uWeight.value=Ct,S.uniforms.uDyeTexel.value.copy(b),S.uniforms.uDithering.value=Ee,S.uniforms.uDitherScale.value.set(t.width/Ee.image.width*(Bt||1),t.height/Ee.image.height*(Bt||1)),S.uniforms.uDitherStrength.value=Sr||0,S.uniforms.uDitheringEnabled.value=!!gr,S.uniforms.uBgA.value.set(Ut),S.uniforms.uBgB.value.set(At),S.uniforms.uBrightness.value=Lt,S.uniforms.uContrast.value=Et,S.uniforms.uSaturation.value=_t,S.uniforms.uBlendMode.value=kt,S.uniforms.uShading.value=Tt,S.uniforms.uBloomEnabled.value=ze,S.uniforms.uSunraysEnabled.value=et;const _e=kt===xa,qe=c.current;let ye=[];Array.isArray(qe)?ye=qe.filter(y=>y?.down):qe?.down&&(ye=[qe]);const Cr=Math.max(0,Math.floor(mr||0)),lt=(U.current||[]).slice(0,Cr),he=(y,f,w,g,M,I=1,j=ne,X={})=>{const{applyVelocity:Z=!0,applyDye:_=!0,dyeStrengthOverride:Ye=ke}=X,We=h.clamp(y,0,1),it=h.clamp(f,0,1),ct=h.clamp(I,0,3),vt=h.clamp(j,1e-5,.1),dt=h.clamp(Ye,0,3);q.uniforms.uPoint.value.set(We,it),q.uniforms.uRadius.value=vt,Z&&(q.uniforms.uTarget.value=E.read.texture,T.current.set(h.clamp(w,-$e,$e),h.clamp(g,-$e,$e),0),q.uniforms.uColor.value.copy(T.current),F(q,E.write),E.swap()),_&&(q.uniforms.uTarget.value=O.read.texture,T.current.set(h.clamp(M.r,0,1),h.clamp(M.g,0,1),h.clamp(M.b,0,1)).multiplyScalar(dt*ct*ga),q.uniforms.uColor.value.copy(T.current),F(q,O.write),O.swap())};if(ye.length>0){const y=Ft*Math.max(.001,pr),f=.5+.5*Math.sin(st*y),w=.5+.5*Math.sin(st*y*1.37+1.7);Pt&&(i.current.lerp(L.current,f),i.current.lerp(P.current,w*.45));let g=i.current;_e&&(g=i.current.clone().multiplyScalar(-1).addScalar(1)),!Pt&&_e&&(g=new ae(wt).multiplyScalar(-1).addScalar(1));for(let M=0;M<ye.length;M+=1){const I=ye[M],j=Math.min(1,Math.hypot(I.vx||0,I.vy||0)*80),X=(I.vx||0)*se,Z=(I.vy||0)*se;he(I.x,I.y,X,Z,g,.65+j*.75,ne,{applyVelocity:!J,applyDye:!0})}}if(!J){if(V.uniforms.uVelocity.value=E.read.texture,V.uniforms.uSource.value=E.read.texture,V.uniforms.uDissipation.value=Qe,F(V,E.write),E.swap(),Ue.uniforms.uVelocity.value=E.read.texture,F(Ue,It),$.uniforms.uVelocity.value=E.read.texture,$.uniforms.uCurlTex.value=It.texture,F($,E.write),E.swap(),ye.length===0&&!d.current&&(d.current=!0,he(.5,.5,0,0,i.current.set(.2,.4,.7),.35)),Ve){const y=Math.max(1,Math.floor(nr)),f=Math.max(1,Math.floor(ur||1));for(let w=0;w<f;w++){const g=C.current[w]||{},M=g.phase||0,I=Math.min(1,Math.hypot(g.vx||0,g.vy||0)*140);let j=(g.vx||0)*Je*ee*1.4,X=(g.vy||0)*Je*ee*1.4;if(or>0){const _=Je*ee*.0018;Math.hypot(j,X)<_&&(j+=Math.cos(M*1.9)*_,X+=Math.sin(M*1.9)*_)}k.current.set(Math.min(1,h.lerp(i.current.r,L.current.r,.5+.5*Math.sin(M*.61+w*.13))+.01),Math.min(1,h.lerp(L.current.g,P.current.g,.5+.5*Math.sin(M*.73+.7+w*.11))+.01),Math.min(1,h.lerp(P.current.b,i.current.b,.5+.5*Math.sin(M*.67+1.4+w*.09))+.01)).multiplyScalar(.75),_e&&k.current.multiplyScalar(-1).addScalar(1);const Z=(.12+I*.2)*ee*.75;he(g.x??.5,g.y??.5,j,X,k.current,Z,ue,{dyeStrengthOverride:St});for(let _=1;_<y;_++){const Ye=M+_*1.73,We=_/y,it=(g.x||.5)-(g.vx||0),ct=(g.y||.5)-(g.vy||0),vt=h.lerp(it,g.x||.5,We),dt=h.lerp(ct,g.y||.5,We),Xt=.006*(_/Math.max(1,y-1)),wr=Math.sin(Ye*1.19)*Xt,Pr=Math.cos(Ye*1.47)*Xt,mt=Math.max(.12,1-_*.28);he(vt+wr,dt+Pr,j*mt,X*mt,k.current,Z*mt*.55,ue,{dyeStrengthOverride:St})}}}if(sr&&lt.length>0){const y=h.clamp(vr,0,1),f=dr*Math.PI/180,w=Math.cos(f)*Mt*y,g=Math.sin(f)*Mt*y;for(let M=0;M<lt.length;M+=1){const I=lt[M]||{},j=st*(.7+Math.max(0,Ft||0)*.5);k.current.set(Math.min(1,h.lerp(i.current.r,L.current.r,.5+.5*Math.sin(j*.61+M*.13))+.01),Math.min(1,h.lerp(L.current.g,P.current.g,.5+.5*Math.sin(j*.73+.7+M*.11))+.01),Math.min(1,h.lerp(P.current.b,i.current.b,.5+.5*Math.sin(j*.67+1.4+M*.09))+.01)).multiplyScalar(.75),_e&&k.current.multiplyScalar(-1).addScalar(1);const X=I.x??.5,Z=I.y??.5,_=.12*lr*.75;he(X,Z,w,g,k.current,_,Re,{dyeStrengthOverride:ir})}}if(B.current.length>0){for(let y=0;y<B.current.length;y+=1){const f=B.current[y],w=i.current.clone().lerp(L.current,f.hueMix).lerp(P.current,f.colorMix);_e&&w.multiplyScalar(-1).addScalar(1),he(f.x,f.y,f.vx,f.vy,w,f.strength,Ce,{dyeStrengthOverride:cr})}B.current=[]}Fe.uniforms.uVelocity.value=E.read.texture,F(Fe,Nt),Be.uniforms.uTexture.value=te.read.texture,F(Be,te.write),te.swap(),de.uniforms.uDivergence.value=Nt.texture;for(let y=0;y<oe;y++)de.uniforms.uPressure.value=te.read.texture,F(de,te.write),te.swap();Ae.uniforms.uPressure.value=te.read.texture,Ae.uniforms.uVelocity.value=E.read.texture,F(Ae,E.write),E.swap(),V.uniforms.uVelocity.value=E.read.texture,V.uniforms.uSource.value=O.read.texture,V.uniforms.uDissipation.value=De,F(V,O.write),O.swap()}const Xe=Math.min(Pe.length,Math.max(1,Math.floor(fr)));if(ze&&Xe>0){const y=Ie*xr+1e-4;me.uniforms.uCurve.value.set(Ie-y,y*2,.25/y),me.uniforms.uTexture.value=O.read.texture,F(me,Pe[0]);for(let f=1;f<Xe;f++){const w=Pe[f-1],g=Pe[f];fe.uniforms.uTexel.value.set(1/w.width,1/w.height),fe.uniforms.uTexture.value=w.texture,F(fe,g)}u.setRenderTarget(H.read),u.clearColor(0,0,0,1),u.clear(u.COLOR_BUFFER_BIT);for(let f=Xe-1;f>=0;f--)xe.uniforms.uBase.value=H.read.texture,xe.uniforms.uAdd.value=Pe[f].texture,xe.uniforms.uAddFactor.value=.82**(Xe-1-f),F(xe,H.write),H.swap();re.uniforms.uTexel.value.copy(Y),re.uniforms.uTexture.value=H.read.texture,F(re,H.write),H.swap(),S.uniforms.uBloom.value=H.read.texture}else S.uniforms.uBloom.value=O.read.texture;et?(Oe.uniforms.uTexture.value=O.read.texture,F(Oe,jt),Le.uniforms.uTexture.value=jt.texture,F(Le,je),K.uniforms.uTexture.value=je.texture,K.uniforms.uTexel.value.set(we.x,0),F(K,Ot),K.uniforms.uTexture.value=Ot.texture,K.uniforms.uTexel.value.set(0,we.y),F(K,je),S.uniforms.uSunrays.value=je.texture):S.uniforms.uSunrays.value=O.read.texture,S.uniforms.uDye.value=O.read.texture,u.setRenderTarget(null)}),Me.jsx("primitive",{object:S,attach:"material"})});function Gt(){return{initialized:!1,x:.5,y:.5,vx:0,vy:0,phase:Math.random()*Math.PI*4,seed:Math.random()*Math.PI*2,ttl:0,jitterOffset:{x:(Math.random()-.5)*.12,y:(Math.random()-.5)*.12},freqMul:{a:.85+Math.random()*.5,b:.7+Math.random()*.6,c:.8+Math.random()*.6},ampMul:1+(Math.random()-.5)*.6,pathSpeedMul:.6+Math.random()*1.4}}function Ze(e,a=.5){return Number.isFinite(e)?Math.max(0,Math.min(1,e)):a}function Ta(e,a,r={},s={x:.5,y:.5}){const o=r.freqMul&&r.freqMul.a||.97,l=r.freqMul&&r.freqMul.b||.41,u=r.freqMul&&r.freqMul.c||1.81,t=(r.ampMul||1)*Math.max(0,a||1),v=Ze(s?.x),c=Ze(s?.y),d=v+Math.sin(e*o)*.26*t+Math.sin(e*l+1.4)*.13*t+Math.sin(e*u+.3)*.05*t,m=c+Math.cos(e*(1.13*o))*.24*t+Math.cos(e*(.53*l)+2)*.12*t+Math.cos(e*(1.47*u)+.9)*.05*t,x=r.jitterOffset&&r.jitterOffset.x||0,D=r.jitterOffset&&r.jitterOffset.y||0;return{x:h.clamp(d+x,.05,.95),y:h.clamp(m+D,.05,.95)}}function Va({config:e,size:a}){const r=n.useRef([Gt()]),s=n.useMemo(()=>.01,[]);return pt((o,l)=>{const u=Math.min(.033,l),{paused:t,autoSplat:v,autoSplatRate:c,autoSplatRange:d,autoSplatCount:m,autoSplatStarts:x,colorCycleSpeed:D,debugContactFadeDuration:C}=e,U=Math.max(1,Math.floor(m||1));for(;r.current.length<U;)r.current.push(Gt());const B=.95*(.7+Math.max(0,D)*.5),A=Math.max(0,c)/100;for(let p=0;p<r.current.length;p+=1){const i=r.current[p];if(i){const L=x?.[p]||{x:.5,y:.5},P=Ze(L?.x),T=Ze(L?.y),k=i.startX!==P||i.startY!==T;let G=!1;if(k&&(i.startX=P,i.startY=T,i.initialized=!0,i.x=P,i.y=T,i.vx=0,i.vy=0,v&&p<U&&(i.ttl=Math.max(0,C)),G=!0),!G)if(t)i.vx=0,i.vy=0,v&&p<U&&(i.ttl=Math.max(0,C));else{i.ttl=Math.max(0,(i.ttl||0)-u),typeof i.phase!="number"&&(i.phase=Math.random()*Math.PI*4),i.phase+=u*B*(i.pathSpeedMul||1)*A;const J=i.phase+(i.seed||0),N=Ta(J,d,i,{x:P,y:T});i.initialized||(i.initialized=!0,i.x=P,i.y=T);const be=c,oe=i.x,z=i.y;if(be<=0||oe===N.x&&z===N.y)i.vx=0,i.vy=0;else{const Qe=be*s,De=N.x-oe,ne=N.y-z,ue=Math.hypot(De,ne);if(ue<1e-6)i.vx=0,i.vy=0;else{const Re=Qe*u;let Ce=N.x,se=N.y;if(ue>Re){const ee=1/ue;Ce=oe+De*ee*Re,se=z+ne*ee*Re}let ke=Ce-oe,Ve=se-z;a.width>a.height?ke*=a.width/Math.max(1,a.height):Ve*=a.height/Math.max(1,a.width),i.x=Ce,i.y=se,i.vx=ke,i.vy=Ve}}v&&p<U&&(i.ttl=Math.max(0,C))}}}}),r}function Ia(e){const a=n.useMemo(()=>({maxHands:e.handsMaxHands||1,modelComplexity:e.handsModelComplexity||1,minDetectionConfidence:e.handsMinDetectionConfidence||.6,minTrackingConfidence:e.handsMinTrackingConfidence||.6,showVideo:!!e.handsShowVideo,showDebugSkeleton:!!e.handsShowDebugSkeleton,landmarkStyle:{color:e.handsLandmarkColor||"#ff0000",radius:e.handsLandmarkRadius||4},connectorStyle:{color:e.handsConnectorColor||"#000000",lineWidth:e.handsConnectorLineWidth||3}}),[e.handsConnectorColor,e.handsConnectorLineWidth,e.handsLandmarkColor,e.handsLandmarkRadius,e.handsMaxHands,e.handsMinDetectionConfidence,e.handsMinTrackingConfidence,e.handsModelComplexity,e.handsShowDebugSkeleton,e.handsShowVideo]),r=n.useMemo(()=>({maxHands:e.handsMaxHands||1,xScale:e.handsXScale||4,yScale:e.handsYScale||3,zScale:e.handsZScale||5}),[e.handsMaxHands,e.handsXScale,e.handsYScale,e.handsZScale]);return{mediaPipeConfig:a,handControlConfig:r}}function Na({size:e}){const a=n.useRef(null),r=n.useRef(null),s=n.useRef(!1),o=n.useCallback(t=>{if(!t.uv||!s.current)return;const{x:v,y:c}=t.uv,d=r.current;let m=d?v-d.x:0,x=d?c-d.y:0;e.width>e.height?m*=e.width/Math.max(1,e.height):x*=e.height/Math.max(1,e.width);const D={x:v,y:c,vx:m,vy:x,down:!0};r.current=D,a.current=D},[e.height,e.width]),l=n.useCallback(()=>{s.current=!1,r.current=null,a.current=null},[]),u=n.useMemo(()=>({onPointerDown:t=>{t.stopPropagation(),s.current=!0,t.target.setPointerCapture(t.pointerId),o(t)},onPointerMove:t=>{t.stopPropagation(),o(t)},onPointerUp:t=>{t.stopPropagation(),t.target.releasePointerCapture&&t.target.releasePointerCapture(t.pointerId),l()},onPointerCancel:t=>{t.stopPropagation(),t.target.releasePointerCapture&&t.target.releasePointerCapture(t.pointerId),l()},onPointerLeave:t=>{t.stopPropagation(),t.pointerType==="mouse"&&l()}}),[l,o]);return{pointerRef:a,pointerEvents:u}}function ja({config:e,randomSplatQueueRef:a}){const r=n.useRef([]),s=a;return pt(()=>{if(r.current=[],!s||s.current<=0)return;const o=Math.min(s.current,ha);s.current-=o;const l=Math.max(0,e?.randomSplatStrength??1),u=Math.max(0,e?.randomSplatForce??e?.splatForce??2200);for(let t=0;t<o;t+=1)r.current.push({x:Math.random(),y:Math.random(),vx:(Math.random()*2-1)*u*.08*l,vy:(Math.random()*2-1)*u*.08*l,hueMix:Math.random(),colorMix:Math.random()*.5,strength:(.5+Math.random()*.8)*l})}),r}function Ht(e,a=.5){return Number.isFinite(e)?h.clamp(e,0,1):a}function Ke(e,a){return{id:a,x:Ht(e?.x),y:Ht(e?.y)}}function $t(){return{x:.1+Math.random()*.8,y:.1+Math.random()*.8}}function Qt(e){return Array.isArray(e?.stationarySplats)?e.stationarySplats:[]}function ba(e){return Array.isArray(e?.stationaryDebugMarkers)?e.stationaryDebugMarkers:Qt(e)}function Oa({config:e,pointerEvents:a}){const r=n.useRef([]),s=n.useRef([]),o=n.useRef(0),l=n.useRef(0);return n.useEffect(()=>{const u=h.clamp(Math.max(0,Math.floor(e?.stationarySplatCount||0)),0,Te),t=Qt(e),v=r.current.slice(0,u);for(;v.length<u;){const c=`stationary-${o.current}`;o.current+=1;const m=t[v.length]||$t();v.push(Ke(m,c))}for(let c=0;c<v.length;c+=1)t[c]&&(v[c]=Ke(t[c],v[c].id));r.current=v},[e?.stationarySplatCount,e?.stationarySplats]),n.useEffect(()=>{const u=ba(e),t=Math.max(0,Math.floor(e?.stationarySplatCount||0)),v=h.clamp(Math.max(0,Math.floor(e?.stationaryDebugMarkerCount??t)),0,Te),c=s.current.slice(0,v);for(;c.length<v;){const d=`stationary-debug-${l.current}`;l.current+=1;const x=u[c.length]||$t();c.push(Ke(x,d))}for(let d=0;d<c.length;d+=1)u[d]&&(c[d]=Ke(u[d],c[d].id));s.current=c},[e?.stationaryDebugMarkerCount,e?.stationaryDebugMarkers,e?.stationarySplatCount,e?.stationarySplats]),{stationaryPointersRef:r,stationaryDebugMarkersRef:s,pointerEvents:a||{}}}function Da(e,a,r){const s=e*.5,o=a*.5,l=Math.max(0,s-r),u=Math.max(0,o-r),t=new Ir;if(t.moveTo(-s,-o),t.lineTo(s,-o),t.lineTo(s,o),t.lineTo(-s,o),t.closePath(),l>0&&u>0){const v=new Nr;v.moveTo(-l,-u),v.lineTo(l,-u),v.lineTo(l,u),v.lineTo(-l,u),v.closePath(),t.holes.push(v)}return new jr(t)}const qa=n.forwardRef(function({position:a,size:r,width:s,height:o,color:l,extraRotation:u=0},t){const v=s??r,c=o??r;return Me.jsxs("mesh",{ref:t,position:a,"rotation-z":u,children:[Me.jsx("planeGeometry",{args:[v,c]}),Me.jsx("meshBasicMaterial",{color:l})]})}),Xa=n.forwardRef(function({position:a,size:r,width:s,height:o,color:l,lineThickness:u,extraRotation:t=0},v){const c=s??r,d=o??r,m=u??Math.min(c,d)*.15,x=n.useMemo(()=>Da(c,d,m),[c,d,m]);return n.useEffect(()=>()=>x.dispose(),[x]),Me.jsx("mesh",{ref:v,position:a,"rotation-z":t,geometry:x,children:Me.jsx("meshBasicMaterial",{color:l})})});function R(e,a=.5){return Number.isFinite(e)?Math.max(0,Math.min(1,e)):a}function Jt(e){return Number.isFinite(e)?Math.max(0,Math.min(Te,Math.floor(e))):0}function zt(e){return Number.isFinite(e)?Math.max(0,Math.min(Te,Math.floor(e))):0}function er(e){return Number.isFinite(e)?Math.max(1,Math.min(Zt,Math.floor(e))):1}function Ra(){return{x:.1+Math.random()*.8,y:.1+Math.random()*.8}}function gt(e,a,r=Ra){const s=[];for(let o=0;o<a;o+=1){const l=e?.[o];s.push(l?{x:R(l.x),y:R(l.y)}:r())}return s}function Ca(e){const a=er(e?.autoSplatCount??e?.autoSplatStarts?.length);return gt(e?.autoSplatStarts,a)}function wa(e){const a=Jt(e?.stationarySplatCount??e?.stationarySplats?.length);return gt(e?.stationarySplats,a)}function Pa(e){const a=zt(e?.stationaryDebugMarkerCount??e?.stationaryDebugMarkers?.length??e?.stationarySplatCount??e?.stationarySplats?.length),r=e?.stationaryDebugMarkers??e?.stationarySplats;return gt(r,a)}function tr(e){return`autoSplat${e+1}StartPos`}function rr(e){return`stationarySplat${e+1}Pos`}function ar(e){return`stationaryDebugMarker${e+1}Pos`}function Ya(e,a,r){const s={};for(let o=0;o<Zt;o+=1){const l=e[o]||{x:.5,y:.5};s[tr(o)]={label:`A${o+1} Pos`,value:{x:R(l.x),y:R(l.y)},min:0,max:1,step:.001,render:u=>{const t=er(u(`${r}.Interaction.AutoSplats.autoSplatCount`));return o<t},onChange:u=>{a(t=>{if(!t[o])return t;const v=R(u?.x),c=R(u?.y);if(t[o].x===v&&t[o].y===c)return t;const d=[...t];return d[o]={x:v,y:c},d})}}}return s}function Wa(e,a,r){const s={};for(let o=0;o<Te;o+=1){const l=e[o]||{x:.5,y:.5};s[rr(o)]={label:`S${o+1} Pos`,value:{x:R(l.x),y:R(l.y)},min:0,max:1,step:.001,render:u=>{const t=Jt(u(`${r}.Interaction.StationarySplats.stationarySplatCount`));return o<t},onChange:u=>{a(t=>{if(!t[o])return t;const v=R(u?.x),c=R(u?.y);if(t[o].x===v&&t[o].y===c)return t;const d=[...t];return d[o]={x:v,y:c},d})}}}return s}function Ga(e,a,r){const s={};for(let o=0;o<Te;o+=1){const l=e[o]||{x:.5,y:.5};s[ar(o)]={label:`M${o+1} Pos`,value:{x:R(l.x),y:R(l.y)},min:0,max:1,step:.001,render:u=>{const t=zt(u(`${r}.Interaction.StationaryMarkers.stationaryDebugMarkerCount`));return o<t},onChange:u=>{a(t=>{if(!t[o])return t;const v=R(u?.x),c=R(u?.y);if(t[o].x===v&&t[o].y===c)return t;const d=[...t];return d[o]={x:v,y:c},d})}}}return s}function Ha(e,a,r,s){e(Ca(s)),a(wa(s)),r(Pa(s))}function $a(e){return e.reduce((a,r,s)=>(a[tr(s)]={x:R(r?.x),y:R(r?.y)},a),{})}function Ka(e){return e.reduce((a,r,s)=>(a[rr(s)]={x:R(r?.x),y:R(r?.y)},a),{})}function Za(e){return e.reduce((a,r,s)=>(a[ar(s)]={x:R(r?.x),y:R(r?.y)},a),{})}export{qa as A,Aa as B,_a as D,Ua as F,ha as M,Xa as O,wa as a,Pa as b,er as c,Jt as d,zt as e,$a as f,Ca as g,Ka as h,Za as i,La as j,xa as k,Ga as l,Wa as m,Ha as n,Ya as o,ya as p,ja as q,Ra as r,Na as s,Oa as t,Va as u,Ia as v,Ea as w,R as x,ka as y,Da as z};
