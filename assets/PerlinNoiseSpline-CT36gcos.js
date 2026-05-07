import{r as b,u as J,w as K,T as Q,x as X,y as Y,C as N,d as Z,j as _,F as S,V as B,z as oo,G as O}from"./index-D4JliqBF.js";import{n as eo}from"./splineDefaults-2OEXFdFV.js";const to=`
${eo}

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
`,ro=[{position:[0,0,0],radius:.7},{position:[0,.9,0],radius:.65},{position:[.05,1.8,0],radius:.72},{position:[.1,2.7,.05],radius:.95},{position:[.15,3.5,.1],radius:1.25},{position:[.2,4.2,.15],radius:1.6}],U=Math.PI*2;function no(s){return Array.isArray(s)?new B(s[0],s[1],s[2]):new B(s.x??0,s.y??0,s.z??0)}function io(s,z,m,l,L){const F=z.length,D=z.map(e=>e.radius??1),p=s.computeFrenetFrames(m,!1),d=[],T=[],M=[],v=[],y=l+1;function R(e){const o=e*(F-1),i=Math.floor(o),t=Math.min(i+1,F-1),r=o-i;return D[i]*(1-r)+D[t]*r}for(let e=0;e<=m;e++){const o=e/m,i=s.getPointAt(o),t=p.normals[e],r=p.binormals[e],c=R(o);for(let n=0;n<=l;n++){const P=n/l*U,u=Math.sin(P),A=-Math.cos(P),a=A*t.x+u*r.x,f=A*t.y+u*r.y,g=A*t.z+u*r.z;d.push(i.x+c*a,i.y+c*f,i.z+c*g),T.push(a,f,g),M.push(o)}}for(let e=0;e<m;e++)for(let o=0;o<l;o++){const i=e*y+o,t=(e+1)*y+o,r=(e+1)*y+(o+1),c=e*y+(o+1);v.push(i,t,c,t,r,c)}function E(e,o,i,t,r,c,n,P){let u=P;for(let a=1;a<=L;a++){const f=Math.PI/2*(a/L),g=r*Math.cos(f),G=n*r*Math.sin(f),I=d.length/3;for(let h=0;h<=l;h++){const j=h/l*U,C=Math.sin(j),w=-Math.cos(j),k=w*i.x+C*t.x,V=w*i.y+C*t.y,q=w*i.z+C*t.z,W=Math.cos(f)*k+Math.sin(f)*n*o.x,$=Math.cos(f)*V+Math.sin(f)*n*o.y,H=Math.cos(f)*q+Math.sin(f)*n*o.z;d.push(e.x+G*o.x+g*k,e.y+G*o.y+g*V,e.z+G*o.z+g*q),T.push(W,$,H),M.push(c)}for(let h=0;h<l;h++){const j=u+h,C=I+h,w=I+(h+1),k=u+(h+1);n>0?v.push(j,C,k,C,w,k):v.push(j,k,C,C,k,w)}u=I}const A=d.length/3;d.push(e.x+n*r*o.x,e.y+n*r*o.y,e.z+n*r*o.z),T.push(n*o.x,n*o.y,n*o.z),M.push(c);for(let a=0;a<l;a++)n>0?v.push(u+a,A,u+a+1):v.push(u+a,u+a+1,A)}E(s.getPointAt(0),s.getTangentAt(0),p.normals[0],p.binormals[0],R(0),0,-1,0),E(s.getPointAt(1),s.getTangentAt(1),p.normals[m],p.binormals[m],R(1),1,1,m*y);const x=new oo;return x.setIndex(v),x.setAttribute("position",new O(d,3)),x.setAttribute("normal",new O(T,3)),x.setAttribute("arcT",new O(M,1)),x}function co({controlPoints:s=ro,tubularSegments:z=128,radialSegments:m=64,capSegments:l=16,speed:L=1,weight:F=10,noiseFreq:D=.05,noiseAmp:p=5,animated:d=!0,texturePath:T="explosion.png",smokeLightColor:M="#4a4a58",smokeDarkColor:v="#1a1a22",greyscale:y=!1,position:R=[0,0,0]}){const E=b.useMemo(()=>Date.now(),[]),x=J(Q,K(T)),e=b.useMemo(()=>(x.colorSpace=X,x),[x]),o=b.useMemo(()=>{const r=new Y(s.map(c=>no(c.position)),!1,"centripetal");return io(r,s,z,m,l)},[s,z,m,l]),t=b.useRef({tExplosion:{value:e},time:{value:0},weight:{value:F},noiseFreq:{value:D},noiseAmp:{value:p},smokeLightColor:{value:new N(M)},smokeDarkColor:{value:new N(v)},greyscale:{value:y?1:0}}).current;return t.tExplosion.value=e,t.weight.value=F,t.noiseFreq.value=D,t.noiseAmp.value=p,t.smokeLightColor.value.set(M),t.smokeDarkColor.value.set(v),t.greyscale.value=y?1:0,Z(()=>{d&&(t.time.value=25e-5*L*(Date.now()-E))}),_.jsx("group",{position:R,children:_.jsx("mesh",{geometry:o,children:_.jsx("shaderMaterial",{vertexShader:to,fragmentShader:so,uniforms:t,side:S,toneMapped:!1})})})}export{co as P};
