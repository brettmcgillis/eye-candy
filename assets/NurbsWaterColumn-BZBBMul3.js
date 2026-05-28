import{aN as Mt,V as D,b1 as gt,a5 as et,r as x,bh as Wt,bi as At,a8 as Pt,aR as Bt,a6 as it,av as lt,M as at,p as ft,a1 as qt,w as Kt,t as Vt,aT as Ot,o as Ut,j as H,m as te,au as ee,bo as oe,ch as ne,aF as ae,b2 as Et,K as Ct,U as Rt,n as re}from"./index-C4dhyc_M.js";import{b as se,d as Nt,a as ce}from"./Line2-DM2C-ysB.js";import{u as Z,F as K,f as F,v as nt,Z as tt,r as pt,ad as Tt,j as dt,_ as Ft,Y as _t,q as ht,s as Ht,P as Dt,ac as kt,i as Gt}from"./three.tsl-CyZb892l.js";class ct extends Mt{constructor(t=(a,s,r)=>r.set(a,s,Math.cos(a)*Math.sin(s)),o=8,n=8){super(),this.type="ParametricGeometry",this.parameters={func:t,slices:o,stacks:n};const a=[],s=[],r=[],l=[],c=1e-5,i=new D,u=new D,p=new D,m=new D,v=new D,S=o+1;for(let M=0;M<=n;M++){const d=M/n;for(let y=0;y<=o;y++){const b=y/o;t(b,d,u),s.push(u.x,u.y,u.z),b-c>=0?(t(b-c,d,p),m.subVectors(u,p)):(t(b+c,d,p),m.subVectors(p,u)),d-c>=0?(t(b,d-c,p),v.subVectors(u,p)):(t(b,d+c,p),v.subVectors(p,u)),i.crossVectors(m,v).normalize(),r.push(i.x,i.y,i.z),l.push(b,d)}}for(let M=0;M<n;M++)for(let d=0;d<o;d++){const y=M*S+d,b=M*S+d+1,_=(M+1)*S+d+1,g=(M+1)*S+d;a.push(y,b,g),a.push(b,_,g)}this.setIndex(a),this.setAttribute("position",new gt(s,3)),this.setAttribute("normal",new gt(r,3)),this.setAttribute("uv",new gt(l,2))}}function jt(e,t,o){const n=o.length-e-1;if(t>=o[n])return n-1;if(t<=o[e])return e;let a=e,s=n,r=Math.floor((a+s)/2);for(;t<o[r]||t>=o[r+1];)t<o[r]?s=r:a=r,r=Math.floor((a+s)/2);return r}function Yt(e,t,o,n){const a=[],s=[],r=[];a[0]=1;for(let l=1;l<=o;++l){s[l]=t-n[e+1-l],r[l]=n[e+l]-t;let c=0;for(let i=0;i<l;++i){const u=r[i+1],p=s[l-i],m=a[i]/(u+p);a[i]=c+u*m,c=p*m}a[l]=c}return a}function ie(e,t,o,n,a,s,r,l){const c=jt(e,s,o),i=jt(t,r,n),u=Yt(c,s,e,o),p=Yt(i,r,t,n),m=[];for(let S=0;S<=t;++S){m[S]=new et(0,0,0,0);for(let M=0;M<=e;++M){const d=a[c-e+M][i-t+S].clone(),y=d.w;d.x*=y,d.y*=y,d.z*=y,m[S].add(d.multiplyScalar(u[M]))}}const v=new et(0,0,0,0);for(let S=0;S<=t;++S)v.add(m[S].multiplyScalar(p[S]));v.divideScalar(v.w),l.set(v.x,v.y,v.z)}class It{constructor(t,o,n,a,s){this.degree1=t,this.degree2=o,this.knots1=n,this.knots2=a,this.controlPoints=[];const r=n.length-t-1,l=a.length-o-1;for(let c=0;c<r;++c){this.controlPoints[c]=[];for(let i=0;i<l;++i){const u=s[c][i];this.controlPoints[c][i]=new et(u.x,u.y,u.z,u.w)}}}getPoint(t,o,n){const a=this.knots1[0]+t*(this.knots1[this.knots1.length-1]-this.knots1[0]),s=this.knots2[0]+o*(this.knots2[this.knots2.length-1]-this.knots2[0]);ie(this.degree1,this.degree2,this.knots1,this.knots2,this.controlPoints,a,s,n)}}const le=[{dx:.6,dz:.8,freq:1.2,amp:1},{dx:-.4,dz:.9,freq:2.5,amp:.4},{dx:.9,dz:-.3,freq:3.8,amp:.2},{dx:-.7,dz:-.6,freq:5,amp:.1}],rt=le.map(e=>{const t=Math.sqrt(e.dx*e.dx+e.dz*e.dz);return{dx:e.dx/t,dz:e.dz/t,freq:e.freq,amp:e.amp}});let wt=0;function Xt(e){wt=e}function vt(e,t,o,n,a){let s=0;for(let r=0;r<rt.length;r+=1){const{dx:l,dz:c,freq:i,amp:u}=rt[r],p=u*o,m=a*i,v=(l*e+c*t)*i+wt*m;s+=p*Math.cos(v)}return s}function ue(e,t,o,n,a){let s=0,r=1,l=0;for(let i=0;i<rt.length;i+=1){const{dx:u,dz:p,freq:m,amp:v}=rt[i],S=v*o,M=n/(m*S*rt.length),d=a*m,y=(u*e+p*t)*m+wt*d,b=Math.sin(y),_=Math.cos(y),g=m*S;s-=u*g*b,l-=p*g*b,r-=M*g*_}const c=Math.sqrt(s*s+r*r+l*l);return{x:s/c,y:r/c,z:l/c}}function me(e,t,o){const n=[0,0,0,0,1,1,1,1],a=[e,e/3,-e/3,-e],s=[-t,-t/3,t/3,t],r=a.map(l=>s.map(c=>new et(l,o,c,1)));return new It(3,3,n,n,r)}function pe(e,t,o){const n=[0,0,0,0,1,1,1,1],a=[-e,-e/3,e/3,e],s=[-t,-t/3,t/3,t],r=a.map(l=>s.map(c=>new et(l,o,c,1)));return new It(3,3,n,n,r)}function bt(e,t,o,n){const a=[0,0,0,0,1,1,1,1],s=[0,0,0,1,1,1],r=(o+n)/2,l=e.map(c=>{const i=t(c,o),u=t(c,n);return[new et(i.x,i.y,i.z,1),new et((i.x+u.x)/2,r,(i.z+u.z)/2,1),new et(u.x,u.y,u.z,1)]});return new It(3,2,a,s,l)}function Zt({width:e,depth:t,height:o}){const n=e/2,a=t/2,s=o/2,r=-o/2;return{top:me(n,a,s),bottom:pe(n,a,r),front:bt([-n,-n/3,n/3,n],(l,c)=>({x:l,y:c,z:a}),r,s),back:bt([n,n/3,-n/3,-n],(l,c)=>({x:l,y:c,z:-a}),r,s),right:bt([a,a/3,-a/3,-a],(l,c)=>({x:n,y:c,z:l}),r,s),left:bt([-a,-a/3,a/3,a],(l,c)=>({x:-n,y:c,z:l}),r,s)}}function $t(e,t,o,n){const a=Math.max(8,Math.round(t*(o/n))),s=Math.max(4,Math.round(t/4)),r=l=>(c,i,u)=>l.getPoint(c,i,u);return[new ct(r(e.top),t,t),new ct(r(e.bottom),s,s),new ct(r(e.front),t,a),new ct(r(e.back),t,a),new ct(r(e.right),t,a),new ct(r(e.left),t,a)]}const fe=1/30;function ve(e){const t=new Float32Array(e*e*4);for(let n=0;n<e*e;n+=1)t[n*4+3]=1;const o=new Wt(t,e,e,At,Pt);return o.colorSpace=Bt,o.generateMipmaps=!1,o.magFilter=it,o.minFilter=it,o.needsUpdate=!0,o.wrapS=lt,o.wrapT=lt,{current:new Float32Array(e*e),previous:new Float32Array(e*e),next:new Float32Array(e*e),size:e,texture:o,textureData:t}}function xe(e){const t=e;t.current.fill(0),t.previous.fill(0),t.next.fill(0);for(let o=0;o<t.size*t.size;o+=1){const n=o*4;t.textureData[n]=0,t.textureData[n+1]=0,t.textureData[n+2]=0,t.textureData[n+3]=1}t.texture.needsUpdate=!0}function de(e,t,o,n){return{u:e/Math.max(o,1e-4)+.5,v:.5-t/Math.max(n,1e-4)}}function Q(e,t,o,n,a){if(!a)return 0;const{current:s,size:r}=a,{u:l,v:c}=de(e,t,o,n);if(l<0||l>1||c<0||c>1)return 0;const i=l*(r-1),u=c*(r-1),p=Math.floor(i),m=Math.floor(u),v=Math.min(p+1,r-1),S=Math.min(m+1,r-1),M=i-p,d=u-m,y=s[m*r+p],b=s[m*r+v],_=s[S*r+p],g=s[S*r+v],W=at.lerp(y,b,M),O=at.lerp(_,g,M);return at.lerp(W,O,d)}function be(e,t,o,n,a,s=new D){if(!a)return s.set(0,1,0);const r=Math.max(a.size,1),l=Math.max(o/r,1e-4),c=Math.max(n/r,1e-4),i=Q(e-l,t,o,n,a),u=Q(e+l,t,o,n,a),p=Q(e,t-c,o,n,a),m=Q(e,t+c,o,n,a);return s.set((i-u)/(l*2),1,(p-m)/(c*2)).normalize()}function Me(e,t,o=new D){const n=Math.max(Math.abs(e.y),1e-4),a=Math.max(Math.abs(t.y),1e-4),s=-e.x/n,r=-e.z/n,l=-t.x/a,c=-t.z/a;return o.set(-(s+l),1,-(r+c)).normalize()}function ye({x:e,z:t,width:o,depth:n,waveHeight:a,waveChoppiness:s,waveSpeed:r,interactionState:l=null}){return vt(e,t,a,s,r)+Q(e,t,o,n,l)}function Se({x:e,z:t,width:o,depth:n,waveHeight:a,waveChoppiness:s,waveSpeed:r,interactionState:l=null,target:c=new D}){const i=ue(e,t,a,s,r);if(!l)return c.set(i.x,i.y,i.z).normalize();const u=be(e,t,o,n,l);return Me(new D(i.x,i.y,i.z),u,c)}function ze(e,t,o){const{current:n,next:a,previous:s,size:r,texture:l,textureData:c}=e,i=Math.max(t.width,1e-4),u=Math.max(t.depth,1e-4);for(let m=0;m<r;m+=1){const S=(.5-m/(r-1))*u,M=Math.max(m-1,0)*r,d=m*r,y=Math.min(m+1,r-1)*r;for(let b=0;b<r;b+=1){const g=(b/(r-1)-.5)*i,W=d+Math.max(b-1,0),O=d+Math.min(b+1,r-1),ot=d+b,L=n[M+b],k=n[y+b],f=n[O],ut=n[W];let st=((L+k+f+ut)*.5-s[ot])*t.viscosity;if(t.enabled&&o.active){const I=g-o.x,j=S-o.z,mt=Math.min(Math.PI,Math.sqrt(I*I+j*j)*Math.PI/Math.max(t.radius,1e-4));st-=(Math.cos(mt)+1)*t.rippleDepth}a[ot]=st}}const p=e;p.previous=n,p.current=a,p.next=s;for(let m=0;m<r*r;m+=1){const v=m*4;c[v]=p.current[m],c[v+1]=p.previous[m],c[v+2]=0,c[v+3]=1}return l.needsUpdate=!0,p}function De({depth:e,enabled:t=!1,radius:o=.28,resolution:n=96,rippleDepth:a=.012,viscosity:s=.92,width:r}){const l=x.useRef({active:!1,x:0,z:0}),c=x.useMemo(()=>ve(n),[n]),i=x.useRef(c),u=x.useRef({depth:e,enabled:t,radius:o,rippleDepth:a,viscosity:s,width:r});i.current=c,u.current={depth:e,enabled:t,radius:o,rippleDepth:a,viscosity:s,width:r};const p=x.useCallback((y,b)=>{l.current.active=!0,l.current.x=y,l.current.z=b},[]),m=x.useCallback(()=>{l.current.active=!1},[]),v=x.useCallback(()=>{m(),xe(i.current)},[m]),S=x.useCallback(y=>{Math.min(Math.max(y,0),fe)<=0||!u.current.enabled||ze(i.current,u.current,l.current)},[]),M=x.useCallback((y,b,_,g,W)=>ye({x:y,z:b,width:u.current.width,depth:u.current.depth,waveHeight:_,waveChoppiness:g,waveSpeed:W,interactionState:i.current}),[]),d=x.useCallback((y,b,_,g,W,O)=>Se({x:y,z:b,width:u.current.width,depth:u.current.depth,waveHeight:_,waveChoppiness:g,waveSpeed:W,interactionState:i.current,target:O}),[]);return x.useEffect(()=>{t||v()},[t,v]),x.useEffect(()=>()=>c.texture.dispose(),[c]),x.useMemo(()=>({advance:S,clearPointerTarget:m,configRef:u,interactionStateRef:i,pointerTargetRef:l,reset:v,sampleHeight:M,sampleNormal:d,setPointerTarget:p}),[S,m,v,M,d,p])}te({Line2:ce});const ge=`
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveChoppiness;
  uniform float uWaveSpeed;
  uniform float uColumnTop;
  uniform float uColumnBottom;
  uniform float uInteractionEnabled;
  uniform float uInteractionResolution;
  uniform sampler2D uInteractionHeightmap;
  uniform vec2 uInteractionBounds;

  varying float vNormHeight;

  vec2 interactionUvFromXZ(vec2 xz) {
    return vec2(
      xz.x / max(uInteractionBounds.x, 0.0001) + 0.5,
      0.5 - xz.y / max(uInteractionBounds.y, 0.0001)
    );
  }

  float sampleInteractionHeight(vec2 xz) {
    vec2 uv = clamp(interactionUvFromXZ(xz), vec2(0.0), vec2(1.0));
    return texture2D(uInteractionHeightmap, uv).x * uInteractionEnabled;
  }

  vec3 sampleInteractionNormal(vec2 xz) {
    vec2 uv = clamp(interactionUvFromXZ(xz), vec2(0.0), vec2(1.0));
    float resolution = max(uInteractionResolution, 1.0);
    vec2 texel = vec2(1.0 / resolution);
    vec2 worldTexel = max(uInteractionBounds / resolution, vec2(0.0001));
    float left = texture2D(
      uInteractionHeightmap,
      clamp(uv + vec2(-texel.x, 0.0), vec2(0.0), vec2(1.0))
    ).x * uInteractionEnabled;
    float right = texture2D(
      uInteractionHeightmap,
      clamp(uv + vec2(texel.x, 0.0), vec2(0.0), vec2(1.0))
    ).x * uInteractionEnabled;
    float back = texture2D(
      uInteractionHeightmap,
      clamp(uv + vec2(0.0, -texel.y), vec2(0.0), vec2(1.0))
    ).x * uInteractionEnabled;
    float front = texture2D(
      uInteractionHeightmap,
      clamp(uv + vec2(0.0, texel.y), vec2(0.0), vec2(1.0))
    ).x * uInteractionEnabled;

    return normalize(
      vec3(
        (left - right) / (worldTexel.x * 2.0),
        1.0,
        (back - front) / (worldTexel.y * 2.0)
      )
    );
  }

  vec3 combineSurfaceNormals(vec3 baseNormal, vec3 detailNormal) {
    float safeBaseY = max(abs(baseNormal.y), 0.0001);
    float safeDetailY = max(abs(detailNormal.y), 0.0001);
    vec2 baseSlope = -baseNormal.xz / safeBaseY;
    vec2 detailSlope = -detailNormal.xz / safeDetailY;
    return normalize(
      vec3(-(baseSlope.x + detailSlope.x), 1.0, -(baseSlope.y + detailSlope.y))
    );
  }

  float sampleBaseWaveHeight(vec2 xz) {
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
      float theta = dot(dirs[i], xz) * freqs[i] + uTime * phase;
      heightDisp += amp * cos(theta);
    }

    return heightDisp;
  }

  // Y-only wave displacement — walls stay vertical, only top undulates
  vec3 nurbsWaveDisplace(vec3 pos) {
    float normY = clamp(
      (pos.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
    );
    // Only vertices near the top move (sides lerp from 0 at bottom to full at top)
    float blend = smoothstep(0.5, 1.0, normY);
    float heightDisp =
      sampleBaseWaveHeight(pos.xz) + sampleInteractionHeight(pos.xz);

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
`,Ee=`
  #include <common>
  ${ge}
`,Ne=`
  // Blend wave normals in for top-facing surfaces only
  float _isTopFacing = step(0.5, normal.y);
  float _normY = clamp(
    (position.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
  );
  float _normalBlend = _isTopFacing * smoothstep(0.8, 1.0, _normY);
  vec3 _waveNorm = nurbsWaveNormal(position);
  vec3 _interactionNorm = sampleInteractionNormal(position.xz);
  vec3 _combinedWaveNorm = combineSurfaceNormals(_waveNorm, _interactionNorm);
  vec3 objectNormal = mix(vec3(normal), _combinedWaveNorm, _normalBlend);
  #ifdef USE_TANGENT
    vec3 objectTangent = vec3(tangent.xyz);
  #endif
`,Te=`
  vec3 waveD = nurbsWaveDisplace(position);
  vec3 transformed = position + waveD;
  vNormHeight = clamp(
    (transformed.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
  );
  #ifdef USE_ALPHAHASH
    vPosition = vec3(position);
  #endif
`,he=`
  uniform vec3 uTopColor;
  uniform vec3 uBottomColor;
  varying float vNormHeight;
`,We=`
  #include <color_fragment>
  diffuseColor.rgb = mix(uBottomColor, uTopColor, vNormHeight);
`,yt=32;function Ae(e,t,o,n){const a=new Nt;a.setPositions([-e,n,-t,e,n,-t,e,n,t,-e,n,t,-e,n,-t]);const r=[[-e,-t],[e,-t],[e,t],[-e,t]].map(([i,u])=>{const p=new Nt;return p.setPositions([i,n,u,i,o,u]),{geo:p,cx:i,cz:u}}),c=[{x0:-e,z0:-t,x1:e,z1:-t},{x0:e,z0:-t,x1:e,z1:t},{x0:e,z0:t,x1:-e,z1:t},{x0:-e,z0:t,x1:-e,z1:-t}].map(i=>{const u=[];for(let m=0;m<=yt;m+=1){const v=m/yt;u.push(i.x0+(i.x1-i.x0)*v,o,i.z0+(i.z1-i.z0)*v)}const p=new Nt;return p.setPositions(u),{geo:p,edge:i}});return{bottomGeo:a,vertGeos:r,topGeos:c}}function Pe(){const e=new Float32Array([0,0,0,1]),t=new Wt(e,1,1,At,Pt);return t.colorSpace=Bt,t.generateMipmaps=!1,t.magFilter=it,t.minFilter=it,t.needsUpdate=!0,t.wrapS=lt,t.wrapT=lt,t}function Be({width:e=3.6,depth:t=3.6,height:o=6,segments:n=24,topColor:a="#9edff0",bottomColor:s="#246f98",opacity:r=.34,transmission:l=.5,roughness:c=.3,ior:i=1.12,thickness:u=.35,waveHeight:p=.15,waveChoppiness:m=.5,waveSpeed:v=.6,waveHeightRef:S=null,waveChoppinessRef:M=null,waveSpeedRef:d=null,edgeColor:y="#1f4455",edgeOpacity:b=.65,edgeLineWidth:_=1,showEdges:g=!0,interactionRuntime:W=null}){const O=x.useRef(),ot=x.useRef(new D),L=x.useRef(0),k=x.useMemo(()=>Pe(),[]),f=x.useMemo(()=>({uTime:{value:L.current},uWaveHeight:{value:p},uWaveChoppiness:{value:m},uWaveSpeed:{value:v},uColumnTop:{value:o/2},uColumnBottom:{value:-o/2},uInteractionBounds:{value:new qt(e,t)},uInteractionEnabled:{value:0},uInteractionHeightmap:{value:k},uInteractionResolution:{value:1},uTopColor:{value:new ft(a)},uBottomColor:{value:new ft(s)}}),[k,a,s,t,o,e]),ut=x.useMemo(()=>{const E=Zt({width:e,depth:t,height:o});return $t(E,n,o,Math.max(e,t))},[e,t,o,n]),st=x.useMemo(()=>{const E=new Kt({transparent:!0,opacity:r,transmission:l,roughness:c,metalness:0,ior:i,thickness:u,side:Vt,depthWrite:!0});return E.onBeforeCompile=P=>{const A=P;Object.entries(f).forEach(([q,U])=>{A.uniforms[q]=U}),A.vertexShader=A.vertexShader.replace("#include <common>",Ee),A.vertexShader=A.vertexShader.replace("#include <beginnormal_vertex>",Ne),A.vertexShader=A.vertexShader.replace("#include <begin_vertex>",Te),A.fragmentShader=A.fragmentShader.replace("#include <common>",`#include <common>
${he}`),A.fragmentShader=A.fragmentShader.replace("#include <color_fragment>",We)},E},[f,r,l,c,i,u]),I=x.useMemo(()=>{if(!g)return null;const E=e/2,P=t/2;return Ae(E,P,o/2,-o/2)},[g,e,o,t]),j=x.useMemo(()=>new se({transparent:!0,depthTest:!0,depthWrite:!1,toneMapped:!1}),[]),mt=x.useMemo(()=>new Ot(e,t,1,1),[t,e]),zt=x.useMemo(()=>o/2+Math.max(p*1.5+.048,.02),[o,p]),xt=x.useCallback(()=>{W?.clearPointerTarget()},[W]),G=x.useCallback(E=>{if(!O.current||!W)return;E.stopPropagation();const P=O.current.worldToLocal(ot.current.copy(E.point));W.setPointerTarget(at.clamp(P.x,-e/2,e/2),at.clamp(P.z,-t/2,t/2))},[t,W,e]);return x.useEffect(()=>()=>k.dispose(),[k]),Ut((E,P)=>{L.current+=P;const A=S?.current??p,q=d?.current??v,U=M?.current??m,X=W?.interactionStateRef.current,$=W?.configRef.current.enabled;if(f.uTime.value=L.current,f.uWaveHeight.value=A,f.uWaveChoppiness.value=U,f.uWaveSpeed.value=q,Xt(L.current),W?.advance(P),f.uInteractionBounds.value.set(e,t),f.uInteractionEnabled.value=$?1:0,f.uInteractionHeightmap.value=X?.texture??k,f.uInteractionResolution.value=X?.size??1,g&&j&&(j.color.set(y),j.opacity=b,j.linewidth=_,j.resolution.set(E.size.width,E.size.height)),I){const w=o/2,T=-o/2;I.topGeos.forEach(({geo:N,edge:z})=>{const h=[];for(let C=0;C<=yt;C+=1){const B=C/yt,R=z.x0+(z.x1-z.x0)*B,Y=z.z0+(z.z1-z.z0)*B,V=vt(R,Y,A,U,q),J=$?Q(R,Y,e,t,X):0;h.push(R,w+V+J,Y)}N.setPositions(h)}),I.vertGeos.forEach(({geo:N,cx:z,cz:h})=>{const C=vt(z,h,A,U,q),B=$?Q(z,h,e,t,X):0;N.setPositions([z,T,h,z,w+C+B,h])})}}),H.jsxs("group",{ref:O,children:[ut.map((E,P)=>H.jsx("mesh",{geometry:E,material:st},P)),W&&H.jsx("mesh",{geometry:mt,onPointerMove:G,onPointerOut:xt,onPointerOver:G,position:[0,zt,0],"rotation-x":-Math.PI/2,children:H.jsx("meshBasicMaterial",{depthWrite:!1,opacity:0,transparent:!0})}),g&&I&&H.jsxs(H.Fragment,{children:[H.jsx("line2",{geometry:I.bottomGeo,material:j}),I.vertGeos.map(({geo:E},P)=>H.jsx("line2",{geometry:E,material:j},`v${P}`)),I.topGeos.map(({geo:E},P)=>H.jsx("line2",{geometry:E,material:j},`t${P}`))]})]})}const St=32,Lt=[[-1,-1],[1,-1],[1,1],[-1,1]],Ie=[[0,1],[1,2],[2,3],[3,0]];function we(e,t,o,n,a){const s=new ae,r=[new D(-e,n,-t),new D(e,n,-t),new D(e,n,t),new D(-e,n,t),new D(-e,n,-t)];s.add(new Et(new Mt().setFromPoints(r),a));const l=Lt.map(([u,p])=>{const m=u*e,v=p*t,S=new Float32Array([m,n,v,m,o,v]),M=new Mt;return M.setAttribute("position",new Ct(S,3)),M.attributes.position.usage=Rt,s.add(new Et(M,a)),{geo:M,cx:m,cz:v}}),c=Lt.map(([u,p])=>({x:u*e,z:p*t})),i=Ie.map(([u,p])=>{const m=c[u],v=c[p],S=St+1,M=new Float32Array(S*3);for(let y=0;y<S;y+=1){const b=y/St;M[y*3]=m.x+(v.x-m.x)*b,M[y*3+1]=o,M[y*3+2]=m.z+(v.z-m.z)*b}const d=new Mt;return d.setAttribute("position",new Ct(M,3)),d.attributes.position.usage=Rt,s.add(new Et(d,a)),{geo:d,a:m,b:v}});return{corners:l,edgeMat:a,group:s,topEdges:i}}function Ce(){const e=new Float32Array([0,0,0,1]),t=new Wt(e,1,1,At,Pt);return t.colorSpace=Bt,t.generateMipmaps=!1,t.magFilter=it,t.minFilter=it,t.needsUpdate=!0,t.wrapS=lt,t.wrapT=lt,t}function Re({width:e=3.6,depth:t=3.6,height:o=6,segments:n=24,topColor:a="#9edff0",bottomColor:s="#246f98",opacity:r=.34,transmission:l=.5,roughness:c=.3,ior:i=1.12,thickness:u=.35,waveHeight:p=.15,waveChoppiness:m=.5,waveSpeed:v=.6,waveHeightRef:S=null,waveChoppinessRef:M=null,waveSpeedRef:d=null,edgeColor:y="#1f4455",edgeOpacity:b=.65,showEdges:_=!0,interactionRuntime:g=null}){const W=x.useRef(),O=x.useRef(new D),ot=x.useRef(0),L=x.useMemo(()=>Ce(),[]),k=x.useMemo(()=>new ee(L),[L]),f=x.useMemo(()=>({botColor:Z(new ft(s)),colBot:Z(-o/2),colTop:Z(o/2),interactionBounds:Z(new qt(e,t)),interactionEnabled:Z(0),interactionResolution:Z(1),time:Z(0),topColor:Z(new ft(a)),waveChop:Z(m),waveHeight:Z(p),waveSpeed:Z(v)}),[s,t,o,a,m,p,v,e]);x.useEffect(()=>()=>L.dispose(),[L]);const ut=x.useMemo(()=>{const G=K(()=>{const T=f.interactionBounds.x.max(F(1e-4)),N=f.interactionBounds.y.max(F(1e-4));return nt(tt.x.div(T).add(.5),F(.5).sub(tt.z.div(N)))}),E=K(()=>pt(k,G()).x.mul(f.interactionEnabled)),P=K(()=>{const T=G(),N=f.interactionResolution.max(F(1)),z=F(1).div(N),h=f.interactionBounds.x.div(N).max(F(1e-4)),C=f.interactionBounds.y.div(N).max(F(1e-4)),B=pt(k,T.add(nt(z.negate(),0))).x.mul(f.interactionEnabled),R=pt(k,T.add(nt(z,0))).x.mul(f.interactionEnabled),Y=pt(k,T.add(nt(0,z.negate()))).x.mul(f.interactionEnabled),V=pt(k,T.add(nt(0,z))).x.mul(f.interactionEnabled);return Tt(dt(B.sub(R).div(h.mul(2)),1,Y.sub(V).div(C.mul(2))))}),A=K(()=>{const T=F(0).toVar();return rt.forEach(({dx:N,dz:z,freq:h,amp:C})=>{const B=Ft(nt(N,z),tt.xz).mul(h).add(f.time.mul(f.waveSpeed).mul(h));T.addAssign(F(C).mul(f.waveHeight).mul(_t(B)))}),T}),q=K(()=>{const T=ht(tt.y.sub(f.colBot).div(f.colTop.sub(f.colBot)),0,1),N=Ht(.5,1,T);return A().add(E()).mul(N)}),U=K(()=>{const T=F(0).toVar(),N=F(1).toVar(),z=F(0).toVar();return rt.forEach(({dx:h,dz:C,freq:B,amp:R})=>{const Y=f.waveChop.div(B*R*4),V=F(B*R).mul(f.waveHeight),J=Ft(nt(h,C),tt.xz).mul(B).add(f.time.mul(f.waveSpeed).mul(B));T.subAssign(F(h).mul(V).mul(Dt(J))),z.subAssign(F(C).mul(V).mul(Dt(J))),N.subAssign(Y.mul(V).mul(_t(J)))}),Tt(dt(T,N,z))}),X=K(()=>{const T=ht(tt.y.sub(f.colBot).div(f.colTop.sub(f.colBot)),0,1),N=kt.y.greaterThan(.5).select(Ht(.8,1,T),F(0)),z=U(),h=P(),C=z.y.abs().max(F(1e-4)),B=h.y.abs().max(F(1e-4)),R=z.xz.negate().div(C),Y=h.xz.negate().div(B),V=Tt(dt(R.x.add(Y.x).negate(),1,R.y.add(Y.y).negate()));return Gt(kt,V,N)}),$=K(()=>{const T=tt.y.add(q()),N=ht(T.sub(f.colBot).div(f.colTop.sub(f.colBot)),0,1);return Gt(f.botColor,f.topColor,N)}),w=new oe({transparent:!0,side:Vt,depthWrite:!0});return w.color.set(a),w.attenuationColor.set(s),w.opacity=r,w.transmission=l*0,w.roughness=c,w.metalness=0,w.ior=i,w.thickness=u,w.positionNode=tt.add(dt(0,q(),0)),w.normalNode=X(),w.colorNode=$(),w},[s,i,k,r,c,u,l,a,f]),st=x.useMemo(()=>{const G=Zt({width:e,depth:t,height:o});return $t(G,n,o,Math.max(e,t))},[t,o,n,e]),I=x.useMemo(()=>{if(!_)return null;const G=new ne({color:new ft(y),opacity:b,transparent:!0,depthTest:!0,depthWrite:!1,toneMapped:!1});return we(e/2,t/2,o/2,-o/2,G)},[t,y,b,o,_,e]),j=x.useMemo(()=>new Ot(e,t,1,1),[t,e]),mt=x.useMemo(()=>o/2+Math.max(p*1.5+.048,.02),[o,p]),zt=x.useCallback(()=>{g?.clearPointerTarget()},[g]),xt=x.useCallback(G=>{if(!W.current||!g)return;G.stopPropagation();const E=W.current.worldToLocal(O.current.copy(G.point));g.setPointerTarget(at.clamp(E.x,-e/2,e/2),at.clamp(E.z,-t/2,t/2))},[t,g,e]);return Ut((G,E)=>{ot.current+=E;const P=ot.current,A=S?.current??p,q=d?.current??v,U=M?.current??m,X=g?.interactionStateRef.current,$=g?.configRef.current.enabled;if(Xt(P),g?.advance(E),f.time.value=P,f.waveHeight.value=A,f.waveSpeed.value=q,f.waveChop.value=U,f.colTop.value=o/2,f.colBot.value=-o/2,f.topColor.value.set(a),f.botColor.value.set(s),f.interactionBounds.value.set(e,t),f.interactionEnabled.value=$?1:0,k.value=X?.texture??L,f.interactionResolution.value=X?.size??1,!_||!I)return;I.edgeMat.color.set(y),I.edgeMat.opacity=b;const w=o/2;I.corners.forEach(({geo:T,cx:N,cz:z})=>{const h=vt(N,z,A,U,q),C=$?Q(N,z,e,t,X):0,B=T.attributes.position,R=B.array;R[4]=w+h+C,B.needsUpdate=!0}),I.topEdges.forEach(({geo:T,a:N,b:z})=>{const h=T.attributes.position,C=h.array,B=St+1;for(let R=0;R<B;R+=1){const Y=R/St,V=N.x+(z.x-N.x)*Y,J=N.z+(z.z-N.z)*Y,Qt=vt(V,J,A,U,q),Jt=$?Q(V,J,e,t,X):0;C[R*3+1]=w+Qt+Jt}h.needsUpdate=!0})}),H.jsxs("group",{ref:W,children:[st.map((G,E)=>H.jsx("mesh",{geometry:G,material:ut},E)),g&&H.jsx("mesh",{geometry:j,onPointerMove:xt,onPointerOut:zt,onPointerOver:xt,position:[0,mt,0],"rotation-x":-Math.PI/2,children:H.jsx("meshBasicMaterial",{depthWrite:!1,opacity:0,transparent:!0})}),_&&I&&H.jsx("primitive",{object:I.group})]})}function ke(e){return re(o=>o.gl)?.isWebGPURenderer===!0?H.jsx(Re,{...e}):H.jsx(Be,{...e})}export{It as N,ct as P,ue as a,ke as b,vt as s,De as u};
