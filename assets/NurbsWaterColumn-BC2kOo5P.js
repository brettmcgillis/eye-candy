import{L as ze,V as D,aT as Ae,a4 as oe,r as b,aA as he,aB as Ce,Y as De,aK as we,U as me,ao as fe,f as J,j as k,C as be,m as Ze,h as lt,F as $e,aM as Qe,a as Ke,e as it,an as ut,bf as mt,cL as ft,G as pt,aU as We,S as _e,D as Ge,d as vt}from"./index-CmsPVbmj.js";import{b as xt,d as Be,a as dt}from"./Line2-OqMkEt64.js";import{u as X,F as te,f as _,v as ae,aR as ne,t as de,aK as Pe,d as Me,aB as ke,U as Le,C as Ie,r as je,T as Ye,a8 as Re,e as qe}from"./three.tsl-VQrHxgdf.js";class ue extends ze{constructor(e=(r,s,a)=>a.set(r,s,Math.cos(r)*Math.sin(s)),n=8,o=8){super(),this.type="ParametricGeometry",this.parameters={func:e,slices:n,stacks:o};const r=[],s=[],a=[],i=[],c=1e-5,l=new D,u=new D,f=new D,m=new D,v=new D,y=n+1;for(let g=0;g<=o;g++){const x=g/o;for(let M=0;M<=n;M++){const S=M/n;e(S,x,u),s.push(u.x,u.y,u.z),S-c>=0?(e(S-c,x,f),m.subVectors(u,f)):(e(S+c,x,f),m.subVectors(f,u)),x-c>=0?(e(S,x-c,f),v.subVectors(u,f)):(e(S,x+c,f),v.subVectors(f,u)),l.crossVectors(m,v).normalize(),a.push(l.x,l.y,l.z),i.push(S,x)}}for(let g=0;g<o;g++)for(let x=0;x<n;x++){const M=g*y+x,S=g*y+x+1,C=(g+1)*y+x+1,d=(g+1)*y+x;r.push(M,S,d),r.push(S,C,d)}this.setIndex(r),this.setAttribute("position",new Ae(s,3)),this.setAttribute("normal",new Ae(a,3)),this.setAttribute("uv",new Ae(i,2))}}function Ve(t,e,n){const o=n.length-t-1;if(e>=n[o])return o-1;if(e<=n[t])return t;let r=t,s=o,a=Math.floor((r+s)/2);for(;e<n[a]||e>=n[a+1];)e<n[a]?s=a:r=a,a=Math.floor((r+s)/2);return a}function Ue(t,e,n,o){const r=[],s=[],a=[];r[0]=1;for(let i=1;i<=n;++i){s[i]=e-o[t+1-i],a[i]=o[t+i]-e;let c=0;for(let l=0;l<i;++l){const u=a[l+1],f=s[i-l],m=r[l]/(u+f);r[l]=c+u*m,c=f*m}r[i]=c}return r}function bt(t,e,n,o,r,s,a,i){const c=Ve(t,s,n),l=Ve(e,a,o),u=Ue(c,s,t,n),f=Ue(l,a,e,o),m=[];for(let y=0;y<=e;++y){m[y]=new oe(0,0,0,0);for(let g=0;g<=t;++g){const x=r[c-t+g][l-e+y].clone(),M=x.w;x.x*=M,x.y*=M,x.z*=M,m[y].add(x.multiplyScalar(u[g]))}}const v=new oe(0,0,0,0);for(let y=0;y<=e;++y)v.add(m[y].multiplyScalar(f[y]));v.divideScalar(v.w),i.set(v.x,v.y,v.z)}class He{constructor(e,n,o,r,s){this.degree1=e,this.degree2=n,this.knots1=o,this.knots2=r,this.controlPoints=[];const a=o.length-e-1,i=r.length-n-1;for(let c=0;c<a;++c){this.controlPoints[c]=[];for(let l=0;l<i;++l){const u=s[c][l];this.controlPoints[c][l]=new oe(u.x,u.y,u.z,u.w)}}}getPoint(e,n,o){const r=this.knots1[0]+e*(this.knots1[this.knots1.length-1]-this.knots1[0]),s=this.knots2[0]+n*(this.knots2[this.knots2.length-1]-this.knots2[0]);bt(this.degree1,this.degree2,this.knots1,this.knots2,this.controlPoints,r,s,o)}}const gt=[{dx:.6,dz:.8,freq:1.2,amp:1},{dx:-.4,dz:.9,freq:2.5,amp:.4},{dx:.9,dz:-.3,freq:3.8,amp:.2},{dx:-.7,dz:-.6,freq:5,amp:.1}],se=gt.map(t=>{const e=Math.sqrt(t.dx*t.dx+t.dz*t.dz);return{dx:t.dx/e,dz:t.dz/e,freq:t.freq,amp:t.amp}});let Fe=0;function Je(t){Fe=t}function ge(t,e,n,o,r){let s=0;for(let a=0;a<se.length;a+=1){const{dx:i,dz:c,freq:l,amp:u}=se[a],f=u*n,m=r*l,v=(i*t+c*e)*l+Fe*m;s+=f*Math.cos(v)}return s}function yt(t,e,n,o,r){let s=0,a=1,i=0;for(let l=0;l<se.length;l+=1){const{dx:u,dz:f,freq:m,amp:v}=se[l],y=v*n,g=o/(m*y*se.length),x=r*m,M=(u*t+f*e)*m+Fe*x,S=Math.sin(M),C=Math.cos(M),d=m*y;s-=u*d*S,i-=f*d*S,a-=g*d*C}const c=Math.sqrt(s*s+a*a+i*i);return{x:s/c,y:a/c,z:i/c}}function Mt(t,e,n){const o=[0,0,0,0,1,1,1,1],r=[t,t/3,-t/3,-t],s=[-e,-e/3,e/3,e],a=r.map(i=>s.map(c=>new oe(i,n,c,1)));return new He(3,3,o,o,a)}function St(t,e,n){const o=[0,0,0,0,1,1,1,1],r=[-t,-t/3,t/3,t],s=[-e,-e/3,e/3,e],a=r.map(i=>s.map(c=>new oe(i,n,c,1)));return new He(3,3,o,o,a)}function Se(t,e,n,o){const r=[0,0,0,0,1,1,1,1],s=[0,0,0,1,1,1],a=(n+o)/2,i=t.map(c=>{const l=e(c,n),u=e(c,o);return[new oe(l.x,l.y,l.z,1),new oe((l.x+u.x)/2,a,(l.z+u.z)/2,1),new oe(u.x,u.y,u.z,1)]});return new He(3,2,r,s,i)}function et({width:t,depth:e,height:n}){const o=t/2,r=e/2,s=n/2,a=-n/2;return{top:Mt(o,r,s),bottom:St(o,r,a),front:Se([-o,-o/3,o/3,o],(i,c)=>({x:i,y:c,z:r}),a,s),back:Se([o,o/3,-o/3,-o],(i,c)=>({x:i,y:c,z:-r}),a,s),right:Se([r,r/3,-r/3,-r],(i,c)=>({x:o,y:c,z:i}),a,s),left:Se([-r,-r/3,r/3,r],(i,c)=>({x:-o,y:c,z:i}),a,s)}}function tt(t,e,n,o){const r=Math.max(8,Math.round(e*(n/o))),s=Math.max(4,Math.round(e/4)),a=i=>(c,l,u)=>i.getPoint(c,l,u);return[new ue(a(t.top),e,e),new ue(a(t.bottom),s,s),new ue(a(t.front),e,r),new ue(a(t.back),e,r),new ue(a(t.right),e,r),new ue(a(t.left),e,r)]}const zt=1/30;function Tt(t){const e=new Float32Array(t*t*4);for(let o=0;o<t*t;o+=1)e[o*4+3]=1;const n=new he(e,t,t,Ce,De);return n.colorSpace=we,n.generateMipmaps=!1,n.magFilter=me,n.minFilter=me,n.needsUpdate=!0,n.wrapS=fe,n.wrapT=fe,{current:new Float32Array(t*t),previous:new Float32Array(t*t),next:new Float32Array(t*t),size:t,texture:n,textureData:e}}function Et(t){const e=t;e.current.fill(0),e.previous.fill(0),e.next.fill(0);for(let n=0;n<e.size*e.size;n+=1){const o=n*4;e.textureData[o]=0,e.textureData[o+1]=0,e.textureData[o+2]=0,e.textureData[o+3]=1}e.texture.needsUpdate=!0}function Nt(t,e,n,o){return{u:t/Math.max(n,1e-4)+.5,v:.5-e/Math.max(o,1e-4)}}function K(t,e,n,o,r){if(!r)return 0;const{current:s,size:a}=r,{u:i,v:c}=Nt(t,e,n,o);if(i<0||i>1||c<0||c>1)return 0;const l=i*(a-1),u=c*(a-1),f=Math.floor(l),m=Math.floor(u),v=Math.min(f+1,a-1),y=Math.min(m+1,a-1),g=l-f,x=u-m,M=s[m*a+f],S=s[m*a+v],C=s[y*a+f],d=s[y*a+v],N=J.lerp(M,S,g),j=J.lerp(C,d,g);return J.lerp(N,j,x)}function At(t,e,n,o,r,s=new D){if(!r)return s.set(0,1,0);const a=Math.max(r.size,1),i=Math.max(n/a,1e-4),c=Math.max(o/a,1e-4),l=K(t-i,e,n,o,r),u=K(t+i,e,n,o,r),f=K(t,e-c,n,o,r),m=K(t,e+c,n,o,r);return s.set((l-u)/(i*2),1,(f-m)/(c*2)).normalize()}function Wt(t,e,n=new D){const o=Math.max(Math.abs(t.y),1e-4),r=Math.max(Math.abs(e.y),1e-4),s=-t.x/o,a=-t.z/o,i=-e.x/r,c=-e.z/r;return n.set(-(s+i),1,-(a+c)).normalize()}function nt({x:t,z:e,width:n,depth:o,waveHeight:r,waveChoppiness:s,waveSpeed:a,interactionState:i=null}){return ge(t,e,r,s,a)+K(t,e,n,o,i)}function ot({x:t,z:e,width:n,depth:o,waveHeight:r,waveChoppiness:s,waveSpeed:a,interactionState:i=null,target:c=new D}){const l=yt(t,e,r,s,a);if(!i)return c.set(l.x,l.y,l.z).normalize();const u=At(t,e,n,o,i);return Wt(new D(l.x,l.y,l.z),u,c)}function Bt(t,e,n){const{current:o,next:r,previous:s,size:a,texture:i,textureData:c}=t,l=Math.max(e.width,1e-4),u=Math.max(e.depth,1e-4);for(let m=0;m<a;m+=1){const y=(.5-m/(a-1))*u,g=Math.max(m-1,0)*a,x=m*a,M=Math.min(m+1,a-1)*a;for(let S=0;S<a;S+=1){const d=(S/(a-1)-.5)*l,N=x+Math.max(S-1,0),j=x+Math.min(S+1,a-1),Z=x+S,pe=o[g+S],ce=o[M+S],R=o[j],L=o[N];let p=((pe+ce+R+L)*.5-s[Z])*e.viscosity;if(e.enabled&&n.active){const le=d-n.x,ie=y-n.z,G=Math.min(Math.PI,Math.sqrt(le*le+ie*ie)*Math.PI/Math.max(e.radius,1e-4));p-=(Math.cos(G)+1)*e.rippleDepth}r[Z]=p}}const f=t;f.previous=o,f.current=r,f.next=s;for(let m=0;m<a*a;m+=1){const v=m*4;c[v]=f.current[m],c[v+1]=f.previous[m],c[v+2]=0,c[v+3]=1}return i.needsUpdate=!0,f}function Vt({depth:t,enabled:e=!1,radius:n=.28,resolution:o=96,rippleDepth:r=.012,viscosity:s=.92,width:a}){const i=b.useRef({active:!1,x:0,z:0}),c=b.useMemo(()=>Tt(o),[o]),l=b.useRef(c),u=b.useRef({depth:t,enabled:e,radius:n,rippleDepth:r,viscosity:s,width:a});l.current=c,u.current={depth:t,enabled:e,radius:n,rippleDepth:r,viscosity:s,width:a};const f=b.useCallback((M,S)=>{i.current.active=!0,i.current.x=M,i.current.z=S},[]),m=b.useCallback(()=>{i.current.active=!1},[]),v=b.useCallback(()=>{m(),Et(l.current)},[m]),y=b.useCallback(M=>{Math.min(Math.max(M,0),zt)<=0||!u.current.enabled||Bt(l.current,u.current,i.current)},[]),g=b.useCallback((M,S,C,d,N)=>nt({x:M,z:S,width:u.current.width,depth:u.current.depth,waveHeight:C,waveChoppiness:d,waveSpeed:N,interactionState:l.current}),[]),x=b.useCallback((M,S,C,d,N,j)=>ot({x:M,z:S,width:u.current.width,depth:u.current.depth,waveHeight:C,waveChoppiness:d,waveSpeed:N,interactionState:l.current,target:j}),[]);return b.useEffect(()=>{e||v()},[e,v]),b.useEffect(()=>()=>c.texture.dispose(),[c]),b.useMemo(()=>({advance:y,clearPointerTarget:m,configRef:u,interactionStateRef:l,pointerTargetRef:i,reset:v,sampleHeight:g,sampleNormal:x,setPointerTarget:f}),[y,m,v,g,x,f])}function rt({geometry:t,hitRef:e,interactionHitY:n,onPointerMove:o,onPointerOut:r,onPointerOver:s}){return k.jsx("mesh",{ref:e,geometry:t,onPointerMove:o,onPointerOut:r,onPointerOver:s,position:[0,n,0],"rotation-x":-Math.PI/2,userData:{lightningIgnore:!0},children:k.jsx("meshBasicMaterial",{depthWrite:!1,opacity:0,transparent:!0})})}function Oe({waveChoppiness:t,waveChoppinessRef:e,waveHeight:n,waveHeightRef:o,waveSpeed:r,waveSpeedRef:s}){return{waveChoppiness:e?.current??t,waveHeight:o?.current??n,waveSpeed:s?.current??r}}function at({depth:t,groupRef:e,height:n,interactionRuntime:o=null,waveChoppiness:r,waveChoppinessRef:s=null,waveHeight:a,waveHeightRef:i=null,waveSpeed:c,waveSpeedRef:l=null,width:u}){const f=new D,m=new D;return({intersection:v})=>{const y=e.current;if(!y)return null;const g=y.worldToLocal(v.point.clone()),x=J.clamp(g.x,-u/2,u/2),M=J.clamp(g.z,-t/2,t/2),S=()=>{const d=Oe({waveChoppiness:r,waveChoppinessRef:s,waveHeight:a,waveHeightRef:i,waveSpeed:c,waveSpeedRef:l});return o?.sampleHeight?o.sampleHeight(x,M,d.waveHeight,d.waveChoppiness,d.waveSpeed):nt({depth:t,interactionState:o?.interactionStateRef.current??null,waveChoppiness:d.waveChoppiness,waveHeight:d.waveHeight,waveSpeed:d.waveSpeed,width:u,x,z:M})},C=()=>{const d=Oe({waveChoppiness:r,waveChoppinessRef:s,waveHeight:a,waveHeightRef:i,waveSpeed:c,waveSpeedRef:l});return o?.sampleNormal?o.sampleNormal(x,M,d.waveHeight,d.waveChoppiness,d.waveSpeed,f):ot({depth:t,interactionState:o?.interactionStateRef.current??null,target:f,waveChoppiness:d.waveChoppiness,waveHeight:d.waveHeight,waveSpeed:d.waveSpeed,width:u,x,z:M})};return{follow:!0,normalResolver:()=>m.copy(C()).transformDirection(y.matrixWorld),surfaceType:"water",targetResolver:()=>{const d=new D(x,n/2+S(),M);return y.localToWorld(d)}}}}it({Line2:dt});const Pt=`
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
  ${Pt}
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
`,Te=32;function Ht(t,e,n,o){const r=new Be;r.setPositions([-t,o,-e,t,o,-e,t,o,e,-t,o,e,-t,o,-e]);const a=[[-t,-e],[t,-e],[t,e],[-t,e]].map(([l,u])=>{const f=new Be;return f.setPositions([l,o,u,l,n,u]),{geo:f,cx:l,cz:u}}),c=[{x0:-t,z0:-e,x1:t,z1:-e},{x0:t,z0:-e,x1:t,z1:e},{x0:t,z0:e,x1:-t,z1:e},{x0:-t,z0:e,x1:-t,z1:-e}].map(l=>{const u=[];for(let m=0;m<=Te;m+=1){const v=m/Te;u.push(l.x0+(l.x1-l.x0)*v,n,l.z0+(l.z1-l.z0)*v)}const f=new Be;return f.setPositions(u),{geo:f,edge:l}});return{bottomGeo:r,vertGeos:a,topGeos:c}}function Ft(){const t=new Float32Array([0,0,0,1]),e=new he(t,1,1,Ce,De);return e.colorSpace=we,e.generateMipmaps=!1,e.magFilter=me,e.minFilter=me,e.needsUpdate=!0,e.wrapS=fe,e.wrapT=fe,e}function _t({width:t=3.6,depth:e=3.6,height:n=6,segments:o=24,topColor:r="#9edff0",bottomColor:s="#246f98",opacity:a=.34,transmission:i=.5,roughness:c=.3,ior:l=1.12,thickness:u=.35,waveHeight:f=.15,waveChoppiness:m=.5,waveSpeed:v=.6,waveHeightRef:y=null,waveChoppinessRef:g=null,waveSpeedRef:x=null,edgeColor:M="#1f4455",edgeOpacity:S=.65,edgeLineWidth:C=1,showEdges:d=!0,interactionRuntime:N=null,lightningTarget:j=!1}){const Z=b.useRef(),pe=b.useRef(),ce=b.useRef(new D),R=b.useRef(0),L=b.useMemo(()=>Ft(),[]),p=b.useMemo(()=>({uTime:{value:R.current},uWaveHeight:{value:f},uWaveChoppiness:{value:m},uWaveSpeed:{value:v},uColumnTop:{value:n/2},uColumnBottom:{value:-n/2},uInteractionBounds:{value:new Ze(t,e)},uInteractionEnabled:{value:0},uInteractionHeightmap:{value:L},uInteractionResolution:{value:1},uTopColor:{value:new be(r)},uBottomColor:{value:new be(s)}}),[L,r,s,e,n,t]),le=b.useMemo(()=>{const z=et({width:t,depth:e,height:n});return tt(z,o,n,Math.max(t,e))},[t,e,n,o]),ie=b.useMemo(()=>{const z=new lt({transparent:!0,opacity:a,transmission:i,roughness:c,metalness:0,ior:l,thickness:u,side:$e,depthWrite:!0});return z.onBeforeCompile=I=>{const P=I;Object.entries(p).forEach(([q,U])=>{P.uniforms[q]=U}),P.vertexShader=P.vertexShader.replace("#include <common>",It),P.vertexShader=P.vertexShader.replace("#include <beginnormal_vertex>",ht),P.vertexShader=P.vertexShader.replace("#include <begin_vertex>",Ct),P.fragmentShader=P.fragmentShader.replace("#include <common>",`#include <common>
${Dt}`),P.fragmentShader=P.fragmentShader.replace("#include <color_fragment>",wt)},z},[p,a,i,c,l,u]),G=b.useMemo(()=>{if(!d)return null;const z=t/2,I=e/2;return Ht(z,I,n/2,-n/2)},[d,t,n,e]),$=b.useMemo(()=>new xt({transparent:!0,depthTest:!0,depthWrite:!1,toneMapped:!1}),[]),Ne=b.useMemo(()=>new Qe(t,e,1,1),[e,t]),ve=b.useMemo(()=>n/2+Math.max(f*1.5+.048,.02),[n,f]),re=!!j,xe=b.useMemo(()=>re?at({depth:e,groupRef:Z,height:n,interactionRuntime:N,waveChoppiness:m,waveChoppinessRef:g,waveHeight:f,waveHeightRef:y,waveSpeed:v,waveSpeedRef:x,width:t}):null,[e,n,N,re,m,g,f,y,v,x,t]),ye=b.useCallback(()=>{N?.clearPointerTarget()},[N]),W=b.useCallback(z=>{if(!Z.current||!N)return;z.stopPropagation();const I=Z.current.worldToLocal(ce.current.copy(z.point));N.setPointerTarget(J.clamp(I.x,-t/2,t/2),J.clamp(I.z,-e/2,e/2))},[e,N,t]);return b.useEffect(()=>()=>L.dispose(),[L]),b.useEffect(()=>{const z=Z.current;if(z)return xe?(z.userData.lightningSurfaceType="water",z.userData.lightningTargetAdapter=xe):(delete z.userData.lightningSurfaceType,delete z.userData.lightningTargetAdapter),()=>{delete z.userData.lightningSurfaceType,delete z.userData.lightningTargetAdapter}},[xe]),Ke((z,I)=>{R.current+=I;const P=y?.current??f,q=x?.current??v,U=g?.current??m,O=N?.interactionStateRef.current,Q=N?.configRef.current.enabled;if(p.uTime.value=R.current,p.uWaveHeight.value=P,p.uWaveChoppiness.value=U,p.uWaveSpeed.value=q,Je(R.current),N?.advance(I),p.uInteractionBounds.value.set(t,e),p.uInteractionEnabled.value=Q?1:0,p.uInteractionHeightmap.value=O?.texture??L,p.uInteractionResolution.value=O?.size??1,d&&$&&($.color.set(M),$.opacity=S,$.linewidth=C,$.resolution.set(z.size.width,z.size.height)),G){const w=n/2,A=-n/2;G.topGeos.forEach(({geo:E,edge:T})=>{const B=[];for(let H=0;H<=Te;H+=1){const h=H/Te,F=T.x0+(T.x1-T.x0)*h,Y=T.z0+(T.z1-T.z0)*h,V=ge(F,Y,P,U,q),ee=Q?K(F,Y,t,e,O):0;B.push(F,w+V+ee,Y)}E.setPositions(B)}),G.vertGeos.forEach(({geo:E,cx:T,cz:B})=>{const H=ge(T,B,P,U,q),h=Q?K(T,B,t,e,O):0;E.setPositions([T,A,B,T,w+H+h,B])})}}),k.jsxs("group",{ref:Z,children:[le.map((z,I)=>k.jsx("mesh",{geometry:z,material:ie},I)),(N||re)&&k.jsx(rt,{geometry:Ne,hitRef:pe,interactionHitY:ve,onPointerMove:N?W:void 0,onPointerOut:N?ye:void 0,onPointerOver:N?W:void 0}),d&&G&&k.jsxs(k.Fragment,{children:[k.jsx("line2",{geometry:G.bottomGeo,material:$}),G.vertGeos.map(({geo:z},I)=>k.jsx("line2",{geometry:z,material:$},`v${I}`)),G.topGeos.map(({geo:z},I)=>k.jsx("line2",{geometry:z,material:$},`t${I}`))]})]})}const Ee=32,Xe=[[-1,-1],[1,-1],[1,1],[-1,1]],Gt=[[0,1],[1,2],[2,3],[3,0]];function kt(t,e,n,o,r){const s=new pt,a=[new D(-t,o,-e),new D(t,o,-e),new D(t,o,e),new D(-t,o,e),new D(-t,o,-e)];s.add(new We(new ze().setFromPoints(a),r));const i=Xe.map(([u,f])=>{const m=u*t,v=f*e,y=new Float32Array([m,o,v,m,n,v]),g=new ze;return g.setAttribute("position",new _e(y,3)),g.attributes.position.usage=Ge,s.add(new We(g,r)),{geo:g,cx:m,cz:v}}),c=Xe.map(([u,f])=>({x:u*t,z:f*e})),l=Gt.map(([u,f])=>{const m=c[u],v=c[f],y=Ee+1,g=new Float32Array(y*3);for(let M=0;M<y;M+=1){const S=M/Ee;g[M*3]=m.x+(v.x-m.x)*S,g[M*3+1]=n,g[M*3+2]=m.z+(v.z-m.z)*S}const x=new ze;return x.setAttribute("position",new _e(g,3)),x.attributes.position.usage=Ge,s.add(new We(x,r)),{geo:x,a:m,b:v}});return{corners:i,edgeMat:r,group:s,topEdges:l}}function Lt(){const t=new Float32Array([0,0,0,1]),e=new he(t,1,1,Ce,De);return e.colorSpace=we,e.generateMipmaps=!1,e.magFilter=me,e.minFilter=me,e.needsUpdate=!0,e.wrapS=fe,e.wrapT=fe,e}function jt({width:t=3.6,depth:e=3.6,height:n=6,segments:o=24,topColor:r="#9edff0",bottomColor:s="#246f98",opacity:a=.34,transmission:i=.5,roughness:c=.3,ior:l=1.12,thickness:u=.35,waveHeight:f=.15,waveChoppiness:m=.5,waveSpeed:v=.6,waveHeightRef:y=null,waveChoppinessRef:g=null,waveSpeedRef:x=null,edgeColor:M="#1f4455",edgeOpacity:S=.65,showEdges:C=!0,interactionRuntime:d=null,lightningTarget:N=!1}){const j=b.useRef(),Z=b.useRef(),pe=b.useRef(new D),ce=b.useRef(0),R=b.useMemo(()=>Lt(),[]),L=b.useMemo(()=>new ut(R),[R]),p=b.useMemo(()=>({botColor:X(new be(s)),colBot:X(-n/2),colTop:X(n/2),interactionBounds:X(new Ze(t,e)),interactionEnabled:X(0),interactionResolution:X(1),time:X(0),topColor:X(new be(r)),waveChop:X(m),waveHeight:X(f),waveSpeed:X(v)}),[s,e,n,r,m,f,v,t]);b.useEffect(()=>()=>R.dispose(),[R]);const le=b.useMemo(()=>{const W=te(()=>{const A=p.interactionBounds.x.max(_(1e-4)),E=p.interactionBounds.y.max(_(1e-4));return ae(ne.x.div(A).add(.5),_(.5).sub(ne.z.div(E)))}),z=te(()=>de(L,W()).x.mul(p.interactionEnabled)),I=te(()=>{const A=W(),E=p.interactionResolution.max(_(1)),T=_(1).div(E),B=p.interactionBounds.x.div(E).max(_(1e-4)),H=p.interactionBounds.y.div(E).max(_(1e-4)),h=de(L,A.add(ae(T.negate(),0))).x.mul(p.interactionEnabled),F=de(L,A.add(ae(T,0))).x.mul(p.interactionEnabled),Y=de(L,A.add(ae(0,T.negate()))).x.mul(p.interactionEnabled),V=de(L,A.add(ae(0,T))).x.mul(p.interactionEnabled);return Pe(Me(h.sub(F).div(B.mul(2)),1,Y.sub(V).div(H.mul(2))))}),P=te(()=>{const A=_(0).toVar();return se.forEach(({dx:E,dz:T,freq:B,amp:H})=>{const h=ke(ae(E,T),ne.xz).mul(B).add(p.time.mul(p.waveSpeed).mul(B));A.addAssign(_(H).mul(p.waveHeight).mul(Le(h)))}),A}),q=te(()=>{const A=Ie(ne.y.sub(p.colBot).div(p.colTop.sub(p.colBot)),0,1),E=je(.5,1,A);return P().add(z()).mul(E)}),U=te(()=>{const A=_(0).toVar(),E=_(1).toVar(),T=_(0).toVar();return se.forEach(({dx:B,dz:H,freq:h,amp:F})=>{const Y=p.waveChop.div(h*F*4),V=_(h*F).mul(p.waveHeight),ee=ke(ae(B,H),ne.xz).mul(h).add(p.time.mul(p.waveSpeed).mul(h));A.subAssign(_(B).mul(V).mul(Ye(ee))),T.subAssign(_(H).mul(V).mul(Ye(ee))),E.subAssign(Y.mul(V).mul(Le(ee)))}),Pe(Me(A,E,T))}),O=te(()=>{const A=Ie(ne.y.sub(p.colBot).div(p.colTop.sub(p.colBot)),0,1),E=Re.y.greaterThan(.5).select(je(.8,1,A),_(0)),T=U(),B=I(),H=T.y.abs().max(_(1e-4)),h=B.y.abs().max(_(1e-4)),F=T.xz.negate().div(H),Y=B.xz.negate().div(h),V=Pe(Me(F.x.add(Y.x).negate(),1,F.y.add(Y.y).negate()));return qe(Re,V,E)}),Q=te(()=>{const A=ne.y.add(q()),E=Ie(A.sub(p.colBot).div(p.colTop.sub(p.colBot)),0,1);return qe(p.botColor,p.topColor,E)}),w=new mt({transparent:!0,side:$e,depthWrite:!0});return w.color.set(r),w.attenuationColor.set(s),w.opacity=a,w.transmission=i*0,w.roughness=c,w.metalness=0,w.ior=l,w.thickness=u,w.positionNode=ne.add(Me(0,q(),0)),w.normalNode=O(),w.colorNode=Q(),w},[s,l,L,a,c,u,i,r,p]),ie=b.useMemo(()=>{const W=et({width:t,depth:e,height:n});return tt(W,o,n,Math.max(t,e))},[e,n,o,t]),G=b.useMemo(()=>{if(!C)return null;const W=new ft({color:new be(M),opacity:S,transparent:!0,depthTest:!0,depthWrite:!1,toneMapped:!1});return kt(t/2,e/2,n/2,-n/2,W)},[e,M,S,n,C,t]),$=b.useMemo(()=>new Qe(t,e,1,1),[e,t]),Ne=b.useMemo(()=>n/2+Math.max(f*1.5+.048,.02),[n,f]),ve=!!N,re=b.useMemo(()=>ve?at({depth:e,groupRef:j,height:n,interactionRuntime:d,waveChoppiness:m,waveChoppinessRef:g,waveHeight:f,waveHeightRef:y,waveSpeed:v,waveSpeedRef:x,width:t}):null,[e,n,d,ve,m,g,f,y,v,x,t]),xe=b.useCallback(()=>{d?.clearPointerTarget()},[d]),ye=b.useCallback(W=>{if(!j.current||!d)return;W.stopPropagation();const z=j.current.worldToLocal(pe.current.copy(W.point));d.setPointerTarget(J.clamp(z.x,-t/2,t/2),J.clamp(z.z,-e/2,e/2))},[e,d,t]);return b.useEffect(()=>{const W=j.current;if(W)return re?(W.userData.lightningSurfaceType="water",W.userData.lightningTargetAdapter=re):(delete W.userData.lightningSurfaceType,delete W.userData.lightningTargetAdapter),()=>{delete W.userData.lightningSurfaceType,delete W.userData.lightningTargetAdapter}},[re]),Ke((W,z)=>{ce.current+=z;const I=ce.current,P=y?.current??f,q=x?.current??v,U=g?.current??m,O=d?.interactionStateRef.current,Q=d?.configRef.current.enabled;if(Je(I),d?.advance(z),p.time.value=I,p.waveHeight.value=P,p.waveSpeed.value=q,p.waveChop.value=U,p.colTop.value=n/2,p.colBot.value=-n/2,p.topColor.value.set(r),p.botColor.value.set(s),p.interactionBounds.value.set(t,e),p.interactionEnabled.value=Q?1:0,L.value=O?.texture??R,p.interactionResolution.value=O?.size??1,!C||!G)return;G.edgeMat.color.set(M),G.edgeMat.opacity=S;const w=n/2;G.corners.forEach(({geo:A,cx:E,cz:T})=>{const B=ge(E,T,P,U,q),H=Q?K(E,T,t,e,O):0,h=A.attributes.position,F=h.array;F[4]=w+B+H,h.needsUpdate=!0}),G.topEdges.forEach(({geo:A,a:E,b:T})=>{const B=A.attributes.position,H=B.array,h=Ee+1;for(let F=0;F<h;F+=1){const Y=F/Ee,V=E.x+(T.x-E.x)*Y,ee=E.z+(T.z-E.z)*Y,st=ge(V,ee,P,U,q),ct=Q?K(V,ee,t,e,O):0;H[F*3+1]=w+st+ct}B.needsUpdate=!0})}),k.jsxs("group",{ref:j,children:[ie.map((W,z)=>k.jsx("mesh",{geometry:W,material:le},z)),(d||ve)&&k.jsx(rt,{geometry:$,hitRef:Z,interactionHitY:Ne,onPointerMove:d?ye:void 0,onPointerOut:d?xe:void 0,onPointerOver:d?ye:void 0}),C&&G&&k.jsx("primitive",{object:G.group})]})}function Ut(t){return vt(n=>n.gl)?.isWebGPURenderer===!0?k.jsx(jt,{...t}):k.jsx(_t,{...t})}export{He as N,ue as P,yt as a,Ut as b,ge as s,Vt as u};
