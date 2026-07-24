import{a7 as ze,V as D,b2 as Ae,al as oe,r as b,bx as he,ba as Ce,at as De,bg as we,K as me,y as pe,p as K,j as G,q as be,x as Ze,Z as lt,Y as $e,b4 as Qe,n as Je,o as it,w as ut,bD as mt,cY as pt,aA as ft,b3 as We,a8 as _e,am as ke,m as vt}from"./index-CRhP28aw.js";import{b as xt,d as Pe,a as dt}from"./Line2-CJTZQ6EU.js";import{u as X,F as te,f as _,v as ae,aA as ne,e as de,aS as Be,a as Se,az as Ge,T as je,d as Ie,s as Le,S as Ye,a7 as qe,m as Re}from"./three.tsl-DWuWk0ah.js";class ue extends ze{constructor(e=(r,s,a)=>a.set(r,s,Math.cos(r)*Math.sin(s)),n=8,o=8){super(),this.type="ParametricGeometry",this.parameters={func:e,slices:n,stacks:o};const r=[],s=[],a=[],i=[],c=1e-5,l=new D,u=new D,p=new D,m=new D,v=new D,y=n+1;for(let g=0;g<=o;g++){const x=g/o;for(let S=0;S<=n;S++){const M=S/n;e(M,x,u),s.push(u.x,u.y,u.z),M-c>=0?(e(M-c,x,p),m.subVectors(u,p)):(e(M+c,x,p),m.subVectors(p,u)),x-c>=0?(e(M,x-c,p),v.subVectors(u,p)):(e(M,x+c,p),v.subVectors(p,u)),l.crossVectors(m,v).normalize(),a.push(l.x,l.y,l.z),i.push(M,x)}}for(let g=0;g<o;g++)for(let x=0;x<n;x++){const S=g*y+x,M=g*y+x+1,C=(g+1)*y+x+1,d=(g+1)*y+x;r.push(S,M,d),r.push(M,C,d)}this.setIndex(r),this.setAttribute("position",new Ae(s,3)),this.setAttribute("normal",new Ae(a,3)),this.setAttribute("uv",new Ae(i,2))}}function Ve(t,e,n){const o=n.length-t-1;if(e>=n[o])return o-1;if(e<=n[t])return t;let r=t,s=o,a=Math.floor((r+s)/2);for(;e<n[a]||e>=n[a+1];)e<n[a]?s=a:r=a,a=Math.floor((r+s)/2);return a}function Oe(t,e,n,o){const r=[],s=[],a=[];r[0]=1;for(let i=1;i<=n;++i){s[i]=e-o[t+1-i],a[i]=o[t+i]-e;let c=0;for(let l=0;l<i;++l){const u=a[l+1],p=s[i-l],m=r[l]/(u+p);r[l]=c+u*m,c=p*m}r[i]=c}return r}function bt(t,e,n,o,r,s,a,i){const c=Ve(t,s,n),l=Ve(e,a,o),u=Oe(c,s,t,n),p=Oe(l,a,e,o),m=[];for(let y=0;y<=e;++y){m[y]=new oe(0,0,0,0);for(let g=0;g<=t;++g){const x=r[c-t+g][l-e+y].clone(),S=x.w;x.x*=S,x.y*=S,x.z*=S,m[y].add(x.multiplyScalar(u[g]))}}const v=new oe(0,0,0,0);for(let y=0;y<=e;++y)v.add(m[y].multiplyScalar(p[y]));v.divideScalar(v.w),i.set(v.x,v.y,v.z)}class He{constructor(e,n,o,r,s){this.degree1=e,this.degree2=n,this.knots1=o,this.knots2=r,this.controlPoints=[];const a=o.length-e-1,i=r.length-n-1;for(let c=0;c<a;++c){this.controlPoints[c]=[];for(let l=0;l<i;++l){const u=s[c][l];this.controlPoints[c][l]=new oe(u.x,u.y,u.z,u.w)}}}getPoint(e,n,o){const r=this.knots1[0]+e*(this.knots1[this.knots1.length-1]-this.knots1[0]),s=this.knots2[0]+n*(this.knots2[this.knots2.length-1]-this.knots2[0]);bt(this.degree1,this.degree2,this.knots1,this.knots2,this.controlPoints,r,s,o)}}const gt=[{dx:.6,dz:.8,freq:1.2,amp:1},{dx:-.4,dz:.9,freq:2.5,amp:.4},{dx:.9,dz:-.3,freq:3.8,amp:.2},{dx:-.7,dz:-.6,freq:5,amp:.1}],se=gt.map(t=>{const e=Math.sqrt(t.dx*t.dx+t.dz*t.dz);return{dx:t.dx/e,dz:t.dz/e,freq:t.freq,amp:t.amp}});let Fe=0;function Ke(t){Fe=t}function ge(t,e,n,o,r){let s=0;for(let a=0;a<se.length;a+=1){const{dx:i,dz:c,freq:l,amp:u}=se[a],p=u*n,m=r*l,v=(i*t+c*e)*l+Fe*m;s+=p*Math.cos(v)}return s}function yt(t,e,n,o,r){let s=0,a=1,i=0;for(let l=0;l<se.length;l+=1){const{dx:u,dz:p,freq:m,amp:v}=se[l],y=v*n,g=o/(m*y*se.length),x=r*m,S=(u*t+p*e)*m+Fe*x,M=Math.sin(S),C=Math.cos(S),d=m*y;s-=u*d*M,i-=p*d*M,a-=g*d*C}const c=Math.sqrt(s*s+a*a+i*i);return{x:s/c,y:a/c,z:i/c}}function St(t,e,n){const o=[0,0,0,0,1,1,1,1],r=[t,t/3,-t/3,-t],s=[-e,-e/3,e/3,e],a=r.map(i=>s.map(c=>new oe(i,n,c,1)));return new He(3,3,o,o,a)}function Mt(t,e,n){const o=[0,0,0,0,1,1,1,1],r=[-t,-t/3,t/3,t],s=[-e,-e/3,e/3,e],a=r.map(i=>s.map(c=>new oe(i,n,c,1)));return new He(3,3,o,o,a)}function Me(t,e,n,o){const r=[0,0,0,0,1,1,1,1],s=[0,0,0,1,1,1],a=(n+o)/2,i=t.map(c=>{const l=e(c,n),u=e(c,o);return[new oe(l.x,l.y,l.z,1),new oe((l.x+u.x)/2,a,(l.z+u.z)/2,1),new oe(u.x,u.y,u.z,1)]});return new He(3,2,r,s,i)}function et({width:t,depth:e,height:n}){const o=t/2,r=e/2,s=n/2,a=-n/2;return{top:St(o,r,s),bottom:Mt(o,r,a),front:Me([-o,-o/3,o/3,o],(i,c)=>({x:i,y:c,z:r}),a,s),back:Me([o,o/3,-o/3,-o],(i,c)=>({x:i,y:c,z:-r}),a,s),right:Me([r,r/3,-r/3,-r],(i,c)=>({x:o,y:c,z:i}),a,s),left:Me([-r,-r/3,r/3,r],(i,c)=>({x:-o,y:c,z:i}),a,s)}}function tt(t,e,n,o){const r=Math.max(8,Math.round(e*(n/o))),s=Math.max(4,Math.round(e/4)),a=i=>(c,l,u)=>i.getPoint(c,l,u);return[new ue(a(t.top),e,e),new ue(a(t.bottom),s,s),new ue(a(t.front),e,r),new ue(a(t.back),e,r),new ue(a(t.right),e,r),new ue(a(t.left),e,r)]}const zt=1/30;function Tt(t){const e=new Float32Array(t*t*4);for(let o=0;o<t*t;o+=1)e[o*4+3]=1;const n=new he(e,t,t,Ce,De);return n.colorSpace=we,n.generateMipmaps=!1,n.magFilter=me,n.minFilter=me,n.needsUpdate=!0,n.wrapS=pe,n.wrapT=pe,{current:new Float32Array(t*t),previous:new Float32Array(t*t),next:new Float32Array(t*t),size:t,texture:n,textureData:e}}function Et(t){const e=t;e.current.fill(0),e.previous.fill(0),e.next.fill(0);for(let n=0;n<e.size*e.size;n+=1){const o=n*4;e.textureData[o]=0,e.textureData[o+1]=0,e.textureData[o+2]=0,e.textureData[o+3]=1}e.texture.needsUpdate=!0}function Nt(t,e,n,o){return{u:t/Math.max(n,1e-4)+.5,v:.5-e/Math.max(o,1e-4)}}function J(t,e,n,o,r){if(!r)return 0;const{current:s,size:a}=r,{u:i,v:c}=Nt(t,e,n,o);if(i<0||i>1||c<0||c>1)return 0;const l=i*(a-1),u=c*(a-1),p=Math.floor(l),m=Math.floor(u),v=Math.min(p+1,a-1),y=Math.min(m+1,a-1),g=l-p,x=u-m,S=s[m*a+p],M=s[m*a+v],C=s[y*a+p],d=s[y*a+v],N=K.lerp(S,M,g),L=K.lerp(C,d,g);return K.lerp(N,L,x)}function At(t,e,n,o,r,s=new D){if(!r)return s.set(0,1,0);const a=Math.max(r.size,1),i=Math.max(n/a,1e-4),c=Math.max(o/a,1e-4),l=J(t-i,e,n,o,r),u=J(t+i,e,n,o,r),p=J(t,e-c,n,o,r),m=J(t,e+c,n,o,r);return s.set((l-u)/(i*2),1,(p-m)/(c*2)).normalize()}function Wt(t,e,n=new D){const o=Math.max(Math.abs(t.y),1e-4),r=Math.max(Math.abs(e.y),1e-4),s=-t.x/o,a=-t.z/o,i=-e.x/r,c=-e.z/r;return n.set(-(s+i),1,-(a+c)).normalize()}function nt({x:t,z:e,width:n,depth:o,waveHeight:r,waveChoppiness:s,waveSpeed:a,interactionState:i=null}){return ge(t,e,r,s,a)+J(t,e,n,o,i)}function ot({x:t,z:e,width:n,depth:o,waveHeight:r,waveChoppiness:s,waveSpeed:a,interactionState:i=null,target:c=new D}){const l=yt(t,e,r,s,a);if(!i)return c.set(l.x,l.y,l.z).normalize();const u=At(t,e,n,o,i);return Wt(new D(l.x,l.y,l.z),u,c)}function Pt(t,e,n){const{current:o,next:r,previous:s,size:a,texture:i,textureData:c}=t,l=Math.max(e.width,1e-4),u=Math.max(e.depth,1e-4);for(let m=0;m<a;m+=1){const y=(.5-m/(a-1))*u,g=Math.max(m-1,0)*a,x=m*a,S=Math.min(m+1,a-1)*a;for(let M=0;M<a;M+=1){const d=(M/(a-1)-.5)*l,N=x+Math.max(M-1,0),L=x+Math.min(M+1,a-1),Z=x+M,fe=o[g+M],ce=o[S+M],q=o[L],j=o[N];let f=((fe+ce+q+j)*.5-s[Z])*e.viscosity;if(e.enabled&&n.active){const le=d-n.x,ie=y-n.z,k=Math.min(Math.PI,Math.sqrt(le*le+ie*ie)*Math.PI/Math.max(e.radius,1e-4));f-=(Math.cos(k)+1)*e.rippleDepth}r[Z]=f}}const p=t;p.previous=o,p.current=r,p.next=s;for(let m=0;m<a*a;m+=1){const v=m*4;c[v]=p.current[m],c[v+1]=p.previous[m],c[v+2]=0,c[v+3]=1}return i.needsUpdate=!0,p}function Vt({depth:t,enabled:e=!1,radius:n=.28,resolution:o=96,rippleDepth:r=.012,viscosity:s=.92,width:a}){const i=b.useRef({active:!1,x:0,z:0}),c=b.useMemo(()=>Tt(o),[o]),l=b.useRef(c),u=b.useRef({depth:t,enabled:e,radius:n,rippleDepth:r,viscosity:s,width:a});l.current=c,u.current={depth:t,enabled:e,radius:n,rippleDepth:r,viscosity:s,width:a};const p=b.useCallback((S,M)=>{i.current.active=!0,i.current.x=S,i.current.z=M},[]),m=b.useCallback(()=>{i.current.active=!1},[]),v=b.useCallback(()=>{m(),Et(l.current)},[m]),y=b.useCallback(S=>{Math.min(Math.max(S,0),zt)<=0||!u.current.enabled||Pt(l.current,u.current,i.current)},[]),g=b.useCallback((S,M,C,d,N)=>nt({x:S,z:M,width:u.current.width,depth:u.current.depth,waveHeight:C,waveChoppiness:d,waveSpeed:N,interactionState:l.current}),[]),x=b.useCallback((S,M,C,d,N,L)=>ot({x:S,z:M,width:u.current.width,depth:u.current.depth,waveHeight:C,waveChoppiness:d,waveSpeed:N,interactionState:l.current,target:L}),[]);return b.useEffect(()=>{e||v()},[e,v]),b.useEffect(()=>()=>c.texture.dispose(),[c]),b.useMemo(()=>({advance:y,clearPointerTarget:m,configRef:u,interactionStateRef:l,pointerTargetRef:i,reset:v,sampleHeight:g,sampleNormal:x,setPointerTarget:p}),[y,m,v,g,x,p])}function rt({geometry:t,hitRef:e,interactionHitY:n,onPointerMove:o,onPointerOut:r,onPointerOver:s}){return G.jsx("mesh",{ref:e,geometry:t,onPointerMove:o,onPointerOut:r,onPointerOver:s,position:[0,n,0],"rotation-x":-Math.PI/2,userData:{lightningIgnore:!0},children:G.jsx("meshBasicMaterial",{depthWrite:!1,opacity:0,transparent:!0})})}function Ue({waveChoppiness:t,waveChoppinessRef:e,waveHeight:n,waveHeightRef:o,waveSpeed:r,waveSpeedRef:s}){return{waveChoppiness:e?.current??t,waveHeight:o?.current??n,waveSpeed:s?.current??r}}function at({depth:t,groupRef:e,height:n,interactionRuntime:o=null,waveChoppiness:r,waveChoppinessRef:s=null,waveHeight:a,waveHeightRef:i=null,waveSpeed:c,waveSpeedRef:l=null,width:u}){const p=new D,m=new D;return({intersection:v})=>{const y=e.current;if(!y)return null;const g=y.worldToLocal(v.point.clone()),x=K.clamp(g.x,-u/2,u/2),S=K.clamp(g.z,-t/2,t/2),M=()=>{const d=Ue({waveChoppiness:r,waveChoppinessRef:s,waveHeight:a,waveHeightRef:i,waveSpeed:c,waveSpeedRef:l});return o?.sampleHeight?o.sampleHeight(x,S,d.waveHeight,d.waveChoppiness,d.waveSpeed):nt({depth:t,interactionState:o?.interactionStateRef.current??null,waveChoppiness:d.waveChoppiness,waveHeight:d.waveHeight,waveSpeed:d.waveSpeed,width:u,x,z:S})},C=()=>{const d=Ue({waveChoppiness:r,waveChoppinessRef:s,waveHeight:a,waveHeightRef:i,waveSpeed:c,waveSpeedRef:l});return o?.sampleNormal?o.sampleNormal(x,S,d.waveHeight,d.waveChoppiness,d.waveSpeed,p):ot({depth:t,interactionState:o?.interactionStateRef.current??null,target:p,waveChoppiness:d.waveChoppiness,waveHeight:d.waveHeight,waveSpeed:d.waveSpeed,width:u,x,z:S})};return{follow:!0,normalResolver:()=>m.copy(C()).transformDirection(y.matrixWorld),surfaceType:"water",targetResolver:()=>{const d=new D(x,n/2+M(),S);return y.localToWorld(d)}}}}it({Line2:dt});const Bt=`
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
`,It=`
  #include <common>
  ${Bt}
`,ht=`
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
`,Ct=`
  vec3 waveD = nurbsWaveDisplace(position);
  vec3 transformed = position + waveD;
  vNormHeight = clamp(
    (transformed.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
  );
  #ifdef USE_ALPHAHASH
    vPosition = vec3(position);
  #endif
`,Dt=`
  uniform vec3 uTopColor;
  uniform vec3 uBottomColor;
  varying float vNormHeight;
`,wt=`
  #include <color_fragment>
  diffuseColor.rgb = mix(uBottomColor, uTopColor, vNormHeight);
`,Te=32;function Ht(t,e,n,o){const r=new Pe;r.setPositions([-t,o,-e,t,o,-e,t,o,e,-t,o,e,-t,o,-e]);const a=[[-t,-e],[t,-e],[t,e],[-t,e]].map(([l,u])=>{const p=new Pe;return p.setPositions([l,o,u,l,n,u]),{geo:p,cx:l,cz:u}}),c=[{x0:-t,z0:-e,x1:t,z1:-e},{x0:t,z0:-e,x1:t,z1:e},{x0:t,z0:e,x1:-t,z1:e},{x0:-t,z0:e,x1:-t,z1:-e}].map(l=>{const u=[];for(let m=0;m<=Te;m+=1){const v=m/Te;u.push(l.x0+(l.x1-l.x0)*v,n,l.z0+(l.z1-l.z0)*v)}const p=new Pe;return p.setPositions(u),{geo:p,edge:l}});return{bottomGeo:r,vertGeos:a,topGeos:c}}function Ft(){const t=new Float32Array([0,0,0,1]),e=new he(t,1,1,Ce,De);return e.colorSpace=we,e.generateMipmaps=!1,e.magFilter=me,e.minFilter=me,e.needsUpdate=!0,e.wrapS=pe,e.wrapT=pe,e}function _t({width:t=3.6,depth:e=3.6,height:n=6,segments:o=24,topColor:r="#9edff0",bottomColor:s="#246f98",opacity:a=.34,transmission:i=.5,roughness:c=.3,ior:l=1.12,thickness:u=.35,waveHeight:p=.15,waveChoppiness:m=.5,waveSpeed:v=.6,waveHeightRef:y=null,waveChoppinessRef:g=null,waveSpeedRef:x=null,edgeColor:S="#1f4455",edgeOpacity:M=.65,edgeLineWidth:C=1,showEdges:d=!0,interactionRuntime:N=null,lightningTarget:L=!1}){const Z=b.useRef(),fe=b.useRef(),ce=b.useRef(new D),q=b.useRef(0),j=b.useMemo(()=>Ft(),[]),f=b.useMemo(()=>({uTime:{value:q.current},uWaveHeight:{value:p},uWaveChoppiness:{value:m},uWaveSpeed:{value:v},uColumnTop:{value:n/2},uColumnBottom:{value:-n/2},uInteractionBounds:{value:new Ze(t,e)},uInteractionEnabled:{value:0},uInteractionHeightmap:{value:j},uInteractionResolution:{value:1},uTopColor:{value:new be(r)},uBottomColor:{value:new be(s)}}),[j,r,s,e,n,t]),le=b.useMemo(()=>{const z=et({width:t,depth:e,height:n});return tt(z,o,n,Math.max(t,e))},[t,e,n,o]),ie=b.useMemo(()=>{const z=new lt({transparent:!0,opacity:a,transmission:i,roughness:c,metalness:0,ior:l,thickness:u,side:$e,depthWrite:!0});return z.onBeforeCompile=I=>{const B=I;Object.entries(f).forEach(([R,O])=>{B.uniforms[R]=O}),B.vertexShader=B.vertexShader.replace("#include <common>",It),B.vertexShader=B.vertexShader.replace("#include <beginnormal_vertex>",ht),B.vertexShader=B.vertexShader.replace("#include <begin_vertex>",Ct),B.fragmentShader=B.fragmentShader.replace("#include <common>",`#include <common>
${Dt}`),B.fragmentShader=B.fragmentShader.replace("#include <color_fragment>",wt)},z},[f,a,i,c,l,u]),k=b.useMemo(()=>{if(!d)return null;const z=t/2,I=e/2;return Ht(z,I,n/2,-n/2)},[d,t,n,e]),$=b.useMemo(()=>new xt({transparent:!0,depthTest:!0,depthWrite:!1,toneMapped:!1}),[]),Ne=b.useMemo(()=>new Qe(t,e,1,1),[e,t]),ve=b.useMemo(()=>n/2+Math.max(p*1.5+.048,.02),[n,p]),re=!!L,xe=b.useMemo(()=>re?at({depth:e,groupRef:Z,height:n,interactionRuntime:N,waveChoppiness:m,waveChoppinessRef:g,waveHeight:p,waveHeightRef:y,waveSpeed:v,waveSpeedRef:x,width:t}):null,[e,n,N,re,m,g,p,y,v,x,t]),ye=b.useCallback(()=>{N?.clearPointerTarget()},[N]),W=b.useCallback(z=>{if(!Z.current||!N)return;z.stopPropagation();const I=Z.current.worldToLocal(ce.current.copy(z.point));N.setPointerTarget(K.clamp(I.x,-t/2,t/2),K.clamp(I.z,-e/2,e/2))},[e,N,t]);return b.useEffect(()=>()=>j.dispose(),[j]),b.useEffect(()=>{const z=Z.current;if(z)return xe?(z.userData.lightningSurfaceType="water",z.userData.lightningTargetAdapter=xe):(delete z.userData.lightningSurfaceType,delete z.userData.lightningTargetAdapter),()=>{delete z.userData.lightningSurfaceType,delete z.userData.lightningTargetAdapter}},[xe]),Je((z,I)=>{q.current+=I;const B=y?.current??p,R=x?.current??v,O=g?.current??m,U=N?.interactionStateRef.current,Q=N?.configRef.current.enabled;if(f.uTime.value=q.current,f.uWaveHeight.value=B,f.uWaveChoppiness.value=O,f.uWaveSpeed.value=R,Ke(q.current),N?.advance(I),f.uInteractionBounds.value.set(t,e),f.uInteractionEnabled.value=Q?1:0,f.uInteractionHeightmap.value=U?.texture??j,f.uInteractionResolution.value=U?.size??1,d&&$&&($.color.set(S),$.opacity=M,$.linewidth=C,$.resolution.set(z.size.width,z.size.height)),k){const w=n/2,A=-n/2;k.topGeos.forEach(({geo:E,edge:T})=>{const P=[];for(let H=0;H<=Te;H+=1){const h=H/Te,F=T.x0+(T.x1-T.x0)*h,Y=T.z0+(T.z1-T.z0)*h,V=ge(F,Y,B,O,R),ee=Q?J(F,Y,t,e,U):0;P.push(F,w+V+ee,Y)}E.setPositions(P)}),k.vertGeos.forEach(({geo:E,cx:T,cz:P})=>{const H=ge(T,P,B,O,R),h=Q?J(T,P,t,e,U):0;E.setPositions([T,A,P,T,w+H+h,P])})}}),G.jsxs("group",{ref:Z,children:[le.map((z,I)=>G.jsx("mesh",{geometry:z,material:ie},I)),(N||re)&&G.jsx(rt,{geometry:Ne,hitRef:fe,interactionHitY:ve,onPointerMove:N?W:void 0,onPointerOut:N?ye:void 0,onPointerOver:N?W:void 0}),d&&k&&G.jsxs(G.Fragment,{children:[G.jsx("line2",{geometry:k.bottomGeo,material:$}),k.vertGeos.map(({geo:z},I)=>G.jsx("line2",{geometry:z,material:$},`v${I}`)),k.topGeos.map(({geo:z},I)=>G.jsx("line2",{geometry:z,material:$},`t${I}`))]})]})}const Ee=32,Xe=[[-1,-1],[1,-1],[1,1],[-1,1]],kt=[[0,1],[1,2],[2,3],[3,0]];function Gt(t,e,n,o,r){const s=new ft,a=[new D(-t,o,-e),new D(t,o,-e),new D(t,o,e),new D(-t,o,e),new D(-t,o,-e)];s.add(new We(new ze().setFromPoints(a),r));const i=Xe.map(([u,p])=>{const m=u*t,v=p*e,y=new Float32Array([m,o,v,m,n,v]),g=new ze;return g.setAttribute("position",new _e(y,3)),g.attributes.position.usage=ke,s.add(new We(g,r)),{geo:g,cx:m,cz:v}}),c=Xe.map(([u,p])=>({x:u*t,z:p*e})),l=kt.map(([u,p])=>{const m=c[u],v=c[p],y=Ee+1,g=new Float32Array(y*3);for(let S=0;S<y;S+=1){const M=S/Ee;g[S*3]=m.x+(v.x-m.x)*M,g[S*3+1]=n,g[S*3+2]=m.z+(v.z-m.z)*M}const x=new ze;return x.setAttribute("position",new _e(g,3)),x.attributes.position.usage=ke,s.add(new We(x,r)),{geo:x,a:m,b:v}});return{corners:i,edgeMat:r,group:s,topEdges:l}}function jt(){const t=new Float32Array([0,0,0,1]),e=new he(t,1,1,Ce,De);return e.colorSpace=we,e.generateMipmaps=!1,e.magFilter=me,e.minFilter=me,e.needsUpdate=!0,e.wrapS=pe,e.wrapT=pe,e}function Lt({width:t=3.6,depth:e=3.6,height:n=6,segments:o=24,topColor:r="#9edff0",bottomColor:s="#246f98",opacity:a=.34,transmission:i=.5,roughness:c=.3,ior:l=1.12,thickness:u=.35,waveHeight:p=.15,waveChoppiness:m=.5,waveSpeed:v=.6,waveHeightRef:y=null,waveChoppinessRef:g=null,waveSpeedRef:x=null,edgeColor:S="#1f4455",edgeOpacity:M=.65,showEdges:C=!0,interactionRuntime:d=null,lightningTarget:N=!1}){const L=b.useRef(),Z=b.useRef(),fe=b.useRef(new D),ce=b.useRef(0),q=b.useMemo(()=>jt(),[]),j=b.useMemo(()=>new ut(q),[q]),f=b.useMemo(()=>({botColor:X(new be(s)),colBot:X(-n/2),colTop:X(n/2),interactionBounds:X(new Ze(t,e)),interactionEnabled:X(0),interactionResolution:X(1),time:X(0),topColor:X(new be(r)),waveChop:X(m),waveHeight:X(p),waveSpeed:X(v)}),[s,e,n,r,m,p,v,t]);b.useEffect(()=>()=>q.dispose(),[q]);const le=b.useMemo(()=>{const W=te(()=>{const A=f.interactionBounds.x.max(_(1e-4)),E=f.interactionBounds.y.max(_(1e-4));return ae(ne.x.div(A).add(.5),_(.5).sub(ne.z.div(E)))}),z=te(()=>de(j,W()).x.mul(f.interactionEnabled)),I=te(()=>{const A=W(),E=f.interactionResolution.max(_(1)),T=_(1).div(E),P=f.interactionBounds.x.div(E).max(_(1e-4)),H=f.interactionBounds.y.div(E).max(_(1e-4)),h=de(j,A.add(ae(T.negate(),0))).x.mul(f.interactionEnabled),F=de(j,A.add(ae(T,0))).x.mul(f.interactionEnabled),Y=de(j,A.add(ae(0,T.negate()))).x.mul(f.interactionEnabled),V=de(j,A.add(ae(0,T))).x.mul(f.interactionEnabled);return Be(Se(h.sub(F).div(P.mul(2)),1,Y.sub(V).div(H.mul(2))))}),B=te(()=>{const A=_(0).toVar();return se.forEach(({dx:E,dz:T,freq:P,amp:H})=>{const h=Ge(ae(E,T),ne.xz).mul(P).add(f.time.mul(f.waveSpeed).mul(P));A.addAssign(_(H).mul(f.waveHeight).mul(je(h)))}),A}),R=te(()=>{const A=Ie(ne.y.sub(f.colBot).div(f.colTop.sub(f.colBot)),0,1),E=Le(.5,1,A);return B().add(z()).mul(E)}),O=te(()=>{const A=_(0).toVar(),E=_(1).toVar(),T=_(0).toVar();return se.forEach(({dx:P,dz:H,freq:h,amp:F})=>{const Y=f.waveChop.div(h*F*4),V=_(h*F).mul(f.waveHeight),ee=Ge(ae(P,H),ne.xz).mul(h).add(f.time.mul(f.waveSpeed).mul(h));A.subAssign(_(P).mul(V).mul(Ye(ee))),T.subAssign(_(H).mul(V).mul(Ye(ee))),E.subAssign(Y.mul(V).mul(je(ee)))}),Be(Se(A,E,T))}),U=te(()=>{const A=Ie(ne.y.sub(f.colBot).div(f.colTop.sub(f.colBot)),0,1),E=qe.y.greaterThan(.5).select(Le(.8,1,A),_(0)),T=O(),P=I(),H=T.y.abs().max(_(1e-4)),h=P.y.abs().max(_(1e-4)),F=T.xz.negate().div(H),Y=P.xz.negate().div(h),V=Be(Se(F.x.add(Y.x).negate(),1,F.y.add(Y.y).negate()));return Re(qe,V,E)}),Q=te(()=>{const A=ne.y.add(R()),E=Ie(A.sub(f.colBot).div(f.colTop.sub(f.colBot)),0,1);return Re(f.botColor,f.topColor,E)}),w=new mt({transparent:!0,side:$e,depthWrite:!0});return w.color.set(r),w.attenuationColor.set(s),w.opacity=a,w.transmission=i*0,w.roughness=c,w.metalness=0,w.ior=l,w.thickness=u,w.positionNode=ne.add(Se(0,R(),0)),w.normalNode=U(),w.colorNode=Q(),w},[s,l,j,a,c,u,i,r,f]),ie=b.useMemo(()=>{const W=et({width:t,depth:e,height:n});return tt(W,o,n,Math.max(t,e))},[e,n,o,t]),k=b.useMemo(()=>{if(!C)return null;const W=new pt({color:new be(S),opacity:M,transparent:!0,depthTest:!0,depthWrite:!1,toneMapped:!1});return Gt(t/2,e/2,n/2,-n/2,W)},[e,S,M,n,C,t]),$=b.useMemo(()=>new Qe(t,e,1,1),[e,t]),Ne=b.useMemo(()=>n/2+Math.max(p*1.5+.048,.02),[n,p]),ve=!!N,re=b.useMemo(()=>ve?at({depth:e,groupRef:L,height:n,interactionRuntime:d,waveChoppiness:m,waveChoppinessRef:g,waveHeight:p,waveHeightRef:y,waveSpeed:v,waveSpeedRef:x,width:t}):null,[e,n,d,ve,m,g,p,y,v,x,t]),xe=b.useCallback(()=>{d?.clearPointerTarget()},[d]),ye=b.useCallback(W=>{if(!L.current||!d)return;W.stopPropagation();const z=L.current.worldToLocal(fe.current.copy(W.point));d.setPointerTarget(K.clamp(z.x,-t/2,t/2),K.clamp(z.z,-e/2,e/2))},[e,d,t]);return b.useEffect(()=>{const W=L.current;if(W)return re?(W.userData.lightningSurfaceType="water",W.userData.lightningTargetAdapter=re):(delete W.userData.lightningSurfaceType,delete W.userData.lightningTargetAdapter),()=>{delete W.userData.lightningSurfaceType,delete W.userData.lightningTargetAdapter}},[re]),Je((W,z)=>{ce.current+=z;const I=ce.current,B=y?.current??p,R=x?.current??v,O=g?.current??m,U=d?.interactionStateRef.current,Q=d?.configRef.current.enabled;if(Ke(I),d?.advance(z),f.time.value=I,f.waveHeight.value=B,f.waveSpeed.value=R,f.waveChop.value=O,f.colTop.value=n/2,f.colBot.value=-n/2,f.topColor.value.set(r),f.botColor.value.set(s),f.interactionBounds.value.set(t,e),f.interactionEnabled.value=Q?1:0,j.value=U?.texture??q,f.interactionResolution.value=U?.size??1,!C||!k)return;k.edgeMat.color.set(S),k.edgeMat.opacity=M;const w=n/2;k.corners.forEach(({geo:A,cx:E,cz:T})=>{const P=ge(E,T,B,O,R),H=Q?J(E,T,t,e,U):0,h=A.attributes.position,F=h.array;F[4]=w+P+H,h.needsUpdate=!0}),k.topEdges.forEach(({geo:A,a:E,b:T})=>{const P=A.attributes.position,H=P.array,h=Ee+1;for(let F=0;F<h;F+=1){const Y=F/Ee,V=E.x+(T.x-E.x)*Y,ee=E.z+(T.z-E.z)*Y,st=ge(V,ee,B,O,R),ct=Q?J(V,ee,t,e,U):0;H[F*3+1]=w+st+ct}P.needsUpdate=!0})}),G.jsxs("group",{ref:L,children:[ie.map((W,z)=>G.jsx("mesh",{geometry:W,material:le},z)),(d||ve)&&G.jsx(rt,{geometry:$,hitRef:Z,interactionHitY:Ne,onPointerMove:d?ye:void 0,onPointerOut:d?xe:void 0,onPointerOver:d?ye:void 0}),C&&k&&G.jsx("primitive",{object:k.group})]})}function Ot(t){return vt(n=>n.gl)?.isWebGPURenderer===!0?G.jsx(Lt,{...t}):G.jsx(_t,{...t})}export{He as N,ue as P,yt as a,Ot as b,ge as s,Vt as u};
