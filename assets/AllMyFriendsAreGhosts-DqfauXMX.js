import{C as z,Y as Ce,B as Rt,bb as je,aS as wt,m as he,l as Lt,V as S,r as s,az as ge,b1 as Ue,a as A,j as m,bK as j,f as se,b as Le,S as le,H as Ie,a5 as Qt,aw as ot,bu as Jt,a4 as eo,as as to,at as oo,bV as ro,d as _e,u as Mt,cn as Dt,U as Ke,g as ao,aC as rt,Z as Tt,Q as Wt,a3 as io,n as Me,E as so,am as C,ad as no}from"./index-DH_6Yz05.js";import{u as lo}from"./useSceneBackdrop-CFGWRqTi.js";import{u as co,g as uo,C as fo}from"./useSceneCameraControls-DD5OznxH.js";import"./cameraSplinePresets-BKsgNyGF.js";import"./useOperatorInput-Clxn6Bij.js";import{u as mo,g as ho,L as go}from"./useSceneLightingControls-BJd341Gi.js";import{u as y,E as P,a3 as po,au as So,aT as vo,aV as yo,w as Ge,c as Oe,r as X,j as G,k as Be,m as He,a0 as bo,aK as Co,am as Pt,aG as ko,W as xo,aJ as Ro,aA as wo,h as Lo,Y as Mo,b as oe,bC as at,bg as Ft}from"./three.tsl-Cj1j9JOf.js";import{u as U}from"./Texture-C_B6Z4zc.js";import{S as it,B as Do}from"./GhostCharacter-Dxe13Wwp.js";import{k as To,l as Wo,S as Po,L as Fo,W as Eo,a as Ao,g as zo,h as Io,i as _o,j as Go,b as Oo,c as Bo,d as Ho,B as No}from"./SkyMesh-BkS3cvkb.js";import{v as Vo,m as jo}from"./noise2d-BbYyysCU.js";import{M as Uo}from"./Moon-iH4XaliU.js";import{u as Ko,r as Yo,a as Ye,b as Xe,W as Xo,D as $o}from"./controls-9EwKrFVh.js";import{B as Zo}from"./Boeing737-Ca3TEqA8.js";import{L as qo}from"./Lightning-DHZfgnCM.js";import{u as Qo}from"./usePresetsFolder-d3msgvLf.js";import{u as Jo}from"./useMediaRecorder-B311GPWc.js";import"./useCameraSpline-Ds25cenA.js";import"./OrthographicCamera-D9f4vySn.js";import"./extends-CF3RwP-h.js";import"./Fbo-Cd1f3-XM.js";import"./PerspectiveCamera-DSlnHCDv.js";import"./OrbitControls-CvMYhNmr.js";import"./Line-B7R817JG.js";import"./Line2-Dm3F1enc.js";import"./constants-BPYcHpNj.js";import"./math-C0Z1meOP.js";import"./Outline-CFXCLYAY.js";import"./pinHelpers-BpCVQWZj.js";import"./inkBleed-CeSan-nx.js";import"./Gltf-D8JlY6Kw.js";import"./BufferGeometryUtils-jbnjVILM.js";import"./BufferGeometryUtils-CdhRGbJL.js";import"./lightningUtils-C3Z3JKkr.js";import"./Html-DX8DgLzw.js";import"./isMobileDevice-De1yZKQi.js";const pe=16e3,st=.0045,Q=28,De=.04;function er(e){const t={brightness:y(1),tint:y(new z)},r=new Ce({depthWrite:!1,fog:!1,side:Rt,toneMapped:!1});return r.colorNode=P(e).rgb.mul(t.tint).mul(t.brightness),{material:r,uniforms:t}}function tr(e){const t={atmosphere:y(new z)},r=new je({fog:!1,metalness:0,roughness:.85});r.colorNode=P(e).rgb;const o=new Ce({blending:wt,depthWrite:!1,fog:!1,side:Rt,transparent:!0}),a=po(So(vo,yo).abs().oneMinus(),3);return o.colorNode=t.atmosphere.mul(a),{atmosphere:o,surface:r,uniforms:t}}function or(e,t){const r={displacement:y(0)},o=new je({bumpMap:t,map:e,metalness:0}),a=P(t).r.sub(.5);return o.positionNode=ko.add(Pt.mul(a.mul(r.displacement))),{material:o,uniforms:r}}function rr(){const e={coverage:y(.5),horizonColor:y(new z),litColor:y(new z),scroll:y(0),shadeColor:y(new z),softness:y(.1),sunDir:y(new he(0,1)),sunHeight:y(.3)},t=Ge.xz.add(Be(0,e.scroll)).mul(st),r=e.scroll.mul(st*.03),o=X(G(t,r),4,2.1,.5),a=X(G(t.add(e.sunDir.mul(.08)),r),4,2.1,.5),i=Oe(e.coverage.sub(e.softness),e.coverage.add(e.softness),o.mul(.5).add(.5)),n=xo(o.sub(a).mul(3).add(.55),0,1).mul(e.sunHeight.mul(.6).add(.4)),l=Ge.xz.sub(Ro.xz).length(),f=Oe(pe*.08,pe*.45,l),u=new Ce({depthWrite:!1,side:Lt,transparent:!0});return u.colorNode=He(He(e.shadeColor,e.litColor,n),e.horizonColor,f),u.opacityNode=i.mul(f.oneMinus().mul(.85).add(.15)),{material:u,uniforms:e}}function ar(){const e={color:y(new z),flash:y(0),opacity:y(.3),phase:y(0),velocity:y(new S)},t=wo("dropOffset","vec4"),r=t.xyz.add(e.velocity.mul(e.phase)),o=r.sub(Lo(r.div(Q)).mul(Q)).sub(Q/2),a=new Ce({blending:wt,depthWrite:!1,side:Lt,transparent:!0});return a.positionNode=Mo.add(o),a.colorNode=G(e.color).mul(e.flash.mul(4).add(1)),a.opacityNode=e.opacity.mul(t.w.mul(.6).add(.4)),{material:a,uniforms:e}}function ir(){const e={dark:y(new z),grain:y(.4),light:y(new z)},t=Ge.xz,r=Oe(-.6,.6,X(G(t.mul(.03),0),4).add(X(G(t.mul(.6),1.7),2).mul(.35))),o=t.mul(3.1),a=X(G(o,0),3),i=X(G(o.add(Be(De,0)),0),3),n=X(G(o.add(Be(0,De)),0),3),l=G(i.sub(a),0,n.sub(a)).div(De).mul(e.grain),f=new je({metalness:0,roughness:.97});return f.colorNode=He(e.dark,e.light,r),f.normalNode=bo(Co(Pt.sub(l))),{material:f,uniforms:e}}const nt=Math.PI/180;function $e(e,t){const r=e*nt,o=t*nt,a=Math.cos(o);return new S(Math.sin(r)*a,Math.sin(o),Math.cos(r)*a)}const Et=j("solar-system/earth_daymap.jpg"),lt=4e3,sr=.41,nr=Math.PI/180;U.preload(Et);function lr({angularSize:e,atmosphereColor:t,azimuth:r,elevation:o,spin:a}){const i=U(Et),n=s.useRef(null);s.useEffect(()=>{i.colorSpace=ge,i.anisotropy=4,i.needsUpdate=!0},[i]);const l=s.useMemo(()=>new Ue(1,96,48),[]),{atmosphere:f,surface:u,uniforms:c}=s.useMemo(()=>tr(i),[i]);s.useEffect(()=>{c.atmosphere.value.set(t)},[t,c]),s.useEffect(()=>()=>l.dispose(),[l]),s.useEffect(()=>()=>{u.dispose(),f.dispose()},[f,u]);const d=s.useMemo(()=>$e(r,o).multiplyScalar(lt),[r,o]),g=lt*Math.tan(e*nr/2);return A((h,p)=>{n.current&&(n.current.rotation.y+=p*a)}),m.jsxs("group",{position:d,scale:g,children:[m.jsx("group",{"rotation-z":sr,children:m.jsx("mesh",{ref:n,geometry:l,material:u})}),m.jsx("mesh",{geometry:l,material:f,scale:1.06})]})}const cr=s.memo(lr),ur={alphaScale:4,alphaSeed:42,clothHeight:1,clothWidth:1,cursorCollider:!1,cutoutRimColor:"#000000",cutoutRimOffset:0,cutoutRimWidth:.003,dampening:.99,edgeFade:.15,emissiveCenterU:.5,emissiveCenterV:.4,emissiveFalloff:2.5,envMapIntensity:1,gravity:12e-5,handHeight:.3,handSize:.05,handSpacing:.3,handSpring:8,handTrail:.08,holeAmount:0,innerColor:"#cc2222",innerMetalness:0,innerRoughness:.8,maxVelocity:.01,metalness:0,roughness:.8,smoothEdges:!1,squashIntensity:.3,stiffness:.16,swayAmplitude:.02,tatterEdge:0,windAmplitude:4e-4},ce=Math.PI/180;function fr(e){return .5*Math.sin(e*1.3+.4)+.3*Math.sin(e*3.7+2.1)+.2*Math.sin(e*9.1+4.6)}function mr({anchorRef:e,config:t}){const r=s.useRef(null),o=s.useRef({animation:null,expressionKey:0,jumpTriggered:!1,windDirX:0,windDirZ:0,windStrength:0}),a=s.useRef(0),{ghostPosition:i,ghostRotationY:n,ghostScale:l,ghostTiltBack:f,ghostWindAngle:u,ghostWindGust:c,ghostWindStrength:d}=t,g=s.useMemo(()=>[i.x,i.y,i.z],[i.x,i.y,i.z]);return A((h,p)=>{a.current+=p;const v=r.current,w=e.current;v&&w&&(v.position.copy(w.position),v.quaternion.copy(w.quaternion));const R=u*ce,k=n*ce,b=Math.sin(R),x=Math.cos(R),D=Math.cos(k),_=Math.sin(k),F=1+c*fr(a.current),K=o.current;K.windDirX=b*D-x*_,K.windDirZ=b*_+x*D,K.windStrength=Math.max(0,d*F)}),m.jsx("group",{ref:r,children:m.jsx("group",{position:g,"rotation-y":n*ce,scale:l,children:m.jsx("group",{"position-y":it,"rotation-x":-f*ce,children:m.jsx("group",{"position-y":-it,children:m.jsx(Do,{...ur,animationInputRef:o,baseWind:t.ghostBaseWind,bobAmplitude:t.ghostBobAmplitude,bobSpeed:t.ghostBobSpeed,color:t.ghostColor,eyeColor:t.ghostEyeColor,eyeIntensity:t.ghostEyeIntensity,groundLightColor:t.ghostGlowColor,groundLightIntensity:t.ghostGroundLightIntensity,innerEmissiveColor:t.ghostGlowColor,innerEmissiveIntensity:t.ghostInnerGlow,outerEmissiveColor:t.ghostGlowColor,outerEmissiveIntensity:t.ghostOuterGlow,segmentsX:t.ghostClothSegments,segmentsY:t.ghostClothSegments,tiltIntensity:t.ghostTilt,windBoostMul:t.ghostWindBoost})})})})})}const dr=s.memo(mr);function O(e,t){const r=JSON.stringify(t.map(o=>e[o]));return s.useMemo(()=>Object.fromEntries(t.map(o=>[o,e[o]])),[r])}const Ze="blackHole",Se="ocean",ve="wing",qe="tinyMoon",Qe="lunarSurface",Je="campfire",hr={"Black Hole":Ze,Ocean:Se,"Plane Wing":ve,"Tiny Moon":qe,"Lunar Surface":Qe,Campfire:Je};function gr({config:e}){return m.jsxs(m.Fragment,{children:[m.jsx(To,{config:e}),e.blackHoleLightEnabled&&m.jsx(Wo,{color:e.blackHoleLightColor,config:e,intensity:e.blackHoleLightIntensity,vividness:e.blackHoleLightVividness},e.blackHoleVariant)]})}const pr=s.memo(gr),E=Math.fround,M=Math.PI,ae=1.618,At=new S(1,.18,.035).multiplyScalar(.5/(.2*.2*.5)),Sr=new S(.2,.5,1).multiplyScalar(.005),vr=new S(.05,0,.02),B=vr.clone().add(new S(0,-.1,0)),yr=new S(1,.075,.01),br=new S(.2,.15,.05),Cr=.73,ke=[[.2,.1,0,ae*M,.5*M,.1,.4],[0,.23,0,2*ae*M,.41*M,.08,.6],[.25,.21,.1,-ae*M,.28*M,.07,.25],[0,.33,-.1,-4.05*ae*M,.325*M,.06,.55],[.23,.43,.12,0,.2*M,.06,.5],[.19,.43,.35,.5*M,.2*M,.08,.49],[-.05,.55,.26,.8*M,.15*M,.05,.61]].map(([e,t,r,o,a,i,n])=>{const l=(g,h,p)=>[Math.cos(p)*g+Math.sin(p)*h,Math.cos(p)*h-Math.sin(p)*g],[f,u]=l(0,1,-a),[c,d]=l(f,0,-o);return{burnDir:new S(c,u,d),center:new S(e,t,r),length:n,radius:i,rotY:o,rotZ:a}}),ct=e=>E(e-Math.floor(e)),$=e=>Math.min(1,Math.max(0,e)),kr=(e,t,r)=>$((r-e)/(t-e)),xr=(e,t,r)=>{const o=$((r-e)/(t-e));return o*o*(3-2*o)};function Rr(e){let t=ct(E(E(e)*E(.1031)));return t=E(t*E(t+E(33.33))),t=E(t*E(t+t)),ct(t)}const zt=ke.map((e,t)=>E(E(ae)*t)),It=zt.map(e=>Rr(E(e*E(657.9759)))*.2),wr="cycle",Ne="hold",Ve="burnDown",_t=1-80/60;function Lr(e){const t=1.3333333333333333,r=t*1.05,o=e/60,a=o-r*Math.floor(o/r);return Math.min(1,1-a+Math.max(0,(a-t)*30))}function Gt({burnSeconds:e,hold:t,mode:r,startTime:o,time:a}){if(r===Ne)return t;if(r===Ve){const i=Math.min(1,Math.max(0,(a-o)/e));return 1+(_t-1)*i}return Lr(a)}function Ot(e,t,r,o){const a=Math.min(1,Math.max(-1,e.dot(t))),i=Math.acos(Math.min(1,Math.max(-1,r))),n=2*M*(1-Math.cos(i+o*.5*M)),l=2*M*(1-r),f=Math.max(1e-5,l)/Math.max(1e-5,n);let u=Math.max(0,kr(i+.01+o*M*.5,i-.01-o*M*.5,Math.acos(a)))*2;const c=7-6*o;return u=u**c/Math.max(1e-5,1/(c+1)),Math.min(1,u*f)}const Te=new S,ut=new S;function Mr(e,t,r,o,a){Te.subVectors(o,e);const i=Te.length(),n=i*i,l=a*a,f=1/Math.max(.001,i)*Math.max(.001,n-l),u=a/i*Math.sqrt(Math.max(.001,n-l)),c=Math.min(1,Math.max(-1,f/Math.hypot(f,u)));ut.copy(Te).divideScalar(i);let d=Ot(t,ut,c,r);return i<a&&(d=se.lerp(1,d,i/a)),d}const H=new S,We=new S,Pe=new S,et=new S;function Dr(e,t,r,o,a){const i=ke[e],n=zt[e],l=r-It[e];H.copy(i.center).addScaledVector(i.burnDir,($(l)*2-1)*i.length);const f=Math.sqrt(Math.max(1e-4,l)),u=Math.max(.15,.2+l*1.2)*.65,c=(.1+f)*.2*.75;H.y=Math.max(H.y,c+.05);const d=Math.max(.075,c);We.copy(H).setY(H.y+u),Pe.subVectors(We,H);const g=$(et.subVectors(o,H).dot(Pe)/Pe.lengthSq()),h=a;return h.center.lerpVectors(H,We,g),h.radius=se.lerp(d,.01,g),h.strength=Math.sqrt($(l+.1))*(1+Math.sin(n*2-10*t)*.35+Math.sin(n*4-15*t)*.25),h}const ye=new S,be=new S,ft=new S,Fe=new S;function Tr(e,t,r,o,a){const i=t.y===0?1e-4:t.y;ye.copy(e).addScaledVector(t,-(e.y-B.y)/i),be.subVectors(ye,B),ft.copy(be).normalize().multiplyScalar(Cr).add(B),Fe.subVectors(B,e).normalize();const n=et.subVectors(ft,e).normalize().dot(Fe),l=.1*$(10*(o*.75+.25))*Ot(t,Fe,n,r);return a.copy(yr).multiplyScalar(l)}function mt(e,t,r,o,a){const i=t.y===0?1e-4:t.y;ye.copy(e).addScaledVector(t,-(e.y-B.y)/i),be.subVectors(ye,B);const n=et.copy(Sr).divideScalar(1+.03*e.lengthSq()),l=a.copy(br).multiply(At).multiplyScalar($(o+.05)*.05/(r+1+be.lengthSq())),f=xr(.001+r*1.5,-.001-r*1.5,t.y);return l.lerp(n,1-f)}const de=At,Wr=ke.length,V=e=>e.toFixed(8),dt=e=>`vec3f(${V(e.x)}, ${V(e.y)}, ${V(e.z)})`,Pr=ke.map((e,t)=>`case ${t}u: { return CampfireLog(${dt(e.center)}, ${dt(e.burnDir)}, ${V(e.rotY)}, ${V(e.rotZ)}, ${V(e.radius)}, ${V(e.length)}, ${V(It[t])}); }`).join(`
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
    ${Pr}
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
`,Fr=`
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
`,Er=`
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
${Fr}
${Bt}
`,Ar=`
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
`,zr=Ft(Er),Ir=Ft(Ar),ht={depthBuffer:!1,generateMipmaps:!0,magFilter:eo,minFilter:Jt,type:Ie,wrapS:ot,wrapT:ot},ue=new he;function Ee(e){const t=new oo;return t.colorNode=e,t.blending=ro,t.depthTest=!1,t.depthWrite=!1,t.transparent=!0,t.toneMapped=!1,t}function _r({noise:e,rock:t,sky:r}){const o={bufferResolution:y(new he(1,1)),cameraPos:y(new S),cameraWorld:y(new Le),fireLife:y(1),fireOffset:y(new S),frame:y(0),outputResolution:y(new he(1,1)),pixelCone:y(.001),prevViewProjection:y(new Le),projectionInverse:y(new Le),time:y(0),timeDelta:y(.016666666666666666)},a=new le(1,1,{depthTexture:new Qt(1,1),type:Ie}),i=[new le(1,1,ht),new le(1,1,ht)],n=P(i[0].texture),l=P(i[0].texture),f=P(i[1].texture),u=P(i[1].texture),c=Ee(zr({fragUv:oe,resolution:o.bufferResolution,time:o.time,timeDelta:o.timeDelta,fireLife:o.fireLife,frame:o.frame,pixelCone:o.pixelCone,cameraPos:o.cameraPos,cameraWorld:o.cameraWorld,projectionInverse:o.projectionInverse,prevViewProjection:o.prevViewProjection,fireOffset:o.fireOffset,ghostColor:P(a.texture,oe),ghostDepth:P(a.depthTexture,oe).x,history:n,historySampler:l,ch1:P(e),s1:P(e),ch2:P(t),s2:P(t),ch3:at(r),s3:at(r)})),d=Ee(Ir({fragUv:oe,outputResolution:o.outputResolution,bufferResolution:o.bufferResolution,frame:o.frame,bufferA:f,bufferSampler:u})),g=new le(1,1,{depthBuffer:!1,type:Ie}),h=Ee(P(g.texture,oe)),p=new to(c);let v=1;function w(R,k){R.getDrawingBufferSize(ue);const b=Math.max(1,Math.round(Math.min(ue.y,k))),x=Math.max(1,Math.round(b*ue.x/ue.y));o.bufferResolution.value.x===x&&o.bufferResolution.value.y===b||(o.bufferResolution.value.set(x,b),o.outputResolution.value.set(x,b),a.setSize(x,b),g.setSize(x,b),i.forEach(D=>D.setSize(x,b)))}return{uniforms:o,render({camera:R,delta:k,fireLife:b,fireOffset:x,outputTarget:D=null,height:_,renderer:F,scene:K,time:Z}){w(F,_),R.updateMatrixWorld(),o.time.value=Z,o.fireLife.value=b,o.timeDelta.value=Math.max(k,1e-4),o.frame.value=(o.frame.value+1)%256,o.cameraPos.value.setFromMatrixPosition(R.matrixWorld),o.cameraWorld.value.copy(R.matrixWorld),o.projectionInverse.value.copy(R.projectionMatrixInverse),o.pixelCone.value=Math.tan(se.degToRad(R.fov)/2)/o.bufferResolution.value.y,o.fireOffset.value.copy(x),F.setRenderTarget(a),F.render(K,R);const te=i[v],ne=i[1-v];n.value=ne.texture,l.value=ne.texture,p.material=c,F.setRenderTarget(te),p.render(F),f.value=te.texture,u.value=te.texture,p.material=d,F.setRenderTarget(g),p.render(F),p.material=h,F.setRenderTarget(D),p.render(F),o.prevViewProjection.value.multiplyMatrices(R.projectionMatrix,R.matrixWorldInverse),v=1-v},dispose(){a.dispose(),g.dispose(),h.dispose(),i.forEach(R=>R.dispose()),c.dispose(),d.dispose(),p.geometry?.dispose()}}}const gt=Array.from({length:Wr},(e,t)=>t),Ht=Math.max(de.x,de.y,de.z),Gr=de.clone().divideScalar(Ht),Or=new z(1,.075,.01),Br=new S(0,-1,0),Hr=new S(0,1,0),pt=new S(-1,1,1);function Nr({burnRef:e,fireOffset:t,ghostCentre:r,strength:o}){const a=s.useRef([]),i=s.useRef(null),n=s.useRef(null),l=s.useMemo(()=>({centre:new S,dir:new S,light:{center:new S,radius:0,strength:0},term:new S,world:new S}),[]),f=(c,d)=>d.copy(c).sub(t).multiply(pt),u=(c,d)=>d.copy(c).multiply(pt).add(t);return A(({clock:c})=>{const d=c.elapsedTime,g=Gt({...e.current,time:d}),h=f(r,l.centre);if(gt.forEach(p=>{const v=a.current[p];if(!v)return;const w=Dr(p,d,g,h,l.light);l.dir.subVectors(w.center,h);const R=l.dir.length();l.dir.divideScalar(R);const k=Mr(h,l.dir,1,w.center,w.radius);u(w.center,v.position),v.intensity=Math.PI*R*R*k*w.strength*Ht*o}),i.current){l.dir.subVectors(B,h).setY(0).normalize();const p=Tr(h,l.dir,1,g,l.term).x,v=h.distanceTo(B);u(B,i.current.position),i.current.intensity=Math.PI*v*v*p*o}n.current&&(mt(h,Br,1,g,l.term),n.current.groundColor.setRGB(l.term.x*Math.PI*o,l.term.y*Math.PI*o,l.term.z*Math.PI*o),mt(h,Hr,1,g,l.term),n.current.color.setRGB(l.term.x*Math.PI*o,l.term.y*Math.PI*o,l.term.z*Math.PI*o))}),m.jsxs(m.Fragment,{children:[gt.map(c=>m.jsx("pointLight",{ref:d=>{a.current[c]=d},color:Gr.toArray(),decay:2,distance:0,intensity:0},c)),m.jsx("pointLight",{ref:i,color:Or,decay:2,distance:0,intensity:0}),m.jsx("hemisphereLight",{ref:n,intensity:1})]})}const Vr=s.memo(Nr),Nt={noise:j("campfire/noise.jpg"),rock:j("campfire/rock.jpg")},Vt=[0,1,2,3,4,5].map(e=>j(`campfire/sky_${e}.png`));U.preload(Object.values(Nt));Mt.preload(Dt,[Vt]);function St(e){const t=e;t.wrapS=rt,t.wrapT=rt,t.colorSpace=Ke,t.flipY=!0,t.needsUpdate=!0}function jr({config:e}){const t=_e(c=>c.gl),r=_e(c=>c.clock),o=s.useRef({burnSeconds:80,hold:1,mode:"cycle",startTime:0}),{noise:a,rock:i}=U(Nt),[n]=Mt(Dt,[Vt]),l=s.useMemo(()=>{St(a),St(i);const c=n;return c.colorSpace=Ke,c.needsUpdate=!0,_r({noise:a,rock:i,sky:n})},[a,i,n]);s.useEffect(()=>()=>l.dispose(),[l]),s.useEffect(()=>{const c=t.toneMapping;return t.toneMapping=ao,()=>{t.toneMapping=c}},[t]);const f=s.useMemo(()=>new S(e.campfirePosition.x,e.campfirePosition.y,e.campfirePosition.z),[e.campfirePosition]),u=s.useMemo(()=>new S(e.ghostPosition.x,e.ghostPosition.y-.35*e.ghostScale,e.ghostPosition.z),[e.ghostPosition,e.ghostScale]);return s.useEffect(()=>{o.current.startTime=r.elapsedTime},[r,e.campfireBurnMode,e.campfireBurnSeconds]),s.useEffect(()=>{const c=o.current;c.mode=e.campfireBurnMode,c.hold=e.campfireFireLife,c.burnSeconds=e.campfireBurnSeconds},[e.campfireBurnMode,e.campfireBurnSeconds,e.campfireFireLife]),A((c,d)=>{l.render({camera:c.camera,delta:d,fireLife:Gt({...o.current,time:c.clock.elapsedTime}),fireOffset:f,renderer:c.gl,height:e.campfireResolution,scene:c.scene,time:c.clock.elapsedTime})},2),m.jsx(Vr,{burnRef:o,fireOffset:f,ghostCentre:u,strength:e.campfireGhostLight})}const Ur=s.memo(jr);function Kr(e,t,r){const o=e<1?(e*e-1)*t:0,a=r*Math.exp(-(((e-1)/.28)**2));return o+a}function Yr({clearRadius:e,craterCount:t,curvatureRadius:r,maxCraterRadius:o,roughness:a,seed:i,segments:n,size:l}){const f=jo(i),u=(k,b)=>Vo(k,b,i)-.5,c=new Tt(l,l,n,n);c.rotateX(-Math.PI/2);const{position:d}=c.attributes,{count:g}=d,h=new Float32Array(g),p=n+1,v=l/n,w=l/2;for(let k=0;k<g;k+=1){const b=d.getX(k),x=d.getZ(k);h[k]=a*(2.2*u(b/48,x/48)+.9*u(b/17,x/17)+.3*u(b/6,x/6))-(b*b+x*x)/(2*r)}for(let k=0;k<t;k+=1){const b=1.2+(o-1.2)*f()**3.2,x=(f()-.5)*l,D=(f()-.5)*l,_=b*(.16+f()*.08),F=b*(.04+f()*.04),K=Math.hypot(x,D)>=b+e,Z=b*1.8,te=Math.max(0,Math.floor((x-Z+w)/v)),ne=Math.min(n,Math.ceil((x+Z+w)/v)),Zt=Math.max(0,Math.floor((D-Z+w)/v)),qt=Math.min(n,Math.ceil((D+Z+w)/v));for(let xe=Zt;xe<=qt;xe+=1)for(let Re=te;Re<=ne;Re+=1){const we=xe*p+Re,tt=Math.hypot(d.getX(we)-x,d.getZ(we)-D)/b;K&&tt<1.8&&(h[we]+=Kr(tt,_,F))}}const R=h[Math.floor(n/2)*p+Math.floor(n/2)];for(let k=0;k<g;k+=1)d.setY(k,h[k]-R);return c.computeVertexNormals(),c}function Xr({config:e}){const{lunarCraterCount:t,lunarCurvature:r,lunarDarkColor:o,lunarGrain:a,lunarLightColor:i,lunarMaxCrater:n,lunarRoughness:l,lunarSeed:f}=e,u=s.useMemo(()=>Yr({clearRadius:4,craterCount:t,curvatureRadius:r,maxCraterRadius:n,roughness:l,seed:f,segments:384,size:420}),[t,r,n,l,f]),{material:c,uniforms:d}=s.useMemo(()=>ir(),[]);return s.useEffect(()=>{d.dark.value.set(o),d.light.value.set(i),d.grain.value=a},[o,a,i,d]),s.useEffect(()=>()=>u.dispose(),[u]),s.useEffect(()=>()=>c.dispose(),[c]),m.jsx("mesh",{geometry:u,material:c,receiveShadow:!0})}const $r=s.memo(Xr),vt=4e3,Zr=Math.PI/180,yt=new S(0,1,0);function qr(e,t,r,o){return{buoyancy:{modeCount:160},foam:{foamStrength:e.oceanFoamStrength,foamThreshold:e.oceanFoamThreshold},ocean:{lodScale:e.oceanLodScale,patchResolution:e.oceanPatchResolution,patchSize:e.oceanPatchSize,wireframe:!1},oceanColors:o,performance:{pauseWater:!1,quality:e.oceanQuality,waveUpdateHz:30},sky:{azimuth:t,elevation:r,exposure:e.oceanExposure,mieCoefficient:e.oceanSkyMie,mieDirectionalG:.7,rayleigh:e.oceanSkyRayleigh,turbidity:e.oceanSkyTurbidity,up:[0,1,0],visible:e.oceanSkyVisible},waveSettings:Yo(e,"oceanFirst_","oceanSecond_")}}function Qr({anchorRef:e,config:t,sunAzimuth:r,sunElevation:o}){const a=s.useMemo(()=>t.oceanCustomColors?{fadeColor:t.oceanFadeColor,foamColor:t.oceanFoamColor,horizonColor:t.oceanHorizonColor,seaColor:t.oceanSeaColor,skyColor:t.oceanReflectColor,specularColor:t.oceanSpecularColor,specularStrength:t.oceanSpecularStrength,sunColor:t.oceanSpecularColor,waveColor:t.oceanWaveColor}:void 0,[t.oceanCustomColors,t.oceanFadeColor,t.oceanFoamColor,t.oceanHorizonColor,t.oceanReflectColor,t.oceanSeaColor,t.oceanSpecularColor,t.oceanSpecularStrength,t.oceanWaveColor]),i=qr(t,r,o,a),{sampler:n}=Ko(i),l=s.useMemo(()=>new S,[]),f=s.useMemo(()=>new S,[]),u=s.useMemo(()=>new Wt,[]),c=s.useRef(0);s.useEffect(()=>{const h=e.current;return()=>{h.position.set(0,0,0),h.quaternion.identity()}},[e]),A((h,p)=>{const v=e.current;if(!n||!v)return;const w=t.oceanGhostRide,R=n.sampleSurfaceHeight(0,0,l)*w,k=1-Math.exp(-p*t.oceanGhostFollow);c.current+=(R-c.current)*k,v.position.set(0,c.current,0),n.sampleNormal(0,0,f,1.2),f.lerp(yt,1-w*t.oceanGhostRock).normalize(),u.setFromUnitVectors(yt,f),v.quaternion.slerp(u,k)});const d=s.useMemo(()=>$e(r,o).multiplyScalar(vt),[r,o]),g=vt*Math.tan(t.oceanMoonSize*Zr/2);return t.oceanMoonVisible?m.jsx(Uo,{emissive:t.oceanMoonColor,emissiveIntensity:t.oceanMoonGlow,emissiveUsesTexture:!0,fog:!1,position:d,radius:g,segments:48}):null}const Jr=s.memo(Qr),jt={bump:j("solar-system/moonbump.jpg"),map:j("solar-system/moonmap.jpg")};U.preload(Object.values(jt));function ea({config:e}){const{bump:t,map:r}=U(jt),o=e.tinyMoonRadius;s.useEffect(()=>{r.colorSpace=ge,r.anisotropy=8,r.needsUpdate=!0,t.colorSpace=Ke,t.needsUpdate=!0},[t,r]);const a=s.useMemo(()=>new Ue(1,384,192),[]),{material:i,uniforms:n}=s.useMemo(()=>or(r,t),[t,r]);return s.useEffect(()=>{i.bumpScale=e.tinyMoonBump,i.roughness=e.tinyMoonRoughness,i.color.set(e.tinyMoonTint),n.displacement.value=e.tinyMoonDisplacement/o},[e.tinyMoonBump,e.tinyMoonDisplacement,e.tinyMoonRoughness,e.tinyMoonTint,i,o,n]),s.useEffect(()=>()=>a.dispose(),[a]),s.useEffect(()=>()=>i.dispose(),[i]),m.jsx("mesh",{geometry:a,material:i,"position-y":-o,receiveShadow:!0,"rotation-z":Math.PI/2,scale:o})}const ta=s.memo(ea);function oa({airspeed:e,coverage:t,height:r,horizonColor:o,litColor:a,shadeColor:i,softness:n,sunAzimuth:l,sunElevation:f}){const u=s.useMemo(()=>new Tt(pe,pe).rotateX(-Math.PI/2),[]),{material:c,uniforms:d}=s.useMemo(()=>rr(),[]);return s.useEffect(()=>{const g=se.degToRad(l),h=se.degToRad(f);d.coverage.value=t,d.softness.value=n,d.litColor.value.set(a),d.shadeColor.value.set(i),d.horizonColor.value.set(o),d.sunDir.value.set(Math.sin(g),Math.cos(g)),d.sunHeight.value=Math.max(0,Math.sin(h))},[t,o,a,i,n,l,f,d]),s.useEffect(()=>()=>u.dispose(),[u]),s.useEffect(()=>()=>c.dispose(),[c]),A((g,h)=>{d.scroll.value+=h*e}),m.jsx("mesh",{frustumCulled:!1,geometry:u,material:c,"position-y":r,renderOrder:-5})}const ra=s.memo(oa),aa=9e3;function ia({mie:e,rayleigh:t,sunAzimuth:r,sunElevation:o,turbidity:a}){const i=s.useMemo(()=>{const n=new Po;return n.scale.setScalar(aa),n.frustumCulled=!1,n.material.depthWrite=!1,n.cloudCoverage.value=0,n},[]);return s.useEffect(()=>{i.turbidity.value=a,i.rayleigh.value=t,i.mieCoefficient.value=e,i.mieDirectionalG.value=.8,i.sunPosition.value.copy($e(r,o))},[e,t,i,r,o,a]),s.useEffect(()=>()=>{i.geometry.dispose(),i.material.dispose()},[i]),A(({camera:n})=>{i.position.copy(n.position)}),m.jsx("primitive",{object:i,renderOrder:-10})}const sa=s.memo(ia),na=.012;function la(e,t,r){const o=r.clone().normalize(),a=new S(1,0,0);Math.abs(o.dot(a))>.9&&a.set(0,0,1);const i=a.clone().cross(o).normalize(),n=i.clone().cross(o).normalize(),l=o.clone().multiplyScalar(t/2),f=new Float32Array(e*8*3),u=new Float32Array(e*8*4),c=new Uint32Array(e*12),d=new S;for(let h=0;h<e;h+=1){const p=Math.random()*Q,v=Math.random()*Q,w=Math.random()*Q,R=Math.random();[i,n].forEach((k,b)=>{for(let D=0;D<4;D+=1){const _=h*8+b*4+D;d.copy(k).multiplyScalar((D%2===0?-1:1)*na).addScaledVector(l,D<2?-1:1),f.set([d.x,d.y,d.z],_*3),u.set([p,v,w,R],_*4)}const x=h*8+b*4;c.set([x,x+1,x+2,x+2,x+1,x+3],h*12+b*6)})}const g=new io;return g.setAttribute("position",new Me(f,3)),g.setAttribute("dropOffset",new Me(u,4)),g.setIndex(new Me(c,1)),g}function ca({airspeed:e,color:t,count:r,fall:o,flashRef:a,length:i,opacity:n}){const l=s.useMemo(()=>new S(0,-o,-e),[e,o]),f=s.useMemo(()=>la(r,i,l),[r,i,l]),{material:u,uniforms:c}=s.useMemo(()=>ar(),[]);return s.useEffect(()=>{c.color.value.set(t),c.opacity.value=n,c.velocity.value.copy(l)},[t,n,c,l]),s.useEffect(()=>()=>f.dispose(),[f]),s.useEffect(()=>()=>u.dispose(),[u]),A((d,g)=>{c.phase.value=(c.phase.value+g)%1e3,c.flash.value=a.current}),m.jsx("mesh",{frustumCulled:!1,geometry:f,material:u})}const ua=s.memo(ca),fa={cameraShake:!1,cracks:!1,debris:!1,groundFlash:!1,overlay:!1,pointLight:!1,shockwave:!1,sparks:!1},bt={minX:300,maxX:650,minZ:-260,maxZ:60,targetY:-220,minHeight:260,maxHeight:420,sourceSpread:60,topJitter:40},ma={};function da(e){return .5+.25*Math.sin(e*61.3)+.15*Math.sin(e*23.1+1.7)+.1*Math.sin(e*97.7+.4)}function ha({backdropColor:e,color:t,flashRef:r,intensity:o,maxGap:a,minGap:i}){const n=_e(h=>h.scene),l=r,f=s.useRef(null),u=s.useRef(null),c=s.useRef({end:0,next:3,start:0}),d=s.useMemo(()=>new z,[]),g=s.useMemo(()=>new z,[]);return A(({clock:h})=>{const p=h.elapsedTime,v=c.current;p>=v.next&&(v.start=p,v.end=p+.5+Math.random()*.8,v.next=v.end+i+Math.random()*(a-i),u.current?.spawnRandomStrike());let w=0;if(p<v.end){const R=(p-v.start)/(v.end-v.start);w=Math.max(0,da(p))*(1-R)**1.5}l.current=w,f.current&&(f.current.intensity=w*o),n.background?.isColor&&(d.set(e),g.set(t),n.background.copy(d).lerp(g,w*.35))}),m.jsxs(m.Fragment,{children:[m.jsx("directionalLight",{ref:f,color:t,intensity:0,position:[400,300,100]}),m.jsx(qo,{apiRef:u,coreColor:"#e8f0ff",effects:fa,fallbackPlaneEnabled:!0,glowColor:"#7f9cff",groundPlaneY:bt.targetY,keyboardShortcuts:ma,mainFractalDepth:7,randomStrikeBounds:bt,strikeDuration:.25,thickness:2.2})]})}const ga=s.memo(ha),pa=[-9,-.43,4.6],Ct=new S(-9,.5,2.6),Sa=[14.3,.95,-6];function fe(e,t,r,o){return .55*Math.sin(e*t)+.3*Math.sin(e*r+1.3)+.15*Math.sin(e*o+2.9)}function va({color:e,intensity:t}){const r=s.useRef(null),o=s.useRef(null);return A(({clock:a})=>{const i=a.elapsedTime%1.6,n=i<.06||i>.18&&i<.24?1:0;r.current&&(r.current.intensity=n*t*6),o.current&&(o.current.visible=n===1)}),m.jsxs("group",{position:Sa,children:[m.jsx("pointLight",{color:e,decay:2,distance:30,intensity:t}),m.jsxs("mesh",{children:[m.jsx("sphereGeometry",{args:[.09,12,8]}),m.jsx("meshBasicMaterial",{color:e,toneMapped:!1})]}),m.jsx("pointLight",{ref:r,color:"#ffffff",decay:2,distance:40,intensity:0,position:[.2,0,-.3]}),m.jsxs("mesh",{ref:o,position:[.2,0,-.3],children:[m.jsx("sphereGeometry",{args:[.07,12,8]}),m.jsx("meshBasicMaterial",{color:"#ffffff",toneMapped:!1})]})]})}function ya({anchorRef:e,backdropColor:t,config:r,sunAzimuth:o,sunElevation:a}){const i=s.useRef(null),n=s.useRef(0),l=s.useRef(0),f=s.useMemo(()=>new so,[]),u=s.useMemo(()=>new S,[]);return s.useEffect(()=>{const c=e.current;return()=>{c.position.set(0,0,0),c.quaternion.identity()}},[e]),A((c,d)=>{l.current+=d*r.wingTurbulenceSpeed;const g=l.current,h=r.wingTurbulence,p=e.current;f.set(h*.025*fe(g,.9,2.3,5.1),h*.01*fe(g,.4,1.1,3.7),h*.05*fe(g,.7,1.9,4.3)),p.quaternion.setFromEuler(f),u.copy(Ct).negate().applyQuaternion(p.quaternion),p.position.copy(Ct).add(u).setY(p.position.y+h*.35*fe(g,1.3,3.1,7.3)),i.current?.position.copy(p.position),i.current?.quaternion.copy(p.quaternion)}),m.jsxs(m.Fragment,{children:[m.jsx("group",{ref:i,children:m.jsxs("group",{position:pa,children:[m.jsx(Zo,{}),r.wingLightsVisible&&m.jsx(va,{color:r.wingNavColor,intensity:r.wingNavIntensity})]})}),r.wingSkyVisible&&m.jsx(sa,{mie:r.wingSkyMie,rayleigh:r.wingSkyRayleigh,sunAzimuth:o,sunElevation:a,turbidity:r.wingSkyTurbidity}),r.wingCloudsVisible&&m.jsx(ra,{airspeed:r.wingAirspeed,coverage:r.wingCloudCoverage,height:r.wingCloudHeight,horizonColor:r.wingCloudHorizonColor,litColor:r.wingCloudLitColor,shadeColor:r.wingCloudShadeColor,softness:r.wingCloudSoftness,sunAzimuth:o,sunElevation:a}),r.wingStorm&&m.jsxs(m.Fragment,{children:[m.jsx(ua,{airspeed:r.wingAirspeed*.35,color:r.wingRainColor,count:r.wingRainCount,fall:9,flashRef:n,length:r.wingRainLength,opacity:r.wingRainOpacity}),m.jsx(ga,{backdropColor:t,color:r.wingFlashColor,flashRef:n,intensity:r.wingFlashIntensity,maxGap:r.wingFlashMaxGap,minGap:r.wingFlashMinGap})]})]})}const ba=s.memo(ya),re={collapsed:!0},Ca=["blackHoleVariant","blackHolePosition","metricWorldScale","blackHoleLightEnabled","blackHoleLightIntensity","blackHoleLightVividness","blackHoleLightColor",...Fo,...Eo,...Ao];function ka(e,t){return C({blackHoleVariant:{label:"Variation",value:e.blackHoleVariant,options:zo},blackHolePosition:{label:"Position",value:e.blackHolePosition,step:.5},metricWorldScale:{label:"Size",value:e.metricWorldScale,min:1,max:120,step:.5},Light:C({blackHoleLightEnabled:{label:"Lights Ghost",value:e.blackHoleLightEnabled},blackHoleLightIntensity:{label:"Intensity",value:e.blackHoleLightIntensity,min:0,max:20,step:.01},blackHoleLightVividness:{label:"Vividness",value:e.blackHoleLightVividness,min:0,max:1,step:.01},blackHoleLightColor:{label:"Color (non-chromatic disks)",value:e.blackHoleLightColor}},re),Legacy:C(Go(e,`${t}.Legacy`),re),WebGPU:C(_o(e),re),Singularity:C(Io(e),re)},re)}const xa=["campfirePosition","campfireBurnMode","campfireFireLife","campfireBurnSeconds","campfireResolution","campfireGhostLight","ghostPosition","ghostScale"];function Ra(e,t){return C({campfirePosition:{label:"Fire Position",value:e.campfirePosition,step:.05},campfireBurnMode:{label:"Burn",value:e.campfireBurnMode,options:{"Cycle (original)":wr,Hold:Ne,"Burn Down":Ve}},campfireFireLife:{label:"Hold Level (≤0 embers)",value:e.campfireFireLife,min:Math.floor(_t*100)/100,max:1,step:.01,render:r=>r(`${t}.campfireBurnMode`)===Ne},campfireBurnSeconds:{label:"Burn Down (s)",value:e.campfireBurnSeconds,min:10,max:1800,step:5,render:r=>r(`${t}.campfireBurnMode`)===Ve},campfireResolution:{label:"Render Height (px)",value:e.campfireResolution,min:240,max:1440,step:10},campfireGhostLight:{label:"Firelight On Ghost",value:e.campfireGhostLight,min:0,max:4,step:.01}},{collapsed:!0})}const Ut={collapsed:!0},wa=["tinyMoonRadius","tinyMoonDisplacement","tinyMoonBump","tinyMoonRoughness","tinyMoonTint"],La=["lunarSeed","lunarCraterCount","lunarMaxCrater","lunarRoughness","lunarCurvature","lunarGrain","lunarDarkColor","lunarLightColor"],I=(e,t,r,o,a)=>({label:e,value:t,min:r,max:o,step:a});function Ma(e){return C({tinyMoonRadius:I("Radius",e.tinyMoonRadius,.5,20,.1),tinyMoonDisplacement:I("Crater Depth",e.tinyMoonDisplacement,0,.5,.005),tinyMoonBump:I("Bump",e.tinyMoonBump,0,10,.05),tinyMoonRoughness:I("Roughness",e.tinyMoonRoughness,0,1,.01),tinyMoonTint:{label:"Tint",value:e.tinyMoonTint}},Ut)}function Da(e){return C({lunarSeed:I("Seed",e.lunarSeed,1,9999,1),lunarCraterCount:I("Craters",e.lunarCraterCount,0,1500,10),lunarMaxCrater:I("Largest Crater (m)",e.lunarMaxCrater,2,120,1),lunarRoughness:I("Undulation",e.lunarRoughness,0,4,.01),lunarCurvature:I("Horizon Curve (m)",e.lunarCurvature,200,5e3,10),lunarGrain:I("Regolith Grain",e.lunarGrain,0,2,.01),lunarDarkColor:{label:"Dark",value:e.lunarDarkColor},lunarLightColor:{label:"Light",value:e.lunarLightColor}},Ut)}const Y={collapsed:!0},Kt="oceanFirst_",Yt="oceanSecond_",Ta=["oceanQuality","oceanPatchSize","oceanPatchResolution","oceanLodScale","oceanFoamStrength","oceanFoamThreshold","oceanExposure","oceanSkyVisible","oceanSkyTurbidity","oceanSkyRayleigh","oceanSkyMie","oceanCustomColors","oceanSeaColor","oceanHorizonColor","oceanReflectColor","oceanWaveColor","oceanFadeColor","oceanSpecularColor","oceanFoamColor","oceanSpecularStrength","oceanMoonVisible","oceanMoonSize","oceanMoonColor","oceanMoonGlow","oceanGhostRide","oceanGhostRock","oceanGhostFollow"],Wa=[...Ta,...Object.keys(Ye({prefix:Kt})),...Object.keys(Xe({prefix:Yt}))],W=(e,t,r,o,a)=>({label:e,value:t,min:r,max:o,step:a});function Pa(e){return C({oceanQuality:{label:"Quality",value:e.oceanQuality,options:Object.keys(Xo)},oceanPatchSize:W("Patch Size",e.oceanPatchSize,100,4e3,10),oceanPatchResolution:W("Patch Resolution",e.oceanPatchResolution,64,768,1),oceanLodScale:W("LOD Scale",e.oceanLodScale,0,20,.1),oceanFoamStrength:W("Foam",e.oceanFoamStrength,0,5,.1),oceanFoamThreshold:W("Foam Threshold",e.oceanFoamThreshold,0,5,.1),Ghost:C({oceanGhostRide:W("Ride Swell",e.oceanGhostRide,0,1,.01),oceanGhostRock:W("Rock",e.oceanGhostRock,0,1,.01),oceanGhostFollow:W("Follow",e.oceanGhostFollow,.2,10,.1)},Y),Sky:C({oceanSkyVisible:{label:"Day Sky",value:e.oceanSkyVisible},oceanExposure:W("Exposure",e.oceanExposure,.05,2.5,.01),oceanSkyTurbidity:W("Turbidity",e.oceanSkyTurbidity,1,20,.1),oceanSkyRayleigh:W("Rayleigh",e.oceanSkyRayleigh,0,4,.01),oceanSkyMie:W("Mie",e.oceanSkyMie,0,.02,1e-4)},Y),Colors:C({oceanCustomColors:{label:"Custom",value:e.oceanCustomColors},oceanSeaColor:{label:"Deep Water",value:e.oceanSeaColor},oceanHorizonColor:{label:"Horizon",value:e.oceanHorizonColor},oceanReflectColor:{label:"Sky Reflect",value:e.oceanReflectColor},oceanWaveColor:{label:"Wave Crest",value:e.oceanWaveColor},oceanFadeColor:{label:"Distance",value:e.oceanFadeColor},oceanSpecularColor:{label:"Glint",value:e.oceanSpecularColor},oceanFoamColor:{label:"Foam",value:e.oceanFoamColor},oceanSpecularStrength:W("Glint Strength",e.oceanSpecularStrength,0,4,.01)},Y),Moon:C({oceanMoonVisible:{label:"Visible",value:e.oceanMoonVisible},oceanMoonSize:W("Size (°)",e.oceanMoonSize,.5,15,.1),oceanMoonColor:{label:"Color",value:e.oceanMoonColor},oceanMoonGlow:W("Glow",e.oceanMoonGlow,0,5,.01)},Y),"First Wave Spectrum":C(Ye({prefix:Kt,snapshot:e}),Y),"Second Wave Spectrum":C(Xe({prefix:Yt,snapshot:e}),Y)},Y)}const q={collapsed:!0},Fa=["wingStorm","wingAirspeed","wingTurbulence","wingTurbulenceSpeed","wingLightsVisible","wingNavColor","wingNavIntensity","wingSkyVisible","wingSkyTurbidity","wingSkyRayleigh","wingSkyMie","wingCloudsVisible","wingCloudHeight","wingCloudCoverage","wingCloudSoftness","wingCloudLitColor","wingCloudShadeColor","wingCloudHorizonColor","wingRainCount","wingRainLength","wingRainOpacity","wingRainColor","wingFlashColor","wingFlashIntensity","wingFlashMinGap","wingFlashMaxGap"],T=(e,t,r,o,a)=>({label:e,value:t,min:r,max:o,step:a});function Ea(e){return C({wingStorm:{label:"Storm",value:e.wingStorm},wingAirspeed:T("Airspeed (m/s)",e.wingAirspeed,0,250,1),wingTurbulence:T("Turbulence",e.wingTurbulence,0,3,.01),wingTurbulenceSpeed:T("Turbulence Speed",e.wingTurbulenceSpeed,0,4,.01),Lights:C({wingLightsVisible:{label:"Wingtip",value:e.wingLightsVisible},wingNavColor:{label:"Nav Color",value:e.wingNavColor},wingNavIntensity:T("Intensity",e.wingNavIntensity,0,50,.1)},q),Sky:C({wingSkyVisible:{label:"Day Sky",value:e.wingSkyVisible},wingSkyTurbidity:T("Turbidity",e.wingSkyTurbidity,0,20,.1),wingSkyRayleigh:T("Rayleigh",e.wingSkyRayleigh,0,4,.01),wingSkyMie:T("Mie",e.wingSkyMie,0,.1,5e-4)},q),Clouds:C({wingCloudsVisible:{label:"Visible",value:e.wingCloudsVisible},wingCloudHeight:T("Height",e.wingCloudHeight,-600,-5,1),wingCloudCoverage:T("Coverage",e.wingCloudCoverage,0,1,.01),wingCloudSoftness:T("Softness",e.wingCloudSoftness,0,.5,.01),wingCloudLitColor:{label:"Lit",value:e.wingCloudLitColor},wingCloudShadeColor:{label:"Shade",value:e.wingCloudShadeColor},wingCloudHorizonColor:{label:"Horizon",value:e.wingCloudHorizonColor}},q),Rain:C({wingRainCount:T("Drops",e.wingRainCount,0,8e3,100),wingRainLength:T("Length",e.wingRainLength,.05,2,.01),wingRainOpacity:T("Opacity",e.wingRainOpacity,0,1,.01),wingRainColor:{label:"Color",value:e.wingRainColor}},q),Lightning:C({wingFlashColor:{label:"Color",value:e.wingFlashColor},wingFlashIntensity:T("Intensity",e.wingFlashIntensity,0,30,.1),wingFlashMinGap:T("Min Gap (s)",e.wingFlashMinGap,.5,30,.5),wingFlashMaxGap:T("Max Gap (s)",e.wingFlashMaxGap,1,60,.5)},q)},q)}function Aa({anchorRef:e,config:t}){const r=O(t,Ca),o=O(t,Wa),a=O(t,Fa),i=O(t,wa),n=O(t,La),l=O(t,xa),f=t.lightKeyAzimuth,u=t.lightKeyElevation;switch(t.location){case Se:return m.jsx(Jr,{anchorRef:e,config:o,sunAzimuth:f,sunElevation:u});case ve:return m.jsx(ba,{anchorRef:e,backdropColor:t.backdropColor,config:a,sunAzimuth:f,sunElevation:u});case qe:return m.jsx(ta,{config:i});case Je:return m.jsx(Ur,{config:l});case Qe:return m.jsx($r,{config:n});case Ze:default:return m.jsx(pr,{config:r})}}const za=s.memo(Aa),Xt={milkyWay:j("blackhole/legacy-milkyway.jpg"),stars:j("blackhole/legacy-stars.png")},Ia=9e3,Ae=Math.PI/180;U.preload(Object.values(Xt));function _a({brightness:e,rotation:t,tint:r,variant:o}){const a=U(Xt),i=s.useRef(null);s.useEffect(()=>{const{milkyWay:u,stars:c}=a;u.colorSpace=ge,u.needsUpdate=!0,c.colorSpace=ge,c.needsUpdate=!0},[a]);const n=s.useMemo(()=>new Ue(Ia,64,32),[]),{material:l,uniforms:f}=s.useMemo(()=>er(a[o]??a.milkyWay),[a,o]);return s.useEffect(()=>{f.brightness.value=e,f.tint.value.set(r)},[e,r,f]),s.useEffect(()=>()=>n.dispose(),[n]),s.useEffect(()=>()=>l.dispose(),[l]),A(({camera:u})=>{i.current?.position.copy(u.position)}),m.jsx("mesh",{ref:i,frustumCulled:!1,geometry:n,material:l,renderOrder:-10,rotation:[t.x*Ae,t.y*Ae,t.z*Ae]})}const Ga=s.memo(_a),me={collapsed:!0},Oa=["ghostPosition","ghostRotationY","ghostTiltBack","ghostScale","ghostColor","ghostEyeColor","ghostEyeIntensity","ghostGlowColor","ghostOuterGlow","ghostInnerGlow","ghostGroundLightIntensity","ghostBobAmplitude","ghostBobSpeed","ghostTilt","ghostBaseWind","ghostWindBoost","ghostWindStrength","ghostWindAngle","ghostWindGust","ghostClothSegments"];function Ba(e){return C({ghostPosition:{label:"Position",value:e.ghostPosition,step:.01},ghostRotationY:{label:"Facing (°)",value:e.ghostRotationY,min:-180,max:180,step:1},ghostTiltBack:{label:"Tilt Back (°)",value:e.ghostTiltBack,min:-45,max:75,step:1},ghostScale:{label:"Scale",value:e.ghostScale,min:.2,max:10,step:.01},Look:C({ghostColor:{label:"Cloth",value:e.ghostColor},ghostEyeColor:{label:"Eyes",value:e.ghostEyeColor},ghostEyeIntensity:{label:"Eye Glow",value:e.ghostEyeIntensity,min:0,max:10,step:.01},ghostGlowColor:{label:"Glow",value:e.ghostGlowColor},ghostOuterGlow:{label:"Outer Glow",value:e.ghostOuterGlow,min:0,max:3,step:.01},ghostInnerGlow:{label:"Inner Glow",value:e.ghostInnerGlow,min:0,max:3,step:.01},ghostGroundLightIntensity:{label:"Ground Light",value:e.ghostGroundLightIntensity,min:0,max:20,step:.1},ghostClothSegments:{label:"Cloth Segments",value:e.ghostClothSegments,min:12,max:48,step:1}},me),Motion:C({ghostBobAmplitude:{label:"Bob",value:e.ghostBobAmplitude,min:0,max:.2,step:.001},ghostBobSpeed:{label:"Bob Speed",value:e.ghostBobSpeed,min:0,max:3,step:.01},ghostTilt:{label:"Lean Into Wind",value:e.ghostTilt,min:0,max:1,step:.01}},me),Wind:C({ghostWindStrength:{label:"Strength",value:e.ghostWindStrength,min:0,max:1.5,step:.01},ghostWindAngle:{label:"Heading (°)",value:e.ghostWindAngle,min:-180,max:180,step:1},ghostWindGust:{label:"Gusts",value:e.ghostWindGust,min:0,max:1,step:.01},ghostBaseWind:{label:"Base Flutter",value:e.ghostBaseWind,min:0,max:2,step:.01},ghostWindBoost:{label:"Wind Boost",value:e.ghostWindBoost,min:0,max:8,step:.05}},me)},me)}const $t={collapsed:!0},Ha=["starsVisible","starsVariant","starsBrightness","starsRotation","starsTint"],Na=["earthVisible","earthAzimuth","earthElevation","earthSize","earthAtmosphere","earthSpin"],ie=(e,t,r,o,a)=>({label:e,value:t,min:r,max:o,step:a});function Va(e){return C({starsVisible:{label:"Visible",value:e.starsVisible},starsVariant:{label:"Sky",value:e.starsVariant,options:{"Milky Way":"milkyWay",Stars:"stars"}},starsBrightness:ie("Brightness",e.starsBrightness,0,3,.01),starsRotation:{label:"Rotation (°)",value:e.starsRotation,step:1},starsTint:{label:"Tint",value:e.starsTint}},$t)}function ja(e){return C({earthVisible:{label:"Visible",value:e.earthVisible},earthAzimuth:ie("Azimuth",e.earthAzimuth,-180,180,.5),earthElevation:ie("Elevation",e.earthElevation,-10,89,.5),earthSize:ie("Size (°)",e.earthSize,.5,40,.1),earthAtmosphere:{label:"Atmosphere",value:e.earthAtmosphere},earthSpin:ie("Spin",e.earthSpin,0,.2,.001)},$t)}const J=(e,t,r)=>({x:e,y:t,z:r}),kt=e=>Object.fromEntries(Object.entries(e).map(([t,r])=>[t,r.value])),Ua={cameraMode:"spline",splinePreset:"Black Hole Drift",splineDesktopTarget:J(-16,0,-8),splineMobileTarget:J(-16,0,-8),splineDesktopFov:58,splineMobileFov:70,splineDuration:80,splineOrientationMode:"target"},Ka={lightEnabled:!0,lightHemiSkyColor:"#9fb4d8",lightHemiGroundColor:"#1a1d26",lightHemiIntensity:.4,lightKeyColor:"#fff1dc",lightKeyIntensity:2,lightKeyAzimuth:200,lightKeyElevation:25,lightKeyShadowExtent:6,lightRimColor:"#9cc4ff",lightRimIntensity:.8,lightRimAzimuth:20,lightRimElevation:35},Ya={location:Ze,backdropColor:"#000000",fogEnabled:!1,fogNear:20,fogFar:400},Xa={ghostPosition:J(0,0,0),ghostRotationY:-48,ghostTiltBack:0,ghostScale:1,ghostColor:"#f5f2ea",ghostEyeColor:"#000000",ghostEyeIntensity:.2,ghostGlowColor:"#88ccff",ghostOuterGlow:0,ghostInnerGlow:0,ghostGroundLightIntensity:0,ghostBobAmplitude:.03,ghostBobSpeed:.5,ghostTilt:.3,ghostBaseWind:.3,ghostWindBoost:2,ghostWindStrength:0,ghostWindAngle:180,ghostWindGust:0,ghostClothSegments:28},$a={starsVisible:!0,starsVariant:"milkyWay",starsBrightness:.8,starsRotation:J(0,0,0),starsTint:"#ffffff",earthVisible:!1,earthAzimuth:-90,earthElevation:15,earthSize:4,earthAtmosphere:"#4f8cff",earthSpin:.01},Za={blackHoleVariant:No,blackHolePosition:J(-34,6,2),metricWorldScale:14,blackHoleLightEnabled:!0,blackHoleLightIntensity:3,blackHoleLightVividness:.85,blackHoleLightColor:"#ffb36b",...Ho,...Bo,...Oo},qa={oceanQuality:$o,oceanPatchSize:1200,oceanPatchResolution:384,oceanLodScale:3.7,oceanFoamStrength:.8,oceanFoamThreshold:2.7,oceanExposure:1,oceanSkyVisible:!0,oceanSkyTurbidity:10,oceanSkyRayleigh:3,oceanSkyMie:.005,oceanCustomColors:!1,oceanSeaColor:"#0d223d",oceanHorizonColor:"#adceea",oceanReflectColor:"#507ea8",oceanWaveColor:"#698976",oceanFadeColor:"#00597c",oceanSpecularColor:"#cec4ba",oceanFoamColor:"#ffffff",oceanSpecularStrength:1,oceanMoonVisible:!1,oceanMoonSize:3,oceanMoonColor:"#dfe6ff",oceanMoonGlow:1.2,oceanGhostRide:1,oceanGhostRock:.5,oceanGhostFollow:3,...kt(Ye({prefix:"oceanFirst_"})),...kt(Xe({prefix:"oceanSecond_"}))},Qa={wingStorm:!1,wingAirspeed:70,wingTurbulence:.3,wingTurbulenceSpeed:1,wingLightsVisible:!0,wingNavColor:"#ff2a2a",wingNavIntensity:4,wingSkyVisible:!0,wingSkyTurbidity:4,wingSkyRayleigh:1.8,wingSkyMie:.006,wingCloudsVisible:!0,wingCloudHeight:-120,wingCloudCoverage:.45,wingCloudSoftness:.12,wingCloudLitColor:"#ffd8b8",wingCloudShadeColor:"#8a8fb0",wingCloudHorizonColor:"#f2b98e",wingRainCount:3500,wingRainLength:.6,wingRainOpacity:.35,wingRainColor:"#a9b8d6",wingFlashColor:"#cfd8ff",wingFlashIntensity:12,wingFlashMinGap:4,wingFlashMaxGap:12},Ja={tinyMoonRadius:3,tinyMoonDisplacement:.04,tinyMoonBump:1.5,tinyMoonRoughness:.95,tinyMoonTint:"#ffffff",lunarSeed:7,lunarCraterCount:420,lunarMaxCrater:45,lunarRoughness:1.1,lunarCurvature:1100,lunarGrain:.5,lunarDarkColor:"#55534f",lunarLightColor:"#8d8a84"},ei={campfirePosition:J(-1.9,0,0),campfireBurnMode:"hold",campfireFireLife:.8,campfireBurnSeconds:120,campfireResolution:480,campfireGhostLight:1},N={...Ua,...Ka,...Ya,...Xa,...$a,...Za,...qa,...Qa,...Ja,...ei},L=(e,t,r)=>({x:e,y:t,z:r}),ti="Black Hole",oi={"Black Hole":{cameraMode:"orbit",cameraProjection:"perspective",cameraFrustumHeight:10,cameraMobileFrustumHeight:10,cameraAutoFit:!0,orbitDesktopFov:45,orbitAutoRotate:!1,orbitAutoRotateSpeed:2,orbitEnablePan:!0,orbitMinDistance:0,orbitMaxDistance:100,orbitMaxDistanceUnlimited:!0,orbitMinPolarAngle:0,orbitMaxPolarAngle:180,orbitMinAzimuthAngle:-180,orbitMaxAzimuthAngle:180,orbitAzimuthUnlimited:!0,orbitDesktopPivot:{x:-9,y:0,z:4},orbitDesktopPosition:{x:-34.5,y:11.6,z:57},orbitDesktopTarget:{x:0,y:0,z:0},orbitMobileFov:65,orbitMobilePivot:{x:0,y:0,z:0},orbitMobilePosition:{x:2,y:.8,z:4.5},orbitMobileTarget:{x:0,y:0,z:0},lightEnabled:!1,lightHemiEnabled:!0,lightHemiSkyColor:"#202436",lightHemiGroundColor:"#000000",lightHemiIntensity:.15,lightKeyEnabled:!1,lightKeyColor:"#ffcf8a",lightKeyIntensity:2.5,lightKeyAzimuth:-87,lightKeyElevation:10,lightKeyRadius:30,lightKeyTarget:{x:0,y:0,z:0},lightKeyCastShadow:!0,lightKeyShadowMapSize:2048,lightKeyShadowBias:-4e-4,lightKeyShadowNormalBias:0,lightKeyShadowFar:80,lightKeyShadowExtent:6,lightKeyDebug:!1,lightRimEnabled:!0,lightRimColor:"#6f88c9",lightRimIntensity:.6,lightRimAzimuth:34,lightRimElevation:25,lightRimRadius:30,lightRimTarget:{x:0,y:0,z:0},lightRimDebug:!1,location:"blackHole",backdropColor:"#000000",fogEnabled:!1,fogNear:20,fogFar:400,ghostPosition:{x:-4,y:2,z:0},ghostRotationY:-90,ghostTiltBack:25,ghostScale:10,ghostColor:"#f5f2ea",ghostEyeColor:"#000000",ghostEyeIntensity:.2,ghostGlowColor:"#88ccff",ghostOuterGlow:0,ghostInnerGlow:0,ghostGroundLightIntensity:0,ghostClothSegments:48,ghostBobAmplitude:.03,ghostBobSpeed:.5,ghostTilt:.3,ghostWindStrength:0,ghostWindAngle:180,ghostWindGust:0,ghostBaseWind:.15,ghostWindBoost:2,starsVisible:!0,starsVariant:"milkyWay",starsBrightness:.8,starsRotation:{x:0,y:0,z:0},starsTint:"#ffffff",earthVisible:!1,earthAzimuth:-90,earthElevation:15,earthSize:4,earthAtmosphere:"#4f8cff",earthSpin:.01,blackHoleVariant:"legacyPort",blackHolePosition:{x:-34,y:6,z:2},metricWorldScale:21,blackHoleLightEnabled:!0,blackHoleLightIntensity:3,blackHoleLightVividness:.85,blackHoleLightColor:"#ffb36b",legacyDiskVariant:"chromatic",legacyUseProceduralDisk:!0,legacyBlackHoleDiameter:.3048,legacyDiskDiameter:1.08,legacyLensDiameter:1.55,legacyGravityStrength:1,legacyStepCount:100,legacyDiskBrightness:1.67,legacyDiskTemperature:8e3,legacyDopplerStrength:1,legacyChromaticRingFreq:1,legacyChromaticAnimSpeed:2,legacyChromaticColorSpeed:.5,legacyChromaticSaturation:.45,legacyRibbonRotationSpeed:.02,legacyRibbonBandScale:16,legacyRibbonBiasStrength:.05,legacyAccretionMinRadius:1.5,legacyAccretionWidth:5,legacyMaxRevolutions:2,legacyStarBrightness:1,legacyGalaxyBrightness:.4,webgpuBlackHoleDiameter:.3048,webgpuDiskDiameter:1.08,webgpuLensDiameter:1.55,webgpuMass:.4,webgpuDiskInnerRadius:4.1,webgpuDiskOuterRadius:14.5,webgpuDiskBrightness:5,webgpuTemperature:49.78,webgpuTemperatureFalloff:5.22,webgpuLensingStrength:2.4,webgpuDopplerStrength:1,webgpuRotationSpeed:-8.7,webgpuStepCount:64,webgpuStepSize:1,webgpuTurbulenceScale:1.81,webgpuTurbulenceStretch:.75,webgpuTurbulenceSharpness:7.4,webgpuTurbulenceCycleTime:5,webgpuTurbulenceLacunarity:3,webgpuTurbulencePersistence:.8,webgpuDiskEdgeSoftnessInner:.18,webgpuDiskEdgeSoftnessOuter:.5,singularityLensDiameter:1.55,singularityIterations:112,singularityStepSize:.011,singularityPower:.26,singularityOriginRadius:.11,singularityBandWidth:.058,singularityFieldScale:3.8,singularityRampPos1:.05,singularityRampPos2:.425,singularityRampPos3:1,singularityRampColor1:"#f2b670",singularityRampColor2:"#3d180a",singularityRampColor3:"#050505",singularityEmissionStrength:1.9,oceanQuality:"Medium",oceanPatchSize:1200,oceanPatchResolution:384,oceanLodScale:3.7,oceanFoamStrength:.8,oceanFoamThreshold:2.7,oceanGhostRide:1,oceanGhostRock:.5,oceanGhostFollow:3,oceanSkyVisible:!0,oceanExposure:1,oceanSkyTurbidity:10,oceanSkyRayleigh:3,oceanSkyMie:.005,oceanCustomColors:!1,oceanSeaColor:"#0d223d",oceanHorizonColor:"#adceea",oceanReflectColor:"#507ea8",oceanWaveColor:"#698976",oceanFadeColor:"#00597c",oceanSpecularColor:"#cec4ba",oceanFoamColor:"#ffffff",oceanSpecularStrength:1,oceanMoonVisible:!1,oceanMoonSize:3,oceanMoonColor:"#dfe6ff",oceanMoonGlow:1.2,oceanFirst_depth:20,oceanFirst_scaleHeight:1,oceanFirst_windSpeed:1,oceanFirst_windDirection:0,oceanFirst_fetch:1e5,oceanFirst_spreadBlend:1,oceanFirst_swell:.198,oceanFirst_peakEnhancement:3.3,oceanFirst_shortWaveFade:0,oceanFirst_fadeLimit:0,oceanSecond_d_depth:20,oceanSecond_d_scaleHeight:1,oceanSecond_d_windSpeed:1,oceanSecond_d_windDirection:4.1887902047863905,oceanSecond_d_fetch:3e5,oceanSecond_d_spreadBlend:1,oceanSecond_d_swell:.5,oceanSecond_d_peakEnhancement:3.3,oceanSecond_d_shortWaveFade:0,oceanSecond_d_fadeLimit:0,wingStorm:!1,wingAirspeed:70,wingTurbulence:.3,wingTurbulenceSpeed:1,wingLightsVisible:!0,wingNavColor:"#ff2a2a",wingNavIntensity:4,wingSkyVisible:!0,wingSkyTurbidity:4,wingSkyRayleigh:1.8,wingSkyMie:.006,wingCloudsVisible:!0,wingCloudHeight:-120,wingCloudCoverage:.45,wingCloudSoftness:.12,wingCloudLitColor:"#ffd8b8",wingCloudShadeColor:"#8a8fb0",wingCloudHorizonColor:"#f2b98e",wingRainCount:3500,wingRainLength:.6,wingRainOpacity:.35,wingRainColor:"#a9b8d6",wingFlashColor:"#cfd8ff",wingFlashIntensity:12,wingFlashMinGap:4,wingFlashMaxGap:12,tinyMoonRadius:3,tinyMoonDisplacement:.04,tinyMoonBump:1.5,tinyMoonRoughness:.95,tinyMoonTint:"#ffffff",lunarSeed:7,lunarCraterCount:420,lunarMaxCrater:45,lunarRoughness:1.1,lunarCurvature:1100,lunarGrain:.5,lunarDarkColor:"#55534f",lunarLightColor:"#8d8a84"},"Ocean: Day":{...N,location:Se,backdropColor:"#87ceeb",starsVisible:!1,splinePreset:"Ocean Drift",splineDesktopTarget:L(-21,3,-8),splineMobileTarget:L(-21,3,-8),lightHemiSkyColor:"#bcd9ff",lightHemiGroundColor:"#2f4a5c",lightHemiIntensity:.9,lightKeyColor:"#fff2dd",lightKeyIntensity:2.6,lightKeyAzimuth:-90,lightKeyElevation:2,lightRimColor:"#bcd9ff",lightRimIntensity:.5,lightRimAzimuth:34,lightRimElevation:25,ghostPosition:L(0,2.4,0),ghostScale:2.6,ghostWindStrength:.35,ghostWindAngle:120,ghostWindGust:.3},"Ocean: Night":{...N,location:Se,backdropColor:"#02040a",starsBrightness:.6,splinePreset:"Ocean Drift",splineDesktopTarget:L(-27,6,-12),splineMobileTarget:L(-27,6,-12),lightHemiSkyColor:"#1a2238",lightHemiGroundColor:"#05070c",lightHemiIntensity:.25,lightKeyColor:"#9fb6ff",lightKeyIntensity:.6,lightKeyAzimuth:-90,lightKeyElevation:14,lightRimColor:"#6f8fd8",lightRimIntensity:.3,lightRimAzimuth:34,lightRimElevation:25,oceanSkyVisible:!1,oceanCustomColors:!0,oceanSeaColor:"#01040a",oceanHorizonColor:"#0b1426",oceanReflectColor:"#060b18",oceanWaveColor:"#0a1a22",oceanFadeColor:"#02040a",oceanSpecularColor:"#cfdcff",oceanFoamColor:"#8a96ad",oceanSpecularStrength:1.6,oceanMoonVisible:!0,oceanFirst_scaleHeight:.7,ghostPosition:L(0,2.4,0),ghostScale:2.6,ghostEyeColor:"#88ccff",ghostEyeIntensity:2.5,ghostOuterGlow:.15,ghostWindStrength:.2,ghostWindAngle:120,ghostWindGust:.2},"Wing: Storm":{...N,location:ve,backdropColor:"#05070c",fogEnabled:!0,fogNear:15,fogFar:260,starsVisible:!1,splinePreset:"Wing Drift",splineDesktopTarget:L(21,2,-8),splineMobileTarget:L(21,2,-8),splineDuration:60,lightHemiSkyColor:"#1d2333",lightHemiGroundColor:"#050608",lightHemiIntensity:.3,lightKeyColor:"#7d8db8",lightKeyIntensity:.35,lightKeyAzimuth:90,lightKeyElevation:40,lightRimColor:"#5a6a99",lightRimIntensity:.35,lightRimAzimuth:-34,lightRimElevation:25,ghostPosition:L(0,2.25,0),ghostRotationY:48,ghostScale:2.6,ghostEyeColor:"#88ccff",ghostEyeIntensity:2.5,ghostTilt:.5,ghostWindStrength:1,ghostWindAngle:180,ghostWindGust:.5,ghostWindBoost:3.5,wingStorm:!0,wingAirspeed:90,wingTurbulence:1.4,wingTurbulenceSpeed:1.6,wingNavIntensity:6,wingSkyVisible:!1,wingCloudHeight:-80,wingCloudCoverage:.25,wingCloudLitColor:"#3a4256",wingCloudShadeColor:"#141823",wingCloudHorizonColor:"#05070c"},"Wing: Above the Clouds":{...N,location:ve,backdropColor:"#f2b98e",starsVisible:!1,splinePreset:"Wing Drift",splineDesktopTarget:L(21,2,-8),splineMobileTarget:L(21,2,-8),lightHemiSkyColor:"#8aa4d6",lightHemiGroundColor:"#d9b8a0",lightHemiIntensity:.6,lightKeyColor:"#ffb070",lightKeyIntensity:2.4,lightKeyAzimuth:90,lightKeyElevation:4,lightRimColor:"#9fb4e0",lightRimIntensity:.6,lightRimAzimuth:-34,lightRimElevation:25,ghostPosition:L(0,2.25,0),ghostRotationY:48,ghostScale:2.6,ghostWindStrength:.8,ghostWindAngle:180,ghostWindGust:.15,ghostWindBoost:3,wingNavIntensity:2},"Tiny Moon":{...N,location:qe,starsBrightness:.9,earthVisible:!0,earthElevation:20,earthSize:18,splinePreset:"Tiny Moon Drift",splineDesktopTarget:L(-23,4,-12),splineMobileTarget:L(-23,4,-12),splineDuration:90,lightHemiSkyColor:"#22283a",lightHemiGroundColor:"#000000",lightHemiIntensity:.12,lightKeyColor:"#fff4e6",lightKeyIntensity:3,lightKeyAzimuth:30,lightKeyElevation:25,lightKeyShadowExtent:4,lightRimColor:"#7f9fff",lightRimIntensity:.3,lightRimAzimuth:-90,lightRimElevation:20,ghostPosition:L(0,.85,0),ghostBaseWind:.1},"Lunar Surface":{...N,location:Qe,starsVariant:"stars",starsBrightness:.25,earthVisible:!0,earthElevation:12,earthSize:3.5,splinePreset:"Lunar Drift",splineDesktopTarget:L(-30,7,-14),splineMobileTarget:L(-30,7,-14),lightHemiSkyColor:"#0c0e14",lightHemiGroundColor:"#2a2a2a",lightHemiIntensity:.08,lightKeyColor:"#ffffff",lightKeyIntensity:4,lightKeyAzimuth:60,lightKeyElevation:9,lightKeyShadowExtent:14,lightRimColor:"#5d7bbd",lightRimIntensity:.2,lightRimAzimuth:-90,lightRimElevation:12,ghostPosition:L(0,2.2,0),ghostScale:2.6,ghostBaseWind:.1},Campfire:{...N,location:Je,starsVisible:!1,lightEnabled:!1,splinePreset:"Campfire Drift",splineDesktopTarget:L(-.98,.7,0),splineMobileTarget:L(-.98,.7,0),splineDesktopFov:50,ghostPosition:L(0,1.55,0),ghostScale:2,ghostBaseWind:.12}};function ri({presetSnapshot:e}){return{...e}}const ai={"Black Hole Drift":{tension:.5,closed:!0,points:[[1.06,.03,2.38],[1.45,.27,2.32],[1.84,.45,2.19],[1.96,.21,1.9],[1.59,-.03,1.89],[1.2,-.15,2.07]]},"Ocean Drift":{tension:.5,closed:!0,points:[[2.85,2.03,6.39],[3.89,2.47,6.23],[4.95,2.8,5.9],[5.29,2.36,5.11],[4.27,1.92,5.09],[3.22,1.7,5.58]]},"Wing Drift":{tension:.5,closed:!0,points:[[-2.85,1.83,6.39],[-3.89,2.27,6.23],[-4.95,2.6,5.9],[-5.29,2.16,5.11],[-4.27,1.72,5.09],[-3.22,1.5,5.58]]},"Tiny Moon Drift":{tension:.5,closed:!0,points:[[1.38,.6,3.11],[1.89,1,3.03],[2.4,1.3,2.87],[2.57,.9,2.48],[2.08,.5,2.47],[1.56,.3,2.71]]},"Lunar Drift":{tension:.5,closed:!0,points:[[2.64,1.2,5.94],[3.62,1.6,5.79],[4.6,1.9,5.48],[4.91,1.5,4.74],[3.97,1.1,4.73],[2.99,.9,5.18]]},"Campfire Drift":{tension:.5,closed:!0,points:[[-.83,1.24,4.73],[-.35,1.56,5.03],[.28,1.8,5.27],[.79,1.48,4.98],[.32,1.16,4.55],[-.38,1,4.4]]}},ii={defaultMode:"spline",near:.05,far:1e6,orbit:{desktop:{position:[1.5,.6,3],target:[0,0,0],pivot:[0,0,0],fov:45},mobile:{position:[2,.8,4.5],target:[0,0,0],pivot:[0,0,0],fov:65}},spline:{preset:"Black Hole Drift",paths:ai,duration:80,orientationMode:"target",desktop:{target:[-16,0,-8],fov:58},mobile:{target:[-16,0,-8],fov:70}}},si={hemi:{type:"hemisphere",skyColor:"#9fb4d8",groundColor:"#1a1d26",intensity:.4},key:{type:"directional",color:"#fff1dc",intensity:2,position:{azimuth:200,elevation:25,radius:30},shadow:{mapSize:2048,extent:6,far:80,bias:-4e-4}},rim:{type:"directional",color:"#9cc4ff",intensity:.8,position:{azimuth:20,elevation:35,radius:30}}},ee="All My Friends Are Ghosts",ni=`${ee}.Camera`,li=`${ee}.Lighting`,ci=`${ee}.Black Hole`,ui=`${ee}.Campfire`,ze={collapsed:!0};function fi(){const{attachSetControls:e,controlsSnapshotRef:t,presetsFolder:r}=Qo({defaultPreset:ti,getPresetControls:ri,presets:oi}),o={...N,...t.current},a=s.useRef(null),{buildCamera:i,cameraControls:n}=co({apiRef:a,camera:ii,cameraFolderPath:ni,controlsSnapshotRef:t}),{buildLighting:l,lightingControls:f}=mo({controlsSnapshotRef:t,lighting:si,lightingFolderPath:li}),[u,c]=no(ee,()=>({Presets:r,Camera:C(n,ze),Lighting:C(f,ze),Place:C({location:{label:"Location",value:o.location,options:hr},backdropColor:{label:"Backdrop",value:o.backdropColor},fogEnabled:{label:"Fog",value:o.fogEnabled},fogNear:{label:"Fog Near",value:o.fogNear,min:0,max:500,step:.5},fogFar:{label:"Fog Far",value:o.fogFar,min:1,max:4e3,step:1}},ze),Ghost:Ba(o),Stars:Va(o),Earth:ja(o),"Black Hole":ka(o,ci),Ocean:Pa(o),Wing:Ea(o),"Tiny Moon":Ma(o),"Lunar Surface":Da(o),Campfire:Ra(o,ui)}));e(c),t.current={...u},Jo({fileName:ee});const d=s.useMemo(()=>uo(u),[u]),g=s.useMemo(()=>i(u),[i,d]),h=s.useMemo(()=>ho(u),[u]),p=s.useMemo(()=>l(u),[l,h]);return s.useMemo(()=>({...u,cameraApiRef:a,camera:g,lighting:p}),[g,u,p])}const xt=1e7;function mi(){return{position:new S,quaternion:new Wt}}function $i(){const e=fi(),t=s.useRef(null);t.current||(t.current=mi());const r=O(e,Oa),o=O(e,Ha),a=O(e,Na);return s.useEffect(()=>{t.current.position.set(0,0,0),t.current.quaternion.identity()},[e.location]),lo({color:e.backdropColor,fogFar:e.fogEnabled?e.fogFar:xt+1,fogNear:e.fogEnabled?e.fogNear:xt}),m.jsxs(m.Fragment,{children:[m.jsx(fo,{camera:e.camera}),m.jsx(go,{lighting:e.lighting}),o.starsVisible&&m.jsx(Ga,{brightness:o.starsBrightness,rotation:o.starsRotation,tint:o.starsTint,variant:o.starsVariant}),a.earthVisible&&m.jsx(cr,{angularSize:a.earthSize,atmosphereColor:a.earthAtmosphere,azimuth:a.earthAzimuth,elevation:a.earthElevation,spin:a.earthSpin}),m.jsx(za,{anchorRef:t,config:e}),m.jsx(dr,{anchorRef:t,config:r})]})}export{$i as default};
