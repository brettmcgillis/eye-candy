import{r as y,l as X,bx as _,T as Z,bk as W,q as G,n as Y,j as F,Y as J,bl as to,V as eo,a7 as go,b8 as Q,aj as ao}from"./index--CT8ZDT3.js";import{n as no,a as ro,s as io,b as Co}from"./perlinNoiseNodes-B1ZsfIib.js";import{u as A,a as U,a7 as $,f as k,aA as H,e as lo,v as co,az as uo,m as O,at as ko}from"./three.tsl-CSJc1O96.js";import{u as K}from"./Texture-BSLM6nBE.js";X.preload(Z,_("explosion.png"));const yo=`
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
`,wo=`
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
`;function bo({position:a=[0,0,0],radius:j=20,detail:f=6,speed:u=1,weight:E=10,noiseFreq:h=.05,noiseAmp:x=5,texturePath:p="explosion.png",animated:T=!0,greyscale:w=!1,smokeLightColor:m="#4a4a58",smokeDarkColor:l="#1a1a22"}){const c=y.useMemo(()=>Date.now(),[]),s=X(Z,_(p)),M=y.useMemo(()=>(s.colorSpace=W,s),[s]),o=y.useRef({tExplosion:{value:M},time:{value:0},weight:{value:E},noiseFreq:{value:h},noiseAmp:{value:x},greyscale:{value:w?1:0},smokeLightColor:{value:new G(m)},smokeDarkColor:{value:new G(l)}}).current;return o.tExplosion.value=M,o.weight.value=E,o.noiseFreq.value=h,o.noiseAmp.value=x,o.greyscale.value=w?1:0,o.smokeLightColor.value.set(m),o.smokeDarkColor.value.set(l),Y(()=>{T&&(o.time.value=25e-5*u*(Date.now()-c))}),F.jsxs("mesh",{position:a,children:[F.jsx("icosahedronGeometry",{args:[j,f]}),F.jsx("shaderMaterial",{vertexShader:yo,fragmentShader:wo,uniforms:o,side:J,toneMapped:!1})]})}K.preload(_("explosion.png"));function Lo({position:a=[0,0,0],radius:j=20,detail:f=6,speed:u=1,weight:E=10,noiseFreq:h=.05,noiseAmp:x=5,texturePath:p="explosion.png",animated:T=!0,greyscale:w=!1,smokeLightColor:m="#4a4a58",smokeDarkColor:l="#1a1a22"}){const c=K(_(p));y.useEffect(()=>{c.colorSpace=W,c.needsUpdate=!0},[c]);const s=y.useMemo(()=>({time:A(0),weight:A(E),noiseFreq:A(h),noiseAmp:A(x),greyscale:A(w?1:0),smokeLightColor:A(new G(m)),smokeDarkColor:A(new G(l))}),[]);y.useEffect(()=>{s.weight.value=E,s.noiseFreq.value=h,s.noiseAmp.value=x,s.greyscale.value=w?1:0,s.smokeLightColor.value.set(m),s.smokeDarkColor.value.set(l)},[w,x,h,l,m,s,E]);const M=y.useMemo(()=>{const v=U(s.time,s.time,s.time),o=ro($.mul(k(.5)).add(v)),e=o.toVarying("vPerlinNoiseBallAo"),n=io(H.mul(s.noiseFreq).add(v.mul(k(2)))),t=s.weight.mul(o).add(s.noiseAmp.mul(n)),r=e.mul(k(1.1)).add(k(1)).div(k(1.1)).clamp(0,1),g=lo(c,co(.5,r)).rgb,i=uo(g,U(.2126,.7152,.0722)),z=O(s.smokeDarkColor,s.smokeLightColor,i),d=new to({side:J,toneMapped:!1});return d.positionNode=H.add($.mul(t)),d.colorNode=O(g,z,s.greyscale),d},[c,s]);return Y(({clock:v})=>{T&&(s.time.value=v.getElapsedTime()*.25*u)}),F.jsx("mesh",{position:a,material:M,children:F.jsx("icosahedronGeometry",{args:[j,f]})})}const mo=[{position:[0,0,0],radius:.7},{position:[0,.9,0],radius:.65},{position:[.05,1.8,0],radius:.72},{position:[.1,2.7,.05],radius:.95},{position:[.15,3.5,.1],radius:1.25},{position:[.2,4.2,.15],radius:1.6}],so=Math.PI*2;function fo(a){return Array.isArray(a)?new eo(a[0],a[1],a[2]):new eo(a.x??0,a.y??0,a.z??0)}function po(a,j,f,u,E){const h=j.length,x=j.map(o=>o.radius??1),p=a.computeFrenetFrames(f,!1),T=[],w=[],m=[],l=[],c=u+1;function s(o){const e=o*(h-1),n=Math.floor(e),t=Math.min(n+1,h-1),r=e-n;return x[n]*(1-r)+x[t]*r}for(let o=0;o<=f;o+=1){const e=o/f,n=a.getPointAt(e),t=p.normals[o],r=p.binormals[o],g=s(e);for(let i=0;i<=u;i+=1){const z=i/u*so,d=Math.sin(z),R=-Math.cos(z),C=R*t.x+d*r.x,D=R*t.y+d*r.y,P=R*t.z+d*r.z;T.push(n.x+g*C,n.y+g*D,n.z+g*P),w.push(C,D,P),m.push(e)}}for(let o=0;o<f;o+=1)for(let e=0;e<u;e+=1){const n=o*c+e,t=(o+1)*c+e,r=(o+1)*c+(e+1),g=o*c+(e+1);l.push(n,t,g,t,r,g)}function M(o,e,n,t,r,g,i,z){let d=z;for(let C=1;C<=E;C+=1){const D=Math.PI/2*(C/E),P=r*Math.cos(D),B=i*r*Math.sin(D),I=T.length/3;for(let b=0;b<=u;b+=1){const V=b/u*so,L=Math.sin(V),N=-Math.cos(V),q=N*n.x+L*t.x,S=N*n.y+L*t.y,oo=N*n.z+L*t.z,vo=Math.cos(D)*q+Math.sin(D)*i*e.x,ho=Math.cos(D)*S+Math.sin(D)*i*e.y,xo=Math.cos(D)*oo+Math.sin(D)*i*e.z;T.push(o.x+B*e.x+P*q,o.y+B*e.y+P*S,o.z+B*e.z+P*oo),w.push(vo,ho,xo),m.push(g)}for(let b=0;b<u;b+=1){const V=d+b,L=I+b,N=I+(b+1),q=d+(b+1);i>0?l.push(V,L,q,L,N,q):l.push(V,q,L,L,q,N)}d=I}const R=T.length/3;T.push(o.x+i*r*e.x,o.y+i*r*e.y,o.z+i*r*e.z),w.push(i*e.x,i*e.y,i*e.z),m.push(g);for(let C=0;C<u;C+=1)i>0?l.push(d+C,R,d+C+1):l.push(d+C,d+C+1,R)}M(a.getPointAt(0),a.getTangentAt(0),p.normals[0],p.binormals[0],s(0),0,-1,0),M(a.getPointAt(1),a.getTangentAt(1),p.normals[f],p.binormals[f],s(1),1,1,f*c);const v=new go;return v.setIndex(l),v.setAttribute("position",new Q(T,3)),v.setAttribute("normal",new Q(w,3)),v.setAttribute("arcT",new Q(m,1)),v}const Mo=`
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
`,To=`
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
`;function No({controlPoints:a=mo,tubularSegments:j=128,radialSegments:f=64,capSegments:u=16,speed:E=1,weight:h=10,noiseFreq:x=.05,noiseAmp:p=5,animated:T=!0,texturePath:w="explosion.png",smokeLightColor:m="#4a4a58",smokeDarkColor:l="#1a1a22",greyscale:c=!1,position:s=[0,0,0]}){const M=y.useMemo(()=>Date.now(),[]),v=X(Z,_(w)),o=y.useMemo(()=>(v.colorSpace=W,v),[v]),e=y.useMemo(()=>{const r=new ao(a.map(g=>fo(g.position)),!1,"centripetal");return po(r,a,j,f,u)},[a,j,f,u]),t=y.useRef({tExplosion:{value:o},time:{value:0},weight:{value:h},noiseFreq:{value:x},noiseAmp:{value:p},smokeLightColor:{value:new G(m)},smokeDarkColor:{value:new G(l)},greyscale:{value:c?1:0}}).current;return t.tExplosion.value=o,t.weight.value=h,t.noiseFreq.value=x,t.noiseAmp.value=p,t.smokeLightColor.value.set(m),t.smokeDarkColor.value.set(l),t.greyscale.value=c?1:0,Y(()=>{T&&(t.time.value=25e-5*E*(Date.now()-M))}),F.jsx("group",{position:s,children:F.jsx("mesh",{geometry:e,children:F.jsx("shaderMaterial",{vertexShader:Mo,fragmentShader:To,uniforms:t,side:J,toneMapped:!1})})})}K.preload(_("explosion.png"));function Fo({controlPoints:a=mo,tubularSegments:j=128,radialSegments:f=64,capSegments:u=16,speed:E=1,weight:h=10,noiseFreq:x=.05,noiseAmp:p=5,animated:T=!0,texturePath:w="explosion.png",smokeLightColor:m="#4a4a58",smokeDarkColor:l="#1a1a22",greyscale:c=!1,position:s=[0,0,0]}){const M=K(_(w));y.useEffect(()=>{M.colorSpace=W,M.needsUpdate=!0},[M]);const v=y.useMemo(()=>{const n=new ao(a.map(t=>fo(t.position)),!1,"centripetal");return po(n,a,j,f,u)},[a,j,f,u]),o=y.useMemo(()=>({time:A(0),weight:A(h),noiseFreq:A(x),noiseAmp:A(p),greyscale:A(c?1:0),smokeLightColor:A(new G(m)),smokeDarkColor:A(new G(l))}),[]);y.useEffect(()=>{o.weight.value=h,o.noiseFreq.value=x,o.noiseAmp.value=p,o.greyscale.value=c?1:0,o.smokeLightColor.value.set(m),o.smokeDarkColor.value.set(l)},[c,p,x,l,m,o,h]);const e=y.useMemo(()=>{const n=ko("arcT","float"),t=n.toVarying("vPerlinNoiseSplineArcT"),r=U(o.time,o.time,o.time),g=U(n.mul(k(2)),n.mul(k(2)),n.mul(k(2))),i=ro($.mul(k(.5)).add(g).sub(r)),z=i.toVarying("vPerlinNoiseSplineAo"),d=io(H.mul(o.noiseFreq).sub(r.mul(k(2)))),R=o.weight.mul(i).add(o.noiseAmp.mul(d)),C=k(0),D=z.mul(k(1.1)).add(k(1)).div(k(1.1)).add(C).clamp(0,1),P=lo(M,co(.5,D)).rgb,B=uo(P,U(.2126,.7152,.0722)),I=O(o.smokeDarkColor,o.smokeLightColor,B),b=O(P,I,o.greyscale),V=z.mul(k(2)).add(k(.5)).add(C).clamp(0,1),L=Co(V,o.smokeDarkColor,o.smokeLightColor),N=new to({side:J,toneMapped:!1});return N.positionNode=H.add($.mul(R)),N.colorNode=O(b,L,t),N},[M,o]);return Y(({clock:n})=>{T&&(o.time.value=n.getElapsedTime()*.25*E)}),F.jsx("group",{position:s,children:F.jsx("mesh",{geometry:v,material:e})})}export{bo as P,Lo as a,No as b,Fo as c};
