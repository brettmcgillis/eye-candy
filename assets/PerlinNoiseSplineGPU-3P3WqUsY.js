import{r as C,l as Q,bo as B,T as X,aR as H,p as V,o as W,j as _,t as Z,aS as ne,V as se,aE as ye,b0 as K,aF as re}from"./index-DBD_Xnl5.js";import{F as Y,j as F,f as i,L as he,k as ze,l as Pe,i as q,u as A,ac as $,Z as S,r as ie,v as le,_ as ce,W as we}from"./three.tsl-CE3109Li.js";import{u as J}from"./Texture-n3deFDtq.js";const me=`
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
`;Q.preload(X,B("explosion.png"));const Ce=`
${me}

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
`,ke=`
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
`;function _e({position:o=[0,0,0],radius:z=20,detail:l=6,speed:r=1,weight:g=10,noiseFreq:c=.05,noiseAmp:x=5,texturePath:p="explosion.png",animated:T=!0,greyscale:k=!1,smokeLightColor:d="#4a4a58",smokeDarkColor:f="#1a1a22"}){const v=C.useMemo(()=>Date.now(),[]),s=Q(X,B(p)),M=C.useMemo(()=>(s.colorSpace=H,s),[s]),e=C.useRef({tExplosion:{value:M},time:{value:0},weight:{value:g},noiseFreq:{value:c},noiseAmp:{value:x},greyscale:{value:k?1:0},smokeLightColor:{value:new V(d)},smokeDarkColor:{value:new V(f)}}).current;return e.tExplosion.value=M,e.weight.value=g,e.noiseFreq.value=c,e.noiseAmp.value=x,e.greyscale.value=k?1:0,e.smokeLightColor.value.set(d),e.smokeDarkColor.value.set(f),W(()=>{T&&(e.time.value=25e-5*r*(Date.now()-v))}),_.jsxs("mesh",{position:o,children:[_.jsx("icosahedronGeometry",{args:[z,l]}),_.jsx("shaderMaterial",{vertexShader:Ce,fragmentShader:ke,uniforms:e,side:Z,toneMapped:!1})]})}const Me=6,ee=Y(([o])=>ze(F(o),Pe(1),i(2),i(.5))).setLayout({name:"signedPerlinApprox",type:"float",inputs:[{name:"input",type:"vec3"}]}),ue=Y(([o])=>{const z=F(o).toVar(),l=i(-.5).toVar();return he({start:i(1),end:i(Me),type:"float",condition:"<="},({i:r})=>{const g=i(2).pow(r).toVar(),c=ee(z.mul(g)).toVar();l.addAssign(c.abs().div(g))}),l}).setLayout({name:"approximateTurbulence",type:"float",inputs:[{name:"input",type:"vec3"}]}),Te=Y(([o,z,l])=>{const r=i(o).clamp(0,1).toVar(),g=F(z).toVar(),c=F(l).toVar(),x=q(g,c,r.mul(2).clamp(0,1)),p=q(c,c.add(F(.1,.1,.1)),r.sub(.5).mul(2).clamp(0,1));return r.lessThan(.5).select(x,p)}).setLayout({name:"smokeGradient",type:"vec3",inputs:[{name:"heatInput",type:"float"},{name:"smokeDarkColorInput",type:"vec3"},{name:"smokeLightColorInput",type:"vec3"}]});J.preload(B("explosion.png"));function Fe({position:o=[0,0,0],radius:z=20,detail:l=6,speed:r=1,weight:g=10,noiseFreq:c=.05,noiseAmp:x=5,texturePath:p="explosion.png",animated:T=!0,greyscale:k=!1,smokeLightColor:d="#4a4a58",smokeDarkColor:f="#1a1a22"}){const v=J(B(p));C.useEffect(()=>{v.colorSpace=H,v.needsUpdate=!0},[v]);const s=C.useMemo(()=>({time:A(0),weight:A(g),noiseFreq:A(c),noiseAmp:A(x),greyscale:A(k?1:0),smokeLightColor:A(new V(d)),smokeDarkColor:A(new V(f))}),[]);C.useEffect(()=>{s.weight.value=g,s.noiseFreq.value=c,s.noiseAmp.value=x,s.greyscale.value=k?1:0,s.smokeLightColor.value.set(d),s.smokeDarkColor.value.set(f)},[k,x,c,f,d,s,g]);const M=C.useMemo(()=>{const y=F(s.time,s.time,s.time),e=ue($.mul(i(.5)).add(y)),t=e.toVarying("vPerlinNoiseBallAo"),n=ee(S.mul(s.noiseFreq).add(y.mul(i(2)))),a=s.weight.mul(e).add(s.noiseAmp.mul(n)),m=t.mul(i(1.1)).add(i(1)).div(i(1.1)).clamp(0,1),P=ie(v,le(.5,m)).rgb,u=ce(P,F(.2126,.7152,.0722)),j=q(s.smokeDarkColor,s.smokeLightColor,u),h=new ne({side:Z,toneMapped:!1});return h.positionNode=S.add($.mul(a)),h.colorNode=q(P,j,s.greyscale),h},[v,s]);return W(({clock:y})=>{T&&(s.time.value=y.getElapsedTime()*.25*r)}),_.jsx("mesh",{position:o,material:M,children:_.jsx("icosahedronGeometry",{args:[z,l]})})}const fe=[{position:[0,0,0],radius:.7},{position:[0,.9,0],radius:.65},{position:[.05,1.8,0],radius:.72},{position:[.1,2.7,.05],radius:.95},{position:[.15,3.5,.1],radius:1.25},{position:[.2,4.2,.15],radius:1.6}],ae=Math.PI*2;function ve(o){return Array.isArray(o)?new se(o[0],o[1],o[2]):new se(o.x??0,o.y??0,o.z??0)}function pe(o,z,l,r,g){const c=z.length,x=z.map(e=>e.radius??1),p=o.computeFrenetFrames(l,!1),T=[],k=[],d=[],f=[],v=r+1;function s(e){const t=e*(c-1),n=Math.floor(t),a=Math.min(n+1,c-1),m=t-n;return x[n]*(1-m)+x[a]*m}for(let e=0;e<=l;e+=1){const t=e/l,n=o.getPointAt(t),a=p.normals[e],m=p.binormals[e],P=s(t);for(let u=0;u<=r;u+=1){const j=u/r*ae,h=Math.sin(j),R=-Math.cos(j),w=R*a.x+h*m.x,L=R*a.y+h*m.y,N=R*a.z+h*m.z;T.push(n.x+P*w,n.y+P*L,n.z+P*N),k.push(w,L,N),d.push(t)}}for(let e=0;e<l;e+=1)for(let t=0;t<r;t+=1){const n=e*v+t,a=(e+1)*v+t,m=(e+1)*v+(t+1),P=e*v+(t+1);f.push(n,a,P,a,m,P)}function M(e,t,n,a,m,P,u,j){let h=j;for(let w=1;w<=g;w+=1){const L=Math.PI/2*(w/g),N=m*Math.cos(L),U=u*m*Math.sin(L),O=T.length/3;for(let b=0;b<=r;b+=1){const G=b/r*ae,E=Math.sin(G),D=-Math.cos(G),I=D*n.x+E*a.x,oe=D*n.y+E*a.y,te=D*n.z+E*a.z,ge=Math.cos(L)*I+Math.sin(L)*u*t.x,xe=Math.cos(L)*oe+Math.sin(L)*u*t.y,de=Math.cos(L)*te+Math.sin(L)*u*t.z;T.push(e.x+U*t.x+N*I,e.y+U*t.y+N*oe,e.z+U*t.z+N*te),k.push(ge,xe,de),d.push(P)}for(let b=0;b<r;b+=1){const G=h+b,E=O+b,D=O+(b+1),I=h+(b+1);u>0?f.push(G,E,I,E,D,I):f.push(G,I,E,E,I,D)}h=O}const R=T.length/3;T.push(e.x+u*m*t.x,e.y+u*m*t.y,e.z+u*m*t.z),k.push(u*t.x,u*t.y,u*t.z),d.push(P);for(let w=0;w<r;w+=1)u>0?f.push(h+w,R,h+w+1):f.push(h+w,h+w+1,R)}M(o.getPointAt(0),o.getTangentAt(0),p.normals[0],p.binormals[0],s(0),0,-1,0),M(o.getPointAt(1),o.getTangentAt(1),p.normals[l],p.binormals[l],s(1),1,1,l*v);const y=new ye;return y.setIndex(f),y.setAttribute("position",new K(T,3)),y.setAttribute("normal",new K(k,3)),y.setAttribute("arcT",new K(d,1)),y}const Ae=`
${me}

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
`,Le=`
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
`;function je({controlPoints:o=fe,tubularSegments:z=128,radialSegments:l=64,capSegments:r=16,speed:g=1,weight:c=10,noiseFreq:x=.05,noiseAmp:p=5,animated:T=!0,texturePath:k="explosion.png",smokeLightColor:d="#4a4a58",smokeDarkColor:f="#1a1a22",greyscale:v=!1,position:s=[0,0,0]}){const M=C.useMemo(()=>Date.now(),[]),y=Q(X,B(k)),e=C.useMemo(()=>(y.colorSpace=H,y),[y]),t=C.useMemo(()=>{const m=new re(o.map(P=>ve(P.position)),!1,"centripetal");return pe(m,o,z,l,r)},[o,z,l,r]),a=C.useRef({tExplosion:{value:e},time:{value:0},weight:{value:c},noiseFreq:{value:x},noiseAmp:{value:p},smokeLightColor:{value:new V(d)},smokeDarkColor:{value:new V(f)},greyscale:{value:v?1:0}}).current;return a.tExplosion.value=e,a.weight.value=c,a.noiseFreq.value=x,a.noiseAmp.value=p,a.smokeLightColor.value.set(d),a.smokeDarkColor.value.set(f),a.greyscale.value=v?1:0,W(()=>{T&&(a.time.value=25e-5*g*(Date.now()-M))}),_.jsx("group",{position:s,children:_.jsx("mesh",{geometry:t,children:_.jsx("shaderMaterial",{vertexShader:Ae,fragmentShader:Le,uniforms:a,side:Z,toneMapped:!1})})})}J.preload(B("explosion.png"));function Ne({controlPoints:o=fe,tubularSegments:z=128,radialSegments:l=64,capSegments:r=16,speed:g=1,weight:c=10,noiseFreq:x=.05,noiseAmp:p=5,animated:T=!0,texturePath:k="explosion.png",smokeLightColor:d="#4a4a58",smokeDarkColor:f="#1a1a22",greyscale:v=!1,position:s=[0,0,0]}){const M=J(B(k));C.useEffect(()=>{M.colorSpace=H,M.needsUpdate=!0},[M]);const y=C.useMemo(()=>{const n=new re(o.map(a=>ve(a.position)),!1,"centripetal");return pe(n,o,z,l,r)},[o,z,l,r]),e=C.useMemo(()=>({time:A(0),weight:A(c),noiseFreq:A(x),noiseAmp:A(p),greyscale:A(v?1:0),smokeLightColor:A(new V(d)),smokeDarkColor:A(new V(f))}),[]);C.useEffect(()=>{e.weight.value=c,e.noiseFreq.value=x,e.noiseAmp.value=p,e.greyscale.value=v?1:0,e.smokeLightColor.value.set(d),e.smokeDarkColor.value.set(f)},[v,p,x,f,d,e,c]);const t=C.useMemo(()=>{const n=we("arcT","float"),a=n.toVarying("vPerlinNoiseSplineArcT"),m=F(e.time,e.time,e.time),P=F(n.mul(i(2)),n.mul(i(2)),n.mul(i(2))),u=ue($.mul(i(.5)).add(P).sub(m)),j=u.toVarying("vPerlinNoiseSplineAo"),h=ee(S.mul(e.noiseFreq).sub(m.mul(i(2)))),R=e.weight.mul(u).add(e.noiseAmp.mul(h)),w=i(0),L=j.mul(i(1.1)).add(i(1)).div(i(1.1)).add(w).clamp(0,1),N=ie(M,le(.5,L)).rgb,U=ce(N,F(.2126,.7152,.0722)),O=q(e.smokeDarkColor,e.smokeLightColor,U),b=q(N,O,e.greyscale),G=j.mul(i(2)).add(i(.5)).add(w).clamp(0,1),E=Te(G,e.smokeDarkColor,e.smokeLightColor),D=new ne({side:Z,toneMapped:!1});return D.positionNode=S.add($.mul(R)),D.colorNode=q(b,E,a),D},[M,e]);return W(({clock:n})=>{T&&(e.time.value=n.getElapsedTime()*.25*g)}),_.jsx("group",{position:s,children:_.jsx("mesh",{geometry:y,material:t})})}export{_e as P,Fe as a,je as b,Ne as c};
