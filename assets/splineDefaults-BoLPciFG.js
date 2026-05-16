import{r as c,l as oe,bj as te,T as se,aT as le,p as q,o as re,j as k,t as ne,a6 as ue,V as T,a7 as fe,b0 as Z,Q as X,U as de,a5 as xe,_ as he,aa as me,aJ as ye,a4 as pe}from"./index-ztHVU0OX.js";import{S as ge}from"./SmokeParticles-4rzSf4Lu.js";import{V as ze}from"./VolumetricSmokeParticles-BddQGKfS.js";import{S as Se}from"./SplineLine-Usw6iPbq.js";import{S as Ce}from"./SplinePoints-CncUJyfc.js";import{V as we}from"./VolumetricFire-BOwCZFBS.js";const ve=`
vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x)  { return mod289v4(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float pnoise(vec3 P, vec3 rep) {
  vec3 Pi0 = mod(floor(P), rep);
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
  Pi0 = mod289v3(Pi0); Pi1 = mod289v3(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy  = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000), dot(g010,g010), dot(g100,g100), dot(g110,g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001), dot(g011,g011), dot(g101,g101), dot(g111,g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z  = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  return 2.2 * mix(n_yz.x, n_yz.y, fade_xyz.x);
}

float turbulence(vec3 p) {
  float t = -0.5;
  for (float f = 1.0; f <= 10.0; f++) {
    float power = pow(2.0, f);
    t += abs(pnoise(p * power, vec3(10.0, 10.0, 10.0)) / power);
  }
  return t;
}
`;oe.preload(se,te("explosion.png"));const be=`
${ve}

varying float ao;
uniform float time;
uniform float weight;
uniform float noiseFreq;
uniform float noiseAmp;

void main() {
  float noise = turbulence( 0.5 * normal + time );

  float displacement = - weight * ( 10.0 * -0.10 * noise );
  displacement += noiseAmp * pnoise( noiseFreq * position + vec3( 2.0 * time ), vec3( 100.0 ) );

  ao = noise;
  vec3 newPosition = position + normal * vec3( displacement );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
}
`,Me=`
precision highp float;

uniform sampler2D tExplosion;
uniform float greyscale;
uniform vec3 smokeLightColor;
uniform vec3 smokeDarkColor;

varying float ao;

float random(vec3 scale, float seed) {
  return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}

void main() {
  float r = 0.01 * random(vec3(12.9898, 78.233, 151.7182), 0.0);
  float v = (1.1 * ao + 1.0) / 1.1;
  vec3 texColor = texture2D(tExplosion, vec2(0.5, v + r)).rgb;

  // Smoke: desaturate the texture and remap through smoke palette
  float lum = dot(texColor, vec3(0.2126, 0.7152, 0.0722));
  vec3 smokeColor = mix(smokeDarkColor, smokeLightColor, lum);

  vec3 color = mix(texColor, smokeColor, greyscale);
  gl_FragColor = vec4(color, 1.0);
}
`;function Oe({position:t=[0,0,0],radius:e=20,detail:r=6,speed:o=1,weight:n=10,noiseFreq:a=.05,noiseAmp:g=5,texturePath:h="explosion.png",animated:l=!0,greyscale:C=!1,smokeLightColor:v="#4a4a58",smokeDarkColor:d="#1a1a22"}){const u=c.useMemo(()=>Date.now(),[]),y=oe(se,te(h)),b=c.useMemo(()=>(y.colorSpace=le,y),[y]),s=c.useRef({tExplosion:{value:b},time:{value:0},weight:{value:n},noiseFreq:{value:a},noiseAmp:{value:g},greyscale:{value:C?1:0},smokeLightColor:{value:new q(v)},smokeDarkColor:{value:new q(d)}}).current;return s.tExplosion.value=b,s.weight.value=n,s.noiseFreq.value=a,s.noiseAmp.value=g,s.greyscale.value=C?1:0,s.smokeLightColor.value.set(v),s.smokeDarkColor.value.set(d),re(()=>{l&&(s.time.value=25e-5*o*(Date.now()-u))}),k.jsxs("mesh",{position:t,children:[k.jsx("icosahedronGeometry",{args:[e,r]}),k.jsx("shaderMaterial",{vertexShader:be,fragmentShader:Me,uniforms:s,side:ne,toneMapped:!1})]})}const Pe=`
${ve}

uniform float time;
uniform float weight;
uniform float noiseFreq;
uniform float noiseAmp;

attribute float arcT;

varying float ao;
varying float vArcT;

void main() {
  vec3 noiseCoord = 0.5 * normal + vec3(arcT * 2.0);
  float noise = turbulence(noiseCoord - time);

  float displacement = weight * noise;
  displacement += noiseAmp * pnoise(noiseFreq * position - vec3(2.0 * time), vec3(100.0));

  ao = noise;
  vArcT = arcT;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * displacement, 1.0);
}
`,Ee=`
precision highp float;

uniform sampler2D tExplosion;
uniform vec3 smokeLightColor;
uniform vec3 smokeDarkColor;
uniform float greyscale;

varying float ao;
varying float vArcT;

float rand(vec3 s, float seed) {
  return fract(sin(dot(gl_FragCoord.xyz + seed, s)) * 43758.5453 + seed);
}

vec3 smokeGradient(float heat) {
  if (heat < 0.5) return mix(smokeDarkColor, smokeLightColor, heat * 2.0);
  return mix(smokeLightColor, smokeLightColor + 0.1, (heat - 0.5) * 2.0);
}

void main() {
  float r = 0.01 * rand(vec3(12.9898, 78.233, 151.7182), 0.0);

  // Fire colour: texture lookup
  float v = (1.1 * ao + 1.0) / 1.1;
  vec3 fireColor = texture2D(tExplosion, vec2(0.5, v + r)).rgb;

  // Desaturate fire for greyscale mode
  float lum = dot(fireColor, vec3(0.2126, 0.7152, 0.0722));
  vec3 fireDesaturated = mix(smokeDarkColor, smokeLightColor, lum);
  vec3 fireResult = mix(fireColor, fireDesaturated, greyscale);

  // Smoke colour: procedural gradient
  float heat = clamp(ao * 2.0 + 0.5 + r, 0.0, 1.0);
  vec3 smokeColor = smokeGradient(heat);

  // Blend fire → smoke along spline arc-length
  vec3 color = mix(fireResult, smokeColor, vArcT);

  gl_FragColor = vec4(color, 1.0);
}
`,ke=[{position:[0,0,0],radius:.7},{position:[0,.9,0],radius:.65},{position:[.05,1.8,0],radius:.72},{position:[.1,2.7,.05],radius:.95},{position:[.15,3.5,.1],radius:1.25},{position:[.2,4.2,.15],radius:1.6}],ae=Math.PI*2;function Te(t){return Array.isArray(t)?new T(t[0],t[1],t[2]):new T(t.x??0,t.y??0,t.z??0)}function Re(t,e,r,o,n){const a=e.length,g=e.map(s=>s.radius??1),h=t.computeFrenetFrames(r,!1),l=[],C=[],v=[],d=[],u=o+1;function y(s){const i=s*(a-1),R=Math.floor(i),f=Math.min(R+1,a-1),M=i-R;return g[R]*(1-M)+g[f]*M}for(let s=0;s<=r;s++){const i=s/r,R=t.getPointAt(i),f=h.normals[s],M=h.binormals[s],E=y(i);for(let w=0;w<=o;w++){const B=w/o*ae,D=Math.sin(B),j=-Math.cos(B),A=j*f.x+D*M.x,F=j*f.y+D*M.y,L=j*f.z+D*M.z;l.push(R.x+E*A,R.y+E*F,R.z+E*L),C.push(A,F,L),v.push(i)}}for(let s=0;s<r;s++)for(let i=0;i<o;i++){const R=s*u+i,f=(s+1)*u+i,M=(s+1)*u+(i+1),E=s*u+(i+1);d.push(R,f,E,f,M,E)}function b(s,i,R,f,M,E,w,B){let D=B;for(let A=1;A<=n;A++){const F=Math.PI/2*(A/n),L=M*Math.cos(F),G=w*M*Math.sin(F),V=l.length/3;for(let m=0;m<=o;m++){const p=m/o*ae,S=Math.sin(p),x=-Math.cos(p),I=x*R.x+S*f.x,_=x*R.y+S*f.y,$=x*R.z+S*f.z,K=Math.cos(F)*I+Math.sin(F)*w*i.x,W=Math.cos(F)*_+Math.sin(F)*w*i.y,P=Math.cos(F)*$+Math.sin(F)*w*i.z;l.push(s.x+G*i.x+L*I,s.y+G*i.y+L*_,s.z+G*i.z+L*$),C.push(K,W,P),v.push(E)}for(let m=0;m<o;m++){const p=D+m,S=V+m,x=V+(m+1),I=D+(m+1);w>0?d.push(p,S,I,S,x,I):d.push(p,I,S,S,I,x)}D=V}const j=l.length/3;l.push(s.x+w*M*i.x,s.y+w*M*i.y,s.z+w*M*i.z),C.push(w*i.x,w*i.y,w*i.z),v.push(E);for(let A=0;A<o;A++)w>0?d.push(D+A,j,D+A+1):d.push(D+A,D+A+1,j)}b(t.getPointAt(0),t.getTangentAt(0),h.normals[0],h.binormals[0],y(0),0,-1,0),b(t.getPointAt(1),t.getTangentAt(1),h.normals[r],h.binormals[r],y(1),1,1,r*u);const z=new fe;return z.setIndex(d),z.setAttribute("position",new Z(l,3)),z.setAttribute("normal",new Z(C,3)),z.setAttribute("arcT",new Z(v,1)),z}function Ue({controlPoints:t=ke,tubularSegments:e=128,radialSegments:r=64,capSegments:o=16,speed:n=1,weight:a=10,noiseFreq:g=.05,noiseAmp:h=5,animated:l=!0,texturePath:C="explosion.png",smokeLightColor:v="#4a4a58",smokeDarkColor:d="#1a1a22",greyscale:u=!1,position:y=[0,0,0]}){const b=c.useMemo(()=>Date.now(),[]),z=oe(se,te(C)),s=c.useMemo(()=>(z.colorSpace=le,z),[z]),i=c.useMemo(()=>{const M=new ue(t.map(E=>Te(E.position)),!1,"centripetal");return Re(M,t,e,r,o)},[t,e,r,o]),f=c.useRef({tExplosion:{value:s},time:{value:0},weight:{value:a},noiseFreq:{value:g},noiseAmp:{value:h},smokeLightColor:{value:new q(v)},smokeDarkColor:{value:new q(d)},greyscale:{value:u?1:0}}).current;return f.tExplosion.value=s,f.weight.value=a,f.noiseFreq.value=g,f.noiseAmp.value=h,f.smokeLightColor.value.set(v),f.smokeDarkColor.value.set(d),f.greyscale.value=u?1:0,re(()=>{l&&(f.time.value=25e-5*n*(Date.now()-b))}),k.jsx("group",{position:y,children:k.jsx("mesh",{geometry:i,children:k.jsx("shaderMaterial",{vertexShader:Pe,fragmentShader:Ee,uniforms:f,side:ne,toneMapped:!1})})})}const ee=32;function Ae({points:t,pointRotations:e,pointScales:r,tension:o=.5,closed:n=!1,spread:a=120,color:g=4500223,opacity:h=.3}){const l=c.useMemo(()=>{if(!t||t.length<2)return null;const C=new ue([...t],n,"catmullrom",o),v=r?.length??0,d=v>=2,u=e?.length??0,y=u>=2,b=n?ee:ee+1,z=new Float32Array(b*4*3),s=[],i=new X,R=new X,f=new X,M=new T,E=new T;for(let B=0;B<b;B+=1){const D=B/ee;C.getPoint(D,M);let j=1,A=1;if(d){const p=n?v:Math.max(1,v-1),S=Math.min(D*p,p-1e-6),x=Math.floor(S),I=S-x,_=r[x%v],$=r[(x+1)%v];j=_.x+($.x-_.x)*I,A=_.z+($.z-_.z)*I}if(y){const p=n?u:Math.max(1,u-1),S=Math.min(D*p,p-1e-6),x=Math.floor(S),I=S-x;R.setFromEuler(e[x%u]),f.setFromEuler(e[(x+1)%u]),i.copy(R).slerp(f,I)}else i.identity();const F=a*.5*j,L=a*.5*A,G=[[-F,0,-L],[F,0,-L],[F,0,L],[-F,0,L]],V=B*4;for(let p=0;p<4;p+=1){E.set(G[p][0],G[p][1],G[p][2]),E.applyQuaternion(i),E.add(M);const S=(V+p)*3;z[S]=E.x,z[S+1]=E.y,z[S+2]=E.z}for(let p=0;p<4;p+=1)s.push(V+p,V+(p+1)%4);const m=(B+1)%b;if(B<b-1||n){const p=m*4;for(let S=0;S<4;S+=1)s.push(V+S,p+S)}}const w=new fe;return w.setAttribute("position",new de(z,3)),w.setIndex(s),w},[t,e,r,o,n,a]);return c.useEffect(()=>()=>{l&&l.dispose()},[l]),l?k.jsx("lineSegments",{geometry:l,children:k.jsx("lineBasicMaterial",{color:g,transparent:!0,opacity:h,depthTest:!1})}):null}const Fe=`
  varying vec3 vWorldPos;

  void main() {
    vec4 wp   = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,De=`
  precision highp float;

  // ── Camera & time ──────────────────────────────────────────────────────────
  // cameraPosition is injected automatically by Three.js
  uniform float uTime;

  // ── Flame-space → world transform ──────────────────────────────────────────
  uniform mat4 uInvGroupWorld;   // world → flame-space

  // ── Volume bounds (in flame-space) ─────────────────────────────────────────
  uniform vec3 uBoundsMin;
  uniform vec3 uBoundsMax;

  // ── Fire appearance ────────────────────────────────────────────────────────
  uniform float uMagnitude;
  uniform float uLacunarity;
  uniform float uGain;
  uniform float uSpeed;
  uniform float uDensity;
  uniform float uBrightness;
  uniform float uSaturation;
  uniform vec3  uColorTint;

  // ── Core / border / smoke gradient colours ─────────────────────────────────
  uniform vec3 uCoreColor;
  uniform vec3 uBorderColor;
  uniform vec3 uSmokeColor;

  // ── Ember layer ────────────────────────────────────────────────────────────
  uniform float uEmberDensity;
  uniform float uEmberSize;
  uniform vec3  uEmberColor;

  // ── Control-point spline (up to 8 influence points, in flame-space) ────────
  #define MAX_CP 8
  uniform int   uCPCount;
  uniform vec3  uCPPos[MAX_CP];
  uniform vec3  uCPScale[MAX_CP];

  // ── Ray-march settings ─────────────────────────────────────────────────────
  uniform int   uSteps;
  uniform float uStepSize;

  varying vec3 vWorldPos;

  // ═══════════════════════════════════════════════════════════════════════════
  // Hash helpers
  // ═══════════════════════════════════════════════════════════════════════════
  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  vec3 hash33(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3-D gradient noise
  // ═══════════════════════════════════════════════════════════════════════════
  float gnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dot(hash33(i + vec3(0,0,0)), f - vec3(0,0,0)),
              dot(hash33(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
          mix(dot(hash33(i + vec3(0,1,0)), f - vec3(0,1,0)),
              dot(hash33(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
      mix(mix(dot(hash33(i + vec3(0,0,1)), f - vec3(0,0,1)),
              dot(hash33(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
          mix(dot(hash33(i + vec3(0,1,1)), f - vec3(0,1,1)),
              dot(hash33(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y),
      u.z);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // fBm turbulence – models the curling / vorticity detail lost in a discrete
  // Navier-Stokes simulation (CS184 §3.1)
  // ═══════════════════════════════════════════════════════════════════════════
  float turbulence(vec3 p) {
    float sum  = 0.0;
    float freq = 1.0;
    float amp  = 1.0;
    for (int i = 0; i < 5; i++) {
      sum  += abs(gnoise(p * freq)) * amp;
      freq *= uLacunarity;
      amp  *= uGain;
    }
    return sum;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Spline envelope – evaluates how deeply a flame-space point sits inside the
  // flame volume defined by the control-point polyline.
  // ═══════════════════════════════════════════════════════════════════════════
  struct EnvResult { float inside; float height; };

  EnvResult sampleEnvelope(vec3 p) {
    EnvResult res;
    res.inside = 0.0;
    res.height = 0.0;

    if (uCPCount < 2) {
      // Fallback: tapered cylinder centred on the bounds
      vec3 c  = (uBoundsMin + uBoundsMax) * 0.5;
      float h = (p.y - uBoundsMin.y) / max(0.001, uBoundsMax.y - uBoundsMin.y);
      float r = length(p.xz - c.xz) / max(0.001, (uBoundsMax.x - uBoundsMin.x) * 0.5);
      float taper = mix(1.0, 0.12, h * h);
      res.height  = clamp(h, 0.0, 1.0);
      res.inside  = smoothstep(1.0, 0.6, r / taper)
                   * smoothstep(-0.05, 0.1, h)
                   * smoothstep(1.1, 0.85, h);
      return res;
    }

    // ── Closest-point-on-polyline search ─────────────────────────────────────
    float bestDist  = 1e10;
    float bestT     = 0.0;
    vec3  bestScale = vec3(1.0);

    // First pass: total arc length
    float totalLen = 0.0;
    for (int i = 0; i < MAX_CP - 1; i++) {
      if (i >= uCPCount - 1) break;
      totalLen += length(uCPPos[i + 1] - uCPPos[i]);
    }
    if (totalLen < 0.001) totalLen = 1.0;

    // Second pass: project onto each segment
    float cumLen = 0.0;
    for (int i = 0; i < MAX_CP - 1; i++) {
      if (i >= uCPCount - 1) break;
      vec3  a      = uCPPos[i];
      vec3  b      = uCPPos[i + 1];
      vec3  ab     = b - a;
      float segLen = length(ab);
      if (segLen < 0.0001) { cumLen += segLen; continue; }

      float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
      float d = length(p - (a + ab * t));

      if (d < bestDist) {
        bestDist  = d;
        bestT     = (cumLen + t * segLen) / totalLen;
        bestScale = mix(uCPScale[i], uCPScale[i + 1], t);
      }
      cumLen += segLen;
    }

    // Envelope radius from the interpolated cross-section scale
    float maxR = max(bestScale.x, bestScale.z) * 0.5;
    if (maxR < 0.001) maxR = 0.5;

    // Taper toward the tip — quadratic falloff gives a natural flame shape
    float taper = mix(1.0, 0.06, bestT * bestT);
    float normR = bestDist / (maxR * taper);

    res.height = clamp(bestT, 0.0, 1.0);
    res.inside = smoothstep(1.0, 0.4, normR)
               * smoothstep(-0.02, 0.08, bestT)
               * smoothstep(1.05, 0.82, bestT);
    return res;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Fire colour from reaction coordinate (CS184 three-zone gradient)
  // ═══════════════════════════════════════════════════════════════════════════
  vec3 fireColor(float rc) {
    if (rc > 0.65) {
      float t = (rc - 0.65) / 0.35;
      return mix(uBorderColor, uCoreColor, t);
    } else if (rc > 0.25) {
      float t = (rc - 0.25) / 0.4;
      return mix(uSmokeColor, uBorderColor, t);
    } else {
      return mix(vec3(0.0), uSmokeColor, rc / 0.25);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Ember particles (CS184 §3.3 — noise-seeded advected sparks)
  // ═══════════════════════════════════════════════════════════════════════════
  float sampleEmbers(vec3 p, float time) {
    if (uEmberDensity < 0.001) return 0.0;
    vec3 ep = p;
    ep.y -= time * uSpeed * 1.8;
    ep *= 3.5 / max(uEmberSize, 0.01);

    vec3  cell  = floor(ep);
    float ember = 0.0;
    for (int dx = -1; dx <= 1; dx++)
    for (int dy = -1; dy <= 1; dy++)
    for (int dz = -1; dz <= 1; dz++) {
      vec3 nb   = cell + vec3(float(dx), float(dy), float(dz));
      float prob = hash13(nb);
      if (prob > uEmberDensity) continue;
      vec3 off   = hash33(nb + 97.0) * 0.5 + 0.5;
      float d    = length(ep - (nb + off));
      ember     += smoothstep(0.28, 0.0, d);
    }
    return clamp(ember, 0.0, 1.0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AABB ray intersection (slab method)
  // ═══════════════════════════════════════════════════════════════════════════
  vec2 boxHit(vec3 ro, vec3 rd, vec3 mn, vec3 mx) {
    vec3 inv  = 1.0 / rd;
    vec3 t0   = (mn - ro) * inv;
    vec3 t1   = (mx - ro) * inv;
    vec3 tMin = min(t0, t1);
    vec3 tMax = max(t0, t1);
    return vec2(max(tMin.x, max(tMin.y, tMin.z)),
                min(tMax.x, min(tMax.y, tMax.z)));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Main — ray-march loop
  // ═══════════════════════════════════════════════════════════════════════════
  void main() {
    // ── Build ray in world space, then convert to flame-space ─────────────
    vec3 wRo = cameraPosition;
    vec3 wRd = normalize(vWorldPos - cameraPosition);

    vec3 fRo = (uInvGroupWorld * vec4(wRo, 1.0)).xyz;
    vec3 fRd = normalize((uInvGroupWorld * vec4(wRd, 0.0)).xyz);

    // ── Intersect the flame-space AABB ───────────────────────────────────
    vec2 hit = boxHit(fRo, fRd, uBoundsMin, uBoundsMax);
    hit.x = max(hit.x, 0.0);
    if (hit.x >= hit.y) discard;

    // ── Adaptive step size ───────────────────────────────────────────────
    float diag   = length(uBoundsMax - uBoundsMin);
    float stepSz = uStepSize * diag / float(uSteps);
    float jitter = hash13(vWorldPos * 743.7 + uTime * 0.1) * stepSz;

    vec4 acc = vec4(0.0);

    for (int i = 0; i < 128; i++) {
      if (i >= uSteps) break;
      float t = hit.x + jitter + float(i) * stepSz;
      if (t > hit.y) break;

      vec3 fp = fRo + fRd * t;          // sample point in flame-space

      // ── Envelope test ──────────────────────────────────────────────────
      EnvResult env = sampleEnvelope(fp);
      if (env.inside < 0.001) continue;

      // ── Turbulence field (buoyancy-advected noise) ─────────────────────
      vec3 np  = fp;
      np.y    -= uTime * uSpeed;
      np      *= vec3(2.0, 1.5, 2.0);
      float tb = turbulence(np) * uMagnitude;

      // ── Reaction coordinate (fuel → colour) ────────────────────────────
      float rc = (1.0 - env.height);
      rc  = rc * rc;                            // sharpen hot core
      rc += tb * 0.15 * (1.0 - env.height);    // noise modulation
      rc *= env.inside;
      rc  = clamp(rc, 0.0, 1.0);

      // ── Density (smoke thickness) ──────────────────────────────────────
      float dn = env.inside;
      dn *= smoothstep(0.0, 0.12, env.height); // fade at very base
      dn *= 1.0 - tb * 0.3 * env.height;       // turbulent wisps at top
      dn  = clamp(dn, 0.0, 1.0) * uDensity * stepSz * 16.0;

      // ── Colour ─────────────────────────────────────────────────────────
      vec3 col = fireColor(rc) * uColorTint * uBrightness;
      float lm = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(lm), col, uSaturation);

      // Core glow boost
      col += uCoreColor * smoothstep(0.55, 1.0, rc) * env.inside * 0.6;

      // ── Embers ─────────────────────────────────────────────────────────
      float em = sampleEmbers(fp, uTime) * smoothstep(0.25, 0.75, env.height);
      col += uEmberColor * em * 2.5;
      dn  += em * 0.4 * uDensity * stepSz;

      // ── Front-to-back compositing ──────────────────────────────────────
      float a = clamp(dn, 0.0, 1.0);
      acc.rgb += col * a * (1.0 - acc.a);
      acc.a   += a * (1.0 - acc.a);
      if (acc.a > 0.97) break;
    }

    if (acc.a < 0.001) discard;
    gl_FragColor = acc;
  }
`,Be=5;function _e(t){return Array.from({length:t},()=>({pos:new T,scale:new T(1,1,1),rot:new X}))}function je(t,e,r,o,n,a){const g=e/2;for(let h=0;h<t.length;h++){const l=h/(t.length-1),C=l*l,v=r*(1-l*.25),d=o*(1-l*.25);t[h].pos.set(n*C,-g+l*e,a*C),t[h].scale.set(v,1,d)}}const U=new T,Q=new T,H=new T,N=new T,ie=new T,J=new T,ce=new me;function Le({position:t=[0,0,0],inverted:e=!1,width:r=.5,height:o=1.5,depth:n=.5,bendX:a=0,bendZ:g=0,animated:h=!0,animSpeed:l=.5,magnitude:C=1.3,lacunarity:v=2,gain:d=.5,speed:u=.8,density:y=1.2,brightness:b=1.8,saturation:z=1,tintColor:s="#ffffff",coreColor:i="#ffffcc",borderColor:R="#ff6600",smokeColor:f="#330000",emberDensity:M=.15,emberSize:E=.25,emberColor:w="#ff4400",steps:B=64,stepSize:D=1,controlPoints:j=null}){const A=c.useRef(),F=c.useRef(),L=c.useRef(0),G=c.useRef({x:a,z:g}),V=c.useRef(null);V.current||(V.current=_e(Be));const m=c.useMemo(()=>new xe({vertexShader:Fe,fragmentShader:De,uniforms:{uTime:{value:0},uInvGroupWorld:{value:new me},uBoundsMin:{value:new T(-.5,-.75,-.5)},uBoundsMax:{value:new T(.5,.75,.5)},uMagnitude:{value:C},uLacunarity:{value:v},uGain:{value:d},uSpeed:{value:u},uDensity:{value:y},uBrightness:{value:b},uSaturation:{value:z},uColorTint:{value:new q(s)},uCoreColor:{value:new q(i)},uBorderColor:{value:new q(R)},uSmokeColor:{value:new q(f)},uEmberDensity:{value:M},uEmberSize:{value:E},uEmberColor:{value:new q(w)},uSteps:{value:B},uStepSize:{value:D},uCPCount:{value:0},uCPPos:{value:Array.from({length:8},()=>new T)},uCPScale:{value:Array.from({length:8},()=>new T(1,1,1))}},side:ne,transparent:!0,depthWrite:!1,blending:he}),[]),p=c.useMemo(()=>new ye(1,1,1),[]);c.useEffect(()=>{const x=m.uniforms;x.uMagnitude.value=C,x.uLacunarity.value=v,x.uGain.value=d,x.uSpeed.value=u,x.uDensity.value=y,x.uBrightness.value=b,x.uSaturation.value=z,x.uSteps.value=B,x.uStepSize.value=D,x.uEmberDensity.value=M,x.uEmberSize.value=E},[m,C,v,d,u,y,b,z,B,D,M,E]),c.useEffect(()=>{m.uniforms.uColorTint.value.set(s)},[m,s]),c.useEffect(()=>{m.uniforms.uCoreColor.value.set(i)},[m,i]),c.useEffect(()=>{m.uniforms.uBorderColor.value.set(R)},[m,R]),c.useEffect(()=>{m.uniforms.uSmokeColor.value.set(f)},[m,f]),c.useEffect(()=>{m.uniforms.uEmberColor.value.set(w)},[m,w]),c.useEffect(()=>{G.current={x:a,z:g}},[a,g]),c.useEffect(()=>()=>{m.dispose(),p.dispose()},[m,p]),re(({clock:x},I)=>{const _=m.uniforms;_.uTime.value=x.getElapsedTime();let $;if(j&&j.length>=2)$=j;else{let W=G.current.x,P=G.current.z;if(h){L.current+=I*l;const O=L.current;W+=Math.sin(O*.8)*.14+Math.sin(O*2.1+.5)*.04,P+=Math.cos(O*.65+1.2)*.07+Math.cos(O*1.7)*.03}je(V.current,o,r,n,W,P),$=V.current}const K=Math.min($.length,8);_.uCPCount.value=K,H.set(1/0,1/0,1/0),N.set(-1/0,-1/0,-1/0);for(let W=0;W<K;W++){const P=$[W];P.pos instanceof T?U.copy(P.pos):Array.isArray(P.pos)?U.set(P.pos[0]||0,P.pos[1]||0,P.pos[2]||0):U.set(P.pos.x||0,P.pos.y||0,P.pos.z||0),P.scale instanceof T?Q.copy(P.scale):Array.isArray(P.scale)?Q.set(P.scale[0]||1,P.scale[1]||1,P.scale[2]||1):Q.set(P.scale.x||1,P.scale.y||1,P.scale.z||1),_.uCPPos.value[W].copy(U),_.uCPScale.value[W].copy(Q);const O=Math.max(Q.x,Q.z)*.75;H.min(U.clone().addScalar(-O)),N.max(U.clone().addScalar(O))}H.y-=.15,N.y+=o*.35,H.x-=.35,H.z-=.35,N.x+=.35,N.z+=.35,_.uBoundsMin.value.copy(H),_.uBoundsMax.value.copy(N),A.current&&(ie.addVectors(H,N).multiplyScalar(.5),J.subVectors(N,H),A.current.position.copy(ie),A.current.scale.set(Math.max(J.x,.01),Math.max(J.y,.01),Math.max(J.z,.01))),F.current&&(F.current.updateWorldMatrix(!0,!1),ce.copy(F.current.matrixWorld).invert(),_.uInvGroupWorld.value.copy(ce))});const S=j?0:o/2;return k.jsx("group",{position:t,rotation:e?[Math.PI,0,0]:[0,0,0],children:k.jsx("group",{ref:F,position:[0,S,0],children:k.jsx("mesh",{ref:A,geometry:p,material:m,frustumCulled:!1})})})}function Ie({points:t,config:e,showVolume:r}){const o=c.useMemo(()=>t.map(n=>({pos:n.position.clone(),scale:new T(e.fireWidth*(n.scale?.x??1),n.scale?.y??1,e.fireDepth*(n.scale?.z??1)),rot:new X().setFromEuler(n.rotation)})),[t,e.fireWidth,e.fireDepth]);return k.jsx(we,{controlPoints:o,sliceSpacing:e.fireSliceSpacing,magnitude:e.fireMagnitude,lacunarity:e.fireLacunarity,gain:e.fireGain,tintColor:e.fireTintColor,saturation:e.fireSaturation,brightness:e.fireBrightness,animated:e.fireAnimated,animSpeed:e.fireAnimSpeed,showVolume:r})}function Ve({points:t,config:e}){const r=c.useMemo(()=>t.map(o=>({pos:o.position.clone(),scale:new T(e.fireWidth*(o.scale?.x??1),o.scale?.y??1,e.fireDepth*(o.scale?.z??1)),rot:new X().setFromEuler(o.rotation)})),[t,e.fireWidth,e.fireDepth]);return k.jsx(Le,{controlPoints:r,magnitude:e.cs184Magnitude,lacunarity:e.cs184Lacunarity,gain:e.cs184Gain,speed:e.cs184Speed,density:e.cs184Density,brightness:e.cs184Brightness,saturation:e.cs184Saturation,tintColor:e.cs184TintColor,coreColor:e.cs184CoreColor,borderColor:e.cs184BorderColor,smokeColor:e.cs184SmokeColor,emberDensity:e.cs184EmberDensity,emberSize:e.cs184EmberSize,emberColor:e.cs184EmberColor,steps:e.cs184Steps,stepSize:e.cs184StepSize,animated:e.cs184Animated,animSpeed:e.cs184AnimSpeed})}function Qe({index:t,points:e,config:r,splineConfig:o,attractorsRef:n,setSplinePoints:a,allowedTypes:g="both"}){const h=c.useCallback(s=>a(t,s),[t,a]),l=c.useMemo(()=>e.map(s=>s.position),[e]),C=c.useMemo(()=>e.map(s=>s.rotation),[e]),v=c.useMemo(()=>e.map(s=>s.scale),[e]),d=c.useMemo(()=>({...r,...o}),[r,o]);if(!o.visible||g==="smoke"&&o.type==="Fire"||g==="fire"&&o.type==="Smoke")return null;const u=o.type==="Fire",y=o.type==="Smoke",{smokeType:b="Particle",fireType:z="Classic"}=o;return k.jsxs(k.Fragment,{children:[k.jsx(Ce,{points:e,setPoints:h,visible:o.showHelpers,mode:r.pointMode}),k.jsx(Se,{points:l,tension:o.tension,closed:o.closed,curveType:"catmullrom",color:"#aaaaaa",visible:o.showSpline,arcSegments:o.arcSegments}),y&&b==="Particle"&&k.jsx(ge,{points:l,pointRotations:C,pointScales:v,config:d,attractorsRef:n}),y&&b==="Volumetric"&&k.jsx(ze,{points:l,pointRotations:C,pointScales:v,config:d,attractorsRef:n}),y&&o.showSmokeVolume&&k.jsx(Ae,{points:l,pointRotations:C,pointScales:v,tension:o.tension,closed:o.closed,spread:Math.max(d.spawnSpread??0,d.volSpread??0)||120}),u&&z==="Classic"&&k.jsx(Ie,{points:e,config:d,showVolume:o.showFireVolume}),u&&z==="RayMarch"&&k.jsx(Ve,{points:e,config:d})]})}const Y={name:"",visible:!0,type:"Smoke",smokeType:"Particle",fireType:"Classic",tension:1,closed:!0,showSpline:!0,showHelpers:!0,arcSegments:200,showSmokeVolume:!1,showFireVolume:!1,particleCount:15e3,particleSize:.4,particleColor:"#7c7989",opacity:.045,growth:2,fadeExponent:1.2,buoyancy:.2,rotSpeed:.3,blendMode:"Normal",springK:5,flowSpeed:.04,damping:.12,turbulence:1.2,turbulenceSpeed:.3,spawnSpread:1.2,maxDrift:6,fadeRate:8,volParticleCount:12e3,volSize:.6,volColor:"#9090a0",volOpacity:.06,volBlendMode:"Normal",volSpread:1.2,volSpringK:2.5,volDamping:.1,volTurbulence:1.8,volTurbulenceSpeed:.25,volMaxDrift:9,volGrowth:1.5,volFadeExp:1.2,volBuoyancy:0,fireWidth:.8,fireHeight:2,fireDepth:.8,fireSliceSpacing:.04,fireMagnitude:1.3,fireLacunarity:2,fireGain:.5,fireTintColor:"#ffffff",fireSaturation:1,fireBrightness:1.5,fireAnimated:!0,fireAnimSpeed:.5,cs184Magnitude:1.3,cs184Lacunarity:2,cs184Gain:.5,cs184Speed:.8,cs184Density:1.2,cs184Brightness:1.8,cs184Saturation:1,cs184TintColor:"#ffffff",cs184CoreColor:"#ffffcc",cs184BorderColor:"#ff6600",cs184SmokeColor:"#330000",cs184EmberDensity:.15,cs184EmberSize:.25,cs184EmberColor:"#ff4400",cs184Steps:64,cs184StepSize:1,cs184Animated:!0,cs184AnimSpeed:.5};function Xe(t,e,r,o){t(n=>{const a=[...n];return a[e]={...a[e],[r]:o},a})}function Ke(t){let e=[];Array.isArray(t?.splines)?e=t.splines:t?.points&&(e=[t]);const r=e.map(n=>n.points.map(a=>({position:a.position.clone(),rotation:a.rotation?a.rotation.clone():new pe(0,0,0),scale:a.scale?a.scale.clone():new T(1,1,1)}))),o=e.map(n=>{const{points:a,...g}=n;let h={...g};return(g.type==="Particle"||g.type==="Volumetric")&&(h={...g,smokeType:g.type,type:"Smoke"}),{...Y,...h}});return{splines:r,splineConfigs:o}}function Je(t,e){return t.splines.reduce((r,o,n)=>{const a=t.splineConfigs[n]??Y;return(a.type??Y.type)!==e||(r.splines.push(o),r.splineConfigs.push(a)),r},{splines:[],splineConfigs:[]})}function Ye(t,e){return t.map((r,o)=>{const n=e[o]??Y,{showSpline:a,showHelpers:g,showSmokeVolume:h,showFireVolume:l,...C}=n,v=r.map(u=>{const y=u.position,b=u.rotation??new pe,z=u.scale??new T(1,1,1);return`    { position: new THREE.Vector3(${y.x.toFixed(3)}, ${y.y.toFixed(3)}, ${y.z.toFixed(3)}), rotation: new THREE.Euler(${b.x.toFixed(3)}, ${b.y.toFixed(3)}, ${b.z.toFixed(3)}), scale: new THREE.Vector3(${z.x.toFixed(3)}, ${z.y.toFixed(3)}, ${z.z.toFixed(3)}) }`});return`  {
${Object.entries(C).map(([u,y])=>typeof y=="string"?`    ${u}: '${y}'`:`    ${u}: ${y}`).join(`,
`)},
    points: [
${v.join(`,
`)}
    ]
  }`}).join(`,
`)}export{Le as C,Y as D,Oe as P,Qe as S,Ue as a,Je as f,Ke as p,Ye as s,Xe as u};
