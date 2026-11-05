import{j as r,b as y,aj as G,F as A,aH as V,e as k,r as b,a as U,B as L,t as _,V as M,E as W}from"./index-ClsBeNqB.js";import{P as X,a as H,b as I,c as q}from"./PerlinNoiseSplineGPU-De9SFPJa.js";import{F as D,c as Z,a as O,b as x,d as z,B as Y}from"./burningAtBothEndsFire-CpF07wnP.js";import{s as K}from"./shaderMaterial-Zj-aQGad.js";import{m as J,c as Q}from"./FireAndSmoke-DrpJG40H.js";import{m as c}from"./splineAuthoring-DssNKxuY.js";import{D as ee}from"./buildSplineGroupControls-fXOF_eYg.js";import{P as te}from"./policePresenceFire-CgsuE7aW.js";function ie(e){return r.jsx(X,{...e,greyscale:!1})}function oe(e){return r.jsx(H,{...e,greyscale:!1})}function ve(e){return y(l=>l.gl)?.isWebGPURenderer===!0?r.jsx(oe,{...e}):r.jsx(ie,{...e})}function re(e){return r.jsx(I,{...e,greyscale:!1})}function ae(e){return r.jsx(q,{...e,greyscale:!1})}function we(e){return y(l=>l.gl)?.isWebGPURenderer===!0?r.jsx(ae,{...e}):r.jsx(re,{...e})}const se=e=>Number.isInteger(e)?`${e}.0`:`${e}`,$=e=>typeof e=="number"?se(e):Array.isArray(e)?e.map(i=>$(i)):e&&typeof e=="object"?Object.fromEntries(Object.entries(e).map(([i,s])=>[i,$(s)])):e,m=e=>`vec3(${e.join(", ")})`,{alpha:n,baseScale:ne,bend:o,color:t,opacity:C,shimmer:d,vertical:F}=$(D),le=`
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
    pos *= ${m(ne)};
    hValue = position.y;
    float posXZlen = length(position.xz);
    pos.y *= 1.0 + (cos((posXZlen + ${F.cosOffset}) * ${F.pi}) * ${F.cosAmp}
           + noise(vec2(0.0, time)) * ${F.staticNoiseAmp}
           + noise(vec2(position.x + time, position.z + time)) * ${F.flowNoiseAmp}) * position.y;

    float signedNoiseX = noise(vec2(time * ${o.timeScale}, (position.y - time) * ${o.heightScale})) * 2.0 - 1.0;
    float signedNoiseZ = noise(vec2((position.y - time) * ${o.heightScale}, time * ${o.timeScale})) * 2.0 - 1.0;
    float bendEnvelope = pow(clamp(hValue, 0.0, 1.0), ${o.power});
    float scoopCycle = sin(time * ${o.scoopFreq});
    float scoopCrossCycle = sin(time * ${o.scoopCrossFreq} + ${o.scoopCrossPhase});
    float driftX = sin(time * ${o.driftXFreq} + hValue * ${o.driftXHeightFreq}) * ${o.driftXAmp};
    float driftZ = cos(time * ${o.driftZFreq} + hValue * ${o.driftZHeightFreq} + ${o.driftZPhase}) * ${o.driftZAmp};

    pos.x += (scoopCycle * ${o.scoopAmp} + signedNoiseX * ${o.signedNoiseXAmp} + driftX) * bendEnvelope;
    pos.z += (scoopCrossCycle * ${o.scoopCrossAmp} + signedNoiseZ * ${o.signedNoiseZAmp} + driftZ) * bendEnvelope;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`,ce=`
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
    float heightMask = smoothstep(${n.heightStart}, ${n.heightPeak}, hValue) * (1.0 - smoothstep(${n.tipFadeStart}, ${n.tipFadeEnd}, hValue));
    float taperedWidth = mix(${n.widthBase}, ${n.widthTip}, smoothstep(${n.widthTaperStart}, ${n.widthTaperEnd}, hValue));
    float edgeNoise = noise(vec2(center * ${n.edgeNoiseXScale} + time * ${n.edgeNoiseTimeScale}, hValue * ${n.edgeNoiseYScale} - time * ${n.edgeNoiseTimeSpeed}));
    float edgeMask = 1.0 - smoothstep(taperedWidth, taperedWidth + ${n.edgeSoftness} + edgeNoise * ${n.edgeNoiseAmp}, center);
    float alpha = heightMask * edgeMask;

    float blueBase = (1.0 - smoothstep(${t.blueBaseFadeStart}, ${t.blueBaseFadeEnd}, hValue)) * smoothstep(${t.blueBaseRadialStart}, ${t.blueBaseRadialEnd}, radialFalloff);
    float innerCore =
      smoothstep(${t.innerCoreHeightStart}, ${t.innerCoreHeightPeak}, hValue) *
      (1.0 - smoothstep(${t.innerCoreFadeStart}, ${t.innerCoreFadeEnd}, hValue)) *
      smoothstep(${t.innerCoreRadialStart}, ${t.innerCoreRadialEnd}, radialFalloff);
    float warmBody =
      smoothstep(${t.warmBodyStart}, ${t.warmBodyEnd}, hValue) *
      (1.0 - smoothstep(${t.warmBodyFadeStart}, ${t.warmBodyFadeEnd}, hValue));
    float emberTip = smoothstep(${t.emberTipStart}, ${t.emberTipEnd}, hValue) * smoothstep(${t.emberCenterStart}, ${t.emberCenterEnd}, center);

    vec3 outerColor = mix(
      ${m(t.outerLow)},
      ${m(t.outerHigh)},
      smoothstep(${t.outerMixStart}, ${t.outerMixEnd}, hValue)
    );

    vec3 color = outerColor;
    color += ${m(t.blue)} * blueBase * ${t.blueScale};
    color = mix(color, ${m(t.core)}, innerCore);
    color += ${m(t.warm)} * warmBody * radialFalloff * ${t.warmScale};
    color = mix(color, ${m(t.ember)}, emberTip * ${t.emberMix});

    float shimmer = ${d.base} + noise(vec2(vUv.x * ${d.xScale} - time * ${d.timeScale}, hValue * ${d.yScale} + time * ${d.timeSpeed})) * ${d.amp};
    color *= shimmer;
    alpha *= ${C.base} + innerCore * ${C.innerCoreBoost};

    gl_FragColor = vec4(color, alpha);
  }
`,fe=K({time:0},le,ce);k({FlameMaterialImpl:fe});const v=G.forwardRef(function({side:i=A},s){return r.jsx("flameMaterialImpl",{ref:s,transparent:!0,blending:V,side:i,depthWrite:!1,toneMapped:!1})});function me({position:e=[0,0,0],inverted:i=!1,motion:s,phaseOffset:l=0}){const a={...O,...s},f=b.useRef(),h=b.useRef(),g=b.useRef(),p=b.useRef(0),E=b.useMemo(()=>Z(_),[]);return U(({clock:R},P)=>{const S=R.getElapsedTime()+l,T=a.baseSpeed+Math.sin(S*a.slowFreq)*a.slowAmp+Math.sin(S*a.fastFreq+1.4)*a.fastAmp+Math.sin(S*a.microFreq)*a.microAmp;if(p.current+=P*Math.max(a.minSpeed,T),h.current&&(h.current.time=p.current),g.current&&(g.current.time=p.current),f.current){const N=Math.sin(S*3.2)*a.swayX,j=Math.cos(S*2.4+.8)*a.swayZ;f.current.rotation.x=(i?Math.PI:0)+N,f.current.rotation.z=j;const B=1+Math.sin(p.current*a.pulseFreq)*a.pulseAmp;f.current.scale.set(a.scaleX,B*a.scaleY,a.scaleX)}}),r.jsxs("group",{ref:f,position:e,rotation:i?[Math.PI,0,0]:[0,0,0],children:[r.jsxs("mesh",{"rotation-y":x,children:[r.jsx("primitive",{object:E,attach:"geometry"}),r.jsx(v,{ref:h,side:A})]}),r.jsxs("mesh",{"rotation-y":x,children:[r.jsx("primitive",{object:E,attach:"geometry"}),r.jsx(v,{ref:g,side:L})]})]})}function Ae(e){return y(l=>l.gl)?.isWebGPURenderer===!0?r.jsx(z,{...e}):r.jsx(me,{...e})}const pe=(e,i,s)=>new M(e,i,s),de=(e,i,s)=>new W(e,i,s),ue=(e,i,s)=>new M(e,i,s),u=(e,i,s,l,a,f,h=0,g=0,p=0)=>({position:pe(e,i,s),rotation:de(h,g,p),scale:ue(l,a,f)}),w=(e,i=0)=>({pos:[e,-1,i],points:[[0,0,0],[.8,2.2,.7],[-.4,5,1.4],[-1.3,8.2,-.3],[.6,11,-1.1]]}),he={splines:[c({name:"Classic Fire",type:"Fire",fireType:"Classic",closed:!1,tension:.7,...w(-5.5,2.2)}),c({name:"RayMarch Fire",type:"Fire",fireType:"RayMarch",closed:!1,tension:.7,...w(5.75,1.6)})],elements:{fireball:[{pos:[-7,1,-2.75],rot:[0,0,0],scale:[1,1,1],config:{radius:.4,detail:5,speed:1,weight:.3,noiseFreq:2,noiseAmp:.15,animated:!0}}],fireSpline:[{pos:[-5.75,0,-1.6],rot:[0,0,0],scale:[1,1,1],showHandles:!0,showSpline:!0,pointMode:"translate",controlPoints:[u(3.5,0,2.8,1,1,1),u(3.5,.9,2.8,.9,.9,.9),u(3.65,1.8,2.8,1,1,1),u(3.75,2.7,2.9,1.3,1.3,1.3),u(3.85,3.6,2.95,1.6,1.6,1.6),u(3.95,4.5,3,2,2,2)],config:{baseRadius:.6,tubularSegments:64,radialSegments:32,capSegments:8,speed:1,weight:.3,noiseFreq:2,noiseAmp:.15,animated:!0,smokeLightColor:"#4a4a58",smokeDarkColor:"#1a1a22"}}],flame:[{pos:[-.5,0,-3],rot:[0,0,0],scale:[1.2,1.2,1.2],config:{inverted:!1,motion:{baseSpeed:1.15,minSpeed:.28,slowFreq:.7,slowAmp:.55,fastFreq:2.6,fastAmp:.25,microFreq:5.7,microAmp:.08,swayX:.015,swayZ:.014,pulseFreq:3.4,pulseAmp:.04,scaleX:1,scaleY:1}}}],volumetricFire:[{pos:[4.25,0,-2.6],rot:[0,0,0],scale:[1,1,1],config:{width:.8,height:2,depth:.8,sliceSpacing:.04,bendX:0,bendZ:0,animated:!0,animSpeed:.5,showSpline:!1,showVolume:!1,magnitude:1.3,lacunarity:2,gain:.5,tintColor:"#ffffff",saturation:1,brightness:1.5}}],cs184Fire:[{pos:[.75,0,3.2],rot:[0,0,0],scale:[1,1,1],config:{width:.5,height:1.5,depth:.5,bendX:0,bendZ:0,animated:!0,animSpeed:.5,magnitude:1.3,lacunarity:2,gain:.5,speed:.8,density:1.2,brightness:1.8,saturation:1,tintColor:"#ffffff",coreColor:"#ffffcc",borderColor:"#ff6600",smokeColor:"#330000",emberDensity:.15,emberSize:.25,emberColor:"#ff4400",steps:64,stepSize:1}}],fireAndSmoke:[{pos:[7,0,3],rot:[0,0,0],scale:[1,1,1],showHandles:!0,showSpline:!0,pointMode:"translate",controlPoints:Q(),config:J()}]}},ge={splines:[c({name:"Left Engine Main Fire",type:"Fire",fireType:"Classic",tension:.25,closed:!1,fireWidth:.5,fireHeight:1.8,fireDepth:.5,fireSliceSpacing:.08,fireMagnitude:1.6,fireBrightness:2.2,fireSaturation:.9,fireAnimated:!0,fireAnimSpeed:.85,fireTintColor:"#ffcc44",pos:[-4.93,-.55,-.3],points:[[0,0,0],[.1,.7,-1.4],[.3,1.5,-3.2],[.5,2.4,-5.4]]}),c({name:"Right Engine Main Fire",type:"Fire",fireType:"Classic",tension:.25,closed:!1,fireWidth:.5,fireHeight:1.8,fireDepth:.5,fireSliceSpacing:.08,fireMagnitude:1.6,fireBrightness:2.2,fireSaturation:.9,fireAnimated:!0,fireAnimSpeed:.75,fireTintColor:"#ffcc44",pos:[4.93,-.55,-.3],points:[[0,0,0],[-.1,.7,-1.4],[-.3,1.5,-3.2],[-.5,2.4,-5.4]]}),c({name:"Left Wing Secondary Fire",type:"Fire",fireType:"Classic",tension:.25,closed:!1,fireWidth:.35,fireHeight:1.2,fireDepth:.35,fireSliceSpacing:.1,fireMagnitude:1.4,fireBrightness:1.8,fireAnimated:!0,fireAnimSpeed:1.1,fireTintColor:"#ff8833",pos:[-2,.1,-1.6],points:[[0,0,0],[.1,.8,-1.5],[.2,1.7,-3.2]]}),c({name:"Right Wing Secondary Fire",type:"Fire",fireType:"Classic",tension:.25,closed:!1,fireWidth:.35,fireHeight:1.2,fireDepth:.35,fireSliceSpacing:.1,fireMagnitude:1.4,fireBrightness:1.8,fireAnimated:!0,fireAnimSpeed:1,fireTintColor:"#ff8833",pos:[2,.1,-1.6],points:[[0,0,0],[-.1,.8,-1.5],[-.2,1.7,-3.2]]}),c({name:"Left Engine Smoke Trail",type:"Smoke",smokeType:"Particle",tension:.25,closed:!1,particleCount:500,particleSize:90,particleColor:"#1f1c1a",opacity:.35,flowSpeed:.25,springK:.008,damping:.965,turbulence:.35,turbulenceSpeed:.6,buoyancy:.12,rotSpeed:.15,fadeRate:.4,spawnSpread:.6,blendMode:"Normal",growth:2.5,fadeExponent:1.4,attractorStrength:0,attractorRadius:0,maxDrift:10,pos:[-4.6,1.6,-4.5],points:[[0,0,0],[.2,1.4,-2.5],[.6,3.6,-4.2],[1,6.5,-5.2],[1.3,10,-5.6]]}),c({name:"Right Engine Smoke Trail",type:"Smoke",smokeType:"Particle",tension:.25,closed:!1,particleCount:500,particleSize:90,particleColor:"#1f1c1a",opacity:.35,flowSpeed:.25,springK:.008,damping:.965,turbulence:.35,turbulenceSpeed:.6,buoyancy:.12,rotSpeed:.15,fadeRate:.4,spawnSpread:.6,blendMode:"Normal",growth:2.5,fadeExponent:1.4,attractorStrength:0,attractorRadius:0,maxDrift:10,pos:[4.6,1.6,-4.5],points:[[0,0,0],[-.2,1.4,-2.5],[-.6,3.6,-4.2],[-1,6.5,-5.2],[-1.3,10,-5.6]]})]},Me={Default:he,"Burning At Both Ends":Y,"Dumpster Fire":ee,"Flying High":ge,"Police Presence":te};export{Me as F,ve as a,we as b,Ae as c};
