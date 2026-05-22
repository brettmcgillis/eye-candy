import{V as b,a4 as We,r as C,bo as so,aF as Ke,a5 as He,$ as lo,p as k,a6 as Je,U as we,X as Me,o as ke,j as Z,ad as co,aI as uo,ay as vo,M as K,l as Le,bn as Ie,T as Ne,aS as Qe,t as eo,b0 as Se,K as de,J as be}from"./index-ByL4sTkr.js";const ie=(t,o,i)=>new b(t,o,i),se=(t,o,i)=>new We(t,o,i),le=(t,o,i)=>new b(t,o,i),oo={lightColor2:"#ff8700",lightColor:"#f7f342",normalColor:"#f7a90e",darkColor2:"#ff9800",greyColor:"#3c342f",darkColor:"#181818",particleColor:"#ffb400"},go={lightColor2:"#d0cbc5",lightColor:"#a9a298",normalColor:"#6f675f",darkColor2:"#4a443f",greyColor:"#3c342f",darkColor:"#181818",particleColor:"#9b9388"},to=[{position:ie(0,0,0),rotation:se(0,0,0),scale:le(1,1,1)},{position:ie(0,.9,0),rotation:se(0,0,0),scale:le(1,1,1)},{position:ie(0,1.8,0),rotation:se(0,0,0),scale:le(1,1,1)},{position:ie(0,2.7,0),rotation:se(0,0,0),scale:le(1,1,1)},{position:ie(0,3.6,0),rotation:se(0,0,0),scale:le(1,1,1)},{position:ie(0,4.5,0),rotation:se(0,0,0),scale:le(1,1,1)}],p={closed:!1,timeScale:3,spawnIntervalMs:200,pathTravel:1,worldScale:.01,poolSize:160,particleCount:500,particleSpread:1,particleSizeMin:.5,particleSizeMax:1.5,particlePointScale:30,radiusMin:1,radiusMax:1,shapeRadiusMin:8,shapeRadiusMax:13,detailMin:5,detailMax:8.5,driftScale:1,riseScale:1,showParticles:!0,...oo};function Lo(t=to){return t.map(o=>({position:o.position.clone(),rotation:(o.rotation??new We).clone(),scale:(o.scale??new b(1,1,1)).clone()}))}function ao(t={}){return{...p,...t}}function Io(t={}){return ao({...oo,...t})}function No(t={}){return ao({...go,...t})}const xe=0,Te=1,Ae=2,Pe=3,Re=4,Ee=300,te=400,ge=2e3,Fe=8e3,he=2e4,$e=2e4,ro=Ee+te+ge+Fe+he,fo=ro,mo=$e,po=1e3/60,De=256,xo=.05,ho=`
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
`,yo=`
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
`,Co=`
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
`,zo=`
uniform sampler2D map;
varying vec3 vColor;

void main() {
  vec4 texel = texture2D(map, gl_PointCoord);
  if (texel.a < 0.01) discard;
  gl_FragColor = vec4(vColor, 1.0) * texel;
}
`,ce=new b,Oe=new b,je=new b,Ue=new b,Ve=new b,Ge=new b,oe=new b,ue=new b,ve=new b,Xe=new b,Be=new b,pe=new b(1,1,1);function ye(t,o){return o?(t%1+1)%1:K.clamp(t,0,1)}function _o(t,o,i,a){const u=t.length;if(!u)return a.copy(pe),a;if(u===1)return a.copy(t[0].scale??pe),a;const r=ye(o,i),x=i?u:u-1,n=Math.min(r*x,x-1e-6),h=Math.floor(n),s=n-h,l=t[h%u].scale??pe,v=t[(h+1)%u].scale??pe;return a.copy(l).lerp(v,s),a}function Ze(t,o,i,a){const u=ye(i,t.closed),{curve:r,frames:x}=t,n=u*De,h=Math.floor(n),s=Math.min(h+1,De),l=n-h;r.getPointAt(u,a.position),r.getTangentAt(u,a.tangent).normalize(),je.copy(x.normals[h]),Ue.copy(x.normals[s]),Ve.copy(x.binormals[h]),Ge.copy(x.binormals[s]),a.normal.copy(je).lerp(Ue,l).normalize(),a.binormal.copy(Ve).lerp(Ge,l).normalize(),_o(o,u,t.closed,a.scale)}function wo(){const o=document.createElement("canvas");o.width=128,o.height=128;const i=o.getContext("2d");if(!i)return new co;const a=i.createRadialGradient(128*.5,128*.5,0,128*.5,128*.5,128*.48);a.addColorStop(0,"rgba(255,255,255,1)"),a.addColorStop(.35,"rgba(255,255,255,0.75)"),a.addColorStop(.7,"rgba(255,255,255,0.22)"),a.addColorStop(1,"rgba(255,255,255,0)"),i.clearRect(0,0,128,128),i.fillStyle=a,i.fillRect(0,0,128,128);const u=new uo(o);return u.needsUpdate=!0,u.colorSpace=vo,u}function Mo(t,o){return new He({uniforms:{time:{value:0},seed:{value:t},detail:{value:o},baseRadius:{value:10.5},opacity:{value:1},colLight:{value:new k("#ffffff")},colNormal:{value:new k("#ffffff")},colDark:{value:new k("#000000")}},vertexShader:ho,fragmentShader:yo,transparent:!0,depthWrite:!1,toneMapped:!1})}function So(t,o,i){return Array.from({length:t},()=>({material:Mo(Math.random()*1e3,K.lerp(o,i,Math.random())),radius:0,baseRadius:10.5,currentTime:0,timeCount:0,state:xe,isActive:!1,flowRatio:1,opacity:1,currentScale:0,offsetX:0,offsetY:0,offsetZ:0,distX:0,distZ:0,yRatio:0,animationTimeRatio:0,randFlyX:0,randFlyZ:0,colorTransitionRandom:0,pathStartT:0,idleStartY:0}))}function Ye(t,o,i){const a=new Float32Array(t*3),u=new Float32Array(t*3),r=new Float32Array(t),x=new Float32Array(t),n=new Float32Array(t*3),h=new Float32Array(t),s=new Array(t).fill(!1),l=new Float32Array(t);for(let v=0;v<t;v+=1){const y=v*3;n[y]=Math.random()*200-100,n[y+1]=Math.random()*.3+.45,n[y+2]=Math.random()*200-100;const w=K.lerp(o,i,Math.random());r[v]=0,x[v]=w}return{positions:a,colors:u,sizes:r,originalSizes:x,moveDest:n,particleTime:h,active:s,startT:l,elapsed:0,spawnElapsed:0,spawnInterval:1}}function bo(t){t.elapsed=0,t.spawnElapsed=0,t.spawnInterval=1;for(let o=0;o<t.active.length;o+=1){const i=o*3;t.positions[i]=0,t.positions[i+1]=0,t.positions[i+2]=0,t.sizes[o]=0,t.particleTime[o]=0,t.active[o]=!1,t.startT[o]=0}}function O(t,o,i,a){t.copy(o).lerp(i,a)}function To(t,o){const i=t.timeCount+t.colorTransitionRandom,{uniforms:a}=t.material;if(i<2500){a.colDark.value.copy(o.normalColor),a.colNormal.value.copy(o.lightColor),a.colLight.value.copy(o.lightColor2);return}if(i<4e3){O(a.colDark.value,o.normalColor,o.darkColor2,(i-2500)/1500),O(a.colNormal.value,o.lightColor,o.normalColor,(i-2500)/1500),O(a.colLight.value,o.lightColor2,o.lightColor,(i-2500)/1500);return}if(i<7e3){a.colDark.value.copy(o.darkColor2),a.colNormal.value.copy(o.normalColor),a.colLight.value.copy(o.lightColor);return}if(i<12e3){const r=(i-7e3)/5e3;O(a.colDark.value,o.darkColor2,o.darkColor,r),O(a.colNormal.value,o.normalColor,o.darkColor2,r),O(a.colLight.value,o.lightColor,o.normalColor,r);return}if(i<17e3){const r=(i-12e3)/5e3;O(a.colDark.value,o.darkColor,o.darkColor,r),O(a.colNormal.value,o.darkColor2,o.darkColor,r),O(a.colLight.value,o.normalColor,o.darkColor2,r);return}const u=K.clamp((i-17e3)/6e3,0,1);O(a.colDark.value,o.darkColor,o.greyColor,u),O(a.colNormal.value,o.darkColor,o.greyColor,u),O(a.colLight.value,o.darkColor2,o.darkColor,u)}function Oo({controlPoints:t=to,closed:o=p.closed,timeScale:i=p.timeScale,spawnIntervalMs:a=p.spawnIntervalMs,pathTravel:u=p.pathTravel,worldScale:r=p.worldScale,poolSize:x=p.poolSize,particleCount:n=p.particleCount,particleSpread:h=p.particleSpread,particleColor:s=p.particleColor,particleSizeMin:l=p.particleSizeMin,particleSizeMax:v=p.particleSizeMax,particlePointScale:y=p.particlePointScale,radiusMin:w=p.radiusMin,radiusMax:L=p.radiusMax,shapeRadiusMin:z=p.shapeRadiusMin,shapeRadiusMax:c=p.shapeRadiusMax,detailMin:g=p.detailMin,detailMax:T=p.detailMax,driftScale:f=p.driftScale,riseScale:_=p.riseScale,showParticles:F=p.showParticles,lightColor2:M=p.lightColor2,lightColor:H=p.lightColor,normalColor:$=p.normalColor,darkColor2:X=p.darkColor2,greyColor:P=p.greyColor,darkColor:D=p.darkColor}){const V=C.useMemo(()=>new so(1,3),[]),Y=C.useMemo(()=>wo(),[]),A=C.useMemo(()=>new Ke,[n]),R=C.useMemo(()=>new He({uniforms:{map:{value:Y},pointScale:{value:y}},vertexShader:Co,fragmentShader:zo,transparent:!0,depthTest:!1,depthWrite:!1,blending:lo,toneMapped:!1}),[y,Y]),q=Math.max(x,Math.ceil(ro/Math.max(1,a))+1),E=C.useMemo(()=>So(q,g,T),[q,g,T]),I=C.useRef(null);I.current||(I.current=Ye(n,l,v));const j=C.useRef([]),ae=C.useRef(),J=C.useRef(0),re=C.useMemo(()=>({lightColor2:new k(M),lightColor:new k(H),normalColor:new k($),darkColor2:new k(X),greyColor:new k(P),darkColor:new k(D),particleColor:new k(s)}),[M,H,$,X,P,D,s]),fe=C.useMemo(()=>{const d=t.length>1?t.map(U=>U.position.clone()):[new b(0,0,0),new b(0,1,0)],G=new Je(d,o,"centripetal");return{curve:G,frames:G.computeFrenetFrames(De,o),length:Math.max(G.getLength(),1e-4),closed:o}},[t,o]);return C.useEffect(()=>{const d=Ye(n,l,v);I.current=d,A.setAttribute("position",new we(d.positions,3).setUsage(Me)),A.setAttribute("customColor",new we(d.colors,3).setUsage(Me)),A.setAttribute("size",new we(d.sizes,1).setUsage(Me)),A.attributes.position.needsUpdate=!0,A.attributes.customColor.needsUpdate=!0,A.attributes.size.needsUpdate=!0},[n,A,v,l]),C.useEffect(()=>{const d=R.uniforms;d.pointScale.value=y},[R,y]),C.useEffect(()=>()=>{V.dispose(),A.dispose(),R.dispose(),Y.dispose(),E.forEach(d=>d.material.dispose())},[E,V,A,R,Y]),C.useEffect(()=>{J.current=0,bo(I.current),E.forEach((d,G)=>{d.currentTime=0,d.timeCount=0,d.state=xe,d.isActive=!1,d.flowRatio=1,d.opacity=1,d.currentScale=0,d.offsetX=0,d.offsetY=0,d.offsetZ=0,d.idleStartY=0,d.material.uniforms.time.value=0,d.material.uniforms.opacity.value=0;const U=j.current[G];U&&(U.visible=!1,U.position.set(0,0,0),U.scale.setScalar(1e-4))})},[fe,E]),ke((d,G)=>{const U=Math.min(G,xo)*1e3,Q=U*i,ee=Q/po,m=I.current,io=()=>{const e=E.find(N=>!N.isActive);if(!e)return;const S=Math.random();e.radius=K.lerp(w,L,S),e.baseRadius=K.lerp(z,c,S),e.currentTime=0,e.timeCount=0,e.state=xe,e.isActive=!0,e.flowRatio=1,e.opacity=1,e.currentScale=1e-4,e.offsetX=0,e.offsetY=0,e.offsetZ=0,e.distX=Math.random()*7-4,e.distZ=Math.random()*7-4,e.yRatio=Math.random()*.4+.35,e.animationTimeRatio=Math.random()*.4+.3,e.randFlyX=Math.random()*.1-.05,e.randFlyZ=Math.random()*.1-.05,e.colorTransitionRandom=Math.random()*2e3-1e3,e.pathStartT=0,e.idleStartY=0,e.material.uniforms.baseRadius.value=e.baseRadius,e.material.uniforms.opacity.value=1};if(m.spawnElapsed+=Q,m.spawnElapsed>m.spawnInterval){m.spawnElapsed=0,m.spawnInterval=Math.random()*300+50;for(let e=0;e<m.active.length;e+=1)if(!m.active[e]){m.active[e]=!0,m.particleTime[e]=0,m.startT[e]=0;break}}for(J.current+=Q;J.current>=a;)J.current-=a,io();E.forEach((e,S)=>{const N=j.current[S];if(!N||!e.isActive){N&&(N.visible=!1);return}if(e.currentTime+=Q,e.timeCount+=Q,e.state===xe&&e.currentTime>Ee)e.currentTime-=Ee,e.state=Te;else if(e.state===Te&&e.currentTime>te)e.currentTime-=te,e.state=Ae;else if(e.state===Ae&&e.currentTime>ge)e.currentTime-=ge,e.state=Pe;else if(e.state===Pe&&e.currentTime>Fe)e.currentTime-=Fe,e.state=Re,e.flowRatio=.2,e.idleStartY=e.offsetY;else if(e.state===Re&&e.currentTime>he){e.isActive=!1,N.visible=!1,N.scale.setScalar(1e-4),e.material.uniforms.opacity.value=0;return}if(e.state===Te){const W=e.currentTime/te,ne=e.currentTime/(te+ge);e.offsetX=e.distX*f*ne,e.offsetZ=e.distZ*f*ne,e.offsetY+=W*.4*e.yRatio*_*ee,e.currentScale=Math.max(1e-4,W)}else if(e.state===Ae){const W=(e.currentTime+te)/(te+ge);e.offsetX=e.distX*f*W,e.offsetZ=e.distZ*f*W,e.offsetY+=(.6*(1-e.currentTime/ge)+.2)*e.yRatio*_*ee}else e.state===Pe?(e.flowRatio=.5,e.offsetX+=e.randFlyX*f*ee,e.offsetY+=.2*_*ee,e.offsetZ+=e.randFlyZ*f*ee,e.currentScale+=.003*ee):e.state===Re&&(e.offsetY=e.idleStartY+e.currentTime/100*_,e.currentScale+=.002*ee,e.currentTime>he-5e3?e.opacity=1-(e.currentTime-(he-5e3))/5e3:e.opacity=1);e.material.uniforms.time.value+=5e-4*Q*e.animationTimeRatio*e.flowRatio,e.material.uniforms.baseRadius.value=e.baseRadius,e.material.uniforms.opacity.value=e.opacity,To(e,re);const me=ye(K.clamp(e.timeCount/fo,0,1)*u,o);Ze(fe,t,me,{position:ce,tangent:Oe,normal:ue,binormal:ve,scale:oe}),Xe.copy(ue).multiplyScalar(e.offsetX*oe.x).addScaledVector(ve,e.offsetZ*oe.z).multiplyScalar(r),Be.copy(ce).add(Xe),N.visible=!0,N.position.copy(Be),N.scale.setScalar(Math.max(1e-4,r*e.radius*e.currentScale*oe.x))}),m.elapsed+=Q/1e3;const{positions:B}=m,{colors:Ce}=m,{sizes:ze}=m;for(let e=0;e<m.active.length;e+=1){const S=e*3;if(Ce[S]=re.particleColor.r,Ce[S+1]=re.particleColor.g,Ce[S+2]=re.particleColor.b,!m.active[e]||!F){ze[e]=0,B[S]=0,B[S+1]=0,B[S+2]=0;continue}if(m.particleTime[e]>$e/1e3){m.active[e]=!1,m.particleTime[e]=0,ze[e]=0,B[S]=0,B[S+1]=0,B[S+2]=0;continue}const N=ye(K.clamp(m.particleTime[e]*1e3/mo,0,1)*u,o);Ze(fe,t,N,{position:ce,tangent:Oe,normal:ue,binormal:ve,scale:oe});const me=h*(m.particleTime[e]/($e/1e3))+.01*Math.sin(m.elapsed),W=10*Math.sin(.3*e+m.elapsed+Math.random()/10),ne=(me*m.moveDest[S]+W)*f*oe.x*r,_e=(me*m.moveDest[S+2]+W)*f*oe.z*r;ze[e]=m.originalSizes[e]*(3+Math.sin(.4*e+m.elapsed)),B[S]=ce.x+ue.x*ne+ve.x*_e,B[S+1]=ce.y+ue.y*ne+ve.y*_e,B[S+2]=ce.z+ue.z*ne+ve.z*_e,m.particleTime[e]+=U*i/1e3}A.attributes.position.needsUpdate=!0,A.attributes.customColor.needsUpdate=!0,A.attributes.size.needsUpdate=!0,ae.current&&(ae.current.visible=F)}),Z.jsxs("group",{children:[E.map((d,G)=>Z.jsx("mesh",{ref:U=>{j.current[G]=U},geometry:V,material:d.material,frustumCulled:!1,visible:!1},G)),Z.jsx("points",{ref:ae,geometry:A,material:R,frustumCulled:!1})]})}const no=`
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
`;Le.preload(Ne,Ie("explosion.png"));const Ao=`
${no}

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
`,Po=`
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
`;function jo({position:t=[0,0,0],radius:o=20,detail:i=6,speed:a=1,weight:u=10,noiseFreq:r=.05,noiseAmp:x=5,texturePath:n="explosion.png",animated:h=!0,greyscale:s=!1,smokeLightColor:l="#4a4a58",smokeDarkColor:v="#1a1a22"}){const y=C.useMemo(()=>Date.now(),[]),w=Le(Ne,Ie(n)),L=C.useMemo(()=>(w.colorSpace=Qe,w),[w]),c=C.useRef({tExplosion:{value:L},time:{value:0},weight:{value:u},noiseFreq:{value:r},noiseAmp:{value:x},greyscale:{value:s?1:0},smokeLightColor:{value:new k(l)},smokeDarkColor:{value:new k(v)}}).current;return c.tExplosion.value=L,c.weight.value=u,c.noiseFreq.value=r,c.noiseAmp.value=x,c.greyscale.value=s?1:0,c.smokeLightColor.value.set(l),c.smokeDarkColor.value.set(v),ke(()=>{h&&(c.time.value=25e-5*a*(Date.now()-y))}),Z.jsxs("mesh",{position:t,children:[Z.jsx("icosahedronGeometry",{args:[o,i]}),Z.jsx("shaderMaterial",{vertexShader:Ao,fragmentShader:Po,uniforms:c,side:eo,toneMapped:!1})]})}const Ro=`
${no}

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
`,Eo=`
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
`,Fo=[{position:[0,0,0],radius:.7},{position:[0,.9,0],radius:.65},{position:[.05,1.8,0],radius:.72},{position:[.1,2.7,.05],radius:.95},{position:[.15,3.5,.1],radius:1.25},{position:[.2,4.2,.15],radius:1.6}],qe=Math.PI*2;function $o(t){return Array.isArray(t)?new b(t[0],t[1],t[2]):new b(t.x??0,t.y??0,t.z??0)}function Do(t,o,i,a,u){const r=o.length,x=o.map(c=>c.radius??1),n=t.computeFrenetFrames(i,!1),h=[],s=[],l=[],v=[],y=a+1;function w(c){const g=c*(r-1),T=Math.floor(g),f=Math.min(T+1,r-1),_=g-T;return x[T]*(1-_)+x[f]*_}for(let c=0;c<=i;c++){const g=c/i,T=t.getPointAt(g),f=n.normals[c],_=n.binormals[c],F=w(g);for(let M=0;M<=a;M++){const H=M/a*qe,$=Math.sin(H),X=-Math.cos(H),P=X*f.x+$*_.x,D=X*f.y+$*_.y,V=X*f.z+$*_.z;h.push(T.x+F*P,T.y+F*D,T.z+F*V),s.push(P,D,V),l.push(g)}}for(let c=0;c<i;c++)for(let g=0;g<a;g++){const T=c*y+g,f=(c+1)*y+g,_=(c+1)*y+(g+1),F=c*y+(g+1);v.push(T,f,F,f,_,F)}function L(c,g,T,f,_,F,M,H){let $=H;for(let P=1;P<=u;P++){const D=Math.PI/2*(P/u),V=_*Math.cos(D),Y=M*_*Math.sin(D),A=h.length/3;for(let R=0;R<=a;R++){const q=R/a*qe,E=Math.sin(q),I=-Math.cos(q),j=I*T.x+E*f.x,ae=I*T.y+E*f.y,J=I*T.z+E*f.z,re=Math.cos(D)*j+Math.sin(D)*M*g.x,fe=Math.cos(D)*ae+Math.sin(D)*M*g.y,d=Math.cos(D)*J+Math.sin(D)*M*g.z;h.push(c.x+Y*g.x+V*j,c.y+Y*g.y+V*ae,c.z+Y*g.z+V*J),s.push(re,fe,d),l.push(F)}for(let R=0;R<a;R++){const q=$+R,E=A+R,I=A+(R+1),j=$+(R+1);M>0?v.push(q,E,j,E,I,j):v.push(q,j,E,E,j,I)}$=A}const X=h.length/3;h.push(c.x+M*_*g.x,c.y+M*_*g.y,c.z+M*_*g.z),s.push(M*g.x,M*g.y,M*g.z),l.push(F);for(let P=0;P<a;P++)M>0?v.push($+P,X,$+P+1):v.push($+P,$+P+1,X)}L(t.getPointAt(0),t.getTangentAt(0),n.normals[0],n.binormals[0],w(0),0,-1,0),L(t.getPointAt(1),t.getTangentAt(1),n.normals[i],n.binormals[i],w(1),1,1,i*y);const z=new Ke;return z.setIndex(v),z.setAttribute("position",new Se(h,3)),z.setAttribute("normal",new Se(s,3)),z.setAttribute("arcT",new Se(l,1)),z}function Uo({controlPoints:t=Fo,tubularSegments:o=128,radialSegments:i=64,capSegments:a=16,speed:u=1,weight:r=10,noiseFreq:x=.05,noiseAmp:n=5,animated:h=!0,texturePath:s="explosion.png",smokeLightColor:l="#4a4a58",smokeDarkColor:v="#1a1a22",greyscale:y=!1,position:w=[0,0,0]}){const L=C.useMemo(()=>Date.now(),[]),z=Le(Ne,Ie(s)),c=C.useMemo(()=>(z.colorSpace=Qe,z),[z]),g=C.useMemo(()=>{const _=new Je(t.map(F=>$o(F.position)),!1,"centripetal");return Do(_,t,o,i,a)},[t,o,i,a]),f=C.useRef({tExplosion:{value:c},time:{value:0},weight:{value:r},noiseFreq:{value:x},noiseAmp:{value:n},smokeLightColor:{value:new k(l)},smokeDarkColor:{value:new k(v)},greyscale:{value:y?1:0}}).current;return f.tExplosion.value=c,f.weight.value=r,f.noiseFreq.value=x,f.noiseAmp.value=n,f.smokeLightColor.value.set(l),f.smokeDarkColor.value.set(v),f.greyscale.value=y?1:0,ke(()=>{h&&(f.time.value=25e-5*u*(Date.now()-L))}),Z.jsx("group",{position:w,children:Z.jsx("mesh",{geometry:g,children:Z.jsx("shaderMaterial",{vertexShader:Ro,fragmentShader:Eo,uniforms:f,side:eo,toneMapped:!1})})})}function Vo({instances:t,setInstances:o,addInstance:i,sectionLabel:a="Fire And Smoke",instanceLabel:u="Fire And Smoke",keyPrefix:r="fas"}){return{[`Add ${a}`]:be(()=>o(x=>[...x,i()])),[`Remove All ${a}`]:be(()=>o([])),...t.reduce((x,n,h)=>{const{id:s}=n,l=y=>w=>o(L=>L.map(z=>z.id===s?{...z,config:{...z.config,[y]:w}}:z)),v=y=>w=>o(L=>L.map(z=>z.id===s?{...z,[y]:w}:z));return x[`${u} ${h+1}`]=de({[`${r}_pos_${s}`]:{label:"Position",value:n.pos,step:.1,onChange:v("pos")},[`${r}_rot_${s}`]:{label:"Rotation",value:n.rot,step:.05,onChange:v("rot")},[`${r}_scale_${s}`]:{label:"Scale",value:n.scale,min:.01,max:10,step:.1,onChange:v("scale")},"FAS Spline Editor":de({[`${r}_handles_${s}`]:{label:"Show Handles",value:n.showHandles,onChange:v("showHandles")},[`${r}_showSpline_${s}`]:{label:"Show Curve",value:n.showSpline,onChange:v("showSpline")},[`${r}_pointMode_${s}`]:{label:"Transform",value:n.pointMode,options:["translate","scale"],onChange:v("pointMode")},[`${r}_closed_${s}`]:{label:"Closed",value:n.config.closed,onChange:l("closed")}},{collapsed:!0}),"FAS Simulation":de({[`${r}_timeScale_${s}`]:{label:"Time Scale",value:n.config.timeScale,min:0,max:10,step:.1,onChange:l("timeScale")},[`${r}_spawn_${s}`]:{label:"Spawn Interval",value:n.config.spawnIntervalMs,min:50,max:1e3,step:10,onChange:l("spawnIntervalMs")},[`${r}_pathTravel_${s}`]:{label:"Path Travel",value:n.config.pathTravel,min:0,max:1,step:.01,onChange:l("pathTravel")},[`${r}_worldScale_${s}`]:{label:"World Scale",value:n.config.worldScale,min:.001,max:.1,step:.001,onChange:l("worldScale")},[`${r}_poolSize_${s}`]:{label:"Pool Size",value:n.config.poolSize,min:8,max:160,step:8,onChange:l("poolSize")},[`${r}_particleCount_${s}`]:{label:"Particle Count",value:n.config.particleCount,min:100,max:1e3,step:50,onChange:l("particleCount")},[`${r}_particleSpread_${s}`]:{label:"Particle Spread",value:n.config.particleSpread,min:0,max:3,step:.05,onChange:l("particleSpread")},[`${r}_particleColor_${s}`]:{label:"Particle Color",value:n.config.particleColor,onChange:l("particleColor")},[`${r}_showParticles_${s}`]:{label:"Show Particles",value:n.config.showParticles,onChange:l("showParticles")}},{collapsed:!0}),"FAS Flame":de({[`${r}_radiusMin_${s}`]:{label:"Scale Min",value:n.config.radiusMin,min:.05,max:3,step:.01,onChange:l("radiusMin")},[`${r}_radiusMax_${s}`]:{label:"Scale Max",value:n.config.radiusMax,min:.05,max:3,step:.01,onChange:l("radiusMax")},[`${r}_shapeRadiusMin_${s}`]:{label:"Shape Radius Min",value:n.config.shapeRadiusMin,min:1,max:20,step:.1,onChange:l("shapeRadiusMin")},[`${r}_shapeRadiusMax_${s}`]:{label:"Shape Radius Max",value:n.config.shapeRadiusMax,min:1,max:20,step:.1,onChange:l("shapeRadiusMax")},[`${r}_detailMin_${s}`]:{label:"Detail Min",value:n.config.detailMin,min:1,max:12,step:.1,onChange:l("detailMin")},[`${r}_detailMax_${s}`]:{label:"Detail Max",value:n.config.detailMax,min:1,max:12,step:.1,onChange:l("detailMax")},[`${r}_driftScale_${s}`]:{label:"Drift Scale",value:n.config.driftScale,min:0,max:1,step:.01,onChange:l("driftScale")},[`${r}_riseScale_${s}`]:{label:"Rise Scale",value:n.config.riseScale,min:0,max:.1,step:.001,onChange:l("riseScale")}},{collapsed:!0}),"FAS Colors":de({[`${r}_light2_${s}`]:{label:"Light 2",value:n.config.lightColor2,onChange:l("lightColor2")},[`${r}_light_${s}`]:{label:"Light",value:n.config.lightColor,onChange:l("lightColor")},[`${r}_normal_${s}`]:{label:"Normal",value:n.config.normalColor,onChange:l("normalColor")},[`${r}_dark2_${s}`]:{label:"Dark 2",value:n.config.darkColor2,onChange:l("darkColor2")},[`${r}_grey_${s}`]:{label:"Grey",value:n.config.greyColor,onChange:l("greyColor")},[`${r}_dark_${s}`]:{label:"Dark",value:n.config.darkColor,onChange:l("darkColor")}},{collapsed:!0}),[`${r}_delete_${s}`]:be(()=>o(y=>y.filter(w=>w.id!==s)),{label:"Delete Instance"})},{collapsed:!0}),x},{})}}export{Oo as F,jo as P,ao as a,Vo as b,Lo as c,No as d,Uo as e,Io as m};
