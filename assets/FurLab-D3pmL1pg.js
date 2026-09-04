import{C as te,aA as ba,aB as Sa,aq as xa,U as At,f as lt,m as Ke,r as o,j as p,l as ke,a as Te,aP as ya,V as I,aK as ta,bf as rt,Z as aa,L as Pt,S as ge,bF as kt,Q as bt,bT as Ee,d5 as Ca,aT as Ma,b_ as Aa,b6 as Ae,D as Tt,a4 as pe,b as Pa,aL as St,an as Le,d as ra,aW as ka,aa as Ta,bb as Ia,ax as Ra,a3 as wa,az as be}from"./index-Dv5U39OI.js";import{u as Ie}from"./Texture-DAJ8OqfA.js";import{u as b,f as _,O as xt,aM as oe,a8 as Da,d as ne,T as xe,U as yt,aB as Be,ar as Pe,e as ae,c as Wa,r as ye,a as Ea,C as Ce,t as Fe,k as nt,bt as na,bu as oa,j as sa,av as Se,bv as Na,F as ot,M as st,o as ia,aY as Ye}from"./three.tsl-DoeFUlGW.js";import{R as La}from"./Rabbit-DAa83lxG.js";import{n as Ba,s as It}from"./perlinNoiseNodes-Cm4Y69_6.js";import{u as Fa}from"./usePresetsFolder-fnRKggwH.js";import{P as Ua}from"./PerspectiveCamera-1Kr8QWI0.js";import{O as za}from"./OrbitControls-BzC2HmNe.js";import"./SkeletonUtils-BCVmgslc.js";import"./Gltf-CEEvIi53.js";import"./constants-rECXOw_Z.js";import"./useAnimations-DcB1lcc5.js";import"./extends-CF3RwP-h.js";import"./Fbo-KvbySqls.js";const he=Object.freeze({shell:"shell",strand:"strand"}),_a=24,la=24e3,ua=1e5;function Oa(e){return e&&typeof e=="object"&&Object.prototype.hasOwnProperty.call(e,"current")?e.current:e}function pt(e){return Array.isArray(e)?e[0]??null:e??null}function Rt(e){const a=Oa(e);if(!a)return null;if(a.isMesh||a.isSkinnedMesh)return a;let s=null;return a.traverse?.(c=>{!s&&(c.isMesh||c.isSkinnedMesh)&&(s=c)}),s}function ja(e,a="#ffffff"){const s=new te(a);return e?.color?.isColor?(s.copy(e.color),s):(e?.color!==void 0&&s.set(e.color),s)}function Va(e){return pt(e)?.map??null}function Ya(e,a=1){if(!e)return a;e.boundingSphere||e.computeBoundingSphere();const s=e.boundingSphere?.radius;return!Number.isFinite(s)||s<=1e-6?a:s}function ut(e=[1,0]){const a=new Ke(Number.isFinite(e?.[0])?e[0]:1,Number.isFinite(e?.[1])?e[1]:0);return a.lengthSq()<=1e-6&&a.set(1,0),a.normalize()}function Ha(e,a){!e||!a||(e.position.copy(a.position),e.quaternion.copy(a.quaternion),e.scale.copy(a.scale))}function wt(e=1){let a=Math.floor(e)%2147483647;return a<=0&&(a+=2147483646),()=>(a=a*16807%2147483647,(a-1)/2147483646)}function Ue(e="#ffffff"){const a=new te(e),s=new Uint8Array([Math.round(a.r*255),Math.round(a.g*255),Math.round(a.b*255),255]),c=new ba(s,1,1,Sa);return c.colorSpace=xa,c.generateMipmaps=!1,c.magFilter=At,c.minFilter=At,c.needsUpdate=!0,c}function ca(e=18){return lt.clamp(Math.round(e),1,_a)}function da(e=5e3,a=!1){return lt.clamp(Math.round(e),1,a?ua:la)}const ct=o.forwardRef(function({sourceMesh:a,geometry:s=null,material:c=null,children:t=null,...n},l){const x=o.useRef();return o.useImperativeHandle(l,()=>x.current),o.useLayoutEffect(()=>{!x.current||!a?.skeleton||!a?.bindMatrix||(x.current.bindMode=a.bindMode,x.current.bind(a.skeleton,a.bindMatrix))},[a]),a?.skeleton?p.jsx("skinnedMesh",{ref:x,geometry:s||a.geometry,material:c,skeleton:a.skeleton,...n,children:t}):null});function ze({onPointerDown:e,onPointerLeave:a,onPointerMove:s,showInteractionSurface:c=!1,source:t}){const n=c,l={color:n?"#39ff96":"#ffffff",depthTest:!n,depthWrite:!1,opacity:n?.95:0,polygonOffset:!1,polygonOffsetFactor:0,polygonOffsetUnits:0,side:ke,transparent:!0,wireframe:n};return t.isSkinnedMesh&&t.mesh?p.jsx(ct,{frustumCulled:!1,onPointerDown:e,onPointerLeave:a,onPointerMove:s,sourceMesh:t.mesh,children:p.jsx("meshBasicMaterial",{...l})}):p.jsx("mesh",{geometry:t.geometry,onPointerDown:e,onPointerLeave:a,onPointerMove:s,children:p.jsx("meshBasicMaterial",{...l})})}const _e=o.forwardRef(function({children:a,source:s,...c},t){const n=o.useRef();o.useImperativeHandle(t,()=>n.current),Te(()=>{s?.mesh&&n.current&&Ha(n.current,s.mesh)});const l=o.useMemo(()=>p.jsx("group",{ref:n,...c,children:a}),[a,c]);return s?.mesh?.parent?ya(l,s.mesh.parent):l}),Dt=[.6,.6,.6,1],Wt=[1,1,1,0],Ga="/textures/fur/uneven-alpha.png";function Et(){return null}const qa=`
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
`,Xa=`
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
`;function Nt(e,a){const s=Array.isArray(e)?e:a;return{alpha:s[3]??a[3],color:new te(s[0],s[1],s[2])}}function Za({alphaMap:e,alphaEnd:a,alphaStart:s,baseColor:c,colorEnd:t,colorStart:n,fallbackTexture:l,layerIndex:x,layerThickness:R,layersCount:k,source:T,interactionRadius:C,interactionStrength:u,stiffness:A,waveScale:v}){const m=new aa({depthWrite:!1,fragmentShader:Xa,side:ke,transparent:!0,uniforms:{uAlphaEnd:{value:a},uAlphaMap:{value:e||l},uAlphaStart:{value:s},uBaseColor:{value:c.clone()},uColorEnd:{value:t.clone()},uColorStart:{value:n.clone()},uInteractorEnabled:{value:0},uInteractorDir:{value:new I(1,0,0)},uInteractorNormal:{value:new I(0,1,0)},uInteractorPos:{value:new I(1e3,1e3,1e3)},uInteractorRadius:{value:C},uInteractorStrength:{value:u},uLayerIndex:{value:x},uLayerThickness:{value:R},uLayersCount:{value:k},uSourceMap:{value:T.map||l},uStiffness:{value:A},uTime:{value:0},uUseSourceMap:{value:T.map?1:0},uWaveScale:{value:v}},vertexShader:qa});return m.skinning=T.isSkinnedMesh,m}function Qa({source:e,layers:a=null,shellCount:s=20,thickness:c=null,shellSpacing:t=null,waveScale:n=.06,stiffness:l=2.75,startColor:x=Dt,endColor:R=Wt,alphaTexturePath:k=Ga,rootColor:T=null,interactive:C=!1,interactionRadius:u=.18,interactionStrength:A=1.2,showInteractionSurface:v=!1,...m}){const w=o.useRef(),D=o.useRef(new I),Y=o.useRef(new I(0,1,0)),W=o.useRef(new I),j=o.useRef(new I(1,0,0)),M=o.useRef(),F=o.useMemo(()=>Ue(),[]),P=Ie(k),H=C||v,U=o.useMemo(()=>ca(a??s),[a,s]),f=o.useMemo(()=>{const d=e.baseColor.clone();return T&&d.set(T),d},[T,e.baseColor]),E=o.useMemo(()=>Nt(x,Dt),[x]),S=o.useMemo(()=>Nt(R,Wt),[R]),O=c??t??.018,B=u*(e.radius||1),y=n,N=B,r=o.useMemo(()=>Array.from({length:U},(d,h)=>Za({alphaMap:P,alphaEnd:S.alpha,alphaStart:E.alpha,baseColor:f,colorEnd:S.color,colorStart:E.color,fallbackTexture:F,interactionRadius:B,interactionStrength:A,layerIndex:h,layerThickness:O,layersCount:U,source:e,stiffness:l,waveScale:y})),[P,F,f,S.alpha,S.color,B,A,U,O,E.alpha,E.color,y,e,l]);o.useEffect(()=>{P&&(P.colorSpace=ta,P.wrapS=rt,P.wrapT=rt,P.needsUpdate=!0)},[P]),o.useEffect(()=>()=>{F.dispose()},[F]),o.useEffect(()=>()=>{r.forEach(d=>d.dispose())},[r]),o.useEffect(()=>{r.forEach((d,h)=>{const{uniforms:i}=d;i.uAlphaEnd.value=S.alpha,i.uAlphaMap.value=P||F,i.uAlphaStart.value=E.alpha,i.uBaseColor.value.copy(f),i.uColorEnd.value.copy(S.color),i.uColorStart.value.copy(E.color),i.uInteractorRadius.value=B,i.uInteractorStrength.value=A,i.uLayerIndex.value=h,i.uLayerThickness.value=O,i.uLayersCount.value=U,i.uSourceMap.value=e.map||F,i.uStiffness.value=l,i.uUseSourceMap.value=e.map?1:0,i.uWaveScale.value=y})},[P,F,r,f,S.alpha,S.color,B,A,U,O,E.alpha,E.color,y,e.map,l]);const g=o.useCallback(()=>{!M.current||!v||(M.current.visible=!0,M.current.position.copy(D.current))},[v]),G=o.useCallback(d=>{if(!C||!w.current)return;d.stopPropagation(),D.current.copy(d.point),w.current.worldToLocal(D.current),d.face?.normal&&Y.current.copy(d.face.normal).normalize();const h=new I().subVectors(D.current,W.current);h.lengthSq()>1e-8&&j.current.copy(h.normalize()),W.current.copy(D.current),r.forEach(i=>{const V=i.uniforms;V.uInteractorEnabled.value=1,V.uInteractorDir.value.copy(j.current),V.uInteractorNormal.value.copy(Y.current),V.uInteractorPos.value.copy(D.current)}),g()},[C,r,g]),z=o.useCallback(()=>{r.forEach(d=>{const h=d.uniforms;h.uInteractorEnabled.value=0,h.uInteractorDir.value.set(1,0,0),h.uInteractorNormal.value.set(0,1,0)}),M.current&&(M.current.visible=!1)},[r]);return o.useEffect(()=>{M.current&&(M.current.visible=!1)},[v]),Te((d,h)=>{r.forEach(i=>{const V=i.uniforms;V.uTime.value+=h})}),p.jsxs(_e,{ref:w,source:e,...m,children:[r.map((d,h)=>e.isSkinnedMesh&&e.mesh?p.jsx(ct,{frustumCulled:!1,material:d,raycast:Et,renderOrder:20+h,sourceMesh:e.mesh},d.uuid):p.jsx("mesh",{frustumCulled:!1,geometry:e.geometry,material:d,raycast:Et,renderOrder:20+h},d.uuid)),H?p.jsx(ze,{onPointerDown:C?G:void 0,onPointerLeave:C?z:void 0,onPointerMove:C?G:void 0,showInteractionSurface:v,source:e}):null,v?p.jsxs("mesh",{ref:M,renderOrder:200,children:[p.jsx("sphereGeometry",{args:[N,20,20]}),p.jsx("meshBasicMaterial",{color:"#00ff88",depthTest:!1,depthWrite:!1,opacity:.95,transparent:!0,wireframe:!0})]}):null]})}const $a="/textures/fur/uneven-alpha.png",Ka=`
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
`,Ja=`
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
`;function er({source:e,geometry:a,bladeHeight:s=.045,alphaTexturePath:c=$a,rootColor:t=null,tipColor:n=null,tipMix:l=.18,curvature:x=.05,windStrength:R=.18,noiseFrequency:k=.4,noiseAmplitude:T=.02,waveAmplitude:C=.025,waveLength:u=.7,waveSpeed:A=1.2,waveDirection:v=[1,0],interactive:m=!0,interactionRadius:w=.18,interactionStrength:D=1.2,showInteractionSurface:Y=!1,...W}){const j=o.useRef(),M=o.useRef(new I),F=n!=null,P=e.radius||1,H=s*P,U=w*P,f=T*P,E=C*P,S=o.useMemo(()=>Ue(),[]),O=Ie(c),B=o.useMemo(()=>{const z=e.baseColor.clone();return t&&z.set(t),z},[t,e.baseColor]),y=o.useMemo(()=>n?new te(n):e.baseColor.clone(),[e.baseColor,n]),N=o.useMemo(()=>ut(v),[v]),r=o.useMemo(()=>{const z=new aa({fragmentShader:Ja,side:ke,uniforms:{uAlphaMap:{value:O||S},uBaseColor:{value:B.clone()},uBladeHeight:{value:H},uCurvature:{value:x},uInteractorEnabled:{value:0},uInteractorPos:{value:new I(1e3,1e3,1e3)},uInteractorRadius:{value:U},uInteractorStrength:{value:D},uNoiseAmplitude:{value:f},uNoiseFrequency:{value:k},uSourceMap:{value:e.map||S},uTime:{value:0},uTipColor:{value:y.clone()},uTipMix:{value:l},uUseExplicitTipColor:{value:F?1:0},uUseSourceMap:{value:e.map?1:0},uWaveAmplitude:{value:E},uWaveDirection:{value:N.clone()},uWaveLength:{value:u},uWaveSpeed:{value:A},uWindStrength:{value:R}},vertexShader:Ka});return z.skinning=!0,z},[]);o.useEffect(()=>()=>{S.dispose(),r.dispose()},[S,r]),o.useEffect(()=>{r.uniforms.uAlphaMap.value=O||S,r.uniforms.uBaseColor.value.copy(B),r.uniforms.uBladeHeight.value=H,r.uniforms.uCurvature.value=x,r.uniforms.uInteractorRadius.value=U,r.uniforms.uInteractorStrength.value=D,r.uniforms.uNoiseAmplitude.value=f,r.uniforms.uNoiseFrequency.value=k,r.uniforms.uSourceMap.value=e.map||S,r.uniforms.uTipColor.value.copy(y),r.uniforms.uTipMix.value=l,r.uniforms.uUseExplicitTipColor.value=F?1:0,r.uniforms.uUseSourceMap.value=e.map?1:0,r.uniforms.uWaveAmplitude.value=E,r.uniforms.uWaveDirection.value.copy(N),r.uniforms.uWaveLength.value=u,r.uniforms.uWaveSpeed.value=A,r.uniforms.uWindStrength.value=R},[O,x,S,D,r,k,B,H,U,f,y,E,N,e.map,l,F,u,A,R]);const g=o.useCallback(z=>{!m||!j.current||(z.stopPropagation(),M.current.copy(z.point),j.current.worldToLocal(M.current),r.uniforms.uInteractorEnabled.value=1,r.uniforms.uInteractorPos.value.copy(M.current))},[m,r]),G=o.useCallback(()=>{r.uniforms.uInteractorEnabled.value=0},[r]);return Te((z,d)=>{r.uniforms.uTime.value+=d}),!a||!e.mesh?null:p.jsxs(_e,{ref:j,source:e,...W,children:[p.jsx(ct,{frustumCulled:!1,geometry:a,material:r,sourceMesh:e.mesh}),p.jsx(ze,{onPointerDown:m?g:void 0,onPointerLeave:m?G:void 0,onPointerMove:m?g:void 0,showInteractionSurface:Y,source:e})]})}const dt=new I,mt=new I,Lt=new I,Bt=new Pa,He=new bt,Ge=new I,qe=new I,Ft=new I,Ut=new pe,zt=new pe,_t=new pe,Ot=new pe,Xe=new pe,jt=new pe,Vt=new pe,Yt=new pe,Ht=new pe,fe=new I,Ze=new I,Ne=new I,Qe=new I,$e=new I,ve=new I,ft=3,tr=.65,ar=1.5,rr=.82,nr=1.12;function or(e,a,s=Math.random,c={normals:new Float32Array(a*3),positions:new Float32Array(a*3),uvs:new Float32Array(a*2)}){const t=c;let n=e;n.index||(n=n.toNonIndexed());const l=n.getAttribute("position");if(!l)throw new Error("Strand fur source geometry is missing a position attribute.");n.getAttribute("normal")||n.computeVertexNormals();const x=n.getAttribute("normal"),R=n.getAttribute("skinIndex"),k=n.getAttribute("skinWeight"),T=n.getAttribute("uv"),C=!!(R&&k),u=n.index?.array,A=u?u.length/3:l.count/3,v=new Float32Array(A),m=new I,w=new I,D=new I,Y=new I,W=new I,j=new I,M=new I,F=new I,P=new I,H=new Map,U=new Ke,f=new Ke,E=new Ke,S=new Ke;C&&(t.skinIndices||=new Float32Array(a*4),t.skinWeights||=new Float32Array(a*4));let O=0;for(let y=0;y<A;y+=1){const N=u?u[y*3]:y*3,r=u?u[y*3+1]:y*3+1,g=u?u[y*3+2]:y*3+2;m.fromBufferAttribute(l,N),w.fromBufferAttribute(l,r),D.fromBufferAttribute(l,g),O+=Y.copy(w).sub(m).cross(W.copy(D).sub(m)).length()*.5,v[y]=O}const B=y=>{let N=0,r=A-1;for(;N<r;){const g=Math.floor((N+r)/2);y<=v[g]?r=g:N=g+1}return N};for(let y=0;y<a;y+=1){const N=B(s()*O),r=u?u[N*3]:N*3,g=u?u[N*3+1]:N*3+1,G=u?u[N*3+2]:N*3+2;let z=s(),d=s();z+d>1&&(z=1-z,d=1-d);const h=1-z-d;if(m.fromBufferAttribute(l,r),w.fromBufferAttribute(l,g),D.fromBufferAttribute(l,G),t.positions[y*3]=m.x*h+w.x*z+D.x*d,t.positions[y*3+1]=m.y*h+w.y*z+D.y*d,t.positions[y*3+2]=m.z*h+w.z*z+D.z*d,M.fromBufferAttribute(x,r),F.fromBufferAttribute(x,g),P.fromBufferAttribute(x,G),j.copy(M).multiplyScalar(h).addScaledVector(F,z).addScaledVector(P,d).normalize(),t.normals[y*3]=j.x,t.normals[y*3+1]=j.y,t.normals[y*3+2]=j.z,C){H.clear(),Ut.fromBufferAttribute(R,r),zt.fromBufferAttribute(R,g),_t.fromBufferAttribute(R,G),Vt.fromBufferAttribute(k,r),Yt.fromBufferAttribute(k,g),Ht.fromBufferAttribute(k,G),[[Ut,Vt,h],[zt,Yt,z],[_t,Ht,d]].forEach(([X,L,Z])=>{for(let $=0;$<4;$+=1){const se=X.getComponent($),ce=L.getComponent($)*Z;Number.isFinite(se)&&ce>1e-5&&H.set(se,(H.get(se)||0)+ce)}});const i=Array.from(H.entries()).sort((X,L)=>L[1]-X[1]).slice(0,4),V=i.reduce((X,[,L])=>X+L,0);for(let X=0;X<4;X+=1){const L=y*4+X,Z=i[X];t.skinIndices[L]=Z?.[0]??0,t.skinWeights[L]=Z?Z[1]/Math.max(V,1e-6):0}}T?(U.fromBufferAttribute(T,r),f.fromBufferAttribute(T,g),E.fromBufferAttribute(T,G),S.copy(U).multiplyScalar(h).addScaledVector(f,z).addScaledVector(E,d),t.uvs[y*2]=S.x,t.uvs[y*2+1]=S.y):(t.uvs[y*2]=0,t.uvs[y*2+1]=0)}return t}function gt(e,a=new bt){const s=new I(0,1,0);if(s.dot(e)<-.9995){const c=new I(1,0,0).cross(s);return c.lengthSq()<1e-6&&c.set(0,0,1),c.normalize(),a.setFromAxisAngle(c,Math.PI),a}return a.setFromUnitVectors(s,e.clone().normalize()),a}function ma({bladeWidth:e=.008,isSkinnedMesh:a=!1,seed:s=1,sourceGeometry:c,strandCount:t=4e3}){if(!c)return null;const n=Math.max(5e-4,Math.min(.5,e*.5)),l=ft*3,x=new Float32Array(l*3),R=new Float32Array(l*2),k=new Float32Array(l*3),T=new Uint16Array(l),C=new Pt;for(let f=0;f<ft;f+=1){const E=Math.PI/ft*f,S=Math.cos(E),O=Math.sin(E),B=f*3,y=f*6;fe.set(-n,0,0),Ze.set(fe.x*S-fe.z*O,fe.y,fe.x*O+fe.z*S),Ne.copy(Ze),fe.set(n,0,0),Ze.set(fe.x*S-fe.z*O,fe.y,fe.x*O+fe.z*S),Qe.copy(Ze),$e.set(0,1,0),ve.copy(Qe).sub(Ne).cross(Ze.copy($e).sub(Ne)).normalize(),x.set([Ne.x,Ne.y,Ne.z,Qe.x,Qe.y,Qe.z,$e.x,$e.y,$e.z],B*3),R.set([0,0,1,0,.5,1],y),k.set([ve.x,ve.y,ve.z,ve.x,ve.y,ve.z,ve.x,ve.y,ve.z],B*3),T.set([B,B+1,B+2],B)}C.setAttribute("position",new ge(x,3)),C.setAttribute("uv",new ge(R,2)),C.setAttribute("normal",new ge(k,3)),C.setIndex(new ge(T,1));const u=or(c,t,wt(s)),A=wt(s*17+5),v=new I,m=new bt,w=a?rr:tr,Y=(a?nr:ar)-w;if(a&&u.skinIndices&&u.skinWeights){const f=C.getAttribute("position").count,E=C.index.count,S=f*t,O=E*t,B=C.getAttribute("position").array,y=C.getAttribute("uv").array,N=C.getAttribute("normal").array,r=C.index.array,g=new Pt,G=new Float32Array(S*3),z=new Float32Array(S*2),d=new Float32Array(S*3),h=8,i=6,V=new Float32Array(S*h),X=new Float32Array(S*i),L=new Uint16Array(S*4),Z=new Float32Array(S*4),$=S>65535?new Uint32Array(O):new Uint16Array(O),se=new kt(V,h),ce=new kt(X,i);for(let q=0;q<t;q+=1){const Me=w+A()*Y,Re=A()*Math.PI*2,J=q*f;v.set(u.normals[q*3],u.normals[q*3+1],u.normals[q*3+2]).normalize(),gt(v,m);for(let Q=0;Q<f;Q+=1){const ie=J+Q,le=ie*3,we=ie*2,re=ie*4,de=ie*h,ee=ie*i,K=Q*3,me=Q*2;G[le]=B[K],G[le+1]=B[K+1],G[le+2]=B[K+2],d[le]=N[K],d[le+1]=N[K+1],d[le+2]=N[K+2],z[we]=y[me],z[we+1]=y[me+1],V[de]=u.positions[q*3],V[de+1]=u.positions[q*3+1],V[de+2]=u.positions[q*3+2],V[de+3]=u.normals[q*3],V[de+4]=u.normals[q*3+1],V[de+5]=u.normals[q*3+2],V[de+6]=u.uvs[q*2],V[de+7]=u.uvs[q*2+1],X[ee]=Me,X[ee+1]=Re,X[ee+2]=m.x,X[ee+3]=m.y,X[ee+4]=m.z,X[ee+5]=m.w,L[re]=u.skinIndices[q*4],L[re+1]=u.skinIndices[q*4+1],L[re+2]=u.skinIndices[q*4+2],L[re+3]=u.skinIndices[q*4+3],Z[re]=u.skinWeights[q*4],Z[re+1]=u.skinWeights[q*4+1],Z[re+2]=u.skinWeights[q*4+2],Z[re+3]=u.skinWeights[q*4+3]}for(let Q=0;Q<E;Q+=1)$[q*E+Q]=r[Q]+J}return g.setAttribute("position",new ge(G,3)),g.setAttribute("uv",new ge(z,2)),g.setAttribute("normal",new ge(d,3)),g.setAttribute("aRootPosition",new Ee(se,3,0)),g.setAttribute("aRootNormal",new Ee(se,3,3)),g.setAttribute("aScale",new Ee(ce,1,0)),g.setAttribute("aPhase",new Ee(ce,1,1)),g.setAttribute("aQuat",new Ee(ce,4,2)),g.setAttribute("aRootUv",new Ee(se,2,6)),g.setAttribute("skinIndex",new Ca(L,4)),g.setAttribute("skinWeight",new Ma(Z,4)),g.setIndex(new ge($,1)),g.userData.furSkinning=null,g.userData.strandGeometryType="skinned",g}const W=new Aa;W.index=C.index,W.attributes.position=C.attributes.position,W.attributes.uv=C.attributes.uv,W.attributes.normal=C.attributes.normal;const j=new Float32Array(t*3),M=new Float32Array(t*3),F=new Float32Array(t),P=new Float32Array(t),H=new Float32Array(t*4),U=new Float32Array(t*2);for(let f=0;f<t;f+=1)j[f*3]=u.positions[f*3],j[f*3+1]=u.positions[f*3+1],j[f*3+2]=u.positions[f*3+2],M[f*3]=u.normals[f*3],M[f*3+1]=u.normals[f*3+1],M[f*3+2]=u.normals[f*3+2],v.set(u.normals[f*3],u.normals[f*3+1],u.normals[f*3+2]).normalize(),gt(v,m),H[f*4]=m.x,H[f*4+1]=m.y,H[f*4+2]=m.z,H[f*4+3]=m.w,U[f*2]=u.uvs[f*2],U[f*2+1]=u.uvs[f*2+1],F[f]=w+A()*Y,P[f]=A()*Math.PI*2;return W.setAttribute("aOffset",new Ae(j,3)),W.setAttribute("aRootPosition",new Ae(j,3)),W.setAttribute("aRootNormal",new Ae(M,3)),W.setAttribute("aScale",new Ae(F,1)),W.setAttribute("aPhase",new Ae(P,1)),W.setAttribute("aQuat",new Ae(H,4)),W.setAttribute("aRootUv",new Ae(U,2)),u.skinIndices&&u.skinWeights?(W.userData.furSkinning={bindNormals:u.normals,bindPositions:u.positions,skinIndices:u.skinIndices,skinWeights:u.skinWeights},W.getAttribute("aOffset").setUsage(Tt),W.getAttribute("aQuat").setUsage(Tt)):W.userData.furSkinning=null,W.instanceCount=t,W.userData.strandGeometryType="instanced",W}function Gt(e,a,s,c,t){Ot.set(a.x,a.y,a.z,1).applyMatrix4(e.bindMatrix),Xe.set(0,0,0,0);for(let n=0;n<4;n+=1){const l=c[n];l>1e-5&&(Bt.fromArray(e.skeleton.boneMatrices,s[n]*16),jt.copy(Ot).applyMatrix4(Bt),Xe.addScaledVector(jt,l))}return t.set(Xe.x,Xe.y,Xe.z),t.applyMatrix4(e.bindMatrixInverse),t}function fa(e,a){const s=e?.userData?.furSkinning;if(!s||!a?.isSkinnedMesh||!a.skeleton)return!1;const c=e.getAttribute("aOffset"),t=e.getAttribute("aQuat");if(!c||!t)return!1;a.skeleton.update();for(let n=0;n<c.count;n+=1)dt.fromArray(s.bindPositions,n*3),mt.fromArray(s.bindNormals,n*3).normalize(),Lt.copy(dt).addScaledVector(mt,.025),Gt(a,dt,s.skinIndices.subarray(n*4,n*4+4),s.skinWeights.subarray(n*4,n*4+4),qe),Gt(a,Lt,s.skinIndices.subarray(n*4,n*4+4),s.skinWeights.subarray(n*4,n*4+4),Ft),Ge.copy(Ft).sub(qe),Ge.lengthSq()<=1e-6?Ge.copy(mt):Ge.normalize(),gt(Ge,He),c.setXYZ(n,qe.x,qe.y,qe.z),t.setXYZW(n,He.x,He.y,He.z,He.w);return c.needsUpdate=!0,t.needsUpdate=!0,!0}const sr="/textures/fur/uneven-alpha.png",ir=`
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
`,lr=`
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
`;function ur({source:e,count:a=5e3,bladeHeight:s=.045,bladeWidth:c=.008,alphaTexturePath:t=sr,rootColor:n=null,tipColor:l=null,tipMix:x=.18,curvature:R=.05,windStrength:k=.18,noiseFrequency:T=.4,noiseAmplitude:C=.02,waveAmplitude:u=.025,waveLength:A=.7,waveSpeed:v=1.2,waveDirection:m=[1,0],interactive:w=!0,interactionRadius:D=.18,interactionStrength:Y=1.2,seed:W=1,showInteractionSurface:j=!1,...M}){const F=o.useRef(),P=o.useRef(new I),H=l!=null,U=e.radius||1,f=s*U,E=c*U,S=D*U,O=C*U,B=u*U,y=o.useMemo(()=>da(a,e.isSkinnedMesh),[a,e.isSkinnedMesh]),N=o.useMemo(()=>Ue(),[]),r=Ie(t),g=o.useMemo(()=>ma({bladeWidth:E,isSkinnedMesh:e.isSkinnedMesh,seed:W,sourceGeometry:e.geometry,strandCount:y}),[E,y,W,e.geometry,e.isSkinnedMesh]),G=g?.userData?.strandGeometryType==="skinned",z=o.useMemo(()=>{const L=e.baseColor.clone();return n&&L.set(n),L},[n,e.baseColor]),d=o.useMemo(()=>l?new te(l):e.baseColor.clone(),[e.baseColor,l]),h=o.useMemo(()=>ut(m),[m]),i=o.useRef({uAlphaMap:{value:r||N},uBaseColor:{value:z.clone()},uBladeHeight:{value:f},uCurvature:{value:R},uInteractorEnabled:{value:0},uInteractorPos:{value:new I(1e3,1e3,1e3)},uInteractorRadius:{value:S},uInteractorStrength:{value:Y},uNoiseAmplitude:{value:O},uNoiseFrequency:{value:T},uSourceMap:{value:e.map||N},uTime:{value:0},uTipColor:{value:d.clone()},uTipMix:{value:x},uUseExplicitTipColor:{value:H?1:0},uUseSourceMap:{value:e.map?1:0},uWaveAmplitude:{value:B},uWaveDirection:{value:h.clone()},uWaveLength:{value:A},uWaveSpeed:{value:v},uWindStrength:{value:k}});o.useEffect(()=>()=>N.dispose(),[N]),o.useEffect(()=>{const L=i.current;L.uAlphaMap.value=r||N,L.uBaseColor.value.copy(z),L.uTipColor.value.copy(d),L.uBladeHeight.value=f,L.uCurvature.value=R,L.uInteractorRadius.value=S,L.uInteractorStrength.value=Y,L.uNoiseAmplitude.value=O,L.uNoiseFrequency.value=T,L.uSourceMap.value=e.map||N,L.uTipMix.value=x,L.uUseExplicitTipColor.value=H?1:0,L.uUseSourceMap.value=e.map?1:0,L.uWaveAmplitude.value=B,L.uWaveDirection.value.copy(h),L.uWaveLength.value=A,L.uWaveSpeed.value=v,L.uWindStrength.value=k},[r,f,R,N,S,Y,O,T,z,d,h,B,e.map,x,H,A,v,k]);const V=o.useCallback(L=>{!w||!F.current||(L.stopPropagation(),P.current.copy(L.point),F.current.worldToLocal(P.current),i.current.uInteractorEnabled.value=1,i.current.uInteractorPos.value.copy(P.current))},[w]),X=o.useCallback(()=>{i.current.uInteractorEnabled.value=0},[]);return Te((L,Z)=>{i.current.uTime.value+=Z,!G&&e.isSkinnedMesh&&e.mesh&&fa(g,e.mesh)}),g?G&&e.mesh?p.jsx(er,{alphaTexturePath:t,bladeHeight:s,curvature:R,geometry:g,interactionRadius:D,interactionStrength:Y,interactive:w,noiseAmplitude:C,noiseFrequency:T,rootColor:n,showInteractionSurface:j,source:e,tipColor:l,tipMix:x,waveAmplitude:u,waveDirection:m,waveLength:A,waveSpeed:v,windStrength:k,...M}):p.jsxs(_e,{ref:F,source:e,...M,children:[p.jsx("mesh",{frustumCulled:!1,geometry:g,children:p.jsx("rawShaderMaterial",{fragmentShader:lr,side:ke,uniforms:i.current,vertexShader:ir})}),p.jsx(ze,{onPointerDown:w?V:void 0,onPointerLeave:w?X:void 0,onPointerMove:w?V:void 0,showInteractionSurface:j,source:e})]}):null}function va({sourceGeometry:e=null,sourceMaterial:a=null,sourceMesh:s=null}){const[c,t]=o.useState(()=>Rt(s));return o.useLayoutEffect(()=>{const n=Rt(s);n!==c&&t(n)},[c,s]),o.useMemo(()=>{const n=pt(a)||pt(c?.material);return{baseColor:ja(n),geometry:e||c?.geometry||null,isSkinnedMesh:c?.isSkinnedMesh===!0,map:Va(n),material:n,mesh:c,radius:Ya(e||c?.geometry)}},[c,e,a])}function cr({technique:e=he.strand,sourceGeometry:a=null,sourceMaterial:s=null,sourceMesh:c=null,...t}){const n=va({sourceGeometry:a,sourceMaterial:s,sourceMesh:c});return n.geometry?e===he.shell?p.jsx(Qa,{...t,source:n}):e===he.strand?p.jsx(ur,{...t,source:n}):null:null}const qt=[.6,.6,.6,1],Xt=[1,1,1,0],dr="/textures/fur/uneven-alpha.png",mr=6.2831852,fr=.1376,vr=.3726,hr=.2546;function Zt(){return null}function Qt(e,a){const s=Array.isArray(e)?e:a;return{alpha:s[3]??a[3],color:new te(s[0],s[1],s[2])}}function pr({alphaEnd:e,alphaMap:a,alphaStart:s,baseColor:c,colorEnd:t,colorStart:n,layerIndex:l,layerThickness:x,layersCount:R,sourceMap:k,interactionRadius:T,interactionStrength:C,stiffness:u,useSourceMap:A,waveScale:v}){const m={alphaEnd:b(e),alphaStart:b(s),baseColor:b(c.clone()),colorEnd:b(t.clone()),colorStart:b(n.clone()),interactorEnabled:b(0),interactorDir:b(new I(1,0,0)),interactorNormal:b(new I(0,1,0)),interactorPos:b(new I(1e3,1e3,1e3)),interactorRadius:b(T),interactorStrength:b(C),layerIndex:b(l),layerThickness:b(x),layersCount:b(R),stiffness:b(u),time:b(0),useSourceMap:b(A?1:0),waveScale:b(v)},w=new St({alphaTest:.001,depthWrite:!1,side:ke,transparent:!0}),D=m.layerIndex.div(m.layersCount.max(_(1))),Y=m.layerIndex.add(1).mul(m.layerThickness),W=m.waveScale.mul(xt(D.max(_(1e-4)),m.stiffness)),j=m.time.mul(mr),M=oe.toVar(),F=Da.normalize().toVar(),P=m.interactorNormal.normalize(),H=ne(M.x.add(F.x.mul(Y)).add(xe(j.add(M.x.add(M.y).add(M.z).mul(fr))).mul(W)),M.y.add(F.y.mul(Y)).add(yt(j.add(M.x.sub(M.y).add(M.z).mul(vr))).mul(W)),M.z.add(F.z.mul(Y)).add(xe(j.add(M.x.add(M.y).sub(M.z).mul(hr))).mul(W))),U=H.sub(m.interactorPos).toVar(),f=Be(U,P).toVar(),E=U.sub(P.mul(f)).toVar(),S=Pe(E),O=E.div(S.max(_(1e-5))),B=m.interactorDir.sub(P.mul(Be(m.interactorDir,P))).toVar(),y=Pe(B),N=ae(O,B.div(y.max(_(1e-5))),Wa(_(1e-4),y)),r=m.layerThickness.mul(2).max(m.interactorRadius.mul(.08)),g=_(1).sub(ye(r,r.mul(2.5),Ea(f.sub(Y)))),G=ae(_(1),_(.45),D),z=ae(_(.35),_(1),D),d=_(1).sub(ye(0,m.interactorRadius,S)).mul(g).mul(m.interactorStrength).mul(m.interactorEnabled),h=Ce(d.mul(G).mul(.32),0,.6),i=ae(H.add(N.mul(d).mul(z).mul(.85)),M,h).sub(F.mul(d).mul(G).mul(.08));let V=m.baseColor;k&&(V=ae(m.baseColor,m.baseColor.mul(Fe(new Le(k),nt()).rgb),m.useSourceMap)),w.vertexNode=na.mul(oa).mul(sa(i,1));const X=V.mul(ae(m.colorStart,m.colorEnd,D));return w.colorNode=X,w.opacityNode=Fe(new Le(a),nt()).r.mul(ae(m.alphaStart,m.alphaEnd,D)),{material:w,uniforms:m}}function gr({source:e,layers:a=null,shellCount:s=20,thickness:c=null,shellSpacing:t=null,waveScale:n=.06,stiffness:l=2.75,startColor:x=qt,endColor:R=Xt,alphaTexturePath:k=dr,rootColor:T=null,interactive:C=!1,interactionRadius:u=.18,interactionStrength:A=1.2,showInteractionSurface:v=!1,...m}){const w=o.useRef(),D=o.useRef(new I),Y=o.useRef(new I(0,1,0)),W=o.useRef(new I),j=o.useRef(new I(1,0,0)),M=o.useRef(),F=o.useMemo(()=>Ue(),[]),P=Ie(k),H=C||v,U=o.useMemo(()=>ca(a??s),[a,s]),f=o.useMemo(()=>{const d=e.baseColor.clone();return T&&d.set(T),d},[T,e.baseColor]),E=o.useMemo(()=>Qt(x,qt),[x]),S=o.useMemo(()=>Qt(R,Xt),[R]),O=c??t??.018,B=u*(e.radius||1),y=n,N=B,r=o.useMemo(()=>Array.from({length:U},(d,h)=>pr({alphaEnd:S.alpha,alphaMap:P||F,alphaStart:E.alpha,baseColor:f,colorEnd:S.color,colorStart:E.color,interactionRadius:B,interactionStrength:A,layerIndex:h,layerThickness:O,layersCount:U,sourceMap:e.map||F,stiffness:l,useSourceMap:!!e.map,waveScale:y})),[P,F,f,S.alpha,S.color,B,A,U,O,E.alpha,E.color,y,e.map,l]);o.useEffect(()=>{P&&(P.colorSpace=ta,P.wrapS=rt,P.wrapT=rt,P.needsUpdate=!0)},[P]),o.useEffect(()=>()=>{F.dispose()},[F]),o.useEffect(()=>()=>{r.forEach(({material:d})=>d.dispose())},[r]),o.useEffect(()=>{r.forEach((d,h)=>{const{uniforms:i}=d;i.alphaEnd.value=S.alpha,i.alphaStart.value=E.alpha,i.baseColor.value.copy(f),i.colorEnd.value.copy(S.color),i.colorStart.value.copy(E.color),i.interactorRadius.value=B,i.interactorStrength.value=A,i.layerIndex.value=h,i.layerThickness.value=O,i.layersCount.value=U,i.stiffness.value=l,i.useSourceMap.value=e.map?1:0,i.waveScale.value=y})},[r,f,S.alpha,S.color,B,A,U,O,E.alpha,E.color,y,e.map,l]);const g=o.useCallback(()=>{!M.current||!v||(M.current.visible=!0,M.current.position.copy(D.current))},[v]),G=o.useCallback(d=>{if(!C||!w.current)return;d.stopPropagation(),D.current.copy(d.point),w.current.worldToLocal(D.current),d.face?.normal&&Y.current.copy(d.face.normal).normalize();const h=new I().subVectors(D.current,W.current);h.lengthSq()>1e-8&&j.current.copy(h.normalize()),W.current.copy(D.current),r.forEach(({uniforms:i})=>{const V=i;V.interactorEnabled.value=1,V.interactorDir.value.copy(j.current),V.interactorNormal.value.copy(Y.current),V.interactorPos.value.copy(D.current)}),g()},[C,r,g]),z=o.useCallback(()=>{r.forEach(({uniforms:d})=>{const h=d;h.interactorEnabled.value=0,h.interactorDir.value.set(1,0,0),h.interactorNormal.value.set(0,1,0)}),M.current&&(M.current.visible=!1)},[r]);return o.useEffect(()=>{M.current&&(M.current.visible=!1)},[v]),Te((d,h)=>{r.forEach(i=>{const V=i.uniforms;V.time.value+=h})}),p.jsxs(_e,{ref:w,source:e,...m,children:[r.map(({material:d},h)=>e.isSkinnedMesh&&e.mesh?p.jsx(ct,{frustumCulled:!1,material:d,raycast:Zt,renderOrder:20+h,sourceMesh:e.mesh},d.uuid):p.jsx("mesh",{frustumCulled:!1,geometry:e.geometry,material:d,raycast:Zt,renderOrder:20+h},d.uuid)),H?p.jsx(ze,{onPointerDown:C?G:void 0,onPointerLeave:C?z:void 0,onPointerMove:C?G:void 0,showInteractionSurface:v,source:e}):null,v?p.jsxs("mesh",{ref:M,renderOrder:200,children:[p.jsx("sphereGeometry",{args:[N,20,20]}),p.jsx("meshBasicMaterial",{color:"#00ff88",depthTest:!1,depthWrite:!1,opacity:.95,transparent:!0,wireframe:!0})]}):null]})}function $t(e,a,s,c,t,n){const l=s.mul(a),x=ia(e.element(t.x).mul(n.x).mul(l),e.element(t.y).mul(n.y).mul(l),e.element(t.z).mul(n.z).mul(l),e.element(t.w).mul(n.w).mul(l));return c.mul(x).xyz}function br(e,a,s,c,t,n){const l=ia(n.x.mul(e.element(t.x)),n.y.mul(e.element(t.y)),n.z.mul(e.element(t.z)),n.w.mul(e.element(t.w)));return c.mul(l).mul(s).transformDirection(a).xyz}const Sr="/textures/fur/uneven-alpha.png";function xr({source:e,geometry:a,bladeHeight:s=.045,alphaTexturePath:c=Sr,rootColor:t=null,tipColor:n=null,tipMix:l=.18,curvature:x=.05,windStrength:R=.18,noiseFrequency:k=.4,noiseAmplitude:T=.02,waveAmplitude:C=.025,waveLength:u=.7,waveSpeed:A=1.2,waveDirection:v=[1,0],interactive:m=!0,interactionRadius:w=.18,interactionStrength:D=1.2,showInteractionSurface:Y=!1,...W}){const j=o.useRef(),M=o.useRef(new I),F=n!=null,P=e.radius||1,H=s*P,U=w*P,f=T*P,E=C*P,S=o.useMemo(()=>Ue(),[]),O=Ie(c),B=o.useMemo(()=>{const d=e.baseColor.clone();return t&&d.set(t),d},[t,e.baseColor]),y=o.useMemo(()=>n?new te(n):e.baseColor.clone(),[e.baseColor,n]),N=o.useMemo(()=>ut(v),[v]),r=o.useMemo(()=>({baseColor:b(B.clone()),bladeHeight:b(H),curvature:b(x),interactorEnabled:b(0),interactorPos:b(new I(1e3,1e3,1e3)),interactorRadius:b(U),interactorStrength:b(D),noiseAmplitude:b(f),noiseFrequency:b(k),time:b(0),tipColor:b(y.clone()),tipMix:b(l),useExplicitTipColor:b(F?1:0),waveAmplitude:b(E),waveDirection:b(N.clone()),waveLength:b(u),waveSpeed:b(A),windStrength:b(R)}),[]),g=o.useMemo(()=>{const d=new St({alphaTest:.01,side:ke}),h=Se("aRootPosition","vec3"),i=Se("aRootNormal","vec3").normalize(),V=Se("aScale","float"),X=Se("aPhase","float"),L=Se("aQuat","vec4"),Z=Se("aRootUv","vec2"),$=Se("skinIndex","uvec4"),se=Se("skinWeight","vec4"),ce=b(e.mesh.bindMatrix,"mat4"),q=b(e.mesh.bindMatrixInverse,"mat4"),Me=Na(e.mesh.skeleton.boneMatrices,"mat4",e.mesh.skeleton.bones.length),Re=ot(([ee,K])=>{const me=st(ee.xyz,K);return K.add(st(ee.xyz,me.add(K.mul(ee.w))).mul(2))}),J=Ce(oe.y,0,1),Q=r.waveDirection.div(Pe(r.waveDirection).max(_(1e-4))),ie=xe(h.x.mul(r.noiseFrequency.max(_(1e-4))).add(h.z.mul(r.noiseFrequency.max(_(1e-4)))).add(J.mul(4)).add(r.time.mul(.1))).mul(.5).add(.5),le=ye(_(.08),_(.65),Fe(new Le(O||S),nt()).r),we=ot(()=>{const ee=ne(oe.x,oe.y.mul(r.bladeHeight).mul(V),oe.z).toVar(),K=r.time.add(X),me=xe(K.mul(1.3).add(h.x.mul(.2))).add(yt(K.mul(.7).add(h.z.mul(.15)))).mul(r.windStrength).mul(J.mul(J)),Oe=xe(Be(h.xz,Q).div(r.waveLength.max(_(1e-4))).mul(6.2831852).sub(r.time.mul(r.waveSpeed))).mul(r.waveAmplitude).mul(J),De=h.add(Re(L,ee.add(ne(r.curvature.mul(J).mul(J),0,0)).add(ne(me.mul(.4),0,me.mul(.15))).add(ne(Q.x.mul(Oe),0,Q.y.mul(Oe))).add(ne(ie.sub(.5).mul(r.noiseAmplitude).mul(J),0,ie.sub(.5).mul(r.noiseAmplitude).mul(J).mul(.6))))).toVar(),We=$t(Me,h,ce,q,$,se).toVar(),je=br(Me,i,ce,q,$,se).normalize().toVar(),Je=$t(Me,De,ce,q,$,se).toVar(),Ve=We.sub(r.interactorPos).sub(je.mul(Be(We.sub(r.interactorPos),je))).toVar(),et=Pe(Ve),Mt=Ce(_(1).sub(ye(0,r.interactorRadius,et)).mul(r.interactorStrength).mul(r.interactorEnabled),0,1),ga=Ve.div(et.max(_(1e-5)));return ae(Je.add(ga.mul(Mt).mul(r.bladeHeight).mul(.9).mul(J)),We,Mt.mul(.25).mul(J))})();let re=r.baseColor;e.map&&(re=r.baseColor.mul(Fe(new Le(e.map),Z).rgb));const de=ae(re,r.tipColor,r.tipMix.mul(r.useExplicitTipColor));return d.vertexNode=na.mul(oa).mul(sa(we,1)),d.colorNode=ae(re,de,xt(J,1.2)).mul(ae(_(.75),_(1.25),ie)).mul(ae(_(.82),_(1),le)).add(ye(.7,1,J).mul(.12)),d.opacityNode=le,d},[O,S,e.map,e.mesh,r]);o.useEffect(()=>()=>{S.dispose(),g.dispose()},[S,g]),o.useEffect(()=>{r.baseColor.value.copy(B),r.bladeHeight.value=H,r.curvature.value=x,r.interactorRadius.value=U,r.interactorStrength.value=D,r.noiseAmplitude.value=f,r.noiseFrequency.value=k,r.tipColor.value.copy(y),r.tipMix.value=l,r.useExplicitTipColor.value=F?1:0,r.waveAmplitude.value=E,r.waveDirection.value.copy(N),r.waveLength.value=u,r.waveSpeed.value=A,r.windStrength.value=R},[x,D,k,B,H,U,f,y,E,N,l,r,F,u,A,R]);const G=o.useCallback(d=>{!m||!j.current||(d.stopPropagation(),M.current.copy(d.point),j.current.worldToLocal(M.current),r.interactorEnabled.value=1,r.interactorPos.value.copy(M.current))},[m,r]),z=o.useCallback(()=>{r.interactorEnabled.value=0},[r]);return Te((d,h)=>{r.time.value+=h,e.mesh?.skeleton?.update()}),!a||!e.mesh?null:p.jsxs(_e,{ref:j,source:e,...W,children:[p.jsx("mesh",{frustumCulled:!1,geometry:a,material:g}),p.jsx(ze,{onPointerDown:m?G:void 0,onPointerLeave:m?z:void 0,onPointerMove:m?G:void 0,showInteractionSurface:Y,source:e})]})}const yr="/textures/fur/uneven-alpha.png";function Cr({source:e,count:a=5e3,bladeHeight:s=.045,bladeWidth:c=.008,alphaTexturePath:t=yr,rootColor:n=null,tipColor:l=null,tipMix:x=.18,curvature:R=.05,windStrength:k=.18,noiseFrequency:T=.4,noiseAmplitude:C=.02,waveAmplitude:u=.025,waveLength:A=.7,waveSpeed:v=1.2,waveDirection:m=[1,0],interactive:w=!0,interactionRadius:D=.18,interactionStrength:Y=1.2,seed:W=1,showInteractionSurface:j=!1,...M}){const F=o.useRef(),P=o.useRef(new I),H=l!=null,U=e.radius||1,f=s*U,E=c*U,S=D*U,O=C*U,B=u*U,y=o.useMemo(()=>da(a,e.isSkinnedMesh),[a,e.isSkinnedMesh]),N=o.useMemo(()=>Ue(),[]),r=Ie(t),g=o.useMemo(()=>ma({bladeWidth:E,isSkinnedMesh:e.isSkinnedMesh,seed:W,sourceGeometry:e.geometry,strandCount:y}),[E,y,W,e.geometry,e.isSkinnedMesh]),G=g?.userData?.strandGeometryType==="skinned",z=o.useMemo(()=>{const Z=e.baseColor.clone();return n&&Z.set(n),Z},[n,e.baseColor]),d=o.useMemo(()=>l?new te(l):e.baseColor.clone(),[e.baseColor,l]),h=o.useMemo(()=>ut(m),[m]),i=o.useMemo(()=>({baseColor:b(z.clone()),bladeHeight:b(f),curvature:b(R),interactorEnabled:b(0),interactorPos:b(new I(1e3,1e3,1e3)),interactorRadius:b(S),interactorStrength:b(Y),noiseAmplitude:b(O),noiseFrequency:b(T),time:b(0),tipColor:b(d.clone()),tipMix:b(x),useExplicitTipColor:b(H?1:0),waveAmplitude:b(B),waveDirection:b(h.clone()),waveLength:b(A),waveSpeed:b(v),windStrength:b(k)}),[]),V=o.useMemo(()=>{if(!g||G)return null;const Z=new St({alphaTest:.01,side:ke}),$=Ye(g.getAttribute("aOffset")),se=Ye(g.getAttribute("aScale")),ce=Ye(g.getAttribute("aPhase")),q=Ye(g.getAttribute("aQuat")),Me=Ye(g.getAttribute("aRootUv")),Re=ye(_(.08),_(.65),Fe(new Le(r||N),nt()).r),J=ot(([ee,K])=>{const me=st(ee.xyz,K);return K.add(st(ee.xyz,me.add(K.mul(ee.w))).mul(2))}),Q=Ce(oe.y,0,1),ie=i.waveDirection.div(Pe(i.waveDirection).max(_(1e-4))),le=xe($.x.mul(i.noiseFrequency.max(_(1e-4))).add($.z.mul(i.noiseFrequency.max(_(1e-4)))).add(Q.mul(4)).add(i.time.mul(.1))).mul(.5).add(.5),we=ot(()=>{const ee=ne(oe.x,oe.y.mul(i.bladeHeight).mul(se),oe.z).toVar(),K=i.time.add(ce),me=xe(K.mul(1.3).add($.x.mul(.2))).add(yt(K.mul(.7).add($.z.mul(.15)))).mul(i.windStrength).mul(Q.mul(Q)),Oe=xe(Be($.xz,ie).div(i.waveLength.max(_(1e-4))).mul(6.2831852).sub(i.time.mul(i.waveSpeed))).mul(i.waveAmplitude).mul(Q),De=J(q,ee.add(ne(i.curvature.mul(Q).mul(Q),0,0)).add(ne(me.mul(.4),0,me.mul(.15))).add(ne(ie.x.mul(Oe),0,ie.y.mul(Oe))).add(ne(le.sub(.5).mul(i.noiseAmplitude).mul(Q),0,le.sub(.5).mul(i.noiseAmplitude).mul(Q).mul(.6)))).toVar(),We=J(q,ne(0,1,0)).normalize().toVar(),je=$.sub(i.interactorPos).sub(We.mul(Be($.sub(i.interactorPos),We))).toVar(),Je=Pe(je),Ve=Ce(_(1).sub(ye(0,i.interactorRadius,Je)).mul(i.interactorStrength).mul(i.interactorEnabled),0,1),et=je.div(Je.max(_(1e-5)));return De.addAssign(et.mul(Ve).mul(i.bladeHeight).mul(.9).mul(Q)),De.y.assign(De.y.mul(_(1).sub(Ve.mul(.25).mul(Q)))),De.add($)})();let re=i.baseColor;e.map&&(re=i.baseColor.mul(Fe(new Le(e.map),Me).rgb));const de=ae(re,i.tipColor,i.tipMix.mul(i.useExplicitTipColor));return Z.positionNode=we,Z.colorNode=ae(re,de,xt(Q,1.2)).mul(ae(_(.75),_(1.25),le)).mul(ae(_(.82),_(1),Re)).add(ye(.7,1,Q).mul(.12)),Z.opacityNode=Re,Z},[r,N,g,G,e.map,i]);o.useEffect(()=>()=>{N.dispose(),V?.dispose()},[N,V]),o.useEffect(()=>{i.baseColor.value.copy(z),i.bladeHeight.value=f,i.curvature.value=R,i.interactorRadius.value=S,i.interactorStrength.value=Y,i.noiseAmplitude.value=O,i.noiseFrequency.value=T,i.tipColor.value.copy(d),i.tipMix.value=x,i.useExplicitTipColor.value=H?1:0,i.waveAmplitude.value=B,i.waveDirection.value.copy(h),i.waveLength.value=A,i.waveSpeed.value=v,i.windStrength.value=k},[f,R,S,Y,O,T,z,d,h,B,x,H,i,A,v,k]);const X=o.useCallback(Z=>{!w||!F.current||(Z.stopPropagation(),P.current.copy(Z.point),F.current.worldToLocal(P.current),i.interactorEnabled.value=1,i.interactorPos.value.copy(P.current))},[w,i]),L=o.useCallback(()=>{i.interactorEnabled.value=0},[i]);return Te((Z,$)=>{i.time.value+=$,!G&&e.isSkinnedMesh&&e.mesh&&fa(g,e.mesh)}),g?G&&e.mesh?p.jsx(xr,{alphaTexturePath:t,bladeHeight:s,curvature:R,geometry:g,interactionRadius:D,interactionStrength:Y,interactive:w,noiseAmplitude:C,noiseFrequency:T,rootColor:n,showInteractionSurface:j,source:e,tipColor:l,tipMix:x,waveAmplitude:u,waveDirection:m,waveLength:A,waveSpeed:v,windStrength:k,...M}):p.jsxs(_e,{ref:F,source:e,...M,children:[p.jsx("mesh",{frustumCulled:!1,geometry:g,material:V}),p.jsx(ze,{onPointerDown:w?X:void 0,onPointerLeave:w?L:void 0,onPointerMove:w?X:void 0,showInteractionSurface:j,source:e})]}):null}function Mr({technique:e=he.strand,sourceGeometry:a=null,sourceMaterial:s=null,sourceMesh:c=null,...t}){const n=va({sourceGeometry:a,sourceMaterial:s,sourceMesh:c});return n.geometry?e===he.shell?p.jsx(gr,{...t,source:n}):e===he.strand?p.jsx(Cr,{...t,source:n}):null:null}function ha(e){return ra(c=>c.gl)?.isWebGPURenderer===!0?p.jsx(Mr,{...e}):p.jsx(cr,{...e})}const pa=.875,Ct=.16;function Ar({radius:e=pa,height:a=Ct,widthSegments:s=64,heightSegments:c=24}={}){const t=new ka(e,s,c,0,Math.PI*2,0,Math.PI/2),n=t.getAttribute("position");for(let l=0;l<n.count;l+=1){const x=lt.clamp(n.getY(l)/e,0,1);n.setY(l,x*a)}return n.needsUpdate=!0,t.computeVertexNormals(),t.computeBoundingBox(),t.computeBoundingSphere(),t}const Pr=o.forwardRef(function({colorDark:a,colorLight:s,floorY:c,geometry:t},n){const l=o.useMemo(()=>{const x=new te(a),R=new te(s),k=t.boundingBox,T=t.boundingSphere?.radius??1,C=k?k.max.y-k.min.y:1,u=new Ta({color:x,metalness:0,roughness:.96});return u.onBeforeCompile=A=>{const v=A;v.uniforms.uPatchDark={value:x.clone()},v.uniforms.uPatchHeight={value:C},v.uniforms.uPatchLight={value:R.clone()},v.uniforms.uPatchRadius={value:T},v.vertexShader=v.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vPatchPos;`).replace("#include <begin_vertex>",`#include <begin_vertex>
vPatchPos = transformed;`),v.fragmentShader=v.fragmentShader.replace("#include <common>",`#include <common>
${Ba}
varying vec3 vPatchPos;
uniform vec3 uPatchDark;
uniform float uPatchHeight;
uniform vec3 uPatchLight;
uniform float uPatchRadius;`).replace("vec4 diffuseColor = vec4( diffuse, opacity );",`
          float macroNoise = pnoise(vec3(vPatchPos.xz * 2.2, 0.0), vec3(10.0));
          float detailNoise = pnoise(vec3(vPatchPos.xz * 6.8 + vec2(1.7, 4.1), 0.0), vec3(10.0));
          float topMask = clamp(vPatchPos.y / max(uPatchHeight, 0.0001), 0.0, 1.0);
          float radialMask = 1.0 - clamp(length(vPatchPos.xz) / max(uPatchRadius, 0.0001), 0.0, 1.0);
          float tone = clamp(
            0.52 + macroNoise * 0.26 + detailNoise * 0.12 + topMask * 0.14 + radialMask * 0.08,
            0.0,
            1.0
          );
          vec3 patchColor = mix(uPatchDark, uPatchLight, tone);
          vec4 diffuseColor = vec4(patchColor, opacity);
          `)},u.customProgramCacheKey=()=>"fur-lab-grass-patch",u.needsUpdate=!0,u},[a,s,t]);return o.useEffect(()=>()=>{l.dispose()},[l]),p.jsx("mesh",{geometry:t,material:l,position:[0,c,0],receiveShadow:!0,ref:n})}),kr=o.forwardRef(function({colorDark:a,colorLight:s,floorY:c,geometry:t},n){const l=o.useMemo(()=>({darkColor:b(new te(a)),height:b(1),lightColor:b(new te(s)),radius:b(1)}),[]);o.useEffect(()=>{const R=t.boundingBox;l.darkColor.value.set(a),l.lightColor.value.set(s),l.radius.value=t.boundingSphere?.radius??1,l.height.value=R?R.max.y-R.min.y:1},[a,s,t,l]);const x=o.useMemo(()=>{const R=It(oe.mul(2.2)),k=It(oe.mul(6.8).add(ne(1.7,0,4.1))),T=Ce(oe.y.div(l.height.max(_(1e-4))),0,1),C=_(1).sub(Ce(Pe(ne(oe.x,0,oe.z)).div(l.radius.max(_(1e-4))),0,1)),u=Ce(_(.52).add(R.mul(.26)).add(k.mul(.12)).add(T.mul(.14)).add(C.mul(.08)),0,1),A=new Ia({color:new te(a),metalness:0,roughness:.96});return A.colorNode=ae(l.darkColor,l.lightColor,u),A},[a,l]);return o.useEffect(()=>()=>{x.dispose()},[x]),p.jsx("mesh",{geometry:t,material:x,position:[0,c,0],receiveShadow:!0,ref:n})});function Tr({colorDark:e="#3d5f29",colorLight:a="#82ad4a",floorY:s,furProps:c=null,furLayers:t=null,height:n=Ct,radius:l=pa,technique:x=null}){const k=ra(v=>v.gl)?.isWebGPURenderer===!0,T=o.useRef(),C=t??(c&&x?[{furProps:c,technique:x}]:[]),u=o.useMemo(()=>Ar({height:n,radius:l}),[n,l]),A=k?kr:Pr;return o.useEffect(()=>()=>{u.dispose()},[u]),p.jsxs("group",{children:[p.jsx(A,{colorDark:e,colorLight:a,floorY:s,geometry:u,ref:T}),C.map(v=>p.jsx(ha,{sourceMesh:T,technique:v.technique,...v.furProps},v.technique))]})}const Ir=1e-4;function Rr(e){if(typeof e=="number")return e;if(Array.isArray(e)){const a=e[1]??e[0];return Number.isFinite(a)?a:1}return e&&typeof e=="object"&&Number.isFinite(e.y)?e.y:1}function wr({floorY:e,furProps:a=null,furLayers:s=null,offsetY:c,patchProps:t=null,patchFurProps:n=null,patchFurLayers:l=null,position:x,rotationY:R,scale:k,technique:T=null}){const C=o.useRef(),u=o.useRef(),A=t?.height??Ct,v=t?.contactOffset??0,[m,w]=o.useState(e+A),D=s??(a&&T?[{furProps:a,technique:T}]:[]),Y=l??(n&&T?[{furProps:n,technique:T}]:[]);return o.useLayoutEffect(()=>{if(!C.current||!u.current)return;const W=new Ra,j=new I,M=c*Rr(k);u.current.updateWorldMatrix(!0,!0),W.setFromObject(u.current),u.current.getWorldPosition(j);const F=W.min.y-j.y,P=e+A-F+M+v;w(H=>Math.abs(H-P)<=Ir?H:P)},[e,c,A,v,k]),p.jsxs("group",{position:x,ref:C,children:[p.jsx(Tr,{...t,floorY:e,furLayers:Y}),p.jsx(La,{autoPlay:!0,autoPlayPatterns:["rabbit","eat"],autoPlayTimeScale:.6,position:[0,m,0],ref:u,rotation:[0,R,0],scale:k}),D.map(W=>p.jsx(ha,{sourceMesh:u,technique:W.technique,...W.furProps},W.technique))]})}const ue={Uneven:"/textures/fur/uneven-alpha.png",Even:"/textures/fur/even-alpha.png",Moss:"/textures/fur/moss-alpha.png"},Kt="Balanced",vt={grassDomeHeight:.16,grassDomeRadius:.875,grassPlainDarkColor:"#3d5f29",grassPlainLightColor:"#82ad4a",grassRabbitContactOffset:0,grassShellAlphaTexturePath:ue.Moss,grassShellDarkColor:"#345824",grassShellInteractionRadius:.1,grassShellInteractionStrength:2.6,grassShellLayers:14,grassShellLightColor:"#78a447",grassShellRootColor:"#4a7a34",grassShellStiffness:2.475,grassShellThickness:.02025,grassShellTipColor:"#a9cf67",grassShellWaveScale:.099,grassStrandAlphaTexturePath:ue.Moss,grassStrandBladeHeight:.0425,grassStrandBladeWidth:.0064,grassStrandCount:12e3,grassStrandCurvature:.08,grassStrandDarkColor:"#2f5421",grassStrandInteractionRadius:.08,grassStrandInteractionStrength:2.2,grassStrandLightColor:"#89b657",grassStrandNoiseAmplitude:.0119,grassStrandNoiseFrequency:.45,grassStrandRootColor:"#346926",grassStrandTipColor:"#9ec55f",grassStrandTipMix:.38,grassStrandWaveAmplitude:.0182,grassStrandWaveDirectionX:1,grassStrandWaveDirectionY:.35,grassStrandWaveLength:.85,grassStrandWaveSpeed:1.3,grassStrandWindStrength:.16},ht={Balanced:{ambientLightIntensity:.92,cameraFov:34,cameraMaxDistance:9,cameraMinDistance:3.5,cameraTargetX:0,cameraTargetY:-.1,cameraTargetZ:0,cameraX:0,cameraY:.4,cameraZ:6.6,fillLightIntensity:.36,groundColor:"#d8d0c5",groundSize:4.8,...vt,keyLightIntensity:1.2,rabbitOffsetY:-.16,rabbitRotationYDeg:-26,rabbitScale:.03,sceneBackgroundColor:"#efe7db",shellAlphaTexturePath:ue.Uneven,shellEndAlpha:0,shellEndColor:"#ffffff",shellInteractionRadius:.1,shellInteractionStrength:2.6,shellInteractive:!0,shellLayers:18,shellShowInteractionSurface:!1,shellStartAlpha:1,shellStartColor:"#999999",shellStiffness:2.75,shellThickness:.045,shellWaveScale:.18,specimenMode:"default",specimenY:-.26,strandAlphaTexturePath:ue.Uneven,strandBladeHeight:.032,strandBladeWidth:.01,strandCount:5e4,strandCurvature:.05,strandInteractionRadius:.08,strandInteractionStrength:2.2,strandInteractive:!0,strandNoiseAmplitude:.014,strandNoiseFrequency:.45,strandRootColor:"#8a715b",strandShowInteractionSurface:!1,strandTipColor:"#f4e9dc",strandTipMix:.32,strandUseRootColor:!1,strandUseTipColor:!0,strandWaveAmplitude:.028,strandWaveDirectionX:1,strandWaveDirectionY:.35,strandWaveLength:.85,strandWaveSpeed:1.3,strandWindStrength:.16},ReferenceDensity:{ambientLightIntensity:.92,cameraFov:34,cameraMaxDistance:9,cameraMinDistance:3.5,cameraTargetX:0,cameraTargetY:-.1,cameraTargetZ:0,cameraX:0,cameraY:.4,cameraZ:6.6,fillLightIntensity:.36,groundColor:"#d8d0c5",groundSize:4.8,...vt,keyLightIntensity:1.2,rabbitOffsetY:-.16,rabbitRotationYDeg:-26,rabbitScale:.03,sceneBackgroundColor:"#efe7db",shellAlphaTexturePath:ue.Uneven,shellEndAlpha:0,shellEndColor:"#ffffff",shellInteractionRadius:.1,shellInteractionStrength:2.6,shellInteractive:!0,shellLayers:18,shellShowInteractionSurface:!1,shellStartAlpha:1,shellStartColor:"#999999",shellStiffness:2.75,shellThickness:.045,shellWaveScale:.18,specimenMode:"strand",specimenY:-.26,strandAlphaTexturePath:ue.Uneven,strandBladeHeight:.032,strandBladeWidth:.01,strandCount:1e5,strandCurvature:.05,strandInteractionRadius:.08,strandInteractionStrength:2.2,strandInteractive:!0,strandNoiseAmplitude:.014,strandNoiseFrequency:.45,strandRootColor:"#8a715b",strandShowInteractionSurface:!1,strandTipColor:"#f4e9dc",strandTipMix:.32,strandUseRootColor:!1,strandUseTipColor:!0,strandWaveAmplitude:.028,strandWaveDirectionX:1,strandWaveDirectionY:.35,strandWaveLength:.85,strandWaveSpeed:1.3,strandWindStrength:.16},InteractionDebug:{ambientLightIntensity:.92,cameraFov:34,cameraMaxDistance:9,cameraMinDistance:3.5,cameraTargetX:0,cameraTargetY:-.1,cameraTargetZ:0,cameraX:0,cameraY:.4,cameraZ:6.6,fillLightIntensity:.36,groundColor:"#d8d0c5",groundSize:4.8,...vt,grassShellInteractionRadius:.065,grassShellInteractionStrength:4,grassStrandInteractionRadius:.06,grassStrandInteractionStrength:3.6,keyLightIntensity:1.2,rabbitOffsetY:-.16,rabbitRotationYDeg:-26,rabbitScale:.03,sceneBackgroundColor:"#efe7db",shellAlphaTexturePath:ue.Uneven,shellEndAlpha:0,shellEndColor:"#ffffff",shellInteractionRadius:.065,shellInteractionStrength:4,shellInteractive:!0,shellLayers:18,shellShowInteractionSurface:!0,shellStartAlpha:1,shellStartColor:"#999999",shellStiffness:2.75,shellThickness:.045,shellWaveScale:.18,specimenMode:"strand",specimenY:-.26,strandAlphaTexturePath:ue.Uneven,strandBladeHeight:.032,strandBladeWidth:.01,strandCount:5e4,strandCurvature:.05,strandInteractionRadius:.06,strandInteractionStrength:3,strandInteractive:!0,strandNoiseAmplitude:.014,strandNoiseFrequency:.45,strandRootColor:"#8a715b",strandShowInteractionSurface:!0,strandTipColor:"#f4e9dc",strandTipMix:.32,strandUseRootColor:!1,strandUseTipColor:!0,strandWaveAmplitude:.028,strandWaveDirectionX:1,strandWaveDirectionY:.35,strandWaveLength:.85,strandWaveSpeed:1.3,strandWindStrength:.16}};function Dr({presetSnapshot:e}){return{...e}}const Wr="Fur Lab",Jt=Object.freeze({Default:"default",Shell:"shell",Strand:"strand",Combo:"combo"});function Er(){const{attachSetControls:e,controlsSnapshotRef:a,initialPreset:s,presetsFolder:c}=Fa({defaultPreset:Kt,getPresetControls:Dr,presets:ht}),t=ht[s]||ht[Kt],[n,l]=wa(Wr,()=>({Presets:c,Scene:be({sceneBackgroundColor:{label:"Background",value:t.sceneBackgroundColor},groundColor:{label:"Ground",value:t.groundColor},groundSize:{label:"Ground Size",max:10,min:2,step:.1,value:t.groundSize},ambientLightIntensity:{label:"Ambient",max:2,min:0,step:.01,value:t.ambientLightIntensity},keyLightIntensity:{label:"Key",max:3,min:0,step:.01,value:t.keyLightIntensity},fillLightIntensity:{label:"Fill",max:2,min:0,step:.01,value:t.fillLightIntensity}},{collapsed:!0}),Camera:be({cameraFov:{label:"FOV",max:90,min:20,step:1,value:t.cameraFov},cameraX:{label:"X",max:10,min:-10,step:.1,value:t.cameraX},cameraY:{label:"Y",max:10,min:-2,step:.1,value:t.cameraY},cameraZ:{label:"Z",max:16,min:2,step:.1,value:t.cameraZ},cameraTargetX:{label:"Target X",max:4,min:-4,step:.05,value:t.cameraTargetX},cameraTargetY:{label:"Target Y",max:4,min:-4,step:.05,value:t.cameraTargetY},cameraTargetZ:{label:"Target Z",max:4,min:-4,step:.05,value:t.cameraTargetZ},cameraMinDistance:{label:"Min Dist",max:12,min:1,step:.1,value:t.cameraMinDistance},cameraMaxDistance:{label:"Max Dist",max:20,min:2,step:.1,value:t.cameraMaxDistance}},{collapsed:!0}),Specimen:be({specimenMode:{label:"Version",options:Jt,value:t.specimenMode??Jt.Default},specimenY:{label:"Specimen Y",max:2,min:-2,step:.05,value:t.specimenY},rabbitOffsetY:{label:"Rabbit Y",max:2,min:-2,step:.05,value:t.rabbitOffsetY},rabbitScale:{label:"Rabbit Scale",max:.2,min:.005,step:.001,value:t.rabbitScale},rabbitRotationYDeg:{label:"Rabbit Y Rot",max:180,min:-180,step:1,value:t.rabbitRotationYDeg}},{collapsed:!0}),GrassDome:be({grassDomeRadius:{label:"Radius",max:2,min:.1,step:.01,value:t.grassDomeRadius},grassDomeHeight:{label:"Height",max:.6,min:.01,step:.005,value:t.grassDomeHeight},grassRabbitContactOffset:{label:"Contact Offset",max:.2,min:-.2,step:.001,value:t.grassRabbitContactOffset},grassPlainDarkColor:{label:"Plain Dark",value:t.grassPlainDarkColor},grassPlainLightColor:{label:"Plain Light",value:t.grassPlainLightColor},grassShellDarkColor:{label:"Shell Dark",value:t.grassShellDarkColor},grassShellLightColor:{label:"Shell Light",value:t.grassShellLightColor},grassStrandDarkColor:{label:"Strand Dark",value:t.grassStrandDarkColor},grassStrandLightColor:{label:"Strand Light",value:t.grassStrandLightColor}},{collapsed:!0}),Shell:be({shellAlphaTexturePath:{label:"Alpha Map",options:ue,value:t.shellAlphaTexturePath},shellLayers:{label:"Layers",max:24,min:1,step:1,value:t.shellLayers},shellThickness:{label:"Thickness",max:.3,min:.001,step:.001,value:t.shellThickness},shellWaveScale:{label:"Wave Scale",max:1.2,min:0,step:.001,value:t.shellWaveScale},shellStiffness:{label:"Stiffness",max:8,min:.1,step:.05,value:t.shellStiffness},shellStartColor:{label:"Root Tint",value:t.shellStartColor},shellStartAlpha:{label:"Root Alpha",max:1,min:0,step:.01,value:t.shellStartAlpha},shellEndColor:{label:"Tip Tint",value:t.shellEndColor},shellEndAlpha:{label:"Tip Alpha",max:1,min:0,step:.01,value:t.shellEndAlpha},shellInteractive:{label:"Cursor Push",value:t.shellInteractive},shellInteractionRadius:{label:"Cursor Radius",max:.3,min:.01,step:.005,value:t.shellInteractionRadius},shellInteractionStrength:{label:"Cursor Strength",max:6,min:0,step:.05,value:t.shellInteractionStrength},shellShowInteractionSurface:{label:"Show Collider",value:t.shellShowInteractionSurface}},{collapsed:!0}),ShellGrass:be({grassShellAlphaTexturePath:{label:"Alpha Map",options:ue,value:t.grassShellAlphaTexturePath},grassShellLayers:{label:"Layers",max:24,min:1,step:1,value:t.grassShellLayers},grassShellThickness:{label:"Thickness",max:.12,min:.001,step:.001,value:t.grassShellThickness},grassShellWaveScale:{label:"Wave Scale",max:.6,min:0,step:.001,value:t.grassShellWaveScale},grassShellStiffness:{label:"Stiffness",max:8,min:.1,step:.05,value:t.grassShellStiffness},grassShellRootColor:{label:"Root Color",value:t.grassShellRootColor},grassShellTipColor:{label:"Tip Color",value:t.grassShellTipColor},grassShellInteractionRadius:{label:"Cursor Radius",max:.3,min:.01,step:.005,value:t.grassShellInteractionRadius},grassShellInteractionStrength:{label:"Cursor Strength",max:6,min:0,step:.05,value:t.grassShellInteractionStrength}},{collapsed:!0}),Strand:be({strandAlphaTexturePath:{label:"Alpha Map",options:ue,value:t.strandAlphaTexturePath},strandCount:{label:"Count",max:ua,min:100,step:500,value:t.strandCount},strandBladeHeight:{label:"Blade Height",max:.15,min:.001,step:.001,value:t.strandBladeHeight},strandBladeWidth:{label:"Blade Width",max:.03,min:.001,step:.001,value:t.strandBladeWidth},strandCurvature:{label:"Curvature",max:.4,min:0,step:.005,value:t.strandCurvature},strandWindStrength:{label:"Wind",max:1,min:0,step:.01,value:t.strandWindStrength},strandNoiseFrequency:{label:"Noise Freq",max:2,min:0,step:.01,value:t.strandNoiseFrequency},strandNoiseAmplitude:{label:"Noise Amp",max:.1,min:0,step:.001,value:t.strandNoiseAmplitude},strandWaveAmplitude:{label:"Wave Amp",max:.1,min:0,step:.001,value:t.strandWaveAmplitude},strandWaveLength:{label:"Wave Length",max:4,min:.05,step:.01,value:t.strandWaveLength},strandWaveSpeed:{label:"Wave Speed",max:4,min:0,step:.01,value:t.strandWaveSpeed},strandWaveDirectionX:{label:"Wave Dir X",max:1,min:-1,step:.01,value:t.strandWaveDirectionX},strandWaveDirectionY:{label:"Wave Dir Y",max:1,min:-1,step:.01,value:t.strandWaveDirectionY},strandUseRootColor:{label:"Override Root",value:t.strandUseRootColor},strandRootColor:{label:"Root Color",value:t.strandRootColor},strandUseTipColor:{label:"Override Tip",value:t.strandUseTipColor},strandTipColor:{label:"Tip Color",value:t.strandTipColor},strandTipMix:{label:"Tip Mix",max:1,min:0,step:.01,value:t.strandTipMix},strandInteractive:{label:"Cursor Push",value:t.strandInteractive},strandInteractionRadius:{label:"Cursor Radius",max:.3,min:.01,step:.005,value:t.strandInteractionRadius},strandInteractionStrength:{label:"Cursor Strength",max:6,min:0,step:.05,value:t.strandInteractionStrength},strandShowInteractionSurface:{label:"Show Hit Surface",value:t.strandShowInteractionSurface}},{collapsed:!0}),StrandGrass:be({grassStrandAlphaTexturePath:{label:"Alpha Map",options:ue,value:t.grassStrandAlphaTexturePath},grassStrandCount:{label:"Count",max:la,min:100,step:50,value:t.grassStrandCount},grassStrandBladeHeight:{label:"Blade Height",max:.15,min:.001,step:.001,value:t.grassStrandBladeHeight},grassStrandBladeWidth:{label:"Blade Width",max:.03,min:.001,step:.001,value:t.grassStrandBladeWidth},grassStrandCurvature:{label:"Curvature",max:.4,min:0,step:.005,value:t.grassStrandCurvature},grassStrandWindStrength:{label:"Wind",max:1,min:0,step:.01,value:t.grassStrandWindStrength},grassStrandNoiseFrequency:{label:"Noise Freq",max:2,min:0,step:.01,value:t.grassStrandNoiseFrequency},grassStrandNoiseAmplitude:{label:"Noise Amp",max:.1,min:0,step:.001,value:t.grassStrandNoiseAmplitude},grassStrandWaveAmplitude:{label:"Wave Amp",max:.1,min:0,step:.001,value:t.grassStrandWaveAmplitude},grassStrandWaveLength:{label:"Wave Length",max:4,min:.05,step:.01,value:t.grassStrandWaveLength},grassStrandWaveSpeed:{label:"Wave Speed",max:4,min:0,step:.01,value:t.grassStrandWaveSpeed},grassStrandWaveDirectionX:{label:"Wave Dir X",max:1,min:-1,step:.01,value:t.grassStrandWaveDirectionX},grassStrandWaveDirectionY:{label:"Wave Dir Y",max:1,min:-1,step:.01,value:t.grassStrandWaveDirectionY},grassStrandRootColor:{label:"Root Color",value:t.grassStrandRootColor},grassStrandTipColor:{label:"Tip Color",value:t.grassStrandTipColor},grassStrandTipMix:{label:"Tip Mix",max:1,min:0,step:.01,value:t.grassStrandTipMix},grassStrandInteractionRadius:{label:"Cursor Radius",max:.3,min:.01,step:.005,value:t.grassStrandInteractionRadius},grassStrandInteractionStrength:{label:"Cursor Strength",max:6,min:0,step:.05,value:t.grassStrandInteractionStrength}},{collapsed:!0})}),{collapsed:!0});return e(l),a.current={...n},n}function it(e,a){const s=new te(e);return[s.r,s.g,s.b,a]}function Nr(e,a){return a==="shell"?{colorDark:e.grassShellDarkColor,colorLight:e.grassShellLightColor}:a==="strand"?{colorDark:e.grassStrandDarkColor,colorLight:e.grassStrandLightColor}:a==="combo"?{colorDark:new te(e.grassShellDarkColor).lerp(new te(e.grassStrandDarkColor),.5),colorLight:new te(e.grassShellLightColor).lerp(new te(e.grassStrandLightColor),.5)}:{colorDark:e.grassPlainDarkColor,colorLight:e.grassPlainLightColor}}function Lr(e){return{alphaTexturePath:e.shellAlphaTexturePath,endColor:it(e.shellEndColor,e.shellEndAlpha),interactionRadius:e.shellInteractionRadius,interactionStrength:e.shellInteractionStrength,interactive:e.shellInteractive,layers:e.shellLayers,showInteractionSurface:e.shellShowInteractionSurface,startColor:it(e.shellStartColor,e.shellStartAlpha),stiffness:e.shellStiffness,thickness:e.shellThickness,waveScale:e.shellWaveScale}}function Br(e){return{alphaTexturePath:e.strandAlphaTexturePath,bladeHeight:e.strandBladeHeight,bladeWidth:e.strandBladeWidth,count:e.strandCount,curvature:e.strandCurvature,interactionRadius:e.strandInteractionRadius,interactionStrength:e.strandInteractionStrength,interactive:e.strandInteractive,noiseAmplitude:e.strandNoiseAmplitude,noiseFrequency:e.strandNoiseFrequency,rootColor:e.strandUseRootColor?e.strandRootColor:null,showInteractionSurface:e.strandShowInteractionSurface,tipColor:e.strandUseTipColor?e.strandTipColor:null,tipMix:e.strandTipMix,waveAmplitude:e.strandWaveAmplitude,waveDirection:[e.strandWaveDirectionX,e.strandWaveDirectionY],waveLength:e.strandWaveLength,waveSpeed:e.strandWaveSpeed,windStrength:e.strandWindStrength}}function tt(e,a="plain"){return{...Nr(e,a),contactOffset:e.grassRabbitContactOffset,height:e.grassDomeHeight,radius:e.grassDomeRadius}}function Fr(e){return{alphaTexturePath:e.grassShellAlphaTexturePath,endColor:it(e.grassShellTipColor,0),interactionRadius:e.grassShellInteractionRadius,interactionStrength:e.grassShellInteractionStrength,interactive:e.shellInteractive,layers:e.grassShellLayers,showInteractionSurface:e.shellShowInteractionSurface,startColor:it(e.grassShellRootColor,1),stiffness:e.grassShellStiffness,thickness:e.grassShellThickness,waveScale:e.grassShellWaveScale}}function Ur(e){return{alphaTexturePath:e.grassStrandAlphaTexturePath,bladeHeight:e.grassStrandBladeHeight,bladeWidth:e.grassStrandBladeWidth,count:e.grassStrandCount,curvature:e.grassStrandCurvature,interactionRadius:e.grassStrandInteractionRadius,interactionStrength:e.grassStrandInteractionStrength,interactive:e.strandInteractive,noiseAmplitude:e.grassStrandNoiseAmplitude,noiseFrequency:e.grassStrandNoiseFrequency,rootColor:e.grassStrandRootColor,showInteractionSurface:e.strandShowInteractionSurface,tipColor:e.grassStrandTipColor,tipMix:e.grassStrandTipMix,waveAmplitude:e.grassStrandWaveAmplitude,waveDirection:[e.grassStrandWaveDirectionX,e.grassStrandWaveDirectionY],waveLength:e.grassStrandWaveLength,waveSpeed:e.grassStrandWaveSpeed,windStrength:e.grassStrandWindStrength}}const ea=-.86,at=Object.freeze({combo:"combo",default:"default",shell:"shell",strand:"strand"});Ie.preload(Object.values(ue));function Jr(){const e=Er(),a=tt(e,"plain"),s=tt(e,"combo"),c=tt(e,"shell"),t=Lr(e),n=Fr(e),l=tt(e,"strand"),x=Br(e),R=Ur(e),k=e.specimenMode??at.default,T=lt.degToRad(e.rabbitRotationYDeg),C=ea-e.specimenY,u={furProps:t,technique:he.shell},A={furProps:x,technique:he.strand},v={furProps:n,technique:he.shell},m={furProps:R,technique:he.strand};let w=a,D=[],Y=[];return k===at.shell?(w=c,D=[u],Y=[v]):k===at.strand?(w=l,D=[A],Y=[m]):k===at.combo&&(w=s,D=[u,A],Y=[v,m]),p.jsxs(p.Fragment,{children:[p.jsx("color",{attach:"background",args:[e.sceneBackgroundColor]}),p.jsx(Ua,{makeDefault:!0,fov:e.cameraFov,position:[e.cameraX,e.cameraY,e.cameraZ]}),p.jsx(za,{enableDamping:!0,maxDistance:e.cameraMaxDistance,minDistance:e.cameraMinDistance,target:[e.cameraTargetX,e.cameraTargetY,e.cameraTargetZ]}),p.jsx("ambientLight",{intensity:e.ambientLightIntensity}),p.jsx("directionalLight",{intensity:e.keyLightIntensity,position:[2.8,3.2,2.5]}),p.jsx("directionalLight",{intensity:e.fillLightIntensity,position:[-2.8,1.8,-2.4]}),p.jsxs("mesh",{position:[0,ea,0],rotation:[-Math.PI/2,0,0],children:[p.jsx("circleGeometry",{args:[e.groundSize,64]}),p.jsx("meshStandardMaterial",{color:e.groundColor,roughness:1})]}),p.jsx(wr,{floorY:C,furLayers:D,offsetY:e.rabbitOffsetY,patchFurLayers:Y,patchProps:w,position:[0,e.specimenY,0],rotationY:T,scale:e.rabbitScale})]})}export{Jr as default};
