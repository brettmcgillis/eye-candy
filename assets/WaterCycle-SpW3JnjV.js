import{O as it,aN as nt,aM as ke,aQ as ot,y as $,aL as Q,a7 as st,V as S,C as se,l as lt,r as w,d as U,a as Ee,aX as zt,aS as Dt,aW as Bt,di as Ct,ai as ct,H as he,U as F,ao as ve,aK as Rt,ax as Tt,a9 as ut,G as pe,L as Pt,aT as Se,cZ as He,S as Mt,aA as kt,F as It,aq as ft,B as At,aO as Ft,b as Lt,f as Ve,c_ as O,c$ as be,Y as _t,bf as X,m as ae,a3 as Et,az as A,j as H}from"./index-DN0oVO6x.js";import{u as Ot,g as Wt,C as Gt}from"./useSceneCameraControls-BPVno8sp.js";import"./cameraSplinePresets-V8p1Ds6y.js";import"./useOperatorInput-Dx7RrU7n.js";import{u as n,d as L,G as ge,k as dt,s as J,f as Z,e as j,F as Ie,bJ as je,j as T,v as Ae,bt as Nt,r as Ht,bw as Vt,ax as ze,br as Ue,ay as b,bK as jt,S as re,az as x,n as Fe,p as Ut,t as D,bj as P,bk as ee,av as K,bl as v,bm as ie,bn as ne,bo as De}from"./three.tsl-CJtse7Xt.js";import{u as Xt}from"./Bret-CLv5mzkc.js";import{u as qt}from"./Reversal-1vBnfT0k.js";import{u as Yt}from"./usePresetsFolder-19LTK0A0.js";import{u as Kt}from"./useMediaRecorder-eB5-QYn2.js";import"./useCameraSpline-BJvGqjJ1.js";import"./PerspectiveCamera-9XlQ4x0_.js";import"./extends-CF3RwP-h.js";import"./Fbo-DbA1NBBn.js";import"./OrbitControls-By5n0Rf2.js";import"./Line-K669_l4f.js";import"./Line2-C3wn-MDM.js";import"./constants-DvwsRCQh.js";import"./react-spring_three.modern--_6s7G_h.js";import"./Gltf-CM2OFXUe.js";function Jt({renderTarget:t,simulation:e}){const a=n(.55),i=n(1),s=new it(-70,70,70,-70,.1,400);s.position.set(0,200,0),s.lookAt(0,0,0);const u=new nt,c=new ke(1,1);c.rotateX(-Math.PI/2);const p=new ot({color:0,depthTest:!1,depthWrite:!1,opacity:.06,transparent:!0}),r=new $(c,p);u.add(r);const o=e.positionBuffer.toAttribute(),l=e.motionBuffer.toAttribute(),f=o.w.greaterThan(.5).and(o.w.lessThan(1.5)),m=new Q;m.positionNode=L(o.x.add(ge.x.mul(a)),0,o.z.add(ge.z.mul(a))),m.colorNode=dt().sub(.5).length().mul(2).oneMinus().saturate().pow(2).mul(J(f,Z(1),Z(0))).mul(l.w.mul(-1.2).exp()).mul(i),m.blending=st,m.depthTest=!1,m.depthWrite=!1,m.forceSinglePass=!0,m.transparent=!0;const h=new ke(1,1);h.rotateX(-Math.PI/2);const g=new $(h,m);return g.frustumCulled=!1,g.renderOrder=1,u.add(g),{applyConfig(d,y){const R=d.impactAreaSize*.5;s.left=-R,s.right=R,s.top=R,s.bottom=-R,s.updateProjectionMatrix(),r.scale.set(d.impactAreaSize,d.impactAreaSize,1),p.opacity=d.impactFoamDecay,a.value=d.impactDotSize,i.value=d.impactDotStrength,g.count=y},clear(d){const y=d.getRenderTarget?.()||null;d.setRenderTarget(t),d.clear(!0,!0,!0),d.setRenderTarget(y)},dispose(){u.remove(r),u.remove(g),c.dispose(),p.dispose(),h.dispose(),m.dispose()},render(d){const y=d.getRenderTarget?.()||null;d.setRenderTarget(t),d.render(u,s),d.setRenderTarget(y)}}}function Zt(){const t=n(new S(0,60,0)),e=n(9),a=n(.42),i=n(1.8),s=n(95),u=n(1.6),c=n(.08);return{applyConfig:(o,l)=>{o&&(t.value.set(o.x+Math.sin(l)*o.driftRadius,o.height,o.z+Math.sin(l*.73)*o.driftRadius),e.value=o.radius,a.value=o.spread,i.value=o.softness,s.value=o.reach,c.value=o.ambient,u.value=o.intensity*(1+Math.sin(l*1.31)*o.pulse))},evaluate:o=>{const l=o.sub(t),f=l.y.negate().max(0),m=e.add(f.mul(a)),h=l.xz.length().div(m.max(.001)).oneMinus().saturate().pow(i);return c.add(h.mul(f.div(s).oneMinus().saturate()).mul(u))},origin:t}}function $t({lightCone:t,simulation:e}){const a={streakLength:n(.9),streakWidth:n(.045),opacity:n(.5),stretchSpeed:n(6),tint:n(new se("#d5e7f0")),edgeFade:n(.55)},i=e.positionBuffer.toAttribute(),s=e.motionBuffer.toAttribute(),u=e.anchorBuffer.toAttribute(),c=i.xyz,p=u.z,r=j(.6,1.4,p),o=a.streakWidth.mul(r),l=s.xyz.length().div(a.stretchSpeed.max(.001)).saturate(),f=a.streakLength.mul(r).mul(l).max(o),m=Ie(()=>{const C=je.mul(T(s.xyz,0)).xy.toVar(),I=J(C.length().lessThan(1e-4),Ae(0,1),C.normalize()).toVar(),W=Ae(I.y,I.x.negate()),E=je.mul(T(c,1)).toVar(),ue=W.mul(ge.x.mul(o)).add(I.mul(ge.y.mul(f)));return Nt.mul(T(E.xy.add(ue),E.z,E.w))}),h=c.y.div(e.uniforms.sinkDepth.negate()).oneMinus().saturate().pow(1.5),g=Ht(a.edgeFade.min(.999),1,c.xz.length().div(e.uniforms.bounds.mul(.5))).oneMinus(),d=Vt(t.evaluate(c).mul(h).mul(g)),y=dt(),R=y.x.sub(.5).abs().mul(2).oneMinus().pow(1.5).mul(y.y.sub(.5).abs().mul(2).oneMinus().pow(.5)).mul(j(.5,1.4,y.y)).saturate(),B=new Q;return B.vertexNode=m(),B.colorNode=a.tint.mul(R).mul(d).mul(a.opacity),B.blending=st,B.depthWrite=!1,B.forceSinglePass=!0,B.side=lt,B.transparent=!0,{applyConfig:C=>{a.streakLength.value=C.streakLength,a.streakWidth.value=C.streakWidth,a.opacity.value=C.opacity,a.stretchSpeed.value=C.stretchSpeed,a.edgeFade.value=C.edgeFade,a.tint.value.set(C.tint)},material:B,uniforms:a}}const Be=0,Qt=1,Xe=2;function ea({capacity:t,probe:e}){const a={bounds:n(140),ceiling:n(60),spawnRange:n(40),fallSpeed:n(26),speedJitter:n(.4),windX:n(.8),windZ:n(0),catchDepth:n(3),surfaceLifeMin:n(.6),surfaceLifeMax:n(2.5),slideGravity:n(18),slideDrag:n(2),slopeRelease:n(1.1),airDrag:n(1.1),gravity:n(20),sinkDepth:n(26),timeScale:n(1)},i=ze(t,"vec4"),s=ze(t,"vec4"),u=ze(t,"vec4"),c=(l,f)=>Ue(b.mul(x(64)).add(x(l).mul(x(8))).add(x(f))),p=l=>L(c(l,1).sub(.5).mul(a.bounds),a.ceiling.add(c(l,2).mul(a.spawnRange)),c(l,3).sub(.5).mul(a.bounds)),r=Ie(()=>{const l=Ue(b).mul(4096).floor(),f=p(l).toVar();f.y.assign(c(l,8).mul(a.ceiling.add(a.spawnRange)).sub(a.ceiling.mul(.15))),i.element(b).assign(T(f,Be)),s.element(b).assign(T(0,0,0,0)),u.element(b).assign(T(0,0,c(l,4),l))})().compute(t),o=Ie(()=>{const l=i.element(b),f=s.element(b),m=u.element(b),h=l.xyz.toVar(),g=l.w.toVar(),d=f.xyz.toVar(),y=f.w.toVar(),R=m.xy.toVar(),B=m.z.toVar(),te=m.w.toVar(),C=a.timeScale.toVar(),I=jt.mul(C.abs()).min(.05).toVar(),W=I.mul(C.sign()).toVar(),E=C.lessThan(0),ue=()=>{const z=p(te.add(1)).toVar();y.assign(0),te.addAssign(1),B.assign(c(te,4)),re(E,()=>{g.assign(Xe),z.y.assign(a.sinkDepth.negate()),d.assign(L(0,a.fallSpeed.negate(),0))}).Else(()=>{g.assign(Be)}),h.assign(z)},Ge=(z,M)=>{g.assign(Qt),y.assign(M),d.assign(L(0,0,0)),R.assign(h.xz.mul(2).sub(z.xz)),h.assign(e.sample(R).xyz)},Ne=()=>J(E,h.y.greaterThan(a.ceiling.add(a.spawnRange)),h.y.lessThan(a.sinkDepth.negate()));re(g.lessThan(.5),()=>{d.assign(L(a.windX,a.fallSpeed.mul(j(a.speedJitter.oneMinus(),1,B)).negate(),a.windZ)),h.addAssign(d.mul(W));const z=e.sample(h.xz).toVar(),M=a.catchDepth.max(d.y.abs().mul(I).mul(1.5));re(C.greaterThan(0).and(z.w.greaterThan(.5)).and(h.y.lessThan(z.y)).and(h.y.greaterThan(z.y.sub(M))),()=>{Ge(z,Z(0))}).ElseIf(Ne(),ue)}).ElseIf(g.lessThan(1.5),()=>{y.addAssign(W);const z=e.slope(R).toVar(),M=d.xz.sub(z.mul(a.slideGravity.mul(W))).mul(a.slideDrag.mul(I).negate().exp()).toVar();R.addAssign(M.mul(W));const N=e.sample(R).toVar();h.assign(N.xyz),d.assign(L(M.x,z.dot(M),M.y));const we=j(a.surfaceLifeMin,a.surfaceLifeMax,B);re(N.w.lessThan(.5).or(z.length().greaterThan(a.slopeRelease)).or(J(E,y.lessThan(0),y.greaterThan(we))),()=>{g.assign(J(E,Z(Be),Z(Xe))),y.assign(0)})}).Else(()=>{y.addAssign(W);const z=a.airDrag.mul(I).negate().exp(),M=j(Ae(a.windX,a.windZ),d.xz,z);d.assign(L(M.x,d.y.sub(a.gravity.mul(I)).max(a.fallSpeed.negate()),M.y)),h.addAssign(d.mul(W));const N=e.sample(h.xz).toVar(),we=a.catchDepth.max(d.y.abs().mul(I).mul(1.5));re(E.and(N.w.greaterThan(.5)).and(h.y.greaterThan(N.y)).and(h.y.lessThan(N.y.add(we))),()=>{Ge(N,j(a.surfaceLifeMin,a.surfaceLifeMax,B))}).ElseIf(Ne(),ue)}),l.assign(T(h,g)),f.assign(T(d,y)),m.assign(T(R,B,te))})().compute(t);return{anchorBuffer:u,init:r,motionBuffer:s,positionBuffer:i,uniforms:a,update:o}}const Ce=1e6,ta=12e4;function qe(t,e){return Math.max(1e3,Math.min(e,Math.floor(t||1e3)))}function aa({config:t,surface:e}){const a=U(c=>c.gl),i=U(c=>c.scene),s=w.useRef(null),u=w.useRef(0);return w.useEffect(()=>{if(!a?.isWebGPURenderer||!e?.probe)return;const c=ea({capacity:Ce,probe:e.probe}),p=Zt(),r=$t({lightCone:p,simulation:c}),o=e.impactFoamRT?Jt({renderTarget:e.impactFoamRT,simulation:c}):null,l=new $(new ke(1,1),r.material);return l.frustumCulled=!1,l.count=qe(t?.rain?.dropCount,Ce),i.add(l),o?.clear(a),a.compute(c.init),s.current={drops:l,impactFoam:o,lightCone:p,rain:r,simulation:c},()=>{s.current=null,i.remove(l),l.geometry.dispose(),r.material.dispose(),o?.dispose()}},[a,i,e]),Ee((c,p)=>{const r=s.current;if(!r)return;const{light:o,ocean:l,rain:f}=t,m=f.enabled!==!1;u.current+=p*o.driftSpeed,r.lightCone.applyConfig(o,u.current),r.rain.applyConfig(f);const{uniforms:h}=r.simulation;Object.keys(h).forEach(d=>{f[d]!==void 0&&(h[d].value=f[d])});const g=qe(f.dropCount,Ce);r.drops.count=g,r.drops.visible=m,r.simulation.update.count=g,m&&a.compute(r.simulation.update),!(!r.impactFoam||!l.visible)&&(r.impactFoam.applyConfig(l,Math.min(g,ta)),r.impactFoam.render(a))}),null}const ra=w.memo(aa),ye="Ocean Waves",pt={Bret:{model:"bret",parts:["inner","outer"]},"Bret Inner":{model:"bret",parts:["inner"]},Reversal:{model:"reversal",parts:["inner","outer"]},"Reversal Inner":{model:"reversal",parts:["inner"]}},ia=["Torus","Torus Knot","Sphere","Ribbon"],Ye=[ye,...ia,...Object.keys(pt)];function na(t){switch(t){case"Torus Knot":return new Ct(7,1.9,320,48);case"Sphere":return new Bt(9,128,96);case"Ribbon":return new Dt(9,9,7,128,24,!0);default:return new zt(9,3.4,64,220)}}function oa(t){t.updateWorldMatrix(!0,!1);const e=t.geometry.clone();return e.applyMatrix4(t.matrixWorld),e}function sa(t){const e=Xt(),a=qt();return w.useMemo(()=>{const i=pt[t];if(!i)return null;const s=i.model==="bret"?e:a;return i.parts.map(u=>s[u])},[e,t,a])}function la(){const t=new Q;return t.colorNode=j(L(.04,.06,.09),L(.34,.44,.54),Fe.y.mul(.5).add(.5)),t.opacity=.45,t.transparent=!0,t.depthWrite=!1,t.side=lt,t}const Ke=400;function ca({resolution:t=1024}){const e=n(60),a=new ct(t,t);a.texture.type=he,a.texture.magFilter=F,a.texture.minFilter=F,a.texture.generateMipmaps=!1,a.texture.wrapS=ve,a.texture.wrapT=ve,a.texture.colorSpace=Rt;const i=new it(-1,1,1,-1,.1,Ke*2);i.position.set(0,Ke,0),i.rotation.set(-Math.PI/2,0,0);const s=new nt,u=new Q;u.fragmentNode=T(Ut.y,Fe.x,Fe.z,1),u.fog=!1,s.overrideMaterial=u;const c=r=>{const o=r.div(e).toVar(),l=o.abs().toVar(),f=D(a.texture,o.add(.5)).toVar(),m=l.x.max(l.y).lessThan(.5);return T(f.xyz,J(m,f.w,Z(0)))},p=r=>{const o=r*.5;e.value=r,i.left=-o,i.right=o,i.top=o,i.bottom=-o,i.updateProjectionMatrix()};return p(e.value),{scene:s,setArea:p,sample:r=>{const o=c(r).toVar();return T(r.x,o.x,r.y,o.w)},slope:r=>{const o=c(r).yz.toVar(),l=o.dot(o).oneMinus().max(.02).sqrt();return o.div(l).negate()},bake(r){const o=r.getRenderTarget?.()||null,l=r.getClearAlpha();r.setClearAlpha(0),r.setRenderTarget(a),r.render(s,i),r.setRenderTarget(o),r.setClearAlpha(l)},dispose(){u.dispose(),a.dispose()}}}const ua=1024,fa=22;function da(t){const e=new Tt;t.forEach(i=>{i.computeBoundingBox(),e.union(i.boundingBox)});const a=e.getBoundingSphere(new ut);return{centre:e.getCenter(new S),fit:fa/Math.max(a.radius*2,1e-4)}}function Je(t,e,{centre:a,fit:i}){const s=new pe;t.forEach(p=>{const r=new $(p,e);r.position.copy(a).negate(),s.add(r)}),s.scale.setScalar(i);const u=new pe,c=new pe;return u.add(s),c.add(u),{pivot:c,apply(p,r){u.rotation.x=p.tilt,c.rotation.y=r,c.position.y=p.height,c.scale.setScalar(p.scale)}}}function pa({config:t,onReady:e}){const a=U(r=>r.gl),i=U(r=>r.scene),s=w.useRef(null),u=w.useRef(0),{mode:c}=t.target,p=sa(c);return w.useEffect(()=>{if(!a?.isWebGPURenderer)return;const r=p?p.map(oa):[na(c)],o=da(r),l=ca({resolution:ua}),f=new ot,m=la(),h=Je(r,f,o),g=Je(r,m,o);return g.pivot.visible=!1,g.pivot.renderOrder=-1,l.scene.add(h.pivot),i.add(g.pivot),s.current={baked:h,ghost:g,probe:l},e?.({probe:l}),()=>{s.current=null,e?.(null),i.remove(g.pivot),r.forEach(d=>d.dispose()),f.dispose(),m.dispose(),l.dispose()}},[a,c,p,e,i]),Ee((r,o)=>{const l=s.current;if(!l)return;const{target:f}=t;u.current+=o*f.spinSpeed,l.baked.apply(f,u.current),l.ghost.apply(f,u.current),l.ghost.pivot.visible=f.reveal===!0,l.probe.setArea(f.probeArea),l.probe.bake(a)}),null}const ma=w.memo(pa);class ha{constructor(e){this.params=e,this.init(e)}destroy(){this.params.group.remove(this.mesh),this.geometry.dispose()}hide(){this.mesh.visible=!1}show(){this.mesh.visible=!0}init(e){this.geometry=new Pt,this.mesh=new $(this.geometry,e.material);const a=new S(e.offset.x,e.offset.y);a.applyMatrix4(e.transform),this.geometry.boundingSphere=new ut(a,e.lod>3?e.width*1.75:e.width*3),this.mesh.castShadow=!1,this.mesh.layers.set(e.layer),this.mesh.receiveShadow=!0,e.group.add(this.mesh)}rebuildMeshFromData(e){this.geometry.setAttribute("position",new Se(e.positions,3)),this.geometry.setAttribute("normal",new Se(e.normals,3)),this.geometry.setAttribute("vindex",new He(e.vindices,1)),this.geometry.setAttribute("width",new Se(e.width,1)),this.geometry.setAttribute("lod",new He(e.lod,1)),this.geometry.setIndex(new Mt(e.indices,1)),this.geometry.attributes.position.needsUpdate=!0,this.geometry.attributes.normal.needsUpdate=!0,this.geometry.attributes.vindex.needsUpdate=!0,this.geometry.attributes.width.needsUpdate=!0,this.geometry.attributes.lod.needsUpdate=!0}}const q=new S,Ze=new S,Re=new S,$e=new S,k=new S,Qe=new S;function va(t){const e=[];for(let a=0;a<t;a+=1)for(let i=0;i<t;i+=1)e.push(a*(t+1)+i,(a+1)*(t+1)+i+1,a*(t+1)+i+1),e.push((a+1)*(t+1)+i,(a+1)*(t+1)+i+1,a*(t+1)+i);return e}function ga(t,e){const a=new Array(t.length).fill(0);for(let i=0;i<e.length;i+=3){const s=e[i]*3,u=e[i+1]*3,c=e[i+2]*3;Ze.fromArray(t,s),Re.fromArray(t,u),$e.fromArray(t,c),k.subVectors($e,Re),Qe.subVectors(Ze,Re),k.cross(Qe),a[s]+=k.x,a[u]+=k.x,a[c]+=k.x,a[s+1]+=k.y,a[u+1]+=k.y,a[c+1]+=k.y,a[s+2]+=k.z,a[u+2]+=k.z,a[c+2]+=k.z}return a}function xa({lod:t,offset:e,resolution:a,width:i,worldMatrix:s}){const u=[],c=[],p=[],r=[],o=i/2;let l=0;for(let h=0;h<=a;h+=1){const g=i*h/a;for(let d=0;d<=a;d+=1){const y=i*d/a;q.set(g-o,y-o,0),q.add(e),q.applyMatrix4(s),u.push(q.x,q.y,q.z),c.push(l),p.push(i),r.push(t),l+=1}}const f=va(a),m=ga(u,f);return{indices:Uint32Array.from(f),lod:Uint32Array.from(r),normals:Float32Array.from(m),positions:Float32Array.from(u),vindices:Uint32Array.from(c),width:Float32Array.from(p)}}const ya=15,wa=36,mt=ee("vec3","rowItAloneDisplacedPosition"),ht=ee("vec3","rowItAloneMorphedPosition"),vt=ee("vec3","rowItAloneCascadeScales"),Sa=ee("vec2","rowItAloneTexelCoord0"),ba=ee("vec2","rowItAloneTexelCoord1"),za=ee("vec2","rowItAloneTexelCoord2"),Da=P(`

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
  `,[mt,ht,vt,Sa,ba,za]),Ba=P(`

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
`),gt=new kt(new Uint8Array([0,0,0,255]),1,1);gt.needsUpdate=!0;class Ca{constructor(e){const a={time:n(0),cameraPosition:n(new S),minLodRadius:ya,gridResolution:n(e.gridResolution??wa),position:K("position"),vindex:K("vindex"),width:K("width"),lod:K("lod"),ifftResolution:n(e.ifftResolution),displacement0:D(e.cascades[0].displacement),displacement1:D(e.cascades[1].displacement),displacement2:D(e.cascades[2].displacement),derivatives0:D(e.cascades[0].derivative),derivatives1:D(e.cascades[1].derivative),derivatives2:D(e.cascades[2].derivative),jacobian0:D(e.cascades[0].jacobian),jacobian1:D(e.cascades[1].jacobian),jacobian2:D(e.cascades[2].jacobian),ifft_sampler0:D(e.cascades[0].derivative),ifft_sampler1:D(e.cascades[1].derivative),ifft_sampler2:D(e.cascades[2].derivative),foamStrength:e.foamStrength,foamThreshold:e.foamThreshold,reveal:n(e.reveal??0),foamOnly:n(e.foamOnly??0),impactFoamTexture:D(e.impactFoamTexture??gt),impactFoamStrength:n(e.impactFoamStrength??.8),impactFoamPatchSize:n(e.impactFoamPatchSize??100),seaColor:n(new se(e.seaColor??"#01040c")),horizonColor:n(new se(e.horizonColor??"#6b9ed1")),skyColor:n(new se(e.skyColor??"#143663")),sunColor:n(new se(e.sunColor??"#ffe6b8")),lodScale:e.lodScale,morphBlend:n(e.morphBlend??1),waveLengths:L(e.cascades[0].params.lengthScale,e.cascades[1].params.lengthScale,e.cascades[2].params.lengthScale),sunPosition:n(e.sunPosition),vMorphedPosition:ht,vDisplacedPosition:mt,vCascadeScales:vt},i=new Q;i.positionNode=Da(a),i.colorNode=Ba(a),i.side=It,i.colorSpace=ft,i.transparent=!1,this.material=i,this.parameters=a}}const Ra=P(`

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
`);class Ta extends ${constructor(){const e={position:K("position"),normal:K("normal"),turbidity:n(10),rayleigh:n(3),mieCoefficient:n(.005),mieDirectionalG:n(.7),elevation:n(2),sunPosition:n(new S(0,0,0)),up:n(new S(0,1,0)),cameraPosition:n(new S(0,0,0))},a=new Q;a.colorNode=Ra(e),a.side=At,a.colorSpace=ft,super(new Ft(1,1,1),a),this.parameters=e}}const oe={seaColor:"#01040c",horizonColor:"#6b9ed1",skyColor:"#143663",sunColor:"#ffe6b8"},et=new S,tt=new S,Te=new S,Pe=new S,xt=160,yt=192,Pa=2;function Ma(t={}){return{patchResolution:Math.max(Pa,Math.round(t.patchResolution??yt)),patchSize:t.patchSize??xt}}class ka{constructor(e){this.params=e,this.currentConfig=null,this.patch=null,this.patchVisible=!0,this.patchSignature="",this.patchTransform=new Lt().makeRotationX(-Math.PI/2),this.sun=new S}init(){const e=this.currentConfig?.ocean||oe,a=new Ca({foamStrength:this.params.waveGenerator.foamStrength,foamThreshold:this.params.waveGenerator.foamThreshold,ifftResolution:this.params.waveGenerator.size,gridResolution:yt,lodScale:this.params.waveGenerator.lodScale,reveal:this.currentConfig?.ocean?.reveal?1:0,foamOnly:this.currentConfig?.ocean?.foamOnly?1:0,impactFoamTexture:this.params.impactFoamTexture,impactFoamStrength:this.currentConfig?.ocean?.impactFoamStrength??.8,impactFoamPatchSize:this.currentConfig?.ocean?.impactAreaSize,seaColor:e.seaColor,horizonColor:e.horizonColor,skyColor:e.skyColor,sunColor:e.sunColor,morphBlend:0,cascades:this.params.waveGenerator.cascades,sunPosition:this.sun});this.material=a.material,this.materialParameters=a.parameters,this.group=new pe,this.params.scene.add(this.group),this.params.withSky!==!1&&(this.sky=new Ta,this.sky.layers.set(2),this.sky.scale.setScalar(5e5),this.params.scene.add(this.sky)),this.ensurePatch()}ensurePatch(e){const{patchResolution:a,patchSize:i}=Ma(e),s=`${i}:${a}`;this.patchSignature!==s&&(this.patch?.destroy(),Te.set(0,0,0),this.patch=new ha({group:this.group,layer:this.params.layer,lod:0,material:this.material,offset:Te.clone(),transform:this.patchTransform,width:i}),this.patch.rebuildMeshFromData(xa({lod:0,offset:Te,resolution:a,width:i,worldMatrix:this.patchTransform})),this.patch.mesh.visible=this.patchVisible,this.materialParameters.gridResolution.value=a,this.patchSignature=s)}applyConfig(e){if(this.currentConfig=e,!!e)if(this.ensurePatch(e.ocean),this.patchVisible=e.ocean.visible??!0,this.material.wireframe=e.ocean.wireframe,this.materialParameters.reveal.value=e.ocean.reveal?1:0,this.materialParameters.foamOnly.value=e.ocean.foamOnly?1:0,this.materialParameters.impactFoamStrength.value=e.ocean.impactFoamStrength??.8,this.materialParameters.impactFoamPatchSize.value=e.ocean.impactAreaSize??xt,this.materialParameters.seaColor.value.set(e.ocean.seaColor||oe.seaColor),this.materialParameters.horizonColor.value.set(e.ocean.horizonColor||oe.horizonColor),this.materialParameters.skyColor.value.set(e.ocean.skyColor||oe.skyColor),this.materialParameters.sunColor.value.set(e.ocean.sunColor||oe.sunColor),this.params.waveGenerator.setFoamStrength(e.foam.foamStrength),this.params.waveGenerator.setFoamThreshold(e.foam.foamThreshold),this.params.waveGenerator.setLodScale(e.ocean.lodScale),this.sky&&e.sky){this.sky.parameters.rayleigh.value=e.sky.rayleigh,this.sky.parameters.turbidity.value=e.sky.turbidity,this.sky.parameters.mieCoefficient.value=e.sky.mieCoefficient,this.sky.parameters.mieDirectionalG.value=e.sky.mieDirectionalG,this.sky.parameters.elevation.value=e.sky.elevation,this.sky.parameters.up.value.fromArray(e.sky.up);const a=Ve.degToRad(90-e.sky.elevation),i=Ve.degToRad(e.sky.azimuth);this.sun.setFromSphericalCoords(1,a,i),this.sky.parameters.sunPosition.value.copy(this.sun),typeof e.sky.exposure=="number"&&(this.params.renderer.toneMappingExposure=e.sky.exposure)}else this.sun.set(0,1,0),this.params.renderer.toneMappingExposure=1}update(e=this.params.camera){this.params.camera=e,this.params.camera.getWorldPosition(et),this.params.scene.getWorldPosition(tt),Pe.subVectors(et,tt),this.sky?.parameters.cameraPosition.value.copy(Pe),this.patch&&(this.patch.mesh.visible=this.patchVisible,this.patch.mesh.material.wireframe=this.currentConfig?.ocean?.wireframe??!1),this.materialParameters.cameraPosition.value.copy(Pe),this.materialParameters.sunPosition.value.copy(this.sun)}dispose(){this.patch?.destroy(),this.patch=null,this.patchSignature="",this.params.scene.remove(this.group),this.sky&&(this.params.scene.remove(this.sky),this.sky.geometry.dispose(),this.sky.material.dispose(),this.sky=null),this.material.dispose()}}const Ia=P(`

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
`),Aa=P(`

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
`),Fa=P(`

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
`),La=P(`

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
`),_a=P(`

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
`),Ea=P(`

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
`),Oa=P(`

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
`),Wa=P(`

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
`),Ga=P(`

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
`);class Na{constructor(e){this.params=e,this.init(e)}init(e){this.squareSize=e.size**2,this.bufferSize=this.squareSize*4,this.spectrumBuffer=new O(new Float32Array(this.bufferSize),4),this.waveDataBuffer=new O(new Float32Array(this.bufferSize),4),this.initialSpectrum=Wa({spectrumBuffer:v(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),waveDataBuffer:v(this.waveDataBuffer,"vec4",this.waveDataBuffer.count),index:b,size:e.size,waveLength:n(e.lengthScale),boundaryLow:n(e.boundaryLow),boundaryHigh:n(e.boundaryHigh),...e.waveSettings}).compute(this.squareSize),this.initialSpectrumWithInverse=Ga({spectrumBuffer:v(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),index:b,size:e.size}).compute(this.squareSize),e.renderer.compute(this.initialSpectrum),e.renderer.compute(this.initialSpectrumWithInverse)}update(){this.params.renderer.compute(this.initialSpectrum),this.params.renderer.compute(this.initialSpectrumWithInverse)}dispose(){this.spectrumBuffer?.dispose?.(),this.waveDataBuffer?.dispose?.()}}const Ha=[16,16,1],Va=[250,17,5],ja=[.9,.9,.9],xe=Object.freeze({Low:Object.freeze({resolution:128}),Medium:Object.freeze({resolution:256}),High:Object.freeze({resolution:512})}),le="Medium";xe[le].resolution;const Ua=n(.8),Xa=n(2.7),qa=n(3.7);function Ya(t=le){return xe[t]||xe[le]}const wt={depth:n(20),scaleHeight:n(1),windSpeed:n(1),windDirection:n(0),fetch:n(1e5),spreadBlend:n(1),swell:n(.198),peakEnhancement:n(3.3),shortWaveFade:n(0),fadeLimit:n(0)},Ka={depth:{min:.1,max:100},scaleHeight:{min:0,max:1},windSpeed:{min:.01,max:10},windDirection:{min:0,max:2*Math.PI},fetch:{min:10,max:5e5},spreadBlend:{min:0,max:1},swell:{min:0,max:1},peakEnhancement:{min:1,max:5},shortWaveFade:{min:0,max:5},fadeLimit:{min:0,max:1}},St={d_depth:n(20),d_scaleHeight:n(1),d_windSpeed:n(1),d_windDirection:n(240/360*2*Math.PI),d_fetch:n(3e5),d_spreadBlend:n(1),d_swell:n(.5),d_peakEnhancement:n(3.3),d_shortWaveFade:n(0),d_fadeLimit:n(0)},Ja={d_depth:{min:.1,max:100},d_scaleHeight:{min:0,max:1},d_windSpeed:{min:.01,max:10},d_windDirection:{min:0,max:2*Math.PI},d_fetch:{min:10,max:5e5},d_spreadBlend:{min:0,max:1},d_swell:{min:0,max:1},d_peakEnhancement:{min:1,max:5},d_shortWaveFade:{min:0,max:5},d_fadeLimit:{min:0,max:1}};class Za{constructor(e){this.init(e)}init(e){this.params=e,this.logN=Math.log2(e.size),this.squareSize=e.size**2,this.bufferSize=this.squareSize*2,this.initialSpectrum=new Na(e),this.spectrumBuffer=this.initialSpectrum.spectrumBuffer,this.waveDataBuffer=this.initialSpectrum.waveDataBuffer,this.dxDzBuffer=new O(new Float32Array(this.bufferSize),2),this.dyDxzBuffer=new O(new Float32Array(this.bufferSize),2),this.dyxDyzBuffer=new O(new Float32Array(this.bufferSize),2),this.dxxDzzBuffer=new O(new Float32Array(this.bufferSize),2),this.pingpongBuffer=new O(new Float32Array(this.bufferSize*2),4),this.turbulenceBuffer=new O(new Float32Array(this.bufferSize/2),1),this.displacementIndex=n(0),this.ifftStep=n(0),this.pingpong=n(0),this.deltaTime=n(0),this.displacement=new be(e.size,e.size),this.derivative=new be(e.size,e.size),this.jacobian=new be(e.size,e.size),this.displacement.type=he,this.derivative.type=he,this.jacobian.type=_t,this.displacement.generateMipmaps=!1,this.derivative.generateMipmaps=!1,this.jacobian.generateMipmaps=!1,this.displacement.magFilter=F,this.derivative.magFilter=F,this.jacobian.magFilter=F,this.displacement.minFilter=F,this.derivative.minFilter=F,this.jacobian.minFilter=F,this.displacement.wrapS=X,this.displacement.wrapT=X,this.derivative.wrapS=X,this.derivative.wrapT=X,this.jacobian.wrapS=X,this.jacobian.wrapT=X,this.workgroupSize=Ha,this.dispatchSize=[e.size/this.workgroupSize[0],e.size/this.workgroupSize[1]],this.computeTimeSpectrum=Aa({writeDxDzBuffer:v(this.dxDzBuffer,"vec2",this.dxDzBuffer.count),writeDyDxzBuffer:v(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count),writeDyxDyzBuffer:v(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count),writeDxxDzzBuffer:v(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count),spectrumBuffer:v(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),waveDataBuffer:v(this.waveDataBuffer,"vec4",this.waveDataBuffer.count),index:b,size:x(e.size),time:n(0)}).computeKernel(this.workgroupSize),this.computeInitialize=_a({size:x(e.size),step:x(this.ifftStep),logN:x(this.logN),butterflyBuffer:v(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),DxDzBuffer:v(this.dxDzBuffer,"vec2",this.dxDzBuffer.count).toReadOnly(),DyDxzBuffer:v(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count).toReadOnly(),DyxDyzBuffer:v(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count).toReadOnly(),DxxDzzBuffer:v(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count).toReadOnly(),pingpongBuffer:v(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:x(this.displacementIndex),index:b,workgroupSize:n(new ae().fromArray(this.workgroupSize)),workgroupId:ne,localId:ie}).computeKernel(this.workgroupSize),this.computeHorizontalPingPong=Fa({size:x(e.size),step:x(this.ifftStep),logN:x(this.logN),butterflyBuffer:v(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),pingpongBuffer:v(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:x(this.displacementIndex),pingpong:x(this.pingpong),index:b,workgroupSize:n(new ae().fromArray(this.workgroupSize)),workgroupId:ne,localId:ie}).computeKernel(this.workgroupSize),this.computeVerticalPingPong=La({size:x(e.size),step:x(this.ifftStep),logN:x(this.logN),butterflyBuffer:v(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),pingpongBuffer:v(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:x(this.displacementIndex),pingpong:x(this.pingpong),index:b,workgroupSize:n(new ae().fromArray(this.workgroupSize)),workgroupId:ne,localId:ie}).computeKernel(this.workgroupSize),this.computePermute=Ea({size:x(e.size),pingpongBuffer:v(this.pingpongBuffer,"vec4",this.pingpongBuffer.count).toReadOnly(),DxDzBuffer:v(this.dxDzBuffer,"vec2",this.dxDzBuffer.count),DyDxzBuffer:v(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count),DyxDyzBuffer:v(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count),DxxDzzBuffer:v(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count),initBufferIndex:x(this.displacementIndex),index:b,workgroupSize:n(new ae().fromArray(this.workgroupSize)),workgroupId:ne,localId:ie}).computeKernel(this.workgroupSize),this.computeMergeTextures=Oa({size:x(e.size),index:b,lambda:n(e.lambda),deltaTime:this.deltaTime,DxDzBuffer:v(this.dxDzBuffer,"vec2",this.dxDzBuffer.count).toReadOnly(),DyDxzBuffer:v(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count).toReadOnly(),DyxDyzBuffer:v(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count).toReadOnly(),DxxDzzBuffer:v(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count).toReadOnly(),turbulenceBuffer:v(this.turbulenceBuffer,"float",this.turbulenceBuffer.count),writeDisplacement:De(this.displacement),writeDerivative:De(this.derivative),writeJacobian:De(this.jacobian),workgroupSize:n(new ae().fromArray(this.workgroupSize)),workgroupId:ne,localId:ie}).computeKernel(this.workgroupSize)}update(e){this.computeTimeSpectrum.computeNode.parameters.time.value=performance.now()/1e3,this.params.renderer.compute(this.computeTimeSpectrum,this.dispatchSize),this.ifft(0),this.ifft(1),this.ifft(2),this.ifft(3),this.deltaTime.value=e,this.params.renderer.compute(this.computeMergeTextures,this.dispatchSize)}ifft(e){this.displacementIndex.value=e;let a=!0;this.ifftStep.value=0,this.params.renderer.compute(this.computeInitialize,this.dispatchSize);for(let i=1;i<this.logN;i+=1)a=!a,this.ifftStep.value=i,this.pingpong.value=a?1:0,this.params.renderer.compute(this.computeHorizontalPingPong,this.dispatchSize);for(let i=0;i<this.logN;i+=1)a=!a,this.ifftStep.value=i,this.pingpong.value=a?1:0,this.params.renderer.compute(this.computeVerticalPingPong,this.dispatchSize);this.params.renderer.compute(this.computePermute,this.dispatchSize)}dispose(){this.displacement?.dispose?.(),this.derivative?.dispose?.(),this.jacobian?.dispose?.(),this.initialSpectrum?.dispose?.()}}class $a{constructor(e){this.params=e,this.quality=e.quality??le}init(){this.qualityPreset=Ya(this.quality),this.size=this.qualityPreset.resolution,this.butterflyBuffer=new O(new Float32Array(Math.log2(this.size)*this.size*4),4),this.butterfly=Ia({butterflyBuffer:v(this.butterflyBuffer,"vec4",this.butterflyBuffer.count),index:b,N:this.size}).compute(Math.log2(this.size)*this.size),this.params.renderer.compute(this.butterfly),this.waveSettings={...wt,...St},this.cascades=[],this.foamStrength=Ua,this.foamThreshold=Xa,this.waveLengths=Va,this.lambda=ja,this.lodScale=qa,this.initCascades()}initCascades(){this.cascades.length=0;let e=1e-4;for(let a=0;a<this.waveLengths.length;a+=1){const i=a<this.waveLengths.length-1?2*Math.PI/this.waveLengths[a+1]*6:9999;this.cascades.push(new Za({...this.params,...this.getCascadeParams(a,e,i)})),e=i}}getCascadeParams(e,a,i){return{boundaryHigh:i,boundaryLow:a,butterflyBuffer:this.butterflyBuffer,lambda:this.lambda[e],lengthScale:this.waveLengths[e],size:this.size,waveSettings:this.waveSettings}}setFoamStrength(e){this.foamStrength.value=e}setFoamThreshold(e){this.foamThreshold.value=e}setLodScale(e){this.lodScale.value=e}applyWaveSettings(e){if(!e)return;let a=!1;Object.entries(e).forEach(([i,s])=>{Object.prototype.hasOwnProperty.call(this.waveSettings,i)&&this.waveSettings[i].value!==s&&(this.waveSettings[i].value=s,a=!0)}),a&&this.cascades.forEach(i=>{i.initialSpectrum.update()})}update(e){this.cascades.forEach(a=>{a.update(e)})}dispose(){this.cascades.forEach(e=>{e.dispose?.()}),this.cascades=[],this.butterflyBuffer?.dispose?.()}}function Qa({cascades:t,waveLengths:e}){const a=t.map((u,c)=>n(e?.[c]??u.params.lengthScale)),i=(u,c)=>p=>t.map((r,o)=>D(r[u],p.div(a[o]))[c]).reduce((r,o)=>r.add(o)),s=i("displacement","xyz");return{sample:u=>{const c=s(u);return T(u.x.add(c.x),c.y,u.y.add(c.z),1)},slope:i("derivative","xy"),setWaveLengths(u){a.forEach((c,p)=>{a[p].value=u?.[p]??a[p].value})}}}function er(t){return 1e3/Math.max(1,t?.performance?.waveUpdateHz??30)}function tr({config:t,onReady:e}){const a=U(o=>o.camera),i=U(o=>o.gl),s=U(o=>o.scene),u=w.useRef(null),c=w.useRef(0),p=t?.performance?.quality,r=t?.performance?.pauseWater??!1;return w.useEffect(()=>{if(!i?.isWebGPURenderer)return;const o=new $a({quality:p,renderer:i});o.init();const l=new ct(1024,1024);l.texture.type=he,l.texture.magFilter=F,l.texture.minFilter=F,l.texture.generateMipmaps=!1,l.texture.wrapS=ve,l.texture.wrapT=ve;const f=new ka({camera:a,impactFoamTexture:l.texture,layer:0,renderer:i,scene:s,waveGenerator:o,withSky:!1});f.init(),f.applyConfig(t);const m=Qa({cascades:o.cascades,waveLengths:o.waveLengths});return u.current={oceanManager:f,probe:m,waveGenerator:o},e?.({impactFoamRT:l,probe:m}),()=>{c.current=0,u.current=null,e?.(null),f.dispose(),l.dispose(),o.dispose?.()}},[a,i,e,p,s]),Ee((o,l)=>{const f=u.current;if(!f)return;if(f.waveGenerator.applyWaveSettings(t.waveSettings),f.oceanManager.applyConfig(t),f.probe.setWaveLengths(f.waveGenerator.waveLengths),r){c.current=0,f.oceanManager.update(o.camera);return}const m=er(t);for(c.current=Math.min(c.current+l*1e3,m*3);c.current>=m;)f.waveGenerator.update(m),c.current-=m;f.oceanManager.update(o.camera)}),null}const ce="Water Cycle",ar=`${ce}.Camera`,Oe=`${ce}.Ocean`,rr=`${ce}.Target`,ir=["Hidden","Foam Only","Full"],We=t=>t(`${rr}.targetMode`)===ye,Y=t=>!We(t),_=t=>We(t)&&t(`${Oe}.oceanDisplayMode`)!=="Hidden",Le=t=>We(t)&&t(`${Oe}.oceanDisplayMode`)==="Full",fe=t=>Le(t)&&t(`${Oe}.oceanPaletteMode`)==="Custom";function nr(t={}){return{impactAreaSize:{label:"Foam Area",max:400,min:20,render:_,step:1,value:t.impactAreaSize??140},impactDotSize:{label:"Stipple Size",max:4,min:.05,render:_,step:.05,value:t.impactDotSize??.55},impactDotStrength:{label:"Stipple Strength",max:4,min:0,render:_,step:.05,value:t.impactDotStrength??1},impactFoamStrength:{label:"Foam Response",max:3,min:0,render:_,step:.05,value:t.impactFoamStrength??.8},impactFoamDecay:{label:"Foam Decay",max:.3,min:.005,render:_,step:.005,value:t.impactFoamDecay??.06}}}function or(t={}){return{lightX:{label:"Center X",max:100,min:-100,step:.5,value:t.lightX??0},lightZ:{label:"Center Z",max:100,min:-100,step:.5,value:t.lightZ??-6},lightHeight:{label:"Height",max:200,min:5,step:1,value:t.lightHeight??62},lightRadius:{label:"Cone Radius",max:60,min:.5,step:.5,value:t.lightRadius??9},lightSpread:{label:"Cone Spread",max:2,min:0,step:.01,value:t.lightSpread??.42},lightSoftness:{label:"Edge Softness",max:6,min:.1,step:.05,value:t.lightSoftness??1.8},lightReach:{label:"Reach",max:300,min:10,step:1,value:t.lightReach??95},lightIntensity:{label:"Intensity",max:8,min:0,step:.05,value:t.lightIntensity??1.6},lightAmbient:{label:"Ambient",max:1,min:0,step:.005,value:t.lightAmbient??.08},lightDriftSpeed:{label:"Drift Speed",max:2,min:0,step:.01,value:t.lightDriftSpeed??.12},lightDriftRadius:{label:"Drift Radius",max:40,min:0,step:.5,value:t.lightDriftRadius??7},lightPulse:{label:"Pulse Amount",max:1,min:0,step:.01,value:t.lightPulse??.22}}}const _e={Monochrome:{seaColor:"#000000",horizonColor:"#050505",skyColor:"#000000",sunColor:"#ffffff"},"Row It Alone":{seaColor:"#01040c",horizonColor:"#6b9ed1",skyColor:"#143663",sunColor:"#ffe6b8"}};function sr(t={}){return{oceanDisplayMode:{label:"Water Surface",options:ir,value:t.oceanDisplayMode??"Hidden"},oceanPatchSize:{render:_,label:"Patch Size",max:400,min:50,step:1,value:t.oceanPatchSize??200},oceanPatchResolution:{render:_,label:"Patch Resolution",max:384,min:64,step:1,value:t.oceanPatchResolution??192},oceanLodScale:{render:_,label:"LOD Scale",max:12,min:0,step:.1,value:t.oceanLodScale??3.7},oceanPaletteMode:{render:Le,label:"Palette",options:Object.keys(_e).concat("Custom"),value:t.oceanPaletteMode??"Row It Alone"},oceanSeaColor:{label:"Sea",render:fe,value:t.oceanSeaColor??"#01040c"},oceanHorizonColor:{label:"Horizon",render:fe,value:t.oceanHorizonColor??"#6b9ed1"},oceanSkyColor:{label:"Sky",render:fe,value:t.oceanSkyColor??"#143663"},oceanSunColor:{label:"Sun",render:fe,value:t.oceanSunColor??"#ffe6b8"},enhanceSurfaceDetails:{render:Le,label:"Enhance Surface Detail",value:t.enhanceSurfaceDetails??!1},oceanFoamStrength:{render:_,label:"Foam Strength",max:5,min:0,step:.05,value:t.oceanFoamStrength??1.1},oceanFoamThreshold:{render:_,label:"Foam Threshold",max:6,min:0,step:.05,value:t.oceanFoamThreshold??2.8}}}function lr(t={}){return{rainEnabled:{label:"Rain Enabled",value:t.rainEnabled??!0},timeScale:{label:"Time Scale",max:3,min:-3,step:.05,value:t.timeScale??1},rainDropCount:{label:"Drop Count",max:1e6,min:1e3,step:1e3,value:t.rainDropCount??4e5},rainBounds:{label:"Volume Width",max:400,min:20,step:1,value:t.rainBounds??140},rainCeiling:{label:"Ceiling Y",max:160,min:10,step:.5,value:t.rainCeiling??60},rainSpawnRange:{label:"Spawn Range",max:120,min:1,step:.5,value:t.rainSpawnRange??40},rainFallSpeed:{label:"Fall Speed",max:80,min:1,step:.5,value:t.rainFallSpeed??26},rainSpeedJitter:{label:"Speed Jitter",max:.9,min:0,step:.01,value:t.rainSpeedJitter??.4},rainWindX:{label:"Wind X",max:12,min:-12,step:.1,value:t.rainWindX??.8},rainWindZ:{label:"Wind Z",max:12,min:-12,step:.1,value:t.rainWindZ??0},rainStreakLength:{label:"Streak Length",max:4,min:.05,step:.01,value:t.rainStreakLength??.9},rainStreakWidth:{label:"Streak Width",max:.3,min:.005,step:.005,value:t.rainStreakWidth??.045},rainOpacity:{label:"Opacity",max:2,min:.01,step:.01,value:t.rainOpacity??.5},rainTint:{label:"Tint",value:t.rainTint??"#d5e7f0"},rainEdgeFade:{label:"Edge Fade",max:1,min:0,step:.01,value:t.rainEdgeFade??.55}}}function cr(t={}){return{catchDepth:{label:"Catch Depth",max:12,min:.1,step:.1,value:t.catchDepth??3},slideGravity:{label:"Slide Gravity",max:120,min:0,step:.5,value:t.slideGravity??18},slideDrag:{label:"Slide Drag",max:12,min:0,step:.05,value:t.slideDrag??2},slopeRelease:{label:"Release Slope",max:6,min:.05,step:.05,value:t.slopeRelease??1.1},surfaceLifeMin:{label:"Cling Time Min",max:6,min:.05,step:.05,value:t.surfaceLifeMin??.6},surfaceLifeMax:{label:"Cling Time Max",max:12,min:.1,step:.05,value:t.surfaceLifeMax??2.5},stretchSpeed:{label:"Streak Stretch Speed",max:40,min:.1,step:.1,value:t.stretchSpeed??6},gravity:{label:"Fall-Off Gravity",max:80,min:0,step:.5,value:t.gravity??20},airDrag:{label:"Fall-Off Air Drag",max:8,min:0,step:.05,value:t.airDrag??1.1},sinkDepth:{label:"Descend Depth",max:120,min:1,step:1,value:t.sinkDepth??26}}}function ur(t={}){return{targetMode:{label:"Surface",options:Ye,value:t.targetMode??Ye[0]},targetReveal:{label:"Reveal Target",render:Y,value:t.targetReveal??!1},targetProbeArea:{label:"Probe Area",max:300,min:8,render:Y,step:1,value:t.targetProbeArea??60},targetScale:{label:"Scale",max:6,min:.1,render:Y,step:.05,value:t.targetScale??1},targetHeight:{label:"Height",max:40,min:-40,render:Y,step:.5,value:t.targetHeight??0},targetTilt:{label:"Tilt",max:Math.PI,min:-Math.PI,render:Y,step:.01,value:t.targetTilt??-1.2},targetSpinSpeed:{label:"Spin Speed",max:2,min:-2,render:Y,step:.01,value:t.targetSpinSpeed??.16}}}const bt=[{prefix:"first_",dataset:wt,borders:Ka},{prefix:"second_",dataset:St,borders:Ja}];function at(t,e={}){const{dataset:a,borders:i}=bt.find(s=>s.prefix===t);return Object.fromEntries(Object.entries(a).map(([s,u])=>[`${t}${s}`,{label:s,max:i[s].max,min:i[s].min,value:e[`${t}${s}`]??u.value}]))}function fr(t){return Object.fromEntries(bt.flatMap(({prefix:e,dataset:a})=>Object.keys(a).map(i=>[i,t[`${e}${i}`]])))}function dr(t={}){return{quality:{label:"Wave Quality",options:Object.keys(xe),value:t.quality??le},pauseWater:{label:"Pause Water",value:t.pauseWater??!1},waveUpdateHz:{label:"Wave Update Hz",max:60,min:5,step:1,value:t.waveUpdateHz??30}}}const rt="An Ocean Implied",G={targetMode:ye,targetReveal:!1,targetProbeArea:60,targetScale:1,targetHeight:0,targetTilt:-1.2,targetSpinSpeed:.16,timeScale:1,rainEnabled:!0,rainDropCount:8e5,rainBounds:70,rainCeiling:10,rainSpawnRange:40,rainFallSpeed:26,rainSpeedJitter:.4,rainWindX:.8,rainWindZ:0,rainStreakLength:.21,rainStreakWidth:.07,rainOpacity:1.11,rainTint:"#d5e7f0",rainEdgeFade:.55,catchDepth:3,slideGravity:18,slideDrag:2,slopeRelease:1.1,surfaceLifeMin:6,surfaceLifeMax:12,stretchSpeed:5.8,gravity:20,airDrag:1.1,sinkDepth:26,lightX:0,lightZ:-6,lightHeight:62,lightRadius:9,lightSpread:.42,lightSoftness:1.8,lightReach:95,lightIntensity:1.6,lightAmbient:.08,lightDriftSpeed:.12,lightDriftRadius:7,lightPulse:.22,oceanDisplayMode:"Hidden",oceanPatchSize:200,oceanPatchResolution:192,oceanLodScale:3.7,oceanPaletteMode:"Monochrome",oceanSeaColor:"#000000",oceanHorizonColor:"#050505",oceanSkyColor:"#000000",oceanSunColor:"#ffffff",enhanceSurfaceDetails:!1,oceanFoamStrength:1.1,oceanFoamThreshold:2.8,impactAreaSize:140,impactDotSize:.55,impactDotStrength:1,impactFoamStrength:.8,impactFoamDecay:.06,quality:"Medium",pauseWater:!1,waveUpdateHz:30},me={...G,targetProbeArea:26,rainDropCount:6e5,rainBounds:62,rainCeiling:34,rainSpawnRange:22,rainFallSpeed:22,rainWindX:0,rainStreakLength:.14,rainStreakWidth:.045,rainOpacity:1.07,rainEdgeFade:.72,catchDepth:1.6,slideGravity:12,slideDrag:5,slopeRelease:3,surfaceLifeMin:1.5,surfaceLifeMax:5.5,stretchSpeed:3.7,sinkDepth:34,lightHeight:40,lightRadius:16,lightSpread:.3,lightSoftness:1.4,lightReach:78,lightIntensity:1.5,lightAmbient:.1,lightDriftSpeed:.07,lightDriftRadius:4},de={...me,targetProbeArea:26,targetTilt:-.5,targetSpinSpeed:0,rainBounds:54,rainEdgeFade:.8,rainDropCount:7e5,slideGravity:30,slideDrag:4,catchDepth:1,rainOpacity:.73,stretchSpeed:7,lightRadius:20,lightHeight:44,cameraMode:"orbit",orbitDesktopPosition:{x:0,y:26,z:26},orbitDesktopTarget:{x:0,y:0,z:0},orbitDesktopPivot:{x:0,y:0,z:0},orbitDesktopFov:40,orbitMobilePosition:{x:0,y:32,z:32},orbitMobileTarget:{x:0,y:0,z:0},orbitMobilePivot:{x:0,y:0,z:0},orbitMobileFov:52},Me={"An Ocean Implied":{...G},"Rain on Ocean Reverse":{...G,timeScale:-1.6,rainDropCount:5e5,rainOpacity:1.23,surfaceLifeMin:.4,surfaceLifeMax:1.6,lightDriftSpeed:.08,lightPulse:.1},Downpour:{...G,rainDropCount:7e5,rainFallSpeed:34,rainStreakLength:.24,rainStreakWidth:.08,rainOpacity:.8,surfaceLifeMax:1.5,slideGravity:30,slopeRelease:.85,stretchSpeed:9.7,lightRadius:14,lightIntensity:1.85,lightDriftSpeed:.2},Drizzle:{...G,rainDropCount:18e4,rainFallSpeed:17,rainStreakLength:.17,rainStreakWidth:.055,rainOpacity:.86,surfaceLifeMin:1.2,surfaceLifeMax:4,slideGravity:12,slideDrag:3,slopeRelease:1.4,stretchSpeed:2.6,lightIntensity:1.35,lightDriftSpeed:.06},"Rain on Torus":{...me,targetMode:"Torus"},"Rain on Torus Knot":{...me,targetMode:"Torus Knot",targetSpinSpeed:.24},"Rain on Sphere":{...me,targetMode:"Sphere",targetTilt:0},"Rain on Bret":{...de,targetMode:"Bret"},"Rain on Bret Inner":{...de,targetMode:"Bret Inner"},"Rain on Reversal":{...de,targetMode:"Reversal"},"Rain on Reversal Inner":{...de,targetMode:"Reversal Inner"},"Foam + Rain":{...G,oceanDisplayMode:"Foam Only",oceanFoamStrength:1.35,oceanFoamThreshold:2.9,impactDotSize:.7,impactDotStrength:1.5,impactFoamStrength:1.2,impactFoamDecay:.05,lightAmbient:.12},"Visible Ocean":{...G,rainDropCount:26e4,rainOpacity:.78,lightAmbient:.22,lightIntensity:1.2,oceanDisplayMode:"Full",oceanPaletteMode:"Row It Alone",oceanSeaColor:"#01040c",oceanHorizonColor:"#6b9ed1",oceanSkyColor:"#143663",oceanSunColor:"#ffe6b8",enhanceSurfaceDetails:!0,impactDotSize:.75,impactDotStrength:1.4,impactFoamStrength:1.1,impactFoamDecay:.05},"Still Light":{...G,lightDriftSpeed:0,lightPulse:0,rainWindX:0}};function pr({presetSnapshot:t}){return{...t}}const V=[0,1,-8],mr={defaultMode:"spline",spline:{desktop:{target:V,fov:40},mobile:{target:V,fov:52},preset:"Loop de Loop",duration:180,scale:[10,10,10]},orbit:{desktop:{position:[0,8,30],target:V,pivot:V,fov:40},mobile:{position:[0,9,36],target:V,pivot:V,fov:52}},fixed:{behavior:"single",activeShot:"overview",shots:{overview:{desktop:{position:[0,8,30],target:V,fov:40}}}}};function hr(){const{attachSetControls:t,controlsSnapshotRef:e,initialPreset:a,presetsFolder:i}=Yt({defaultPreset:rt,getPresetControls:pr,presets:Me}),s=Me[a]||Me[rt],u=w.useRef(null),{buildCamera:c,cameraControls:p}=Ot({apiRef:u,camera:mr,cameraFolderPath:ar,controlsSnapshotRef:e}),[r,o]=Et(ce,()=>({Presets:i,Camera:A(p,{collapsed:!0}),Target:A(ur(s),{collapsed:!0}),Rain:A(lr(s),{collapsed:!0}),Surface:A(cr(s),{collapsed:!0}),Light:A(or(s),{collapsed:!0}),Ocean:A(sr(s),{collapsed:!0}),Impacts:A(nr(s),{collapsed:!0}),Performance:A(dr(s),{collapsed:!0}),"First Wave Spectrum":A(at("first_",s),{collapsed:!0}),"Second Wave Spectrum":A(at("second_",s),{collapsed:!0})}));t(o),e.current={...r},Kt({fileName:ce});const l=w.useMemo(()=>Wt(r),[r]),f=w.useMemo(()=>c(r),[c,l]),m=w.useMemo(()=>r.oceanPaletteMode==="Custom"?{horizonColor:r.oceanHorizonColor,seaColor:r.oceanSeaColor,skyColor:r.oceanSkyColor,sunColor:r.oceanSunColor}:_e[r.oceanPaletteMode]||_e["Row It Alone"],[r.oceanHorizonColor,r.oceanPaletteMode,r.oceanSeaColor,r.oceanSkyColor,r.oceanSunColor]);return w.useMemo(()=>({...r,camera:f,cameraApiRef:u,ocean:{...m,impactAreaSize:r.impactAreaSize,impactDotSize:r.impactDotSize,impactDotStrength:r.impactDotStrength,impactFoamDecay:r.impactFoamDecay,impactFoamStrength:r.impactFoamStrength,lodScale:r.oceanLodScale,patchResolution:r.oceanPatchResolution,patchSize:r.oceanPatchSize,foamOnly:r.oceanDisplayMode==="Foam Only",reveal:r.enhanceSurfaceDetails?1:0,visible:r.oceanDisplayMode!=="Hidden",wireframe:!1},foam:{foamStrength:r.oceanFoamStrength,foamThreshold:r.oceanFoamThreshold},light:{ambient:r.lightAmbient,driftRadius:r.lightDriftRadius,driftSpeed:r.lightDriftSpeed,height:r.lightHeight,intensity:r.lightIntensity,pulse:r.lightPulse,radius:r.lightRadius,reach:r.lightReach,softness:r.lightSoftness,spread:r.lightSpread,x:r.lightX,z:r.lightZ},performance:{pauseWater:r.pauseWater,quality:r.quality,waveUpdateHz:r.waveUpdateHz},waveSettings:fr(r),target:{height:r.targetHeight,mode:r.targetMode,probeArea:r.targetProbeArea,reveal:r.targetReveal,scale:r.targetScale,spinSpeed:r.targetSpinSpeed,tilt:r.targetTilt},rain:{airDrag:r.airDrag,bounds:r.rainBounds,catchDepth:r.catchDepth,ceiling:r.rainCeiling,dropCount:r.rainDropCount,edgeFade:r.rainEdgeFade,enabled:r.rainEnabled,fallSpeed:r.rainFallSpeed,gravity:r.gravity,opacity:r.rainOpacity,sinkDepth:r.sinkDepth,slideDrag:r.slideDrag,slideGravity:r.slideGravity,slopeRelease:r.slopeRelease,spawnRange:r.rainSpawnRange,speedJitter:r.rainSpeedJitter,streakLength:r.rainStreakLength,streakWidth:r.rainStreakWidth,stretchSpeed:r.stretchSpeed,surfaceLifeMax:r.surfaceLifeMax,surfaceLifeMin:r.surfaceLifeMin,timeScale:r.timeScale,tint:r.rainTint,windX:r.rainWindX,windZ:r.rainWindZ}}),[f,r,m])}function vr(){const t=hr(),[e,a]=w.useState(null);return H.jsxs(H.Fragment,{children:[H.jsx(Gt,{camera:t.camera}),H.jsx("color",{attach:"background",args:["#000000"]}),t.target.mode===ye?H.jsx(tr,{config:t,onReady:a}):H.jsx(ma,{config:t,onReady:a}),e&&H.jsx(ra,{config:t,surface:e})]})}const _r=w.memo(vr);export{_r as default};
