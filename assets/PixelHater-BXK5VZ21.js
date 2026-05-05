import{r as n,a as X,W as L,G as U,C as _,V as y,P as ue,L as D,v as te,a7 as me,an as ge,b as ne,f as ae,j as e,ad as se,O as he,au as xe,aQ as Me,Q as ye,x as Ce,cj as we,av as be,a9 as O,bB as Pe,aJ as Te,e as Se,h as ke}from"./index-BjAk923F.js";import{E as je,I as ze,d as We,V as Be}from"./index-DYMr6_uP.js";import{C as De,R as Re}from"./Record-DYQT0TrN.js";import{L as Ve}from"./LightingRig-Dm0sOCpJ.js";import{M as Ie}from"./MeshBVH-D3Gx9UL7.js";import{O as Ee}from"./OrbitControls-B-LaElIU.js";import{E as Ue}from"./Environment-C96Jb7bk.js";import{P as Ge}from"./shapes-at1lZWQJ.js";import"./Gltf-DuvxF6ry.js";import"./constants-CkMERDu8.js";const Ne=`
  varying vec3 vViewNormal;

  void main() {
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,Fe=`
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
`;function Ae({mode:a="voxelScreen",pixelSize:r=8,voxelSize:c=.25,voxelSteps:f=24,clipOffset:g=0,children:s,...d}){const M=n.useRef(),{gl:o,scene:t,camera:m}=X(),l=n.useMemo(()=>new L(1,1),[]),p=n.useMemo(()=>new L(1,1),[]),i=n.useMemo(()=>new U,[]),C=n.useMemo(()=>new _,[]),v=n.useMemo(()=>new y,[]),w=n.useMemo(()=>new y,[]),h=n.useMemo(()=>new y,[]),x=n.useMemo(()=>new ue,[]),b=n.useMemo(()=>new D,[]),R={voxelScreen:1,voxelRaymarch:2,voxelInstanced:3},u=n.useMemo(()=>new te({vertexShader:Ne,fragmentShader:Fe,uniforms:{sceneTexture:{value:null},sceneDepthTexture:{value:null},fullSceneTexture:{value:null},fallbackColor:{value:new _(1,1,1)},resolution:{value:new U},pixelSize:{value:r},effectMode:{value:1},voxelWorldSize:{value:c},voxelSteps:{value:f},projectionMatrixInverse:{value:new D},viewMatrixInverse:{value:new D},viewProjectionMatrix:{value:new D},cameraWorldPos:{value:new y}},transparent:!1,depthWrite:!0}),[]);return n.useEffect(()=>{l.depthTexture=new me(1,1),l.depthTexture.type=ge},[l]),n.useEffect(()=>()=>{l.dispose(),p.dispose(),u.dispose()},[l,p,u]),ne(()=>{const W=M.current;if(!W)return;o.getDrawingBufferSize(i),(l.width!==i.x||l.height!==i.y)&&(l.setSize(i.x,i.y),p.setSize(i.x,i.y)),u.uniforms.pixelSize.value=r,u.uniforms.effectMode.value=R[a]??1,u.uniforms.voxelWorldSize.value=c,u.uniforms.voxelSteps.value=f,u.uniforms.resolution.value.copy(i),u.uniforms.projectionMatrixInverse.value.copy(m.projectionMatrixInverse),u.uniforms.viewMatrixInverse.value.copy(m.matrixWorld),b.multiplyMatrices(m.projectionMatrix,m.matrixWorldInverse),u.uniforms.viewProjectionMatrix.value.copy(b),m.getWorldPosition(h),u.uniforms.cameraWorldPos.value.copy(h),W.getWorldPosition(v),m.getWorldDirection(w),x.setFromNormalAndCoplanarPoint(w,v),x.constant+=g,W.visible=!1;const k=o.clippingPlanes,P=o.toneMapping;o.toneMapping=ae;const z=o.getClearAlpha();o.getClearColor(C),t.background&&t.background.isColor?u.uniforms.fallbackColor.value.copy(t.background):u.uniforms.fallbackColor.value.setRGB(1,1,1);const T=o.getRenderTarget();o.setClearColor(C,z),o.clippingPlanes=[],o.setRenderTarget(p),o.clear(),o.render(t,m),o.setClearColor(0,0),o.clippingPlanes=[x],o.setRenderTarget(l),o.clear(),o.render(t,m),o.setRenderTarget(T),o.toneMapping=P,o.setClearColor(C,z),o.clippingPlanes=k,W.visible=!0,u.uniforms.sceneTexture.value=l.texture,u.uniforms.sceneDepthTexture.value=l.depthTexture,u.uniforms.fullSceneTexture.value=p.texture}),e.jsx("mesh",{ref:M,material:u,...d,children:s})}const Le=`
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
`,_e=`
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
`;function Qe({voxelSize:a=.25,maxInstances:r=4096,clipOffset:c=0,children:f,...g}){const s=n.useRef(),d=n.useRef(),M=n.useRef(),{gl:o,scene:t,camera:m}=X(),l=n.useMemo(()=>new L(1,1),[]),p=n.useMemo(()=>new L(1,1),[]),i=n.useMemo(()=>new se(1,1,1),[]),C=n.useMemo(()=>new U,[]),v=n.useMemo(()=>new _,[]),w=n.useMemo(()=>new y,[]),h=n.useMemo(()=>new y,[]),x=n.useMemo(()=>new y,[]),b=n.useMemo(()=>new ue,[]),R=n.useMemo(()=>new D,[]),u=n.useMemo(()=>new he,[]),W=n.useMemo(()=>new y,[]),k=n.useMemo(()=>new te({vertexShader:Le,fragmentShader:_e,uniforms:{clippedSceneTexture:{value:null},fullSceneTexture:{value:null},resolution:{value:new U},fallbackColor:{value:new _(1,1,1)},viewProjectionMatrix:{value:new D},cameraWorldPos:{value:new y}},transparent:!1,depthWrite:!0}),[]);return n.useEffect(()=>()=>{l.dispose(),p.dispose(),i.dispose(),k.dispose()},[l,p,i,k]),n.useLayoutEffect(()=>{const P=d.current,z=M.current;if(!P||!z||!P.geometry)return;P.geometry.computeBoundingBox();const T=P.geometry.boundingBox;if(!T)return;T.getSize(W);const V=Math.max(a,.02),I=Math.ceil(W.x/V)*Math.ceil(W.y/V)*Math.ceil(W.z/V),q=I>r?Math.ceil(Math.cbrt(I/r)):1,j=V*q,G=j*.9;let E=0;for(let N=T.min.x+j*.5;N<=T.max.x;N+=j)for(let F=T.min.y+j*.5;F<=T.max.y;F+=j)for(let A=T.min.z+j*.5;A<=T.max.z&&!(E>=r);A+=j)u.position.set(N,F,A),u.scale.set(G,G,G),u.rotation.set(0,0,0),u.updateMatrix(),z.setMatrixAt(E,u.matrix),E+=1;z.count=E,z.instanceMatrix.needsUpdate=!0},[a,r,u,W]),ne(()=>{const P=s.current;if(!P)return;o.getDrawingBufferSize(C),(l.width!==C.x||l.height!==C.y)&&(l.setSize(C.x,C.y),p.setSize(C.x,C.y)),k.uniforms.resolution.value.copy(C),R.multiplyMatrices(m.projectionMatrix,m.matrixWorldInverse),k.uniforms.viewProjectionMatrix.value.copy(R),m.getWorldPosition(x),k.uniforms.cameraWorldPos.value.copy(x),P.getWorldPosition(w),m.getWorldDirection(h),b.setFromNormalAndCoplanarPoint(h,w),b.constant+=c;const z=o.getRenderTarget(),T=o.clippingPlanes,V=o.toneMapping,I=o.getClearAlpha();o.getClearColor(v),o.toneMapping=ae,t.background&&t.background.isColor?k.uniforms.fallbackColor.value.copy(t.background):k.uniforms.fallbackColor.value.setRGB(1,1,1),P.visible=!1,o.setClearColor(v,I),o.clippingPlanes=[],o.setRenderTarget(p),o.clear(),o.render(t,m),o.setClearColor(0,0),o.clippingPlanes=[b],o.setRenderTarget(l),o.clear(),o.render(t,m),o.setRenderTarget(z),o.clippingPlanes=T,o.toneMapping=V,o.setClearColor(v,I),P.visible=!0,k.uniforms.clippedSceneTexture.value=l.texture,k.uniforms.fullSceneTexture.value=p.texture}),e.jsxs("group",{ref:s,...g,children:[e.jsx("mesh",{ref:d,visible:!1,children:f}),e.jsx("instancedMesh",{ref:M,args:[i,k,r],frustumCulled:!1})]})}const H=new y;function B(a,r,c,f,g,s){const d=2*Math.PI*g/4,M=Math.max(s-2*g,0),o=Math.PI/4;H.copy(r),H[f]=0,H.normalize();const t=.5*d/(d+M),m=1-H.angleTo(a)/o;return Math.sign(H[c])===1?m*t:M/(d+M)+t+t*(1-m)}class le extends se{constructor(r=1,c=1,f=1,g=2,s=.1){const d=g*2+1;if(s=Math.min(r/2,c/2,f/2,s),super(1,1,1,d,d,d),this.type="RoundedBoxGeometry",this.parameters={width:r,height:c,depth:f,segments:g,radius:s},d===1)return;const M=this.toNonIndexed();this.index=null,this.attributes.position=M.attributes.position,this.attributes.normal=M.attributes.normal,this.attributes.uv=M.attributes.uv;const o=new y,t=new y,m=new y(r,c,f).divideScalar(2).subScalar(s),l=this.attributes.position.array,p=this.attributes.normal.array,i=this.attributes.uv.array,C=l.length/6,v=new y,w=.5/d;for(let h=0,x=0;h<l.length;h+=3,x+=2)switch(o.fromArray(l,h),t.copy(o),t.x-=Math.sign(t.x)*w,t.y-=Math.sign(t.y)*w,t.z-=Math.sign(t.z)*w,t.normalize(),l[h+0]=m.x*Math.sign(o.x)+t.x*s,l[h+1]=m.y*Math.sign(o.y)+t.y*s,l[h+2]=m.z*Math.sign(o.z)+t.z*s,p[h+0]=t.x,p[h+1]=t.y,p[h+2]=t.z,Math.floor(h/C)){case 0:v.set(1,0,0),i[x+0]=B(v,t,"z","y",s,f),i[x+1]=1-B(v,t,"y","z",s,c);break;case 1:v.set(-1,0,0),i[x+0]=1-B(v,t,"z","y",s,f),i[x+1]=1-B(v,t,"y","z",s,c);break;case 2:v.set(0,1,0),i[x+0]=1-B(v,t,"x","z",s,r),i[x+1]=B(v,t,"z","x",s,f);break;case 3:v.set(0,-1,0),i[x+0]=1-B(v,t,"x","z",s,r),i[x+1]=1-B(v,t,"z","x",s,f);break;case 4:v.set(0,0,1),i[x+0]=1-B(v,t,"x","y",s,r),i[x+1]=1-B(v,t,"y","x",s,c);break;case 5:v.set(0,0,-1),i[x+0]=B(v,t,"x","y",s,r),i[x+1]=1-B(v,t,"y","x",s,c);break}}static fromJSON(r){return new le(r.width,r.height,r.depth,r.segments,r.radius)}}const Oe=`
  varying vec3 vCenterWorld;

  void main() {
    vec4 centerWorld = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vCenterWorld = centerWorld.xyz;

    vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`,He=`
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
`,Ke=new xe(new y(-.5,-.5,-.5),new y(.5,.5,.5)),ce=new WeakMap;function $e(a){let r=ce.get(a);return r||(r=new Ie(a),ce.set(a,r)),r}function Ye(a,r){let c=r;for(;c;){if(c===a)return!0;c=c.parent}return!1}function Je({voxelSize:a=.25,cornerRadius:r=0,insideOnly:c=!1,maxInstances:f=8192,children:g,...s}){const d=n.useRef(),M=n.useRef(),o=n.useRef(),{gl:t,scene:m,camera:l}=X(),p=n.useMemo(()=>new L(1,1),[]),i=n.useMemo(()=>new U,[]),C=n.useMemo(()=>new _,[]),v=n.useMemo(()=>new D,[]),w=n.useMemo(()=>r>0?new le(1,1,1,4,Math.min(r,.49)):new se(1,1,1),[r]),h=n.useMemo(()=>new te({vertexShader:Oe,fragmentShader:He,uniforms:{fullSceneTexture:{value:null},resolution:{value:new U},fallbackColor:{value:new _(1,1,1)},viewProjectionMatrix:{value:new D}},transparent:!1,depthWrite:!0}),[]);return n.useEffect(()=>{o.current&&(o.current.geometry=w)},[w]),n.useEffect(()=>()=>{p.dispose(),w.dispose(),h.dispose()},[p,w,h]),n.useLayoutEffect(()=>{const x=M.current,b=o.current,R=d.current;if(!x||!b||!R||!x.geometry)return;x.updateWorldMatrix(!0,!1),x.geometry.computeBoundingBox();const u=x.geometry.boundingBox;if(!u)return;const W=u.clone().applyMatrix4(x.matrixWorld),k=new xe,P=[];if(m.traverse(S=>{if(!S.isMesh||!S.visible||!S.geometry||!S.geometry.attributes?.position||Ye(R,S)||(S.geometry.boundingBox||S.geometry.computeBoundingBox(),!S.geometry.boundingBox)||(k.copy(S.geometry.boundingBox).applyMatrix4(S.matrixWorld),!k.intersectsBox(W)))return;const Q=$e(S.geometry);P.push({bvh:Q,worldToLocal:new D().copy(S.matrixWorld).invert()})}),P.length===0){b.count=0,b.instanceMatrix.needsUpdate=!0;return}const z=Math.max(a,.01),T=u.getSize(new y),V=Math.ceil(T.x/z)*Math.ceil(T.y/z)*Math.ceil(T.z/z),I=Math.max(f*4,2e4),q=V>I?Math.ceil(Math.cbrt(V/I)):1,j=z*q,G=new y,E=new y,N=new D,F=new D,A=new D,fe=new ye,de=new y().setScalar(j),K=new Me;K.direction.set(0,0,1);let $=0,Z=!1;for(let S=u.min.x+j*.5;S<=u.max.x;S+=j){for(let Q=u.min.y+j*.5;Q<=u.max.y;Q+=j){for(let ee=u.min.z+j*.5;ee<=u.max.z;ee+=j){if($>=f){Z=!0;break}G.set(S,Q,ee),N.compose(G,fe,de),F.multiplyMatrices(x.matrixWorld,N),E.copy(G),x.localToWorld(E);let Y=!1,oe=!1;for(let re=0;re<P.length;re+=1){const J=P[re];if(A.multiplyMatrices(J.worldToLocal,F),J.bvh.intersectsBox(Ke,A)&&(Y=!0),!Y||c){K.origin.copy(E).applyMatrix4(J.worldToLocal);const ie=J.bvh.raycastFirst(K,Ce);ie&&ie.face.normal.dot(K.direction)>0&&(oe=!0)}if(Y&&oe)break}(Y&&!c||oe)&&(b.setMatrixAt($,N),$+=1)}if(Z)break}if(Z)break}b.count=$,b.instanceMatrix.needsUpdate=!0},[a,c,f,m]),ne(()=>{const x=d.current;if(!x)return;t.getDrawingBufferSize(i),(p.width!==i.x||p.height!==i.y)&&p.setSize(i.x,i.y),h.uniforms.resolution.value.copy(i),v.multiplyMatrices(l.projectionMatrix,l.matrixWorldInverse),h.uniforms.viewProjectionMatrix.value.copy(v);const b=t.getRenderTarget(),R=t.toneMapping,u=t.getClearAlpha();t.getClearColor(C),t.toneMapping=ae,m.background&&m.background.isColor?h.uniforms.fallbackColor.value.copy(m.background):h.uniforms.fallbackColor.value.setRGB(1,1,1),x.visible=!1,t.setClearColor(C,u),t.setRenderTarget(p),t.clear(),t.render(m,l),t.setRenderTarget(b),t.toneMapping=R,t.setClearColor(C,u),x.visible=!0,h.uniforms.fullSceneTexture.value=p.texture}),e.jsxs("group",{ref:d,...s,children:[e.jsx("mesh",{ref:M,visible:!1,children:g}),e.jsx("instancedMesh",{ref:o,args:[w,h,f],frustumCulled:!1})]})}function Xe({effectShape:a,pixelSize:r,refraction:c,planeWidth:f,planeHeight:g,voxelMode:s,voxelSize:d,voxelSteps:M,cornerRadius:o,insideOnly:t}){const m=s!=="pixel";let l=De;m&&(s==="voxelInstanced"?l=Qe:s==="voxelInterior"?l=Je:l=Ae);let p={};m&&(s==="voxelInstanced"?p={voxelSize:d}:s==="voxelInterior"?p={voxelSize:d,cornerRadius:o,insideOnly:t}:p={mode:s,voxelSize:d,voxelSteps:M});const i=m?{pixelSize:r,...p}:{pixelSize:r,refraction:c};return e.jsxs(e.Fragment,{children:[a==="Plane"&&e.jsx(l,{...i,children:e.jsx("planeGeometry",{args:[f,g]})}),a==="TwoPanes"&&e.jsxs(e.Fragment,{children:[e.jsx(l,{...i,position:[.5,.5,0],children:e.jsx("planeGeometry",{args:[1,1]})}),e.jsx(l,{...i,position:[-.5,-.5,0],children:e.jsx("planeGeometry",{args:[1,1]})})]}),a==="Cube"&&e.jsx(l,{...i,children:e.jsx("boxGeometry",{args:[1,1,1]})}),a==="Cubes"&&e.jsx(l,{...i,clipOffset:.5,position:[0,0,1],children:e.jsx("boxGeometry",{args:[1,1,1]})}),a==="Torus"&&e.jsx(l,{...i,children:e.jsx("torusGeometry",{args:[.5,.15,16,100]})}),a==="Sphere"&&e.jsx(l,{...i,children:e.jsx("sphereGeometry",{args:[.4,32,32]})}),a==="Knot"&&e.jsx(l,{...i,children:e.jsx("torusKnotGeometry",{args:[.5,.1,100,16]})})]})}const ve=n.createContext(null);function qe({children:a}){const r=n.useContext(ve);return r?we(e.jsx("group",{children:n.Children.map(a,c=>n.isValidElement(c)?n.cloneElement(c,{material:new be({color:"white"})}):null)}),r):null}class pe extends je{constructor(r,c,{pixelSize:f=8,maskScene:g}){super("PixelMaskEffect",`
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
      `,{uniforms:new Map([["maskTex",new O(null)],["maskDepthTex",new O(null)],["depthBias",new O(.005)],["pixelSize",new O(f)],["resolution",new O(new U)]])}),this.needsDepthTexture=!0,this.scene=r,this.camera=c,this.maskScene=g,this.maskTarget=new L(1,1,{depthBuffer:!0}),this.maskTarget.depthTexture=new me,this.maskTarget.depthTexture.type=Pe}update(r){const c=r.getSize(new U);this.uniforms.get("resolution").value.set(c.x,c.y),(this.maskTarget.width!==c.x||this.maskTarget.height!==c.y)&&this.maskTarget.setSize(c.x,c.y),r.setRenderTarget(this.maskTarget),r.clear(),r.render(this.maskScene,this.camera),r.setRenderTarget(null),this.uniforms.get("maskTex").value=this.maskTarget.texture,this.uniforms.get("maskDepthTex").value=this.maskTarget.depthTexture}}Se({PixelMaskEffectImpl:pe});function Ze({children:a,pixelSize:r=8}){const{scene:c,camera:f}=X(),g=n.useMemo(()=>new Te,[]),s=n.useMemo(()=>new pe(c,f,{pixelSize:r,maskScene:g}),[c,f,r,g]);return e.jsxs(ve.Provider,{value:g,children:[e.jsx(ze,{intensity:0,radius:.001}),e.jsx("primitive",{object:s}),a]})}function eo(){return ke("👾",{bgType:{label:"Background",options:{Environment:"environment",Color:"color"},value:"environment"},bgPreset:{label:"Preset",options:["apartment","city","dawn","forest","lobby","night","park","studio","sunset","warehouse"],value:"studio",render:a=>a("👾.bgType")==="environment"},bgBlur:{label:"Blur",value:.25,min:0,max:1,step:.05,render:a=>a("👾.bgType")==="environment"},bgColor:{label:"Color",value:"#111111",render:a=>a("👾.bgType")==="color"},pixelEffect:{label:"Effect",options:{Yours:"Yours",Mine:"Mine",Censor:"Censor","Voxel Screen":"VoxelScreen","Voxel Raymarch":"VoxelRaymarch","Voxel Instanced":"VoxelInstanced","Voxel Interior":"VoxelInterior"},value:"Censor"},effectShape:{label:"Effect Shape",options:{Plane:"Plane",TwoPanes:"TwoPanes",Cube:"Cube",Cubes:"Cubes",Torus:"Torus",Sphere:"Sphere",Knot:"Knot"},value:"TwoPanes"},pixelSize:{label:"Pixel Size",value:8,min:1,max:32,step:1},planeHeight:{label:"Plane Height",value:1,min:1,max:10,step:.25},planeWidth:{label:"Plane Width",value:5,min:1,max:10,step:.25},refraction:{label:"Refraction",value:0,min:0,max:.15,step:.005,render:a=>a("👾.pixelEffect")==="Censor"},voxelSize:{label:"Voxel Size",value:.25,min:.01,max:2,step:.001,render:a=>{const r=a("👾.pixelEffect");return r==="VoxelScreen"||r==="VoxelRaymarch"||r==="VoxelInstanced"||r==="VoxelInterior"}},voxelSteps:{label:"Voxel Steps",value:24,min:4,max:96,step:1,render:a=>a("👾.pixelEffect")==="VoxelRaymarch"},cornerRadius:{label:"Corner Radius",value:0,min:0,max:.49,step:.01,render:a=>a("👾.pixelEffect")==="VoxelInterior"},insideOnly:{label:"Inside Only",value:!1,render:a=>a("👾.pixelEffect")==="VoxelInterior"}},{collapsed:!0})}function mo(){const{bgType:a,bgPreset:r,bgBlur:c,bgColor:f,pixelEffect:g,effectShape:s,pixelSize:d,planeHeight:M,planeWidth:o,refraction:t,voxelSize:m,voxelSteps:l,cornerRadius:p,insideOnly:i}=eo(),v={Censor:"pixel",VoxelScreen:"voxelScreen",VoxelRaymarch:"voxelRaymarch",VoxelInstanced:"voxelInstanced",VoxelInterior:"voxelInterior"}[g]??null,w=g==="Yours"||g==="Mine";return e.jsxs(e.Fragment,{children:[e.jsx(Ve,{}),e.jsx(Ee,{enableDamping:!0,enablePan:!0,enableRotate:!0,enableZoom:!0}),e.jsx(Ue,{preset:r,background:a==="environment",blur:c}),a==="color"&&e.jsx("color",{attach:"background",args:[f]}),e.jsx(Re,{scale:10,position:[0,0,-1],rotation:[0,0,0]}),e.jsxs("mesh",{position:[0,0,1],children:[e.jsx("sphereGeometry",{args:[.25,32,32]}),e.jsx("meshPhysicalMaterial",{color:"hotpink"})]}),v&&e.jsx(Xe,{effectShape:s,pixelSize:d,refraction:t,planeWidth:o,planeHeight:M,voxelMode:v,voxelSize:m,voxelSteps:l,cornerRadius:p,insideOnly:i}),w&&e.jsxs(We,{multisampling:0,enableNormalPass:!0,children:[g==="Yours"&&e.jsx(Be,{granularity:d}),g==="Mine"&&e.jsx(Ze,{pixelSize:d,children:e.jsxs(qe,{children:[s==="Plane"&&e.jsx(Ge,{args:[o,M],children:e.jsx("meshBasicMaterial",{})}),s==="TwoPanes"&&e.jsxs(e.Fragment,{children:[e.jsxs("mesh",{position:[.5,.5,0],children:[e.jsx("planeGeometry",{args:[1,1]}),e.jsx("meshBasicMaterial",{})]}),e.jsxs("mesh",{position:[-.5,-.5,0],children:[e.jsx("planeGeometry",{args:[1,1]}),e.jsx("meshBasicMaterial",{})]})]}),s==="Cube"&&e.jsxs("mesh",{position:[0,0,0],children:[e.jsx("boxGeometry",{args:[1,1,1]}),e.jsx("meshBasicMaterial",{})]}),s==="Cubes"&&e.jsx(e.Fragment,{children:e.jsxs("mesh",{position:[0,0,1],children:[e.jsx("boxGeometry",{args:[1,1,1]}),e.jsx("meshBasicMaterial",{})]})}),s==="Torus"&&e.jsxs("mesh",{children:[e.jsx("torusGeometry",{args:[.5,.15,16,100]}),e.jsx("meshBasicMaterial",{})]}),s==="Sphere"&&e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[.4,32,32]}),e.jsx("meshBasicMaterial",{})]}),s==="Knot"&&e.jsxs("mesh",{children:[e.jsx("torusKnotGeometry",{args:[.5,.1,100,16]}),e.jsx("meshBasicMaterial",{})]})]})})]})]})}export{mo as default};
