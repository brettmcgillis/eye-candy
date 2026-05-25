import{r as c,aa as Ge,_ as Le,t as je,p as J,V as u,am as be,aG as We,o as De,j as E,Q as Se,aS as Ie,n as qe}from"./index-DBD_Xnl5.js";import{S as $e}from"./SmokeParticles-DlrwIw2r.js";import{S as He}from"./SmokeVolumeMesh-CSVH-SnM.js";import{V as Ue}from"./VolumetricSmokeParticles-BmwyNOHy.js";import{S as Ne}from"./SplineLine-B8NxGDtA.js";import{S as Oe}from"./SplinePoints-BqngxOLE.js";import{a8 as ze,u as g,F as ee,j as i,w as he,_ as G,S as Pe,i as H,f as I,L as re,l as C,U,m as X,s as Q,a9 as pe,aa as Me,v as ge,E as Ce,ab as Ee,h as Re,d as Ve}from"./three.tsl-CE3109Li.js";import{V as Xe}from"./VolumetricFire-B7voaF0o.js";const Qe=`
  varying vec3 vWorldPos;

  void main() {
    vec4 wp   = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,Je=`
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
`,Ke=5;function Ye(e){return Array.from({length:e},()=>({pos:new u,scale:new u(1,1,1),rot:new Se}))}function Ze(e,t,p,s,R,k){const F=t/2;for(let V=0;V<e.length;V++){const w=V/(e.length-1),A=w*w,M=p*(1-w*.25),a=s*(1-w*.25);e[V].pos.set(R*A,-F+w*t,k*A),e[V].scale.set(M,1,a)}}const ce=new u,ie=new u,te=new u,oe=new u,Ae=new u,ye=new u,Te=new be;function et({position:e=[0,0,0],inverted:t=!1,width:p=.5,height:s=1.5,depth:R=.5,bendX:k=0,bendZ:F=0,animated:V=!0,animSpeed:w=.5,magnitude:A=1.3,lacunarity:M=2,gain:a=.5,speed:o=.8,density:n=1.2,brightness:r=1.8,saturation:l=1,tintColor:f="#ffffff",coreColor:d="#ffffcc",borderColor:b="#ff6600",smokeColor:v="#330000",emberDensity:j=.15,emberSize:_=.25,emberColor:m="#ff4400",steps:W=64,stepSize:z=1,controlPoints:P=null}){const T=c.useRef(),x=c.useRef(),D=c.useRef(0),q=c.useRef({x:k,z:F}),N=c.useRef(null);N.current||(N.current=Ye(Ke));const S=c.useMemo(()=>new Ge({vertexShader:Qe,fragmentShader:Je,uniforms:{uTime:{value:0},uInvGroupWorld:{value:new be},uBoundsMin:{value:new u(-.5,-.75,-.5)},uBoundsMax:{value:new u(.5,.75,.5)},uMagnitude:{value:A},uLacunarity:{value:M},uGain:{value:a},uSpeed:{value:o},uDensity:{value:n},uBrightness:{value:r},uSaturation:{value:l},uColorTint:{value:new J(f)},uCoreColor:{value:new J(d)},uBorderColor:{value:new J(b)},uSmokeColor:{value:new J(v)},uEmberDensity:{value:j},uEmberSize:{value:_},uEmberColor:{value:new J(m)},uSteps:{value:W},uStepSize:{value:z},uCPCount:{value:0},uCPPos:{value:Array.from({length:8},()=>new u)},uCPScale:{value:Array.from({length:8},()=>new u(1,1,1))}},side:je,transparent:!0,depthWrite:!1,blending:Le}),[]),K=c.useMemo(()=>new We(1,1,1),[]);c.useEffect(()=>{const B=S.uniforms;B.uMagnitude.value=A,B.uLacunarity.value=M,B.uGain.value=a,B.uSpeed.value=o,B.uDensity.value=n,B.uBrightness.value=r,B.uSaturation.value=l,B.uSteps.value=W,B.uStepSize.value=z,B.uEmberDensity.value=j,B.uEmberSize.value=_},[S,A,M,a,o,n,r,l,W,z,j,_]),c.useEffect(()=>{S.uniforms.uColorTint.value.set(f)},[S,f]),c.useEffect(()=>{S.uniforms.uCoreColor.value.set(d)},[S,d]),c.useEffect(()=>{S.uniforms.uBorderColor.value.set(b)},[S,b]),c.useEffect(()=>{S.uniforms.uSmokeColor.value.set(v)},[S,v]),c.useEffect(()=>{S.uniforms.uEmberColor.value.set(m)},[S,m]),c.useEffect(()=>{q.current={x:k,z:F}},[k,F]),c.useEffect(()=>()=>{S.dispose(),K.dispose()},[S,K]),De(({clock:B},de)=>{const Y=S.uniforms;Y.uTime.value=B.getElapsedTime();let le;if(P&&P.length>=2)le=P;else{let O=q.current.x,y=q.current.z;if(V){D.current+=de*w;const L=D.current;O+=Math.sin(L*.8)*.14+Math.sin(L*2.1+.5)*.04,y+=Math.cos(L*.65+1.2)*.07+Math.cos(L*1.7)*.03}Ze(N.current,s,p,R,O,y),le=N.current}const ve=Math.min(le.length,8);Y.uCPCount.value=ve,te.set(1/0,1/0,1/0),oe.set(-1/0,-1/0,-1/0);for(let O=0;O<ve;O++){const y=le[O];y.pos instanceof u?ce.copy(y.pos):Array.isArray(y.pos)?ce.set(y.pos[0]||0,y.pos[1]||0,y.pos[2]||0):ce.set(y.pos.x||0,y.pos.y||0,y.pos.z||0),y.scale instanceof u?ie.copy(y.scale):Array.isArray(y.scale)?ie.set(y.scale[0]||1,y.scale[1]||1,y.scale[2]||1):ie.set(y.scale.x||1,y.scale.y||1,y.scale.z||1),Y.uCPPos.value[O].copy(ce),Y.uCPScale.value[O].copy(ie);const L=Math.max(ie.x,ie.z)*.75;te.min(ce.clone().addScalar(-L)),oe.max(ce.clone().addScalar(L))}te.y-=.15,oe.y+=s*.35,te.x-=.35,te.z-=.35,oe.x+=.35,oe.z+=.35,Y.uBoundsMin.value.copy(te),Y.uBoundsMax.value.copy(oe),T.current&&(Ae.addVectors(te,oe).multiplyScalar(.5),ye.subVectors(oe,te),T.current.position.copy(Ae),T.current.scale.set(Math.max(ye.x,.01),Math.max(ye.y,.01),Math.max(ye.z,.01))),x.current&&(x.current.updateWorldMatrix(!0,!1),Te.copy(x.current.matrixWorld).invert(),Y.uInvGroupWorld.value.copy(Te))});const h=P?0:s/2;return E.jsx("group",{position:e,rotation:t?[Math.PI,0,0]:[0,0,0],children:E.jsx("group",{ref:x,position:[0,h,0],children:E.jsx("mesh",{ref:T,geometry:K,material:S,frustumCulled:!1})})})}const fe=8,tt=128,ot=5;function at(e){return Array.from({length:e},()=>({pos:new u,scale:new u(1,1,1),rot:new Se}))}function st(e,t,p,s,R,k){const F=t/2;for(let V=0;V<e.length;V++){const w=V/(e.length-1),A=w*w,M=p*(1-w*.25),a=s*(1-w*.25);e[V].pos.set(R*A,-F+w*t,k*A),e[V].scale.set(M,1,a)}}function nt(e){const t=ee(([a])=>{const o=i(a).toVar();return o.assign(he(o.mul(.1031))),o.addAssign(G(o,o.zyx.add(31.32))),he(o.x.add(o.y).mul(o.z))}),p=ee(([a])=>{const o=i(G(a,i(127.1,311.7,74.7)),G(a,i(269.5,183.3,246.1)),G(a,i(113.5,271.9,124.6)));return he(o.sin().mul(43758.5453123)).mul(2).sub(1)}),s=ee(([a])=>{const o=Pe(a).toVar(),n=he(a).toVar(),r=n.mul(n).mul(i(3).sub(n.mul(2))).toVar();return H(H(H(G(p(o.add(i(0,0,0))),n.sub(i(0,0,0))),G(p(o.add(i(1,0,0))),n.sub(i(1,0,0))),r.x),H(G(p(o.add(i(0,1,0))),n.sub(i(0,1,0))),G(p(o.add(i(1,1,0))),n.sub(i(1,1,0))),r.x),r.y),H(H(G(p(o.add(i(0,0,1))),n.sub(i(0,0,1))),G(p(o.add(i(1,0,1))),n.sub(i(1,0,1))),r.x),H(G(p(o.add(i(0,1,1))),n.sub(i(0,1,1))),G(p(o.add(i(1,1,1))),n.sub(i(1,1,1))),r.x),r.y),r.z)}),R=ee(([a])=>{const o=I(0).toVar(),n=I(1).toVar(),r=I(1).toVar();return re({start:C(0),end:C(5),type:"int",condition:"<"},()=>{o.addAssign(s(a.mul(n)).abs().mul(r)),n.mulAssign(e.lacunarity),r.mulAssign(e.gain)}),o}),k=ee(([a])=>{const o=I(0).toVar(),n=I(0).toVar();return U(e.cpCount.lessThan(C(2)),()=>{const r=e.boundsMin.add(e.boundsMax).mul(.5).toVar(),l=a.y.sub(e.boundsMin.y).div(X(.001,e.boundsMax.y.sub(e.boundsMin.y))).toVar(),f=a.xz.sub(r.xz).length().div(X(.001,e.boundsMax.x.sub(e.boundsMin.x).mul(.5))).toVar(),d=H(1,.12,l.mul(l)).toVar();n.assign(l.clamp(0,1)),o.assign(Q(1,.6,f.div(d)).mul(Q(-.05,.1,l)).mul(Q(1.1,.85,l)))}).Else(()=>{const r=I(1e10).toVar(),l=I(0).toVar(),f=i(1,1,1).toVar(),d=I(0).toVar();re({start:C(0),end:C(fe-1),type:"int",condition:"<"},({i:m})=>{U(m.greaterThanEqual(e.cpCount.sub(C(1))),()=>pe()),d.addAssign(e.cpPos.element(m.add(C(1))).sub(e.cpPos.element(m)).length())}),U(d.lessThan(.001),()=>d.assign(1));const b=I(0).toVar();re({start:C(0),end:C(fe-1),type:"int",condition:"<"},({i:m})=>{U(m.greaterThanEqual(e.cpCount.sub(C(1))),()=>pe());const W=e.cpPos.element(m).toVar(),P=e.cpPos.element(m.add(C(1))).toVar().sub(W).toVar(),T=P.length().toVar();U(T.lessThan(1e-4),()=>{b.addAssign(T),Me()});const x=G(a.sub(W),P).div(X(1e-4,G(P,P))).clamp(0,1).toVar(),D=a.sub(W.add(P.mul(x))).length().toVar();U(D.lessThan(r),()=>{r.assign(D),l.assign(b.add(x.mul(T)).div(d)),f.assign(H(e.cpScale.element(m),e.cpScale.element(m.add(C(1))),x))}),b.addAssign(T)});const v=X(X(f.x,f.z).mul(.5),.001).toVar(),j=H(1,.06,l.mul(l)).toVar(),_=r.div(v.mul(j)).toVar();n.assign(l.clamp(0,1)),o.assign(Q(1,.4,_).mul(Q(-.02,.08,l)).mul(Q(1.05,.82,l)))}),ge(o,n)}),F=ee(([a])=>{const o=i(0,0,0).toVar();return U(a.greaterThan(.65),()=>{o.assign(H(e.borderColor,e.coreColor,a.sub(.65).div(.35).clamp(0,1)))}).ElseIf(a.greaterThan(.25),()=>{o.assign(H(e.smokeColor,e.borderColor,a.sub(.25).div(.4).clamp(0,1)))}).Else(()=>{o.assign(H(i(0,0,0),e.smokeColor,a.div(.25)))}),o}),V=ee(([a,o])=>{const n=I(0).toVar();return U(e.emberDensity.greaterThanEqual(.001),()=>{const r=i(a).toVar();r.y.subAssign(o.mul(e.speed).mul(1.8)),r.mulAssign(3.5).divAssign(X(e.emberSize,.01));const l=Pe(r).toVar();re({start:C(-1),end:C(2),name:"i",type:"int",condition:"<"},({i:f})=>{re({start:C(-1),end:C(2),name:"j",type:"int",condition:"<"},({j:d})=>{re({start:C(-1),end:C(2),name:"k",type:"int",condition:"<"},({k:b})=>{const v=l.add(i(f.toFloat(),d.toFloat(),b.toFloat())).toVar(),j=t(v).toVar();U(j.greaterThan(e.emberDensity),()=>Me());const _=p(v.add(97)).mul(.5).add(.5).toVar(),m=r.sub(v.add(_)).length().toVar();n.addAssign(Q(.28,0,m))})})})}),n.clamp(0,1)}),w=ee(([a,o,n,r])=>{const l=o.reciprocal().toVar(),f=n.sub(a).mul(l).toVar(),d=r.sub(a).mul(l).toVar(),b=Ce(f,d).toVar(),v=X(f,d).toVar();return ge(X(b.x,X(b.y,b.z)),Ce(v.x,Ce(v.y,v.z)))}),A=ee(()=>{const a=Ee.toVar(),o=Re.sub(Ee).normalize().toVar(),n=e.invGroupWorld.mul(Ve(a,1)).xyz.toVar(),r=e.invGroupWorld.mul(Ve(o,0)).xyz.normalize().toVar(),l=w(n,r,e.boundsMin,e.boundsMax).toVar();l.x.assign(X(l.x,0));const f=i(0,0,0).toVar(),d=I(0).toVar();return U(l.x.lessThan(l.y),()=>{const b=e.boundsMax.sub(e.boundsMin).length().toVar(),v=e.stepSize.mul(b).div(e.steps.toFloat()).toVar(),j=t(Re.mul(743.7).add(i(e.time.mul(.1)))).mul(v).toVar();re({start:C(0),end:C(tt),type:"int",condition:"<"},({i:_})=>{U(_.greaterThanEqual(e.steps),()=>pe());const m=l.x.add(j).add(_.toFloat().mul(v)).toVar();U(m.greaterThan(l.y),()=>pe());const W=n.add(r.mul(m)).toVar(),z=k(W).toVar();U(z.x.lessThan(.001),()=>Me());const P=i(W).toVar();P.y.subAssign(e.time.mul(e.speed)),P.mulAssign(i(2,1.5,2));const T=R(P).mul(e.magnitude).toVar(),x=I(1).sub(z.y).toVar();x.assign(x.mul(x)),x.addAssign(T.mul(.15).mul(I(1).sub(z.y))),x.mulAssign(z.x),x.assign(x.clamp(0,1));const D=ge(z.x,z.y).x.toVar();D.mulAssign(Q(0,.12,z.y)),D.mulAssign(I(1).sub(T.mul(.3).mul(z.y))),D.assign(D.clamp(0,1).mul(e.density).mul(v).mul(16));const q=F(x).mul(e.tintColor).mul(e.brightness).toVar(),N=G(q,i(.2126,.7152,.0722)).toVar();q.assign(H(i(N,N,N),q,e.saturation)),q.addAssign(e.coreColor.mul(Q(.55,1,x)).mul(z.x).mul(.6));const S=V(W,e.time).mul(Q(.25,.75,z.y)).toVar();q.addAssign(e.emberColor.mul(S).mul(2.5)),D.addAssign(S.mul(.4).mul(e.density).mul(v));const K=D.clamp(0,1).mul(I(1).sub(d)).toVar();f.addAssign(q.mul(K)),d.addAssign(K),U(d.greaterThan(.97),()=>pe())})}),Ve(f,d)})(),M=new Ie({transparent:!0,depthWrite:!1,toneMapped:!1,side:je,blending:Le});return M.colorNode=A.rgb,M.opacityNode=A.a,M.uniforms=e,M}const ue=new u,me=new u,Be=new u,ke=new u,ae=new u,se=new u,Fe=new u,xe=new u,_e=new be;function rt({position:e=[0,0,0],inverted:t=!1,width:p=.5,height:s=1.5,depth:R=.5,bendX:k=0,bendZ:F=0,animated:V=!0,animSpeed:w=.5,magnitude:A=1.3,lacunarity:M=2,gain:a=.5,speed:o=.8,density:n=1.2,brightness:r=1.8,saturation:l=1,tintColor:f="#ffffff",coreColor:d="#ffffcc",borderColor:b="#ff6600",smokeColor:v="#330000",emberDensity:j=.15,emberSize:_=.25,emberColor:m="#ff4400",steps:W=64,stepSize:z=1,controlPoints:P=null}){const T=c.useRef(),x=c.useRef(),D=c.useRef(0),q=c.useRef({x:k,z:F}),N=c.useRef(null),S=c.useRef(Array.from({length:fe},()=>new u)),K=c.useRef(Array.from({length:fe},()=>new u(1,1,1)));N.current||(N.current=at(ot));const h=c.useMemo(()=>({time:g(0),invGroupWorld:g(new be),boundsMin:g(new u(-.5,-.75,-.5)),boundsMax:g(new u(.5,.75,.5)),magnitude:g(A),lacunarity:g(M),gain:g(a),speed:g(o),density:g(n),brightness:g(r),saturation:g(l),tintColor:g(new J(f)),coreColor:g(new J(d)),borderColor:g(new J(b)),smokeColor:g(new J(v)),emberDensity:g(j),emberSize:g(_),emberColor:g(new J(m)),steps:g(W,"int"),stepSize:g(z),cpCount:g(0,"int"),cpPos:ze(S.current,"vec3"),cpScale:ze(K.current,"vec3")}),[]),B=c.useMemo(()=>new We(1,1,1),[]),de=c.useMemo(()=>nt(h),[h]);c.useEffect(()=>{h.magnitude.value=A,h.lacunarity.value=M,h.gain.value=a,h.speed.value=o,h.density.value=n,h.brightness.value=r,h.saturation.value=l,h.tintColor.value.set(f),h.coreColor.value.set(d),h.borderColor.value.set(b),h.smokeColor.value.set(v),h.emberDensity.value=j,h.emberSize.value=_,h.emberColor.value.set(m),h.steps.value=W,h.stepSize.value=z},[b,r,d,n,m,j,_,a,M,A,l,v,o,W,z,f,h]),c.useEffect(()=>{q.current={x:k,z:F}},[k,F]),c.useEffect(()=>()=>{B.dispose(),de.dispose()},[B,de]),De(({clock:le},ve)=>{h.time.value=le.getElapsedTime();let O;if(P&&P.length>=2)O=P;else{let L=q.current.x,ne=q.current.z;if(V){D.current+=ve*w;const $=D.current;L+=Math.sin($*.8)*.14+Math.sin($*2.1+.5)*.04,ne+=Math.cos($*.65+1.2)*.07+Math.cos($*1.7)*.03}st(N.current,s,p,R,L,ne),O=N.current}const y=Math.min(O.length,fe);h.cpCount.value=y,ae.set(1/0,1/0,1/0),se.set(-1/0,-1/0,-1/0);for(let L=0;L<y;L++){const ne=O[L],$=ne.pos??ne.position??ne,Z=ne.scale??[1,1,1];$ instanceof u?ue.copy($):Array.isArray($)?ue.set($[0]||0,$[1]||0,$[2]||0):ue.set($.x||0,$.y||0,$.z||0),Z instanceof u?me.copy(Z):Array.isArray(Z)?me.set(Z[0]||1,Z[1]||1,Z[2]||1):me.set(Z.x||1,Z.y||1,Z.z||1),S.current[L].copy(ue),K.current[L].copy(me);const we=Math.max(me.x,me.z)*.75;Be.copy(ue).addScalar(-we),ke.copy(ue).addScalar(we),ae.min(Be),se.max(ke)}ae.y-=.15,se.y+=s*.35,ae.x-=.35,ae.z-=.35,se.x+=.35,se.z+=.35,h.boundsMin.value.copy(ae),h.boundsMax.value.copy(se),T.current&&(Fe.addVectors(ae,se).multiplyScalar(.5),xe.subVectors(se,ae),T.current.position.copy(Fe),T.current.scale.set(Math.max(xe.x,.01),Math.max(xe.y,.01),Math.max(xe.z,.01))),x.current&&(x.current.updateWorldMatrix(!0,!1),_e.copy(x.current.matrixWorld).invert(),h.invGroupWorld.value.copy(_e))});const Y=P?0:s/2;return E.jsx("group",{position:e,rotation:t?[Math.PI,0,0]:[0,0,0],children:E.jsx("group",{ref:x,position:[0,Y,0],children:E.jsx("mesh",{ref:T,geometry:B,material:de,frustumCulled:!1})})})}function lt(e){return qe(s=>s.gl)?.isWebGPURenderer===!0?E.jsx(rt,{...e}):E.jsx(et,{...e})}function ct({points:e,config:t,showVolume:p}){const s=c.useMemo(()=>e.map(R=>({pos:R.position.clone(),scale:new u(t.fireWidth*(R.scale?.x??1),R.scale?.y??1,t.fireDepth*(R.scale?.z??1)),rot:new Se().setFromEuler(R.rotation)})),[e,t.fireWidth,t.fireDepth]);return E.jsx(Xe,{controlPoints:s,sliceSpacing:t.fireSliceSpacing,magnitude:t.fireMagnitude,lacunarity:t.fireLacunarity,gain:t.fireGain,tintColor:t.fireTintColor,saturation:t.fireSaturation,brightness:t.fireBrightness,animated:t.fireAnimated,animSpeed:t.fireAnimSpeed,showVolume:p})}function it({points:e,config:t}){const p=c.useMemo(()=>e.map(s=>({pos:s.position.clone(),scale:new u(t.fireWidth*(s.scale?.x??1),s.scale?.y??1,t.fireDepth*(s.scale?.z??1)),rot:new Se().setFromEuler(s.rotation)})),[e,t.fireWidth,t.fireDepth]);return E.jsx(lt,{controlPoints:p,magnitude:t.cs184Magnitude,lacunarity:t.cs184Lacunarity,gain:t.cs184Gain,speed:t.cs184Speed,density:t.cs184Density,brightness:t.cs184Brightness,saturation:t.cs184Saturation,tintColor:t.cs184TintColor,coreColor:t.cs184CoreColor,borderColor:t.cs184BorderColor,smokeColor:t.cs184SmokeColor,emberDensity:t.cs184EmberDensity,emberSize:t.cs184EmberSize,emberColor:t.cs184EmberColor,steps:t.cs184Steps,stepSize:t.cs184StepSize,animated:t.cs184Animated,animSpeed:t.cs184AnimSpeed})}function xt({index:e,points:t,config:p,splineConfig:s,attractorsRef:R,setSplinePoints:k,allowedTypes:F="both",splineColor:V="#aaaaaa",pointSize:w}){const A=c.useCallback(m=>k(e,m),[e,k]),M=c.useMemo(()=>t.map(m=>m.position),[t]),a=c.useMemo(()=>t.map(m=>m.rotation),[t]),o=c.useMemo(()=>t.map(m=>m.scale),[t]),n=c.useMemo(()=>({...p,...s}),[p,s]),r=s.type==="Particle"||s.type==="Volumetric",l=r?"Smoke":s.type,f=r?s.type:s.smokeType??"Particle",d=s.fireType??"Classic";if(!s.visible||F==="smoke"&&l==="Fire"||F==="fire"&&l==="Smoke")return null;const b=l==="Fire",v=l==="Smoke",j=v&&(f==="Particle"||f==="Both"),_=v&&(f==="Volumetric"||f==="Both");return E.jsxs(E.Fragment,{children:[E.jsx(Oe,{points:t,setPoints:A,visible:s.showHelpers,mode:p.pointMode??"translate",pointSize:w}),E.jsx(Ne,{points:M,tension:s.tension,closed:s.closed,curveType:"catmullrom",color:V,visible:s.showSpline,arcSegments:s.arcSegments}),j&&E.jsx($e,{points:M,pointRotations:a,pointScales:o,config:n,attractorsRef:R},n.prefillOnStart===!1?"queued":"prefilled"),_&&E.jsx(Ue,{points:M,pointRotations:a,pointScales:o,config:n,attractorsRef:R}),v&&s.showSmokeVolume&&E.jsx(He,{points:M,pointRotations:a,pointScales:o,tension:s.tension,closed:s.closed,spread:Math.max(n.spawnSpread??0,n.volSpread??0)||120}),b&&d==="Classic"&&E.jsx(ct,{points:t,config:n,showVolume:s.showFireVolume}),b&&d==="RayMarch"&&E.jsx(it,{points:t,config:n})]})}export{lt as C,xt as S};
