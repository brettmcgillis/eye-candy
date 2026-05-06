import{K as P,j as s,r as m,aw as j,w as $,C as B,y as w,h as D,l as r,ap as Z,k as b}from"./index-B4YcrCIe.js";import{d as X,w as R}from"./index--nbf4DY9.js";import{F as Y}from"./flyingHighFire-BFDdxXcE.js";import{u as x}from"./Gltf-CAc3-dR_.js";import{S as k}from"./SmokeParticles-DVmLkrbB.js";import{V as u}from"./VolumetricFire-BiHHNjex.js";import{C as I,a as E}from"./Cloud-8-1Z8kCv.js";import{P as W}from"./PerspectiveCamera-DtEqSsaD.js";import{O as G}from"./OrbitControls-BZP2_Vo3.js";import"./constants-DOC22UAx.js";import"./Texture-DU49_Bb6.js";import"./deprecated-CtTvmxFP.js";import"./Fbo-BHMYgkbP.js";function H(t){const{nodes:e,materials:a}=x(P("/boeing_737-300.glb"));return s.jsxs("group",{...t,dispose:null,children:[s.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:e.Object_9.geometry,material:a.material00}),s.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:e.Object_12.geometry,material:a.material00}),s.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:e.Object_15.geometry,material:a.material02}),s.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:e.Object_18.geometry,material:a.material00})]})}x.preload(P("/boeing_737-300.glb"));function O({leftEngineMainFire:t,rightEngineMainFire:e,leftWingSecondaryFire:a,rightWingSecondaryFire:n,leftEngineSmokeTrail:p,rightEngineSmokeTrail:c,leftSmokePoints:d,rightSmokePoints:h}){return s.jsxs(s.Fragment,{children:[s.jsx("pointLight",{position:t?.points?.[0]?.position?.toArray()??[-1.8,-.1,.4],color:"#ff6600",intensity:4,distance:8,decay:2}),s.jsx("pointLight",{position:e?.points?.[0]?.position?.toArray()??[1.8,-.1,.4],color:"#ff6600",intensity:4,distance:8,decay:2}),s.jsx(u,{position:t?.points?.[0]?.position?.toArray()??[-1.8,0,.3],width:t?.fireWidth??.5,height:t?.fireHeight??1.8,depth:t?.fireDepth??.5,sliceSpacing:t?.fireSliceSpacing??.08,magnitude:t?.fireMagnitude??1.6,brightness:t?.fireBrightness??2.2,saturation:t?.fireSaturation??.9,animated:t?.fireAnimated??!0,bendX:.4,bendZ:-1.2,animSpeed:t?.fireAnimSpeed??.85,tintColor:t?.fireTintColor??"#ffcc44"}),s.jsx(u,{position:e?.points?.[0]?.position?.toArray()??[1.8,0,.3],width:e?.fireWidth??.5,height:e?.fireHeight??1.8,depth:e?.fireDepth??.5,sliceSpacing:e?.fireSliceSpacing??.08,magnitude:e?.fireMagnitude??1.6,brightness:e?.fireBrightness??2.2,saturation:e?.fireSaturation??.9,animated:e?.fireAnimated??!0,bendX:-.4,bendZ:-1.2,animSpeed:e?.fireAnimSpeed??.75,tintColor:e?.fireTintColor??"#ffcc44"}),s.jsx(u,{position:a?.points?.[0]?.position?.toArray()??[-1.4,.3,-.2],width:a?.fireWidth??.35,height:a?.fireHeight??1.2,depth:a?.fireDepth??.35,sliceSpacing:a?.fireSliceSpacing??.1,segments:16,magnitude:a?.fireMagnitude??1.4,brightness:a?.fireBrightness??1.8,animated:a?.fireAnimated??!0,animSpeed:a?.fireAnimSpeed??1.1,bendX:.2,bendZ:-.9,tintColor:a?.fireTintColor??"#ff8833"}),s.jsx(u,{position:n?.points?.[0]?.position?.toArray()??[1.4,.3,-.2],width:n?.fireWidth??.35,height:n?.fireHeight??1.2,depth:n?.fireDepth??.35,sliceSpacing:n?.fireSliceSpacing??.1,segments:16,magnitude:n?.fireMagnitude??1.4,brightness:n?.fireBrightness??1.8,animated:n?.fireAnimated??!0,animSpeed:n?.fireAnimSpeed??1,bendX:-.2,bendZ:-.9,tintColor:n?.fireTintColor??"#ff8833"}),s.jsx(k,{points:d,config:p}),s.jsx(k,{points:h,config:c})]})}const T=m.memo(O);function U({clouds:t}){return s.jsx(I,{material:j,children:t.map((e,a)=>s.jsx(E,{position:e.position,scale:e.scale,speed:e.speed,opacity:e.opacity,width:e.width,depth:e.depth,segments:e.segments,color:e.color},a))})}const _=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,L=`
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
`;function N({sky:t}){const e=m.useMemo(()=>new $({transparent:!0,side:w,depthWrite:!1,uniforms:{uColor:{value:new B("#87CEEB")},uEdgeSoftness:{value:.22},uWarpStrength:{value:.1},uBrushStrength:{value:1},uBleedAmount:{value:.12},uPoolingStrength:{value:1},uGrainAmount:{value:.035}},vertexShader:_,fragmentShader:L}),[]);return m.useEffect(()=>{const{uniforms:a}=e;a.uColor.value.set(t.color),a.uEdgeSoftness.value=t.shader.edgeSoftness,a.uWarpStrength.value=t.shader.warpStrength,a.uBrushStrength.value=t.shader.brushStrength,a.uBleedAmount.value=t.shader.bleedAmount,a.uPoolingStrength.value=t.shader.poolingStrength,a.uGrainAmount.value=t.shader.grainAmount},[e,t]),s.jsx("mesh",{position:t.position,material:e,renderOrder:-10,children:s.jsx("planeGeometry",{args:[t.width,t.height]})})}const v=Math.PI/180,o={background:"#ffffff",ambientIntensity:.5,directionalIntensity:1,hemisphereIntensity:.25,skyColor:"#87CEEB",skyPosX:0,skyPosY:1,skyPosZ:-12,skyWidth:40,skyHeight:24,skyEdgeSoftness:.22,skyWarpStrength:.1,skyBrushStrength:1,skyBleedAmount:.12,skyPoolingStrength:1,skyGrainAmount:.035,planeScale:.6,planePosX:0,planePosY:0,planePosZ:0,planeRotXDeg:2.9,planeRotYDeg:-36,planeRotZDeg:-1.7,c1Scale:1,c1PosX:-10,c1PosY:5,c1PosZ:-8,c1Speed:.2,c1Opacity:.6,c1Width:8,c1Depth:2,c1Segments:35,c1Color:"#f0f0f0",c2Scale:1,c2PosX:8,c2PosY:7,c2PosZ:-9,c2Speed:.15,c2Opacity:.5,c2Width:10,c2Depth:3,c2Segments:35,c2Color:"#f0f0f0",c3Scale:1,c3PosX:-4,c3PosY:-2,c3PosZ:-6,c3Speed:.1,c3Opacity:.45,c3Width:6,c3Depth:2,c3Segments:30,c3Color:"#f0f0f0"};function S(t){return{[`${t}Scale`]:{label:"Scale",value:o[`${t}Scale`],min:.1,max:5,step:.1},[`${t}PosX`]:{label:"X",value:o[`${t}PosX`],min:-30,max:30,step:.5},[`${t}PosY`]:{label:"Y",value:o[`${t}PosY`],min:-10,max:20,step:.5},[`${t}PosZ`]:{label:"Z",value:o[`${t}PosZ`],min:-20,max:5,step:.5},[`${t}Speed`]:{label:"Speed",value:o[`${t}Speed`],min:0,max:1,step:.05},[`${t}Opacity`]:{label:"Opacity",value:o[`${t}Opacity`],min:0,max:1,step:.05},[`${t}Width`]:{label:"Width",value:o[`${t}Width`],min:1,max:30,step:1},[`${t}Depth`]:{label:"Depth",value:o[`${t}Depth`],min:.5,max:10,step:.5},[`${t}Segments`]:{label:"Segments",value:o[`${t}Segments`],min:5,max:60,step:1},[`${t}Color`]:{label:"Color",value:o[`${t}Color`]}}}function y(t,e){return{scale:t[`${e}Scale`],position:[t[`${e}PosX`],t[`${e}PosY`],t[`${e}PosZ`]],speed:t[`${e}Speed`],opacity:t[`${e}Opacity`],width:t[`${e}Width`],depth:t[`${e}Depth`],segments:t[`${e}Segments`],color:t[`${e}Color`]}}function V(){const t=m.useRef(null),[e,a]=D("Flying High",()=>({Dev:r({reset:b(()=>a(o)),...Z()?{copy:b(()=>{if(!t.current)return;const n=JSON.stringify(t.current,null,2).replace(/"([A-Za-z_$][A-Za-z0-9_$]*)":/g,"$1:");navigator.clipboard.writeText(n)})}:{}},{collapsed:!0}),Scene:r({background:{label:"Background",value:o.background},ambientIntensity:{label:"Ambient",value:o.ambientIntensity,min:0,max:2,step:.05},directionalIntensity:{label:"Directional",value:o.directionalIntensity,min:0,max:3,step:.05},hemisphereIntensity:{label:"Hemisphere",value:o.hemisphereIntensity,min:0,max:2,step:.05}},{collapsed:!0}),Sky:r({skyColor:{label:"Color",value:o.skyColor},skyPosX:{label:"X",value:o.skyPosX,min:-20,max:20,step:.5},skyPosY:{label:"Y",value:o.skyPosY,min:-20,max:20,step:.5},skyPosZ:{label:"Z",value:o.skyPosZ,min:-30,max:0,step:.5},skyWidth:{label:"Width",value:o.skyWidth,min:10,max:80,step:1},skyHeight:{label:"Height",value:o.skyHeight,min:6,max:50,step:1},Shader:r({skyEdgeSoftness:{label:"Edge Softness",value:o.skyEdgeSoftness,min:.05,max:.4,step:.01},skyWarpStrength:{label:"Warp",value:o.skyWarpStrength,min:0,max:.3,step:.01},skyBrushStrength:{label:"Brush",value:o.skyBrushStrength,min:0,max:3,step:.1},skyBleedAmount:{label:"Bleed",value:o.skyBleedAmount,min:0,max:.5,step:.01},skyPoolingStrength:{label:"Pooling",value:o.skyPoolingStrength,min:0,max:2,step:.1},skyGrainAmount:{label:"Grain",value:o.skyGrainAmount,min:0,max:.1,step:.005}},{collapsed:!0})},{collapsed:!0}),Plane:r({planeScale:{label:"Scale",value:o.planeScale,min:.1,max:2,step:.05},planePosX:{label:"X",value:o.planePosX,min:-20,max:20,step:.1},planePosY:{label:"Y",value:o.planePosY,min:-20,max:20,step:.1},planePosZ:{label:"Z",value:o.planePosZ,min:-20,max:20,step:.1},planeRotXDeg:{label:"Rot X (°)",value:o.planeRotXDeg,min:-180,max:180,step:.5},planeRotYDeg:{label:"Rot Y (°)",value:o.planeRotYDeg,min:-180,max:180,step:.5},planeRotZDeg:{label:"Rot Z (°)",value:o.planeRotZDeg,min:-180,max:180,step:.5}},{collapsed:!0}),Clouds:r({"Cloud 1":r(S("c1"),{collapsed:!0}),"Cloud 2":r(S("c2"),{collapsed:!0}),"Cloud 3":r(S("c3"),{collapsed:!0})},{collapsed:!0})}));return t.current=e,{scene:{background:e.background,ambientIntensity:e.ambientIntensity,directionalIntensity:e.directionalIntensity,hemisphereIntensity:e.hemisphereIntensity},sky:{color:e.skyColor,position:[e.skyPosX,e.skyPosY,e.skyPosZ],width:e.skyWidth,height:e.skyHeight,shader:{edgeSoftness:e.skyEdgeSoftness,warpStrength:e.skyWarpStrength,brushStrength:e.skyBrushStrength,bleedAmount:e.skyBleedAmount,poolingStrength:e.skyPoolingStrength,grainAmount:e.skyGrainAmount}},plane:{scale:e.planeScale,position:[e.planePosX,e.planePosY,e.planePosZ],rotation:[e.planeRotXDeg*v,e.planeRotYDeg*v,e.planeRotZDeg*v]},clouds:[y(e,"c1"),y(e,"c2"),y(e,"c3")]}}function ie(){const{scene:t,sky:e,plane:a,clouds:n}=V(),{leftEngineMainFire:p,rightEngineMainFire:c,leftWingSecondaryFire:d,rightWingSecondaryFire:h,leftEngineSmokeTrail:g,rightEngineSmokeTrail:f}=m.useMemo(()=>{const l=Y.splines??[];return{leftEngineMainFire:l.find(i=>i.name==="Left Engine Main Fire"),rightEngineMainFire:l.find(i=>i.name==="Right Engine Main Fire"),leftWingSecondaryFire:l.find(i=>i.name==="Left Wing Secondary Fire"),rightWingSecondaryFire:l.find(i=>i.name==="Right Wing Secondary Fire"),leftEngineSmokeTrail:l.find(i=>i.name==="Left Engine Smoke Trail"),rightEngineSmokeTrail:l.find(i=>i.name==="Right Engine Smoke Trail")}},[]),C=m.useMemo(()=>g?.points?.map(l=>l.position.clone())??[],[g]),A=m.useMemo(()=>f?.points?.map(l=>l.position.clone())??[],[f]);return s.jsxs(s.Fragment,{children:[s.jsx("color",{attach:"background",args:[t.background]}),s.jsx(W,{makeDefault:!0,position:[10,3,14],fov:42}),s.jsx(G,{target:[0,.5,-1]}),s.jsx("ambientLight",{intensity:t.ambientIntensity}),s.jsx("directionalLight",{position:[5,8,10],intensity:t.directionalIntensity,color:"#fff5e0"}),s.jsx("hemisphereLight",{skyColor:"#87CEEB",groundColor:"#443322",intensity:t.hemisphereIntensity}),s.jsx(N,{sky:e}),s.jsx(U,{clouds:n}),s.jsx(H,{scale:a.scale,rotation:a.rotation,position:a.position}),s.jsx(T,{leftEngineMainFire:p,rightEngineMainFire:c,leftWingSecondaryFire:d,rightWingSecondaryFire:h,leftEngineSmokeTrail:g,rightEngineSmokeTrail:f,leftSmokePoints:C,rightSmokePoints:A}),s.jsx(X,{disableNormalPass:!0,children:s.jsx(R,{intensity:.8,luminanceThreshold:.55,luminanceSmoothing:.3,mipmapBlur:!0,radius:.45})})]})}export{ie as default};
