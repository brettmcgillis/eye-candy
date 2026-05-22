import{r as a,aF as ve,V as w,Q as Z,aE as he,U as xe,j as v,aa as ye,_ as le,t as be,p as U,am as ce,aG as Me,o as me,aS as fe,a1 as de,n as Se}from"./index-Ccd5CS82.js";import{S as Ce}from"./SmokeParticles-DH2Nt8PM.js";import{V as we}from"./VolumetricSmokeParticles-BPl9GKfg.js";import{S as Pe}from"./SplineLine-ByNEoQ-i.js";import{S as ge}from"./SplinePoints-CYwdQ851.js";import{u as k,W as pe,j as ee,k as ae,a8 as re,f as E,l as se,Z as ne,i as $,_ as ze}from"./three.tsl-CWjF3kga.js";import{r as Ee,e as Be,h as Re,V as Te}from"./VolumetricFire-Db_ZpgQT.js";const oe=32;function ke({points:t,pointRotations:e,pointScales:l,tension:o=.5,closed:s=!1,spread:h=120,color:P=4500223,opacity:u=.3}){const x=a.useMemo(()=>{if(!t||t.length<2)return null;const B=new ve([...t],s,"catmullrom",o),c=l?.length??0,g=c>=2,y=e?.length??0,z=y>=2,S=s?oe:oe+1,m=new Float32Array(S*4*3),C=[],R=new Z,b=new Z,F=new Z,G=new w,T=new w;for(let L=0;L<S;L+=1){const D=L/oe;B.getPoint(D,G);let I=1,j=1;if(g){const n=s?c:Math.max(1,c-1),d=Math.min(D*n,n-1e-6),i=Math.floor(d),N=d-i,A=l[i%c],q=l[(i+1)%c];I=A.x+(q.x-A.x)*N,j=A.z+(q.z-A.z)*N}if(z){const n=s?y:Math.max(1,y-1),d=Math.min(D*n,n-1e-6),i=Math.floor(d),N=d-i;b.setFromEuler(e[i%y]),F.setFromEuler(e[(i+1)%y]),R.copy(b).slerp(F,N)}else R.identity();const W=h*.5*I,r=h*.5*j,V=[[-W,0,-r],[W,0,-r],[W,0,r],[-W,0,r]],_=L*4;for(let n=0;n<4;n+=1){T.set(V[n][0],V[n][1],V[n][2]),T.applyQuaternion(R),T.add(G);const d=(_+n)*3;m[d]=T.x,m[d+1]=T.y,m[d+2]=T.z}for(let n=0;n<4;n+=1)C.push(_+n,_+(n+1)%4);const f=(L+1)%S;if(L<S-1||s){const n=f*4;for(let d=0;d<4;d+=1)C.push(_+d,n+d)}}const M=new he;return M.setAttribute("position",new xe(m,3)),M.setIndex(C),M},[t,e,l,o,s,h]);return a.useEffect(()=>()=>{x&&x.dispose()},[x]),x?v.jsx("lineSegments",{geometry:x,children:v.jsx("lineBasicMaterial",{color:P,transparent:!0,opacity:u,depthTest:!1})}):null}const Fe=`
  varying vec3 vWorldPos;

  void main() {
    vec4 wp   = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,je=`
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
`,Ae=5;function Le(t){return Array.from({length:t},()=>({pos:new w,scale:new w(1,1,1),rot:new Z}))}function De(t,e,l,o,s,h){const P=e/2;for(let u=0;u<t.length;u++){const x=u/(t.length-1),B=x*x,c=l*(1-x*.25),g=o*(1-x*.25);t[u].pos.set(s*B,-P+x*e,h*B),t[u].scale.set(c,1,g)}}const K=new w,Y=new w,O=new w,Q=new w,ie=new w,te=new w,ue=new ce;function Ge({position:t=[0,0,0],inverted:e=!1,width:l=.5,height:o=1.5,depth:s=.5,bendX:h=0,bendZ:P=0,animated:u=!0,animSpeed:x=.5,magnitude:B=1.3,lacunarity:c=2,gain:g=.5,speed:y=.8,density:z=1.2,brightness:S=1.8,saturation:m=1,tintColor:C="#ffffff",coreColor:R="#ffffcc",borderColor:b="#ff6600",smokeColor:F="#330000",emberDensity:G=.15,emberSize:T=.25,emberColor:M="#ff4400",steps:L=64,stepSize:D=1,controlPoints:I=null}){const j=a.useRef(),W=a.useRef(),r=a.useRef(0),V=a.useRef({x:h,z:P}),_=a.useRef(null);_.current||(_.current=Le(Ae));const f=a.useMemo(()=>new ye({vertexShader:Fe,fragmentShader:je,uniforms:{uTime:{value:0},uInvGroupWorld:{value:new ce},uBoundsMin:{value:new w(-.5,-.75,-.5)},uBoundsMax:{value:new w(.5,.75,.5)},uMagnitude:{value:B},uLacunarity:{value:c},uGain:{value:g},uSpeed:{value:y},uDensity:{value:z},uBrightness:{value:S},uSaturation:{value:m},uColorTint:{value:new U(C)},uCoreColor:{value:new U(R)},uBorderColor:{value:new U(b)},uSmokeColor:{value:new U(F)},uEmberDensity:{value:G},uEmberSize:{value:T},uEmberColor:{value:new U(M)},uSteps:{value:L},uStepSize:{value:D},uCPCount:{value:0},uCPPos:{value:Array.from({length:8},()=>new w)},uCPScale:{value:Array.from({length:8},()=>new w(1,1,1))}},side:be,transparent:!0,depthWrite:!1,blending:le}),[]),n=a.useMemo(()=>new Me(1,1,1),[]);a.useEffect(()=>{const i=f.uniforms;i.uMagnitude.value=B,i.uLacunarity.value=c,i.uGain.value=g,i.uSpeed.value=y,i.uDensity.value=z,i.uBrightness.value=S,i.uSaturation.value=m,i.uSteps.value=L,i.uStepSize.value=D,i.uEmberDensity.value=G,i.uEmberSize.value=T},[f,B,c,g,y,z,S,m,L,D,G,T]),a.useEffect(()=>{f.uniforms.uColorTint.value.set(C)},[f,C]),a.useEffect(()=>{f.uniforms.uCoreColor.value.set(R)},[f,R]),a.useEffect(()=>{f.uniforms.uBorderColor.value.set(b)},[f,b]),a.useEffect(()=>{f.uniforms.uSmokeColor.value.set(F)},[f,F]),a.useEffect(()=>{f.uniforms.uEmberColor.value.set(M)},[f,M]),a.useEffect(()=>{V.current={x:h,z:P}},[h,P]),a.useEffect(()=>()=>{f.dispose(),n.dispose()},[f,n]),me(({clock:i},N)=>{const A=f.uniforms;A.uTime.value=i.getElapsedTime();let q;if(I&&I.length>=2)q=I;else{let H=V.current.x,p=V.current.z;if(u){r.current+=N*x;const X=r.current;H+=Math.sin(X*.8)*.14+Math.sin(X*2.1+.5)*.04,p+=Math.cos(X*.65+1.2)*.07+Math.cos(X*1.7)*.03}De(_.current,o,l,s,H,p),q=_.current}const J=Math.min(q.length,8);A.uCPCount.value=J,O.set(1/0,1/0,1/0),Q.set(-1/0,-1/0,-1/0);for(let H=0;H<J;H++){const p=q[H];p.pos instanceof w?K.copy(p.pos):Array.isArray(p.pos)?K.set(p.pos[0]||0,p.pos[1]||0,p.pos[2]||0):K.set(p.pos.x||0,p.pos.y||0,p.pos.z||0),p.scale instanceof w?Y.copy(p.scale):Array.isArray(p.scale)?Y.set(p.scale[0]||1,p.scale[1]||1,p.scale[2]||1):Y.set(p.scale.x||1,p.scale.y||1,p.scale.z||1),A.uCPPos.value[H].copy(K),A.uCPScale.value[H].copy(Y);const X=Math.max(Y.x,Y.z)*.75;O.min(K.clone().addScalar(-X)),Q.max(K.clone().addScalar(X))}O.y-=.15,Q.y+=o*.35,O.x-=.35,O.z-=.35,Q.x+=.35,Q.z+=.35,A.uBoundsMin.value.copy(O),A.uBoundsMax.value.copy(Q),j.current&&(ie.addVectors(O,Q).multiplyScalar(.5),te.subVectors(Q,O),j.current.position.copy(ie),j.current.scale.set(Math.max(te.x,.01),Math.max(te.y,.01),Math.max(te.z,.01))),W.current&&(W.current.updateWorldMatrix(!0,!1),ue.copy(W.current.matrixWorld).invert(),A.uInvGroupWorld.value.copy(ue))});const d=I?0:o/2;return v.jsx("group",{position:t,rotation:e?[Math.PI,0,0]:[0,0,0],children:v.jsx("group",{ref:W,position:[0,d,0],children:v.jsx("mesh",{ref:j,geometry:n,material:f,frustumCulled:!1})})})}const We=ee(.2126,.7152,.0722);function Ve(t){const e=pe("arcT","float"),l=ee(t.time.mul(t.speed).mul(.22),e.mul(2.8),t.time.mul(t.speed).mul(.16)),o=ae(re.mul(E(.72)).add(l),se(5),t.lacunarity,t.gain).mul(E(.5)).add(E(.5)).clamp(0,1),s=ae(ne.add(ee(0,t.time.mul(t.speed).negate(),0)),se(4),t.lacunarity,t.gain).mul(E(2)).sub(E(1)),h=E(1).sub(e.mul(.82)).clamp(.08,1),P=o.mul(t.magnitude).mul(t.stepSize.mul(.06)).add(s.mul(t.magnitude).mul(t.stepSize).mul(.025)).mul(h),u=o.mul(E(.5)).add(E(1).sub(e).mul(E(.75))).clamp(0,1),x=u.mul(.8).clamp(0,1),B=u.mul(u).clamp(0,1),c=$(t.smokeColor,t.borderColor,x),g=$(c,t.coreColor,B),y=t.emberDensity.mul(u).mul(E(1).sub(e).mul(.45).add(.15)).clamp(0,.65),S=$(g,t.emberColor,y).mul(t.tintColor),m=ze(S,We),C=$(ee(m,m,m),S,t.saturation).mul(t.brightness),R=h.mul(t.density).mul(o.mul(.42).add(.24)),b=new fe({transparent:!0,depthWrite:!1,toneMapped:!1,side:de,blending:le});return b.positionNode=ne.add(re.mul(P)),b.colorNode=C,b.opacityNode=R,b.uniforms=t,b}function _e(t){const e=pe("arcT","float"),l=ae(re.mul(E(.45)).add(ee(t.time.mul(t.speed).mul(.3),e.mul(2.2),0)),se(4),t.lacunarity,t.gain).mul(E(.5)).add(E(.5)).clamp(0,1),o=l.mul(E(.28)).add(E(1).sub(e).mul(E(.95))).clamp(0,1),s=$(t.borderColor,t.coreColor,o).mul(t.tintColor),h=$(s,t.emberColor,t.emberDensity.mul(.35)),P=E(1).sub(e.mul(.88)).clamp(.06,1).mul(t.density).mul(l.mul(.45).add(.4)),u=new fe({transparent:!0,depthWrite:!1,toneMapped:!1,side:de,blending:le});return u.positionNode=ne,u.colorNode=h.mul(t.brightness.mul(1.08)),u.opacityNode=P,u.uniforms=t,u}function Ie({position:t=[0,0,0],inverted:e=!1,width:l=.5,height:o=1.5,depth:s=.5,bendX:h=0,bendZ:P=0,animated:u=!0,animSpeed:x=.5,magnitude:B=1.3,lacunarity:c=2,gain:g=.5,speed:y=.8,density:z=1.2,brightness:S=1.8,saturation:m=1,tintColor:C="#ffffff",coreColor:R="#ffffcc",borderColor:b="#ff6600",smokeColor:F="#330000",emberDensity:G=.15,emberSize:T=.25,emberColor:M="#ff4400",steps:L=64,stepSize:D=1,controlPoints:I=null}){const j=a.useRef(),W=a.useRef(0),r=a.useMemo(()=>({time:k(0),magnitude:k(B),lacunarity:k(c),gain:k(g),speed:k(y),density:k(z),brightness:k(S),saturation:k(m),tintColor:k(new U(C)),coreColor:k(new U(R)),borderColor:k(new U(b)),smokeColor:k(new U(F)),emberDensity:k(G),emberSize:k(T),emberColor:k(new U(M)),stepSize:k(D)}),[]),V=a.useMemo(()=>Ee({controlPoints:I,width:l,height:o,depth:s,bendX:h,bendZ:P}),[h,P,I,s,o,l]),_=a.useMemo(()=>Be(V),[V]),f=a.useMemo(()=>Math.min(180,Math.max(52,Math.round(L*1.25))),[L]),n=a.useMemo(()=>Math.min(36,Math.max(18,Math.round(24/Math.max(D,.65)))),[D]),d=a.useMemo(()=>Re(_,V,{tubularSegments:f,radialSegments:n,capSegments:12}),[_,V,n,f]),i=a.useMemo(()=>Ve(r),[r]),N=a.useMemo(()=>_e(r),[r]);return a.useEffect(()=>{r.magnitude.value=B,r.lacunarity.value=c,r.gain.value=g,r.speed.value=y,r.density.value=z,r.brightness.value=S,r.saturation.value=m,r.tintColor.value.set(C),r.coreColor.value.set(R),r.borderColor.value.set(b),r.smokeColor.value.set(F),r.emberDensity.value=G,r.emberSize.value=T,r.emberColor.value.set(M),r.stepSize.value=D},[b,S,R,z,M,G,T,g,c,B,m,F,y,D,C,r]),a.useEffect(()=>()=>{d.dispose(),i.dispose(),N.dispose()},[N,d,i]),me(({clock:A},q)=>{if(r.time.value=A.getElapsedTime(),!j.current||(j.current.rotation.x=e?Math.PI:0,j.current.rotation.z=0,!u||I?.length>=2))return;W.current+=q*x;const J=W.current;j.current.rotation.x+=Math.sin(J*.8)*.1,j.current.rotation.z=Math.cos(J*.65+1.2)*.07+Math.cos(J*1.7)*.03}),v.jsxs("group",{ref:j,position:t,children:[v.jsx("mesh",{geometry:d,material:i}),v.jsx("mesh",{geometry:d,material:N,scale:[.68,1,.68]})]})}function Ne(t){return Se(o=>o.gl)?.isWebGPURenderer===!0?v.jsx(Ie,{...t}):v.jsx(Ge,{...t})}function Ue({points:t,config:e,showVolume:l}){const o=a.useMemo(()=>t.map(s=>({pos:s.position.clone(),scale:new w(e.fireWidth*(s.scale?.x??1),s.scale?.y??1,e.fireDepth*(s.scale?.z??1)),rot:new Z().setFromEuler(s.rotation)})),[t,e.fireWidth,e.fireDepth]);return v.jsx(Te,{controlPoints:o,sliceSpacing:e.fireSliceSpacing,magnitude:e.fireMagnitude,lacunarity:e.fireLacunarity,gain:e.fireGain,tintColor:e.fireTintColor,saturation:e.fireSaturation,brightness:e.fireBrightness,animated:e.fireAnimated,animSpeed:e.fireAnimSpeed,showVolume:l})}function qe({points:t,config:e}){const l=a.useMemo(()=>t.map(o=>({pos:o.position.clone(),scale:new w(e.fireWidth*(o.scale?.x??1),o.scale?.y??1,e.fireDepth*(o.scale?.z??1)),rot:new Z().setFromEuler(o.rotation)})),[t,e.fireWidth,e.fireDepth]);return v.jsx(Ne,{controlPoints:l,magnitude:e.cs184Magnitude,lacunarity:e.cs184Lacunarity,gain:e.cs184Gain,speed:e.cs184Speed,density:e.cs184Density,brightness:e.cs184Brightness,saturation:e.cs184Saturation,tintColor:e.cs184TintColor,coreColor:e.cs184CoreColor,borderColor:e.cs184BorderColor,smokeColor:e.cs184SmokeColor,emberDensity:e.cs184EmberDensity,emberSize:e.cs184EmberSize,emberColor:e.cs184EmberColor,steps:e.cs184Steps,stepSize:e.cs184StepSize,animated:e.cs184Animated,animSpeed:e.cs184AnimSpeed})}function $e({index:t,points:e,config:l,splineConfig:o,attractorsRef:s,setSplinePoints:h,allowedTypes:P="both",splineColor:u="#aaaaaa",pointSize:x}){const B=a.useCallback(M=>h(t,M),[t,h]),c=a.useMemo(()=>e.map(M=>M.position),[e]),g=a.useMemo(()=>e.map(M=>M.rotation),[e]),y=a.useMemo(()=>e.map(M=>M.scale),[e]),z=a.useMemo(()=>({...l,...o}),[l,o]),S=o.type==="Particle"||o.type==="Volumetric",m=S?"Smoke":o.type,C=S?o.type:o.smokeType??"Particle",R=o.fireType??"Classic";if(!o.visible||P==="smoke"&&m==="Fire"||P==="fire"&&m==="Smoke")return null;const b=m==="Fire",F=m==="Smoke",G=F&&(C==="Particle"||C==="Both"),T=F&&(C==="Volumetric"||C==="Both");return v.jsxs(v.Fragment,{children:[v.jsx(ge,{points:e,setPoints:B,visible:o.showHelpers,mode:l.pointMode??"translate",pointSize:x}),v.jsx(Pe,{points:c,tension:o.tension,closed:o.closed,curveType:"catmullrom",color:u,visible:o.showSpline,arcSegments:o.arcSegments}),G&&v.jsx(Ce,{points:c,pointRotations:g,pointScales:y,config:z,attractorsRef:s}),T&&v.jsx(we,{points:c,pointRotations:g,pointScales:y,config:z,attractorsRef:s}),F&&o.showSmokeVolume&&v.jsx(ke,{points:c,pointRotations:g,pointScales:y,tension:o.tension,closed:o.closed,spread:Math.max(z.spawnSpread??0,z.volSpread??0)||120}),b&&R==="Classic"&&v.jsx(Ue,{points:e,config:z,showVolume:o.showFireVolume}),b&&R==="RayMarch"&&v.jsx(qe,{points:e,config:z})]})}export{Ne as C,$e as S};
