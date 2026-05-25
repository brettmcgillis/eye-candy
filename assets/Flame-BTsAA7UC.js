import{m as V}from"./splineDefaults-Bd3ifPLi.js";import{aC as ve,j as S,t as H,$ as O,m as Fe,r as g,o as z,B as D,af as $e,aS as Ce,aD as we,n as xe}from"./index-DBD_Xnl5.js";import{s as Me}from"./shaderMaterial-ByNLeYVs.js";import{u as Ae,b as Ee,Z as Ne,j as F,Y as _,v as b,f as v,X as Te,q as Be,P as Z,x as Re,s as u,i as R,F as Y,S as Xe,w as K,_ as Ve}from"./three.tsl-CE3109Li.js";const Ie={splines:[V({name:"Top Wick Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:.8,fireHeight:2,fireDepth:.725,fireSliceSpacing:.05,fireMagnitude:.5,fireLacunarity:4,fireGain:0,fireTintColor:"#ffffff",fireSaturation:1,fireBrightness:1.5,fireAnimated:!0,fireAnimSpeed:.5,pos:[.06,3.21,.06],points:[[0,0,0],[.01,.31,0],[.02,.65,0],[.02,1.01,0]]}),V({name:"Bottom Wick Fire",type:"Fire",fireType:"Classic",tension:.5,closed:!1,fireWidth:.8,fireHeight:2,fireDepth:.725,fireSliceSpacing:.05,fireMagnitude:.5,fireLacunarity:4,fireGain:0,fireTintColor:"#ffffff",fireSaturation:1,fireBrightness:1.5,fireAnimated:!0,fireAnimSpeed:.5,pos:[.06,-3.21,.06],points:[[0,0,0],[.01,-.31,0],[.02,-.65,0],[.02,-1.01,0]]}),V({name:"Top Wick Smoke",type:"Smoke",smokeType:"Volumetric",tension:.3,closed:!1,volParticleCount:8e3,volColor:"#b8b8b8",volOpacity:.01,volSize:1,volBlendMode:"Normal",volSpread:.35,volSpringK:1.2,volDamping:.06,volTurbulence:2,volTurbulenceSpeed:.25,volMaxDrift:2.4,flowSpeed:.04,fadeRate:4,pos:[.18,3.34,.088],points:[[0,0,0],[0,.75,0],[0,1.5,0],[0,2.25,0],[0,3,0]]}),V({name:"Bottom Wick Smoke",type:"Smoke",smokeType:"Volumetric",tension:.3,closed:!1,volParticleCount:8e3,volColor:"#b8b8b8",volOpacity:.01,volSize:1,volBlendMode:"Normal",volSpread:.35,volSpringK:1.2,volDamping:.06,volTurbulence:2,volTurbulenceSpeed:.25,volMaxDrift:2.4,flowSpeed:.04,fadeRate:4,pos:[.18,-3.34,.088],points:[[0,0,0],[0,-.75,0],[0,-1.5,0],[0,-2.25,0],[0,-3,0]]})]},J={baseSpeed:1.15,minSpeed:.28,slowFreq:.7,slowAmp:.55,fastFreq:2.6,fastAmp:.25,microFreq:5.7,microAmp:.08,swayX:.015,swayZ:.014,pulseFreq:3.4,pulseAmp:.04,scaleX:1,scaleY:1},P=-Math.PI/4,Q={baseScale:[.8,2,.725],vertical:{cosOffset:.25,cosAmp:.25,staticNoiseAmp:.125,flowNoiseAmp:.5,pi:3.1415926},bend:{timeScale:2,heightScale:4,power:1.2,scoopFreq:.48,scoopAmp:.05,scoopCrossFreq:.36,scoopCrossPhase:1.8,scoopCrossAmp:.026,driftXFreq:.72,driftXHeightFreq:6.2,driftXAmp:.012,driftZFreq:.58,driftZHeightFreq:5.1,driftZPhase:1.2,driftZAmp:.01,signedNoiseXAmp:.016,signedNoiseZAmp:.014},alpha:{heightStart:.02,heightPeak:.16,tipFadeStart:.93,tipFadeEnd:1.02,widthBase:.62,widthTip:.12,widthTaperStart:.02,widthTaperEnd:.98,edgeNoiseXScale:5,edgeNoiseTimeScale:.35,edgeNoiseYScale:6.5,edgeNoiseTimeSpeed:1.8,edgeSoftness:.18,edgeNoiseAmp:.08},color:{blueBaseFadeStart:0,blueBaseFadeEnd:.12,blueBaseRadialStart:.18,blueBaseRadialEnd:.95,innerCoreHeightStart:.08,innerCoreHeightPeak:.22,innerCoreFadeStart:.34,innerCoreFadeEnd:.72,innerCoreRadialStart:.28,innerCoreRadialEnd:.98,warmBodyStart:.04,warmBodyEnd:.34,warmBodyFadeStart:.74,warmBodyFadeEnd:1,emberTipStart:.78,emberTipEnd:1,emberCenterStart:.08,emberCenterEnd:.65,outerLow:[1,.36,.05],outerHigh:[1,.78,.22],outerMixStart:.08,outerMixEnd:.58,blue:[.08,.18,1],blueScale:.95,core:[1,.98,.93],warm:[1,.54,.1],warmScale:.18,ember:[.92,.28,.04],emberMix:.35},shimmer:{xScale:7,timeScale:.9,yScale:5.5,timeSpeed:.6,base:.92,amp:.16},opacity:{base:.92,innerCoreBoost:.08}};function ee(n){const t=new n.SphereGeometry(.5,32,32);return t.translate(0,.5,0),t}const $=n=>`vec3(${n.join(", ")})`,{alpha:f,baseScale:qe,bend:i,color:s,opacity:G,shimmer:w,vertical:B}=Q,Ze=`
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
    pos *= ${$(qe)};
    hValue = position.y;
    float posXZlen = length(position.xz);
    pos.y *= 1.0 + (cos((posXZlen + ${B.cosOffset}) * ${B.pi}) * ${B.cosAmp}
           + noise(vec2(0.0, time)) * ${B.staticNoiseAmp}
           + noise(vec2(position.x + time, position.z + time)) * ${B.flowNoiseAmp}) * position.y;

    float signedNoiseX = noise(vec2(time * ${i.timeScale}, (position.y - time) * ${i.heightScale})) * 2.0 - 1.0;
    float signedNoiseZ = noise(vec2((position.y - time) * ${i.heightScale}, time * ${i.timeScale})) * 2.0 - 1.0;
    float bendEnvelope = pow(clamp(hValue, 0.0, 1.0), ${i.power});
    float scoopCycle = sin(time * ${i.scoopFreq});
    float scoopCrossCycle = sin(time * ${i.scoopCrossFreq} + ${i.scoopCrossPhase});
    float driftX = sin(time * ${i.driftXFreq} + hValue * ${i.driftXHeightFreq}) * ${i.driftXAmp};
    float driftZ = cos(time * ${i.driftZFreq} + hValue * ${i.driftZHeightFreq} + ${i.driftZPhase}) * ${i.driftZAmp};

    pos.x += (scoopCycle * ${i.scoopAmp} + signedNoiseX * ${i.signedNoiseXAmp} + driftX) * bendEnvelope;
    pos.z += (scoopCrossCycle * ${i.scoopCrossAmp} + signedNoiseZ * ${i.signedNoiseZAmp} + driftZ) * bendEnvelope;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`,Pe=`
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
    float heightMask = smoothstep(${f.heightStart}, ${f.heightPeak}, hValue) * (1.0 - smoothstep(${f.tipFadeStart}, ${f.tipFadeEnd}, hValue));
    float taperedWidth = mix(${f.widthBase}, ${f.widthTip}, smoothstep(${f.widthTaperStart}, ${f.widthTaperEnd}, hValue));
    float edgeNoise = noise(vec2(center * ${f.edgeNoiseXScale} + time * ${f.edgeNoiseTimeScale}, hValue * ${f.edgeNoiseYScale} - time * ${f.edgeNoiseTimeSpeed}));
    float edgeMask = 1.0 - smoothstep(taperedWidth, taperedWidth + ${f.edgeSoftness} + edgeNoise * ${f.edgeNoiseAmp}, center);
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
    alpha *= ${G.base} + innerCore * ${G.innerCoreBoost};

    gl_FragColor = vec4(color, alpha);
  }
`,ke=Me({time:0},Ze,Pe);Fe({FlameMaterialImpl:ke});const I=ve.forwardRef(function({side:t=H},h){return S.jsx("flameMaterialImpl",{ref:h,transparent:!0,blending:O,side:t,depthWrite:!1,toneMapped:!1})});function He({position:n=[0,0,0],inverted:t=!1,motion:h,phaseOffset:a=0}){const e={...J,...h},l=g.useRef(),m=g.useRef(),d=g.useRef(),o=g.useRef(0),p=g.useMemo(()=>ee($e),[]);return z(({clock:C},r)=>{const c=C.getElapsedTime()+a,M=e.baseSpeed+Math.sin(c*e.slowFreq)*e.slowAmp+Math.sin(c*e.fastFreq+1.4)*e.fastAmp+Math.sin(c*e.microFreq)*e.microAmp;if(o.current+=r*Math.max(e.minSpeed,M),m.current&&(m.current.time=o.current),d.current&&(d.current.time=o.current),l.current){const A=Math.sin(c*3.2)*e.swayX,E=Math.cos(c*2.4+.8)*e.swayZ;l.current.rotation.x=(t?Math.PI:0)+A,l.current.rotation.z=E;const N=1+Math.sin(o.current*e.pulseFreq)*e.pulseAmp;l.current.scale.set(e.scaleX,N*e.scaleY,e.scaleX)}}),S.jsxs("group",{ref:l,position:n,rotation:t?[Math.PI,0,0]:[0,0,0],children:[S.jsxs("mesh",{"rotation-y":P,children:[S.jsx("primitive",{object:p,attach:"geometry"}),S.jsx(I,{ref:m,side:H})]}),S.jsxs("mesh",{"rotation-y":P,children:[S.jsx("primitive",{object:p,attach:"geometry"}),S.jsx(I,{ref:d,side:D})]})]})}const q=Y(([n])=>{const t=b(n).toVar();return K(Z(Ve(t,b(12.9898,78.233))).mul(43758.5453123))}).setLayout({name:"flameRandom2",type:"float",inputs:[{name:"stInput",type:"vec2"}]}),x=Y(([n])=>{const t=b(n).toVar(),h=Xe(t).toVar(),a=K(t).toVar(),e=q(h).toVar(),l=q(h.add(b(1,0))).toVar(),m=q(h.add(b(0,1))).toVar(),d=q(h.add(b(1,1))).toVar(),o=a.mul(a).mul(b(3,3).sub(a.mul(2))).toVar();return R(e,l,o.x).add(m.sub(e).mul(o.y).mul(v(1).sub(o.x))).add(d.sub(l).mul(o.x).mul(o.y))}).setLayout({name:"flameNoise2",type:"float",inputs:[{name:"stInput",type:"vec2"}]});function U(n){const{alpha:t,baseScale:h,bend:a,color:e,opacity:l,shimmer:m,vertical:d}=Q,o={time:Ae(0)},p=Ne,C=Ee().toVarying("vFlameUv"),r=p.y.toVarying("vFlameHeight"),c=p.mul(F(...h)),M=p.xz.length(),A=_(M.add(d.cosOffset).mul(d.pi)).mul(d.cosAmp).add(x(b(0,o.time)).mul(d.staticNoiseAmp)).add(x(b(p.x.add(o.time),p.z.add(o.time))).mul(d.flowNoiseAmp)),E=c.y.mul(v(1).add(A.mul(p.y))),N=x(b(o.time.mul(a.timeScale),p.y.sub(o.time).mul(a.heightScale))).mul(2).sub(1),te=x(b(p.y.sub(o.time).mul(a.heightScale),o.time.mul(a.timeScale))).mul(2).sub(1),j=Te(Be(r,0,1),a.power),oe=Z(o.time.mul(a.scoopFreq)),ae=Z(o.time.mul(a.scoopCrossFreq).add(a.scoopCrossPhase)),se=Z(o.time.mul(a.driftXFreq).add(r.mul(a.driftXHeightFreq))).mul(a.driftXAmp),re=_(o.time.mul(a.driftZFreq).add(r.mul(a.driftZHeightFreq)).add(a.driftZPhase)).mul(a.driftZAmp),ie=c.x.add(oe.mul(a.scoopAmp).add(N.mul(a.signedNoiseXAmp)).add(se).mul(j)),ne=c.z.add(ae.mul(a.scoopCrossAmp).add(te.mul(a.signedNoiseZAmp)).add(re).mul(j)),X=Re(C.x.sub(.5)).mul(2),k=v(1).sub(X),le=u(t.heightStart,t.heightPeak,r).mul(v(1).sub(u(t.tipFadeStart,t.tipFadeEnd,r))),L=R(t.widthBase,t.widthTip,u(t.widthTaperStart,t.widthTaperEnd,r)),me=x(b(X.mul(t.edgeNoiseXScale).add(o.time.mul(t.edgeNoiseTimeScale)),r.mul(t.edgeNoiseYScale).sub(o.time.mul(t.edgeNoiseTimeSpeed)))),ce=v(1).sub(u(L,L.add(t.edgeSoftness).add(me.mul(t.edgeNoiseAmp)),X)),de=le.mul(ce),pe=v(1).sub(u(e.blueBaseFadeStart,e.blueBaseFadeEnd,r)).mul(u(e.blueBaseRadialStart,e.blueBaseRadialEnd,k)),W=u(e.innerCoreHeightStart,e.innerCoreHeightPeak,r).mul(v(1).sub(u(e.innerCoreFadeStart,e.innerCoreFadeEnd,r))).mul(u(e.innerCoreRadialStart,e.innerCoreRadialEnd,k)),ue=u(e.warmBodyStart,e.warmBodyEnd,r).mul(v(1).sub(u(e.warmBodyFadeStart,e.warmBodyFadeEnd,r))),fe=u(e.emberTipStart,e.emberTipEnd,r).mul(u(e.emberCenterStart,e.emberCenterEnd,X)),he=R(F(...e.outerLow),F(...e.outerHigh),u(e.outerMixStart,e.outerMixEnd,r)),Se=F(...e.blue).mul(pe).mul(e.blueScale),be=F(...e.warm).mul(ue).mul(k).mul(e.warmScale),ge=x(b(C.x.mul(m.xScale).sub(o.time.mul(m.timeScale)),r.mul(m.yScale).add(o.time.mul(m.timeSpeed)))).mul(m.amp).add(m.base);let y=he.add(Se);y=R(y,F(...e.core),W),y=y.add(be),y=R(y,F(...e.ember),fe.mul(e.emberMix)),y=y.mul(ge);const ye=de.mul(v(l.base).add(W.mul(l.innerCoreBoost))),T=new Ce({transparent:!0,depthWrite:!1,toneMapped:!1,blending:O,side:n});return T.positionNode=F(ie,E,ne),T.colorNode=y,T.opacityNode=ye,T.uniforms=o,T}function je({position:n=[0,0,0],inverted:t=!1,motion:h,phaseOffset:a=0}){const e={...J,...h},l=g.useRef(),m=g.useRef(0),d=g.useMemo(()=>ee(we),[]),o=g.useMemo(()=>U(H),[]),p=g.useMemo(()=>U(D),[]);return z(({clock:C},r)=>{const c=C.getElapsedTime()+a,M=e.baseSpeed+Math.sin(c*e.slowFreq)*e.slowAmp+Math.sin(c*e.fastFreq+1.4)*e.fastAmp+Math.sin(c*e.microFreq)*e.microAmp;if(m.current+=r*Math.max(e.minSpeed,M),o.uniforms.time.value=m.current,p.uniforms.time.value=m.current,l.current){const A=Math.sin(c*3.2)*e.swayX,E=Math.cos(c*2.4+.8)*e.swayZ;l.current.rotation.x=(t?Math.PI:0)+A,l.current.rotation.z=E;const N=1+Math.sin(m.current*e.pulseFreq)*e.pulseAmp;l.current.scale.set(e.scaleX,N*e.scaleY,e.scaleX)}}),S.jsxs("group",{ref:l,position:n,rotation:t?[Math.PI,0,0]:[0,0,0],children:[S.jsx("mesh",{"rotation-y":P,geometry:d,material:o}),S.jsx("mesh",{"rotation-y":P,geometry:d,material:p})]})}function Ue(n){return xe(a=>a.gl)?.isWebGPURenderer===!0?S.jsx(je,{...n}):S.jsx(He,{...n})}export{Ie as B,Ue as F};
