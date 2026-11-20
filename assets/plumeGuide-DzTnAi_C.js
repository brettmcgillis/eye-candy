import{bj as qe,aQ as ce,c4 as Xe,a3 as ie,aH as me,c5 as Ze,V as we,bh as Je,aY as Ke,bi as Qe,Y as be,N as Q,I as pe,aa as Z,C as U,h as Pe,az as Re,aS as et,H as tt,aB as fe}from"./index-DQZ6GwWS.js";import{aE as Fe,u as x,F as ve,f as J,a0 as ee,v as N,I as Le,j as C,aJ as at,a3 as Ae,m as ue,aW as nt,k as te,aX as ot,z as he,D as st,c as oe,M as lt,O as se,ab as le,B as Y,K as De,aF as re,aG as rt,s as it,aY as ct,b as G,aZ as Ce,az as dt}from"./three.tsl-BQ1Hwkua.js";function mt(t=64,o=90210){const s=Ze(o),i={},e={};function p(n){if(i[n])return i[n];const d=new Float32Array(n*n*n*3);for(let f=0;f<n*n*n;f+=1){let c,l,m,y;do c=s()*2-1,l=s()*2-1,m=s()*2-1,y=c*c+l*l+m*m;while(y>1||y<1e-4);y=Math.sqrt(y),d[f*3]=c/y,d[f*3+1]=l/y,d[f*3+2]=m/y}return i[n]=d,d}function g(n){if(e[n])return e[n];const d=new Float32Array(n*n*n*3);for(let f=0;f<d.length;f+=1)d[f]=s();return e[n]=d,d}const u=n=>n*n*n*(n*(n*6-15)+10),a=(n,d)=>(n%d+d)%d;function w(n,d,f,c){const l=p(c),m=Math.floor(n),y=Math.floor(d),k=Math.floor(f),r=n-m,v=d-y,T=f-k,I=a(m,c),L=a(y,c),R=a(k,c),B=(I+1)%c,_=(L+1)%c,V=(R+1)%c,j=u(r),X=u(v),ae=u(T),W=(We,Ve,je,Ue,Ge,Ye)=>{const de=3*(We+c*(Ve+c*je));return l[de]*Ue+l[de+1]*Ge+l[de+2]*Ye},P=W(I,L,R,r,v,T),ne=W(B,L,R,r-1,v,T),ye=W(I,_,R,r,v-1,T),_e=W(B,_,R,r-1,v-1,T),ze=W(I,L,V,r,v,T-1),Oe=W(B,L,V,r-1,v,T-1),Te=W(I,_,V,r,v-1,T-1),$e=W(B,_,V,r-1,v-1,T-1),Se=P+j*(ne-P),He=ye+j*(_e-ye),ke=ze+j*(Oe-ze),Ne=Te+j*($e-Te),Me=Se+X*(He-Se),Be=ke+X*(Ne-ke);return Me+ae*(Be-Me)}function b(n,d,f,c){const l=g(c),m=Math.floor(n),y=Math.floor(d),k=Math.floor(f);let r=1e9;for(let v=-1;v<=1;v+=1){const T=k+v,I=a(T,c);for(let L=-1;L<=1;L+=1){const R=y+L,B=a(R,c);for(let _=-1;_<=1;_+=1){const V=m+_,X=3*(a(V,c)+c*(B+c*I)),ae=V+l[X]-n,W=R+l[X+1]-d,P=T+l[X+2]-f,ne=ae*ae+W*W+P*P;ne<r&&(r=ne)}}}return Math.min(Math.sqrt(r),1)}const S=t*t*t,M=new Float32Array(S),E=new Float32Array(S),h=new Float32Array(S);let O=0;for(let n=0;n<t;n+=1)for(let d=0;d<t;d+=1)for(let f=0;f<t;f+=1,O+=1){const c=(f+.5)/t,l=(d+.5)/t,m=(n+.5)/t,y=(w(c*4,l*4,m*4,4)+.5*w(c*8,l*8,m*8,8)+.25*w(c*16,l*16,m*16,16))/1.75,k=1-b(c*4,l*4,m*4,4),r=1-b(c*8,l*8,m*8,8),v=1-b(c*16,l*16,m*16,16),T=1-b(c*32,l*32,m*32,32);M[O]=.6*(.625*k+.25*r+.125*v)+.4*(y*.5+.5),E[O]=.5*r+.3*v+.2*T,h[O]=w(c*2,l*2,m*2,2)+.5*w(c*4,l*4,m*4,4)+.25*w(c*8,l*8,m*8,8)+.125*w(c*16,l*16,m*16,16)}const q=n=>{const d=Float32Array.from(n).sort();return[d[Math.floor(d.length*.005)],d[Math.floor(d.length*.995)]]},$=q(M),A=q(E),z=q(h),D=new Uint8Array(S*4),H=(n,d)=>Math.max(0,Math.min(255,Math.round((n-d[0])/(d[1]-d[0])*255)));for(let n=0;n<S;n+=1)D[n*4]=H(M[n],$),D[n*4+1]=H(E[n],A),D[n*4+2]=H(h[n],z),D[n*4+3]=255;const F=new qe(D,t,t,t);return F.format=ce,F.type=Xe,F.minFilter=ie,F.magFilter=ie,F.wrapS=me,F.wrapT=me,F.wrapR=me,F.generateMipmaps=!1,F.unpackAlignment=1,F.needsUpdate=!0,F}let xe=null;function wt(){return xe||(xe=mt()),xe}function vt({count:t,vents:o}){const s=Fe(t,"vec4").setName("emberState"),i=Fe(t,"vec4").setName("emberMotion"),e={buoyancy:x(3),dt:x(1/60),glow:x(6),life:x(2.5),seed:x(11,"uint"),size:x(.025),speed:x(2.5),streak:x(.06),time:x(0),turbulence:x(2),wind:x(new we(-1.5,0,.4))},p=(l,m)=>lt(l.mul(se(8)).add(se(m)).add(e.seed.mul(se(7919)))),g=(l,m)=>l.add(se(t).mul(m.toUint())),u=l=>e.life.mul(p(l,3).mul(.8).add(.5)),a=l=>{const m=p(l,5).mul(o.length).floor();let y=C(...o[0].at),k=C(...o[0].out);return o.forEach((r,v)=>{if(v===0)return;const T=m.equal(J(v));y=he(T,C(...r.at),y),k=he(T,C(...r.out),k)}),{at:y,out:k}},w=ve(()=>{const l=ee,m=J(l).div(t).mul(e.life).mul(1.5);s.element(l).assign(N(0,-100,0,m.negate())),i.element(l).assign(N(0))})().compute(t).setName("emberInit"),b=ve(()=>{const l=ee,m=s.element(l).toVar(),y=i.element(l).toVar(),k=m.w.add(e.dt).toVar(),r=y.w.toVar();Le(k.greaterThan(u(g(l,r))),()=>{r.addAssign(1),k.assign(p(g(l,r),9).mul(e.dt).negate())});const v=g(l,r);Le(k.greaterThanEqual(0).and(k.lessThan(e.dt.mul(1.5))),()=>{const{at:T,out:I}=a(v),L=C(p(v,0).sub(.5),p(v,1).sub(.5),p(v,2).sub(.5)),R=I.normalize().mul(e.speed.mul(p(v,4).mul(.8).add(.4))).add(L.mul(e.speed));m.assign(N(T.add(L.mul(.35)),k)),y.assign(N(R,r))}).ElseIf(k.greaterThan(0),()=>{const T=m.xyz,I=C(e.time.mul(.3),e.time.mul(-.9),e.time.mul(.2)),L=at(T.mul(1.4).add(I).add(p(v,6).mul(9))),R=C(0,e.buoyancy.mul(Ae(k.mul(-.6))),0),B=e.wind.add(L.mul(e.turbulence)).add(R),_=ue(y.xyz,B,J(1).sub(Ae(e.dt.mul(-1.6))));y.assign(N(_,r)),m.assign(N(T.add(_.mul(e.dt)),k))}).Else(()=>{m.w.assign(k),y.w.assign(r)}),s.element(l).assign(m),i.element(l).assign(y)})().compute(t).setName("emberUpdate"),S=new Je({blending:Ke,depthWrite:!0,toneMapped:!1,transparent:!0});S.alphaTest=.4;const M=s.element(ee),E=i.element(ee),h=g(ee,E.w),O=M.w.div(u(h)).clamp(0,1),q=nt.mul(N(E.xyz,0)).xyz,$=q.xy.length(),A=e.size.mul(p(h,7).mul(.9).add(.4));S.positionNode=M.xyz,S.scaleNode=te(A,A.add($.mul(e.streak))),S.rotationNode=ot(q.y,q.x).sub(Math.PI/2);const z=J(1).sub(O).pow(1.4).toVarying("emberHeat"),D=he(M.w.greaterThan(0),J(1),J(0)).toVarying("emberAlive"),H=p(h,8).mul(40).add(e.time.mul(p(h,10).mul(14).add(6))).sin().mul(.35).add(.75).toVarying("emberTwinkle"),F=st().mul(2).sub(1),n=oe(.2,1,F.dot(F)).oneMinus(),d=ue(ue(C(.5,.05,.01),C(1,.35,.05),oe(0,.45,z)),C(1,.85,.55),oe(.55,1,z));S.colorNode=d.mul(e.glow).mul(z.add(.15)).mul(H),S.opacityNode=n.mul(D).mul(oe(0,.08,z));const f=new Qe(S);f.count=t,f.frustumCulled=!1,f.renderOrder=2;let c=!1;return{mesh:f,uniforms:e,advance(l,m){c||(l.compute(w),c=!0),e.dt.value=Math.min(Math.max(m,0),1/15),e.time.value+=e.dt.value,l.compute(b)},dispose(){S.dispose(),w.dispose?.(),b.dispose?.()}}}const K=3;function pt(t,o,s){const i=t-1,e=o?", sT: texture_2d<f32>, haze: vec4f":"",p=o?`let skip = max(floor(min((g.x - reach) * 0.8, select(1e3, haze.y, haze.x > 0.0)) / dt), 1.0) * dt;
      col += tr * plumeSpots(sT, p) * plumeHaze(haze, p) * skip;
      t += skip;`:"t += max(floor((g.x - reach) * 0.8 / dt), 1.0) * dt;",g=o?"let spot = plumeSpots(sT, p);":"",u=o?" + spot * haze.z":"",a=o?"col += tr * spot * plumeHaze(haze, p) * stride;":"",w=o?`
fn plumeHaze(haze: vec4f, p: vec3f) -> f32 {
  return haze.x * exp(-max(p.y, 0.0) / haze.w);
}
fn plumeSpots(sT: texture_2d<f32>, p: vec3f) -> vec3f {
  var c = vec3f(0.0);
  for (var i = 0; i < ${o}; i++) {
    let a = textureLoad(sT, vec2i(i * ${K}, 0), 0);
    let v = p - a.xyz;
    let d2 = dot(v, v);
    if (d2 > a.w * a.w) { continue; }
    let b = textureLoad(sT, vec2i(i * ${K} + 1, 0), 0);
    let e = textureLoad(sT, vec2i(i * ${K} + 2, 0), 0);
    let d = sqrt(d2);
    let cone = smoothstep(b.w, e.w, dot(v / max(d, 1e-4), b.xyz));
    let fall = (1.0 - smoothstep(a.w * 0.5, a.w, d)) / (d2 + 0.3);
    c += e.rgb * cone * fall;
  }
  return c;
}`:"";return`
fn plumeMarch(eye: vec3f, dir: vec3f, tStart: f32, tEnd: f32, jitter: f32, stretch: f32,
              boxMin: vec3f, boxSize: vec3f, grid: vec3f, lightDir: vec3f, time: f32,
              flow: vec4f, shape: vec4f, fire: vec4f, detail: vec4f, lick: vec4f,
              lightCol: vec3f, ambLo: vec3f, ambHi: vec3f, albedo: vec3f, glowCol: vec3f,
              hot: vec3f, mid: vec3f, cool: vec3f,
              gT: texture_3d<f32>, gS: sampler, nT: texture_3d<f32>, nS: sampler,
              pT: texture_2d<f32>${e}) -> vec4f {
  let cosT = dot(dir, lightDir);
  let ph0 = mix(plumeHg(cosT, -0.22), plumeHg(cosT, 0.80), 0.70);
  let ph1 = mix(plumeHg(cosT, -0.11), plumeHg(cosT, 0.42), 0.70);
  let ph2 = mix(plumeHg(cosT, -0.05), plumeHg(cosT, 0.20), 0.70);
  let dt = detail.z;
  let budget = i32(detail.w);
  var dense = 0;
  var col = vec3f(0.0);
  var tr = 1.0;
  var entry = 0.0;
  var t = tStart + jitter * dt;
  for (var i = 0; i < 400; i++) {
    if (dense >= budget || t > tEnd || tr < 0.02) { break; }
    let p = eye + dir * t;
    let uvw = (p - boxMin) / boxSize;
    let g = textureSampleLevel(gT, gS, uvw, 0.0);
    let reach = plumeRadius(g.y, shape) * (1.0 + flow.y) + 0.6;
    if (g.x > reach) {
      ${p}
      continue;
    }
    dense += 1;
    let voxel = clamp(vec3i(uvw * grid), vec3i(0), vec3i(grid) - 1);
    let ids = textureLoad(gT, voxel, 0);
    let near = plumeBlend(pT, i32(round(ids.z)), i32(round(ids.w)), p);
    let R = plumeRadius(near.s, shape);
    // Flow map: the noise slides along the trail in two phases a half
    // period apart, each reset while the other carries it, so the slide stays
    // bounded and segment joints never shear the pattern apart over time.
    let phase = time * flow.x / FLOW_PERIOD;
    let fa = fract(phase);
    let fb = fract(phase + 0.5);
    let wb = abs(fa * 2.0 - 1.0);
    let da = near.along * fa * FLOW_PERIOD;
    let db = near.along * fb * FLOW_PERIOD;
    let rise = vec3f(0.0, -time * 0.02, 0.0);
    let qa = (p - da) * flow.z + rise + near.salt;
    let qb = (p - db) * flow.z + rise + near.salt + FLOW_OFFSET;
    let bil = mix(plumeBillow(nT, nS, qa), plumeBillow(nT, nS, qb), wb);
    let tube = R - near.dist;
    let sd = tube + (bil - 0.5) * flow.y * (R * 1.4 + 0.4);
    let fine = mix(textureSampleLevel(nT, nS, qa * detail.y, 0.0).g,
                   textureSampleLevel(nT, nS, qb * detail.y, 0.0).g, wb);
    let er = (1.0 - fine) * detail.x;
    var d = clamp((sd + 0.1 - er * (1.0 - clamp(sd * 0.4, 0.0, 0.7))) * 4.0 / (0.5 + R), 0.0, 1.0);
    d *= flow.w * (1.0 - smoothstep(shape.z, 1.0, near.s));
    if (lick.x > 0.0) {
      let z = near.s / fire.x;
      let lq = (p - vec3f(0.0, time * lick.y, 0.0)) * vec3f(lick.z, lick.z * lick.w, lick.z) + near.salt * 7.0;
      let tongue = textureSampleLevel(nT, nS, lq, 0.0).b;
      let th = mix(0.2, 0.68, clamp(z, 0.0, 1.0));
      let mask = smoothstep(th - 0.08, th + 0.08, tongue);
      d *= mix(1.0, mask, lick.x * (1.0 - smoothstep(1.0, 1.6, z)));
    }
    var stride = dt;
    if (d < 0.02) { stride = dt * 2.0; }
    ${g}
    if (d > 0.002) {
      if (entry == 0.0) { entry = t / stretch; }
      let temp = clamp(1.0 - near.s / fire.x + (bil - 0.5) * 0.9, 0.0, 1.0) * smoothstep(-0.3, 0.6, tube / R);
      let sigma = d * shape.w * mix(1.0, 0.35, temp);
      let flowAt = vec4f(rise + near.salt, wb);
      var od = 0.0;
      od += plumeShadowTap(gT, gS, nT, nS, p + lightDir * 0.25, da, db, flowAt, boxMin, boxSize, shape, flow) * 0.3;
      od += plumeShadowTap(gT, gS, nT, nS, p + lightDir * 0.8, da, db, flowAt, boxMin, boxSize, shape, flow) * 0.7;
      od += plumeShadowTap(gT, gS, nT, nS, p + lightDir * 2.2, da, db, flowAt, boxMin, boxSize, shape, flow) * 1.8;
      let k = flow.w * shape.w * fire.w;
      let lit = ph0 * exp(-od * k) + 0.34 * ph1 * exp(-od * k * 0.4) + 0.14 * ph2 * exp(-od * k * 0.17);
      let amb = mix(ambLo, ambHi, 1.0 - clamp(tube / R, 0.0, 1.0) * 0.7);
      let glow = exp(-max(near.s - fire.x, 0.0) * 14.0) * fire.z;
      let scatter = albedo * (lightCol * lit + amb + glowCol * glow * 1.5${u});
      let ramp = mix(mix(cool, mid, smoothstep(0.0, 0.5, temp)), hot, smoothstep(0.5, 1.0, temp));
      let emission = ramp * temp * temp * temp * fire.y * d;
      let a = exp(-sigma * stride);
      col += tr * (scatter * (1.0 - a) + emission * stride);
      tr *= a;
    }
    ${a}
    t += stride;
  }
  // Alpha carries where the smoke starts (world units, 1/32 steps) and its
  // coverage, as Nightscape's cloud pass packs depth with transmittance.
  // Past 98% cover the rest is soot: call it opaque, so the last couple of
  // percent never lets a sunlit glint through.
  var cover = 1.0 - tr;
  if (tr < 0.02) {
    col /= cover;
    cover = 1.0;
  }
  return vec4f(col, floor(clamp(entry, 0.0, 4000.0) * 32.0) + clamp(cover, 0.0, 1.0) * 0.999);
}

const FLOW_PERIOD: f32 = 3.0;
const BLEND: f32 = ${s.toFixed(4)};
const FLOW_OFFSET: vec3f = vec3f(0.31, 0.57, 0.13);

struct PlumeNear { dist: f32, s: f32, along: vec3f, salt: vec3f }
${w}
fn plumeBillow(nT: texture_3d<f32>, nS: sampler, q: vec3f) -> f32 {
  let q2 = vec3f(2.0 * q.x + q.z, 2.0 * q.y, 2.0 * q.z - q.x);
  return 0.64 * textureSampleLevel(nT, nS, q, 0.0).r + 0.36 * textureSampleLevel(nT, nS, q2 + 0.37, 0.0).r;
}
// The trail's direction at point i, from its neighbours, so the flow turns
// smoothly through each joint instead of in steps.
fn plumeTangent(pT: texture_2d<f32>, i: i32, plume: i32) -> vec3f {
  let lo = textureLoad(pT, vec2i(max(i - 1, 0), plume), 0).xyz;
  let hi = textureLoad(pT, vec2i(min(i + 1, ${t-1}), plume), 0).xyz;
  return normalize(hi - lo);
}

fn plumeSegment(pT: texture_2d<f32>, id: i32, p: vec3f) -> PlumeNear {
  let plume = id / ${i};
  let i = id % ${i};
  let a = textureLoad(pT, vec2i(i, plume), 0);
  let b = textureLoad(pT, vec2i(i + 1, plume), 0);
  let trail = textureLoad(pT, vec2i(${t}, plume), 0);
  let scale = trail.x;
  let ab = b.xyz - a.xyz;
  let h = clamp(dot(p - a.xyz, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  let along = normalize(mix(plumeTangent(pT, i, plume), plumeTangent(pT, i + 1, plume), h));
  return PlumeNear(length(p - a.xyz - ab * h) / scale, mix(a.w, b.w, h), along, trail.yzw);
}
// Where two trails come near each other, both are measured and blended
// over \`blend\` (in trail widths), so the field has no seam where the nearer
// one changes. Only two are known per voxel: where a third comes within the
// band, the pair changes from voxel to voxel and the blend seams on the
// guide's grid, so many trails packed together want a narrow band.
fn plumeBlend(pT: texture_2d<f32>, first: i32, second: i32, p: vec3f) -> PlumeNear {
  let a = plumeNearest(pT, first, p);
  if (second < 0) { return a; }
  let b = plumeNearest(pT, second, p);
  let w = smoothstep(-BLEND * 4.0 / 3.0, BLEND * 4.0 / 3.0, a.dist - b.dist);
  let h = clamp(0.5 + 0.5 * (b.dist - a.dist) / BLEND, 0.0, 1.0);
  let dist = mix(b.dist, a.dist, h) - BLEND * h * (1.0 - h);
  return PlumeNear(dist, mix(a.s, b.s, w), normalize(mix(a.along, b.along, w) + vec3f(0.0, 1e-4, 0.0)),
                   mix(a.salt, b.salt, w));
}
fn plumeNearest(pT: texture_2d<f32>, id: i32, p: vec3f) -> PlumeNear {
  let first = (id / ${i}) * ${i};
  var best = plumeSegment(pT, id, p);
  if (id > first) {
    let n = plumeSegment(pT, id - 1, p);
    if (n.dist < best.dist) { best = n; }
  }
  if (id < first + ${i-1}) {
    let n = plumeSegment(pT, id + 1, p);
    if (n.dist < best.dist) { best = n; }
  }
  return best;
}
fn plumeRadius(s: f32, shape: vec4f) -> f32 {
  return mix(shape.x, shape.y, pow(clamp(s, 0.0, 1.0), 0.7));
}
fn plumeShadowTap(gT: texture_3d<f32>, gS: sampler, nT: texture_3d<f32>, nS: sampler, p: vec3f,
                  da: vec3f, db: vec3f, flowAt: vec4f, boxMin: vec3f, boxSize: vec3f, shape: vec4f, flow: vec4f) -> f32 {
  let g = textureSampleLevel(gT, gS, (p - boxMin) / boxSize, 0.0);
  let R = plumeRadius(g.y, shape);
  let bil = mix(textureSampleLevel(nT, nS, (p - da) * flow.z + flowAt.xyz, 0.0).r,
                textureSampleLevel(nT, nS, (p - db) * flow.z + flowAt.xyz + FLOW_OFFSET, 0.0).r, flowAt.w);
  let sd = R - g.x + (bil - 0.5) * flow.y * (R * 1.4 + 0.4);
  return clamp(sd * 4.0 / (0.5 + R), 0.0, 1.0) * (1.0 - smoothstep(shape.z, 1.0, g.y));
}
fn plumeHg(c: f32, g: f32) -> f32 {
  let g2 = g * g;
  return (1.0 - g2) / (12.566 * pow(1.0 + g2 - 2.0 * g * c, 1.5));
}
`}const ge=new Map;function ft(t,o,s){const i=`${t}:${o}:${s}`;return ge.has(i)||ge.set(i,Ce(pt(t,o,s))),ge.get(i)}const ut=Ce(`
fn plumeComposite(sceneCol: vec3f, uv: vec2f, sceneDist: f32, smokeT: texture_2d<f32>) -> vec4f {
  let size = vec2f(textureDimensions(smokeT));
  let st = uv * size - 0.5;
  let base = floor(st);
  let f = st - base;
  var rgb = vec3f(0.0);
  var a = 0.0;
  for (var k = 0; k < 4; k++) {
    let o = vec2f(f32(k % 2), f32(k / 2));
    let w = mix(1.0 - f.x, f.x, o.x) * mix(1.0 - f.y, f.y, o.y);
    let v = textureLoad(smokeT, clamp(vec2i(base + o), vec2i(0), vec2i(size) - 1), 0);
    let dq = floor(v.a);
    let keep = select(1.0, 0.0, sceneDist < dq / 32.0 - 0.05);
    rgb += v.rgb * w * keep;
    a += (v.a - dq) / 0.999 * w * keep;
  }
  // Behind smoke the scene is held to plain daylight brightness: a specular
  // glint is many times brighter than the sky, and a few percent of it
  // through thin smoke would draw a line.
  let behind = mix(sceneCol, min(sceneCol, vec3f(1.0)), clamp(a * 2.0, 0.0, 1.0));
  return vec4f(behind * (1.0 - a) + rgb, 1.0);
}
`);function bt(){return{albedo:x(new U),ambHi:x(new U),ambLo:x(new U),cameraPosition:x(new we),cameraWorld:x(new pe),cool:x(new U),detail:x(new Z),drawSize:x(new Pe(1,1)),far:x(1e3),fire:x(new Z),flow:x(new Z),glowCol:x(new U),haze:x(new Z(0,.3,1,4)),hot:x(new U),lick:x(new Z),lightCol:x(new U),lightDir:x(new we(0,1,0)),mid:x(new U),near:x(.1),projectionInverse:x(new pe),shape:x(new Z),time:x(0),toLocal:x(new pe)}}function yt(t,o,s){o.updateMatrixWorld(),s.getDrawingBufferSize(t.drawSize.value),t.cameraPosition.value.setFromMatrixPosition(o.matrixWorld),t.cameraWorld.value.copy(o.matrixWorld),t.projectionInverse.value.copy(o.projectionMatrixInverse);const{far:i,near:e}=t;e.value=o.near,i.value=o.far}function zt(t){const o=new Float32Array(Math.max(t,1)*K*4),s=new Re(o,Math.max(t,1)*K,1,ce,be);return s.minFilter=Q,s.magFilter=Q,s.needsUpdate=!0,s}function Tt(t,o,{color:s,cosInner:i,cosOuter:e,dir:p,position:g,range:u}){const a=t.image.data,w=o*K*4;a.set([g.x,g.y,g.z,u],w),a.set([p.x,p.y,p.z,e],w+4),a.set([s.r,s.g,s.b,i],w+8)}function Ee(t,o,s){const i=te(G.x.mul(2).sub(1),G.y.oneMinus().mul(2).sub(1)),e=o.projectionInverse.mul(N(i,1,1)),p=e.xyz.div(e.w).normalize(),g=t.getTextureNode("depth");let u=g.sample(G).r;if(s){const a=s.div(o.drawSize);u=Y(Y(g.sample(G.add(a)).r,g.sample(G.sub(a)).r),Y(g.sample(G.add(te(a.x,a.y.negate()))).r,g.sample(G.add(te(a.x.negate(),a.y))).r))}return{dir:o.cameraWorld.mul(N(p,0)).xyz,dist:dt(u,o.near,o.far).div(p.z)}}function St({blend:t=.6,bounds:o,guide:s,noise:i,pathSamples:e,points:p,spotTexture:g=null,spots:u=0,u:a}){const w=C(...o.min),b=C(...o.min.map((M,E)=>M+o.size[E])),S=ft(e,u,t);return M=>{const E=ve(()=>{const q=Ee(M,a,te(.5,.5)),$=a.toLocal.mul(N(a.cameraPosition,1)).xyz,A=a.toLocal.mul(N(q.dir,0)).xyz,z=A.length(),D=A.div(z).toVar(),H=D.add(C(13e-6,17e-6,11e-6)),F=w.sub($).div(H),n=b.sub($).div(H),d=le(F,n),f=Y(F,n);return S({eye:$,dir:D,tStart:Y(Y(Y(d.x,d.y),d.z),0),tEnd:le(le(le(f.x,f.y),f.z),q.dist.mul(z)),jitter:rt(it),stretch:z,boxMin:w,boxSize:C(...o.size),grid:C(...o.grid),lightDir:a.toLocal.mul(N(a.lightDir,0)).xyz.normalize(),time:a.time,flow:a.flow,shape:a.shape,fire:a.fire,detail:a.detail,lick:a.lick,lightCol:a.lightCol,ambLo:a.ambLo,ambHi:a.ambHi,albedo:a.albedo,glowCol:a.glowCol,hot:a.hot,mid:a.mid,cool:a.cool,gT:re(s),gS:re(s),nT:re(i),nS:re(i),pT:De(p),...u?{sT:De(g),haze:a.haze}:{}})})(),h=ct(E,null,null,{type:be});return h.renderTarget.texture.minFilter=Q,h.renderTarget.texture.magFilter=Q,{frame:ut({sceneCol:M.rgb,uv:G,sceneDist:Ee(M,a,null).dist,smokeT:h}),smoke:h}}}function kt(t,{cell:o=.45,margin:s=4}={}){const i=[1/0,1/0,1/0],e=[-1/0,-1/0,-1/0];t.forEach(({path:u})=>u.forEach(a=>a.forEach((w,b)=>{i[b]=Math.min(i[b],w-s),e[b]=Math.max(e[b],w+s)})));const p=e.map((u,a)=>u-i[a]),g=p.map(u=>Math.ceil(u/o));return{cell:o,grid:g,min:i,size:p}}function Ie(t,o=1){const s=[0];for(let e=1;e<t.length;e+=1){const[p,g,u]=t[e-1],[a,w,b]=t[e];s.push(s[e-1]+Math.hypot(a-p,w-g,b-u))}const i=s[s.length-1];return s.map(e=>e/i*o)}function Mt(t,o){const s=o+1,i=new Float32Array(s*t.length*4);t.forEach(({path:p,salt:g,scale:u,span:a},w)=>{const b=Ie(p,a);p.forEach(([S,M,E],h)=>{i.set([S,M,E,b[h]],(w*s+h)*4)}),i.set([u,...g],(w*s+o)*4)});const e=new Re(i,s,t.length);return e.format=ce,e.type=be,e.minFilter=Q,e.magFilter=Q,e.needsUpdate=!0,e}function ht(t,o){const{path:s,scale:i,span:e}=t,p=Ie(s,e);return s.slice(1).map((g,u)=>{const a=s[u],w=g.map((S,M)=>S-a[M]),b=Math.hypot(...w)||1e-6;return{a,d:w,id:o*(s.length-1)+u,len2:b*b,s0:p[u],s1:p[u+1],scale:i}})}function Ft(t,o,s){const{cell:i,grid:e,min:p}=s,[g,u,a]=e,w=t[0].path.length-1,b=new Float64Array(t.length),S=new Float64Array(t.length),M=new Float64Array(t.length),E=t.flatMap((z,D)=>o[D]?ht(z,D):[]),h=new Float64Array(E.length*11);E.forEach((z,D)=>{h.set([...z.a,...z.d,1/z.len2,z.s0,z.s1-z.s0,1/z.scale,z.id],D*11)});const O=new Uint16Array(g*u*a*4),q=et.toHalfFloat;let $=0;for(let z=0;z<a;z+=1){const D=p[2]+(z+.5)*i;for(let H=0;H<u;H+=1){const F=p[1]+(H+.5)*i;for(let n=0;n<g;n+=1,$+=4){const d=p[0]+(n+.5)*i;b.fill(1e3);for(let r=0;r<h.length;r+=11){const v=d-h[r],T=F-h[r+1],I=D-h[r+2],L=Math.min(1,Math.max(0,(v*h[r+3]+T*h[r+4]+I*h[r+5])*h[r+6])),R=v-h[r+3]*L,B=T-h[r+4]*L,_=I-h[r+5]*L,V=Math.sqrt(R*R+B*B+_*_)*h[r+9],j=Math.floor(h[r+10]/w);V<b[j]&&(b[j]=V,S[j]=h[r+10],M[j]=h[r+7]+h[r+8]*L)}let f=-1,c=-1;b.forEach((r,v)=>{r>=1e3||(f<0||r<b[f]?(c=f,f=v):(c<0||r<b[c])&&(c=v))});const l=f<0?1e3:b[f],m=f<0?1:M[f],y=f<0?-1:S[f],k=c<0||b[c]-l>2?-1:S[c];O[$]=q(l),O[$+1]=q(m),O[$+2]=q(y),O[$+3]=q(k)}}}const A=new qe(O,g,u,a);return A.format=ce,A.type=tt,A.minFilter=ie,A.magFilter=ie,A.wrapS=fe,A.wrapT=fe,A.wrapR=fe,A.unpackAlignment=1,A.needsUpdate=!0,A}export{bt as a,Mt as b,vt as c,Ft as d,St as e,zt as f,kt as p,wt as s,yt as u,Tt as w};
