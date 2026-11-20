import{r as n,a5 as Ue,aY as We,F as De,C as J,V as d,I as ye,ar as Ie,a as Pe,j as y,Q as Se,Z as $e,b as we,a8 as qe,l as He}from"./index-DQZ6GwWS.js";import{F as Ne}from"./FireAndSmoke-mvSX62S2.js";import{S as Oe,V as Qe,d as Xe}from"./splineDefaults-CUb-ZqQS.js";import{a as Ye,S as Je}from"./SplinePoints-Cwc8vaiC.js";import{R as Re,u as E,F as ee,j as u,A as he,J as $,h as Ee,m as N,f as q,L as re,n as _,I as O,B as X,c as Y,aM as fe,b3 as Me,k as ge,ab as Ce,aL as Ae,w as Te,v as Ve}from"./three.tsl-BQ1Hwkua.js";import{m as Ke,V as Ze,g as et,a as tt,G as Be,f as ot,C as at,b as st}from"./VolumetricFireGPU-DhZAYGRk.js";const nt=`
  varying vec3 vWorldPos;

  void main() {
    vec4 wp   = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,rt=`
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
`,it=5;function ct(e){return Array.from({length:e},()=>({pos:new d,scale:new d(1,1,1),rot:new Se}))}function lt(e,t,m,s,A,T){const B=t/2;for(let P=0;P<e.length;P++){const w=P/(e.length-1),k=w*w,z=m*(1-w*.25),r=s*(1-w*.25);e[P].pos.set(A*k,-B+w*t,T*k),e[P].scale.set(z,1,r)}}const ce=new d,le=new d,te=new d,oe=new d,ke=new d,xe=new d,Fe=new ye;function ut({position:e=[0,0,0],inverted:t=!1,width:m=.5,height:s=1.5,depth:A=.5,bendX:T=0,bendZ:B=0,animated:P=!0,animSpeed:w=.5,magnitude:k=1.3,lacunarity:z=2,gain:r=.5,speed:o=.8,density:i=1.2,brightness:l=1.8,saturation:c=1,tintColor:v="#ffffff",coreColor:f="#ffffcc",borderColor:M="#ff6600",smokeColor:h="#330000",emberDensity:F=.15,emberSize:G=.25,emberColor:x="#ff4400",steps:g=64,stepSize:a=1,controlPoints:C=null}){const L=n.useRef(),b=n.useRef(),W=n.useRef(0),j=n.useRef({x:T,z:B}),R=n.useRef(null);R.current||(R.current=ct(it));const p=n.useMemo(()=>new Ue({vertexShader:nt,fragmentShader:rt,uniforms:{uTime:{value:0},uInvGroupWorld:{value:new ye},uBoundsMin:{value:new d(-.5,-.75,-.5)},uBoundsMax:{value:new d(.5,.75,.5)},uMagnitude:{value:k},uLacunarity:{value:z},uGain:{value:r},uSpeed:{value:o},uDensity:{value:i},uBrightness:{value:l},uSaturation:{value:c},uColorTint:{value:new J(v)},uCoreColor:{value:new J(f)},uBorderColor:{value:new J(M)},uSmokeColor:{value:new J(h)},uEmberDensity:{value:F},uEmberSize:{value:G},uEmberColor:{value:new J(x)},uSteps:{value:g},uStepSize:{value:a},uCPCount:{value:0},uCPPos:{value:Array.from({length:8},()=>new d)},uCPScale:{value:Array.from({length:8},()=>new d(1,1,1))}},side:De,transparent:!0,depthWrite:!1,blending:We}),[]),I=n.useMemo(()=>new Ie(1,1,1),[]);n.useEffect(()=>{const D=p.uniforms;D.uMagnitude.value=k,D.uLacunarity.value=z,D.uGain.value=r,D.uSpeed.value=o,D.uDensity.value=i,D.uBrightness.value=l,D.uSaturation.value=c,D.uSteps.value=g,D.uStepSize.value=a,D.uEmberDensity.value=F,D.uEmberSize.value=G},[p,k,z,r,o,i,l,c,g,a,F,G]),n.useEffect(()=>{p.uniforms.uColorTint.value.set(v)},[p,v]),n.useEffect(()=>{p.uniforms.uCoreColor.value.set(f)},[p,f]),n.useEffect(()=>{p.uniforms.uBorderColor.value.set(M)},[p,M]),n.useEffect(()=>{p.uniforms.uSmokeColor.value.set(h)},[p,h]),n.useEffect(()=>{p.uniforms.uEmberColor.value.set(x)},[p,x]),n.useEffect(()=>{j.current={x:T,z:B}},[T,B]),n.useEffect(()=>()=>{p.dispose(),I.dispose()},[p,I]),Pe(({clock:D},de)=>{const K=p.uniforms;K.uTime.value=D.getElapsedTime();let ie;if(C&&C.length>=2)ie=C;else{let Q=j.current.x,V=j.current.z;if(P){W.current+=de*w;const U=W.current;Q+=Math.sin(U*.8)*.14+Math.sin(U*2.1+.5)*.04,V+=Math.cos(U*.65+1.2)*.07+Math.cos(U*1.7)*.03}lt(R.current,s,m,A,Q,V),ie=R.current}const ve=Math.min(ie.length,8);K.uCPCount.value=ve,te.set(1/0,1/0,1/0),oe.set(-1/0,-1/0,-1/0);for(let Q=0;Q<ve;Q++){const V=ie[Q];V.pos instanceof d?ce.copy(V.pos):Array.isArray(V.pos)?ce.set(V.pos[0]||0,V.pos[1]||0,V.pos[2]||0):ce.set(V.pos.x||0,V.pos.y||0,V.pos.z||0),V.scale instanceof d?le.copy(V.scale):Array.isArray(V.scale)?le.set(V.scale[0]||1,V.scale[1]||1,V.scale[2]||1):le.set(V.scale.x||1,V.scale.y||1,V.scale.z||1),K.uCPPos.value[Q].copy(ce),K.uCPScale.value[Q].copy(le);const U=Math.max(le.x,le.z)*.75;te.min(ce.clone().addScalar(-U)),oe.max(ce.clone().addScalar(U))}te.y-=.15,oe.y+=s*.35,te.x-=.35,te.z-=.35,oe.x+=.35,oe.z+=.35,K.uBoundsMin.value.copy(te),K.uBoundsMax.value.copy(oe),L.current&&(ke.addVectors(te,oe).multiplyScalar(.5),xe.subVectors(oe,te),L.current.position.copy(ke),L.current.scale.set(Math.max(xe.x,.01),Math.max(xe.y,.01),Math.max(xe.z,.01))),b.current&&(b.current.updateWorldMatrix(!0,!1),Fe.copy(b.current.matrixWorld).invert(),K.uInvGroupWorld.value.copy(Fe))});const S=C?0:s/2;return y.jsx("group",{position:e,rotation:t?[Math.PI,0,0]:[0,0,0],children:y.jsx("group",{ref:b,position:[0,S,0],children:y.jsx("mesh",{ref:L,geometry:I,material:p,frustumCulled:!1})})})}const pe=8,mt=128,dt=5;function ft(e){return Array.from({length:e},()=>({pos:new d,scale:new d(1,1,1),rot:new Se}))}function pt(e,t,m,s,A,T){const B=t/2;for(let P=0;P<e.length;P++){const w=P/(e.length-1),k=w*w,z=m*(1-w*.25),r=s*(1-w*.25);e[P].pos.set(A*k,-B+w*t,T*k),e[P].scale.set(z,1,r)}}function vt(e){const t=ee(([r])=>{const o=u(r).toVar();return o.assign(he(o.mul(.1031))),o.addAssign($(o,o.zyx.add(31.32))),he(o.x.add(o.y).mul(o.z))}),m=ee(([r])=>{const o=u($(r,u(127.1,311.7,74.7)),$(r,u(269.5,183.3,246.1)),$(r,u(113.5,271.9,124.6)));return he(o.sin().mul(43758.5453123)).mul(2).sub(1)}),s=ee(([r])=>{const o=Ee(r).toVar(),i=he(r).toVar(),l=i.mul(i).mul(u(3).sub(i.mul(2))).toVar();return N(N(N($(m(o.add(u(0,0,0))),i.sub(u(0,0,0))),$(m(o.add(u(1,0,0))),i.sub(u(1,0,0))),l.x),N($(m(o.add(u(0,1,0))),i.sub(u(0,1,0))),$(m(o.add(u(1,1,0))),i.sub(u(1,1,0))),l.x),l.y),N(N($(m(o.add(u(0,0,1))),i.sub(u(0,0,1))),$(m(o.add(u(1,0,1))),i.sub(u(1,0,1))),l.x),N($(m(o.add(u(0,1,1))),i.sub(u(0,1,1))),$(m(o.add(u(1,1,1))),i.sub(u(1,1,1))),l.x),l.y),l.z)}),A=ee(([r])=>{const o=q(0).toVar(),i=q(1).toVar(),l=q(1).toVar();return re({start:_(0),end:_(5),type:"int",condition:"<"},()=>{o.addAssign(s(r.mul(i)).abs().mul(l)),i.mulAssign(e.lacunarity),l.mulAssign(e.gain)}),o}),T=ee(([r])=>{const o=q(0).toVar(),i=q(0).toVar();return O(e.cpCount.lessThan(_(2)),()=>{const l=e.boundsMin.add(e.boundsMax).mul(.5).toVar(),c=r.y.sub(e.boundsMin.y).div(X(.001,e.boundsMax.y.sub(e.boundsMin.y))).toVar(),v=r.xz.sub(l.xz).length().div(X(.001,e.boundsMax.x.sub(e.boundsMin.x).mul(.5))).toVar(),f=N(1,.12,c.mul(c)).toVar();i.assign(c.clamp(0,1)),o.assign(Y(1,.6,v.div(f)).mul(Y(-.05,.1,c)).mul(Y(1.1,.85,c)))}).Else(()=>{const l=q(1e10).toVar(),c=q(0).toVar(),v=u(1,1,1).toVar(),f=q(0).toVar();re({start:_(0),end:_(pe-1),type:"int",condition:"<"},({i:x})=>{O(x.greaterThanEqual(e.cpCount.sub(_(1))),()=>fe()),f.addAssign(e.cpPos.element(x.add(_(1))).sub(e.cpPos.element(x)).length())}),O(f.lessThan(.001),()=>f.assign(1));const M=q(0).toVar();re({start:_(0),end:_(pe-1),type:"int",condition:"<"},({i:x})=>{O(x.greaterThanEqual(e.cpCount.sub(_(1))),()=>fe());const g=e.cpPos.element(x).toVar(),C=e.cpPos.element(x.add(_(1))).toVar().sub(g).toVar(),L=C.length().toVar();O(L.lessThan(1e-4),()=>{M.addAssign(L),Me()});const b=$(r.sub(g),C).div(X(1e-4,$(C,C))).clamp(0,1).toVar(),W=r.sub(g.add(C.mul(b))).length().toVar();O(W.lessThan(l),()=>{l.assign(W),c.assign(M.add(b.mul(L)).div(f)),v.assign(N(e.cpScale.element(x),e.cpScale.element(x.add(_(1))),b))}),M.addAssign(L)});const h=X(X(v.x,v.z).mul(.5),.001).toVar(),F=N(1,.06,c.mul(c)).toVar(),G=l.div(h.mul(F)).toVar();i.assign(c.clamp(0,1)),o.assign(Y(1,.4,G).mul(Y(-.02,.08,c)).mul(Y(1.05,.82,c)))}),ge(o,i)}),B=ee(([r])=>{const o=u(0,0,0).toVar();return O(r.greaterThan(.65),()=>{o.assign(N(e.borderColor,e.coreColor,r.sub(.65).div(.35).clamp(0,1)))}).ElseIf(r.greaterThan(.25),()=>{o.assign(N(e.smokeColor,e.borderColor,r.sub(.25).div(.4).clamp(0,1)))}).Else(()=>{o.assign(N(u(0,0,0),e.smokeColor,r.div(.25)))}),o}),P=ee(([r,o])=>{const i=q(0).toVar();return O(e.emberDensity.greaterThanEqual(.001),()=>{const l=u(r).toVar();l.y.subAssign(o.mul(e.speed).mul(1.8)),l.mulAssign(3.5).divAssign(X(e.emberSize,.01));const c=Ee(l).toVar();re({start:_(-1),end:_(2),name:"i",type:"int",condition:"<"},({i:v})=>{re({start:_(-1),end:_(2),name:"j",type:"int",condition:"<"},({j:f})=>{re({start:_(-1),end:_(2),name:"k",type:"int",condition:"<"},({k:M})=>{const h=c.add(u(v.toFloat(),f.toFloat(),M.toFloat())).toVar(),F=t(h).toVar();O(F.greaterThan(e.emberDensity),()=>Me());const G=m(h.add(97)).mul(.5).add(.5).toVar(),x=l.sub(h.add(G)).length().toVar();i.addAssign(Y(.28,0,x))})})})}),i.clamp(0,1)}),w=ee(([r,o,i,l])=>{const c=o.reciprocal().toVar(),v=i.sub(r).mul(c).toVar(),f=l.sub(r).mul(c).toVar(),M=Ce(v,f).toVar(),h=X(v,f).toVar();return ge(X(M.x,X(M.y,M.z)),Ce(h.x,Ce(h.y,h.z)))}),k=ee(()=>{const r=Ae.toVar(),o=Te.sub(Ae).normalize().toVar(),i=e.invGroupWorld.mul(Ve(r,1)).xyz.toVar(),l=e.invGroupWorld.mul(Ve(o,0)).xyz.normalize().toVar(),c=w(i,l,e.boundsMin,e.boundsMax).toVar();c.x.assign(X(c.x,0));const v=u(0,0,0).toVar(),f=q(0).toVar();return O(c.x.lessThan(c.y),()=>{const M=e.boundsMax.sub(e.boundsMin).length().toVar(),h=e.stepSize.mul(M).div(e.steps.toFloat()).toVar(),F=t(Te.mul(743.7).add(u(e.time.mul(.1)))).mul(h).toVar();re({start:_(0),end:_(mt),type:"int",condition:"<"},({i:G})=>{O(G.greaterThanEqual(e.steps),()=>fe());const x=c.x.add(F).add(G.toFloat().mul(h)).toVar();O(x.greaterThan(c.y),()=>fe());const g=i.add(l.mul(x)).toVar(),a=T(g).toVar();O(a.x.lessThan(.001),()=>Me());const C=u(g).toVar();C.y.subAssign(e.time.mul(e.speed)),C.mulAssign(u(2,1.5,2));const L=A(C).mul(e.magnitude).toVar(),b=q(1).sub(a.y).toVar();b.assign(b.mul(b)),b.addAssign(L.mul(.15).mul(q(1).sub(a.y))),b.mulAssign(a.x),b.assign(b.clamp(0,1));const W=ge(a.x,a.y).x.toVar();W.mulAssign(Y(0,.12,a.y)),W.mulAssign(q(1).sub(L.mul(.3).mul(a.y))),W.assign(W.clamp(0,1).mul(e.density).mul(h).mul(16));const j=B(b).mul(e.tintColor).mul(e.brightness).toVar(),R=$(j,u(.2126,.7152,.0722)).toVar();j.assign(N(u(R,R,R),j,e.saturation)),j.addAssign(e.coreColor.mul(Y(.55,1,b)).mul(a.x).mul(.6));const p=P(g,e.time).mul(Y(.25,.75,a.y)).toVar();j.addAssign(e.emberColor.mul(p).mul(2.5)),W.addAssign(p.mul(.4).mul(e.density).mul(h));const I=W.clamp(0,1).mul(q(1).sub(f)).toVar();v.addAssign(j.mul(I)),f.addAssign(I),O(f.greaterThan(.97),()=>fe())})}),Ve(v,f)})(),z=new $e({transparent:!0,depthWrite:!1,toneMapped:!1,side:De,blending:We});return z.colorNode=k.rgb,z.opacityNode=k.a,z.uniforms=e,z}const ue=new d,me=new d,je=new d,_e=new d,ae=new d,se=new d,Ge=new d,be=new d,Le=new ye;function ht({position:e=[0,0,0],inverted:t=!1,width:m=.5,height:s=1.5,depth:A=.5,bendX:T=0,bendZ:B=0,animated:P=!0,animSpeed:w=.5,magnitude:k=1.3,lacunarity:z=2,gain:r=.5,speed:o=.8,density:i=1.2,brightness:l=1.8,saturation:c=1,tintColor:v="#ffffff",coreColor:f="#ffffcc",borderColor:M="#ff6600",smokeColor:h="#330000",emberDensity:F=.15,emberSize:G=.25,emberColor:x="#ff4400",steps:g=64,stepSize:a=1,controlPoints:C=null}){const L=n.useRef(),b=n.useRef(),W=n.useRef(0),j=n.useRef({x:T,z:B}),R=n.useRef(null),p=n.useRef(Array.from({length:pe},()=>new d)),I=n.useRef(Array.from({length:pe},()=>new d(1,1,1)));R.current||(R.current=ft(dt));const S=n.useMemo(()=>({time:E(0),invGroupWorld:E(new ye),boundsMin:E(new d(-.5,-.75,-.5)),boundsMax:E(new d(.5,.75,.5)),magnitude:E(k),lacunarity:E(z),gain:E(r),speed:E(o),density:E(i),brightness:E(l),saturation:E(c),tintColor:E(new J(v)),coreColor:E(new J(f)),borderColor:E(new J(M)),smokeColor:E(new J(h)),emberDensity:E(F),emberSize:E(G),emberColor:E(new J(x)),steps:E(g,"int"),stepSize:E(a),cpCount:E(0,"int"),cpPos:Re(p.current,"vec3"),cpScale:Re(I.current,"vec3")}),[]),D=n.useMemo(()=>new Ie(1,1,1),[]),de=n.useMemo(()=>vt(S),[S]);n.useEffect(()=>{S.magnitude.value=k,S.lacunarity.value=z,S.gain.value=r,S.speed.value=o,S.density.value=i,S.brightness.value=l,S.saturation.value=c,S.tintColor.value.set(v),S.coreColor.value.set(f),S.borderColor.value.set(M),S.smokeColor.value.set(h),S.emberDensity.value=F,S.emberSize.value=G,S.emberColor.value.set(x),S.steps.value=g,S.stepSize.value=a},[M,l,f,i,x,F,G,r,z,k,c,h,o,g,a,v,S]),n.useEffect(()=>{j.current={x:T,z:B}},[T,B]),n.useEffect(()=>()=>{D.dispose(),de.dispose()},[D,de]),Pe(({clock:ie},ve)=>{S.time.value=ie.getElapsedTime();let Q;if(C&&C.length>=2)Q=C;else{let U=j.current.x,ne=j.current.z;if(P){W.current+=ve*w;const H=W.current;U+=Math.sin(H*.8)*.14+Math.sin(H*2.1+.5)*.04,ne+=Math.cos(H*.65+1.2)*.07+Math.cos(H*1.7)*.03}pt(R.current,s,m,A,U,ne),Q=R.current}const V=Math.min(Q.length,pe);S.cpCount.value=V,ae.set(1/0,1/0,1/0),se.set(-1/0,-1/0,-1/0);for(let U=0;U<V;U++){const ne=Q[U],H=ne.pos??ne.position??ne,Z=ne.scale??[1,1,1];H instanceof d?ue.copy(H):Array.isArray(H)?ue.set(H[0]||0,H[1]||0,H[2]||0):ue.set(H.x||0,H.y||0,H.z||0),Z instanceof d?me.copy(Z):Array.isArray(Z)?me.set(Z[0]||1,Z[1]||1,Z[2]||1):me.set(Z.x||1,Z.y||1,Z.z||1),p.current[U].copy(ue),I.current[U].copy(me);const ze=Math.max(me.x,me.z)*.75;je.copy(ue).addScalar(-ze),_e.copy(ue).addScalar(ze),ae.min(je),se.max(_e)}ae.y-=.15,se.y+=s*.35,ae.x-=.35,ae.z-=.35,se.x+=.35,se.z+=.35,S.boundsMin.value.copy(ae),S.boundsMax.value.copy(se),L.current&&(Ge.addVectors(ae,se).multiplyScalar(.5),be.subVectors(se,ae),L.current.position.copy(Ge),L.current.scale.set(Math.max(be.x,.01),Math.max(be.y,.01),Math.max(be.z,.01))),b.current&&(b.current.updateWorldMatrix(!0,!1),Le.copy(b.current.matrixWorld).invert(),S.invGroupWorld.value.copy(Le))});const K=C?0:s/2;return y.jsx("group",{position:e,rotation:t?[Math.PI,0,0]:[0,0,0],children:y.jsx("group",{ref:b,position:[0,K,0],children:y.jsx("mesh",{ref:L,geometry:D,material:de,frustumCulled:!1})})})}function xt(e){return we(s=>s.gl)?.isWebGPURenderer===!0?y.jsx(ht,{...e}):y.jsx(ut,{...e})}function bt({guideGeo:e}){return y.jsx("line",{geometry:e,children:y.jsx("lineBasicMaterial",{color:4500223,transparent:!0,opacity:.7})})}function yt({position:e=[0,0,0],inverted:t=!1,width:m=.35,height:s=1,depth:A=.35,sliceSpacing:T=.05,segments:B=24,bendX:P=0,bendZ:w=0,animated:k=!0,animSpeed:z=.5,showSpline:r=!1,showVolume:o=!1,magnitude:i=1.3,lacunarity:l=2,gain:c=.5,tintColor:v="#ffffff",saturation:f=1,brightness:M=1.5,controlPoints:h=null}){const{camera:F}=we(),G=n.useRef(0),x=n.useRef({x:P,z:w}),g=n.useRef(null);g.current||(g.current=Ke(at));const a=n.useMemo(()=>new Ze({width:m,height:s,depth:A,sliceSpacing:T,segments:B,camera:F,textureNoise:tt(),textureProfile:et()}),[F,B]);n.useEffect(()=>{a.material.uniforms.magnitude.value=i,a.material.uniforms.lacunarity.value=l,a.material.uniforms.gain.value=c},[a,i,l,c]),n.useEffect(()=>{a.material.uniforms.colorTint.value.set(v)},[a,v]),n.useEffect(()=>{a.material.uniforms.saturation.value=f,a.material.uniforms.brightness.value=M},[a,f,M]),n.useEffect(()=>{a._sliceSpacing=T},[a,T]),n.useEffect(()=>{a.setShowVolume(o)},[a,o]),n.useEffect(()=>{x.current={x:P,z:w}},[P,w]),n.useEffect(()=>()=>{a.geometry.dispose(),a.material.dispose()},[a]);const C=n.useMemo(()=>{const b=new qe;return b.setAttribute("position",new He(new Float32Array(Be*3),3)),b},[]);n.useEffect(()=>()=>C.dispose(),[C]),Pe(({clock:b},W)=>{if(h)a.setControlPoints(h);else{let j=x.current.x,R=x.current.z;if(k){G.current+=W*z;const p=G.current;j+=Math.sin(p*.8)*.14+Math.sin(p*2.1+.5)*.04,R+=Math.cos(p*.65+1.2)*.07+Math.cos(p*1.7)*.03}ot(g.current,s,m,A,j,R),a.setControlPoints(g.current)}if(a.update(b.getElapsedTime()),r){const j=a._posCurve;if(j?.points?.length>1){const R=j.getPoints(Be-1),p=C.attributes.position;for(let I=0;I<R.length;I+=1)p.setXYZ(I,R[I].x,R[I].y,R[I].z);p.needsUpdate=!0}}});const L=h?0:s/2;return y.jsx("group",{position:e,rotation:t?[Math.PI,0,0]:[0,0,0],children:y.jsxs("group",{position:[0,L,0],children:[y.jsx("primitive",{object:a}),r&&y.jsx(bt,{guideGeo:C})]})})}function St(e){return we(s=>s.gl)?.isWebGPURenderer===!0?y.jsx(st,{...e}):y.jsx(yt,{...e})}function Mt({points:e,config:t,showVolume:m}){const s=n.useMemo(()=>e.map(A=>({pos:A.position.clone(),scale:new d(t.fireWidth*(A.scale?.x??1),A.scale?.y??1,t.fireDepth*(A.scale?.z??1)),rot:new Se().setFromEuler(A.rotation)})),[e,t.fireWidth,t.fireDepth]);return y.jsx(St,{controlPoints:s,sliceSpacing:t.fireSliceSpacing,magnitude:t.fireMagnitude,lacunarity:t.fireLacunarity,gain:t.fireGain,tintColor:t.fireTintColor,saturation:t.fireSaturation,brightness:t.fireBrightness,animated:t.fireAnimated,animSpeed:t.fireAnimSpeed,showVolume:m})}function gt({points:e,config:t}){const m=n.useMemo(()=>e.map(s=>({pos:s.position.clone(),scale:new d(t.fireWidth*(s.scale?.x??1),s.scale?.y??1,t.fireDepth*(s.scale?.z??1)),rot:new Se().setFromEuler(s.rotation)})),[e,t.fireWidth,t.fireDepth]);return y.jsx(xt,{controlPoints:m,magnitude:t.cs184Magnitude,lacunarity:t.cs184Lacunarity,gain:t.cs184Gain,speed:t.cs184Speed,density:t.cs184Density,brightness:t.cs184Brightness,saturation:t.cs184Saturation,tintColor:t.cs184TintColor,coreColor:t.cs184CoreColor,borderColor:t.cs184BorderColor,smokeColor:t.cs184SmokeColor,emberDensity:t.cs184EmberDensity,emberSize:t.cs184EmberSize,emberColor:t.cs184EmberColor,steps:t.cs184Steps,stepSize:t.cs184StepSize,animated:t.cs184Animated,animSpeed:t.cs184AnimSpeed})}function Et({index:e,points:t,config:m,splineConfig:s,attractorsRef:A,setSplinePoints:T,allowedTypes:B="both",splineColor:P="#aaaaaa",pointSize:w}){const k=n.useCallback(a=>T(e,a),[e,T]),z=n.useMemo(()=>t.map(a=>a.position),[t]),r=n.useMemo(()=>t.map(a=>a.rotation),[t]),o=n.useMemo(()=>t.map(a=>a.scale),[t]),i=n.useMemo(()=>({...m,...s}),[m,s]),l=s.type==="Particle"||s.type==="Volumetric",c=l?"Smoke":s.type,v=l?s.type:s.smokeType??"Particle",f=s.fireType??"Classic",M=c==="FireAndSmoke";if(!s.visible||B==="smoke"&&c==="Fire"||B==="fire"&&c==="Smoke"||B!=="both"&&M)return null;const h=c==="Fire",F=c==="Smoke",G=F&&(v==="Particle"||v==="Both"),x=F&&(v==="Volumetric"||v==="Both"),g=i.enableAttractors===!1?null:A;return y.jsxs(y.Fragment,{children:[y.jsx(Ye,{points:t,setPoints:k,visible:s.showHelpers,mode:m.pointMode??"translate",pointSize:w}),y.jsx(Je,{points:z,tension:s.tension,closed:s.closed,curveType:"catmullrom",color:P,visible:s.showSpline,arcSegments:s.arcSegments}),G&&y.jsx(Oe,{points:z,pointRotations:r,pointScales:o,config:i,attractorsRef:g},i.prefillOnStart===!1?"queued":"prefilled"),x&&y.jsx(Qe,{points:z,pointRotations:r,pointScales:o,config:i,attractorsRef:g}),F&&s.showSmokeVolume&&y.jsx(Xe,{points:z,pointRotations:r,pointScales:o,tension:s.tension,closed:s.closed,spread:Math.max(i.spawnSpread??0,i.volSpread??0)||120}),M&&y.jsx(Ne,{controlPoints:t,...i,attractorsRef:g,attractorStrength:m.attractorStrength,attractorRadius:m.attractorRadius}),h&&f==="Classic"&&y.jsx(Mt,{points:t,config:i,showVolume:s.showFireVolume}),h&&f==="RayMarch"&&y.jsx(gt,{points:t,config:i})]})}export{xt as C,Et as S,St as V};
