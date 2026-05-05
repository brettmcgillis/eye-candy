import{r as b,u as J,T as K,p as Q,q as X,C as N,b as Y,j as G,F as Z,V as B,s as S,t as q}from"./index-BjAk923F.js";import{n as oo}from"./splineDefaults-DH2dSAp7.js";const eo=`
${oo}

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
`,so=`
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
`,to=[{position:[0,0,0],radius:.7},{position:[0,.9,0],radius:.65},{position:[.05,1.8,0],radius:.72},{position:[.1,2.7,.05],radius:.95},{position:[.15,3.5,.1],radius:1.25},{position:[.2,4.2,.15],radius:1.6}],U=Math.PI*2;function ro(t){return Array.isArray(t)?new B(t[0],t[1],t[2]):new B(t.x??0,t.y??0,t.z??0)}function no(t,z,m,l,L){const F=z.length,D=z.map(e=>e.radius??1),p=t.computeFrenetFrames(m,!1),d=[],T=[],M=[],v=[],y=l+1;function R(e){const o=e*(F-1),i=Math.floor(o),s=Math.min(i+1,F-1),r=o-i;return D[i]*(1-r)+D[s]*r}for(let e=0;e<=m;e++){const o=e/m,i=t.getPointAt(o),s=p.normals[e],r=p.binormals[e],c=R(o);for(let n=0;n<=l;n++){const P=n/l*U,u=Math.sin(P),g=-Math.cos(P),a=g*s.x+u*r.x,f=g*s.y+u*r.y,A=g*s.z+u*r.z;d.push(i.x+c*a,i.y+c*f,i.z+c*A),T.push(a,f,A),M.push(o)}}for(let e=0;e<m;e++)for(let o=0;o<l;o++){const i=e*y+o,s=(e+1)*y+o,r=(e+1)*y+(o+1),c=e*y+(o+1);v.push(i,s,c,s,r,c)}function E(e,o,i,s,r,c,n,P){let u=P;for(let a=1;a<=L;a++){const f=Math.PI/2*(a/L),A=r*Math.cos(f),I=n*r*Math.sin(f),_=d.length/3;for(let h=0;h<=l;h++){const j=h/l*U,C=Math.sin(j),w=-Math.cos(j),k=w*i.x+C*s.x,O=w*i.y+C*s.y,V=w*i.z+C*s.z,W=Math.cos(f)*k+Math.sin(f)*n*o.x,$=Math.cos(f)*O+Math.sin(f)*n*o.y,H=Math.cos(f)*V+Math.sin(f)*n*o.z;d.push(e.x+I*o.x+A*k,e.y+I*o.y+A*O,e.z+I*o.z+A*V),T.push(W,$,H),M.push(c)}for(let h=0;h<l;h++){const j=u+h,C=_+h,w=_+(h+1),k=u+(h+1);n>0?v.push(j,C,k,C,w,k):v.push(j,k,C,C,k,w)}u=_}const g=d.length/3;d.push(e.x+n*r*o.x,e.y+n*r*o.y,e.z+n*r*o.z),T.push(n*o.x,n*o.y,n*o.z),M.push(c);for(let a=0;a<l;a++)n>0?v.push(u+a,g,u+a+1):v.push(u+a,u+a+1,g)}E(t.getPointAt(0),t.getTangentAt(0),p.normals[0],p.binormals[0],R(0),0,-1,0),E(t.getPointAt(1),t.getTangentAt(1),p.normals[m],p.binormals[m],R(1),1,1,m*y);const x=new S;return x.setIndex(v),x.setAttribute("position",new q(d,3)),x.setAttribute("normal",new q(T,3)),x.setAttribute("arcT",new q(M,1)),x}function lo({controlPoints:t=to,tubularSegments:z=128,radialSegments:m=64,capSegments:l=16,speed:L=1,weight:F=10,noiseFreq:D=.05,noiseAmp:p=5,animated:d=!0,texturePath:T="/images/explosion.png",smokeLightColor:M="#4a4a58",smokeDarkColor:v="#1a1a22",greyscale:y=!1,position:R=[0,0,0]}){const E=b.useMemo(()=>Date.now(),[]),x=J(K,T),e=b.useMemo(()=>(x.colorSpace=Q,x),[x]),o=b.useMemo(()=>{const r=new X(t.map(c=>ro(c.position)),!1,"centripetal");return no(r,t,z,m,l)},[t,z,m,l]),s=b.useRef({tExplosion:{value:e},time:{value:0},weight:{value:F},noiseFreq:{value:D},noiseAmp:{value:p},smokeLightColor:{value:new N(M)},smokeDarkColor:{value:new N(v)},greyscale:{value:y?1:0}}).current;return s.tExplosion.value=e,s.weight.value=F,s.noiseFreq.value=D,s.noiseAmp.value=p,s.smokeLightColor.value.set(M),s.smokeDarkColor.value.set(v),s.greyscale.value=y?1:0,Y(()=>{d&&(s.time.value=25e-5*L*(Date.now()-E))}),G.jsx("group",{position:R,children:G.jsx("mesh",{geometry:o,children:G.jsx("shaderMaterial",{vertexShader:eo,fragmentShader:so,uniforms:s,side:Z,toneMapped:!1})})})}export{lo as P};
