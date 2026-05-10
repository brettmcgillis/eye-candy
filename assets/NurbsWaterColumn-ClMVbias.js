import{aG as Z,a7 as G,aH as L,a8 as C,r as g,aa as I,al as U,ak as tt,ac as ot,j as N,ab as et}from"./index-DXKW93Xk.js";import{b as nt,d as V,a as st}from"./Line2-DCwQgXZY.js";class B extends Z{constructor(t=(e,c,r)=>r.set(e,c,Math.cos(e)*Math.sin(c)),s=8,n=8){super(),this.type="ParametricGeometry",this.parameters={func:t,slices:s,stacks:n};const e=[],c=[],r=[],l=[],i=1e-5,a=new G,m=new G,u=new G,f=new G,v=new G,d=s+1;for(let x=0;x<=n;x++){const p=x/n;for(let h=0;h<=s;h++){const z=h/s;t(z,p,m),c.push(m.x,m.y,m.z),z-i>=0?(t(z-i,p,u),f.subVectors(m,u)):(t(z+i,p,u),f.subVectors(u,m)),p-i>=0?(t(z,p-i,u),v.subVectors(m,u)):(t(z,p+i,u),v.subVectors(u,m)),a.crossVectors(f,v).normalize(),r.push(a.x,a.y,a.z),l.push(z,p)}}for(let x=0;x<n;x++)for(let p=0;p<s;p++){const h=x*d+p,z=x*d+p+1,S=(x+1)*d+p+1,W=(x+1)*d+p;e.push(h,z,W),e.push(z,S,W)}this.setIndex(e),this.setAttribute("position",new L(c,3)),this.setAttribute("normal",new L(r,3)),this.setAttribute("uv",new L(l,2))}}function $(o,t,s){const n=s.length-o-1;if(t>=s[n])return n-1;if(t<=s[o])return o;let e=o,c=n,r=Math.floor((e+c)/2);for(;t<s[r]||t>=s[r+1];)t<s[r]?c=r:e=r,r=Math.floor((e+c)/2);return r}function Q(o,t,s,n){const e=[],c=[],r=[];e[0]=1;for(let l=1;l<=s;++l){c[l]=t-n[o+1-l],r[l]=n[o+l]-t;let i=0;for(let a=0;a<l;++a){const m=r[a+1],u=c[l-a],f=e[a]/(m+u);e[a]=i+m*f,i=u*f}e[l]=i}return e}function rt(o,t,s,n,e,c,r,l){const i=$(o,c,s),a=$(t,r,n),m=Q(i,c,o,s),u=Q(a,r,t,n),f=[];for(let d=0;d<=t;++d){f[d]=new C(0,0,0,0);for(let x=0;x<=o;++x){const p=e[i-o+x][a-t+d].clone(),h=p.w;p.x*=h,p.y*=h,p.z*=h,f[d].add(p.multiplyScalar(m[x]))}}const v=new C(0,0,0,0);for(let d=0;d<=t;++d)v.add(f[d].multiplyScalar(u[d]));v.divideScalar(v.w),l.set(v.x,v.y,v.z)}class w{constructor(t,s,n,e,c){this.degree1=t,this.degree2=s,this.knots1=n,this.knots2=e,this.controlPoints=[];const r=n.length-t-1,l=e.length-s-1;for(let i=0;i<r;++i){this.controlPoints[i]=[];for(let a=0;a<l;++a){const m=c[i][a];this.controlPoints[i][a]=new C(m.x,m.y,m.z,m.w)}}}getPoint(t,s,n){const e=this.knots1[0]+t*(this.knots1[this.knots1.length-1]-this.knots1[0]),c=this.knots2[0]+s*(this.knots2[this.knots2.length-1]-this.knots2[0]);rt(this.degree1,this.degree2,this.knots1,this.knots2,this.controlPoints,e,c,n)}}const at=[{dx:.6,dz:.8,freq:1.2,amp:1},{dx:-.4,dz:.9,freq:2.5,amp:.4},{dx:.9,dz:-.3,freq:3.8,amp:.2},{dx:-.7,dz:-.6,freq:5,amp:.1}],R=at.map(o=>{const t=Math.sqrt(o.dx*o.dx+o.dz*o.dz);return{dx:o.dx/t,dz:o.dz/t,freq:o.freq,amp:o.amp}});let F=0;function it(o){F=o}function X(o,t,s,n,e){let c=0;for(let r=0;r<R.length;r+=1){const{dx:l,dz:i,freq:a,amp:m}=R[r],u=m*s,f=e*a,v=(l*o+i*t)*a+F*f;c+=u*Math.cos(v)}return c}function yt(o,t,s,n,e){let c=0,r=1,l=0;for(let a=0;a<R.length;a+=1){const{dx:m,dz:u,freq:f,amp:v}=R[a],d=v*s,x=n/(f*d*R.length),p=e*f,h=(m*o+u*t)*f+F*p,z=Math.sin(h),S=Math.cos(h),W=f*d;c-=m*W*z,l-=u*W*z,r-=x*W*S}const i=Math.sqrt(c*c+r*r+l*l);return{x:c/i,y:r/i,z:l/i}}function ct(o,t,s){const n=[0,0,0,0,1,1,1,1],e=[o,o/3,-o/3,-o],c=[-t,-t/3,t/3,t],r=e.map(l=>c.map(i=>new C(l,s,i,1)));return new w(3,3,n,n,r)}function lt(o,t,s){const n=[0,0,0,0,1,1,1,1],e=[-o,-o/3,o/3,o],c=[-t,-t/3,t/3,t],r=e.map(l=>c.map(i=>new C(l,s,i,1)));return new w(3,3,n,n,r)}function j(o,t,s,n){const e=[0,0,0,0,1,1,1,1],c=[0,0,0,1,1,1],r=(s+n)/2,l=o.map(i=>{const a=t(i,s),m=t(i,n);return[new C(a.x,a.y,a.z,1),new C((a.x+m.x)/2,r,(a.z+m.z)/2,1),new C(m.x,m.y,m.z,1)]});return new w(3,2,e,c,l)}function mt({width:o,depth:t,height:s}){const n=o/2,e=t/2,c=s/2,r=-s/2;return{top:ct(n,e,c),bottom:lt(n,e,r),front:j([-n,-n/3,n/3,n],(l,i)=>({x:l,y:i,z:e}),r,c),back:j([n,n/3,-n/3,-n],(l,i)=>({x:l,y:i,z:-e}),r,c),right:j([e,e/3,-e/3,-e],(l,i)=>({x:n,y:i,z:l}),r,c),left:j([-e,-e/3,e/3,e],(l,i)=>({x:-n,y:i,z:l}),r,c)}}function ut(o,t,s,n){const e=Math.max(8,Math.round(t*(s/n))),c=Math.max(4,Math.round(t/4)),r=l=>(i,a,m)=>l.getPoint(i,a,m);return[new B(r(o.top),t,t),new B(r(o.bottom),c,c),new B(r(o.front),t,e),new B(r(o.back),t,e),new B(r(o.right),t,e),new B(r(o.left),t,e)]}et({Line2:st});const ft=`
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveChoppiness;
  uniform float uWaveSpeed;
  uniform float uColumnTop;
  uniform float uColumnBottom;

  varying float vNormHeight;

  // Y-only wave displacement — walls stay vertical, only top undulates
  vec3 nurbsWaveDisplace(vec3 pos) {
    float normY = clamp(
      (pos.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
    );
    // Only vertices near the top move (sides lerp from 0 at bottom to full at top)
    float blend = smoothstep(0.5, 1.0, normY);

    vec2 dirs[4];
    dirs[0] = normalize(vec2( 0.6,  0.8));
    dirs[1] = normalize(vec2(-0.4,  0.9));
    dirs[2] = normalize(vec2( 0.9, -0.3));
    dirs[3] = normalize(vec2(-0.7, -0.6));

    float freqs[4];
    freqs[0] = 1.2; freqs[1] = 2.5; freqs[2] = 3.8; freqs[3] = 5.0;

    float baseAmps[4];
    baseAmps[0] = 1.0; baseAmps[1] = 0.4; baseAmps[2] = 0.2; baseAmps[3] = 0.1;

    float heightDisp = 0.0;
    for (int i = 0; i < 4; i++) {
      float amp = baseAmps[i] * uWaveHeight;
      float phase = uWaveSpeed * freqs[i];
      float theta = dot(dirs[i], pos.xz) * freqs[i] + uTime * phase;
      heightDisp += amp * cos(theta);
    }

    // Only displace in Y — no horizontal shift keeps walls flush
    return vec3(0.0, heightDisp * blend, 0.0);
  }

  vec3 nurbsWaveNormal(vec3 pos) {
    vec2 dirs[4];
    dirs[0] = normalize(vec2( 0.6,  0.8));
    dirs[1] = normalize(vec2(-0.4,  0.9));
    dirs[2] = normalize(vec2( 0.9, -0.3));
    dirs[3] = normalize(vec2(-0.7, -0.6));

    float freqs[4];
    freqs[0] = 1.2; freqs[1] = 2.5; freqs[2] = 3.8; freqs[3] = 5.0;

    float baseAmps[4];
    baseAmps[0] = 1.0; baseAmps[1] = 0.4; baseAmps[2] = 0.2; baseAmps[3] = 0.1;

    vec3 n = vec3(0.0, 1.0, 0.0);
    for (int i = 0; i < 4; i++) {
      float amp = baseAmps[i] * uWaveHeight;
      float Q = uWaveChoppiness / (freqs[i] * amp * 4.0);
      float phase = uWaveSpeed * freqs[i];
      float theta = dot(dirs[i], pos.xz) * freqs[i] + uTime * phase;
      float s = sin(theta);
      float c = cos(theta);
      float WA = freqs[i] * amp;
      n.x -= dirs[i].x * WA * s;
      n.z -= dirs[i].y * WA * s;
      n.y -= Q * WA * c;
    }
    return normalize(n);
  }
`,pt=`
  #include <common>
  ${ft}
`,vt=`
  // Blend wave normals in for top-facing surfaces only
  float _isTopFacing = step(0.5, normal.y);
  float _normY = clamp(
    (position.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
  );
  float _normalBlend = _isTopFacing * smoothstep(0.8, 1.0, _normY);
  vec3 _waveNorm = nurbsWaveNormal(position);
  vec3 objectNormal = mix(vec3(normal), _waveNorm, _normalBlend);
  #ifdef USE_TANGENT
    vec3 objectTangent = vec3(tangent.xyz);
  #endif
`,dt=`
  vec3 waveD = nurbsWaveDisplace(position);
  vec3 transformed = position + waveD;
  vNormHeight = clamp(
    (transformed.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
  );
  #ifdef USE_ALPHAHASH
    vPosition = vec3(position);
  #endif
`,xt=`
  uniform vec3 uTopColor;
  uniform vec3 uBottomColor;
  varying float vNormHeight;
`,zt=`
  #include <color_fragment>
  diffuseColor.rgb = mix(uBottomColor, uTopColor, vNormHeight);
`,k=32;function ht(o,t,s,n){const e=new V;e.setPositions([-o,n,-t,o,n,-t,o,n,t,-o,n,t,-o,n,-t]);const r=[[-o,-t],[o,-t],[o,t],[-o,t]].map(([a,m])=>{const u=new V;return u.setPositions([a,n,m,a,s,m]),{geo:u,cx:a,cz:m}}),i=[{x0:-o,z0:-t,x1:o,z1:-t},{x0:o,z0:-t,x1:o,z1:t},{x0:o,z0:t,x1:-o,z1:t},{x0:-o,z0:t,x1:-o,z1:-t}].map(a=>{const m=[];for(let f=0;f<=k;f+=1){const v=f/k;m.push(a.x0+(a.x1-a.x0)*v,s,a.z0+(a.z1-a.z0)*v)}const u=new V;return u.setPositions(m),{geo:u,edge:a}});return{bottomGeo:e,vertGeos:r,topGeos:i}}function St({width:o=3.6,depth:t=3.6,height:s=6,segments:n=24,topColor:e="#9edff0",bottomColor:c="#246f98",opacity:r=.34,transmission:l=.5,roughness:i=.3,ior:a=1.12,thickness:m=.35,waveHeight:u=.15,waveChoppiness:f=.5,waveSpeed:v=.6,edgeColor:d="#1f4455",edgeOpacity:x=.65,edgeLineWidth:p=1,showEdges:h=!0}){const z=g.useRef(0),S=g.useMemo(()=>({uTime:{value:z.current},uWaveHeight:{value:u},uWaveChoppiness:{value:f},uWaveSpeed:{value:v},uColumnTop:{value:s/2},uColumnBottom:{value:-s/2},uTopColor:{value:new I(e)},uBottomColor:{value:new I(c)}}),[e,c,s]),W=g.useMemo(()=>{const b=mt({width:o,depth:t,height:s});return ut(b,n,s,Math.max(o,t))},[o,t,s,n]),J=g.useMemo(()=>{const b=new U({transparent:!0,opacity:r,transmission:l,roughness:i,metalness:0,ior:a,thickness:m,side:tt,depthWrite:!0});return b.onBeforeCompile=y=>{const A=y;Object.entries(S).forEach(([H,P])=>{A.uniforms[H]=P}),A.vertexShader=A.vertexShader.replace("#include <common>",pt),A.vertexShader=A.vertexShader.replace("#include <beginnormal_vertex>",vt),A.vertexShader=A.vertexShader.replace("#include <begin_vertex>",dt),A.fragmentShader=A.fragmentShader.replace("#include <common>",`#include <common>
${xt}`),A.fragmentShader=A.fragmentShader.replace("#include <color_fragment>",zt)},b},[S,r,l,i,a,m]),T=g.useMemo(()=>{if(!h)return null;const b=o/2,y=t/2;return ht(b,y,s/2,-s/2)},[h,o,s,t]),M=g.useMemo(()=>new nt({transparent:!0,depthTest:!0,depthWrite:!1,toneMapped:!1}),[]);return ot((b,y)=>{if(z.current+=y,S.uTime.value=z.current,S.uWaveHeight.value=u,S.uWaveChoppiness.value=f,S.uWaveSpeed.value=v,it(z.current),h&&M&&(M.color.set(d),M.opacity=x,M.linewidth=p,M.resolution.set(b.size.width,b.size.height)),T){const A=s/2,H=-s/2;T.topGeos.forEach(({geo:P,edge:E})=>{const _=[];for(let q=0;q<=k;q+=1){const O=q/k,D=E.x0+(E.x1-E.x0)*O,Y=E.z0+(E.z1-E.z0)*O,K=X(D,Y,u,f,v);_.push(D,A+K,Y)}P.setPositions(_)}),T.vertGeos.forEach(({geo:P,cx:E,cz:_})=>{const q=X(E,_,u,f,v);P.setPositions([E,H,_,E,A+q,_])})}}),N.jsxs("group",{children:[W.map((b,y)=>N.jsx("mesh",{geometry:b,material:J},y)),h&&T&&N.jsxs(N.Fragment,{children:[N.jsx("line2",{geometry:T.bottomGeo,material:M}),T.vertGeos.map(({geo:b},y)=>N.jsx("line2",{geometry:b,material:M},`v${y}`)),T.topGeos.map(({geo:b},y)=>N.jsx("line2",{geometry:b,material:M},`t${y}`))]})]})}export{w as N,B as P,R as W,St as a,yt as b,mt as c,ut as d,it as e,X as s};
