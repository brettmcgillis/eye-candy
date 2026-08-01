import{az as A,j as n,r as c,b4 as Z,ac as $,q as B,ag as R,a0 as Y,aX as m}from"./index-Bo6WACTw.js";import{d as w,w as E}from"./index-DcpZtMME.js";import{F as O}from"./flyingHighFire-crLHGm8I.js";import{u as j}from"./Gltf-C_ii8OfK.js";import{M as W}from"./Moon-DitZhzBs.js";import{e as u,g as P}from"./splineDefaults-C5MjRU-7.js";import{S as k}from"./SmokeParticles-BrJYvm4-.js";import{V as d}from"./VolumetricFire-DusLm-cq.js";import{C as G,a as T}from"./Cloud-DFh1HHwZ.js";import{u as H}from"./usePresetsFolder-DGTOXy9Z.js";import{P as U}from"./PerspectiveCamera-C95wkZr9.js";import{O as L}from"./OrbitControls-rhLNIlxO.js";import"./constants-B31eRqKm.js";import"./Texture-FuQm7NYM.js";import"./three.tsl-JP_aLrRF.js";import"./extends-CF3RwP-h.js";import"./deprecated-CtTvmxFP.js";import"./Fbo-D-WP7d3i.js";function _(e){const{nodes:o,materials:a}=j(A("/boeing_737-300.glb"));return n.jsxs("group",{...e,dispose:null,children:[n.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:o.Object_9.geometry,material:a.material00}),n.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:o.Object_12.geometry,material:a.material00}),n.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:o.Object_15.geometry,material:a.material02}),n.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:o.Object_18.geometry,material:a.material00})]})}j.preload(A("/boeing_737-300.glb"));function V({leftEngineMainFire:e,rightEngineMainFire:o,leftWingSecondaryFire:a,rightWingSecondaryFire:i,leftEngineSmokeTrail:s,rightEngineSmokeTrail:t,leftSmokePoints:p,rightSmokePoints:h}){return n.jsxs(n.Fragment,{children:[n.jsx("pointLight",{position:e?u(e).toArray():[-1.8,-.1,.4],color:"#ff6600",intensity:4,distance:8,decay:2}),n.jsx("pointLight",{position:o?u(o).toArray():[1.8,-.1,.4],color:"#ff6600",intensity:4,distance:8,decay:2}),n.jsx(d,{position:e?u(e).toArray():[-1.8,0,.3],width:e?.fireWidth??.5,height:e?.fireHeight??1.8,depth:e?.fireDepth??.5,sliceSpacing:e?.fireSliceSpacing??.08,magnitude:e?.fireMagnitude??1.6,brightness:e?.fireBrightness??2.2,saturation:e?.fireSaturation??.9,animated:e?.fireAnimated??!0,bendX:.4,bendZ:-1.2,animSpeed:e?.fireAnimSpeed??.85,tintColor:e?.fireTintColor??"#ffcc44"}),n.jsx(d,{position:o?u(o).toArray():[1.8,0,.3],width:o?.fireWidth??.5,height:o?.fireHeight??1.8,depth:o?.fireDepth??.5,sliceSpacing:o?.fireSliceSpacing??.08,magnitude:o?.fireMagnitude??1.6,brightness:o?.fireBrightness??2.2,saturation:o?.fireSaturation??.9,animated:o?.fireAnimated??!0,bendX:-.4,bendZ:-1.2,animSpeed:o?.fireAnimSpeed??.75,tintColor:o?.fireTintColor??"#ffcc44"}),n.jsx(d,{position:a?u(a).toArray():[-1.4,.3,-.2],width:a?.fireWidth??.35,height:a?.fireHeight??1.2,depth:a?.fireDepth??.35,sliceSpacing:a?.fireSliceSpacing??.1,segments:16,magnitude:a?.fireMagnitude??1.4,brightness:a?.fireBrightness??1.8,animated:a?.fireAnimated??!0,animSpeed:a?.fireAnimSpeed??1.1,bendX:.2,bendZ:-.9,tintColor:a?.fireTintColor??"#ff8833"}),n.jsx(d,{position:i?u(i).toArray():[1.4,.3,-.2],width:i?.fireWidth??.35,height:i?.fireHeight??1.2,depth:i?.fireDepth??.35,sliceSpacing:i?.fireSliceSpacing??.1,segments:16,magnitude:i?.fireMagnitude??1.4,brightness:i?.fireBrightness??1.8,animated:i?.fireAnimated??!0,animSpeed:i?.fireAnimSpeed??1,bendX:-.2,bendZ:-.9,tintColor:i?.fireTintColor??"#ff8833"}),n.jsx(k,{points:p,config:s}),n.jsx(k,{points:h,config:t})]})}const N=c.memo(V);function q({clouds:e}){return n.jsx(G,{material:Z,children:e.map((o,a)=>n.jsx(T,{position:o.position,scale:o.scale,speed:o.speed,opacity:o.opacity,width:o.width,depth:o.depth,segments:o.segments,color:o.color},a))})}const M=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,z=`
  uniform vec3 uColor;
  uniform float uEdgeSoftness;
  uniform float uWarpStrength;
  uniform float uBrushStrength;
  uniform float uBleedAmount;
  uniform float uPoolingStrength;
  uniform float uGrainAmount;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float dist = length(centered * vec2(1.0, 1.5));

    vec2 q = vec2(
      fbm(vUv * 5.0),
      fbm(vUv * 5.0 + vec2(5.2, 1.3))
    );
    float warp = fbm(vUv * 5.0 + 3.0 * q);

    float brush = (noise(vec2(vUv.x * 3.0 + warp, vUv.y * 18.0)) * 0.07
                + noise(vec2(vUv.x * 6.0, vUv.y * 30.0)) * 0.03) * uBrushStrength;

    float edgeNoise = warp * uWarpStrength + brush;

    float edge = smoothstep(0.50, 0.50 - uEdgeSoftness + edgeNoise, dist);
    float bleed = smoothstep(0.56, 0.56 - uEdgeSoftness * 0.9 + edgeNoise * 0.6, dist)
                * uBleedAmount;

    float alpha = max(edge, bleed);

    float pooling = smoothstep(0.15, 0.42, dist);
    vec3 lightWash = uColor * 1.05;
    vec3 pooledEdge = uColor * 0.78;
    vec3 col = mix(lightWash, pooledEdge, pooling * pooling * uPoolingStrength);

    col += vec3(0.02, -0.01, -0.02) * warp;

    float grain = noise(vUv * 180.0) * uGrainAmount - uGrainAmount * 0.5;
    col += grain;

    gl_FragColor = vec4(col, alpha);
  }
`;function J({sky:e}){const o=c.useMemo(()=>new $({transparent:!0,side:R,depthWrite:!1,uniforms:{uColor:{value:new B("#87CEEB")},uEdgeSoftness:{value:.22},uWarpStrength:{value:.1},uBrushStrength:{value:1},uBleedAmount:{value:.12},uPoolingStrength:{value:1},uGrainAmount:{value:.035}},vertexShader:M,fragmentShader:z}),[]);return c.useEffect(()=>{const{uniforms:a}=o;a.uColor.value.set(e.color),a.uEdgeSoftness.value=e.shader.edgeSoftness,a.uWarpStrength.value=e.shader.warpStrength,a.uBrushStrength.value=e.shader.brushStrength,a.uBleedAmount.value=e.shader.bleedAmount,a.uPoolingStrength.value=e.shader.poolingStrength,a.uGrainAmount.value=e.shader.grainAmount},[o,e]),n.jsx("mesh",{position:e.position,material:o,renderOrder:-10,children:n.jsx("planeGeometry",{args:[e.width,e.height]})})}const x="Day",C={background:"#ffffff",ambientIntensity:.5,directionalIntensity:1,hemisphereIntensity:.25,skyColor:"#87CEEB",skyPosX:0,skyPosY:1,skyPosZ:-12,skyWidth:40,skyHeight:24,skyEdgeSoftness:.22,skyWarpStrength:.1,skyBrushStrength:1,skyBleedAmount:.12,skyPoolingStrength:1,skyGrainAmount:.035,planeScale:.6,planePosX:0,planePosY:0,planePosZ:0,planeRotXDeg:2.9,planeRotYDeg:-36,planeRotZDeg:-1.7,c1Scale:1,c1PosX:-10,c1PosY:5,c1PosZ:-8,c1Speed:.2,c1Opacity:.6,c1Width:8,c1Depth:2,c1Segments:35,c1Color:"#f0f0f0",c2Scale:1,c2PosX:8,c2PosY:7,c2PosZ:-9,c2Speed:.15,c2Opacity:.5,c2Width:10,c2Depth:3,c2Segments:35,c2Color:"#f0f0f0",c3Scale:1,c3PosX:-4,c3PosY:-2,c3PosZ:-6,c3Speed:.1,c3Opacity:.45,c3Width:6,c3Depth:2,c3Segments:30,c3Color:"#f0f0f0",moonVisible:!1,moonPosX:9,moonPosY:7,moonPosZ:-10.5,moonScale:2.4,moonColor:"#f6f2eb",moonEmissive:"#000000",moonEmissiveIntensity:0,moonMetalness:.08,moonRoughness:.92},f={Day:C,Night:{...C,background:"#07101d",ambientIntensity:.08,directionalIntensity:.22,hemisphereIntensity:.12,skyColor:"#193556",skyEdgeSoftness:.28,skyWarpStrength:.14,skyBrushStrength:.85,skyBleedAmount:.05,skyPoolingStrength:1.4,skyGrainAmount:.02,c1Opacity:.42,c1Color:"#d1daea",c2Opacity:.34,c2Color:"#c0cce0",c3Opacity:.28,c3Color:"#b6c3d7",moonVisible:!0,moonColor:"#eef1f7",moonEmissive:"#8090b8",moonEmissiveIntensity:.35,moonMetalness:.1,moonRoughness:.88}},S=Math.PI/180;function K({presetSnapshot:e}){return e}function y(e,o){return{[`${e}Scale`]:{label:"Scale",value:o[`${e}Scale`],min:.1,max:5,step:.1},[`${e}PosX`]:{label:"X",value:o[`${e}PosX`],min:-30,max:30,step:.5},[`${e}PosY`]:{label:"Y",value:o[`${e}PosY`],min:-10,max:20,step:.5},[`${e}PosZ`]:{label:"Z",value:o[`${e}PosZ`],min:-20,max:5,step:.5},[`${e}Speed`]:{label:"Speed",value:o[`${e}Speed`],min:0,max:1,step:.05},[`${e}Opacity`]:{label:"Opacity",value:o[`${e}Opacity`],min:0,max:1,step:.05},[`${e}Width`]:{label:"Width",value:o[`${e}Width`],min:1,max:30,step:1},[`${e}Depth`]:{label:"Depth",value:o[`${e}Depth`],min:.5,max:10,step:.5},[`${e}Segments`]:{label:"Segments",value:o[`${e}Segments`],min:5,max:60,step:1},[`${e}Color`]:{label:"Color",value:o[`${e}Color`]}}}function b(e,o){return{scale:e[`${o}Scale`],position:[e[`${o}PosX`],e[`${o}PosY`],e[`${o}PosZ`]],speed:e[`${o}Speed`],opacity:e[`${o}Opacity`],width:e[`${o}Width`],depth:e[`${o}Depth`],segments:e[`${o}Segments`],color:e[`${o}Color`]}}function Q(){const{attachSetControls:e,controlsSnapshotRef:o,initialPreset:a,presetsFolder:i}=H({defaultPreset:x,getPresetControls:K,presets:f}),s=f[a]||f[x],[t,p]=Y("Flying High",()=>({Presets:i,Scene:m({background:{label:"Background",value:s.background},ambientIntensity:{label:"Ambient",value:s.ambientIntensity,min:0,max:2,step:.05},directionalIntensity:{label:"Directional",value:s.directionalIntensity,min:0,max:3,step:.05},hemisphereIntensity:{label:"Hemisphere",value:s.hemisphereIntensity,min:0,max:2,step:.05}},{collapsed:!0}),Sky:m({skyColor:{label:"Color",value:s.skyColor},skyPosX:{label:"X",value:s.skyPosX,min:-20,max:20,step:.5},skyPosY:{label:"Y",value:s.skyPosY,min:-20,max:20,step:.5},skyPosZ:{label:"Z",value:s.skyPosZ,min:-30,max:0,step:.5},skyWidth:{label:"Width",value:s.skyWidth,min:10,max:80,step:1},skyHeight:{label:"Height",value:s.skyHeight,min:6,max:50,step:1},Shader:m({skyEdgeSoftness:{label:"Edge Softness",value:s.skyEdgeSoftness,min:.05,max:.4,step:.01},skyWarpStrength:{label:"Warp",value:s.skyWarpStrength,min:0,max:.3,step:.01},skyBrushStrength:{label:"Brush",value:s.skyBrushStrength,min:0,max:3,step:.1},skyBleedAmount:{label:"Bleed",value:s.skyBleedAmount,min:0,max:.5,step:.01},skyPoolingStrength:{label:"Pooling",value:s.skyPoolingStrength,min:0,max:2,step:.1},skyGrainAmount:{label:"Grain",value:s.skyGrainAmount,min:0,max:.1,step:.005}},{collapsed:!0})},{collapsed:!0}),Plane:m({planeScale:{label:"Scale",value:s.planeScale,min:.1,max:2,step:.05},planePosX:{label:"X",value:s.planePosX,min:-20,max:20,step:.1},planePosY:{label:"Y",value:s.planePosY,min:-20,max:20,step:.1},planePosZ:{label:"Z",value:s.planePosZ,min:-20,max:20,step:.1},planeRotXDeg:{label:"Rot X (°)",value:s.planeRotXDeg,min:-180,max:180,step:.5},planeRotYDeg:{label:"Rot Y (°)",value:s.planeRotYDeg,min:-180,max:180,step:.5},planeRotZDeg:{label:"Rot Z (°)",value:s.planeRotZDeg,min:-180,max:180,step:.5}},{collapsed:!0}),Moon:m({moonVisible:{label:"Visible",value:s.moonVisible},moonPosX:{label:"X",value:s.moonPosX,min:-20,max:20,step:.1},moonPosY:{label:"Y",value:s.moonPosY,min:-20,max:20,step:.1},moonPosZ:{label:"Z",value:s.moonPosZ,min:-20,max:0,step:.1},moonScale:{label:"Scale",value:s.moonScale,min:.1,max:10,step:.1},moonColor:{label:"Color",value:s.moonColor},moonEmissive:{label:"Emissive",value:s.moonEmissive},moonEmissiveIntensity:{label:"Emissive Intensity",value:s.moonEmissiveIntensity,min:0,max:4,step:.05},moonMetalness:{label:"Metalness",value:s.moonMetalness,min:0,max:1,step:.01},moonRoughness:{label:"Roughness",value:s.moonRoughness,min:0,max:1,step:.01}},{collapsed:!0}),Clouds:m({"Cloud 1":m(y("c1",s),{collapsed:!0}),"Cloud 2":m(y("c2",s),{collapsed:!0}),"Cloud 3":m(y("c3",s),{collapsed:!0})},{collapsed:!0})}));return e(p),o.current=t,{scene:{background:t.background,ambientIntensity:t.ambientIntensity,directionalIntensity:t.directionalIntensity,hemisphereIntensity:t.hemisphereIntensity},sky:{color:t.skyColor,position:[t.skyPosX,t.skyPosY,t.skyPosZ],width:t.skyWidth,height:t.skyHeight,shader:{edgeSoftness:t.skyEdgeSoftness,warpStrength:t.skyWarpStrength,brushStrength:t.skyBrushStrength,bleedAmount:t.skyBleedAmount,poolingStrength:t.skyPoolingStrength,grainAmount:t.skyGrainAmount}},plane:{scale:t.planeScale,position:[t.planePosX,t.planePosY,t.planePosZ],rotation:[t.planeRotXDeg*S,t.planeRotYDeg*S,t.planeRotZDeg*S]},moon:{visible:t.moonVisible,position:[t.moonPosX,t.moonPosY,t.moonPosZ],scale:t.moonScale,color:t.moonColor,emissive:t.moonEmissive,emissiveIntensity:t.moonEmissiveIntensity,metalness:t.moonMetalness,roughness:t.moonRoughness},clouds:[b(t,"c1"),b(t,"c2"),b(t,"c3")]}}function fe(){const{scene:e,sky:o,plane:a,moon:i,clouds:s}=Q(),{leftEngineMainFire:t,rightEngineMainFire:p,leftWingSecondaryFire:h,rightWingSecondaryFire:I,leftEngineSmokeTrail:g,rightEngineSmokeTrail:v}=c.useMemo(()=>{const r=O.splines??[];return{leftEngineMainFire:r.find(l=>l.name==="Left Engine Main Fire"),rightEngineMainFire:r.find(l=>l.name==="Right Engine Main Fire"),leftWingSecondaryFire:r.find(l=>l.name==="Left Wing Secondary Fire"),rightWingSecondaryFire:r.find(l=>l.name==="Right Wing Secondary Fire"),leftEngineSmokeTrail:r.find(l=>l.name==="Left Engine Smoke Trail"),rightEngineSmokeTrail:r.find(l=>l.name==="Right Engine Smoke Trail")}},[]),D=c.useMemo(()=>P(g).map(r=>r.position.clone()),[g]),X=c.useMemo(()=>P(v).map(r=>r.position.clone()),[v]);return n.jsxs(n.Fragment,{children:[n.jsx("color",{attach:"background",args:[e.background]}),n.jsx(U,{makeDefault:!0,position:[10,3,14],fov:42}),n.jsx(L,{target:[0,.5,-1]}),n.jsx("ambientLight",{intensity:e.ambientIntensity}),n.jsx("directionalLight",{position:[5,8,10],intensity:e.directionalIntensity,color:"#fff5e0"}),n.jsx("hemisphereLight",{skyColor:o.color,groundColor:"#443322",intensity:e.hemisphereIntensity}),n.jsx(J,{sky:o}),i.visible?n.jsx(W,{position:i.position,scale:i.scale,color:i.color,emissive:i.emissive,emissiveIntensity:i.emissiveIntensity,metalness:i.metalness,roughness:i.roughness}):null,n.jsx(q,{clouds:s}),n.jsx(_,{scale:a.scale,rotation:a.rotation,position:a.position}),n.jsx(N,{leftEngineMainFire:t,rightEngineMainFire:p,leftWingSecondaryFire:h,rightWingSecondaryFire:I,leftEngineSmokeTrail:g,rightEngineSmokeTrail:v,leftSmokePoints:D,rightSmokePoints:X}),n.jsx(w,{disableNormalPass:!0,children:n.jsx(E,{intensity:.8,luminanceThreshold:.55,luminanceSmoothing:.3,mipmapBlur:!0,radius:.45})})]})}export{fe as default};
