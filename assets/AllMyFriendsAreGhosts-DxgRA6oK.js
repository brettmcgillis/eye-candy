import{C as z,Z as ve,B as vt,aO as He,aY as yt,h as de,D as bt,V as S,r as s,ak as he,b6 as Ne,a as E,j as m,bX as V,M as re,I as xe,U as ne,H as Ee,a4 as qt,aB as Ze,bH as Qt,a3 as Jt,aw as eo,ax as to,ce as oo,b as ze,u as Ct,cI as kt,X as Ve,d as ao,aH as qe,_ as xt,c5 as io,dc as ro,Q as Rt,a8 as so,l as Re,E as no,ah as C,a9 as lo}from"./index-BMaCTZDK.js";import{u as co}from"./useSceneBackdrop-D09rjoaX.js";import{u as uo,g as fo,C as mo}from"./useSceneCameraControls-C58cma5b.js";import"./cameraSplinePresets-DDaxuY2-.js";import"./useOperatorInput-CN9ApT7B.js";import{u as ho,g as go,L as po}from"./useSceneLightingControls-3itvr05J.js";import{u as y,K as W,E as So,J as vo,b4 as yo,b6 as bo,w as Ae,c as Ie,r as Y,j as _,k as _e,m as Ge,a6 as Co,a_ as ko,ap as wt,G as xo,H as Ro,aL as wo,ax as Mo,h as Do,a2 as Lo,b as te,bQ as Qe,aZ as Mt}from"./three.tsl-BKvAmuDR.js";import{u as j}from"./Texture-Dn3exuRQ.js";import{S as Je,B as To}from"./GhostCharacter-DzskJBRc.js";import{g as Wo,h as Po,S as Fo,L as Eo,W as zo,a as Ao,c as Io,d as _o,e as Go,f as Bo,i as Oo,j as Ho,k as No,l as Vo}from"./SkyMesh-BoDhfAeR.js";import{M as jo}from"./Moon-CY8gycJq.js";import{u as Uo,r as Ko,a as je,b as Ue,W as Yo,D as Xo}from"./controls-uD4QDHX-.js";import{B as $o}from"./Boeing737-kfxMVoHT.js";import{L as Zo}from"./Lightning-f3gBxC_A.js";import{u as qo}from"./usePresetsFolder-BWieoE85.js";import{u as Qo}from"./useMediaRecorder-JPT0ciE1.js";import"./useCameraSpline-D4D1TreY.js";import"./OrthographicCamera-DavcqlES.js";import"./extends-CF3RwP-h.js";import"./Fbo-CnyguowS.js";import"./PerspectiveCamera-RT0doRH6.js";import"./OrbitControls-CyE_rlpe.js";import"./Line-D5EXqPUj.js";import"./Line2-Bm1KeJhL.js";import"./constants-ChPw4ztP.js";import"./math-BSb_Qlxs.js";import"./Outline-BFScopBh.js";import"./pinHelpers-ILSejyWo.js";import"./BurnEmbers-wcmLuDDa.js";import"./inkBleed-Cu0OO6Vl.js";import"./Gltf-DLj6s4Sm.js";import"./BufferGeometryUtils-CEdrQec3.js";import"./BufferGeometryUtils-BSFadLNK.js";import"./lightningUtils-IRkzANVI.js";import"./Html-DTQO14R8.js";import"./isMobileDevice-De1yZKQi.js";const ge=16e3,et=.0045,q=28,we=.04;function Jo(e){const t={brightness:y(1),tint:y(new z)},a=new ve({depthWrite:!1,fog:!1,side:vt,toneMapped:!1});return a.colorNode=W(e).rgb.mul(t.tint).mul(t.brightness),{material:a,uniforms:t}}function ea(e){const t={atmosphere:y(new z)},a=new He({fog:!1,metalness:0,roughness:.85});a.colorNode=W(e).rgb;const o=new ve({blending:yt,depthWrite:!1,fog:!1,side:vt,transparent:!0}),i=So(vo(yo,bo).abs().oneMinus(),3);return o.colorNode=t.atmosphere.mul(i),{atmosphere:o,surface:a,uniforms:t}}function ta(e,t){const a={displacement:y(0)},o=new He({bumpMap:t,map:e,metalness:0}),i=W(t).r.sub(.5);return o.positionNode=xo.add(wt.mul(i.mul(a.displacement))),{material:o,uniforms:a}}function oa(){const e={coverage:y(.5),horizonColor:y(new z),litColor:y(new z),scroll:y(0),shadeColor:y(new z),softness:y(.1),sunDir:y(new de(0,1)),sunHeight:y(.3)},t=Ae.xz.add(_e(0,e.scroll)).mul(et),a=e.scroll.mul(et*.03),o=Y(_(t,a),4,2.1,.5),i=Y(_(t.add(e.sunDir.mul(.08)),a),4,2.1,.5),r=Ie(e.coverage.sub(e.softness),e.coverage.add(e.softness),o.mul(.5).add(.5)),n=Ro(o.sub(i).mul(3).add(.55),0,1).mul(e.sunHeight.mul(.6).add(.4)),l=Ae.xz.sub(wo.xz).length(),f=Ie(ge*.08,ge*.45,l),u=new ve({depthWrite:!1,side:bt,transparent:!0});return u.colorNode=Ge(Ge(e.shadeColor,e.litColor,n),e.horizonColor,f),u.opacityNode=r.mul(f.oneMinus().mul(.85).add(.15)),{material:u,uniforms:e}}function aa(){const e={color:y(new z),flash:y(0),opacity:y(.3),phase:y(0),velocity:y(new S)},t=Mo("dropOffset","vec4"),a=t.xyz.add(e.velocity.mul(e.phase)),o=a.sub(Do(a.div(q)).mul(q)).sub(q/2),i=new ve({blending:yt,depthWrite:!1,side:bt,transparent:!0});return i.positionNode=Lo.add(o),i.colorNode=_(e.color).mul(e.flash.mul(4).add(1)),i.opacityNode=e.opacity.mul(t.w.mul(.6).add(.4)),{material:i,uniforms:e}}function ia(){const e={dark:y(new z),grain:y(.4),light:y(new z)},t=Ae.xz,a=Ie(-.6,.6,Y(_(t.mul(.03),0),4).add(Y(_(t.mul(.6),1.7),2).mul(.35))),o=t.mul(3.1),i=Y(_(o,0),3),r=Y(_(o.add(_e(we,0)),0),3),n=Y(_(o.add(_e(0,we)),0),3),l=_(r.sub(i),0,n.sub(i)).div(we).mul(e.grain),f=new He({metalness:0,roughness:.97});return f.colorNode=Ge(e.dark,e.light,a),f.normalNode=Co(ko(wt.sub(l))),{material:f,uniforms:e}}const tt=Math.PI/180;function Ke(e,t){const a=e*tt,o=t*tt,i=Math.cos(o);return new S(Math.sin(a)*i,Math.sin(o),Math.cos(a)*i)}const Dt=V("solar-system/earth_daymap.jpg"),ot=4e3,ra=.41,sa=Math.PI/180;j.preload(Dt);function na({angularSize:e,atmosphereColor:t,azimuth:a,elevation:o,spin:i}){const r=j(Dt),n=s.useRef(null);s.useEffect(()=>{r.colorSpace=he,r.anisotropy=4,r.needsUpdate=!0},[r]);const l=s.useMemo(()=>new Ne(1,96,48),[]),{atmosphere:f,surface:u,uniforms:c}=s.useMemo(()=>ea(r),[r]);s.useEffect(()=>{c.atmosphere.value.set(t)},[t,c]),s.useEffect(()=>()=>l.dispose(),[l]),s.useEffect(()=>()=>{u.dispose(),f.dispose()},[f,u]);const d=s.useMemo(()=>Ke(a,o).multiplyScalar(ot),[a,o]),g=ot*Math.tan(e*sa/2);return E((h,p)=>{n.current&&(n.current.rotation.y+=p*i)}),m.jsxs("group",{position:d,scale:g,children:[m.jsx("group",{"rotation-z":ra,children:m.jsx("mesh",{ref:n,geometry:l,material:u})}),m.jsx("mesh",{geometry:l,material:f,scale:1.06})]})}const la=s.memo(na),ca={alphaScale:4,alphaSeed:42,clothHeight:1,clothWidth:1,cursorCollider:!1,cutoutRimColor:"#000000",cutoutRimOffset:0,cutoutRimWidth:.003,dampening:.99,edgeFade:.15,emissiveCenterU:.5,emissiveCenterV:.4,emissiveFalloff:2.5,envMapIntensity:1,gravity:12e-5,handHeight:.3,handSize:.05,handSpacing:.3,handSpring:8,handTrail:.08,holeAmount:0,innerColor:"#cc2222",innerMetalness:0,innerRoughness:.8,maxVelocity:.01,metalness:0,roughness:.8,smoothEdges:!1,squashIntensity:.3,stiffness:.16,swayAmplitude:.02,tatterEdge:0,windAmplitude:4e-4},le=Math.PI/180;function ua(e){return .5*Math.sin(e*1.3+.4)+.3*Math.sin(e*3.7+2.1)+.2*Math.sin(e*9.1+4.6)}function fa({anchorRef:e,config:t}){const a=s.useRef(null),o=s.useRef({animation:null,expressionKey:0,jumpTriggered:!1,windDirX:0,windDirZ:0,windStrength:0}),i=s.useRef(0),{ghostPosition:r,ghostRotationY:n,ghostScale:l,ghostTiltBack:f,ghostWindAngle:u,ghostWindGust:c,ghostWindStrength:d}=t,g=s.useMemo(()=>[r.x,r.y,r.z],[r.x,r.y,r.z]);return E((h,p)=>{i.current+=p;const v=a.current,w=e.current;v&&w&&(v.position.copy(w.position),v.quaternion.copy(w.quaternion));const R=u*le,k=n*le,b=Math.sin(R),x=Math.cos(R),D=Math.cos(k),I=Math.sin(k),P=1+c*ua(i.current),U=o.current;U.windDirX=b*D-x*I,U.windDirZ=b*I+x*D,U.windStrength=Math.max(0,d*P)}),m.jsx("group",{ref:a,children:m.jsx("group",{position:g,"rotation-y":n*le,scale:l,children:m.jsx("group",{"position-y":Je,"rotation-x":-f*le,children:m.jsx("group",{"position-y":-Je,children:m.jsx(To,{...ca,animationInputRef:o,baseWind:t.ghostBaseWind,bobAmplitude:t.ghostBobAmplitude,bobSpeed:t.ghostBobSpeed,color:t.ghostColor,eyeColor:t.ghostEyeColor,eyeIntensity:t.ghostEyeIntensity,groundLightColor:t.ghostGlowColor,groundLightIntensity:t.ghostGroundLightIntensity,innerEmissiveColor:t.ghostGlowColor,innerEmissiveIntensity:t.ghostInnerGlow,outerEmissiveColor:t.ghostGlowColor,outerEmissiveIntensity:t.ghostOuterGlow,segmentsX:t.ghostClothSegments,segmentsY:t.ghostClothSegments,tiltIntensity:t.ghostTilt,windBoostMul:t.ghostWindBoost})})})})})}const ma=s.memo(fa);function G(e,t){const a=JSON.stringify(t.map(o=>e[o]));return s.useMemo(()=>Object.fromEntries(t.map(o=>[o,e[o]])),[a])}const Ye="blackHole",Lt="ocean",Tt="wing",Wt="tinyMoon",Pt="lunarSurface",Ft="campfire",da={"Black Hole":Ye,Ocean:Lt,"Plane Wing":Tt,"Tiny Moon":Wt,"Lunar Surface":Pt,Campfire:Ft};function ha({config:e}){return m.jsxs(m.Fragment,{children:[m.jsx(Wo,{config:e}),e.blackHoleLightEnabled&&m.jsx(Po,{color:e.blackHoleLightColor,config:e,intensity:e.blackHoleLightIntensity,vividness:e.blackHoleLightVividness},e.blackHoleVariant)]})}const ga=s.memo(ha),F=Math.fround,M=Math.PI,ae=1.618,Et=new S(1,.18,.035).multiplyScalar(.5/(.2*.2*.5)),pa=new S(.2,.5,1).multiplyScalar(.005),Sa=new S(.05,0,.02),B=Sa.clone().add(new S(0,-.1,0)),va=new S(1,.075,.01),ya=new S(.2,.15,.05),ba=.73,ye=[[.2,.1,0,ae*M,.5*M,.1,.4],[0,.23,0,2*ae*M,.41*M,.08,.6],[.25,.21,.1,-ae*M,.28*M,.07,.25],[0,.33,-.1,-4.05*ae*M,.325*M,.06,.55],[.23,.43,.12,0,.2*M,.06,.5],[.19,.43,.35,.5*M,.2*M,.08,.49],[-.05,.55,.26,.8*M,.15*M,.05,.61]].map(([e,t,a,o,i,r,n])=>{const l=(g,h,p)=>[Math.cos(p)*g+Math.sin(p)*h,Math.cos(p)*h-Math.sin(p)*g],[f,u]=l(0,1,-i),[c,d]=l(f,0,-o);return{burnDir:new S(c,u,d),center:new S(e,t,a),length:n,radius:r,rotY:o,rotZ:i}}),at=e=>F(e-Math.floor(e)),X=e=>Math.min(1,Math.max(0,e)),Ca=(e,t,a)=>X((a-e)/(t-e)),ka=(e,t,a)=>{const o=X((a-e)/(t-e));return o*o*(3-2*o)};function xa(e){let t=at(F(F(e)*F(.1031)));return t=F(t*F(t+F(33.33))),t=F(t*F(t+t)),at(t)}const zt=ye.map((e,t)=>F(F(ae)*t)),At=zt.map(e=>xa(F(e*F(657.9759)))*.2),Ra="cycle",Be="hold",Oe="burnDown",It=1-80/60;function wa(e){const t=1.3333333333333333,a=t*1.05,o=e/60,i=o-a*Math.floor(o/a);return Math.min(1,1-i+Math.max(0,(i-t)*30))}function _t({burnSeconds:e,hold:t,mode:a,startTime:o,time:i}){if(a===Be)return t;if(a===Oe){const r=Math.min(1,Math.max(0,(i-o)/e));return 1+(It-1)*r}return wa(i)}function Gt(e,t,a,o){const i=Math.min(1,Math.max(-1,e.dot(t))),r=Math.acos(Math.min(1,Math.max(-1,a))),n=2*M*(1-Math.cos(r+o*.5*M)),l=2*M*(1-a),f=Math.max(1e-5,l)/Math.max(1e-5,n);let u=Math.max(0,Ca(r+.01+o*M*.5,r-.01-o*M*.5,Math.acos(i)))*2;const c=7-6*o;return u=u**c/Math.max(1e-5,1/(c+1)),Math.min(1,u*f)}const Me=new S,it=new S;function Ma(e,t,a,o,i){Me.subVectors(o,e);const r=Me.length(),n=r*r,l=i*i,f=1/Math.max(.001,r)*Math.max(.001,n-l),u=i/r*Math.sqrt(Math.max(.001,n-l)),c=Math.min(1,Math.max(-1,f/Math.hypot(f,u)));it.copy(Me).divideScalar(r);let d=Gt(t,it,c,a);return r<i&&(d=re.lerp(1,d,r/i)),d}const O=new S,De=new S,Le=new S,Xe=new S;function Da(e,t,a,o,i){const r=ye[e],n=zt[e],l=a-At[e];O.copy(r.center).addScaledVector(r.burnDir,(X(l)*2-1)*r.length);const f=Math.sqrt(Math.max(1e-4,l)),u=Math.max(.15,.2+l*1.2)*.65,c=(.1+f)*.2*.75;O.y=Math.max(O.y,c+.05);const d=Math.max(.075,c);De.copy(O).setY(O.y+u),Le.subVectors(De,O);const g=X(Xe.subVectors(o,O).dot(Le)/Le.lengthSq()),h=i;return h.center.lerpVectors(O,De,g),h.radius=re.lerp(d,.01,g),h.strength=Math.sqrt(X(l+.1))*(1+Math.sin(n*2-10*t)*.35+Math.sin(n*4-15*t)*.25),h}const pe=new S,Se=new S,rt=new S,Te=new S;function La(e,t,a,o,i){const r=t.y===0?1e-4:t.y;pe.copy(e).addScaledVector(t,-(e.y-B.y)/r),Se.subVectors(pe,B),rt.copy(Se).normalize().multiplyScalar(ba).add(B),Te.subVectors(B,e).normalize();const n=Xe.subVectors(rt,e).normalize().dot(Te),l=.1*X(10*(o*.75+.25))*Gt(t,Te,n,a);return i.copy(va).multiplyScalar(l)}function st(e,t,a,o,i){const r=t.y===0?1e-4:t.y;pe.copy(e).addScaledVector(t,-(e.y-B.y)/r),Se.subVectors(pe,B);const n=Xe.copy(pa).divideScalar(1+.03*e.lengthSq()),l=i.copy(ya).multiply(Et).multiplyScalar(X(o+.05)*.05/(a+1+Se.lengthSq())),f=ka(.001+a*1.5,-.001-a*1.5,t.y);return l.lerp(n,1-f)}const me=Et,Ta=ye.length,N=e=>e.toFixed(8),nt=e=>`vec3f(${N(e.x)}, ${N(e.y)}, ${N(e.z)})`,Wa=ye.map((e,t)=>`case ${t}u: { return CampfireLog(${nt(e.center)}, ${nt(e.burnDir)}, ${N(e.rotY)}, ${N(e.rotZ)}, ${N(e.radius)}, ${N(e.length)}, ${N(At[t])}); }`).join(`
    `),Bt=`
const kPI: f32 = 3.14159265359;
const kTwoPI: f32 = 6.28318530718;
const kGoldenRatio: f32 = 1.618;
const kMaxDist: f32 = 200.0;
const kTimeScale: f32 = 1.0;
const kNumLogs: u32 = 7u;
const kCampfireCenterWS = vec3f(0.05, 0.0, 0.02);
const kFireStartSphere = vec4f(0.15, 0.25, 0.15, 0.2);
const kFireEndSphere = vec4f(0.1, 0.8, 0.1, 0.05);
const kFireLightColour = vec3f(1.0, 0.18, 0.035) * 0.5 / (0.2 * 0.2 * 0.5);
const kSkyColour = vec3f(0.2, 0.5, 1.0) * 0.005;

// initLogs' table as a switch: an indexed array (private or const) spills.
fn getLog(i: u32) -> CampfireLog {
  switch i {
    ${Wa}
    default: { return CampfireLog(vec3f(0.0), vec3f(0.0, 1.0, 0.0), 0.0, 0.0, 0.0, 0.0, 0.0); }
  }
}

struct CampfireLog {
  centerWS: vec3f,
  burnDirWS: vec3f,
  rotationY: f32,
  rotationZ: f32,
  logRadius: f32,
  logLength: f32,
  lifeOffset: f32,
};

var<private> s_globalFireLife: f32 = 1.0;
var<private> s_time: f32 = 0.0;
var<private> s_timeDelta: f32 = 0.016;
var<private> s_pixelRand: f32 = 0.0;
var<private> s_pixelCone: f32 = 0.0;
// The original's NON_CONST_ZERO: a runtime zero so loops are not unrolled.
var<private> s_zeroI: i32 = 0;
var<private> s_zeroU: u32 = 0u;

fn fmod1(x: f32, y: f32) -> f32 { return x - y * floor(x / y); }
fn fmod2(x: vec2f, y: vec2f) -> vec2f { return x - y * floor(x / y); }
fn fmod3(x: vec3f, y: vec3f) -> vec3f { return x - y * floor(x / y); }

fn smoothstepg(e0: f32, e1: f32, x: f32) -> f32 {
  let t = saturate((x - e0) / (e1 - e0));
  return t * t * (3.0 - 2.0 * t);
}

fn linearstep(start: f32, end: f32, x: f32) -> f32 {
  return saturate((x - start) / (end - start));
}

fn vmax(v: vec3f) -> f32 { return max(max(v.x, v.y), v.z); }
fn fSphere(p: vec3f, r: f32) -> f32 { return length(p) - r; }
fn fBoxCheap(p: vec3f, b: vec3f) -> f32 { return vmax(abs(p) - b); }

fn fCylinder(p: vec3f, r: f32, height: f32) -> f32 {
  var d = length(p.xz) - r;
  d = max(d, abs(p.y) - height);
  return d;
}

fn fCapsuleY(p: vec3f, r: f32, c: f32) -> f32 {
  return mix(length(p.xz) - r, length(vec3f(p.x, abs(p.y) - c, p.z)) - r, step(c, abs(p.y)));
}

fn fLineSegment(p: vec3f, a: vec3f, b: vec3f) -> f32 {
  let ab = b - a;
  let t = saturate(dot(p - a, ab) / dot(ab, ab));
  return length((ab * t + a) - p);
}

fn fCapsuleAB(p: vec3f, a: vec3f, b: vec3f, r: f32) -> f32 {
  return fLineSegment(p, a, b) - r;
}

fn pR(p: vec2f, a: f32) -> vec2f {
  return cos(a) * p + sin(a) * vec2f(p.y, -p.x);
}

fn pModPolar(p: ptr<function, vec2f>, repetitions: f32) -> f32 {
  let angle = 2.0 * kPI / repetitions;
  var a = atan2((*p).y, (*p).x) + angle / 2.0;
  let r = length(*p);
  var c = floor(a / angle);
  a = fmod1(a, angle) - angle / 2.0;
  *p = vec2f(cos(a), sin(a)) * r;
  if (abs(c) >= (repetitions / 2.0)) {
    c = abs(c);
  }
  return c;
}

fn pMod2(p: ptr<function, vec2f>, size: vec2f) -> vec2f {
  let c = floor((*p + size * 0.5) / size);
  *p = fmod2(*p + size * 0.5, size) - size * 0.5;
  return c;
}

fn pMod3(p: ptr<function, vec3f>, size: vec3f) -> vec3f {
  let c = floor((*p + size * 0.5) / size);
  *p = fmod3(*p + size * 0.5, size) - size * 0.5;
  return c;
}

fn plaIntersect(ro: vec3f, rd: vec3f, p: vec4f) -> f32 {
  return -(dot(ro, p.xyz) + p.w) / dot(rd, p.xyz);
}

fn sdEllipsoid(p: vec3f, r: vec3f) -> f32 {
  let k0 = length(p / r);
  let k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / k1;
}

fn sdEllipsoidY(p: vec3f, r: vec2f) -> f32 {
  return (length(p / r.xyx) - 1.0) * r.x;
}

fn smin(a: f32, b: f32, k: f32) -> f32 {
  let h = max(k - abs(a - b), 0.0);
  return min(a, b) - h * h * 0.25 / k;
}

fn smax(a: f32, b: f32, k: f32) -> f32 {
  let h = max(k - abs(a - b), 0.0);
  return max(a, b) + h * h * 0.25 / k;
}

fn hash11(pIn: f32) -> f32 {
  var p = fract(pIn * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

fn hash12(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn hash22(p: vec2f) -> vec2f {
  var p3 = fract(vec3f(p.xyx) * vec3f(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

fn blackBodyToRGB(temp: f32, brightness: f32) -> vec3f {
  var res = vec3f(0.0);
  for (var i = s_zeroI; i < 3; i++) {
    let f = 1.0 + 0.5 * f32(i);
    res[i] += brightness * (f * f * f) / (exp((19e3 * f / temp)) - 1.0);
  }
  return res;
}

fn roughFresnel(f0: vec3f, cosA: f32, roughness: f32) -> vec3f {
  return f0 + (vec3f(1.0) - f0) * (pow(1.0 - cosA, 5.0)) * (1.0 - roughness);
}

fn fixNormalBackFacingness(rayDirWS: vec3f, normalWSIn: vec3f) -> vec3f {
  return normalWSIn - max(0.0, dot(normalWSIn, rayDirWS)) * rayDirWS;
}

fn computeParaboloidUv(dirIn: vec3f) -> vec2f {
  var dir = dirIn;
  let xz = dir.xz / (abs(dir.y) + 1.0);
  return xz * 0.5 + vec2f(0.5);
}

fn luminance(rgb: vec3f) -> f32 {
  return (rgb.r * 0.3) + (rgb.g * 0.59) + (rgb.b * 0.11);
}

fn tonemapOp(vIn: f32) -> f32 {
  var v = pow(vIn, 2.0);
  v = v / (1.0 + v);
  return pow(v, 1.0 / 2.0) * 1.02;
}

fn tonemap(colour: vec3f) -> vec3f {
  let lum = max(0.0001, luminance(colour));
  let normalisedColour = colour / lum;
  let tonemapColour = vec3f(tonemapOp(colour.r), tonemapOp(colour.g), tonemapOp(colour.b));
  let tonemappedLuminance = tonemapOp(lum);
  return mix(tonemappedLuminance * normalisedColour, tonemapColour, min(1.0, 0.5 * lum));
}

fn diskLight(coneDirWS: vec3f, dirToLightWS: vec3f, cosAngularRadius: f32, roughness: f32) -> f32 {
  let vDotL = dot(coneDirWS, dirToLightWS);
  let brdfDiskSolidAngle = 2.0 * kPI * (1.0 - cos(acos(cosAngularRadius) + roughness * 0.5 * kPI));
  let diskSolidAngle = 2.0 * kPI * (1.0 - cosAngularRadius);
  let brightness = max(0.00001, diskSolidAngle) / max(0.00001, brdfDiskSolidAngle);
  var diskVisibility = max(0.0, linearstep(
    acos(cosAngularRadius) + 0.01 + roughness * kPI * 0.5,
    acos(cosAngularRadius) - 0.01 - roughness * kPI * 0.5,
    acos(vDotL))) * 2.0;
  let brdfPower = 7.0 - 6.0 * roughness;
  diskVisibility = pow(diskVisibility, brdfPower);
  let normalisationFactor = 1.0 / (brdfPower + 1.0);
  diskVisibility /= max(0.00001, normalisationFactor);
  return min(1.0, diskVisibility * brightness);
}

fn computeSphereLighting(posWS: vec3f, coneDirWS: vec3f, roughness: f32, lightSphere: vec4f, colour: vec3f) -> vec3f {
  let posToSphereWS = lightSphere.xyz - posWS;
  let distToSphereCenter = length(posToSphereWS);
  let sqDistToSphere = distToSphereCenter * distToSphereCenter;
  let sqSphereRadius = lightSphere.a * lightSphere.a;
  let distToDisk = (1.0 / max(0.001, distToSphereCenter)) * max(0.001, sqDistToSphere - sqSphereRadius);
  let diskRadius = (lightSphere.a / distToSphereCenter) * sqrt(max(0.001, sqDistToSphere - sqSphereRadius));
  let cosSphereAngularRadius = clamp(distToDisk / sqrt(distToDisk * distToDisk + diskRadius * diskRadius), -1.0, 1.0);
  let posToSphereDirWS = posToSphereWS / distToSphereCenter;
  var sphereLighting = diskLight(coneDirWS, posToSphereDirWS, cosSphereAngularRadius, roughness);
  if (distToSphereCenter < lightSphere.a) {
    sphereLighting = mix(1.0, sphereLighting, distToSphereCenter / lightSphere.a);
  }
  return colour * sphereLighting;
}

fn computeTubeLighting(posWS: vec3f, coneDirWS: vec3f, roughness: f32, startSphere: vec4f, endSphere: vec4f, colour: vec3f) -> vec3f {
  let startToEnd = endSphere.xyz - startSphere.xyz;
  let startToEndDir = normalize(startToEnd);
  let planeTangent = normalize(cross(startToEndDir, -coneDirWS));
  let planeNormal = normalize(cross(planeTangent, startToEndDir));
  let plane = vec4f(-planeNormal, dot(startSphere.xyz, planeNormal));
  let closestPointDistAlongRay = plaIntersect(posWS, coneDirWS, plane);
  let closesPointToTube = posWS + coneDirWS * closestPointDistAlongRay;
  let startToClosest = closesPointToTube - startSphere.xyz;
  let closestDirProgress = saturate(dot(startToClosest, startToEnd) / dot(startToEnd, startToEnd));
  let startToPos = posWS - startSphere.xyz;
  let closestPointProgress = saturate(dot(startToPos, startToEnd) / dot(startToEnd, startToEnd));
  let progress = mix(closestDirProgress, closestPointProgress, roughness * roughness);
  return computeSphereLighting(posWS, coneDirWS, roughness, mix(startSphere, endSphere, progress), colour);
}

fn computeLightingCone(posWS: vec3f, rayDirWS: vec3f, normalWS: vec3f, roughness: f32, ambientVis: f32, shadow: f32) -> vec3f {
  let coneDirWS = normalize(mix(rayDirWS, normalWS, roughness * roughness * 0.75));
  let coalsDiskCenter = kCampfireCenterWS - vec3f(0.0, 0.1, 0.0);
  let coneY = select(coneDirWS.y, 0.0001, coneDirWS.y == 0.0);
  let coneIntersectedWithGround = posWS + coneDirWS * -(posWS.y - coalsDiskCenter.y) / coneY;
  let coalsDiskRadiusWS = 0.73;
  let campfireToGroundPosWS = coneIntersectedWithGround - coalsDiskCenter;
  let campfireToConeGroundDirWS = normalize(campfireToGroundPosWS);
  let farDiskPointOnGroundWS = coalsDiskCenter + campfireToConeGroundDirWS * coalsDiskRadiusWS;
  let posToCoalsDiskCenterDirWS = normalize(coalsDiskCenter - posWS);
  let coalsDiskAngularRadius = dot(normalize(farDiskPointOnGroundWS - posWS), posToCoalsDiskCenterDirWS);

  let sky = kSkyColour / (1.0 + 0.03 * dot(posWS, posWS));
  var ambient = sky;
  let groundAlbedo = vec3f(0.2, 0.15, 0.05);
  let groundColour = groundAlbedo * saturate(s_globalFireLife + 0.05) * 0.05 *
    (kFireLightColour / (roughness + 1.0 + dot(campfireToGroundPosWS, campfireToGroundPosWS)));
  ambient = mix(ambient, groundColour, smoothstepg(0.001 + roughness * 1.5, -0.001 - roughness * 1.5, coneDirWS.y));

  ambient += shadow * 0.1 * vec3f(1.0, 0.075, 0.01) * saturate(10.0 * (s_globalFireLife * 0.75 + 0.25)) *
    diskLight(coneDirWS, posToCoalsDiskCenterDirWS, coalsDiskAngularRadius, roughness);

  ambient *= ambientVis;

  for (var i = s_zeroU; i < kNumLogs; i++) {
    let log = getLog(i);
    let logLength = log.logLength;
    let logCenterWS = log.centerWS;
    let burnDirWS = log.burnDirWS;
    let rand = kGoldenRatio * f32(i);
    let fireLife = s_globalFireLife - log.lifeOffset;
    var flameCenterWS = logCenterWS + burnDirWS * (saturate(fireLife) * 2.0 - 1.0) * logLength;
    let sqrtFireLife = sqrt(max(0.0001, fireLife));
    let flameHeight = max(0.15, 0.2 + fireLife * 1.2) * 0.65;
    let flameRadius = (0.1 + sqrtFireLife) * 0.2 * 0.75;
    flameCenterWS.y = max(flameCenterWS.y, flameRadius + 0.05);
    let fireBottomLight = vec4f(flameCenterWS, max(0.075, flameRadius));
    let fireTopLight = vec4f(flameCenterWS + vec3f(0.0, flameHeight, 0.0), 0.01);
    let fireLight = computeTubeLighting(posWS, coneDirWS, roughness, fireBottomLight, fireTopLight, kFireLightColour);
    let lightIntensity = sqrt(saturate(fireLife + 0.1));
    ambient += shadow * fireLight * lightIntensity *
      (1.0 + sin(rand * 2.0 - 10.0 * s_time) * 0.35 + sin(rand * 4.0 - 15.0 * s_time) * 0.25);
  }
  return ambient;
}

// initLogs' fire-life curve runs in fireLighting.js, so the burn can be held or run once.
fn initLogs(fireLife: f32) {
  s_globalFireLife = fireLife;
}
`,Pa=`
const kMatDefault: f32 = 0.0;
const kMatFire: f32 = 1.0;
const kMatWoodLog: f32 = 2.0;
const kMatRock: f32 = 3.0;
const kMatGround: f32 = 4.0;
const kMatCoals: f32 = 5.0;

struct FireLogResult { logD: f32, fireD: f32, logMaterial: vec4f, fireMaterial: vec4f, };
struct LogsResult { d: f32, material: vec4f, minFireD: f32, };
struct MatResult { d: f32, material: vec4f, };
struct MarchResult { t: f32, material: vec4f, insTrans: vec4f, hit: bool, };

fn fFireLog(centerToPosLS: vec3f, posWS: vec3f, flameCenterIn: vec3f, burnDirWS: vec3f,
            logRadius: f32, logLength: f32, logRand: f32, fireLife: f32, doVolumetric: bool) -> FireLogResult {
  var r: FireLogResult;
  r.fireMaterial = vec4f(0.0);
  let logProgress = (centerToPosLS.y / logLength) * 0.5 + 0.5;
  r.logD = fCylinder(centerToPosLS, logRadius, logLength);

  let uv = vec2f(0.5 + atan(centerToPosLS.x / centerToPosLS.z) / kPI, logLength + centerToPosLS.y);
  let yz = uv + abs(logRand) * vec2f(1.0);
  r.logMaterial = vec4f(kMatWoodLog, yz.x, yz.y, 0.0);
  if (abs(centerToPosLS.y / logLength) > 0.99) {
    r.logMaterial.y = length(centerToPosLS.xz) / logRadius;
    r.logMaterial.z = -1.0;
  }
  r.logMaterial.w = logProgress - fireLife;

  if (!doVolumetric) {
    r.fireD = kMaxDist;
    return r;
  }

  var flameCenterWS = flameCenterIn + burnDirWS * (max(0.0, fireLife) * 2.0 - 1.0) * logLength;
  flameCenterWS -= vec3f(0.0, 1.0, 0.0) * max(0.0, -fireLife);
  var flameToPosWS = posWS - flameCenterWS;

  let flameRot = logRand * kPI + flameToPosWS.y * kPI * 2.0 - (10.0 + 3.0 * hash11(logRand)) * s_time;
  let flameRotSin = sin(flameRot);
  flameToPosWS.x += flameToPosWS.y * 0.1 * flameRotSin;
  flameToPosWS.z += flameToPosWS.y * 0.1 * cos(flameRot);

  let sqrtFireLife = sqrt(max(0.0, fireLife));
  let flameHeight = max(0.001, 0.2 + fireLife * 1.2);
  let flameRadius = max(0.0001, 0.1 + sqrtFireLife) * 0.2;
  var fireD = sdEllipsoidY(flameToPosWS - vec3f(0.0, 1.0, 0.0) * flameHeight * 0.5, vec2f(flameRadius, flameHeight));
  fireD = smax(fireD, -centerToPosLS.x - logRadius, 0.2);

  let isAboveLog = (centerToPosLS.x / logRadius) * 0.5 + 0.5;
  var localFlame = (1.0 - saturate(abs(fireLife - logProgress) * 3.0)) * max(0.0, 0.3 + fireLife * 0.7);
  localFlame *= (max(0.0, isAboveLog) + 1.0);
  let localFlameD = r.logD - min(0.15, localFlame * (0.1 + flameRotSin * 0.02));
  r.fireD = smin(fireD, localFlameD, 0.15);
  r.fireMaterial.y = isAboveLog;
  return r;
}

fn displacementFire(positionWs: vec3f, minDist: f32, displacementScale: f32, amount: f32) -> f32 {
  let softenRadius = displacementScale * 0.5;
  let repSize = vec3f(2.0, 4.0, 2.0) * displacementScale;
  var dPos = positionWs;
  _ = pMod3(&dPos, repSize);
  let radius = 1.0 * displacementScale * abs(amount);
  var sphereDist = sdEllipsoidY(dPos, vec2f(radius, radius * 5.0));
  dPos = positionWs + repSize * 0.5;
  _ = pMod3(&dPos, repSize);
  sphereDist = min(sphereDist, sdEllipsoidY(dPos, vec2f(radius, radius * 4.0)));
  return smax(minDist, sign(amount) * sphereDist, softenRadius);
}

fn fCampfireLogs(posWS: vec3f, doVolumetric: bool) -> LogsResult {
  var minLogD = kMaxDist;
  var minFireD = kMaxDist;
  var minLogMaterial = vec4f(0.0);
  var minFireMaterial = vec4f(0.0);

  let campfireCenterToPosWS = posWS - kCampfireCenterWS;
  let distToCampfireXZ = length(campfireCenterToPosWS.xz) - 0.65;
  if (distToCampfireXZ > 0.25) {
    minLogD = distToCampfireXZ;
    minFireD = minLogD;
  } else {
    for (var i = s_zeroU; i < kNumLogs; i++) {
      let log = getLog(i);
      let logCenterWS = log.centerWS;
      var centerToPosLS = posWS - logCenterWS;
      let xz = pR(centerToPosLS.xz, log.rotationY);
      centerToPosLS = vec3f(xz.x, centerToPosLS.y, xz.y);
      let xy = pR(centerToPosLS.xy, log.rotationZ);
      centerToPosLS = vec3f(xy, centerToPosLS.z);
      let rand = kGoldenRatio * f32(i);
      let fireLife = s_globalFireLife - log.lifeOffset;
      let r = fFireLog(centerToPosLS, posWS, logCenterWS, log.burnDirWS,
                       log.logRadius, log.logLength, rand, fireLife, doVolumetric);
      if (r.logD < minLogD) {
        minLogD = r.logD;
        minLogMaterial = r.logMaterial;
      }
      if (r.fireD < minFireD) {
        minFireD = r.fireD;
        minFireMaterial = r.fireMaterial;
      }
    }
  }

  var logDispScale = 0.025;
  var logDispSoften = 0.15;

  let stickScale = 0.25;
  var stickPos = posWS + vec3f(1.0, 0.0, 1.0) * 1.5;
  var stickXZ = stickPos.xz;
  let stickId = pMod2(&stickXZ, vec2f(1.0) * 7.0 * stickScale);
  let stickRand = hash12(stickId * 39.6897);
  stickXZ = pR(stickXZ, stickRand * kPI);
  stickPos = vec3f(stickXZ.x, stickPos.y, stickXZ.y);
  let stickRadius = (0.04 + stickRand * 0.015) * stickScale;
  let stickLength = (0.75 + stickRand * 0.4) * stickScale;
  stickPos.y -= stickRadius + min(0.0, dot(posWS, posWS) * 0.01 - 0.02);
  stickPos.x += stickRand * 2.0 * stickScale;
  stickPos.z += stickRand * 2.0 * stickScale;

  let stickD = fCylinder(stickPos.xzy, stickRadius, stickLength);
  if (stickD < minLogD) {
    minLogD = stickD;
    let uv = vec2f(0.5 + atan(stickPos.x / stickPos.y) / kPI, stickPos.z) + stickRand * vec2f(1.0);
    minLogMaterial = vec4f(kMatWoodLog, uv.x, uv.y, -1.0);
    logDispScale = 0.015;
    logDispSoften = 0.05;
  }

  var dispPos = posWS;
  _ = pMod3(&dispPos, vec3f(1.0) * logDispScale * 11.0);
  let dispD = fSphere(dispPos, logDispScale);
  minLogD = smin(minLogD, smax(minLogD - logDispScale, dispD, logDispSoften), logDispSoften);

  if (doVolumetric) {
    minFireMaterial.x = kMatFire;

    if (minFireD < 0.25) {
      var displacedFireD = minFireD;
      let dispAmount = min(1.0, 0.2 + max(0.001, posWS.y) * 0.45);
      let windDisp = vec3f(0.03, 1.0, -0.02) * 3.0 * s_time;
      var dispPosWS = posWS - windDisp;
      let isUnderLog = minFireMaterial.y;
      displacedFireD = displacementFire(dispPosWS, displacedFireD, 0.2, -dispAmount);
      dispPosWS = posWS + vec3f(1.0) * 16.6798 - windDisp * 0.5;
      displacedFireD = displacementFire(
        dispPosWS, displacedFireD, 0.07,
        -(0.0001 + saturate(isUnderLog * 1.0)) * linearstep(-0.1, 0.0, minFireD));
      minFireMaterial.y = saturate(linearstep(0.05, 0.0, minLogD * minLogD) *
                                   linearstep(-0.00, -0.05, displacedFireD));
      minFireD = displacedFireD;
    }

    if (s_globalFireLife > 0.0) {
      var posSparks = posWS - kCampfireCenterWS - vec3f(0.0, 1.0, 0.0) * (0.3 * s_globalFireLife + 0.1);
      var sparkXZ = posSparks.xz;
      let sparkId = pModPolar(&sparkXZ, 5.0);
      posSparks = vec3f(sparkXZ.x, posSparks.y, sparkXZ.y);
      let sparkXY = pR(posSparks.xy, kPI * 0.15);
      posSparks = vec3f(sparkXY, posSparks.z);

      let sparkRand = hash11(sparkId * 937.959);
      let sparksAnimDuration = 5.0;
      var sparkAnim = fract(s_time / sparksAnimDuration + sparkRand);
      let sparksSpeed = sparksAnimDuration * 4.0 * max(0.7, 2.0 * s_globalFireLife);
      let sparkTravel = sparkAnim * sparksSpeed;

      var posSparksStart = vec3f(1.0, 0.0, 0.0) * sparkTravel;
      var posSparksEnd = vec3f(1.0, 0.0, 0.0) * sparkTravel;

      var rotationT = (sparkRand + sparkAnim) * sparksSpeed * 2.5;
      posSparksStart += vec3f(sin(rotationT), 0.0, cos(rotationT)) * (0.15 + sparkAnim * 0.5);
      posSparksStart.y += cos(rotationT * 0.5) * (sparkAnim * 0.3 + 0.2);

      let sparkAnimDelta = min(0.033, s_timeDelta * kTimeScale) / sparksAnimDuration;
      sparkAnim -= sparkAnimDelta;
      rotationT = (sparkRand + sparkAnim) * sparksSpeed * 2.5;

      posSparksEnd.x -= sparkAnimDelta * sparksSpeed;
      posSparksEnd += vec3f(sin(rotationT), 0.0, cos(rotationT)) * (0.15 + sparkAnim * 0.5);
      posSparksEnd.y += cos(rotationT * 0.5) * (sparkAnim * 0.3 + 0.2);

      let sparksD = fCapsuleAB(posSparks, posSparksStart, posSparksEnd, 0.01);
      if (sparksD < minFireD) {
        minFireD = sparksD;
        let sparkStrength = 0.5 + sparkRand * 2.0;
        minFireMaterial.y = max(0.0, sparkStrength - 15.0 * sparkAnim) * linearstep(0.0, -0.01, sparksD);
        minFireMaterial.y *= saturate(2.0 * s_globalFireLife);
      }
    }
  }

  var res: LogsResult;
  res.minFireD = minFireD;
  if (minLogD > 0.01 && minFireD < minLogD) {
    res.d = minFireD;
    res.material = minFireMaterial;
  } else {
    res.d = minLogD;
    res.material = minLogMaterial;
  }
  return res;
}

fn fCampfireRocks(posWS: vec3f) -> MatResult {
  var res: MatResult;
  res.material = vec4f(kMatRock, 0.0, 0.0, 0.0);

  let campfireCenterToPosWS = posWS - kCampfireCenterWS;
  let distToCampfireXZ = length(campfireCenterToPosWS.xz) - 1.0;
  let distToCampfire = max(distToCampfireXZ, campfireCenterToPosWS.y - 0.25);
  if (distToCampfire > 0.25) {
    res.d = distToCampfire;
    return res;
  }
  let campfireToPos = posWS - kCampfireCenterWS;

  var rockToPos = campfireToPos;
  var rockXZ = rockToPos.xz;
  var id = pModPolar(&rockXZ, 5.0);
  rockToPos = vec3f(rockXZ.x, rockToPos.y, rockXZ.y);
  var modRand = hash11(id * 97.5887);
  var modRandSNorm = modRand * 2.0 - 1.0;
  var rockDims = vec3f(0.22 + modRandSNorm * 0.05, 0.13 - modRandSNorm * 0.04, 0.27);
  rockToPos.x -= 0.88;
  rockToPos.y -= rockDims.y * 0.5;
  var rockUv = 4.0 * computeParaboloidUv(normalize(rockToPos)) + modRand * vec2f(1.0);
  res.material.y = rockUv.x;
  res.material.z = rockUv.y;
  var minDist = sdEllipsoid(rockToPos, rockDims);

  rockToPos = campfireToPos;
  rockXZ = pR(rockToPos.xz, 0.2 * kPI);
  id = pModPolar(&rockXZ, 5.0);
  rockToPos = vec3f(rockXZ.x, rockToPos.y, rockXZ.y);
  modRand = hash11((2.0 + id) * 97.5887);
  modRandSNorm = modRand * 2.0 - 1.0;
  rockDims = vec3f(0.2 + modRandSNorm * 0.05, 0.14 - modRandSNorm * 0.03, 0.26 + modRandSNorm * 0.03);
  rockToPos.x -= 0.75;
  rockToPos.y -= rockDims.y * 0.5;
  let rockD = sdEllipsoid(rockToPos, rockDims);
  if (rockD < minDist) {
    rockUv = 4.0 * computeParaboloidUv(normalize(rockToPos)) + modRand * vec2f(1.0);
    res.material.y = rockUv.x;
    res.material.z = rockUv.y;
    minDist = rockD;
  }

  var dispPos = posWS;
  var dispScale = 0.1;
  _ = pMod3(&dispPos, vec3f(1.0) * dispScale * 3.0);
  var dispD = fSphere(dispPos, dispScale);
  dispPos = posWS;
  dispScale = 0.125;
  _ = pMod3(&dispPos, vec3f(1.0) * dispScale * 3.5);
  dispD = min(dispD, fBoxCheap(dispPos, vec3f(1.0) * dispScale));

  res.d = smin(minDist + dispScale * 0.5, smax(minDist - dispScale * 0.25, -dispD, 0.15), 0.05);
  return res;
}

fn fCoals(posWS: vec3f) -> MatResult {
  var res: MatResult;
  res.material = vec4f(kMatCoals, 0.0, 0.0, 0.0);

  let campfireToPosWS = posWS - kCampfireCenterWS;
  let distToCampfireXZ = length(campfireToPosWS.xz) - 0.65;
  let distToCampfire = max(distToCampfireXZ, campfireToPosWS.y - 0.1);
  if (distToCampfire > 0.25) {
    res.d = distToCampfire;
    return res;
  }

  var pCoal = campfireToPosWS;
  pCoal.y += dot(campfireToPosWS, campfireToPosWS) * 0.2 - 0.035;
  var coalXZ = pCoal.xz;
  var id = pMod2(&coalXZ, vec2f(1.0) * 0.15) * 967.045;
  var coalRand = hash12(id);
  coalXZ = pR(coalXZ, coalRand * 2.0 * kPI);
  pCoal = vec3f(coalXZ.x, pCoal.y, coalXZ.y);
  var coalD = fCapsuleY(pCoal.xzy, 0.03, 0.05);
  var zw = computeParaboloidUv(normalize(pCoal)) + coalRand * vec2f(1.0);
  res.material = vec4f(kMatCoals, coalRand, zw.x, zw.y);

  pCoal = campfireToPosWS;
  pCoal.y += dot(campfireToPosWS, campfireToPosWS) * 0.25 - 0.035;
  pCoal.x += 0.16895;
  pCoal.z += 0.16895;
  coalXZ = pCoal.xz;
  id = pMod2(&coalXZ, vec2f(1.0) * 0.12) * 739.2397;
  coalRand = hash12(id);
  coalXZ = pR(coalXZ, coalRand * 1.0 * kPI);
  pCoal = vec3f(coalXZ.x, pCoal.y, coalXZ.y);
  let coalAltD = fCapsuleY(pCoal.xzy, 0.025, 0.04);
  if (coalAltD < coalD) {
    coalD = coalAltD;
    zw = computeParaboloidUv(normalize(pCoal)) + coalRand * vec2f(1.0);
    res.material = vec4f(kMatCoals, coalRand, zw.x, zw.y);
  }

  res.d = coalD;
  return res;
}

fn fSDF(posWS: vec3f, doVolumetric: bool, ch2: texture_2d<f32>, s2: sampler) -> MatResult {
  var res: MatResult;
  res.d = kMaxDist;
  res.material = vec4f(0.0);

  let groundUv = posWS.xz + vec2f(1.0) * 3.0;
  var groundNormalisedDisp = 0.0;
  if (posWS.y < 0.3) {
    groundNormalisedDisp = textureSampleLevel(ch2, s2, groundUv * 0.05, 0.0).r;
  }

  let logs = fCampfireLogs(posWS, doVolumetric);
  if (logs.d < res.d) {
    res.d = logs.d;
    res.material = logs.material;
  }

  let rocks = fCampfireRocks(posWS);
  let campfireRocksD = rocks.d - groundNormalisedDisp * 0.02;
  if (campfireRocksD < res.d) {
    res.d = campfireRocksD;
    res.material = rocks.material;
  }

  let coals = fCoals(posWS);
  let coalsD = coals.d - groundNormalisedDisp * 0.035;
  if (coalsD < res.d) {
    res.d = coalsD;
    res.material = coals.material;
    res.material.y = logs.minFireD + (coals.material.y - 0.5) * 0.5;
  }

  let groundD = posWS.y - groundNormalisedDisp * 0.05;
  if (groundD < res.d) {
    let ambientVis = 0.99 * linearstep(0.0, 0.1, campfireRocksD);
    res.material = vec4f(kMatGround, groundUv.x, groundUv.y,
                         floor(groundNormalisedDisp * 256.0) + ambientVis);
    res.d = groundD;
  }
  return res;
}

fn fMaterialSDF(dist: f32, material: vec4f, ch1: texture_2d<f32>, s1: sampler,
                ch2: texture_2d<f32>, s2: sampler) -> f32 {
  if (abs(material.x - kMatWoodLog) < 0.1) {
    let uv = material.yz;
    var bark = textureSampleLevel(ch1, s1, uv * 0.05, 0.0).r;
    bark += 0.5 * textureSampleLevel(ch1, s1, uv * 0.1, 0.0).r;
    let isBark = step(-0.5, uv.y);
    return dist - bark * (0.025 * isBark + 0.005);
  } else if (abs(material.x - kMatRock) < 0.1) {
    let rock = textureSampleLevel(ch1, s1, material.yz * 0.04, 0.0).r;
    return dist - rock * 0.02;
  } else if (abs(material.x - kMatCoals) < 0.1) {
    let disp = textureSampleLevel(ch1, s1, material.zw * 0.04, 0.0).r;
    return dist - disp * 0.05;
  } else if (abs(material.x - kMatGround) < 0.1) {
    let groundMat = floor(material.w) / 256.0;
    let uv = material.yz;
    var disp = 0.25 * textureSampleLevel(ch2, s2, uv * 0.25, 0.0).r;
    disp += 0.15 * textureSampleLevel(ch2, s2, uv * 0.45, 0.0).r;
    var d = dist - disp * 0.1 * (1.0 - groundMat);
    let rock = textureSampleLevel(ch1, s1, uv * vec2f(0.25, 0.1), 0.0).r;
    d -= rock * 0.025 * groundMat;
    return d;
  }
  return dist;
}

fn getNormalWS(p: vec3f, dt: f32, ch1: texture_2d<f32>, s1: sampler,
               ch2: texture_2d<f32>, s2: sampler) -> vec3f {
  var normalWS = vec3f(0.0);
  for (var i = s_zeroI; i < 4; i++) {
    let e = 0.5773 * (2.0 * vec3f(f32(((i + 3) >> 1u) & 1), f32((i >> 1u) & 1), f32(i & 1)) - 1.0);
    let s = fSDF(p + e * dt, false, ch2, s2);
    normalWS += e * fMaterialSDF(s.d, s.material, ch1, s1, ch2, s2);
  }
  return normalize(normalWS);
}

fn computeVolumetricLighting(material: vec4f, mediumD: f32, stepD: f32, insTrans: vec4f) -> vec4f {
  let emissiveColour = blackBodyToRGB(2500.0 + material.y * 2500.0, 3000.0);
  let density = max(0.001, -mediumD * 40.0);
  let stepTransmittance = exp(-stepD * density * 1.0);
  return vec4f(insTrans.rgb + insTrans.a * (1.0 - stepTransmittance) * emissiveColour,
               insTrans.a * stepTransmittance);
}

fn march(ro: vec3f, rd: vec3f, maxT: f32, ch2: texture_2d<f32>, s2: sampler) -> MarchResult {
  var res: MarchResult;
  res.insTrans = vec4f(0.0, 0.0, 0.0, 1.0);
  res.material = vec4f(0.0);
  res.hit = false;
  var t = 0.001;
  for (var i = s_zeroI; i < 128; i++) {
    let coneWidth = s_pixelCone * t;
    let s = fSDF(ro + rd * t, true, ch2, s2);
    var d = s.d;
    res.material = s.material;
    if (s.material.x == kMatFire && d < coneWidth) {
      let mediumD = d;
      d = max(0.01, abs(d)) * (s_pixelRand * 0.5 + 0.75) + coneWidth;
      res.insTrans = computeVolumetricLighting(s.material, mediumD, d, res.insTrans);
    }
    t += d;
    if (i >= 127) {
      t = maxT;
    }
    if (t >= maxT) {
      t = maxT;
      break;
    }
    if (d < coneWidth) {
      res.hit = true;
      break;
    }
  }
  res.t = t;
  return res;
}

fn marchShadow(ro: vec3f, rd: vec3f, tIn: f32, mt: f32, tanSourceRadius: f32,
               ch2: texture_2d<f32>, s2: sampler) -> f32 {
  var t = tIn;
  var minVisibility = 1.0;
  for (var i = s_zeroI; i < 8 && t < mt; i++) {
    let coneWidth = max(0.0001, tanSourceRadius * t);
    let d = fSDF(ro + rd * t, false, ch2, s2).d + coneWidth * 0.5;
    minVisibility = min(minVisibility, d / max(0.0001, coneWidth * 1.0));
    t += d;
    if (i >= 7) {
      t = mt;
    }
    if (minVisibility < 0.01) {
      minVisibility = 0.0;
    }
  }
  return smoothstep(0.0, 1.0, minVisibility);
}

fn getFireShadow(posWS: vec3f, ch2: texture_2d<f32>, s2: sampler) -> f32 {
  let fireLife = max(0.0, s_globalFireLife);
  var fireLightPosWS = vec3f(0.0, 0.05 + fireLife * 0.35, 0.0);
  let lightAnim = s_time * 15.0;
  let lightAnimAmpl = 0.02;
  fireLightPosWS.x += lightAnimAmpl * sin(lightAnim);
  fireLightPosWS.z += lightAnimAmpl * cos(lightAnim);
  let fireLightRadius = 0.7 - fireLife * 0.25;
  let posToFireWS = fireLightPosWS - posWS;
  let posToFireLength = length(posToFireWS);
  let posToFireDirWS = posToFireWS / max(0.0001, posToFireLength);
  if (posToFireLength - fireLightRadius < 0.0) {
    return 1.0;
  }
  let lightTanAngularRadius = fireLightRadius / max(0.0001, posToFireLength);
  return marchShadow(posWS, posToFireDirWS, 0.001, max(0.0, posToFireLength - fireLightRadius),
                     lightTanAngularRadius, ch2, s2);
}

fn computeSurfaceLighting(posWS: vec3f, rayDirWS: vec3f, normalWS: vec3f, albedo: vec3f,
                          f0Reflectance: vec3f, roughness: f32, emissive: vec4f, ambient: f32,
                          ch2: texture_2d<f32>, s2: sampler) -> vec3f {
  if (emissive.a > 0.999) {
    return emissive.rgb;
  }
  let shadow = getFireShadow(posWS + normalWS * 0.02, ch2, s2);
  let reflectedRayDirWS = reflect(rayDirWS, normalWS);
  let rDotN = max(0.0001, dot(reflectedRayDirWS, normalWS));
  let fresnelReflectance = roughFresnel(f0Reflectance, rDotN, roughness);
  let diffuse = albedo * computeLightingCone(posWS, normalWS, normalWS, 1.0, ambient, shadow);
  let specular = computeLightingCone(posWS, reflectedRayDirWS, normalWS, roughness, ambient, shadow);
  let surfaceLighting = mix(diffuse, specular, fresnelReflectance);
  return surfaceLighting * (1.0 - emissive.a) + emissive.rgb;
}

fn computeSceneColour(endPointWS: vec3f, rayDirectionWS: vec3f, marchedDist: f32, materialIn: vec4f,
                      ch1: texture_2d<f32>, s1: sampler, ch2: texture_2d<f32>, s2: sampler) -> vec3f {
  var material = materialIn;
  let normalDt = 0.001 + s_pixelCone * marchedDist;
  var normalWS = getNormalWS(endPointWS, normalDt, ch1, s1, ch2, s2);
  normalWS = fixNormalBackFacingness(rayDirectionWS, normalWS);

  var albedo = vec3f(1.0, 0.0, 1.0);
  var f0Reflectance = vec3f(0.04);
  var roughness = 0.6;
  var emissive = vec4f(0.0);
  var ambient = 1.0;
  let woodAlbedo = vec3f(0.15, 0.07, 0.02);

  if (abs(material.x - kMatDefault) < 0.1) {
    roughness = material.y;
    let metallicness = material.z;
    albedo = vec3f(0.5);
    f0Reflectance = mix(vec3f(0.04), vec3f(1.0), metallicness);
    albedo *= 1.0 - metallicness;
  } else if (abs(material.x - kMatWoodLog) < 0.1) {
    let matUv = material.yz;
    let woodTex = textureSampleLevel(ch1, s1, matUv * 0.05, 0.0).rgb;
    albedo = woodAlbedo * woodTex;
    let barkNoise = textureSampleLevel(ch1, s1, matUv * vec2f(0.05, 0.25), 0.0).r;
    let cracks = linearstep(0.5, 0.75, barkNoise);
    let ash = linearstep(0.45, 0.55, 1.0 - barkNoise);
    let isOuterLayer = select(1.0, material.y, material.z < -0.999);
    material.w += (woodTex.r - cracks * 2.0) * 0.2;
    let burnFactor = saturate(material.w * 5.0);
    let burntFactor = saturate(material.w * 5.0 - 0.2);
    let emissiveStrength = linearstep(1.0, 0.5, woodTex.r) *
      max(0.0, s_globalFireLife * 0.75 + 0.25) * linearstep(0.3, 0.8, isOuterLayer);
    emissive = mix(vec4f(0.0), vec4f(vec3f(1.5, 0.07, 0.005) * emissiveStrength, 1.0), burnFactor);
    emissive = mix(emissive, vec4f(0.0), burntFactor);
    let burntAlbedo = mix(vec3f(0.0), vec3f(0.5), ash);
    albedo = mix(albedo, burntAlbedo, burnFactor);
    roughness = mix(0.8, 0.975, burnFactor);
  } else if (abs(material.x - kMatRock) < 0.1) {
    ambient = linearstep(-0.6, -0.0, normalWS.y);
    let rockTex = textureSampleLevel(ch2, s2, material.yz * 0.1, 0.0).rgb;
    albedo = rockTex * 0.25;
    let soot = smoothstepg(0.5, -0.1, dot(normalWS, normalize(vec3f(0.0, 0.5, 0.0) - endPointWS)));
    albedo *= (0.05 + 0.95 * soot);
    roughness = 0.6 + soot * 0.35;
  } else if (abs(material.x - kMatGround) < 0.1) {
    let groundMat = floor(material.w) / 256.0;
    ambient = fract(material.w);
    let albedoTex = textureSampleLevel(ch1, s1, material.yz * 0.5, 0.0).rgb;
    let grass = linearstep(0.4, 0.7, albedoTex.r);
    albedo = mix(vec3f(0.07, 0.035, 0.005), vec3f(0.01, 0.05, 0.0005), grass);
    let rockBlend = linearstep(0.45, 0.5, groundMat);
    albedo = mix(albedo, albedoTex.rrr * 0.2, rockBlend);
    roughness = mix(0.85, 0.775, grass);
    roughness = mix(roughness, 0.6, rockBlend);
  } else if (abs(material.x - kMatCoals) < 0.1) {
    var noise = textureSampleLevel(ch1, s1, endPointWS.xz, 0.0).r;
    noise *= noise;
    albedo = vec3f(0.0);
    roughness = 0.95;
    let randBurnStrength = material.y;
    var isBurning = linearstep(0.075, -0.05, randBurnStrength);
    isBurning *= noise * linearstep(0.3, 0.8, normalWS.y);
    isBurning *= max(0.0, 1.0 - s_globalFireLife * dot(endPointWS, endPointWS) * 8.0);
    let emissiveStrength = 1.5 * max(0.0, s_globalFireLife * 0.75 + 0.25);
    emissive = vec4f(vec3f(1.5, 0.05, 0.005) * emissiveStrength, 1.0) * isBurning;
  }

  return computeSurfaceLighting(endPointWS, rayDirectionWS, normalWS, albedo, f0Reflectance,
                                roughness, emissive, ambient, ch2, s2);
}
`,Fa=`
fn campfireBufferA(
  fragUv: vec2f,
  resolution: vec2f,
  time: f32,
  timeDelta: f32,
  fireLife: f32,
  frame: f32,
  pixelCone: f32,
  cameraPos: vec3f,
  cameraWorld: mat4x4<f32>,
  projectionInverse: mat4x4<f32>,
  prevViewProjection: mat4x4<f32>,
  fireOffset: vec3f,
  ghostColor: vec4f,
  ghostDepth: f32,
  history: texture_2d<f32>,
  historySampler: sampler,
  ch1: texture_2d<f32>,
  s1: sampler,
  ch2: texture_2d<f32>,
  s2: sampler,
  ch3: texture_cube<f32>,
  s3: sampler
) -> vec4f {
  let fragCoord = fragUv * resolution;
  let framerateBasedTaaStrength = 1.0 - saturate((timeDelta - 0.066) / 0.033);
  let subPixelJitter = fract(hash22(fragCoord) + (frame % 256.0) * kGoldenRatio * vec2f(1.0)) - 0.5 * vec2f(1.0);
  s_time = time * kTimeScale;
  s_timeDelta = timeDelta;
  s_pixelRand = subPixelJitter.x;
  s_pixelCone = pixelCone;
  s_zeroI = i32(min(frame, 0.0));
  s_zeroU = u32(s_zeroI);
  initLogs(fireLife);

  let jitterAmount = framerateBasedTaaStrength;
  let uvJittered = (fragCoord + jitterAmount * subPixelJitter) / resolution;

  let rayOriginWS = toCampfire(cameraPos - fireOffset);
  let rayDirectionWS = toCampfire(viewRay(uvJittered, cameraWorld, projectionInverse));

  var ghostDist = kMaxDist;
  if (ghostDepth < 1.0) {
    ghostDist = min(kMaxDist, depthToDistance(fragUv, ghostDepth, projectionInverse));
  }

  let m = march(rayOriginWS, rayDirectionWS, ghostDist, ch2, s2);
  let marchedDist = m.t;
  let endPointWS = rayOriginWS + rayDirectionWS * marchedDist;
  let hitGhost = !m.hit && ghostDist < kMaxDist;

  let cubemap = textureSampleLevel(ch3, s3, rayDirectionWS, 0.0).rgb;
  var sceneColour = max(0.0, rayDirectionWS.y) * cubemap * kSkyColour;
  if (m.hit) {
    sceneColour = computeSceneColour(endPointWS, rayDirectionWS, marchedDist, m.material, ch1, s1, ch2, s2);
  } else if (hitGhost) {
    sceneColour = ghostColor.rgb;
  }
  sceneColour = sceneColour * m.insTrans.a + m.insTrans.rgb;

  var taaStrength = (1.0 - min(1.0, m.insTrans.r * 100.0)) * framerateBasedTaaStrength;
  if (hitGhost) {
    taaStrength = 0.0;
  }

  let prevClip = prevViewProjection * vec4f(toCampfire(endPointWS) + fireOffset, 1.0);
  let prevNdc = prevClip.xy / prevClip.w;
  var prevFrameUv = vec2f(prevNdc.x * 0.5 + 0.5, 0.5 - prevNdc.y * 0.5);
  prevFrameUv = (prevFrameUv * resolution - jitterAmount * subPixelJitter) / resolution;
  if (prevClip.w <= 0.0 || any(abs(prevFrameUv - vec2f(0.5)) > vec2f(0.5))) {
    taaStrength = 0.0;
  }

  let prevData = textureSampleLevel(history, historySampler, prevFrameUv, 0.0);
  let prevTaaStrength = fract(prevData.a);
  let prevQuantisedMarchedDist = prevData.a;
  taaStrength *= 1.0 - saturate(abs(marchedDist - prevQuantisedMarchedDist) - 1.0);

  var blendToCurrent = mix(1.0, 1.0 / 8.0, taaStrength);
  taaStrength = mix(prevTaaStrength, taaStrength, blendToCurrent);
  blendToCurrent = mix(1.0, 1.0 / 8.0, taaStrength);

  sceneColour = max(vec3f(0.0), mix(prevData.rgb, sceneColour, blendToCurrent));
  sceneColour = min(vec3f(6.0), sceneColour);
  return vec4f(sceneColour, floor(marchedDist) + 0.999 * taaStrength);
}

fn toCampfire(v: vec3f) -> vec3f {
  return vec3f(-v.x, v.y, v.z);
}

fn viewRay(uv: vec2f, cameraWorld: mat4x4<f32>, projectionInverse: mat4x4<f32>) -> vec3f {
  let ndc = vec2f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  let v = projectionInverse * vec4f(ndc, 1.0, 1.0);
  let dirView = normalize(v.xyz / v.w);
  return normalize((cameraWorld * vec4f(dirView, 0.0)).xyz);
}

fn depthToDistance(uv: vec2f, depth: f32, projectionInverse: mat4x4<f32>) -> f32 {
  let ndc = vec2f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  let v = projectionInverse * vec4f(ndc, depth, 1.0);
  return length(v.xyz / v.w);
}
${Pa}
${Bt}
`,Ea=`
fn campfireImage(
  fragUv: vec2f,
  outputResolution: vec2f,
  bufferResolution: vec2f,
  frame: f32,
  bufferA: texture_2d<f32>,
  bufferSampler: sampler
) -> vec4f {
  let uv = fragUv;
  let colour = textureSampleLevel(bufferA, bufferSampler, uv, 0.0);
  let fragCoord = fragUv * outputResolution;
  let subPixelJitter = fract(hash22(fragCoord) + (frame % 256.0) * kGoldenRatio * vec2f(1.0)) - 0.5 * vec2f(1.0);

  var totalWeight = 0.0;
  var bloom = vec3f(0.0);
  let range = 1.0;
  for (var xo = -range; xo < range + 0.1; xo += 0.5) {
    for (var yo = -range; yo < range + 0.1; yo += 0.5) {
      var vo = vec2f(xo, yo);
      let weight = (range * range * 2.0) - dot(vo, vo);
      vo += 0.5 * subPixelJitter;
      let off = vo * (0.5 / range) / bufferResolution;
      if (weight > 0.0) {
        bloom += 0.4 * weight * textureSampleLevel(bufferA, bufferSampler, uv + off * exp2(4.0), 4.0).rgb;
        bloom += 0.4 * weight * textureSampleLevel(bufferA, bufferSampler, uv + off * exp2(5.0), 5.0).rgb;
        bloom += 0.4 * weight * textureSampleLevel(bufferA, bufferSampler, uv + off * exp2(6.0), 6.0).rgb;
      }
      totalWeight += weight;
    }
  }
  bloom /= totalWeight;

  var c = colour.rgb + 0.025 * pow(bloom, vec3f(2.0));
  c *= linearstep(0.8, 0.3, length(uv - vec2f(0.5)));
  c = tonemap(c);
  c = pow(c, vec3f(1.0 / 2.2));
  c += vec3f((hash12(fragCoord) - 0.5) / 255.0);
  return vec4f(srgbToLinear(c), 1.0);
}

fn srgbToLinear(c: vec3f) -> vec3f {
  let low = c / 12.92;
  let high = pow((max(c, vec3f(0.0)) + 0.055) / 1.055, vec3f(2.4));
  return select(high, low, c <= vec3f(0.04045));
}
${Bt}
`,za=Mt(Fa),Aa=Mt(Ea),lt={depthBuffer:!1,generateMipmaps:!0,magFilter:Jt,minFilter:Qt,type:Ee,wrapS:Ze,wrapT:Ze},ce=new de;function We(e){const t=new to;return t.colorNode=e,t.blending=oo,t.depthTest=!1,t.depthWrite=!1,t.transparent=!0,t.toneMapped=!1,t}function Ia({noise:e,rock:t,sky:a}){const o={bufferResolution:y(new de(1,1)),cameraPos:y(new S),cameraWorld:y(new xe),fireLife:y(1),fireOffset:y(new S),frame:y(0),outputResolution:y(new de(1,1)),pixelCone:y(.001),prevViewProjection:y(new xe),projectionInverse:y(new xe),time:y(0),timeDelta:y(.016666666666666666)},i=new ne(1,1,{depthTexture:new qt(1,1),type:Ee}),r=[new ne(1,1,lt),new ne(1,1,lt)],n=W(r[0].texture),l=W(r[0].texture),f=W(r[1].texture),u=W(r[1].texture),c=We(za({fragUv:te,resolution:o.bufferResolution,time:o.time,timeDelta:o.timeDelta,fireLife:o.fireLife,frame:o.frame,pixelCone:o.pixelCone,cameraPos:o.cameraPos,cameraWorld:o.cameraWorld,projectionInverse:o.projectionInverse,prevViewProjection:o.prevViewProjection,fireOffset:o.fireOffset,ghostColor:W(i.texture,te),ghostDepth:W(i.depthTexture,te).x,history:n,historySampler:l,ch1:W(e),s1:W(e),ch2:W(t),s2:W(t),ch3:Qe(a),s3:Qe(a)})),d=We(Aa({fragUv:te,outputResolution:o.outputResolution,bufferResolution:o.bufferResolution,frame:o.frame,bufferA:f,bufferSampler:u})),g=new ne(1,1,{depthBuffer:!1,type:Ee}),h=We(W(g.texture,te)),p=new eo(c);let v=1;function w(R,k){R.getDrawingBufferSize(ce);const b=Math.max(1,Math.round(Math.min(ce.y,k))),x=Math.max(1,Math.round(b*ce.x/ce.y));o.bufferResolution.value.x===x&&o.bufferResolution.value.y===b||(o.bufferResolution.value.set(x,b),o.outputResolution.value.set(x,b),i.setSize(x,b),g.setSize(x,b),r.forEach(D=>D.setSize(x,b)))}return{uniforms:o,render({camera:R,delta:k,fireLife:b,fireOffset:x,outputTarget:D=null,height:I,renderer:P,scene:U,time:$}){w(P,I),R.updateMatrixWorld(),o.time.value=$,o.fireLife.value=b,o.timeDelta.value=Math.max(k,1e-4),o.frame.value=(o.frame.value+1)%256,o.cameraPos.value.setFromMatrixPosition(R.matrixWorld),o.cameraWorld.value.copy(R.matrixWorld),o.projectionInverse.value.copy(R.projectionMatrixInverse),o.pixelCone.value=Math.tan(re.degToRad(R.fov)/2)/o.bufferResolution.value.y,o.fireOffset.value.copy(x),P.setRenderTarget(i),P.render(U,R);const ee=r[v],se=r[1-v];n.value=se.texture,l.value=se.texture,p.material=c,P.setRenderTarget(ee),p.render(P),f.value=ee.texture,u.value=ee.texture,p.material=d,P.setRenderTarget(g),p.render(P),p.material=h,P.setRenderTarget(D),p.render(P),o.prevViewProjection.value.multiplyMatrices(R.projectionMatrix,R.matrixWorldInverse),v=1-v},dispose(){i.dispose(),g.dispose(),h.dispose(),r.forEach(R=>R.dispose()),c.dispose(),d.dispose(),p.geometry?.dispose()}}}const ct=Array.from({length:Ta},(e,t)=>t),Ot=Math.max(me.x,me.y,me.z),_a=me.clone().divideScalar(Ot),Ga=new z(1,.075,.01),Ba=new S(0,-1,0),Oa=new S(0,1,0),ut=new S(-1,1,1);function Ha({burnRef:e,fireOffset:t,ghostCentre:a,strength:o}){const i=s.useRef([]),r=s.useRef(null),n=s.useRef(null),l=s.useMemo(()=>({centre:new S,dir:new S,light:{center:new S,radius:0,strength:0},term:new S,world:new S}),[]),f=(c,d)=>d.copy(c).sub(t).multiply(ut),u=(c,d)=>d.copy(c).multiply(ut).add(t);return E(({clock:c})=>{const d=c.elapsedTime,g=_t({...e.current,time:d}),h=f(a,l.centre);if(ct.forEach(p=>{const v=i.current[p];if(!v)return;const w=Da(p,d,g,h,l.light);l.dir.subVectors(w.center,h);const R=l.dir.length();l.dir.divideScalar(R);const k=Ma(h,l.dir,1,w.center,w.radius);u(w.center,v.position),v.intensity=Math.PI*R*R*k*w.strength*Ot*o}),r.current){l.dir.subVectors(B,h).setY(0).normalize();const p=La(h,l.dir,1,g,l.term).x,v=h.distanceTo(B);u(B,r.current.position),r.current.intensity=Math.PI*v*v*p*o}n.current&&(st(h,Ba,1,g,l.term),n.current.groundColor.setRGB(l.term.x*Math.PI*o,l.term.y*Math.PI*o,l.term.z*Math.PI*o),st(h,Oa,1,g,l.term),n.current.color.setRGB(l.term.x*Math.PI*o,l.term.y*Math.PI*o,l.term.z*Math.PI*o))}),m.jsxs(m.Fragment,{children:[ct.map(c=>m.jsx("pointLight",{ref:d=>{i.current[c]=d},color:_a.toArray(),decay:2,distance:0,intensity:0},c)),m.jsx("pointLight",{ref:r,color:Ga,decay:2,distance:0,intensity:0}),m.jsx("hemisphereLight",{ref:n,intensity:1})]})}const Na=s.memo(Ha),Ht={noise:V("campfire/noise.jpg"),rock:V("campfire/rock.jpg")},Nt=[0,1,2,3,4,5].map(e=>V(`campfire/sky_${e}.png`));j.preload(Object.values(Ht));Ct.preload(kt,[Nt]);function ft(e){const t=e;t.wrapS=qe,t.wrapT=qe,t.colorSpace=Ve,t.flipY=!0,t.needsUpdate=!0}function Va({config:e}){const t=ze(c=>c.gl),a=ze(c=>c.clock),o=s.useRef({burnSeconds:80,hold:1,mode:"cycle",startTime:0}),{noise:i,rock:r}=j(Ht),[n]=Ct(kt,[Nt]),l=s.useMemo(()=>{ft(i),ft(r);const c=n;return c.colorSpace=Ve,c.needsUpdate=!0,Ia({noise:i,rock:r,sky:n})},[i,r,n]);s.useEffect(()=>()=>l.dispose(),[l]),s.useEffect(()=>{const c=t.toneMapping;return t.toneMapping=ao,()=>{t.toneMapping=c}},[t]);const f=s.useMemo(()=>new S(e.campfirePosition.x,e.campfirePosition.y,e.campfirePosition.z),[e.campfirePosition]),u=s.useMemo(()=>new S(e.ghostPosition.x,e.ghostPosition.y-.35*e.ghostScale,e.ghostPosition.z),[e.ghostPosition,e.ghostScale]);return s.useEffect(()=>{o.current.startTime=a.elapsedTime},[a,e.campfireBurnMode,e.campfireBurnSeconds]),s.useEffect(()=>{const c=o.current;c.mode=e.campfireBurnMode,c.hold=e.campfireFireLife,c.burnSeconds=e.campfireBurnSeconds},[e.campfireBurnMode,e.campfireBurnSeconds,e.campfireFireLife]),E((c,d)=>{l.render({camera:c.camera,delta:d,fireLife:_t({...o.current,time:c.clock.elapsedTime}),fireOffset:f,renderer:c.gl,height:e.campfireResolution,scene:c.scene,time:c.clock.elapsedTime})},2),m.jsx(Na,{burnRef:o,fireOffset:f,ghostCentre:u,strength:e.campfireGhostLight})}const ja=s.memo(Va);function Ua(e,t,a){const o=e<1?(e*e-1)*t:0,i=a*Math.exp(-(((e-1)/.28)**2));return o+i}function Ka({clearRadius:e,craterCount:t,curvatureRadius:a,maxCraterRadius:o,roughness:i,seed:r,segments:n,size:l}){const f=io(r),u=(k,b)=>ro(k,b,r)-.5,c=new xt(l,l,n,n);c.rotateX(-Math.PI/2);const{position:d}=c.attributes,{count:g}=d,h=new Float32Array(g),p=n+1,v=l/n,w=l/2;for(let k=0;k<g;k+=1){const b=d.getX(k),x=d.getZ(k);h[k]=i*(2.2*u(b/48,x/48)+.9*u(b/17,x/17)+.3*u(b/6,x/6))-(b*b+x*x)/(2*a)}for(let k=0;k<t;k+=1){const b=1.2+(o-1.2)*f()**3.2,x=(f()-.5)*l,D=(f()-.5)*l,I=b*(.16+f()*.08),P=b*(.04+f()*.04),U=Math.hypot(x,D)>=b+e,$=b*1.8,ee=Math.max(0,Math.floor((x-$+w)/v)),se=Math.min(n,Math.ceil((x+$+w)/v)),$t=Math.max(0,Math.floor((D-$+w)/v)),Zt=Math.min(n,Math.ceil((D+$+w)/v));for(let be=$t;be<=Zt;be+=1)for(let Ce=ee;Ce<=se;Ce+=1){const ke=be*p+Ce,$e=Math.hypot(d.getX(ke)-x,d.getZ(ke)-D)/b;U&&$e<1.8&&(h[ke]+=Ua($e,I,P))}}const R=h[Math.floor(n/2)*p+Math.floor(n/2)];for(let k=0;k<g;k+=1)d.setY(k,h[k]-R);return c.computeVertexNormals(),c}function Ya({config:e}){const{lunarCraterCount:t,lunarCurvature:a,lunarDarkColor:o,lunarGrain:i,lunarLightColor:r,lunarMaxCrater:n,lunarRoughness:l,lunarSeed:f}=e,u=s.useMemo(()=>Ka({clearRadius:4,craterCount:t,curvatureRadius:a,maxCraterRadius:n,roughness:l,seed:f,segments:384,size:420}),[t,a,n,l,f]),{material:c,uniforms:d}=s.useMemo(()=>ia(),[]);return s.useEffect(()=>{d.dark.value.set(o),d.light.value.set(r),d.grain.value=i},[o,i,r,d]),s.useEffect(()=>()=>u.dispose(),[u]),s.useEffect(()=>()=>c.dispose(),[c]),m.jsx("mesh",{geometry:u,material:c,receiveShadow:!0})}const Xa=s.memo(Ya),mt=4e3,$a=Math.PI/180,dt=new S(0,1,0);function Za(e,t,a,o){return{buoyancy:{modeCount:160},foam:{foamStrength:e.oceanFoamStrength,foamThreshold:e.oceanFoamThreshold},ocean:{lodScale:e.oceanLodScale,patchResolution:e.oceanPatchResolution,patchSize:e.oceanPatchSize,wireframe:!1},oceanColors:o,performance:{pauseWater:!1,quality:e.oceanQuality,waveUpdateHz:30},sky:{azimuth:t,elevation:a,exposure:e.oceanExposure,mieCoefficient:e.oceanSkyMie,mieDirectionalG:.7,rayleigh:e.oceanSkyRayleigh,turbidity:e.oceanSkyTurbidity,up:[0,1,0],visible:e.oceanSkyVisible},waveSettings:Ko(e,"oceanFirst_","oceanSecond_")}}function qa({anchorRef:e,config:t,sunAzimuth:a,sunElevation:o}){const i=s.useMemo(()=>t.oceanCustomColors?{fadeColor:t.oceanFadeColor,foamColor:t.oceanFoamColor,horizonColor:t.oceanHorizonColor,seaColor:t.oceanSeaColor,skyColor:t.oceanReflectColor,specularColor:t.oceanSpecularColor,specularStrength:t.oceanSpecularStrength,sunColor:t.oceanSpecularColor,waveColor:t.oceanWaveColor}:void 0,[t.oceanCustomColors,t.oceanFadeColor,t.oceanFoamColor,t.oceanHorizonColor,t.oceanReflectColor,t.oceanSeaColor,t.oceanSpecularColor,t.oceanSpecularStrength,t.oceanWaveColor]),r=Za(t,a,o,i),{sampler:n}=Uo(r),l=s.useMemo(()=>new S,[]),f=s.useMemo(()=>new S,[]),u=s.useMemo(()=>new Rt,[]),c=s.useRef(0);s.useEffect(()=>{const h=e.current;return()=>{h.position.set(0,0,0),h.quaternion.identity()}},[e]),E((h,p)=>{const v=e.current;if(!n||!v)return;const w=t.oceanGhostRide,R=n.sampleSurfaceHeight(0,0,l)*w,k=1-Math.exp(-p*t.oceanGhostFollow);c.current+=(R-c.current)*k,v.position.set(0,c.current,0),n.sampleNormal(0,0,f,1.2),f.lerp(dt,1-w*t.oceanGhostRock).normalize(),u.setFromUnitVectors(dt,f),v.quaternion.slerp(u,k)});const d=s.useMemo(()=>Ke(a,o).multiplyScalar(mt),[a,o]),g=mt*Math.tan(t.oceanMoonSize*$a/2);return t.oceanMoonVisible?m.jsx(jo,{emissive:t.oceanMoonColor,emissiveIntensity:t.oceanMoonGlow,emissiveUsesTexture:!0,fog:!1,position:d,radius:g,segments:48}):null}const Qa=s.memo(qa),Vt={bump:V("solar-system/moonbump.jpg"),map:V("solar-system/moonmap.jpg")};j.preload(Object.values(Vt));function Ja({config:e}){const{bump:t,map:a}=j(Vt),o=e.tinyMoonRadius;s.useEffect(()=>{a.colorSpace=he,a.anisotropy=8,a.needsUpdate=!0,t.colorSpace=Ve,t.needsUpdate=!0},[t,a]);const i=s.useMemo(()=>new Ne(1,384,192),[]),{material:r,uniforms:n}=s.useMemo(()=>ta(a,t),[t,a]);return s.useEffect(()=>{r.bumpScale=e.tinyMoonBump,r.roughness=e.tinyMoonRoughness,r.color.set(e.tinyMoonTint),n.displacement.value=e.tinyMoonDisplacement/o},[e.tinyMoonBump,e.tinyMoonDisplacement,e.tinyMoonRoughness,e.tinyMoonTint,r,o,n]),s.useEffect(()=>()=>i.dispose(),[i]),s.useEffect(()=>()=>r.dispose(),[r]),m.jsx("mesh",{geometry:i,material:r,"position-y":-o,receiveShadow:!0,"rotation-z":Math.PI/2,scale:o})}const ei=s.memo(Ja);function ti({airspeed:e,coverage:t,height:a,horizonColor:o,litColor:i,shadeColor:r,softness:n,sunAzimuth:l,sunElevation:f}){const u=s.useMemo(()=>new xt(ge,ge).rotateX(-Math.PI/2),[]),{material:c,uniforms:d}=s.useMemo(()=>oa(),[]);return s.useEffect(()=>{const g=re.degToRad(l),h=re.degToRad(f);d.coverage.value=t,d.softness.value=n,d.litColor.value.set(i),d.shadeColor.value.set(r),d.horizonColor.value.set(o),d.sunDir.value.set(Math.sin(g),Math.cos(g)),d.sunHeight.value=Math.max(0,Math.sin(h))},[t,o,i,r,n,l,f,d]),s.useEffect(()=>()=>u.dispose(),[u]),s.useEffect(()=>()=>c.dispose(),[c]),E((g,h)=>{d.scroll.value+=h*e}),m.jsx("mesh",{frustumCulled:!1,geometry:u,material:c,"position-y":a,renderOrder:-5})}const oi=s.memo(ti),ai=9e3;function ii({mie:e,rayleigh:t,sunAzimuth:a,sunElevation:o,turbidity:i}){const r=s.useMemo(()=>{const n=new Fo;return n.scale.setScalar(ai),n.frustumCulled=!1,n.material.depthWrite=!1,n.cloudCoverage.value=0,n},[]);return s.useEffect(()=>{r.turbidity.value=i,r.rayleigh.value=t,r.mieCoefficient.value=e,r.mieDirectionalG.value=.8,r.sunPosition.value.copy(Ke(a,o))},[e,t,r,a,o,i]),s.useEffect(()=>()=>{r.geometry.dispose(),r.material.dispose()},[r]),E(({camera:n})=>{r.position.copy(n.position)}),m.jsx("primitive",{object:r,renderOrder:-10})}const ri=s.memo(ii),si=.012;function ni(e,t,a){const o=a.clone().normalize(),i=new S(1,0,0);Math.abs(o.dot(i))>.9&&i.set(0,0,1);const r=i.clone().cross(o).normalize(),n=r.clone().cross(o).normalize(),l=o.clone().multiplyScalar(t/2),f=new Float32Array(e*8*3),u=new Float32Array(e*8*4),c=new Uint32Array(e*12),d=new S;for(let h=0;h<e;h+=1){const p=Math.random()*q,v=Math.random()*q,w=Math.random()*q,R=Math.random();[r,n].forEach((k,b)=>{for(let D=0;D<4;D+=1){const I=h*8+b*4+D;d.copy(k).multiplyScalar((D%2===0?-1:1)*si).addScaledVector(l,D<2?-1:1),f.set([d.x,d.y,d.z],I*3),u.set([p,v,w,R],I*4)}const x=h*8+b*4;c.set([x,x+1,x+2,x+2,x+1,x+3],h*12+b*6)})}const g=new so;return g.setAttribute("position",new Re(f,3)),g.setAttribute("dropOffset",new Re(u,4)),g.setIndex(new Re(c,1)),g}function li({airspeed:e,color:t,count:a,fall:o,flashRef:i,length:r,opacity:n}){const l=s.useMemo(()=>new S(0,-o,-e),[e,o]),f=s.useMemo(()=>ni(a,r,l),[a,r,l]),{material:u,uniforms:c}=s.useMemo(()=>aa(),[]);return s.useEffect(()=>{c.color.value.set(t),c.opacity.value=n,c.velocity.value.copy(l)},[t,n,c,l]),s.useEffect(()=>()=>f.dispose(),[f]),s.useEffect(()=>()=>u.dispose(),[u]),E((d,g)=>{c.phase.value=(c.phase.value+g)%1e3,c.flash.value=i.current}),m.jsx("mesh",{frustumCulled:!1,geometry:f,material:u})}const ci=s.memo(li),ui={cameraShake:!1,cracks:!1,debris:!1,groundFlash:!1,overlay:!1,pointLight:!1,shockwave:!1,sparks:!1},ht={minX:300,maxX:650,minZ:-260,maxZ:60,targetY:-220,minHeight:260,maxHeight:420,sourceSpread:60,topJitter:40},fi={};function mi(e){return .5+.25*Math.sin(e*61.3)+.15*Math.sin(e*23.1+1.7)+.1*Math.sin(e*97.7+.4)}function di({backdropColor:e,color:t,flashRef:a,intensity:o,maxGap:i,minGap:r}){const n=ze(h=>h.scene),l=a,f=s.useRef(null),u=s.useRef(null),c=s.useRef({end:0,next:3,start:0}),d=s.useMemo(()=>new z,[]),g=s.useMemo(()=>new z,[]);return E(({clock:h})=>{const p=h.elapsedTime,v=c.current;p>=v.next&&(v.start=p,v.end=p+.5+Math.random()*.8,v.next=v.end+r+Math.random()*(i-r),u.current?.spawnRandomStrike());let w=0;if(p<v.end){const R=(p-v.start)/(v.end-v.start);w=Math.max(0,mi(p))*(1-R)**1.5}l.current=w,f.current&&(f.current.intensity=w*o),n.background?.isColor&&(d.set(e),g.set(t),n.background.copy(d).lerp(g,w*.35))}),m.jsxs(m.Fragment,{children:[m.jsx("directionalLight",{ref:f,color:t,intensity:0,position:[400,300,100]}),m.jsx(Zo,{apiRef:u,coreColor:"#e8f0ff",effects:ui,fallbackPlaneEnabled:!0,glowColor:"#7f9cff",groundPlaneY:ht.targetY,keyboardShortcuts:fi,mainFractalDepth:7,randomStrikeBounds:ht,strikeDuration:.25,thickness:2.2})]})}const hi=s.memo(di),gi=[-9,-.43,4.6],gt=new S(-9,.5,2.6),pi=[14.3,.95,-6];function ue(e,t,a,o){return .55*Math.sin(e*t)+.3*Math.sin(e*a+1.3)+.15*Math.sin(e*o+2.9)}function Si({color:e,intensity:t}){const a=s.useRef(null),o=s.useRef(null);return E(({clock:i})=>{const r=i.elapsedTime%1.6,n=r<.06||r>.18&&r<.24?1:0;a.current&&(a.current.intensity=n*t*6),o.current&&(o.current.visible=n===1)}),m.jsxs("group",{position:pi,children:[m.jsx("pointLight",{color:e,decay:2,distance:30,intensity:t}),m.jsxs("mesh",{children:[m.jsx("sphereGeometry",{args:[.09,12,8]}),m.jsx("meshBasicMaterial",{color:e,toneMapped:!1})]}),m.jsx("pointLight",{ref:a,color:"#ffffff",decay:2,distance:40,intensity:0,position:[.2,0,-.3]}),m.jsxs("mesh",{ref:o,position:[.2,0,-.3],children:[m.jsx("sphereGeometry",{args:[.07,12,8]}),m.jsx("meshBasicMaterial",{color:"#ffffff",toneMapped:!1})]})]})}function vi({anchorRef:e,backdropColor:t,config:a,sunAzimuth:o,sunElevation:i}){const r=s.useRef(null),n=s.useRef(0),l=s.useRef(0),f=s.useMemo(()=>new no,[]),u=s.useMemo(()=>new S,[]);return s.useEffect(()=>{const c=e.current;return()=>{c.position.set(0,0,0),c.quaternion.identity()}},[e]),E((c,d)=>{l.current+=d*a.wingTurbulenceSpeed;const g=l.current,h=a.wingTurbulence,p=e.current;f.set(h*.025*ue(g,.9,2.3,5.1),h*.01*ue(g,.4,1.1,3.7),h*.05*ue(g,.7,1.9,4.3)),p.quaternion.setFromEuler(f),u.copy(gt).negate().applyQuaternion(p.quaternion),p.position.copy(gt).add(u).setY(p.position.y+h*.35*ue(g,1.3,3.1,7.3)),r.current?.position.copy(p.position),r.current?.quaternion.copy(p.quaternion)}),m.jsxs(m.Fragment,{children:[m.jsx("group",{ref:r,children:m.jsxs("group",{position:gi,children:[m.jsx($o,{}),a.wingLightsVisible&&m.jsx(Si,{color:a.wingNavColor,intensity:a.wingNavIntensity})]})}),a.wingSkyVisible&&m.jsx(ri,{mie:a.wingSkyMie,rayleigh:a.wingSkyRayleigh,sunAzimuth:o,sunElevation:i,turbidity:a.wingSkyTurbidity}),a.wingCloudsVisible&&m.jsx(oi,{airspeed:a.wingAirspeed,coverage:a.wingCloudCoverage,height:a.wingCloudHeight,horizonColor:a.wingCloudHorizonColor,litColor:a.wingCloudLitColor,shadeColor:a.wingCloudShadeColor,softness:a.wingCloudSoftness,sunAzimuth:o,sunElevation:i}),a.wingStorm&&m.jsxs(m.Fragment,{children:[m.jsx(ci,{airspeed:a.wingAirspeed*.35,color:a.wingRainColor,count:a.wingRainCount,fall:9,flashRef:n,length:a.wingRainLength,opacity:a.wingRainOpacity}),m.jsx(hi,{backdropColor:t,color:a.wingFlashColor,flashRef:n,intensity:a.wingFlashIntensity,maxGap:a.wingFlashMaxGap,minGap:a.wingFlashMinGap})]})]})}const yi=s.memo(vi),oe={collapsed:!0},bi=["blackHoleVariant","blackHolePosition","metricWorldScale","blackHoleLightEnabled","blackHoleLightIntensity","blackHoleLightVividness","blackHoleLightColor",...Eo,...zo,...Ao];function Ci(e,t){return C({blackHoleVariant:{label:"Variation",value:e.blackHoleVariant,options:Io},blackHolePosition:{label:"Position",value:e.blackHolePosition,step:.5},metricWorldScale:{label:"Size",value:e.metricWorldScale,min:1,max:120,step:.5},Light:C({blackHoleLightEnabled:{label:"Lights Ghost",value:e.blackHoleLightEnabled},blackHoleLightIntensity:{label:"Intensity",value:e.blackHoleLightIntensity,min:0,max:20,step:.01},blackHoleLightVividness:{label:"Vividness",value:e.blackHoleLightVividness,min:0,max:1,step:.01},blackHoleLightColor:{label:"Color (non-chromatic disks)",value:e.blackHoleLightColor}},oe),Legacy:C(Bo(e,`${t}.Legacy`),oe),WebGPU:C(Go(e),oe),Singularity:C(_o(e),oe)},oe)}const ki=["campfirePosition","campfireBurnMode","campfireFireLife","campfireBurnSeconds","campfireResolution","campfireGhostLight","ghostPosition","ghostScale"];function xi(e,t){return C({campfirePosition:{label:"Fire Position",value:e.campfirePosition,step:.05},campfireBurnMode:{label:"Burn",value:e.campfireBurnMode,options:{"Cycle (original)":Ra,Hold:Be,"Burn Down":Oe}},campfireFireLife:{label:"Hold Level (≤0 embers)",value:e.campfireFireLife,min:Math.floor(It*100)/100,max:1,step:.01,render:a=>a(`${t}.campfireBurnMode`)===Be},campfireBurnSeconds:{label:"Burn Down (s)",value:e.campfireBurnSeconds,min:10,max:1800,step:5,render:a=>a(`${t}.campfireBurnMode`)===Oe},campfireResolution:{label:"Render Height (px)",value:e.campfireResolution,min:240,max:1440,step:10},campfireGhostLight:{label:"Firelight On Ghost",value:e.campfireGhostLight,min:0,max:4,step:.01}},{collapsed:!0})}const jt={collapsed:!0},Ri=["tinyMoonRadius","tinyMoonDisplacement","tinyMoonBump","tinyMoonRoughness","tinyMoonTint"],wi=["lunarSeed","lunarCraterCount","lunarMaxCrater","lunarRoughness","lunarCurvature","lunarGrain","lunarDarkColor","lunarLightColor"],A=(e,t,a,o,i)=>({label:e,value:t,min:a,max:o,step:i});function Mi(e){return C({tinyMoonRadius:A("Radius",e.tinyMoonRadius,.5,20,.1),tinyMoonDisplacement:A("Crater Depth",e.tinyMoonDisplacement,0,.5,.005),tinyMoonBump:A("Bump",e.tinyMoonBump,0,10,.05),tinyMoonRoughness:A("Roughness",e.tinyMoonRoughness,0,1,.01),tinyMoonTint:{label:"Tint",value:e.tinyMoonTint}},jt)}function Di(e){return C({lunarSeed:A("Seed",e.lunarSeed,1,9999,1),lunarCraterCount:A("Craters",e.lunarCraterCount,0,1500,10),lunarMaxCrater:A("Largest Crater (m)",e.lunarMaxCrater,2,120,1),lunarRoughness:A("Undulation",e.lunarRoughness,0,4,.01),lunarCurvature:A("Horizon Curve (m)",e.lunarCurvature,200,5e3,10),lunarGrain:A("Regolith Grain",e.lunarGrain,0,2,.01),lunarDarkColor:{label:"Dark",value:e.lunarDarkColor},lunarLightColor:{label:"Light",value:e.lunarLightColor}},jt)}const K={collapsed:!0},Ut="oceanFirst_",Kt="oceanSecond_",Li=["oceanQuality","oceanPatchSize","oceanPatchResolution","oceanLodScale","oceanFoamStrength","oceanFoamThreshold","oceanExposure","oceanSkyVisible","oceanSkyTurbidity","oceanSkyRayleigh","oceanSkyMie","oceanCustomColors","oceanSeaColor","oceanHorizonColor","oceanReflectColor","oceanWaveColor","oceanFadeColor","oceanSpecularColor","oceanFoamColor","oceanSpecularStrength","oceanMoonVisible","oceanMoonSize","oceanMoonColor","oceanMoonGlow","oceanGhostRide","oceanGhostRock","oceanGhostFollow"],Ti=[...Li,...Object.keys(je({prefix:Ut})),...Object.keys(Ue({prefix:Kt}))],T=(e,t,a,o,i)=>({label:e,value:t,min:a,max:o,step:i});function Wi(e){return C({oceanQuality:{label:"Quality",value:e.oceanQuality,options:Object.keys(Yo)},oceanPatchSize:T("Patch Size",e.oceanPatchSize,100,4e3,10),oceanPatchResolution:T("Patch Resolution",e.oceanPatchResolution,64,768,1),oceanLodScale:T("LOD Scale",e.oceanLodScale,0,20,.1),oceanFoamStrength:T("Foam",e.oceanFoamStrength,0,5,.1),oceanFoamThreshold:T("Foam Threshold",e.oceanFoamThreshold,0,5,.1),Ghost:C({oceanGhostRide:T("Ride Swell",e.oceanGhostRide,0,1,.01),oceanGhostRock:T("Rock",e.oceanGhostRock,0,1,.01),oceanGhostFollow:T("Follow",e.oceanGhostFollow,.2,10,.1)},K),Sky:C({oceanSkyVisible:{label:"Day Sky",value:e.oceanSkyVisible},oceanExposure:T("Exposure",e.oceanExposure,.05,2.5,.01),oceanSkyTurbidity:T("Turbidity",e.oceanSkyTurbidity,1,20,.1),oceanSkyRayleigh:T("Rayleigh",e.oceanSkyRayleigh,0,4,.01),oceanSkyMie:T("Mie",e.oceanSkyMie,0,.02,1e-4)},K),Colors:C({oceanCustomColors:{label:"Custom",value:e.oceanCustomColors},oceanSeaColor:{label:"Deep Water",value:e.oceanSeaColor},oceanHorizonColor:{label:"Horizon",value:e.oceanHorizonColor},oceanReflectColor:{label:"Sky Reflect",value:e.oceanReflectColor},oceanWaveColor:{label:"Wave Crest",value:e.oceanWaveColor},oceanFadeColor:{label:"Distance",value:e.oceanFadeColor},oceanSpecularColor:{label:"Glint",value:e.oceanSpecularColor},oceanFoamColor:{label:"Foam",value:e.oceanFoamColor},oceanSpecularStrength:T("Glint Strength",e.oceanSpecularStrength,0,4,.01)},K),Moon:C({oceanMoonVisible:{label:"Visible",value:e.oceanMoonVisible},oceanMoonSize:T("Size (°)",e.oceanMoonSize,.5,15,.1),oceanMoonColor:{label:"Color",value:e.oceanMoonColor},oceanMoonGlow:T("Glow",e.oceanMoonGlow,0,5,.01)},K),"First Wave Spectrum":C(je({prefix:Ut,snapshot:e}),K),"Second Wave Spectrum":C(Ue({prefix:Kt,snapshot:e}),K)},K)}const Z={collapsed:!0},Pi=["wingStorm","wingAirspeed","wingTurbulence","wingTurbulenceSpeed","wingLightsVisible","wingNavColor","wingNavIntensity","wingSkyVisible","wingSkyTurbidity","wingSkyRayleigh","wingSkyMie","wingCloudsVisible","wingCloudHeight","wingCloudCoverage","wingCloudSoftness","wingCloudLitColor","wingCloudShadeColor","wingCloudHorizonColor","wingRainCount","wingRainLength","wingRainOpacity","wingRainColor","wingFlashColor","wingFlashIntensity","wingFlashMinGap","wingFlashMaxGap"],L=(e,t,a,o,i)=>({label:e,value:t,min:a,max:o,step:i});function Fi(e){return C({wingStorm:{label:"Storm",value:e.wingStorm},wingAirspeed:L("Airspeed (m/s)",e.wingAirspeed,0,250,1),wingTurbulence:L("Turbulence",e.wingTurbulence,0,3,.01),wingTurbulenceSpeed:L("Turbulence Speed",e.wingTurbulenceSpeed,0,4,.01),Lights:C({wingLightsVisible:{label:"Wingtip",value:e.wingLightsVisible},wingNavColor:{label:"Nav Color",value:e.wingNavColor},wingNavIntensity:L("Intensity",e.wingNavIntensity,0,50,.1)},Z),Sky:C({wingSkyVisible:{label:"Day Sky",value:e.wingSkyVisible},wingSkyTurbidity:L("Turbidity",e.wingSkyTurbidity,0,20,.1),wingSkyRayleigh:L("Rayleigh",e.wingSkyRayleigh,0,4,.01),wingSkyMie:L("Mie",e.wingSkyMie,0,.1,5e-4)},Z),Clouds:C({wingCloudsVisible:{label:"Visible",value:e.wingCloudsVisible},wingCloudHeight:L("Height",e.wingCloudHeight,-600,-5,1),wingCloudCoverage:L("Coverage",e.wingCloudCoverage,0,1,.01),wingCloudSoftness:L("Softness",e.wingCloudSoftness,0,.5,.01),wingCloudLitColor:{label:"Lit",value:e.wingCloudLitColor},wingCloudShadeColor:{label:"Shade",value:e.wingCloudShadeColor},wingCloudHorizonColor:{label:"Horizon",value:e.wingCloudHorizonColor}},Z),Rain:C({wingRainCount:L("Drops",e.wingRainCount,0,8e3,100),wingRainLength:L("Length",e.wingRainLength,.05,2,.01),wingRainOpacity:L("Opacity",e.wingRainOpacity,0,1,.01),wingRainColor:{label:"Color",value:e.wingRainColor}},Z),Lightning:C({wingFlashColor:{label:"Color",value:e.wingFlashColor},wingFlashIntensity:L("Intensity",e.wingFlashIntensity,0,30,.1),wingFlashMinGap:L("Min Gap (s)",e.wingFlashMinGap,.5,30,.5),wingFlashMaxGap:L("Max Gap (s)",e.wingFlashMaxGap,1,60,.5)},Z)},Z)}function Ei({anchorRef:e,config:t}){const a=G(t,bi),o=G(t,Ti),i=G(t,Pi),r=G(t,Ri),n=G(t,wi),l=G(t,ki),f=t.lightKeyAzimuth,u=t.lightKeyElevation;switch(t.location){case Lt:return m.jsx(Qa,{anchorRef:e,config:o,sunAzimuth:f,sunElevation:u});case Tt:return m.jsx(yi,{anchorRef:e,backdropColor:t.backdropColor,config:i,sunAzimuth:f,sunElevation:u});case Wt:return m.jsx(ei,{config:r});case Ft:return m.jsx(ja,{config:l});case Pt:return m.jsx(Xa,{config:n});case Ye:default:return m.jsx(ga,{config:a})}}const zi=s.memo(Ei),Yt={milkyWay:V("blackhole/legacy-milkyway.jpg"),stars:V("blackhole/legacy-stars.png")},Ai=9e3,Pe=Math.PI/180;j.preload(Object.values(Yt));function Ii({brightness:e,rotation:t,tint:a,variant:o}){const i=j(Yt),r=s.useRef(null);s.useEffect(()=>{const{milkyWay:u,stars:c}=i;u.colorSpace=he,u.needsUpdate=!0,c.colorSpace=he,c.needsUpdate=!0},[i]);const n=s.useMemo(()=>new Ne(Ai,64,32),[]),{material:l,uniforms:f}=s.useMemo(()=>Jo(i[o]??i.milkyWay),[i,o]);return s.useEffect(()=>{f.brightness.value=e,f.tint.value.set(a)},[e,a,f]),s.useEffect(()=>()=>n.dispose(),[n]),s.useEffect(()=>()=>l.dispose(),[l]),E(({camera:u})=>{r.current?.position.copy(u.position)}),m.jsx("mesh",{ref:r,frustumCulled:!1,geometry:n,material:l,renderOrder:-10,rotation:[t.x*Pe,t.y*Pe,t.z*Pe]})}const _i=s.memo(Ii),fe={collapsed:!0},Gi=["ghostPosition","ghostRotationY","ghostTiltBack","ghostScale","ghostColor","ghostEyeColor","ghostEyeIntensity","ghostGlowColor","ghostOuterGlow","ghostInnerGlow","ghostGroundLightIntensity","ghostBobAmplitude","ghostBobSpeed","ghostTilt","ghostBaseWind","ghostWindBoost","ghostWindStrength","ghostWindAngle","ghostWindGust","ghostClothSegments"];function Bi(e){return C({ghostPosition:{label:"Position",value:e.ghostPosition,step:.01},ghostRotationY:{label:"Facing (°)",value:e.ghostRotationY,min:-180,max:180,step:1},ghostTiltBack:{label:"Tilt Back (°)",value:e.ghostTiltBack,min:-45,max:75,step:1},ghostScale:{label:"Scale",value:e.ghostScale,min:.2,max:10,step:.01},Look:C({ghostColor:{label:"Cloth",value:e.ghostColor},ghostEyeColor:{label:"Eyes",value:e.ghostEyeColor},ghostEyeIntensity:{label:"Eye Glow",value:e.ghostEyeIntensity,min:0,max:10,step:.01},ghostGlowColor:{label:"Glow",value:e.ghostGlowColor},ghostOuterGlow:{label:"Outer Glow",value:e.ghostOuterGlow,min:0,max:3,step:.01},ghostInnerGlow:{label:"Inner Glow",value:e.ghostInnerGlow,min:0,max:3,step:.01},ghostGroundLightIntensity:{label:"Ground Light",value:e.ghostGroundLightIntensity,min:0,max:20,step:.1},ghostClothSegments:{label:"Cloth Segments",value:e.ghostClothSegments,min:12,max:48,step:1}},fe),Motion:C({ghostBobAmplitude:{label:"Bob",value:e.ghostBobAmplitude,min:0,max:.2,step:.001},ghostBobSpeed:{label:"Bob Speed",value:e.ghostBobSpeed,min:0,max:3,step:.01},ghostTilt:{label:"Lean Into Wind",value:e.ghostTilt,min:0,max:1,step:.01}},fe),Wind:C({ghostWindStrength:{label:"Strength",value:e.ghostWindStrength,min:0,max:1.5,step:.01},ghostWindAngle:{label:"Heading (°)",value:e.ghostWindAngle,min:-180,max:180,step:1},ghostWindGust:{label:"Gusts",value:e.ghostWindGust,min:0,max:1,step:.01},ghostBaseWind:{label:"Base Flutter",value:e.ghostBaseWind,min:0,max:2,step:.01},ghostWindBoost:{label:"Wind Boost",value:e.ghostWindBoost,min:0,max:8,step:.05}},fe)},fe)}const Xt={collapsed:!0},Oi=["starsVisible","starsVariant","starsBrightness","starsRotation","starsTint"],Hi=["earthVisible","earthAzimuth","earthElevation","earthSize","earthAtmosphere","earthSpin"],ie=(e,t,a,o,i)=>({label:e,value:t,min:a,max:o,step:i});function Ni(e){return C({starsVisible:{label:"Visible",value:e.starsVisible},starsVariant:{label:"Sky",value:e.starsVariant,options:{"Milky Way":"milkyWay",Stars:"stars"}},starsBrightness:ie("Brightness",e.starsBrightness,0,3,.01),starsRotation:{label:"Rotation (°)",value:e.starsRotation,step:1},starsTint:{label:"Tint",value:e.starsTint}},Xt)}function Vi(e){return C({earthVisible:{label:"Visible",value:e.earthVisible},earthAzimuth:ie("Azimuth",e.earthAzimuth,-180,180,.5),earthElevation:ie("Elevation",e.earthElevation,-10,89,.5),earthSize:ie("Size (°)",e.earthSize,.5,40,.1),earthAtmosphere:{label:"Atmosphere",value:e.earthAtmosphere},earthSpin:ie("Spin",e.earthSpin,0,.2,.001)},Xt)}const Q=(e,t,a)=>({x:e,y:t,z:a}),pt=e=>Object.fromEntries(Object.entries(e).map(([t,a])=>[t,a.value])),ji={cameraMode:"spline",splinePreset:"Black Hole Drift",splineDesktopTarget:Q(-16,0,-8),splineMobileTarget:Q(-16,0,-8),splineDesktopFov:58,splineMobileFov:70,splineDuration:80,splineOrientationMode:"target"},Ui={lightEnabled:!0,lightHemiSkyColor:"#9fb4d8",lightHemiGroundColor:"#1a1d26",lightHemiIntensity:.4,lightKeyColor:"#fff1dc",lightKeyIntensity:2,lightKeyAzimuth:200,lightKeyElevation:25,lightKeyShadowExtent:6,lightRimColor:"#9cc4ff",lightRimIntensity:.8,lightRimAzimuth:20,lightRimElevation:35},Ki={location:Ye,backdropColor:"#000000",fogEnabled:!1,fogNear:20,fogFar:400},Yi={ghostPosition:Q(0,0,0),ghostRotationY:-48,ghostTiltBack:0,ghostScale:1,ghostColor:"#f5f2ea",ghostEyeColor:"#000000",ghostEyeIntensity:.2,ghostGlowColor:"#88ccff",ghostOuterGlow:0,ghostInnerGlow:0,ghostGroundLightIntensity:0,ghostBobAmplitude:.03,ghostBobSpeed:.5,ghostTilt:.3,ghostBaseWind:.3,ghostWindBoost:2,ghostWindStrength:0,ghostWindAngle:180,ghostWindGust:0,ghostClothSegments:28},Xi={starsVisible:!0,starsVariant:"milkyWay",starsBrightness:.8,starsRotation:Q(0,0,0),starsTint:"#ffffff",earthVisible:!1,earthAzimuth:-90,earthElevation:15,earthSize:4,earthAtmosphere:"#4f8cff",earthSpin:.01},$i={blackHoleVariant:Vo,blackHolePosition:Q(-34,6,2),metricWorldScale:14,blackHoleLightEnabled:!0,blackHoleLightIntensity:3,blackHoleLightVividness:.85,blackHoleLightColor:"#ffb36b",...No,...Ho,...Oo},Zi={oceanQuality:Xo,oceanPatchSize:1200,oceanPatchResolution:384,oceanLodScale:3.7,oceanFoamStrength:.8,oceanFoamThreshold:2.7,oceanExposure:1,oceanSkyVisible:!0,oceanSkyTurbidity:10,oceanSkyRayleigh:3,oceanSkyMie:.005,oceanCustomColors:!1,oceanSeaColor:"#0d223d",oceanHorizonColor:"#adceea",oceanReflectColor:"#507ea8",oceanWaveColor:"#698976",oceanFadeColor:"#00597c",oceanSpecularColor:"#cec4ba",oceanFoamColor:"#ffffff",oceanSpecularStrength:1,oceanMoonVisible:!1,oceanMoonSize:3,oceanMoonColor:"#dfe6ff",oceanMoonGlow:1.2,oceanGhostRide:1,oceanGhostRock:.5,oceanGhostFollow:3,...pt(je({prefix:"oceanFirst_"})),...pt(Ue({prefix:"oceanSecond_"}))},qi={wingStorm:!1,wingAirspeed:70,wingTurbulence:.3,wingTurbulenceSpeed:1,wingLightsVisible:!0,wingNavColor:"#ff2a2a",wingNavIntensity:4,wingSkyVisible:!0,wingSkyTurbidity:4,wingSkyRayleigh:1.8,wingSkyMie:.006,wingCloudsVisible:!0,wingCloudHeight:-120,wingCloudCoverage:.45,wingCloudSoftness:.12,wingCloudLitColor:"#ffd8b8",wingCloudShadeColor:"#8a8fb0",wingCloudHorizonColor:"#f2b98e",wingRainCount:3500,wingRainLength:.6,wingRainOpacity:.35,wingRainColor:"#a9b8d6",wingFlashColor:"#cfd8ff",wingFlashIntensity:12,wingFlashMinGap:4,wingFlashMaxGap:12},Qi={tinyMoonRadius:3,tinyMoonDisplacement:.04,tinyMoonBump:1.5,tinyMoonRoughness:.95,tinyMoonTint:"#ffffff",lunarSeed:7,lunarCraterCount:420,lunarMaxCrater:45,lunarRoughness:1.1,lunarCurvature:1100,lunarGrain:.5,lunarDarkColor:"#55534f",lunarLightColor:"#8d8a84"},Ji={campfirePosition:Q(-1.9,0,0),campfireBurnMode:"hold",campfireFireLife:.8,campfireBurnSeconds:120,campfireResolution:480,campfireGhostLight:1},er={...ji,...Ui,...Ki,...Yi,...Xi,...$i,...Zi,...qi,...Qi,...Ji},tr="Black Hole",H={cameraMode:"orbit",cameraProjection:"perspective",cameraFrustumHeight:10,cameraMobileFrustumHeight:10,cameraAutoFit:!0,fixedBehavior:"single",fixedShotDefaultDesktopPosition:{x:0,y:0,z:5},fixedShotDefaultDesktopTarget:{x:0,y:0,z:0},fixedShotDefaultDesktopFov:50,fixedShotDefaultMobilePosition:{x:0,y:0,z:5},fixedShotDefaultMobileTarget:{x:0,y:0,z:0},fixedShotDefaultMobileFov:50,orbitAutoRotate:!1,orbitAutoRotateSpeed:2,orbitEnablePan:!0,orbitMinPolarAngle:0,orbitMaxPolarAngle:180,orbitAzimuthUnlimited:!0,orbitMinAzimuthAngle:-180,orbitMaxAzimuthAngle:180,orbitMinDistance:0,orbitMaxDistanceUnlimited:!0,orbitMaxDistance:100,orbitDesktopPosition:{x:-34.5,y:11.6,z:57},orbitDesktopTarget:{x:0,y:0,z:0},orbitDesktopPivot:{x:-9,y:0,z:4},orbitDesktopFov:45,orbitMobilePosition:{x:2,y:.8,z:4.5},orbitMobileTarget:{x:0,y:0,z:0},orbitMobilePivot:{x:0,y:0,z:0},orbitMobileFov:65,splinePreset:"Black Hole Drift",splineDesktopTarget:{x:-16,y:0,z:-8},splineDesktopFov:58,splineMobileTarget:{x:-16,y:0,z:-8},splineMobileFov:70,splineOrientationMode:"target",splineForwardDistance:1,splinePosition:{x:0,y:0,z:0},splineScale:{x:1,y:1,z:1},splineDuration:80,splineTension:.5,splineClosed:!0,splineShowPath:!1,operatorMoveSpeed:6,operatorLiftSpeed:6,operatorBoostMultiplier:2,operatorPointerLookSensitivity:.003,operatorStickLookSpeed:2.5,operatorZoomSpeed:24,operatorMinFov:20,operatorMaxFov:80,lightEnabled:!1,lightHemiEnabled:!0,lightHemiSkyColor:"#202436",lightHemiGroundColor:"#000000",lightHemiIntensity:.15,lightKeyEnabled:!1,lightKeyColor:"#ffcf8a",lightKeyIntensity:2.5,lightKeyAzimuth:-87,lightKeyElevation:10,lightKeyRadius:30,lightKeyTarget:{x:0,y:0,z:0},lightKeyCastShadow:!0,lightKeyShadowMapSize:2048,lightKeyShadowBias:-4e-4,lightKeyShadowNormalBias:0,lightKeyShadowFar:80,lightKeyShadowExtent:6,lightKeyDebug:!1,lightRimEnabled:!0,lightRimColor:"#6f88c9",lightRimIntensity:.6,lightRimAzimuth:34,lightRimElevation:25,lightRimRadius:30,lightRimTarget:{x:0,y:0,z:0},lightRimDebug:!1,location:"blackHole",backdropColor:"#000000",fogEnabled:!1,fogNear:20,fogFar:400,ghostPosition:{x:-4,y:2,z:0},ghostRotationY:-90,ghostTiltBack:25,ghostScale:10,ghostColor:"#f5f2ea",ghostEyeColor:"#000000",ghostEyeIntensity:.2,ghostGlowColor:"#88ccff",ghostOuterGlow:0,ghostInnerGlow:0,ghostGroundLightIntensity:0,ghostClothSegments:48,ghostBobAmplitude:.03,ghostBobSpeed:.5,ghostTilt:.3,ghostWindStrength:0,ghostWindAngle:180,ghostWindGust:0,ghostBaseWind:.15,ghostWindBoost:2,starsVisible:!0,starsVariant:"milkyWay",starsBrightness:.8,starsRotation:{x:0,y:0,z:0},starsTint:"#ffffff",earthVisible:!1,earthAzimuth:-90,earthElevation:15,earthSize:4,earthAtmosphere:"#4f8cff",earthSpin:.01,blackHoleVariant:"legacyPort",blackHolePosition:{x:-34,y:6,z:2},metricWorldScale:21,blackHoleLightEnabled:!0,blackHoleLightIntensity:3,blackHoleLightVividness:.85,blackHoleLightColor:"#ffb36b",legacyDiskVariant:"chromatic",legacyUseProceduralDisk:!0,legacyBlackHoleDiameter:.3048,legacyDiskDiameter:1.08,legacyLensDiameter:1.55,legacyGravityStrength:1,legacyStepCount:100,legacyDiskBrightness:1.67,legacyDiskTemperature:8e3,legacyDopplerStrength:1,legacyChromaticRingFreq:1,legacyChromaticAnimSpeed:2,legacyChromaticColorSpeed:.5,legacyChromaticSaturation:.45,legacyRibbonRotationSpeed:.02,legacyRibbonBandScale:16,legacyRibbonBiasStrength:.05,legacyAccretionMinRadius:1.5,legacyAccretionWidth:5,legacyMaxRevolutions:2,legacyStarBrightness:1,legacyGalaxyBrightness:.4,webgpuBlackHoleDiameter:.3048,webgpuDiskDiameter:1.08,webgpuLensDiameter:1.55,webgpuMass:.4,webgpuDiskInnerRadius:4.1,webgpuDiskOuterRadius:14.5,webgpuDiskBrightness:5,webgpuTemperature:49.78,webgpuTemperatureFalloff:5.22,webgpuLensingStrength:2.4,webgpuDopplerStrength:1,webgpuRotationSpeed:-8.7,webgpuStepCount:64,webgpuStepSize:1,webgpuTurbulenceScale:1.81,webgpuTurbulenceStretch:.75,webgpuTurbulenceSharpness:7.4,webgpuTurbulenceCycleTime:5,webgpuTurbulenceLacunarity:3,webgpuTurbulencePersistence:.8,webgpuDiskEdgeSoftnessInner:.18,webgpuDiskEdgeSoftnessOuter:.5,singularityLensDiameter:1.55,singularityIterations:112,singularityStepSize:.011,singularityPower:.26,singularityOriginRadius:.11,singularityBandWidth:.058,singularityFieldScale:3.8,singularityRampPos1:.05,singularityRampPos2:.425,singularityRampPos3:1,singularityRampColor1:"#f2b670",singularityRampColor2:"#3d180a",singularityRampColor3:"#050505",singularityEmissionStrength:1.9,oceanQuality:"Medium",oceanPatchSize:1200,oceanPatchResolution:384,oceanLodScale:3.7,oceanFoamStrength:.8,oceanFoamThreshold:2.7,oceanGhostRide:1,oceanGhostRock:.5,oceanGhostFollow:3,oceanSkyVisible:!0,oceanExposure:1,oceanSkyTurbidity:10,oceanSkyRayleigh:3,oceanSkyMie:.005,oceanCustomColors:!1,oceanSeaColor:"#0d223d",oceanHorizonColor:"#adceea",oceanReflectColor:"#507ea8",oceanWaveColor:"#698976",oceanFadeColor:"#00597c",oceanSpecularColor:"#cec4ba",oceanFoamColor:"#ffffff",oceanSpecularStrength:1,oceanMoonVisible:!1,oceanMoonSize:3,oceanMoonColor:"#dfe6ff",oceanMoonGlow:1.2,oceanFirst_depth:20,oceanFirst_scaleHeight:1,oceanFirst_windSpeed:1,oceanFirst_windDirection:0,oceanFirst_fetch:1e5,oceanFirst_spreadBlend:1,oceanFirst_swell:.198,oceanFirst_peakEnhancement:3.3,oceanFirst_shortWaveFade:0,oceanFirst_fadeLimit:0,oceanSecond_d_depth:20,oceanSecond_d_scaleHeight:1,oceanSecond_d_windSpeed:1,oceanSecond_d_windDirection:4.1887902047863905,oceanSecond_d_fetch:3e5,oceanSecond_d_spreadBlend:1,oceanSecond_d_swell:.5,oceanSecond_d_peakEnhancement:3.3,oceanSecond_d_shortWaveFade:0,oceanSecond_d_fadeLimit:0,wingStorm:!1,wingAirspeed:70,wingTurbulence:.3,wingTurbulenceSpeed:1,wingLightsVisible:!0,wingNavColor:"#ff2a2a",wingNavIntensity:4,wingSkyVisible:!0,wingSkyTurbidity:4,wingSkyRayleigh:1.8,wingSkyMie:.006,wingCloudsVisible:!0,wingCloudHeight:-120,wingCloudCoverage:.45,wingCloudSoftness:.12,wingCloudLitColor:"#ffd8b8",wingCloudShadeColor:"#8a8fb0",wingCloudHorizonColor:"#f2b98e",wingRainCount:3500,wingRainLength:.6,wingRainOpacity:.35,wingRainColor:"#a9b8d6",wingFlashColor:"#cfd8ff",wingFlashIntensity:12,wingFlashMinGap:4,wingFlashMaxGap:12,tinyMoonRadius:3,tinyMoonDisplacement:.04,tinyMoonBump:1.5,tinyMoonRoughness:.95,tinyMoonTint:"#ffffff",lunarSeed:7,lunarCraterCount:420,lunarMaxCrater:45,lunarRoughness:1.1,lunarCurvature:1100,lunarGrain:.5,lunarDarkColor:"#55534f",lunarLightColor:"#8d8a84",campfirePosition:{x:-1.9,y:0,z:0},campfireBurnMode:"hold",campfireFireLife:.8,campfireBurnSeconds:120,campfireResolution:480,campfireGhostLight:1},or={"Black Hole":{...H},"Ocean: Day":{...H,cameraMode:"spline",orbitDesktopPosition:{x:1.5,y:.6,z:3},orbitDesktopPivot:{x:0,y:0,z:0},splinePreset:"Ocean Drift",splineDesktopTarget:{x:-21,y:3,z:-8},splineMobileTarget:{x:-21,y:3,z:-8},lightEnabled:!0,lightHemiSkyColor:"#bcd9ff",lightHemiGroundColor:"#2f4a5c",lightHemiIntensity:.9,lightKeyEnabled:!0,lightKeyColor:"#fff2dd",lightKeyIntensity:2.6,lightKeyAzimuth:-90,lightKeyElevation:2,lightRimColor:"#bcd9ff",lightRimIntensity:.5,location:"ocean",backdropColor:"#87ceeb",ghostPosition:{x:0,y:2.4,z:0},ghostRotationY:-48,ghostTiltBack:0,ghostScale:2.6,ghostClothSegments:28,ghostWindStrength:.35,ghostWindAngle:120,ghostWindGust:.3,ghostBaseWind:.3,starsVisible:!1,metricWorldScale:14,legacyDiskVariant:"ribbon",legacyChromaticAnimSpeed:1},"Ocean: Night":{...H,cameraMode:"spline",orbitDesktopPosition:{x:1.5,y:.6,z:3},orbitDesktopPivot:{x:0,y:0,z:0},splinePreset:"Ocean Drift",splineDesktopTarget:{x:-27,y:6,z:-12},splineMobileTarget:{x:-27,y:6,z:-12},lightEnabled:!0,lightHemiSkyColor:"#1a2238",lightHemiGroundColor:"#05070c",lightHemiIntensity:.25,lightKeyEnabled:!0,lightKeyColor:"#9fb6ff",lightKeyIntensity:.6,lightKeyAzimuth:-90,lightKeyElevation:14,lightRimColor:"#6f8fd8",lightRimIntensity:.3,location:"ocean",backdropColor:"#02040a",ghostPosition:{x:0,y:2.4,z:0},ghostRotationY:-48,ghostTiltBack:0,ghostScale:2.6,ghostEyeColor:"#88ccff",ghostEyeIntensity:2.5,ghostOuterGlow:.15,ghostClothSegments:28,ghostWindStrength:.2,ghostWindAngle:120,ghostWindGust:.2,ghostBaseWind:.3,starsBrightness:.6,metricWorldScale:14,legacyDiskVariant:"ribbon",legacyChromaticAnimSpeed:1,oceanSkyVisible:!1,oceanCustomColors:!0,oceanSeaColor:"#01040a",oceanHorizonColor:"#0b1426",oceanReflectColor:"#060b18",oceanWaveColor:"#0a1a22",oceanFadeColor:"#02040a",oceanSpecularColor:"#cfdcff",oceanFoamColor:"#8a96ad",oceanSpecularStrength:1.6,oceanMoonVisible:!0,oceanFirst_scaleHeight:.7},"Wing: Storm":{...H,cameraMode:"spline",orbitDesktopPosition:{x:1.5,y:.6,z:3},orbitDesktopPivot:{x:0,y:0,z:0},splinePreset:"Wing Drift",splineDesktopTarget:{x:21,y:2,z:-8},splineMobileTarget:{x:21,y:2,z:-8},splineDuration:60,lightEnabled:!0,lightHemiSkyColor:"#1d2333",lightHemiGroundColor:"#050608",lightHemiIntensity:.3,lightKeyEnabled:!0,lightKeyColor:"#7d8db8",lightKeyIntensity:.35,lightKeyAzimuth:90,lightKeyElevation:40,lightRimColor:"#5a6a99",lightRimIntensity:.35,lightRimAzimuth:-34,location:"wing",backdropColor:"#05070c",fogEnabled:!0,fogNear:15,fogFar:260,ghostPosition:{x:0,y:2.25,z:0},ghostRotationY:48,ghostTiltBack:0,ghostScale:2.6,ghostEyeColor:"#88ccff",ghostEyeIntensity:2.5,ghostClothSegments:28,ghostTilt:.5,ghostWindStrength:1,ghostWindGust:.5,ghostBaseWind:.3,ghostWindBoost:3.5,starsVisible:!1,metricWorldScale:14,legacyDiskVariant:"ribbon",legacyChromaticAnimSpeed:1,wingStorm:!0,wingAirspeed:90,wingTurbulence:1.4,wingTurbulenceSpeed:1.6,wingNavIntensity:6,wingSkyVisible:!1,wingCloudHeight:-80,wingCloudCoverage:.25,wingCloudLitColor:"#3a4256",wingCloudShadeColor:"#141823",wingCloudHorizonColor:"#05070c"},"Wing: Above the Clouds":{...H,cameraMode:"spline",orbitDesktopPosition:{x:1.5,y:.6,z:3},orbitDesktopPivot:{x:0,y:0,z:0},splinePreset:"Wing Drift",splineDesktopTarget:{x:21,y:2,z:-8},splineMobileTarget:{x:21,y:2,z:-8},lightEnabled:!0,lightHemiSkyColor:"#8aa4d6",lightHemiGroundColor:"#d9b8a0",lightHemiIntensity:.6,lightKeyEnabled:!0,lightKeyColor:"#ffb070",lightKeyIntensity:2.4,lightKeyAzimuth:90,lightKeyElevation:4,lightRimColor:"#9fb4e0",lightRimAzimuth:-34,location:"wing",backdropColor:"#f2b98e",ghostPosition:{x:0,y:2.25,z:0},ghostRotationY:48,ghostTiltBack:0,ghostScale:2.6,ghostClothSegments:28,ghostWindStrength:.8,ghostWindGust:.15,ghostBaseWind:.3,ghostWindBoost:3,starsVisible:!1,metricWorldScale:14,legacyDiskVariant:"ribbon",legacyChromaticAnimSpeed:1,wingNavIntensity:2},"Tiny Moon":{...H,cameraMode:"spline",orbitDesktopPosition:{x:1.5,y:.6,z:3},orbitDesktopPivot:{x:0,y:0,z:0},splinePreset:"Tiny Moon Drift",splineDesktopTarget:{x:-23,y:4,z:-12},splineMobileTarget:{x:-23,y:4,z:-12},splineDuration:90,lightEnabled:!0,lightHemiSkyColor:"#22283a",lightHemiIntensity:.12,lightKeyEnabled:!0,lightKeyColor:"#fff4e6",lightKeyIntensity:3,lightKeyAzimuth:30,lightKeyElevation:25,lightKeyShadowExtent:4,lightRimColor:"#7f9fff",lightRimIntensity:.3,lightRimAzimuth:-90,lightRimElevation:20,location:"tinyMoon",ghostPosition:{x:0,y:.85,z:0},ghostRotationY:-48,ghostTiltBack:0,ghostScale:1,ghostClothSegments:28,ghostBaseWind:.1,starsBrightness:.9,earthVisible:!0,earthElevation:20,earthSize:18,metricWorldScale:14,legacyDiskVariant:"ribbon",legacyChromaticAnimSpeed:1},"Lunar Surface":{...H,cameraMode:"spline",orbitDesktopPosition:{x:1.5,y:.6,z:3},orbitDesktopPivot:{x:0,y:0,z:0},splinePreset:"Lunar Drift",splineDesktopTarget:{x:-30,y:7,z:-14},splineMobileTarget:{x:-30,y:7,z:-14},lightEnabled:!0,lightHemiSkyColor:"#0c0e14",lightHemiGroundColor:"#2a2a2a",lightHemiIntensity:.08,lightKeyEnabled:!0,lightKeyColor:"#ffffff",lightKeyIntensity:4,lightKeyAzimuth:60,lightKeyElevation:9,lightKeyShadowExtent:14,lightRimColor:"#5d7bbd",lightRimIntensity:.2,lightRimAzimuth:-90,lightRimElevation:12,location:"lunarSurface",ghostPosition:{x:0,y:2.2,z:0},ghostRotationY:-48,ghostTiltBack:0,ghostScale:2.6,ghostClothSegments:28,ghostBaseWind:.1,starsVariant:"stars",starsBrightness:.25,earthVisible:!0,earthElevation:12,earthSize:3.5,metricWorldScale:14,legacyDiskVariant:"ribbon",legacyChromaticAnimSpeed:1},Campfire:{...H,cameraMode:"spline",orbitDesktopPosition:{x:1.5,y:.6,z:3},orbitDesktopPivot:{x:0,y:0,z:0},splinePreset:"Campfire Drift",splineDesktopTarget:{x:-.98,y:.7,z:0},splineDesktopFov:50,splineMobileTarget:{x:-.98,y:.7,z:0},lightHemiSkyColor:"#9fb4d8",lightHemiGroundColor:"#1a1d26",lightHemiIntensity:.4,lightKeyEnabled:!0,lightKeyColor:"#fff1dc",lightKeyIntensity:2,lightKeyAzimuth:200,lightKeyElevation:25,lightRimColor:"#9cc4ff",lightRimIntensity:.8,lightRimAzimuth:20,lightRimElevation:35,location:"campfire",ghostPosition:{x:0,y:1.55,z:0},ghostRotationY:-48,ghostTiltBack:0,ghostScale:2,ghostClothSegments:28,ghostBaseWind:.12,starsVisible:!1,metricWorldScale:14,legacyDiskVariant:"ribbon",legacyChromaticAnimSpeed:1}};function ar({presetSnapshot:e}){return{...e}}const ir={"Black Hole Drift":{tension:.5,closed:!0,points:[[1.06,.03,2.38],[1.45,.27,2.32],[1.84,.45,2.19],[1.96,.21,1.9],[1.59,-.03,1.89],[1.2,-.15,2.07]]},"Ocean Drift":{tension:.5,closed:!0,points:[[2.85,2.03,6.39],[3.89,2.47,6.23],[4.95,2.8,5.9],[5.29,2.36,5.11],[4.27,1.92,5.09],[3.22,1.7,5.58]]},"Wing Drift":{tension:.5,closed:!0,points:[[-2.85,1.83,6.39],[-3.89,2.27,6.23],[-4.95,2.6,5.9],[-5.29,2.16,5.11],[-4.27,1.72,5.09],[-3.22,1.5,5.58]]},"Tiny Moon Drift":{tension:.5,closed:!0,points:[[1.38,.6,3.11],[1.89,1,3.03],[2.4,1.3,2.87],[2.57,.9,2.48],[2.08,.5,2.47],[1.56,.3,2.71]]},"Lunar Drift":{tension:.5,closed:!0,points:[[2.64,1.2,5.94],[3.62,1.6,5.79],[4.6,1.9,5.48],[4.91,1.5,4.74],[3.97,1.1,4.73],[2.99,.9,5.18]]},"Campfire Drift":{tension:.5,closed:!0,points:[[-.83,1.24,4.73],[-.35,1.56,5.03],[.28,1.8,5.27],[.79,1.48,4.98],[.32,1.16,4.55],[-.38,1,4.4]]}},rr={defaultMode:"spline",near:.05,far:1e6,orbit:{desktop:{position:[1.5,.6,3],target:[0,0,0],pivot:[0,0,0],fov:45},mobile:{position:[2,.8,4.5],target:[0,0,0],pivot:[0,0,0],fov:65}},spline:{preset:"Black Hole Drift",paths:ir,duration:80,orientationMode:"target",desktop:{target:[-16,0,-8],fov:58},mobile:{target:[-16,0,-8],fov:70}}},sr={hemi:{type:"hemisphere",skyColor:"#9fb4d8",groundColor:"#1a1d26",intensity:.4},key:{type:"directional",color:"#fff1dc",intensity:2,position:{azimuth:200,elevation:25,radius:30},shadow:{mapSize:2048,extent:6,far:80,bias:-4e-4}},rim:{type:"directional",color:"#9cc4ff",intensity:.8,position:{azimuth:20,elevation:35,radius:30}}},J="All My Friends Are Ghosts",nr=`${J}.Camera`,lr=`${J}.Lighting`,cr=`${J}.Black Hole`,ur=`${J}.Campfire`,Fe={collapsed:!0};function fr(){const{attachSetControls:e,controlsSnapshotRef:t,presetsFolder:a}=qo({defaultPreset:tr,getPresetControls:ar,presets:or}),o={...er,...t.current},i=s.useRef(null),{buildCamera:r,cameraControls:n}=uo({apiRef:i,camera:rr,cameraFolderPath:nr,controlsSnapshotRef:t}),{buildLighting:l,lightingControls:f}=ho({controlsSnapshotRef:t,lighting:sr,lightingFolderPath:lr}),[u,c]=lo(J,()=>({Presets:a,Camera:C(n,Fe),Lighting:C(f,Fe),Place:C({location:{label:"Location",value:o.location,options:da},backdropColor:{label:"Backdrop",value:o.backdropColor},fogEnabled:{label:"Fog",value:o.fogEnabled},fogNear:{label:"Fog Near",value:o.fogNear,min:0,max:500,step:.5},fogFar:{label:"Fog Far",value:o.fogFar,min:1,max:4e3,step:1}},Fe),Ghost:Bi(o),Stars:Ni(o),Earth:Vi(o),"Black Hole":Ci(o,cr),Ocean:Wi(o),Wing:Fi(o),"Tiny Moon":Mi(o),"Lunar Surface":Di(o),Campfire:xi(o,ur)}));e(c),t.current={...u},Qo({fileName:J});const d=s.useMemo(()=>fo(u),[u]),g=s.useMemo(()=>r(u),[r,d]),h=s.useMemo(()=>go(u),[u]),p=s.useMemo(()=>l(u),[l,h]);return s.useMemo(()=>({...u,cameraApiRef:i,camera:g,lighting:p}),[g,u,p])}const St=1e7;function mr(){return{position:new S,quaternion:new Rt}}function $r(){const e=fr(),t=s.useRef(null);t.current||(t.current=mr());const a=G(e,Gi),o=G(e,Oi),i=G(e,Hi);return s.useEffect(()=>{t.current.position.set(0,0,0),t.current.quaternion.identity()},[e.location]),co({color:e.backdropColor,fogFar:e.fogEnabled?e.fogFar:St+1,fogNear:e.fogEnabled?e.fogNear:St}),m.jsxs(m.Fragment,{children:[m.jsx(mo,{camera:e.camera}),m.jsx(po,{lighting:e.lighting}),o.starsVisible&&m.jsx(_i,{brightness:o.starsBrightness,rotation:o.starsRotation,tint:o.starsTint,variant:o.starsVariant}),i.earthVisible&&m.jsx(la,{angularSize:i.earthSize,atmosphereColor:i.earthAtmosphere,azimuth:i.earthAzimuth,elevation:i.earthElevation,spin:i.earthSpin}),m.jsx(zi,{anchorRef:t,config:e}),m.jsx(ma,{anchorRef:t,config:a})]})}export{$r as default};
