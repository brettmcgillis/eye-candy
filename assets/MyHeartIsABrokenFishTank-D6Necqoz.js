import{aH as he,j as f,r as p,n as ie,aM as fe,m as ne,aa as ut,b4 as Tn,p as V,E as kn,V as B,aZ as dt,Q as Pe,z as Wn,q as me,M as A,au as pt,ab as sn,bh as Dn,ah as Rn,ai as zn,N as ke,ax as Cn,bg as Bn,B as In,J as Fn,U as F}from"./index-CgfsD5Hk.js";import{R as Te,C as ye,i as Gn,P as _n}from"./react-three-rapier.esm-6j0CbIqq.js";import{u as ge}from"./Gltf-CU42C1_Y.js";import{u as Ln,a as En,b as On}from"./useOperatorInput--lXuRHav.js";import{P as An}from"./PerspectiveCamera-BUWk4mgM.js";import{O as Vn}from"./OrbitControls-DinOYh3w.js";import{d as Nn,a3 as jn,F as $,f as j,m as ht,K as on,i as we,j as ae,l as ln,E as cn,aj as Oe,s as Un,q as Hn,b4 as Yn,b8 as wt,z as re,L as un,b9 as Ue,ah as He,aX as Xn,u as N}from"./three.tsl-BycLsylh.js";import{f as Zn,O as Kn}from"./three-pinata.es-DwUG7Wks.js";import{b as qn}from"./NurbsWaterColumn-DoTdnqEX.js";import{u as $n}from"./usePresetsFolder-D1bq4CZk.js";import"./constants-BOCONuvy.js";import"./extends-CF3RwP-h.js";import"./Fbo-BjOhDor8.js";import"./Line2-6W8Zk7zh.js";function Qn(n){const{nodes:t,materials:i}=ge(he("/goldfish.glb"));return f.jsx("group",{...n,dispose:null,children:f.jsx("group",{rotation:[-Math.PI/2,0,0],scale:.033,children:f.jsx("group",{rotation:[Math.PI/2,0,0],children:f.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:t.fish_Material006_0.geometry,material:i["Material.006"],position:[0,29.917,18.927],rotation:[-Math.PI/2,0,0],scale:9.747})})})})}ge.preload(he("/goldfish.glb"));const Mt=.2,Jn=.12,ei=.08,ti=.14,ue=.18;function de(n){const t=Math.max(n.width-n.glassThickness*2-n.waterInset*2,Mt),i=Math.max(n.depth-n.glassThickness*2-n.waterInset*2,Mt),s=Math.max(n.height-n.glassThickness*2-ue-n.waterInset,Jn),r=Math.max(ei,s*n.waterLevel),a=-n.height/2+ue/2,e=-n.height/2+ue+r/2,c=-n.height/2+ue+.12,l=c+Math.max(ti,r-.16);return{innerDepth:i,innerHeight:s,innerWidth:t,maxFishY:l,minFishY:c,sandY:a,waterHeight:r,waterY:e}}const ni={back:[0,0,-1],front:[0,0,1],left:[-1,0,0],right:[1,0,0]},ii=2,ri=[0,Math.PI],ai=[-.22,.22],Pt=.06;function si(n,t,i,s){const r=ai[n]??0;if(!t)return{x:r,y:-s.height/2+ue+Pt,z:n===0?-.16:.16};const[a,,e]=ni[t],c=-s.height/2+Pt;return e!==0?{x:r,y:c,z:e*(s.depth/2+i.escapeDistance)}:{x:a*(s.width/2+i.escapeDistance),y:c,z:r}}function oi(n){switch(n){case"back":return Math.PI;case"left":return-Math.PI/2;case"right":return Math.PI/2;default:return 0}}function li({fish:n,runtime:t,tank:i,showMarkers:s=!1}){const r=p.useRef([]),a=p.useMemo(()=>Array.from({length:ii},(e,c)=>l=>{r.current[c]=l}),[]);return ie(e=>{if(!n.visible)return;const c=e.clock.elapsedTime*n.speed,l=t?t.getWaterLevel():i.waterLevel,u=t?t.getFirstBrokenPane():null,{innerDepth:d,innerWidth:h,maxFishY:o,minFishY:m,waterHeight:S}=de({...i,waterLevel:l}),x=Math.min(n.radiusX,h*.42),y=Math.min(n.radiusZ,d*.42),v=m+Math.max(.05,S*.45)+n.baseYOffset,g=l<=n.strandLevel;for(let w=0;w<n.count;w+=1){const b=r.current[w];if(b){const W=ri[w]??0,T=c+W;if(g){const I=e.clock.elapsedTime*7+W,M=si(w,u,n,i);b.position.set(M.x,M.y,M.z),b.rotation.y=oi(u),b.rotation.x=Math.sin(I)*n.flopAmplitude,b.rotation.z=Math.cos(I*.72)*n.flopAmplitude*.35}else{const I=Math.cos(T)*x,M=Math.sin(T)*y,z=Math.min(o,Math.max(m,v+Math.sin(T*2.1)*n.bobAmplitude));b.position.set(I,z,M),b.rotation.x=0,b.rotation.y=-T+Math.PI/2,b.rotation.z=Math.sin(T*2.8)*.08}}}}),Array.from({length:n.count},(e,c)=>f.jsxs("group",{ref:a[c],visible:n.visible,children:[f.jsx(Qn,{scale:n.scale}),s&&f.jsxs("mesh",{position:[0,.08,0],children:[f.jsx("sphereGeometry",{args:[n.markerSize,12,12]}),f.jsx("meshBasicMaterial",{color:n.markerColor})]})]},`fish-${c}`))}const pe=-.9,ci=.18,ui=.08,di=.08,pi=.12,hi=.08,fi=1.6,mi=.16,gi=1.9;function xi(n){return n.width+Math.max(gi,n.spillExtent*1.25)}function Si(n){return n.depth+Math.max(fi,n.spillExtent*1.1)}function vi(n){return Math.max(mi,n.glassThickness*3)}function bi(n){return Math.max(hi,n*1.25)}function yi(n){return Math.max(di,n*1.25)}function wi(n){return Math.max(pi,n*1.75)}function ft(n,t={}){const i=t.position??[0,0,0],s=Math.max(.01,t.width??xi(n)),r=Math.max(.01,t.depth??Si(n)),a=Math.max(.01,t.thickness??vi(n)),e=-n.height/2+i[1],c=Math.max(ci,a*1.4),l=Math.max(ui,a*.65),u=e-c/2,d=Math.max(.01,t.legs?.width??bi(a)),h=Math.max(.01,t.legs?.depth??yi(a)),o=Math.max(0,t.legs?.inset??wi(a)),m=Math.min(o,Math.max(0,s/2-d/2)),S=Math.min(o,Math.max(0,r/2-h/2)),x=Math.max(0,s/2-m-d/2),y=Math.max(0,r/2-S-h/2),v=Math.max(.01,e-a-pe),g=pe+v/2,w=[d/2,v/2,h/2],b=[d,v,h];return{depth:r,edgeBand:Math.max(.28,a*3),edgeColliders:[{args:[s/2,c/2,l/2],key:"front",position:[i[0],u,i[2]+r/2-l/2]},{args:[s/2,c/2,l/2],key:"back",position:[i[0],u,i[2]-r/2+l/2]},{args:[l/2,c/2,Math.max(.01,r/2-l)],key:"left",position:[i[0]-s/2+l/2,u,i[2]]},{args:[l/2,c/2,Math.max(.01,r/2-l)],key:"right",position:[i[0]+s/2-l/2,u,i[2]]}],legs:[{halfExtents:w,key:"front-left",position:[i[0]-x,g,i[2]+y],size:b},{halfExtents:w,key:"front-right",position:[i[0]+x,g,i[2]+y],size:b},{halfExtents:w,key:"back-left",position:[i[0]-x,g,i[2]-y],size:b},{halfExtents:w,key:"back-right",position:[i[0]+x,g,i[2]-y],size:b}],thickness:a,topHalfExtents:[s/2,a/2,r/2],topPosition:[i[0],e-a/2,i[2]],topY:e,width:s}}const Ye=24,Mi=24;function Pi({cameraConfig:n,cameraMode:t="Fixed",operatorCamera:i,sceneEnvironment:s}){const[r,a]=p.useState(null),[e,c]=p.useState(null),{cameraFov:l,cameraPosition:u,cameraTarget:d}=Ln(n),h=t==="Operator",o=t==="Orbit",m=En({enabled:h});return On({enabled:h,inputRef:m,config:i}),p.useLayoutEffect(()=>{if(!h&&r){if(r.position.set(...u),r.fov=l,r.updateProjectionMatrix(),!e){r.lookAt(...d);return}e.target.set(...d),e.update()}},[l,r,u,d,e,h]),f.jsxs(f.Fragment,{children:[f.jsx(An,{ref:a,makeDefault:!0,position:u,fov:l,near:.1,far:100}),f.jsx(Vn,{ref:c,makeDefault:!0,target:d,enabled:o,enablePan:o,enableRotate:o,enableZoom:o}),f.jsx("color",{attach:"background",args:[s.backgroundColor]}),f.jsx("fog",{attach:"fog",args:[s.fogColor,Math.min(s.fogNear,s.fogFar),Math.max(s.fogNear,s.fogFar)]}),f.jsx("ambientLight",{intensity:s.ambientIntensity}),f.jsx("directionalLight",{castShadow:!0,intensity:s.directionalIntensity,position:s.directionalPosition,"shadow-mapSize-width":1024,"shadow-mapSize-height":1024}),f.jsxs("mesh",{position:[0,pe,0],receiveShadow:!0,rotation:[-Math.PI/2,0,0],children:[f.jsx("planeGeometry",{args:[Ye,Ye]}),f.jsx("meshStandardMaterial",{color:s.floorColor})]}),f.jsx("gridHelper",{args:[Ye,Mi,s.gridColor,s.gridColor],position:[0,pe+.002,0]})]})}const Ti=["glass","glass_2","glass_5"],K=["front","back","left","right"],ki=[{key:"left",geometryKey:"glass_left",materialKey:"glass"},{key:"front",geometryKey:"glass_back",materialKey:"glass"},{key:"right",geometryKey:"glass_right",materialKey:"glass"},{key:"back",geometryKey:"glass_front",materialKey:"glass"}],dn=[{geometryKey:"rubber",materialKey:"rubber"},{geometryKey:"plastic_1",materialKey:"plastic_1"},{geometryKey:"rock_1",materialKey:"rock_1"},{geometryKey:"sand",materialKey:"sand"},{geometryKey:"rock_3",materialKey:"rock_3"},{geometryKey:"rock_4",materialKey:"rock_4"},{geometryKey:"rock_5",materialKey:"rock_5"},{geometryKey:"rock_6",materialKey:"rock_6"},{geometryKey:"rock_7",materialKey:"rock_7"},{geometryKey:"rock_2",materialKey:"rock_2"},{geometryKey:"stone",materialKey:"stone"},{geometryKey:"glass_2",materialKey:"glass_2"},{geometryKey:"glass_5",materialKey:"glass_5"},{geometryKey:"plastic_2",materialKey:"plastic_1"},{geometryKey:"lid_1",materialKey:"plastic_1"}],Tt=dn.map(({geometryKey:n})=>n),ot=fe.forwardRef(function({glassColor:t,glassOpacity:i,paneProps:s={},renderPane:r,renderStaticMesh:a,sandColor:e,staticMeshProps:c={},...l},u){const{nodes:d,materials:h}=ge(he("/fishTank.glb")),o=p.useMemo(()=>{const m=Object.fromEntries(Object.entries(h).map(([S,x])=>[S,x.clone()]));return Ti.forEach(S=>{const x=m[S];x&&(t&&x.color&&x.color.set(t),i!=null&&(x.opacity=i,x.transparent=i<1||x.transparent,x.needsUpdate=!0))}),e&&m.sand?.color&&m.sand.color.set(e),m},[t,i,h,e]);return f.jsxs("group",{ref:u,...l,dispose:null,children:[dn.map(({geometryKey:m,materialKey:S})=>a?a({geometry:d[m].geometry,material:o[S],meshKey:m,meshProps:c[m]}):f.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:d[m].geometry,material:o[S],...c[m]},m)),ki.map(({geometryKey:m,key:S,materialKey:x})=>r?r({geometry:d[m].geometry,material:o[x],paneKey:S,paneProps:s[S]}):f.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:d[m].geometry,material:o[x],...s[S]},S))]})});ot.displayName="FishTank";ge.preload(he("/fishTank.glb"));const Wi=.996,Di=.18,Ri=36,zi=.985,Ci=.12,Bi=.28,Ii=new kn,kt=new B,Wt=new B,Dt=new B,q=new B,Rt=new Pe,zt=new dt,Z=new B,Se=new B;function Ae(n,t){return Math.max(0,Math.min(t,n))}function Ct(n,t,i,s,r){const a=n,e=Ae(Math.round((i+t.domainWidth/2)/t.domainWidth*(t.resolution-1)),t.resolution-1),c=Ae(Math.round((s+t.domainDepth/2)/t.domainDepth*(t.resolution-1)),t.resolution-1);for(let l=-2;l<=2;l+=1)for(let u=-2;u<=2;u+=1){const d=e+u,h=c+l;if(d>=0&&d<t.resolution&&h>=0&&h<t.resolution){const o=h*t.resolution+d,m=Math.exp(-(u*u+l*l)*.65);a[o]+=r*m}}}function Fi(n,t,i,s,r){const a=n,e=Ae(Math.round((i+t.domainWidth/2)/t.domainWidth*(t.resolution-1)),t.resolution-1),c=Ae(Math.round((s+t.domainDepth/2)/t.domainDepth*(t.resolution-1)),t.resolution-1);for(let l=-2;l<=2;l+=1)for(let u=-2;u<=2;u+=1){const d=e+u,h=c+l;if(d>=0&&d<t.resolution&&h>=0&&h<t.resolution){const o=h*t.resolution+d,m=Math.exp(-(u*u+l*l)*.58);a[o]=Math.min(t.maxDepth,a[o]+r*m)}}}function Gi({resolution:n,tank:t,xCoords:i,zCoords:s}){const r=t.depth/2,a=t.width/2,e=t.depth*.42,c=t.width*.42,l=Math.max(Ci,t.spillThickness*4),u=Math.max(Bi,t.spillThickness*6),d={back:[],front:[],left:[],right:[]};for(let h=0;h<n*n;h+=1){const o=i[h],m=s[h];Math.abs(o)<=c&&m>=r-l&&m<=r+u&&d.front.push(h),Math.abs(o)<=c&&m<=-r+l&&m>=-r-u&&d.back.push(h),Math.abs(m)<=e&&o>=a-l&&o<=a+u&&d.right.push(h),Math.abs(m)<=e&&o<=-a+l&&o>=-a-u&&d.left.push(h)}return d}function _i(n,t){const i=ft(n,t),s=i.width,r=i.depth,a=Ri,e=new Tn(s,r,a-1,a-1);e.rotateX(-Math.PI/2);const c=e.getAttribute("position"),l=Float32Array.from(c.array),u=new Float32Array(a*a),d=Math.max(0,n.depth/2-n.glassThickness),h=Math.max(0,n.width/2-n.glassThickness),o=new Uint8Array(a*a),m=new Float32Array(a*a),S=new Float32Array(a*a);for(let x=0;x<a*a;x+=1){m[x]=l[x*3],S[x]=l[x*3+2];const y=m[x],v=S[x],g=Math.min(s/2-Math.abs(y),r/2-Math.abs(v));u[x]=V.clamp(1-g/i.edgeBand,0,1),o[x]=Math.abs(y)<h&&Math.abs(v)<d?1:0}return{basePositions:l,blockedHalfDepth:d,blockedHalfWidth:h,depthCurrent:new Float32Array(a*a),depthNext:new Float32Array(a*a),domainDepth:r,domainWidth:s,edgeDrain:u,geometry:e,maxDepth:Math.max(n.spillThickness*1.8,.03),positionAttr:c,resolution:a,sourceIndicesByPane:Gi({resolution:a,tank:n,xCoords:m,zCoords:S}),vertexCount:a*a,waveCurrent:new Float32Array(a*a),waveNext:new Float32Array(a*a),wavePrev:new Float32Array(a*a),xCoords:m,zCoords:S,tankBaseMask:o}}function Li(n){n.depthCurrent.fill(0),n.depthNext.fill(0),n.waveCurrent.fill(0),n.waveNext.fill(0),n.wavePrev.fill(0)}function Ei({fluidCouplersRef:n,runtime:t,table:i,tank:s}){const r=ne(S=>S.camera),a=ne(S=>S.gl),e=p.useRef(new WeakMap),c=p.useRef(t?.getResetNonce?.()??0),l=ne(S=>S.pointer),u=p.useRef(null),d=p.useRef(null),h=a?.backend?.isWebGPUBackend===!0&&!!a?.backend?.device&&!!a?.backend?.context&&typeof navigator<"u"&&!!navigator.gpu,o=p.useMemo(()=>_i(s,i),[i.depth,i.position,i.thickness,i.width,s.depth,s.glassThickness,s.height,s.spillExtent,s.spillThickness,s.width]),m=ft(s,i);return ie((S,x)=>{if(h)return;const y=t?.getResetNonce?.()??0;y!==c.current&&(c.current=y,Li(o),d.current=null,u.current&&(u.current.visible=!1));const v=t?t.getWaterLevel():s.waterLevel,g=t?t.getBrokenPaneCount():0,w=Math.min(x*60,2),b=s.waterLevel>0?1-v/s.waterLevel:0,W=Math.max(0,1-x*.02);for(let M=0;M<o.resolution;M+=1)for(let z=0;z<o.resolution;z+=1){const D=M*o.resolution+z;if(o.tankBaseMask[D])o.depthNext[D]=0,o.waveNext[D]=0;else if(z===0||M===0||z===o.resolution-1||M===o.resolution-1)o.depthNext[D]=o.depthCurrent[D]*.9,o.waveNext[D]=0;else{const _=D-1,U=D+1,L=D-o.resolution,H=D+o.resolution,k=(o.depthCurrent[_]+o.depthCurrent[U]+o.depthCurrent[L]+o.depthCurrent[H])/4,C=o.edgeDrain[D],P=Math.max(0,1-C*.18*w);o.depthNext[D]=V.clamp((o.depthCurrent[D]+(k-o.depthCurrent[D])*Di*w)*Wi*W*P,0,o.maxDepth),o.waveNext[D]=((o.waveCurrent[_]+o.waveCurrent[U]+o.waveCurrent[L]+o.waveCurrent[H])*.5-o.wavePrev[D])*zi*Math.max(.45,1-C*.22)}}if(g&&v>0){const M=v*s.spillThickness*.18*w,z=M*.7+b*.0025;K.forEach(D=>{t?.isPaneBroken(D)&&o.sourceIndicesByPane[D].forEach(_=>{o.tankBaseMask[_]||(o.depthNext[_]=Math.min(o.maxDepth,o.depthNext[_]+M),o.waveNext[_]+=z)})})}if(u.current&&(g||b>.01))if(u.current.getWorldQuaternion(Rt),kt.set(0,1,0).applyQuaternion(Rt).normalize(),u.current.getWorldPosition(Wt),zt.setFromCamera(l,r),zt.ray.intersectPlane(Ii.setFromNormalAndCoplanarPoint(kt,Wt),Dt))if(q.copy(Dt),u.current.worldToLocal(q),Math.abs(q.x)<=o.domainWidth/2&&Math.abs(q.z)<=o.domainDepth/2&&!(Math.abs(q.x)<o.blockedHalfWidth&&Math.abs(q.z)<o.blockedHalfDepth)){const M=d.current;if(M){const z=M.distanceTo(q),D=Math.min(s.spillThickness*.8,z*s.waterDisturbance*3.2);D>5e-4&&Ct(o.waveNext,o,q.x,q.z,D)}d.current=q.clone()}else d.current=null;else d.current=null;else d.current=null;if(u.current){const M=e.current;(n?.current??[]).forEach(z=>{if(!z)return;z.getWorldPosition(Se);const D=M.get(z);if(!D){M.set(z,Se.clone());return}if(Z.copy(Se),u.current.worldToLocal(Z),Math.abs(Z.x)<=o.domainWidth/2&&Math.abs(Z.z)<=o.domainDepth/2&&Math.abs(Z.y)<=.28&&!(Math.abs(Z.x)<o.blockedHalfWidth&&Math.abs(Z.z)<o.blockedHalfDepth)){const _=Se.distanceTo(D)/Math.max(x,.008333333333333333),U=Math.min(o.maxDepth*.85,_*65e-5),L=Math.min(o.maxDepth*.14,_*8e-5);U>4e-4&&Ct(o.waveNext,o,Z.x,Z.z,U),L>15e-5&&Fi(o.depthNext,o,Z.x,Z.z,L)}D.copy(Se)})}[o.depthCurrent,o.depthNext]=[o.depthNext,o.depthCurrent],[o.wavePrev,o.waveCurrent,o.waveNext]=[o.waveCurrent,o.waveNext,o.wavePrev];const T=o.positionAttr.array;let I=0;for(let M=0;M<o.vertexCount;M+=1){const z=o.depthCurrent[M],D=o.waveCurrent[M]*Math.min(1,z/Math.max(o.maxDepth,1e-4));T[M*3+1]=o.basePositions[M*3+1]+(o.tankBaseMask[M]?0:z+D),I=Math.max(I,z+Math.max(D,0))}o.positionAttr.needsUpdate=!0,o.geometry.computeVertexNormals(),u.current&&(u.current.visible=I>8e-4)}),h?null:f.jsx("mesh",{ref:u,geometry:o.geometry,position:[i.position[0],m.topY+.002,i.position[2]],receiveShadow:!0,visible:!1,children:f.jsx("meshPhysicalMaterial",{clearcoat:.45,color:s.waterColor,opacity:s.spillOpacity,roughness:.08,side:ut,thickness:.35,transmission:.18,transparent:!0})})}const Ve=$(([n,t,i,s,r,a])=>{const e=n.sub(t).div(i.sub(t)),c=s.add(e.mul(r.sub(s)));return re(a,ht(cn(c,r),s),c)}),Oi=Xn(`
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
`),Bt=$(([n,t,i])=>{const s=j(1).sub(n),r=ae(1),a=r.sub(r.sub(i).mul(r.sub(t)));return s.mul(t).add(n.mul(r.sub(t).mul(i).mul(t).add(t.mul(a))))}),pn=$(([n,t,i,s,r])=>{const a=j(1).toVar(),e=j(1).toVar(),c=j(0).toVar(),l=j(0).toVar(),u=t.floor();un(u,()=>{const o=He(n.mul(a));l.addAssign(o.mul(e)),c.addAssign(e),e.mulAssign(i),a.mulAssign(s)});const d=t.sub(u),h=d.greaterThan(.001);return re(h,re(r.equal(1),(()=>{const o=He(n.mul(a)),m=l.add(o.mul(e)),S=c.add(e),x=l.div(c).mul(.5).add(.5),y=m.div(S).mul(.5).add(.5);return we(x,y,d)})(),(()=>{const o=He(n.mul(a)),m=l.add(o.mul(e));return we(l,m,d)})()),re(r.equal(1),l.div(c).mul(.5).add(.5),l))}),Ai=$(([n,t,i,s,r])=>{const a=j(1).toVar(),e=j(1).toVar(),c=j(0).toVar(),l=ae(0).toVar(),u=t.floor();un(u,()=>{const o=Ue(n.mul(a));l.addAssign(o.mul(e)),c.addAssign(e),e.mulAssign(i),a.mulAssign(s)});const d=t.sub(u),h=d.greaterThan(.001);return re(h,re(r.equal(1),(()=>{const o=Ue(n.mul(a)),m=l.add(o.mul(e)),S=c.add(e),x=l.div(c).mul(.5).add(.5),y=m.div(S).mul(.5).add(.5);return we(x,y,d)})(),(()=>{const o=Ue(n.mul(a)),m=l.add(o.mul(e));return we(l,m,d)})()),re(r.equal(1),l.div(c).mul(.5).add(.5),l))}),Vi=$(([n,t])=>{const i=n.mul(ae(1,1,0)).length();return Ve(i,0,1,0,t,!0)}),Fe=$(([n,t,i,s])=>{const r=ae(i,i,s).mul(n),a=Ai(r.mul(1.6*1.5),j(1),j(.5),j(2),ln(1)).sub(.5).mul(t),e=n.mul(ae(1,1,0)),c=e.normalize();return a.mul(c).add(e)}),Ni=$(([n,t,i,s,r,a])=>{const e=pn(n.mul(r),j(1),j(.5),j(1),ln(1)).mul(s).add(n).mul(t).fract().mul(a),c=cn(Ve(e,0,i,0,1,Oe(!0)),Ve(e,i,1,1,0,Oe(!0))),l=ht(on.length().div(10),1);return Un(l.negate(),l,c.sub(.5)).mul(.5).add(.5)}),ji=$(([n,t,i,s])=>{const r=Hn(Yn(n.y,n.x).div(wt).add(.5),0,1).mul(wt.mul(3)),a=ae(r.sin(),i,r.cos().mul(t.z)),e=ae(.1,1.19,.05).mul(a);return pn(e.mul(s),j(1),j(.5),j(2),Oe(!0))}),Ui=$(([n,t,i])=>{const s=Fe(n.mul(t.div(50)),t.div(1e3),.1,1.77),r=Oi(s.xy.mul(75),.5,1);return Ve(r,i,i.add(.21),0,1,Oe(!0))}),Hi=$(([n,t,i,s,r,a,e,c,l,u,d,h,o,m,S,x,y,v,g])=>{const w=Vi(n,t),b=Fe(Fe(n,w,i,s),r,a,.17),W=Fe(b,e,c,.17),T=Ni(W.length(),j(1).div(l),u,d,h,o),I=ji(W,n,W.length(),m),M=Ui(b,x,y.div(ht(on.length().mul(10),1))),z=we(v,g,T);return Bt(S,Bt(.407,z,M),I)}),Yi={teak:{transformationMatrix:new A().identity(),centerSize:1.11,largeWarpScale:.32,largeGrainStretch:.24,smallWarpStrength:.059,smallWarpScale:2,fineWarpStrength:.006,fineWarpScale:32.8,ringThickness:1/34,ringBias:.03,ringSizeVariance:.03,ringVarianceScale:4.4,barkThickness:.3,splotchScale:.2,splotchIntensity:.541,cellScale:910,cellSize:.1,darkGrainColor:"#0c0504",lightGrainColor:"#926c50"},walnut:{transformationMatrix:new A().identity(),centerSize:1.07,largeWarpScale:.42,largeGrainStretch:.34,smallWarpStrength:.016,smallWarpScale:10.3,fineWarpStrength:.028,fineWarpScale:12.7,ringThickness:1/32,ringBias:.08,ringSizeVariance:.03,ringVarianceScale:5.5,barkThickness:.98,splotchScale:1.84,splotchIntensity:.97,cellScale:710,cellSize:.31,darkGrainColor:"#311e13",lightGrainColor:"#523424"},white_oak:{transformationMatrix:new A().identity(),centerSize:1.23,largeWarpScale:.21,largeGrainStretch:.21,smallWarpStrength:.034,smallWarpScale:2.44,fineWarpStrength:.01,fineWarpScale:14.3,ringThickness:1/34,ringBias:.82,ringSizeVariance:.16,ringVarianceScale:1.4,barkThickness:.7,splotchScale:.2,splotchIntensity:.541,cellScale:800,cellSize:.28,darkGrainColor:"#8b4c21",lightGrainColor:"#c57e43"},pine:{transformationMatrix:new A().identity(),centerSize:1.23,largeWarpScale:.21,largeGrainStretch:.18,smallWarpStrength:.041,smallWarpScale:2.44,fineWarpStrength:.006,fineWarpScale:23.2,ringThickness:1/24,ringBias:.1,ringSizeVariance:.07,ringVarianceScale:5,barkThickness:.35,splotchScale:.51,splotchIntensity:3.32,cellScale:1480,cellSize:.07,darkGrainColor:"#c58355",lightGrainColor:"#d19d61"},poplar:{transformationMatrix:new A().identity(),centerSize:1.43,largeWarpScale:.33,largeGrainStretch:.18,smallWarpStrength:.04,smallWarpScale:4.3,fineWarpStrength:.004,fineWarpScale:33.6,ringThickness:1/37,ringBias:.07,ringSizeVariance:.03,ringVarianceScale:3.8,barkThickness:.3,splotchScale:1.92,splotchIntensity:.71,cellScale:830,cellSize:.04,darkGrainColor:"#716347",lightGrainColor:"#998966"},maple:{transformationMatrix:new A().identity(),centerSize:1.4,largeWarpScale:.38,largeGrainStretch:.25,smallWarpStrength:.067,smallWarpScale:2.5,fineWarpStrength:.005,fineWarpScale:33.6,ringThickness:1/35,ringBias:.1,ringSizeVariance:.07,ringVarianceScale:4.6,barkThickness:.61,splotchScale:.46,splotchIntensity:1.49,cellScale:800,cellSize:.03,darkGrainColor:"#b08969",lightGrainColor:"#bc9d7d"},red_oak:{transformationMatrix:new A().identity(),centerSize:1.21,largeWarpScale:.24,largeGrainStretch:.25,smallWarpStrength:.044,smallWarpScale:2.54,fineWarpStrength:.01,fineWarpScale:14.5,ringThickness:1/34,ringBias:.92,ringSizeVariance:.03,ringVarianceScale:5.6,barkThickness:1.01,splotchScale:.28,splotchIntensity:3.48,cellScale:800,cellSize:.25,darkGrainColor:"#af613b",lightGrainColor:"#e0a27a"},cherry:{transformationMatrix:new A().identity(),centerSize:1.33,largeWarpScale:.11,largeGrainStretch:.33,smallWarpStrength:.024,smallWarpScale:2.48,fineWarpStrength:.01,fineWarpScale:15.3,ringThickness:1/36,ringBias:.02,ringSizeVariance:.04,ringVarianceScale:6.5,barkThickness:.09,splotchScale:1.27,splotchIntensity:1.24,cellScale:1530,cellSize:.15,darkGrainColor:"#913f27",lightGrainColor:"#b45837"},cedar:{transformationMatrix:new A().identity(),centerSize:1.11,largeWarpScale:.39,largeGrainStretch:.12,smallWarpStrength:.061,smallWarpScale:1.9,fineWarpStrength:.006,fineWarpScale:4.8,ringThickness:1/25,ringBias:.01,ringSizeVariance:.07,ringVarianceScale:6.7,barkThickness:.1,splotchScale:.61,splotchIntensity:2.54,cellScale:630,cellSize:.19,darkGrainColor:"#9a5b49",lightGrainColor:"#ae745e"},mahogany:{transformationMatrix:new A().identity(),centerSize:1.25,largeWarpScale:.26,largeGrainStretch:.29,smallWarpStrength:.044,smallWarpScale:2.54,fineWarpStrength:.01,fineWarpScale:15.3,ringThickness:1/38,ringBias:.01,ringSizeVariance:.33,ringVarianceScale:1.2,barkThickness:.07,splotchScale:.77,splotchIntensity:1.39,cellScale:1400,cellSize:.23,darkGrainColor:"#501d12",lightGrainColor:"#6d3722"}},hn=["teak","walnut","white_oak","pine","poplar","maple","red_oak","cherry","cedar","mahogany"],fn=["raw","matte","semigloss","gloss"];function Ne(n,t){const i=Yi[n];let s,r,a;switch(t){case"gloss":a=.2,r=.1,s=1;break;case"semigloss":a=.4,r=.4,s=1;break;case"matte":a=.6,r=1,s=1;break;default:a=1,r=0,s=0}return{...i,transformationMatrix:new A().copy(i.transformationMatrix),genus:n,finish:t,clearcoat:s,clearcoatRoughness:r,clearcoatDarken:a}}const O=Ne(hn[0],fn[0]),R={};R.centerSize=N(O.centerSize).onObjectUpdate(({material:n})=>n.centerSize);R.largeWarpScale=N(O.largeWarpScale).onObjectUpdate(({material:n})=>n.largeWarpScale);R.largeGrainStretch=N(O.largeGrainStretch).onObjectUpdate(({material:n})=>n.largeGrainStretch);R.smallWarpStrength=N(O.smallWarpStrength).onObjectUpdate(({material:n})=>n.smallWarpStrength);R.smallWarpScale=N(O.smallWarpScale).onObjectUpdate(({material:n})=>n.smallWarpScale);R.fineWarpStrength=N(O.fineWarpStrength).onObjectUpdate(({material:n})=>n.fineWarpStrength);R.fineWarpScale=N(O.fineWarpScale).onObjectUpdate(({material:n})=>n.fineWarpScale);R.ringThickness=N(O.ringThickness).onObjectUpdate(({material:n})=>n.ringThickness);R.ringBias=N(O.ringBias).onObjectUpdate(({material:n})=>n.ringBias);R.ringSizeVariance=N(O.ringSizeVariance).onObjectUpdate(({material:n})=>n.ringSizeVariance);R.ringVarianceScale=N(O.ringVarianceScale).onObjectUpdate(({material:n})=>n.ringVarianceScale);R.barkThickness=N(O.barkThickness).onObjectUpdate(({material:n})=>n.barkThickness);R.splotchScale=N(O.splotchScale).onObjectUpdate(({material:n})=>n.splotchScale);R.splotchIntensity=N(O.splotchIntensity).onObjectUpdate(({material:n})=>n.splotchIntensity);R.cellScale=N(O.cellScale).onObjectUpdate(({material:n})=>n.cellScale);R.cellSize=N(O.cellSize).onObjectUpdate(({material:n})=>n.cellSize);R.darkGrainColor=N(new me(O.darkGrainColor)).onObjectUpdate(({material:n},t)=>t.value.set(n.darkGrainColor));R.lightGrainColor=N(new me(O.lightGrainColor)).onObjectUpdate(({material:n},t)=>t.value.set(n.lightGrainColor));R.transformationMatrix=N(new A().copy(O.transformationMatrix)).onObjectUpdate(({material:n})=>n.transformationMatrix);const Xi=Hi(R.transformationMatrix.mul(Nn(jn,1)).xyz,R.centerSize,R.largeWarpScale,R.largeGrainStretch,R.smallWarpStrength,R.smallWarpScale,R.fineWarpStrength,R.fineWarpScale,R.ringThickness,R.ringBias,R.ringSizeVariance,R.ringVarianceScale,R.barkThickness,R.splotchScale,R.splotchIntensity,R.cellScale,R.cellSize,R.darkGrainColor,R.lightGrainColor).mul(O.clearcoatDarken);class mt extends Wn{static get type(){return"WoodNodeMaterial"}constructor(t={}){super(),this.isWoodNodeMaterial=!0;const s={...Ne("teak","raw"),...t};for(const r in s)r==="genus"||r==="finish"||(typeof s[r]=="string"?this[r]=new me(s[r]):this[r]=s[r]);this.colorNode=Xi,this.clearcoatNode=s.clearcoat,this.clearcoatRoughness=s.clearcoatRoughness}static fromPreset(t="teak",i="raw"){const s=Ne(t,i);return new mt(s)}}const Zi=1e-4,gt="matte",xt="white_oak",Ki=[...fn],qi=[...hn],mn=Object.freeze([0,0,0]),gn=Object.freeze([0,0,0]),xn=Object.freeze([1,1,1]),It=new pt;function Ft(n){return`#${new me(n).getHexString()}`}function Xe(n,t){return Array.isArray(n)?n.map((i,s)=>Number.isFinite(i)?i:t[s]):t}function $i({dimensions:n,grainOffset:t,grainRotation:i,grainScale:s}){const[r,a,e]=n.map(b=>Math.max(Math.abs(b)||0,Zi)),[c,l,u]=Xe(t,mn),[d,h,o]=Xe(i,gn),[m,S,x]=Xe(s,xn),y=new A,v=new A,g=new A,w=new A;return It.set(V.degToRad(d),V.degToRad(h),V.degToRad(o)),y.makeTranslation(c,l,u),v.makeRotationFromEuler(It),g.makeScale(m/r,S/a,x/e),w.multiplyMatrices(y,v),w.multiply(g),w}function Sn(n=xt,t=gt){const i=Ne(n,t);return{barkThickness:i.barkThickness,cellScale:i.cellScale,cellSize:i.cellSize,centerSize:i.centerSize,clearcoat:i.clearcoat,clearcoatRoughness:i.clearcoatRoughness,darkGrainColor:Ft(i.darkGrainColor),fineWarpScale:i.fineWarpScale,fineWarpStrength:i.fineWarpStrength,largeGrainStretch:i.largeGrainStretch,largeWarpScale:i.largeWarpScale,lightGrainColor:Ft(i.lightGrainColor),ringBias:i.ringBias,ringSizeVariance:i.ringSizeVariance,ringThickness:i.ringThickness,ringVarianceScale:i.ringVarianceScale,smallWarpScale:i.smallWarpScale,smallWarpStrength:i.smallWarpStrength,splotchIntensity:i.splotchIntensity,splotchScale:i.splotchScale}}function Gt({barkThickness:n,cellScale:t,cellSize:i,centerSize:s,clearcoat:r,clearcoatRoughness:a,darkGrainColor:e,dimensions:c=[1,1,1],fallbackColor:l="#bca88c",fineWarpScale:u,fineWarpStrength:d,grainOffset:h=mn,grainRotation:o=gn,grainScale:m=xn,largeGrainStretch:S,largeWarpScale:x,lightGrainColor:y,metalness:v=0,ringBias:g,ringSizeVariance:w,ringThickness:b,ringVarianceScale:W,roughness:T=.78,smallWarpScale:I,smallWarpStrength:M,splotchIntensity:z,splotchScale:D}){const _=ne(H=>H.gl),U=_?.backend?.isWebGPUBackend===!0&&!!_?.backend?.device&&!!_?.backend?.context&&typeof navigator<"u"&&!!navigator.gpu,L=p.useMemo(()=>{if(!U)return null;const H=new mt({barkThickness:n,cellScale:t,cellSize:i,centerSize:s,clearcoat:r,clearcoatRoughness:a,darkGrainColor:e,fineWarpScale:u,fineWarpStrength:d,largeGrainStretch:S,largeWarpScale:x,lightGrainColor:y,ringBias:g,ringSizeVariance:w,ringThickness:b,ringVarianceScale:W,smallWarpScale:I,smallWarpStrength:M,splotchIntensity:z,splotchScale:D,transformationMatrix:$i({dimensions:c,grainOffset:h,grainRotation:o,grainScale:m})});return H.metalness=v,H.roughness=T,H},[n,t,i,s,r,a,e,c,u,d,h,o,m,S,x,y,v,g,w,b,W,T,I,M,z,D,U]);return p.useEffect(()=>()=>{L?.dispose()},[L]),!U||!L?f.jsx("meshStandardMaterial",{color:l,metalness:v,roughness:T}):f.jsx("primitive",{attach:"material",object:L})}function Qi({collisionMeshesRef:n,table:t,tank:i}){const s=p.useMemo(()=>ft(i,t),[t.depth,t.legs?.depth,t.legs?.inset,t.legs?.width,t.position,t.thickness,t.width,i.depth,i.glassThickness,i.height,i.spillExtent,i.width]),r=p.useMemo(()=>({barkThickness:t.wood.barkThickness,cellScale:t.wood.cellScale,cellSize:t.wood.cellSize,centerSize:t.wood.centerSize,clearcoat:t.wood.clearcoat,clearcoatRoughness:t.wood.clearcoatRoughness,darkGrainColor:t.wood.darkGrainColor,fallbackColor:t.color,fineWarpScale:t.wood.fineWarpScale,fineWarpStrength:t.wood.fineWarpStrength,grainOffset:t.wood.grainOffset,grainRotation:t.wood.grainRotation,grainScale:t.wood.grainScale,largeGrainStretch:t.wood.largeGrainStretch,largeWarpScale:t.wood.largeWarpScale,lightGrainColor:t.wood.lightGrainColor,metalness:t.metalness,ringBias:t.wood.ringBias,ringSizeVariance:t.wood.ringSizeVariance,ringThickness:t.wood.ringThickness,ringVarianceScale:t.wood.ringVarianceScale,roughness:t.roughness,smallWarpScale:t.wood.smallWarpScale,smallWarpStrength:t.wood.smallWarpStrength,splotchIntensity:t.wood.splotchIntensity,splotchScale:t.wood.splotchScale}),[t.color,t.metalness,t.roughness,t.wood.barkThickness,t.wood.cellScale,t.wood.cellSize,t.wood.centerSize,t.wood.clearcoat,t.wood.clearcoatRoughness,t.wood.darkGrainColor,t.wood.fineWarpScale,t.wood.fineWarpStrength,t.wood.grainOffset,t.wood.grainRotation,t.wood.grainScale,t.wood.largeGrainStretch,t.wood.largeWarpScale,t.wood.lightGrainColor,t.wood.ringBias,t.wood.ringSizeVariance,t.wood.ringThickness,t.wood.ringVarianceScale,t.wood.smallWarpScale,t.wood.smallWarpStrength,t.wood.splotchIntensity,t.wood.splotchScale]);return f.jsxs(f.Fragment,{children:[f.jsxs(Te,{type:"fixed",colliders:!1,children:[f.jsx(ye,{args:s.topHalfExtents,position:s.topPosition,friction:1.25,restitution:.04}),s.legs.map(a=>f.jsx(ye,{args:a.halfExtents,position:a.position,friction:1.22,restitution:.03},a.key)),s.edgeColliders.map(a=>f.jsx(ye,{args:a.args,position:a.position,friction:1.28,restitution:.03},a.key))]}),f.jsxs("mesh",{ref:a=>{const e=n.current;if(e[0]=a,a){const c=a;c.userData={...c.userData,surfaceType:"table-top"}}},castShadow:!0,position:s.topPosition,receiveShadow:!0,children:[f.jsx("boxGeometry",{args:[s.width,s.thickness,s.depth]}),f.jsx(Gt,{...r,dimensions:[s.width,s.thickness,s.depth]})]}),s.legs.map((a,e)=>f.jsxs("mesh",{ref:c=>{const l=n.current;if(l[e+1]=c,c){const u=c;u.userData={...u.userData,surfaceType:"table-leg"}}},castShadow:!0,position:a.position,receiveShadow:!0,children:[f.jsx("boxGeometry",{args:a.size}),f.jsx(Gt,{...r,dimensions:a.size})]},a.key))]})}const Ze=1.35,Ji=18,lt=[0,Ji,8,4],er=.95,tr=.85,nr=.025,ir=.1,Ke=8,rr=1.4,ar=0,sr=1,qe=.002,or=.08,_t=6e-4,We=new B,De=new B,Re=new B,J=new B,Lt=new B,Et=new Pe,lr=new B,Ot=new B,At=new Pe,ze=new pt,Vt=new B,Nt=new Pe,Ce=new B,cr=Object.freeze([1,1,1]),ur=Object.freeze([0,0,0]),dr=Object.freeze([0,0,0]),jt=Gn(sr,[ar]),pr=fe.memo(function({fragment:t,fragmentObjectsRef:i,fragmentHandlesRef:s,onImpact:r,paneKey:a}){const e=p.useRef(null),c=i?.current??null;return p.useEffect(()=>()=>{t.mesh.geometry?.dispose?.()},[t.mesh]),p.useEffect(()=>{const l=e.current;l&&(l.setLinvel(t.linearVelocity,!0),l.setAngvel(t.angularVelocity,!0),l.wakeUp?.())},[t.angularVelocity,t.linearVelocity]),p.useEffect(()=>{const{mesh:l}=t,u=s.current;return u[t.key]={body:e.current,generation:t.generation,mesh:l},l.userData={...l.userData,fragmentKey:t.key,paneKey:a,surfaceType:"tank-pane-fragment",onProjectileImpact:r},c&&(c[t.key]=l),()=>{delete u[t.key],c&&delete c[t.key],delete l.userData.fragmentKey,delete l.userData.onProjectileImpact,delete l.userData.paneKey,delete l.userData.surfaceType}},[t.generation,t.key,t.mesh,s,c,r,a]),f.jsxs(Te,{ref:e,colliders:!1,position:t.position,rotation:t.rotation,friction:er,restitution:ir,mass:nr,linearDamping:tr,angularDamping:rr,canSleep:!0,ccd:!0,children:[f.jsx(ye,{args:t.colliderArgs,collisionGroups:jt,position:t.colliderPosition,solverGroups:jt}),f.jsx("primitive",{object:t.mesh,position:dr,rotation:ur,scale:t.scale??cr})]})});function hr(n){return lt[Math.min(n,lt.length-1)]}function fr(n,t,i){return n.worldToLocal(Ot.copy(i)),n.getWorldQuaternion(Et),t.getWorldQuaternion(Nt),At.copy(Et).invert().multiply(Nt),ze.setFromQuaternion(At),{position:Ot.toArray(),rotation:[ze.x,ze.y,ze.z],scale:t.scale.toArray()}}function mr(n){n.computeBoundingBox(),n.boundingBox?.getSize(We);const t=[{axis:"x",size:We.x},{axis:"y",size:We.y},{axis:"z",size:We.z}].sort((i,s)=>i.size-s.size);return{impactRadius:Math.max(Math.min(t[1].size,t[2].size)*.18,or),projectionAxis:t[0].axis}}function gr(n,t){const{geometry:i}=n,s=Math.abs(t?.[0]??1),r=Math.abs(t?.[1]??1),a=Math.abs(t?.[2]??1);return i.computeBoundingBox(),i.boundingBox?.getCenter(De),i.boundingBox?.getSize(Re),{colliderArgs:[Math.max(Re.x*s*.5,qe),Math.max(Re.y*r*.5,qe),Math.max(Re.z*a*.5,qe)],colliderPosition:[De.x*s,De.y*r,De.z*a]}}function xr(n){n.position.set(0,0,0),n.rotation.set(0,0,0),n.scale.set(1,1,1),n.updateMatrix(),n.updateMatrixWorld(!0)}function Sr({assetGroup:n,fallbackWorldPoint:t,fragmentMesh:i,generation:s,impactWorldPoint:r,inheritedAngularVelocity:a,inheritedLinearVelocity:e,sourceMesh:c}){const l=i;l.castShadow=!0,l.receiveShadow=!0,l.updateWorldMatrix(!0,!1),l.getWorldPosition(Ce),J.copy(Ce).sub(r),J.lengthSq()<=_t&&J.copy(Ce).sub(t),J.lengthSq()<=_t&&J.set(V.randFloatSpread(.2),1,V.randFloatSpread(.2)),J.normalize();const u=fr(n,c,Ce),d=gr(l,u.scale);return xr(l),{angularVelocity:{x:(a?.x??0)+V.randFloatSpread(Ke),y:(a?.y??0)+V.randFloatSpread(Ke),z:(a?.z??0)+V.randFloatSpread(Ke)},generation:s,key:l.uuid,linearVelocity:{x:(e?.x??0)+J.x*Ze*V.randFloat(.75,1.35),y:(e?.y??0)+J.y*Ze*V.randFloat(.75,1.35)+V.randFloat(.25,.6),z:(e?.z??0)+J.z*Ze*V.randFloat(.75,1.35)},mesh:l,colliderArgs:d.colliderArgs,colliderPosition:d.colliderPosition,position:u.position,rotation:u.rotation,scale:u.scale}}function vr({assetGroupRef:n,fragmentObjectsRef:t,geometry:i,material:s,paneKey:r,paneProps:a,runtime:e,tank:c}){const l=p.useRef({}),u=p.useRef(0),d=p.useRef([]),[h,o]=p.useState([]),m=p.useMemo(()=>s.clone(),[s]),S=p.useMemo(()=>{const g=s.clone();return g.color&&g.color.offsetHSL(0,0,.08),typeof g.opacity=="number"&&(g.opacity=Math.min(c.glassOpacity+.22,.5),g.transparent=!0),typeof g.roughness=="number"&&(g.roughness=Math.min(g.roughness+.16,1)),typeof g.metalness=="number"&&(g.metalness=.02),g.side=ut,g},[s,c.glassOpacity]),x=p.useMemo(()=>{const g=new Zn(i.clone(),m,S);return g.castShadow=!0,g.receiveShadow=!0,g},[i,S,m]);p.useEffect(()=>{const g=a?.ref;return g?.(x),()=>{g?.(null),x.geometry?.dispose?.(),m.dispose(),S.dispose()}},[x,S,m,a]);const y=fe.useCallback(({inheritedAngularVelocity:g=null,inheritedLinearVelocity:w=null,sourceGeneration:b,sourceMesh:W,worldPoint:T})=>{const I=n.current;if(!I)return[];const M=b+1;if(M>=lt.length)return[];W.updateWorldMatrix(!0,!1),W.getWorldPosition(Vt);const z=Array.isArray(T)?Lt.fromArray(T):Lt.copy(T),D=W.worldToLocal(lr.copy(z)),_=mr(W.geometry);return W.fracture(new Kn({fractureMethod:"voronoi",fragmentCount:hr(M),seed:(u.current+M)*101+r.length,voronoiOptions:{impactPoint:D,impactRadius:_.impactRadius,mode:"2.5D",projectionAxis:_.projectionAxis}})).map(L=>Sr({assetGroup:I,fallbackWorldPoint:Vt,fragmentMesh:L,generation:M,impactWorldPoint:z,inheritedAngularVelocity:g,inheritedLinearVelocity:w,sourceMesh:W}))},[n,r]),v=p.useMemo(()=>(g,w)=>{const b=l.current[g];if(!b?.mesh)return;const W=y({inheritedAngularVelocity:b.body?.angvel?.()??null,inheritedLinearVelocity:b.body?.linvel?.()??null,sourceGeneration:b.generation,sourceMesh:b.mesh,worldPoint:w});W.length&&(b.mesh.visible=!1,o(T=>{const I=T.filter(M=>M.key!==g).concat(W);return d.current=I,I}))},[y]);return ie(()=>{const g=e?.getPaneBreakEvent(r),w=g?.id??0,b=e?.isPaneBroken(r)??!1;if(!b&&(u.current||d.current.length)&&(u.current=0,d.current=[],l.current={},o([])),b&&w>u.current&&g?.worldPoint){u.current=w;const W=y({sourceGeneration:0,sourceMesh:x,worldPoint:g.worldPoint});d.current=W,o(W)}x.visible=!b}),f.jsxs(f.Fragment,{children:[f.jsx("primitive",{object:x}),h.map(g=>f.jsx(pr,{fragment:g,fragmentObjectsRef:t,fragmentHandlesRef:l,onImpact:w=>v(g.key,w),paneKey:r},g.key))]})}p.createContext();const br=["Object","Object1","Object2","Object3","Object4","Object5","Object6","Object7"],yr=["Object_4","Object_10","Object_12","Object_20","Object_22","Object_32","Object_34","Object_36"],Ge=br.length;function wr({variant:n=0,...t}){const{nodes:i}=ge(he("/rocks.glb")),s=(n%Ge+Ge)%Ge,r=i[yr[s]];return r?f.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:r.geometry,material:r.material,...t}):null}ge.preload(he("/rocks.glb"));const _e=1e-4,Mr=pe-12,Pr=.32,Tr=-60,Le=18,kr=.9,Wr=1.8,Dr=1.15,Rr=1.15,zr=.26,Cr=.08,Br=.14,$e=new B,te=new B,Ut=new B,Qe=new dt,oe=new B,Ht=new B,Be=new B;function Ir(){return{active:!1,paneBroken:!1,previousWorldPosition:new B}}function vn(n){return[(n-(Le-1)/2)*Pr,Tr,0]}function Fr(n,t,i){if(!n.length)return null;$e.copy(i).sub(t);const s=$e.length();return s<=_e?null:(Qe.set(t,$e.normalize()),Qe.far=s+Br,Qe.intersectObjects(n,!1)[0]??null)}function bn(n,t){if(!n)return;const i=n;i.userData={...i.userData,isActiveThrowable:t}}function Ee(n,t){if(!n)return;const i=n,[s,r,a]=vn(t);i.setTranslation({x:s,y:r,z:a},!0),i.setRotation({x:0,y:0,z:0,w:1},!0),i.setLinvel({x:0,y:0,z:0},!0),i.setAngvel({x:0,y:0,z:0},!0),bn(i,!1),i.sleep?.()}const Gr=fe.memo(function({bodyRefs:t,fluidObjectsRef:i,meshRefs:s,parkedPosition:r,rocks:a,slotIndex:e,variant:c}){const l=t.current,u=i?.current??null,d=s.current;return f.jsx(Te,{ref:h=>{if(l[e]=h,h&&!h.userData?.pooledRockInitialized){const o=h;Ee(o,e),o.userData={...o.userData,pooledRockInitialized:!0}}},angularDamping:Wr,canSleep:!0,ccd:!0,colliders:"hull",friction:Dr,linearDamping:Rr,mass:zr,position:r,restitution:Cr,children:f.jsx("group",{ref:h=>{d[e]=h,u&&(u[e]=h)},children:f.jsx(wr,{scale:a.scale,variant:c})})})}),yn=fe.forwardRef(function({collisionObjectsRef:t,fluidObjectsRef:i,onImpact:s,rocks:r,runtime:a},e){const{camera:c}=ne(),l=p.useRef([]),u=p.useRef(Array.from({length:Le},Ir)),d=p.useRef(a?.getResetNonce?.()??0),h=p.useRef(null),o=p.useRef([]),m=p.useRef(0),S=p.useMemo(()=>Array.from({length:Le},(x,y)=>({parkedPosition:vn(y),slotId:`tank-rock-body-${y}`,variant:y%Ge})),[]);return p.useImperativeHandle(e,()=>({launch({targetWorldPoint:x}){if(!h.current)return!1;const y=m.current,v=l.current[y],g=u.current[y];if(m.current=(y+1)%Le,!v||(c.getWorldDirection(te),oe.copy(c.position).addScaledVector(te,kr),Ht.copy(x),te.copy(Ht).sub(oe),te.lengthSq()<=_e))return!1;Ee(v,y),v.setTranslation({x:oe.x,y:oe.y,z:oe.z},!0);const w=new pt(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI),b=new Pe().setFromEuler(w);return v.setRotation({x:b.x,y:b.y,z:b.z,w:b.w},!0),te.normalize().multiplyScalar(r.speed),v.setLinvel({x:te.x,y:te.y,z:te.z},!0),v.setAngvel({x:V.randFloatSpread(r.spin),y:V.randFloatSpread(r.spin),z:V.randFloatSpread(r.spin)},!0),bn(v,!0),v.wakeUp?.(),g.active=!0,g.paneBroken=!1,g.previousWorldPosition.copy(oe),!0}}),[c,r.speed,r.spin]),ie(()=>{const x=a?.getResetNonce?.()??0;x!==d.current&&(d.current=x,m.current=0,l.current.forEach((y,v)=>{Ee(y,v),u.current[v].active=!1,u.current[v].paneBroken=!1})),l.current.forEach((y,v)=>{const g=o.current[v],w=u.current[v];if(!(!y||!g||!w.active)){if(g.getWorldPosition(Be),!w.paneBroken&&Be.distanceToSquared(w.previousWorldPosition)>_e*_e){const b=Fr(t?.current??[],w.previousWorldPosition,Be),W=b?.object?.userData?.onProjectileImpact??null,T=b?.object?.userData?.paneKey??null,I=b?.object?.userData?.surfaceType??null;I==="tank-pane"&&T&&!a?.isPaneBroken?.(T)?(b.object.worldToLocal(Ut.copy(b.point)),s?.(T,{localPoint:Ut.clone(),worldPoint:b.point.clone()}),w.paneBroken=!0):I==="tank-pane-fragment"&&typeof W=="function"&&(W(b.point.clone()),w.paneBroken=!0)}w.previousWorldPosition.copy(Be),y.translation().y<Mr&&(Ee(y,v),w.active=!1,w.paneBroken=!1)}})}),f.jsx("group",{ref:h,children:S.map(({parkedPosition:x,slotId:y,variant:v},g)=>f.jsx(Gr,{bodyRefs:l,fluidObjectsRef:i,meshRefs:o,parkedPosition:x,rocks:r,slotIndex:g,variant:v},y))})});yn.displayName="RockProjectiles";const _r=`struct VertexOutput {
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
`,Lr=`@group(0) @binding(0) var textureSampler: sampler;
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
`,Er=`struct VertexOutput {
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
`,Or=`@group(0) @binding(0) var textureSampler: sampler;
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
`,Ar=`@group(0) @binding(1) var depthTexture: texture_2d<f32>;
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
`,Vr=`struct RenderUniforms {
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
`,Nr=`struct RenderUniforms {
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
`,jr=16,Yt=8,Ur=4,Xt=336;function Hr(n){return{invProjectionMatrix:new Float32Array(n,80,16),invViewMatrix:new Float32Array(n,208,16),modelMatrix:new Float32Array(n,272,16),projectionMatrix:new Float32Array(n,16,16),sphereSize:new Float32Array(n,8,2),texelSize:new Float32Array(n,0,2),viewMatrix:new Float32Array(n,144,16)}}class Yr{constructor({device:t,format:i,particleDiameter:s,posvelBuffer:r,sceneDepthTexture:a,width:e,height:c,fovRadians:l}){this.device=t,this.format=i,this.particleDiameter=s,this.posvelBuffer=r,this.sceneDepthTexture=a,this.fovRadians=l,this.renderValues=new ArrayBuffer(Xt),this.renderViews=Hr(this.renderValues),this.renderUniformBuffer=t.createBuffer({label:"fish-tank-splash-render-uniforms",size:Xt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.fluidParamsBuffer=t.createBuffer({label:"fish-tank-splash-fluid-params",size:jr,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.filterXBuffer=t.createBuffer({label:"fish-tank-splash-filter-x",size:Yt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.filterYBuffer=t.createBuffer({label:"fish-tank-splash-filter-y",size:Yt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.thicknessFilterSizeBuffer=t.createBuffer({label:"fish-tank-splash-thickness-filter-size",size:Ur,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.filterXBuffer,0,new Float32Array([1,0])),this.device.queue.writeBuffer(this.filterYBuffer,0,new Float32Array([0,1])),this.device.queue.writeBuffer(this.thicknessFilterSizeBuffer,0,new Int32Array([15])),this.fullScreenModule=t.createShaderModule({code:Er}),this.depthMapModule=t.createShaderModule({code:_r}),this.thicknessMapModule=t.createShaderModule({code:Nr}),this.depthFilterModule=t.createShaderModule({code:Ar}),this.gaussianModule=t.createShaderModule({code:Or}),this.fluidModule=t.createShaderModule({code:Lr}),this.sphereModule=t.createShaderModule({code:Vr}),this.sceneDepthTextureView=a.createView({aspect:"depth-only"}),this.sampler=t.createSampler({magFilter:"linear",minFilter:"linear"}),this.resize(e,c)}createPipelines(){const t=Math.max(1,Math.round(this.width/2)),i=Math.max(1,Math.round(this.height/2)),s=12,r={screenHeight:this.height,screenWidth:this.width},a={maxFilterSize:50,projectedParticleConstant:s*this.particleDiameter*.05*(this.height/2)/Math.max(Math.tan(this.fovRadians/2),.001)};this.depthMapPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-depth-map",layout:"auto",vertex:{module:this.depthMapModule},fragment:{module:this.depthMapModule,targets:[{format:"r32float"}]},primitive:{topology:"triangle-list"},depthStencil:{depthCompare:"less",depthWriteEnabled:!0,format:"depth32float"}}),this.spherePipeline=this.device.createRenderPipeline({label:"fish-tank-splash-sphere",layout:"auto",vertex:{module:this.sphereModule},fragment:{module:this.sphereModule,targets:[{format:this.format}]},primitive:{topology:"triangle-list"},depthStencil:{depthCompare:"less",depthWriteEnabled:!0,format:"depth32float"}}),this.depthFilter1DPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-depth-filter-1d",layout:"auto",vertex:{module:this.fullScreenModule,constants:r},fragment:{module:this.depthFilterModule,constants:{...a,blur2D:0},targets:[{format:"r32float"}]},primitive:{topology:"triangle-list"}}),this.depthFilter2DPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-depth-filter-2d",layout:"auto",vertex:{module:this.fullScreenModule,constants:r},fragment:{module:this.depthFilterModule,constants:{...a,blur2D:1},targets:[{format:"r32float"}]},primitive:{topology:"triangle-list"}}),this.thicknessMapPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-thickness-map",layout:"auto",vertex:{module:this.thicknessMapModule},fragment:{module:this.thicknessMapModule,targets:[{blend:{alpha:{dstFactor:"one",operation:"add",srcFactor:"one"},color:{dstFactor:"one",operation:"add",srcFactor:"one"}},format:"r16float",writeMask:GPUColorWrite.RED}]},primitive:{topology:"triangle-list"}}),this.thicknessFilterPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-thickness-filter",layout:"auto",vertex:{module:this.fullScreenModule,constants:r},fragment:{module:this.gaussianModule,constants:{thicknessTextureHeight:i,thicknessTextureWidth:t},targets:[{format:"r16float"}]},primitive:{topology:"triangle-list"}}),this.fluidPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-fluid",layout:"auto",vertex:{module:this.fullScreenModule,constants:r},fragment:{module:this.fluidModule,targets:[{format:this.format}]},primitive:{topology:"triangle-list"}})}createTextures(){const t=Math.max(1,Math.round(this.width/2)),i=Math.max(1,Math.round(this.height/2));this.depthMapTexture=this.device.createTexture({label:"fish-tank-splash-depth-map-texture",size:[this.width,this.height,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"r32float"}),this.tmpDepthMapTexture=this.device.createTexture({label:"fish-tank-splash-depth-map-texture-tmp",size:[this.width,this.height,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"r32float"}),this.thicknessTexture=this.device.createTexture({label:"fish-tank-splash-thickness-texture",size:[t,i,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"r16float"}),this.tmpThicknessTexture=this.device.createTexture({label:"fish-tank-splash-thickness-texture-tmp",size:[t,i,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"r16float"}),this.depthTestTexture=this.device.createTexture({label:"fish-tank-splash-depth-test",size:[this.width,this.height,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"depth32float"}),this.backgroundTexture=this.device.createTexture({label:"fish-tank-splash-background",size:[this.width,this.height,1],usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.TEXTURE_BINDING,format:this.format}),this.depthMapTextureView=this.depthMapTexture.createView(),this.tmpDepthMapTextureView=this.tmpDepthMapTexture.createView(),this.thicknessTextureView=this.thicknessTexture.createView(),this.tmpThicknessTextureView=this.tmpThicknessTexture.createView(),this.depthTestTextureView=this.depthTestTexture.createView(),this.backgroundTextureView=this.backgroundTexture.createView()}createBindGroups(){this.depthMapBindGroup=this.device.createBindGroup({layout:this.depthMapPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.posvelBuffer}},{binding:1,resource:{buffer:this.renderUniformBuffer}}]}),this.thicknessMapBindGroup=this.device.createBindGroup({layout:this.thicknessMapPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.posvelBuffer}},{binding:1,resource:{buffer:this.renderUniformBuffer}}]}),this.sphereBindGroup=this.device.createBindGroup({layout:this.spherePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.posvelBuffer}},{binding:1,resource:{buffer:this.renderUniformBuffer}}]}),this.depthFilterBindGroups=[this.device.createBindGroup({layout:this.depthFilter1DPipeline.getBindGroupLayout(0),entries:[{binding:1,resource:this.depthMapTextureView},{binding:2,resource:{buffer:this.filterXBuffer}}]}),this.device.createBindGroup({layout:this.depthFilter1DPipeline.getBindGroupLayout(0),entries:[{binding:1,resource:this.tmpDepthMapTextureView},{binding:2,resource:{buffer:this.filterYBuffer}}]}),this.device.createBindGroup({layout:this.depthFilter2DPipeline.getBindGroupLayout(0),entries:[{binding:1,resource:this.depthMapTextureView},{binding:2,resource:{buffer:this.filterXBuffer}}]}),this.device.createBindGroup({layout:this.depthFilter2DPipeline.getBindGroupLayout(0),entries:[{binding:1,resource:this.tmpDepthMapTextureView},{binding:2,resource:{buffer:this.filterYBuffer}}]})],this.thicknessFilterBindGroups=[this.device.createBindGroup({layout:this.thicknessFilterPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:this.sampler},{binding:1,resource:this.thicknessTextureView},{binding:2,resource:{buffer:this.filterXBuffer}},{binding:3,resource:{buffer:this.thicknessFilterSizeBuffer}}]}),this.device.createBindGroup({layout:this.thicknessFilterPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:this.sampler},{binding:1,resource:this.tmpThicknessTextureView},{binding:2,resource:{buffer:this.filterYBuffer}},{binding:3,resource:{buffer:this.thicknessFilterSizeBuffer}}]})],this.fluidBindGroup=this.device.createBindGroup({layout:this.fluidPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:this.sampler},{binding:1,resource:this.depthMapTextureView},{binding:2,resource:{buffer:this.renderUniformBuffer}},{binding:3,resource:this.thicknessTextureView},{binding:4,resource:this.backgroundTextureView},{binding:5,resource:{buffer:this.fluidParamsBuffer}},{binding:6,resource:this.sceneDepthTextureView}]})}resize(t,i){this.width===t&&this.height===i||(this.destroyTextures(),this.width=t,this.height=i,this.createPipelines(),this.createTextures(),this.createBindGroups())}destroyTextures(){this.backgroundTexture?.destroy?.(),this.depthMapTexture?.destroy?.(),this.depthTestTexture?.destroy?.(),this.thicknessTexture?.destroy?.(),this.tmpDepthMapTexture?.destroy?.(),this.tmpThicknessTexture?.destroy?.()}update({camera:t,density:i,fluidColor:s,modelMatrix:r,sphereSize:a}){t.updateMatrixWorld(),this.renderViews.texelSize.set([1/this.width,1/this.height]),this.renderViews.sphereSize.set([a,0]),this.renderViews.projectionMatrix.set(t.projectionMatrix.elements),this.renderViews.invProjectionMatrix.set(t.projectionMatrixInverse.elements),this.renderViews.viewMatrix.set(t.matrixWorldInverse.elements),this.renderViews.invViewMatrix.set(t.matrixWorld.elements),this.renderViews.modelMatrix.set(r.elements),this.device.queue.writeBuffer(this.renderUniformBuffer,0,this.renderValues),this.device.queue.writeBuffer(this.fluidParamsBuffer,0,new Float32Array([s[0],s[1],s[2],i]))}copyBackground(t,i){t.copyTextureToTexture({texture:i},{texture:this.backgroundTexture},[this.width,this.height,1])}render(t,i,s,{showParticles:r=!1}={}){if(r){const o=t.beginRenderPass({colorAttachments:[{loadOp:"load",storeOp:"store",view:i}],depthStencilAttachment:{depthClearValue:1,depthLoadOp:"load",depthStoreOp:"store",view:this.sceneDepthTextureView},label:"fish-tank-splash-sphere-pass"});o.setBindGroup(0,this.sphereBindGroup),o.setPipeline(this.spherePipeline),o.draw(6,s),o.end();return}const a=t.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.depthMapTextureView}],depthStencilAttachment:{depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store",view:this.depthTestTextureView},label:"fish-tank-splash-depth-pass"});a.setBindGroup(0,this.depthMapBindGroup),a.setPipeline(this.depthMapPipeline),a.draw(6,s),a.end();for(let o=0;o<2;o+=1){const m=t.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.tmpDepthMapTextureView}],label:"fish-tank-splash-depth-filter-x"});m.setBindGroup(0,this.depthFilterBindGroups[0]),m.setPipeline(this.depthFilter1DPipeline),m.draw(6),m.end();const S=t.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.depthMapTextureView}],label:`fish-tank-splash-depth-filter-y-${o}`});S.setBindGroup(0,this.depthFilterBindGroups[1]),S.setPipeline(this.depthFilter1DPipeline),S.draw(6),S.end()}const e=t.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.tmpDepthMapTextureView}],label:"fish-tank-splash-depth-filter-2d-x"});e.setBindGroup(0,this.depthFilterBindGroups[2]),e.setPipeline(this.depthFilter2DPipeline),e.draw(6),e.end();const c=t.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.depthMapTextureView}],label:"fish-tank-splash-depth-filter-2d-y"});c.setBindGroup(0,this.depthFilterBindGroups[3]),c.setPipeline(this.depthFilter2DPipeline),c.draw(6),c.end();const l=t.beginRenderPass({colorAttachments:[{clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.thicknessTextureView}],label:"fish-tank-splash-thickness-pass"});l.setBindGroup(0,this.thicknessMapBindGroup),l.setPipeline(this.thicknessMapPipeline),l.draw(6,s),l.end();const u=t.beginRenderPass({colorAttachments:[{clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.tmpThicknessTextureView}],label:"fish-tank-splash-thickness-filter-x"});u.setBindGroup(0,this.thicknessFilterBindGroups[0]),u.setPipeline(this.thicknessFilterPipeline),u.draw(6),u.end();const d=t.beginRenderPass({colorAttachments:[{clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.thicknessTextureView}],label:"fish-tank-splash-thickness-filter-y"});d.setBindGroup(0,this.thicknessFilterBindGroups[1]),d.setPipeline(this.thicknessFilterPipeline),d.draw(6),d.end();const h=t.beginRenderPass({colorAttachments:[{clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:i}],label:"fish-tank-splash-fluid-pass"});h.setBindGroup(0,this.fluidBindGroup),h.setPipeline(this.fluidPipeline),h.draw(6),h.end()}dispose(){this.destroyTextures(),this.filterXBuffer.destroy(),this.filterYBuffer.destroy(),this.fluidParamsBuffer.destroy(),this.renderUniformBuffer.destroy(),this.thicknessFilterSizeBuffer.destroy()}}const Xr=`struct Cell {
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
`,Zr=`struct Particle {
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
`,Kr=`struct Particle {
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
`,qr=`struct Particle {
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
`,$r=`struct Particle {
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
`,Qr=`struct Cell {
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
`,le=1e7,Jr=.18,ct=80,ea=32,ta=16,Zt=112,Kt=Object.freeze({dynamicViscosity:.1,gravity:.4,restDensity:3,stiffness:50,wallStiffness:1});function na(n){return{containMax:new Float32Array(n,32,4),containMin:new Float32Array(n,16,4),domainSize:new Float32Array(n,0,4),impulseCenter:new Float32Array(n,64,4),impulseDir:new Float32Array(n,80,4),impulseParams:new Float32Array(n,96,4),openSides:new Float32Array(n,48,4)}}function ia(n){const t=[],i=n.particleSpacing*Jr;for(let a=n.initialFillMin[1];a<n.initialFillMax[1];a+=n.particleSpacing)for(let e=n.initialFillMin[0];e<n.initialFillMax[0];e+=n.particleSpacing)for(let c=n.initialFillMin[2];c<n.initialFillMax[2];c+=n.particleSpacing)t.push([e+(Math.random()-.5)*i,a+(Math.random()-.5)*i,c+(Math.random()-.5)*i]);const s=t.length,r=new ArrayBuffer(ct*s);return t.forEach((a,e)=>{const c=ct*e,l=new Float32Array(r,c,3),u=new Float32Array(r,c+16,3),d=new Float32Array(r,c+32,12);l.set(a),u.set([0,0,0]),d.set([0,0,0,0,0,0,0,0,0,0,0,0])}),{buffer:r,particleCount:s}}class ra{constructor({config:t,device:i,simulationSettings:s=Kt}){this.config=t,this.device=i,this.simulationSettings={...Kt,...s},this.simulationValues=new ArrayBuffer(Zt),this.simulationViews=na(this.simulationValues);const r=ia(t);this.particleCount=r.particleCount,this.gridCount=t.domainSize[0]*t.domainSize[1]*t.domainSize[2],this.cellBuffer=i.createBuffer({label:"fish-tank-splash-cell-buffer",size:ta*this.gridCount,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.particleBuffer=i.createBuffer({label:"fish-tank-splash-particle-buffer",size:ct*this.particleCount,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.posvelBuffer=i.createBuffer({label:"fish-tank-splash-posvel-buffer",size:ea*this.particleCount,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.densityBuffer=i.createBuffer({label:"fish-tank-splash-density-buffer",size:4*this.particleCount,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.simulationUniformBuffer=i.createBuffer({label:"fish-tank-splash-sim-uniforms",size:Zt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.numParticlesBuffer=i.createBuffer({label:"fish-tank-splash-num-particles",size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.particleBuffer,0,r.buffer),this.device.queue.writeBuffer(this.numParticlesBuffer,0,new Int32Array([this.particleCount])),this.clearGridPipeline=i.createComputePipeline({label:"fish-tank-splash-clear-grid",layout:"auto",compute:{module:i.createShaderModule({code:Xr})}}),this.p2g1Pipeline=i.createComputePipeline({label:"fish-tank-splash-p2g1",layout:"auto",compute:{module:i.createShaderModule({code:qr}),constants:{fixedPointMultiplier:le}}}),this.p2g2Pipeline=i.createComputePipeline({label:"fish-tank-splash-p2g2",layout:"auto",compute:{module:i.createShaderModule({code:$r}),constants:{dynamicViscosity:this.simulationSettings.dynamicViscosity,fixedPointMultiplier:le,fixedPointMultiplierInverse:1/le,restDensity:this.simulationSettings.restDensity,stiffness:this.simulationSettings.stiffness}}}),this.updateGridPipeline=i.createComputePipeline({label:"fish-tank-splash-update-grid",layout:"auto",compute:{module:i.createShaderModule({code:Qr}),constants:{fixedPointMultiplier:le,fixedPointMultiplierInverse:1/le,gravity:this.simulationSettings.gravity}}}),this.g2pPipeline=i.createComputePipeline({label:"fish-tank-splash-g2p",layout:"auto",compute:{module:i.createShaderModule({code:Kr}),constants:{fixedPointMultiplierInverse:1/le,wallStiffness:this.simulationSettings.wallStiffness}}}),this.copyPositionPipeline=i.createComputePipeline({label:"fish-tank-splash-copy-position",layout:"auto",compute:{module:i.createShaderModule({code:Zr})}}),this.clearGridBindGroup=i.createBindGroup({layout:this.clearGridPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.cellBuffer}}]}),this.p2g1BindGroup=i.createBindGroup({layout:this.p2g1Pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.cellBuffer}},{binding:2,resource:{buffer:this.simulationUniformBuffer}},{binding:3,resource:{buffer:this.numParticlesBuffer}}]}),this.p2g2BindGroup=i.createBindGroup({layout:this.p2g2Pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.cellBuffer}},{binding:2,resource:{buffer:this.simulationUniformBuffer}},{binding:3,resource:{buffer:this.numParticlesBuffer}},{binding:4,resource:{buffer:this.densityBuffer}}]}),this.updateGridBindGroup=i.createBindGroup({layout:this.updateGridPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.cellBuffer}},{binding:1,resource:{buffer:this.simulationUniformBuffer}}]}),this.g2pBindGroup=i.createBindGroup({layout:this.g2pPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.cellBuffer}},{binding:2,resource:{buffer:this.simulationUniformBuffer}},{binding:3,resource:{buffer:this.numParticlesBuffer}}]}),this.copyPositionBindGroup=i.createBindGroup({layout:this.copyPositionPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.posvelBuffer}},{binding:2,resource:{buffer:this.numParticlesBuffer}}]})}update({containMax:t,containMin:i,delta:s,impulse:r,openSides:a,spillFloor:e}){this.simulationViews.domainSize.set([this.config.domainSize[0],this.config.domainSize[1],this.config.domainSize[2],0]),this.simulationViews.containMin.set([i[0],i[1],i[2],e]),this.simulationViews.containMax.set([t[0],t[1],t[2],0]),this.simulationViews.openSides.set([a[0],a[1],a[2],a[3]]),r?(this.simulationViews.impulseCenter.set([r.center[0],r.center[1],r.center[2],1]),this.simulationViews.impulseDir.set([r.direction[0],r.direction[1],r.direction[2],0]),this.simulationViews.impulseParams.set([r.radius,r.strength,s,0])):(this.simulationViews.impulseCenter.set([0,0,0,0]),this.simulationViews.impulseDir.set([0,0,0,0]),this.simulationViews.impulseParams.set([0,0,s,0])),this.device.queue.writeBuffer(this.simulationUniformBuffer,0,this.simulationValues)}step(t){const i=t.beginComputePass({label:"fish-tank-splash-compute"});i.setBindGroup(0,this.clearGridBindGroup),i.setPipeline(this.clearGridPipeline),i.dispatchWorkgroups(Math.ceil(this.gridCount/64)),i.setBindGroup(0,this.p2g1BindGroup),i.setPipeline(this.p2g1Pipeline),i.dispatchWorkgroups(Math.ceil(this.particleCount/64)),i.setBindGroup(0,this.p2g2BindGroup),i.setPipeline(this.p2g2Pipeline),i.dispatchWorkgroups(Math.ceil(this.particleCount/64)),i.setBindGroup(0,this.updateGridBindGroup),i.setPipeline(this.updateGridPipeline),i.dispatchWorkgroups(Math.ceil(this.gridCount/64)),i.setBindGroup(0,this.g2pBindGroup),i.setPipeline(this.g2pPipeline),i.dispatchWorkgroups(Math.ceil(this.particleCount/64)),i.setBindGroup(0,this.copyPositionBindGroup),i.setPipeline(this.copyPositionPipeline),i.dispatchWorkgroups(Math.ceil(this.particleCount/64)),i.end()}dispose(){this.cellBuffer.destroy(),this.densityBuffer.destroy(),this.numParticlesBuffer.destroy(),this.particleBuffer.destroy(),this.posvelBuffer.destroy(),this.simulationUniformBuffer.destroy()}}const aa=1.5,wn=18e3,sa=.072,qt=.36,oa=.78,la=1.58,ca=24,ua=22,da=36,pa=Object.freeze({Small:1e4,Medium:wn,Large:3e4,"Very Large":45e3}),ha=.42,fa=4.5,ma=2.75,St=["left","right","back","front"],$t=new A,Qt=new A;function ga(n,t,i){const s=Math.max(0,t[0]-n[0]),r=Math.max(0,t[1]-n[1]),a=Math.max(0,t[2]-n[2]);return Math.ceil(s/i)*Math.ceil(r/i)*Math.ceil(a/i)}function xa(n,t,i){let s=oa;for(;ga(n,t,s)>i&&s<aa;)s+=.08;return s}function Sa(n){return pa[n.splashParticleBudget]??wn}function Me(n,t,i){return i.map((s,r)=>(s-n[r])/t)}function va(n){const t=de(n),i=Sa(n),s=-n.height/2+ue,r=V.clamp(Math.max(t.innerWidth/da,t.innerDepth/ca,Math.max(t.waterHeight,t.innerHeight*.82)/ua),sa,.11),a=Math.max(qt,t.innerWidth*.55),e=Math.max(qt,t.innerDepth*.7),c=Math.max(.32,n.height*.18),l=Math.max(.2,n.height*.12),u=[-t.innerWidth/2-a,s-c,-t.innerDepth/2-e],h=[t.innerWidth/2+a,s+t.waterHeight+l,t.innerDepth/2+e].map((v,g)=>Math.ceil((v-u[g])/r)+4),o=Me(u,r,[-t.innerWidth/2,s,-t.innerDepth/2]),m=Me(u,r,[t.innerWidth/2,s+t.waterHeight,t.innerDepth/2]),S=[o[0]+1.5,o[1]+1.5,o[2]+1.5],x=[m[0]-1.5,m[1]-1.2,m[2]-1.5],y=xa(S,x,i);return{cellSize:r,domainMinLocal:u,domainSize:h,initialFillMin:S,initialFillMax:x,innerDepth:t.innerDepth,innerWidth:t.innerWidth,maxParticles:i,particleDiameterWorld:r*la,particleSpacing:y,waterBottom:s,signature:[h.join("x"),r.toFixed(4),i,n.waterLevel.toFixed(4),t.innerWidth.toFixed(4),t.innerDepth.toFixed(4),s.toFixed(4)].join(":")}}function ba(n,t,i){const s=de({...t,waterLevel:i}),r=[-s.innerWidth/2,n.waterBottom,-s.innerDepth/2],a=[s.innerWidth/2,n.waterBottom+s.waterHeight,s.innerDepth/2],e=Math.min(-t.height/2+n.particleDiameterWorld*.5,n.waterBottom-n.particleDiameterWorld*.25);return{containMax:Me(n.domainMinLocal,n.cellSize,a),containMin:Me(n.domainMinLocal,n.cellSize,r),layout:s,spillFloor:(e-n.domainMinLocal[1])/n.cellSize}}function ya(n,t){return Me(n.domainMinLocal,n.cellSize,[t.x,t.y,t.z])}function wa(n){return St.map(t=>n?.isPaneBroken?.(t)?1:0)}function Ma(n){switch(n){case"left":return[-1,0,0];case"right":return[1,0,0];case"back":return[0,0,-1];case"front":return[0,0,1];default:return[0,0,0]}}function Pa(n,t,i,s,r){const a=ya(n,s),e=Math.max(1e-4,t.splashBreakImpulseDuration??ha),c=Math.max(1e-4,t.splashBreakImpulseRadius??fa),l=Math.max(0,t.splashBreakImpulseStrength??ma);switch(i){case"left":a[0]=r.containMin[0]+1.2;break;case"right":a[0]=r.containMax[0]-1.2;break;case"back":a[2]=r.containMin[2]+1.2;break;case"front":a[2]=r.containMax[2]-1.2;break}return{center:a,direction:Ma(i),duration:e,remaining:e,radius:c,strength:l}}function Ta(n,t,i){return n.copy(t.matrixWorld),Qt.makeTranslation(i.domainMinLocal[0],i.domainMinLocal[1],i.domainMinLocal[2]),$t.makeScale(i.cellSize,i.cellSize,i.cellSize),n.multiply(Qt),n.multiply($t),n}const ka=1e-4,Je=new B,et=new sn,Wa=new A,Jt=new B,tt=new B,Da=new Set(["tank-pane","tank-pane-fragment"]);function en(){return Object.fromEntries(St.map(n=>[n,0]))}function Ra(n){const t=new me(n.waterColor).offsetHSL(0,.02,-.06);return[t.r,t.g,t.b]}function ve(n,t){if(t){if(!n?.queue?.onSubmittedWorkDone){t.dispose();return}n.queue.onSubmittedWorkDone().catch(()=>{}).then(()=>{t.dispose()})}}function za(){const n=new Dn({fog:!1,side:ut,toneMapped:!1});return n.colorWrite=!1,n}function Ca(n){return!n?.isMesh||n.visible===!1?!1:n.userData?.excludeFromWaterDepthOcclusion?!0:Da.has(n.userData?.surfaceType)}function Ba(n,t){const i=new Rn(n,t,zn);return i.name="fish-tank-splash-scene-depth",i.magFilter=ke,i.minFilter=ke,new Cn(n,t,{colorSpace:Bn,depthBuffer:!0,depthTexture:i,magFilter:ke,minFilter:ke,samples:0,stencilBuffer:!1})}function Ia({camera:n,gl:t,material:i,scene:s,target:r}){const a=s,e=[],c=t,l=a.overrideMaterial,u=c.getRenderTarget?.()??null;a.traverse(d=>{if(!Ca(d))return;const h=d;e.push(h),h.visible=!1});try{c.setRenderTarget(r),a.overrideMaterial=i,c.clear(!0,!0,!1),c.render(a,n)}finally{e.forEach(d=>{const h=d;h.visible=!0}),a.overrideMaterial=l,c.setRenderTarget(u)}}function Fa({runtime:n,showWaterBounds:t=!1,tank:i}){const s=p.useRef(en()),r=p.useRef(null),a=p.useRef(null),e=p.useRef(""),c=p.useRef(null),l=p.useRef(null),u=p.useRef(null),d=p.useRef(null),h=p.useRef(""),o=p.useMemo(()=>va(i),[i.depth,i.glassThickness,i.height,i.splashParticleBudget,i.waterInset,i.waterLevel,i.width]),m=p.useMemo(()=>Ra(i),[i.waterColor]),S=p.useMemo(()=>{const[y,v,g]=o.domainMinLocal,[w,b,W]=o.domainSize,T=[w*o.cellSize,b*o.cellSize,W*o.cellSize];return Jt.set(y+T[0]*.5,v+T[1]*.5,g+T[2]*.5),{position:Jt.toArray(),size:T}},[o]),x=p.useMemo(()=>({dynamicViscosity:i.splashViscosity,gravity:i.splashGravity,restDensity:i.splashRestDensity,stiffness:i.splashStiffness,wallStiffness:i.splashWallStiffness}),[i.splashGravity,i.splashRestDensity,i.splashStiffness,i.splashViscosity,i.splashWallStiffness]);return p.useEffect(()=>()=>{const y=c.current,v=l.current,g=u.current,w=d.current,b=y?.device??w?.device;e.current="",h.current="",c.current=null,l.current=null,u.current=null,d.current=null,ve(b,y),v?.dispose?.(),g?.dispose?.(),ve(b,w)},[]),ie((y,v)=>{const{camera:g,gl:w,scene:b}=y,W=w?.backend,T=W?.device,I=W?.context,M=r.current,z=n?n.getWaterLevel():i.waterLevel,D=n?.isAnyPaneBroken?.()??!1,_=n?.isAnyPaneBroken?.()?i.waterLevel:z;if(!T||!I||!M||!D&&z<=ka)return;const U=[o.signature,n?.getResetNonce?.()??0,x.dynamicViscosity,x.gravity,x.restDensity,x.stiffness,x.wallStiffness].join(":");U!==h.current&&(ve(T,c.current),ve(T,d.current),d.current=new ra({config:o,device:T,simulationSettings:x}),s.current=en(),a.current=null,e.current="",h.current=U);const L=d.current;if(!L){e.current="";return}w.getDrawingBufferSize(et);const H=Math.max(1,Math.round(et.x)),k=Math.max(1,Math.round(et.y));let C=l.current,P=u.current;C||(C=za(),l.current=C),P?(P.width!==H||P.height!==k)&&P.setSize(H,k):(P=Ba(H,k),u.current=P),Ia({camera:g,gl:w,material:C,scene:b,target:P}),w.render(b,g);const G=W?.get?.(P.depthTexture)?.texture;if(!G){e.current="";return}const Y=`${H}x${k}:${U}`;M.getWorldScale(tt),(!c.current||Y!==e.current)&&(ve(T,c.current),c.current=new Yr({device:T,format:navigator.gpu.getPreferredCanvasFormat(),height:k,fovRadians:V.degToRad(g.fov),particleDiameter:o.particleDiameterWorld*tt.x,posvelBuffer:L.posvelBuffer,sceneDepthTexture:G,width:H}),e.current=Y);const X=ba(o,i,_);St.forEach(se=>{const je=n?.getPaneBreakEvent?.(se),yt=je?.id??0;yt<=s.current[se]||!je?.worldPoint||(s.current[se]=yt,Je.fromArray(je.worldPoint),M.worldToLocal(Je),a.current=Pa(o,i,se,Je,X))});const ee=i.splashRunning!==!1;a.current&&ee&&(a.current.remaining=Math.max(0,a.current.remaining-v),a.current.remaining<=0&&(a.current=null));const vt=wa(n),xe=a.current?{center:a.current.center,direction:a.current.direction,radius:a.current.radius,strength:a.current.strength*(a.current.remaining/a.current.duration)}:null;if(ee){const se=Math.min(v*i.splashSimSpeed,i.splashMaxDelta);L.update({containMax:X.containMax,containMin:X.containMin,delta:se,impulse:xe,openSides:vt,spillFloor:X.spillFloor})}c.current.update({camera:g,density:i.splashColorDensity,fluidColor:m,modelMatrix:Ta(Wa,M,o),sphereSize:o.particleDiameterWorld*tt.x});const Q=T.createCommandEncoder({label:"fish-tank-splash-frame"}),bt=I.getCurrentTexture();c.current.copyBackground(Q,bt),ee&&L.step(Q),c.current.render(Q,bt.createView(),L.particleCount,{showParticles:i.splashShowParticles===!0}),T.queue.submit([Q.finish()])},1),f.jsx("group",{ref:r,children:t&&f.jsxs("mesh",{position:S.position,children:[f.jsx("boxGeometry",{args:S.size}),f.jsx("meshBasicMaterial",{color:"#22d3ee",transparent:!0,opacity:.45,wireframe:!0})]})})}const Ga=.34,_a=.036,tn=1e-4,ce=new B,be=new B;function nn(n){return`#${n.getHexString()}`}function La({fluidCouplersRef:n,runtime:t,tank:i}){const s=p.useRef(new WeakMap),r=p.useRef(0),a=p.useRef(null),e=p.useRef(.35),c=p.useRef(.03),l=p.useRef(.65),[u,d]=p.useMemo(()=>{const h=new me(i.waterColor),o=h.clone().offsetHSL(0,.03,-.22),m=h.clone().offsetHSL(0,.02,.12);return[nn(o),nn(m)]},[i.waterColor]);return ie((h,o)=>{const m=a.current;if(!m)return;const S=t?t.getWaterLevel():i.waterLevel,x=t?t.getBrokenPaneCount():0,y=i.waterLevel>0?1-S/i.waterLevel:0,v=de({...i,waterLevel:S}),g=s.current;let w=0;m.visible=S>tn,m.position.set(0,v.waterY,0),m.scale.set(v.innerWidth,v.waterHeight,v.innerDepth),(n?.current??[]).forEach(b=>{if(!b)return;b.getWorldPosition(be);const W=g.get(b);if(!W){g.set(b,be.clone());return}if(ce.copy(be),m.worldToLocal(ce),Math.abs(ce.x)<=.52&&Math.abs(ce.z)<=.52&&ce.y>=-.55&&ce.y<=.55){const T=be.distanceTo(W)/Math.max(o,.008333333333333333);w=Math.max(w,Math.min(.08,T*.0035))}W.copy(be)}),r.current=Math.max(r.current*.9,w),c.current=Math.max(.012,_a+x*.014+y*.05+r.current),l.current=.4+i.waterDisturbance*1.6+x*.12+r.current*4,e.current=Math.min(1.4,.22+i.waterDisturbance*2.4+y*.45+r.current*5)}),f.jsx("group",{ref:a,visible:i.waterLevel>tn,children:f.jsx(qn,{bottomColor:u,depth:1,height:1,ior:1.18,opacity:Ga,roughness:.14,segments:20,showEdges:!1,thickness:.55,topColor:d,transmission:.42,waveChoppinessRef:e,waveHeightRef:c,waveSpeedRef:l,width:1})})}function Ea({fluidCouplersRef:n,runtime:t,showWaterBounds:i=!1,tank:s}){const r=ne(e=>e.gl);return r?.backend?.isWebGPUBackend===!0&&!!r?.backend?.device&&!!r?.backend?.context&&typeof navigator<"u"&&!!navigator.gpu?f.jsx(Fa,{runtime:t,showWaterBounds:i,tank:s}):f.jsx(La,{fluidCouplersRef:n,runtime:t,tank:s})}const nt=1e-4,Oa=20,Aa=8,Va=new Set(["glass_2","glass_5","lid_1","plastic_1","plastic_2","rubber"]),Na=1.05,ja=.03,rn=new sn,it=new dt,Ua=new B,Ha=fe.memo(function({geometry:t,material:i,colliderShape:s="trimesh",meshKey:r,meshProps:a}){return f.jsx(Te,{type:"fixed",colliders:s,friction:Na,restitution:ja,children:f.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:t,material:i,...a},r)})});function Ya({tank:n,debug:t,externalCollisionObjectsRef:i,fluidCouplersRef:s,rocks:r,runtime:a}){const e=ne(k=>k.camera),c=ne(k=>k.gl),l=p.useRef(null),u=p.useRef([]),d=p.useRef({}),h=p.useRef({}),o=p.useRef(null),m=p.useRef(null),S=p.useRef(null),x=p.useRef([]),y=p.useRef({}),v=p.useRef(null),[g,w]=p.useState(null),{innerDepth:b,innerWidth:W,waterHeight:T,waterY:I}=de(n),M=c?.backend?.isWebGPUBackend===!0&&!!c?.backend?.device&&!!c?.backend?.context&&typeof navigator<"u"&&!!navigator.gpu;p.useLayoutEffect(()=>{if(g||!m.current)return;const k=new In,C=new B,P=new B;m.current.updateWorldMatrix(!0,!0),k.setFromObject(m.current),Number.isFinite(k.min.x)&&(k.getCenter(C),k.getSize(P),w({center:C.toArray(),minY:k.min.y,size:P.toArray()}))},[g]);const z=p.useMemo(()=>{if(!g)return null;const[k,C,P]=g.size,[G,,Y]=g.center,X=[n.width/Math.max(k,nt),n.height/Math.max(C,nt),n.depth/Math.max(P,nt)];return{position:[-G*X[0],-n.height/2-g.minY*X[1],-Y*X[2]],scale:X}},[g,n.depth,n.height,n.width]);p.useEffect(()=>{const{domElement:k}=c,C=()=>{o.current=null},P=Y=>{Y.button===0&&(o.current={clientX:Y.clientX,clientY:Y.clientY})},G=Y=>{const X=o.current;if(o.current=null,!X||Y.button!==0||!S.current||Math.hypot(Y.clientX-X.clientX,Y.clientY-X.clientY)>Aa)return;const ee=k.getBoundingClientRect();rn.set((Y.clientX-ee.left)/ee.width*2-1,-((Y.clientY-ee.top)/ee.height)*2+1),it.setFromCamera(rn,e);const xe=it.intersectObjects(K.map(Q=>h.current[Q]).filter(Q=>Q&&Q.visible),!1)[0]??null;S.current.launch({paneKey:xe?.object?.userData?.paneKey??null,targetWorldPoint:xe?xe.point.clone():it.ray.at(Oa,Ua.clone())})};return k.addEventListener("pointerdown",P),window.addEventListener("pointerup",G),window.addEventListener("pointercancel",C),()=>{k.removeEventListener("pointerdown",P),window.removeEventListener("pointerup",G),window.removeEventListener("pointercancel",C)}},[e,c]),ie(()=>{const k=a?a.getWaterLevel():n.waterLevel,C=de({...n,waterLevel:k});u.current=[...i?.current??[],...Tt.map(G=>y.current[G]),...Object.values(d.current),...K.map(G=>h.current[G])].filter(G=>G&&G.visible);const P=s?.current;if(P){P.splice(0,P.length,...x.current,...Object.values(d.current));for(let G=P.length-1;G>=0;G-=1)P[G]||P.splice(G,1)}v.current&&(v.current.position.set(0,C.waterY,0),v.current.rotation.set(0,0,0),v.current.scale.y=C.waterHeight+.01,v.current.visible=t.showWaterBounds&&k>0)});const D=(k,C)=>{a&&a.breakPane(k,C.localPoint,C.worldPoint)},_=p.useMemo(()=>Object.fromEntries(Tt.map(k=>[k,{ref:C=>{const P=C;y.current[k]=P,P&&(P.userData={...P.userData,surfaceKey:k,surfaceType:"tank-static"})}}])),[]),U=p.useMemo(()=>Object.fromEntries(K.map(k=>[k,{ref:C=>{const P=C;h.current[k]=P,P&&(P.userData={...P.userData,paneKey:k,surfaceType:"tank-pane"})}}])),[]),L=p.useCallback(({geometry:k,material:C,meshKey:P,meshProps:G})=>Va.has(P)?f.jsx(Ha,{colliderShape:"trimesh",geometry:k,material:C,meshKey:P,meshProps:G},P):f.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:k,material:C,...G},P),[]),H=p.useCallback(({geometry:k,material:C,paneKey:P,paneProps:G})=>f.jsx(vr,{assetGroupRef:l,fragmentObjectsRef:d,geometry:k,material:C,paneKey:P,paneProps:G,runtime:a,tank:n},P),[a,n]);return f.jsxs(f.Fragment,{children:[!g&&f.jsx("group",{visible:!1,children:f.jsx(ot,{ref:m})}),n.visible&&f.jsxs(f.Fragment,{children:[f.jsx(yn,{collisionObjectsRef:u,fluidObjectsRef:x,ref:S,onImpact:D,rocks:r,runtime:a}),z&&f.jsx("group",{ref:l,position:z.position,scale:z.scale,children:f.jsx(ot,{glassColor:n.glassColor,glassOpacity:n.glassOpacity,paneProps:U,renderPane:H,renderStaticMesh:L,sandColor:n.sandColor,staticMeshProps:_})}),f.jsx(Ea,{fluidCouplersRef:s,runtime:a,showWaterBounds:t.showWaterBounds,tank:n})]}),t.showTankBounds&&f.jsxs("mesh",{children:[f.jsx("boxGeometry",{args:[n.width+.01,n.height+.01,n.depth+.01]}),f.jsx("meshBasicMaterial",{color:"#f97316",transparent:!0,opacity:.45,wireframe:!0})]}),t.showWaterBounds&&!M&&f.jsxs("mesh",{ref:v,position:[0,I,0],scale:[1,T+.01,1],children:[f.jsx("boxGeometry",{args:[W+.01,1,b+.01]}),f.jsx("meshBasicMaterial",{color:"#22d3ee",transparent:!0,opacity:.45,wireframe:!0})]})]})}const E=Sn(xt,gt),Ie={ambientIntensity:.95,backgroundColor:"#0f172a",cameraDesktopFov:34,cameraDesktopPosition:{x:5.8,y:3.4,z:8.2},cameraDesktopTarget:{x:0,y:1.15,z:0},cameraMobileFov:46,cameraMobilePosition:{x:0,y:3.2,z:9.4},cameraMobileTarget:{x:0,y:1.1,z:0},cameraMode:"Fixed",directionalIntensity:1.25,directionalPosition:{x:6,y:9,z:4},drainRate:.16,fishEscapeDistance:1.2,fishBaseYOffset:.05,fishBobAmplitude:.08,fishCount:2,fishFlopAmplitude:.95,fishMarkerColor:"#f472b6",fishMarkerSize:.045,fishRadiusX:.78,fishRadiusZ:.42,fishScale:.018,fishSpeed:.45,fishStrandLevel:.2,fishVisible:!0,floorColor:"#bca88c",fogColor:"#0f172a",fogFar:24,fogNear:10,glassColor:"#dbeafe",glassOpacity:.16,gridColor:"#8aa1b1",operatorBoostMultiplier:2,operatorLiftSpeed:3,operatorMaxFov:72,operatorMinFov:22,operatorMoveSpeed:4,operatorPointerLookSensitivity:.0025,operatorStickLookSpeed:2.2,operatorZoomSpeed:28,rockGravity:8.5,rockScale:.7,rockSpeed:40,rockSpin:10,sandColor:"#c9a46b",showFishMarkers:!1,showRapierDebug:!1,splashBreakImpulseDuration:.42,splashBreakImpulseRadius:4.5,splashBreakImpulseStrength:2.75,splashColorDensity:1.3,splashGravity:.4,splashMaxDelta:.4,splashParticleBudget:"Medium",splashRestDensity:3,splashRunning:!0,splashShowParticles:!1,splashSimSpeed:12,splashStiffness:50,splashViscosity:.1,splashWallStiffness:1,spillExtent:3.8,spillOpacity:.28,spillThickness:.045,showTankBounds:!1,showWaterBounds:!1,tableDepth:5.98,tableLegDepth:.22,tableLegInset:.32,tableLegWidth:.22,tableMetalness:0,tablePosition:{x:0,y:1.1,z:0},tableRoughness:.78,tableThickness:.18,tableWidth:7.95,tableWoodBarkThickness:E.barkThickness,tableWoodCellScale:E.cellScale,tableWoodCellSize:E.cellSize,tableWoodCenterSize:E.centerSize,tableWoodClearcoat:E.clearcoat,tableWoodClearcoatRoughness:E.clearcoatRoughness,tableWoodDarkGrainColor:E.darkGrainColor,tableWoodFineWarpScale:E.fineWarpScale,tableWoodFineWarpStrength:E.fineWarpStrength,tableWoodFinish:gt,tableWoodGrainOffset:{x:0,y:0,z:0},tableWoodGrainRotation:{x:0,y:0,z:0},tableWoodGrainScale:{x:1,y:1,z:1},tableWoodGenus:xt,tableWoodLargeGrainStretch:E.largeGrainStretch,tableWoodLargeWarpScale:E.largeWarpScale,tableWoodLightGrainColor:E.lightGrainColor,tableWoodRingBias:E.ringBias,tableWoodRingSizeVariance:E.ringSizeVariance,tableWoodRingThickness:E.ringThickness,tableWoodRingVarianceScale:E.ringVarianceScale,tableWoodSmallWarpScale:E.smallWarpScale,tableWoodSmallWarpStrength:E.smallWarpStrength,tableWoodSplotchIntensity:E.splotchIntensity,tableWoodSplotchScale:E.splotchScale,tankDepth:1.8,tankHeight:2.2,tankPosition:{x:0,y:1.2,z:0},tankRotation:{x:0,y:0,z:0},tankScale:1,tankVisible:!0,tankWidth:3.2,waterColor:"#4cc9f0",waterDisturbance:.09,waterInset:.12,waterLevel:.78,glassThickness:.06},rt={Default:{...Ie},Orbit:{...Ie,backgroundColor:"#111827",cameraMode:"Orbit",fogFar:26,waterLevel:.72},Operator:{...Ie,cameraMode:"Operator",fishSpeed:.55,waterLevel:.68},Debug:{...Ie,backgroundColor:"#020617",cameraMode:"Orbit",showFishMarkers:!0,showRapierDebug:!0,showTankBounds:!0,showWaterBounds:!0,waterLevel:.58}},Xa=Object.freeze({sceneTitle:"My Heart Is A Broken Fish Tank"}),an="Default";function Mn(n){return n.split("_").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" ")}function Za({finish:n,genus:t}){const i=Sn(t,n);return{tableWoodBarkThickness:i.barkThickness,tableWoodCellScale:i.cellScale,tableWoodCellSize:i.cellSize,tableWoodCenterSize:i.centerSize,tableWoodClearcoat:i.clearcoat,tableWoodClearcoatRoughness:i.clearcoatRoughness,tableWoodDarkGrainColor:i.darkGrainColor,tableWoodFineWarpScale:i.fineWarpScale,tableWoodFineWarpStrength:i.fineWarpStrength,tableWoodLargeGrainStretch:i.largeGrainStretch,tableWoodLargeWarpScale:i.largeWarpScale,tableWoodLightGrainColor:i.lightGrainColor,tableWoodRingBias:i.ringBias,tableWoodRingSizeVariance:i.ringSizeVariance,tableWoodRingThickness:i.ringThickness,tableWoodRingVarianceScale:i.ringVarianceScale,tableWoodSmallWarpScale:i.smallWarpScale,tableWoodSmallWarpStrength:i.smallWarpStrength,tableWoodSplotchIntensity:i.splotchIntensity,tableWoodSplotchScale:i.splotchScale}}const Ka=Object.freeze(Object.fromEntries(Ki.map(n=>[Mn(n),n]))),qa=Object.freeze(Object.fromEntries(qi.map(n=>[Mn(n),n])));function $a({presetSnapshot:n}){return{...n}}function Qa(){const{attachSetControls:n,controlsSnapshotRef:t,initialPreset:i,presetsFolder:s}=$n({defaultPreset:an,getPresetControls:$a,presets:rt}),r=rt[i]||rt[an],a=p.useRef(`${r.tableWoodGenus}:${r.tableWoodFinish}`),[e,c]=Fn(Xa.sceneTitle,()=>({Presets:s,Scene:F({backgroundColor:{label:"Background",value:r.backgroundColor},floorColor:{label:"Floor",value:r.floorColor},gridColor:{label:"Grid",value:r.gridColor},fogColor:{label:"Fog",value:r.fogColor},fogNear:{label:"Fog Near",max:40,min:0,step:.25,value:r.fogNear},fogFar:{label:"Fog Far",max:60,min:1,step:.25,value:r.fogFar},ambientIntensity:{label:"Ambient",max:3,min:0,step:.05,value:r.ambientIntensity},directionalIntensity:{label:"Main Light",max:4,min:0,step:.05,value:r.directionalIntensity},directionalPosition:{label:"Light Pos",step:.1,value:r.directionalPosition}},{collapsed:!0}),Camera:F({cameraMode:{label:"Mode",options:["Fixed","Orbit","Operator"],value:r.cameraMode},"Fixed Frame":F({cameraDesktopPosition:{label:"Desktop Pos",step:.1,value:r.cameraDesktopPosition},cameraDesktopTarget:{label:"Desktop Target",step:.1,value:r.cameraDesktopTarget},cameraDesktopFov:{label:"Desktop Fov",max:90,min:15,step:1,value:r.cameraDesktopFov},cameraMobilePosition:{label:"Mobile Pos",step:.1,value:r.cameraMobilePosition},cameraMobileTarget:{label:"Mobile Target",step:.1,value:r.cameraMobileTarget},cameraMobileFov:{label:"Mobile Fov",max:90,min:15,step:1,value:r.cameraMobileFov}},{collapsed:!0}),Operator:F({operatorMoveSpeed:{label:"Move Speed",max:20,min:.5,step:.1,value:r.operatorMoveSpeed},operatorLiftSpeed:{label:"Lift Speed",max:20,min:.5,step:.1,value:r.operatorLiftSpeed},operatorBoostMultiplier:{label:"Boost",max:10,min:1,step:.1,value:r.operatorBoostMultiplier},operatorPointerLookSensitivity:{label:"Pointer Look",max:.02,min:5e-4,step:5e-4,value:r.operatorPointerLookSensitivity},operatorStickLookSpeed:{label:"Stick Look",max:10,min:.1,step:.1,value:r.operatorStickLookSpeed},operatorZoomSpeed:{label:"Zoom Speed",max:120,min:1,step:1,value:r.operatorZoomSpeed},operatorMinFov:{label:"Min Fov",max:90,min:10,step:1,value:r.operatorMinFov},operatorMaxFov:{label:"Max Fov",max:120,min:20,step:1,value:r.operatorMaxFov}},{collapsed:!0})},{collapsed:!0}),Tank:F({tankVisible:{label:"Visible",value:r.tankVisible},tankPosition:{label:"Position",step:.05,value:r.tankPosition},tankRotation:{label:"Rotation",max:Math.PI,min:-Math.PI,step:.01,value:r.tankRotation},tankScale:{label:"Scale",max:3,min:.1,step:.01,value:r.tankScale},Dimensions:F({tankWidth:{label:"Width",max:8,min:.5,step:.05,value:r.tankWidth},tankHeight:{label:"Height",max:8,min:.5,step:.05,value:r.tankHeight},tankDepth:{label:"Depth",max:8,min:.5,step:.05,value:r.tankDepth}},{collapsed:!0}),Glass:F({glassThickness:{label:"Thickness",max:.4,min:.01,step:.01,value:r.glassThickness},glassColor:{label:"Color",value:r.glassColor},glassOpacity:{label:"Opacity",max:1,min:0,step:.01,value:r.glassOpacity},"Break Impulse":F({splashBreakImpulseStrength:{label:"Strength",max:8,min:0,step:.05,value:r.splashBreakImpulseStrength},splashBreakImpulseRadius:{label:"Radius",max:12,min:.1,step:.1,value:r.splashBreakImpulseRadius},splashBreakImpulseDuration:{label:"Duration",max:2,min:.01,step:.01,value:r.splashBreakImpulseDuration}},{collapsed:!0})},{collapsed:!0}),Materials:F({sandColor:{label:"Sand Color",value:r.sandColor}},{collapsed:!0})},{collapsed:!0}),Water:F({waterInset:{label:"Water Inset",max:.4,min:.01,step:.01,value:r.waterInset},waterLevel:{label:"Water Level",max:1,min:.05,step:.01,value:r.waterLevel},waterColor:{label:"Water Color",value:r.waterColor},drainRate:{label:"Drain Rate",max:1,min:0,step:.01,value:r.drainRate},spillExtent:{label:"Spill Extent",max:10,min:0,step:.1,value:r.spillExtent},spillOpacity:{label:"Spill Opacity",max:1,min:0,step:.01,value:r.spillOpacity},spillThickness:{label:"Spill Thickness",max:.3,min:.005,step:.005,value:r.spillThickness},waterDisturbance:{label:"Cursor Push",max:.5,min:0,step:.005,value:r.waterDisturbance},Splash:F({splashParticleBudget:{label:"Particle Budget",options:["Small","Medium","Large","Very Large"],value:r.splashParticleBudget},splashSimSpeed:{label:"Step Scale",max:30,min:.25,step:.25,value:r.splashSimSpeed},splashMaxDelta:{label:"Max Dt",max:.5,min:.01,step:.01,value:r.splashMaxDelta},splashGravity:{label:"Gravity",max:2,min:0,step:.01,value:r.splashGravity},splashColorDensity:{label:"Color Density",max:6,min:0,step:.1,value:r.splashColorDensity},splashRestDensity:{label:"Rest Density",max:8,min:.5,step:.1,value:r.splashRestDensity},splashStiffness:{label:"Stiffness",max:120,min:1,step:1,value:r.splashStiffness},splashViscosity:{label:"Viscosity",max:1,min:0,step:.01,value:r.splashViscosity},splashWallStiffness:{label:"Wall Stiffness",max:4,min:0,step:.05,value:r.splashWallStiffness}},{collapsed:!0})},{collapsed:!0}),Table:F({tablePosition:{label:"Position",step:.05,value:r.tablePosition},Dimensions:F({tableWidth:{label:"Width",max:16,min:.5,step:.05,value:r.tableWidth},tableDepth:{label:"Depth",max:16,min:.5,step:.05,value:r.tableDepth},tableThickness:{label:"Thickness",max:1.5,min:.02,step:.01,value:r.tableThickness}},{collapsed:!0}),Legs:F({tableLegWidth:{label:"Width",max:1.5,min:.05,step:.01,value:r.tableLegWidth},tableLegDepth:{label:"Depth",max:1.5,min:.05,step:.01,value:r.tableLegDepth},tableLegInset:{label:"Inset",max:2,min:0,step:.01,value:r.tableLegInset}},{collapsed:!0}),Appearance:F({tableRoughness:{label:"Roughness",max:1,min:0,step:.01,value:r.tableRoughness},tableMetalness:{label:"Metalness",max:1,min:0,step:.01,value:r.tableMetalness},Preset:F({tableWoodGenus:{label:"Species",options:qa,value:r.tableWoodGenus},tableWoodFinish:{label:"Finish",options:Ka,value:r.tableWoodFinish}},{collapsed:!1}),Colors:F({tableWoodDarkGrainColor:{label:"Dark Grain",value:r.tableWoodDarkGrainColor},tableWoodLightGrainColor:{label:"Light Grain",value:r.tableWoodLightGrainColor}},{collapsed:!0}),Mapping:F({tableWoodGrainScale:{label:"Scale",step:.05,value:r.tableWoodGrainScale},tableWoodGrainOffset:{label:"Offset",step:.01,value:r.tableWoodGrainOffset},tableWoodGrainRotation:{label:"Rotation",step:1,value:r.tableWoodGrainRotation}},{collapsed:!0}),Structure:F({tableWoodCenterSize:{label:"Center Size",max:2,min:0,step:.01,value:r.tableWoodCenterSize},tableWoodLargeWarpScale:{label:"Large Warp",max:1,min:0,step:.001,value:r.tableWoodLargeWarpScale},tableWoodLargeGrainStretch:{label:"Large Stretch",max:1,min:0,step:.001,value:r.tableWoodLargeGrainStretch},tableWoodSmallWarpStrength:{label:"Small Warp Strength",max:.2,min:0,step:.001,value:r.tableWoodSmallWarpStrength},tableWoodSmallWarpScale:{label:"Small Warp Scale",max:16,min:.1,step:.05,value:r.tableWoodSmallWarpScale},tableWoodFineWarpStrength:{label:"Fine Warp Strength",max:.05,min:0,step:.001,value:r.tableWoodFineWarpStrength},tableWoodFineWarpScale:{label:"Fine Warp Scale",max:50,min:.1,step:.1,value:r.tableWoodFineWarpScale}},{collapsed:!0}),Rings:F({tableWoodRingThickness:{label:"Ring Thickness",max:.08,min:.01,step:5e-4,value:r.tableWoodRingThickness},tableWoodRingBias:{label:"Ring Bias",max:1,min:-.2,step:.001,value:r.tableWoodRingBias},tableWoodRingSizeVariance:{label:"Ring Size Variance",max:.5,min:0,step:.001,value:r.tableWoodRingSizeVariance},tableWoodRingVarianceScale:{label:"Ring Variance Scale",max:10,min:.1,step:.1,value:r.tableWoodRingVarianceScale},tableWoodBarkThickness:{label:"Bark Thickness",max:1.2,min:0,step:.01,value:r.tableWoodBarkThickness}},{collapsed:!0}),"Grain Detail":F({tableWoodSplotchScale:{label:"Splotch Scale",max:2.5,min:0,step:.01,value:r.tableWoodSplotchScale},tableWoodSplotchIntensity:{label:"Splotch Intensity",max:4,min:0,step:.01,value:r.tableWoodSplotchIntensity},tableWoodCellScale:{label:"Cell Scale",max:2e3,min:100,step:5,value:r.tableWoodCellScale},tableWoodCellSize:{label:"Cell Size",max:.5,min:.01,step:.001,value:r.tableWoodCellSize}},{collapsed:!0}),Finish:F({tableWoodClearcoat:{label:"Clearcoat",max:1,min:0,step:.01,value:r.tableWoodClearcoat},tableWoodClearcoatRoughness:{label:"Clearcoat Roughness",max:1,min:0,step:.01,value:r.tableWoodClearcoatRoughness}},{collapsed:!0})},{collapsed:!0})},{collapsed:!0}),Rocks:F({rockScale:{label:"Scale",max:.7,min:.1,step:.1,value:r.rockScale},rockSpeed:{label:"Speed",max:80,min:1,step:.5,value:r.rockSpeed},rockGravity:{label:"Gravity",max:30,min:0,step:.5,value:r.rockGravity},rockSpin:{label:"Spin",max:30,min:0,step:.5,value:r.rockSpin}},{collapsed:!0}),Fish:F({fishVisible:{label:"Visible",value:r.fishVisible},fishCount:{label:"Count",options:[0,1,2],value:r.fishCount},fishScale:{label:"Scale",max:.2,min:.001,step:.001,value:r.fishScale},fishSpeed:{label:"Speed",max:4,min:.05,step:.05,value:r.fishSpeed},fishRadiusX:{label:"Radius X",max:4,min:.05,step:.01,value:r.fishRadiusX},fishRadiusZ:{label:"Radius Z",max:4,min:.05,step:.01,value:r.fishRadiusZ},fishBaseYOffset:{label:"Base Offset",max:2,min:-1,step:.01,value:r.fishBaseYOffset},fishStrandLevel:{label:"Strand Level",max:1,min:0,step:.01,value:r.fishStrandLevel},fishEscapeDistance:{label:"Escape Dist",max:4,min:0,step:.01,value:r.fishEscapeDistance},fishBobAmplitude:{label:"Bob",max:1,min:0,step:.01,value:r.fishBobAmplitude},fishFlopAmplitude:{label:"Flop",max:Math.PI,min:0,step:.01,value:r.fishFlopAmplitude},fishMarkerSize:{label:"Marker Size",max:.4,min:.005,step:.005,value:r.fishMarkerSize},fishMarkerColor:{label:"Marker Color",value:r.fishMarkerColor}},{collapsed:!0}),Debug:F({showRapierDebug:{label:"Rapier Debug",value:r.showRapierDebug},splashRunning:{label:"Sim Running",value:r.splashRunning},splashShowParticles:{label:"Show Particles",value:r.splashShowParticles},showTankBounds:{label:"Tank Bounds",value:r.showTankBounds},showWaterBounds:{label:"Water Bounds",value:r.showWaterBounds},showFishMarkers:{label:"Fish Markers",value:r.showFishMarkers}},{collapsed:!0})}),{collapsed:!0});n(c),t.current={...e},p.useEffect(()=>{const v=`${e.tableWoodGenus}:${e.tableWoodFinish}`;a.current!==v&&(a.current=v,c(Za({finish:e.tableWoodFinish,genus:e.tableWoodGenus})))},[e.tableWoodFinish,e.tableWoodGenus,c]);const l=p.useMemo(()=>({desktopFov:e.cameraDesktopFov,desktopPosition:[e.cameraDesktopPosition.x,e.cameraDesktopPosition.y,e.cameraDesktopPosition.z],desktopTarget:[e.cameraDesktopTarget.x,e.cameraDesktopTarget.y,e.cameraDesktopTarget.z],mobileFov:e.cameraMobileFov,mobilePosition:[e.cameraMobilePosition.x,e.cameraMobilePosition.y,e.cameraMobilePosition.z],mobileTarget:[e.cameraMobileTarget.x,e.cameraMobileTarget.y,e.cameraMobileTarget.z]}),[e.cameraDesktopFov,e.cameraDesktopPosition.x,e.cameraDesktopPosition.y,e.cameraDesktopPosition.z,e.cameraDesktopTarget.x,e.cameraDesktopTarget.y,e.cameraDesktopTarget.z,e.cameraMobileFov,e.cameraMobilePosition.x,e.cameraMobilePosition.y,e.cameraMobilePosition.z,e.cameraMobileTarget.x,e.cameraMobileTarget.y,e.cameraMobileTarget.z]),u=p.useMemo(()=>({ambientIntensity:e.ambientIntensity,backgroundColor:e.backgroundColor,directionalIntensity:e.directionalIntensity,directionalPosition:[e.directionalPosition.x,e.directionalPosition.y,e.directionalPosition.z],floorColor:e.floorColor,fogColor:e.fogColor,fogFar:e.fogFar,fogNear:e.fogNear,gridColor:e.gridColor}),[e.ambientIntensity,e.backgroundColor,e.directionalIntensity,e.directionalPosition.x,e.directionalPosition.y,e.directionalPosition.z,e.floorColor,e.fogColor,e.fogFar,e.fogNear,e.gridColor]),d=p.useMemo(()=>({boostMultiplier:e.operatorBoostMultiplier,liftSpeed:e.operatorLiftSpeed,maxFov:Math.max(e.operatorMinFov,e.operatorMaxFov),minFov:Math.min(e.operatorMinFov,e.operatorMaxFov),moveSpeed:e.operatorMoveSpeed,pointerLookSensitivity:e.operatorPointerLookSensitivity,stickLookSpeed:e.operatorStickLookSpeed,zoomSpeed:e.operatorZoomSpeed}),[e.operatorBoostMultiplier,e.operatorLiftSpeed,e.operatorMaxFov,e.operatorMinFov,e.operatorMoveSpeed,e.operatorPointerLookSensitivity,e.operatorStickLookSpeed,e.operatorZoomSpeed]),h=p.useMemo(()=>({position:[e.tankPosition.x,e.tankPosition.y,e.tankPosition.z],rotation:[e.tankRotation.x,e.tankRotation.y,e.tankRotation.z],scale:e.tankScale}),[e.tankPosition.x,e.tankPosition.y,e.tankPosition.z,e.tankRotation.x,e.tankRotation.y,e.tankRotation.z,e.tankScale]),o=p.useMemo(()=>({depth:e.tankDepth,drainRate:e.drainRate,glassColor:e.glassColor,glassOpacity:e.glassOpacity,glassThickness:e.glassThickness,height:e.tankHeight,sandColor:e.sandColor,splashBreakImpulseDuration:e.splashBreakImpulseDuration,splashBreakImpulseRadius:e.splashBreakImpulseRadius,splashBreakImpulseStrength:e.splashBreakImpulseStrength,splashColorDensity:e.splashColorDensity,splashGravity:e.splashGravity,splashMaxDelta:e.splashMaxDelta,splashParticleBudget:e.splashParticleBudget,splashRestDensity:e.splashRestDensity,splashRunning:e.splashRunning,splashShowParticles:e.splashShowParticles,splashSimSpeed:e.splashSimSpeed,splashStiffness:e.splashStiffness,splashViscosity:e.splashViscosity,splashWallStiffness:e.splashWallStiffness,spillExtent:e.spillExtent,spillOpacity:e.spillOpacity,spillThickness:e.spillThickness,tankScale:e.tankScale,visible:e.tankVisible,waterColor:e.waterColor,waterDisturbance:e.waterDisturbance,waterInset:e.waterInset,waterLevel:e.waterLevel,width:e.tankWidth}),[e.tankDepth,e.drainRate,e.glassColor,e.glassOpacity,e.glassThickness,e.tankHeight,e.sandColor,e.splashBreakImpulseDuration,e.splashBreakImpulseRadius,e.splashBreakImpulseStrength,e.splashColorDensity,e.splashGravity,e.splashMaxDelta,e.splashParticleBudget,e.splashRestDensity,e.splashRunning,e.splashShowParticles,e.splashSimSpeed,e.splashStiffness,e.splashViscosity,e.splashWallStiffness,e.spillExtent,e.spillOpacity,e.spillThickness,e.tankScale,e.tankVisible,e.waterColor,e.waterDisturbance,e.waterInset,e.waterLevel,e.tankWidth]),m=p.useMemo(()=>({color:e.tableWoodLightGrainColor,depth:e.tableDepth,legs:{depth:e.tableLegDepth,inset:e.tableLegInset,width:e.tableLegWidth},metalness:e.tableMetalness,position:[e.tablePosition.x,e.tablePosition.y,e.tablePosition.z],roughness:e.tableRoughness,thickness:e.tableThickness,wood:{barkThickness:e.tableWoodBarkThickness,cellScale:e.tableWoodCellScale,cellSize:e.tableWoodCellSize,centerSize:e.tableWoodCenterSize,clearcoat:e.tableWoodClearcoat,clearcoatRoughness:e.tableWoodClearcoatRoughness,darkGrainColor:e.tableWoodDarkGrainColor,fineWarpScale:e.tableWoodFineWarpScale,fineWarpStrength:e.tableWoodFineWarpStrength,finish:e.tableWoodFinish,grainOffset:[e.tableWoodGrainOffset.x,e.tableWoodGrainOffset.y,e.tableWoodGrainOffset.z],grainRotation:[e.tableWoodGrainRotation.x,e.tableWoodGrainRotation.y,e.tableWoodGrainRotation.z],grainScale:[e.tableWoodGrainScale.x,e.tableWoodGrainScale.y,e.tableWoodGrainScale.z],genus:e.tableWoodGenus,largeGrainStretch:e.tableWoodLargeGrainStretch,largeWarpScale:e.tableWoodLargeWarpScale,lightGrainColor:e.tableWoodLightGrainColor,ringBias:e.tableWoodRingBias,ringSizeVariance:e.tableWoodRingSizeVariance,ringThickness:e.tableWoodRingThickness,ringVarianceScale:e.tableWoodRingVarianceScale,smallWarpScale:e.tableWoodSmallWarpScale,smallWarpStrength:e.tableWoodSmallWarpStrength,splotchIntensity:e.tableWoodSplotchIntensity,splotchScale:e.tableWoodSplotchScale},width:e.tableWidth}),[e.tableDepth,e.tableLegDepth,e.tableLegInset,e.tableLegWidth,e.tableMetalness,e.tablePosition.x,e.tablePosition.y,e.tablePosition.z,e.tableRoughness,e.tableThickness,e.tableWoodBarkThickness,e.tableWoodCellScale,e.tableWoodCellSize,e.tableWoodCenterSize,e.tableWoodClearcoat,e.tableWoodClearcoatRoughness,e.tableWoodDarkGrainColor,e.tableWoodFineWarpScale,e.tableWoodFineWarpStrength,e.tableWoodFinish,e.tableWoodGenus,e.tableWoodGrainOffset.x,e.tableWoodGrainOffset.y,e.tableWoodGrainOffset.z,e.tableWoodGrainRotation.x,e.tableWoodGrainRotation.y,e.tableWoodGrainRotation.z,e.tableWoodGrainScale.x,e.tableWoodGrainScale.y,e.tableWoodGrainScale.z,e.tableWoodLargeGrainStretch,e.tableWoodLargeWarpScale,e.tableWoodLightGrainColor,e.tableWoodRingBias,e.tableWoodRingSizeVariance,e.tableWoodRingThickness,e.tableWoodRingVarianceScale,e.tableWoodSmallWarpScale,e.tableWoodSmallWarpStrength,e.tableWoodSplotchIntensity,e.tableWoodSplotchScale,e.tableWidth]),S=p.useMemo(()=>({escapeDistance:e.fishEscapeDistance,baseYOffset:e.fishBaseYOffset,bobAmplitude:e.fishBobAmplitude,count:e.fishCount,flopAmplitude:e.fishFlopAmplitude,markerColor:e.fishMarkerColor,markerSize:e.fishMarkerSize,radiusX:e.fishRadiusX,radiusZ:e.fishRadiusZ,scale:e.fishScale,speed:e.fishSpeed,strandLevel:e.fishStrandLevel,visible:e.fishVisible}),[e.fishEscapeDistance,e.fishBaseYOffset,e.fishBobAmplitude,e.fishCount,e.fishFlopAmplitude,e.fishMarkerColor,e.fishMarkerSize,e.fishRadiusX,e.fishRadiusZ,e.fishScale,e.fishSpeed,e.fishStrandLevel,e.fishVisible]),x=p.useMemo(()=>({gravity:e.rockGravity,scale:e.rockScale,speed:e.rockSpeed,spin:e.rockSpin}),[e.rockGravity,e.rockScale,e.rockSpeed,e.rockSpin]),y=p.useMemo(()=>({showFishMarkers:e.showFishMarkers,showRapierDebug:e.showRapierDebug,showTankBounds:e.showTankBounds,showWaterBounds:e.showWaterBounds}),[e.showFishMarkers,e.showRapierDebug,e.showTankBounds,e.showWaterBounds]);return{cameraConfig:l,cameraMode:e.cameraMode,debug:y,fish:S,operatorCamera:d,rocks:x,sceneEnvironment:u,table:m,tank:o,tankTransform:h}}const Ja=0;function at(){return Object.fromEntries(K.map(n=>[n,!1]))}function st(){return Object.fromEntries(K.map(n=>[n,{atSeconds:-1,id:0,point:[0,0,0],worldPoint:[0,0,0]}]))}function es(n){const t=p.useRef(n),i=p.useRef(at()),s=p.useRef(st()),r=p.useRef(0),a=p.useRef(n.waterLevel);p.useEffect(()=>{t.current=n,i.current=at(),s.current=st(),r.current+=1,a.current=n.waterLevel},[n.depth,n.drainRate,n.glassThickness,n.height,n.waterInset,n.waterLevel,n.width]),ie((l,u)=>{const d=K.reduce((h,o)=>h+(i.current[o]?1:0),0);d&&(a.current=Math.max(Ja,a.current-u*t.current.drainRate*d))});const e=p.useCallback((l,u,d)=>{if(!K.includes(l))return;const h=Array.isArray(u)?u:u?.toArray?.()??[0,0,0],o=Array.isArray(d)?d:d?.toArray?.()??h;i.current[l]=!0,s.current[l]={atSeconds:performance.now()/1e3,id:s.current[l].id+1,point:h,worldPoint:o}},[]),c=p.useCallback(()=>{i.current=at(),s.current=st(),r.current+=1,a.current=t.current.waterLevel},[]);return p.useMemo(()=>({breakPane:e,getPaneBreakEvent:l=>s.current[l]??null,getResetNonce:()=>r.current,getWaterLevel:()=>a.current,getBrokenPaneCount:()=>K.reduce((l,u)=>l+(i.current[u]?1:0),0),getFirstBrokenPane:()=>K.find(l=>i.current[l])||null,isAnyPaneBroken:()=>K.some(l=>i.current[l]),isFrontPaneBroken:()=>i.current.front,isPaneBroken:l=>!!i.current[l],resetRuntime:c}),[e,c])}const Pn=[18,.25,18],ts=[0,pe-Pn[1],0],ns=1/60;function xs(){const{cameraConfig:n,cameraMode:t,debug:i,fish:s,operatorCamera:r,rocks:a,sceneEnvironment:e,table:c,tank:l,tankTransform:u}=Qa(),d=p.useRef([]),h=es(l),o=p.useRef([]);return f.jsxs(f.Fragment,{children:[f.jsx(Pi,{cameraConfig:n,cameraMode:t,operatorCamera:r,sceneEnvironment:e}),f.jsxs(_n,{debug:i.showRapierDebug,interpolate:!0,timeStep:ns,children:[f.jsx(Te,{type:"fixed",colliders:!1,children:f.jsx(ye,{args:Pn,position:ts,friction:1.15,restitution:.04})}),f.jsx(Qi,{collisionMeshesRef:o,table:c,tank:l}),f.jsx(Ei,{fluidCouplersRef:d,runtime:h,table:c,tank:l}),f.jsxs("group",{position:u.position,rotation:u.rotation,scale:u.scale,children:[f.jsx(Ya,{debug:i,externalCollisionObjectsRef:o,fluidCouplersRef:d,rocks:a,runtime:h,tank:l}),f.jsx(li,{fish:s,runtime:h,tank:l,showMarkers:i.showFishMarkers})]})]})]})}export{xs as default};
