import{V as T,a4 as Ro,r as g,c2 as Mo,aE as Zo,aa as zo,$ as bo,p as b,aF as Tt,U as wt,X as qe,M as I,o as Ke,j as U,ad as Eo,aM as Fo,ax as Po,Q as yt,ba as jo,aT as qo,bb as Rt,am as Bo,bc as Yo,aS as Bt,n as Ho,l as Yt,bk as be,T as Ht,aR as xt,t as At,K as ot,J as Mt}from"./index-Ccd5CS82.js";import{u as D,W as dt,K as Qo,r as Qt,b as Ko,j as ze,k as Be,a8 as Ye,f as x,l as He,Z as Qe,i as Te,v as $o,_ as No}from"./three.tsl-CWjF3kga.js";import{u as _t}from"./Texture-CfjLvc10.js";import{i as Lo,t as Do,j as Oo}from"./VolumetricFire-Db_ZpgQT.js";const Ne=(t,e,a)=>new T(t,e,a),Le=(t,e,a)=>new Ro(t,e,a),De=(t,e,a)=>new T(t,e,a),Io={lightColor2:"#ff8700",lightColor:"#f7f342",normalColor:"#f7a90e",darkColor2:"#ff9800",greyColor:"#3c342f",darkColor:"#181818",particleColor:"#ffb400"},Jo={lightColor2:"#d0cbc5",lightColor:"#a9a298",normalColor:"#6f675f",darkColor2:"#4a443f",greyColor:"#3c342f",darkColor:"#181818",particleColor:"#9b9388"},Kt=[{position:Ne(0,0,0),rotation:Le(0,0,0),scale:De(1,1,1)},{position:Ne(0,.9,0),rotation:Le(0,0,0),scale:De(1,1,1)},{position:Ne(0,1.8,0),rotation:Le(0,0,0),scale:De(1,1,1)},{position:Ne(0,2.7,0),rotation:Le(0,0,0),scale:De(1,1,1)},{position:Ne(0,3.6,0),rotation:Le(0,0,0),scale:De(1,1,1)},{position:Ne(0,4.5,0),rotation:Le(0,0,0),scale:De(1,1,1)}],v={closed:!1,timeScale:3,spawnIntervalMs:200,pathTravel:1,worldScale:.01,poolSize:160,particleCount:500,particleSpread:1,particleSize:1,particleSizeMin:.5,particleSizeMax:1.5,particlePointScale:30,radiusMin:1,radiusMax:1,shapeRadiusMin:8,shapeRadiusMax:13,detailMin:5,detailMax:8.5,driftScale:1,riseScale:1,showParticles:!0,...Io};function on(t=Kt){return t.map(e=>({position:e.position.clone(),rotation:(e.rotation??new Ro).clone(),scale:(e.scale??new T(1,1,1)).clone()}))}function ko(t={}){return{...v,...t}}function rn(t={}){return ko({...Io,...t})}function nn(t={}){return ko({...Jo,...t})}const mt=0,zt=1,bt=2,Et=3,Ft=4,Vt=300,Re=400,Ze=2e3,Ut=8e3,ft=2e4,Gt=2e4,Vo=Vt+Re+Ze+Ut+ft,er=Vo,tr=Gt,or=1e3/60,Xt=256,rr=.05,nr=3,ar=3,ir=7,sr=.08,cr=.35,lr=.25,ur=4.5,dr=.12,mr=.5,fr=.4,gr=`
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float pnoise(vec3 P, vec3 rep) {
  vec3 Pi0 = mod(floor(P), rep);
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
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
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
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

varying float noise;
uniform float time;
uniform float seed;
uniform float detail;
uniform float baseRadius;

void main() {
  vec3 basePosition = position * baseRadius;
  noise = detail * -0.10 * turbulence(0.6 * normal + time + seed);
  float billow = 2.0 * pnoise(0.05 * basePosition + vec3(2.0 * time), vec3(100.0));
  float displacement = -10.0 * noise + billow;
  vec3 newPosition = basePosition + normal * displacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`,pr=`
varying float noise;
uniform vec3 colLight;
uniform vec3 colNormal;
uniform vec3 colDark;
uniform float opacity;

vec3 blend(vec3 a, vec3 b, float t) {
  return vec3(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t
  );
}

void main() {
  vec3 col;
  float range = noise;

  if (range > 0.6) {
    col = colDark;
  } else if (range > 0.4) {
    col = blend(colNormal, colDark, (range - 0.4) / 0.2);
  } else {
    col = blend(colLight, colNormal, range / 0.4);
  }

  gl_FragColor = vec4(col, opacity);
}
`,vr=`
attribute float size;
attribute vec3 customColor;
varying vec3 vColor;
uniform float pointScale;

void main() {
  vColor = customColor;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float cameraDist = max(0.0001, length(mvPosition.xyz - position.xyz));
  gl_PointSize = size * pointScale / cameraDist;
  gl_Position = projectionMatrix * mvPosition;
}
`,hr=`
uniform sampler2D map;
varying vec3 vColor;

void main() {
  vec4 texel = texture2D(map, gl_PointCoord);
  if (texel.a < 0.01) discard;
  gl_FragColor = vec4(vColor, 1.0) * texel;
}
`,Oe=new T,Jt=new T,eo=new T,to=new T,oo=new T,ro=new T,Se=new T,Ie=new T,ke=new T,no=new T,st=new T,ct=new T(1,1,1),ao=new yt,io=new yt,so=new T,rt=new T,Ve=new T,Pt=new T,$t=new T;function co(t){return Array.isArray(t)&&t.length>=3&&t.every(e=>Number.isFinite(e))}function ve(t,e){t[e]=0,t[e+1]=0,t[e+2]=0}function vt(t,e){return e?(t%1+1)%1:I.clamp(t,0,1)}function Tr(t,e,a,n){const s=t.length;if(!s)return n.copy(ct),n;if(s===1)return n.copy(t[0].scale??ct),n;const i=vt(e,a),p=a?s:s-1,l=Math.min(i*p,p-1e-6),m=Math.floor(l),u=l-m,c=t[m%s].scale??ct,d=t[(m+1)%s].scale??ct;return n.copy(c).lerp(d,u),n}function lo(t,e,a,n){const s=vt(a,t.closed),{curve:i,frames:p}=t,l=s*Xt,m=Math.floor(l),u=Math.min(m+1,Xt),c=l-m;i.getPointAt(s,n.position),i.getTangentAt(s,n.tangent).normalize(),eo.copy(p.normals[m]),to.copy(p.normals[u]),oo.copy(p.binormals[m]),ro.copy(p.binormals[u]),n.normal.copy(eo).lerp(to,c).normalize(),n.binormal.copy(oo).lerp(ro,c).normalize(),Tr(e,s,t.closed,n.scale)}function yr(){const e=document.createElement("canvas");e.width=128,e.height=128;const a=e.getContext("2d");if(!a)return new Eo;const n=a.createRadialGradient(128*.5,128*.5,0,128*.5,128*.5,128*.48);n.addColorStop(0,"rgba(255,255,255,1)"),n.addColorStop(.35,"rgba(255,255,255,0.75)"),n.addColorStop(.7,"rgba(255,255,255,0.22)"),n.addColorStop(1,"rgba(255,255,255,0)"),a.clearRect(0,0,128,128),a.fillStyle=n,a.fillRect(0,0,128,128);const s=new Fo(e);return s.needsUpdate=!0,s.colorSpace=Po,s}function xr(t,e=1){return new zo({uniforms:{time:{value:0},seed:{value:t},detail:{value:e},baseRadius:{value:10.5},opacity:{value:1},colLight:{value:new b("#ffffff")},colNormal:{value:new b("#ffffff")},colDark:{value:new b("#000000")}},vertexShader:gr,fragmentShader:pr,transparent:!0,depthWrite:!1,toneMapped:!1})}function uo(t){return Array.from({length:t},()=>({material:xr(Math.random()*1e3),radius:0,baseRadius:10.5,currentTime:0,timeCount:0,state:mt,isActive:!1,flowRatio:1,opacity:1,currentScale:0,offsetX:0,offsetY:0,offsetZ:0,distX:0,distZ:0,yRatio:0,animationTimeRatio:0,randFlyX:0,randFlyZ:0,colorTransitionRandom:0,detailRatio:Math.random(),pathStartT:0,idleStartY:0,interactionOffset:new T,interactionVelocity:new T}))}function Uo(t,e){const a=e*3;t.positions[a]=0,t.positions[a+1]=0,t.positions[a+2]=0,t.sizes[e]=0,t.sizeRatios[e]=Math.random(),t.moveDest[a]=Math.random()*200-100,t.moveDest[a+1]=Math.random()*.3+.45,t.moveDest[a+2]=Math.random()*200-100,t.particleTime[e]=0,t.active[e]=!1,t.startT[e]=0,ve(t.interactionOffsets,a),ve(t.interactionVelocities,a)}function Ar(t){const e=new Float32Array(t*3),a=new Float32Array(t*3),n=new Float32Array(t),s=new Float32Array(t),i=new Float32Array(t*3),p=new Float32Array(t),l=new Array(t).fill(!1),m=new Float32Array(t),u=new Float32Array(t*3),c=new Float32Array(t*3),d={positions:e,colors:a,sizes:n,sizeRatios:s,moveDest:i,particleTime:p,active:l,startT:m,interactionOffsets:u,interactionVelocities:c,elapsed:0,spawnElapsed:0,spawnInterval:1,targetCount:t};for(let C=0;C<t;C+=1)Uo(d,C);return d}function _r(t,e){if(!t)return Ar(e);t.targetCount=e;const a=t.active.length;if(a>=e)return t;const n={positions:new Float32Array(e*3),colors:new Float32Array(e*3),sizes:new Float32Array(e),sizeRatios:new Float32Array(e),moveDest:new Float32Array(e*3),particleTime:new Float32Array(e),active:[...t.active,...Array(e-a).fill(!1)],startT:new Float32Array(e),interactionOffsets:new Float32Array(e*3),interactionVelocities:new Float32Array(e*3),elapsed:t.elapsed,spawnElapsed:t.spawnElapsed,spawnInterval:t.spawnInterval,targetCount:e};n.positions.set(t.positions),n.colors.set(t.colors),n.sizes.set(t.sizes),n.sizeRatios.set(t.sizeRatios),n.moveDest.set(t.moveDest),n.particleTime.set(t.particleTime),n.startT.set(t.startT),n.interactionOffsets.set(t.interactionOffsets),n.interactionVelocities.set(t.interactionVelocities);for(let s=a;s<e;s+=1)Uo(n,s);return n}function K(t,e,a,n){t.copy(e).lerp(a,n)}function Cr(t,e){const a=t.timeCount+t.colorTransitionRandom,{uniforms:n}=t.material;if(a<2500){n.colDark.value.copy(e.normalColor),n.colNormal.value.copy(e.lightColor),n.colLight.value.copy(e.lightColor2);return}if(a<4e3){K(n.colDark.value,e.normalColor,e.darkColor2,(a-2500)/1500),K(n.colNormal.value,e.lightColor,e.normalColor,(a-2500)/1500),K(n.colLight.value,e.lightColor2,e.lightColor,(a-2500)/1500);return}if(a<7e3){n.colDark.value.copy(e.darkColor2),n.colNormal.value.copy(e.normalColor),n.colLight.value.copy(e.lightColor);return}if(a<12e3){const i=(a-7e3)/5e3;K(n.colDark.value,e.darkColor2,e.darkColor,i),K(n.colNormal.value,e.normalColor,e.darkColor2,i),K(n.colLight.value,e.lightColor,e.normalColor,i);return}if(a<17e3){const i=(a-12e3)/5e3;K(n.colDark.value,e.darkColor,e.darkColor,i),K(n.colNormal.value,e.darkColor2,e.darkColor,i),K(n.colLight.value,e.normalColor,e.darkColor2,i);return}const s=I.clamp((a-17e3)/6e3,0,1);K(n.colDark.value,e.darkColor,e.greyColor,s),K(n.colNormal.value,e.darkColor,e.greyColor,s),K(n.colLight.value,e.darkColor2,e.darkColor,s)}function Sr(t,e,a,n,s){s.length=0;const i=t?.current;if(!e||!i?.length)return s;e.updateWorldMatrix(!0,!1),e.getWorldQuaternion(ao),io.copy(ao).invert();let p=0;for(let l=0;l<i.length;l+=1){const m=i[l];if(!co(m?.position))continue;const u=m.strength??a,c=m.radius??n;if(!Number.isFinite(u)||!Number.isFinite(c)||u===0||c<=0)continue;const d=s[p]??{position:new T,direction:new T,radius:n,strength:a,sign:1};d.position.set(m.position[0],m.position[1],m.position[2]),e.worldToLocal(d.position),co(m.direction)?(d.direction.set(m.direction[0],m.direction[1],m.direction[2]).applyQuaternion(io),d.direction.lengthSq()>1e-6?d.direction.normalize():d.direction.set(0,0,0)):d.direction.set(0,0,0),d.radius=c,d.strength=u,d.sign=m.type==="repeller"?-1:1,s[p]=d,p+=1}return s.length=p,s}function mo(t,e,a,n,s,i,p,l,m){if(!(s<=0)){a.addScaledVector(e,-i*s),so.copy(t).add(e);for(let u=0;u<n.length;u+=1){const c=n[u];$t.subVectors(c.position,so);const d=Math.max($t.lengthSq(),1e-4),C=Math.sqrt(d),h=c.radius*c.radius,P=c.strength*h/(d+h),z=c.sign*P;if(a.addScaledVector($t,z*s/C),c.direction.lengthSq()>0){const _=c.sign*(c.strength*m*h/(d+h));a.addScaledVector(c.direction,_*s)}}a.multiplyScalar(p**s),e.addScaledVector(a,s),l>0&&e.lengthSq()>l*l&&(e.setLength(l),a.multiplyScalar(.5))}}function wr({controlPoints:t=Kt,closed:e=v.closed,timeScale:a=v.timeScale,spawnIntervalMs:n=v.spawnIntervalMs,pathTravel:s=v.pathTravel,worldScale:i=v.worldScale,poolSize:p=v.poolSize,particleCount:l=v.particleCount,particleSpread:m=v.particleSpread,particleColor:u=v.particleColor,particleSize:c=v.particleSize,particleSizeMin:d=v.particleSizeMin,particleSizeMax:C=v.particleSizeMax,particlePointScale:h=v.particlePointScale,radiusMin:P=v.radiusMin,radiusMax:z=v.radiusMax,shapeRadiusMin:_=v.shapeRadiusMin,shapeRadiusMax:ne=v.shapeRadiusMax,detailMin:O=v.detailMin,detailMax:E=v.detailMax,driftScale:$=v.driftScale,riseScale:G=v.riseScale,showParticles:ae=v.showParticles,lightColor2:ee=v.lightColor2,lightColor:ye=v.lightColor,normalColor:de=v.normalColor,darkColor2:xe=v.darkColor2,greyColor:Ae=v.greyColor,darkColor:_e=v.darkColor,attractorsRef:Je=null,attractorStrength:et=nr,attractorRadius:ie=ar}){const Ce=g.useMemo(()=>new Mo(1,3),[]),se=g.useMemo(()=>yr(),[]),k=g.useMemo(()=>new Zo,[]),te=g.useMemo(()=>new zo({uniforms:{map:{value:se},pointScale:{value:h}},vertexShader:vr,fragmentShader:hr,transparent:!0,depthTest:!1,depthWrite:!1,blending:bo,toneMapped:!1}),[se]),q=Math.max(p,Math.ceil(Vo/Math.max(1,n))+1),[M,Ct]=g.useState(()=>uo(q)),Ee=g.useRef(null),at=g.useRef(M),Fe=g.useRef(0),me=g.useRef([]),ce=g.useRef(),fe=g.useRef(0),tt=g.useRef(),it=g.useRef([]),ge=g.useMemo(()=>({lightColor2:new b(ee),lightColor:new b(ye),normalColor:new b(de),darkColor2:new b(xe),greyColor:new b(Ae),darkColor:new b(_e),particleColor:new b(u)}),[ee,ye,de,xe,Ae,_e,u]),Pe=g.useMemo(()=>{const N=t.length>1?t.map(W=>W.position.clone()):[new T(0,0,0),new T(0,1,0)],w=new Tt(N,e,"centripetal");return{curve:w,frames:w.computeFrenetFrames(Xt,e),length:Math.max(w.getLength(),1e-4),closed:e}},[t,e]);return g.useEffect(()=>{const N=Ee.current,w=_r(N,l);Ee.current=w,(!k.getAttribute("position")||w!==N)&&(k.setAttribute("position",new wt(w.positions,3).setUsage(qe)),k.setAttribute("customColor",new wt(w.colors,3).setUsage(qe)),k.setAttribute("size",new wt(w.sizes,1).setUsage(qe)),k.attributes.position.needsUpdate=!0,k.attributes.customColor.needsUpdate=!0,k.attributes.size.needsUpdate=!0)},[l,k]),g.useEffect(()=>{at.current=M},[M]),g.useEffect(()=>{q<=M.length||Ct(N=>N.length>=q?N:[...N,...uo(q-N.length)])},[q,M.length]),g.useEffect(()=>{const N=te.uniforms;N.pointScale.value=h},[te,h]),g.useEffect(()=>()=>{Ce.dispose(),k.dispose(),te.dispose(),se.dispose(),at.current.forEach(N=>N.material.dispose())},[Ce,k,te,se]),g.useEffect(()=>{for(let N=Fe.current;N<M.length;N+=1){const w=M[N];w.currentTime=0,w.timeCount=0,w.state=mt,w.isActive=!1,w.flowRatio=1,w.opacity=1,w.currentScale=0,w.offsetX=0,w.offsetY=0,w.offsetZ=0,w.idleStartY=0,w.interactionOffset.set(0,0,0),w.interactionVelocity.set(0,0,0),w.material.uniforms.time.value=0,w.material.uniforms.detail.value=I.lerp(O,E,w.detailRatio),w.material.uniforms.opacity.value=0;const W=me.current[N];W&&(W.visible=!1,W.position.set(0,0,0),W.scale.setScalar(1e-4))}Fe.current=M.length},[E,O,M]),Ke((N,w)=>{const oe=Math.min(w,rr)*1e3*a,L=oe/1e3,A=oe/or,f=Ee.current;if(!f)return;const X=Sr(Je,tt.current,et,ie,it.current);let j=ie;for(let r=0;r<X.length;r+=1)j=Math.max(j,X[r].radius);const Q=Math.max(.25,j*cr),y=Math.max(.35,j*mr),le=()=>{let r=null;const R=Math.min(q,M.length);for(let B=0;B<R;B+=1)if(!M[B].isActive){r=M[B];break}if(!r)return;const F=Math.random();r.radius=I.lerp(P,z,F),r.baseRadius=I.lerp(_,ne,F),r.currentTime=0,r.timeCount=0,r.state=mt,r.isActive=!0,r.flowRatio=1,r.opacity=1,r.currentScale=1e-4,r.offsetX=0,r.offsetY=0,r.offsetZ=0,r.distX=Math.random()*7-4,r.distZ=Math.random()*7-4,r.yRatio=Math.random()*.4+.35,r.animationTimeRatio=Math.random()*.4+.3,r.randFlyX=Math.random()*.1-.05,r.randFlyZ=Math.random()*.1-.05,r.colorTransitionRandom=Math.random()*2e3-1e3,r.detailRatio=Math.random(),r.pathStartT=0,r.idleStartY=0,r.interactionOffset.set(0,0,0),r.interactionVelocity.set(0,0,0),r.material.uniforms.baseRadius.value=r.baseRadius,r.material.uniforms.detail.value=I.lerp(O,E,r.detailRatio),r.material.uniforms.opacity.value=1};if(f.spawnElapsed+=oe,f.spawnElapsed>f.spawnInterval){f.spawnElapsed=0,f.spawnInterval=Math.random()*300+50;for(let r=0;r<f.targetCount;r+=1)if(!f.active[r]){const R=r*3;f.active[r]=!0,f.particleTime[r]=0,f.startT[r]=0,ve(f.interactionOffsets,R),ve(f.interactionVelocities,R);break}}for(fe.current+=oe;fe.current>=n;)fe.current-=n,le();M.forEach((r,R)=>{const F=me.current[R];if(!F||!r.isActive){F&&(F.visible=!1);return}if(r.currentTime+=oe,r.timeCount+=oe,r.state===mt&&r.currentTime>Vt)r.currentTime-=Vt,r.state=zt;else if(r.state===zt&&r.currentTime>Re)r.currentTime-=Re,r.state=bt;else if(r.state===bt&&r.currentTime>Ze)r.currentTime-=Ze,r.state=Et;else if(r.state===Et&&r.currentTime>Ut)r.currentTime-=Ut,r.state=Ft,r.flowRatio=.2,r.idleStartY=r.offsetY;else if(r.state===Ft&&r.currentTime>ft){r.isActive=!1,F.visible=!1,F.scale.setScalar(1e-4),r.interactionOffset.set(0,0,0),r.interactionVelocity.set(0,0,0),r.material.uniforms.opacity.value=0;return}if(r.state===zt){const Y=r.currentTime/Re,o=r.currentTime/(Re+Ze);r.offsetX=r.distX*$*o,r.offsetZ=r.distZ*$*o,r.offsetY+=Y*.4*r.yRatio*G*A,r.currentScale=Math.max(1e-4,Y)}else if(r.state===bt){const Y=(r.currentTime+Re)/(Re+Ze);r.offsetX=r.distX*$*Y,r.offsetZ=r.distZ*$*Y,r.offsetY+=(.6*(1-r.currentTime/Ze)+.2)*r.yRatio*G*A}else r.state===Et?(r.flowRatio=.5,r.offsetX+=r.randFlyX*$*A,r.offsetY+=.2*G*A,r.offsetZ+=r.randFlyZ*$*A,r.currentScale+=.003*A):r.state===Ft&&(r.offsetY=r.idleStartY+r.currentTime/100*G,r.currentScale+=.002*A,r.currentTime>ft-5e3?r.opacity=1-(r.currentTime-(ft-5e3))/5e3:r.opacity=1);r.material.uniforms.time.value+=5e-4*oe*r.animationTimeRatio*r.flowRatio,r.material.uniforms.baseRadius.value=r.baseRadius,r.material.uniforms.detail.value=I.lerp(O,E,r.detailRatio),r.material.uniforms.opacity.value=r.opacity,Cr(r,ge);const B=vt(I.clamp(r.timeCount/er,0,1)*s,e);lo(Pe,t,B,{position:Oe,tangent:Jt,normal:Ie,binormal:ke,scale:Se}),no.copy(Ie).multiplyScalar(r.offsetX*Se.x).addScaledVector(ke,r.offsetZ*Se.z).multiplyScalar(i),st.copy(Oe).add(no),mo(st,r.interactionOffset,r.interactionVelocity,X,L,ir,sr,Q,lr),st.add(r.interactionOffset),F.visible=!0,F.position.copy(st),F.scale.setScalar(Math.max(1e-4,i*r.radius*r.currentScale*Se.x))}),f.elapsed+=oe/1e3;const{positions:V}=f,{colors:Z}=f,{sizes:re}=f;for(let r=0;r<f.active.length;r+=1){const R=r*3;if(Z[R]=ge.particleColor.r,Z[R+1]=ge.particleColor.g,Z[R+2]=ge.particleColor.b,r>=f.targetCount){f.active[r]=!1,f.particleTime[r]=0,re[r]=0,V[R]=0,V[R+1]=0,V[R+2]=0,ve(f.interactionOffsets,R),ve(f.interactionVelocities,R);continue}if(!f.active[r]||!ae){re[r]=0,V[R]=0,V[R+1]=0,V[R+2]=0;continue}if(f.particleTime[r]>Gt/1e3){f.active[r]=!1,f.particleTime[r]=0,re[r]=0,V[R]=0,V[R+1]=0,V[R+2]=0,ve(f.interactionOffsets,R),ve(f.interactionVelocities,R);continue}const F=vt(I.clamp(f.particleTime[r]*1e3/tr,0,1)*s,e);lo(Pe,t,F,{position:Oe,tangent:Jt,normal:Ie,binormal:ke,scale:Se});const B=m*(f.particleTime[r]/(Gt/1e3))+.01*Math.sin(f.elapsed),Y=10*Math.sin(.3*r+f.elapsed+Math.random()/10),o=(B*f.moveDest[R]+Y)*$*Se.x*i,S=(B*f.moveDest[R+2]+Y)*$*Se.z*i;re[r]=c*I.lerp(d,C,f.sizeRatios[r])*(3+Math.sin(.4*r+f.elapsed)),rt.set(Oe.x+Ie.x*o+ke.x*S,Oe.y+Ie.y*o+ke.y*S,Oe.z+Ie.z*o+ke.z*S),Ve.fromArray(f.interactionOffsets,R),Pt.fromArray(f.interactionVelocities,R),mo(rt,Ve,Pt,X,L,ur,dr,y,fr),Ve.toArray(f.interactionOffsets,R),Pt.toArray(f.interactionVelocities,R),V[R]=rt.x+Ve.x,V[R+1]=rt.y+Ve.y,V[R+2]=rt.z+Ve.z,f.particleTime[r]+=L}k.attributes.position.needsUpdate=!0,k.attributes.customColor.needsUpdate=!0,k.attributes.size.needsUpdate=!0,ce.current&&(ce.current.visible=ae)}),U.jsxs("group",{ref:tt,children:[M.map((N,w)=>U.jsx("mesh",{ref:W=>{me.current[w]=W},geometry:Ce,material:N.material,frustumCulled:!1,visible:!1},w)),U.jsx("points",{ref:ce,geometry:k,material:te,frustumCulled:!1})]})}const gt=0,Nt=1,Lt=2,Dt=3,Ot=4,Wt=300,Me=400,je=2e3,Zt=8e3,pt=2e4,jt=2e4,Go=Wt+Me+je+Zt+pt,Rr=Go,Mr=jt,zr=1e3/60,qt=256,br=.05,Er=3,Fr=3,Pr=7,$r=.08,Nr=.35,Lr=.25,Dr=4.5,Or=.12,Ir=.5,kr=.4,Ue=new T,fo=new T,go=new T,po=new T,vo=new T,ho=new T,we=new T,Ge=new T,Xe=new T,To=new T,lt=new T,ut=new T(1,1,1),yo=new yt,xo=new yt,Ao=new T,nt=new T,We=new T,It=new T,kt=new T;function _o(t){return Array.isArray(t)&&t.length>=3&&t.every(e=>Number.isFinite(e))}function he(t,e){t[e]=0,t[e+1]=0,t[e+2]=0}function ht(t,e){return e?(t%1+1)%1:I.clamp(t,0,1)}function Vr(t,e,a,n){const s=t.length;if(!s)return n.copy(ut),n;if(s===1)return n.copy(t[0].scale??ut),n;const i=ht(e,a),p=a?s:s-1,l=Math.min(i*p,p-1e-6),m=Math.floor(l),u=l-m,c=t[m%s].scale??ut,d=t[(m+1)%s].scale??ut;return n.copy(c).lerp(d,u),n}function Co(t,e,a,n){const s=ht(a,t.closed),{curve:i,frames:p}=t,l=s*qt,m=Math.floor(l),u=Math.min(m+1,qt),c=l-m;i.getPointAt(s,n.position),i.getTangentAt(s,n.tangent).normalize(),go.copy(p.normals[m]),po.copy(p.normals[u]),vo.copy(p.binormals[m]),ho.copy(p.binormals[u]),n.normal.copy(go).lerp(po,c).normalize(),n.binormal.copy(vo).lerp(ho,c).normalize(),Vr(e,s,t.closed,n.scale)}function Ur(){const e=document.createElement("canvas");e.width=128,e.height=128;const a=e.getContext("2d");if(!a)return new Eo;const n=a.createRadialGradient(128*.5,128*.5,0,128*.5,128*.5,128*.48);n.addColorStop(0,"rgba(255,255,255,1)"),n.addColorStop(.35,"rgba(255,255,255,0.75)"),n.addColorStop(.7,"rgba(255,255,255,0.22)"),n.addColorStop(1,"rgba(255,255,255,0)"),a.clearRect(0,0,128,128),a.fillStyle=n,a.fillRect(0,0,128,128);const s=new Fo(e);return s.needsUpdate=!0,s.colorSpace=Po,s}function Gr(t,e=1){const a={time:D(0),seed:D(t),detail:D(e),baseRadius:D(10.5),opacity:D(1),colLight:D(new b("#ffffff")),colNormal:D(new b("#ffffff")),colDark:D(new b("#000000"))},n=a.time.add(a.seed),s=ze(n,n,n),i=Be(Ye.mul(x(.6)).add(s),He(5),x(2),x(.5)).mul(x(.5)).add(x(.5)).clamp(0,1),p=Be(Qe.mul(a.baseRadius).mul(x(.05)).add(ze(a.time.mul(x(2)),a.time.mul(x(2)),a.time.mul(x(2)))),He(3),x(2),x(.5)).mul(x(2)).sub(x(1)).mul(x(2)),l=a.detail.mul(i).add(p),m=i.div(x(.4)).clamp(0,1),u=i.sub(x(.4)).div(x(.2)).clamp(0,1),c=Te(a.colLight,a.colNormal,m),d=new Bt({transparent:!0,depthWrite:!1,toneMapped:!1});return d.positionNode=Qe.mul(a.baseRadius).add(Ye.mul(l)),d.colorNode=Te(c,a.colDark,u),d.opacityNode=a.opacity,d.uniforms=a,d}function So(t){return Array.from({length:t},()=>({material:Gr(Math.random()*1e3),radius:0,baseRadius:10.5,currentTime:0,timeCount:0,state:gt,isActive:!1,flowRatio:1,opacity:1,currentScale:0,offsetX:0,offsetY:0,offsetZ:0,distX:0,distZ:0,yRatio:0,animationTimeRatio:0,randFlyX:0,randFlyZ:0,colorTransitionRandom:0,detailRatio:Math.random(),pathStartT:0,idleStartY:0,interactionOffset:new T,interactionVelocity:new T}))}function Xo(t,e){const a=e*3;t.positions[a]=0,t.positions[a+1]=0,t.positions[a+2]=0,t.sizes[e]=0,t.sizeRatios[e]=Math.random(),t.moveDest[a]=Math.random()*200-100,t.moveDest[a+1]=Math.random()*.3+.45,t.moveDest[a+2]=Math.random()*200-100,t.particleTime[e]=0,t.active[e]=!1,t.startT[e]=0,he(t.interactionOffsets,a),he(t.interactionVelocities,a)}function Xr(t){const e=new Float32Array(t*3),a=new Float32Array(t*3),n=new Float32Array(t),s=new Float32Array(t),i=new Float32Array(t*3),p=new Float32Array(t),l=new Array(t).fill(!1),m=new Float32Array(t),u=new Float32Array(t*3),c=new Float32Array(t*3),d={positions:e,colors:a,sizes:n,sizeRatios:s,moveDest:i,particleTime:p,active:l,startT:m,interactionOffsets:u,interactionVelocities:c,elapsed:0,spawnElapsed:0,spawnInterval:1,targetCount:t};for(let C=0;C<t;C+=1)Xo(d,C);return d}function Wr(t,e){if(!t)return Xr(e);t.targetCount=e;const a=t.active.length;if(a>=e)return t;const n={positions:new Float32Array(e*3),colors:new Float32Array(e*3),sizes:new Float32Array(e),sizeRatios:new Float32Array(e),moveDest:new Float32Array(e*3),particleTime:new Float32Array(e),active:[...t.active,...Array(e-a).fill(!1)],startT:new Float32Array(e),interactionOffsets:new Float32Array(e*3),interactionVelocities:new Float32Array(e*3),elapsed:t.elapsed,spawnElapsed:t.spawnElapsed,spawnInterval:t.spawnInterval,targetCount:e};n.positions.set(t.positions),n.colors.set(t.colors),n.sizes.set(t.sizes),n.sizeRatios.set(t.sizeRatios),n.moveDest.set(t.moveDest),n.particleTime.set(t.particleTime),n.startT.set(t.startT),n.interactionOffsets.set(t.interactionOffsets),n.interactionVelocities.set(t.interactionVelocities);for(let s=a;s<e;s+=1)Xo(n,s);return n}function J(t,e,a,n){t.copy(e).lerp(a,n)}function Zr(t,e){const a=t.timeCount+t.colorTransitionRandom,{uniforms:n}=t.material;if(a<2500){n.colDark.value.copy(e.normalColor),n.colNormal.value.copy(e.lightColor),n.colLight.value.copy(e.lightColor2);return}if(a<4e3){J(n.colDark.value,e.normalColor,e.darkColor2,(a-2500)/1500),J(n.colNormal.value,e.lightColor,e.normalColor,(a-2500)/1500),J(n.colLight.value,e.lightColor2,e.lightColor,(a-2500)/1500);return}if(a<7e3){n.colDark.value.copy(e.darkColor2),n.colNormal.value.copy(e.normalColor),n.colLight.value.copy(e.lightColor);return}if(a<12e3){const i=(a-7e3)/5e3;J(n.colDark.value,e.darkColor2,e.darkColor,i),J(n.colNormal.value,e.normalColor,e.darkColor2,i),J(n.colLight.value,e.lightColor,e.normalColor,i);return}if(a<17e3){const i=(a-12e3)/5e3;J(n.colDark.value,e.darkColor,e.darkColor,i),J(n.colNormal.value,e.darkColor2,e.darkColor,i),J(n.colLight.value,e.normalColor,e.darkColor2,i);return}const s=I.clamp((a-17e3)/6e3,0,1);J(n.colDark.value,e.darkColor,e.greyColor,s),J(n.colNormal.value,e.darkColor,e.greyColor,s),J(n.colLight.value,e.darkColor2,e.darkColor,s)}function jr(t,e,a,n,s){s.length=0;const i=t?.current;if(!e||!i?.length)return s;e.updateWorldMatrix(!0,!1),e.getWorldQuaternion(yo),xo.copy(yo).invert();let p=0;for(let l=0;l<i.length;l+=1){const m=i[l];if(!_o(m?.position))continue;const u=m.strength??a,c=m.radius??n;if(!Number.isFinite(u)||!Number.isFinite(c)||u===0||c<=0)continue;const d=s[p]??{position:new T,direction:new T,radius:n,strength:a,sign:1};d.position.set(m.position[0],m.position[1],m.position[2]),e.worldToLocal(d.position),_o(m.direction)?(d.direction.set(m.direction[0],m.direction[1],m.direction[2]).applyQuaternion(xo),d.direction.lengthSq()>1e-6?d.direction.normalize():d.direction.set(0,0,0)):d.direction.set(0,0,0),d.radius=c,d.strength=u,d.sign=m.type==="repeller"?-1:1,s[p]=d,p+=1}return s.length=p,s}function wo(t,e,a,n,s,i,p,l,m){if(!(s<=0)){a.addScaledVector(e,-i*s),Ao.copy(t).add(e);for(let u=0;u<n.length;u+=1){const c=n[u];kt.subVectors(c.position,Ao);const d=Math.max(kt.lengthSq(),1e-4),C=Math.sqrt(d),h=c.radius*c.radius,P=c.strength*h/(d+h),z=c.sign*P;if(a.addScaledVector(kt,z*s/C),c.direction.lengthSq()>0){const _=c.sign*(c.strength*m*h/(d+h));a.addScaledVector(c.direction,_*s)}}a.multiplyScalar(p**s),e.addScaledVector(a,s),l>0&&e.lengthSq()>l*l&&(e.setLength(l),a.multiplyScalar(.5))}}function qr({controlPoints:t=Kt,closed:e=v.closed,timeScale:a=v.timeScale,spawnIntervalMs:n=v.spawnIntervalMs,pathTravel:s=v.pathTravel,worldScale:i=v.worldScale,poolSize:p=v.poolSize,particleCount:l=v.particleCount,particleSpread:m=v.particleSpread,particleColor:u=v.particleColor,particleSize:c=v.particleSize,particleSizeMin:d=v.particleSizeMin,particleSizeMax:C=v.particleSizeMax,particlePointScale:h=v.particlePointScale,radiusMin:P=v.radiusMin,radiusMax:z=v.radiusMax,shapeRadiusMin:_=v.shapeRadiusMin,shapeRadiusMax:ne=v.shapeRadiusMax,detailMin:O=v.detailMin,detailMax:E=v.detailMax,driftScale:$=v.driftScale,riseScale:G=v.riseScale,showParticles:ae=v.showParticles,lightColor2:ee=v.lightColor2,lightColor:ye=v.lightColor,normalColor:de=v.normalColor,darkColor2:xe=v.darkColor2,greyColor:Ae=v.greyColor,darkColor:_e=v.darkColor,attractorsRef:Je=null,attractorStrength:et=Er,attractorRadius:ie=Fr}){const Ce=g.useMemo(()=>new Mo(1,3),[]),se=g.useMemo(()=>Ur(),[]),k=g.useMemo(()=>({pointScale:D(30)}),[]),te=g.useMemo(()=>{const L=dt("aSize","float").mul(k.pointScale).div(Qo.z.negate()),A=Qt(se,Ko()),f=new jo({transparent:!0,depthTest:!1,depthWrite:!1,blending:bo,sizeAttenuation:!1,toneMapped:!1});return f.positionNode=dt("aPosition","vec3"),f.sizeNode=L,f.colorNode=dt("aColor","vec3").mul(A.rgb).toVec4(A.a),f},[k,se]),q=Math.max(p,Math.ceil(Go/Math.max(1,n))+1),[M,Ct]=g.useState(()=>So(q)),[Ee,at]=g.useState(null),Fe=g.useRef(null),me=g.useRef(null),ce=g.useRef(null),fe=g.useRef(0),tt=g.useRef(M),it=g.useRef(0),ge=g.useRef([]),Pe=g.useRef(0),N=g.useRef(),w=g.useRef([]),W=g.useMemo(()=>({lightColor2:new b(ee),lightColor:new b(ye),normalColor:new b(de),darkColor2:new b(xe),greyColor:new b(Ae),darkColor:new b(_e),particleColor:new b(u)}),[ee,ye,de,xe,Ae,_e,u]),oe=g.useMemo(()=>{const L=t.length>1?t.map(f=>f.position.clone()):[new T(0,0,0),new T(0,1,0)],A=new Tt(L,e,"centripetal");return{curve:A,frames:A.computeFrenetFrames(qt,e),length:Math.max(A.getLength(),1e-4),closed:e}},[t,e]);return g.useEffect(()=>{k.pointScale.value=h},[k,h]),g.useEffect(()=>{const L=Fe.current,A=Wr(L,l);Fe.current=A;const f=A.active.length,X=ce.current;if(X&&fe.current>=f){X.material=te,X.count=Math.min(A.targetCount,fe.current);return}me.current?.dispose();const j=new qo(1,1),Q=new Rt(A.positions,3);Q.usage=qe,j.setAttribute("aPosition",Q);const y=new Rt(A.colors,3);y.usage=qe,j.setAttribute("aColor",y);const le=new Rt(A.sizes,1);le.usage=qe,j.setAttribute("aSize",le);const V=new Bo,Z=new Yo(j,te,f);for(let re=0;re<f;re+=1)Z.setMatrixAt(re,V);Z.instanceMatrix.needsUpdate=!0,Z.frustumCulled=!1,Z.count=Math.min(A.targetCount,f),me.current=j,ce.current=Z,fe.current=f,at(Z)},[l,te]),g.useEffect(()=>{tt.current=M},[M]),g.useEffect(()=>{q<=M.length||Ct(L=>L.length>=q?L:[...L,...So(q-L.length)])},[q,M.length]),g.useEffect(()=>()=>{Ce.dispose(),me.current?.dispose(),te.dispose(),se.dispose(),tt.current.forEach(L=>L.material.dispose())},[Ce,te,se]),g.useEffect(()=>{for(let L=it.current;L<M.length;L+=1){const A=M[L];A.currentTime=0,A.timeCount=0,A.state=gt,A.isActive=!1,A.flowRatio=1,A.opacity=1,A.currentScale=0,A.offsetX=0,A.offsetY=0,A.offsetZ=0,A.idleStartY=0,A.interactionOffset.set(0,0,0),A.interactionVelocity.set(0,0,0),A.material.uniforms.time.value=0,A.material.uniforms.detail.value=I.lerp(O,E,A.detailRatio),A.material.uniforms.opacity.value=0;const f=ge.current[L];f&&(f.visible=!1,f.position.set(0,0,0),f.scale.setScalar(1e-4))}it.current=M.length},[E,O,M]),Ke((L,A)=>{const X=Math.min(A,br)*1e3*a,j=X/1e3,Q=X/zr,y=Fe.current,le=me.current;if(!y||!le)return;const V=jr(Je,N.current,et,ie,w.current);let Z=ie;for(let o=0;o<V.length;o+=1)Z=Math.max(Z,V[o].radius);const re=Math.max(.25,Z*Nr),r=Math.max(.35,Z*Ir),R=()=>{let o=null;const S=Math.min(q,M.length);for(let ue=0;ue<S;ue+=1)if(!M[ue].isActive){o=M[ue];break}if(!o)return;const H=Math.random();o.radius=I.lerp(P,z,H),o.baseRadius=I.lerp(_,ne,H),o.currentTime=0,o.timeCount=0,o.state=gt,o.isActive=!0,o.flowRatio=1,o.opacity=1,o.currentScale=1e-4,o.offsetX=0,o.offsetY=0,o.offsetZ=0,o.distX=Math.random()*7-4,o.distZ=Math.random()*7-4,o.yRatio=Math.random()*.4+.35,o.animationTimeRatio=Math.random()*.4+.3,o.randFlyX=Math.random()*.1-.05,o.randFlyZ=Math.random()*.1-.05,o.colorTransitionRandom=Math.random()*2e3-1e3,o.detailRatio=Math.random(),o.pathStartT=0,o.idleStartY=0,o.interactionOffset.set(0,0,0),o.interactionVelocity.set(0,0,0),o.material.uniforms.baseRadius.value=o.baseRadius,o.material.uniforms.detail.value=I.lerp(O,E,o.detailRatio),o.material.uniforms.opacity.value=1};if(y.spawnElapsed+=X,y.spawnElapsed>y.spawnInterval){y.spawnElapsed=0,y.spawnInterval=Math.random()*300+50;for(let o=0;o<y.targetCount;o+=1)if(!y.active[o]){const S=o*3;y.active[o]=!0,y.particleTime[o]=0,y.startT[o]=0,he(y.interactionOffsets,S),he(y.interactionVelocities,S);break}}for(Pe.current+=X;Pe.current>=n;)Pe.current-=n,R();M.forEach((o,S)=>{const H=ge.current[S];if(!H||!o.isActive){H&&(H.visible=!1);return}if(o.currentTime+=X,o.timeCount+=X,o.state===gt&&o.currentTime>Wt)o.currentTime-=Wt,o.state=Nt;else if(o.state===Nt&&o.currentTime>Me)o.currentTime-=Me,o.state=Lt;else if(o.state===Lt&&o.currentTime>je)o.currentTime-=je,o.state=Dt;else if(o.state===Dt&&o.currentTime>Zt)o.currentTime-=Zt,o.state=Ot,o.flowRatio=.2,o.idleStartY=o.offsetY;else if(o.state===Ot&&o.currentTime>pt){o.isActive=!1,H.visible=!1,H.scale.setScalar(1e-4),o.interactionOffset.set(0,0,0),o.interactionVelocity.set(0,0,0),o.material.uniforms.opacity.value=0;return}if(o.state===Nt){const pe=o.currentTime/Me,$e=o.currentTime/(Me+je);o.offsetX=o.distX*$*$e,o.offsetZ=o.distZ*$*$e,o.offsetY+=pe*.4*o.yRatio*G*Q,o.currentScale=Math.max(1e-4,pe)}else if(o.state===Lt){const pe=(o.currentTime+Me)/(Me+je);o.offsetX=o.distX*$*pe,o.offsetZ=o.distZ*$*pe,o.offsetY+=(.6*(1-o.currentTime/je)+.2)*o.yRatio*G*Q}else o.state===Dt?(o.flowRatio=.5,o.offsetX+=o.randFlyX*$*Q,o.offsetY+=.2*G*Q,o.offsetZ+=o.randFlyZ*$*Q,o.currentScale+=.003*Q):o.state===Ot&&(o.offsetY=o.idleStartY+o.currentTime/100*G,o.currentScale+=.002*Q,o.currentTime>pt-5e3?o.opacity=1-(o.currentTime-(pt-5e3))/5e3:o.opacity=1);o.material.uniforms.time.value+=5e-4*X*o.animationTimeRatio*o.flowRatio,o.material.uniforms.baseRadius.value=o.baseRadius,o.material.uniforms.detail.value=I.lerp(O,E,o.detailRatio),o.material.uniforms.opacity.value=o.opacity,Zr(o,W);const ue=ht(I.clamp(o.timeCount/Rr,0,1)*s,e);Co(oe,t,ue,{position:Ue,tangent:fo,normal:Ge,binormal:Xe,scale:we}),To.copy(Ge).multiplyScalar(o.offsetX*we.x).addScaledVector(Xe,o.offsetZ*we.z).multiplyScalar(i),lt.copy(Ue).add(To),wo(lt,o.interactionOffset,o.interactionVelocity,V,j,Pr,$r,re,Lr),lt.add(o.interactionOffset),H.visible=!0,H.position.copy(lt),H.scale.setScalar(Math.max(1e-4,i*o.radius*o.currentScale*we.x))}),y.elapsed+=X/1e3;const{positions:F}=y,{colors:B}=y,{sizes:Y}=y;for(let o=0;o<y.active.length;o+=1){const S=o*3;if(B[S]=W.particleColor.r,B[S+1]=W.particleColor.g,B[S+2]=W.particleColor.b,o>=y.targetCount){y.active[o]=!1,y.particleTime[o]=0,Y[o]=0,F[S]=0,F[S+1]=0,F[S+2]=0,he(y.interactionOffsets,S),he(y.interactionVelocities,S);continue}if(!y.active[o]||!ae){Y[o]=0,F[S]=0,F[S+1]=0,F[S+2]=0;continue}if(y.particleTime[o]>jt/1e3){y.active[o]=!1,y.particleTime[o]=0,Y[o]=0,F[S]=0,F[S+1]=0,F[S+2]=0,he(y.interactionOffsets,S),he(y.interactionVelocities,S);continue}const H=ht(I.clamp(y.particleTime[o]*1e3/Mr,0,1)*s,e);Co(oe,t,H,{position:Ue,tangent:fo,normal:Ge,binormal:Xe,scale:we});const ue=m*(y.particleTime[o]/(jt/1e3))+.01*Math.sin(y.elapsed),pe=10*Math.sin(.3*o+y.elapsed+Math.random()/10),$e=(ue*y.moveDest[S]+pe)*$*we.x*i,St=(ue*y.moveDest[S+2]+pe)*$*we.z*i;Y[o]=c*I.lerp(d,C,y.sizeRatios[o])*(3+Math.sin(.4*o+y.elapsed)),nt.set(Ue.x+Ge.x*$e+Xe.x*St,Ue.y+Ge.y*$e+Xe.y*St,Ue.z+Ge.z*$e+Xe.z*St),We.fromArray(y.interactionOffsets,S),It.fromArray(y.interactionVelocities,S),wo(nt,We,It,V,j,Dr,Or,r,kr),We.toArray(y.interactionOffsets,S),It.toArray(y.interactionVelocities,S),F[S]=nt.x+We.x,F[S+1]=nt.y+We.y,F[S+2]=nt.z+We.z,y.particleTime[o]+=j}le.attributes.aPosition.needsUpdate=!0,le.attributes.aColor.needsUpdate=!0,le.attributes.aSize.needsUpdate=!0,ce.current&&(ce.current.visible=ae,ce.current.count=Math.min(y.targetCount,fe.current))}),U.jsxs("group",{ref:N,children:[M.map((L,A)=>U.jsx("mesh",{ref:f=>{ge.current[A]=f},geometry:Ce,material:L.material,frustumCulled:!1,visible:!1},A)),Ee?U.jsx("primitive",{object:Ee}):null]})}function an(t){return Ho(n=>n.gl)?.isWebGPURenderer===!0?U.jsx(qr,{...t}):U.jsx(wr,{...t})}const Wo=`
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
`;Yt.preload(Ht,be("explosion.png"));const Br=`
${Wo}

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
`,Yr=`
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

  float lum = dot(texColor, vec3(0.2126, 0.7152, 0.0722));
  vec3 smokeColor = mix(smokeDarkColor, smokeLightColor, lum);

  vec3 color = mix(texColor, smokeColor, greyscale);
  gl_FragColor = vec4(color, 1.0);
}
`;function sn({position:t=[0,0,0],radius:e=20,detail:a=6,speed:n=1,weight:s=10,noiseFreq:i=.05,noiseAmp:p=5,texturePath:l="explosion.png",animated:m=!0,greyscale:u=!1,smokeLightColor:c="#4a4a58",smokeDarkColor:d="#1a1a22"}){const C=g.useMemo(()=>Date.now(),[]),h=Yt(Ht,be(l)),P=g.useMemo(()=>(h.colorSpace=xt,h),[h]),_=g.useRef({tExplosion:{value:P},time:{value:0},weight:{value:s},noiseFreq:{value:i},noiseAmp:{value:p},greyscale:{value:u?1:0},smokeLightColor:{value:new b(c)},smokeDarkColor:{value:new b(d)}}).current;return _.tExplosion.value=P,_.weight.value=s,_.noiseFreq.value=i,_.noiseAmp.value=p,_.greyscale.value=u?1:0,_.smokeLightColor.value.set(c),_.smokeDarkColor.value.set(d),Ke(()=>{m&&(_.time.value=25e-5*n*(Date.now()-C))}),U.jsxs("mesh",{position:t,children:[U.jsx("icosahedronGeometry",{args:[e,a]}),U.jsx("shaderMaterial",{vertexShader:Br,fragmentShader:Yr,uniforms:_,side:At,toneMapped:!1})]})}_t.preload(be("explosion.png"));function cn({position:t=[0,0,0],radius:e=20,detail:a=6,speed:n=1,weight:s=10,noiseFreq:i=.05,noiseAmp:p=5,texturePath:l="explosion.png",animated:m=!0,greyscale:u=!1,smokeLightColor:c="#4a4a58",smokeDarkColor:d="#1a1a22"}){const C=_t(be(l));g.useEffect(()=>{C.colorSpace=xt,C.needsUpdate=!0},[C]);const h=g.useMemo(()=>({time:D(0),weight:D(s),noiseFreq:D(i),noiseAmp:D(p),greyscale:D(u?1:0),smokeLightColor:D(new b(c)),smokeDarkColor:D(new b(d))}),[]);g.useEffect(()=>{h.weight.value=s,h.noiseFreq.value=i,h.noiseAmp.value=p,h.greyscale.value=u?1:0,h.smokeLightColor.value.set(c),h.smokeDarkColor.value.set(d)},[u,p,i,d,c,h,s]);const P=g.useMemo(()=>{const z=ze(h.time,h.time,h.time),_=Be(Ye.mul(x(.5)).add(z),He(6),x(2),x(.5)).mul(x(.5)).add(x(.5)).clamp(0,1),ne=Be(Qe.mul(h.noiseFreq).add(z.mul(x(2))),He(4),x(2),x(.5)).mul(x(2)).sub(x(1)),O=h.weight.mul(_).mul(x(.1)).add(h.noiseAmp.mul(ne)),E=_.mul(x(.75)).add(x(.15)).clamp(0,1),$=Qt(C,$o(.5,E)).rgb,G=No($,ze(.2126,.7152,.0722)),ae=Te(h.smokeDarkColor,h.smokeLightColor,G),ee=new Bt({side:At,toneMapped:!1});return ee.positionNode=Qe.add(Ye.mul(O)),ee.colorNode=Te($,ae,h.greyscale),ee},[C,h]);return Ke(({clock:z})=>{m&&(h.time.value=z.getElapsedTime()*.25*n)}),U.jsx("mesh",{position:t,material:P,children:U.jsx("icosahedronGeometry",{args:[e,a]})})}const Hr=`
${Wo}

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
`,Qr=`
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
  float v = (1.1 * ao + 1.0) / 1.1;
  vec3 fireColor = texture2D(tExplosion, vec2(0.5, v + r)).rgb;

  float lum = dot(fireColor, vec3(0.2126, 0.7152, 0.0722));
  vec3 fireDesaturated = mix(smokeDarkColor, smokeLightColor, lum);
  vec3 fireResult = mix(fireColor, fireDesaturated, greyscale);

  float heat = clamp(ao * 2.0 + 0.5 + r, 0.0, 1.0);
  vec3 smokeColor = smokeGradient(heat);

  vec3 color = mix(fireResult, smokeColor, vArcT);

  gl_FragColor = vec4(color, 1.0);
}
`;function ln({controlPoints:t=Lo,tubularSegments:e=128,radialSegments:a=64,capSegments:n=16,speed:s=1,weight:i=10,noiseFreq:p=.05,noiseAmp:l=5,animated:m=!0,texturePath:u="explosion.png",smokeLightColor:c="#4a4a58",smokeDarkColor:d="#1a1a22",greyscale:C=!1,position:h=[0,0,0]}){const P=g.useMemo(()=>Date.now(),[]),z=Yt(Ht,be(u)),_=g.useMemo(()=>(z.colorSpace=xt,z),[z]),ne=g.useMemo(()=>{const $=new Tt(t.map(G=>Do(G.position)),!1,"centripetal");return Oo($,t,e,a,n)},[t,e,a,n]),E=g.useRef({tExplosion:{value:_},time:{value:0},weight:{value:i},noiseFreq:{value:p},noiseAmp:{value:l},smokeLightColor:{value:new b(c)},smokeDarkColor:{value:new b(d)},greyscale:{value:C?1:0}}).current;return E.tExplosion.value=_,E.weight.value=i,E.noiseFreq.value=p,E.noiseAmp.value=l,E.smokeLightColor.value.set(c),E.smokeDarkColor.value.set(d),E.greyscale.value=C?1:0,Ke(()=>{m&&(E.time.value=25e-5*s*(Date.now()-P))}),U.jsx("group",{position:h,children:U.jsx("mesh",{geometry:ne,children:U.jsx("shaderMaterial",{vertexShader:Hr,fragmentShader:Qr,uniforms:E,side:At,toneMapped:!1})})})}_t.preload(be("explosion.png"));function un({controlPoints:t=Lo,tubularSegments:e=128,radialSegments:a=64,capSegments:n=16,speed:s=1,weight:i=10,noiseFreq:p=.05,noiseAmp:l=5,animated:m=!0,texturePath:u="explosion.png",smokeLightColor:c="#4a4a58",smokeDarkColor:d="#1a1a22",greyscale:C=!1,position:h=[0,0,0]}){const P=_t(be(u));g.useEffect(()=>{P.colorSpace=xt,P.needsUpdate=!0},[P]);const z=g.useMemo(()=>{const O=new Tt(t.map(E=>Do(E.position)),!1,"centripetal");return Oo(O,t,e,a,n)},[t,e,a,n]),_=g.useMemo(()=>({time:D(0),weight:D(i),noiseFreq:D(p),noiseAmp:D(l),greyscale:D(C?1:0),smokeLightColor:D(new b(c)),smokeDarkColor:D(new b(d))}),[]);g.useEffect(()=>{_.weight.value=i,_.noiseFreq.value=p,_.noiseAmp.value=l,_.greyscale.value=C?1:0,_.smokeLightColor.value.set(c),_.smokeDarkColor.value.set(d)},[C,l,p,d,c,_,i]);const ne=g.useMemo(()=>{const O=dt("arcT","float"),E=ze(_.time,_.time,_.time),$=ze(O.mul(x(2)),O.mul(x(2)),O.mul(x(2))),G=Be(Ye.mul(x(.5)).add($).sub(E),He(6),x(2),x(.5)).mul(x(.5)).add(x(.5)).clamp(0,1),ae=Be(Qe.mul(_.noiseFreq).sub(E.mul(x(2))),He(4),x(2),x(.5)).mul(x(2)).sub(x(1)),ee=_.weight.mul(G).mul(x(.1)).add(_.noiseAmp.mul(ae)),ye=G.mul(x(.75)).add(x(.15)).clamp(0,1),de=Qt(P,$o(.5,ye)).rgb,xe=No(de,ze(.2126,.7152,.0722)),Ae=Te(_.smokeDarkColor,_.smokeLightColor,xe),_e=Te(de,Ae,_.greyscale),Je=G.mul(x(.75)).add(x(.25)).clamp(0,1),et=Te(_.smokeDarkColor,_.smokeLightColor,Je),ie=new Bt({side:At,toneMapped:!1});return ie.positionNode=Qe.add(Ye.mul(ee)),ie.colorNode=Te(_e,et,O),ie},[P,_]);return Ke(({clock:O})=>{m&&(_.time.value=O.getElapsedTime()*.25*s)}),U.jsx("group",{position:h,children:U.jsx("mesh",{geometry:z,material:ne})})}function dn({instances:t,setInstances:e,addInstance:a,sectionLabel:n="Fire And Smoke",instanceLabel:s="Fire And Smoke",keyPrefix:i="fas"}){return{[`Add ${n}`]:Mt(()=>e(p=>[...p,a()])),[`Remove All ${n}`]:Mt(()=>e([])),...t.reduce((p,l,m)=>{const{id:u}=l,c=C=>h=>e(P=>P.map(z=>z.id===u?{...z,config:{...z.config,[C]:h}}:z)),d=C=>h=>e(P=>P.map(z=>z.id===u?{...z,[C]:h}:z));return p[`${s} ${m+1}`]=ot({[`${i}_pos_${u}`]:{label:"Position",value:l.pos,step:.1,onChange:d("pos")},[`${i}_rot_${u}`]:{label:"Rotation",value:l.rot,step:.05,onChange:d("rot")},[`${i}_scale_${u}`]:{label:"Scale",value:l.scale,min:.01,max:10,step:.1,onChange:d("scale")},"FAS Spline Editor":ot({[`${i}_handles_${u}`]:{label:"Show Handles",value:l.showHandles,onChange:d("showHandles")},[`${i}_showSpline_${u}`]:{label:"Show Curve",value:l.showSpline,onChange:d("showSpline")},[`${i}_pointMode_${u}`]:{label:"Transform",value:l.pointMode,options:["translate","scale"],onChange:d("pointMode")},[`${i}_closed_${u}`]:{label:"Closed",value:l.config.closed,onChange:c("closed")}},{collapsed:!0}),"FAS Simulation":ot({[`${i}_timeScale_${u}`]:{label:"Time Scale",value:l.config.timeScale,min:0,max:10,step:.1,onChange:c("timeScale")},[`${i}_spawn_${u}`]:{label:"Spawn Interval",value:l.config.spawnIntervalMs,min:50,max:1e3,step:10,onChange:c("spawnIntervalMs")},[`${i}_pathTravel_${u}`]:{label:"Path Travel",value:l.config.pathTravel,min:0,max:1,step:.01,onChange:c("pathTravel")},[`${i}_worldScale_${u}`]:{label:"World Scale",value:l.config.worldScale,min:.001,max:.1,step:.001,onChange:c("worldScale")},[`${i}_poolSize_${u}`]:{label:"Pool Size",value:l.config.poolSize,min:8,max:160,step:8,onChange:c("poolSize")},[`${i}_particleCount_${u}`]:{label:"Particle Count",value:l.config.particleCount,min:100,max:1e3,step:50,onChange:c("particleCount")},[`${i}_particleSize_${u}`]:{label:"Particle Size",value:l.config.particleSize,min:.05,max:4,step:.05,onChange:c("particleSize")},[`${i}_particleSpread_${u}`]:{label:"Particle Spread",value:l.config.particleSpread,min:0,max:3,step:.05,onChange:c("particleSpread")},[`${i}_particleColor_${u}`]:{label:"Particle Color",value:l.config.particleColor,onChange:c("particleColor")},[`${i}_showParticles_${u}`]:{label:"Show Particles",value:l.config.showParticles,onChange:c("showParticles")}},{collapsed:!0}),"FAS Flame":ot({[`${i}_radiusMin_${u}`]:{label:"Scale Min",value:l.config.radiusMin,min:.05,max:3,step:.01,onChange:c("radiusMin")},[`${i}_radiusMax_${u}`]:{label:"Scale Max",value:l.config.radiusMax,min:.05,max:3,step:.01,onChange:c("radiusMax")},[`${i}_shapeRadiusMin_${u}`]:{label:"Shape Radius Min",value:l.config.shapeRadiusMin,min:1,max:20,step:.1,onChange:c("shapeRadiusMin")},[`${i}_shapeRadiusMax_${u}`]:{label:"Shape Radius Max",value:l.config.shapeRadiusMax,min:1,max:20,step:.1,onChange:c("shapeRadiusMax")},[`${i}_detailMin_${u}`]:{label:"Detail Min",value:l.config.detailMin,min:1,max:12,step:.1,onChange:c("detailMin")},[`${i}_detailMax_${u}`]:{label:"Detail Max",value:l.config.detailMax,min:1,max:12,step:.1,onChange:c("detailMax")},[`${i}_driftScale_${u}`]:{label:"Drift Scale",value:l.config.driftScale,min:0,max:1,step:.01,onChange:c("driftScale")},[`${i}_riseScale_${u}`]:{label:"Rise Scale",value:l.config.riseScale,min:0,max:.1,step:.001,onChange:c("riseScale")}},{collapsed:!0}),"FAS Colors":ot({[`${i}_light2_${u}`]:{label:"Light 2",value:l.config.lightColor2,onChange:c("lightColor2")},[`${i}_light_${u}`]:{label:"Light",value:l.config.lightColor,onChange:c("lightColor")},[`${i}_normal_${u}`]:{label:"Normal",value:l.config.normalColor,onChange:c("normalColor")},[`${i}_dark2_${u}`]:{label:"Dark 2",value:l.config.darkColor2,onChange:c("darkColor2")},[`${i}_grey_${u}`]:{label:"Grey",value:l.config.greyColor,onChange:c("greyColor")},[`${i}_dark_${u}`]:{label:"Dark",value:l.config.darkColor,onChange:c("darkColor")}},{collapsed:!0}),[`${i}_delete_${u}`]:Mt(()=>e(C=>C.filter(h=>h.id!==u)),{label:"Delete Instance"})},{collapsed:!0}),p},{})}}export{an as F,sn as P,ko as a,dn as b,on as c,nn as d,cn as e,ln as f,un as g,rn as m};
