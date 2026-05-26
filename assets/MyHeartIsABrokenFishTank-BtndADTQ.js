import{aA as _e,j as m,r as g,o as ye,aC as Le,n as be,a1 as Nt,aZ as gi,M as N,z as mi,V as M,b1 as jt,Q as Ke,w as xi,p as Ee,am as A,a4 as Ut,aJ as vi,y as j,aE as Si,U as Qe,b2 as Et,aY as bi,a6 as yi,a7 as wi,N as Je,ap as Mi,aX as Pi,E as Ti,K as _}from"./index-DyiJa5hr.js";import{R as $e,C as Ue,i as ki,P as zi}from"./react-three-rapier.esm-DDylZWt5.js";import{u as Oe}from"./Gltf-B86MG64p.js";import{u as Ci,a as Di,b as Wi}from"./useOperatorInput-Cj-9yxa6.js";import{P as Ri}from"./PerspectiveCamera-D73WVBGs.js";import{O as Bi}from"./OrbitControls-xq72CcOv.js";import{d as Ii,B as Fi,F as pe,f as q,m as Ht,R as Yn,i as Ye,j as Me,l as Xn,L as qn,ag as gt,s as Gi,q as _i,ak as Li,al as sn,z as we,N as Zn,am as bt,an as yt,ao as Ei,u as U}from"./three.tsl-DU4z3Y7i.js";import{N as Oi}from"./NurbsWaterColumnGPU-Vk4-wl72.js";import{u as Ai}from"./usePresetsFolder-BVAQtC3_.js";import"./constants-BUffrCXI.js";import"./extends-CF3RwP-h.js";import"./Fbo-C99VJIHU.js";import"./waterUtils-BCo-ERgj.js";function Vi(i){const{nodes:e,materials:t}=Oe(_e("/goldfish.glb"));return m.jsx("group",{...i,dispose:null,children:m.jsx("group",{rotation:[-Math.PI/2,0,0],scale:.033,children:m.jsx("group",{rotation:[Math.PI/2,0,0],children:m.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:e.fish_Material006_0.geometry,material:t["Material.006"],position:[0,29.917,18.927],rotation:[-Math.PI/2,0,0],scale:9.747})})})})}Oe.preload(_e("/goldfish.glb"));const an=.2,Ni=.12,ji=.08,Ui=.14,Re=.18;function Be(i){const e=Math.max(i.width-i.glassThickness*2-i.waterInset*2,an),t=Math.max(i.depth-i.glassThickness*2-i.waterInset*2,an),a=Math.max(i.height-i.glassThickness*2-Re-i.waterInset,Ni),r=Math.max(ji,a*i.waterLevel),s=-i.height/2+Re/2,n=-i.height/2+Re+r/2,l=-i.height/2+Re+.12,o=l+Math.max(Ui,r-.16);return{innerDepth:t,innerHeight:a,innerWidth:e,maxFishY:o,minFishY:l,sandY:s,waterHeight:r,waterY:n}}const Hi={back:[0,0,-1],front:[0,0,1],left:[-1,0,0],right:[1,0,0]},Yi=2,Xi=[0,Math.PI],qi=[-.22,.22],on=.06;function Zi(i,e,t,a){const r=qi[i]??0;if(!e)return{x:r,y:-a.height/2+Re+on,z:i===0?-.16:.16};const[s,,n]=Hi[e],l=-a.height/2+on;return n!==0?{x:r,y:l,z:n*(a.depth/2+t.escapeDistance)}:{x:s*(a.width/2+t.escapeDistance),y:l,z:r}}function Ki(i){switch(i){case"back":return Math.PI;case"left":return-Math.PI/2;case"right":return Math.PI/2;default:return 0}}function $i({fish:i,runtime:e,tank:t,showMarkers:a=!1}){const r=g.useRef([]),s=g.useMemo(()=>Array.from({length:Yi},(n,l)=>o=>{r.current[l]=o}),[]);return ye(n=>{if(!i.visible)return;const l=n.clock.elapsedTime*i.speed,o=e?e.getWaterLevel():t.waterLevel,c=e?e.getFirstBrokenPane():null,{innerDepth:h,innerWidth:d,maxFishY:u,minFishY:p,waterHeight:f}=Be({...t,waterLevel:o}),v=Math.min(i.radiusX,d*.42),b=Math.min(i.radiusZ,h*.42),S=p+Math.max(.05,f*.45)+i.baseYOffset,x=o<=i.strandLevel;for(let w=0;w<i.count;w+=1){const y=r.current[w];if(y){const z=Xi[w]??0,k=l+z;if(x){const F=n.clock.elapsedTime*7+z,T=Zi(w,c,i,t);y.position.set(T.x,T.y,T.z),y.rotation.y=Ki(c),y.rotation.x=Math.sin(F)*i.flopAmplitude,y.rotation.z=Math.cos(F*.72)*i.flopAmplitude*.35}else{const F=Math.cos(k)*v,T=Math.sin(k)*b,B=Math.min(u,Math.max(p,S+Math.sin(k*2.1)*i.bobAmplitude));y.position.set(F,B,T),y.rotation.x=0,y.rotation.y=-k+Math.PI/2,y.rotation.z=Math.sin(k*2.8)*.08}}}}),Array.from({length:i.count},(n,l)=>m.jsxs("group",{ref:s[l],visible:i.visible,children:[m.jsx(Vi,{scale:i.scale}),a&&m.jsxs("mesh",{position:[0,.08,0],children:[m.jsx("sphereGeometry",{args:[i.markerSize,12,12]}),m.jsx("meshBasicMaterial",{color:i.markerColor})]})]},`fish-${l}`))}const Ie=-.9,Qi=.18,Ji=.08,er=.08,tr=.12,nr=.08,ir=1.6,rr=.16,sr=1.9;function ar(i){return i.width+Math.max(sr,i.spillExtent*1.25)}function or(i){return i.depth+Math.max(ir,i.spillExtent*1.1)}function lr(i){return Math.max(rr,i.glassThickness*3)}function cr(i){return Math.max(nr,i*1.25)}function ur(i){return Math.max(er,i*1.25)}function hr(i){return Math.max(tr,i*1.75)}function Yt(i,e={}){const t=e.position??[0,0,0],a=Math.max(.01,e.width??ar(i)),r=Math.max(.01,e.depth??or(i)),s=Math.max(.01,e.thickness??lr(i)),n=-i.height/2+t[1],l=Math.max(Qi,s*1.4),o=Math.max(Ji,s*.65),c=n-l/2,h=Math.max(.01,e.legs?.width??cr(s)),d=Math.max(.01,e.legs?.depth??ur(s)),u=Math.max(0,e.legs?.inset??hr(s)),p=Math.min(u,Math.max(0,a/2-h/2)),f=Math.min(u,Math.max(0,r/2-d/2)),v=Math.max(0,a/2-p-h/2),b=Math.max(0,r/2-f-d/2),S=Math.max(.01,n-s-Ie),x=Ie+S/2,w=[h/2,S/2,d/2],y=[h,S,d];return{depth:r,edgeBand:Math.max(.28,s*3),edgeColliders:[{args:[a/2,l/2,o/2],key:"front",position:[t[0],c,t[2]+r/2-o/2]},{args:[a/2,l/2,o/2],key:"back",position:[t[0],c,t[2]-r/2+o/2]},{args:[o/2,l/2,Math.max(.01,r/2-o)],key:"left",position:[t[0]-a/2+o/2,c,t[2]]},{args:[o/2,l/2,Math.max(.01,r/2-o)],key:"right",position:[t[0]+a/2-o/2,c,t[2]]}],legs:[{halfExtents:w,key:"front-left",position:[t[0]-v,x,t[2]+b],size:y},{halfExtents:w,key:"front-right",position:[t[0]+v,x,t[2]+b],size:y},{halfExtents:w,key:"back-left",position:[t[0]-v,x,t[2]-b],size:y},{halfExtents:w,key:"back-right",position:[t[0]+v,x,t[2]-b],size:y}],thickness:s,topHalfExtents:[a/2,s/2,r/2],topPosition:[t[0],n-s/2,t[2]],topY:n,width:a}}const wt=24,dr=24;function pr({cameraConfig:i,cameraMode:e="Fixed",operatorCamera:t,sceneEnvironment:a}){const[r,s]=g.useState(null),[n,l]=g.useState(null),{cameraFov:o,cameraPosition:c,cameraTarget:h}=Ci(i),d=e==="Operator",u=e==="Orbit",p=Di({enabled:d});return Wi({enabled:d,inputRef:p,config:t}),g.useLayoutEffect(()=>{if(!d&&r){if(r.position.set(...c),r.fov=o,r.updateProjectionMatrix(),!n){r.lookAt(...h);return}n.target.set(...h),n.update()}},[o,r,c,h,n,d]),m.jsxs(m.Fragment,{children:[m.jsx(Ri,{ref:s,makeDefault:!0,position:c,fov:o,near:.1,far:100}),m.jsx(Bi,{ref:l,makeDefault:!0,target:h,enabled:u,enablePan:u,enableRotate:u,enableZoom:u}),m.jsx("color",{attach:"background",args:[a.backgroundColor]}),m.jsx("fog",{attach:"fog",args:[a.fogColor,Math.min(a.fogNear,a.fogFar),Math.max(a.fogNear,a.fogFar)]}),m.jsx("ambientLight",{intensity:a.ambientIntensity}),m.jsx("directionalLight",{castShadow:!0,intensity:a.directionalIntensity,position:a.directionalPosition,"shadow-mapSize-width":1024,"shadow-mapSize-height":1024}),m.jsxs("mesh",{position:[0,Ie,0],receiveShadow:!0,rotation:[-Math.PI/2,0,0],children:[m.jsx("planeGeometry",{args:[wt,wt]}),m.jsx("meshStandardMaterial",{color:a.floorColor})]}),m.jsx("gridHelper",{args:[wt,dr,a.gridColor,a.gridColor],position:[0,Ie+.002,0]})]})}const fr=["glass","glass_2","glass_5"],he=["front","back","left","right"],gr=[{key:"left",geometryKey:"glass_left",materialKey:"glass"},{key:"front",geometryKey:"glass_back",materialKey:"glass"},{key:"right",geometryKey:"glass_right",materialKey:"glass"},{key:"back",geometryKey:"glass_front",materialKey:"glass"}],Kn=[{geometryKey:"rubber",materialKey:"rubber"},{geometryKey:"plastic_1",materialKey:"plastic_1"},{geometryKey:"rock_1",materialKey:"rock_1"},{geometryKey:"sand",materialKey:"sand"},{geometryKey:"rock_3",materialKey:"rock_3"},{geometryKey:"rock_4",materialKey:"rock_4"},{geometryKey:"rock_5",materialKey:"rock_5"},{geometryKey:"rock_6",materialKey:"rock_6"},{geometryKey:"rock_7",materialKey:"rock_7"},{geometryKey:"rock_2",materialKey:"rock_2"},{geometryKey:"stone",materialKey:"stone"},{geometryKey:"glass_2",materialKey:"glass_2"},{geometryKey:"glass_5",materialKey:"glass_5"},{geometryKey:"plastic_2",materialKey:"plastic_1"},{geometryKey:"lid_1",materialKey:"plastic_1"}],ln=Kn.map(({geometryKey:i})=>i),Ot=Le.forwardRef(function({glassColor:e,glassOpacity:t,paneProps:a={},renderPane:r,renderStaticMesh:s,sandColor:n,staticMeshProps:l={},...o},c){const{nodes:h,materials:d}=Oe(_e("/fishTank.glb")),u=g.useMemo(()=>{const p=Object.fromEntries(Object.entries(d).map(([f,v])=>[f,v.clone()]));return fr.forEach(f=>{const v=p[f];v&&(e&&v.color&&v.color.set(e),t!=null&&(v.opacity=t,v.transparent=t<1||v.transparent,v.needsUpdate=!0))}),n&&p.sand?.color&&p.sand.color.set(n),p},[e,t,d,n]);return m.jsxs("group",{ref:c,...o,dispose:null,children:[Kn.map(({geometryKey:p,materialKey:f})=>s?s({geometry:h[p].geometry,material:u[f],meshKey:p,meshProps:l[p]}):m.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:h[p].geometry,material:u[f],...l[p]},p)),gr.map(({geometryKey:p,key:f,materialKey:v})=>r?r({geometry:h[p].geometry,material:u[v],paneKey:f,paneProps:a[f]}):m.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:h[p].geometry,material:u[v],...a[f]},f))]})});Ot.displayName="FishTank";Oe.preload(_e("/fishTank.glb"));const mr=.996,xr=.18,vr=36,Sr=.985,br=.12,yr=.28,wr=new mi,cn=new M,un=new M,hn=new M,de=new M,dn=new Ke,pn=new jt,ue=new M,Ve=new M;function mt(i,e){return Math.max(0,Math.min(e,i))}function fn(i,e,t,a,r){const s=i,n=mt(Math.round((t+e.domainWidth/2)/e.domainWidth*(e.resolution-1)),e.resolution-1),l=mt(Math.round((a+e.domainDepth/2)/e.domainDepth*(e.resolution-1)),e.resolution-1);for(let o=-2;o<=2;o+=1)for(let c=-2;c<=2;c+=1){const h=n+c,d=l+o;if(h>=0&&h<e.resolution&&d>=0&&d<e.resolution){const u=d*e.resolution+h,p=Math.exp(-(c*c+o*o)*.65);s[u]+=r*p}}}function Mr(i,e,t,a,r){const s=i,n=mt(Math.round((t+e.domainWidth/2)/e.domainWidth*(e.resolution-1)),e.resolution-1),l=mt(Math.round((a+e.domainDepth/2)/e.domainDepth*(e.resolution-1)),e.resolution-1);for(let o=-2;o<=2;o+=1)for(let c=-2;c<=2;c+=1){const h=n+c,d=l+o;if(h>=0&&h<e.resolution&&d>=0&&d<e.resolution){const u=d*e.resolution+h,p=Math.exp(-(c*c+o*o)*.58);s[u]=Math.min(e.maxDepth,s[u]+r*p)}}}function Pr({resolution:i,tank:e,xCoords:t,zCoords:a}){const r=e.depth/2,s=e.width/2,n=e.depth*.42,l=e.width*.42,o=Math.max(br,e.spillThickness*4),c=Math.max(yr,e.spillThickness*6),h={back:[],front:[],left:[],right:[]};for(let d=0;d<i*i;d+=1){const u=t[d],p=a[d];Math.abs(u)<=l&&p>=r-o&&p<=r+c&&h.front.push(d),Math.abs(u)<=l&&p<=-r+o&&p>=-r-c&&h.back.push(d),Math.abs(p)<=n&&u>=s-o&&u<=s+c&&h.right.push(d),Math.abs(p)<=n&&u<=-s+o&&u>=-s-c&&h.left.push(d)}return h}function Tr(i,e){const t=Yt(i,e),a=t.width,r=t.depth,s=vr,n=new gi(a,r,s-1,s-1);n.rotateX(-Math.PI/2);const l=n.getAttribute("position"),o=Float32Array.from(l.array),c=new Float32Array(s*s),h=Math.max(0,i.depth/2-i.glassThickness),d=Math.max(0,i.width/2-i.glassThickness),u=new Uint8Array(s*s),p=new Float32Array(s*s),f=new Float32Array(s*s);for(let v=0;v<s*s;v+=1){p[v]=o[v*3],f[v]=o[v*3+2];const b=p[v],S=f[v],x=Math.min(a/2-Math.abs(b),r/2-Math.abs(S));c[v]=N.clamp(1-x/t.edgeBand,0,1),u[v]=Math.abs(b)<d&&Math.abs(S)<h?1:0}return{basePositions:o,blockedHalfDepth:h,blockedHalfWidth:d,depthCurrent:new Float32Array(s*s),depthNext:new Float32Array(s*s),domainDepth:r,domainWidth:a,edgeDrain:c,geometry:n,maxDepth:Math.max(i.spillThickness*1.8,.03),positionAttr:l,resolution:s,sourceIndicesByPane:Pr({resolution:s,tank:i,xCoords:p,zCoords:f}),vertexCount:s*s,waveCurrent:new Float32Array(s*s),waveNext:new Float32Array(s*s),wavePrev:new Float32Array(s*s),xCoords:p,zCoords:f,tankBaseMask:u}}function kr(i){i.depthCurrent.fill(0),i.depthNext.fill(0),i.waveCurrent.fill(0),i.waveNext.fill(0),i.wavePrev.fill(0)}function zr({fluidCouplersRef:i,runtime:e,table:t,tank:a}){const r=be(f=>f.camera),s=be(f=>f.gl),n=g.useRef(new WeakMap),l=g.useRef(e?.getResetNonce?.()??0),o=be(f=>f.pointer),c=g.useRef(null),h=g.useRef(null),d=s?.backend?.isWebGPUBackend===!0&&!!s?.backend?.device&&!!s?.backend?.context&&typeof navigator<"u"&&!!navigator.gpu,u=g.useMemo(()=>Tr(a,t),[t.depth,t.position,t.thickness,t.width,a.depth,a.glassThickness,a.height,a.spillExtent,a.spillThickness,a.width]),p=Yt(a,t);return ye((f,v)=>{if(d)return;const b=e?.getResetNonce?.()??0;b!==l.current&&(l.current=b,kr(u),h.current=null,c.current&&(c.current.visible=!1));const S=e?e.getWaterLevel():a.waterLevel,x=e?e.getBrokenPaneCount():0,w=Math.min(v*60,2),y=a.waterLevel>0?1-S/a.waterLevel:0,z=Math.max(0,1-v*.02);for(let T=0;T<u.resolution;T+=1)for(let B=0;B<u.resolution;B+=1){const W=T*u.resolution+B;if(u.tankBaseMask[W])u.depthNext[W]=0,u.waveNext[W]=0;else if(B===0||T===0||B===u.resolution-1||T===u.resolution-1)u.depthNext[W]=u.depthCurrent[W]*.9,u.waveNext[W]=0;else{const L=W-1,K=W+1,E=W-u.resolution,$=W+u.resolution,D=(u.depthCurrent[L]+u.depthCurrent[K]+u.depthCurrent[E]+u.depthCurrent[$])/4,I=u.edgeDrain[W],C=Math.max(0,1-I*.18*w);u.depthNext[W]=N.clamp((u.depthCurrent[W]+(D-u.depthCurrent[W])*xr*w)*mr*z*C,0,u.maxDepth),u.waveNext[W]=((u.waveCurrent[L]+u.waveCurrent[K]+u.waveCurrent[E]+u.waveCurrent[$])*.5-u.wavePrev[W])*Sr*Math.max(.45,1-I*.22)}}if(x&&S>0){const T=S*a.spillThickness*.18*w,B=T*.7+y*.0025;he.forEach(W=>{e?.isPaneBroken(W)&&u.sourceIndicesByPane[W].forEach(L=>{u.tankBaseMask[L]||(u.depthNext[L]=Math.min(u.maxDepth,u.depthNext[L]+T),u.waveNext[L]+=B)})})}if(c.current&&(x||y>.01))if(c.current.getWorldQuaternion(dn),cn.set(0,1,0).applyQuaternion(dn).normalize(),c.current.getWorldPosition(un),pn.setFromCamera(o,r),pn.ray.intersectPlane(wr.setFromNormalAndCoplanarPoint(cn,un),hn))if(de.copy(hn),c.current.worldToLocal(de),Math.abs(de.x)<=u.domainWidth/2&&Math.abs(de.z)<=u.domainDepth/2&&!(Math.abs(de.x)<u.blockedHalfWidth&&Math.abs(de.z)<u.blockedHalfDepth)){const T=h.current;if(T){const B=T.distanceTo(de),W=Math.min(a.spillThickness*.8,B*a.waterDisturbance*3.2);W>5e-4&&fn(u.waveNext,u,de.x,de.z,W)}h.current=de.clone()}else h.current=null;else h.current=null;else h.current=null;if(c.current){const T=n.current;(i?.current??[]).forEach(B=>{if(!B)return;B.getWorldPosition(Ve);const W=T.get(B);if(!W){T.set(B,Ve.clone());return}if(ue.copy(Ve),c.current.worldToLocal(ue),Math.abs(ue.x)<=u.domainWidth/2&&Math.abs(ue.z)<=u.domainDepth/2&&Math.abs(ue.y)<=.28&&!(Math.abs(ue.x)<u.blockedHalfWidth&&Math.abs(ue.z)<u.blockedHalfDepth)){const L=Ve.distanceTo(W)/Math.max(v,.008333333333333333),K=Math.min(u.maxDepth*.85,L*65e-5),E=Math.min(u.maxDepth*.14,L*8e-5);K>4e-4&&fn(u.waveNext,u,ue.x,ue.z,K),E>15e-5&&Mr(u.depthNext,u,ue.x,ue.z,E)}W.copy(Ve)})}[u.depthCurrent,u.depthNext]=[u.depthNext,u.depthCurrent],[u.wavePrev,u.waveCurrent,u.waveNext]=[u.waveCurrent,u.waveNext,u.wavePrev];const k=u.positionAttr.array;let F=0;for(let T=0;T<u.vertexCount;T+=1){const B=u.depthCurrent[T],W=u.waveCurrent[T]*Math.min(1,B/Math.max(u.maxDepth,1e-4));k[T*3+1]=u.basePositions[T*3+1]+(u.tankBaseMask[T]?0:B+W),F=Math.max(F,B+Math.max(W,0))}u.positionAttr.needsUpdate=!0,u.geometry.computeVertexNormals(),c.current&&(c.current.visible=F>8e-4)}),d?null:m.jsx("mesh",{ref:c,geometry:u.geometry,position:[t.position[0],p.topY+.002,t.position[2]],receiveShadow:!0,visible:!1,children:m.jsx("meshPhysicalMaterial",{clearcoat:.45,color:a.waterColor,opacity:a.spillOpacity,roughness:.08,side:Nt,thickness:.35,transmission:.18,transparent:!0})})}const xt=pe(([i,e,t,a,r,s])=>{const n=i.sub(e).div(t.sub(e)),l=a.add(n.mul(r.sub(a)));return we(s,Ht(qn(l,r),a),l)}),Cr=Ei(`
    fn voronoi3d(x: vec3<f32>, smoothness: f32, randomness: f32) -> f32
    {
        let p = floor(x);
        let f = fract(x);

        var res = 0.0;
        var totalWeight = 0.0;
        
        for (var k = -1; k <= 1; k++)
        {
            for (var j = -1; j <= 1; j++)
            {
                for (var i = -1; i <= 1; i++)
                {
                    let b = vec3<f32>(f32(i), f32(j), f32(k));
                    let hashOffset = hash3d(p + b) * randomness;
                    let r = b - f + hashOffset;
                    let d = length(r);
                    
                    let weight = exp(-d * d / max(smoothness * smoothness, 0.001));
                    res += d * weight;
                    totalWeight += weight;
                }
            }
        }
        
        if (totalWeight > 0.0)
        {
            res /= totalWeight;
        }
        
        return smoothstep(0.0, 1.0, res);
    }

    fn hash3d(p: vec3<f32>) -> vec3<f32>
    {
        var p3 = fract(p * vec3<f32>(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.xxy + p3.yzz) * p3.zyx);
    }
`),gn=pe(([i,e,t])=>{const a=q(1).sub(i),r=Me(1),s=r.sub(r.sub(t).mul(r.sub(e)));return a.mul(e).add(i.mul(r.sub(e).mul(t).mul(e).add(e.mul(s))))}),$n=pe(([i,e,t,a,r])=>{const s=q(1).toVar(),n=q(1).toVar(),l=q(0).toVar(),o=q(0).toVar(),c=e.floor();Zn(c,()=>{const u=yt(i.mul(s));o.addAssign(u.mul(n)),l.addAssign(n),n.mulAssign(t),s.mulAssign(a)});const h=e.sub(c),d=h.greaterThan(.001);return we(d,we(r.equal(1),(()=>{const u=yt(i.mul(s)),p=o.add(u.mul(n)),f=l.add(n),v=o.div(l).mul(.5).add(.5),b=p.div(f).mul(.5).add(.5);return Ye(v,b,h)})(),(()=>{const u=yt(i.mul(s)),p=o.add(u.mul(n));return Ye(o,p,h)})()),we(r.equal(1),o.div(l).mul(.5).add(.5),o))}),Dr=pe(([i,e,t,a,r])=>{const s=q(1).toVar(),n=q(1).toVar(),l=q(0).toVar(),o=Me(0).toVar(),c=e.floor();Zn(c,()=>{const u=bt(i.mul(s));o.addAssign(u.mul(n)),l.addAssign(n),n.mulAssign(t),s.mulAssign(a)});const h=e.sub(c),d=h.greaterThan(.001);return we(d,we(r.equal(1),(()=>{const u=bt(i.mul(s)),p=o.add(u.mul(n)),f=l.add(n),v=o.div(l).mul(.5).add(.5),b=p.div(f).mul(.5).add(.5);return Ye(v,b,h)})(),(()=>{const u=bt(i.mul(s)),p=o.add(u.mul(n));return Ye(o,p,h)})()),we(r.equal(1),o.div(l).mul(.5).add(.5),o))}),Wr=pe(([i,e])=>{const t=i.mul(Me(1,1,0)).length();return xt(t,0,1,0,e,!0)}),ut=pe(([i,e,t,a])=>{const r=Me(t,t,a).mul(i),s=Dr(r.mul(1.6*1.5),q(1),q(.5),q(2),Xn(1)).sub(.5).mul(e),n=i.mul(Me(1,1,0)),l=n.normalize();return s.mul(l).add(n)}),Rr=pe(([i,e,t,a,r,s])=>{const n=$n(i.mul(r),q(1),q(.5),q(1),Xn(1)).mul(a).add(i).mul(e).fract().mul(s),l=qn(xt(n,0,t,0,1,gt(!0)),xt(n,t,1,1,0,gt(!0))),o=Ht(Yn.length().div(10),1);return Gi(o.negate(),o,l.sub(.5)).mul(.5).add(.5)}),Br=pe(([i,e,t,a])=>{const r=_i(Li(i.y,i.x).div(sn).add(.5),0,1).mul(sn.mul(3)),s=Me(r.sin(),t,r.cos().mul(e.z)),n=Me(.1,1.19,.05).mul(s);return $n(n.mul(a),q(1),q(.5),q(2),gt(!0))}),Ir=pe(([i,e,t])=>{const a=ut(i.mul(e.div(50)),e.div(1e3),.1,1.77),r=Cr(a.xy.mul(75),.5,1);return xt(r,t,t.add(.21),0,1,gt(!0))}),Fr=pe(([i,e,t,a,r,s,n,l,o,c,h,d,u,p,f,v,b,S,x])=>{const w=Wr(i,e),y=ut(ut(i,w,t,a),r,s,.17),z=ut(y,n,l,.17),k=Rr(z.length(),q(1).div(o),c,h,d,u),F=Br(z,i,z.length(),p),T=Ir(y,v,b.div(Ht(Yn.length().mul(10),1))),B=Ye(S,x,k);return gn(f,gn(.407,B,T),F)}),Gr={teak:{transformationMatrix:new A().identity(),centerSize:1.11,largeWarpScale:.32,largeGrainStretch:.24,smallWarpStrength:.059,smallWarpScale:2,fineWarpStrength:.006,fineWarpScale:32.8,ringThickness:1/34,ringBias:.03,ringSizeVariance:.03,ringVarianceScale:4.4,barkThickness:.3,splotchScale:.2,splotchIntensity:.541,cellScale:910,cellSize:.1,darkGrainColor:"#0c0504",lightGrainColor:"#926c50"},walnut:{transformationMatrix:new A().identity(),centerSize:1.07,largeWarpScale:.42,largeGrainStretch:.34,smallWarpStrength:.016,smallWarpScale:10.3,fineWarpStrength:.028,fineWarpScale:12.7,ringThickness:1/32,ringBias:.08,ringSizeVariance:.03,ringVarianceScale:5.5,barkThickness:.98,splotchScale:1.84,splotchIntensity:.97,cellScale:710,cellSize:.31,darkGrainColor:"#311e13",lightGrainColor:"#523424"},white_oak:{transformationMatrix:new A().identity(),centerSize:1.23,largeWarpScale:.21,largeGrainStretch:.21,smallWarpStrength:.034,smallWarpScale:2.44,fineWarpStrength:.01,fineWarpScale:14.3,ringThickness:1/34,ringBias:.82,ringSizeVariance:.16,ringVarianceScale:1.4,barkThickness:.7,splotchScale:.2,splotchIntensity:.541,cellScale:800,cellSize:.28,darkGrainColor:"#8b4c21",lightGrainColor:"#c57e43"},pine:{transformationMatrix:new A().identity(),centerSize:1.23,largeWarpScale:.21,largeGrainStretch:.18,smallWarpStrength:.041,smallWarpScale:2.44,fineWarpStrength:.006,fineWarpScale:23.2,ringThickness:1/24,ringBias:.1,ringSizeVariance:.07,ringVarianceScale:5,barkThickness:.35,splotchScale:.51,splotchIntensity:3.32,cellScale:1480,cellSize:.07,darkGrainColor:"#c58355",lightGrainColor:"#d19d61"},poplar:{transformationMatrix:new A().identity(),centerSize:1.43,largeWarpScale:.33,largeGrainStretch:.18,smallWarpStrength:.04,smallWarpScale:4.3,fineWarpStrength:.004,fineWarpScale:33.6,ringThickness:1/37,ringBias:.07,ringSizeVariance:.03,ringVarianceScale:3.8,barkThickness:.3,splotchScale:1.92,splotchIntensity:.71,cellScale:830,cellSize:.04,darkGrainColor:"#716347",lightGrainColor:"#998966"},maple:{transformationMatrix:new A().identity(),centerSize:1.4,largeWarpScale:.38,largeGrainStretch:.25,smallWarpStrength:.067,smallWarpScale:2.5,fineWarpStrength:.005,fineWarpScale:33.6,ringThickness:1/35,ringBias:.1,ringSizeVariance:.07,ringVarianceScale:4.6,barkThickness:.61,splotchScale:.46,splotchIntensity:1.49,cellScale:800,cellSize:.03,darkGrainColor:"#b08969",lightGrainColor:"#bc9d7d"},red_oak:{transformationMatrix:new A().identity(),centerSize:1.21,largeWarpScale:.24,largeGrainStretch:.25,smallWarpStrength:.044,smallWarpScale:2.54,fineWarpStrength:.01,fineWarpScale:14.5,ringThickness:1/34,ringBias:.92,ringSizeVariance:.03,ringVarianceScale:5.6,barkThickness:1.01,splotchScale:.28,splotchIntensity:3.48,cellScale:800,cellSize:.25,darkGrainColor:"#af613b",lightGrainColor:"#e0a27a"},cherry:{transformationMatrix:new A().identity(),centerSize:1.33,largeWarpScale:.11,largeGrainStretch:.33,smallWarpStrength:.024,smallWarpScale:2.48,fineWarpStrength:.01,fineWarpScale:15.3,ringThickness:1/36,ringBias:.02,ringSizeVariance:.04,ringVarianceScale:6.5,barkThickness:.09,splotchScale:1.27,splotchIntensity:1.24,cellScale:1530,cellSize:.15,darkGrainColor:"#913f27",lightGrainColor:"#b45837"},cedar:{transformationMatrix:new A().identity(),centerSize:1.11,largeWarpScale:.39,largeGrainStretch:.12,smallWarpStrength:.061,smallWarpScale:1.9,fineWarpStrength:.006,fineWarpScale:4.8,ringThickness:1/25,ringBias:.01,ringSizeVariance:.07,ringVarianceScale:6.7,barkThickness:.1,splotchScale:.61,splotchIntensity:2.54,cellScale:630,cellSize:.19,darkGrainColor:"#9a5b49",lightGrainColor:"#ae745e"},mahogany:{transformationMatrix:new A().identity(),centerSize:1.25,largeWarpScale:.26,largeGrainStretch:.29,smallWarpStrength:.044,smallWarpScale:2.54,fineWarpStrength:.01,fineWarpScale:15.3,ringThickness:1/38,ringBias:.01,ringSizeVariance:.33,ringVarianceScale:1.2,barkThickness:.07,splotchScale:.77,splotchIntensity:1.39,cellScale:1400,cellSize:.23,darkGrainColor:"#501d12",lightGrainColor:"#6d3722"}},Qn=["teak","walnut","white_oak","pine","poplar","maple","red_oak","cherry","cedar","mahogany"],Jn=["raw","matte","semigloss","gloss"];function vt(i,e){const t=Gr[i];let a,r,s;switch(e){case"gloss":s=.2,r=.1,a=1;break;case"semigloss":s=.4,r=.4,a=1;break;case"matte":s=.6,r=1,a=1;break;default:s=1,r=0,a=0}return{...t,transformationMatrix:new A().copy(t.transformationMatrix),genus:i,finish:e,clearcoat:a,clearcoatRoughness:r,clearcoatDarken:s}}const V=vt(Qn[0],Jn[0]),R={};R.centerSize=U(V.centerSize).onObjectUpdate(({material:i})=>i.centerSize);R.largeWarpScale=U(V.largeWarpScale).onObjectUpdate(({material:i})=>i.largeWarpScale);R.largeGrainStretch=U(V.largeGrainStretch).onObjectUpdate(({material:i})=>i.largeGrainStretch);R.smallWarpStrength=U(V.smallWarpStrength).onObjectUpdate(({material:i})=>i.smallWarpStrength);R.smallWarpScale=U(V.smallWarpScale).onObjectUpdate(({material:i})=>i.smallWarpScale);R.fineWarpStrength=U(V.fineWarpStrength).onObjectUpdate(({material:i})=>i.fineWarpStrength);R.fineWarpScale=U(V.fineWarpScale).onObjectUpdate(({material:i})=>i.fineWarpScale);R.ringThickness=U(V.ringThickness).onObjectUpdate(({material:i})=>i.ringThickness);R.ringBias=U(V.ringBias).onObjectUpdate(({material:i})=>i.ringBias);R.ringSizeVariance=U(V.ringSizeVariance).onObjectUpdate(({material:i})=>i.ringSizeVariance);R.ringVarianceScale=U(V.ringVarianceScale).onObjectUpdate(({material:i})=>i.ringVarianceScale);R.barkThickness=U(V.barkThickness).onObjectUpdate(({material:i})=>i.barkThickness);R.splotchScale=U(V.splotchScale).onObjectUpdate(({material:i})=>i.splotchScale);R.splotchIntensity=U(V.splotchIntensity).onObjectUpdate(({material:i})=>i.splotchIntensity);R.cellScale=U(V.cellScale).onObjectUpdate(({material:i})=>i.cellScale);R.cellSize=U(V.cellSize).onObjectUpdate(({material:i})=>i.cellSize);R.darkGrainColor=U(new Ee(V.darkGrainColor)).onObjectUpdate(({material:i},e)=>e.value.set(i.darkGrainColor));R.lightGrainColor=U(new Ee(V.lightGrainColor)).onObjectUpdate(({material:i},e)=>e.value.set(i.lightGrainColor));R.transformationMatrix=U(new A().copy(V.transformationMatrix)).onObjectUpdate(({material:i})=>i.transformationMatrix);const _r=Fr(R.transformationMatrix.mul(Ii(Fi,1)).xyz,R.centerSize,R.largeWarpScale,R.largeGrainStretch,R.smallWarpStrength,R.smallWarpScale,R.fineWarpStrength,R.fineWarpScale,R.ringThickness,R.ringBias,R.ringSizeVariance,R.ringVarianceScale,R.barkThickness,R.splotchScale,R.splotchIntensity,R.cellScale,R.cellSize,R.darkGrainColor,R.lightGrainColor).mul(V.clearcoatDarken);class Xt extends xi{static get type(){return"WoodNodeMaterial"}constructor(e={}){super(),this.isWoodNodeMaterial=!0;const a={...vt("teak","raw"),...e};for(const r in a)r==="genus"||r==="finish"||(typeof a[r]=="string"?this[r]=new Ee(a[r]):this[r]=a[r]);this.colorNode=_r,this.clearcoatNode=a.clearcoat,this.clearcoatRoughness=a.clearcoatRoughness}static fromPreset(e="teak",t="raw"){const a=vt(e,t);return new Xt(a)}}const Lr=1e-4,qt="matte",Zt="white_oak",Er=[...Jn],Or=[...Qn],ei=Object.freeze([0,0,0]),ti=Object.freeze([0,0,0]),ni=Object.freeze([1,1,1]),mn=new Ut;function xn(i){return`#${new Ee(i).getHexString()}`}function Mt(i,e){return Array.isArray(i)?i.map((t,a)=>Number.isFinite(t)?t:e[a]):e}function Ar({dimensions:i,grainOffset:e,grainRotation:t,grainScale:a}){const[r,s,n]=i.map(y=>Math.max(Math.abs(y)||0,Lr)),[l,o,c]=Mt(e,ei),[h,d,u]=Mt(t,ti),[p,f,v]=Mt(a,ni),b=new A,S=new A,x=new A,w=new A;return mn.set(N.degToRad(h),N.degToRad(d),N.degToRad(u)),b.makeTranslation(l,o,c),S.makeRotationFromEuler(mn),x.makeScale(p/r,f/s,v/n),w.multiplyMatrices(b,S),w.multiply(x),w}function ii(i=Zt,e=qt){const t=vt(i,e);return{barkThickness:t.barkThickness,cellScale:t.cellScale,cellSize:t.cellSize,centerSize:t.centerSize,clearcoat:t.clearcoat,clearcoatRoughness:t.clearcoatRoughness,darkGrainColor:xn(t.darkGrainColor),fineWarpScale:t.fineWarpScale,fineWarpStrength:t.fineWarpStrength,largeGrainStretch:t.largeGrainStretch,largeWarpScale:t.largeWarpScale,lightGrainColor:xn(t.lightGrainColor),ringBias:t.ringBias,ringSizeVariance:t.ringSizeVariance,ringThickness:t.ringThickness,ringVarianceScale:t.ringVarianceScale,smallWarpScale:t.smallWarpScale,smallWarpStrength:t.smallWarpStrength,splotchIntensity:t.splotchIntensity,splotchScale:t.splotchScale}}function vn({barkThickness:i,cellScale:e,cellSize:t,centerSize:a,clearcoat:r,clearcoatRoughness:s,darkGrainColor:n,dimensions:l=[1,1,1],fallbackColor:o="#bca88c",fineWarpScale:c,fineWarpStrength:h,grainOffset:d=ei,grainRotation:u=ti,grainScale:p=ni,largeGrainStretch:f,largeWarpScale:v,lightGrainColor:b,metalness:S=0,ringBias:x,ringSizeVariance:w,ringThickness:y,ringVarianceScale:z,roughness:k=.78,smallWarpScale:F,smallWarpStrength:T,splotchIntensity:B,splotchScale:W}){const L=be($=>$.gl),K=L?.backend?.isWebGPUBackend===!0&&!!L?.backend?.device&&!!L?.backend?.context&&typeof navigator<"u"&&!!navigator.gpu,E=g.useMemo(()=>{if(!K)return null;const $=new Xt({barkThickness:i,cellScale:e,cellSize:t,centerSize:a,clearcoat:r,clearcoatRoughness:s,darkGrainColor:n,fineWarpScale:c,fineWarpStrength:h,largeGrainStretch:f,largeWarpScale:v,lightGrainColor:b,ringBias:x,ringSizeVariance:w,ringThickness:y,ringVarianceScale:z,smallWarpScale:F,smallWarpStrength:T,splotchIntensity:B,splotchScale:W,transformationMatrix:Ar({dimensions:l,grainOffset:d,grainRotation:u,grainScale:p})});return $.metalness=S,$.roughness=k,$},[i,e,t,a,r,s,n,l,c,h,d,u,p,f,v,b,S,x,w,y,z,k,F,T,B,W,K]);return g.useEffect(()=>()=>{E?.dispose()},[E]),!K||!E?m.jsx("meshStandardMaterial",{color:o,metalness:S,roughness:k}):m.jsx("primitive",{attach:"material",object:E})}function Vr({collisionMeshesRef:i,table:e,tank:t}){const a=g.useMemo(()=>Yt(t,e),[e.depth,e.legs?.depth,e.legs?.inset,e.legs?.width,e.position,e.thickness,e.width,t.depth,t.glassThickness,t.height,t.spillExtent,t.width]),r=g.useMemo(()=>({barkThickness:e.wood.barkThickness,cellScale:e.wood.cellScale,cellSize:e.wood.cellSize,centerSize:e.wood.centerSize,clearcoat:e.wood.clearcoat,clearcoatRoughness:e.wood.clearcoatRoughness,darkGrainColor:e.wood.darkGrainColor,fallbackColor:e.color,fineWarpScale:e.wood.fineWarpScale,fineWarpStrength:e.wood.fineWarpStrength,grainOffset:e.wood.grainOffset,grainRotation:e.wood.grainRotation,grainScale:e.wood.grainScale,largeGrainStretch:e.wood.largeGrainStretch,largeWarpScale:e.wood.largeWarpScale,lightGrainColor:e.wood.lightGrainColor,metalness:e.metalness,ringBias:e.wood.ringBias,ringSizeVariance:e.wood.ringSizeVariance,ringThickness:e.wood.ringThickness,ringVarianceScale:e.wood.ringVarianceScale,roughness:e.roughness,smallWarpScale:e.wood.smallWarpScale,smallWarpStrength:e.wood.smallWarpStrength,splotchIntensity:e.wood.splotchIntensity,splotchScale:e.wood.splotchScale}),[e.color,e.metalness,e.roughness,e.wood.barkThickness,e.wood.cellScale,e.wood.cellSize,e.wood.centerSize,e.wood.clearcoat,e.wood.clearcoatRoughness,e.wood.darkGrainColor,e.wood.fineWarpScale,e.wood.fineWarpStrength,e.wood.grainOffset,e.wood.grainRotation,e.wood.grainScale,e.wood.largeGrainStretch,e.wood.largeWarpScale,e.wood.lightGrainColor,e.wood.ringBias,e.wood.ringSizeVariance,e.wood.ringThickness,e.wood.ringVarianceScale,e.wood.smallWarpScale,e.wood.smallWarpStrength,e.wood.splotchIntensity,e.wood.splotchScale]);return m.jsxs(m.Fragment,{children:[m.jsxs($e,{type:"fixed",colliders:!1,children:[m.jsx(Ue,{args:a.topHalfExtents,position:a.topPosition,friction:1.25,restitution:.04}),a.legs.map(s=>m.jsx(Ue,{args:s.halfExtents,position:s.position,friction:1.22,restitution:.03},s.key)),a.edgeColliders.map(s=>m.jsx(Ue,{args:s.args,position:s.position,friction:1.28,restitution:.03},s.key))]}),m.jsxs("mesh",{ref:s=>{const n=i.current;if(n[0]=s,s){const l=s;l.userData={...l.userData,surfaceType:"table-top"}}},castShadow:!0,position:a.topPosition,receiveShadow:!0,children:[m.jsx("boxGeometry",{args:[a.width,a.thickness,a.depth]}),m.jsx(vn,{...r,dimensions:[a.width,a.thickness,a.depth]})]}),a.legs.map((s,n)=>m.jsxs("mesh",{ref:l=>{const o=i.current;if(o[n+1]=l,l){const c=l;c.userData={...c.userData,surfaceType:"table-leg"}}},castShadow:!0,position:s.position,receiveShadow:!0,children:[m.jsx("boxGeometry",{args:s.size}),m.jsx(vn,{...r,dimensions:s.size})]},s.key))]})}var Nr=Object.defineProperty,jr=(i,e,t)=>e in i?Nr(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t,P=(i,e,t)=>jr(i,typeof e!="symbol"?e+"":e,t);class Ur{constructor(){P(this,"textureScale"),P(this,"textureOffset"),this.textureScale=new j(1,1),this.textureOffset=new j}}class He{static generateUniform(e,t,a){const r=[],s=e.min,n=e.max,l=a?()=>a.random():()=>Math.random();for(let o=0;o<t;o++)r.push(new M(s.x+l()*(n.x-s.x),s.y+l()*(n.y-s.y),s.z+l()*(n.z-s.z)));return r}static generateImpactBased(e,t,a,r,s){const n=[],l=s?()=>s.random():()=>Math.random(),o=new M(Math.max(e.min.x,Math.min(e.max.x,a.x)),Math.max(e.min.y,Math.min(e.max.y,a.y)),Math.max(e.min.z,Math.min(e.max.z,a.z))),c=Math.floor(t*.6),h=t-c;for(let d=0;d<c;d++){const u=Math.pow(l(),2)*r,p=l()*2*Math.PI,f=Math.acos(2*l()-1),v=o.x+u*Math.sin(f)*Math.cos(p),b=o.y+u*Math.sin(f)*Math.sin(p),S=o.z+u*Math.cos(f);n.push(new M(Math.max(e.min.x,Math.min(e.max.x,v)),Math.max(e.min.y,Math.min(e.max.y,b)),Math.max(e.min.z,Math.min(e.max.z,S))))}return n.push(...this.generateUniform(e,h,s)),n}static generate2D(e,t,a,r){const s=[],n=e.min,l=e.max,o=new M((n.x+l.x)/2,(n.y+l.y)/2,(n.z+l.z)/2),c=r?()=>r.random():()=>Math.random();for(let h=0;h<t;h++){let d;a==="x"?d=new M(o.x,n.y+c()*(l.y-n.y),n.z+c()*(l.z-n.z)):a==="y"?d=new M(n.x+c()*(l.x-n.x),o.y,n.z+c()*(l.z-n.z)):d=new M(n.x+c()*(l.x-n.x),n.y+c()*(l.y-n.y),o.z),s.push(d)}return s}static generate2DImpactBased(e,t,a,r,s,n){const l=[],o=e.min,c=e.max,h=new M((o.x+c.x)/2,(o.y+c.y)/2,(o.z+c.z)/2),d=n?()=>n.random():()=>Math.random();let u;s==="x"?u=new M(h.x,a.y,a.z):s==="y"?u=new M(a.x,h.y,a.z):u=new M(a.x,a.y,h.z);const p=Math.floor(t*.6),f=t-p;for(let v=0;v<p;v++){const b=Math.pow(d(),2)*r,S=d()*2*Math.PI;let x;if(s==="x"){const w=u.y+b*Math.cos(S),y=u.z+b*Math.sin(S);x=new M(h.x,Math.max(o.y,Math.min(c.y,w)),Math.max(o.z,Math.min(c.z,y)))}else if(s==="y"){const w=u.x+b*Math.cos(S),y=u.z+b*Math.sin(S);x=new M(Math.max(o.x,Math.min(c.x,w)),h.y,Math.max(o.z,Math.min(c.z,y)))}else{const w=u.x+b*Math.cos(S),y=u.y+b*Math.sin(S);x=new M(Math.max(o.x,Math.min(c.x,w)),Math.max(o.y,Math.min(c.y,y)),h.z)}l.push(x)}return l.push(...this.generate2D(e,f,s,n)),l}static determineBestProjectionAxis(e){const t=new M(e.max.x-e.min.x,e.max.y-e.min.y,e.max.z-e.min.z);return t.x<=t.y&&t.x<=t.z?"x":t.y<=t.x&&t.y<=t.z?"y":"z"}}function ve(i,e,t,a){return Hr(i,e,t,a,!1)}function Hr(i,e,t,a,r){let s={x:e.x-i.x,y:e.y-i.y},n={x:a.x-t.x,y:a.y-t.y};const l=et(i),o=et(t);if(l===o)return r;const c=et(e);if(c===o)return r;const h=et(a);if(l===h||c===h)return r;let d=(i.x-t.x)*n.y-(i.y-t.y)*n.x,u=(e.x-t.x)*n.y-(e.y-t.y)*n.x,p=(t.x-i.x)*s.y-(t.y-i.y)*s.x,f=(a.x-i.x)*s.y-(a.y-i.y)*s.x;return(d>=0&&u<=0||d<=0&&u>=0)&&(p>=0&&f<=0||p<=0&&f>=0)}function Sn(i,e,t,a){let r=0,s=new M;return Fe(i)===Fe(e)||t.x===0&&t.y===0&&t.z===0?null:(r=((a.x-i.x)*t.x+(a.y-i.y)*t.y+(a.z-i.z)*t.z)/((e.x-i.x)*t.x+(e.y-i.y)*t.y+(e.z-i.z)*t.z),r>=0&&r<=1?(s=new M(i.x+(e.x-i.x)*r,i.y+(e.y-i.y)*r,i.z+(e.z-i.z)*r),{x:s,s:r}):null)}function Pt(i,e,t){return(e.x-i.x)*(t.y-i.y)-(e.y-i.y)*(t.x-i.x)<=0}function se(i,e){return Math.round(.5*((i+e)*(i+e+1))+e)}function et(i,e=1e-9){const t=1/e,a=Math.floor(i.x*t),r=Math.floor(i.y*t);return se(a,r)}function Fe(i,e=1e-9){const t=1/e,a=Math.floor(i.x*t),r=Math.floor(i.y*t),s=Math.floor(i.z*t),n=.5*((a+r)*(a+r+1))+r;return .5*((n+s)*(n+s+1))+s}function bn(i,e,t){return e.x*(i.x-t.x)+e.y*(i.y-t.y)+e.z*(i.z-t.z)>=0}class Pe{constructor(e=new M,t=new M,a=new j){P(this,"position"),P(this,"normal"),P(this,"uv"),this.position=e,this.normal=t,this.uv=a}equals(e){return Fe(this.position)===Fe(e.position)}clone(){return new Pe(this.position.clone(),this.normal.clone(),this.uv.clone())}toString(){return`Position = ${this.position.x}, ${this.position.y}, ${this.position.z}, Normal = ${this.normal.x}, ${this.normal.y}, ${this.normal.z}, UV = ${this.uv.x}, ${this.uv.y}`}}var Xe=(i=>(i[i.Default=0]="Default",i[i.CutFace=1]="CutFace",i))(Xe||{});class qe{constructor(e=void 0){if(P(this,"vertices"),P(this,"cutVertices"),P(this,"triangles"),P(this,"constraints"),P(this,"indexMap"),P(this,"bounds"),P(this,"vertexAdjacency"),this.vertices=[],this.cutVertices=[],this.triangles=[[],[]],this.constraints=[],this.indexMap=[],this.bounds=new Et,this.vertexAdjacency=[],!e)return;const{positions:t,normals:a,uvs:r,indices:s}=e;for(let n=0;n<t.length/3;n++){const l=new M(t[3*n],t[3*n+1],t[3*n+2]),o=new M(a[3*n],a[3*n+1],a[3*n+2]),c=r?new j(r[2*n],r[2*n+1]):new j(0,0);this.vertices.push(new Pe(l,o,c))}if(s)this.triangles=[Array.from(s),[]];else{const n=t.length/3;this.triangles=[Array.from({length:n},(l,o)=>o),[]]}this.calculateBounds()}get triangleCount(){return(this.triangles[0].length+this.triangles[1].length)/3}get vertexCount(){return this.vertices.length+this.cutVertices.length}addCutFaceVertex(e,t,a){const r=new Pe(e,t,a);this.vertices.push(r),this.cutVertices.push(r),this.vertexAdjacency.push(this.vertices.length-1)}addMappedVertex(e,t){this.vertices.push(e),this.indexMap[t]=this.vertices.length-1}addTriangle(e,t,a,r){this.triangles[r].push(e,t,a)}addMappedTriangle(e,t,a,r){this.triangles[r].push(this.indexMap[e],this.indexMap[t],this.indexMap[a])}weldCutFaceVertices(){const e=[],t=[],a=new Array(this.cutVertices.length);let r=0;const s=new Map;this.cutVertices.forEach((l,o)=>{const c=Fe(l.position);s.has(c)?a[o]=s.get(c):(a[o]=r,s.set(c,r),e.push(this.cutVertices[o]),t.push(this.vertexAdjacency[o]),r++)});const n=[];for(let l=0;l<this.constraints.length;l++){const o=this.constraints[l];o.v1=a[o.v1],o.v2=a[o.v2],!(Math.abs(o.v1-o.v2)<1e-9)&&n.push(o)}this.constraints=n,this.cutVertices=e,this.vertexAdjacency=t}calculateBounds(){let e=this.vertices[0].position.clone(),t=e.clone();this.vertices.forEach(a=>{e.x=Math.min(e.x,a.position.x),e.y=Math.min(e.y,a.position.y),e.z=Math.min(e.z,a.position.z),t.x=Math.max(t.x,a.position.x),t.y=Math.max(t.y,a.position.y),t.z=Math.max(t.z,a.position.z)}),this.bounds=new Et(e,t)}}class ce{constructor(e,t,a,r,s){P(this,"v1"),P(this,"v2"),P(this,"t1"),P(this,"t2"),P(this,"t1Edge"),this.v1=e,this.v2=t,this.t1=a??-1,this.t2=r??-1,this.t1Edge=s??0}equals(e){return this.v1===e.v1&&this.v2===e.v2||this.v1===e.v2&&this.v2===e.v1}clone(){return new ce(this.v1,this.v2,this.t1,this.t2,this.t1Edge)}toString(){return`Edge: T${this.t1}->T${this.t2} (V${this.v1}->V${this.v2})`}}class tt{constructor(e,t){P(this,"coords"),P(this,"bin"),P(this,"index"),this.index=e,this.coords=t,this.bin=0}toString(){return`${this.coords} -> ${this.bin}`}}class yn{static getBinNumber(e,t,a){return e%2===0?e*a+t:(e+1)*a-t-1}static sort(e,t,a){if(a<=1)return e;t>e.length&&(t=e.length);const r=new Array(a).fill(0),s=new Array(e.length);for(let n=0;n<t;n++)r[e[n].bin]++;for(let n=1;n<a;n++)r[n]+=r[n-1];for(let n=t-1;n>=0;n--){const l=e[n].bin;r[l]--,s[r[l]]=e[n]}for(let n=t;n<s.length;n++)s[n]=e[n];return s}}const J=0,ee=1,te=2,oe=3,Z=4,ne=5,ke=0,ge=-1;class ri{constructor(e,t){if(P(this,"N"),P(this,"triangleCount"),P(this,"triangulation"),P(this,"points"),P(this,"skipTriangle"),P(this,"normal"),P(this,"normalizationScaleFactor",1),this.N=e.length,this.N>=3){this.triangleCount=2*this.N+1,this.triangulation=Array.from({length:this.triangleCount},()=>new Array(6).fill(0)),this.skipTriangle=new Array(this.triangleCount).fill(!1),this.points=new Array(this.N+3),this.normal=t.clone().normalize();let s=e[0].position.clone().sub(e[1].position).normalize(),n=this.normal.clone(),l=new M;l.crossVectors(s,n).normalize();for(let o=0;o<this.N;o++){var a=e[o].position,r=new j(a.dot(s),a.dot(l));this.points[o]=new tt(o,r)}}else this.triangleCount=0,this.triangulation=[],this.skipTriangle=[],this.points=[],this.normal=new M}triangulate(){if(this.N<3)return[];this.addSuperTriangle(),this.normalizeCoordinates(),this.computeTriangulation(),this.discardTrianglesWithSuperTriangleVertices();const e=[];for(let t=0;t<this.triangleCount;t++)this.skipTriangle[t]||e.push(this.triangulation[t][J],this.triangulation[t][ee],this.triangulation[t][te]);return e}normalizeCoordinates(){let e=Number.MAX_VALUE,t=Number.MIN_VALUE,a=Number.MAX_VALUE,r=Number.MIN_VALUE;for(let o=0;o<this.N;o++)e=Math.min(e,this.points[o].coords.x),t=Math.max(t,this.points[o].coords.x),a=Math.min(a,this.points[o].coords.y),r=Math.max(r,this.points[o].coords.y);const s=Math.max(t-e,r-a);for(let o=0;o<this.N;o++){var n=this.points[o],l=new j((n.coords.x-e)/s,(n.coords.y-a)/s);this.points[o].coords=l}}sortPointsIntoBins(){const e=Math.round(Math.pow(this.N,.25)),t=e*e;for(let r=0;r<this.N;r++){var a=this.points[r];const s=Math.floor(.99*e*a.coords.y),n=Math.floor(.99*e*a.coords.x);a.bin=yn.getBinNumber(s,n,e)}return yn.sort(this.points,this.N,t)}computeTriangulation(){let e=0,t=0,a=this.sortPointsIntoBins();for(let r=0;r<this.N;r++){let s=a[r],n=0,l=!1;for(;!l&&!(n++>t||e===ge);){let o=this.points[this.triangulation[e][J]].coords,c=this.points[this.triangulation[e][ee]].coords,h=this.points[this.triangulation[e][te]].coords;Pt(o,c,s.coords)?Pt(c,h,s.coords)?Pt(h,o,s.coords)?(this.insertPointIntoTriangle(s,e,t),t+=2,e=t,l=!0):e=this.triangulation[e][ne]:e=this.triangulation[e][Z]:e=this.triangulation[e][oe]}}}addSuperTriangle(){this.points[this.N]=new tt(this.N,new j(-100,-100)),this.points[this.N+1]=new tt(this.N+1,new j(0,100)),this.points[this.N+2]=new tt(this.N+2,new j(100,-100)),this.triangulation[ke][J]=this.N,this.triangulation[ke][ee]=this.N+1,this.triangulation[ke][te]=this.N+2,this.triangulation[ke][oe]=ge,this.triangulation[ke][Z]=ge,this.triangulation[ke][ne]=ge}insertPointIntoTriangle(e,t,a){const r=t,s=a+1,n=a+2;this.triangulation[s][J]=e.index,this.triangulation[s][ee]=this.triangulation[t][ee],this.triangulation[s][te]=this.triangulation[t][te],this.triangulation[s][oe]=n,this.triangulation[s][Z]=this.triangulation[t][Z],this.triangulation[s][ne]=r,this.triangulation[n][J]=e.index,this.triangulation[n][ee]=this.triangulation[t][J],this.triangulation[n][te]=this.triangulation[t][ee],this.triangulation[n][oe]=r,this.triangulation[n][Z]=this.triangulation[t][oe],this.triangulation[n][ne]=s,this.updateAdjacency(this.triangulation[t][oe],t,n),this.updateAdjacency(this.triangulation[t][Z],t,s),this.triangulation[r][ee]=this.triangulation[t][te],this.triangulation[r][te]=this.triangulation[t][J],this.triangulation[r][J]=e.index,this.triangulation[r][Z]=this.triangulation[t][ne],this.triangulation[r][oe]=s,this.triangulation[r][ne]=n,this.restoreDelauneyTriangulation(e,r,s,n)}restoreDelauneyTriangulation(e,t,a,r){const s=[];for(s.push([t,this.triangulation[t][Z]]),s.push([a,this.triangulation[a][Z]]),s.push([r,this.triangulation[r][Z]]);s.length>0;)if([t,a]=s.pop()??[ge,ge],a!=ge){const n=this.swapQuadDiagonalIfNeeded(e.index,t,a);n&&(s.push([t,n.t3]),s.push([a,n.t4]))}}swapQuadDiagonalIfNeeded(e,t,a){let r=0,s=0,n=0,l=e,o=0,c=0;return this.triangulation[a][oe]===t?(r=this.triangulation[a][ee],s=this.triangulation[a][J],n=this.triangulation[a][te],o=this.triangulation[a][Z],c=this.triangulation[a][ne]):this.triangulation[a][Z]===t?(r=this.triangulation[a][te],s=this.triangulation[a][ee],n=this.triangulation[a][J],o=this.triangulation[a][ne],c=this.triangulation[a][oe]):(r=this.triangulation[a][J],s=this.triangulation[a][te],n=this.triangulation[a][ee],o=this.triangulation[a][oe],c=this.triangulation[a][Z]),this.swapTest(this.points[r].coords,this.points[s].coords,this.points[n].coords,this.points[l].coords)?(this.updateAdjacency(o,a,t),this.updateAdjacency(this.triangulation[t][ne],t,a),this.triangulation[t][J]=l,this.triangulation[t][ee]=r,this.triangulation[t][te]=n,this.triangulation[a][J]=l,this.triangulation[a][ee]=n,this.triangulation[a][te]=s,this.triangulation[a][oe]=t,this.triangulation[a][Z]=c,this.triangulation[a][ne]=this.triangulation[t][ne],this.triangulation[t][Z]=o,this.triangulation[t][ne]=a,{t3:o,t4:c}):null}discardTrianglesWithSuperTriangleVertices(){for(let e=0;e<this.triangleCount;e++)(this.triangleContainsVertex(e,this.N)||this.triangleContainsVertex(e,this.N+1)||this.triangleContainsVertex(e,this.N+2))&&(this.skipTriangle[e]=!0)}swapTest(e,t,a,r){const s=e.x-a.x,n=t.x-a.x,l=e.y-a.y,o=t.y-a.y,c=e.x-r.x,h=t.x-r.x,d=e.y-r.y,u=t.y-r.y,p=s*n+l*o,f=h*c+u*d;if(p>=0&&f>=0)return!1;if(p<0&&f<0)return!0;{const v=s*o-n*l,b=h*d-c*u;return v*f+b*p<0}}triangleContainsVertex(e,t){return this.triangulation[e][J]===t||this.triangulation[e][ee]===t||this.triangulation[e][te]===t}updateAdjacency(e,t,a){if(e===ge)return;const r=this.findSharedEdge(e,t);r&&(this.triangulation[e][r]=a)}findSharedEdge(e,t){return e===ge?null:this.triangulation[e][oe]===t?oe:this.triangulation[e][Z]===t?Z:this.triangulation[e][ne]===t?ne:null}}class Yr{constructor(e,t,a,r,s,n,l,o,c,h){P(this,"q1"),P(this,"q2"),P(this,"q3"),P(this,"q4"),P(this,"t1"),P(this,"t2"),P(this,"t1L"),P(this,"t1R"),P(this,"t2L"),P(this,"t2R"),this.q1=e,this.q2=t,this.q3=a,this.q4=r,this.t1=s,this.t2=n,this.t1L=l,this.t1R=o,this.t2L=c,this.t2R=h}toString(){return`T${this.t1}/T${this.t2} (V${this.q1},V${this.q2},V${this.q3},V${this.q4})`}}const H=0,Y=1,X=2,le=3,ie=4,re=5,nt=-1;class Xr extends ri{constructor(e,t,a){super(e,a),P(this,"edgeVertex1",[0,0,0,H,Y,X]),P(this,"edgeVertex2",[0,0,0,Y,X,H]),P(this,"oppositePoint",[0,0,0,X,H,Y]),P(this,"nextEdge",[0,0,0,ie,re,le]),P(this,"previousEdge",[0,0,0,re,le,ie]),P(this,"constraints"),P(this,"vertexTriangles"),this.constraints=t,this.vertexTriangles=[]}triangulate(){if(this.N<3)return[];this.addSuperTriangle(),this.normalizeCoordinates(),this.computeTriangulation(),this.constraints.length>0&&(this.applyConstraints(),this.discardTrianglesViolatingConstraints()),this.discardTrianglesWithSuperTriangleVertices();let e=[];for(let t=0;t<this.triangleCount;t++)this.skipTriangle[t]||(e.push(this.triangulation[t][H]),e.push(this.triangulation[t][Y]),e.push(this.triangulation[t][X]));return e}applyConstraints(){this.vertexTriangles=new Array(this.N+3).fill(0);for(let e=0;e<this.triangulation.length;e++)this.vertexTriangles[this.triangulation[e][H]]=e,this.vertexTriangles[this.triangulation[e][Y]]=e,this.vertexTriangles[this.triangulation[e][X]]=e;for(let e of this.constraints){if(e.v1===e.v2)continue;const t=this.findIntersectingEdges(e,this.vertexTriangles);this.removeIntersectingEdges(e,t)}}findIntersectingEdges(e,t){const a=[],r=this.findStartingEdge(t,e);if(r)a.push(r);else return a;let s=r.t1,n=r.t1Edge,l=s,o=!1;for(;!o;){l=s,s=this.triangulation[s][n];const c=this.points[e.v1].coords,h=this.points[e.v2].coords,d=this.points[this.triangulation[s][H]].coords,u=this.points[this.triangulation[s][Y]].coords,p=this.points[this.triangulation[s][X]].coords;if(this.triangleContainsVertex(s,e.v2))o=!0;else if(this.triangulation[s][le]!==l&&ve(c,h,d,u)){n=le;const f=new ce(this.triangulation[s][H],this.triangulation[s][Y],s,this.triangulation[s][le],n);a.push(f)}else if(this.triangulation[s][ie]!==l&&ve(c,h,u,p)){n=ie;const f=new ce(this.triangulation[s][Y],this.triangulation[s][X],s,this.triangulation[s][ie],n);a.push(f)}else if(this.triangulation[s][re]!==l&&ve(c,h,p,d)){n=re;const f=new ce(this.triangulation[s][X],this.triangulation[s][H],s,this.triangulation[s][re],n);a.push(f)}else{console.warn("Failed to find final triangle, exiting early.");break}}return a}findStartingEdge(e,t){let a=new ce(-1,-1),r=t.v1,s=e[r],n=!1,l=null,o,c,h;const d=new Array(this.triangulation.length);for(;!l&&!n;){if(d[s]=!0,this.triangleContainsConstraint(s,t))return null;if(l=this.edgeConstraintIntersectsTriangle(s,t),l)break;if(o=this.triangulation[s][le],c=this.triangulation[s][ie],h=this.triangulation[s][re],o!==nt&&!d[o]&&this.triangleContainsVertex(o,r))s=o;else if(c!==nt&&!d[c]&&this.triangleContainsVertex(c,r))s=c;else if(h!==nt&&!d[h]&&this.triangleContainsVertex(h,r))s=h;else{n=!0;break}}if(l){const u=this.triangulation[s][this.edgeVertex1[l]],p=this.triangulation[s][this.edgeVertex2[l]],f=this.triangulation[s][l];return a=new ce(u,p,s,f,l),a}return null}removeIntersectingEdges(e,t){let a=[],r,s=0;for(;t.length>0&&s<=t.length;){r=t.shift();let n=this.findQuadFromSharedEdge(r.t1,r.t1Edge);if(n)if(ve(this.points[n.q4].coords,this.points[n.q3].coords,this.points[n.q1].coords,this.points[n.q2].coords)){this.swapQuadDiagonal(n,t,a,this.constraints);let l=new ce(n.q3,n.q4,n.t1,n.t2,re);ve(this.points[e.v1].coords,this.points[e.v2].coords,this.points[n.q3].coords,this.points[n.q4].coords)?t.push(l):(s=0,a.push(l))}else t.push(r);s++}a.length>0&&this.restoreConstrainedDelauneyTriangulation(e,a)}restoreConstrainedDelauneyTriangulation(e,t){let a=!0;for(;a;){a=!1;for(let r=0;r<t.length;r++){const s=t[r];if(s.equals(e))continue;let n=this.findQuadFromSharedEdge(s.t1,s.t1Edge);if(n&&this.swapTest(this.points[n.q1].coords,this.points[n.q2].coords,this.points[n.q3].coords,this.points[n.q4].coords)){this.swapQuadDiagonal(n,t,this.constraints,null);const l=n.q3,o=n.q4;t[r]=new ce(l,o,n.t1,n.t2,re),a=!0}}}}discardTrianglesViolatingConstraints(){this.skipTriangle.fill(!0);let e=new Set;for(let p=0;p<this.constraints.length;p++){const f=this.constraints[p];e.add(se(f.v1,f.v2))}let t=[],a,r,s,n,l,o,c,h,d;const u=new Array(this.triangulation.length);for(let p=0;p<this.triangleCount;p++)if(!u[p]&&(a=this.triangulation[p][H],r=this.triangulation[p][Y],s=this.triangulation[p][X],n=e.has(se(a,r)),l=e.has(se(r,s)),o=e.has(se(s,a)),c=e.has(se(r,a)),h=e.has(se(s,r)),d=e.has(se(a,s)),!(c||h||d)&&(n||l||o)))for(this.skipTriangle[p]=!1,t=[],n||t.push(this.triangulation[p][le]),l||t.push(this.triangulation[p][ie]),o||t.push(this.triangulation[p][re]);t.length>0;){const f=t.shift();if(!(f===void 0||f===nt||u[f])){if(a=this.triangulation[f][H],r=this.triangulation[f][Y],s=this.triangulation[f][X],c=e.has(se(r,a)),h=e.has(se(s,r)),d=e.has(se(a,s)),c||h||d){u[f]=!0;continue}this.skipTriangle[f]=!1,u[f]=!0,e.has(se(a,r))||t.push(this.triangulation[f][le]),e.has(se(r,s))||t.push(this.triangulation[f][ie]),e.has(se(s,a))||t.push(this.triangulation[f][re])}}}triangleContainsConstraint(e,t){return e>=this.triangulation.length?!1:(this.triangulation[e][H]===t.v1||this.triangulation[e][Y]===t.v1||this.triangulation[e][X]===t.v1)&&(this.triangulation[e][H]===t.v2||this.triangulation[e][Y]===t.v2||this.triangulation[e][X]===t.v2)}edgeConstraintIntersectsTriangle(e,t){const a=this.points[t.v1].coords,r=this.points[t.v2].coords,s=this.points[this.triangulation[e][H]].coords,n=this.points[this.triangulation[e][Y]].coords,l=this.points[this.triangulation[e][X]].coords;return ve(a,r,s,n)?le:ve(a,r,n,l)?ie:ve(a,r,l,s)?re:null}findQuadFromSharedEdge(e,t){let a,r,s,n,l,o,c,h,d=this.triangulation[e][t],u=this.findSharedEdge(d,e);return u?(u===le?(r=this.triangulation[d][H],a=this.triangulation[d][Y],s=this.triangulation[d][X]):u===ie?(r=this.triangulation[d][Y],a=this.triangulation[d][X],s=this.triangulation[d][H]):(r=this.triangulation[d][X],a=this.triangulation[d][H],s=this.triangulation[d][Y]),n=this.triangulation[e][this.oppositePoint[t]],l=this.triangulation[e][this.previousEdge[t]],o=this.triangulation[e][this.nextEdge[t]],c=this.triangulation[d][this.nextEdge[u]],h=this.triangulation[d][this.previousEdge[u]],new Yr(a,r,s,n,e,d,l,o,c,h)):null}swapQuadDiagonal(e,t,a,r){const s=e.t1,n=e.t2,l=e.t1R,o=e.t1L,c=e.t2R,h=e.t2L;this.triangulation[s][H]=e.q4,this.triangulation[s][Y]=e.q1,this.triangulation[s][X]=e.q3,this.triangulation[n][H]=e.q4,this.triangulation[n][Y]=e.q3,this.triangulation[n][X]=e.q2,this.triangulation[s][le]=o,this.triangulation[s][ie]=h,this.triangulation[s][re]=n,this.triangulation[n][le]=s,this.triangulation[n][ie]=c,this.triangulation[n][re]=l,this.updateAdjacency(h,n,s),this.updateAdjacency(l,s,n),this.updateEdgesAfterSwap(t,s,n,o,l,h,c),this.updateEdgesAfterSwap(a,s,n,o,l,h,c),this.updateEdgesAfterSwap(r,s,n,o,l,h,c),this.vertexTriangles[e.q1]=s,this.vertexTriangles[e.q2]=n}updateEdgesAfterSwap(e,t,a,r,s,n,l){if(e)for(let o of e)o.t1===t&&o.t2===s?(o.t1=a,o.t2=s,o.t1Edge=re):o.t1===t&&o.t2===r?o.t1Edge=le:o.t1===s&&o.t2===t?o.t2=a:o.t1===r&&o.t2===t||(o.t1===a&&o.t2===l?o.t1Edge=ie:o.t1===a&&o.t2===n?(o.t1=t,o.t2=n,o.t1Edge=ie):o.t1===l&&o.t2===a||o.t1===n&&o.t2===a&&(o.t2=t))}}function Kt(i,e,t,a,r,s=!1){const n=new qe,l=new qe,o=new Array(i.vertexCount).fill(!1);for(let h=0;h<i.vertices.length;h++){const d=i.vertices[h];o[h]=bn(d.position,e,t),(o[h]?n:l).addMappedVertex(d,h)}const c=i.vertices.length;for(let h=0;h<i.cutVertices.length;h++){const d=i.cutVertices[h];o[h+c]=bn(d.position,e,t),(o[h+c]?n:l).addMappedVertex(d,h+c)}return wn(i,n,l,e,t,o,Xe.Default),wn(i,n,l,e,t,o,Xe.CutFace),qr(n,l,e.clone().negate(),a,r,s),{topSlice:n,bottomSlice:l}}function qr(i,e,t,a,r,s){if(i.weldCutFaceVertices(),e.weldCutFaceVertices(),i.cutVertices.length<3)return;const n=s?new ri(i.cutVertices,t):new Xr(i.cutVertices,i.constraints,t),l=n.triangulate();for(let u=0;u<i.cutVertices.length;u++){var o=i.cutVertices[u],c=n.points[u];const p=new j(n.normalizationScaleFactor*c.coords.x*a.x+r.x,n.normalizationScaleFactor*c.coords.y*a.y+r.y),f=new Pe(o.position.clone(),t.clone(),p.clone()),v=new Pe(o.position.clone(),t.clone().negate(),p.clone());i.cutVertices[u]=f,e.cutVertices[u]=v}let h=i.vertices.length,d=e.vertices.length;for(let u=0;u<l.length;u+=3)i.addTriangle(h+l[u],h+l[u+1],h+l[u+2],Xe.CutFace),e.addTriangle(d+l[u],d+l[u+2],d+l[u+1],Xe.CutFace)}function wn(i,e,t,a,r,s,n){const l=i.triangles[n];let o,c,h;for(let d=0;d<l.length;d+=3)o=l[d],c=l[d+1],h=l[d+2],s[o]&&s[c]&&s[h]?e.addMappedTriangle(o,c,h,n):!s[o]&&!s[c]&&!s[h]?t.addMappedTriangle(o,c,h,n):s[c]&&s[h]&&!s[o]?ze(c,h,o,a,r,i,e,t,n,!0):s[h]&&s[o]&&!s[c]?ze(h,o,c,a,r,i,e,t,n,!0):s[o]&&s[c]&&!s[h]?ze(o,c,h,a,r,i,e,t,n,!0):!s[c]&&!s[h]&&s[o]?ze(c,h,o,a,r,i,e,t,n,!1):!s[h]&&!s[o]&&s[c]?ze(h,o,c,a,r,i,e,t,n,!1):!s[o]&&!s[c]&&s[h]&&ze(o,c,h,a,r,i,e,t,n,!1)}function ze(i,e,t,a,r,s,n,l,o,c){let h=i<s.vertices.length?s.vertices[i]:s.cutVertices[i-s.vertices.length],d=e<s.vertices.length?s.vertices[e]:s.cutVertices[e-s.vertices.length],u=t<s.vertices.length?s.vertices[t]:s.cutVertices[t-s.vertices.length];const p=Sn(h.position,u.position,a,r),f=Sn(d.position,u.position,a,r);if(p&&f){const v=new M(h.normal.x+p.s*(u.normal.x-h.normal.x),h.normal.y+p.s*(u.normal.y-h.normal.y),h.normal.z+p.s*(u.normal.z-h.normal.z)).normalize(),b=new M(d.normal.x+f.s*(u.normal.x-d.normal.x),d.normal.y+f.s*(u.normal.y-d.normal.y),d.normal.z+f.s*(u.normal.z-d.normal.z)).normalize(),S=new j(h.uv.x+p.s*(u.uv.x-h.uv.x),h.uv.y+p.s*(u.uv.y-h.uv.y)),x=new j(d.uv.x+f.s*(u.uv.x-d.uv.x),d.uv.y+f.s*(u.uv.y-d.uv.y));n.addCutFaceVertex(p.x,v,S),n.addCutFaceVertex(f.x,b,x),l.addCutFaceVertex(p.x,v,S),l.addCutFaceVertex(f.x,b,x);const w=n.vertices.length-2,y=n.vertices.length-1,z=l.vertices.length-2,k=l.vertices.length-1;c?(n.addTriangle(y,w,n.indexMap[e],o),n.addTriangle(w,n.indexMap[i],n.indexMap[e],o),l.addTriangle(l.indexMap[t],z,k,o),n.constraints.push(new ce(n.cutVertices.length-2,n.cutVertices.length-1)),l.constraints.push(new ce(l.cutVertices.length-1,l.cutVertices.length-2))):(n.addTriangle(w,y,n.indexMap[t],o),l.addTriangle(l.indexMap[i],l.indexMap[e],z,o),l.addTriangle(l.indexMap[e],k,z,o),n.constraints.push(new ce(n.cutVertices.length-1,n.cutVertices.length-2)),l.constraints.push(new ce(l.cutVertices.length-2,l.cutVertices.length-1)))}}function Zr(i,e){const t=new M((i.x+e.x)/2,(i.y+e.y)/2,(i.z+e.z)/2),a=new M(e.x-i.x,e.y-i.y,e.z-i.z).normalize();return{origin:t,normal:a}}function si(i,e,t,a,r,s,n){let l=i;const o=t[e],c=a||Kr(e,t.length);for(const h of c){const d=t[h],u=Zr(o,d),{bottomSlice:p}=Kt(l,u.normal,u.origin,r,s,n);if(l=p,l.vertexCount===0)return null}return l}function Kr(i,e){const t=[];for(let a=0;a<e;a++)a!==i&&t.push(a);return t}function ai(i,e,t){const a=e[i],r=[];for(let s=0;s<e.length;s++){if(s===i)continue;const n=e[s].x-a.x,l=e[s].y-a.y,o=e[s].z-a.z,c=Math.sqrt(n*n+l*l+o*o);r.push({index:s,distance:c})}return r.sort((s,n)=>s.distance-n.distance),r.slice(0,Math.min(t,r.length)).map(s=>s.index)}function $t(i){var e;const t=i.attributes.position.array,a=i.attributes.normal.array,r=(e=i.attributes.uv)==null?void 0:e.array,s=new qe;for(let l=0;l<t.length/3;l++){const o=new M(t[3*l],t[3*l+1],t[3*l+2]),c=new M(a[3*l],a[3*l+1],a[3*l+2]),h=r?new j(r[2*l],r[2*l+1]):new j(0,0);s.vertices.push(new Pe(o,c,h))}let n;if(i.index)n=Array.from(i.index.array);else{const l=t.length/3;n=Array.from({length:l},(o,c)=>c)}if(i.groups&&i.groups.length===2){const l=[],o=[];for(const c of i.groups){const h=c.materialIndex===0?l:o,d=c.start,u=d+c.count;for(let p=d;p<u;p++)h.push(n[p])}s.triangles=[l,o]}else s.triangles=[n,[]];return s.calculateBounds(),s}function Qt(i){const e=new Si,t=i.vertices.length+i.cutVertices.length,a=new Array(t*3),r=new Array(t*3),s=new Array(t*2);let n=0,l=0,o=0;for(const c of i.vertices)a[n++]=c.position.x,a[n++]=c.position.y,a[n++]=c.position.z,r[l++]=c.normal.x,r[l++]=c.normal.y,r[l++]=c.normal.z,s[o++]=c.uv.x,s[o++]=c.uv.y;for(const c of i.cutVertices)a[n++]=c.position.x,a[n++]=c.position.y,a[n++]=c.position.z,r[l++]=c.normal.x,r[l++]=c.normal.y,r[l++]=c.normal.z,s[o++]=c.uv.x,s[o++]=c.uv.y;return e.addGroup(0,i.triangles[0].length,0),e.addGroup(i.triangles[0].length,i.triangles[1].length,1),e.setAttribute("position",new Qe(new Float32Array(a),3)),e.setAttribute("normal",new Qe(new Float32Array(r),3)),e.setAttribute("uv",new Qe(new Float32Array(s),2)),e.setIndex(new Qe(new Uint32Array(i.triangles.flat()),1)),e}class $r{constructor(e){P(this,"parent"),P(this,"rank"),this.parent=new Array(e),this.rank=new Array(e);for(let t=0;t<e;t++)this.parent[t]=t,this.rank[t]=1}find(e){return this.parent[e]!==e&&(this.parent[e]=this.find(this.parent[e])),this.parent[e]}union(e,t){const a=this.find(e),r=this.find(t);a!==r&&(this.rank[a]>this.rank[r]?this.parent[r]=a:this.rank[a]<this.rank[r]?this.parent[a]=r:(this.parent[r]=a,this.rank[a]+=1))}}class oi{constructor(e){P(this,"seed"),P(this,"current"),this.seed=e!==void 0?e:Math.floor(Math.random()*2147483647),this.current=this.seed}getSeed(){return this.seed}random(){return this.current=(this.current*1664525+1013904223)%4294967296,this.current/4294967296}}function Qr(i,e){const t=new oi(e.seed),a=t.getSeed();e.seed===void 0&&(e.seed=a);const r=[i];for(;r.length<e.fragmentCount;){const s=r.shift();if(!s)continue;s.calculateBounds();const n=new M(e.fracturePlanes.x?2*t.random()-1:0,e.fracturePlanes.y?2*t.random()-1:0,e.fracturePlanes.z?2*t.random()-1:0).normalize(),l=new M;s.bounds.getCenter(l);const{topSlice:o,bottomSlice:c}=Kt(s,n,l,e.textureScale,e.textureOffset,!1),h=Ge(o),d=Ge(c);r.push(...h,...d)}return r}function Ge(i){const e=new $r(i.vertexCount),t={},a=i.vertices.length,r=i.cutVertices.length,s=new Map;i.vertices.forEach((c,h)=>{const d=Fe(c.position),u=s.get(d);u===void 0?s.set(d,h):e.union(u,h)});for(let c=0;c<r;c++)e.union(i.vertexAdjacency[c],c+a);const n=i.triangles;for(let c=0;c<n.length;c++)for(let h=0;h<n[c].length;h+=3){const d=n[c][h],u=n[c][h+1],p=n[c][h+2];e.union(d,u),e.union(u,p);const f=e.find(d);t[f]||(t[f]=[[],[]]),t[f][c].push(d,u,p)}const l={},o=Array(i.vertexCount);for(let c=0;c<a;c++){const h=e.find(c);l[h]||(l[h]=new qe),l[h].vertices.push(i.vertices[c]),o[c]=l[h].vertices.length-1}for(let c=0;c<r;c++){const h=e.find(c+a);l[h].cutVertices.push(i.cutVertices[c]),o[c+a]=l[h].vertices.length+l[h].cutVertices.length-1}for(const c of Object.keys(t)){let h=Number(c),d=e.parent[h];for(let u=0;u<i.triangles.length;u++)for(const p of t[h][u]){const f=o[p];l[d].triangles[u].push(f)}}return Object.values(l)}function Jr(i,e){const t=new oi(e.seed),a=t.getSeed();e.seed===void 0&&(e.seed=a);const r=$t(i);let s;return e.mode==="3D"?s=es(r,e,t):s=ts(r,e,t),s.map(n=>Qt(n))}function es(i,e,t){const a=ns(i,e,t),r=[],s=!1,n=e.useApproximation,l=Math.min(e.approximationNeighborCount,a.length-1);n&&console.warn(`⚠️ Voronoi approximation enabled (k=${l} neighbors). This may cause fragment overlaps.`,`
For accurate results with no overlaps, set useApproximation: false in VoronoiFractureOptions.`);for(let o=0;o<a.length;o++){const c=li(i),h=n?ai(o,a,l):null,d=si(c,o,a,h,e.textureScale,e.textureOffset,s);if(d&&d.vertexCount>0){const u=Ge(d);r.push(...u)}}return r}function ts(i,e,t){i.calculateBounds();let a;if(e.projectionNormal){const c=e.projectionNormal,h=Math.abs(c.x),d=Math.abs(c.y),u=Math.abs(c.z);h>d&&h>u?a="x":d>h&&d>u?a="y":a="z"}else{const c=e.projectionAxis||"auto";c==="auto"?a=He.determineBestProjectionAxis(i.bounds):a=c}let r;if(e.seedPoints)r=e.seedPoints;else if(e.impactPoint){const c=e.impactRadius||Math.min(i.bounds.max.x-i.bounds.min.x,i.bounds.max.y-i.bounds.min.y,i.bounds.max.z-i.bounds.min.z)*.3;r=He.generate2DImpactBased(i.bounds,e.fragmentCount,e.impactPoint,c,a,t)}else r=He.generate2D(i.bounds,e.fragmentCount,a,t);const s=[],n=!1,l=e.useApproximation,o=Math.min(e.approximationNeighborCount,r.length-1);l&&console.warn(`⚠️ Voronoi 2.5D approximation enabled (k=${o} neighbors). This may cause fragment overlaps.`,`
For accurate results with no overlaps, set useApproximation: false in VoronoiFractureOptions.`);for(let c=0;c<r.length;c++){const h=li(i),d=l?ai(c,r,o):null,u=si(h,c,r,d,e.textureScale,e.textureOffset,n);if(u&&u.vertexCount>0){const p=Ge(u);s.push(...p)}}return s}function ns(i,e,t){if(e.seedPoints&&e.seedPoints.length>0)return e.seedPoints;if(i.bounds||i.calculateBounds(),e.impactPoint){const a=e.impactRadius||Math.min(i.bounds.max.x-i.bounds.min.x,i.bounds.max.y-i.bounds.min.y,i.bounds.max.z-i.bounds.min.z)*.3;return He.generateImpactBased(i.bounds,e.fragmentCount,e.impactPoint,a,t)}else return He.generateUniform(i.bounds,e.fragmentCount,t)}function li(i){const e=new qe;return e.vertices=i.vertices.map(t=>t.clone()),e.cutVertices=i.cutVertices.map(t=>t.clone()),e.triangles=i.triangles.map(t=>[...t]),e.constraints=i.constraints.map(t=>t.clone()),e.vertexAdjacency=[...i.vertexAdjacency],e.indexMap={...i.indexMap},i.bounds&&(e.bounds=i.bounds.clone()),e}function is(i,e){return Qr($t(i),e).map(t=>Qt(t))}function rs(i,e,t,a,r){const s=$t(i),{topSlice:n,bottomSlice:l}=Kt(s,e,t,a,r),o=Ge(n),c=Ge(l);return[...o,...c].map(h=>Qt(h))}class Jt extends vi{constructor(e,t,a){super(e,t),P(this,"_outsideMaterial"),P(this,"_insideMaterial"),this._outsideMaterial=t,this._insideMaterial=a}createFragment(e){const t=new Jt(e,this._outsideMaterial,this._insideMaterial);return this._outsideMaterial&&this._insideMaterial?t.material=[this._outsideMaterial,this._insideMaterial]:this._outsideMaterial&&(t.material=this._outsideMaterial),t.castShadow=this.castShadow,t.receiveShadow=this.receiveShadow,t.matrixAutoUpdate=this.matrixAutoUpdate,t.frustumCulled=this.frustumCulled,t.renderOrder=this.renderOrder,t}fracture(e,t,a){if(!this.geometry)throw new Error("DestructibleMesh has no geometry to fracture");let r;try{if(e.fractureMethod==="voronoi"){if(!e.voronoiOptions)throw new Error("voronoiOptions is required when fractureMethod is 'voronoi'");const n={fragmentCount:e.fragmentCount,mode:e.voronoiOptions.mode,seedPoints:e.voronoiOptions.seedPoints,impactPoint:e.voronoiOptions.impactPoint,impactRadius:e.voronoiOptions.impactRadius,projectionAxis:e.voronoiOptions.projectionAxis||"auto",projectionNormal:e.voronoiOptions.projectionNormal,useApproximation:e.voronoiOptions.useApproximation||!1,approximationNeighborCount:e.voronoiOptions.approximationNeighborCount||12,textureScale:e.textureScale,textureOffset:e.textureOffset,seed:e.seed};r=Jr(this.geometry,n)}else r=is(this.geometry,e)}catch(n){throw console.error("Fracture operation failed:",n),n}const s=r.map((n,l)=>{n.computeBoundingBox();const o=new M;n.boundingBox.getCenter(o),n.translate(-o.x,-o.y,-o.z),n.computeBoundingSphere();const c=this.createFragment(n),h=o.clone().applyMatrix4(this.matrixWorld);return c.position.copy(h),c.quaternion.copy(this.quaternion),c.scale.copy(this.scale),t&&t(c,l),c});return a&&a(),s}slice(e,t,a,r,s){if(!this.geometry)throw new Error("DestructibleMesh has no geometry to slice");const n=a||new Ur,l=rs(this.geometry,e,t,n.textureScale,n.textureOffset).map((o,c)=>{const h=this.createFragment(o);return h.position.copy(this.position),h.quaternion.copy(this.quaternion),h.scale.copy(this.scale),r&&r(h,c),h});return s&&s(),l}sliceWorld(e,t,a,r,s){this.updateMatrixWorld(!0);const n=new A().copy(this.matrixWorld).invert(),l=e.clone().transformDirection(n).normalize(),o=t.clone().applyMatrix4(n);return this.slice(l,o,a,r,s)}dispose(){this.geometry&&this.geometry.dispose(),this.material&&(Array.isArray(this.material)?this.material.forEach(e=>e.dispose()):this.material.dispose())}}class ss{constructor({fractureMethod:e,fragmentCount:t,voronoiOptions:a,fracturePlanes:r,textureScale:s,textureOffset:n,seed:l}={}){P(this,"fractureMethod","voronoi"),P(this,"fragmentCount",50),P(this,"voronoiOptions"),P(this,"fracturePlanes",{x:!0,y:!0,z:!0}),P(this,"textureScale",new j(1,1)),P(this,"textureOffset",new j),P(this,"seed"),e!==void 0&&(this.fractureMethod=e),t!==void 0&&(this.fragmentCount=t),a!==void 0&&(this.voronoiOptions=a),r!==void 0&&(this.fracturePlanes=r),s!==void 0&&(this.textureScale=s),n!==void 0&&(this.textureOffset=n),l!==void 0&&(this.seed=l),this.fractureMethod==="voronoi"&&!this.voronoiOptions&&(this.voronoiOptions={mode:"3D"})}}const Tt=1.35,as=18,At=[0,as,8,4],os=.95,ls=.85,cs=.025,us=.1,kt=8,hs=1.4,ds=0,ps=1,zt=.002,fs=.08,Mn=6e-4,it=new M,rt=new M,st=new M,me=new M,Pn=new M,Tn=new Ke,gs=new M,kn=new M,zn=new Ke,at=new Ut,Cn=new M,Dn=new Ke,ot=new M,ms=Object.freeze([1,1,1]),xs=Object.freeze([0,0,0]),vs=Object.freeze([0,0,0]),Wn=ki(ps,[ds]),Ss=Le.memo(function({fragment:e,fragmentObjectsRef:t,fragmentHandlesRef:a,onImpact:r,paneKey:s}){const n=g.useRef(null),l=t?.current??null;return g.useEffect(()=>()=>{e.mesh.geometry?.dispose?.()},[e.mesh]),g.useEffect(()=>{const o=n.current;o&&(o.setLinvel(e.linearVelocity,!0),o.setAngvel(e.angularVelocity,!0),o.wakeUp?.())},[e.angularVelocity,e.linearVelocity]),g.useEffect(()=>{const{mesh:o}=e,c=a.current;return c[e.key]={body:n.current,generation:e.generation,mesh:o},o.userData={...o.userData,fragmentKey:e.key,paneKey:s,surfaceType:"tank-pane-fragment",onProjectileImpact:r},l&&(l[e.key]=o),()=>{delete c[e.key],l&&delete l[e.key],delete o.userData.fragmentKey,delete o.userData.onProjectileImpact,delete o.userData.paneKey,delete o.userData.surfaceType}},[e.generation,e.key,e.mesh,a,l,r,s]),m.jsxs($e,{ref:n,colliders:!1,position:e.position,rotation:e.rotation,friction:os,restitution:us,mass:cs,linearDamping:ls,angularDamping:hs,canSleep:!0,ccd:!0,children:[m.jsx(Ue,{args:e.colliderArgs,collisionGroups:Wn,position:e.colliderPosition,solverGroups:Wn}),m.jsx("primitive",{object:e.mesh,position:vs,rotation:xs,scale:e.scale??ms})]})});function bs(i){return At[Math.min(i,At.length-1)]}function ys(i,e,t){return i.worldToLocal(kn.copy(t)),i.getWorldQuaternion(Tn),e.getWorldQuaternion(Dn),zn.copy(Tn).invert().multiply(Dn),at.setFromQuaternion(zn),{position:kn.toArray(),rotation:[at.x,at.y,at.z],scale:e.scale.toArray()}}function ws(i){i.computeBoundingBox(),i.boundingBox?.getSize(it);const e=[{axis:"x",size:it.x},{axis:"y",size:it.y},{axis:"z",size:it.z}].sort((t,a)=>t.size-a.size);return{impactRadius:Math.max(Math.min(e[1].size,e[2].size)*.18,fs),projectionAxis:e[0].axis}}function Ms(i,e){const{geometry:t}=i,a=Math.abs(e?.[0]??1),r=Math.abs(e?.[1]??1),s=Math.abs(e?.[2]??1);return t.computeBoundingBox(),t.boundingBox?.getCenter(rt),t.boundingBox?.getSize(st),{colliderArgs:[Math.max(st.x*a*.5,zt),Math.max(st.y*r*.5,zt),Math.max(st.z*s*.5,zt)],colliderPosition:[rt.x*a,rt.y*r,rt.z*s]}}function Ps(i){i.position.set(0,0,0),i.rotation.set(0,0,0),i.scale.set(1,1,1),i.updateMatrix(),i.updateMatrixWorld(!0)}function Ts({assetGroup:i,fallbackWorldPoint:e,fragmentMesh:t,generation:a,impactWorldPoint:r,inheritedAngularVelocity:s,inheritedLinearVelocity:n,sourceMesh:l}){const o=t;o.castShadow=!0,o.receiveShadow=!0,o.updateWorldMatrix(!0,!1),o.getWorldPosition(ot),me.copy(ot).sub(r),me.lengthSq()<=Mn&&me.copy(ot).sub(e),me.lengthSq()<=Mn&&me.set(N.randFloatSpread(.2),1,N.randFloatSpread(.2)),me.normalize();const c=ys(i,l,ot),h=Ms(o,c.scale);return Ps(o),{angularVelocity:{x:(s?.x??0)+N.randFloatSpread(kt),y:(s?.y??0)+N.randFloatSpread(kt),z:(s?.z??0)+N.randFloatSpread(kt)},generation:a,key:o.uuid,linearVelocity:{x:(n?.x??0)+me.x*Tt*N.randFloat(.75,1.35),y:(n?.y??0)+me.y*Tt*N.randFloat(.75,1.35)+N.randFloat(.25,.6),z:(n?.z??0)+me.z*Tt*N.randFloat(.75,1.35)},mesh:o,colliderArgs:h.colliderArgs,colliderPosition:h.colliderPosition,position:c.position,rotation:c.rotation,scale:c.scale}}function ks({assetGroupRef:i,fragmentObjectsRef:e,geometry:t,material:a,paneKey:r,paneProps:s,runtime:n,tank:l}){const o=g.useRef({}),c=g.useRef(0),h=g.useRef([]),[d,u]=g.useState([]),p=g.useMemo(()=>a.clone(),[a]),f=g.useMemo(()=>{const x=a.clone();return x.color&&x.color.offsetHSL(0,0,.08),typeof x.opacity=="number"&&(x.opacity=Math.min(l.glassOpacity+.22,.5),x.transparent=!0),typeof x.roughness=="number"&&(x.roughness=Math.min(x.roughness+.16,1)),typeof x.metalness=="number"&&(x.metalness=.02),x.side=Nt,x},[a,l.glassOpacity]),v=g.useMemo(()=>{const x=new Jt(t.clone(),p,f);return x.castShadow=!0,x.receiveShadow=!0,x},[t,f,p]);g.useEffect(()=>{const x=s?.ref;return x?.(v),()=>{x?.(null),v.geometry?.dispose?.(),p.dispose(),f.dispose()}},[v,f,p,s]);const b=Le.useCallback(({inheritedAngularVelocity:x=null,inheritedLinearVelocity:w=null,sourceGeneration:y,sourceMesh:z,worldPoint:k})=>{const F=i.current;if(!F)return[];const T=y+1;if(T>=At.length)return[];z.updateWorldMatrix(!0,!1),z.getWorldPosition(Cn);const B=Array.isArray(k)?Pn.fromArray(k):Pn.copy(k),W=z.worldToLocal(gs.copy(B)),L=ws(z.geometry);return z.fracture(new ss({fractureMethod:"voronoi",fragmentCount:bs(T),seed:(c.current+T)*101+r.length,voronoiOptions:{impactPoint:W,impactRadius:L.impactRadius,mode:"2.5D",projectionAxis:L.projectionAxis}})).map(E=>Ts({assetGroup:F,fallbackWorldPoint:Cn,fragmentMesh:E,generation:T,impactWorldPoint:B,inheritedAngularVelocity:x,inheritedLinearVelocity:w,sourceMesh:z}))},[i,r]),S=g.useMemo(()=>(x,w)=>{const y=o.current[x];if(!y?.mesh)return;const z=b({inheritedAngularVelocity:y.body?.angvel?.()??null,inheritedLinearVelocity:y.body?.linvel?.()??null,sourceGeneration:y.generation,sourceMesh:y.mesh,worldPoint:w});z.length&&(y.mesh.visible=!1,u(k=>{const F=k.filter(T=>T.key!==x).concat(z);return h.current=F,F}))},[b]);return ye(()=>{const x=n?.getPaneBreakEvent(r),w=x?.id??0,y=n?.isPaneBroken(r)??!1;if(!y&&(c.current||h.current.length)&&(c.current=0,h.current=[],o.current={},u([])),y&&w>c.current&&x?.worldPoint){c.current=w;const z=b({sourceGeneration:0,sourceMesh:v,worldPoint:x.worldPoint});h.current=z,u(z)}v.visible=!y}),m.jsxs(m.Fragment,{children:[m.jsx("primitive",{object:v}),d.map(x=>m.jsx(Ss,{fragment:x,fragmentObjectsRef:e,fragmentHandlesRef:o,onImpact:w=>S(x.key,w),paneKey:r},x.key))]})}g.createContext();const zs=["Object","Object1","Object2","Object3","Object4","Object5","Object6","Object7"],Cs=["Object_4","Object_10","Object_12","Object_20","Object_22","Object_32","Object_34","Object_36"],ht=zs.length;function Ds({variant:i=0,...e}){const{nodes:t}=Oe(_e("/rocks.glb")),a=(i%ht+ht)%ht,r=t[Cs[a]];return r?m.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:r.geometry,material:r.material,...e}):null}Oe.preload(_e("/rocks.glb"));const dt=1e-4,Ws=Ie-12,Rs=.32,Bs=-60,pt=18,Is=.9,Fs=1.8,Gs=1.15,_s=1.15,Ls=.26,Es=.08,Os=.14,Ct=new M,Se=new M,Rn=new M,Dt=new jt,Ce=new M,Bn=new M,lt=new M;function As(){return{active:!1,paneBroken:!1,previousWorldPosition:new M}}function ci(i){return[(i-(pt-1)/2)*Rs,Bs,0]}function Vs(i,e,t){if(!i.length)return null;Ct.copy(t).sub(e);const a=Ct.length();return a<=dt?null:(Dt.set(e,Ct.normalize()),Dt.far=a+Os,Dt.intersectObjects(i,!1)[0]??null)}function ui(i,e){if(!i)return;const t=i;t.userData={...t.userData,isActiveThrowable:e}}function ft(i,e){if(!i)return;const t=i,[a,r,s]=ci(e);t.setTranslation({x:a,y:r,z:s},!0),t.setRotation({x:0,y:0,z:0,w:1},!0),t.setLinvel({x:0,y:0,z:0},!0),t.setAngvel({x:0,y:0,z:0},!0),ui(t,!1),t.sleep?.()}const Ns=Le.memo(function({bodyRefs:e,fluidObjectsRef:t,meshRefs:a,parkedPosition:r,rocks:s,slotIndex:n,variant:l}){const o=e.current,c=t?.current??null,h=a.current;return m.jsx($e,{ref:d=>{if(o[n]=d,d&&!d.userData?.pooledRockInitialized){const u=d;ft(u,n),u.userData={...u.userData,pooledRockInitialized:!0}}},angularDamping:Fs,canSleep:!0,ccd:!0,colliders:"hull",friction:Gs,linearDamping:_s,mass:Ls,position:r,restitution:Es,children:m.jsx("group",{ref:d=>{h[n]=d,c&&(c[n]=d)},children:m.jsx(Ds,{scale:s.scale,variant:l})})})}),hi=Le.forwardRef(function({collisionObjectsRef:e,fluidObjectsRef:t,onImpact:a,rocks:r,runtime:s},n){const{camera:l}=be(),o=g.useRef([]),c=g.useRef(Array.from({length:pt},As)),h=g.useRef(s?.getResetNonce?.()??0),d=g.useRef(null),u=g.useRef([]),p=g.useRef(0),f=g.useMemo(()=>Array.from({length:pt},(v,b)=>({parkedPosition:ci(b),slotId:`tank-rock-body-${b}`,variant:b%ht})),[]);return g.useImperativeHandle(n,()=>({launch({targetWorldPoint:v}){if(!d.current)return!1;const b=p.current,S=o.current[b],x=c.current[b];if(p.current=(b+1)%pt,!S||(l.getWorldDirection(Se),Ce.copy(l.position).addScaledVector(Se,Is),Bn.copy(v),Se.copy(Bn).sub(Ce),Se.lengthSq()<=dt))return!1;ft(S,b),S.setTranslation({x:Ce.x,y:Ce.y,z:Ce.z},!0);const w=new Ut(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI),y=new Ke().setFromEuler(w);return S.setRotation({x:y.x,y:y.y,z:y.z,w:y.w},!0),Se.normalize().multiplyScalar(r.speed),S.setLinvel({x:Se.x,y:Se.y,z:Se.z},!0),S.setAngvel({x:N.randFloatSpread(r.spin),y:N.randFloatSpread(r.spin),z:N.randFloatSpread(r.spin)},!0),ui(S,!0),S.wakeUp?.(),x.active=!0,x.paneBroken=!1,x.previousWorldPosition.copy(Ce),!0}}),[l,r.speed,r.spin]),ye(()=>{const v=s?.getResetNonce?.()??0;v!==h.current&&(h.current=v,p.current=0,o.current.forEach((b,S)=>{ft(b,S),c.current[S].active=!1,c.current[S].paneBroken=!1})),o.current.forEach((b,S)=>{const x=u.current[S],w=c.current[S];if(!(!b||!x||!w.active)){if(x.getWorldPosition(lt),!w.paneBroken&&lt.distanceToSquared(w.previousWorldPosition)>dt*dt){const y=Vs(e?.current??[],w.previousWorldPosition,lt),z=y?.object?.userData?.onProjectileImpact??null,k=y?.object?.userData?.paneKey??null,F=y?.object?.userData?.surfaceType??null;F==="tank-pane"&&k&&!s?.isPaneBroken?.(k)?(y.object.worldToLocal(Rn.copy(y.point)),a?.(k,{localPoint:Rn.clone(),worldPoint:y.point.clone()}),w.paneBroken=!0):F==="tank-pane-fragment"&&typeof z=="function"&&(z(y.point.clone()),w.paneBroken=!0)}w.previousWorldPosition.copy(lt),b.translation().y<Ws&&(ft(b,S),w.active=!1,w.paneBroken=!1)}})}),m.jsx("group",{ref:d,children:f.map(({parkedPosition:v,slotId:b,variant:S},x)=>m.jsx(Ns,{bodyRefs:o,fluidObjectsRef:t,meshRefs:u,parkedPosition:v,rocks:r,slotIndex:x,variant:S},b))})});hi.displayName="RockProjectiles";const js=`struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) viewPosition: vec3f,
}

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) viewPosition: vec3f,
}

struct FragmentOutput {
    @location(0) depth: f32,
    @builtin(frag_depth) fragDepth: f32,
}

struct RenderUniforms {
    texelSize: vec2f,
    sphereSize: f32,
    _padding0: f32,
    projectionMatrix: mat4x4f,
    invProjectionMatrix: mat4x4f,
    viewMatrix: mat4x4f,
    invViewMatrix: mat4x4f,
    modelMatrix: mat4x4f,
}

struct PosVel {
    position: vec3f,
    v: vec3f,
}

@group(0) @binding(0) var<storage> particles: array<PosVel>;
@group(0) @binding(1) var<uniform> uniforms: RenderUniforms;

@vertex
fn vs(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    let corners = array(
        vec2f(0.5, 0.5),
        vec2f(0.5, -0.5),
        vec2f(-0.5, -0.5),
        vec2f(0.5, 0.5),
        vec2f(-0.5, -0.5),
        vec2f(-0.5, 0.5),
    );
    let corner = vec3f(corners[vertexIndex] * uniforms.sphereSize, 0.0);
    let localPosition = (uniforms.modelMatrix * vec4f(particles[instanceIndex].position, 1.0)).xyz;
    let viewPosition = (uniforms.viewMatrix * vec4f(localPosition, 1.0)).xyz;
    let outputPosition = uniforms.projectionMatrix * vec4f(viewPosition + corner, 1.0);

    return VertexOutput(outputPosition, corners[vertexIndex] + 0.5, viewPosition);
}

@fragment
fn fs(input: FragmentInput) -> FragmentOutput {
    var out: FragmentOutput;
    let normalXY = input.uv * 2.0 - 1.0;
    let r2 = dot(normalXY, normalXY);

    if (r2 > 1.0) {
        discard;
    }

    let normal = vec3f(normalXY, sqrt(1.0 - r2));
    let radius = uniforms.sphereSize * 0.5;
    let realViewPos = vec4f(input.viewPosition + normal * radius, 1.0);
    let clipSpacePos = uniforms.projectionMatrix * realViewPos;

    out.fragDepth = clipSpacePos.z / clipSpacePos.w;
    out.depth = realViewPos.z;

    return out;
}
`,Us=`@group(0) @binding(0) var textureSampler: sampler;
@group(0) @binding(1) var depthTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms: RenderUniforms;
@group(0) @binding(3) var thicknessTexture: texture_2d<f32>;
@group(0) @binding(4) var backgroundTexture: texture_2d<f32>;
@group(0) @binding(5) var<uniform> fluidParams: vec4f;
@group(0) @binding(6) var sceneDepthTexture: texture_depth_2d;

struct RenderUniforms {
    texelSize: vec2f,
    sphereSize: f32,
    _padding0: f32,
    projectionMatrix: mat4x4f,
    invProjectionMatrix: mat4x4f,
    viewMatrix: mat4x4f,
    invViewMatrix: mat4x4f,
    modelMatrix: mat4x4f,
}

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f,
}

fn clampDepthCoord(coord: vec2f) -> vec2u {
    let dims = vec2f(textureDimensions(depthTexture));

    return vec2u(clamp(coord, vec2f(0.0), dims - vec2f(1.0)));
}

fn clampSceneDepthCoord(coord: vec2f) -> vec2u {
    let dims = vec2f(textureDimensions(sceneDepthTexture));

    return vec2u(clamp(coord, vec2f(0.0), dims - vec2f(1.0)));
}

fn computeViewPosFromUVDepth(texCoord: vec2f, depth: f32) -> vec3f {
    var ndc = vec4f(texCoord.x * 2.0 - 1.0, 1.0 - texCoord.y * 2.0, 0.0, 1.0);

    ndc.z = -uniforms.projectionMatrix[2].z + uniforms.projectionMatrix[3].z / depth;
    ndc.w = 1.0;

    let eyePos = uniforms.invProjectionMatrix * ndc;

    return eyePos.xyz / eyePos.w;
}

fn computeViewPosFromSceneDepth(texCoord: vec2f, depth: f32) -> vec3f {
    let ndc = vec4f(texCoord.x * 2.0 - 1.0, 1.0 - texCoord.y * 2.0, depth, 1.0);
    let eyePos = uniforms.invProjectionMatrix * ndc;

    return eyePos.xyz / eyePos.w;
}

fn sampleDepth(coord: vec2f) -> f32 {
    return abs(textureLoad(depthTexture, clampDepthCoord(coord), 0).x);
}

fn sampleSceneDepth(coord: vec2f) -> f32 {
    return textureLoad(sceneDepthTexture, clampSceneDepthCoord(coord), 0);
}

fn sampleViewPos(uv: vec2f, iuv: vec2f) -> vec3f {
    return computeViewPosFromUVDepth(uv, sampleDepth(iuv));
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    let depth = sampleDepth(input.iuv);
    let sceneDepth = sampleSceneDepth(input.iuv);
    let background = textureSampleLevel(backgroundTexture, textureSampler, input.uv, 0.0).rgb;
    let thickness = max(textureSampleLevel(thicknessTexture, textureSampler, input.uv, 0.0).r, 0.0);

    if (depth >= 1e4) {
        return vec4f(background, 1.0);
    }

    if (sceneDepth < 0.999999) {
        let sceneSurfacePosView = computeViewPosFromSceneDepth(input.uv, sceneDepth);
        let sceneViewDepth = abs(sceneSurfacePosView.z);
        let occlusionBias = max(uniforms.sphereSize * 0.1, 0.01);

        if (sceneViewDepth + occlusionBias < depth) {
            return vec4f(background, 1.0);
        }
    }

    let surfacePosView = computeViewPosFromUVDepth(input.uv, depth);
    var ddx = sampleViewPos(
        input.uv + vec2f(uniforms.texelSize.x, 0.0),
        input.iuv + vec2f(1.0, 0.0)
    ) - surfacePosView;
    var ddy = sampleViewPos(
        input.uv + vec2f(0.0, uniforms.texelSize.y),
        input.iuv + vec2f(0.0, 1.0)
    ) - surfacePosView;
    let ddx2 = surfacePosView - sampleViewPos(
        input.uv - vec2f(uniforms.texelSize.x, 0.0),
        input.iuv - vec2f(1.0, 0.0)
    );
    let ddy2 = surfacePosView - sampleViewPos(
        input.uv - vec2f(0.0, uniforms.texelSize.y),
        input.iuv - vec2f(0.0, 1.0)
    );

    ddx = select(ddx, ddx2, abs(ddx.z) > abs(ddx2.z));
    ddy = select(ddy, ddy2, abs(ddy.z) > abs(ddy2.z));

    let normal = -normalize(cross(ddx, ddy));
    let viewDir = normalize(-surfacePosView);
    let refractionOffset = normal.xy * (0.022 + clamp(thickness * 0.18, 0.0, 0.04));
    let refractedUv = clamp(input.uv + refractionOffset, vec2f(0.0), vec2f(1.0));
    let refractedBackground = textureSampleLevel(backgroundTexture, textureSampler, refractedUv, 0.0).rgb;
    let absorption = exp(-fluidParams.a * thickness * (vec3f(1.0) - fluidParams.rgb));
    let refractedColor = refractedBackground * absorption + fluidParams.rgb * (1.0 - absorption) * 0.35;
    let fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 5.0);
    let lightDir = normalize(vec3f(-0.3, 0.65, 0.7));
    let specular = pow(max(dot(normal, lightDir), 0.0), 80.0) * 0.08;
    let reflectedColor = mix(refractedBackground, vec3f(1.0), 0.1);
    let finalColor = mix(refractedColor, reflectedColor, 0.18 + fresnel * 0.42) + specular;

    return vec4f(clamp(finalColor, vec3f(0.0), vec3f(1.0)), 1.0);
}
`,Hs=`struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f,
}

override screenWidth: f32;
override screenHeight: f32;

@vertex
fn vs(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var out: VertexOutput;
    let positions = array(
        vec2f(1.0, 1.0),
        vec2f(1.0, -1.0),
        vec2f(-1.0, -1.0),
        vec2f(1.0, 1.0),
        vec2f(-1.0, -1.0),
        vec2f(-1.0, 1.0),
    );
    let uvs = array(
        vec2f(1.0, 0.0),
        vec2f(1.0, 1.0),
        vec2f(0.0, 1.0),
        vec2f(1.0, 0.0),
        vec2f(0.0, 1.0),
        vec2f(0.0, 0.0),
    );

    out.position = vec4f(positions[vertexIndex], 0.0, 1.0);
    out.uv = uvs[vertexIndex];
    out.iuv = out.uv * vec2f(screenWidth, screenHeight);

    return out;
}
`,Ys=`@group(0) @binding(0) var textureSampler: sampler;
@group(0) @binding(1) var sourceTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms: FilterUniforms;
@group(0) @binding(3) var<uniform> filterSize: i32;

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f,
}

struct FilterUniforms {
    blurDir: vec2f,
}

override thicknessTextureWidth: f32;
override thicknessTextureHeight: f32;

fn clampCoord(coord: vec2f) -> vec2u {
    let dims = vec2f(textureDimensions(sourceTexture));

    return vec2u(clamp(coord, vec2f(0.0), dims - vec2f(1.0)));
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    let baseThickness = textureSample(sourceTexture, textureSampler, input.uv).r;

    if (baseThickness == 0.0) {
        return vec4f(0.0, 0.0, 0.0, 1.0);
    }

    let sigma = f32(filterSize) / 3.0;
    let sigmaSquareInv = 1.0 / (2.0 * sigma * sigma);
    let iuv = vec2f(thicknessTextureWidth, thicknessTextureHeight) * input.uv;
    var sum = baseThickness;
    var wsum = 1.0;

    for (var x = 1; x <= filterSize; x = x + 1) {
        let weight = exp(-f32(x * x) * sigmaSquareInv);
        let coords = vec2f(f32(x));
        let sampledLeft = textureLoad(sourceTexture, clampCoord(iuv - uniforms.blurDir * coords), 0).r;
        let sampledRight = textureLoad(sourceTexture, clampCoord(iuv + uniforms.blurDir * coords), 0).r;

        sum = sum + (sampledLeft + sampledRight) * weight;
        wsum = wsum + 2.0 * weight;
    }

    return vec4f(sum / wsum, 0.0, 0.0, 1.0);
}
`,Xs=`@group(0) @binding(1) var depthTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms: FilterUniforms;

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f,
}

struct FilterUniforms {
    blurDir: vec2f,
}

override projectedParticleConstant: f32;
override maxFilterSize: f32;
override blur2D: u32;

fn clampDepthCoord(coord: vec2f) -> vec2u {
    let dims = vec2f(textureDimensions(depthTexture));

    return vec2u(clamp(coord, vec2f(0.0), dims - vec2f(1.0)));
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    let depth = abs(textureLoad(depthTexture, clampDepthCoord(input.iuv), 0).r);

    if (depth >= 1e4) {
        return vec4f(vec3f(depth), 1.0);
    }

    let filterSize = min(i32(maxFilterSize), i32(ceil(projectedParticleConstant / depth)));
    let sigma = f32(filterSize) / 2.0;
    let sigmaSquareInv = 1.0 / (2.0 * sigma * sigma);
    let depthThreshold = 6.0;
    let higherDepthBound = depth + 1.8;
    var sum = depth;
    var wsum = 1.0;

    if (blur2D == 0u) {
        var depthThresholdLowX = depth - depthThreshold;
        var depthThresholdHighX = depth + depthThreshold;
        var depthThresholdLowY = depth - depthThreshold;
        var depthThresholdHighY = depth + depthThreshold;

        for (var r = 1; r <= filterSize; r = r + 1) {
            let gaussianWeight = exp(-f32(r * r) * sigmaSquareInv);
            var sampledDepthX = abs(textureLoad(depthTexture, clampDepthCoord(input.iuv - vec2f(f32(r)) * uniforms.blurDir), 0).r);
            var sampledDepthY = abs(textureLoad(depthTexture, clampDepthCoord(input.iuv + vec2f(f32(r)) * uniforms.blurDir), 0).r);
            var wx = gaussianWeight;
            var wy = gaussianWeight;

            if (sampledDepthX < depthThresholdLowX) {
                wx = 0.0;
            } else if (sampledDepthX > depthThresholdHighX) {
                sampledDepthX = higherDepthBound;
            } else {
                depthThresholdLowX = min(depthThresholdLowX, sampledDepthX - depthThreshold);
                depthThresholdHighX = max(depthThresholdHighX, sampledDepthX + depthThreshold);
            }

            if (sampledDepthY < depthThresholdLowY) {
                wy = 0.0;
            } else if (sampledDepthY > depthThresholdHighY) {
                sampledDepthY = higherDepthBound;
            } else {
                depthThresholdLowY = min(depthThresholdLowY, sampledDepthY - depthThreshold);
                depthThresholdHighY = max(depthThresholdHighY, sampledDepthY + depthThreshold);
            }

            sum = sum + sampledDepthX * wx + sampledDepthY * wy;
            wsum = wsum + wx + wy;
        }
    } else {
        let filterSize2D = 2;
        var depthThresholdLow = depth - depthThreshold;
        var depthThresholdHigh = depth + depthThreshold;

        for (var r = 1; r <= filterSize2D; r = r + 1) {
            for (var i = 0; i < 2 * r; i = i + 1) {
                let gaussianWeight = exp((-f32(r * r) + f32((r - i) * (r - i))) * sigmaSquareInv);
                var depths = vec4f(
                    abs(textureLoad(depthTexture, clampDepthCoord(input.iuv - vec2f(f32(r), f32(r - i))), 0).r),
                    abs(textureLoad(depthTexture, clampDepthCoord(input.iuv + vec2f(f32(r), f32(r - i))), 0).r),
                    abs(textureLoad(depthTexture, clampDepthCoord(input.iuv - vec2f(f32(r - i), f32(r))), 0).r),
                    abs(textureLoad(depthTexture, clampDepthCoord(input.iuv + vec2f(f32(r - i), f32(r))), 0).r)
                );
                var weights = vec4f(gaussianWeight);

                for (var sampleIndex = 0; sampleIndex < 4; sampleIndex = sampleIndex + 1) {
                    if (depths[sampleIndex] < depthThresholdLow) {
                        weights[sampleIndex] = 0.0;
                    } else if (depths[sampleIndex] > depthThresholdHigh) {
                        depths[sampleIndex] = higherDepthBound;
                    } else {
                        depthThresholdLow = min(depthThresholdLow, depths[sampleIndex] - depthThreshold);
                        depthThresholdHigh = max(depthThresholdHigh, depths[sampleIndex] + depthThreshold);
                    }
                }

                sum = sum + dot(depths, weights);
                wsum = wsum + dot(weights, vec4f(1.0));
            }
        }
    }

    return vec4f(sum / wsum, 0.0, 0.0, 1.0);
}
`,qs=`struct RenderUniforms {
    texelSize: vec2f,
    sphereSize: f32,
    _padding0: f32,
    projectionMatrix: mat4x4f,
    invProjectionMatrix: mat4x4f,
    viewMatrix: mat4x4f,
    invViewMatrix: mat4x4f,
    modelMatrix: mat4x4f,
}

struct PosVel {
    position: vec3f,
    v: vec3f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) speed: f32,
    @location(2) viewPosition: vec3f,
}

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) speed: f32,
    @location(2) viewPosition: vec3f,
}

struct FragmentOutput {
    @location(0) color: vec4f,
    @builtin(frag_depth) fragDepth: f32,
}

@group(0) @binding(0) var<storage> particles: array<PosVel>;
@group(0) @binding(1) var<uniform> uniforms: RenderUniforms;

@vertex
fn vs(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    let corners = array(
        vec2f(0.5, 0.5),
        vec2f(0.5, -0.5),
        vec2f(-0.5, -0.5),
        vec2f(0.5, 0.5),
        vec2f(-0.5, -0.5),
        vec2f(-0.5, 0.5),
    );
    let corner = vec3f(corners[vertexIndex] * uniforms.sphereSize, 0.0);
    let localPosition = (uniforms.modelMatrix * vec4f(particles[instanceIndex].position, 1.0)).xyz;
    let viewPosition = (uniforms.viewMatrix * vec4f(localPosition, 1.0)).xyz;
    let outputPosition = uniforms.projectionMatrix * vec4f(viewPosition + corner, 1.0);
    let speed = length(particles[instanceIndex].v);

    return VertexOutput(outputPosition, corners[vertexIndex] + 0.5, speed, viewPosition);
}

@fragment
fn fs(input: FragmentInput) -> FragmentOutput {
    var out: FragmentOutput;
    let normalXY = input.uv * 2.0 - 1.0;
    let r2 = dot(normalXY, normalXY);

    if (r2 > 1.0) {
        discard;
    }

    let normal = vec3f(normalXY, sqrt(1.0 - r2));
    let radius = uniforms.sphereSize * 0.5;
    let realViewPos = vec4f(input.viewPosition + normal * radius, 1.0);
    let clipSpacePos = uniforms.projectionMatrix * realViewPos;
    let speedTint = clamp(input.speed * 0.08, 0.0, 1.0);
    let slowColor = vec3f(0.28, 0.72, 1.0);
    let fastColor = vec3f(1.0, 0.92, 0.62);
    let color = mix(slowColor, fastColor, speedTint) * (0.45 + 0.55 * normal.z);

    out.fragDepth = clipSpacePos.z / clipSpacePos.w;
    out.color = vec4f(color, 1.0);

    return out;
}
`,Zs=`struct RenderUniforms {
    texelSize: vec2f,
    sphereSize: f32,
    _padding0: f32,
    projectionMatrix: mat4x4f,
    invProjectionMatrix: mat4x4f,
    viewMatrix: mat4x4f,
    invViewMatrix: mat4x4f,
    modelMatrix: mat4x4f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
}

struct FragmentInput {
    @location(0) uv: vec2f,
}

struct PosVel {
    position: vec3f,
    v: vec3f,
}

@group(0) @binding(0) var<storage> particles: array<PosVel>;
@group(0) @binding(1) var<uniform> uniforms: RenderUniforms;

@vertex
fn vs(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    let corners = array(
        vec2f(0.5, 0.5),
        vec2f(0.5, -0.5),
        vec2f(-0.5, -0.5),
        vec2f(0.5, 0.5),
        vec2f(-0.5, -0.5),
        vec2f(-0.5, 0.5),
    );
    let corner = vec3f(corners[vertexIndex] * uniforms.sphereSize, 0.0);
    let localPosition = (uniforms.modelMatrix * vec4f(particles[instanceIndex].position, 1.0)).xyz;
    let viewPosition = (uniforms.viewMatrix * vec4f(localPosition, 1.0)).xyz;
    let outputPosition = uniforms.projectionMatrix * vec4f(viewPosition + corner, 1.0);

    return VertexOutput(outputPosition, corners[vertexIndex] + 0.5);
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    let normalXY = input.uv * 2.0 - 1.0;
    let r2 = dot(normalXY, normalXY);

    if (r2 > 1.0) {
        discard;
    }

    let thickness = sqrt(1.0 - r2);

    return vec4f(vec3f(0.05 * thickness), 1.0);
}
`,Ks=16,In=8,$s=4,Fn=336;function Qs(i){return{invProjectionMatrix:new Float32Array(i,80,16),invViewMatrix:new Float32Array(i,208,16),modelMatrix:new Float32Array(i,272,16),projectionMatrix:new Float32Array(i,16,16),sphereSize:new Float32Array(i,8,2),texelSize:new Float32Array(i,0,2),viewMatrix:new Float32Array(i,144,16)}}class Js{constructor({device:e,format:t,particleDiameter:a,posvelBuffer:r,sceneDepthTexture:s,width:n,height:l,fovRadians:o}){this.device=e,this.format=t,this.particleDiameter=a,this.posvelBuffer=r,this.sceneDepthTexture=s,this.fovRadians=o,this.renderValues=new ArrayBuffer(Fn),this.renderViews=Qs(this.renderValues),this.renderUniformBuffer=e.createBuffer({label:"fish-tank-splash-render-uniforms",size:Fn,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.fluidParamsBuffer=e.createBuffer({label:"fish-tank-splash-fluid-params",size:Ks,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.filterXBuffer=e.createBuffer({label:"fish-tank-splash-filter-x",size:In,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.filterYBuffer=e.createBuffer({label:"fish-tank-splash-filter-y",size:In,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.thicknessFilterSizeBuffer=e.createBuffer({label:"fish-tank-splash-thickness-filter-size",size:$s,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.filterXBuffer,0,new Float32Array([1,0])),this.device.queue.writeBuffer(this.filterYBuffer,0,new Float32Array([0,1])),this.device.queue.writeBuffer(this.thicknessFilterSizeBuffer,0,new Int32Array([15])),this.fullScreenModule=e.createShaderModule({code:Hs}),this.depthMapModule=e.createShaderModule({code:js}),this.thicknessMapModule=e.createShaderModule({code:Zs}),this.depthFilterModule=e.createShaderModule({code:Xs}),this.gaussianModule=e.createShaderModule({code:Ys}),this.fluidModule=e.createShaderModule({code:Us}),this.sphereModule=e.createShaderModule({code:qs}),this.sceneDepthTextureView=s.createView({aspect:"depth-only"}),this.sampler=e.createSampler({magFilter:"linear",minFilter:"linear"}),this.resize(n,l)}createPipelines(){const e=Math.max(1,Math.round(this.width/2)),t=Math.max(1,Math.round(this.height/2)),a=12,r={screenHeight:this.height,screenWidth:this.width},s={maxFilterSize:50,projectedParticleConstant:a*this.particleDiameter*.05*(this.height/2)/Math.max(Math.tan(this.fovRadians/2),.001)};this.depthMapPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-depth-map",layout:"auto",vertex:{module:this.depthMapModule},fragment:{module:this.depthMapModule,targets:[{format:"r32float"}]},primitive:{topology:"triangle-list"},depthStencil:{depthCompare:"less",depthWriteEnabled:!0,format:"depth32float"}}),this.spherePipeline=this.device.createRenderPipeline({label:"fish-tank-splash-sphere",layout:"auto",vertex:{module:this.sphereModule},fragment:{module:this.sphereModule,targets:[{format:this.format}]},primitive:{topology:"triangle-list"},depthStencil:{depthCompare:"less",depthWriteEnabled:!0,format:"depth32float"}}),this.depthFilter1DPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-depth-filter-1d",layout:"auto",vertex:{module:this.fullScreenModule,constants:r},fragment:{module:this.depthFilterModule,constants:{...s,blur2D:0},targets:[{format:"r32float"}]},primitive:{topology:"triangle-list"}}),this.depthFilter2DPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-depth-filter-2d",layout:"auto",vertex:{module:this.fullScreenModule,constants:r},fragment:{module:this.depthFilterModule,constants:{...s,blur2D:1},targets:[{format:"r32float"}]},primitive:{topology:"triangle-list"}}),this.thicknessMapPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-thickness-map",layout:"auto",vertex:{module:this.thicknessMapModule},fragment:{module:this.thicknessMapModule,targets:[{blend:{alpha:{dstFactor:"one",operation:"add",srcFactor:"one"},color:{dstFactor:"one",operation:"add",srcFactor:"one"}},format:"r16float",writeMask:GPUColorWrite.RED}]},primitive:{topology:"triangle-list"}}),this.thicknessFilterPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-thickness-filter",layout:"auto",vertex:{module:this.fullScreenModule,constants:r},fragment:{module:this.gaussianModule,constants:{thicknessTextureHeight:t,thicknessTextureWidth:e},targets:[{format:"r16float"}]},primitive:{topology:"triangle-list"}}),this.fluidPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-fluid",layout:"auto",vertex:{module:this.fullScreenModule,constants:r},fragment:{module:this.fluidModule,targets:[{format:this.format}]},primitive:{topology:"triangle-list"}})}createTextures(){const e=Math.max(1,Math.round(this.width/2)),t=Math.max(1,Math.round(this.height/2));this.depthMapTexture=this.device.createTexture({label:"fish-tank-splash-depth-map-texture",size:[this.width,this.height,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"r32float"}),this.tmpDepthMapTexture=this.device.createTexture({label:"fish-tank-splash-depth-map-texture-tmp",size:[this.width,this.height,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"r32float"}),this.thicknessTexture=this.device.createTexture({label:"fish-tank-splash-thickness-texture",size:[e,t,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"r16float"}),this.tmpThicknessTexture=this.device.createTexture({label:"fish-tank-splash-thickness-texture-tmp",size:[e,t,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"r16float"}),this.depthTestTexture=this.device.createTexture({label:"fish-tank-splash-depth-test",size:[this.width,this.height,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"depth32float"}),this.backgroundTexture=this.device.createTexture({label:"fish-tank-splash-background",size:[this.width,this.height,1],usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.TEXTURE_BINDING,format:this.format}),this.depthMapTextureView=this.depthMapTexture.createView(),this.tmpDepthMapTextureView=this.tmpDepthMapTexture.createView(),this.thicknessTextureView=this.thicknessTexture.createView(),this.tmpThicknessTextureView=this.tmpThicknessTexture.createView(),this.depthTestTextureView=this.depthTestTexture.createView(),this.backgroundTextureView=this.backgroundTexture.createView()}createBindGroups(){this.depthMapBindGroup=this.device.createBindGroup({layout:this.depthMapPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.posvelBuffer}},{binding:1,resource:{buffer:this.renderUniformBuffer}}]}),this.thicknessMapBindGroup=this.device.createBindGroup({layout:this.thicknessMapPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.posvelBuffer}},{binding:1,resource:{buffer:this.renderUniformBuffer}}]}),this.sphereBindGroup=this.device.createBindGroup({layout:this.spherePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.posvelBuffer}},{binding:1,resource:{buffer:this.renderUniformBuffer}}]}),this.depthFilterBindGroups=[this.device.createBindGroup({layout:this.depthFilter1DPipeline.getBindGroupLayout(0),entries:[{binding:1,resource:this.depthMapTextureView},{binding:2,resource:{buffer:this.filterXBuffer}}]}),this.device.createBindGroup({layout:this.depthFilter1DPipeline.getBindGroupLayout(0),entries:[{binding:1,resource:this.tmpDepthMapTextureView},{binding:2,resource:{buffer:this.filterYBuffer}}]}),this.device.createBindGroup({layout:this.depthFilter2DPipeline.getBindGroupLayout(0),entries:[{binding:1,resource:this.depthMapTextureView},{binding:2,resource:{buffer:this.filterXBuffer}}]}),this.device.createBindGroup({layout:this.depthFilter2DPipeline.getBindGroupLayout(0),entries:[{binding:1,resource:this.tmpDepthMapTextureView},{binding:2,resource:{buffer:this.filterYBuffer}}]})],this.thicknessFilterBindGroups=[this.device.createBindGroup({layout:this.thicknessFilterPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:this.sampler},{binding:1,resource:this.thicknessTextureView},{binding:2,resource:{buffer:this.filterXBuffer}},{binding:3,resource:{buffer:this.thicknessFilterSizeBuffer}}]}),this.device.createBindGroup({layout:this.thicknessFilterPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:this.sampler},{binding:1,resource:this.tmpThicknessTextureView},{binding:2,resource:{buffer:this.filterYBuffer}},{binding:3,resource:{buffer:this.thicknessFilterSizeBuffer}}]})],this.fluidBindGroup=this.device.createBindGroup({layout:this.fluidPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:this.sampler},{binding:1,resource:this.depthMapTextureView},{binding:2,resource:{buffer:this.renderUniformBuffer}},{binding:3,resource:this.thicknessTextureView},{binding:4,resource:this.backgroundTextureView},{binding:5,resource:{buffer:this.fluidParamsBuffer}},{binding:6,resource:this.sceneDepthTextureView}]})}resize(e,t){this.width===e&&this.height===t||(this.destroyTextures(),this.width=e,this.height=t,this.createPipelines(),this.createTextures(),this.createBindGroups())}destroyTextures(){this.backgroundTexture?.destroy?.(),this.depthMapTexture?.destroy?.(),this.depthTestTexture?.destroy?.(),this.thicknessTexture?.destroy?.(),this.tmpDepthMapTexture?.destroy?.(),this.tmpThicknessTexture?.destroy?.()}update({camera:e,density:t,fluidColor:a,modelMatrix:r,sphereSize:s}){e.updateMatrixWorld(),this.renderViews.texelSize.set([1/this.width,1/this.height]),this.renderViews.sphereSize.set([s,0]),this.renderViews.projectionMatrix.set(e.projectionMatrix.elements),this.renderViews.invProjectionMatrix.set(e.projectionMatrixInverse.elements),this.renderViews.viewMatrix.set(e.matrixWorldInverse.elements),this.renderViews.invViewMatrix.set(e.matrixWorld.elements),this.renderViews.modelMatrix.set(r.elements),this.device.queue.writeBuffer(this.renderUniformBuffer,0,this.renderValues),this.device.queue.writeBuffer(this.fluidParamsBuffer,0,new Float32Array([a[0],a[1],a[2],t]))}copyBackground(e,t){e.copyTextureToTexture({texture:t},{texture:this.backgroundTexture},[this.width,this.height,1])}render(e,t,a,{showParticles:r=!1}={}){if(r){const u=e.beginRenderPass({colorAttachments:[{loadOp:"load",storeOp:"store",view:t}],depthStencilAttachment:{depthClearValue:1,depthLoadOp:"load",depthStoreOp:"store",view:this.sceneDepthTextureView},label:"fish-tank-splash-sphere-pass"});u.setBindGroup(0,this.sphereBindGroup),u.setPipeline(this.spherePipeline),u.draw(6,a),u.end();return}const s=e.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.depthMapTextureView}],depthStencilAttachment:{depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store",view:this.depthTestTextureView},label:"fish-tank-splash-depth-pass"});s.setBindGroup(0,this.depthMapBindGroup),s.setPipeline(this.depthMapPipeline),s.draw(6,a),s.end();for(let u=0;u<2;u+=1){const p=e.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.tmpDepthMapTextureView}],label:"fish-tank-splash-depth-filter-x"});p.setBindGroup(0,this.depthFilterBindGroups[0]),p.setPipeline(this.depthFilter1DPipeline),p.draw(6),p.end();const f=e.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.depthMapTextureView}],label:`fish-tank-splash-depth-filter-y-${u}`});f.setBindGroup(0,this.depthFilterBindGroups[1]),f.setPipeline(this.depthFilter1DPipeline),f.draw(6),f.end()}const n=e.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.tmpDepthMapTextureView}],label:"fish-tank-splash-depth-filter-2d-x"});n.setBindGroup(0,this.depthFilterBindGroups[2]),n.setPipeline(this.depthFilter2DPipeline),n.draw(6),n.end();const l=e.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.depthMapTextureView}],label:"fish-tank-splash-depth-filter-2d-y"});l.setBindGroup(0,this.depthFilterBindGroups[3]),l.setPipeline(this.depthFilter2DPipeline),l.draw(6),l.end();const o=e.beginRenderPass({colorAttachments:[{clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.thicknessTextureView}],label:"fish-tank-splash-thickness-pass"});o.setBindGroup(0,this.thicknessMapBindGroup),o.setPipeline(this.thicknessMapPipeline),o.draw(6,a),o.end();const c=e.beginRenderPass({colorAttachments:[{clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.tmpThicknessTextureView}],label:"fish-tank-splash-thickness-filter-x"});c.setBindGroup(0,this.thicknessFilterBindGroups[0]),c.setPipeline(this.thicknessFilterPipeline),c.draw(6),c.end();const h=e.beginRenderPass({colorAttachments:[{clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.thicknessTextureView}],label:"fish-tank-splash-thickness-filter-y"});h.setBindGroup(0,this.thicknessFilterBindGroups[1]),h.setPipeline(this.thicknessFilterPipeline),h.draw(6),h.end();const d=e.beginRenderPass({colorAttachments:[{clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:t}],label:"fish-tank-splash-fluid-pass"});d.setBindGroup(0,this.fluidBindGroup),d.setPipeline(this.fluidPipeline),d.draw(6),d.end()}dispose(){this.destroyTextures(),this.filterXBuffer.destroy(),this.filterYBuffer.destroy(),this.fluidParamsBuffer.destroy(),this.renderUniformBuffer.destroy(),this.thicknessFilterSizeBuffer.destroy()}}const ea=`struct Cell {
    vx: i32,
    vy: i32,
    vz: i32,
    mass: i32,
}

@group(0) @binding(0) var<storage, read_write> cells: array<Cell>;

@compute @workgroup_size(64)
fn clearGrid(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < arrayLength(&cells)) {
        cells[id.x].mass = 0;
        cells[id.x].vx = 0;
        cells[id.x].vy = 0;
        cells[id.x].vz = 0;
    }
}
`,ta=`struct Particle {
    position: vec3f,
    v: vec3f,
    C: mat3x3f,
}

struct PosVel {
    position: vec3f,
    v: vec3f,
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read_write> posvel: array<PosVel>;
@group(0) @binding(2) var<uniform> numParticles: u32;

@compute @workgroup_size(64)
fn copyPosition(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < numParticles) {
        posvel[id.x].position = particles[id.x].position;
        posvel[id.x].v = particles[id.x].v;
    }
}
`,na=`struct Particle {
    position: vec3f,
    v: vec3f,
    C: mat3x3f,
}

struct Cell {
    vx: i32,
    vy: i32,
    vz: i32,
    mass: i32,
}

struct SimulationUniforms {
    domainSize: vec4f,
    containMin: vec4f,
    containMax: vec4f,
    openSides: vec4f,
    impulseCenter: vec4f,
    impulseDir: vec4f,
    impulseParams: vec4f,
}

override fixedPointMultiplierInverse: f32;
override wallStiffness: f32;

fn decodeFixedPoint(fixedPoint: i32) -> f32 {
    return f32(fixedPoint) * fixedPointMultiplierInverse;
}

fn withinRange(value: f32, minValue: f32, maxValue: f32) -> bool {
    return value >= minValue - 1.0 && value <= maxValue + 1.0;
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<storage, read> cells: array<Cell>;
@group(0) @binding(2) var<uniform> sim: SimulationUniforms;
@group(0) @binding(3) var<uniform> numParticles: u32;

@compute @workgroup_size(64)
fn g2p(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < numParticles) {
        let dt = sim.impulseParams.z;
        let sizeY = i32(sim.domainSize.y);
        let sizeZ = i32(sim.domainSize.z);
        let particle = particles[id.x];
        let cellIndex = floor(particle.position);
        let cellDiff = particle.position - (cellIndex + 0.5f);
        let domainMin = vec3f(1.0, 1.0, 1.0);
        let domainMax = sim.domainSize.xyz - vec3f(2.0, 2.0, 2.0);
        var weights: array<vec3f, 3>;
        var velocity = vec3f(0.0, 0.0, 0.0);
        var B = mat3x3f(vec3f(0.0), vec3f(0.0), vec3f(0.0));

        weights[0] = 0.5f * (0.5f - cellDiff) * (0.5f - cellDiff);
        weights[1] = 0.75f - cellDiff * cellDiff;
        weights[2] = 0.5f * (0.5f + cellDiff) * (0.5f + cellDiff);

        for (var gx = 0; gx < 3; gx = gx + 1) {
            for (var gy = 0; gy < 3; gy = gy + 1) {
                for (var gz = 0; gz < 3; gz = gz + 1) {
                    let weight = weights[gx].x * weights[gy].y * weights[gz].z;
                    let cellX = vec3f(
                        cellIndex.x + f32(gx) - 1.0,
                        cellIndex.y + f32(gy) - 1.0,
                        cellIndex.z + f32(gz) - 1.0
                    );
                    let cellDist = (cellX + 0.5f) - particle.position;
                    let cellIndex1D =
                        i32(cellX.x) * sizeY * sizeZ +
                        i32(cellX.y) * sizeZ +
                        i32(cellX.z);
                    let weightedVelocity = vec3f(
                        decodeFixedPoint(cells[cellIndex1D].vx),
                        decodeFixedPoint(cells[cellIndex1D].vy),
                        decodeFixedPoint(cells[cellIndex1D].vz)
                    ) * weight;

                    B = B + mat3x3f(
                        weightedVelocity * cellDist.x,
                        weightedVelocity * cellDist.y,
                        weightedVelocity * cellDist.z
                    );
                    velocity = velocity + weightedVelocity;
                }
            }
        }

        particles[id.x].v = velocity;
        particles[id.x].C = B * 4.0f;
        particles[id.x].position = clamp(
            particles[id.x].position + particles[id.x].v * dt,
            domainMin,
            domainMax
        );

        let xn = particles[id.x].position + particles[id.x].v * dt * 2.0;
        let insideYZ = withinRange(xn.y, sim.containMin.y, sim.containMax.y) &&
            withinRange(xn.z, sim.containMin.z, sim.containMax.z);
        let insideXZ = withinRange(xn.x, sim.containMin.x, sim.containMax.x) &&
            withinRange(xn.z, sim.containMin.z, sim.containMax.z);
        let insideXY = withinRange(xn.x, sim.containMin.x, sim.containMax.x) &&
            withinRange(xn.y, sim.containMin.y, sim.containMax.y);
        if (insideYZ && sim.openSides.x < 0.5 && xn.x < sim.containMin.x) {
            particles[id.x].v.x = particles[id.x].v.x + wallStiffness * (sim.containMin.x - xn.x);
        }
        if (insideYZ && sim.openSides.y < 0.5 && xn.x > sim.containMax.x) {
            particles[id.x].v.x = particles[id.x].v.x + wallStiffness * (sim.containMax.x - xn.x);
        }
        if (insideXY && sim.openSides.z < 0.5 && xn.z < sim.containMin.z) {
            particles[id.x].v.z = particles[id.x].v.z + wallStiffness * (sim.containMin.z - xn.z);
        }
        if (insideXY && sim.openSides.w < 0.5 && xn.z > sim.containMax.z) {
            particles[id.x].v.z = particles[id.x].v.z + wallStiffness * (sim.containMax.z - xn.z);
        }
        if (insideXZ && xn.y < sim.containMin.y) {
            particles[id.x].v.y = particles[id.x].v.y + wallStiffness * (sim.containMin.y - xn.y);
        }
        if (insideXZ && xn.y > sim.containMax.y) {
            particles[id.x].v.y = particles[id.x].v.y + wallStiffness * (sim.containMax.y - xn.y);
        }
        if (xn.y < sim.containMin.w) {
            particles[id.x].v.y = particles[id.x].v.y + wallStiffness * (sim.containMin.w - xn.y);
        }
    }
}
`,ia=`struct Particle {
    position: vec3f,
    v: vec3f,
    C: mat3x3f,
}

struct Cell {
    vx: atomic<i32>,
    vy: atomic<i32>,
    vz: atomic<i32>,
    mass: atomic<i32>,
}

struct SimulationUniforms {
    domainSize: vec4f,
    containMin: vec4f,
    containMax: vec4f,
    openSides: vec4f,
    impulseCenter: vec4f,
    impulseDir: vec4f,
    impulseParams: vec4f,
}

override fixedPointMultiplier: f32;

fn encodeFixedPoint(floatingPoint: f32) -> i32 {
    return i32(floatingPoint * fixedPointMultiplier);
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read_write> cells: array<Cell>;
@group(0) @binding(2) var<uniform> sim: SimulationUniforms;
@group(0) @binding(3) var<uniform> numParticles: u32;

@compute @workgroup_size(64)
fn p2g_1(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < numParticles) {
        var weights: array<vec3f, 3>;

        let particle = particles[id.x];
        let cellIndex = floor(particle.position);
        let cellDiff = particle.position - (cellIndex + 0.5f);
        let sizeY = i32(sim.domainSize.y);
        let sizeZ = i32(sim.domainSize.z);

        weights[0] = 0.5f * (0.5f - cellDiff) * (0.5f - cellDiff);
        weights[1] = 0.75f - cellDiff * cellDiff;
        weights[2] = 0.5f * (0.5f + cellDiff) * (0.5f + cellDiff);

        for (var gx = 0; gx < 3; gx = gx + 1) {
            for (var gy = 0; gy < 3; gy = gy + 1) {
                for (var gz = 0; gz < 3; gz = gz + 1) {
                    let weight = weights[gx].x * weights[gy].y * weights[gz].z;
                    let cellX = vec3f(
                        cellIndex.x + f32(gx) - 1.0,
                        cellIndex.y + f32(gy) - 1.0,
                        cellIndex.z + f32(gz) - 1.0
                    );
                    let cellDist = (cellX + 0.5f) - particle.position;
                    let Q = particle.C * cellDist;
                    let massContrib = weight;
                    let velContrib = massContrib * (particle.v + Q);
                    let cellIndex1D =
                        i32(cellX.x) * sizeY * sizeZ +
                        i32(cellX.y) * sizeZ +
                        i32(cellX.z);

                    atomicAdd(&cells[cellIndex1D].mass, encodeFixedPoint(massContrib));
                    atomicAdd(&cells[cellIndex1D].vx, encodeFixedPoint(velContrib.x));
                    atomicAdd(&cells[cellIndex1D].vy, encodeFixedPoint(velContrib.y));
                    atomicAdd(&cells[cellIndex1D].vz, encodeFixedPoint(velContrib.z));
                }
            }
        }
    }
}
`,ra=`struct Particle {
    position: vec3f,
    v: vec3f,
    C: mat3x3f,
}

struct Cell {
    vx: atomic<i32>,
    vy: atomic<i32>,
    vz: atomic<i32>,
    mass: i32,
}

struct SimulationUniforms {
    domainSize: vec4f,
    containMin: vec4f,
    containMax: vec4f,
    openSides: vec4f,
    impulseCenter: vec4f,
    impulseDir: vec4f,
    impulseParams: vec4f,
}

override fixedPointMultiplier: f32;
override fixedPointMultiplierInverse: f32;
override stiffness: f32;
override restDensity: f32;
override dynamicViscosity: f32;

fn encodeFixedPoint(floatingPoint: f32) -> i32 {
    return i32(floatingPoint * fixedPointMultiplier);
}

fn decodeFixedPoint(fixedPoint: i32) -> f32 {
    return f32(fixedPoint) * fixedPointMultiplierInverse;
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read_write> cells: array<Cell>;
@group(0) @binding(2) var<uniform> sim: SimulationUniforms;
@group(0) @binding(3) var<uniform> numParticles: u32;
@group(0) @binding(4) var<storage, read_write> densities: array<f32>;

@compute @workgroup_size(64)
fn p2g_2(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < numParticles) {
        var weights: array<vec3f, 3>;

        let particle = particles[id.x];
        let cellIndex = floor(particle.position);
        let cellDiff = particle.position - (cellIndex + 0.5f);
        let sizeY = i32(sim.domainSize.y);
        let sizeZ = i32(sim.domainSize.z);

        weights[0] = 0.5f * (0.5f - cellDiff) * (0.5f - cellDiff);
        weights[1] = 0.75f - cellDiff * cellDiff;
        weights[2] = 0.5f * (0.5f + cellDiff) * (0.5f + cellDiff);

        var density = 0.0;

        for (var gx = 0; gx < 3; gx = gx + 1) {
            for (var gy = 0; gy < 3; gy = gy + 1) {
                for (var gz = 0; gz < 3; gz = gz + 1) {
                    let weight = weights[gx].x * weights[gy].y * weights[gz].z;
                    let cellX = vec3f(
                        cellIndex.x + f32(gx) - 1.0,
                        cellIndex.y + f32(gy) - 1.0,
                        cellIndex.z + f32(gz) - 1.0
                    );
                    let cellIndex1D =
                        i32(cellX.x) * sizeY * sizeZ +
                        i32(cellX.y) * sizeZ +
                        i32(cellX.z);

                    density = density + decodeFixedPoint(cells[cellIndex1D].mass) * weight;
                }
            }
        }

        let volume = 1.0 / density;
        let pressure = max(0.0, stiffness * (pow(density / restDensity, 1.0) - 1.0));
        let dudv = particle.C;
        let strain = dudv + transpose(dudv);
        var stress = mat3x3f(
            vec3f(-pressure, 0.0, 0.0),
            vec3f(0.0, -pressure, 0.0),
            vec3f(0.0, 0.0, -pressure)
        );

        densities[id.x] = density;
        stress = stress + dynamicViscosity * strain;

        let eq16Term0 = -volume * 4.0 * stress * sim.impulseParams.z;

        for (var gx = 0; gx < 3; gx = gx + 1) {
            for (var gy = 0; gy < 3; gy = gy + 1) {
                for (var gz = 0; gz < 3; gz = gz + 1) {
                    let weight = weights[gx].x * weights[gy].y * weights[gz].z;
                    let cellX = vec3f(
                        cellIndex.x + f32(gx) - 1.0,
                        cellIndex.y + f32(gy) - 1.0,
                        cellIndex.z + f32(gz) - 1.0
                    );
                    let cellDist = (cellX + 0.5f) - particle.position;
                    let cellIndex1D =
                        i32(cellX.x) * sizeY * sizeZ +
                        i32(cellX.y) * sizeZ +
                        i32(cellX.z);
                    let momentum = eq16Term0 * weight * cellDist;

                    atomicAdd(&cells[cellIndex1D].vx, encodeFixedPoint(momentum.x));
                    atomicAdd(&cells[cellIndex1D].vy, encodeFixedPoint(momentum.y));
                    atomicAdd(&cells[cellIndex1D].vz, encodeFixedPoint(momentum.z));
                }
            }
        }
    }
}
`,sa=`struct Cell {
    vx: i32,
    vy: i32,
    vz: i32,
    mass: i32,
}

struct SimulationUniforms {
    domainSize: vec4f,
    containMin: vec4f,
    containMax: vec4f,
    openSides: vec4f,
    impulseCenter: vec4f,
    impulseDir: vec4f,
    impulseParams: vec4f,
}

override fixedPointMultiplier: f32;
override fixedPointMultiplierInverse: f32;
override gravity: f32;

fn encodeFixedPoint(floatingPoint: f32) -> i32 {
    return i32(floatingPoint * fixedPointMultiplier);
}

fn decodeFixedPoint(fixedPoint: i32) -> f32 {
    return f32(fixedPoint) * fixedPointMultiplierInverse;
}

fn decodeCellPosition(index: u32, domainSize: vec3u) -> vec3f {
    let yz = domainSize.y * domainSize.z;
    let x = index / yz;
    let y = (index / domainSize.z) % domainSize.y;
    let z = index % domainSize.z;

    return vec3f(f32(x), f32(y), f32(z));
}

@group(0) @binding(0) var<storage, read_write> cells: array<Cell>;
@group(0) @binding(1) var<uniform> sim: SimulationUniforms;

@compute @workgroup_size(64)
fn updateGrid(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < arrayLength(&cells) && cells[id.x].mass > 0) {
        let dt = sim.impulseParams.z;
        let domainSize = vec3u(sim.domainSize.xyz);
        let cellPos = decodeCellPosition(id.x, domainSize);
        let impulseDiff = sim.impulseCenter.xyz - cellPos;
        let impulseRadius = sim.impulseParams.x;
        let impulseStrength = select(
            0.0,
            smoothstep(
                impulseRadius * impulseRadius,
                0.0,
                dot(impulseDiff, impulseDiff)
            ) * sim.impulseParams.y,
            sim.impulseCenter.w > 0.5
        );
        let mass = decodeFixedPoint(cells[id.x].mass);
        var floatV = vec3f(
            decodeFixedPoint(cells[id.x].vx),
            decodeFixedPoint(cells[id.x].vy),
            decodeFixedPoint(cells[id.x].vz)
        ) / mass;

        floatV = vec3f(
            floatV.x + impulseStrength * sim.impulseDir.x,
            floatV.y + impulseStrength * sim.impulseDir.y - gravity * dt,
            floatV.z + impulseStrength * sim.impulseDir.z
        );

        cells[id.x].vx = encodeFixedPoint(floatV.x);
        cells[id.x].vy = encodeFixedPoint(floatV.y);
        cells[id.x].vz = encodeFixedPoint(floatV.z);

        if (cellPos.x < 2.0 || cellPos.x > sim.domainSize.x - 3.0) {
            cells[id.x].vx = 0;
        }
        if (cellPos.y < 2.0 || cellPos.y > sim.domainSize.y - 3.0) {
            cells[id.x].vy = 0;
        }
        if (cellPos.z < 2.0 || cellPos.z > sim.domainSize.z - 3.0) {
            cells[id.x].vz = 0;
        }
    }
}
`,De=1e7,aa=.18,Vt=80,oa=32,la=16,Gn=112,_n=Object.freeze({dynamicViscosity:.1,gravity:.4,restDensity:3,stiffness:50,wallStiffness:1});function ca(i){return{containMax:new Float32Array(i,32,4),containMin:new Float32Array(i,16,4),domainSize:new Float32Array(i,0,4),impulseCenter:new Float32Array(i,64,4),impulseDir:new Float32Array(i,80,4),impulseParams:new Float32Array(i,96,4),openSides:new Float32Array(i,48,4)}}function ua(i){const e=[],t=i.particleSpacing*aa;for(let s=i.initialFillMin[1];s<i.initialFillMax[1];s+=i.particleSpacing)for(let n=i.initialFillMin[0];n<i.initialFillMax[0];n+=i.particleSpacing)for(let l=i.initialFillMin[2];l<i.initialFillMax[2];l+=i.particleSpacing)e.push([n+(Math.random()-.5)*t,s+(Math.random()-.5)*t,l+(Math.random()-.5)*t]);const a=e.length,r=new ArrayBuffer(Vt*a);return e.forEach((s,n)=>{const l=Vt*n,o=new Float32Array(r,l,3),c=new Float32Array(r,l+16,3),h=new Float32Array(r,l+32,12);o.set(s),c.set([0,0,0]),h.set([0,0,0,0,0,0,0,0,0,0,0,0])}),{buffer:r,particleCount:a}}class ha{constructor({config:e,device:t,simulationSettings:a=_n}){this.config=e,this.device=t,this.simulationSettings={..._n,...a},this.simulationValues=new ArrayBuffer(Gn),this.simulationViews=ca(this.simulationValues);const r=ua(e);this.particleCount=r.particleCount,this.gridCount=e.domainSize[0]*e.domainSize[1]*e.domainSize[2],this.cellBuffer=t.createBuffer({label:"fish-tank-splash-cell-buffer",size:la*this.gridCount,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.particleBuffer=t.createBuffer({label:"fish-tank-splash-particle-buffer",size:Vt*this.particleCount,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.posvelBuffer=t.createBuffer({label:"fish-tank-splash-posvel-buffer",size:oa*this.particleCount,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.densityBuffer=t.createBuffer({label:"fish-tank-splash-density-buffer",size:4*this.particleCount,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.simulationUniformBuffer=t.createBuffer({label:"fish-tank-splash-sim-uniforms",size:Gn,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.numParticlesBuffer=t.createBuffer({label:"fish-tank-splash-num-particles",size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.particleBuffer,0,r.buffer),this.device.queue.writeBuffer(this.numParticlesBuffer,0,new Int32Array([this.particleCount])),this.clearGridPipeline=t.createComputePipeline({label:"fish-tank-splash-clear-grid",layout:"auto",compute:{module:t.createShaderModule({code:ea})}}),this.p2g1Pipeline=t.createComputePipeline({label:"fish-tank-splash-p2g1",layout:"auto",compute:{module:t.createShaderModule({code:ia}),constants:{fixedPointMultiplier:De}}}),this.p2g2Pipeline=t.createComputePipeline({label:"fish-tank-splash-p2g2",layout:"auto",compute:{module:t.createShaderModule({code:ra}),constants:{dynamicViscosity:this.simulationSettings.dynamicViscosity,fixedPointMultiplier:De,fixedPointMultiplierInverse:1/De,restDensity:this.simulationSettings.restDensity,stiffness:this.simulationSettings.stiffness}}}),this.updateGridPipeline=t.createComputePipeline({label:"fish-tank-splash-update-grid",layout:"auto",compute:{module:t.createShaderModule({code:sa}),constants:{fixedPointMultiplier:De,fixedPointMultiplierInverse:1/De,gravity:this.simulationSettings.gravity}}}),this.g2pPipeline=t.createComputePipeline({label:"fish-tank-splash-g2p",layout:"auto",compute:{module:t.createShaderModule({code:na}),constants:{fixedPointMultiplierInverse:1/De,wallStiffness:this.simulationSettings.wallStiffness}}}),this.copyPositionPipeline=t.createComputePipeline({label:"fish-tank-splash-copy-position",layout:"auto",compute:{module:t.createShaderModule({code:ta})}}),this.clearGridBindGroup=t.createBindGroup({layout:this.clearGridPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.cellBuffer}}]}),this.p2g1BindGroup=t.createBindGroup({layout:this.p2g1Pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.cellBuffer}},{binding:2,resource:{buffer:this.simulationUniformBuffer}},{binding:3,resource:{buffer:this.numParticlesBuffer}}]}),this.p2g2BindGroup=t.createBindGroup({layout:this.p2g2Pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.cellBuffer}},{binding:2,resource:{buffer:this.simulationUniformBuffer}},{binding:3,resource:{buffer:this.numParticlesBuffer}},{binding:4,resource:{buffer:this.densityBuffer}}]}),this.updateGridBindGroup=t.createBindGroup({layout:this.updateGridPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.cellBuffer}},{binding:1,resource:{buffer:this.simulationUniformBuffer}}]}),this.g2pBindGroup=t.createBindGroup({layout:this.g2pPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.cellBuffer}},{binding:2,resource:{buffer:this.simulationUniformBuffer}},{binding:3,resource:{buffer:this.numParticlesBuffer}}]}),this.copyPositionBindGroup=t.createBindGroup({layout:this.copyPositionPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.posvelBuffer}},{binding:2,resource:{buffer:this.numParticlesBuffer}}]})}update({containMax:e,containMin:t,delta:a,impulse:r,openSides:s,spillFloor:n}){this.simulationViews.domainSize.set([this.config.domainSize[0],this.config.domainSize[1],this.config.domainSize[2],0]),this.simulationViews.containMin.set([t[0],t[1],t[2],n]),this.simulationViews.containMax.set([e[0],e[1],e[2],0]),this.simulationViews.openSides.set([s[0],s[1],s[2],s[3]]),r?(this.simulationViews.impulseCenter.set([r.center[0],r.center[1],r.center[2],1]),this.simulationViews.impulseDir.set([r.direction[0],r.direction[1],r.direction[2],0]),this.simulationViews.impulseParams.set([r.radius,r.strength,a,0])):(this.simulationViews.impulseCenter.set([0,0,0,0]),this.simulationViews.impulseDir.set([0,0,0,0]),this.simulationViews.impulseParams.set([0,0,a,0])),this.device.queue.writeBuffer(this.simulationUniformBuffer,0,this.simulationValues)}step(e){const t=e.beginComputePass({label:"fish-tank-splash-compute"});t.setBindGroup(0,this.clearGridBindGroup),t.setPipeline(this.clearGridPipeline),t.dispatchWorkgroups(Math.ceil(this.gridCount/64)),t.setBindGroup(0,this.p2g1BindGroup),t.setPipeline(this.p2g1Pipeline),t.dispatchWorkgroups(Math.ceil(this.particleCount/64)),t.setBindGroup(0,this.p2g2BindGroup),t.setPipeline(this.p2g2Pipeline),t.dispatchWorkgroups(Math.ceil(this.particleCount/64)),t.setBindGroup(0,this.updateGridBindGroup),t.setPipeline(this.updateGridPipeline),t.dispatchWorkgroups(Math.ceil(this.gridCount/64)),t.setBindGroup(0,this.g2pBindGroup),t.setPipeline(this.g2pPipeline),t.dispatchWorkgroups(Math.ceil(this.particleCount/64)),t.setBindGroup(0,this.copyPositionBindGroup),t.setPipeline(this.copyPositionPipeline),t.dispatchWorkgroups(Math.ceil(this.particleCount/64)),t.end()}dispose(){this.cellBuffer.destroy(),this.densityBuffer.destroy(),this.numParticlesBuffer.destroy(),this.particleBuffer.destroy(),this.posvelBuffer.destroy(),this.simulationUniformBuffer.destroy()}}const da=1.5,di=18e3,pa=.072,Ln=.36,fa=.78,ga=1.58,ma=24,xa=22,va=36,Sa=Object.freeze({Small:1e4,Medium:di,Large:3e4,"Very Large":45e3}),ba=.42,ya=4.5,wa=2.75,en=["left","right","back","front"],En=new A,On=new A;function Ma(i,e,t){const a=Math.max(0,e[0]-i[0]),r=Math.max(0,e[1]-i[1]),s=Math.max(0,e[2]-i[2]);return Math.ceil(a/t)*Math.ceil(r/t)*Math.ceil(s/t)}function Pa(i,e,t){let a=fa;for(;Ma(i,e,a)>t&&a<da;)a+=.08;return a}function Ta(i){return Sa[i.splashParticleBudget]??di}function Ze(i,e,t){return t.map((a,r)=>(a-i[r])/e)}function ka(i){const e=Be(i),t=Ta(i),a=-i.height/2+Re,r=N.clamp(Math.max(e.innerWidth/va,e.innerDepth/ma,Math.max(e.waterHeight,e.innerHeight*.82)/xa),pa,.11),s=Math.max(Ln,e.innerWidth*.55),n=Math.max(Ln,e.innerDepth*.7),l=Math.max(.32,i.height*.18),o=Math.max(.2,i.height*.12),c=[-e.innerWidth/2-s,a-l,-e.innerDepth/2-n],d=[e.innerWidth/2+s,a+e.waterHeight+o,e.innerDepth/2+n].map((S,x)=>Math.ceil((S-c[x])/r)+4),u=Ze(c,r,[-e.innerWidth/2,a,-e.innerDepth/2]),p=Ze(c,r,[e.innerWidth/2,a+e.waterHeight,e.innerDepth/2]),f=[u[0]+1.5,u[1]+1.5,u[2]+1.5],v=[p[0]-1.5,p[1]-1.2,p[2]-1.5],b=Pa(f,v,t);return{cellSize:r,domainMinLocal:c,domainSize:d,initialFillMin:f,initialFillMax:v,innerDepth:e.innerDepth,innerWidth:e.innerWidth,maxParticles:t,particleDiameterWorld:r*ga,particleSpacing:b,waterBottom:a,signature:[d.join("x"),r.toFixed(4),t,i.waterLevel.toFixed(4),e.innerWidth.toFixed(4),e.innerDepth.toFixed(4),a.toFixed(4)].join(":")}}function za(i,e,t){const a=Be({...e,waterLevel:t}),r=[-a.innerWidth/2,i.waterBottom,-a.innerDepth/2],s=[a.innerWidth/2,i.waterBottom+a.waterHeight,a.innerDepth/2],n=Math.min(-e.height/2+i.particleDiameterWorld*.5,i.waterBottom-i.particleDiameterWorld*.25);return{containMax:Ze(i.domainMinLocal,i.cellSize,s),containMin:Ze(i.domainMinLocal,i.cellSize,r),layout:a,spillFloor:(n-i.domainMinLocal[1])/i.cellSize}}function Ca(i,e){return Ze(i.domainMinLocal,i.cellSize,[e.x,e.y,e.z])}function Da(i){return en.map(e=>i?.isPaneBroken?.(e)?1:0)}function Wa(i){switch(i){case"left":return[-1,0,0];case"right":return[1,0,0];case"back":return[0,0,-1];case"front":return[0,0,1];default:return[0,0,0]}}function Ra(i,e,t,a,r){const s=Ca(i,a),n=Math.max(1e-4,e.splashBreakImpulseDuration??ba),l=Math.max(1e-4,e.splashBreakImpulseRadius??ya),o=Math.max(0,e.splashBreakImpulseStrength??wa);switch(t){case"left":s[0]=r.containMin[0]+1.2;break;case"right":s[0]=r.containMax[0]-1.2;break;case"back":s[2]=r.containMin[2]+1.2;break;case"front":s[2]=r.containMax[2]-1.2;break}return{center:s,direction:Wa(t),duration:n,remaining:n,radius:l,strength:o}}function Ba(i,e,t){return i.copy(e.matrixWorld),On.makeTranslation(t.domainMinLocal[0],t.domainMinLocal[1],t.domainMinLocal[2]),En.makeScale(t.cellSize,t.cellSize,t.cellSize),i.multiply(On),i.multiply(En),i}const Ia=1e-4,Wt=new M,Rt=new j,Fa=new A,An=new M,Bt=new M,Ga=new Set(["tank-pane","tank-pane-fragment"]);function Vn(){return Object.fromEntries(en.map(i=>[i,0]))}function _a(i){const e=new Ee(i.waterColor).offsetHSL(0,.02,-.06);return[e.r,e.g,e.b]}function Ne(i,e){if(e){if(!i?.queue?.onSubmittedWorkDone){e.dispose();return}i.queue.onSubmittedWorkDone().catch(()=>{}).then(()=>{e.dispose()})}}function La(){const i=new bi({fog:!1,side:Nt,toneMapped:!1});return i.colorWrite=!1,i}function Ea(i){return!i?.isMesh||i.visible===!1?!1:i.userData?.excludeFromWaterDepthOcclusion?!0:Ga.has(i.userData?.surfaceType)}function Oa(i,e){const t=new yi(i,e,wi);return t.name="fish-tank-splash-scene-depth",t.magFilter=Je,t.minFilter=Je,new Mi(i,e,{colorSpace:Pi,depthBuffer:!0,depthTexture:t,magFilter:Je,minFilter:Je,samples:0,stencilBuffer:!1})}function Aa({camera:i,gl:e,material:t,scene:a,target:r}){const s=a,n=[],l=e,o=s.overrideMaterial,c=l.getRenderTarget?.()??null;s.traverse(h=>{if(!Ea(h))return;const d=h;n.push(d),d.visible=!1});try{l.setRenderTarget(r),s.overrideMaterial=t,l.clear(!0,!0,!1),l.render(s,i)}finally{n.forEach(h=>{const d=h;d.visible=!0}),s.overrideMaterial=o,l.setRenderTarget(c)}}function Va({runtime:i,showWaterBounds:e=!1,tank:t}){const a=g.useRef(Vn()),r=g.useRef(null),s=g.useRef(null),n=g.useRef(""),l=g.useRef(null),o=g.useRef(null),c=g.useRef(null),h=g.useRef(null),d=g.useRef(""),u=g.useMemo(()=>ka(t),[t.depth,t.glassThickness,t.height,t.splashParticleBudget,t.waterInset,t.waterLevel,t.width]),p=g.useMemo(()=>_a(t),[t.waterColor]),f=g.useMemo(()=>{const[b,S,x]=u.domainMinLocal,[w,y,z]=u.domainSize,k=[w*u.cellSize,y*u.cellSize,z*u.cellSize];return An.set(b+k[0]*.5,S+k[1]*.5,x+k[2]*.5),{position:An.toArray(),size:k}},[u]),v=g.useMemo(()=>({dynamicViscosity:t.splashViscosity,gravity:t.splashGravity,restDensity:t.splashRestDensity,stiffness:t.splashStiffness,wallStiffness:t.splashWallStiffness}),[t.splashGravity,t.splashRestDensity,t.splashStiffness,t.splashViscosity,t.splashWallStiffness]);return g.useEffect(()=>()=>{const b=l.current,S=o.current,x=c.current,w=h.current,y=b?.device??w?.device;n.current="",d.current="",l.current=null,o.current=null,c.current=null,h.current=null,Ne(y,b),S?.dispose?.(),x?.dispose?.(),Ne(y,w)},[]),ye((b,S)=>{const{camera:x,gl:w,scene:y}=b,z=w?.backend,k=z?.device,F=z?.context,T=r.current,B=i?i.getWaterLevel():t.waterLevel,W=i?.isAnyPaneBroken?.()??!1,L=i?.isAnyPaneBroken?.()?t.waterLevel:B;if(!k||!F||!T||!W&&B<=Ia)return;const K=[u.signature,i?.getResetNonce?.()??0,v.dynamicViscosity,v.gravity,v.restDensity,v.stiffness,v.wallStiffness].join(":");K!==d.current&&(Ne(k,l.current),Ne(k,h.current),h.current=new ha({config:u,device:k,simulationSettings:v}),a.current=Vn(),s.current=null,n.current="",d.current=K);const E=h.current;if(!E){n.current="";return}w.getDrawingBufferSize(Rt);const $=Math.max(1,Math.round(Rt.x)),D=Math.max(1,Math.round(Rt.y));let I=o.current,C=c.current;I||(I=La(),o.current=I),C?(C.width!==$||C.height!==D)&&C.setSize($,D):(C=Oa($,D),c.current=C),Aa({camera:x,gl:w,material:I,scene:y,target:C}),w.render(y,x);const G=z?.get?.(C.depthTexture)?.texture;if(!G){n.current="";return}const Q=`${$}x${D}:${K}`;T.getWorldScale(Bt),(!l.current||Q!==n.current)&&(Ne(k,l.current),l.current=new Js({device:k,format:navigator.gpu.getPreferredCanvasFormat(),height:D,fovRadians:N.degToRad(x.fov),particleDiameter:u.particleDiameterWorld*Bt.x,posvelBuffer:E.posvelBuffer,sceneDepthTexture:G,width:$}),n.current=Q);const ae=za(u,t,L);en.forEach(Te=>{const St=i?.getPaneBreakEvent?.(Te),rn=St?.id??0;rn<=a.current[Te]||!St?.worldPoint||(a.current[Te]=rn,Wt.fromArray(St.worldPoint),T.worldToLocal(Wt),s.current=Ra(u,t,Te,Wt,ae))});const xe=t.splashRunning!==!1;s.current&&xe&&(s.current.remaining=Math.max(0,s.current.remaining-S),s.current.remaining<=0&&(s.current=null));const tn=Da(i),Ae=s.current?{center:s.current.center,direction:s.current.direction,radius:s.current.radius,strength:s.current.strength*(s.current.remaining/s.current.duration)}:null;if(xe){const Te=Math.min(S*t.splashSimSpeed,t.splashMaxDelta);E.update({containMax:ae.containMax,containMin:ae.containMin,delta:Te,impulse:Ae,openSides:tn,spillFloor:ae.spillFloor})}l.current.update({camera:x,density:t.splashColorDensity,fluidColor:p,modelMatrix:Ba(Fa,T,u),sphereSize:u.particleDiameterWorld*Bt.x});const fe=k.createCommandEncoder({label:"fish-tank-splash-frame"}),nn=F.getCurrentTexture();l.current.copyBackground(fe,nn),xe&&E.step(fe),l.current.render(fe,nn.createView(),E.particleCount,{showParticles:t.splashShowParticles===!0}),k.queue.submit([fe.finish()])},1),m.jsx("group",{ref:r,children:e&&m.jsxs("mesh",{position:f.position,children:[m.jsx("boxGeometry",{args:f.size}),m.jsx("meshBasicMaterial",{color:"#22d3ee",transparent:!0,opacity:.45,wireframe:!0})]})})}const Na=.34,ja=.036,Nn=1e-4,We=new M,je=new M;function jn(i){return`#${i.getHexString()}`}function Ua({fluidCouplersRef:i,runtime:e,tank:t}){const a=g.useRef(new WeakMap),r=g.useRef(0),s=g.useRef(null),n=g.useRef(.35),l=g.useRef(.03),o=g.useRef(.65),[c,h]=g.useMemo(()=>{const d=new Ee(t.waterColor),u=d.clone().offsetHSL(0,.03,-.22),p=d.clone().offsetHSL(0,.02,.12);return[jn(u),jn(p)]},[t.waterColor]);return ye((d,u)=>{const p=s.current;if(!p)return;const f=e?e.getWaterLevel():t.waterLevel,v=e?e.getBrokenPaneCount():0,b=t.waterLevel>0?1-f/t.waterLevel:0,S=Be({...t,waterLevel:f}),x=a.current;let w=0;p.visible=f>Nn,p.position.set(0,S.waterY,0),p.scale.set(S.innerWidth,S.waterHeight,S.innerDepth),(i?.current??[]).forEach(y=>{if(!y)return;y.getWorldPosition(je);const z=x.get(y);if(!z){x.set(y,je.clone());return}if(We.copy(je),p.worldToLocal(We),Math.abs(We.x)<=.52&&Math.abs(We.z)<=.52&&We.y>=-.55&&We.y<=.55){const k=je.distanceTo(z)/Math.max(u,.008333333333333333);w=Math.max(w,Math.min(.08,k*.0035))}z.copy(je)}),r.current=Math.max(r.current*.9,w),l.current=Math.max(.012,ja+v*.014+b*.05+r.current),o.current=.4+t.waterDisturbance*1.6+v*.12+r.current*4,n.current=Math.min(1.4,.22+t.waterDisturbance*2.4+b*.45+r.current*5)}),m.jsx("group",{ref:s,visible:t.waterLevel>Nn,children:m.jsx(Oi,{bottomColor:c,depth:1,height:1,ior:1.18,opacity:Na,roughness:.14,segments:20,showEdges:!1,thickness:.55,topColor:h,transmission:.42,waveChoppinessRef:n,waveHeightRef:l,waveSpeedRef:o,width:1})})}function Ha({fluidCouplersRef:i,runtime:e,showWaterBounds:t=!1,tank:a}){const r=be(n=>n.gl);return r?.backend?.isWebGPUBackend===!0&&!!r?.backend?.device&&!!r?.backend?.context&&typeof navigator<"u"&&!!navigator.gpu?m.jsx(Va,{runtime:e,showWaterBounds:t,tank:a}):m.jsx(Ua,{fluidCouplersRef:i,runtime:e,tank:a})}const It=1e-4,Ya=20,Xa=8,qa=new Set(["glass_2","glass_5","lid_1","plastic_1","plastic_2","rubber"]),Za=1.05,Ka=.03,Un=new j,Ft=new jt,$a=new M,Qa=Le.memo(function({geometry:e,material:t,colliderShape:a="trimesh",meshKey:r,meshProps:s}){return m.jsx($e,{type:"fixed",colliders:a,friction:Za,restitution:Ka,children:m.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:e,material:t,...s},r)})});function Ja({tank:i,debug:e,externalCollisionObjectsRef:t,fluidCouplersRef:a,rocks:r,runtime:s}){const n=be(D=>D.camera),l=be(D=>D.gl),o=g.useRef(null),c=g.useRef([]),h=g.useRef({}),d=g.useRef({}),u=g.useRef(null),p=g.useRef(null),f=g.useRef(null),v=g.useRef([]),b=g.useRef({}),S=g.useRef(null),[x,w]=g.useState(null),{innerDepth:y,innerWidth:z,waterHeight:k,waterY:F}=Be(i),T=l?.backend?.isWebGPUBackend===!0&&!!l?.backend?.device&&!!l?.backend?.context&&typeof navigator<"u"&&!!navigator.gpu;g.useLayoutEffect(()=>{if(x||!p.current)return;const D=new Et,I=new M,C=new M;p.current.updateWorldMatrix(!0,!0),D.setFromObject(p.current),Number.isFinite(D.min.x)&&(D.getCenter(I),D.getSize(C),w({center:I.toArray(),minY:D.min.y,size:C.toArray()}))},[x]);const B=g.useMemo(()=>{if(!x)return null;const[D,I,C]=x.size,[G,,Q]=x.center,ae=[i.width/Math.max(D,It),i.height/Math.max(I,It),i.depth/Math.max(C,It)];return{position:[-G*ae[0],-i.height/2-x.minY*ae[1],-Q*ae[2]],scale:ae}},[x,i.depth,i.height,i.width]);g.useEffect(()=>{const{domElement:D}=l,I=()=>{u.current=null},C=Q=>{Q.button===0&&(u.current={clientX:Q.clientX,clientY:Q.clientY})},G=Q=>{const ae=u.current;if(u.current=null,!ae||Q.button!==0||!f.current||Math.hypot(Q.clientX-ae.clientX,Q.clientY-ae.clientY)>Xa)return;const xe=D.getBoundingClientRect();Un.set((Q.clientX-xe.left)/xe.width*2-1,-((Q.clientY-xe.top)/xe.height)*2+1),Ft.setFromCamera(Un,n);const Ae=Ft.intersectObjects(he.map(fe=>d.current[fe]).filter(fe=>fe&&fe.visible),!1)[0]??null;f.current.launch({paneKey:Ae?.object?.userData?.paneKey??null,targetWorldPoint:Ae?Ae.point.clone():Ft.ray.at(Ya,$a.clone())})};return D.addEventListener("pointerdown",C),window.addEventListener("pointerup",G),window.addEventListener("pointercancel",I),()=>{D.removeEventListener("pointerdown",C),window.removeEventListener("pointerup",G),window.removeEventListener("pointercancel",I)}},[n,l]),ye(()=>{const D=s?s.getWaterLevel():i.waterLevel,I=Be({...i,waterLevel:D});c.current=[...t?.current??[],...ln.map(G=>b.current[G]),...Object.values(h.current),...he.map(G=>d.current[G])].filter(G=>G&&G.visible);const C=a?.current;if(C){C.splice(0,C.length,...v.current,...Object.values(h.current));for(let G=C.length-1;G>=0;G-=1)C[G]||C.splice(G,1)}S.current&&(S.current.position.set(0,I.waterY,0),S.current.rotation.set(0,0,0),S.current.scale.y=I.waterHeight+.01,S.current.visible=e.showWaterBounds&&D>0)});const W=(D,I)=>{s&&s.breakPane(D,I.localPoint,I.worldPoint)},L=g.useMemo(()=>Object.fromEntries(ln.map(D=>[D,{ref:I=>{const C=I;b.current[D]=C,C&&(C.userData={...C.userData,surfaceKey:D,surfaceType:"tank-static"})}}])),[]),K=g.useMemo(()=>Object.fromEntries(he.map(D=>[D,{ref:I=>{const C=I;d.current[D]=C,C&&(C.userData={...C.userData,paneKey:D,surfaceType:"tank-pane"})}}])),[]),E=g.useCallback(({geometry:D,material:I,meshKey:C,meshProps:G})=>qa.has(C)?m.jsx(Qa,{colliderShape:"trimesh",geometry:D,material:I,meshKey:C,meshProps:G},C):m.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:D,material:I,...G},C),[]),$=g.useCallback(({geometry:D,material:I,paneKey:C,paneProps:G})=>m.jsx(ks,{assetGroupRef:o,fragmentObjectsRef:h,geometry:D,material:I,paneKey:C,paneProps:G,runtime:s,tank:i},C),[s,i]);return m.jsxs(m.Fragment,{children:[!x&&m.jsx("group",{visible:!1,children:m.jsx(Ot,{ref:p})}),i.visible&&m.jsxs(m.Fragment,{children:[m.jsx(hi,{collisionObjectsRef:c,fluidObjectsRef:v,ref:f,onImpact:W,rocks:r,runtime:s}),B&&m.jsx("group",{ref:o,position:B.position,scale:B.scale,children:m.jsx(Ot,{glassColor:i.glassColor,glassOpacity:i.glassOpacity,paneProps:K,renderPane:$,renderStaticMesh:E,sandColor:i.sandColor,staticMeshProps:L})}),m.jsx(Ha,{fluidCouplersRef:a,runtime:s,showWaterBounds:e.showWaterBounds,tank:i})]}),e.showTankBounds&&m.jsxs("mesh",{children:[m.jsx("boxGeometry",{args:[i.width+.01,i.height+.01,i.depth+.01]}),m.jsx("meshBasicMaterial",{color:"#f97316",transparent:!0,opacity:.45,wireframe:!0})]}),e.showWaterBounds&&!T&&m.jsxs("mesh",{ref:S,position:[0,F,0],scale:[1,k+.01,1],children:[m.jsx("boxGeometry",{args:[z+.01,1,y+.01]}),m.jsx("meshBasicMaterial",{color:"#22d3ee",transparent:!0,opacity:.45,wireframe:!0})]})]})}const O=ii(Zt,qt),ct={ambientIntensity:.95,backgroundColor:"#0f172a",cameraDesktopFov:34,cameraDesktopPosition:{x:5.8,y:3.4,z:8.2},cameraDesktopTarget:{x:0,y:1.15,z:0},cameraMobileFov:46,cameraMobilePosition:{x:0,y:3.2,z:9.4},cameraMobileTarget:{x:0,y:1.1,z:0},cameraMode:"Fixed",directionalIntensity:1.25,directionalPosition:{x:6,y:9,z:4},drainRate:.16,fishEscapeDistance:1.2,fishBaseYOffset:.05,fishBobAmplitude:.08,fishCount:2,fishFlopAmplitude:.95,fishMarkerColor:"#f472b6",fishMarkerSize:.045,fishRadiusX:.78,fishRadiusZ:.42,fishScale:.018,fishSpeed:.45,fishStrandLevel:.2,fishVisible:!0,floorColor:"#bca88c",fogColor:"#0f172a",fogFar:24,fogNear:10,glassColor:"#dbeafe",glassOpacity:.16,gridColor:"#8aa1b1",operatorBoostMultiplier:2,operatorLiftSpeed:3,operatorMaxFov:72,operatorMinFov:22,operatorMoveSpeed:4,operatorPointerLookSensitivity:.0025,operatorStickLookSpeed:2.2,operatorZoomSpeed:28,rockGravity:8.5,rockScale:.7,rockSpeed:40,rockSpin:10,sandColor:"#c9a46b",showFishMarkers:!1,showRapierDebug:!1,splashBreakImpulseDuration:.42,splashBreakImpulseRadius:4.5,splashBreakImpulseStrength:2.75,splashColorDensity:1.3,splashGravity:.4,splashMaxDelta:.4,splashParticleBudget:"Medium",splashRestDensity:3,splashRunning:!0,splashShowParticles:!1,splashSimSpeed:12,splashStiffness:50,splashViscosity:.1,splashWallStiffness:1,spillExtent:3.8,spillOpacity:.28,spillThickness:.045,showTankBounds:!1,showWaterBounds:!1,tableDepth:5.98,tableLegDepth:.22,tableLegInset:.32,tableLegWidth:.22,tableMetalness:0,tablePosition:{x:0,y:1.1,z:0},tableRoughness:.78,tableThickness:.18,tableWidth:7.95,tableWoodBarkThickness:O.barkThickness,tableWoodCellScale:O.cellScale,tableWoodCellSize:O.cellSize,tableWoodCenterSize:O.centerSize,tableWoodClearcoat:O.clearcoat,tableWoodClearcoatRoughness:O.clearcoatRoughness,tableWoodDarkGrainColor:O.darkGrainColor,tableWoodFineWarpScale:O.fineWarpScale,tableWoodFineWarpStrength:O.fineWarpStrength,tableWoodFinish:qt,tableWoodGrainOffset:{x:0,y:0,z:0},tableWoodGrainRotation:{x:0,y:0,z:0},tableWoodGrainScale:{x:1,y:1,z:1},tableWoodGenus:Zt,tableWoodLargeGrainStretch:O.largeGrainStretch,tableWoodLargeWarpScale:O.largeWarpScale,tableWoodLightGrainColor:O.lightGrainColor,tableWoodRingBias:O.ringBias,tableWoodRingSizeVariance:O.ringSizeVariance,tableWoodRingThickness:O.ringThickness,tableWoodRingVarianceScale:O.ringVarianceScale,tableWoodSmallWarpScale:O.smallWarpScale,tableWoodSmallWarpStrength:O.smallWarpStrength,tableWoodSplotchIntensity:O.splotchIntensity,tableWoodSplotchScale:O.splotchScale,tankDepth:1.8,tankHeight:2.2,tankPosition:{x:0,y:1.2,z:0},tankRotation:{x:0,y:0,z:0},tankScale:1,tankVisible:!0,tankWidth:3.2,waterColor:"#4cc9f0",waterDisturbance:.09,waterInset:.12,waterLevel:.78,glassThickness:.06},Gt={Default:{...ct},Orbit:{...ct,backgroundColor:"#111827",cameraMode:"Orbit",fogFar:26,waterLevel:.72},Operator:{...ct,cameraMode:"Operator",fishSpeed:.55,waterLevel:.68},Debug:{...ct,backgroundColor:"#020617",cameraMode:"Orbit",showFishMarkers:!0,showRapierDebug:!0,showTankBounds:!0,showWaterBounds:!0,waterLevel:.58}},eo=Object.freeze({sceneTitle:"My Heart Is A Broken Fish Tank"}),Hn="Default";function pi(i){return i.split("_").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function to({finish:i,genus:e}){const t=ii(e,i);return{tableWoodBarkThickness:t.barkThickness,tableWoodCellScale:t.cellScale,tableWoodCellSize:t.cellSize,tableWoodCenterSize:t.centerSize,tableWoodClearcoat:t.clearcoat,tableWoodClearcoatRoughness:t.clearcoatRoughness,tableWoodDarkGrainColor:t.darkGrainColor,tableWoodFineWarpScale:t.fineWarpScale,tableWoodFineWarpStrength:t.fineWarpStrength,tableWoodLargeGrainStretch:t.largeGrainStretch,tableWoodLargeWarpScale:t.largeWarpScale,tableWoodLightGrainColor:t.lightGrainColor,tableWoodRingBias:t.ringBias,tableWoodRingSizeVariance:t.ringSizeVariance,tableWoodRingThickness:t.ringThickness,tableWoodRingVarianceScale:t.ringVarianceScale,tableWoodSmallWarpScale:t.smallWarpScale,tableWoodSmallWarpStrength:t.smallWarpStrength,tableWoodSplotchIntensity:t.splotchIntensity,tableWoodSplotchScale:t.splotchScale}}const no=Object.freeze(Object.fromEntries(Er.map(i=>[pi(i),i]))),io=Object.freeze(Object.fromEntries(Or.map(i=>[pi(i),i])));function ro({presetSnapshot:i}){return{...i}}function so(){const{attachSetControls:i,controlsSnapshotRef:e,initialPreset:t,presetsFolder:a}=Ai({defaultPreset:Hn,getPresetControls:ro,presets:Gt}),r=Gt[t]||Gt[Hn],s=g.useRef(`${r.tableWoodGenus}:${r.tableWoodFinish}`),[n,l]=Ti(eo.sceneTitle,()=>({Presets:a,Scene:_({backgroundColor:{label:"Background",value:r.backgroundColor},floorColor:{label:"Floor",value:r.floorColor},gridColor:{label:"Grid",value:r.gridColor},fogColor:{label:"Fog",value:r.fogColor},fogNear:{label:"Fog Near",max:40,min:0,step:.25,value:r.fogNear},fogFar:{label:"Fog Far",max:60,min:1,step:.25,value:r.fogFar},ambientIntensity:{label:"Ambient",max:3,min:0,step:.05,value:r.ambientIntensity},directionalIntensity:{label:"Main Light",max:4,min:0,step:.05,value:r.directionalIntensity},directionalPosition:{label:"Light Pos",step:.1,value:r.directionalPosition}},{collapsed:!0}),Camera:_({cameraMode:{label:"Mode",options:["Fixed","Orbit","Operator"],value:r.cameraMode},"Fixed Frame":_({cameraDesktopPosition:{label:"Desktop Pos",step:.1,value:r.cameraDesktopPosition},cameraDesktopTarget:{label:"Desktop Target",step:.1,value:r.cameraDesktopTarget},cameraDesktopFov:{label:"Desktop Fov",max:90,min:15,step:1,value:r.cameraDesktopFov},cameraMobilePosition:{label:"Mobile Pos",step:.1,value:r.cameraMobilePosition},cameraMobileTarget:{label:"Mobile Target",step:.1,value:r.cameraMobileTarget},cameraMobileFov:{label:"Mobile Fov",max:90,min:15,step:1,value:r.cameraMobileFov}},{collapsed:!0}),Operator:_({operatorMoveSpeed:{label:"Move Speed",max:20,min:.5,step:.1,value:r.operatorMoveSpeed},operatorLiftSpeed:{label:"Lift Speed",max:20,min:.5,step:.1,value:r.operatorLiftSpeed},operatorBoostMultiplier:{label:"Boost",max:10,min:1,step:.1,value:r.operatorBoostMultiplier},operatorPointerLookSensitivity:{label:"Pointer Look",max:.02,min:5e-4,step:5e-4,value:r.operatorPointerLookSensitivity},operatorStickLookSpeed:{label:"Stick Look",max:10,min:.1,step:.1,value:r.operatorStickLookSpeed},operatorZoomSpeed:{label:"Zoom Speed",max:120,min:1,step:1,value:r.operatorZoomSpeed},operatorMinFov:{label:"Min Fov",max:90,min:10,step:1,value:r.operatorMinFov},operatorMaxFov:{label:"Max Fov",max:120,min:20,step:1,value:r.operatorMaxFov}},{collapsed:!0})},{collapsed:!0}),Tank:_({tankVisible:{label:"Visible",value:r.tankVisible},tankPosition:{label:"Position",step:.05,value:r.tankPosition},tankRotation:{label:"Rotation",max:Math.PI,min:-Math.PI,step:.01,value:r.tankRotation},tankScale:{label:"Scale",max:3,min:.1,step:.01,value:r.tankScale},Dimensions:_({tankWidth:{label:"Width",max:8,min:.5,step:.05,value:r.tankWidth},tankHeight:{label:"Height",max:8,min:.5,step:.05,value:r.tankHeight},tankDepth:{label:"Depth",max:8,min:.5,step:.05,value:r.tankDepth},glassThickness:{label:"Glass",max:.4,min:.01,step:.01,value:r.glassThickness}},{collapsed:!0}),Materials:_({glassColor:{label:"Glass Color",value:r.glassColor},glassOpacity:{label:"Glass Opacity",max:1,min:0,step:.01,value:r.glassOpacity},sandColor:{label:"Sand Color",value:r.sandColor}},{collapsed:!0})},{collapsed:!0}),Water:_({waterInset:{label:"Water Inset",max:.4,min:.01,step:.01,value:r.waterInset},waterLevel:{label:"Water Level",max:1,min:.05,step:.01,value:r.waterLevel},waterColor:{label:"Water Color",value:r.waterColor},drainRate:{label:"Drain Rate",max:1,min:0,step:.01,value:r.drainRate},spillExtent:{label:"Spill Extent",max:10,min:0,step:.1,value:r.spillExtent},spillOpacity:{label:"Spill Opacity",max:1,min:0,step:.01,value:r.spillOpacity},spillThickness:{label:"Spill Thickness",max:.3,min:.005,step:.005,value:r.spillThickness},waterDisturbance:{label:"Cursor Push",max:.5,min:0,step:.005,value:r.waterDisturbance},Splash:_({splashParticleBudget:{label:"Particle Budget",options:["Small","Medium","Large","Very Large"],value:r.splashParticleBudget},splashSimSpeed:{label:"Step Scale",max:30,min:.25,step:.25,value:r.splashSimSpeed},splashMaxDelta:{label:"Max Dt",max:.5,min:.01,step:.01,value:r.splashMaxDelta},splashGravity:{label:"Gravity",max:2,min:0,step:.01,value:r.splashGravity},splashColorDensity:{label:"Color Density",max:6,min:0,step:.1,value:r.splashColorDensity},splashRestDensity:{label:"Rest Density",max:8,min:.5,step:.1,value:r.splashRestDensity},splashStiffness:{label:"Stiffness",max:120,min:1,step:1,value:r.splashStiffness},splashViscosity:{label:"Viscosity",max:1,min:0,step:.01,value:r.splashViscosity},splashWallStiffness:{label:"Wall Stiffness",max:4,min:0,step:.05,value:r.splashWallStiffness},"Break Impulse":_({splashBreakImpulseStrength:{label:"Strength",max:8,min:0,step:.05,value:r.splashBreakImpulseStrength},splashBreakImpulseRadius:{label:"Radius",max:12,min:.1,step:.1,value:r.splashBreakImpulseRadius},splashBreakImpulseDuration:{label:"Duration",max:2,min:.01,step:.01,value:r.splashBreakImpulseDuration}},{collapsed:!0})},{collapsed:!0})},{collapsed:!0}),Table:_({tablePosition:{label:"Position",step:.05,value:r.tablePosition},Dimensions:_({tableWidth:{label:"Width",max:16,min:.5,step:.05,value:r.tableWidth},tableDepth:{label:"Depth",max:16,min:.5,step:.05,value:r.tableDepth},tableThickness:{label:"Thickness",max:1.5,min:.02,step:.01,value:r.tableThickness}},{collapsed:!0}),Legs:_({tableLegWidth:{label:"Width",max:1.5,min:.05,step:.01,value:r.tableLegWidth},tableLegDepth:{label:"Depth",max:1.5,min:.05,step:.01,value:r.tableLegDepth},tableLegInset:{label:"Inset",max:2,min:0,step:.01,value:r.tableLegInset}},{collapsed:!0}),Appearance:_({tableRoughness:{label:"Roughness",max:1,min:0,step:.01,value:r.tableRoughness},tableMetalness:{label:"Metalness",max:1,min:0,step:.01,value:r.tableMetalness},Preset:_({tableWoodGenus:{label:"Species",options:io,value:r.tableWoodGenus},tableWoodFinish:{label:"Finish",options:no,value:r.tableWoodFinish}},{collapsed:!1}),Colors:_({tableWoodDarkGrainColor:{label:"Dark Grain",value:r.tableWoodDarkGrainColor},tableWoodLightGrainColor:{label:"Light Grain",value:r.tableWoodLightGrainColor}},{collapsed:!0}),Mapping:_({tableWoodGrainScale:{label:"Scale",step:.05,value:r.tableWoodGrainScale},tableWoodGrainOffset:{label:"Offset",step:.01,value:r.tableWoodGrainOffset},tableWoodGrainRotation:{label:"Rotation",step:1,value:r.tableWoodGrainRotation}},{collapsed:!0}),Structure:_({tableWoodCenterSize:{label:"Center Size",max:2,min:0,step:.01,value:r.tableWoodCenterSize},tableWoodLargeWarpScale:{label:"Large Warp",max:1,min:0,step:.001,value:r.tableWoodLargeWarpScale},tableWoodLargeGrainStretch:{label:"Large Stretch",max:1,min:0,step:.001,value:r.tableWoodLargeGrainStretch},tableWoodSmallWarpStrength:{label:"Small Warp Strength",max:.2,min:0,step:.001,value:r.tableWoodSmallWarpStrength},tableWoodSmallWarpScale:{label:"Small Warp Scale",max:16,min:.1,step:.05,value:r.tableWoodSmallWarpScale},tableWoodFineWarpStrength:{label:"Fine Warp Strength",max:.05,min:0,step:.001,value:r.tableWoodFineWarpStrength},tableWoodFineWarpScale:{label:"Fine Warp Scale",max:50,min:.1,step:.1,value:r.tableWoodFineWarpScale}},{collapsed:!0}),Rings:_({tableWoodRingThickness:{label:"Ring Thickness",max:.08,min:.01,step:5e-4,value:r.tableWoodRingThickness},tableWoodRingBias:{label:"Ring Bias",max:1,min:-.2,step:.001,value:r.tableWoodRingBias},tableWoodRingSizeVariance:{label:"Ring Size Variance",max:.5,min:0,step:.001,value:r.tableWoodRingSizeVariance},tableWoodRingVarianceScale:{label:"Ring Variance Scale",max:10,min:.1,step:.1,value:r.tableWoodRingVarianceScale},tableWoodBarkThickness:{label:"Bark Thickness",max:1.2,min:0,step:.01,value:r.tableWoodBarkThickness}},{collapsed:!0}),"Grain Detail":_({tableWoodSplotchScale:{label:"Splotch Scale",max:2.5,min:0,step:.01,value:r.tableWoodSplotchScale},tableWoodSplotchIntensity:{label:"Splotch Intensity",max:4,min:0,step:.01,value:r.tableWoodSplotchIntensity},tableWoodCellScale:{label:"Cell Scale",max:2e3,min:100,step:5,value:r.tableWoodCellScale},tableWoodCellSize:{label:"Cell Size",max:.5,min:.01,step:.001,value:r.tableWoodCellSize}},{collapsed:!0}),Finish:_({tableWoodClearcoat:{label:"Clearcoat",max:1,min:0,step:.01,value:r.tableWoodClearcoat},tableWoodClearcoatRoughness:{label:"Clearcoat Roughness",max:1,min:0,step:.01,value:r.tableWoodClearcoatRoughness}},{collapsed:!0})},{collapsed:!0})},{collapsed:!0}),Rocks:_({rockScale:{label:"Scale",max:.7,min:.1,step:.1,value:r.rockScale},rockSpeed:{label:"Speed",max:80,min:1,step:.5,value:r.rockSpeed},rockGravity:{label:"Gravity",max:30,min:0,step:.5,value:r.rockGravity},rockSpin:{label:"Spin",max:30,min:0,step:.5,value:r.rockSpin}},{collapsed:!0}),Fish:_({fishVisible:{label:"Visible",value:r.fishVisible},fishCount:{label:"Count",options:[0,1,2],value:r.fishCount},fishScale:{label:"Scale",max:.2,min:.001,step:.001,value:r.fishScale},fishSpeed:{label:"Speed",max:4,min:.05,step:.05,value:r.fishSpeed},fishRadiusX:{label:"Radius X",max:4,min:.05,step:.01,value:r.fishRadiusX},fishRadiusZ:{label:"Radius Z",max:4,min:.05,step:.01,value:r.fishRadiusZ},fishBaseYOffset:{label:"Base Offset",max:2,min:-1,step:.01,value:r.fishBaseYOffset},fishStrandLevel:{label:"Strand Level",max:1,min:0,step:.01,value:r.fishStrandLevel},fishEscapeDistance:{label:"Escape Dist",max:4,min:0,step:.01,value:r.fishEscapeDistance},fishBobAmplitude:{label:"Bob",max:1,min:0,step:.01,value:r.fishBobAmplitude},fishFlopAmplitude:{label:"Flop",max:Math.PI,min:0,step:.01,value:r.fishFlopAmplitude},fishMarkerSize:{label:"Marker Size",max:.4,min:.005,step:.005,value:r.fishMarkerSize},fishMarkerColor:{label:"Marker Color",value:r.fishMarkerColor}},{collapsed:!0}),Debug:_({showRapierDebug:{label:"Rapier Debug",value:r.showRapierDebug},splashRunning:{label:"Sim Running",value:r.splashRunning},splashShowParticles:{label:"Show Particles",value:r.splashShowParticles},showTankBounds:{label:"Tank Bounds",value:r.showTankBounds},showWaterBounds:{label:"Water Bounds",value:r.showWaterBounds},showFishMarkers:{label:"Fish Markers",value:r.showFishMarkers}},{collapsed:!0})}),{collapsed:!0});i(l),e.current={...n},g.useEffect(()=>{const S=`${n.tableWoodGenus}:${n.tableWoodFinish}`;s.current!==S&&(s.current=S,l(to({finish:n.tableWoodFinish,genus:n.tableWoodGenus})))},[n.tableWoodFinish,n.tableWoodGenus,l]);const o=g.useMemo(()=>({desktopFov:n.cameraDesktopFov,desktopPosition:[n.cameraDesktopPosition.x,n.cameraDesktopPosition.y,n.cameraDesktopPosition.z],desktopTarget:[n.cameraDesktopTarget.x,n.cameraDesktopTarget.y,n.cameraDesktopTarget.z],mobileFov:n.cameraMobileFov,mobilePosition:[n.cameraMobilePosition.x,n.cameraMobilePosition.y,n.cameraMobilePosition.z],mobileTarget:[n.cameraMobileTarget.x,n.cameraMobileTarget.y,n.cameraMobileTarget.z]}),[n.cameraDesktopFov,n.cameraDesktopPosition.x,n.cameraDesktopPosition.y,n.cameraDesktopPosition.z,n.cameraDesktopTarget.x,n.cameraDesktopTarget.y,n.cameraDesktopTarget.z,n.cameraMobileFov,n.cameraMobilePosition.x,n.cameraMobilePosition.y,n.cameraMobilePosition.z,n.cameraMobileTarget.x,n.cameraMobileTarget.y,n.cameraMobileTarget.z]),c=g.useMemo(()=>({ambientIntensity:n.ambientIntensity,backgroundColor:n.backgroundColor,directionalIntensity:n.directionalIntensity,directionalPosition:[n.directionalPosition.x,n.directionalPosition.y,n.directionalPosition.z],floorColor:n.floorColor,fogColor:n.fogColor,fogFar:n.fogFar,fogNear:n.fogNear,gridColor:n.gridColor}),[n.ambientIntensity,n.backgroundColor,n.directionalIntensity,n.directionalPosition.x,n.directionalPosition.y,n.directionalPosition.z,n.floorColor,n.fogColor,n.fogFar,n.fogNear,n.gridColor]),h=g.useMemo(()=>({boostMultiplier:n.operatorBoostMultiplier,liftSpeed:n.operatorLiftSpeed,maxFov:Math.max(n.operatorMinFov,n.operatorMaxFov),minFov:Math.min(n.operatorMinFov,n.operatorMaxFov),moveSpeed:n.operatorMoveSpeed,pointerLookSensitivity:n.operatorPointerLookSensitivity,stickLookSpeed:n.operatorStickLookSpeed,zoomSpeed:n.operatorZoomSpeed}),[n.operatorBoostMultiplier,n.operatorLiftSpeed,n.operatorMaxFov,n.operatorMinFov,n.operatorMoveSpeed,n.operatorPointerLookSensitivity,n.operatorStickLookSpeed,n.operatorZoomSpeed]),d=g.useMemo(()=>({position:[n.tankPosition.x,n.tankPosition.y,n.tankPosition.z],rotation:[n.tankRotation.x,n.tankRotation.y,n.tankRotation.z],scale:n.tankScale}),[n.tankPosition.x,n.tankPosition.y,n.tankPosition.z,n.tankRotation.x,n.tankRotation.y,n.tankRotation.z,n.tankScale]),u=g.useMemo(()=>({depth:n.tankDepth,drainRate:n.drainRate,glassColor:n.glassColor,glassOpacity:n.glassOpacity,glassThickness:n.glassThickness,height:n.tankHeight,sandColor:n.sandColor,splashBreakImpulseDuration:n.splashBreakImpulseDuration,splashBreakImpulseRadius:n.splashBreakImpulseRadius,splashBreakImpulseStrength:n.splashBreakImpulseStrength,splashColorDensity:n.splashColorDensity,splashGravity:n.splashGravity,splashMaxDelta:n.splashMaxDelta,splashParticleBudget:n.splashParticleBudget,splashRestDensity:n.splashRestDensity,splashRunning:n.splashRunning,splashShowParticles:n.splashShowParticles,splashSimSpeed:n.splashSimSpeed,splashStiffness:n.splashStiffness,splashViscosity:n.splashViscosity,splashWallStiffness:n.splashWallStiffness,spillExtent:n.spillExtent,spillOpacity:n.spillOpacity,spillThickness:n.spillThickness,tankScale:n.tankScale,visible:n.tankVisible,waterColor:n.waterColor,waterDisturbance:n.waterDisturbance,waterInset:n.waterInset,waterLevel:n.waterLevel,width:n.tankWidth}),[n.tankDepth,n.drainRate,n.glassColor,n.glassOpacity,n.glassThickness,n.tankHeight,n.sandColor,n.splashBreakImpulseDuration,n.splashBreakImpulseRadius,n.splashBreakImpulseStrength,n.splashColorDensity,n.splashGravity,n.splashMaxDelta,n.splashParticleBudget,n.splashRestDensity,n.splashRunning,n.splashShowParticles,n.splashSimSpeed,n.splashStiffness,n.splashViscosity,n.splashWallStiffness,n.spillExtent,n.spillOpacity,n.spillThickness,n.tankScale,n.tankVisible,n.waterColor,n.waterDisturbance,n.waterInset,n.waterLevel,n.tankWidth]),p=g.useMemo(()=>({color:n.tableWoodLightGrainColor,depth:n.tableDepth,legs:{depth:n.tableLegDepth,inset:n.tableLegInset,width:n.tableLegWidth},metalness:n.tableMetalness,position:[n.tablePosition.x,n.tablePosition.y,n.tablePosition.z],roughness:n.tableRoughness,thickness:n.tableThickness,wood:{barkThickness:n.tableWoodBarkThickness,cellScale:n.tableWoodCellScale,cellSize:n.tableWoodCellSize,centerSize:n.tableWoodCenterSize,clearcoat:n.tableWoodClearcoat,clearcoatRoughness:n.tableWoodClearcoatRoughness,darkGrainColor:n.tableWoodDarkGrainColor,fineWarpScale:n.tableWoodFineWarpScale,fineWarpStrength:n.tableWoodFineWarpStrength,finish:n.tableWoodFinish,grainOffset:[n.tableWoodGrainOffset.x,n.tableWoodGrainOffset.y,n.tableWoodGrainOffset.z],grainRotation:[n.tableWoodGrainRotation.x,n.tableWoodGrainRotation.y,n.tableWoodGrainRotation.z],grainScale:[n.tableWoodGrainScale.x,n.tableWoodGrainScale.y,n.tableWoodGrainScale.z],genus:n.tableWoodGenus,largeGrainStretch:n.tableWoodLargeGrainStretch,largeWarpScale:n.tableWoodLargeWarpScale,lightGrainColor:n.tableWoodLightGrainColor,ringBias:n.tableWoodRingBias,ringSizeVariance:n.tableWoodRingSizeVariance,ringThickness:n.tableWoodRingThickness,ringVarianceScale:n.tableWoodRingVarianceScale,smallWarpScale:n.tableWoodSmallWarpScale,smallWarpStrength:n.tableWoodSmallWarpStrength,splotchIntensity:n.tableWoodSplotchIntensity,splotchScale:n.tableWoodSplotchScale},width:n.tableWidth}),[n.tableDepth,n.tableLegDepth,n.tableLegInset,n.tableLegWidth,n.tableMetalness,n.tablePosition.x,n.tablePosition.y,n.tablePosition.z,n.tableRoughness,n.tableThickness,n.tableWoodBarkThickness,n.tableWoodCellScale,n.tableWoodCellSize,n.tableWoodCenterSize,n.tableWoodClearcoat,n.tableWoodClearcoatRoughness,n.tableWoodDarkGrainColor,n.tableWoodFineWarpScale,n.tableWoodFineWarpStrength,n.tableWoodFinish,n.tableWoodGenus,n.tableWoodGrainOffset.x,n.tableWoodGrainOffset.y,n.tableWoodGrainOffset.z,n.tableWoodGrainRotation.x,n.tableWoodGrainRotation.y,n.tableWoodGrainRotation.z,n.tableWoodGrainScale.x,n.tableWoodGrainScale.y,n.tableWoodGrainScale.z,n.tableWoodLargeGrainStretch,n.tableWoodLargeWarpScale,n.tableWoodLightGrainColor,n.tableWoodRingBias,n.tableWoodRingSizeVariance,n.tableWoodRingThickness,n.tableWoodRingVarianceScale,n.tableWoodSmallWarpScale,n.tableWoodSmallWarpStrength,n.tableWoodSplotchIntensity,n.tableWoodSplotchScale,n.tableWidth]),f=g.useMemo(()=>({escapeDistance:n.fishEscapeDistance,baseYOffset:n.fishBaseYOffset,bobAmplitude:n.fishBobAmplitude,count:n.fishCount,flopAmplitude:n.fishFlopAmplitude,markerColor:n.fishMarkerColor,markerSize:n.fishMarkerSize,radiusX:n.fishRadiusX,radiusZ:n.fishRadiusZ,scale:n.fishScale,speed:n.fishSpeed,strandLevel:n.fishStrandLevel,visible:n.fishVisible}),[n.fishEscapeDistance,n.fishBaseYOffset,n.fishBobAmplitude,n.fishCount,n.fishFlopAmplitude,n.fishMarkerColor,n.fishMarkerSize,n.fishRadiusX,n.fishRadiusZ,n.fishScale,n.fishSpeed,n.fishStrandLevel,n.fishVisible]),v=g.useMemo(()=>({gravity:n.rockGravity,scale:n.rockScale,speed:n.rockSpeed,spin:n.rockSpin}),[n.rockGravity,n.rockScale,n.rockSpeed,n.rockSpin]),b=g.useMemo(()=>({showFishMarkers:n.showFishMarkers,showRapierDebug:n.showRapierDebug,showTankBounds:n.showTankBounds,showWaterBounds:n.showWaterBounds}),[n.showFishMarkers,n.showRapierDebug,n.showTankBounds,n.showWaterBounds]);return{cameraConfig:o,cameraMode:n.cameraMode,debug:b,fish:f,operatorCamera:h,rocks:v,sceneEnvironment:c,table:p,tank:u,tankTransform:d}}const ao=0;function _t(){return Object.fromEntries(he.map(i=>[i,!1]))}function Lt(){return Object.fromEntries(he.map(i=>[i,{atSeconds:-1,id:0,point:[0,0,0],worldPoint:[0,0,0]}]))}function oo(i){const e=g.useRef(i),t=g.useRef(_t()),a=g.useRef(Lt()),r=g.useRef(0),s=g.useRef(i.waterLevel);g.useEffect(()=>{e.current=i,t.current=_t(),a.current=Lt(),r.current+=1,s.current=i.waterLevel},[i.depth,i.drainRate,i.glassThickness,i.height,i.waterInset,i.waterLevel,i.width]),ye((o,c)=>{const h=he.reduce((d,u)=>d+(t.current[u]?1:0),0);h&&(s.current=Math.max(ao,s.current-c*e.current.drainRate*h))});const n=g.useCallback((o,c,h)=>{if(!he.includes(o))return;const d=Array.isArray(c)?c:c?.toArray?.()??[0,0,0],u=Array.isArray(h)?h:h?.toArray?.()??d;t.current[o]=!0,a.current[o]={atSeconds:performance.now()/1e3,id:a.current[o].id+1,point:d,worldPoint:u}},[]),l=g.useCallback(()=>{t.current=_t(),a.current=Lt(),r.current+=1,s.current=e.current.waterLevel},[]);return g.useMemo(()=>({breakPane:n,getPaneBreakEvent:o=>a.current[o]??null,getResetNonce:()=>r.current,getWaterLevel:()=>s.current,getBrokenPaneCount:()=>he.reduce((o,c)=>o+(t.current[c]?1:0),0),getFirstBrokenPane:()=>he.find(o=>t.current[o])||null,isAnyPaneBroken:()=>he.some(o=>t.current[o]),isFrontPaneBroken:()=>t.current.front,isPaneBroken:o=>!!t.current[o],resetRuntime:l}),[n,l])}const fi=[18,.25,18],lo=[0,Ie-fi[1],0],co=1/60;function Po(){const{cameraConfig:i,cameraMode:e,debug:t,fish:a,operatorCamera:r,rocks:s,sceneEnvironment:n,table:l,tank:o,tankTransform:c}=so(),h=g.useRef([]),d=oo(o),u=g.useRef([]);return m.jsxs(m.Fragment,{children:[m.jsx(pr,{cameraConfig:i,cameraMode:e,operatorCamera:r,sceneEnvironment:n}),m.jsxs(zi,{debug:t.showRapierDebug,interpolate:!0,timeStep:co,children:[m.jsx($e,{type:"fixed",colliders:!1,children:m.jsx(Ue,{args:fi,position:lo,friction:1.15,restitution:.04})}),m.jsx(Vr,{collisionMeshesRef:u,table:l,tank:o}),m.jsx(zr,{fluidCouplersRef:h,runtime:d,table:l,tank:o}),m.jsxs("group",{position:c.position,rotation:c.rotation,scale:c.scale,children:[m.jsx(Ja,{debug:t,externalCollisionObjectsRef:u,fluidCouplersRef:h,rocks:s,runtime:d,tank:o}),m.jsx($i,{fish:a,runtime:d,tank:o,showMarkers:t.showFishMarkers})]})]})]})}export{Po as default};
