import{C as be,az as on,aQ as rn,ak as an,a3 as pt,M as jt,h as Qe,r as o,j as _,D as Se,a as ge,b0 as sn,V as D,X as Ot,aH as Je,a5 as Ht,a8 as ht,l as ve,bB as xt,Q as ct,bD as Re,dl as un,b3 as ln,c3 as cn,bs as Me,J as bt,aa as me,I as dn,u as fn,T as mn,aO as vn,Z as dt,aD as Te,b as pn,cu as hn,A as xn,bN as bn,cv as gn,ag as yn}from"./index-DQZ6GwWS.js";import{u as Ze}from"./Texture-B4g0qqp1.js";import{u as y,f as q,E as ft,G as fe,ap as Mn,j as ce,d as he,N as mt,J as Pe,l as Ee,m as ne,C as Sn,c as xe,x as An,H as $e,K as Ne,D as et,bk as Gt,aW as qt,v as Xt,ax as pe,bv as kn,F as tt,a7 as nt,S as Qt,bc as _e}from"./three.tsl-BQ1Hwkua.js";import{c as wn}from"./SkeletonUtils-BCVmgslc.js";import{u as $t}from"./useDracoGltf-CfOSgOji.js";const De=Object.freeze({shell:"shell",strand:"strand"}),Cn=24,Rn=24e3,In=1e5;function Dn(e){return e&&typeof e=="object"&&Object.prototype.hasOwnProperty.call(e,"current")?e.current:e}function ut(e){return Array.isArray(e)?e[0]??null:e??null}function gt(e){const t=Dn(e);if(!t)return null;if(t.isMesh||t.isSkinnedMesh)return t;let a=null;return t.traverse?.(l=>{!a&&(l.isMesh||l.isSkinnedMesh)&&(a=l)}),a}function Tn(e,t="#ffffff"){const a=new be(t);return e?.color?.isColor?(a.copy(e.color),a):(e?.color!==void 0&&a.set(e.color),a)}function Pn(e){return ut(e)?.map??null}function En(e,t=1){if(!e)return t;e.boundingSphere||e.computeBoundingSphere();const a=e.boundingSphere?.radius;return!Number.isFinite(a)||a<=1e-6?t:a}function ot(e=[1,0]){const t=new Qe(Number.isFinite(e?.[0])?e[0]:1,Number.isFinite(e?.[1])?e[1]:0);return t.lengthSq()<=1e-6&&t.set(1,0),t.normalize()}function Nn(e,t){!e||!t||(e.position.copy(t.position),e.quaternion.copy(t.quaternion),e.scale.copy(t.scale))}function yt(e=1){let t=Math.floor(e)%2147483647;return t<=0&&(t+=2147483646),()=>(t=t*16807%2147483647,(t-1)/2147483646)}function We(e="#ffffff"){const t=new be(e),a=new Uint8Array([Math.round(t.r*255),Math.round(t.g*255),Math.round(t.b*255),255]),l=new on(a,1,1,rn);return l.colorSpace=an,l.generateMipmaps=!1,l.magFilter=pt,l.minFilter=pt,l.needsUpdate=!0,l}function Zt(e=18){return jt.clamp(Math.round(e),1,Cn)}function Yt(e=5e3,t=!1){return jt.clamp(Math.round(e),1,t?In:Rn)}const rt=o.forwardRef(function({sourceMesh:t,geometry:a=null,material:l=null,children:s=null,...r},c){const w=o.useRef();return o.useImperativeHandle(c,()=>w.current),o.useLayoutEffect(()=>{!w.current||!t?.skeleton||!t?.bindMatrix||(w.current.bindMode=t.bindMode,w.current.bind(t.skeleton,t.bindMatrix))},[t]),t?.skeleton?_.jsx("skinnedMesh",{ref:w,geometry:a||t.geometry,material:l,skeleton:t.skeleton,...r,children:s}):null});function Fe({onPointerDown:e,onPointerLeave:t,onPointerMove:a,showInteractionSurface:l=!1,source:s}){const r=l,c={color:r?"#39ff96":"#ffffff",depthTest:!r,depthWrite:!1,opacity:r?.95:0,polygonOffset:!1,polygonOffsetFactor:0,polygonOffsetUnits:0,side:Se,transparent:!0,wireframe:r};return s.isSkinnedMesh&&s.mesh?_.jsx(rt,{frustumCulled:!1,onPointerDown:e,onPointerLeave:t,onPointerMove:a,sourceMesh:s.mesh,children:_.jsx("meshBasicMaterial",{...c})}):_.jsx("mesh",{geometry:s.geometry,onPointerDown:e,onPointerLeave:t,onPointerMove:a,children:_.jsx("meshBasicMaterial",{...c})})}const Ue=o.forwardRef(function({children:t,source:a,...l},s){const r=o.useRef();o.useImperativeHandle(s,()=>r.current),ge(()=>{a?.mesh&&r.current&&Nn(r.current,a.mesh)});const c=o.useMemo(()=>_.jsx("group",{ref:r,...l,children:t}),[t,l]);return a?.mesh?.parent?sn(c,a.mesh.parent):c}),Mt=[.6,.6,.6,1],St=[1,1,1,0],Wn="/textures/fur/uneven-alpha.png";function At(){return null}const Fn=`
precision highp float;

#include <common>
#include <uv_pars_vertex>
#include <skinning_pars_vertex>

uniform float uLayerIndex;
uniform float uLayerThickness;
uniform float uLayersCount;
uniform vec3 uColorStart;
uniform vec3 uColorEnd;
uniform float uAlphaStart;
uniform float uAlphaEnd;
uniform float uTime;
uniform float uWaveScale;
uniform float uStiffness;
uniform vec3 uInteractorPos;
uniform vec3 uInteractorDir;
uniform vec3 uInteractorNormal;
uniform float uInteractorRadius;
uniform float uInteractorStrength;
uniform float uInteractorEnabled;

varying vec2 vTexCoord0;
varying vec4 vLayerColor;

const float RANDOM_COEFF_1 = 0.1376;
const float RANDOM_COEFF_2 = 0.3726;
const float RANDOM_COEFF_3 = 0.2546;

void main() {
  #include <uv_vertex>

  float furOffset = (uLayerIndex + 1.0) * uLayerThickness;
  float layerCoeff = uLayerIndex / max(uLayersCount, 1.0);
  vec3 basePosition = position;
  vec3 furPosition = position + normal * furOffset;
  vec3 shellNormal = normalize(normal);
  float timePi2 = uTime * PI2;
  float waveScaleFinal = uWaveScale * pow(layerCoeff, uStiffness);

  furPosition.x += sin(
    timePi2 + ((position.x + position.y + position.z) * RANDOM_COEFF_1)
  ) * waveScaleFinal;
  furPosition.y += cos(
    timePi2 + ((position.x - position.y + position.z) * RANDOM_COEFF_2)
  ) * waveScaleFinal;
  furPosition.z += sin(
    timePi2 + ((position.x + position.y - position.z) * RANDOM_COEFF_3)
  ) * waveScaleFinal;

  #ifdef USE_SKINNING
    mat4 boneMatX = getBoneMatrix(skinIndex.x);
    mat4 boneMatY = getBoneMatrix(skinIndex.y);
    mat4 boneMatZ = getBoneMatrix(skinIndex.z);
    mat4 boneMatW = getBoneMatrix(skinIndex.w);
    vec4 baseSkinVertex = bindMatrix * vec4(basePosition, 1.0);
    vec4 furSkinVertex = bindMatrix * vec4(furPosition, 1.0);
    vec4 skinnedBase = vec4(0.0);
    vec4 skinnedFur = vec4(0.0);
    skinnedBase += boneMatX * baseSkinVertex * skinWeight.x;
    skinnedBase += boneMatY * baseSkinVertex * skinWeight.y;
    skinnedBase += boneMatZ * baseSkinVertex * skinWeight.z;
    skinnedBase += boneMatW * baseSkinVertex * skinWeight.w;
    skinnedFur += boneMatX * furSkinVertex * skinWeight.x;
    skinnedFur += boneMatY * furSkinVertex * skinWeight.y;
    skinnedFur += boneMatZ * furSkinVertex * skinWeight.z;
    skinnedFur += boneMatW * furSkinVertex * skinWeight.w;
    basePosition = (bindMatrixInverse * skinnedBase).xyz;
    furPosition = (bindMatrixInverse * skinnedFur).xyz;

    mat4 skinMatrix = mat4(0.0);
    skinMatrix += skinWeight.x * boneMatX;
    skinMatrix += skinWeight.y * boneMatY;
    skinMatrix += skinWeight.z * boneMatZ;
    skinMatrix += skinWeight.w * boneMatW;
    skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
    shellNormal = vec4(skinMatrix * vec4(shellNormal, 0.0)).xyz;
  #endif

  shellNormal = normalize(shellNormal);
  vec3 interactionNormal = normalize(uInteractorNormal);

  vec3 interactionDelta = furPosition - uInteractorPos;
  float shellDepth = dot(interactionDelta, interactionNormal);
  vec3 tangentDelta =
    interactionDelta - interactionNormal * shellDepth;
  float tangentDistance = length(tangentDelta);
  vec3 tangentDirection = tangentDelta / max(tangentDistance, 0.00001);
  vec3 brushDelta =
    uInteractorDir - interactionNormal * dot(uInteractorDir, interactionNormal);
  float brushDeltaLength = length(brushDelta);
  vec3 brushDirection = mix(
    tangentDirection,
    brushDelta / max(brushDeltaLength, 0.00001),
    step(0.0001, brushDeltaLength)
  );
  float depthTolerance = max(uLayerThickness * 2.0, uInteractorRadius * 0.08);
  float surfaceMask =
    1.0 -
    smoothstep(depthTolerance, depthTolerance * 2.5, abs(shellDepth - furOffset));
  float compressionWeight = mix(1.0, 0.45, layerCoeff);
  float bendWeight = mix(0.35, 1.0, layerCoeff);
  float interaction =
    (1.0 - smoothstep(0.0, uInteractorRadius, tangentDistance)) *
    surfaceMask *
    uInteractorStrength *
    uInteractorEnabled;
  float flatten = clamp(interaction * compressionWeight * 0.32, 0.0, 0.6);
  vec3 transformed = furPosition + brushDirection * interaction * bendWeight * 0.85;

  transformed = mix(transformed, basePosition, flatten);
  transformed -= shellNormal * interaction * compressionWeight * 0.08;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  vTexCoord0 = uv;
  vLayerColor = vec4(
    mix(uColorStart, uColorEnd, layerCoeff),
    mix(uAlphaStart, uAlphaEnd, layerCoeff)
  );
}
`,Un=`
precision highp float;

uniform vec3 uBaseColor;
uniform sampler2D uSourceMap;
uniform sampler2D uAlphaMap;
uniform float uUseSourceMap;

varying vec2 vTexCoord0;
varying vec4 vLayerColor;

void main() {
  vec4 diffuseColor = vec4(uBaseColor, 1.0);

  if (uUseSourceMap > 0.5) {
    diffuseColor *= texture2D(uSourceMap, vTexCoord0);
  }

  float alphaColor = texture2D(uAlphaMap, vTexCoord0).r;
  vec4 furColor = diffuseColor * vLayerColor;
  furColor.a *= alphaColor;

  if (furColor.a <= 0.001) {
    discard;
  }

  gl_FragColor = furColor;
}
`;function kt(e,t){const a=Array.isArray(e)?e:t;return{alpha:a[3]??t[3],color:new be(a[0],a[1],a[2])}}function zn({alphaMap:e,alphaEnd:t,alphaStart:a,baseColor:l,colorEnd:s,colorStart:r,fallbackTexture:c,layerIndex:w,layerThickness:V,layersCount:X,source:j,interactionRadius:B,interactionStrength:u,stiffness:U,waveScale:z}){const A=new Ht({depthWrite:!1,fragmentShader:Un,side:Se,transparent:!0,uniforms:{uAlphaEnd:{value:t},uAlphaMap:{value:e||c},uAlphaStart:{value:a},uBaseColor:{value:l.clone()},uColorEnd:{value:s.clone()},uColorStart:{value:r.clone()},uInteractorEnabled:{value:0},uInteractorDir:{value:new D(1,0,0)},uInteractorNormal:{value:new D(0,1,0)},uInteractorPos:{value:new D(1e3,1e3,1e3)},uInteractorRadius:{value:B},uInteractorStrength:{value:u},uLayerIndex:{value:w},uLayerThickness:{value:V},uLayersCount:{value:X},uSourceMap:{value:j.map||c},uStiffness:{value:U},uTime:{value:0},uUseSourceMap:{value:j.map?1:0},uWaveScale:{value:z}},vertexShader:Fn});return A.skinning=j.isSkinnedMesh,A}function Bn({source:e,layers:t=null,shellCount:a=20,thickness:l=null,shellSpacing:s=null,waveScale:r=.06,stiffness:c=2.75,startColor:w=Mt,endColor:V=St,alphaTexturePath:X=Wn,rootColor:j=null,interactive:B=!1,interactionRadius:u=.18,interactionStrength:U=1.2,showInteractionSurface:z=!1,...A}){const P=o.useRef(),L=o.useRef(new D),b=o.useRef(new D(0,1,0)),T=o.useRef(new D),W=o.useRef(new D(1,0,0)),M=o.useRef(),p=o.useMemo(()=>We(),[]),h=Ze(X),E=B||z,S=o.useMemo(()=>Zt(t??a),[t,a]),d=o.useMemo(()=>{const m=e.baseColor.clone();return j&&m.set(j),m},[j,e.baseColor]),O=o.useMemo(()=>kt(w,Mt),[w]),g=o.useMemo(()=>kt(V,St),[V]),H=l??s??.018,N=u*(e.radius||1),x=r,I=N,n=o.useMemo(()=>Array.from({length:S},(m,R)=>zn({alphaMap:h,alphaEnd:g.alpha,alphaStart:O.alpha,baseColor:d,colorEnd:g.color,colorStart:O.color,fallbackTexture:p,interactionRadius:N,interactionStrength:U,layerIndex:R,layerThickness:H,layersCount:S,source:e,stiffness:c,waveScale:x})),[h,p,d,g.alpha,g.color,N,U,S,H,O.alpha,O.color,x,e,c]);o.useEffect(()=>{h&&(h.colorSpace=Ot,h.wrapS=Je,h.wrapT=Je,h.needsUpdate=!0)},[h]),o.useEffect(()=>()=>{p.dispose()},[p]),o.useEffect(()=>()=>{n.forEach(m=>m.dispose())},[n]),o.useEffect(()=>{n.forEach((m,R)=>{const{uniforms:i}=m;i.uAlphaEnd.value=g.alpha,i.uAlphaMap.value=h||p,i.uAlphaStart.value=O.alpha,i.uBaseColor.value.copy(d),i.uColorEnd.value.copy(g.color),i.uColorStart.value.copy(O.color),i.uInteractorRadius.value=N,i.uInteractorStrength.value=U,i.uLayerIndex.value=R,i.uLayerThickness.value=H,i.uLayersCount.value=S,i.uSourceMap.value=e.map||p,i.uStiffness.value=c,i.uUseSourceMap.value=e.map?1:0,i.uWaveScale.value=x})},[h,p,n,d,g.alpha,g.color,N,U,S,H,O.alpha,O.color,x,e.map,c]);const f=o.useCallback(()=>{!M.current||!z||(M.current.visible=!0,M.current.position.copy(L.current))},[z]),Q=o.useCallback(m=>{if(!B||!P.current)return;m.stopPropagation(),L.current.copy(m.point),P.current.worldToLocal(L.current),m.face?.normal&&b.current.copy(m.face.normal).normalize();const R=new D().subVectors(L.current,T.current);R.lengthSq()>1e-8&&W.current.copy(R.normalize()),T.current.copy(L.current),n.forEach(i=>{const k=i.uniforms;k.uInteractorEnabled.value=1,k.uInteractorDir.value.copy(W.current),k.uInteractorNormal.value.copy(b.current),k.uInteractorPos.value.copy(L.current)}),f()},[B,n,f]),C=o.useCallback(()=>{n.forEach(m=>{const R=m.uniforms;R.uInteractorEnabled.value=0,R.uInteractorDir.value.set(1,0,0),R.uInteractorNormal.value.set(0,1,0)}),M.current&&(M.current.visible=!1)},[n]);return o.useEffect(()=>{M.current&&(M.current.visible=!1)},[z]),ge((m,R)=>{n.forEach(i=>{const k=i.uniforms;k.uTime.value+=R})}),_.jsxs(Ue,{ref:P,source:e,...A,children:[n.map((m,R)=>e.isSkinnedMesh&&e.mesh?_.jsx(rt,{frustumCulled:!1,material:m,raycast:At,renderOrder:20+R,sourceMesh:e.mesh},m.uuid):_.jsx("mesh",{frustumCulled:!1,geometry:e.geometry,material:m,raycast:At,renderOrder:20+R},m.uuid)),E?_.jsx(Fe,{onPointerDown:B?Q:void 0,onPointerLeave:B?C:void 0,onPointerMove:B?Q:void 0,showInteractionSurface:z,source:e}):null,z?_.jsxs("mesh",{ref:M,renderOrder:200,children:[_.jsx("sphereGeometry",{args:[I,20,20]}),_.jsx("meshBasicMaterial",{color:"#00ff88",depthTest:!1,depthWrite:!1,opacity:.95,transparent:!0,wireframe:!0})]}):null]})}const Ln="/textures/fur/uneven-alpha.png",_n=`
#include <common>
#include <skinning_pars_vertex>

attribute vec3 aRootPosition;
attribute vec3 aRootNormal;
attribute float aScale;
attribute float aPhase;
attribute vec4 aQuat;
attribute vec2 aRootUv;

uniform float uTime;
uniform float uBladeHeight;
uniform float uCurvature;
uniform float uWindStrength;
uniform float uNoiseFrequency;
uniform float uNoiseAmplitude;
uniform float uWaveAmplitude;
uniform float uWaveLength;
uniform float uWaveSpeed;
uniform vec2 uWaveDirection;
uniform vec3 uInteractorPos;
uniform float uInteractorRadius;
uniform float uInteractorStrength;
uniform float uInteractorEnabled;

varying float vProgress;
varying float vShade;
varying vec2 vBladeUv;
varying vec2 vRootUv;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}


float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec3 quatRotate(vec4 q, vec3 v) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main() {
  vec3 strand = position;
  float progress = clamp(position.y, 0.0, 1.0);
  float waveDirectionLength = max(length(uWaveDirection), 0.0001);
  vec2 waveDirection = uWaveDirection / waveDirectionLength;
  float timeValue = uTime + aPhase;
  float sway =
    sin(timeValue * 1.3 + aRootPosition.x * 0.2) +
    cos(timeValue * 0.7 + aRootPosition.z * 0.15);
  float wavePhase =
    dot(aRootPosition.xz, waveDirection) / max(uWaveLength, 0.0001);
  float wave =
    sin(wavePhase * 6.2831852 - uTime * uWaveSpeed) *
    uWaveAmplitude *
    progress;
  float shade =
    noise(
      aRootPosition.xz * max(uNoiseFrequency, 0.0001) +
        progress * 4.0 +
        uTime * 0.1
    );

  vProgress = progress;
  vShade = shade;
  vBladeUv = uv;
  vRootUv = aRootUv;

  strand.y *= uBladeHeight * aScale;
  strand.x += uCurvature * progress * progress;
  sway *= uWindStrength * progress * progress;
  strand.x += sway * 0.4;
  strand.z += sway * 0.15;
  strand.xz += waveDirection * wave;
  strand.xz += (shade - 0.5) * uNoiseAmplitude * progress;
  strand = quatRotate(aQuat, strand);

  vec3 bindSurfaceNormal = normalize(aRootNormal);
  vec3 bindRootPosition = aRootPosition;
  vec3 bindStrandPosition = bindRootPosition + strand;
  vec3 currentRootPosition = bindRootPosition;
  vec3 currentStrandPosition = bindStrandPosition;
  vec3 surfaceNormal = bindSurfaceNormal;

  #ifdef USE_SKINNING
    #include <skinbase_vertex>

    vec4 rootSkinVertex = bindMatrix * vec4(bindRootPosition, 1.0);
    vec4 strandSkinVertex = bindMatrix * vec4(bindStrandPosition, 1.0);
    vec4 skinnedRoot = vec4(0.0);
    vec4 skinnedStrand = vec4(0.0);

    skinnedRoot += boneMatX * rootSkinVertex * skinWeight.x;
    skinnedRoot += boneMatY * rootSkinVertex * skinWeight.y;
    skinnedRoot += boneMatZ * rootSkinVertex * skinWeight.z;
    skinnedRoot += boneMatW * rootSkinVertex * skinWeight.w;

    skinnedStrand += boneMatX * strandSkinVertex * skinWeight.x;
    skinnedStrand += boneMatY * strandSkinVertex * skinWeight.y;
    skinnedStrand += boneMatZ * strandSkinVertex * skinWeight.z;
    skinnedStrand += boneMatW * strandSkinVertex * skinWeight.w;

    currentRootPosition = (bindMatrixInverse * skinnedRoot).xyz;
    currentStrandPosition = (bindMatrixInverse * skinnedStrand).xyz;

    mat4 skinMatrix = mat4(0.0);
    skinMatrix += skinWeight.x * boneMatX;
    skinMatrix += skinWeight.y * boneMatY;
    skinMatrix += skinWeight.z * boneMatZ;
    skinMatrix += skinWeight.w * boneMatW;
    skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
    surfaceNormal = vec4(skinMatrix * vec4(bindSurfaceNormal, 0.0)).xyz;
  #endif

  surfaceNormal = normalize(surfaceNormal);

  vec3 tangentDelta =
    (currentRootPosition - uInteractorPos) -
    surfaceNormal * dot(currentRootPosition - uInteractorPos, surfaceNormal);
  float tangentDistance = length(tangentDelta);
  float interaction = clamp(
    (1.0 - smoothstep(0.0, uInteractorRadius, tangentDistance)) *
      uInteractorStrength *
      uInteractorEnabled,
    0.0,
    1.0
  );
  vec3 interactionDirection = tangentDelta / max(tangentDistance, 0.00001);

  currentStrandPosition +=
    interactionDirection * (interaction * uBladeHeight * 0.9) * progress;
  currentStrandPosition = mix(
    currentStrandPosition,
    currentRootPosition,
    interaction * 0.25 * progress
  );

  gl_Position =
    projectionMatrix * modelViewMatrix * vec4(currentStrandPosition, 1.0);
}
`,Vn=`
precision highp float;

uniform sampler2D uAlphaMap;
uniform vec3 uBaseColor;
uniform vec3 uTipColor;
uniform float uTipMix;
uniform sampler2D uSourceMap;
uniform float uUseExplicitTipColor;
uniform float uUseSourceMap;

varying float vProgress;
varying float vShade;
varying vec2 vBladeUv;
varying vec2 vRootUv;

void main() {
  vec3 sourceColor = uBaseColor;

  if (uUseSourceMap > 0.5) {
    sourceColor *= texture2D(uSourceMap, vRootUv).rgb;
  }

  vec3 tipColor = mix(sourceColor, uTipColor, uTipMix * uUseExplicitTipColor);
  vec3 color = mix(sourceColor, tipColor, pow(vProgress, 1.2));
  float furMask = smoothstep(0.08, 0.65, texture2D(uAlphaMap, vBladeUv).r);

  color *= mix(0.75, 1.25, vShade);
  color *= mix(0.82, 1.0, furMask);
  color += smoothstep(0.7, 1.0, vProgress) * 0.12;

  if (furMask <= 0.01) {
    discard;
  }

  gl_FragColor = vec4(color, 1.0);
}
`;function jn({source:e,geometry:t,bladeHeight:a=.045,alphaTexturePath:l=Ln,rootColor:s=null,tipColor:r=null,tipMix:c=.18,curvature:w=.05,windStrength:V=.18,noiseFrequency:X=.4,noiseAmplitude:j=.02,waveAmplitude:B=.025,waveLength:u=.7,waveSpeed:U=1.2,waveDirection:z=[1,0],interactive:A=!0,interactionRadius:P=.18,interactionStrength:L=1.2,showInteractionSurface:b=!1,...T}){const W=o.useRef(),M=o.useRef(new D),p=r!=null,h=e.radius||1,E=a*h,S=P*h,d=j*h,O=B*h,g=o.useMemo(()=>We(),[]),H=Ze(l),N=o.useMemo(()=>{const C=e.baseColor.clone();return s&&C.set(s),C},[s,e.baseColor]),x=o.useMemo(()=>r?new be(r):e.baseColor.clone(),[e.baseColor,r]),I=o.useMemo(()=>ot(z),[z]),n=o.useMemo(()=>{const C=new Ht({fragmentShader:Vn,side:Se,uniforms:{uAlphaMap:{value:H||g},uBaseColor:{value:N.clone()},uBladeHeight:{value:E},uCurvature:{value:w},uInteractorEnabled:{value:0},uInteractorPos:{value:new D(1e3,1e3,1e3)},uInteractorRadius:{value:S},uInteractorStrength:{value:L},uNoiseAmplitude:{value:d},uNoiseFrequency:{value:X},uSourceMap:{value:e.map||g},uTime:{value:0},uTipColor:{value:x.clone()},uTipMix:{value:c},uUseExplicitTipColor:{value:p?1:0},uUseSourceMap:{value:e.map?1:0},uWaveAmplitude:{value:O},uWaveDirection:{value:I.clone()},uWaveLength:{value:u},uWaveSpeed:{value:U},uWindStrength:{value:V}},vertexShader:_n});return C.skinning=!0,C},[]);o.useEffect(()=>()=>{g.dispose(),n.dispose()},[g,n]),o.useEffect(()=>{n.uniforms.uAlphaMap.value=H||g,n.uniforms.uBaseColor.value.copy(N),n.uniforms.uBladeHeight.value=E,n.uniforms.uCurvature.value=w,n.uniforms.uInteractorRadius.value=S,n.uniforms.uInteractorStrength.value=L,n.uniforms.uNoiseAmplitude.value=d,n.uniforms.uNoiseFrequency.value=X,n.uniforms.uSourceMap.value=e.map||g,n.uniforms.uTipColor.value.copy(x),n.uniforms.uTipMix.value=c,n.uniforms.uUseExplicitTipColor.value=p?1:0,n.uniforms.uUseSourceMap.value=e.map?1:0,n.uniforms.uWaveAmplitude.value=O,n.uniforms.uWaveDirection.value.copy(I),n.uniforms.uWaveLength.value=u,n.uniforms.uWaveSpeed.value=U,n.uniforms.uWindStrength.value=V},[H,w,g,L,n,X,N,E,S,d,x,O,I,e.map,c,p,u,U,V]);const f=o.useCallback(C=>{!A||!W.current||(C.stopPropagation(),M.current.copy(C.point),W.current.worldToLocal(M.current),n.uniforms.uInteractorEnabled.value=1,n.uniforms.uInteractorPos.value.copy(M.current))},[A,n]),Q=o.useCallback(()=>{n.uniforms.uInteractorEnabled.value=0},[n]);return ge((C,m)=>{n.uniforms.uTime.value+=m}),!t||!e.mesh?null:_.jsxs(Ue,{ref:W,source:e,...T,children:[_.jsx(rt,{frustumCulled:!1,geometry:t,material:n,sourceMesh:e.mesh}),_.jsx(Fe,{onPointerDown:A?f:void 0,onPointerLeave:A?Q:void 0,onPointerMove:A?f:void 0,showInteractionSurface:b,source:e})]})}const at=new D,st=new D,wt=new D,Ct=new dn,Ve=new ct,je=new D,Oe=new D,Rt=new D,It=new me,Dt=new me,Tt=new me,Pt=new me,He=new me,Et=new me,Nt=new me,Wt=new me,Ft=new me,le=new D,Ge=new D,Ie=new D,qe=new D,Xe=new D,de=new D,it=3,On=.65,Hn=1.5,Gn=.82,qn=1.12;function Xn(e,t,a=Math.random,l={normals:new Float32Array(t*3),positions:new Float32Array(t*3),uvs:new Float32Array(t*2)}){const s=l;let r=e;r.index||(r=r.toNonIndexed());const c=r.getAttribute("position");if(!c)throw new Error("Strand fur source geometry is missing a position attribute.");r.getAttribute("normal")||r.computeVertexNormals();const w=r.getAttribute("normal"),V=r.getAttribute("skinIndex"),X=r.getAttribute("skinWeight"),j=r.getAttribute("uv"),B=!!(V&&X),u=r.index?.array,U=u?u.length/3:c.count/3,z=new Float32Array(U),A=new D,P=new D,L=new D,b=new D,T=new D,W=new D,M=new D,p=new D,h=new D,E=new Map,S=new Qe,d=new Qe,O=new Qe,g=new Qe;B&&(s.skinIndices||=new Float32Array(t*4),s.skinWeights||=new Float32Array(t*4));let H=0;for(let x=0;x<U;x+=1){const I=u?u[x*3]:x*3,n=u?u[x*3+1]:x*3+1,f=u?u[x*3+2]:x*3+2;A.fromBufferAttribute(c,I),P.fromBufferAttribute(c,n),L.fromBufferAttribute(c,f),H+=b.copy(P).sub(A).cross(T.copy(L).sub(A)).length()*.5,z[x]=H}const N=x=>{let I=0,n=U-1;for(;I<n;){const f=Math.floor((I+n)/2);x<=z[f]?n=f:I=f+1}return I};for(let x=0;x<t;x+=1){const I=N(a()*H),n=u?u[I*3]:I*3,f=u?u[I*3+1]:I*3+1,Q=u?u[I*3+2]:I*3+2;let C=a(),m=a();C+m>1&&(C=1-C,m=1-m);const R=1-C-m;if(A.fromBufferAttribute(c,n),P.fromBufferAttribute(c,f),L.fromBufferAttribute(c,Q),s.positions[x*3]=A.x*R+P.x*C+L.x*m,s.positions[x*3+1]=A.y*R+P.y*C+L.y*m,s.positions[x*3+2]=A.z*R+P.z*C+L.z*m,M.fromBufferAttribute(w,n),p.fromBufferAttribute(w,f),h.fromBufferAttribute(w,Q),W.copy(M).multiplyScalar(R).addScaledVector(p,C).addScaledVector(h,m).normalize(),s.normals[x*3]=W.x,s.normals[x*3+1]=W.y,s.normals[x*3+2]=W.z,B){E.clear(),It.fromBufferAttribute(V,n),Dt.fromBufferAttribute(V,f),Tt.fromBufferAttribute(V,Q),Nt.fromBufferAttribute(X,n),Wt.fromBufferAttribute(X,f),Ft.fromBufferAttribute(X,Q),[[It,Nt,R],[Dt,Wt,C],[Tt,Ft,m]].forEach(([F,v,G])=>{for(let Y=0;Y<4;Y+=1){const oe=F.getComponent(Y),re=v.getComponent(Y)*G;Number.isFinite(oe)&&re>1e-5&&E.set(oe,(E.get(oe)||0)+re)}});const i=Array.from(E.entries()).sort((F,v)=>v[1]-F[1]).slice(0,4),k=i.reduce((F,[,v])=>F+v,0);for(let F=0;F<4;F+=1){const v=x*4+F,G=i[F];s.skinIndices[v]=G?.[0]??0,s.skinWeights[v]=G?G[1]/Math.max(k,1e-6):0}}j?(S.fromBufferAttribute(j,n),d.fromBufferAttribute(j,f),O.fromBufferAttribute(j,Q),g.copy(S).multiplyScalar(R).addScaledVector(d,C).addScaledVector(O,m),s.uvs[x*2]=g.x,s.uvs[x*2+1]=g.y):(s.uvs[x*2]=0,s.uvs[x*2+1]=0)}return s}function lt(e,t=new ct){const a=new D(0,1,0);if(a.dot(e)<-.9995){const l=new D(1,0,0).cross(a);return l.lengthSq()<1e-6&&l.set(0,0,1),l.normalize(),t.setFromAxisAngle(l,Math.PI),t}return t.setFromUnitVectors(a,e.clone().normalize()),t}function Kt({bladeWidth:e=.008,isSkinnedMesh:t=!1,seed:a=1,sourceGeometry:l,strandCount:s=4e3}){if(!l)return null;const r=Math.max(5e-4,Math.min(.5,e*.5)),c=it*3,w=new Float32Array(c*3),V=new Float32Array(c*2),X=new Float32Array(c*3),j=new Uint16Array(c),B=new ht;for(let d=0;d<it;d+=1){const O=Math.PI/it*d,g=Math.cos(O),H=Math.sin(O),N=d*3,x=d*6;le.set(-r,0,0),Ge.set(le.x*g-le.z*H,le.y,le.x*H+le.z*g),Ie.copy(Ge),le.set(r,0,0),Ge.set(le.x*g-le.z*H,le.y,le.x*H+le.z*g),qe.copy(Ge),Xe.set(0,1,0),de.copy(qe).sub(Ie).cross(Ge.copy(Xe).sub(Ie)).normalize(),w.set([Ie.x,Ie.y,Ie.z,qe.x,qe.y,qe.z,Xe.x,Xe.y,Xe.z],N*3),V.set([0,0,1,0,.5,1],x),X.set([de.x,de.y,de.z,de.x,de.y,de.z,de.x,de.y,de.z],N*3),j.set([N,N+1,N+2],N)}B.setAttribute("position",new ve(w,3)),B.setAttribute("uv",new ve(V,2)),B.setAttribute("normal",new ve(X,3)),B.setIndex(new ve(j,1));const u=Xn(l,s,yt(a)),U=yt(a*17+5),z=new D,A=new ct,P=t?Gn:On,b=(t?qn:Hn)-P;if(t&&u.skinIndices&&u.skinWeights){const d=B.getAttribute("position").count,O=B.index.count,g=d*s,H=O*s,N=B.getAttribute("position").array,x=B.getAttribute("uv").array,I=B.getAttribute("normal").array,n=B.index.array,f=new ht,Q=new Float32Array(g*3),C=new Float32Array(g*2),m=new Float32Array(g*3),R=8,i=6,k=new Float32Array(g*R),F=new Float32Array(g*i),v=new Uint16Array(g*4),G=new Float32Array(g*4),Y=g>65535?new Uint32Array(H):new Uint16Array(H),oe=new xt(k,R),re=new xt(F,i);for(let $=0;$<s;$+=1){const ye=P+U()*b,Ae=U()*Math.PI*2,J=$*d;z.set(u.normals[$*3],u.normals[$*3+1],u.normals[$*3+2]).normalize(),lt(z,A);for(let Z=0;Z<d;Z+=1){const ae=J+Z,se=ae*3,ke=ae*2,te=ae*4,ie=ae*R,ee=ae*i,K=Z*3,ue=Z*2;Q[se]=N[K],Q[se+1]=N[K+1],Q[se+2]=N[K+2],m[se]=I[K],m[se+1]=I[K+1],m[se+2]=I[K+2],C[ke]=x[ue],C[ke+1]=x[ue+1],k[ie]=u.positions[$*3],k[ie+1]=u.positions[$*3+1],k[ie+2]=u.positions[$*3+2],k[ie+3]=u.normals[$*3],k[ie+4]=u.normals[$*3+1],k[ie+5]=u.normals[$*3+2],k[ie+6]=u.uvs[$*2],k[ie+7]=u.uvs[$*2+1],F[ee]=ye,F[ee+1]=Ae,F[ee+2]=A.x,F[ee+3]=A.y,F[ee+4]=A.z,F[ee+5]=A.w,v[te]=u.skinIndices[$*4],v[te+1]=u.skinIndices[$*4+1],v[te+2]=u.skinIndices[$*4+2],v[te+3]=u.skinIndices[$*4+3],G[te]=u.skinWeights[$*4],G[te+1]=u.skinWeights[$*4+1],G[te+2]=u.skinWeights[$*4+2],G[te+3]=u.skinWeights[$*4+3]}for(let Z=0;Z<O;Z+=1)Y[$*O+Z]=n[Z]+J}return f.setAttribute("position",new ve(Q,3)),f.setAttribute("uv",new ve(C,2)),f.setAttribute("normal",new ve(m,3)),f.setAttribute("aRootPosition",new Re(oe,3,0)),f.setAttribute("aRootNormal",new Re(oe,3,3)),f.setAttribute("aScale",new Re(re,1,0)),f.setAttribute("aPhase",new Re(re,1,1)),f.setAttribute("aQuat",new Re(re,4,2)),f.setAttribute("aRootUv",new Re(oe,2,6)),f.setAttribute("skinIndex",new un(v,4)),f.setAttribute("skinWeight",new ln(G,4)),f.setIndex(new ve(Y,1)),f.userData.furSkinning=null,f.userData.strandGeometryType="skinned",f}const T=new cn;T.index=B.index,T.attributes.position=B.attributes.position,T.attributes.uv=B.attributes.uv,T.attributes.normal=B.attributes.normal;const W=new Float32Array(s*3),M=new Float32Array(s*3),p=new Float32Array(s),h=new Float32Array(s),E=new Float32Array(s*4),S=new Float32Array(s*2);for(let d=0;d<s;d+=1)W[d*3]=u.positions[d*3],W[d*3+1]=u.positions[d*3+1],W[d*3+2]=u.positions[d*3+2],M[d*3]=u.normals[d*3],M[d*3+1]=u.normals[d*3+1],M[d*3+2]=u.normals[d*3+2],z.set(u.normals[d*3],u.normals[d*3+1],u.normals[d*3+2]).normalize(),lt(z,A),E[d*4]=A.x,E[d*4+1]=A.y,E[d*4+2]=A.z,E[d*4+3]=A.w,S[d*2]=u.uvs[d*2],S[d*2+1]=u.uvs[d*2+1],p[d]=P+U()*b,h[d]=U()*Math.PI*2;return T.setAttribute("aOffset",new Me(W,3)),T.setAttribute("aRootPosition",new Me(W,3)),T.setAttribute("aRootNormal",new Me(M,3)),T.setAttribute("aScale",new Me(p,1)),T.setAttribute("aPhase",new Me(h,1)),T.setAttribute("aQuat",new Me(E,4)),T.setAttribute("aRootUv",new Me(S,2)),u.skinIndices&&u.skinWeights?(T.userData.furSkinning={bindNormals:u.normals,bindPositions:u.positions,skinIndices:u.skinIndices,skinWeights:u.skinWeights},T.getAttribute("aOffset").setUsage(bt),T.getAttribute("aQuat").setUsage(bt)):T.userData.furSkinning=null,T.instanceCount=s,T.userData.strandGeometryType="instanced",T}function Ut(e,t,a,l,s){Pt.set(t.x,t.y,t.z,1).applyMatrix4(e.bindMatrix),He.set(0,0,0,0);for(let r=0;r<4;r+=1){const c=l[r];c>1e-5&&(Ct.fromArray(e.skeleton.boneMatrices,a[r]*16),Et.copy(Pt).applyMatrix4(Ct),He.addScaledVector(Et,c))}return s.set(He.x,He.y,He.z),s.applyMatrix4(e.bindMatrixInverse),s}function Jt(e,t){const a=e?.userData?.furSkinning;if(!a||!t?.isSkinnedMesh||!t.skeleton)return!1;const l=e.getAttribute("aOffset"),s=e.getAttribute("aQuat");if(!l||!s)return!1;t.skeleton.update();for(let r=0;r<l.count;r+=1)at.fromArray(a.bindPositions,r*3),st.fromArray(a.bindNormals,r*3).normalize(),wt.copy(at).addScaledVector(st,.025),Ut(t,at,a.skinIndices.subarray(r*4,r*4+4),a.skinWeights.subarray(r*4,r*4+4),Oe),Ut(t,wt,a.skinIndices.subarray(r*4,r*4+4),a.skinWeights.subarray(r*4,r*4+4),Rt),je.copy(Rt).sub(Oe),je.lengthSq()<=1e-6?je.copy(st):je.normalize(),lt(je,Ve),l.setXYZ(r,Oe.x,Oe.y,Oe.z),s.setXYZW(r,Ve.x,Ve.y,Ve.z,Ve.w);return l.needsUpdate=!0,s.needsUpdate=!0,!0}const Qn="/textures/fur/uneven-alpha.png",$n=`
precision highp float;

attribute vec3 position;
attribute vec2 uv;
attribute vec3 aOffset;
attribute float aScale;
attribute float aPhase;
attribute vec4 aQuat;
attribute vec2 aRootUv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform float uBladeHeight;
uniform float uCurvature;
uniform float uWindStrength;
uniform float uNoiseFrequency;
uniform float uNoiseAmplitude;
uniform float uWaveAmplitude;
uniform float uWaveLength;
uniform float uWaveSpeed;
uniform vec2 uWaveDirection;
uniform vec3 uInteractorPos;
uniform float uInteractorRadius;
uniform float uInteractorStrength;
uniform float uInteractorEnabled;

varying float vProgress;
varying float vShade;
varying vec2 vBladeUv;
varying vec2 vRootUv;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec3 quatRotate(vec4 q, vec3 v) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main() {
  vec3 strand = position;
  float progress = clamp(strand.y, 0.0, 1.0);
  float waveDirectionLength = max(length(uWaveDirection), 0.0001);
  vec2 waveDirection = uWaveDirection / waveDirectionLength;
  float timeValue = uTime + aPhase;
  float sway =
    sin(timeValue * 1.3 + aOffset.x * 0.2) +
    cos(timeValue * 0.7 + aOffset.z * 0.15);
  float wavePhase = dot(aOffset.xz, waveDirection) / max(uWaveLength, 0.0001);
  float wave =
    sin(wavePhase * 6.2831852 - uTime * uWaveSpeed) *
    uWaveAmplitude *
    progress;
  float shade =
    noise(
      aOffset.xz * max(uNoiseFrequency, 0.0001) +
        progress * 4.0 +
        uTime * 0.1
    );

  vProgress = progress;
  vShade = shade;
  vBladeUv = uv;
  vRootUv = aRootUv;

  strand.y *= uBladeHeight * aScale;
  strand.x += uCurvature * progress * progress;
  sway *= uWindStrength * progress * progress;
  strand.x += sway * 0.4;
  strand.z += sway * 0.15;
  strand.xz += waveDirection * wave;
  strand.xz += (shade - 0.5) * uNoiseAmplitude * progress;
  strand = quatRotate(aQuat, strand);

  vec3 surfaceNormal = normalize(quatRotate(aQuat, vec3(0.0, 1.0, 0.0)));
  vec3 tangentDelta =
    (aOffset - uInteractorPos) -
    surfaceNormal * dot(aOffset - uInteractorPos, surfaceNormal);
  float tangentDistance = length(tangentDelta);
  float interaction = clamp(
    (1.0 - smoothstep(0.0, uInteractorRadius, tangentDistance)) *
    uInteractorStrength *
    uInteractorEnabled,
    0.0,
    1.0
  );
  vec3 interactionDirection = tangentDelta / max(tangentDistance, 0.00001);

  strand += interactionDirection * (interaction * uBladeHeight * 0.9) * progress;
  strand.y *= 1.0 - interaction * 0.25 * progress;

  vec3 localPosition = strand + aOffset;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(localPosition, 1.0);
}
`,Zn=`
precision highp float;

uniform sampler2D uAlphaMap;
uniform vec3 uBaseColor;
uniform vec3 uTipColor;
uniform float uTipMix;
uniform sampler2D uSourceMap;
uniform float uUseExplicitTipColor;
uniform float uUseSourceMap;

varying float vProgress;
varying float vShade;
varying vec2 vBladeUv;
varying vec2 vRootUv;

void main() {
  vec3 sourceColor = uBaseColor;

  if (uUseSourceMap > 0.5) {
    sourceColor *= texture2D(uSourceMap, vRootUv).rgb;
  }

  vec3 tipColor = mix(sourceColor, uTipColor, uTipMix * uUseExplicitTipColor);
  vec3 color = mix(sourceColor, tipColor, pow(vProgress, 1.2));
  float furMask = smoothstep(0.08, 0.65, texture2D(uAlphaMap, vBladeUv).r);

  color *= mix(0.75, 1.25, vShade);
  color *= mix(0.82, 1.0, furMask);
  color += smoothstep(0.7, 1.0, vProgress) * 0.12;

  if (furMask <= 0.01) {
    discard;
  }

  gl_FragColor = vec4(color, 1.0);
}
`;function Yn({source:e,count:t=5e3,bladeHeight:a=.045,bladeWidth:l=.008,alphaTexturePath:s=Qn,rootColor:r=null,tipColor:c=null,tipMix:w=.18,curvature:V=.05,windStrength:X=.18,noiseFrequency:j=.4,noiseAmplitude:B=.02,waveAmplitude:u=.025,waveLength:U=.7,waveSpeed:z=1.2,waveDirection:A=[1,0],interactive:P=!0,interactionRadius:L=.18,interactionStrength:b=1.2,seed:T=1,showInteractionSurface:W=!1,...M}){const p=o.useRef(),h=o.useRef(new D),E=c!=null,S=e.radius||1,d=a*S,O=l*S,g=L*S,H=B*S,N=u*S,x=o.useMemo(()=>Yt(t,e.isSkinnedMesh),[t,e.isSkinnedMesh]),I=o.useMemo(()=>We(),[]),n=Ze(s),f=o.useMemo(()=>Kt({bladeWidth:O,isSkinnedMesh:e.isSkinnedMesh,seed:T,sourceGeometry:e.geometry,strandCount:x}),[O,x,T,e.geometry,e.isSkinnedMesh]),Q=f?.userData?.strandGeometryType==="skinned",C=o.useMemo(()=>{const v=e.baseColor.clone();return r&&v.set(r),v},[r,e.baseColor]),m=o.useMemo(()=>c?new be(c):e.baseColor.clone(),[e.baseColor,c]),R=o.useMemo(()=>ot(A),[A]),i=o.useRef({uAlphaMap:{value:n||I},uBaseColor:{value:C.clone()},uBladeHeight:{value:d},uCurvature:{value:V},uInteractorEnabled:{value:0},uInteractorPos:{value:new D(1e3,1e3,1e3)},uInteractorRadius:{value:g},uInteractorStrength:{value:b},uNoiseAmplitude:{value:H},uNoiseFrequency:{value:j},uSourceMap:{value:e.map||I},uTime:{value:0},uTipColor:{value:m.clone()},uTipMix:{value:w},uUseExplicitTipColor:{value:E?1:0},uUseSourceMap:{value:e.map?1:0},uWaveAmplitude:{value:N},uWaveDirection:{value:R.clone()},uWaveLength:{value:U},uWaveSpeed:{value:z},uWindStrength:{value:X}});o.useEffect(()=>()=>I.dispose(),[I]),o.useEffect(()=>{const v=i.current;v.uAlphaMap.value=n||I,v.uBaseColor.value.copy(C),v.uTipColor.value.copy(m),v.uBladeHeight.value=d,v.uCurvature.value=V,v.uInteractorRadius.value=g,v.uInteractorStrength.value=b,v.uNoiseAmplitude.value=H,v.uNoiseFrequency.value=j,v.uSourceMap.value=e.map||I,v.uTipMix.value=w,v.uUseExplicitTipColor.value=E?1:0,v.uUseSourceMap.value=e.map?1:0,v.uWaveAmplitude.value=N,v.uWaveDirection.value.copy(R),v.uWaveLength.value=U,v.uWaveSpeed.value=z,v.uWindStrength.value=X},[n,d,V,I,g,b,H,j,C,m,R,N,e.map,w,E,U,z,X]);const k=o.useCallback(v=>{!P||!p.current||(v.stopPropagation(),h.current.copy(v.point),p.current.worldToLocal(h.current),i.current.uInteractorEnabled.value=1,i.current.uInteractorPos.value.copy(h.current))},[P]),F=o.useCallback(()=>{i.current.uInteractorEnabled.value=0},[]);return ge((v,G)=>{i.current.uTime.value+=G,!Q&&e.isSkinnedMesh&&e.mesh&&Jt(f,e.mesh)}),f?Q&&e.mesh?_.jsx(jn,{alphaTexturePath:s,bladeHeight:a,curvature:V,geometry:f,interactionRadius:L,interactionStrength:b,interactive:P,noiseAmplitude:B,noiseFrequency:j,rootColor:r,showInteractionSurface:W,source:e,tipColor:c,tipMix:w,waveAmplitude:u,waveDirection:A,waveLength:U,waveSpeed:z,windStrength:X,...M}):_.jsxs(Ue,{ref:p,source:e,...M,children:[_.jsx("mesh",{frustumCulled:!1,geometry:f,children:_.jsx("rawShaderMaterial",{fragmentShader:Zn,side:Se,uniforms:i.current,vertexShader:$n})}),_.jsx(Fe,{onPointerDown:P?k:void 0,onPointerLeave:P?F:void 0,onPointerMove:P?k:void 0,showInteractionSurface:W,source:e})]}):null}function en({sourceGeometry:e=null,sourceMaterial:t=null,sourceMesh:a=null}){const[l,s]=o.useState(()=>gt(a));return o.useLayoutEffect(()=>{const r=gt(a);r!==l&&s(r)},[l,a]),o.useMemo(()=>{const r=ut(t)||ut(l?.material);return{baseColor:Tn(r),geometry:e||l?.geometry||null,isSkinnedMesh:l?.isSkinnedMesh===!0,map:Pn(r),material:r,mesh:l,radius:En(e||l?.geometry)}},[l,e,t])}function Kn({technique:e=De.strand,sourceGeometry:t=null,sourceMaterial:a=null,sourceMesh:l=null,...s}){const r=en({sourceGeometry:t,sourceMaterial:a,sourceMesh:l});return r.geometry?e===De.shell?_.jsx(Bn,{...s,source:r}):e===De.strand?_.jsx(Yn,{...s,source:r}):null:null}const zt=[.6,.6,.6,1],Bt=[1,1,1,0],Jn="/textures/fur/uneven-alpha.png",eo=6.2831852,to=.1376,no=.3726,oo=.2546;function Lt(){return null}function _t(e,t){const a=Array.isArray(e)?e:t;return{alpha:a[3]??t[3],color:new be(a[0],a[1],a[2])}}function ro({alphaEnd:e,alphaMap:t,alphaStart:a,baseColor:l,colorEnd:s,colorStart:r,densityNode:c,lit:w,surfaceColor:V,layerIndex:X,layerThickness:j,layersCount:B,sourceMap:u,interactionRadius:U,interactionStrength:z,stiffness:A,useSourceMap:P,waveScale:L}){const b={alphaEnd:y(e),alphaStart:y(a),baseColor:y(l.clone()),colorEnd:y(s.clone()),colorStart:y(r.clone()),interactorEnabled:y(0),interactorDir:y(new D(1,0,0)),interactorNormal:y(new D(0,1,0)),interactorPos:y(new D(1e3,1e3,1e3)),interactorRadius:y(U),interactorStrength:y(z),layerIndex:y(X),layerThickness:y(j),layersCount:y(B),stiffness:y(A),time:y(0),useSourceMap:y(P?1:0),waveScale:y(L)},T=w?vn:dt,W=new T({alphaTest:.001,depthWrite:!1,side:Se,transparent:!0,...w?{metalness:0,roughness:1}:{}}),M=b.layerIndex.div(b.layersCount.max(q(1))),p=b.layerIndex.add(1).mul(b.layerThickness),h=b.waveScale.mul(ft(M.max(q(1e-4)),b.stiffness)),E=b.time.mul(eo),S=fe.toVar(),d=Mn.normalize().toVar(),O=b.interactorNormal.normalize(),g=ce(S.x.add(d.x.mul(p)).add(he(E.add(S.x.add(S.y).add(S.z).mul(to))).mul(h)),S.y.add(d.y.mul(p)).add(mt(E.add(S.x.sub(S.y).add(S.z).mul(no))).mul(h)),S.z.add(d.z.mul(p)).add(he(E.add(S.x.add(S.y).sub(S.z).mul(oo))).mul(h))),H=g.sub(b.interactorPos).toVar(),N=Pe(H,O).toVar(),x=H.sub(O.mul(N)).toVar(),I=Ee(x),n=x.div(I.max(q(1e-5))),f=b.interactorDir.sub(O.mul(Pe(b.interactorDir,O))).toVar(),Q=Ee(f),C=ne(n,f.div(Q.max(q(1e-5))),Sn(q(1e-4),Q)),m=b.layerThickness.mul(2).max(b.interactorRadius.mul(.08)),R=q(1).sub(xe(m,m.mul(2.5),An(N.sub(p)))),i=ne(q(1),q(.45),M),k=ne(q(.35),q(1),M),F=q(1).sub(xe(0,b.interactorRadius,I)).mul(R).mul(b.interactorStrength).mul(b.interactorEnabled),v=$e(F.mul(i).mul(.32),0,.6),G=ne(g.add(C.mul(F).mul(k).mul(.85)),S,v).sub(d.mul(F).mul(i).mul(.08));let Y=b.baseColor;V?Y=V:u&&(Y=ne(b.baseColor,b.baseColor.mul(Ne(new Te(u),et()).rgb),b.useSourceMap)),w?W.positionNode=G:W.vertexNode=Gt.mul(qt).mul(Xt(G,1));const oe=Y.mul(ne(b.colorStart,b.colorEnd,M));W.colorNode=oe;const re=Ne(new Te(t),et()).r.mul(ne(b.alphaStart,b.alphaEnd,M));return W.opacityNode=c?re.mul(c):re,{material:W,uniforms:b}}function ao({source:e,layers:t=null,shellCount:a=20,thickness:l=null,shellSpacing:s=null,waveScale:r=.06,stiffness:c=2.75,startColor:w=zt,endColor:V=Bt,alphaTexturePath:X=Jn,rootColor:j=null,colorNode:B=null,densityNode:u=null,lit:U=!1,interactive:z=!1,interactionRadius:A=.18,interactionStrength:P=1.2,showInteractionSurface:L=!1,...b}){const T=o.useRef(),W=o.useRef(new D),M=o.useRef(new D(0,1,0)),p=o.useRef(new D),h=o.useRef(new D(1,0,0)),E=o.useRef(),S=o.useMemo(()=>We(),[]),d=fn(mn,X),O=z||L,g=o.useMemo(()=>Zt(t??a),[t,a]),H=o.useMemo(()=>{const k=e.baseColor.clone();return j&&k.set(j),k},[j,e.baseColor]),N=o.useMemo(()=>_t(w,zt),[w]),x=o.useMemo(()=>_t(V,Bt),[V]),I=l??s??.018,n=A*(e.radius||1),f=r,Q=n,C=o.useMemo(()=>Array.from({length:g},(k,F)=>ro({alphaEnd:x.alpha,alphaMap:d||S,alphaStart:N.alpha,baseColor:H,colorEnd:x.color,colorStart:N.color,densityNode:u,interactionRadius:n,interactionStrength:P,layerIndex:F,layerThickness:I,layersCount:g,lit:U,sourceMap:e.map||S,stiffness:c,surfaceColor:B,useSourceMap:!!e.map,waveScale:f})),[d,B,u,S,H,x.alpha,x.color,n,P,U,g,I,N.alpha,N.color,f,e.map,c]);o.useEffect(()=>{d&&(d.colorSpace=Ot,d.wrapS=Je,d.wrapT=Je,d.needsUpdate=!0)},[d]),o.useEffect(()=>()=>{S.dispose()},[S]),o.useEffect(()=>()=>{C.forEach(({material:k})=>k.dispose())},[C]),o.useEffect(()=>{C.forEach((k,F)=>{const{uniforms:v}=k;v.alphaEnd.value=x.alpha,v.alphaStart.value=N.alpha,v.baseColor.value.copy(H),v.colorEnd.value.copy(x.color),v.colorStart.value.copy(N.color),v.interactorRadius.value=n,v.interactorStrength.value=P,v.layerIndex.value=F,v.layerThickness.value=I,v.layersCount.value=g,v.stiffness.value=c,v.useSourceMap.value=e.map?1:0,v.waveScale.value=f})},[C,H,x.alpha,x.color,n,P,g,I,N.alpha,N.color,f,e.map,c]);const m=o.useCallback(()=>{!E.current||!L||(E.current.visible=!0,E.current.position.copy(W.current))},[L]),R=o.useCallback(k=>{if(!z||!T.current)return;k.stopPropagation(),W.current.copy(k.point),T.current.worldToLocal(W.current),k.face?.normal&&M.current.copy(k.face.normal).normalize();const F=new D().subVectors(W.current,p.current);F.lengthSq()>1e-8&&h.current.copy(F.normalize()),p.current.copy(W.current),C.forEach(({uniforms:v})=>{const G=v;G.interactorEnabled.value=1,G.interactorDir.value.copy(h.current),G.interactorNormal.value.copy(M.current),G.interactorPos.value.copy(W.current)}),m()},[z,C,m]),i=o.useCallback(()=>{C.forEach(({uniforms:k})=>{const F=k;F.interactorEnabled.value=0,F.interactorDir.value.set(1,0,0),F.interactorNormal.value.set(0,1,0)}),E.current&&(E.current.visible=!1)},[C]);return o.useEffect(()=>{E.current&&(E.current.visible=!1)},[L]),ge((k,F)=>{C.forEach(v=>{const G=v.uniforms;G.time.value+=F})}),_.jsxs(Ue,{ref:T,source:e,...b,children:[C.map(({material:k},F)=>e.isSkinnedMesh&&e.mesh?_.jsx(rt,{frustumCulled:!1,material:k,raycast:Lt,renderOrder:20+F,sourceMesh:e.mesh},k.uuid):_.jsx("mesh",{frustumCulled:!1,geometry:e.geometry,material:k,raycast:Lt,renderOrder:20+F},k.uuid)),O?_.jsx(Fe,{onPointerDown:z?R:void 0,onPointerLeave:z?i:void 0,onPointerMove:z?R:void 0,showInteractionSurface:L,source:e}):null,L?_.jsxs("mesh",{ref:E,renderOrder:200,children:[_.jsx("sphereGeometry",{args:[Q,20,20]}),_.jsx("meshBasicMaterial",{color:"#00ff88",depthTest:!1,depthWrite:!1,opacity:.95,transparent:!0,wireframe:!0})]}):null]})}function Vt(e,t,a,l,s,r){const c=a.mul(t),w=Qt(e.element(s.x).mul(r.x).mul(c),e.element(s.y).mul(r.y).mul(c),e.element(s.z).mul(r.z).mul(c),e.element(s.w).mul(r.w).mul(c));return l.mul(w).xyz}function so(e,t,a,l,s,r){const c=Qt(r.x.mul(e.element(s.x)),r.y.mul(e.element(s.y)),r.z.mul(e.element(s.z)),r.w.mul(e.element(s.w)));return l.mul(c).mul(a).transformDirection(t).xyz}const io="/textures/fur/uneven-alpha.png";function uo({source:e,geometry:t,bladeHeight:a=.045,alphaTexturePath:l=io,rootColor:s=null,tipColor:r=null,tipMix:c=.18,curvature:w=.05,windStrength:V=.18,noiseFrequency:X=.4,noiseAmplitude:j=.02,waveAmplitude:B=.025,waveLength:u=.7,waveSpeed:U=1.2,waveDirection:z=[1,0],interactive:A=!0,interactionRadius:P=.18,interactionStrength:L=1.2,showInteractionSurface:b=!1,...T}){const W=o.useRef(),M=o.useRef(new D),p=r!=null,h=e.radius||1,E=a*h,S=P*h,d=j*h,O=B*h,g=o.useMemo(()=>We(),[]),H=Ze(l),N=o.useMemo(()=>{const m=e.baseColor.clone();return s&&m.set(s),m},[s,e.baseColor]),x=o.useMemo(()=>r?new be(r):e.baseColor.clone(),[e.baseColor,r]),I=o.useMemo(()=>ot(z),[z]),n=o.useMemo(()=>({baseColor:y(N.clone()),bladeHeight:y(E),curvature:y(w),interactorEnabled:y(0),interactorPos:y(new D(1e3,1e3,1e3)),interactorRadius:y(S),interactorStrength:y(L),noiseAmplitude:y(d),noiseFrequency:y(X),time:y(0),tipColor:y(x.clone()),tipMix:y(c),useExplicitTipColor:y(p?1:0),waveAmplitude:y(O),waveDirection:y(I.clone()),waveLength:y(u),waveSpeed:y(U),windStrength:y(V)}),[]),f=o.useMemo(()=>{const m=new dt({alphaTest:.01,side:Se}),R=pe("aRootPosition","vec3"),i=pe("aRootNormal","vec3").normalize(),k=pe("aScale","float"),F=pe("aPhase","float"),v=pe("aQuat","vec4"),G=pe("aRootUv","vec2"),Y=pe("skinIndex","uvec4"),oe=pe("skinWeight","vec4"),re=y(e.mesh.bindMatrix,"mat4"),$=y(e.mesh.bindMatrixInverse,"mat4"),ye=kn(e.mesh.skeleton.boneMatrices,"mat4",e.mesh.skeleton.bones.length),Ae=tt(([ee,K])=>{const ue=nt(ee.xyz,K);return K.add(nt(ee.xyz,ue.add(K.mul(ee.w))).mul(2))}),J=$e(fe.y,0,1),Z=n.waveDirection.div(Ee(n.waveDirection).max(q(1e-4))),ae=he(R.x.mul(n.noiseFrequency.max(q(1e-4))).add(R.z.mul(n.noiseFrequency.max(q(1e-4)))).add(J.mul(4)).add(n.time.mul(.1))).mul(.5).add(.5),se=xe(q(.08),q(.65),Ne(new Te(H||g),et()).r),ke=tt(()=>{const ee=ce(fe.x,fe.y.mul(n.bladeHeight).mul(k),fe.z).toVar(),K=n.time.add(F),ue=he(K.mul(1.3).add(R.x.mul(.2))).add(mt(K.mul(.7).add(R.z.mul(.15)))).mul(n.windStrength).mul(J.mul(J)),ze=he(Pe(R.xz,Z).div(n.waveLength.max(q(1e-4))).mul(6.2831852).sub(n.time.mul(n.waveSpeed))).mul(n.waveAmplitude).mul(J),we=R.add(Ae(v,ee.add(ce(n.curvature.mul(J).mul(J),0,0)).add(ce(ue.mul(.4),0,ue.mul(.15))).add(ce(Z.x.mul(ze),0,Z.y.mul(ze))).add(ce(ae.sub(.5).mul(n.noiseAmplitude).mul(J),0,ae.sub(.5).mul(n.noiseAmplitude).mul(J).mul(.6))))).toVar(),Ce=Vt(ye,R,re,$,Y,oe).toVar(),Be=so(ye,i,re,$,Y,oe).normalize().toVar(),Ye=Vt(ye,we,re,$,Y,oe).toVar(),Le=Ce.sub(n.interactorPos).sub(Be.mul(Pe(Ce.sub(n.interactorPos),Be))).toVar(),Ke=Ee(Le),vt=$e(q(1).sub(xe(0,n.interactorRadius,Ke)).mul(n.interactorStrength).mul(n.interactorEnabled),0,1),nn=Le.div(Ke.max(q(1e-5)));return ne(Ye.add(nn.mul(vt).mul(n.bladeHeight).mul(.9).mul(J)),Ce,vt.mul(.25).mul(J))})();let te=n.baseColor;e.map&&(te=n.baseColor.mul(Ne(new Te(e.map),G).rgb));const ie=ne(te,n.tipColor,n.tipMix.mul(n.useExplicitTipColor));return m.vertexNode=Gt.mul(qt).mul(Xt(ke,1)),m.colorNode=ne(te,ie,ft(J,1.2)).mul(ne(q(.75),q(1.25),ae)).mul(ne(q(.82),q(1),se)).add(xe(.7,1,J).mul(.12)),m.opacityNode=se,m},[H,g,e.map,e.mesh,n]);o.useEffect(()=>()=>{g.dispose(),f.dispose()},[g,f]),o.useEffect(()=>{n.baseColor.value.copy(N),n.bladeHeight.value=E,n.curvature.value=w,n.interactorRadius.value=S,n.interactorStrength.value=L,n.noiseAmplitude.value=d,n.noiseFrequency.value=X,n.tipColor.value.copy(x),n.tipMix.value=c,n.useExplicitTipColor.value=p?1:0,n.waveAmplitude.value=O,n.waveDirection.value.copy(I),n.waveLength.value=u,n.waveSpeed.value=U,n.windStrength.value=V},[w,L,X,N,E,S,d,x,O,I,c,n,p,u,U,V]);const Q=o.useCallback(m=>{!A||!W.current||(m.stopPropagation(),M.current.copy(m.point),W.current.worldToLocal(M.current),n.interactorEnabled.value=1,n.interactorPos.value.copy(M.current))},[A,n]),C=o.useCallback(()=>{n.interactorEnabled.value=0},[n]);return ge((m,R)=>{n.time.value+=R,e.mesh?.skeleton?.update()}),!t||!e.mesh?null:_.jsxs(Ue,{ref:W,source:e,...T,children:[_.jsx("mesh",{frustumCulled:!1,geometry:t,material:f}),_.jsx(Fe,{onPointerDown:A?Q:void 0,onPointerLeave:A?C:void 0,onPointerMove:A?Q:void 0,showInteractionSurface:b,source:e})]})}const lo="/textures/fur/uneven-alpha.png";function co({source:e,count:t=5e3,bladeHeight:a=.045,bladeWidth:l=.008,alphaTexturePath:s=lo,rootColor:r=null,tipColor:c=null,tipMix:w=.18,curvature:V=.05,windStrength:X=.18,noiseFrequency:j=.4,noiseAmplitude:B=.02,waveAmplitude:u=.025,waveLength:U=.7,waveSpeed:z=1.2,waveDirection:A=[1,0],interactive:P=!0,interactionRadius:L=.18,interactionStrength:b=1.2,seed:T=1,showInteractionSurface:W=!1,...M}){const p=o.useRef(),h=o.useRef(new D),E=c!=null,S=e.radius||1,d=a*S,O=l*S,g=L*S,H=B*S,N=u*S,x=o.useMemo(()=>Yt(t,e.isSkinnedMesh),[t,e.isSkinnedMesh]),I=o.useMemo(()=>We(),[]),n=Ze(s),f=o.useMemo(()=>Kt({bladeWidth:O,isSkinnedMesh:e.isSkinnedMesh,seed:T,sourceGeometry:e.geometry,strandCount:x}),[O,x,T,e.geometry,e.isSkinnedMesh]),Q=f?.userData?.strandGeometryType==="skinned",C=o.useMemo(()=>{const G=e.baseColor.clone();return r&&G.set(r),G},[r,e.baseColor]),m=o.useMemo(()=>c?new be(c):e.baseColor.clone(),[e.baseColor,c]),R=o.useMemo(()=>ot(A),[A]),i=o.useMemo(()=>({baseColor:y(C.clone()),bladeHeight:y(d),curvature:y(V),interactorEnabled:y(0),interactorPos:y(new D(1e3,1e3,1e3)),interactorRadius:y(g),interactorStrength:y(b),noiseAmplitude:y(H),noiseFrequency:y(j),time:y(0),tipColor:y(m.clone()),tipMix:y(w),useExplicitTipColor:y(E?1:0),waveAmplitude:y(N),waveDirection:y(R.clone()),waveLength:y(U),waveSpeed:y(z),windStrength:y(X)}),[]),k=o.useMemo(()=>{if(!f||Q)return null;const G=new dt({alphaTest:.01,side:Se}),Y=_e(f.getAttribute("aOffset")),oe=_e(f.getAttribute("aScale")),re=_e(f.getAttribute("aPhase")),$=_e(f.getAttribute("aQuat")),ye=_e(f.getAttribute("aRootUv")),Ae=xe(q(.08),q(.65),Ne(new Te(n||I),et()).r),J=tt(([ee,K])=>{const ue=nt(ee.xyz,K);return K.add(nt(ee.xyz,ue.add(K.mul(ee.w))).mul(2))}),Z=$e(fe.y,0,1),ae=i.waveDirection.div(Ee(i.waveDirection).max(q(1e-4))),se=he(Y.x.mul(i.noiseFrequency.max(q(1e-4))).add(Y.z.mul(i.noiseFrequency.max(q(1e-4)))).add(Z.mul(4)).add(i.time.mul(.1))).mul(.5).add(.5),ke=tt(()=>{const ee=ce(fe.x,fe.y.mul(i.bladeHeight).mul(oe),fe.z).toVar(),K=i.time.add(re),ue=he(K.mul(1.3).add(Y.x.mul(.2))).add(mt(K.mul(.7).add(Y.z.mul(.15)))).mul(i.windStrength).mul(Z.mul(Z)),ze=he(Pe(Y.xz,ae).div(i.waveLength.max(q(1e-4))).mul(6.2831852).sub(i.time.mul(i.waveSpeed))).mul(i.waveAmplitude).mul(Z),we=J($,ee.add(ce(i.curvature.mul(Z).mul(Z),0,0)).add(ce(ue.mul(.4),0,ue.mul(.15))).add(ce(ae.x.mul(ze),0,ae.y.mul(ze))).add(ce(se.sub(.5).mul(i.noiseAmplitude).mul(Z),0,se.sub(.5).mul(i.noiseAmplitude).mul(Z).mul(.6)))).toVar(),Ce=J($,ce(0,1,0)).normalize().toVar(),Be=Y.sub(i.interactorPos).sub(Ce.mul(Pe(Y.sub(i.interactorPos),Ce))).toVar(),Ye=Ee(Be),Le=$e(q(1).sub(xe(0,i.interactorRadius,Ye)).mul(i.interactorStrength).mul(i.interactorEnabled),0,1),Ke=Be.div(Ye.max(q(1e-5)));return we.addAssign(Ke.mul(Le).mul(i.bladeHeight).mul(.9).mul(Z)),we.y.assign(we.y.mul(q(1).sub(Le.mul(.25).mul(Z)))),we.add(Y)})();let te=i.baseColor;e.map&&(te=i.baseColor.mul(Ne(new Te(e.map),ye).rgb));const ie=ne(te,i.tipColor,i.tipMix.mul(i.useExplicitTipColor));return G.positionNode=ke,G.colorNode=ne(te,ie,ft(Z,1.2)).mul(ne(q(.75),q(1.25),se)).mul(ne(q(.82),q(1),Ae)).add(xe(.7,1,Z).mul(.12)),G.opacityNode=Ae,G},[n,I,f,Q,e.map,i]);o.useEffect(()=>()=>{I.dispose(),k?.dispose()},[I,k]),o.useEffect(()=>{i.baseColor.value.copy(C),i.bladeHeight.value=d,i.curvature.value=V,i.interactorRadius.value=g,i.interactorStrength.value=b,i.noiseAmplitude.value=H,i.noiseFrequency.value=j,i.tipColor.value.copy(m),i.tipMix.value=w,i.useExplicitTipColor.value=E?1:0,i.waveAmplitude.value=N,i.waveDirection.value.copy(R),i.waveLength.value=U,i.waveSpeed.value=z,i.windStrength.value=X},[d,V,g,b,H,j,C,m,R,N,w,E,i,U,z,X]);const F=o.useCallback(G=>{!P||!p.current||(G.stopPropagation(),h.current.copy(G.point),p.current.worldToLocal(h.current),i.interactorEnabled.value=1,i.interactorPos.value.copy(h.current))},[P,i]),v=o.useCallback(()=>{i.interactorEnabled.value=0},[i]);return ge((G,Y)=>{i.time.value+=Y,!Q&&e.isSkinnedMesh&&e.mesh&&Jt(f,e.mesh)}),f?Q&&e.mesh?_.jsx(uo,{alphaTexturePath:s,bladeHeight:a,curvature:V,geometry:f,interactionRadius:L,interactionStrength:b,interactive:P,noiseAmplitude:B,noiseFrequency:j,rootColor:r,showInteractionSurface:W,source:e,tipColor:c,tipMix:w,waveAmplitude:u,waveDirection:A,waveLength:U,waveSpeed:z,windStrength:X,...M}):_.jsxs(Ue,{ref:p,source:e,...M,children:[_.jsx("mesh",{frustumCulled:!1,geometry:f,material:k}),_.jsx(Fe,{onPointerDown:P?F:void 0,onPointerLeave:P?v:void 0,onPointerMove:P?F:void 0,showInteractionSurface:W,source:e})]}):null}function fo({technique:e=De.strand,sourceGeometry:t=null,sourceMaterial:a=null,sourceMesh:l=null,...s}){const r=en({sourceGeometry:t,sourceMaterial:a,sourceMesh:l});return r.geometry?e===De.shell?_.jsx(ao,{...s,source:r}):e===De.strand?_.jsx(co,{...s,source:r}):null:null}function go(e){return pn(l=>l.gl)?.isWebGPURenderer===!0?_.jsx(fo,{...e}):_.jsx(Kn,{...e})}const tn=yn("/rabbit.glb");function mo(e,t,a){const l=e.map(s=>s.name);if(!l.length)return null;if(t&&l.includes(t))return t;if(a?.length)for(let s=0;s<a.length;s+=1){const r=a[s].toLowerCase(),c=l.find(w=>w.toLowerCase().includes(r));if(c)return c}return l[0]}const yo=o.forwardRef(function({autoPlay:t=!1,autoPlayClip:a=null,autoPlayPatterns:l=null,autoPlayTimeScale:s=1,castShadow:r=!1,customizeMaterial:c=null,onReady:w=null,outlineMaterial:V=null,playing:X=!0,startTime:j=0,...B},u){const U=o.useRef(),{scene:z,animations:A}=$t(tn),P=o.useMemo(()=>wn(z),[z]);hn(P);const L=o.useMemo(()=>A.map(M=>M.clone()),[A]),b=o.useMemo(()=>new xn(void 0),[]);o.useEffect(()=>()=>{b.stopAllAction(),U.current&&b.uncacheRoot(U.current)},[b]),ge((M,p)=>{X&&b.update(p)});const T=o.useMemo(()=>{const M=[];return P.traverse(p=>{p.isSkinnedMesh&&M.push(p)}),M},[P]),W=o.useMemo(()=>T.map(M=>M.material),[T]);return o.useImperativeHandle(u,()=>U.current),o.useLayoutEffect(()=>{const M=T.map((p,h)=>{const E=c?.(W[h],p)??null;return p.material=E??W[h],p.castShadow=r,E});return()=>{T.forEach((p,h)=>{p.material=W[h]}),M.forEach(p=>p?.dispose())}},[r,c,W,T]),o.useLayoutEffect(()=>{if(!V)return;const M=T.map(p=>{const h=new bn(p.geometry,V);return h.bind(p.skeleton,p.bindMatrix),h.position.copy(p.position),h.quaternion.copy(p.quaternion),h.scale.copy(p.scale),h.frustumCulled=!1,h.userData.plot=!1,p.parent.add(h),h});return()=>M.forEach(p=>p.removeFromParent())},[V,T]),o.useEffect(()=>{w?.({animations:L,mixer:b,scene:P})},[L,P,b,w]),o.useEffect(()=>{if(!t)return;const M=mo(L,a,l);if(!M)return;const p=L.find(E=>E.name===M),h=b.clipAction(p,U.current);return h.enabled=!0,h.clampWhenFinished=!1,h.timeScale=s,h.setLoop(gn,1/0).reset().fadeIn(.35).play(),j&&b.setTime(j),()=>{h.fadeOut(.2)}},[t,a,l,s,L,b,j]),_.jsx("group",{ref:U,...B,dispose:null,children:_.jsx("primitive",{object:P})})});$t.preload(tn);export{go as F,Rn as M,yo as R,In as a,De as b};
