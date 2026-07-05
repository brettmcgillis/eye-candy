import{r as n,m as q,W as F,x as U,q as _,V as b,_ as me,M as B,ac as ne,as as xe,aZ as he,n as ae,U as se,j as e,b2 as le,E as ye,B as ve,bn as Me,Q as be,ag as Ce,bd as we,a$ as Pe,ad as O,cb as Se,bh as Te,o as ke,a0 as je,aX as re}from"./index-DUAUQe-S.js";import{E as ze,I as De,d as We,V as Be}from"./index-CKFv84Uo.js";import{C as Re,R as Ve}from"./Record-CinK7FZS.js";import{M as Ie}from"./MeshBVH-DOXKMZaz.js";import{O as Ee}from"./OrbitControls-B45q6IBS.js";import{E as Ue}from"./Environment-BCnWFxBV.js";import{P as Ge}from"./shapes-Dojlv97f.js";import"./Gltf-Dh4t7ofw.js";import"./constants-BP0pTuTZ.js";import"./extends-CF3RwP-h.js";import"./EXRLoader-dYDSowXY.js";const Ne=`
  varying vec3 vViewNormal;

  void main() {
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,Le=`
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
`;function Ae({mode:a="voxelScreen",pixelSize:t=8,voxelSize:c=.25,voxelSteps:f=24,clipOffset:h=0,children:s,...g}){const M=n.useRef(),{gl:o,scene:r,camera:m}=q(),l=n.useMemo(()=>new F(1,1),[]),v=n.useMemo(()=>new F(1,1),[]),i=n.useMemo(()=>new U,[]),y=n.useMemo(()=>new _,[]),p=n.useMemo(()=>new b,[]),w=n.useMemo(()=>new b,[]),d=n.useMemo(()=>new b,[]),x=n.useMemo(()=>new me,[]),C=n.useMemo(()=>new B,[]),R={voxelScreen:1,voxelRaymarch:2,voxelInstanced:3},u=n.useMemo(()=>new ne({vertexShader:Ne,fragmentShader:Le,uniforms:{sceneTexture:{value:null},sceneDepthTexture:{value:null},fullSceneTexture:{value:null},fallbackColor:{value:new _(1,1,1)},resolution:{value:new U},pixelSize:{value:t},effectMode:{value:1},voxelWorldSize:{value:c},voxelSteps:{value:f},projectionMatrixInverse:{value:new B},viewMatrixInverse:{value:new B},viewProjectionMatrix:{value:new B},cameraWorldPos:{value:new b}},transparent:!1,depthWrite:!0}),[]);return n.useEffect(()=>{l.depthTexture=new xe(1,1),l.depthTexture.type=he},[l]),n.useEffect(()=>()=>{l.dispose(),v.dispose(),u.dispose()},[l,v,u]),ae(()=>{const z=M.current;if(!z)return;o.getDrawingBufferSize(i),(l.width!==i.x||l.height!==i.y)&&(l.setSize(i.x,i.y),v.setSize(i.x,i.y)),u.uniforms.pixelSize.value=t,u.uniforms.effectMode.value=R[a]??1,u.uniforms.voxelWorldSize.value=c,u.uniforms.voxelSteps.value=f,u.uniforms.resolution.value.copy(i),u.uniforms.projectionMatrixInverse.value.copy(m.projectionMatrixInverse),u.uniforms.viewMatrixInverse.value.copy(m.matrixWorld),C.multiplyMatrices(m.projectionMatrix,m.matrixWorldInverse),u.uniforms.viewProjectionMatrix.value.copy(C),m.getWorldPosition(d),u.uniforms.cameraWorldPos.value.copy(d),z.getWorldPosition(p),m.getWorldDirection(w),x.setFromNormalAndCoplanarPoint(w,p),x.constant+=h,z.visible=!1;const k=o.clippingPlanes,P=o.toneMapping;o.toneMapping=se;const D=o.getClearAlpha();o.getClearColor(y),r.background&&r.background.isColor?u.uniforms.fallbackColor.value.copy(r.background):u.uniforms.fallbackColor.value.setRGB(1,1,1);const S=o.getRenderTarget();o.setClearColor(y,D),o.clippingPlanes=[],o.setRenderTarget(v),o.clear(),o.render(r,m),o.setClearColor(0,0),o.clippingPlanes=[x],o.setRenderTarget(l),o.clear(),o.render(r,m),o.setRenderTarget(S),o.toneMapping=P,o.setClearColor(y,D),o.clippingPlanes=k,z.visible=!0,u.uniforms.sceneTexture.value=l.texture,u.uniforms.sceneDepthTexture.value=l.depthTexture,u.uniforms.fullSceneTexture.value=v.texture}),e.jsx("mesh",{ref:M,material:u,...g,children:s})}const Fe=`
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
`;function Qe({voxelSize:a=.25,maxInstances:t=4096,clipOffset:c=0,children:f,...h}){const s=n.useRef(),g=n.useRef(),M=n.useRef(),{gl:o,scene:r,camera:m}=q(),l=n.useMemo(()=>new F(1,1),[]),v=n.useMemo(()=>new F(1,1),[]),i=n.useMemo(()=>new le(1,1,1),[]),y=n.useMemo(()=>new U,[]),p=n.useMemo(()=>new _,[]),w=n.useMemo(()=>new b,[]),d=n.useMemo(()=>new b,[]),x=n.useMemo(()=>new b,[]),C=n.useMemo(()=>new me,[]),R=n.useMemo(()=>new B,[]),u=n.useMemo(()=>new ye,[]),z=n.useMemo(()=>new b,[]),k=n.useMemo(()=>new ne({vertexShader:Fe,fragmentShader:_e,uniforms:{clippedSceneTexture:{value:null},fullSceneTexture:{value:null},resolution:{value:new U},fallbackColor:{value:new _(1,1,1)},viewProjectionMatrix:{value:new B},cameraWorldPos:{value:new b}},transparent:!1,depthWrite:!0}),[]);return n.useEffect(()=>()=>{l.dispose(),v.dispose(),i.dispose(),k.dispose()},[l,v,i,k]),n.useLayoutEffect(()=>{const P=g.current,D=M.current;if(!P||!D||!P.geometry)return;P.geometry.computeBoundingBox();const S=P.geometry.boundingBox;if(!S)return;S.getSize(z);const V=Math.max(a,.02),I=Math.ceil(z.x/V)*Math.ceil(z.y/V)*Math.ceil(z.z/V),Z=I>t?Math.ceil(Math.cbrt(I/t)):1,j=V*Z,G=j*.9;let E=0;for(let N=S.min.x+j*.5;N<=S.max.x;N+=j)for(let L=S.min.y+j*.5;L<=S.max.y;L+=j)for(let A=S.min.z+j*.5;A<=S.max.z&&!(E>=t);A+=j)u.position.set(N,L,A),u.scale.set(G,G,G),u.rotation.set(0,0,0),u.updateMatrix(),D.setMatrixAt(E,u.matrix),E+=1;D.count=E,D.instanceMatrix.needsUpdate=!0},[a,t,u,z]),ae(()=>{const P=s.current;if(!P)return;o.getDrawingBufferSize(y),(l.width!==y.x||l.height!==y.y)&&(l.setSize(y.x,y.y),v.setSize(y.x,y.y)),k.uniforms.resolution.value.copy(y),R.multiplyMatrices(m.projectionMatrix,m.matrixWorldInverse),k.uniforms.viewProjectionMatrix.value.copy(R),m.getWorldPosition(x),k.uniforms.cameraWorldPos.value.copy(x),P.getWorldPosition(w),m.getWorldDirection(d),C.setFromNormalAndCoplanarPoint(d,w),C.constant+=c;const D=o.getRenderTarget(),S=o.clippingPlanes,V=o.toneMapping,I=o.getClearAlpha();o.getClearColor(p),o.toneMapping=se,r.background&&r.background.isColor?k.uniforms.fallbackColor.value.copy(r.background):k.uniforms.fallbackColor.value.setRGB(1,1,1),P.visible=!1,o.setClearColor(p,I),o.clippingPlanes=[],o.setRenderTarget(v),o.clear(),o.render(r,m),o.setClearColor(0,0),o.clippingPlanes=[C],o.setRenderTarget(l),o.clear(),o.render(r,m),o.setRenderTarget(D),o.clippingPlanes=S,o.toneMapping=V,o.setClearColor(p,I),P.visible=!0,k.uniforms.clippedSceneTexture.value=l.texture,k.uniforms.fullSceneTexture.value=v.texture}),e.jsxs("group",{ref:s,...h,children:[e.jsx("mesh",{ref:g,visible:!1,children:f}),e.jsx("instancedMesh",{ref:M,args:[i,k,t],frustumCulled:!1})]})}const H=new b;function W(a,t,c,f,h,s){const g=2*Math.PI*h/4,M=Math.max(s-2*h,0),o=Math.PI/4;H.copy(t),H[f]=0,H.normalize();const r=.5*g/(g+M),m=1-H.angleTo(a)/o;return Math.sign(H[c])===1?m*r:M/(g+M)+r+r*(1-m)}class ie extends le{constructor(t=1,c=1,f=1,h=2,s=.1){const g=h*2+1;if(s=Math.min(t/2,c/2,f/2,s),super(1,1,1,g,g,g),this.type="RoundedBoxGeometry",this.parameters={width:t,height:c,depth:f,segments:h,radius:s},g===1)return;const M=this.toNonIndexed();this.index=null,this.attributes.position=M.attributes.position,this.attributes.normal=M.attributes.normal,this.attributes.uv=M.attributes.uv;const o=new b,r=new b,m=new b(t,c,f).divideScalar(2).subScalar(s),l=this.attributes.position.array,v=this.attributes.normal.array,i=this.attributes.uv.array,y=l.length/6,p=new b,w=.5/g;for(let d=0,x=0;d<l.length;d+=3,x+=2)switch(o.fromArray(l,d),r.copy(o),r.x-=Math.sign(r.x)*w,r.y-=Math.sign(r.y)*w,r.z-=Math.sign(r.z)*w,r.normalize(),l[d+0]=m.x*Math.sign(o.x)+r.x*s,l[d+1]=m.y*Math.sign(o.y)+r.y*s,l[d+2]=m.z*Math.sign(o.z)+r.z*s,v[d+0]=r.x,v[d+1]=r.y,v[d+2]=r.z,Math.floor(d/y)){case 0:p.set(1,0,0),i[x+0]=W(p,r,"z","y",s,f),i[x+1]=1-W(p,r,"y","z",s,c);break;case 1:p.set(-1,0,0),i[x+0]=1-W(p,r,"z","y",s,f),i[x+1]=1-W(p,r,"y","z",s,c);break;case 2:p.set(0,1,0),i[x+0]=1-W(p,r,"x","z",s,t),i[x+1]=W(p,r,"z","x",s,f);break;case 3:p.set(0,-1,0),i[x+0]=1-W(p,r,"x","z",s,t),i[x+1]=1-W(p,r,"z","x",s,f);break;case 4:p.set(0,0,1),i[x+0]=1-W(p,r,"x","y",s,t),i[x+1]=1-W(p,r,"y","x",s,c);break;case 5:p.set(0,0,-1),i[x+0]=W(p,r,"x","y",s,t),i[x+1]=1-W(p,r,"y","x",s,c);break}}static fromJSON(t){return new ie(t.width,t.height,t.depth,t.segments,t.radius)}}const Oe=`
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
`,Ke=new ve(new b(-.5,-.5,-.5),new b(.5,.5,.5)),ue=new WeakMap;function $e(a){let t=ue.get(a);return t||(t=new Ie(a),ue.set(a,t)),t}function Ye(a,t){let c=t;for(;c;){if(c===a)return!0;c=c.parent}return!1}function Xe({voxelSize:a=.25,cornerRadius:t=0,insideOnly:c=!1,maxInstances:f=8192,children:h,...s}){const g=n.useRef(),M=n.useRef(),o=n.useRef(),{gl:r,scene:m,camera:l}=q(),v=n.useMemo(()=>new F(1,1),[]),i=n.useMemo(()=>new U,[]),y=n.useMemo(()=>new _,[]),p=n.useMemo(()=>new B,[]),w=n.useMemo(()=>t>0?new ie(1,1,1,4,Math.min(t,.49)):new le(1,1,1),[t]),d=n.useMemo(()=>new ne({vertexShader:Oe,fragmentShader:He,uniforms:{fullSceneTexture:{value:null},resolution:{value:new U},fallbackColor:{value:new _(1,1,1)},viewProjectionMatrix:{value:new B}},transparent:!1,depthWrite:!0}),[]);return n.useEffect(()=>{o.current&&(o.current.geometry=w)},[w]),n.useEffect(()=>()=>{v.dispose(),w.dispose(),d.dispose()},[v,w,d]),n.useLayoutEffect(()=>{const x=M.current,C=o.current,R=g.current;if(!x||!C||!R||!x.geometry)return;x.updateWorldMatrix(!0,!1),x.geometry.computeBoundingBox();const u=x.geometry.boundingBox;if(!u)return;const z=u.clone().applyMatrix4(x.matrixWorld),k=new ve,P=[];if(m.traverse(T=>{if(!T.isMesh||!T.visible||!T.geometry||!T.geometry.attributes?.position||Ye(R,T)||(T.geometry.boundingBox||T.geometry.computeBoundingBox(),!T.geometry.boundingBox)||(k.copy(T.geometry.boundingBox).applyMatrix4(T.matrixWorld),!k.intersectsBox(z)))return;const Q=$e(T.geometry);P.push({bvh:Q,worldToLocal:new B().copy(T.matrixWorld).invert()})}),P.length===0){C.count=0,C.instanceMatrix.needsUpdate=!0;return}const D=Math.max(a,.01),S=u.getSize(new b),V=Math.ceil(S.x/D)*Math.ceil(S.y/D)*Math.ceil(S.z/D),I=Math.max(f*4,2e4),Z=V>I?Math.ceil(Math.cbrt(V/I)):1,j=D*Z,G=new b,E=new b,N=new B,L=new B,A=new B,de=new be,ge=new b().setScalar(j),K=new Me;K.direction.set(0,0,1);let $=0,J=!1;for(let T=u.min.x+j*.5;T<=u.max.x;T+=j){for(let Q=u.min.y+j*.5;Q<=u.max.y;Q+=j){for(let ee=u.min.z+j*.5;ee<=u.max.z;ee+=j){if($>=f){J=!0;break}G.set(T,Q,ee),N.compose(G,de,ge),L.multiplyMatrices(x.matrixWorld,N),E.copy(G),x.localToWorld(E);let Y=!1,oe=!1;for(let te=0;te<P.length;te+=1){const X=P[te];if(A.multiplyMatrices(X.worldToLocal,L),X.bvh.intersectsBox(Ke,A)&&(Y=!0),!Y||c){K.origin.copy(E).applyMatrix4(X.worldToLocal);const ce=X.bvh.raycastFirst(K,Ce);ce&&ce.face.normal.dot(K.direction)>0&&(oe=!0)}if(Y&&oe)break}(Y&&!c||oe)&&(C.setMatrixAt($,N),$+=1)}if(J)break}if(J)break}C.count=$,C.instanceMatrix.needsUpdate=!0},[a,c,f,m]),ae(()=>{const x=g.current;if(!x)return;r.getDrawingBufferSize(i),(v.width!==i.x||v.height!==i.y)&&v.setSize(i.x,i.y),d.uniforms.resolution.value.copy(i),p.multiplyMatrices(l.projectionMatrix,l.matrixWorldInverse),d.uniforms.viewProjectionMatrix.value.copy(p);const C=r.getRenderTarget(),R=r.toneMapping,u=r.getClearAlpha();r.getClearColor(y),r.toneMapping=se,m.background&&m.background.isColor?d.uniforms.fallbackColor.value.copy(m.background):d.uniforms.fallbackColor.value.setRGB(1,1,1),x.visible=!1,r.setClearColor(y,u),r.setRenderTarget(v),r.clear(),r.render(m,l),r.setRenderTarget(C),r.toneMapping=R,r.setClearColor(y,u),x.visible=!0,d.uniforms.fullSceneTexture.value=v.texture}),e.jsxs("group",{ref:g,...s,children:[e.jsx("mesh",{ref:M,visible:!1,children:h}),e.jsx("instancedMesh",{ref:o,args:[w,d,f],frustumCulled:!1})]})}function qe({effectShape:a,pixelSize:t,refraction:c,planeWidth:f,planeHeight:h,voxelMode:s,voxelSize:g,voxelSteps:M,cornerRadius:o,insideOnly:r}){const m=s!=="pixel";let l=Re;m&&(s==="voxelInstanced"?l=Qe:s==="voxelInterior"?l=Xe:l=Ae);let v={};m&&(s==="voxelInstanced"?v={voxelSize:g}:s==="voxelInterior"?v={voxelSize:g,cornerRadius:o,insideOnly:r}:v={mode:s,voxelSize:g,voxelSteps:M});const i=m?{pixelSize:t,...v}:{pixelSize:t,refraction:c};return e.jsxs(e.Fragment,{children:[a==="Plane"&&e.jsx(l,{...i,children:e.jsx("planeGeometry",{args:[f,h]})}),a==="TwoPanes"&&e.jsxs(e.Fragment,{children:[e.jsx(l,{...i,position:[.5,.5,0],children:e.jsx("planeGeometry",{args:[1,1]})}),e.jsx(l,{...i,position:[-.5,-.5,0],children:e.jsx("planeGeometry",{args:[1,1]})})]}),a==="Cube"&&e.jsx(l,{...i,children:e.jsx("boxGeometry",{args:[1,1,1]})}),a==="Cubes"&&e.jsx(l,{...i,clipOffset:.5,position:[0,0,1],children:e.jsx("boxGeometry",{args:[1,1,1]})}),a==="Torus"&&e.jsx(l,{...i,children:e.jsx("torusGeometry",{args:[.5,.15,16,100]})}),a==="Sphere"&&e.jsx(l,{...i,children:e.jsx("sphereGeometry",{args:[.4,32,32]})}),a==="Knot"&&e.jsx(l,{...i,children:e.jsx("torusKnotGeometry",{args:[.5,.1,100,16]})})]})}const pe=n.createContext(null);function Ze({children:a}){const t=n.useContext(pe);return t?we(e.jsx("group",{children:n.Children.map(a,c=>n.isValidElement(c)?n.cloneElement(c,{material:new Pe({color:"white"})}):null)}),t):null}class fe extends ze{constructor(t,c,{pixelSize:f=8,maskScene:h}){super("PixelMaskEffect",`
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
      `,{uniforms:new Map([["maskTex",new O(null)],["maskDepthTex",new O(null)],["depthBias",new O(.005)],["pixelSize",new O(f)],["resolution",new O(new U)]])}),this.needsDepthTexture=!0,this.scene=t,this.camera=c,this.maskScene=h,this.maskTarget=new F(1,1,{depthBuffer:!0}),this.maskTarget.depthTexture=new xe,this.maskTarget.depthTexture.type=Se}update(t){const c=t.getSize(new U);this.uniforms.get("resolution").value.set(c.x,c.y),(this.maskTarget.width!==c.x||this.maskTarget.height!==c.y)&&this.maskTarget.setSize(c.x,c.y),t.setRenderTarget(this.maskTarget),t.clear(),t.render(this.maskScene,this.camera),t.setRenderTarget(null),this.uniforms.get("maskTex").value=this.maskTarget.texture,this.uniforms.get("maskDepthTex").value=this.maskTarget.depthTexture}}ke({PixelMaskEffectImpl:fe});function Je({children:a,pixelSize:t=8}){const{scene:c,camera:f}=q(),h=n.useMemo(()=>new Te,[]),s=n.useMemo(()=>new fe(c,f,{pixelSize:t,maskScene:h}),[c,f,t,h]);return e.jsxs(pe.Provider,{value:h,children:[e.jsx(De,{intensity:0,radius:.001}),e.jsx("primitive",{object:s}),a]})}function eo(){return je("👾",{bgType:{label:"Background",options:{Environment:"environment",Color:"color"},value:"environment"},bgPreset:{label:"Preset",options:["apartment","city","dawn","forest","lobby","night","park","studio","sunset","warehouse"],value:"studio",render:a=>a("👾.bgType")==="environment"},bgBlur:{label:"Blur",value:.25,min:0,max:1,step:.05,render:a=>a("👾.bgType")==="environment"},bgColor:{label:"Color",value:"#111111",render:a=>a("👾.bgType")==="color"},"Lighting Rig":re({"Point Light":re({plPosition:{label:"Position",value:{x:3,y:3,z:5}},plDecay:{label:"Decay",value:0,min:-10,max:10,step:.1},plDistance:{label:"Distance",value:-1,min:-10,max:10,step:.1},plIntensity:{label:"Intensity",value:.8,min:0,max:10,step:.1},plCastShadow:{label:"Cast Shadow",value:!0}},{collapsed:!0}),"Ambient Light":re({ambientLightIntensity:{label:"Intensity",value:0,min:0,max:1,step:.1}},{collapsed:!0})},{collapsed:!0}),pixelEffect:{label:"Effect",options:{Yours:"Yours",Mine:"Mine",Censor:"Censor","Voxel Screen":"VoxelScreen","Voxel Raymarch":"VoxelRaymarch","Voxel Instanced":"VoxelInstanced","Voxel Interior":"VoxelInterior"},value:"Censor"},effectShape:{label:"Effect Shape",options:{Plane:"Plane",TwoPanes:"TwoPanes",Cube:"Cube",Cubes:"Cubes",Torus:"Torus",Sphere:"Sphere",Knot:"Knot"},value:"TwoPanes"},pixelSize:{label:"Pixel Size",value:8,min:1,max:32,step:1},planeHeight:{label:"Plane Height",value:1,min:1,max:10,step:.25},planeWidth:{label:"Plane Width",value:5,min:1,max:10,step:.25},refraction:{label:"Refraction",value:0,min:0,max:.15,step:.005,render:a=>a("👾.pixelEffect")==="Censor"},voxelSize:{label:"Voxel Size",value:.25,min:.01,max:2,step:.001,render:a=>{const t=a("👾.pixelEffect");return t==="VoxelScreen"||t==="VoxelRaymarch"||t==="VoxelInstanced"||t==="VoxelInterior"}},voxelSteps:{label:"Voxel Steps",value:24,min:4,max:96,step:1,render:a=>a("👾.pixelEffect")==="VoxelRaymarch"},cornerRadius:{label:"Corner Radius",value:0,min:0,max:.49,step:.01,render:a=>a("👾.pixelEffect")==="VoxelInterior"},insideOnly:{label:"Inside Only",value:!1,render:a=>a("👾.pixelEffect")==="VoxelInterior"}},{collapsed:!0})}function xo(){const{bgType:a,bgPreset:t,bgBlur:c,bgColor:f,pixelEffect:h,effectShape:s,pixelSize:g,planeHeight:M,planeWidth:o,refraction:r,voxelSize:m,voxelSteps:l,cornerRadius:v,insideOnly:i,plPosition:y,plDecay:p,plDistance:w,plIntensity:d,plCastShadow:x,ambientLightIntensity:C}=eo(),u={Censor:"pixel",VoxelScreen:"voxelScreen",VoxelRaymarch:"voxelRaymarch",VoxelInstanced:"voxelInstanced",VoxelInterior:"voxelInterior"}[h]??null,z=h==="Yours"||h==="Mine";return e.jsxs(e.Fragment,{children:[e.jsxs("group",{children:[e.jsx("ambientLight",{intensity:C}),e.jsx("pointLight",{position:[y.x,y.y,y.z],decay:p,distance:w,intensity:d,castShadow:x})]}),e.jsx(Ee,{enableDamping:!0,enablePan:!0,enableRotate:!0,enableZoom:!0}),e.jsx(Ue,{preset:t,background:a==="environment",blur:c}),a==="color"&&e.jsx("color",{attach:"background",args:[f]}),e.jsx(Ve,{scale:10,position:[0,0,-1],rotation:[0,0,0]}),e.jsxs("mesh",{position:[0,0,1],children:[e.jsx("sphereGeometry",{args:[.25,32,32]}),e.jsx("meshPhysicalMaterial",{color:"hotpink"})]}),u&&e.jsx(qe,{effectShape:s,pixelSize:g,refraction:r,planeWidth:o,planeHeight:M,voxelMode:u,voxelSize:m,voxelSteps:l,cornerRadius:v,insideOnly:i}),z&&e.jsxs(We,{multisampling:0,enableNormalPass:!0,children:[h==="Yours"&&e.jsx(Be,{granularity:g}),h==="Mine"&&e.jsx(Je,{pixelSize:g,children:e.jsxs(Ze,{children:[s==="Plane"&&e.jsx(Ge,{args:[o,M],children:e.jsx("meshBasicMaterial",{})}),s==="TwoPanes"&&e.jsxs(e.Fragment,{children:[e.jsxs("mesh",{position:[.5,.5,0],children:[e.jsx("planeGeometry",{args:[1,1]}),e.jsx("meshBasicMaterial",{})]}),e.jsxs("mesh",{position:[-.5,-.5,0],children:[e.jsx("planeGeometry",{args:[1,1]}),e.jsx("meshBasicMaterial",{})]})]}),s==="Cube"&&e.jsxs("mesh",{position:[0,0,0],children:[e.jsx("boxGeometry",{args:[1,1,1]}),e.jsx("meshBasicMaterial",{})]}),s==="Cubes"&&e.jsx(e.Fragment,{children:e.jsxs("mesh",{position:[0,0,1],children:[e.jsx("boxGeometry",{args:[1,1,1]}),e.jsx("meshBasicMaterial",{})]})}),s==="Torus"&&e.jsxs("mesh",{children:[e.jsx("torusGeometry",{args:[.5,.15,16,100]}),e.jsx("meshBasicMaterial",{})]}),s==="Sphere"&&e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[.4,32,32]}),e.jsx("meshBasicMaterial",{})]}),s==="Knot"&&e.jsxs("mesh",{children:[e.jsx("torusKnotGeometry",{args:[.5,.1,100,16]}),e.jsx("meshBasicMaterial",{})]})]})})]})]})}export{xo as default};
