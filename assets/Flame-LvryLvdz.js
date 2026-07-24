import{m as V}from"./splineDefaults-CKtzuXw9.js";import{aT as ve,j as S,Y as H,aq as z,o as $e,r as g,n as D,X as Y,aJ as Ce,bh as we,aW as Me,m as xe}from"./index-CRhP28aw.js";import{s as Ae}from"./shaderMaterial-DWlJ9arw.js";import{u as Ee,k as Ne,aA as Te,a as v,T as G,v as b,f as F,N as Be,d as Re,S as Z,A as Xe,s as f,m as R,F as K,ab as Ve,g as J,az as qe}from"./three.tsl-DWuWk0ah.js";const Ue={splines:[V({name:"Top Wick Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:.8,fireHeight:2,fireDepth:.725,fireSliceSpacing:.05,fireMagnitude:.5,fireLacunarity:4,fireGain:0,fireTintColor:"#ffffff",fireSaturation:1,fireBrightness:1.5,fireAnimated:!0,fireAnimSpeed:.5,pos:[.06,3.21,.06],points:[[0,0,0],[.01,.31,0],[.02,.65,0],[.02,1.01,0]]}),V({name:"Bottom Wick Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:.8,fireHeight:2,fireDepth:.725,fireSliceSpacing:.05,fireMagnitude:.5,fireLacunarity:4,fireGain:0,fireTintColor:"#ffffff",fireSaturation:1,fireBrightness:1.5,fireAnimated:!0,fireAnimSpeed:.5,pos:[.06,-3.21,.06],points:[[0,0,0],[.01,-.31,0],[.02,-.65,0],[.02,-1.01,0]]}),V({name:"Top Wick Smoke",type:"Smoke",smokeType:"Volumetric",tension:.3,closed:!1,volParticleCount:8e3,volColor:"#b8b8b8",volOpacity:.01,volSize:1,volBlendMode:"Normal",volSpread:.35,volSpringK:1.2,volDamping:.06,volTurbulence:2,volTurbulenceSpeed:.25,volMaxDrift:2.4,flowSpeed:.04,fadeRate:4,pos:[.18,3.34,.088],points:[[0,0,0],[0,.75,0],[0,1.5,0],[0,2.25,0],[0,3,0]]}),V({name:"Bottom Wick Smoke",type:"Smoke",smokeType:"Volumetric",tension:.3,closed:!1,volParticleCount:8e3,volColor:"#b8b8b8",volOpacity:.01,volSize:1,volBlendMode:"Normal",volSpread:.35,volSpringK:1.2,volDamping:.06,volTurbulence:2,volTurbulenceSpeed:.25,volMaxDrift:2.4,flowSpeed:.04,fadeRate:4,pos:[.18,-3.34,.088],points:[[0,0,0],[0,-.75,0],[0,-1.5,0],[0,-2.25,0],[0,-3,0]]})]},Q={baseSpeed:1.15,minSpeed:.28,slowFreq:.7,slowAmp:.55,fastFreq:2.6,fastAmp:.25,microFreq:5.7,microAmp:.08,swayX:.015,swayZ:.014,pulseFreq:3.4,pulseAmp:.04,scaleX:1,scaleY:1},k=-Math.PI/4,ee={baseScale:[.8,2,.725],vertical:{cosOffset:.25,cosAmp:.25,staticNoiseAmp:.125,flowNoiseAmp:.5,pi:3.1415926},bend:{timeScale:2,heightScale:4,power:1.2,scoopFreq:.48,scoopAmp:.05,scoopCrossFreq:.36,scoopCrossPhase:1.8,scoopCrossAmp:.026,driftXFreq:.72,driftXHeightFreq:6.2,driftXAmp:.012,driftZFreq:.58,driftZHeightFreq:5.1,driftZPhase:1.2,driftZAmp:.01,signedNoiseXAmp:.016,signedNoiseZAmp:.014},alpha:{heightStart:.02,heightPeak:.16,tipFadeStart:.93,tipFadeEnd:1.02,widthBase:.62,widthTip:.12,widthTaperStart:.02,widthTaperEnd:.98,edgeNoiseXScale:5,edgeNoiseTimeScale:.35,edgeNoiseYScale:6.5,edgeNoiseTimeSpeed:1.8,edgeSoftness:.18,edgeNoiseAmp:.08},color:{blueBaseFadeStart:0,blueBaseFadeEnd:.12,blueBaseRadialStart:.18,blueBaseRadialEnd:.95,innerCoreHeightStart:.08,innerCoreHeightPeak:.22,innerCoreFadeStart:.34,innerCoreFadeEnd:.72,innerCoreRadialStart:.28,innerCoreRadialEnd:.98,warmBodyStart:.04,warmBodyEnd:.34,warmBodyFadeStart:.74,warmBodyFadeEnd:1,emberTipStart:.78,emberTipEnd:1,emberCenterStart:.08,emberCenterEnd:.65,outerLow:[1,.36,.05],outerHigh:[1,.78,.22],outerMixStart:.08,outerMixEnd:.58,blue:[.08,.18,1],blueScale:.95,core:[1,.98,.93],warm:[1,.54,.1],warmScale:.18,ember:[.92,.28,.04],emberMix:.35},shimmer:{xScale:7,timeScale:.9,yScale:5.5,timeSpeed:.6,base:.92,amp:.16},opacity:{base:.92,innerCoreBoost:.08}};function te(o){const t=new o.SphereGeometry(.5,32,32);return t.translate(0,.5,0),t}const Ze=o=>Number.isInteger(o)?`${o}.0`:`${o}`,j=o=>typeof o=="number"?Ze(o):Array.isArray(o)?o.map(t=>j(t)):o&&typeof o=="object"?Object.fromEntries(Object.entries(o).map(([t,c])=>[t,j(c)])):o,$=o=>`vec3(${o.join(", ")})`,{alpha:h,baseScale:ke,bend:n,color:s,opacity:I,shimmer:w,vertical:B}=j(ee),Pe=`
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
    pos *= ${$(ke)};
    hValue = position.y;
    float posXZlen = length(position.xz);
    pos.y *= 1.0 + (cos((posXZlen + ${B.cosOffset}) * ${B.pi}) * ${B.cosAmp}
           + noise(vec2(0.0, time)) * ${B.staticNoiseAmp}
           + noise(vec2(position.x + time, position.z + time)) * ${B.flowNoiseAmp}) * position.y;

    float signedNoiseX = noise(vec2(time * ${n.timeScale}, (position.y - time) * ${n.heightScale})) * 2.0 - 1.0;
    float signedNoiseZ = noise(vec2((position.y - time) * ${n.heightScale}, time * ${n.timeScale})) * 2.0 - 1.0;
    float bendEnvelope = pow(clamp(hValue, 0.0, 1.0), ${n.power});
    float scoopCycle = sin(time * ${n.scoopFreq});
    float scoopCrossCycle = sin(time * ${n.scoopCrossFreq} + ${n.scoopCrossPhase});
    float driftX = sin(time * ${n.driftXFreq} + hValue * ${n.driftXHeightFreq}) * ${n.driftXAmp};
    float driftZ = cos(time * ${n.driftZFreq} + hValue * ${n.driftZHeightFreq} + ${n.driftZPhase}) * ${n.driftZAmp};

    pos.x += (scoopCycle * ${n.scoopAmp} + signedNoiseX * ${n.signedNoiseXAmp} + driftX) * bendEnvelope;
    pos.z += (scoopCrossCycle * ${n.scoopCrossAmp} + signedNoiseZ * ${n.signedNoiseZAmp} + driftZ) * bendEnvelope;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`,je=`
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
    float heightMask = smoothstep(${h.heightStart}, ${h.heightPeak}, hValue) * (1.0 - smoothstep(${h.tipFadeStart}, ${h.tipFadeEnd}, hValue));
    float taperedWidth = mix(${h.widthBase}, ${h.widthTip}, smoothstep(${h.widthTaperStart}, ${h.widthTaperEnd}, hValue));
    float edgeNoise = noise(vec2(center * ${h.edgeNoiseXScale} + time * ${h.edgeNoiseTimeScale}, hValue * ${h.edgeNoiseYScale} - time * ${h.edgeNoiseTimeSpeed}));
    float edgeMask = 1.0 - smoothstep(taperedWidth, taperedWidth + ${h.edgeSoftness} + edgeNoise * ${h.edgeNoiseAmp}, center);
    float alpha = heightMask * edgeMask;

    float blueBase = (1.0 - smoothstep(${s.blueBaseFadeStart}, ${s.blueBaseFadeEnd}, hValue)) * smoothstep(${s.blueBaseRadialStart}, ${s.blueBaseRadialEnd}, radialFalloff);
    float innerCore =
      smoothstep(${s.innerCoreHeightStart}, ${s.innerCoreHeightPeak}, hValue) *
      (1.0 - smoothstep(${s.innerCoreFadeStart}, ${s.innerCoreFadeEnd}, hValue)) *
      smoothstep(${s.innerCoreRadialStart}, ${s.innerCoreRadialEnd}, radialFalloff);
    float warmBody =
      smoothstep(${s.warmBodyStart}, ${s.warmBodyEnd}, hValue) *
      (1.0 - smoothstep(${s.warmBodyFadeStart}, ${s.warmBodyFadeEnd}, hValue));
    float emberTip = smoothstep(${s.emberTipStart}, ${s.emberTipEnd}, hValue) * smoothstep(${s.emberCenterStart}, ${s.emberCenterEnd}, center);

    vec3 outerColor = mix(
      ${$(s.outerLow)},
      ${$(s.outerHigh)},
      smoothstep(${s.outerMixStart}, ${s.outerMixEnd}, hValue)
    );

    vec3 color = outerColor;
    color += ${$(s.blue)} * blueBase * ${s.blueScale};
    color = mix(color, ${$(s.core)}, innerCore);
    color += ${$(s.warm)} * warmBody * radialFalloff * ${s.warmScale};
    color = mix(color, ${$(s.ember)}, emberTip * ${s.emberMix});

    float shimmer = ${w.base} + noise(vec2(vUv.x * ${w.xScale} - time * ${w.timeScale}, hValue * ${w.yScale} + time * ${w.timeSpeed})) * ${w.amp};
    color *= shimmer;
    alpha *= ${I.base} + innerCore * ${I.innerCoreBoost};

    gl_FragColor = vec4(color, alpha);
  }
`,He=Ae({time:0},Pe,je);$e({FlameMaterialImpl:He});const O=ve.forwardRef(function({side:t=H},c){return S.jsx("flameMaterialImpl",{ref:c,transparent:!0,blending:z,side:t,depthWrite:!1,toneMapped:!1})});function Le({position:o=[0,0,0],inverted:t=!1,motion:c,phaseOffset:r=0}){const e={...Q,...c},l=g.useRef(),m=g.useRef(),p=g.useRef(),a=g.useRef(0),u=g.useMemo(()=>te(Ce),[]);return D(({clock:C},i)=>{const d=C.getElapsedTime()+r,x=e.baseSpeed+Math.sin(d*e.slowFreq)*e.slowAmp+Math.sin(d*e.fastFreq+1.4)*e.fastAmp+Math.sin(d*e.microFreq)*e.microAmp;if(a.current+=i*Math.max(e.minSpeed,x),m.current&&(m.current.time=a.current),p.current&&(p.current.time=a.current),l.current){const A=Math.sin(d*3.2)*e.swayX,E=Math.cos(d*2.4+.8)*e.swayZ;l.current.rotation.x=(t?Math.PI:0)+A,l.current.rotation.z=E;const N=1+Math.sin(a.current*e.pulseFreq)*e.pulseAmp;l.current.scale.set(e.scaleX,N*e.scaleY,e.scaleX)}}),S.jsxs("group",{ref:l,position:o,rotation:t?[Math.PI,0,0]:[0,0,0],children:[S.jsxs("mesh",{"rotation-y":k,children:[S.jsx("primitive",{object:u,attach:"geometry"}),S.jsx(O,{ref:m,side:H})]}),S.jsxs("mesh",{"rotation-y":k,children:[S.jsx("primitive",{object:u,attach:"geometry"}),S.jsx(O,{ref:p,side:Y})]})]})}const q=K(([o])=>{const t=b(o).toVar();return J(Z(qe(t,b(12.9898,78.233))).mul(43758.5453123))}).setLayout({name:"flameRandom2",type:"float",inputs:[{name:"stInput",type:"vec2"}]}),M=K(([o])=>{const t=b(o).toVar(),c=Ve(t).toVar(),r=J(t).toVar(),e=q(c).toVar(),l=q(c.add(b(1,0))).toVar(),m=q(c.add(b(0,1))).toVar(),p=q(c.add(b(1,1))).toVar(),a=r.mul(r).mul(b(3,3).sub(r.mul(2))).toVar();return R(e,l,a.x).add(m.sub(e).mul(a.y).mul(F(1).sub(a.x))).add(p.sub(l).mul(a.x).mul(a.y))}).setLayout({name:"flameNoise2",type:"float",inputs:[{name:"stInput",type:"vec2"}]});function U(o){const{alpha:t,baseScale:c,bend:r,color:e,opacity:l,shimmer:m,vertical:p}=ee,a={time:Ee(0)},u=Te,C=Ne().toVarying("vFlameUv"),i=u.y.toVarying("vFlameHeight"),d=u.mul(v(...c)),x=u.xz.length(),A=G(x.add(p.cosOffset).mul(p.pi)).mul(p.cosAmp).add(M(b(0,a.time)).mul(p.staticNoiseAmp)).add(M(b(u.x.add(a.time),u.z.add(a.time))).mul(p.flowNoiseAmp)),E=d.y.mul(F(1).add(A.mul(u.y))),N=M(b(a.time.mul(r.timeScale),u.y.sub(a.time).mul(r.heightScale))).mul(2).sub(1),oe=M(b(u.y.sub(a.time).mul(r.heightScale),a.time.mul(r.timeScale))).mul(2).sub(1),L=Be(Re(i,0,1),r.power),ae=Z(a.time.mul(r.scoopFreq)),re=Z(a.time.mul(r.scoopCrossFreq).add(r.scoopCrossPhase)),se=Z(a.time.mul(r.driftXFreq).add(i.mul(r.driftXHeightFreq))).mul(r.driftXAmp),ie=G(a.time.mul(r.driftZFreq).add(i.mul(r.driftZHeightFreq)).add(r.driftZPhase)).mul(r.driftZAmp),ne=d.x.add(ae.mul(r.scoopAmp).add(N.mul(r.signedNoiseXAmp)).add(se).mul(L)),le=d.z.add(re.mul(r.scoopCrossAmp).add(oe.mul(r.signedNoiseZAmp)).add(ie).mul(L)),X=Xe(C.x.sub(.5)).mul(2),P=F(1).sub(X),me=f(t.heightStart,t.heightPeak,i).mul(F(1).sub(f(t.tipFadeStart,t.tipFadeEnd,i))),W=R(t.widthBase,t.widthTip,f(t.widthTaperStart,t.widthTaperEnd,i)),ce=M(b(X.mul(t.edgeNoiseXScale).add(a.time.mul(t.edgeNoiseTimeScale)),i.mul(t.edgeNoiseYScale).sub(a.time.mul(t.edgeNoiseTimeSpeed)))),de=F(1).sub(f(W,W.add(t.edgeSoftness).add(ce.mul(t.edgeNoiseAmp)),X)),pe=me.mul(de),ue=F(1).sub(f(e.blueBaseFadeStart,e.blueBaseFadeEnd,i)).mul(f(e.blueBaseRadialStart,e.blueBaseRadialEnd,P)),_=f(e.innerCoreHeightStart,e.innerCoreHeightPeak,i).mul(F(1).sub(f(e.innerCoreFadeStart,e.innerCoreFadeEnd,i))).mul(f(e.innerCoreRadialStart,e.innerCoreRadialEnd,P)),fe=f(e.warmBodyStart,e.warmBodyEnd,i).mul(F(1).sub(f(e.warmBodyFadeStart,e.warmBodyFadeEnd,i))),he=f(e.emberTipStart,e.emberTipEnd,i).mul(f(e.emberCenterStart,e.emberCenterEnd,X)),Se=R(v(...e.outerLow),v(...e.outerHigh),f(e.outerMixStart,e.outerMixEnd,i)),be=v(...e.blue).mul(ue).mul(e.blueScale),ge=v(...e.warm).mul(fe).mul(P).mul(e.warmScale),ye=M(b(C.x.mul(m.xScale).sub(a.time.mul(m.timeScale)),i.mul(m.yScale).add(a.time.mul(m.timeSpeed)))).mul(m.amp).add(m.base);let y=Se.add(be);y=R(y,v(...e.core),_),y=y.add(ge),y=R(y,v(...e.ember),he.mul(e.emberMix)),y=y.mul(ye);const Fe=pe.mul(F(l.base).add(_.mul(l.innerCoreBoost))),T=new we({transparent:!0,depthWrite:!1,toneMapped:!1,blending:z,side:o});return T.positionNode=v(ne,E,le),T.colorNode=y,T.opacityNode=Fe,T.uniforms=a,T}function We({position:o=[0,0,0],inverted:t=!1,motion:c,phaseOffset:r=0}){const e={...Q,...c},l=g.useRef(),m=g.useRef(0),p=g.useMemo(()=>te(Me),[]),a=g.useMemo(()=>U(H),[]),u=g.useMemo(()=>U(Y),[]);return D(({clock:C},i)=>{const d=C.getElapsedTime()+r,x=e.baseSpeed+Math.sin(d*e.slowFreq)*e.slowAmp+Math.sin(d*e.fastFreq+1.4)*e.fastAmp+Math.sin(d*e.microFreq)*e.microAmp;if(m.current+=i*Math.max(e.minSpeed,x),a.uniforms.time.value=m.current,u.uniforms.time.value=m.current,l.current){const A=Math.sin(d*3.2)*e.swayX,E=Math.cos(d*2.4+.8)*e.swayZ;l.current.rotation.x=(t?Math.PI:0)+A,l.current.rotation.z=E;const N=1+Math.sin(m.current*e.pulseFreq)*e.pulseAmp;l.current.scale.set(e.scaleX,N*e.scaleY,e.scaleX)}}),S.jsxs("group",{ref:l,position:o,rotation:t?[Math.PI,0,0]:[0,0,0],children:[S.jsx("mesh",{"rotation-y":k,geometry:p,material:a}),S.jsx("mesh",{"rotation-y":k,geometry:p,material:u})]})}function ze(o){return xe(r=>r.gl)?.isWebGPURenderer===!0?S.jsx(We,{...o}):S.jsx(Le,{...o})}export{Ue as B,ze as F};
