import{r as l,ab as Ge,a0 as Le,w as _e,q as J,V as u,M as ye,b3 as We,n as De,j as w,Q as Se,bg as qe,m as Ie}from"./index-DR3zOQ_r.js";import{S as $e,F as He}from"./SmokeVolumeMesh-aEyhLFWw.js";import{S as Ue}from"./SmokeParticles-Er5RkJjZ.js";import{V as Ne}from"./VolumetricSmokeParticles-B9--P6xM.js";import{a as Oe,S as Xe}from"./SplinePoints-DbSTI16h.js";import{a9 as ze,u as C,F as ee,j as i,w as he,a1 as G,S as Pe,i as H,f as q,L as re,l as V,U,m as X,s as Q,aa as fe,ab as Me,v as ge,E as Ce,ac as Re,h as Ae,d as Ve}from"./three.tsl-DcctBAm2.js";import{V as Qe}from"./VolumetricFire-Jtn8ush2.js";const Je=`
  varying vec3 vWorldPos;

  void main() {
    vec4 wp   = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,Ke=`
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
`,Ye=5;function Ze(e){return Array.from({length:e},()=>({pos:new u,scale:new u(1,1,1),rot:new Se}))}function et(e,t,m,n,T,L){const B=t/2;for(let z=0;z<e.length;z++){const P=z/(e.length-1),E=P*P,g=m*(1-P*.25),a=n*(1-P*.25);e[z].pos.set(T*E,-B+P*t,L*E),e[z].scale.set(g,1,a)}}const le=new u,ie=new u,te=new u,oe=new u,Ee=new u,be=new u,Te=new ye;function tt({position:e=[0,0,0],inverted:t=!1,width:m=.5,height:n=1.5,depth:T=.5,bendX:L=0,bendZ:B=0,animated:z=!0,animSpeed:P=.5,magnitude:E=1.3,lacunarity:g=2,gain:a=.5,speed:o=.8,density:s=1.2,brightness:c=1.8,saturation:r=1,tintColor:p="#ffffff",coreColor:d="#ffffcc",borderColor:S="#ff6600",smokeColor:h="#330000",emberDensity:k=.15,emberSize:_=.25,emberColor:b="#ff4400",steps:R=64,stepSize:f=1,controlPoints:A=null}){const F=l.useRef(),y=l.useRef(),D=l.useRef(0),I=l.useRef({x:L,z:B}),N=l.useRef(null);N.current||(N.current=Ze(Ye));const M=l.useMemo(()=>new Ge({vertexShader:Je,fragmentShader:Ke,uniforms:{uTime:{value:0},uInvGroupWorld:{value:new ye},uBoundsMin:{value:new u(-.5,-.75,-.5)},uBoundsMax:{value:new u(.5,.75,.5)},uMagnitude:{value:E},uLacunarity:{value:g},uGain:{value:a},uSpeed:{value:o},uDensity:{value:s},uBrightness:{value:c},uSaturation:{value:r},uColorTint:{value:new J(p)},uCoreColor:{value:new J(d)},uBorderColor:{value:new J(S)},uSmokeColor:{value:new J(h)},uEmberDensity:{value:k},uEmberSize:{value:_},uEmberColor:{value:new J(b)},uSteps:{value:R},uStepSize:{value:f},uCPCount:{value:0},uCPPos:{value:Array.from({length:8},()=>new u)},uCPScale:{value:Array.from({length:8},()=>new u(1,1,1))}},side:_e,transparent:!0,depthWrite:!1,blending:Le}),[]),K=l.useMemo(()=>new We(1,1,1),[]);l.useEffect(()=>{const j=M.uniforms;j.uMagnitude.value=E,j.uLacunarity.value=g,j.uGain.value=a,j.uSpeed.value=o,j.uDensity.value=s,j.uBrightness.value=c,j.uSaturation.value=r,j.uSteps.value=R,j.uStepSize.value=f,j.uEmberDensity.value=k,j.uEmberSize.value=_},[M,E,g,a,o,s,c,r,R,f,k,_]),l.useEffect(()=>{M.uniforms.uColorTint.value.set(p)},[M,p]),l.useEffect(()=>{M.uniforms.uCoreColor.value.set(d)},[M,d]),l.useEffect(()=>{M.uniforms.uBorderColor.value.set(S)},[M,S]),l.useEffect(()=>{M.uniforms.uSmokeColor.value.set(h)},[M,h]),l.useEffect(()=>{M.uniforms.uEmberColor.value.set(b)},[M,b]),l.useEffect(()=>{I.current={x:L,z:B}},[L,B]),l.useEffect(()=>()=>{M.dispose(),K.dispose()},[M,K]),De(({clock:j},de)=>{const Y=M.uniforms;Y.uTime.value=j.getElapsedTime();let ce;if(A&&A.length>=2)ce=A;else{let O=I.current.x,x=I.current.z;if(z){D.current+=de*P;const W=D.current;O+=Math.sin(W*.8)*.14+Math.sin(W*2.1+.5)*.04,x+=Math.cos(W*.65+1.2)*.07+Math.cos(W*1.7)*.03}et(N.current,n,m,T,O,x),ce=N.current}const ve=Math.min(ce.length,8);Y.uCPCount.value=ve,te.set(1/0,1/0,1/0),oe.set(-1/0,-1/0,-1/0);for(let O=0;O<ve;O++){const x=ce[O];x.pos instanceof u?le.copy(x.pos):Array.isArray(x.pos)?le.set(x.pos[0]||0,x.pos[1]||0,x.pos[2]||0):le.set(x.pos.x||0,x.pos.y||0,x.pos.z||0),x.scale instanceof u?ie.copy(x.scale):Array.isArray(x.scale)?ie.set(x.scale[0]||1,x.scale[1]||1,x.scale[2]||1):ie.set(x.scale.x||1,x.scale.y||1,x.scale.z||1),Y.uCPPos.value[O].copy(le),Y.uCPScale.value[O].copy(ie);const W=Math.max(ie.x,ie.z)*.75;te.min(le.clone().addScalar(-W)),oe.max(le.clone().addScalar(W))}te.y-=.15,oe.y+=n*.35,te.x-=.35,te.z-=.35,oe.x+=.35,oe.z+=.35,Y.uBoundsMin.value.copy(te),Y.uBoundsMax.value.copy(oe),F.current&&(Ee.addVectors(te,oe).multiplyScalar(.5),be.subVectors(oe,te),F.current.position.copy(Ee),F.current.scale.set(Math.max(be.x,.01),Math.max(be.y,.01),Math.max(be.z,.01))),y.current&&(y.current.updateWorldMatrix(!0,!1),Te.copy(y.current.matrixWorld).invert(),Y.uInvGroupWorld.value.copy(Te))});const v=A?0:n/2;return w.jsx("group",{position:e,rotation:t?[Math.PI,0,0]:[0,0,0],children:w.jsx("group",{ref:y,position:[0,v,0],children:w.jsx("mesh",{ref:F,geometry:K,material:M,frustumCulled:!1})})})}const pe=8,ot=128,at=5;function st(e){return Array.from({length:e},()=>({pos:new u,scale:new u(1,1,1),rot:new Se}))}function nt(e,t,m,n,T,L){const B=t/2;for(let z=0;z<e.length;z++){const P=z/(e.length-1),E=P*P,g=m*(1-P*.25),a=n*(1-P*.25);e[z].pos.set(T*E,-B+P*t,L*E),e[z].scale.set(g,1,a)}}function rt(e){const t=ee(([a])=>{const o=i(a).toVar();return o.assign(he(o.mul(.1031))),o.addAssign(G(o,o.zyx.add(31.32))),he(o.x.add(o.y).mul(o.z))}),m=ee(([a])=>{const o=i(G(a,i(127.1,311.7,74.7)),G(a,i(269.5,183.3,246.1)),G(a,i(113.5,271.9,124.6)));return he(o.sin().mul(43758.5453123)).mul(2).sub(1)}),n=ee(([a])=>{const o=Pe(a).toVar(),s=he(a).toVar(),c=s.mul(s).mul(i(3).sub(s.mul(2))).toVar();return H(H(H(G(m(o.add(i(0,0,0))),s.sub(i(0,0,0))),G(m(o.add(i(1,0,0))),s.sub(i(1,0,0))),c.x),H(G(m(o.add(i(0,1,0))),s.sub(i(0,1,0))),G(m(o.add(i(1,1,0))),s.sub(i(1,1,0))),c.x),c.y),H(H(G(m(o.add(i(0,0,1))),s.sub(i(0,0,1))),G(m(o.add(i(1,0,1))),s.sub(i(1,0,1))),c.x),H(G(m(o.add(i(0,1,1))),s.sub(i(0,1,1))),G(m(o.add(i(1,1,1))),s.sub(i(1,1,1))),c.x),c.y),c.z)}),T=ee(([a])=>{const o=q(0).toVar(),s=q(1).toVar(),c=q(1).toVar();return re({start:V(0),end:V(5),type:"int",condition:"<"},()=>{o.addAssign(n(a.mul(s)).abs().mul(c)),s.mulAssign(e.lacunarity),c.mulAssign(e.gain)}),o}),L=ee(([a])=>{const o=q(0).toVar(),s=q(0).toVar();return U(e.cpCount.lessThan(V(2)),()=>{const c=e.boundsMin.add(e.boundsMax).mul(.5).toVar(),r=a.y.sub(e.boundsMin.y).div(X(.001,e.boundsMax.y.sub(e.boundsMin.y))).toVar(),p=a.xz.sub(c.xz).length().div(X(.001,e.boundsMax.x.sub(e.boundsMin.x).mul(.5))).toVar(),d=H(1,.12,r.mul(r)).toVar();s.assign(r.clamp(0,1)),o.assign(Q(1,.6,p.div(d)).mul(Q(-.05,.1,r)).mul(Q(1.1,.85,r)))}).Else(()=>{const c=q(1e10).toVar(),r=q(0).toVar(),p=i(1,1,1).toVar(),d=q(0).toVar();re({start:V(0),end:V(pe-1),type:"int",condition:"<"},({i:b})=>{U(b.greaterThanEqual(e.cpCount.sub(V(1))),()=>fe()),d.addAssign(e.cpPos.element(b.add(V(1))).sub(e.cpPos.element(b)).length())}),U(d.lessThan(.001),()=>d.assign(1));const S=q(0).toVar();re({start:V(0),end:V(pe-1),type:"int",condition:"<"},({i:b})=>{U(b.greaterThanEqual(e.cpCount.sub(V(1))),()=>fe());const R=e.cpPos.element(b).toVar(),A=e.cpPos.element(b.add(V(1))).toVar().sub(R).toVar(),F=A.length().toVar();U(F.lessThan(1e-4),()=>{S.addAssign(F),Me()});const y=G(a.sub(R),A).div(X(1e-4,G(A,A))).clamp(0,1).toVar(),D=a.sub(R.add(A.mul(y))).length().toVar();U(D.lessThan(c),()=>{c.assign(D),r.assign(S.add(y.mul(F)).div(d)),p.assign(H(e.cpScale.element(b),e.cpScale.element(b.add(V(1))),y))}),S.addAssign(F)});const h=X(X(p.x,p.z).mul(.5),.001).toVar(),k=H(1,.06,r.mul(r)).toVar(),_=c.div(h.mul(k)).toVar();s.assign(r.clamp(0,1)),o.assign(Q(1,.4,_).mul(Q(-.02,.08,r)).mul(Q(1.05,.82,r)))}),ge(o,s)}),B=ee(([a])=>{const o=i(0,0,0).toVar();return U(a.greaterThan(.65),()=>{o.assign(H(e.borderColor,e.coreColor,a.sub(.65).div(.35).clamp(0,1)))}).ElseIf(a.greaterThan(.25),()=>{o.assign(H(e.smokeColor,e.borderColor,a.sub(.25).div(.4).clamp(0,1)))}).Else(()=>{o.assign(H(i(0,0,0),e.smokeColor,a.div(.25)))}),o}),z=ee(([a,o])=>{const s=q(0).toVar();return U(e.emberDensity.greaterThanEqual(.001),()=>{const c=i(a).toVar();c.y.subAssign(o.mul(e.speed).mul(1.8)),c.mulAssign(3.5).divAssign(X(e.emberSize,.01));const r=Pe(c).toVar();re({start:V(-1),end:V(2),name:"i",type:"int",condition:"<"},({i:p})=>{re({start:V(-1),end:V(2),name:"j",type:"int",condition:"<"},({j:d})=>{re({start:V(-1),end:V(2),name:"k",type:"int",condition:"<"},({k:S})=>{const h=r.add(i(p.toFloat(),d.toFloat(),S.toFloat())).toVar(),k=t(h).toVar();U(k.greaterThan(e.emberDensity),()=>Me());const _=m(h.add(97)).mul(.5).add(.5).toVar(),b=c.sub(h.add(_)).length().toVar();s.addAssign(Q(.28,0,b))})})})}),s.clamp(0,1)}),P=ee(([a,o,s,c])=>{const r=o.reciprocal().toVar(),p=s.sub(a).mul(r).toVar(),d=c.sub(a).mul(r).toVar(),S=Ce(p,d).toVar(),h=X(p,d).toVar();return ge(X(S.x,X(S.y,S.z)),Ce(h.x,Ce(h.y,h.z)))}),E=ee(()=>{const a=Re.toVar(),o=Ae.sub(Re).normalize().toVar(),s=e.invGroupWorld.mul(Ve(a,1)).xyz.toVar(),c=e.invGroupWorld.mul(Ve(o,0)).xyz.normalize().toVar(),r=P(s,c,e.boundsMin,e.boundsMax).toVar();r.x.assign(X(r.x,0));const p=i(0,0,0).toVar(),d=q(0).toVar();return U(r.x.lessThan(r.y),()=>{const S=e.boundsMax.sub(e.boundsMin).length().toVar(),h=e.stepSize.mul(S).div(e.steps.toFloat()).toVar(),k=t(Ae.mul(743.7).add(i(e.time.mul(.1)))).mul(h).toVar();re({start:V(0),end:V(ot),type:"int",condition:"<"},({i:_})=>{U(_.greaterThanEqual(e.steps),()=>fe());const b=r.x.add(k).add(_.toFloat().mul(h)).toVar();U(b.greaterThan(r.y),()=>fe());const R=s.add(c.mul(b)).toVar(),f=L(R).toVar();U(f.x.lessThan(.001),()=>Me());const A=i(R).toVar();A.y.subAssign(e.time.mul(e.speed)),A.mulAssign(i(2,1.5,2));const F=T(A).mul(e.magnitude).toVar(),y=q(1).sub(f.y).toVar();y.assign(y.mul(y)),y.addAssign(F.mul(.15).mul(q(1).sub(f.y))),y.mulAssign(f.x),y.assign(y.clamp(0,1));const D=ge(f.x,f.y).x.toVar();D.mulAssign(Q(0,.12,f.y)),D.mulAssign(q(1).sub(F.mul(.3).mul(f.y))),D.assign(D.clamp(0,1).mul(e.density).mul(h).mul(16));const I=B(y).mul(e.tintColor).mul(e.brightness).toVar(),N=G(I,i(.2126,.7152,.0722)).toVar();I.assign(H(i(N,N,N),I,e.saturation)),I.addAssign(e.coreColor.mul(Q(.55,1,y)).mul(f.x).mul(.6));const M=z(R,e.time).mul(Q(.25,.75,f.y)).toVar();I.addAssign(e.emberColor.mul(M).mul(2.5)),D.addAssign(M.mul(.4).mul(e.density).mul(h));const K=D.clamp(0,1).mul(q(1).sub(d)).toVar();p.addAssign(I.mul(K)),d.addAssign(K),U(d.greaterThan(.97),()=>fe())})}),Ve(p,d)})(),g=new qe({transparent:!0,depthWrite:!1,toneMapped:!1,side:_e,blending:Le});return g.colorNode=E.rgb,g.opacityNode=E.a,g.uniforms=e,g}const ue=new u,me=new u,Be=new u,ke=new u,ae=new u,se=new u,Fe=new u,xe=new u,je=new ye;function ct({position:e=[0,0,0],inverted:t=!1,width:m=.5,height:n=1.5,depth:T=.5,bendX:L=0,bendZ:B=0,animated:z=!0,animSpeed:P=.5,magnitude:E=1.3,lacunarity:g=2,gain:a=.5,speed:o=.8,density:s=1.2,brightness:c=1.8,saturation:r=1,tintColor:p="#ffffff",coreColor:d="#ffffcc",borderColor:S="#ff6600",smokeColor:h="#330000",emberDensity:k=.15,emberSize:_=.25,emberColor:b="#ff4400",steps:R=64,stepSize:f=1,controlPoints:A=null}){const F=l.useRef(),y=l.useRef(),D=l.useRef(0),I=l.useRef({x:L,z:B}),N=l.useRef(null),M=l.useRef(Array.from({length:pe},()=>new u)),K=l.useRef(Array.from({length:pe},()=>new u(1,1,1)));N.current||(N.current=st(at));const v=l.useMemo(()=>({time:C(0),invGroupWorld:C(new ye),boundsMin:C(new u(-.5,-.75,-.5)),boundsMax:C(new u(.5,.75,.5)),magnitude:C(E),lacunarity:C(g),gain:C(a),speed:C(o),density:C(s),brightness:C(c),saturation:C(r),tintColor:C(new J(p)),coreColor:C(new J(d)),borderColor:C(new J(S)),smokeColor:C(new J(h)),emberDensity:C(k),emberSize:C(_),emberColor:C(new J(b)),steps:C(R,"int"),stepSize:C(f),cpCount:C(0,"int"),cpPos:ze(M.current,"vec3"),cpScale:ze(K.current,"vec3")}),[]),j=l.useMemo(()=>new We(1,1,1),[]),de=l.useMemo(()=>rt(v),[v]);l.useEffect(()=>{v.magnitude.value=E,v.lacunarity.value=g,v.gain.value=a,v.speed.value=o,v.density.value=s,v.brightness.value=c,v.saturation.value=r,v.tintColor.value.set(p),v.coreColor.value.set(d),v.borderColor.value.set(S),v.smokeColor.value.set(h),v.emberDensity.value=k,v.emberSize.value=_,v.emberColor.value.set(b),v.steps.value=R,v.stepSize.value=f},[S,c,d,s,b,k,_,a,g,E,r,h,o,R,f,p,v]),l.useEffect(()=>{I.current={x:L,z:B}},[L,B]),l.useEffect(()=>()=>{j.dispose(),de.dispose()},[j,de]),De(({clock:ce},ve)=>{v.time.value=ce.getElapsedTime();let O;if(A&&A.length>=2)O=A;else{let W=I.current.x,ne=I.current.z;if(z){D.current+=ve*P;const $=D.current;W+=Math.sin($*.8)*.14+Math.sin($*2.1+.5)*.04,ne+=Math.cos($*.65+1.2)*.07+Math.cos($*1.7)*.03}nt(N.current,n,m,T,W,ne),O=N.current}const x=Math.min(O.length,pe);v.cpCount.value=x,ae.set(1/0,1/0,1/0),se.set(-1/0,-1/0,-1/0);for(let W=0;W<x;W++){const ne=O[W],$=ne.pos??ne.position??ne,Z=ne.scale??[1,1,1];$ instanceof u?ue.copy($):Array.isArray($)?ue.set($[0]||0,$[1]||0,$[2]||0):ue.set($.x||0,$.y||0,$.z||0),Z instanceof u?me.copy(Z):Array.isArray(Z)?me.set(Z[0]||1,Z[1]||1,Z[2]||1):me.set(Z.x||1,Z.y||1,Z.z||1),M.current[W].copy(ue),K.current[W].copy(me);const we=Math.max(me.x,me.z)*.75;Be.copy(ue).addScalar(-we),ke.copy(ue).addScalar(we),ae.min(Be),se.max(ke)}ae.y-=.15,se.y+=n*.35,ae.x-=.35,ae.z-=.35,se.x+=.35,se.z+=.35,v.boundsMin.value.copy(ae),v.boundsMax.value.copy(se),F.current&&(Fe.addVectors(ae,se).multiplyScalar(.5),xe.subVectors(se,ae),F.current.position.copy(Fe),F.current.scale.set(Math.max(xe.x,.01),Math.max(xe.y,.01),Math.max(xe.z,.01))),y.current&&(y.current.updateWorldMatrix(!0,!1),je.copy(y.current.matrixWorld).invert(),v.invGroupWorld.value.copy(je))});const Y=A?0:n/2;return w.jsx("group",{position:e,rotation:t?[Math.PI,0,0]:[0,0,0],children:w.jsx("group",{ref:y,position:[0,Y,0],children:w.jsx("mesh",{ref:F,geometry:j,material:de,frustumCulled:!1})})})}function lt(e){return Ie(n=>n.gl)?.isWebGPURenderer===!0?w.jsx(ct,{...e}):w.jsx(tt,{...e})}function it({points:e,config:t,showVolume:m}){const n=l.useMemo(()=>e.map(T=>({pos:T.position.clone(),scale:new u(t.fireWidth*(T.scale?.x??1),T.scale?.y??1,t.fireDepth*(T.scale?.z??1)),rot:new Se().setFromEuler(T.rotation)})),[e,t.fireWidth,t.fireDepth]);return w.jsx(Qe,{controlPoints:n,sliceSpacing:t.fireSliceSpacing,magnitude:t.fireMagnitude,lacunarity:t.fireLacunarity,gain:t.fireGain,tintColor:t.fireTintColor,saturation:t.fireSaturation,brightness:t.fireBrightness,animated:t.fireAnimated,animSpeed:t.fireAnimSpeed,showVolume:m})}function ut({points:e,config:t}){const m=l.useMemo(()=>e.map(n=>({pos:n.position.clone(),scale:new u(t.fireWidth*(n.scale?.x??1),n.scale?.y??1,t.fireDepth*(n.scale?.z??1)),rot:new Se().setFromEuler(n.rotation)})),[e,t.fireWidth,t.fireDepth]);return w.jsx(lt,{controlPoints:m,magnitude:t.cs184Magnitude,lacunarity:t.cs184Lacunarity,gain:t.cs184Gain,speed:t.cs184Speed,density:t.cs184Density,brightness:t.cs184Brightness,saturation:t.cs184Saturation,tintColor:t.cs184TintColor,coreColor:t.cs184CoreColor,borderColor:t.cs184BorderColor,smokeColor:t.cs184SmokeColor,emberDensity:t.cs184EmberDensity,emberSize:t.cs184EmberSize,emberColor:t.cs184EmberColor,steps:t.cs184Steps,stepSize:t.cs184StepSize,animated:t.cs184Animated,animSpeed:t.cs184AnimSpeed})}function xt({index:e,points:t,config:m,splineConfig:n,attractorsRef:T,setSplinePoints:L,allowedTypes:B="both",splineColor:z="#aaaaaa",pointSize:P}){const E=l.useCallback(f=>L(e,f),[e,L]),g=l.useMemo(()=>t.map(f=>f.position),[t]),a=l.useMemo(()=>t.map(f=>f.rotation),[t]),o=l.useMemo(()=>t.map(f=>f.scale),[t]),s=l.useMemo(()=>({...m,...n}),[m,n]),c=n.type==="Particle"||n.type==="Volumetric",r=c?"Smoke":n.type,p=c?n.type:n.smokeType??"Particle",d=n.fireType??"Classic",S=r==="FireAndSmoke";if(!n.visible||B==="smoke"&&r==="Fire"||B==="fire"&&r==="Smoke"||B!=="both"&&S)return null;const h=r==="Fire",k=r==="Smoke",_=k&&(p==="Particle"||p==="Both"),b=k&&(p==="Volumetric"||p==="Both"),R=s.enableAttractors===!1?null:T;return w.jsxs(w.Fragment,{children:[w.jsx(Oe,{points:t,setPoints:E,visible:n.showHelpers,mode:m.pointMode??"translate",pointSize:P}),w.jsx(Xe,{points:g,tension:n.tension,closed:n.closed,curveType:"catmullrom",color:z,visible:n.showSpline,arcSegments:n.arcSegments}),_&&w.jsx(Ue,{points:g,pointRotations:a,pointScales:o,config:s,attractorsRef:R},s.prefillOnStart===!1?"queued":"prefilled"),b&&w.jsx(Ne,{points:g,pointRotations:a,pointScales:o,config:s,attractorsRef:R}),k&&n.showSmokeVolume&&w.jsx($e,{points:g,pointRotations:a,pointScales:o,tension:n.tension,closed:n.closed,spread:Math.max(s.spawnSpread??0,s.volSpread??0)||120}),S&&w.jsx(He,{controlPoints:t,...s,attractorsRef:R,attractorStrength:m.attractorStrength,attractorRadius:m.attractorRadius}),h&&d==="Classic"&&w.jsx(it,{points:t,config:s,showVolume:n.showFireVolume}),h&&d==="RayMarch"&&w.jsx(ut,{points:t,config:s})]})}export{lt as C,xt as S};
