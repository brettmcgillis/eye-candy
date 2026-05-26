import{aA as C,j as s,r as m,b3 as B,aa as D,p as w,a1 as Z,E as X,K as r,aR as R,J as P}from"./index-DyiJa5hr.js";import{d as Y,w as I}from"./index-CQulWUzq.js";import{F as O}from"./flyingHighFire-Cnxslby6.js";import{u as A}from"./Gltf-B86MG64p.js";import{d as u,g as k}from"./splineDefaults-D1ZL9Qb3.js";import{S as x}from"./SmokeParticles-CmiXdTXi.js";import{V as p}from"./VolumetricFire-gNl8It9e.js";import{C as W,a as G}from"./Cloud-Bnu_MxDJ.js";import{P as H}from"./PerspectiveCamera-D73WVBGs.js";import{O as E}from"./OrbitControls-xq72CcOv.js";import"./constants-BUffrCXI.js";import"./three.tsl-DU4z3Y7i.js";import"./extends-CF3RwP-h.js";import"./Texture-D7GaSotk.js";import"./deprecated-CtTvmxFP.js";import"./Fbo-C99VJIHU.js";function T(t){const{nodes:e,materials:a}=A(C("/boeing_737-300.glb"));return s.jsxs("group",{...t,dispose:null,children:[s.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:e.Object_9.geometry,material:a.material00}),s.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:e.Object_12.geometry,material:a.material00}),s.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:e.Object_15.geometry,material:a.material02}),s.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:e.Object_18.geometry,material:a.material00})]})}A.preload(C("/boeing_737-300.glb"));function U({leftEngineMainFire:t,rightEngineMainFire:e,leftWingSecondaryFire:a,rightWingSecondaryFire:n,leftEngineSmokeTrail:c,rightEngineSmokeTrail:d,leftSmokePoints:h,rightSmokePoints:g}){return s.jsxs(s.Fragment,{children:[s.jsx("pointLight",{position:t?u(t).toArray():[-1.8,-.1,.4],color:"#ff6600",intensity:4,distance:8,decay:2}),s.jsx("pointLight",{position:e?u(e).toArray():[1.8,-.1,.4],color:"#ff6600",intensity:4,distance:8,decay:2}),s.jsx(p,{position:t?u(t).toArray():[-1.8,0,.3],width:t?.fireWidth??.5,height:t?.fireHeight??1.8,depth:t?.fireDepth??.5,sliceSpacing:t?.fireSliceSpacing??.08,magnitude:t?.fireMagnitude??1.6,brightness:t?.fireBrightness??2.2,saturation:t?.fireSaturation??.9,animated:t?.fireAnimated??!0,bendX:.4,bendZ:-1.2,animSpeed:t?.fireAnimSpeed??.85,tintColor:t?.fireTintColor??"#ffcc44"}),s.jsx(p,{position:e?u(e).toArray():[1.8,0,.3],width:e?.fireWidth??.5,height:e?.fireHeight??1.8,depth:e?.fireDepth??.5,sliceSpacing:e?.fireSliceSpacing??.08,magnitude:e?.fireMagnitude??1.6,brightness:e?.fireBrightness??2.2,saturation:e?.fireSaturation??.9,animated:e?.fireAnimated??!0,bendX:-.4,bendZ:-1.2,animSpeed:e?.fireAnimSpeed??.75,tintColor:e?.fireTintColor??"#ffcc44"}),s.jsx(p,{position:a?u(a).toArray():[-1.4,.3,-.2],width:a?.fireWidth??.35,height:a?.fireHeight??1.2,depth:a?.fireDepth??.35,sliceSpacing:a?.fireSliceSpacing??.1,segments:16,magnitude:a?.fireMagnitude??1.4,brightness:a?.fireBrightness??1.8,animated:a?.fireAnimated??!0,animSpeed:a?.fireAnimSpeed??1.1,bendX:.2,bendZ:-.9,tintColor:a?.fireTintColor??"#ff8833"}),s.jsx(p,{position:n?u(n).toArray():[1.4,.3,-.2],width:n?.fireWidth??.35,height:n?.fireHeight??1.2,depth:n?.fireDepth??.35,sliceSpacing:n?.fireSliceSpacing??.1,segments:16,magnitude:n?.fireMagnitude??1.4,brightness:n?.fireBrightness??1.8,animated:n?.fireAnimated??!0,animSpeed:n?.fireAnimSpeed??1,bendX:-.2,bendZ:-.9,tintColor:n?.fireTintColor??"#ff8833"}),s.jsx(x,{points:h,config:c}),s.jsx(x,{points:g,config:d})]})}const _=m.memo(U);function L({clouds:t}){return s.jsx(W,{material:B,children:t.map((e,a)=>s.jsx(G,{position:e.position,scale:e.scale,speed:e.speed,opacity:e.opacity,width:e.width,depth:e.depth,segments:e.segments,color:e.color},a))})}const N=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,V=`
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
`;function q({sky:t}){const e=m.useMemo(()=>new D({transparent:!0,side:Z,depthWrite:!1,uniforms:{uColor:{value:new w("#87CEEB")},uEdgeSoftness:{value:.22},uWarpStrength:{value:.1},uBrushStrength:{value:1},uBleedAmount:{value:.12},uPoolingStrength:{value:1},uGrainAmount:{value:.035}},vertexShader:N,fragmentShader:V}),[]);return m.useEffect(()=>{const{uniforms:a}=e;a.uColor.value.set(t.color),a.uEdgeSoftness.value=t.shader.edgeSoftness,a.uWarpStrength.value=t.shader.warpStrength,a.uBrushStrength.value=t.shader.brushStrength,a.uBleedAmount.value=t.shader.bleedAmount,a.uPoolingStrength.value=t.shader.poolingStrength,a.uGrainAmount.value=t.shader.grainAmount},[e,t]),s.jsx("mesh",{position:t.position,material:e,renderOrder:-10,children:s.jsx("planeGeometry",{args:[t.width,t.height]})})}const S=Math.PI/180,o={background:"#ffffff",ambientIntensity:.5,directionalIntensity:1,hemisphereIntensity:.25,skyColor:"#87CEEB",skyPosX:0,skyPosY:1,skyPosZ:-12,skyWidth:40,skyHeight:24,skyEdgeSoftness:.22,skyWarpStrength:.1,skyBrushStrength:1,skyBleedAmount:.12,skyPoolingStrength:1,skyGrainAmount:.035,planeScale:.6,planePosX:0,planePosY:0,planePosZ:0,planeRotXDeg:2.9,planeRotYDeg:-36,planeRotZDeg:-1.7,c1Scale:1,c1PosX:-10,c1PosY:5,c1PosZ:-8,c1Speed:.2,c1Opacity:.6,c1Width:8,c1Depth:2,c1Segments:35,c1Color:"#f0f0f0",c2Scale:1,c2PosX:8,c2PosY:7,c2PosZ:-9,c2Speed:.15,c2Opacity:.5,c2Width:10,c2Depth:3,c2Segments:35,c2Color:"#f0f0f0",c3Scale:1,c3PosX:-4,c3PosY:-2,c3PosZ:-6,c3Speed:.1,c3Opacity:.45,c3Width:6,c3Depth:2,c3Segments:30,c3Color:"#f0f0f0"};function y(t){return{[`${t}Scale`]:{label:"Scale",value:o[`${t}Scale`],min:.1,max:5,step:.1},[`${t}PosX`]:{label:"X",value:o[`${t}PosX`],min:-30,max:30,step:.5},[`${t}PosY`]:{label:"Y",value:o[`${t}PosY`],min:-10,max:20,step:.5},[`${t}PosZ`]:{label:"Z",value:o[`${t}PosZ`],min:-20,max:5,step:.5},[`${t}Speed`]:{label:"Speed",value:o[`${t}Speed`],min:0,max:1,step:.05},[`${t}Opacity`]:{label:"Opacity",value:o[`${t}Opacity`],min:0,max:1,step:.05},[`${t}Width`]:{label:"Width",value:o[`${t}Width`],min:1,max:30,step:1},[`${t}Depth`]:{label:"Depth",value:o[`${t}Depth`],min:.5,max:10,step:.5},[`${t}Segments`]:{label:"Segments",value:o[`${t}Segments`],min:5,max:60,step:1},[`${t}Color`]:{label:"Color",value:o[`${t}Color`]}}}function b(t,e){return{scale:t[`${e}Scale`],position:[t[`${e}PosX`],t[`${e}PosY`],t[`${e}PosZ`]],speed:t[`${e}Speed`],opacity:t[`${e}Opacity`],width:t[`${e}Width`],depth:t[`${e}Depth`],segments:t[`${e}Segments`],color:t[`${e}Color`]}}function z(){const t=m.useRef(null),[e,a]=X("Flying High",()=>({Dev:r({reset:P(()=>a(o)),...R()?{copy:P(()=>{if(!t.current)return;const n=JSON.stringify(t.current,null,2).replace(/"([A-Za-z_$][A-Za-z0-9_$]*)":/g,"$1:");navigator.clipboard.writeText(n)})}:{}},{collapsed:!0}),Scene:r({background:{label:"Background",value:o.background},ambientIntensity:{label:"Ambient",value:o.ambientIntensity,min:0,max:2,step:.05},directionalIntensity:{label:"Directional",value:o.directionalIntensity,min:0,max:3,step:.05},hemisphereIntensity:{label:"Hemisphere",value:o.hemisphereIntensity,min:0,max:2,step:.05}},{collapsed:!0}),Sky:r({skyColor:{label:"Color",value:o.skyColor},skyPosX:{label:"X",value:o.skyPosX,min:-20,max:20,step:.5},skyPosY:{label:"Y",value:o.skyPosY,min:-20,max:20,step:.5},skyPosZ:{label:"Z",value:o.skyPosZ,min:-30,max:0,step:.5},skyWidth:{label:"Width",value:o.skyWidth,min:10,max:80,step:1},skyHeight:{label:"Height",value:o.skyHeight,min:6,max:50,step:1},Shader:r({skyEdgeSoftness:{label:"Edge Softness",value:o.skyEdgeSoftness,min:.05,max:.4,step:.01},skyWarpStrength:{label:"Warp",value:o.skyWarpStrength,min:0,max:.3,step:.01},skyBrushStrength:{label:"Brush",value:o.skyBrushStrength,min:0,max:3,step:.1},skyBleedAmount:{label:"Bleed",value:o.skyBleedAmount,min:0,max:.5,step:.01},skyPoolingStrength:{label:"Pooling",value:o.skyPoolingStrength,min:0,max:2,step:.1},skyGrainAmount:{label:"Grain",value:o.skyGrainAmount,min:0,max:.1,step:.005}},{collapsed:!0})},{collapsed:!0}),Plane:r({planeScale:{label:"Scale",value:o.planeScale,min:.1,max:2,step:.05},planePosX:{label:"X",value:o.planePosX,min:-20,max:20,step:.1},planePosY:{label:"Y",value:o.planePosY,min:-20,max:20,step:.1},planePosZ:{label:"Z",value:o.planePosZ,min:-20,max:20,step:.1},planeRotXDeg:{label:"Rot X (°)",value:o.planeRotXDeg,min:-180,max:180,step:.5},planeRotYDeg:{label:"Rot Y (°)",value:o.planeRotYDeg,min:-180,max:180,step:.5},planeRotZDeg:{label:"Rot Z (°)",value:o.planeRotZDeg,min:-180,max:180,step:.5}},{collapsed:!0}),Clouds:r({"Cloud 1":r(y("c1"),{collapsed:!0}),"Cloud 2":r(y("c2"),{collapsed:!0}),"Cloud 3":r(y("c3"),{collapsed:!0})},{collapsed:!0})}));return t.current=e,{scene:{background:e.background,ambientIntensity:e.ambientIntensity,directionalIntensity:e.directionalIntensity,hemisphereIntensity:e.hemisphereIntensity},sky:{color:e.skyColor,position:[e.skyPosX,e.skyPosY,e.skyPosZ],width:e.skyWidth,height:e.skyHeight,shader:{edgeSoftness:e.skyEdgeSoftness,warpStrength:e.skyWarpStrength,brushStrength:e.skyBrushStrength,bleedAmount:e.skyBleedAmount,poolingStrength:e.skyPoolingStrength,grainAmount:e.skyGrainAmount}},plane:{scale:e.planeScale,position:[e.planePosX,e.planePosY,e.planePosZ],rotation:[e.planeRotXDeg*S,e.planeRotYDeg*S,e.planeRotZDeg*S]},clouds:[b(e,"c1"),b(e,"c2"),b(e,"c3")]}}function pe(){const{scene:t,sky:e,plane:a,clouds:n}=z(),{leftEngineMainFire:c,rightEngineMainFire:d,leftWingSecondaryFire:h,rightWingSecondaryFire:g,leftEngineSmokeTrail:f,rightEngineSmokeTrail:v}=m.useMemo(()=>{const i=O.splines??[];return{leftEngineMainFire:i.find(l=>l.name==="Left Engine Main Fire"),rightEngineMainFire:i.find(l=>l.name==="Right Engine Main Fire"),leftWingSecondaryFire:i.find(l=>l.name==="Left Wing Secondary Fire"),rightWingSecondaryFire:i.find(l=>l.name==="Right Wing Secondary Fire"),leftEngineSmokeTrail:i.find(l=>l.name==="Left Engine Smoke Trail"),rightEngineSmokeTrail:i.find(l=>l.name==="Right Engine Smoke Trail")}},[]),j=m.useMemo(()=>k(f).map(i=>i.position.clone()),[f]),$=m.useMemo(()=>k(v).map(i=>i.position.clone()),[v]);return s.jsxs(s.Fragment,{children:[s.jsx("color",{attach:"background",args:[t.background]}),s.jsx(H,{makeDefault:!0,position:[10,3,14],fov:42}),s.jsx(E,{target:[0,.5,-1]}),s.jsx("ambientLight",{intensity:t.ambientIntensity}),s.jsx("directionalLight",{position:[5,8,10],intensity:t.directionalIntensity,color:"#fff5e0"}),s.jsx("hemisphereLight",{skyColor:"#87CEEB",groundColor:"#443322",intensity:t.hemisphereIntensity}),s.jsx(q,{sky:e}),s.jsx(L,{clouds:n}),s.jsx(T,{scale:a.scale,rotation:a.rotation,position:a.position}),s.jsx(_,{leftEngineMainFire:c,rightEngineMainFire:d,leftWingSecondaryFire:h,rightWingSecondaryFire:g,leftEngineSmokeTrail:f,rightEngineSmokeTrail:v,leftSmokePoints:j,rightSmokePoints:$}),s.jsx(Y,{disableNormalPass:!0,children:s.jsx(I,{intensity:.8,luminanceThreshold:.55,luminanceSmoothing:.3,mipmapBlur:!0,radius:.45})})]})}export{pe as default};
