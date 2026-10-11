import{Q as Ye,V as N,f as Ze,C as K,$ as ae,a0 as z,E as Qe,n as et,r as D,a as le,j as E,G as ue,a3 as ne,l as J,aP as U,y as Y,S as re,bR as Re,aV as De,bd as Te,bN as tt,L as he,d as te,m as rt,b0 as at,ai as nt}from"./index-ZFRJoi97.js";import{m as ke}from"./BufferGeometryUtils-o_ln-VnG.js";import{c as ce,g as Le,b as Ee,a as ot,s as be,i as st,d as it,t as de}from"./lightningUtils-DurDepHE.js";import{u as F,aA as W,W as Q,f as G,j as lt,aG as oe,aJ as ct,a1 as ut,C as Fe,l as Oe,J as Pe,k as _e,x as ze,c as me,m as pe}from"./three.tsl-D-9KnpQx.js";import{H as dt}from"./Html-BiGutH3Y.js";const ht=new N(0,0,1),ft=[{alpha:.18,color:"#4764e1",thickness:.34},{alpha:.55,color:"#1072bd",thickness:.13},{alpha:1,color:"#aceeff",thickness:.038}],mt=15,pt=.18;function vt(t,e,r,a,o){const n=t.length-1,u=n*4,d=new Float32Array(u*3),i=new Float32Array(u),l=new Float32Array(u*3),c=new Float32Array(u),h=new Float32Array(u).fill(e),s=new Float32Array(u).fill(r),m=new Float32Array(u).fill(a),b=new Float32Array(u*3),p=[];for(let x=0;x<n;x+=1){const T=t[x],S=t[x+1],w=x/(t.length-1),R=(x+1)/(t.length-1),g=new N().subVectors(S,T).normalize(),y=x*4;[[T,w,-.5],[T,w,.5],[S,R,-.5],[S,R,.5]].forEach(([P,B,M],A)=>{const C=(y+A)*3;d[C]=P.x,d[C+1]=P.y,d[C+2]=P.z,i[y+A]=B,l[C]=g.x,l[C+1]=g.y,l[C+2]=g.z,c[y+A]=M,b[C]=o.r,b[C+1]=o.g,b[C+2]=o.b}),p.push(y,y+1,y+2,y+1,y+3,y+2)}const v=new ae;return v.setAttribute("position",new z(d,3)),v.setAttribute("aRatio",new z(i,1)),v.setAttribute("aDirection",new z(l,3)),v.setAttribute("aSide",new z(c,1)),v.setAttribute("aStrikeOffset",new z(h,1)),v.setAttribute("aThickness",new z(s,1)),v.setAttribute("aAlpha",new z(m,1)),v.setAttribute("aColor",new z(b,3)),v.setIndex(p),v}function Ie({coreColor:t,glowColor:e,layers:r=ft,strands:a,thickness:o}){const n=[];for(let d=0;d<a.length;d+=1){const i=a[d];for(let l=0;l<r.length;l+=1){const c=r[l],h=new K(c.color??(c.colorKey==="core"?t:e)),s=c.thickness??o*c.thicknessMultiplier,m=c.alpha??c.opacityMultiplier;n.push(vt(i.points,i.strikeOffset??0,s*i.radiusMultiplier,i.opacityMultiplier*m,h))}}const u=ke(n);return n.forEach(d=>d.dispose()),u}function Ge(t,e){const r=t.distanceTo(e);return Ze.clamp(r/mt,pt,1)}function He(t,e,r=.03){const a=e.clone().normalize(),o=t.clone().addScaledVector(a,r),n=new Ye().setFromUnitVectors(ht,a);return{position:o,quaternion:n}}const Mt=`
attribute float aRatio;
attribute vec3 aDirection;
attribute float aSide;
attribute float aStrikeOffset;
attribute float aThickness;
attribute float aAlpha;
attribute vec3 aColor;

uniform float uTime;
uniform float uStrikeDur;
uniform float uFadeDur;
uniform float uSpread;

varying float vRatio;
varying float vStrikeOffset;
varying float vAlpha;
varying vec3 vColor;

void main() {
  float fadeT = clamp((uTime - uStrikeDur) / uFadeDur, 0.0, 1.0);
  vec3 pos = position;
  pos.xz += pos.xz * pow(fadeT, 2.0) * uSpread;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vec3 toCamera = normalize(cameraPosition - worldPos.xyz);
  vec4 nextWorld = modelMatrix * vec4(position + aDirection, 1.0);
  vec3 tangent = normalize(cross(normalize(nextWorld.xyz - worldPos.xyz), toCamera));
  worldPos.xyz += tangent * aSide * aThickness;

  vRatio = aRatio;
  vStrikeOffset = aStrikeOffset;
  vAlpha = aAlpha;
  vColor = aColor;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`,bt=`
uniform float uTime;
uniform float uStrikeDur;
uniform float uFadeDur;

varying float vRatio;
varying float vStrikeOffset;
varying float vAlpha;
varying vec3 vColor;

void main() {
  float strikeT = clamp(uTime / uStrikeDur, 0.0, 1.0);
  float fadeT = clamp((uTime - uStrikeDur) / uFadeDur, 0.0, 1.0);

  float window = max(1.0 - vStrikeOffset, 0.001);
  float localT = clamp((strikeT - vStrikeOffset) / window, 0.0, 1.0);

  float reveal = step(vRatio, localT);
  float alpha = reveal * (1.0 - fadeT * fadeT) * vAlpha;

  gl_FragColor = vec4(vColor, alpha);
}
`,gt=`
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,xt=`
uniform float uTime;
uniform float uDur;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uRadialPow;
uniform float uFadePow;

varying vec2 vUv;

void main() {
  float t = clamp(uTime / uDur, 0.0, 1.0);
  float radial = max(0.0, 1.0 - length(vUv - vec2(0.5)) * 2.0);
  float alpha =
    pow(radial, uRadialPow) * pow(1.0 - t, uFadePow) * uIntensity;
  gl_FragColor = vec4(uColor, alpha);
}
`,wt=`
attribute float aRatio;
attribute float aSide;
attribute float aAlpha;
attribute float aFadeMult;

varying float vRatio;
varying float vSide;
varying float vAlpha;
varying float vFadeMult;

void main() {
  vRatio = aRatio;
  vSide = aSide;
  vAlpha = aAlpha;
  vFadeMult = aFadeMult;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,yt=`
uniform float uTime;
uniform float uDelay;
uniform float uRevealDur;
uniform float uFadeDur;
uniform vec3 uCoreColor;
uniform vec3 uMidColor;
uniform vec3 uEdgeColor;

varying float vRatio;
varying float vSide;
varying float vAlpha;
varying float vFadeMult;

void main() {
  float t = max(0.0, uTime - uDelay);
  float revealT = clamp(t / uRevealDur, 0.0, 1.0);
  float fadeT = clamp((t - uRevealDur) / (uFadeDur * vFadeMult), 0.0, 1.0);

  float reveal = step(vRatio, revealT);
  float edge = 1.0 - abs(vSide);
  float core = smoothstep(0.0, 0.25, edge);
  float glow = smoothstep(0.0, 0.85, edge);

  vec3 col = mix(uEdgeColor, mix(uMidColor, uCoreColor, core), glow);
  float fade = 1.0 - fadeT * fadeT;
  float alpha = reveal * glow * fade * vAlpha;

  gl_FragColor = vec4(col, alpha);
}
`,St=`
attribute vec3 aVelocity;
attribute float aLifetime;
attribute float aSeed;

uniform float uTime;
uniform float uDelay;
uniform float uSize;
uniform float uGravity;
uniform float uDepthScale;

varying float vAge;
varying float vSeed;

void main() {
  float t = max(0.0, uTime - uDelay);
  vAge = clamp(t / aLifetime, 0.0, 1.5);
  vSeed = aSeed;

  vec3 p = position + aVelocity * t + vec3(0.0, -uGravity * t * t, 0.0);
  p.z = max(p.z, 0.0);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * max(0.0, 1.0 - vAge * 0.8) * (uDepthScale / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`,At=`
varying float vAge;
varying float vSeed;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  if (r > 0.5) discard;

  float core = max(0.0, 1.0 - r * 5.0);
  float glow = max(0.0, 1.0 - r * 2.2);

  vec3 hot = vec3(1.00, 0.92, 0.55);
  vec3 mid = vec3(1.00, 0.42, 0.05);
  vec3 cool = vec3(0.70, 0.10, 0.00);

  vec3 col = mix(cool, mix(mid, hot, core), glow);
  float fade = max(0.0, 1.0 - vAge * vAge);
  gl_FragColor = vec4(col, (core * 1.0 + glow * 0.45) * fade);
}
`,Ct=`
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Rt=`
uniform float uTime;
uniform float uDelay;
uniform float uDur;
uniform float uAlphaMult;
uniform vec3 uColorA;
uniform vec3 uColorB;

varying vec2 vUv;

void main() {
  float t = clamp((uTime - uDelay) / uDur, 0.0, 1.0);
  vec2 uvc = vUv - 0.5;
  float r = length(uvc) * 2.0;
  float ring = abs(r - t);
  float alpha =
    smoothstep(0.12, 0.0, ring) * (1.0 - t) * (1.0 - t) * uAlphaMult;

  vec3 col = mix(uColorA, uColorB, t);
  gl_FragColor = vec4(col, alpha);
}
`,Dt=.045,Tt=1.8,je=new K(1,.92,.55),ge=new K(1,.42,.05),kt=new K(.7,.1,0),Lt=[{alpha:.18,color:"#4764e1",thickness:.34},{alpha:.55,color:"#1072bd",thickness:.13},{alpha:1,color:"#aceeff",thickness:.038}],$={angleJitter:.8,branchAngleMax:1.45,branchAngleMin:.55,branchChance:.72,branchDepth:2,branchLengthScaleMax:.7,branchLengthScaleMin:.3,branchStepsMax:9,branchStepsMin:5,countMax:7,countMin:4,coreColor:"#1086c1",fadeDuration:2.8,edgeColor:"#4791e1",lengthMax:3.9,lengthMin:.4,midColor:"#1088bc",revealDuration:.22,roughness:.725,thickAlpha:1,thickFadeMultiplier:.6,thickHalfWidth:.08,thinAlpha:.55,thinHalfWidth:.025},X={countMax:40,countMin:30,depthScale:160,gravity:9.5,lifetimeMax:1.3,lifetimeMin:.3,liftMax:7,liftMin:1,posJitter:.3,posOffset:.1,size:.18,speedMax:6,speedMin:1},V={baseOffset:.15,blueChance:.65,blueHueMax:.68,blueHueMin:.6,blueLightMax:.8,blueLightMin:.55,blueSat:.6,countMax:8,countMin:3,fadeMultiplier:.85,fadePower:2,gravity:18,heightMax:.16,heightMin:.04,lifetimeMax:2.2,lifetimeMin:1,liftMax:4,liftMin:1,rotationScale:8,speedMax:3.5,speedMin:1,warmBMax:.5,warmBMin:.3,warmGMax:.5,warmGMin:.3,warmRMax:.6,warmRMin:.3,widthMax:.33,widthMin:.08},se={alphaMultiplier:.4,colorA:"#ffb060",colorB:"#66b3ff",duration:.55,size:10},ee={color:"#4db2ff",duration:.45,fadePower:1.5,intensity:.35,radialPower:1.2,size:5},Et={color:"#6496ff",decay:8,maxAlpha:.6},Ft=.5,Ot=.15;function xe(t,e){return Math.max(t/e,.35)}function q(t,e,r=!0){const a=t?.[e];if(a===!1)return{enabled:!1,overrides:{}};if(a===!0)return{enabled:!0,overrides:{}};if(a==null)return{enabled:r,overrides:{}};const{enabled:o=!0,...n}=a;return{enabled:o,overrides:n}}function Pt(t,e,r=!0){for(let a=0;a<e.length;a+=1){const o=e[a];if(t?.[o]!=null)return q(t,o,r)}return{enabled:r,overrides:{}}}function Z(t,e){return t instanceof K?t.clone():new K(t??e)}function _t(t){const e={...t};return delete e.lengthScale,e}function zt({branchCount:t,coreColor:e,effects:r=null,fadeDuration:a,flashIntensity:o,flashRadius:n,glowColor:u,mainFractalDepth:d,renderer:i,roughness:l,strikeDuration:c,thickness:h}){const s=xe(h,Dt),m=xe(n,Tt),b=q(r,"bolt"),p=Pt(r,["cracks","crack"]),v=q(r,"debris"),x=q(r,"groundFlash"),T=q(r,"overlay"),S=q(r,"shockwave"),w=q(r,"sparks"),R=q(r,"pointLight",o>0),g=q(r,"cameraShake",!1),y=p.overrides.lengthScale??1,k=b.overrides.layers??Lt,P={...$,..._t(p.overrides),coreColor:Z(p.overrides.coreColor,$.coreColor),delay:c,edgeColor:Z(p.overrides.edgeColor,$.edgeColor),enabled:p.enabled,lengthMax:(p.overrides.lengthMax??$.lengthMax*y)*m,lengthMin:(p.overrides.lengthMin??$.lengthMin*y)*m,midColor:Z(p.overrides.midColor,$.midColor),thickHalfWidth:(p.overrides.thickHalfWidth??$.thickHalfWidth)*m,thinHalfWidth:(p.overrides.thinHalfWidth??$.thinHalfWidth)*m},B={...V,...v.overrides,baseOffset:(v.overrides.baseOffset??V.baseOffset)*m,enabled:v.enabled,gravity:(v.overrides.gravity??V.gravity)*m,heightMax:(v.overrides.heightMax??V.heightMax)*m,heightMin:(v.overrides.heightMin??V.heightMin)*m,liftMax:(v.overrides.liftMax??V.liftMax)*m,liftMin:(v.overrides.liftMin??V.liftMin)*m,speedMax:(v.overrides.speedMax??V.speedMax)*m,speedMin:(v.overrides.speedMin??V.speedMin)*m,widthMax:(v.overrides.widthMax??V.widthMax)*m,widthMin:(v.overrides.widthMin??V.widthMin)*m},M={color:Z(x.overrides.color,ee.color),duration:x.overrides.duration??ee.duration,enabled:x.enabled,fadePower:x.overrides.fadePower??ee.fadePower,intensity:x.overrides.intensity??ee.intensity,radialPower:x.overrides.radialPower??ee.radialPower,size:(x.overrides.size??ee.size)*m},A={...Et,...T.overrides,enabled:T.enabled},C={alphaMultiplier:S.overrides.alphaMultiplier??se.alphaMultiplier,colorA:Z(S.overrides.colorA,se.colorA),colorB:Z(S.overrides.colorB,se.colorB),duration:S.overrides.duration??se.duration,enabled:S.enabled,size:(S.overrides.size??se.size)*m},_={...X,...w.overrides,delay:c,depthScale:(w.overrides.depthScale??X.depthScale)*m,enabled:w.enabled,gravity:(w.overrides.gravity??X.gravity)*m,liftMax:(w.overrides.liftMax??X.liftMax)*m,liftMin:(w.overrides.liftMin??X.liftMin)*m,posJitter:(w.overrides.posJitter??X.posJitter)*m,posOffset:(w.overrides.posOffset??X.posOffset)*m,size:w.overrides.size??2.5*m,speedMax:(w.overrides.speedMax??X.speedMax)*m,speedMin:(w.overrides.speedMin??X.speedMin)*m},H={color:R.overrides.color??u,decay:R.overrides.decay??2,distanceMultiplier:R.overrides.distanceMultiplier??6,enabled:R.enabled,intensity:R.overrides.intensity??o,radius:R.overrides.radius??n},f={decay:g.overrides.decay??10,duration:g.overrides.duration??.45,enabled:g.enabled,frequency:g.overrides.frequency??36,intensity:g.overrides.intensity??.08},O=Math.max(M.enabled?M.duration:0,C.enabled?c+C.duration:0,P.enabled?c+P.revealDuration+P.fadeDuration:0,_.enabled?c+_.lifetimeMax:0,B.enabled?c+B.lifetimeMax:0,f.enabled?f.duration:0);return{boltLayers:k.map(L=>({alpha:L.alpha,color:Z(L.color,"#ffffff"),thickness:L.thickness*s})),boltSpread:b.overrides.spread??.01,branchCount:t,coreColor:e,crack:P,cameraShake:f,fadeDuration:a,effectDuration:O,flashIntensity:H.intensity,flashRadius:n,glowColor:u,debris:B,groundFlash:M,impactExtraDuration:Ft,mainFractalDepth:d,overlay:A,pointLight:H,renderer:i,roughness:l,shockwave:C,sparks:_,strikeDuration:c,tailExtraDuration:Ot,thickness:h,thicknessScale:s}}function Be(t,e,r,a,o,n,u){const d=o.branchStepsMin+Math.floor(n()*(o.branchStepsMax-o.branchStepsMin+1)),i=[t.clone()];let l=t.clone(),c=e;for(let p=0;p<d;p+=1){c+=(n()-.5)*o.angleJitter;const v=r/d*(.6+n()*.8);l=l.clone(),l.x+=Math.cos(c)*v,l.y+=Math.sin(c)*v,i.push(l.clone())}if(u.push(i),a<=0||n()>=o.branchChance||i.length<3)return;const h=1+Math.floor(n()*(i.length-2)),s=n()>.5?1:-1,m=c+s*(o.branchAngleMin+n()*(o.branchAngleMax-o.branchAngleMin)),b=r*(o.branchLengthScaleMin+n()*(o.branchLengthScaleMax-o.branchLengthScaleMin));Be(i[h].clone(),m,b,a-1,o,n,u)}function Ne(t,e){const r=ce(t*29+17),a=e.countMin+Math.floor(r()*(e.countMax-e.countMin+1)),o=[];for(let n=0;n<a;n+=1){const u=n/a*Math.PI*2+(r()-.5)*e.angleJitter,d=e.lengthMin+r()*(e.lengthMax-e.lengthMin);Be(new N,u,d,e.branchDepth,e,r,o)}return o}function we(t,e,r,a){const o=t.length-1;if(o<1)return null;const n=o*4,u=new Float32Array(n*3),d=new Float32Array(n),i=new Float32Array(n),l=new Float32Array(n).fill(r),c=new Float32Array(n).fill(a),h=[];for(let m=0;m<o;m+=1){const b=t[m],p=t[m+1],v=m/(t.length-1),x=(m+1)/(t.length-1),T=p.x-b.x,S=p.y-b.y,w=Math.hypot(T,S)||1,R=-S/w*e,g=T/w*e,y=m*4;[[b.x-R,b.y-g,v,-1],[b.x+R,b.y+g,v,1],[p.x-R,p.y-g,x,-1],[p.x+R,p.y+g,x,1]].forEach(([P,B,M,A],C)=>{const _=(y+C)*3;u[_]=P,u[_+1]=B,u[_+2]=0,d[y+C]=M,i[y+C]=A}),h.push(y,y+1,y+2,y+1,y+3,y+2)}const s=new ae;return s.setAttribute("position",new z(u,3)),s.setAttribute("aRatio",new z(d,1)),s.setAttribute("aSide",new z(i,1)),s.setAttribute("aAlpha",new z(l,1)),s.setAttribute("aFadeMult",new z(c,1)),s.setIndex(h),s}function Ue(t,e){const r=[];for(let o=0;o<t.length;o+=1){const n=t[o],u=we(n,e.thinHalfWidth,e.thinAlpha,1),d=we(n,e.thickHalfWidth,e.thickAlpha,e.thickFadeMultiplier);u&&r.push(u),d&&r.push(d)}if(!r.length)return null;const a=ke(r);return r.forEach(o=>o.dispose()),a}function It(t,e){const r=ce(t*43+31),a=e.countMin+Math.floor(r()*(e.countMax-e.countMin+1)),o=new Float32Array(a*3),n=new Float32Array(a*3),u=new Float32Array(a),d=new Float32Array(a);for(let l=0;l<a;l+=1){o[l*3]=(r()-.5)*e.posJitter,o[l*3+1]=(r()-.5)*e.posJitter,o[l*3+2]=e.posOffset;const c=r()*Math.PI*2,h=e.speedMin+r()*(e.speedMax-e.speedMin),s=e.liftMin+r()*(e.liftMax-e.liftMin);n[l*3]=Math.cos(c)*h,n[l*3+1]=Math.sin(c)*h,n[l*3+2]=s,u[l]=e.lifetimeMin+r()*(e.lifetimeMax-e.lifetimeMin),d[l]=r()}const i=new ae;return i.setAttribute("position",new z(o,3)),i.setAttribute("aVelocity",new z(n,3)),i.setAttribute("aLifetime",new z(u,1)),i.setAttribute("aSeed",new z(d,1)),i}function Gt(t,e){if(t()<e.blueChance){const r=e.blueHueMin+t()*(e.blueHueMax-e.blueHueMin),a=e.blueLightMin+t()*(e.blueLightMax-e.blueLightMin);return new K().setHSL(r,e.blueSat,a)}return new K(e.warmRMin+t()*(e.warmRMax-e.warmRMin),e.warmGMin+t()*(e.warmGMax-e.warmGMin),e.warmBMin+t()*(e.warmBMax-e.warmBMin))}function Ve(t,e){const r=ce(t*61+13),a=e.countMin+Math.floor(r()*(e.countMax-e.countMin+1)),o=[];for(let n=0;n<a;n+=1){const u=r()*Math.PI*2,d=e.speedMin+r()*(e.speedMax-e.speedMin),i=e.liftMin+r()*(e.liftMax-e.liftMin);o.push({active:!1,baseColor:Gt(r,e),baseScaleX:e.widthMin+r()*(e.widthMax-e.widthMin),baseScaleY:e.heightMin+r()*(e.heightMax-e.heightMin),index:n,lifetime:e.lifetimeMin+r()*(e.lifetimeMax-e.lifetimeMin),pos:new N(0,0,e.baseOffset),rotEuler:new Qe,rx:(r()-.5)*e.rotationScale,ry:(r()-.5)*e.rotationScale,rz:(r()-.5)*e.rotationScale,time:0,vx:Math.cos(u)*d,vy:Math.sin(u)*d,vz:i})}return{config:e,count:a,fadeColor:new K,hasStarted:!1,shards:o,tempObject:new et}}function We(t,e){const r=e,{tempObject:a}=t;for(let o=0;o<t.shards.length;o+=1){const n=t.shards[o];a.position.copy(n.pos),a.rotation.copy(n.rotEuler),a.scale.set(n.baseScaleX,n.baseScaleY,1),a.updateMatrix(),r.setMatrixAt(n.index,a.matrix),r.setColorAt(n.index,n.baseColor)}r.instanceMatrix.needsUpdate=!0,r.instanceColor&&(r.instanceColor.needsUpdate=!0)}function Ke(t,e,r,a){const o=t,n=e,{config:u,fadeColor:d,tempObject:i}=o;if(a&&!o.hasStarted){o.hasStarted=!0;for(let h=0;h<o.shards.length;h+=1)o.shards[h].active=!0}if(!o.hasStarted)return;let l=!1,c=!1;for(let h=0;h<o.shards.length;h+=1){const s=o.shards[h];if(s.active)if(s.time+=r,s.time>=s.lifetime)s.active=!1,i.position.copy(s.pos),i.rotation.copy(s.rotEuler),i.scale.set(0,0,0),i.updateMatrix(),n.setMatrixAt(s.index,i.matrix),c=!0;else{const m=s.time/s.lifetime;s.pos.x+=s.vx*r,s.pos.y+=s.vy*r,s.vz-=u.gravity*r,s.pos.z=Math.max(.05,s.pos.z+s.vz*r),s.rotEuler.x+=s.rx*r,s.rotEuler.y+=s.ry*r,s.rotEuler.z+=s.rz*r,i.position.copy(s.pos),i.rotation.copy(s.rotEuler),i.scale.set(s.baseScaleX,s.baseScaleY,1),i.updateMatrix(),n.setMatrixAt(s.index,i.matrix),c=!0,d.copy(s.baseColor).multiplyScalar(Math.max(0,(1-m**u.fadePower)*u.fadeMultiplier)),n.setColorAt(s.index,d),l=!0}}c&&(n.instanceMatrix.needsUpdate=!0),l&&n.instanceColor&&(n.instanceColor.needsUpdate=!0)}function ve(t,e,r,a){const o=t,n=e*3;o[n]=r.r*a,o[n+1]=r.g*a,o[n+2]=r.b*a}function Ht(t,e){return t<.35?e.copy(je).lerp(ge,t/.35):e.copy(ge).lerp(kt,(t-.35)/.65)}function jt(t,e){const r=ce(t*43+31),a=e.countMin+Math.floor(r()*(e.countMax-e.countMin+1)),o=new Float32Array(a*3),n=new Float32Array(a*3),u=new Float32Array(a*3),d=new Float32Array(a),i=new Float32Array(a);for(let c=0;c<a;c+=1){o[c*3]=(r()-.5)*e.posJitter,o[c*3+1]=(r()-.5)*e.posJitter,o[c*3+2]=e.posOffset+r()*e.posOffset;const h=r()*Math.PI*2,s=e.speedMin+r()*(e.speedMax-e.speedMin),m=e.liftMin+r()*(e.liftMax-e.liftMin);u[c*3]=Math.cos(h)*s,u[c*3+1]=Math.sin(h)*s,u[c*3+2]=m,d[c]=e.lifetimeMin+r()*(e.lifetimeMax-e.lifetimeMin),ve(n,c,je,1)}const l=new ae;return l.setAttribute("position",new z(o,3)),l.setAttribute("color",new z(n,3)),l.setDrawRange(0,a),{ages:i,colors:n,count:a,geometry:l,lifetimes:d,positions:o,velocities:u}}function Bt(t,e,r){const{ages:a}=t,{colors:o}=t,{geometry:n}=t,{lifetimes:u}=t,{positions:d}=t,{velocities:i}=t,l=Math.min(e,.05),c=new K;let h=!1;for(let s=0;s<t.count;s+=1){const m=u[s],b=a[s]+l;if(a[s]=b,b>=m)ve(o,s,c.setRGB(0,0,0),0);else{const p=s*3,v=b/m;i[p]*=.99,i[p+1]*=.99,i[p+2]-=r.gravity*l,d[p]+=i[p]*l,d[p+1]+=i[p+1]*l,d[p+2]=Math.max(0,d[p+2]+i[p+2]*l);const x=Ht(v,c),S=Math.max(0,1-v*v)*(.65+(1-v)*.75);ve(o,s,x,S),h=!0}}return n.attributes.position.needsUpdate=!0,n.attributes.color.needsUpdate=!0,h}function Nt(t,e){const r=new ue;r.name="LightningStrikeGL",r.userData.lightningIgnore=!0;const a=new ue;a.userData.lightningIgnore=!0,r.add(a);const o=new N,n=new N,u=t.surfaceType!=="air",d=new ne({vertexShader:Mt,fragmentShader:bt,uniforms:{uFadeDur:{value:Math.max(t.totalDuration-t.strikeDuration,.001)},uSpread:{value:e.boltSpread},uStrikeDur:{value:t.strikeDuration},uTime:{value:0}},transparent:!0,blending:U,depthWrite:!1,side:J,toneMapped:!1}),i=new Y(new ae,d);i.renderOrder=26,i.userData.lightningIgnore=!0,r.add(i);const l=u&&e.groundFlash.enabled?new ne({vertexShader:gt,fragmentShader:xt,uniforms:{uColor:{value:e.groundFlash.color.clone()},uDur:{value:e.groundFlash.duration},uFadePow:{value:e.groundFlash.fadePower},uIntensity:{value:e.groundFlash.intensity},uRadialPow:{value:e.groundFlash.radialPower},uTime:{value:-1}},transparent:!0,blending:U,depthWrite:!1,side:J,toneMapped:!1}):null,c=l?new Y(new re(e.groundFlash.size,e.groundFlash.size),l):null;c&&(c.renderOrder=23,c.userData.lightningIgnore=!0,a.add(c));const h=u&&e.shockwave.enabled?new ne({vertexShader:Ct,fragmentShader:Rt,uniforms:{uAlphaMult:{value:e.shockwave.alphaMultiplier},uColorA:{value:e.shockwave.colorA.clone()},uColorB:{value:e.shockwave.colorB.clone()},uDelay:{value:t.strikeDuration},uDur:{value:e.shockwave.duration},uTime:{value:0}},transparent:!0,blending:U,depthWrite:!1,side:J,toneMapped:!1}):null,s=h?new Y(new re(e.shockwave.size,e.shockwave.size),h):null;s&&(s.renderOrder=22,s.userData.lightningIgnore=!0,a.add(s));const m=u&&e.crack.enabled?Ne(t.seed,e.crack):[],b=u&&e.crack.enabled?Ue(m,e.crack):null,p=b?new ne({vertexShader:wt,fragmentShader:yt,uniforms:{uCoreColor:{value:e.crack.coreColor.clone()},uDelay:{value:e.crack.delay},uFadeDur:{value:e.crack.fadeDuration},uEdgeColor:{value:e.crack.edgeColor.clone()},uMidColor:{value:e.crack.midColor.clone()},uRevealDur:{value:e.crack.revealDuration},uTime:{value:0}},transparent:!0,blending:U,depthWrite:!1,side:J,toneMapped:!1}):null,v=b&&p?new Y(b,p):null;v&&(v.renderOrder=24,v.userData.lightningIgnore=!0,a.add(v));const x=u&&e.sparks.enabled?It(t.seed,e.sparks):null,T=x?new ne({vertexShader:St,fragmentShader:At,uniforms:{uDelay:{value:e.sparks.delay},uDepthScale:{value:e.sparks.depthScale},uGravity:{value:e.sparks.gravity},uSize:{value:e.sparks.size},uTime:{value:0}},transparent:!0,blending:U,depthWrite:!1,toneMapped:!1}):null,S=x&&T?new Re(x,T):null;S&&(S.renderOrder=25,S.userData.lightningIgnore=!0,a.add(S));const w=u&&e.debris.enabled?Ve(t.seed,e.debris):null,R=w?new De({blending:U,depthWrite:!1,side:J,toneMapped:!1,transparent:!0,vertexColors:!0}):null,g=w&&R?new Te(new re(1,1),R,w.count):null;g&&w&&(g.renderOrder=24,g.userData.lightningIgnore=!0,We(w,g),a.add(g));function y(M,A){const C=Ge(M,A),_=Ee({branchCount:t.branchCount??e.branchCount,mainFractalDepth:t.mainFractalDepth??e.mainFractalDepth,roughness:t.roughness??e.roughness,seed:t.seed,source:M,target:A,...t.strandOptions??null}),H=Ie({coreColor:e.coreColor,glowColor:e.glowColor,layers:e.boltLayers.map(f=>({...f,thickness:f.thickness*C})),strands:_,thickness:e.thickness});i.geometry.dispose(),i.geometry=H,o.copy(M),n.copy(A)}function k(M,A,C){const _=M-t.strikeDuration,{position:H,quaternion:f}=He(A,C,.04);d.uniforms.uTime.value=M,l&&(l.uniforms.uTime.value=_),h&&(h.uniforms.uTime.value=M),p&&(p.uniforms.uTime.value=M),T&&(T.uniforms.uTime.value=M),u&&(a.position.copy(H),a.quaternion.copy(f))}function P(M,A){w&&g&&Ke(w,g,M,A>=t.strikeDuration)}function B(){i.geometry.dispose(),d.dispose(),c&&l&&(c.geometry.dispose(),l.dispose()),s&&h&&(s.geometry.dispose(),h.dispose()),v&&p&&(v.geometry.dispose(),p.dispose()),S&&T&&x&&(x.dispose(),T.dispose()),g&&R&&(g.geometry.dispose(),R.dispose())}return{dispose:B,group:r,lastSource:o,lastTarget:n,rebuild:y,updateImpactParticles:P,update:k}}function Ut({config:t,onComplete:e,strike:r}){const a=D.useRef(!1),o=D.useRef(null),n=D.useMemo(()=>Nt(r,t),[t,r]);D.useEffect(()=>{const d=r.sourceResolver(),i=r.targetResolver();return n.rebuild(d,i),()=>{n.dispose()}},[r,n]),le(({clock:d},i)=>{if(a.current)return;const l=d.elapsedTime-r.startTime,c=l/r.totalDuration;if(c>=1){a.current=!0,e(r.id);return}const h=r.targetResolver(),s=r.normalResolver();if(r.follow){const b=r.sourceResolver();(b.distanceToSquared(n.lastSource)>4e-4||h.distanceToSquared(n.lastTarget)>4e-4)&&n.rebuild(b,h)}if(n.update(l,h,s),n.updateImpactParticles(i,l),!o.current)return;const m=Le(c);o.current.position.copy(h).addScaledVector(s,.16),o.current.intensity=m*t.pointLight.intensity});const u=t.pointLight.enabled&&t.pointLight.intensity>0;return E.jsxs(E.Fragment,{children:[E.jsx("primitive",{object:n.group}),u?E.jsx("pointLight",{ref:o,castShadow:!1,color:t.pointLight.color,decay:t.pointLight.decay,distance:t.pointLight.radius*t.pointLight.distanceMultiplier,intensity:0}):null]})}function Vt(t,e){const r={fadeDur:F(Math.max(e.totalDuration-e.strikeDuration,.001)),spread:F(t.boltSpread),strikeDur:F(e.strikeDuration),time:F(0)},a=new he({transparent:!0,blending:U,depthWrite:!1,side:J,toneMapped:!1}),o=W("aRatio","float"),n=W("aDirection","vec3").normalize(),u=W("aSide","float"),d=W("aStrikeOffset","float"),i=W("aThickness","float"),l=W("aAlpha","float"),c=W("aColor","vec3"),h=Q(r.time.sub(r.strikeDur).div(r.fadeDur.max(G(1e-4))),0,1),s=h.mul(h).mul(r.spread),m=lt(oe.x.add(oe.x.mul(s)),oe.y,oe.z.add(oe.z.mul(s))),b=ct.sub(m).normalize(),p=ut(n,b).normalize(),v=Q(r.time.div(r.strikeDur.max(G(1e-4))),0,1),x=G(1).sub(d).max(G(.001)),T=Q(v.sub(d).div(x),0,1),w=Fe(o,T).mul(G(1).sub(h.mul(h))).mul(l);return a.positionNode=m.add(p.mul(u).mul(i)),a.colorNode=c.toVec4(w),{material:a,uniforms:r}}function Wt(t,e){const r={coreColor:F(t.coreColor.clone()),delay:F(e.strikeDuration),edgeColor:F(t.edgeColor.clone()),fadeDuration:F(Math.max(t.fadeDuration,.001)),midColor:F(t.midColor.clone()),revealDuration:F(Math.max(t.revealDuration,.001)),time:F(0)},a=W("aRatio","float"),o=W("aSide","float"),n=W("aAlpha","float"),u=W("aFadeMult","float"),d=r.time.sub(r.delay).max(G(0)),i=Q(d.div(r.revealDuration.max(G(1e-4))),0,1),l=Q(d.sub(r.revealDuration).div(r.fadeDuration.mul(u).max(G(1e-4))),0,1),c=G(1).sub(ze(o)),h=me(0,.25,c),s=me(0,.85,c),m=pe(r.edgeColor,pe(r.midColor,r.coreColor,h),s),b=Fe(a,i).mul(s).mul(G(1).sub(l.mul(l))).mul(n),p=new he({transparent:!0,blending:U,depthWrite:!1,side:J,toneMapped:!1});return p.colorNode=m.toVec4(b),{material:p,uniforms:r}}function Kt(t){const e={color:F(t.groundFlash.color.clone()),duration:F(t.groundFlash.duration),intensity:F(t.groundFlash.intensity),time:F(-1)},r=G(1).sub(Oe(Pe().sub(_e(.5,.5))).mul(2)).max(G(0)),a=Q(e.time.div(e.duration.max(G(1e-4))),0,1),o=r.mul(r).mul(G(1).sub(a)).mul(G(1).sub(a)).mul(e.intensity),n=new he({transparent:!0,blending:U,depthWrite:!1,side:J,toneMapped:!1});return n.colorNode=e.color.toVec4(o),{material:n,uniforms:e}}function Jt(t,e){const r={alphaMult:F(t.shockwave.alphaMultiplier),colorA:F(t.shockwave.colorA.clone()),colorB:F(t.shockwave.colorB.clone()),delay:F(e.strikeDuration),duration:F(t.shockwave.duration),time:F(0)},a=Pe().sub(_e(.5,.5)),o=Q(r.time.sub(r.delay).div(r.duration.max(G(1e-4))),0,1),n=Oe(a).mul(2),u=ze(n.sub(o)),d=G(1).sub(o),i=me(.12,0,u).mul(d).mul(d).mul(r.alphaMult),l=pe(r.colorA,r.colorB,o),c=new he({transparent:!0,blending:U,depthWrite:!1,side:J,toneMapped:!1});return c.colorNode=l.toVec4(i),{material:c,uniforms:r}}function Xt(t,e){const r=new ue;r.name="LightningStrikeGPU",r.userData.lightningIgnore=!0;const a=new ue;a.userData.lightningIgnore=!0,r.add(a);const o=new N,n=new N,u=t.surfaceType!=="air",d=Vt(e,t),i=new Y(new ae,d.material);i.renderOrder=26,i.userData.lightningIgnore=!0,r.add(i);const l=u&&e.groundFlash.enabled?Kt(e):null,c=l?new Y(new re(e.groundFlash.size,e.groundFlash.size),l.material):null;c&&(c.renderOrder=23,c.userData.lightningIgnore=!0,a.add(c));const h=u&&e.shockwave.enabled?Jt(e,t):null,s=h?new Y(new re(e.shockwave.size,e.shockwave.size),h.material):null;s&&(s.renderOrder=22,s.userData.lightningIgnore=!0,a.add(s));const m=u&&e.crack.enabled?Ne(t.seed,e.crack):[],b=u&&e.crack.enabled?Ue(m,e.crack):null,p=b?Wt(e.crack,t):null,v=b&&p?new Y(b,p.material):null;v&&(v.renderOrder=24,v.userData.lightningIgnore=!0,a.add(v));const x=u&&e.sparks.enabled?jt(t.seed,e.sparks):null,T=x?new tt({blending:U,depthWrite:!1,size:e.sparks.size,sizeAttenuation:!0,toneMapped:!1,transparent:!0,vertexColors:!0}):null,S=x&&T?new Re(x.geometry,T):null;S&&(S.renderOrder=25,S.userData.lightningIgnore=!0,a.add(S));const w=u&&e.debris.enabled?Ve(t.seed,e.debris):null,R=w?new De({blending:U,depthWrite:!1,side:J,toneMapped:!1,transparent:!0,vertexColors:!0}):null,g=w&&R?new Te(new re(1,1),R,w.count):null;g&&w&&(g.renderOrder=24,g.userData.lightningIgnore=!0,We(w,g),a.add(g));function y(M,A){const C=Ge(M,A),_=Ee({branchCount:t.branchCount??e.branchCount,mainFractalDepth:t.mainFractalDepth??e.mainFractalDepth,roughness:t.roughness??e.roughness,seed:t.seed,source:M,target:A,...t.strandOptions??null}),H=Ie({coreColor:e.coreColor,glowColor:e.glowColor,layers:e.boltLayers.map(f=>({...f,thickness:f.thickness*C})),strands:_,thickness:e.thickness});i.geometry.dispose(),i.geometry=H,o.copy(M),n.copy(A)}function k(M,A,C){const _=M-t.strikeDuration,{position:H,quaternion:f}=He(A,C,.04);d.uniforms.time.value=M,l&&(l.uniforms.time.value=_),h&&(h.uniforms.time.value=M),p&&(p.uniforms.time.value=M),u&&(a.position.copy(H),a.quaternion.copy(f))}function P(M){x&&Bt(x,M,e.sparks),w&&g&&Ke(w,g,M,M>=0&&d.uniforms.time.value>=t.strikeDuration)}function B(){i.geometry.dispose(),d.material.dispose(),c&&l&&(c.geometry.dispose(),l.material.dispose()),s&&h&&(s.geometry.dispose(),h.material.dispose()),v&&p&&(v.geometry.dispose(),p.material.dispose()),S&&T&&x&&(x.geometry.dispose(),T.dispose()),g&&R&&(g.geometry.dispose(),R.dispose())}return{dispose:B,group:r,lastSource:o,lastTarget:n,rebuild:y,updateImpactParticles:P,update:k}}function qt({config:t,onComplete:e,strike:r}){const a=D.useRef(!1),o=D.useRef(null),n=D.useMemo(()=>Xt(r,t),[t,r]);D.useEffect(()=>{const d=r.sourceResolver(),i=r.targetResolver();return n.rebuild(d,i),()=>{n.dispose()}},[r,n]),le(({clock:d},i)=>{if(a.current)return;const l=d.elapsedTime-r.startTime,c=l/r.totalDuration;if(c>=1){a.current=!0,e(r.id);return}const h=r.targetResolver(),s=r.normalResolver();if(r.follow){const b=r.sourceResolver();(b.distanceToSquared(n.lastSource)>4e-4||h.distanceToSquared(n.lastTarget)>4e-4)&&n.rebuild(b,h)}if(n.update(l,h,s),n.updateImpactParticles(i),!o.current)return;const m=Le(c);o.current.position.copy(h).addScaledVector(s,.16),o.current.intensity=m*t.pointLight.intensity});const u=t.pointLight.enabled&&t.pointLight.intensity>0;return E.jsxs(E.Fragment,{children:[E.jsx("primitive",{object:n.group}),u?E.jsx("pointLight",{ref:o,castShadow:!1,color:t.pointLight.color,decay:t.pointLight.decay,distance:t.pointLight.radius*t.pointLight.distanceMultiplier,intensity:0}):null]})}function $t({config:t,...e}){return t.renderer==="webgpu"?E.jsx(qt,{config:t,...e}):E.jsx(Ut,{config:t,...e})}const fe=new at,ye=new rt,Se=new nt,Ae=new N,Yt=new N(0,1,0),Zt={branchCount:0,branchLengthFactorMax:.1,branchLengthFactorMin:.04,branchMode:"arc",branchRadiusScale:.35,mainFractalDepth:5,mainRadiusScale:.75,roughness:.28};function Qt(t){const e=t?.tagName?.toLowerCase();return t?.isContentEditable||e==="input"||e==="textarea"||e==="select"}function er(t){return t.altKey||t.ctrlKey||t.metaKey}function ie(t,e){if(typeof t=="function")return()=>de(t(),e);const r=de(t,e);return()=>r.clone()}function Ce(t,e=[0,1,0]){if(typeof t=="function")return()=>de(t(),e).normalize();const r=de(t,e).normalize();return()=>r.clone()}function tr(t,e,r){const a=ce(e+2654435761),{topJitter:o}=r,n=r.minHeight??15,u=r.maxHeight??24,d=r.sourceSpread??1.5,i=n+(u-n)*a(),l=new N;if(o==null||o<=0){const c=a()*Math.PI*2,h=d*(.5+a()*.5);l.set(Math.cos(c)*h,i,Math.sin(c)*h)}else l.set((a()-.5)*o,i,(a()-.5)*o);return()=>t().add(l)}function rr(t,e,r){if(!e||r<=0)return!1;const a=t.x-e.x,o=t.z-e.z;return a*a+o*o<r*r}function ar(t,e){return t.find(r=>!r.object?.isMesh||st(r.object)?!1:typeof e=="function"?e(r):!0)}function nr(t){let e=t;for(;e;){if(e.userData?.lightningSurfaceType)return e.userData.lightningSurfaceType;e=e.parent}return"mesh"}function or(t){const e=it(t);return e||{follow:!1,normal:t.face?.normal?.clone().transformDirection(t.object.matrixWorld).normalize()??Yt,surfaceType:nr(t.object),target:t.point.clone()}}function sr(t={}){return{...Zt,...t.branchCount==null?null:{branchCount:t.branchCount},...t.mainFractalDepth==null?null:{mainFractalDepth:t.mainFractalDepth},...t.roughness==null?null:{roughness:t.roughness},...t.strandOptions??null}}function ir(t){return t?Array.isArray(t)||t instanceof N||typeof t=="object"&&"x"in t&&"y"in t&&"z"in t?{target:t}:t:null}function lr(t,e,r){return e?.targetResolver?e.targetResolver:t.targetResolver?ie(t.targetResolver,[0,r,0]):ie(t.target,[0,r,0])}function cr(t,e){return e?.normalResolver?e.normalResolver:t.normalResolver?Ce(t.normalResolver):Ce(t.normal,[0,1,0])}function ur(t,e){return t.surfaceType?t.surfaceType:e?.surfaceType??"generic"}function dr(t,e,r,a,o){const n=[0,o.maxHeight,0];return t.sourceResolver?ie(t.sourceResolver,n):t.source?ie(t.source,n):a?ie(a,n):tr(e,r,o)}function hr({apiRef:t,autoRandom:e,autoRandomInterval:r,clickToStrike:a,defaultSource:o,defaultTotalDuration:n,fallbackPlaneEnabled:u,fadeDuration:d,groundPlaneY:i,keyboardShortcuts:l,maxConcurrentStrikes:c,presetTargets:h,randomStrikeBounds:s,raycastFilter:m,strikeDuration:b}){const p=te(f=>f.camera),v=te(f=>f.clock),x=te(f=>f.gl),T=te(f=>f.scene),[S,w]=D.useState([]),R=D.useRef(0),g=D.useRef(0),y=D.useRef(null),k=D.useMemo(()=>({maxHeight:24,maxX:5,maxZ:5,minHeight:15,minX:-5,minZ:-5,sourceSpread:1.5,targetY:i,topJitter:1.5,...s}),[i,s]),P=D.useCallback(()=>{const[f=4,O=f]=r||[];return f+Math.random()*Math.max(0,O-f)},[r]),B=D.useCallback(f=>{w(O=>O.filter(L=>L.id!==f))},[]),M=D.useCallback((f={})=>{const O=R.current+1;R.current=O;const L=f.seed??Math.floor(Math.random()*2147483646)+O,j=f.intersection?ot(f.intersection):null,I=lr(f,j,i),Xe=cr(f,j),qe=dr(f,I,L,o,k),Me={branchCount:f.branchCount,follow:f.follow??j?.follow??!1,id:`lightning-${O}`,mainFractalDepth:f.mainFractalDepth,normalResolver:Xe,roughness:f.roughness,seed:L,sourceResolver:qe,startTime:v.elapsedTime,strandOptions:f.strandOptions,strikeDuration:b,surfaceType:ur(f,j),targetResolver:I,totalDuration:f.totalDuration??n??b+d};return w($e=>[...$e,Me].slice(-c)),Me.id},[v.elapsedTime,o,n,d,i,c,k,b]),A=D.useCallback((f={})=>{const O=k.avoidCameraRadius??0,L=Math.max(1,Math.floor(k.maxAttempts??1));let j=be(k,Math.random);for(let I=0;I<L&&rr(j,p.position,O);I+=1)j=be(k,Math.random);return M({...f,follow:f.follow??!1,normal:f.normal??[0,1,0],target:j})},[p.position,k,M]),C=D.useCallback(f=>{if(!h.length)return null;const O=f==null?g.current%h.length:(f%h.length+h.length)%h.length;g.current=O+1;const L=ir(h[O]);return L?M({...L,follow:L.follow??!1,normal:L.normal??[0,1,0],target:L.target??L.point}):null},[h,M]),_=D.useCallback(f=>M({...f,follow:f?.follow??!0,strandOptions:sr(f),surfaceType:f?.surfaceType??"air"}),[M]),H=D.useCallback(()=>{w([])},[]);return D.useEffect(()=>{if(!t)return;const f=t;return f.current={clear:H,spawnArc:_,spawnPresetStrike:C,spawnRandomStrike:A,spawnStrike:M},()=>{f.current&&(f.current=null)}},[t,H,_,C,A,M]),D.useEffect(()=>{if(!a)return;const f=x.domElement;function O(L){if(L.button!==0)return;const j=f.getBoundingClientRect();ye.set((L.clientX-j.left)/j.width*2-1,-((L.clientY-j.top)/j.height*2-1)),fe.setFromCamera(ye,p);const I=ar(fe.intersectObjects(T.children,!0),m);if(I){M(or(I));return}u&&(Se.set(new N(0,1,0),-i),fe.ray.intersectPlane(Se,Ae)&&M({follow:!1,normal:[0,1,0],target:Ae.clone()}))}return f.addEventListener("pointerdown",O),()=>{f.removeEventListener("pointerdown",O)}},[p,a,u,x,i,m,T,M]),D.useEffect(()=>{const f=l?.random,O=l?.preset,L=l?.clear;if(!f&&!O&&!L)return;function j(I){Qt(I.target)||er(I)||(I.code===f&&(A(),I.preventDefault()),I.code===O&&(C(),I.preventDefault()),I.code===L&&(H(),I.preventDefault()))}return window.addEventListener("keydown",j),()=>{window.removeEventListener("keydown",j)}},[H,l,C,A]),D.useEffect(()=>{y.current=null},[e,r]),le(({clock:f})=>{if(e){if(y.current==null){y.current=f.elapsedTime+P();return}f.elapsedTime<y.current||(A(),y.current=f.elapsedTime+P())}}),{clear:H,completeStrike:B,spawnArc:_,spawnPresetStrike:C,spawnRandomStrike:A,spawnStrike:M,strikes:S}}function fr(t){const e=new K(t);return{b:Math.round(e.b*255),g:Math.round(e.g*255),r:Math.round(e.r*255)}}function mr({overlay:t,strikes:e}){const r=D.useRef(null);return le(({clock:a})=>{if(!r.current)return;const o=a.elapsedTime;let n=0;for(let l=0;l<e.length;l+=1){const c=e[l],h=o-c.startTime;h>=0&&(n=Math.max(n,Math.exp(-h*t.decay)*t.maxAlpha))}const{r:u,g:d,b:i}=fr(t.color);r.current.style.background=`rgba(${u}, ${d}, ${i}, ${n})`}),E.jsx("group",{userData:{lightningIgnore:!0},children:E.jsx(dt,{fullscreen:!0,style:{pointerEvents:"none"},zIndexRange:[1,0],children:E.jsx("div",{ref:r,style:{background:"rgba(100, 150, 255, 0)",inset:0,pointerEvents:"none",position:"absolute"}})})})}function pr({cameraShake:t,strikes:e}){const r=te(o=>o.camera),a=D.useRef(new N);return D.useEffect(()=>()=>{r.position.sub(a.current),a.current.set(0,0,0)},[r]),le(({clock:o})=>{if(r.position.sub(a.current),a.current.set(0,0,0),!t.enabled)return;const n=o.elapsedTime;let u=0;for(let i=0;i<e.length;i+=1){const l=e[i],c=n-l.startTime;c>=0&&c<=t.duration&&(u=Math.max(u,Math.exp(-c*t.decay)*t.intensity))}if(u<=1e-4)return;const d=n*t.frequency;a.current.set(Math.sin(d*1.37+.5),Math.sin(d*2.11+1.7),Math.sin(d*1.73+3.1)),a.current.multiplyScalar(u),r.position.add(a.current),r.updateMatrixWorld()},1),null}function vr({renderer:t,apiRef:e=null,autoRandom:r=!1,autoRandomInterval:a=[4,8],branchCount:o=3,clickToStrike:n=!1,coreColor:u="#aceeff",defaultSource:d=null,effects:i=null,fadeDuration:l=1,fallbackPlaneEnabled:c=!0,flashIntensity:h=0,flashRadius:s=1.8,glowColor:m="#1072bd",groundPlaneY:b=0,keyboardShortcuts:p={random:"KeyR",preset:"KeyP",clear:"Escape"},mainFractalDepth:v=6,maxConcurrentStrikes:x=12,presetTargets:T=[],randomStrikeBounds:S={minX:-5,maxX:5,minZ:-5,maxZ:5,targetY:0,minHeight:15,maxHeight:24,sourceSpread:1.5,topJitter:1.5},raycastFilter:w=null,roughness:R=.5,strikeDuration:g=.15,thickness:y=.045}){const k=D.useMemo(()=>zt({branchCount:o,coreColor:u,effects:i,fadeDuration:l,flashIntensity:h,flashRadius:s,glowColor:m,mainFractalDepth:v,renderer:t,roughness:R,strikeDuration:g,thickness:y}),[o,u,i,l,h,s,m,v,t,R,g,y]),P=D.useMemo(()=>Math.max(g+l+k.tailExtraDuration,k.effectDuration+k.impactExtraDuration),[l,g,k]),{completeStrike:B,strikes:M}=hr({apiRef:e,autoRandom:r,autoRandomInterval:a,clickToStrike:n,defaultSource:d,defaultTotalDuration:P,fallbackPlaneEnabled:c,groundPlaneY:b,keyboardShortcuts:p,maxConcurrentStrikes:x,presetTargets:T,randomStrikeBounds:S,raycastFilter:w,strikeDuration:g,fadeDuration:l});return E.jsxs(E.Fragment,{children:[k.overlay.enabled?E.jsx(mr,{overlay:k.overlay,strikes:M}):null,k.cameraShake.enabled?E.jsx(pr,{cameraShake:k.cameraShake,strikes:M}):null,M.map(A=>E.jsx($t,{config:k,onComplete:B,strike:A},A.id))]})}const Je=D.memo(vr);function Mr(t){return E.jsx(Je,{renderer:"webgl",...t})}function br(t){return E.jsx(Je,{renderer:"webgpu",...t})}function Ar(t){return te(r=>r.gl)?.isWebGPURenderer===!0?E.jsx(br,{...t}):E.jsx(Mr,{...t})}export{Ar as L};
