import{m as R}from"./VolumetricFire-Db_ZpgQT.js";import{aC as ae,j as m,t as j,m as re,r as p,b3 as W,o as U,M as X,B as I,aS as ie,n as le}from"./index-Ccd5CS82.js";import{s as ne}from"./shaderMaterial-BZX0FMCf.js";import{u as me,b as ce,Z as ue,j as y,Y as Z,v as c,f as v,X as fe,q as de,P as N,x as pe,s as l,i as T,F as G,S as he,w as L,_ as ve}from"./three.tsl-CWjF3kga.js";const Re={splines:[R({name:"Top Wick Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:.8,fireHeight:2,fireDepth:.725,fireSliceSpacing:.05,fireMagnitude:.5,fireLacunarity:4,fireGain:0,fireTintColor:"#ffffff",fireSaturation:1,fireBrightness:1.5,fireAnimated:!0,fireAnimSpeed:.5,pos:[.06,3.21,.06],points:[[0,0,0],[.01,.31,0],[.02,.65,0],[.02,1.01,0]]}),R({name:"Bottom Wick Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:.8,fireHeight:2,fireDepth:.725,fireSliceSpacing:.05,fireMagnitude:.5,fireLacunarity:4,fireGain:0,fireTintColor:"#ffffff",fireSaturation:1,fireBrightness:1.5,fireAnimated:!0,fireAnimSpeed:.5,pos:[.06,-3.21,.06],points:[[0,0,0],[.01,-.31,0],[.02,-.65,0],[.02,-1.01,0]]}),R({name:"Top Wick Smoke",type:"Smoke",smokeType:"Volumetric",tension:.3,closed:!1,volParticleCount:8e3,volColor:"#b8b8b8",volOpacity:.01,volSize:1,volBlendMode:"Normal",volSpread:.35,volSpringK:1.2,volDamping:.06,volTurbulence:2,volTurbulenceSpeed:.25,volMaxDrift:2.4,flowSpeed:.04,fadeRate:4,pos:[.18,3.34,.088],points:[[0,0,0],[0,.75,0],[0,1.5,0],[0,2.25,0],[0,3,0]]}),R({name:"Bottom Wick Smoke",type:"Smoke",smokeType:"Volumetric",tension:.3,closed:!1,volParticleCount:8e3,volColor:"#b8b8b8",volOpacity:.01,volSize:1,volBlendMode:"Normal",volSpread:.35,volSpringK:1.2,volDamping:.06,volTurbulence:2,volTurbulenceSpeed:.25,volMaxDrift:2.4,flowSpeed:.04,fadeRate:4,pos:[.18,-3.34,.088],points:[[0,0,0],[0,-.75,0],[0,-1.5,0],[0,-2.25,0],[0,-3,0]]})]},ye=`
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
`,be=`
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
`,Me=ne({time:0},ye,be);re({FlameMaterialImpl:Me});const P=ae.forwardRef(function({side:o=j},t){return m.jsx("flameMaterialImpl",{ref:t,transparent:!0,side:o,depthWrite:!1,toneMapped:!1})}),ge={baseSpeed:1.15,minSpeed:.28,slowFreq:.7,slowAmp:.55,fastFreq:2.6,fastAmp:.25,microFreq:5.7,microAmp:.08,swayX:.015,swayZ:.014,pulseFreq:3.4,pulseAmp:.04,scaleX:1,scaleY:1};function xe({position:n=[0,0,0],inverted:o=!1,motion:t,phaseOffset:u=0}){const e={...ge,...t},s=p.useRef(),r=p.useRef(),d=p.useRef(),a=p.useRef(0),b=p.useMemo(()=>{const f=new W(.5,32,32);return f.translate(0,.5,0),f},[]);return U(({clock:f},g)=>{const i=f.getElapsedTime()+u,x=e.baseSpeed+Math.sin(i*e.slowFreq)*e.slowAmp+Math.sin(i*e.fastFreq+1.4)*e.fastAmp+Math.sin(i*e.microFreq)*e.microAmp;if(a.current+=g*Math.max(e.minSpeed,x),r.current&&(r.current.time=a.current),d.current&&(d.current.time=a.current),s.current){const F=Math.sin(i*3.2)*e.swayX,S=Math.cos(i*2.4+.8)*e.swayZ;s.current.rotation.x=(o?Math.PI:0)+F,s.current.rotation.z=S;const w=1+Math.sin(a.current*e.pulseFreq)*e.pulseAmp;s.current.scale.set(e.scaleX,w*e.scaleY,e.scaleX)}}),m.jsxs("group",{ref:s,position:n,rotation:o?[Math.PI,0,0]:[0,0,0],children:[m.jsxs("mesh",{"rotation-y":X.degToRad(-45),children:[m.jsx("primitive",{object:b,attach:"geometry"}),m.jsx(P,{ref:r,side:j})]}),m.jsxs("mesh",{"rotation-y":X.degToRad(-45),children:[m.jsx("primitive",{object:b,attach:"geometry"}),m.jsx(P,{ref:d,side:I})]})]})}const Fe={baseSpeed:1.15,minSpeed:.28,slowFreq:.7,slowAmp:.55,fastFreq:2.6,fastAmp:.25,microFreq:5.7,microAmp:.08,swayX:.015,swayZ:.014,pulseFreq:3.4,pulseAmp:.04,scaleX:1,scaleY:1},A=G(([n])=>{const o=c(n).toVar();return L(N(ve(o,c(12.9898,78.233))).mul(43758.5453123))}).setLayout({name:"flameRandom2",type:"float",inputs:[{name:"stInput",type:"vec2"}]}),M=G(([n])=>{const o=c(n).toVar(),t=he(o).toVar(),u=L(o).toVar(),e=A(t).toVar(),s=A(t.add(c(1,0))).toVar(),r=A(t.add(c(0,1))).toVar(),d=A(t.add(c(1,1))).toVar(),a=u.mul(u).mul(c(3,3).sub(u.mul(2))).toVar();return T(e,s,a.x).add(r.sub(e).mul(a.y).mul(v(1).sub(a.x))).add(d.sub(s).mul(a.x).mul(a.y))}).setLayout({name:"flameNoise2",type:"float",inputs:[{name:"stInput",type:"vec2"}]});function E(n){const o={time:me(0)},t=ue,u=ce(),e=t.y,s=y(.8,2,.725),r=t.mul(s),d=t.xz.length(),a=Z(d.add(.25).mul(Math.PI)).mul(.25).add(M(c(0,o.time)).mul(.125)).add(M(c(t.x.add(o.time),t.z.add(o.time))).mul(.5)),b=r.y.mul(v(1).add(a.mul(t.y))),f=M(c(o.time.mul(2),t.y.sub(o.time).mul(4))).mul(2).sub(1),g=M(c(t.y.sub(o.time).mul(4),o.time.mul(2))).mul(2).sub(1),i=fe(de(e,0,1),1.2),x=N(o.time.mul(.48)),F=N(o.time.mul(.36).add(1.8)),S=N(o.time.mul(.72).add(e.mul(6.2))).mul(.012),w=Z(o.time.mul(.58).add(e.mul(5.1)).add(1.2)).mul(.01),_=r.x.add(x.mul(.05).add(f.mul(.016)).add(S).mul(i)),z=r.z.add(F.mul(.026).add(g.mul(.014)).add(w).mul(i)),C=pe(u.x.sub(.5)).mul(2),k=v(1).sub(C),D=l(.02,.16,e).mul(v(1).sub(l(.93,1.02,e))),B=T(.62,.12,l(.02,.98,e)),O=M(c(C.mul(5).add(o.time.mul(.35)),e.mul(6.5).sub(o.time.mul(1.8)))),Y=v(1).sub(l(B,B.add(.18).add(O.mul(.08)),C)),H=D.mul(Y),K=v(1).sub(l(0,.12,e)).mul(l(.18,.95,k)),q=l(.08,.22,e).mul(v(1).sub(l(.34,.72,e))).mul(l(.28,.98,k)),$=l(.04,.34,e).mul(v(1).sub(l(.74,1,e))),J=l(.78,1,e).mul(l(.08,.65,C)),Q=T(y(1,.36,.05),y(1,.78,.22),l(.08,.58,e)),ee=y(.08,.18,1).mul(K).mul(.95),oe=y(1,.54,.1).mul($).mul(k).mul(.18),te=M(c(u.x.mul(7).sub(o.time.mul(.9)),e.mul(5.5).add(o.time.mul(.6)))).mul(.16).add(.92);let h=Q.add(ee);h=T(h,y(1,.98,.93),q),h=h.add(oe),h=T(h,y(.92,.28,.04),J.mul(.35)),h=h.mul(te);const se=H.mul(v(.92).add(q.mul(.08))),V=new ie({transparent:!0,depthWrite:!1,toneMapped:!1,side:n});return V.positionNode=y(_,b,z),V.colorNode=h,V.opacityNode=se,V.uniforms=o,V}function Se({position:n=[0,0,0],inverted:o=!1,motion:t,phaseOffset:u=0}){const e={...Fe,...t},s=p.useRef(),r=p.useRef(0),d=p.useMemo(()=>{const f=new W(.5,32,32);return f.translate(0,.5,0),f},[]),a=p.useMemo(()=>E(j),[]),b=p.useMemo(()=>E(I),[]);return U(({clock:f},g)=>{const i=f.getElapsedTime()+u,x=e.baseSpeed+Math.sin(i*e.slowFreq)*e.slowAmp+Math.sin(i*e.fastFreq+1.4)*e.fastAmp+Math.sin(i*e.microFreq)*e.microAmp;if(r.current+=g*Math.max(e.minSpeed,x),a.uniforms.time.value=r.current,b.uniforms.time.value=r.current,s.current){const F=Math.sin(i*3.2)*e.swayX,S=Math.cos(i*2.4+.8)*e.swayZ;s.current.rotation.x=(o?Math.PI:0)+F,s.current.rotation.z=S;const w=1+Math.sin(r.current*e.pulseFreq)*e.pulseAmp;s.current.scale.set(e.scaleX,w*e.scaleY,e.scaleX)}}),m.jsxs("group",{ref:s,position:n,rotation:o?[Math.PI,0,0]:[0,0,0],children:[m.jsx("mesh",{"rotation-y":X.degToRad(-45),geometry:d,material:a}),m.jsx("mesh",{"rotation-y":X.degToRad(-45),geometry:d,material:b})]})}function Ae(n){return le(u=>u.gl)?.isWebGPURenderer===!0?m.jsx(Se,{...n}):m.jsx(xe,{...n})}export{Re as B,Ae as F};
