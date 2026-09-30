import{be as _t,aY as Et,aT as Ot,aX as Wt,dy as Gt,r as x,d as H,S as ye,y as J,a as De,O as ht,U as vt,aR as gt,L as re,ad as xt,V as w,C as de,l as yt,I as St,H as Se,a1 as E,at as we,J as Nt,aD as Ht,af as wt,G as ge,$ as Vt,aU as Me,d4 as Je,a0 as jt,aG as Ut,F as qt,aw as bt,B as Xt,aP as Yt,b as Jt,f as Ke,d5 as N,as as Te,K as Kt,bg as K,m as oe,a9 as $t,aF as F,j as $}from"./index-CZrCenUx.js";import{u as Zt,g as Qt,C as ea}from"./useSceneCameraControls-Db1xpW7C.js";import"./cameraSplinePresets-20I96-dQ.js";import"./useOperatorInput-06Y7Dw5B.js";import{k as ta,l as aa,m as ra,s as ia,g as na,n as _}from"./uniforms-D5Dg2nt-.js";import{u as o,v as B,z as Y,f as j,F as te,j as P,aG as Pe,Y as be,J as zt,m as X,bh as $e,k as Ge,bg as oa,c as sa,aT as la,aC as ke,T as Ze,U as b,c4 as ca,I as se,aD as y,y as Ne,w as ua,E as D,b9 as k,aO as ie,aA as ee,bx as v,by as le,bz as ce,S as Ae}from"./three.tsl-BCn1EJLR.js";import{u as da}from"./Bret-BWa4eewN.js";import{u as fa}from"./Reversal-BGkLjmrI.js";import{u as pa}from"./usePresetsFolder-DH_sUmJE.js";import{u as ma}from"./useMediaRecorder-B_Cgdm3w.js";import"./useCameraSpline-D2JzwxJ2.js";import"./OrthographicCamera-lagycLIi.js";import"./extends-CF3RwP-h.js";import"./Fbo-CuzV2MYU.js";import"./PerspectiveCamera-BbtzzYsN.js";import"./OrbitControls-De_Jvd9W.js";import"./Line-DEDpjIoQ.js";import"./Line2-DcfhY-mN.js";import"./constants-Bl7_aj6-.js";import"./react-spring_three.modern-DbaCFhdt.js";import"./Gltf-DquSr65l.js";import"./isMobileDevice-De1yZKQi.js";function ha({extent:t=140,baseHeight:e=.45,heightScale:a=40,sampling:i}){const s={base:o(e),extent:o(t),scale:o(a)},u=d=>d.div(s.extent),l=d=>i.sampleHeight(d).sub(s.base).mul(s.scale);return{sample:d=>{const r=u(d).toVar(),n=r.abs().toVar(),c=l(i.toFieldUV(r)).toVar();return B(d.x,c,d.y,Y(n.x.max(n.y).lessThan(.5),j(1),j(0)))},slope:d=>i.sampleSlope(i.toFieldUV(u(d))).mul(s.scale).div(s.extent),uniforms:s}}const Qe=["Range","Single Peak"],et={Range:{heightOffset:-.65,mode:"procedural",onsetInput:1.25},"Single Peak":{heightOffset:0,mode:"dome",onsetInput:.7}},va=["shape","erosionScale","erosionStrength","erosionGullyWeight","erosionDetail","erosionOctaves","mountainFrequency","mountainAmplitude","mountainTreeline","peakRadius","peakAmplitude"];function ga(t){return va.map(e=>t[e]).join("|")}function xa({palette:t,resolution:e}){const a={...aa(),...ta()},i=ra({resolution:e,uniforms:a}),s=ha({sampling:i});let u="procedural";function l(d){const r=et[d.shape]??et.Range;u=r.mode,a.scale.value=d.erosionScale,a.strength.value=d.erosionStrength,a.gullyWeight.value=d.erosionGullyWeight,a.detail.value=d.erosionDetail,a.octaves.value=d.erosionOctaves,a.onset.value.setX(r.onsetInput),a.heightOffset.value.setX(r.heightOffset),a.heightFrequency.value=d.mountainFrequency,a.heightAmplitude.value=d.mountainAmplitude,a.domeRadius.value=d.peakRadius,a.domeAmplitude.value=d.peakAmplitude,a.grassHeight.value=d.mountainTreeline,a.waterEnabled.value=0,a.drainageEnabled.value=1,s.uniforms.base.value=d.baseHeight,s.uniforms.extent.value=d.extent,s.uniforms.scale.value=d.relief;const n=t[d.palette]??t.Monochrome;Object.entries(n).forEach(([c,f])=>ia(a[c],f))}return{applyConfig:l,bake(d){i.bakeDetail(d),i.bakeHeight(d,u)},dispose:i.dispose,field:i,probe:s,uniforms:a}}function ya({field:t,probe:e,uniforms:a}){const i=new _t({roughness:.92}),s=()=>t.toFieldUV(Pe.xz);return i.positionNode=te(()=>{const u=t.sampleHeight(s()).sub(e.uniforms.base).mul(e.uniforms.scale);return P(Pe.x.mul(e.uniforms.extent),u,Pe.z.mul(e.uniforms.extent))})(),i.normalNode=te(()=>{const u=e.uniforms.scale.div(e.uniforms.extent),l=t.sampleSlope(s()).mul(u);return P(l.x.negate(),1,l.y.negate()).normalize()})(),i.colorNode=te(()=>{const u=t.sampleData(s()),l=t.detailAt(s()).x;return B(na({breakup:l,erosion:u.erosion,height:u.height,normalY:u.normal.y,occlusion:u.erosion.add(.5).clamp(0,1),ridgemap:u.ridgemap,trees:u.trees,uniforms:a}),1)})(),i}const Ce="Ocean Waves",Be="Mountain",Dt={Bret:{model:"bret",parts:["inner","outer"]},"Bret Inner":{model:"bret",parts:["inner"]},Reversal:{model:"reversal",parts:["inner","outer"]},"Reversal Inner":{model:"reversal",parts:["inner"]}},Sa=["Torus","Torus Knot","Sphere","Ribbon"],tt=[Ce,Be,...Sa,...Object.keys(Dt)];function wa(t){switch(t){case"Torus Knot":return new Gt(7,1.9,320,48);case"Sphere":return new Wt(9,128,96);case"Ribbon":return new Ot(9,9,7,128,24,!0);default:return new Et(9,3.4,64,220)}}function ba(t){t.updateWorldMatrix(!0,!1);const e=t.geometry.clone();return e.applyMatrix4(t.matrixWorld),e}const ae="Water Cycle",za=`${ae}.Camera`,je=`${ae}.Mountain`,Ue=`${ae}.Ocean`,Ct=`${ae}.Target`,Da=["Hidden","Foam Only","Full"],qe=t=>t(`${Ct}.targetMode`)===Ce,C=t=>t(`${Ct}.targetMode`)===Be,Z=t=>!qe(t)&&!C(t),Fe=t=>C(t)&&t(`${je}.mountainDisplayMode`)!=="Hidden",at=t=>C(t)&&t(`${je}.mountainShape`)==="Range",rt=t=>C(t)&&t(`${je}.mountainShape`)!=="Range",O=t=>qe(t)&&t(`${Ue}.oceanDisplayMode`)!=="Hidden",He=t=>qe(t)&&t(`${Ue}.oceanDisplayMode`)==="Full",me=t=>He(t)&&t(`${Ue}.oceanPaletteMode`)==="Custom",Ca=["Hidden","Full"],Bt={Monochrome:{ambientColor:"#2a2a2a",cliffColor:"#1a1a1a",dirtColor:"#333333",grass1Color:"#242424",grass2Color:"#3d3d3d",sandColor:"#4d4d4d",sunColor:"#ffffff",treeColor:"#141414",waterColor:"#000000",waterShoreColor:"#0a0a0a"},Reference:{ambientColor:_.ambient,cliffColor:_.cliff,dirtColor:_.dirt,grass1Color:_.grass1,grass2Color:_.grass2,sandColor:_.sand,sunColor:_.sun,treeColor:_.tree,waterColor:_.water,waterShoreColor:_.waterShore}};function Ba(t={}){return{mountainDisplayMode:{label:"Mountain Surface",options:Ca,render:C,value:t.mountainDisplayMode??"Hidden"},mountainShape:{label:"Shape",options:Qe,render:C,value:t.mountainShape??Qe[0]},mountainPalette:{label:"Palette",options:Object.keys(Bt),render:Fe,value:t.mountainPalette??"Monochrome"},mountainMeshResolution:{label:"Mesh Resolution",max:1024,min:64,render:Fe,step:32,value:t.mountainMeshResolution??512},mountainFieldResolution:{label:"Field Resolution",options:[512,1024,2048],render:C,value:t.mountainFieldResolution??1024},mountainExtent:{label:"Extent",max:400,min:40,render:C,step:1,value:t.mountainExtent??140},mountainRelief:{label:"Relief",max:400,min:20,render:C,step:1,value:t.mountainRelief??140},mountainBaseHeight:{label:"Sea Level",max:.6,min:.3,render:C,step:.005,value:t.mountainBaseHeight??.4},mountainFrequency:{label:"Range Frequency",max:8,min:.5,render:at,step:.1,value:t.mountainFrequency??2.2},mountainAmplitude:{label:"Range Amplitude",max:.3,min:.02,render:at,step:.005,value:t.mountainAmplitude??.125},peakRadius:{label:"Peak Radius",max:.5,min:.1,render:rt,step:.005,value:t.peakRadius??.35},peakAmplitude:{label:"Peak Amplitude",max:.3,min:.02,render:rt,step:.005,value:t.peakAmplitude??.1},mountainTreeline:{label:"Treeline",max:.6,min:.3,render:Fe,step:.005,value:t.mountainTreeline??.465},erosionScale:{label:"Erosion Scale",max:.6,min:.02,render:C,step:.005,value:t.erosionScale??.15},erosionStrength:{label:"Erosion Strength",max:.6,min:0,render:C,step:.005,value:t.erosionStrength??.22},erosionGullyWeight:{label:"Gully Weight",max:1,min:0,render:C,step:.01,value:t.erosionGullyWeight??.5},erosionDetail:{label:"Erosion Detail",max:4,min:.2,render:C,step:.05,value:t.erosionDetail??1.5},erosionOctaves:{label:"Erosion Octaves",max:8,min:1,render:C,step:1,value:t.erosionOctaves??5}}}function Ra({config:t,onReady:e}){const a=H(n=>n.gl),i=H(n=>n.scene),s=x.useRef(null),u=x.useRef(null),{mountain:l}=t,d=l.fieldResolution,r=x.useMemo(()=>{const n=new ye(1,1,l.meshResolution,l.meshResolution);return n.rotateX(-Math.PI/2),n},[l.meshResolution]);return x.useEffect(()=>{if(!a?.isWebGPURenderer)return;const n=xa({palette:Bt,resolution:d}),c=ya(n),f=new J(r,c);return f.frustumCulled=!1,i.add(f),u.current=null,s.current={material:c,mesh:f,runtime:n},e?.({probe:n.probe}),()=>{s.current=null,e?.(null),i.remove(f),c.dispose(),n.dispose()}},[r,a,e,d,i]),De(()=>{const{current:n}=s;if(!n)return;n.runtime.applyConfig(l),n.mesh.visible=l.visible;const c=ga(l);u.current!==c&&(u.current=c,n.runtime.bake(a))}),null}const Ma=x.memo(Ra);function Ta({renderTarget:t,simulation:e}){const a=o(.55),i=o(1),s=new ht(-70,70,70,-70,.1,400);s.position.set(0,200,0),s.lookAt(0,0,0);const u=new vt,l=new ye(1,1);l.rotateX(-Math.PI/2);const d=new gt({color:0,depthTest:!1,depthWrite:!1,opacity:.06,transparent:!0}),r=new J(l,d);u.add(r);const n=e.positionBuffer.toAttribute(),c=e.motionBuffer.toAttribute(),f=n.w.greaterThan(.5).and(n.w.lessThan(1.5)),m=new re;m.positionNode=P(n.x.add(be.x.mul(a)),0,n.z.add(be.z.mul(a))),m.colorNode=zt().sub(.5).length().mul(2).oneMinus().saturate().pow(2).mul(Y(f,j(1),j(0))).mul(c.w.mul(-1.2).exp()).mul(i),m.blending=xt,m.depthTest=!1,m.depthWrite=!1,m.forceSinglePass=!0,m.transparent=!0;const h=new ye(1,1);h.rotateX(-Math.PI/2);const g=new J(h,m);return g.frustumCulled=!1,g.renderOrder=1,u.add(g),{applyConfig(p,S){const T=p.impactAreaSize*.5;s.left=-T,s.right=T,s.top=T,s.bottom=-T,s.updateProjectionMatrix(),r.scale.set(p.impactAreaSize,p.impactAreaSize,1),d.opacity=p.impactFoamDecay,a.value=p.impactDotSize,i.value=p.impactDotStrength,g.count=S},clear(p){const S=p.getRenderTarget?.()||null;p.setRenderTarget(t),p.clear(!0,!0,!0),p.setRenderTarget(S)},dispose(){u.remove(r),u.remove(g),l.dispose(),d.dispose(),h.dispose(),m.dispose()},render(p){const S=p.getRenderTarget?.()||null;p.setRenderTarget(t),p.render(u,s),p.setRenderTarget(S)}}}function Pa(){const t=o(new w(0,60,0)),e=o(9),a=o(.42),i=o(1.8),s=o(95),u=o(1.6),l=o(.08);return{applyConfig:(n,c)=>{n&&(t.value.set(n.x+Math.sin(c)*n.driftRadius,n.height,n.z+Math.sin(c*.73)*n.driftRadius),e.value=n.radius,a.value=n.spread,i.value=n.softness,s.value=n.reach,l.value=n.ambient,u.value=n.intensity*(1+Math.sin(c*1.31)*n.pulse))},evaluate:n=>{const c=n.sub(t),f=c.y.negate().max(0),m=e.add(f.mul(a)),h=c.xz.length().div(m.max(.001)).oneMinus().saturate().pow(i);return l.add(h.mul(f.div(s).oneMinus().saturate()).mul(u))},origin:t}}function ka({lightCone:t,simulation:e}){const a={streakLength:o(.9),streakWidth:o(.045),opacity:o(.5),stretchSpeed:o(6),tint:o(new de("#d5e7f0")),edgeFade:o(.55)},i=e.positionBuffer.toAttribute(),s=e.motionBuffer.toAttribute(),u=e.anchorBuffer.toAttribute(),l=i.xyz,d=u.z,r=X(.6,1.4,d),n=a.streakWidth.mul(r),c=s.xyz.length().div(a.stretchSpeed.max(.001)).saturate(),f=a.streakLength.mul(r).mul(c).max(n),m=te(()=>{const M=$e.mul(B(s.xyz,0)).xy.toVar(),L=Y(M.length().lessThan(1e-4),Ge(0,1),M.normalize()).toVar(),V=Ge(L.y,L.x.negate()),W=$e.mul(B(l,1)).toVar(),pe=V.mul(be.x.mul(n)).add(L.mul(be.y.mul(f)));return oa.mul(B(W.xy.add(pe),W.z,W.w))}),h=l.y.div(e.uniforms.sinkDepth.negate()).oneMinus().saturate().pow(1.5),g=sa(a.edgeFade.min(.999),1,l.xz.length().div(e.uniforms.bounds.mul(.5))).oneMinus(),p=la(t.evaluate(l).mul(h).mul(g)),S=zt(),T=S.x.sub(.5).abs().mul(2).oneMinus().pow(1.5).mul(S.y.sub(.5).abs().mul(2).oneMinus().pow(.5)).mul(X(.5,1.4,S.y)).saturate(),R=new re;return R.vertexNode=m(),R.colorNode=a.tint.mul(T).mul(p).mul(a.opacity),R.blending=xt,R.depthWrite=!1,R.forceSinglePass=!0,R.side=yt,R.transparent=!0,{applyConfig:M=>{a.streakLength.value=M.streakLength,a.streakWidth.value=M.streakWidth,a.opacity.value=M.opacity,a.stretchSpeed.value=M.stretchSpeed,a.edgeFade.value=M.edgeFade,a.tint.value.set(M.tint)},material:R,uniforms:a}}const Ie=0,Aa=1,it=2;function Fa({capacity:t,probe:e}){const a={bounds:o(140),ceiling:o(60),spawnRange:o(40),fallSpeed:o(26),speedJitter:o(.4),windX:o(.8),windZ:o(0),catchDepth:o(3),surfaceLifeMin:o(.6),surfaceLifeMax:o(2.5),slideGravity:o(18),slideDrag:o(2),slopeRelease:o(1.1),airDrag:o(1.1),gravity:o(20),sinkDepth:o(26),timeScale:o(1)},i=ke(t,"vec4"),s=ke(t,"vec4"),u=ke(t,"vec4"),l=(c,f)=>Ze(b.mul(y(64)).add(y(c).mul(y(8))).add(y(f))),d=c=>P(l(c,1).sub(.5).mul(a.bounds),a.ceiling.add(l(c,2).mul(a.spawnRange)),l(c,3).sub(.5).mul(a.bounds)),r=te(()=>{const c=Ze(b).mul(4096).floor(),f=d(c).toVar();f.y.assign(l(c,8).mul(a.ceiling.add(a.spawnRange)).sub(a.ceiling.mul(.15))),i.element(b).assign(B(f,Ie)),s.element(b).assign(B(0,0,0,0)),u.element(b).assign(B(0,0,l(c,4),c))})().compute(t),n=te(()=>{const c=i.element(b),f=s.element(b),m=u.element(b),h=c.xyz.toVar(),g=c.w.toVar(),p=f.xyz.toVar(),S=f.w.toVar(),T=m.xy.toVar(),R=m.z.toVar(),ne=m.w.toVar(),M=a.timeScale.toVar(),L=ca.mul(M.abs()).min(.05).toVar(),V=L.mul(M.sign()).toVar(),W=M.lessThan(0),pe=()=>{const z=d(ne.add(1)).toVar();S.assign(0),ne.addAssign(1),R.assign(l(ne,4)),se(W,()=>{g.assign(it),z.y.assign(a.sinkDepth.negate()),p.assign(P(0,a.fallSpeed.negate(),0))}).Else(()=>{g.assign(Ie)}),h.assign(z)},Xe=(z,A)=>{g.assign(Aa),S.assign(A),p.assign(P(0,0,0)),T.assign(h.xz.mul(2).sub(z.xz)),h.assign(e.sample(T).xyz)},Ye=()=>Y(W,h.y.greaterThan(a.ceiling.add(a.spawnRange)),h.y.lessThan(a.sinkDepth.negate()));se(g.lessThan(.5),()=>{p.assign(P(a.windX,a.fallSpeed.mul(X(a.speedJitter.oneMinus(),1,R)).negate(),a.windZ)),h.addAssign(p.mul(V));const z=e.sample(h.xz).toVar(),A=a.catchDepth.max(p.y.abs().mul(L).mul(1.5));se(M.greaterThan(0).and(z.w.greaterThan(.5)).and(h.y.lessThan(z.y)).and(h.y.greaterThan(z.y.sub(A))),()=>{Xe(z,j(0))}).ElseIf(Ye(),pe)}).ElseIf(g.lessThan(1.5),()=>{S.addAssign(V);const z=e.slope(T).toVar(),A=p.xz.sub(z.mul(a.slideGravity.mul(V))).mul(a.slideDrag.mul(L).negate().exp()).toVar();T.addAssign(A.mul(V));const U=e.sample(T).toVar();h.assign(U.xyz),p.assign(P(A.x,z.dot(A),A.y));const Re=X(a.surfaceLifeMin,a.surfaceLifeMax,R);se(U.w.lessThan(.5).or(z.length().greaterThan(a.slopeRelease)).or(Y(W,S.lessThan(0),S.greaterThan(Re))),()=>{g.assign(Y(W,j(Ie),j(it))),S.assign(0)})}).Else(()=>{S.addAssign(V);const z=a.airDrag.mul(L).negate().exp(),A=X(Ge(a.windX,a.windZ),p.xz,z);p.assign(P(A.x,p.y.sub(a.gravity.mul(L)).max(a.fallSpeed.negate()),A.y)),h.addAssign(p.mul(V));const U=e.sample(h.xz).toVar(),Re=a.catchDepth.max(p.y.abs().mul(L).mul(1.5));se(W.and(U.w.greaterThan(.5)).and(h.y.greaterThan(U.y)).and(h.y.lessThan(U.y.add(Re))),()=>{Xe(U,X(a.surfaceLifeMin,a.surfaceLifeMax,R))}).ElseIf(Ye(),pe)}),c.assign(B(h,g)),f.assign(B(p,S)),m.assign(B(T,R,ne))})().compute(t);return{anchorBuffer:u,init:r,motionBuffer:s,positionBuffer:i,uniforms:a,update:n}}const Le=1e6,Ia=12e4;function nt(t,e){return Math.max(1e3,Math.min(e,Math.floor(t||1e3)))}function La({config:t,surface:e}){const a=H(l=>l.gl),i=H(l=>l.scene),s=x.useRef(null),u=x.useRef(0);return x.useEffect(()=>{if(!a?.isWebGPURenderer||!e?.probe)return;const l=Fa({capacity:Le,probe:e.probe}),d=Pa(),r=ka({lightCone:d,simulation:l}),n=e.impactFoamRT?Ta({renderTarget:e.impactFoamRT,simulation:l}):null,c=new J(new ye(1,1),r.material);return c.frustumCulled=!1,c.count=nt(t?.rain?.dropCount,Le),i.add(c),n?.clear(a),a.compute(l.init),s.current={drops:c,impactFoam:n,lightCone:d,rain:r,simulation:l},()=>{s.current=null,i.remove(c),c.geometry.dispose(),r.material.dispose(),n?.dispose()}},[a,i,e]),De((l,d)=>{const r=s.current;if(!r)return;const{light:n,ocean:c,rain:f}=t,m=f.enabled!==!1;u.current+=d*n.driftSpeed,r.lightCone.applyConfig(n,u.current),r.rain.applyConfig(f);const{uniforms:h}=r.simulation;Object.keys(h).forEach(p=>{f[p]!==void 0&&(h[p].value=f[p])});const g=nt(f.dropCount,Le);r.drops.count=g,r.drops.visible=m,r.simulation.update.count=g,m&&a.compute(r.simulation.update),!(!r.impactFoam||!c.visible)&&(r.impactFoam.applyConfig(c,Math.min(g,Ia)),r.impactFoam.render(a))}),null}const _a=x.memo(La);function Ea(t){const e=da(),a=fa();return x.useMemo(()=>{const i=Dt[t];if(!i)return null;const s=i.model==="bret"?e:a;return i.parts.map(u=>s[u])},[e,t,a])}function Oa(){const t=new re;return t.colorNode=X(P(.04,.06,.09),P(.34,.44,.54),Ne.y.mul(.5).add(.5)),t.opacity=.45,t.transparent=!0,t.depthWrite=!1,t.side=yt,t}const ot=400;function Wa({resolution:t=1024}){const e=o(60),a=new St(t,t);a.texture.type=Se,a.texture.magFilter=E,a.texture.minFilter=E,a.texture.generateMipmaps=!1,a.texture.wrapS=we,a.texture.wrapT=we,a.texture.colorSpace=Nt;const i=new ht(-1,1,1,-1,.1,ot*2);i.position.set(0,ot,0),i.rotation.set(-Math.PI/2,0,0);const s=new vt,u=new re;u.fragmentNode=B(ua.y,Ne.x,Ne.z,1),u.fog=!1,s.overrideMaterial=u;const l=r=>{const n=r.div(e).toVar(),c=n.abs().toVar(),f=D(a.texture,n.add(.5)).toVar(),m=c.x.max(c.y).lessThan(.5);return B(f.xyz,Y(m,f.w,j(0)))},d=r=>{const n=r*.5;e.value=r,i.left=-n,i.right=n,i.top=n,i.bottom=-n,i.updateProjectionMatrix()};return d(e.value),{scene:s,setArea:d,sample:r=>{const n=l(r).toVar();return B(r.x,n.x,r.y,n.w)},slope:r=>{const n=l(r).yz.toVar(),c=n.dot(n).oneMinus().max(.02).sqrt();return n.div(c).negate()},bake(r){const n=r.getRenderTarget?.()||null,c=r.getClearAlpha();r.setClearAlpha(0),r.setRenderTarget(a),r.render(s,i),r.setRenderTarget(n),r.setClearAlpha(c)},dispose(){u.dispose(),a.dispose()}}}const Ga=1024,Na=22;function Ha(t){const e=new Ht;t.forEach(i=>{i.computeBoundingBox(),e.union(i.boundingBox)});const a=e.getBoundingSphere(new wt);return{centre:e.getCenter(new w),fit:Na/Math.max(a.radius*2,1e-4)}}function st(t,e,{centre:a,fit:i}){const s=new ge;t.forEach(d=>{const r=new J(d,e);r.position.copy(a).negate(),s.add(r)}),s.scale.setScalar(i);const u=new ge,l=new ge;return u.add(s),l.add(u),{pivot:l,apply(d,r){u.rotation.x=d.tilt,l.rotation.y=r,l.position.y=d.height,l.scale.setScalar(d.scale)}}}function Va({config:t,onReady:e}){const a=H(r=>r.gl),i=H(r=>r.scene),s=x.useRef(null),u=x.useRef(0),{mode:l}=t.target,d=Ea(l);return x.useEffect(()=>{if(!a?.isWebGPURenderer)return;const r=d?d.map(ba):[wa(l)],n=Ha(r),c=Wa({resolution:Ga}),f=new gt,m=Oa(),h=st(r,f,n),g=st(r,m,n);return g.pivot.visible=!1,g.pivot.renderOrder=-1,c.scene.add(h.pivot),i.add(g.pivot),s.current={baked:h,ghost:g,probe:c},e?.({probe:c}),()=>{s.current=null,e?.(null),i.remove(g.pivot),r.forEach(p=>p.dispose()),f.dispose(),m.dispose(),c.dispose()}},[a,l,d,e,i]),De((r,n)=>{const c=s.current;if(!c)return;const{target:f}=t;u.current+=n*f.spinSpeed,c.baked.apply(f,u.current),c.ghost.apply(f,u.current),c.ghost.pivot.visible=f.reveal===!0,c.probe.setArea(f.probeArea),c.probe.bake(a)}),null}const ja=x.memo(Va);class Ua{constructor(e){this.params=e,this.init(e)}destroy(){this.params.group.remove(this.mesh),this.geometry.dispose()}hide(){this.mesh.visible=!1}show(){this.mesh.visible=!0}init(e){this.geometry=new Vt,this.mesh=new J(this.geometry,e.material);const a=new w(e.offset.x,e.offset.y);a.applyMatrix4(e.transform),this.geometry.boundingSphere=new wt(a,e.lod>3?e.width*1.75:e.width*3),this.mesh.castShadow=!1,this.mesh.layers.set(e.layer),this.mesh.receiveShadow=!0,e.group.add(this.mesh)}rebuildMeshFromData(e){this.geometry.setAttribute("position",new Me(e.positions,3)),this.geometry.setAttribute("normal",new Me(e.normals,3)),this.geometry.setAttribute("vindex",new Je(e.vindices,1)),this.geometry.setAttribute("width",new Me(e.width,1)),this.geometry.setAttribute("lod",new Je(e.lod,1)),this.geometry.setIndex(new jt(e.indices,1)),this.geometry.attributes.position.needsUpdate=!0,this.geometry.attributes.normal.needsUpdate=!0,this.geometry.attributes.vindex.needsUpdate=!0,this.geometry.attributes.width.needsUpdate=!0,this.geometry.attributes.lod.needsUpdate=!0}}const Q=new w,lt=new w,_e=new w,ct=new w,I=new w,ut=new w;function qa(t){const e=[];for(let a=0;a<t;a+=1)for(let i=0;i<t;i+=1)e.push(a*(t+1)+i,(a+1)*(t+1)+i+1,a*(t+1)+i+1),e.push((a+1)*(t+1)+i,(a+1)*(t+1)+i+1,a*(t+1)+i);return e}function Xa(t,e){const a=new Array(t.length).fill(0);for(let i=0;i<e.length;i+=3){const s=e[i]*3,u=e[i+1]*3,l=e[i+2]*3;lt.fromArray(t,s),_e.fromArray(t,u),ct.fromArray(t,l),I.subVectors(ct,_e),ut.subVectors(lt,_e),I.cross(ut),a[s]+=I.x,a[u]+=I.x,a[l]+=I.x,a[s+1]+=I.y,a[u+1]+=I.y,a[l+1]+=I.y,a[s+2]+=I.z,a[u+2]+=I.z,a[l+2]+=I.z}return a}function Ya({lod:t,offset:e,resolution:a,width:i,worldMatrix:s}){const u=[],l=[],d=[],r=[],n=i/2;let c=0;for(let h=0;h<=a;h+=1){const g=i*h/a;for(let p=0;p<=a;p+=1){const S=i*p/a;Q.set(g-n,S-n,0),Q.add(e),Q.applyMatrix4(s),u.push(Q.x,Q.y,Q.z),l.push(c),d.push(i),r.push(t),c+=1}}const f=qa(a),m=Xa(u,f);return{indices:Uint32Array.from(f),lod:Uint32Array.from(r),normals:Float32Array.from(m),positions:Float32Array.from(u),vindices:Uint32Array.from(l),width:Float32Array.from(d)}}const Ja=15,Ka=36,Rt=ie("vec3","rowItAloneDisplacedPosition"),Mt=ie("vec3","rowItAloneMorphedPosition"),Tt=ie("vec3","rowItAloneCascadeScales"),$a=ie("vec2","rowItAloneTexelCoord0"),Za=ie("vec2","rowItAloneTexelCoord1"),Qa=ie("vec2","rowItAloneTexelCoord2"),er=k(`

    fn WGSLPosition(
        displacement0: texture_2d<f32>,
        displacement1: texture_2d<f32>,
        displacement2: texture_2d<f32>,
        cameraPosition: vec3<f32>,
        time: f32,
        position: vec3<f32>,
        vindex: i32,
        minLodRadius: f32,
        gridResolution: f32,
        lod: f32,
        width: f32,
        waveLengths: vec3<f32>,
        ifftResolution: f32,
        lodScale: f32,
        morphBlend: f32
    ) -> vec4<f32> {

        var morphValue: f32 = getMorphValue(cameraPosition, position, minLodRadius, lod) * morphBlend;
        var morphedVertex: vec2<f32> = morphVertex(position, morphValue, f32(vindex), gridResolution, width);
        var morphedPosition: vec3<f32> = vec3<f32>(morphedVertex.x, 0, morphedVertex.y);

        var viewVector = cameraPosition - position;
        var viewDist = max(length(viewVector), 0.0001);

        var lod0 = min(lodScale * waveLengths.x / viewDist, 1.0);
        var lod1 = min(lodScale * waveLengths.y / viewDist, 1.0);
        var lod2 = min(lodScale * waveLengths.z / viewDist, 1.0);

        var localTexelCoord0: vec2<f32> = ifftResolution * morphedPosition.xz / waveLengths.x;
        var localTexelCoord1: vec2<f32> = ifftResolution * morphedPosition.xz / waveLengths.y;
        var localTexelCoord2: vec2<f32> = ifftResolution * morphedPosition.xz / waveLengths.z;

        var displacement_0: vec4<f32> = InterpolateBilinear(displacement0, localTexelCoord0, ifftResolution) * lod0;
        var displacement_1: vec4<f32> = InterpolateBilinear(displacement1, localTexelCoord1, ifftResolution) * lod1;
        var displacement_2: vec4<f32> = InterpolateBilinear(displacement2, localTexelCoord2, ifftResolution) * lod2;

        var displacedPosition: vec3<f32> = morphedPosition + (displacement_0.rgb + displacement_1.rgb + displacement_2.rgb);

        varyings.rowItAloneCascadeScales = vec3<f32>(lod0, lod1, lod2);
        varyings.rowItAloneDisplacedPosition = displacedPosition;
        varyings.rowItAloneMorphedPosition = morphedPosition;
        varyings.rowItAloneTexelCoord0 = localTexelCoord0;
        varyings.rowItAloneTexelCoord1 = localTexelCoord1;
        varyings.rowItAloneTexelCoord2 = localTexelCoord2;

        return vec4<f32>(displacedPosition, 1.0);
    }

    fn InterpolateBilinear(textureInput: texture_2d<f32>, position: vec2<f32>, size: f32) -> vec4<f32> {
        var wrapCoords = fract(position / size) * size;

        var texel00 = vec2<u32>(floor(wrapCoords));
        var texel11 = texel00 + vec2<u32>(1u, 1u);
        var texel01 = vec2<u32>(texel11.x, texel00.y);
        var texel10 = vec2<u32>(texel00.x, texel11.y);

        texel00 = texel00 % u32(size);
        texel01 = texel01 % u32(size);
        texel10 = texel10 % u32(size);
        texel11 = texel11 % u32(size);

        var fractCoords = wrapCoords - vec2<f32>(texel00);

        var value00 = textureLoad(textureInput, texel00, 0);
        var value10 = textureLoad(textureInput, texel01, 0);
        var value01 = textureLoad(textureInput, texel10, 0);
        var value11 = textureLoad(textureInput, texel11, 0);

        var value0 = mix(value00, value10, fractCoords.x);
        var value1 = mix(value01, value11, fractCoords.x);

        return mix(value0, value1, fractCoords.y);
    }

    fn getMorphValue(cameraPosition: vec3<f32>, position: vec3<f32>, minLodRadius: f32, lod: f32) -> f32 {
        var height: f32 = cameraPosition.y - position.y;
        var eyeDist: f32 = distance(position, cameraPosition);
        var phi: f32 = acos(height / max(eyeDist, 0.0001));
        var dist: f32 = sin(phi) * eyeDist;

        var n: f32 = log2(max(eyeDist / minLodRadius, 0.0001));
        var minDist: f32 = 0.0;
        var maxDist: f32 = 0.0;

        if (n <= 0.0) {
            n = 0.0;
            minDist = 0.0;
            maxDist = sin(acos(height / minLodRadius)) * minLodRadius;
        } else {
            n = floor(n);

            if (height <= minLodRadius * pow(2.0, n)) {
                minDist = sin(acos(height / (minLodRadius * pow(2.0, n)))) * minLodRadius * pow(2.0, n);
            }

            maxDist = sin(acos(height / (minLodRadius * pow(2.0, n + 1.0)))) * minLodRadius * pow(2.0, n + 1.0);
            n = n + 1.0;
        }

        var delta: f32 = maxDist - minDist;
        var startpercent: f32 = 0.71;
        var endpercent: f32 = 0.95;

        if (lod == n) {
            return clamp((dist - minDist - delta * startpercent) / ((endpercent - startpercent) * delta), 0.0, 1.0);
        }

        return 1.0;
    }

    fn morphVertex(vertex: vec3<f32>, morphValue: f32, idx: f32, grdRes: f32, width: f32) -> vec2<f32> {
        var rowIdx: f32 = floor(idx / (grdRes + 1.0));
        var colIdx: f32 = idx % (grdRes + 1.0);
        var fractPart = fract(vec2<f32>(rowIdx, colIdx) * 0.5) * 2.0 / vec2<f32>(grdRes) * width;

        if (colIdx != 0.0) {
            return vertex.xz - fractPart * morphValue;
        }

        for (var i: u32 = 0u; f32(i) < grdRes / 2.0; i = i + 1u) {
            if (idx == grdRes + 1.0 + 2.0 * (grdRes + 1.0) * f32(i)) {
                return vertex.xz - vec2<f32>(1.0, 0.0) * width / grdRes * morphValue;
            }
        }

        return vertex.xz;
    }
  `,[Rt,Mt,Tt,$a,Za,Qa]),tr=k(`

    fn WGSLColor(
        cameraPosition: vec3<f32>,
        derivatives0: texture_2d<f32>,
        derivatives1: texture_2d<f32>,
        derivatives2: texture_2d<f32>,
        jacobian0: texture_2d<f32>,
        jacobian1: texture_2d<f32>,
        jacobian2: texture_2d<f32>,
        ifft_sampler0: sampler,
        ifft_sampler1: sampler,
        ifft_sampler2: sampler,
        waveLengths: vec3<f32>,
        foamStrength: f32,
        foamThreshold: f32,
        reveal: f32,
        foamOnly: f32,
        impactFoamTexture: texture_2d<f32>,
        impactFoamStrength: f32,
        impactFoamPatchSize: f32,
        seaColor: vec3<f32>,
        horizonColor: vec3<f32>,
        skyColor: vec3<f32>,
        sunColor: vec3<f32>,
        vMorphedPosition: vec3<f32>,
        vDisplacedPosition: vec3<f32>,
        vCascadeScales: vec3<f32>,
        sunPosition: vec3<f32>,
    ) -> vec4<f32> {

        var vViewVector = vDisplacedPosition - cameraPosition;
        var vViewDist = length(vViewVector);
        var viewDir = normalize(vViewVector);

        var Normal_0: vec4<f32> = textureSample(derivatives0, ifft_sampler0, vMorphedPosition.xz / waveLengths.x) * vCascadeScales.x;
        var Normal_1: vec4<f32> = textureSample(derivatives1, ifft_sampler1, vMorphedPosition.xz / waveLengths.y) * vCascadeScales.y;
        var Normal_2: vec4<f32> = textureSample(derivatives2, ifft_sampler2, vMorphedPosition.xz / waveLengths.z) * vCascadeScales.z;

        var jacobi0: f32 = textureSample(jacobian0, ifft_sampler0, vMorphedPosition.xz / waveLengths.x).x;
        var jacobi1: f32 = textureSample(jacobian1, ifft_sampler1, vMorphedPosition.xz / waveLengths.y).x;
        var jacobi2: f32 = textureSample(jacobian2, ifft_sampler2, vMorphedPosition.xz / waveLengths.z).x;

        var derivatives: vec4<f32> = normalize(Normal_0 + Normal_1 + Normal_2);
        var slope: vec2<f32> = vec2<f32>(derivatives.x / (1.0 + derivatives.z), derivatives.y / (1.0 + derivatives.w));
        var normalOcean: vec3<f32> = normalize(vec3(-slope.x, 1.0, -slope.y));

        var jacobian: f32 = jacobi0 + jacobi1 + jacobi2;
        var impactUV = fract(vMorphedPosition.xz / impactFoamPatchSize + vec2<f32>(0.5));
        var impactFoamRaw = textureSample(impactFoamTexture, ifft_sampler0, impactUV).x;
        var impactWeight = saturate(max(impactFoamRaw * impactFoamStrength - 0.015, 0.0));
        var nativeFoamBias = saturate((-jacobian + foamThreshold) * 0.5 + 0.5);
        var impactJacobianPush = impactWeight * mix(0.08, 0.48, nativeFoamBias);
        var combinedJacobian = jacobian - impactJacobianPush;
        var baseFoamMixFactor: f32 = min(1.0, max(0.0, (-jacobian + foamThreshold) * foamStrength));
        var impactFoamMixFactor: f32 = saturate(impactJacobianPush * 2.4);
        var foamMixFactor: f32 = saturate(baseFoamMixFactor + impactFoamMixFactor);

        if (dot(normalOcean, -viewDir) < 0.0) {
            normalOcean *= -1.0;
        }

        var sunDir: vec3<f32> = normalize(sunPosition);
        var fresnel = fresnelSchlick(0.02, normalOcean, -viewDir, 5.0);
        var specular = specularLight2(normalOcean, sunDir, viewDir, 16.0) * 0.8;
        var reflected = reflect(-viewDir, normalOcean);
        var skyMix = clamp(reflected.y * 0.5 + 0.5, 0.0, 1.0);
        var reflectionColor = mix(horizonColor, skyColor, skyMix);
        reflectionColor += pow(max(dot(reflected, sunDir), 0.0), 96.0) * sunColor * 0.4;
        var refractionColor = seaColor;
        var waterColor = mix(refractionColor, reflectionColor, fresnel);

        var oceanColor = waterColor;
        oceanColor += vec3<f32>(specular);
        oceanColor = mix(oceanColor, vec3<f32>(1.0), foamMixFactor);
        oceanColor = mix(seaColor, oceanColor, vCascadeScales.x);

        let fade = smoothstep(500.0, 4000.0, vViewDist);

        if (foamOnly > 0.5) {
            return vec4<f32>(vec3<f32>(foamMixFactor * (1.0 - fade)), 1.0);
        }

        var finalColor = mix(oceanColor, vec3<f32>(0.0), fade);
        if (reveal > 0.5) {
            let slopeMask = pow(saturate(1.0 - normalOcean.y), 1.2);
            let crestMask = saturate(abs(vDisplacedPosition.y) * 0.75);
            let revealMask = saturate(slopeMask * 1.35 + foamMixFactor * 1.25 + crestMask * 0.8 + fresnel * 0.4);
            let highlightLift = revealMask * 0.55;
            let shapeContrast = mix(0.85, 1.25, revealMask);
            finalColor = min(finalColor * shapeContrast + vec3<f32>(highlightLift), vec3<f32>(1.0));
        }
        return vec4<f32>(finalColor, 1.0);
    }

    fn saturate(value: f32) -> f32 {
        return max(0.0, min(value, 1.0));
    }

    fn specularLight2(N: vec3<f32>, L: vec3<f32>, V: vec3<f32>, e: f32) -> f32 {
        var half_vector = normalize(V - L);
        return pow(max(dot(N, half_vector), 0.0), e);
    }

    fn fresnelSchlick(F: f32, N: vec3<f32>, V: vec3<f32>, exp: f32) -> f32 {
        return F + (1.0 - F) * pow(saturate(1.0 - dot(N, V)), exp);
    }
`),Pt=new Ut(new Uint8Array([0,0,0,255]),1,1);Pt.needsUpdate=!0;class ar{constructor(e){const a={time:o(0),cameraPosition:o(new w),minLodRadius:Ja,gridResolution:o(e.gridResolution??Ka),position:ee("position"),vindex:ee("vindex"),width:ee("width"),lod:ee("lod"),ifftResolution:o(e.ifftResolution),displacement0:D(e.cascades[0].displacement),displacement1:D(e.cascades[1].displacement),displacement2:D(e.cascades[2].displacement),derivatives0:D(e.cascades[0].derivative),derivatives1:D(e.cascades[1].derivative),derivatives2:D(e.cascades[2].derivative),jacobian0:D(e.cascades[0].jacobian),jacobian1:D(e.cascades[1].jacobian),jacobian2:D(e.cascades[2].jacobian),ifft_sampler0:D(e.cascades[0].derivative),ifft_sampler1:D(e.cascades[1].derivative),ifft_sampler2:D(e.cascades[2].derivative),foamStrength:e.foamStrength,foamThreshold:e.foamThreshold,reveal:o(e.reveal??0),foamOnly:o(e.foamOnly??0),impactFoamTexture:D(e.impactFoamTexture??Pt),impactFoamStrength:o(e.impactFoamStrength??.8),impactFoamPatchSize:o(e.impactFoamPatchSize??100),seaColor:o(new de(e.seaColor??"#01040c")),horizonColor:o(new de(e.horizonColor??"#6b9ed1")),skyColor:o(new de(e.skyColor??"#143663")),sunColor:o(new de(e.sunColor??"#ffe6b8")),lodScale:e.lodScale,morphBlend:o(e.morphBlend??1),waveLengths:P(e.cascades[0].params.lengthScale,e.cascades[1].params.lengthScale,e.cascades[2].params.lengthScale),sunPosition:o(e.sunPosition),vMorphedPosition:Mt,vDisplacedPosition:Rt,vCascadeScales:Tt},i=new re;i.positionNode=er(a),i.colorNode=tr(a),i.side=qt,i.colorSpace=bt,i.transparent=!1,this.material=i,this.parameters=a}}const rr=k(`

    fn fragmentShader(
        normal: vec3<f32>,
        position: vec3<f32>,
        cameraPosition: vec3<f32>,
        sunPosition: vec3<f32>,
        mieDirectionalG: f32,
        rayleigh: f32,
        turbidity: f32,
        mieCoefficient: f32,
        elevation: f32,
        up: vec3<f32>,
    ) -> vec4<f32> {

        var sunDirection: vec3<f32> = normalize(sunPosition);
        const lambda = vec3<f32>(680E-9, 550E-9, 450E-9);
        const K = vec3<f32>(0.686, 0.678, 0.666);

        var sunfade = 1.0 - min(max(1.0 - exp((sunPosition.y / 500000.0)), 0.0), 1.0);
        var rayleighCoefficient = rayleigh - (1.0 * (1.0 - sunfade));

        var sunE = sunIntensity(dot(sunDirection, up));
        var betaR = simplifiedRayleigh() * rayleighCoefficient;
        var betaM = totalMie(lambda, K, turbidity) * mieCoefficient;

        var zenithAngle = acos(max(0.0, dot(up, normalize(position - cameraPosition))));
        var sR = rayleighZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
        var sM = mieZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
        var Fex = exp(-(betaR * sR + betaM * sM));
        var cosTheta = dot(normalize(position - cameraPosition), sunDirection);
        var rPhase = rayleighPhase(cosTheta * 0.5 + 0.5);
        var betaRTheta = betaR * rPhase;
        var mPhase = hgPhase(cosTheta, mieDirectionalG);
        var betaMTheta = betaM * mPhase;

        var Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex), vec3<f32>(1.5));
        Lin *= mix(vec3(1.0), pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex, vec3<f32>(0.5)), clamp(pow(1.0 - dot(up, sunDirection), 5.0), 0.0, 1.0));

        var direction = normalize(position - cameraPosition);
        var theta = acos(direction.y);
        var phi = atan(direction.z / direction.x);
        var uv = vec2<f32>(phi, theta) / vec2<f32>(2.0 * pi, pi) + vec2<f32>(0.5, 0.0);
        var L0 = vec3<f32>(0.1) * Fex;
        var sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);

        L0 += (sunE * 19000.0 * Fex) * sundisk;

        var texColor = Lin + L0 + vec3<f32>(0.0, 0.001, 0.0025) * 0.3 + uv.xxx * 0.0;
        texColor *= 0.04;

        var exposure: f32 = 0.025;
        var gamma: f32 = 2.0 - elevation / 90.0;
        var color: vec3<f32> = vec3<f32>(1.0) - exp(-texColor * exposure);

        return vec4<f32>(pow(color, vec3<f32>(1.0 / gamma)) * 1.3, 1.0);
    }

    const pi: f32 = 3.141592653589793238462643383279502884197169;
    const n: f32 = 1.0003;
    const N: f32 = 2.545E25;
    const pn: f32 = 0.035;
    const v: f32 = 4.0;
    const rayleighZenithLength: f32 = 8.4E3;
    const mieZenithLength: f32 = 1.25E3;
    const EE: f32 = 1000.0;
    const sunAngularDiameterCos: f32 = 0.9999566769464484;
    const cutoffAngle: f32 = pi / 1.95;
    const steepness: f32 = 1.5;

    fn simplifiedRayleigh() -> vec3<f32> {
        return 0.0005 / vec3<f32>(94.0, 40.0, 18.0);
    }

    fn rayleighPhase(cosTheta: f32) -> f32 {
        return (3.0 / (16.0 * pi)) * (1.0 + pow(cosTheta, 2.0));
    }

    fn totalMie(lambda: vec3<f32>, K: vec3<f32>, T: f32) -> vec3<f32> {
        var c = (0.2 * T) * 10E-18;
        return 0.434 * c * pi * pow((2.0 * pi) / lambda, vec3<f32>(v - 2.0)) * K;
    }

    fn hgPhase(cosTheta: f32, g: f32) -> f32 {
        return (1.0 / (4.0 * pi)) * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0 * g * cosTheta + pow(g, 2.0), 1.5));
    }

    fn sunIntensity(zenithAngleCos: f32) -> f32 {
        return EE * max(0.0, 1.0 - exp((-(cutoffAngle - acos(zenithAngleCos)) / steepness)));
    }
`);class ir extends J{constructor(){const e={position:ee("position"),normal:ee("normal"),turbidity:o(10),rayleigh:o(3),mieCoefficient:o(.005),mieDirectionalG:o(.7),elevation:o(2),sunPosition:o(new w(0,0,0)),up:o(new w(0,1,0)),cameraPosition:o(new w(0,0,0))},a=new re;a.colorNode=rr(e),a.side=Xt,a.colorSpace=bt,super(new Yt(1,1,1),a),this.parameters=e}}const ue={seaColor:"#01040c",horizonColor:"#6b9ed1",skyColor:"#143663",sunColor:"#ffe6b8"},dt=new w,ft=new w,Ee=new w,Oe=new w,kt=160,At=192,nr=2;function or(t={}){return{patchResolution:Math.max(nr,Math.round(t.patchResolution??At)),patchSize:t.patchSize??kt}}class sr{constructor(e){this.params=e,this.currentConfig=null,this.patch=null,this.patchVisible=!0,this.patchSignature="",this.patchTransform=new Jt().makeRotationX(-Math.PI/2),this.sun=new w}init(){const e=this.currentConfig?.ocean||ue,a=new ar({foamStrength:this.params.waveGenerator.foamStrength,foamThreshold:this.params.waveGenerator.foamThreshold,ifftResolution:this.params.waveGenerator.size,gridResolution:At,lodScale:this.params.waveGenerator.lodScale,reveal:this.currentConfig?.ocean?.reveal?1:0,foamOnly:this.currentConfig?.ocean?.foamOnly?1:0,impactFoamTexture:this.params.impactFoamTexture,impactFoamStrength:this.currentConfig?.ocean?.impactFoamStrength??.8,impactFoamPatchSize:this.currentConfig?.ocean?.impactAreaSize,seaColor:e.seaColor,horizonColor:e.horizonColor,skyColor:e.skyColor,sunColor:e.sunColor,morphBlend:0,cascades:this.params.waveGenerator.cascades,sunPosition:this.sun});this.material=a.material,this.materialParameters=a.parameters,this.group=new ge,this.params.scene.add(this.group),this.params.withSky!==!1&&(this.sky=new ir,this.sky.layers.set(2),this.sky.scale.setScalar(5e5),this.params.scene.add(this.sky)),this.ensurePatch()}ensurePatch(e){const{patchResolution:a,patchSize:i}=or(e),s=`${i}:${a}`;this.patchSignature!==s&&(this.patch?.destroy(),Ee.set(0,0,0),this.patch=new Ua({group:this.group,layer:this.params.layer,lod:0,material:this.material,offset:Ee.clone(),transform:this.patchTransform,width:i}),this.patch.rebuildMeshFromData(Ya({lod:0,offset:Ee,resolution:a,width:i,worldMatrix:this.patchTransform})),this.patch.mesh.visible=this.patchVisible,this.materialParameters.gridResolution.value=a,this.patchSignature=s)}applyConfig(e){if(this.currentConfig=e,!!e)if(this.ensurePatch(e.ocean),this.patchVisible=e.ocean.visible??!0,this.material.wireframe=e.ocean.wireframe,this.materialParameters.reveal.value=e.ocean.reveal?1:0,this.materialParameters.foamOnly.value=e.ocean.foamOnly?1:0,this.materialParameters.impactFoamStrength.value=e.ocean.impactFoamStrength??.8,this.materialParameters.impactFoamPatchSize.value=e.ocean.impactAreaSize??kt,this.materialParameters.seaColor.value.set(e.ocean.seaColor||ue.seaColor),this.materialParameters.horizonColor.value.set(e.ocean.horizonColor||ue.horizonColor),this.materialParameters.skyColor.value.set(e.ocean.skyColor||ue.skyColor),this.materialParameters.sunColor.value.set(e.ocean.sunColor||ue.sunColor),this.params.waveGenerator.setFoamStrength(e.foam.foamStrength),this.params.waveGenerator.setFoamThreshold(e.foam.foamThreshold),this.params.waveGenerator.setLodScale(e.ocean.lodScale),this.sky&&e.sky){this.sky.parameters.rayleigh.value=e.sky.rayleigh,this.sky.parameters.turbidity.value=e.sky.turbidity,this.sky.parameters.mieCoefficient.value=e.sky.mieCoefficient,this.sky.parameters.mieDirectionalG.value=e.sky.mieDirectionalG,this.sky.parameters.elevation.value=e.sky.elevation,this.sky.parameters.up.value.fromArray(e.sky.up);const a=Ke.degToRad(90-e.sky.elevation),i=Ke.degToRad(e.sky.azimuth);this.sun.setFromSphericalCoords(1,a,i),this.sky.parameters.sunPosition.value.copy(this.sun),typeof e.sky.exposure=="number"&&(this.params.renderer.toneMappingExposure=e.sky.exposure)}else this.sun.set(0,1,0),this.params.renderer.toneMappingExposure=1}update(e=this.params.camera){this.params.camera=e,this.params.camera.getWorldPosition(dt),this.params.scene.getWorldPosition(ft),Oe.subVectors(dt,ft),this.sky?.parameters.cameraPosition.value.copy(Oe),this.patch&&(this.patch.mesh.visible=this.patchVisible,this.patch.mesh.material.wireframe=this.currentConfig?.ocean?.wireframe??!1),this.materialParameters.cameraPosition.value.copy(Oe),this.materialParameters.sunPosition.value.copy(this.sun)}dispose(){this.patch?.destroy(),this.patch=null,this.patchSignature="",this.params.scene.remove(this.group),this.sky&&(this.params.scene.remove(this.sky),this.sky.geometry.dispose(),this.sky.material.dispose(),this.sky=null),this.material.dispose()}}const lr=k(`

    fn computeWGSL(
        butterflyBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        index: u32,
        N: f32,
    ) -> void {

        var logN = log2(N);
        var posX = f32(index) % logN;
        var posY = floor(f32(index) / logN);

        const PI: f32 = 3.1415926;

        var k: f32 = (posY * N / pow(2, posX + 1)) % N;
        var twiddle: vec2<f32> = vec2<f32>(cos(2 * PI * k / N), sin(2 * PI * k / N));

        var butterflyspan = pow(2, f32(posX));
        let idx = u32(posY) * u32(logN) + u32(posX);
        var butterflywing: i32 = select(0, 1, posY % pow(2, posX + 1) < pow(2, posX));
        var uY = u32(posY);

        if (u32(posX) == 0) {
            if (butterflywing == 1) {
                butterflyBuffer[idx] = vec4f(twiddle, reverseBits(uY, N), reverseBits(uY + 1, N));
            } else {
                butterflyBuffer[idx] = vec4f(twiddle, reverseBits(uY - 1, N), reverseBits(uY, N));
            }
        } else {
            if (butterflywing == 1) {
                butterflyBuffer[idx] = vec4f(twiddle, posY, posY + butterflyspan);
            } else {
                butterflyBuffer[idx] = vec4f(twiddle, posY - butterflyspan, posY);
            }
        }
    }

    fn reverseBits(index: u32, N: f32) -> f32 {
        var bitReversedIndex: u32 = 0u;
        var numBits: u32 = u32(log2(N));

        for (var i: u32 = 0u; i < numBits; i = i + 1u) {
            bitReversedIndex = bitReversedIndex | (((index >> i) & 1u) << (numBits - i - 1u));
        }

        return f32(bitReversedIndex);
    }
`),cr=k(`

    fn computeWGSL(
        spectrumBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        waveDataBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        writeDxDzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        writeDyDxzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        writeDyxDyzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        writeDxxDzzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        index: u32,
        size: u32,
        time: f32,
    ) -> void {

        var wave = waveDataBuffer[index];
        var h0 = spectrumBuffer[index];

        var phase = wave.w * time;
        var exponent = vec2<f32>(cos(phase), sin(phase));

        var h = complexMult(h0.xy, exponent) + complexMult(h0.zw, vec2<f32>(exponent.x, -exponent.y));
        var ih = vec2<f32>(-h.y, h.x);

        var displacementX = ih * wave.x * wave.y;
        var displacementY = h;
        var displacementZ = ih * wave.z * wave.y;

        var displacementX_dx = -h * wave.x * wave.x * wave.y;
        var displacementY_dx = ih * wave.x;
        var displacementZ_dx = -h * wave.x * wave.z * wave.y;

        var displacementY_dz = ih * wave.z;
        var displacementZ_dz = -h * wave.z * wave.z * wave.y;

        writeDxDzBuffer[index] = vec2<f32>(displacementX.x - displacementZ.y, displacementX.y + displacementZ.x);
        writeDyDxzBuffer[index] = vec2<f32>(displacementY.x - displacementZ_dx.y, displacementY.y + displacementZ_dx.x);
        writeDyxDyzBuffer[index] = vec2<f32>(displacementY_dx.x - displacementY_dz.y, displacementY_dx.y + displacementY_dz.x);
        writeDxxDzzBuffer[index] = vec2<f32>(displacementX_dx.x - displacementZ_dz.y, displacementX_dx.y + displacementZ_dz.x);
    }

    fn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
        return vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);
    }
`),ur=k(`

    fn computeWGSL(
        butterflyBuffer: ptr<storage, array<vec4<f32>>, read>,
        pingpongBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        initBufferIndex: u32,
        index: u32,
        size: u32,
        step: u32,
        logN: u32,
        pingpong: u32,
        workgroupSize: vec2<u32>,
        workgroupId: vec3<u32>,
        localId: vec3<u32>
    ) -> void {

        let pos = workgroupSize.xy * workgroupId.xy + localId.xy;

        let butterflyIndex = pos.x * logN + step;
        let data = butterflyBuffer[butterflyIndex];

        let bufferIndexEven = pos.y * size + u32(data.z);
        let bufferIndexOdd = pos.y * size + u32(data.w);

        let even = select(pingpongBuffer[bufferIndexEven].xy, pingpongBuffer[bufferIndexEven].zw, pingpong == 0u);
        let odd = select(pingpongBuffer[bufferIndexOdd].xy, pingpongBuffer[bufferIndexOdd].zw, pingpong == 0u);

        let H: vec2<f32> = even + multiplyComplex(data.rg, odd);

        pingpongBuffer[index] = vec4<f32>(
            select(pingpongBuffer[index].xy, H, pingpong == 0u),
            select(H, pingpongBuffer[index].zw, pingpong == 0u)
        );
    }

    fn multiplyComplex(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
        return vec2<f32>(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
    }
`),dr=k(`

    fn computeWGSL(
        butterflyBuffer: ptr<storage, array<vec4<f32>>, read>,
        pingpongBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        initBufferIndex: u32,
        index: u32,
        size: u32,
        step: u32,
        logN: u32,
        pingpong: u32,
        workgroupSize: vec2<u32>,
        workgroupId: vec3<u32>,
        localId: vec3<u32>,
    ) -> void {

        let pos = workgroupSize.xy * workgroupId.xy + localId.xy;

        let butterflyIndex = pos.y * logN + step;
        let data = butterflyBuffer[butterflyIndex];

        let bufferIndexEven = u32(data.z) * size + pos.x;
        let bufferIndexOdd = u32(data.w) * size + pos.x;

        let even = select(pingpongBuffer[bufferIndexEven].xy, pingpongBuffer[bufferIndexEven].zw, pingpong == 0u);
        let odd = select(pingpongBuffer[bufferIndexOdd].xy, pingpongBuffer[bufferIndexOdd].zw, pingpong == 0u);

        let H: vec2<f32> = even + multiplyComplex(data.rg, odd);

        pingpongBuffer[index] = vec4<f32>(
            select(pingpongBuffer[index].xy, H, pingpong == 0u),
            select(H, pingpongBuffer[index].zw, pingpong == 0u)
        );
    }

    fn multiplyComplex(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
        return vec2<f32>(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
    }
`),fr=k(`

    fn computeWGSL(
        butterflyBuffer: ptr<storage, array<vec4<f32>>, read>,
        pingpongBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        DxDzBuffer: ptr<storage, array<vec2<f32>>, read>,
        DyDxzBuffer: ptr<storage, array<vec2<f32>>, read>,
        DyxDyzBuffer: ptr<storage, array<vec2<f32>>, read>,
        DxxDzzBuffer: ptr<storage, array<vec2<f32>>, read>,
        initBufferIndex: u32,
        index: u32,
        size: u32,
        step: u32,
        logN: u32,
        workgroupSize: vec2<u32>,
        workgroupId: vec3<u32>,
        localId: vec3<u32>
    ) -> void {

        let pos = workgroupSize.xy * workgroupId.xy + localId.xy;

        let butterflyIndex = pos.x * logN + step;
        let data = butterflyBuffer[butterflyIndex];

        let bufferIndex = pos.y * size + u32(data.z);
        let bufferIndexOdd = pos.y * size + u32(data.w);

        var even = select(DxDzBuffer[bufferIndex], DyDxzBuffer[bufferIndex], initBufferIndex == 1u);
        even = select(even, DyxDyzBuffer[bufferIndex], initBufferIndex == 2u);
        even = select(even, DxxDzzBuffer[bufferIndex], initBufferIndex == 3u);

        var odd = select(DxDzBuffer[bufferIndexOdd], DyDxzBuffer[bufferIndexOdd], initBufferIndex == 1u);
        odd = select(odd, DyxDyzBuffer[bufferIndexOdd], initBufferIndex == 2u);
        odd = select(odd, DxxDzzBuffer[bufferIndexOdd], initBufferIndex == 3u);

        var H: vec2<f32> = even + multiplyComplex(vec2<f32>(data.r, -data.g), odd);

        pingpongBuffer[index] = vec4<f32>(0.0, 0.0, H);
    }

    fn multiplyComplex(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
        return vec2<f32>(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
    }
`),pr=k(`

    fn computeWGSL(
        pingpongBuffer: ptr<storage, array<vec4<f32>>, read>,
        DxDzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        DyDxzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        DyxDyzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        DxxDzzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        initBufferIndex: u32,
        index: u32,
        size: u32,
        workgroupSize: vec2<u32>,
        workgroupId: vec3<u32>,
        localId: vec3<u32>,
    ) -> void {

        let pos = workgroupSize.xy * workgroupId.xy + localId.xy;

        let input = pingpongBuffer[index].xy;
        let output = input * (1.0 - 2.0 * f32((pos.x + pos.y) % 2u));

        DxDzBuffer[index] = select(DxDzBuffer[index], output, initBufferIndex == 0u);
        DyDxzBuffer[index] = select(DyDxzBuffer[index], output, initBufferIndex == 1u);
        DyxDyzBuffer[index] = select(DyxDyzBuffer[index], output, initBufferIndex == 2u);
        DxxDzzBuffer[index] = select(DxxDzzBuffer[index], output, initBufferIndex == 3u);
    }
`),mr=k(`

    fn computeWGSL(
        writeDisplacement: texture_storage_2d<rgba16float, write>,
        writeDerivative: texture_storage_2d<rgba16float, write>,
        writeJacobian: texture_storage_2d<rgba32float, write>,
        DxDzBuffer: ptr<storage, array<vec2<f32>>, read>,
        DyDxzBuffer: ptr<storage, array<vec2<f32>>, read>,
        DyxDyzBuffer: ptr<storage, array<vec2<f32>>, read>,
        DxxDzzBuffer: ptr<storage, array<vec2<f32>>, read>,
        turbulenceBuffer: ptr<storage, array<f32>, read_write>,
        index: u32,
        size: u32,
        lambda: f32,
        deltaTime: f32,
        workgroupSize: vec2<u32>,
        workgroupId: vec3<u32>,
        localId: vec3<u32>,
    ) -> void {

        let pos = workgroupSize.xy * workgroupId.xy + localId.xy;
        let bufferIndex = pos.y * size + pos.x;

        var x = DxDzBuffer[bufferIndex];
        var y = DyDxzBuffer[bufferIndex];
        var z = DyxDyzBuffer[bufferIndex];
        var w = DxxDzzBuffer[bufferIndex];

        var jacobian = (1.0 + lambda * w.x) * (1.0 + lambda * w.y) - y.y * y.y * lambda * lambda;

        var turbulence = turbulenceBuffer[bufferIndex] + deltaTime * 0.5 / max(jacobian, 0.5);
        turbulence = min(jacobian, turbulence);

        textureStore(writeDisplacement, pos, vec4f(lambda * x.x, y.x, lambda * x.y, 0));
        textureStore(writeDerivative, pos, vec4f(z.x, z.y, w.x * lambda, w.y * lambda));
        textureStore(writeJacobian, pos, vec4f(turbulence, 0, 0, 0));
        turbulenceBuffer[bufferIndex] = turbulence;
    }
`),hr=k(`

    fn computeWGSL(
        spectrumBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        waveDataBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        index: u32,
        size: u32,
        waveLength: f32,
        boundaryLow: f32,
        boundaryHigh: f32,
        depth: f32,
        scaleHeight: f32,
        windSpeed: f32,
        windDirection: f32,
        fetch: f32,
        spreadBlend: f32,
        swell: f32,
        peakEnhancement: f32,
        shortWaveFade: f32,
        fadeLimit: f32,
        d_depth: f32,
        d_scaleHeight: f32,
        d_windSpeed: f32,
        d_windDirection: f32,
        d_fetch: f32,
        d_spreadBlend: f32,
        d_swell: f32,
        d_peakEnhancement: f32,
        d_shortWaveFade: f32,
        d_fadeLimit: f32,
    ) -> void {

        var posX = index % size;
        var posY = index / size;
        var xy = vec2<f32>(f32(posX), f32(posY));
        let deltaK = 2.0 * PI / waveLength;
        let nx = f32(posX) - f32(size) / 2.0;
        let nz = f32(posY) - f32(size) / 2.0;
        let k = vec2<f32>(nx, nz) * deltaK;
        let kLength = length(k);

        if (kLength >= boundaryLow && kLength <= boundaryHigh) {
            var kAngle: f32 = atan2(k.y, k.x);
            var alpha = JonswapAlpha(G, fetch, windSpeed);
            var w = frequency(kLength, G, depth);
            var wp = JonswapPeakFrequency(G, fetch, windSpeed);
            var dOmegadk = frequencyDerivative(kLength, G, depth);

            var spectrum: f32 = JONSWAP(w, G, depth, wp, scaleHeight, alpha, peakEnhancement) * directionSpectrum(kAngle, w, wp, swell, windDirection, spreadBlend) * shortWavesFade(kLength, shortWaveFade, fadeLimit);

            if (d_scaleHeight > 0.0) {
                var d_alpha = JonswapAlpha(G, d_fetch, d_windSpeed);
                var d_wp = JonswapPeakFrequency(G, d_fetch, d_windSpeed);

                spectrum = spectrum + JONSWAP(w, G, depth, d_wp, d_scaleHeight, d_alpha, d_peakEnhancement) * directionSpectrum(kAngle, w, d_wp, d_swell, d_windDirection, d_spreadBlend) * shortWavesFade(kLength, d_shortWaveFade, d_fadeLimit);
            }

            var er: f32 = gaussianRandom1(xy);
            var ei: f32 = gaussianRandom2(xy);

            spectrumBuffer[index] = vec4<f32>(vec2<f32>(er, ei) * sqrt(2.0 * spectrum * abs(dOmegadk) / kLength * deltaK * deltaK), 0, 0);
            waveDataBuffer[index] = vec4<f32>(k.x, 1.0 / kLength, k.y, w);
        } else {
            spectrumBuffer[index] = vec4<f32>(0.0);
            waveDataBuffer[index] = vec4<f32>(k.x, 1.0, k.y, 0.0);
        }
    }

    const PI: f32 = 3.141592653589793;
    const G: f32 = 9.81;

    fn JonswapAlpha(g: f32, fetch: f32, windSpeed: f32) -> f32 {
        return 0.076 * pow(g * fetch / pow(windSpeed, 2.0), -0.22);
    }

    fn JonswapPeakFrequency(g: f32, fetch: f32, windSpeed: f32) -> f32 {
        return 22.0 * pow(windSpeed * fetch / pow(g, 2.0), -0.33);
    }

    fn gaussianRandom1(seed: vec2<f32>) -> f32 {
        var nrnd0: f32 = random(seed);
        var nrnd1: f32 = random(seed + 0.1);
        return sqrt(-2.0 * log(max(0.001, nrnd0))) * cos(2.0 * PI * nrnd1);
    }

    fn gaussianRandom2(seed: vec2<f32>) -> f32 {
        var nrnd0: f32 = random(seed);
        var nrnd1: f32 = random(seed + 0.1);
        return sqrt(-2.0 * log(max(0.001, nrnd0))) * sin(2.0 * PI * nrnd1);
    }

    fn random(par: vec2<f32>) -> f32 {
        return fract(sin(dot(par, vec2<f32>(12.9898, 78.233))) * 43758.5453);
    }

    fn frequency(k: f32, g: f32, depth: f32) -> f32 {
        return sqrt(g * k * tanh(min(k * depth, 20.0)));
    }

    fn frequencyDerivative(k: f32, g: f32, depth: f32) -> f32 {
        let th = tanh(min(k * depth, 20.0));
        let ch = cosh(k * depth);
        return g * (depth * k / ch / ch + th) / frequency(k, g, depth) / 2.0;
    }

    fn normalisationFactor(s: f32) -> f32 {
        let s2 = s * s;
        let s3 = s2 * s;
        let s4 = s3 * s;
        if (s < 5.0) {
            return -0.000564 * s4 + 0.00776 * s3 - 0.044 * s2 + 0.192 * s + 0.163;
        }
        return -4.80e-08 * s4 + 1.07e-05 * s3 - 9.53e-04 * s2 + 5.90e-02 * s + 3.93e-01;
    }

    fn cosine2s(theta: f32, s: f32) -> f32 {
        return normalisationFactor(s) * pow(abs(cos(0.5 * theta)), 2.0 * s);
    }

    fn spreadPower(omega: f32, peakOmega: f32) -> f32 {
        if (omega > peakOmega) {
            return 9.77 * pow(abs(omega / peakOmega), -2.5);
        }
        return 6.97 * pow(abs(omega / peakOmega), 5.0);
    }

    fn TMACorrection(omega: f32, g: f32, depth: f32) -> f32 {
        let omegaH = omega * sqrt(depth / g);
        if (omegaH <= 1.0) {
            return 0.5 * omegaH * omegaH;
        }
        if (omegaH < 2.0) {
            return 1.0 - 0.5 * (2.0 - omegaH) * (2.0 - omegaH);
        }
        return 1.0;
    }

    fn directionSpectrum(theta: f32, w: f32, wp: f32, swell: f32, angle: f32, spreadBlend: f32) -> f32 {
        let s = spreadPower(w, wp) + 16.0 * tanh(min(w / wp, 20.0)) * swell * swell;
        return mix(2.0 / PI * cos(theta) * cos(theta), cosine2s(theta - angle, s), spreadBlend);
    }

    fn JONSWAP(w: f32, g: f32, depth: f32, wp: f32, scale: f32, alpha: f32, gamma: f32) -> f32 {
        var sigma: f32 = select(0.07, 0.09, w <= wp);
        var a = exp(-pow(w - wp, 2.0) / (2.0 * pow(sigma * wp, 2.0)));

        return scale * TMACorrection(w, g, depth) * alpha * pow(g, 2.0) * pow(1.0 / w, 5.0) * exp(-1.25 * pow(wp / w, 4.0)) * pow(abs(gamma), a);
    }

    fn shortWavesFade(kLength: f32, shortWaveFade: f32, fadeLimit: f32) -> f32 {
        return (1.0 - fadeLimit) * exp(-pow(shortWaveFade * kLength, 2.0)) + fadeLimit;
    }
`),vr=k(`

    fn computeWGSL(
        spectrumBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        index: u32,
        size: u32,
    ) -> void {

        var idx = ((size - index / size) % size) * size + (size - index % size) % size;

        var spectrumData = spectrumBuffer[index];
        var h0MinusK = spectrumBuffer[idx];

        spectrumBuffer[index] = vec4<f32>(spectrumData.xy, h0MinusK.x, -h0MinusK.y);
    }
`);class gr{constructor(e){this.params=e,this.init(e)}init(e){this.squareSize=e.size**2,this.bufferSize=this.squareSize*4,this.spectrumBuffer=new N(new Float32Array(this.bufferSize),4),this.waveDataBuffer=new N(new Float32Array(this.bufferSize),4),this.initialSpectrum=hr({spectrumBuffer:v(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),waveDataBuffer:v(this.waveDataBuffer,"vec4",this.waveDataBuffer.count),index:b,size:e.size,waveLength:o(e.lengthScale),boundaryLow:o(e.boundaryLow),boundaryHigh:o(e.boundaryHigh),...e.waveSettings}).compute(this.squareSize),this.initialSpectrumWithInverse=vr({spectrumBuffer:v(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),index:b,size:e.size}).compute(this.squareSize),e.renderer.compute(this.initialSpectrum),e.renderer.compute(this.initialSpectrumWithInverse)}update(){this.params.renderer.compute(this.initialSpectrum),this.params.renderer.compute(this.initialSpectrumWithInverse)}dispose(){this.spectrumBuffer?.dispose?.(),this.waveDataBuffer?.dispose?.()}}const xr=[16,16,1],yr=[250,17,5],Sr=[.9,.9,.9],ze=Object.freeze({Low:Object.freeze({resolution:128}),Medium:Object.freeze({resolution:256}),High:Object.freeze({resolution:512})}),fe="Medium";ze[fe].resolution;const wr=o(.8),br=o(2.7),zr=o(3.7);function Dr(t=fe){return ze[t]||ze[fe]}const Ft={depth:o(20),scaleHeight:o(1),windSpeed:o(1),windDirection:o(0),fetch:o(1e5),spreadBlend:o(1),swell:o(.198),peakEnhancement:o(3.3),shortWaveFade:o(0),fadeLimit:o(0)},Cr={depth:{min:.1,max:100},scaleHeight:{min:0,max:1},windSpeed:{min:.01,max:10},windDirection:{min:0,max:2*Math.PI},fetch:{min:10,max:5e5},spreadBlend:{min:0,max:1},swell:{min:0,max:1},peakEnhancement:{min:1,max:5},shortWaveFade:{min:0,max:5},fadeLimit:{min:0,max:1}},It={d_depth:o(20),d_scaleHeight:o(1),d_windSpeed:o(1),d_windDirection:o(240/360*2*Math.PI),d_fetch:o(3e5),d_spreadBlend:o(1),d_swell:o(.5),d_peakEnhancement:o(3.3),d_shortWaveFade:o(0),d_fadeLimit:o(0)},Br={d_depth:{min:.1,max:100},d_scaleHeight:{min:0,max:1},d_windSpeed:{min:.01,max:10},d_windDirection:{min:0,max:2*Math.PI},d_fetch:{min:10,max:5e5},d_spreadBlend:{min:0,max:1},d_swell:{min:0,max:1},d_peakEnhancement:{min:1,max:5},d_shortWaveFade:{min:0,max:5},d_fadeLimit:{min:0,max:1}};class Rr{constructor(e){this.init(e)}init(e){this.params=e,this.logN=Math.log2(e.size),this.squareSize=e.size**2,this.bufferSize=this.squareSize*2,this.initialSpectrum=new gr(e),this.spectrumBuffer=this.initialSpectrum.spectrumBuffer,this.waveDataBuffer=this.initialSpectrum.waveDataBuffer,this.dxDzBuffer=new N(new Float32Array(this.bufferSize),2),this.dyDxzBuffer=new N(new Float32Array(this.bufferSize),2),this.dyxDyzBuffer=new N(new Float32Array(this.bufferSize),2),this.dxxDzzBuffer=new N(new Float32Array(this.bufferSize),2),this.pingpongBuffer=new N(new Float32Array(this.bufferSize*2),4),this.turbulenceBuffer=new N(new Float32Array(this.bufferSize/2),1),this.displacementIndex=o(0),this.ifftStep=o(0),this.pingpong=o(0),this.deltaTime=o(0),this.displacement=new Te(e.size,e.size),this.derivative=new Te(e.size,e.size),this.jacobian=new Te(e.size,e.size),this.displacement.type=Se,this.derivative.type=Se,this.jacobian.type=Kt,this.displacement.generateMipmaps=!1,this.derivative.generateMipmaps=!1,this.jacobian.generateMipmaps=!1,this.displacement.magFilter=E,this.derivative.magFilter=E,this.jacobian.magFilter=E,this.displacement.minFilter=E,this.derivative.minFilter=E,this.jacobian.minFilter=E,this.displacement.wrapS=K,this.displacement.wrapT=K,this.derivative.wrapS=K,this.derivative.wrapT=K,this.jacobian.wrapS=K,this.jacobian.wrapT=K,this.workgroupSize=xr,this.dispatchSize=[e.size/this.workgroupSize[0],e.size/this.workgroupSize[1]],this.computeTimeSpectrum=cr({writeDxDzBuffer:v(this.dxDzBuffer,"vec2",this.dxDzBuffer.count),writeDyDxzBuffer:v(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count),writeDyxDyzBuffer:v(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count),writeDxxDzzBuffer:v(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count),spectrumBuffer:v(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),waveDataBuffer:v(this.waveDataBuffer,"vec4",this.waveDataBuffer.count),index:b,size:y(e.size),time:o(0)}).computeKernel(this.workgroupSize),this.computeInitialize=fr({size:y(e.size),step:y(this.ifftStep),logN:y(this.logN),butterflyBuffer:v(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),DxDzBuffer:v(this.dxDzBuffer,"vec2",this.dxDzBuffer.count).toReadOnly(),DyDxzBuffer:v(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count).toReadOnly(),DyxDyzBuffer:v(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count).toReadOnly(),DxxDzzBuffer:v(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count).toReadOnly(),pingpongBuffer:v(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:y(this.displacementIndex),index:b,workgroupSize:o(new oe().fromArray(this.workgroupSize)),workgroupId:ce,localId:le}).computeKernel(this.workgroupSize),this.computeHorizontalPingPong=ur({size:y(e.size),step:y(this.ifftStep),logN:y(this.logN),butterflyBuffer:v(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),pingpongBuffer:v(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:y(this.displacementIndex),pingpong:y(this.pingpong),index:b,workgroupSize:o(new oe().fromArray(this.workgroupSize)),workgroupId:ce,localId:le}).computeKernel(this.workgroupSize),this.computeVerticalPingPong=dr({size:y(e.size),step:y(this.ifftStep),logN:y(this.logN),butterflyBuffer:v(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),pingpongBuffer:v(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:y(this.displacementIndex),pingpong:y(this.pingpong),index:b,workgroupSize:o(new oe().fromArray(this.workgroupSize)),workgroupId:ce,localId:le}).computeKernel(this.workgroupSize),this.computePermute=pr({size:y(e.size),pingpongBuffer:v(this.pingpongBuffer,"vec4",this.pingpongBuffer.count).toReadOnly(),DxDzBuffer:v(this.dxDzBuffer,"vec2",this.dxDzBuffer.count),DyDxzBuffer:v(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count),DyxDyzBuffer:v(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count),DxxDzzBuffer:v(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count),initBufferIndex:y(this.displacementIndex),index:b,workgroupSize:o(new oe().fromArray(this.workgroupSize)),workgroupId:ce,localId:le}).computeKernel(this.workgroupSize),this.computeMergeTextures=mr({size:y(e.size),index:b,lambda:o(e.lambda),deltaTime:this.deltaTime,DxDzBuffer:v(this.dxDzBuffer,"vec2",this.dxDzBuffer.count).toReadOnly(),DyDxzBuffer:v(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count).toReadOnly(),DyxDyzBuffer:v(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count).toReadOnly(),DxxDzzBuffer:v(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count).toReadOnly(),turbulenceBuffer:v(this.turbulenceBuffer,"float",this.turbulenceBuffer.count),writeDisplacement:Ae(this.displacement),writeDerivative:Ae(this.derivative),writeJacobian:Ae(this.jacobian),workgroupSize:o(new oe().fromArray(this.workgroupSize)),workgroupId:ce,localId:le}).computeKernel(this.workgroupSize)}update(e){this.computeTimeSpectrum.computeNode.parameters.time.value=performance.now()/1e3,this.params.renderer.compute(this.computeTimeSpectrum,this.dispatchSize),this.ifft(0),this.ifft(1),this.ifft(2),this.ifft(3),this.deltaTime.value=e,this.params.renderer.compute(this.computeMergeTextures,this.dispatchSize)}ifft(e){this.displacementIndex.value=e;let a=!0;this.ifftStep.value=0,this.params.renderer.compute(this.computeInitialize,this.dispatchSize);for(let i=1;i<this.logN;i+=1)a=!a,this.ifftStep.value=i,this.pingpong.value=a?1:0,this.params.renderer.compute(this.computeHorizontalPingPong,this.dispatchSize);for(let i=0;i<this.logN;i+=1)a=!a,this.ifftStep.value=i,this.pingpong.value=a?1:0,this.params.renderer.compute(this.computeVerticalPingPong,this.dispatchSize);this.params.renderer.compute(this.computePermute,this.dispatchSize)}dispose(){this.displacement?.dispose?.(),this.derivative?.dispose?.(),this.jacobian?.dispose?.(),this.initialSpectrum?.dispose?.()}}class Mr{constructor(e){this.params=e,this.quality=e.quality??fe}init(){this.qualityPreset=Dr(this.quality),this.size=this.qualityPreset.resolution,this.butterflyBuffer=new N(new Float32Array(Math.log2(this.size)*this.size*4),4),this.butterfly=lr({butterflyBuffer:v(this.butterflyBuffer,"vec4",this.butterflyBuffer.count),index:b,N:this.size}).compute(Math.log2(this.size)*this.size),this.params.renderer.compute(this.butterfly),this.waveSettings={...Ft,...It},this.cascades=[],this.foamStrength=wr,this.foamThreshold=br,this.waveLengths=yr,this.lambda=Sr,this.lodScale=zr,this.initCascades()}initCascades(){this.cascades.length=0;let e=1e-4;for(let a=0;a<this.waveLengths.length;a+=1){const i=a<this.waveLengths.length-1?2*Math.PI/this.waveLengths[a+1]*6:9999;this.cascades.push(new Rr({...this.params,...this.getCascadeParams(a,e,i)})),e=i}}getCascadeParams(e,a,i){return{boundaryHigh:i,boundaryLow:a,butterflyBuffer:this.butterflyBuffer,lambda:this.lambda[e],lengthScale:this.waveLengths[e],size:this.size,waveSettings:this.waveSettings}}setFoamStrength(e){this.foamStrength.value=e}setFoamThreshold(e){this.foamThreshold.value=e}setLodScale(e){this.lodScale.value=e}applyWaveSettings(e){if(!e)return;let a=!1;Object.entries(e).forEach(([i,s])=>{Object.prototype.hasOwnProperty.call(this.waveSettings,i)&&this.waveSettings[i].value!==s&&(this.waveSettings[i].value=s,a=!0)}),a&&this.cascades.forEach(i=>{i.initialSpectrum.update()})}update(e){this.cascades.forEach(a=>{a.update(e)})}dispose(){this.cascades.forEach(e=>{e.dispose?.()}),this.cascades=[],this.butterflyBuffer?.dispose?.()}}function Tr({cascades:t,waveLengths:e}){const a=t.map((u,l)=>o(e?.[l]??u.params.lengthScale)),i=(u,l)=>d=>t.map((r,n)=>D(r[u],d.div(a[n]))[l]).reduce((r,n)=>r.add(n)),s=i("displacement","xyz");return{sample:u=>{const l=s(u);return B(u.x.add(l.x),l.y,u.y.add(l.z),1)},slope:i("derivative","xy"),setWaveLengths(u){a.forEach((l,d)=>{a[d].value=u?.[d]??a[d].value})}}}function Pr(t){return 1e3/Math.max(1,t?.performance?.waveUpdateHz??30)}function kr({config:t,onReady:e}){const a=H(n=>n.camera),i=H(n=>n.gl),s=H(n=>n.scene),u=x.useRef(null),l=x.useRef(0),d=t?.performance?.quality,r=t?.performance?.pauseWater??!1;return x.useEffect(()=>{if(!i?.isWebGPURenderer)return;const n=new Mr({quality:d,renderer:i});n.init();const c=new St(1024,1024);c.texture.type=Se,c.texture.magFilter=E,c.texture.minFilter=E,c.texture.generateMipmaps=!1,c.texture.wrapS=we,c.texture.wrapT=we;const f=new sr({camera:a,impactFoamTexture:c.texture,layer:0,renderer:i,scene:s,waveGenerator:n,withSky:!1});f.init(),f.applyConfig(t);const m=Tr({cascades:n.cascades,waveLengths:n.waveLengths});return u.current={oceanManager:f,probe:m,waveGenerator:n},e?.({impactFoamRT:c,probe:m}),()=>{l.current=0,u.current=null,e?.(null),f.dispose(),c.dispose(),n.dispose?.()}},[a,i,e,d,s]),De((n,c)=>{const f=u.current;if(!f)return;if(f.waveGenerator.applyWaveSettings(t.waveSettings),f.oceanManager.applyConfig(t),f.probe.setWaveLengths(f.waveGenerator.waveLengths),r){l.current=0,f.oceanManager.update(n.camera);return}const m=Pr(t);for(l.current=Math.min(l.current+c*1e3,m*3);l.current>=m;)f.waveGenerator.update(m),l.current-=m;f.oceanManager.update(n.camera)}),null}function Ar(t={}){return{impactAreaSize:{label:"Foam Area",max:400,min:20,render:O,step:1,value:t.impactAreaSize??140},impactDotSize:{label:"Stipple Size",max:4,min:.05,render:O,step:.05,value:t.impactDotSize??.55},impactDotStrength:{label:"Stipple Strength",max:4,min:0,render:O,step:.05,value:t.impactDotStrength??1},impactFoamStrength:{label:"Foam Response",max:3,min:0,render:O,step:.05,value:t.impactFoamStrength??.8},impactFoamDecay:{label:"Foam Decay",max:.3,min:.005,render:O,step:.005,value:t.impactFoamDecay??.06}}}function Fr(t={}){return{lightX:{label:"Center X",max:100,min:-100,step:.5,value:t.lightX??0},lightZ:{label:"Center Z",max:100,min:-100,step:.5,value:t.lightZ??-6},lightHeight:{label:"Height",max:200,min:5,step:1,value:t.lightHeight??62},lightRadius:{label:"Cone Radius",max:60,min:.5,step:.5,value:t.lightRadius??9},lightSpread:{label:"Cone Spread",max:2,min:0,step:.01,value:t.lightSpread??.42},lightSoftness:{label:"Edge Softness",max:6,min:.1,step:.05,value:t.lightSoftness??1.8},lightReach:{label:"Reach",max:300,min:10,step:1,value:t.lightReach??95},lightIntensity:{label:"Intensity",max:8,min:0,step:.05,value:t.lightIntensity??1.6},lightAmbient:{label:"Ambient",max:1,min:0,step:.005,value:t.lightAmbient??.08},lightDriftSpeed:{label:"Drift Speed",max:2,min:0,step:.01,value:t.lightDriftSpeed??.12},lightDriftRadius:{label:"Drift Radius",max:40,min:0,step:.5,value:t.lightDriftRadius??7},lightPulse:{label:"Pulse Amount",max:1,min:0,step:.01,value:t.lightPulse??.22}}}const Ve={Monochrome:{seaColor:"#000000",horizonColor:"#050505",skyColor:"#000000",sunColor:"#ffffff"},"Row It Alone":{seaColor:"#01040c",horizonColor:"#6b9ed1",skyColor:"#143663",sunColor:"#ffe6b8"}};function Ir(t={}){return{oceanDisplayMode:{label:"Water Surface",options:Da,value:t.oceanDisplayMode??"Hidden"},oceanPatchSize:{render:O,label:"Patch Size",max:400,min:50,step:1,value:t.oceanPatchSize??200},oceanPatchResolution:{render:O,label:"Patch Resolution",max:384,min:64,step:1,value:t.oceanPatchResolution??192},oceanLodScale:{render:O,label:"LOD Scale",max:12,min:0,step:.1,value:t.oceanLodScale??3.7},oceanPaletteMode:{render:He,label:"Palette",options:Object.keys(Ve).concat("Custom"),value:t.oceanPaletteMode??"Row It Alone"},oceanSeaColor:{label:"Sea",render:me,value:t.oceanSeaColor??"#01040c"},oceanHorizonColor:{label:"Horizon",render:me,value:t.oceanHorizonColor??"#6b9ed1"},oceanSkyColor:{label:"Sky",render:me,value:t.oceanSkyColor??"#143663"},oceanSunColor:{label:"Sun",render:me,value:t.oceanSunColor??"#ffe6b8"},enhanceSurfaceDetails:{render:He,label:"Enhance Surface Detail",value:t.enhanceSurfaceDetails??!1},oceanFoamStrength:{render:O,label:"Foam Strength",max:5,min:0,step:.05,value:t.oceanFoamStrength??1.1},oceanFoamThreshold:{render:O,label:"Foam Threshold",max:6,min:0,step:.05,value:t.oceanFoamThreshold??2.8}}}function Lr(t={}){return{rainEnabled:{label:"Rain Enabled",value:t.rainEnabled??!0},timeScale:{label:"Time Scale",max:3,min:-3,step:.05,value:t.timeScale??1},rainDropCount:{label:"Drop Count",max:1e6,min:1e3,step:1e3,value:t.rainDropCount??4e5},rainBounds:{label:"Volume Width",max:400,min:20,step:1,value:t.rainBounds??140},rainCeiling:{label:"Ceiling Y",max:160,min:10,step:.5,value:t.rainCeiling??60},rainSpawnRange:{label:"Spawn Range",max:120,min:1,step:.5,value:t.rainSpawnRange??40},rainFallSpeed:{label:"Fall Speed",max:80,min:1,step:.5,value:t.rainFallSpeed??26},rainSpeedJitter:{label:"Speed Jitter",max:.9,min:0,step:.01,value:t.rainSpeedJitter??.4},rainWindX:{label:"Wind X",max:12,min:-12,step:.1,value:t.rainWindX??.8},rainWindZ:{label:"Wind Z",max:12,min:-12,step:.1,value:t.rainWindZ??0},rainStreakLength:{label:"Streak Length",max:4,min:.05,step:.01,value:t.rainStreakLength??.9},rainStreakWidth:{label:"Streak Width",max:.3,min:.005,step:.005,value:t.rainStreakWidth??.045},rainOpacity:{label:"Opacity",max:2,min:.01,step:.01,value:t.rainOpacity??.5},rainTint:{label:"Tint",value:t.rainTint??"#d5e7f0"},rainEdgeFade:{label:"Edge Fade",max:1,min:0,step:.01,value:t.rainEdgeFade??.55}}}function _r(t={}){return{catchDepth:{label:"Catch Depth",max:12,min:.1,step:.1,value:t.catchDepth??3},slideGravity:{label:"Slide Gravity",max:120,min:0,step:.5,value:t.slideGravity??18},slideDrag:{label:"Slide Drag",max:12,min:0,step:.05,value:t.slideDrag??2},slopeRelease:{label:"Release Slope",max:6,min:.05,step:.05,value:t.slopeRelease??1.1},surfaceLifeMin:{label:"Cling Time Min",max:6,min:.05,step:.05,value:t.surfaceLifeMin??.6},surfaceLifeMax:{label:"Cling Time Max",max:12,min:.1,step:.05,value:t.surfaceLifeMax??2.5},stretchSpeed:{label:"Streak Stretch Speed",max:40,min:.1,step:.1,value:t.stretchSpeed??6},gravity:{label:"Fall-Off Gravity",max:80,min:0,step:.5,value:t.gravity??20},airDrag:{label:"Fall-Off Air Drag",max:8,min:0,step:.05,value:t.airDrag??1.1},sinkDepth:{label:"Descend Depth",max:120,min:1,step:1,value:t.sinkDepth??26}}}function Er(t={}){return{targetMode:{label:"Surface",options:tt,value:t.targetMode??tt[0]},targetReveal:{label:"Reveal Target",render:Z,value:t.targetReveal??!1},targetProbeArea:{label:"Probe Area",max:300,min:8,render:Z,step:1,value:t.targetProbeArea??60},targetScale:{label:"Scale",max:6,min:.1,render:Z,step:.05,value:t.targetScale??1},targetHeight:{label:"Height",max:40,min:-40,render:Z,step:.5,value:t.targetHeight??0},targetTilt:{label:"Tilt",max:Math.PI,min:-Math.PI,render:Z,step:.01,value:t.targetTilt??-1.2},targetSpinSpeed:{label:"Spin Speed",max:2,min:-2,render:Z,step:.01,value:t.targetSpinSpeed??.16}}}const Lt=[{prefix:"first_",dataset:Ft,borders:Cr},{prefix:"second_",dataset:It,borders:Br}];function pt(t,e={}){const{dataset:a,borders:i}=Lt.find(s=>s.prefix===t);return Object.fromEntries(Object.entries(a).map(([s,u])=>[`${t}${s}`,{label:s,max:i[s].max,min:i[s].min,value:e[`${t}${s}`]??u.value}]))}function Or(t){return Object.fromEntries(Lt.flatMap(({prefix:e,dataset:a})=>Object.keys(a).map(i=>[i,t[`${e}${i}`]])))}function Wr(t={}){return{quality:{label:"Wave Quality",options:Object.keys(ze),value:t.quality??fe},pauseWater:{label:"Pause Water",value:t.pauseWater??!1},waveUpdateHz:{label:"Wave Update Hz",max:60,min:5,step:1,value:t.waveUpdateHz??30}}}const mt="An Ocean Implied",G={targetMode:Ce,targetReveal:!1,targetProbeArea:60,targetScale:1,targetHeight:0,targetTilt:-1.2,targetSpinSpeed:.16,timeScale:1,rainEnabled:!0,rainDropCount:8e5,rainBounds:70,rainCeiling:10,rainSpawnRange:40,rainFallSpeed:26,rainSpeedJitter:.4,rainWindX:.8,rainWindZ:0,rainStreakLength:.21,rainStreakWidth:.07,rainOpacity:1.11,rainTint:"#d5e7f0",rainEdgeFade:.55,catchDepth:3,slideGravity:18,slideDrag:2,slopeRelease:1.1,surfaceLifeMin:6,surfaceLifeMax:12,stretchSpeed:5.8,gravity:20,airDrag:1.1,sinkDepth:26,lightX:0,lightZ:-6,lightHeight:62,lightRadius:9,lightSpread:.42,lightSoftness:1.8,lightReach:95,lightIntensity:1.6,lightAmbient:.08,lightDriftSpeed:.12,lightDriftRadius:7,lightPulse:.22,oceanDisplayMode:"Hidden",oceanPatchSize:200,oceanPatchResolution:192,oceanLodScale:3.7,oceanPaletteMode:"Monochrome",oceanSeaColor:"#000000",oceanHorizonColor:"#050505",oceanSkyColor:"#000000",oceanSunColor:"#ffffff",enhanceSurfaceDetails:!1,oceanFoamStrength:1.1,oceanFoamThreshold:2.8,impactAreaSize:140,impactDotSize:.55,impactDotStrength:1,impactFoamStrength:.8,impactFoamDecay:.06,mountainDisplayMode:"Hidden",mountainShape:"Range",mountainPalette:"Monochrome",mountainMeshResolution:512,mountainFieldResolution:1024,mountainExtent:140,mountainRelief:140,mountainBaseHeight:.4,mountainFrequency:2.2,mountainAmplitude:.125,mountainTreeline:.465,peakRadius:.35,peakAmplitude:.1,erosionScale:.15,erosionStrength:.22,erosionGullyWeight:.5,erosionDetail:1.5,erosionOctaves:5,quality:"Medium",pauseWater:!1,waveUpdateHz:30},he={...G,targetMode:Be,rainDropCount:7e5,rainBounds:120,rainCeiling:42,rainSpawnRange:26,rainFallSpeed:24,rainWindX:.4,rainStreakLength:.18,rainStreakWidth:.06,rainEdgeFade:.7,catchDepth:2,slideGravity:26,slideDrag:3.2,slopeRelease:1.2,surfaceLifeMin:4,surfaceLifeMax:11,stretchSpeed:5,sinkDepth:30,lightHeight:74,lightRadius:18,lightSpread:.36,lightReach:130,lightIntensity:1.7,lightAmbient:.07,lightDriftRadius:12},xe={...G,targetProbeArea:26,rainDropCount:6e5,rainBounds:62,rainCeiling:34,rainSpawnRange:22,rainFallSpeed:22,rainWindX:0,rainStreakLength:.14,rainStreakWidth:.045,rainOpacity:1.07,rainEdgeFade:.72,catchDepth:1.6,slideGravity:12,slideDrag:5,slopeRelease:3,surfaceLifeMin:1.5,surfaceLifeMax:5.5,stretchSpeed:3.7,sinkDepth:34,lightHeight:40,lightRadius:16,lightSpread:.3,lightSoftness:1.4,lightReach:78,lightIntensity:1.5,lightAmbient:.1,lightDriftSpeed:.07,lightDriftRadius:4},ve={...xe,targetProbeArea:26,targetTilt:-.5,targetSpinSpeed:0,rainBounds:54,rainEdgeFade:.8,rainDropCount:7e5,slideGravity:30,slideDrag:4,catchDepth:1,rainOpacity:.73,stretchSpeed:7,lightRadius:20,lightHeight:44,cameraMode:"orbit",orbitDesktopPosition:{x:0,y:26,z:26},orbitDesktopTarget:{x:0,y:0,z:0},orbitDesktopPivot:{x:0,y:0,z:0},orbitDesktopFov:40,orbitMobilePosition:{x:0,y:32,z:32},orbitMobileTarget:{x:0,y:0,z:0},orbitMobilePivot:{x:0,y:0,z:0},orbitMobileFov:52},We={"An Ocean Implied":{...G},"Rain on Ocean Reverse":{...G,timeScale:-1.6,rainDropCount:5e5,rainOpacity:1.23,surfaceLifeMin:.4,surfaceLifeMax:1.6,lightDriftSpeed:.08,lightPulse:.1},Downpour:{...G,rainDropCount:7e5,rainFallSpeed:34,rainStreakLength:.24,rainStreakWidth:.08,rainOpacity:.8,surfaceLifeMax:1.5,slideGravity:30,slopeRelease:.85,stretchSpeed:9.7,lightRadius:14,lightIntensity:1.85,lightDriftSpeed:.2},Drizzle:{...G,rainDropCount:18e4,rainFallSpeed:17,rainStreakLength:.17,rainStreakWidth:.055,rainOpacity:.86,surfaceLifeMin:1.2,surfaceLifeMax:4,slideGravity:12,slideDrag:3,slopeRelease:1.4,stretchSpeed:2.6,lightIntensity:1.35,lightDriftSpeed:.06},"Rain on Torus":{...xe,targetMode:"Torus"},"Rain on Torus Knot":{...xe,targetMode:"Torus Knot",targetSpinSpeed:.24},"Rain on Sphere":{...xe,targetMode:"Sphere",targetTilt:0},"Rain on Bret":{...ve,targetMode:"Bret"},"Rain on Bret Inner":{...ve,targetMode:"Bret Inner"},"Rain on Reversal":{...ve,targetMode:"Reversal"},"Rain on Reversal Inner":{...ve,targetMode:"Reversal Inner"},"Foam + Rain":{...G,oceanDisplayMode:"Foam Only",oceanFoamStrength:1.35,oceanFoamThreshold:2.9,impactDotSize:.7,impactDotStrength:1.5,impactFoamStrength:1.2,impactFoamDecay:.05,lightAmbient:.12},"Visible Ocean":{...G,rainDropCount:26e4,rainOpacity:.78,lightAmbient:.22,lightIntensity:1.2,oceanDisplayMode:"Full",oceanPaletteMode:"Row It Alone",oceanSeaColor:"#01040c",oceanHorizonColor:"#6b9ed1",oceanSkyColor:"#143663",oceanSunColor:"#ffe6b8",enhanceSurfaceDetails:!0,impactDotSize:.75,impactDotStrength:1.4,impactFoamStrength:1.1,impactFoamDecay:.05},"A Mountain Implied":{...he},"A Single Peak Implied":{...he,mountainShape:"Single Peak",mountainBaseHeight:.45,rainBounds:110,rainCeiling:38,lightHeight:66,lightReach:120},"Visible Single Peak":{...he,mountainShape:"Single Peak",mountainBaseHeight:.45,mountainDisplayMode:"Full",rainBounds:110,rainCeiling:38,rainDropCount:32e4,rainOpacity:.82,lightAmbient:.2,lightIntensity:1.25,lightHeight:66,lightReach:120},"Visible Mountain":{...he,mountainDisplayMode:"Full",mountainPalette:"Monochrome",rainDropCount:32e4,rainOpacity:.82,lightAmbient:.2,lightIntensity:1.25},"Still Light":{...G,lightDriftSpeed:0,lightPulse:0,rainWindX:0}};function Gr({presetSnapshot:t}){return{...t}}const q=[0,1,-8],Nr={defaultMode:"spline",spline:{desktop:{target:q,fov:40},mobile:{target:q,fov:52},preset:"Loop de Loop",duration:180,scale:[10,10,10]},orbit:{desktop:{position:[0,8,30],target:q,pivot:q,fov:40},mobile:{position:[0,9,36],target:q,pivot:q,fov:52}},fixed:{behavior:"single",activeShot:"overview",shots:{overview:{desktop:{position:[0,8,30],target:q,fov:40}}}}};function Hr(){const{attachSetControls:t,controlsSnapshotRef:e,initialPreset:a,presetsFolder:i}=pa({defaultPreset:mt,getPresetControls:Gr,presets:We}),s=We[a]||We[mt],u=x.useRef(null),{buildCamera:l,cameraControls:d}=Zt({apiRef:u,camera:Nr,cameraFolderPath:za,controlsSnapshotRef:e}),[r,n]=$t(ae,()=>({Presets:i,Camera:F(d,{collapsed:!0}),Target:F(Er(s),{collapsed:!0}),Rain:F(Lr(s),{collapsed:!0}),Surface:F(_r(s),{collapsed:!0}),Mountain:F(Ba(s),{collapsed:!0}),Light:F(Fr(s),{collapsed:!0}),Ocean:F(Ir(s),{collapsed:!0}),Impacts:F(Ar(s),{collapsed:!0}),Performance:F(Wr(s),{collapsed:!0}),"First Wave Spectrum":F(pt("first_",s),{collapsed:!0}),"Second Wave Spectrum":F(pt("second_",s),{collapsed:!0})}));t(n),e.current={...r},ma({fileName:ae});const c=x.useMemo(()=>Qt(r),[r]),f=x.useMemo(()=>l(r),[l,c]),m=x.useMemo(()=>r.oceanPaletteMode==="Custom"?{horizonColor:r.oceanHorizonColor,seaColor:r.oceanSeaColor,skyColor:r.oceanSkyColor,sunColor:r.oceanSunColor}:Ve[r.oceanPaletteMode]||Ve["Row It Alone"],[r.oceanHorizonColor,r.oceanPaletteMode,r.oceanSeaColor,r.oceanSkyColor,r.oceanSunColor]);return x.useMemo(()=>({...r,camera:f,cameraApiRef:u,ocean:{...m,impactAreaSize:r.impactAreaSize,impactDotSize:r.impactDotSize,impactDotStrength:r.impactDotStrength,impactFoamDecay:r.impactFoamDecay,impactFoamStrength:r.impactFoamStrength,lodScale:r.oceanLodScale,patchResolution:r.oceanPatchResolution,patchSize:r.oceanPatchSize,foamOnly:r.oceanDisplayMode==="Foam Only",reveal:r.enhanceSurfaceDetails?1:0,visible:r.oceanDisplayMode!=="Hidden",wireframe:!1},foam:{foamStrength:r.oceanFoamStrength,foamThreshold:r.oceanFoamThreshold},light:{ambient:r.lightAmbient,driftRadius:r.lightDriftRadius,driftSpeed:r.lightDriftSpeed,height:r.lightHeight,intensity:r.lightIntensity,pulse:r.lightPulse,radius:r.lightRadius,reach:r.lightReach,softness:r.lightSoftness,spread:r.lightSpread,x:r.lightX,z:r.lightZ},mountain:{baseHeight:r.mountainBaseHeight,erosionDetail:r.erosionDetail,erosionGullyWeight:r.erosionGullyWeight,erosionOctaves:r.erosionOctaves,erosionScale:r.erosionScale,erosionStrength:r.erosionStrength,extent:r.mountainExtent,fieldResolution:r.mountainFieldResolution,meshResolution:r.mountainMeshResolution,mountainAmplitude:r.mountainAmplitude,mountainFrequency:r.mountainFrequency,mountainTreeline:r.mountainTreeline,palette:r.mountainPalette,peakAmplitude:r.peakAmplitude,peakRadius:r.peakRadius,relief:r.mountainRelief,shape:r.mountainShape,visible:r.mountainDisplayMode!=="Hidden"},performance:{pauseWater:r.pauseWater,quality:r.quality,waveUpdateHz:r.waveUpdateHz},waveSettings:Or(r),target:{height:r.targetHeight,mode:r.targetMode,probeArea:r.targetProbeArea,reveal:r.targetReveal,scale:r.targetScale,spinSpeed:r.targetSpinSpeed,tilt:r.targetTilt},rain:{airDrag:r.airDrag,bounds:r.rainBounds,catchDepth:r.catchDepth,ceiling:r.rainCeiling,dropCount:r.rainDropCount,edgeFade:r.rainEdgeFade,enabled:r.rainEnabled,fallSpeed:r.rainFallSpeed,gravity:r.gravity,opacity:r.rainOpacity,sinkDepth:r.sinkDepth,slideDrag:r.slideDrag,slideGravity:r.slideGravity,slopeRelease:r.slopeRelease,spawnRange:r.rainSpawnRange,speedJitter:r.rainSpeedJitter,streakLength:r.rainStreakLength,streakWidth:r.rainStreakWidth,stretchSpeed:r.stretchSpeed,surfaceLifeMax:r.surfaceLifeMax,surfaceLifeMin:r.surfaceLifeMin,timeScale:r.timeScale,tint:r.rainTint,windX:r.rainWindX,windZ:r.rainWindZ}}),[f,r,m])}const Vr={[Be]:Ma,[Ce]:kr};function jr(){const t=Hr(),[e,a]=x.useState(null),i=Vr[t.target.mode]??ja;return $.jsxs($.Fragment,{children:[$.jsx(ea,{camera:t.camera}),$.jsx("color",{attach:"background",args:["#000000"]}),$.jsx(i,{config:t,onReady:a}),e&&$.jsx(_a,{config:t,surface:e})]})}const pi=x.memo(jr);export{pi as default};
