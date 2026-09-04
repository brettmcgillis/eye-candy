import{r as f,V as u,b as Le,Q as De,a0 as Ze,f as F,a as Ae,j as p,E as st,L as nt,y as Ke,a9 as ot,aT as me,c_ as Ce,S as lt,m as ae,aL as Je,F as ct,aq as Qe,B as ft,aO as ut,G as dt,c$ as N,cZ as ve,H as ke,Y as pt,U as $,bf as ee,d as xe,aF as ht,a3 as mt,az as O}from"./index-JMqKiZ4j.js";import{c as $e,R as et,d as vt,i as Be,e as Me,P as xt}from"./react-three-rapier.esm-dL1ep577.js";import{u as tt}from"./Gltf-q4WBl-jm.js";import{bo as k,bp as se,u as o,d as gt,t as C,av as ie,F as yt,j as wt,m as Oe,f as te,s as bt,ay as H,bq as h,az as B,br as ce,bs as fe,bl as ge}from"./three.tsl-BT0kdAYD.js";import{P as zt}from"./PerspectiveCamera-Cp8GIiAS.js";import{O as St}from"./OrbitControls-YiD6mVpK.js";import"./constants-BfA9iFUO.js";import"./extends-CF3RwP-h.js";import"./Fbo-C2BRm0yV.js";const Te=0,Dt=1,Re=new u(0,1,0);function Fe(t,e){const r=t.clone();return r.scale(e,e,e),r.computeBoundingBox(),r}function ye(t,e){const r=t.clone();return r.translate(e.x,e.y,e.z),r.computeBoundingBox(),r}function we(t){const e=new u;return t.computeBoundingBox(),t.boundingBox.getCenter(e),e}function je(t,e,r){const a=r.clone().applyAxisAngle(Re,F.degToRad(e));return[t[0]+a.x,t[1]+a.y,t[2]+a.z]}function Ee(t,e){const{min:r,max:a}=t.boundingBox,i=(r.y+a.y)*.5;return[new u(r.x,i,(r.z+a.z)*.5),new u(a.x,i,(r.z+a.z)*.5),new u((r.x+a.x)*.5,i,r.z),new u((r.x+a.x)*.5,i,a.z)].reduce((l,n)=>n.distanceToSquared(e)>l.distanceToSquared(e)?n:l)}function We({bodyRef:t,geometry:e,material:r,oars:a,onBodyReady:i,physics:s,position:l,probePoint:n,rotationY:c,sampleHeight:d}){const b=t,z=f.useRef(new u),m=f.useRef(new u),g=f.useRef(new u),y=f.useRef(new u),v=f.useRef(),j=f.useRef(new u),R=f.useRef(new u),X=f.useRef(new u),S=f.useMemo(()=>[0,F.degToRad(c),0],[c]);return $e(()=>{const D=t.current;if(!D||!v.current)return;D.resetForces(!1),D.resetTorques(!1);const x=X.current,K=z.current,E=m.current,Y=Math.max(.001,Math.abs(s.gravity[1])),W=g.current,G=y.current,_=j.current,L=R.current,A=D.angvel(),w=D.translation(),I=D.linvel();x.copy(n),v.current.localToWorld(x),K.set(w.x,w.y,w.z),W.set(I.x,I.y,I.z),G.set(A.x,A.y,A.z),_.copy(x).sub(K),L.copy(G).cross(_).add(W);const V=d(x.x,x.z)+a.probeLift-x.y;if(V<=0)return;const Z=Math.max(0,Math.min(V,a.maxSubmersion)*a.buoyancy*s.oarMass*Y-L.y*a.buoyancyDamping*s.oarMass);E.set(0,Z,0),D.addForceAtPoint(E,x,!0)}),p.jsx(et,{ref:D=>{b.current=D,i?.(D)},angularDamping:a.angularDamping,canSleep:!1,collisionGroups:Be(Dt,[]),colliders:"hull",linearDamping:a.linearDamping,mass:s.oarMass,position:l,rotation:S,type:"dynamic",children:p.jsx("mesh",{ref:v,castShadow:!0,geometry:e,material:r})})}function Bt({asset:t,boat:e,geometries:r,hullColliderRef:a,hullRef:i,materials:s,onBodyReady:l,physics:n,sampleHeight:c}){const d=i,b=f.useRef(new u),z=f.useRef(new u),m=f.useRef(new De),g=f.useRef(new u),y=f.useRef(new u),v=f.useRef(!0),j=f.useRef(new u),R=f.useRef(new u),X=f.useRef([new u,new u,new u,new u]),S=f.useRef([new u,new u,new u,new u]),D=f.useMemo(()=>[r.hull.attributes.position.array],[r.hull]);return f.useEffect(()=>{v.current=!0},[e.rotationY,e.startPosition]),$e(()=>{const x=i.current;if(!x)return;if(v.current){const P=a.current;P&&Math.abs(x.mass()-e.mass)>=.01&&(P.setMass(e.mass),x.recomputeMassPropertiesFromColliders()),x.setTranslation({x:e.startPosition[0],y:e.startPosition[1],z:e.startPosition[2]},!1),x.setRotation(new De().setFromEuler(new st(0,F.degToRad(e.rotationY),0)),!1),x.setLinvel({x:0,y:0,z:0},!1),x.setAngvel({x:0,y:0,z:0},!1),v.current=!1;return}x.resetForces(!1),x.resetTorques(!1);const K=Math.max(.001,Math.abs(n.gravity[1])),E=Math.min(e.probeForward,t.maxProbeForward),Y=Math.min(e.probeSide,t.maxProbeSide),W=x.mass(),G=z.current,_=m.current,L=g.current,A=y.current,w=b.current,I=X.current,ne=S.current,V=j.current,Z=R.current,U=I.length,q=x.angvel(),J=x.rotation(),oe=x.translation(),Q=x.linvel();G.set(oe.x,oe.y,oe.z),_.set(J.x,J.y,J.z,J.w),A.set(Q.x,Q.y,Q.z),w.set(q.x,q.y,q.z),I[0].set(-Y,t.probeY,E),I[1].set(Y,t.probeY,E),I[2].set(-Y,t.probeY,-E),I[3].set(Y,t.probeY,-E);for(let P=0;P<U;P+=1){const M=ne[P];M.copy(I[P]).applyQuaternion(_).add(G);const le=c(M.x,M.z)+e.draft+e.probeLift-M.y;if(le>0){V.copy(M).sub(G),Z.copy(w).cross(V).add(A);const he=Math.max(0,Math.min(le,t.maxSubmersion)*e.buoyancy*(W/U)*K-Z.y*e.buoyancyDamping*(W/U));L.set(0,he,0),x.addForceAtPoint(L,M,!0)}}}),p.jsxs(et,{ref:x=>{d.current=x,l?.(x)},angularDamping:e.angularDamping,canSleep:!1,collisionGroups:Be(Te,[]),colliders:!1,linearDamping:e.linearDamping,position:e.startPosition,rotation:[0,F.degToRad(e.rotationY),0],type:"dynamic",children:[p.jsx(vt,{args:D,collisionGroups:Be(Te,[]),ref:a}),p.jsx("mesh",{castShadow:!0,geometry:r.hull,material:s.rowboat_1}),p.jsx("mesh",{castShadow:!0,geometry:r.frontBench,material:s.rowboat_2}),p.jsx("mesh",{castShadow:!0,geometry:r.middleBench,material:s.rowboat_2}),p.jsx("mesh",{castShadow:!0,geometry:r.rearBench,material:s.rowboat_2}),p.jsx("mesh",{castShadow:!0,geometry:r.horizontalSupports,material:s.rowboat_1}),p.jsx("mesh",{castShadow:!0,geometry:r.supports,material:s.rowboat_1}),p.jsx("mesh",{castShadow:!0,geometry:r.upperEdge,material:s.rowboat_2}),p.jsx("mesh",{castShadow:!0,geometry:r.leftLock,material:s.rowboat_2}),p.jsx("mesh",{castShadow:!0,geometry:r.rightLock,material:s.rowboat_2})]})}function Rt({asset:t,hullRef:e,leftJointLimits:r,leftOarRef:a,rightJointLimits:i,rightOarRef:s}){return Me(e,a,[t.leftAnchor.toArray(),[0,0,0],Re.toArray(),r]),Me(e,s,[t.rightAnchor.toArray(),[0,0,0],Re.toArray(),i]),null}function Pt({boat:t,oars:e,physics:r,runtimeRef:a,sampler:i}){const s=f.useRef(),l=f.useRef(),n=f.useRef(),c=f.useRef(),[d,b]=f.useState(!1),z=f.useRef(new u),m=f.useRef(new Le),g=f.useRef(new u),y=f.useRef(new De),v=f.useRef(new u(1,1,1)),{materials:j,nodes:R}=tt(Ze("/rowboat.glb")),X=f.useCallback((_,L)=>i?i.sampleSurfaceHeight(_,L,z.current):0,[i]),S=f.useMemo(()=>{const _=Fe(R.hull_mesh.geometry,t.scale),A=we(_).clone().multiplyScalar(-1),w=he=>ye(Fe(he,t.scale),A),I=w(R.left_oar_lock_mesh.geometry),ne=w(R.right_oar_lock_mesh.geometry),V=w(R.left_oar_mesh.geometry),Z=w(R.right_oar_mesh.geometry),U=we(I),q=we(ne),J=Ee(V,U).sub(U),oe=Ee(Z,q).sub(q),Q={frontBench:w(R.front_bench_mesh.geometry),horizontalSupports:w(R.horizontal_support_strips_mesh.geometry),hull:w(R.hull_mesh.geometry),leftLock:I,leftOar:ye(V,U.clone().multiplyScalar(-1)),middleBench:w(R.middle_bench_mesh.geometry),rearBench:w(R.rear_bench_mesh.geometry),rightLock:ne,rightOar:ye(Z,q.clone().multiplyScalar(-1)),supports:w(R.support_strips_mesh.geometry),upperEdge:w(R.upper_edge_mesh.geometry)},P=Q.hull.boundingBox,M=P.max.y-P.min.y,pe=P.max.z-P.min.z,le=P.max.x-P.min.x;return{geometries:Q,hullDepth:pe,hullHeight:M,hullWidth:le,leftAnchor:U,leftProbe:J,maxProbeForward:pe*.46,maxProbeSide:le*.42,maxSubmersion:M*.7,probeY:P.min.y+M*.08,restYOffset:-(P.min.y+M*.31),rightAnchor:q,rightProbe:oe}},[t.scale,R]),D=f.useMemo(()=>[t.position[0],t.position[1]+S.restYOffset,t.position[2]],[S.restYOffset,t.position]),x=f.useMemo(()=>je(D,t.rotationY,S.leftAnchor),[S.leftAnchor,t.rotationY,D]),K=f.useMemo(()=>je(D,t.rotationY,S.rightAnchor),[S.rightAnchor,t.rotationY,D]),E=f.useMemo(()=>[-F.degToRad(e.jointMaxAngle),-F.degToRad(e.jointMinAngle)],[e.jointMaxAngle,e.jointMinAngle]),Y=f.useMemo(()=>[F.degToRad(e.jointMinAngle),F.degToRad(e.jointMaxAngle)],[e.jointMaxAngle,e.jointMinAngle]),W=f.useCallback(()=>{b(!!(l.current&&n.current&&c.current))},[]),G=f.useMemo(()=>({...e,maxSubmersion:S.hullHeight*.5}),[S.hullHeight,e]);return Ae(()=>{const _=a?.current?.oceanManager?.hullMask;if(!_)return;const L=l.current;if(!L||!t.hideInteriorWater){_.enabled.value=0;return}const A=L.translation(),w=L.rotation();g.current.set(A.x,A.y,A.z),y.current.set(w.x,w.y,w.z,w.w),m.current.compose(g.current,y.current,v.current).invert(),_.inverse.value.copy(m.current),_.extents.value.set(S.hullWidth*.5*t.interiorInset,S.hullDepth*.5*t.interiorInset),_.enabled.value=1}),p.jsxs(p.Fragment,{children:[p.jsx(Bt,{asset:S,boat:{...t,startPosition:D},geometries:S.geometries,hullColliderRef:s,hullRef:l,materials:j,onBodyReady:W,physics:r,sampleHeight:X}),p.jsx(We,{bodyRef:n,geometry:S.geometries.leftOar,material:j.rowboat_2,oars:G,onBodyReady:W,physics:r,position:x,probePoint:S.leftProbe,rotationY:t.rotationY,sampleHeight:X}),p.jsx(We,{bodyRef:c,geometry:S.geometries.rightOar,material:j.rowboat_2,oars:G,onBodyReady:W,physics:r,position:K,probePoint:S.rightProbe,rotationY:t.rotationY,sampleHeight:X}),d?p.jsx(Rt,{asset:S,hullRef:l,leftJointLimits:E,leftOarRef:n,rightJointLimits:Y,rightOarRef:c}):null]})}tt.preload(Ze("/rowboat.glb"));const _t=60;function It({lighting:t,runtimeRef:e}){const r=f.useRef();return Ae(()=>{const a=e?.current?.oceanManager?.sun;!a||!r.current||r.current.position.copy(a).multiplyScalar(_t)}),p.jsxs(p.Fragment,{children:[p.jsx("hemisphereLight",{args:[t.skyColor,t.groundColor,t.hemisphere]}),p.jsx("directionalLight",{castShadow:!0,color:t.sunColor,intensity:t.sun,ref:r,"shadow-camera-bottom":-10,"shadow-camera-far":200,"shadow-camera-left":-10,"shadow-camera-right":10,"shadow-camera-top":10,"shadow-mapSize-height":1024,"shadow-mapSize-width":1024})]})}class Lt{constructor(e){this.params=e,this.init(e)}destroy(){this.params.group.remove(this.mesh),this.geometry.dispose()}hide(){this.mesh.visible=!1}show(){this.mesh.visible=!0}init(e){this.geometry=new nt,this.mesh=new Ke(this.geometry,e.material);const r=new u(e.offset.x,e.offset.y);r.applyMatrix4(e.transform),this.geometry.boundingSphere=new ot(r,e.lod>3?e.width*1.75:e.width*3),this.mesh.castShadow=!1,this.mesh.layers.set(e.layer),this.mesh.receiveShadow=!0,e.group.add(this.mesh)}rebuildMeshFromData(e){this.geometry.setAttribute("position",new me(e.positions,3)),this.geometry.setAttribute("normal",new me(e.normals,3)),this.geometry.setAttribute("vindex",new Ce(e.vindices,1)),this.geometry.setAttribute("width",new me(e.width,1)),this.geometry.setAttribute("lod",new Ce(e.lod,1)),this.geometry.setIndex(new lt(e.indices,1)),this.geometry.attributes.position.needsUpdate=!0,this.geometry.attributes.normal.needsUpdate=!0,this.geometry.attributes.vindex.needsUpdate=!0,this.geometry.attributes.width.needsUpdate=!0,this.geometry.attributes.lod.needsUpdate=!0}}const re=new u,Ge=new u,be=new u,Ne=new u,T=new u,He=new u;function At(t){const e=[];for(let r=0;r<t;r+=1)for(let a=0;a<t;a+=1)e.push(r*(t+1)+a,(r+1)*(t+1)+a+1,r*(t+1)+a+1),e.push((r+1)*(t+1)+a,(r+1)*(t+1)+a+1,r*(t+1)+a);return e}function Ct(t,e){const r=new Array(t.length).fill(0);for(let a=0;a<e.length;a+=3){const i=e[a]*3,s=e[a+1]*3,l=e[a+2]*3;Ge.fromArray(t,i),be.fromArray(t,s),Ne.fromArray(t,l),T.subVectors(Ne,be),He.subVectors(Ge,be),T.cross(He),r[i]+=T.x,r[s]+=T.x,r[l]+=T.x,r[i+1]+=T.y,r[s+1]+=T.y,r[l+1]+=T.y,r[i+2]+=T.z,r[s+2]+=T.z,r[l+2]+=T.z}return r}function kt({lod:t,offset:e,resolution:r,width:a,worldMatrix:i}){const s=[],l=[],n=[],c=[],d=a/2;let b=0;for(let g=0;g<=r;g+=1){const y=a*g/r;for(let v=0;v<=r;v+=1){const j=a*v/r;re.set(y-d,j-d,0),re.add(e),re.applyMatrix4(i),s.push(re.x,re.y,re.z),l.push(b),n.push(a),c.push(t),b+=1}}const z=At(r),m=Ct(s,z);return{indices:Uint32Array.from(z),lod:Uint32Array.from(c),normals:Float32Array.from(m),positions:Float32Array.from(s),vindices:Uint32Array.from(l),width:Float32Array.from(n)}}const Mt=15,Ot=36,Pe=se("vec3","rowItAloneDisplacedPosition"),rt=se("vec3","rowItAloneMorphedPosition"),at=se("vec3","rowItAloneCascadeScales"),Tt=se("vec2","rowItAloneTexelCoord0"),Ft=se("vec2","rowItAloneTexelCoord1"),jt=se("vec2","rowItAloneTexelCoord2"),Et=k(`

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
  `,[Pe,rt,at,Tt,Ft,jt]),Wt=k(`

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
        var foamMixFactor: f32 = min(1.0, max(0.0, (-jacobian + foamThreshold) * foamStrength));

        if (dot(normalOcean, -viewDir) < 0.0) {
            normalOcean *= -1.0;
        }

        var sunDir: vec3<f32> = normalize(sunPosition);
        var fresnel = fresnelSchlick(0.02, normalOcean, -viewDir, 5.0);
        var specular = specularLight2(normalOcean, sunDir, viewDir, 8.0) * 1.3;
        var reflected = reflect(-viewDir, normalOcean);
        var skyMix = clamp(reflected.y * 0.5 + 0.5, 0.0, 1.0);
        var reflectionColor = mix(HORIZONCOLOR, SKYCOLOR, skyMix);
        reflectionColor += pow(max(dot(reflected, sunDir), 0.0), 96.0) * SUNCOLOR * 0.35;
        var refractionColor = SEACOLOR;
        var waterColor = mix(refractionColor, reflectionColor, fresnel);

        var atten: f32 = max(1.0 - vViewDist * vViewDist * 0.001, 0.0);
        waterColor += WAVECOLOR * saturate(vDisplacedPosition.y) * 0.05 * atten;

        var oceanColor = waterColor;
        oceanColor += normalize(vec3<f32>(5.0, 4.5, 4.0)) * specular;
        oceanColor = mix(oceanColor, vec3<f32>(1.0), foamMixFactor);
        oceanColor = mix(SEACOLOR, oceanColor, vCascadeScales.x);

        let fade = smoothstep(500.0, 4000.0, vViewDist);
        let finalColor = mix(oceanColor, vec3<f32>(0.0, 0.1, 0.2), fade);
        return vec4<f32>(finalColor, 1.0);
    }

    const SEACOLOR: vec3<f32> = vec3<f32>(0.004, 0.016, 0.047);
    const HORIZONCOLOR: vec3<f32> = vec3<f32>(0.42, 0.62, 0.82);
    const SKYCOLOR: vec3<f32> = vec3<f32>(0.08, 0.21, 0.39);
    const SUNCOLOR: vec3<f32> = vec3<f32>(1.0, 0.9, 0.72);
    const WAVECOLOR: vec3<f32> = vec3<f32>(0.14, 0.25, 0.18);

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
`);class Gt{constructor(e){const r={time:o(0),cameraPosition:o(new u),minLodRadius:Mt,gridResolution:o(e.gridResolution??Ot),position:ie("position"),vindex:ie("vindex"),width:ie("width"),lod:ie("lod"),ifftResolution:o(e.ifftResolution),displacement0:C(e.cascades[0].displacement),displacement1:C(e.cascades[1].displacement),displacement2:C(e.cascades[2].displacement),derivatives0:C(e.cascades[0].derivative),derivatives1:C(e.cascades[1].derivative),derivatives2:C(e.cascades[2].derivative),jacobian0:C(e.cascades[0].jacobian),jacobian1:C(e.cascades[1].jacobian),jacobian2:C(e.cascades[2].jacobian),ifft_sampler0:C(e.cascades[0].derivative),ifft_sampler1:C(e.cascades[1].derivative),ifft_sampler2:C(e.cascades[2].derivative),foamStrength:e.foamStrength,foamThreshold:e.foamThreshold,lodScale:e.lodScale,morphBlend:o(e.morphBlend??1),waveLengths:gt(e.cascades[0].params.lengthScale,e.cascades[1].params.lengthScale,e.cascades[2].params.lengthScale),sunPosition:o(e.sunPosition),vMorphedPosition:rt,vDisplacedPosition:Pe,vCascadeScales:at},a=o(new Le),i=o(new ae(0,0)),s=o(0),l=new Je;l.positionNode=Et(r),l.colorNode=Wt(r),l.opacityNode=yt(()=>{const n=a.mul(wt(Pe,1)).xyz,c=n.x.div(Oe(i.x,te(1e-4))),d=n.z.div(Oe(i.y,te(1e-4))),b=c.mul(c).add(d.mul(d)).lessThan(te(1)).and(s.greaterThan(te(.5)));return bt(b,te(0),te(1))})(),l.alphaTest=.5,l.side=ct,l.colorSpace=Qe,l.transparent=!1,this.material=l,this.parameters=r,this.hullMask={enabled:s,extents:i,inverse:a}}}const Nt=k(`

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
`);class Ht extends Ke{constructor(){const e={position:ie("position"),normal:ie("normal"),turbidity:o(10),rayleigh:o(3),mieCoefficient:o(.005),mieDirectionalG:o(.7),elevation:o(2),sunPosition:o(new u(0,0,0)),up:o(new u(0,1,0)),cameraPosition:o(new u(0,0,0))},r=new Je;r.colorNode=Nt(e),r.side=ft,r.colorSpace=Qe,super(new ut(1,1,1),r),this.parameters=e}}const Ye=new u,Ve=new u,ze=new u,Se=new u,Yt=160,it=192,Vt=2;function Ut(t={}){return{patchResolution:Math.max(Vt,Math.round(t.patchResolution??it)),patchSize:t.patchSize??Yt}}class qt{constructor(e){this.params=e,this.currentConfig=null,this.patch=null,this.patchSignature="",this.patchTransform=new Le().makeRotationX(-Math.PI/2),this.sun=new u}init(){const e=new Gt({foamStrength:this.params.waveGenerator.foamStrength,foamThreshold:this.params.waveGenerator.foamThreshold,ifftResolution:this.params.waveGenerator.size,gridResolution:it,lodScale:this.params.waveGenerator.lodScale,morphBlend:0,cascades:this.params.waveGenerator.cascades,sunPosition:this.sun});this.material=e.material,this.materialParameters=e.parameters,this.hullMask=e.hullMask,this.group=new dt,this.params.scene.add(this.group),this.sky=new Ht,this.sky.layers.set(2),this.sky.scale.setScalar(5e5),this.params.scene.add(this.sky),this.ensurePatch()}ensurePatch(e){const{patchResolution:r,patchSize:a}=Ut(e),i=`${a}:${r}`;this.patchSignature!==i&&(this.patch?.destroy(),ze.set(0,0,0),this.patch=new Lt({group:this.group,layer:this.params.layer,lod:0,material:this.material,offset:ze.clone(),transform:this.patchTransform,width:a}),this.patch.rebuildMeshFromData(kt({lod:0,offset:ze,resolution:r,width:a,worldMatrix:this.patchTransform})),this.patch.show(),this.materialParameters.gridResolution.value=r,this.patchSignature=i)}applyConfig(e){if(this.currentConfig=e,!e)return;this.ensurePatch(e.ocean),this.material.wireframe=e.ocean.wireframe,this.params.waveGenerator.setFoamStrength(e.foam.foamStrength),this.params.waveGenerator.setFoamThreshold(e.foam.foamThreshold),this.params.waveGenerator.setLodScale(e.ocean.lodScale),this.sky.parameters.rayleigh.value=e.sky.rayleigh,this.sky.parameters.turbidity.value=e.sky.turbidity,this.sky.parameters.mieCoefficient.value=e.sky.mieCoefficient,this.sky.parameters.mieDirectionalG.value=e.sky.mieDirectionalG,this.sky.parameters.elevation.value=e.sky.elevation,this.sky.parameters.up.value.fromArray(e.sky.up);const r=F.degToRad(90-e.sky.elevation),a=F.degToRad(e.sky.azimuth);this.sun.setFromSphericalCoords(1,r,a),this.sky.parameters.sunPosition.value.copy(this.sun),typeof e.sky.exposure=="number"&&(this.params.renderer.toneMappingExposure=e.sky.exposure)}update(e=this.params.camera){this.params.camera=e,this.params.camera.getWorldPosition(Ye),this.params.scene.getWorldPosition(Ve),Se.subVectors(Ye,Ve),this.sky.parameters.cameraPosition.value.copy(Se),this.patch&&(this.patch.show(),this.patch.mesh.material.wireframe=this.currentConfig?.ocean?.wireframe??!1),this.materialParameters.cameraPosition.value.copy(Se),this.materialParameters.sunPosition.value.copy(this.sun)}dispose(){this.patch?.destroy(),this.patch=null,this.patchSignature="",this.params.scene.remove(this.group),this.params.scene.remove(this.sky),this.material.dispose(),this.sky.geometry.dispose(),this.sky.material.dispose()}}const Xt=192;class Ue{constructor({modeCount:e=Xt}={}){this.modeCount=e,this.ready=!1,this.time=0,this.lambda=1,this.count=0}async load({cascade:e,renderer:r}){const a=new Float32Array(await r.getArrayBufferAsync(e.spectrumBuffer)),i=new Float32Array(await r.getArrayBufferAsync(e.waveDataBuffer)),s=Math.min(a.length,i.length)/4,l=[];for(let c=0;c<s;c+=1){const d=c*4,b=i[d+3],z=a[d],m=a[d+1],g=a[d+2],y=a[d+3],v=z*z+m*m+g*g+y*y;b!==0&&v>0&&l.push({energy:v,index:c})}l.sort((c,d)=>d.energy-c.energy);const n=Math.min(this.modeCount,l.length);this.count=n,this.kx=new Float32Array(n),this.kz=new Float32Array(n),this.invK=new Float32Array(n),this.omega=new Float32Array(n),this.h0pr=new Float32Array(n),this.h0pi=new Float32Array(n),this.h0mr=new Float32Array(n),this.h0mi=new Float32Array(n),this.hr=new Float32Array(n),this.hi=new Float32Array(n);for(let c=0;c<n;c+=1){const d=l[c].index*4;this.kx[c]=i[d],this.invK[c]=i[d+1],this.kz[c]=i[d+2],this.omega[c]=i[d+3],this.h0pr[c]=a[d],this.h0pi[c]=a[d+1],this.h0mr[c]=a[d+2],this.h0mi[c]=a[d+3]}return this.lambda=e.params.lambda,this.ready=!0,this.setTime(this.time),this}setTime(e){if(this.time=e,!!this.ready)for(let r=0;r<this.count;r+=1){const a=this.omega[r]*e,i=Math.cos(a),s=Math.sin(a);this.hr[r]=this.h0pr[r]*i-this.h0pi[r]*s+this.h0mr[r]*i+this.h0mi[r]*s,this.hi[r]=this.h0pr[r]*s+this.h0pi[r]*i-this.h0mr[r]*s+this.h0mi[r]*i}}sampleHeight(e,r){if(!this.ready)return 0;let a=0;for(let i=0;i<this.count;i+=1){const s=this.kx[i]*e+this.kz[i]*r;a+=this.hr[i]*Math.cos(s)-this.hi[i]*Math.sin(s)}return a}sampleDisplacement(e,r,a){if(!this.ready)return a.set(0,0,0);let i=0,s=0,l=0;for(let n=0;n<this.count;n+=1){const c=this.kx[n]*e+this.kz[n]*r,d=Math.cos(c),b=Math.sin(c),z=this.hr[n]*d-this.hi[n]*b,g=-(this.hr[n]*b+this.hi[n]*d)*this.invK[n];i+=g*this.kx[n],s+=z,l+=g*this.kz[n]}return a.set(i*this.lambda,s,l*this.lambda)}sampleNormal(e,r,a,i=.35){const s=this.sampleHeight(e-i,r),l=this.sampleHeight(e+i,r),n=this.sampleHeight(e,r-i),c=this.sampleHeight(e,r+i);return a.set(s-l,i*2,n-c).normalize()}sampleSurfaceHeight(e,r,a,i=2){if(!this.ready)return 0;let s=e,l=r;for(let n=0;n<i;n+=1)this.sampleDisplacement(s,l,a),s=e-a.x,l=r-a.z;return this.sampleDisplacement(s,l,a),a.y}dispose(){this.ready=!1,this.count=0}}const Zt=k(`

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
`),Kt=k(`

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
`),Jt=k(`

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
`),Qt=k(`

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
`),$t=k(`

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
`),er=k(`

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
`),tr=k(`

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
`),rr=k(`

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
`),ar=k(`

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
`);class ir{constructor(e){this.params=e,this.init(e)}init(e){this.squareSize=e.size**2,this.bufferSize=this.squareSize*4,this.spectrumBuffer=new N(new Float32Array(this.bufferSize),4),this.waveDataBuffer=new N(new Float32Array(this.bufferSize),4),this.initialSpectrum=rr({spectrumBuffer:h(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),waveDataBuffer:h(this.waveDataBuffer,"vec4",this.waveDataBuffer.count),index:H,size:e.size,waveLength:o(e.lengthScale),boundaryLow:o(e.boundaryLow),boundaryHigh:o(e.boundaryHigh),...e.waveSettings}).compute(this.squareSize),this.initialSpectrumWithInverse=ar({spectrumBuffer:h(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),index:H,size:e.size}).compute(this.squareSize),e.renderer.compute(this.initialSpectrum),e.renderer.compute(this.initialSpectrumWithInverse)}update(){this.params.renderer.compute(this.initialSpectrum),this.params.renderer.compute(this.initialSpectrumWithInverse)}dispose(){this.spectrumBuffer?.dispose?.(),this.waveDataBuffer?.dispose?.()}}const sr=[16,16,1],nr=[250,17,5],or=[.9,.9,.9],de=Object.freeze({Low:Object.freeze({resolution:128}),Medium:Object.freeze({resolution:256}),High:Object.freeze({resolution:512})}),ue="Medium";de[ue].resolution;const lr=o(.8),cr=o(2.7),fr=o(3.7);function ur(t=ue){return de[t]||de[ue]}const _e={depth:o(20),scaleHeight:o(1),windSpeed:o(1),windDirection:o(0),fetch:o(1e5),spreadBlend:o(1),swell:o(.198),peakEnhancement:o(3.3),shortWaveFade:o(0),fadeLimit:o(0)},dr={depth:{min:.1,max:100},scaleHeight:{min:0,max:1},windSpeed:{min:.01,max:10},windDirection:{min:0,max:2*Math.PI},fetch:{min:10,max:5e5},spreadBlend:{min:0,max:1},swell:{min:0,max:1},peakEnhancement:{min:1,max:5},shortWaveFade:{min:0,max:5},fadeLimit:{min:0,max:1}},Ie={d_depth:o(20),d_scaleHeight:o(1),d_windSpeed:o(1),d_windDirection:o(240/360*2*Math.PI),d_fetch:o(3e5),d_spreadBlend:o(1),d_swell:o(.5),d_peakEnhancement:o(3.3),d_shortWaveFade:o(0),d_fadeLimit:o(0)},pr={d_depth:{min:.1,max:100},d_scaleHeight:{min:0,max:1},d_windSpeed:{min:.01,max:10},d_windDirection:{min:0,max:2*Math.PI},d_fetch:{min:10,max:5e5},d_spreadBlend:{min:0,max:1},d_swell:{min:0,max:1},d_peakEnhancement:{min:1,max:5},d_shortWaveFade:{min:0,max:5},d_fadeLimit:{min:0,max:1}};class hr{constructor(e){this.init(e)}init(e){this.params=e,this.logN=Math.log2(e.size),this.squareSize=e.size**2,this.bufferSize=this.squareSize*2,this.initialSpectrum=new ir(e),this.spectrumBuffer=this.initialSpectrum.spectrumBuffer,this.waveDataBuffer=this.initialSpectrum.waveDataBuffer,this.dxDzBuffer=new N(new Float32Array(this.bufferSize),2),this.dyDxzBuffer=new N(new Float32Array(this.bufferSize),2),this.dyxDyzBuffer=new N(new Float32Array(this.bufferSize),2),this.dxxDzzBuffer=new N(new Float32Array(this.bufferSize),2),this.pingpongBuffer=new N(new Float32Array(this.bufferSize*2),4),this.turbulenceBuffer=new N(new Float32Array(this.bufferSize/2),1),this.displacementIndex=o(0),this.ifftStep=o(0),this.pingpong=o(0),this.deltaTime=o(0),this.displacement=new ve(e.size,e.size),this.derivative=new ve(e.size,e.size),this.jacobian=new ve(e.size,e.size),this.displacement.type=ke,this.derivative.type=ke,this.jacobian.type=pt,this.displacement.generateMipmaps=!1,this.derivative.generateMipmaps=!1,this.jacobian.generateMipmaps=!1,this.displacement.magFilter=$,this.derivative.magFilter=$,this.jacobian.magFilter=$,this.displacement.minFilter=$,this.derivative.minFilter=$,this.jacobian.minFilter=$,this.displacement.wrapS=ee,this.displacement.wrapT=ee,this.derivative.wrapS=ee,this.derivative.wrapT=ee,this.jacobian.wrapS=ee,this.jacobian.wrapT=ee,this.workgroupSize=sr,this.dispatchSize=[e.size/this.workgroupSize[0],e.size/this.workgroupSize[1]],this.computeTimeSpectrum=Kt({writeDxDzBuffer:h(this.dxDzBuffer,"vec2",this.dxDzBuffer.count),writeDyDxzBuffer:h(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count),writeDyxDyzBuffer:h(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count),writeDxxDzzBuffer:h(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count),spectrumBuffer:h(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),waveDataBuffer:h(this.waveDataBuffer,"vec4",this.waveDataBuffer.count),index:H,size:B(e.size),time:o(0)}).computeKernel(this.workgroupSize),this.computeInitialize=$t({size:B(e.size),step:B(this.ifftStep),logN:B(this.logN),butterflyBuffer:h(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),DxDzBuffer:h(this.dxDzBuffer,"vec2",this.dxDzBuffer.count).toReadOnly(),DyDxzBuffer:h(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count).toReadOnly(),DyxDyzBuffer:h(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count).toReadOnly(),DxxDzzBuffer:h(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count).toReadOnly(),pingpongBuffer:h(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:B(this.displacementIndex),index:H,workgroupSize:o(new ae().fromArray(this.workgroupSize)),workgroupId:fe,localId:ce}).computeKernel(this.workgroupSize),this.computeHorizontalPingPong=Jt({size:B(e.size),step:B(this.ifftStep),logN:B(this.logN),butterflyBuffer:h(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),pingpongBuffer:h(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:B(this.displacementIndex),pingpong:B(this.pingpong),index:H,workgroupSize:o(new ae().fromArray(this.workgroupSize)),workgroupId:fe,localId:ce}).computeKernel(this.workgroupSize),this.computeVerticalPingPong=Qt({size:B(e.size),step:B(this.ifftStep),logN:B(this.logN),butterflyBuffer:h(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),pingpongBuffer:h(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:B(this.displacementIndex),pingpong:B(this.pingpong),index:H,workgroupSize:o(new ae().fromArray(this.workgroupSize)),workgroupId:fe,localId:ce}).computeKernel(this.workgroupSize),this.computePermute=er({size:B(e.size),pingpongBuffer:h(this.pingpongBuffer,"vec4",this.pingpongBuffer.count).toReadOnly(),DxDzBuffer:h(this.dxDzBuffer,"vec2",this.dxDzBuffer.count),DyDxzBuffer:h(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count),DyxDyzBuffer:h(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count),DxxDzzBuffer:h(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count),initBufferIndex:B(this.displacementIndex),index:H,workgroupSize:o(new ae().fromArray(this.workgroupSize)),workgroupId:fe,localId:ce}).computeKernel(this.workgroupSize),this.computeMergeTextures=tr({size:B(e.size),index:H,lambda:o(e.lambda),deltaTime:this.deltaTime,DxDzBuffer:h(this.dxDzBuffer,"vec2",this.dxDzBuffer.count).toReadOnly(),DyDxzBuffer:h(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count).toReadOnly(),DyxDyzBuffer:h(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count).toReadOnly(),DxxDzzBuffer:h(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count).toReadOnly(),turbulenceBuffer:h(this.turbulenceBuffer,"float",this.turbulenceBuffer.count),writeDisplacement:ge(this.displacement),writeDerivative:ge(this.derivative),writeJacobian:ge(this.jacobian),workgroupSize:o(new ae().fromArray(this.workgroupSize)),workgroupId:fe,localId:ce}).computeKernel(this.workgroupSize)}update(e){this.waveTime=performance.now()/1e3,this.computeTimeSpectrum.computeNode.parameters.time.value=this.waveTime,this.params.renderer.compute(this.computeTimeSpectrum,this.dispatchSize),this.ifft(0),this.ifft(1),this.ifft(2),this.ifft(3),this.deltaTime.value=e,this.params.renderer.compute(this.computeMergeTextures,this.dispatchSize)}ifft(e){this.displacementIndex.value=e;let r=!0;this.ifftStep.value=0,this.params.renderer.compute(this.computeInitialize,this.dispatchSize);for(let a=1;a<this.logN;a+=1)r=!r,this.ifftStep.value=a,this.pingpong.value=r?1:0,this.params.renderer.compute(this.computeHorizontalPingPong,this.dispatchSize);for(let a=0;a<this.logN;a+=1)r=!r,this.ifftStep.value=a,this.pingpong.value=r?1:0,this.params.renderer.compute(this.computeVerticalPingPong,this.dispatchSize);this.params.renderer.compute(this.computePermute,this.dispatchSize)}dispose(){this.displacement?.dispose?.(),this.derivative?.dispose?.(),this.jacobian?.dispose?.(),this.initialSpectrum?.dispose?.()}}class mr{constructor(e){this.params=e,this.quality=e.quality??ue}init(){this.qualityPreset=ur(this.quality),this.size=this.qualityPreset.resolution,this.butterflyBuffer=new N(new Float32Array(Math.log2(this.size)*this.size*4),4),this.butterfly=Zt({butterflyBuffer:h(this.butterflyBuffer,"vec4",this.butterflyBuffer.count),index:H,N:this.size}).compute(Math.log2(this.size)*this.size),this.params.renderer.compute(this.butterfly),this.waveSettings={..._e,...Ie},this.cascades=[],this.foamStrength=lr,this.foamThreshold=cr,this.waveLengths=nr,this.lambda=or,this.lodScale=fr,this.initCascades()}initCascades(){this.cascades.length=0;let e=1e-4;for(let r=0;r<this.waveLengths.length;r+=1){const a=r<this.waveLengths.length-1?2*Math.PI/this.waveLengths[r+1]*6:9999;this.cascades.push(new hr({...this.params,...this.getCascadeParams(r,e,a)})),e=a}}getCascadeParams(e,r,a){return{boundaryHigh:a,boundaryLow:r,butterflyBuffer:this.butterflyBuffer,lambda:this.lambda[e],lengthScale:this.waveLengths[e],size:this.size,waveSettings:this.waveSettings}}setFoamStrength(e){this.foamStrength.value=e}setFoamThreshold(e){this.foamThreshold.value=e}setLodScale(e){this.lodScale.value=e}applyWaveSettings(e){if(!e)return;let r=!1;Object.entries(e).forEach(([a,i])=>{Object.prototype.hasOwnProperty.call(this.waveSettings,a)&&this.waveSettings[a].value!==i&&(this.waveSettings[a].value=i,r=!0)}),r&&this.cascades.forEach(a=>{a.initialSpectrum.update()})}update(e){this.cascades.forEach(r=>{r.update(e)})}dispose(){this.cascades.forEach(e=>{e.dispose?.()}),this.cascades=[],this.butterflyBuffer?.dispose?.()}}async function vr({cascade:t,renderer:e,sampler:r}){const a=new Float32Array(await e.getArrayBufferAsync(t.dyDxzBuffer)),{size:i}=t.params,{lengthScale:s}=t.params,l=Math.max(1,Math.floor(i/16));let n=0,c=0,d=0;r.setTime(t.waveTime??0);for(let b=0;b<i;b+=l)for(let z=0;z<i;z+=l){const m=a[(b*i+z)*2],g=r.sampleHeight(z*s/i,b*s/i);n=Math.max(n,Math.abs(m)),c=Math.max(c,Math.abs(m-g)),d+=1}return{maxAbsolute:n,maxError:c,modeCount:r.count,relativeError:n>0?c/n:0,sampleCount:d}}function xr(t){return 1e3/Math.max(1,t?.performance?.waveUpdateHz??30)}function gr(t){const e=xe(m=>m.camera),r=xe(m=>m.gl),a=xe(m=>m.scene),i=f.useRef(null),s=f.useRef(0),l=f.useRef(new Ue),[n,c]=f.useState(null),d=t?.performance?.quality,b=t?.performance?.pauseWater??!1,z=t?.buoyancy?.modeCount??192;return f.useEffect(()=>{if(!r?.isWebGPURenderer)return;let m=!1;const g=new mr({quality:d,renderer:r});g.init();const y=new qt({camera:e,layer:0,renderer:r,scene:a,waveGenerator:g});y.init(),y.applyConfig(t);const v=new Ue({modeCount:z});return l.current=v,i.current={oceanManager:y,sampler:v,waveGenerator:g},v.load({cascade:g.cascades[0],renderer:r}).then(()=>{m||(c(v),ht()&&typeof window<"u"&&(window.rowItAloneWaveCheck=()=>vr({cascade:g.cascades[0],renderer:r,sampler:v})))}).catch(()=>{m||c(null)}),()=>{m=!0,s.current=0,i.current=null,c(null),v.dispose(),y.dispose(),g.dispose?.()}},[z,e,r,d,a]),Ae((m,g)=>{const y=i.current;if(!y)return;if(y.waveGenerator.applyWaveSettings(t.waveSettings),y.oceanManager.applyConfig(t),b){s.current=0,y.oceanManager.update(m.camera),y.sampler.setTime(y.waveGenerator.cascades[0].waveTime??0);return}const v=xr(t);for(s.current=Math.min(s.current+g*1e3,v*3);s.current>=v;)y.waveGenerator.update(v),s.current-=v;y.oceanManager.update(m.camera),y.sampler.setTime(y.waveGenerator.cascades[0].waveTime??0)}),{runtimeRef:i,sampler:n,samplerRef:l}}function qe(t,e,r){return Object.fromEntries(Object.entries(e).map(([a,i])=>[`${t}${a}`,{label:a,max:r[a].max,min:r[a].min,value:i.value}]))}function Xe(t,e,r){return Object.fromEntries(Object.keys(r).map(a=>[a,t[`${e}${a}`]]))}function yr(){const t=mt("Row It Alone WebGPU",{Camera:O({camX:{label:"X",value:30,min:-200,max:200,step:.1},camY:{label:"Y",value:20,min:1,max:200,step:.1},camZ:{label:"Z",value:30,min:-200,max:200,step:.1},targetX:{label:"Target X",value:0,min:-100,max:100,step:.1},targetY:{label:"Target Y",value:0,min:-50,max:50,step:.1},targetZ:{label:"Target Z",value:0,min:-100,max:100,step:.1},fov:{value:50,min:20,max:90,step:1},minDistance:{value:10,min:1,max:200,step:1},maxDistance:{value:1200,min:50,max:1e4,step:10}},{collapsed:!0}),Sky:O({elevation:{value:2,min:0,max:90,step:.1},azimuth:{value:180,min:-180,max:180,step:.1},exposure:{value:1,min:.05,max:2.5,step:.01},rayleigh:{value:3,min:0,max:4,step:.001},turbidity:{value:10,min:1,max:20,step:.1},mieCoefficient:{value:.005,min:0,max:.02,step:1e-4},mieDirectionalG:{value:.7,min:0,max:1,step:.001}},{collapsed:!0}),"First Wave Spectrum":O(qe("first_",_e,dr),{collapsed:!0}),"Second Wave Spectrum":O(qe("second_",Ie,pr),{collapsed:!0}),Foam:O({foamStrength:{value:.8,min:0,max:5,step:.1},foamThreshold:{value:2.7,min:0,max:5,step:.1}},{collapsed:!0}),Ocean:O({patchSize:{value:160,min:20,max:1e3,step:1},patchResolution:{value:192,min:16,max:512,step:1},wireframe:!1,lodScale:{value:3.7,min:0,max:20,step:.1}},{collapsed:!1}),Lighting:O({sunIntensity:{label:"Sun",value:2.6,min:0,max:10,step:.05},sunColor:{label:"Sun Color",value:"#fff2dd"},hemisphereIntensity:{label:"Hemisphere",value:.9,min:0,max:5,step:.05},hemisphereSkyColor:{label:"Sky Color",value:"#bcd9ff"},hemisphereGroundColor:{label:"Ground Color",value:"#2f4a5c"}},{collapsed:!0}),Boat:O({boatScale:{label:"Scale",value:1,min:.1,max:8,step:.05},boatPositionX:{label:"X",value:0,min:-60,max:60,step:.1},boatPositionY:{label:"Y",value:0,min:-5,max:5,step:.01},boatPositionZ:{label:"Z",value:0,min:-60,max:60,step:.1},boatRotationY:{label:"Rot Y",value:-20,min:-180,max:180,step:1},boatDraft:{label:"Draft",value:.03,min:-2,max:2,step:.01},boatMass:{label:"Mass",value:1.4,min:.05,max:50,step:.01},boatBuoyancy:{label:"Buoyancy",value:5.8,min:0,max:80,step:.1},boatBuoyancyDamping:{label:"Buoy Damp",value:3,min:0,max:20,step:.05},boatLinearDamping:{label:"Linear Damp",value:3.4,min:0,max:20,step:.05},boatAngularDamping:{label:"Angular Damp",value:8.5,min:0,max:20,step:.05},boatProbeLift:{label:"Probe Lift",value:.02,min:-1,max:2,step:.01},boatProbeForward:{label:"Probe Forward",value:.72,min:.05,max:5,step:.01},boatProbeSide:{label:"Probe Side",value:.34,min:.05,max:5,step:.01},hideInteriorWater:{label:"Hide Interior Water",value:!0},interiorInset:{label:"Interior Inset",value:.92,min:.3,max:1.2,step:.01}},{collapsed:!0}),Oars:O({jointMinAngle:{label:"Min Angle",value:-58,min:-180,max:0,step:1},jointMaxAngle:{label:"Max Angle",value:36,min:0,max:180,step:1},oarLinearDamping:{label:"Linear Damp",value:1.8,min:0,max:8,step:.05},oarAngularDamping:{label:"Angular Damp",value:5.5,min:0,max:20,step:.05},oarBuoyancy:{label:"Buoyancy",value:12,min:0,max:40,step:.1},oarBuoyancyDamping:{label:"Buoy Damp",value:2.2,min:0,max:10,step:.05},oarProbeLift:{label:"Probe Lift",value:.1,min:-1,max:2,step:.01}},{collapsed:!0}),Physics:O({gravityY:{label:"Gravity Y",value:-9.81,min:-20,max:0,step:.01},oarMass:{label:"Oar Mass",value:.25,min:.05,max:10,step:.01},timeStep:{label:"Time Step",value:.011111111111111112,min:.004166666666666667,max:.03333333333333333,step:5e-4},buoyancyModeCount:{label:"Wave Modes",value:192,min:32,max:1024,step:32}},{collapsed:!0}),Performance:O({quality:{options:Object.keys(de),value:ue},pauseWater:{label:"Pause water",value:!1},waveUpdateHz:{value:30,min:5,max:60,step:1}},{collapsed:!0})});return{lighting:{groundColor:t.hemisphereGroundColor,hemisphere:t.hemisphereIntensity,skyColor:t.hemisphereSkyColor,sun:t.sunIntensity,sunColor:t.sunColor},boat:{angularDamping:t.boatAngularDamping,buoyancy:t.boatBuoyancy,buoyancyDamping:t.boatBuoyancyDamping,draft:t.boatDraft,hideInteriorWater:t.hideInteriorWater,interiorInset:t.interiorInset,linearDamping:t.boatLinearDamping,mass:t.boatMass,position:[t.boatPositionX,t.boatPositionY,t.boatPositionZ],probeForward:t.boatProbeForward,probeLift:t.boatProbeLift,probeSide:t.boatProbeSide,rotationY:t.boatRotationY,scale:t.boatScale},oars:{angularDamping:t.oarAngularDamping,buoyancy:t.oarBuoyancy,buoyancyDamping:t.oarBuoyancyDamping,jointMaxAngle:t.jointMaxAngle,jointMinAngle:t.jointMinAngle,linearDamping:t.oarLinearDamping,probeLift:t.oarProbeLift},physics:{gravity:[0,t.gravityY,0],oarMass:t.oarMass,timeStep:t.timeStep},buoyancy:{modeCount:t.buoyancyModeCount},camera:{fov:t.fov,maxDistance:t.maxDistance,minDistance:t.minDistance,position:[t.camX,t.camY,t.camZ],target:[t.targetX,t.targetY,t.targetZ]},ocean:{lodScale:t.lodScale,patchResolution:t.patchResolution,patchSize:t.patchSize,wireframe:t.wireframe},foam:{foamStrength:t.foamStrength,foamThreshold:t.foamThreshold},sky:{azimuth:t.azimuth,elevation:t.elevation,exposure:t.exposure,mieCoefficient:t.mieCoefficient,mieDirectionalG:t.mieDirectionalG,rayleigh:t.rayleigh,turbidity:t.turbidity,up:[0,1,0]},performance:{pauseWater:t.pauseWater,quality:t.quality,waveUpdateHz:t.waveUpdateHz},waveSettings:{...Xe(t,"first_",_e),...Xe(t,"second_",Ie)}}}function Ir(){const t=yr(),{runtimeRef:e,sampler:r}=gr(t);return p.jsxs(p.Fragment,{children:[p.jsx(zt,{makeDefault:!0,position:t.camera.position,fov:t.camera.fov,near:.1,far:1e6}),p.jsx(St,{makeDefault:!0,target:t.camera.target,minDistance:t.camera.minDistance,maxDistance:t.camera.maxDistance,maxPolarAngle:Math.PI*.495}),p.jsx("color",{attach:"background",args:["#87ceeb"]}),p.jsx(It,{lighting:t.lighting,runtimeRef:e}),p.jsx(xt,{gravity:t.physics.gravity,interpolate:!0,paused:!r,timeStep:t.physics.timeStep,children:p.jsx(f.Suspense,{fallback:null,children:p.jsx(Pt,{boat:t.boat,oars:t.oars,physics:t.physics,runtimeRef:e,sampler:r})})})]})}export{Ir as default};
