import{r as o,b as Y,W as L,h as E,C as A,V as T,P as se,I as D,a5 as oe,a4 as ie,aZ as de,a as te,d as ae,j as e,an as ce,p as fe,aN as ue,bn as ge,Q as he,D as Me,a$ as ye,b0 as Ce,a6 as Q,bX as we,$ as be,e as Pe,a9 as Te,ac as re}from"./index-ClsBeNqB.js";import{E as Se,I as je,d as ke,V as ze}from"./index-BOU7_yte.js";import{C as De,R as We}from"./Record-zdqJSxVD.js";import{R as Be}from"./RoundedBoxGeometry-qSoKPYSh.js";import{M as Re}from"./MeshBVH-ObIeMqJM.js";import{O as Ve}from"./OrbitControls-1wnVVMl7.js";import{E as Ie}from"./Environment-C4xmriM2.js";import{P as Ee}from"./shapes-BG0DGZUC.js";import"./Gltf-CH5FGzUk.js";import"./BufferGeometryUtils-433-m82P.js";import"./constants-C8Y9gZZZ.js";import"./extends-CF3RwP-h.js";import"./EXRLoader-BgKVhISX.js";const Ge=`
  varying vec3 vViewNormal;

  void main() {
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,Ue=`
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
`;function Ne({mode:t="voxelScreen",pixelSize:a=8,voxelSize:s=.25,voxelSteps:f=24,clipOffset:d=0,children:x,...h}){const k=o.useRef(),{gl:r,scene:c,camera:u}=Y(),l=o.useMemo(()=>new L(1,1),[]),m=o.useMemo(()=>new L(1,1),[]),i=o.useMemo(()=>new E,[]),p=o.useMemo(()=>new A,[]),W=o.useMemo(()=>new T,[]),z=o.useMemo(()=>new T,[]),M=o.useMemo(()=>new T,[]),v=o.useMemo(()=>new se,[]),g=o.useMemo(()=>new D,[]),B={voxelScreen:1,voxelRaymarch:2,voxelInstanced:3},n=o.useMemo(()=>new oe({vertexShader:Ge,fragmentShader:Ue,uniforms:{sceneTexture:{value:null},sceneDepthTexture:{value:null},fullSceneTexture:{value:null},fallbackColor:{value:new A(1,1,1)},resolution:{value:new E},pixelSize:{value:a},effectMode:{value:1},voxelWorldSize:{value:s},voxelSteps:{value:f},projectionMatrixInverse:{value:new D},viewMatrixInverse:{value:new D},viewProjectionMatrix:{value:new D},cameraWorldPos:{value:new T}},transparent:!1,depthWrite:!0}),[]);return o.useEffect(()=>{l.depthTexture=new ie(1,1),l.depthTexture.type=de},[l]),o.useEffect(()=>()=>{l.dispose(),m.dispose(),n.dispose()},[l,m,n]),te(()=>{const S=k.current;if(!S)return;r.getDrawingBufferSize(i),(l.width!==i.x||l.height!==i.y)&&(l.setSize(i.x,i.y),m.setSize(i.x,i.y)),n.uniforms.pixelSize.value=a,n.uniforms.effectMode.value=B[t]??1,n.uniforms.voxelWorldSize.value=s,n.uniforms.voxelSteps.value=f,n.uniforms.resolution.value.copy(i),n.uniforms.projectionMatrixInverse.value.copy(u.projectionMatrixInverse),n.uniforms.viewMatrixInverse.value.copy(u.matrixWorld),g.multiplyMatrices(u.projectionMatrix,u.matrixWorldInverse),n.uniforms.viewProjectionMatrix.value.copy(g),u.getWorldPosition(M),n.uniforms.cameraWorldPos.value.copy(M),S.getWorldPosition(W),u.getWorldDirection(z),v.setFromNormalAndCoplanarPoint(z,W),v.constant+=d,S.visible=!1;const b=r.clippingPlanes,y=r.toneMapping;r.toneMapping=ae;const j=r.getClearAlpha();r.getClearColor(p),c.background&&c.background.isColor?n.uniforms.fallbackColor.value.copy(c.background):n.uniforms.fallbackColor.value.setRGB(1,1,1);const C=r.getRenderTarget();r.setClearColor(p,j),r.clippingPlanes=[],r.setRenderTarget(m),r.clear(),r.render(c,u),r.setClearColor(0,0),r.clippingPlanes=[v],r.setRenderTarget(l),r.clear(),r.render(c,u),r.setRenderTarget(C),r.toneMapping=y,r.setClearColor(p,j),r.clippingPlanes=b,S.visible=!0,n.uniforms.sceneTexture.value=l.texture,n.uniforms.sceneDepthTexture.value=l.depthTexture,n.uniforms.fullSceneTexture.value=m.texture}),e.jsx("mesh",{ref:k,material:n,...h,children:x})}const Fe=`
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
`,Le=`
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
`;function Ae({voxelSize:t=.25,maxInstances:a=4096,clipOffset:s=0,children:f,...d}){const x=o.useRef(),h=o.useRef(),k=o.useRef(),{gl:r,scene:c,camera:u}=Y(),l=o.useMemo(()=>new L(1,1),[]),m=o.useMemo(()=>new L(1,1),[]),i=o.useMemo(()=>new ce(1,1,1),[]),p=o.useMemo(()=>new E,[]),W=o.useMemo(()=>new A,[]),z=o.useMemo(()=>new T,[]),M=o.useMemo(()=>new T,[]),v=o.useMemo(()=>new T,[]),g=o.useMemo(()=>new se,[]),B=o.useMemo(()=>new D,[]),n=o.useMemo(()=>new fe,[]),S=o.useMemo(()=>new T,[]),b=o.useMemo(()=>new oe({vertexShader:Fe,fragmentShader:Le,uniforms:{clippedSceneTexture:{value:null},fullSceneTexture:{value:null},resolution:{value:new E},fallbackColor:{value:new A(1,1,1)},viewProjectionMatrix:{value:new D},cameraWorldPos:{value:new T}},transparent:!1,depthWrite:!0}),[]);return o.useEffect(()=>()=>{l.dispose(),m.dispose(),i.dispose(),b.dispose()},[l,m,i,b]),o.useLayoutEffect(()=>{const y=h.current,j=k.current;if(!y||!j||!y.geometry)return;y.geometry.computeBoundingBox();const C=y.geometry.boundingBox;if(!C)return;C.getSize(S);const R=Math.max(t,.02),V=Math.ceil(S.x/R)*Math.ceil(S.y/R)*Math.ceil(S.z/R),X=V>a?Math.ceil(Math.cbrt(V/a)):1,P=R*X,G=P*.9;let I=0;for(let U=C.min.x+P*.5;U<=C.max.x;U+=P)for(let N=C.min.y+P*.5;N<=C.max.y;N+=P)for(let F=C.min.z+P*.5;F<=C.max.z&&!(I>=a);F+=P)n.position.set(U,N,F),n.scale.set(G,G,G),n.rotation.set(0,0,0),n.updateMatrix(),j.setMatrixAt(I,n.matrix),I+=1;j.count=I,j.instanceMatrix.needsUpdate=!0},[t,a,n,S]),te(()=>{const y=x.current;if(!y)return;r.getDrawingBufferSize(p),(l.width!==p.x||l.height!==p.y)&&(l.setSize(p.x,p.y),m.setSize(p.x,p.y)),b.uniforms.resolution.value.copy(p),B.multiplyMatrices(u.projectionMatrix,u.matrixWorldInverse),b.uniforms.viewProjectionMatrix.value.copy(B),u.getWorldPosition(v),b.uniforms.cameraWorldPos.value.copy(v),y.getWorldPosition(z),u.getWorldDirection(M),g.setFromNormalAndCoplanarPoint(M,z),g.constant+=s;const j=r.getRenderTarget(),C=r.clippingPlanes,R=r.toneMapping,V=r.getClearAlpha();r.getClearColor(W),r.toneMapping=ae,c.background&&c.background.isColor?b.uniforms.fallbackColor.value.copy(c.background):b.uniforms.fallbackColor.value.setRGB(1,1,1),y.visible=!1,r.setClearColor(W,V),r.clippingPlanes=[],r.setRenderTarget(m),r.clear(),r.render(c,u),r.setClearColor(0,0),r.clippingPlanes=[g],r.setRenderTarget(l),r.clear(),r.render(c,u),r.setRenderTarget(j),r.clippingPlanes=C,r.toneMapping=R,r.setClearColor(W,V),y.visible=!0,b.uniforms.clippedSceneTexture.value=l.texture,b.uniforms.fullSceneTexture.value=m.texture}),e.jsxs("group",{ref:x,...d,children:[e.jsx("mesh",{ref:h,visible:!1,children:f}),e.jsx("instancedMesh",{ref:k,args:[i,b,a],frustumCulled:!1})]})}const _e=`
  varying vec3 vCenterWorld;

  void main() {
    vec4 centerWorld = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vCenterWorld = centerWorld.xyz;

    vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`,Qe=`
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
`,Oe=new ue(new T(-.5,-.5,-.5),new T(.5,.5,.5)),le=new WeakMap;function He(t){let a=le.get(t);return a||(a=new Re(t),le.set(t,a)),a}function $e(t,a){let s=a;for(;s;){if(s===t)return!0;s=s.parent}return!1}function Ke({voxelSize:t=.25,cornerRadius:a=0,insideOnly:s=!1,maxInstances:f=8192,children:d,...x}){const h=o.useRef(),k=o.useRef(),r=o.useRef(),{gl:c,scene:u,camera:l}=Y(),m=o.useMemo(()=>new L(1,1),[]),i=o.useMemo(()=>new E,[]),p=o.useMemo(()=>new A,[]),W=o.useMemo(()=>new D,[]),z=o.useMemo(()=>a>0?new Be(1,1,1,4,Math.min(a,.49)):new ce(1,1,1),[a]),M=o.useMemo(()=>new oe({vertexShader:_e,fragmentShader:Qe,uniforms:{fullSceneTexture:{value:null},resolution:{value:new E},fallbackColor:{value:new A(1,1,1)},viewProjectionMatrix:{value:new D}},transparent:!1,depthWrite:!0}),[]);return o.useEffect(()=>{r.current&&(r.current.geometry=z)},[z]),o.useEffect(()=>()=>{m.dispose(),z.dispose(),M.dispose()},[m,z,M]),o.useLayoutEffect(()=>{const v=k.current,g=r.current,B=h.current;if(!v||!g||!B||!v.geometry)return;v.updateWorldMatrix(!0,!1),v.geometry.computeBoundingBox();const n=v.geometry.boundingBox;if(!n)return;const S=n.clone().applyMatrix4(v.matrixWorld),b=new ue,y=[];if(u.traverse(w=>{if(!w.isMesh||!w.visible||!w.geometry||!w.geometry.attributes?.position||$e(B,w)||(w.geometry.boundingBox||w.geometry.computeBoundingBox(),!w.geometry.boundingBox)||(b.copy(w.geometry.boundingBox).applyMatrix4(w.matrixWorld),!b.intersectsBox(S)))return;const _=He(w.geometry);y.push({bvh:_,worldToLocal:new D().copy(w.matrixWorld).invert()})}),y.length===0){g.count=0,g.instanceMatrix.needsUpdate=!0;return}const j=Math.max(t,.01),C=n.getSize(new T),R=Math.ceil(C.x/j)*Math.ceil(C.y/j)*Math.ceil(C.z/j),V=Math.max(f*4,2e4),X=R>V?Math.ceil(Math.cbrt(R/V)):1,P=j*X,G=new T,I=new T,U=new D,N=new D,F=new D,ve=new he,pe=new T().setScalar(P),O=new ge;O.direction.set(0,0,1);let H=0,Z=!1;for(let w=n.min.x+P*.5;w<=n.max.x;w+=P){for(let _=n.min.y+P*.5;_<=n.max.y;_+=P){for(let q=n.min.z+P*.5;q<=n.max.z;q+=P){if(H>=f){Z=!0;break}G.set(w,_,q),U.compose(G,ve,pe),N.multiplyMatrices(v.matrixWorld,U),I.copy(G),v.localToWorld(I);let $=!1,J=!1;for(let ee=0;ee<y.length;ee+=1){const K=y[ee];if(F.multiplyMatrices(K.worldToLocal,N),K.bvh.intersectsBox(Oe,F)&&($=!0),!$||s){O.origin.copy(I).applyMatrix4(K.worldToLocal);const ne=K.bvh.raycastFirst(O,Me);ne&&ne.face.normal.dot(O.direction)>0&&(J=!0)}if($&&J)break}($&&!s||J)&&(g.setMatrixAt(H,U),H+=1)}if(Z)break}if(Z)break}g.count=H,g.instanceMatrix.needsUpdate=!0},[t,s,f,u]),te(()=>{const v=h.current;if(!v)return;c.getDrawingBufferSize(i),(m.width!==i.x||m.height!==i.y)&&m.setSize(i.x,i.y),M.uniforms.resolution.value.copy(i),W.multiplyMatrices(l.projectionMatrix,l.matrixWorldInverse),M.uniforms.viewProjectionMatrix.value.copy(W);const g=c.getRenderTarget(),B=c.toneMapping,n=c.getClearAlpha();c.getClearColor(p),c.toneMapping=ae,u.background&&u.background.isColor?M.uniforms.fallbackColor.value.copy(u.background):M.uniforms.fallbackColor.value.setRGB(1,1,1),v.visible=!1,c.setClearColor(p,n),c.setRenderTarget(m),c.clear(),c.render(u,l),c.setRenderTarget(g),c.toneMapping=B,c.setClearColor(p,n),v.visible=!0,M.uniforms.fullSceneTexture.value=m.texture}),e.jsxs("group",{ref:h,...x,children:[e.jsx("mesh",{ref:k,visible:!1,children:d}),e.jsx("instancedMesh",{ref:r,args:[z,M,f],frustumCulled:!1})]})}function Ye({effectShape:t,pixelSize:a,refraction:s,planeWidth:f,planeHeight:d,voxelMode:x,voxelSize:h,voxelSteps:k,cornerRadius:r,insideOnly:c}){const u=x!=="pixel";let l=De;u&&(x==="voxelInstanced"?l=Ae:x==="voxelInterior"?l=Ke:l=Ne);let m={};u&&(x==="voxelInstanced"?m={voxelSize:h}:x==="voxelInterior"?m={voxelSize:h,cornerRadius:r,insideOnly:c}:m={mode:x,voxelSize:h,voxelSteps:k});const i=u?{pixelSize:a,...m}:{pixelSize:a,refraction:s};return e.jsxs(e.Fragment,{children:[t==="Plane"&&e.jsx(l,{...i,children:e.jsx("planeGeometry",{args:[f,d]})}),t==="TwoPanes"&&e.jsxs(e.Fragment,{children:[e.jsx(l,{...i,position:[.5,.5,0],children:e.jsx("planeGeometry",{args:[1,1]})}),e.jsx(l,{...i,position:[-.5,-.5,0],children:e.jsx("planeGeometry",{args:[1,1]})})]}),t==="Cube"&&e.jsx(l,{...i,children:e.jsx("boxGeometry",{args:[1,1,1]})}),t==="Cubes"&&e.jsx(l,{...i,clipOffset:.5,position:[0,0,1],children:e.jsx("boxGeometry",{args:[1,1,1]})}),t==="Torus"&&e.jsx(l,{...i,children:e.jsx("torusGeometry",{args:[.5,.15,16,100]})}),t==="Sphere"&&e.jsx(l,{...i,children:e.jsx("sphereGeometry",{args:[.4,32,32]})}),t==="Knot"&&e.jsx(l,{...i,children:e.jsx("torusKnotGeometry",{args:[.5,.1,100,16]})})]})}const me=o.createContext(null);function Xe({children:t}){const a=o.useContext(me);return a?ye(e.jsx("group",{children:o.Children.map(t,s=>o.isValidElement(s)?o.cloneElement(s,{material:new Ce({color:"white"})}):null)}),a):null}class xe extends Se{constructor(a,s,{pixelSize:f=8,maskScene:d}){super("PixelMaskEffect",`
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
      `,{uniforms:new Map([["maskTex",new Q(null)],["maskDepthTex",new Q(null)],["depthBias",new Q(.005)],["pixelSize",new Q(f)],["resolution",new Q(new E)]])}),this.needsDepthTexture=!0,this.scene=a,this.camera=s,this.maskScene=d,this.maskTarget=new L(1,1,{depthBuffer:!0}),this.maskTarget.depthTexture=new ie,this.maskTarget.depthTexture.type=we}update(a){const s=a.getSize(new E);this.uniforms.get("resolution").value.set(s.x,s.y),(this.maskTarget.width!==s.x||this.maskTarget.height!==s.y)&&this.maskTarget.setSize(s.x,s.y),a.setRenderTarget(this.maskTarget),a.clear(),a.render(this.maskScene,this.camera),a.setRenderTarget(null),this.uniforms.get("maskTex").value=this.maskTarget.texture,this.uniforms.get("maskDepthTex").value=this.maskTarget.depthTexture}}Pe({PixelMaskEffectImpl:xe});function Ze({children:t,pixelSize:a=8}){const{scene:s,camera:f}=Y(),d=o.useMemo(()=>new be,[]),x=o.useMemo(()=>new xe(s,f,{pixelSize:a,maskScene:d}),[s,f,a,d]);return e.jsxs(me.Provider,{value:d,children:[e.jsx(je,{intensity:0,radius:.001}),e.jsx("primitive",{object:x}),t]})}function qe(){return Te("👾",{bgType:{label:"Background",options:{Environment:"environment",Color:"color"},value:"environment"},bgPreset:{label:"Preset",options:["apartment","city","dawn","forest","lobby","night","park","studio","sunset","warehouse"],value:"studio",render:t=>t("👾.bgType")==="environment"},bgBlur:{label:"Blur",value:.25,min:0,max:1,step:.05,render:t=>t("👾.bgType")==="environment"},bgColor:{label:"Color",value:"#111111",render:t=>t("👾.bgType")==="color"},"Lighting Rig":re({"Point Light":re({plPosition:{label:"Position",value:{x:3,y:3,z:5}},plDecay:{label:"Decay",value:0,min:-10,max:10,step:.1},plDistance:{label:"Distance",value:-1,min:-10,max:10,step:.1},plIntensity:{label:"Intensity",value:.8,min:0,max:10,step:.1},plCastShadow:{label:"Cast Shadow",value:!0}},{collapsed:!0}),"Ambient Light":re({ambientLightIntensity:{label:"Intensity",value:0,min:0,max:1,step:.1}},{collapsed:!0})},{collapsed:!0}),pixelEffect:{label:"Effect",options:{Yours:"Yours",Mine:"Mine",Censor:"Censor","Voxel Screen":"VoxelScreen","Voxel Raymarch":"VoxelRaymarch","Voxel Instanced":"VoxelInstanced","Voxel Interior":"VoxelInterior"},value:"Censor"},effectShape:{label:"Effect Shape",options:{Plane:"Plane",TwoPanes:"TwoPanes",Cube:"Cube",Cubes:"Cubes",Torus:"Torus",Sphere:"Sphere",Knot:"Knot"},value:"TwoPanes"},pixelSize:{label:"Pixel Size",value:8,min:1,max:32,step:1},planeHeight:{label:"Plane Height",value:1,min:1,max:10,step:.25},planeWidth:{label:"Plane Width",value:5,min:1,max:10,step:.25},refraction:{label:"Refraction",value:0,min:0,max:.15,step:.005,render:t=>t("👾.pixelEffect")==="Censor"},voxelSize:{label:"Voxel Size",value:.25,min:.01,max:2,step:.001,render:t=>{const a=t("👾.pixelEffect");return a==="VoxelScreen"||a==="VoxelRaymarch"||a==="VoxelInstanced"||a==="VoxelInterior"}},voxelSteps:{label:"Voxel Steps",value:24,min:4,max:96,step:1,render:t=>t("👾.pixelEffect")==="VoxelRaymarch"},cornerRadius:{label:"Corner Radius",value:0,min:0,max:.49,step:.01,render:t=>t("👾.pixelEffect")==="VoxelInterior"},insideOnly:{label:"Inside Only",value:!1,render:t=>t("👾.pixelEffect")==="VoxelInterior"}},{collapsed:!0})}function xr(){const{bgType:t,bgPreset:a,bgBlur:s,bgColor:f,pixelEffect:d,effectShape:x,pixelSize:h,planeHeight:k,planeWidth:r,refraction:c,voxelSize:u,voxelSteps:l,cornerRadius:m,insideOnly:i,plPosition:p,plDecay:W,plDistance:z,plIntensity:M,plCastShadow:v,ambientLightIntensity:g}=qe(),n={Censor:"pixel",VoxelScreen:"voxelScreen",VoxelRaymarch:"voxelRaymarch",VoxelInstanced:"voxelInstanced",VoxelInterior:"voxelInterior"}[d]??null,S=d==="Yours"||d==="Mine";return e.jsxs(e.Fragment,{children:[e.jsxs("group",{children:[e.jsx("ambientLight",{intensity:g}),e.jsx("pointLight",{position:[p.x,p.y,p.z],decay:W,distance:z,intensity:M,castShadow:v})]}),e.jsx(Ve,{enableDamping:!0,enablePan:!0,enableRotate:!0,enableZoom:!0}),e.jsx(Ie,{preset:a,background:t==="environment",blur:s}),t==="color"&&e.jsx("color",{attach:"background",args:[f]}),e.jsx(We,{scale:10,position:[0,0,-1],rotation:[0,0,0]}),e.jsxs("mesh",{position:[0,0,1],children:[e.jsx("sphereGeometry",{args:[.25,32,32]}),e.jsx("meshPhysicalMaterial",{color:"hotpink"})]}),n&&e.jsx(Ye,{effectShape:x,pixelSize:h,refraction:c,planeWidth:r,planeHeight:k,voxelMode:n,voxelSize:u,voxelSteps:l,cornerRadius:m,insideOnly:i}),S&&e.jsxs(ke,{multisampling:0,enableNormalPass:!0,children:[d==="Yours"&&e.jsx(ze,{granularity:h}),d==="Mine"&&e.jsx(Ze,{pixelSize:h,children:e.jsxs(Xe,{children:[x==="Plane"&&e.jsx(Ee,{args:[r,k],children:e.jsx("meshBasicMaterial",{})}),x==="TwoPanes"&&e.jsxs(e.Fragment,{children:[e.jsxs("mesh",{position:[.5,.5,0],children:[e.jsx("planeGeometry",{args:[1,1]}),e.jsx("meshBasicMaterial",{})]}),e.jsxs("mesh",{position:[-.5,-.5,0],children:[e.jsx("planeGeometry",{args:[1,1]}),e.jsx("meshBasicMaterial",{})]})]}),x==="Cube"&&e.jsxs("mesh",{position:[0,0,0],children:[e.jsx("boxGeometry",{args:[1,1,1]}),e.jsx("meshBasicMaterial",{})]}),x==="Cubes"&&e.jsx(e.Fragment,{children:e.jsxs("mesh",{position:[0,0,1],children:[e.jsx("boxGeometry",{args:[1,1,1]}),e.jsx("meshBasicMaterial",{})]})}),x==="Torus"&&e.jsxs("mesh",{children:[e.jsx("torusGeometry",{args:[.5,.15,16,100]}),e.jsx("meshBasicMaterial",{})]}),x==="Sphere"&&e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[.4,32,32]}),e.jsx("meshBasicMaterial",{})]}),x==="Knot"&&e.jsxs("mesh",{children:[e.jsx("torusKnotGeometry",{args:[.5,.1,100,16]}),e.jsx("meshBasicMaterial",{})]})]})})]})]})}export{xr as default};
