import{q as J,bt as va,bb as ha,aM as pa,al as Ct,p as st,ag as Qe,r as n,j as p,af as Re,n as we,bj as ga,V as T,bf as Kt,bu as tt,ab as Jt,a2 as Mt,Y as ge,bN as At,Q as pt,bE as We,da as ba,b4 as Sa,bC as xa,br as Ie,Z as kt,ak as pe,M as ya,bg as gt,aJ as Ee,dh as Ca,m as ea,b8 as Ma,aR as Aa,c7 as ka,B as Pa,J as Ia,U as be}from"./index-DR3zOQ_r.js";import{u as De}from"./Texture-DS7gC6wI.js";import{u as b,f as _,X as bt,a3 as se,af as Ta,j as oe,P as xe,a2 as St,a1 as Le,T as Te,i as ae,A as Ra,s as ye,x as wa,q as Ce,r as Be,b as at,b1 as ta,b2 as aa,d as ra,W as Se,b3 as Da,F as rt,a5 as nt,aW as je}from"./three.tsl-DcctBAm2.js";import{R as Wa}from"./Rabbit-CFszRele.js";import{n as Na,s as Pt}from"./perlinNoiseNodes-DIE70wcF.js";import{u as Ea}from"./usePresetsFolder-Q--zsdoB.js";import{P as La}from"./PerspectiveCamera-Ct4ZRosb.js";import{O as Ba}from"./OrbitControls-Ab5mnQG9.js";const he=Object.freeze({shell:"shell",strand:"strand"}),Fa=24,na=24e3,oa=1e5;function Ua(e){return e&&typeof e=="object"&&Object.prototype.hasOwnProperty.call(e,"current")?e.current:e}function vt(e){return Array.isArray(e)?e[0]??null:e??null}function It(e){const a=Ua(e);if(!a)return null;if(a.isMesh||a.isSkinnedMesh)return a;let s=null;return a.traverse?.(d=>{!s&&(d.isMesh||d.isSkinnedMesh)&&(s=d)}),s}function za(e,a="#ffffff"){const s=new J(a);return e?.color?.isColor?(s.copy(e.color),s):(e?.color!==void 0&&s.set(e.color),s)}function _a(e){return vt(e)?.map??null}function Oa(e,a=1){if(!e)return a;e.boundingSphere||e.computeBoundingSphere();const s=e.boundingSphere?.radius;return!Number.isFinite(s)||s<=1e-6?a:s}function it(e=[1,0]){const a=new Qe(Number.isFinite(e?.[0])?e[0]:1,Number.isFinite(e?.[1])?e[1]:0);return a.lengthSq()<=1e-6&&a.set(1,0),a.normalize()}function ja(e,a){!e||!a||(e.position.copy(a.position),e.quaternion.copy(a.quaternion),e.scale.copy(a.scale))}function Tt(e=1){let a=Math.floor(e)%2147483647;return a<=0&&(a+=2147483646),()=>(a=a*16807%2147483647,(a-1)/2147483646)}function Fe(e="#ffffff"){const a=new J(e),s=new Uint8Array([Math.round(a.r*255),Math.round(a.g*255),Math.round(a.b*255),255]),d=new va(s,1,1,ha);return d.colorSpace=pa,d.generateMipmaps=!1,d.magFilter=Ct,d.minFilter=Ct,d.needsUpdate=!0,d}function sa(e=18){return st.clamp(Math.round(e),1,Fa)}function ia(e=5e3,a=!1){return st.clamp(Math.round(e),1,a?oa:na)}const lt=n.forwardRef(function({sourceMesh:a,geometry:s=null,material:d=null,children:t=null,...o},u){const y=n.useRef();return n.useImperativeHandle(u,()=>y.current),n.useLayoutEffect(()=>{!y.current||!a?.skeleton||!a?.bindMatrix||(y.current.bindMode=a.bindMode,y.current.bind(a.skeleton,a.bindMatrix))},[a]),a?.skeleton?p.jsx("skinnedMesh",{ref:y,geometry:s||a.geometry,material:d,skeleton:a.skeleton,...o,children:t}):null});function Ue({onPointerDown:e,onPointerLeave:a,onPointerMove:s,showInteractionSurface:d=!1,source:t}){const o=d,u={color:o?"#39ff96":"#ffffff",depthTest:!o,depthWrite:!1,opacity:o?.95:0,polygonOffset:!1,polygonOffsetFactor:0,polygonOffsetUnits:0,side:Re,transparent:!0,wireframe:o};return t.isSkinnedMesh&&t.mesh?p.jsx(lt,{frustumCulled:!1,onPointerDown:e,onPointerLeave:a,onPointerMove:s,sourceMesh:t.mesh,children:p.jsx("meshBasicMaterial",{...u})}):p.jsx("mesh",{geometry:t.geometry,onPointerDown:e,onPointerLeave:a,onPointerMove:s,children:p.jsx("meshBasicMaterial",{...u})})}const ze=n.forwardRef(function({children:a,source:s,...d},t){const o=n.useRef();n.useImperativeHandle(t,()=>o.current),we(()=>{s?.mesh&&o.current&&ja(o.current,s.mesh)});const u=n.useMemo(()=>p.jsx("group",{ref:o,...d,children:a}),[a,d]);return s?.mesh?.parent?ga(u,s.mesh.parent):u}),Rt=[.6,.6,.6,1],wt=[1,1,1,0],Va="/textures/fur/uneven-alpha.png";function Dt(){return null}const Ya=`
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
`,Ha=`
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
`;function Wt(e,a){const s=Array.isArray(e)?e:a;return{alpha:s[3]??a[3],color:new J(s[0],s[1],s[2])}}function Ga({alphaMap:e,alphaEnd:a,alphaStart:s,baseColor:d,colorEnd:t,colorStart:o,fallbackTexture:u,layerIndex:y,layerThickness:R,layersCount:P,source:I,interactionRadius:C,interactionStrength:l,stiffness:A,waveScale:v}){const m=new Jt({depthWrite:!1,fragmentShader:Ha,side:Re,transparent:!0,uniforms:{uAlphaEnd:{value:a},uAlphaMap:{value:e||u},uAlphaStart:{value:s},uBaseColor:{value:d.clone()},uColorEnd:{value:t.clone()},uColorStart:{value:o.clone()},uInteractorEnabled:{value:0},uInteractorDir:{value:new T(1,0,0)},uInteractorNormal:{value:new T(0,1,0)},uInteractorPos:{value:new T(1e3,1e3,1e3)},uInteractorRadius:{value:C},uInteractorStrength:{value:l},uLayerIndex:{value:y},uLayerThickness:{value:R},uLayersCount:{value:P},uSourceMap:{value:I.map||u},uStiffness:{value:A},uTime:{value:0},uUseSourceMap:{value:I.map?1:0},uWaveScale:{value:v}},vertexShader:Ya});return m.skinning=I.isSkinnedMesh,m}function qa({source:e,layers:a=null,shellCount:s=20,thickness:d=null,shellSpacing:t=null,waveScale:o=.06,stiffness:u=2.75,startColor:y=Rt,endColor:R=wt,alphaTexturePath:P=Va,rootColor:I=null,interactive:C=!1,interactionRadius:l=.18,interactionStrength:A=1.2,showInteractionSurface:v=!1,...m}){const w=n.useRef(),D=n.useRef(new T),Y=n.useRef(new T(0,1,0)),W=n.useRef(new T),j=n.useRef(new T(1,0,0)),M=n.useRef(),F=n.useMemo(()=>Fe(),[]),k=De(P),H=C||v,U=n.useMemo(()=>sa(a??s),[a,s]),f=n.useMemo(()=>{const c=e.baseColor.clone();return I&&c.set(I),c},[I,e.baseColor]),N=n.useMemo(()=>Wt(y,Rt),[y]),S=n.useMemo(()=>Wt(R,wt),[R]),O=d??t??.018,B=l*(e.radius||1),x=o,E=B,r=n.useMemo(()=>Array.from({length:U},(c,h)=>Ga({alphaMap:k,alphaEnd:S.alpha,alphaStart:N.alpha,baseColor:f,colorEnd:S.color,colorStart:N.color,fallbackTexture:F,interactionRadius:B,interactionStrength:A,layerIndex:h,layerThickness:O,layersCount:U,source:e,stiffness:u,waveScale:x})),[k,F,f,S.alpha,S.color,B,A,U,O,N.alpha,N.color,x,e,u]);n.useEffect(()=>{k&&(k.colorSpace=Kt,k.wrapS=tt,k.wrapT=tt,k.needsUpdate=!0)},[k]),n.useEffect(()=>()=>{F.dispose()},[F]),n.useEffect(()=>()=>{r.forEach(c=>c.dispose())},[r]),n.useEffect(()=>{r.forEach((c,h)=>{const{uniforms:i}=c;i.uAlphaEnd.value=S.alpha,i.uAlphaMap.value=k||F,i.uAlphaStart.value=N.alpha,i.uBaseColor.value.copy(f),i.uColorEnd.value.copy(S.color),i.uColorStart.value.copy(N.color),i.uInteractorRadius.value=B,i.uInteractorStrength.value=A,i.uLayerIndex.value=h,i.uLayerThickness.value=O,i.uLayersCount.value=U,i.uSourceMap.value=e.map||F,i.uStiffness.value=u,i.uUseSourceMap.value=e.map?1:0,i.uWaveScale.value=x})},[k,F,r,f,S.alpha,S.color,B,A,U,O,N.alpha,N.color,x,e.map,u]);const g=n.useCallback(()=>{!M.current||!v||(M.current.visible=!0,M.current.position.copy(D.current))},[v]),G=n.useCallback(c=>{if(!C||!w.current)return;c.stopPropagation(),D.current.copy(c.point),w.current.worldToLocal(D.current),c.face?.normal&&Y.current.copy(c.face.normal).normalize();const h=new T().subVectors(D.current,W.current);h.lengthSq()>1e-8&&j.current.copy(h.normalize()),W.current.copy(D.current),r.forEach(i=>{const V=i.uniforms;V.uInteractorEnabled.value=1,V.uInteractorDir.value.copy(j.current),V.uInteractorNormal.value.copy(Y.current),V.uInteractorPos.value.copy(D.current)}),g()},[C,r,g]),z=n.useCallback(()=>{r.forEach(c=>{const h=c.uniforms;h.uInteractorEnabled.value=0,h.uInteractorDir.value.set(1,0,0),h.uInteractorNormal.value.set(0,1,0)}),M.current&&(M.current.visible=!1)},[r]);return n.useEffect(()=>{M.current&&(M.current.visible=!1)},[v]),we((c,h)=>{r.forEach(i=>{const V=i.uniforms;V.uTime.value+=h})}),p.jsxs(ze,{ref:w,source:e,...m,children:[r.map((c,h)=>e.isSkinnedMesh&&e.mesh?p.jsx(lt,{frustumCulled:!1,material:c,raycast:Dt,renderOrder:20+h,sourceMesh:e.mesh},c.uuid):p.jsx("mesh",{frustumCulled:!1,geometry:e.geometry,material:c,raycast:Dt,renderOrder:20+h},c.uuid)),H?p.jsx(Ue,{onPointerDown:C?G:void 0,onPointerLeave:C?z:void 0,onPointerMove:C?G:void 0,showInteractionSurface:v,source:e}):null,v?p.jsxs("mesh",{ref:M,renderOrder:200,children:[p.jsx("sphereGeometry",{args:[E,20,20]}),p.jsx("meshBasicMaterial",{color:"#00ff88",depthTest:!1,depthWrite:!1,opacity:.95,transparent:!0,wireframe:!0})]}):null]})}const Xa="/textures/fur/uneven-alpha.png",Za=`
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
`,Qa=`
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
`;function $a({source:e,geometry:a,bladeHeight:s=.045,alphaTexturePath:d=Xa,rootColor:t=null,tipColor:o=null,tipMix:u=.18,curvature:y=.05,windStrength:R=.18,noiseFrequency:P=.4,noiseAmplitude:I=.02,waveAmplitude:C=.025,waveLength:l=.7,waveSpeed:A=1.2,waveDirection:v=[1,0],interactive:m=!0,interactionRadius:w=.18,interactionStrength:D=1.2,showInteractionSurface:Y=!1,...W}){const j=n.useRef(),M=n.useRef(new T),F=o!=null,k=e.radius||1,H=s*k,U=w*k,f=I*k,N=C*k,S=n.useMemo(()=>Fe(),[]),O=De(d),B=n.useMemo(()=>{const z=e.baseColor.clone();return t&&z.set(t),z},[t,e.baseColor]),x=n.useMemo(()=>o?new J(o):e.baseColor.clone(),[e.baseColor,o]),E=n.useMemo(()=>it(v),[v]),r=n.useMemo(()=>{const z=new Jt({fragmentShader:Qa,side:Re,uniforms:{uAlphaMap:{value:O||S},uBaseColor:{value:B.clone()},uBladeHeight:{value:H},uCurvature:{value:y},uInteractorEnabled:{value:0},uInteractorPos:{value:new T(1e3,1e3,1e3)},uInteractorRadius:{value:U},uInteractorStrength:{value:D},uNoiseAmplitude:{value:f},uNoiseFrequency:{value:P},uSourceMap:{value:e.map||S},uTime:{value:0},uTipColor:{value:x.clone()},uTipMix:{value:u},uUseExplicitTipColor:{value:F?1:0},uUseSourceMap:{value:e.map?1:0},uWaveAmplitude:{value:N},uWaveDirection:{value:E.clone()},uWaveLength:{value:l},uWaveSpeed:{value:A},uWindStrength:{value:R}},vertexShader:Za});return z.skinning=!0,z},[]);n.useEffect(()=>()=>{S.dispose(),r.dispose()},[S,r]),n.useEffect(()=>{r.uniforms.uAlphaMap.value=O||S,r.uniforms.uBaseColor.value.copy(B),r.uniforms.uBladeHeight.value=H,r.uniforms.uCurvature.value=y,r.uniforms.uInteractorRadius.value=U,r.uniforms.uInteractorStrength.value=D,r.uniforms.uNoiseAmplitude.value=f,r.uniforms.uNoiseFrequency.value=P,r.uniforms.uSourceMap.value=e.map||S,r.uniforms.uTipColor.value.copy(x),r.uniforms.uTipMix.value=u,r.uniforms.uUseExplicitTipColor.value=F?1:0,r.uniforms.uUseSourceMap.value=e.map?1:0,r.uniforms.uWaveAmplitude.value=N,r.uniforms.uWaveDirection.value.copy(E),r.uniforms.uWaveLength.value=l,r.uniforms.uWaveSpeed.value=A,r.uniforms.uWindStrength.value=R},[O,y,S,D,r,P,B,H,U,f,x,N,E,e.map,u,F,l,A,R]);const g=n.useCallback(z=>{!m||!j.current||(z.stopPropagation(),M.current.copy(z.point),j.current.worldToLocal(M.current),r.uniforms.uInteractorEnabled.value=1,r.uniforms.uInteractorPos.value.copy(M.current))},[m,r]),G=n.useCallback(()=>{r.uniforms.uInteractorEnabled.value=0},[r]);return we((z,c)=>{r.uniforms.uTime.value+=c}),!a||!e.mesh?null:p.jsxs(ze,{ref:j,source:e,...W,children:[p.jsx(lt,{frustumCulled:!1,geometry:a,material:r,sourceMesh:e.mesh}),p.jsx(Ue,{onPointerDown:m?g:void 0,onPointerLeave:m?G:void 0,onPointerMove:m?g:void 0,showInteractionSurface:Y,source:e})]})}const ut=new T,ct=new T,Nt=new T,Et=new ya,Ve=new pt,Ye=new T,He=new T,Lt=new T,Bt=new pe,Ft=new pe,Ut=new pe,zt=new pe,Ge=new pe,_t=new pe,Ot=new pe,jt=new pe,Vt=new pe,ue=new T,qe=new T,Ne=new T,Xe=new T,Ze=new T,ve=new T,dt=3,Ka=.65,Ja=1.5,er=.82,tr=1.12;function ar(e,a,s=Math.random,d={normals:new Float32Array(a*3),positions:new Float32Array(a*3),uvs:new Float32Array(a*2)}){const t=d;let o=e;o.index||(o=o.toNonIndexed());const u=o.getAttribute("position");if(!u)throw new Error("Strand fur source geometry is missing a position attribute.");o.getAttribute("normal")||o.computeVertexNormals();const y=o.getAttribute("normal"),R=o.getAttribute("skinIndex"),P=o.getAttribute("skinWeight"),I=o.getAttribute("uv"),C=!!(R&&P),l=o.index?.array,A=l?l.length/3:u.count/3,v=new Float32Array(A),m=new T,w=new T,D=new T,Y=new T,W=new T,j=new T,M=new T,F=new T,k=new T,H=new Map,U=new Qe,f=new Qe,N=new Qe,S=new Qe;C&&(t.skinIndices||=new Float32Array(a*4),t.skinWeights||=new Float32Array(a*4));let O=0;for(let x=0;x<A;x+=1){const E=l?l[x*3]:x*3,r=l?l[x*3+1]:x*3+1,g=l?l[x*3+2]:x*3+2;m.fromBufferAttribute(u,E),w.fromBufferAttribute(u,r),D.fromBufferAttribute(u,g),O+=Y.copy(w).sub(m).cross(W.copy(D).sub(m)).length()*.5,v[x]=O}const B=x=>{let E=0,r=A-1;for(;E<r;){const g=Math.floor((E+r)/2);x<=v[g]?r=g:E=g+1}return E};for(let x=0;x<a;x+=1){const E=B(s()*O),r=l?l[E*3]:E*3,g=l?l[E*3+1]:E*3+1,G=l?l[E*3+2]:E*3+2;let z=s(),c=s();z+c>1&&(z=1-z,c=1-c);const h=1-z-c;if(m.fromBufferAttribute(u,r),w.fromBufferAttribute(u,g),D.fromBufferAttribute(u,G),t.positions[x*3]=m.x*h+w.x*z+D.x*c,t.positions[x*3+1]=m.y*h+w.y*z+D.y*c,t.positions[x*3+2]=m.z*h+w.z*z+D.z*c,M.fromBufferAttribute(y,r),F.fromBufferAttribute(y,g),k.fromBufferAttribute(y,G),j.copy(M).multiplyScalar(h).addScaledVector(F,z).addScaledVector(k,c).normalize(),t.normals[x*3]=j.x,t.normals[x*3+1]=j.y,t.normals[x*3+2]=j.z,C){H.clear(),Bt.fromBufferAttribute(R,r),Ft.fromBufferAttribute(R,g),Ut.fromBufferAttribute(R,G),Ot.fromBufferAttribute(P,r),jt.fromBufferAttribute(P,g),Vt.fromBufferAttribute(P,G),[[Bt,Ot,h],[Ft,jt,z],[Ut,Vt,c]].forEach(([X,L,Z])=>{for(let Q=0;Q<4;Q+=1){const ce=X.getComponent(Q),K=L.getComponent(Q)*Z;Number.isFinite(ce)&&K>1e-5&&H.set(ce,(H.get(ce)||0)+K)}});const i=Array.from(H.entries()).sort((X,L)=>L[1]-X[1]).slice(0,4),V=i.reduce((X,[,L])=>X+L,0);for(let X=0;X<4;X+=1){const L=x*4+X,Z=i[X];t.skinIndices[L]=Z?.[0]??0,t.skinWeights[L]=Z?Z[1]/Math.max(V,1e-6):0}}I?(U.fromBufferAttribute(I,r),f.fromBufferAttribute(I,g),N.fromBufferAttribute(I,G),S.copy(U).multiplyScalar(h).addScaledVector(f,z).addScaledVector(N,c),t.uvs[x*2]=S.x,t.uvs[x*2+1]=S.y):(t.uvs[x*2]=0,t.uvs[x*2+1]=0)}return t}function ht(e,a=new pt){const s=new T(0,1,0);if(s.dot(e)<-.9995){const d=new T(1,0,0).cross(s);return d.lengthSq()<1e-6&&d.set(0,0,1),d.normalize(),a.setFromAxisAngle(d,Math.PI),a}return a.setFromUnitVectors(s,e.clone().normalize()),a}function la({bladeWidth:e=.008,isSkinnedMesh:a=!1,seed:s=1,sourceGeometry:d,strandCount:t=4e3}){if(!d)return null;const o=Math.max(5e-4,Math.min(.5,e*.5)),u=dt*3,y=new Float32Array(u*3),R=new Float32Array(u*2),P=new Float32Array(u*3),I=new Uint16Array(u),C=new Mt;for(let f=0;f<dt;f+=1){const N=Math.PI/dt*f,S=Math.cos(N),O=Math.sin(N),B=f*3,x=f*6;ue.set(-o,0,0),qe.set(ue.x*S-ue.z*O,ue.y,ue.x*O+ue.z*S),Ne.copy(qe),ue.set(o,0,0),qe.set(ue.x*S-ue.z*O,ue.y,ue.x*O+ue.z*S),Xe.copy(qe),Ze.set(0,1,0),ve.copy(Xe).sub(Ne).cross(qe.copy(Ze).sub(Ne)).normalize(),y.set([Ne.x,Ne.y,Ne.z,Xe.x,Xe.y,Xe.z,Ze.x,Ze.y,Ze.z],B*3),R.set([0,0,1,0,.5,1],x),P.set([ve.x,ve.y,ve.z,ve.x,ve.y,ve.z,ve.x,ve.y,ve.z],B*3),I.set([B,B+1,B+2],B)}C.setAttribute("position",new ge(y,3)),C.setAttribute("uv",new ge(R,2)),C.setAttribute("normal",new ge(P,3)),C.setIndex(new ge(I,1));const l=ar(d,t,Tt(s)),A=Tt(s*17+5),v=new T,m=new pt,w=a?er:Ka,Y=(a?tr:Ja)-w;if(a&&l.skinIndices&&l.skinWeights){const f=C.getAttribute("position").count,N=C.index.count,S=f*t,O=N*t,B=C.getAttribute("position").array,x=C.getAttribute("uv").array,E=C.getAttribute("normal").array,r=C.index.array,g=new Mt,G=new Float32Array(S*3),z=new Float32Array(S*2),c=new Float32Array(S*3),h=8,i=6,V=new Float32Array(S*h),X=new Float32Array(S*i),L=new Uint16Array(S*4),Z=new Float32Array(S*4),Q=S>65535?new Uint32Array(O):new Uint16Array(O),ce=new At(V,h),K=new At(X,i);for(let q=0;q<t;q+=1){const Me=w+A()*Y,Ae=A()*Math.PI*2,ke=q*f;v.set(l.normals[q*3],l.normals[q*3+1],l.normals[q*3+2]).normalize(),ht(v,m);for(let $=0;$<f;$+=1){const de=ke+$,re=de*3,me=de*2,ee=de*4,ie=de*h,ne=de*i,te=$*3,fe=$*2;G[re]=B[te],G[re+1]=B[te+1],G[re+2]=B[te+2],c[re]=E[te],c[re+1]=E[te+1],c[re+2]=E[te+2],z[me]=x[fe],z[me+1]=x[fe+1],V[ie]=l.positions[q*3],V[ie+1]=l.positions[q*3+1],V[ie+2]=l.positions[q*3+2],V[ie+3]=l.normals[q*3],V[ie+4]=l.normals[q*3+1],V[ie+5]=l.normals[q*3+2],V[ie+6]=l.uvs[q*2],V[ie+7]=l.uvs[q*2+1],X[ne]=Me,X[ne+1]=Ae,X[ne+2]=m.x,X[ne+3]=m.y,X[ne+4]=m.z,X[ne+5]=m.w,L[ee]=l.skinIndices[q*4],L[ee+1]=l.skinIndices[q*4+1],L[ee+2]=l.skinIndices[q*4+2],L[ee+3]=l.skinIndices[q*4+3],Z[ee]=l.skinWeights[q*4],Z[ee+1]=l.skinWeights[q*4+1],Z[ee+2]=l.skinWeights[q*4+2],Z[ee+3]=l.skinWeights[q*4+3]}for(let $=0;$<N;$+=1)Q[q*N+$]=r[$]+ke}return g.setAttribute("position",new ge(G,3)),g.setAttribute("uv",new ge(z,2)),g.setAttribute("normal",new ge(c,3)),g.setAttribute("aRootPosition",new We(ce,3,0)),g.setAttribute("aRootNormal",new We(ce,3,3)),g.setAttribute("aScale",new We(K,1,0)),g.setAttribute("aPhase",new We(K,1,1)),g.setAttribute("aQuat",new We(K,4,2)),g.setAttribute("aRootUv",new We(ce,2,6)),g.setAttribute("skinIndex",new ba(L,4)),g.setAttribute("skinWeight",new Sa(Z,4)),g.setIndex(new ge(Q,1)),g.userData.furSkinning=null,g.userData.strandGeometryType="skinned",g}const W=new xa;W.index=C.index,W.attributes.position=C.attributes.position,W.attributes.uv=C.attributes.uv,W.attributes.normal=C.attributes.normal;const j=new Float32Array(t*3),M=new Float32Array(t*3),F=new Float32Array(t),k=new Float32Array(t),H=new Float32Array(t*4),U=new Float32Array(t*2);for(let f=0;f<t;f+=1)j[f*3]=l.positions[f*3],j[f*3+1]=l.positions[f*3+1],j[f*3+2]=l.positions[f*3+2],M[f*3]=l.normals[f*3],M[f*3+1]=l.normals[f*3+1],M[f*3+2]=l.normals[f*3+2],v.set(l.normals[f*3],l.normals[f*3+1],l.normals[f*3+2]).normalize(),ht(v,m),H[f*4]=m.x,H[f*4+1]=m.y,H[f*4+2]=m.z,H[f*4+3]=m.w,U[f*2]=l.uvs[f*2],U[f*2+1]=l.uvs[f*2+1],F[f]=w+A()*Y,k[f]=A()*Math.PI*2;return W.setAttribute("aOffset",new Ie(j,3)),W.setAttribute("aRootPosition",new Ie(j,3)),W.setAttribute("aRootNormal",new Ie(M,3)),W.setAttribute("aScale",new Ie(F,1)),W.setAttribute("aPhase",new Ie(k,1)),W.setAttribute("aQuat",new Ie(H,4)),W.setAttribute("aRootUv",new Ie(U,2)),l.skinIndices&&l.skinWeights?(W.userData.furSkinning={bindNormals:l.normals,bindPositions:l.positions,skinIndices:l.skinIndices,skinWeights:l.skinWeights},W.getAttribute("aOffset").setUsage(kt),W.getAttribute("aQuat").setUsage(kt)):W.userData.furSkinning=null,W.instanceCount=t,W.userData.strandGeometryType="instanced",W}function Yt(e,a,s,d,t){zt.set(a.x,a.y,a.z,1).applyMatrix4(e.bindMatrix),Ge.set(0,0,0,0);for(let o=0;o<4;o+=1){const u=d[o];u>1e-5&&(Et.fromArray(e.skeleton.boneMatrices,s[o]*16),_t.copy(zt).applyMatrix4(Et),Ge.addScaledVector(_t,u))}return t.set(Ge.x,Ge.y,Ge.z),t.applyMatrix4(e.bindMatrixInverse),t}function ua(e,a){const s=e?.userData?.furSkinning;if(!s||!a?.isSkinnedMesh||!a.skeleton)return!1;const d=e.getAttribute("aOffset"),t=e.getAttribute("aQuat");if(!d||!t)return!1;a.skeleton.update();for(let o=0;o<d.count;o+=1)ut.fromArray(s.bindPositions,o*3),ct.fromArray(s.bindNormals,o*3).normalize(),Nt.copy(ut).addScaledVector(ct,.025),Yt(a,ut,s.skinIndices.subarray(o*4,o*4+4),s.skinWeights.subarray(o*4,o*4+4),He),Yt(a,Nt,s.skinIndices.subarray(o*4,o*4+4),s.skinWeights.subarray(o*4,o*4+4),Lt),Ye.copy(Lt).sub(He),Ye.lengthSq()<=1e-6?Ye.copy(ct):Ye.normalize(),ht(Ye,Ve),d.setXYZ(o,He.x,He.y,He.z),t.setXYZW(o,Ve.x,Ve.y,Ve.z,Ve.w);return d.needsUpdate=!0,t.needsUpdate=!0,!0}const rr="/textures/fur/uneven-alpha.png",nr=`
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
`,or=`
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
`;function sr({source:e,count:a=5e3,bladeHeight:s=.045,bladeWidth:d=.008,alphaTexturePath:t=rr,rootColor:o=null,tipColor:u=null,tipMix:y=.18,curvature:R=.05,windStrength:P=.18,noiseFrequency:I=.4,noiseAmplitude:C=.02,waveAmplitude:l=.025,waveLength:A=.7,waveSpeed:v=1.2,waveDirection:m=[1,0],interactive:w=!0,interactionRadius:D=.18,interactionStrength:Y=1.2,seed:W=1,showInteractionSurface:j=!1,...M}){const F=n.useRef(),k=n.useRef(new T),H=u!=null,U=e.radius||1,f=s*U,N=d*U,S=D*U,O=C*U,B=l*U,x=n.useMemo(()=>ia(a,e.isSkinnedMesh),[a,e.isSkinnedMesh]),E=n.useMemo(()=>Fe(),[]),r=De(t),g=n.useMemo(()=>la({bladeWidth:N,isSkinnedMesh:e.isSkinnedMesh,seed:W,sourceGeometry:e.geometry,strandCount:x}),[N,x,W,e.geometry,e.isSkinnedMesh]),G=g?.userData?.strandGeometryType==="skinned",z=n.useMemo(()=>{const L=e.baseColor.clone();return o&&L.set(o),L},[o,e.baseColor]),c=n.useMemo(()=>u?new J(u):e.baseColor.clone(),[e.baseColor,u]),h=n.useMemo(()=>it(m),[m]),i=n.useRef({uAlphaMap:{value:r||E},uBaseColor:{value:z.clone()},uBladeHeight:{value:f},uCurvature:{value:R},uInteractorEnabled:{value:0},uInteractorPos:{value:new T(1e3,1e3,1e3)},uInteractorRadius:{value:S},uInteractorStrength:{value:Y},uNoiseAmplitude:{value:O},uNoiseFrequency:{value:I},uSourceMap:{value:e.map||E},uTime:{value:0},uTipColor:{value:c.clone()},uTipMix:{value:y},uUseExplicitTipColor:{value:H?1:0},uUseSourceMap:{value:e.map?1:0},uWaveAmplitude:{value:B},uWaveDirection:{value:h.clone()},uWaveLength:{value:A},uWaveSpeed:{value:v},uWindStrength:{value:P}});n.useEffect(()=>()=>E.dispose(),[E]),n.useEffect(()=>{const L=i.current;L.uAlphaMap.value=r||E,L.uBaseColor.value.copy(z),L.uTipColor.value.copy(c),L.uBladeHeight.value=f,L.uCurvature.value=R,L.uInteractorRadius.value=S,L.uInteractorStrength.value=Y,L.uNoiseAmplitude.value=O,L.uNoiseFrequency.value=I,L.uSourceMap.value=e.map||E,L.uTipMix.value=y,L.uUseExplicitTipColor.value=H?1:0,L.uUseSourceMap.value=e.map?1:0,L.uWaveAmplitude.value=B,L.uWaveDirection.value.copy(h),L.uWaveLength.value=A,L.uWaveSpeed.value=v,L.uWindStrength.value=P},[r,f,R,E,S,Y,O,I,z,c,h,B,e.map,y,H,A,v,P]);const V=n.useCallback(L=>{!w||!F.current||(L.stopPropagation(),k.current.copy(L.point),F.current.worldToLocal(k.current),i.current.uInteractorEnabled.value=1,i.current.uInteractorPos.value.copy(k.current))},[w]),X=n.useCallback(()=>{i.current.uInteractorEnabled.value=0},[]);return we((L,Z)=>{i.current.uTime.value+=Z,!G&&e.isSkinnedMesh&&e.mesh&&ua(g,e.mesh)}),g?G&&e.mesh?p.jsx($a,{alphaTexturePath:t,bladeHeight:s,curvature:R,geometry:g,interactionRadius:D,interactionStrength:Y,interactive:w,noiseAmplitude:C,noiseFrequency:I,rootColor:o,showInteractionSurface:j,source:e,tipColor:u,tipMix:y,waveAmplitude:l,waveDirection:m,waveLength:A,waveSpeed:v,windStrength:P,...M}):p.jsxs(ze,{ref:F,source:e,...M,children:[p.jsx("mesh",{frustumCulled:!1,geometry:g,children:p.jsx("rawShaderMaterial",{fragmentShader:or,side:Re,uniforms:i.current,vertexShader:nr})}),p.jsx(Ue,{onPointerDown:w?V:void 0,onPointerLeave:w?X:void 0,onPointerMove:w?V:void 0,showInteractionSurface:j,source:e})]}):null}function ca({sourceGeometry:e=null,sourceMaterial:a=null,sourceMesh:s=null}){const[d,t]=n.useState(()=>It(s));return n.useLayoutEffect(()=>{const o=It(s);o!==d&&t(o)},[d,s]),n.useMemo(()=>{const o=vt(a)||vt(d?.material);return{baseColor:za(o),geometry:e||d?.geometry||null,isSkinnedMesh:d?.isSkinnedMesh===!0,map:_a(o),material:o,mesh:d,radius:Oa(e||d?.geometry)}},[d,e,a])}function ir({technique:e=he.strand,sourceGeometry:a=null,sourceMaterial:s=null,sourceMesh:d=null,...t}){const o=ca({sourceGeometry:a,sourceMaterial:s,sourceMesh:d});return o.geometry?e===he.shell?p.jsx(qa,{...t,source:o}):e===he.strand?p.jsx(sr,{...t,source:o}):null:null}const Ht=[.6,.6,.6,1],Gt=[1,1,1,0],lr="/textures/fur/uneven-alpha.png",ur=6.2831852,cr=.1376,dr=.3726,mr=.2546;function qt(){return null}function Xt(e,a){const s=Array.isArray(e)?e:a;return{alpha:s[3]??a[3],color:new J(s[0],s[1],s[2])}}function fr({alphaEnd:e,alphaMap:a,alphaStart:s,baseColor:d,colorEnd:t,colorStart:o,layerIndex:u,layerThickness:y,layersCount:R,sourceMap:P,interactionRadius:I,interactionStrength:C,stiffness:l,useSourceMap:A,waveScale:v}){const m={alphaEnd:b(e),alphaStart:b(s),baseColor:b(d.clone()),colorEnd:b(t.clone()),colorStart:b(o.clone()),interactorEnabled:b(0),interactorDir:b(new T(1,0,0)),interactorNormal:b(new T(0,1,0)),interactorPos:b(new T(1e3,1e3,1e3)),interactorRadius:b(I),interactorStrength:b(C),layerIndex:b(u),layerThickness:b(y),layersCount:b(R),stiffness:b(l),time:b(0),useSourceMap:b(A?1:0),waveScale:b(v)},w=new gt({alphaTest:.001,depthWrite:!1,side:Re,transparent:!0}),D=m.layerIndex.div(m.layersCount.max(_(1))),Y=m.layerIndex.add(1).mul(m.layerThickness),W=m.waveScale.mul(bt(D.max(_(1e-4)),m.stiffness)),j=m.time.mul(ur),M=se.toVar(),F=Ta.normalize().toVar(),k=m.interactorNormal.normalize(),H=oe(M.x.add(F.x.mul(Y)).add(xe(j.add(M.x.add(M.y).add(M.z).mul(cr))).mul(W)),M.y.add(F.y.mul(Y)).add(St(j.add(M.x.sub(M.y).add(M.z).mul(dr))).mul(W)),M.z.add(F.z.mul(Y)).add(xe(j.add(M.x.add(M.y).sub(M.z).mul(mr))).mul(W))),U=H.sub(m.interactorPos).toVar(),f=Le(U,k).toVar(),N=U.sub(k.mul(f)).toVar(),S=Te(N),O=N.div(S.max(_(1e-5))),B=m.interactorDir.sub(k.mul(Le(m.interactorDir,k))).toVar(),x=Te(B),E=ae(O,B.div(x.max(_(1e-5))),Ra(_(1e-4),x)),r=m.layerThickness.mul(2).max(m.interactorRadius.mul(.08)),g=_(1).sub(ye(r,r.mul(2.5),wa(f.sub(Y)))),G=ae(_(1),_(.45),D),z=ae(_(.35),_(1),D),c=_(1).sub(ye(0,m.interactorRadius,S)).mul(g).mul(m.interactorStrength).mul(m.interactorEnabled),h=Ce(c.mul(G).mul(.32),0,.6),i=ae(H.add(E.mul(c).mul(z).mul(.85)),M,h).sub(F.mul(c).mul(G).mul(.08));let V=m.baseColor;P&&(V=ae(m.baseColor,m.baseColor.mul(Be(new Ee(P),at()).rgb),m.useSourceMap)),w.vertexNode=ta.mul(aa).mul(ra(i,1));const X=V.mul(ae(m.colorStart,m.colorEnd,D));return w.colorNode=X,w.opacityNode=Be(new Ee(a),at()).r.mul(ae(m.alphaStart,m.alphaEnd,D)),{material:w,uniforms:m}}function vr({source:e,layers:a=null,shellCount:s=20,thickness:d=null,shellSpacing:t=null,waveScale:o=.06,stiffness:u=2.75,startColor:y=Ht,endColor:R=Gt,alphaTexturePath:P=lr,rootColor:I=null,interactive:C=!1,interactionRadius:l=.18,interactionStrength:A=1.2,showInteractionSurface:v=!1,...m}){const w=n.useRef(),D=n.useRef(new T),Y=n.useRef(new T(0,1,0)),W=n.useRef(new T),j=n.useRef(new T(1,0,0)),M=n.useRef(),F=n.useMemo(()=>Fe(),[]),k=De(P),H=C||v,U=n.useMemo(()=>sa(a??s),[a,s]),f=n.useMemo(()=>{const c=e.baseColor.clone();return I&&c.set(I),c},[I,e.baseColor]),N=n.useMemo(()=>Xt(y,Ht),[y]),S=n.useMemo(()=>Xt(R,Gt),[R]),O=d??t??.018,B=l*(e.radius||1),x=o,E=B,r=n.useMemo(()=>Array.from({length:U},(c,h)=>fr({alphaEnd:S.alpha,alphaMap:k||F,alphaStart:N.alpha,baseColor:f,colorEnd:S.color,colorStart:N.color,interactionRadius:B,interactionStrength:A,layerIndex:h,layerThickness:O,layersCount:U,sourceMap:e.map||F,stiffness:u,useSourceMap:!!e.map,waveScale:x})),[k,F,f,S.alpha,S.color,B,A,U,O,N.alpha,N.color,x,e.map,u]);n.useEffect(()=>{k&&(k.colorSpace=Kt,k.wrapS=tt,k.wrapT=tt,k.needsUpdate=!0)},[k]),n.useEffect(()=>()=>{F.dispose()},[F]),n.useEffect(()=>()=>{r.forEach(({material:c})=>c.dispose())},[r]),n.useEffect(()=>{r.forEach((c,h)=>{const{uniforms:i}=c;i.alphaEnd.value=S.alpha,i.alphaStart.value=N.alpha,i.baseColor.value.copy(f),i.colorEnd.value.copy(S.color),i.colorStart.value.copy(N.color),i.interactorRadius.value=B,i.interactorStrength.value=A,i.layerIndex.value=h,i.layerThickness.value=O,i.layersCount.value=U,i.stiffness.value=u,i.useSourceMap.value=e.map?1:0,i.waveScale.value=x})},[r,f,S.alpha,S.color,B,A,U,O,N.alpha,N.color,x,e.map,u]);const g=n.useCallback(()=>{!M.current||!v||(M.current.visible=!0,M.current.position.copy(D.current))},[v]),G=n.useCallback(c=>{if(!C||!w.current)return;c.stopPropagation(),D.current.copy(c.point),w.current.worldToLocal(D.current),c.face?.normal&&Y.current.copy(c.face.normal).normalize();const h=new T().subVectors(D.current,W.current);h.lengthSq()>1e-8&&j.current.copy(h.normalize()),W.current.copy(D.current),r.forEach(({uniforms:i})=>{const V=i;V.interactorEnabled.value=1,V.interactorDir.value.copy(j.current),V.interactorNormal.value.copy(Y.current),V.interactorPos.value.copy(D.current)}),g()},[C,r,g]),z=n.useCallback(()=>{r.forEach(({uniforms:c})=>{const h=c;h.interactorEnabled.value=0,h.interactorDir.value.set(1,0,0),h.interactorNormal.value.set(0,1,0)}),M.current&&(M.current.visible=!1)},[r]);return n.useEffect(()=>{M.current&&(M.current.visible=!1)},[v]),we((c,h)=>{r.forEach(i=>{const V=i.uniforms;V.time.value+=h})}),p.jsxs(ze,{ref:w,source:e,...m,children:[r.map(({material:c},h)=>e.isSkinnedMesh&&e.mesh?p.jsx(lt,{frustumCulled:!1,material:c,raycast:qt,renderOrder:20+h,sourceMesh:e.mesh},c.uuid):p.jsx("mesh",{frustumCulled:!1,geometry:e.geometry,material:c,raycast:qt,renderOrder:20+h},c.uuid)),H?p.jsx(Ue,{onPointerDown:C?G:void 0,onPointerLeave:C?z:void 0,onPointerMove:C?G:void 0,showInteractionSurface:v,source:e}):null,v?p.jsxs("mesh",{ref:M,renderOrder:200,children:[p.jsx("sphereGeometry",{args:[E,20,20]}),p.jsx("meshBasicMaterial",{color:"#00ff88",depthTest:!1,depthWrite:!1,opacity:.95,transparent:!0,wireframe:!0})]}):null]})}const hr="/textures/fur/uneven-alpha.png";function pr({source:e,geometry:a,bladeHeight:s=.045,alphaTexturePath:d=hr,rootColor:t=null,tipColor:o=null,tipMix:u=.18,curvature:y=.05,windStrength:R=.18,noiseFrequency:P=.4,noiseAmplitude:I=.02,waveAmplitude:C=.025,waveLength:l=.7,waveSpeed:A=1.2,waveDirection:v=[1,0],interactive:m=!0,interactionRadius:w=.18,interactionStrength:D=1.2,showInteractionSurface:Y=!1,...W}){const j=n.useRef(),M=n.useRef(new T),F=o!=null,k=e.radius||1,H=s*k,U=w*k,f=I*k,N=C*k,S=n.useMemo(()=>Fe(),[]),O=De(d),B=n.useMemo(()=>{const c=e.baseColor.clone();return t&&c.set(t),c},[t,e.baseColor]),x=n.useMemo(()=>o?new J(o):e.baseColor.clone(),[e.baseColor,o]),E=n.useMemo(()=>it(v),[v]),r=n.useMemo(()=>({baseColor:b(B.clone()),bladeHeight:b(H),curvature:b(y),interactorEnabled:b(0),interactorPos:b(new T(1e3,1e3,1e3)),interactorRadius:b(U),interactorStrength:b(D),noiseAmplitude:b(f),noiseFrequency:b(P),time:b(0),tipColor:b(x.clone()),tipMix:b(u),useExplicitTipColor:b(F?1:0),waveAmplitude:b(N),waveDirection:b(E.clone()),waveLength:b(l),waveSpeed:b(A),windStrength:b(R)}),[]),g=n.useMemo(()=>{const c=new gt({alphaTest:.01,side:Re}),h=Se("aRootPosition","vec3"),i=Se("aRootNormal","vec3").normalize(),V=Se("aScale","float"),X=Se("aPhase","float"),L=Se("aQuat","vec4"),Z=Se("aRootUv","vec2"),Q=new Ca(e.mesh);Q.skinIndexNode=Se("skinIndex","uvec4"),Q.skinWeightNode=Se("skinWeight","vec4"),Q.bindMatrixNode=b(e.mesh.bindMatrix,"mat4"),Q.bindMatrixInverseNode=b(e.mesh.bindMatrixInverse,"mat4"),Q.boneMatricesNode=Da(e.mesh.skeleton.boneMatrices,"mat4",e.mesh.skeleton.bones.length);const ce=rt(([re,me])=>{const ee=nt(re.xyz,me);return me.add(nt(re.xyz,ee.add(me.mul(re.w))).mul(2))}),K=Ce(se.y,0,1),q=r.waveDirection.div(Te(r.waveDirection).max(_(1e-4))),Me=xe(h.x.mul(r.noiseFrequency.max(_(1e-4))).add(h.z.mul(r.noiseFrequency.max(_(1e-4)))).add(K.mul(4)).add(r.time.mul(.1))).mul(.5).add(.5),Ae=ye(_(.08),_(.65),Be(new Ee(O||S),at()).r),ke=rt(()=>{const re=oe(se.x,se.y.mul(r.bladeHeight).mul(V),se.z).toVar(),me=r.time.add(X),ee=xe(me.mul(1.3).add(h.x.mul(.2))).add(St(me.mul(.7).add(h.z.mul(.15)))).mul(r.windStrength).mul(K.mul(K)),ie=xe(Le(h.xz,q).div(r.waveLength.max(_(1e-4))).mul(6.2831852).sub(r.time.mul(r.waveSpeed))).mul(r.waveAmplitude).mul(K),ne=h.add(ce(L,re.add(oe(r.curvature.mul(K).mul(K),0,0)).add(oe(ee.mul(.4),0,ee.mul(.15))).add(oe(q.x.mul(ie),0,q.y.mul(ie))).add(oe(Me.sub(.5).mul(r.noiseAmplitude).mul(K),0,Me.sub(.5).mul(r.noiseAmplitude).mul(K).mul(.6))))).toVar(),te=Q.getSkinnedPosition(void 0,h).toVar(),fe=Q.getSkinnedNormal(void 0,i).normalize().toVar(),$e=Q.getSkinnedPosition(void 0,ne).toVar(),Pe=te.sub(r.interactorPos).sub(fe.mul(Le(te.sub(r.interactorPos),fe))).toVar(),_e=Te(Pe),Oe=Ce(_(1).sub(ye(0,r.interactorRadius,_e)).mul(r.interactorStrength).mul(r.interactorEnabled),0,1),Ke=Pe.div(_e.max(_(1e-5)));return ae($e.add(Ke.mul(Oe).mul(r.bladeHeight).mul(.9).mul(K)),te,Oe.mul(.25).mul(K))})();let $=r.baseColor;e.map&&($=r.baseColor.mul(Be(new Ee(e.map),Z).rgb));const de=ae($,r.tipColor,r.tipMix.mul(r.useExplicitTipColor));return c.vertexNode=ta.mul(aa).mul(ra(ke,1)),c.colorNode=ae($,de,bt(K,1.2)).mul(ae(_(.75),_(1.25),Me)).mul(ae(_(.82),_(1),Ae)).add(ye(.7,1,K).mul(.12)),c.opacityNode=Ae,c},[O,S,e.map,e.mesh,r]);n.useEffect(()=>()=>{S.dispose(),g.dispose()},[S,g]),n.useEffect(()=>{r.baseColor.value.copy(B),r.bladeHeight.value=H,r.curvature.value=y,r.interactorRadius.value=U,r.interactorStrength.value=D,r.noiseAmplitude.value=f,r.noiseFrequency.value=P,r.tipColor.value.copy(x),r.tipMix.value=u,r.useExplicitTipColor.value=F?1:0,r.waveAmplitude.value=N,r.waveDirection.value.copy(E),r.waveLength.value=l,r.waveSpeed.value=A,r.windStrength.value=R},[y,D,P,B,H,U,f,x,N,E,u,r,F,l,A,R]);const G=n.useCallback(c=>{!m||!j.current||(c.stopPropagation(),M.current.copy(c.point),j.current.worldToLocal(M.current),r.interactorEnabled.value=1,r.interactorPos.value.copy(M.current))},[m,r]),z=n.useCallback(()=>{r.interactorEnabled.value=0},[r]);return we((c,h)=>{r.time.value+=h,e.mesh?.skeleton?.update()}),!a||!e.mesh?null:p.jsxs(ze,{ref:j,source:e,...W,children:[p.jsx("mesh",{frustumCulled:!1,geometry:a,material:g}),p.jsx(Ue,{onPointerDown:m?G:void 0,onPointerLeave:m?z:void 0,onPointerMove:m?G:void 0,showInteractionSurface:Y,source:e})]})}const gr="/textures/fur/uneven-alpha.png";function br({source:e,count:a=5e3,bladeHeight:s=.045,bladeWidth:d=.008,alphaTexturePath:t=gr,rootColor:o=null,tipColor:u=null,tipMix:y=.18,curvature:R=.05,windStrength:P=.18,noiseFrequency:I=.4,noiseAmplitude:C=.02,waveAmplitude:l=.025,waveLength:A=.7,waveSpeed:v=1.2,waveDirection:m=[1,0],interactive:w=!0,interactionRadius:D=.18,interactionStrength:Y=1.2,seed:W=1,showInteractionSurface:j=!1,...M}){const F=n.useRef(),k=n.useRef(new T),H=u!=null,U=e.radius||1,f=s*U,N=d*U,S=D*U,O=C*U,B=l*U,x=n.useMemo(()=>ia(a,e.isSkinnedMesh),[a,e.isSkinnedMesh]),E=n.useMemo(()=>Fe(),[]),r=De(t),g=n.useMemo(()=>la({bladeWidth:N,isSkinnedMesh:e.isSkinnedMesh,seed:W,sourceGeometry:e.geometry,strandCount:x}),[N,x,W,e.geometry,e.isSkinnedMesh]),G=g?.userData?.strandGeometryType==="skinned",z=n.useMemo(()=>{const Z=e.baseColor.clone();return o&&Z.set(o),Z},[o,e.baseColor]),c=n.useMemo(()=>u?new J(u):e.baseColor.clone(),[e.baseColor,u]),h=n.useMemo(()=>it(m),[m]),i=n.useMemo(()=>({baseColor:b(z.clone()),bladeHeight:b(f),curvature:b(R),interactorEnabled:b(0),interactorPos:b(new T(1e3,1e3,1e3)),interactorRadius:b(S),interactorStrength:b(Y),noiseAmplitude:b(O),noiseFrequency:b(I),time:b(0),tipColor:b(c.clone()),tipMix:b(y),useExplicitTipColor:b(H?1:0),waveAmplitude:b(B),waveDirection:b(h.clone()),waveLength:b(A),waveSpeed:b(v),windStrength:b(P)}),[]),V=n.useMemo(()=>{if(!g||G)return null;const Z=new gt({alphaTest:.01,side:Re}),Q=je(g.getAttribute("aOffset")),ce=je(g.getAttribute("aScale")),K=je(g.getAttribute("aPhase")),q=je(g.getAttribute("aQuat")),Me=je(g.getAttribute("aRootUv")),Ae=ye(_(.08),_(.65),Be(new Ee(r||E),at()).r),ke=rt(([ne,te])=>{const fe=nt(ne.xyz,te);return te.add(nt(ne.xyz,fe.add(te.mul(ne.w))).mul(2))}),$=Ce(se.y,0,1),de=i.waveDirection.div(Te(i.waveDirection).max(_(1e-4))),re=xe(Q.x.mul(i.noiseFrequency.max(_(1e-4))).add(Q.z.mul(i.noiseFrequency.max(_(1e-4)))).add($.mul(4)).add(i.time.mul(.1))).mul(.5).add(.5),me=rt(()=>{const ne=oe(se.x,se.y.mul(i.bladeHeight).mul(ce),se.z).toVar(),te=i.time.add(K),fe=xe(te.mul(1.3).add(Q.x.mul(.2))).add(St(te.mul(.7).add(Q.z.mul(.15)))).mul(i.windStrength).mul($.mul($)),$e=xe(Le(Q.xz,de).div(i.waveLength.max(_(1e-4))).mul(6.2831852).sub(i.time.mul(i.waveSpeed))).mul(i.waveAmplitude).mul($),Pe=ke(q,ne.add(oe(i.curvature.mul($).mul($),0,0)).add(oe(fe.mul(.4),0,fe.mul(.15))).add(oe(de.x.mul($e),0,de.y.mul($e))).add(oe(re.sub(.5).mul(i.noiseAmplitude).mul($),0,re.sub(.5).mul(i.noiseAmplitude).mul($).mul(.6)))).toVar(),_e=ke(q,oe(0,1,0)).normalize().toVar(),Oe=Q.sub(i.interactorPos).sub(_e.mul(Le(Q.sub(i.interactorPos),_e))).toVar(),Ke=Te(Oe),yt=Ce(_(1).sub(ye(0,i.interactorRadius,Ke)).mul(i.interactorStrength).mul(i.interactorEnabled),0,1),fa=Oe.div(Ke.max(_(1e-5)));return Pe.addAssign(fa.mul(yt).mul(i.bladeHeight).mul(.9).mul($)),Pe.y.assign(Pe.y.mul(_(1).sub(yt.mul(.25).mul($)))),Pe.add(Q)})();let ee=i.baseColor;e.map&&(ee=i.baseColor.mul(Be(new Ee(e.map),Me).rgb));const ie=ae(ee,i.tipColor,i.tipMix.mul(i.useExplicitTipColor));return Z.positionNode=me,Z.colorNode=ae(ee,ie,bt($,1.2)).mul(ae(_(.75),_(1.25),re)).mul(ae(_(.82),_(1),Ae)).add(ye(.7,1,$).mul(.12)),Z.opacityNode=Ae,Z},[r,E,g,G,e.map,i]);n.useEffect(()=>()=>{E.dispose(),V?.dispose()},[E,V]),n.useEffect(()=>{i.baseColor.value.copy(z),i.bladeHeight.value=f,i.curvature.value=R,i.interactorRadius.value=S,i.interactorStrength.value=Y,i.noiseAmplitude.value=O,i.noiseFrequency.value=I,i.tipColor.value.copy(c),i.tipMix.value=y,i.useExplicitTipColor.value=H?1:0,i.waveAmplitude.value=B,i.waveDirection.value.copy(h),i.waveLength.value=A,i.waveSpeed.value=v,i.windStrength.value=P},[f,R,S,Y,O,I,z,c,h,B,y,H,i,A,v,P]);const X=n.useCallback(Z=>{!w||!F.current||(Z.stopPropagation(),k.current.copy(Z.point),F.current.worldToLocal(k.current),i.interactorEnabled.value=1,i.interactorPos.value.copy(k.current))},[w,i]),L=n.useCallback(()=>{i.interactorEnabled.value=0},[i]);return we((Z,Q)=>{i.time.value+=Q,!G&&e.isSkinnedMesh&&e.mesh&&ua(g,e.mesh)}),g?G&&e.mesh?p.jsx(pr,{alphaTexturePath:t,bladeHeight:s,curvature:R,geometry:g,interactionRadius:D,interactionStrength:Y,interactive:w,noiseAmplitude:C,noiseFrequency:I,rootColor:o,showInteractionSurface:j,source:e,tipColor:u,tipMix:y,waveAmplitude:l,waveDirection:m,waveLength:A,waveSpeed:v,windStrength:P,...M}):p.jsxs(ze,{ref:F,source:e,...M,children:[p.jsx("mesh",{frustumCulled:!1,geometry:g,material:V}),p.jsx(Ue,{onPointerDown:w?X:void 0,onPointerLeave:w?L:void 0,onPointerMove:w?X:void 0,showInteractionSurface:j,source:e})]}):null}function Sr({technique:e=he.strand,sourceGeometry:a=null,sourceMaterial:s=null,sourceMesh:d=null,...t}){const o=ca({sourceGeometry:a,sourceMaterial:s,sourceMesh:d});return o.geometry?e===he.shell?p.jsx(vr,{...t,source:o}):e===he.strand?p.jsx(br,{...t,source:o}):null:null}function da(e){return ea(d=>d.gl)?.isWebGPURenderer===!0?p.jsx(Sr,{...e}):p.jsx(ir,{...e})}const ma=.875,xt=.16;function xr({radius:e=ma,height:a=xt,widthSegments:s=64,heightSegments:d=24}={}){const t=new Ma(e,s,d,0,Math.PI*2,0,Math.PI/2),o=t.getAttribute("position");for(let u=0;u<o.count;u+=1){const y=st.clamp(o.getY(u)/e,0,1);o.setY(u,y*a)}return o.needsUpdate=!0,t.computeVertexNormals(),t.computeBoundingBox(),t.computeBoundingSphere(),t}const yr=n.forwardRef(function({colorDark:a,colorLight:s,floorY:d,geometry:t},o){const u=n.useMemo(()=>{const y=new J(a),R=new J(s),P=t.boundingBox,I=t.boundingSphere?.radius??1,C=P?P.max.y-P.min.y:1,l=new Aa({color:y,metalness:0,roughness:.96});return l.onBeforeCompile=A=>{const v=A;v.uniforms.uPatchDark={value:y.clone()},v.uniforms.uPatchHeight={value:C},v.uniforms.uPatchLight={value:R.clone()},v.uniforms.uPatchRadius={value:I},v.vertexShader=v.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vPatchPos;`).replace("#include <begin_vertex>",`#include <begin_vertex>
vPatchPos = transformed;`),v.fragmentShader=v.fragmentShader.replace("#include <common>",`#include <common>
${Na}
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
          `)},l.customProgramCacheKey=()=>"fur-lab-grass-patch",l.needsUpdate=!0,l},[a,s,t]);return n.useEffect(()=>()=>{u.dispose()},[u]),p.jsx("mesh",{geometry:t,material:u,position:[0,d,0],receiveShadow:!0,ref:o})}),Cr=n.forwardRef(function({colorDark:a,colorLight:s,floorY:d,geometry:t},o){const u=n.useMemo(()=>({darkColor:b(new J(a)),height:b(1),lightColor:b(new J(s)),radius:b(1)}),[]);n.useEffect(()=>{const R=t.boundingBox;u.darkColor.value.set(a),u.lightColor.value.set(s),u.radius.value=t.boundingSphere?.radius??1,u.height.value=R?R.max.y-R.min.y:1},[a,s,t,u]);const y=n.useMemo(()=>{const R=Pt(se.mul(2.2)),P=Pt(se.mul(6.8).add(oe(1.7,0,4.1))),I=Ce(se.y.div(u.height.max(_(1e-4))),0,1),C=_(1).sub(Ce(Te(oe(se.x,0,se.z)).div(u.radius.max(_(1e-4))),0,1)),l=Ce(_(.52).add(R.mul(.26)).add(P.mul(.12)).add(I.mul(.14)).add(C.mul(.08)),0,1),A=new ka({color:new J(a),metalness:0,roughness:.96});return A.colorNode=ae(u.darkColor,u.lightColor,l),A},[a,u]);return n.useEffect(()=>()=>{y.dispose()},[y]),p.jsx("mesh",{geometry:t,material:y,position:[0,d,0],receiveShadow:!0,ref:o})});function Mr({colorDark:e="#3d5f29",colorLight:a="#82ad4a",floorY:s,furProps:d=null,furLayers:t=null,height:o=xt,radius:u=ma,technique:y=null}){const P=ea(v=>v.gl)?.isWebGPURenderer===!0,I=n.useRef(),C=t??(d&&y?[{furProps:d,technique:y}]:[]),l=n.useMemo(()=>xr({height:o,radius:u}),[o,u]),A=P?Cr:yr;return n.useEffect(()=>()=>{l.dispose()},[l]),p.jsxs("group",{children:[p.jsx(A,{colorDark:e,colorLight:a,floorY:s,geometry:l,ref:I}),C.map(v=>p.jsx(da,{sourceMesh:I,technique:v.technique,...v.furProps},v.technique))]})}const Ar=1e-4;function kr(e){if(typeof e=="number")return e;if(Array.isArray(e)){const a=e[1]??e[0];return Number.isFinite(a)?a:1}return e&&typeof e=="object"&&Number.isFinite(e.y)?e.y:1}function Pr({floorY:e,furProps:a=null,furLayers:s=null,offsetY:d,patchProps:t=null,patchFurProps:o=null,patchFurLayers:u=null,position:y,rotationY:R,scale:P,technique:I=null}){const C=n.useRef(),l=n.useRef(),A=t?.height??xt,v=t?.contactOffset??0,[m,w]=n.useState(e+A),D=s??(a&&I?[{furProps:a,technique:I}]:[]),Y=u??(o&&I?[{furProps:o,technique:I}]:[]);return n.useLayoutEffect(()=>{if(!C.current||!l.current)return;const W=new Pa,j=new T,M=d*kr(P);l.current.updateWorldMatrix(!0,!0),W.setFromObject(l.current),l.current.getWorldPosition(j);const F=W.min.y-j.y,k=e+A-F+M+v;w(H=>Math.abs(H-k)<=Ar?H:k)},[e,d,A,v,P]),p.jsxs("group",{position:y,ref:C,children:[p.jsx(Mr,{...t,floorY:e,furLayers:Y}),p.jsx(Wa,{autoPlay:!0,autoPlayPatterns:["rabbit","eat"],autoPlayTimeScale:.6,position:[0,m,0],ref:l,rotation:[0,R,0],scale:P}),D.map(W=>p.jsx(da,{sourceMesh:l,technique:W.technique,...W.furProps},W.technique))]})}const le={Uneven:"/textures/fur/uneven-alpha.png",Even:"/textures/fur/even-alpha.png",Moss:"/textures/fur/moss-alpha.png"},Zt="Balanced",mt={grassDomeHeight:.16,grassDomeRadius:.875,grassPlainDarkColor:"#3d5f29",grassPlainLightColor:"#82ad4a",grassRabbitContactOffset:0,grassShellAlphaTexturePath:le.Moss,grassShellDarkColor:"#345824",grassShellInteractionRadius:.1,grassShellInteractionStrength:2.6,grassShellLayers:14,grassShellLightColor:"#78a447",grassShellRootColor:"#4a7a34",grassShellStiffness:2.475,grassShellThickness:.02025,grassShellTipColor:"#a9cf67",grassShellWaveScale:.099,grassStrandAlphaTexturePath:le.Moss,grassStrandBladeHeight:.0425,grassStrandBladeWidth:.0064,grassStrandCount:12e3,grassStrandCurvature:.08,grassStrandDarkColor:"#2f5421",grassStrandInteractionRadius:.08,grassStrandInteractionStrength:2.2,grassStrandLightColor:"#89b657",grassStrandNoiseAmplitude:.0119,grassStrandNoiseFrequency:.45,grassStrandRootColor:"#346926",grassStrandTipColor:"#9ec55f",grassStrandTipMix:.38,grassStrandWaveAmplitude:.0182,grassStrandWaveDirectionX:1,grassStrandWaveDirectionY:.35,grassStrandWaveLength:.85,grassStrandWaveSpeed:1.3,grassStrandWindStrength:.16},ft={Balanced:{ambientLightIntensity:.92,cameraFov:34,cameraMaxDistance:9,cameraMinDistance:3.5,cameraTargetX:0,cameraTargetY:-.1,cameraTargetZ:0,cameraX:0,cameraY:.4,cameraZ:6.6,fillLightIntensity:.36,groundColor:"#d8d0c5",groundSize:4.8,...mt,keyLightIntensity:1.2,rabbitOffsetY:-.16,rabbitRotationYDeg:-26,rabbitScale:.03,sceneBackgroundColor:"#efe7db",shellAlphaTexturePath:le.Uneven,shellEndAlpha:0,shellEndColor:"#ffffff",shellInteractionRadius:.1,shellInteractionStrength:2.6,shellInteractive:!0,shellLayers:18,shellShowInteractionSurface:!1,shellStartAlpha:1,shellStartColor:"#999999",shellStiffness:2.75,shellThickness:.045,shellWaveScale:.18,specimenMode:"default",specimenY:-.26,strandAlphaTexturePath:le.Uneven,strandBladeHeight:.032,strandBladeWidth:.01,strandCount:5e4,strandCurvature:.05,strandInteractionRadius:.08,strandInteractionStrength:2.2,strandInteractive:!0,strandNoiseAmplitude:.014,strandNoiseFrequency:.45,strandRootColor:"#8a715b",strandShowInteractionSurface:!1,strandTipColor:"#f4e9dc",strandTipMix:.32,strandUseRootColor:!1,strandUseTipColor:!0,strandWaveAmplitude:.028,strandWaveDirectionX:1,strandWaveDirectionY:.35,strandWaveLength:.85,strandWaveSpeed:1.3,strandWindStrength:.16},ReferenceDensity:{ambientLightIntensity:.92,cameraFov:34,cameraMaxDistance:9,cameraMinDistance:3.5,cameraTargetX:0,cameraTargetY:-.1,cameraTargetZ:0,cameraX:0,cameraY:.4,cameraZ:6.6,fillLightIntensity:.36,groundColor:"#d8d0c5",groundSize:4.8,...mt,keyLightIntensity:1.2,rabbitOffsetY:-.16,rabbitRotationYDeg:-26,rabbitScale:.03,sceneBackgroundColor:"#efe7db",shellAlphaTexturePath:le.Uneven,shellEndAlpha:0,shellEndColor:"#ffffff",shellInteractionRadius:.1,shellInteractionStrength:2.6,shellInteractive:!0,shellLayers:18,shellShowInteractionSurface:!1,shellStartAlpha:1,shellStartColor:"#999999",shellStiffness:2.75,shellThickness:.045,shellWaveScale:.18,specimenMode:"strand",specimenY:-.26,strandAlphaTexturePath:le.Uneven,strandBladeHeight:.032,strandBladeWidth:.01,strandCount:1e5,strandCurvature:.05,strandInteractionRadius:.08,strandInteractionStrength:2.2,strandInteractive:!0,strandNoiseAmplitude:.014,strandNoiseFrequency:.45,strandRootColor:"#8a715b",strandShowInteractionSurface:!1,strandTipColor:"#f4e9dc",strandTipMix:.32,strandUseRootColor:!1,strandUseTipColor:!0,strandWaveAmplitude:.028,strandWaveDirectionX:1,strandWaveDirectionY:.35,strandWaveLength:.85,strandWaveSpeed:1.3,strandWindStrength:.16},InteractionDebug:{ambientLightIntensity:.92,cameraFov:34,cameraMaxDistance:9,cameraMinDistance:3.5,cameraTargetX:0,cameraTargetY:-.1,cameraTargetZ:0,cameraX:0,cameraY:.4,cameraZ:6.6,fillLightIntensity:.36,groundColor:"#d8d0c5",groundSize:4.8,...mt,grassShellInteractionRadius:.065,grassShellInteractionStrength:4,grassStrandInteractionRadius:.06,grassStrandInteractionStrength:3.6,keyLightIntensity:1.2,rabbitOffsetY:-.16,rabbitRotationYDeg:-26,rabbitScale:.03,sceneBackgroundColor:"#efe7db",shellAlphaTexturePath:le.Uneven,shellEndAlpha:0,shellEndColor:"#ffffff",shellInteractionRadius:.065,shellInteractionStrength:4,shellInteractive:!0,shellLayers:18,shellShowInteractionSurface:!0,shellStartAlpha:1,shellStartColor:"#999999",shellStiffness:2.75,shellThickness:.045,shellWaveScale:.18,specimenMode:"strand",specimenY:-.26,strandAlphaTexturePath:le.Uneven,strandBladeHeight:.032,strandBladeWidth:.01,strandCount:5e4,strandCurvature:.05,strandInteractionRadius:.06,strandInteractionStrength:3,strandInteractive:!0,strandNoiseAmplitude:.014,strandNoiseFrequency:.45,strandRootColor:"#8a715b",strandShowInteractionSurface:!0,strandTipColor:"#f4e9dc",strandTipMix:.32,strandUseRootColor:!1,strandUseTipColor:!0,strandWaveAmplitude:.028,strandWaveDirectionX:1,strandWaveDirectionY:.35,strandWaveLength:.85,strandWaveSpeed:1.3,strandWindStrength:.16}};function Ir({presetSnapshot:e}){return{...e}}const Tr="Fur Lab",Qt=Object.freeze({Default:"default",Shell:"shell",Strand:"strand",Combo:"combo"});function Rr(){const{attachSetControls:e,controlsSnapshotRef:a,initialPreset:s,presetsFolder:d}=Ea({defaultPreset:Zt,getPresetControls:Ir,presets:ft}),t=ft[s]||ft[Zt],[o,u]=Ia(Tr,()=>({Presets:d,Scene:be({sceneBackgroundColor:{label:"Background",value:t.sceneBackgroundColor},groundColor:{label:"Ground",value:t.groundColor},groundSize:{label:"Ground Size",max:10,min:2,step:.1,value:t.groundSize},ambientLightIntensity:{label:"Ambient",max:2,min:0,step:.01,value:t.ambientLightIntensity},keyLightIntensity:{label:"Key",max:3,min:0,step:.01,value:t.keyLightIntensity},fillLightIntensity:{label:"Fill",max:2,min:0,step:.01,value:t.fillLightIntensity}},{collapsed:!0}),Camera:be({cameraFov:{label:"FOV",max:90,min:20,step:1,value:t.cameraFov},cameraX:{label:"X",max:10,min:-10,step:.1,value:t.cameraX},cameraY:{label:"Y",max:10,min:-2,step:.1,value:t.cameraY},cameraZ:{label:"Z",max:16,min:2,step:.1,value:t.cameraZ},cameraTargetX:{label:"Target X",max:4,min:-4,step:.05,value:t.cameraTargetX},cameraTargetY:{label:"Target Y",max:4,min:-4,step:.05,value:t.cameraTargetY},cameraTargetZ:{label:"Target Z",max:4,min:-4,step:.05,value:t.cameraTargetZ},cameraMinDistance:{label:"Min Dist",max:12,min:1,step:.1,value:t.cameraMinDistance},cameraMaxDistance:{label:"Max Dist",max:20,min:2,step:.1,value:t.cameraMaxDistance}},{collapsed:!0}),Specimen:be({specimenMode:{label:"Version",options:Qt,value:t.specimenMode??Qt.Default},specimenY:{label:"Specimen Y",max:2,min:-2,step:.05,value:t.specimenY},rabbitOffsetY:{label:"Rabbit Y",max:2,min:-2,step:.05,value:t.rabbitOffsetY},rabbitScale:{label:"Rabbit Scale",max:.2,min:.005,step:.001,value:t.rabbitScale},rabbitRotationYDeg:{label:"Rabbit Y Rot",max:180,min:-180,step:1,value:t.rabbitRotationYDeg}},{collapsed:!0}),GrassDome:be({grassDomeRadius:{label:"Radius",max:2,min:.1,step:.01,value:t.grassDomeRadius},grassDomeHeight:{label:"Height",max:.6,min:.01,step:.005,value:t.grassDomeHeight},grassRabbitContactOffset:{label:"Contact Offset",max:.2,min:-.2,step:.001,value:t.grassRabbitContactOffset},grassPlainDarkColor:{label:"Plain Dark",value:t.grassPlainDarkColor},grassPlainLightColor:{label:"Plain Light",value:t.grassPlainLightColor},grassShellDarkColor:{label:"Shell Dark",value:t.grassShellDarkColor},grassShellLightColor:{label:"Shell Light",value:t.grassShellLightColor},grassStrandDarkColor:{label:"Strand Dark",value:t.grassStrandDarkColor},grassStrandLightColor:{label:"Strand Light",value:t.grassStrandLightColor}},{collapsed:!0}),Shell:be({shellAlphaTexturePath:{label:"Alpha Map",options:le,value:t.shellAlphaTexturePath},shellLayers:{label:"Layers",max:24,min:1,step:1,value:t.shellLayers},shellThickness:{label:"Thickness",max:.3,min:.001,step:.001,value:t.shellThickness},shellWaveScale:{label:"Wave Scale",max:1.2,min:0,step:.001,value:t.shellWaveScale},shellStiffness:{label:"Stiffness",max:8,min:.1,step:.05,value:t.shellStiffness},shellStartColor:{label:"Root Tint",value:t.shellStartColor},shellStartAlpha:{label:"Root Alpha",max:1,min:0,step:.01,value:t.shellStartAlpha},shellEndColor:{label:"Tip Tint",value:t.shellEndColor},shellEndAlpha:{label:"Tip Alpha",max:1,min:0,step:.01,value:t.shellEndAlpha},shellInteractive:{label:"Cursor Push",value:t.shellInteractive},shellInteractionRadius:{label:"Cursor Radius",max:.3,min:.01,step:.005,value:t.shellInteractionRadius},shellInteractionStrength:{label:"Cursor Strength",max:6,min:0,step:.05,value:t.shellInteractionStrength},shellShowInteractionSurface:{label:"Show Collider",value:t.shellShowInteractionSurface}},{collapsed:!0}),ShellGrass:be({grassShellAlphaTexturePath:{label:"Alpha Map",options:le,value:t.grassShellAlphaTexturePath},grassShellLayers:{label:"Layers",max:24,min:1,step:1,value:t.grassShellLayers},grassShellThickness:{label:"Thickness",max:.12,min:.001,step:.001,value:t.grassShellThickness},grassShellWaveScale:{label:"Wave Scale",max:.6,min:0,step:.001,value:t.grassShellWaveScale},grassShellStiffness:{label:"Stiffness",max:8,min:.1,step:.05,value:t.grassShellStiffness},grassShellRootColor:{label:"Root Color",value:t.grassShellRootColor},grassShellTipColor:{label:"Tip Color",value:t.grassShellTipColor},grassShellInteractionRadius:{label:"Cursor Radius",max:.3,min:.01,step:.005,value:t.grassShellInteractionRadius},grassShellInteractionStrength:{label:"Cursor Strength",max:6,min:0,step:.05,value:t.grassShellInteractionStrength}},{collapsed:!0}),Strand:be({strandAlphaTexturePath:{label:"Alpha Map",options:le,value:t.strandAlphaTexturePath},strandCount:{label:"Count",max:oa,min:100,step:500,value:t.strandCount},strandBladeHeight:{label:"Blade Height",max:.15,min:.001,step:.001,value:t.strandBladeHeight},strandBladeWidth:{label:"Blade Width",max:.03,min:.001,step:.001,value:t.strandBladeWidth},strandCurvature:{label:"Curvature",max:.4,min:0,step:.005,value:t.strandCurvature},strandWindStrength:{label:"Wind",max:1,min:0,step:.01,value:t.strandWindStrength},strandNoiseFrequency:{label:"Noise Freq",max:2,min:0,step:.01,value:t.strandNoiseFrequency},strandNoiseAmplitude:{label:"Noise Amp",max:.1,min:0,step:.001,value:t.strandNoiseAmplitude},strandWaveAmplitude:{label:"Wave Amp",max:.1,min:0,step:.001,value:t.strandWaveAmplitude},strandWaveLength:{label:"Wave Length",max:4,min:.05,step:.01,value:t.strandWaveLength},strandWaveSpeed:{label:"Wave Speed",max:4,min:0,step:.01,value:t.strandWaveSpeed},strandWaveDirectionX:{label:"Wave Dir X",max:1,min:-1,step:.01,value:t.strandWaveDirectionX},strandWaveDirectionY:{label:"Wave Dir Y",max:1,min:-1,step:.01,value:t.strandWaveDirectionY},strandUseRootColor:{label:"Override Root",value:t.strandUseRootColor},strandRootColor:{label:"Root Color",value:t.strandRootColor},strandUseTipColor:{label:"Override Tip",value:t.strandUseTipColor},strandTipColor:{label:"Tip Color",value:t.strandTipColor},strandTipMix:{label:"Tip Mix",max:1,min:0,step:.01,value:t.strandTipMix},strandInteractive:{label:"Cursor Push",value:t.strandInteractive},strandInteractionRadius:{label:"Cursor Radius",max:.3,min:.01,step:.005,value:t.strandInteractionRadius},strandInteractionStrength:{label:"Cursor Strength",max:6,min:0,step:.05,value:t.strandInteractionStrength},strandShowInteractionSurface:{label:"Show Hit Surface",value:t.strandShowInteractionSurface}},{collapsed:!0}),StrandGrass:be({grassStrandAlphaTexturePath:{label:"Alpha Map",options:le,value:t.grassStrandAlphaTexturePath},grassStrandCount:{label:"Count",max:na,min:100,step:50,value:t.grassStrandCount},grassStrandBladeHeight:{label:"Blade Height",max:.15,min:.001,step:.001,value:t.grassStrandBladeHeight},grassStrandBladeWidth:{label:"Blade Width",max:.03,min:.001,step:.001,value:t.grassStrandBladeWidth},grassStrandCurvature:{label:"Curvature",max:.4,min:0,step:.005,value:t.grassStrandCurvature},grassStrandWindStrength:{label:"Wind",max:1,min:0,step:.01,value:t.grassStrandWindStrength},grassStrandNoiseFrequency:{label:"Noise Freq",max:2,min:0,step:.01,value:t.grassStrandNoiseFrequency},grassStrandNoiseAmplitude:{label:"Noise Amp",max:.1,min:0,step:.001,value:t.grassStrandNoiseAmplitude},grassStrandWaveAmplitude:{label:"Wave Amp",max:.1,min:0,step:.001,value:t.grassStrandWaveAmplitude},grassStrandWaveLength:{label:"Wave Length",max:4,min:.05,step:.01,value:t.grassStrandWaveLength},grassStrandWaveSpeed:{label:"Wave Speed",max:4,min:0,step:.01,value:t.grassStrandWaveSpeed},grassStrandWaveDirectionX:{label:"Wave Dir X",max:1,min:-1,step:.01,value:t.grassStrandWaveDirectionX},grassStrandWaveDirectionY:{label:"Wave Dir Y",max:1,min:-1,step:.01,value:t.grassStrandWaveDirectionY},grassStrandRootColor:{label:"Root Color",value:t.grassStrandRootColor},grassStrandTipColor:{label:"Tip Color",value:t.grassStrandTipColor},grassStrandTipMix:{label:"Tip Mix",max:1,min:0,step:.01,value:t.grassStrandTipMix},grassStrandInteractionRadius:{label:"Cursor Radius",max:.3,min:.01,step:.005,value:t.grassStrandInteractionRadius},grassStrandInteractionStrength:{label:"Cursor Strength",max:6,min:0,step:.05,value:t.grassStrandInteractionStrength}},{collapsed:!0})}),{collapsed:!0});return e(u),a.current={...o},o}function ot(e,a){const s=new J(e);return[s.r,s.g,s.b,a]}function wr(e,a){return a==="shell"?{colorDark:e.grassShellDarkColor,colorLight:e.grassShellLightColor}:a==="strand"?{colorDark:e.grassStrandDarkColor,colorLight:e.grassStrandLightColor}:a==="combo"?{colorDark:new J(e.grassShellDarkColor).lerp(new J(e.grassStrandDarkColor),.5),colorLight:new J(e.grassShellLightColor).lerp(new J(e.grassStrandLightColor),.5)}:{colorDark:e.grassPlainDarkColor,colorLight:e.grassPlainLightColor}}function Dr(e){return{alphaTexturePath:e.shellAlphaTexturePath,endColor:ot(e.shellEndColor,e.shellEndAlpha),interactionRadius:e.shellInteractionRadius,interactionStrength:e.shellInteractionStrength,interactive:e.shellInteractive,layers:e.shellLayers,showInteractionSurface:e.shellShowInteractionSurface,startColor:ot(e.shellStartColor,e.shellStartAlpha),stiffness:e.shellStiffness,thickness:e.shellThickness,waveScale:e.shellWaveScale}}function Wr(e){return{alphaTexturePath:e.strandAlphaTexturePath,bladeHeight:e.strandBladeHeight,bladeWidth:e.strandBladeWidth,count:e.strandCount,curvature:e.strandCurvature,interactionRadius:e.strandInteractionRadius,interactionStrength:e.strandInteractionStrength,interactive:e.strandInteractive,noiseAmplitude:e.strandNoiseAmplitude,noiseFrequency:e.strandNoiseFrequency,rootColor:e.strandUseRootColor?e.strandRootColor:null,showInteractionSurface:e.strandShowInteractionSurface,tipColor:e.strandUseTipColor?e.strandTipColor:null,tipMix:e.strandTipMix,waveAmplitude:e.strandWaveAmplitude,waveDirection:[e.strandWaveDirectionX,e.strandWaveDirectionY],waveLength:e.strandWaveLength,waveSpeed:e.strandWaveSpeed,windStrength:e.strandWindStrength}}function Je(e,a="plain"){return{...wr(e,a),contactOffset:e.grassRabbitContactOffset,height:e.grassDomeHeight,radius:e.grassDomeRadius}}function Nr(e){return{alphaTexturePath:e.grassShellAlphaTexturePath,endColor:ot(e.grassShellTipColor,0),interactionRadius:e.grassShellInteractionRadius,interactionStrength:e.grassShellInteractionStrength,interactive:e.shellInteractive,layers:e.grassShellLayers,showInteractionSurface:e.shellShowInteractionSurface,startColor:ot(e.grassShellRootColor,1),stiffness:e.grassShellStiffness,thickness:e.grassShellThickness,waveScale:e.grassShellWaveScale}}function Er(e){return{alphaTexturePath:e.grassStrandAlphaTexturePath,bladeHeight:e.grassStrandBladeHeight,bladeWidth:e.grassStrandBladeWidth,count:e.grassStrandCount,curvature:e.grassStrandCurvature,interactionRadius:e.grassStrandInteractionRadius,interactionStrength:e.grassStrandInteractionStrength,interactive:e.strandInteractive,noiseAmplitude:e.grassStrandNoiseAmplitude,noiseFrequency:e.grassStrandNoiseFrequency,rootColor:e.grassStrandRootColor,showInteractionSurface:e.strandShowInteractionSurface,tipColor:e.grassStrandTipColor,tipMix:e.grassStrandTipMix,waveAmplitude:e.grassStrandWaveAmplitude,waveDirection:[e.grassStrandWaveDirectionX,e.grassStrandWaveDirectionY],waveLength:e.grassStrandWaveLength,waveSpeed:e.grassStrandWaveSpeed,windStrength:e.grassStrandWindStrength}}const $t=-.86,et=Object.freeze({combo:"combo",default:"default",shell:"shell",strand:"strand"});De.preload(Object.values(le));function Vr(){const e=Rr(),a=Je(e,"plain"),s=Je(e,"combo"),d=Je(e,"shell"),t=Dr(e),o=Nr(e),u=Je(e,"strand"),y=Wr(e),R=Er(e),P=e.specimenMode??et.default,I=st.degToRad(e.rabbitRotationYDeg),C=$t-e.specimenY,l={furProps:t,technique:he.shell},A={furProps:y,technique:he.strand},v={furProps:o,technique:he.shell},m={furProps:R,technique:he.strand};let w=a,D=[],Y=[];return P===et.shell?(w=d,D=[l],Y=[v]):P===et.strand?(w=u,D=[A],Y=[m]):P===et.combo&&(w=s,D=[l,A],Y=[v,m]),p.jsxs(p.Fragment,{children:[p.jsx("color",{attach:"background",args:[e.sceneBackgroundColor]}),p.jsx(La,{makeDefault:!0,fov:e.cameraFov,position:[e.cameraX,e.cameraY,e.cameraZ]}),p.jsx(Ba,{enableDamping:!0,maxDistance:e.cameraMaxDistance,minDistance:e.cameraMinDistance,target:[e.cameraTargetX,e.cameraTargetY,e.cameraTargetZ]}),p.jsx("ambientLight",{intensity:e.ambientLightIntensity}),p.jsx("directionalLight",{intensity:e.keyLightIntensity,position:[2.8,3.2,2.5]}),p.jsx("directionalLight",{intensity:e.fillLightIntensity,position:[-2.8,1.8,-2.4]}),p.jsxs("mesh",{position:[0,$t,0],rotation:[-Math.PI/2,0,0],children:[p.jsx("circleGeometry",{args:[e.groundSize,64]}),p.jsx("meshStandardMaterial",{color:e.groundColor,roughness:1})]}),p.jsx(Pr,{floorY:C,furLayers:D,offsetY:e.rabbitOffsetY,patchFurLayers:Y,patchProps:w,position:[0,e.specimenY,0],rotationY:I,scale:e.rabbitScale})]})}export{Vr as S};
