import{j as s,b as $,an as j,F as w,aX as D,e as H,r as F,a as G,B as V,t as k,V as v,E as U}from"./index-DQZ6GwWS.js";import{P as L,a as _,b as X,c as I}from"./PerlinNoiseSplineGPU---6qWyy0.js";import{F as q,c as Z,a as O,b as C,d as z,B as Y}from"./burningAtBothEndsFire-Kc27ukKa.js";import{s as K}from"./shaderMaterial-BdgF9GSD.js";import{m as J,c as Q}from"./FireAndSmoke-mvSX62S2.js";import{m as n}from"./splineAuthoring-CX0VPvia.js";import{D as ee}from"./buildSplineGroupControls-DMQF7gOt.js";function ie(e){return s.jsx(L,{...e,greyscale:!1})}function te(e){return s.jsx(_,{...e,greyscale:!1})}function Ee(e){return $(f=>f.gl)?.isWebGPURenderer===!0?s.jsx(te,{...e}):s.jsx(ie,{...e})}function re(e){return s.jsx(X,{...e,greyscale:!1})}function se(e){return s.jsx(I,{...e,greyscale:!1})}function xe(e){return $(f=>f.gl)?.isWebGPURenderer===!0?s.jsx(se,{...e}):s.jsx(re,{...e})}const oe=e=>Number.isInteger(e)?`${e}.0`:`${e}`,b=e=>typeof e=="number"?oe(e):Array.isArray(e)?e.map(t=>b(t)):e&&typeof e=="object"?Object.fromEntries(Object.entries(e).map(([t,a])=>[t,b(a)])):e,p=e=>`vec3(${e.join(", ")})`,{alpha:l,baseScale:ae,bend:r,color:i,opacity:E,shimmer:d,vertical:y}=b(q),ne=`
  uniform float time;
  varying vec2 vUv;
  varying float hValue;

  float random(in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float noise(in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    pos *= ${p(ae)};
    hValue = position.y;
    float posXZlen = length(position.xz);
    pos.y *= 1.0 + (cos((posXZlen + ${y.cosOffset}) * ${y.pi}) * ${y.cosAmp}
           + noise(vec2(0.0, time)) * ${y.staticNoiseAmp}
           + noise(vec2(position.x + time, position.z + time)) * ${y.flowNoiseAmp}) * position.y;

    float signedNoiseX = noise(vec2(time * ${r.timeScale}, (position.y - time) * ${r.heightScale})) * 2.0 - 1.0;
    float signedNoiseZ = noise(vec2((position.y - time) * ${r.heightScale}, time * ${r.timeScale})) * 2.0 - 1.0;
    float bendEnvelope = pow(clamp(hValue, 0.0, 1.0), ${r.power});
    float scoopCycle = sin(time * ${r.scoopFreq});
    float scoopCrossCycle = sin(time * ${r.scoopCrossFreq} + ${r.scoopCrossPhase});
    float driftX = sin(time * ${r.driftXFreq} + hValue * ${r.driftXHeightFreq}) * ${r.driftXAmp};
    float driftZ = cos(time * ${r.driftZFreq} + hValue * ${r.driftZHeightFreq} + ${r.driftZPhase}) * ${r.driftZAmp};

    pos.x += (scoopCycle * ${r.scoopAmp} + signedNoiseX * ${r.signedNoiseXAmp} + driftX) * bendEnvelope;
    pos.z += (scoopCrossCycle * ${r.scoopCrossAmp} + signedNoiseZ * ${r.signedNoiseZAmp} + driftZ) * bendEnvelope;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`,le=`
  uniform float time;
  varying float hValue;
  varying vec2 vUv;

  float random(in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float noise(in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
  }

  void main() {
    float center = abs(vUv.x - 0.5) * 2.0;
    float radialFalloff = 1.0 - center;
    float heightMask = smoothstep(${l.heightStart}, ${l.heightPeak}, hValue) * (1.0 - smoothstep(${l.tipFadeStart}, ${l.tipFadeEnd}, hValue));
    float taperedWidth = mix(${l.widthBase}, ${l.widthTip}, smoothstep(${l.widthTaperStart}, ${l.widthTaperEnd}, hValue));
    float edgeNoise = noise(vec2(center * ${l.edgeNoiseXScale} + time * ${l.edgeNoiseTimeScale}, hValue * ${l.edgeNoiseYScale} - time * ${l.edgeNoiseTimeSpeed}));
    float edgeMask = 1.0 - smoothstep(taperedWidth, taperedWidth + ${l.edgeSoftness} + edgeNoise * ${l.edgeNoiseAmp}, center);
    float alpha = heightMask * edgeMask;

    float blueBase = (1.0 - smoothstep(${i.blueBaseFadeStart}, ${i.blueBaseFadeEnd}, hValue)) * smoothstep(${i.blueBaseRadialStart}, ${i.blueBaseRadialEnd}, radialFalloff);
    float innerCore =
      smoothstep(${i.innerCoreHeightStart}, ${i.innerCoreHeightPeak}, hValue) *
      (1.0 - smoothstep(${i.innerCoreFadeStart}, ${i.innerCoreFadeEnd}, hValue)) *
      smoothstep(${i.innerCoreRadialStart}, ${i.innerCoreRadialEnd}, radialFalloff);
    float warmBody =
      smoothstep(${i.warmBodyStart}, ${i.warmBodyEnd}, hValue) *
      (1.0 - smoothstep(${i.warmBodyFadeStart}, ${i.warmBodyFadeEnd}, hValue));
    float emberTip = smoothstep(${i.emberTipStart}, ${i.emberTipEnd}, hValue) * smoothstep(${i.emberCenterStart}, ${i.emberCenterEnd}, center);

    vec3 outerColor = mix(
      ${p(i.outerLow)},
      ${p(i.outerHigh)},
      smoothstep(${i.outerMixStart}, ${i.outerMixEnd}, hValue)
    );

    vec3 color = outerColor;
    color += ${p(i.blue)} * blueBase * ${i.blueScale};
    color = mix(color, ${p(i.core)}, innerCore);
    color += ${p(i.warm)} * warmBody * radialFalloff * ${i.warmScale};
    color = mix(color, ${p(i.ember)}, emberTip * ${i.emberMix});

    float shimmer = ${d.base} + noise(vec2(vUv.x * ${d.xScale} - time * ${d.timeScale}, hValue * ${d.yScale} + time * ${d.timeSpeed})) * ${d.amp};
    color *= shimmer;
    alpha *= ${E.base} + innerCore * ${E.innerCoreBoost};

    gl_FragColor = vec4(color, alpha);
  }
`,fe=K({time:0},ne,le);H({FlameMaterialImpl:fe});const x=j.forwardRef(function({side:t=w},a){return s.jsx("flameMaterialImpl",{ref:a,transparent:!0,blending:D,side:t,depthWrite:!1,toneMapped:!1})});function ce({position:e=[0,0,0],inverted:t=!1,motion:a,phaseOffset:f=0}){const o={...O,...a},c=F.useRef(),u=F.useRef(),g=F.useRef(),m=F.useRef(0),A=F.useMemo(()=>Z(k),[]);return G(({clock:R},T)=>{const S=R.getElapsedTime()+f,P=o.baseSpeed+Math.sin(S*o.slowFreq)*o.slowAmp+Math.sin(S*o.fastFreq+1.4)*o.fastAmp+Math.sin(S*o.microFreq)*o.microAmp;if(m.current+=T*Math.max(o.minSpeed,P),u.current&&(u.current.time=m.current),g.current&&(g.current.time=m.current),c.current){const B=Math.sin(S*3.2)*o.swayX,N=Math.cos(S*2.4+.8)*o.swayZ;c.current.rotation.x=(t?Math.PI:0)+B,c.current.rotation.z=N;const W=1+Math.sin(m.current*o.pulseFreq)*o.pulseAmp;c.current.scale.set(o.scaleX,W*o.scaleY,o.scaleX)}}),s.jsxs("group",{ref:c,position:e,rotation:t?[Math.PI,0,0]:[0,0,0],children:[s.jsxs("mesh",{"rotation-y":C,children:[s.jsx("primitive",{object:A,attach:"geometry"}),s.jsx(x,{ref:u,side:w})]}),s.jsxs("mesh",{"rotation-y":C,children:[s.jsx("primitive",{object:A,attach:"geometry"}),s.jsx(x,{ref:g,side:V})]})]})}function Me(e){return $(f=>f.gl)?.isWebGPURenderer===!0?s.jsx(z,{...e}):s.jsx(ce,{...e})}const pe=(e,t,a)=>new v(e,t,a),me=(e,t,a)=>new U(e,t,a),de=(e,t,a)=>new v(e,t,a),h=(e,t,a,f,o,c,u=0,g=0,m=0)=>({position:pe(e,t,a),rotation:me(u,g,m),scale:de(f,o,c)}),M=(e,t=0)=>({pos:[e,-1,t],points:[[0,0,0],[.8,2.2,.7],[-.4,5,1.4],[-1.3,8.2,-.3],[.6,11,-1.1]]}),he={splines:[n({name:"Classic Fire",type:"Fire",fireType:"Classic",closed:!1,tension:.7,...M(-5.5,2.2)}),n({name:"RayMarch Fire",type:"Fire",fireType:"RayMarch",closed:!1,tension:.7,...M(5.75,1.6)})],elements:{fireball:[{pos:[-7,1,-2.75],rot:[0,0,0],scale:[1,1,1],config:{radius:.4,detail:5,speed:1,weight:.3,noiseFreq:2,noiseAmp:.15,animated:!0}}],fireSpline:[{pos:[-5.75,0,-1.6],rot:[0,0,0],scale:[1,1,1],showHandles:!0,showSpline:!0,pointMode:"translate",controlPoints:[h(3.5,0,2.8,1,1,1),h(3.5,.9,2.8,.9,.9,.9),h(3.65,1.8,2.8,1,1,1),h(3.75,2.7,2.9,1.3,1.3,1.3),h(3.85,3.6,2.95,1.6,1.6,1.6),h(3.95,4.5,3,2,2,2)],config:{baseRadius:.6,tubularSegments:64,radialSegments:32,capSegments:8,speed:1,weight:.3,noiseFreq:2,noiseAmp:.15,animated:!0,smokeLightColor:"#4a4a58",smokeDarkColor:"#1a1a22"}}],flame:[{pos:[-.5,0,-3],rot:[0,0,0],scale:[1.2,1.2,1.2],config:{inverted:!1,motion:{baseSpeed:1.15,minSpeed:.28,slowFreq:.7,slowAmp:.55,fastFreq:2.6,fastAmp:.25,microFreq:5.7,microAmp:.08,swayX:.015,swayZ:.014,pulseFreq:3.4,pulseAmp:.04,scaleX:1,scaleY:1}}}],volumetricFire:[{pos:[4.25,0,-2.6],rot:[0,0,0],scale:[1,1,1],config:{width:.8,height:2,depth:.8,sliceSpacing:.04,bendX:0,bendZ:0,animated:!0,animSpeed:.5,showSpline:!1,showVolume:!1,magnitude:1.3,lacunarity:2,gain:.5,tintColor:"#ffffff",saturation:1,brightness:1.5}}],cs184Fire:[{pos:[.75,0,3.2],rot:[0,0,0],scale:[1,1,1],config:{width:.5,height:1.5,depth:.5,bendX:0,bendZ:0,animated:!0,animSpeed:.5,magnitude:1.3,lacunarity:2,gain:.5,speed:.8,density:1.2,brightness:1.8,saturation:1,tintColor:"#ffffff",coreColor:"#ffffcc",borderColor:"#ff6600",smokeColor:"#330000",emberDensity:.15,emberSize:.25,emberColor:"#ff4400",steps:64,stepSize:1}}],fireAndSmoke:[{pos:[7,0,3],rot:[0,0,0],scale:[1,1,1],showHandles:!0,showSpline:!0,pointMode:"translate",controlPoints:Q(),config:J()}]}},ue={splines:[n({name:"Left Engine Main Fire",type:"Fire",fireType:"Classic",tension:.25,closed:!1,fireWidth:.5,fireHeight:1.8,fireDepth:.5,fireSliceSpacing:.08,fireMagnitude:1.6,fireBrightness:2.2,fireSaturation:.9,fireAnimated:!0,fireAnimSpeed:.85,fireTintColor:"#ffcc44",pos:[-4.93,-.55,-.3],points:[[0,0,0],[.1,.7,-1.4],[.3,1.5,-3.2],[.5,2.4,-5.4]]}),n({name:"Right Engine Main Fire",type:"Fire",fireType:"Classic",tension:.25,closed:!1,fireWidth:.5,fireHeight:1.8,fireDepth:.5,fireSliceSpacing:.08,fireMagnitude:1.6,fireBrightness:2.2,fireSaturation:.9,fireAnimated:!0,fireAnimSpeed:.75,fireTintColor:"#ffcc44",pos:[4.93,-.55,-.3],points:[[0,0,0],[-.1,.7,-1.4],[-.3,1.5,-3.2],[-.5,2.4,-5.4]]}),n({name:"Left Wing Secondary Fire",type:"Fire",fireType:"Classic",tension:.25,closed:!1,fireWidth:.35,fireHeight:1.2,fireDepth:.35,fireSliceSpacing:.1,fireMagnitude:1.4,fireBrightness:1.8,fireAnimated:!0,fireAnimSpeed:1.1,fireTintColor:"#ff8833",pos:[-2,.1,-1.6],points:[[0,0,0],[.1,.8,-1.5],[.2,1.7,-3.2]]}),n({name:"Right Wing Secondary Fire",type:"Fire",fireType:"Classic",tension:.25,closed:!1,fireWidth:.35,fireHeight:1.2,fireDepth:.35,fireSliceSpacing:.1,fireMagnitude:1.4,fireBrightness:1.8,fireAnimated:!0,fireAnimSpeed:1,fireTintColor:"#ff8833",pos:[2,.1,-1.6],points:[[0,0,0],[-.1,.8,-1.5],[-.2,1.7,-3.2]]}),n({name:"Left Engine Smoke Trail",type:"Smoke",smokeType:"Particle",tension:.25,closed:!1,particleCount:500,particleSize:90,particleColor:"#1f1c1a",opacity:.35,flowSpeed:.25,springK:.008,damping:.965,turbulence:.35,turbulenceSpeed:.6,buoyancy:.12,rotSpeed:.15,fadeRate:.4,spawnSpread:.6,blendMode:"Normal",growth:2.5,fadeExponent:1.4,attractorStrength:0,attractorRadius:0,maxDrift:10,pos:[-4.6,1.6,-4.5],points:[[0,0,0],[.2,1.4,-2.5],[.6,3.6,-4.2],[1,6.5,-5.2],[1.3,10,-5.6]]}),n({name:"Right Engine Smoke Trail",type:"Smoke",smokeType:"Particle",tension:.25,closed:!1,particleCount:500,particleSize:90,particleColor:"#1f1c1a",opacity:.35,flowSpeed:.25,springK:.008,damping:.965,turbulence:.35,turbulenceSpeed:.6,buoyancy:.12,rotSpeed:.15,fadeRate:.4,spawnSpread:.6,blendMode:"Normal",growth:2.5,fadeExponent:1.4,attractorStrength:0,attractorRadius:0,maxDrift:10,pos:[4.6,1.6,-4.5],points:[[0,0,0],[-.2,1.4,-2.5],[-.6,3.6,-4.2],[-1,6.5,-5.2],[-1.3,10,-5.6]]})]},ge={splines:[n({name:"Windshield Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:1.4,fireDepth:.4,fireHeight:1.6,fireAnimated:!0,fireAnimSpeed:.55,fireMagnitude:1.3,fireBrightness:1.5,simScale:1.1,simStrength:1,pos:[.62,1.1,-4.55],points:[[0,0,0],[0,0,1.1]]}),n({name:"Driver Front Window Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:.84,fireDepth:.4,fireHeight:1.6,fireAnimated:!0,fireAnimSpeed:.55,fireMagnitude:1.3,fireBrightness:1.5,simScale:1,simStrength:1,pos:[.42,1.02,-4.66],points:[[0,0,0],[-.54,0,0]]}),n({name:"Driver Rear Window Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:1,fireDepth:.4,fireHeight:1.6,fireAnimated:!0,fireAnimSpeed:.55,fireMagnitude:1.3,fireBrightness:1.5,simScale:1,simStrength:.9,pos:[-.3,1.02,-4.69],points:[[0,0,0],[-.7,0,0]]}),n({name:"Passenger Front Window Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:.84,fireDepth:.4,fireHeight:1.6,fireAnimated:!0,fireAnimSpeed:.55,fireMagnitude:1.3,fireBrightness:1.5,simScale:1,simStrength:1,pos:[.42,1.02,-3.34],points:[[0,0,0],[-.54,0,0]]}),n({name:"Passenger Rear Window Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:1,fireDepth:.4,fireHeight:1.6,fireAnimated:!0,fireAnimSpeed:.55,fireMagnitude:1.3,fireBrightness:1.5,simScale:1,simStrength:.9,pos:[-.3,1.02,-3.31],points:[[0,0,0],[-.7,0,0]]}),n({name:"Rear Window Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:1.2,fireDepth:.4,fireHeight:1.6,fireAnimated:!0,fireAnimSpeed:.55,fireMagnitude:1.3,fireBrightness:1.5,simScale:1,simStrength:.8,pos:[-1.3,1.12,-4.45],points:[[0,0,0],[0,0,.9]]}),n({name:"Roof Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:1.5,fireDepth:.4,fireHeight:2.4,fireAnimated:!0,fireAnimSpeed:.55,fireMagnitude:1.3,fireBrightness:1.5,simScale:1.8,simStrength:1.2,pos:[.25,1.05,-4],points:[[0,0,0],[-1.2,0,0]]}),n({name:"Hood Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:1,fireDepth:.4,fireHeight:1.1,fireAnimated:!0,fireAnimSpeed:.55,fireMagnitude:1.3,fireBrightness:1.5,simScale:1.2,simStrength:.6,pos:[1.65,.95,-4.35],points:[[0,0,0],[0,0,.7]]})]},we={Default:he,"Burning At Both Ends":Y,"Dumpster Fire":ee,"Flying High":ue,"Police Presence":ge};export{we as F,Ee as a,xe as b,Me as c};
