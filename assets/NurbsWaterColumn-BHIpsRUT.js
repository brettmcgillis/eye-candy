import{$ as ze,V as D,aW as We,aa as oe,r as b,aE as he,aF as Ce,K as De,J as we,a1 as me,ap as pe,f as K,j as k,C as be,m as Ze,h as lt,F as $e,S as Qe,a as Je,e as it,aq as ut,bh as mt,cL as pt,G as ft,aX as Ae,a0 as _e,D as Ge,d as vt}from"./index-CpBEyLIG.js";import{b as xt,d as Pe,a as dt}from"./Line2-BFOzO1gr.js";import{u as X,F as te,f as _,k as re,aG as ne,E as de,aN as Be,j as Me,au as ke,a7 as je,W as Ie,c as Le,d as Ye,am as qe,m as Re}from"./three.tsl-B44k1AWC.js";class ue extends ze{constructor(e=(a,s,r)=>r.set(a,s,Math.cos(a)*Math.sin(s)),n=8,o=8){super(),this.type="ParametricGeometry",this.parameters={func:e,slices:n,stacks:o};const a=[],s=[],r=[],i=[],c=1e-5,l=new D,u=new D,p=new D,m=new D,v=new D,y=n+1;for(let g=0;g<=o;g++){const x=g/o;for(let M=0;M<=n;M++){const S=M/n;e(S,x,u),s.push(u.x,u.y,u.z),S-c>=0?(e(S-c,x,p),m.subVectors(u,p)):(e(S+c,x,p),m.subVectors(p,u)),x-c>=0?(e(S,x-c,p),v.subVectors(u,p)):(e(S,x+c,p),v.subVectors(p,u)),l.crossVectors(m,v).normalize(),r.push(l.x,l.y,l.z),i.push(S,x)}}for(let g=0;g<o;g++)for(let x=0;x<n;x++){const M=g*y+x,S=g*y+x+1,C=(g+1)*y+x+1,d=(g+1)*y+x;a.push(M,S,d),a.push(S,C,d)}this.setIndex(a),this.setAttribute("position",new We(s,3)),this.setAttribute("normal",new We(r,3)),this.setAttribute("uv",new We(i,2))}}function Ve(t,e,n){const o=n.length-t-1;if(e>=n[o])return o-1;if(e<=n[t])return t;let a=t,s=o,r=Math.floor((a+s)/2);for(;e<n[r]||e>=n[r+1];)e<n[r]?s=r:a=r,r=Math.floor((a+s)/2);return r}function Oe(t,e,n,o){const a=[],s=[],r=[];a[0]=1;for(let i=1;i<=n;++i){s[i]=e-o[t+1-i],r[i]=o[t+i]-e;let c=0;for(let l=0;l<i;++l){const u=r[l+1],p=s[i-l],m=a[l]/(u+p);a[l]=c+u*m,c=p*m}a[i]=c}return a}function bt(t,e,n,o,a,s,r,i){const c=Ve(t,s,n),l=Ve(e,r,o),u=Oe(c,s,t,n),p=Oe(l,r,e,o),m=[];for(let y=0;y<=e;++y){m[y]=new oe(0,0,0,0);for(let g=0;g<=t;++g){const x=a[c-t+g][l-e+y].clone(),M=x.w;x.x*=M,x.y*=M,x.z*=M,m[y].add(x.multiplyScalar(u[g]))}}const v=new oe(0,0,0,0);for(let y=0;y<=e;++y)v.add(m[y].multiplyScalar(p[y]));v.divideScalar(v.w),i.set(v.x,v.y,v.z)}class Fe{constructor(e,n,o,a,s){this.degree1=e,this.degree2=n,this.knots1=o,this.knots2=a,this.controlPoints=[];const r=o.length-e-1,i=a.length-n-1;for(let c=0;c<r;++c){this.controlPoints[c]=[];for(let l=0;l<i;++l){const u=s[c][l];this.controlPoints[c][l]=new oe(u.x,u.y,u.z,u.w)}}}getPoint(e,n,o){const a=this.knots1[0]+e*(this.knots1[this.knots1.length-1]-this.knots1[0]),s=this.knots2[0]+n*(this.knots2[this.knots2.length-1]-this.knots2[0]);bt(this.degree1,this.degree2,this.knots1,this.knots2,this.controlPoints,a,s,o)}}const gt=[{dx:.6,dz:.8,freq:1.2,amp:1},{dx:-.4,dz:.9,freq:2.5,amp:.4},{dx:.9,dz:-.3,freq:3.8,amp:.2},{dx:-.7,dz:-.6,freq:5,amp:.1}],se=gt.map(t=>{const e=Math.sqrt(t.dx*t.dx+t.dz*t.dz);return{dx:t.dx/e,dz:t.dz/e,freq:t.freq,amp:t.amp}});let He=0;function Ke(t){He=t}function ge(t,e,n,o,a){let s=0;for(let r=0;r<se.length;r+=1){const{dx:i,dz:c,freq:l,amp:u}=se[r],p=u*n,m=a*l,v=(i*t+c*e)*l+He*m;s+=p*Math.cos(v)}return s}function yt(t,e,n,o,a){let s=0,r=1,i=0;for(let l=0;l<se.length;l+=1){const{dx:u,dz:p,freq:m,amp:v}=se[l],y=v*n,g=o/(m*y*se.length),x=a*m,M=(u*t+p*e)*m+He*x,S=Math.sin(M),C=Math.cos(M),d=m*y;s-=u*d*S,i-=p*d*S,r-=g*d*C}const c=Math.sqrt(s*s+r*r+i*i);return{x:s/c,y:r/c,z:i/c}}function Mt(t,e,n){const o=[0,0,0,0,1,1,1,1],a=[t,t/3,-t/3,-t],s=[-e,-e/3,e/3,e],r=a.map(i=>s.map(c=>new oe(i,n,c,1)));return new Fe(3,3,o,o,r)}function St(t,e,n){const o=[0,0,0,0,1,1,1,1],a=[-t,-t/3,t/3,t],s=[-e,-e/3,e/3,e],r=a.map(i=>s.map(c=>new oe(i,n,c,1)));return new Fe(3,3,o,o,r)}function Se(t,e,n,o){const a=[0,0,0,0,1,1,1,1],s=[0,0,0,1,1,1],r=(n+o)/2,i=t.map(c=>{const l=e(c,n),u=e(c,o);return[new oe(l.x,l.y,l.z,1),new oe((l.x+u.x)/2,r,(l.z+u.z)/2,1),new oe(u.x,u.y,u.z,1)]});return new Fe(3,2,a,s,i)}function et({width:t,depth:e,height:n}){const o=t/2,a=e/2,s=n/2,r=-n/2;return{top:Mt(o,a,s),bottom:St(o,a,r),front:Se([-o,-o/3,o/3,o],(i,c)=>({x:i,y:c,z:a}),r,s),back:Se([o,o/3,-o/3,-o],(i,c)=>({x:i,y:c,z:-a}),r,s),right:Se([a,a/3,-a/3,-a],(i,c)=>({x:o,y:c,z:i}),r,s),left:Se([-a,-a/3,a/3,a],(i,c)=>({x:-o,y:c,z:i}),r,s)}}function tt(t,e,n,o){const a=Math.max(8,Math.round(e*(n/o))),s=Math.max(4,Math.round(e/4)),r=i=>(c,l,u)=>i.getPoint(c,l,u);return[new ue(r(t.top),e,e),new ue(r(t.bottom),s,s),new ue(r(t.front),e,a),new ue(r(t.back),e,a),new ue(r(t.right),e,a),new ue(r(t.left),e,a)]}const zt=1/30;function Tt(t){const e=new Float32Array(t*t*4);for(let o=0;o<t*t;o+=1)e[o*4+3]=1;const n=new he(e,t,t,Ce,De);return n.colorSpace=we,n.generateMipmaps=!1,n.magFilter=me,n.minFilter=me,n.needsUpdate=!0,n.wrapS=pe,n.wrapT=pe,{current:new Float32Array(t*t),previous:new Float32Array(t*t),next:new Float32Array(t*t),size:t,texture:n,textureData:e}}function Et(t){const e=t;e.current.fill(0),e.previous.fill(0),e.next.fill(0);for(let n=0;n<e.size*e.size;n+=1){const o=n*4;e.textureData[o]=0,e.textureData[o+1]=0,e.textureData[o+2]=0,e.textureData[o+3]=1}e.texture.needsUpdate=!0}function Nt(t,e,n,o){return{u:t/Math.max(n,1e-4)+.5,v:.5-e/Math.max(o,1e-4)}}function J(t,e,n,o,a){if(!a)return 0;const{current:s,size:r}=a,{u:i,v:c}=Nt(t,e,n,o);if(i<0||i>1||c<0||c>1)return 0;const l=i*(r-1),u=c*(r-1),p=Math.floor(l),m=Math.floor(u),v=Math.min(p+1,r-1),y=Math.min(m+1,r-1),g=l-p,x=u-m,M=s[m*r+p],S=s[m*r+v],C=s[y*r+p],d=s[y*r+v],N=K.lerp(M,S,g),L=K.lerp(C,d,g);return K.lerp(N,L,x)}function Wt(t,e,n,o,a,s=new D){if(!a)return s.set(0,1,0);const r=Math.max(a.size,1),i=Math.max(n/r,1e-4),c=Math.max(o/r,1e-4),l=J(t-i,e,n,o,a),u=J(t+i,e,n,o,a),p=J(t,e-c,n,o,a),m=J(t,e+c,n,o,a);return s.set((l-u)/(i*2),1,(p-m)/(c*2)).normalize()}function At(t,e,n=new D){const o=Math.max(Math.abs(t.y),1e-4),a=Math.max(Math.abs(e.y),1e-4),s=-t.x/o,r=-t.z/o,i=-e.x/a,c=-e.z/a;return n.set(-(s+i),1,-(r+c)).normalize()}function nt({x:t,z:e,width:n,depth:o,waveHeight:a,waveChoppiness:s,waveSpeed:r,interactionState:i=null}){return ge(t,e,a,s,r)+J(t,e,n,o,i)}function ot({x:t,z:e,width:n,depth:o,waveHeight:a,waveChoppiness:s,waveSpeed:r,interactionState:i=null,target:c=new D}){const l=yt(t,e,a,s,r);if(!i)return c.set(l.x,l.y,l.z).normalize();const u=Wt(t,e,n,o,i);return At(new D(l.x,l.y,l.z),u,c)}function Pt(t,e,n){const{current:o,next:a,previous:s,size:r,texture:i,textureData:c}=t,l=Math.max(e.width,1e-4),u=Math.max(e.depth,1e-4);for(let m=0;m<r;m+=1){const y=(.5-m/(r-1))*u,g=Math.max(m-1,0)*r,x=m*r,M=Math.min(m+1,r-1)*r;for(let S=0;S<r;S+=1){const d=(S/(r-1)-.5)*l,N=x+Math.max(S-1,0),L=x+Math.min(S+1,r-1),Z=x+S,fe=o[g+S],ce=o[M+S],q=o[L],j=o[N];let f=((fe+ce+q+j)*.5-s[Z])*e.viscosity;if(e.enabled&&n.active){const le=d-n.x,ie=y-n.z,G=Math.min(Math.PI,Math.sqrt(le*le+ie*ie)*Math.PI/Math.max(e.radius,1e-4));f-=(Math.cos(G)+1)*e.rippleDepth}a[Z]=f}}const p=t;p.previous=o,p.current=a,p.next=s;for(let m=0;m<r*r;m+=1){const v=m*4;c[v]=p.current[m],c[v+1]=p.previous[m],c[v+2]=0,c[v+3]=1}return i.needsUpdate=!0,p}function Vt({depth:t,enabled:e=!1,radius:n=.28,resolution:o=96,rippleDepth:a=.012,viscosity:s=.92,width:r}){const i=b.useRef({active:!1,x:0,z:0}),c=b.useMemo(()=>Tt(o),[o]),l=b.useRef(c),u=b.useRef({depth:t,enabled:e,radius:n,rippleDepth:a,viscosity:s,width:r});l.current=c,u.current={depth:t,enabled:e,radius:n,rippleDepth:a,viscosity:s,width:r};const p=b.useCallback((M,S)=>{i.current.active=!0,i.current.x=M,i.current.z=S},[]),m=b.useCallback(()=>{i.current.active=!1},[]),v=b.useCallback(()=>{m(),Et(l.current)},[m]),y=b.useCallback(M=>{Math.min(Math.max(M,0),zt)<=0||!u.current.enabled||Pt(l.current,u.current,i.current)},[]),g=b.useCallback((M,S,C,d,N)=>nt({x:M,z:S,width:u.current.width,depth:u.current.depth,waveHeight:C,waveChoppiness:d,waveSpeed:N,interactionState:l.current}),[]),x=b.useCallback((M,S,C,d,N,L)=>ot({x:M,z:S,width:u.current.width,depth:u.current.depth,waveHeight:C,waveChoppiness:d,waveSpeed:N,interactionState:l.current,target:L}),[]);return b.useEffect(()=>{e||v()},[e,v]),b.useEffect(()=>()=>c.texture.dispose(),[c]),b.useMemo(()=>({advance:y,clearPointerTarget:m,configRef:u,interactionStateRef:l,pointerTargetRef:i,reset:v,sampleHeight:g,sampleNormal:x,setPointerTarget:p}),[y,m,v,g,x,p])}function at({geometry:t,hitRef:e,interactionHitY:n,onPointerMove:o,onPointerOut:a,onPointerOver:s}){return k.jsx("mesh",{ref:e,geometry:t,onPointerMove:o,onPointerOut:a,onPointerOver:s,position:[0,n,0],"rotation-x":-Math.PI/2,userData:{lightningIgnore:!0},children:k.jsx("meshBasicMaterial",{depthWrite:!1,opacity:0,transparent:!0})})}function Ue({waveChoppiness:t,waveChoppinessRef:e,waveHeight:n,waveHeightRef:o,waveSpeed:a,waveSpeedRef:s}){return{waveChoppiness:e?.current??t,waveHeight:o?.current??n,waveSpeed:s?.current??a}}function rt({depth:t,groupRef:e,height:n,interactionRuntime:o=null,waveChoppiness:a,waveChoppinessRef:s=null,waveHeight:r,waveHeightRef:i=null,waveSpeed:c,waveSpeedRef:l=null,width:u}){const p=new D,m=new D;return({intersection:v})=>{const y=e.current;if(!y)return null;const g=y.worldToLocal(v.point.clone()),x=K.clamp(g.x,-u/2,u/2),M=K.clamp(g.z,-t/2,t/2),S=()=>{const d=Ue({waveChoppiness:a,waveChoppinessRef:s,waveHeight:r,waveHeightRef:i,waveSpeed:c,waveSpeedRef:l});return o?.sampleHeight?o.sampleHeight(x,M,d.waveHeight,d.waveChoppiness,d.waveSpeed):nt({depth:t,interactionState:o?.interactionStateRef.current??null,waveChoppiness:d.waveChoppiness,waveHeight:d.waveHeight,waveSpeed:d.waveSpeed,width:u,x,z:M})},C=()=>{const d=Ue({waveChoppiness:a,waveChoppinessRef:s,waveHeight:r,waveHeightRef:i,waveSpeed:c,waveSpeedRef:l});return o?.sampleNormal?o.sampleNormal(x,M,d.waveHeight,d.waveChoppiness,d.waveSpeed,p):ot({depth:t,interactionState:o?.interactionStateRef.current??null,target:p,waveChoppiness:d.waveChoppiness,waveHeight:d.waveHeight,waveSpeed:d.waveSpeed,width:u,x,z:M})};return{follow:!0,normalResolver:()=>m.copy(C()).transformDirection(y.matrixWorld),surfaceType:"water",targetResolver:()=>{const d=new D(x,n/2+S(),M);return y.localToWorld(d)}}}}it({Line2:dt});const Bt=`
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
`,Te=32;function Ft(t,e,n,o){const a=new Pe;a.setPositions([-t,o,-e,t,o,-e,t,o,e,-t,o,e,-t,o,-e]);const r=[[-t,-e],[t,-e],[t,e],[-t,e]].map(([l,u])=>{const p=new Pe;return p.setPositions([l,o,u,l,n,u]),{geo:p,cx:l,cz:u}}),c=[{x0:-t,z0:-e,x1:t,z1:-e},{x0:t,z0:-e,x1:t,z1:e},{x0:t,z0:e,x1:-t,z1:e},{x0:-t,z0:e,x1:-t,z1:-e}].map(l=>{const u=[];for(let m=0;m<=Te;m+=1){const v=m/Te;u.push(l.x0+(l.x1-l.x0)*v,n,l.z0+(l.z1-l.z0)*v)}const p=new Pe;return p.setPositions(u),{geo:p,edge:l}});return{bottomGeo:a,vertGeos:r,topGeos:c}}function Ht(){const t=new Float32Array([0,0,0,1]),e=new he(t,1,1,Ce,De);return e.colorSpace=we,e.generateMipmaps=!1,e.magFilter=me,e.minFilter=me,e.needsUpdate=!0,e.wrapS=pe,e.wrapT=pe,e}function _t({width:t=3.6,depth:e=3.6,height:n=6,segments:o=24,topColor:a="#9edff0",bottomColor:s="#246f98",opacity:r=.34,transmission:i=.5,roughness:c=.3,ior:l=1.12,thickness:u=.35,waveHeight:p=.15,waveChoppiness:m=.5,waveSpeed:v=.6,waveHeightRef:y=null,waveChoppinessRef:g=null,waveSpeedRef:x=null,edgeColor:M="#1f4455",edgeOpacity:S=.65,edgeLineWidth:C=1,showEdges:d=!0,interactionRuntime:N=null,lightningTarget:L=!1}){const Z=b.useRef(),fe=b.useRef(),ce=b.useRef(new D),q=b.useRef(0),j=b.useMemo(()=>Ht(),[]),f=b.useMemo(()=>({uTime:{value:q.current},uWaveHeight:{value:p},uWaveChoppiness:{value:m},uWaveSpeed:{value:v},uColumnTop:{value:n/2},uColumnBottom:{value:-n/2},uInteractionBounds:{value:new Ze(t,e)},uInteractionEnabled:{value:0},uInteractionHeightmap:{value:j},uInteractionResolution:{value:1},uTopColor:{value:new be(a)},uBottomColor:{value:new be(s)}}),[j,a,s,e,n,t]),le=b.useMemo(()=>{const z=et({width:t,depth:e,height:n});return tt(z,o,n,Math.max(t,e))},[t,e,n,o]),ie=b.useMemo(()=>{const z=new lt({transparent:!0,opacity:r,transmission:i,roughness:c,metalness:0,ior:l,thickness:u,side:$e,depthWrite:!0});return z.onBeforeCompile=I=>{const B=I;Object.entries(f).forEach(([R,O])=>{B.uniforms[R]=O}),B.vertexShader=B.vertexShader.replace("#include <common>",It),B.vertexShader=B.vertexShader.replace("#include <beginnormal_vertex>",ht),B.vertexShader=B.vertexShader.replace("#include <begin_vertex>",Ct),B.fragmentShader=B.fragmentShader.replace("#include <common>",`#include <common>
${Dt}`),B.fragmentShader=B.fragmentShader.replace("#include <color_fragment>",wt)},z},[f,r,i,c,l,u]),G=b.useMemo(()=>{if(!d)return null;const z=t/2,I=e/2;return Ft(z,I,n/2,-n/2)},[d,t,n,e]),$=b.useMemo(()=>new xt({transparent:!0,depthTest:!0,depthWrite:!1,toneMapped:!1}),[]),Ne=b.useMemo(()=>new Qe(t,e,1,1),[e,t]),ve=b.useMemo(()=>n/2+Math.max(p*1.5+.048,.02),[n,p]),ae=!!L,xe=b.useMemo(()=>ae?rt({depth:e,groupRef:Z,height:n,interactionRuntime:N,waveChoppiness:m,waveChoppinessRef:g,waveHeight:p,waveHeightRef:y,waveSpeed:v,waveSpeedRef:x,width:t}):null,[e,n,N,ae,m,g,p,y,v,x,t]),ye=b.useCallback(()=>{N?.clearPointerTarget()},[N]),A=b.useCallback(z=>{if(!Z.current||!N)return;z.stopPropagation();const I=Z.current.worldToLocal(ce.current.copy(z.point));N.setPointerTarget(K.clamp(I.x,-t/2,t/2),K.clamp(I.z,-e/2,e/2))},[e,N,t]);return b.useEffect(()=>()=>j.dispose(),[j]),b.useEffect(()=>{const z=Z.current;if(z)return xe?(z.userData.lightningSurfaceType="water",z.userData.lightningTargetAdapter=xe):(delete z.userData.lightningSurfaceType,delete z.userData.lightningTargetAdapter),()=>{delete z.userData.lightningSurfaceType,delete z.userData.lightningTargetAdapter}},[xe]),Je((z,I)=>{q.current+=I;const B=y?.current??p,R=x?.current??v,O=g?.current??m,U=N?.interactionStateRef.current,Q=N?.configRef.current.enabled;if(f.uTime.value=q.current,f.uWaveHeight.value=B,f.uWaveChoppiness.value=O,f.uWaveSpeed.value=R,Ke(q.current),N?.advance(I),f.uInteractionBounds.value.set(t,e),f.uInteractionEnabled.value=Q?1:0,f.uInteractionHeightmap.value=U?.texture??j,f.uInteractionResolution.value=U?.size??1,d&&$&&($.color.set(M),$.opacity=S,$.linewidth=C,$.resolution.set(z.size.width,z.size.height)),G){const w=n/2,W=-n/2;G.topGeos.forEach(({geo:E,edge:T})=>{const P=[];for(let F=0;F<=Te;F+=1){const h=F/Te,H=T.x0+(T.x1-T.x0)*h,Y=T.z0+(T.z1-T.z0)*h,V=ge(H,Y,B,O,R),ee=Q?J(H,Y,t,e,U):0;P.push(H,w+V+ee,Y)}E.setPositions(P)}),G.vertGeos.forEach(({geo:E,cx:T,cz:P})=>{const F=ge(T,P,B,O,R),h=Q?J(T,P,t,e,U):0;E.setPositions([T,W,P,T,w+F+h,P])})}}),k.jsxs("group",{ref:Z,children:[le.map((z,I)=>k.jsx("mesh",{geometry:z,material:ie},I)),(N||ae)&&k.jsx(at,{geometry:Ne,hitRef:fe,interactionHitY:ve,onPointerMove:N?A:void 0,onPointerOut:N?ye:void 0,onPointerOver:N?A:void 0}),d&&G&&k.jsxs(k.Fragment,{children:[k.jsx("line2",{geometry:G.bottomGeo,material:$}),G.vertGeos.map(({geo:z},I)=>k.jsx("line2",{geometry:z,material:$},`v${I}`)),G.topGeos.map(({geo:z},I)=>k.jsx("line2",{geometry:z,material:$},`t${I}`))]})]})}const Ee=32,Xe=[[-1,-1],[1,-1],[1,1],[-1,1]],Gt=[[0,1],[1,2],[2,3],[3,0]];function kt(t,e,n,o,a){const s=new ft,r=[new D(-t,o,-e),new D(t,o,-e),new D(t,o,e),new D(-t,o,e),new D(-t,o,-e)];s.add(new Ae(new ze().setFromPoints(r),a));const i=Xe.map(([u,p])=>{const m=u*t,v=p*e,y=new Float32Array([m,o,v,m,n,v]),g=new ze;return g.setAttribute("position",new _e(y,3)),g.attributes.position.usage=Ge,s.add(new Ae(g,a)),{geo:g,cx:m,cz:v}}),c=Xe.map(([u,p])=>({x:u*t,z:p*e})),l=Gt.map(([u,p])=>{const m=c[u],v=c[p],y=Ee+1,g=new Float32Array(y*3);for(let M=0;M<y;M+=1){const S=M/Ee;g[M*3]=m.x+(v.x-m.x)*S,g[M*3+1]=n,g[M*3+2]=m.z+(v.z-m.z)*S}const x=new ze;return x.setAttribute("position",new _e(g,3)),x.attributes.position.usage=Ge,s.add(new Ae(x,a)),{geo:x,a:m,b:v}});return{corners:i,edgeMat:a,group:s,topEdges:l}}function jt(){const t=new Float32Array([0,0,0,1]),e=new he(t,1,1,Ce,De);return e.colorSpace=we,e.generateMipmaps=!1,e.magFilter=me,e.minFilter=me,e.needsUpdate=!0,e.wrapS=pe,e.wrapT=pe,e}function Lt({width:t=3.6,depth:e=3.6,height:n=6,segments:o=24,topColor:a="#9edff0",bottomColor:s="#246f98",opacity:r=.34,transmission:i=.5,roughness:c=.3,ior:l=1.12,thickness:u=.35,waveHeight:p=.15,waveChoppiness:m=.5,waveSpeed:v=.6,waveHeightRef:y=null,waveChoppinessRef:g=null,waveSpeedRef:x=null,edgeColor:M="#1f4455",edgeOpacity:S=.65,showEdges:C=!0,interactionRuntime:d=null,lightningTarget:N=!1}){const L=b.useRef(),Z=b.useRef(),fe=b.useRef(new D),ce=b.useRef(0),q=b.useMemo(()=>jt(),[]),j=b.useMemo(()=>new ut(q),[q]),f=b.useMemo(()=>({botColor:X(new be(s)),colBot:X(-n/2),colTop:X(n/2),interactionBounds:X(new Ze(t,e)),interactionEnabled:X(0),interactionResolution:X(1),time:X(0),topColor:X(new be(a)),waveChop:X(m),waveHeight:X(p),waveSpeed:X(v)}),[s,e,n,a,m,p,v,t]);b.useEffect(()=>()=>q.dispose(),[q]);const le=b.useMemo(()=>{const A=te(()=>{const W=f.interactionBounds.x.max(_(1e-4)),E=f.interactionBounds.y.max(_(1e-4));return re(ne.x.div(W).add(.5),_(.5).sub(ne.z.div(E)))}),z=te(()=>de(j,A()).x.mul(f.interactionEnabled)),I=te(()=>{const W=A(),E=f.interactionResolution.max(_(1)),T=_(1).div(E),P=f.interactionBounds.x.div(E).max(_(1e-4)),F=f.interactionBounds.y.div(E).max(_(1e-4)),h=de(j,W.add(re(T.negate(),0))).x.mul(f.interactionEnabled),H=de(j,W.add(re(T,0))).x.mul(f.interactionEnabled),Y=de(j,W.add(re(0,T.negate()))).x.mul(f.interactionEnabled),V=de(j,W.add(re(0,T))).x.mul(f.interactionEnabled);return Be(Me(h.sub(H).div(P.mul(2)),1,Y.sub(V).div(F.mul(2))))}),B=te(()=>{const W=_(0).toVar();return se.forEach(({dx:E,dz:T,freq:P,amp:F})=>{const h=ke(re(E,T),ne.xz).mul(P).add(f.time.mul(f.waveSpeed).mul(P));W.addAssign(_(F).mul(f.waveHeight).mul(je(h)))}),W}),R=te(()=>{const W=Ie(ne.y.sub(f.colBot).div(f.colTop.sub(f.colBot)),0,1),E=Le(.5,1,W);return B().add(z()).mul(E)}),O=te(()=>{const W=_(0).toVar(),E=_(1).toVar(),T=_(0).toVar();return se.forEach(({dx:P,dz:F,freq:h,amp:H})=>{const Y=f.waveChop.div(h*H*4),V=_(h*H).mul(f.waveHeight),ee=ke(re(P,F),ne.xz).mul(h).add(f.time.mul(f.waveSpeed).mul(h));W.subAssign(_(P).mul(V).mul(Ye(ee))),T.subAssign(_(F).mul(V).mul(Ye(ee))),E.subAssign(Y.mul(V).mul(je(ee)))}),Be(Me(W,E,T))}),U=te(()=>{const W=Ie(ne.y.sub(f.colBot).div(f.colTop.sub(f.colBot)),0,1),E=qe.y.greaterThan(.5).select(Le(.8,1,W),_(0)),T=O(),P=I(),F=T.y.abs().max(_(1e-4)),h=P.y.abs().max(_(1e-4)),H=T.xz.negate().div(F),Y=P.xz.negate().div(h),V=Be(Me(H.x.add(Y.x).negate(),1,H.y.add(Y.y).negate()));return Re(qe,V,E)}),Q=te(()=>{const W=ne.y.add(R()),E=Ie(W.sub(f.colBot).div(f.colTop.sub(f.colBot)),0,1);return Re(f.botColor,f.topColor,E)}),w=new mt({transparent:!0,side:$e,depthWrite:!0});return w.color.set(a),w.attenuationColor.set(s),w.opacity=r,w.transmission=i*0,w.roughness=c,w.metalness=0,w.ior=l,w.thickness=u,w.positionNode=ne.add(Me(0,R(),0)),w.normalNode=U(),w.colorNode=Q(),w},[s,l,j,r,c,u,i,a,f]),ie=b.useMemo(()=>{const A=et({width:t,depth:e,height:n});return tt(A,o,n,Math.max(t,e))},[e,n,o,t]),G=b.useMemo(()=>{if(!C)return null;const A=new pt({color:new be(M),opacity:S,transparent:!0,depthTest:!0,depthWrite:!1,toneMapped:!1});return kt(t/2,e/2,n/2,-n/2,A)},[e,M,S,n,C,t]),$=b.useMemo(()=>new Qe(t,e,1,1),[e,t]),Ne=b.useMemo(()=>n/2+Math.max(p*1.5+.048,.02),[n,p]),ve=!!N,ae=b.useMemo(()=>ve?rt({depth:e,groupRef:L,height:n,interactionRuntime:d,waveChoppiness:m,waveChoppinessRef:g,waveHeight:p,waveHeightRef:y,waveSpeed:v,waveSpeedRef:x,width:t}):null,[e,n,d,ve,m,g,p,y,v,x,t]),xe=b.useCallback(()=>{d?.clearPointerTarget()},[d]),ye=b.useCallback(A=>{if(!L.current||!d)return;A.stopPropagation();const z=L.current.worldToLocal(fe.current.copy(A.point));d.setPointerTarget(K.clamp(z.x,-t/2,t/2),K.clamp(z.z,-e/2,e/2))},[e,d,t]);return b.useEffect(()=>{const A=L.current;if(A)return ae?(A.userData.lightningSurfaceType="water",A.userData.lightningTargetAdapter=ae):(delete A.userData.lightningSurfaceType,delete A.userData.lightningTargetAdapter),()=>{delete A.userData.lightningSurfaceType,delete A.userData.lightningTargetAdapter}},[ae]),Je((A,z)=>{ce.current+=z;const I=ce.current,B=y?.current??p,R=x?.current??v,O=g?.current??m,U=d?.interactionStateRef.current,Q=d?.configRef.current.enabled;if(Ke(I),d?.advance(z),f.time.value=I,f.waveHeight.value=B,f.waveSpeed.value=R,f.waveChop.value=O,f.colTop.value=n/2,f.colBot.value=-n/2,f.topColor.value.set(a),f.botColor.value.set(s),f.interactionBounds.value.set(t,e),f.interactionEnabled.value=Q?1:0,j.value=U?.texture??q,f.interactionResolution.value=U?.size??1,!C||!G)return;G.edgeMat.color.set(M),G.edgeMat.opacity=S;const w=n/2;G.corners.forEach(({geo:W,cx:E,cz:T})=>{const P=ge(E,T,B,O,R),F=Q?J(E,T,t,e,U):0,h=W.attributes.position,H=h.array;H[4]=w+P+F,h.needsUpdate=!0}),G.topEdges.forEach(({geo:W,a:E,b:T})=>{const P=W.attributes.position,F=P.array,h=Ee+1;for(let H=0;H<h;H+=1){const Y=H/Ee,V=E.x+(T.x-E.x)*Y,ee=E.z+(T.z-E.z)*Y,st=ge(V,ee,B,O,R),ct=Q?J(V,ee,t,e,U):0;F[H*3+1]=w+st+ct}P.needsUpdate=!0})}),k.jsxs("group",{ref:L,children:[ie.map((A,z)=>k.jsx("mesh",{geometry:A,material:le},z)),(d||ve)&&k.jsx(at,{geometry:$,hitRef:Z,interactionHitY:Ne,onPointerMove:d?ye:void 0,onPointerOut:d?xe:void 0,onPointerOver:d?ye:void 0}),C&&G&&k.jsx("primitive",{object:G.group})]})}function Ot(t){return vt(n=>n.gl)?.isWebGPURenderer===!0?k.jsx(Lt,{...t}):k.jsx(_t,{...t})}export{Fe as N,ue as P,yt as a,Ot as b,ge as s,Vt as u};
