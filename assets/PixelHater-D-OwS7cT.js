import{k as me,m as ce,j as e,r as a,a as Z,W as F,c as U,C as _,V as M,P as xe,Z as B,I as re,ag as ve,av as ye,d as ne,g as ae,am as se,O as Me,aD as pe,aQ as Ce,Q as be,s as we,ch as Pe,aE as Se,ai as O,bD as Te,aL as ke,e as je}from"./index-D4JliqBF.js";import{E as ze,I as De,d as We,V as Be}from"./index-J30DVUfv.js";import{C as Re,R as Ve}from"./Record-DIxxIn4J.js";import{M as Ie}from"./MeshBVH-zJCgOiGv.js";import{O as Ee}from"./OrbitControls-Cv98jc_6.js";import{E as Ue}from"./Environment-BR4XtQbn.js";import{P as Ge}from"./shapes-VAZFRxgQ.js";import"./Gltf-DAfyvhS-.js";import"./constants-BJpg_E6h.js";import"./extends-CF3RwP-h.js";function Le(){const{plPosition:n,plDecay:o,plDistance:i,plIntensity:p,plCastShadow:d,ambientLightIntensity:s}=me("Lighting Rig",{"Point Light":ce({plPosition:{label:"Position",value:{x:3,y:3,z:5}},plDecay:{label:"Decay",value:0,min:-10,max:10,step:.1},plDistance:{label:"Distance",value:-1,min:-10,max:10,step:.1},plIntensity:{label:"Intensity",value:.8,min:0,max:10,step:.1},plCastShadow:{label:"Cast Shadow",value:!0}},{collapsed:!0}),"Ambient Light":ce({ambientLightIntensity:{label:"Intensity",value:0,min:0,max:1,step:.1}},{collapsed:!0})},{collapsed:!0});return e.jsxs("group",{children:[e.jsx("ambientLight",{intensity:s}),e.jsx("pointLight",{position:[n.x,n.y,n.z],decay:o,distance:i,intensity:p,castShadow:d})]})}const Ne=`
  varying vec3 vViewNormal;

  void main() {
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,Ae=`
  uniform sampler2D sceneTexture;
  uniform sampler2D sceneDepthTexture;
  uniform sampler2D fullSceneTexture;
  uniform vec3 fallbackColor;
  uniform vec2 resolution;
  uniform float pixelSize;
  uniform float effectMode;
  uniform float voxelWorldSize;
  uniform float voxelSteps;
  uniform mat4 projectionMatrixInverse;
  uniform mat4 viewMatrixInverse;
  uniform mat4 viewProjectionMatrix;
  uniform vec3 cameraWorldPos;
  varying vec3 vViewNormal;

  vec2 clampUv(vec2 uv, vec2 texel) {
    return clamp(uv, texel * 0.5, vec2(1.0) - texel * 0.5);
  }

  vec3 dominantAxisNormal(vec3 v) {
    vec3 a = abs(v);
    if (a.x > a.y && a.x > a.z) return vec3(sign(v.x), 0.0, 0.0);
    if (a.y > a.z) return vec3(0.0, sign(v.y), 0.0);
    return vec3(0.0, 0.0, sign(v.z));
  }

  vec3 worldFromDepth(vec2 uv, float depth) {
    vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 viewPos = projectionMatrixInverse * clip;
    viewPos /= max(viewPos.w, 0.000001);
    vec4 worldPos = viewMatrixInverse * viewPos;
    return worldPos.xyz;
  }

  vec2 uvFromWorld(vec3 worldPos) {
    vec4 clip = viewProjectionMatrix * vec4(worldPos, 1.0);
    vec2 ndc = clip.xy / max(clip.w, 0.000001);
    return ndc * 0.5 + 0.5;
  }

  vec4 sampleMaskedBase(vec2 uvBaseQuantized) {
    vec4 sampleColor = texture2D(sceneTexture, uvBaseQuantized);
    if (sampleColor.a < 0.001) {
      sampleColor = texture2D(fullSceneTexture, uvBaseQuantized);
    }
    if (sampleColor.a < 0.001) {
      sampleColor = vec4(fallbackColor, 1.0);
    }
    return vec4(sampleColor.rgb, 1.0);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    vec2 blockCount = resolution / vec2(pixelSize);
    vec2 texel = 1.0 / resolution;

    vec2 uvBaseQuantized = round(uv * blockCount) / blockCount;
    uvBaseQuantized = clampUv(uvBaseQuantized, texel);

    vec4 outputColor = sampleMaskedBase(uvBaseQuantized);

    float clippedDepth = texture2D(sceneDepthTexture, uvBaseQuantized).x;
    if (clippedDepth < 0.999999) {
      vec3 worldPos = worldFromDepth(uvBaseQuantized, clippedDepth);
      float voxelSizeSafe = max(voxelWorldSize, 0.0001);

      vec3 voxelCell = floor(worldPos / voxelSizeSafe);
      vec3 voxelCenter = (voxelCell + vec3(0.5)) * voxelSizeSafe;
      vec3 normal = dominantAxisNormal(worldPos - voxelCenter);
      float shade = 0.7 + 0.3 * abs(dot(normalize(vViewNormal), normal));

      if (effectMode < 1.5) {
        vec2 voxelUv = clampUv(uvFromWorld(voxelCenter), texel);
        vec4 voxelColor = texture2D(fullSceneTexture, voxelUv);
        if (voxelColor.a < 0.001) voxelColor = vec4(fallbackColor, 1.0);
        outputColor = vec4(voxelColor.rgb * shade, 1.0);
      } else if (effectMode < 2.5) {
        vec3 rayDir = normalize(worldPos - cameraWorldPos);
        float maxDist = max(length(worldPos - cameraWorldPos), 0.0001);
        float stepDist = max(voxelSizeSafe * 0.5, 0.0001);
        vec3 marchPos = worldPos;

        for (int i = 0; i < 96; i += 1) {
          if (float(i) >= voxelSteps) break;
          float d = min((float(i) + 1.0) * stepDist, maxDist);
          marchPos = cameraWorldPos + rayDir * d;
          if (d >= maxDist) break;
        }

        vec3 rayCell = floor(marchPos / voxelSizeSafe);
        vec3 rayCenter = (rayCell + vec3(0.5)) * voxelSizeSafe;
        vec2 rayUv = clampUv(uvFromWorld(rayCenter), texel);
        vec4 rayColor = texture2D(fullSceneTexture, rayUv);
        if (rayColor.a < 0.001) rayColor = vec4(fallbackColor, 1.0);

        vec3 rayNormal = dominantAxisNormal(-rayDir);
        float rayShade = 0.55 + 0.45 * abs(dot(normalize(vViewNormal), rayNormal));
        outputColor = vec4(rayColor.rgb * rayShade, 1.0);
      } else {
        vec2 voxelUv = clampUv(uvFromWorld(voxelCenter), texel);
        vec4 voxelColor = texture2D(fullSceneTexture, voxelUv);
        if (voxelColor.a < 0.001) voxelColor = vec4(fallbackColor, 1.0);

        vec3 local = abs(fract(worldPos / voxelSizeSafe) - 0.5) * 2.0;
        float edge = max(local.x, max(local.y, local.z));
        float edgeMask = smoothstep(0.7, 0.98, edge);
        float edgeDarken = mix(1.0, 0.6, edgeMask);

        vec3 stylized = floor(voxelColor.rgb * 5.0) / 5.0;
        outputColor = vec4(stylized * shade * edgeDarken, 1.0);
      }
    }

    gl_FragColor = outputColor;

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;function Fe({mode:n="voxelScreen",pixelSize:o=8,voxelSize:i=.25,voxelSteps:p=24,clipOffset:d=0,children:s,...g}){const y=a.useRef(),{gl:t,scene:r,camera:m}=Z(),l=a.useMemo(()=>new F(1,1),[]),f=a.useMemo(()=>new F(1,1),[]),c=a.useMemo(()=>new U,[]),C=a.useMemo(()=>new _,[]),v=a.useMemo(()=>new M,[]),b=a.useMemo(()=>new M,[]),h=a.useMemo(()=>new M,[]),x=a.useMemo(()=>new xe,[]),w=a.useMemo(()=>new B,[]),R={voxelScreen:1,voxelRaymarch:2,voxelInstanced:3},u=a.useMemo(()=>new re({vertexShader:Ne,fragmentShader:Ae,uniforms:{sceneTexture:{value:null},sceneDepthTexture:{value:null},fullSceneTexture:{value:null},fallbackColor:{value:new _(1,1,1)},resolution:{value:new U},pixelSize:{value:o},effectMode:{value:1},voxelWorldSize:{value:i},voxelSteps:{value:p},projectionMatrixInverse:{value:new B},viewMatrixInverse:{value:new B},viewProjectionMatrix:{value:new B},cameraWorldPos:{value:new M}},transparent:!1,depthWrite:!0}),[]);return a.useEffect(()=>{l.depthTexture=new ve(1,1),l.depthTexture.type=ye},[l]),a.useEffect(()=>()=>{l.dispose(),f.dispose(),u.dispose()},[l,f,u]),ne(()=>{const D=y.current;if(!D)return;t.getDrawingBufferSize(c),(l.width!==c.x||l.height!==c.y)&&(l.setSize(c.x,c.y),f.setSize(c.x,c.y)),u.uniforms.pixelSize.value=o,u.uniforms.effectMode.value=R[n]??1,u.uniforms.voxelWorldSize.value=i,u.uniforms.voxelSteps.value=p,u.uniforms.resolution.value.copy(c),u.uniforms.projectionMatrixInverse.value.copy(m.projectionMatrixInverse),u.uniforms.viewMatrixInverse.value.copy(m.matrixWorld),w.multiplyMatrices(m.projectionMatrix,m.matrixWorldInverse),u.uniforms.viewProjectionMatrix.value.copy(w),m.getWorldPosition(h),u.uniforms.cameraWorldPos.value.copy(h),D.getWorldPosition(v),m.getWorldDirection(b),x.setFromNormalAndCoplanarPoint(b,v),x.constant+=d,D.visible=!1;const k=t.clippingPlanes,P=t.toneMapping;t.toneMapping=ae;const z=t.getClearAlpha();t.getClearColor(C),r.background&&r.background.isColor?u.uniforms.fallbackColor.value.copy(r.background):u.uniforms.fallbackColor.value.setRGB(1,1,1);const S=t.getRenderTarget();t.setClearColor(C,z),t.clippingPlanes=[],t.setRenderTarget(f),t.clear(),t.render(r,m),t.setClearColor(0,0),t.clippingPlanes=[x],t.setRenderTarget(l),t.clear(),t.render(r,m),t.setRenderTarget(S),t.toneMapping=P,t.setClearColor(C,z),t.clippingPlanes=k,D.visible=!0,u.uniforms.sceneTexture.value=l.texture,u.uniforms.sceneDepthTexture.value=l.depthTexture,u.uniforms.fullSceneTexture.value=f.texture}),e.jsx("mesh",{ref:y,material:u,...g,children:s})}const _e=`
  varying vec3 vCenterWorld;
  varying vec3 vNormalWorld;

  void main() {
    vec4 centerWorld = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vCenterWorld = centerWorld.xyz;

    mat3 iMat = mat3(modelMatrix * instanceMatrix);
    vNormalWorld = normalize(iMat * normal);

    vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`,Qe=`
  uniform sampler2D clippedSceneTexture;
  uniform sampler2D fullSceneTexture;
  uniform vec2 resolution;
  uniform vec3 fallbackColor;
  uniform mat4 viewProjectionMatrix;
  uniform vec3 cameraWorldPos;
  varying vec3 vCenterWorld;
  varying vec3 vNormalWorld;

  vec2 clampUv(vec2 uv, vec2 texel) {
    return clamp(uv, texel * 0.5, vec2(1.0) - texel * 0.5);
  }

  void main() {
    vec2 texel = 1.0 / resolution;

    vec4 clip = viewProjectionMatrix * vec4(vCenterWorld, 1.0);
    vec2 ndc = clip.xy / max(clip.w, 0.000001);
    vec2 uv = clampUv(ndc * 0.5 + 0.5, texel);

    vec4 color = texture2D(clippedSceneTexture, uv);
    if (color.a < 0.001) {
      color = texture2D(fullSceneTexture, uv);
    }
    if (color.a < 0.001) {
      color = vec4(fallbackColor, 1.0);
    }

    vec3 toCamera = normalize(cameraWorldPos - vCenterWorld);
    float light = 0.55 + 0.45 * max(dot(normalize(vNormalWorld), toCamera), 0.0);

    gl_FragColor = vec4(color.rgb * light, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;function Oe({voxelSize:n=.25,maxInstances:o=4096,clipOffset:i=0,children:p,...d}){const s=a.useRef(),g=a.useRef(),y=a.useRef(),{gl:t,scene:r,camera:m}=Z(),l=a.useMemo(()=>new F(1,1),[]),f=a.useMemo(()=>new F(1,1),[]),c=a.useMemo(()=>new se(1,1,1),[]),C=a.useMemo(()=>new U,[]),v=a.useMemo(()=>new _,[]),b=a.useMemo(()=>new M,[]),h=a.useMemo(()=>new M,[]),x=a.useMemo(()=>new M,[]),w=a.useMemo(()=>new xe,[]),R=a.useMemo(()=>new B,[]),u=a.useMemo(()=>new Me,[]),D=a.useMemo(()=>new M,[]),k=a.useMemo(()=>new re({vertexShader:_e,fragmentShader:Qe,uniforms:{clippedSceneTexture:{value:null},fullSceneTexture:{value:null},resolution:{value:new U},fallbackColor:{value:new _(1,1,1)},viewProjectionMatrix:{value:new B},cameraWorldPos:{value:new M}},transparent:!1,depthWrite:!0}),[]);return a.useEffect(()=>()=>{l.dispose(),f.dispose(),c.dispose(),k.dispose()},[l,f,c,k]),a.useLayoutEffect(()=>{const P=g.current,z=y.current;if(!P||!z||!P.geometry)return;P.geometry.computeBoundingBox();const S=P.geometry.boundingBox;if(!S)return;S.getSize(D);const V=Math.max(n,.02),I=Math.ceil(D.x/V)*Math.ceil(D.y/V)*Math.ceil(D.z/V),q=I>o?Math.ceil(Math.cbrt(I/o)):1,j=V*q,G=j*.9;let E=0;for(let L=S.min.x+j*.5;L<=S.max.x;L+=j)for(let N=S.min.y+j*.5;N<=S.max.y;N+=j)for(let A=S.min.z+j*.5;A<=S.max.z&&!(E>=o);A+=j)u.position.set(L,N,A),u.scale.set(G,G,G),u.rotation.set(0,0,0),u.updateMatrix(),z.setMatrixAt(E,u.matrix),E+=1;z.count=E,z.instanceMatrix.needsUpdate=!0},[n,o,u,D]),ne(()=>{const P=s.current;if(!P)return;t.getDrawingBufferSize(C),(l.width!==C.x||l.height!==C.y)&&(l.setSize(C.x,C.y),f.setSize(C.x,C.y)),k.uniforms.resolution.value.copy(C),R.multiplyMatrices(m.projectionMatrix,m.matrixWorldInverse),k.uniforms.viewProjectionMatrix.value.copy(R),m.getWorldPosition(x),k.uniforms.cameraWorldPos.value.copy(x),P.getWorldPosition(b),m.getWorldDirection(h),w.setFromNormalAndCoplanarPoint(h,b),w.constant+=i;const z=t.getRenderTarget(),S=t.clippingPlanes,V=t.toneMapping,I=t.getClearAlpha();t.getClearColor(v),t.toneMapping=ae,r.background&&r.background.isColor?k.uniforms.fallbackColor.value.copy(r.background):k.uniforms.fallbackColor.value.setRGB(1,1,1),P.visible=!1,t.setClearColor(v,I),t.clippingPlanes=[],t.setRenderTarget(f),t.clear(),t.render(r,m),t.setClearColor(0,0),t.clippingPlanes=[w],t.setRenderTarget(l),t.clear(),t.render(r,m),t.setRenderTarget(z),t.clippingPlanes=S,t.toneMapping=V,t.setClearColor(v,I),P.visible=!0,k.uniforms.clippedSceneTexture.value=l.texture,k.uniforms.fullSceneTexture.value=f.texture}),e.jsxs("group",{ref:s,...d,children:[e.jsx("mesh",{ref:g,visible:!1,children:p}),e.jsx("instancedMesh",{ref:y,args:[c,k,o],frustumCulled:!1})]})}const H=new M;function W(n,o,i,p,d,s){const g=2*Math.PI*d/4,y=Math.max(s-2*d,0),t=Math.PI/4;H.copy(o),H[p]=0,H.normalize();const r=.5*g/(g+y),m=1-H.angleTo(n)/t;return Math.sign(H[i])===1?m*r:y/(g+y)+r+r*(1-m)}class le extends se{constructor(o=1,i=1,p=1,d=2,s=.1){const g=d*2+1;if(s=Math.min(o/2,i/2,p/2,s),super(1,1,1,g,g,g),this.type="RoundedBoxGeometry",this.parameters={width:o,height:i,depth:p,segments:d,radius:s},g===1)return;const y=this.toNonIndexed();this.index=null,this.attributes.position=y.attributes.position,this.attributes.normal=y.attributes.normal,this.attributes.uv=y.attributes.uv;const t=new M,r=new M,m=new M(o,i,p).divideScalar(2).subScalar(s),l=this.attributes.position.array,f=this.attributes.normal.array,c=this.attributes.uv.array,C=l.length/6,v=new M,b=.5/g;for(let h=0,x=0;h<l.length;h+=3,x+=2)switch(t.fromArray(l,h),r.copy(t),r.x-=Math.sign(r.x)*b,r.y-=Math.sign(r.y)*b,r.z-=Math.sign(r.z)*b,r.normalize(),l[h+0]=m.x*Math.sign(t.x)+r.x*s,l[h+1]=m.y*Math.sign(t.y)+r.y*s,l[h+2]=m.z*Math.sign(t.z)+r.z*s,f[h+0]=r.x,f[h+1]=r.y,f[h+2]=r.z,Math.floor(h/C)){case 0:v.set(1,0,0),c[x+0]=W(v,r,"z","y",s,p),c[x+1]=1-W(v,r,"y","z",s,i);break;case 1:v.set(-1,0,0),c[x+0]=1-W(v,r,"z","y",s,p),c[x+1]=1-W(v,r,"y","z",s,i);break;case 2:v.set(0,1,0),c[x+0]=1-W(v,r,"x","z",s,o),c[x+1]=W(v,r,"z","x",s,p);break;case 3:v.set(0,-1,0),c[x+0]=1-W(v,r,"x","z",s,o),c[x+1]=1-W(v,r,"z","x",s,p);break;case 4:v.set(0,0,1),c[x+0]=1-W(v,r,"x","y",s,o),c[x+1]=1-W(v,r,"y","x",s,i);break;case 5:v.set(0,0,-1),c[x+0]=W(v,r,"x","y",s,o),c[x+1]=1-W(v,r,"y","x",s,i);break}}static fromJSON(o){return new le(o.width,o.height,o.depth,o.segments,o.radius)}}const He=`
  varying vec3 vCenterWorld;

  void main() {
    vec4 centerWorld = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vCenterWorld = centerWorld.xyz;

    vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`,Ke=`
  uniform sampler2D fullSceneTexture;
  uniform vec2 resolution;
  uniform vec3 fallbackColor;
  uniform mat4 viewProjectionMatrix;
  varying vec3 vCenterWorld;

  vec2 clampUv(vec2 uv, vec2 texel) {
    return clamp(uv, texel * 0.5, vec2(1.0) - texel * 0.5);
  }

  void main() {
    vec2 texel = 1.0 / resolution;

    vec4 clip = viewProjectionMatrix * vec4(vCenterWorld, 1.0);
    vec2 ndc = clip.xy / max(clip.w, 0.000001);
    vec2 uv = clampUv(ndc * 0.5 + 0.5, texel);

    vec4 color = texture2D(fullSceneTexture, uv);
    if (color.a < 0.001) {
      color = vec4(fallbackColor, 1.0);
    }

    gl_FragColor = vec4(color.rgb, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`,$e=new pe(new M(-.5,-.5,-.5),new M(.5,.5,.5)),ue=new WeakMap;function Ye(n){let o=ue.get(n);return o||(o=new Ie(n),ue.set(n,o)),o}function Xe(n,o){let i=o;for(;i;){if(i===n)return!0;i=i.parent}return!1}function Ze({voxelSize:n=.25,cornerRadius:o=0,insideOnly:i=!1,maxInstances:p=8192,children:d,...s}){const g=a.useRef(),y=a.useRef(),t=a.useRef(),{gl:r,scene:m,camera:l}=Z(),f=a.useMemo(()=>new F(1,1),[]),c=a.useMemo(()=>new U,[]),C=a.useMemo(()=>new _,[]),v=a.useMemo(()=>new B,[]),b=a.useMemo(()=>o>0?new le(1,1,1,4,Math.min(o,.49)):new se(1,1,1),[o]),h=a.useMemo(()=>new re({vertexShader:He,fragmentShader:Ke,uniforms:{fullSceneTexture:{value:null},resolution:{value:new U},fallbackColor:{value:new _(1,1,1)},viewProjectionMatrix:{value:new B}},transparent:!1,depthWrite:!0}),[]);return a.useEffect(()=>{t.current&&(t.current.geometry=b)},[b]),a.useEffect(()=>()=>{f.dispose(),b.dispose(),h.dispose()},[f,b,h]),a.useLayoutEffect(()=>{const x=y.current,w=t.current,R=g.current;if(!x||!w||!R||!x.geometry)return;x.updateWorldMatrix(!0,!1),x.geometry.computeBoundingBox();const u=x.geometry.boundingBox;if(!u)return;const D=u.clone().applyMatrix4(x.matrixWorld),k=new pe,P=[];if(m.traverse(T=>{if(!T.isMesh||!T.visible||!T.geometry||!T.geometry.attributes?.position||Xe(R,T)||(T.geometry.boundingBox||T.geometry.computeBoundingBox(),!T.geometry.boundingBox)||(k.copy(T.geometry.boundingBox).applyMatrix4(T.matrixWorld),!k.intersectsBox(D)))return;const Q=Ye(T.geometry);P.push({bvh:Q,worldToLocal:new B().copy(T.matrixWorld).invert()})}),P.length===0){w.count=0,w.instanceMatrix.needsUpdate=!0;return}const z=Math.max(n,.01),S=u.getSize(new M),V=Math.ceil(S.x/z)*Math.ceil(S.y/z)*Math.ceil(S.z/z),I=Math.max(p*4,2e4),q=V>I?Math.ceil(Math.cbrt(V/I)):1,j=z*q,G=new M,E=new M,L=new B,N=new B,A=new B,ge=new be,he=new M().setScalar(j),K=new Ce;K.direction.set(0,0,1);let $=0,J=!1;for(let T=u.min.x+j*.5;T<=u.max.x;T+=j){for(let Q=u.min.y+j*.5;Q<=u.max.y;Q+=j){for(let ee=u.min.z+j*.5;ee<=u.max.z;ee+=j){if($>=p){J=!0;break}G.set(T,Q,ee),L.compose(G,ge,he),N.multiplyMatrices(x.matrixWorld,L),E.copy(G),x.localToWorld(E);let Y=!1,oe=!1;for(let te=0;te<P.length;te+=1){const X=P[te];if(A.multiplyMatrices(X.worldToLocal,N),X.bvh.intersectsBox($e,A)&&(Y=!0),!Y||i){K.origin.copy(E).applyMatrix4(X.worldToLocal);const ie=X.bvh.raycastFirst(K,we);ie&&ie.face.normal.dot(K.direction)>0&&(oe=!0)}if(Y&&oe)break}(Y&&!i||oe)&&(w.setMatrixAt($,L),$+=1)}if(J)break}if(J)break}w.count=$,w.instanceMatrix.needsUpdate=!0},[n,i,p,m]),ne(()=>{const x=g.current;if(!x)return;r.getDrawingBufferSize(c),(f.width!==c.x||f.height!==c.y)&&f.setSize(c.x,c.y),h.uniforms.resolution.value.copy(c),v.multiplyMatrices(l.projectionMatrix,l.matrixWorldInverse),h.uniforms.viewProjectionMatrix.value.copy(v);const w=r.getRenderTarget(),R=r.toneMapping,u=r.getClearAlpha();r.getClearColor(C),r.toneMapping=ae,m.background&&m.background.isColor?h.uniforms.fallbackColor.value.copy(m.background):h.uniforms.fallbackColor.value.setRGB(1,1,1),x.visible=!1,r.setClearColor(C,u),r.setRenderTarget(f),r.clear(),r.render(m,l),r.setRenderTarget(w),r.toneMapping=R,r.setClearColor(C,u),x.visible=!0,h.uniforms.fullSceneTexture.value=f.texture}),e.jsxs("group",{ref:g,...s,children:[e.jsx("mesh",{ref:y,visible:!1,children:d}),e.jsx("instancedMesh",{ref:t,args:[b,h,p],frustumCulled:!1})]})}function qe({effectShape:n,pixelSize:o,refraction:i,planeWidth:p,planeHeight:d,voxelMode:s,voxelSize:g,voxelSteps:y,cornerRadius:t,insideOnly:r}){const m=s!=="pixel";let l=Re;m&&(s==="voxelInstanced"?l=Oe:s==="voxelInterior"?l=Ze:l=Fe);let f={};m&&(s==="voxelInstanced"?f={voxelSize:g}:s==="voxelInterior"?f={voxelSize:g,cornerRadius:t,insideOnly:r}:f={mode:s,voxelSize:g,voxelSteps:y});const c=m?{pixelSize:o,...f}:{pixelSize:o,refraction:i};return e.jsxs(e.Fragment,{children:[n==="Plane"&&e.jsx(l,{...c,children:e.jsx("planeGeometry",{args:[p,d]})}),n==="TwoPanes"&&e.jsxs(e.Fragment,{children:[e.jsx(l,{...c,position:[.5,.5,0],children:e.jsx("planeGeometry",{args:[1,1]})}),e.jsx(l,{...c,position:[-.5,-.5,0],children:e.jsx("planeGeometry",{args:[1,1]})})]}),n==="Cube"&&e.jsx(l,{...c,children:e.jsx("boxGeometry",{args:[1,1,1]})}),n==="Cubes"&&e.jsx(l,{...c,clipOffset:.5,position:[0,0,1],children:e.jsx("boxGeometry",{args:[1,1,1]})}),n==="Torus"&&e.jsx(l,{...c,children:e.jsx("torusGeometry",{args:[.5,.15,16,100]})}),n==="Sphere"&&e.jsx(l,{...c,children:e.jsx("sphereGeometry",{args:[.4,32,32]})}),n==="Knot"&&e.jsx(l,{...c,children:e.jsx("torusKnotGeometry",{args:[.5,.1,100,16]})})]})}const fe=a.createContext(null);function Je({children:n}){const o=a.useContext(fe);return o?Pe(e.jsx("group",{children:a.Children.map(n,i=>a.isValidElement(i)?a.cloneElement(i,{material:new Se({color:"white"})}):null)}),o):null}class de extends ze{constructor(o,i,{pixelSize:p=8,maskScene:d}){super("PixelMaskEffect",`
        uniform sampler2D maskTex;
        uniform sampler2D maskDepthTex;
        uniform float pixelSize;
        uniform vec2 resolution;
        uniform float depthBias;

        void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {

        float sceneDepth = texture(depthBuffer, uv).r;
        float maskDepth  = texture(maskDepthTex, uv).r;

        float px = 1.0 / resolution.x;
        float py = 1.0 / resolution.y;

        float mask = 0.0;
        mask += texture(maskTex, uv + vec2( px, 0)).r;
        mask += texture(maskTex, uv + vec2(-px, 0)).r;
        mask += texture(maskTex, uv + vec2(0,  py)).r;
        mask += texture(maskTex, uv + vec2(0, -py)).r;
        mask *= 0.25;

        bool depthPass = sceneDepth > maskDepth + depthBias;
        bool stable = abs(sceneDepth - maskDepth) > 0.0012;

        vec4 color = inputColor;

        if (mask > 0.02 && depthPass && stable) {
            vec2 grid = pixelSize / resolution;
            vec2 pUv = floor(uv / grid) * grid;
            color = texture(inputBuffer, pUv);
        }

        outputColor = color;
        }
      `,{uniforms:new Map([["maskTex",new O(null)],["maskDepthTex",new O(null)],["depthBias",new O(.005)],["pixelSize",new O(p)],["resolution",new O(new U)]])}),this.needsDepthTexture=!0,this.scene=o,this.camera=i,this.maskScene=d,this.maskTarget=new F(1,1,{depthBuffer:!0}),this.maskTarget.depthTexture=new ve,this.maskTarget.depthTexture.type=Te}update(o){const i=o.getSize(new U);this.uniforms.get("resolution").value.set(i.x,i.y),(this.maskTarget.width!==i.x||this.maskTarget.height!==i.y)&&this.maskTarget.setSize(i.x,i.y),o.setRenderTarget(this.maskTarget),o.clear(),o.render(this.maskScene,this.camera),o.setRenderTarget(null),this.uniforms.get("maskTex").value=this.maskTarget.texture,this.uniforms.get("maskDepthTex").value=this.maskTarget.depthTexture}}je({PixelMaskEffectImpl:de});function eo({children:n,pixelSize:o=8}){const{scene:i,camera:p}=Z(),d=a.useMemo(()=>new ke,[]),s=a.useMemo(()=>new de(i,p,{pixelSize:o,maskScene:d}),[i,p,o,d]);return e.jsxs(fe.Provider,{value:d,children:[e.jsx(De,{intensity:0,radius:.001}),e.jsx("primitive",{object:s}),n]})}function oo(){return me("👾",{bgType:{label:"Background",options:{Environment:"environment",Color:"color"},value:"environment"},bgPreset:{label:"Preset",options:["apartment","city","dawn","forest","lobby","night","park","studio","sunset","warehouse"],value:"studio",render:n=>n("👾.bgType")==="environment"},bgBlur:{label:"Blur",value:.25,min:0,max:1,step:.05,render:n=>n("👾.bgType")==="environment"},bgColor:{label:"Color",value:"#111111",render:n=>n("👾.bgType")==="color"},pixelEffect:{label:"Effect",options:{Yours:"Yours",Mine:"Mine",Censor:"Censor","Voxel Screen":"VoxelScreen","Voxel Raymarch":"VoxelRaymarch","Voxel Instanced":"VoxelInstanced","Voxel Interior":"VoxelInterior"},value:"Censor"},effectShape:{label:"Effect Shape",options:{Plane:"Plane",TwoPanes:"TwoPanes",Cube:"Cube",Cubes:"Cubes",Torus:"Torus",Sphere:"Sphere",Knot:"Knot"},value:"TwoPanes"},pixelSize:{label:"Pixel Size",value:8,min:1,max:32,step:1},planeHeight:{label:"Plane Height",value:1,min:1,max:10,step:.25},planeWidth:{label:"Plane Width",value:5,min:1,max:10,step:.25},refraction:{label:"Refraction",value:0,min:0,max:.15,step:.005,render:n=>n("👾.pixelEffect")==="Censor"},voxelSize:{label:"Voxel Size",value:.25,min:.01,max:2,step:.001,render:n=>{const o=n("👾.pixelEffect");return o==="VoxelScreen"||o==="VoxelRaymarch"||o==="VoxelInstanced"||o==="VoxelInterior"}},voxelSteps:{label:"Voxel Steps",value:24,min:4,max:96,step:1,render:n=>n("👾.pixelEffect")==="VoxelRaymarch"},cornerRadius:{label:"Corner Radius",value:0,min:0,max:.49,step:.01,render:n=>n("👾.pixelEffect")==="VoxelInterior"},insideOnly:{label:"Inside Only",value:!1,render:n=>n("👾.pixelEffect")==="VoxelInterior"}},{collapsed:!0})}function xo(){const{bgType:n,bgPreset:o,bgBlur:i,bgColor:p,pixelEffect:d,effectShape:s,pixelSize:g,planeHeight:y,planeWidth:t,refraction:r,voxelSize:m,voxelSteps:l,cornerRadius:f,insideOnly:c}=oo(),v={Censor:"pixel",VoxelScreen:"voxelScreen",VoxelRaymarch:"voxelRaymarch",VoxelInstanced:"voxelInstanced",VoxelInterior:"voxelInterior"}[d]??null,b=d==="Yours"||d==="Mine";return e.jsxs(e.Fragment,{children:[e.jsx(Le,{}),e.jsx(Ee,{enableDamping:!0,enablePan:!0,enableRotate:!0,enableZoom:!0}),e.jsx(Ue,{preset:o,background:n==="environment",blur:i}),n==="color"&&e.jsx("color",{attach:"background",args:[p]}),e.jsx(Ve,{scale:10,position:[0,0,-1],rotation:[0,0,0]}),e.jsxs("mesh",{position:[0,0,1],children:[e.jsx("sphereGeometry",{args:[.25,32,32]}),e.jsx("meshPhysicalMaterial",{color:"hotpink"})]}),v&&e.jsx(qe,{effectShape:s,pixelSize:g,refraction:r,planeWidth:t,planeHeight:y,voxelMode:v,voxelSize:m,voxelSteps:l,cornerRadius:f,insideOnly:c}),b&&e.jsxs(We,{multisampling:0,enableNormalPass:!0,children:[d==="Yours"&&e.jsx(Be,{granularity:g}),d==="Mine"&&e.jsx(eo,{pixelSize:g,children:e.jsxs(Je,{children:[s==="Plane"&&e.jsx(Ge,{args:[t,y],children:e.jsx("meshBasicMaterial",{})}),s==="TwoPanes"&&e.jsxs(e.Fragment,{children:[e.jsxs("mesh",{position:[.5,.5,0],children:[e.jsx("planeGeometry",{args:[1,1]}),e.jsx("meshBasicMaterial",{})]}),e.jsxs("mesh",{position:[-.5,-.5,0],children:[e.jsx("planeGeometry",{args:[1,1]}),e.jsx("meshBasicMaterial",{})]})]}),s==="Cube"&&e.jsxs("mesh",{position:[0,0,0],children:[e.jsx("boxGeometry",{args:[1,1,1]}),e.jsx("meshBasicMaterial",{})]}),s==="Cubes"&&e.jsx(e.Fragment,{children:e.jsxs("mesh",{position:[0,0,1],children:[e.jsx("boxGeometry",{args:[1,1,1]}),e.jsx("meshBasicMaterial",{})]})}),s==="Torus"&&e.jsxs("mesh",{children:[e.jsx("torusGeometry",{args:[.5,.15,16,100]}),e.jsx("meshBasicMaterial",{})]}),s==="Sphere"&&e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[.4,32,32]}),e.jsx("meshBasicMaterial",{})]}),s==="Knot"&&e.jsxs("mesh",{children:[e.jsx("torusKnotGeometry",{args:[.5,.1,100,16]}),e.jsx("meshBasicMaterial",{})]})]})})]})]})}export{xo as default};
