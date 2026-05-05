import{r as n,u as le,T as ce,p as ve,C as D,b as ee,j as v,F as te,q as de,V as b,Q as K,s as xe,m as he,v as ue,A as fe,L as Y,ad as ye,aA as ge,ah as Se,ai as be,ak as re,a6 as ae,E as me}from"./index-BjAk923F.js";import{S as ze}from"./SmokeParticles-BvS7Fbru.js";import{V as Ce}from"./VolumetricSmokeParticles-D1mgrgWd.js";import{S as we}from"./SplineLine-Ct9sUvB7.js";import{S as Pe}from"./SplinePoints-Ak8uL-ck.js";import{V as Me}from"./VolumetricFire-DbuBZyHX.js";const Ee=`
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
`;le.preload(ce,"/images/explosion.png");const Re=`
${Ee}

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
`,Te=`
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
`;function Ke({position:o=[0,0,0],radius:e=20,detail:r=6,speed:t=1,weight:a=10,noiseFreq:i=.05,noiseAmp:u=5,texturePath:d="/images/explosion.png",animated:l=!0,greyscale:h=!1,smokeLightColor:f="#4a4a58",smokeDarkColor:y="#1a1a22"}){const s=n.useMemo(()=>Date.now(),[]),m=le(ce,d),c=n.useMemo(()=>(m.colorSpace=ve,m),[m]),p=n.useRef({tExplosion:{value:c},time:{value:0},weight:{value:a},noiseFreq:{value:i},noiseAmp:{value:u},greyscale:{value:h?1:0},smokeLightColor:{value:new D(f)},smokeDarkColor:{value:new D(y)}}).current;return p.tExplosion.value=c,p.weight.value=a,p.noiseFreq.value=i,p.noiseAmp.value=u,p.greyscale.value=h?1:0,p.smokeLightColor.value.set(f),p.smokeDarkColor.value.set(y),ee(()=>{l&&(p.time.value=25e-5*t*(Date.now()-s))}),v.jsxs("mesh",{position:o,children:[v.jsx("icosahedronGeometry",{args:[e,r]}),v.jsx("shaderMaterial",{vertexShader:Re,fragmentShader:Te,uniforms:p,side:te,toneMapped:!1})]})}const Z=32;function Fe({points:o,pointRotations:e,pointScales:r,tension:t=.5,closed:a=!1,spread:i=120,color:u=4500223,opacity:d=.3}){const l=n.useMemo(()=>{if(!o||o.length<2)return null;const h=new de([...o],a,"catmullrom",t),f=r?.length??0,y=f>=2,s=e?.length??0,m=s>=2,c=a?Z:Z+1,C=new Float32Array(c*4*3),p=[],_=new K,q=new K,H=new K,U=new b,M=new b;for(let E=0;E<c;E+=1){const I=E/Z;h.getPoint(I,U);let L=1,W=1;if(y){const x=a?f:Math.max(1,f-1),w=Math.min(I*x,x-1e-6),g=Math.floor(w),O=w-g,P=r[g%f],G=r[(g+1)%f];L=P.x+(G.x-P.x)*O,W=P.z+(G.z-P.z)*O}if(m){const x=a?s:Math.max(1,s-1),w=Math.min(I*x,x-1e-6),g=Math.floor(w),O=w-g;q.setFromEuler(e[g%s]),H.setFromEuler(e[(g+1)%s]),_.copy(q).slerp(H,O)}else _.identity();const R=i*.5*L,V=i*.5*W,N=[[-R,0,-V],[R,0,-V],[R,0,V],[-R,0,V]],T=E*4;for(let x=0;x<4;x+=1){M.set(N[x][0],N[x][1],N[x][2]),M.applyQuaternion(_),M.add(U);const w=(T+x)*3;C[w]=M.x,C[w+1]=M.y,C[w+2]=M.z}for(let x=0;x<4;x+=1)p.push(T+x,T+(x+1)%4);const z=(E+1)%c;if(E<c-1||a){const x=z*4;for(let w=0;w<4;w+=1)p.push(T+w,x+w)}}const j=new xe;return j.setAttribute("position",new he(C,3)),j.setIndex(p),j},[o,e,r,t,a,i]);return n.useEffect(()=>()=>{l&&l.dispose()},[l]),l?v.jsx("lineSegments",{geometry:l,children:v.jsx("lineBasicMaterial",{color:u,transparent:!0,opacity:d,depthTest:!1})}):null}const De=`
  varying vec3 vWorldPos;

  void main() {
    vec4 wp   = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,ke=`
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
`,Be=5;function Ae(o){return Array.from({length:o},()=>({pos:new b,scale:new b(1,1,1),rot:new K}))}function _e(o,e,r,t,a,i){const u=e/2;for(let d=0;d<o.length;d++){const l=d/(o.length-1),h=l*l,f=r*(1-l*.25),y=t*(1-l*.25);o[d].pos.set(a*h,-u+l*e,i*h),o[d].scale.set(f,1,y)}}const Q=new b,X=new b,B=new b,A=new b,ne=new b,J=new b,se=new Y;function je({position:o=[0,0,0],inverted:e=!1,width:r=.5,height:t=1.5,depth:a=.5,bendX:i=0,bendZ:u=0,animated:d=!0,animSpeed:l=.5,magnitude:h=1.3,lacunarity:f=2,gain:y=.5,speed:s=.8,density:m=1.2,brightness:c=1.8,saturation:C=1,tintColor:p="#ffffff",coreColor:_="#ffffcc",borderColor:q="#ff6600",smokeColor:H="#330000",emberDensity:U=.15,emberSize:M=.25,emberColor:j="#ff4400",steps:E=64,stepSize:I=1,controlPoints:L=null}){const W=n.useRef(),R=n.useRef(),V=n.useRef(0),N=n.useRef({x:i,z:u}),T=n.useRef(null);T.current||(T.current=Ae(Be));const z=n.useMemo(()=>new ue({vertexShader:De,fragmentShader:ke,uniforms:{uTime:{value:0},uInvGroupWorld:{value:new Y},uBoundsMin:{value:new b(-.5,-.75,-.5)},uBoundsMax:{value:new b(.5,.75,.5)},uMagnitude:{value:h},uLacunarity:{value:f},uGain:{value:y},uSpeed:{value:s},uDensity:{value:m},uBrightness:{value:c},uSaturation:{value:C},uColorTint:{value:new D(p)},uCoreColor:{value:new D(_)},uBorderColor:{value:new D(q)},uSmokeColor:{value:new D(H)},uEmberDensity:{value:U},uEmberSize:{value:M},uEmberColor:{value:new D(j)},uSteps:{value:E},uStepSize:{value:I},uCPCount:{value:0},uCPPos:{value:Array.from({length:8},()=>new b)},uCPScale:{value:Array.from({length:8},()=>new b(1,1,1))}},side:te,transparent:!0,depthWrite:!1,blending:fe}),[]),x=n.useMemo(()=>new ye(1,1,1),[]);n.useEffect(()=>{const g=z.uniforms;g.uMagnitude.value=h,g.uLacunarity.value=f,g.uGain.value=y,g.uSpeed.value=s,g.uDensity.value=m,g.uBrightness.value=c,g.uSaturation.value=C,g.uSteps.value=E,g.uStepSize.value=I,g.uEmberDensity.value=U,g.uEmberSize.value=M},[z,h,f,y,s,m,c,C,E,I,U,M]),n.useEffect(()=>{z.uniforms.uColorTint.value.set(p)},[z,p]),n.useEffect(()=>{z.uniforms.uCoreColor.value.set(_)},[z,_]),n.useEffect(()=>{z.uniforms.uBorderColor.value.set(q)},[z,q]),n.useEffect(()=>{z.uniforms.uSmokeColor.value.set(H)},[z,H]),n.useEffect(()=>{z.uniforms.uEmberColor.value.set(j)},[z,j]),n.useEffect(()=>{N.current={x:i,z:u}},[i,u]),n.useEffect(()=>()=>{z.dispose(),x.dispose()},[z,x]),ee(({clock:g},O)=>{const P=z.uniforms;P.uTime.value=g.getElapsedTime();let G;if(L&&L.length>=2)G=L;else{let k=N.current.x,S=N.current.z;if(d){V.current+=O*l;const $=V.current;k+=Math.sin($*.8)*.14+Math.sin($*2.1+.5)*.04,S+=Math.cos($*.65+1.2)*.07+Math.cos($*1.7)*.03}_e(T.current,t,r,a,k,S),G=T.current}const oe=Math.min(G.length,8);P.uCPCount.value=oe,B.set(1/0,1/0,1/0),A.set(-1/0,-1/0,-1/0);for(let k=0;k<oe;k++){const S=G[k];S.pos instanceof b?Q.copy(S.pos):Array.isArray(S.pos)?Q.set(S.pos[0]||0,S.pos[1]||0,S.pos[2]||0):Q.set(S.pos.x||0,S.pos.y||0,S.pos.z||0),S.scale instanceof b?X.copy(S.scale):Array.isArray(S.scale)?X.set(S.scale[0]||1,S.scale[1]||1,S.scale[2]||1):X.set(S.scale.x||1,S.scale.y||1,S.scale.z||1),P.uCPPos.value[k].copy(Q),P.uCPScale.value[k].copy(X);const $=Math.max(X.x,X.z)*.75;B.min(Q.clone().addScalar(-$)),A.max(Q.clone().addScalar($))}B.y-=.15,A.y+=t*.35,B.x-=.35,B.z-=.35,A.x+=.35,A.z+=.35,P.uBoundsMin.value.copy(B),P.uBoundsMax.value.copy(A),W.current&&(ne.addVectors(B,A).multiplyScalar(.5),J.subVectors(A,B),W.current.position.copy(ne),W.current.scale.set(Math.max(J.x,.01),Math.max(J.y,.01),Math.max(J.z,.01))),R.current&&(R.current.updateWorldMatrix(!0,!1),se.copy(R.current.matrixWorld).invert(),P.uInvGroupWorld.value.copy(se))});const w=L?0:t/2;return v.jsx("group",{position:o,rotation:e?[Math.PI,0,0]:[0,0,0],children:v.jsx("group",{ref:R,position:[0,w,0],children:v.jsx("mesh",{ref:W,geometry:x,material:z,frustumCulled:!1})})})}let F=null;function Ie(){if(F)return F;const o=256,e=new Uint8Array(o*o*4);for(let r=0;r<o;r++)for(let t=0;t<o;t++){const a=(r*o+t)*4,i=Math.abs(Math.sin(t*127.1+r*311.7)*43758.5453)%1,u=Math.abs(Math.sin(t*269.5+r*183.3)*43758.5453)%1,d=Math.abs(Math.sin(t*419.2+r*371.9)*43758.5453)%1,l=Math.abs(Math.sin(t*113.5+r*271.9)*43758.5453)%1;e[a]=i*255|0,e[a+1]=u*255|0,e[a+2]=d*255|0,e[a+3]=l*255|0}return F=new Se(e,o,o,be),F.wrapS=re,F.wrapT=re,F.minFilter=ae,F.magFilter=ae,F.needsUpdate=!0,F}const Le=`
  varying vec3 vWorldPos;

  void main() {
    vec4 wp   = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,We=`
  precision highp float;

  uniform float     uTime;
  uniform float     uRotSpeed;
  uniform float     uNoiseScale;
  uniform mat4      uInvWorld;
  uniform sampler2D uNoiseTex;
  uniform int       uSteps;
  uniform float     uDensity;

  uniform vec3  uCoreColor;
  uniform float uCoreIntensity;
  uniform vec3  uEdgeColor;
  uniform float uEdgeIntensity;

  varying vec3 vWorldPos;

  // ── iq's hash noise via texture lookup ──────────────────────────────────
  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    vec2 uv = (p.xy + vec2(37.0, 17.0) * p.z) + f.xy;
    vec2 rg = texture2D(uNoiseTex, (uv + 0.5) / 256.0).yx;
    return 1.0 - 0.82 * mix(rg.x, rg.y, f.z);
  }

  // 4-octave fBm
  float fbm(vec3 p) {
    return noise(p * 0.06125) * 0.5
         + noise(p * 0.125)   * 0.25
         + noise(p * 0.25)    * 0.125
         + noise(p * 0.4)     * 0.2;
  }

  // Sphere SDF (matches original)
  float Sphere(vec3 p, float r) {
    return length(p) - r;
  }

  // ── otaviogood's SpiralNoiseC (matches original) ────────────────────────
  const float nudge = 4.0;
  const float normalizer = 1.0 / sqrt(1.0 + nudge * nudge);

  float SpiralNoiseC(vec3 p) {
    float n    = mod(-uTime * 0.2, 2.0);
    float iter = 2.0;
    for (int i = 0; i < 8; i++) {
      n    += -abs(sin(p.y * iter) + cos(p.x * iter)) / iter;
      p.xy += vec2(p.y, -p.x) * nudge;
      p.xy *= normalizer;
      p.xz += vec2(p.z, -p.x) * nudge;
      p.xz *= normalizer;
      iter *= 1.733733;
    }
    return n;
  }

  // ── Duke's volumetric explosion density field (matches original) ────────
  float VolumetricExplosion(vec3 p) {
    float f = Sphere(p, 1.4);
    f += fbm(p * 50.0);
    f += SpiralNoiseC(p.zxy * 0.4132 + 333.0) * 3.0;
    return f;
  }

  // Rotation of the noise field over time
  float map(vec3 p) {
    float c = cos(uTime * uRotSpeed);
    float s = sin(uTime * uRotSpeed);
    p.xz = vec2(c * p.x + s * p.z, -s * p.x + c * p.z);
    return VolumetricExplosion(p / uNoiseScale) * uNoiseScale;
  }

  // ── Ray-sphere intersection ──────────────────────────────────────────────
  bool raySphere(vec3 ro, vec3 rd, float r, out float near, out float far) {
    float b   = dot(-ro, rd);
    float det = b * b - dot(ro, ro) + r * r;
    if (det < 0.0) return false;
    det  = sqrt(det);
    near = b - det;
    far  = b + det;
    return far > 0.0;
  }

  // ── Colour from accumulated density + distance (matches original) ───────
  vec3 computeColor(float td, float radius) {
    vec3 base = mix(vec3(1.0, 0.9, 0.8), vec3(0.4, 0.15, 0.1), td);
    vec3 core = uCoreColor * uCoreIntensity;
    vec3 edge = uEdgeColor * uEdgeIntensity;
    return base * mix(core, edge, min((radius + 0.05) / 0.9, 1.15));
  }

  // ── Main (front-to-back compositing, matches original) ──────────────────
  void main() {
    vec3 wRo = cameraPosition;
    vec3 wRd = normalize(vWorldPos - cameraPosition);
    vec3 oRo = (uInvWorld * vec4(wRo, 1.0)).xyz;
    vec3 oRd = normalize((uInvWorld * vec4(wRd, 0.0)).xyz);

    float minT, maxT;
    if (!raySphere(oRo, oRd, 1.0, minT, maxT)) discard;

    float t   = max(minT, 0.0);
    float td  = 0.0;
    float ld  = 0.0;
    float w   = 0.0;
    float d   = 1.0;
    vec4  sum = vec4(0.0);

    const float h = 0.1;

    for (int i = 0; i < 128; i++) {
      if (i >= uSteps) break;

      vec3 pos = oRo + t * oRd;

      if (td > 0.9 || sum.a > 0.99 || t > maxT) break;

      d = map(pos);

      // clamp density — prevents negative weight
      d = max(d, 0.03);

      // point light at origin — bloom contribution
      vec3  ldst = -pos;
      float lDist = max(length(ldst), 0.001);
      vec3  lightColor = vec3(1.0, 0.5, 0.25);
      sum.rgb += lightColor / exp(lDist * lDist * lDist * 0.08) / 30.0;

      if (d < h) {
        // local density (inverted: thinner shell = higher density)
        ld = h - d;

        // weighting factor
        w = (1.0 - td) * ld;

        // accumulate total density
        td += w + 1.0 / 200.0;

        vec4 col = vec4(computeColor(td, lDist), td);

        // emission
        sum += sum.a * vec4(sum.rgb, 0.0) * 0.2 / lDist;

        // uniform scale density & premultiply
        col.a *= 0.2 * uDensity;
        col.rgb *= col.a;

        // front-to-back alpha blend
        sum = sum + col * (1.0 - sum.a);
      }

      td += 1.0 / 70.0;

      // dithering — breaks up colour banding
      d = abs(d) * (0.8 + 0.08 * fract(0.75487766 * vWorldPos.x
                                      + 0.56984029 * vWorldPos.y));

      // adaptive step size (matches original)
      t += max(d * 0.08 * max(min(lDist, d), 2.0), 0.01);
    }

    // simple scattering
    sum *= 1.0 / exp(ld * 0.2) * 0.8;

    sum = clamp(sum, 0.0, 1.0);

    // S-curve contrast boost (matches original)
    sum.xyz = sum.xyz * sum.xyz * (3.0 - 2.0 * sum.xyz);

    if (sum.a < 0.001) discard;
    gl_FragColor = sum;
  }
`,ie=new Y;function Ve({position:o=[0,0,0],radius:e=1.5,rotSpeed:r=.1,noiseScale:t=.5,coreColor:a="#ccffff",coreIntensity:i=7,edgeColor:u="#7a877f",edgeIntensity:d=1.5,density:l=1,steps:h=64}){const f=n.useRef(),y=n.useMemo(()=>Ie(),[]),s=n.useMemo(()=>new ue({vertexShader:Le,fragmentShader:We,uniforms:{uTime:{value:0},uRotSpeed:{value:r},uNoiseScale:{value:t},uInvWorld:{value:new Y},uNoiseTex:{value:y},uSteps:{value:h},uDensity:{value:l},uCoreColor:{value:new D(a)},uCoreIntensity:{value:i},uEdgeColor:{value:new D(u)},uEdgeIntensity:{value:d}},side:te,transparent:!0,depthWrite:!1,blending:fe}),[]),m=n.useMemo(()=>new ge(1,32,16),[]);return n.useEffect(()=>{const c=s.uniforms;c.uRotSpeed.value=r,c.uNoiseScale.value=t,c.uSteps.value=h,c.uDensity.value=l,c.uCoreIntensity.value=i,c.uEdgeIntensity.value=d},[s,r,t,h,l,i,d]),n.useEffect(()=>{s.uniforms.uCoreColor.value.set(a)},[s,a]),n.useEffect(()=>{s.uniforms.uEdgeColor.value.set(u)},[s,u]),n.useEffect(()=>()=>{s.dispose(),m.dispose()},[s,m]),ee(({clock:c})=>{s.uniforms.uTime.value=c.getElapsedTime(),f.current&&(f.current.updateWorldMatrix(!0,!1),ie.copy(f.current.matrixWorld).invert(),s.uniforms.uInvWorld.value.copy(ie))}),v.jsx("group",{position:o,children:v.jsx("mesh",{ref:f,geometry:m,material:s,scale:[e*1.02,e*1.02,e*1.02],frustumCulled:!1})})}function Ne({points:o,config:e,showVolume:r}){const t=n.useMemo(()=>o.map(a=>({pos:a.position.clone(),scale:new b(e.fireWidth*(a.scale?.x??1),a.scale?.y??1,e.fireDepth*(a.scale?.z??1)),rot:new K().setFromEuler(a.rotation)})),[o,e.fireWidth,e.fireDepth]);return v.jsx(Me,{controlPoints:t,sliceSpacing:e.fireSliceSpacing,magnitude:e.fireMagnitude,lacunarity:e.fireLacunarity,gain:e.fireGain,tintColor:e.fireTintColor,saturation:e.fireSaturation,brightness:e.fireBrightness,animated:e.fireAnimated,animSpeed:e.fireAnimSpeed,showVolume:r})}function Ge({points:o,config:e}){const r=n.useMemo(()=>o.map(t=>({pos:t.position.clone(),scale:new b(e.fireWidth*(t.scale?.x??1),t.scale?.y??1,e.fireDepth*(t.scale?.z??1)),rot:new K().setFromEuler(t.rotation)})),[o,e.fireWidth,e.fireDepth]);return v.jsx(je,{controlPoints:r,magnitude:e.cs184Magnitude,lacunarity:e.cs184Lacunarity,gain:e.cs184Gain,speed:e.cs184Speed,density:e.cs184Density,brightness:e.cs184Brightness,saturation:e.cs184Saturation,tintColor:e.cs184TintColor,coreColor:e.cs184CoreColor,borderColor:e.cs184BorderColor,smokeColor:e.cs184SmokeColor,emberDensity:e.cs184EmberDensity,emberSize:e.cs184EmberSize,emberColor:e.cs184EmberColor,steps:e.cs184Steps,stepSize:e.cs184StepSize,animated:e.cs184Animated,animSpeed:e.cs184AnimSpeed})}function $e({points:o,config:e}){return v.jsx(v.Fragment,{children:o.map((r,t)=>v.jsx(Ve,{position:r.position,radius:e.fireballRadius*(r.scale?.x??1),rotSpeed:e.fireballRotSpeed,noiseScale:e.fireballNoiseScale,coreColor:e.fireballCoreColor,coreIntensity:e.fireballCoreIntensity,edgeColor:e.fireballEdgeColor,edgeIntensity:e.fireballEdgeIntensity,density:e.fireballDensity,steps:e.fireballSteps},t))})}function Je({index:o,points:e,config:r,splineConfig:t,attractorsRef:a,setSplinePoints:i,allowedTypes:u="both"}){const d=n.useCallback(p=>i(o,p),[o,i]),l=n.useMemo(()=>e.map(p=>p.position),[e]),h=n.useMemo(()=>e.map(p=>p.rotation),[e]),f=n.useMemo(()=>e.map(p=>p.scale),[e]),y=n.useMemo(()=>({...r,...t}),[r,t]);if(!t.visible||u==="smoke"&&t.type==="Fire"||u==="fire"&&t.type==="Smoke")return null;const s=t.type==="Fire",m=t.type==="Smoke",{smokeType:c="Particle",fireType:C="Classic"}=t;return v.jsxs(v.Fragment,{children:[v.jsx(Pe,{points:e,setPoints:d,visible:t.showHelpers,mode:r.pointMode}),v.jsx(we,{points:l,tension:t.tension,closed:t.closed,curveType:"catmullrom",color:"#aaaaaa",visible:t.showSpline,arcSegments:t.arcSegments}),m&&c==="Particle"&&v.jsx(ze,{points:l,pointRotations:h,pointScales:f,config:y,attractorsRef:a}),m&&c==="Volumetric"&&v.jsx(Ce,{points:l,pointRotations:h,pointScales:f,config:y,attractorsRef:a}),m&&t.showSmokeVolume&&v.jsx(Fe,{points:l,pointRotations:h,pointScales:f,tension:t.tension,closed:t.closed,spread:Math.max(y.spawnSpread??0,y.volSpread??0)||120}),s&&C==="Classic"&&v.jsx(Ne,{points:e,config:y,showVolume:t.showFireVolume}),s&&C==="RayMarch"&&v.jsx(Ge,{points:e,config:y}),s&&C==="Fireball"&&v.jsx($e,{points:e,config:y})]})}const pe={name:"",visible:!0,type:"Smoke",smokeType:"Particle",fireType:"Classic",tension:1,closed:!0,showSpline:!0,showHelpers:!0,arcSegments:200,showSmokeVolume:!1,showFireVolume:!1,particleCount:15e3,particleSize:.4,particleColor:"#7c7989",opacity:.045,growth:2,fadeExponent:1.2,buoyancy:.2,rotSpeed:.3,blendMode:"Normal",springK:5,flowSpeed:.04,damping:.12,turbulence:1.2,turbulenceSpeed:.3,spawnSpread:1.2,maxDrift:6,fadeRate:8,volParticleCount:12e3,volSize:.6,volColor:"#9090a0",volOpacity:.06,volBlendMode:"Normal",volSpread:1.2,volSpringK:2.5,volDamping:.1,volTurbulence:1.8,volTurbulenceSpeed:.25,volMaxDrift:9,volGrowth:1.5,volFadeExp:1.2,volBuoyancy:0,fireWidth:.8,fireHeight:2,fireDepth:.8,fireSliceSpacing:.04,fireMagnitude:1.3,fireLacunarity:2,fireGain:.5,fireTintColor:"#ffffff",fireSaturation:1,fireBrightness:1.5,fireAnimated:!0,fireAnimSpeed:.5,cs184Magnitude:1.3,cs184Lacunarity:2,cs184Gain:.5,cs184Speed:.8,cs184Density:1.2,cs184Brightness:1.8,cs184Saturation:1,cs184TintColor:"#ffffff",cs184CoreColor:"#ffffcc",cs184BorderColor:"#ff6600",cs184SmokeColor:"#330000",cs184EmberDensity:.15,cs184EmberSize:.25,cs184EmberColor:"#ff4400",cs184Steps:64,cs184StepSize:1,cs184Animated:!0,cs184AnimSpeed:.5,fireballRadius:.8,fireballRotSpeed:.1,fireballNoiseScale:.5,fireballCoreColor:"#ccffff",fireballCoreIntensity:7,fireballEdgeColor:"#7a877f",fireballEdgeIntensity:1.5,fireballDensity:1,fireballSteps:64};function Ye(o,e,r,t){o(a=>{const i=[...a];return i[e]={...i[e],[r]:t},i})}function Ze(o){let e=[];Array.isArray(o?.splines)?e=o.splines:o?.points&&(e=[o]);const r=e.map(a=>a.points.map(i=>({position:i.position.clone(),rotation:i.rotation?i.rotation.clone():new me(0,0,0),scale:i.scale?i.scale.clone():new b(1,1,1)}))),t=e.map(a=>{const{points:i,...u}=a;let d={...u};return(u.type==="Particle"||u.type==="Volumetric")&&(d={...u,smokeType:u.type,type:"Smoke"}),{...pe,...d}});return{splines:r,splineConfigs:t}}function et(o,e){return o.map((r,t)=>{const a=e[t]??pe,{showSpline:i,showHelpers:u,showSmokeVolume:d,showFireVolume:l,...h}=a,f=r.map(s=>{const m=s.position,c=s.rotation??new me,C=s.scale??new b(1,1,1);return`    { position: new THREE.Vector3(${m.x.toFixed(3)}, ${m.y.toFixed(3)}, ${m.z.toFixed(3)}), rotation: new THREE.Euler(${c.x.toFixed(3)}, ${c.y.toFixed(3)}, ${c.z.toFixed(3)}), scale: new THREE.Vector3(${C.x.toFixed(3)}, ${C.y.toFixed(3)}, ${C.z.toFixed(3)}) }`});return`  {
${Object.entries(h).map(([s,m])=>typeof m=="string"?`    ${s}: '${m}'`:`    ${s}: ${m}`).join(`,
`)},
    points: [
${f.join(`,
`)}
    ]
  }`}).join(`,
`)}export{je as C,pe as D,Ve as F,Ke as P,Je as S,Ee as n,Ze as p,et as s,Ye as u};
