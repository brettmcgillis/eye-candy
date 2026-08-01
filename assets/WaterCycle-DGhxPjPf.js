import{m as ee,r as z,ai as Ct,bm as Bt,q as Q,ba as we,b4 as Pt,av as te,bl as se,ag as je,ap as kt,n as rt,a7 as Lt,V as y,v as Ft,b8 as Se,d9 as Ve,a8 as It,aZ as _t,Y as Rt,J as it,X as Tt,b7 as Mt,M as At,aA as Wt,p as Ue,da as k,db as ze,H as Ie,at as Et,K as I,bA as N,x as K,aD as Ot,y as qe,a0 as Nt,aX as A,j as H}from"./index-Bo6WACTw.js";import{u as Ht,g as Gt,C as jt}from"./useSceneCameraControls-C89MA0RO.js";import"./useOperatorInput-DIBOv2Ag.js";import{u as r,av as ie,F as oe,aw as f,aW as W,bn as Ye,R as Vt,t as be,k as ne,bo as Ut,E as qt,a as ot,v as Yt,m as Kt,ax as m,e as h,a$ as b,b0 as V,at as j,b1 as c,b2 as X,b3 as J,b4 as De}from"./three.tsl-JP_aLrRF.js";import{u as Xt}from"./usePresetsFolder-DGTOXy9Z.js";import{u as Jt}from"./useMediaRecorder-CFg87iD5.js";import"./useCameraSpline-BPBmuTDy.js";import"./PerspectiveCamera-C95wkZr9.js";import"./extends-CF3RwP-h.js";import"./Fbo-D-WP7d3i.js";import"./OrbitControls-rhLNIlxO.js";import"./Line-C80lzMJy.js";import"./Line2-DsJdXB-d.js";import"./constants-B31eRqKm.js";const Ke=1e3,nt=5e4;function Ce(a){return Math.max(Ke,Math.min(nt,Math.floor(a||Ke)))}function Zt({config:a,waterRuntime:e}){const t=ee(o=>o.gl),i=ee(o=>o.scene),s=z.useRef(null);return z.useEffect(()=>{if(!t?.isWebGPURenderer)return;const o=nt,[u,w,n]=e?.cascades||[],l=e?.impactFoamRT,d=r(a?.rain?.impactFoamDecay??.08);if(!u||!w||!n||!l)return;const p=new Ct(-50,50,50,-50,.1,200);p.position.set(0,100,0),p.lookAt(0,0,0);const g=new Bt;g.background=new Q(0);const L=new we(1,1);L.rotateX(-Math.PI/2);const U=new Pt({color:0,depthTest:!1,depthWrite:!1,opacity:d.value,transparent:!0}),B=new te(L,U);B.scale.set(a?.rain?.boundsWidth??100,a?.rain?.boundsDepth??100,1),B.renderOrder=0,g.add(B);const _=r(a?.rain?.boundsWidth??100),q=r(a?.rain?.boundsDepth??100),le=r(a?.rain?.ceiling??35),ue=r(a?.rain?.spawnRange??20),fe=r(a?.rain?.speed??20),Me=r(a?.rain?.streakLength??1.6),Ae=r(a?.rain?.impactLifetime??1.4),de=r(a?.rain?.impactSize??2.8),We=r(a?.rain?.impactBrightness??1),pe=r(e.waveLengths?.[0]??250),me=r(e.waveLengths?.[1]??17),he=r(e.waveLengths?.[2]??5),Ee=u.displacement,Oe=w.displacement,Ne=n.displacement,ve=ie(o,"vec3"),He=ie(o,"vec3"),Ge=ie(o,"vec3"),xe=ie(o,"vec3"),E=()=>m(Math.random()*16777215),pt=oe(()=>{const v=ve.element(f),x=He.element(f),M=xe.element(f),P=W(f),F=W(f.add(E())),O=W(f.add(E())),Y=W(f.add(E()));v.x=P.mul(_).add(_.mul(-.5)),v.y=F.mul(le.add(ue)),v.z=Y.mul(q).add(q.mul(-.5)),x.y=O.mul(fe.mul(-.45)).add(fe.mul(-.55)),M.x=1e3})().compute(o),mt=oe(()=>{const v=ye=>{const zt=h(Ee,ye.div(pe)),bt=h(Oe,ye.div(me)),Dt=h(Ne,ye.div(he));return zt.y.add(bt.y).add(Dt.y)},x=ve.element(f),M=He.element(f),P=Ge.element(f),F=xe.element(f);x.addAssign(M.mul(Ye)),F.x=F.x.add(Ye.div(Ae.max(.001)));const O=v(x.xz).add(.03),Y=Me.mul(.5),ge=.03,St=x.y.sub(Y);Vt(St.lessThan(O.add(ge)),()=>{P.x=x.x,P.z=x.z,P.y=O,F.x=1e-4,x.y=le.add(W(f.add(be)).mul(ue)),x.x=W(f.add(be.add(E()))).mul(_).add(_.mul(-.5)),x.z=W(f.add(be.add(E()).add(E()))).mul(q).add(q.mul(-.5))})})().compute(o).setName("WaterCycleRainParticles"),D=new se;D.colorNode=ne().x.sub(.5).abs().mul(-22).exp().mul(ne().y.mul(-6).exp()).mul(ne().y.oneMinus().mul(2.4).saturate()),D.vertexNode=Ut({position:ve.toAttribute()}),D.opacity=a?.rain?.opacity??.45,D.side=je,D.forceSinglePass=!0,D.depthWrite=!1,D.depthTest=!0,D.transparent=!0;const R=new te(new we(1,1),D);R.scale.set(a?.rain?.streakWidth??.06,a?.rain?.streakLength??1.6,1),R.count=Ce(a?.rain?.dropCount),R.frustumCulled=!1,i.add(R);const ht=xe.element(f).x,vt=Ge.toAttribute(),xt=v=>{const x=h(Ee,v.div(pe)),M=h(Oe,v.div(me)),P=h(Ne,v.div(he));return x.y.add(M.y).add(P.y)},gt=oe(()=>{const v=vt.xz.add(qt.xz);return ot(v.x,xt(v).add(.02),v.y)}),yt=oe(()=>{const v=ne().add(Yt(-.5)).length(),x=ht.saturate(),M=x.mul(.5),P=Kt(.015,.09,x),F=v.sub(M).div(P),O=F.mul(F).mul(-1).exp(),Y=x.oneMinus().pow(1.6),ge=v.mul(v).mul(-40).exp().mul(x.oneMinus().pow(6));return O.mul(Y).add(ge).mul(We)}),S=new se;S.colorNode=yt(),S.positionNode=gt(),S.opacity=1,S.side=je,S.forceSinglePass=!0,S.depthWrite=!1,S.depthTest=!1,S.transparent=!0,S.blending=kt;const re=new we(1,1);re.rotateX(-Math.PI/2);const T=new te(re,S);T.scale.set(de.value,de.value,1),T.count=Ce(a?.rain?.dropCount),T.frustumCulled=!1,T.renderOrder=1,g.add(T);const wt=t.getRenderTarget?.()||null;return t.setRenderTarget(l),t.clear(!0,!0,!0),t.setRenderTarget(wt),t.compute(pt),s.current={boundsDepth:q,boundsWidth:_,ceiling:le,computeParticles:mt,impactBrightness:We,impactCamera:p,impactFoamDecay:d,impactFoamRT:l,impactParticles:T,impactScene:g,impactLifetime:Ae,impactSize:de,decayGeometry:L,decayMaterial:U,decayPlane:B,impactGeometry:re,impactMaterial:S,rainMaterial:D,rainParticles:R,speed:fe,streakLength:Me,spawnRange:ue,firstWaveLength:pe,secondWaveLength:me,thirdWaveLength:he},()=>{s.current=null,i.remove(R),R.geometry.dispose(),D.dispose(),g.remove(B),g.remove(T),L.dispose(),U.dispose(),re.dispose(),S.dispose()}},[t,i,e]),rt(()=>{const o=s.current;if(!o)return;o.boundsWidth.value=a?.rain?.boundsWidth??100,o.boundsDepth.value=a?.rain?.boundsDepth??100,o.ceiling.value=a?.rain?.ceiling??35,o.spawnRange.value=a?.rain?.spawnRange??20,o.speed.value=a?.rain?.speed??20,o.streakLength.value=a?.rain?.streakLength??1.6,o.impactLifetime.value=a?.rain?.impactLifetime??1.4,o.impactSize.value=a?.rain?.impactSize??2.8,o.impactBrightness.value=a?.rain?.impactBrightness??1,o.impactFoamDecay.value=a?.rain?.impactFoamDecay??.08,o.firstWaveLength.value=e.waveLengths?.[0]??250,o.secondWaveLength.value=e.waveLengths?.[1]??17,o.thirdWaveLength.value=e.waveLengths?.[2]??5;const u=a?.rain?.enabled!==!1;o.rainParticles.count=Ce(a?.rain?.dropCount),o.impactParticles.count=o.rainParticles.count,o.rainMaterial.opacity=a?.rain?.opacity??.45,o.rainParticles.visible=u,o.impactParticles.visible=u;const w=a?.rain?.streakWidth??.06,n=a?.rain?.streakLength??1.6;o.rainParticles.scale.set(w,n,1);const l=a?.rain?.impactSize??2.8;o.impactParticles.scale.set(l,l,1),o.decayPlane.scale.set(o.boundsWidth.value,o.boundsDepth.value,1),o.decayMaterial.opacity=o.impactFoamDecay.value,o.impactCamera.left=-o.boundsWidth.value*.5,o.impactCamera.right=o.boundsWidth.value*.5,o.impactCamera.top=o.boundsDepth.value*.5,o.impactCamera.bottom=-o.boundsDepth.value*.5,o.impactCamera.updateProjectionMatrix(),u&&t.compute(o.computeParticles);const d=t.getRenderTarget?.()||null;t.setRenderTarget(o.impactFoamRT),t.render(o.impactScene,o.impactCamera),t.setRenderTarget(d)}),null}class $t{constructor(e){this.params=e,this.init(e)}destroy(){this.params.group.remove(this.mesh),this.geometry.dispose()}hide(){this.mesh.visible=!1}show(){this.mesh.visible=!0}init(e){this.geometry=new Lt,this.mesh=new te(this.geometry,e.material);const t=new y(e.offset.x,e.offset.y);t.applyMatrix4(e.transform),this.geometry.boundingSphere=new Ft(t,e.lod>3?e.width*1.75:e.width*3),this.mesh.castShadow=!1,this.mesh.layers.set(e.layer),this.mesh.receiveShadow=!0,e.group.add(this.mesh)}rebuildMeshFromData(e){this.geometry.setAttribute("position",new Se(e.positions,3)),this.geometry.setAttribute("normal",new Se(e.normals,3)),this.geometry.setAttribute("vindex",new Ve(e.vindices,1)),this.geometry.setAttribute("width",new Se(e.width,1)),this.geometry.setAttribute("lod",new Ve(e.lod,1)),this.geometry.setIndex(new It(e.indices,1)),this.geometry.attributes.position.needsUpdate=!0,this.geometry.attributes.normal.needsUpdate=!0,this.geometry.attributes.vindex.needsUpdate=!0,this.geometry.attributes.width.needsUpdate=!0,this.geometry.attributes.lod.needsUpdate=!0}}const G=new y,Xe=new y,Be=new y,Je=new y,C=new y,Ze=new y;function Qt(a){const e=[];for(let t=0;t<a;t+=1)for(let i=0;i<a;i+=1)e.push(t*(a+1)+i,(t+1)*(a+1)+i+1,t*(a+1)+i+1),e.push((t+1)*(a+1)+i,(t+1)*(a+1)+i+1,t*(a+1)+i);return e}function ea(a,e){const t=new Array(a.length).fill(0);for(let i=0;i<e.length;i+=3){const s=e[i]*3,o=e[i+1]*3,u=e[i+2]*3;Xe.fromArray(a,s),Be.fromArray(a,o),Je.fromArray(a,u),C.subVectors(Je,Be),Ze.subVectors(Xe,Be),C.cross(Ze),t[s]+=C.x,t[o]+=C.x,t[u]+=C.x,t[s+1]+=C.y,t[o+1]+=C.y,t[u+1]+=C.y,t[s+2]+=C.z,t[o+2]+=C.z,t[u+2]+=C.z}return t}function ta({lod:a,offset:e,resolution:t,width:i,worldMatrix:s}){const o=[],u=[],w=[],n=[],l=i/2;let d=0;for(let L=0;L<=t;L+=1){const U=i*L/t;for(let B=0;B<=t;B+=1){const _=i*B/t;G.set(U-l,_-l,0),G.add(e),G.applyMatrix4(s),o.push(G.x,G.y,G.z),u.push(d),w.push(i),n.push(a),d+=1}}const p=Qt(t),g=ea(o,p);return{indices:Uint32Array.from(p),lod:Uint32Array.from(n),normals:Float32Array.from(g),positions:Float32Array.from(o),vindices:Uint32Array.from(u),width:Float32Array.from(w)}}const aa=15,ra=36,st=V("vec3","rowItAloneDisplacedPosition"),ct=V("vec3","rowItAloneMorphedPosition"),lt=V("vec3","rowItAloneCascadeScales"),ia=V("vec2","rowItAloneTexelCoord0"),oa=V("vec2","rowItAloneTexelCoord1"),na=V("vec2","rowItAloneTexelCoord2"),sa=b(`

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
  `,[st,ct,lt,ia,oa,na]),ca=b(`

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
`),ut=new _t(new Uint8Array([0,0,0,255]),1,1);ut.needsUpdate=!0;class la{constructor(e){const t={time:r(0),cameraPosition:r(new y),minLodRadius:aa,gridResolution:r(e.gridResolution??ra),position:j("position"),vindex:j("vindex"),width:j("width"),lod:j("lod"),ifftResolution:r(e.ifftResolution),displacement0:h(e.cascades[0].displacement),displacement1:h(e.cascades[1].displacement),displacement2:h(e.cascades[2].displacement),derivatives0:h(e.cascades[0].derivative),derivatives1:h(e.cascades[1].derivative),derivatives2:h(e.cascades[2].derivative),jacobian0:h(e.cascades[0].jacobian),jacobian1:h(e.cascades[1].jacobian),jacobian2:h(e.cascades[2].jacobian),ifft_sampler0:h(e.cascades[0].derivative),ifft_sampler1:h(e.cascades[1].derivative),ifft_sampler2:h(e.cascades[2].derivative),foamStrength:e.foamStrength,foamThreshold:e.foamThreshold,reveal:r(e.reveal??0),impactFoamTexture:h(e.impactFoamTexture??ut),impactFoamStrength:r(e.impactFoamStrength??.8),impactFoamPatchSize:r(e.impactFoamPatchSize??100),seaColor:r(new Q(e.seaColor??"#01040c")),horizonColor:r(new Q(e.horizonColor??"#6b9ed1")),skyColor:r(new Q(e.skyColor??"#143663")),sunColor:r(new Q(e.sunColor??"#ffe6b8")),lodScale:e.lodScale,morphBlend:r(e.morphBlend??1),waveLengths:ot(e.cascades[0].params.lengthScale,e.cascades[1].params.lengthScale,e.cascades[2].params.lengthScale),sunPosition:r(e.sunPosition),vMorphedPosition:ct,vDisplacedPosition:st,vCascadeScales:lt},i=new se;i.positionNode=sa(t),i.colorNode=ca(t),i.side=Rt,i.colorSpace=it,i.transparent=!1,this.material=i,this.parameters=t}}const ua=b(`

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
`);class fa extends te{constructor(){const e={position:j("position"),normal:j("normal"),turbidity:r(10),rayleigh:r(3),mieCoefficient:r(.005),mieDirectionalG:r(.7),elevation:r(2),sunPosition:r(new y(0,0,0)),up:r(new y(0,1,0)),cameraPosition:r(new y(0,0,0))},t=new se;t.colorNode=ua(e),t.side=Tt,t.colorSpace=it,super(new Mt(1,1,1),t),this.parameters=e}}const Z={seaColor:"#01040c",horizonColor:"#6b9ed1",skyColor:"#143663",sunColor:"#ffe6b8"},$e=new y,Qe=new y,Pe=new y,ke=new y,ft=160,dt=192,da=2;function pa(a={}){return{patchResolution:Math.max(da,Math.round(a.patchResolution??dt)),patchSize:a.patchSize??ft}}class ma{constructor(e){this.params=e,this.currentConfig=null,this.patch=null,this.patchVisible=!0,this.patchSignature="",this.patchTransform=new At().makeRotationX(-Math.PI/2),this.sun=new y}init(){const e=this.currentConfig?.ocean||Z,t=new la({foamStrength:this.params.waveGenerator.foamStrength,foamThreshold:this.params.waveGenerator.foamThreshold,ifftResolution:this.params.waveGenerator.size,gridResolution:dt,lodScale:this.params.waveGenerator.lodScale,reveal:this.currentConfig?.ocean?.reveal?1:0,impactFoamTexture:this.params.impactFoamTexture,impactFoamStrength:this.currentConfig?.ocean?.impactFoamStrength??.8,impactFoamPatchSize:this.currentConfig?.ocean?.impactAreaSize,seaColor:e.seaColor,horizonColor:e.horizonColor,skyColor:e.skyColor,sunColor:e.sunColor,morphBlend:0,cascades:this.params.waveGenerator.cascades,sunPosition:this.sun});this.material=t.material,this.materialParameters=t.parameters,this.group=new Wt,this.params.scene.add(this.group),this.params.withSky!==!1&&(this.sky=new fa,this.sky.layers.set(2),this.sky.scale.setScalar(5e5),this.params.scene.add(this.sky)),this.ensurePatch()}ensurePatch(e){const{patchResolution:t,patchSize:i}=pa(e),s=`${i}:${t}`;this.patchSignature!==s&&(this.patch?.destroy(),Pe.set(0,0,0),this.patch=new $t({group:this.group,layer:this.params.layer,lod:0,material:this.material,offset:Pe.clone(),transform:this.patchTransform,width:i}),this.patch.rebuildMeshFromData(ta({lod:0,offset:Pe,resolution:t,width:i,worldMatrix:this.patchTransform})),this.patch.mesh.visible=this.patchVisible,this.materialParameters.gridResolution.value=t,this.patchSignature=s)}applyConfig(e){if(this.currentConfig=e,!!e)if(this.ensurePatch(e.ocean),this.patchVisible=e.ocean.visible??!0,this.material.wireframe=e.ocean.wireframe,this.materialParameters.reveal.value=e.ocean.reveal?1:0,this.materialParameters.impactFoamStrength.value=e.ocean.impactFoamStrength??.8,this.materialParameters.impactFoamPatchSize.value=e.ocean.impactAreaSize??ft,this.materialParameters.seaColor.value.set(e.ocean.seaColor||Z.seaColor),this.materialParameters.horizonColor.value.set(e.ocean.horizonColor||Z.horizonColor),this.materialParameters.skyColor.value.set(e.ocean.skyColor||Z.skyColor),this.materialParameters.sunColor.value.set(e.ocean.sunColor||Z.sunColor),this.params.waveGenerator.setFoamStrength(e.foam.foamStrength),this.params.waveGenerator.setFoamThreshold(e.foam.foamThreshold),this.params.waveGenerator.setLodScale(e.ocean.lodScale),this.sky&&e.sky){this.sky.parameters.rayleigh.value=e.sky.rayleigh,this.sky.parameters.turbidity.value=e.sky.turbidity,this.sky.parameters.mieCoefficient.value=e.sky.mieCoefficient,this.sky.parameters.mieDirectionalG.value=e.sky.mieDirectionalG,this.sky.parameters.elevation.value=e.sky.elevation,this.sky.parameters.up.value.fromArray(e.sky.up);const t=Ue.degToRad(90-e.sky.elevation),i=Ue.degToRad(e.sky.azimuth);this.sun.setFromSphericalCoords(1,t,i),this.sky.parameters.sunPosition.value.copy(this.sun),typeof e.sky.exposure=="number"&&(this.params.renderer.toneMappingExposure=e.sky.exposure)}else this.sun.set(0,1,0),this.params.renderer.toneMappingExposure=1}update(e=this.params.camera){this.params.camera=e,this.params.camera.getWorldPosition($e),this.params.scene.getWorldPosition(Qe),ke.subVectors($e,Qe),this.sky?.parameters.cameraPosition.value.copy(ke),this.patch&&(this.patch.mesh.visible=this.patchVisible,this.patch.mesh.material.wireframe=this.currentConfig?.ocean?.wireframe??!1),this.materialParameters.cameraPosition.value.copy(ke),this.materialParameters.sunPosition.value.copy(this.sun)}dispose(){this.patch?.destroy(),this.patch=null,this.patchSignature="",this.params.scene.remove(this.group),this.sky&&(this.params.scene.remove(this.sky),this.sky.geometry.dispose(),this.sky.material.dispose(),this.sky=null),this.material.dispose()}}const ha=b(`

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
`),va=b(`

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
`),xa=b(`

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
`),ga=b(`

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
`),ya=b(`

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
`),wa=b(`

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
`),Sa=b(`

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
`),za=b(`

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
`),ba=b(`

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
`);class Da{constructor(e){this.params=e,this.init(e)}init(e){this.squareSize=e.size**2,this.bufferSize=this.squareSize*4,this.spectrumBuffer=new k(new Float32Array(this.bufferSize),4),this.waveDataBuffer=new k(new Float32Array(this.bufferSize),4),this.initialSpectrum=za({spectrumBuffer:c(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),waveDataBuffer:c(this.waveDataBuffer,"vec4",this.waveDataBuffer.count),index:f,size:e.size,waveLength:r(e.lengthScale),boundaryLow:r(e.boundaryLow),boundaryHigh:r(e.boundaryHigh),...e.waveSettings}).compute(this.squareSize),this.initialSpectrumWithInverse=ba({spectrumBuffer:c(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),index:f,size:e.size}).compute(this.squareSize),e.renderer.compute(this.initialSpectrum),e.renderer.compute(this.initialSpectrumWithInverse)}update(){this.params.renderer.compute(this.initialSpectrum),this.params.renderer.compute(this.initialSpectrumWithInverse)}dispose(){this.spectrumBuffer?.dispose?.(),this.waveDataBuffer?.dispose?.()}}const Ca=[16,16,1],Ba=[250,17,5],Pa=[.9,.9,.9],ce=Object.freeze({Low:Object.freeze({resolution:128}),Medium:Object.freeze({resolution:256}),High:Object.freeze({resolution:512})}),ae="Medium";ce[ae].resolution;const ka=r(.8),La=r(2.7),Fa=r(3.7);function Ia(a=ae){return ce[a]||ce[ae]}const _e={depth:r(20),scaleHeight:r(1),windSpeed:r(1),windDirection:r(0),fetch:r(1e5),spreadBlend:r(1),swell:r(.198),peakEnhancement:r(3.3),shortWaveFade:r(0),fadeLimit:r(0)},_a={depth:{min:.1,max:100},scaleHeight:{min:0,max:1},windSpeed:{min:.01,max:10},windDirection:{min:0,max:2*Math.PI},fetch:{min:10,max:5e5},spreadBlend:{min:0,max:1},swell:{min:0,max:1},peakEnhancement:{min:1,max:5},shortWaveFade:{min:0,max:5},fadeLimit:{min:0,max:1}},Re={d_depth:r(20),d_scaleHeight:r(1),d_windSpeed:r(1),d_windDirection:r(240/360*2*Math.PI),d_fetch:r(3e5),d_spreadBlend:r(1),d_swell:r(.5),d_peakEnhancement:r(3.3),d_shortWaveFade:r(0),d_fadeLimit:r(0)},Ra={d_depth:{min:.1,max:100},d_scaleHeight:{min:0,max:1},d_windSpeed:{min:.01,max:10},d_windDirection:{min:0,max:2*Math.PI},d_fetch:{min:10,max:5e5},d_spreadBlend:{min:0,max:1},d_swell:{min:0,max:1},d_peakEnhancement:{min:1,max:5},d_shortWaveFade:{min:0,max:5},d_fadeLimit:{min:0,max:1}};class Ta{constructor(e){this.init(e)}init(e){this.params=e,this.logN=Math.log2(e.size),this.squareSize=e.size**2,this.bufferSize=this.squareSize*2,this.initialSpectrum=new Da(e),this.spectrumBuffer=this.initialSpectrum.spectrumBuffer,this.waveDataBuffer=this.initialSpectrum.waveDataBuffer,this.dxDzBuffer=new k(new Float32Array(this.bufferSize),2),this.dyDxzBuffer=new k(new Float32Array(this.bufferSize),2),this.dyxDyzBuffer=new k(new Float32Array(this.bufferSize),2),this.dxxDzzBuffer=new k(new Float32Array(this.bufferSize),2),this.pingpongBuffer=new k(new Float32Array(this.bufferSize*2),4),this.turbulenceBuffer=new k(new Float32Array(this.bufferSize/2),1),this.displacementIndex=r(0),this.ifftStep=r(0),this.pingpong=r(0),this.deltaTime=r(0),this.displacement=new ze(e.size,e.size),this.derivative=new ze(e.size,e.size),this.jacobian=new ze(e.size,e.size),this.displacement.type=Ie,this.derivative.type=Ie,this.jacobian.type=Et,this.displacement.generateMipmaps=!1,this.derivative.generateMipmaps=!1,this.jacobian.generateMipmaps=!1,this.displacement.magFilter=I,this.derivative.magFilter=I,this.jacobian.magFilter=I,this.displacement.minFilter=I,this.derivative.minFilter=I,this.jacobian.minFilter=I,this.displacement.wrapS=N,this.displacement.wrapT=N,this.derivative.wrapS=N,this.derivative.wrapT=N,this.jacobian.wrapS=N,this.jacobian.wrapT=N,this.workgroupSize=Ca,this.dispatchSize=[e.size/this.workgroupSize[0],e.size/this.workgroupSize[1]],this.computeTimeSpectrum=va({writeDxDzBuffer:c(this.dxDzBuffer,"vec2",this.dxDzBuffer.count),writeDyDxzBuffer:c(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count),writeDyxDyzBuffer:c(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count),writeDxxDzzBuffer:c(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count),spectrumBuffer:c(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),waveDataBuffer:c(this.waveDataBuffer,"vec4",this.waveDataBuffer.count),index:f,size:m(e.size),time:r(0)}).computeKernel(this.workgroupSize),this.computeInitialize=ya({size:m(e.size),step:m(this.ifftStep),logN:m(this.logN),butterflyBuffer:c(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),DxDzBuffer:c(this.dxDzBuffer,"vec2",this.dxDzBuffer.count).toReadOnly(),DyDxzBuffer:c(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count).toReadOnly(),DyxDyzBuffer:c(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count).toReadOnly(),DxxDzzBuffer:c(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count).toReadOnly(),pingpongBuffer:c(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:m(this.displacementIndex),index:f,workgroupSize:r(new K().fromArray(this.workgroupSize)),workgroupId:J,localId:X}).computeKernel(this.workgroupSize),this.computeHorizontalPingPong=xa({size:m(e.size),step:m(this.ifftStep),logN:m(this.logN),butterflyBuffer:c(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),pingpongBuffer:c(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:m(this.displacementIndex),pingpong:m(this.pingpong),index:f,workgroupSize:r(new K().fromArray(this.workgroupSize)),workgroupId:J,localId:X}).computeKernel(this.workgroupSize),this.computeVerticalPingPong=ga({size:m(e.size),step:m(this.ifftStep),logN:m(this.logN),butterflyBuffer:c(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),pingpongBuffer:c(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:m(this.displacementIndex),pingpong:m(this.pingpong),index:f,workgroupSize:r(new K().fromArray(this.workgroupSize)),workgroupId:J,localId:X}).computeKernel(this.workgroupSize),this.computePermute=wa({size:m(e.size),pingpongBuffer:c(this.pingpongBuffer,"vec4",this.pingpongBuffer.count).toReadOnly(),DxDzBuffer:c(this.dxDzBuffer,"vec2",this.dxDzBuffer.count),DyDxzBuffer:c(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count),DyxDyzBuffer:c(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count),DxxDzzBuffer:c(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count),initBufferIndex:m(this.displacementIndex),index:f,workgroupSize:r(new K().fromArray(this.workgroupSize)),workgroupId:J,localId:X}).computeKernel(this.workgroupSize),this.computeMergeTextures=Sa({size:m(e.size),index:f,lambda:r(e.lambda),deltaTime:this.deltaTime,DxDzBuffer:c(this.dxDzBuffer,"vec2",this.dxDzBuffer.count).toReadOnly(),DyDxzBuffer:c(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count).toReadOnly(),DyxDyzBuffer:c(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count).toReadOnly(),DxxDzzBuffer:c(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count).toReadOnly(),turbulenceBuffer:c(this.turbulenceBuffer,"float",this.turbulenceBuffer.count),writeDisplacement:De(this.displacement),writeDerivative:De(this.derivative),writeJacobian:De(this.jacobian),workgroupSize:r(new K().fromArray(this.workgroupSize)),workgroupId:J,localId:X}).computeKernel(this.workgroupSize)}update(e){this.computeTimeSpectrum.computeNode.parameters.time.value=performance.now()/1e3,this.params.renderer.compute(this.computeTimeSpectrum,this.dispatchSize),this.ifft(0),this.ifft(1),this.ifft(2),this.ifft(3),this.deltaTime.value=e,this.params.renderer.compute(this.computeMergeTextures,this.dispatchSize)}ifft(e){this.displacementIndex.value=e;let t=!0;this.ifftStep.value=0,this.params.renderer.compute(this.computeInitialize,this.dispatchSize);for(let i=1;i<this.logN;i+=1)t=!t,this.ifftStep.value=i,this.pingpong.value=t?1:0,this.params.renderer.compute(this.computeHorizontalPingPong,this.dispatchSize);for(let i=0;i<this.logN;i+=1)t=!t,this.ifftStep.value=i,this.pingpong.value=t?1:0,this.params.renderer.compute(this.computeVerticalPingPong,this.dispatchSize);this.params.renderer.compute(this.computePermute,this.dispatchSize)}dispose(){this.displacement?.dispose?.(),this.derivative?.dispose?.(),this.jacobian?.dispose?.(),this.initialSpectrum?.dispose?.()}}class Ma{constructor(e){this.params=e,this.quality=e.quality??ae}init(){this.qualityPreset=Ia(this.quality),this.size=this.qualityPreset.resolution,this.butterflyBuffer=new k(new Float32Array(Math.log2(this.size)*this.size*4),4),this.butterfly=ha({butterflyBuffer:c(this.butterflyBuffer,"vec4",this.butterflyBuffer.count),index:f,N:this.size}).compute(Math.log2(this.size)*this.size),this.params.renderer.compute(this.butterfly),this.waveSettings={..._e,...Re},this.cascades=[],this.foamStrength=ka,this.foamThreshold=La,this.waveLengths=Ba,this.lambda=Pa,this.lodScale=Fa,this.initCascades()}initCascades(){this.cascades.length=0;let e=1e-4;for(let t=0;t<this.waveLengths.length;t+=1){const i=t<this.waveLengths.length-1?2*Math.PI/this.waveLengths[t+1]*6:9999;this.cascades.push(new Ta({...this.params,...this.getCascadeParams(t,e,i)})),e=i}}getCascadeParams(e,t,i){return{boundaryHigh:i,boundaryLow:t,butterflyBuffer:this.butterflyBuffer,lambda:this.lambda[e],lengthScale:this.waveLengths[e],size:this.size,waveSettings:this.waveSettings}}setFoamStrength(e){this.foamStrength.value=e}setFoamThreshold(e){this.foamThreshold.value=e}setLodScale(e){this.lodScale.value=e}applyWaveSettings(e){if(!e)return;let t=!1;Object.entries(e).forEach(([i,s])=>{Object.prototype.hasOwnProperty.call(this.waveSettings,i)&&this.waveSettings[i].value!==s&&(this.waveSettings[i].value=s,t=!0)}),t&&this.cascades.forEach(i=>{i.initialSpectrum.update()})}update(e){this.cascades.forEach(t=>{t.update(e)})}dispose(){this.cascades.forEach(e=>{e.dispose?.()}),this.cascades=[],this.butterflyBuffer?.dispose?.()}}function Aa(a){return 1e3/Math.max(1,a?.performance?.waveUpdateHz??30)}function Wa({config:a,onReady:e}){const t=ee(l=>l.camera),i=ee(l=>l.gl),s=ee(l=>l.scene),o=z.useRef(null),u=z.useRef(0),w=a?.performance?.quality,n=a?.performance?.pauseWater??!1;return z.useEffect(()=>{if(!i?.isWebGPURenderer)return;const l=new Ma({quality:w,renderer:i});l.init();const d=new Ot(1024,1024);d.texture.type=Ie,d.texture.magFilter=I,d.texture.minFilter=I,d.texture.generateMipmaps=!1,d.texture.wrapS=qe,d.texture.wrapT=qe;const p=new ma({camera:t,impactFoamTexture:d.texture,layer:0,renderer:i,scene:s,waveGenerator:l,withSky:!1});return p.init(),p.applyConfig(a),o.current={oceanManager:p,waveGenerator:l},e?.({cascades:l.cascades,impactFoamRT:d,ifftResolution:l.size,waveLengths:l.waveLengths}),()=>{u.current=0,o.current=null,e?.(null),p.dispose(),d.dispose(),l.dispose?.()}},[t,i,e,w,s]),rt((l,d)=>{const p=o.current;if(!p)return;if(p.waveGenerator.applyWaveSettings(a.waveSettings),p.oceanManager.applyConfig(a),n){u.current=0,p.oceanManager.update(l.camera);return}const g=Aa(a);for(u.current=Math.min(u.current+d*1e3,g*3);u.current>=g;)p.waveGenerator.update(g),u.current-=g;p.oceanManager.update(l.camera)}),null}const et="Default",Le={Default:{oceanPatchSize:100,oceanPatchResolution:192,oceanLodScale:3.7,showWaterSurface:!0,oceanPaletteMode:"Row It Alone",oceanSeaColor:"#01040c",oceanHorizonColor:"#6b9ed1",oceanSkyColor:"#143663",oceanSunColor:"#ffe6b8",enhanceSurfaceDetails:!1,oceanFoamStrength:1.1,oceanFoamThreshold:2.8,quality:"Medium",pauseWater:!1,waveUpdateHz:30,rainEnabled:!0,rainDropCount:1e3,rainCeiling:35,rainSpawnRange:20,rainSpeed:20,rainStreakLength:1.6,rainStreakWidth:.06,rainOpacity:.45,impactAreaSize:64,impactSize:2.8,impactLifetime:1.4,impactBrightness:.7,impactFoamStrength:.6,impactFoamDecay:.045},P1:{oceanPatchSize:100,oceanPatchResolution:192,oceanLodScale:3.7,showWaterSurface:!0,oceanPaletteMode:"Monochrome",oceanSeaColor:"#000000",oceanHorizonColor:"#050505",oceanSkyColor:"#000000",oceanSunColor:"#ffffff",enhanceSurfaceDetails:!1,oceanFoamStrength:1.1,oceanFoamThreshold:2.8,quality:"Medium",pauseWater:!1,waveUpdateHz:30,rainEnabled:!0,rainDropCount:8e3,rainCeiling:35,rainSpawnRange:20,rainSpeed:20,rainStreakLength:1.6,rainStreakWidth:.06,rainOpacity:0,impactAreaSize:64,impactSize:2.8,impactLifetime:1.4,impactBrightness:.9,impactFoamStrength:.8,impactFoamDecay:.045},P2:{oceanPatchSize:100,oceanPatchResolution:192,oceanLodScale:3.7,showWaterSurface:!0,oceanPaletteMode:"Monochrome",oceanSeaColor:"#000000",oceanHorizonColor:"#050505",oceanSkyColor:"#000000",oceanSunColor:"#ffffff",enhanceSurfaceDetails:!1,oceanFoamStrength:1.1,oceanFoamThreshold:2.8,quality:"Medium",pauseWater:!1,waveUpdateHz:30,rainEnabled:!0,rainDropCount:8e3,rainCeiling:35,rainSpawnRange:20,rainSpeed:20,rainStreakLength:1.6,rainStreakWidth:.06,rainOpacity:.45,impactAreaSize:64,impactSize:2.8,impactLifetime:1.4,impactBrightness:.9,impactFoamStrength:.8,impactFoamDecay:.045},P3:{oceanPatchSize:100,oceanPatchResolution:192,oceanLodScale:3.7,showWaterSurface:!0,oceanPaletteMode:"Row It Alone",oceanSeaColor:"#01040c",oceanHorizonColor:"#6b9ed1",oceanSkyColor:"#143663",oceanSunColor:"#ffe6b8",enhanceSurfaceDetails:!1,oceanFoamStrength:1.1,oceanFoamThreshold:2.8,quality:"Medium",pauseWater:!1,waveUpdateHz:30,rainEnabled:!0,rainDropCount:8e3,rainCeiling:35,rainSpawnRange:20,rainSpeed:20,rainStreakLength:1.6,rainStreakWidth:.06,rainOpacity:0,impactAreaSize:64,impactSize:2.8,impactLifetime:1.4,impactBrightness:.9,impactFoamStrength:.8,impactFoamDecay:.045},P4:{oceanPatchSize:100,oceanPatchResolution:192,oceanLodScale:3.7,showWaterSurface:!0,oceanPaletteMode:"Row It Alone",oceanSeaColor:"#01040c",oceanHorizonColor:"#6b9ed1",oceanSkyColor:"#143663",oceanSunColor:"#ffe6b8",enhanceSurfaceDetails:!1,oceanFoamStrength:1.1,oceanFoamThreshold:2.8,quality:"Medium",pauseWater:!1,waveUpdateHz:30,rainEnabled:!0,rainDropCount:8e3,rainCeiling:35,rainSpawnRange:20,rainSpeed:20,rainStreakLength:1.6,rainStreakWidth:.06,rainOpacity:.45,impactAreaSize:64,impactSize:2.8,impactLifetime:1.4,impactBrightness:.9,impactFoamStrength:.8,impactFoamDecay:.045},P5:{oceanPatchSize:100,oceanPatchResolution:192,oceanLodScale:3.7,showWaterSurface:!0,oceanPaletteMode:"Monochrome",oceanSeaColor:"#000000",oceanHorizonColor:"#050505",oceanSkyColor:"#000000",oceanSunColor:"#ffffff",enhanceSurfaceDetails:!1,oceanFoamStrength:0,oceanFoamThreshold:2.8,quality:"Medium",pauseWater:!1,waveUpdateHz:30,rainEnabled:!0,rainDropCount:8e3,rainCeiling:35,rainSpawnRange:20,rainSpeed:20,rainStreakLength:1.6,rainStreakWidth:.06,rainOpacity:.45,impactAreaSize:64,impactSize:2.8,impactLifetime:1.4,impactBrightness:.9,impactFoamStrength:.8,impactFoamDecay:.045},P6:{oceanPatchSize:100,oceanPatchResolution:192,oceanLodScale:3.7,showWaterSurface:!0,oceanPaletteMode:"Row It Alone",oceanSeaColor:"#01040c",oceanHorizonColor:"#6b9ed1",oceanSkyColor:"#143663",oceanSunColor:"#ffe6b8",enhanceSurfaceDetails:!1,oceanFoamStrength:0,oceanFoamThreshold:2.8,quality:"Medium",pauseWater:!1,waveUpdateHz:30,rainEnabled:!0,rainDropCount:8e3,rainCeiling:35,rainSpawnRange:20,rainSpeed:20,rainStreakLength:1.6,rainStreakWidth:.06,rainOpacity:.45,impactAreaSize:64,impactSize:2.8,impactLifetime:1.4,impactBrightness:.9,impactFoamStrength:.8,impactFoamDecay:.045},Heavy:{oceanPatchSize:100,oceanPatchResolution:224,oceanLodScale:4,showWaterSurface:!0,oceanPaletteMode:"Monochrome",oceanSeaColor:"#000000",oceanHorizonColor:"#050505",oceanSkyColor:"#000000",oceanSunColor:"#ffffff",enhanceSurfaceDetails:!0,oceanFoamStrength:1.3,oceanFoamThreshold:2.7,quality:"Medium",pauseWater:!1,waveUpdateHz:36,rainEnabled:!0,rainDropCount:1e3,rainCeiling:42,rainSpawnRange:24,rainSpeed:24,rainStreakLength:1.9,rainStreakWidth:.07,rainOpacity:.55,impactAreaSize:64,impactSize:3.4,impactLifetime:1.8,impactBrightness:.95,impactFoamStrength:.9,impactFoamDecay:.04}};function Ea({presetSnapshot:a}){return{...a}}const $=[0,0,0],Oa={defaultMode:"orbit",orbit:{desktop:{position:[0,24,48],target:$,pivot:$,fov:45},mobile:{position:[0,28,58],target:$,pivot:$,fov:52}},fixed:{behavior:"single",activeShot:"overview",shots:{overview:{desktop:{position:[0,26,50],target:$,fov:45}}}}},Te="Water Cycle",Na=`${Te}.Camera`,Fe={Monochrome:{seaColor:"#000000",horizonColor:"#050505",skyColor:"#000000",sunColor:"#ffffff"},"Row It Alone":{seaColor:"#01040c",horizonColor:"#6b9ed1",skyColor:"#143663",sunColor:"#ffe6b8"}};function tt(a,e,t){return Object.fromEntries(Object.entries(e).map(([i,s])=>[`${a}${i}`,{label:i,max:t[i].max,min:t[i].min,value:s.value}]))}function at(a,e,t){return Object.fromEntries(Object.keys(t).map(i=>[i,a[`${e}${i}`]]))}function Ha(){const{attachSetControls:a,controlsSnapshotRef:e,initialPreset:t,presetsFolder:i}=Xt({defaultPreset:et,getPresetControls:Ea,presets:Le}),s=Le[t]||Le[et],o=z.useRef(null),{buildCamera:u,cameraControls:w}=Ht({apiRef:o,camera:Oa,cameraFolderPath:Na,controlsSnapshotRef:e}),[n,l]=Nt(Te,()=>({Presets:i,Camera:A(w,{collapsed:!0}),Ocean:A({oceanPatchSize:{label:"Patch Size",value:s.oceanPatchSize,min:50,max:220,step:1},oceanPatchResolution:{label:"Patch Resolution",value:s.oceanPatchResolution,min:64,max:384,step:1},oceanLodScale:{label:"LOD Scale",value:s.oceanLodScale,min:0,max:12,step:.1},showWaterSurface:{label:"Show Water Surface",value:!!s.showWaterSurface},oceanPaletteMode:{label:"Palette",value:s.oceanPaletteMode,options:Object.keys(Fe).concat("Custom")},oceanSeaColor:{label:"Sea",value:s.oceanSeaColor},oceanHorizonColor:{label:"Horizon",value:s.oceanHorizonColor},oceanSkyColor:{label:"Sky",value:s.oceanSkyColor},oceanSunColor:{label:"Sun",value:s.oceanSunColor},enhanceSurfaceDetails:{label:"Enhance Surface Detail",value:!!s.enhanceSurfaceDetails},oceanFoamStrength:{label:"Foam Strength",value:s.oceanFoamStrength,min:0,max:5,step:.05},oceanFoamThreshold:{label:"Foam Threshold",value:s.oceanFoamThreshold,min:0,max:6,step:.05}},{collapsed:!0}),Rain:A({rainEnabled:{label:"Rain Enabled",value:!!(s.rainEnabled??!0)},rainDropCount:{label:"Drop Count",value:s.rainDropCount,min:1e3,max:5e4,step:100},rainCeiling:{label:"Ceiling Y",value:s.rainCeiling,min:10,max:120,step:.5},rainSpawnRange:{label:"Spawn Range",value:s.rainSpawnRange,min:1,max:80,step:.5},rainSpeed:{label:"Fall Speed",value:s.rainSpeed,min:1,max:60,step:.5},rainStreakLength:{label:"Streak Length",value:s.rainStreakLength,min:.2,max:4,step:.05},rainStreakWidth:{label:"Streak Width",value:s.rainStreakWidth,min:.01,max:.25,step:.005},rainOpacity:{label:"Opacity",value:s.rainOpacity,min:.05,max:1,step:.01}},{collapsed:!0}),Impacts:A({impactAreaSize:{label:"Impact Area",value:s.impactAreaSize,min:20,max:220,step:1},impactSize:{label:"Ripple Size",value:s.impactSize,min:.1,max:8,step:.05},impactLifetime:{label:"Ripple Lifetime",value:s.impactLifetime,min:.2,max:4,step:.05},impactBrightness:{label:"Ripple Brightness",value:s.impactBrightness,min:.1,max:3,step:.05},impactFoamStrength:{label:"Impact Foam Strength",value:s.impactFoamStrength,min:0,max:3,step:.05},impactFoamDecay:{label:"Impact Foam Decay",value:s.impactFoamDecay,min:.01,max:.3,step:.005}},{collapsed:!0}),Performance:A({quality:{options:Object.keys(ce),value:s.quality||ae},pauseWater:{label:"Pause water",value:s.pauseWater},waveUpdateHz:{value:s.waveUpdateHz,min:5,max:60,step:1}},{collapsed:!0}),"First Wave Spectrum":A(tt("first_",_e,_a),{collapsed:!0}),"Second Wave Spectrum":A(tt("second_",Re,Ra),{collapsed:!0})}));a(l),e.current={...n},Jt({fileName:Te});const d=z.useMemo(()=>Gt(n),[n]),p=z.useMemo(()=>u(n),[u,d]),g=z.useMemo(()=>n.oceanPaletteMode==="Custom"?{horizonColor:n.oceanHorizonColor,seaColor:n.oceanSeaColor,skyColor:n.oceanSkyColor,sunColor:n.oceanSunColor}:Fe[n.oceanPaletteMode]||Fe["Row It Alone"],[n.oceanHorizonColor,n.oceanPaletteMode,n.oceanSeaColor,n.oceanSkyColor,n.oceanSunColor]);return z.useMemo(()=>({...n,camera:p,cameraApiRef:o,ocean:{patchResolution:n.oceanPatchResolution,patchSize:n.oceanPatchSize,visible:n.showWaterSurface,wireframe:!1,lodScale:n.oceanLodScale,reveal:n.enhanceSurfaceDetails?1:0,impactAreaSize:n.impactAreaSize,impactFoamStrength:n.impactFoamStrength,...g},foam:{foamStrength:n.oceanFoamStrength,foamThreshold:n.oceanFoamThreshold},performance:{quality:n.quality,pauseWater:n.pauseWater,waveUpdateHz:n.waveUpdateHz},waveSettings:{...at(n,"first_",_e),...at(n,"second_",Re)},rain:{boundsDepth:n.impactAreaSize,boundsWidth:n.impactAreaSize,ceiling:n.rainCeiling,dropCount:n.rainDropCount,enabled:n.rainEnabled,impactBrightness:n.impactBrightness,impactFoamDecay:n.impactFoamDecay,impactLifetime:n.impactLifetime,impactSize:n.impactSize,opacity:n.rainOpacity,spawnRange:n.rainSpawnRange,speed:n.rainSpeed,streakLength:n.rainStreakLength,streakWidth:n.rainStreakWidth}}),[p,n,g])}function Ga(){const a=Ha(),[e,t]=z.useState(null);return H.jsxs(H.Fragment,{children:[H.jsx(jt,{camera:a.camera}),H.jsx("color",{attach:"background",args:["#000000"]}),H.jsx(Wa,{config:a,onReady:t}),e&&H.jsx(Zt,{config:a,waterRuntime:e})]})}const ir=z.memo(Ga);export{ir as default};
