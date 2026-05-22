import{m as n}from"./VolumetricFire-gAobbI0s.js";import{aD as F,j as o,t as h,m as T,r as i,b3 as V,o as C,M as d,B as R}from"./index-ByL4sTkr.js";import{s as w}from"./shaderMaterial-BPk7APAB.js";const W={splines:[n({name:"Top Wick Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:.8,fireHeight:2,fireDepth:.725,fireSliceSpacing:.05,fireMagnitude:.5,fireLacunarity:4,fireGain:0,fireTintColor:"#ffffff",fireSaturation:1,fireBrightness:1.5,fireAnimated:!0,fireAnimSpeed:.5,pos:[.06,3.21,.06],points:[[0,0,0],[.01,.31,0],[.02,.65,0],[.02,1.01,0]]}),n({name:"Bottom Wick Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:.8,fireHeight:2,fireDepth:.725,fireSliceSpacing:.05,fireMagnitude:.5,fireLacunarity:4,fireGain:0,fireTintColor:"#ffffff",fireSaturation:1,fireBrightness:1.5,fireAnimated:!0,fireAnimSpeed:.5,pos:[.06,-3.21,.06],points:[[0,0,0],[.01,-.31,0],[.02,-.65,0],[.02,-1.01,0]]}),n({name:"Top Wick Smoke",type:"Smoke",smokeType:"Volumetric",tension:.3,closed:!1,volParticleCount:8e3,volColor:"#b8b8b8",volOpacity:.01,volSize:1,volBlendMode:"Normal",volSpread:.35,volSpringK:1.2,volDamping:.06,volTurbulence:2,volTurbulenceSpeed:.25,volMaxDrift:2.4,flowSpeed:.04,fadeRate:4,pos:[.18,3.34,.088],points:[[0,0,0],[0,.75,0],[0,1.5,0],[0,2.25,0],[0,3,0]]}),n({name:"Bottom Wick Smoke",type:"Smoke",smokeType:"Volumetric",tension:.3,closed:!1,volParticleCount:8e3,volColor:"#b8b8b8",volOpacity:.01,volSize:1,volBlendMode:"Normal",volSpread:.35,volSpringK:1.2,volDamping:.06,volTurbulence:2,volTurbulenceSpeed:.25,volMaxDrift:2.4,flowSpeed:.04,fadeRate:4,pos:[.18,-3.34,.088],points:[[0,0,0],[0,-.75,0],[0,-1.5,0],[0,-2.25,0],[0,-3,0]]})]},k=`
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
    pos *= vec3(0.8, 2.0, 0.725);
    hValue = position.y;
    float posXZlen = length(position.xz);
    pos.y *= 1.0 + (cos((posXZlen + 0.25) * 3.1415926) * 0.25
           + noise(vec2(0.0, time)) * 0.125
           + noise(vec2(position.x + time, position.z + time)) * 0.5) * position.y;

    float signedNoiseX = noise(vec2(time * 2.0, (position.y - time) * 4.0)) * 2.0 - 1.0;
    float signedNoiseZ = noise(vec2((position.y - time) * 4.0, time * 2.0)) * 2.0 - 1.0;
    float bendEnvelope = pow(clamp(hValue, 0.0, 1.0), 1.2);
    float scoopCycle = sin(time * 0.48);
    float scoopCrossCycle = sin(time * 0.36 + 1.8);
    float driftX = sin(time * 0.72 + hValue * 6.2) * 0.012;
    float driftZ = cos(time * 0.58 + hValue * 5.1 + 1.2) * 0.01;

    pos.x += (scoopCycle * 0.05 + signedNoiseX * 0.016 + driftX) * bendEnvelope;
    pos.z += (scoopCrossCycle * 0.026 + signedNoiseZ * 0.014 + driftZ) * bendEnvelope;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`,A=`
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
    float heightMask = smoothstep(0.02, 0.16, hValue) * (1.0 - smoothstep(0.93, 1.02, hValue));
    float taperedWidth = mix(0.62, 0.12, smoothstep(0.02, 0.98, hValue));
    float edgeNoise = noise(vec2(center * 5.0 + time * 0.35, hValue * 6.5 - time * 1.8));
    float edgeMask = 1.0 - smoothstep(taperedWidth, taperedWidth + 0.18 + edgeNoise * 0.08, center);
    float alpha = heightMask * edgeMask;

    float blueBase = (1.0 - smoothstep(0.0, 0.12, hValue)) * smoothstep(0.18, 0.95, radialFalloff);
    float innerCore =
      smoothstep(0.08, 0.22, hValue) *
      (1.0 - smoothstep(0.34, 0.72, hValue)) *
      smoothstep(0.28, 0.98, radialFalloff);
    float warmBody =
      smoothstep(0.04, 0.34, hValue) *
      (1.0 - smoothstep(0.74, 1.0, hValue));
    float emberTip = smoothstep(0.78, 1.0, hValue) * smoothstep(0.08, 0.65, center);

    vec3 outerColor = mix(
      vec3(1.0, 0.36, 0.05),
      vec3(1.0, 0.78, 0.22),
      smoothstep(0.08, 0.58, hValue)
    );

    vec3 color = outerColor;
    color += vec3(0.08, 0.18, 1.0) * blueBase * 0.95;
    color = mix(color, vec3(1.0, 0.98, 0.93), innerCore);
    color += vec3(1.0, 0.54, 0.1) * warmBody * radialFalloff * 0.18;
    color = mix(color, vec3(0.92, 0.28, 0.04), emberTip * 0.35);

    float shimmer = 0.92 + noise(vec2(vUv.x * 7.0 - time * 0.9, hValue * 5.5 + time * 0.6)) * 0.16;
    color *= shimmer;
    alpha *= 0.92 + innerCore * 0.08;

    gl_FragColor = vec4(color, alpha);
  }
`,B=w({time:0},k,A);T({FlameMaterialImpl:B});const v=F.forwardRef(function({side:s=h},c){return o.jsx("flameMaterialImpl",{ref:c,transparent:!0,side:s,depthWrite:!1,toneMapped:!1})}),j={baseSpeed:1.15,minSpeed:.28,slowFreq:.7,slowAmp:.55,fastFreq:2.6,fastAmp:.25,microFreq:5.7,microAmp:.08,swayX:.015,swayZ:.014,pulseFreq:3.4,pulseAmp:.04,scaleX:1,scaleY:1};function D({position:p=[0,0,0],inverted:s=!1,motion:c,phaseOffset:y=0}){const e={...j,...c},t=i.useRef(),f=i.useRef(),m=i.useRef(),r=i.useRef(0),u=i.useMemo(()=>{const l=new V(.5,32,32);return l.translate(0,.5,0),l},[]);return C(({clock:l},g)=>{const a=l.getElapsedTime()+y,x=e.baseSpeed+Math.sin(a*e.slowFreq)*e.slowAmp+Math.sin(a*e.fastFreq+1.4)*e.fastAmp+Math.sin(a*e.microFreq)*e.microAmp;if(r.current+=g*Math.max(e.minSpeed,x),f.current&&(f.current.time=r.current),m.current&&(m.current.time=r.current),t.current){const M=Math.sin(a*3.2)*e.swayX,S=Math.cos(a*2.4+.8)*e.swayZ;t.current.rotation.x=(s?Math.PI:0)+M,t.current.rotation.z=S;const b=1+Math.sin(r.current*e.pulseFreq)*e.pulseAmp;t.current.scale.set(e.scaleX,b*e.scaleY,e.scaleX)}}),o.jsxs("group",{ref:t,position:p,rotation:s?[Math.PI,0,0]:[0,0,0],children:[o.jsxs("mesh",{"rotation-y":d.degToRad(-45),children:[o.jsx("primitive",{object:u,attach:"geometry"}),o.jsx(v,{ref:f,side:h})]}),o.jsxs("mesh",{"rotation-y":d.degToRad(-45),children:[o.jsx("primitive",{object:u,attach:"geometry"}),o.jsx(v,{ref:m,side:R})]})]})}export{W as B,D as F};
