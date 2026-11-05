import{aO as Ft,b5 as Lt,aE as _t,aF as It,dL as Et,r as x,b as N,_ as ge,L as K,a as be,O as ft,$ as pt,b0 as ht,Z as ie,aX as mt,V as w,C as de,D as gt,U as vt,H as ve,a3 as O,ax as xe,X as Ot,aN as Wt,bf as xt,K as me,a8 as Ht,b2 as De,d4 as Xe,l as Gt,av as Nt,F as Vt,af as yt,B as jt,an as Ut,I as Xt,M as qe,cT as G,ay as ze,Y as qt,aD as J,h as oe,a9 as Yt,ac as L,j as Z}from"./index-ClsBeNqB.js";import{u as Kt,g as Jt,C as Zt}from"./useSceneCameraControls-D9sVRv2S.js";import"./cameraSplinePresets-BRXqZEQl.js";import"./useOperatorInput-B8t8088P.js";import{k as $t,l as Qt,m as ea,s as ta,g as aa,n as E}from"./uniforms-Ckw7vaVS.js";import{u as o,v as M,z as Y,f as j,F as te,j as T,G as Ce,ab as ye,D as St,m as q,bl as Ye,k as _e,bh as ia,c as ra,b8 as na,$ as Re,Z as Ke,_ as D,cf as oa,I as se,a0 as y,y as Ie,w as sa,K as C,bu as A,aX as re,az as ee,ba as g,bv as le,bw as ce,Y as Me}from"./three.tsl-sI5JnhRj.js";import{u as la}from"./Bret-53DZJemC.js";import{u as ca}from"./Reversal-D78q3UfE.js";import{u as ua}from"./usePresetsFolder-Cq7ylu_r.js";import{u as da}from"./useMediaRecorder-DILzdB1m.js";import"./useCameraSpline-DJwsjVxV.js";import"./OrthographicCamera-BQxhBlTJ.js";import"./extends-CF3RwP-h.js";import"./Fbo-CQefdN7H.js";import"./PerspectiveCamera-AnpkSe7I.js";import"./OrbitControls-1wnVVMl7.js";import"./Line-qtUBnUp9.js";import"./Line2-kOh9bp_z.js";import"./constants-C8Y9gZZZ.js";import"./react-spring_three.modern-BR9BaNqN.js";import"./Gltf-CH5FGzUk.js";import"./BufferGeometryUtils-433-m82P.js";import"./isMobileDevice-De1yZKQi.js";function fa({extent:t=140,baseHeight:e=.45,heightScale:a=40,sampling:r}){const s={base:o(e),extent:o(t),scale:o(a)},u=d=>d.div(s.extent),l=d=>r.sampleHeight(d).sub(s.base).mul(s.scale);return{sample:d=>{const i=u(d).toVar(),n=i.abs().toVar(),c=l(r.toFieldUV(i)).toVar();return M(d.x,c,d.y,Y(n.x.max(n.y).lessThan(.5),j(1),j(0)))},slope:d=>r.sampleSlope(r.toFieldUV(u(d))).mul(s.scale).div(s.extent),uniforms:s}}const Je=["Range","Single Peak"],Ze={Range:{heightOffset:-.65,mode:"procedural",onsetInput:1.25},"Single Peak":{heightOffset:0,mode:"dome",onsetInput:.7}},pa=["shape","erosionScale","erosionStrength","erosionGullyWeight","erosionDetail","erosionOctaves","mountainFrequency","mountainAmplitude","mountainTreeline","peakRadius","peakAmplitude"];function ha(t){return pa.map(e=>t[e]).join("|")}function ma({palette:t,resolution:e}){const a={...Qt(),...$t()},r=ea({resolution:e,uniforms:a}),s=fa({sampling:r});let u="procedural";function l(d){const i=Ze[d.shape]??Ze.Range;u=i.mode,a.scale.value=d.erosionScale,a.strength.value=d.erosionStrength,a.gullyWeight.value=d.erosionGullyWeight,a.detail.value=d.erosionDetail,a.octaves.value=d.erosionOctaves,a.onset.value.setX(i.onsetInput),a.heightOffset.value.setX(i.heightOffset),a.heightFrequency.value=d.mountainFrequency,a.heightAmplitude.value=d.mountainAmplitude,a.domeRadius.value=d.peakRadius,a.domeAmplitude.value=d.peakAmplitude,a.grassHeight.value=d.mountainTreeline,a.waterEnabled.value=0,a.drainageEnabled.value=1,s.uniforms.base.value=d.baseHeight,s.uniforms.extent.value=d.extent,s.uniforms.scale.value=d.relief;const n=t[d.palette]??t.Monochrome;Object.entries(n).forEach(([c,f])=>ta(a[c],f))}return{applyConfig:l,bake(d){r.bakeDetail(d),r.bakeHeight(d,u)},dispose:r.dispose,field:r,probe:s,uniforms:a}}function ga({field:t,probe:e,uniforms:a}){const r=new Ft({roughness:.92}),s=()=>t.toFieldUV(Ce.xz);return r.positionNode=te(()=>{const u=t.sampleHeight(s()).sub(e.uniforms.base).mul(e.uniforms.scale);return T(Ce.x.mul(e.uniforms.extent),u,Ce.z.mul(e.uniforms.extent))})(),r.normalNode=te(()=>{const u=e.uniforms.scale.div(e.uniforms.extent),l=t.sampleSlope(s()).mul(u);return T(l.x.negate(),1,l.y.negate()).normalize()})(),r.colorNode=te(()=>{const u=t.sampleData(s()),l=t.detailAt(s()).x;return M(aa({breakup:l,erosion:u.erosion,height:u.height,normalY:u.normal.y,occlusion:u.erosion.add(.5).clamp(0,1),ridgemap:u.ridgemap,trees:u.trees,uniforms:a}),1)})(),r}const We="Ocean Waves",He="Mountain",bt={Bret:{model:"bret",parts:["inner","outer"]},"Bret Inner":{model:"bret",parts:["inner"]},Reversal:{model:"reversal",parts:["inner","outer"]},"Reversal Inner":{model:"reversal",parts:["inner"]}},va=["Torus","Torus Knot","Sphere","Ribbon"],$e=[We,He,...va,...Object.keys(bt)];function xa(t){switch(t){case"Torus Knot":return new Et(7,1.9,320,48);case"Sphere":return new It(9,128,96);case"Ribbon":return new _t(9,9,7,128,24,!0);default:return new Lt(9,3.4,64,220)}}function ya(t){t.updateWorldMatrix(!0,!1);const e=t.geometry.clone();return e.applyMatrix4(t.matrixWorld),e}const ae="Water Cycle",Sa=`${ae}.Camera`,Ge=`${ae}.Mountain`,Ne=`${ae}.Ocean`,wt=`${ae}.Target`,ba=["Hidden","Foam Only","Full"],Ve=t=>t(`${wt}.targetMode`)===We,R=t=>t(`${wt}.targetMode`)===He,$=t=>!Ve(t)&&!R(t),Be=t=>R(t)&&t(`${Ge}.mountainDisplayMode`)!=="Hidden",Qe=t=>R(t)&&t(`${Ge}.mountainShape`)==="Range",et=t=>R(t)&&t(`${Ge}.mountainShape`)!=="Range",W=t=>Ve(t)&&t(`${Ne}.oceanDisplayMode`)!=="Hidden",Ee=t=>Ve(t)&&t(`${Ne}.oceanDisplayMode`)==="Full",he=t=>Ee(t)&&t(`${Ne}.oceanPaletteMode`)==="Custom",wa=["Hidden","Full"],Dt={Monochrome:{ambientColor:"#2a2a2a",cliffColor:"#1a1a1a",dirtColor:"#333333",grass1Color:"#242424",grass2Color:"#3d3d3d",sandColor:"#4d4d4d",sunColor:"#ffffff",treeColor:"#141414",waterColor:"#000000",waterShoreColor:"#0a0a0a"},Reference:{ambientColor:E.ambient,cliffColor:E.cliff,dirtColor:E.dirt,grass1Color:E.grass1,grass2Color:E.grass2,sandColor:E.sand,sunColor:E.sun,treeColor:E.tree,waterColor:E.water,waterShoreColor:E.waterShore}};function Da(t={}){return{mountainDisplayMode:{label:"Mountain Surface",options:wa,render:R,value:t.mountainDisplayMode??"Hidden"},mountainShape:{label:"Shape",options:Je,render:R,value:t.mountainShape??Je[0]},mountainPalette:{label:"Palette",options:Object.keys(Dt),render:Be,value:t.mountainPalette??"Monochrome"},mountainMeshResolution:{label:"Mesh Resolution",max:1024,min:64,render:Be,step:32,value:t.mountainMeshResolution??512},mountainFieldResolution:{label:"Field Resolution",options:[512,1024,2048],render:R,value:t.mountainFieldResolution??1024},mountainExtent:{label:"Extent",max:400,min:40,render:R,step:1,value:t.mountainExtent??140},mountainRelief:{label:"Relief",max:400,min:20,render:R,step:1,value:t.mountainRelief??140},mountainBaseHeight:{label:"Sea Level",max:.6,min:.3,render:R,step:.005,value:t.mountainBaseHeight??.4},mountainFrequency:{label:"Range Frequency",max:8,min:.5,render:Qe,step:.1,value:t.mountainFrequency??2.2},mountainAmplitude:{label:"Range Amplitude",max:.3,min:.02,render:Qe,step:.005,value:t.mountainAmplitude??.125},peakRadius:{label:"Peak Radius",max:.5,min:.1,render:et,step:.005,value:t.peakRadius??.35},peakAmplitude:{label:"Peak Amplitude",max:.3,min:.02,render:et,step:.005,value:t.peakAmplitude??.1},mountainTreeline:{label:"Treeline",max:.6,min:.3,render:Be,step:.005,value:t.mountainTreeline??.465},erosionScale:{label:"Erosion Scale",max:.6,min:.02,render:R,step:.005,value:t.erosionScale??.15},erosionStrength:{label:"Erosion Strength",max:.6,min:0,render:R,step:.005,value:t.erosionStrength??.22},erosionGullyWeight:{label:"Gully Weight",max:1,min:0,render:R,step:.01,value:t.erosionGullyWeight??.5},erosionDetail:{label:"Erosion Detail",max:4,min:.2,render:R,step:.05,value:t.erosionDetail??1.5},erosionOctaves:{label:"Erosion Octaves",max:8,min:1,render:R,step:1,value:t.erosionOctaves??5}}}function za({config:t,onReady:e}){const a=N(n=>n.gl),r=N(n=>n.scene),s=x.useRef(null),u=x.useRef(null),{mountain:l}=t,d=l.fieldResolution,i=x.useMemo(()=>{const n=new ge(1,1,l.meshResolution,l.meshResolution);return n.rotateX(-Math.PI/2),n},[l.meshResolution]);return x.useEffect(()=>{if(!a?.isWebGPURenderer)return;const n=ma({palette:Dt,resolution:d}),c=ga(n),f=new K(i,c);return f.frustumCulled=!1,r.add(f),u.current=null,s.current={material:c,mesh:f,runtime:n},e?.({probe:n.probe}),()=>{s.current=null,e?.(null),r.remove(f),c.dispose(),n.dispose()}},[i,a,e,d,r]),be(()=>{const{current:n}=s;if(!n)return;n.runtime.applyConfig(l),n.mesh.visible=l.visible;const c=ha(l);u.current!==c&&(u.current=c,n.runtime.bake(a))}),null}const Ca=x.memo(za);function Ra({renderTarget:t,simulation:e}){const a=o(.55),r=o(1),s=new ft(-70,70,70,-70,.1,400);s.position.set(0,200,0),s.lookAt(0,0,0);const u=new pt,l=new ge(1,1);l.rotateX(-Math.PI/2);const d=new ht({color:0,depthTest:!1,depthWrite:!1,opacity:.06,transparent:!0}),i=new K(l,d);u.add(i);const n=e.positionBuffer.toAttribute(),c=e.motionBuffer.toAttribute(),f=n.w.greaterThan(.5).and(n.w.lessThan(1.5)),h=new ie;h.positionNode=T(n.x.add(ye.x.mul(a)),0,n.z.add(ye.z.mul(a))),h.colorNode=St().sub(.5).length().mul(2).oneMinus().saturate().pow(2).mul(Y(f,j(1),j(0))).mul(c.w.mul(-1.2).exp()).mul(r),h.blending=mt,h.depthTest=!1,h.depthWrite=!1,h.forceSinglePass=!0,h.transparent=!0;const m=new ge(1,1);m.rotateX(-Math.PI/2);const v=new K(m,h);return v.frustumCulled=!1,v.renderOrder=1,u.add(v),{applyConfig(p,S){const P=p.impactAreaSize*.5;s.left=-P,s.right=P,s.top=P,s.bottom=-P,s.updateProjectionMatrix(),i.scale.set(p.impactAreaSize,p.impactAreaSize,1),d.opacity=p.impactFoamDecay,a.value=p.impactDotSize,r.value=p.impactDotStrength,v.count=S},clear(p){const S=p.getRenderTarget?.()||null;p.setRenderTarget(t),p.clear(!0,!0,!0),p.setRenderTarget(S)},dispose(){u.remove(i),u.remove(v),l.dispose(),d.dispose(),m.dispose(),h.dispose()},render(p){const S=p.getRenderTarget?.()||null;p.setRenderTarget(t),p.render(u,s),p.setRenderTarget(S)}}}function Ma(){const t=o(new w(0,60,0)),e=o(9),a=o(.42),r=o(1.8),s=o(95),u=o(1.6),l=o(.08);return{applyConfig:(n,c)=>{n&&(t.value.set(n.x+Math.sin(c)*n.driftRadius,n.height,n.z+Math.sin(c*.73)*n.driftRadius),e.value=n.radius,a.value=n.spread,r.value=n.softness,s.value=n.reach,l.value=n.ambient,u.value=n.intensity*(1+Math.sin(c*1.31)*n.pulse))},evaluate:n=>{const c=n.sub(t),f=c.y.negate().max(0),h=e.add(f.mul(a)),m=c.xz.length().div(h.max(.001)).oneMinus().saturate().pow(r);return l.add(m.mul(f.div(s).oneMinus().saturate()).mul(u))},origin:t}}function Ba({lightCone:t,simulation:e}){const a={streakLength:o(.9),streakWidth:o(.045),opacity:o(.5),stretchSpeed:o(6),tint:o(new de("#d5e7f0")),edgeFade:o(.55)},r=e.positionBuffer.toAttribute(),s=e.motionBuffer.toAttribute(),u=e.anchorBuffer.toAttribute(),l=r.xyz,d=u.z,i=q(.6,1.4,d),n=a.streakWidth.mul(i),c=s.xyz.length().div(a.stretchSpeed.max(.001)).saturate(),f=a.streakLength.mul(i).mul(c).max(n),h=te(()=>{const k=Ye.mul(M(s.xyz,0)).xy.toVar(),I=Y(k.length().lessThan(1e-4),_e(0,1),k.normalize()).toVar(),V=_e(I.y,I.x.negate()),H=Ye.mul(M(l,1)).toVar(),pe=V.mul(ye.x.mul(n)).add(I.mul(ye.y.mul(f)));return ia.mul(M(H.xy.add(pe),H.z,H.w))}),m=l.y.div(e.uniforms.sinkDepth.negate()).oneMinus().saturate().pow(1.5),v=ra(a.edgeFade.min(.999),1,l.xz.length().div(e.uniforms.bounds.mul(.5))).oneMinus(),p=na(t.evaluate(l).mul(m).mul(v)),S=St(),P=S.x.sub(.5).abs().mul(2).oneMinus().pow(1.5).mul(S.y.sub(.5).abs().mul(2).oneMinus().pow(.5)).mul(q(.5,1.4,S.y)).saturate(),B=new ie;return B.vertexNode=h(),B.colorNode=a.tint.mul(P).mul(p).mul(a.opacity),B.blending=mt,B.depthWrite=!1,B.forceSinglePass=!0,B.side=gt,B.transparent=!0,{applyConfig:k=>{a.streakLength.value=k.streakLength,a.streakWidth.value=k.streakWidth,a.opacity.value=k.opacity,a.stretchSpeed.value=k.stretchSpeed,a.edgeFade.value=k.edgeFade,a.tint.value.set(k.tint)},material:B,uniforms:a}}const ke=0,ka=1,tt=2;function Pa({capacity:t,probe:e}){const a={bounds:o(140),ceiling:o(60),spawnRange:o(40),fallSpeed:o(26),speedJitter:o(.4),windX:o(.8),windZ:o(0),catchDepth:o(3),surfaceLifeMin:o(.6),surfaceLifeMax:o(2.5),slideGravity:o(18),slideDrag:o(2),slopeRelease:o(1.1),airDrag:o(1.1),gravity:o(20),sinkDepth:o(26),timeScale:o(1)},r=Re(t,"vec4"),s=Re(t,"vec4"),u=Re(t,"vec4"),l=(c,f)=>Ke(D.mul(y(64)).add(y(c).mul(y(8))).add(y(f))),d=c=>T(l(c,1).sub(.5).mul(a.bounds),a.ceiling.add(l(c,2).mul(a.spawnRange)),l(c,3).sub(.5).mul(a.bounds)),i=te(()=>{const c=Ke(D).mul(4096).floor(),f=d(c).toVar();f.y.assign(l(c,8).mul(a.ceiling.add(a.spawnRange)).sub(a.ceiling.mul(.15))),r.element(D).assign(M(f,ke)),s.element(D).assign(M(0,0,0,0)),u.element(D).assign(M(0,0,l(c,4),c))})().compute(t),n=te(()=>{const c=r.element(D),f=s.element(D),h=u.element(D),m=c.xyz.toVar(),v=c.w.toVar(),p=f.xyz.toVar(),S=f.w.toVar(),P=h.xy.toVar(),B=h.z.toVar(),ne=h.w.toVar(),k=a.timeScale.toVar(),I=oa.mul(k.abs()).min(.05).toVar(),V=I.mul(k.sign()).toVar(),H=k.lessThan(0),pe=()=>{const z=d(ne.add(1)).toVar();S.assign(0),ne.addAssign(1),B.assign(l(ne,4)),se(H,()=>{v.assign(tt),z.y.assign(a.sinkDepth.negate()),p.assign(T(0,a.fallSpeed.negate(),0))}).Else(()=>{v.assign(ke)}),m.assign(z)},je=(z,F)=>{v.assign(ka),S.assign(F),p.assign(T(0,0,0)),P.assign(m.xz.mul(2).sub(z.xz)),m.assign(e.sample(P).xyz)},Ue=()=>Y(H,m.y.greaterThan(a.ceiling.add(a.spawnRange)),m.y.lessThan(a.sinkDepth.negate()));se(v.lessThan(.5),()=>{p.assign(T(a.windX,a.fallSpeed.mul(q(a.speedJitter.oneMinus(),1,B)).negate(),a.windZ)),m.addAssign(p.mul(V));const z=e.sample(m.xz).toVar(),F=a.catchDepth.max(p.y.abs().mul(I).mul(1.5));se(k.greaterThan(0).and(z.w.greaterThan(.5)).and(m.y.lessThan(z.y)).and(m.y.greaterThan(z.y.sub(F))),()=>{je(z,j(0))}).ElseIf(Ue(),pe)}).ElseIf(v.lessThan(1.5),()=>{S.addAssign(V);const z=e.slope(P).toVar(),F=p.xz.sub(z.mul(a.slideGravity.mul(V))).mul(a.slideDrag.mul(I).negate().exp()).toVar();P.addAssign(F.mul(V));const U=e.sample(P).toVar();m.assign(U.xyz),p.assign(T(F.x,z.dot(F),F.y));const we=q(a.surfaceLifeMin,a.surfaceLifeMax,B);se(U.w.lessThan(.5).or(z.length().greaterThan(a.slopeRelease)).or(Y(H,S.lessThan(0),S.greaterThan(we))),()=>{v.assign(Y(H,j(ke),j(tt))),S.assign(0)})}).Else(()=>{S.addAssign(V);const z=a.airDrag.mul(I).negate().exp(),F=q(_e(a.windX,a.windZ),p.xz,z);p.assign(T(F.x,p.y.sub(a.gravity.mul(I)).max(a.fallSpeed.negate()),F.y)),m.addAssign(p.mul(V));const U=e.sample(m.xz).toVar(),we=a.catchDepth.max(p.y.abs().mul(I).mul(1.5));se(H.and(U.w.greaterThan(.5)).and(m.y.greaterThan(U.y)).and(m.y.lessThan(U.y.add(we))),()=>{je(U,q(a.surfaceLifeMin,a.surfaceLifeMax,B))}).ElseIf(Ue(),pe)}),c.assign(M(m,v)),f.assign(M(p,S)),h.assign(M(P,B,ne))})().compute(t);return{anchorBuffer:u,init:i,motionBuffer:s,positionBuffer:r,uniforms:a,update:n}}const Pe=1e6,Ta=12e4;function at(t,e){return Math.max(1e3,Math.min(e,Math.floor(t||1e3)))}function Aa({config:t,surface:e}){const a=N(l=>l.gl),r=N(l=>l.scene),s=x.useRef(null),u=x.useRef(0);return x.useEffect(()=>{if(!a?.isWebGPURenderer||!e?.probe)return;const l=Pa({capacity:Pe,probe:e.probe}),d=Ma(),i=Ba({lightCone:d,simulation:l}),n=e.impactFoamRT?Ra({renderTarget:e.impactFoamRT,simulation:l}):null,c=new K(new ge(1,1),i.material);return c.frustumCulled=!1,c.count=at(t?.rain?.dropCount,Pe),r.add(c),n?.clear(a),a.compute(l.init),s.current={drops:c,impactFoam:n,lightCone:d,rain:i,simulation:l},()=>{s.current=null,r.remove(c),c.geometry.dispose(),i.material.dispose(),n?.dispose()}},[a,r,e]),be((l,d)=>{const i=s.current;if(!i)return;const{light:n,ocean:c,rain:f}=t,h=f.enabled!==!1;u.current+=d*n.driftSpeed,i.lightCone.applyConfig(n,u.current),i.rain.applyConfig(f);const{uniforms:m}=i.simulation;Object.keys(m).forEach(p=>{f[p]!==void 0&&(m[p].value=f[p])});const v=at(f.dropCount,Pe);i.drops.count=v,i.drops.visible=h,i.simulation.update.count=v,h&&a.compute(i.simulation.update),!(!i.impactFoam||!c.visible)&&(i.impactFoam.applyConfig(c,Math.min(v,Ta)),i.impactFoam.render(a))}),null}const Fa=x.memo(Aa);function La(t){const e=la(),a=ca();return x.useMemo(()=>{const r=bt[t];if(!r)return null;const s=r.model==="bret"?e:a;return r.parts.map(u=>s[u])},[e,t,a])}function _a(){const t=new ie;return t.colorNode=q(T(.04,.06,.09),T(.34,.44,.54),Ie.y.mul(.5).add(.5)),t.opacity=.45,t.transparent=!0,t.depthWrite=!1,t.side=gt,t}const it=400;function Ia({resolution:t=1024}){const e=o(60),a=new vt(t,t);a.texture.type=ve,a.texture.magFilter=O,a.texture.minFilter=O,a.texture.generateMipmaps=!1,a.texture.wrapS=xe,a.texture.wrapT=xe,a.texture.colorSpace=Ot;const r=new ft(-1,1,1,-1,.1,it*2);r.position.set(0,it,0),r.rotation.set(-Math.PI/2,0,0);const s=new pt,u=new ie;u.fragmentNode=M(sa.y,Ie.x,Ie.z,1),u.fog=!1,s.overrideMaterial=u;const l=i=>{const n=i.div(e).toVar(),c=n.abs().toVar(),f=C(a.texture,n.add(.5)).toVar(),h=c.x.max(c.y).lessThan(.5);return M(f.xyz,Y(h,f.w,j(0)))},d=i=>{const n=i*.5;e.value=i,r.left=-n,r.right=n,r.top=n,r.bottom=-n,r.updateProjectionMatrix()};return d(e.value),{scene:s,setArea:d,sample:i=>{const n=l(i).toVar();return M(i.x,n.x,i.y,n.w)},slope:i=>{const n=l(i).yz.toVar(),c=n.dot(n).oneMinus().max(.02).sqrt();return n.div(c).negate()},bake(i){const n=i.getRenderTarget?.()||null,c=i.getClearAlpha();i.setClearAlpha(0),i.setRenderTarget(a),i.render(s,r),i.setRenderTarget(n),i.setClearAlpha(c)},dispose(){u.dispose(),a.dispose()}}}const Ea=1024,Oa=22;function Wa(t){const e=new Wt;t.forEach(r=>{r.computeBoundingBox(),e.union(r.boundingBox)});const a=e.getBoundingSphere(new xt);return{centre:e.getCenter(new w),fit:Oa/Math.max(a.radius*2,1e-4)}}function rt(t,e,{centre:a,fit:r}){const s=new me;t.forEach(d=>{const i=new K(d,e);i.position.copy(a).negate(),s.add(i)}),s.scale.setScalar(r);const u=new me,l=new me;return u.add(s),l.add(u),{pivot:l,apply(d,i){u.rotation.x=d.tilt,l.rotation.y=i,l.position.y=d.height,l.scale.setScalar(d.scale)}}}function Ha({config:t,onReady:e}){const a=N(i=>i.gl),r=N(i=>i.scene),s=x.useRef(null),u=x.useRef(0),{mode:l}=t.target,d=La(l);return x.useEffect(()=>{if(!a?.isWebGPURenderer)return;const i=d?d.map(ya):[xa(l)],n=Wa(i),c=Ia({resolution:Ea}),f=new ht,h=_a(),m=rt(i,f,n),v=rt(i,h,n);return v.pivot.visible=!1,v.pivot.renderOrder=-1,c.scene.add(m.pivot),r.add(v.pivot),s.current={baked:m,ghost:v,probe:c},e?.({probe:c}),()=>{s.current=null,e?.(null),r.remove(v.pivot),i.forEach(p=>p.dispose()),f.dispose(),h.dispose(),c.dispose()}},[a,l,d,e,r]),be((i,n)=>{const c=s.current;if(!c)return;const{target:f}=t;u.current+=n*f.spinSpeed,c.baked.apply(f,u.current),c.ghost.apply(f,u.current),c.ghost.pivot.visible=f.reveal===!0,c.probe.setArea(f.probeArea),c.probe.bake(a)}),null}const Ga=x.memo(Ha);class Na{constructor(e){this.params=e,this.init(e)}destroy(){this.params.group.remove(this.mesh),this.geometry.dispose()}hide(){this.mesh.visible=!1}show(){this.mesh.visible=!0}init(e){this.geometry=new Ht,this.mesh=new K(this.geometry,e.material);const a=new w(e.offset.x,e.offset.y);a.applyMatrix4(e.transform),this.geometry.boundingSphere=new xt(a,e.lod>3?e.width*1.75:e.width*3),this.mesh.castShadow=!1,this.mesh.layers.set(e.layer),this.mesh.receiveShadow=!0,e.group.add(this.mesh)}rebuildMeshFromData(e){this.geometry.setAttribute("position",new De(e.positions,3)),this.geometry.setAttribute("normal",new De(e.normals,3)),this.geometry.setAttribute("vindex",new Xe(e.vindices,1)),this.geometry.setAttribute("width",new De(e.width,1)),this.geometry.setAttribute("lod",new Xe(e.lod,1)),this.geometry.setIndex(new Gt(e.indices,1)),this.geometry.attributes.position.needsUpdate=!0,this.geometry.attributes.normal.needsUpdate=!0,this.geometry.attributes.vindex.needsUpdate=!0,this.geometry.attributes.width.needsUpdate=!0,this.geometry.attributes.lod.needsUpdate=!0}}const Q=new w,nt=new w,Te=new w,ot=new w,_=new w,st=new w;function Va(t){const e=[];for(let a=0;a<t;a+=1)for(let r=0;r<t;r+=1)e.push(a*(t+1)+r,(a+1)*(t+1)+r+1,a*(t+1)+r+1),e.push((a+1)*(t+1)+r,(a+1)*(t+1)+r+1,a*(t+1)+r);return e}function ja(t,e){const a=new Array(t.length).fill(0);for(let r=0;r<e.length;r+=3){const s=e[r]*3,u=e[r+1]*3,l=e[r+2]*3;nt.fromArray(t,s),Te.fromArray(t,u),ot.fromArray(t,l),_.subVectors(ot,Te),st.subVectors(nt,Te),_.cross(st),a[s]+=_.x,a[u]+=_.x,a[l]+=_.x,a[s+1]+=_.y,a[u+1]+=_.y,a[l+1]+=_.y,a[s+2]+=_.z,a[u+2]+=_.z,a[l+2]+=_.z}return a}function Ua({lod:t,offset:e,resolution:a,width:r,worldMatrix:s}){const u=[],l=[],d=[],i=[],n=r/2;let c=0;for(let m=0;m<=a;m+=1){const v=r*m/a;for(let p=0;p<=a;p+=1){const S=r*p/a;Q.set(v-n,S-n,0),Q.add(e),Q.applyMatrix4(s),u.push(Q.x,Q.y,Q.z),l.push(c),d.push(r),i.push(t),c+=1}}const f=Va(a),h=ja(u,f);return{indices:Uint32Array.from(f),lod:Uint32Array.from(i),normals:Float32Array.from(h),positions:Float32Array.from(u),vindices:Uint32Array.from(l),width:Float32Array.from(d)}}const Xa=15,qa=36,zt=re("vec3","rowItAloneDisplacedPosition"),Ct=re("vec3","rowItAloneMorphedPosition"),Rt=re("vec3","rowItAloneCascadeScales"),Ya=re("vec2","rowItAloneTexelCoord0"),Ka=re("vec2","rowItAloneTexelCoord1"),Ja=re("vec2","rowItAloneTexelCoord2"),Za=A(`

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
  `,[zt,Ct,Rt,Ya,Ka,Ja]),$a=A(`

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
`),Mt=new Nt(new Uint8Array([0,0,0,255]),1,1);Mt.needsUpdate=!0;class Qa{constructor(e){const a={time:o(0),cameraPosition:o(new w),minLodRadius:Xa,gridResolution:o(e.gridResolution??qa),position:ee("position"),vindex:ee("vindex"),width:ee("width"),lod:ee("lod"),ifftResolution:o(e.ifftResolution),displacement0:C(e.cascades[0].displacement),displacement1:C(e.cascades[1].displacement),displacement2:C(e.cascades[2].displacement),derivatives0:C(e.cascades[0].derivative),derivatives1:C(e.cascades[1].derivative),derivatives2:C(e.cascades[2].derivative),jacobian0:C(e.cascades[0].jacobian),jacobian1:C(e.cascades[1].jacobian),jacobian2:C(e.cascades[2].jacobian),ifft_sampler0:C(e.cascades[0].derivative),ifft_sampler1:C(e.cascades[1].derivative),ifft_sampler2:C(e.cascades[2].derivative),foamStrength:e.foamStrength,foamThreshold:e.foamThreshold,reveal:o(e.reveal??0),foamOnly:o(e.foamOnly??0),impactFoamTexture:C(e.impactFoamTexture??Mt),impactFoamStrength:o(e.impactFoamStrength??.8),impactFoamPatchSize:o(e.impactFoamPatchSize??100),seaColor:o(new de(e.seaColor??"#01040c")),horizonColor:o(new de(e.horizonColor??"#6b9ed1")),skyColor:o(new de(e.skyColor??"#143663")),sunColor:o(new de(e.sunColor??"#ffe6b8")),lodScale:e.lodScale,morphBlend:o(e.morphBlend??1),waveLengths:T(e.cascades[0].params.lengthScale,e.cascades[1].params.lengthScale,e.cascades[2].params.lengthScale),sunPosition:o(e.sunPosition),vMorphedPosition:Ct,vDisplacedPosition:zt,vCascadeScales:Rt},r=new ie;r.positionNode=Za(a),r.colorNode=$a(a),r.side=Vt,r.colorSpace=yt,r.transparent=!1,this.material=r,this.parameters=a}}const ei=A(`

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
`);class ti extends K{constructor(){const e={position:ee("position"),normal:ee("normal"),turbidity:o(10),rayleigh:o(3),mieCoefficient:o(.005),mieDirectionalG:o(.7),elevation:o(2),sunPosition:o(new w(0,0,0)),up:o(new w(0,1,0)),cameraPosition:o(new w(0,0,0))},a=new ie;a.colorNode=ei(e),a.side=jt,a.colorSpace=yt,super(new Ut(1,1,1),a),this.parameters=e}}const ue={seaColor:"#01040c",horizonColor:"#6b9ed1",skyColor:"#143663",sunColor:"#ffe6b8"},lt=new w,ct=new w,Ae=new w,Fe=new w,Bt=160,kt=192,ai=2;function ii(t={}){return{patchResolution:Math.max(ai,Math.round(t.patchResolution??kt)),patchSize:t.patchSize??Bt}}class ri{constructor(e){this.params=e,this.currentConfig=null,this.patch=null,this.patchVisible=!0,this.patchSignature="",this.patchTransform=new Xt().makeRotationX(-Math.PI/2),this.sun=new w}init(){const e=this.currentConfig?.ocean||ue,a=new Qa({foamStrength:this.params.waveGenerator.foamStrength,foamThreshold:this.params.waveGenerator.foamThreshold,ifftResolution:this.params.waveGenerator.size,gridResolution:kt,lodScale:this.params.waveGenerator.lodScale,reveal:this.currentConfig?.ocean?.reveal?1:0,foamOnly:this.currentConfig?.ocean?.foamOnly?1:0,impactFoamTexture:this.params.impactFoamTexture,impactFoamStrength:this.currentConfig?.ocean?.impactFoamStrength??.8,impactFoamPatchSize:this.currentConfig?.ocean?.impactAreaSize,seaColor:e.seaColor,horizonColor:e.horizonColor,skyColor:e.skyColor,sunColor:e.sunColor,morphBlend:0,cascades:this.params.waveGenerator.cascades,sunPosition:this.sun});this.material=a.material,this.materialParameters=a.parameters,this.group=new me,this.params.scene.add(this.group),this.params.withSky!==!1&&(this.sky=new ti,this.sky.layers.set(2),this.sky.scale.setScalar(5e5),this.params.scene.add(this.sky)),this.ensurePatch()}ensurePatch(e){const{patchResolution:a,patchSize:r}=ii(e),s=`${r}:${a}`;this.patchSignature!==s&&(this.patch?.destroy(),Ae.set(0,0,0),this.patch=new Na({group:this.group,layer:this.params.layer,lod:0,material:this.material,offset:Ae.clone(),transform:this.patchTransform,width:r}),this.patch.rebuildMeshFromData(Ua({lod:0,offset:Ae,resolution:a,width:r,worldMatrix:this.patchTransform})),this.patch.mesh.visible=this.patchVisible,this.materialParameters.gridResolution.value=a,this.patchSignature=s)}applyConfig(e){if(this.currentConfig=e,!!e)if(this.ensurePatch(e.ocean),this.patchVisible=e.ocean.visible??!0,this.material.wireframe=e.ocean.wireframe,this.materialParameters.reveal.value=e.ocean.reveal?1:0,this.materialParameters.foamOnly.value=e.ocean.foamOnly?1:0,this.materialParameters.impactFoamStrength.value=e.ocean.impactFoamStrength??.8,this.materialParameters.impactFoamPatchSize.value=e.ocean.impactAreaSize??Bt,this.materialParameters.seaColor.value.set(e.ocean.seaColor||ue.seaColor),this.materialParameters.horizonColor.value.set(e.ocean.horizonColor||ue.horizonColor),this.materialParameters.skyColor.value.set(e.ocean.skyColor||ue.skyColor),this.materialParameters.sunColor.value.set(e.ocean.sunColor||ue.sunColor),this.params.waveGenerator.setFoamStrength(e.foam.foamStrength),this.params.waveGenerator.setFoamThreshold(e.foam.foamThreshold),this.params.waveGenerator.setLodScale(e.ocean.lodScale),this.sky&&e.sky){this.sky.parameters.rayleigh.value=e.sky.rayleigh,this.sky.parameters.turbidity.value=e.sky.turbidity,this.sky.parameters.mieCoefficient.value=e.sky.mieCoefficient,this.sky.parameters.mieDirectionalG.value=e.sky.mieDirectionalG,this.sky.parameters.elevation.value=e.sky.elevation,this.sky.parameters.up.value.fromArray(e.sky.up);const a=qe.degToRad(90-e.sky.elevation),r=qe.degToRad(e.sky.azimuth);this.sun.setFromSphericalCoords(1,a,r),this.sky.parameters.sunPosition.value.copy(this.sun),typeof e.sky.exposure=="number"&&(this.params.renderer.toneMappingExposure=e.sky.exposure)}else this.sun.set(0,1,0),this.params.renderer.toneMappingExposure=1}update(e=this.params.camera){this.params.camera=e,this.params.camera.getWorldPosition(lt),this.params.scene.getWorldPosition(ct),Fe.subVectors(lt,ct),this.sky?.parameters.cameraPosition.value.copy(Fe),this.patch&&(this.patch.mesh.visible=this.patchVisible,this.patch.mesh.material.wireframe=this.currentConfig?.ocean?.wireframe??!1),this.materialParameters.cameraPosition.value.copy(Fe),this.materialParameters.sunPosition.value.copy(this.sun)}dispose(){this.patch?.destroy(),this.patch=null,this.patchSignature="",this.params.scene.remove(this.group),this.sky&&(this.params.scene.remove(this.sky),this.sky.geometry.dispose(),this.sky.material.dispose(),this.sky=null),this.material.dispose()}}const ni=A(`

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
`),oi=A(`

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
`),si=A(`

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
`),li=A(`

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
`),ci=A(`

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
`),ui=A(`

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
`),di=A(`

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
`),fi=A(`

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
`),pi=A(`

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
`);class hi{constructor(e){this.params=e,this.init(e)}init(e){this.squareSize=e.size**2,this.bufferSize=this.squareSize*4,this.spectrumBuffer=new G(new Float32Array(this.bufferSize),4),this.waveDataBuffer=new G(new Float32Array(this.bufferSize),4),this.initialSpectrum=fi({spectrumBuffer:g(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),waveDataBuffer:g(this.waveDataBuffer,"vec4",this.waveDataBuffer.count),index:D,size:e.size,waveLength:o(e.lengthScale),boundaryLow:o(e.boundaryLow),boundaryHigh:o(e.boundaryHigh),...e.waveSettings}).compute(this.squareSize),this.initialSpectrumWithInverse=pi({spectrumBuffer:g(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),index:D,size:e.size}).compute(this.squareSize),e.renderer.compute(this.initialSpectrum),e.renderer.compute(this.initialSpectrumWithInverse)}update(){this.params.renderer.compute(this.initialSpectrum),this.params.renderer.compute(this.initialSpectrumWithInverse)}dispose(){this.spectrumBuffer?.dispose?.(),this.waveDataBuffer?.dispose?.()}}const mi=[16,16,1],gi=[250,17,5],vi=[.9,.9,.9],Se=Object.freeze({Low:Object.freeze({resolution:128}),Medium:Object.freeze({resolution:256}),High:Object.freeze({resolution:512})}),fe="Medium";Se[fe].resolution;const xi=o(.8),yi=o(2.7),Si=o(3.7);function bi(t=fe){return Se[t]||Se[fe]}const Pt={depth:o(20),scaleHeight:o(1),windSpeed:o(1),windDirection:o(0),fetch:o(1e5),spreadBlend:o(1),swell:o(.198),peakEnhancement:o(3.3),shortWaveFade:o(0),fadeLimit:o(0)},wi={depth:{min:.1,max:100},scaleHeight:{min:0,max:1},windSpeed:{min:.01,max:10},windDirection:{min:0,max:2*Math.PI},fetch:{min:10,max:5e5},spreadBlend:{min:0,max:1},swell:{min:0,max:1},peakEnhancement:{min:1,max:5},shortWaveFade:{min:0,max:5},fadeLimit:{min:0,max:1}},Tt={d_depth:o(20),d_scaleHeight:o(1),d_windSpeed:o(1),d_windDirection:o(240/360*2*Math.PI),d_fetch:o(3e5),d_spreadBlend:o(1),d_swell:o(.5),d_peakEnhancement:o(3.3),d_shortWaveFade:o(0),d_fadeLimit:o(0)},Di={d_depth:{min:.1,max:100},d_scaleHeight:{min:0,max:1},d_windSpeed:{min:.01,max:10},d_windDirection:{min:0,max:2*Math.PI},d_fetch:{min:10,max:5e5},d_spreadBlend:{min:0,max:1},d_swell:{min:0,max:1},d_peakEnhancement:{min:1,max:5},d_shortWaveFade:{min:0,max:5},d_fadeLimit:{min:0,max:1}};class zi{constructor(e){this.init(e)}init(e){this.params=e,this.logN=Math.log2(e.size),this.squareSize=e.size**2,this.bufferSize=this.squareSize*2,this.initialSpectrum=new hi(e),this.spectrumBuffer=this.initialSpectrum.spectrumBuffer,this.waveDataBuffer=this.initialSpectrum.waveDataBuffer,this.dxDzBuffer=new G(new Float32Array(this.bufferSize),2),this.dyDxzBuffer=new G(new Float32Array(this.bufferSize),2),this.dyxDyzBuffer=new G(new Float32Array(this.bufferSize),2),this.dxxDzzBuffer=new G(new Float32Array(this.bufferSize),2),this.pingpongBuffer=new G(new Float32Array(this.bufferSize*2),4),this.turbulenceBuffer=new G(new Float32Array(this.bufferSize/2),1),this.displacementIndex=o(0),this.ifftStep=o(0),this.pingpong=o(0),this.deltaTime=o(0),this.displacement=new ze(e.size,e.size),this.derivative=new ze(e.size,e.size),this.jacobian=new ze(e.size,e.size),this.displacement.type=ve,this.derivative.type=ve,this.jacobian.type=qt,this.displacement.generateMipmaps=!1,this.derivative.generateMipmaps=!1,this.jacobian.generateMipmaps=!1,this.displacement.magFilter=O,this.derivative.magFilter=O,this.jacobian.magFilter=O,this.displacement.minFilter=O,this.derivative.minFilter=O,this.jacobian.minFilter=O,this.displacement.wrapS=J,this.displacement.wrapT=J,this.derivative.wrapS=J,this.derivative.wrapT=J,this.jacobian.wrapS=J,this.jacobian.wrapT=J,this.workgroupSize=mi,this.dispatchSize=[e.size/this.workgroupSize[0],e.size/this.workgroupSize[1]],this.computeTimeSpectrum=oi({writeDxDzBuffer:g(this.dxDzBuffer,"vec2",this.dxDzBuffer.count),writeDyDxzBuffer:g(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count),writeDyxDyzBuffer:g(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count),writeDxxDzzBuffer:g(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count),spectrumBuffer:g(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),waveDataBuffer:g(this.waveDataBuffer,"vec4",this.waveDataBuffer.count),index:D,size:y(e.size),time:o(0)}).computeKernel(this.workgroupSize),this.computeInitialize=ci({size:y(e.size),step:y(this.ifftStep),logN:y(this.logN),butterflyBuffer:g(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),DxDzBuffer:g(this.dxDzBuffer,"vec2",this.dxDzBuffer.count).toReadOnly(),DyDxzBuffer:g(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count).toReadOnly(),DyxDyzBuffer:g(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count).toReadOnly(),DxxDzzBuffer:g(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count).toReadOnly(),pingpongBuffer:g(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:y(this.displacementIndex),index:D,workgroupSize:o(new oe().fromArray(this.workgroupSize)),workgroupId:ce,localId:le}).computeKernel(this.workgroupSize),this.computeHorizontalPingPong=si({size:y(e.size),step:y(this.ifftStep),logN:y(this.logN),butterflyBuffer:g(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),pingpongBuffer:g(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:y(this.displacementIndex),pingpong:y(this.pingpong),index:D,workgroupSize:o(new oe().fromArray(this.workgroupSize)),workgroupId:ce,localId:le}).computeKernel(this.workgroupSize),this.computeVerticalPingPong=li({size:y(e.size),step:y(this.ifftStep),logN:y(this.logN),butterflyBuffer:g(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),pingpongBuffer:g(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:y(this.displacementIndex),pingpong:y(this.pingpong),index:D,workgroupSize:o(new oe().fromArray(this.workgroupSize)),workgroupId:ce,localId:le}).computeKernel(this.workgroupSize),this.computePermute=ui({size:y(e.size),pingpongBuffer:g(this.pingpongBuffer,"vec4",this.pingpongBuffer.count).toReadOnly(),DxDzBuffer:g(this.dxDzBuffer,"vec2",this.dxDzBuffer.count),DyDxzBuffer:g(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count),DyxDyzBuffer:g(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count),DxxDzzBuffer:g(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count),initBufferIndex:y(this.displacementIndex),index:D,workgroupSize:o(new oe().fromArray(this.workgroupSize)),workgroupId:ce,localId:le}).computeKernel(this.workgroupSize),this.computeMergeTextures=di({size:y(e.size),index:D,lambda:o(e.lambda),deltaTime:this.deltaTime,DxDzBuffer:g(this.dxDzBuffer,"vec2",this.dxDzBuffer.count).toReadOnly(),DyDxzBuffer:g(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count).toReadOnly(),DyxDyzBuffer:g(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count).toReadOnly(),DxxDzzBuffer:g(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count).toReadOnly(),turbulenceBuffer:g(this.turbulenceBuffer,"float",this.turbulenceBuffer.count),writeDisplacement:Me(this.displacement),writeDerivative:Me(this.derivative),writeJacobian:Me(this.jacobian),workgroupSize:o(new oe().fromArray(this.workgroupSize)),workgroupId:ce,localId:le}).computeKernel(this.workgroupSize)}update(e){this.computeTimeSpectrum.computeNode.parameters.time.value=performance.now()/1e3,this.params.renderer.compute(this.computeTimeSpectrum,this.dispatchSize),this.ifft(0),this.ifft(1),this.ifft(2),this.ifft(3),this.deltaTime.value=e,this.params.renderer.compute(this.computeMergeTextures,this.dispatchSize)}ifft(e){this.displacementIndex.value=e;let a=!0;this.ifftStep.value=0,this.params.renderer.compute(this.computeInitialize,this.dispatchSize);for(let r=1;r<this.logN;r+=1)a=!a,this.ifftStep.value=r,this.pingpong.value=a?1:0,this.params.renderer.compute(this.computeHorizontalPingPong,this.dispatchSize);for(let r=0;r<this.logN;r+=1)a=!a,this.ifftStep.value=r,this.pingpong.value=a?1:0,this.params.renderer.compute(this.computeVerticalPingPong,this.dispatchSize);this.params.renderer.compute(this.computePermute,this.dispatchSize)}dispose(){this.displacement?.dispose?.(),this.derivative?.dispose?.(),this.jacobian?.dispose?.(),this.initialSpectrum?.dispose?.()}}class Ci{constructor(e){this.params=e,this.quality=e.quality??fe}init(){this.qualityPreset=bi(this.quality),this.size=this.qualityPreset.resolution,this.butterflyBuffer=new G(new Float32Array(Math.log2(this.size)*this.size*4),4),this.butterfly=ni({butterflyBuffer:g(this.butterflyBuffer,"vec4",this.butterflyBuffer.count),index:D,N:this.size}).compute(Math.log2(this.size)*this.size),this.params.renderer.compute(this.butterfly),this.waveSettings={...Pt,...Tt},this.cascades=[],this.foamStrength=xi,this.foamThreshold=yi,this.waveLengths=gi,this.lambda=vi,this.lodScale=Si,this.initCascades()}initCascades(){this.cascades.length=0;let e=1e-4;for(let a=0;a<this.waveLengths.length;a+=1){const r=a<this.waveLengths.length-1?2*Math.PI/this.waveLengths[a+1]*6:9999;this.cascades.push(new zi({...this.params,...this.getCascadeParams(a,e,r)})),e=r}}getCascadeParams(e,a,r){return{boundaryHigh:r,boundaryLow:a,butterflyBuffer:this.butterflyBuffer,lambda:this.lambda[e],lengthScale:this.waveLengths[e],size:this.size,waveSettings:this.waveSettings}}setFoamStrength(e){this.foamStrength.value=e}setFoamThreshold(e){this.foamThreshold.value=e}setLodScale(e){this.lodScale.value=e}applyWaveSettings(e){if(!e)return;let a=!1;Object.entries(e).forEach(([r,s])=>{Object.prototype.hasOwnProperty.call(this.waveSettings,r)&&this.waveSettings[r].value!==s&&(this.waveSettings[r].value=s,a=!0)}),a&&this.cascades.forEach(r=>{r.initialSpectrum.update()})}update(e){this.cascades.forEach(a=>{a.update(e)})}dispose(){this.cascades.forEach(e=>{e.dispose?.()}),this.cascades=[],this.butterflyBuffer?.dispose?.()}}function Ri({cascades:t,waveLengths:e}){const a=t.map((u,l)=>o(e?.[l]??u.params.lengthScale)),r=(u,l)=>d=>t.map((i,n)=>C(i[u],d.div(a[n]))[l]).reduce((i,n)=>i.add(n)),s=r("displacement","xyz");return{sample:u=>{const l=s(u);return M(u.x.add(l.x),l.y,u.y.add(l.z),1)},slope:r("derivative","xy"),setWaveLengths(u){a.forEach((l,d)=>{a[d].value=u?.[d]??a[d].value})}}}function Mi(t){return 1e3/Math.max(1,t?.performance?.waveUpdateHz??30)}function Bi({config:t,onReady:e}){const a=N(n=>n.camera),r=N(n=>n.gl),s=N(n=>n.scene),u=x.useRef(null),l=x.useRef(0),d=t?.performance?.quality,i=t?.performance?.pauseWater??!1;return x.useEffect(()=>{if(!r?.isWebGPURenderer)return;const n=new Ci({quality:d,renderer:r});n.init();const c=new vt(1024,1024);c.texture.type=ve,c.texture.magFilter=O,c.texture.minFilter=O,c.texture.generateMipmaps=!1,c.texture.wrapS=xe,c.texture.wrapT=xe;const f=new ri({camera:a,impactFoamTexture:c.texture,layer:0,renderer:r,scene:s,waveGenerator:n,withSky:!1});f.init(),f.applyConfig(t);const h=Ri({cascades:n.cascades,waveLengths:n.waveLengths});return u.current={oceanManager:f,probe:h,waveGenerator:n},e?.({impactFoamRT:c,probe:h}),()=>{l.current=0,u.current=null,e?.(null),f.dispose(),c.dispose(),n.dispose?.()}},[a,r,e,d,s]),be((n,c)=>{const f=u.current;if(!f)return;if(f.waveGenerator.applyWaveSettings(t.waveSettings),f.oceanManager.applyConfig(t),f.probe.setWaveLengths(f.waveGenerator.waveLengths),i){l.current=0,f.oceanManager.update(n.camera);return}const h=Mi(t);for(l.current=Math.min(l.current+c*1e3,h*3);l.current>=h;)f.waveGenerator.update(h),l.current-=h;f.oceanManager.update(n.camera)}),null}function ki(t={}){return{impactAreaSize:{label:"Foam Area",max:400,min:20,render:W,step:1,value:t.impactAreaSize??140},impactDotSize:{label:"Stipple Size",max:4,min:.05,render:W,step:.05,value:t.impactDotSize??.55},impactDotStrength:{label:"Stipple Strength",max:4,min:0,render:W,step:.05,value:t.impactDotStrength??1},impactFoamStrength:{label:"Foam Response",max:3,min:0,render:W,step:.05,value:t.impactFoamStrength??.8},impactFoamDecay:{label:"Foam Decay",max:.3,min:.005,render:W,step:.005,value:t.impactFoamDecay??.06}}}function Pi(t={}){return{lightX:{label:"Center X",max:100,min:-100,step:.5,value:t.lightX??0},lightZ:{label:"Center Z",max:100,min:-100,step:.5,value:t.lightZ??-6},lightHeight:{label:"Height",max:200,min:5,step:1,value:t.lightHeight??62},lightRadius:{label:"Cone Radius",max:60,min:.5,step:.5,value:t.lightRadius??9},lightSpread:{label:"Cone Spread",max:2,min:0,step:.01,value:t.lightSpread??.42},lightSoftness:{label:"Edge Softness",max:6,min:.1,step:.05,value:t.lightSoftness??1.8},lightReach:{label:"Reach",max:300,min:10,step:1,value:t.lightReach??95},lightIntensity:{label:"Intensity",max:8,min:0,step:.05,value:t.lightIntensity??1.6},lightAmbient:{label:"Ambient",max:1,min:0,step:.005,value:t.lightAmbient??.08},lightDriftSpeed:{label:"Drift Speed",max:2,min:0,step:.01,value:t.lightDriftSpeed??.12},lightDriftRadius:{label:"Drift Radius",max:40,min:0,step:.5,value:t.lightDriftRadius??7},lightPulse:{label:"Pulse Amount",max:1,min:0,step:.01,value:t.lightPulse??.22}}}const Oe={Monochrome:{seaColor:"#000000",horizonColor:"#050505",skyColor:"#000000",sunColor:"#ffffff"},"Row It Alone":{seaColor:"#01040c",horizonColor:"#6b9ed1",skyColor:"#143663",sunColor:"#ffe6b8"}};function Ti(t={}){return{oceanDisplayMode:{label:"Water Surface",options:ba,value:t.oceanDisplayMode??"Hidden"},oceanPatchSize:{render:W,label:"Patch Size",max:400,min:50,step:1,value:t.oceanPatchSize??200},oceanPatchResolution:{render:W,label:"Patch Resolution",max:384,min:64,step:1,value:t.oceanPatchResolution??192},oceanLodScale:{render:W,label:"LOD Scale",max:12,min:0,step:.1,value:t.oceanLodScale??3.7},oceanPaletteMode:{render:Ee,label:"Palette",options:Object.keys(Oe).concat("Custom"),value:t.oceanPaletteMode??"Row It Alone"},oceanSeaColor:{label:"Sea",render:he,value:t.oceanSeaColor??"#01040c"},oceanHorizonColor:{label:"Horizon",render:he,value:t.oceanHorizonColor??"#6b9ed1"},oceanSkyColor:{label:"Sky",render:he,value:t.oceanSkyColor??"#143663"},oceanSunColor:{label:"Sun",render:he,value:t.oceanSunColor??"#ffe6b8"},enhanceSurfaceDetails:{render:Ee,label:"Enhance Surface Detail",value:t.enhanceSurfaceDetails??!1},oceanFoamStrength:{render:W,label:"Foam Strength",max:5,min:0,step:.05,value:t.oceanFoamStrength??1.1},oceanFoamThreshold:{render:W,label:"Foam Threshold",max:6,min:0,step:.05,value:t.oceanFoamThreshold??2.8}}}function Ai(t={}){return{rainEnabled:{label:"Rain Enabled",value:t.rainEnabled??!0},timeScale:{label:"Time Scale",max:3,min:-3,step:.05,value:t.timeScale??1},rainDropCount:{label:"Drop Count",max:1e6,min:1e3,step:1e3,value:t.rainDropCount??4e5},rainBounds:{label:"Volume Width",max:400,min:20,step:1,value:t.rainBounds??140},rainCeiling:{label:"Ceiling Y",max:160,min:10,step:.5,value:t.rainCeiling??60},rainSpawnRange:{label:"Spawn Range",max:120,min:1,step:.5,value:t.rainSpawnRange??40},rainFallSpeed:{label:"Fall Speed",max:80,min:1,step:.5,value:t.rainFallSpeed??26},rainSpeedJitter:{label:"Speed Jitter",max:.9,min:0,step:.01,value:t.rainSpeedJitter??.4},rainWindX:{label:"Wind X",max:12,min:-12,step:.1,value:t.rainWindX??.8},rainWindZ:{label:"Wind Z",max:12,min:-12,step:.1,value:t.rainWindZ??0},rainStreakLength:{label:"Streak Length",max:4,min:.05,step:.01,value:t.rainStreakLength??.9},rainStreakWidth:{label:"Streak Width",max:.3,min:.005,step:.005,value:t.rainStreakWidth??.045},rainOpacity:{label:"Opacity",max:2,min:.01,step:.01,value:t.rainOpacity??.5},rainTint:{label:"Tint",value:t.rainTint??"#d5e7f0"},rainEdgeFade:{label:"Edge Fade",max:1,min:0,step:.01,value:t.rainEdgeFade??.55}}}function Fi(t={}){return{catchDepth:{label:"Catch Depth",max:12,min:.1,step:.1,value:t.catchDepth??3},slideGravity:{label:"Slide Gravity",max:120,min:0,step:.5,value:t.slideGravity??18},slideDrag:{label:"Slide Drag",max:12,min:0,step:.05,value:t.slideDrag??2},slopeRelease:{label:"Release Slope",max:6,min:.05,step:.05,value:t.slopeRelease??1.1},surfaceLifeMin:{label:"Cling Time Min",max:6,min:.05,step:.05,value:t.surfaceLifeMin??.6},surfaceLifeMax:{label:"Cling Time Max",max:12,min:.1,step:.05,value:t.surfaceLifeMax??2.5},stretchSpeed:{label:"Streak Stretch Speed",max:40,min:.1,step:.1,value:t.stretchSpeed??6},gravity:{label:"Fall-Off Gravity",max:80,min:0,step:.5,value:t.gravity??20},airDrag:{label:"Fall-Off Air Drag",max:8,min:0,step:.05,value:t.airDrag??1.1},sinkDepth:{label:"Descend Depth",max:120,min:1,step:1,value:t.sinkDepth??26}}}function Li(t={}){return{targetMode:{label:"Surface",options:$e,value:t.targetMode??$e[0]},targetReveal:{label:"Reveal Target",render:$,value:t.targetReveal??!1},targetProbeArea:{label:"Probe Area",max:300,min:8,render:$,step:1,value:t.targetProbeArea??60},targetScale:{label:"Scale",max:6,min:.1,render:$,step:.05,value:t.targetScale??1},targetHeight:{label:"Height",max:40,min:-40,render:$,step:.5,value:t.targetHeight??0},targetTilt:{label:"Tilt",max:Math.PI,min:-Math.PI,render:$,step:.01,value:t.targetTilt??-1.2},targetSpinSpeed:{label:"Spin Speed",max:2,min:-2,render:$,step:.01,value:t.targetSpinSpeed??.16}}}const At=[{prefix:"first_",dataset:Pt,borders:wi},{prefix:"second_",dataset:Tt,borders:Di}];function ut(t,e={}){const{dataset:a,borders:r}=At.find(s=>s.prefix===t);return Object.fromEntries(Object.entries(a).map(([s,u])=>[`${t}${s}`,{label:s,max:r[s].max,min:r[s].min,value:e[`${t}${s}`]??u.value}]))}function _i(t){return Object.fromEntries(At.flatMap(({prefix:e,dataset:a})=>Object.keys(a).map(r=>[r,t[`${e}${r}`]])))}function Ii(t={}){return{quality:{label:"Wave Quality",options:Object.keys(Se),value:t.quality??fe},pauseWater:{label:"Pause Water",value:t.pauseWater??!1},waveUpdateHz:{label:"Wave Update Hz",max:60,min:5,step:1,value:t.waveUpdateHz??30}}}const dt="An Ocean Implied",b={cameraMode:"spline",cameraProjection:"perspective",cameraFrustumHeight:10,cameraMobileFrustumHeight:10,cameraAutoFit:!0,fixedBehavior:"single",fixedShotOverviewDesktopPosition:{x:0,y:8,z:30},fixedShotOverviewDesktopTarget:{x:0,y:1,z:-8},fixedShotOverviewDesktopFov:40,fixedShotOverviewMobilePosition:{x:0,y:8,z:30},fixedShotOverviewMobileTarget:{x:0,y:1,z:-8},fixedShotOverviewMobileFov:40,orbitAutoRotate:!1,orbitAutoRotateSpeed:2,orbitEnablePan:!0,orbitMinPolarAngle:0,orbitMaxPolarAngle:180,orbitAzimuthUnlimited:!0,orbitMinAzimuthAngle:-180,orbitMaxAzimuthAngle:180,orbitMinDistance:0,orbitMaxDistanceUnlimited:!0,orbitMaxDistance:100,orbitDesktopPosition:{x:0,y:8,z:30},orbitDesktopTarget:{x:0,y:1,z:-8},orbitDesktopPivot:{x:0,y:1,z:-8},orbitDesktopFov:40,orbitMobilePosition:{x:0,y:9,z:36},orbitMobileTarget:{x:0,y:1,z:-8},orbitMobilePivot:{x:0,y:1,z:-8},orbitMobileFov:52,splinePreset:"Loop de Loop",splineDesktopTarget:{x:0,y:1,z:-8},splineDesktopFov:40,splineMobileTarget:{x:0,y:1,z:-8},splineMobileFov:52,splineOrientationMode:"target",splineForwardDistance:1,splinePosition:{x:0,y:0,z:0},splineScale:{x:10,y:10,z:10},splineDuration:180,splineTension:.5,splineClosed:!0,splineShowPath:!1,operatorMoveSpeed:6,operatorLiftSpeed:6,operatorBoostMultiplier:2,operatorPointerLookSensitivity:.003,operatorStickLookSpeed:2.5,operatorZoomSpeed:24,operatorMinFov:20,operatorMaxFov:80,targetMode:"Ocean Waves",targetReveal:!1,targetProbeArea:60,targetScale:1,targetHeight:0,targetTilt:-1.2,targetSpinSpeed:.16,rainEnabled:!0,timeScale:1,rainDropCount:8e5,rainBounds:70,rainCeiling:10,rainSpawnRange:40,rainFallSpeed:26,rainSpeedJitter:.4,rainWindX:.8,rainWindZ:0,rainStreakLength:.21,rainStreakWidth:.07,rainOpacity:1.11,rainTint:"#d5e7f0",rainEdgeFade:.55,catchDepth:3,slideGravity:18,slideDrag:2,slopeRelease:1.1,surfaceLifeMin:6,surfaceLifeMax:12,stretchSpeed:5.8,gravity:20,airDrag:1.1,sinkDepth:26,mountainDisplayMode:"Hidden",mountainShape:"Range",mountainPalette:"Monochrome",mountainMeshResolution:512,mountainFieldResolution:1024,mountainExtent:140,mountainRelief:140,mountainBaseHeight:.4,mountainFrequency:2.2,mountainAmplitude:.125,peakRadius:.35,peakAmplitude:.1,mountainTreeline:.465,erosionScale:.15,erosionStrength:.22,erosionGullyWeight:.5,erosionDetail:1.5,erosionOctaves:5,lightX:0,lightZ:-6,lightHeight:62,lightRadius:9,lightSpread:.42,lightSoftness:1.8,lightReach:95,lightIntensity:1.6,lightAmbient:.08,lightDriftSpeed:.12,lightDriftRadius:7,lightPulse:.22,oceanDisplayMode:"Hidden",oceanPatchSize:200,oceanPatchResolution:192,oceanLodScale:3.7,oceanPaletteMode:"Monochrome",oceanSeaColor:"#000000",oceanHorizonColor:"#050505",oceanSkyColor:"#000000",oceanSunColor:"#ffffff",enhanceSurfaceDetails:!1,oceanFoamStrength:1.1,oceanFoamThreshold:2.8,impactAreaSize:140,impactDotSize:.55,impactDotStrength:1,impactFoamStrength:.8,impactFoamDecay:.06,quality:"Medium",pauseWater:!1,waveUpdateHz:30,first_depth:20,first_scaleHeight:1,first_windSpeed:1,first_windDirection:0,first_fetch:1e5,first_spreadBlend:1,first_swell:.198,first_peakEnhancement:3.3,first_shortWaveFade:0,first_fadeLimit:0,second_d_depth:20,second_d_scaleHeight:1,second_d_windSpeed:1,second_d_windDirection:4.1887902047863905,second_d_fetch:3e5,second_d_spreadBlend:1,second_d_swell:.5,second_d_peakEnhancement:3.3,second_d_shortWaveFade:0,second_d_fadeLimit:0},Le={"An Ocean Implied":{...b},"Rain on Ocean Reverse":{...b,timeScale:-1.6,rainDropCount:5e5,rainOpacity:1.23,surfaceLifeMin:.4,surfaceLifeMax:1.6,lightDriftSpeed:.08,lightPulse:.1},Downpour:{...b,rainDropCount:7e5,rainFallSpeed:34,rainStreakLength:.24,rainStreakWidth:.08,rainOpacity:.8,slideGravity:30,slopeRelease:.85,surfaceLifeMax:1.5,stretchSpeed:9.7,lightRadius:14,lightIntensity:1.85,lightDriftSpeed:.2},Drizzle:{...b,rainDropCount:18e4,rainFallSpeed:17,rainStreakLength:.17,rainStreakWidth:.055,rainOpacity:.86,slideGravity:12,slideDrag:3,slopeRelease:1.4,surfaceLifeMin:1.2,surfaceLifeMax:4,stretchSpeed:2.6,lightIntensity:1.35,lightDriftSpeed:.06},"Rain on Torus":{...b,targetMode:"Torus",targetProbeArea:26,rainDropCount:6e5,rainBounds:62,rainCeiling:34,rainSpawnRange:22,rainFallSpeed:22,rainWindX:0,rainStreakLength:.14,rainStreakWidth:.045,rainOpacity:1.07,rainEdgeFade:.72,catchDepth:1.6,slideGravity:12,slideDrag:5,slopeRelease:3,surfaceLifeMin:1.5,surfaceLifeMax:5.5,stretchSpeed:3.7,sinkDepth:34,lightHeight:40,lightRadius:16,lightSpread:.3,lightSoftness:1.4,lightReach:78,lightIntensity:1.5,lightAmbient:.1,lightDriftSpeed:.07,lightDriftRadius:4},"Rain on Torus Knot":{...b,targetMode:"Torus Knot",targetProbeArea:26,targetSpinSpeed:.24,rainDropCount:6e5,rainBounds:62,rainCeiling:34,rainSpawnRange:22,rainFallSpeed:22,rainWindX:0,rainStreakLength:.14,rainStreakWidth:.045,rainOpacity:1.07,rainEdgeFade:.72,catchDepth:1.6,slideGravity:12,slideDrag:5,slopeRelease:3,surfaceLifeMin:1.5,surfaceLifeMax:5.5,stretchSpeed:3.7,sinkDepth:34,lightHeight:40,lightRadius:16,lightSpread:.3,lightSoftness:1.4,lightReach:78,lightIntensity:1.5,lightAmbient:.1,lightDriftSpeed:.07,lightDriftRadius:4},"Rain on Sphere":{...b,targetMode:"Sphere",targetProbeArea:26,targetTilt:0,rainDropCount:6e5,rainBounds:62,rainCeiling:34,rainSpawnRange:22,rainFallSpeed:22,rainWindX:0,rainStreakLength:.14,rainStreakWidth:.045,rainOpacity:1.07,rainEdgeFade:.72,catchDepth:1.6,slideGravity:12,slideDrag:5,slopeRelease:3,surfaceLifeMin:1.5,surfaceLifeMax:5.5,stretchSpeed:3.7,sinkDepth:34,lightHeight:40,lightRadius:16,lightSpread:.3,lightSoftness:1.4,lightReach:78,lightIntensity:1.5,lightAmbient:.1,lightDriftSpeed:.07,lightDriftRadius:4},"Rain on Bret":{...b,cameraMode:"orbit",orbitDesktopPosition:{x:0,y:26,z:26},orbitDesktopTarget:{x:0,y:0,z:0},orbitDesktopPivot:{x:0,y:0,z:0},orbitMobilePosition:{x:0,y:32,z:32},orbitMobileTarget:{x:0,y:0,z:0},orbitMobilePivot:{x:0,y:0,z:0},targetMode:"Bret",targetProbeArea:26,targetTilt:-.5,targetSpinSpeed:0,rainDropCount:7e5,rainBounds:54,rainCeiling:34,rainSpawnRange:22,rainFallSpeed:22,rainWindX:0,rainStreakLength:.14,rainStreakWidth:.045,rainOpacity:.73,rainEdgeFade:.8,catchDepth:1,slideGravity:30,slideDrag:4,slopeRelease:3,surfaceLifeMin:1.5,surfaceLifeMax:5.5,stretchSpeed:7,sinkDepth:34,lightHeight:44,lightRadius:20,lightSpread:.3,lightSoftness:1.4,lightReach:78,lightIntensity:1.5,lightAmbient:.1,lightDriftSpeed:.07,lightDriftRadius:4},"Rain on Bret Inner":{...b,cameraMode:"orbit",orbitDesktopPosition:{x:0,y:26,z:26},orbitDesktopTarget:{x:0,y:0,z:0},orbitDesktopPivot:{x:0,y:0,z:0},orbitMobilePosition:{x:0,y:32,z:32},orbitMobileTarget:{x:0,y:0,z:0},orbitMobilePivot:{x:0,y:0,z:0},targetMode:"Bret Inner",targetProbeArea:26,targetTilt:-.5,targetSpinSpeed:0,rainDropCount:7e5,rainBounds:54,rainCeiling:34,rainSpawnRange:22,rainFallSpeed:22,rainWindX:0,rainStreakLength:.14,rainStreakWidth:.045,rainOpacity:.73,rainEdgeFade:.8,catchDepth:1,slideGravity:30,slideDrag:4,slopeRelease:3,surfaceLifeMin:1.5,surfaceLifeMax:5.5,stretchSpeed:7,sinkDepth:34,lightHeight:44,lightRadius:20,lightSpread:.3,lightSoftness:1.4,lightReach:78,lightIntensity:1.5,lightAmbient:.1,lightDriftSpeed:.07,lightDriftRadius:4},"Rain on Reversal":{...b,cameraMode:"orbit",orbitDesktopPosition:{x:0,y:26,z:26},orbitDesktopTarget:{x:0,y:0,z:0},orbitDesktopPivot:{x:0,y:0,z:0},orbitMobilePosition:{x:0,y:32,z:32},orbitMobileTarget:{x:0,y:0,z:0},orbitMobilePivot:{x:0,y:0,z:0},targetMode:"Reversal",targetProbeArea:26,targetTilt:-.5,targetSpinSpeed:0,rainDropCount:7e5,rainBounds:54,rainCeiling:34,rainSpawnRange:22,rainFallSpeed:22,rainWindX:0,rainStreakLength:.14,rainStreakWidth:.045,rainOpacity:.73,rainEdgeFade:.8,catchDepth:1,slideGravity:30,slideDrag:4,slopeRelease:3,surfaceLifeMin:1.5,surfaceLifeMax:5.5,stretchSpeed:7,sinkDepth:34,lightHeight:44,lightRadius:20,lightSpread:.3,lightSoftness:1.4,lightReach:78,lightIntensity:1.5,lightAmbient:.1,lightDriftSpeed:.07,lightDriftRadius:4},"Rain on Reversal Inner":{...b,cameraMode:"orbit",orbitDesktopPosition:{x:0,y:26,z:26},orbitDesktopTarget:{x:0,y:0,z:0},orbitDesktopPivot:{x:0,y:0,z:0},orbitMobilePosition:{x:0,y:32,z:32},orbitMobileTarget:{x:0,y:0,z:0},orbitMobilePivot:{x:0,y:0,z:0},targetMode:"Reversal Inner",targetProbeArea:26,targetTilt:-.5,targetSpinSpeed:0,rainDropCount:7e5,rainBounds:54,rainCeiling:34,rainSpawnRange:22,rainFallSpeed:22,rainWindX:0,rainStreakLength:.14,rainStreakWidth:.045,rainOpacity:.73,rainEdgeFade:.8,catchDepth:1,slideGravity:30,slideDrag:4,slopeRelease:3,surfaceLifeMin:1.5,surfaceLifeMax:5.5,stretchSpeed:7,sinkDepth:34,lightHeight:44,lightRadius:20,lightSpread:.3,lightSoftness:1.4,lightReach:78,lightIntensity:1.5,lightAmbient:.1,lightDriftSpeed:.07,lightDriftRadius:4},"Foam + Rain":{...b,lightAmbient:.12,oceanDisplayMode:"Foam Only",oceanFoamStrength:1.35,oceanFoamThreshold:2.9,impactDotSize:.7,impactDotStrength:1.5,impactFoamStrength:1.2,impactFoamDecay:.05},"Visible Ocean":{...b,rainDropCount:26e4,rainOpacity:.78,lightIntensity:1.2,lightAmbient:.22,oceanDisplayMode:"Full",oceanPaletteMode:"Row It Alone",oceanSeaColor:"#01040c",oceanHorizonColor:"#6b9ed1",oceanSkyColor:"#143663",oceanSunColor:"#ffe6b8",enhanceSurfaceDetails:!0,impactDotSize:.75,impactDotStrength:1.4,impactFoamStrength:1.1,impactFoamDecay:.05},"A Mountain Implied":{...b,targetMode:"Mountain",rainDropCount:7e5,rainBounds:120,rainCeiling:42,rainSpawnRange:26,rainFallSpeed:24,rainWindX:.4,rainStreakLength:.18,rainStreakWidth:.06,rainEdgeFade:.7,catchDepth:2,slideGravity:26,slideDrag:3.2,slopeRelease:1.2,surfaceLifeMin:4,surfaceLifeMax:11,stretchSpeed:5,sinkDepth:30,lightHeight:74,lightRadius:18,lightSpread:.36,lightReach:130,lightIntensity:1.7,lightAmbient:.07,lightDriftRadius:12},"A Single Peak Implied":{...b,targetMode:"Mountain",rainDropCount:7e5,rainBounds:110,rainCeiling:38,rainSpawnRange:26,rainFallSpeed:24,rainWindX:.4,rainStreakLength:.18,rainStreakWidth:.06,rainEdgeFade:.7,catchDepth:2,slideGravity:26,slideDrag:3.2,slopeRelease:1.2,surfaceLifeMin:4,surfaceLifeMax:11,stretchSpeed:5,sinkDepth:30,mountainShape:"Single Peak",mountainBaseHeight:.45,lightHeight:66,lightRadius:18,lightSpread:.36,lightReach:120,lightIntensity:1.7,lightAmbient:.07,lightDriftRadius:12},"Visible Single Peak":{...b,targetMode:"Mountain",rainDropCount:32e4,rainBounds:110,rainCeiling:38,rainSpawnRange:26,rainFallSpeed:24,rainWindX:.4,rainStreakLength:.18,rainStreakWidth:.06,rainOpacity:.82,rainEdgeFade:.7,catchDepth:2,slideGravity:26,slideDrag:3.2,slopeRelease:1.2,surfaceLifeMin:4,surfaceLifeMax:11,stretchSpeed:5,sinkDepth:30,mountainDisplayMode:"Full",mountainShape:"Single Peak",mountainBaseHeight:.45,lightHeight:66,lightRadius:18,lightSpread:.36,lightReach:120,lightIntensity:1.25,lightAmbient:.2,lightDriftRadius:12},"Visible Mountain":{...b,targetMode:"Mountain",rainDropCount:32e4,rainBounds:120,rainCeiling:42,rainSpawnRange:26,rainFallSpeed:24,rainWindX:.4,rainStreakLength:.18,rainStreakWidth:.06,rainOpacity:.82,rainEdgeFade:.7,catchDepth:2,slideGravity:26,slideDrag:3.2,slopeRelease:1.2,surfaceLifeMin:4,surfaceLifeMax:11,stretchSpeed:5,sinkDepth:30,mountainDisplayMode:"Full",lightHeight:74,lightRadius:18,lightSpread:.36,lightReach:130,lightIntensity:1.25,lightAmbient:.2,lightDriftRadius:12},"Still Light":{...b,rainWindX:0,lightDriftSpeed:0,lightPulse:0}};function Ei({presetSnapshot:t}){return{...t}}const X=[0,1,-8],Oi={defaultMode:"spline",spline:{desktop:{target:X,fov:40},mobile:{target:X,fov:52},preset:"Loop de Loop",duration:180,scale:[10,10,10]},orbit:{desktop:{position:[0,8,30],target:X,pivot:X,fov:40},mobile:{position:[0,9,36],target:X,pivot:X,fov:52}},fixed:{behavior:"single",activeShot:"overview",shots:{overview:{desktop:{position:[0,8,30],target:X,fov:40}}}}};function Wi(){const{attachSetControls:t,controlsSnapshotRef:e,initialPreset:a,presetsFolder:r}=ua({defaultPreset:dt,getPresetControls:Ei,presets:Le}),s=Le[a]||Le[dt],u=x.useRef(null),{buildCamera:l,cameraControls:d}=Kt({apiRef:u,camera:Oi,cameraFolderPath:Sa,controlsSnapshotRef:e}),[i,n]=Yt(ae,()=>({Presets:r,Camera:L(d,{collapsed:!0}),Target:L(Li(s),{collapsed:!0}),Rain:L(Ai(s),{collapsed:!0}),Surface:L(Fi(s),{collapsed:!0}),Mountain:L(Da(s),{collapsed:!0}),Light:L(Pi(s),{collapsed:!0}),Ocean:L(Ti(s),{collapsed:!0}),Impacts:L(ki(s),{collapsed:!0}),Performance:L(Ii(s),{collapsed:!0}),"First Wave Spectrum":L(ut("first_",s),{collapsed:!0}),"Second Wave Spectrum":L(ut("second_",s),{collapsed:!0})}));t(n),e.current={...i},da({fileName:ae});const c=x.useMemo(()=>Jt(i),[i]),f=x.useMemo(()=>l(i),[l,c]),h=x.useMemo(()=>i.oceanPaletteMode==="Custom"?{horizonColor:i.oceanHorizonColor,seaColor:i.oceanSeaColor,skyColor:i.oceanSkyColor,sunColor:i.oceanSunColor}:Oe[i.oceanPaletteMode]||Oe["Row It Alone"],[i.oceanHorizonColor,i.oceanPaletteMode,i.oceanSeaColor,i.oceanSkyColor,i.oceanSunColor]);return x.useMemo(()=>({...i,camera:f,cameraApiRef:u,ocean:{...h,impactAreaSize:i.impactAreaSize,impactDotSize:i.impactDotSize,impactDotStrength:i.impactDotStrength,impactFoamDecay:i.impactFoamDecay,impactFoamStrength:i.impactFoamStrength,lodScale:i.oceanLodScale,patchResolution:i.oceanPatchResolution,patchSize:i.oceanPatchSize,foamOnly:i.oceanDisplayMode==="Foam Only",reveal:i.enhanceSurfaceDetails?1:0,visible:i.oceanDisplayMode!=="Hidden",wireframe:!1},foam:{foamStrength:i.oceanFoamStrength,foamThreshold:i.oceanFoamThreshold},light:{ambient:i.lightAmbient,driftRadius:i.lightDriftRadius,driftSpeed:i.lightDriftSpeed,height:i.lightHeight,intensity:i.lightIntensity,pulse:i.lightPulse,radius:i.lightRadius,reach:i.lightReach,softness:i.lightSoftness,spread:i.lightSpread,x:i.lightX,z:i.lightZ},mountain:{baseHeight:i.mountainBaseHeight,erosionDetail:i.erosionDetail,erosionGullyWeight:i.erosionGullyWeight,erosionOctaves:i.erosionOctaves,erosionScale:i.erosionScale,erosionStrength:i.erosionStrength,extent:i.mountainExtent,fieldResolution:i.mountainFieldResolution,meshResolution:i.mountainMeshResolution,mountainAmplitude:i.mountainAmplitude,mountainFrequency:i.mountainFrequency,mountainTreeline:i.mountainTreeline,palette:i.mountainPalette,peakAmplitude:i.peakAmplitude,peakRadius:i.peakRadius,relief:i.mountainRelief,shape:i.mountainShape,visible:i.mountainDisplayMode!=="Hidden"},performance:{pauseWater:i.pauseWater,quality:i.quality,waveUpdateHz:i.waveUpdateHz},waveSettings:_i(i),target:{height:i.targetHeight,mode:i.targetMode,probeArea:i.targetProbeArea,reveal:i.targetReveal,scale:i.targetScale,spinSpeed:i.targetSpinSpeed,tilt:i.targetTilt},rain:{airDrag:i.airDrag,bounds:i.rainBounds,catchDepth:i.catchDepth,ceiling:i.rainCeiling,dropCount:i.rainDropCount,edgeFade:i.rainEdgeFade,enabled:i.rainEnabled,fallSpeed:i.rainFallSpeed,gravity:i.gravity,opacity:i.rainOpacity,sinkDepth:i.sinkDepth,slideDrag:i.slideDrag,slideGravity:i.slideGravity,slopeRelease:i.slopeRelease,spawnRange:i.rainSpawnRange,speedJitter:i.rainSpeedJitter,streakLength:i.rainStreakLength,streakWidth:i.rainStreakWidth,stretchSpeed:i.stretchSpeed,surfaceLifeMax:i.surfaceLifeMax,surfaceLifeMin:i.surfaceLifeMin,timeScale:i.timeScale,tint:i.rainTint,windX:i.rainWindX,windZ:i.rainWindZ}}),[f,i,h])}const Hi={[He]:Ca,[We]:Bi};function Gi(){const t=Wi(),[e,a]=x.useState(null),r=Hi[t.target.mode]??Ga;return Z.jsxs(Z.Fragment,{children:[Z.jsx(Zt,{camera:t.camera}),Z.jsx("color",{attach:"background",args:["#000000"]}),Z.jsx(r,{config:t,onReady:a}),e&&Z.jsx(Fa,{config:t,surface:e})]})}const dr=x.memo(Gi);export{dr as default};
